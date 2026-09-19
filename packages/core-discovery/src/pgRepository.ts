import type { SqlExecutor } from '@acos/core-entitlements';

import type { CompanyRepository, ProspectRepository } from './repository';
import type { ProspectStatus, StoredCompany, StoredProspect } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching @acos/core-search's
// pgRepository.ts (migration 0014) — Prisma is not the query layer for
// these acquisition-domain tables (migration 0015). Every query that
// touches a specific row filters on user_id in the WHERE/ON CONFLICT
// clause itself, so a mismatched owner reads as "not found" rather than
// being filtered out after the fact.
//
// Both find-or-create methods use INSERT ... ON CONFLICT DO UPDATE
// (a no-op self-assignment) rather than DO NOTHING, specifically so the
// existing row is still returned via RETURNING on a conflict — this is
// what makes repeated/retried discovery idempotent at the database
// level (R-08's UNIQUE(search_id, company_id), DEC-005's
// UNIQUE(user_id, normalized_domain)), not just in application code.
// -----------------------------------------------------------------------

interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  normalized_domain: string;
  created_at: Date;
}

const COMPANY_COLUMNS = `id, user_id, name, normalized_domain, created_at`;

export function createPgCompanyRepository(sql: SqlExecutor): CompanyRepository {
  return {
    async findOrCreateByDomain(
      userId: string,
      input: { name: string; normalizedDomain: string },
      now: Date,
    ): Promise<StoredCompany> {
      const { rows } = await sql.query(
        `INSERT INTO companies (id, user_id, name, normalized_domain, created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
         ON CONFLICT (user_id, normalized_domain)
         DO UPDATE SET name = companies.name
         RETURNING ${COMPANY_COLUMNS}`,
        [userId, input.name, input.normalizedDomain, now],
      );
      return mapCompanyRow(rows[0] as CompanyRow);
    },

    async getById(userId: string, id: string): Promise<StoredCompany | null> {
      const { rows } = await sql.query(
        `SELECT ${COMPANY_COLUMNS} FROM companies WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      const row = rows[0] as CompanyRow | undefined;
      return row ? mapCompanyRow(row) : null;
    },
  };
}

function mapCompanyRow(row: CompanyRow): StoredCompany {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    normalizedDomain: row.normalized_domain,
    createdAt: new Date(row.created_at),
  };
}

interface ProspectRow {
  id: string;
  user_id: string;
  search_id: string;
  company_id: string;
  status: ProspectStatus;
  created_at: Date;
}

const PROSPECT_COLUMNS = `id, user_id, search_id, company_id, status, created_at`;

export function createPgProspectRepository(sql: SqlExecutor): ProspectRepository {
  return {
    async findOrCreate(
      userId: string,
      input: { searchId: string; companyId: string },
      now: Date,
    ): Promise<StoredProspect> {
      const { rows } = await sql.query(
        `INSERT INTO prospects (id, user_id, search_id, company_id, status, created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'DISCOVERED', $4)
         ON CONFLICT (search_id, company_id)
         DO UPDATE SET status = prospects.status
         RETURNING ${PROSPECT_COLUMNS}`,
        [userId, input.searchId, input.companyId, now],
      );
      return mapProspectRow(rows[0] as ProspectRow);
    },

    async listBySearch(userId: string, searchId: string): Promise<readonly StoredProspect[]> {
      const { rows } = await sql.query(
        `SELECT ${PROSPECT_COLUMNS} FROM prospects
          WHERE user_id = $1 AND search_id = $2
          ORDER BY created_at, id`,
        [userId, searchId],
      );
      return (rows as ProspectRow[]).map(mapProspectRow);
    },

    async getById(userId: string, id: string): Promise<StoredProspect | null> {
      const { rows } = await sql.query(
        `SELECT ${PROSPECT_COLUMNS} FROM prospects WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      const row = rows[0] as ProspectRow | undefined;
      return row ? mapProspectRow(row) : null;
    },
  };
}

function mapProspectRow(row: ProspectRow): StoredProspect {
  return {
    id: row.id,
    userId: row.user_id,
    searchId: row.search_id,
    companyId: row.company_id,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}
