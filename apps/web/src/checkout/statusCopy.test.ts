import { describe, expect, it } from 'vitest';

import { SUBSCRIPTION_PENDING_ACTIVATION } from './statusCopy';

// Covers requirement 8/9 from the ₹1,499 checkout-UI fix: the
// "payment received, not yet confirmed" subscription message must be
// correct for an unauthenticated purchase-first buyer on its own —
// this module has no dependency on GET /api/subscriptions/status (it
// takes no arguments at all), so its correctness can never depend on
// that endpoint resolving. CheckoutPanel.tsx shows this message
// whenever `subscription && !confirmed`, i.e. unconditionally until
// (if ever) the authenticated-only status poll succeeds — this test
// asserts the content itself never implies that poll is required.

describe('SUBSCRIPTION_PENDING_ACTIVATION', () => {
  it('confirms payment was received, without claiming activation already finished', () => {
    expect(SUBSCRIPTION_PENDING_ACTIVATION.title.toLowerCase()).toContain('payment received');
    expect(SUBSCRIPTION_PENDING_ACTIVATION.title.toLowerCase()).not.toMatch(/\bactive\b/);
  });

  it('directs the buyer to their purchase email for the activation link', () => {
    const copy = `${SUBSCRIPTION_PENDING_ACTIVATION.title} ${SUBSCRIPTION_PENDING_ACTIVATION.body}`.toLowerCase();
    expect(copy).toContain('email');
    expect(copy).toContain('activat');
  });

  it('sets the expectation that the email may take a short time', () => {
    expect(SUBSCRIPTION_PENDING_ACTIVATION.body.toLowerCase()).toMatch(/minute|moment|short time/);
  });

  it('is a plain constant with no parameters — its correctness cannot depend on any network call resolving', () => {
    expect(typeof SUBSCRIPTION_PENDING_ACTIVATION.title).toBe('string');
    expect(typeof SUBSCRIPTION_PENDING_ACTIVATION.body).toBe('string');
  });
});
