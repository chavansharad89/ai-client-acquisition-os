import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// Access tokens — the proof that the person is the customer.
// -----------------------------------------------------------------------
// The buyer receives an opaque token by email. Only its SHA-256 is stored,
// so a database disclosure yields nothing usable. The token is high
// entropy and single-purpose, so a plain digest is correct here — a work
// factor exists to slow guessing of low-entropy human passwords, and
// would only slow every legitimate request.
// -----------------------------------------------------------------------

/** 32 bytes of CSPRNG entropy, base64url — no padding, URL and cookie safe. */
export const ACCESS_TOKEN_BYTES = 32;

/** Long enough to be convenient, short enough to limit a leaked link. */
export const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface MintedAccessToken {
  /** Give this to the customer once. It is never recoverable afterwards. */
  token: string;
  /** Store this. */
  tokenHash: string;
  expiresAt: Date;
}

export function mintAccessToken(now: Date = new Date()): MintedAccessToken {
  const token = randomBytes(ACCESS_TOKEN_BYTES).toString('base64url');
  return {
    token,
    tokenHash: hashAccessToken(token),
    expiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_MS),
  };
}

export function hashAccessToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Compares two token hashes without leaking timing.
 *
 * Lookup is by hash, so the database index already does the matching;
 * this exists for the case where a caller compares a candidate against a
 * known hash directly, and keeps that path from becoming the weak one.
 */
export function accessTokenHashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type AccessTokenRejection = 'unknown' | 'expired' | 'revoked';

export interface StoredAccessToken {
  customerEmail: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export type AccessTokenVerdict =
  { valid: true; customerEmail: string } | { valid: false; reason: AccessTokenRejection };

/** Pure verdict for a looked-up token row. */
export function evaluateAccessToken(
  stored: StoredAccessToken | null,
  now: Date = new Date(),
): AccessTokenVerdict {
  if (!stored) return { valid: false, reason: 'unknown' };
  if (stored.revokedAt !== null) return { valid: false, reason: 'revoked' };
  if (stored.expiresAt.getTime() <= now.getTime()) return { valid: false, reason: 'expired' };
  return { valid: true, customerEmail: stored.customerEmail };
}
