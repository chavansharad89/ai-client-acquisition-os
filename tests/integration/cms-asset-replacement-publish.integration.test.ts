import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { publishReplacementTransaction } from '@acos/core-cms';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// CMS-PO-010(R2) Phase 2 -- publishReplacementTransaction, against real
// PostgreSQL (mirrors plus-pro-max-cms-phase1.integration.test.ts's own
// conventions). This is the one piece of Phase 2 that genuinely needs a
// real database rather than the in-memory fake: `FOR UPDATE` row-locking
// across two literally-concurrent connections cannot be meaningfully
// simulated by a single-threaded in-memory repository.

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

interface SeedOptions {
  liveId: string;
  pendingId: string;
  owningProductId?: string;
}

/** Seeds a PUBLISHED asset (`liveId`) with a pending DRAFT replacement (`pendingId`) linked via `replaces_content_item_id`. */
async function seedLiveWithPending(db: TempDatabase, opts: SeedOptions) {
  const owningProductId = opts.owningProductId ?? 'ai_income_99';
  await db.client.query(
    `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
     VALUES ($1, $2, 'ASSET', 'pdf', 'Live Asset', $3, 1000, 'PUBLISHED')`,
    [opts.liveId, owningProductId, `cms/${owningProductId}/assets/${opts.liveId}.pdf`],
  );
  await db.client.query(
    `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
     VALUES ($1, $2, 'ASSET', 'pdf', 'Pending Replacement', $3, 2000, 'DRAFT', $4)`,
    [opts.pendingId, owningProductId, `cms/${owningProductId}/assets/${opts.pendingId}.pdf`, opts.liveId],
  );
}

describe('publishReplacementTransaction (CMS-PO-010(R2) Phase 2)', () => {
  it('36/41/42. publishes the correct pending replacement: new storageKey/bytes/assetKind become current', async () => {
    const { db, pool } = await freshDb('pub1');
    await seedLiveWithPending(db, { liveId: 'live_1', pendingId: 'pending_1' });

    const published = await publishReplacementTransaction(pool, {
      contentItemId: 'live_1',
      expectedPendingReplacementId: 'pending_1',
    });

    expect(published.id).toBe('live_1'); // same logical asset
    expect(published.storageKey).toBe('cms/ai_income_99/assets/pending_1.pdf');
    expect(published.bytes).toBe('2000');
    expect(published.assetKind).toBe('pdf');
    expect(published.status).toBe('PUBLISHED'); // untouched by publish -- only physical fields move
  });

  it('39/40/7. records the old storageKey as an obsolete-object row with retention = publish time + 30 days, and leaves the legacy 0066 columns NULL', async () => {
    const { db, pool } = await freshDb('pub2');
    await seedLiveWithPending(db, { liveId: 'live_2', pendingId: 'pending_2' });
    const before = Date.now();

    const published = await publishReplacementTransaction(pool, {
      contentItemId: 'live_2',
      expectedPendingReplacementId: 'pending_2',
    });

    expect(published.previousStorageKey).toBeNull(); // legacy 0066 column -- never written by the rewired transaction
    expect(published.previousStorageRetentionUntil).toBeNull();

    const { rows } = await db.client.query(
      `SELECT storage_key, retention_until FROM content_item_obsolete_objects WHERE content_item_id = 'live_2'`,
    );
    expect(rows).toHaveLength(1);
    expect((rows[0] as { storage_key: string }).storage_key).toBe('cms/ai_income_99/assets/live_2.pdf');
    const retentionMs = (rows[0] as { retention_until: Date }).retention_until.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(retentionMs).toBeGreaterThanOrEqual(before + thirtyDaysMs - 5000);
    expect(retentionMs).toBeLessThanOrEqual(Date.now() + thirtyDaysMs + 5000);
  });

  it('43. the pending row is consumed (deleted) after a successful publish', async () => {
    const { db, pool } = await freshDb('pub3');
    await seedLiveWithPending(db, { liveId: 'live_3', pendingId: 'pending_3' });

    await publishReplacementTransaction(pool, { contentItemId: 'live_3', expectedPendingReplacementId: 'pending_3' });

    const { rows } = await db.client.query(`SELECT 1 FROM content_items WHERE id = 'pending_3'`);
    expect(rows).toHaveLength(0);
    const { rows: liveRows } = await db.client.query(`SELECT count(*) AS c FROM content_items WHERE id = 'live_3'`);
    expect(Number((liveRows[0] as { c: string }).c)).toBe(1); // the logical asset itself is never deleted
  });

  it('37/44/9/10/11. rejects the wrong pending replacement id, leaving the asset, the pending row, and obsolete-object bookkeeping all unchanged (atomic on failure)', async () => {
    const { db, pool } = await freshDb('pub4');
    await seedLiveWithPending(db, { liveId: 'live_4', pendingId: 'pending_4' });
    await db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
       VALUES ('unrelated_asset', 'ai_income_99', 'ASSET', 'pdf', 'Unrelated', 'cms/ai_income_99/assets/unrelated_asset.pdf', 50, 'PUBLISHED')`,
    );

    await expect(
      publishReplacementTransaction(pool, { contentItemId: 'live_4', expectedPendingReplacementId: 'unrelated_asset' }),
    ).rejects.toThrow(/not the current pending replacement/);

    const { rows: liveRows } = await db.client.query(`SELECT storage_key, status FROM content_items WHERE id = 'live_4'`);
    expect(liveRows[0]).toMatchObject({ storage_key: 'cms/ai_income_99/assets/live_4.pdf', status: 'PUBLISHED' }); // current asset unchanged
    const { rows: pendingRows } = await db.client.query(`SELECT 1 FROM content_items WHERE id = 'pending_4'`);
    expect(pendingRows).toHaveLength(1); // pending replacement intact -- nothing was consumed by the failed attempt
    const { rows: obsoleteRows } = await db.client.query(
      `SELECT 1 FROM content_item_obsolete_objects WHERE content_item_id = 'live_4'`,
    );
    expect(obsoleteRows).toHaveLength(0); // no orphan obsolete-object row from the failed transaction
  });

  it('38. rejects a replacement that is not DRAFT (e.g. already published by a prior call)', async () => {
    const { db, pool } = await freshDb('pub5');
    await db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
       VALUES ('live_5', 'ai_income_99', 'ASSET', 'pdf', 'Live', 'cms/ai_income_99/assets/live_5.pdf', 1000, 'PUBLISHED')`,
    );
    // A PUBLISHED row can never carry a replacement pointer (migration
    // 0066's own replacement-shape CHECK), so "not DRAFT" is modeled here
    // as an ARCHIVED row that also isn't a replacement -- exercising the
    // same rejection branch (status/shape mismatch) without attempting an
    // insert the database itself would already refuse.
    await db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, archived_at)
       VALUES ('not_pending_5', 'ai_income_99', 'ASSET', 'pdf', 'Not A Replacement', 'cms/ai_income_99/assets/not_pending_5.pdf', 10, 'ARCHIVED', now())`,
    );

    await expect(
      publishReplacementTransaction(pool, { contentItemId: 'live_5', expectedPendingReplacementId: 'not_pending_5' }),
    ).rejects.toThrow(/not the current pending replacement/);
  });

  it('47. a stale publish request (pending already consumed) fails safely without corrupting the now-current state', async () => {
    const { db, pool } = await freshDb('pub6');
    await seedLiveWithPending(db, { liveId: 'live_6', pendingId: 'pending_6' });

    const firstPublish = await publishReplacementTransaction(pool, {
      contentItemId: 'live_6',
      expectedPendingReplacementId: 'pending_6',
    });
    expect(firstPublish.storageKey).toBe('cms/ai_income_99/assets/pending_6.pdf');

    // Retry the exact same request -- pending_6 no longer exists.
    await expect(
      publishReplacementTransaction(pool, { contentItemId: 'live_6', expectedPendingReplacementId: 'pending_6' }),
    ).rejects.toThrow(/not the current pending replacement/);

    const { rows } = await db.client.query(
      `SELECT storage_key, previous_storage_key FROM content_items WHERE id = 'live_6'`,
    );
    expect(rows[0]).toMatchObject({
      storage_key: 'cms/ai_income_99/assets/pending_6.pdf', // unchanged by the failed retry
      previous_storage_key: null, // legacy 0066 column -- never written
    });
  });

  it('B/1/2/3/6. multiple sequential replacements: no throttle from an earlier still-retained obsolete object, each with its own independent deadline, single-pending-replacement invariant still enforced throughout', async () => {
    const { db, pool } = await freshDb('pub7');
    await seedLiveWithPending(db, { liveId: 'live_7', pendingId: 'pending_7' });

    // 1. First replacement: V1 -> V2.
    const afterV2 = await publishReplacementTransaction(pool, {
      contentItemId: 'live_7',
      expectedPendingReplacementId: 'pending_7',
    });
    expect(afterV2.storageKey).toBe('cms/ai_income_99/assets/pending_7.pdf');
    expect(afterV2.status).toBe('PUBLISHED'); // customer-visible status unaffected by a replacement cycle

    // Upload V3 as a pending replacement of the NOW-current asset (still live_7; replace-in-place keeps the logical id).
    await db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
       VALUES ('pending_7b', 'ai_income_99', 'ASSET', 'pdf', 'Second Replacement', 'cms/ai_income_99/assets/pending_7b.pdf', 10, 'DRAFT', 'live_7')`,
    );

    // 6. The single-pending-replacement invariant still holds post-rewire: a second concurrent pending row for the same asset is still rejected.
    await expect(
      db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
         VALUES ('pending_7c', 'ai_income_99', 'ASSET', 'pdf', 'Competing Draft', 'cms/ai_income_99/assets/pending_7c.pdf', 10, 'DRAFT', 'live_7')`,
      ),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);

    // 2. Second replacement, before V1's 30-day retention expires: V2 -> V3. NO throttle.
    const afterV3 = await publishReplacementTransaction(pool, {
      contentItemId: 'live_7',
      expectedPendingReplacementId: 'pending_7b',
    });
    expect(afterV3.storageKey).toBe('cms/ai_income_99/assets/pending_7b.pdf');
    expect(afterV3.status).toBe('PUBLISHED');

    // After two replacements: exactly one current asset, zero pending rows, two obsolete rows.
    const { rows: currentRows } = await db.client.query(
      `SELECT count(*) AS c FROM content_items WHERE id = 'live_7' AND status = 'PUBLISHED'`,
    );
    expect(Number((currentRows[0] as { c: string }).c)).toBe(1);
    const { rows: pendingRows } = await db.client.query(
      `SELECT count(*) AS c FROM content_items WHERE replaces_content_item_id = 'live_7'`,
    );
    expect(Number((pendingRows[0] as { c: string }).c)).toBe(0);

    // 3. Both obsolete objects coexist, each with its own independent retention_until.
    const { rows: obsoleteRows } = await db.client.query(
      `SELECT storage_key, retention_until FROM content_item_obsolete_objects
        WHERE content_item_id = 'live_7' ORDER BY created_at`,
    );
    expect(obsoleteRows).toHaveLength(2);
    expect((obsoleteRows as { storage_key: string }[]).map((r) => r.storage_key)).toEqual([
      'cms/ai_income_99/assets/live_7.pdf', // V1's original key, obsoleted by the first publish
      'cms/ai_income_99/assets/pending_7.pdf', // V2's key, obsoleted by the second publish
    ]);
    const typedObsoleteRows = obsoleteRows as { retention_until: Date }[];
    const v1RetentionMs = typedObsoleteRows[0]!.retention_until.getTime();
    const v2RetentionMs = typedObsoleteRows[1]!.retention_until.getTime();
    expect(v1RetentionMs).not.toBe(v2RetentionMs);
    expect(v1RetentionMs).toBeLessThan(v2RetentionMs); // V1 retained first, so its deadline is earlier

    // 7. Legacy 0066 columns remain NULL throughout the entire multi-replacement lifecycle.
    const { rows: legacyRows } = await db.client.query(
      `SELECT previous_storage_key, previous_storage_retention_until FROM content_items WHERE id = 'live_7'`,
    );
    expect(legacyRows[0]).toMatchObject({ previous_storage_key: null, previous_storage_retention_until: null });
  });

  it('45. concurrent replacement completion does not create two pending rows for the same asset', async () => {
    const { db, pool } = await freshDb('conc1');
    await db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
       VALUES ('live_conc1', 'ai_income_99', 'ASSET', 'pdf', 'Live', 'cms/ai_income_99/assets/live_conc1.pdf', 1000, 'PUBLISHED')`,
    );

    const insertOne = async (id: string) =>
      pool.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
         VALUES ($1, 'ai_income_99', 'ASSET', 'pdf', 'Replacement', $2, 2000, 'DRAFT', 'live_conc1')`,
        [id, `cms/ai_income_99/assets/${id}.pdf`],
      );

    const results = await Promise.allSettled([insertOne('race_a'), insertOne('race_b')]);
    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(String((failed[0] as PromiseRejectedResult).reason)).toMatch(/duplicate key value violates unique constraint/);

    const { rows } = await db.client.query(
      `SELECT count(*) AS c FROM content_items WHERE replaces_content_item_id = 'live_conc1'`,
    );
    expect(Number((rows[0] as { c: string }).c)).toBe(1);
  });

  it('46/5. concurrent publish of the same replacement allows only one successful publication, with no duplicate obsolete-object row', async () => {
    const { db, pool } = await freshDb('conc2');
    await seedLiveWithPending(db, { liveId: 'live_conc2', pendingId: 'pending_conc2' });

    const results = await Promise.allSettled([
      publishReplacementTransaction(pool, { contentItemId: 'live_conc2', expectedPendingReplacementId: 'pending_conc2' }),
      publishReplacementTransaction(pool, { contentItemId: 'live_conc2', expectedPendingReplacementId: 'pending_conc2' }),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const { rows } = await db.client.query(`SELECT storage_key FROM content_items WHERE id = 'live_conc2'`);
    expect(rows[0]).toMatchObject({ storage_key: 'cms/ai_income_99/assets/pending_conc2.pdf' }); // only one final storage key wins
    const { rows: pendingRows } = await db.client.query(`SELECT 1 FROM content_items WHERE id = 'pending_conc2'`);
    expect(pendingRows).toHaveLength(0); // pending replacement consumed exactly once, consistently
    const { rows: obsoleteRows } = await db.client.query(
      `SELECT storage_key FROM content_item_obsolete_objects WHERE content_item_id = 'live_conc2'`,
    );
    expect(obsoleteRows).toHaveLength(1); // no duplicate obsolete-object row from the losing concurrent attempt
    expect((obsoleteRows[0] as { storage_key: string }).storage_key).toBe('cms/ai_income_99/assets/live_conc2.pdf');
  });
});
