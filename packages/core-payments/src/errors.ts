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
 * Any other Razorpay API call failed (network error, 4xx/5xx response,
 * timeout) — not order creation specifically. Used by reconciliation's
 * fetch-payments call. Not part of the CreateOrderError hierarchy (it
 * has no `code`/HTTP-mapping contract with apps/web's create-order route)
 * since reconciliation runs in the worker, not behind that route.
 */
export class RazorpayApiError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'RazorpayApiError';
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

// -----------------------------------------------------------------------
// Typed error hierarchy for the ₹1,499 Client Finder SUBSCRIPTION
// create-subscription flow (createSubscription.ts). A separate hierarchy
// from CreateOrderError above -- the failure modes differ (no
// idempotency-key-conflict concept: see createSubscription.ts's own
// header for why there is no local persisted row to conflict against).
// -----------------------------------------------------------------------

export type CreateSubscriptionErrorCode =
  | 'VALIDATION_ERROR'
  | 'SUBSCRIPTION_NOT_CONFIGURED'
  | 'RAZORPAY_ERROR';

export abstract class CreateSubscriptionError extends Error {
  abstract readonly code: CreateSubscriptionErrorCode;
}

/** Request body failed shape/format validation. Maps to HTTP 400. */
export class CreateSubscriptionValidationError extends CreateSubscriptionError {
  readonly code = 'VALIDATION_ERROR' as const;
  readonly issues: { path: string; message: string }[];

  constructor(zodError: ZodError) {
    const issues = zodError.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    super(`Invalid create-subscription request: ${issues.map((i) => i.message).join('; ')}`);
    this.name = 'CreateSubscriptionValidationError';
    this.issues = issues;
  }
}

/**
 * `RAZORPAY_SUBSCRIPTION_PLAN_ID` is unset (plan §H.3 item 1's external,
 * one-time Plan-creation dependency has not been completed for this
 * deployment). Maps to HTTP 503 -- the request is well-formed, the
 * feature is simply not yet operationally configured, which is an
 * operator problem, not the caller's.
 */
export class SubscriptionNotConfiguredError extends CreateSubscriptionError {
  readonly code = 'SUBSCRIPTION_NOT_CONFIGURED' as const;

  constructor() {
    super('Razorpay subscription plan is not configured (RAZORPAY_SUBSCRIPTION_PLAN_ID unset)');
    this.name = 'SubscriptionNotConfiguredError';
  }
}

/**
 * Razorpay's subscription-creation API call failed (network error,
 * 4xx/5xx response, timeout). Maps to HTTP 502, same convention as
 * {@link RazorpayOrderCreationError}.
 */
export class RazorpaySubscriptionCreationError extends CreateSubscriptionError {
  readonly code = 'RAZORPAY_ERROR' as const;
  override readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'RazorpaySubscriptionCreationError';
    this.cause = cause;
  }
}
