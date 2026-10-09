import { createHmac, randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildPurchaseEventId } from '@acos/core-capi';
import {
  createWebhookTransactionRunner,
  handleRazorpayWebhook,
  recordWebhookRejection,
  verifyRazorpayWebhook,
  type WebhookOutcome,
} from '@acos/core-payments';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// ₹1,499 Client Finder SUBSCRIPTION — webhook handling, against real
// PostgreSQL (mirrors tests/integration/webhook-boundary.integration.test.ts's
// own conventions). Covers plan §H.2a (subscription.charged activation
// and renewal), §H.2b (log-only lifecycle events, no access effect),
// and IRL-N (refund linking to a subscription_periods row, additive
// alongside the existing one-time-order refund flow).

const SECRET = 'whsec_subscription_integration_test';
const SUBSCRIPTION_PRODUCT_SLUG = 'ai_client_acquisition_1499_subscription';
const ONE_TIME_PAISE = 9_900;

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
  transaction: ReturnType<typeof createWebhookTransactionRunner>;
}

async function freshEnv(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});
  open.push(db);
  const pool = new Pool({ connectionString: db.url });
  pools.push(pool);
  return { db, pool, transaction: createWebhookTransactionRunner(pool) };
}

async function seedUser(env: Env, suffix: string): Promise<{ id: string }> {
  const id = `user_${suffix}`;
  await env.db.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [
    id,
    `user_${suffix}@example.test`,
  ]);
  return { id };
}

/** A paid-for one-time order, for the "refund falls through unchanged" test. */
async function seedOneTimeOrder(env: Env, suffix: string): Promise<{ razorpayOrderId: string }> {
  const razorpayOrderId = `order_rzp_${suffix}`;
  await env.db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, 'buyer@example.test', 'ai_income_99', 'AI Income Starter Kit',
             $3, 'INR', 'PENDING', now())`,
    [`order_${suffix}`, razorpayOrderId, ONE_TIME_PAISE],
  );
  return { razorpayOrderId };
}

function sign(raw: string): string {
  return createHmac('sha256', SECRET).update(raw).digest('hex');
}

function chargedBody(opts: {
  razorpaySubscriptionId: string;
  paymentId: string;
  userId?: string;
  notes?: Record<string, string>;
}): string {
  return JSON.stringify({
    event: 'subscription.charged',
    payload: {
      subscription: {
        entity: {
          id: opts.razorpaySubscriptionId,
          status: 'active',
          notes: opts.notes ?? (opts.userId ? { userId: opts.userId } : {}),
        },
      },
      payment: {
        entity: {
          id: opts.paymentId,
          order_id: `order_auto_${opts.paymentId}`,
          amount: 149900,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });
}

function oneTimeCapturedBody(razorpayOrderId: string, paymentId: string): string {
  return JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          amount: ONE_TIME_PAISE,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });
}

function refundBody(paymentId: string, event: 'refund.created' | 'refund.processed', amount: number): string {
  return JSON.stringify({
    event,
    payload: {
      refund: {
        entity: {
          id: `rfnd_${paymentId}`,
          payment_id: paymentId,
          amount,
          currency: 'INR',
          status: event === 'refund.created' ? 'created' : 'processed',
        },
      },
    },
  });
}

function lifecycleEventBody(event: string): string {
  return JSON.stringify({
    event,
    payload: { subscription: { entity: { id: 'sub_lifecycle', status: 'whatever' } } },
  });
}

/** The route's flow, minus Next.js: raw bytes -> verify -> handle. */
async function deliver(env: Env, raw: string, eventId = `evt_${randomUUID()}`): Promise<WebhookOutcome> {
  const verification = verifyRazorpayWebhook({
    rawBody: Buffer.from(raw, 'utf8'),
    signatureHeader: sign(raw),
    webhookSecret: SECRET,
    sourceIp: '203.0.113.9',
  });
  if (!verification.ok) {
    await recordWebhookRejection(env.pool, verification.rejection);
    throw new Error(`test setup produced an unsigned/invalid request: ${verification.rejection.reason}`);
  }
  return handleRazorpayWebhook(verification.verified, {
    transaction: env.transaction,
    buildMetaEventId: (paymentId) => buildPurchaseEventId({ paymentId }),
    eventId,
    clientFinderSubscriptionDurationDays: 30,
  });
}

interface SubscriptionPeriodRow {
  user_id: string;
  product_slug: string;
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  duration_days: number;
  refunded_at: Date | null;
}

async function subscriptionPeriodRow(env: Env, razorpayPaymentId: string): Promise<SubscriptionPeriodRow | null> {
  const { rows } = await env.db.client.query<SubscriptionPeriodRow>(
    `SELECT user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, duration_days, refunded_at
       FROM subscription_periods WHERE razorpay_payment_id = $1`,
    [razorpayPaymentId],
  );
  return rows[0] ?? null;
}

async function countRows(env: Env, table: string): Promise<number> {
  const { rows } = await env.db.client.query<{ n: string }>(`SELECT count(*)::text AS n FROM ${table}`);
  return Number(rows[0]!.n);
}

describe('subscription.charged', () => {
  it('creates an active subscription_periods row attributed to notes.userId', async () => {
    const env = await freshEnv('sub-charged-1');
    const user = await seedUser(env, '1');

    const outcome = await deliver(env, chargedBody({ razorpaySubscriptionId: 'sub_1', paymentId: 'pay_1', userId: user.id }));

    expect(outcome.status).toBe('processed');
    const row = await subscriptionPeriodRow(env, 'pay_1');
    expect(row).toMatchObject({
      user_id: user.id,
      product_slug: SUBSCRIPTION_PRODUCT_SLUG,
      razorpay_subscription_id: 'sub_1',
      razorpay_payment_id: 'pay_1',
      duration_days: 30,
      refunded_at: null,
    });
  }, 60_000);

  it('is idempotent on razorpay_payment_id — a second delivery referencing the same charge creates no second row', async () => {
    const env = await freshEnv('sub-charged-2');
    const user = await seedUser(env, '2');
    const raw = chargedBody({ razorpaySubscriptionId: 'sub_2', paymentId: 'pay_2', userId: user.id });

    await deliver(env, raw, 'evt_a');
    const outcome2 = await deliver(env, raw, 'evt_b'); // distinct OUTER event id — proves the INNER (razorpay_payment_id) anchor, independent of the webhook_events dedupe

    expect(outcome2.status).toBe('processed');
    expect(
      await countRowsWhere(env, 'subscription_periods', 'razorpay_payment_id', 'pay_2'),
    ).toBe(1);
  }, 60_000);

  it('a second charge on the SAME subscription creates a new, independent period (renewal, IRL-C)', async () => {
    const env = await freshEnv('sub-charged-3');
    const user = await seedUser(env, '3');

    await deliver(env, chargedBody({ razorpaySubscriptionId: 'sub_3', paymentId: 'pay_3a', userId: user.id }));
    await deliver(env, chargedBody({ razorpaySubscriptionId: 'sub_3', paymentId: 'pay_3b', userId: user.id }));

    expect(
      await countRowsWhere(env, 'subscription_periods', 'razorpay_subscription_id', 'sub_3'),
    ).toBe(2);
  }, 60_000);

  it('rolls back the whole transaction (including the outer webhook_events row) when notes carries no attributable userId', async () => {
    const env = await freshEnv('sub-charged-4');
    const raw = chargedBody({ razorpaySubscriptionId: 'sub_4', paymentId: 'pay_4', notes: {} });

    await expect(deliver(env, raw)).rejects.toThrow();

    expect(await countRows(env, 'subscription_periods')).toBe(0);
    expect(await countRows(env, 'webhook_events')).toBe(0);
  }, 60_000);
});

describe('subscription lifecycle events with no access effect (plan §H.2b)', () => {
  const LOG_ONLY_EVENTS = [
    'subscription.authenticated',
    'subscription.pending',
    'subscription.activated',
    'subscription.paused',
    'subscription.resumed',
    'subscription.halted',
    'subscription.completed',
    'subscription.cancelled',
    'subscription.updated',
  ];

  it.each(LOG_ONLY_EVENTS)('%s is acknowledged (200-equivalent) and mutates no subscription_periods row', async (event) => {
    const env = await freshEnv(`sub-lifecycle-${event.replace(/\./g, '-')}`);

    const outcome = await deliver(env, lifecycleEventBody(event));

    // Not independently supported (plan §H.2b: access is never governed
    // by Razorpay's own provider-lifecycle events) — acknowledged and
    // recorded, same as any event this system has no opinion about.
    expect(outcome.status).toBe('ignored');
    expect(await countRows(env, 'subscription_periods')).toBe(0);
  }, 60_000);
});

describe('refund.* linking to a subscription period (IRL-N)', () => {
  it('sets refunded_at on the matching subscription_periods row, without touching refund_events/payments', async () => {
    const env = await freshEnv('sub-refund-1');
    const user = await seedUser(env, '5');
    await deliver(env, chargedBody({ razorpaySubscriptionId: 'sub_5', paymentId: 'pay_5', userId: user.id }));

    const outcome = await deliver(env, refundBody('pay_5', 'refund.created', 149900));

    expect(outcome.status).toBe('processed');
    const row = await subscriptionPeriodRow(env, 'pay_5');
    expect(row).not.toBeNull();
    expect(row?.refunded_at).not.toBeNull();
    expect(await countRows(env, 'refund_events')).toBe(0);
    expect(await countRows(env, 'payments')).toBe(0);
  }, 60_000);

  it('is idempotent across refund.created AND refund.processed for the same payment', async () => {
    const env = await freshEnv('sub-refund-2');
    const user = await seedUser(env, '6');
    await deliver(env, chargedBody({ razorpaySubscriptionId: 'sub_6', paymentId: 'pay_6', userId: user.id }));

    await deliver(env, refundBody('pay_6', 'refund.created', 149900));
    const outcome2 = await deliver(env, refundBody('pay_6', 'refund.processed', 149900));

    expect(outcome2.status).toBe('processed');
    const row = await subscriptionPeriodRow(env, 'pay_6');
    expect(row?.refunded_at).not.toBeNull();
  }, 60_000);

  it('does not interfere with the existing one-time-order refund flow for a payment that is NOT a subscription charge', async () => {
    const env = await freshEnv('sub-refund-3');
    const { razorpayOrderId } = await seedOneTimeOrder(env, '7');
    await deliver(env, oneTimeCapturedBody(razorpayOrderId, 'pay_onetime_7'));

    const outcome = await deliver(env, refundBody('pay_onetime_7', 'refund.created', ONE_TIME_PAISE));

    expect(outcome.status).toBe('processed');
    expect(await countRows(env, 'refund_events')).toBe(1);
    expect(await countRows(env, 'subscription_periods')).toBe(0);
  }, 60_000);
});

async function countRowsWhere(env: Env, table: string, column: string, value: string): Promise<number> {
  const { rows } = await env.db.client.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM ${table} WHERE ${column} = $1`,
    [value],
  );
  return Number(rows[0]!.n);
}
