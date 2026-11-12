import {
  CmsValidationError,
  isCmsEligibleProduct,
  NotCmsAdminError,
  requestAssetUploadAuthorization,
  requireCmsAdmin,
} from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// POST /api/cms/admin/assets/upload-authorization — admin step 1 of 2 of
// the CMS-PO-010(R2) asset-upload flow: authorizes a direct-to-R2 upload
// and returns a server-generated storage key + presigned PUT URL. Creates
// NO content_items row (requestAssetUploadAuthorization's own contract)
// -- an upload that is never completed therefore leaves no content_items
// row. It DOES now persist a cms_asset_upload_sessions row (migration
// 0068, CMS-PO-010(R2)-G) -- that row, not a content_items row, is what
// lets the abandoned-upload cleanup job later identify an authorized but
// never-completed upload.
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> requestAssetUploadAuthorization
// -> AssetStorage.createUploadAuthorization` (CMS-PO-010(R2)-C), the same
// requireUser/requireCmsAdmin chain every other admin/content route uses.
//
// The client supplies only the candidate's declared metadata
// (owningProductId/extension/contentType/declaredBytes) -- never a
// storage key. The server remains authoritative for the key
// (buildAssetStorageKey, assetValidation.ts) and the upload-session id
// (randomUUID, assetIngestionService.ts); nothing here or in that
// service accepts a client-supplied key.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { identity, cmsAdmins, storage, uploadSessions } = commerceRepositories();
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
    if (typeof raw.extension !== 'string') {
      return NextResponse.json(
        { error: 'extension is required', code: 'VALIDATION_ERROR', field: 'extension' },
        { status: 400 },
      );
    }
    if (typeof raw.contentType !== 'string') {
      return NextResponse.json(
        { error: 'contentType is required', code: 'VALIDATION_ERROR', field: 'contentType' },
        { status: 400 },
      );
    }
    if (typeof raw.declaredBytes !== 'number') {
      return NextResponse.json(
        { error: 'declaredBytes is required', code: 'VALIDATION_ERROR', field: 'declaredBytes' },
        { status: 400 },
      );
    }

    const authorization = await requestAssetUploadAuthorization(
      { storage, uploadSessions },
      {
        owningProductId,
        extension: raw.extension,
        contentType: raw.contentType,
        declaredBytes: raw.declaredBytes,
      },
    );
    return NextResponse.json(authorization, { status: 200 });
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
    console.error('Unhandled error in POST /api/cms/admin/assets/upload-authorization:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
