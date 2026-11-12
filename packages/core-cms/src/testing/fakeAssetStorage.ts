import type { AssetStorage, StoredObjectMetadata } from '../assetStorage';

// In-memory AssetStorage fake, mirroring fakeContentItemRepository.ts's
// shape: a seedable, mutable in-memory store behind the real interface,
// so Phase 2 business logic is testable without R2 or any real network
// call. `simulateUpload` is test-only scaffolding (not part of
// AssetStorage) standing in for "the browser's direct-to-storage PUT
// actually completed" -- there is no code path to call it except a
// test's own setup.

export interface FakeAssetStorage extends AssetStorage {
  /** Test-only: makes `headObject(key)` subsequently report `meta`, as if a real upload to `key` had completed. */
  simulateUpload(key: string, meta: StoredObjectMetadata): void;
}

export function fakeAssetStorage(seed: Readonly<Record<string, StoredObjectMetadata>> = {}): FakeAssetStorage {
  const objects = new Map(Object.entries(seed));

  return {
    async createUploadAuthorization(key) {
      return {
        uploadUrl: `https://fake-storage.test/upload/${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
    },

    async headObject(key) {
      return objects.get(key) ?? null;
    },

    async createDownloadAuthorization(key, ttlSeconds) {
      return {
        downloadUrl: `https://fake-storage.test/download/${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      };
    },

    async deleteObject(key) {
      objects.delete(key);
    },

    simulateUpload(key, meta) {
      objects.set(key, meta);
    },
  };
}
