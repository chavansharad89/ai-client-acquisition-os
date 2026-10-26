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

import { createContainer, fakeCmsAdminRepository, fakeContentItemRepository } from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';
import { fakeSubscriptionPeriodRepository, type SubscriptionPeriod } from '@acos/core-subscriptions';

// Phase 4 — GET/POST /api/cms/admin/content HTTP-layer coverage.
// Domain-level validation is already covered by @acos/core-cms's
// contentService.test.ts; this file covers: session resolution,
// CMS-admin authorization (NOT customer entitlement/subscription),
// lifecycle-status-agnostic admin reads, and the CMS-PO-010 asset
// boundary.

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
let cmsAdmins: ReturnType<typeof fakeCmsAdminRepository>;
let contentItems: ReturnType<typeof fakeContentItemRepository>;
let subscriptionPeriods: ReturnType<typeof fakeSubscriptionPeriodRepository>;
let sessionToken: string | undefined;

vi.mock('../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, cmsAdmins, contentItems, subscriptionPeriods }),
}));
vi.mock('../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET, POST } = await import('./route');

function getRequest(query: string, cookie?: string) {
  sessionToken = cookie;
  return GET(new Request(`http://localhost/api/cms/admin/content${query}`) as never);
}

function postRequest(body: unknown, cookie?: string) {
  sessionToken = cookie;
  return POST(
    new Request('http://localhost/api/cms/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('GET /api/cms/admin/content', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await getRequest('?owningProductId=ai_income_99');
    expect(response.status).toBe(401);
  });

  it('403s for an authenticated user with no cms_admins membership', async () => {
    identity = fakeIdentityByToken({ 'tok-customer': 'user-customer' });
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await getRequest('?owningProductId=ai_income_99', 'tok-customer');
    expect(response.status).toBe(403);
  });

  it('SECURITY: a Plus/Pro/Max subscription without cms_admins membership still gets 403 (admin auth != customer entitlement)', async () => {
    identity = fakeIdentityByToken({ 'tok-max': 'user-max-subscriber' });
    cmsAdmins = fakeCmsAdminRepository(); // no membership
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-max-subscriber', productSlug: 'ai_client_acquisition_1499_subscription' }),
    ]);

    const response = await getRequest('?owningProductId=ai_income_99', 'tok-max');
    expect(response.status).toBe(403);
  });

  it('SECURITY: a CMS admin with NO customer subscription at all is still allowed', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository(); // no subscriptions of any kind

    const response = await getRequest('?owningProductId=ai_income_99', 'tok-admin');
    expect(response.status).toBe(200);
  });

  it('admin can list DRAFT, PUBLISHED, and ARCHIVED content alike (unlike the customer API)', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const draft = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Draft' });
    const published = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Published' });
    await contentItems.setStatus(published.id, 'PUBLISHED');
    const archived = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Archived' });
    await contentItems.setStatus(archived.id, 'PUBLISHED');
    await contentItems.setStatus(archived.id, 'ARCHIVED');

    const response = await getRequest('?owningProductId=ai_income_99&all=true', 'tok-admin');
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<{ id: string; status: string }>;
    expect(body.map((i) => i.id).sort()).toEqual([draft.id, published.id, archived.id].sort());
    expect(body.find((i) => i.id === archived.id)?.status).toBe('ARCHIVED');
  });

  it('rejects a non-CMS-eligible owningProductId', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await getRequest('?owningProductId=ai_client_acquisition_1499', 'tok-admin');
    expect(response.status).toBe(400);
  });
});

describe('POST /api/cms/admin/content (create container)', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await postRequest({ owningProductId: 'ai_income_99', parentId: null, title: 'X' });
    expect(response.status).toBe(401);
  });

  it('403s for a non-admin', async () => {
    identity = fakeIdentityByToken({ 'tok-customer': 'user-customer' });
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await postRequest({ owningProductId: 'ai_income_99', parentId: null, title: 'X' }, 'tok-customer');
    expect(response.status).toBe(403);
  });

  it('admin can create a container', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await postRequest({ owningProductId: 'ai_income_99', parentId: null, title: 'Chapter 1' }, 'tok-admin');
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.nodeType).toBe('CONTAINER');
    expect(body.owningProductId).toBe('ai_income_99');
  });

  it('rejects an invalid (nonexistent) parent', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await postRequest(
      { owningProductId: 'ai_income_99', parentId: 'does-not-exist', title: 'X' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.field).toBe('parentId');
    expect(body.reason).toBe('invalid-parent');
  });

  it('rejects a cross-plan parent/child', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const plusChapter = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });

    const response = await postRequest(
      { owningProductId: 'ai_freelancing_499', parentId: plusChapter.id, title: 'Pro under Plus' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.reason).toBe('cross-plan-parent');
  });

  it('rejects a non-CMS-eligible owning product', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await postRequest(
      { owningProductId: 'ai_client_acquisition_1499', parentId: null, title: 'X' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
  });

  it('ASSET BOUNDARY (CMS-PO-010): rejects a body carrying asset-only fields', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();

    const response = await postRequest(
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Should be rejected',
        assetKind: 'FILE',
        storageKey: 's3://bucket/x.pdf',
      },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('ASSET_CREATION_NOT_AVAILABLE');
  });
});
