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
  type ContentItem,
} from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';
import { fakeSubscriptionPeriodRepository, type SubscriptionPeriod } from '@acos/core-subscriptions';

// CMS-PO-010(R2) — GET /api/cms/content/[id]/download SECURITY coverage.
// This route reuses getAccessibleCmsContentItem (cmsContentService.ts)
// unchanged — the same PUBLISHED/plan-eligibility boundary already
// proven by content/[id]/route.test.ts — so this file focuses on what's
// new: the signed-download step and the "never trust/expose a storage
// key" guarantees.

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

vi.mock('../../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, subscriptionPeriods, contentItems, storage }),
}));
vi.mock('../../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET } = await import('./route');

function getRequest(id: string, cookie?: string, query = '') {
  sessionToken = cookie;
  return GET(new Request(`http://localhost/api/cms/content/${id}/download${query}`) as never, { params: { id } });
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
  identity = fakeIdentityByToken({
    'tok-plus': 'user-plus',
    'tok-pro': 'user-pro',
    'tok-expired': 'user-expired',
  });
  contentItems = fakeContentItemRepository();
  storage = fakeAssetStorage();
}

describe('GET /api/cms/content/[id]/download', () => {
  it('401s with no session cookie', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);

    const response = await getRequest('whatever');
    expect(response.status).toBe(401);
  });

  it('404s for an authenticated user with no entitlement at all', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const { asset } = await publishedAsset();

    const response = await getRequest(asset.id, 'tok-plus');
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

    const response = await getRequest(draft.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('404s for an ARCHIVED asset, even for the entitled owner', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset } = await publishedAsset();
    await contentItems.setStatus(asset.id, 'ARCHIVED');

    const response = await getRequest(asset.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('200s a PUBLISHED asset for the entitled owner, with only downloadUrl/expiresAt', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset } = await publishedAsset();

    const response = await getRequest(asset.id, 'tok-plus');
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['downloadUrl', 'expiresAt']);
    expect(typeof body.downloadUrl).toBe('string');
    expect(typeof body.expiresAt).toBe('string');
  });

  it('404s for an expired subscription', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({
        userId: 'user-expired',
        productSlug: 'ai_income_99',
        activationAt: new Date(Date.now() - 60 * DAY_MS),
        durationDays: 30,
      }),
    ]);
    const { asset } = await publishedAsset();

    const response = await getRequest(asset.id, 'tok-expired');
    expect(response.status).toBe(404);
  });

  it('SECURITY: a Plus-only caller requesting a real PUBLISHED Pro asset id gets 404, identical to a nonexistent id', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
      subscriptionPeriod({ userId: 'user-pro', productSlug: 'ai_freelancing_499' }),
    ]);
    const { asset: proAsset } = await publishedAsset({ owningProductId: 'ai_freelancing_499' });

    // Confirm it's genuinely downloadable by its own (Pro) owner first.
    const proOwnerResponse = await getRequest(proAsset.id, 'tok-pro');
    expect(proOwnerResponse.status).toBe(200);

    const plusResponse = await getRequest(proAsset.id, 'tok-plus');
    expect(plusResponse.status).toBe(404);
    expect(await plusResponse.json()).toEqual({ error: 'Not found', code: 'NOT_FOUND' });
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

    const response = await getRequest(container.id, 'tok-plus');
    expect(response.status).toBe(404);
  });

  it('SECURITY: passes exactly the server-resolved storage key to AssetStorage, and the client cannot influence it', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const { asset, key } = await publishedAsset();
    const spy = vi.spyOn(storage, 'createDownloadAuthorization');

    // A client-supplied query string has no code path to reach here at all.
    await getRequest(asset.id, 'tok-plus', '?storageKey=cms/ai_income_99/assets/attacker-chosen.pdf');

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

    await getRequest(asset.id, 'tok-plus');

    expect(spy.mock.calls[0]?.[1]).toBe(DOWNLOAD_AUTHORIZATION_TTL_SECONDS);
    expect(DOWNLOAD_AUTHORIZATION_TTL_SECONDS).toBe(3600);
  });

  it('SECURITY: an obsolete previousStorageKey is never read or requested — only the current storageKey is', async () => {
    freshDeps();
    subscriptionPeriods = fakeSubscriptionPeriodRepository([
      subscriptionPeriod({ userId: 'user-plus', productSlug: 'ai_income_99' }),
    ]);
    const currentKey = buildAssetStorageKey('ai_income_99', 'current', 'pdf');
    const obsoleteKey = buildAssetStorageKey('ai_income_99', 'obsolete', 'pdf');
    const seeded: ContentItem = {
      id: 'asset-with-obsolete-key',
      owningProductId: 'ai_income_99',
      parentId: null,
      nodeType: 'ASSET',
      assetKind: 'pdf',
      title: 'Worksheet',
      description: null,
      storageKey: currentKey,
      bytes: '1024',
      orderIndex: 0,
      status: 'PUBLISHED',
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      replacesContentItemId: null,
      previousStorageKey: obsoleteKey,
      previousStorageRetentionUntil: new Date(Date.now() + 30 * DAY_MS),
    };
    contentItems = fakeContentItemRepository([seeded]);
    const spy = vi.spyOn(storage, 'createDownloadAuthorization');

    const response = await getRequest(seeded.id, 'tok-plus');

    expect(response.status).toBe(200);
    expect(spy.mock.calls[0]?.[0]).toBe(currentKey);
    expect(spy.mock.calls[0]?.[0]).not.toBe(obsoleteKey);
    const body = (await response.json()) as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain(obsoleteKey);
    expect(JSON.stringify(body)).not.toContain(currentKey);
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

    const response = await getRequest(asset.id, 'tok-plus');

    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('Internal error');
    expect(JSON.stringify(body)).not.toContain('AKIA_SECRET_NOT_REAL');
    expect(JSON.stringify(body)).not.toContain('cms-assets-prod');
  });
});
