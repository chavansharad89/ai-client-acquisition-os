import { evaluateCombinedTierConversion } from './combined';
import { evaluatePcg1 } from './pcg1';
import { evaluatePcg2 } from './pcg2';
import { evaluateTierConversion } from './pcg3';
import { evaluatePcg3a } from './pcg3a';
import { evaluatePcg3b } from './pcg3b';
import { evaluatePcg4 } from './pcg4';
import { evaluatePcg5 } from './pcg5';
import { evaluatePcg6 } from './pcg6';
import { buildCountResult, buildRatioResult } from './ratio';
import { writeProductionSnapshot } from './snapshotRepository';
import type { GateResult, SqlExecutor } from './types';
import { mostRecentClosedWindow } from './window';

export { GATE_WINDOW_DAYS, isClosed, mostRecentClosedWindow } from './window';
export type { GateWindow } from './window';

export { GATE_IDS } from './types';
export type { GateId, GateResult, GateStatus, SqlExecutor } from './types';

export {
  buildCountResult,
  buildRatioResult,
  evaluateCombinedTierConversion,
  evaluatePcg1,
  evaluatePcg2,
  evaluatePcg3a,
  evaluatePcg3b,
  evaluatePcg4,
  evaluatePcg5,
  evaluatePcg6,
  evaluateTierConversion,
  writeProductionSnapshot,
};
export type { CombinedTierConversion } from './combined';

/**
 * One entry point: every named gate, evaluated against the most recent
 * closed window.
 *
 * PCG-3B is deliberately NOT evaluated here (COMMERCIAL-PO-18): it was
 * tied to the retired one-time `ai_client_acquisition_1499` product and
 * is retired along with it, rather than redefined around the new
 * subscription SKU. `evaluatePcg3b` itself still exists (unused here)
 * so the underlying measurement is not deleted — see pcg3b.ts.
 */
export async function evaluateAllGates(sql: SqlExecutor, now: Date): Promise<GateResult[]> {
  const window = mostRecentClosedWindow(now);
  return Promise.all([
    evaluatePcg1(sql, window, now),
    evaluatePcg2(sql, window, now),
    evaluatePcg3a(sql, window, now),
    evaluatePcg4(sql, window, now),
    evaluatePcg5(sql, window, now),
    evaluatePcg6(sql, window, now),
  ]);
}
