import type { Env } from '@acos/config';

import {
  DEFAULT_MAX_ATTEMPTS,
  LEASE_DURATION_MS,
  MAX_CONFIGURABLE_ATTEMPTS,
} from './metaEvents/backoff';

// WORKER_* environment variables -> the knobs that actually use them.
// -----------------------------------------------------------------------
// Before this, all three WORKER_* variables were declared in
// @acos/config, documented in .env.example, and consumed by nothing: the
// only reference to WORKER_POLL_INTERVAL_MS in the repository was a
// comment inside the unimplemented poll loop. Operators could set them,
// restart, and observe no change — the worst kind of configuration,
// because it looks like a control.
//
// This module is the one place the mapping lives, so the answer to "does
// this variable do anything?" is a file rather than a grep.
//
// STILL NOT CONSUMED AT RUNTIME: apps/worker/src/index.ts throws — the
// poll loop does not exist yet. `pollIntervalMs` and `batchSize` are
// therefore carried here and used by nobody until it does.
// `maxAttempts` IS live: it flows into MetaEventWorkerDeps.
// -----------------------------------------------------------------------

export interface WorkerRuntimeConfig {
  /** Delay between polls of the outbox. Consumer: the poll loop (not built). */
  pollIntervalMs: number;
  /** Rows claimed per poll. Consumer: claimMetaEvents(deps, limit) (not wired). */
  batchSize: number;
  /** Attempt budget. Consumer: scheduleRetry, via MetaEventWorkerDeps.maxAttempts. */
  maxAttempts: number;
  /** Lease duration. Not an env var — see the note below. */
  leaseDurationMs: number;
}

/**
 * Maps validated env to worker knobs.
 *
 * Takes an already-validated `Env` rather than reading process.env, so
 * this file cannot become another place secrets and settings are picked
 * up implicitly.
 *
 * leaseDurationMs is deliberately NOT an environment variable. It is
 * coupled to the Meta CAPI timeout by a hard invariant the worker
 * enforces (timeout < lease), and exposing one side of a coupled pair to
 * operators invites a configuration that fails that check at boot — or
 * worse, passes it and duplicates conversions. Change it in code, where
 * the relationship is visible.
 */
export function workerRuntimeConfig(env: Env): WorkerRuntimeConfig {
  if (env.WORKER_MAX_ATTEMPTS > MAX_CONFIGURABLE_ATTEMPTS) {
    throw new RangeError(
      `WORKER_MAX_ATTEMPTS (${env.WORKER_MAX_ATTEMPTS}) exceeds the supported maximum ` +
        `(${MAX_CONFIGURABLE_ATTEMPTS}).`,
    );
  }
  return {
    pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
    batchSize: env.WORKER_BATCH_SIZE,
    maxAttempts: env.WORKER_MAX_ATTEMPTS,
    leaseDurationMs: LEASE_DURATION_MS,
  };
}

/**
 * The default the schema and the worker must agree on.
 *
 * They disagreed: @acos/config defaulted WORKER_MAX_ATTEMPTS to 8 while
 * the worker's own default was 5, and since nothing read the variable the
 * real behaviour was 5. Wiring the variable up without aligning them
 * would have silently widened the budget. A test asserts they match.
 */
export const EXPECTED_DEFAULT_MAX_ATTEMPTS = DEFAULT_MAX_ATTEMPTS;
