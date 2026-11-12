import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  result: null as { active: boolean; expiresAt: Date | null; durationDays: number | null } | null,
  shouldThrow: false,
}));

vi.mock('./commerceRepositories', () => ({
  commerceRepositories: () => {
    if (state.shouldThrow) throw new Error('no database connection in this unit test');
    return { subscriptionPeriods: {} };
  },
}));

vi.mock('@acos/core-subscriptions', () => ({
  getClientFinderSubscriptionStatus: async () => state.result,
}));

describe('getMaxSubscriptionStatus', () => {
  it('reports active with the expiry date when the Client Finder subscription service says active', async () => {
    state.shouldThrow = false;
    state.result = { active: true, expiresAt: new Date('2027-01-15T00:00:00Z'), durationDays: 30 };
    const { getMaxSubscriptionStatus } = await import('./clientFinderStatus');

    const status = await getMaxSubscriptionStatus('user-1');

    expect(status).toEqual({ state: 'active', expiresAt: new Date('2027-01-15T00:00:00Z') });
  });

  it('reports inactive — covering both "never subscribed" and "expired", which the repository cannot distinguish', async () => {
    state.shouldThrow = false;
    state.result = { active: false, expiresAt: null, durationDays: null };
    const { getMaxSubscriptionStatus } = await import('./clientFinderStatus');

    const status = await getMaxSubscriptionStatus('user-2');

    expect(status).toEqual({ state: 'inactive' });
  });

  it('reports unavailable rather than throwing when the underlying query fails', async () => {
    state.shouldThrow = true;
    const { getMaxSubscriptionStatus } = await import('./clientFinderStatus');

    const status = await getMaxSubscriptionStatus('user-3');

    expect(status).toEqual({ state: 'unavailable' });
  });
});
