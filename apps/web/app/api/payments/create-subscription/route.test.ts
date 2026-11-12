import { describe, expect, it, vi } from 'vitest';

// AUTH Phase 1b security regression coverage for the ₹1,499 purchase-
// first checkout path. Verifies the server — never the browser —
// establishes the owning identity before any Razorpay call, per
// AUTH-PO-25: no session is required, a client-supplied userId is never
// honored, and an existing account (with or without a password) is
// reused rather than duplicated.

const PLAN_ID = 'plan_fake_client_finder';

vi.mock('@acos/config', () => ({
  loadEnv: () => ({
    RAZORPAY_KEY_ID: 'rzp_test_fake_key_id',
    RAZORPAY_KEY_SECRET: 'fake_secret',
    RAZORPAY_SUBSCRIPTION_PLAN_ID: PLAN_ID,
  }),
}));

const razorpayCalls: unknown[] = [];
vi.mock('@acos/core-payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@acos/core-payments')>();
  return {
    ...actual,
    createRazorpaySubscriptionsClient: () => ({
      createSubscription: vi.fn(async (params: unknown) => {
        razorpayCalls.push(params);
        return {
          razorpaySubscriptionId: `sub_fake_${razorpayCalls.length}`,
          status: 'created',
          shortUrl: 'https://rzp.io/i/fake',
        };
      }),
    }),
  };
});

// Minimal in-memory stand-in for the one IdentityRepository method this
// route actually calls (findOrCreateUser), plus the lookups these tests
// use to assert on the row it left behind. Mirrors
// @acos/core-identity's own internal fakeRepository (testSupport.ts)
// in spirit — not imported directly since that fixture is private to
// that package, with no public subpath export.
interface FakeUser {
  id: string;
  email: string;
  createdAt: Date;
  passwordHash: string | null;
}

function fakeIdentity() {
  const users: FakeUser[] = [];
  let counter = 0;
  return {
    users,
    async createUser(
      { email, passwordHash }: { email: string; passwordHash?: string },
      now: Date,
    ): Promise<FakeUser> {
      const normalised = email.trim().toLowerCase();
      counter += 1;
      const created: FakeUser = {
        id: `user_${counter}`,
        email: normalised,
        createdAt: now,
        passwordHash: passwordHash ?? null,
      };
      users.push(created);
      return created;
    },
    async findOrCreateUser(email: string, now: Date): Promise<FakeUser> {
      const normalised = email.trim().toLowerCase();
      const existing = users.find((u) => u.email === normalised);
      if (existing) return existing;
      counter += 1;
      const created: FakeUser = { id: `user_${counter}`, email: normalised, createdAt: now, passwordHash: null };
      users.push(created);
      return created;
    },
    async findUserByEmail(email: string): Promise<FakeUser | null> {
      const normalised = email.trim().toLowerCase();
      return users.find((u) => u.email === normalised) ?? null;
    },
  };
}

let identity: ReturnType<typeof fakeIdentity>;
vi.mock('../../../../src/server/clientFinderRepositories', () => ({
  clientFinderRepositories: () => ({ identity }),
}));

const { POST } = await import('./route');

function postRequest(body: unknown) {
  return POST(
    new Request('http://localhost/api/payments/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('POST /api/payments/create-subscription (purchase-first, AUTH Phase 1b)', () => {
  it('requires no session — succeeds for a brand-new email with no users row', async () => {
    identity = fakeIdentity();
    const response = await postRequest({ customerEmail: 'new-buyer@example.test' });
    expect(response.status).toBe(201);
    expect(identity.users).toHaveLength(1);
    expect(identity.users[0]!.email).toBe('new-buyer@example.test');
  });

  it('creates a dormant (password-less) users row for a new purchaser', async () => {
    identity = fakeIdentity();
    await postRequest({ customerEmail: 'dormant@example.test' });
    expect(identity.users[0]!.passwordHash).toBeNull();
  });

  it('embeds the server-resolved userId in the Razorpay notes for an ordinary request', async () => {
    identity = fakeIdentity();
    razorpayCalls.length = 0;
    await postRequest({ customerEmail: 'attributed@example.test' });
    const createdUser = await identity.findUserByEmail('attributed@example.test');
    expect(razorpayCalls).toHaveLength(1);
    expect(razorpayCalls[0]).toMatchObject({ notes: { userId: createdUser!.id } });
  });

  it('[security test C] rejects a request carrying a client-supplied userId outright — never honors it', async () => {
    identity = fakeIdentity();
    razorpayCalls.length = 0;
    const response = await postRequest({
      customerEmail: 'attributed@example.test',
      userId: 'user_attacker_chosen',
    });
    // .strict() treats the extra field as a malformed/suspicious
    // request (same defense-in-depth posture create-order's schema
    // already documents) rather than silently ignoring it — so no
    // identity is resolved and no Razorpay call is made at all.
    expect(response.status).toBe(400);
    expect(razorpayCalls).toHaveLength(0);
    expect(identity.users).toHaveLength(0);
  });

  it('reuses an existing users row for the same email rather than creating a duplicate', async () => {
    identity = fakeIdentity();
    const existing = await identity.createUser({ email: 'returning@example.test' }, new Date());
    razorpayCalls.length = 0;
    await postRequest({ customerEmail: 'returning@example.test' });
    expect(identity.users).toHaveLength(1);
    expect(razorpayCalls[0]).toMatchObject({ notes: { userId: existing.id } });
  });

  it('never overwrites an existing password_hash for a returning, already-activated purchaser', async () => {
    identity = fakeIdentity();
    const existing = await identity.createUser(
      { email: 'has-password@example.test', passwordHash: 'already-hashed' },
      new Date(),
    );
    await postRequest({ customerEmail: 'has-password@example.test' });
    expect(identity.users).toHaveLength(1);
    expect(identity.users[0]!.id).toBe(existing.id);
    expect(identity.users[0]!.passwordHash).toBe('already-hashed');
  });

  it('does not create a users row for a malformed email, rejecting before identity resolution', async () => {
    identity = fakeIdentity();
    const response = await postRequest({ customerEmail: 'not-an-email' });
    expect(response.status).toBe(400);
    expect(identity.users).toHaveLength(0);
  });

  it('normalizes email casing/whitespace to the same canonical identity', async () => {
    identity = fakeIdentity();
    await postRequest({ customerEmail: 'Case@Example.test' });
    await postRequest({ customerEmail: '  case@example.test  ' });
    expect(identity.users).toHaveLength(1);
  });
});
