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

export type CheckoutFailure =
  | 'validation' // the details we sent were rejected
  | 'product' // the product id is not sellable
  | 'provider' // Razorpay could not create or process the order
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
  | { phase: 'opening'; order: OrderPaymentInfo }
  | { phase: 'confirming'; order: OrderPaymentInfo }
  | { phase: 'dismissed'; order: OrderPaymentInfo }
  | { phase: 'failed'; error: CheckoutError; order?: OrderPaymentInfo };

export type CheckoutEvent =
  | { type: 'SUBMIT' }
  | { type: 'ORDER_CREATED'; order: OrderPaymentInfo }
  | { type: 'ORDER_FAILED'; error: CheckoutError }
  | { type: 'CHECKOUT_OPENED' }
  | { type: 'PAYMENT_SUBMITTED' }
  | { type: 'CHECKOUT_DISMISSED' }
  | { type: 'PAYMENT_FAILED'; error: CheckoutError }
  | { type: 'RETRY' };
