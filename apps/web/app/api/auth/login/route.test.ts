import { hashPassword } from '@acos/core-identity';
import { describe, expect, it, vi } from 'vitest';

// Rate limiting (LOGIN_EMAIL_POLICY/LOGIN_IP_POLICY) selects the
// in-memory limiter under vitest's own NODE_ENV=test, but loadEnv()
// still validates the full env schema first — same placeholder set the
// existing claim-flow integration test already uses to satisfy it, none
// of it read by the login path itself.
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/placeholder';
process.env.RAZORPAY_KEY_ID ??= 'rzp_test_placeholder';
process.env.RAZORPAY_KEY_SECRET ??= 'rzp_secret_placeholder';
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'whsec_placeholder';
process.env.META_PIXEL_ID ??= '1234567890';
process.env.META_CAPI_ACCESS_TOKEN ??= 'meta_token_placeholder';
process.env.ANTHROPIC_API_KEY ??= 'sk-ant-placeholder-not-real';
process.env.DOWNLOAD_GRANT_SECRET ??= 'e'.repeat(48);
process.env.GOOGLE_PLACES_API_KEY ??= 'places-key-placeholder-not-real';

// Regression coverage alongside AUTH Phase 1a/1b: proves the existing,
// already-correct password login path is untouched by those changes —
// a password-authenticated account can still authenticate (security
// test A), and a dormant/password-less row (the shape AUTH-PO-25's
// checkout-time identity now produces) still cannot (security test B,
// here via the password path rather than the email-only one).

interface FakeUser {
  id: string;
  email: string;
  passwordHash: string | null;
}

function fakeIdentity(users: FakeUser[]) {
  return {
    async findCredentialsByEmail(email: string) {
      const normalised = email.trim().toLowerCase();
      const user = users.find((u) => u.email === normalised);
      if (!user) return null;
      return { id: user.id, email: user.email, passwordHash: user.passwordHash };
    },
    async saveSessionToken() {
      /* not asserted on here */
    },
  };
}

let identity: ReturnType<typeof fakeIdentity>;
vi.mock('../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity }),
}));

const { POST } = await import('./route');

function postRequest(body: unknown) {
  return POST(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('POST /api/auth/login (regression: unaffected by AUTH Phase 1a/1b)', () => {
  it('[security test A] a password-authenticated existing user can still authenticate', async () => {
    const passwordHash = await hashPassword('correct-horse-battery-staple');
    identity = fakeIdentity([{ id: 'user_real', email: 'buyer@example.test', passwordHash }]);
    const response = await postRequest({ email: 'buyer@example.test', password: 'correct-horse-battery-staple' });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('acos_session=');
  });

  it('[security test B] a dormant (password-less) users row cannot authenticate via the password path either', async () => {
    identity = fakeIdentity([{ id: 'user_dormant', email: 'dormant@example.test', passwordHash: null }]);
    const response = await postRequest({ email: 'dormant@example.test', password: 'anything-at-all' });
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('rejects the wrong password for an existing account with the same generic shape', async () => {
    const passwordHash = await hashPassword('correct-horse-battery-staple');
    identity = fakeIdentity([{ id: 'user_real', email: 'buyer@example.test', passwordHash }]);
    const response = await postRequest({ email: 'buyer@example.test', password: 'wrong-password' });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid email or password.', code: 'INVALID_CREDENTIALS' });
  });
});
