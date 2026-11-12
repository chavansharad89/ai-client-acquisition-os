import { runCmsObsoleteObjectCleanupTick, type CmsObsoleteObjectCleanupTickDeps } from './worker';

// CMS obsolete-object cleanup poll loop, modeled directly on
// ../reconciliation/pollLoop.ts: a long-running, in-process polling
// loop -- no queue, no broker, no separate scheduler service. One tick
// runs to completion before the next sleep begins.
// -----------------------------------------------------------------------
// CADENCE/BATCH SIZE ARE ENGINEERING DEFAULTS, NOT GOVERNED VALUES.
// CMS-PO-010(R2)-G approves the 30-day retention policy and the
// mandatory reference check; it does not specify a polling interval or
// batch size, and no other record does either (the same situation
// ../reconciliation/pollLoop.ts documents for its own cadence). An
// hourly tick is far more frequent than this policy needs (retention
// windows are measured in days), chosen only so a newly-expired row
// never waits long after crossing its deadline.
// -----------------------------------------------------------------------

export const DEFAULT_CMS_OBSOLETE_OBJECT_CLEANUP_POLL_INTERVAL_MS = 60 * 60 * 1000;
export const DEFAULT_CMS_OBSOLETE_OBJECT_CLEANUP_BATCH_SIZE = 100;

export interface CmsObsoleteObjectCleanupPollLoopDeps extends CmsObsoleteObjectCleanupTickDeps {
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

/** Runs CMS obsolete-object cleanup until `signal` aborts. A tick that throws is logged; the loop continues to its next scheduled tick. */
export async function runCmsObsoleteObjectCleanupPollLoop(
  deps: CmsObsoleteObjectCleanupPollLoopDeps,
  signal: AbortSignal,
): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;

  while (!signal.aborted) {
    try {
      await runCmsObsoleteObjectCleanupTick(deps);
    } catch (cause) {
      console.error(
        JSON.stringify({ event: 'cms_cleanup.obsolete.tick_failed', error: describeError(cause) }),
      );
    }

    if (signal.aborted) return;
    await sleep(deps.pollIntervalMs, signal);
  }
}
