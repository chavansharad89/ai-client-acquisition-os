import type { DetectionSource, ReconciliationWindow } from './detection';
import type { ReconciliationRepository } from './repository';
import {
  RECORD_TYPE_BY_DIMENSION,
  type CasePersistOutcome,
  type DuplicateDimension,
  type DuplicateGroup,
  type ReconciliationCase,
  type ReconciliationStatus,
} from './types';

/** Builds a duplicate group without repeating the boilerplate. */
export function group(
  dimension: DuplicateDimension,
  rawKey: string,
  rows: readonly unknown[],
): DuplicateGroup {
  return {
    dimension,
    recordType: RECORD_TYPE_BY_DIMENSION[dimension],
    duplicateKey: `${dimension}=${rawKey}`,
    rawKey,
    recordCount: rows.length,
    rows,
    sampleTruncated: false,
  };
}

/** A window wide enough that no test needs to think about it. */
export const ANY_WINDOW: ReconciliationWindow = {
  start: new Date('2000-01-01T00:00:00.000Z'),
  end: new Date('2100-01-01T00:00:00.000Z'),
};

/** A DetectionSource returning canned groups, and counting its calls. */
export function fakeSource(groups: readonly DuplicateGroup[]): DetectionSource & {
  calls: DuplicateDimension[];
  windows: ReconciliationWindow[];
} {
  const calls: DuplicateDimension[] = [];
  const windows: ReconciliationWindow[] = [];
  const fn = (async (dimension: DuplicateDimension, window: ReconciliationWindow) => {
    calls.push(dimension);
    // Recorded so a test can prove the window actually reaches the
    // source rather than being accepted and dropped.
    windows.push(window);
    return groups.filter((g) => g.dimension === dimension);
  }) as DetectionSource & { calls: DuplicateDimension[]; windows: ReconciliationWindow[] };
  fn.calls = calls;
  fn.windows = windows;
  return fn;
}

/**
 * A case as the table holds it. `status` widens back to the full enum:
 * detection only ever WRITES 'OPEN', but a human can move a row on, and
 * the fake has to be able to represent that.
 */
export type StoredCase = Omit<ReconciliationCase, 'status'> & {
  status: ReconciliationStatus;
  updatedAt: Date;
};

export interface FakeReconciliationRepository extends ReconciliationRepository {
  /** Keyed by `${recordType}|${duplicateKey}` — the real unique index. */
  cases: Map<string, StoredCase>;
  upserts: number;
}

/** Enforces @@unique([recordType, duplicateKey]) the way Postgres would. */
export function fakeRepository(): FakeReconciliationRepository {
  const cases = new Map<string, StoredCase>();
  const repo: FakeReconciliationRepository = {
    cases,
    upserts: 0,
    async upsertCase(input, now): Promise<CasePersistOutcome> {
      repo.upserts += 1;
      const key = `${input.recordType}|${input.duplicateKey}`;
      const existing = cases.get(key);
      if (!existing) {
        cases.set(key, { ...input, updatedAt: now });
        return 'created';
      }
      // Refresh evidence, preserve human triage state.
      cases.set(key, {
        ...existing,
        recordCount: input.recordCount,
        snapshot: input.snapshot,
        updatedAt: now,
      });
      return 'updated';
    },
  };
  return repo;
}

/** Records every statement so a test can prove nothing but SELECT ran. */
export function recordingExecutor(responses: Record<string, unknown[]> = {}): {
  query: (sql: string) => Promise<{ rows: unknown[] }>;
  statements: string[];
} {
  const statements: string[] = [];
  return {
    statements,
    async query(sql: string) {
      statements.push(sql);
      const table = /from\s+(\w+)/i.exec(sql)?.[1] ?? '';
      return { rows: responses[table] ?? [] };
    },
  };
}
