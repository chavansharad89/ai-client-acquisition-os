import type { UploadSession } from '@acos/core-cms';
import { describe, expect, it, vi } from 'vitest';

import { runCmsAbandonedUploadCleanupTick, type CmsAbandonedUploadCleanupTickDeps } from './abandonedUploadWorker';

// UNIT tests (fakes only) for the abandoned-upload cleanup tick's
// decision logic, mirroring ./worker.test.ts's own convention exactly:
// `uploadSessions`/`storage` are scripted fakes here. Real query
// behavior against a real database (findOlderThan/
// isStorageKeyCurrentlyReferenced actually using Postgres/migration
// 0068's indexes) is exercised by the real-Postgres integration test
// under tests/integration/.

function uploadSession(overrides: Partial<UploadSession> = {}): UploadSession {
  return {
    id: 'session-1',
    storageKey: 'cms/ai_income_99/assets/old-1.pdf',
    owningProductId: 'ai_income_99',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeDeps(overrides: Partial<CmsAbandonedUploadCleanupTickDeps> = {}): CmsAbandonedUploadCleanupTickDeps {
  return {
    uploadSessions: {
      findOlderThan: vi.fn().mockResolvedValue([]),
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

describe('runCmsAbandonedUploadCleanupTick', () => {
  it('11. a session younger than the 24h threshold is never scanned at all (findOlderThan already excludes it)', async () => {
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([]),
        isStorageKeyCurrentlyReferenced: vi.fn(),
        deleteById: vi.fn(),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.uploadSessions.isStorageKeyCurrentlyReferenced).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 0, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
  });

  it('12. an eligible, unreferenced session with an existing object is deleted and the session consumed', async () => {
    const session = uploadSession();
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.storage.deleteObject).toHaveBeenCalledWith(session.storageKey);
    expect(deps.uploadSessions.deleteById).toHaveBeenCalledWith(session.id);
    expect(outcome).toEqual({ scanned: 1, deleted: 1, alreadyAbsent: 0, skippedReferenced: 0, failed: 0 });
  });

  it('13. an eligible, unreferenced session whose object is already absent consumes the session without calling deleteObject', async () => {
    const session = uploadSession();
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        headObject: vi.fn().mockResolvedValue(null),
        deleteObject: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.storage.deleteObject).not.toHaveBeenCalled();
    expect(deps.uploadSessions.deleteById).toHaveBeenCalledWith(session.id);
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 1, skippedReferenced: 0, failed: 0 });
  });

  it('14. a session whose storage key is currently referenced is never touched -- object retained, session retained', async () => {
    const session = uploadSession();
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(true),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.storage.headObject).not.toHaveBeenCalled();
    expect(deps.storage.deleteObject).not.toHaveBeenCalled();
    expect(deps.uploadSessions.deleteById).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 1, failed: 0 });
  });

  it('15. a headObject failure leaves the session row in place for retry', async () => {
    const session = uploadSession();
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        headObject: vi.fn().mockRejectedValue(new Error('R2 transiently unreachable')),
        deleteObject: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.uploadSessions.deleteById).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 1 });
  });

  it('16. a deleteObject failure leaves the session row in place for retry', async () => {
    const session = uploadSession();
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
      storage: {
        headObject: vi.fn().mockResolvedValue({ bytes: 1024, contentType: 'application/pdf' }),
        deleteObject: vi.fn().mockRejectedValue(new Error('R2 transiently unreachable')),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.uploadSessions.deleteById).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 0, failed: 1 });
  });

  it('17. multiple sessions are each resolved independently in one tick', async () => {
    const referenced = uploadSession({ id: 'session-referenced', storageKey: 'cms/p/assets/referenced.pdf' });
    const deletable = uploadSession({ id: 'session-deletable', storageKey: 'cms/p/assets/deletable.pdf' });
    const absent = uploadSession({ id: 'session-absent', storageKey: 'cms/p/assets/absent.pdf' });
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([referenced, deletable, absent]),
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

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(outcome).toEqual({ scanned: 3, deleted: 1, alreadyAbsent: 1, skippedReferenced: 1, failed: 0 });
    expect(deps.uploadSessions.deleteById).toHaveBeenCalledWith(deletable.id);
    expect(deps.uploadSessions.deleteById).toHaveBeenCalledWith(absent.id);
    expect(deps.uploadSessions.deleteById).not.toHaveBeenCalledWith(referenced.id);
  });

  it('18. batchSize/now are passed straight through to findOlderThan as (cutoff, limit)', async () => {
    const findOlderThan = vi.fn().mockResolvedValue([]);
    const now = new Date('2026-03-02T00:00:00.000Z');
    const deps = fakeDeps({
      uploadSessions: { findOlderThan, isStorageKeyCurrentlyReferenced: vi.fn(), deleteById: vi.fn() },
      batchSize: 25,
      now: () => now,
    });

    await runCmsAbandonedUploadCleanupTick(deps);

    const expectedCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(findOlderThan).toHaveBeenCalledWith(expectedCutoff, 25);
  });

  it('19. a repeated tick behaves identically -- no duplicate-deletion assumptions baked in', async () => {
    const session = uploadSession();
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const first = await runCmsAbandonedUploadCleanupTick(deps);
    const second = await runCmsAbandonedUploadCleanupTick(deps);

    expect(first).toEqual(second);
    expect(deps.uploadSessions.deleteById).toHaveBeenCalledTimes(2);
  });

  it('21. RACE: a storage key that becomes referenced between check #1 and the pre-delete check #2 is never deleted, and its session is retained', async () => {
    const session = uploadSession();
    // Simulates "a completion commits its content_items row in the
    // window between the two reference checks": the first call (the
    // fast-path check, before headObject) still sees no reference; by
    // the second call (immediately before the physical delete) the
    // reference now exists.
    const isStorageKeyCurrentlyReferenced = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced,
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    const outcome = await runCmsAbandonedUploadCleanupTick(deps);

    expect(isStorageKeyCurrentlyReferenced).toHaveBeenCalledTimes(2);
    expect(deps.storage.deleteObject).not.toHaveBeenCalled();
    expect(deps.uploadSessions.deleteById).not.toHaveBeenCalled();
    expect(outcome).toEqual({ scanned: 1, deleted: 0, alreadyAbsent: 0, skippedReferenced: 1, failed: 0 });
  });

  it('uses storage_key (never the session id) as the physical-deletion identity', async () => {
    const session = uploadSession({ storageKey: 'cms/ai_income_99/assets/distinct-key.pdf', id: 'opaque-session-id' });
    const deps = fakeDeps({
      uploadSessions: {
        findOlderThan: vi.fn().mockResolvedValue([session]),
        isStorageKeyCurrentlyReferenced: vi.fn().mockResolvedValue(false),
        deleteById: vi.fn().mockResolvedValue(undefined),
      },
    });

    await runCmsAbandonedUploadCleanupTick(deps);

    expect(deps.storage.headObject).toHaveBeenCalledWith(session.storageKey);
    expect(deps.storage.deleteObject).toHaveBeenCalledWith(session.storageKey);
    expect(deps.storage.headObject).not.toHaveBeenCalledWith(session.id);
  });
});
