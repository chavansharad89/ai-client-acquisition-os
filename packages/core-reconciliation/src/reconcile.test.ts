import { describe, expect, it } from 'vitest';

import {
  assertReadOnly,
  createSqlDetectionSource,
  DETECTION_SQL,
  ReconciliationSafetyError,
} from './detection';
import { reconcileIdempotency } from './reconcile';
import { formatReport, isClean, worstOffenders } from './report';
import { ANY_WINDOW, fakeRepository, fakeSource, group, recordingExecutor } from './testSupport';
import { DUPLICATE_DIMENSIONS } from './types';

const NOW = new Date('2026-02-01T09:00:00.000Z');
const at = (ms: number) => new Date(NOW.getTime() + ms);

const payRows = [
  { id: 'p1', razorpay_payment_id: 'pay_dup', amount_paise: 49900 },
  { id: 'p2', razorpay_payment_id: 'pay_dup', amount_paise: 49900 },
];

// ------------------------------------------------------------- clean ----

describe('clean database', () => {
  it('scans every dimension, writes nothing, and reports clean', async () => {
    const source = fakeSource([]);
    const repo = fakeRepository();

    const report = await reconcileIdempotency({ source, repository: repo, window: ANY_WINDOW, now: () => NOW });

    expect(report.groups).toEqual([]);
    expect(repo.upserts).toBe(0);
    expect(repo.cases.size).toBe(0);
    expect(source.calls).toEqual([...DUPLICATE_DIMENSIONS]);
    expect(isClean(report)).toBe(true);
    expect(report.affectedRecordCount).toBe(0);
    expect(report.byRecordType).toEqual({ ORDER: 0, PAYMENT: 0, WEBHOOK_EVENT: 0, META_EVENT: 0 });
  });

  it('says so in the formatted report', async () => {
    const report = await reconcileIdempotency({
      source: fakeSource([]),
      repository: fakeRepository(),
      window: ANY_WINDOW,
      now: () => NOW,
    });
    expect(formatReport(report)).toContain('no duplicates found');
  });
});

// ----------------------------------------------------- one duplicate ----

describe('one duplicate group', () => {
  it('opens exactly one case with the full snapshot', async () => {
    const repo = fakeRepository();
    const report = await reconcileIdempotency({
      source: fakeSource([group('payment.razorpayPaymentId', 'pay_dup', payRows)]),
      repository: repo, window: ANY_WINDOW,
      now: () => NOW,
    });

    expect(report.created).toBe(1);
    expect(report.updated).toBe(0);
    expect(repo.cases.size).toBe(1);

    const stored = repo.cases.get('PAYMENT|payment.razorpayPaymentId=pay_dup');
    expect(stored).toBeDefined();
    expect(stored).toMatchObject({
      recordType: 'PAYMENT',
      duplicateKey: 'payment.razorpayPaymentId=pay_dup',
      recordCount: 2,
      status: 'OPEN',
    });
    expect(stored!.snapshot).toMatchObject({
      dimension: 'payment.razorpayPaymentId',
      rawKey: 'pay_dup',
      recordCount: 2,
      detectedAt: NOW.toISOString(),
    });
    // The snapshot is complete: both rows, verbatim.
    expect(stored!.snapshot.rows).toEqual(payRows);
  });

  it('counts rows, not groups, as the affected total', async () => {
    const report = await reconcileIdempotency({
      source: fakeSource([
        group('payment.razorpayPaymentId', 'pay_dup', [payRows[0], payRows[1], payRows[0]]),
      ]),
      repository: fakeRepository(),
      window: ANY_WINDOW,
      now: () => NOW,
    });
    expect(report.groups).toHaveLength(1);
    expect(report.affectedRecordCount).toBe(3);
  });
});

// ------------------------------------------------ multiple duplicates ----

describe('multiple duplicate groups', () => {
  it('opens one case per group and keeps them distinct', async () => {
    const repo = fakeRepository();
    const report = await reconcileIdempotency({
      source: fakeSource([
        group('payment.razorpayPaymentId', 'pay_a', [{ id: 'p1' }, { id: 'p2' }]),
        group('payment.razorpayPaymentId', 'pay_b', [{ id: 'p3' }, { id: 'p4' }, { id: 'p5' }]),
        group('webhookEvent.razorpayEventId', 'evt_a', [{ id: 'w1' }, { id: 'w2' }]),
      ]),
      repository: repo,
      window: ANY_WINDOW,
      now: () => NOW,
    });

    expect(report.created).toBe(3);
    expect(repo.cases.size).toBe(3);
    expect(report.affectedRecordCount).toBe(7);
    expect(report.byRecordType).toMatchObject({ PAYMENT: 2, WEBHOOK_EVENT: 1 });
  });

  it('ranks the worst offenders first', async () => {
    const report = await reconcileIdempotency({
      source: fakeSource([
        group('payment.razorpayPaymentId', 'small', [{}, {}]),
        group('payment.razorpayPaymentId', 'big', [{}, {}, {}, {}]),
        group('payment.razorpayPaymentId', 'mid', [{}, {}, {}]),
      ]),
      repository: fakeRepository(),
      window: ANY_WINDOW,
      now: () => NOW,
    });
    expect(worstOffenders(report).map((g) => g.rawKey)).toEqual(['big', 'mid']);
  });

  it('lists every case in the formatted report', async () => {
    const report = await reconcileIdempotency({
      source: fakeSource([
        group('payment.razorpayPaymentId', 'pay_a', [{}, {}]),
        group('metaEvent.orderId', 'order_x', [{}, {}]),
      ]),
      repository: fakeRepository(),
      window: ANY_WINDOW,
      now: () => NOW,
    });
    const text = formatReport(report);
    expect(text).toContain('2 duplicate group(s) across 4 rows');
    expect(text).toContain('payment.razorpayPaymentId=pay_a');
    expect(text).toContain('metaEvent.orderId=order_x');
    expect(text).toContain('2 case(s) opened');
  });
});

// -------------------------------------------------- all four types ----

describe('all four duplicate types', () => {
  const all = [
    group('payment.razorpayPaymentId', 'pay_1', [{ id: 'p1' }, { id: 'p2' }]),
    group('webhookEvent.razorpayEventId', 'evt_1', [{ id: 'w1' }, { id: 'w2' }]),
    group('metaEvent.orderId', 'order_1', [{ id: 'm1' }, { id: 'm2' }]),
    group('metaEvent.metaEventId', 'purchase_1', [{ id: 'm3' }, { id: 'm4' }]),
  ];

  it('detects all four and maps each to the right record type', async () => {
    const repo = fakeRepository();
    const report = await reconcileIdempotency({
      source: fakeSource(all),
      repository: repo, window: ANY_WINDOW,
      now: () => NOW,
    });

    expect(report.groups).toHaveLength(4);
    expect(repo.cases.size).toBe(4);
    expect(report.byRecordType).toEqual({
      ORDER: 0,
      PAYMENT: 1,
      WEBHOOK_EVENT: 1,
      META_EVENT: 2, // orderId + metaEventId both live under META_EVENT
    });
  });

  it('keeps the two META_EVENT dimensions as separate cases', async () => {
    // This is the reason duplicate keys are qualified: both rows share
    // record_type = META_EVENT, so a bare key would collide under
    // @@unique([recordType, duplicateKey]) and one case would overwrite
    // the other.
    const repo = fakeRepository();
    await reconcileIdempotency({ source: fakeSource(all), repository: repo, window: ANY_WINDOW, now: () => NOW });

    expect([...repo.cases.keys()].filter((k) => k.startsWith('META_EVENT|'))).toEqual([
      'META_EVENT|metaEvent.orderId=order_1',
      'META_EVENT|metaEvent.metaEventId=purchase_1',
    ]);
  });

  it('still separates them when the two dimensions share a key value', async () => {
    const repo = fakeRepository();
    await reconcileIdempotency({
      source: fakeSource([
        group('metaEvent.orderId', 'collide', [{ id: 'a' }, { id: 'b' }]),
        group('metaEvent.metaEventId', 'collide', [{ id: 'c' }, { id: 'd' }]),
      ]),
      repository: repo,
      window: ANY_WINDOW,
      now: () => NOW,
    });
    expect(repo.cases.size).toBe(2);
  });

  it('records each dimension in its snapshot', async () => {
    const repo = fakeRepository();
    await reconcileIdempotency({ source: fakeSource(all), repository: repo, window: ANY_WINDOW, now: () => NOW });
    const dims = [...repo.cases.values()].map((c) => c.snapshot.dimension);
    expect(new Set(dims)).toEqual(new Set(DUPLICATE_DIMENSIONS));
  });
});

// ------------------------------------------- repeated reconciliation ----

describe('repeated reconciliation', () => {
  it('creates on the first run and updates on the second — never a second row', async () => {
    const repo = fakeRepository();
    const source = fakeSource([group('payment.razorpayPaymentId', 'pay_dup', payRows)]);

    const first = await reconcileIdempotency({ source, repository: repo, window: ANY_WINDOW, now: () => NOW });
    const second = await reconcileIdempotency({
      source,
      repository: repo, window: ANY_WINDOW,
      now: () => at(60_000),
    });

    expect(first.created).toBe(1);
    expect(first.updated).toBe(0);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(1);
    expect(repo.cases.size).toBe(1);
  });

  it('refreshes the count and snapshot when the group grows', async () => {
    const repo = fakeRepository();
    await reconcileIdempotency({
      source: fakeSource([group('payment.razorpayPaymentId', 'pay_dup', payRows)]),
      repository: repo, window: ANY_WINDOW,
      now: () => NOW,
    });
    await reconcileIdempotency({
      source: fakeSource([
        group('payment.razorpayPaymentId', 'pay_dup', [...payRows, { id: 'p3' }]),
      ]),
      repository: repo,
      window: ANY_WINDOW,
      now: () => at(60_000),
    });

    const stored = repo.cases.get('PAYMENT|payment.razorpayPaymentId=pay_dup')!;
    expect(stored.recordCount).toBe(3);
    expect(stored.snapshot.rows).toHaveLength(3);
    expect(stored.updatedAt).toEqual(at(60_000));
  });

  it('does not drag a triaged case back to OPEN', async () => {
    const repo = fakeRepository();
    const source = fakeSource([group('payment.razorpayPaymentId', 'pay_dup', payRows)]);
    await reconcileIdempotency({ source, repository: repo, window: ANY_WINDOW, now: () => NOW });

    // A human picks it up.
    const key = 'PAYMENT|payment.razorpayPaymentId=pay_dup';
    repo.cases.set(key, { ...repo.cases.get(key)!, status: 'IN_REVIEW' });

    await reconcileIdempotency({ source, repository: repo, window: ANY_WINDOW, now: () => at(60_000) });

    expect(repo.cases.get(key)!.status).toBe('IN_REVIEW');
  });

  it('is stable across many runs', async () => {
    const repo = fakeRepository();
    const source = fakeSource([
      group('payment.razorpayPaymentId', 'pay_dup', payRows),
      group('metaEvent.orderId', 'order_1', [{}, {}]),
    ]);
    for (let i = 0; i < 5; i += 1) {
      await reconcileIdempotency({ source, repository: repo, window: ANY_WINDOW, now: () => at(i * 1000) });
    }
    expect(repo.cases.size).toBe(2);
    expect(repo.upserts).toBe(10);
  });

  it('leaves an old case in place when the duplicate is gone from a later run', async () => {
    const repo = fakeRepository();
    await reconcileIdempotency({
      source: fakeSource([group('payment.razorpayPaymentId', 'pay_dup', payRows)]),
      repository: repo, window: ANY_WINDOW,
      now: () => NOW,
    });
    const clean = await reconcileIdempotency({
      source: fakeSource([]),
      repository: repo, window: ANY_WINDOW,
      now: () => at(60_000),
    });

    // Detection never deletes: the audit trail outlives the condition.
    expect(clean.groups).toEqual([]);
    expect(repo.cases.size).toBe(1);
  });
});

// -------------------------------------------------------- read-only ----

describe('read-only guarantee against business tables', () => {
  it('every detection statement is read-only, and selects no payload', () => {
    for (const [dimension, sql] of Object.entries(DETECTION_SQL)) {
      // A read-only CTE, not a bare SELECT: the window function that
      // keeps record_count exact while sampling rows requires one.
      expect(/^(select|with)\b/i.test(sql.trim()), dimension).toBe(true);
      expect(() => assertReadOnly(sql)).not.toThrow();
      // The PII fix, asserted on the SQL itself rather than on a result:
      // the column is never named, so it can never be fetched.
      expect(sql, dimension).not.toMatch(/\bpayload\b/);
      // The base table is projected column by column, never `t.*`, so
      // to_jsonb() downstream can only ever see the allowlist above —
      // adding a PII column to a business table cannot widen this.
      expect(sql, dimension).not.toMatch(/\bt\.\*/);
    }
  });

  it('every detection statement is bounded by a window and two limits', () => {
    for (const [dimension, sql] of Object.entries(DETECTION_SQL)) {
      expect(sql, dimension).toContain('created_at >= $1');
      expect(sql, dimension).toContain('created_at <  $2');
      expect(sql, dimension).toContain('sample_rank <= $3');
      expect(sql, dimension).toContain('LIMIT $4');
    }
  });

  it.each([
    'DELETE FROM payments',
    'UPDATE payments SET status = $1',
    'INSERT INTO payments VALUES ($1)',
    'TRUNCATE payments',
    'DROP TABLE payments',
    'SELECT 1; DELETE FROM payments',
    'WITH x AS (DELETE FROM payments RETURNING *) SELECT * FROM x',
  ])('refuses to run %s', (sql) => {
    expect(() => assertReadOnly(sql)).toThrow(ReconciliationSafetyError);
  });

  it('issues nothing but SELECT when scanning a real executor', async () => {
    const exec = recordingExecutor();
    const source = createSqlDetectionSource(exec);
    await reconcileIdempotency({ source, repository: fakeRepository(), window: ANY_WINDOW, now: () => NOW });

    expect(exec.statements).toHaveLength(DUPLICATE_DIMENSIONS.length);
    for (const sql of exec.statements) {
      // Now a read-only CTE rather than a bare SELECT: the window
      // function that keeps `record_count` exact while sampling rows
      // needs one. Still read-only, and assertReadOnly enforces that.
      expect(/^(select|with)\b/i.test(sql.trim())).toBe(true);
      expect(/\b(insert|update|delete|drop|truncate|alter)\b/i.test(sql)).toBe(false);
    }
  });

  it('touches each business table exactly as many times as it has dimensions', async () => {
    const exec = recordingExecutor();
    await reconcileIdempotency({
      source: createSqlDetectionSource(exec),
      repository: fakeRepository(),
      window: ANY_WINDOW,
      now: () => NOW,
    });
    const tables = exec.statements.map((s) => /from\s+(\w+)/i.exec(s)?.[1]);
    expect(tables).toEqual(['payments', 'webhook_events', 'meta_events', 'meta_events']);
  });

  it('maps real SQL rows into groups without losing any row data', async () => {
    const exec = recordingExecutor({
      payments: [{ duplicate_key: 'pay_dup', record_count: 2, rows: payRows }],
    });
    const source = createSqlDetectionSource(exec);
    const groups = await source('payment.razorpayPaymentId', ANY_WINDOW);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      recordType: 'PAYMENT',
      rawKey: 'pay_dup',
      duplicateKey: 'payment.razorpayPaymentId=pay_dup',
      recordCount: 2,
    });
    expect(groups[0]!.rows).toEqual(payRows);
  });

  it('ignores a NULL grouping key rather than opening a junk case', async () => {
    const exec = recordingExecutor({
      payments: [{ duplicate_key: null, record_count: 5, rows: [] }],
    });
    expect(await createSqlDetectionSource(exec)('payment.razorpayPaymentId', ANY_WINDOW)).toEqual(
      [],
    );
  });
});
