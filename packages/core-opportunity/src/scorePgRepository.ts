import { RANKING_DIMENSIONS, RANKING_TIERS, type UniversalRankingProfile } from '@acos/core-acquisition';
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
//
// Qualitative ranking (migration 0044, Phase 3): `factors` (JSONB,
// untyped at the database level) is repurposed to hold the per-dimension
// UniversalRankingProfile instead of the old seven-factor array — no
// column rename, since the column never had a fixed shape to begin
// with. `total`/`band`/`observed_share` are the legacy numeric scorer's
// columns, now nullable (migration 0044); this repository writes NULL
// for all three on every row it produces and never selects them back —
// see that migration's header for why they are not dropped outright.
// `cap` is likewise left unpopulated (NULL) going forward.
// -----------------------------------------------------------------------

interface OpportunityScoreRow {
  id: string;
  opportunity_id: string;
  /**
   * Untyped JSONB — a row written before migration 0044
   * (scorer_version 'prospectScore-v1') still holds the legacy
   * seven-factor array here, not a UniversalRankingProfile. Narrowed by
   * asUniversalRankingProfile() in mapRow(), never assumed.
   */
  factors: unknown;
  reasons: string[];
  scorer_version: string;
  scored_at: Date;
  created_at: Date;
}

const COLUMNS = `id, opportunity_id, factors, reasons, scorer_version, scored_at, created_at`;

export function createPgOpportunityScoreRepository(sql: SqlExecutor): OpportunityScoreRepository {
  return {
    async upsert(
      opportunityId: string,
      ranking: UniversalRankingProfile,
      reasons: readonly string[],
      rankerVersion: string,
      scoredAt: Date,
    ): Promise<StoredOpportunityScore> {
      const { rows } = await sql.query(
        `INSERT INTO opportunity_scores
           (id, opportunity_id, total, band, factors, reasons, observed_share, cap,
            scorer_version, scored_at)
         VALUES (gen_random_uuid()::text, $1, NULL, NULL, $2::jsonb, $3, NULL, NULL, $4, $5)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           total = NULL,
           band = NULL,
           factors = EXCLUDED.factors,
           reasons = EXCLUDED.reasons,
           observed_share = NULL,
           cap = NULL,
           scorer_version = EXCLUDED.scorer_version,
           scored_at = EXCLUDED.scored_at
         RETURNING ${COLUMNS}`,
        [opportunityId, JSON.stringify(ranking), [...reasons], rankerVersion, scoredAt],
      );
      return mapRow(rows[0] as OpportunityScoreRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredOpportunityScore | null> {
      const { rows } = await sql.query(
        `SELECT os.id, os.opportunity_id, os.factors, os.reasons,
                os.scorer_version, os.scored_at, os.created_at
           FROM opportunity_scores os
           JOIN opportunities o ON o.id = os.opportunity_id
          WHERE o.id = $2 AND o.user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as OpportunityScoreRow | undefined;
      return row ? mapRow(row) : null;
    },

    async listByUserId(userId: string): Promise<readonly StoredOpportunityScore[]> {
      const { rows } = await sql.query(
        `SELECT os.id, os.opportunity_id, os.factors, os.reasons,
                os.scorer_version, os.scored_at, os.created_at
           FROM opportunity_scores os
           JOIN opportunities o ON o.id = os.opportunity_id
          WHERE o.user_id = $1`,
        [userId],
      );
      return (rows as OpportunityScoreRow[]).map(mapRow);
    },
  };
}

/**
 * Narrows `factors` to a real UniversalRankingProfile only when it
 * structurally has one — every ranking dimension present, each value a
 * valid tier. A legacy 'prospectScore-v1' row's `factors` is an array
 * (the old seven-factor breakdown) and fails this check, so it is never
 * reinterpreted as qualitative ranking data (migration 0044's own
 * intent: historical rows are frozen artifacts, not re-mapped).
 */
function asUniversalRankingProfile(value: unknown): UniversalRankingProfile | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const hasEveryDimension = RANKING_DIMENSIONS.every((dimension) => {
    const tier = record[dimension];
    return typeof tier === 'string' && (RANKING_TIERS as readonly string[]).includes(tier);
  });
  return hasEveryDimension ? (value as UniversalRankingProfile) : null;
}

function mapRow(row: OpportunityScoreRow): StoredOpportunityScore {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    ranking: asUniversalRankingProfile(row.factors),
    reasons: row.reasons,
    rankerVersion: row.scorer_version,
    scoredAt: new Date(row.scored_at),
    createdAt: new Date(row.created_at),
  };
}
