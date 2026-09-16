import { detectDuplicates, type DetectionSource, type ReconciliationWindow } from './detection';
import type { ReconciliationRepository } from './repository';
import {
  DUPLICATE_DIMENSIONS,
  type DuplicateDimension,
  type DuplicateGroup,
  type IdempotencyRecordType,
  type PersistedCaseResult,
  type ReconciliationCase,
  type ReconciliationReport,
} from './types';

export interface ReconcileDeps {
  source: DetectionSource;
  repository: ReconciliationRepository;
  /**
   * The half-open [start, end) range to scan. Required, not defaulted:
   * a default would quietly reintroduce the unbounded full-table scan
   * this exists to remove, and "which period did this report cover?" is
   * a question the caller must answer rather than inherit.
   */
  window: ReconciliationWindow;
  now?: () => Date;
  dimensions?: readonly DuplicateDimension[];
}

const EMPTY_BY_TYPE: Record<IdempotencyRecordType, number> = {
  ORDER: 0,
  PAYMENT: 0,
  WEBHOOK_EVENT: 0,
  META_EVENT: 0,
};

/**
 * Scans every duplicate dimension and records one OPEN case per group.
 *
 * Business tables are only ever read. The single write target is
 * idempotency_reconciliations, via the repository.
 */
export async function reconcileIdempotency(deps: ReconcileDeps): Promise<ReconciliationReport> {
  const clock = deps.now ?? (() => new Date());
  const dimensions = deps.dimensions ?? DUPLICATE_DIMENSIONS;
  const startedAt = clock();

  const groups = await detectDuplicates(deps.source, deps.window, dimensions);

  const results: PersistedCaseResult[] = [];
  const byRecordType = { ...EMPTY_BY_TYPE };
  let created = 0;
  let updated = 0;

  for (const group of groups) {
    const outcome = await deps.repository.upsertCase(toCase(group, startedAt), clock());
    if (outcome === 'created') created += 1;
    else updated += 1;
    byRecordType[group.recordType] += 1;
    results.push({
      duplicateKey: group.duplicateKey,
      recordType: group.recordType,
      outcome,
    });
  }

  return {
    startedAt,
    finishedAt: clock(),
    window: { start: deps.window.start, end: deps.window.end },
    scannedDimensions: dimensions,
    groups,
    created,
    updated,
    results,
    byRecordType,
    affectedRecordCount: groups.reduce((sum, g) => sum + g.recordCount, 0),
  };
}

/** Shapes a detected group into the row stored in idempotency_reconciliations. */
export function toCase(group: DuplicateGroup, detectedAt: Date): ReconciliationCase {
  return {
    recordType: group.recordType,
    duplicateKey: group.duplicateKey,
    recordCount: group.recordCount,
    status: 'OPEN',
    snapshot: {
      dimension: group.dimension,
      rawKey: group.rawKey,
      recordCount: group.recordCount,
      detectedAt: detectedAt.toISOString(),
      // Sampled examples, never the provider payload. `recordCount`
      // above is the real total; `sampleTruncated` says whether these
      // rows are all of them.
      rows: group.rows,
      sampleTruncated: group.sampleTruncated,
    },
  };
}
