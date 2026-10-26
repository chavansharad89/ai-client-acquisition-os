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
import { fakeSubscriptionPeriodRepository, type SubscriptionPeriod } from '@acos/core-subscriptions';

// Phase 3F/3G SECURITY coverage — GET /api/cms/content/[id]. The
// request's own `id` param identifies which row to look up, never which
// plan the caller may see: a Plus-only user supplying a Pro content
// item's real id (by guessing, or by copying it from a Max user) must
// get exactly the same response a nonexistent id would.

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

vi.mock('../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, subscriptionPeriods, contentItems }),
}));
vi.mock('../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET } = await import('./route');

function getRequest(id: string, cookie?: string) {
  sessionToken = cookie;
  return GET(new Request(`http://localhost/api/cms/content/${id}`) as never, { params: { id } });
}

describe('GET /api/cms/content/[id]', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    subscriptionPeriods = fakeSubscriptionPeriodRepository();
    contentItems = fakeContentItemRepository();

    const response = await getRequest('whatever');
    expect(response.status).toBe(401);
  });

  it('returns the item when PUBLISHED and the caller holds the owning plan', async () => {
    identity = fakeIdentityByToken({ 'tok-plus': 'user-plus' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    contentItems = fakeContentItemRepository();
    const item = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Plus chapter' },
    );
    await contentItems.setStatus(item.id, 'PUBLISHED');

    const response = await getRequest(item.id, 'tok-plus');
    expect(response.status).toBe(200);
    expect((await response.json()).id).toBe(item.id);
  });

  it('404s for a nonexistent id', async () => {
    identity = fakeIdentityByToken({ 'tok-plus': 'user-plus' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    contentItems = fakeContentItemRepository();

    const response = await getRequest('does-not-exist', 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('404s for unpublished (DRAFT) content, even though the caller holds the owning plan', async () => {
    identity = fakeIdentityByToken({ 'tok-plus': 'user-plus' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    contentItems = fakeContentItemRepository();
    const draft = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Draft chapter' },
    );

    const response = await getRequest(draft.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('404s for archived content, even though the caller holds the owning plan', async () => {
    identity = fakeIdentityByToken({ 'tok-plus': 'user-plus' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    contentItems = fakeContentItemRepository();
    const item = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Item' },
    );
    await contentItems.setStatus(item.id, 'PUBLISHED');
    await contentItems.setStatus(item.id, 'ARCHIVED');

    const response = await getRequest(item.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('SECURITY: a Plus-only caller requesting a real PUBLISHED Pro content id gets 404, identical to a nonexistent id', async () => {
    identity = fakeIdentityByToken({ 'tok-plus': 'user-plus', 'tok-pro': 'user-pro' });
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
      subscriptionPeriod({ userId: 'user-pro', productSlug: 'ai_freelancing_499' }),
    ]);
    contentItems = fakeContentItemRepository();
    const proItem = await createContainer(
      { contentItems },
      { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro chapter' },
    );
    await contentItems.setStatus(proItem.id, 'PUBLISHED');

    // Confirm it's genuinely visible to its own (Pro) owner first.
    const proOwnerResponse = await getRequest(proItem.id, 'tok-pro');
    expect(proOwnerResponse.status).toBe(200);

    // The Plus-only caller changing the URL param to this real Pro id
    // must not bypass authorization.
    const plusResponse = await getRequest(proItem.id, 'tok-plus');
    expect(plusResponse.status).toBe(404);
    expect(await plusResponse.json()).toEqual({ error: 'Not found', code: 'NOT_FOUND' });
  });

  it('SECURITY: an expired subscription cannot retrieve its formerly-accessible content', async () => {
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
    const item = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Item' },
    );
    await contentItems.setStatus(item.id, 'PUBLISHED');

    const response = await getRequest(item.id, 'tok-expired');
    expect(response.status).toBe(404);
  });
});
