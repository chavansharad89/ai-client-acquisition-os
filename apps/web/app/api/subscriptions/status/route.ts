import { NextResponse, type NextRequest } from 'next/server';

import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { getClientFinderSubscriptionStatus } from '@acos/core-subscriptions';

import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../../src/server/session';

// GET /api/subscriptions/status — read-only ₹1,499 Client Finder
// subscription status for the current session (plan §J). No credit/
// balance field anywhere in the response — there is none
// (access-model decision §6/§11).

export async function GET(request: NextRequest) {
  const token = readSessionToken(request);

  try {
    const { identity, subscriptionPeriods } = clientFinderRepositories();
    const userId = await requireUser(identity, token);
    const status = await getClientFinderSubscriptionStatus({ subscriptionPeriods }, userId);
    return NextResponse.json(status, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/subscriptions/status:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
