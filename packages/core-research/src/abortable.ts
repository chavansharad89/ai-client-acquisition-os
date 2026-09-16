/**
 * A sleep that can be cancelled, and that leaks nothing either way.
 *
 * WHY THIS EXISTS. The retry loop's backoff was
 * `new Promise((r) => setTimeout(r, ms))`. Three things are wrong with
 * that in a request path:
 *
 *   - it cannot be interrupted, so a caller who has already given up
 *     still holds a request open for the full delay;
 *   - it keeps the event loop alive, so a process asked to shut down
 *     waits for it before exiting; and
 *   - with a 30s cap and three attempts, the wait is a minute of doing
 *     nothing, which is long enough for a client, a load balancer and a
 *     reverse proxy to have independently timed out.
 *
 * THE LEAK THAT IS EASY TO MISS is not the timer — most implementations
 * remember to clearTimeout. It is the abort LISTENER: attaching one to a
 * long-lived signal and never removing it means every sleep in a loop
 * accumulates a listener on the same signal, and Node warns about it at
 * eleven. Both are removed on every path here.
 */
export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return signal?.aborted ? Promise.reject(abortError(signal)) : Promise.resolve();
  if (signal?.aborted) return Promise.reject(abortError(signal));

  return new Promise<void>((resolve, reject) => {
    let onAbort: (() => void) | undefined;

    const timer = setTimeout(() => {
      if (onAbort && signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    if (signal) {
      onAbort = () => {
        clearTimeout(timer);
        reject(abortError(signal));
      };
      // `once` so the listener detaches itself if abort fires; the
      // removeEventListener above covers the other path.
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

function abortError(signal: AbortSignal): Error {
  const reason: unknown = signal.reason;
  return reason instanceof Error ? reason : new Error('aborted');
}

/** Wall-clock budget for a whole operation, independent of any signal. */
export class Deadline {
  private readonly startedAt: number;
  private readonly budgetMs: number | undefined;

  constructor(budgetMs?: number, now: number = Date.now()) {
    if (budgetMs !== undefined && (!Number.isFinite(budgetMs) || budgetMs <= 0)) {
      throw new RangeError(`deadlineMs must be a positive number, received ${String(budgetMs)}`);
    }
    this.startedAt = now;
    this.budgetMs = budgetMs;
  }

  elapsedMs(now: number = Date.now()): number {
    return now - this.startedAt;
  }

  /** Milliseconds left, or Infinity when no budget was set. */
  remainingMs(now: number = Date.now()): number {
    if (this.budgetMs === undefined) return Number.POSITIVE_INFINITY;
    return this.budgetMs - this.elapsedMs(now);
  }

  expired(now: number = Date.now()): boolean {
    return this.remainingMs(now) <= 0;
  }

  /**
   * A wait that cannot overrun the budget.
   *
   * Clamping rather than refusing: a 30-second backoff with 2 seconds of
   * budget left should wait the 2 seconds and then fail on the deadline,
   * not skip the wait and hammer a provider that just rate-limited us.
   */
  clamp(ms: number, now: number = Date.now()): number {
    return Math.max(0, Math.min(ms, this.remainingMs(now)));
  }
}
