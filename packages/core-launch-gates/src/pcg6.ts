import { evaluatePcg1 } from './pcg1';
import { buildRatioResult } from './ratio';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

// PCG-6 — reviewed rate (monitoring, not a launch blocker).
// -----------------------------------------------------------------------
// B-8: numerator = the B-1 reviewed-event population (funnel_events
// 'opportunity_reviewed'); denominator = the B-5 activation/search
// population — which this governing decision defines as PCG-1's own
// population, NOT an "exposure population" (an earlier, mistaken W-10
// wording this deliberately does not follow). Reusing evaluatePcg1's
// query directly is therefore correct here, not a shortcut — the
// governing decision IS "PCG-6's denominator is PCG-1's population."
// -----------------------------------------------------------------------

export async function evaluatePcg6(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const [activation, { rows: reviewedRows }] = await Promise.all([
    evaluatePcg1(sql, window, now),
    sql.query(
      `SELECT count(*)::int AS n
         FROM funnel_events
        WHERE event_name = 'opportunity_reviewed'
          AND occurred_at >= $1 AND occurred_at < $2`,
      [window.start, window.end],
    ),
  ]);

  const denominator = activation.numerator ?? 0;
  const numerator = (reviewedRows[0] as { n: number }).n;
  return buildRatioResult('PCG-6', window, now, numerator, denominator);
}
