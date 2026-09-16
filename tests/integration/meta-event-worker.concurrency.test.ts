import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  claimMetaEvents,
  createPgMetaEventRepository,
  processMetaEvent,
  releaseExpiredLeases,
  type MetaEventWorkerDeps,
} from '@acos/worker/metaEvents';

// Real-Postgres concurrency tests for the MetaEvent worker.
// -----------------------------------------------------------------------
// These are the only tests that can prove `FOR UPDATE SKIP LOCKED`
// actually does its job: the unit suite runs on a single-threaded fake
// and can demonstrate the worker's *logic*, but not that two genuinely
// parallel transactions never hand out the same row.
//
// Requires the ephemeral database from docker-compose.test.yml:
//   docker compose -f docker-compose.test.yml up -d
//   pnpm --filter @acos/db run migrate:deploy
//   pnpm test:integration
// -----------------------------------------------------------------------

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://acos_test:acos_test_password@127.0.0.1:5433/acos_test';

const config = { pixelId: '123', apiVersion: 'v20.0', accessToken: 'secret' };
const ORDER_PREFIX = 'order_capi_concurrency_';
// Deliberately WITHOUT the trailing underscore. Earlier revisions of this
// suite put every event on one order literally named
// `order_capi_concurrency`, and rows from those runs survive in the shared
// acos_test database — `ORDER_PREFIX%` does not match that id, so a stale
// PENDING event was being claimed alongside the seeded batch.
const ORDER_LIKE = 'order_capi_concurrency%';

let pool: Pool;
let reachable = false;

beforeAll(async () => {
  pool = new Pool({ connectionString: DATABASE_URL, max: 16 });
  try {
    await pool.query('SELECT 1');
    reachable = true;
  } catch {
    reachable = false;
  }
});

afterAll(async () => {
  await pool?.end();
});

beforeEach(async () => {
  if (!reachable) return;
  // Child-to-parent: meta_events and payments both reference orders with
  // ON DELETE RESTRICT.
  await pool.query(`DELETE FROM meta_events WHERE order_id LIKE $1`, [ORDER_LIKE]);
  await pool.query(`DELETE FROM payments WHERE order_id LIKE $1`, [ORDER_LIKE]);
  await pool.query(`DELETE FROM orders WHERE id LIKE $1`, [ORDER_LIKE]);
});

/**
 * One paid order per event.
 *
 * Every event used to share a single hardcoded order id, which migration
 * 0002's UNIQUE index meta_events_order_id_key forbids — one Meta event
 * per order is the mechanism that stops one payment becoming two
 * Purchases. A backlog in production is N events across N orders, so that
 * is what this builds; each needs a CAPTURED payment of the exact order
 * amount, because meta_event_requires_captured_payment and
 * payments_match_order both refuse anything less.
 */
async function seedPaidOrder(i: number): Promise<string> {
  const orderId = `${ORDER_PREFIX}${i}`;
  await pool.query(
    `INSERT INTO orders (id, razorpay_order_id, idempotency_key, customer_email,
                         customer_phone, product_slug, product_name, amount_paise,
                         currency, status, updated_at)
     VALUES ($1, $1, $1, 'buyer@example.com', '919876543210',
             'ai_freelancing_499', 'AI Freelancing Launch Kit', 49900,
             'INR', 'PAID', now())
     ON CONFLICT (id) DO NOTHING`,
    [orderId],
  );
  await pool.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                           currency, status, updated_at)
     VALUES ($1, $1, $2, 49900, 'INR', 'CAPTURED', now())
     ON CONFLICT (id) DO NOTHING`,
    [`pay_${orderId}`, orderId],
  );
  return orderId;
}

async function seed(count: number, overrides: Record<string, unknown> = {}): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const orderId = await seedPaidOrder(i);
    await pool.query(
      `INSERT INTO meta_events
         (id, meta_event_id, order_id, event_name, product, value_paise, currency,
          status, attempts, next_attempt_at, lease_owner, lease_expires_at, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2, 'Purchase', 'ai_freelancing_499',
               49900, 'INR', $3, $4, $5, $6, $7, now())`,
      [
        `purchase_stable_${i}_${Date.now()}`,
        orderId,
        overrides.status ?? 'PENDING',
        overrides.attempts ?? 0,
        overrides.nextAttemptAt ?? new Date(),
        overrides.leaseOwner ?? null,
        overrides.leaseExpiresAt ?? null,
      ],
    );
  }
}

function workerDeps(
  workerId: string,
  over: Partial<MetaEventWorkerDeps> = {},
): MetaEventWorkerDeps {
  return {
    repository: createPgMetaEventRepository(pool),
    config,
    workerId,
    loadContext: async () => ({
      eventTime: new Date(),
      productId: 'ai_freelancing_499',
      productName: 'AI Freelancing Launch Kit',
      clientIp: '203.0.113.8',
      userAgent: 'integration-agent',
    }),
    sender: async () => undefined,
    ...over,
  };
}

const guard = () => {
  if (!reachable) {
    throw new Error(
      `Postgres not reachable at ${DATABASE_URL}. Start docker-compose.test.yml and run migrations.`,
    );
  }
};

describe('MetaEvent worker concurrency (real Postgres)', () => {
  it('eight parallel workers never claim the same event twice', async () => {
    guard();
    await seed(40);

    const batches = await Promise.all(
      Array.from({ length: 8 }, (_, i) => claimMetaEvents(workerDeps(`worker-${i}`), 10)),
    );

    const ids = batches.flat().map((e) => e.id);
    expect(ids).toHaveLength(40); // every row claimed exactly once
    expect(new Set(ids).size).toBe(40); // and by exactly one worker

    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM meta_events
        WHERE order_id LIKE $1 AND status = 'PROCESSING'`,
      [ORDER_LIKE],
    );
    expect((rows[0] as { n: number }).n).toBe(40);
  });

  it('never hands out a row that is not yet due', async () => {
    guard();
    await seed(5, { nextAttemptAt: new Date(Date.now() + 60_000) });
    const claimed = await claimMetaEvents(workerDeps('worker-a'), 10);
    expect(claimed).toHaveLength(0);
  });

  it('never re-claims a SENT row', async () => {
    guard();
    await seed(3, { status: 'SENT' });
    expect(await claimMetaEvents(workerDeps('worker-a'), 10)).toHaveLength(0);
  });

  it('recovers an expired lease without charging an attempt, then lets another worker finish it', async () => {
    guard();
    await seed(1, {
      status: 'PROCESSING',
      attempts: 2,
      leaseOwner: 'dead-worker',
      leaseExpiresAt: new Date(Date.now() - 1000),
    });

    expect(await releaseExpiredLeases(workerDeps('janitor'))).toBe(1);

    const [claimed] = await claimMetaEvents(workerDeps('worker-b'), 1);
    expect(claimed).toBeDefined();
    expect(claimed!.attempts).toBe(2); // untouched by recovery

    expect(await processMetaEvent(workerDeps('worker-b'), claimed!)).toEqual({ outcome: 'sent' });
  });

  it('fences a stale worker whose lease was reclaimed mid-dispatch', async () => {
    guard();
    await seed(1);

    // worker-a claims normally, then its lease lapses while it is still
    // holding the row. A negative leaseDurationMs used to fake this;
    // assertWorkerConfig rejects that as the configuration error it is,
    // and a lease in production expires because the clock passed it.
    const stale = workerDeps('worker-a', { leaseDurationMs: 600_000 });
    const [claimed] = await claimMetaEvents(stale, 1);
    expect(claimed).toBeDefined();
    await pool.query(
      `UPDATE meta_events SET lease_expires_at = now() - interval '1 minute' WHERE id = $1`,
      [claimed!.id],
    );

    // The janitor recovers it and worker-b takes over.
    expect(await releaseExpiredLeases(workerDeps('janitor'))).toBe(1);
    const [retaken] = await claimMetaEvents(workerDeps('worker-b'), 1);
    expect(retaken!.id).toBe(claimed!.id);

    // worker-a's late completion must not land. Its send SUCCEEDED before
    // it learned it had been fenced, so the honest outcome records the
    // ambiguous external delivery rather than a bare fence.
    const late = await processMetaEvent(stale, claimed!);
    expect(late.outcome).toBe('delivered_unconfirmed');

    const { rows } = await pool.query('SELECT status, lease_owner FROM meta_events WHERE id = $1', [
      claimed!.id,
    ]);
    expect(rows[0]).toMatchObject({ status: 'PROCESSING', lease_owner: 'worker-b' });
  });

  it('parallel dispatch of the same backlog sends each event exactly once', async () => {
    guard();
    await seed(24);
    const sent: string[] = [];
    const sender = async (_c: unknown, input: { eventId: string }) => {
      sent.push(input.eventId);
    };

    await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const d = workerDeps(`worker-${i}`, { sender: sender as never });
        for (const event of await claimMetaEvents(d, 10)) {
          await processMetaEvent(d, event);
        }
      }),
    );

    expect(sent).toHaveLength(24);
    expect(new Set(sent).size).toBe(24); // no event dispatched twice

    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM meta_events WHERE order_id LIKE $1 AND status = 'SENT'`,
      [ORDER_LIKE],
    );
    expect((rows[0] as { n: number }).n).toBe(24);
  });
});
