import { createHmac, randomUUID } from 'node:crypto';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// The ACTUAL route handler, end to end.
// -----------------------------------------------------------------------
// Every other webhook test in this repository calls verifyRazorpayWebhook
// and handleRazorpayWebhook directly. That proves the functions are
// correct; it does not prove the ROUTE calls them, calls them in the
// right order, or calls them at all. A route that read `request.json()`
// and skipped verification entirely would pass every one of those tests.
//
// So this file imports `apps/web/app/api/webhooks/razorpay/route.ts` and
// invokes its exported POST with a real Request, against a real database.
// It is the only test that would notice if the wiring were wrong.
//
// The route module is imported dynamically AFTER process.env is set,
// because it calls loadEnv() lazily and builds its pg Pool from
// DATABASE_URL on first use. vi.resetModules() between tests gives each
// its own module state, and therefore its own pool pointed at its own
// throwaway database.
// -----------------------------------------------------------------------

const SECRET = 'whsec_route_level_suite';
const STARTER_PAISE = 9_900;

let reachable = false;

/**
 * Exactly one live database and one live pool at a time.
 *
 * Each test builds its own route module instance, and each instance
 * opens its own pg Pool. Accumulating those for the whole file exhausted
 * PostgreSQL's connection limit as soon as this suite ran alongside the
 * others — `sorry, too many clients already`. Tearing down after every
 * test keeps the footprint flat regardless of how many tests are added.
 */
let current: { db: TempDatabase; close: () => Promise<void> } | null = null;

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterEach(async () => {
  if (current) {
    // Pool first, database second. The other order produces a storm of
    // "terminating connection due to administrator command".
    await current.close().catch(() => undefined);
    await current.db.drop().catch(() => undefined);
    current = null;
  }
  // Only the activation-email tests below set these; cleared here so a
  // later test in this file (which relies on EMAIL_PROVIDER being unset,
  // for the console-sender fallback) never inherits them.
  delete process.env.EMAIL_PROVIDER;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  vi.resetModules();
});

type RoutePost = (request: Request) => Promise<Response>;

interface Env {
  db: TempDatabase;
  post: RoutePost;
}

/**
 * A throwaway database plus the real route handler wired to it.
 *
 * Nothing here is a test double: `post` is the function Next.js itself
 * would invoke for POST /api/webhooks/razorpay.
 */
async function freshRoute(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {
  });

  // loadEnv() validates the whole schema, so every required variable has
  // to be present even though this route only reads two of them.
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = db.url;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_route';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_route';
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_route';
  // Required at boot since the config hardening, even though this route
  // reads neither. That is the point: loadEnv validates the whole
  // environment once, so a process cannot start half-configured and
  // discover the gap on some later request.
  process.env.ANTHROPIC_API_KEY = 'sk-ant-route-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'd'.repeat(48);
  process.env.GOOGLE_PLACES_API_KEY = 'places-key-route-not-real';

  vi.resetModules();
  const mod = (await import('../../apps/web/app/api/webhooks/razorpay/route')) as {
    POST: RoutePost;
  };
  const store = (await import('../../apps/web/src/server/webhookStore')) as {
    closeWebhookPool: () => Promise<void>;
  };
  const clientFinderDb = (await import('../../apps/web/src/server/db')) as {
    closeClientFinderPool: () => Promise<void>;
  };
  current = {
    db,
    close: async () => {
      // The subscription-activation path below reaches
      // clientFinderRepositories(), which opens its own pool (apps/web/
      // src/server/db.ts) separate from webhookStore's — both need
      // closing or this file's temp databases cannot be dropped.
      await store.closeWebhookPool();
      await clientFinderDb.closeClientFinderPool();
    },
  };
  return { db, post: mod.POST };
}

async function seedClientFinderUser(env: Env, suffix: string): Promise<{ id: string; email: string }> {
  const id = `user_${suffix}`;
  const email = `user_${suffix}@example.test`;
  await env.db.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [id, email]);
  return { id, email };
}

function subscriptionChargedBody(opts: { razorpaySubscriptionId: string; paymentId: string; userId: string }): string {
  return JSON.stringify({
    event: 'subscription.charged',
    payload: {
      subscription: {
        entity: { id: opts.razorpaySubscriptionId, status: 'active', notes: { userId: opts.userId } },
      },
      payment: {
        entity: {
          id: opts.paymentId,
          order_id: `order_auto_${opts.paymentId}`,
          amount: 149_900,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });
}

async function seedOrder(env: Env, suffix: string): Promise<string> {
  const razorpayOrderId = `order_rzp_${suffix}`;
  await env.db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, 'route@example.test', 'ai_income_99', 'AI Income Starter Kit',
             $3, 'INR', 'PENDING', now())`,
    [`order_${suffix}`, razorpayOrderId, STARTER_PAISE],
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
          amount: STARTER_PAISE,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });
}

const sign = (raw: string) => createHmac('sha256', SECRET).update(raw).digest('hex');

/** A real Request, exactly as Next.js would hand it to the handler. */
function webhookRequest(raw: string, signature: string | null, eventId?: string): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature !== null) headers.set('x-razorpay-signature', signature);
  headers.set('x-razorpay-event-id', eventId ?? `evt_${randomUUID()}`);
  headers.set('x-forwarded-for', '203.0.113.42');
  return new Request('https://acos.test/api/webhooks/razorpay', {
    method: 'POST',
    headers,
    body: raw,
  });
}

async function counts(env: Env): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const table of [
    'webhook_events',
    'payments',
    'entitlements',
    'meta_events',
    'access_tokens',
    'webhook_rejections',
  ]) {
    const { rows } = await env.db.client.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM ${table}`,
    );
    out[table] = Number(rows[0]!.n);
  }
  return out;
}

describe('POST /api/webhooks/razorpay — the real route handler', () => {
  it('runs against a real PostgreSQL server', async () => {
    const env = await freshRoute('route-probe');
    const { rows } = await env.db.client.query<{ v: string }>('SELECT version() AS v');
    expect(rows[0]!.v).toContain('PostgreSQL');
    expect(typeof env.post).toBe('function');
  }, 60_000);

  // --------------------------------------------------------- valid ----
  it('a validly signed request is processed: 200, payment, entitlement, outbox', async () => {
    const env = await freshRoute('route-valid');
    const razorpayOrderId = await seedOrder(env, 'v1');
    const raw = capturedBody(razorpayOrderId, 'pay_route_v1');

    const response = await env.post(webhookRequest(raw, sign(raw)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'processed' });

    // Business processing actually occurred — through the route, not
    // through a function this test called itself.
    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 1,
      entitlements: 1,
      meta_events: 1,
      webhook_rejections: 0,
    });

    const { rows } = await env.db.client.query<{ amount_paise: number; status: string }>(
      'SELECT amount_paise, status FROM payments',
    );
    expect(rows[0]).toMatchObject({ amount_paise: STARTER_PAISE, status: 'CAPTURED' });

    const { rows: ent } = await env.db.client.query<{ customer_email: string }>(
      'SELECT customer_email FROM entitlements',
    );
    expect(ent[0]!.customer_email).toBe('route@example.test');

    const { rows: outbox } = await env.db.client.query<{ status: string; value_paise: number }>(
      'SELECT status, value_paise FROM meta_events',
    );
    expect(outbox[0]).toMatchObject({ status: 'PENDING', value_paise: STARTER_PAISE });
  }, 60_000);

  // ------------------------------------------------------- invalid ----
  describe('an invalidly signed request', () => {
    const cases: [string, (raw: string) => string | null][] = [
      ['a wrong signature', () => 'a'.repeat(64)],
      ['no signature header at all', () => null],
      ['an empty signature', () => ''],
      ['a malformed signature', () => 'not-a-hex-signature'],
      ['a truncated signature', (raw) => sign(raw).slice(0, 63)],
      ['a signature for a different body', () => sign('{"event":"something.else"}')],
      ['a signature made with the wrong secret', (raw) =>
        createHmac('sha256', 'wrong-secret').update(raw).digest('hex')],
    ];

    it.each(cases)('is refused with 401 and writes nothing: %s', async (label, makeSignature) => {
      const env = await freshRoute(`route-bad-${label.replace(/\W+/g, '-').slice(0, 18)}`);
      const razorpayOrderId = await seedOrder(env, 'b1');
      const raw = capturedBody(razorpayOrderId, 'pay_route_b1');

      const response = await env.post(webhookRequest(raw, makeSignature(raw)));

      expect(response.status).toBe(401);
      const body = (await response.json()) as Record<string, unknown>;
      expect(body).toEqual({ error: 'Invalid signature' });

      const after = await counts(env);
      // The three required assertions, plus the webhook_events row a
      // naive insert-then-verify handler would have written.
      expect(after.payments).toBe(0);
      expect(after.entitlements).toBe(0);
      expect(after.meta_events).toBe(0);
      expect(after.webhook_events).toBe(0);
      expect(after.access_tokens).toBe(0);

      // Refusals are observable — but as metadata only.
      expect(after.webhook_rejections).toBe(1);
    }, 60_000);

    it('leaks nothing about why it was refused', async () => {
      const env = await freshRoute('route-opaque');
      const raw = capturedBody(await seedOrder(env, 'b2'), 'pay_route_b2');

      const response = await env.post(webhookRequest(raw, 'b'.repeat(64)));
      const text = await response.text();

      // No policy names, no secret, no hint about which check fired, no
      // stack trace, no SQL.
      expect(text).not.toMatch(/secret/i);
      expect(text).not.toMatch(/hmac|sha256|digest/i);
      expect(text).not.toContain(SECRET);
      expect(text).not.toMatch(/at \w+ \(/); // stack frame
      expect(text.length).toBeLessThan(200);
    }, 60_000);

    it('records only safe metadata for the refusal', async () => {
      const env = await freshRoute('route-meta');
      const canary = 'route-canary-4f7a2c';
      const raw = capturedBody(await seedOrder(env, 'b3'), canary);

      await env.post(webhookRequest(raw, 'c'.repeat(64)));

      const { rows } = await env.db.client.query<Record<string, unknown>>(
        'SELECT * FROM webhook_rejections',
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]!.reason).toBe('bad-signature');
      expect(rows[0]!.source_ip).toBe('203.0.113.42'); // from the real header
      // Nothing the caller chose in the body survives.
      expect(JSON.stringify(rows[0])).not.toContain(canary);
      expect(JSON.stringify(rows[0])).not.toContain('payment.captured');
    }, 60_000);
  });

  // ------------------------------------------------ ordering proof ----
  it('verifies the RAW bytes, not a re-serialisation of the parsed body', async () => {
    const env = await freshRoute('route-rawbytes');
    const razorpayOrderId = await seedOrder(env, 'r1');

    // A body shaped the way a real provider sends one: indented, with
    // its own key order. JSON.stringify(JSON.parse(x)) does NOT return
    // these bytes, so a route that parses first and hashes the
    // re-serialised object computes a different HMAC and refuses a
    // legitimate webhook.
    const raw = [
      '{',
      '  "event" : "payment.captured",',
      '  "payload": {',
      '    "payment": {',
      '      "entity": {',
      `        "order_id": "${razorpayOrderId}",`,
      '        "id": "pay_route_r1",',
      `        "amount": ${STARTER_PAISE},`,
      '        "status": "captured",',
      '        "currency": "INR"',
      '      }',
      '    }',
      '  }',
      '}',
    ].join('\n');
    expect(JSON.stringify(JSON.parse(raw))).not.toBe(raw); // the bytes really differ

    const response = await env.post(webhookRequest(raw, sign(raw)));

    expect(response.status).toBe(200);
    expect(await counts(env)).toMatchObject({ payments: 1, entitlements: 1, meta_events: 1 });
  }, 60_000);

  it('dedupes on the signed header event id, not on anything in the body', async () => {
    const env = await freshRoute('route-headerid');
    const razorpayOrderId = await seedOrder(env, 'h1');
    const eventId = `evt_${randomUUID()}`;

    // Two deliveries of one event under one header id, but each body
    // carries a DIFFERENT top-level `id`. The body is attacker-shaped
    // data even after verification — only the header id is the provider's
    // event identity — so these must dedupe to one.
    const bodyWith = (bodyId: string) =>
      JSON.stringify({
        id: bodyId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_route_h1',
              order_id: razorpayOrderId,
              amount: STARTER_PAISE,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });

    const a = bodyWith('body_id_one');
    const b = bodyWith('body_id_two');
    const first = await env.post(webhookRequest(a, sign(a), eventId));
    const second = await env.post(webhookRequest(b, sign(b), eventId));

    expect(await first.json()).toEqual({ status: 'processed' });
    expect(await second.json()).toEqual({ status: 'duplicate' });
    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 1,
      entitlements: 1,
      meta_events: 1,
    });
  }, 60_000);

  it('a body tampered with AFTER signing is refused — the route hashes raw bytes', async () => {
    const env = await freshRoute('route-tamper');
    const razorpayOrderId = await seedOrder(env, 't1');
    const raw = capturedBody(razorpayOrderId, 'pay_route_t1');
    const signature = sign(raw);

    // An attacker intercepting a legitimate webhook and inflating the
    // amount. If the route parsed before verifying — or re-serialised the
    // parsed object to hash it — this would be accepted.
    const tampered = raw.replace(`"amount":${STARTER_PAISE}`, '"amount":1');
    expect(tampered).not.toBe(raw);

    const response = await env.post(webhookRequest(tampered, signature));

    expect(response.status).toBe(401);
    expect(await counts(env)).toMatchObject({
      webhook_events: 0,
      payments: 0,
      entitlements: 0,
      meta_events: 0,
    });
  }, 60_000);

  it('a duplicate of a valid request is acknowledged without processing twice', async () => {
    const env = await freshRoute('route-dup');
    const razorpayOrderId = await seedOrder(env, 'd1');
    const raw = capturedBody(razorpayOrderId, 'pay_route_d1');
    const signature = sign(raw);
    const eventId = `evt_${randomUUID()}`;

    const first = await env.post(webhookRequest(raw, signature, eventId));
    const second = await env.post(webhookRequest(raw, signature, eventId));

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ status: 'processed' });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ status: 'duplicate' });

    expect(await counts(env)).toMatchObject({
      webhook_events: 1,
      payments: 1,
      entitlements: 1,
      meta_events: 1,
    });
  }, 60_000);

  it('a signed request with no event id is refused before processing', async () => {
    const env = await freshRoute('route-noeventid');
    const razorpayOrderId = await seedOrder(env, 'n1');
    const raw = capturedBody(razorpayOrderId, 'pay_route_n1');

    const headers = new Headers({
      'content-type': 'application/json',
      'x-razorpay-signature': sign(raw),
    });
    const response = await env.post(
      new Request('https://acos.test/api/webhooks/razorpay', {
        method: 'POST',
        headers,
        body: raw,
      }),
    );

    expect(response.status).toBe(400);
    expect(await counts(env)).toMatchObject({
      webhook_events: 0,
      payments: 0,
      entitlements: 0,
      meta_events: 0,
    });
  }, 60_000);

  // ---------------------------- AUTH Phase 2 activation email dispatch ----
  describe('subscription.charged — AUTH Phase 2 activation email dispatch', () => {
    it('grants the subscription period and dispatches the activation email (console sender, no EMAIL_PROVIDER configured)', async () => {
      const env = await freshRoute('route-activation-console');
      const user = await seedClientFinderUser(env, 'ac1');
      const raw = subscriptionChargedBody({
        razorpaySubscriptionId: 'sub_ac1',
        paymentId: 'pay_ac1',
        userId: user.id,
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        const response = await env.post(webhookRequest(raw, sign(raw)));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: 'processed' });

        const { rows } = await env.db.client.query<{ user_id: string; duration_days: number }>(
          'SELECT user_id, duration_days FROM subscription_periods WHERE razorpay_payment_id = $1',
          ['pay_ac1'],
        );
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ user_id: user.id, duration_days: 30 });

        const { rows: tokens } = await env.db.client.query<{ user_id: string }>(
          'SELECT user_id FROM activation_tokens WHERE user_id = $1',
          [user.id],
        );
        expect(tokens).toHaveLength(1);

        // ConsoleActivationEmailSender (no EMAIL_PROVIDER set, non-production)
        // logged the delivery rather than silently doing nothing.
        const delivery = logSpy.mock.calls
          .map((call) => call[0])
          .find((line) => typeof line === 'string' && line.includes('activation_email.console_delivery'));
        expect(delivery).toBeDefined();
        const parsed = JSON.parse(delivery as string) as { to: string; activationUrl: string };
        expect(parsed.to).toBe(user.email);
        expect(parsed.activationUrl).toContain('/activate/');
      } finally {
        logSpy.mockRestore();
      }
    }, 60_000);

    it('a provider delivery failure is non-fatal: the webhook still processes and the failure is logged with product/recipient/provider/error, never a secret or the activation token/URL', async () => {
      process.env.EMAIL_PROVIDER = 'resend';
      process.env.RESEND_API_KEY = 'resend_test_key_not_real';
      process.env.RESEND_FROM_EMAIL = 'sender@example.test';

      const env = await freshRoute('route-activation-failure');
      const user = await seedClientFinderUser(env, 'ac2');
      const raw = subscriptionChargedBody({
        razorpaySubscriptionId: 'sub_ac2',
        paymentId: 'pay_ac2',
        userId: user.id,
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn(
        async () => new Response(JSON.stringify({ message: 'invalid from address' }), { status: 422 }),
      ) as unknown as typeof fetch;
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const response = await env.post(webhookRequest(raw, sign(raw)));

        // Non-fatal: the already-committed grant is unaffected by a mail
        // provider outage, same contract as the existing DEC-014 claim-link
        // block this mirrors.
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: 'processed' });

        const { rows } = await env.db.client.query<{ user_id: string }>(
          'SELECT user_id FROM subscription_periods WHERE razorpay_payment_id = $1',
          ['pay_ac2'],
        );
        expect(rows).toHaveLength(1);

        // The token WAS minted (issueActivationLink persists before it
        // sends), but the delivery failure is what must be observable.
        const { rows: tokens } = await env.db.client.query<{ user_id: string }>(
          'SELECT user_id FROM activation_tokens WHERE user_id = $1',
          [user.id],
        );
        expect(tokens).toHaveLength(1);

        const failureLine = errorSpy.mock.calls
          .map((call) => call[0])
          .find((line) => typeof line === 'string' && line.includes('activation_email.delivery_failed'));
        expect(failureLine).toBeDefined();
        const parsed = JSON.parse(failureLine as string) as Record<string, unknown>;
        expect(parsed).toMatchObject({
          event: 'activation_email.delivery_failed',
          product: 'ai_client_acquisition_1499_subscription',
          recipient: user.email,
          provider: 'resend',
        });
        expect(typeof parsed.error).toBe('string');
        expect(String(parsed.error)).toContain('422');

        // No secret, no activation token/URL anywhere in anything logged.
        const everyLoggedString = errorSpy.mock.calls
          .flat()
          .filter((v) => typeof v === 'string')
          .join('\n');
        expect(everyLoggedString).not.toContain(process.env.RESEND_API_KEY);
        expect(everyLoggedString).not.toContain('/activate/');
      } finally {
        globalThis.fetch = originalFetch;
        errorSpy.mockRestore();
      }
    }, 60_000);
  });
});
