import type { ServiceProfileRepository } from './repository';
import type { ServiceProfileFields, StoredServiceProfile } from './types';

/** In-memory repository enforcing the same ownership boundary the database does. */
export function fakeServiceProfileRepository(
  seed: StoredServiceProfile[] = [],
): ServiceProfileRepository & { rows: StoredServiceProfile[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async create(userId: string, input: ServiceProfileFields, now: Date) {
      counter += 1;
      const created: StoredServiceProfile = {
        id: `svcprofile_${counter}`,
        userId,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(created);
      return created;
    },

    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },

    async list(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },

    async update(userId: string, id: string, input: ServiceProfileFields, now: Date) {
      const index = rows.findIndex((row) => row.id === id && row.userId === userId);
      if (index === -1) return null;
      const updated: StoredServiceProfile = { ...rows[index]!, ...input, updatedAt: now };
      rows[index] = updated;
      return updated;
    },

    async delete(userId: string, id: string) {
      const index = rows.findIndex((row) => row.id === id && row.userId === userId);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}
