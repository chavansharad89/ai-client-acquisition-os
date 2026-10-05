import { buildCountResult } from './ratio';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

// PCG-2 — payment-capture population.
// -----------------------------------------------------------------------
// Anchor = payment-capture timestamp (payments.created_at, the row
// upsertCapturedPayment() writes at CAPTURED status — @acos/core-payments
// never backdates it). Refunded buyers still count toward PCG-2, and the
// count is immutable after window close: a refund processed later never
// removes the original capture from the window it happened in — this
// query only ever reads payments.created_at, never refund_events, so a
// later refund cannot change this gate's answer for a closed window.
// -----------------------------------------------------------------------

export async function evaluatePcg2(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const { rows } = await sql.query(
    `SELECT count(*)::int AS n
       FROM payments
      WHERE status = 'CAPTURED' AND created_at >= $1 AND created_at < $2`,
    [window.start, window.end],
  );
  const count = (rows[0] as { n: number }).n;
  return buildCountResult('PCG-2', window, now, count);
}
