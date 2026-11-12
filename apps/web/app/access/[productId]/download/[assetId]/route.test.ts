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

import {
  buildAssetStorageKey,
  createAsset,
  createContainer,
  DOWNLOAD_AUTHORIZATION_TTL_SECONDS,
  fakeAssetStorage,
  fakeContentItemRepository,
} from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';
import { fakeSubscriptionPeriodRepository, type SubscriptionPeriod } from '@acos/core-subscriptions';

// Customer Fulfillment Phase B — GET /access/[productId]/download/[assetId]
// SECURITY coverage. This route reuses getAccessibleCmsContentItem
// (cmsContentService.ts) unchanged, exactly like the existing
// apps/web/app/api/cms/content/[id]/download/route.ts does — see that
// route's own test file for the original PUBLISHED/plan-eligibility
// boundary coverage this mirrors. This file additionally covers what's
// new here: redirecting instead of returning JSON, the extra
// params.productId consistency check, and the unauthenticated ->
// /access/login redirect (rather than a bare 401, matching this route's
// customer-facing, not API, nature).

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
let storage: ReturnType<typeof fakeAssetStorage>;
let sessionToken: string | undefined;

vi.mock('../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, subscriptionPeriods, contentItems, storage }),
}));
vi.mock('../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET } = await import('./route');

function getRequest(productId: string, assetId: string, cookie?: string) {
  sessionToken = cookie;
  return GET(new Request(`http://localhost/access/${productId}/download/${assetId}`) as never, {
    params: { productId, assetId },
  });
}

async function publishedAsset(
  overrides: { owningProductId: 'ai_income_99' | 'ai_freelancing_499'; storageKeySegment?: string } = {
    owningProductId: 'ai_income_99',
  },
) {
  const key = buildAssetStorageKey(overrides.owningProductId, overrides.storageKeySegment ?? 'seg-1', 'pdf');
  const asset = await createAsset(
    { contentItems },
    {
      owningProductId: overrides.owningProductId,
      parentId: null,
      title: 'Worksheet',
      assetKind: 'pdf',
      storageKey: key,
      bytes: '1024',
    },
  );
  await contentItems.setStatus(asset.id, 'PUBLISHED');
  return { asset, key };
}

function freshDeps() {
  identity = fakeIdentityByToken({ 'tok-plus': 'user-plus', 'tok-pro': 'user-pro' });
  contentItems = fakeContentItemRepository();
  storage = fakeAssetStorage();
}

describe('GET /access/[productId]/download/[assetId]', () => {
  it('redirects to /access/login with no session cookie (customer-facing, not a bare 401)', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);

    const response = await getRequest('ai_income_99', 'whatever');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/access/login');
  });

  it('404s for an authenticated user with no entitlement at all', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const { asset } = await publishedAsset();

    const response = await getRequest('ai_income_99', asset.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('404s for a DRAFT asset, even for the entitled owner', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const draft = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Draft worksheet',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'draft-1', 'pdf'),
        bytes: '1024',
      },
    );

    const response = await getRequest('ai_income_99', draft.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('200-range redirect for a PUBLISHED asset, to the signed download URL, for the entitled owner', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset, key } = await publishedAsset();

    const response = await getRequest('ai_income_99', asset.id, 'tok-plus');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`https://fake-storage.test/download/${encodeURIComponent(key)}`);
  });

  it('404s for a CONTAINER id — containers are never downloadable as an asset', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const container = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Chapter' },
    );
    await contentItems.setStatus(container.id, 'PUBLISHED');

    const response = await getRequest('ai_income_99', container.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('SECURITY: a Pro asset requested under the ai_income_99 URL segment 404s — the productId in the URL is a consistency check, not bypassable', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-pro', productSlug: 'ai_freelancing_499' }),
    ]);
    const { asset: proAsset } = await publishedAsset({ owningProductId: 'ai_freelancing_499' });

    // Genuinely downloadable under its own product's URL first.
    const correctUrl = await getRequest('ai_freelancing_499', proAsset.id, 'tok-pro');
    expect(correctUrl.status).toBe(307);

    const mismatchedUrl = await getRequest('ai_income_99', proAsset.id, 'tok-pro');
    expect(mismatchedUrl.status).toBe(404);
  });

  it('SECURITY: a Plus-only caller requesting a real PUBLISHED Pro asset id gets 404, identical to a nonexistent id', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
      subscriptionPeriod({ userId: 'user-pro', productSlug: 'ai_freelancing_499' }),
    ]);
    const { asset: proAsset } = await publishedAsset({ owningProductId: 'ai_freelancing_499' });

    const plusResponse = await getRequest('ai_freelancing_499', proAsset.id, 'tok-plus');
    expect(plusResponse.status).toBe(404);
  });

  it('SECURITY: no ?storageKey= or other client-supplied key — passes exactly the server-resolved storage key to AssetStorage', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset, key } = await publishedAsset();
    const spy = vi.spyOn(storage, 'createDownloadAuthorization');

    await getRequest('ai_income_99', asset.id, 'tok-plus');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBe(key);
  });

  it('SECURITY: requests exactly the approved one-hour TTL constant, never a client- or route-chosen value', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset } = await publishedAsset();
    const spy = vi.spyOn(storage, 'createDownloadAuthorization');

    await getRequest('ai_income_99', asset.id, 'tok-plus');

    expect(spy.mock.calls[0]?.[1]).toBe(DOWNLOAD_AUTHORIZATION_TTL_SECONDS);
    expect(DOWNLOAD_AUTHORIZATION_TTL_SECONDS).toBe(3600);
  });

  it('SECURITY: a storage-layer failure maps to a generic error, never the underlying message/secret', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset } = await publishedAsset();
    storage.createDownloadAuthorization = vi.fn(async () => {
      throw new Error('AccessDenied for bucket cms-assets-prod with key AKIA_SECRET_NOT_REAL');
    });

    const response = await getRequest('ai_income_99', asset.id, 'tok-plus');

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Internal error');
    expect(JSON.stringify(body)).not.toContain('AKIA_SECRET_NOT_REAL');
    expect(JSON.stringify(body)).not.toContain('cms-assets-prod');
  });

  it('CMS-PO-015: 404s for a PUBLISHED asset whose grandparent (not just its immediate parent) is ARCHIVED', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const root = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Root' },
    );
    await contentItems.setStatus(root.id, 'PUBLISHED');
    await contentItems.setStatus(root.id, 'ARCHIVED');
    const section = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: root.id, title: 'Section' },
    );
    await contentItems.setStatus(section.id, 'PUBLISHED');
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Hidden by grandparent',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-hidden', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const response = await getRequest('ai_income_99', asset.id, 'tok-plus');
    expect(response.status).toBe(404); // same no-existence-leak shape as an unknown/draft asset
  });
});
