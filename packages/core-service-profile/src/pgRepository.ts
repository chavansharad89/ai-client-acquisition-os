import type { SqlExecutor } from '@acos/core-entitlements';

import type { ServiceProfileRepository } from './repository';
import type { ServiceProfileFields, StoredServiceProfile } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching @acos/core-identity's
// pgRepository.ts and @acos/core-entitlements' — Prisma is not the query
// layer for this acquisition-domain table (migration 0013). Every query
// that touches a specific row filters on user_id in the WHERE clause
// itself, so a mismatched owner reads as "not found" rather than being
// filtered out after the fact.
// -----------------------------------------------------------------------

interface ServiceProfileRow {
  id: string;
  user_id: string;
  service: string;
  target_customer: string;
  geography: string;
  min_project_value_paise: number;
  triggers: string[];
  keywords: string[];
  rationale: string;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, user_id, service, target_customer, geography, min_project_value_paise,
                  triggers, keywords, rationale, created_at, updated_at`;

export function createPgServiceProfileRepository(sql: SqlExecutor): ServiceProfileRepository {
  return {
    async create(
      userId: string,
      input: ServiceProfileFields,
      now: Date,
    ): Promise<StoredServiceProfile> {
      const { rows } = await sql.query(
        `INSERT INTO service_profiles
           (id, user_id, service, target_customer, geography, min_project_value_paise,
            triggers, keywords, rationale, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING ${COLUMNS}`,
        [
          userId,
          input.service,
          input.targetCustomer,
          input.geography,
          input.minProjectValuePaise,
          input.triggers,
          input.keywords,
          input.rationale,
          now,
        ],
      );
      return mapRow(rows[0] as ServiceProfileRow);
    },

    async getById(userId: string, id: string): Promise<StoredServiceProfile | null> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM service_profiles WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      const row = rows[0] as ServiceProfileRow | undefined;
      return row ? mapRow(row) : null;
    },

    async list(userId: string): Promise<readonly StoredServiceProfile[]> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM service_profiles WHERE user_id = $1 ORDER BY created_at, id`,
        [userId],
      );
      return (rows as ServiceProfileRow[]).map(mapRow);
    },

    async update(
      userId: string,
      id: string,
      input: ServiceProfileFields,
      now: Date,
    ): Promise<StoredServiceProfile | null> {
      const { rows } = await sql.query(
        `UPDATE service_profiles
            SET service = $3, target_customer = $4, geography = $5,
                min_project_value_paise = $6, triggers = $7, keywords = $8,
                rationale = $9, updated_at = $10
          WHERE id = $1 AND user_id = $2
          RETURNING ${COLUMNS}`,
        [
          id,
          userId,
          input.service,
          input.targetCustomer,
          input.geography,
          input.minProjectValuePaise,
          input.triggers,
          input.keywords,
          input.rationale,
          now,
        ],
      );
      const row = rows[0] as ServiceProfileRow | undefined;
      return row ? mapRow(row) : null;
    },

    async delete(userId: string, id: string): Promise<boolean> {
      const { rowCount } = await sql.query(
        `DELETE FROM service_profiles WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      return (rowCount ?? 0) > 0;
    },
  };
}

function mapRow(row: ServiceProfileRow): StoredServiceProfile {
  return {
    id: row.id,
    userId: row.user_id,
    service: row.service,
    targetCustomer: row.target_customer,
    geography: row.geography,
    minProjectValuePaise: row.min_project_value_paise,
    triggers: row.triggers,
    keywords: row.keywords,
    rationale: row.rationale,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
