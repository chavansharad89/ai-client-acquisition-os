import { createHmac, randomUUID } from 'node:crypto';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildPurchaseEventId } from '@acos/core-capi';

import { derivePurchaseEventId } from '../../apps/web/src/analytics/eventId';
import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// Browser Pixel / server CAPI deduplication, and what the browser cannot do.
// -----------------------------------------------------------------------
// THE FROZEN STRATEGY, as it already exists in the codebase:
//
//   event_id = `purchase_${sha256(trim(razorpay_payment_id))}`
//
// derived independently on both sides — `derivePurchaseEventId` in the
// browser, `buildPurchaseEventId` in @acos/core-capi — so neither side
// has to transmit an id to the other and a retry on either side produces
// the same string. Meta collapses the pair.
//
// That strategy is NOT changed here. What these tests establish is the
// security boundary around it: a browser that lies about a payment id can
// affect the Pixel half and nothing else, because every server-side
// artefact of a purchase is produced by the HMAC-verified webhook.
// -----------------------------------------------------------------------

const SECRET = 'whsec_pixel_dedup_suite';
const PAISE = 9_900;

let reachable = false;
let current: { db: TempDatabase; close: () => Promise<void> } | null = null;

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterEach(async () => {
  if (current) {
    await current.close().catch(() => undefined);
    await current.db.drop().catch(() => undefined);
    current = null;
  }
  vi.resetModules();
});

type RoutePost = (request: Request) => Promise<Response>;

async function freshRoute(label: string): Promise<{ db: TempDatabase; post: RoutePost }> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {
  });

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = db.url;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_pixel';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_pixel';
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_pixel';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-pixel-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'p'.repeat(48);

  vi.resetModules();
  const mod = (await import('../../apps/web/app/api/webhooks/razorpay/route')) as {
    POST: RoutePost;
  };
  const store = (await import('../../apps/web/src/server/webhookStore')) as {
    closeWebhookPool: () => Promise<void>;
  };
  current = { db, close: store.closeWebhookPool };
  return { db, post: mod.POST };
}

async function seedOrder(db: TempDatabase, suffix: string): Promise<string> {
  const razorpayOrderId = `order_rzp_${suffix}`;
  await db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, 'pixel@example.test', 'ai_income_99', 'AI Income Starter Kit',
             $3, 'INR', 'PENDING', now())`,
    [`order_${suffix}`, razorpayOrderId, PAISE],
  );
  return razorpayOrderId;
}

function capturedBody(razorpayOrderId: string, paymentId: string): string {
  return JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          amount: PAISE,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });
}

const sign = (raw: string) => createHmac('sha256', SECRET).update(raw).digest('hex');

function webhookRequest(raw: string, signature: string | null): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature !== null) headers.set('x-razorpay-signature', signature);
  headers.set('x-razorpay-event-id', `evt_${randomUUID()}`);
  return new Request('https://acos.test/api/webhooks/razorpay', {
    method: 'POST',
    headers,
    body: raw,
  });
}

async function counts(db: TempDatabase): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const table of ['payments', 'entitlements', 'meta_events', 'access_tokens']) {
    const { rows } = await db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM ${table}`,
    );
    out[table] = Number(rows[0]!.n);
  }
  return out;
}

const NOTHING = { payments: 0, entitlements: 0, meta_events: 0, access_tokens: 0 };

describe('the frozen event_id strategy', () => {
  it('browser and server derive the identical id from the same payment id', async () => {
    for (const paymentId of ['pay_ABC123', 'pay_zzz', 'pay_0', 'pay_with-dashes_9']) {
      // Independently derived — neither side transmits it to the other.
      expect(await derivePurchaseEventId(paymentId)).toBe(buildPurchaseEventId({ paymentId }));
    }
  });

  it('is deterministic, so a retry on either side reuses the same id', async () => {
    const a = await derivePurchaseEventId('pay_stable');
    const b = await derivePurchaseEventId('pay_stable');
    expect(a).toBe(b);
    expect(a).toBe(buildPurchaseEventId({ paymentId: 'pay_stable' }));
  });

  it('normalises surrounding whitespace identically on both sides', async () => {
    expect(await derivePurchaseEventId('  pay_trim  ')).toBe(
      buildPurchaseEventId({ paymentId: 'pay_trim' }),
    );
  });

  it('is a pure function of the payment id — nothing secret is mixed in', async () => {
    // An unkeyed digest is deliberate: the browser must be able to compute
    // it, so it cannot involve a secret. Confidentiality is not what this
    // id provides; determinism across two independent parties is.
    const id = buildPurchaseEventId({ paymentId: 'pay_pure' });
    expect(id).toMatch(/^purchase_[0-9a-f]{64}$/);
    expect(id).not.toContain(SECRET);
    expect(id).not.toContain(process.env.META_CAPI_ACCESS_TOKEN ?? 'meta_token_pixel');
  });
});

describe('a forged client callback', () => {
  it('cannot create a server Purchase', async () => {
    const { db, post } = await freshRoute('pix-forge-event');
    const razorpayOrderId = await seedOrder(db, 'f1');

    // Exactly what a tampered browser has: a payment id it invented, and
    // the ability to POST. It does not have the webhook secret.
    const forgedPaymentId = 'pay_forged_by_browser';
    const raw = capturedBody(razorpayOrderId, forgedPaymentId);

    const response = await post(webhookRequest(raw, 'a'.repeat(64)));

    expect(response.status).toBe(401);
    expect(await counts(db)).toEqual(NOTHING);

    // Specifically: no outbox row exists under the id the browser would
    // have used for its Pixel event, so nothing will ever be sent to
    // Meta's CAPI to match it.
    const forgedEventId = buildPurchaseEventId({ paymentId: forgedPaymentId });
    const { rows } = await db.client.query(
      'SELECT id FROM meta_events WHERE meta_event_id = $1',
      [forgedEventId],
    );
    expect(rows).toHaveLength(0);
  }, 60_000);

  it('cannot grant entitlement', async () => {
    const { db, post } = await freshRoute('pix-forge-ent');
    const razorpayOrderId = await seedOrder(db, 'f2');
    const raw = capturedBody(razorpayOrderId, 'pay_forged_entitlement');

    // Every shape of unsigned or wrongly-signed request.
    for (const signature of [
      null,
      '',
      'b'.repeat(64),
      sign('a different body entirely'),
      createHmac('sha256', 'guessed-secret').update(raw).digest('hex'),
    ]) {
      expect((await post(webhookRequest(raw, signature))).status).toBe(401);
    }

    expect(await counts(db)).toEqual(NOTHING);
    const { rows } = await db.client.query(
      `SELECT id FROM entitlements WHERE customer_email = 'pixel@example.test'`,
    );
    expect(rows).toHaveLength(0);
  }, 60_000);

  it('cannot mint an access token', async () => {
    const { db, post } = await freshRoute('pix-forge-token');
    const razorpayOrderId = await seedOrder(db, 'f3');
    const raw = capturedBody(razorpayOrderId, 'pay_forged_token');

    await post(webhookRequest(raw, 'c'.repeat(64)));

    expect((await counts(db)).access_tokens).toBe(0);
  }, 60_000);

  it('cannot reach a server write path at all — the webhook is the only one', async () => {
    // Enumerated rather than asserted in prose: if a future route starts
    // writing these tables, this list is where it has to be justified.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const apiDir = resolve(__dirname, '../../apps/web/app/api');

    const writers: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = resolve(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name === 'route.ts') {
          const src = readFileSync(full, 'utf8');
          if (/webhookTransaction|enqueueMetaPurchase|grantEntitlement/.test(src)) {
            writers.push(full.replace(`${apiDir}/`, ''));
          }
        }
      }
    };
    walk(apiDir);

    expect(writers).toEqual(['webhooks/razorpay/route.ts']);
  });
});

describe('a legitimate payment', () => {
  it('produces the server event under the id the browser also computes', async () => {
    const { db, post } = await freshRoute('pix-legit');
    const razorpayOrderId = await seedOrder(db, 'ok1');
    const paymentId = 'pay_legitimate_capture';
    const raw = capturedBody(razorpayOrderId, paymentId);

    const response = await post(webhookRequest(raw, sign(raw)));
    expect(response.status).toBe(200);

    const { rows } = await db.client.query<{
      meta_event_id: string;
      event_name: string;
      value_paise: number;
      status: string;
    }>('SELECT meta_event_id, event_name, value_paise, status FROM meta_events');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      event_name: 'Purchase',
      value_paise: PAISE,
      status: 'PENDING',
    });

    // THE DEDUPLICATION ASSERTION: the id the server persisted is byte
    // for byte the id the browser's Pixel call would have carried.
    expect(rows[0]!.meta_event_id).toBe(await derivePurchaseEventId(paymentId));
    expect(rows[0]!.meta_event_id).toBe(buildPurchaseEventId({ paymentId }));
  }, 60_000);

  it('records the payment and entitlement alongside it', async () => {
    const { db, post } = await freshRoute('pix-legit-full');
    const razorpayOrderId = await seedOrder(db, 'ok2');
    const raw = capturedBody(razorpayOrderId, 'pay_legit_full');

    await post(webhookRequest(raw, sign(raw)));

    expect(await counts(db)).toMatchObject({ payments: 1, entitlements: 1, meta_events: 1 });
  }, 60_000);

  it('a replayed capture reuses the id rather than minting a second event', async () => {
    const { db, post } = await freshRoute('pix-replay');
    const razorpayOrderId = await seedOrder(db, 'ok3');
    const paymentId = 'pay_replayed';
    const raw = capturedBody(razorpayOrderId, paymentId);

    // Two distinct webhook deliveries of the same capture.
    await post(webhookRequest(raw, sign(raw)));
    await post(webhookRequest(raw, sign(raw)));

    const { rows } = await db.client.query<{ meta_event_id: string }>(
      'SELECT meta_event_id FROM meta_events',
    );
    // One outbox row, one id — so Meta sees one Purchase, not two.
    expect(rows).toHaveLength(1);
    expect(rows[0]!.meta_event_id).toBe(buildPurchaseEventId({ paymentId }));
  }, 60_000);
});
