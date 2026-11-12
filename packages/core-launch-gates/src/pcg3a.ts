import { PRODUCT_CATALOG } from '@acos/catalog';

import { evaluateTierConversion } from './pcg3';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

/** Tier A: ai_freelancing_499 (₹499). */
const TIER_A_PRODUCT_ID = PRODUCT_CATALOG.ai_freelancing_499.id;

export async function evaluatePcg3a(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  return evaluateTierConversion('PCG-3A', TIER_A_PRODUCT_ID, sql, window, now);
}
