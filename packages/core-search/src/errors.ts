import type { SearchStatus } from './types';

export type SearchValidationReason = 'required' | 'too-long';

/** Thrown by validateCreateSearchInput() for any untrusted value that fails validation. */
export class SearchValidationError extends Error {
  readonly field: string;
  readonly reason: SearchValidationReason;

  constructor(field: string, reason: SearchValidationReason, message: string) {
    super(message);
    this.name = 'SearchValidationError';
    this.field = field;
    this.reason = reason;
  }
}

/** Thrown by createSearch() when `serviceProfileId` does not resolve to a profile owned by the caller. */
export class SearchServiceProfileNotFoundError extends Error {
  readonly serviceProfileId: string;

  constructor(serviceProfileId: string) {
    super(`service profile not found: ${serviceProfileId}`);
    this.name = 'SearchServiceProfileNotFoundError';
    this.serviceProfileId = serviceProfileId;
  }
}

/**
 * Thrown by createSearch() when a supplied idempotencyKey was already used
 * by this user for a different serviceProfileId — see @acos/core-payments'
 * IdempotencyKeyConflictError for the same convention.
 */
export class SearchIdempotencyKeyConflictError extends Error {
  readonly conflictingFields: readonly string[];

  constructor(conflictingFields: readonly string[]) {
    super(`idempotency key reused for a different request: ${conflictingFields.join(', ')}`);
    this.name = 'SearchIdempotencyKeyConflictError';
    this.conflictingFields = conflictingFields;
  }
}

/** Thrown by transitionSearch() for any transition not permitted by the Search lifecycle (see ./state). */
export class SearchInvalidTransitionError extends Error {
  readonly from: SearchStatus;
  readonly to: SearchStatus;

  constructor(from: SearchStatus, to: SearchStatus) {
    super(`invalid Search transition: ${from} -> ${to}`);
    this.name = 'SearchInvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}
