import Razorpay from 'razorpay';
import { z } from 'zod';

// -----------------------------------------------------------------------
// Razorpay server client.
//
// This is the ONLY module in the codebase permitted to construct a
// Razorpay SDK instance or hold a Razorpay key secret in memory. It is
// deliberately self-contained (own env validation, own error types) so
// it can be reasoned about, tested, and audited in isolation.
//
// SECRET-SAFETY INVARIANTS THIS FILE MAINTAINS:
//   1. The key secret is read from validated environment variables and
//      passed directly into the Razorpay SDK constructor — it is never
//      assigned to an object this module returns or throws.
//   2. `createRazorpayClient` returns an object with exactly two
//      methods (`createOrder`, `fetchPayment`). It has no property that
//      exposes the underlying SDK instance, the key id, or the secret.
//   3. Errors thrown from this module carry only a hand-picked, known-
//      safe subset of fields from the SDK's error shape (`statusCode`,
//      `code`, `description`, `reason`) — never the raw SDK error object,
//      which (via its underlying HTTP client) can carry the Basic-Auth
//      `Authorization` header containing base64(key_id:key_secret). See
//      `sanitizeRazorpayError` below; this is verified by tests using a
//      deliberately "leaky" fake error shape.
// -----------------------------------------------------------------------

// =========================================================================
// Environment validation
// =========================================================================

const razorpayEnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required and must not be empty'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required and must not be empty'),
});

export interface RazorpayEnv {
  keyId: string;
  keySecret: string;
}

/**
 * Thrown when required Razorpay environment variables are missing or
 * empty. Messages describe WHICH variable is missing, never any
 * variable's value — there is nothing to redact here because invalid
 * input is never echoed back.
 */
export class RazorpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RazorpayConfigError';
  }
}

/**
 * Validates and extracts the two Razorpay credentials from an
 * environment source (defaults to `process.env`, but accepts an
 * explicit object so this — and everything that depends on it — is
 * testable without mutating real process env vars).
 */
export function validateRazorpayEnv(
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): RazorpayEnv {
  const result = razorpayEnvSchema.safeParse(source);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new RazorpayConfigError(`Invalid Razorpay configuration: ${messages}`);
  }
  return {
    keyId: result.data.RAZORPAY_KEY_ID,
    keySecret: result.data.RAZORPAY_KEY_SECRET,
  };
}

// =========================================================================
// Types
// =========================================================================

export interface CreateOrderParams {
  /** Integer paise. Callers (see @acos/core-payments) are responsible for
   *  sourcing this from the server-side product catalog — this module
   *  has no opinion on where the amount comes from and does not
   *  validate it against any catalog; it only forwards it to Razorpay. */
  amountPaise: number;
  currency: string;
  /** Idempotency/reconciliation aid on Razorpay's side. */
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amountPaise: number;
  currency: string;
  receipt: string | null;
  status: string;
}

export interface FetchPaymentResult {
  id: string;
  orderId: string | null;
  amountPaise: number;
  currency: string;
  status: string;
  method: string | null;
  captured: boolean;
  createdAt: Date;
}

export interface RazorpayServerClient {
  createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult>;
  fetchPayment(paymentId: string): Promise<FetchPaymentResult>;
}

// =========================================================================
// Errors
// =========================================================================

export type RazorpayOperation = 'createOrder' | 'fetchPayment';

/**
 * Only ever constructed from `sanitizeRazorpayError`'s output — see that
 * function for exactly which fields are considered safe to carry. Never
 * pass a raw caught error into this class's `cause` directly.
 */
export class RazorpayApiError extends Error {
  readonly operation: RazorpayOperation;
  readonly statusCode: number | undefined;
  readonly errorCode: string | undefined;
  readonly description: string | undefined;

  constructor(operation: RazorpayOperation, sanitized: SanitizedRazorpayError) {
    super(
      `Razorpay ${operation} failed` +
        (sanitized.description ? `: ${sanitized.description}` : '') +
        (sanitized.statusCode ? ` (status ${sanitized.statusCode})` : ''),
    );
    this.name = 'RazorpayApiError';
    this.operation = operation;
    this.statusCode = sanitized.statusCode;
    this.errorCode = sanitized.code;
    this.description = sanitized.description;
  }
}

interface SanitizedRazorpayError {
  statusCode?: number | undefined;
  code?: string | undefined;
  description?: string | undefined;
  reason?: string | undefined;
}

/**
 * Extracts ONLY a known-safe, hand-picked subset of fields from a caught
 * Razorpay SDK error. Razorpay's documented error shape is
 * `{ statusCode, error: { code, description, source, step, reason,
 * metadata } }` — this function reads exactly those fields and nothing
 * else. It deliberately does NOT copy the error object itself, its
 * `.config`, `.request`, or `.response` (Axios-style error objects, which
 * is what the underlying HTTP client can throw, carry the outgoing
 * request's headers — including the Basic-Auth Authorization header
 * built from key_id:key_secret — on exactly those properties). Anything
 * not explicitly listed below is discarded, not "usually safe."
 */
function sanitizeRazorpayError(raw: unknown): SanitizedRazorpayError {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const rawRecord = raw as Record<string, unknown>;

  const statusCode = typeof rawRecord.statusCode === 'number' ? rawRecord.statusCode : undefined;

  const errorBody =
    typeof rawRecord.error === 'object' && rawRecord.error !== null
      ? (rawRecord.error as Record<string, unknown>)
      : undefined;

  return {
    statusCode,
    code: typeof errorBody?.code === 'string' ? errorBody.code : undefined,
    description: typeof errorBody?.description === 'string' ? errorBody.description : undefined,
    reason: typeof errorBody?.reason === 'string' ? errorBody.reason : undefined,
  };
}

// =========================================================================
// Client factory
// =========================================================================

/**
 * Constructs the server-side Razorpay client. Call this once per process
 * (or per request, if that's simpler for your framework's lifecycle —
 * constructing the SDK instance is cheap) and pass the returned object
 * around as a dependency; never reconstruct it from raw env vars in
 * multiple places.
 *
 * @param env Defaults to validating `process.env`. Pass an explicit
 *   `RazorpayEnv` (e.g. the result of a prior `validateRazorpayEnv` call)
 *   if the caller already validated env vars as part of broader app
 *   startup and wants to avoid validating twice.
 */
export function createRazorpayClient(
  env: RazorpayEnv = validateRazorpayEnv(),
): RazorpayServerClient {
  const instance = new Razorpay({ key_id: env.keyId, key_secret: env.keySecret });
  // `env.keySecret` is captured only in the Razorpay SDK instance above,
  // which itself is captured only in this closure. Nothing below returns
  // `env`, `instance`, or any property that could reach either.

  return {
    async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
      let response: {
        id: string;
        amount: string | number;
        currency: string;
        receipt?: string;
        status: string;
      };
      try {
        response = await instance.orders.create({
          amount: params.amountPaise,
          currency: params.currency,
          receipt: params.receipt,
          ...(params.notes ? { notes: params.notes } : {}),
        });
      } catch (cause) {
        throw new RazorpayApiError('createOrder', sanitizeRazorpayError(cause));
      }

      return {
        id: response.id,
        amountPaise: Number(response.amount),
        currency: response.currency,
        receipt: response.receipt ?? null,
        status: response.status,
      };
    },

    async fetchPayment(paymentId: string): Promise<FetchPaymentResult> {
      let response: {
        id: string;
        order_id: string | null;
        amount: string | number;
        currency: string;
        status: string;
        method: string | null;
        captured: boolean;
        created_at: number;
      };
      try {
        response = await instance.payments.fetch(paymentId);
      } catch (cause) {
        throw new RazorpayApiError('fetchPayment', sanitizeRazorpayError(cause));
      }

      return {
        id: response.id,
        orderId: response.order_id ?? null,
        amountPaise: Number(response.amount),
        currency: response.currency,
        status: response.status,
        method: response.method ?? null,
        captured: response.captured,
        // Razorpay returns created_at as a Unix timestamp in SECONDS.
        createdAt: new Date(response.created_at * 1000),
      };
    },
  };
}
