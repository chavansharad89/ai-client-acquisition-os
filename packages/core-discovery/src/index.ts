// core-discovery
// -----------------------------------------------------------------------
// Owns: Discovery (PRD V2.1 R-06/R-07/R-08) — turning a RUNNING Search
// into persisted, deduplicated Company/Prospect rows via a
// provider-independent boundary. Does NOT own Research, evidence,
// scoring, Opportunity, outreach, CRM, or the Search state machine
// itself — see MVP_SCOPE_BOUNDARY.md.
//
// Must NOT: accept a caller-supplied userId anywhere, or execute against
// a Search that is not RUNNING or not owned by the caller.
// -----------------------------------------------------------------------

export { createPgCompanyRepository, createPgProspectRepository } from './pgRepository';
export type { CompanyRepository, ProspectRepository } from './repository';

export type { DiscoveryCandidate, DiscoveryProvider } from './provider';

export { normalizeCandidate, normalizeDomain } from './normalize';
export type { NormalizedCandidate } from './normalize';

export type { ProspectStatus, RunDiscoveryInput, StoredCompany, StoredProspect } from './types';

export { SEARCH_ID_MAX_LENGTH, validateRunDiscoveryInput } from './validation';

export {
  DiscoveryInvalidSearchStateError,
  DiscoverySearchNotFoundError,
  DiscoveryValidationError,
} from './errors';
export type { DiscoveryValidationReason } from './errors';

export { runDiscovery } from './service';
export type { DiscoveryDeps, DiscoveryRunResult } from './service';
