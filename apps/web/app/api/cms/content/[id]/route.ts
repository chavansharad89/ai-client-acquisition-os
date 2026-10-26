import { UnauthenticatedError, requireUser } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { getAccessibleCmsContentItem } from '../../../../../src/server/cmsContentService';
import { commerceRepositories } from '../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../src/server/session';

// GET /api/cms/content/[id] — a single content_items row, but only if
// it is PUBLISHED and owned by a plan the authenticated user's active
// subscription(s) permit.
// -----------------------------------------------------------------------
// SECURITY: `id` identifies which row to look up, not which plan the
// caller may see — getAccessibleCmsContentItem() returns null for every
// unauthorized case (wrong plan, DRAFT, ARCHIVED, nonexistent id)
// identically, via getPublishedContentItemForPlans()
// (@acos/core-cms/customerContentService.ts). A Plus-only caller who
// guesses or copies a Pro content id gets the same 404 as a bad id —
// nothing here distinguishes "exists but not yours" from "doesn't
// exist."
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { identity, subscriptionPeriods, contentItems } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));

    const item = await getAccessibleCmsContentItem(
      { subscriptionPeriods, contentItems },
      userId,
      params.id,
    );
    if (!item) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/cms/content/[id]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
