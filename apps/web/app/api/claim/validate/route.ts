import { evaluateClaimToken, hashAccessToken } from '@acos/core-entitlements';
import { CLAIM_TOKEN_IP_POLICY } from '@acos/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';

import { checkLimits } from '../../../../src/server/rateLimit';
import { commerceRepositories } from '../../../../src/server/commerceRepositories';

// POST /api/claim/validate { claimToken }
// -----------------------------------------------------------------------
// Read-only lookup for the /claim/[token] page: tells the browser
// whether the token from its own URL is still live, and the email to
// pre-populate/disable on the password-setup form (DEC-011 items 2–4).
//
// Does NOT consume the token — only /api/auth/signup's
// markClaimTokenClaimed does that. A page reload, a second tab, or this
// endpoint being hit twice must not burn the buyer's one use of the
// link before they have even set a password.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

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
    const decision = await checkLimits([{ identifier: clientIp, policy: CLAIM_TOKEN_IP_POLICY }]);
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

  const claimToken =
    typeof body === 'object' && body !== null && 'claimToken' in body
      ? String((body as { claimToken: unknown }).claimToken)
      : '';
  if (!claimToken || claimToken.length > 200) {
    return NextResponse.json(
      { error: 'A valid claimToken is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const { entitlements } = commerceRepositories();
    const stored = await entitlements.findClaimToken(hashAccessToken(claimToken));
    const verdict = evaluateClaimToken(stored);
    if (!verdict.valid) {
      return NextResponse.json(
        { error: 'This claim link is invalid or has expired.', code: 'CLAIM_TOKEN_INVALID' },
        { status: 410 },
      );
    }

    return NextResponse.json({ valid: true, customerEmail: verdict.customerEmail }, { status: 200 });
  } catch (err) {
    console.error('Unhandled error in POST /api/claim/validate:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
