// core-opportunity
// -----------------------------------------------------------------------
// Owns: Opportunity (PRD V2.1 R-11/R-12/R-13) — detecting a need and
// recommending an offer from a Prospect's persisted ResearchSignals
// against the caller's own service, and persisting the result as a
// durable, reviewable record with a state. Does NOT own scoring
// persistence (opportunity_scores), Next Action, CRM, or Outreach — see
// MVP_SCOPE_BOUNDARY.md.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-acquisition's suggestOffers().
// -----------------------------------------------------------------------

export { toOfferSignals, toServiceRule } from './adapters';

export {
  CreateOpportunityValidationError,
  OpportunityNotFoundError,
  OpportunityProspectNotFoundError,
} from './errors';
export type { CreateOpportunityValidationReason } from './errors';

export { createPgOpportunityRepository } from './pgRepository';
export type { OpportunityRepository } from './repository';

export { createOpportunity, getOpportunity, listOpportunities } from './service';
export type { OpportunityDeps } from './service';

export { PROSPECT_ID_MAX_LENGTH, validateCreateOpportunityInput } from './validation';

export type {
  CreateOpportunityInput,
  DetectedOffer,
  OpportunityState,
  StoredOpportunity,
} from './types';
