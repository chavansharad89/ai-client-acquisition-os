import { PRODUCT_CATALOG } from '@acos/catalog';

import { evaluatePcg3a } from './pcg3a';
import { evaluatePcg3b } from './pcg3b';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';
import { isClosed } from './window';

const TIER_A_PRODUCT_ID = PRODUCT_CATALOG.ai_freelancing_499.id;
const TIER_B_PRODUCT_ID = PRODUCT_CATALOG.ai_client_acquisition_1499.id;

/**
 * Dual-tier counting (governance's explicit instruction, between PCG-3B
 * and PCG-4): "combined population counts a person once; tier
 * diagnostics may attribute the same person to both tier buckets" — and
 * per-tier diagnostics "cannot independently block launch."
 *
 * PCG-3A and PCG-3B are each named, individually-listed mandatory launch
 * blockers (governance's PDEF-4 launch policy) — this function does NOT
 * reinterpret that by inventing a third "real" blocking gate out of
 * "combined." It returns the combined, once-per-person view as an
 * explicitly non-blocking supplementary figure, with PCG-3A/PCG-3B's
 * own results attached for diagnostic cross-reference — exactly the
 * relationship governance describes, without assigning it a GateId of
 * its own (deliberately NOT a GateResult: nothing should mistake this
 * for a seventh official gate).
 */
export interface CombinedTierConversion {
  window: GateWindow;
  status: 'EVALUATED' | 'NOT_YET_EVALUABLE';
  numerator?: number;
  denominator?: number;
  value?: number;
  perTier: { 'PCG-3A': GateResult; 'PCG-3B': GateResult };
}

export async function evaluateCombinedTierConversion(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<CombinedTierConversion> {
  const [tierA, tierB] = await Promise.all([
    evaluatePcg3a(sql, window, now),
    evaluatePcg3b(sql, window, now),
  ]);
  const perTier = { 'PCG-3A': tierA, 'PCG-3B': tierB } as const;

  if (!isClosed(window, now)) {
    return { window, status: 'NOT_YET_EVALUABLE', perTier };
  }

  const [{ rows: exposureRows }, { rows: purchaseRows }] = await Promise.all([
    sql.query(
      `SELECT count(DISTINCT visitor_id)::int AS n
         FROM funnel_events
        WHERE event_name = 'upsell_viewed' AND subject_id = ANY($1::text[])
          AND occurred_at >= $2 AND occurred_at < $3`,
      [[TIER_A_PRODUCT_ID, TIER_B_PRODUCT_ID], window.start, window.end],
    ),
    sql.query(
      `SELECT count(DISTINCT lower(o.customer_email))::int AS n
         FROM payments p
         JOIN orders o ON o.id = p.order_id
        WHERE p.status = 'CAPTURED' AND o.product_slug = ANY($1::text[])
          AND p.created_at >= $2 AND p.created_at < $3`,
      [[TIER_A_PRODUCT_ID, TIER_B_PRODUCT_ID], window.start, window.end],
    ),
  ]);

  const denominator = (exposureRows[0] as { n: number }).n;
  if (denominator === 0) {
    return { window, status: 'NOT_YET_EVALUABLE', numerator: 0, denominator, perTier };
  }
  const numerator = (purchaseRows[0] as { n: number }).n;
  return { window, status: 'EVALUATED', numerator, denominator, value: numerator / denominator, perTier };
}
