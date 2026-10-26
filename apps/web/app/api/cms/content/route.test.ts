import { describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/placeholder';
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET ??= 'rzp_secret_placeholder';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'whsec_placeholder';
process.env.META_PIXEL_ID ??= '1234567890';
process.env.META_CAPI_ACCESS_TOKEN ??= 'meta_token_placeholder';
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-placeholder-not-real';
process.env.DOWNLOAD_GRANT_SECRET ??= 'e'.repeat(48);
process.env.GOOGLE_PLACES_API_KEY ??= 'places-key-placeholder-not-real';

import { createContainer, fakeContentItemRepository } from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';
import { fakeSubscriptionPeriodRepository } from '@acos/core-subscriptions';
import type { SubscriptionPeriod } from '@acos/core-subscriptions';

// Phase 3F — GET /api/cms/content HTTP-layer coverage. Domain-level
// PUBLISHED-only/plan-permitted filtering is already covered by
// @acos/core-cms's customerContentService.test.ts; this file only
// covers the route's own protocol rules: session resolution and the
// SECURITY property that there is no client-supplied filter capable of
// changing which plans' content comes back.

const DAY_MS = 24 * 60 * 60 * 1000;

function fakeIdentityByToken(tokenToUserId: Record<string, string>) {
  const byHash = new Map(Object.entries(tokenToUserId).map(([token, userId]) => [hashAccessToken(token), userId]));
  return {
    async findSessionToken(tokenHash: string) {
      const userId = byHash.get(tokenHash);
      if (!userId) return null;
      return { userId, expiresAt: new Date(Date.now() + DAY_MS), revokedAt: null };
    },
  };
}

function subscriptionPeriod(overrides: Partial<SubscriptionPeriod> & { userId: string; productSlug: string }): SubscriptionPeriod {
  return {
    id: `sp_${Math.random().toString(36).slice(2)}`,
    razorpaySubscriptionId: 'sub_test',
    razorpayPaymentId: `pay_${Math.random().toString(36).slice(2)}`,
    activationAt: new Date(Date.now() - DAY_MS),
    durationDays: 30,
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

let identity: ReturnType<typeof fakeIdentityByToken>;
let subscriptionPeriods: ReturnType<typeof fakeSubscriptionPeriodRepository>;
let contentItems: ReturnType<typeof fakeContentItemRepository>;
let sessionToken: string | undefined;

vi.mock('../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, subscriptionPeriods, contentItems }),
}));
vi.mock('../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET } = await import('./route');

function getRequest(cookie?: string) {
  sessionToken = cookie;
  return GET(new Request('http://localhost/api/cms/content') as never);
}

describe('GET /api/cms/content', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    subscriptionPeriods = fakeSubscriptionPeriodRepository();
    contentItems = fakeContentItemRepository();

    const response = await getRequest();
    expect(response.status).toBe(401);
  });

  it('401s for an unknown/invalid session token', async () => {
    identity = fakeIdentityByToken({});
    subscriptionPeriods = fakeSubscriptionPeriodRepository();
    contentItems = fakeContentItemRepository();

    const response = await getRequest('not-a-real-token');
    expect(response.status).toBe(401);
  });

  it('returns only PUBLISHED content for the plan the user actually holds', async () => {
    identity = fakeIdentityByToken({ 'tok-plus': 'user-plus' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    contentItems = fakeContentItemRepository();
    const plusItem = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Plus chapter' },
    );
    await contentItems.setStatus(plusItem.id, 'PUBLISHED');
    const proItem = await createContainer(
      { contentItems },
      { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro chapter' },
    );
    await contentItems.setStatus(proItem.id, 'PUBLISHED');

    const response = await getRequest('tok-plus');
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{ id: string }>;
    expect(body.map((item) => item.id)).toEqual([plusItem.id]);
  });

  it('SECURITY: an expired subscription returns an empty list, not an error, and not another plan\'s content', async () => {
    identity = fakeIdentityByToken({ 'tok-expired': 'user-expired' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({
        userId: 'user-expired',
        productSlug: 'ai_income_99',
        activationAt: new Date(Date.now() - 60 * DAY_MS),
        durationDays: 30,
      }),
    ]);
    contentItems = fakeContentItemRepository();
    const plusItem = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Plus chapter' },
    );
    await contentItems.setStatus(plusItem.id, 'PUBLISHED');

    const response = await getRequest('tok-expired');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it('SECURITY: Max sees Plus + Pro + Max; Plus alone does not', async () => {
    identity = fakeIdentityByToken({ 'tok-max': 'user-max' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-max', productSlug: 'ai_client_acquisition_1499_subscription' }),
    ]);
    contentItems = fakeContentItemRepository();
    const plus = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });
    const pro = await createContainer({ contentItems }, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro' });
    const max = await createContainer(
      { contentItems },
      { owningProductId: 'ai_client_acquisition_1499_subscription', parentId: null, title: 'Max' },
    );
    await Promise.all([
      contentItems.setStatus(plus.id, 'PUBLISHED'),
      contentItems.setStatus(pro.id, 'PUBLISHED'),
      contentItems.setStatus(max.id, 'PUBLISHED'),
    ]);

    const response = await getRequest('tok-max');
    const body = (await response.json()) as Array<{ id: string }>;
    expect(body.map((i) => i.id).sort()).toEqual([plus.id, pro.id, max.id].sort());
  });
});
