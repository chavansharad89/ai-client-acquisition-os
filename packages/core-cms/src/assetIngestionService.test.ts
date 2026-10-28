import { describe, expect, it } from 'vitest';

import { completeAssetUpload, requestAssetUploadAuthorization } from './assetIngestionService';
import { fakeAssetStorage } from './testing/fakeAssetStorage';
import { fakeContentItemRepository } from './testing/fakeContentItemRepository';
import { fakeUploadSessionRepository } from './testing/fakeUploadSessionRepository';
import type { ContentItem } from './types';

function liveAsset(overrides: Partial<ContentItem> = {}): ContentItem {
  const now = new Date();
  return {
    id: 'live-asset-1',
    owningProductId: 'ai_income_99',
    parentId: null,
    nodeType: 'ASSET',
    assetKind: 'pdf',
    title: 'Published Lesson',
    description: null,
    storageKey: 'cms/ai_income_99/assets/live-asset-1.pdf',
    bytes: '1000',
    orderIndex: 0,
    status: 'PUBLISHED',
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    replacesContentItemId: null,
    previousStorageKey: null,
    previousStorageRetentionUntil: null,
    ...overrides,
  };
}

describe('requestAssetUploadAuthorization', () => {
  it('rejects a non-CMS-eligible ProductId', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    await expect(
      requestAssetUploadAuthorization(
        { storage, uploadSessions },
        { owningProductId: 'ai_client_acquisition_1499', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
      ),
    ).rejects.toThrow(/not a CMS-eligible product/);
  });

  it('generates a system storage key using the stable ProductId, never a display name', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const auth = await requestAssetUploadAuthorization(
      { storage, uploadSessions },
      { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
    );
    expect(auth.storageKey).toBe(`cms/ai_income_99/assets/${auth.uploadSessionId}.pdf`);
  });

  it('ignores any caller-supplied storageKey -- the key is always generated, never accepted as input', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const auth = await requestAssetUploadAuthorization(
      { storage, uploadSessions },
      {
        owningProductId: 'ai_income_99',
        extension: 'pdf',
        contentType: 'application/pdf',
        declaredBytes: 10,
        // @ts-expect-error -- deliberately smuggling a field the input type does not declare
        storageKey: 'cms/ai_income_99/assets/attacker-chosen-key.pdf',
      },
    );
    expect(auth.storageKey).not.toContain('attacker-chosen-key');
    expect(auth.storageKey).toBe(`cms/ai_income_99/assets/${auth.uploadSessionId}.pdf`);
  });

  it('never creates a content_items row -- the function has no dependency capable of it', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    // Deliberately no `contentItems` in deps: this is not merely an
    // assertion, it is structurally impossible for this call to write a
    // row, since nothing here could even reach a ContentItemRepository.
    const auth = await requestAssetUploadAuthorization(
      { storage, uploadSessions },
      { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
    );
    expect(auth.uploadSessionId).toBeTruthy();
  });

  it('returns the upload authorization produced by the storage abstraction', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const auth = await requestAssetUploadAuthorization(
      { storage, uploadSessions },
      { owningProductId: 'ai_income_99', extension: 'mp4', contentType: 'video/mp4', declaredBytes: 10 },
    );
    expect(auth.uploadUrl).toContain('fake-storage.test/upload/');
    expect(auth.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects a declared size over 500MB before ever asking storage for authorization', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    await expect(
      requestAssetUploadAuthorization(
        { storage, uploadSessions },
        { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 500 * 1024 * 1024 + 1 },
      ),
    ).rejects.toThrow(/exceeds/);
  });
});

describe('requestAssetUploadAuthorization -- upload-session persistence (CMS-PO-010(R2)-G)', () => {
  it('1/2/3/4. persists a session row whose id/storageKey/owningProductId exactly match the returned authorization', async () => {
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();

    const auth = await requestAssetUploadAuthorization(
      { storage, uploadSessions },
      { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
    );

    const session = await uploadSessions.findByStorageKey(auth.storageKey);
    expect(session).not.toBeNull();
    expect(session?.id).toBe(auth.uploadSessionId);
    expect(session?.storageKey).toBe(auth.storageKey);
    expect(session?.owningProductId).toBe('ai_income_99');
  });

  it('a DB persistence failure propagates and never calls storage, so no usable authorization is ever returned', async () => {
    const storage = fakeAssetStorage();
    const failingUploadSessions = {
      ...fakeUploadSessionRepository(),
      create: async () => {
        throw new Error('DB unavailable');
      },
    };
    const createSpy = { called: false };
    const spiedStorage = {
      ...storage,
      createUploadAuthorization: async (...args: Parameters<typeof storage.createUploadAuthorization>) => {
        createSpy.called = true;
        return storage.createUploadAuthorization(...args);
      },
    };

    await expect(
      requestAssetUploadAuthorization(
        { storage: spiedStorage, uploadSessions: failingUploadSessions },
        { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
      ),
    ).rejects.toThrow(/DB unavailable/);
    expect(createSpy.called).toBe(false); // R2 is never asked once persistence has already failed
  });

  it('5. an R2 authorization failure deletes the just-created session row, and still propagates the original error', async () => {
    const uploadSessions = fakeUploadSessionRepository();
    const failingStorage = {
      ...fakeAssetStorage(),
      createUploadAuthorization: async () => {
        throw new Error('R2 unreachable');
      },
    };

    await expect(
      requestAssetUploadAuthorization(
        { storage: failingStorage, uploadSessions },
        { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
      ),
    ).rejects.toThrow(/R2 unreachable/);

    // Nothing usable was returned, and no session row was left behind to
    // later look like a misleading "abandoned upload" for a key that was
    // never even handed to a client.
    const remaining = await uploadSessions.findOlderThan(new Date(Date.now() + 60_000), 10);
    expect(remaining).toEqual([]);
  });

  it('6. if the rollback delete ALSO fails, the error is logged (not thrown) and the original R2 error still propagates', async () => {
    const baseUploadSessions = fakeUploadSessionRepository();
    const uploadSessions = {
      ...baseUploadSessions,
      deleteById: async () => {
        throw new Error('rollback delete failed');
      },
    };
    const failingStorage = {
      ...fakeAssetStorage(),
      createUploadAuthorization: async () => {
        throw new Error('R2 unreachable');
      },
    };

    await expect(
      requestAssetUploadAuthorization(
        { storage: failingStorage, uploadSessions },
        { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 10 },
      ),
    ).rejects.toThrow(/R2 unreachable/); // the ORIGINAL error, not the rollback failure
  });
});

describe('completeAssetUpload -- new asset', () => {
  it('rejects completion when no object exists at the storage key', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    await expect(
      completeAssetUpload(
        { contentItems, storage },
        { storageKey: 'cms/ai_income_99/assets/missing.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'New' },
      ),
    ).rejects.toThrow(/no object exists/);
  });

  it('rejects the actual uploaded object when it exceeds 500MB, even if the declared size at authorization time was fine', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/big.pdf', { bytes: 500 * 1024 * 1024 + 1, contentType: 'application/pdf' });
    await expect(
      completeAssetUpload(
        { contentItems, storage },
        { storageKey: 'cms/ai_income_99/assets/big.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'Too Big' },
      ),
    ).rejects.toThrow(/exceeds/);
  });

  it('rejects when the actual content type is not a recognized MIME for any approved type', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/bad1.pdf', { bytes: 10, contentType: 'application/x-msdownload' });
    await expect(
      completeAssetUpload(
        { contentItems, storage },
        { storageKey: 'cms/ai_income_99/assets/bad1.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'Bad' },
      ),
    ).rejects.toThrow(/does not match extension/);
  });

  it('rejects when the actual content type does not match the extension in the key (mismatch, not merely unrecognized)', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/bad2.pdf', { bytes: 10, contentType: 'image/png' });
    await expect(
      completeAssetUpload(
        { contentItems, storage },
        { storageKey: 'cms/ai_income_99/assets/bad2.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'Bad' },
      ),
    ).rejects.toThrow(/does not match extension/);
  });

  it('creates a DRAFT ASSET with the generated storage key persisted, from a valid uploaded object', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/good.pdf', { bytes: 2048, contentType: 'application/pdf' });

    const created = await completeAssetUpload(
      { contentItems, storage },
      { storageKey: 'cms/ai_income_99/assets/good.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'Good Lesson' },
    );

    expect(created.nodeType).toBe('ASSET');
    expect(created.status).toBe('DRAFT'); // never automatically PUBLISHED or ARCHIVED -- the input type has no status field
    expect(created.storageKey).toBe('cms/ai_income_99/assets/good.pdf');
    expect(created.bytes).toBe('2048');
    expect(created.assetKind).toBe('pdf');
  });

  it('rejects a storage key whose product does not match the requested owningProductId', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_freelancing_499/assets/good.pdf', { bytes: 10, contentType: 'application/pdf' });
    await expect(
      completeAssetUpload(
        { contentItems, storage },
        { storageKey: 'cms/ai_freelancing_499/assets/good.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'Mismatched' },
      ),
    ).rejects.toThrow(/does not match the requested product/);
  });
});

describe('completeAssetUpload -- replacement (CMS-PO-010(R2) replace-in-place)', () => {
  it('a new replacement is linked via replacesContentItemId, and the published V1 remains unchanged while it is pending', async () => {
    const v1 = liveAsset();
    const contentItems = fakeContentItemRepository([v1]);
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v2.pdf', { bytes: 2000, contentType: 'application/pdf' });

    const v2 = await completeAssetUpload(
      { contentItems, storage },
      { storageKey: 'cms/ai_income_99/assets/v2.pdf', replacesContentItemId: v1.id },
    );

    expect(v2.replacesContentItemId).toBe(v1.id);
    expect(v2.status).toBe('DRAFT');

    const stillLive = await contentItems.findById(v1.id);
    expect(stillLive?.status).toBe('PUBLISHED');
    expect(stillLive?.storageKey).toBe(v1.storageKey); // unchanged during the pending state
  });

  it('a second replacement upload updates the existing pending DRAFT in place -- never a second pending row', async () => {
    const v1 = liveAsset();
    const contentItems = fakeContentItemRepository([v1]);
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v2.pdf', { bytes: 2000, contentType: 'application/pdf' });
    storage.simulateUpload('cms/ai_income_99/assets/v3.pdf', { bytes: 3000, contentType: 'application/pdf' });

    const v2 = await completeAssetUpload(
      { contentItems, storage },
      { storageKey: 'cms/ai_income_99/assets/v2.pdf', replacesContentItemId: v1.id },
    );
    const v3 = await completeAssetUpload(
      { contentItems, storage },
      { storageKey: 'cms/ai_income_99/assets/v3.pdf', replacesContentItemId: v1.id },
    );

    expect(v3.id).toBe(v2.id); // same pending row, updated in place
    expect(v3.storageKey).toBe('cms/ai_income_99/assets/v3.pdf');
    expect(v3.bytes).toBe('3000');

    const pending = await contentItems.findPendingReplacement(v1.id);
    expect(pending?.id).toBe(v2.id);

    const stillLive = await contentItems.findById(v1.id);
    expect(stillLive?.storageKey).toBe(v1.storageKey); // still unaffected
  });

  it('rejects replacing a target that does not exist', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v2.pdf', { bytes: 10, contentType: 'application/pdf' });
    await expect(
      completeAssetUpload({ contentItems, storage }, { storageKey: 'cms/ai_income_99/assets/v2.pdf', replacesContentItemId: 'does-not-exist' }),
    ).rejects.toThrow(/does not exist/);
  });

  it('rejects replacing a CONTAINER', async () => {
    const container = liveAsset({ id: 'container-1', nodeType: 'CONTAINER', assetKind: null, storageKey: null, bytes: null });
    const contentItems = fakeContentItemRepository([container]);
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v2.pdf', { bytes: 10, contentType: 'application/pdf' });
    await expect(
      completeAssetUpload({ contentItems, storage }, { storageKey: 'cms/ai_income_99/assets/v2.pdf', replacesContentItemId: container.id }),
    ).rejects.toThrow(/not an ASSET/);
  });

  it('rejects replacing a row that is itself a pending replacement', async () => {
    const v1 = liveAsset();
    const alreadyPendingReplacement = liveAsset({
      id: 'already-pending',
      status: 'DRAFT',
      replacesContentItemId: v1.id,
      storageKey: 'cms/ai_income_99/assets/already-pending.pdf',
    });
    const contentItems = fakeContentItemRepository([v1, alreadyPendingReplacement]);
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v3.pdf', { bytes: 10, contentType: 'application/pdf' });
    await expect(
      completeAssetUpload(
        { contentItems, storage },
        { storageKey: 'cms/ai_income_99/assets/v3.pdf', replacesContentItemId: alreadyPendingReplacement.id },
      ),
    ).rejects.toThrow(/itself a pending replacement/);
  });

  it('rejects a replacement whose actual uploaded object exceeds 500MB', async () => {
    const v1 = liveAsset();
    const contentItems = fakeContentItemRepository([v1]);
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v2.pdf', { bytes: 500 * 1024 * 1024 + 1, contentType: 'application/pdf' });
    await expect(
      completeAssetUpload({ contentItems, storage }, { storageKey: 'cms/ai_income_99/assets/v2.pdf', replacesContentItemId: v1.id }),
    ).rejects.toThrow(/exceeds/);
  });

  it('recovers from a concurrent-insert race by falling back to updating the winner\'s pending row', async () => {
    const v1 = liveAsset();
    const contentItems = fakeContentItemRepository([v1]);
    const storage = fakeAssetStorage();
    storage.simulateUpload('cms/ai_income_99/assets/v2.pdf', { bytes: 2000, contentType: 'application/pdf' });
    storage.simulateUpload('cms/ai_income_99/assets/v2-racer.pdf', { bytes: 2500, contentType: 'application/pdf' });

    // Simulate the race directly against the repository: another request
    // already won and created the pending row before this service call's
    // own createReplacementAsset attempt runs.
    const winner = await contentItems.createReplacementAsset({
      owningProductId: v1.owningProductId,
      parentId: v1.parentId,
      title: v1.title,
      assetKind: 'pdf',
      storageKey: 'cms/ai_income_99/assets/v2.pdf',
      bytes: '2000',
      replacesContentItemId: v1.id,
    });

    const result = await completeAssetUpload(
      { contentItems, storage },
      { storageKey: 'cms/ai_income_99/assets/v2-racer.pdf', replacesContentItemId: v1.id },
    );

    expect(result.id).toBe(winner.id); // same row, not a second one
    expect(result.storageKey).toBe('cms/ai_income_99/assets/v2-racer.pdf');

    const pending = await contentItems.findPendingReplacement(v1.id);
    expect(pending?.id).toBe(winner.id);
  });
});

describe('completeAssetUpload -- upload-session consumption (CMS-PO-010(R2)-G)', () => {
  it('7. a successful new-asset completion consumes (deletes) its matching session row', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const key = 'cms/ai_income_99/assets/consumed-new.pdf';
    storage.simulateUpload(key, { bytes: 2048, contentType: 'application/pdf' });
    await uploadSessions.create({ id: 'session-new-1', storageKey: key, owningProductId: 'ai_income_99' });

    await completeAssetUpload(
      { contentItems, storage, uploadSessions },
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Good Lesson' },
    );

    expect(await uploadSessions.findByStorageKey(key)).toBeNull();
  });

  it('8. a successful replacement completion consumes its matching session row too', async () => {
    const v1 = liveAsset();
    const contentItems = fakeContentItemRepository([v1]);
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const key = 'cms/ai_income_99/assets/consumed-replacement.pdf';
    storage.simulateUpload(key, { bytes: 2000, contentType: 'application/pdf' });
    await uploadSessions.create({ id: 'session-replacement-1', storageKey: key, owningProductId: 'ai_income_99' });

    await completeAssetUpload({ contentItems, storage, uploadSessions }, { storageKey: key, replacesContentItemId: v1.id });

    expect(await uploadSessions.findByStorageKey(key)).toBeNull();
  });

  it('9. a failed completion (e.g. mismatched MIME) leaves the session row untouched', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const key = 'cms/ai_income_99/assets/will-fail.pdf';
    storage.simulateUpload(key, { bytes: 10, contentType: 'image/png' }); // mismatched for a .pdf key
    await uploadSessions.create({ id: 'session-fail-1', storageKey: key, owningProductId: 'ai_income_99' });

    await expect(
      completeAssetUpload(
        { contentItems, storage, uploadSessions },
        { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Bad' },
      ),
    ).rejects.toThrow(/does not match extension/);

    expect(await uploadSessions.findByStorageKey(key)).not.toBeNull();
  });

  it('10. retrying after a failed completion succeeds and consumes the still-present session', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    const uploadSessions = fakeUploadSessionRepository();
    const key = 'cms/ai_income_99/assets/retry.pdf';
    await uploadSessions.create({ id: 'session-retry-1', storageKey: key, owningProductId: 'ai_income_99' });

    // First attempt: object not uploaded yet -- fails, session untouched.
    await expect(
      completeAssetUpload(
        { contentItems, storage, uploadSessions },
        { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Retry Lesson' },
      ),
    ).rejects.toThrow(/no object exists/);
    expect(await uploadSessions.findByStorageKey(key)).not.toBeNull();

    // The object actually finishes uploading, then the client retries
    // completion with the SAME session/storageKey.
    storage.simulateUpload(key, { bytes: 1024, contentType: 'application/pdf' });
    const created = await completeAssetUpload(
      { contentItems, storage, uploadSessions },
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Retry Lesson' },
    );

    expect(created.status).toBe('DRAFT');
    expect(await uploadSessions.findByStorageKey(key)).toBeNull();
  });

  it('11. a deleteById failure during consumption does not fail the completion -- the CMS row is still created/returned, and the failure is only logged', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    const key = 'cms/ai_income_99/assets/consume-fails.pdf';
    storage.simulateUpload(key, { bytes: 2048, contentType: 'application/pdf' });
    const uploadSessions = {
      ...fakeUploadSessionRepository(),
      deleteById: async () => {
        throw new Error('session delete failed');
      },
    };
    await uploadSessions.create({ id: 'session-consume-fail-1', storageKey: key, owningProductId: 'ai_income_99' });

    const created = await completeAssetUpload(
      { contentItems, storage, uploadSessions },
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Good Lesson' },
    );

    // The CMS write already succeeded -- completeAssetUpload must resolve
    // successfully (never reject) even though session consumption failed.
    expect(created.status).toBe('DRAFT');
    expect(created.storageKey).toBe(key);
    const stillThere = await contentItems.findById(created.id);
    expect(stillThere?.status).toBe('DRAFT'); // not rolled back
  });

  it('12. the same best-effort behavior applies to a replacement completion', async () => {
    const v1 = liveAsset();
    const contentItems = fakeContentItemRepository([v1]);
    const storage = fakeAssetStorage();
    const key = 'cms/ai_income_99/assets/consume-fails-replacement.pdf';
    storage.simulateUpload(key, { bytes: 2000, contentType: 'application/pdf' });
    const uploadSessions = {
      ...fakeUploadSessionRepository(),
      deleteById: async () => {
        throw new Error('session delete failed');
      },
    };
    await uploadSessions.create({ id: 'session-consume-fail-2', storageKey: key, owningProductId: 'ai_income_99' });

    const replacement = await completeAssetUpload(
      { contentItems, storage, uploadSessions },
      { storageKey: key, replacesContentItemId: v1.id },
    );

    expect(replacement.status).toBe('DRAFT');
    expect(replacement.replacesContentItemId).toBe(v1.id);
    const stillLive = await contentItems.findById(v1.id);
    expect(stillLive?.status).toBe('PUBLISHED'); // the target asset is unaffected either way
  });

  it('a completion with no uploadSessions dependency wired in behaves exactly as before this capability existed', async () => {
    const contentItems = fakeContentItemRepository();
    const storage = fakeAssetStorage();
    const key = 'cms/ai_income_99/assets/no-sessions-wired.pdf';
    storage.simulateUpload(key, { bytes: 1024, contentType: 'application/pdf' });

    const created = await completeAssetUpload(
      { contentItems, storage },
      { storageKey: key, owningProductId: 'ai_income_99', parentId: null, title: 'Unaffected' },
    );

    expect(created.status).toBe('DRAFT');
  });
});
