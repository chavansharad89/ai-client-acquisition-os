import { deliverablesFor } from '@acos/catalog';
import { backfillContentItemsFromDeliverables, createPgContentItemRepository } from '@acos/core-cms';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// Real-Postgres verification for the CMS content_items backfill
// (Customer Fulfillment Phase B, Stage 1-3). Unlike
// @acos/core-cms's deliverablesBackfill.test.ts (the fake-repository
// unit suite), this exercises the ACTUAL `content_items_node_shape` CHECK,
// the `content_items_match_parent_plan` trigger, and the real
// createPgContentItemRepository SQL — proving the backfill does not
// silently rely on something the fake repository is more permissive
// about than production Postgres actually is.
//
// IMPORTANT, NOT SILENTLY GLOSSED OVER: this suite proves the
// content_items ROWS the backfill creates are well-formed. It does NOT
// and CANNOT prove the underlying files are downloadable through the CMS
// R2-signed-URL path — see this repo's apps/web/src/server/contentStore.ts
// (the legacy download route reads deliverable bytes from a LOCAL
// FILESYSTEM directory, `content/`, never R2), so the `storage_key`
// values this backfill copies unchanged from deliverables.ts (per spec
// §14 point 3) do not correspond to any R2 object today. That is a
// separate, real content/infrastructure migration (uploading each
// legacy file to R2 under its storage_key) this script and this test
// deliberately do not perform or fake evidence for.

let reachable = false;
let current: { db: TempDatabase } | null = null;

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterEach(async () => {
  if (current) {
    await current.db.drop().catch(() => undefined);
    current = null;
  }
});

describe('CMS content_items backfill — real database (Customer Fulfillment Phase B)', () => {
  it('creates a well-formed, PUBLISHED, flat ASSET row for every CMS-eligible legacy deliverable, satisfying the real schema constraints', async () => {
    if (!reachable) {
      console.warn('Skipping: no reachable test database (see docker-compose.test.yml)');
      return;
    }
    const db = await createTempDatabase('cms-backfill');
    current = { db };
    const contentItems = createPgContentItemRepository(db.client);

    const reports = await backfillContentItemsFromDeliverables(contentItems);
    expect(reports.every((r) => r.outcome === 'created')).toBe(true);

    for (const productId of ['ai_income_99', 'ai_freelancing_499'] as const) {
      const legacyAssets = deliverablesFor(productId);
      const rows = await contentItems.findAllByOwningProduct(productId);
      expect(rows).toHaveLength(legacyAssets.length);
      for (const row of rows) {
        expect(row.status).toBe('PUBLISHED');
        expect(row.parentId).toBeNull();
        expect(row.nodeType).toBe('ASSET');
        expect(row.description).toBeNull();
      }
    }
  });

  it('legacy-vs-CMS parity: content_items storage_keys for each CMS-eligible product exactly match deliverables.ts, and the retired SKU has none', async () => {
    if (!reachable) {
      console.warn('Skipping: no reachable test database');
      return;
    }
    const db = await createTempDatabase('cms-backfill-parity');
    current = { db };
    const contentItems = createPgContentItemRepository(db.client);
    await backfillContentItemsFromDeliverables(contentItems);

    for (const productId of ['ai_income_99', 'ai_freelancing_499'] as const) {
      const legacyKeys = new Set(deliverablesFor(productId).map((a) => a.storageKey));
      const rows = await contentItems.findAllByOwningProduct(productId);
      const cmsKeys = new Set(rows.map((r) => r.storageKey));
      expect(cmsKeys).toEqual(legacyKeys);
    }

    // Parity for the explicitly out-of-CMS-scope retired SKU means ZERO
    // rows, not a mismatch — ai_client_acquisition_1499 is never supposed
    // to have a CMS side to compare against.
    const retiredRows = await contentItems.findAllByOwningProduct('ai_client_acquisition_1499');
    expect(retiredRows).toHaveLength(0);
  });

  it('is idempotent against a real database: re-running inserts nothing new and raises no constraint violation', async () => {
    if (!reachable) {
      console.warn('Skipping: no reachable test database');
      return;
    }
    const db = await createTempDatabase('cms-backfill-idempotent');
    current = { db };
    const contentItems = createPgContentItemRepository(db.client);

    const first = await backfillContentItemsFromDeliverables(contentItems);
    const second = await backfillContentItemsFromDeliverables(contentItems);

    expect(second).toHaveLength(first.length);
    expect(second.every((r) => r.outcome === 'skipped-existing')).toBe(true);

    const rows = await contentItems.findAllByOwningProduct('ai_income_99');
    expect(rows).toHaveLength(deliverablesFor('ai_income_99').length);
  });
});
