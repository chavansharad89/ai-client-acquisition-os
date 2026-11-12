import type { SubscriptionPeriodRepository } from '../subscriptionPeriodRepository';
import type { SubscriptionPeriod } from '../types';

// In-memory SubscriptionPeriodRepository fake used by access.test.ts,
// leadUnlockService.test.ts, and (via @acos/core-subscriptions) the
// opportunity detail page's render test.
// -----------------------------------------------------------------------
// Phase 0 regression-safety hardening (AUTH_COMMERCIAL_IMPLEMENTATION_
// IMPACT_AUDIT.md §15 item 2): the fixture this replaced ignored its own
// `productSlug`/`now` arguments and keyed only on `userId`, so it could
// not fail a test that queried the wrong slug or a since-expired period.
// This fake instead mirrors the real repository's exact formula
// (subscriptionPeriodRepository.ts: `refunded_at IS NULL AND
// activation_at + duration_days days > now`, matched on `product_slug`)
// so tests built on it exercise the same active/expired/wrong-product
// distinctions production makes. Per that same SQL, a not-yet-started
// period (`activationAt` in the future) is still "active" as long as it
// has not yet expired -- the real query never checks a lower bound, only
// the upper one -- so this fake does not invent one either.
// -----------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function fakeSubscriptionPeriodRepository(seed: readonly SubscriptionPeriod[] = []): SubscriptionPeriodRepository {
  const rows = [...seed];
  return {
    async findActiveForUser(userId, productSlug, now) {
      const matches = rows.filter(
        (row) =>
          row.userId === userId &&
          row.productSlug === productSlug &&
          row.refundedAt === null &&
          now.getTime() < row.activationAt.getTime() + row.durationDays * MS_PER_DAY,
      );
      matches.sort((a, b) => b.activationAt.getTime() - a.activationAt.getTime());
      return matches[0] ?? null;
    },

    async getById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
  };
}
