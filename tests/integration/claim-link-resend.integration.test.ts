import { Pool } from 'pg';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { ProductId } from '@acos/catalog';
import { createPgEntitlementRepository } from '@acos/core-entitlements';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';
import { createPgOrderRepository } from './support/pgOrderRepository';

// The real /api/payments/claim-link/resend route, end to end, against a
// real PostgreSQL database — DEC-014 D3.
// -----------------------------------------------------------------------
// claim-flow.integration.test.ts's own doc comment flagged this route as
// untestable through the real HTTP surface because
// apps/web/src/server/orderRepository.ts hard-wires
// createPrismaOrderRepository(prisma), and this sandbox's generated
// Prisma client is a stale template (prisma generate cannot reach
// binaries.prisma.sh here — see support/pgOrderRepository.ts's own doc
// comment, which exists for exactly this reason on the create-order
// path).
//
// orderRepository.ts already had no test seam, so this adds one,
// __setOrderRepositoryForTests, mirroring the *same* established
// convention as src/server/db.ts's __setPoolForTests and
// src/server/rateLimit.ts's __setRateLimiterForTests — a test-only
// override, not exported from any route, that swaps nothing about the
// production code path (getOrderRepository() still defaults to the real
// Prisma repository). With that one seam, this test points the route at
// support/pgOrderRepository's real-Postgres implementation — the same
// substitute create-order.integration.test.ts already uses — while
// every other dependency (entitlements, rate limiting) goes through its
// real production code, unmocked, against the same real database.
// -----------------------------------------------------------------------

const STARTER_PAISE = 9_900;

let reachable = false;

let current: { db: TempDatabase; orderPool: Pool } | null = null;

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterEach(async () => {
  if (current) {
    // commerceRepositories()/getPool() opens its own pg.Pool against this
    // same temp database, independent of env.db.client — db.drop()'s
    // pg_terminate_backend kills it too, and an unclosed Pool surfaces
    // that as an unhandled 'error' event on whichever test runs next.
    const dbMod = (await import('../../apps/web/src/server/db')) as {
      closeClientFinderPool: () => Promise<void>;
    };
    await dbMod.closeClientFinderPool().catch(() => undefined);
    await current.orderPool.end().catch(() => undefined);
    await current.db.drop().catch(() => undefined);
    current = null;
  }
  vi.resetModules();
});

interface Env {
  db: TempDatabase;
  resend: (request: Request) => Promise<Response>;
}

async function freshRoute(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = db.url;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_resend';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_resend';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_resend';
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_resend';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-resend-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'e'.repeat(48);
  process.env.GOOGLE_PLACES_API_KEY = 'places-key-resend-not-real';
  process.env.APP_BASE_URL = 'https://shop.test';

  vi.resetModules();

  const orderPool = new Pool({ connectionString: db.url });
  const orderRepoMod = await import('../../apps/web/src/server/orderRepository');
  orderRepoMod.__setOrderRepositoryForTests(createPgOrderRepository(orderPool));

  const rateLimitMod = (await import('../../apps/web/src/server/rateLimit')) as {
    __setRateLimiterForTests: (next: null) => void;
  };
  rateLimitMod.__setRateLimiterForTests(null);

  const resendMod = (await import('../../apps/web/app/api/payments/claim-link/resend/route')) as unknown as {
    POST: (request: Request) => Promise<Response>;
  };

  current = { db, orderPool };
  return { db, resend: resendMod.POST };
}

/** A paid order with a granted entitlement — the precondition issueClaimLink requires. */
async function paidEntitlement(
  env: Env,
  suffix: string,
  email = `buyer+${suffix}@example.test`,
  productSlug: ProductId = 'ai_income_99',
) {
  const orderId = `order_${suffix}`;
  const razorpayOrderId = `rzp_${suffix}`;
  await env.db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $5, 'AI Income Starter Kit', $4, 'INR', 'PAID', now())`,
    [orderId, razorpayOrderId, email, STARTER_PAISE, productSlug],
  );
  // migration 0003's trigger requires a CAPTURED payment before an
  // entitlement for this order may exist.
  await env.db.client.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $4, 'INR', 'CAPTURED', now())`,
    [`payment_${suffix}`, `rzp_pay_${suffix}`, orderId, STARTER_PAISE],
  );
  const repo = createPgEntitlementRepository(env.db.client);
  await repo.grant({ customerEmail: email, productSlug, orderId }, new Date());
  return { orderId, razorpayOrderId, email, repo };
}

function postJson(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://acos.test/api/payments/claim-link/resend', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function latestTokenHash(env: Env, orderId: string): Promise<{ hash: string; invalidatedAt: Date | null }> {
  const { rows } = await env.db.client.query(
    `SELECT token_hash, invalidated_at FROM claim_tokens
     WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId],
  );
  return { hash: rows[0].token_hash, invalidatedAt: rows[0].invalidated_at };
}

async function tokenCount(env: Env, orderId: string): Promise<number> {
  const { rows } = await env.db.client.query('SELECT count(*)::int AS n FROM claim_tokens WHERE order_id = $1', [
    orderId,
  ]);
  return rows[0].n;
}

describe('POST /api/payments/claim-link/resend — real route, real database (DEC-014 D3)', () => {
  it('resends successfully: issues a new claim token and reports the destination email', async () => {
    const env = await freshRoute('resend-success');
    const { orderId, razorpayOrderId, email } = await paidEntitlement(env, 'r1');

    const before = await tokenCount(env, orderId);
    expect(before).toBe(0);

    const response = await env.resend(postJson({ razorpayOrderId }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.status).toBe('sent');
    expect(body.customerEmail).toBe(email);

    expect(await tokenCount(env, orderId)).toBe(1);
  });

  it('latest-link-wins: a resend invalidates the previously issued unused token for the same order', async () => {
    const env = await freshRoute('resend-latest-wins');
    const { orderId, razorpayOrderId } = await paidEntitlement(env, 'r2');

    const first = await env.resend(postJson({ razorpayOrderId }));
    expect(first.status).toBe(201);
    const firstToken = await latestTokenHash(env, orderId);
    expect(firstToken.invalidatedAt).toBeNull();

    const second = await env.resend(postJson({ razorpayOrderId }));
    expect(second.status).toBe(201);

    const { rows } = await env.db.client.query(
      `SELECT token_hash, invalidated_at FROM claim_tokens WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderId],
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].invalidated_at).not.toBeNull();
    expect(rows[0].token_hash).toBe(firstToken.hash);
    expect(rows[1].invalidated_at).toBeNull();
  });

  it('already-claimed order: resend still issues a fresh link rather than silently no-opping', async () => {
    // DEC-014 D3's resend exists for "lost the email" — the route grants
    // based on entitlement existing, not on whether it has since been
    // claimed, so a buyer who claimed on one device can still get a
    // fresh link (e.g. to sign in on another). This asserts the route's
    // actual, current behaviour rather than an unwritten requirement.
    const env = await freshRoute('resend-already-claimed');
    const { orderId, razorpayOrderId, email, repo } = await paidEntitlement(env, 'r3');

    const { createPgIdentityRepository } = await import('@acos/core-identity');
    const identity = createPgIdentityRepository(env.db.client);
    const user = await identity.createUser({ email, passwordHash: 'irrelevant-hash' }, new Date());
    await repo.linkEntitlementsToUser(email, user.id, new Date());

    const response = await env.resend(postJson({ razorpayOrderId }));
    expect(response.status).toBe(201);
    expect(await tokenCount(env, orderId)).toBe(1);
  });

  it('invalid/non-eligible order: an unknown razorpayOrderId is rejected without issuing anything', async () => {
    const env = await freshRoute('resend-unknown-order');

    const response = await env.resend(postJson({ razorpayOrderId: 'rzp_does_not_exist' }));
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe('ORDER_NOT_FOUND');
  });

  it('an order with no granted entitlement yet (payment unconfirmed) is rejected', async () => {
    const env = await freshRoute('resend-unpaid');
    const orderId = 'order_r5';
    const razorpayOrderId = 'rzp_r5';
    await env.db.client.query(
      `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                           product_name, amount_paise, currency, status, updated_at)
       VALUES ($1, $2, $3, 'ai_income_99', 'AI Income Starter Kit', $4, 'INR', 'PENDING', now())`,
      [orderId, razorpayOrderId, 'buyer+r5@example.test', STARTER_PAISE],
    );

    const response = await env.resend(postJson({ razorpayOrderId }));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('NOT_YET_PAID');
    expect(await tokenCount(env, orderId)).toBe(0);
  });

  it('malformed request body is rejected as a validation error', async () => {
    const env = await freshRoute('resend-validation');

    const response = await env.resend(postJson({}));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('VALIDATION_ERROR');
  });

  it('rate limits by email: a fourth resend within the window for the same order is blocked', async () => {
    const env = await freshRoute('resend-rate-email');
    const { razorpayOrderId } = await paidEntitlement(env, 'r6');

    for (let i = 0; i < 3; i += 1) {
      const ok = await env.resend(postJson({ razorpayOrderId }, { 'x-forwarded-for': `10.0.0.${i + 1}` }));
      expect(ok.status).toBe(201);
    }

    const limited = await env.resend(postJson({ razorpayOrderId }, { 'x-forwarded-for': '10.0.0.9' }));
    expect(limited.status).toBe(429);
    const body = await limited.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(limited.headers.get('Retry-After')).not.toBeNull();
  });

  it('rate limits by IP: a request flood from one address is blocked before the order is even looked up', async () => {
    const env = await freshRoute('resend-rate-ip');
    const sameIp = { 'x-forwarded-for': '203.0.113.5' };

    // The IP ceiling (10) is checked before order lookup, so these can
    // all target orders that do not exist and still exercise the limit.
    for (let i = 0; i < 10; i += 1) {
      const response = await env.resend(postJson({ razorpayOrderId: `rzp_missing_${i}` }, sameIp));
      expect(response.status).toBe(404);
    }

    const limited = await env.resend(postJson({ razorpayOrderId: 'rzp_missing_11' }, sameIp));
    expect(limited.status).toBe(429);
    expect((await limited.json()).code).toBe('RATE_LIMITED');
  });
});
