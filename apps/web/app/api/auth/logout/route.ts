import { hashAccessToken } from '@acos/core-entitlements';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../src/server/commerceRepositories';
import { readSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '../../../../src/server/session';

// POST /api/auth/logout
// -----------------------------------------------------------------------
// Revokes the session row (access_tokens.revoked_at) and clears the
// cookie. Idempotent: logging out twice, or with no session cookie at
// all, is still a 200 — logout has no failure mode a client should ever
// need to handle differently.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rawToken = readSessionToken(request);
  if (rawToken) {
    try {
      const { identity } = commerceRepositories();
      await identity.revokeSessionToken(hashAccessToken(rawToken), new Date());
    } catch (err) {
      console.error('Unhandled error in POST /api/auth/logout:', err);
      // Still clear the cookie below — a failed revoke should not strand
      // the browser holding a cookie it believes is still valid.
    }
  }

  const response = NextResponse.json({ status: 'logged-out' }, { status: 200 });
  response.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTIONS, expires: new Date(0) });
  return response;
}
