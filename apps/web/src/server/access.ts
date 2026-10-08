import { funnelStateFor, purchasedFrom, type AccessResolution } from '@acos/core-entitlements';
import { resolveSession } from '@acos/core-identity';

import { commerceRepositories } from './commerceRepositories';
import { readSessionTokenFromServerComponent } from './session';

// Server-side access for pages — session-gated.
// -----------------------------------------------------------------------
// Resolves the `acos_session` cookie (the same core-identity session
// mechanism Client Finder already uses — DEC-010 §5 is exactly what
// activates it for this, a second, unrelated purpose) to a userId, then
// reads that user's CLAIMED entitlements (entitlements.user_id, migration
// 0038) — never the legacy ACCESS_COOKIE/email-token path, and never
// `users.email == entitlements.customer_email` as an access decision:
// only a completed claim (core-entitlements' claim-token mechanism)
// produces the user_id link this reads.
//
// An authenticated session with zero claimed entitlements (e.g. a
// Client-Finder-only account, or every entitlement revoked) resolves to
// "granted: true, purchased: []" rather than anonymous — the funnel
// state correctly reflects "signed in, owns nothing" and the existing
// /access page's upsell flow handles that case already.
// -----------------------------------------------------------------------

const ANONYMOUS: AccessResolution = {
  granted: false,
  reason: 'no-token',
  funnel: funnelStateFor([]),
};

/**
 * Resolves the current visitor's entitlements from their authenticated
 * session. Anonymous (no session, expired, revoked) resolves to
 * ANONYMOUS, same as before — protected pages still send a visitor to
 * checkout/login rather than opening up.
 */
export async function currentAccess(): Promise<AccessResolution> {
  const { identity, entitlements } = commerceRepositories();
  const resolution = await resolveSession(identity, readSessionTokenFromServerComponent());
  if (!resolution.authenticated) return ANONYMOUS;

  const [user, active] = await Promise.all([
    identity.findUserById(resolution.userId),
    entitlements.listActiveByUser(resolution.userId),
  ]);
  if (!user) return ANONYMOUS;

  const purchased = purchasedFrom(active);
  return {
    granted: true,
    context: { customerEmail: user.email, purchased },
    funnel: funnelStateFor(purchased),
  };
}
