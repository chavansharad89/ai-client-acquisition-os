import type { StoredUser } from './types';

/** A row read from `access_tokens`, projected to only what session resolution needs. */
export interface StoredSessionToken {
  /** NULL means the row is an entitlement credential, not a session (PRD V2.1 "ACCESS TOKEN RULE"). */
  userId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * Persistence boundary for identity. Mirrors core-entitlements'
 * EntitlementRepository so this can be tested against a fake and so only
 * this interface (plus core-entitlements' own) touches `access_tokens`.
 */
export interface IdentityRepository {
  /**
   * Creates a user row. `passwordHash` is optional: out-of-band
   * provisioning (R-02's existing, unrelated path) still calls this with
   * only an email; self-service signup (the ₹99 claim flow, DEC-010
   * item 2) supplies a hash from the start. Nothing here accepts a
   * caller-asserted email for that flow — see @acos/core-entitlements'
   * claim-token mechanism, which is what derives the email server-side.
   */
  createUser(input: { email: string; passwordHash?: string }, now: Date): Promise<StoredUser>;

  findUserByEmail(email: string): Promise<StoredUser | null>;

  /** For the post-claim library path, which only has a session's userId to start from. */
  findUserById(id: string): Promise<StoredUser | null>;

  /** For login only — never returned from findUserByEmail, to keep the hash out of general-purpose user lookups. */
  findCredentialsByEmail(email: string): Promise<StoredCredentials | null>;

  /** Looks a session up BY HASH. The plaintext token never reaches the database. */
  findSessionToken(tokenHash: string): Promise<StoredSessionToken | null>;

  saveSessionToken(input: {
    tokenHash: string;
    userId: string;
    customerEmail: string;
    expiresAt: Date;
    now: Date;
  }): Promise<void>;

  /** Logout: revokes a session token. Returns false if already revoked/unknown. */
  revokeSessionToken(tokenHash: string, now: Date): Promise<boolean>;
}

export interface StoredCredentials {
  id: string;
  email: string;
  /** Null for an out-of-band-provisioned row that has never set a password. */
  passwordHash: string | null;
}
