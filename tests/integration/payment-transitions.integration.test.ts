import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// Payment status transitions, against real PostgreSQL.
// -----------------------------------------------------------------------
// Every assertion here is a direct SQL statement, not an application
// call. That is the point: no application code updates `payments` today,
// so these invariants exist for the UPDATE somebody writes later — an
// admin script, a support fix, a psql session during an incident. If they
// only held in TypeScript they would not be there when it mattered.
//
// The three gaps below were each reproduced on a real database before
// 0009 was written, so these tests are pinning behaviour that genuinely
// changed rather than describing behaviour that was always correct.
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
  const db = await createTempDatabase(label, {
  });
  open.push(db);
  return db;
}

const PAISE = 9_900;

/** Two orders, so reassignment can be attempted. */
async function seedOrders(db: TempDatabase): Promise<void> {
  await db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ('o1','rzp_o1','a@example.test','ai_income_99','Kit',$1,'INR','PAID',now()),
            ('o2','rzp_o2','b@example.test','ai_income_99','Kit',$1,'INR','PENDING',now())`,
    [PAISE],
  );
}

async function seedPayment(
  db: TempDatabase,
  id: string,
  status: string,
  orderId = 'o1',
): Promise<void> {
  await db.client.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                           currency, status, updated_at)
     VALUES ($1, $2, $3, $4, 'INR', $5, now())`,
    [id, `rzp_${id}`, orderId, PAISE, status],
  );
}

async function seedMetaEvent(db: TempDatabase, orderId = 'o1'): Promise<void> {
  await db.client.query(
    `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product,
                              value_paise, currency, status, attempts, next_attempt_at, updated_at)
     VALUES ('m1','purchase_1',$1,'Purchase','ai_income_99',$2,'INR','PENDING',0,now(),now())`,
    [orderId, PAISE],
  );
}

async function statusOf(db: TempDatabase, id: string): Promise<string> {
  const { rows } = await db.client.query<{ status: string }>(
    'SELECT status FROM payments WHERE id = $1',
    [id],
  );
  return rows[0]!.status;
}

describe('payment status transitions', () => {
  it('runs against a real PostgreSQL server', async () => {
    const db = await freshDb('txn-probe');
    const { rows } = await db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  // ------------------------------------------------------ legal moves ----
  describe('legal transitions are permitted', () => {
    it.each([
      ['AUTHORIZED', 'CAPTURED'],
      ['AUTHORIZED', 'FAILED'],
      ['CAPTURED', 'REFUNDED'],
    ])('%s -> %s', async (from, to) => {
      const db = await freshDb(`txn-ok-${from}-${to}`.toLowerCase());
      await seedOrders(db);
      await seedPayment(db, 'p1', from);

      await expect(
        db.client.query(`UPDATE payments SET status = $2, updated_at = now() WHERE id = $1`, [
          'p1',
          to,
        ]),
      ).resolves.toBeDefined();
      expect(await statusOf(db, 'p1')).toBe(to);
    }, 60_000);

    it('allows a no-op status write, so unrelated UPDATEs need not avoid the column', async () => {
      const db = await freshDb('txn-noop');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');

      await expect(
        db.client.query(
          `UPDATE payments SET status = 'CAPTURED', updated_at = now() WHERE id = 'p1'`,
        ),
      ).resolves.toBeDefined();
      expect(await statusOf(db, 'p1')).toBe('CAPTURED');
    }, 60_000);
  });

  // ---------------------------------------------------- illegal moves ----
  describe('a captured payment cannot be silently un-captured', () => {
    it.each([['AUTHORIZED'], ['FAILED']])(
      'refuses CAPTURED -> %s',
      async (to) => {
        const db = await freshDb(`txn-bad-cap-${to}`.toLowerCase());
        await seedOrders(db);
        await seedPayment(db, 'p1', 'CAPTURED');

        await expect(
          db.client.query(`UPDATE payments SET status = $1 WHERE id = 'p1'`, [to]),
        ).rejects.toMatchObject({ code: '23514' });

        // Gap 1, before 0009: this succeeded and left the row at FAILED.
        expect(await statusOf(db, 'p1')).toBe('CAPTURED');
      },
      60_000,
    );

    it('refuses every transition out of a terminal status', async () => {
      const db = await freshDb('txn-terminal');
      await seedOrders(db);
      await seedPayment(db, 'pf', 'FAILED');
      await seedPayment(db, 'pr', 'REFUNDED', 'o2');

      for (const [id, to] of [
        ['pf', 'CAPTURED'],
        ['pf', 'AUTHORIZED'],
        ['pf', 'REFUNDED'],
        ['pr', 'CAPTURED'],
        ['pr', 'AUTHORIZED'],
        ['pr', 'FAILED'],
      ] as const) {
        await expect(
          db.client.query(`UPDATE payments SET status = $2 WHERE id = $1`, [id, to]),
          `${id} -> ${to}`,
        ).rejects.toMatchObject({ code: '23514' });
      }
    }, 60_000);

    it('refuses AUTHORIZED -> REFUNDED — nothing was captured to refund', async () => {
      const db = await freshDb('txn-auth-refund');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'AUTHORIZED');

      await expect(
        db.client.query(`UPDATE payments SET status = 'REFUNDED' WHERE id = 'p1'`),
      ).rejects.toMatchObject({ code: '23514' });
    }, 60_000);
  });

  // ------------------------------------------------------ immutability ----
  describe('a captured payment is frozen', () => {
    it('cannot be moved to another order, even one of the same price', async () => {
      const db = await freshDb('txn-reassign');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');

      // Gap 2, before 0009: this succeeded. payments_match_order compares
      // the payment to whatever order it now points at, and o2 has the
      // same amount — so the reassignment looked consistent.
      await expect(
        db.client.query(`UPDATE payments SET order_id = 'o2' WHERE id = 'p1'`),
      ).rejects.toMatchObject({
        code: '23514',
        message: expect.stringContaining('captured_payment_frozen'),
      });

      const { rows } = await db.client.query<{ order_id: string }>(
        `SELECT order_id FROM payments WHERE id = 'p1'`,
      );
      expect(rows[0]!.order_id).toBe('o1');
    }, 60_000);

    it('cannot have its amount or currency rewritten', async () => {
      const db = await freshDb('txn-amount');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');

      for (const sql of [
        `UPDATE payments SET amount_paise = 1 WHERE id = 'p1'`,
        `UPDATE payments SET currency = 'USD' WHERE id = 'p1'`,
        `UPDATE payments SET amount_paise = 100000 WHERE id = 'p1'`,
      ]) {
        // Asserting the MESSAGE, not just the SQLSTATE. 0003's
        // payments_match_order also raises 23514 for an amount change
        // (the payment would no longer match its order), so a bare code
        // check passed even with this guard removed — the test could not
        // tell which trigger fired. It has to, because the two protect
        // different things: 0003 says "match your order", this says "a
        // captured amount never changes at all", and the first only
        // implies the second while a THIRD trigger keeps the order's
        // amount frozen. Depending on that conjunction is how an
        // invariant breaks quietly.
        //
        // payments_captured_frozen fires first: PostgreSQL runs BEFORE
        // triggers in alphabetical order by name, and c < m.
        await expect(db.client.query(sql), sql).rejects.toMatchObject({
          code: '23514',
          message: expect.stringContaining('captured_payment_frozen'),
        });
      }

      const { rows } = await db.client.query<{ amount_paise: number; currency: string }>(
        `SELECT amount_paise, currency FROM payments WHERE id = 'p1'`,
      );
      expect(rows[0]).toEqual({ amount_paise: PAISE, currency: 'INR' });
    }, 60_000);

    it('cannot have its provider payment id rewritten', async () => {
      const db = await freshDb('txn-provider-id');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');

      await expect(
        db.client.query(`UPDATE payments SET razorpay_payment_id = 'rzp_other' WHERE id = 'p1'`),
      ).rejects.toMatchObject({
        code: '23514',
        message: expect.stringContaining('captured_payment_frozen'),
      });
    }, 60_000);

    it('still lets an AUTHORIZED payment settle its fields on the way to capture', async () => {
      const db = await freshDb('txn-settle');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'AUTHORIZED', 'o2');

      // Not yet captured, so identity is still editable — the freeze
      // starts when the money does.
      await expect(
        db.client.query(`UPDATE payments SET order_id = 'o1' WHERE id = 'p1'`),
      ).resolves.toBeDefined();
      await expect(
        db.client.query(`UPDATE payments SET status = 'CAPTURED' WHERE id = 'p1'`),
      ).resolves.toBeDefined();
    }, 60_000);
  });

  // ------------------------------------------------ Meta Purchase link ----
  describe('a Meta Purchase cannot be orphaned', () => {
    it('refuses to refund the only capture behind a reported conversion', async () => {
      const db = await freshDb('txn-orphan');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');
      await seedMetaEvent(db);

      // Gap 3, before 0009: this succeeded, leaving a reported conversion
      // with no payment behind it. meta_events_require_capture watches the
      // meta_events side only; this is the missing half.
      await expect(
        db.client.query(`UPDATE payments SET status = 'REFUNDED' WHERE id = 'p1'`),
      ).rejects.toMatchObject({
        code: '23514',
        message: expect.stringContaining('meta_event_keeps_capture'),
      });

      expect(await statusOf(db, 'p1')).toBe('CAPTURED');
    }, 60_000);

    it('allows the refund when another capture still backs the order', async () => {
      const db = await freshDb('txn-orphan-ok');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');
      await seedMetaEvent(db);

      // A second capture on the same order is impossible while
      // payments_one_captured_per_order holds, so this is the realistic
      // shape: the refunded one leaves, another takes its place first.
      // Drop the partial index to construct the two-capture state the
      // trigger is written to tolerate.
      await db.client.query(`DROP INDEX payments_one_captured_per_order`);
      await seedPayment(db, 'p2', 'CAPTURED');

      await expect(
        db.client.query(`UPDATE payments SET status = 'REFUNDED' WHERE id = 'p1'`),
      ).resolves.toBeDefined();
      expect(await statusOf(db, 'p1')).toBe('REFUNDED');
      expect(await statusOf(db, 'p2')).toBe('CAPTURED');
    }, 60_000);

    it('allows the refund when the order has no Meta event at all', async () => {
      const db = await freshDb('txn-no-meta');
      await seedOrders(db);
      await seedPayment(db, 'p1', 'CAPTURED');

      await expect(
        db.client.query(`UPDATE payments SET status = 'REFUNDED' WHERE id = 'p1'`),
      ).resolves.toBeDefined();
    }, 60_000);

    it('the two halves together hold the invariant from both sides', async () => {
      const db = await freshDb('txn-both-sides');
      await seedOrders(db);

      // Side A (0003): no event without a capture.
      await expect(seedMetaEvent(db)).rejects.toMatchObject({ code: '23514' });

      // Side B (0009): no removing the capture under an existing event.
      await seedPayment(db, 'p1', 'CAPTURED');
      await seedMetaEvent(db);
      await expect(
        db.client.query(`UPDATE payments SET status = 'REFUNDED' WHERE id = 'p1'`),
      ).rejects.toMatchObject({ code: '23514' });
    }, 60_000);
  });

  // ------------------------------------------------------- still works ----
  it('the webhook capture path is unaffected', async () => {
    const db = await freshDb('txn-insert-path');
    await seedOrders(db);

    // INSERT straight to CAPTURED is what the webhook does, and the
    // transition trigger fires only on UPDATE.
    await expect(seedPayment(db, 'p1', 'CAPTURED')).resolves.toBeUndefined();
    await expect(seedMetaEvent(db)).resolves.toBeUndefined();
    expect(await statusOf(db, 'p1')).toBe('CAPTURED');
  }, 60_000);
});
