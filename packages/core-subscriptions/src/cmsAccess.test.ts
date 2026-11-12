import { describe, expect, it } from 'vitest';

import {
  CMS_PLAN_INHERITANCE,
  CMS_PLAN_PRODUCT_IDS,
  findActiveCmsPlans,
  permittedContentPlans,
} from './cmsAccess';
import { fakeSubscriptionPeriodRepository } from './testing/fakeSubscriptionPeriodRepository';
import type { SubscriptionPeriod } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-25T00:00:00.000Z');

function period(overrides: Partial<SubscriptionPeriod>): SubscriptionPeriod {
  return {
    id: 'sp_1',
    userId: 'user_1',
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

describe('CMS_PLAN_INHERITANCE', () => {
  it('matches PO-2 exactly: Plus -> {Plus}, Pro -> {Pro}, Max -> {Plus, Pro, Max}', () => {
    expect(CMS_PLAN_INHERITANCE.ai_income_99).toEqual(['ai_income_99']);
    expect(CMS_PLAN_INHERITANCE.ai_freelancing_499).toEqual(['ai_freelancing_499']);
    expect(CMS_PLAN_INHERITANCE.ai_client_acquisition_1499_subscription).toEqual([
      'ai_income_99',
      'ai_freelancing_499',
      'ai_client_acquisition_1499_subscription',
    ]);
  });

  it('covers exactly the three CMS-eligible plans, no more, no fewer', () => {
    expect(Object.keys(CMS_PLAN_INHERITANCE).sort()).toEqual([...CMS_PLAN_PRODUCT_IDS].sort());
  });
});

describe('findActiveCmsPlans', () => {
  it('active Plus only -> {Plus}', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 10 * DAY_MS) }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active).toEqual(new Set(['ai_income_99']));
  });

  it('expired Plus -> {} (not active)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 40 * DAY_MS) }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active.size).toBe(0);
  });

  it('active Pro only -> {Pro}', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_freelancing_499', activationAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active).toEqual(new Set(['ai_freelancing_499']));
  });

  it('expired Pro -> {} (not active)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_freelancing_499', activationAt: new Date(NOW.getTime() - 31 * DAY_MS) }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active.size).toBe(0);
  });

  it('active Max only -> {Max} (before inheritance expansion)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({
        userId: 'u1',
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 1 * DAY_MS),
      }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active).toEqual(new Set(['ai_client_acquisition_1499_subscription']));
  });

  it('expired Max -> {} (not active)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({
        userId: 'u1',
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 31 * DAY_MS),
      }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active.size).toBe(0);
  });

  it('a refunded period never counts as active, even within its window', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 1 * DAY_MS), refundedAt: NOW }),
    ]);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(active.size).toBe(0);
  });
});

describe('permittedContentPlans — the full PO-2/PO-3/PO-5 access matrix', () => {
  it('Plus -> {Plus} only (no Pro, no Max)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
    ]);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(permitted).toEqual(new Set(['ai_income_99']));
  });

  it('Pro -> {Pro} only (no Plus, no Max)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_freelancing_499', activationAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
    ]);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(permitted).toEqual(new Set(['ai_freelancing_499']));
  });

  it('Max -> {Plus, Pro, Max}', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({
        userId: 'u1',
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 1 * DAY_MS),
      }),
    ]);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(permitted).toEqual(
      new Set(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499_subscription']),
    );
  });

  it('Plus + Pro both active independently -> {Plus, Pro}, Pro does NOT inherit Plus and vice versa', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
      period({ userId: 'u1', productSlug: 'ai_freelancing_499', activationAt: new Date(NOW.getTime() - 1 * DAY_MS), id: 'sp_2' }),
    ]);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(permitted).toEqual(new Set(['ai_income_99', 'ai_freelancing_499']));
  });

  it('everything expired -> {} (access denied, no grandfathering)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({ userId: 'u1', productSlug: 'ai_income_99', activationAt: new Date(NOW.getTime() - 31 * DAY_MS) }),
      period({ userId: 'u1', productSlug: 'ai_freelancing_499', activationAt: new Date(NOW.getTime() - 31 * DAY_MS), id: 'sp_2' }),
      period({
        userId: 'u1',
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 31 * DAY_MS),
        id: 'sp_3',
      }),
    ]);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(permitted.size).toBe(0);
  });

  it('a different user holding Max does not grant this user anything (per-user resolution)', async () => {
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      period({
        userId: 'other_user',
        productSlug: 'ai_client_acquisition_1499_subscription',
        activationAt: new Date(NOW.getTime() - 1 * DAY_MS),
      }),
    ]);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, 'u1', NOW);
    expect(permitted.size).toBe(0);
  });
});
