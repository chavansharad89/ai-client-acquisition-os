// core-opportunity
// -----------------------------------------------------------------------
// Owns: Opportunity (PRD V2.1 R-11/R-12/R-13) — detecting a need and
// recommending an offer from a Prospect's persisted ResearchSignals
// against the caller's own service, and persisting the result as a
// durable, reviewable record with a state. Also owns OpportunityScore
// persistence (PRD V2.1 R-14/R-15/R-17, migration 0018) — wiring
// @acos/core-acquisition's existing scoreProspect() onto a persisted
// Opportunity via @acos/core-research's toScoringSignals(). Also owns
// Opportunity ranking (PRD V2.1 R-15/AC-17, Stage O) — ordering the
// caller's own persisted OpportunityScores via @acos/core-acquisition's
// existing rankProspects(), a pure read that never recomputes a score.
// Does NOT own Next Action, CRM, or Outreach — see MVP_SCOPE_BOUNDARY.md.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-acquisition's suggestOffers()/scoreProspect()/rankProspects().
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

export { createPgOpportunityScoreRepository } from './scorePgRepository';
export type { OpportunityScoreRepository } from './scoreRepository';

export {
  createOpportunity,
  getOpportunity,
  getOpportunityScore,
  listOpportunities,
  rankOpportunities,
  scoreOpportunity,
  SCORER_VERSION,
} from './service';
export type { OpportunityDeps, OpportunityScoreDeps } from './service';

export { PROSPECT_ID_MAX_LENGTH, validateCreateOpportunityInput } from './validation';

export type {
  CreateOpportunityInput,
  DetectedOffer,
  OpportunityState,
  RankedOpportunity,
  StoredOpportunity,
  StoredOpportunityScore,
} from './types';
