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

// AUTH Phase 2 — POST /api/auth/activation/request enumeration safety
// (design §5/§11, authorization invariants 21/22): this endpoint MUST
// return the identical response for an unknown email, a known-but-
// ineligible email, and a known-and-eligible email.

interface FakeUser {
  id: string;
  email: string;
}

function fakeIdentity(users: FakeUser[]) {
  return {
    async findUserByEmail(email: string) {
      const normalised = email.trim().toLowerCase();
      return users.find((u) => u.email === normalised) ?? null;
    },
    async saveActivationToken() {
      /* only reached for the eligible case */
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
    new Request('http://localhost/api/auth/activation/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('POST /api/auth/activation/request', () => {
  it('returns the identical response for an unknown email, a known-ineligible email, and a known-eligible email', async () => {
    identity = fakeIdentity([
      { id: 'user_ineligible', email: 'ineligible@example.test' },
      { id: 'user_eligible', email: 'eligible@example.test' },
    ]);
    subscriptionPeriods = fakeSubscriptionPeriods(['user_eligible']);

    const unknown = await postRequest({ email: 'ghost@example.test' });
    const ineligible = await postRequest({ email: 'ineligible@example.test' });
    const eligible = await postRequest({ email: 'eligible@example.test' });

    const [unknownBody, ineligibleBody, eligibleBody] = await Promise.all([
      unknown.json(),
      ineligible.json(),
      eligible.json(),
    ]);

    expect(unknown.status).toBe(ineligible.status);
    expect(ineligible.status).toBe(eligible.status);
    expect(unknownBody).toEqual(ineligibleBody);
    expect(ineligibleBody).toEqual(eligibleBody);
    expect(eligible.status).toBe(202);
  });

  it('rejects a malformed email at the validation layer (not an enumeration concern — this is a format check)', async () => {
    identity = fakeIdentity([]);
    subscriptionPeriods = fakeSubscriptionPeriods([]);
    const response = await postRequest({ email: 'not-an-email' });
    expect(response.status).toBe(400);
  });

  it('rejects a non-JSON body', async () => {
    identity = fakeIdentity([]);
    subscriptionPeriods = fakeSubscriptionPeriods([]);
    const response = await POST(
      new Request('http://localhost/api/auth/activation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      }) as never,
    );
    expect(response.status).toBe(400);
  });
});
