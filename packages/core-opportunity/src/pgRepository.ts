import type { SqlExecutor } from '@acos/core-entitlements';

import type { OpportunityRepository } from './repository';
import type { DetectedOffer, OpportunityState, StoredOpportunity } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching @acos/core-research's
// pgRepository.ts (migration 0017) — Prisma is not the query layer for
// acquisition-domain tables. Opportunity carries its own user_id (unlike
// research_signals and opportunity_scores — DEC-008's two ownership-
// inheritance exceptions; see ./scorePgRepository.ts for the latter).
// -----------------------------------------------------------------------

interface OpportunityRow {
  id: string;
  user_id: string;
  prospect_id: string;
  state: OpportunityState;
  need_detected: boolean;
  recommended_service: string | null;
  offer_rationale: string | null;
  offer_estimated_value_paise: number | null;
  offer_fit: number | null;
  offer_based_on: string[];
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, user_id, prospect_id, state, need_detected, recommended_service,
  offer_rationale, offer_estimated_value_paise, offer_fit, offer_based_on, created_at, updated_at`;

export function createPgOpportunityRepository(sql: SqlExecutor): OpportunityRepository {
  return {
    async create(
      userId: string,
      input: { prospectId: string; needDetected: boolean; offer: DetectedOffer | undefined },
      now: Date,
    ): Promise<StoredOpportunity> {
      const { rows } = await sql.query(
        `INSERT INTO opportunities
           (id, user_id, prospect_id, state, need_detected, recommended_service,
            offer_rationale, offer_estimated_value_paise, offer_fit, offer_based_on,
            created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'NEW', $3, $4, $5, $6, $7, $8, $9, $9)
         RETURNING ${COLUMNS}`,
        [
          userId,
          input.prospectId,
          input.needDetected,
          input.offer?.service ?? null,
          input.offer?.rationale ?? null,
          input.offer?.estimatedValuePaise ?? null,
          input.offer?.fit ?? null,
          input.offer ? [...input.offer.basedOn] : [],
          now,
        ],
      );
      return mapRow(rows[0] as OpportunityRow);
    },

    async getById(userId: string, id: string): Promise<StoredOpportunity | null> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM opportunities WHERE id = $2 AND user_id = $1`,
        [userId, id],
      );
      const row = rows[0] as OpportunityRow | undefined;
      return row ? mapRow(row) : null;
    },

    async list(userId: string): Promise<readonly StoredOpportunity[]> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM opportunities WHERE user_id = $1 ORDER BY created_at, id`,
        [userId],
      );
      return (rows as OpportunityRow[]).map(mapRow);
    },
  };
}

function mapRow(row: OpportunityRow): StoredOpportunity {
  return {
    id: row.id,
    userId: row.user_id,
    prospectId: row.prospect_id,
    state: row.state,
    needDetected: row.need_detected,
    offer: row.need_detected
      ? {
          service: row.recommended_service!,
          rationale: row.offer_rationale!,
          estimatedValuePaise: row.offer_estimated_value_paise!,
          fit: row.offer_fit!,
          basedOn: row.offer_based_on,
        }
      : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
