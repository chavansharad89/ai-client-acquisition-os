import {
  CmsValidationError,
  NotCmsAdminError,
  publishReplacement,
  requireCmsAdmin,
  toPublicContentItem,
} from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// POST /api/cms/admin/assets/publish-replacement — the missing third
// step of the CMS-PO-010(R2) asset-upload flow: publishes a pending
// DRAFT replacement (created by POST .../assets/complete's replacement
// branch) onto its currently-live logical asset.
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> publishReplacement ->
// publishReplacementTransaction` (packages/core-cms/src/
// contentReplacementTransaction.ts, unmodified). This route does not
// reimplement any of that transaction's SQL/locking/obsolete-object
// bookkeeping — it only authenticates, authorizes, validates the request
// shape, and maps the transaction's own errors the same way every other
// CMS admin route already does.
//
// Before this route existed, `publishReplacement`/`publishReplacementTransaction`
// was exported from @acos/core-cms and fully covered by real-Postgres
// integration tests, but had no HTTP caller anywhere in apps/web — an
// admin could upload a replacement into DRAFT (POST .../assets/complete)
// but could never publish it through the application. The existing
// generic lifecycle route (POST .../content/[id]/status, setLifecycleStatus
// -> contentItems.setStatus) is not valid for this: it has no notion of
// `replacesContentItemId`, and migration 0066's
// content_items_replacement_shape CHECK constraint would simply reject
// an attempt to force a pending-replacement row straight to PUBLISHED
// through it.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { cmsAdmins, identity, pool } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));
    await requireCmsAdmin({ cmsAdmins }, userId);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const raw = (body ?? {}) as Record<string, unknown>;

    if (typeof raw.contentItemId !== 'string' || raw.contentItemId.length === 0) {
      return NextResponse.json(
        { error: 'contentItemId is required', code: 'VALIDATION_ERROR', field: 'contentItemId' },
        { status: 400 },
      );
    }
    if (typeof raw.expectedPendingReplacementId !== 'string' || raw.expectedPendingReplacementId.length === 0) {
      return NextResponse.json(
        {
          error: 'expectedPendingReplacementId is required',
          code: 'VALIDATION_ERROR',
          field: 'expectedPendingReplacementId',
        },
        { status: 400 },
      );
    }

    const published = await publishReplacement(
      { pool },
      {
        contentItemId: raw.contentItemId,
        expectedPendingReplacementId: raw.expectedPendingReplacementId,
      },
    );
    return NextResponse.json(toPublicContentItem(published), { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof NotCmsAdminError) {
      return NextResponse.json({ error: 'Forbidden', code: 'NOT_CMS_ADMIN' }, { status: 403 });
    }
    if (err instanceof CmsValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR', field: err.field, reason: err.reason },
        { status: 400 },
      );
    }
    console.error('Unhandled error in POST /api/cms/admin/assets/publish-replacement:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
