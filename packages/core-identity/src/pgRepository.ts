import { normaliseEmail } from '@acos/core-entitlements';
import type { SqlExecutor } from '@acos/core-entitlements';

import type { StoredActivationToken } from './activationToken';
import type {
  AccountSetupInput,
  IdentityRepository,
  StoredCredentials,
  StoredSessionToken,
  StoredUserAuthState,
} from './repository';
import type { StoredUser } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching core-entitlements'
// pgRepository.ts and the repository's established acquisition-domain
// pattern — Prisma is not the query layer here. `users` is a new table;
// `access_tokens` is the same table core-entitlements already owns, read
// and written here only through the `user_id` column added in migration
// 0012. Every other column of that table stays core-entitlements' concern.
// -----------------------------------------------------------------------

interface UserRow {
  id: string;
  email: string;
  created_at: Date;
}

export function createPgIdentityRepository(sql: SqlExecutor): IdentityRepository {
  return {
    async createUser({ email, passwordHash }, now: Date): Promise<StoredUser> {
      const { rows } = await sql.query(
        `INSERT INTO users (id, email, password_hash, created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3)
         RETURNING id, email, created_at`,
        [normaliseEmail(email), passwordHash ?? null, now],
      );
      return mapUserRow(rows[0] as UserRow);
    },

    async findOrCreateUser(email: string, now: Date): Promise<StoredUser> {
      const normalised = normaliseEmail(email);
      // ON CONFLICT DO NOTHING + fallback SELECT: `users.email` is
      // already UNIQUE, so a concurrent insert for the same email can
      // only ever leave one winner. The loser's INSERT returns no row,
      // and its SELECT reads back the winner's already-committed row —
      // never creating a second one, never touching that row's
      // password_hash.
      const { rows } = await sql.query(
        `INSERT INTO users (id, email, password_hash, created_at)
         VALUES (gen_random_uuid()::text, $1, NULL, $2)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, email, created_at`,
        [normalised, now],
      );
      const inserted = rows[0] as UserRow | undefined;
      if (inserted) return mapUserRow(inserted);

      const existing = await sql.query(`SELECT id, email, created_at FROM users WHERE email = $1`, [
        normalised,
      ]);
      return mapUserRow(existing.rows[0] as UserRow);
    },

    async findUserByEmail(email: string): Promise<StoredUser | null> {
      const { rows } = await sql.query(`SELECT id, email, created_at FROM users WHERE email = $1`, [
        normaliseEmail(email),
      ]);
      const row = rows[0] as UserRow | undefined;
      return row ? mapUserRow(row) : null;
    },

    async findUserById(id: string): Promise<StoredUser | null> {
      const { rows } = await sql.query(`SELECT id, email, created_at FROM users WHERE id = $1`, [id]);
      const row = rows[0] as UserRow | undefined;
      return row ? mapUserRow(row) : null;
    },

    async findCredentialsByEmail(email: string): Promise<StoredCredentials | null> {
      const { rows } = await sql.query(
        `SELECT id, email, password_hash FROM users WHERE email = $1`,
        [normaliseEmail(email)],
      );
      const row = rows[0] as { id: string; email: string; password_hash: string | null } | undefined;
      return row ? { id: row.id, email: row.email, passwordHash: row.password_hash } : null;
    },

    async revokeSessionToken(tokenHash: string, now: Date): Promise<boolean> {
      const { rowCount } = await sql.query(
        `UPDATE access_tokens SET revoked_at = $2
          WHERE token_hash = $1 AND revoked_at IS NULL AND user_id IS NOT NULL`,
        [tokenHash, now],
      );
      return (rowCount ?? 0) > 0;
    },

    async findSessionToken(tokenHash: string): Promise<StoredSessionToken | null> {
      const { rows } = await sql.query(
        `SELECT user_id, expires_at, revoked_at FROM access_tokens WHERE token_hash = $1`,
        [tokenHash],
      );
      const row = rows[0] as
        { user_id: string | null; expires_at: Date; revoked_at: Date | null } | undefined;
      if (!row) return null;
      return {
        userId: row.user_id,
        expiresAt: new Date(row.expires_at),
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
      };
    },

    async saveSessionToken({ tokenHash, userId, customerEmail, expiresAt, now }) {
      await sql.query(
        `INSERT INTO access_tokens (id, token_hash, customer_email, user_id, created_at, expires_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
        [tokenHash, normaliseEmail(customerEmail), userId, now, expiresAt],
      );
    },

    async findUserAuthStateById(id: string): Promise<StoredUserAuthState | null> {
      const { rows } = await sql.query(
        `SELECT id, email, password_hash, email_verified_at FROM users WHERE id = $1`,
        [id],
      );
      const row = rows[0] as
        | { id: string; email: string; password_hash: string | null; email_verified_at: Date | null }
        | undefined;
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at) : null,
      };
    },

    async saveActivationToken({ tokenHash, userId, expiresAt, now }) {
      // AUTH-PO-07 latest-link-wins — keyed by user_id (not order_id,
      // unlike claim_tokens): invalidate any previous unconsumed,
      // non-invalidated token for this user BEFORE inserting the new
      // one, so at most one token is ever live per user.
      await sql.query(
        `UPDATE activation_tokens SET invalidated_at = $2
           WHERE user_id = $1 AND consumed_at IS NULL AND invalidated_at IS NULL`,
        [userId, now],
      );
      await sql.query(
        `INSERT INTO activation_tokens (id, token_hash, user_id, created_at, expires_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
        [tokenHash, userId, now, expiresAt],
      );
    },

    async findActivationToken(tokenHash: string): Promise<StoredActivationToken | null> {
      const { rows } = await sql.query(
        `SELECT user_id, expires_at, consumed_at, invalidated_at
           FROM activation_tokens WHERE token_hash = $1`,
        [tokenHash],
      );
      const row = rows[0] as
        | { user_id: string; expires_at: Date; consumed_at: Date | null; invalidated_at: Date | null }
        | undefined;
      if (!row) return null;
      return {
        userId: row.user_id,
        expiresAt: new Date(row.expires_at),
        consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
        invalidatedAt: row.invalidated_at ? new Date(row.invalidated_at) : null,
      };
    },

    async consumeActivationToken(tokenHash: string, now: Date): Promise<boolean> {
      // Single-use gate, same idiom as markClaimTokenClaimed: the
      // database decides the one winner under concurrent attempts, not
      // a read-then-write race in the caller.
      const { rowCount } = await sql.query(
        `UPDATE activation_tokens SET consumed_at = $2
           WHERE token_hash = $1 AND consumed_at IS NULL AND invalidated_at IS NULL`,
        [tokenHash, now],
      );
      return (rowCount ?? 0) > 0;
    },

    async setEmailVerified(userId: string, now: Date): Promise<void> {
      // Idempotent: only ever moves NULL -> a timestamp, never
      // overwrites one already set (AUTH-PO-02 is "verified exactly
      // once", not "verified at the latest activation").
      await sql.query(
        `UPDATE users SET email_verified_at = $2 WHERE id = $1 AND email_verified_at IS NULL`,
        [userId, now],
      );
    },

    // `_now` is unused: `users` has no `updated_at` column to stamp. Kept
    // in the signature for consistency with every other write method on
    // this interface, which all take `now` explicitly rather than
    // calling `new Date()` themselves.
    async completeAccountSetup(userId: string, input: AccountSetupInput, _now: Date): Promise<boolean> {
      // AUTH-PO-09: the WHERE password_hash IS NULL clause is the
      // enforcement — an existing password can never be overwritten,
      // including under a concurrent retry (the loser's UPDATE matches
      // zero rows and returns false).
      const { rowCount } = await sql.query(
        `UPDATE users
            SET password_hash = $2, first_name = $3, last_name = $4, phone = $5, date_of_birth = $6
          WHERE id = $1 AND password_hash IS NULL`,
        [
          userId,
          input.passwordHash,
          input.firstName,
          input.lastName,
          input.phone,
          input.dateOfBirth ?? null,
        ],
      );
      return (rowCount ?? 0) > 0;
    },
  };
}

function mapUserRow(row: UserRow): StoredUser {
  return { id: row.id, email: row.email, createdAt: new Date(row.created_at) };
}
