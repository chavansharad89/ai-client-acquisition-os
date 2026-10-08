import { resolveProduct } from '@acos/catalog';

import type { RazorpayOrdersClient } from './razorpayClient';
import type { WebhookTx } from './webhookHandler';

// Payment/webhook reconciliation.
// -----------------------------------------------------------------------
// Covers the case the webhook boundary (webhookHandler.ts) cannot: a
// payment Razorpay actually captured, whose webhook never arrived, was
// delayed past the point a customer gave up waiting, or was lost. This
// file does not duplicate the webhook's trust model — there is no HMAC
// here to verify, because nothing arrived unsolicited; instead, this
// system asks Razorpay directly, using the same API credentials that
// created the order, which is the trust boundary: only a party holding
// the account's own keys can ask Razorpay "what happened to this order".
//
// IDEMPOTENCY IS NOT REINVENTED HERE. `tx.upsertCapturedPayment` is
// idempotent on razorpay_payment_id (ON CONFLICT DO NOTHING) and
// `tx.grantEntitlement` is idempotent on (customer_email, product_slug) —
// both already true of the webhook path. Reconciliation calls the exact
// same WebhookTx methods the webhook handler does, so it does not matter
// which of (webhook, reconciliation) reaches a given order first: the
// second arrival is a safe no-op, enforced by the database, not by any
// coordination between this file and webhookHandler.ts.
// -----------------------------------------------------------------------

export type ReconciliationOutcome =
  | { status: 'reconciled'; razorpayPaymentId: string }
  | { status: 'still-pending' }
  | { status: 'order-not-eligible' };

export interface OrderToReconcile {
  id: string;
  razorpayOrderId: string;
  customerEmail: string;
  productSlug: string;
  amountPaise: number;
  currency: string;
  status: string;
}

export interface ReconcileOrderDeps {
  razorpay: RazorpayOrdersClient;
  transaction<T>(fn: (tx: WebhookTx) => Promise<T>): Promise<T>;
  buildMetaEventId: (paymentId: string) => string;
}

/**
 * Checks ONE order against Razorpay and, if a captured payment is found
 * that our own database has not yet recorded, replays the same grant
 * sequence the webhook would have run.
 *
 * Read-only against Razorpay (fetchPayments), write-only against our own
 * database inside one transaction — same shape as handleRazorpayWebhook,
 * deliberately.
 */
export async function reconcileOrder(
  order: OrderToReconcile,
  deps: ReconcileOrderDeps,
): Promise<ReconciliationOutcome> {
  if (order.status !== 'PENDING' && order.status !== 'ATTEMPTED') {
    return { status: 'order-not-eligible' };
  }

  const payments = await deps.razorpay.fetchPayments(order.razorpayOrderId);
  const captured = payments.find((p) => p.status === 'captured');
  if (!captured) {
    return { status: 'still-pending' };
  }

  const product = resolveProduct(order.productSlug);

  await deps.transaction(async (tx) => {
    // Amount/currency come from the ORDER, never from Razorpay's
    // response, for the same reason the webhook handler never reads them
    // from the payload: migration 0003's trigger is the actual guard,
    // this is just not fighting it.
    await tx.upsertCapturedPayment({
      razorpayPaymentId: captured.razorpayPaymentId,
      orderId: order.id,
      amountPaise: order.amountPaise,
      currency: order.currency,
    });
    await tx.markOrderPaid(order.id);
    await tx.grantEntitlement({
      customerEmail: order.customerEmail,
      productSlug: product.id,
      orderId: order.id,
    });
    await tx.enqueueMetaPurchase({
      metaEventId: deps.buildMetaEventId(captured.razorpayPaymentId),
      orderId: order.id,
      product: product.id,
      valuePaise: order.amountPaise,
      currency: order.currency,
    });
  });

  return { status: 'reconciled', razorpayPaymentId: captured.razorpayPaymentId };
}
