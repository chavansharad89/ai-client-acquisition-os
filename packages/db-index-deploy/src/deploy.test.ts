import { describe, expect, it } from 'vitest';

import { deployConcurrentIndexes } from './deploy';
import { duplicatePreflight } from './preflight';
import { createIndexSql, duplicatePreflightSql, INSPECT_INDEX_SQL } from './sql';
import { createFakeDb, validIndex } from './testSupport';
import {
  assertTargetIsSafe,
  INDEX_TARGETS,
  MIGRATION_NAME,
  quoteIdentifier,
  UnsafeIdentifierError,
  type IndexTarget,
} from './targets';
import { verifyIndex } from './verify';

const NOW = new Date('2026-03-01T00:00:00.000Z');
const only = (name: string): IndexTarget[] => INDEX_TARGETS.filter((t) => t.indexName === name);
const ORDER_IDX = 'meta_events_order_id_key';
const orderTarget = only(ORDER_IDX);

const deps = (session: ReturnType<typeof createFakeDb>, over = {}) => ({
  session,
  now: () => NOW,
  ...over,
});

describe('SQL construction', () => {
  it('emits CONCURRENTLY and never wraps it in a transaction', () => {
    const sql = createIndexSql(orderTarget[0]!);
    expect(sql).toBe(
      'CREATE UNIQUE INDEX CONCURRENTLY "meta_events_order_id_key" ' +
        'ON "public"."meta_events" ("order_id")',
    );
    expect(sql).not.toMatch(/BEGIN|COMMIT|START TRANSACTION/i);
  });

  it('qualifies the TABLE so search_path cannot decide where the index lands', () => {
    // An unqualified `ON meta_events` resolves through search_path.
    // Qualifying the table pins the destination — and since an index
    // always lands in its table's schema, that is sufficient.
    const sql = createIndexSql(orderTarget[0]!, 'reporting');
    expect(sql).toContain('ON "reporting"."meta_events"');
  });

  it('does NOT qualify the index name — PostgreSQL rejects that', () => {
    // CREATE INDEX "s"."name" is a syntax error; the real database said
    // so before this comment existed.
    expect(createIndexSql(orderTarget[0]!, 'reporting')).toContain(
      'CONCURRENTLY "meta_events_order_id_key" ON',
    );
  });

  it('refuses an unsafe schema name rather than quoting and hoping', () => {
    for (const bad of ['public"; DROP SCHEMA public CASCADE --', 'has space', '1leading', '']) {
      expect(() => createIndexSql(orderTarget[0]!, bad), bad).toThrow();
    }
  });

  it('qualifies the preflight table too', () => {
    expect(duplicatePreflightSql(orderTarget[0]!, 20, 'reporting')).toContain(
      'FROM "reporting"."meta_events"',
    );
  });

  it('omits IF NOT EXISTS so an INVALID index cannot be silently accepted', () => {
    expect(createIndexSql(orderTarget[0]!)).not.toMatch(/IF NOT EXISTS/i);
  });

  it('quotes identifiers and rejects unsafe ones', () => {
    expect(quoteIdentifier('meta_events')).toBe('"meta_events"');
    expect(() => quoteIdentifier('meta_events"; DROP TABLE payments; --')).toThrow(
      UnsafeIdentifierError,
    );
    expect(() => quoteIdentifier('Payments')).toThrow(UnsafeIdentifierError);
  });

  it('refuses to build SQL for a target with an injected identifier', () => {
    const evil: IndexTarget = {
      migrationName: MIGRATION_NAME,
      indexName: 'x',
      table: 'payments"; DROP TABLE orders; --',
      columns: ['id'],
      rationale: 'test',
    };
    expect(() => createIndexSql(evil)).toThrow(UnsafeIdentifierError);
    expect(() => duplicatePreflightSql(evil)).toThrow(UnsafeIdentifierError);
    expect(() => assertTargetIsSafe(evil)).toThrow(UnsafeIdentifierError);
  });

  it('inspects pg_index for validity, readiness and uniqueness', () => {
    for (const flag of ['indisvalid', 'indisready', 'indislive', 'indisunique']) {
      expect(INSPECT_INDEX_SQL).toContain(flag);
    }
  });

  it('skips NULL columns in preflight, since NULLs never collide', () => {
    expect(duplicatePreflightSql(orderTarget[0]!)).toContain('"order_id" IS NOT NULL');
  });
});

describe('advisory locking', () => {
  it('takes the lock, then releases it', async () => {
    const db = createFakeDb();
    await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    expect(db.locks).toEqual([MIGRATION_NAME]);
    expect(db.unlocks).toEqual([MIGRATION_NAME]);
  });

  it('exits without touching anything when another deployment holds the lock', async () => {
    const db = createFakeDb({ lockAvailable: false });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.lockAcquired).toBe(false);
    expect(result.results).toEqual([]);
    expect(db.statements.filter((s) => s.startsWith('CREATE'))).toEqual([]);
    expect(result.operatorActions[0]).toContain('advisory lock');
  });

  it('releases the lock even when a target throws', async () => {
    const db = createFakeDb();
    const exploding = {
      ...db,
      query: async (sql: string, p?: readonly unknown[]) => {
        if (sql.includes('FROM pg_index')) throw new Error('catalog unavailable');
        return db.query(sql, p);
      },
    };
    await expect(
      deployConcurrentIndexes(deps(exploding as never, { targets: orderTarget })),
    ).rejects.toThrow('catalog unavailable');
    expect(db.unlocks).toEqual([MIGRATION_NAME]);
  });
});

describe('duplicate preflight', () => {
  it('refuses to build and records FAILED when duplicates exist', async () => {
    const db = createFakeDb({
      duplicates: { meta_events: { rows: [{ order_id: 'order_1', record_count: 2 }] } },
    });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('blocked-duplicates');
    expect(db.statements.filter((s) => s.startsWith('CREATE'))).toEqual([]);
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('FAILED');
    expect(result.allValid).toBe(false);
    expect(result.operatorActions.join()).toContain('resolve duplicates');
  });

  it('reports the offending values and row totals', async () => {
    const db = createFakeDb({
      duplicates: {
        meta_events: {
          rows: [
            { order_id: 'order_1', record_count: 3 },
            { order_id: 'order_2', record_count: 2 },
          ],
        },
      },
    });
    const result = await duplicatePreflight(db, orderTarget[0]!);
    expect(result.clean).toBe(false);
    expect(result.totalOffendingRows).toBe(5);
    expect(result.duplicates[0]!.values).toEqual({ order_id: 'order_1' });
  });

  it('builds the index when preflight is clean', async () => {
    const db = createFakeDb();
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    expect(result.results[0]!.outcome).toBe('created');
    expect(db.indexes.get(ORDER_IDX)).toMatchObject({ isUnique: true, isValid: true });
  });
});

describe('index existence and rerun safety', () => {
  it('treats an already-valid index as done without rebuilding it', async () => {
    const db = createFakeDb({ indexes: { [ORDER_IDX]: validIndex('meta_events', 'order_id') } });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('already-valid');
    expect(db.statements.filter((s) => s.startsWith('CREATE'))).toEqual([]);
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('COMPLETED');
  });

  it('is a no-op on the second run', async () => {
    const db = createFakeDb();
    await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    const creates = db.statements.filter((s) => s.startsWith('CREATE')).length;

    await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    expect(db.statements.filter((s) => s.startsWith('CREATE'))).toHaveLength(creates);
  });

  it('skips the three indexes 0001_init already created, and builds only the new one', async () => {
    const db = createFakeDb({
      indexes: {
        payments_razorpay_payment_id_key: validIndex('payments', 'razorpay_payment_id'),
        webhook_events_razorpay_event_id_key: validIndex('webhook_events', 'razorpay_event_id'),
        meta_events_meta_event_id_key: validIndex('meta_events', 'meta_event_id'),
      },
    });

    const result = await deployConcurrentIndexes(deps(db));

    expect(result.results.map((r) => r.outcome)).toEqual([
      'already-valid',
      'already-valid',
      'created',
      'already-valid',
    ]);
    expect(result.allValid).toBe(true);
  });
});

describe('invalid-index detection', () => {
  const invalid = {
    [ORDER_IDX]: { table: 'meta_events', columns: ['order_id'], isUnique: true, isValid: false },
  };

  it('detects an INVALID index and refuses to proceed', async () => {
    const db = createFakeDb({ indexes: invalid });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('blocked-invalid');
    expect(result.results[0]!.verdict.state).toBe('invalid');
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('FAILED');
  });

  it('NEVER drops the suspicious index automatically', async () => {
    const db = createFakeDb({ indexes: invalid });
    await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(db.statements.some((s) => /DROP/i.test(s))).toBe(false);
    expect(db.indexes.has(ORDER_IDX)).toBe(true); // still there, untouched
  });

  it('tells the operator exactly what to run, without running it', async () => {
    const db = createFakeDb({ indexes: invalid });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    const action = result.operatorActions.join('\n');
    expect(action).toContain('DROP INDEX CONCURRENTLY');
    expect(action).toContain('will not drop it for you');
  });

  it('detects indisvalid=false even when the index is READY — the real failed-CIC shape', async () => {
    // A failed CREATE INDEX CONCURRENTLY leaves indisvalid = false with
    // indisready = true. This must be caught by the validity check itself,
    // not incidentally by the readiness check.
    const db = createFakeDb({
      indexes: {
        [ORDER_IDX]: {
          table: 'meta_events',
          columns: ['order_id'],
          isUnique: true,
          isValid: false,
          isReady: true,
          isLive: true,
        },
      },
    });
    const verdict = await verifyIndex(db, orderTarget[0]!);
    expect(verdict.state).toBe('invalid');
    expect(verdict.state === 'invalid' && verdict.reason).toContain('INVALID');

    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    expect(result.results[0]!.outcome).toBe('blocked-invalid');
    expect(db.statements.some((s) => /DROP/i.test(s))).toBe(false);
  });

  it('flags a not-ready index as invalid too', async () => {
    const db = createFakeDb({
      indexes: {
        [ORDER_IDX]: {
          table: 'meta_events',
          columns: ['order_id'],
          isUnique: true,
          isValid: true,
          isReady: false,
        },
      },
    });
    expect((await verifyIndex(db, orderTarget[0]!)).state).toBe('invalid');
  });
});

describe('pg_index verification', () => {
  it('rejects an index of the right name on the wrong table', async () => {
    const db = createFakeDb({ indexes: { [ORDER_IDX]: validIndex('payments', 'order_id') } });
    const verdict = await verifyIndex(db, orderTarget[0]!);
    expect(verdict).toMatchObject({ state: 'mismatched' });
  });

  it('rejects an index covering the wrong columns', async () => {
    const db = createFakeDb({
      indexes: { [ORDER_IDX]: validIndex('meta_events', 'order_id', 'event_name') },
    });
    expect((await verifyIndex(db, orderTarget[0]!)).state).toBe('mismatched');
  });

  it('rejects a non-unique index wearing the name', async () => {
    const db = createFakeDb({
      indexes: {
        [ORDER_IDX]: {
          table: 'meta_events',
          columns: ['order_id'],
          isUnique: false,
          isValid: true,
        },
      },
    });
    expect((await verifyIndex(db, orderTarget[0]!)).state).toBe('mismatched');
  });

  it('never modifies a mismatched index', async () => {
    const db = createFakeDb({ indexes: { [ORDER_IDX]: validIndex('payments', 'order_id') } });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    expect(result.results[0]!.outcome).toBe('blocked-mismatch');
    expect(db.statements.some((s) => /DROP|ALTER/i.test(s))).toBe(false);
  });

  it('verifies after building rather than trusting the build', async () => {
    const db = createFakeDb();
    await deployConcurrentIndexes(deps(db, { targets: orderTarget }));
    const inspects = db.statements.filter((s) => s.includes('FROM pg_index'));
    expect(inspects.length).toBeGreaterThanOrEqual(3); // pre-check, post-build, final
  });
});

describe('crash recovery', () => {
  it('recovers a RUNNING row whose index actually completed', async () => {
    const db = createFakeDb({ indexes: { [ORDER_IDX]: validIndex('meta_events', 'order_id') } });
    db.setState(MIGRATION_NAME, ORDER_IDX, 'RUNNING');

    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('already-valid');
    expect(result.results[0]!.recovered).toContain('after the index became valid');
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('COMPLETED');
  });

  it('retries a RUNNING row whose index never appeared', async () => {
    const db = createFakeDb();
    db.setState(MIGRATION_NAME, ORDER_IDX, 'RUNNING');

    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.recovered).toContain('before the index existed');
    expect(result.results[0]!.outcome).toBe('created');
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('COMPLETED');
  });

  it('stops at a RUNNING row that left an INVALID index behind', async () => {
    const db = createFakeDb({
      indexes: {
        [ORDER_IDX]: {
          table: 'meta_events',
          columns: ['order_id'],
          isUnique: true,
          isValid: false,
        },
      },
    });
    db.setState(MIGRATION_NAME, ORDER_IDX, 'RUNNING');

    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('blocked-invalid');
    expect(result.results[0]!.recovered).toContain('operator action required');
    expect(db.statements.some((s) => /DROP/i.test(s))).toBe(false);
  });

  it('re-runs cleanly after a FAILED row once the cause is fixed', async () => {
    const withDupes = createFakeDb({
      duplicates: { meta_events: { rows: [{ order_id: 'o1', record_count: 2 }] } },
    });
    await deployConcurrentIndexes(deps(withDupes, { targets: orderTarget }));
    expect(withDupes.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('FAILED');

    // Operator removes the duplicates; same state table, clean data.
    const fixed = createFakeDb();
    fixed.setState(MIGRATION_NAME, ORDER_IDX, 'FAILED');
    const result = await deployConcurrentIndexes(deps(fixed, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('created');
    expect(fixed.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('COMPLETED');
  });
});

describe('build failure', () => {
  it('marks FAILED and leaves the INVALID index for a human', async () => {
    const db = createFakeDb({
      failCreate: { message: 'deadlock detected', leavesInvalidIndex: true },
    });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('failed');
    expect(result.results[0]!.error).toContain('deadlock detected');
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('FAILED');
    expect(db.indexes.get(ORDER_IDX)!.isValid).toBe(false);
    expect(db.statements.some((s) => /DROP/i.test(s))).toBe(false);
  });

  it('does not stop later targets from being attempted', async () => {
    const db = createFakeDb({
      duplicates: { meta_events: { rows: [{ order_id: 'o1', record_count: 2 }] } },
    });
    const result = await deployConcurrentIndexes(deps(db));

    const byName = new Map(result.results.map((r) => [r.target.indexName, r.outcome]));
    expect(byName.get('payments_razorpay_payment_id_key')).toBe('created');
    expect(byName.get(ORDER_IDX)).toBe('blocked-duplicates');
    expect(result.allValid).toBe(false);
  });
});

describe('final verification and Prisma reconciliation', () => {
  it('re-verifies every target and reports allValid', async () => {
    const db = createFakeDb();
    const result = await deployConcurrentIndexes(deps(db));
    expect(result.finalVerification).toHaveLength(INDEX_TARGETS.length);
    expect(result.finalVerification.every((v) => v.verdict.state === 'valid')).toBe(true);
    expect(result.allValid).toBe(true);
  });

  it('emits the migrate resolve command only when everything is valid', async () => {
    const clean = await deployConcurrentIndexes(deps(createFakeDb()));
    expect(clean.operatorActions.join()).toContain(
      `prisma migrate resolve --applied ${MIGRATION_NAME}`,
    );

    const dirty = await deployConcurrentIndexes(
      deps(
        createFakeDb({
          duplicates: { meta_events: { rows: [{ order_id: 'o1', record_count: 2 }] } },
        }),
      ),
    );
    expect(dirty.operatorActions.join()).not.toContain('migrate resolve');
  });

  it('does not trust a CREATE that reported success but left an INVALID index', async () => {
    // Post-build verification is the only thing standing between a silent
    // failure and a deployment that claims success.
    const db = createFakeDb({ createLandsInvalid: true });
    const result = await deployConcurrentIndexes(deps(db, { targets: orderTarget }));

    expect(result.results[0]!.outcome).toBe('failed');
    expect(result.results[0]!.error).toContain('build reported success');
    expect(db.state.get(`${MIGRATION_NAME}|${ORDER_IDX}`)!.status).toBe('FAILED');
    expect(result.allValid).toBe(false);
    expect(db.statements.some((s) => /DROP/i.test(s))).toBe(false);
  });

  it('dry run verifies and reports without issuing CREATE', async () => {
    const db = createFakeDb();
    const result = await deployConcurrentIndexes(deps(db, { dryRun: true }));
    expect(db.statements.filter((s) => s.startsWith('CREATE'))).toEqual([]);
    expect(result.allValid).toBe(false); // nothing was actually built
  });
});
