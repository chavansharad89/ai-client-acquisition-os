import { describe, expect, it, vi } from 'vitest';

import {
  CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
  getClientFinderSubscriptionStatus,
  hasClientFinderAccess,
  requireClientFinderAccess,
} from './access';
import { NoActiveClientFinderSubscriptionError } from './errors';
import type { LeadUnlockRepository } from './leadUnlockRepository';
import { fakeSubscriptionPeriodRepository } from './testing/fakeSubscriptionPeriodRepository';
import type { LeadUnlock, SubscriptionPeriod } from './types';

const NOW = new Date('2026-02-01T00:00:00Z');

function deps(options: { periods?: readonly SubscriptionPeriod[]; existingUnlock?: LeadUnlock | null } = {}) {
  const subscriptionPeriods = fakeSubscriptionPeriodRepository(options.periods ?? []);
  const leadUnlocks: LeadUnlockRepository = {
    findByUserAndOpportunity: vi.fn(async () => options.existingUnlock ?? null),
    revealAtomically: vi.fn(),
  };
  return { subscriptionPeriods, leadUnlocks };
}

function period(overrides: Partial<SubscriptionPeriod> = {}): SubscriptionPeriod {
  return {
    id: 'period-1',
    userId: 'user-1',
    productSlug: CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
    razorpaySubscriptionId: 'sub_1',
    razorpayPaymentId: 'pay_1',
    activationAt: NOW,
    durationDays: 30,
    refundedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const SOME_PERIOD = period();

describe('hasClientFinderAccess', () => {
  it('grants access when an active subscription period exists', async () => {
    const d = deps({ periods: [SOME_PERIOD] });
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(true);
  });

  it('denies access for a zero-entitlement user with no active period and no opportunity-specific unlock', async () => {
    const d = deps();
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(false);
  });

  it('denies access once the period has expired (activationAt + durationDays <= now)', async () => {
    const expired = period({ activationAt: new Date('2025-12-01T00:00:00Z'), durationDays: 30 });
    const d = deps({ periods: [expired] });
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(false);
  });

  it('denies access for an active period belonging to a DIFFERENT product', async () => {
    const otherProduct = period({ productSlug: 'ai_freelancing_499' });
    const d = deps({ periods: [otherProduct] });
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(false);
  });

  it('denies access for an active Client Finder period belonging to a DIFFERENT user', async () => {
    const othersPeriod = period({ userId: 'user-2' });
    const d = deps({ periods: [othersPeriod] });
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(false);
  });

  it('grants access for a not-yet-started period whose expiry window has not elapsed (model has no start-bound check)', async () => {
    const notYetStarted = period({ activationAt: new Date('2026-03-01T00:00:00Z'), durationDays: 30 });
    const d = deps({ periods: [notYetStarted] });
    await expect(hasClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBe(true);
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
    const d = deps({ periods: [SOME_PERIOD] });
    await expect(requireClientFinderAccess(d, 'user-1', null, NOW)).resolves.toBeUndefined();
  });
});

describe('getClientFinderSubscriptionStatus', () => {
  it('reports active: true with the computed expiry when a period is currently active', async () => {
    const d = deps({ periods: [SOME_PERIOD] });
    await expect(getClientFinderSubscriptionStatus(d, 'user-1', NOW)).resolves.toEqual({
      active: true,
      expiresAt: new Date(SOME_PERIOD.activationAt.getTime() + SOME_PERIOD.durationDays * 86_400_000),
      durationDays: SOME_PERIOD.durationDays,
    });
  });

  it('reports active: false for an expired period', async () => {
    const expired = period({ activationAt: new Date('2025-12-01T00:00:00Z'), durationDays: 30 });
    const d = deps({ periods: [expired] });
    await expect(getClientFinderSubscriptionStatus(d, 'user-1', NOW)).resolves.toEqual({
      active: false,
      expiresAt: null,
      durationDays: null,
    });
  });

  it('reports active: false when the only active period is for a DIFFERENT product', async () => {
    const otherProduct = period({ productSlug: 'ai_freelancing_499' });
    const d = deps({ periods: [otherProduct] });
    await expect(getClientFinderSubscriptionStatus(d, 'user-1', NOW)).resolves.toEqual({
      active: false,
      expiresAt: null,
      durationDays: null,
    });
  });
});

describe('access-decision consistency (Phase 0 regression-safety)', () => {
  // Proves hasClientFinderAccess (read path: page gating/status badge) and
  // leadUnlockService's unlockOpportunityForOwner (write path: the actual
  // unlock POST) resolve the SAME underlying subscription-access decision
  // for the same inputs -- the split-brain risk this phase consolidates
  // (AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md §15 item 1). Full
  // write-path coverage lives in leadUnlockService.test.ts; this proves
  // the read-side half of the same claim using the identical fixture.
  it.each([
    ['no subscription', []],
    ['expired subscription', [period({ activationAt: new Date('2025-12-01T00:00:00Z'), durationDays: 30 })]],
    ['subscription for a different product', [period({ productSlug: 'ai_freelancing_499' })]],
    ['active Client Finder subscription', [SOME_PERIOD]],
  ] as const)('hasClientFinderAccess agrees with findActiveClientFinderSubscriptionPeriod for: %s', async (_label, periods) => {
    const d = deps({ periods });
    const access = await hasClientFinderAccess(d, 'user-1', null, NOW);
    const status = await getClientFinderSubscriptionStatus(d, 'user-1', NOW);
    expect(access).toBe(status.active);
  });
});
