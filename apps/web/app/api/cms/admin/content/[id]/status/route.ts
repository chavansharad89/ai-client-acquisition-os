import { getContentItem, NotCmsAdminError, requireCmsAdmin, setLifecycleStatus } from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../../src/server/session';

// POST /api/cms/admin/content/[id]/status — move a content item
// directly to DRAFT, PUBLISHED, or ARCHIVED (CMS-PO-009's approved
// "simple immediate lifecycle model": no approval workflow, no second-
// admin approval, no scheduling). `archiveContentItem` is `setStatus(id,
// 'ARCHIVED')` with no further logic, so this one route covers publish/
// unpublish/archive alike -- there is no separate archive route or
// workflow to build. Lifecycle/archive-consistency are enforced by the
// existing DB CHECK constraints (content_items_status_valid/
// content_items_archived_consistency), unchanged.
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> CMS admin service ->
// repository` (CMS-PO-006(R3)/CMS-PO-007(R3)/CMS-PO-008).
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

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
    const status = (body as Record<string, unknown> | null)?.status;
    if (typeof status !== 'string' || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        {
          error: `status must be one of ${VALID_STATUSES.join(', ')}`,
          code: 'VALIDATION_ERROR',
          field: 'status',
        },
        { status: 400 },
      );
    }

    const updated = await setLifecycleStatus(
      { contentItems },
      params.id,
      status as (typeof VALID_STATUSES)[number],
    );
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof NotCmsAdminError) {
      return NextResponse.json({ error: 'Forbidden', code: 'NOT_CMS_ADMIN' }, { status: 403 });
    }
    console.error('Unhandled error in POST /api/cms/admin/content/[id]/status:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
