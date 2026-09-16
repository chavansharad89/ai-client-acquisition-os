import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// meta_events indexing, verified against pg_index and real plans.
// -----------------------------------------------------------------------
// Migration 0010 drops two indexes. "Do not blindly remove indexes" is the
// rule, so these tests check the two things that justify each drop:
//
//   REDUNDANCY — that the surviving index is structurally identical in
//   every attribute a btree read depends on, and that the planner
//   actually picks it for the queries the dropped one served.
//
//   SAFETY — that 0010 REFUSES to drop anything when its replacement is
//   missing or INVALID, rather than trusting a name.
// -----------------------------------------------------------------------

let reachable = false;
const open: TempDatabase[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

const MIGRATIONS = [
  '0005_outreach_provenance',
  '0006_opportunity_lifecycle',
] as const;

async function freshDb(label: string, throughMigration?: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {
    ...(throughMigration ? { throughMigration } : {}),
  });
  open.push(db);
  return db;
}

async function indexNames(db: TempDatabase): Promise<string[]> {
  const { rows } = await db.client.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'meta_events' ORDER BY indexname`,
  );
  return rows.map((r) => r.indexname);
}

async function applyMigration(db: TempDatabase, dir: string): Promise<void> {
  const { readFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  await db.client.query(
    readFileSync(
      resolve(__dirname, '../../packages/db/prisma/migrations', dir, 'migration.sql'),
      'utf8',
    ),
  );
}

const M0010 = '0010_meta_events_index_rationalisation';

describe('meta_events index rationalisation', () => {
  it('runs against a real PostgreSQL server', async () => {
    const db = await freshDb('mi-probe');
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  // ----------------------------------------------------- the end state ----
  it('leaves exactly the indexes the query patterns need', async () => {
    const db = await freshDb('mi-final');
    expect(await indexNames(db)).toEqual([
      'meta_events_due_idx', // claim: partial, ordered
      'meta_events_lease_expires_at_idx', // releaseExpiredLeases
      'meta_events_meta_event_id_key', // enqueue ON CONFLICT + dedupe
      'meta_events_order_id_key', // triggers, FK, reconciliation
      'meta_events_pkey', // settle by id
    ]);
  }, 60_000);

  // -------------------------------------------------------- redundancy ----
  describe('the plain order_id index was redundant', () => {
    it('was structurally identical to the unique one in every read-relevant attribute', async () => {
      // Checked BEFORE 0010 runs, which is where the claim has to hold.
      const db = await freshDb('mi-redundant', '0009_payment_transitions');

      const { rows } = await db.client.query<Record<string, unknown>>(
        `SELECT c.relname,
                am.amname, i.indkey::text AS indkey, i.indclass::text AS indclass,
                i.indcollation::text AS indcollation, i.indoption::text AS indoption,
                i.indnatts, i.indnkeyatts,
                i.indpred IS NOT NULL AS partial, i.indexprs IS NOT NULL AS expr,
                i.indisunique
           FROM pg_class c
           JOIN pg_index i ON i.indexrelid = c.oid
           JOIN pg_am am ON am.oid = c.relam
          WHERE c.relname IN ('meta_events_order_id_idx','meta_events_order_id_key')
          ORDER BY c.relname`,
      );
      expect(rows).toHaveLength(2);
      const [plain, unique] = rows as [Record<string, unknown>, Record<string, unknown>];

      // Everything that decides what reads a btree can serve.
      for (const attr of [
        'amname',
        'indkey',
        'indclass',
        'indcollation',
        'indoption',
        'indnatts',
        'indnkeyatts',
        'partial',
        'expr',
      ]) {
        expect(plain[attr], attr).toEqual(unique[attr]);
      }
      // The one and only difference, and it constrains writes, not reads.
      expect(plain.indisunique).toBe(false);
      expect(unique.indisunique).toBe(true);
    }, 60_000);

    it('the unique index serves every reader the plain one served', async () => {
      const db = await freshDb('mi-readers');
      await db.client.query(
        `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug, product_name,
                             amount_paise, currency, status, updated_at)
         SELECT 'o'||g,'rzp_o'||g,'x@y.test','ai_income_99','Kit',9900,'INR','PAID',now()
           FROM generate_series(1,2000) g`,
      );
      // meta_events must actually have rows: on an empty table the
      // planner correctly prefers a Seq Scan, and the test would be
      // measuring emptiness rather than index choice.
      await db.client.query(`ALTER TABLE meta_events DISABLE TRIGGER meta_events_require_capture`);
      await db.client.query(
        `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product, value_paise,
                                  currency, status, attempts, next_attempt_at, updated_at)
         SELECT 'm'||g,'purchase_'||g,'o'||g,'Purchase','ai_income_99',9900,'INR','SENT',
                0, now(), now()
           FROM generate_series(1,2000) g`,
      );
      await db.client.query(`ALTER TABLE meta_events ENABLE TRIGGER meta_events_require_capture`);
      await db.client.query(`ANALYZE orders, meta_events`);

      // The trigger/reconciliation access path.
      const { rows } = await db.client.query<{ 'QUERY PLAN': string }>(
        `EXPLAIN SELECT 1 FROM meta_events WHERE order_id = 'o42'`,
      );
      const plan = rows.map((r) => r['QUERY PLAN']).join('\n');
      expect(plan).toContain('meta_events_order_id_key');
      expect(plan).not.toContain('Seq Scan');
    }, 60_000);
  });

  // ------------------------------------------------------- partial index ----
  describe('the retry index is partial and carries the sort key', () => {
    it('is partial on PENDING and keyed on (next_attempt_at, created_at)', async () => {
      const db = await freshDb('mi-partial');
      const { rows } = await db.client.query<{ indexdef: string }>(
        `SELECT indexdef FROM pg_indexes
          WHERE tablename='meta_events' AND indexname='meta_events_due_idx'`,
      );
      const def = rows[0]!.indexdef;
      expect(def).toContain('next_attempt_at');
      expect(def).toContain('created_at');
      expect(def).toMatch(/WHERE \(?status = 'PENDING'/);
      // status earns no place in the key: it is constant inside the index.
      expect(def).not.toMatch(/\(status,/);
    }, 60_000);

    it('serves the claim query with no sort node', async () => {
      const db = await freshDb('mi-claim');
      await db.client.query(
        `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug, product_name,
                             amount_paise, currency, status, updated_at)
         SELECT 'o'||g,'rzp_o'||g,'x@y.test','ai_income_99','Kit',9900,'INR','PAID',now()
           FROM generate_series(1,3000) g`,
      );
      await db.client.query(`ALTER TABLE meta_events DISABLE TRIGGER meta_events_require_capture`);
      await db.client.query(
        `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product, value_paise,
                                  currency, status, attempts, next_attempt_at, created_at, updated_at)
         SELECT 'm'||g,'purchase_'||g,'o'||g,'Purchase','ai_income_99',9900,'INR',
                CASE WHEN g <= 2900 THEN 'SENT' ELSE 'PENDING' END::"MetaEventStatus",
                0, now() - (g||' seconds')::interval, now() - (g||' seconds')::interval, now()
           FROM generate_series(1,3000) g`,
      );
      await db.client.query(`ALTER TABLE meta_events ENABLE TRIGGER meta_events_require_capture`);
      await db.client.query(`ANALYZE meta_events`);

      const { rows } = await db.client.query<{ 'QUERY PLAN': string }>(
        `EXPLAIN SELECT c.id FROM meta_events c
          WHERE c.status='PENDING' AND c.next_attempt_at <= now()
          ORDER BY c.next_attempt_at, c.created_at LIMIT 25`,
      );
      const plan = rows.map((r) => r['QUERY PLAN']).join('\n');

      expect(plan).toContain('meta_events_due_idx');
      // The index supplies the ordering, so no Sort and no Incremental
      // Sort. Before 0010 this plan carried an Incremental Sort because
      // created_at was not in the index.
      expect(plan).not.toMatch(/Sort/);
      expect(plan).not.toContain('Seq Scan');
    }, 60_000);

    it('indexes only the claimable rows, so it does not grow with delivered ones', async () => {
      const db = await freshDb('mi-size');
      await db.client.query(
        `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug, product_name,
                             amount_paise, currency, status, updated_at)
         SELECT 'o'||g,'rzp_o'||g,'x@y.test','ai_income_99','Kit',9900,'INR','PAID',now()
           FROM generate_series(1,5000) g`,
      );
      await db.client.query(`ALTER TABLE meta_events DISABLE TRIGGER meta_events_require_capture`);
      await db.client.query(
        `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product, value_paise,
                                  currency, status, attempts, next_attempt_at, created_at, updated_at)
         SELECT 'm'||g,'purchase_'||g,'o'||g,'Purchase','ai_income_99',9900,'INR',
                CASE WHEN g <= 4950 THEN 'SENT' ELSE 'PENDING' END::"MetaEventStatus",
                0, now(), now(), now()
           FROM generate_series(1,5000) g`,
      );
      await db.client.query(`ALTER TABLE meta_events ENABLE TRIGGER meta_events_require_capture`);

      const { rows } = await db.client.query<{ due: string; pkey: string }>(
        `SELECT pg_relation_size('meta_events_due_idx')::text AS due,
                pg_relation_size('meta_events_pkey')::text AS pkey`,
      );
      // 50 pending of 5,000 rows: the partial index is a fraction of a
      // whole-table one, and the ratio improves as SENT accumulates.
      expect(Number(rows[0]!.due)).toBeLessThan(Number(rows[0]!.pkey) / 4);
    }, 60_000);

    it('leaves releaseExpiredLeases on its own index', async () => {
      const db = await freshDb('mi-release');
      const { rows } = await db.client.query<{ 'QUERY PLAN': string }>(
        `EXPLAIN SELECT id FROM meta_events
          WHERE status='PROCESSING' AND lease_expires_at IS NOT NULL AND lease_expires_at <= now()`,
      );
      // Whatever the planner picks on an empty table, the index it would
      // use must still exist — dropping (status, next_attempt_at) must not
      // have taken this query's access path with it.
      expect(await indexNames(db)).toContain('meta_events_lease_expires_at_idx');
      expect(rows.length).toBeGreaterThan(0);
    }, 60_000);
  });

  // ------------------------------------------------------------ refusal ----
  describe('0010 refuses to drop anything on trust', () => {
    it('will not drop the plain index when the unique one is INVALID', async () => {
      const db = await freshDb('mi-refuse-invalid', '0009_payment_transitions');

      // Manufacture the real failure signature: a concurrent unique build
      // that hits duplicates leaves indisvalid = false behind.
      await db.client.query(`DROP INDEX meta_events_order_id_key`);
      await db.client.query(
        `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug, product_name,
                             amount_paise, currency, status, updated_at)
         VALUES ('o1','rzp_o1','x@y.test','ai_income_99','Kit',9900,'INR','PAID',now())`,
      );
      await db.client.query(`ALTER TABLE meta_events DISABLE TRIGGER meta_events_require_capture`);
      await db.client.query(
        `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product, value_paise,
                                  currency, status, attempts, next_attempt_at, updated_at)
         VALUES ('m1','p1','o1','Purchase','k',1,'INR','PENDING',0,now(),now()),
                ('m2','p2','o1','Purchase','k',1,'INR','PENDING',0,now(),now())`,
      );
      await db.client.query(`ALTER TABLE meta_events ENABLE TRIGGER meta_events_require_capture`);
      await expect(
        db.client.query(
          `CREATE UNIQUE INDEX CONCURRENTLY meta_events_order_id_key ON meta_events (order_id)`,
        ),
      ).rejects.toMatchObject({ code: '23505' });

      await expect(applyMigration(db, M0010)).rejects.toMatchObject({ code: '42P17' });

      // The working index survives — dropping it because a broken one
      // wears the right name is the mistake being prevented.
      expect(await indexNames(db)).toContain('meta_events_order_id_idx');
    }, 60_000);

    it('will not drop the plain index when the unique one is absent', async () => {
      const db = await freshDb('mi-refuse-missing', '0009_payment_transitions');
      await db.client.query(`DROP INDEX meta_events_order_id_key`);

      await expect(applyMigration(db, M0010)).rejects.toMatchObject({ code: '42P17' });
      expect(await indexNames(db)).toContain('meta_events_order_id_idx');
    }, 60_000);

    it('will not drop the retry index when the replacement is not partial', async () => {
      const db = await freshDb('mi-refuse-nonpartial', '0009_payment_transitions');
      // A decoy wearing the right name but indexing every row.
      await db.client.query(
        `CREATE INDEX meta_events_due_idx ON meta_events (next_attempt_at, created_at)`,
      );

      await expect(applyMigration(db, M0010)).rejects.toMatchObject({ code: '42P17' });
      expect(await indexNames(db)).toContain('meta_events_status_next_attempt_at_idx');
    }, 60_000);

    it('is replayable: a second run changes nothing and raises nothing', async () => {
      const db = await freshDb('mi-replay');
      const before = await indexNames(db);
      await applyMigration(db, M0010);
      await applyMigration(db, M0010);
      expect(await indexNames(db)).toEqual(before);
    }, 60_000);
  });
});
