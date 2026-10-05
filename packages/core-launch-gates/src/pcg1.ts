import { buildCountResult } from './ratio';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

// PCG-1 — demonstrated-intent population (B-11a/B-11b/B-11c).
// -----------------------------------------------------------------------
// Eligibility = funnel entry + demonstrated intent, no additional
// criterion (no tier split — "one aggregate PCG-1 count shared across
// tiers"). Evidence is the server-authoritative PENDING Order row itself
// (POST /api/payments/create-order), anchored on Order.createdAt. Per
// B-11c, this reads ONLY the orders table — no funnel_events
// involvement, because the Order row IS the evidence.
// -----------------------------------------------------------------------

export async function evaluatePcg1(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const { rows } = await sql.query(
    `SELECT count(*)::int AS n FROM orders WHERE created_at >= $1 AND created_at < $2`,
    [window.start, window.end],
  );
  const count = (rows[0] as { n: number }).n;
  return buildCountResult('PCG-1', window, now, count);
}
