import type { OpportunityRepository } from './repository';
import type { DetectedOffer, StoredOpportunity } from './types';

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
