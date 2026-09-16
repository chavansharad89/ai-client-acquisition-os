import type { CasePersistOutcome, ReconciliationCase } from './types';

// Persistence boundary — the ONLY table this package may write.
// -----------------------------------------------------------------------
// idempotency_reconciliations and nothing else. Business tables are read
// through ReadOnlyQueryExecutor in detection.ts and are never routed here.
// -----------------------------------------------------------------------

export interface ReconciliationRepository {
  /**
   * Upserts one case on (record_type, duplicate_key).
   *
   * On conflict the count and snapshot are refreshed but `status` is
   * deliberately left alone: re-running detection must not drag a case a
   * human already moved to IN_REVIEW or RESOLVED back to OPEN. That makes
   * repeated runs idempotent in the sense that matters — no new rows, no
   * lost triage.
   */
  upsertCase(input: ReconciliationCase, now: Date): Promise<CasePersistOutcome>;
}

export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export function createPgReconciliationRepository(sql: SqlExecutor): ReconciliationRepository {
  return {
    async upsertCase(input, now) {
      // `xmax = 0` is Postgres' standard tell for "this row was inserted
      // by this statement" rather than updated by the DO UPDATE branch.
      const { rows } = await sql.query(
        `INSERT INTO idempotency_reconciliations
           (id, record_type, duplicate_key, snapshot, record_count, status, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3::jsonb, $4, 'OPEN', $5, $5)
         ON CONFLICT (record_type, duplicate_key) DO UPDATE
            SET record_count = EXCLUDED.record_count,
                snapshot     = EXCLUDED.snapshot,
                updated_at   = EXCLUDED.updated_at
         RETURNING (xmax = 0) AS inserted`,
        [
          input.recordType,
          input.duplicateKey,
          JSON.stringify(input.snapshot),
          input.recordCount,
          now,
        ],
      );
      const inserted = (rows[0] as { inserted: boolean } | undefined)?.inserted === true;
      return inserted ? 'created' : 'updated';
    },
  };
}
