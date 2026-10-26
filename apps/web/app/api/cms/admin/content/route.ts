import {
  CmsValidationError,
  createContainer,
  isCmsEligibleProduct,
  listByOwningProduct,
  listChildren,
  listRoots,
  NotCmsAdminError,
  requireCmsAdmin,
} from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../src/server/session';

// GET  /api/cms/admin/content — list CMS content for administration,
//      regardless of lifecycle status (DRAFT/PUBLISHED/ARCHIVED alike).
// POST /api/cms/admin/content — create a CONTAINER (chapter/topic/
//      folder). Asset creation is NOT exposed here (CMS-PO-010).
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> CMS admin service ->
// repository` (CMS-PO-006(R3)/CMS-PO-007(R3)/CMS-PO-008). This is a
// strictly separate authorization chain from the customer-facing
// `GET /api/cms/content` (requireUser -> permittedContentPlans) --
// nothing here reuses or is reused by that chain. An admin's own
// Plus/Pro/Max subscription state, if any, is never read or consulted.
//
// GET supports exactly one of two query shapes, each mapping onto an
// existing, unmodified read function -- no new query logic is
// introduced:
//   ?owningProductId=<id>              -> listRoots(owningProductId)
//   ?owningProductId=<id>&all=true     -> listByOwningProduct(owningProductId)
//   ?parentId=<id>                     -> listChildren(parentId)
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { identity, cmsAdmins, contentItems } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));
    await requireCmsAdmin({ cmsAdmins }, userId);

    const searchParams = new URL(request.url).searchParams;
    const owningProductId = searchParams.get('owningProductId');
    const parentId = searchParams.get('parentId');
    const all = searchParams.get('all') === 'true';

    if (owningProductId && parentId) {
      return NextResponse.json(
        { error: 'Provide owningProductId or parentId, not both', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    if (parentId) {
      const items = await listChildren({ contentItems }, parentId);
      return NextResponse.json(items, { status: 200 });
    }

    if (owningProductId) {
      if (!isCmsEligibleProduct(owningProductId)) {
        return NextResponse.json(
          { error: `'${owningProductId}' is not a CMS-eligible product`, code: 'VALIDATION_ERROR', field: 'owningProductId' },
          { status: 400 },
        );
      }
      const items = all
        ? await listByOwningProduct({ contentItems }, owningProductId)
        : await listRoots({ contentItems }, owningProductId);
      return NextResponse.json(items, { status: 200 });
    }

    return NextResponse.json(
      { error: 'owningProductId or parentId is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof NotCmsAdminError) {
      return NextResponse.json({ error: 'Forbidden', code: 'NOT_CMS_ADMIN' }, { status: 403 });
    }
    console.error('Unhandled error in GET /api/cms/admin/content:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { identity, cmsAdmins, contentItems } = commerceRepositories();
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
    // Asset creation is not available through this or any other route
    // (CMS-PO-010) -- rejected explicitly rather than silently ignored,
    // so a caller supplying asset-only fields gets a clear error rather
    // than a quietly-created container.
    if ('assetKind' in raw || 'storageKey' in raw || 'bytes' in raw) {
      return NextResponse.json(
        { error: 'Asset creation is not available', code: 'ASSET_CREATION_NOT_AVAILABLE' },
        { status: 400 },
      );
    }

    const owningProductId = raw.owningProductId;
    if (typeof owningProductId !== 'string' || !isCmsEligibleProduct(owningProductId)) {
      return NextResponse.json(
        { error: `'${String(owningProductId)}' is not a CMS-eligible product`, code: 'VALIDATION_ERROR', field: 'owningProductId' },
        { status: 400 },
      );
    }

    const container = await createContainer({ contentItems }, {
      owningProductId,
      parentId: (raw.parentId as string | null) ?? null,
      title: raw.title as string,
      description: (raw.description as string | null) ?? null,
      ...(typeof raw.orderIndex === 'number' ? { orderIndex: raw.orderIndex } : {}),
    });
    return NextResponse.json(container, { status: 201 });
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
    console.error('Unhandled error in POST /api/cms/admin/content:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
