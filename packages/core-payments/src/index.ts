// core-payments
// -----------------------------------------------------------------------
// Owns: order creation, Razorpay signature verification, payment capture
// recording, idempotency enforcement.
// Must NOT: call delivery directly, trust client-supplied success flags,
// or be called from anywhere other than apps/web's payment/webhook routes
// and apps/worker (for read-side checks only).
//
// See architecture spec §3 (Module Boundaries), §5 (Payment Flow),
// §6 (Webhook Flow).
//
// STATUS:
//   createOrder                    — IMPLEMENTED (this delivery)
//   verifyCheckoutReturnSignature   — NOT IMPLEMENTED (Phase 1, later)
//   handleRazorpayWebhook           — NOT IMPLEMENTED (explicitly out of
//                                     scope for this delivery — "do not
//                                     implement webhook processing yet")
// -----------------------------------------------------------------------

export { createOrder, idempotencyConflicts } from './createOrder';
export type { CreateOrderDeps, CreateOrderOptions, SafeOrderPaymentInfo } from './createOrder';

export {
  CreateOrderError,
  CreateOrderValidationError,
  IdempotencyKeyConflictError,
  InvalidProductError,
  OrderPersistenceError,
  RazorpayOrderCreationError,
} from './errors';
export type { CreateOrderErrorCode } from './errors';

export { createOrderRequestSchema } from './schemas';
export type { CreateOrderRequestBody } from './schemas';

export { createRazorpayOrdersClient } from './razorpayClient';
export type { CreateRazorpayOrderParams, RazorpayOrder, RazorpayOrdersClient } from './razorpayClient';

export {
  createPrismaOrderRepository,
  UniqueConstraintViolationError,
} from './orderRepository';
export type {
  CreateOrderRecordInput,
  MinimalPrismaOrderClient,
  OrderRepository,
  OrderStatus,
  PersistedOrder,
} from './orderRepository';

export interface VerifyPaymentSignatureInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Verifies the Razorpay checkout-return signature. This is used ONLY to
 * improve perceived UX on the client's "thank you" page — it must never
 * be treated as the trigger for entitlement/delivery. See architecture
 * §5 step 3 and §14 item 12.
 *
 * NOT IMPLEMENTED — Phase 1.
 */
export async function verifyCheckoutReturnSignature(
  _input: VerifyPaymentSignatureInput,
): Promise<boolean> {
  throw new Error('core-payments.verifyCheckoutReturnSignature: not implemented (Phase 1)');
}

// handleRazorpayWebhook now lives in webhookHandler.ts, and takes a
// VerifiedWebhook rather than a raw body — see webhook.ts for why the
// trust boundary is expressed in the type system.

export {
  RazorpaySignatureConfigError,
  verifyRazorpayWebhookSignature,
} from './razorpaySignature';

export { MAX_WEBHOOK_BODY_BYTES, verifyRazorpayWebhook } from './webhook';
export type {
  VerifiedWebhook,
  VerifyWebhookInput,
  WebhookRejection,
  WebhookRejectionReason,
  WebhookVerification,
} from './webhook';

export { handleRazorpayWebhook, SUPPORTED_EVENTS, WebhookPayloadError } from './webhookHandler';
export type {
  SupportedEvent,
  WebhookEnvelope,
  WebhookHandlerDeps,
  WebhookOutcome,
  WebhookTx,
} from './webhookHandler';

export {
  createRedactionStore,
  createWebhookTransactionRunner,
  recordWebhookRejection,
} from './webhookPgStore';
export type { SqlClient, SqlPool } from './webhookPgStore';

export {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_BATCHES,
  DEFAULT_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
  MIN_RETENTION_DAYS,
  REDACTION_ALLOWLIST,
  redactExpiredPayloads,
  redactionCutoff,
  redactWebhookPayload,
  resolveRetentionDays,
} from './webhookRetention';
export type {
  RedactionRunOptions,
  RedactionRunResult,
  RedactionStore,
} from './webhookRetention';
