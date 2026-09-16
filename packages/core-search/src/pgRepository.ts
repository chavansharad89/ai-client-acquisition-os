import type { SqlExecutor } from '@acos/core-entitlements';
import type { ServiceProfileFields } from '@acos/core-service-profile';

import type { SearchRepository } from './repository';
import type { SearchStatus, StoredSearch } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching
// @acos/core-service-profile's pgRepository.ts (migration 0013) and
// @acos/core-identity's — Prisma is not the query layer for this
// acquisition-domain table (migration 0014). Every query that touches a
// specific row filters on user_id in the WHERE clause itself, so a
// mismatched owner reads as "not found" rather than being filtered out
// after the fact.
// -----------------------------------------------------------------------

interface SearchRow {
  id: string;
  user_id: string;
  service_profile_id: string;
  status: SearchStatus;
  service: string;
  target_customer: string;
  geography: string;
  min_project_value_paise: number;
  triggers: string[];
  keywords: string[];
  rationale: string;
  attempts: number;
  last_error: string | null;
  lease_owner: string | null;
  lease_expires_at: Date | null;
  idempotency_key: string | null;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, user_id, service_profile_id, status, service, target_customer, geography,
                  min_project_value_paise, triggers, keywords, rationale, attempts, last_error,
                  lease_owner, lease_expires_at, idempotency_key, created_at, updated_at`;

export function createPgSearchRepository(sql: SqlExecutor): SearchRepository {
  return {
    /**
     * Raises a raw unique-violation error from Postgres (unmapped to any
     * domain error) if `input.idempotencyKey` is non-null and another row
     * for the same user already holds it — see migration 0014's partial
     * unique index. `service.ts`'s `createSearch` pre-checks via
     * `findByIdempotencyKey` to handle the sequential-retry case, but that
     * check-then-insert is NOT atomic; a genuinely concurrent duplicate
     * call can still reach this insert and throw here. See createSearch's
     * doc comment for the full statement of what is and isn't guaranteed.
     */
    async create(
      userId: string,
      input: {
        serviceProfileId: string;
        parameters: ServiceProfileFields;
        idempotencyKey: string | null;
      },
      now: Date,
    ): Promise<StoredSearch> {
      const { rows } = await sql.query(
        `INSERT INTO searches
           (id, user_id, service_profile_id, status, service, target_customer, geography,
            min_project_value_paise, triggers, keywords, rationale, attempts, last_error,
            lease_owner, lease_expires_at, idempotency_key, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'PENDING', $3, $4, $5, $6, $7, $8, $9,
                 0, NULL, NULL, NULL, $10, $11, $11)
         RETURNING ${COLUMNS}`,
        [
          userId,
          input.serviceProfileId,
          input.parameters.service,
          input.parameters.targetCustomer,
          input.parameters.geography,
          input.parameters.minProjectValuePaise,
          input.parameters.triggers,
          input.parameters.keywords,
          input.parameters.rationale,
          input.idempotencyKey,
          now,
        ],
      );
      return mapRow(rows[0] as SearchRow);
    },

    async findByIdempotencyKey(
      userId: string,
      idempotencyKey: string,
    ): Promise<StoredSearch | null> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM searches WHERE user_id = $1 AND idempotency_key = $2`,
        [userId, idempotencyKey],
      );
      const row = rows[0] as SearchRow | undefined;
      return row ? mapRow(row) : null;
    },

    async getById(userId: string, id: string): Promise<StoredSearch | null> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM searches WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      const row = rows[0] as SearchRow | undefined;
      return row ? mapRow(row) : null;
    },

    async list(userId: string): Promise<readonly StoredSearch[]> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM searches WHERE user_id = $1 ORDER BY created_at, id`,
        [userId],
      );
      return (rows as SearchRow[]).map(mapRow);
    },

    async transition(
      userId: string,
      id: string,
      from: SearchStatus,
      to: SearchStatus,
      options: { lastError: string | null },
      now: Date,
    ): Promise<StoredSearch | null> {
      const { rows } = await sql.query(
        `UPDATE searches
            SET status = $4,
                last_error = CASE WHEN $4 = 'FAILED' THEN $5 ELSE last_error END,
                attempts = CASE WHEN $4 = 'RUNNING' THEN attempts + 1 ELSE attempts END,
                updated_at = $6
          WHERE id = $1 AND user_id = $2 AND status = $3
          RETURNING ${COLUMNS}`,
        [id, userId, from, to, options.lastError, now],
      );
      const row = rows[0] as SearchRow | undefined;
      return row ? mapRow(row) : null;
    },
  };
}

function mapRow(row: SearchRow): StoredSearch {
  return {
    id: row.id,
    userId: row.user_id,
    serviceProfileId: row.service_profile_id,
    status: row.status,
    parameters: {
      service: row.service,
      targetCustomer: row.target_customer,
      geography: row.geography,
      minProjectValuePaise: row.min_project_value_paise,
      triggers: row.triggers,
      keywords: row.keywords,
      rationale: row.rationale,
    },
    attempts: row.attempts,
    lastError: row.last_error,
    leaseOwner: row.lease_owner,
    leaseExpiresAt: row.lease_expires_at ? new Date(row.lease_expires_at) : null,
    idempotencyKey: row.idempotency_key,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
