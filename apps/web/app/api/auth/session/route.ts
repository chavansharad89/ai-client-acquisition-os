import { NextResponse, type NextRequest } from 'next/server';

import { mintUserSession, resolveSession } from '@acos/core-identity';

import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { readSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '../../../../src/server/session';

// POST /api/auth/session
// -----------------------------------------------------------------------
// Mints a session cookie for an EXISTING user, looked up by email.
//
// Deliberately does NOT create a user. @acos/core-identity's
// mintUserSession() doc comment is explicit: "R-02: self-service signup
// is FUTURE; MVP identity is provisioned out of band, so this is the
// mint path for a user row that already exists." Adding a
// findOrCreate-by-email here would silently build self-service signup —
// a capability this MVP's own identity package documents as deferred.
// So a user with no existing `users` row is a 404, not an account.
//
// GET /api/auth/session
// -----------------------------------------------------------------------
// Resolves the current cookie, for the UI to check auth state.
// -----------------------------------------------------------------------

function getRepos() {
  return clientFinderRepositories();
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

  try {
    const { identity } = getRepos();
    const user = await identity.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        {
          error: 'No account exists for this email. MVP accounts are provisioned out of band.',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    const minted = await mintUserSession(identity, { id: user.id, email: user.email });
    const response = NextResponse.json({ userId: user.id, email: user.email }, { status: 200 });
    response.cookies.set(SESSION_COOKIE, minted.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: minted.expiresAt,
    });
    return response;
  } catch (err) {
    console.error('Unhandled error in POST /api/auth/session:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { identity } = getRepos();
    const resolution = await resolveSession(identity, readSessionToken(request));
    if (!resolution.authenticated) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, userId: resolution.userId }, { status: 200 });
  } catch (err) {
    console.error('Unhandled error in GET /api/auth/session:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
