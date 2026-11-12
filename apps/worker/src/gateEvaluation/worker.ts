import {
  evaluateAllGates as evaluateAllGatesImpl,
  writeProductionSnapshot as writeProductionSnapshotImpl,
  type GateId,
  type GateResult,
  type SqlExecutor,
} from '@acos/core-launch-gates';

// Gate evaluation tick (PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001 §3).
// -----------------------------------------------------------------------
// One tick: evaluate every named gate against the most recent closed
// window (evaluateAllGates, unmodified), then persist a PRODUCTION
// snapshot per result (writeProductionSnapshot, unmodified). Neither
// function is reimplemented here — this module is only a caller.
//
// `evaluateAllGates`/`writeProductionSnapshot` are injectable (default to
// the real @acos/core-launch-gates implementations) purely so the tick's
// own orchestration — does it call evaluate-then-write, in order, for
// every result? — is unit-testable without a real Postgres connection,
// mirroring how ./pollLoop.ts injects `sleep`/`now`. Production callers
// (apps/worker/src/index.ts) never override these two.
//
// Idempotency: writeProductionSnapshot already performs
// `INSERT ... ON CONFLICT (gate, window_start, window_end,
// computation_path) DO UPDATE` (migration 0035's unique index) — a
// repeat tick for an already-evaluated window updates the existing row
// in place rather than throwing a constraint violation or duplicating a
// row. No additional catch/retry logic is needed here for that case.
// -----------------------------------------------------------------------

export interface GateEvaluationTickDeps {
  sql: SqlExecutor;
  now?: () => Date;
  evaluateAllGates?: (sql: SqlExecutor, now: Date) => Promise<GateResult[]>;
  writeProductionSnapshot?: (sql: SqlExecutor, result: GateResult) => Promise<void>;
}

export interface GateEvaluationTickOutcome {
  evaluated: GateId[];
}

/** Runs exactly one gate-evaluation tick: evaluate all gates, then persist a PRODUCTION snapshot per result. */
export async function runGateEvaluationTick(deps: GateEvaluationTickDeps): Promise<GateEvaluationTickOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const evaluateAllGates = deps.evaluateAllGates ?? evaluateAllGatesImpl;
  const writeProductionSnapshot = deps.writeProductionSnapshot ?? writeProductionSnapshotImpl;

  const results = await evaluateAllGates(deps.sql, now);
  for (const result of results) {
    await writeProductionSnapshot(deps.sql, result);
  }

  console.log(
    JSON.stringify({
      event: 'gateEvaluation.tick.completed',
      now: now.toISOString(),
      window: results[0] ? { start: results[0].window.start, end: results[0].window.end } : null,
      gates: results.map((result) => ({ gate: result.gate, status: result.status })),
    }),
  );

  return { evaluated: results.map((result) => result.gate) };
}
