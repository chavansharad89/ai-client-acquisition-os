import { buildRatioResult } from './ratio';
import type { GateId, GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

// PCG-3A/3B — tier exposure-to-purchase conversion.
// -----------------------------------------------------------------------
// Tier identity = the existing server-resolved productId from
// app/upsell/[productId]/page.tsx — @acos/catalog's ai_freelancing_499
// (₹499, tier A) and ai_client_acquisition_1499 (₹1,499, tier B). No
// separate analytics-only ₹1,499 component is invented (explicit
// governance instruction).
//
// Denominator = first-exposure count for this tier in the window: each
// funnel_events row for 'upsell_viewed'/this productId already IS a
// first exposure (migration 0031's partial unique index guarantees at
// most one row per visitor per productId, ever), so counting rows whose
// occurred_at falls in THIS window counts exactly the visitors whose
// first exposure happened here — "exposure start = first exposure".
//
// Numerator = captured payments for this tier's product in the window.
// Refunded purchases remain counted (this reads payments.created_at,
// never refund_events) — immutable after window close for the same
// reason PCG-2 is.
// -----------------------------------------------------------------------

export async function evaluateTierConversion(
  gate: GateId,
  productId: string,
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const [{ rows: exposureRows }, { rows: purchaseRows }] = await Promise.all([
    sql.query(
      `SELECT count(*)::int AS n
         FROM funnel_events
        WHERE event_name = 'upsell_viewed' AND subject_id = $1
          AND occurred_at >= $2 AND occurred_at < $3`,
      [productId, window.start, window.end],
    ),
    sql.query(
      `SELECT count(*)::int AS n
         FROM payments p
         JOIN orders o ON o.id = p.order_id
        WHERE p.status = 'CAPTURED' AND o.product_slug = $1
          AND p.created_at >= $2 AND p.created_at < $3`,
      [productId, window.start, window.end],
    ),
  ]);
  const denominator = (exposureRows[0] as { n: number }).n;
  const numerator = (purchaseRows[0] as { n: number }).n;
  return buildRatioResult(gate, window, now, numerator, denominator);
}
