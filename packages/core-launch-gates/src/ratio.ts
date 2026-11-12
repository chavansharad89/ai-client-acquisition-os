import type { GateId, GateResult } from './types';
import type { GateWindow } from './window';
import { isClosed } from './window';

/**
 * Shared "no sample floor" (B-9) result-shaping: NOT_YET_EVALUABLE means
 * exactly "window not closed yet" or "denominator is zero" — never an
 * arbitrary minimum N.
 */
export function buildRatioResult(
  gate: GateId,
  window: GateWindow,
  now: Date,
  numerator: number,
  denominator: number,
  diagnostics?: Record<string, unknown>,
): GateResult {
  if (!isClosed(window, now)) {
    return { gate, window, status: 'NOT_YET_EVALUABLE', ...(diagnostics ? { diagnostics } : {}) };
  }
  if (denominator === 0) {
    return {
      gate,
      window,
      status: 'NOT_YET_EVALUABLE',
      numerator,
      denominator,
      ...(diagnostics ? { diagnostics } : {}),
    };
  }
  return {
    gate,
    window,
    status: 'EVALUATED',
    numerator,
    denominator,
    value: numerator / denominator,
    ...(diagnostics ? { diagnostics } : {}),
  };
}

/**
 * For the two pure-population gates (PCG-1, PCG-2 — a count, not a
 * ratio against anything). The ONLY thing that makes such a gate
 * NOT_YET_EVALUABLE is an unclosed window; a closed window with a count
 * of zero is still a real, evaluated answer (zero demonstrated-intent
 * events in 30 days is information, not "insufficient sample" — B-9
 * forbids treating any count as too small to report).
 */
export function buildCountResult(
  gate: GateId,
  window: GateWindow,
  now: Date,
  count: number,
  diagnostics?: Record<string, unknown>,
): GateResult {
  if (!isClosed(window, now)) {
    return { gate, window, status: 'NOT_YET_EVALUABLE', ...(diagnostics ? { diagnostics } : {}) };
  }
  return {
    gate,
    window,
    status: 'EVALUATED',
    numerator: count,
    ...(diagnostics ? { diagnostics } : {}),
  };
}
