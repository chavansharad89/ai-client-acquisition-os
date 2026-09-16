import type { ProductId } from '@acos/catalog';

import { mintAccessToken } from './accessToken';
import { normaliseEmail, purchasedFrom, type EntitlementRepository } from './repository';

// Re-issuing an access token.
// -----------------------------------------------------------------------
// THE PROBLEM. An access token lives 30 days. An entitlement lives
// forever — the table has `revoked_at` but no expiry, deliberately,
// because a purchase does not stop having happened. Nothing existed to
// mint a replacement token, so on day 31 a paying customer lost access to
// something they still owned. The credential expired and took the
// purchase with it, which is the wrong way round.
//
// THE FIX IS DELIBERATELY NOT IN THE ENTITLEMENT MODEL. Entitlements were
// already right. What was missing was a way to hand a customer a fresh
// credential for the entitlement they still hold, so this file adds
// exactly that and changes nothing else. Extending the token's life, or
// making it non-expiring, would have traded a recoverable inconvenience
// for a permanent one: a leaked link that never stops working.
//
// WHAT AUTHORISES A RE-ISSUE. Possession of the email address, proved by
// receiving the new link at it — which is precisely how the FIRST token
// was delivered. This introduces no new trust assumption; it reuses the
// one the purchase already made. It is the caller's job to send the token
// to the address rather than return it in an HTTP response.
//
// ENUMERATION. The refusal carries no detail and no identifier, because
// the caller MUST answer identically whether or not the address has
// entitlements. "We have emailed you a link if that address has
// purchases" is the only safe response; anything that distinguishes the
// two turns this into an oracle for who has bought what.
// -----------------------------------------------------------------------

export type ReissueRefusal =
  /** No live entitlement for that address — unpaid, or every one revoked. */
  | 'no-entitlement'
  /** The address was not usable as an address. */
  | 'invalid-email';

export type ReissueOutcome =
  | {
      issued: true;
      /**
       * Plaintext, returned EXACTLY ONCE and never stored. Send it to
       * `customerEmail` — do not put it in a response body, a log, or a
       * redirect URL.
       */
      token: string;
      expiresAt: Date;
      customerEmail: string;
      /** What the new token will open. Useful for the email body. */
      products: readonly ProductId[];
    }
  | { issued: false; reason: ReissueRefusal };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mints a fresh access token for a customer who still holds entitlements.
 *
 * The entitlement is re-read at re-issue time and is the only thing that
 * decides. That matters in both directions: a refunded customer cannot
 * obtain a new token, and — because resolveAccess recomputes from
 * entitlements on every request — a customer refunded AFTER a re-issue
 * does not keep access via the token they were given. The token proves
 * who you are; the entitlement decides what you may open.
 *
 * Existing tokens are deliberately left alone. Revoking them would log a
 * customer out of their other device to serve a request they made on this
 * one, and nothing about a re-issue implies the old link was compromised.
 */
export async function reissueAccessToken(
  repository: EntitlementRepository,
  rawEmail: string,
  now: Date = new Date(),
): Promise<ReissueOutcome> {
  const trimmed = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (!trimmed || trimmed.length > 320 || !EMAIL_PATTERN.test(trimmed)) {
    return { issued: false, reason: 'invalid-email' };
  }

  const customerEmail = normaliseEmail(trimmed);
  const entitlements = await repository.listActive(customerEmail);

  // The gate. `listActive` excludes revoked rows, so this is "does this
  // person currently own anything?" — not "did they ever pay?".
  if (entitlements.length === 0) {
    return { issued: false, reason: 'no-entitlement' };
  }

  const minted = mintAccessToken(now);
  // Only the hash is persisted; the plaintext exists in memory long
  // enough to be emailed and nowhere else.
  await repository.saveAccessToken({
    tokenHash: minted.tokenHash,
    customerEmail,
    expiresAt: minted.expiresAt,
    now,
  });

  return {
    issued: true,
    token: minted.token,
    expiresAt: minted.expiresAt,
    customerEmail,
    products: purchasedFrom(entitlements),
  };
}

/**
 * The response every caller must give, whatever the outcome.
 *
 * Exported as a function rather than left to each route, because "always
 * answer the same way" is the kind of rule that survives exactly as long
 * as the person who knew it. Take the token from the outcome, email it,
 * and return THIS regardless.
 */
export const REISSUE_ACKNOWLEDGEMENT = {
  status: 202,
  message:
    'If that address has purchases, a new download link is on its way. ' +
    'Check your inbox, including spam.',
} as const;
