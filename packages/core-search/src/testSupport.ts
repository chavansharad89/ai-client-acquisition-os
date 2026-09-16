import type { ServiceProfileFields } from '@acos/core-service-profile';

import type { SearchRepository } from './repository';
import type { SearchStatus, StoredSearch } from './types';

/** In-memory repository enforcing the same ownership + CAS-transition boundary the database does. */
export function fakeSearchRepository(
  seed: StoredSearch[] = [],
): SearchRepository & { rows: StoredSearch[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async create(
      userId: string,
      input: {
        serviceProfileId: string;
        parameters: ServiceProfileFields;
        idempotencyKey: string | null;
      },
      now: Date,
    ) {
      counter += 1;
      const created: StoredSearch = {
        id: `search_${counter}`,
        userId,
        serviceProfileId: input.serviceProfileId,
        status: 'PENDING',
        parameters: input.parameters,
        attempts: 0,
        lastError: null,
        leaseOwner: null,
        leaseExpiresAt: null,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(created);
      return created;
    },

    async findByIdempotencyKey(userId: string, idempotencyKey: string) {
      return (
        rows.find((row) => row.userId === userId && row.idempotencyKey === idempotencyKey) ?? null
      );
    },

    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },

    async list(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },

    async transition(
      userId: string,
      id: string,
      from: SearchStatus,
      to: SearchStatus,
      options: { lastError: string | null },
      now: Date,
    ) {
      const index = rows.findIndex(
        (row) => row.id === id && row.userId === userId && row.status === from,
      );
      if (index === -1) return null;
      const existing = rows[index]!;
      const updated: StoredSearch = {
        ...existing,
        status: to,
        lastError: to === 'FAILED' ? options.lastError : existing.lastError,
        attempts: to === 'RUNNING' ? existing.attempts + 1 : existing.attempts,
        updatedAt: now,
      };
      rows[index] = updated;
      return updated;
    },
  };
}
