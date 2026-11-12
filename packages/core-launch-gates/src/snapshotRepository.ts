import { randomUUID } from 'node:crypto';

import type { GateResult, SqlExecutor } from './types';

// Evidence-bundle persistence (ED-13), authorized under
// CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// One row per (gate, window, computation_path) — migration 0035's unique
// index makes re-running a closed window's computation idempotent rather
// than piling up duplicate snapshot rows. computation_path is always
// 'PRODUCTION' from this package; @acos/core-launch-gates-validation
// writes 'VALIDATION' rows through its own, independent code path.
// -----------------------------------------------------------------------

export async function writeProductionSnapshot(sql: SqlExecutor, result: GateResult): Promise<void> {
  await sql.query(
    `INSERT INTO gate_evaluation_snapshots
       (id, gate, window_start, window_end, computation_path, result)
     VALUES ($1, $2, $3, $4, 'PRODUCTION', $5)
     ON CONFLICT (gate, window_start, window_end, computation_path)
     DO UPDATE SET result = EXCLUDED.result, computed_at = now()`,
    [randomUUID(), result.gate, result.window.start, result.window.end, JSON.stringify(result)],
  );
}
