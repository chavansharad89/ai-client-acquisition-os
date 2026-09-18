import type { ProspectScore } from '@acos/core-acquisition';

import type { OpportunityRepository } from './repository';
import type { OpportunityScoreRepository } from './scoreRepository';
import type { DetectedOffer, StoredOpportunity, StoredOpportunityScore } from './types';

/**
 * In-memory repository enforcing the same ownership + one-per-Prospect
 * boundary the database does. `create()` throws on a duplicate
 * `prospectId`, mirroring migration 0017's unique index — uncaught here,
 * the same convention @acos/core-research's fake repository leaves to
 * its own database-level constraints.
 */
export function fakeOpportunityRepository(
  seed: StoredOpportunity[] = [],
): OpportunityRepository & { rows: StoredOpportunity[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async create(
      userId: string,
      input: { prospectId: string; needDetected: boolean; offer: DetectedOffer | undefined },
      now: Date,
    ) {
      if (rows.some((row) => row.prospectId === input.prospectId)) {
        throw new Error(`duplicate opportunity for prospect ${input.prospectId}`);
      }

      counter += 1;
      const created: StoredOpportunity = {
        id: `opportunity_${counter}`,
        userId,
        prospectId: input.prospectId,
        state: 'NEW',
        needDetected: input.needDetected,
        offer: input.offer,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(created);
      return created;
    },

    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },

    async list(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },
  };
}

/**
 * In-memory OpportunityScoreRepository enforcing the same ownership-
 * through-Opportunity boundary the database's join does. Takes the same
 * `opportunities` array a fakeOpportunityRepository() was seeded with
 * (or its live `.rows`) so ownership reflects the current state of that
 * fake, exactly like the real repository's JOIN to `opportunities`.
 * `upsert()` replaces the existing row for an `opportunityId`, mirroring
 * migration 0018's `UNIQUE(opportunity_id)` upsert — never a second row.
 */
export function fakeOpportunityScoreRepository(
  opportunities: readonly StoredOpportunity[],
): OpportunityScoreRepository & { rows: StoredOpportunityScore[] } {
  const rows: StoredOpportunityScore[] = [];
  let counter = 0;

  return {
    rows,

    async upsert(
      opportunityId: string,
      score: ProspectScore,
      scorerVersion: string,
      scoredAt: Date,
    ) {
      const index = rows.findIndex((row) => row.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredOpportunityScore = {
        id: existing?.id ?? `opportunity_score_${(counter += 1)}`,
        opportunityId,
        total: score.score,
        band: score.band,
        factors: score.factors,
        reasons: score.reasons,
        observedShare: score.observedShare,
        cap: score.cap,
        scorerVersion,
        scoredAt,
        createdAt: existing?.createdAt ?? scoredAt,
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
