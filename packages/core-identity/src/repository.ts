import type { StoredActivationToken } from './activationToken';
import type { StoredUser } from './types';

/** A row read from `access_tokens`, projected to only what session resolution needs. */
export interface StoredSessionToken {
  /** NULL means the row is an entitlement credential, not a session (PRD V2.1 "ACCESS TOKEN RULE"). */
  userId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * Auth-state projection for a single user, by id — kept separate from
 * `StoredUser`/`findUserById` (which never carries password_hash, same
 * reason `findCredentialsByEmail` is its own method) because activation
 * consume (AUTH Phase 2) is the one place that needs both
 * password_hash-IS-NULL (AUTH-PO-09's branch condition) and
 * email_verified_at in the same read.
 */
export interface StoredUserAuthState {
  id: string;
  email: string;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
}

/** Fields an existing dormant row (password_hash IS NULL) may set exactly once, at account setup. Never fabricated, never required of an existing-password account (AUTH-PO-17). */
export interface AccountSetupInput {
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: Date;
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

  /**
   * AUTH-PO-25: resolves the `users` row for this normalized email,
   * creating a password-less (dormant) row if none exists yet. The
   * dormant row represents the eventual identity but cannot
   * authenticate — `password_hash` is NULL until a future activation
   * flow sets one. If a row already exists (with or without a
   * password), it is returned unchanged: this never overwrites an
   * existing `password_hash`. Idempotent under concurrent callers for
   * the same email via `users.email`'s existing UNIQUE constraint — at
   * most one row is ever created.
   */
  findOrCreateUser(email: string, now: Date): Promise<StoredUser>;

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

  /** AUTH Phase 2: the password_hash/email_verified_at projection activation-consume needs. Never returned from findUserById/findUserByEmail. */
  findUserAuthStateById(id: string): Promise<StoredUserAuthState | null>;

  /**
   * Mints + persists a new activation token for `userId`, invalidating
   * any previous unconsumed, non-invalidated token for that SAME
   * user_id first (AUTH-PO-07 latest-link-wins) — mirrors
   * core-entitlements' saveClaimToken, keyed by user_id instead of
   * order_id (design §5).
   */
  saveActivationToken(input: { tokenHash: string; userId: string; expiresAt: Date; now: Date }): Promise<void>;

  /** Looks an activation token up BY HASH. The plaintext token never reaches the database. */
  findActivationToken(tokenHash: string): Promise<StoredActivationToken | null>;

  /** The single-use gate: atomic `UPDATE ... WHERE consumed_at IS NULL AND invalidated_at IS NULL`. Returns false if already consumed/invalidated/unknown. */
  consumeActivationToken(tokenHash: string, now: Date): Promise<boolean>;

  /** Sets `email_verified_at` exactly once (AUTH-PO-02) — idempotent to call again (never un-sets, never advances a timestamp that is already set). */
  setEmailVerified(userId: string, now: Date): Promise<void>;

  /**
   * Account setup (AUTH-PO-03/09): writes profile + password ONLY when
   * `password_hash IS NULL` at the moment of the write — the WHERE
   * clause is the enforcement, not a pre-read-then-write race. Returns
   * false (and writes nothing) if the row already had a password by the
   * time this ran, so an existing password is never overwritten even
   * under a concurrent retry.
   */
  completeAccountSetup(userId: string, input: AccountSetupInput, now: Date): Promise<boolean>;
}

export interface StoredCredentials {
  id: string;
  email: string;
  /** Null for an out-of-band-provisioned row that has never set a password. */
  passwordHash: string | null;
}
