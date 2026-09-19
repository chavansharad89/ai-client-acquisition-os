import type { ServiceProfileFields, StoredServiceProfile } from './types';

/**
 * Persistence boundary for ServiceProfile. Every operation that touches a
 * specific row is constrained by `userId` in the query itself — there is
 * deliberately no `getById(id)` that could return another user's row (see
 * @acos/core-identity's `requireUser`, which is the only source of the
 * `userId` a caller may pass here).
 */
export interface ServiceProfileRepository {
  create(userId: string, input: ServiceProfileFields, now: Date): Promise<StoredServiceProfile>;

  getById(userId: string, id: string): Promise<StoredServiceProfile | null>;

  /** Only this user's profiles — never a global list. */
  list(userId: string): Promise<readonly StoredServiceProfile[]>;

  /** Returns null (rather than throwing) when `id` does not belong to `userId`. */
  update(
    userId: string,
    id: string,
    input: ServiceProfileFields,
    now: Date,
  ): Promise<StoredServiceProfile | null>;

  /** Returns false when `id` does not belong to `userId`. */
  delete(userId: string, id: string): Promise<boolean>;
}
