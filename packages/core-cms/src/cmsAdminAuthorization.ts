import type { CmsAdminRepository } from './cmsAdminRepository';
import type { CmsAdmin } from './types';

// CMS admin authorization primitive (CMS-PO-006(R3)).
// -----------------------------------------------------------------------
// `authenticated user -> administrator authorization -> CMS management
// capability`, kept entirely separate from
// `authenticated user -> active subscription -> permitted content`
// (customerContentService.ts/cmsContentService.ts). This module has no
// knowledge of subscriptions, entitlements, or payments -- its only
// input is an already-server-resolved `userId` (the output of
// `requireUser()`, @acos/core-identity), never a raw token, request
// body, header, or any other client-controlled value. A Plus/Pro/Max
// subscription cannot satisfy this check: `CmsAdminAuthorizationDeps`
// has exactly one dependency, `cmsAdmins`, and nothing else is ever
// consulted.
// -----------------------------------------------------------------------

/** Thrown by requireCmsAdmin(). Analogous to @acos/core-identity's UnauthenticatedError, for the "authenticated but not authorized" case (maps to 403, not 401). */
export class NotCmsAdminError extends Error {
  constructor() {
    super('not a CMS administrator');
    this.name = 'NotCmsAdminError';
  }
}

export interface CmsAdminAuthorizationDeps {
  cmsAdmins: CmsAdminRepository;
}

/**
 * The gate every CMS admin operation requires: resolves an
 * already-authenticated `userId` to their `cms_admins` membership, or
 * throws. Performs a live lookup on every call -- membership is never
 * cached or embedded in a session/token, so revoking it (deleting the
 * row) takes effect immediately on the next check, with no token
 * regeneration required.
 */
export async function requireCmsAdmin(
  deps: CmsAdminAuthorizationDeps,
  userId: string,
): Promise<CmsAdmin> {
  const admin = await deps.cmsAdmins.findByUserId(userId);
  if (!admin) throw new NotCmsAdminError();
  return admin;
}
