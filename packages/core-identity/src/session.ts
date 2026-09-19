import { hashAccessToken, mintAccessToken } from '@acos/core-entitlements';

import type { IdentityRepository, StoredSessionToken } from './repository';

// Server-side session resolution.
// -----------------------------------------------------------------------
// Reuses the exact token primitive core-entitlements already has —
// opaque CSPRNG token, SHA-256 hash storage, timing-safe lookup — rather
// than introducing a second credential mechanism. The only new thing is
// the rule this module enforces: a row is a SESSION only when
// access_tokens.user_id is set. An entitlement token (user_id IS NULL)
// is rejected here, never treated as a login.
// -----------------------------------------------------------------------

export type SessionRejection =
  'no-token' | 'unknown-token' | 'expired' | 'revoked' | 'not-a-session';

export type SessionVerdict =
  { valid: true; userId: string } | { valid: false; reason: SessionRejection };

export type SessionResolution =
  { authenticated: true; userId: string } | { authenticated: false; reason: SessionRejection };

/** Pure verdict for a looked-up token row. `userId === null` is an entitlement token, not a session. */
export function evaluateSessionToken(
  stored: StoredSessionToken | null,
  now: Date = new Date(),
): SessionVerdict {
  if (!stored) return { valid: false, reason: 'unknown-token' };
  if (stored.revokedAt !== null) return { valid: false, reason: 'revoked' };
  if (stored.expiresAt.getTime() <= now.getTime()) return { valid: false, reason: 'expired' };
  if (stored.userId === null) return { valid: false, reason: 'not-a-session' };
  return { valid: true, userId: stored.userId };
}

/**
 * Resolves a raw session token into a server-derived userId.
 *
 * `rawToken` is whatever arrived in the cookie — untrusted. It is hashed
 * before it touches the database, exactly as the entitlement token path
 * does, so it is never logged or compared in plaintext.
 */
export async function resolveSession(
  repository: IdentityRepository,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<SessionResolution> {
  if (!rawToken) return { authenticated: false, reason: 'no-token' };

  const stored = await repository.findSessionToken(hashAccessToken(rawToken));
  const verdict = evaluateSessionToken(stored, now);
  if (!verdict.valid) return { authenticated: false, reason: verdict.reason };

  return { authenticated: true, userId: verdict.userId };
}

/** Thrown by requireUser(). Carries the reason so a route can map it to a response without re-deriving it. */
export class UnauthenticatedError extends Error {
  readonly reason: SessionRejection;

  constructor(reason: SessionRejection) {
    super(`unauthenticated: ${reason}`);
    this.name = 'UnauthenticatedError';
    this.reason = reason;
  }
}

/**
 * The gate every user-owned repository or route requires: resolves a
 * session token to a userId, or throws.
 *
 * Takes no `userId` argument and accepts none from its caller — the only
 * input is the opaque token, the only output is the id the database
 * attached to it (DEC-003). A token whose `user_id IS NULL` — an
 * entitlement credential — is rejected here, not treated as a session
 * (PRD V2.1 "ACCESS TOKEN RULE", PFR-13).
 */
export async function requireUser(
  repository: IdentityRepository,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<string> {
  const resolution = await resolveSession(repository, rawToken, now);
  if (!resolution.authenticated) throw new UnauthenticatedError(resolution.reason);
  return resolution.userId;
}

export interface MintedSession {
  /** Give this to the client once (e.g. as a cookie value). It is never recoverable afterwards. */
  token: string;
  expiresAt: Date;
}

/**
 * Mints a session token for an already-provisioned user.
 *
 * R-02: self-service signup is FUTURE; MVP identity is provisioned out
 * of band, so this is the mint path for a user row that already exists.
 * It reuses mintAccessToken/ACCESS_TOKEN_TTL_MS unchanged — OQ-1 (whether
 * a session should have a shorter TTL than a purchased-product
 * credential) is an open product question, and choosing a second
 * constant here would silently resolve it.
 */
export async function mintUserSession(
  repository: IdentityRepository,
  user: { id: string; email: string },
  now: Date = new Date(),
): Promise<MintedSession> {
  const minted = mintAccessToken(now);
  await repository.saveSessionToken({
    tokenHash: minted.tokenHash,
    userId: user.id,
    customerEmail: user.email,
    expiresAt: minted.expiresAt,
    now,
  });
  return { token: minted.token, expiresAt: minted.expiresAt };
}
