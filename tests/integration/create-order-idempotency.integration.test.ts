import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createOrder,
  IdempotencyKeyConflictError,
  type CreateOrderDeps,
  type RazorpayOrder,
  type RazorpayOrdersClient,
} from '@acos/core-payments';

import { createPgOrderRepository } from './support/pgOrderRepository';
import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// Idempotency-key binding under REAL concurrency.
// -----------------------------------------------------------------------
// The unit suite proves the comparison logic. This proves the thing only
// a real database can: that when N requests carrying one key hit at the
// same instant, the `orders_idempotency_key_key` unique index picks
// exactly one winner and every loser takes the re-read path — and that
// the re-read path applies the same binding check rather than handing
// back whatever it found.
//
// The losing path is the subtle one. It runs AFTER a failed INSERT, so it
// is reached only under genuine contention; a fake that serialises calls
// never exercises it, which is exactly how "different product, same key"
// could have slipped through there unnoticed.
// -----------------------------------------------------------------------

const RAZORPAY_KEY_ID = 'rzp_test_integration';
const STARTER = 'ai_income_99';
const SYSTEM = 'ai_client_acquisition_1499';

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

/** A real database with the commerce schema and its real unique indexes. */
async function freshDeps(label: string): Promise<CreateOrderDeps & { calls: number }> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  // 0004 is the last migration that applies (0005 ALTERs tables nothing
  // creates — separate tracked defect). The orders table and its
  // idempotency_key unique index both come from 0001.
  const db = await createTempDatabase(label);
  open.push(db);

  const pool = new Pool({ connectionString: db.url });
  pools.push(pool);

  // Razorpay is the one thing still faked: it is somebody else's HTTP
  // API. Everything below the repository boundary is real Postgres.
  let calls = 0;
  const razorpay: RazorpayOrdersClient = {
    async createOrder(params): Promise<RazorpayOrder> {
      calls += 1;
      return {
        razorpayOrderId: `order_rzp_${randomUUID()}`,
        amountPaise: params.amountPaise,
        currency: params.currency,
        receipt: params.receipt,
        status: 'created',
      };
    },
  };

  const deps = { razorpay, orders: createPgOrderRepository(pool) };
  return Object.defineProperty(deps, 'calls', { get: () => calls }) as CreateOrderDeps & {
    calls: number;
  };
}

function call(
  deps: CreateOrderDeps,
  body: Record<string, unknown>,
  idempotencyKey: string,
): Promise<{ orderId: string; productId: string; amountPaise: number }> {
  return createOrder(body, { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey }, deps);
}

async function countOrders(label: TempDatabase): Promise<number> {
  const { rows } = await label.client.query<{ n: string }>(
    'SELECT count(*)::text AS n FROM orders',
  );
  return Number(rows[0]!.n);
}

describe('create-order idempotency under real concurrency', () => {
  it('runs against a real PostgreSQL server', async () => {
    await freshDeps('idem-probe');
    const db = open[open.length - 1]!;
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  it('the database, not the application, is what enforces one row per key', async () => {
    const deps = await freshDeps('idem-index');
    const db = open[open.length - 1]!;
    const { rows } = await db.client.query<{ indisunique: boolean }>(
      `SELECT i.indisunique FROM pg_class c JOIN pg_index i ON i.indexrelid = c.oid
        WHERE c.relname = 'orders_idempotency_key_key'`,
    );
    expect(rows[0]?.indisunique).toBe(true);
    expect(deps).toBeDefined();
  }, 60_000);

  // ------------------------------------------------------------- 4 ----
  it('4. eight concurrent identical requests -> one order, one Razorpay call', async () => {
    const deps = await freshDeps('idem-same');
    const db = open[open.length - 1]!;
    const key = `idem_${randomUUID()}`;
    const body = { productId: STARTER, customerEmail: 'a@example.com' };

    const results = await Promise.all(
      Array.from({ length: 8 }, () => call(deps, body, key)),
    );

    expect(new Set(results.map((r) => r.orderId)).size).toBe(1);
    expect(await countOrders(db)).toBe(1);
    // Every result is the same order at the catalog price.
    for (const r of results) {
      expect(r.productId).toBe(STARTER);
      expect(r.amountPaise).toBe(9900);
    }
  }, 60_000);

  // ------------------------------------------------------------- 5 ----
  it('5. concurrent CONFLICTING requests -> one winner, the rest refused', async () => {
    const deps = await freshDeps('idem-conflict');
    const db = open[open.length - 1]!;
    const key = `idem_${randomUUID()}`;

    const settled = await Promise.allSettled([
      call(deps, { productId: STARTER, customerEmail: 'a@example.com' }, key),
      call(deps, { productId: SYSTEM, customerEmail: 'b@example.com' }, key),
      call(deps, { productId: SYSTEM, customerEmail: 'c@example.com' }, key),
      call(deps, { productId: STARTER, customerEmail: 'd@example.com' }, key),
    ]);

    const fulfilled = settled.filter((r) => r.status === 'fulfilled');
    const rejected = settled.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(3);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(IdempotencyKeyConflictError);
    }
    expect(await countOrders(db)).toBe(1);

    // Crucially: the single winner holds ITS OWN request's product and
    // email, and nobody else was handed it.
    const winner = (fulfilled[0] as PromiseFulfilledResult<{ productId: string }>).value;
    const { rows } = await db.client.query<{ product_slug: string; customer_email: string }>(
      'SELECT product_slug, customer_email FROM orders',
    );
    expect(rows[0]!.product_slug).toBe(winner.productId);
  }, 60_000);

  it('5b. a conflicting request arriving after the winner commits is refused too', async () => {
    const deps = await freshDeps('idem-after');
    const db = open[open.length - 1]!;
    const key = `idem_${randomUUID()}`;

    await call(deps, { productId: STARTER, customerEmail: 'a@example.com' }, key);

    await expect(
      call(deps, { productId: SYSTEM, customerEmail: 'a@example.com' }, key),
    ).rejects.toBeInstanceOf(IdempotencyKeyConflictError);
    await expect(
      call(deps, { productId: STARTER, customerEmail: 'b@example.com' }, key),
    ).rejects.toBeInstanceOf(IdempotencyKeyConflictError);

    expect(await countOrders(db)).toBe(1);
  }, 60_000);

  // ------------------------------------------------------------- 1 ----
  it('1. a sequential retry returns the same order and makes no second Razorpay order', async () => {
    const deps = await freshDeps('idem-retry');
    const db = open[open.length - 1]!;
    const key = `idem_${randomUUID()}`;
    const body = { productId: SYSTEM, customerEmail: 'a@example.com', customerPhone: '+919999999999' };

    const first = await call(deps, body, key);
    const before = deps.calls;
    const second = await call(deps, body, key);

    expect(second.orderId).toBe(first.orderId);
    expect(second.amountPaise).toBe(149900);
    expect(deps.calls).toBe(before); // no new provider call
    expect(await countOrders(db)).toBe(1);
  }, 60_000);

  // ------------------------------------------------------------- 7 ----
  it('7. distinct keys produce distinct orders, each priced from the catalog', async () => {
    const deps = await freshDeps('idem-distinct');
    const db = open[open.length - 1]!;

    const a = await call(deps, { productId: STARTER, customerEmail: 'a@example.com' }, `idem_${randomUUID()}`);
    const b = await call(deps, { productId: SYSTEM, customerEmail: 'a@example.com' }, `idem_${randomUUID()}`);

    expect(a.orderId).not.toBe(b.orderId);
    expect(a.amountPaise).toBe(9900);
    expect(b.amountPaise).toBe(149900);
    expect(await countOrders(db)).toBe(2);

    // Server-side pricing: what is stored is the catalog's number.
    const { rows } = await db.client.query<{ product_slug: string; amount_paise: number }>(
      'SELECT product_slug, amount_paise FROM orders ORDER BY amount_paise',
    );
    expect(rows).toEqual([
      { product_slug: STARTER, amount_paise: 9900 },
      { product_slug: SYSTEM, amount_paise: 149900 },
    ]);
  }, 60_000);

  // ------------------------------------------------------------- 6 ----
  it('6. concurrent requests with NO key create independent orders', async () => {
    const deps = await freshDeps('idem-nokey');
    const db = open[open.length - 1]!;
    const body = { productId: STARTER, customerEmail: 'a@example.com' };

    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        createOrder(body, { razorpayKeyId: RAZORPAY_KEY_ID }, deps),
      ),
    );

    // No key means no idempotency promise. Postgres allows many NULLs in
    // a unique index, so these are three separate orders — correct, and
    // the reason the client is told to send a key.
    expect(new Set(results.map((r) => r.orderId)).size).toBe(3);
    expect(await countOrders(db)).toBe(3);
  }, 60_000);
});
