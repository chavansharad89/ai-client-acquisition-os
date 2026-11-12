import { randomUUID } from 'node:crypto';

import type { GateResult } from '@acos/core-launch-gates';

import type { SqlExecutor } from './recompute';

/** Writes a VALIDATION-path snapshot (ED-13) — the production path's own writer lives in @acos/core-launch-gates and is never called from here. */
export async function writeValidationSnapshot(sql: SqlExecutor, result: GateResult): Promise<void> {
  await sql.query(
    `INSERT INTO gate_evaluation_snapshots
       (id, gate, window_start, window_end, computation_path, result)
     VALUES ($1, $2, $3, $4, 'VALIDATION', $5)
     ON CONFLICT (gate, window_start, window_end, computation_path)
     DO UPDATE SET result = EXCLUDED.result, computed_at = now()`,
    [randomUUID(), result.gate, result.window.start, result.window.end, JSON.stringify(result)],
  );
}
