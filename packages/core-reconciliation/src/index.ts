export {
  assertReadOnly,
  buildDetectionSql,
  createSqlDetectionSource,
  DEFAULT_MAX_GROUPS,
  DEFAULT_MAX_ROWS_PER_GROUP,
  detectDuplicates,
  DETECTION_SQL,
  qualifyKey,
  ReconciliationSafetyError,
  withReadOnlyTransaction,
} from './detection';
export type {
  DetectionSource,
  ReadOnlyPool,
  ReadOnlyQueryExecutor,
  ReconciliationWindow,
} from './detection';
export { reconcileIdempotency, toCase } from './reconcile';
export type { ReconcileDeps } from './reconcile';
export { createPgReconciliationRepository } from './repository';
export type { ReconciliationRepository, SqlExecutor } from './repository';
export { formatCaseLines, formatReport, isClean, worstOffenders } from './report';
export {
  DUPLICATE_DIMENSIONS,
  RECORD_TYPE_BY_DIMENSION,
  type CasePersistOutcome,
  type DuplicateDimension,
  type DuplicateGroup,
  type IdempotencyRecordType,
  type PersistedCaseResult,
  type ReconciliationCase,
  type ReconciliationReport,
  type ReconciliationSnapshot,
  type ReconciliationStatus,
} from './types';
