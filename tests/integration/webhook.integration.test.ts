import { createHmac, randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { seedOrder } from '../fixtures/idempotency-duplicates';
import { suiteDatabase } from './support/suiteDb';

// WEBHOOK — real PostgreSQL.
// -----------------------------------------------------------------------
// SCOPE NOTE: `handleRazorpayWebhook` is not implemented (it throws by
// design). Signature verification and the transactional handler are
// therefore specified as `it.todo`.
//
// What IS tested for real here: the HMAC primitive those todos will rely
// on, and every database-level guarantee that makes webhook replay safe —
// the razorpay_event_id unique index, its behaviour under genuine
// concurrency, and the fact that distinct event ids for one payment are
// deliberately NOT deduped at the event level.
// -----------------------------------------------------------------------

const suite = suiteDatabase('webhook');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const SECRET = 'whsec_test_only_never_real';
const sign = (body: string, secret = SECRET) =>
  createHmac('sha256', secret).update(body).digest('hex');

async function insertEvent(
  client: import('pg').Client,
  context: import('../fixtures/test-run-context').TestRunContext,
  opts: { suffix: string; eventId: string; orderId?: string | null; signatureValid?: boolean },
): Promise<string> {
  const id = context.id('webhook', opts.suffix);
  await client.query(
    `INSERT INTO webhook_events (id, razorpay_event_id, event_name, order_id, payload,
                                 signature_valid, updated_at)
     VALUES ($1, $2, 'payment.captured', $3, $4::jsonb, $5, now())`,
    [
      id,
      opts.eventId,
      opts.orderId ?? null,
      JSON.stringify({ test: true }),
      opts.signatureValid ?? true,
    ],
  );
  return context.trackWebhookEvent(id);
}

describe('WEBHOOK — invalid signature', () => {
  it('an HMAC over a tampered body does not match the original', () => {
    const body = JSON.stringify({ event: 'payment.captured', amount: 49900 });
    const tampered = JSON.stringify({ event: 'payment.captured', amount: 1 });
    expect(sign(tampered)).not.toBe(sign(body));
  });

  it('a signature made with the wrong secret does not verify', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    expect(sign(body, 'wrong_secret')).not.toBe(sign(body));
  });

  it('an event that failed verification never reaches webhook_events', async () => {
    // REWRITTEN for migration 0007. This used to store the unverified
    // event with signature_valid = false, which is exactly the design
    // 0007 removed: a nullable-signature column invites insert-then-verify,
    // and that hands any host on the internet an unauthenticated JSONB
    // write primitive. The table now holds VERIFIED events only.
    const { db, context } = suite.require();

    await expect(
      insertEvent(db.client, context, {
        suffix: 'badsig',
        eventId: `evt_${randomUUID()}`,
        signatureValid: false,
      }),
    ).rejects.toThrow(/webhook_events_signature_valid_only/);
  });

  it('a refused attempt is recorded as metadata, so it is not silently dropped', async () => {
    const { db } = suite.require();
    const id = `whr_${randomUUID()}`;

    // webhook_rejections has NO payload column — observability costs a row
    // of measurements, not a copy of whatever an attacker decided to POST.
    await db.client.query(
      `INSERT INTO webhook_rejections
         (id, received_at, reason, body_bytes, signature_present, signature_well_formed)
       VALUES ($1, now(), 'bad-signature', 412, true, true)`,
      [id],
    );

    const { rows } = await db.client.query(
      `SELECT reason, body_bytes, signature_present FROM webhook_rejections WHERE id = $1`,
      [id],
    );
    expect(rows[0]).toMatchObject({
      reason: 'bad-signature',
      body_bytes: 412,
      signature_present: true,
    });

    const { rows: cols } = await db.client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'webhook_rejections'`,
    );
    expect(cols.map((c: { column_name: string }) => c.column_name)).not.toContain('payload');
  });

  it.todo('handleRazorpayWebhook rejects an invalid signature before touching any table');
  it.todo('an invalid signature never creates a payment or entitlement row');
});

describe('WEBHOOK — duplicate event', () => {
  it('the same razorpay_event_id cannot be inserted twice', async () => {
    const { db, context } = suite.require();
    const eventId = `evt_${randomUUID()}`;
    await insertEvent(db.client, context, { suffix: 'dup1', eventId });

    await expect(insertEvent(db.client, context, { suffix: 'dup2', eventId })).rejects.toThrow(
      /webhook_events_razorpay_event_id_key/,
    );
  });

  it('the first insert survives the rejected duplicate', async () => {
    const { db, context } = suite.require();
    const eventId = `evt_${randomUUID()}`;
    const first = await insertEvent(db.client, context, { suffix: 'keep1', eventId });
    await insertEvent(db.client, context, { suffix: 'keep2', eventId }).catch(() => undefined);

    const { rows } = await db.client.query(
      `SELECT id FROM webhook_events WHERE razorpay_event_id = $1`,
      [eventId],
    );
    expect(rows.map((r) => r.id)).toEqual([first]);
  });

  it.todo('replaying a payload twice yields exactly one payment and one entitlement');
});

describe('WEBHOOK — concurrent duplicate event', () => {
  it('two simultaneous inserts of one event id produce exactly one row', async () => {
    const { db, context } = suite.require();
    const eventId = `evt_${randomUUID()}`;

    const results = await Promise.allSettled([
      insertEvent(db.client, context, { suffix: 'race1', eventId }),
      insertEvent(db.client, context, { suffix: 'race2', eventId }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM webhook_events WHERE razorpay_event_id = $1`,
      [eventId],
    );
    expect(rows[0].n).toBe(1);
  });

  it('holds under a burst of five concurrent attempts', async () => {
    const { db, context } = suite.require();
    const eventId = `evt_${randomUUID()}`;

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, i) =>
        insertEvent(db.client, context, { suffix: `burst${i}`, eventId }),
      ),
    );

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM webhook_events WHERE razorpay_event_id = $1`,
      [eventId],
    );
    expect(rows[0].n).toBe(1);
  });
});

describe('WEBHOOK — different webhook IDs for the same payment', () => {
  it('distinct event ids are all stored — event-level dedup must not collapse them', async () => {
    // Razorpay can send several distinct events about one payment
    // (captured, then a retry with a new event id). The event table must
    // record each; dedup at the PAYMENT level is a separate concern, and
    // conflating the two would silently drop real events.
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'multi');

    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      ids.push(
        await insertEvent(db.client, context, {
          suffix: `multi${i}`,
          eventId: `evt_${randomUUID()}`,
          orderId,
        }),
      );
    }

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM webhook_events WHERE order_id = $1`,
      [orderId],
    );
    expect(rows[0].n).toBe(3);
    expect(new Set(ids).size).toBe(3);
  });

  it('nothing at the database level prevents two events naming one payment', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'twoev');
    await insertEvent(db.client, context, {
      suffix: 'evA',
      eventId: `evt_${randomUUID()}`,
      orderId,
    });
    await insertEvent(db.client, context, {
      suffix: 'evB',
      eventId: `evt_${randomUUID()}`,
      orderId,
    });
    // Documents why payment-level idempotency is required on top of
    // event-level dedup — see architecture §4.2.
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM webhook_events WHERE order_id = $1`,
      [orderId],
    );
    expect(rows[0].n).toBe(2);
  });

  it.todo('two different event ids for one payment still produce exactly one payment row');
});
