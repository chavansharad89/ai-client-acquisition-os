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

import {
  buildAssetStorageKey,
  createAsset,
  fakeAssetStorage,
  fakeCmsAdminRepository,
  fakeContentItemRepository,
  fakeUploadSessionRepository,
} from '@acos/core-cms';
import { hashAccessToken } from '@acos/core-entitlements';

// CMS-PO-010(R2) — POST /api/cms/admin/assets/complete HTTP-layer
// coverage. Domain-level validation/replacement logic is already
// covered by @acos/core-cms's assetIngestionService.test.ts; this file
// covers only this route's own protocol rules: session resolution,
// CMS-admin authorization, and the SECURITY property that the server
// (never the client) decides what size/MIME/storage-key an upload is
// actually treated as.

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
    new Request('http://localhost/api/cms/admin/assets/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
  );
}

function freshDeps() {
  identity = fakeIdentityByToken({ 'tok-admin': 'user-admin', 'tok-customer': 'user-customer' });
  cmsAdmins = fakeCmsAdminRepository([{ userId: 'user-admin', createdAt: new Date(), createdBy: 'operator-1' }]);
  contentItems = fakeContentItemRepository();
  storage = fakeAssetStorage();
  uploadSessions = fakeUploadSessionRepository();
}

describe('POST /api/cms/admin/assets/complete — new asset', () => {
  it('creates a DRAFT after the object actually exists in storage, and never returns storageKey', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-1', 'pdf');
    storage.simulateUpload(key, { bytes: 2048, contentType: 'application/pdf' });
    await uploadSessions.create({ id: 'session-1', storageKey: key, owningProductId: 'ai_income_99' });

    const response = await postRequest(
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Worksheet' },
      'tok-admin',
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe('DRAFT');
    expect(body.bytes).toBe('2048');
    expect(body).not.toHaveProperty('storageKey');

    // CMS-PO-010(R2)-G: a successful completion consumes its matching
    // upload-session row through this route too.
    expect(await uploadSessions.findByStorageKey(key)).toBeNull();
    expect(body).not.toHaveProperty('previousStorageKey');
  });

  it('SECURITY: trusts storage.headObject()\'s ACTUAL size/contentType, never any client-declared bytes/contentType in the body', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-2', 'pdf');
    storage.simulateUpload(key, { bytes: 4096, contentType: 'application/pdf' });

    const response = await postRequest(
      {
        storageKey: key,
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Worksheet',
        // A malicious/buggy client declaring values that disagree with
        // the real object — these fields are not even read by the route.
        bytes: 1,
        contentType: 'text/plain',
      },
      'tok-admin',
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.bytes).toBe('4096');
    expect(body.assetKind).toBe('pdf');
  });

  it('400s an object over the 500MB ceiling', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-3', 'pdf');
    storage.simulateUpload(key, { bytes: 500 * 1024 * 1024 + 1, contentType: 'application/pdf' });

    const response = await postRequest(
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Worksheet' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string };
    expect(body.field).toBe('bytes');
  });

  it('400s when the actual provider contentType does not match the key\'s extension', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-4', 'pdf');
    storage.simulateUpload(key, { bytes: 1024, contentType: 'image/png' });

    const response = await postRequest(
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Worksheet' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { field: string; reason: string };
    expect(body.reason).toBe('mime-mismatch');
  });

  it('400s when no object was ever actually uploaded to the storage key', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-never-uploaded', 'pdf');

    const response = await postRequest(
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Worksheet' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { reason: string };
    expect(body.reason).toBe('object-not-found');
  });

  it('401s with no session cookie', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-5', 'pdf');
    storage.simulateUpload(key, { bytes: 1024, contentType: 'application/pdf' });

    const response = await postRequest({ storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'X' });
    expect(response.status).toBe(401);
  });

  it('403s for an authenticated user who is not a CMS admin', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_income_99', 'session-6', 'pdf');
    storage.simulateUpload(key, { bytes: 1024, contentType: 'application/pdf' });

    const response = await postRequest(
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'X' },
      'tok-customer',
    );
    expect(response.status).toBe(403);
  });

  it('SECURITY: a free-form, non-server-shaped storage key is rejected outright', async () => {
    freshDeps();
    const response = await postRequest(
      { storageKey: 'anything-the-client-feels-like', owningProductId: 'ai_income_99', parentId: null, title: 'X' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { reason: string };
    expect(body.reason).toBe('invalid-storage-key');
  });

  it('SECURITY: a storage key for a different product than claimed is rejected, even if a real object sits there', async () => {
    freshDeps();
    const key = buildAssetStorageKey('ai_freelancing_499', 'session-7', 'pdf');
    storage.simulateUpload(key, { bytes: 1024, contentType: 'application/pdf' });

    const response = await postRequest(
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'X' },
      'tok-admin',
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { reason: string };
    expect(body.reason).toBe('invalid-storage-key');
  });
});

describe('POST /api/cms/admin/assets/complete — replacement', () => {
  it('creates a linked pending DRAFT replacement, and replacing it again updates the same pending row', async () => {
    freshDeps();
    const published = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Original',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'original', 'pdf'),
        bytes: '1000',
      },
    );
    await contentItems.setStatus(published.id, 'PUBLISHED');

    const firstKey = buildAssetStorageKey('ai_income_99', 'replacement-1', 'pdf');
    storage.simulateUpload(firstKey, { bytes: 2000, contentType: 'application/pdf' });
    const firstResponse = await postRequest(
      { storageKey: firstKey, replacesContentItemId: published.id },
      'tok-admin',
    );
    expect(firstResponse.status).toBe(200);
    const firstBody = (await firstResponse.json()) as { id: string; status: string; replacesContentItemId: string; bytes: string };
    expect(firstBody.status).toBe('DRAFT');
    expect(firstBody.replacesContentItemId).toBe(published.id);
    expect(firstBody.bytes).toBe('2000');

    const secondKey = buildAssetStorageKey('ai_income_99', 'replacement-2', 'pdf');
    storage.simulateUpload(secondKey, { bytes: 3000, contentType: 'application/pdf' });
    const secondResponse = await postRequest(
      { storageKey: secondKey, replacesContentItemId: published.id },
      'tok-admin',
    );
    expect(secondResponse.status).toBe(200);
    const secondBody = (await secondResponse.json()) as { id: string; bytes: string };

    // Same pending-replacement row updated in place (CMS-PO-010(R2)
    // Secondary Decision 8), not a second row.
    expect(secondBody.id).toBe(firstBody.id);
    expect(secondBody.bytes).toBe('3000');
    const pending = await contentItems.findPendingReplacement(published.id);
    expect(pending?.id).toBe(firstBody.id);
  });

  it('does not publish the replacement — the original asset stays PUBLISHED and unchanged', async () => {
    freshDeps();
    const published = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Original',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'original-2', 'pdf'),
        bytes: '1000',
      },
    );
    await contentItems.setStatus(published.id, 'PUBLISHED');

    const key = buildAssetStorageKey('ai_income_99', 'replacement-3', 'pdf');
    storage.simulateUpload(key, { bytes: 2000, contentType: 'application/pdf' });
    await postRequest({ storageKey: key, replacesContentItemId: published.id }, 'tok-admin');

    const stillPublished = await contentItems.findById(published.id);
    expect(stillPublished?.status).toBe('PUBLISHED');
    expect(stillPublished?.bytes).toBe('1000');
  });
});
