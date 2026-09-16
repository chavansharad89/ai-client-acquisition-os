import type {
  AmbiguousSendInput,
  ClaimedMetaEvent,
  ClaimInput,
  CompleteInput,
  DeadLetterInput,
  MetaEventRepository,
  RetryInput,
} from './repository';

// PostgreSQL implementation of MetaEventRepository.
// -----------------------------------------------------------------------
// Written as raw SQL against a `pg`-style pool rather than through Prisma
// because `FOR UPDATE SKIP LOCKED` has no Prisma query-builder
// equivalent, and because this repo's sandbox cannot generate a Prisma
// engine (see tests/integration/support/pgOrderRepository.ts). Swapping
// in `prisma.$queryRaw` later requires no change to these statements.
// -----------------------------------------------------------------------

/** Minimal surface of `pg`'s Pool/Client, so we don't depend on the package here. */
export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

interface MetaEventRow {
  id: string;
  meta_event_id: string;
  order_id: string;
  event_name: string;
  product: string;
  value_paise: number;
  currency: string;
  attempts: number;
}

export function createPgMetaEventRepository(sql: SqlExecutor): MetaEventRepository {
  return {
    async claim({ workerId, now, leaseExpiresAt, limit }: ClaimInput): Promise<ClaimedMetaEvent[]> {
      // The inner SELECT takes row locks and SKIPs any row a concurrent
      // worker already holds, so two workers can never claim the same
      // event. Only PENDING rows are visible here, which is what makes a
      // SENT event impossible to reprocess.
      const { rows } = await sql.query(
        `UPDATE meta_events AS m
            SET status           = 'PROCESSING',
                lease_owner      = $1,
                lease_expires_at = $2,
                updated_at       = now()
          WHERE m.id IN (
                  SELECT c.id
                    FROM meta_events AS c
                   WHERE c.status = 'PENDING'
                     AND c.next_attempt_at <= $3
                   ORDER BY c.next_attempt_at ASC, c.created_at ASC
                     FOR UPDATE SKIP LOCKED
                   LIMIT $4
                )
      RETURNING m.id, m.meta_event_id, m.order_id, m.event_name,
                m.product, m.value_paise, m.currency, m.attempts`,
        [workerId, leaseExpiresAt, now, limit],
      );
      return (rows as MetaEventRow[]).map(mapRow);
    },

    async markSent({ id, workerId, now }: CompleteInput): Promise<boolean> {
      // `lease_owner = $2` is the fence. If an expired lease was already
      // recovered, lease_owner is NULL (or another worker's id) and this
      // updates zero rows, so a resurrected worker cannot mark SENT a row
      // that someone else is now delivering.
      return updatedOne(
        sql,
        `UPDATE meta_events
            SET status = 'SENT', lease_owner = NULL, lease_expires_at = NULL,
                last_error = NULL, updated_at = $3
          WHERE id = $1 AND status = 'PROCESSING' AND lease_owner = $2`,
        [id, workerId, now],
      );
    },

    async markForRetry({
      id,
      workerId,
      now,
      attempts,
      nextAttemptAt,
      lastError,
    }: RetryInput): Promise<boolean> {
      return updatedOne(
        sql,
        `UPDATE meta_events
            SET status = 'PENDING', attempts = $4, next_attempt_at = $5,
                last_error = $6, lease_owner = NULL, lease_expires_at = NULL,
                updated_at = $3
          WHERE id = $1 AND status = 'PROCESSING' AND lease_owner = $2`,
        [id, workerId, now, attempts, nextAttemptAt, lastError],
      );
    },

    async markDeadLetter({
      id,
      workerId,
      now,
      attempts,
      lastError,
    }: DeadLetterInput): Promise<boolean> {
      return updatedOne(
        sql,
        `UPDATE meta_events
            SET status = 'DEAD_LETTER', attempts = $4, last_error = $5,
                lease_owner = NULL, lease_expires_at = NULL, updated_at = $3
          WHERE id = $1 AND status = 'PROCESSING' AND lease_owner = $2`,
        [id, workerId, now, attempts, lastError],
      );
    },

    async recordAmbiguousSend({
      id,
      workerId,
      now,
      metaEventId,
    }: AmbiguousSendInput): Promise<boolean> {
      // No `status` or `lease_owner` predicate, on purpose — by the time
      // this runs the lease is gone, so a fenced write would match zero
      // rows and the delivery would vanish from the record entirely.
      // Only `last_error` is written: status, lease, attempts and owner
      // are all untouched, so this cannot advance the state machine or
      // take a row away from the worker that now owns it.
      //
      // The prefix is the operator's handle:
      //   SELECT id, meta_event_id, status, last_error
      //     FROM meta_events
      //    WHERE last_error LIKE 'DELIVERED_UNCONFIRMED%';
      // workerId is NOT a bind parameter here — it is interpolated into
      // the note by ambiguousSendNote. Passing it as an unreferenced $n
      // makes PostgreSQL fail with "could not determine data type of
      // parameter", which is what the integration test caught.
      return updatedOne(
        sql,
        `UPDATE meta_events
            SET last_error = $3, updated_at = $2
          WHERE id = $1`,
        [id, now, ambiguousSendNote(workerId, metaEventId, now)],
      );
    },

    async releaseExpiredLeases({ now }: { now: Date }): Promise<number> {
      // `attempts` is deliberately untouched: the worker died, which tells
      // us nothing about whether Meta would have accepted the event.
      // next_attempt_at is left alone too, so recovery is immediate.
      const { rowCount } = await sql.query(
        `UPDATE meta_events
            SET status = 'PENDING', lease_owner = NULL, lease_expires_at = NULL,
                updated_at = $1
          WHERE status = 'PROCESSING'
            AND lease_expires_at IS NOT NULL
            AND lease_expires_at <= $1`,
        [now],
      );
      return rowCount ?? 0;
    },
  };
}

/**
 * The operator-facing record of an ambiguous delivery.
 *
 * Deliberately blunt about what is and is not known. "Sent" would be a
 * lie about the row's state; "failed" would be a lie about Meta. The
 * event id is included because it is the only thing that lets someone
 * settle the question in Meta's Events Manager.
 */
export const AMBIGUOUS_SEND_PREFIX = 'DELIVERED_UNCONFIRMED';

export function ambiguousSendNote(workerId: string, metaEventId: string, now: Date): string {
  return (
    `${AMBIGUOUS_SEND_PREFIX}: Meta accepted event_id=${metaEventId} at ` +
    `${now.toISOString()}, but worker ${workerId} had already lost its lease and could ` +
    `not mark this row SENT. The event may therefore be delivered more than once; Meta ` +
    `deduplicates on event_id, which is reused verbatim on every retry. This is a ` +
    `delivery whose outcome is UNKNOWN to this system, not a failure — check Events ` +
    `Manager for this event_id before any manual correction.`
  );
}

async function updatedOne(
  sql: SqlExecutor,
  statement: string,
  params: readonly unknown[],
): Promise<boolean> {
  const { rowCount } = await sql.query(statement, params);
  return (rowCount ?? 0) > 0;
}

function mapRow(row: MetaEventRow): ClaimedMetaEvent {
  return {
    id: row.id,
    metaEventId: row.meta_event_id,
    orderId: row.order_id,
    eventName: row.event_name,
    product: row.product,
    valuePaise: Number(row.value_paise),
    currency: row.currency,
    attempts: Number(row.attempts),
  };
}
