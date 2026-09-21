import type { StoredOpportunity } from '@acos/core-opportunity';

import type { FollowUpPreparationRepository } from './repository';
import type { FollowUpPreparationGeneration, StoredFollowUpPreparation } from './types';

/**
 * In-memory FollowUpPreparationRepository enforcing the same
 * ownership-through-Opportunity boundary the database's join does.
 * Mirrors @acos/core-outreach-preparation's testSupport.ts
 * `fakeOutreachPreparationRepository` convention exactly: takes the same
 * `opportunities` array a fakeOpportunityRepository() (from
 * @acos/core-opportunity's testSupport) was seeded with, or its live
 * `.rows`. `upsert()` replaces the existing row for an `opportunityId`,
 * mirroring migration 0025's `UNIQUE(opportunity_id)` upsert — never a
 * second row.
 */
export function fakeFollowUpPreparationRepository(
  opportunities: readonly StoredOpportunity[],
): FollowUpPreparationRepository & { rows: StoredFollowUpPreparation[] } {
  const rows: StoredFollowUpPreparation[] = [];
  let counter = 0;

  return {
    rows,

    async upsert(
      opportunityId: string,
      prospectId: string,
      sourceOutreachPreparationId: string,
      generation: FollowUpPreparationGeneration,
      generatorVersion: string,
      generatedAt: Date,
    ) {
      const index = rows.findIndex((row) => row.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredFollowUpPreparation = {
        id: existing?.id ?? `followup_preparation_${(counter += 1)}`,
        opportunityId,
        prospectId,
        sourceOutreachPreparationId,
        state: 'READY_FOR_REVIEW',
        followUpContext: generation.followUpContext,
        followUpContent: generation.followUpContent,
        rationale: generation.rationale,
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
