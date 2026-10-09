import { resolveProduct } from '@acos/catalog';
import { z } from 'zod';


import type { VerifiedWebhook, WebhookRejection } from './webhook';

// Webhook processing, downstream of the trust boundary.
// -----------------------------------------------------------------------
// Everything here runs only on bytes whose HMAC already matched. The
// ordering the file enforces:
//
//   verified bytes -> JSON.parse -> schema -> ONE transaction:
//       insert webhook_event (unique on razorpay_event_id = the dedupe)
//       -> upsert payment -> grant entitlement -> enqueue meta event
//
// The dedupe is the unique index, not a SELECT-then-INSERT. Two workers
// or two Razorpay retries racing the same event both attempt the insert;
// exactly one wins and the loser is told by the database, which is the
// only version of this that is correct under concurrency.
//
// Transactionality is the caller's to provide (`deps.transaction`), and
// it matters: a payment row without its entitlement is a customer who
// paid and got nothing, and an entitlement without its payment is the
// reverse. Either half alone is worse than neither.
// -----------------------------------------------------------------------

/** Razorpay's envelope, narrowed to the fields this system acts on. */
const webhookEnvelopeSchema = z.object({
  event: z.string().trim().min(1).max(120),
  payload: z.object({
    payment: z
      .object({
        entity: z.object({
          id: z.string().trim().min(1).max(120),
          order_id: z.string().trim().min(1).max(120),
          amount: z.number().int().nonnegative(),
          currency: z.string().trim().min(1).max(8),
          status: z.string().trim().min(1).max(40),
          // Razorpay sets this on every payment captured against a
          // Subscription (its own order_id in that case is an
          // internally-generated per-cycle order this system never
          // created via create-order.ts, not a lookup miss) and leaves
          // it null for a one-time order's payment. The standalone
          // `payment.captured` delivery for a subscription cycle is
          // otherwise indistinguishable from the one-time flow's —
          // `subscription.charged` (handled separately, above) is this
          // system's sole source of truth for subscription activation.
          invoice_id: z.string().trim().min(1).max(120).nullable().optional(),
        }),
      })
      .optional(),
    // Refund processing (B-6), authorized under
    // CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
    // payment_id, not order_id: Razorpay refunds reference the payment
    // they refund, not the order — findPaymentByRazorpayPaymentId below
    // is how this handler recovers the order from it.
    refund: z
      .object({
        entity: z.object({
          id: z.string().trim().min(1).max(120),
          payment_id: z.string().trim().min(1).max(120),
          amount: z.number().int().nonnegative(),
          currency: z.string().trim().min(1).max(8),
          status: z.string().trim().min(1).max(40),
        }),
      })
      .optional(),
    // ₹1,499 Client Finder SUBSCRIPTION (`subscription.charged`,
    // authorized under
    // CLIENT-FINDER-1499-SUBSCRIPTION-ACCESS-MODEL-PO-DEC-002 and
    // requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md
    // Revision 5 §H.2a). Shape confirmed against Razorpay's own
    // published sample payload for this event (razorpay.com/docs/
    // webhooks/subscriptions) -- `notes` carries whatever
    // createSubscription.ts set at subscription-creation time,
    // specifically `userId`, the only field this handler reads from it.
    subscription: z
      .object({
        entity: z.object({
          id: z.string().trim().min(1).max(120),
          status: z.string().trim().min(1).max(40),
          notes: z.union([z.record(z.string()), z.array(z.unknown())]).optional(),
        }),
      })
      .optional(),
  }),
});

export type WebhookEnvelope = z.infer<typeof webhookEnvelopeSchema>;

/**
 * Payment confirmation, refund processing (B-6), plus `subscription.charged`
 * (₹1,499 Client Finder subscription, plan §H.2a) -- the ONE recurring
 * event this system acts on. Every OTHER subscription.* event (paused,
 * resumed, halted, completed, cancelled, authenticated, pending,
 * activated, updated) is deliberately left out of this list: per IRL-O,
 * access is computed from this system's own `subscription_periods` rows,
 * never from Razorpay's live subscription status, so none of those
 * provider-lifecycle events need a handler branch (plan §H.2b) -- they
 * fall through to the existing generic "acknowledged, not acted on"
 * path below, unchanged.
 */
export const SUPPORTED_EVENTS = [
  'payment.captured',
  'refund.created',
  'refund.processed',
  'subscription.charged',
] as const;
export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

export type WebhookOutcome =
  | {
      status: 'processed';
      eventId: string;
      event: string;
      /**
       * Present only when this event granted an entitlement
       * (payment.captured) — the order to issue a DEC-014 claim link
       * for. Absent for a refund event, which grants nothing.
       */
      grantedEntitlement?: { orderId: string; customerEmail: string };
    }
  | { status: 'duplicate'; eventId: string; event: string }
  /** Verified and well-formed, but not an event we act on. Still recorded. */
  | {
      status: 'ignored';
      eventId: string;
      event: string;
      reason: 'unsupported-event' | 'subscription-payment';
    }
  /** Verified bytes that were not the JSON we expect. Recorded as a rejection. */
  | { status: 'rejected'; rejection: WebhookRejection };

export class WebhookPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookPayloadError';
  }
}

/** A transaction handle: every write below goes through one of these. */
export interface WebhookTx {
  /** Inserts the verified event. Returns false when the id already exists. */
  insertWebhookEvent(input: {
    razorpayEventId: string;
    eventName: string;
    orderId: string | null;
    payload: unknown;
    receivedAt: Date;
  }): Promise<boolean>;

  /** The order this payment claims to belong to, or null. */
  findOrderByRazorpayOrderId(razorpayOrderId: string): Promise<{
    id: string;
    customerEmail: string;
    productSlug: string;
    amountPaise: number;
    currency: string;
  } | null>;

  upsertCapturedPayment(input: {
    razorpayPaymentId: string;
    orderId: string;
    amountPaise: number;
    currency: string;
  }): Promise<void>;

  markOrderPaid(orderId: string): Promise<void>;

  grantEntitlement(input: {
    customerEmail: string;
    productSlug: string;
    orderId: string;
  }): Promise<void>;

  enqueueMetaPurchase(input: {
    metaEventId: string;
    orderId: string;
    product: string;
    valuePaise: number;
    currency: string;
  }): Promise<void>;

  markWebhookProcessed(razorpayEventId: string, at: Date): Promise<void>;

  /** The payment a refund webhook's payment_id refers to, or null. */
  findPaymentByRazorpayPaymentId(razorpayPaymentId: string): Promise<{
    id: string;
    orderId: string;
    amountPaise: number;
  } | null>;

  /** Inserts the refund ledger row (B-6). Returns false when the refund id already exists. */
  insertRefundEvent(input: {
    razorpayRefundId: string;
    orderId: string;
    paymentId: string;
    amountPaise: number;
    currency: string;
    refundType: 'FULL' | 'PARTIAL';
    status: string;
    occurredAt: Date;
  }): Promise<boolean>;

  /**
   * Creates one ₹1,499 Client Finder subscription_periods row (IRL-A:
   * activation on the first captured charge; IRL-C: a later charge on
   * the same razorpaySubscriptionId creates its own independent row).
   * Returns false when `razorpayPaymentId` already has a row (migration
   * 0040's unique index) -- the idempotency anchor for this whole branch.
   */
  insertSubscriptionPeriod(input: {
    userId: string;
    productSlug: string;
    razorpaySubscriptionId: string;
    razorpayPaymentId: string;
    activationAt: Date;
    durationDays: number;
  }): Promise<boolean>;

  /**
   * Sets `refunded_at` (IRL-N) on the subscription_periods row whose
   * `razorpay_payment_id` matches, if one exists -- idempotently: a
   * second call (e.g. refund.created then refund.processed for the same
   * refund) never overwrites the original timestamp. Returns false only
   * when NO such row exists at all (the refunded payment belongs to the
   * one-time-order flow instead) -- callers use that, not whether this
   * was the first call, to decide whether to fall through to the
   * existing one-time refund handling.
   */
  markSubscriptionPeriodRefundedByPaymentId(razorpayPaymentId: string, at: Date): Promise<boolean>;
}

export interface WebhookHandlerDeps {
  /** Runs `fn` inside ONE database transaction. Rolls back if it throws. */
  transaction<T>(fn: (tx: WebhookTx) => Promise<T>): Promise<T>;
  /** Stable Meta event id from a payment id. Injected to stay pure. */
  buildMetaEventId(paymentId: string): string;
  /** Razorpay's own event id, from the X-Razorpay-Event-Id header. */
  eventId: string;
  /**
   * `CLIENT_FINDER_SUBSCRIPTION_DURATION_DAYS` (default 30) — snapshotted
   * onto each new subscription_periods row at activation (PO-D10/IRL-P).
   * Injected rather than read from `process.env` here: this package
   * never calls `loadEnv()` itself (apps/web/apps/worker own that), the
   * same reason `buildMetaEventId` above is injected rather than
   * imported directly.
   */
  clientFinderSubscriptionDurationDays: number;
}

/**
 * Processes a VERIFIED webhook.
 *
 * The parameter type is the enforcement: `VerifiedWebhook` is branded and
 * only `verifyRazorpayWebhook` can produce one, so this function cannot
 * be reached with an unverified body. Parsing happens here — after
 * verification — and never before.
 */
export async function handleRazorpayWebhook(
  verified: VerifiedWebhook,
  deps: WebhookHandlerDeps,
): Promise<WebhookOutcome> {
  // Safe to parse now, and only now: these bytes carry a signature that
  // matched our secret, so they came from Razorpay.
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(verified.rawBody.toString('utf8'));
  } catch {
    // A correctly-signed body that is not JSON means our secret is held
    // by something sending us nonsense — worth recording, and nothing is
    // persisted from it beyond the reason.
    return {
      status: 'rejected',
      rejection: {
        reason: 'malformed-signature',
        receivedAt: verified.receivedAt,
        bodyBytes: verified.rawBody.byteLength,
        signaturePresent: true,
        signatureWellFormed: true,
      },
    };
  }

  const envelope = webhookEnvelopeSchema.safeParse(parsedJson);
  if (!envelope.success) {
    return {
      status: 'rejected',
      rejection: {
        reason: 'malformed-signature',
        receivedAt: verified.receivedAt,
        bodyBytes: verified.rawBody.byteLength,
        signaturePresent: true,
        signatureWellFormed: true,
      },
    };
  }

  const body = envelope.data;
  const entity = body.payload.payment?.entity ?? null;
  const refundEntity = body.payload.refund?.entity ?? null;
  const subscriptionEntity = body.payload.subscription?.entity ?? null;

  return deps.transaction(async (tx) => {
    // The dedupe. A unique index on razorpay_event_id decides the winner;
    // a SELECT-then-INSERT would let two concurrent retries both pass the
    // check and both process the payment.
    const inserted = await tx.insertWebhookEvent({
      razorpayEventId: deps.eventId,
      eventName: body.event,
      orderId: null,
      payload: parsedJson,
      receivedAt: verified.receivedAt,
    });
    if (!inserted) {
      return { status: 'duplicate', eventId: deps.eventId, event: body.event };
    }

    if (
      !isSupported(body.event) ||
      (entity === null && refundEntity === null && subscriptionEntity === null)
    ) {
      // Recorded, acknowledged, not acted on. Razorpay sends events this
      // system has no opinion about; 200-ing them without processing is
      // correct, and storing them keeps the audit trail complete.
      await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
      return {
        status: 'ignored',
        eventId: deps.eventId,
        event: body.event,
        reason: 'unsupported-event',
      };
    }

    // ₹1,499 Client Finder SUBSCRIPTION activation/renewal (plan §H.2a)
    // — a disjoint path from everything below, discriminated by event
    // name (Razorpay's own sample payload for this event always carries
    // BOTH `payload.subscription.entity` and `payload.payment.entity`
    // together). IRL-A: the FIRST `subscription.charged` for a given
    // razorpaySubscriptionId is activation; IRL-C: every later one is an
    // independent renewal period. `razorpayPaymentId` (migration 0040's
    // unique index) is the idempotency anchor — a retried delivery of
    // the SAME charge event hits it and inserts nothing a second time,
    // the identical self-heal idiom the rest of this file already uses.
    if (body.event === 'subscription.charged') {
      if (subscriptionEntity === null || entity === null) {
        throw new WebhookPayloadError(
          'subscription.charged webhook is missing its subscription or payment entity',
        );
      }
      const notes = subscriptionEntity.notes;
      const userId =
        notes !== undefined && !Array.isArray(notes) && typeof notes.userId === 'string'
          ? notes.userId
          : null;
      if (!userId) {
        // createSubscription.ts always sets notes.userId (see its own
        // header) — a webhook missing it did not originate from this
        // application's own create-subscription call. Throwing rolls
        // back the webhook row too, so it is not recorded as handled.
        throw new WebhookPayloadError(
          `subscription.charged webhook for razorpay subscription ${subscriptionEntity.id} carries no attributable userId in notes`,
        );
      }

      await tx.insertSubscriptionPeriod({
        userId,
        productSlug: 'ai_client_acquisition_1499_subscription',
        razorpaySubscriptionId: subscriptionEntity.id,
        razorpayPaymentId: entity.id,
        activationAt: verified.receivedAt,
        durationDays: deps.clientFinderSubscriptionDurationDays,
      });
      await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
      return { status: 'processed', eventId: deps.eventId, event: body.event };
    }

    // Refund processing (B-6) — a disjoint path from payment.captured
    // below: the dedupe above already happened, so this only needs to
    // recover the order from the refunded payment and append the ledger
    // row. refund_events' own unique index (razorpay_refund_id) is a
    // SECOND, independent dedupe — this webhook_events dedupe guards
    // against the whole event being retried; that one guards against two
    // different webhook deliveries (e.g. refund.created AND
    // refund.processed for the same refund) both trying to record it.
    if (refundEntity !== null && (body.event === 'refund.created' || body.event === 'refund.processed')) {
      // ₹1,499 Client Finder SUBSCRIPTION refund (plan §H.2a, IRL-N) —
      // tried FIRST and independently of the one-time-order refund flow
      // below: a given razorpay_payment_id belongs to at most one of
      // `subscription_periods`/`payments`, by construction (only
      // `subscription.charged` ever writes the former; only
      // `payment.captured` the latter). Idempotent by construction too
      // — `refunded_at IS NULL` in the underlying UPDATE's WHERE clause
      // (subscriptionPeriodRepository's write side) means a second
      // delivery (refund.created then refund.processed for the same
      // refund) simply updates zero rows the second time; no separate
      // ledger row is needed the way the one-time flow's refund_events
      // table is.
      const markedSubscriptionPeriod = await tx.markSubscriptionPeriodRefundedByPaymentId(
        refundEntity.payment_id,
        verified.receivedAt,
      );
      if (markedSubscriptionPeriod) {
        await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
        return { status: 'processed', eventId: deps.eventId, event: body.event };
      }

      const payment = await tx.findPaymentByRazorpayPaymentId(refundEntity.payment_id);
      if (!payment) {
        throw new WebhookPayloadError(
          `refund webhook references unknown razorpay payment ${refundEntity.payment_id}`,
        );
      }
      // FULL vs PARTIAL is classification only (B-6) — gate math (PCG-5)
      // treats every refund as the same binary "had a refund" fact at
      // the query layer, not here.
      const refundType = refundEntity.amount >= payment.amountPaise ? 'FULL' : 'PARTIAL';
      await tx.insertRefundEvent({
        razorpayRefundId: refundEntity.id,
        orderId: payment.orderId,
        paymentId: payment.id,
        amountPaise: refundEntity.amount,
        currency: refundEntity.currency,
        refundType,
        status: refundEntity.status,
        occurredAt: verified.receivedAt,
      });
      await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
      return { status: 'processed', eventId: deps.eventId, event: body.event };
    }

    if (entity === null) {
      await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
      return {
        status: 'ignored',
        eventId: deps.eventId,
        event: body.event,
        reason: 'unsupported-event',
      };
    }

    if (entity.invoice_id) {
      // A standalone payment.captured for a Subscription charge — the
      // SAME underlying payment subscription.charged already recorded
      // via insertSubscriptionPeriod, above. Nothing to do here.
      await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
      return {
        status: 'ignored',
        eventId: deps.eventId,
        event: body.event,
        reason: 'subscription-payment',
      };
    }

    const order = await tx.findOrderByRazorpayOrderId(entity.order_id);
    if (!order) {
      // Signed by Razorpay, but for an order this system never created.
      // Throwing rolls back the webhook row too, so the event is not
      // recorded as handled and can be retried once the cause is known.
      throw new WebhookPayloadError(
        `webhook references unknown razorpay order ${entity.order_id}`,
      );
    }

    // The amount is NOT taken from the payload. It comes from the order,
    // which took it from the catalog. A webhook claiming a different
    // amount is rejected by migration 0003's payments_match_order trigger
    // anyway; not reading it here means we never even try.
    await tx.upsertCapturedPayment({
      razorpayPaymentId: entity.id,
      orderId: order.id,
      amountPaise: order.amountPaise,
      currency: order.currency,
    });
    await tx.markOrderPaid(order.id);

    // resolveProduct throws for a slug the catalog does not know, which
    // rolls the whole transaction back rather than granting access to
    // something that does not exist.
    const product = resolveProduct(order.productSlug);

    await tx.grantEntitlement({
      customerEmail: order.customerEmail,
      productSlug: product.id,
      orderId: order.id,
    });

    await tx.enqueueMetaPurchase({
      metaEventId: deps.buildMetaEventId(entity.id),
      orderId: order.id,
      product: product.id,
      valuePaise: order.amountPaise,
      currency: order.currency,
    });

    await tx.markWebhookProcessed(deps.eventId, verified.receivedAt);
    return {
      status: 'processed',
      eventId: deps.eventId,
      event: body.event,
      grantedEntitlement: { orderId: order.id, customerEmail: order.customerEmail },
    };
  });
}

function isSupported(event: string): event is SupportedEvent {
  return (SUPPORTED_EVENTS as readonly string[]).includes(event);
}
