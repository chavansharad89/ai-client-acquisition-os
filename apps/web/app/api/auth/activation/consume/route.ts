import { ACTIVATION_CONSUME_IP_POLICY } from '@acos/rate-limit';
import { NextResponse, type NextRequest } from 'next/server';

import { consumeClientFinderActivation, type AccountSetupFields } from '../../../../../src/server/activationService';
import { clientFinderRepositories } from '../../../../../src/server/clientFinderRepositories';
import { checkLimits } from '../../../../../src/server/rateLimit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '../../../../../src/server/session';

// POST /api/auth/activation/consume
// { token, password?, firstName?, lastName?, phone?, dateOfBirth? }
// -----------------------------------------------------------------------
// AUTH Phase 2, ₹1,499 Client Finder activation — design §4 steps 7-8,
// §11, §14.
//
// SECURITY INVARIANT (mirrors signup/route.ts's DEC-011 item 7, same
// reasoning): there is no `email` or `userId` field in this endpoint's
// accepted request shape. The identity is resolved ONLY from the
// token's server-owned binding — a request body containing either field
// is a protocol violation, rejected outright rather than silently
// ignored, so "the server ignored your field" and "you sent a malformed
// request" are the same failure mode.
//
// The one generic rejection below covers unknown / expired / already-
// consumed / superseded / now-ineligible tokens alike (design §5: which
// specific reason applied must never reach the client) — this is
// DIFFERENT from a validation-error response (missing/invalid setup
// fields for a token that WAS valid and eligible), which is not an
// enumeration risk since only the token holder ever reaches that branch.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const GENERIC_REJECTION = {
  error: 'This activation link is invalid, expired, or no longer eligible.',
  code: 'ACTIVATION_INVALID',
} as const;

function clientIpOf(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first && first.length > 0 && first.length <= 45) return first;
  const real = request.headers.get('x-real-ip')?.trim();
  return real && real.length > 0 && real.length <= 45 ? real : null;
}

function stringField(body: Record<string, unknown>, key: string): string | undefined {
  return key in body && typeof body[key] === 'string' ? (body[key] as string) : undefined;
}

export async function POST(request: NextRequest) {
  const clientIp = clientIpOf(request);
  if (clientIp) {
    const decision = await checkLimits([{ identifier: clientIp, policy: ACTIVATION_CONSUME_IP_POLICY }]);
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

  // Protocol violation, not a value to ignore — same shape as
  // signup/route.ts's DEC-011 item 7 email rejection.
  if ('email' in body || 'userId' in body || 'id' in body) {
    return NextResponse.json(
      {
        error: 'This endpoint derives the account identity from the activation token. Do not send one.',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 },
    );
  }

  const record = body as Record<string, unknown>;
  const token = stringField(record, 'token') ?? '';
  if (!token || token.length > 200) {
    return NextResponse.json(
      { error: 'A valid token is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const dateOfBirthRaw = stringField(record, 'dateOfBirth');
  let dateOfBirth: Date | undefined;
  if (dateOfBirthRaw) {
    const parsed = new Date(dateOfBirthRaw);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: 'dateOfBirth must be a valid date', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    dateOfBirth = parsed;
  }

  const setup: Partial<AccountSetupFields> = {
    ...(stringField(record, 'firstName') !== undefined ? { firstName: stringField(record, 'firstName')! } : {}),
    ...(stringField(record, 'lastName') !== undefined ? { lastName: stringField(record, 'lastName')! } : {}),
    ...(stringField(record, 'phone') !== undefined ? { phone: stringField(record, 'phone')! } : {}),
    ...(stringField(record, 'password') !== undefined ? { password: stringField(record, 'password')! } : {}),
    ...(dateOfBirth ? { dateOfBirth } : {}),
  };

  try {
    const { identity, subscriptionPeriods } = clientFinderRepositories();
    const result = await consumeClientFinderActivation({ identity, subscriptionPeriods }, token, setup);

    if (result.status === 'rejected') {
      return NextResponse.json(GENERIC_REJECTION, { status: 410 });
    }
    if (result.status === 'validation-error') {
      return NextResponse.json({ error: result.issue, code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const response = NextResponse.json(
      { status: 'activated', userId: result.userId, email: result.email },
      { status: 200 },
    );
    response.cookies.set(SESSION_COOKIE, result.session.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: result.session.expiresAt,
    });
    return response;
  } catch (err) {
    console.error('Unhandled error in POST /api/auth/activation/consume:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
