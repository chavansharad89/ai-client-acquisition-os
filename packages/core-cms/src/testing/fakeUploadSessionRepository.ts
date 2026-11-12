import type { UploadSession, UploadSessionRepository } from '../uploadSessionRepository';

// In-memory UploadSessionRepository fake, mirroring
// fakeAssetStorage.ts/fakeContentItemRepository.ts's shape: a seedable,
// mutable in-memory store behind the real interface. `isStorageKeyCurrentlyReferenced`
// is deliberately NOT backed by a fake content_items table here -- tests
// that need to exercise the "still referenced" safety check inject their
// own override (see assetIngestionService.test.ts /
// apps/worker's abandonedUploadWorker.test.ts), since a real reference
// check is inherently a cross-repository question this fake has no
// other data to answer from.

export function fakeUploadSessionRepository(seed: readonly UploadSession[] = []): UploadSessionRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    async create(input) {
      const row: UploadSession = { ...input, createdAt: new Date() };
      rows.set(row.id, row);
      return row;
    },

    async findByStorageKey(storageKey) {
      for (const row of rows.values()) {
        if (row.storageKey === storageKey) return row;
      }
      return null;
    },

    async findOlderThan(cutoff, limit) {
      return [...rows.values()]
        .filter((row) => row.createdAt.getTime() <= cutoff.getTime())
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, limit);
    },

    async isStorageKeyCurrentlyReferenced() {
      return false;
    },

    async deleteById(id) {
      rows.delete(id);
    },
  };
}
