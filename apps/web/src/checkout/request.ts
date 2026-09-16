import { isValidProductId } from '@acos/catalog';

import type { CheckoutError, CreateOrderRequest, OrderPaymentInfo } from './types';

// The one place the browser talks to the order API.
// -----------------------------------------------------------------------
// `buildCreateOrderRequest` constructs the body by listing fields
// explicitly rather than spreading caller input, so no amount, price or
// currency can reach the wire even if a caller passes one. The server
// would reject it anyway (`.strict()`), but a request that never contains
// a price cannot be misread as an attempt to set one.
// -----------------------------------------------------------------------

export const CREATE_ORDER_ENDPOINT = '/api/payments/create-order';

export interface BuildRequestInput {
  productId: string;
  customerEmail: string;
  customerPhone?: string;
}

export class UnsellableProductError extends Error {
  constructor(productId: string) {
    super(`Unknown product: ${productId}`);
    this.name = 'UnsellableProductError';
  }
}

export function buildCreateOrderRequest(input: BuildRequestInput): CreateOrderRequest {
  if (!isValidProductId(input.productId)) {
    throw new UnsellableProductError(input.productId);
  }
  const phone = input.customerPhone?.trim();
  return {
    productId: input.productId,
    customerEmail: input.customerEmail.trim(),
    ...(phone ? { customerPhone: phone } : {}),
  };
}

/** Maps a failed response to a message a person can act on. */
export function toCheckoutError(status: number, code?: string): CheckoutError {
  if (status === 400 && code === 'INVALID_PRODUCT') {
    return { kind: 'product', message: 'That product is no longer available.' };
  }
  if (status === 400) {
    return {
      kind: 'validation',
      message: 'Check the email address and phone number, then try again.',
    };
  }
  if (status === 502) {
    return {
      kind: 'provider',
      message: 'Our payment provider is not responding. Try again in a moment.',
    };
  }
  return { kind: 'server', message: 'Something went wrong on our side. Try again in a moment.' };
}

export const NETWORK_ERROR: CheckoutError = {
  kind: 'network',
  message: "We couldn't reach the server. Check your connection and try again.",
};

/**
 * A fresh idempotency key per checkout attempt, so a retried network
 * request returns the original order instead of creating a second one.
 */
export function newIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}

export interface CreateOrderResult {
  ok: true;
  order: OrderPaymentInfo;
}
export interface CreateOrderFailure {
  ok: false;
  error: CheckoutError;
}

export async function createOrderRequest(
  body: CreateOrderRequest,
  idempotencyKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CreateOrderResult | CreateOrderFailure> {
  let response: Response;
  try {
    response = await fetchImpl(CREATE_ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: toCheckoutError(response.status) };
  }

  if (!response.ok) {
    const code = (payload as { code?: string } | null)?.code;
    return { ok: false, error: toCheckoutError(response.status, code) };
  }
  return { ok: true, order: payload as OrderPaymentInfo };
}
