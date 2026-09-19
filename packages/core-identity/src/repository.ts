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
  /** Out-of-band provisioning creates the row; there is no self-service signup (R-02, FUTURE). */
  createUser(input: { email: string }, now: Date): Promise<StoredUser>;

  findUserByEmail(email: string): Promise<StoredUser | null>;

  /** Looks a session up BY HASH. The plaintext token never reaches the database. */
  findSessionToken(tokenHash: string): Promise<StoredSessionToken | null>;

  saveSessionToken(input: {
    tokenHash: string;
    userId: string;
    customerEmail: string;
    expiresAt: Date;
    now: Date;
  }): Promise<void>;
}
