// core-search
// -----------------------------------------------------------------------
// Owns: Search (PRD V2.1 R-05) — an authenticated, owned, resumable unit
// of work started from a ServiceProfile, with an immutable parameter
// snapshot and a fixed PENDING/RUNNING/COMPLETE/FAILED/CANCELLED
// lifecycle. Does NOT own business discovery, normalization,
// deduplication, research, scoring, Opportunity, outreach, CRM or
// dashboard behaviour — see MVP_SCOPE_BOUNDARY.md.
//
// Must NOT: accept a caller-supplied userId anywhere, or let a
// ServiceProfile edit after creation change an existing Search's stored
// parameters (DEC-007).
// -----------------------------------------------------------------------

export { createPgSearchRepository } from './pgRepository';
export type { SearchRepository } from './repository';
export { SEARCH_VALID_TRANSITIONS, isValidSearchTransition } from './state';
export type { CreateSearchInput, SearchStatus, StoredSearch, TransitionSearchInput } from './types';

export {
  IDEMPOTENCY_KEY_MAX_LENGTH,
  SERVICE_PROFILE_ID_MAX_LENGTH,
  validateCreateSearchInput,
} from './validation';

export {
  SearchIdempotencyKeyConflictError,
  SearchInvalidTransitionError,
  SearchServiceProfileNotFoundError,
  SearchValidationError,
} from './errors';
export type { SearchValidationReason } from './errors';

export { createSearch, getSearch, listSearches, transitionSearch } from './service';
export type { SearchDeps } from './service';
