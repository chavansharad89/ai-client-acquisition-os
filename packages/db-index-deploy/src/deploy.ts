import { duplicatePreflight, type PreflightResult } from './preflight';
import {
  ACQUIRE_LOCK_SQL,
  ADVISORY_LOCK_NAMESPACE,
  createIndexSql,
  ENSURE_STATE_ROW_SQL,
  MARK_COMPLETED_SQL,
  MARK_FAILED_SQL,
  MARK_RUNNING_SQL,
  READ_STATE_SQL,
  RELEASE_LOCK_SQL,
  RESET_TO_PENDING_SQL,
  type SessionExecutor,
  DEFAULT_SCHEMA,
} from './sql';
import { INDEX_TARGETS, MIGRATION_NAME, type IndexTarget } from './targets';
import { describeVerdict, verifyIndex, type IndexVerdict } from './verify';

export type DeploymentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export type TargetOutcome =
  | 'already-valid' // index was already there and verified
  | 'created' // built by this run
  | 'blocked-duplicates' // preflight refused to start
  | 'blocked-invalid' // an INVALID index is in the way; operator must act
  | 'blocked-mismatch' // a different index owns the name
  | 'failed'; // the build itself errored

export interface TargetResult {
  target: IndexTarget;
  outcome: TargetOutcome;
  verdict: IndexVerdict;
  preflight?: PreflightResult;
  recovered?: string;
  error?: string;
  durationMs: number;
}

export interface DeploymentResult {
  migrationName: string;
  lockAcquired: boolean;
  results: readonly TargetResult[];
  finalVerification: readonly { target: IndexTarget; verdict: IndexVerdict }[];
  allValid: boolean;
  /** Exactly what an operator must run next, if anything. */
  operatorActions: readonly string[];
}

export interface DeployDeps {
  session: SessionExecutor;
  targets?: readonly IndexTarget[];
  migrationName?: string;
  now?: () => Date;
  log?: (line: string) => void;
  /** Skip the build; report what would happen. */
  dryRun?: boolean;
  /**
   * Schema the target indexes and tables live in. Defaults to `public`.
   *
   * Explicit rather than inherited from the connection: see the note on
   * INSPECT_INDEX_SQL. A search_path that starts elsewhere used to make a
   * real index look missing.
   */
  schema?: string;
  /**
   * Observation points, used by the integration harness to interrupt a
   * deployment at a precise moment. They are plain callbacks — the
   * library has no knowledge of testing; the runner decides what to wire
   * in, and only outside production (see scripts/deploy-concurrent-indexes.ts).
   */
  hooks?: DeploymentHooks;
}

export interface DeploymentHooks {
  /** After the advisory lock is held, before any target is touched. */
  afterLock?: () => Promise<void> | void;
  /** After each target settles. `position` is 1-based. */
  afterTarget?: (result: TargetResult, position: number) => Promise<void> | void;
  /** After final verification, before operator actions are reported. */
  afterVerification?: (result: Omit<DeploymentResult, 'operatorActions'>) => Promise<void> | void;
}

const OUTCOMES_NEEDING_ACTION: readonly TargetOutcome[] = [
  'blocked-duplicates',
  'blocked-invalid',
  'blocked-mismatch',
  'failed',
];

/**
 * Deploys every target index, one at a time, under a session advisory
 * lock.
 *
 * The whole function is re-runnable. Every branch either finishes a
 * target or records precisely why it could not, and nothing here drops or
 * rewrites an existing index — the most a failure produces is a FAILED
 * row and an instruction for a human.
 */
export async function deployConcurrentIndexes(deps: DeployDeps): Promise<DeploymentResult> {
  const session = deps.session;
  const migrationName = deps.migrationName ?? MIGRATION_NAME;
  const targets = deps.targets ?? INDEX_TARGETS;
  const clock = deps.now ?? (() => new Date());
  const log = deps.log ?? (() => undefined);
  const schema = deps.schema ?? DEFAULT_SCHEMA;

  // One deployment at a time across every replica and every operator.
  // Session-scoped (not transaction-scoped) because the index build below
  // cannot run in a transaction, so there is no transaction to scope to.
  const { rows } = await session.query(ACQUIRE_LOCK_SQL, [ADVISORY_LOCK_NAMESPACE, migrationName]);
  const lockAcquired = (rows[0] as { acquired: boolean } | undefined)?.acquired === true;
  if (!lockAcquired) {
    log(`advisory lock held by another session — another deployment is in progress; exiting`);
    return {
      migrationName,
      lockAcquired: false,
      results: [],
      finalVerification: [],
      allValid: false,
      operatorActions: ['Another deployment holds the advisory lock. Wait for it, then re-run.'],
    };
  }

  const results: TargetResult[] = [];
  try {
    await deps.hooks?.afterLock?.();

    for (const [position, target] of targets.entries()) {
      const result = await deployOne(
        session,
        target,
        migrationName,
        clock,
        log,
        deps.dryRun,
        schema,
      );
      results.push(result);
      await deps.hooks?.afterTarget?.(result, position + 1);
    }

    // Final verification re-reads pg_index for everything, including
    // targets this run skipped, so the exit status reflects the database
    // rather than this run's bookkeeping.
    const finalVerification = [];
    for (const target of targets) {
      finalVerification.push({ target, verdict: await verifyIndex(session, target, schema) });
    }
    const allValid = finalVerification.every((v) => v.verdict.state === 'valid');

    await deps.hooks?.afterVerification?.({
      migrationName,
      lockAcquired: true,
      results,
      finalVerification,
      allValid,
    });

    return {
      migrationName,
      lockAcquired: true,
      results,
      finalVerification,
      allValid,
      operatorActions: buildOperatorActions(results, allValid, migrationName),
    };
  } finally {
    await session
      .query(RELEASE_LOCK_SQL, [ADVISORY_LOCK_NAMESPACE, migrationName])
      .catch(() => undefined);
  }
}

async function deployOne(
  session: SessionExecutor,
  target: IndexTarget,
  migrationName: string,
  clock: () => Date,
  log: (line: string) => void,
  dryRun: boolean | undefined,
  schema: string,
): Promise<TargetResult> {
  const startedAt = clock();
  const key = [migrationName, target.indexName] as const;
  await session.query(ENSURE_STATE_ROW_SQL, [...key, startedAt]);

  const priorStatus = await readStatus(session, key);
  let verdict = await verifyIndex(session, target, schema);
  let recovered: string | undefined;

  // --- Crash recovery -------------------------------------------------
  // A RUNNING row with no live process means a previous run died. The
  // database, not the row, is the authority on what actually happened.
  if (priorStatus === 'RUNNING') {
    if (verdict.state === 'valid') {
      recovered = 'previous run died after the index became valid; recording COMPLETED';
    } else if (verdict.state === 'missing') {
      recovered = 'previous run died before the index existed; retrying';
      await session.query(RESET_TO_PENDING_SQL, [...key, recovered, clock()]);
    } else {
      recovered = `previous run left the index ${verdict.state}; operator action required`;
    }
    log(`${target.indexName}: ${recovered}`);
  }

  const finish = (outcome: TargetResult['outcome'], extra: Partial<TargetResult> = {}) => ({
    target,
    outcome,
    verdict,
    durationMs: clock().getTime() - startedAt.getTime(),
    ...(recovered !== undefined ? { recovered } : {}),
    ...extra,
  });

  // --- Already done ---------------------------------------------------
  if (verdict.state === 'valid') {
    await session.query(MARK_COMPLETED_SQL, [...key, clock()]);
    log(`${target.indexName}: already valid — nothing to do`);
    return finish('already-valid');
  }

  // --- Refuse to touch anything suspicious ----------------------------
  // Never dropped automatically: an INVALID index may still be enforcing
  // partial constraints, and a mismatched one belongs to someone else.
  if (verdict.state === 'invalid' || verdict.state === 'mismatched') {
    const error = describeVerdict(target, verdict);
    await session.query(MARK_FAILED_SQL, [...key, error, clock()]);
    log(`${target.indexName}: BLOCKED — ${error}`);
    return finish(verdict.state === 'invalid' ? 'blocked-invalid' : 'blocked-mismatch', { error });
  }

  // --- Duplicate preflight --------------------------------------------
  const preflight = await duplicatePreflight(session, target, undefined, schema);
  if (!preflight.clean) {
    const error =
      `${preflight.duplicates.length} duplicate group(s) across ` +
      `${preflight.totalOffendingRows} row(s) would fail the unique build`;
    await session.query(MARK_FAILED_SQL, [...key, error, clock()]);
    log(`${target.indexName}: BLOCKED — ${error}`);
    return finish('blocked-duplicates', { preflight, error });
  }

  if (dryRun) {
    log(`${target.indexName}: dry run — would create index`);
    return finish('created', { preflight });
  }

  // --- Build ----------------------------------------------------------
  await session.query(MARK_RUNNING_SQL, [...key, clock()]);
  try {
    // Issued on its own, outside any transaction. If this throws, the row
    // stays FAILED and an INVALID index may remain — deliberately left in
    // place for a human to inspect and drop.
    await session.query(createIndexSql(target, schema));
  } catch (cause) {
    const error = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
    await session.query(MARK_FAILED_SQL, [...key, error, clock()]);
    verdict = await verifyIndex(session, target, schema);
    log(`${target.indexName}: FAILED — ${error}`);
    return finish('failed', { preflight, error });
  }

  // --- Verify before believing it --------------------------------------
  verdict = await verifyIndex(session, target, schema);
  if (verdict.state !== 'valid') {
    const error = `build reported success but ${describeVerdict(target, verdict)}`;
    await session.query(MARK_FAILED_SQL, [...key, error, clock()]);
    log(`${target.indexName}: FAILED — ${error}`);
    return finish('failed', { preflight, error });
  }

  await session.query(MARK_COMPLETED_SQL, [...key, clock()]);
  log(`${target.indexName}: created and verified`);
  return finish('created', { preflight });
}

async function readStatus(
  session: SessionExecutor,
  [migrationName, indexName]: readonly [string, string],
): Promise<DeploymentStatus | null> {
  const { rows } = await session.query(READ_STATE_SQL, [migrationName, indexName]);
  return (rows[0] as { status: DeploymentStatus } | undefined)?.status ?? null;
}

function buildOperatorActions(
  results: readonly TargetResult[],
  allValid: boolean,
  migrationName: string,
): string[] {
  const actions: string[] = [];
  for (const r of results.filter((x) => OUTCOMES_NEEDING_ACTION.includes(x.outcome))) {
    switch (r.outcome) {
      case 'blocked-duplicates':
        actions.push(
          `${r.target.indexName}: resolve duplicates in ${r.target.table}(${r.target.columns.join(', ')}), then re-run. ` +
            `Use @acos/core-reconciliation to open cases for them.`,
        );
        break;
      case 'blocked-invalid':
        actions.push(
          `${r.target.indexName}: an INVALID index exists. Inspect it, then drop it by hand with ` +
            `DROP INDEX CONCURRENTLY "${r.target.indexName}"; and re-run. This script will not drop it for you.`,
        );
        break;
      case 'blocked-mismatch':
        actions.push(
          `${r.target.indexName}: the name is taken by a different index (${r.verdict.state === 'mismatched' ? r.verdict.reason : ''}). ` +
            `Resolve by hand — this script will not modify it.`,
        );
        break;
      default:
        actions.push(`${r.target.indexName}: build failed — ${r.error ?? 'see state table'}.`);
    }
  }
  if (allValid) {
    actions.push(
      `All indexes verified. Reconcile Prisma with: pnpm --filter @acos/db exec prisma migrate resolve --applied ${migrationName}`,
    );
  }
  return actions;
}
