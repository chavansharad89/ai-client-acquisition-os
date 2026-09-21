import type { SqlExecutor } from '@acos/core-entitlements';

import type { QualificationRepository } from './repository';
import type {
  QualificationCriterionResult,
  QualificationEvaluation,
  StoredQualification,
} from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching @acos/core-opportunity's
// scorePgRepository.ts (migration 0018) and @acos/core-research's
// pgRepository.ts (migration 0016) — Prisma is not the query layer for
// acquisition-domain tables. `qualifications` carries no user_id
// (DEC-008, migration 0022); getByOpportunityId enforces ownership itself
// by joining to opportunities, rather than trusting the caller's already-
// checked Opportunity alone (belt and suspenders with ./service's own
// check).
//
// One current qualification per Opportunity: upsert always writes via
// INSERT ... ON CONFLICT (opportunity_id) DO UPDATE, never a second row.
// -----------------------------------------------------------------------

interface QualificationRow {
  id: string;
  opportunity_id: string;
  prospect_id: string;
  state: StoredQualification['state'];
  criteria: QualificationCriterionResult[];
  evidence_signal_ids: string[];
  evaluator_version: string;
  evaluated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, opportunity_id, prospect_id, state, criteria, evidence_signal_ids,
  evaluator_version, evaluated_at, created_at, updated_at`;

export function createPgQualificationRepository(sql: SqlExecutor): QualificationRepository {
  return {
    async upsert(
      opportunityId: string,
      prospectId: string,
      evaluation: QualificationEvaluation,
      evaluatorVersion: string,
      evaluatedAt: Date,
    ): Promise<StoredQualification> {
      const { rows } = await sql.query(
        `INSERT INTO qualifications
           (id, opportunity_id, prospect_id, state, criteria, evidence_signal_ids,
            evaluator_version, evaluated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5, $6, $7)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           prospect_id = EXCLUDED.prospect_id,
           state = EXCLUDED.state,
           criteria = EXCLUDED.criteria,
           evidence_signal_ids = EXCLUDED.evidence_signal_ids,
           evaluator_version = EXCLUDED.evaluator_version,
           evaluated_at = EXCLUDED.evaluated_at,
           updated_at = CURRENT_TIMESTAMP
         RETURNING ${COLUMNS}`,
        [
          opportunityId,
          prospectId,
          evaluation.state,
          JSON.stringify(evaluation.criteria),
          [...evaluation.evidenceSignalIds],
          evaluatorVersion,
          evaluatedAt,
        ],
      );
      return mapRow(rows[0] as QualificationRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredQualification | null> {
      const { rows } = await sql.query(
        `SELECT q.id, q.opportunity_id, q.prospect_id, q.state, q.criteria,
                q.evidence_signal_ids, q.evaluator_version, q.evaluated_at,
                q.created_at, q.updated_at
           FROM qualifications q
           JOIN opportunities o ON o.id = q.opportunity_id
          WHERE o.id = $2 AND o.user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as QualificationRow | undefined;
      return row ? mapRow(row) : null;
    },

    async listByUserId(userId: string): Promise<readonly StoredQualification[]> {
      const { rows } = await sql.query(
        `SELECT q.id, q.opportunity_id, q.prospect_id, q.state, q.criteria,
                q.evidence_signal_ids, q.evaluator_version, q.evaluated_at,
                q.created_at, q.updated_at
           FROM qualifications q
           JOIN opportunities o ON o.id = q.opportunity_id
          WHERE o.user_id = $1`,
        [userId],
      );
      return (rows as QualificationRow[]).map(mapRow);
    },
  };
}

function mapRow(row: QualificationRow): StoredQualification {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    prospectId: row.prospect_id,
    state: row.state,
    criteria: row.criteria,
    evidenceSignalIds: row.evidence_signal_ids,
    evaluatorVersion: row.evaluator_version,
    evaluatedAt: new Date(row.evaluated_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
