import { createHmac, randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildPurchaseEventId } from '@acos/core-capi';
import {
  createWebhookTransactionRunner,
  handleRazorpayWebhook,
  verifyRazorpayWebhook,
} from '@acos/core-payments';
import {
  createPgRateLimiter,
  CREATE_ORDER_EMAIL_POLICY,
  CREATE_ORDER_IP_POLICY,
  type RateLimitPolicy,
} from '@acos/rate-limit';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// The PostgreSQL rate limiter, against a real server.
// -----------------------------------------------------------------------
// The unit suite proves the policy arithmetic against an in-memory
// limiter. This proves the two things only a real database can:
//
//   * the UPSERT is atomic, so N concurrent requests at the boundary
//     produce exactly N distinct counts and exactly `limit` allowances —
//     a SELECT-then-UPDATE would let several callers read the same
//     number and all proceed; and
//   * the counter is SHARED, so two "replicas" (two pools against one
//     database) draw on one budget rather than one each. That sharing is
//     the entire reason this exists instead of the in-memory limiter.
// -----------------------------------------------------------------------

const SECRET = 'whsec_rate_limit_suite';

let reachable = false;
const open: TempDatabase[] = [];
const pools: Pool[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  for (const pool of pools) await pool.end();
  while (open.length > 0) await open.pop()!.drop();
});

interface Env {
  db: TempDatabase;
  pool: Pool;
}

async function freshEnv(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {
    // 0005/0006 ALTER tables no migration creates (separate tracked
    // defect). 0008 is the counter table this suite exists for.
  });
  open.push(db);
  const pool = new Pool({ connectionString: db.url, max: 10 });
  pools.push(pool);
  return { db, pool };
}

const T0 = new Date('2026-04-01T12:00:00.000Z');
const at = (ms: number) => new Date(T0.getTime() + ms);
const POLICY: RateLimitPolicy = { name: 'test', limit: 3, windowMs: 60_000 };

async function counterRows(env: Env): Promise<{ bucket_key: string; hits: number }[]> {
  const { rows } = await env.db.client.query<{ bucket_key: string; hits: number }>(
    'SELECT bucket_key, hits FROM rate_limit_counters ORDER BY bucket_key',
  );
  return rows;
}

describe('PostgreSQL rate limiter (real database)', () => {
  it('runs against a real PostgreSQL server', async () => {
    const env = await freshEnv('rl-probe');
    const { rows } = await env.db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  // ------------------------------------------- under / at / over limit ----
  it('allows under the limit, allows AT the limit, refuses over it', async () => {
    const env = await freshEnv('rl-boundary');
    const limiter = createPgRateLimiter(env.pool);

    const first = await limiter.consume('1.2.3.4', POLICY, T0);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await limiter.consume('1.2.3.4', POLICY, T0);
    expect(second.allowed).toBe(true);

    const third = await limiter.consume('1.2.3.4', POLICY, T0);
    expect(third.allowed).toBe(true); // exactly AT the limit
    expect(third.remaining).toBe(0);

    const fourth = await limiter.consume('1.2.3.4', POLICY, T0);
    expect(fourth.allowed).toBe(false); // over
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  }, 60_000);

  // ----------------------------------------------------- separate clients ----
  it('gives separate clients separate budgets', async () => {
    const env = await freshEnv('rl-separate');
    const limiter = createPgRateLimiter(env.pool);

    for (let i = 0; i < POLICY.limit + 1; i += 1) await limiter.consume('1.1.1.1', POLICY, T0);
    expect((await limiter.consume('1.1.1.1', POLICY, T0)).allowed).toBe(false);
    expect((await limiter.consume('2.2.2.2', POLICY, T0)).allowed).toBe(true);

    // Two buckets, not one.
    expect(await counterRows(env)).toHaveLength(2);
  }, 60_000);

  // ------------------------------------------------------------ shared ----
  it('is shared across replicas — two pools draw on ONE budget', async () => {
    const env = await freshEnv('rl-shared');
    const replicaB = new Pool({ connectionString: env.db.url, max: 5 });
    pools.push(replicaB);

    const a = createPgRateLimiter(env.pool);
    const b = createPgRateLimiter(replicaB);

    // Alternate between "replicas". An in-memory limiter would give each
    // its own budget and allow all six; this must allow exactly three.
    const results = [
      await a.consume('1.2.3.4', POLICY, T0),
      await b.consume('1.2.3.4', POLICY, T0),
      await a.consume('1.2.3.4', POLICY, T0),
      await b.consume('1.2.3.4', POLICY, T0),
      await a.consume('1.2.3.4', POLICY, T0),
      await b.consume('1.2.3.4', POLICY, T0),
    ];
    expect(results.filter((r) => r.allowed)).toHaveLength(POLICY.limit);
  }, 60_000);

  // ------------------------------------------------------------ atomic ----
  it('is atomic: 20 concurrent requests allow exactly the limit', async () => {
    const env = await freshEnv('rl-atomic');
    const limiter = createPgRateLimiter(env.pool);

    const decisions = await Promise.all(
      Array.from({ length: 20 }, () => limiter.consume('1.2.3.4', POLICY, T0)),
    );

    // A SELECT-then-UPDATE would let several callers read the same count
    // and all proceed. The UPSERT hands each a distinct number.
    expect(decisions.filter((d) => d.allowed)).toHaveLength(POLICY.limit);
    const rows = await counterRows(env);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.hits).toBe(20);
  }, 60_000);

  // ----------------------------------------------------- retry behaviour ----
  it('reopens the budget in the next window', async () => {
    const env = await freshEnv('rl-window');
    const limiter = createPgRateLimiter(env.pool);

    for (let i = 0; i < POLICY.limit + 1; i += 1) await limiter.consume('1.2.3.4', POLICY, T0);
    expect((await limiter.consume('1.2.3.4', POLICY, at(30_000))).allowed).toBe(false);
    expect((await limiter.consume('1.2.3.4', POLICY, at(POLICY.windowMs))).allowed).toBe(true);

    // A new window is a new ROW, not a reset of the old one — so an
    // in-flight request from the previous window cannot clobber it.
    expect(await counterRows(env)).toHaveLength(2);
  }, 60_000);

  it('preserves a realistic checkout retry sequence under the real policies', async () => {
    const env = await freshEnv('rl-realistic');
    const limiter = createPgRateLimiter(env.pool);

    for (const [i, offset] of [0, 20_000, 60_000, 130_000, 240_000].entries()) {
      const ip = await limiter.consume('203.0.113.4', CREATE_ORDER_IP_POLICY, at(offset));
      const email = await limiter.consume(
        'buyer@example.test',
        CREATE_ORDER_EMAIL_POLICY,
        at(offset),
      );
      expect(ip.allowed, `attempt ${i + 1} ip`).toBe(true);
      expect(email.allowed, `attempt ${i + 1} email`).toBe(true);
    }
  }, 60_000);

  // ---------------------------------------------------------------- PII ----
  it('stores no personal data in the counter table', async () => {
    const env = await freshEnv('rl-pii');
    const limiter = createPgRateLimiter(env.pool);

    await limiter.consume('buyer-canary@example.test', CREATE_ORDER_EMAIL_POLICY, T0);
    await limiter.consume('203.0.113.77', CREATE_ORDER_IP_POLICY, T0);

    const { rows } = await env.db.client.query('SELECT * FROM rate_limit_counters');
    const dump = JSON.stringify(rows);
    expect(dump).not.toContain('buyer-canary@example.test');
    expect(dump).not.toContain('203.0.113.77');
    expect(dump).toMatch(/[0-9a-f]{64}/); // the digests are there
  }, 60_000);

  // ------------------------------------------------------------- sweep ----
  it('deletes only windows that have closed', async () => {
    const env = await freshEnv('rl-sweep');
    const limiter = createPgRateLimiter(env.pool);

    await limiter.consume('old', POLICY, T0);
    await limiter.consume('new', POLICY, at(POLICY.windowMs));

    const deleted = await limiter.deleteExpired(at(POLICY.windowMs + 1));
    expect(deleted).toBe(1);
    expect(await counterRows(env)).toHaveLength(1);
  }, 60_000);

  // --------------------------------------------- webhook is NOT limited ----
  describe('webhook ingestion is unaffected', () => {
    it('accepts far more webhooks than any create-order policy would allow', async () => {
      const env = await freshEnv('rl-webhook');
      const transaction = createWebhookTransactionRunner(env.pool);

      // Well past CREATE_ORDER_IP_POLICY.limit (20) and far past the
      // email limit (5). Razorpay retries when it does not get a 200, so
      // throttling this endpoint turns a burst into a retry storm and
      // delays the payment confirmations everything else waits on.
      const count = CREATE_ORDER_IP_POLICY.limit * 3;
      for (let i = 0; i < count; i += 1) {
        const orderId = `order_wh_${i}`;
        await env.db.client.query(
          `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                               product_name, amount_paise, currency, status, updated_at)
           VALUES ($1, $2, 'wh@example.test', 'ai_income_99', 'Kit', 9900, 'INR', 'PENDING', now())`,
          [orderId, `rzp_${orderId}`],
        );
        const raw = JSON.stringify({
          event: 'payment.captured',
          payload: {
            payment: {
              entity: {
                id: `pay_wh_${i}`,
                order_id: `rzp_${orderId}`,
                amount: 9900,
                currency: 'INR',
                status: 'captured',
              },
            },
          },
        });
        const verification = verifyRazorpayWebhook({
          rawBody: Buffer.from(raw, 'utf8'),
          signatureHeader: createHmac('sha256', SECRET).update(raw).digest('hex'),
          webhookSecret: SECRET,
          // Same source address throughout — an IP that would have been
          // refused many times over by the create-order limiter.
          sourceIp: '203.0.113.4',
        });
        expect(verification.ok, `webhook ${i}`).toBe(true);
        if (!verification.ok) return;

        const outcome = await handleRazorpayWebhook(verification.verified, {
          transaction,
          buildMetaEventId: (paymentId) => buildPurchaseEventId({ paymentId }),
          eventId: `evt_${randomUUID()}`,
        });
        expect(outcome.status, `webhook ${i}`).toBe('processed');
      }

      const { rows } = await env.db.client.query<{ n: string }>(
        'SELECT count(*)::text AS n FROM webhook_events',
      );
      expect(Number(rows[0]!.n)).toBe(count);

      // And the webhook path consumed no rate-limit budget at all.
      expect(await counterRows(env)).toEqual([]);
    }, 120_000);

    it('the webhook route does not import the limiter', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const source = readFileSync(
        resolve(__dirname, '../../apps/web/app/api/webhooks/razorpay/route.ts'),
        'utf8',
      );
      expect(source).not.toContain('@acos/rate-limit');
      expect(source).not.toContain('checkCreateOrderLimits');

      // ...while create-order does.
      const createOrder = readFileSync(
        resolve(__dirname, '../../apps/web/app/api/payments/create-order/route.ts'),
        'utf8',
      );
      expect(createOrder).toContain('@acos/rate-limit');
      expect(createOrder).toContain('checkCreateOrderLimits');
    });
  });
});
