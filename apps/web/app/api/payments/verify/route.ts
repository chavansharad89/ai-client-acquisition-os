import { NextResponse } from 'next/server';

// POST /api/payments/verify
// -----------------------------------------------------------------------
// Per architecture §5 step 3: verifies the Razorpay checkout-return
// signature for a FAST, OPTIMISTIC "thank you" UX only.
//
// CRITICAL: this endpoint must never grant entitlement or trigger
// delivery. That only ever happens from the webhook handler
// (/api/webhooks/razorpay) per architecture §5 step 4 and §14 item 12.
// A future implementer changing that invariant should treat it as a
// architecture violation, not a shortcut.
//
// NOT IMPLEMENTED — Phase 1.
// -----------------------------------------------------------------------
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: 'Not implemented', phase: 'Phase 1 — core-payments.verifyCheckoutReturnSignature' },
    { status: 501 },
  );
}
