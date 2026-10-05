import { PRODUCT_CATALOG } from '@acos/catalog';
import { buildCountResult, buildRatioResult, mostRecentClosedWindow, type GateResult, type GateWindow } from '@acos/core-launch-gates';

// Independent validation (ED-12), authorized under
// CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// Every population query below is written FRESH against the raw tables —
// different SQL shape, different join direction, sometimes a genuinely
// different derivation (see evaluatePcg3Independent's first-exposure
// recomputation, which does not trust the dedupe-index assumption the
// production query relies on) — never a call into @acos/core-launch-
// gates' own pcg1.ts..pcg6.ts functions. The ONLY thing imported from
// that package is mostRecentClosedWindow/buildCountResult/
// buildRatioResult: shared AXIOMS (what a window's boundaries are, and
// the shared "no sample floor" result-shaping rule) that both
// computations must agree on by definition — not population logic,
// which stays fully independent.
//
// Scope: only the four blocker gates requiring pre-launch independent
// validation (PCG-1, PCG-2, PCG-3A, PCG-3B) — PCG-4/5/6 are monitoring
// gates that do not require this.
// -----------------------------------------------------------------------

export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

const TIER_A_PRODUCT_ID = PRODUCT_CATALOG.ai_freelancing_499.id;
const TIER_B_PRODUCT_ID = PRODUCT_CATALOG.ai_client_acquisition_1499.id;

export async function recomputePcg1(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const { rows } = await sql.query(
    `WITH window_orders AS (
       SELECT id FROM orders WHERE created_at >= $1 AND created_at < $2
     )
     SELECT count(*)::int AS n FROM window_orders`,
    [window.start, window.end],
  );
  return buildCountResult('PCG-1', window, now, (rows[0] as { n: number }).n);
}

export async function recomputePcg2(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const { rows } = await sql.query(
    `SELECT count(id)::int AS n
       FROM payments
      WHERE created_at >= $1 AND created_at < $2 AND status = 'CAPTURED'`,
    [window.start, window.end],
  );
  return buildCountResult('PCG-2', window, now, (rows[0] as { n: number }).n);
}

async function recomputeTierConversion(
  gate: 'PCG-3A' | 'PCG-3B',
  productId: string,
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  // Re-derives "first exposure" from MIN(occurred_at) per visitor,
  // rather than trusting that migration 0031's unique index already
  // guarantees one row per visitor — this would catch a dedupe-index
  // bug the production query structurally cannot see.
  const [{ rows: exposureRows }, { rows: purchaseRows }] = await Promise.all([
    sql.query(
      `WITH first_exposures AS (
         SELECT visitor_id, min(occurred_at) AS first_seen
           FROM funnel_events
          WHERE event_name = 'upsell_viewed' AND subject_id = $1
          GROUP BY visitor_id
       )
       SELECT count(*)::int AS n FROM first_exposures WHERE first_seen >= $2 AND first_seen < $3`,
      [productId, window.start, window.end],
    ),
    sql.query(
      `SELECT count(*)::int AS n FROM orders o
        WHERE o.product_slug = $1
          AND o.id IN (
            SELECT order_id FROM payments
             WHERE status = 'CAPTURED' AND created_at >= $2 AND created_at < $3
          )`,
      [productId, window.start, window.end],
    ),
  ]);
  const denominator = (exposureRows[0] as { n: number }).n;
  const numerator = (purchaseRows[0] as { n: number }).n;
  return buildRatioResult(gate, window, now, numerator, denominator);
}

export async function recomputePcg3a(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  return recomputeTierConversion('PCG-3A', TIER_A_PRODUCT_ID, sql, window, now);
}

export async function recomputePcg3b(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  return recomputeTierConversion('PCG-3B', TIER_B_PRODUCT_ID, sql, window, now);
}

/** Recomputes every blocker gate requiring pre-launch independent validation, against the most recent closed window. */
export async function recomputeBlockerGates(sql: SqlExecutor, now: Date): Promise<GateResult[]> {
  const window = mostRecentClosedWindow(now);
  return Promise.all([
    recomputePcg1(sql, window, now),
    recomputePcg2(sql, window, now),
    recomputePcg3a(sql, window, now),
    recomputePcg3b(sql, window, now),
  ]);
}
