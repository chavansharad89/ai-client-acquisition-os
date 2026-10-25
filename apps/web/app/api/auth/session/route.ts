import { NextResponse, type NextRequest } from 'next/server';

import { resolveSession } from '@acos/core-identity';

import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../../src/server/session';

// POST /api/auth/session — REMOVED (AUTH-PO-11).
// -----------------------------------------------------------------------
// This endpoint used to mint a session from an email alone, with no
// proof of ownership. AUTH-PO-11 requires that no session can ever be
// created from an email alone; normal login goes through
// POST /api/auth/login, which verifies a password. This handler is kept
// only so the route returns a clear, permanent rejection instead of a
// framework 404 for anyone still pointed at it.
//
// GET /api/auth/session
// -----------------------------------------------------------------------
// Resolves the current cookie, for the UI to check auth state.
// -----------------------------------------------------------------------

function getRepos() {
  return clientFinderRepositories();
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Email-only session creation has been removed. Use /api/auth/login with a password.',
      code: 'GONE',
    },
    { status: 410 },
  );
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
