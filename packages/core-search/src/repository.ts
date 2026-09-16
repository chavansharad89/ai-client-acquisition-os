import type { ServiceProfileFields } from '@acos/core-service-profile';

import type { SearchStatus, StoredSearch } from './types';

/**
 * Persistence boundary for Search. Every operation that touches a specific
 * row is constrained by `userId` in the query itself — mirrors
 * @acos/core-service-profile's ServiceProfileRepository. There is
 * deliberately no `getById(id)` that could return another user's row.
 */
export interface SearchRepository {
  create(
    userId: string,
    input: {
      serviceProfileId: string;
      /** The immutable snapshot (DEC-007) — copied from the ServiceProfile at creation time, never re-read later. */
      parameters: ServiceProfileFields;
      idempotencyKey: string | null;
    },
    now: Date,
  ): Promise<StoredSearch>;

  /** Only this user's row for this key — never a global lookup. */
  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<StoredSearch | null>;

  getById(userId: string, id: string): Promise<StoredSearch | null>;

  /** Only this user's searches — never a global list. */
  list(userId: string): Promise<readonly StoredSearch[]>;

  /**
   * Compare-and-swap status transition: applies only if the row is still
   * at `from` when the write lands, which is also what makes this safe
   * against a concurrent transition of the same row. Returns null when
   * `id` does not belong to `userId`, OR the row's status is no longer
   * `from` (lost the race, or the caller's view of `from` was already
   * stale) — the caller cannot tell which from this alone, and must
   * re-read to distinguish "not found" from "conflict" if it needs to.
   */
  transition(
    userId: string,
    id: string,
    from: SearchStatus,
    to: SearchStatus,
    options: { lastError: string | null },
    now: Date,
  ): Promise<StoredSearch | null>;
}
