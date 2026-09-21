import type { StoredOpportunity } from '@acos/core-opportunity';

import type { OutreachPreparationRepository } from './repository';
import type { OutreachPreparationGeneration, StoredOutreachPreparation } from './types';

/**
 * In-memory OutreachPreparationRepository enforcing the same
 * ownership-through-Opportunity boundary the database's join does.
 * Mirrors @acos/core-personalization's testSupport.ts
 * `fakePersonalizationRepository` convention exactly: takes the same
 * `opportunities` array a fakeOpportunityRepository() (from
 * @acos/core-opportunity's testSupport) was seeded with, or its live
 * `.rows`. `upsert()` replaces the existing row for an `opportunityId`,
 * mirroring migration 0024's `UNIQUE(opportunity_id)` upsert — never a
 * second row.
 */
export function fakeOutreachPreparationRepository(
  opportunities: readonly StoredOpportunity[],
): OutreachPreparationRepository & { rows: StoredOutreachPreparation[] } {
  const rows: StoredOutreachPreparation[] = [];
  let counter = 0;

  return {
    rows,

    async upsert(
      opportunityId: string,
      prospectId: string,
      sourcePersonalizationId: string,
      generation: OutreachPreparationGeneration,
      generatorVersion: string,
      generatedAt: Date,
    ) {
      const index = rows.findIndex((row) => row.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredOutreachPreparation = {
        id: existing?.id ?? `outreach_preparation_${(counter += 1)}`,
        opportunityId,
        prospectId,
        sourcePersonalizationId,
        state: 'READY_FOR_REVIEW',
        subjectLine: generation.subjectLine,
        messageBody: generation.messageBody,
        callToAction: generation.callToAction,
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
