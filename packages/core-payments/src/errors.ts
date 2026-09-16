import type { ZodError } from 'zod';

// -----------------------------------------------------------------------
// Typed error hierarchy for the create-order flow. Each maps to exactly
// one of the failure modes this feature is required to handle, and each
// carries a machine-readable `code` so the HTTP layer (apps/web's route
// handler) can map it to the right status code without string-matching
// error messages.
// -----------------------------------------------------------------------

export type CreateOrderErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_PRODUCT'
  | 'RAZORPAY_ERROR'
  | 'DATABASE_ERROR'
  | 'IDEMPOTENCY_KEY_CONFLICT';

export abstract class CreateOrderError extends Error {
  abstract readonly code: CreateOrderErrorCode;
}

/**
 * Request body failed shape/format validation (missing field, bad email
 * format, bad phone format, unexpected extra field such as a
 * client-supplied price). Maps to HTTP 400.
 */
export class CreateOrderValidationError extends CreateOrderError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly issues: { path: string; message: string }[];

  constructor(zodError: ZodError) {
    const issues = zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    super(`Invalid create-order request: ${issues.map((i) => i.message).join('; ')}`);
    this.name = 'CreateOrderValidationError';
    this.issues = issues;
  }
}

/**
 * The request was well-formed but `productId` does not exist in
 * @acos/catalog. Maps to HTTP 400 (client error — not 404, since there is
 * no per-product resource URL here, just an invalid field value).
 */
export class InvalidProductError extends CreateOrderError {
  readonly code = 'INVALID_PRODUCT' as const;
  readonly receivedProductId: unknown;

  constructor(receivedProductId: unknown) {
    super(`Unknown product id: ${JSON.stringify(receivedProductId)}`);
    this.name = 'InvalidProductError';
    this.receivedProductId = receivedProductId;
  }
}

/**
 * The `Idempotency-Key` was already used for a DIFFERENT request.
 *
 * An idempotency key is a promise about one specific request: "if you see
 * this key again, it is this same request being retried." Honouring it
 * for a request that differs breaks the promise in the dangerous
 * direction — the caller asked to buy one thing and is handed an order
 * for another, at another price, possibly belonging to another customer.
 * Maps to HTTP 409: the request is well-formed, it just conflicts with
 * what that key already means.
 *
 * `conflictingFields` names WHICH attributes differ and deliberately
 * never carries the stored values. Echoing them back would turn a
 * guessed key into an oracle for another customer's email and product —
 * the narrowness of the success response would be pointless if the error
 * path leaked what the success path withholds.
 */
export class IdempotencyKeyConflictError extends CreateOrderError {
  readonly code = 'IDEMPOTENCY_KEY_CONFLICT' as const;
  readonly conflictingFields: readonly string[];

  constructor(conflictingFields: readonly string[]) {
    super(
      `Idempotency-Key has already been used for a different request ` +
        `(differing: ${conflictingFields.join(', ')}). ` +
        `Generate a new key for a new request, and reuse a key only when retrying ` +
        `the identical request.`,
    );
    this.name = 'IdempotencyKeyConflictError';
    this.conflictingFields = [...conflictingFields];
  }
}

/**
 * Razorpay's order-creation API call failed (network error, 4xx/5xx
 * response, timeout). Maps to HTTP 502 — the problem is upstream, not
 * something wrong with the request itself.
 */
export class RazorpayOrderCreationError extends CreateOrderError {
  readonly code = 'RAZORPAY_ERROR' as const;
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'RazorpayOrderCreationError';
    this.cause = cause;
  }
}

/**
 * Persisting (or reading, for the idempotency check) the local Order
 * row failed for a reason other than the expected unique-constraint race
 * (which is handled internally by createOrder.ts, not surfaced as this
 * error — see the "duplicate/retry" handling there). Maps to HTTP 500.
 */
export class OrderPersistenceError extends CreateOrderError {
  readonly code = 'DATABASE_ERROR' as const;
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'OrderPersistenceError';
    this.cause = cause;
  }
}
