import { mintUserSession, verifyPassword } from '@acos/core-identity';
import { LOGIN_EMAIL_POLICY, LOGIN_IP_POLICY } from '@acos/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../src/server/commerceRepositories';
import { checkLimits } from '../../../../src/server/rateLimit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '../../../../src/server/session';

// POST /api/auth/login { email, password }
// -----------------------------------------------------------------------
// Account-login recovery, per DEC-010 item 5 — this IS the mechanism:
// no email-based reset exists or is needed for launch.
//
// ENUMERATION: every rejection (unknown email, no password set on an
// out-of-band-provisioned row, wrong password) returns the identical
// generic message and status, per the same principle
// reissueAccessToken's own doc comment already states for this
// repository: the caller must answer identically whether or not the
// address exists.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';
const INVALID_CREDENTIALS = { error: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' } as const;

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
  const password =
    typeof body === 'object' && body !== null && 'password' in body
      ? String((body as { password: unknown }).password)
      : '';

  if (!email || email.length > 320 || !email.includes('@') || !password) {
    return NextResponse.json(
      { error: 'A valid email and password are required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const clientIp = clientIpOf(request);
  const checks = [{ identifier: email, policy: LOGIN_EMAIL_POLICY }];
  if (clientIp) checks.push({ identifier: clientIp, policy: LOGIN_IP_POLICY });
  const decision = await checkLimits(checks);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment and try again.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(decision.retryAfterSeconds) } },
    );
  }

  try {
    const { identity } = commerceRepositories();
    const credentials = await identity.findCredentialsByEmail(email);

    // No early return on "not found" / "no password set" — both fall
    // through to the same generic rejection as a wrong password would,
    // via verifyPassword's own false-on-malformed-input behaviour, so
    // the response shape never varies by which case occurred.
    const valid =
      credentials?.passwordHash != null ? await verifyPassword(password, credentials.passwordHash) : false;

    if (!credentials || !valid) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
    }

    const minted = await mintUserSession(identity, { id: credentials.id, email: credentials.email });
    const response = NextResponse.json(
      { userId: credentials.id, email: credentials.email },
      { status: 200 },
    );
    response.cookies.set(SESSION_COOKIE, minted.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: minted.expiresAt,
    });
    return response;
  } catch (err) {
    console.error('Unhandled error in POST /api/auth/login:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
