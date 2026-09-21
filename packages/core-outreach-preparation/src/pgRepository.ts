import type { PersonalizationEvidenceItem } from '@acos/core-personalization';
import type { SqlExecutor } from '@acos/core-entitlements';

import type { OutreachPreparationRepository } from './repository';
import type { OutreachPreparationGeneration, StoredOutreachPreparation } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching
// @acos/core-personalization's pgRepository.ts (migration 0023) —
// `outreach_preparations` carries no user_id (DEC-008, migration 0024);
// getByOpportunityId enforces ownership itself by joining to
// opportunities, rather than trusting the caller's already-checked
// Opportunity alone (belt and suspenders with ./service's own check).
//
// One current outreach preparation per Opportunity: upsert always writes
// via INSERT ... ON CONFLICT (opportunity_id) DO UPDATE, never a second
// row. `state` is hardcoded to 'READY_FOR_REVIEW' at the INSERT site
// (Decision O1 — see the Phase 22 scope-lock) — never a caller-supplied
// value, so no code path here can write SENT/DELIVERED/SCHEDULED even by
// mistake: those values are not columns this function's parameters can
// reach.
// -----------------------------------------------------------------------

interface OutreachPreparationRow {
  id: string;
  opportunity_id: string;
  prospect_id: string;
  source_personalization_id: string;
  state: StoredOutreachPreparation['state'];
  subject_line: string;
  message_body: string;
  call_to_action: string;
  evidence: PersonalizationEvidenceItem[];
  generator_version: string;
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, opportunity_id, prospect_id, source_personalization_id, state, subject_line,
  message_body, call_to_action, evidence, generator_version, generated_at, created_at, updated_at`;

export function createPgOutreachPreparationRepository(
  sql: SqlExecutor,
): OutreachPreparationRepository {
  return {
    async upsert(
      opportunityId: string,
      prospectId: string,
      sourcePersonalizationId: string,
      generation: OutreachPreparationGeneration,
      generatorVersion: string,
      generatedAt: Date,
    ): Promise<StoredOutreachPreparation> {
      const { rows } = await sql.query(
        `INSERT INTO outreach_preparations
           (id, opportunity_id, prospect_id, source_personalization_id, state, subject_line,
            message_body, call_to_action, evidence, generator_version, generated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'READY_FOR_REVIEW', $4, $5, $6, $7::jsonb, $8, $9)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           prospect_id = EXCLUDED.prospect_id,
           source_personalization_id = EXCLUDED.source_personalization_id,
           subject_line = EXCLUDED.subject_line,
           message_body = EXCLUDED.message_body,
           call_to_action = EXCLUDED.call_to_action,
           evidence = EXCLUDED.evidence,
           generator_version = EXCLUDED.generator_version,
           generated_at = EXCLUDED.generated_at,
           updated_at = CURRENT_TIMESTAMP
         RETURNING ${COLUMNS}`,
        [
          opportunityId,
          prospectId,
          sourcePersonalizationId,
          generation.subjectLine,
          generation.messageBody,
          generation.callToAction,
          JSON.stringify(generation.evidence),
          generatorVersion,
          generatedAt,
        ],
      );
      return mapRow(rows[0] as OutreachPreparationRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredOutreachPreparation | null> {
      const { rows } = await sql.query(
        `SELECT p.id, p.opportunity_id, p.prospect_id, p.source_personalization_id, p.state,
                p.subject_line, p.message_body, p.call_to_action, p.evidence,
                p.generator_version, p.generated_at, p.created_at, p.updated_at
           FROM outreach_preparations p
           JOIN opportunities o ON o.id = p.opportunity_id
          WHERE o.id = $2 AND o.user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as OutreachPreparationRow | undefined;
      return row ? mapRow(row) : null;
    },

    async listByUserId(userId: string): Promise<readonly StoredOutreachPreparation[]> {
      const { rows } = await sql.query(
        `SELECT p.id, p.opportunity_id, p.prospect_id, p.source_personalization_id, p.state,
                p.subject_line, p.message_body, p.call_to_action, p.evidence,
                p.generator_version, p.generated_at, p.created_at, p.updated_at
           FROM outreach_preparations p
           JOIN opportunities o ON o.id = p.opportunity_id
          WHERE o.user_id = $1`,
        [userId],
      );
      return (rows as OutreachPreparationRow[]).map(mapRow);
    },
  };
}

function mapRow(row: OutreachPreparationRow): StoredOutreachPreparation {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    prospectId: row.prospect_id,
    sourcePersonalizationId: row.source_personalization_id,
    state: row.state,
    subjectLine: row.subject_line,
    messageBody: row.message_body,
    callToAction: row.call_to_action,
    evidence: row.evidence,
    generatorVersion: row.generator_version,
    generatedAt: new Date(row.generated_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
