import {
  assertCleanupSucceeded,
  createTestRunContext,
  type TestRunContext,
} from '../../fixtures/test-run-context';
import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
  type TempDatabaseOptions,
} from './pgIndexHarness';

// Per-suite database lifecycle.
// -----------------------------------------------------------------------
// One throwaway database per suite (not per test) — creating a database
// and applying the schema costs far more than the tests themselves, and
// the shared run context plus scoped cleanup keeps tests isolated from
// each other without paying that cost repeatedly.
// -----------------------------------------------------------------------

export interface SuiteDb {
  db: TempDatabase;
  context: TestRunContext;
}

export interface SuiteHandle {
  /** Throws with an actionable message when no server is available. */
  require(): SuiteDb;
  setup(): Promise<void>;
  teardown(): Promise<void>;
  /** Deletes only this run's rows, then verifies none survived. */
  cleanup(): Promise<void>;
  reachable(): boolean;
}

export function suiteDatabase(label: string, options: TempDatabaseOptions = {}): SuiteHandle {
  let state: SuiteDb | null = null;
  let ok = false;
  let counter = 0;

  return {
    reachable: () => ok,
    require() {
      if (!state) {
        throw new Error(
          `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
            `Start it first:  docker compose -f docker-compose.test.yml up -d`,
        );
      }
      return state;
    },
    async setup() {
      ok = await serverReachable();
      if (!ok) return;
      const db = await createTempDatabase(label, options);
      state = { db, context: createTestRunContext(`${label}_${(counter += 1)}`) };
    },
    async cleanup() {
      if (!state) return;
      if (state.context.totalTracked() > 0) {
        await assertCleanupSucceeded(state.db.client, state.context);
      }
      // A fresh context per test keeps ids from one test out of another's
      // cleanup set, so a failure cannot cascade.
      state.context = createTestRunContext(`${label}_${(counter += 1)}`);
    },
    async teardown() {
      if (state) await state.db.drop();
      state = null;
    },
  };
}
