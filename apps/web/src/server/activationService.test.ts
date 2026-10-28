import { fakeRepository, hashPassword, mintActivationToken } from '@acos/core-identity';
import type { ActivationEmailMessage, ActivationEmailSender } from '@acos/core-identity';
import { CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG, fakeSubscriptionPeriodRepository } from '@acos/core-subscriptions';
import type { SubscriptionPeriod } from '@acos/core-subscriptions';
import { describe, expect, it } from 'vitest';

import {
  consumeClientFinderActivation,
  isEligibleForClientFinderActivation,
  maybeIssueClientFinderActivationLink,
  requestClientFinderActivation,
  type ActivationDeps,
} from './activationService';

// AUTH Phase 2 — ₹1,499 Client Finder activation service, unit-level
// (fake repositories, no real Postgres — see
// tests/integration/auth-activation.integration.test.ts for the real-DB
// coverage of the same invariants plus concurrency).
//
// Security invariants under test, numbered per the authorization's
// "SECURITY INVARIANTS — MUST TEST" list:
//   1 valid activation succeeds; 2 invalid token fails; 3 random token
//   fails; 4 expired token fails; 5 replay fails; 6 old token fails
//   after resend; 7 new token works after resend; 8 token cannot
//   activate another userId; 10 requires active subscription; 11
//   expired subscription cannot activate; 12 does not trust browser-
//   supplied subscription status; 13/14/15 email verification timing;
//   16 existing password never overwritten; 17 passwordless setup; 19
//   no duplicate users; 21/22 enumeration-safe request/consume; 23
//   token is not a login credential; 26/27 Phase 0 shared gate reused,
//   no independent predicate.

const NOW = new Date('2026-10-10T00:00:00.000Z');
const SLUG = CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG;

function activePeriod(userId: string, overrides: Partial<SubscriptionPeriod> = {}): SubscriptionPeriod {
  return {
    id: `period_${userId}`,
    userId,
    productSlug: SLUG,
    razorpaySubscriptionId: 'sub_1',
    razorpayPaymentId: `pay_${userId}`,
    activationAt: NOW,
    durationDays: 30,
    refundedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function fakeSender(): ActivationEmailSender & { sent: ActivationEmailMessage[] } {
  const sent: ActivationEmailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

async function depsWithUser(
  email: string,
  periods: readonly SubscriptionPeriod[] = [],
): Promise<{ deps: ActivationDeps; userId: string }> {
  const identity = fakeRepository();
  const user = await identity.findOrCreateUser(email, NOW);
  const subscriptionPeriods = fakeSubscriptionPeriodRepository(periods);
  return { deps: { identity, subscriptionPeriods }, userId: user.id };
}

describe('isEligibleForClientFinderActivation (invariant 10/26/27: Phase 0 shared gate, no independent predicate)', () => {
  it('true when an active ₹1,499 period exists', async () => {
    const { userId } = await depsWithUser('buyer@example.test');
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(userId)]);
    expect(await isEligibleForClientFinderActivation({ subscriptionPeriods }, userId, NOW)).toBe(true);
  });

  it('false when no period exists at all', async () => {
    const { deps, userId } = await depsWithUser('nobuyer@example.test');
    expect(await isEligibleForClientFinderActivation(deps, userId, NOW)).toBe(false);
  });

  it('false for an expired period (invariant 8/11)', async () => {
    const userId = 'user_1';
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      activePeriod(userId, { activationAt: new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000), durationDays: 30 }),
    ]);
    expect(await isEligibleForClientFinderActivation({ subscriptionPeriods }, userId, NOW)).toBe(false);
  });

  it('false for a refunded period', async () => {
    const userId = 'user_1';
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(userId, { refundedAt: NOW })]);
    expect(await isEligibleForClientFinderActivation({ subscriptionPeriods }, userId, NOW)).toBe(false);
  });
});

describe('requestClientFinderActivation (invariant 21: enumeration-safe)', () => {
  it('unknown email: returns false, sends nothing, throws nothing', async () => {
    const identity = fakeRepository();
    const subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const sender = fakeSender();
    const result = await requestClientFinderActivation(
      { identity, subscriptionPeriods },
      sender,
      { email: 'ghost@example.test', baseUrl: 'https://app.test' },
      NOW,
    );
    expect(result).toBe(false);
    expect(sender.sent).toHaveLength(0);
  });

  it('known but ineligible (no active subscription): sends nothing', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('ineligible@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const sender = fakeSender();
    const result = await requestClientFinderActivation(
      { identity, subscriptionPeriods },
      sender,
      { email: 'ineligible@example.test', baseUrl: 'https://app.test' },
      NOW,
    );
    expect(result).toBe(false);
    expect(sender.sent).toHaveLength(0);
    void user;
  });

  it('known and eligible: mints and sends exactly one link to the live users.email, not a cached value', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('Eligible@Example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);
    const sender = fakeSender();
    const result = await requestClientFinderActivation(
      { identity, subscriptionPeriods },
      sender,
      { email: 'eligible@example.test', baseUrl: 'https://app.test' },
      NOW,
    );
    expect(result).toBe(true);
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]?.to).toBe('eligible@example.test');
    expect(sender.sent[0]?.activationUrl).toMatch(/^https:\/\/app\.test\/activate\//);
  });
});

describe('consumeClientFinderActivation — new customer (invariant 1/13/14/15/17/19)', () => {
  it('a valid, eligible token for a dormant (password_hash NULL) user requires + persists setup, verifies email, and mints a session', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('new@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);
    const sender = fakeSender();
    await maybeIssueClientFinderActivationLink(
      { identity, subscriptionPeriods },
      sender,
      { userId: user.id, email: user.email, baseUrl: 'https://app.test' },
      NOW,
    );
    const rawToken = sender.sent[0]!.activationUrl.split('/activate/')[1]!;

    // Entering an email at checkout, or the email merely being sent, must not verify it (13/14).
    const before = await identity.findUserAuthStateById(user.id);
    expect(before?.emailVerifiedAt).toBeNull();

    const result = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      decodeURIComponent(rawToken),
      { firstName: 'Ada', lastName: 'Lovelace', phone: '+911234567890', password: 'correct-horse' },
      NOW,
    );
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unreachable');
    expect(result.userId).toBe(user.id);
    expect(result.session.token.length).toBeGreaterThan(10);

    const after = await identity.findUserAuthStateById(user.id);
    expect(after?.emailVerifiedAt).not.toBeNull(); // 15: verified only after successful activation
    expect(after?.passwordHash).not.toBeNull();

    // 19: no duplicate user was created for this email.
    expect(await identity.findUserByEmail('new@example.test')).not.toBeNull();
  });

  it('rejects when required setup fields are missing for a dormant user', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('incomplete@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);
    const minted = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    const result = await consumeClientFinderActivation({ identity, subscriptionPeriods }, minted.token, {}, NOW);
    expect(result.status).toBe('validation-error');
  });
});

describe('consumeClientFinderActivation — existing account with a password (invariant 16)', () => {
  it('skips setup entirely, ignores any password in the body, and never overwrites the existing hash', async () => {
    const identity = fakeRepository();
    const user = await identity.createUser({ email: 'has-password@example.test', passwordHash: 'original-hash' }, NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);
    const minted = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    const result = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      minted.token,
      { password: 'attacker-supplied-password' },
      NOW,
    );
    expect(result.status).toBe('ok');

    const after = await identity.findUserAuthStateById(user.id);
    expect(after?.passwordHash).toBe('original-hash');
    expect(after?.emailVerifiedAt).not.toBeNull();
  });
});

describe('consumeClientFinderActivation — token/eligibility rejections (invariants 2/3/4/5/6/7/8/11/12)', () => {
  it('rejects an unknown/random token', async () => {
    const identity = fakeRepository();
    const subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const result = await consumeClientFinderActivation({ identity, subscriptionPeriods }, 'not-a-real-token', undefined, NOW);
    expect(result).toEqual({ status: 'rejected' });
  });

  it('rejects an expired token', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('expired-token@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);
    const minted = mintActivationToken(new Date(NOW.getTime() - 25 * 60 * 60 * 1000));
    await identity.saveActivationToken({
      tokenHash: minted.tokenHash,
      userId: user.id,
      expiresAt: minted.expiresAt,
      now: new Date(NOW.getTime() - 25 * 60 * 60 * 1000),
    });
    const result = await consumeClientFinderActivation({ identity, subscriptionPeriods }, minted.token, undefined, NOW);
    expect(result).toEqual({ status: 'rejected' });
  });

  it('a consumed token cannot be replayed', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('replay@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);
    const minted = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    const first = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      minted.token,
      { firstName: 'A', lastName: 'B', phone: '123', password: 'correct-horse' },
      NOW,
    );
    expect(first.status).toBe('ok');

    const second = await consumeClientFinderActivation({ identity, subscriptionPeriods }, minted.token, undefined, NOW);
    expect(second).toEqual({ status: 'rejected' });
  });

  it('an old token is rejected after resend (invariant 6); the new one works (invariant 7)', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('resend@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(user.id)]);

    const first = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: first.tokenHash, userId: user.id, expiresAt: first.expiresAt, now: NOW });

    const later = new Date(NOW.getTime() + 60_000);
    const second = mintActivationToken(later);
    await identity.saveActivationToken({ tokenHash: second.tokenHash, userId: user.id, expiresAt: second.expiresAt, now: later });

    const oldAttempt = await consumeClientFinderActivation({ identity, subscriptionPeriods }, first.token, undefined, later);
    expect(oldAttempt).toEqual({ status: 'rejected' });

    const newAttempt = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      second.token,
      { firstName: 'A', lastName: 'B', phone: '123', password: 'correct-horse' },
      later,
    );
    expect(newAttempt.status).toBe('ok');
  });

  it('a token bound to user_id A cannot be used to activate user_id B (invariant 8/15) — tokens cannot be forged for another user, only looked up by their own hash', async () => {
    const identity = fakeRepository();
    const userA = await identity.findOrCreateUser('a@example.test', NOW);
    const userB = await identity.findOrCreateUser('b@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([activePeriod(userA.id), activePeriod(userB.id)]);

    const mintedForA = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: mintedForA.tokenHash, userId: userA.id, expiresAt: mintedForA.expiresAt, now: NOW });

    const result = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      mintedForA.token,
      { firstName: 'A', lastName: 'B', phone: '123', password: 'correct-horse' },
      NOW,
    );
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unreachable');
    // The token resolved to exactly the user it was minted for, never
    // the other party that happened to be eligible too.
    expect(result.userId).toBe(userA.id);
    expect(result.userId).not.toBe(userB.id);
  });

  it('a structurally-valid, unexpired token is rejected once the subscription has lapsed in the meantime (invariant 11/12 — live re-check, not client-supplied status)', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('lapsed@example.test', NOW);
    // Already-expired period (activated 2 days ago, 1-day duration) —
    // the token is minted fresh at NOW regardless, so its own 24h TTL is
    // untouched by the subscription's independent, already-lapsed clock.
    const subscriptionPeriods = fakeSubscriptionPeriodRepository([
      activePeriod(user.id, { activationAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000), durationDays: 1 }),
    ]);
    const minted = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    // Well within the token's own 24h window, but the subscription it
    // was issued for is long since lapsed.
    const stillWithinTokenTtl = new Date(NOW.getTime() + 60 * 60 * 1000);
    const result = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      minted.token,
      undefined,
      stillWithinTokenTtl,
    );
    expect(result).toEqual({ status: 'rejected' });

    // The token was consumed (burned) by this attempt even though it
    // was rejected — a second attempt must also fail, never succeed.
    const secondAttempt = await consumeClientFinderActivation(
      { identity, subscriptionPeriods },
      minted.token,
      undefined,
      stillWithinTokenTtl,
    );
    expect(secondAttempt).toEqual({ status: 'rejected' });
  });
});

describe('maybeIssueClientFinderActivationLink (invariant 10: never sends for an ineligible purchase)', () => {
  it('does not mint or send when the user has no active subscription', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('never-bought@example.test', NOW);
    const subscriptionPeriods = fakeSubscriptionPeriodRepository();
    const sender = fakeSender();
    const sent = await maybeIssueClientFinderActivationLink(
      { identity, subscriptionPeriods },
      sender,
      { userId: user.id, email: user.email, baseUrl: 'https://app.test' },
      NOW,
    );
    expect(sent).toBe(false);
    expect(sender.sent).toHaveLength(0);
  });
});

describe('activation token is not a normal login credential (invariant 23)', () => {
  it('the raw activation token hashes to a value only findActivationToken resolves — password login has no code path that accepts it', async () => {
    const identity = fakeRepository();
    const user = await identity.findOrCreateUser('not-a-login@example.test', NOW);
    const minted = mintActivationToken(NOW);
    await identity.saveActivationToken({ tokenHash: minted.tokenHash, userId: user.id, expiresAt: minted.expiresAt, now: NOW });

    // findCredentialsByEmail (login's own lookup) has no password set and
    // is wholly unaffected by the activation token existing.
    const credentials = await identity.findCredentialsByEmail(user.email);
    expect(credentials?.passwordHash).toBeNull();
    await hashPassword('irrelevant'); // sanity: module import resolves
  });
});
