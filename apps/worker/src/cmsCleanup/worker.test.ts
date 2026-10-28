import type { ObsoleteContentObject } from '@acos/core-cms';
import { describe, expect, it, vi } from 'vitest';

import { runCmsObsoleteObjectCleanupTick, type CmsObsoleteObjectCleanupTickDeps } from './worker';

// UNIT tests (fakes only) for the obsolete-object cleanup tick's
// decision logic, mirroring ../gateEvaluation/pollLoop.test.ts's own
// convention: `obsoleteObjects`/`storage` are scripted fakes here. Real
// query behavior against a real database (findExpired/
// isStorageKeyCurrentlyReferenced actually using Postgres/the migration
// 0067 indexes) is exercised by the real-Postgres integration test under
// tests/integration/.

function obsoleteRow(overrides: Partial<ObsoleteContentObject> = {}): ObsoleteContentObject {
  return {
    id: 'obsolete-1',
    contentItemId: 'content-1',
    storageKey: 'cms/ai_income_99/assets/old-1.pdf',
    retentionUntil: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2025-12-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeDeps(overrides: Partial<CmsObsoleteObjectCleanupTickDeps> = {}): CmsObsoleteObjectCleanupTickDeps {
  return {
    obsoleteObjects: {
      findExpired: vi.fn().mockResolvedValue([]),
      isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
      deleteById: vi.fn().mockResolvedValue(undefined),
    },
    storage: {
      headObject: vi.fn().mockResolvedValue({ bytes: 1024, contentType: 'application/pdf' }),
      deleteObject: vi.fn().mockResolvedValue(undefined),
    },
    batchSize: 100,
    now: () => new Date('2026-02-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('runCmsObsoleteObjectCleanupTick', () => {
  it('1. deletes the object and removes the bookkeeping row when expired and not currently referenced', async () => {
    const row = obsoleteRow();
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([row]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsObsoleteObjectCleanupTick(deps);

    expect(deps.storage.deleteObject).toHaveBeenCalledWith(row.storageKey);
    expect(deps.obsoleteObjects.deleteById).toHaveBeenCalledWith(row.id);
    expect(outcome).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
  });

  it('2. never deletes the object or the bookkeeping row when the storage key is still referenced', async () => {
    const row = obsoleteRow();
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([row]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(true),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsObsoleteObjectCleanupTick(deps);

    expect(deps.storage.headObject).not.toHaveBeenCalled();
    expect(deps.storage.deleteObject).not.toHaveBeenCalled();
    expect(deps.obsoleteObjects.deleteById).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 1, failed: 0 });
  });

  it('3. a row with no results from findExpired (retentionUntil in the future) is never touched', async () => {
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([]), // the repository's own WHERE retention_until <= now already excludes it
        isStorageKeyCurrentlyReferenced: vi.fn(),
        deleteById: vi.fn(),
      },
    });

    const outcome = await runCmsObsoleteObjectCleanupTick(deps);

    expect(deps.obsoleteObjects.isStorageKeyCurrentlyReferenced).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 0, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
  });

  it('4. a deleteObject failure leaves the bookkeeping row in place for retry', async () => {
    const row = obsoleteRow();
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([row]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        headObject: vi.fn().mockResolvedValue({ bytes: 1024, contentType: 'application/pdf' }),
        deleteObject: vi.fn().mockRejectedValue(new Error('transient R2 error')),
      },
    });

    const outcome = await runCmsObsoleteObjectCleanupTick(deps);

    expect(deps.obsoleteObjects.deleteById).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 1 });
  });

  it('5. an already-absent object is confirmed via headObject, and the bookkeeping row is removed without calling deleteObject', async () => {
    const row = obsoleteRow();
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([row]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        headObject: vi.fn().mockResolvedValue(null),
        deleteObject: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsObsoleteObjectCleanupTick(deps);

    expect(deps.storage.deleteObject).not.toHaveBeenCalled();
    expect(deps.obsoleteObjects.deleteById).toHaveBeenCalledWith(row.id);
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 1, skippedReferenced: 0, failed: 0 });
  });

  it('6. multiple expired rows are each processed independently', async () => {
    const referenced = obsoleteRow({ id: 'obsolete-referenced', storageKey: 'cms/p/assets/referenced.pdf' });
    const deletable = obsoleteRow({ id: 'obsolete-deletable', storageKey: 'cms/p/assets/deletable.pdf' });
    const absent = obsoleteRow({ id: 'obsolete-absent', storageKey: 'cms/p/assets/absent.pdf' });
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([referenced, deletable, absent]),
        isStorageKeyCurrentlyReferenced: vi.fn(async (key: string) => key === referenced.storageKey),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        headObject: vi.fn(async (key: string) =>
          key === absent.storageKey ? null : { bytes: 1024, contentType: 'application/pdf' },
        ),
        deleteObject: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsObsoleteObjectCleanupTick(deps);

    expect(outcome).toEqual({ scanned: 3, deleted: 1, alreadyAbsent: 1, skippedReferenced: 1, failed: 0 });
    expect(deps.obsoleteObjects.deleteById).toHaveBeenCalledWith(deletable.id);
    expect(deps.obsoleteObjects.deleteById).toHaveBeenCalledWith(absent.id);
    expect(deps.obsoleteObjects.deleteById).not.toHaveBeenCalledWith(referenced.id);
  });

  it('7. a second, repeated tick behaves identically — no duplicate-deletion assumptions baked in', async () => {
    const row = obsoleteRow();
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([row]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const first = await runCmsObsoleteObjectCleanupTick(deps);
    const second = await runCmsObsoleteObjectCleanupTick(deps);

    expect(first).toEqual(second);
    expect(deps.obsoleteObjects.deleteById).toHaveBeenCalledTimes(2);
  });

  it('9. uses storage_key (never content_item_id) as the physical-deletion identity', async () => {
    const row = obsoleteRow({ storageKey: 'cms/ai_income_99/assets/distinct-key.pdf', contentItemId: 'content-xyz' });
    const deps = fakeDeps({
      obsoleteObjects: {
        findExpired: vi.fn().mockResolvedValue([row]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    await runCmsObsoleteObjectCleanupTick(deps);

    expect(deps.storage.headObject).toHaveBeenCalledWith(row.storageKey);
    expect(deps.storage.deleteObject).toHaveBeenCalledWith(row.storageKey);
    expect(deps.storage.headObject).not.toHaveBeenCalledWith(row.contentItemId);
  });

  it('respects batchSize/now by passing them straight through to findExpired', async () => {
    const findExpired = vi.fn().mockResolvedValue([]);
    const now = new Date('2026-03-01T00:00:00.000Z');
    const deps = fakeDeps({
      obsoleteObjects: { findExpired, isStorageKeyCurrentlyReferenced: vi.fn(), deleteById: vi.fn() },
      batchSize: 25,
      now: () => now,
    });

    await runCmsObsoleteObjectCleanupTick(deps);

    expect(findExpired).toHaveBeenCalledWith(now, 25);
  });
});
