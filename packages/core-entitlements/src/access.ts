import type { ProductId } from '@acos/catalog';

import { evaluateAccessToken, hashAccessToken } from './accessToken';
import { canAccessProduct, funnelStateFor } from './funnel';
import { normaliseEmail, purchasedFrom, type EntitlementRepository } from './repository';
import type { AccessContext, FunnelState } from './types';

// Server-side access resolution.
// -----------------------------------------------------------------------
// The single entry point a page uses to answer "who is this, and what may
// they open". It takes a raw token from a cookie and returns entitlements
// resolved from the database — never from anything the client asserts.
// -----------------------------------------------------------------------

export type AccessDenial = 'no-token' | 'invalid-token' | 'not-entitled';

export type AccessResolution =
  | { granted: true; context: AccessContext; funnel: FunnelState }
  | { granted: false; reason: AccessDenial; funnel: FunnelState };

const ANONYMOUS_FUNNEL = funnelStateFor([]);

/**
 * Resolves a raw access token into entitlements.
 *
 * `rawToken` is whatever arrived in the cookie — untrusted. It is hashed
 * before it touches the database, so a token is never logged or compared
 * in plaintext, and an unknown token is indistinguishable from an expired
 * one to the caller beyond the reason code.
 */
export async function resolveAccess(
  repository: EntitlementRepository,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<AccessResolution> {
  if (!rawToken) return { granted: false, reason: 'no-token', funnel: ANONYMOUS_FUNNEL };

  const stored = await repository.findAccessToken(hashAccessToken(rawToken));
  const verdict = evaluateAccessToken(stored, now);
  if (!verdict.valid) {
    return { granted: false, reason: 'invalid-token', funnel: ANONYMOUS_FUNNEL };
  }

  const entitlements = await repository.listActive(normaliseEmail(verdict.customerEmail));
  const purchased = purchasedFrom(entitlements);

  return {
    granted: true,
    context: { customerEmail: verdict.customerEmail, purchased },
    funnel: funnelStateFor(purchased),
  };
}

/**
 * Guard for a protected product page.
 *
 * Returns the reason rather than throwing, so a route can redirect an
 * anonymous visitor to checkout and an entitled-but-wrong-product visitor
 * to the upsell — two very different journeys that a boolean would
 * collapse into one dead end.
 */
export async function requireProductAccess(
  repository: EntitlementRepository,
  rawToken: string | undefined | null,
  productId: ProductId,
  now: Date = new Date(),
): Promise<AccessResolution> {
  const resolution = await resolveAccess(repository, rawToken, now);
  if (!resolution.granted) return resolution;
  if (!canAccessProduct(resolution.context.purchased, productId)) {
    return { granted: false, reason: 'not-entitled', funnel: resolution.funnel };
  }
  return resolution;
}
