process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/placeholder';
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET ??= 'rzp_secret_placeholder';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'whsec_placeholder';
process.env.META_PIXEL_ID ??= '1234567890';
process.env.META_CAPI_ACCESS_TOKEN ??= 'meta_token_placeholder';
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-placeholder-not-real';
process.env.DOWNLOAD_GRANT_SECRET ??= 'e'.repeat(48);
process.env.GOOGLE_PLACES_API_KEY ??= 'places-key-placeholder-not-real';

import { getProduct, type ProductId } from '@acos/catalog';
import { buildAssetStorageKey, createAsset, createContainer, fakeContentItemRepository } from '@acos/core-cms';
import { funnelStateFor } from '@acos/core-entitlements';
import { fakeSubscriptionPeriodRepository, type SubscriptionPeriod } from '@acos/core-subscriptions';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { WebAccessResolution } from '../../../src/server/access';

// Customer Fulfillment Phase B — /access/[productId] CMS-backed read
// path (Stages 1-3). The entitlement/plan gate itself (currentAccess ->
// resolveCmsAwarePurchased) is faked wholesale here, exactly like
// access/page.test.ts already does for the library list page — this
// file is about what Phase B actually changed: which content source
// renders, and the Variant-1 parallel-run fallback boundary. Plan
// inheritance/published-filtering/expiry are NOT re-tested here — they
// are @acos/core-cms's customerContentService.ts /
// @acos/core-subscriptions' cmsAccess.ts's own, already-covered,
// unmodified responsibility; this page only composes them.

const DAY_MS = 24 * 60 * 60 * 1000;

const state = vi.hoisted(() => ({
  resolution: null as WebAccessResolution | null,
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
  // CMS-PO-013 (Task 4): ProductRoadmap renders client-side and calls
  // useRouter() for its handleSelect navigation wrapper — this page test
  // renders it via renderToStaticMarkup, so useRouter needs a stub.
  useRouter: () => ({ push: () => {} }),
}));

vi.mock('../../../src/server/access', () => ({
  currentAccess: async () => state.resolution,
}));
vi.mock('../../../src/server/customerDisplayName', () => ({
  getCustomerDisplayName: async (productId: ProductId) => getProduct(productId).name,
}));

let contentItems: ReturnType<typeof fakeContentItemRepository>;
let subscriptionPeriods: ReturnType<typeof fakeSubscriptionPeriodRepository>;

vi.mock('../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ contentItems, subscriptionPeriods }),
}));

(globalThis as { React?: typeof React }).React = React;

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

/**
 * Grants `purchased` both on the entitlement gate (`currentAccess`'s
 * faked resolution) AND as a real active `subscription_periods` row for
 * each CMS-gated product in the list — `permittedContentPlans` (the real,
 * unmocked function `listAccessibleCmsContent` calls) only honors the
 * latter, exactly as it does in production.
 */
function grant(purchased: ProductId[], userId = 'user-1') {
  state.resolution = {
    granted: true,
    context: { customerEmail: 'buyer@example.com', purchased, userId },
    funnel: funnelStateFor(purchased),
  };
  subscriptionPeriods = fakeSubscriptionPeriodRepository(
    purchased
      .filter((productId) => productId === 'ai_income_99' || productId === 'ai_freelancing_499')
      .map((productId) => subscriptionPeriod({ userId, productSlug: productId })),
  );
}

async function renderProduct(productId: string, searchParams?: { topic?: string | string[] }) {
  const { default: ProductAccessPage } = await import('./page');
  return renderToStaticMarkup(
    await ProductAccessPage(searchParams ? { params: { productId }, searchParams } : { params: { productId } }),
  );
}

beforeEach(() => {
  state.resolution = null;
  contentItems = fakeContentItemRepository();
  subscriptionPeriods = fakeSubscriptionPeriodRepository();
  delete process.env.CMS_ACCESS_CUTOVER_ENABLED;
  vi.resetModules();
});

afterEach(() => {
  delete process.env.CMS_ACCESS_CUTOVER_ENABLED;
});

describe('/access/[productId] — Customer Fulfillment Phase B parallel-run boundary', () => {
  it('flag off (Stage 1 default): reads the legacy deliverables.ts manifest for ai_income_99, not CMS, even if CMS has published content', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'false';
    grant(['ai_income_99']);
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'A CMS-only title that must not appear',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99');
    expect(html).not.toContain('A CMS-only title that must not appear');
    expect(html).toContain('/api/downloads/ai_income_99/');
  });

  it('flag on, CMS has published content: renders from CMS via the new download route, not the legacy grant', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'CMS-backed worksheet',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    // CMS-PO-013 (Task 4): the bare overview no longer renders an ASSET's
    // detail/download link inline (RoadmapView only inline-renders
    // TopicDetails for a CONTAINER selection) — render the dedicated
    // topic-detail page via ?topic= instead, where the download link
    // this test is proving (the per-asset route, not the legacy grant
    // URL) actually appears.
    const html = await renderProduct('ai_income_99', { topic: asset.id });
    expect(html).toContain('CMS-backed worksheet');
    expect(html).toContain(`/access/ai_income_99/download/${asset.id}`);
    expect(html).not.toContain('/api/downloads/ai_income_99/');
  });

  it('Variant-1 fallback: flag on but CMS has zero published items for the product falls back to deliverables.ts, with an observable log signal', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const html = await renderProduct('ai_income_99');

    expect(html).toContain('/api/downloads/ai_income_99/');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"access.cms_fallback_to_legacy"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"reason":"zero-published-cms-items"'));
    warnSpy.mockRestore();
  });

  it('a DRAFT-only CMS state behaves exactly like zero published items (falls back), never partially rendering an unpublished item', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Still a draft, must never render',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    // Deliberately not setStatus('PUBLISHED') — stays DRAFT.

    const html = await renderProduct('ai_income_99');
    expect(html).not.toContain('Still a draft, must never render');
    expect(html).toContain('/api/downloads/ai_income_99/');
  });

  it('the retired ai_client_acquisition_1499 SKU never attempts CMS, flag on or off (out of CMS scope by design, not a fallback)', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499']);
    const findAllSpy = vi.spyOn(contentItems, 'findAllByOwningProduct');

    const html = await renderProduct('ai_client_acquisition_1499');

    expect(html).toContain('/api/downloads/ai_client_acquisition_1499/');
    expect(findAllSpy).not.toHaveBeenCalled();
  });

  it('preserves the existing entitlement gate: an unauthenticated visitor never reaches the CMS branch and is redirected to /access', async () => {
    state.resolution = {
      granted: false,
      reason: 'no-token',
      funnel: funnelStateFor([]),
    } as WebAccessResolution;
    const findAllSpy = vi.spyOn(contentItems, 'findAllByOwningProduct');

    const { default: ProductAccessPage } = await import('./page');
    await expect(ProductAccessPage({ params: { productId: 'ai_income_99' } })).rejects.toThrow();
    expect(findAllSpy).not.toHaveBeenCalled();
  });

  it('preserves the existing wrong-product redirect: a Plus-only visitor to the Pro page never reaches the CMS branch (Plus does not imply Pro, unlike the reverse ladder direction)', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const findAllSpy = vi.spyOn(contentItems, 'findAllByOwningProduct');

    const { default: ProductAccessPage } = await import('./page');
    await expect(ProductAccessPage({ params: { productId: 'ai_freelancing_499' } })).rejects.toThrow();
    expect(findAllSpy).not.toHaveBeenCalled();
  });

  it('flag on, CMS has a published CONTAINER with an ASSET child: renders the container title and the nested asset, not a flat list', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const section = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'AI Fundamentals', orderIndex: 0 },
    );
    await contentItems.setStatus(section.id, 'PUBLISHED');
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'What is AI?',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99');
    expect(html).toContain('AI Fundamentals');
    expect(html).toContain('What is AI?');
  });

  it('flag on, CMS has only an empty published CONTAINER (zero ASSET rows anywhere): falls back to legacy exactly like the zero-published-items case', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const section = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Empty Section', orderIndex: 0 },
    );
    await contentItems.setStatus(section.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99');
    expect(html).toContain('Prompt library');
  });
  it('CMS-PO-015: a PUBLISHED topic never renders when its grandparent (not just its immediate parent) is ARCHIVED', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_freelancing_499']);
    const root = await createContainer(
      { contentItems },
      { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Archived Root', orderIndex: 0 },
    );
    await contentItems.setStatus(root.id, 'PUBLISHED');
    await contentItems.setStatus(root.id, 'ARCHIVED');
    const section = await createContainer(
      { contentItems },
      { owningProductId: 'ai_freelancing_499', parentId: root.id, title: 'Published Section', orderIndex: 0 },
    );
    await contentItems.setStatus(section.id, 'PUBLISHED');
    const topic = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_freelancing_499',
        parentId: section.id,
        title: 'Hidden-by-grandparent topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_freelancing_499', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(topic.id, 'PUBLISHED');

    const html = await renderProduct('ai_freelancing_499');
    expect(html).not.toContain('Hidden-by-grandparent topic');
    expect(html).not.toContain('Published Section');
    expect(html).toContain('/api/downloads/ai_freelancing_499/'); // falls back to legacy -- the CMS tree has zero effectively-published ASSET rows
  });
});

// CMS-PO-015 release-scoping follow-up (2026-11-10): F-01 and R-1 live in
// their own describe block, independent of CMS-PO-014's Learning Path
// Selection describe block below, so this coverage can be included in a
// CMS-PO-015-only changeset without that block's scaffolding. Nothing
// about either test actually depended on it: the fixtures they use
// (`grant`, `contentItems`, `renderProduct`, `createContainer`,
// `createAsset`, `buildAssetStorageKey`) are all file-level (the
// `beforeEach`/`afterEach` above apply to every describe block in this
// file, and the CMS-PO-014 describe block itself has no describe-local
// setup of its own) -- moving them here changes nothing about what they
// exercise or assert.
describe('/access/[productId] — CMS-PO-015 Plus route regression tests (F-01, R-1)', () => {
  // Independent-review Finding F-01 (CMS-PO-015 security review,
  // 2026-11-09): exercises the real Plus route boundary (this page +
  // LearningPathSelection, not an isolated helper) with mixed siblings --
  // a selectable published path, a sibling hidden by its own DRAFT status,
  // and an ARCHIVED sibling whose own PUBLISHED child must stay hidden
  // because of that ancestor. Because `cmsLibraryTree` only ever builds
  // its tree from the already-ancestor-filtered item set
  // (`listPublishedContentForPlans`), the archived sibling's child can
  // never reach `buildContentTree` at all, so it can never be promoted to
  // appear as a selectable top-level learning path of its own.
  it('mixed siblings in the Plus path list: a hidden sibling and a descendant hidden by an archived ancestor are never selectable or exposed, and never promoted to a top-level path (F-01)', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);

    const pathA = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Path A', orderIndex: 0 },
    );
    await contentItems.setStatus(pathA.id, 'PUBLISHED');
    const assetA = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: pathA.id,
        title: 'Path A topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'f01-a', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(assetA.id, 'PUBLISHED');

    // Sibling hidden by its own DRAFT status -- must not be selectable.
    await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Draft Path', orderIndex: 1 },
    );
    // never published -- stays DRAFT

    // ARCHIVED sibling whose own PUBLISHED child must stay hidden because
    // of this ancestor, and must never surface as its own top-level path.
    const archivedPath = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Archived Path', orderIndex: 2 },
    );
    await contentItems.setStatus(archivedPath.id, 'PUBLISHED');
    await contentItems.setStatus(archivedPath.id, 'ARCHIVED');
    const promotionCandidate = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: archivedPath.id, title: 'Should Not Be A Path', orderIndex: 0 },
    );
    await contentItems.setStatus(promotionCandidate.id, 'PUBLISHED'); // own status fine -- only the archived ancestor hides it

    // A second valid sibling, ordered after the hidden ones, to prove
    // ordering/tree structure among the surviving items is unaffected by
    // the hidden siblings interleaved before it.
    const pathD = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Path D', orderIndex: 3 },
    );
    await contentItems.setStatus(pathD.id, 'PUBLISHED');
    const assetD = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: pathD.id,
        title: 'Path D topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'f01-d', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(assetD.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99');

    expect(html).toContain('Path A'); // valid sibling remains selectable
    expect(html).toContain('Path D'); // valid sibling remains selectable
    expect(html.indexOf('Path A')).toBeLessThan(html.indexOf('Path D')); // existing ordering preserved
    expect(html).not.toContain('Draft Path'); // hidden by its own DRAFT status
    expect(html).not.toContain('Archived Path'); // hidden by its own ARCHIVED status
    expect(html).not.toContain('Should Not Be A Path'); // hidden by its ancestor, never promoted to a top-level path

    // The selected path itself still resolves correctly through the real
    // route -- this isn't only a selection-page string check.
    const selectedHtml = await renderProduct('ai_income_99', { path: pathA.id });
    expect(selectedHtml).toContain('Roadmap');
    expect(selectedHtml).toContain('Path A topic');
  });

  // Independent-review Finding R-1 (CMS-PO-015 F-01 follow-up review,
  // 2026-11-09): the test above only checks what the selection page
  // itself lists; it never tries the realistic bypass vector -- directly
  // supplying a hidden item's real id through the ?path= query parameter,
  // hoping `resolvePathParam` trusts the caller-supplied id over the
  // server's own effective-status filtering. This test tries exactly
  // that, for every way an id can be hidden (own DRAFT status, own
  // ARCHIVED status, and PUBLISHED-but-under-an-ARCHIVED-ancestor -- the
  // case where a check on the targeted id's own row alone would wrongly
  // let it through), alongside a valid id to confirm normal, unaffected
  // behavior.
  it('a direct ?path=<hidden-content-id> deep link never bypasses effective-status enforcement, for every way a path can be hidden (R-1)', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);

    const validPath = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Valid Path', orderIndex: 0 },
    );
    await contentItems.setStatus(validPath.id, 'PUBLISHED');
    const validAsset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: validPath.id,
        title: 'Valid Path topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'r1-valid', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(validAsset.id, 'PUBLISHED');

    // Hidden by its own DRAFT status.
    const draftPath = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Draft Path', orderIndex: 1 },
    );
    // never published -- stays DRAFT

    // Hidden by its own ARCHIVED status.
    const archivedPath = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'Archived Path', orderIndex: 2 },
    );
    await contentItems.setStatus(archivedPath.id, 'PUBLISHED');
    await contentItems.setStatus(archivedPath.id, 'ARCHIVED');

    // PUBLISHED own status, but hidden by an ARCHIVED ancestor -- the
    // specific bypass case this finding targets.
    const hiddenByAncestor = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: archivedPath.id, title: 'Hidden By Ancestor Path', orderIndex: 0 },
    );
    await contentItems.setStatus(hiddenByAncestor.id, 'PUBLISHED');
    const hiddenByAncestorAsset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: hiddenByAncestor.id,
        title: 'Hidden By Ancestor topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'r1-hidden', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(hiddenByAncestorAsset.id, 'PUBLISHED');

    for (const hiddenId of [draftPath.id, archivedPath.id, hiddenByAncestor.id]) {
      const html = await renderProduct('ai_income_99', { path: hiddenId });
      expect(html).toContain('Choose a learning path'); // falls back to selection -- exactly like an unknown id, no existence leak
      expect(html).not.toContain('Roadmap'); // never scoped into the hidden path's own view
      expect(html).not.toContain('Hidden By Ancestor topic'); // the ancestor-hidden content itself never renders
    }

    // Existing, valid Plus selection/navigation behavior is unaffected
    // alongside the bypass attempts above.
    const validHtml = await renderProduct('ai_income_99', { path: validPath.id });
    expect(validHtml).toContain('Roadmap');
    expect(validHtml).toContain('Valid Path topic');
  });
});

describe('/access/[productId] — dedicated topic-detail view (CMS-PO-013)', () => {
  it('renders the dedicated topic-detail view for a valid ?topic= matching a published ASSET', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Dedicated-view topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99', { topic: asset.id });
    expect(html).toContain(asset.title);
    expect(html).toContain(`/access/ai_income_99/download/${asset.id}`);
    expect(html).not.toContain('Roadmap');
  });

  it('falls back to the overview when ?topic= does not match any node', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Overview-only topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99', { topic: 'does-not-exist' });
    expect(html).toContain('Roadmap');
    expect(html).not.toContain('Back to course overview');
  });

  it('falls back to the overview when ?topic= matches a CONTAINER, not an ASSET', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const section = await createContainer(
      { contentItems },
      { owningProductId: 'ai_income_99', parentId: null, title: 'A Section', orderIndex: 0 },
    );
    await contentItems.setStatus(section.id, 'PUBLISHED');
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'A Topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99', { topic: section.id });
    expect(html).toContain('Roadmap');
    expect(html).not.toContain('Back to course overview');
  });

  it('falls back to the overview when ?topic= matches a real ASSET owned by a different product', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99', 'ai_freelancing_499']);
    const otherAsset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_freelancing_499',
        parentId: null,
        title: 'Freelancing-only topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_freelancing_499', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(otherAsset.id, 'PUBLISHED');
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Income topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99', { topic: otherAsset.id });
    expect(html).toContain('Roadmap');
    expect(html).not.toContain('Back to course overview');
  });

  it('falls back to the overview when ?topic= matches a DRAFT (unpublished) ASSET', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const published = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Published topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(published.id, 'PUBLISHED');
    const draft = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Draft topic, must never render as detail',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-2', 'pdf'),
        bytes: '1024',
      },
    );
    // Deliberately not setStatus('PUBLISHED') — stays DRAFT.

    const html = await renderProduct('ai_income_99', { topic: draft.id });
    expect(html).toContain('Roadmap');
    expect(html).not.toContain('Draft topic, must never render as detail');
  });

  it('falls back to the overview when ?topic= matches an ARCHIVED ASSET', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    const published = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Published topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(published.id, 'PUBLISHED');
    const archived = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Archived topic, must never render as detail',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-2', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(archived.id, 'ARCHIVED');

    const html = await renderProduct('ai_income_99', { topic: archived.id });
    expect(html).toContain('Roadmap');
    expect(html).not.toContain('Archived topic, must never render as detail');
  });

  it('still redirects an anonymous visitor even when ?topic= is present', async () => {
    state.resolution = {
      granted: false,
      reason: 'no-token',
      funnel: funnelStateFor([]),
    } as WebAccessResolution;

    await expect(renderProduct('ai_income_99', { topic: 'x' })).rejects.toThrow('REDIRECT /access');
  });

  it('falls back to the overview when ?topic= is supplied more than once', async () => {
    process.env.CMS_ACCESS_CUTOVER_ENABLED = 'true';
    grant(['ai_income_99']);
    // The overview auto-selects the first topic in document order, so a
    // second topic (not the default selection) proves the array-form
    // ?topic= was never resolved — a false pass from the default
    // selection happening to be the same asset is ruled out.
    const first = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Default-selected topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(first.id, 'PUBLISHED');
    const asset = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Duplicate-param topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-2', 'pdf'),
        bytes: '1024',
      },
    );
    await contentItems.setStatus(asset.id, 'PUBLISHED');

    const html = await renderProduct('ai_income_99', { topic: [asset.id, 'something-else'] });
    expect(html).toContain('Roadmap');
    expect(html).not.toContain(`/access/ai_income_99/download/${asset.id}`);
  });
});
