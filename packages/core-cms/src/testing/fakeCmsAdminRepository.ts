import type { CmsAdminRepository } from '../cmsAdminRepository';
import type { CmsAdmin } from '../types';

// In-memory CmsAdminRepository fake, mirroring
// fakePlanDisplayNameRepository.ts's shape: a seedable, read-only
// in-memory store behind the same interface the real Postgres-backed
// repository implements. Read-only because the real repository is
// read-only this phase (see cmsAdminRepository.ts) -- membership is
// seeded once at construction, standing in for an operator's direct
// database action, never granted/revoked through this fake's own API.

export function fakeCmsAdminRepository(seed: readonly CmsAdmin[] = []): CmsAdminRepository {
  const rows = new Map(seed.map((row) => [row.userId, row]));

  return {
    async findByUserId(userId) {
      return rows.get(userId) ?? null;
    },
  };
}
