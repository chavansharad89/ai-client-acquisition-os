export { DEFAULT_SCHEMA } from './sql';
export {
  buildHooks,
  FAIL_POINTS,
  INJECTED_CRASH_EXIT_CODE,
  isDryRun,
  positionOf,
  readFaultConfig,
} from './faultInjection';
export type { FailPoint, FaultConfig } from './faultInjection';
export { deployConcurrentIndexes } from './deploy';
export type {
  DeployDeps,
  DeploymentResult,
  DeploymentStatus,
  TargetOutcome,
  TargetResult,
} from './deploy';
export { duplicatePreflight, formatPreflight } from './preflight';
export type { DuplicateSample, PreflightResult } from './preflight';
export {
  ACQUIRE_LOCK_SQL,
  ADVISORY_LOCK_NAMESPACE,
  createIndexSql,
  duplicatePreflightSql,
  INSPECT_INDEX_SQL,
  RELEASE_LOCK_SQL,
} from './sql';
export type { SessionExecutor, SqlExecutor } from './sql';
export {
  assertTargetIsSafe,
  INDEX_TARGETS,
  MIGRATION_NAME,
  quoteIdentifier,
  UnsafeIdentifierError,
} from './targets';
export type { IndexTarget } from './targets';
export { describeVerdict, verifyIndex } from './verify';
export type { IndexVerdict } from './verify';
