import type { StoredOpportunity } from '@acos/core-opportunity';
import type { CategoryPlausibilityRepository, StoredCategoryPlausibilityDetermination } from '@acos/core-research';

import type { QualificationRepository } from './repository';
import type { QualificationEvaluation, StoredQualification } from './types';

/**
 * In-memory CategoryPlausibilityRepository, scoped down to what
 * ./service.ts actually calls (`getCurrentByProspectId`) — the other
 * methods belong to @acos/core-research's own tests, not this
 * package's.
 */
export function fakeCategoryPlausibilityRepository(
  seed: StoredCategoryPlausibilityDetermination[] = [],
): CategoryPlausibilityRepository {
  const rows = [...seed];
  return {
    async supersedePrevious() {
      throw new Error('not used by these tests');
    },
    async save() {
      throw new Error('not used by these tests');
    },
    async listBySearchAndProspect() {
      throw new Error('not used by these tests');
    },
    async getCurrentByProspectId(_userId: string, prospectId: string) {
      return rows.find((row) => row.prospectId === prospectId && row.supersededAt === null) ?? null;
    },
  };
}

/**
 * In-memory QualificationRepository enforcing the same ownership-through-
 * Opportunity boundary the database's join does. Takes the same
 * `opportunities` array a fakeOpportunityRepository() (from
 * @acos/core-opportunity's testSupport) was seeded with, or its live
 * `.rows`, so ownership reflects the current state of that fake — exactly
 * like the real repository's JOIN to `opportunities`. `upsert()` replaces
 * the existing row for an `opportunityId`, mirroring migration 0022's
 * `UNIQUE(opportunity_id)` upsert — never a second row.
 */
export function fakeQualificationRepository(
  opportunities: readonly StoredOpportunity[],
): QualificationRepository & { rows: StoredQualification[] } {
  const rows: StoredQualification[] = [];
  let counter = 0;

  return {
    rows,

    async upsert(
      opportunityId: string,
      prospectId: string,
      evaluation: QualificationEvaluation,
      evaluatorVersion: string,
      evaluatedAt: Date,
    ) {
      const index = rows.findIndex((row) => row.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredQualification = {
        id: existing?.id ?? `qualification_${(counter += 1)}`,
        opportunityId,
        prospectId,
        state: evaluation.state,
        criteria: evaluation.criteria,
        evidenceSignalIds: evaluation.evidenceSignalIds,
        evaluatorVersion,
        evaluatedAt,
        createdAt: existing?.createdAt ?? evaluatedAt,
        updatedAt: evaluatedAt,
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
