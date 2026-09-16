import { Client } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { TestRunContext } from '../fixtures/test-run-context';
import { suiteDatabase } from './support/suiteDb';

// PAYMENT / ORDER AMOUNT INVARIANT UNDER CONCURRENCY — real PostgreSQL.
// -----------------------------------------------------------------------
// The invariant:
//
//   payments.amount_paise = orders.amount_paise
//   payments.currency     = orders.currency
//
// for every payment row, under ANY interleaving of concurrent
// transactions — not merely when the two statements happen to be
// serialised by luck.
//
// Two triggers from migration 0003 cooperate to hold it:
//
//   payments_match_order      BEFORE INSERT/UPDATE ON payments
//   orders_financials_frozen  BEFORE UPDATE ON orders
//
// Each is correct alone under a single connection. Together, under READ
// COMMITTED, they used to have a hole: neither could see the other's
// uncommitted work, so an order UPDATE and a payment INSERT could both
// pass their own check and both commit, leaving a payment recorded
// against an amount nobody was ever charged. That is write skew, and the
// only way to observe it is with two real backends contending on real
// row locks — which is why nothing in this file is faked.
//
// The fix is one clause: `FOR SHARE` on the order lookup inside
// payments_match_order. FOR SHARE and not FOR KEY SHARE matters. A plain
// `UPDATE orders SET amount_paise = ...` takes FOR NO KEY UPDATE, and
// PostgreSQL's row-lock conflict matrix says FOR KEY SHARE does NOT
// conflict with it while FOR SHARE does. FOR KEY SHARE — which the
// payments_order_id_fkey check already takes on this same row — would
// therefore have left the race wide open.
//
// FOR SHARE and not FOR UPDATE matters too: share locks are mutually
// compatible, so two payments against one order still insert in
// parallel. "Concurrent matching operations succeed" below is the test
// that stops a future FOR UPDATE from quietly serialising checkout.
// -----------------------------------------------------------------------

// 0005_outreach_provenance and 0006_opportunity_lifecycle ALTER tables no
// migration creates, so applying the full set fails at setup. This suite
// needs the commerce schema and the 0003 triggers, which is 0001..0004.
const suite = suiteDatabase('paylock');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const ORIGINAL_PAISE = 9_900; // the 99 rupee kit — what the customer agreed to
const INFLATED_PAISE = 149_900; // the 1499 rupee system — what an attacker wants recorded

/** A connection of its own. Concurrency cannot be demonstrated on one. */
async function connect(url: string): Promise<Client> {
  const client = new Client({ connectionString: url });
  await client.connect();
  return client;
}

async function backendPid(client: Client): Promise<number> {
  const { rows } = await client.query<{ pid: number }>('SELECT pg_backend_pid() AS pid');
  return rows[0]!.pid;
}

/**
 * Resolves once `pid` is parked on a lock, rejects if it never parks.
 *
 * Asserting "blocked" by racing a timer would make the test a coin flip
 * on a loaded machine. pg_stat_activity states it as fact, so the poll
 * below only bounds how long we are willing to wait for a fact, and the
 * assertion itself is exact.
 */
async function waitUntilLockBlocked(
  observer: Client,
  pid: number,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { rows } = await observer.query<{ wait_event_type: string | null }>(
      `SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1`,
      [pid],
    );
    if (rows[0]?.wait_event_type === 'Lock') return;
    if (Date.now() > deadline) {
      throw new Error(
        `backend ${pid} never blocked on a lock within ${timeoutMs}ms ` +
          `(wait_event_type=${String(rows[0]?.wait_event_type)}) — ` +
          `the order row lock is missing, so the race is open`,
      );
    }
    await new Promise((r) => setTimeout(r, 25));
  }
}

async function seedOrderWithAmount(
  client: Client,
  context: TestRunContext,
  suffix: string,
  amountPaise: number,
): Promise<string> {
  const id = context.id('order', suffix);
  await client.query(
    `INSERT INTO orders (id, razorpay_order_id, idempotency_key, customer_email,
                         product_slug, product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, 'lock@example.com', 'ai_income_99',
             'AI Income Starter Kit', $4, 'INR', 'PENDING', now())`,
    [id, `rzp_${id}`, `idem_${id}`, amountPaise],
  );
  return context.trackOrder(id);
}

function insertPaymentSql(): string {
  return `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                                currency, status, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, now())`;
}

/** The invariant itself, asked of the database rather than of our beliefs. */
async function amountMismatches(client: Client, orderId: string): Promise<number> {
  const { rows } = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n
       FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE p.order_id = $1
        AND (p.amount_paise <> o.amount_paise OR p.currency <> o.currency)`,
    [orderId],
  );
  return Number(rows[0]!.n);
}

describe('payment/order amount invariant', () => {
  // Guards the guard. Every test below calls suite.require(), which throws
  // an actionable message when PostgreSQL is absent — so this file can
  // never pass by skipping. This asserts what it actually ran against.
  it('runs against a real PostgreSQL server', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  });

  describe('the write-skew race (two concurrent transactions)', () => {
    it('A updates the order amount while B inserts a payment for the old amount', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'race1', ORIGINAL_PAISE);

      const a = await connect(db.url);
      const b = await connect(db.url);
      const paymentId = context.trackPayment(context.id('payment', 'race1'));

      try {
        // --- Transaction A: begins, inflates the order amount, holds ---
        await a.query('BEGIN');
        await a.query(`UPDATE orders SET amount_paise = $2, updated_at = now() WHERE id = $1`, [
          orderId,
          INFLATED_PAISE,
        ]);

        // --- Transaction B: inserts a payment for the OLD amount ---
        // Before the fix this returned immediately, having read A's
        // pre-update row and found it matching. It must now block on the
        // share lock A's uncommitted UPDATE conflicts with.
        await b.query('BEGIN');
        const bPid = await backendPid(b);
        const insert = b
          .query(insertPaymentSql(), [
            paymentId,
            `rzp_${paymentId}`,
            orderId,
            ORIGINAL_PAISE,
            'INR',
            'CAPTURED',
          ])
          .then(
            () => ({ ok: true as const }),
            (error: { code?: string; message: string }) => ({ ok: false as const, error }),
          );

        await waitUntilLockBlocked(db.client, bPid);

        // --- A commits. B re-reads and must now see the mismatch. ---
        await a.query('COMMIT');
        const result = await insert;

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('23514');
          expect(result.error.message).toContain('payment_amount_matches_order');
        }
        await b.query('ROLLBACK');

        // The invariant, verified against the database, not inferred.
        expect(await amountMismatches(db.client, orderId)).toBe(0);
        const { rows } = await db.client.query<{ amount_paise: number }>(
          `SELECT amount_paise FROM orders WHERE id = $1`,
          [orderId],
        );
        expect(rows[0]!.amount_paise).toBe(INFLATED_PAISE);
      } finally {
        await a.end();
        await b.end();
      }
    }, 30_000);

    it('holds in the reverse interleaving: B inserts first, A then tries to update', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'race2', ORIGINAL_PAISE);

      const a = await connect(db.url);
      const b = await connect(db.url);
      const paymentId = context.trackPayment(context.id('payment', 'race2'));

      try {
        // B inserts a correct payment and holds its share lock open.
        await b.query('BEGIN');
        await b.query(insertPaymentSql(), [
          paymentId,
          `rzp_${paymentId}`,
          orderId,
          ORIGINAL_PAISE,
          'INR',
          'CAPTURED',
        ]);

        // A's UPDATE must block on that share lock rather than sail past
        // a freeze trigger that cannot see B's uncommitted payment.
        await a.query('BEGIN');
        const aPid = await backendPid(a);
        const update = a
          .query(`UPDATE orders SET amount_paise = $2, updated_at = now() WHERE id = $1`, [
            orderId,
            INFLATED_PAISE,
          ])
          .then(
            () => ({ ok: true as const }),
            (error: { code?: string; message: string }) => ({ ok: false as const, error }),
          );

        await waitUntilLockBlocked(db.client, aPid);

        await b.query('COMMIT');
        const result = await update;

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe('23514');
          expect(result.error.message).toContain('order_financials_frozen');
        }
        await a.query('ROLLBACK');

        expect(await amountMismatches(db.client, orderId)).toBe(0);
      } finally {
        await a.end();
        await b.end();
      }
    }, 30_000);
  });

  describe('concurrent matching operations still succeed', () => {
    it('two payments for the same order insert in parallel without blocking', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'par', ORIGINAL_PAISE);

      const a = await connect(db.url);
      const b = await connect(db.url);
      // Different statuses: payments_one_captured_per_order allows only
      // one CAPTURED row per order, and that constraint stays untouched.
      const capturedId = context.trackPayment(context.id('payment', 'parcap'));
      const failedId = context.trackPayment(context.id('payment', 'parfail'));

      try {
        await a.query('BEGIN');
        await b.query('BEGIN');

        // Both take FOR SHARE on the same order row. Share locks are
        // mutually compatible, so neither waits — a FOR UPDATE here would
        // serialise every checkout against the same order and this would
        // hang until the timeout.
        await Promise.all([
          a.query(insertPaymentSql(), [
            capturedId,
            `rzp_${capturedId}`,
            orderId,
            ORIGINAL_PAISE,
            'INR',
            'CAPTURED',
          ]),
          b.query(insertPaymentSql(), [
            failedId,
            `rzp_${failedId}`,
            orderId,
            ORIGINAL_PAISE,
            'INR',
            'FAILED',
          ]),
        ]);

        await a.query('COMMIT');
        await b.query('COMMIT');

        const { rows } = await db.client.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM payments WHERE order_id = $1`,
          [orderId],
        );
        expect(Number(rows[0]!.n)).toBe(2);
        expect(await amountMismatches(db.client, orderId)).toBe(0);
      } finally {
        await a.end();
        await b.end();
      }
    }, 30_000);

    it('a concurrent order update is still allowed while no payment exists', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'free', ORIGINAL_PAISE);

      const a = await connect(db.url);
      try {
        await a.query('BEGIN');
        await a.query(`UPDATE orders SET amount_paise = $2, updated_at = now() WHERE id = $1`, [
          orderId,
          INFLATED_PAISE,
        ]);
        await a.query('COMMIT');

        const { rows } = await db.client.query<{ amount_paise: number }>(
          `SELECT amount_paise FROM orders WHERE id = $1`,
          [orderId],
        );
        expect(rows[0]!.amount_paise).toBe(INFLATED_PAISE);
      } finally {
        await a.end();
      }
    }, 30_000);
  });

  describe('existing non-concurrent behaviour is unchanged', () => {
    it('accepts a payment whose amount and currency match its order', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'ok', ORIGINAL_PAISE);
      const paymentId = context.trackPayment(context.id('payment', 'ok'));

      await expect(
        db.client.query(insertPaymentSql(), [
          paymentId,
          `rzp_${paymentId}`,
          orderId,
          ORIGINAL_PAISE,
          'INR',
          'CAPTURED',
        ]),
      ).resolves.toBeDefined();
      expect(await amountMismatches(db.client, orderId)).toBe(0);
    });

    it('rejects a payment for a different amount', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'amt', ORIGINAL_PAISE);
      const paymentId = context.trackPayment(context.id('payment', 'amt'));

      await expect(
        db.client.query(insertPaymentSql(), [
          paymentId,
          `rzp_${paymentId}`,
          orderId,
          1, // one paise for a 99 rupee product
          'INR',
          'CAPTURED',
        ]),
      ).rejects.toMatchObject({ code: '23514' });
      expect(await amountMismatches(db.client, orderId)).toBe(0);
    });

    it('rejects a payment in a different currency', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'cur', ORIGINAL_PAISE);
      const paymentId = context.trackPayment(context.id('payment', 'cur'));

      await expect(
        db.client.query(insertPaymentSql(), [
          paymentId,
          `rzp_${paymentId}`,
          orderId,
          ORIGINAL_PAISE,
          'USD',
          'CAPTURED',
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });

    it('rejects a payment referencing an unknown order with 23503', async () => {
      const { db, context } = suite.require();
      const paymentId = context.trackPayment(context.id('payment', 'orphan'));

      await expect(
        db.client.query(insertPaymentSql(), [
          paymentId,
          `rzp_${paymentId}`,
          `order_${context.runId}_does_not_exist`,
          ORIGINAL_PAISE,
          'INR',
          'CAPTURED',
        ]),
      ).rejects.toMatchObject({ code: '23503' });
    });

    it('still freezes order financials once a payment exists', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'frozen', ORIGINAL_PAISE);
      const paymentId = context.trackPayment(context.id('payment', 'frozen'));

      await db.client.query(insertPaymentSql(), [
        paymentId,
        `rzp_${paymentId}`,
        orderId,
        ORIGINAL_PAISE,
        'INR',
        'CAPTURED',
      ]);

      await expect(
        db.client.query(`UPDATE orders SET amount_paise = $2, updated_at = now() WHERE id = $1`, [
          orderId,
          INFLATED_PAISE,
        ]),
      ).rejects.toMatchObject({ code: '23514' });
    });

    it('still allows a non-financial order update after a payment exists', async () => {
      const { db, context } = suite.require();
      const orderId = await seedOrderWithAmount(db.client, context, 'status', ORIGINAL_PAISE);
      const paymentId = context.trackPayment(context.id('payment', 'status'));

      await db.client.query(insertPaymentSql(), [
        paymentId,
        `rzp_${paymentId}`,
        orderId,
        ORIGINAL_PAISE,
        'INR',
        'CAPTURED',
      ]);

      await expect(
        db.client.query(`UPDATE orders SET status = 'PAID', updated_at = now() WHERE id = $1`, [
          orderId,
        ]),
      ).resolves.toBeDefined();
    });
  });
});
