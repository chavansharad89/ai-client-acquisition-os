// Retry schedule for Meta CAPI delivery.
// -----------------------------------------------------------------------
// Attempt 0 is the immediate first delivery. Every entry below is the
// CAP for the wait that follows the failure which produced that attempt
// count, and the actual wait is drawn uniformly from [0, cap) — "full
// jitter" (AWS Architecture Blog). Jitter matters more than the cap
// here: without it, a Meta outage that fails N events at once would
// retry all N in the same millisecond, reproducing the thundering herd
// that knocked them over.
// -----------------------------------------------------------------------

/**
 * The DEFAULT attempt budget, used when a caller configures none.
 *
 * Named for what it is. It was previously `MAX_ATTEMPTS`, and that name
 * invited the bug it caused: `scheduleRetry` consulted both the caller's
 * `maxAttempts` AND a helper hardwired to this constant, so a configured
 * budget of 8 silently behaved as 5. A value called MAX reads like a
 * ceiling, and someone duly enforced it as one.
 *
 * Kept at 5 deliberately: this is the budget the worker has always
 * actually used, and widening it here would change production behaviour
 * as a side effect of a naming fix.
 */
export const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Upper bound accepted for a configured budget.
 *
 * Not a silent cap — `assertWorkerConfig` REJECTS anything above it
 * rather than clamping, which is the whole difference from the bug being
 * fixed. The number exists because attempts past the retry schedule's
 * last entry all wait the same 60 minutes, so a budget of 200 is not a
 * retry policy, it is an event that keeps failing for a week.
 */
export const MAX_CONFIGURABLE_ATTEMPTS = 20;

/** Lease duration. A worker that dies holds a row for at most this long. */
export const LEASE_DURATION_MS = 5 * 60 * 1000;

/** Indexed by post-increment attempt count; index 0 is the immediate first send. */
/**
 * Per-attempt delay caps. Attempts beyond the last entry reuse it, so a
 * budget larger than this array simply means more retries an hour apart
 * — not an error, but the reason MAX_CONFIGURABLE_ATTEMPTS exists.
 */
export const RETRY_CAP_MS: readonly number[] = [
  0, // attempt 0 — immediate
  60_000, // attempt 1 — <= 1 minute
  300_000, // attempt 2 — <= 5 minutes
  900_000, // attempt 3 — <= 15 minutes
  3_600_000, // attempt 4 — <= 60 minutes
];

export type RandomSource = () => number;

/**
 * Full-jitter delay for the given post-increment attempt count.
 * Returns a value in [0, RETRY_CAP_MS[attempts]).
 */
export function computeRetryDelayMs(attempts: number, random: RandomSource = Math.random): number {
  if (!Number.isInteger(attempts) || attempts < 0) {
    throw new RangeError(`attempts must be a non-negative integer, received ${attempts}`);
  }
  const cap = RETRY_CAP_MS[Math.min(attempts, RETRY_CAP_MS.length - 1)] ?? 0;
  if (cap === 0) return 0;
  // Clamp the source so a misbehaving RandomSource cannot exceed the cap.
  const unit = Math.min(Math.max(random(), 0), 0.999_999_999);
  return Math.floor(unit * cap);
}

/**
 * True once the row has burned its whole retry budget.
 *
 * `maxAttempts` is REQUIRED. It used to default to the module constant,
 * which is how the hidden cap got in: the caller passed its own budget to
 * one check and this function quietly applied a different one to another.
 * There is now exactly one number in play, and it has to be handed over.
 */
export function hasExhaustedAttempts(attempts: number, maxAttempts: number): boolean {
  return attempts >= maxAttempts;
}
