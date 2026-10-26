import { UnauthenticatedError, requireUser } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { listAccessibleCmsContent } from '../../../../src/server/cmsContentService';
import { commerceRepositories } from '../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../src/server/session';

// GET /api/cms/content — every PUBLISHED content_items row the
// authenticated user's active subscription(s) permit, across all three
// CMS plans they're entitled to (CMS-PO-002/003/005).
// -----------------------------------------------------------------------
// SECURITY: there is no `?product=` or other client-supplied filter —
// the only input is the session cookie. Which plans' content comes back
// is decided entirely server-side by listAccessibleCmsContent(), which
// calls the canonical `permittedContentPlans` (derived from the user's
// own active `subscription_periods` rows); a request cannot ask for a
// plan the caller doesn't hold, and an expired user gets an empty list,
// never an error that would distinguish "expired" from "never
// subscribed."
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { identity, subscriptionPeriods, contentItems } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));

    const items = await listAccessibleCmsContent({ subscriptionPeriods, contentItems }, userId);
    return NextResponse.json(items, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/cms/content:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
