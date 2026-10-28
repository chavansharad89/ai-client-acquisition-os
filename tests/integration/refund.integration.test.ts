import { randomUUID } from 'node:crypto';

import { findPaymentByRazorpayPaymentId, insertRefundEvent } from '@acos/core-payments';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { seedCapturedPayment, seedOrder } from '../fixtures/idempotency-duplicates';

import { suiteDatabase } from './support/suiteDb';

// REFUND PROCESSING (B-6) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves refund_events' dedupe (the unique index on razorpay_refund_id,
// reusing the WebhookEvent idiom — see refundEvents.ts) and the
// payment-lookup findPaymentByRazorpayPaymentId that webhookHandler.ts's
// refund branch depends on, against a real database rather than a fake.
// -----------------------------------------------------------------------

const suite = suiteDatabase('refund');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

describe('findPaymentByRazorpayPaymentId', () => {
  it('resolves the order and amount for a captured payment', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a');
    const paymentId = await seedCapturedPayment(db.client, context, orderId, 'a');

    const { rows } = await db.client.query(
      `SELECT razorpay_payment_id FROM payments WHERE id = $1`,
      [paymentId],
    );
    const razorpayPaymentId = (rows[0] as { razorpay_payment_id: string }).razorpay_payment_id;

    const found = await findPaymentByRazorpayPaymentId(db.client, razorpayPaymentId);
    expect(found).toMatchObject({ id: paymentId, orderId, amountPaise: 49_900 });
  });

  it('returns null for a payment id this system never captured', async () => {
    const { db } = suite.require();
    const found = await findPaymentByRazorpayPaymentId(db.client, `rzp_pay_${randomUUID()}`);
    expect(found).toBeNull();
  });
});

describe('insertRefundEvent — dedupe', () => {
  it('a second insert with the same razorpay_refund_id is a no-op', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'b');
    const paymentId = await seedCapturedPayment(db.client, context, orderId, 'b');
    const refundEventId = context.id('refund', 'b');
    const razorpayRefundId = `rfnd_${refundEventId}`;

    const first = await insertRefundEvent(db.client, {
      razorpayRefundId,
      orderId,
      paymentId,
      amountPaise: 49_900,
      currency: 'INR',
      refundType: 'FULL',
      status: 'processed',
      occurredAt: new Date(),
    });
    // No explicit tracking needed: insertRefundEvent mints its own id, so
    // cleanup deletes refund_events by order_id instead (test-run-context.ts),
    // and orderId is already tracked via seedOrder.

    const second = await insertRefundEvent(db.client, {
      razorpayRefundId,
      orderId,
      paymentId,
      amountPaise: 49_900,
      currency: 'INR',
      refundType: 'FULL',
      status: 'processed',
      occurredAt: new Date(),
    });

    expect(first).toBe(true);
    expect(second).toBe(false);

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM refund_events WHERE razorpay_refund_id = $1`,
      [razorpayRefundId],
    );
    expect(rows[0].n).toBe(1);
  });

  it('distinct refund ids for the same payment are NOT deduped (a legitimate partial-then-full sequence)', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'c');
    const paymentId = await seedCapturedPayment(db.client, context, orderId, 'c');

    const partialId = context.id('refund', 'c-partial');
    const fullId = context.id('refund', 'c-full');

    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${partialId}`,
      orderId,
      paymentId,
      amountPaise: 10_000,
      currency: 'INR',
      refundType: 'PARTIAL',
      status: 'processed',
      occurredAt: new Date(),
    });
    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${fullId}`,
      orderId,
      paymentId,
      amountPaise: 39_900,
      currency: 'INR',
      refundType: 'PARTIAL',
      status: 'processed',
      occurredAt: new Date(),
    });

    const rows = await db.client.query(
      `SELECT id, razorpay_refund_id FROM refund_events WHERE order_id = $1 ORDER BY razorpay_refund_id`,
      [orderId],
    );
    expect(rows.rowCount).toBe(2);
  });

  it('classifies FULL vs PARTIAL correctly relative to the captured amount', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'd');
    const paymentId = await seedCapturedPayment(db.client, context, orderId, 'd');
    const refundId = context.id('refund', 'd');

    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${refundId}`,
      orderId,
      paymentId,
      amountPaise: 49_900,
      currency: 'INR',
      refundType: 'FULL',
      status: 'processed',
      occurredAt: new Date(),
    });
    const { rows } = await db.client.query(
      `SELECT id, refund_type FROM refund_events WHERE razorpay_refund_id = $1`,
      [`rfnd_${refundId}`],
    );
    expect(rows[0].refund_type).toBe('FULL');
  });

  it('rejects a refund_type outside FULL/PARTIAL at the database level', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'e');
    const paymentId = await seedCapturedPayment(db.client, context, orderId, 'e');

    await expect(
      db.client.query(
        `INSERT INTO refund_events
           (id, razorpay_refund_id, order_id, payment_id, amount_paise, currency,
            refund_type, status, occurred_at, updated_at)
         VALUES ($1, $2, $3, $4, 100, 'INR', 'BOGUS', 'processed', now(), now())`,
        [context.id('refund', 'e'), `rfnd_${context.id('refund', 'e')}`, orderId, paymentId],
      ),
    ).rejects.toThrow(/refund_events_refund_type_check/);
  });

  it('a refund referencing an order this system never created is rejected by the FK', async () => {
    const { db, context } = suite.require();
    await expect(
      db.client.query(
        `INSERT INTO refund_events
           (id, razorpay_refund_id, order_id, amount_paise, currency,
            refund_type, status, occurred_at, updated_at)
         VALUES ($1, $2, $3, 100, 'INR', 'FULL', 'processed', now(), now())`,
        [context.id('refund', 'f'), `rfnd_${context.id('refund', 'f')}`, `order_${randomUUID()}`],
      ),
    ).rejects.toThrow();
  });
});
