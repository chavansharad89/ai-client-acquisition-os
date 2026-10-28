import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPgUploadSessionRepository, fakeAssetStorage } from '@acos/core-cms';
import { runCmsAbandonedUploadCleanupTick } from '@acos/worker/cmsCleanup';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// CMS-PO-010(R2)-G abandoned-upload cleanup, against real PostgreSQL
// (mirrors cms-obsolete-object-cleanup.integration.test.ts's own
// conventions exactly). Proves findOlderThan/isStorageKeyCurrentlyReferenced
// against the actual cms_asset_upload_sessions_created_at_idx and
// content_items_storage_key_idx (migrations 0068/0067), and -- the
// mandatory part of this phase -- that the completion/cleanup race
// (PART 8-A) is genuinely closed by the tick's two-check design, using
// real SQL state changes between the two checks, not a faked-away
// assumption. The physical-object side is a fakeAssetStorage -- no real
// R2 credentials are needed or used.

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

interface SeedSessionOptions {
  id: string;
  storageKey: string;
  owningProductId?: string;
  createdAt?: Date;
}

/** Inserts one cms_asset_upload_sessions row, optionally backdating created_at (the column has no application write path for an arbitrary value, so this uses a raw UPDATE after the normal INSERT). */
async function seedSession(db: TempDatabase, opts: SeedSessionOptions): Promise<void> {
  await db.client.query(
    `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id) VALUES ($1, $2, $3)`,
    [opts.id, opts.storageKey, opts.owningProductId ?? 'ai_income_99'],
  );
  if (opts.createdAt) {
    await db.client.query(`UPDATE cms_asset_upload_sessions SET created_at = $1 WHERE id = $2`, [
      opts.createdAt,
      opts.id,
    ]);
  }
}

interface SeedAssetOptions {
  id: string;
  storageKey: string;
  owningProductId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

async function seedAsset(db: TempDatabase, opts: SeedAssetOptions): Promise<void> {
  await db.client.query(
    `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
     VALUES ($1, $2, 'ASSET', 'pdf', 'Asset', $3, 1000, $4)`,
    [opts.id, opts.owningProductId ?? 'ai_income_99', opts.storageKey, opts.status ?? 'PUBLISHED'],
  );
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe('UploadSessionRepository (real Postgres, CMS-PO-010(R2)-G)', () => {
  it('findOlderThan returns only sessions with created_at <= cutoff, oldest first, bounded by limit', async () => {
    const { db, pool } = await freshDb('find1');
    const now = new Date();
    await seedSession(db, { id: 'ups_old', storageKey: 'cms/p/assets/old.pdf', createdAt: new Date(now.getTime() - 2 * DAY_MS) });
    await seedSession(db, { id: 'ups_newer_old', storageKey: 'cms/p/assets/newer-old.pdf', createdAt: new Date(now.getTime() - 1 * DAY_MS) });
    await seedSession(db, { id: 'ups_future', storageKey: 'cms/p/assets/future.pdf', createdAt: new Date(now.getTime() + DAY_MS) });

    const repo = createPgUploadSessionRepository(pool);
    const cutoff = new Date(now.getTime() - 23 * HOUR_MS);
    const older = await repo.findOlderThan(cutoff, 10);
    expect(older.map((r) => r.id)).toEqual(['ups_old', 'ups_newer_old']);

    const limited = await repo.findOlderThan(cutoff, 1);
    expect(limited.map((r) => r.id)).toEqual(['ups_old']);
  });

  it('isStorageKeyCurrentlyReferenced is true for a key a live content_items row currently has, false otherwise', async () => {
    const { db, pool } = await freshDb('ref1');
    await seedAsset(db, { id: 'current_1', storageKey: 'cms/ai_income_99/assets/current_1.pdf' });

    const repo = createPgUploadSessionRepository(pool);
    await expect(repo.isStorageKeyCurrentlyReferenced('cms/ai_income_99/assets/current_1.pdf')).resolves.toBe(true);
    await expect(repo.isStorageKeyCurrentlyReferenced('cms/ai_income_99/assets/never-existed.pdf')).resolves.toBe(
      false,
    );
  });
});

describe('runCmsAbandonedUploadCleanupTick (real Postgres + fakeAssetStorage)', () => {
  it('<24h session is retained untouched', async () => {
    const { db, pool } = await freshDb('tick-young');
    await seedSession(db, {
      id: 'ups_young',
      storageKey: 'cms/ai_income_99/assets/young.pdf',
      createdAt: new Date(Date.now() - 1 * HOUR_MS),
    });
    const storage = fakeAssetStorage({ 'cms/ai_income_99/assets/young.pdf': { bytes: 1000, contentType: 'application/pdf' } });
    const uploadSessions = createPgUploadSessionRepository(pool);

    const outcome = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 0, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(await storage.headObject('cms/ai_income_99/assets/young.pdf')).not.toBeNull();
  });

  it('>=24h + existing, unreferenced object is deleted and the session is consumed', async () => {
    const { db, pool } = await freshDb('tick-delete');
    await seedSession(db, {
      id: 'ups_old_1',
      storageKey: 'cms/ai_income_99/assets/abandoned_1.pdf',
      createdAt: new Date(Date.now() - 25 * HOUR_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/abandoned_1.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const uploadSessions = createPgUploadSessionRepository(pool);

    const outcome = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(await storage.headObject('cms/ai_income_99/assets/abandoned_1.pdf')).toBeNull();
    expect(await uploadSessions.findOlderThan(new Date(Date.now() + DAY_MS), 10)).toEqual([]);
  });

  it('>=24h + already-absent object safely consumes the session without calling deleteObject', async () => {
    const { db, pool } = await freshDb('tick-absent');
    await seedSession(db, {
      id: 'ups_old_2',
      storageKey: 'cms/ai_income_99/assets/never-uploaded.pdf',
      createdAt: new Date(Date.now() - 25 * HOUR_MS),
    });
    const storage = fakeAssetStorage(); // nothing ever uploaded to this key
    const uploadSessions = createPgUploadSessionRepository(pool);

    const outcome = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 1, skippedReferenced: 0, failed: 0 });
    expect(await uploadSessions.findOlderThan(new Date(Date.now() + DAY_MS), 10)).toEqual([]);
  });

  it('>=24h + currently referenced object is never deleted, and the session is retained', async () => {
    const { db, pool } = await freshDb('tick-referenced');
    const key = 'cms/ai_income_99/assets/completed_late.pdf';
    await seedAsset(db, { id: 'completed_asset', storageKey: key, status: 'DRAFT' });
    await seedSession(db, { id: 'ups_old_3', storageKey: key, createdAt: new Date(Date.now() - 25 * HOUR_MS) });
    const storage = fakeAssetStorage({ [key]: { bytes: 1000, contentType: 'application/pdf' } });
    const uploadSessions = createPgUploadSessionRepository(pool);

    const outcome = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 1, failed: 0 });
    expect(await storage.headObject(key)).not.toBeNull(); // untouched
    expect(await uploadSessions.findOlderThan(new Date(Date.now() + DAY_MS), 10)).toHaveLength(1); // session retained
  });

  it('multiple sessions are each resolved independently in one tick', async () => {
    const { db, pool } = await freshDb('tick-multi');
    await seedSession(db, {
      id: 'ups_multi_deletable',
      storageKey: 'cms/ai_income_99/assets/multi_deletable.pdf',
      createdAt: new Date(Date.now() - 25 * HOUR_MS),
    });
    await seedSession(db, {
      id: 'ups_multi_young',
      storageKey: 'cms/ai_income_99/assets/multi_young.pdf',
      createdAt: new Date(Date.now() - 1 * HOUR_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/multi_deletable.pdf': { bytes: 1000, contentType: 'application/pdf' },
      'cms/ai_income_99/assets/multi_young.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const uploadSessions = createPgUploadSessionRepository(pool);

    const outcome = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });

    expect(outcome).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(await storage.headObject('cms/ai_income_99/assets/multi_young.pdf')).not.toBeNull(); // untouched, not old enough
  });

  it('a repeated run after full deletion finds nothing left to do', async () => {
    const { db, pool } = await freshDb('tick-repeat');
    await seedSession(db, {
      id: 'ups_repeat',
      storageKey: 'cms/ai_income_99/assets/repeat.pdf',
      createdAt: new Date(Date.now() - 25 * HOUR_MS),
    });
    const storage = fakeAssetStorage({ 'cms/ai_income_99/assets/repeat.pdf': { bytes: 1000, contentType: 'application/pdf' } });
    const uploadSessions = createPgUploadSessionRepository(pool);

    const first = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });
    const second = await runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 });

    expect(first).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
    expect(second).toEqual({ scanned: 0, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
  });

  it('two concurrent cleanup ticks over the same session never double-delete or corrupt bookkeeping', async () => {
    const { db, pool } = await freshDb('tick-concurrent');
    await seedSession(db, {
      id: 'ups_concurrent',
      storageKey: 'cms/ai_income_99/assets/concurrent.pdf',
      createdAt: new Date(Date.now() - 25 * HOUR_MS),
    });
    const storage = fakeAssetStorage({
      'cms/ai_income_99/assets/concurrent.pdf': { bytes: 1000, contentType: 'application/pdf' },
    });
    const uploadSessions = createPgUploadSessionRepository(pool);

    const [first, second] = await Promise.all([
      runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 }),
      runCmsAbandonedUploadCleanupTick({ uploadSessions, storage, batchSize: 100 }),
    ]);

    expect(first.failed).toBe(0);
    expect(second.failed).toBe(0);
    expect(first.deleted + first.alreadyAbsent + second.deleted + second.alreadyAbsent).toBeGreaterThanOrEqual(1);
    expect(await uploadSessions.findOlderThan(new Date(Date.now() + DAY_MS), 10)).toEqual([]);
    expect(await storage.headObject('cms/ai_income_99/assets/concurrent.pdf')).toBeNull();
  });

  it('RACE (PART 8-A, mandatory): a completion committing its reference between the two safety checks blocks the deletion', async () => {
    const { db, pool } = await freshDb('tick-race');
    const key = 'cms/ai_income_99/assets/race.pdf';
    await seedSession(db, { id: 'ups_race', storageKey: key, createdAt: new Date(Date.now() - 25 * HOUR_MS) });
    const storage = fakeAssetStorage({ [key]: { bytes: 1000, contentType: 'application/pdf' } });

    const realUploadSessions = createPgUploadSessionRepository(pool);
    let referenceCheckCalls = 0;
    // A real-Postgres-backed simulation of the exact race: check #1
    // (the fast-path check, before headObject) genuinely sees no
    // reference yet -- then, as the race's own effect, a competing
    // content_items row is inserted for real, so check #2 (immediately
    // before the physical delete) genuinely sees it.
    const racyUploadSessions = {
      ...realUploadSessions,
      isStorageKeyCurrentlyReferenced: async (storageKey: string) => {
        referenceCheckCalls += 1;
        const result = await realUploadSessions.isStorageKeyCurrentlyReferenced(storageKey);
        if (referenceCheckCalls === 1) {
          // "Meanwhile, an admin's completion commits" -- a real INSERT
          // against the real database, between this call's answer and
          // the next one.
          await seedAsset(db, { id: 'racer-asset', storageKey, status: 'DRAFT' });
        }
        return result;
      },
    };

    const outcome = await runCmsAbandonedUploadCleanupTick({
      uploadSessions: racyUploadSessions,
      storage,
      batchSize: 100,
    });

    expect(referenceCheckCalls).toBe(2);
    // The safety invariant holds: no deletion occurred once the database
    // established the reference, even though it did not exist at the
    // time of the first check.
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 1, failed: 0 });
    expect(await storage.headObject(key)).not.toBeNull(); // object survives
    const remainingSessions = await realUploadSessions.findOlderThan(new Date(Date.now() + DAY_MS), 10);
    expect(remainingSessions).toHaveLength(1); // session retained, not consumed
  });
});
