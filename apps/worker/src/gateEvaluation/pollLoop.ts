import { runGateEvaluationTick, type GateEvaluationTickDeps } from './worker';

// Gate-evaluation poll loop (PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001
// §1/§3), modeled directly on ../searchWorker/pollLoop.ts's
// `runSearchWorkerPollLoop`: a long-running, in-process polling loop —
// no queue, no broker, no separate scheduler service. One tick runs to
// completion (success or logged failure) before the next sleep begins,
// so by construction at most one tick is ever in flight — no explicit
// lock or lease is needed, unlike the Search worker's claim, because
// this loop has no competing worker instances to fence against.
// -----------------------------------------------------------------------

export interface GateEvaluationPollLoopDeps extends GateEvaluationTickDeps {
  /** Delay between ticks. Engineering default (ED-DEC-001 §3 item 2): once per day. */
  pollIntervalMs: number;
  /** Injectable for deterministic tests. Receives the signal so a test can resolve immediately on shutdown. */
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

/** Once per day — matches GATE_WINDOW_DAYS' own granularity; re-running more often is harmless but wasteful. */
export const DEFAULT_GATE_EVALUATION_POLL_INTERVAL_MS = 24 * 60 * 60 * 1000;

const defaultSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });

function describeError(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}

/**
 * Runs gate evaluation until `signal` aborts (graceful shutdown).
 *
 * Each iteration: run exactly one tick, then sleep `pollIntervalMs`
 * before the next one. A tick that throws is logged and the loop
 * continues to its next scheduled tick — retry-on-next-tick, the same
 * property the Search worker's own poll loop already relies on, with no
 * special-cased backoff logic.
 */
export async function runGateEvaluationPollLoop(
  deps: GateEvaluationPollLoopDeps,
  signal: AbortSignal,
): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;

  while (!signal.aborted) {
    try {
      await runGateEvaluationTick(deps);
    } catch (cause) {
      console.error(
        JSON.stringify({ event: 'gateEvaluation.tick.failed', error: describeError(cause) }),
      );
    }

    if (signal.aborted) return;
    await sleep(deps.pollIntervalMs, signal);
  }
}
