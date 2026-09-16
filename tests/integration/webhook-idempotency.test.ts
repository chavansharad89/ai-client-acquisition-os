import { describe, it } from 'vitest';

// -----------------------------------------------------------------------
// This is the single most important test file in the repository per the
// architecture spec (§10: "idempotency-specific tests are a first-class
// category, not incidental"). It is scaffolded here as `.todo` so the
// intent is version-controlled from day one, even before core-payments
// exists to test.
//
// When @acos/core-payments.handleRazorpayWebhook is implemented, this
// suite MUST assert, at minimum:
//   - Sending the same `payment.captured` webhook payload twice results
//     in exactly ONE `payments` row, ONE `entitlements` row, and ONE
//     outbox_events row (not two).
//   - An invalid signature never reaches the transactional handler and
//     never creates a payments/entitlements row.
//   - A `payment.captured` event followed by a duplicate with a
//     different Razorpay event id but the same payment id is still
//     idempotent (dedup must work at both the event level and the
//     payment level — see architecture §4.2).
// -----------------------------------------------------------------------

describe('webhook idempotency (Razorpay payment.captured)', () => {
  it.todo('processing the same webhook payload twice yields exactly one payment record');
  it.todo('processing the same webhook payload twice yields exactly one entitlement record');
  it.todo('processing the same webhook payload twice yields exactly one outbox event');
  it.todo('a webhook with an invalid signature never creates any payment/entitlement record');
});
