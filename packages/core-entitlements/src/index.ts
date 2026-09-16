// core-entitlements
// -----------------------------------------------------------------------
// Owns: what a customer owns, what that implies, and whether a request
// may open a product.
// Must NOT: talk to Razorpay or Meta. Only core-payments' webhook handler
// and admin actions may grant or revoke.
//
// IDENTITY MODEL: entitlements are keyed on the customer's email, because
// this system has no users table and no authentication. Email is an
// identifier; the credential is an opaque access token (accessToken.ts)
// that is emailed after purchase and exchanged for a cookie. Nothing the
// browser stores about itself is ever consulted.
//
// See architecture spec §3 (Module Boundaries) and migration 0004.
// -----------------------------------------------------------------------

export {
  ACCESS_TOKEN_BYTES,
  ACCESS_TOKEN_TTL_MS,
  accessTokenHashesMatch,
  evaluateAccessToken,
  hashAccessToken,
  mintAccessToken,
} from './accessToken';
export type {
  AccessTokenRejection,
  AccessTokenVerdict,
  MintedAccessToken,
  StoredAccessToken,
} from './accessToken';

export { authorizeDownload, denialResponse } from './delivery';
export type { AuthorizeDownloadInput, DeliveryAuthorization, DeliveryDenial } from './delivery';
export {
  createDownloadGrant,
  DOWNLOAD_GRANT_TTL_MS,
  DownloadGrantError,
  verifyDownloadGrant,
} from './downloadGrant';
export type {
  DownloadGrantClaims,
  DownloadGrantRejection,
  DownloadGrantVerdict,
} from './downloadGrant';

export { requireProductAccess, resolveAccess } from './access';
export type { AccessDenial, AccessResolution } from './access';

export {
  accessibleProducts,
  canAccessProduct,
  funnelStateFor,
  isDuplicatePurchase,
  nextUpsell,
  postPurchaseDestination,
} from './funnel';

export { createPgEntitlementRepository } from './pgRepository';
export type { SqlExecutor } from './pgRepository';
export { normaliseEmail, purchasedFrom } from './repository';
export type { EntitlementRepository } from './repository';

export type {
  AccessContext,
  Entitlement,
  FunnelState,
  GrantEntitlementInput,
  GrantOutcome,
  GrantResult,
} from './types';

/**
 * Grants access to a product, provenanced by the order that paid for it.
 *
 * Idempotent on (customerEmail, productSlug) via the unique index added
 * in migration 0004, so a replayed webhook is a safe no-op.
 *
 * NOT WIRED YET: the only legitimate caller is
 * core-payments.handleRazorpayWebhook, which is not implemented. The
 * database enforces the rules this function must respect regardless —
 * an entitlement cannot exist without a CAPTURED payment, and cannot name
 * a different product or customer than its order.
 */
export async function grantEntitlement(): Promise<never> {
  throw new Error(
    'core-entitlements.grantEntitlement: no production caller yet — the webhook handler that ' +
      'would call this is unimplemented. Use EntitlementRepository.grant directly from that ' +
      'handler when it is written.',
  );
}

export { REISSUE_ACKNOWLEDGEMENT, reissueAccessToken } from './reissue';
export type { ReissueOutcome, ReissueRefusal } from './reissue';
