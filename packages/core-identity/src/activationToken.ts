import { randomBytes } from 'node:crypto';

import { hashAccessToken } from '@acos/core-entitlements';

// Activation tokens — single-use proof that a specific user_id's
// purchase may be activated (AUTH Phase 2).
// -----------------------------------------------------------------------
// Deliberately NOT claim_tokens: claim_tokens.order_id is NOT
// NULL/RESTRICT and is a ₹99/₹499 one-time-order concern (AUTH-PO-30:
// frozen for new purchases). Activation is bound to user_id — the
// identity/subscription lifecycle, per
// AUTH_PHASE_1_PURCHASE_IDENTITY_ACTIVATION_DESIGN.md §5. Reuses
// claim_tokens' entropy/hashing primitives unchanged (randomBytes(32)
// base64url, SHA-256 hex digest via hashAccessToken) rather than
// reinventing them.
// -----------------------------------------------------------------------

/** AUTH-PO-06/07/21: 24 hours from issuance. */
export const ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface MintedActivationToken {
  /** Returned to the browser (via the emailed link) once. Never stored. */
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function mintActivationToken(now: Date = new Date()): MintedActivationToken {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashAccessToken(token),
    expiresAt: new Date(now.getTime() + ACTIVATION_TOKEN_TTL_MS),
  };
}

export interface StoredActivationToken {
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
  /** Set when a newer token was issued for the same user_id (latest-link-wins, AUTH-PO-07). */
  invalidatedAt: Date | null;
}

export type ActivationTokenRejection = 'unknown' | 'expired' | 'already-consumed' | 'superseded';

export type ActivationTokenVerdict =
  | { valid: true; userId: string }
  | { valid: false; reason: ActivationTokenRejection };

/**
 * Pure verdict for a looked-up activation-token row. Does not itself
 * mark it consumed. Every HTTP caller MUST map every `valid: false`
 * reason to the SAME generic rejection — the reason itself must never
 * reach the client (design §5: distinguishing "never existed" from
 * "expired" from "already used" is an enumeration/timing signal).
 */
export function evaluateActivationToken(
  stored: StoredActivationToken | null,
  now: Date = new Date(),
): ActivationTokenVerdict {
  if (!stored) return { valid: false, reason: 'unknown' };
  if (stored.consumedAt !== null) return { valid: false, reason: 'already-consumed' };
  if (stored.invalidatedAt !== null) return { valid: false, reason: 'superseded' };
  if (stored.expiresAt.getTime() <= now.getTime()) return { valid: false, reason: 'expired' };
  return { valid: true, userId: stored.userId };
}
