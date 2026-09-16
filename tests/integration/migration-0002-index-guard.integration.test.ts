import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// MIGRATION 0002 — the index guard, against real PostgreSQL.
// -----------------------------------------------------------------------
// 0002 used to be four `CREATE UNIQUE INDEX IF NOT EXISTS` statements.
// IF NOT EXISTS matches on the index NAME and asks the catalog nothing
// else, so an index left INVALID by a failed concurrent build satisfied
// it. The migration reported success, Prisma recorded 0002 as applied,
// and the system then believed a uniqueness constraint that was enforcing
// nothing — the next duplicate payment would simply be accepted.
//
// Every assertion below reads pg_index / pg_class directly. Nothing about
// PostgreSQL's catalog is faked, and the INVALID index in scenario 3 is
// manufactured the way production produces one: a real
// CREATE UNIQUE INDEX CONCURRENTLY against real duplicate rows, which
// fails and leaves indisvalid = false behind.
// -----------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, '../..');
const MIGRATION_0002 = readFileSync(
  resolve(REPO_ROOT, 'packages/db/prisma/migrations/0002_concurrent_unique_indexes/migration.sql'),
  'utf8',
);

/** One target, used for most scenarios. */
const INDEX = 'payments_razorpay_payment_id_key';
const TABLE = 'payments';
const COLUMN = 'razorpay_payment_id';

/** Created by 0002 itself, so it exercises the "absent" path on every run. */
const NEW_INDEX = 'meta_events_order_id_key';

let reachable = false;
const open: TempDatabase[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

/**
 * A database with 0001 applied and 0002 NOT applied — the exact state a
 * deployment is in when it is about to run 0002.
 *
 * `throughMigration` stops at 0001 DELIBERATELY, and must keep doing so:
 * this suite applies 0002 itself, in order to test the guard inside it.
 * Letting the harness apply 0002 would leave nothing to test.
 */
async function dbBefore0002(label: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, { throughMigration: '0001_init' });
  open.push(db);
  return db;
}

type ApplyResult = { ok: true } | { ok: false; message: string; code: string | undefined };

async function apply0002(client: Client): Promise<ApplyResult> {
  try {
    await client.query(MIGRATION_0002);
    return { ok: true };
  } catch (error) {
    const e = error as { message: string; code?: string };
    return { ok: false, message: e.message, code: e.code };
  }
}

interface IndexFacts {
  oid: number;
  tableName: string;
  isValid: boolean;
  isReady: boolean;
  isLive: boolean;
  isUnique: boolean;
  isPartial: boolean;
  natts: number;
  nkeyatts: number;
  columns: string[];
}

/** Reads the catalog. This is the source of truth for every assertion here. */
async function readIndex(client: Client, name: string): Promise<IndexFacts | null> {
  const { rows } = await client.query<{
    oid: number;
    table_name: string;
    indisvalid: boolean;
    indisready: boolean;
    indislive: boolean;
    indisunique: boolean;
    is_partial: boolean;
    indnatts: number;
    indnkeyatts: number;
    columns: string[];
  }>(
    `SELECT c.oid::int          AS oid,
            tbl.relname         AS table_name,
            i.indisvalid, i.indisready, i.indislive, i.indisunique,
            i.indpred IS NOT NULL AS is_partial,
            i.indnatts, i.indnkeyatts,
            -- The ::text[] cast matters: attname has type name, and node-pg
            -- hands a name[] back as the raw literal string {a,b} instead of
            -- parsing it into a JS array.
            (SELECT array_agg(a.attname::text ORDER BY k.ord)
               FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
               JOIN pg_attribute a
                 ON a.attrelid = i.indrelid AND a.attnum = k.attnum) AS columns
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN pg_index i     ON i.indexrelid = c.oid
       JOIN pg_class tbl   ON tbl.oid = i.indrelid
      WHERE c.relname = $1 AND n.nspname = current_schema()`,
    [name],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    oid: row.oid,
    tableName: row.table_name,
    isValid: row.indisvalid,
    isReady: row.indisready,
    isLive: row.indislive,
    isUnique: row.indisunique,
    isPartial: row.is_partial,
    natts: row.indnatts,
    nkeyatts: row.indnkeyatts,
    columns: row.columns ?? [],
  };
}

/** Two payments on two orders sharing a razorpay_payment_id. */
async function seedDuplicatePaymentIds(client: Client): Promise<void> {
  for (const suffix of ['a', 'b']) {
    await client.query(
      `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                           product_name, amount_paise, currency, status, updated_at)
       VALUES ($1, $2, 'guard@example.test', 'ai_income_99', 'Kit', 9900, 'INR', 'PENDING', now())`,
      [`order_guard_${suffix}`, `rzp_order_guard_${suffix}`],
    );
    await client.query(
      `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                             currency, status, updated_at)
       VALUES ($1, 'pay_duplicate_guard', $2, 9900, 'INR', 'FAILED', now())`,
      [`payment_guard_${suffix}`, `order_guard_${suffix}`],
    );
  }
}

/**
 * Produces a genuinely INVALID index, the way production does.
 *
 * CREATE UNIQUE INDEX CONCURRENTLY does not fail fast on duplicates — it
 * completes a full pass, discovers the violation at the end, and leaves
 * the half-built index behind with indisvalid = false. That leftover is
 * the exact thing IF NOT EXISTS used to accept.
 */
async function makeInvalidIndex(client: Client): Promise<void> {
  await client.query(`DROP INDEX "${INDEX}"`);
  await seedDuplicatePaymentIds(client);
  await expect(
    client.query(`CREATE UNIQUE INDEX CONCURRENTLY "${INDEX}" ON "${TABLE}" ("${COLUMN}")`),
  ).rejects.toMatchObject({ code: '23505' });
}

describe('migration 0002 index guard', () => {
  it('runs against a real PostgreSQL server', async () => {
    const db = await dbBefore0002('guard-probe');
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  it('contains no executable CREATE ... IF NOT EXISTS', () => {
    const withoutComments = MIGRATION_0002.split('\n')
      .filter((line) => !line.trimStart().startsWith('--'))
      .join('\n');
    expect(withoutComments).not.toMatch(/IF NOT EXISTS/i);
  });

  // ------------------------------------------------------------ 1 ----
  describe('1. index missing', () => {
    it('creates it, valid and unique on the right column', async () => {
      const db = await dbBefore0002('guard-missing');

      // 0001 does not create this one at all.
      expect(await readIndex(db.client, NEW_INDEX)).toBeNull();
      // And drop one 0001 did create, so both absence paths are covered.
      await db.client.query(`DROP INDEX "${INDEX}"`);
      expect(await readIndex(db.client, INDEX)).toBeNull();

      const result = await apply0002(db.client);
      expect(result).toEqual({ ok: true });

      for (const [name, table, column] of [
        [NEW_INDEX, 'meta_events', 'order_id'],
        [INDEX, TABLE, COLUMN],
      ] as const) {
        const facts = await readIndex(db.client, name);
        expect(facts, `${name} should exist`).not.toBeNull();
        expect(facts!.isValid).toBe(true);
        expect(facts!.isReady).toBe(true);
        expect(facts!.isLive).toBe(true);
        expect(facts!.isUnique).toBe(true);
        expect(facts!.isPartial).toBe(false);
        expect(facts!.nkeyatts).toBe(1);
        expect(facts!.tableName).toBe(table);
        expect(facts!.columns).toEqual([column]);
      }
    }, 60_000);

    it('the created index actually enforces uniqueness', async () => {
      const db = await dbBefore0002('guard-enforces');
      await apply0002(db.client);
      await expect(seedDuplicatePaymentIds(db.client)).rejects.toMatchObject({ code: '23505' });
    }, 60_000);
  });

  // ------------------------------------------------------------ 2 ----
  describe('2. correct index already exists', () => {
    it('accepts it and does not rebuild it', async () => {
      const db = await dbBefore0002('guard-valid');

      const before = await readIndex(db.client, INDEX);
      expect(before?.isValid).toBe(true);

      const result = await apply0002(db.client);
      expect(result).toEqual({ ok: true });

      const after = await readIndex(db.client, INDEX);
      // Same OID proves it was accepted in place rather than dropped and
      // recreated — a rebuild would take a lock and change the identity.
      expect(after!.oid).toBe(before!.oid);
      expect(after!.isValid).toBe(true);
      expect(after!.isUnique).toBe(true);
    }, 60_000);
  });

  // ------------------------------------------------------------ 3 ----
  describe('3. index exists but is INVALID', () => {
    it('fails loudly instead of accepting it', async () => {
      const db = await dbBefore0002('guard-invalid');
      await makeInvalidIndex(db.client);

      // Confirm the catalog really is in the dangerous state.
      const broken = await readIndex(db.client, INDEX);
      expect(broken).not.toBeNull();
      expect(broken!.isValid).toBe(false);

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toMatch(/is not usable/);
        expect(result.message).toMatch(/indisvalid=f/);
        expect(result.code).toBe('42P17');
      }
    }, 60_000);

    it('does not drop the invalid index, and says what to run instead', async () => {
      const db = await dbBefore0002('guard-invalid-keep');
      await makeInvalidIndex(db.client);
      const before = await readIndex(db.client, INDEX);

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/DROP INDEX CONCURRENTLY/);

      // Still there, same OID, still invalid. Nothing was destroyed.
      const after = await readIndex(db.client, INDEX);
      expect(after!.oid).toBe(before!.oid);
      expect(after!.isValid).toBe(false);
    }, 60_000);

    it('aborts the whole migration, so no later target is created either', async () => {
      const db = await dbBefore0002('guard-invalid-abort');
      await makeInvalidIndex(db.client);

      expect((await apply0002(db.client)).ok).toBe(false);
      // meta_events_order_id_key is the last target in the list.
      expect(await readIndex(db.client, NEW_INDEX)).toBeNull();
    }, 60_000);
  });

  // ------------------------------------------------------------ 4 ----
  describe('4. wrong-column index wearing the right name', () => {
    it('fails loudly and names both columns', async () => {
      const db = await dbBefore0002('guard-wrongcol');
      await db.client.query(`DROP INDEX "${INDEX}"`);
      await db.client.query(`CREATE UNIQUE INDEX "${INDEX}" ON "${TABLE}" ("order_id")`);

      const planted = await readIndex(db.client, INDEX);
      expect(planted!.columns).toEqual(['order_id']);
      expect(planted!.isValid).toBe(true); // valid, just wrong

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toMatch(/covers column "order_id"/);
        expect(result.message).toMatch(new RegExp(`expected "${COLUMN}"`));
      }

      // Untouched.
      expect((await readIndex(db.client, INDEX))!.columns).toEqual(['order_id']);
    }, 60_000);

    it('rejects a non-unique index wearing the right name', async () => {
      const db = await dbBefore0002('guard-nonunique');
      await db.client.query(`DROP INDEX "${INDEX}"`);
      await db.client.query(`CREATE INDEX "${INDEX}" ON "${TABLE}" ("${COLUMN}")`);

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/NOT UNIQUE/);
      expect((await readIndex(db.client, INDEX))!.isUnique).toBe(false);
    }, 60_000);

    it('rejects a composite index wearing the right name', async () => {
      const db = await dbBefore0002('guard-composite');
      await db.client.query(`DROP INDEX "${INDEX}"`);
      await db.client.query(
        `CREATE UNIQUE INDEX "${INDEX}" ON "${TABLE}" ("${COLUMN}", "order_id")`,
      );

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/covers 2 column\(s\)/);
    }, 60_000);

    it('rejects an index of the right shape on the wrong table', async () => {
      const db = await dbBefore0002('guard-wrongtable');
      await db.client.query(`DROP INDEX "${INDEX}"`);
      // Same name, same column name, different table.
      await db.client.query(
        `CREATE UNIQUE INDEX "${INDEX}" ON "webhook_events" ("razorpay_event_id")`,
      );

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toMatch(/is on table "webhook_events"/);
        expect(result.message).toMatch(/somebody else's index/);
      }
    }, 60_000);
  });

  // ------------------------------------------------------------ 5 ----
  describe('5. partial index wearing the right name', () => {
    it('fails loudly — a partial index enforces a weaker constraint', async () => {
      const db = await dbBefore0002('guard-partial');
      await db.client.query(`DROP INDEX "${INDEX}"`);
      await db.client.query(
        `CREATE UNIQUE INDEX "${INDEX}" ON "${TABLE}" ("${COLUMN}") WHERE "status" = 'CAPTURED'`,
      );

      const planted = await readIndex(db.client, INDEX);
      expect(planted!.isPartial).toBe(true);
      expect(planted!.isValid).toBe(true);
      expect(planted!.isUnique).toBe(true);
      expect(planted!.columns).toEqual([COLUMN]); // right column, still wrong

      const result = await apply0002(db.client);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/PARTIAL index/);

      // Untouched, and still partial.
      expect((await readIndex(db.client, INDEX))!.isPartial).toBe(true);
    }, 60_000);
  });

  // ------------------------------------------------------------ 6 ----
  describe('6. repeated deployment', () => {
    it('is idempotent — three runs, same OIDs, no error', async () => {
      const db = await dbBefore0002('guard-repeat');

      expect(await apply0002(db.client)).toEqual({ ok: true });
      const first = {
        target: (await readIndex(db.client, INDEX))!.oid,
        created: (await readIndex(db.client, NEW_INDEX))!.oid,
      };

      for (let run = 2; run <= 3; run += 1) {
        expect(await apply0002(db.client), `run ${run}`).toEqual({ ok: true });
        expect((await readIndex(db.client, INDEX))!.oid).toBe(first.target);
        expect((await readIndex(db.client, NEW_INDEX))!.oid).toBe(first.created);
      }
    }, 60_000);

    it('still refuses on a re-run once an index has gone invalid', async () => {
      const db = await dbBefore0002('guard-repeat-invalid');
      expect(await apply0002(db.client)).toEqual({ ok: true });

      // Something breaks it between deployments.
      await makeInvalidIndex(db.client);

      expect((await apply0002(db.client)).ok).toBe(false);
    }, 60_000);
  });
});
