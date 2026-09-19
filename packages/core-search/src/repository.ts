import type { ServiceProfileFields } from '@acos/core-service-profile';

import type { SearchStatus, StoredSearch } from './types';

/**
 * Persistence boundary for Search. Every operation that touches a specific
 * row is constrained by `userId` in the query itself — mirrors
 * @acos/core-service-profile's ServiceProfileRepository. There is
 * deliberately no `getById(id)` that could return another user's row.
 */
export interface SearchRepository {
  create(
    userId: string,
    input: {
      serviceProfileId: string;
      /** The immutable snapshot (DEC-007) — copied from the ServiceProfile at creation time, never re-read later. */
      parameters: ServiceProfileFields;
      idempotencyKey: string | null;
    },
    now: Date,
  ): Promise<StoredSearch>;

  /** Only this user's row for this key — never a global lookup. */
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<StoredSearch | null>;

  getById(userId: string, id: string): Promise<StoredSearch | null>;

  /** Only this user's searches — never a global list. */
  list(userId: string): Promise<readonly StoredSearch[]>;

  /**
   * Compare-and-swap status transition: applies only if the row is still
   * at `from` when the write lands, which is also what makes this safe
   * against a concurrent transition of the same row. Returns null when
   * `id` does not belong to `userId`, OR the row's status is no longer
   * `from` (lost the race, or the caller's view of `from` was already
   * stale) — the caller cannot tell which from this alone, and must
   * re-read to distinguish "not found" from "conflict" if it needs to.
   */
  transition(
    userId: string,
    id: string,
    from: SearchStatus,
    to: SearchStatus,
    options: { lastError: string | null },
    now: Date,
  ): Promise<StoredSearch | null>;

  // ---- Worker-only operations (R-34) --------------------------------------
  // Every method below is deliberately NOT scoped by userId: a worker is
  // handed nothing and has no session (PRD V2.1 "WORKER OWNERSHIP") — it
  // claims a row across all users and reads user_id out of what it claimed.
  // Concurrency safety (no two workers claiming the same row) and fencing
  // (a stale worker cannot overwrite a live one) are the implementation's
  // job — see ./pgRepository's `FOR UPDATE SKIP LOCKED` claim, mirroring
  // apps/worker/src/metaEvents/pgRepository.ts's proven pattern.

  /**
   * Atomically claims exactly one eligible PENDING Search for this worker:
   * moves it to RUNNING, stamps `lease_owner`/`lease_expires_at`, and
   * increments `attempts` (the same convention `transition()` already uses
   * for entry into RUNNING). Returns null when no PENDING Search is
   * available. Two concurrent callers must never receive the same row.
   */
  claimNextPending(input: {
    workerId: string;
    now: Date;
    leaseExpiresAt: Date;
  }): Promise<StoredSearch | null>;

  /**
   * Recovers Searches whose RUNNING lease has expired (a crashed worker):
   * returns them to PENDING, clearing `lease_owner`/`lease_expires_at`.
   * Unconditional — never gated on `attempts` — and never charges an
   * attempt, because a crash proves nothing about whether the work itself
   * would have failed (mirrors `metaEvents.releaseExpiredLeases`). Returns
   * the number of rows recovered.
   */
  releaseExpiredLeases(input: { now: Date }): Promise<number>;

  /**
   * Settles a claimed Search as successfully completed: RUNNING -> COMPLETE.
   * Fenced on `lease_owner` — returns false (fenced) if this worker no
   * longer holds the lease, in which case nothing was written.
   */
  completeClaimed(input: { id: string; workerId: string; now: Date }): Promise<boolean>;

  /**
   * Settles a claimed Search's failed execution attempt: if the row's
   * current `attempts` is below `maxAttempts`, returns it to PENDING
   * (retry-eligible); once `attempts` has reached `maxAttempts`, moves it
   * to the terminal FAILED state instead. `last_error` is written either
   * way. Fenced on `lease_owner` — returns null (fenced) if this worker no
   * longer holds the lease, in which case nothing was written.
   */
  recordAttemptFailure(input: {
    id: string;
    workerId: string;
    now: Date;
    error: string;
    maxAttempts: number;
  }): Promise<'PENDING' | 'FAILED' | null>;
}
