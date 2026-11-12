import { NextResponse, type NextRequest } from 'next/server';

import { UnauthenticatedError } from '@acos/core-identity';
import {
  createSearch,
  listSearches,
  SearchIdempotencyKeyConflictError,
  SearchServiceProfileNotFoundError,
  SearchValidationError,
  type CreateSearchInput,
} from '@acos/core-search';

import { clientFinderRepositories } from '../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../src/server/session';

// POST /api/searches — start a Search from one of the caller's own
//                       ServiceProfiles (§3 "INITIATE SEARCH").
// GET  /api/searches  — list the caller's own Searches.
// -----------------------------------------------------------------------
// Thin HTTP adapter over @acos/core-search.createSearch()/listSearches(),
// unchanged. Worker pickup/execution (Phase 17/18) is untouched by this
// route — it only creates the PENDING row the existing worker orchestration
// already knows how to claim and run.
// -----------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const token = readSessionToken(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const { identity, profiles, searches } = clientFinderRepositories();
    const search = await createSearch(
      { identity, profiles, searches },
      token,
      body as CreateSearchInput,
    );
    return NextResponse.json(search, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof SearchValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR', field: err.field, reason: err.reason },
        { status: 400 },
      );
    }
    if (err instanceof SearchServiceProfileNotFoundError) {
      return NextResponse.json({ error: err.message, code: 'NOT_FOUND' }, { status: 404 });
    }
    if (err instanceof SearchIdempotencyKeyConflictError) {
      return NextResponse.json(
        { error: err.message, code: 'IDEMPOTENCY_CONFLICT', conflictingFields: err.conflictingFields },
        { status: 409 },
      );
    }
    console.error('Unhandled error in POST /api/searches:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = readSessionToken(request);
  try {
    const { identity, profiles, searches } = clientFinderRepositories();
    const result = await listSearches({ identity, profiles, searches }, token);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/searches:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
