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

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// The webhook trust boundary, against real PostgreSQL.
// -----------------------------------------------------------------------
// The invariant under test:
//
//   an UNVERIFIED request must not enter business processing, and must
//   not persist arbitrary attacker-controlled JSON.
//
// "Must not persist" is asserted the only way worth asserting it: by
// counting rows in every table a webhook could possibly write to, after
// sending requests that a naive implementation would have accepted.
// -----------------------------------------------------------------------

const SECRET = 'whsec_integration_test_secret';
const STARTER = 'ai_income_99';
const STARTER_PAISE = 9_900;

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
  const db = await createTempDatabase(label, {
    // 0005/0006 ALTER tables no migration creates (separate tracked
    // defect); 0007 is the boundary migration this suite exists for.
  });
  open.push(db);
  const pool = new Pool({ connectionString: db.url });
  pools.push(pool);
  return { db, pool, transaction: createWebhookTransactionRunner(pool) };
}

/** A paid-for order the webhook can legitimately reference. */
async function seedOrder(env: Env, suffix: string): Promise<{ razorpayOrderId: string }> {
  const razorpayOrderId = `order_rzp_${suffix}`;
  await env.db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, 'buyer@example.test', $3, 'AI Income Starter Kit',
             $4, 'INR', 'PENDING', now())`,
    [`order_${suffix}`, razorpayOrderId, STARTER, STARTER_PAISE],
  );
  return { razorpayOrderId };
}

function body(razorpayOrderId: string, paymentId: string, event = 'payment.captured'): string {
  return JSON.stringify({
    event,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          amount: STARTER_PAISE,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });
}

function sign(raw: string): string {
  return createHmac('sha256', SECRET).update(raw).digest('hex');
}

/**
 * The route's flow, minus Next.js: raw bytes -> verify -> handle, with
 * rejections recorded as metadata only.
 */
async function deliver(
  env: Env,
  raw: string,
  signature: string | null,
  eventId = `evt_${randomUUID()}`,
): Promise<{ accepted: boolean; outcome?: WebhookOutcome }> {
  const verification = verifyRazorpayWebhook({
    rawBody: Buffer.from(raw, 'utf8'),
    signatureHeader: signature,
    webhookSecret: SECRET,
    sourceIp: '203.0.113.9',
  });

  if (!verification.ok) {
    await recordWebhookRejection(env.pool, verification.rejection);
    return { accepted: false };
  }

  const outcome = await handleRazorpayWebhook(verification.verified, {
    transaction: env.transaction,
    buildMetaEventId: (paymentId) => buildPurchaseEventId({ paymentId }),
    eventId,
  });
  if (outcome.status === 'rejected') {
    await recordWebhookRejection(env.pool, outcome.rejection);
    return { accepted: false, outcome };
  }
  return { accepted: true, outcome };
}

async function counts(env: Env): Promise<Record<string, number>> {
  const tables = ['webhook_events', 'payments', 'entitlements', 'meta_events', 'access_tokens'];
  const out: Record<string, number> = {};
  for (const table of tables) {
    const { rows } = await env.db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM ${table}`,
    );
    out[table] = Number(rows[0]!.n);
  }
  return out;
}

const NOTHING_WRITTEN = {
  webhook_events: 0,
  payments: 0,
  entitlements: 0,
  meta_events: 0,
  access_tokens: 0,
};

describe('webhook trust boundary (real PostgreSQL)', () => {
  it('runs against a real PostgreSQL server', async () => {
    const env = await freshEnv('wh-probe');
    const { rows } = await env.db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
  }, 60_000);

  // ------------------------------------------------------------- 1 ----
  it('1. a valid signature is processed: event, payment, entitlement and outbox row', async () => {
    const env = await freshEnv('wh-valid');
    const { razorpayOrderId } = await seedOrder(env, 'v1');
    const raw = body(razorpayOrderId, 'pay_v1');

    const result = await deliver(env, raw, sign(raw));

    expect(result.accepted).toBe(true);
    expect(result.outcome?.status).toBe('processed');
    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 1,
      entitlements: 1,
      meta_events: 1,
    });

    // The amount came from the ORDER, not the payload.
    const { rows } = await env.db.client.query<{ amount_paise: number; status: string }>(
      'SELECT amount_paise, status FROM payments',
    );
    expect(rows[0]).toMatchObject({ amount_paise: STARTER_PAISE, status: 'CAPTURED' });

    // And the stored webhook event is marked verified, because it is.
    const { rows: events } = await env.db.client.query<{
      signature_valid: boolean;
      processed_at: Date | null;
    }>('SELECT signature_valid, processed_at FROM webhook_events');
    expect(events[0]!.signature_valid).toBe(true);
    expect(events[0]!.processed_at).not.toBeNull();
  }, 60_000);

  // --------------------------------------------------- 2, 9, 10, 11, 12 ----
  describe('unverified requests are refused and persist nothing', () => {
    it('2. an invalid signature writes no business rows at all', async () => {
      const env = await freshEnv('wh-badsig');
      const { razorpayOrderId } = await seedOrder(env, 'b1');
      const raw = body(razorpayOrderId, 'pay_b1');

      const result = await deliver(env, raw, 'a'.repeat(64));

      expect(result.accepted).toBe(false);
      // 9, 10, 11, 12 in one assertion: no WebhookEvent, no Payment, no
      // Entitlement, no outbox (meta_events) row, no access token.
      expect(await counts(env)).toEqual(NOTHING_WRITTEN);
    }, 60_000);

    it('3. a modified body is refused — the signature covers the bytes', async () => {
      const env = await freshEnv('wh-modbody');
      const { razorpayOrderId } = await seedOrder(env, 'b2');
      const raw = body(razorpayOrderId, 'pay_b2');
      const signature = sign(raw);

      // Same JSON, one field changed: an attacker inflating the amount.
      const tampered = raw.replace('"amount":9900', '"amount":1');

      expect(await deliver(env, tampered, signature)).toMatchObject({ accepted: false });
      expect(await counts(env)).toEqual(NOTHING_WRITTEN);
    }, 60_000);

    it('3b. a parsed-and-re-serialised body is refused', async () => {
      const env = await freshEnv('wh-reserial');
      const { razorpayOrderId } = await seedOrder(env, 'b3');
      const raw = body(razorpayOrderId, 'pay_b3');
      const signature = sign(raw);

      // What "parse then re-stringify" produces. Spacing and key order
      // both change the HMAC, which is why the route must hash the bytes
      // that arrived. (A re-serialisation that happens to be byte-identical
      // would verify — correctly; the signature is over bytes, and identical
      // bytes are the same request. The danger is assuming that is the
      // common case, which it is not.)
      const roundTripped = JSON.stringify(JSON.parse(raw), null, 2);

      expect(await deliver(env, roundTripped, signature)).toMatchObject({ accepted: false });
      expect(await counts(env)).toEqual(NOTHING_WRITTEN);
    }, 60_000);

    it('4. a modified signature is refused', async () => {
      const env = await freshEnv('wh-modsig');
      const { razorpayOrderId } = await seedOrder(env, 'b4');
      const raw = body(razorpayOrderId, 'pay_b4');
      const signature = sign(raw);
      const flipped = `${signature.slice(0, 63)}${signature[63] === 'a' ? 'b' : 'a'}`;

      expect(await deliver(env, raw, flipped)).toMatchObject({ accepted: false });
      expect(await counts(env)).toEqual(NOTHING_WRITTEN);
    }, 60_000);

    it('4b. a missing, empty, or malformed signature is refused', async () => {
      const env = await freshEnv('wh-nosig');
      const { razorpayOrderId } = await seedOrder(env, 'b5');
      const raw = body(razorpayOrderId, 'pay_b5');

      for (const signature of [null, '', 'not-hex', 'abc', `${sign(raw)}extra`]) {
        expect(await deliver(env, raw, signature)).toMatchObject({ accepted: false });
      }
      expect(await counts(env)).toEqual(NOTHING_WRITTEN);
    }, 60_000);

    it('records only safe metadata for refusals, never the payload', async () => {
      const env = await freshEnv('wh-reject-meta');
      const { razorpayOrderId } = await seedOrder(env, 'b6');
      const secret = 'attacker-chosen-marker-9f2c7a';
      const raw = body(razorpayOrderId, secret);

      await deliver(env, raw, 'b'.repeat(64));

      const { rows } = await env.db.client.query<Record<string, unknown>>(
        'SELECT * FROM webhook_rejections',
      );
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.reason).toBe('bad-signature');
      expect(row.signature_present).toBe(true);
      expect(row.signature_well_formed).toBe(true);
      expect(row.body_bytes).toBe(Buffer.byteLength(raw));
      expect(row.source_ip).toBe('203.0.113.9');

      // The decisive assertion: nothing an attacker chose is in the row.
      expect(JSON.stringify(row)).not.toContain(secret);
      expect(JSON.stringify(row)).not.toContain(razorpayOrderId);
      expect(JSON.stringify(row)).not.toContain('payment.captured');
    }, 60_000);

    it('the schema itself forbids storing an unverified event', async () => {
      const env = await freshEnv('wh-check');
      // Even with direct database access, an insert-then-verify handler
      // cannot land a row. The boundary is a constraint, not a habit.
      await expect(
        env.db.client.query(
          `INSERT INTO webhook_events
             (id, provider, razorpay_event_id, event_name, payload, signature_valid,
              received_at, updated_at)
           VALUES ($1, 'razorpay', 'evt_forged', 'payment.captured',
                   '{"attacker":"controlled"}'::jsonb, false, now(), now())`,
          [randomUUID()],
        ),
      ).rejects.toMatchObject({ code: '23514' });

      // And webhook_rejections has nowhere to put a payload.
      const { rows } = await env.db.client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'webhook_rejections'`,
      );
      const columns = rows.map((r) => r.column_name);
      expect(columns).not.toContain('payload');
      expect(columns).not.toContain('body');
      expect(columns).not.toContain('headers');
    }, 60_000);
  });

  // ------------------------------------------------------------- 5 ----
  it('5. a correctly signed but malformed payload is refused and writes nothing', async () => {
    const env = await freshEnv('wh-malformed');
    await seedOrder(env, 'm1');

    for (const raw of ['not json at all', '{"event":', '{}', '{"event":"payment.captured"}']) {
      const result = await deliver(env, raw, sign(raw));
      expect(result.accepted, raw).toBe(false);
    }
    // Signed, so these are recorded as rejections — but no business row
    // and, critically, no webhook_events row claiming to be processed.
    expect(await counts(env)).toEqual(NOTHING_WRITTEN);
  }, 60_000);

  // ------------------------------------------------------------- 6 ----
  it('6. a duplicate valid event is recorded once and processed once', async () => {
    const env = await freshEnv('wh-dup');
    const { razorpayOrderId } = await seedOrder(env, 'd1');
    const raw = body(razorpayOrderId, 'pay_d1');
    const signature = sign(raw);
    const eventId = `evt_${randomUUID()}`;

    const first = await deliver(env, raw, signature, eventId);
    const second = await deliver(env, raw, signature, eventId);

    expect(first.outcome?.status).toBe('processed');
    expect(second.outcome?.status).toBe('duplicate');
    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 1,
      entitlements: 1,
      meta_events: 1,
    });
  }, 60_000);

  // ------------------------------------------------------------- 7 ----
  it('7. an unknown but valid event is recorded and acknowledged, not acted on', async () => {
    const env = await freshEnv('wh-unknown');
    const { razorpayOrderId } = await seedOrder(env, 'u1');
    const raw = body(razorpayOrderId, 'pay_u1', 'payment.failed');

    const result = await deliver(env, raw, sign(raw));

    expect(result.accepted).toBe(true);
    expect(result.outcome?.status).toBe('ignored');
    // Audit trail kept; no money or access moved.
    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 0,
      entitlements: 0,
      meta_events: 0,
    });
  }, 60_000);

  // ------------------------------------------------------------- 8 ----
  it('8. six concurrent deliveries of one event process it exactly once', async () => {
    const env = await freshEnv('wh-concurrent');
    const { razorpayOrderId } = await seedOrder(env, 'c1');
    const raw = body(razorpayOrderId, 'pay_c1');
    const signature = sign(raw);
    const eventId = `evt_${randomUUID()}`;

    const results = await Promise.all(
      Array.from({ length: 6 }, () => deliver(env, raw, signature, eventId)),
    );

    const statuses = results.map((r) => r.outcome?.status);
    // Exactly one winner; the rest are told by the unique index, not by a
    // racy SELECT-then-INSERT.
    expect(statuses.filter((s) => s === 'processed')).toHaveLength(1);
    expect(statuses.filter((s) => s === 'duplicate')).toHaveLength(5);

    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 1,
      entitlements: 1,
      meta_events: 1,
    });
  }, 60_000);

  it('8b. distinct events for the same order still enqueue only one Purchase', async () => {
    const env = await freshEnv('wh-two-events');
    const { razorpayOrderId } = await seedOrder(env, 'c2');
    const raw = body(razorpayOrderId, 'pay_c2');
    const signature = sign(raw);

    await deliver(env, raw, signature, `evt_${randomUUID()}`);
    // Razorpay re-sending the same capture under a NEW event id.
    const second = await deliver(env, raw, signature, `evt_${randomUUID()}`);

    expect(second.outcome?.status).toBe('processed');
    expect(await counts(env)).toMatchObject({
      webhook_events: 2,
      payments: 1, // razorpay_payment_id is unique
      entitlements: 1, // (customer_email, product_slug) is unique
      meta_events: 1, // meta_event_id is unique — no double conversion
    });
  }, 60_000);

  // ------------------------------------------- payload is never priced ----
  it('ignores the amount in the payload and uses the order, even when signed', async () => {
    const env = await freshEnv('wh-amount');
    const { razorpayOrderId } = await seedOrder(env, 'a1');

    // A correctly signed webhook — Razorpay's secret is not in question —
    // that claims the customer paid 1 paise for a 9,900 paise product.
    // Either the secret leaked or Razorpay is wrong; in both cases the
    // amount this system records must come from the order it created,
    // never from the message.
    const raw = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_a1',
            order_id: razorpayOrderId,
            amount: 1,
            currency: 'USD',
            status: 'captured',
          },
        },
      },
    });

    const result = await deliver(env, raw, sign(raw));

    expect(result.accepted).toBe(true);
    expect(result.outcome?.status).toBe('processed');

    const { rows } = await env.db.client.query<{ amount_paise: number; currency: string }>(
      'SELECT amount_paise, currency FROM payments',
    );
    expect(rows[0]).toEqual({ amount_paise: STARTER_PAISE, currency: 'INR' });

    // And the outbox carries the real value, so Meta is not told the
    // customer spent 1 paise.
    const { rows: events } = await env.db.client.query<{ value_paise: number }>(
      'SELECT value_paise FROM meta_events',
    );
    expect(events[0]!.value_paise).toBe(STARTER_PAISE);
  }, 60_000);

  // ---------------------------------------------------- transactionality ----
  it('rolls the whole transaction back when processing fails partway', async () => {
    const env = await freshEnv('wh-rollback');
    // No order seeded: the handler resolves the order AFTER inserting the
    // webhook event, so a failure here proves the event row is rolled
    // back too rather than left claiming the event was handled.
    const raw = body('order_rzp_does_not_exist', 'pay_r1');

    await expect(deliver(env, raw, sign(raw))).rejects.toThrow(/unknown razorpay order/);

    expect(await counts(env)).toEqual(NOTHING_WRITTEN);
  }, 60_000);
});
