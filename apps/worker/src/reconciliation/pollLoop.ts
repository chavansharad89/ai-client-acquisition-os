import { runReconciliationTick, type ReconciliationTickDeps } from './worker';

// Reconciliation poll loop, modeled directly on
// ../gateEvaluation/pollLoop.ts: a long-running, in-process polling
// loop — no queue, no broker, no separate scheduler service. One tick
// runs to completion before the next sleep begins.
// -----------------------------------------------------------------------
// CADENCE IS AN ENGINEERING DEFAULT, NOT A GOVERNED VALUE. DEC-010 item 6
// decided reconciliation is launch-blocking; it does not specify a
// polling interval or an eligibility age, and no other record does
// either (unlike the gate-evaluation loop's cadence, which ED-DEC-001
// §3 item 2 explicitly set). Five minutes/fifteen minutes below are
// this delivery's engineering choice, following the same "fixed in-code
// constant, not an environment variable" shape gate-evaluation already
// uses — revisit via a real engineering-decision record if a different
// cadence turns out to matter operationally.
// -----------------------------------------------------------------------

export const DEFAULT_RECONCILIATION_POLL_INTERVAL_MS = 5 * 60 * 1000;
export const DEFAULT_RECONCILIATION_ELIGIBILITY_AGE_MS = 15 * 60 * 1000;
export const DEFAULT_RECONCILIATION_BATCH_SIZE = 100;

export interface ReconciliationPollLoopDeps extends ReconciliationTickDeps {
  pollIntervalMs: number;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

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
  return cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
}

/** Runs reconciliation until `signal` aborts. A tick that throws is logged; the loop continues to its next scheduled tick. */
export async function runReconciliationPollLoop(
  deps: ReconciliationPollLoopDeps,
  signal: AbortSignal,
): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;

  while (!signal.aborted) {
    try {
      await runReconciliationTick(deps);
    } catch (cause) {
      console.error(
        JSON.stringify({ event: 'reconciliation.tick.failed', error: describeError(cause) }),
      );
    }

    if (signal.aborted) return;
    await sleep(deps.pollIntervalMs, signal);
  }
}
