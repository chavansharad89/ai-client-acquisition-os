import { normaliseEmail } from '@acos/core-entitlements';
import type { SqlExecutor } from '@acos/core-entitlements';

import type { IdentityRepository, StoredCredentials, StoredSessionToken } from './repository';
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
  };
}

function mapUserRow(row: UserRow): StoredUser {
  return { id: row.id, email: row.email, createdAt: new Date(row.created_at) };
}
