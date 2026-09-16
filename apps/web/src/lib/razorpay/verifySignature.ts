// Razorpay webhook signature verification.
// -----------------------------------------------------------------------
// MOVED to @acos/core-payments. It lives there now because the thing it
// guards — handleRazorpayWebhook — lives there, and a security control
// two packages away from what it protects is a control that a future
// implementer can forget to call. In core-payments it can be wired into
// the type system: handleRazorpayWebhook accepts a VerifiedWebhook that
// only this verification can produce.
//
// Re-exported here so existing call sites and the extensive test suite in
// verifySignature.test.ts keep working unchanged.
// -----------------------------------------------------------------------
export {
  RazorpaySignatureConfigError,
  verifyRazorpayWebhookSignature,
} from '@acos/core-payments';
