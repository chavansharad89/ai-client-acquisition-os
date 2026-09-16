import { cookies } from 'next/headers';

import { funnelStateFor, type AccessResolution } from '@acos/core-entitlements';

// Server-side access for pages.
// -----------------------------------------------------------------------
// The cookie holds an opaque access token, httpOnly, so page JavaScript
// cannot read it and nothing in the browser can fabricate entitlement.
// Every protected page calls through here.
//
// WIRING NOTE: the EntitlementRepository is not constructed yet — the
// webhook handler that would grant entitlements and mint tokens is
// unimplemented, so there is nothing to read. Until then this resolves to
// "anonymous", which is the safe direction to fail: protected pages send
// visitors to checkout rather than opening up.
// -----------------------------------------------------------------------

export const ACCESS_COOKIE = 'acos_access';

const ANONYMOUS: AccessResolution = {
  granted: false,
  reason: 'no-token',
  funnel: funnelStateFor([]),
};

export function readAccessToken(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}

/**
 * Resolves the current visitor's entitlements.
 *
 * Returns anonymous until the entitlement repository is wired, so no page
 * can accidentally grant access on the strength of a cookie that nothing
 * validates yet.
 */
export async function currentAccess(): Promise<AccessResolution> {
  return ANONYMOUS;
}
