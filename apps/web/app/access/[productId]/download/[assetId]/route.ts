import { loadEnv } from '@acos/config';
import { DOWNLOAD_AUTHORIZATION_TTL_SECONDS } from '@acos/core-cms';
import { UnauthenticatedError, requireUser } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { getAccessibleCmsContentItem } from '../../../../../src/server/cmsContentService';
import { commerceRepositories } from '../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../src/server/session';

// GET /access/[productId]/download/[assetId] — customer-facing wrapper
// around a one-hour signed R2 download URL for a CMS asset, redirecting
// instead of returning JSON so it can be linked exactly like the legacy
// `/access/[productId]` page's existing anchor-tag download links
// (Customer Fulfillment Phase B).
// -----------------------------------------------------------------------
// `[assetId]` is a `content_items.id` (what the CMS-backed
// `/access/[productId]` page renders a link to), never a legacy
// deliverables.ts asset id — the legacy UX keeps using the existing
// `/api/downloads/[productId]/[assetId]` route and its own grant
// unchanged; this route is only ever linked to from the CMS-backed
// rendering branch.
//
// Deliberately reuses the SAME authorization chain as
// apps/web/app/api/cms/content/[id]/download/route.ts
// (requireUser -> getAccessibleCmsContentItem ->
// storage.createDownloadAuthorization) rather than a second
// implementation — see that route's own comment for why
// getAccessibleCmsContentItem alone is already the complete, canonical
// access decision (entitlement/plan + PUBLISHED-only, Plus/Pro/Max
// inheritance and expiry included, no existence leak across any denial
// reason). `params.productId` is an additional consistency check on top
// of that single decision, not a second one: a content item whose real
// owningProductId does not match the URL's productId segment is treated
// as not found, same as every other denial reason.
//
// SECURITY: no `?storageKey=` or any other client-supplied key — the
// only inputs are `assetId` (which row) and the session cookie (who).
// The key handed to storage.createDownloadAuthorization() is always the
// server-resolved PUBLISHED row's own current storageKey. The TTL is
// always the approved constant (DOWNLOAD_AUTHORIZATION_TTL_SECONDS,
// 3600) — never computed or accepted from the caller — and the R2
// adapter itself additionally enforces exactly one hour regardless.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string; assetId: string } },
) {
  try {
    const { contentItems, identity, storage, subscriptionPeriods } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));

    const item = await getAccessibleCmsContentItem(
      { subscriptionPeriods, contentItems },
      userId,
      params.assetId,
    );
    if (
      !item ||
      item.nodeType !== 'ASSET' ||
      !item.storageKey ||
      item.owningProductId !== params.productId
    ) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const authorization = await storage.createDownloadAuthorization(
      item.storageKey,
      DOWNLOAD_AUTHORIZATION_TTL_SECONDS,
    );
    // SECURITY (review finding): a one-hour bearer URL must never be
    // cacheable by an intermediary, even though a 307 isn't cached by
    // default.
    return NextResponse.redirect(authorization.downloadUrl, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      // SECURITY (review finding): built from the configured app origin,
      // never `request.url` — a redirect target must not be derived from
      // a caller-controlled Host/X-Forwarded-Host header.
      return NextResponse.redirect(new URL('/access/login', loadEnv().APP_BASE_URL));
    }
    console.error('Unhandled error in GET /access/[productId]/download/[assetId]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
