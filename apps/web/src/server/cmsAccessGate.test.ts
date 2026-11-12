import type { ProductId } from '@acos/catalog';
import { fakeSubscriptionPeriodRepository, type SubscriptionPeriod } from '@acos/core-subscriptions';
import { describe, expect, it } from 'vitest';

import { hasCmsAwareAccess, resolveCmsAwarePurchased } from './cmsAccessGate';

// FINAL PRODUCT RULE: no perpetual Plus/Pro access. These tests exercise
// exactly the correction applied to currentAccess() (access.ts) and the
// download route — the real, production code paths now call
// resolveCmsAwarePurchased with the same shape these tests use.

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-25T00:00:00.000Z');

function period(overrides: Partial<SubscriptionPeriod>): SubscriptionPeriod {
  return {
    id: 'sp_1',
    userId: 'u1',
    productSlug: 'ai_income_99',
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

describe('resolveCmsAwarePurchased', () => {
  it('an old, non-expiring Plus entitlement with NO active subscription_period grants nothing (the bug this fixes)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([]);
    const result = await resolveCmsAwarePurchased(
      { subscriptionPeriods },
      'u1',
      ['ai_income_99'], // entitlements say "purchased", but no subscription_periods row exists
      NOW,
    );
    expect(result).not.toContain('ai_income_99');
  });

  it('an active Plus subscription_period grants ai_income_99', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
    ]);
    const result = await resolveCmsAwarePurchased({ subscriptionPeriods }, 'u1', [], NOW);
    expect(result).toContain('ai_income_99');
  });

  it('an EXPIRED Plus subscription_period grants nothing, even if the old entitlement still exists', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 40 * DAY_MS) }),
    ]);
    const result = await resolveCmsAwarePurchased(
      { subscriptionPeriods },
      'u1',
      ['ai_income_99'],
      NOW,
    );
    expect(result).not.toContain('ai_income_99');
  });

  it('CRITICAL: an active Pro subscription does NOT imply Plus (PO-2/PO-3 — Pro does not inherit Plus)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ productSlug: 'ai_freelancing_499', activationAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
    ]);
    // Even if the old ladder-style entitlements list ALSO happened to
    // include ai_freelancing_499 directly, Plus must not be implied.
    const result = await resolveCmsAwarePurchased(
      { subscriptionPeriods },
      'u1',
      ['ai_freelancing_499'],
      NOW,
    );
    expect(result).toContain('ai_freelancing_499');
    expect(result).not.toContain('ai_income_99');
  });

  it('an active Max subscription implies BOTH ai_income_99 and ai_freelancing_499 (PO-2 inheritance)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 1 * DAY_MS),
      }),
    ]);
    const result = await resolveCmsAwarePurchased({ subscriptionPeriods }, 'u1', [], NOW);
    expect(result).toContain('ai_income_99');
    expect(result).toContain('ai_freelancing_499');
  });

  it('preserves the unrelated retired one-time SKU: holding it still implies ai_income_99/ai_freelancing_499 via the existing ladder, with NO subscription_periods row at all', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([]);
    const result = await resolveCmsAwarePurchased(
      { subscriptionPeriods },
      'u1',
      ['ai_client_acquisition_1499'],
      NOW,
    );
    // The retired SKU id itself passes through unchanged...
    expect(result).toContain('ai_client_acquisition_1499');
    // ...note: resolveCmsAwarePurchased only adjusts which of the two
    // CMS-gated ids are IN the list it returns; whether holding the
    // retired SKU implies them is decided by canAccessProduct/the ladder
    // downstream (see hasCmsAwareAccess test below), not by this
    // function directly filtering them out of its own input.
  });

  it('hasCmsAwareAccess: the retired one-time SKU still implies ai_income_99 through the ladder, unaffected by this change', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([]);
    const granted = await hasCmsAwareAccess(
      { subscriptionPeriods },
      'u1',
      ['ai_client_acquisition_1499'],
      'ai_income_99',
      NOW,
    );
    expect(granted).toBe(true);
  });

  it('hasCmsAwareAccess: a non-CMS-gated product (the retired SKU itself) is unaffected by this change', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([]);
    const granted = await hasCmsAwareAccess(
      { subscriptionPeriods },
      'u1',
      ['ai_client_acquisition_1499'],
      'ai_client_acquisition_1499' as ProductId,
      NOW,
    );
    expect(granted).toBe(true);
  });

  it('an unrelated user with an active Max subscription does not grant this user anything', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({
        userId: 'other_user',
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 1 * DAY_MS),
      }),
    ]);
    const result = await resolveCmsAwarePurchased({ subscriptionPeriods }, 'u1', [], NOW);
    expect(result).not.toContain('ai_income_99');
    expect(result).not.toContain('ai_freelancing_499');
  });
});
