import { DEFAULT_SCHEMA, INSPECT_INDEX_SQL, type SqlExecutor } from './sql';
import type { IndexTarget } from './targets';

export type IndexVerdict =
  | { state: 'missing' }
  | { state: 'valid'; columns: readonly string[] }
  | { state: 'invalid'; reason: string; columns: readonly string[] }
  | { state: 'mismatched'; reason: string; columns: readonly string[] };

interface InspectRow {
  index_name: string;
  table_name: string;
  schema_name: string;
  is_unique: boolean;
  is_valid: boolean;
  is_ready: boolean;
  is_live: boolean;
  is_partial: boolean;
  natts: number;
  nkeyatts: number;
  columns: string[];
}

/**
 * Asks pg_index what actually exists, and classifies it.
 *
 * `invalid` and `mismatched` are kept apart on purpose: the first is a
 * half-built index this system could rebuild after an operator drops it,
 * the second is somebody else's index wearing our name, which this system
 * must never touch.
 */
export async function verifyIndex(
  executor: SqlExecutor,
  target: IndexTarget,
  schema: string = DEFAULT_SCHEMA,
): Promise<IndexVerdict> {
  // The schema is passed, never inferred from the connection. See the
  // note on INSPECT_INDEX_SQL: current_schema() made a real index look
  // missing whenever the caller's search_path started somewhere else.
  const { rows } = await executor.query(INSPECT_INDEX_SQL, [target.indexName, schema]);
  const row = rows[0] as InspectRow | undefined;
  if (!row) return { state: 'missing' };

  const columns = row.columns ?? [];

  if (row.table_name !== target.table) {
    return {
      state: 'mismatched',
      reason: `index exists on table "${row.table_name}", expected "${target.table}"`,
      columns,
    };
  }
  // Covers "exactly one target column" on its own: `indkey` includes
  // INCLUDE columns, so a `(a) INCLUDE (b)` index reports [a, b] here and
  // fails this comparison. An explicit indnatts/indnkeyatts check was
  // written alongside this one and removed again — it could not fail
  // without this also failing, and a guard that cannot fire is worse than
  // no guard: it reads like coverage.
  if (!sameColumns(columns, target.columns)) {
    return {
      state: 'mismatched',
      reason: `index covers (${columns.join(', ')}), expected (${target.columns.join(', ')})`,
      columns,
    };
  }
  if (!row.is_unique) {
    return { state: 'mismatched', reason: 'index exists but is not UNIQUE', columns };
  }

  // A partial index enforces uniqueness only over the rows its predicate
  // covers, which is a strictly weaker promise than the one this
  // deployment makes. Previously unchecked here — the migration guard
  // caught it, this did not.
  if (row.is_partial) {
    return {
      state: 'mismatched',
      reason: 'index exists but is PARTIAL (has a WHERE clause), so it does not enforce ' +
        'uniqueness across the whole table',
      columns,
    };
  }

  // A failed CREATE INDEX CONCURRENTLY leaves indisvalid = false. The
  // index still costs write throughput but the planner ignores it, so it
  // is worse than useless — and it is never dropped automatically here.
  if (!row.is_valid) {
    return {
      state: 'invalid',
      reason: 'index is INVALID (a previous CREATE INDEX CONCURRENTLY did not finish)',
      columns,
    };
  }
  if (!row.is_ready) {
    return { state: 'invalid', reason: 'index is not READY (build still in progress)', columns };
  }
  if (!row.is_live) {
    return { state: 'invalid', reason: 'index is not LIVE (pending drop)', columns };
  }

  return { state: 'valid', columns };
}

function sameColumns(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && actual.every((c, i) => c === expected[i]);
}

export function describeVerdict(target: IndexTarget, verdict: IndexVerdict): string {
  switch (verdict.state) {
    case 'valid':
      return `${target.indexName}: valid unique index on ${target.table}(${verdict.columns.join(', ')})`;
    case 'missing':
      return `${target.indexName}: not present`;
    default:
      return `${target.indexName}: ${verdict.reason}`;
  }
}
