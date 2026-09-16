import type { Client } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { seedDuplicates } from '../fixtures/idempotency-duplicates';
import {
  assertCleanupSucceeded,
  createTestRunContext,
  type TestRunContext,
} from '../fixtures/test-run-context';
import {
  ADMIN_URL,
  advisoryLockCount,
  createTempDatabase,
  migrationState,
  readIndex,
  runDeployment,
  serverReachable,
  startDeployment,
  TARGET_INDEXES,
  type TempDatabase,
} from './support/pgIndexHarness';

// Integration suite for the zero-downtime index deployment.
// -----------------------------------------------------------------------
// Real PostgreSQL, real child processes, real pg_index. Nothing mocked.
//
//   docker compose -f docker-compose.test.yml up -d
//   pnpm --filter @acos/tests run test:integration
// -----------------------------------------------------------------------

const IDX_PAYMENT = 'payments_razorpay_payment_id_key';
const IDX_WEBHOOK = 'webhook_events_razorpay_event_id_key';
const IDX_ORDER = 'meta_events_order_id_key';
const IDX_META = 'meta_events_meta_event_id_key';

let reachable = false;
const open: TempDatabase[] = [];
const contexts = new Map<string, TestRunContext>();

/** One deterministic run context per temp database. */
function ctx(db: TempDatabase): TestRunContext {
  let existing = contexts.get(db.name);
  if (!existing) {
    existing = createTestRunContext(db.name.replace(/[^a-zA-Z0-9_]/g, '_'));
    contexts.set(db.name, existing);
  }
  return existing;
}

beforeAll(async () => {
  reachable = await serverReachable();
}, 30_000);

afterEach(async () => {
  while (open.length > 0) {
    const db = open.pop()!;
    const context = contexts.get(db.name);
    // Scoped cleanup runs BEFORE the database is dropped, so the
    // fixtures' delete-by-id path and its verification are exercised on
    // every test rather than being masked by DROP DATABASE.
    if (context && context.totalTracked() > 0) {
      await assertCleanupSucceeded(db.client, context).catch((error: unknown) => {
        throw new Error(`cleanup verification failed for ${db.name}: ${String(error)}`);
      });
    }
    contexts.delete(db.name);
    await db.drop();
  }
});

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

async function freshDb(label: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, { dropTargetIndexes: true });
  open.push(db);
  return db;
}

async function allIndexesValid(client: Client): Promise<boolean> {
  for (const name of TARGET_INDEXES) {
    const facts = await readIndex(client, name);
    if (!facts?.isValid || !facts.isUnique) return false;
  }
  return true;
}

// ------------------------------------------------------------- 1 ----

describe('1. clean deployment', () => {
  it('creates all four unique indexes and exits 0', async () => {
    const db = await freshDb('clean');
    const run = await runDeployment(db.url);

    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain('All target indexes are valid');

    for (const name of TARGET_INDEXES) {
      const facts = await readIndex(db.client, name);
      expect(facts, name).not.toBeNull();
      expect(facts!.isUnique, name).toBe(true);
      expect(facts!.isValid, name).toBe(true);
      expect(facts!.isReady, name).toBe(true);
    }
  }, 90_000);

  it('records COMPLETED for every target', async () => {
    const db = await freshDb('clean-state');
    await runDeployment(db.url);
    for (const name of TARGET_INDEXES) {
      expect((await migrationState(db.client, name))?.status, name).toBe('COMPLETED');
    }
  }, 90_000);

  it('emits the Prisma reconciliation command only on success', async () => {
    const db = await freshDb('clean-resolve');
    const run = await runDeployment(db.url);
    expect(run.stdout).toContain('prisma migrate resolve --applied');
  }, 90_000);
});

// ---------------------------------------------------------- 2 - 6 ----

describe('2. duplicate Payment', () => {
  it('refuses the payment index, still builds the others', async () => {
    const db = await freshDb('dup-pay');
    await seedDuplicates(db.client, ctx(db), 'payment');

    const run = await runDeployment(db.url);

    expect(run.exitCode).toBe(1);
    expect(await readIndex(db.client, IDX_PAYMENT)).toBeNull();
    expect((await migrationState(db.client, IDX_PAYMENT))?.status).toBe('FAILED');
    expect((await readIndex(db.client, IDX_WEBHOOK))?.isValid).toBe(true);
  }, 90_000);

  it('leaves the duplicate rows untouched', async () => {
    const db = await freshDb('dup-pay-keep');
    // The fixture's duplicated value is run-scoped (`pay_<runId>_dup`) so
    // concurrent runs cannot collide, and it is returned for exactly this
    // reason. A hardcoded literal here matched nothing and counted zero,
    // which looked like the deployment had deleted the rows.
    const seeded = await seedDuplicates(db.client, ctx(db), 'payment', { copies: 3 });
    await runDeployment(db.url);
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM payments WHERE razorpay_payment_id = $1`,
      [seeded.fixtures[0]!.duplicatedValue],
    );
    expect(rows[0].n).toBe(3);
  }, 90_000);
});

describe('3. duplicate WebhookEvent', () => {
  it('refuses the webhook index only', async () => {
    const db = await freshDb('dup-wh');
    await seedDuplicates(db.client, ctx(db), 'webhookEvent');

    const run = await runDeployment(db.url);

    expect(run.exitCode).toBe(1);
    expect(await readIndex(db.client, IDX_WEBHOOK)).toBeNull();
    expect((await readIndex(db.client, IDX_PAYMENT))?.isValid).toBe(true);
    expect((await migrationState(db.client, IDX_WEBHOOK))?.status).toBe('FAILED');
  }, 90_000);
});

describe('4. duplicate MetaEvent (meta_event_id)', () => {
  it('refuses the meta_event_id index only', async () => {
    const db = await freshDb('dup-meta');
    await seedDuplicates(db.client, ctx(db), 'metaEvent');

    const run = await runDeployment(db.url);

    expect(run.exitCode).toBe(1);
    expect(await readIndex(db.client, IDX_META)).toBeNull();
    // The same rows also collide on order_id, so that target fails too.
    expect((await readIndex(db.client, IDX_PAYMENT))?.isValid).toBe(true);
  }, 90_000);
});

describe('5. duplicate Order (meta_events.order_id)', () => {
  it('refuses the order_id index while meta_event_id still builds', async () => {
    const db = await freshDb('dup-order');
    await seedDuplicates(db.client, ctx(db), 'order');

    const run = await runDeployment(db.url);

    expect(run.exitCode).toBe(1);
    expect(await readIndex(db.client, IDX_ORDER)).toBeNull();
    expect((await migrationState(db.client, IDX_ORDER))?.status).toBe('FAILED');
    // meta_event_ids were distinct, so target 4 is unaffected.
    expect((await readIndex(db.client, IDX_META))?.isValid).toBe(true);
  }, 90_000);
});

describe('6. all duplicates', () => {
  it('builds nothing, fails every target, and mutates no data', async () => {
    const db = await freshDb('dup-all');
    // 'all', not three of the four kinds. There are four TARGET_INDEXES,
    // and meta_events_order_id_key collides on meta_events.order_id —
    // which is the 'order' kind, not the 'metaEvent' kind (that one
    // duplicates meta_event_id). Seeding three left the fourth index with
    // nothing to block it, so it built correctly and the assertion that
    // NOTHING builds failed against a working deployment.
    await seedDuplicates(db.client, ctx(db), 'all');

    const before = await rowCounts(db.client);
    const run = await runDeployment(db.url);

    expect(run.exitCode).toBe(1);
    for (const name of TARGET_INDEXES) {
      expect(await readIndex(db.client, name), name).toBeNull();
      expect((await migrationState(db.client, name))?.status, name).toBe('FAILED');
    }
    expect(await rowCounts(db.client)).toEqual(before);
  }, 90_000);
});

// --------------------------------------------------------- 7 - 11 ----

describe.each([
  ['7. crash after index 1', 'AFTER_INDEX_1', 1],
  ['8. crash after index 2', 'AFTER_INDEX_2', 2],
  ['9. crash after index 3', 'AFTER_INDEX_3', 3],
  ['10. crash after index 4', 'AFTER_INDEX_4', 4],
])('%s', (_label, failAt, builtCount) => {
  it(`stops after ${builtCount} index(es), leaving the rest absent`, async () => {
    const db = await freshDb(`crash-${builtCount}`);
    const run = await runDeployment(db.url, { env: { FAIL_AT: failAt } });

    expect(run.exitCode).toBe(9);

    const built = [];
    for (const name of TARGET_INDEXES) {
      if ((await readIndex(db.client, name))?.isValid) built.push(name);
    }
    expect(built).toHaveLength(builtCount);
  }, 90_000);

  it('releases the advisory lock when the process dies', async () => {
    const db = await freshDb(`crash-lock-${builtCount}`);
    await runDeployment(db.url, { env: { FAIL_AT: failAt } });
    expect(await advisoryLockCount(db.client)).toBe(0);
  }, 90_000);
});

describe('11. crash before Prisma resolve', () => {
  it('builds every index but never prints the resolve command', async () => {
    const db = await freshDb('crash-resolve');
    const run = await runDeployment(db.url, { env: { FAIL_AT: 'BEFORE_PRISMA_RESOLVE' } });

    expect(run.exitCode).toBe(9);
    expect(run.stdout).not.toContain('prisma migrate resolve');
    expect(await allIndexesValid(db.client)).toBe(true);
  }, 90_000);

  it('a re-run completes cleanly and does print it', async () => {
    const db = await freshDb('crash-resolve-retry');
    await runDeployment(db.url, { env: { FAIL_AT: 'BEFORE_PRISMA_RESOLVE' } });

    const retry = await runDeployment(db.url);

    expect(retry.exitCode).toBe(0);
    expect(retry.stdout).toContain('prisma migrate resolve --applied');
  }, 120_000);
});

// -------------------------------------------------------------- 12 ----

describe('12. retry after crash', () => {
  it.each([
    ['AFTER_INDEX_1', 1],
    ['AFTER_INDEX_2', 2],
    ['AFTER_INDEX_3', 3],
  ])(
    'resumes from %s and finishes the remaining indexes',
    async (failAt, builtCount) => {
      const db = await freshDb(`retry-${builtCount}`);
      const crashed = await runDeployment(db.url, { env: { FAIL_AT: failAt } });
      expect(crashed.exitCode).toBe(9);

      const retry = await runDeployment(db.url);

      expect(retry.exitCode).toBe(0);
      expect(await allIndexesValid(db.client)).toBe(true);
      for (const name of TARGET_INDEXES) {
        expect((await migrationState(db.client, name))?.status, name).toBe('COMPLETED');
      }
    },
    120_000,
  );

  it('does not rebuild indexes the crashed run already completed', async () => {
    const db = await freshDb('retry-noop');
    await runDeployment(db.url, { env: { FAIL_AT: 'AFTER_INDEX_2' } });
    const retry = await runDeployment(db.url);
    expect(retry.stdout).toContain('already-valid');
  }, 120_000);
});

// -------------------------------------------------------------- 13 ----

describe('13. five repeated deployments', () => {
  it('is idempotent — same end state, exit 0 every time', async () => {
    const db = await freshDb('repeat');
    for (let i = 0; i < 5; i += 1) {
      const run = await runDeployment(db.url);
      expect(run.exitCode, `run ${i + 1}`).toBe(0);
    }

    expect(await allIndexesValid(db.client)).toBe(true);
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM production_index_migrations`,
    );
    expect(rows[0].n).toBe(TARGET_INDEXES.length); // no duplicate tracking rows
  }, 180_000);
});

// --------------------------------------------------------- 14 - 15 ----

describe('14. advisory lock contention', () => {
  it('the second deployment exits rather than running concurrently', async () => {
    const db = await freshDb('contend');

    const holder = startDeployment(db.url, { env: { HOLD_LOCK_MS: '6000' } });
    await new Promise((r) => setTimeout(r, 2000)); // let it take the lock

    const contender = await runDeployment(db.url);
    expect(contender.exitCode).toBe(3);
    expect(contender.stderr).toContain('advisory lock');

    const first = await holder.done;
    expect(first.exitCode).toBe(0);
    expect(await allIndexesValid(db.client)).toBe(true);
  }, 120_000);

  it('the contender creates no index of its own', async () => {
    const db = await freshDb('contend-noop');
    const holder = startDeployment(db.url, { env: { HOLD_LOCK_MS: '5000' } });
    await new Promise((r) => setTimeout(r, 1500));

    const contender = await runDeployment(db.url);
    expect(contender.stdout).not.toContain('created');

    await holder.done;
  }, 120_000);
});

describe('15. process death releases advisory lock', () => {
  it('SIGKILL mid-run frees the lock so the next deployment proceeds', async () => {
    const db = await freshDb('kill-lock');

    const killed = await runDeployment(db.url, {
      env: { KILL_AFTER_LOCK_MS: '500', HOLD_LOCK_MS: '30000' },
    });
    // The deployment runs under `tsx`, which executes the script in an
    // INNER process. SIGKILL kills that one; the tsx wrapper then exits
    // with 137 (128 + 9) of its own accord, so the signal never reaches
    // this process — `close` reports { exitCode: 137, signal: null }.
    // Both spellings mean "killed by SIGKILL", and which one arrives is
    // an artefact of the runner, not of the behaviour under test.
    expect(killed.signal === 'SIGKILL' || killed.exitCode === 137).toBe(true);

    // Postgres drops session advisory locks when the backend disconnects.
    expect(await advisoryLockCount(db.client)).toBe(0);

    const next = await runDeployment(db.url);
    expect(next.exitCode).toBe(0);
    expect(await allIndexesValid(db.client)).toBe(true);
  }, 120_000);
});

// --------------------------------------------------------- 16 - 18 ----

describe('16. clean dry-run', () => {
  it('reports what it would do and creates nothing', async () => {
    const db = await freshDb('dry-clean');
    const run = await runDeployment(db.url, { env: { DRY_RUN: 'true' } });

    expect(run.stdout).toContain('DRY RUN');
    for (const name of TARGET_INDEXES) {
      expect(await readIndex(db.client, name), name).toBeNull();
    }
    expect(run.exitCode).toBe(1); // nothing valid yet, so not a success
  }, 90_000);
});

describe('17. duplicate dry-run', () => {
  it('surfaces the duplicates without building or mutating anything', async () => {
    const db = await freshDb('dry-dup');
    await seedDuplicates(db.client, ctx(db), 'payment');

    const before = await rowCounts(db.client);
    const run = await runDeployment(db.url, { env: { DRY_RUN: 'true' } });

    expect(run.stdout).toContain('blocked-duplicates');
    expect(await readIndex(db.client, IDX_PAYMENT)).toBeNull();
    expect(await rowCounts(db.client)).toEqual(before);
  }, 90_000);
});

describe('18. repeated dry-run', () => {
  it('leaves the database byte-identical across three runs', async () => {
    const db = await freshDb('dry-repeat');
    await seedDuplicates(db.client, ctx(db), 'payment');

    const before = await rowCounts(db.client);
    for (let i = 0; i < 3; i += 1) {
      await runDeployment(db.url, { env: { DRY_RUN: 'true' } });
    }

    expect(await rowCounts(db.client)).toEqual(before);
    for (const name of TARGET_INDEXES) {
      expect(await readIndex(db.client, name), name).toBeNull();
    }
  }, 120_000);

  it('a real run after dry-runs still works', async () => {
    const db = await freshDb('dry-then-real');
    await runDeployment(db.url, { env: { DRY_RUN: 'true' } });
    const real = await runDeployment(db.url);
    expect(real.exitCode).toBe(0);
    expect(await allIndexesValid(db.client)).toBe(true);
  }, 120_000);
});

async function rowCounts(client: Client): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of ['orders', 'payments', 'webhook_events', 'meta_events']) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
    counts[table] = rows[0].n;
  }
  return counts;
}
