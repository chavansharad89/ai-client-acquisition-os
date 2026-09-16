import { describe, it } from 'vitest';

// TODO(Phase 1): add a real, redacted `payment.captured` webhook payload
// fixture under tests/contract/fixtures/razorpay/ and assert our parser/
// Zod schema accepts it byte-for-byte as Razorpay actually sends it —
// not a hand-typed approximation of it.
describe('Razorpay webhook payload contract', () => {
  it.todo('accepts a real payment.captured payload shape');
  it.todo('accepts a real payment.failed payload shape');
  it.todo('accepts a real refund.processed payload shape');
});
