import { PRODUCT_CATALOG } from '@acos/catalog';

import { evaluateTierConversion } from './pcg3';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

/** Tier B: ai_client_acquisition_1499 (₹1,499). */
const TIER_B_PRODUCT_ID = PRODUCT_CATALOG.ai_client_acquisition_1499.id;

export async function evaluatePcg3b(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  return evaluateTierConversion('PCG-3B', TIER_B_PRODUCT_ID, sql, window, now);
}
