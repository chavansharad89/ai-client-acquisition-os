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

import { PRODUCT_CATALOG } from '@acos/catalog';
import { fakeCmsAdminRepository, fakePlanDisplayNameRepository } from '@acos/core-cms';
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
let planDisplayNames: ReturnType<typeof fakePlanDisplayNameRepository>;
let sessionToken: string | undefined;

vi.mock('../../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, cmsAdmins, planDisplayNames }),
}));
vi.mock('../../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { GET, POST } = await import('./route');

function getRequest(productId: string, cookie?: string) {
  sessionToken = cookie;
  return GET(new Request(`http://localhost/api/cms/admin/display-names/${productId}`) as never, {
    params: { productId },
  });
}

function postRequest(productId: string, body: unknown, cookie?: string) {
  sessionToken = cookie;
  return POST(
    new Request(`http://localhost/api/cms/admin/display-names/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: { productId } },
  );
}

describe('GET /api/cms/admin/display-names/[productId]', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    cmsAdmins = fakeCmsAdminRepository();
    planDisplayNames = fakePlanDisplayNameRepository();

    expect((await getRequest('ai_income_99')).status).toBe(401);
  });

  it('403s for a non-admin', async () => {
    identity = fakeIdentityByToken({ 'tok-customer': 'user-customer' });
    cmsAdmins = fakeCmsAdminRepository();
    planDisplayNames = fakePlanDisplayNameRepository();

    expect((await getRequest('ai_income_99', 'tok-customer')).status).toBe(403);
  });

  it('admin can read the configured display name, falling back to the catalog default', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    planDisplayNames = fakePlanDisplayNameRepository();

    const response = await getRequest('ai_income_99', 'tok-admin');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.displayName).toBe(PRODUCT_CATALOG.ai_income_99.name);
    expect(body.override).toBeNull();
  });

  it('rejects a non-CMS-eligible productId', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    planDisplayNames = fakePlanDisplayNameRepository();

    const response = await getRequest('ai_client_acquisition_1499', 'tok-admin');
    expect(response.status).toBe(400);
  });
});

describe('POST /api/cms/admin/display-names/[productId]', () => {
  it('401s with no session cookie', async () => {
    identity = fakeIdentityByToken({});
    cmsAdmins = fakeCmsAdminRepository();
    planDisplayNames = fakePlanDisplayNameRepository();

    expect((await postRequest('ai_income_99', { displayName: 'Plus' })).status).toBe(401);
  });

  it('403s for a non-admin', async () => {
    identity = fakeIdentityByToken({ 'tok-customer': 'user-customer' });
    cmsAdmins = fakeCmsAdminRepository();
    planDisplayNames = fakePlanDisplayNameRepository();

    expect((await postRequest('ai_income_99', { displayName: 'Plus' }, 'tok-customer')).status).toBe(403);
  });

  it('admin can update the display name, and updatedBy is the admin\'s own server-resolved userId -- never the request body', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    planDisplayNames = fakePlanDisplayNameRepository();

    // A client-supplied updatedBy is not even a field this route reads
    // from the body -- supplying one here proves it has no effect.
    const response = await postRequest(
      'ai_income_99',
      { displayName: 'Plus', updatedBy: 'attacker-controlled-value' },
      'tok-admin',
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.displayName).toBe('Plus');
    expect(body.updatedBy).toBe('user-admin');
  });

  it('rejects a blank display name', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    planDisplayNames = fakePlanDisplayNameRepository();

    const response = await postRequest('ai_income_99', { displayName: '   ' }, 'tok-admin');
    expect(response.status).toBe(400);
  });

  it('rejects a non-CMS-eligible productId', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    planDisplayNames = fakePlanDisplayNameRepository();

    const response = await postRequest('ai_client_acquisition_1499', { displayName: 'Max' }, 'tok-admin');
    expect(response.status).toBe(400);
  });

  it('ProductId/SKU identity is never changed through this API -- the stored productId always matches the URL param', async () => {
    identity = fakeIdentityByToken({ 'tok-admin': 'user-admin' });
    cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
    planDisplayNames = fakePlanDisplayNameRepository();

    const response = await postRequest(
      'ai_income_99',
      // Even if a caller tries to smuggle a different productId in the
      // body, there is no code path that reads it -- only displayName is read.
      { displayName: 'Plus', productId: 'ai_freelancing_499' },
      'tok-admin',
    );
    const body = await response.json();
    expect(body.productId).toBe('ai_income_99');
    expect(PRODUCT_CATALOG.ai_income_99.id).toBe('ai_income_99');
  });
});
