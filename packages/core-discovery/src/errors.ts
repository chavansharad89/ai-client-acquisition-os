import type { SearchStatus } from '@acos/core-search';

export type DiscoveryValidationReason = 'required' | 'too-long';

/** Thrown by validateRunDiscoveryInput() for any untrusted value that fails validation. */
export class DiscoveryValidationError extends Error {
  readonly field: string;
  readonly reason: DiscoveryValidationReason;

  constructor(field: string, reason: DiscoveryValidationReason, message: string) {
    super(message);
    this.name = 'DiscoveryValidationError';
    this.field = field;
    this.reason = reason;
  }
}

/** Thrown by runDiscovery() when `searchId` does not resolve to a Search owned by the caller. */
export class DiscoverySearchNotFoundError extends Error {
  readonly searchId: string;

  constructor(searchId: string) {
    super(`search not found: ${searchId}`);
    this.name = 'DiscoverySearchNotFoundError';
    this.searchId = searchId;
  }
}

/** Thrown by runDiscovery() when the Search is not RUNNING (see ./service). */
export class DiscoveryInvalidSearchStateError extends Error {
  readonly status: SearchStatus;

  constructor(status: SearchStatus) {
    super(`discovery cannot run against a Search in status ${status}`);
    this.name = 'DiscoveryInvalidSearchStateError';
    this.status = status;
  }
}
