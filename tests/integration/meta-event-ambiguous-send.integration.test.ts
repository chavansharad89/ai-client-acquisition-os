import type { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  AMBIGUOUS_SEND_PREFIX,
  createPgMetaEventRepository,
  type MetaEventRepository,
} from '@acos/worker/metaEvents';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// recordAmbiguousSend against real PostgreSQL.
// -----------------------------------------------------------------------
// The unit suite pins this behaviour against the in-memory fake. This
// pins the SQL, because the SQL is where the interesting decision lives:
// every other settle method carries `AND status = 'PROCESSING' AND
// lease_owner = $2`, and this one deliberately does not.
//
// That omission is the whole fix, and it is also the one place a
// careless edit could hand a stale worker authority over a row it no
// longer owns. So the assertions below check both halves: the note IS
// written even with the lease gone, and NOTHING else about the row moves.
// -----------------------------------------------------------------------

let reachable = false;
const open: TempDatabase[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

async function freshDb(label: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  // 0004 is the last migration that applies; 0005 ALTERs tables nothing
  // creates (separate tracked defect) and nothing here needs them.
  const db = await createTempDatabase(label);
  open.push(db);
  return db;
}

/**
 * An order with a CAPTURED payment and one PENDING meta event.
 *
 * The captured payment is not decoration: migration 0003's
 * meta_events_require_capture trigger rejects a meta event for an order
 * that was never paid, so this is the minimum real state.
 */
async function seed(client: Client, id: string): Promise<{ metaEventId: string }> {
  const metaEventId = `purchase_${id}`;
  await client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, 'amb@example.test', 'ai_freelancing_499', 'Launch Kit',
             49900, 'INR', 'PAID', now())`,
    [`order_${id}`, `rzp_order_${id}`],
  );
  await client.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                           currency, status, updated_at)
     VALUES ($1, $2, $3, 49900, 'INR', 'CAPTURED', now())`,
    [`payment_${id}`, `rzp_pay_${id}`, `order_${id}`],
  );
  await client.query(
    `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product,
                              value_paise, currency, status, attempts,
                              next_attempt_at, updated_at)
     VALUES ($1, $2, $3, 'Purchase', 'ai_freelancing_499', 49900, 'INR',
             'PENDING', 0, now(), now())`,
    [id, metaEventId, `order_${id}`],
  );
  return { metaEventId };
}

interface Row {
  status: string;
  attempts: number;
  lease_owner: string | null;
  lease_expires_at: Date | null;
  last_error: string | null;
}

async function readRow(client: Client, id: string): Promise<Row> {
  const { rows } = await client.query<Row>(
    `SELECT status, attempts, lease_owner, lease_expires_at, last_error
       FROM meta_events WHERE id = $1`,
    [id],
  );
  return rows[0]!;
}

function repoFor(db: TempDatabase): MetaEventRepository {
  return createPgMetaEventRepository({
    query: (sql, params) => db.client.query(sql, params ? [...params] : undefined),
  });
}

describe('recordAmbiguousSend (real PostgreSQL)', () => {
  it('runs against a real PostgreSQL server', async () => {
    const db = await freshDb('amb-probe');
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  it('writes the note even though the lease is gone, and moves nothing else', async () => {
    const db = await freshDb('amb-write');
    const repo = repoFor(db);
    const { metaEventId } = await seed(db.client, 'e1');

    // worker-a claims, then loses the lease to worker-b.
    await repo.claim({
      workerId: 'worker-a',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() - 1_000),
      limit: 1,
    });
    await repo.releaseExpiredLeases({ now: new Date() });
    await repo.claim({
      workerId: 'worker-b',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 300_000),
      limit: 1,
    });

    const before = await readRow(db.client, 'e1');
    expect(before.lease_owner).toBe('worker-b');

    const wrote = await repo.recordAmbiguousSend({
      id: 'e1',
      workerId: 'worker-a',
      now: new Date(),
      metaEventId,
    });

    expect(wrote).toBe(true);
    const after = await readRow(db.client, 'e1');
    expect(after.last_error).toMatch(new RegExp(`^${AMBIGUOUS_SEND_PREFIX}`));
    expect(after.last_error).toContain(metaEventId);
    expect(after.last_error).toContain('worker-a');

    // The fence still holds for everything that matters.
    expect(after.status).toBe(before.status);
    expect(after.attempts).toBe(before.attempts);
    expect(after.lease_owner).toBe('worker-b');
    expect(after.lease_expires_at?.getTime()).toBe(before.lease_expires_at?.getTime());
  }, 60_000);

  it('a stale worker still cannot mark SENT, retry, or dead-letter', async () => {
    const db = await freshDb('amb-fence');
    const repo = repoFor(db);
    const { metaEventId } = await seed(db.client, 'e1');

    await repo.claim({
      workerId: 'worker-a',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() - 1_000),
      limit: 1,
    });
    await repo.releaseExpiredLeases({ now: new Date() });
    await repo.claim({
      workerId: 'worker-b',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 300_000),
      limit: 1,
    });

    await repo.recordAmbiguousSend({
      id: 'e1',
      workerId: 'worker-a',
      now: new Date(),
      metaEventId,
    });

    // Every fenced path still refuses worker-a.
    expect(await repo.markSent({ id: 'e1', workerId: 'worker-a', now: new Date() })).toBe(false);
    expect(
      await repo.markForRetry({
        id: 'e1',
        workerId: 'worker-a',
        now: new Date(),
        attempts: 99,
        nextAttemptAt: new Date(),
        lastError: 'stale',
      }),
    ).toBe(false);
    expect(
      await repo.markDeadLetter({
        id: 'e1',
        workerId: 'worker-a',
        now: new Date(),
        attempts: 99,
        lastError: 'stale',
      }),
    ).toBe(false);

    const row = await readRow(db.client, 'e1');
    expect(row.status).toBe('PROCESSING');
    expect(row.lease_owner).toBe('worker-b');
    expect(row.attempts).toBe(0);
  }, 60_000);

  it('the new owner can still complete, and SENT clears the note', async () => {
    const db = await freshDb('amb-complete');
    const repo = repoFor(db);
    const { metaEventId } = await seed(db.client, 'e1');

    await repo.claim({
      workerId: 'worker-a',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() - 1_000),
      limit: 1,
    });
    await repo.releaseExpiredLeases({ now: new Date() });
    await repo.claim({
      workerId: 'worker-b',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 300_000),
      limit: 1,
    });
    await repo.recordAmbiguousSend({
      id: 'e1',
      workerId: 'worker-a',
      now: new Date(),
      metaEventId,
    });

    expect(await repo.markSent({ id: 'e1', workerId: 'worker-b', now: new Date() })).toBe(true);
    const row = await readRow(db.client, 'e1');
    expect(row.status).toBe('SENT');
    expect(row.last_error).toBeNull();
  }, 60_000);

  it('the operator query finds exactly the ambiguous rows', async () => {
    const db = await freshDb('amb-query');
    const repo = repoFor(db);
    const a = await seed(db.client, 'e1');
    await seed(db.client, 'e2');

    await repo.recordAmbiguousSend({
      id: 'e1',
      workerId: 'worker-a',
      now: new Date(),
      metaEventId: a.metaEventId,
    });

    const { rows } = await db.client.query<{ id: string }>(
      `SELECT id FROM meta_events WHERE last_error LIKE $1 ORDER BY id`,
      [`${AMBIGUOUS_SEND_PREFIX}%`],
    );
    expect(rows.map((r) => r.id)).toEqual(['e1']);
  }, 60_000);

  it('returns false for a row that does not exist', async () => {
    const db = await freshDb('amb-missing');
    expect(
      await repoFor(db).recordAmbiguousSend({
        id: 'nope',
        workerId: 'worker-a',
        now: new Date(),
        metaEventId: 'purchase_nope',
      }),
    ).toBe(false);
  }, 60_000);
});
