import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createPgReconciliationRepository,
  createSqlDetectionSource,
  reconcileIdempotency,
  type ReconciliationReport,
} from '@acos/core-reconciliation';

import { seedDuplicates } from '../fixtures/idempotency-duplicates';
import { suiteDatabase } from './support/suiteDb';

// RECONCILIATION — real PostgreSQL.
// -----------------------------------------------------------------------
// The unique indexes are dropped when this database is built, because
// reconciliation's whole job is finding duplicates that a missing or
// not-yet-deployed constraint allowed in. With the indexes present the
// duplicates could not exist and every test would be vacuously clean.
// -----------------------------------------------------------------------

const suite = suiteDatabase('recon', { dropTargetIndexes: true });

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function runner() {
  const { db } = suite.require();
  return () =>
    reconcileIdempotency({
      source: createSqlDetectionSource(db.client),
      repository: createPgReconciliationRepository(db.client),
      // Detection is now windowed. This suite's fixtures are seeded with
      // the current clock, so a window wide enough to contain them keeps
      // these tests about detection rather than about time.
      window: { start: new Date('2000-01-01T00:00:00.000Z'), end: new Date('2100-01-01T00:00:00.000Z') },
    });
}

/**
 * Cases opened by THIS test, and no other.
 *
 * idempotency_reconciliations is not in CLEANUP_ORDER — a case is an
 * operational audit record and deleting it is not something the cleanup
 * helper should be doing — so rows accumulate across the suite. Reading
 * the whole table meant `const [row] = await caseRows()` picked up a
 * PAYMENT case left three describe-blocks earlier and compared it against
 * a WEBHOOK_EVENT expectation.
 *
 * Every duplicate_key embeds the run id (the fixtures' duplicated values
 * are `<prefix>_<runId>_<suffix>`), and the run id is re-scoped on each
 * cleanup, so filtering on it isolates the test without touching the
 * table.
 */
async function caseRows(): Promise<
  { record_type: string; duplicate_key: string; record_count: number; status: string }[]
> {
  const { db, context } = suite.require();
  const { rows } = await db.client.query(
    `SELECT record_type, duplicate_key, record_count, status
       FROM idempotency_reconciliations
      WHERE duplicate_key LIKE '%\_' || $1 || '\_%'
      ORDER BY duplicate_key`,
    [context.runId],
  );
  return rows;
}

describe('RECONCILIATION — no duplicates', () => {
  it('reports clean and writes no cases', async () => {
    const report = await runner()();
    expect(report.groups).toEqual([]);
    expect(report.created).toBe(0);
    expect(await caseRows()).toEqual([]);
  });

  it('scans all four dimensions even when nothing is found', async () => {
    const report = await runner()();
    expect(report.scannedDimensions).toHaveLength(4);
  });
});

describe('RECONCILIATION — duplicate payment', () => {
  it('opens one PAYMENT case with the real rows in its snapshot', async () => {
    const { db, context } = suite.require();
    const { fixtures } = await seedDuplicates(db.client, context, 'payment', { copies: 3 });

    const report = await runner()();

    expect(report.created).toBe(1);
    const [row] = await caseRows();
    expect(row).toMatchObject({
      record_type: 'PAYMENT',
      duplicate_key: `payment.razorpayPaymentId=${fixtures[0]!.duplicatedValue}`,
      record_count: 3,
      status: 'OPEN',
    });
  });

  it('the snapshot holds the complete rows, read from the live table', async () => {
    const { db, context } = suite.require();
    const { fixtures } = await seedDuplicates(db.client, context, 'payment');
    await runner()();

    // Scoped to THIS test's case. idempotency_reconciliations is not in
    // CLEANUP_ORDER, so cases survive afterEach, and duplicate_key embeds
    // the run-scoped value — so every test adds a row rather than
    // updating one. An unordered rows[0] returned the previous test's
    // case, which had been seeded with three copies instead of two.
    const { rows } = await db.client.query(
      `SELECT snapshot FROM idempotency_reconciliations
        WHERE record_type = 'PAYMENT' AND duplicate_key = $1`,
      [`payment.razorpayPaymentId=${fixtures[0]!.duplicatedValue}`],
    );
    expect(rows).toHaveLength(1);
    const snapshot = rows[0].snapshot;
    expect(snapshot.rows).toHaveLength(2);
    expect(snapshot.rows[0]).toHaveProperty('razorpay_payment_id');
    expect(snapshot.rows[0]).toHaveProperty('amount_paise');
  });
});

describe('RECONCILIATION — duplicate webhook', () => {
  it('opens one WEBHOOK_EVENT case', async () => {
    const { db, context } = suite.require();
    const { fixtures } = await seedDuplicates(db.client, context, 'webhookEvent');

    await runner()();

    const [row] = await caseRows();
    expect(row).toMatchObject({
      record_type: 'WEBHOOK_EVENT',
      duplicate_key: `webhookEvent.razorpayEventId=${fixtures[0]!.duplicatedValue}`,
      record_count: 2,
    });
  });
});

describe('RECONCILIATION — duplicate Meta order', () => {
  it('opens a META_EVENT case keyed on the order dimension', async () => {
    const { db, context } = suite.require();
    const { fixtures } = await seedDuplicates(db.client, context, 'order', { copies: 2 });

    await runner()();

    const rows = await caseRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      record_type: 'META_EVENT',
      duplicate_key: `metaEvent.orderId=${fixtures[0]!.duplicatedValue}`,
    });
  });
});

describe('RECONCILIATION — duplicate Meta event', () => {
  it('opens a META_EVENT case keyed on the metaEventId dimension', async () => {
    const { db, context } = suite.require();
    const { fixtures } = await seedDuplicates(db.client, context, 'metaEvent');

    await runner()();

    const rows = await caseRows();
    expect(rows[0]).toMatchObject({
      record_type: 'META_EVENT',
      duplicate_key: `metaEvent.metaEventId=${fixtures[0]!.duplicatedValue}`,
    });
  });

  it('keeps the two META_EVENT dimensions as separate cases', async () => {
    // Both dimensions share record_type = META_EVENT, so without the
    // qualified key the unique index would collapse them into one case.
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'metaEvent');
    await seedDuplicates(db.client, context, 'order');

    await runner()();

    const rows = (await caseRows()).filter((r) => r.record_type === 'META_EVENT');
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.duplicate_key.split('=')[0]).sort()).toEqual([
      'metaEvent.metaEventId',
      'metaEvent.orderId',
    ]);
  });
});

describe('RECONCILIATION — all kinds together, and reruns', () => {
  it('detects every kind in one pass', async () => {
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'all');

    const report = await runner()();

    expect(report.groups.length).toBeGreaterThanOrEqual(4);
    const types = (await caseRows()).map((r) => r.record_type);
    expect(new Set(types)).toEqual(new Set(['PAYMENT', 'WEBHOOK_EVENT', 'META_EVENT']));
  });

  it('is read-only — a run mutates no business row', async () => {
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'all');
    const before = await businessCounts();

    await runner()();

    expect(await businessCounts()).toEqual(before);
  });

  it('re-running updates the existing case instead of inserting a second', async () => {
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'payment');
    const run = runner();

    const first = await run();
    const second = await run();

    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);
    expect(await caseRows()).toHaveLength(1);
  });

  it('does not drag a triaged case back to OPEN', async () => {
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'payment');
    const run = runner();
    await run();

    await db.client.query(
      `UPDATE idempotency_reconciliations SET status = 'IN_REVIEW' WHERE record_type = 'PAYMENT'`,
    );
    await run();

    const [row] = await caseRows();
    expect(row!.status).toBe('IN_REVIEW');
  });

  it('refreshes record_count when the duplicate group grows', async () => {
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'webhookEvent', { copies: 2 });
    const run = runner();
    await run();
    expect((await caseRows())[0]!.record_count).toBe(2);

    // A third copy of the same event id arrives.
    const eventId = (await caseRows())[0]!.duplicate_key.split('=')[1]!;
    const id = context.id('webhook', 'grown');
    await db.client.query(
      `INSERT INTO webhook_events (id, razorpay_event_id, event_name, payload, signature_valid, updated_at)
       VALUES ($1, $2, 'payment.captured', '{}'::jsonb, true, now())`,
      [id, eventId],
    );
    context.trackWebhookEvent(id);

    await run();
    expect((await caseRows())[0]!.record_count).toBe(3);
  });

  it('a clean rerun leaves the historical case in place', async () => {
    const { db, context } = suite.require();
    await seedDuplicates(db.client, context, 'payment');
    const run = runner();
    await run();

    // Remove one copy so the group is no longer a duplicate.
    const { paymentIds } = context;
    await db.client.query(`DELETE FROM payments WHERE id = $1`, [paymentIds[0]]);

    const clean: ReconciliationReport = await run();
    expect(clean.groups).toEqual([]);
    expect(await caseRows()).toHaveLength(1); // audit trail outlives the condition
  });
});

async function businessCounts(): Promise<Record<string, number>> {
  const { db } = suite.require();
  const counts: Record<string, number> = {};
  for (const table of ['orders', 'payments', 'webhook_events', 'meta_events']) {
    const { rows } = await db.client.query(`SELECT count(*)::int AS n FROM "${table}"`);
    counts[table] = rows[0].n;
  }
  return counts;
}
