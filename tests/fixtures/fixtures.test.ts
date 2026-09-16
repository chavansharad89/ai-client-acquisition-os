import { describe, expect, it } from 'vitest';

import { createFakeDb } from './fakeDb';
import {
  DUPLICATE_KINDS,
  mergeIds,
  seedDuplicateOrders,
  seedDuplicatePayments,
  seedDuplicates,
  seedDuplicateWebhookEvents,
  type DuplicateIdentifierKind,
} from './idempotency-duplicates';
import {
  assertCleanupSucceeded,
  CLEANUP_ORDER,
  cleanupTestRun,
  countRunRows,
  createRunId,
  createTestRunContext,
  type Queryable,
} from './test-run-context';

const RUN = 'fixedrun';

describe('determinism', () => {
  it('produces identical ids for the same runId', async () => {
    const seed = async () => {
      const db = createFakeDb();
      const ctx = createTestRunContext(RUN);
      await seedDuplicates(db, ctx, 'all');
      return {
        orderIds: ctx.orderIds,
        paymentIds: ctx.paymentIds,
        webhookEventIds: ctx.webhookEventIds,
        metaEventIds: ctx.metaEventIds,
      };
    };
    expect(await seed()).toEqual(await seed());
  });

  it('produces different ids for different runIds', async () => {
    const ids = async (run: string) => {
      const ctx = createTestRunContext(run);
      await seedDuplicatePayments(createFakeDb(), ctx);
      return ctx.paymentIds;
    };
    const a = await ids('runA');
    const b = await ids('runB');
    expect(a).not.toEqual(b);
    expect(a.some((id) => b.includes(id))).toBe(false);
  });

  it('tags every id with the runId', async () => {
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(createFakeDb(), ctx, 'all');
    const all = [...ctx.orderIds, ...ctx.paymentIds, ...ctx.webhookEventIds, ...ctx.metaEventIds];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((id) => id.includes(RUN))).toBe(true);
  });

  it('generates a unique runId when none is supplied', () => {
    expect(createRunId()).not.toBe(createRunId());
  });

  it('refuses to track an id that does not carry the runId', () => {
    const ctx = createTestRunContext(RUN);
    expect(() => ctx.trackOrder('order_someone_else_1')).toThrow(/does not carry runId/);
  });
});

describe('each duplicate kind', () => {
  it.each(DUPLICATE_KINDS)('seeds %s and returns exactly the ids it created', async (kind) => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    const { fixtures } = await seedDuplicates(db, ctx, kind);

    expect(fixtures).toHaveLength(1);
    const f = fixtures[0]!;
    expect(f.kind).toBe(kind);
    expect(f.copies).toBe(2);

    // Everything the fixture reports is tracked, and vice versa.
    const reported = [...f.orderIds, ...f.paymentIds, ...f.webhookEventIds, ...f.metaEventIds];
    const tracked = [
      ...ctx.orderIds,
      ...ctx.paymentIds,
      ...ctx.webhookEventIds,
      ...ctx.metaEventIds,
    ];
    expect(new Set(reported)).toEqual(new Set(tracked));
  });

  it('payment duplicates use one order each, to dodge payments_one_captured_per_order', async () => {
    // A partial unique index permits a single CAPTURED payment per order,
    // so all copies on one order would violate THAT rule instead of the
    // razorpay_payment_id rule under test.
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    const f = await seedDuplicatePayments(db, ctx, { copies: 3 });

    expect(f.paymentIds).toHaveLength(3);
    expect(new Set(f.orderIds).size).toBe(3);
  });

  it('metaEvent duplicates share meta_event_id but not order_id', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    const { fixtures } = await seedDuplicates(db, ctx, 'metaEvent', { copies: 3 });
    expect(new Set(fixtures[0]!.orderIds).size).toBe(3); // isolates the collision
  });

  it('order duplicates share order_id but not meta_event_id', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    const f = await seedDuplicateOrders(db, ctx, { copies: 3 });
    expect(f.orderIds).toHaveLength(1);
    expect(f.metaEventIds).toHaveLength(3);
    expect(f.target).toEqual({ table: 'meta_events', column: 'order_id' });
  });

  it('webhookEvent duplicates need no order at all', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    const f = await seedDuplicateWebhookEvents(db, ctx);
    expect(f.orderIds).toEqual([]);
    expect(ctx.orderIds).toEqual([]);
  });

  it('rejects a copy count below 2', async () => {
    await expect(
      seedDuplicatePayments(createFakeDb(), createTestRunContext(RUN), { copies: 1 }),
    ).rejects.toThrow(RangeError);
  });
});

describe("kind 'all'", () => {
  it('seeds every kind and merges ids without duplication', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    const result = await seedDuplicates(db, ctx, 'all');

    expect(result.fixtures.map((f) => f.kind)).toEqual([...DUPLICATE_KINDS]);
    for (const list of [result.orderIds, result.paymentIds, result.metaEventIds]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('creates a duplicate for all four target columns', async () => {
    const { fixtures } = await seedDuplicates(createFakeDb(), createTestRunContext(RUN), 'all');
    expect(fixtures.map((f) => `${f.target.table}.${f.target.column}`)).toEqual([
      'payments.razorpay_payment_id',
      'webhook_events.razorpay_event_id',
      'meta_events.meta_event_id',
      'meta_events.order_id',
    ]);
  });

  it('mergeIds de-duplicates shared orders', () => {
    const merged = mergeIds([
      { orderIds: ['o1', 'o2'], paymentIds: [], webhookEventIds: [], metaEventIds: [] },
      { orderIds: ['o2', 'o3'], paymentIds: [], webhookEventIds: [], metaEventIds: [] },
    ]);
    expect(merged.orderIds).toEqual(['o1', 'o2', 'o3']);
  });
});

describe('cleanup', () => {
  it('removes every row this run created', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'all');

    const before = await countRunRows(db, ctx);
    expect(before.orders).toBeGreaterThan(0);

    const report = await assertCleanupSucceeded(db, ctx);

    expect(report.clean).toBe(true);
    expect(await countRunRows(db, ctx)).toEqual({
      meta_events: 0,
      webhook_events: 0,
      payments: 0,
      entitlements: 0,
      orders: 0,
    });
  });

  it('deletes child tables before orders, respecting ON DELETE RESTRICT', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'all');

    await assertCleanupSucceeded(db, ctx);

    expect(db.deleteOrder).toEqual([...CLEANUP_ORDER]);
    expect(db.deleteOrder.indexOf('orders')).toBe(db.deleteOrder.length - 1);
  });

  it('would fail loudly if the order were wrong', async () => {
    // Proves the fake actually enforces the FK, so the assertion above
    // is meaningful rather than decorative.
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'metaEvent');

    await expect(
      db.query(`DELETE FROM "orders" WHERE id = ANY($1::text[])`, [ctx.orderIds]),
    ).rejects.toThrow(/foreign key constraint/);
  });

  it('touches nothing belonging to another run', async () => {
    const db = createFakeDb();
    const mine = createTestRunContext('mine');
    const theirs = createTestRunContext('theirs');
    await seedDuplicates(db, mine, 'all');
    await seedDuplicates(db, theirs, 'all');

    await assertCleanupSucceeded(db, mine);

    expect(await countRunRows(db, theirs)).toEqual({
      meta_events: theirs.metaEventIds.length,
      webhook_events: theirs.webhookEventIds.length,
      payments: theirs.paymentIds.length,
      // Entitlements are counted by order_id, so the other run's orders
      // are the key — and none of them carry an entitlement here.
      entitlements: 0,
      orders: theirs.orderIds.length,
    });
  });

  it('reports what it deleted and what it expected', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'payment', { copies: 3 });

    const report = await cleanupTestRun(db, ctx);

    expect(report.expected.payments).toBe(3);
    expect(report.deleted.payments).toBe(3);
    expect(report.expected.orders).toBe(3);
    expect(report.leftover).toEqual({
      meta_events: [],
      webhook_events: [],
      payments: [],
      entitlements: [],
      orders: [],
    });
  });

  it('is a safe no-op when nothing was seeded', async () => {
    const db = createFakeDb();
    const report = await assertCleanupSucceeded(db, createTestRunContext(RUN));
    expect(report.clean).toBe(true);
    expect(db.statements).toHaveLength(0); // not even an empty DELETE
  });

  it('running cleanup twice is harmless', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'all');
    await assertCleanupSucceeded(db, ctx);
    const second = await assertCleanupSucceeded(db, ctx);
    expect(second.clean).toBe(true);
  });

  it('fails loudly when verification finds survivors', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'webhookEvent');

    // Simulate a delete that silently does nothing.
    const broken: Queryable = {
      async query(sql: string, params?: readonly unknown[]) {
        if (/^DELETE/i.test(sql.trim())) return { rows: [], rowCount: 0 };
        return db.query(sql, params ?? []);
      },
    };

    await expect(assertCleanupSucceeded(broken, ctx)).rejects.toThrow(/left rows behind/);
  });
});

describe('safety of the generated SQL', () => {
  const collect = async (kind: DuplicateIdentifierKind) => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, kind);
    await cleanupTestRun(db, ctx);
    return db.statements.map((s) => s.sql);
  };

  it('never issues a DELETE without an explicit id list', async () => {
    for (const sql of await collect('all')) {
      if (!/^\s*DELETE/i.test(sql)) continue;
      // `entitlements` is keyed on order_id — the repository mints its
      // ids, so a test cannot register them. Still an explicit list of
      // this run's ids, which is what the rule is actually protecting.
      expect(sql).toMatch(/WHERE (id|order_id) = ANY\(\$1::text\[\]\)/);
    }
  });

  it('never issues TRUNCATE or a bare DELETE FROM', async () => {
    for (const sql of await collect('all')) {
      expect(sql).not.toMatch(/TRUNCATE/i);
      expect(sql).not.toMatch(/DELETE\s+FROM\s+"\w+"\s*(;|$)/i);
    }
  });

  it('never drops or alters an index', async () => {
    for (const sql of await collect('all')) {
      expect(sql).not.toMatch(/DROP\s+INDEX/i);
      expect(sql).not.toMatch(/\bREINDEX\b/i);
      expect(sql).not.toMatch(/ALTER\s+(TABLE|INDEX)/i);
    }
  });

  it('passes ids as parameters rather than interpolating them', async () => {
    const db = createFakeDb();
    const ctx = createTestRunContext(RUN);
    await seedDuplicates(db, ctx, 'all');
    await cleanupTestRun(db, ctx);

    for (const { sql, params } of db.statements) {
      if (!/^\s*DELETE/i.test(sql)) continue;
      expect(Array.isArray(params[0])).toBe(true);
      expect(sql).not.toContain(RUN); // no id baked into the statement text
    }
  });
});
