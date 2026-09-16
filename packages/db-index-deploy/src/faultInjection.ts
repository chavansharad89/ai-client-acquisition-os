/* eslint-disable no-console */
import type { DeploymentHooks, TargetResult } from './deploy';

// Fault injection for the integration harness.
// -----------------------------------------------------------------------
// SAFETY: every hook here is inert when NODE_ENV === 'production'. The
// deployment script is an operational tool that runs against real
// databases, and an environment variable must never be able to make it
// abort midway there. Tests run under NODE_ENV=test, so they are
// unaffected by the guard.
// -----------------------------------------------------------------------

export const FAIL_POINTS = [
  'AFTER_INDEX_1',
  'AFTER_INDEX_2',
  'AFTER_INDEX_3',
  'AFTER_INDEX_4',
  'BEFORE_PRISMA_RESOLVE',
] as const;

export type FailPoint = (typeof FAIL_POINTS)[number];

/** Exit code used for every injected crash, so tests can assert on it. */
export const INJECTED_CRASH_EXIT_CODE = 9;

export interface FaultConfig {
  failAt?: FailPoint;
  holdLockMs?: number;
  killAfterLockMs?: number;
  enabled: boolean;
}

export function readFaultConfig(env: NodeJS.ProcessEnv = process.env): FaultConfig {
  const enabled = env.NODE_ENV !== 'production';
  const failAtRaw = env.FAIL_AT?.trim();
  if (failAtRaw && !FAIL_POINTS.includes(failAtRaw as FailPoint)) {
    throw new Error(`FAIL_AT must be one of ${FAIL_POINTS.join(', ')} — received ${failAtRaw}`);
  }
  const holdLockMs = positiveInt(env.HOLD_LOCK_MS);
  const killAfterLockMs = positiveInt(env.KILL_AFTER_LOCK_MS);
  return {
    enabled,
    ...(failAtRaw ? { failAt: failAtRaw as FailPoint } : {}),
    ...(holdLockMs !== undefined ? { holdLockMs } : {}),
    ...(killAfterLockMs !== undefined ? { killAfterLockMs } : {}),
  };
}

export function isDryRun(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.DRY_RUN === 'true' || process.argv.includes('--dry-run');
}

function positiveInt(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new Error(`expected a non-negative integer, got ${raw}`);
  return n;
}

/** Index position encoded in an AFTER_INDEX_n fail point. */
export function positionOf(failAt: FailPoint): number | null {
  const match = /^AFTER_INDEX_(\d+)$/.exec(failAt);
  return match ? Number(match[1]) : null;
}

export function buildHooks(config: FaultConfig): DeploymentHooks {
  if (!config.enabled) return {};

  return {
    async afterLock() {
      // SIGKILL cannot be caught, so no `finally` runs and the advisory
      // unlock never executes — which is exactly the scenario under test:
      // Postgres must release a session lock when the connection dies.
      if (config.killAfterLockMs !== undefined) {
        setTimeout(() => process.kill(process.pid, 'SIGKILL'), config.killAfterLockMs).unref();
      }
      if (config.holdLockMs !== undefined && config.holdLockMs > 0) {
        console.log(`  [fault] holding advisory lock for ${config.holdLockMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, config.holdLockMs));
      }
    },

    afterTarget(result: TargetResult, position: number) {
      const wanted = config.failAt ? positionOf(config.failAt) : null;
      if (wanted !== null && position === wanted) {
        console.log(`  [fault] FAIL_AT=${config.failAt} after ${result.target.indexName}`);
        // Abrupt: skips the finally that releases the advisory lock, and
        // leaves whatever state the deployment had reached on disk.
        process.exit(INJECTED_CRASH_EXIT_CODE);
      }
    },

    afterVerification() {
      if (config.failAt === 'BEFORE_PRISMA_RESOLVE') {
        console.log('  [fault] FAIL_AT=BEFORE_PRISMA_RESOLVE');
        process.exit(INJECTED_CRASH_EXIT_CODE);
      }
    },
  };
}
