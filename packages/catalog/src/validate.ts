import { InvalidProductIdError } from './errors';
import { PRODUCT_CATALOG } from './products';
import type { Product, ProductId } from './types';

// -----------------------------------------------------------------------
// Server-side validation boundary.
//
// Every value arriving from outside this process (an HTTP request body,
// a query param, a webhook payload's metadata) is `unknown`/`string` as
// far as the type system is concerned, no matter what the client claims
// it is. `resolveProduct` is the ONLY sanctioned way to turn such a
// value into a trusted `Product` — and critically, it returns the
// catalog's own amountPaise/metaValueInr, never anything derived from
// the caller's input. A request body that also includes an `amount`
// field is expected to have that field ignored entirely by whatever
// calls this (see core-payments.createOrder).
// -----------------------------------------------------------------------

const PRODUCT_ID_SET: ReadonlySet<string> = new Set(Object.keys(PRODUCT_CATALOG));

/**
 * Type guard: narrows an arbitrary value to `ProductId` only if it is
 * one of the exact keys in PRODUCT_CATALOG. Safe against non-string
 * input (numbers, null, undefined, objects) and against prototype-chain
 * lookalikes (e.g. `"__proto__"`, `"constructor"`) because it checks
 * against a `Set` built from `Object.keys`, not a `key in object`
 * membership test or property access.
 */
export function isValidProductId(value: unknown): value is ProductId {
  return typeof value === 'string' && PRODUCT_ID_SET.has(value);
}

/**
 * Direct, compile-time-safe lookup for callers that already hold a
 * narrowed `ProductId` (e.g. from a literal in code, or after
 * `isValidProductId` has already narrowed it). Never throws — the type
 * system guarantees the key exists.
 */
export function getProduct(productId: ProductId): Product {
  return PRODUCT_CATALOG[productId];
}

/**
 * The runtime validation entrypoint for untrusted input. Accepts
 * anything (`unknown`) — a raw string from a JSON body, a value that
 * might not even be a string — and either returns the authoritative
 * `Product` or throws `InvalidProductIdError`.
 *
 * This is the function `@acos/core-payments.createOrder` must call
 * before creating a Razorpay order — the resulting `Product.amountPaise`
 * is what gets charged, regardless of anything the client sent alongside
 * the product id.
 */
export function resolveProduct(value: unknown): Product {
  if (!isValidProductId(value)) {
    throw new InvalidProductIdError(value);
  }
  return getProduct(value);
}
