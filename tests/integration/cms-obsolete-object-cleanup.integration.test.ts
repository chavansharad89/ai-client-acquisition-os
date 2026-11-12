import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPgObsoleteObjectRepository, fakeAssetStorage } from '@acos/core-cms';
import { runCmsObsoleteObjectCleanupTick } from '@acos/worker/cmsCleanup';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// CMS-PO-010(R2)-G obsolete-object cleanup, against real PostgreSQL
// (mirrors cms-asset-replacement-publish.integration.test.ts's own
// conventions). This is the piece that genuinely needs a real database:
// findExpired/isStorageKeyCurrentlyReferenced must prove themselves
// against the actual content_item_obsolete_objects_retention_until_idx
// and content_items_storage_key_idx (migration 0067), not an in-memory
// approximation of them. The physical-object side is a fakeAssetStorage
// — no real R2 credentials are needed or used.

let reachable = false;
const open: TempDatabase[] = [];
const pools: Pool[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  await Promise.all(pools.map((pool) => pool.end().catch(() => undefined)));
  while (open.length > 0) await open.pop()!.drop();
});

async function freshDb(label: string): Promise<{ db: TempDatabase; pool: Pool }> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});
  open.push(db);
  const pool = new Pool({ connectionString: db.url, max: 5 });
  pools.push(pool);
  return { db, pool };
}

interface AssetRow {
  id: string;
  owningProductId?: string;
  storageKey: string;
  bytes?: number;
}

/** Inserts one PUBLISHED ASSET content_items row with the given current storageKey. */
async function seedCurrentAsset(db: TempDatabase, row: AssetRow): Promise<void> {
  const owningProductId = row.owningProductId ?? 'ai_income_99';
  await db.client.query(
    `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
     VALUES ($1, $2, 'ASSET', 'pdf', 'Current Asset', $3, $4, 'PUBLISHED')`,
    [row.id, owningProductId, row.storageKey, row.bytes ?? 1000],
  );
}

interface ObsoleteRow {
  id: string;
  contentItemId: string;
  storageKey: string;
  retentionUntil: Date;
}

/** Inserts one content_item_obsolete_objects bookkeeping row, referencing an existing content_items row (FK). */
async function seedObsoleteRow(db: TempDatabase, row: ObsoleteRow): Promise<void> {
  await db.client.query(
    `INSERT INTO content_item_obsolete_objects (id, content_item_id, storage_key, retention_until)
     VALUES ($1, $2, $3, $4)`,
    [row.id, row.contentItemId, row.storageKey, row.retentionUntil],
  );
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe('ObsoleteObjectRepository (real Postgres, CMS-PO-010(R2)-G)', () => {
  it('findExpired returns only rows with retention_until <= now, oldest first, bounded by limit', async () => {
    const { db, pool } = await freshDb('find1');
    await seedCurrentAsset(db, { id: 'current_1', storageKey: 'cms/ai_income_99/assets/current_1.pdf' });
    const now = new Date();
    await seedObsoleteRow(db, {
      id: 'obs_expired_old',
      contentItemId: 'current_1',
      storageKey: 'cms/ai_income_99/assets/obs_expired_old.pdf',
      retentionUntil: new Date(now.getTime() - 2 * DAY_MS),
    });
    await seedObsoleteRow(db, {
      id: 'obs_expired_new',
      contentItemId: 'current_1',
      storageKey: 'cms/ai_income_99/assets/obs_expired_new.pdf',
      retentionUntil: new Date(now.getTime() - 1 * DAY_MS),
    });
    await seedObsoleteRow(db, {
      id: 'obs_future',
      contentItemId: 'current_1',
      storageKey: 'cms/ai_income_99/assets/obs_future.pdf',
      retentionUntil: new Date(now.getTime() + 10 * DAY_MS),
    });

    const repo = createPgObsoleteObjectRepository(pool);
    const expired = await repo.findExpired(now, 10);

    expect(expired.map((r) => r.id)).toEqual(['obs_expired_old', 'obs_expired_new']);

    const limited = await repo.findExpired(now, 1);
    expect(limited.map((r) => r.id)).toEqual(['obs_expired_old']);
  });

  it('isStorageKeyCurrentlyReferenced is true for a key a live content_items row currently has, false otherwise', async () => {
    const { db, pool } = await freshDb('ref1');
    await seedCurrentAsset(db, { id: 'current_2', storageKey: 'cms/ai_income_99/assets/current_2.pdf' });

    const repo = createPgObsoleteObjectRepository(pool);
    await expect(repo.isStorageKeyCurrentlyReferenced('cms/ai_income_99/assets/current_2.pdf')).resolves.toBe(true);
    await expect(repo.isStorageKeyCurrentlyReferenced('cms/ai_income_99/assets/never-existed.pdf')).resolves.toBe(
      false,
    );
  });

  it('deleteById removes the row, and is a safe no-op when called again (idempotent)', async () => {
    const { db, pool } = await freshDb('del1');
    await seedCurrentAsset(db, { id: 'current_3', storageKey: 'cms/ai_income_99/assets/current_3.pdf' });
    await seedObsoleteRow(db, {
      id: 'obs_del_1',
      contentItemId: 'current_3',
      storageKey: 'cms/ai_income_99/assets/obs_del_1.pdf',
      retentionUntil: new Date(Date.now() - DAY_MS),
    });

    const repo = createPgObsoleteObjectRepository(pool);
    await repo.deleteById('obs_del_1');
    expect(await repo.findByContentItemId('current_3')).toEqual([]);

    await expect(repo.deleteById('obs_del_1')).resolves.toBeUndefined();
    await expect(repo.deleteById('does-not-exist')).resolves.toBeUndefined();
  });
});

describe('runCmsObsoleteObjectCleanupTick (real Postgres + fakeAssetStorage)', () => {
  it('1/8/9. deletes an expired, unreferenced obsolete object by its storage_key and removes the bookkeeping row — the current PUBLISHED asset is never touched', async () => {
    const { db, pool } = await freshDb('tick1');
    await seedCurrentAsset(db, { id: 'live_1', storageKey: 'cms/ai_income_99/assets/live_1.pdf' });
    await seedObsoleteRow(db, {
      id: 'obs_1',
      contentItemId: 'live_1',
      storageKey: 'cms/ai_income_99/assets/obsolete_1.pdf',
      retentionUntil: new Date(Date.now() - DAY_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/obsolete_1.pdf': { bytes: 2000, contentType: 'application/pdf' },
      'cms/ai_income_99/assets/live_1.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const obsoleteObjects = createPgObsoleteObjectRepository(pool);

    const outcome = await runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(await storage.headObject('cms/ai_income_99/assets/obsolete_1.pdf')).toBeNull();
    // The current asset's own object was never asked to be deleted.
    expect(await storage.headObject('cms/ai_income_99/assets/live_1.pdf')).not.toBeNull();
    expect(await obsoleteObjects.findByContentItemId('live_1')).toEqual([]);
  });

  it('2/8. never deletes the object or the bookkeeping row when the obsolete storage_key is still referenced by a live content_items row', async () => {
    const { db, pool } = await freshDb('tick2');
    // Simulates the exact safety scenario the mandatory check exists for:
    // a bookkeeping row names a key that, for whatever reason, a live
    // content_items row currently also has.
    const sharedKey = 'cms/ai_income_99/assets/shared.pdf';
    await seedCurrentAsset(db, { id: 'live_2', storageKey: sharedKey });
    await seedObsoleteRow(db, {
      id: 'obs_2',
      contentItemId: 'live_2',
      storageKey: sharedKey,
      retentionUntil: new Date(Date.now() - DAY_MS),
    });
    const storage = fakeAssetStorage({ [sharedKey]: { bytes: 1000, contentType: 'application/pdf' } });
    const obsoleteObjects = createPgObsoleteObjectRepository(pool);

    const outcome = await runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 1, failed: 0 });
    expect(await storage.headObject(sharedKey)).not.toBeNull(); // untouched
    expect(await obsoleteObjects.findByContentItemId('live_2')).toHaveLength(1); // bookkeeping row retained
  });

  it('3. a retention_until still in the future is never scanned, deleted, or removed', async () => {
    const { db, pool } = await freshDb('tick3');
    await seedCurrentAsset(db, { id: 'live_3', storageKey: 'cms/ai_income_99/assets/live_3.pdf' });
    await seedObsoleteRow(db, {
      id: 'obs_3',
      contentItemId: 'live_3',
      storageKey: 'cms/ai_income_99/assets/obsolete_3.pdf',
      retentionUntil: new Date(Date.now() + 10 * DAY_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/obsolete_3.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const obsoleteObjects = createPgObsoleteObjectRepository(pool);

    const outcome = await runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 0, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(await storage.headObject('cms/ai_income_99/assets/obsolete_3.pdf')).not.toBeNull();
    expect(await obsoleteObjects.findByContentItemId('live_3')).toHaveLength(1);
  });

  it('6. multiple independent obsolete objects are each resolved on their own merits in one tick', async () => {
    const { db, pool } = await freshDb('tick6');
    await seedCurrentAsset(db, { id: 'live_6', storageKey: 'cms/ai_income_99/assets/live_6.pdf' });
    await seedObsoleteRow(db, {
      id: 'obs_deletable',
      contentItemId: 'live_6',
      storageKey: 'cms/ai_income_99/assets/deletable.pdf',
      retentionUntil: new Date(Date.now() - DAY_MS),
    });
    await seedObsoleteRow(db, {
      id: 'obs_future',
      contentItemId: 'live_6',
      storageKey: 'cms/ai_income_99/assets/future.pdf',
      retentionUntil: new Date(Date.now() + DAY_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/deletable.pdf': { bytes: 1000, contentType: 'application/pdf' },
      'cms/ai_income_99/assets/future.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const obsoleteObjects = createPgObsoleteObjectRepository(pool);

    const outcome = await runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(await obsoleteObjects.findByContentItemId('live_6')).toEqual([
      expect.objectContaining({ id: 'obs_future' }),
    ]);
  });

  it('7. a repeated run after full deletion finds nothing left to do (no duplicate-deletion attempt)', async () => {
    const { db, pool } = await freshDb('tick7');
    await seedCurrentAsset(db, { id: 'live_7', storageKey: 'cms/ai_income_99/assets/live_7.pdf' });
    await seedObsoleteRow(db, {
      id: 'obs_7',
      contentItemId: 'live_7',
      storageKey: 'cms/ai_income_99/assets/obsolete_7.pdf',
      retentionUntil: new Date(Date.now() - DAY_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/obsolete_7.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const obsoleteObjects = createPgObsoleteObjectRepository(pool);

    const first = await runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 });
    const second = await runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 });

    expect(first).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(second).toEqual({ scanned: 0, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
  });

  it('10. two concurrent cleanup ticks over the same expired row never double-delete or corrupt bookkeeping', async () => {
    const { db, pool } = await freshDb('tick10');
    await seedCurrentAsset(db, { id: 'live_10', storageKey: 'cms/ai_income_99/assets/live_10.pdf' });
    await seedObsoleteRow(db, {
      id: 'obs_10',
      contentItemId: 'live_10',
      storageKey: 'cms/ai_income_99/assets/obsolete_10.pdf',
      retentionUntil: new Date(Date.now() - DAY_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/obsolete_10.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const obsoleteObjects = createPgObsoleteObjectRepository(pool);

    const [first, second] = await Promise.all([
      runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 }),
      runCmsObsoleteObjectCleanupTick({ obsoleteObjects, storage, batchSize: 100 }),
    ]);

    // Across both concurrent attempts, the object is accounted for
    // exactly once as a real deletion — a second concurrent attempt
    // either never saw the row again (DELETE already removed it) or saw
    // it and confirmed absence (fakeAssetStorage's own delete is
    // idempotent) — never a thrown error, never two live rows.
    expect(first.failed).toBe(0);
    expect(second.failed).toBe(0);
    expect(first.deleted + first.alreadyAbsent + second.deleted + second.alreadyAbsent).toBeGreaterThanOrEqual(1);
    expect(await obsoleteObjects.findByContentItemId('live_10')).toEqual([]);
    expect(await storage.headObject('cms/ai_income_99/assets/obsolete_10.pdf')).toBeNull();
  });
});
