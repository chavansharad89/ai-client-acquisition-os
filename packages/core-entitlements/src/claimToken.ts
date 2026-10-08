import { randomBytes, timingSafeEqual } from 'node:crypto';

import { hashAccessToken } from './accessToken';

// Claim tokens — single-use proof that a specific order's entitlement
// may be claimed into an account.
// -----------------------------------------------------------------------
// Deliberately NOT access_tokens' 30-day, reusable, entitlement/session
// credential — a claim is minutes-lived and single-use, bound to one
// order. Reuses access_tokens' hashing primitive (SHA-256, same
// rationale: high-entropy, single-purpose, no work factor needed), not
// its table or TTL.
// -----------------------------------------------------------------------

/**
 * DEC-014 D2: 24 hours from issuance. The claim link is delivered by
 * email rather than shown in-browser (DEC-014 D1), so the window must
 * survive the buyer leaving the checkout tab and opening their inbox
 * later — a same-session TTL (this used to be 30 minutes) no longer
 * fits once the link's only path to the buyer is email.
 */
export const CLAIM_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface MintedClaimToken {
  /** Returned to the browser once. Never stored. */
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function mintClaimToken(now: Date = new Date()): MintedClaimToken {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashAccessToken(token),
    expiresAt: new Date(now.getTime() + CLAIM_TOKEN_TTL_MS),
  };
}

export interface StoredClaimToken {
  orderId: string;
  /** Server-derived at mint time from the order/entitlement — never from a client. */
  customerEmail: string;
  expiresAt: Date;
  claimedAt: Date | null;
  /**
   * Set when a newer claim token was issued for the same order
   * (DEC-014 D4: latest-link-wins). Distinct from claimedAt — this
   * token was never used, it was superseded.
   */
  invalidatedAt: Date | null;
}

export type ClaimTokenRejection = 'unknown' | 'expired' | 'already-claimed' | 'superseded';

export type ClaimTokenVerdict =
  | { valid: true; orderId: string; customerEmail: string }
  | { valid: false; reason: ClaimTokenRejection };

/** Pure verdict for a looked-up claim-token row. Does not itself mark it claimed. */
export function evaluateClaimToken(
  stored: StoredClaimToken | null,
  now: Date = new Date(),
): ClaimTokenVerdict {
  if (!stored) return { valid: false, reason: 'unknown' };
  if (stored.claimedAt !== null) return { valid: false, reason: 'already-claimed' };
  if (stored.invalidatedAt !== null) return { valid: false, reason: 'superseded' };
  if (stored.expiresAt.getTime() <= now.getTime()) return { valid: false, reason: 'expired' };
  return { valid: true, orderId: stored.orderId, customerEmail: stored.customerEmail };
}

/** Constant-time compare, same rationale as accessTokenHashesMatch. */
export function claimTokenHashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
