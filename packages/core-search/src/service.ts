import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { ServiceProfileRepository } from '@acos/core-service-profile';

import {
  SearchIdempotencyKeyConflictError,
  SearchInvalidTransitionError,
  SearchServiceProfileNotFoundError,
} from './errors';
import type { SearchRepository } from './repository';
import { isValidSearchTransition } from './state';
import type { CreateSearchInput, StoredSearch, TransitionSearchInput } from './types';
import { validateCreateSearchInput } from './validation';

// Application/service boundary.
// -----------------------------------------------------------------------
// The only place a raw session token is accepted. Every function here
// resolves it through requireUser() FIRST — a caller never supplies a
// userId, and an unauthenticated token never reaches the repository
// (DEC-003), mirroring @acos/core-service-profile's service.ts.
// -----------------------------------------------------------------------

export interface SearchDeps {
  identity: IdentityRepository;
  profiles: ServiceProfileRepository;
  searches: SearchRepository;
}

/**
 * Starts a Search from one of the caller's own ServiceProfiles.
 *
 * The parameters snapshot is copied from the resolved profile HERE, at
 * creation time, and never read from it again (DEC-007) — a later edit to
 * the profile cannot change what an existing Search means.
 *
 * Throws {@link SearchServiceProfileNotFoundError} when `serviceProfileId`
 * does not resolve to a profile owned by the caller — an id belonging to
 * another user is indistinguishable from an unknown one, same as
 * ServiceProfile's own not-found handling.
 *
 * IDEMPOTENCY — NOT PRODUCTION READY, NOT concurrency-safe:
 * `idempotencyKey` replay is a read-then-write pre-check
 * (`findByIdempotencyKey` here, then `deps.searches.create`), not a
 * single atomic operation. The database DOES enforce uniqueness (a
 * partial unique index on `(user_id, idempotency_key)`, migration 0014),
 * so two concurrent calls sharing a key can never both succeed — but the
 * loser of that race gets a raw, uncaught Postgres unique-violation error
 * out of `deps.searches.create`, not the winner's `StoredSearch` and not
 * a {@link SearchIdempotencyKeyConflictError}. This is the same
 * documented limitation `@acos/core-payments`' `createOrder.ts` accepts
 * for its own idempotency key. A sequential retry (the common case — a
 * client resending after a timeout) IS handled correctly by the
 * pre-check. Only genuinely concurrent duplicate submissions hit the
 * unhandled path. Do not read this function as providing exactly-once
 * creation semantics under concurrency.
 */
export async function createSearch(
  deps: SearchDeps,
  rawToken: string | undefined | null,
  input: CreateSearchInput,
  now: Date = new Date(),
): Promise<StoredSearch> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const { serviceProfileId, idempotencyKey } = validateCreateSearchInput(input);

  if (idempotencyKey) {
    const existing = await deps.searches.findByIdempotencyKey(userId, idempotencyKey);
    if (existing) {
      if (existing.serviceProfileId !== serviceProfileId) {
        throw new SearchIdempotencyKeyConflictError(['serviceProfileId']);
      }
      return existing;
    }
  }

  const profile = await deps.profiles.getById(userId, serviceProfileId);
  if (!profile) throw new SearchServiceProfileNotFoundError(serviceProfileId);

  return deps.searches.create(
    userId,
    {
      serviceProfileId: profile.id,
      parameters: {
        service: profile.service,
        targetCustomer: profile.targetCustomer,
        geography: profile.geography,
        minProjectValuePaise: profile.minProjectValuePaise,
        triggers: profile.triggers,
        keywords: profile.keywords,
        rationale: profile.rationale,
      },
      idempotencyKey,
    },
    now,
  );
}

export async function getSearch(
  deps: SearchDeps,
  rawToken: string | undefined | null,
  id: string,
  now: Date = new Date(),
): Promise<StoredSearch | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.searches.getById(userId, id);
}

export async function listSearches(
  deps: SearchDeps,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<readonly StoredSearch[]> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.searches.list(userId);
}

/**
 * Moves a Search along its lifecycle (see ./state for the permitted
 * graph). Returns null when `id` does not belong to the caller — never
 * distinguishes that from "does not exist" (DEC-003 cross-user isolation).
 *
 * Throws {@link SearchInvalidTransitionError} for any transition the
 * current status does not permit, including one that lost a race against
 * a concurrent transition of the same row (repository.transition()'s
 * compare-and-swap returned null even though the row is the caller's).
 */
export async function transitionSearch(
  deps: SearchDeps,
  rawToken: string | undefined | null,
  id: string,
  input: TransitionSearchInput,
  now: Date = new Date(),
): Promise<StoredSearch | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const current = await deps.searches.getById(userId, id);
  if (!current) return null;

  if (!isValidSearchTransition(current.status, input.status)) {
    throw new SearchInvalidTransitionError(current.status, input.status);
  }

  const lastError = input.status === 'FAILED' ? input.error?.trim() || 'unknown error' : null;

  const updated = await deps.searches.transition(
    userId,
    id,
    current.status,
    input.status,
    { lastError },
    now,
  );
  if (!updated) {
    // The row was still the caller's between the two reads above, so a
    // null here means the CAS lost a race against a concurrent
    // transition — report it the same way as any other disallowed move.
    throw new SearchInvalidTransitionError(current.status, input.status);
  }
  return updated;
}
