import { loadEnv } from '@acos/config';
import { createActivationEmailSender } from '@acos/core-identity';
import { ACTIVATION_REQUEST_EMAIL_POLICY, ACTIVATION_REQUEST_IP_POLICY } from '@acos/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';

import { requestClientFinderActivation } from '../../../../../src/server/activationService';
import { clientFinderRepositories } from '../../../../../src/server/clientFinderRepositories';
import { checkLimits } from '../../../../../src/server/rateLimit';

// POST /api/auth/activation/request { email }
// -----------------------------------------------------------------------
// AUTH Phase 2, ₹1,499 Client Finder activation — design §5/§11.
//
// ENUMERATION (AUTH-PO-07/10, design §5): this endpoint returns the
// IDENTICAL response (status, headers, body) whether the email is
// unknown, known-but-ineligible (no active ₹1,499 subscription), already
// fully activated, or eligible-and-just-sent — never branches on the
// outcome. A token is only actually minted/sent when
// requestClientFinderActivation's internal eligibility check passes;
// the HTTP layer never sees or reacts to that boolean.
//
// Deliberately NOT a template drawn from the existing
// POST /api/payments/claim-link/resend, which leaks order-existence via
// 404/409 (design §1.3) — this is the enumeration-safe replacement
// pattern for the ₹1,499 path specifically (AUTH-PO-30: ₹99/₹499 are not
// migrated this phase).
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const GENERIC_RESPONSE = {
  message:
    'If that email has an eligible Client Finder subscription, an activation link has been sent.',
} as const;

function clientIpOf(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first && first.length > 0 && first.length <= 45) return first;
  const real = request.headers.get('x-real-ip')?.trim();
  return real && real.length > 0 && real.length <= 45 ? real : null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const email =
    typeof body === 'object' && body !== null && 'email' in body
      ? String((body as { email: unknown }).email).trim().toLowerCase()
      : '';

  if (!email || email.length > 320 || !email.includes('@')) {
    return NextResponse.json(
      { error: 'A valid email is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const clientIp = clientIpOf(request);
  const checks = [{ identifier: email, policy: ACTIVATION_REQUEST_EMAIL_POLICY }];
  if (clientIp) checks.push({ identifier: clientIp, policy: ACTIVATION_REQUEST_IP_POLICY });
  const decision = await checkLimits(checks);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(decision.retryAfterSeconds) } },
    );
  }

  try {
    const config = loadEnv();
    const { identity, subscriptionPeriods } = clientFinderRepositories();
    const sender = createActivationEmailSender({
      provider: config.EMAIL_PROVIDER,
      nodeEnv: config.NODE_ENV,
      gmailDev:
        config.GMAIL_DEV_USER && config.GMAIL_DEV_APP_PASSWORD
          ? { user: config.GMAIL_DEV_USER, appPassword: config.GMAIL_DEV_APP_PASSWORD }
          : undefined,
      resend:
        config.RESEND_API_KEY && config.RESEND_FROM_EMAIL
          ? { apiKey: config.RESEND_API_KEY, fromEmail: config.RESEND_FROM_EMAIL }
          : undefined,
    });

    // Never let a send failure change the response shape — the one
    // thing this endpoint must never do is let the caller distinguish
    // "ineligible" from "eligible, but the mail provider is down".
    try {
      await requestClientFinderActivation(
        { identity, subscriptionPeriods },
        sender,
        { email, baseUrl: config.APP_BASE_URL },
      );
    } catch (cause) {
      console.error('Failed to issue/send activation link for POST /api/auth/activation/request:', cause);
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 202 });
  } catch (err) {
    console.error('Unhandled error in POST /api/auth/activation/request:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
