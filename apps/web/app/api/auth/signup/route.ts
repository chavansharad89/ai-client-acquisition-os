import { evaluateClaimToken, hashAccessToken } from '@acos/core-entitlements';
import { hashPassword, mintUserSession, validatePassword } from '@acos/core-identity';
import { CLAIM_TOKEN_IP_POLICY } from '@acos/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../src/server/commerceRepositories';
import { checkLimits } from '../../../../src/server/rateLimit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '../../../../src/server/session';

// POST /api/auth/signup { claimToken, password }
// -----------------------------------------------------------------------
// Consumes a single-use claim token and creates the account DEC-010 item
// 2 / DEC-011 describe.
//
// SECURITY INVARIANT (DEC-011 item 7): there is no `email` field in this
// endpoint's accepted request shape. The account's email comes ONLY from
// the claim token's server-derived customerEmail (set at claim-token
// mint time, in @acos/core-entitlements' issueClaimLink, from the ORDER
// row — never from a client). A request body that includes an `email`
// field is rejected outright rather than silently ignored, so "the
// server ignored your email" and "you sent a malformed request" are the
// same failure mode — there is no behavioural difference to probe.
//
// Already-existing account (DEC-010 §7/§8 "attach, don't duplicate"):
// if a `users` row already exists for the derived email, this endpoint
// links the entitlement to it but does NOT mint a session for it — doing
// so would grant a session to whoever held the claim token without ever
// checking the existing account's real password, which is an
// account-takeover shape. The caller is told to log in instead.
//
// DEC-014 D1: by the time a claim token reaches here, it was only ever
// obtainable via the emailed claim link (/claim/[token]) — this endpoint
// itself has not changed, but the claim token it consumes can no longer
// be self-served from a razorpayOrderId in the browser.
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

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json(
      { error: 'A valid request body is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  // DEC-011 item 7: an email field in this request is a protocol
  // violation, not a value to ignore.
  if ('email' in body) {
    return NextResponse.json(
      {
        error: 'This endpoint derives the account email from the verified purchase. Do not send one.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 },
    );
  }

  const claimToken = 'claimToken' in body ? String((body as { claimToken: unknown }).claimToken) : '';
  const password = 'password' in body ? String((body as { password: unknown }).password) : '';

  if (!claimToken || claimToken.length > 200) {
    return NextResponse.json(
      { error: 'A valid claimToken is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const passwordIssue = validatePassword(password);
  if (passwordIssue) {
    return NextResponse.json(
      { error: `Password is ${passwordIssue === 'too-short' ? 'too short' : 'too long'}`, code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const { entitlements, identity } = commerceRepositories();
    const now = new Date();

    const tokenHash = hashAccessToken(claimToken);
    const stored = await entitlements.findClaimToken(tokenHash);
    const verdict = evaluateClaimToken(stored, now);
    if (!verdict.valid) {
      return NextResponse.json(
        { error: 'This claim link is invalid or has expired.', code: 'CLAIM_TOKEN_INVALID' },
        { status: 410 },
      );
    }

    // The single-use gate. Two concurrent consume attempts (two tabs, a
    // retried request) can only ever have one winner — the database
    // decides, not a read-then-write race in this handler.
    const claimed = await entitlements.markClaimTokenClaimed(tokenHash, now);
    if (!claimed) {
      return NextResponse.json(
        { error: 'This claim link has already been used.', code: 'CLAIM_TOKEN_ALREADY_CLAIMED' },
        { status: 410 },
      );
    }

    // Server-derived, per DEC-011 — not read from this request at any point.
    const email = verdict.customerEmail;

    const existing = await identity.findUserByEmail(email);
    if (existing) {
      await entitlements.linkEntitlementsToUser(email, existing.id, now);
      return NextResponse.json(
        {
          status: 'existing-account',
          message: 'An account already exists for this purchase. Log in to access your library.',
        },
        { status: 200 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await identity.createUser({ email, passwordHash }, now);
    await entitlements.linkEntitlementsToUser(email, user.id, now);

    const minted = await mintUserSession(identity, { id: user.id, email: user.email });
    const response = NextResponse.json(
      { status: 'created', userId: user.id, email: user.email },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE, minted.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: minted.expiresAt,
    });
    return response;
  } catch (err) {
    console.error('Unhandled error in POST /api/auth/signup:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
