import { randomUUID } from 'node:crypto';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createPgEntitlementRepository,
  hashAccessToken,
  issueClaimLink,
  type ClaimEmailMessage,
} from '@acos/core-entitlements';
import type { ProductId } from '@acos/catalog';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// The real /api/claim/validate and /api/auth/signup routes, end to end,
// against a real PostgreSQL database — DEC-014.
// -----------------------------------------------------------------------
// This is the one place the claim/setup HTTP surface is exercised as
// Next.js itself would invoke it, the same reasoning
// webhook-route.integration.test.ts already documents for the webhook
// route. /api/payments/claim-link/resend is NOT covered here: it reads
// orders through @acos/core-payments' createPrismaOrderRepository,
// which (per that file's own doc comment) cannot run against this
// sandbox's stale generated Prisma client — a pre-existing limitation,
// not something this test works around.
//
// Claim tokens are produced with the real issueClaimLink against the
// real repository, capturing the plaintext token the same way the
// webhook/resend paths' ConsoleClaimEmailSender would log it — this
// test does not reach into the database for a token a real buyer could
// never have gotten there.
// -----------------------------------------------------------------------

const STARTER_PAISE = 9_900;

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

interface Env {
  db: TempDatabase;
  validate: (request: Request) => Promise<Response>;
  signup: (request: Request) => Promise<Response>;
}

async function freshRoutes(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = db.url;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_claim';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_claim';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_claim';
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_claim';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-claim-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'e'.repeat(48);
  process.env.GOOGLE_PLACES_API_KEY = 'places-key-claim-not-real';

  vi.resetModules();
  // NextRequest is structurally a Request for everything these routes
  // read (method, json(), headers) — the cast below goes through
  // `unknown` because NextRequest's extra fields make the two function
  // types contravariantly incompatible to TypeScript, not because
  // anything here is actually unsafe at runtime.
  const validateMod = (await import('../../apps/web/app/api/claim/validate/route')) as unknown as {
    POST: (request: Request) => Promise<Response>;
  };
  const signupMod = (await import('../../apps/web/app/api/auth/signup/route')) as unknown as {
    POST: (request: Request) => Promise<Response>;
  };
  const rateLimit = (await import('../../apps/web/src/server/rateLimit')) as {
    __setRateLimiterForTests: (next: null) => void;
  };
  rateLimit.__setRateLimiterForTests(null);

  current = { db, close: async () => undefined };
  return { db, validate: validateMod.POST, signup: signupMod.POST };
}

/** A paid order with a granted entitlement — the precondition every claim token requires. */
async function paidEntitlement(
  env: Env,
  suffix: string,
  email = `buyer+${suffix}@example.test`,
  productSlug: ProductId = 'ai_income_99',
) {
  const orderId = `order_${suffix}`;
  await env.db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $5, 'AI Income Starter Kit', $4, 'INR', 'PAID', now())`,
    [orderId, `rzp_${suffix}`, email, STARTER_PAISE, productSlug],
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
  return { orderId, email, repo };
}

/** Mints a real claim token the way issueClaimLink would, capturing it instead of emailing it. */
async function mintRealToken(
  repo: ReturnType<typeof createPgEntitlementRepository>,
  orderId: string,
  email: string,
  now = new Date(),
): Promise<string> {
  let captured: ClaimEmailMessage | null = null;
  await issueClaimLink(repo, { send: async (m) => void (captured = m) }, { orderId, customerEmail: email, baseUrl: 'https://shop.test' }, now);
  const token = decodeURIComponent(captured!.claimUrl.split('/claim/')[1]!);
  return token;
}

function postJson(body: unknown): Request {
  return new Request('https://acos.test/api/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('DEC-014 claim/setup flow — real routes, real database', () => {
  it('a valid, freshly issued claim token validates and creates an account with a session', async () => {
    const env = await freshRoutes('claim-valid');
    const { orderId, email, repo } = await paidEntitlement(env, 'a1');
    const token = await mintRealToken(repo, orderId, email);

    const validated = await env.validate(postJson({ claimToken: token }));
    expect(validated.status).toBe(200);
    expect((await validated.json()).customerEmail).toBe(email);

    const signed = await env.signup(postJson({ claimToken: token, password: 'correct-horse-battery' }));
    expect(signed.status).toBe(201);
    const signedBody = await signed.json();
    expect(signedBody.status).toBe('created');
    expect(signedBody.email).toBe(email);
    expect(signed.headers.get('set-cookie')).toMatch(/acos_session/);

    const { rows } = await env.db.client.query('SELECT count(*)::int AS n FROM users WHERE email = $1', [
      email,
    ]);
    expect(rows[0].n).toBe(1);
  });

  it('rejects an unknown token identically for validate and signup', async () => {
    const env = await freshRoutes('claim-unknown');
    await paidEntitlement(env, 'a2');

    const validated = await env.validate(postJson({ claimToken: 'not-a-real-token' }));
    expect(validated.status).toBe(410);

    const signed = await env.signup(postJson({ claimToken: 'not-a-real-token', password: 'whatever12' }));
    expect(signed.status).toBe(410);
  });

  it('rejects an expired claim token', async () => {
    const env = await freshRoutes('claim-expired');
    const { orderId, email, repo } = await paidEntitlement(env, 'a3');

    const token = 'expired-token-value-0123456789';
    await repo.saveClaimToken({
      tokenHash: hashAccessToken(token),
      orderId,
      customerEmail: email,
      expiresAt: new Date(Date.now() - 1000),
      now: new Date(Date.now() - 2000),
    });

    const validated = await env.validate(postJson({ claimToken: token }));
    expect(validated.status).toBe(410);
  });

  it('a claim token can be consumed exactly once — the second signup attempt is rejected', async () => {
    const env = await freshRoutes('claim-single-use');
    const { orderId, email, repo } = await paidEntitlement(env, 'a4');
    const token = await mintRealToken(repo, orderId, email);

    const first = await env.signup(postJson({ claimToken: token, password: 'first-password-1' }));
    expect(first.status).toBe(201);

    const second = await env.signup(postJson({ claimToken: token, password: 'second-password-1' }));
    expect(second.status).toBe(410);
    // evaluateClaimToken already sees claimedAt set and rejects before
    // the route ever reaches markClaimTokenClaimed — that code path
    // ('CLAIM_TOKEN_ALREADY_CLAIMED') is reserved for the race where two
    // concurrent requests both pass evaluateClaimToken and the database
    // breaks the tie, not for this sequential retry.
    expect((await second.json()).code).toBe('CLAIM_TOKEN_INVALID');

    const revalidate = await env.validate(postJson({ claimToken: token }));
    expect(revalidate.status).toBe(410);
  });

  it('latest-token-wins: a newer claim token invalidates the previous unused one for the same order (DEC-014 D4)', async () => {
    const env = await freshRoutes('claim-latest-wins');
    const { orderId, email, repo } = await paidEntitlement(env, 'a5');

    const first = await mintRealToken(repo, orderId, email, new Date());
    const second = await mintRealToken(repo, orderId, email, new Date(Date.now() + 1000));

    const firstValidate = await env.validate(postJson({ claimToken: first }));
    expect(firstValidate.status).toBe(410);

    const secondValidate = await env.validate(postJson({ claimToken: second }));
    expect(secondValidate.status).toBe(200);

    // The superseded first token cannot be used to create the account either.
    const firstSignup = await env.signup(postJson({ claimToken: first, password: 'irrelevant1' }));
    expect(firstSignup.status).toBe(410);

    const secondSignup = await env.signup(postJson({ claimToken: second, password: 'irrelevant1' }));
    expect(secondSignup.status).toBe(201);
  });

  it('existing account: a second order under the same email links to the first account rather than duplicating it', async () => {
    const env = await freshRoutes('claim-existing-account');
    const email = 'repeat-buyer@example.test';
    const first = await paidEntitlement(env, 'a6', email);
    const firstToken = await mintRealToken(first.repo, first.orderId, email);
    const firstSignup = await env.signup(postJson({ claimToken: firstToken, password: 'first-password-1' }));
    expect(firstSignup.status).toBe(201);

    const second = await paidEntitlement(env, 'a6b', email, 'ai_freelancing_499' as ProductId);
    const secondToken = await mintRealToken(second.repo, second.orderId, email);
    const secondSignup = await env.signup(postJson({ claimToken: secondToken, password: 'ignored-password' }));
    expect(secondSignup.status).toBe(200);
    expect((await secondSignup.json()).status).toBe('existing-account');

    // Not a session grant — DEC-010/DEC-011's account-takeover guard.
    expect(secondSignup.headers.get('set-cookie')).toBeNull();

    const { rows } = await env.db.client.query('SELECT count(*)::int AS n FROM users WHERE email = $1', [
      email,
    ]);
    expect(rows[0].n).toBe(1);

    const { rows: entitlementRows } = await env.db.client.query(
      'SELECT count(*)::int AS n FROM entitlements WHERE customer_email = $1 AND user_id IS NOT NULL',
      [email],
    );
    expect(entitlementRows[0].n).toBe(2);
  });

  it('security: a client cannot substitute its own email, even on an otherwise-valid claim token', async () => {
    const env = await freshRoutes('claim-email-substitution');
    const { orderId, email, repo } = await paidEntitlement(env, 'a7');
    const token = await mintRealToken(repo, orderId, email);

    const signed = await env.signup(
      postJson({ claimToken: token, password: 'whatever123', email: 'attacker@evil.test' }),
    );
    expect(signed.status).toBe(400);
    expect((await signed.json()).code).toBe('VALIDATION_ERROR');

    // The token is still unconsumed — rejecting the request must not burn the single use.
    const validated = await env.validate(postJson({ claimToken: token }));
    expect(validated.status).toBe(200);
  });
});
