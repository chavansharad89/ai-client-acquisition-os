import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  getProduct,
  InvalidProductIdError,
  isValidProductId,
  PRODUCT_IDS,
  resolveProduct,
} from '@acos/catalog';

import { seedOrder } from '../fixtures/idempotency-duplicates';
import { suiteDatabase } from './support/suiteDb';

// PAYMENT — real PostgreSQL.
// -----------------------------------------------------------------------
// SCOPE NOTE, read before adding to this file.
//
// `handleRazorpayWebhook` is NOT implemented — core-payments/src/index.ts
// throws for it, deliberately ("out of scope for this delivery"). Payment
// CAPTURE therefore has no application code to exercise yet.
//
// So the capture scenarios below are split in two, honestly:
//
//   * Tests that RUN assert the database-level invariants that will
//     govern capture whatever the handler ends up looking like — the
//     amount CHECK, the razorpay_payment_id unique index, the
//     one-CAPTURED-payment-per-order partial index, and the order FK.
//     These are real constraints on a real server and are worth locking
//     down now; they are the reason a buggy handler cannot corrupt data.
//
//   * Tests that are `it.todo` name the behaviour the handler must have
//     when it exists. They are specifications, not silent gaps.
//
// Amount/currency MISMATCH detection is handler logic (compare webhook
// payload against the catalog). The database cannot express it, so those
// are todos — with the catalog assertions they will be built on covered
// here as real tests.
// -----------------------------------------------------------------------

const suite = suiteDatabase('payment');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const PRODUCT = 'ai_freelancing_499';

async function insertPayment(
  client: import('pg').Client,
  context: import('../fixtures/test-run-context').TestRunContext,
  opts: {
    orderId: string;
    suffix: string;
    razorpayPaymentId?: string;
    amountPaise?: number;
    currency?: string;
    status?: string;
  },
): Promise<string> {
  const id = context.id('payment', opts.suffix);
  await client.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())`,
    [
      id,
      opts.razorpayPaymentId ?? `rzp_pay_${randomUUID()}`,
      opts.orderId,
      opts.amountPaise ?? 49_900,
      opts.currency ?? 'INR',
      opts.status ?? 'CAPTURED',
    ],
  );
  return context.trackPayment(id);
}

describe('PAYMENT — create order', () => {
  it('an order row persists with the catalog amount and currency', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'created');

    const { rows } = await db.client.query(
      `SELECT amount_paise, currency, status, product_slug FROM orders WHERE id = $1`,
      [orderId],
    );
    expect(rows[0]).toMatchObject({
      amount_paise: getProduct(PRODUCT).amountPaise,
      currency: 'INR',
      product_slug: PRODUCT,
    });
  });

  it('the amount_paise CHECK rejects a non-positive order amount', async () => {
    const { db, context } = suite.require();
    await expect(
      db.client.query(
        `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                             product_name, amount_paise, currency, status, updated_at)
         VALUES ($1, $1, 'x@example.com', $2, 'n', 0, 'INR', 'PENDING', now())`,
        [context.id('order', 'zero'), PRODUCT],
      ),
    ).rejects.toThrow(/amount_paise_positive/);
  });
});

describe('PAYMENT — invalid product', () => {
  it('every catalog id resolves; an unknown id is rejected', () => {
    for (const id of PRODUCT_IDS) expect(resolveProduct(id).amountPaise).toBeGreaterThan(0);

    // resolveProduct is the runtime entrypoint for untrusted input.
    // getProduct deliberately never throws — it takes an already-narrowed
    // ProductId — so asserting on it would prove nothing.
    for (const bad of ['not_a_product', '', null, undefined, 42, {}]) {
      expect(() => resolveProduct(bad), String(bad)).toThrow(InvalidProductIdError);
      expect(isValidProductId(bad), String(bad)).toBe(false);
    }
  });

  it('the catalog is the only source of price — order rows match it exactly', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'catalogprice');
    const { rows } = await db.client.query(`SELECT amount_paise FROM orders WHERE id = $1`, [
      orderId,
    ]);
    expect(rows[0].amount_paise).toBe(getProduct(PRODUCT).amountPaise);
  });
});

describe('PAYMENT — payment captured', () => {
  it('a captured payment row links to its order', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'cap');
    const paymentId = await insertPayment(db.client, context, { orderId, suffix: 'cap' });

    const { rows } = await db.client.query(
      `SELECT p.status, p.order_id, o.status AS order_status
         FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.id = $1`,
      [paymentId],
    );
    expect(rows[0]).toMatchObject({ status: 'CAPTURED', order_id: orderId });
  });

  it('only ONE captured payment per order is possible', async () => {
    // payments_one_captured_per_order — a partial unique index. This is
    // what stops a replayed capture webhook from double-crediting an order
    // even if the handler's own dedup were wrong.
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'onecap');
    await insertPayment(db.client, context, { orderId, suffix: 'first' });

    await expect(insertPayment(db.client, context, { orderId, suffix: 'second' })).rejects.toThrow(
      /payments_one_captured_per_order/,
    );
  });

  it('a second NON-captured payment on the same order is allowed', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'mixed');
    await insertPayment(db.client, context, { orderId, suffix: 'cap' });
    const failed = await insertPayment(db.client, context, {
      orderId,
      suffix: 'failed',
      status: 'FAILED',
    });
    expect(failed).toBeTruthy(); // the partial index only covers CAPTURED
  });

  it.todo('handleRazorpayWebhook records the capture and grants entitlement in one transaction');
  it.todo('a capture for an unknown order is rejected without creating a payment row');
});

describe('PAYMENT — invalid payment', () => {
  it('a payment referencing a non-existent order is refused, and stores nothing', async () => {
    const { db, context } = suite.require();

    // TWO guards cover this, and the test used to assert on the losing
    // one. Migration 0003's enforce_payment_matches_order is a BEFORE
    // INSERT trigger that looks the order up FOR SHARE and raises
    // 'payment references unknown order %' with SQLSTATE 23503 when it is
    // absent. BEFORE triggers run before FK validation, so
    // payments_order_id_fkey is never reached. What matters is the
    // invariant, not which guard won: refused with a
    // foreign-key-violation code, and no row left behind.
    await expect(
      insertPayment(db.client, context, { orderId: 'order_does_not_exist', suffix: 'orphan' }),
    ).rejects.toMatchObject({ code: '23503' });

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM payments WHERE order_id = 'order_does_not_exist'`,
    );
    expect(rows[0].n).toBe(0);
  });

  it('a non-positive payment amount is refused, by the trigger and by the CHECK', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'badamt');

    // Normal path: payments_match_order (a BEFORE trigger, migration
    // 0003) rejects it first, because 0 is not the order's amount.
    await expect(
      insertPayment(db.client, context, { orderId, suffix: 'zero', amountPaise: 0 }),
    ).rejects.toThrow(/payment_amount_matches_order/);

    // The CHECK underneath is unreachable through that path BY
    // CONSTRUCTION: passing the trigger means matching the order's
    // amount, and orders_amount_paise_positive guarantees that is > 0. It
    // is still real defence-in-depth for any path the trigger does not
    // cover, so prove it bites with the trigger lifted — inside a
    // transaction that is rolled back, so no other test sees the table
    // without its trigger.
    await db.client.query('BEGIN');
    try {
      await db.client.query('ALTER TABLE payments DISABLE TRIGGER payments_match_order');
      await expect(
        insertPayment(db.client, context, { orderId, suffix: 'zerocheck', amountPaise: 0 }),
      ).rejects.toThrow(/payments_amount_paise_positive/);
    } finally {
      await db.client.query('ROLLBACK');
    }

    const { rows } = await db.client.query(
      `SELECT tgenabled FROM pg_trigger WHERE tgname = 'payments_match_order'`,
    );
    expect(rows[0].tgenabled).toBe('O');
  });

  it.todo('an unparseable webhook payload never creates a payment row');
});

describe('PAYMENT — amount mismatch', () => {
  it('the catalog amount a mismatch check would compare against is fixed', () => {
    // The comparison itself belongs to the unimplemented handler; what is
    // assertable today is that the expected value cannot drift.
    expect(getProduct(PRODUCT).amountPaise).toBe(49_900);
    expect(getProduct('ai_income_99').amountPaise).toBe(9_900);
    expect(getProduct('ai_client_acquisition_1499').amountPaise).toBe(149_900);
  });

  it('a payment whose amount differs from its order is refused by the database', async () => {
    // INVERTED, deliberately. This test used to assert the OPPOSITE —
    // "nothing in the DB prevents it" — which was true before migration
    // 0003 added payments_match_order. Left as it was, it failed while
    // the protection worked and would have passed if someone deleted the
    // trigger: an inverted guard on "pay 99, receive 1499".
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'mismatch');

    await expect(
      insertPayment(db.client, context, { orderId, suffix: 'mismatch', amountPaise: 1 }),
    ).rejects.toThrow(/payment_amount_matches_order/);

    // Refused, not merely errored: nothing was written.
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM payments WHERE order_id = $1`,
      [orderId],
    );
    expect(rows[0].n).toBe(0);
  });

  it.todo('handleRazorpayWebhook rejects a capture whose amount differs from the order');
});

describe('PAYMENT — currency mismatch', () => {
  it('every catalog product is INR', () => {
    for (const id of PRODUCT_IDS) expect(getProduct(id).currency).toBe('INR');
  });

  it('a payment whose currency differs from its order is refused by the database', async () => {
    // INVERTED for the same reason as the amount case above: this
    // asserted "nothing rejects it", which migration 0003 made false.
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'curr');

    await expect(
      insertPayment(db.client, context, { orderId, suffix: 'usd', currency: 'USD' }),
    ).rejects.toThrow(/payment_currency_matches_order/);

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM payments WHERE order_id = $1`,
      [orderId],
    );
    expect(rows[0].n).toBe(0);
  });

  it.todo('handleRazorpayWebhook rejects a capture whose currency differs from the order');
});

describe('PAYMENT — duplicate payment', () => {
  it('the same razorpay_payment_id cannot be stored twice', async () => {
    const { db, context } = suite.require();
    const shared = `rzp_pay_${randomUUID()}`;
    const orderA = await seedOrder(db.client, context, 'dupA');
    const orderB = await seedOrder(db.client, context, 'dupB');

    await insertPayment(db.client, context, {
      orderId: orderA,
      suffix: 'dup1',
      razorpayPaymentId: shared,
    });
    await expect(
      insertPayment(db.client, context, {
        orderId: orderB,
        suffix: 'dup2',
        razorpayPaymentId: shared,
      }),
    ).rejects.toThrow(/payments_razorpay_payment_id_key/);
  });

  it('two concurrent inserts of the same payment id yield exactly one row', async () => {
    const { db, context } = suite.require();
    const shared = `rzp_pay_${randomUUID()}`;
    const orderA = await seedOrder(db.client, context, 'raceA');
    const orderB = await seedOrder(db.client, context, 'raceB');

    const results = await Promise.allSettled([
      insertPayment(db.client, context, {
        orderId: orderA,
        suffix: 'race1',
        razorpayPaymentId: shared,
      }),
      insertPayment(db.client, context, {
        orderId: orderB,
        suffix: 'race2',
        razorpayPaymentId: shared,
      }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM payments WHERE razorpay_payment_id = $1`,
      [shared],
    );
    expect(rows[0].n).toBe(1);
  });
});
