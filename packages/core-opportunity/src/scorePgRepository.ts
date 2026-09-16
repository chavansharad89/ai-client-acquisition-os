import type { FactorScore, ProspectScore, ScoreBand } from '@acos/core-acquisition';
import type { SqlExecutor } from '@acos/core-entitlements';

import type { OpportunityScoreRepository } from './scoreRepository';
import type { StoredOpportunityScore } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching this package's own
// pgRepository.ts (migration 0017) and @acos/core-research's
// pgRepository.ts (migration 0016) — Prisma is not the query layer for
// acquisition-domain tables. opportunity_scores carries no user_id
// (DEC-008, migration 0018); getByOpportunityId enforces ownership
// itself by joining to opportunities, rather than trusting the caller's
// already-checked Opportunity alone (belt and suspenders with
// ./service's own check).
//
// One current score per Opportunity: upsert always writes via
// INSERT ... ON CONFLICT (opportunity_id) DO UPDATE, never a second row.
// -----------------------------------------------------------------------

interface OpportunityScoreRow {
  id: string;
  opportunity_id: string;
  total: number;
  band: ScoreBand;
  factors: FactorScore[];
  reasons: string[];
  observed_share: number;
  cap: string | null;
  scorer_version: string;
  scored_at: Date;
  created_at: Date;
}

const COLUMNS = `id, opportunity_id, total, band, factors, reasons, observed_share, cap,
  scorer_version, scored_at, created_at`;

export function createPgOpportunityScoreRepository(sql: SqlExecutor): OpportunityScoreRepository {
  return {
    async upsert(
      opportunityId: string,
      score: ProspectScore,
      scorerVersion: string,
      scoredAt: Date,
    ): Promise<StoredOpportunityScore> {
      const { rows } = await sql.query(
        `INSERT INTO opportunity_scores
           (id, opportunity_id, total, band, factors, reasons, observed_share, cap,
            scorer_version, scored_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           total = EXCLUDED.total,
           band = EXCLUDED.band,
           factors = EXCLUDED.factors,
           reasons = EXCLUDED.reasons,
           observed_share = EXCLUDED.observed_share,
           cap = EXCLUDED.cap,
           scorer_version = EXCLUDED.scorer_version,
           scored_at = EXCLUDED.scored_at
         RETURNING ${COLUMNS}`,
        [
          opportunityId,
          score.score,
          score.band,
          JSON.stringify(score.factors),
          [...score.reasons],
          score.observedShare,
          score.cap ?? null,
          scorerVersion,
          scoredAt,
        ],
      );
      return mapRow(rows[0] as OpportunityScoreRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredOpportunityScore | null> {
      const { rows } = await sql.query(
        `SELECT os.id, os.opportunity_id, os.total, os.band, os.factors, os.reasons,
                os.observed_share, os.cap, os.scorer_version, os.scored_at, os.created_at
           FROM opportunity_scores os
           JOIN opportunities o ON o.id = os.opportunity_id
          WHERE o.id = $2 AND o.user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as OpportunityScoreRow | undefined;
      return row ? mapRow(row) : null;
    },
  };
}

function mapRow(row: OpportunityScoreRow): StoredOpportunityScore {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    total: row.total,
    band: row.band,
    factors: row.factors,
    reasons: row.reasons,
    observedShare: row.observed_share,
    cap: row.cap ?? undefined,
    scorerVersion: row.scorer_version,
    scoredAt: new Date(row.scored_at),
    createdAt: new Date(row.created_at),
  };
}
