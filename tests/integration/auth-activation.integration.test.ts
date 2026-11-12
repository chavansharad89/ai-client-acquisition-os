import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createPgIdentityRepository,
  issueActivationLink,
  mintActivationToken,
  resolveSession,
  type ActivationEmailMessage,
  type ActivationEmailSender,
} from '@acos/core-identity';
import { createPgSubscriptionPeriodRepository } from '@acos/core-subscriptions';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// Dynamic import, matching this directory's own convention for reaching
// into apps/web from tests/integration (see claim-link-resend.integration.test.ts).
const { consumeClientFinderActivation, isEligibleForClientFinderActivation, maybeIssueClientFinderActivationLink } =
  await import('../../apps/web/src/server/activationService');

// AUTH Phase 2 — ₹1,499 Client Finder activation, against REAL
// PostgreSQL. Covers what a fake-repository unit test cannot: the
// atomic single-use consume under TRUE concurrency (two real
// connections racing the same UPDATE), and the full chain reading
// through the real `activation_tokens`/`subscription_periods`/`users`
// tables via the actual Phase 0 shared gate
// (findActiveClientFinderSubscriptionPeriod) — not a fake.
//
// Service-layer branch coverage (validation, existing-vs-dormant
// account, enumeration-safe responses) lives in
// apps/web/src/server/activationService.test.ts and the two route test
// files alongside it; this file does not repeat those.

const SLUG = 'ai_client_acquisition_1499_subscription';
const NOW = new Date('2026-10-10T00:00:00.000Z');

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

function fakeSender(): ActivationEmailSender & { sent: ActivationEmailMessage[] } {
  const sent: ActivationEmailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

async function freshEnv(label: string) {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\nStart it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});
  open.push(db);
  const pool = new Pool({ connectionString: db.url });
  pools.push(pool);
  const identity = createPgIdentityRepository(pool);
  const subscriptionPeriods = createPgSubscriptionPeriodRepository(pool);
  return { db, pool, identity, subscriptionPeriods };
}

async function insertActivePeriod(
  env: Awaited<ReturnType<typeof freshEnv>>,
  userId: string,
  suffix: string,
  overrides: { activationAt?: Date; durationDays?: number; refundedAt?: Date | null } = {},
): Promise<void> {
  await env.db.client.query(
    `INSERT INTO subscription_periods
       (id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, activation_at, duration_days, refunded_at, created_at, updated_at)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, now(), now())`,
    [
      userId,
      SLUG,
      `sub_${suffix}`,
      `pay_${suffix}`,
      overrides.activationAt ?? NOW,
      overrides.durationDays ?? 30,
      overrides.refundedAt ?? null,
    ],
  );
}

describe('AUTH Phase 2 — ₹1,499 activation, real PostgreSQL', () => {
  it('end to end: dormant purchaser -> eligible -> link issued -> consumed -> profile+password persisted -> session resolves', async () => {
    const env = await freshEnv('activation-e2e');
    // AUTH-PO-25: dormant row, created the same way checkout does.
    const user = await env.identity.findOrCreateUser('new-buyer@example.test', NOW);
    await insertActivePeriod(env, user.id, 'e2e');

    expect(await isEligibleForClientFinderActivation({ subscriptionPeriods: env.subscriptionPeriods }, user.id, NOW)).toBe(
      true,
    );

    const sender = fakeSender();
    await issueActivationLink(env.identity, sender, { userId: user.id, email: user.email, baseUrl: 'https://app.test' }, NOW);
    expect(sender.sent).toHaveLength(1);
    const rawToken = decodeURIComponent(sender.sent[0]!.activationUrl.split('/activate/')[1]!);

    // Entering an email at checkout / an email merely being sent must
    // not verify it (invariants 13/14).
    const before = await env.identity.findUserAuthStateById(user.id);
    expect(before?.emailVerifiedAt).toBeNull();

    const result = await consumeClientFinderActivation(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      rawToken,
      { firstName: 'Ada', lastName: 'Lovelace', phone: '+911234567890', password: 'correct-horse-battery' },
      NOW,
    );
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unreachable');

    const { rows } = await env.db.client.query(
      `SELECT password_hash, email_verified_at, first_name, last_name, phone FROM users WHERE id = $1`,
      [user.id],
    );
    expect(rows[0].password_hash).not.toBeNull();
    expect(rows[0].email_verified_at).not.toBeNull();
    expect(rows[0].first_name).toBe('Ada');
    expect(rows[0].last_name).toBe('Lovelace');
    expect(rows[0].phone).toBe('+911234567890');

    // The minted session resolves to exactly this user — mintUserSession
    // is the unchanged, existing primitive (AUTH-PO-11 untouched).
    const resolution = await resolveSession(env.identity, result.session.token, NOW);
    expect(resolution).toEqual({ authenticated: true, userId: user.id });

    // Only one users row exists for this email (invariant 19).
    const { rows: userCount } = await env.db.client.query(`SELECT count(*)::int AS n FROM users WHERE email = $1`, [
      'new-buyer@example.test',
    ]);
    expect(userCount[0].n).toBe(1);
  });

  it('existing account with a password: activation skips setup and never overwrites the password (invariant 16)', async () => {
    const env = await freshEnv('activation-existing-password');
    const user = await env.identity.createUser({ email: 'has-password@example.test', passwordHash: 'original-hash' }, NOW);
    await insertActivePeriod(env, user.id, 'existing');

    const sender = fakeSender();
    await issueActivationLink(env.identity, sender, { userId: user.id, email: user.email, baseUrl: 'https://app.test' }, NOW);
    const rawToken = decodeURIComponent(sender.sent[0]!.activationUrl.split('/activate/')[1]!);

    const result = await consumeClientFinderActivation(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      rawToken,
      { password: 'attacker-supplied' }, // must be ignored
      NOW,
    );
    expect(result.status).toBe('ok');

    const { rows } = await env.db.client.query(`SELECT password_hash FROM users WHERE id = $1`, [user.id]);
    expect(rows[0].password_hash).toBe('original-hash');
  });

  it('an expired subscription cannot activate; a fresh, unexpired token is still burned on the attempt (invariant 11)', async () => {
    const env = await freshEnv('activation-expired-sub');
    const user = await env.identity.findOrCreateUser('lapsed@example.test', NOW);
    // Activated 2 days ago, 1-day duration -- already lapsed.
    await insertActivePeriod(env, user.id, 'lapsed', {
      activationAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000),
      durationDays: 1,
    });

    expect(await isEligibleForClientFinderActivation({ subscriptionPeriods: env.subscriptionPeriods }, user.id, NOW)).toBe(
      false,
    );

    // Directly mint a token (bypassing the ineligible-skip in
    // issueActivationLink's own caller) to simulate an old link that was
    // live when the subscription WAS active.
    const minted = mintActivationToken(NOW);
    await env.identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    const result = await consumeClientFinderActivation(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      minted.token,
      undefined,
      NOW,
    );
    expect(result).toEqual({ status: 'rejected' });

    const replay = await consumeClientFinderActivation(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      minted.token,
      undefined,
      NOW,
    );
    expect(replay).toEqual({ status: 'rejected' });
  });

  it('resend invalidates the previous token (invariant 4/6/7)', async () => {
    const env = await freshEnv('activation-resend');
    const user = await env.identity.findOrCreateUser('resend@example.test', NOW);
    await insertActivePeriod(env, user.id, 'resend');

    const sender = fakeSender();
    await issueActivationLink(env.identity, sender, { userId: user.id, email: user.email, baseUrl: 'https://app.test' }, NOW);
    const firstToken = decodeURIComponent(sender.sent[0]!.activationUrl.split('/activate/')[1]!);

    const later = new Date(NOW.getTime() + 60_000);
    await issueActivationLink(env.identity, sender, { userId: user.id, email: user.email, baseUrl: 'https://app.test' }, later);
    const secondToken = decodeURIComponent(sender.sent[1]!.activationUrl.split('/activate/')[1]!);

    const oldAttempt = await consumeClientFinderActivation(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      firstToken,
      undefined,
      later,
    );
    expect(oldAttempt).toEqual({ status: 'rejected' });

    const newAttempt = await consumeClientFinderActivation(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      secondToken,
      { firstName: 'A', lastName: 'B', phone: '123', password: 'correct-horse-battery' },
      later,
    );
    expect(newAttempt.status).toBe('ok');
  });

  it('two truly concurrent consume attempts on the same token (real connections) have exactly one winner (invariant 20)', async () => {
    const env = await freshEnv('activation-concurrency');
    const user = await env.identity.findOrCreateUser('racer@example.test', NOW);
    await insertActivePeriod(env, user.id, 'racer');

    const minted = mintActivationToken(NOW);
    await env.identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    // Two independent pg connections racing the same atomic UPDATE —
    // this is the one thing a single in-process fake cannot exercise.
    const secondPool = new Pool({ connectionString: env.db.url });
    pools.push(secondPool);
    const identityB = createPgIdentityRepository(secondPool);

    const results = await Promise.all([
      env.identity.consumeActivationToken(minted.tokenHash, NOW),
      identityB.consumeActivationToken(minted.tokenHash, NOW),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('a user with no active ₹1,499 subscription never has a link sent (invariant 10)', async () => {
    const env = await freshEnv('activation-ineligible');
    const user = await env.identity.findOrCreateUser('no-purchase@example.test', NOW);

    const sender = fakeSender();
    const sent = await maybeIssueClientFinderActivationLink(
      { identity: env.identity, subscriptionPeriods: env.subscriptionPeriods },
      sender,
      { userId: user.id, email: user.email, baseUrl: 'https://app.test' },
      NOW,
    );
    expect(sent).toBe(false);
    expect(sender.sent).toHaveLength(0);

    const { rows } = await env.db.client.query(`SELECT count(*)::int AS n FROM activation_tokens WHERE user_id = $1`, [
      user.id,
    ]);
    expect(rows[0].n).toBe(0);
  });
});
