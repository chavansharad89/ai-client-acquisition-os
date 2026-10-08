import { loadEnv } from '@acos/config';
import { findDeliverable, isValidProductId } from '@acos/catalog';
import {
  canAccessProduct,
  purchasedFrom,
  verifyDownloadGrant,
  type DownloadGrantRejection,
} from '@acos/core-entitlements';
import { resolveSession } from '@acos/core-identity';
import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../../src/server/commerceRepositories';
import { contentTypeFor, readDeliverableFile } from '../../../../../src/server/contentStore';
import { readSessionToken } from '../../../../../src/server/session';

// GET /api/downloads/[productId]/[assetId]?grant=...
// -----------------------------------------------------------------------
// Every check from the engineering design review's delivery.ts, adapted
// to session-based authorization (§6/§7): identity before entitlement
// before the link, so a stranger with a leaked URL is rejected before
// any token is even parsed.
//
//   1. A valid, unexpired SESSION (cookie) resolving to a real user.
//   2. That user holds a CLAIMED entitlement for the product (ladder-
//      aware) — entitlements.listActiveByUser, never
//      users.email == entitlements.customer_email.
//   3. The signed grant verifies, is unexpired, and names this same
//      user's email and this exact product/asset.
//   4. The asset id exists in the product's manifest.
//   5. The file actually exists in the content store — if not, this is
//      reported as not-yet-available, never fabricated.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let env: ReturnType<typeof loadEnv> | null = null;
function getEnv() {
  env ??= loadEnv();
  return env;
}

type DownloadDenial =
  | 'no-session'
  | 'invalid-session'
  | 'not-entitled'
  | 'unknown-asset'
  | 'not-yet-available'
  | `grant-${DownloadGrantRejection}`;

function denialResponse(reason: DownloadDenial): { status: number; message: string } {
  switch (reason) {
    case 'no-session':
    case 'invalid-session':
      return { status: 401, message: 'Log in to your account, then try again.' };
    case 'not-entitled':
      return { status: 403, message: 'This kit is not in your library.' };
    case 'unknown-asset':
      return { status: 404, message: 'That file does not exist.' };
    case 'not-yet-available':
      return { status: 404, message: 'This file is not available yet.' };
    case 'grant-expired':
      return { status: 410, message: 'This download link has expired. Refresh the page for a new one.' };
    default:
      return { status: 403, message: 'This download link is not valid.' };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string; assetId: string } },
) {
  const { productId, assetId } = params;
  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: 'Unknown product', code: 'UNKNOWN_PRODUCT' }, { status: 404 });
  }

  try {
    const { identity, entitlements } = commerceRepositories();

    const session = await resolveSession(identity, readSessionToken(request));
    if (!session.authenticated) {
      const { status, message } = denialResponse('no-session');
      return NextResponse.json({ error: message }, { status });
    }

    const [user, active] = await Promise.all([
      identity.findUserById(session.userId),
      entitlements.listActiveByUser(session.userId),
    ]);
    if (!user) {
      const { status, message } = denialResponse('invalid-session');
      return NextResponse.json({ error: message }, { status });
    }

    const purchased = purchasedFrom(active);
    if (!canAccessProduct(purchased, productId)) {
      const { status, message } = denialResponse('not-entitled');
      return NextResponse.json({ error: message }, { status });
    }

    const grant = request.nextUrl.searchParams.get('grant');
    if (!grant) {
      const { status, message } = denialResponse('grant-malformed');
      return NextResponse.json({ error: message }, { status });
    }
    const verdict = verifyDownloadGrant(grant, getEnv().DOWNLOAD_GRANT_SECRET, user.email);
    if (!verdict.valid) {
      const { status, message } = denialResponse(`grant-${verdict.reason}`);
      return NextResponse.json({ error: message }, { status });
    }
    if (verdict.claims.productId !== productId || verdict.claims.assetId !== assetId) {
      const { status, message } = denialResponse('grant-bad-signature');
      return NextResponse.json({ error: message }, { status });
    }

    const asset = findDeliverable(productId, assetId);
    if (!asset) {
      const { status, message } = denialResponse('unknown-asset');
      return NextResponse.json({ error: message }, { status });
    }

    const bytes = await readDeliverableFile(asset.storageKey);
    if (!bytes) {
      const { status, message } = denialResponse('not-yet-available');
      return NextResponse.json({ error: message }, { status });
    }

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': contentTypeFor(asset.kind),
        'Content-Disposition': `attachment; filename="${asset.id}"`,
        'Content-Length': String(bytes.byteLength),
      },
    });
  } catch (err) {
    console.error('Unhandled error in GET /api/downloads/[productId]/[assetId]:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
