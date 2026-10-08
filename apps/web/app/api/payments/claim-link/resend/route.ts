import { createClaimEmailSender, issueClaimLink } from '@acos/core-entitlements';
import { CLAIM_LINK_RESEND_EMAIL_POLICY, CLAIM_LINK_RESEND_IP_POLICY } from '@acos/rate-limit';
import { loadEnv } from '@acos/config';
import { NextResponse, type NextRequest } from 'next/server';

import { checkLimits } from '../../../../../src/server/rateLimit';
import { commerceRepositories } from '../../../../../src/server/commerceRepositories';
import { getOrderRepository } from '../../../../../src/server/orderRepository';

// POST /api/payments/claim-link/resend { razorpayOrderId }
// -----------------------------------------------------------------------
// Resends the DEC-014 claim/setup link email for an order.
//
// DEC-014 D1: Razorpay order-ID possession alone must never be enough to
// activate an account, so — unlike the mechanism this endpoint used to
// implement — the claim TOKEN is never returned here. This endpoint's
// only effect is sending an email to the order's own server-derived
// address; the token that email carries is the only way to reach
// /claim/[token] and from there /api/auth/signup.
//
// The primary issuance path is automatic: the webhook handler (and
// reconciliation, for a late/missing webhook) already calls
// issueClaimLink the moment an entitlement is granted. This endpoint
// exists for D3 — a buyer who lost that email, or whose provider never
// delivered it, can ask for a new one. Issuing a new token here
// invalidates any previous unused one for the order (DEC-014 D4),
// exactly as the automatic path does, via the same issueClaimLink call.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

let env: ReturnType<typeof loadEnv> | null = null;
function getEnv(): ReturnType<typeof loadEnv> {
  env ??= loadEnv();
  return env;
}

function clientIpOf(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first && first.length > 0 && first.length <= 45) return first;
  const real = request.headers.get('x-real-ip')?.trim();
  return real && real.length > 0 && real.length <= 45 ? real : null;
}

export async function POST(request: NextRequest) {
  const clientIp = clientIpOf(request);
  if (clientIp) {
    const decision = await checkLimits([
      { identifier: clientIp, policy: CLAIM_LINK_RESEND_IP_POLICY },
    ]);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(decision.retryAfterSeconds) } },
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const razorpayOrderId =
    typeof body === 'object' && body !== null && 'razorpayOrderId' in body
      ? String((body as { razorpayOrderId: unknown }).razorpayOrderId).trim()
      : '';
  if (!razorpayOrderId || razorpayOrderId.length > 120) {
    return NextResponse.json(
      { error: 'A valid razorpayOrderId is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const order = await getOrderRepository().findByRazorpayOrderId(razorpayOrderId);
    if (!order) {
      return NextResponse.json({ error: 'Unknown order', code: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    // Tighter, per-email ceiling now that we know who this resend would
    // actually email — same two-check pattern as /api/auth/login.
    const decision = await checkLimits([
      { identifier: order.customerEmail, policy: CLAIM_LINK_RESEND_EMAIL_POLICY },
    ]);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(decision.retryAfterSeconds) } },
      );
    }

    const { entitlements } = commerceRepositories();
    const entitlement = await entitlements.findByOrderId(order.id);
    if (!entitlement) {
      // No entitlement, no email — this is not a mechanism for probing
      // whether an order eventually gets paid.
      return NextResponse.json(
        { error: 'Payment not yet confirmed for this order', code: 'NOT_YET_PAID' },
        { status: 409 },
      );
    }

    const config = getEnv();
    const sender = createClaimEmailSender({
      provider: config.EMAIL_PROVIDER,
      nodeEnv: config.NODE_ENV,
      gmailDev:
        config.GMAIL_DEV_USER && config.GMAIL_DEV_APP_PASSWORD
          ? { user: config.GMAIL_DEV_USER, appPassword: config.GMAIL_DEV_APP_PASSWORD }
          : undefined,
    });
    await issueClaimLink(entitlements, sender, {
      orderId: order.id,
      customerEmail: order.customerEmail,
      baseUrl: config.APP_BASE_URL,
    });

    return NextResponse.json(
      {
        status: 'sent',
        // Display only, so the UI can say "sent to j...@example.com" —
        // never the claim token itself.
        customerEmail: order.customerEmail,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('Unhandled error in POST /api/payments/claim-token:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
