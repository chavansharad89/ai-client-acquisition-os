// MetaEventRepository — the persistence contract the worker depends on.
// -----------------------------------------------------------------------
// Defined as an interface (mirroring @acos/core-payments' OrderRepository)
// so the worker's claiming/fencing logic is unit-testable without a
// database, while the production implementation in pgRepository.ts does
// the real `FOR UPDATE SKIP LOCKED` work.
//
// FENCING CONTRACT — every method that ends a PROCESSING row returns
// `true` only if THIS worker still owned the lease at write time. A
// `false` return means the worker was fenced: its lease expired, the row
// was recovered, and another worker now owns it. A fenced worker must
// discard its result and write nothing further. This is why each of
// these is a single conditional UPDATE rather than a read-then-write.
// -----------------------------------------------------------------------

/** The fields the worker needs to build and dispatch a Purchase event. */
export interface ClaimedMetaEvent {
  id: string;
  /** Stable, deterministic id. Reused verbatim on every retry — never regenerated. */
  metaEventId: string;
  orderId: string;
  eventName: string;
  product: string;
  valuePaise: number;
  currency: string;
  /** Attempt count BEFORE this delivery. 0 on the first claim. */
  attempts: number;
}

export interface ClaimInput {
  workerId: string;
  now: Date;
  leaseExpiresAt: Date;
  limit: number;
}

export interface CompleteInput {
  id: string;
  workerId: string;
  now: Date;
}

export interface RetryInput extends CompleteInput {
  /** Already-incremented attempt count to persist. */
  attempts: number;
  nextAttemptAt: Date;
  lastError: string;
}

export interface DeadLetterInput extends CompleteInput {
  attempts: number;
  lastError: string;
}

export interface AmbiguousSendInput {
  id: string;
  /** The worker that made the delivery it can no longer confirm. */
  workerId: string;
  now: Date;
  /** Stable event id Meta received, so an operator can look it up. */
  metaEventId: string;
}

export interface MetaEventRepository {
  /**
   * Atomically moves up to `limit` due PENDING rows to PROCESSING and
   * stamps them with this worker's lease. Concurrent callers must never
   * receive the same row.
   */
  claim(input: ClaimInput): Promise<ClaimedMetaEvent[]>;

  /** PROCESSING -> SENT. Terminal. Returns false if fenced. */
  markSent(input: CompleteInput): Promise<boolean>;

  /** PROCESSING -> PENDING with a future nextAttemptAt. Returns false if fenced. */
  markForRetry(input: RetryInput): Promise<boolean>;

  /** PROCESSING -> DEAD_LETTER. Terminal. Returns false if fenced. */
  markDeadLetter(input: DeadLetterInput): Promise<boolean>;

  /**
   * Records that Meta ACCEPTED a delivery this worker can no longer
   * confirm, because its lease was gone by the time it tried to write.
   *
   * THE ONE METHOD HERE THAT IS DELIBERATELY NOT FENCED, and the reason
   * is worth stating plainly: the fence exists to stop a stale worker
   * changing a row another worker now owns. Staying silent instead does
   * not undo the HTTP request — it only hides it. The row keeps its
   * status, its lease, its attempts and its owner; the ONLY column this
   * touches is `last_error`, which is diagnostic and belongs to nobody.
   * A stale worker therefore still cannot mark anything SENT, retry it,
   * or dead-letter it. It can only leave a note.
   *
   * Returns true if a row was annotated.
   */
  recordAmbiguousSend(input: AmbiguousSendInput): Promise<boolean>;

  /**
   * Recovers rows whose lease expired (worker crashed mid-dispatch) back
   * to PENDING. Must NOT touch `attempts` — a crash is not evidence that
   * Meta rejected anything. Returns the number of rows recovered.
   */
  releaseExpiredLeases(input: { now: Date }): Promise<number>;
}
