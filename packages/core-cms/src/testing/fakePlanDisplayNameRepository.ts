import type { PlanDisplayNameRepository } from '../planDisplayNameRepository';
import type { PlanDisplayName } from '../types';

// In-memory PlanDisplayNameRepository fake, mirroring
// packages/core-subscriptions/src/testing/fakeSubscriptionPeriodRepository.ts's
// shape: a seedable, mutable in-memory store behind the same interface
// the real Postgres-backed repository implements, so tests exercise the
// same upsert/lookup semantics production does.

export function fakePlanDisplayNameRepository(
  seed: readonly PlanDisplayName[] = [],
): PlanDisplayNameRepository {
  const rows = new Map(seed.map((row) => [row.productId, row]));

  return {
    async findByProductId(productId) {
      return rows.get(productId) ?? null;
    },

    async upsert(productId, displayName, updatedBy) {
      const row: PlanDisplayName = {
        productId,
        displayName,
        updatedAt: new Date(),
        updatedBy,
      };
      rows.set(productId, row);
      return row;
    },
  };
}
