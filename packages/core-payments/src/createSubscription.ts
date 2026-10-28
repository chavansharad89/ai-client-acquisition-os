import { resolveProduct } from '@acos/catalog';

import { CreateSubscriptionValidationError, RazorpaySubscriptionCreationError, SubscriptionNotConfiguredError } from './errors';
import type { RazorpaySubscriptionsClient } from './razorpayClient';
import { createSubscriptionRequestSchema } from './schemas';

// createSubscription — the orchestration for
// POST /api/payments/create-subscription (plan §H.3 item 2, §J).
// -----------------------------------------------------------------------
// Mirrors createOrder.ts's shape: Zod validates shape only, the catalog
// (resolveProduct) is the sole source of the product's identity/display
// price, and NOTHING in this function accepts a client-supplied amount.
//
// REQUIRES AN AUTHENTICATED SESSION, unlike createOrder.ts's guest-or-
// session convention -- an IMPLEMENTATION-ONLY ENGINEERING DECISION, not
// a new commercial policy (it decides who may click "Subscribe", not
// price/duration/eligibility/access rights/refund policy). This follows
// directly from the data model migration 0040 already fixes:
// `subscription_periods.user_id` is NOT NULL, unlike `entitlements.user_id`
// (nullable, claimed later via claim_tokens) -- so a subscription period
// cannot be created without a real user_id at the moment of the
// activating webhook. Client Finder itself is already entirely
// session-gated (apps/web/src/server/clientFinderRepositories.ts;
// searches/opportunities routes all require a session token), so a
// visitor reaching the "Subscribe" action is already expected to be
// signed in regardless of this decision. `userId` is passed through
// into Razorpay's `notes.userId` so the `subscription.charged` webhook
// (packages/core-payments' webhookHandler.ts) can attribute the
// resulting subscription_periods row without a separate email-to-user
// lookup.
//
// IMPORTANT, DOCUMENTED LIMITATION (implementation-only assumption,
// flagged per the authorization's §16/§18): unlike createOrder.ts, this
// function has NO local persisted row to check an Idempotency-Key
// against before calling the provider. createOrder.ts's idempotency
// works because `orders` already exists as a table with a unique
// `idempotency_key` column; no equivalent "pending subscription
// checkout" table is part of Revision 5's migration plan (§E) --
// subscription_periods is deliberately created ONLY by the
// `subscription.charged` webhook (IRL-A), never by this function. A
// double-submitted create-subscription request (e.g. a double-clicked
// "Subscribe" button, or a client retry before any response arrives)
// can therefore create two Razorpay Subscription objects. This is
// bounded, not silently dangerous: no DB row and no access is granted
// by this function itself -- access is granted only once per captured
// charge, atomically and idempotently, by the webhook handler's own
// `razorpay_payment_id` unique constraint (migration 0040). A user who
// completes checkout twice would be charged twice by Razorpay, which is
// a real (if narrow) risk worth surfacing, not a correctness bug in the
// access-control model. `idempotencyKey` is still accepted and forwarded
// into Razorpay's `notes` for traceability, per plan §J, but is NOT
// enforced as a server-side dedupe key here. True request-level
// idempotency would require either a new tracking table (out of
// Revision 5's authorized migration scope) or a verified Razorpay-side
// idempotency mechanism for the Subscriptions API (RAZORPAY
// VERIFICATION REQUIRED, plan §Q.4) -- neither is invented here.
// -----------------------------------------------------------------------

export const CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID = 'ai_client_acquisition_1499_subscription' as const;

export interface CreateSubscriptionDeps {
  razorpay: RazorpaySubscriptionsClient;
}

export interface CreateSubscriptionOptions {
  /** Server-derived from the caller's session — never client-supplied. See this file's header for why a subscription requires one. */
  userId: string;
  razorpayKeyId: string;
  /** From RAZORPAY_SUBSCRIPTION_PLAN_ID. Undefined when the operator has not yet created the Razorpay Plan (plan §H.3 item 1). */
  razorpayPlanId: string | undefined;
  /**
   * Number of billing cycles Razorpay will attempt. ENGINEERING CHOICE,
   * NOT A PO DECISION (duration/validity itself remains governed
   * entirely by subscription_periods.duration_days, computed
   * independently of this count — see IRL-O/§D): chosen large enough
   * that it does not functionally cap how long a subscriber can keep
   * renewing under ordinary use, while still being a bounded, finite
   * value Razorpay's API accepts. Exact Razorpay API behavior for this
   * field is RAZORPAY VERIFICATION REQUIRED (plan §Q.4) -- this default
   * may need adjustment once verified against a real Razorpay Plan.
   */
  totalCount?: number;
  /** From the `Idempotency-Key` request header, forwarded into Razorpay's `notes` for traceability only — see this file's header for why it is not enforced as a server-side dedupe key. */
  idempotencyKey?: string;
}

export interface SafeSubscriptionCheckoutInfo {
  razorpaySubscriptionId: string;
  razorpayKeyId: string;
  productId: string;
  productName: string;
  /** Razorpay's hosted checkout page for this subscription, when provided. */
  shortUrl: string | null;
  status: string;
}

const DEFAULT_TOTAL_COUNT = 120;

export async function createSubscription(
  rawInput: unknown,
  options: CreateSubscriptionOptions,
  deps: CreateSubscriptionDeps,
): Promise<SafeSubscriptionCheckoutInfo> {
  const parsed = createSubscriptionRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CreateSubscriptionValidationError(parsed.error);
  }
  const input = parsed.data;

  if (!options.razorpayPlanId) {
    throw new SubscriptionNotConfiguredError();
  }

  // Confirms the catalog entry exists and gives the response a display
  // name — the authoritative RECURRING amount is the Razorpay Plan
  // itself (external config), not anything read from this catalog entry
  // at request time, since the catalog has no recurrence/interval field
  // (packages/catalog/src/types.ts).
  const product = resolveProduct(CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID);

  let subscription;
  try {
    subscription = await deps.razorpay.createSubscription({
      planId: options.razorpayPlanId,
      customerNotify: true,
      totalCount: options.totalCount ?? DEFAULT_TOTAL_COUNT,
      notes: {
        // userId is the ONLY field the subscription.charged webhook
        // actually relies on, to attribute the resulting
        // subscription_periods row (see this file's header). The rest
        // are for display/support traceability only.
        userId: options.userId,
        productId: product.id,
        customerEmail: input.customerEmail,
        ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}),
        ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
      },
    });
  } catch (cause) {
    if (cause instanceof RazorpaySubscriptionCreationError) throw cause;
    throw new RazorpaySubscriptionCreationError('Razorpay subscription creation failed', cause);
  }

  return {
    razorpaySubscriptionId: subscription.razorpaySubscriptionId,
    razorpayKeyId: options.razorpayKeyId,
    productId: product.id,
    productName: product.name,
    shortUrl: subscription.shortUrl,
    status: subscription.status,
  };
}
