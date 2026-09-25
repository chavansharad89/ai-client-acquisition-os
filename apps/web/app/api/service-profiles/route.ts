import { NextResponse, type NextRequest } from 'next/server';

import { UnauthenticatedError } from '@acos/core-identity';
import {
  createServiceProfile,
  listServiceProfiles,
  ServiceProfileValidationError,
  type ServiceProfileInput,
} from '@acos/core-service-profile';

import { clientFinderRepositories } from '../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../src/server/session';

// POST /api/service-profiles — create a ServiceProfile for the caller.
// GET  /api/service-profiles — list the caller's own ServiceProfiles.
// -----------------------------------------------------------------------
// Thin HTTP adapter. All domain logic (the seven-field validation,
// ownership) lives in @acos/core-service-profile.createServiceProfile(),
// unchanged. userId is never read from the request body — only from the
// session cookie, resolved server-side inside the service call itself.
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
    const { identity, profiles } = clientFinderRepositories();
    // Untrusted input, deliberately unvalidated here: createServiceProfile()
    // runs validateServiceProfileInput() internally and throws
    // ServiceProfileValidationError for anything malformed — this route
    // does not duplicate that logic, only forwards and maps the error.
    const profile = await createServiceProfile({ identity, profiles }, token, body as ServiceProfileInput);
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof ServiceProfileValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR', field: err.field, reason: err.reason },
        { status: 400 },
      );
    }
    console.error('Unhandled error in POST /api/service-profiles:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = readSessionToken(request);
  try {
    const { identity, profiles } = clientFinderRepositories();
    const result = await listServiceProfiles({ identity, profiles }, token);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/service-profiles:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
