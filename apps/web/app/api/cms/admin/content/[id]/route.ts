import {
  CmsValidationError,
  getContentItem,
  NotCmsAdminError,
  requireCmsAdmin,
  updateContentMetadata,
} from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// GET  /api/cms/admin/content/[id] — a single content_items row, any
//      lifecycle status (DRAFT/PUBLISHED/ARCHIVED) -- the admin
//      counterpart to the customer-facing, PUBLISHED-only
//      GET /api/cms/content/[id]. Does not call permittedContentPlans
//      or any customer-access function; admin visibility here is
//      unconditional on lifecycle status once `requireCmsAdmin` passes.
// POST /api/cms/admin/content/[id] — update title/description/
//      orderIndex. No PATCH/PUT exists anywhere in this codebase; POST
//      is this repository's established mutation verb.
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> CMS admin service ->
// repository` (CMS-PO-006(R3)/CMS-PO-007(R3)/CMS-PO-008).
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { identity, cmsAdmins, contentItems } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));
    await requireCmsAdmin({ cmsAdmins }, userId);

    const item = await getContentItem({ contentItems }, params.id);
    if (!item) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(item, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof NotCmsAdminError) {
      return NextResponse.json({ error: 'Forbidden', code: 'NOT_CMS_ADMIN' }, { status: 403 });
    }
    console.error('Unhandled error in GET /api/cms/admin/content/[id]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { identity, cmsAdmins, contentItems } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));
    await requireCmsAdmin({ cmsAdmins }, userId);

    const existing = await getContentItem({ contentItems }, params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }

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

    const updated = await updateContentMetadata({ contentItems }, params.id, {
      ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
      ...('description' in raw ? { description: raw.description as string | null } : {}),
      ...(typeof raw.orderIndex === 'number' ? { orderIndex: raw.orderIndex } : {}),
    });
    return NextResponse.json(updated, { status: 200 });
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
    console.error('Unhandled error in POST /api/cms/admin/content/[id]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
