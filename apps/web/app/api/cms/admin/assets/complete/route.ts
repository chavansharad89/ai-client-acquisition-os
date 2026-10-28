import {
  CmsValidationError,
  completeAssetUpload,
  isCmsEligibleProduct,
  NotCmsAdminError,
  requireCmsAdmin,
  toPublicContentItem,
  type CompleteAssetUploadInput,
} from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// POST /api/cms/admin/assets/complete — admin step 2 of 2 of the
// CMS-PO-010(R2) asset-upload flow: confirms the object the admin just
// uploaded directly to R2 (using step 1's presigned URL) and turns it
// into a DRAFT content_items row, or a pending DRAFT replacement of an
// existing published asset.
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> completeAssetUpload ->
// AssetStorage.headObject -> validateAssetCandidate -> contentItems`
// (CMS-PO-010(R2) Phase 2, assetIngestionService.ts — unmodified here).
//
// `storageKey` is the exact value step 1 returned (server-generated,
// never client-chosen) — this route does not re-derive or re-validate
// its shape itself; completeAssetUpload() already does that (parses it,
// checks product-scope match) and, decisively, trusts ONLY
// storage.headObject()'s ACTUAL size/contentType for the candidate it
// validates, never `bytes`/`contentType` from the request body (this
// route never reads those fields from the client at all). Publishing a
// replacement onto its target remains a separate operation
// (POST /api/cms/admin/content/[id]/status or a future dedicated
// publish-replacement route) — completion always leaves the result in
// DRAFT.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { cmsAdmins, contentItems, identity, storage, uploadSessions } = commerceRepositories();
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

    if (typeof raw.storageKey !== 'string') {
      return NextResponse.json(
        { error: 'storageKey is required', code: 'VALIDATION_ERROR', field: 'storageKey' },
        { status: 400 },
      );
    }
    const storageKey = raw.storageKey;

    let input: CompleteAssetUploadInput;
    if (typeof raw.replacesContentItemId === 'string') {
      input = { storageKey, replacesContentItemId: raw.replacesContentItemId };
    } else {
      const owningProductId = raw.owningProductId;
      if (typeof owningProductId !== 'string' || !isCmsEligibleProduct(owningProductId)) {
        return NextResponse.json(
          {
            error: `'${String(owningProductId)}' is not a CMS-eligible product`,
            code: 'VALIDATION_ERROR',
            field: 'owningProductId',
          },
          { status: 400 },
        );
      }
      const parentId = raw.parentId;
      if (parentId !== null && typeof parentId !== 'string') {
        return NextResponse.json(
          { error: 'parentId is required (string or null)', code: 'VALIDATION_ERROR', field: 'parentId' },
          { status: 400 },
        );
      }
      if (typeof raw.title !== 'string') {
        return NextResponse.json(
          { error: 'title is required', code: 'VALIDATION_ERROR', field: 'title' },
          { status: 400 },
        );
      }
      input = {
        storageKey,
        owningProductId,
        parentId,
        title: raw.title,
        ...('description' in raw ? { description: raw.description as string | null } : {}),
        ...(typeof raw.orderIndex === 'number' ? { orderIndex: raw.orderIndex } : {}),
      };
    }

    const asset = await completeAssetUpload({ contentItems, storage, uploadSessions }, input);
    return NextResponse.json(toPublicContentItem(asset), { status: 200 });
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
    console.error('Unhandled error in POST /api/cms/admin/assets/complete:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
