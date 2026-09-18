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

    // ---- Worker-only operations (R-34) — mirrors ./pgRepository exactly ---

    async claimNextPending({
      workerId,
      now,
      leaseExpiresAt,
    }: {
      workerId: string;
      now: Date;
      leaseExpiresAt: Date;
    }) {
      const index = rows.findIndex((row) => row.status === 'PENDING');
      if (index === -1) return null;
      const existing = rows[index]!;
      const updated: StoredSearch = {
        ...existing,
        status: 'RUNNING',
        leaseOwner: workerId,
        leaseExpiresAt,
        attempts: existing.attempts + 1,
        updatedAt: now,
      };
      rows[index] = updated;
      return updated;
    },

    async releaseExpiredLeases({ now }: { now: Date }) {
      let count = 0;
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index]!;
        if (row.status === 'RUNNING' && row.leaseExpiresAt !== null && row.leaseExpiresAt <= now) {
          rows[index] = {
            ...row,
            status: 'PENDING',
            leaseOwner: null,
            leaseExpiresAt: null,
            updatedAt: now,
          };
          count += 1;
        }
      }
      return count;
    },

    async completeClaimed({ id, workerId, now }: { id: string; workerId: string; now: Date }) {
      const index = rows.findIndex(
        (row) => row.id === id && row.status === 'RUNNING' && row.leaseOwner === workerId,
      );
      if (index === -1) return false;
      rows[index] = {
        ...rows[index]!,
        status: 'COMPLETE',
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: now,
      };
      return true;
    },

    async recordAttemptFailure({
      id,
      workerId,
      now,
      error,
      maxAttempts,
    }: {
      id: string;
      workerId: string;
      now: Date;
      error: string;
      maxAttempts: number;
    }) {
      const index = rows.findIndex(
        (row) => row.id === id && row.status === 'RUNNING' && row.leaseOwner === workerId,
      );
      if (index === -1) return null;
      const existing = rows[index]!;
      const status: SearchStatus = existing.attempts >= maxAttempts ? 'FAILED' : 'PENDING';
      rows[index] = {
        ...existing,
        status,
        lastError: error,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: now,
      };
      return status;
    },
  };
}
