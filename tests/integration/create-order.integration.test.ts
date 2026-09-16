import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOrder } from '@acos/core-payments';
import type { RazorpayOrder, RazorpayOrdersClient } from '@acos/core-payments';

import { createPgOrderRepository } from './support/pgOrderRepository';

// -----------------------------------------------------------------------
// Integration tests: real PostgreSQL 16, schema applied from the actual
// hand-authored migration at packages/db/prisma/migrations/0001_init
// (see that file's header for why it's hand-authored rather than
// `prisma migrate dev`-generated in this environment). Razorpay is
// mocked — these tests must never make a real network call, per
// architecture §10 (integration tests mock Razorpay/Meta HTTP calls via
// fixtures, not real requests).
//
// Run standalone with:
//   DATABASE_URL=postgresql://acos_test:acos_test_password@127.0.0.1:5433/acos_test \
//     pnpm --filter @acos/tests run test:integration
// -----------------------------------------------------------------------

// Port 5433, matching docker-compose.test.yml and pgIndexHarness.ADMIN_URL.
// This defaulted to 5432, where an unrelated PostgreSQL happened to be
// listening on this host: every test in the file was skipped by a
// "password authentication failed" in beforeAll — and had the credentials
// happened to match, the beforeEach `DELETE FROM orders` would have run
// against whatever database that was.
const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://acos_test:acos_test_password@127.0.0.1:5433/acos_test';

const pool = new Pool({ connectionString });
const RAZORPAY_KEY_ID = 'rzp_test_fake_key_id';

function makeFakeRazorpay(): RazorpayOrdersClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async createOrder(params): Promise<RazorpayOrder> {
      calls.push(params);
      return {
        razorpayOrderId: `order_${randomUUID()}`,
        amountPaise: params.amountPaise,
        currency: params.currency,
        receipt: params.receipt,
        status: 'created',
      };
    },
  };
}

beforeAll(async () => {
  // Sanity check the schema this test run depends on is actually present
  // — fail loudly and immediately if not, rather than every test failing
  // individually with a confusing "relation does not exist" error.
  await pool.query('SELECT 1 FROM orders LIMIT 0');
});

beforeEach(async () => {
  // Child-to-parent, matching the foreign keys. meta_events,
  // webhook_events, payments and entitlements all reference orders with
  // ON DELETE RESTRICT, so a bare `DELETE FROM orders` is refused the
  // moment any child row exists — which is the same order CLEANUP_ORDER
  // uses in tests/fixtures/test-run-context.ts.
  //
  // This suite is the only one running against the SHARED acos_test
  // database rather than a per-suite temp database, so it inherits
  // whatever the migrate step or a previous run left behind.
  for (const table of ['meta_events', 'webhook_events', 'payments', 'entitlements', 'orders']) {
    await pool.query(`DELETE FROM "${table}"`);
  }
});

afterAll(async () => {
  await pool.end();
});

describe('createOrder + real Postgres: happy path', () => {
  it('persists exactly one order row with the catalog-authoritative amount', async () => {
    const orders = createPgOrderRepository(pool);
    const razorpay = makeFakeRazorpay();

    const result = await createOrder(
      { productId: 'ai_freelancing_499', customerEmail: 'real-pg-buyer@example.com' },
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );

    expect(result.amountPaise).toBe(49900);
    expect(result.status).toBe('PENDING');

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [result.orderId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount_paise).toBe(49900);
    expect(rows[0].product_slug).toBe('ai_freelancing_499');
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].customer_email).toBe('real-pg-buyer@example.com');
  });
});

describe('createOrder + real Postgres: the amount_paise CHECK constraint actually protects us', () => {
  it('the database itself rejects a zero/negative amount even if application code somehow tried to insert one', async () => {
    // This bypasses createOrder.ts entirely and hits the DB directly —
    // proving the CHECK constraint from the migration is real and would
    // catch a bug even if every layer of application validation above it
    // failed.
    await expect(
      pool.query(
        `INSERT INTO orders
           (id, razorpay_order_id, customer_email, product_slug, product_name, amount_paise, updated_at)
         VALUES (gen_random_uuid()::text, $1, 'x@example.com', 'x', 'X', 0, now())`,
        [`order_${randomUUID()}`],
      ),
    ).rejects.toThrow(/violates check constraint "orders_amount_paise_positive"/);
  });
});

describe('createOrder + real Postgres: duplicate/retry requests', () => {
  it('a retried request with the same Idempotency-Key returns the same order, backed by a real unique index', async () => {
    const orders = createPgOrderRepository(pool);
    const razorpay = makeFakeRazorpay();
    const idempotencyKey = `retry-${randomUUID()}`;

    const first = await createOrder(
      { productId: 'ai_income_99', customerEmail: 'retry-buyer@example.com' },
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
      { razorpay, orders },
    );
    const second = await createOrder(
      { productId: 'ai_income_99', customerEmail: 'retry-buyer@example.com' },
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
      { razorpay, orders },
    );

    expect(second).toEqual(first);
    expect(razorpay.calls).toHaveLength(1);

    const { rows } = await pool.query('SELECT * FROM orders WHERE idempotency_key = $1', [
      idempotencyKey,
    ]);
    expect(rows).toHaveLength(1); // the unique index guarantees this, not application logic alone
  });

  it('two concurrent requests with the SAME Idempotency-Key never produce two committed rows', async () => {
    // This is the test that matters most: it proves the self-healing
    // race-condition handling in createOrder.ts actually works against a
    // real database's real unique-constraint enforcement under genuine
    // concurrency, not a mocked approximation of it.
    const orders = createPgOrderRepository(pool);
    const idempotencyKey = `race-${randomUUID()}`;

    const razorpayA = makeFakeRazorpay();
    const razorpayB = makeFakeRazorpay();

    const [resultA, resultB] = await Promise.all([
      createOrder(
        { productId: 'ai_client_acquisition_1499', customerEmail: 'racer@example.com' },
        { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
        { razorpay: razorpayA, orders },
      ),
      createOrder(
        { productId: 'ai_client_acquisition_1499', customerEmail: 'racer@example.com' },
        { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
        { razorpay: razorpayB, orders },
      ),
    ]);

    // Both calls must resolve to the SAME winning order — one of them
    // self-healed via UniqueConstraintViolationError handling.
    expect(resultA.orderId).toBe(resultB.orderId);
    expect(resultA.razorpayOrderId).toBe(resultB.razorpayOrderId);

    const { rows } = await pool.query('SELECT * FROM orders WHERE idempotency_key = $1', [
      idempotencyKey,
    ]);
    expect(rows).toHaveLength(1); // exactly one row committed, despite the race
  });

  it('different idempotency keys are never conflated, even for the identical customer/product', async () => {
    const orders = createPgOrderRepository(pool);
    const razorpay = makeFakeRazorpay();

    await createOrder(
      { productId: 'ai_income_99', customerEmail: 'same-buyer@example.com' },
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey: `k-${randomUUID()}` },
      { razorpay, orders },
    );
    await createOrder(
      { productId: 'ai_income_99', customerEmail: 'same-buyer@example.com' },
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey: `k-${randomUUID()}` },
      { razorpay, orders },
    );

    const { rows } = await pool.query('SELECT * FROM orders WHERE customer_email = $1', [
      'same-buyer@example.com',
    ]);
    expect(rows).toHaveLength(2);
  });
});

describe('createOrder + real Postgres: database failure', () => {
  it('OrderPersistenceError is thrown when the underlying connection fails', async () => {
    const brokenPool = new Pool({
      connectionString: 'postgresql://nouser:nopass@localhost:1/nope',
    });
    const orders = createPgOrderRepository(brokenPool);
    const razorpay = makeFakeRazorpay();

    await expect(
      createOrder(
        { productId: 'ai_income_99', customerEmail: 'buyer@example.com' },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay, orders },
      ),
    ).rejects.toThrow();

    await brokenPool.end().catch(() => {});
  });
});

describe('createOrder + real Postgres: Razorpay failure never leaves a partial row', () => {
  it('when Razorpay fails, no order row is inserted', async () => {
    const orders = createPgOrderRepository(pool);
    const failingRazorpay: RazorpayOrdersClient = {
      async createOrder() {
        const { RazorpayOrderCreationError } = await import('@acos/core-payments');
        throw new RazorpayOrderCreationError('simulated upstream failure');
      },
    };

    await expect(
      createOrder(
        { productId: 'ai_income_99', customerEmail: 'buyer@example.com' },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay: failingRazorpay, orders },
      ),
    ).rejects.toThrow();

    const { rows } = await pool.query('SELECT * FROM orders WHERE customer_email = $1', [
      'buyer@example.com',
    ]);
    expect(rows).toHaveLength(0);
  });
});
