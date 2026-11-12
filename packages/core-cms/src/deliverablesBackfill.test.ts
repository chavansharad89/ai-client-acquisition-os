import { deliverablesFor } from '@acos/catalog';
import { describe, expect, it } from 'vitest';

import { assetKindForExtension } from './assetValidation';
import {
  backfillContentItemsFromDeliverables,
  extensionOfLegacyStorageKey,
} from './deliverablesBackfill';
import { fakeContentItemRepository } from './testing/fakeContentItemRepository';

// Unit coverage for the backfill's core logic (contentItems dependency
// injected as the in-memory fake — no real database). See
// tests/integration/cms-backfill-content-items.integration.test.ts for
// the real-Postgres verification (constraints/triggers, parity) this
// file deliberately does not attempt.

describe('extensionOfLegacyStorageKey + assetKindForExtension (every legacy AssetKind category)', () => {
  // The four `AssetKind` values deliverables.ts actually declares
  // ('pdf' | 'zip' | 'video' | 'sheet') map to these real storage-key
  // extensions, per packages/catalog/src/deliverables.ts.
  const cases: ReadonlyArray<[kind: string, storageKey: string, expectedAssetKind: string]> = [
    ['pdf', 'ai_income_99/prompt-library.pdf', 'pdf'],
    ['sheet', 'ai_income_99/pricing-sheet.xlsx', 'xlsx'],
    ['zip', 'ai_freelancing_499/proposal-template.zip', 'zip'],
    ['video', 'ai_client_acquisition_1499/walkthrough.mp4', 'mp4'],
  ];

  it.each(cases)('derives the correct asset_kind for a legacy "%s" deliverable', (_kind, storageKey, expected) => {
    const extension = extensionOfLegacyStorageKey(storageKey);
    expect(assetKindForExtension(extension)).toBe(expected);
  });

  it('returns an empty extension for a storage key with no dot (no governed FILE/VIDEO enum is invented for this)', () => {
    expect(extensionOfLegacyStorageKey('no-extension-at-all')).toBe('');
  });
});

describe('backfillContentItemsFromDeliverables', () => {
  it('backfills every ai_income_99 deliverable with the governed constant fields (spec §14)', async () => {
    const contentItems = fakeContentItemRepository();
    const reports = await backfillContentItemsFromDeliverables(contentItems);

    const plusAssets = deliverablesFor('ai_income_99');
    const plusCreated = reports.filter((r) => r.productId === 'ai_income_99');
    expect(plusCreated).toHaveLength(plusAssets.length);
    expect(plusCreated.every((r) => r.outcome === 'created')).toBe(true);

    const rows = await contentItems.findAllByOwningProduct('ai_income_99');
    expect(rows).toHaveLength(plusAssets.length);
    for (const [index, asset] of plusAssets.entries()) {
      const row = rows.find((r) => r.storageKey === asset.storageKey);
      expect(row).toBeDefined();
      expect(row!.parentId).toBeNull();
      expect(row!.nodeType).toBe('ASSET');
      expect(row!.title).toBe(asset.title);
      expect(row!.description).toBeNull();
      expect(row!.bytes).toBe(String(asset.bytes));
      expect(row!.orderIndex).toBe(index);
      expect(row!.status).toBe('PUBLISHED');
      expect(row!.assetKind).toBe(extensionOfLegacyStorageKey(asset.storageKey));
    }
  });

  it('backfills ai_freelancing_499 deliverables too', async () => {
    const contentItems = fakeContentItemRepository();
    await backfillContentItemsFromDeliverables(contentItems);

    const proAssets = deliverablesFor('ai_freelancing_499');
    const rows = await contentItems.findAllByOwningProduct('ai_freelancing_499');
    expect(rows).toHaveLength(proAssets.length);
    expect(rows.every((r) => r.status === 'PUBLISHED')).toBe(true);
  });

  it('never backfills the retired one-time ai_client_acquisition_1499 SKU (out of CMS scope by design, not this script choice)', async () => {
    const contentItems = fakeContentItemRepository();
    const reports = await backfillContentItemsFromDeliverables(contentItems);

    expect(reports.some((r) => r.productId === 'ai_client_acquisition_1499')).toBe(false);
    const rows = await contentItems.findAllByOwningProduct('ai_client_acquisition_1499');
    expect(rows).toHaveLength(0);
  });

  it('is a correct no-op for ai_client_acquisition_1499_subscription (zero deliverables by design)', async () => {
    const contentItems = fakeContentItemRepository();
    const reports = await backfillContentItemsFromDeliverables(contentItems);

    expect(reports.some((r) => r.productId === 'ai_client_acquisition_1499_subscription')).toBe(false);
  });

  it('is idempotent: a second run skips every already-backfilled row instead of duplicating it', async () => {
    const contentItems = fakeContentItemRepository();
    const first = await backfillContentItemsFromDeliverables(contentItems);
    const totalFirstRun = first.length;

    const second = await backfillContentItemsFromDeliverables(contentItems);
    expect(second).toHaveLength(totalFirstRun);
    expect(second.every((r) => r.outcome === 'skipped-existing')).toBe(true);

    const rows = await contentItems.findAllByOwningProduct('ai_income_99');
    expect(rows).toHaveLength(deliverablesFor('ai_income_99').length);
  });

  it('security-review finding: repairs a row left stranded in DRAFT (e.g. by a failure between create and setStatus on a prior run) instead of leaving it unservable forever', async () => {
    const contentItems = fakeContentItemRepository();
    const asset = deliverablesFor('ai_income_99')[0]!;
    const stranded = await contentItems.create({
      nodeType: 'ASSET',
      owningProductId: 'ai_income_99',
      parentId: null,
      title: asset.title,
      assetKind: 'pdf',
      storageKey: asset.storageKey,
      bytes: String(asset.bytes),
      orderIndex: 0,
    });
    expect((await contentItems.findById(stranded.id))!.status).toBe('DRAFT');

    const reports = await backfillContentItemsFromDeliverables(contentItems);

    expect(reports.find((r) => r.storageKey === asset.storageKey)?.outcome).toBe('skipped-existing');
    expect((await contentItems.findById(stranded.id))!.status).toBe('PUBLISHED');
  });

  it('dry-run never repairs a stranded DRAFT row either — it only reports, never writes', async () => {
    const contentItems = fakeContentItemRepository();
    const asset = deliverablesFor('ai_income_99')[0]!;
    const stranded = await contentItems.create({
      nodeType: 'ASSET',
      owningProductId: 'ai_income_99',
      parentId: null,
      title: asset.title,
      assetKind: 'pdf',
      storageKey: asset.storageKey,
      bytes: String(asset.bytes),
      orderIndex: 0,
    });

    await backfillContentItemsFromDeliverables(contentItems, { dryRun: true });

    expect((await contentItems.findById(stranded.id))!.status).toBe('DRAFT');
  });

  it('dry-run reports what would be created without writing anything', async () => {
    const contentItems = fakeContentItemRepository();
    const reports = await backfillContentItemsFromDeliverables(contentItems, { dryRun: true });

    expect(reports.length).toBeGreaterThan(0);
    expect(reports.every((r) => r.outcome === 'would-create')).toBe(true);

    const rows = await contentItems.findAllByOwningProduct('ai_income_99');
    expect(rows).toHaveLength(0);
  });

  it('preserves legacy array order as order_index', async () => {
    const contentItems = fakeContentItemRepository();
    await backfillContentItemsFromDeliverables(contentItems);

    const rows = await contentItems.findAllByOwningProduct('ai_income_99');
    const proAssets = deliverablesFor('ai_income_99');
    for (const [index, asset] of proAssets.entries()) {
      const row = rows.find((r) => r.storageKey === asset.storageKey);
      expect(row!.orderIndex).toBe(index);
    }
  });
});
