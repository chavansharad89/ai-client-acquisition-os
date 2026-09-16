import { ambiguousSendNote } from './pgRepository';
import type {
  AmbiguousSendInput,
  ClaimedMetaEvent,
  ClaimInput,
  CompleteInput,
  DeadLetterInput,
  MetaEventRepository,
  RetryInput,
} from './repository';

// In-memory MetaEventRepository used by the unit suite.
// -----------------------------------------------------------------------
// It reproduces the three properties the real SQL guarantees, so the
// worker logic can be tested without Postgres:
//
//   1. `claim` only ever sees PENDING rows whose next_attempt_at is due,
//      and hands a given row to exactly one caller (the synchronous
//      claim body is the analogue of FOR UPDATE SKIP LOCKED).
//   2. Every settle method is conditional on (status=PROCESSING AND
//      lease_owner=caller) and reports whether it matched — the fence.
//   3. releaseExpiredLeases never touches `attempts`.
//
// It is NOT a substitute for the real concurrency test: only Postgres can
// prove SKIP LOCKED behaves under genuine parallelism. See
// tests/integration/meta-event-worker.concurrency.test.ts.
// -----------------------------------------------------------------------

export type Status = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';

export interface FakeRow extends ClaimedMetaEvent {
  status: Status;
  nextAttemptAt: Date;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  lastError: string | null;
  createdAt: Date;
}

export interface FakeRepository extends MetaEventRepository {
  rows: Map<string, FakeRow>;
  get(id: string): FakeRow;
  /** Counts claim() calls, to assert batching behaviour. */
  claimCalls: number;
}

let seq = 0;

export function makeRow(overrides: Partial<FakeRow> = {}): FakeRow {
  seq += 1;
  const id = overrides.id ?? `evt_${seq}`;
  return {
    id,
    metaEventId: `purchase_stable_${id}`,
    orderId: `order_${id}`,
    eventName: 'Purchase',
    product: 'ai_freelancing_499',
    valuePaise: 49_900,
    currency: 'INR',
    attempts: 0,
    status: 'PENDING',
    nextAttemptAt: new Date('2026-01-01T00:00:00.000Z'),
    leaseOwner: null,
    leaseExpiresAt: null,
    lastError: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function createFakeRepository(initial: FakeRow[] = []): FakeRepository {
  const rows = new Map<string, FakeRow>(initial.map((r) => [r.id, r]));
  const repo: FakeRepository = {
    rows,
    claimCalls: 0,
    get(id) {
      const row = rows.get(id);
      if (!row) throw new Error(`no such row ${id}`);
      return row;
    },

    async claim({ workerId, now, leaseExpiresAt, limit }: ClaimInput) {
      repo.claimCalls += 1;
      // Synchronous selection + mutation: nothing can interleave here,
      // which is exactly the atomicity SKIP LOCKED gives us.
      const due = [...rows.values()]
        .filter((r) => r.status === 'PENDING' && r.nextAttemptAt.getTime() <= now.getTime())
        .sort(
          (a, b) =>
            a.nextAttemptAt.getTime() - b.nextAttemptAt.getTime() ||
            a.createdAt.getTime() - b.createdAt.getTime(),
        )
        .slice(0, limit);
      return due.map((r) => {
        r.status = 'PROCESSING';
        r.leaseOwner = workerId;
        r.leaseExpiresAt = leaseExpiresAt;
        return toClaimed(r);
      });
    },

    async markSent({ id, workerId }: CompleteInput) {
      return settle(rows, id, workerId, (r) => {
        r.status = 'SENT';
        r.leaseOwner = null;
        r.leaseExpiresAt = null;
        r.lastError = null;
      });
    },

    async markForRetry({ id, workerId, attempts, nextAttemptAt, lastError }: RetryInput) {
      return settle(rows, id, workerId, (r) => {
        r.status = 'PENDING';
        r.attempts = attempts;
        r.nextAttemptAt = nextAttemptAt;
        r.lastError = lastError;
        r.leaseOwner = null;
        r.leaseExpiresAt = null;
      });
    },

    async markDeadLetter({ id, workerId, attempts, lastError }: DeadLetterInput) {
      return settle(rows, id, workerId, (r) => {
        r.status = 'DEAD_LETTER';
        r.attempts = attempts;
        r.lastError = lastError;
        r.leaseOwner = null;
        r.leaseExpiresAt = null;
      });
    },

    async recordAmbiguousSend({ id, workerId, now, metaEventId }: AmbiguousSendInput) {
      // Mirrors the SQL exactly, including what it does NOT do: no fence
      // predicate, and no field written except lastError. A fake that
      // fenced this would hide the very behaviour the tests exist to pin,
      // and one that also changed status would let the tests pass while
      // the real thing corrupted the state machine.
      const row = rows.get(id);
      if (!row) return false;
      row.lastError = ambiguousSendNote(workerId, metaEventId, now);
      return true;
    },

    async releaseExpiredLeases({ now }) {
      let recovered = 0;
      for (const r of rows.values()) {
        if (
          r.status === 'PROCESSING' &&
          r.leaseExpiresAt !== null &&
          r.leaseExpiresAt.getTime() <= now.getTime()
        ) {
          r.status = 'PENDING';
          r.leaseOwner = null;
          r.leaseExpiresAt = null;
          recovered += 1; // attempts intentionally untouched
        }
      }
      return recovered;
    },
  };
  return repo;
}

function settle(
  rows: Map<string, FakeRow>,
  id: string,
  workerId: string,
  mutate: (row: FakeRow) => void,
): boolean {
  const row = rows.get(id);
  if (!row || row.status !== 'PROCESSING' || row.leaseOwner !== workerId) return false;
  mutate(row);
  return true;
}

function toClaimed(r: FakeRow): ClaimedMetaEvent {
  return {
    id: r.id,
    metaEventId: r.metaEventId,
    orderId: r.orderId,
    eventName: r.eventName,
    product: r.product,
    valuePaise: r.valuePaise,
    currency: r.currency,
    attempts: r.attempts,
  };
}
