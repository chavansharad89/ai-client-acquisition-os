import type { PersonalizationEvidenceItem } from '@acos/core-personalization';
import type { SqlExecutor } from '@acos/core-entitlements';

import type { FollowUpPreparationRepository } from './repository';
import type { FollowUpPreparationGeneration, StoredFollowUpPreparation } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching
// @acos/core-outreach-preparation's pgRepository.ts (migration 0024) —
// `follow_up_preparations` carries no user_id (DEC-008, migration 0025);
// getByOpportunityId enforces ownership itself by joining to
// opportunities, rather than trusting the caller's already-checked
// Opportunity alone (belt and suspenders with ./service's own check).
//
// One current follow-up preparation per Opportunity: upsert always writes
// via INSERT ... ON CONFLICT (opportunity_id) DO UPDATE, never a second
// row. `state` is hardcoded to 'READY_FOR_REVIEW' at the INSERT site —
// never a caller-supplied value, so no code path here can write
// SENT/DELIVERED/SCHEDULED even by mistake: those values are not columns
// this function's parameters can reach.
// -----------------------------------------------------------------------

interface FollowUpPreparationRow {
  id: string;
  opportunity_id: string;
  prospect_id: string;
  source_outreach_preparation_id: string;
  state: StoredFollowUpPreparation['state'];
  follow_up_context: string;
  follow_up_content: string;
  rationale: string;
  evidence: PersonalizationEvidenceItem[];
  generator_version: string;
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, opportunity_id, prospect_id, source_outreach_preparation_id, state, follow_up_context,
  follow_up_content, rationale, evidence, generator_version, generated_at, created_at, updated_at`;

export function createPgFollowUpPreparationRepository(
  sql: SqlExecutor,
): FollowUpPreparationRepository {
  return {
    async upsert(
      opportunityId: string,
      prospectId: string,
      sourceOutreachPreparationId: string,
      generation: FollowUpPreparationGeneration,
      generatorVersion: string,
      generatedAt: Date,
    ): Promise<StoredFollowUpPreparation> {
      const { rows } = await sql.query(
        `INSERT INTO follow_up_preparations
           (id, opportunity_id, prospect_id, source_outreach_preparation_id, state, follow_up_context,
            follow_up_content, rationale, evidence, generator_version, generated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'READY_FOR_REVIEW', $4, $5, $6, $7::jsonb, $8, $9)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           prospect_id = EXCLUDED.prospect_id,
           source_outreach_preparation_id = EXCLUDED.source_outreach_preparation_id,
           follow_up_context = EXCLUDED.follow_up_context,
           follow_up_content = EXCLUDED.follow_up_content,
           rationale = EXCLUDED.rationale,
           evidence = EXCLUDED.evidence,
           generator_version = EXCLUDED.generator_version,
           generated_at = EXCLUDED.generated_at,
           updated_at = CURRENT_TIMESTAMP
         RETURNING ${COLUMNS}`,
        [
          opportunityId,
          prospectId,
          sourceOutreachPreparationId,
          generation.followUpContext,
          generation.followUpContent,
          generation.rationale,
          JSON.stringify(generation.evidence),
          generatorVersion,
          generatedAt,
        ],
      );
      return mapRow(rows[0] as FollowUpPreparationRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredFollowUpPreparation | null> {
      const { rows } = await sql.query(
        `SELECT p.id, p.opportunity_id, p.prospect_id, p.source_outreach_preparation_id, p.state,
                p.follow_up_context, p.follow_up_content, p.rationale, p.evidence,
                p.generator_version, p.generated_at, p.created_at, p.updated_at
           FROM follow_up_preparations p
           JOIN opportunities o ON o.id = p.opportunity_id
          WHERE o.id = $2 AND o.user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as FollowUpPreparationRow | undefined;
      return row ? mapRow(row) : null;
    },

    async listByUserId(userId: string): Promise<readonly StoredFollowUpPreparation[]> {
      const { rows } = await sql.query(
        `SELECT p.id, p.opportunity_id, p.prospect_id, p.source_outreach_preparation_id, p.state,
                p.follow_up_context, p.follow_up_content, p.rationale, p.evidence,
                p.generator_version, p.generated_at, p.created_at, p.updated_at
           FROM follow_up_preparations p
           JOIN opportunities o ON o.id = p.opportunity_id
          WHERE o.user_id = $1`,
        [userId],
      );
      return (rows as FollowUpPreparationRow[]).map(mapRow);
    },
  };
}

function mapRow(row: FollowUpPreparationRow): StoredFollowUpPreparation {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    prospectId: row.prospect_id,
    sourceOutreachPreparationId: row.source_outreach_preparation_id,
    state: row.state,
    followUpContext: row.follow_up_context,
    followUpContent: row.follow_up_content,
    rationale: row.rationale,
    evidence: row.evidence,
    generatorVersion: row.generator_version,
    generatedAt: new Date(row.generated_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
