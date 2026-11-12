import type { ProductId } from '@acos/catalog';

/** Exactly what POST /api/payments/create-order returns on success. */
export interface OrderPaymentInfo {
  orderId: string;
  razorpayOrderId: string;
  /** Razorpay's PUBLIC key id. Safe in the browser; not a secret. */
  razorpayKeyId: string;
  amountPaise: number;
  currency: string;
  productId: string;
  productName: string;
  status: string;
}

/**
 * The request body the browser is allowed to send.
 *
 * There is no amount, price or currency field, and there never may be —
 * the API rejects a body carrying one outright (`.strict()` on the server
 * schema). The browser names WHAT it wants to buy; the server decides
 * what that costs.
 */
export interface CreateOrderRequest {
  productId: ProductId;
  customerEmail: string;
  customerPhone?: string;
}

/**
 * Exactly what POST /api/payments/create-subscription returns on success.
 * No `productId` on the wire — there is exactly one subscription SKU, so
 * create-subscription's own request schema takes none (see
 * `@acos/core-payments`'s `createSubscriptionRequestSchema`). `productId`
 * here is only the catalog id echoed back for display/analytics.
 */
export interface SubscriptionPaymentInfo {
  razorpaySubscriptionId: string;
  razorpayKeyId: string;
  productId: string;
  productName: string;
  shortUrl: string | null;
  status: string;
}

/** The request body the browser is allowed to send to create-subscription. */
export interface CreateSubscriptionRequest {
  customerEmail: string;
  customerPhone?: string;
}

/**
 * What the checkout machine actually carries through its phases — either
 * a one-time order or a subscription checkout, depending on which SKU was
 * bought. The reducer itself never inspects which; it only forwards it.
 */
export type CheckoutPaymentInfo = OrderPaymentInfo | SubscriptionPaymentInfo;

/** True for the subscription SKU's payment info; false for a one-time order. */
export function isSubscriptionPaymentInfo(
  payment: CheckoutPaymentInfo,
): payment is SubscriptionPaymentInfo {
  return 'razorpaySubscriptionId' in payment;
}

/**
 * The one recurring SKU in the catalog — compared by literal id rather
 * than importing `@acos/core-payments`' own
 * `CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID`: that package also exports
 * server-only Razorpay/webhook/DB code the browser bundle must never pull
 * in. Centralized here (not re-declared per call site) so CheckoutPanel's
 * routing decision — create-order vs. create-subscription — is a single,
 * directly testable fact.
 */
export const CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID: ProductId =
  'ai_client_acquisition_1499_subscription';

/** True for the one SKU that must checkout via create-subscription, not create-order. */
export function isSubscriptionProduct(productId: ProductId): boolean {
  return productId === CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID;
}

export type CheckoutFailure =
  | 'validation' // the details we sent were rejected
  | 'product' // the product id is not sellable
  | 'provider' // Razorpay could not create or process the order
  | 'auth' // create-subscription requires a logged-in session
  | 'network' // the request never completed
  | 'server'; // anything else

export interface CheckoutError {
  kind: CheckoutFailure;
  /** Shown to the person. Written to be actionable, never to blame them. */
  message: string;
}

/**
 * Checkout phases.
 *
 * `confirming` is the important one: Razorpay has told the BROWSER the
 * payment succeeded, and we deliberately do not treat that as truth. The
 * order is confirmed only when the signed webhook reaches the server, so
 * this phase says "we've got it, we're confirming" and unlocks nothing.
 */
export type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'creating' }
  | { phase: 'opening'; order: CheckoutPaymentInfo }
  | { phase: 'confirming'; order: CheckoutPaymentInfo }
  | { phase: 'dismissed'; order: CheckoutPaymentInfo }
  | { phase: 'failed'; error: CheckoutError; order?: CheckoutPaymentInfo };

export type CheckoutEvent =
  | { type: 'SUBMIT' }
  | { type: 'ORDER_CREATED'; order: CheckoutPaymentInfo }
  | { type: 'ORDER_FAILED'; error: CheckoutError }
  | { type: 'CHECKOUT_OPENED' }
  | { type: 'PAYMENT_SUBMITTED' }
  | { type: 'CHECKOUT_DISMISSED' }
  | { type: 'PAYMENT_FAILED'; error: CheckoutError }
  | { type: 'RETRY' };
