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

import { createContainer, fakeCmsAdminRepository, fakeContentItemRepository } from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';

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
let contentItems: ReturnType<typeof fakeContentItemRepository>;
let sessionToken: string | undefined;

vi.mock('../../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, cmsAdmins, contentItems }),
}));
vi.mock('../../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET, POST } = await import('./route');

function getRequest(id: string, cookie?: string) {
  sessionToken = cookie;
  return GET(new Request(`http://localhost/api/cms/admin/content/${id}`) as never, { params: { id } });
}

function postRequest(id: string, body: unknown, cookie?: string) {
  sessionToken = cookie;
  return POST(
    new Request(`http://localhost/api/cms/admin/content/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: { id } },
  );
}

describe('GET /api/cms/admin/content/[id]', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();

    expect((await getRequest('whatever')).status).toBe(401);
  });

  it('403s for a non-admin', async () => {
    identity = fakeIdentityByToken({ 'tok-customer': 'user-customer' });
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();

    expect((await getRequest('whatever', 'tok-customer')).status).toBe(403);
  });

  it('admin can retrieve a DRAFT item (unlike the customer API)', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    const draft = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Draft' });

    const response = await getRequest(draft.id, 'tok-admin');
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe('DRAFT');
  });

  it('404s for a nonexistent id', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();

    expect((await getRequest('nope', 'tok-admin')).status).toBe(404);
  });
});

describe('POST /api/cms/admin/content/[id] (update metadata)', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();

    expect((await postRequest('whatever', { title: 'X' })).status).toBe(401);
  });

  it('403s for a non-admin', async () => {
    identity = fakeIdentityByToken({ 'tok-customer': 'user-customer' });
    cmsAdmins = fakeCmsAdminRepository();
    contentItems = fakeContentItemRepository();

    expect((await postRequest('whatever', { title: 'X' }, 'tok-customer')).status).toBe(403);
  });

  it('admin can update title and orderIndex', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    const item = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Old title' });

    const response = await postRequest(item.id, { title: 'New title', orderIndex: 5 }, 'tok-admin');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.title).toBe('New title');
    expect(body.orderIndex).toBe(5);
  });

  it('404s for a nonexistent id', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();

    expect((await postRequest('nope', { title: 'X' }, 'tok-admin')).status).toBe(404);
  });

  it('rejects a blank title', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    contentItems = fakeContentItemRepository();
    const item = await createContainer({ contentItems }, { owningProductId: 'ai_income_99', parentId: null, title: 'Original' });

    const response = await postRequest(item.id, { title: '   ' }, 'tok-admin');
    expect(response.status).toBe(400);
  });
});
