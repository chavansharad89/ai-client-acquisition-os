import { describe, expect, it, vi } from 'vitest';

import { hasClientFinderAccess, requireClientFinderAccess } from './access';
import { NoActiveClientFinderSubscriptionError } from './errors';
import type { LeadUnlockRepository } from './leadUnlockRepository';
import type { SubscriptionPeriodRepository } from './subscriptionPeriodRepository';
import type { LeadUnlock, SubscriptionPeriod } from './types';

const NOW = new Date('2026-02-01T00:00:00Z');

function deps(options: { active?: SubscriptionPeriod | null; existingUnlock?: LeadUnlock | null } = {}) {
  const subscriptionPeriods: SubscriptionPeriodRepository = {
    findActiveForUser: vi.fn(async () => options.active ?? null),
    getById: vi.fn(),
  };
  const leadUnlocks: LeadUnlockRepository = {
    findByUserAndOpportunity: vi.fn(async () => options.existingUnlock ?? null),
    revealAtomically: vi.fn(),
  };
  return { subscriptionPeriods, leadUnlocks };
}

const SOME_PERIOD: SubscriptionPeriod = {
  id: 'period-1',
  userId: 'user-1',
  productSlug: 'ai_client_acquisition_1499_subscription',
  razorpaySubscriptionId: 'sub_1',
  razorpayPaymentId: 'pay_1',
  activationAt: NOW,
  durationDays: 30,
  refundedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
};

describe('hasClientFinderAccess', () => {
  it('grants access when an active subscription period exists', async () => {
    const d = deps({ active: SOME_PERIOD });
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(true);
  });

  it('denies access for a zero-entitlement user with no active period and no opportunity-specific unlock', async () => {
    const d = deps();
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(false);
  });

  it('grants access to one specific already-unlocked opportunity even without an active subscription (IRL-I)', async () => {
    const existing: LeadUnlock = {
      id: 'unlock-1',
      userId: 'user-1',
      opportunityId: 'opp-1',
      subscriptionPeriodId: 'period-1',
      unlockedAt: NOW,
      createdAt: NOW,
      contacts: [],
    };
    const d = deps({ existingUnlock: existing });
    await expect(hasClientFinderAccess(d, 'user-1', 'opp-1', NOW)).resolves.toBe(true);
  });

  it('does not let a permanent unlock for a DIFFERENT opportunity leak into this check', async () => {
    const d = deps({ existingUnlock: null });
    await expect(hasClientFinderAccess(d, 'user-1', 'opp-unrelated', NOW)).resolves.toBe(false);
  });
});

describe('requireClientFinderAccess', () => {
  it('throws NoActiveClientFinderSubscriptionError when access is denied', async () => {
    const d = deps();
    await expect(requireClientFinderAccess(d, 'user-1', null, NOW)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
  });

  it('resolves without throwing when access is granted', async () => {
    const d = deps({ active: SOME_PERIOD });
    await expect(requireClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBeUndefined();
  });
});
