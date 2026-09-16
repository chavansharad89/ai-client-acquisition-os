import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { verifyIndex, createIndexSql, INSPECT_INDEX_SQL } from '@acos/db-index-deploy';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// Index inspection under a hostile search_path.
// -----------------------------------------------------------------------
// The bug: INSPECT_INDEX_SQL filtered on `n.nspname = current_schema()`,
// which resolves to the first EXISTING entry in the caller's search_path.
// That is a property of the connection, not the database — and this
// library runs in a standalone script whose search_path can be set by the
// connection string, by ALTER ROLE, by ALTER DATABASE, or by a pooler.
//
// The failure pointed the wrong way: a real, valid index in `public`
// reported MISSING, so the deployment would try to build it — and
// CREATE UNIQUE INDEX CONCURRENTLY then fails with "already exists", or
// succeeds in the other schema and leaves two.
//
// Every test below sets a search_path that does NOT contain the schema
// the index lives in. The answer must not change.
// -----------------------------------------------------------------------

let reachable = false;
const open: TempDatabase[] = [];
const clients: Client[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  for (const c of clients) await c.end().catch(() => undefined);
  while (open.length > 0) await open.pop()!.drop();
});

const TARGET = {
  migrationName: '0002_concurrent_unique_indexes',
  indexName: 'payments_razorpay_payment_id_key',
  table: 'payments',
  columns: ['razorpay_payment_id'] as const,
  rationale: 'test',
};

async function freshDb(label: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {
  });
  open.push(db);
  return db;
}

/** A connection whose search_path deliberately excludes `public`. */
async function clientWithSearchPath(db: TempDatabase, searchPath: string): Promise<Client> {
  const client = new Client({ connectionString: db.url });
  await client.connect();
  clients.push(client);
  await client.query(`SET search_path TO ${searchPath}`);
  return client;
}

describe('index inspection is schema-explicit', () => {
  it('runs against a real PostgreSQL server', async () => {
    const db = await freshDb('sp-probe');
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  it('the statement takes the schema as a parameter, not from the session', () => {
    expect(INSPECT_INDEX_SQL).not.toMatch(/current_schema/);
    expect(INSPECT_INDEX_SQL).toContain('n.nspname = $2');
  });

  it('finds a real index while search_path points somewhere else entirely', async () => {
    const db = await freshDb('sp-elsewhere');
    await db.client.query(`CREATE SCHEMA reporting`);
    const client = await clientWithSearchPath(db, 'reporting');

    // Sanity: the session really is pointed away from public.
    const { rows } = await client.query<{ s: string }>('SELECT current_schema() AS s');
    expect(rows[0]!.s).toBe('reporting');

    // The index is in public. Before the fix this reported `missing`.
    const verdict = await verifyIndex(client, TARGET, 'public');
    expect(verdict.state).toBe('valid');
  }, 60_000);

  it.each([
    ['a schema that does not contain the table', 'reporting'],
    ['a schema that does not exist at all', 'nonexistent_schema'],
    ['pg_catalog only', 'pg_catalog'],
    ['several wrong schemas', 'reporting, nonexistent_schema, pg_catalog'],
  ])('is unaffected by %s', async (_label, searchPath) => {
    const db = await freshDb(`sp-${searchPath.replace(/\W+/g, '')}`.slice(0, 40));
    await db.client.query(`CREATE SCHEMA IF NOT EXISTS reporting`);
    const client = await clientWithSearchPath(db, searchPath);

    const verdict = await verifyIndex(client, TARGET, 'public');
    expect(verdict.state).toBe('valid');
  }, 60_000);

  it('still reports missing when the index really is absent from that schema', async () => {
    const db = await freshDb('sp-really-missing');
    await db.client.query(`CREATE SCHEMA reporting`);
    const client = await clientWithSearchPath(db, 'public');

    // Asking about `reporting`, where it genuinely is not — the answer
    // must be `missing` for the right reason, not by accident.
    expect((await verifyIndex(client, TARGET, 'reporting')).state).toBe('missing');
    // And still found in the schema it does live in.
    expect((await verifyIndex(client, TARGET, 'public')).state).toBe('valid');
  }, 60_000);

  it('does not confuse two same-named indexes in different schemas', async () => {
    const db = await freshDb('sp-twins');
    await db.client.query(`CREATE SCHEMA reporting`);
    // A decoy wearing the same name, on a different table, in another
    // schema. current_schema() inspection could pick either depending on
    // the session.
    await db.client.query(`CREATE TABLE reporting.payments (razorpay_payment_id text)`);
    await db.client.query(
      `CREATE INDEX "payments_razorpay_payment_id_key" ON reporting.payments (razorpay_payment_id)`,
    );

    const client = await clientWithSearchPath(db, 'reporting, public');

    // public: the real one — unique and valid.
    expect((await verifyIndex(client, TARGET, 'public')).state).toBe('valid');
    // reporting: the decoy — present, but not UNIQUE.
    const decoy = await verifyIndex(client, TARGET, 'reporting');
    expect(decoy.state).toBe('mismatched');
    if (decoy.state === 'mismatched') expect(decoy.reason).toMatch(/not UNIQUE/);
  }, 60_000);

  // --------------------------------------------- preserved validations ----
  describe('every validation still applies, schema-explicitly', () => {
    it('detects an INVALID index in the named schema', async () => {
      const db = await freshDb('sp-invalid');
      const client = await clientWithSearchPath(db, 'pg_catalog');

      // Manufactured the way production does: duplicates, then a real
      // concurrent build that fails and leaves indisvalid = false.
      await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
      for (const n of [1, 2]) {
        await db.client.query(
          `INSERT INTO public.orders (id, razorpay_order_id, customer_email, product_slug,
                                      product_name, amount_paise, currency, status, updated_at)
           VALUES ($1, $2, 'sp@example.test', 'ai_income_99', 'Kit', 9900, 'INR', 'PAID', now())`,
          [`o${n}`, `rzp_o${n}`],
        );
        await db.client.query(
          `INSERT INTO public.payments (id, razorpay_payment_id, order_id, amount_paise,
                                        currency, status, updated_at)
           VALUES ($1, 'dup', $2, 9900, 'INR', 'CAPTURED', now())`,
          [`p${n}`, `o${n}`],
        );
      }
      await expect(
        db.client.query(
          `CREATE UNIQUE INDEX CONCURRENTLY "${TARGET.indexName}" ON public.payments (razorpay_payment_id)`,
        ),
      ).rejects.toMatchObject({ code: '23505' });

      const verdict = await verifyIndex(client, TARGET, 'public');
      expect(verdict.state).toBe('invalid');
    }, 60_000);

    it('detects a non-unique index', async () => {
      const db = await freshDb('sp-nonunique');
      const client = await clientWithSearchPath(db, 'pg_catalog');
      await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
      await db.client.query(
        `CREATE INDEX "${TARGET.indexName}" ON public.payments (razorpay_payment_id)`,
      );

      const verdict = await verifyIndex(client, TARGET, 'public');
      expect(verdict.state).toBe('mismatched');
      if (verdict.state === 'mismatched') expect(verdict.reason).toMatch(/not UNIQUE/);
    }, 60_000);

    it('detects a PARTIAL index', async () => {
      const db = await freshDb('sp-partial');
      const client = await clientWithSearchPath(db, 'pg_catalog');
      await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
      await db.client.query(
        `CREATE UNIQUE INDEX "${TARGET.indexName}" ON public.payments (razorpay_payment_id)
           WHERE status = 'CAPTURED'`,
      );

      const verdict = await verifyIndex(client, TARGET, 'public');
      expect(verdict.state).toBe('mismatched');
      if (verdict.state === 'mismatched') expect(verdict.reason).toMatch(/PARTIAL/);
    }, 60_000);

    it('detects an INCLUDE index, which is the sneaky shape of "one column"', async () => {
      const db = await freshDb('sp-include');
      const client = await clientWithSearchPath(db, 'pg_catalog');
      await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
      // Unique on exactly the target column, and still wrong: the payload
      // column rides along in indkey, so this is not the index we asked
      // for. indnkeyatts would say 1 here; the column list says otherwise.
      await db.client.query(
        `CREATE UNIQUE INDEX "${TARGET.indexName}" ON public.payments (razorpay_payment_id)
           INCLUDE (order_id)`,
      );

      const verdict = await verifyIndex(client, TARGET, 'public');
      expect(verdict.state).toBe('mismatched');
      if (verdict.state === 'mismatched') expect(verdict.reason).toMatch(/covers/);
    }, 60_000);

    it('detects a composite index where one column was expected', async () => {
      const db = await freshDb('sp-composite');
      const client = await clientWithSearchPath(db, 'pg_catalog');
      await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
      await db.client.query(
        `CREATE UNIQUE INDEX "${TARGET.indexName}" ON public.payments (razorpay_payment_id, order_id)`,
      );

      expect((await verifyIndex(client, TARGET, 'public')).state).toBe('mismatched');
    }, 60_000);

    it('detects the wrong target table', async () => {
      const db = await freshDb('sp-wrongtable');
      const client = await clientWithSearchPath(db, 'pg_catalog');
      await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
      await db.client.query(
        `CREATE UNIQUE INDEX "${TARGET.indexName}" ON public.webhook_events (razorpay_event_id)`,
      );

      const verdict = await verifyIndex(client, TARGET, 'public');
      expect(verdict.state).toBe('mismatched');
      if (verdict.state === 'mismatched') expect(verdict.reason).toMatch(/webhook_events/);
    }, 60_000);
  });

  it('builds where it inspects: a qualified CREATE lands in the named schema', async () => {
    const db = await freshDb('sp-create');
    await db.client.query(`CREATE SCHEMA reporting`);
    await db.client.query(`CREATE TABLE reporting.payments (razorpay_payment_id text)`);
    // search_path says reporting; the statement says public.
    const client = await clientWithSearchPath(db, 'reporting');

    await db.client.query(`DROP INDEX public."${TARGET.indexName}"`);
    await client.query(createIndexSql(TARGET, 'public'));

    // It landed in public, not in the session's schema.
    expect((await verifyIndex(client, TARGET, 'public')).state).toBe('valid');
    expect((await verifyIndex(client, TARGET, 'reporting')).state).toBe('missing');
  }, 60_000);
});
