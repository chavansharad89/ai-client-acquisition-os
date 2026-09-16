import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createPgReconciliationRepository,
  createSqlDetectionSource,
  reconcileIdempotency,
  withReadOnlyTransaction,
  type ReconciliationWindow,
} from '@acos/core-reconciliation';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// Bounded, read-only reconciliation against real PostgreSQL.
// -----------------------------------------------------------------------
// Two properties only a real server can demonstrate:
//
//   * a READ ONLY transaction actually refuses writes (SQLSTATE 25006),
//     rather than a regex hoping the statement was a SELECT; and
//   * the window, the group limit and the row sample behave the way the
//     SQL claims, including that `record_count` stays EXACT while the
//     sample is capped.
//
// The suite drops the four unique indexes, because duplicates are what it
// exists to detect and the schema is otherwise (correctly) incapable of
// holding them.
// -----------------------------------------------------------------------

let reachable = false;
const open: TempDatabase[] = [];
const pools: Pool[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  for (const pool of pools) await pool.end();
  while (open.length > 0) await open.pop()!.drop();
});

interface Env {
  db: TempDatabase;
  pool: Pool;
}

async function freshEnv(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {
    // Duplicates cannot exist while the unique indexes do; this suite is
    // reproducing a database that predates them.
    dropTargetIndexes: true,
  });
  open.push(db);
  const pool = new Pool({ connectionString: db.url });
  pools.push(pool);
  return { db, pool };
}

const T0 = new Date('2026-03-01T00:00:00.000Z');
const at = (hours: number) => new Date(T0.getTime() + hours * 3_600_000);

const WINDOW: ReconciliationWindow = { start: at(0), end: at(24) };

/** An order plus `count` payments sharing one razorpay_payment_id. */
async function seedDuplicatePayments(
  env: Env,
  key: string,
  count: number,
  createdAt: Date,
  /** Offset so a later call can add to an existing group without id collisions. */
  startIndex = 0,
): Promise<void> {
  for (let i = startIndex; i < startIndex + count; i += 1) {
    const orderId = `order_${key}_${i}`;
    await env.db.client.query(
      `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                           product_name, amount_paise, currency, status, created_at, updated_at)
       VALUES ($1, $2, 'recon@example.test', 'ai_income_99', 'Kit', 9900, 'INR', 'PAID', $3, $3)`,
      [orderId, `rzp_${orderId}`, createdAt],
    );
    // Each duplicate needs its own order: payments_one_captured_per_order
    // forbids two CAPTURED payments on one order, and that constraint is
    // not what this suite is testing.
    await env.db.client.query(
      `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                             currency, status, created_at, updated_at)
       VALUES ($1, $2, $3, 9900, 'INR', 'CAPTURED', $4, $4)`,
      [`payment_${key}_${i}`, key, orderId, createdAt],
    );
  }
}

/** Webhook events sharing one razorpay_event_id, each with a PII payload. */
async function seedDuplicateWebhooks(
  env: Env,
  key: string,
  count: number,
  createdAt: Date,
  email = 'leak-canary@example.test',
): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await env.db.client.query(
      `INSERT INTO webhook_events
         (id, provider, razorpay_event_id, event_name, payload, signature_valid,
          received_at, created_at, updated_at)
       VALUES ($1, 'razorpay', $2, 'payment.captured',
               jsonb_build_object('contact', '+919876543210', 'email', $3::text),
               true, $4, $4, $4)`,
      [`wh_${key}_${i}`, key, email, createdAt],
    );
  }
}

/**
 * One reconciliation run, wired the way production should wire it.
 *
 * The SCAN runs inside a READ ONLY transaction on a pinned connection, so
 * the server refuses any write it might attempt. The case WRITES go
 * through the pool on a separate connection — which is why the read-only
 * transaction does not prevent reconciliation from doing its one job.
 * That split is the whole design: the half that touches business tables
 * cannot write, and the half that can write only knows about one table.
 */
async function run(env: Env, window: ReconciliationWindow = WINDOW) {
  return withReadOnlyTransaction(env.pool, async (executor) =>
    reconcileIdempotency({
      source: createSqlDetectionSource(executor),
      repository: createPgReconciliationRepository(env.pool),
      window,
      now: () => at(25),
    }),
  );
}

async function businessCounts(env: Env): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const table of ['orders', 'payments', 'webhook_events', 'meta_events']) {
    const { rows } = await env.db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM ${table}`,
    );
    out[table] = Number(rows[0]!.n);
  }
  return out;
}

describe('bounded read-only reconciliation (real PostgreSQL)', () => {
  it('runs against a real PostgreSQL server', async () => {
    const env = await freshEnv('rec-probe');
    const { rows } = await env.db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  // ----------------------------------------------------------- clean ----
  it('a clean database produces no cases and writes nothing', async () => {
    const env = await freshEnv('rec-clean');
    const report = await run(env);

    expect(report.groups).toEqual([]);
    expect(report.created).toBe(0);
    const { rows } = await env.db.client.query<{ n: string }>(
      'SELECT count(*)::text AS n FROM idempotency_reconciliations',
    );
    expect(Number(rows[0]!.n)).toBe(0);
  }, 60_000);

  // ---------------------------------------------------- in/out window ----
  it('detects duplicates inside the window', async () => {
    const env = await freshEnv('rec-inside');
    await seedDuplicatePayments(env, 'pay_inside', 3, at(6));

    const report = await run(env);

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]).toMatchObject({
      rawKey: 'pay_inside',
      recordType: 'PAYMENT',
      recordCount: 3,
    });
    expect(report.created).toBe(1);
    expect(report.window).toEqual({ start: WINDOW.start, end: WINDOW.end });
  }, 60_000);

  it('ignores duplicates outside the window, on both sides', async () => {
    const env = await freshEnv('rec-outside');
    await seedDuplicatePayments(env, 'pay_before', 4, at(-5)); // before start
    await seedDuplicatePayments(env, 'pay_after', 4, at(30)); // after end

    const report = await run(env);
    expect(report.groups).toEqual([]);

    // Widen the window and the same rows are found — proving they were
    // excluded by the bound, not missed by the query.
    const wide = await run(env, { start: at(-48), end: at(48) });
    expect(wide.groups.map((g) => g.rawKey).sort()).toEqual(['pay_after', 'pay_before']);
  }, 60_000);

  it('the window is half-open: start is included, end is not', async () => {
    const env = await freshEnv('rec-halfopen');
    await seedDuplicatePayments(env, 'pay_at_start', 2, WINDOW.start);
    await seedDuplicatePayments(env, 'pay_at_end', 2, WINDOW.end);

    const report = await run(env);
    // Exactly one: the row group sitting on `start` is in, the one on
    // `end` belongs to the next window. Consecutive windows tile without
    // double-counting.
    expect(report.groups.map((g) => g.rawKey)).toEqual(['pay_at_start']);
  }, 60_000);

  // -------------------------------------------------------- PII / size ----
  it('never loads the webhook payload, however much PII it holds', async () => {
    const env = await freshEnv('rec-pii');
    await seedDuplicateWebhooks(env, 'evt_dup', 3, at(6));

    const report = await run(env);

    expect(report.groups).toHaveLength(1);
    const serialised = JSON.stringify(report.groups[0]);
    // The canary values live in webhook_events.payload. If the snapshot
    // ever selects that column again, these fail.
    expect(serialised).not.toContain('leak-canary@example.test');
    expect(serialised).not.toContain('+919876543210');
    expect(serialised).not.toContain('payload');

    // And they are absent from what was actually persisted, too.
    const { rows } = await env.db.client.query<{ snapshot: unknown }>(
      'SELECT snapshot FROM idempotency_reconciliations',
    );
    const stored = JSON.stringify(rows[0]!.snapshot);
    expect(stored).not.toContain('leak-canary@example.test');
    expect(stored).not.toContain('+919876543210');
    // The useful fields are still there.
    expect(stored).toContain('evt_dup');
  }, 60_000);

  it('a large group keeps an exact count while sampling only a few rows', async () => {
    const env = await freshEnv('rec-large');
    await seedDuplicateWebhooks(env, 'evt_many', 60, at(6));

    const report = await run(env);

    expect(report.groups).toHaveLength(1);
    const group = report.groups[0]!;
    // Accuracy is NOT traded for performance: the count is the real one.
    expect(group.recordCount).toBe(60);
    // But only the sample is carried.
    expect(group.rows).toHaveLength(5);
    expect(group.sampleTruncated).toBe(true);
    expect(report.affectedRecordCount).toBe(60);
  }, 60_000);

  it('honours a configured sample size and group limit', async () => {
    const env = await freshEnv('rec-limits');
    await seedDuplicateWebhooks(env, 'evt_a', 10, at(6));
    await seedDuplicateWebhooks(env, 'evt_b', 10, at(7));
    await seedDuplicateWebhooks(env, 'evt_c', 10, at(8));

    const sampled = await run(env, { ...WINDOW, maxRowsPerGroup: 2, maxGroups: 2 });

    expect(sampled.groups).toHaveLength(2); // limited
    for (const g of sampled.groups) {
      expect(g.rows).toHaveLength(2); // sampled
      expect(g.recordCount).toBe(10); // still exact
      expect(g.sampleTruncated).toBe(true);
    }

    // A group smaller than the cap is not marked truncated.
    const full = await run(env, { ...WINDOW, maxRowsPerGroup: 50 });
    expect(full.groups).toHaveLength(3);
    for (const g of full.groups) {
      expect(g.rows).toHaveLength(10);
      expect(g.sampleTruncated).toBe(false);
    }
  }, 60_000);

  // --------------------------------------------------- multiple groups ----
  it('reports multiple duplicate groups across dimensions', async () => {
    const env = await freshEnv('rec-multi');
    await seedDuplicatePayments(env, 'pay_x', 2, at(2));
    await seedDuplicatePayments(env, 'pay_y', 3, at(3));
    await seedDuplicateWebhooks(env, 'evt_x', 2, at(4));

    const report = await run(env);

    expect(report.groups).toHaveLength(3);
    expect(report.byRecordType).toMatchObject({ PAYMENT: 2, WEBHOOK_EVENT: 1 });
    expect(report.affectedRecordCount).toBe(2 + 3 + 2);
    expect(report.created).toBe(3);
  }, 60_000);

  // ------------------------------------------------------- read-only ----
  describe('the transaction is genuinely READ ONLY', () => {
    it('PostgreSQL itself refuses every write inside it', async () => {
      const env = await freshEnv('rec-readonly');
      await seedDuplicatePayments(env, 'pay_ro', 2, at(6));

      for (const write of [
        `DELETE FROM payments`,
        `UPDATE payments SET status = 'FAILED'`,
        `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                             product_name, amount_paise, currency, status, updated_at)
         VALUES ('x','y','z@example.test','ai_income_99','Kit',1,'INR','PENDING',now())`,
        `CREATE TABLE sneaky (id text)`,
      ]) {
        await expect(
          withReadOnlyTransaction(env.pool, async (executor) => executor.query(write)),
          write,
        ).rejects.toMatchObject({ code: '25006' });
      }

      // 25006 is read_only_sql_transaction — the server's refusal, not
      // ours. Nothing was touched.
      expect(await businessCounts(env)).toMatchObject({ orders: 2, payments: 2 });
    }, 60_000);

    it('a reconciliation run mutates no business table', async () => {
      const env = await freshEnv('rec-nomutate');
      await seedDuplicatePayments(env, 'pay_m', 3, at(6));
      await seedDuplicateWebhooks(env, 'evt_m', 2, at(7));

      const before = await businessCounts(env);
      const beforeRows = await env.db.client.query(
        'SELECT id, status, amount_paise FROM payments ORDER BY id',
      );

      await run(env);

      expect(await businessCounts(env)).toEqual(before);
      const afterRows = await env.db.client.query(
        'SELECT id, status, amount_paise FROM payments ORDER BY id',
      );
      expect(afterRows.rows).toEqual(beforeRows.rows);
    }, 60_000);

    it('writes only to idempotency_reconciliations', async () => {
      const env = await freshEnv('rec-onlytable');
      await seedDuplicatePayments(env, 'pay_only', 2, at(6));

      await run(env);

      const { rows } = await env.db.client.query<{ n: string }>(
        'SELECT count(*)::text AS n FROM idempotency_reconciliations',
      );
      expect(Number(rows[0]!.n)).toBe(1);
      expect(await businessCounts(env)).toMatchObject({ payments: 2, meta_events: 0 });
    }, 60_000);
  });

  // -------------------------------------------------------- repeatable ----
  it('repeated reconciliation is idempotent and preserves human triage', async () => {
    const env = await freshEnv('rec-repeat');
    await seedDuplicatePayments(env, 'pay_rep', 2, at(6));

    const first = await run(env);
    expect(first.created).toBe(1);
    expect(first.updated).toBe(0);

    const second = await run(env);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);

    const { rows } = await env.db.client.query<{ n: string }>(
      'SELECT count(*)::text AS n FROM idempotency_reconciliations',
    );
    expect(Number(rows[0]!.n)).toBe(1);

    // A human moves the case on; a later run must refresh the evidence
    // without dragging the case back to OPEN.
    await env.db.client.query(
      `UPDATE idempotency_reconciliations SET status = 'IN_REVIEW'`,
    );
    await seedDuplicatePayments(env, 'pay_rep', 1, at(8), 2); // a third collision
    const third = await run(env);

    expect(third.updated).toBe(1);
    const { rows: after } = await env.db.client.query<{ status: string; record_count: number }>(
      'SELECT status, record_count FROM idempotency_reconciliations',
    );
    expect(after[0]!.status).toBe('IN_REVIEW'); // triage preserved
    expect(after[0]!.record_count).toBe(3); // evidence refreshed
  }, 60_000);
});
