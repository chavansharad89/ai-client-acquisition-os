import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

// First-party visitor-identity bridge (B-10), authorized under
// CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// Distinct from SESSION_COOKIE ('acos_session', an authenticated
// identity) and ACCESS_COOKIE ('acos_access', an entitlement credential).
// This cookie carries an opaque, anonymous visitor id and is deliberately
// NOT `_fbp` — governance requires a new cookie, not reuse of Meta's.
//
// Minted in middleware.ts, not in a Server Component: Next.js forbids
// writing cookies during a Server Component render (only Route Handlers,
// Server Actions, and middleware may call `cookies().set(...)`), and
// this identity must be durable across page views for PCG-1/3A/3B's
// first-exposure dedup to mean anything. middleware.ts guarantees the
// cookie exists by the time any page or route handler runs; the readers
// below only ever read it, never mint it.
// -----------------------------------------------------------------------

export const VISITOR_COOKIE = 'acos_visitor';

/** Two years: a durable identity bridge, not a session. */
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;

export const VISITOR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
};

/** Reads the visitor id in a Server Component. Null if middleware has not run (e.g. a non-matched path) or the cookie was stripped. */
export function readVisitorIdFromServerComponent(): string | null {
  return cookies().get(VISITOR_COOKIE)?.value ?? null;
}

/** Reads the visitor id in a Route Handler. */
export function readVisitorIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(VISITOR_COOKIE)?.value ?? null;
}

/**
 * Ensures the response carries a visitor-id cookie, minting one if the
 * request had none. Called from middleware.ts on every matched request.
 */
export function ensureVisitorCookie(request: NextRequest, response: NextResponse): void {
  if (request.cookies.get(VISITOR_COOKIE)?.value) return;
  const visitorId = crypto.randomUUID();
  response.cookies.set(VISITOR_COOKIE, visitorId, VISITOR_COOKIE_OPTIONS);
}
