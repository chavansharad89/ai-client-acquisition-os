import { describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/placeholder';
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET ??= 'rzp_secret_placeholder';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'whsec_placeholder';
process.env.META_PIXEL_ID ??= '1234567890';
process.env.META_CAPI_ACCESS_TOKEN ??= 'meta_token_placeholder';
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-placeholder-not-real';
process.env.DOWNLOAD_GRANT_SECRET ??= 'e'.repeat(48);
process.env.GOOGLE_PLACES_API_KEY ??= 'places-key-placeholder-not-real';

import { hashAccessToken } from '@acos/core-entitlements';

// AUTH Phase 2 — POST /api/auth/activation/consume HTTP-layer tests.
// Service-level coverage (token lifecycle, eligibility, setup branching)
// lives in apps/web/src/server/activationService.test.ts; this file
// covers the route's own protocol rules: rejecting an email/userId/id
// field outright, and mapping the service's result variants to the
// right HTTP status.

interface FakeActivationTokenRow {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  consumedAt: Date | null;
  invalidatedAt: Date | null;
}

function fakeIdentity(opts: {
  tokens: FakeActivationTokenRow[];
  passwordHash?: string | null;
  email?: string;
}) {
  const passwordHashByUser: Record<string, string | null> = {};
  const emailVerifiedByUser: Record<string, Date | null> = {};
  return {
    async findActivationToken(tokenHash: string) {
      const row = opts.tokens.find((t) => t.tokenHash === tokenHash);
      if (!row) return null;
      return { userId: row.userId, expiresAt: row.expiresAt, consumedAt: row.consumedAt, invalidatedAt: row.invalidatedAt };
    },
    async consumeActivationToken(tokenHash: string, now: Date) {
      const row = opts.tokens.find((t) => t.tokenHash === tokenHash);
      if (!row || row.consumedAt !== null || row.invalidatedAt !== null) return false;
      row.consumedAt = now;
      return true;
    },
    async setEmailVerified(userId: string, now: Date) {
      emailVerifiedByUser[userId] ??= now;
    },
    async findUserAuthStateById(userId: string) {
      return {
        id: userId,
        email: opts.email ?? 'buyer@example.test',
        passwordHash: passwordHashByUser[userId] ?? opts.passwordHash ?? null,
        emailVerifiedAt: emailVerifiedByUser[userId] ?? null,
      };
    },
    async completeAccountSetup(userId: string, input: { passwordHash: string }) {
      if ((passwordHashByUser[userId] ?? opts.passwordHash ?? null) !== null) return false;
      passwordHashByUser[userId] = input.passwordHash;
      return true;
    },
    async saveSessionToken() {
      /* not asserted on here */
    },
  };
}

function fakeSubscriptionPeriods(activeForUserIds: string[]) {
  return {
    async findActiveForUser(userId: string) {
      return activeForUserIds.includes(userId)
        ? {
            id: 'period_1',
            userId,
            productSlug: 'ai_client_acquisition_1499_subscription',
            razorpaySubscriptionId: 'sub_1',
            razorpayPaymentId: 'pay_1',
            activationAt: new Date(),
            durationDays: 30,
            refundedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null;
    },
    async getById() {
      return null;
    },
  };
}

let identity: ReturnType<typeof fakeIdentity>;
let subscriptionPeriods: ReturnType<typeof fakeSubscriptionPeriods>;
vi.mock('../../../../../src/server/clientFinderRepositories', () => ({
  clientFinderRepositories: () => ({ identity, subscriptionPeriods }),
}));

const { POST } = await import('./route');

function postRequest(body: unknown) {
  return POST(
    new Request('http://localhost/api/auth/activation/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('POST /api/auth/activation/consume', () => {
  it('rejects a request body containing an email field — protocol violation, not a value to ignore', async () => {
    identity = fakeIdentity({ tokens: [] });
    subscriptionPeriods = fakeSubscriptionPeriods([]);
    const response = await postRequest({ token: 'whatever', email: 'attacker@example.test' });
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe('VALIDATION_ERROR');
  });

  it('rejects a request body containing a userId field', async () => {
    identity = fakeIdentity({ tokens: [] });
    subscriptionPeriods = fakeSubscriptionPeriods([]);
    const response = await postRequest({ token: 'whatever', userId: 'user_other' });
    expect(response.status).toBe(400);
  });

  it('rejects an unknown token with the generic rejection (410)', async () => {
    identity = fakeIdentity({ tokens: [] });
    subscriptionPeriods = fakeSubscriptionPeriods([]);
    const response = await postRequest({ token: 'never-issued' });
    expect(response.status).toBe(410);
    expect((await response.json()).code).toBe('ACTIVATION_INVALID');
  });

  it('existing account with a password: activates and sets the session cookie without requiring setup fields', async () => {
    const tokenHash = hashAccessToken('raw-token-1');
    identity = fakeIdentity({
      tokens: [{ tokenHash, userId: 'user_1', expiresAt: new Date(Date.now() + 60_000), consumedAt: null, invalidatedAt: null }],
      passwordHash: 'already-set',
      email: 'existing@example.test',
    });
    subscriptionPeriods = fakeSubscriptionPeriods(['user_1']);

    const response = await postRequest({ token: 'raw-token-1' });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('acos_session=');
  });

  it('dormant account missing setup fields: 400 validation error, no session cookie', async () => {
    const tokenHash = hashAccessToken('raw-token-2');
    identity = fakeIdentity({
      tokens: [{ tokenHash, userId: 'user_2', expiresAt: new Date(Date.now() + 60_000), consumedAt: null, invalidatedAt: null }],
      passwordHash: null,
      email: 'dormant@example.test',
    });
    subscriptionPeriods = fakeSubscriptionPeriods(['user_2']);

    const response = await postRequest({ token: 'raw-token-2' });
    expect(response.status).toBe(400);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('dormant account with valid setup fields: 200, session cookie set', async () => {
    const tokenHash = hashAccessToken('raw-token-3');
    identity = fakeIdentity({
      tokens: [{ tokenHash, userId: 'user_3', expiresAt: new Date(Date.now() + 60_000), consumedAt: null, invalidatedAt: null }],
      passwordHash: null,
      email: 'dormant3@example.test',
    });
    subscriptionPeriods = fakeSubscriptionPeriods(['user_3']);

    const response = await postRequest({
      token: 'raw-token-3',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+911234567890',
      password: 'correct-horse-battery',
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('acos_session=');
  });

  it('an ineligible user (no active subscription) is rejected generically, even with a structurally valid token', async () => {
    const tokenHash = hashAccessToken('raw-token-4');
    identity = fakeIdentity({
      tokens: [{ tokenHash, userId: 'user_4', expiresAt: new Date(Date.now() + 60_000), consumedAt: null, invalidatedAt: null }],
      passwordHash: 'already-set',
    });
    subscriptionPeriods = fakeSubscriptionPeriods([]); // no active period for user_4

    const response = await postRequest({ token: 'raw-token-4' });
    expect(response.status).toBe(410);
  });
});
