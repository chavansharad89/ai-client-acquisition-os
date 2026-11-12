import { CmsValidationError, isCmsEligibleProduct, NotCmsAdminError, requireCmsAdmin, resolveDisplayName, setDisplayNameOverride } from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../../src/server/commerceRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// GET  /api/cms/admin/display-names/[productId] — the configured
//      display name (CMS override if set, else the catalog default)
//      plus the raw override row, if any.
// POST /api/cms/admin/display-names/[productId] — set/update the CMS
//      override (CMS-PO-001). `productId` in the URL identifies WHICH
//      row to read/write -- it is never writable itself, and no body
//      field can change it: ProductId/SKU identity, historical
//      purchases, entitlements, and subscription_periods are untouched
//      by this route, exactly as setDisplayNameOverride() already
//      guarantees.
// -----------------------------------------------------------------------
// `request -> requireUser -> requireCmsAdmin -> CMS admin service ->
// repository` (CMS-PO-006(R3)/CMS-PO-007(R3)/CMS-PO-008). Restricted to
// the three CMS-eligible products -- reading/writing a display name for
// any other ProductId is out of scope of CMS administration and
// rejected here, even though `resolveDisplayName` itself is generic
// over any ProductId.
//
// `updatedBy` is always the authenticated admin's own server-resolved
// `userId` -- never read from the request body, so it can never carry
// a client-controlled value (same principle as `cms_admins.created_by`).
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { identity, cmsAdmins, planDisplayNames } = commerceRepositories();
    const userId = await requireUser(identity, readSessionToken(request));
    await requireCmsAdmin({ cmsAdmins }, userId);

    if (!isCmsEligibleProduct(params.productId)) {
      return NextResponse.json(
        { error: `'${params.productId}' is not a CMS-eligible product`, code: 'VALIDATION_ERROR', field: 'productId' },
        { status: 400 },
      );
    }

    const [displayName, override] = await Promise.all([
      resolveDisplayName({ planDisplayNames }, params.productId),
      planDisplayNames.findByProductId(params.productId),
    ]);
    return NextResponse.json({ productId: params.productId, displayName, override }, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof NotCmsAdminError) {
      return NextResponse.json({ error: 'Forbidden', code: 'NOT_CMS_ADMIN' }, { status: 403 });
    }
    console.error('Unhandled error in GET /api/cms/admin/display-names/[productId]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { identity, cmsAdmins, planDisplayNames } = commerceRepositories();
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
    const displayName = (body as Record<string, unknown> | null)?.displayName;
    if (typeof displayName !== 'string') {
      return NextResponse.json(
        { error: 'displayName must be a string', code: 'VALIDATION_ERROR', field: 'displayName' },
        { status: 400 },
      );
    }

    const updated = await setDisplayNameOverride(
      { planDisplayNames },
      params.productId,
      displayName,
      userId,
    );
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
    console.error('Unhandled error in POST /api/cms/admin/display-names/[productId]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
