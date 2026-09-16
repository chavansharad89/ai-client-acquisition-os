import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { buildPurchaseEventId } from '@acos/core-capi';
import { getProduct, resolveProduct } from '@acos/catalog';
import { createOrderRequestSchema } from '@acos/core-payments';

import { seedCapturedPayment, seedOrder } from '../fixtures/idempotency-duplicates';
import { suiteDatabase } from './support/suiteDb';

// Adversarial payment-flow regression suite.
// -----------------------------------------------------------------------
// One block per attack from the audit. Each asserts the SPECIFIC mechanism
// that stops it, so that if the mechanism is ever removed the test fails
// for the right reason rather than passing on a coincidence.
//
// The three attacks that had no defence (1, 6, 7) are now closed by
// migration 0003's triggers; those blocks are the regression tests for
// that migration.
//
// Attacks are exercised against the DATABASE, not the HTTP layer, because
// the webhook handler does not exist yet. That is deliberate: a defence
// that lives only in an unwritten handler is not a defence, and these
// tests assert the invariants that hold whatever that handler turns out
// to look like.
// -----------------------------------------------------------------------

const suite = suiteDatabase('adversarial');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const PRODUCT = 'ai_freelancing_499';
const PRICE = 49_900;
const CHEAP = 'ai_income_99';

async function payment(
  orderId: string,
  suffix: string,
  over: {
    amountPaise?: number;
    currency?: string;
    status?: string;
    razorpayPaymentId?: string;
  } = {},
): Promise<string> {
  const { db, context } = suite.require();
  const id = context.id('payment', suffix);
  await db.client.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())`,
    [
      id,
      over.razorpayPaymentId ?? `rzp_${id}_${randomUUID().slice(0, 8)}`,
      orderId,
      over.amountPaise ?? PRICE,
      over.currency ?? 'INR',
      over.status ?? 'CAPTURED',
    ],
  );
  return context.trackPayment(id);
}

async function metaEvent(orderId: string, suffix: string, metaEventId?: string): Promise<string> {
  const { db, context } = suite.require();
  const id = context.id('metaevent', suffix);
  await db.client.query(
    `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product,
                              value_paise, currency, updated_at)
     VALUES ($1, $2, $3, 'Purchase', $4, $5, 'INR', now())`,
    [id, metaEventId ?? `purchase_${id}`, orderId, PRODUCT, PRICE],
  );
  return context.trackMetaEvent(id);
}

async function webhookEvent(eventId: string, suffix: string): Promise<string> {
  const { db, context } = suite.require();
  const id = context.id('webhook', suffix);
  await db.client.query(
    `INSERT INTO webhook_events (id, razorpay_event_id, event_name, payload, signature_valid, updated_at)
     VALUES ($1, $2, 'payment.captured', '{}'::jsonb, true, now())`,
    [id, eventId],
  );
  return context.trackWebhookEvent(id);
}

// ================================================= ATTACK 1 — FIXED ====

describe('Attack 1 — buy a ₹499 product while paying ₹1', () => {
  it('REGRESSION (0003): a payment whose amount differs from its order is rejected', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a1');

    await expect(payment(orderId, 'a1underpay', { amountPaise: 100 })).rejects.toThrow(
      /payment_amount_matches_order/,
    );
  });

  it('REGRESSION (0003): overpayment is rejected too', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a1over');
    await expect(payment(orderId, 'a1overpay', { amountPaise: 999_999 })).rejects.toThrow(
      /payment_amount_matches_order/,
    );
  });

  it('REGRESSION (0003): a currency swap is rejected', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a1curr');
    await expect(payment(orderId, 'a1usd', { currency: 'USD' })).rejects.toThrow(
      /payment_currency_matches_order/,
    );
  });

  it('REGRESSION (0003): the exact amount is accepted', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a1ok');
    await expect(payment(orderId, 'a1exact')).resolves.toBeTruthy();
  });

  it('PREVENTED: the client cannot influence the order amount in the first place', () => {
    // .strict() means a body carrying a price is rejected outright, not ignored.
    const withPrice = createOrderRequestSchema.safeParse({
      productId: PRODUCT,
      customerEmail: 'a@b.com',
      amountPaise: 100,
    });
    expect(withPrice.success).toBe(false);
    expect(getProduct(PRODUCT).amountPaise).toBe(PRICE);
  });
});

// ============================================== ATTACK 2 — PREVENTED ===

describe('Attack 2 — mark an order paid from the browser', () => {
  it('PREVENTED: orders are created PENDING and no field accepts a status', () => {
    const parsed = createOrderRequestSchema.safeParse({
      productId: PRODUCT,
      customerEmail: 'a@b.com',
      status: 'PAID',
    });
    expect(parsed.success).toBe(false); // .strict() rejects the extra field
  });

  it('PREVENTED: a paid-looking order with no payment still yields no Meta event', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a2');
    // Even flipping the order status by hand grants nothing downstream,
    // because the Meta trigger tests for a CAPTURED PAYMENT, not a status.
    await db.client.query(`UPDATE orders SET status = 'PAID' WHERE id = $1`, [orderId]);

    await expect(metaEvent(orderId, 'a2')).rejects.toThrow(/meta_event_requires_captured_payment/);
  });
});

// ============================================== ATTACK 3 — PREVENTED ===

describe('Attack 3 — replay a webhook', () => {
  it('PREVENTED: the razorpay_event_id unique index rejects the replay', async () => {
    const eventId = `evt_${randomUUID()}`;
    await webhookEvent(eventId, 'a3first');
    await expect(webhookEvent(eventId, 'a3replay')).rejects.toThrow(
      /webhook_events_razorpay_event_id_key/,
    );
  });

  it('PREVENTED: the original event survives the rejected replay', async () => {
    const { db } = suite.require();
    const eventId = `evt_${randomUUID()}`;
    const first = await webhookEvent(eventId, 'a3keep');
    await webhookEvent(eventId, 'a3dupe').catch(() => undefined);

    const { rows } = await db.client.query(
      `SELECT id FROM webhook_events WHERE razorpay_event_id = $1`,
      [eventId],
    );
    expect(rows.map((r) => r.id)).toEqual([first]);
  });
});

// ============================================== ATTACK 4 — PREVENTED ===

describe('Attack 4 — reuse a payment ID', () => {
  it('PREVENTED: razorpay_payment_id is unique across all orders', async () => {
    const { db, context } = suite.require();
    const orderA = await seedOrder(db.client, context, 'a4a');
    const orderB = await seedOrder(db.client, context, 'a4b');
    const shared = `rzp_shared_${randomUUID()}`;

    await payment(orderA, 'a4one', { razorpayPaymentId: shared });
    await expect(payment(orderB, 'a4two', { razorpayPaymentId: shared })).rejects.toThrow(
      /payments_razorpay_payment_id_key/,
    );
  });

  it('PREVENTED: one order cannot accumulate two captured payments', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a4same');
    await payment(orderId, 'a4cap1');
    await expect(payment(orderId, 'a4cap2')).rejects.toThrow(/payments_one_captured_per_order/);
  });
});

// ============================================== ATTACK 5 — PREVENTED ===

describe('Attack 5 — reuse a webhook ID', () => {
  it('PREVENTED: a second event claiming an existing id cannot be stored', async () => {
    const eventId = `evt_${randomUUID()}`;
    await webhookEvent(eventId, 'a5');
    await expect(webhookEvent(eventId, 'a5again')).rejects.toThrow(
      /webhook_events_razorpay_event_id_key/,
    );
  });
});

// ================================================= ATTACK 6 — FIXED ====

describe('Attack 6 — change the product after the Razorpay order exists', () => {
  it('REGRESSION (0003): the product cannot be swapped once a payment exists', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a6');
    await payment(orderId, 'a6');

    await expect(
      db.client.query(`UPDATE orders SET product_slug = $2 WHERE id = $1`, [orderId, CHEAP]),
    ).rejects.toThrow(/order_financials_frozen/);
  });

  it('REGRESSION (0003): the amount cannot be raised after payment', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a6amt');
    await payment(orderId, 'a6amt');

    await expect(
      db.client.query(`UPDATE orders SET amount_paise = 1 WHERE id = $1`, [orderId]),
    ).rejects.toThrow(/order_financials_frozen/);
  });

  it('REGRESSION (0003): non-financial fields remain editable', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a6ok');
    await payment(orderId, 'a6ok');

    await expect(
      db.client.query(`UPDATE orders SET status = 'PAID' WHERE id = $1`, [orderId]),
    ).resolves.toBeTruthy();
  });

  it('REGRESSION (0003): an unpaid order can still be corrected', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a6unpaid');
    await expect(
      db.client.query(`UPDATE orders SET product_slug = $2 WHERE id = $1`, [orderId, CHEAP]),
    ).resolves.toBeTruthy();
  });
});

// ================================================= ATTACK 7 — FIXED ====

describe('Attack 7 — emit a Meta Purchase without paying', () => {
  it('REGRESSION (0003): a meta event for an unpaid order is rejected', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a7');
    await expect(metaEvent(orderId, 'a7')).rejects.toThrow(/meta_event_requires_captured_payment/);
  });

  it('REGRESSION (0003): an AUTHORIZED payment is not enough — money must be taken', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a7auth');
    await payment(orderId, 'a7auth', { status: 'AUTHORIZED' });

    await expect(metaEvent(orderId, 'a7auth')).rejects.toThrow(
      /meta_event_requires_captured_payment/,
    );
  });

  it('REGRESSION (0003): a FAILED payment is not enough', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a7failed');
    await payment(orderId, 'a7failed', { status: 'FAILED' });
    await expect(metaEvent(orderId, 'a7failed')).rejects.toThrow(
      /meta_event_requires_captured_payment/,
    );
  });

  it('REGRESSION (0003): a captured payment permits exactly the legitimate case', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a7ok');
    await seedCapturedPayment(db.client, context, orderId, 'a7ok');
    await expect(metaEvent(orderId, 'a7ok')).resolves.toBeTruthy();
  });
});

// ============================================== ATTACK 8 — PREVENTED ===

describe('Attack 8 — emit a duplicate Meta Purchase', () => {
  it('PREVENTED: the deterministic event id collides on the unique index', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a8');
    await seedCapturedPayment(db.client, context, orderId, 'a8');

    // Both attempts derive the id the same way, from the same payment.
    const stable = buildPurchaseEventId({ paymentId: 'pay_a8' });
    await metaEvent(orderId, 'a8one', stable);

    await expect(metaEvent(orderId, 'a8two', stable)).rejects.toThrow(
      /meta_events_meta_event_id_key/,
    );
  });

  it('PREVENTED: the id derivation is what makes a retry collide, not luck', () => {
    expect(buildPurchaseEventId({ paymentId: 'pay_x' })).toBe(
      buildPurchaseEventId({ paymentId: 'pay_x' }),
    );
    expect(buildPurchaseEventId({ paymentId: 'pay_x' })).not.toBe(
      buildPurchaseEventId({ paymentId: 'pay_y' }),
    );
  });
});

// ============================================== ATTACK 9 — PREVENTED ===

describe('Attack 9 — bypass the product catalog', () => {
  it('PREVENTED: an unknown product id is rejected at resolution', () => {
    for (const bad of ['not_a_product', '', null, undefined, 42, {}, 'ai_income_99 ']) {
      expect(() => resolveProduct(bad), String(bad)).toThrow();
    }
  });

  it('PREVENTED: extra fields cannot smuggle a price or name past the schema', () => {
    for (const extra of [
      { amountPaise: 1 },
      { amount: 1 },
      { price: 1 },
      { productName: 'free' },
      { currency: 'USD' },
    ]) {
      const parsed = createOrderRequestSchema.safeParse({
        productId: PRODUCT,
        customerEmail: 'a@b.com',
        ...extra,
      });
      expect(parsed.success, JSON.stringify(extra)).toBe(false);
    }
  });

  it('PREVENTED: the catalog price is the only price that exists', () => {
    expect(getProduct(PRODUCT).amountPaise).toBe(PRICE);
    expect(getProduct(CHEAP).amountPaise).toBe(9_900);
  });
});

// ============================================= ATTACK 10 — PREVENTED ===

describe('Attack 10 — race two webhook requests', () => {
  it('PREVENTED: concurrent identical events yield exactly one row', async () => {
    const { db } = suite.require();
    const eventId = `evt_${randomUUID()}`;

    const results = await Promise.allSettled([
      webhookEvent(eventId, 'a10one'),
      webhookEvent(eventId, 'a10two'),
      webhookEvent(eventId, 'a10three'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM webhook_events WHERE razorpay_event_id = $1`,
      [eventId],
    );
    expect(rows[0].n).toBe(1);
  });

  it('PREVENTED: concurrent captures on one order yield exactly one payment', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a10cap');

    const results = await Promise.allSettled([
      payment(orderId, 'a10capA'),
      payment(orderId, 'a10capB'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM payments WHERE order_id = $1 AND status = 'CAPTURED'`,
      [orderId],
    );
    expect(rows[0].n).toBe(1);
  });

  it('PREVENTED: a race cannot produce two Meta events for one payment', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'a10meta');
    await seedCapturedPayment(db.client, context, orderId, 'a10meta');
    const stable = buildPurchaseEventId({ paymentId: 'pay_a10' });

    const results = await Promise.allSettled([
      metaEvent(orderId, 'a10mOne', stable),
      metaEvent(orderId, 'a10mTwo', stable),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
});
