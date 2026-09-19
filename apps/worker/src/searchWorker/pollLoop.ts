import { claimAndProcessNextSearch, type SearchWorkerDeps } from './worker';

// Search worker scheduling (R-34, Phase 17 scope-lock RESOLVED DECISIONS
// §3): a long-running, in-process PostgreSQL polling loop — no queue, no
// broker, no separate scheduler service. The worker itself is the
// scheduler; concurrency safety comes entirely from
// SearchRepository.claimNextPending's `FOR UPDATE SKIP LOCKED`.
// -----------------------------------------------------------------------

export interface SearchWorkerPollLoopDeps extends SearchWorkerDeps {
  /** Delay before the next claim attempt when nothing was eligible to claim. */
  pollIntervalMs: number;
  /** Injectable for deterministic tests. Receives the signal so a test can resolve immediately on shutdown. */
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

/**
 * Runs the Search worker until `signal` aborts (graceful shutdown).
 *
 * Each iteration: release any Search whose RUNNING lease has expired
 * (recovers a crashed worker's row), then attempt to claim and process
 * exactly one Search. Only waits `pollIntervalMs` when there was nothing
 * to claim — a backlog is drained without an artificial delay between
 * rows.
 */
export async function runSearchWorkerPollLoop(
  deps: SearchWorkerPollLoopDeps,
  signal: AbortSignal,
): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? (() => new Date());

  while (!signal.aborted) {
    await deps.searches.releaseExpiredLeases({ now: now() });
    if (signal.aborted) return;

    const outcome = await claimAndProcessNextSearch(deps);
    if (signal.aborted) return;

    if (outcome.outcome === 'empty') {
      await sleep(deps.pollIntervalMs, signal);
    }
  }
}
