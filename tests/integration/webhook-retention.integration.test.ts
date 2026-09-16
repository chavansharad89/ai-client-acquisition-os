import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createRedactionStore,
  redactExpiredPayloads,
  REDACTION_ALLOWLIST,
  redactWebhookPayload,
} from '@acos/core-payments';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// Webhook payload retention, against real PostgreSQL.
// -----------------------------------------------------------------------
// The policy is implemented twice on purpose — once in TypeScript for the
// application, once in SQL so a database with no application attached
// (pg_cron, a psql job, a DBA mid-incident) can still apply it. Two
// implementations of one rule drift silently, so the first thing these
// tests do is pin them to each other on a payload carrying every field
// Razorpay actually sends.
//
// The rest checks the things a retention policy is judged on: that it
// removes the identifiers, that it keeps the audit trail, that it is
// idempotent, that the boundary is where it is documented to be, and
// that the body has no route to a public reader.
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
  const db = await createTempDatabase(label);
  open.push(db);
  return db;
}

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-15T00:00:00.000Z');

/** A `payment.captured` body with every identifier Razorpay really sends. */
function realPayload(paymentId: string, orderId: string) {
  return {
    entity: 'event',
    account_id: 'acc_JKm3nQ2pLd9xYz',
    event: 'payment.captured',
    contains: ['payment'],
    created_at: 1_772_000_000,
    payload: {
      payment: {
        entity: {
          id: paymentId,
          entity: 'payment',
          amount: 149_900,
          currency: 'INR',
          status: 'captured',
          order_id: orderId,
          invoice_id: null,
          international: false,
          method: 'upi',
          amount_refunded: 0,
          refund_status: null,
          captured: true,
          description: 'AI Income Blueprint - Sharad C, Andheri West',
          card_id: 'card_abc',
          card: { last4: '4321', network: 'Visa', issuer: 'HDFC', type: 'debit' },
          bank: 'HDFC',
          wallet: null,
          vpa: 'sharad.chavan@okhdfcbank',
          email: 'buyer@example.test',
          contact: '+919876543210',
          customer_id: 'cust_abc',
          token_id: 'token_abc',
          notes: { customer_name: 'Sharad Chavan', address: '14 Link Road, Mumbai' },
          fee: 3538,
          tax: 540,
          error_code: null,
          error_description: null,
          error_source: null,
          error_step: null,
          error_reason: null,
          acquirer_data: { rrn: '432109876543', upi_transaction_id: 'A1B2C3D4' },
          created_at: 1_772_000_000,
        },
      },
    },
  };
}

const IDENTIFIERS = [
  'buyer@example.test',
  '+919876543210',
  'sharad.chavan@okhdfcbank',
  '4321',
  'HDFC',
  'Sharad Chavan',
  '14 Link Road, Mumbai',
  '432109876543',
  'cust_abc',
  'token_abc',
];

let seq = 0;

/** Inserts a verified webhook event received `ageDays` ago. */
async function seedEvent(
  db: TempDatabase,
  ageDays: number,
  overrides: { processedAt?: Date | null; processingError?: string | null } = {},
): Promise<{ id: string; eventId: string }> {
  seq += 1;
  const id = `we_ret_${seq}`;
  const eventId = `evt_ret_${seq}`;
  const receivedAt = new Date(NOW.getTime() - ageDays * DAY);
  await db.client.query(
    `INSERT INTO webhook_events
       (id, provider, razorpay_event_id, event_name, order_id, payload,
        signature_valid, received_at, processed_at, processing_error,
        created_at, updated_at)
     VALUES ($1, 'razorpay', $2, 'payment.captured', NULL, $3,
             true, $4, $5, $6, $4, $4)`,
    [
      id,
      eventId,
      JSON.stringify(realPayload(`pay_${seq}`, `order_${seq}`)),
      receivedAt,
      overrides.processedAt === undefined ? receivedAt : overrides.processedAt,
      overrides.processingError ?? null,
    ],
  );
  return { id, eventId };
}

async function readRow(db: TempDatabase, id: string) {
  const { rows } = await db.client.query(`SELECT * FROM webhook_events WHERE id = $1`, [id]);
  return rows[0] as Record<string, any>;
}

// ============================================================= parity ====

describe('the SQL and TypeScript redactors are one policy', () => {
  it('produce byte-identical output on a full Razorpay payload', async () => {
    const db = await freshDb('ret-parity');
    const payload = realPayload('pay_parity', 'order_parity');

    const { rows } = await db.client.query<{ out: unknown }>(
      `SELECT redact_webhook_payload($1::jsonb) AS out`,
      [JSON.stringify(payload)],
    );

    expect(rows[0]!.out).toEqual(redactWebhookPayload(payload));
  }, 60_000);

  it('agree on the awkward inputs too', async () => {
    const db = await freshDb('ret-parity-edge');
    const cases: unknown[] = [
      {},
      { event: 'payout.processed' },
      { payload: { payment: { entity: { id: 'p', invoice_id: null } } } },
      // Already redacted.
      redactWebhookPayload(realPayload('pay_a', 'order_a')),
      // Unknown future fields.
      { event: 'x', payload: { payment: { entity: { upi: { vpa: 'a@b' }, id: 'p' } } } },
      // Not an object at all.
      'a string',
      42,
      [1, 2, 3],
      null,
    ];

    for (const input of cases) {
      const { rows } = await db.client.query<{ out: unknown }>(
        `SELECT redact_webhook_payload($1::jsonb) AS out`,
        [JSON.stringify(input)],
      );
      expect(rows[0]!.out, JSON.stringify(input)).toEqual(redactWebhookPayload(input));
    }
  }, 60_000);

  it('the migration names every path the TypeScript allowlist names', async () => {
    const sql = readFileSync(
      resolve(
        __dirname,
        '../../packages/db/prisma/migrations/0011_webhook_payload_retention/migration.sql',
      ),
      'utf8',
    );
    for (const path of REDACTION_ALLOWLIST) {
      expect(sql, `${path} missing from migration 0011`).toContain(`'${path}'`);
    }
  });
});

// ========================================================== redaction ====

describe('what a redaction run does to a row', () => {
  it('removes every identifier from an expired payload', async () => {
    const db = await freshDb('ret-removes');
    const { id } = await seedEvent(db, 200);

    const before = JSON.stringify((await readRow(db, id)).payload);
    for (const needle of IDENTIFIERS) expect(before).toContain(needle);

    const result = await redactExpiredPayloads(createRedactionStore(db.client), NOW);
    expect(result.redacted).toBe(1);

    const after = JSON.stringify((await readRow(db, id)).payload);
    for (const needle of IDENTIFIERS) expect(after, needle).not.toContain(needle);
  }, 60_000);

  it('preserves identity, type, status and linkage — nothing is deleted', async () => {
    const db = await freshDb('ret-preserves');
    const { id, eventId } = await seedEvent(db, 200, {
      processingError: 'transient downstream failure',
    });
    const before = await readRow(db, id);

    await redactExpiredPayloads(createRedactionStore(db.client), NOW);
    const after = await readRow(db, id);

    // Event identity.
    expect(after.razorpay_event_id).toBe(eventId);
    // Event type.
    expect(after.event_name).toBe('payment.captured');
    // Processing status.
    expect(after.processed_at).toEqual(before.processed_at);
    expect(after.processing_error).toBe('transient downstream failure');
    // Audit metadata.
    expect(after.signature_valid).toBe(true);
    expect(after.received_at).toEqual(before.received_at);
    expect(after.created_at).toEqual(before.created_at);
    expect(after.order_id).toBe(before.order_id);

    // The row is still there. The count of webhook_events never falls.
    const { rows } = await db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM webhook_events`,
    );
    expect(rows[0]!.n).toBe('1');
  }, 60_000);

  it('keeps the financial skeleton, so a dispute can still be traced', async () => {
    const db = await freshDb('ret-skeleton');
    const { id } = await seedEvent(db, 200);

    await redactExpiredPayloads(createRedactionStore(db.client), NOW);
    const entity = (await readRow(db, id)).payload.payload.payment.entity;

    expect(entity.id).toBe('pay_' + seq);
    expect(entity.order_id).toBe('order_' + seq);
    expect(entity.amount).toBe(149_900);
    expect(entity.currency).toBe('INR');
    expect(entity.status).toBe('captured');
    expect(entity.method).toBe('upi');
    expect(entity.fee).toBe(3538);
  }, 60_000);

  it('marks the row as redacted, so narrowing is visible rather than silent', async () => {
    const db = await freshDb('ret-marks');
    const { id } = await seedEvent(db, 200);
    expect((await readRow(db, id)).payload_redacted_at).toBeNull();

    await redactExpiredPayloads(createRedactionStore(db.client), NOW);

    const after = await readRow(db, id);
    expect(after.payload_redacted_at).toEqual(NOW);
    // A reader can tell "narrowed" from "arrived sparse".
    expect(after.updated_at).toEqual(NOW);
  }, 60_000);
});

// =========================================================== boundary ====

describe('the retention boundary is where it is documented', () => {
  it('leaves a payload inside the window completely alone', async () => {
    const db = await freshDb('ret-inside');
    const { id } = await seedEvent(db, 10);

    const before = await readRow(db, id);
    const result = await redactExpiredPayloads(createRedactionStore(db.client), NOW);

    expect(result.redacted).toBe(0);
    const after = await readRow(db, id);
    expect(after.payload).toEqual(before.payload);
    expect(after.payload_redacted_at).toBeNull();
    expect(JSON.stringify(after.payload)).toContain('buyer@example.test');
  }, 60_000);

  it('redacts at the boundary and not one day before it', async () => {
    const db = await freshDb('ret-boundary');
    const older = await seedEvent(db, 181);
    const exactly = await seedEvent(db, 180);
    const younger = await seedEvent(db, 179);

    const result = await redactExpiredPayloads(createRedactionStore(db.client), NOW);
    expect(result.redacted).toBe(2);

    expect((await readRow(db, older.id)).payload_redacted_at).not.toBeNull();
    expect((await readRow(db, exactly.id)).payload_redacted_at).not.toBeNull();
    expect((await readRow(db, younger.id)).payload_redacted_at).toBeNull();
  }, 60_000);

  it('honours a shorter configured retention', async () => {
    const db = await freshDb('ret-configured');
    const { id } = await seedEvent(db, 45);

    expect((await redactExpiredPayloads(createRedactionStore(db.client), NOW)).redacted).toBe(0);
    const result = await redactExpiredPayloads(createRedactionStore(db.client), NOW, {
      retentionDays: 30,
    });
    expect(result.redacted).toBe(1);
    expect((await readRow(db, id)).payload_redacted_at).not.toBeNull();
  }, 60_000);
});

// ======================================================== re-running =====

describe('the run is safe to repeat', () => {
  it('a second run redacts nothing and changes nothing', async () => {
    const db = await freshDb('ret-idempotent');
    const { id } = await seedEvent(db, 200);
    const store = createRedactionStore(db.client);

    expect((await redactExpiredPayloads(store, NOW)).redacted).toBe(1);
    const afterFirst = await readRow(db, id);

    const later = new Date(NOW.getTime() + 7 * DAY);
    expect((await redactExpiredPayloads(store, later)).redacted).toBe(0);

    const afterSecond = await readRow(db, id);
    expect(afterSecond.payload).toEqual(afterFirst.payload);
    // The mark records the FIRST redaction, not the latest run.
    expect(afterSecond.payload_redacted_at).toEqual(NOW);
    expect(afterSecond.updated_at).toEqual(afterFirst.updated_at);
  }, 60_000);

  it('drains a backlog larger than one batch', async () => {
    const db = await freshDb('ret-backlog');
    for (let i = 0; i < 12; i += 1) await seedEvent(db, 200);

    const result = await redactExpiredPayloads(createRedactionStore(db.client), NOW, {
      batchSize: 5,
    });

    expect(result.redacted).toBe(12);
    expect(result.batches).toBe(3); // 5, 5, 2 — the short batch ends it
    expect(result.incomplete).toBe(false);

    const { rows } = await db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM webhook_events WHERE payload_redacted_at IS NULL`,
    );
    expect(rows[0]!.n).toBe('0');
  }, 60_000);

  it('stops at the ceiling with the rest still due, and reports it', async () => {
    const db = await freshDb('ret-ceiling');
    for (let i = 0; i < 10; i += 1) await seedEvent(db, 200);

    const result = await redactExpiredPayloads(createRedactionStore(db.client), NOW, {
      batchSize: 2,
      maxBatches: 3,
    });
    expect(result.redacted).toBe(6);
    expect(result.incomplete).toBe(true);

    const { rows } = await db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM webhook_events WHERE payload_redacted_at IS NULL`,
    );
    expect(rows[0]!.n).toBe('4');
  }, 60_000);
});

// ============================================================ exposure ===

describe('the raw payload has no route to a reader', () => {
  it('the audit view carries every column except the body', async () => {
    const db = await freshDb('ret-view');
    const { rows } = await db.client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'webhook_events_audit' ORDER BY column_name`,
    );
    const columns = rows.map((r) => r.column_name);

    expect(columns).not.toContain('payload');
    for (const kept of [
      'razorpay_event_id',
      'event_name',
      'order_id',
      'signature_valid',
      'received_at',
      'processed_at',
      'processing_error',
      'payload_redacted_at',
      'payload_is_redacted',
    ]) {
      expect(columns, kept).toContain(kept);
    }
  }, 60_000);

  it('the view reports redaction state without revealing the body', async () => {
    const db = await freshDb('ret-view-rows');
    const fresh = await seedEvent(db, 10);
    const old = await seedEvent(db, 200);
    await redactExpiredPayloads(createRedactionStore(db.client), NOW);

    const { rows } = await db.client.query<Record<string, any>>(
      `SELECT id, payload_is_redacted FROM webhook_events_audit ORDER BY id`,
    );
    const byId = new Map(rows.map((r) => [r.id, r.payload_is_redacted]));
    expect(byId.get(fresh.id)).toBe(false);
    expect(byId.get(old.id)).toBe(true);
    expect(JSON.stringify(rows)).not.toContain('buyer@example.test');
  }, 60_000);

  it('no HTTP route selects or returns the payload column', () => {
    const root = resolve(__dirname, '../..');
    // Every route handler in the app, searched for any mention of the
    // column. The webhook route writes it through the handler; none may
    // read it back or put it in a response. Run with a RELATIVE path so
    // the output is greppable regardless of where the repo lives.
    const hits = execSync('grep -rn "payload" apps/web/app --include=route.ts || true', {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((line) => line.trim().length > 0)
      // Comments, and the generic "Unprocessable payload" error string,
      // are not the column.
      .filter((line) => !/\.tsx?:\d+:\s*(\/\/|\*)/.test(line))
      .filter((line) => !line.includes("'Unprocessable payload'"));

    expect(hits).toEqual([]);
  });
});
