import { describe, expect, it, vi } from 'vitest';

// AUTH-PO-11 remediation: POST /api/auth/session must never mint a
// session from an email alone, for any account shape — passworded,
// dormant/password-less, or unknown. The route no longer looks up an
// identity at all, so these tests prove that directly (no mock identity
// state ends up written to) rather than by probing specific emails.

interface FakeUser {
  id: string;
  email: string;
  passwordHash: string | null;
}

function fakeIdentity(users: FakeUser[]) {
  const sessions: Record<string, { userId: string; expiresAt: Date; revokedAt: Date | null }> = {};
  return {
    sessions,
    async findCredentialsByEmail(email: string) {
      const normalised = email.trim().toLowerCase();
      const user = users.find((u) => u.email === normalised);
      if (!user) return null;
      return { id: user.id, email: user.email, passwordHash: user.passwordHash };
    },
    async saveSessionToken({
      tokenHash,
      userId,
      expiresAt,
    }: {
      tokenHash: string;
      userId: string;
      expiresAt: Date;
    }) {
      sessions[tokenHash] = { userId, expiresAt, revokedAt: null };
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
  };
}

let identity: ReturnType<typeof fakeIdentity>;
vi.mock('../../../../src/server/clientFinderRepositories', () => ({
  clientFinderRepositories: () => ({ identity }),
}));

const { POST } = await import('./route');

function postRequest(_body: unknown) {
  return POST();
}

describe('POST /api/auth/session (AUTH-PO-11: removed)', () => {
  it('is disabled/rejected regardless of body shape', async () => {
    identity = fakeIdentity([]);
    const response = await postRequest({ email: 'whoever@example.test' });
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ code: 'GONE' });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('cannot mint a session for a passworded account by email alone', async () => {
    identity = fakeIdentity([{ id: 'user_real', email: 'buyer@example.test', passwordHash: 'already-hashed' }]);
    const response = await postRequest({ email: 'buyer@example.test' });
    expect(response.status).toBe(410);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(Object.keys(identity.sessions)).toHaveLength(0);
  });

  it('cannot mint a session for a dormant/password-less account by email alone', async () => {
    identity = fakeIdentity([{ id: 'user_dormant', email: 'dormant@example.test', passwordHash: null }]);
    const response = await postRequest({ email: 'dormant@example.test' });
    expect(response.status).toBe(410);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(Object.keys(identity.sessions)).toHaveLength(0);
  });

  it('cannot mint a session for an unknown email', async () => {
    identity = fakeIdentity([]);
    const response = await postRequest({ email: 'never-existed@example.test' });
    expect(response.status).toBe(410);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('cannot mint a session via a client-controlled users.id instead of email', async () => {
    identity = fakeIdentity([{ id: 'user_real', email: 'buyer@example.test', passwordHash: 'already-hashed' }]);
    const response = await postRequest({ userId: 'user_real', id: 'user_real' });
    expect(response.status).toBe(410);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(Object.keys(identity.sessions)).toHaveLength(0);
  });
});
