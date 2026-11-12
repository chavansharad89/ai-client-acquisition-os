import { buildRatioResult } from './ratio';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

// PCG-5 — refund rate (monitoring, not a launch blocker).
// -----------------------------------------------------------------------
// Transaction-based binary treatment (B-6): a payment either had a
// refund_events row in the window or it did not — partial and full
// refunds count identically, which is why this query does not read
// refund_type at all.
//
// Denominator = captured payments in the window (the transaction
// population a refund rate is computed over).
// Numerator = of those, how many have at least one refund_events row.
//
// Immutability-after-close (PCG-5's own rule, decision #8): both this
// query's own window AND the refund's occurred_at are bounded the same
// way — a refund that happens after this window has closed is simply
// not visible to this query (it belongs to whichever window it actually
// occurred in), so re-running this exact query after close always
// reproduces the same answer. A refund that reverses (correction) BEFORE
// close changes the row this query reads; the correction rule is "this
// query always reflects current refund_events state for timestamps
// inside the window," not a special case in the SQL.
// -----------------------------------------------------------------------

export async function evaluatePcg5(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const { rows } = await sql.query(
    `SELECT
        count(*)::int AS denominator,
        count(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM refund_events r
           WHERE r.payment_id = p.id
             AND r.occurred_at >= $1 AND r.occurred_at < $2
        ))::int AS numerator
      FROM payments p
     WHERE p.status = 'CAPTURED' AND p.created_at >= $1 AND p.created_at < $2`,
    [window.start, window.end],
  );
  const row = rows[0] as { denominator: number; numerator: number };
  return buildRatioResult('PCG-5', window, now, row.numerator, row.denominator);
}
