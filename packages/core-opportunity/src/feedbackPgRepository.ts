import type { SqlExecutor } from '@acos/core-entitlements';

import type { FeedbackRepository } from './feedbackRepository';
import type { RecordFeedbackInput, StoredFeedback } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching this package's other
// repositories (migration 0020). Feedback carries its own user_id (a
// top-level owned model, not one of DEC-008's two ownership-inheritance
// exceptions) so every query filters directly on user_id — no join to
// opportunities required, unlike ./scorePgRepository.ts.
//
// One current verdict per Opportunity: upsert always writes via
// INSERT ... ON CONFLICT (opportunity_id) DO UPDATE, never a second row.
// -----------------------------------------------------------------------

interface FeedbackRow {
  id: string;
  user_id: string;
  opportunity_id: string;
  useful: boolean;
  reason: string;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, user_id, opportunity_id, useful, reason, created_at, updated_at`;

export function createPgFeedbackRepository(sql: SqlExecutor): FeedbackRepository {
  return {
    async upsert(
      userId: string,
      opportunityId: string,
      input: RecordFeedbackInput,
      now: Date,
    ): Promise<StoredFeedback> {
      const { rows } = await sql.query(
        `INSERT INTO feedback
           (id, user_id, opportunity_id, useful, reason, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $5)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           useful = EXCLUDED.useful,
           reason = EXCLUDED.reason,
           updated_at = EXCLUDED.updated_at
         RETURNING ${COLUMNS}`,
        [userId, opportunityId, input.useful, input.reason, now],
      );
      return mapRow(rows[0] as FeedbackRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredFeedback | null> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM feedback WHERE opportunity_id = $2 AND user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as FeedbackRow | undefined;
      return row ? mapRow(row) : null;
    },

    async list(userId: string): Promise<readonly StoredFeedback[]> {
      const { rows } = await sql.query(`SELECT ${COLUMNS} FROM feedback WHERE user_id = $1`, [
        userId,
      ]);
      return (rows as FeedbackRow[]).map(mapRow);
    },
  };
}

function mapRow(row: FeedbackRow): StoredFeedback {
  return {
    id: row.id,
    userId: row.user_id,
    opportunityId: row.opportunity_id,
    useful: row.useful,
    reason: row.reason,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
