import { describe, expect, it, vi } from 'vitest';

import {
  completeAssetUpload,
  completeReplacementAssetUpload,
  createContainer,
  publishReplacement,
  requestAssetUploadAuthorization,
  setDisplayName,
  setLifecycleStatus,
  swapOrder,
  updateContentMetadata,
} from './api';

const RAW_ITEM = {
  id: 'item-1',
  owningProductId: 'ai_income_99',
  parentId: 'parent-1',
  nodeType: 'CONTAINER',
  assetKind: null,
  title: 'A title',
  description: null,
  storageKey: 'should-never-be-read/secret-key.pdf',
  previousStorageKey: 'also-never-read/old-key.pdf',
  bytes: null,
  orderIndex: 0,
  status: 'DRAFT',
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  replacesContentItemId: null,
  previousStorageRetentionUntil: null,
};

describe('updateContentMetadata', () => {
  it('POSTs changes to the admin content route and parses a successful response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => RAW_ITEM });

    const result = await updateContentMetadata('item-1', { title: 'New title' }, fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/content/item-1',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'New title' }),
      }),
    );
    expect(result).toEqual({ ok: true, data: expect.objectContaining({ id: 'item-1', title: 'A title' }) });
  });

  it('never carries storageKey or previousStorageKey into the parsed result, even though the route sends them', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => RAW_ITEM });

    const result = await updateContentMetadata('item-1', {}, fetchImpl as never);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('storageKey');
      expect(result.data).not.toHaveProperty('previousStorageKey');
      expect(JSON.stringify(result.data)).not.toContain('secret-key');
      expect(JSON.stringify(result.data)).not.toContain('old-key');
    }
  });

  it('maps a 400 validation response to a validation error with its field', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'title must not be blank', code: 'VALIDATION_ERROR', field: 'title' }),
    });

    const result = await updateContentMetadata('item-1', { title: '' }, fetchImpl as never);

    expect(result).toEqual({
      ok: false,
      error: { kind: 'validation', message: 'title must not be blank', field: 'title' },
    });
  });

  it('maps a 403 response to an auth error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });

    const result = await updateContentMetadata('item-1', {}, fetchImpl as never);

    expect(result).toEqual({ ok: false, error: { kind: 'auth', message: 'You no longer have CMS access.' } });
  });

  it('maps a thrown fetch (offline) to a network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));

    const result = await updateContentMetadata('item-1', {}, fetchImpl as never);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('network');
  });
});

describe('createContainer', () => {
  it('POSTs to the admin content collection route', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => RAW_ITEM });

    const input = { owningProductId: 'ai_income_99', parentId: 'parent-1', title: 'New Section' };
    const result = await createContainer(input, fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/content',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
    expect(result.ok).toBe(true);
  });

  it('maps a 404 response to a not-found error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    const result = await createContainer(
      { owningProductId: 'ai_income_99', parentId: 'missing', title: 'X' },
      fetchImpl as never,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('not-found');
  });
});

describe('requestAssetUploadAuthorization', () => {
  const AUTH_RAW = {
    uploadSessionId: 'session-1',
    storageKey: 'cms/ai_income_99/assets/session-1.pdf',
    uploadUrl: 'https://r2.example.com/signed-put-url',
    expiresAt: '2026-01-01T00:05:00.000Z',
  };

  it('POSTs the candidate to the upload-authorization route and parses the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => AUTH_RAW });

    const input = { owningProductId: 'ai_income_99', extension: 'pdf', contentType: 'application/pdf', declaredBytes: 1024 };
    const result = await requestAssetUploadAuthorization(input, fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/assets/upload-authorization',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
    expect(result).toEqual({
      ok: true,
      data: {
        uploadSessionId: 'session-1',
        storageKey: AUTH_RAW.storageKey,
        uploadUrl: AUTH_RAW.uploadUrl,
        expiresAt: new Date(AUTH_RAW.expiresAt),
      },
    });
  });

  it('maps a 400 (unsupported extension) response to a validation error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "extension 'exe' is not in the approved allowlist", code: 'VALIDATION_ERROR', field: 'extension' }),
    });

    const result = await requestAssetUploadAuthorization(
      { owningProductId: 'ai_income_99', extension: 'exe', contentType: 'application/x-msdownload', declaredBytes: 10 },
      fetchImpl as never,
    );

    expect(result).toEqual({
      ok: false,
      error: { kind: 'validation', message: "extension 'exe' is not in the approved allowlist", field: 'extension' },
    });
  });
});

describe('completeAssetUpload', () => {
  it('POSTs the storage key and metadata to the complete route and parses the resulting DRAFT asset', async () => {
    const rawAsset = { ...RAW_ITEM, nodeType: 'ASSET', assetKind: 'pdf', status: 'DRAFT' };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => rawAsset });

    const input = {
      storageKey: 'cms/ai_income_99/assets/session-1.pdf',
      owningProductId: 'ai_income_99',
      parentId: 'parent-1',
      title: 'Resource title',
    };
    const result = await completeAssetUpload(input, fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/assets/complete',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe('DRAFT');
  });

  it('never carries storageKey into the parsed result, even though the route sends it', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => RAW_ITEM });

    const result = await completeAssetUpload(
      { storageKey: 'cms/ai_income_99/assets/session-1.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'X' },
      fetchImpl as never,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('storageKey');
      expect(JSON.stringify(result.data)).not.toContain('secret-key');
    }
  });

  it('maps an object-not-found completion failure to a validation error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "no object exists at storage key", code: 'VALIDATION_ERROR', field: 'storageKey', reason: 'object-not-found' }),
    });

    const result = await completeAssetUpload(
      { storageKey: 'cms/ai_income_99/assets/missing.pdf', owningProductId: 'ai_income_99', parentId: null, title: 'X' },
      fetchImpl as never,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('validation');
  });
});

describe('setLifecycleStatus', () => {
  it('POSTs the new status to the status route and parses the updated item', async () => {
    const rawPublished = { ...RAW_ITEM, status: 'PUBLISHED' };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => rawPublished });

    const result = await setLifecycleStatus('item-1', 'PUBLISHED', fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/content/item-1/status',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe('PUBLISHED');
  });

  it('never carries storageKey into the parsed result', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => RAW_ITEM });

    const result = await setLifecycleStatus('item-1', 'ARCHIVED', fetchImpl as never);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).not.toHaveProperty('storageKey');
  });

  it('maps a 403 response to an auth error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });

    const result = await setLifecycleStatus('item-1', 'PUBLISHED', fetchImpl as never);

    expect(result).toEqual({ ok: false, error: { kind: 'auth', message: 'You no longer have CMS access.' } });
  });

  it('maps a 404 response to a not-found error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    const result = await setLifecycleStatus('missing', 'PUBLISHED', fetchImpl as never);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('not-found');
  });
});

describe('publishReplacement', () => {
  it('POSTs the content item id and expected pending-replacement id, and parses the published item', async () => {
    const rawPublished = { ...RAW_ITEM, nodeType: 'ASSET', assetKind: 'pdf', status: 'PUBLISHED' };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => rawPublished });

    const result = await publishReplacement('target-1', 'replacement-1', fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/assets/publish-replacement',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentItemId: 'target-1', expectedPendingReplacementId: 'replacement-1' }),
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.status).toBe('PUBLISHED');
  });

  it('maps a 400 (stale expectedPendingReplacementId) response to a validation error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'replacement id mismatch', code: 'VALIDATION_ERROR', field: 'expectedPendingReplacementId' }),
    });

    const result = await publishReplacement('target-1', 'stale-id', fetchImpl as never);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('validation');
  });
});

describe('completeReplacementAssetUpload', () => {
  it('POSTs the storage key and replacement target to the complete route', async () => {
    const rawReplacement = { ...RAW_ITEM, nodeType: 'ASSET', assetKind: 'pdf', status: 'DRAFT', replacesContentItemId: 'target-1' };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => rawReplacement });

    const input = { storageKey: 'cms/ai_income_99/assets/session-2.pdf', replacesContentItemId: 'target-1' };
    const result = await completeReplacementAssetUpload(input, fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/assets/complete',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.replacesContentItemId).toBe('target-1');
  });

  it('maps a mismatched-product completion failure to a validation error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "storage key's product does not match", code: 'VALIDATION_ERROR', field: 'storageKey' }),
    });

    const result = await completeReplacementAssetUpload(
      { storageKey: 'cms/ai_freelancing_499/assets/x.pdf', replacesContentItemId: 'target-1' },
      fetchImpl as never,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('validation');
  });
});

describe('swapOrder', () => {
  it('issues two sequential metadata updates, each setting the other side’s order', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => RAW_ITEM });

    const result = await swapOrder({ id: 'a', orderIndex: 0 }, { id: 'b', orderIndex: 1 }, fetchImpl as never);

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      '/api/cms/admin/content/a',
      expect.objectContaining({ body: JSON.stringify({ orderIndex: 1 }) }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      '/api/cms/admin/content/b',
      expect.objectContaining({ body: JSON.stringify({ orderIndex: 0 }) }),
    );
  });

  it('stops after the first call and reports its error if it fails, without attempting the second', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'bad request', code: 'VALIDATION_ERROR' }),
    });

    const result = await swapOrder({ id: 'a', orderIndex: 0 }, { id: 'b', orderIndex: 1 }, fetchImpl as never);

    expect(result.ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('surfaces the second call’s error if the first succeeds but the second fails', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => RAW_ITEM })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'db error' }) });

    const result = await swapOrder({ id: 'a', orderIndex: 0 }, { id: 'b', orderIndex: 1 }, fetchImpl as never);

    expect(result.ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    if (!result.ok) expect(result.error.kind).toBe('server');
  });
});

describe('setDisplayName', () => {
  const RAW_OVERRIDE = {
    productId: 'ai_income_99',
    displayName: 'Plus',
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedBy: 'admin-1',
  };

  it('POSTs to the admin display-names route for the given productId', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => RAW_OVERRIDE });

    const result = await setDisplayName('ai_income_99', 'Plus', fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/cms/admin/display-names/ai_income_99',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ displayName: 'Plus' }) }),
    );
    expect(result).toEqual({ ok: true, data: { productId: 'ai_income_99', displayName: 'Plus', updatedBy: 'admin-1' } });
  });

  it('maps a blank-name 400 response to a validation error', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: 'display_name must not be blank', field: 'displayName' }) });

    const result = await setDisplayName('ai_income_99', '   ', fetchImpl as never);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('validation');
      expect(result.error.field).toBe('displayName');
    }
  });

  it('maps a 403 response to an auth error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });

    const result = await setDisplayName('ai_income_99', 'Plus', fetchImpl as never);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('auth');
  });

  it('maps a network failure to the standard network error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));

    const result = await setDisplayName('ai_income_99', 'Plus', fetchImpl as never);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('network');
  });
});
