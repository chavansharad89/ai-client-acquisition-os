import type { SqlExecutor } from '@acos/core-entitlements';

import type { PersonalizationRepository } from './repository';
import type {
  PersonalizationEvidenceItem,
  PersonalizationGeneration,
  StoredPersonalization,
} from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching
// @acos/core-qualification's pgRepository.ts (migration 0022) —
// `personalizations` carries no user_id (DEC-008, migration 0023);
// getByOpportunityId enforces ownership itself by joining to
// opportunities, rather than trusting the caller's already-checked
// Opportunity alone (belt and suspenders with ./service's own check).
//
// One current personalization per Opportunity: upsert always writes via
// INSERT ... ON CONFLICT (opportunity_id) DO UPDATE, never a second row.
// -----------------------------------------------------------------------

interface PersonalizationRow {
  id: string;
  opportunity_id: string;
  prospect_id: string;
  state: StoredPersonalization['state'];
  offer_service: string;
  opening_context: string;
  value_proposition: string;
  personalization_rationale: string;
  evidence: PersonalizationEvidenceItem[];
  generator_version: string;
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = `id, opportunity_id, prospect_id, state, offer_service, opening_context,
  value_proposition, personalization_rationale, evidence, generator_version, generated_at,
  created_at, updated_at`;

export function createPgPersonalizationRepository(sql: SqlExecutor): PersonalizationRepository {
  return {
    async upsert(
      opportunityId: string,
      prospectId: string,
      generation: PersonalizationGeneration,
      generatorVersion: string,
      generatedAt: Date,
    ): Promise<StoredPersonalization> {
      const { rows } = await sql.query(
        `INSERT INTO personalizations
           (id, opportunity_id, prospect_id, state, offer_service, opening_context,
            value_proposition, personalization_rationale, evidence, generator_version, generated_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'GENERATED', $3, $4, $5, $6, $7::jsonb, $8, $9)
         ON CONFLICT (opportunity_id) DO UPDATE SET
           prospect_id = EXCLUDED.prospect_id,
           offer_service = EXCLUDED.offer_service,
           opening_context = EXCLUDED.opening_context,
           value_proposition = EXCLUDED.value_proposition,
           personalization_rationale = EXCLUDED.personalization_rationale,
           evidence = EXCLUDED.evidence,
           generator_version = EXCLUDED.generator_version,
           generated_at = EXCLUDED.generated_at,
           updated_at = CURRENT_TIMESTAMP
         RETURNING ${COLUMNS}`,
        [
          opportunityId,
          prospectId,
          generation.offerService,
          generation.openingContext,
          generation.valueProposition,
          generation.personalizationRationale,
          JSON.stringify(generation.evidence),
          generatorVersion,
          generatedAt,
        ],
      );
      return mapRow(rows[0] as PersonalizationRow);
    },

    async getByOpportunityId(
      userId: string,
      opportunityId: string,
    ): Promise<StoredPersonalization | null> {
      const { rows } = await sql.query(
        `SELECT p.id, p.opportunity_id, p.prospect_id, p.state, p.offer_service,
                p.opening_context, p.value_proposition, p.personalization_rationale,
                p.evidence, p.generator_version, p.generated_at, p.created_at, p.updated_at
           FROM personalizations p
           JOIN opportunities o ON o.id = p.opportunity_id
          WHERE o.id = $2 AND o.user_id = $1`,
        [userId, opportunityId],
      );
      const row = rows[0] as PersonalizationRow | undefined;
      return row ? mapRow(row) : null;
    },

    async listByUserId(userId: string): Promise<readonly StoredPersonalization[]> {
      const { rows } = await sql.query(
        `SELECT p.id, p.opportunity_id, p.prospect_id, p.state, p.offer_service,
                p.opening_context, p.value_proposition, p.personalization_rationale,
                p.evidence, p.generator_version, p.generated_at, p.created_at, p.updated_at
           FROM personalizations p
           JOIN opportunities o ON o.id = p.opportunity_id
          WHERE o.user_id = $1`,
        [userId],
      );
      return (rows as PersonalizationRow[]).map(mapRow);
    },
  };
}

function mapRow(row: PersonalizationRow): StoredPersonalization {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    prospectId: row.prospect_id,
    state: row.state,
    offerService: row.offer_service,
    openingContext: row.opening_context,
    valueProposition: row.value_proposition,
    personalizationRationale: row.personalization_rationale,
    evidence: row.evidence,
    generatorVersion: row.generator_version,
    generatedAt: new Date(row.generated_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
