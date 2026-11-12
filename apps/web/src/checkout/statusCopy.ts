// Copy for CheckoutPanel.tsx's subscription "payment received, not yet
// confirmed" status — pulled into its own pure module so it can be unit
// tested without a DOM rendering harness (see activation/activationForm.ts
// for the same reasoning; CheckoutPanel.tsx has no component-level test
// file in this repo, only its pure logic in checkout/machine.ts and
// checkout/request.ts is tested).
//
// AUTH-PO-14/25: checkout no longer assumes an authenticated buyer, so
// this message must be correct on its own — it cannot depend on
// GET /api/subscriptions/status ever resolving (that endpoint is
// auth-only and stays that way; for a guest purchase-first buyer it
// will 401 forever). The webhook sends the activation email
// unconditionally on every subscription.charged event, regardless of
// whether the buyer holds a session, so "check your email" is the one
// path that is true for every buyer, not just an already-authenticated
// one.
export const SUBSCRIPTION_PENDING_ACTIVATION = {
  title: 'Payment received — check your email to activate.',
  body:
    "We're completing your subscription activation now. Check the email you used for " +
    'this purchase for a secure activation link — it may take a few minutes to arrive. ' +
    'Open it to finish setting up your account and access Client Finder.',
} as const;
