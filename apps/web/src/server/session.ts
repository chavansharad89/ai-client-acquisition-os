import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { resolveSession, type IdentityRepository, type SessionResolution } from '@acos/core-identity';

// Session cookie — shared by the Client Finder MVP UI and the kit
// library/claim flow (DEC-010 §5: the same core-identity session
// mechanism, activated for a second purpose).
// -----------------------------------------------------------------------
// This cookie carries a core-identity session token, minted by POST
// /api/auth/session (Client Finder) or POST /api/auth/{signup,login}
// (kit accounts) and resolved by @acos/core-identity's
// resolveSession()/requireUser() — never verified or decoded in this
// file, only carried.
// -----------------------------------------------------------------------

export const SESSION_COOKIE = 'acos_session';

/** Reads the raw session token from a Route Handler's NextRequest. */
export function readSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE)?.value;
}

/** Reads the raw session token from a Server Component (read-only cookie jar). */
export function readSessionTokenFromServerComponent(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

/** Server-component convenience: resolves the current cookie to a userId, or null if unauthenticated. */
export async function resolveCurrentUser(identity: IdentityRepository): Promise<string | null> {
  const resolution: SessionResolution = await resolveSession(
    identity,
    readSessionTokenFromServerComponent(),
  );
  return resolution.authenticated ? resolution.userId : null;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/**
 * Fast, cheap presence check for a Server Component's auth gate — NOT a
 * verdict on whether the token is still valid. A present-but-expired or
 * -revoked token still redirects here; the actual service call the page
 * goes on to make resolves the token for real via requireUser() and
 * throws UnauthenticatedError if it turns out to be no good, which the
 * page must catch and redirect on too (see e.g. app/(client-finder)/
 * searches/[id]/page.tsx).
 */
export function hasSessionCookie(): boolean {
  return Boolean(readSessionTokenFromServerComponent());
}
