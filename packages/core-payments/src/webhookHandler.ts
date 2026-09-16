import { z } from 'zod';

import { resolveProduct } from '@acos/catalog';

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
        }),
      })
      .optional(),
  }),
});

export type WebhookEnvelope = z.infer<typeof webhookEnvelopeSchema>;

/** The one event this system acts on today. */
export const SUPPORTED_EVENTS = ['payment.captured'] as const;
export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

export type WebhookOutcome =
  | { status: 'processed'; eventId: string; event: string }
  | { status: 'duplicate'; eventId: string; event: string }
  /** Verified and well-formed, but not an event we act on. Still recorded. */
  | { status: 'ignored'; eventId: string; event: string; reason: 'unsupported-event' }
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
}

export interface WebhookHandlerDeps {
  /** Runs `fn` inside ONE database transaction. Rolls back if it throws. */
  transaction<T>(fn: (tx: WebhookTx) => Promise<T>): Promise<T>;
  /** Stable Meta event id from a payment id. Injected to stay pure. */
  buildMetaEventId(paymentId: string): string;
  /** Razorpay's own event id, from the X-Razorpay-Event-Id header. */
  eventId: string;
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

    if (!isSupported(body.event) || entity === null) {
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
    return { status: 'processed', eventId: deps.eventId, event: body.event };
  });
}

function isSupported(event: string): event is SupportedEvent {
  return (SUPPORTED_EVENTS as readonly string[]).includes(event);
}
