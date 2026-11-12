import { runCmsAbandonedUploadCleanupTick, type CmsAbandonedUploadCleanupTickDeps } from './abandonedUploadWorker';

// Abandoned-upload cleanup poll loop, modeled directly on ./pollLoop.ts
// (itself modeled on ../reconciliation/pollLoop.ts): a long-running,
// in-process polling loop -- no queue, no broker, no separate scheduler
// service. One tick runs to completion before the next sleep begins.
// Deliberately a SEPARATE poll loop from ./pollLoop.ts's obsolete-object
// cleanup, not a change to it -- see ./abandonedUploadWorker.ts's own
// doc comment for why.
// -----------------------------------------------------------------------
// CADENCE/BATCH SIZE ARE ENGINEERING DEFAULTS, NOT GOVERNED VALUES, for
// the same reason ./pollLoop.ts's own constants are: CMS-PO-010(R2)-G
// approves the 24-hour abandoned-upload policy itself, not a polling
// interval or batch size.
// -----------------------------------------------------------------------

export const DEFAULT_CMS_ABANDONED_UPLOAD_CLEANUP_POLL_INTERVAL_MS = 60 * 60 * 1000;
export const DEFAULT_CMS_ABANDONED_UPLOAD_CLEANUP_BATCH_SIZE = 100;

export interface CmsAbandonedUploadCleanupPollLoopDeps extends CmsAbandonedUploadCleanupTickDeps {
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

/** Runs CMS abandoned-upload cleanup until `signal` aborts. A tick that throws is logged; the loop continues to its next scheduled tick. */
export async function runCmsAbandonedUploadCleanupPollLoop(
  deps: CmsAbandonedUploadCleanupPollLoopDeps,
  signal: AbortSignal,
): Promise<void> {
  const sleep = deps.sleep ?? defaultSleep;

  while (!signal.aborted) {
    try {
      await runCmsAbandonedUploadCleanupTick(deps);
    } catch (cause) {
      console.error(
        JSON.stringify({ event: 'cms_cleanup.abandoned_upload.tick_failed', error: describeError(cause) }),
      );
    }

    if (signal.aborted) return;
    await sleep(deps.pollIntervalMs, signal);
  }
}
