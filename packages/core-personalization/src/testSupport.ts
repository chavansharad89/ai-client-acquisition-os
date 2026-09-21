import type { StoredOpportunity } from '@acos/core-opportunity';

import type { PersonalizationRepository } from './repository';
import type { PersonalizationGeneration, StoredPersonalization } from './types';

/**
 * In-memory PersonalizationRepository enforcing the same
 * ownership-through-Opportunity boundary the database's join does.
 * Mirrors @acos/core-qualification's testSupport.ts `fakeQualification
 * Repository` convention exactly: takes the same `opportunities` array a
 * fakeOpportunityRepository() (from @acos/core-opportunity's testSupport)
 * was seeded with, or its live `.rows`. `upsert()` replaces the existing
 * row for an `opportunityId`, mirroring migration 0023's
 * `UNIQUE(opportunity_id)` upsert — never a second row.
 */
export function fakePersonalizationRepository(
  opportunities: readonly StoredOpportunity[],
): PersonalizationRepository & { rows: StoredPersonalization[] } {
  const rows: StoredPersonalization[] = [];
  let counter = 0;

  return {
    rows,

    async upsert(
      opportunityId: string,
      prospectId: string,
      generation: PersonalizationGeneration,
      generatorVersion: string,
      generatedAt: Date,
    ) {
      const index = rows.findIndex((row) => row.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredPersonalization = {
        id: existing?.id ?? `personalization_${(counter += 1)}`,
        opportunityId,
        prospectId,
        state: 'GENERATED',
        offerService: generation.offerService,
        openingContext: generation.openingContext,
        valueProposition: generation.valueProposition,
        personalizationRationale: generation.personalizationRationale,
        evidence: generation.evidence,
        generatorVersion,
        generatedAt,
        createdAt: existing?.createdAt ?? generatedAt,
        updatedAt: generatedAt,
      };
      if (index === -1) rows.push(stored);
      else rows[index] = stored;
      return stored;
    },

    async getByOpportunityId(userId: string, opportunityId: string) {
      const owned = opportunities.some((o) => o.id === opportunityId && o.userId === userId);
      if (!owned) return null;
      return rows.find((row) => row.opportunityId === opportunityId) ?? null;
    },

    async listByUserId(userId: string) {
      const ownedIds = new Set(opportunities.filter((o) => o.userId === userId).map((o) => o.id));
      return rows.filter((row) => ownedIds.has(row.opportunityId));
    },
  };
}
