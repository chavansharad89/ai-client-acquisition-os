import { DOWNLOAD_AUTHORIZATION_TTL_SECONDS } from '@acos/core-cms';
import { UnauthenticatedError, requireUser } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { getAccessibleCmsContentItem } from '../../../../../../src/server/cmsContentService';
import { commerceRepositories } from '../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// GET /api/cms/content/[id]/download — a one-hour signed R2 download URL
// for a single PUBLISHED, plan-permitted CMS asset (CMS-PO-010(R2)-B).
// -----------------------------------------------------------------------
// `request -> requireUser -> getAccessibleCmsContentItem -> AssetStorage
// .createDownloadAuthorization`. Reuses the exact same eligibility
// boundary as GET /api/cms/content/[id] (getAccessibleCmsContentItem,
// cmsContentService.ts) rather than a second access check: that function
// already composes the one canonical access decision
// (`permittedContentPlans`, @acos/core-subscriptions — Plus/Pro/Max
// inheritance and expiry included) with "only PUBLISHED, only a
// permitted plan," and returns null identically for "doesn't exist,"
// "is DRAFT/ARCHIVED," and "belongs to a plan you don't hold" — so this
// route cannot leak which case applies.
//
// SECURITY: there is no `?storageKey=` or other client-supplied key —
// the only input is `id` (which row) and the session cookie (who). The
// key actually handed to AssetStorage.createDownloadAuthorization() is
// always `item.storageKey`, the server-resolved PUBLISHED row's own
// current key; a client cannot substitute a different one, and an
// obsolete key (content_items.previousStorageKey) is never read by this
// route at all. The TTL passed is always the approved constant
// (DOWNLOAD_AUTHORIZATION_TTL_SECONDS, 3600) — this route never
// computes or accepts its own value, and the R2 adapter itself
// (r2AssetStorage.ts) additionally enforces exactly one hour regardless
// of what any caller passes.
//
// A CONTAINER id (no `storageKey`) is rejected the same way an
// inaccessible id is -- 404, not a distinct "not downloadable" error,
// so this route never confirms a container id's existence either.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { contentItems, identity, storage, subscriptionPeriods } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));

    const item = await getAccessibleCmsContentItem({ subscriptionPeriods, contentItems }, userId, params.id);
    if (!item || item.nodeType !== 'ASSET' || !item.storageKey) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const authorization = await storage.createDownloadAuthorization(
      item.storageKey,
      DOWNLOAD_AUTHORIZATION_TTL_SECONDS,
    );
    return NextResponse.json(
      { downloadUrl: authorization.downloadUrl, expiresAt: authorization.expiresAt },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/cms/content/[id]/download:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
