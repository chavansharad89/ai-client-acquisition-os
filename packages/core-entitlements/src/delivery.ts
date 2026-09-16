import { findDeliverable, type Deliverable, type ProductId } from '@acos/catalog';

import { resolveAccess } from './access';
import { verifyDownloadGrant, type DownloadGrantRejection } from './downloadGrant';
import { canAccessProduct } from './funnel';
import type { EntitlementRepository } from './repository';

// Download authorisation — every check, in one place, in order.
// -----------------------------------------------------------------------
// A download is allowed only when ALL of these hold:
//
//   1. The request carries a valid, unexpired access token (cookie), and
//      that token resolves to a customer in the database.
//   2. That customer holds an entitlement for the product — directly or
//      through the ladder.
//   3. The signed grant verifies, has not expired, and names this same
//      customer.
//   4. The asset id exists in the product's manifest.
//
// Checked in that order deliberately: identity before entitlement before
// the link, so a stranger with a leaked URL is rejected at step 1 and
// never reaches code that parses their token.
// -----------------------------------------------------------------------

export type DeliveryDenial =
  | 'no-session'
  | 'invalid-session'
  | 'not-entitled'
  | 'unknown-asset'
  | `grant-${DownloadGrantRejection}`;

export type DeliveryAuthorization =
  | { allowed: true; asset: Deliverable; customerEmail: string }
  | { allowed: false; reason: DeliveryDenial };

export interface AuthorizeDownloadInput {
  repository: EntitlementRepository;
  /** Raw access-token cookie value. Untrusted. */
  accessToken: string | undefined | null;
  /** Signed grant from the URL. Untrusted. */
  grant: string | undefined | null;
  productId: ProductId;
  assetId: string;
  grantSecret: string;
  now?: Date;
}

export async function authorizeDownload({
  repository,
  accessToken,
  grant,
  productId,
  assetId,
  grantSecret,
  now = new Date(),
}: AuthorizeDownloadInput): Promise<DeliveryAuthorization> {
  // 1. Who is this?
  const access = await resolveAccess(repository, accessToken, now);
  if (!access.granted) {
    return {
      allowed: false,
      reason: access.reason === 'no-token' ? 'no-session' : 'invalid-session',
    };
  }

  // 2. Do they own it? Ladder implication applies — the top tier opens
  //    every lower kit's files.
  if (!canAccessProduct(access.context.purchased, productId)) {
    return { allowed: false, reason: 'not-entitled' };
  }

  // 3. Is this link real, current, and theirs?
  if (!grant) return { allowed: false, reason: 'grant-malformed' };
  const verdict = verifyDownloadGrant(grant, grantSecret, access.context.customerEmail, now);
  if (!verdict.valid) return { allowed: false, reason: `grant-${verdict.reason}` };
  if (verdict.claims.productId !== productId || verdict.claims.assetId !== assetId) {
    return { allowed: false, reason: 'grant-bad-signature' };
  }

  // 4. Does the asset exist? The storage key comes from the manifest, so
  //    no request-supplied string ever becomes a path.
  const asset = findDeliverable(productId, assetId);
  if (!asset) return { allowed: false, reason: 'unknown-asset' };

  return { allowed: true, asset, customerEmail: access.context.customerEmail };
}

/** Where a denied request should be sent, and what to say. */
export function denialResponse(reason: DeliveryDenial): { status: number; message: string } {
  switch (reason) {
    case 'no-session':
    case 'invalid-session':
      return { status: 401, message: 'Open the access link we emailed you, then try again.' };
    case 'not-entitled':
      return { status: 403, message: 'This kit is not in your library.' };
    case 'unknown-asset':
      return { status: 404, message: 'That file does not exist.' };
    case 'grant-expired':
      return {
        status: 410,
        message: 'This download link has expired. Refresh the page for a new one.',
      };
    default:
      // Malformed, bad signature and wrong customer collapse into one
      // response: distinguishing them would tell a prober which part of a
      // forged link was wrong.
      return { status: 403, message: 'This download link is not valid.' };
  }
}
