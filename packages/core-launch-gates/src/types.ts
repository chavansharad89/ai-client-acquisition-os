import type { GateWindow } from './window';

export const GATE_IDS = ['PCG-1', 'PCG-2', 'PCG-3A', 'PCG-3B', 'PCG-4', 'PCG-5', 'PCG-6'] as const;
export type GateId = (typeof GATE_IDS)[number];

export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

/**
 * No numeric sample floor anywhere (B-9) — NOT_YET_EVALUABLE means
 * exactly "the window is not closed yet, or the denominator is zero",
 * never an arbitrary minimum N.
 */
export type GateStatus = 'EVALUATED' | 'NOT_YET_EVALUABLE';

export interface GateResult {
  gate: GateId;
  window: GateWindow;
  status: GateStatus;
  /** Present only when status is 'EVALUATED'. */
  numerator?: number;
  denominator?: number;
  /** numerator/denominator when both are present and denominator > 0. */
  value?: number;
  /** Non-blocking context — e.g. PCG-3A/3B's per-tier diagnostic breakdown. Never used to decide status. */
  diagnostics?: Record<string, unknown>;
}
