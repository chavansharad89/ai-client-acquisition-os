import { DEFAULT_SCHEMA, duplicatePreflightSql, type SqlExecutor } from './sql';
import type { IndexTarget } from './targets';

export interface DuplicateSample {
  values: Record<string, unknown>;
  recordCount: number;
}

export interface PreflightResult {
  target: IndexTarget;
  clean: boolean;
  /** Capped sample — enough to act on without dumping the table. */
  duplicates: readonly DuplicateSample[];
  totalOffendingRows: number;
}

/**
 * Read-only check for rows that would make the unique build fail.
 *
 * Running this first matters because CREATE UNIQUE INDEX CONCURRENTLY
 * does not fail fast: it completes its first pass, does its second pass,
 * and only then errors — leaving an INVALID index behind. Catching the
 * duplicates up front converts a messy half-built index into a clean
 * refusal to start.
 */
export async function duplicatePreflight(
  executor: SqlExecutor,
  target: IndexTarget,
  limit = 20,
  schema: string = DEFAULT_SCHEMA,
): Promise<PreflightResult> {
  const { rows } = await executor.query(duplicatePreflightSql(target, limit, schema));
  const duplicates = (rows as Record<string, unknown>[]).map((row) => {
    const values: Record<string, unknown> = {};
    for (const column of target.columns) values[column] = row[column];
    return { values, recordCount: Number(row.record_count) };
  });
  return {
    target,
    clean: duplicates.length === 0,
    duplicates,
    totalOffendingRows: duplicates.reduce((sum, d) => sum + d.recordCount, 0),
  };
}

export function formatPreflight(result: PreflightResult): string {
  if (result.clean) return `${result.target.indexName}: preflight clean`;
  const lines = result.duplicates.map((d) => `      ${JSON.stringify(d.values)} x${d.recordCount}`);
  return [
    `${result.target.indexName}: ${result.duplicates.length} duplicate group(s), ` +
      `${result.totalOffendingRows} row(s) — unique build would fail`,
    ...lines,
  ].join('\n');
}
