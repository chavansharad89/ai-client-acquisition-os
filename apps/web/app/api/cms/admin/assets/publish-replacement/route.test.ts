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

import { fakeCmsAdminRepository } from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';

// CMS-PO-010(R2) — POST /api/cms/admin/assets/publish-replacement
// HTTP-layer coverage. This route's actual business logic
// (publishReplacement/publishReplacementTransaction) does raw SQL
// against a pinned connection with FOR UPDATE row locks — it is already
// covered against real Postgres by
// packages/core-cms/src/contentReplacementTransaction.ts's own
// integration tests AND by
// tests/integration/cms-publish-replacement-route.integration.test.ts
// (the real route, end to end, which also proves success/wrong-pending/
// stale-replay/concurrent-publish behavior). This file covers only what
// a real database is never needed for: authentication, CMS-admin
// authorization, request-body validation, and that an unexpected
// database failure maps to a generic response without leaking anything
// internal — exactly the same split complete/route.test.ts and
// upload-authorization/route.test.ts already use for this route's two
// sibling routes.

const DAY_MS = 24 * 60 * 60 * 1000;

function fakeIdentityByToken(tokenToUserId: Record<string, string>) {
  const byHash = new Map(Object.entries(tokenToUserId).map(([token, userId]) => [hashAccessToken(token), userId]));
  return {
    async findSessionToken(tokenHash: string) {
      const userId = byHash.get(tokenHash);
      if (!userId) return null;
      return { userId, expiresAt: new Date(Date.now() + DAY_MS), revokedAt: null };
    },
  };
}

let identity: ReturnType<typeof fakeIdentityByToken>;
let cmsAdmins: ReturnType<typeof fakeCmsAdminRepository>;
let pool: { query: () => Promise<never>; connect: () => Promise<never> };
let sessionToken: string | undefined;

vi.mock('../../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, cmsAdmins, pool }),
}));
vi.mock('../../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { POST } = await import('./route');

function postRequest(body: unknown, cookie?: string) {
  sessionToken = cookie;
  return POST(
    new Request('http://localhost/api/cms/admin/assets/publish-replacement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

function freshDeps() {
  identity = fakeIdentityByToken({ 'tok-admin': 'user-admin', 'tok-customer': 'user-customer' });
  cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
  // A pool that fails loudly the moment anything tries to use it --
  // every test below either never reaches publishReplacement() at all
  // (auth/validation short-circuits first) or explicitly exercises the
  // "unexpected database error" path, so a real connection is never
  // needed and never attempted.
  pool = {
    query: async () => {
      throw new Error('pool.query should never be called by a test that does not expect it');
    },
    connect: async () => {
      throw new Error('ECONNREFUSED 10.0.0.5:5432 user=acos_prod password=S3cr3tDbPass!');
    },
  };
}

describe('POST /api/cms/admin/assets/publish-replacement', () => {
  it('401s with no session cookie', async () => {
    freshDeps();
    const response = await postRequest({ contentItemId: 'live-1', expectedPendingReplacementId: 'pending-1' });
    expect(response.status).toBe(401);
  });

  it('403s for an authenticated user who is not a CMS admin', async () => {
    freshDeps();
    const response = await postRequest(
      { contentItemId: 'live-1', expectedPendingReplacementId: 'pending-1' },
      'tok-customer',
    );
    expect(response.status).toBe(403);
  });

  it('400s on a non-JSON body', async () => {
    freshDeps();
    sessionToken = 'tok-admin';
    const response = await POST(
      new Request('http://localhost/api/cms/admin/assets/publish-replacement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      }) as never,
    );
    expect(response.status).toBe(400);
    const responseBody = (await response.json()) as { code: string };
    expect(responseBody.code).toBe('VALIDATION_ERROR');
  });

  it('400s when contentItemId is missing', async () => {
    freshDeps();
    const response = await postRequest({ expectedPendingReplacementId: 'pending-1' }, 'tok-admin');
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string };
    expect(body.field).toBe('contentItemId');
  });

  it('400s when expectedPendingReplacementId is missing', async () => {
    freshDeps();
    const response = await postRequest({ contentItemId: 'live-1' }, 'tok-admin');
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string };
    expect(body.field).toBe('expectedPendingReplacementId');
  });

  it('400s when contentItemId is not a string', async () => {
    freshDeps();
    const response = await postRequest(
      { contentItemId: 42, expectedPendingReplacementId: 'pending-1' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string };
    expect(body.field).toBe('contentItemId');
  });

  it('SECURITY: an unexpected database failure maps to a generic 500 with no connection string/credential leaked', async () => {
    freshDeps();
    const response = await postRequest(
      { contentItemId: 'live-1', expectedPendingReplacementId: 'pending-1' },
      'tok-admin',
    );
    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.code).toBe('UNKNOWN_ERROR');
    expect(body.error).toBe('Internal error');
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/S3cr3tDbPass/);
    expect(serialized).not.toMatch(/ECONNREFUSED/);
    expect(serialized).not.toMatch(/acos_prod/);
  });

  it('never reaches the database for any rejected (unauthenticated/forbidden/invalid-body) request', async () => {
    freshDeps();
    // If any of these had called pool.connect()/pool.query(), the fake
    // pool above would have thrown a DIFFERENT error than the one each
    // assertion expects, failing the test -- this is what actually
    // proves authorization/validation runs strictly before publishReplacement().
    await expect(postRequest({ contentItemId: 'x', expectedPendingReplacementId: 'y' })).resolves.toMatchObject({
      status: 401,
    });
    await expect(
      postRequest({ contentItemId: 'x', expectedPendingReplacementId: 'y' }, 'tok-customer'),
    ).resolves.toMatchObject({ status: 403 });
    await expect(postRequest({ expectedPendingReplacementId: 'y' }, 'tok-admin')).resolves.toMatchObject({
      status: 400,
    });
  });
});
