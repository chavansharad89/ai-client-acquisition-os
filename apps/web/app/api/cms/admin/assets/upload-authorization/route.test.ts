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

import { fakeAssetStorage, fakeCmsAdminRepository, fakeContentItemRepository, fakeUploadSessionRepository } from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';

// CMS-PO-010(R2) — POST /api/cms/admin/assets/upload-authorization
// HTTP-layer coverage. Domain-level validation (extension/MIME/size) is
// already covered by @acos/core-cms's assetValidation.test.ts and
// assetIngestionService.test.ts; this file covers only this route's own
// protocol rules: session resolution, CMS-admin authorization, and the
// SECURITY property that no content_items row is created here.

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
let storage: ReturnType<typeof fakeAssetStorage>;
let uploadSessions: ReturnType<typeof fakeUploadSessionRepository>;
let sessionToken: string | undefined;

vi.mock('../../../../../../src/server/commerceRepositories', () => ({
  commerceRepositories: () => ({ identity, cmsAdmins, contentItems, storage, uploadSessions }),
}));
vi.mock('../../../../../../src/server/session', () => ({
  readSessionToken: () => sessionToken,
}));

const { POST } = await import('./route');

function postRequest(body: unknown, cookie?: string) {
  sessionToken = cookie;
  return POST(
    new Request('http://localhost/api/cms/admin/assets/upload-authorization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

const VALID_BODY = {
  owningProductId: 'ai_income_99',
  extension: 'pdf',
  contentType: 'application/pdf',
  declaredBytes: 1024,
};

function freshDeps() {
  identity = fakeIdentityByToken({ 'tok-admin': 'user-admin', 'tok-customer': 'user-customer' });
  cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
  contentItems = fakeContentItemRepository();
  storage = fakeAssetStorage();
  uploadSessions = fakeUploadSessionRepository();
}

describe('POST /api/cms/admin/assets/upload-authorization', () => {
  it('a CMS admin gets a storage key + presigned upload URL', async () => {
    freshDeps();
    const response = await postRequest(VALID_BODY, 'tok-admin');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { uploadSessionId: string; storageKey: string; uploadUrl: string; expiresAt: string };
    expect(body.storageKey).toMatch(/^cms\/ai_income_99\/assets\/[^/.]+\.pdf$/);
    expect(body.uploadUrl).toContain(encodeURIComponent(body.storageKey));
    expect(typeof body.uploadSessionId).toBe('string');
    expect(typeof body.expiresAt).toBe('string');

    // CMS-PO-010(R2)-G: the route persists an upload-session row, not
    // merely returning a server-generated id/key.
    const session = await uploadSessions.findByStorageKey(body.storageKey);
    expect(session?.id).toBe(body.uploadSessionId);
  });

  it('401s with no session cookie', async () => {
    freshDeps();
    const response = await postRequest(VALID_BODY);
    expect(response.status).toBe(401);
  });

  it('403s for an authenticated user who is not a CMS admin', async () => {
    freshDeps();
    const response = await postRequest(VALID_BODY, 'tok-customer');
    expect(response.status).toBe(403);
  });

  it('400s an invalid asset candidate (unsupported extension) without ever reaching storage', async () => {
    freshDeps();
    const createSpy = vi.spyOn(storage, 'createUploadAuthorization');
    const response = await postRequest({ ...VALID_BODY, extension: 'exe', contentType: 'application/octet-stream' }, 'tok-admin');
    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; field: string };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.field).toBe('extension');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('400s a declared size over the 500MB ceiling', async () => {
    freshDeps();
    const response = await postRequest({ ...VALID_BODY, declaredBytes: 500 * 1024 * 1024 + 1 }, 'tok-admin');
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string };
    expect(body.field).toBe('bytes');
  });

  it('400s a product that is not CMS-eligible', async () => {
    freshDeps();
    const response = await postRequest({ ...VALID_BODY, owningProductId: 'not-a-real-product' }, 'tok-admin');
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string };
    expect(body.field).toBe('owningProductId');
  });

  it('SECURITY: creates no content_items row — the row only appears after upload completion', async () => {
    freshDeps();
    await postRequest(VALID_BODY, 'tok-admin');
    await postRequest(VALID_BODY, 'tok-admin');

    const rootsAfter = await contentItems.findRootsByOwningProduct('ai_income_99');
    expect(rootsAfter).toHaveLength(0);
  });

  it('SECURITY: the client cannot choose the storage key — it is always server-generated per request, under cms/<product>/assets/', async () => {
    freshDeps();
    const first = (await (await postRequest(VALID_BODY, 'tok-admin')).json()) as { storageKey: string };
    const second = (await (await postRequest(VALID_BODY, 'tok-admin')).json()) as { storageKey: string };
    expect(first.storageKey).not.toBe(second.storageKey);
    expect(first.storageKey).toMatch(/^cms\/ai_income_99\/assets\//);
  });
});
