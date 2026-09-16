import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Client } from 'pg';

// Real-PostgreSQL harness for the concurrent index deployment.
// -----------------------------------------------------------------------
// Nothing here is mocked. Each test gets its own throwaway database, the
// real 0001_init schema, and runs the real script in a real child
// process. pg_index is queried directly — the whole point is that the
// catalog, not a fake, decides whether an index is valid.
// -----------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, '../../..');
const MIGRATIONS_DIR = resolve(REPO_ROOT, 'packages/db/prisma/migrations');
const RUNNER = resolve(REPO_ROOT, 'scripts/deploy-concurrent-indexes.ts');
const TSX = resolve(REPO_ROOT, 'apps/worker/node_modules/.bin/tsx');

/** Server to create throwaway databases on. Points at docker-compose.test.yml by default. */
export const ADMIN_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  'postgresql://acos_test:acos_test_password@127.0.0.1:5433/postgres';

/**
 * The four unique indexes the deployment owns (three from 0001_init, plus
 * meta_events_order_id_key from 0002). They are dropped after applying the schema so each test starts
 * from a realistic PRE-deployment database — one where duplicates can
 * still be inserted, which is the state the script exists to fix.
 */
const PREEXISTING_TARGET_INDEXES = [
  'payments_razorpay_payment_id_key',
  'webhook_events_razorpay_event_id_key',
  'meta_events_meta_event_id_key',
  // Created by migration 0002. It must be dropped alongside the others or
  // the reconciliation fixtures — which deliberately put two meta events
  // on one order — cannot build their duplicates, and the deployment
  // suite has nothing left to deploy.
  'meta_events_order_id_key',
];

export interface TempDatabase {
  name: string;
  url: string;
  /** A connection to the temp database; closed by `drop()`. */
  client: Client;
  drop: () => Promise<void>;
}

export async function serverReachable(): Promise<boolean> {
  const admin = new Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 2000 });
  try {
    await admin.connect();
    await admin.end();
    return true;
  } catch {
    return false;
  }
}

export interface TempDatabaseOptions {
  /**
   * Drop the four unique indexes the migrations create that the
   * deployment also owns, reproducing a PRE-deployment database in which
   * duplicates can still be inserted.
   *
   * The migration and reconciliation suites need this (they must be able
   * to create the duplicates they detect). The payment/webhook suites
   * must NOT set it — they assert that those very indexes reject
   * duplicates, which requires them to be present.
   */
  dropTargetIndexes?: boolean;

  /**
   * Apply migrations only up to and including this directory name.
   *
   * For suites that must observe a database in a PARTICULAR state — the
   * 0002 guard suite applies 0002 itself, so the harness must stop at
   * 0001 or there is nothing left to test.
   *
   * This is NOT an escape hatch for a migration that will not apply. It
   * was one once: 0005 and 0006 ALTERed tables no migration created, and
   * every suite either stopped short of them or skipped them by name.
   * Both are now out of the chain (see
   * packages/db/prisma/migrations-blocked/README.md) and the default —
   * apply everything — is the one to use unless a suite has a positive
   * reason to stop early.
   */
  throughMigration?: string;
}

/** Creates a fresh database and applies the real 0001_init schema. */
export async function createTempDatabase(
  label = 'idx',
  options: TempDatabaseOptions = {},
): Promise<TempDatabase> {
  const name = `acos_${label}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }

  const url = urlForDatabase(ADMIN_URL, name);
  const client = new Client({ connectionString: url });
  await client.connect();

  // `pg` sends a multi-statement string over the simple query protocol,
  // so the whole migration applies in one round trip.
  // Apply every migration in order, so tests run against the same
  // constraints production has — including the 0003 integrity triggers.
  const migrations = readdirSync(MIGRATIONS_DIR)
    .filter((d) => /^\d{4}_/.test(d))
    .sort();
  if (options.throughMigration !== undefined && !migrations.includes(options.throughMigration)) {
    throw new Error(
      `throughMigration "${options.throughMigration}" is not a migration directory; have: ${migrations.join(', ')}`,
    );
  }
  for (const dir of migrations) {
    await client.query(readFileSync(resolve(MIGRATIONS_DIR, dir, 'migration.sql'), 'utf8'));
    if (dir === options.throughMigration) break;
  }
  if (options.dropTargetIndexes) {
    for (const index of PREEXISTING_TARGET_INDEXES) {
      await client.query(`DROP INDEX IF EXISTS "${index}"`);
    }
  }

  return {
    name,
    url,
    client,
    async drop() {
      await client.end().catch(() => undefined);
      const dropper = new Client({ connectionString: ADMIN_URL });
      await dropper.connect();
      try {
        // Anything the child process left open must go first.
        await dropper.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
            WHERE datname = $1 AND pid <> pg_backend_pid()`,
          [name],
        );
        await dropper.query(`DROP DATABASE IF EXISTS "${name}"`);
      } finally {
        await dropper.end();
      }
    },
  };
}

function urlForDatabase(base: string, database: string): string {
  const url = new URL(base);
  url.pathname = `/${database}`;
  return url.toString();
}

// --- running the real script in a real child process ---------------------

export interface RunOptions {
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface RunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

/** Spawns scripts/deploy-concurrent-indexes.ts against `databaseUrl`. */
export function runDeployment(databaseUrl: string, options: RunOptions = {}): Promise<RunResult> {
  const startedAt = Date.now();
  return new Promise((resolvePromise, reject) => {
    const child = spawn(TSX, [RUNNER], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        NODE_ENV: 'test', // fault injection is inert under production
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c: Buffer) => (stdout += c.toString()));
    child.stderr.on('data', (c: Buffer) => (stderr += c.toString()));

    const timer = setTimeout(() => child.kill('SIGKILL'), options.timeoutMs ?? 60_000);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolvePromise({
        exitCode,
        signal,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

/** Starts a deployment without waiting, so contention can be observed. */
export function startDeployment(
  databaseUrl: string,
  options: RunOptions = {},
): { done: Promise<RunResult> } {
  return { done: runDeployment(databaseUrl, options) };
}

// --- querying the real catalog ------------------------------------------

export interface IndexFacts {
  indexName: string;
  tableName: string;
  isUnique: boolean;
  isValid: boolean;
  isReady: boolean;
  columns: string[];
}

/** Reads pg_index directly. Never mocked. */
export async function readIndex(client: Client, indexName: string): Promise<IndexFacts | null> {
  const { rows } = await client.query(
    `SELECT c.relname AS index_name, t.relname AS table_name,
            i.indisunique AS is_unique, i.indisvalid AS is_valid, i.indisready AS is_ready,
            array_agg(a.attname ORDER BY k.ord) AS columns
       FROM pg_index i
       JOIN pg_class c     ON c.oid = i.indexrelid
       JOIN pg_class t     ON t.oid = i.indrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      WHERE c.relname = $1 AND n.nspname = current_schema()
      GROUP BY c.relname, t.relname, i.indisunique, i.indisvalid, i.indisready`,
    [indexName],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    indexName: row.index_name,
    tableName: row.table_name,
    isUnique: row.is_unique,
    isValid: row.is_valid,
    isReady: row.is_ready,
    columns: row.columns,
  };
}

export async function migrationState(
  client: Client,
  indexName: string,
): Promise<{ status: string; error: string | null } | null> {
  const { rows } = await client.query(
    `SELECT deployment_status AS status, error FROM production_index_migrations
      WHERE index_name = $1`,
    [indexName],
  );
  return rows[0] ? { status: rows[0].status, error: rows[0].error } : null;
}

/** Advisory locks currently held on this database, by classid/objid. */
export async function advisoryLockCount(client: Client): Promise<number> {
  const { rows } = await client.query(
    `SELECT count(*)::int AS n FROM pg_locks WHERE locktype = 'advisory'`,
  );
  return rows[0].n;
}

// --- seeding -----------------------------------------------------------
//
// Duplicate seeding lives in tests/fixtures/idempotency-duplicates.ts so
// the integration suite and any future suite share one definition of what
// a duplicate looks like. The versions that used to live here put every
// CAPTURED payment on a single order, which violates the partial unique
// index `payments_one_captured_per_order` rather than the rule under test.

export const TARGET_INDEXES = [
  'payments_razorpay_payment_id_key',
  'webhook_events_razorpay_event_id_key',
  'meta_events_order_id_key',
  'meta_events_meta_event_id_key',
] as const;
