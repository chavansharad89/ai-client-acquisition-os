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
// Also owns Opportunity staleness (PRD V2.1 R-19, Stage S, migration
// 0019) — classifying whether an Opportunity's evidence is still
// current via @acos/core-acquisition's classifyStaleness(), independent
// of `state`. Also owns Opportunity Next Action (PRD V2.1 R-20/AC-21,
// Stage T) — recommending what the caller should do next via
// @acos/core-acquisition's recommendOpportunityAction(), derived at read
// time from `state`/`needDetected`/`staleness` already persisted, never
// stored itself. Also owns Feedback (PRD V2.1 R-21/AC-22, Stage R,
// migration 0020) — persisting the caller's useful/not-useful verdict
// and free-text reason against one of their own Opportunities; unlike
// OpportunityScore, Feedback carries its own `userId`. Also owns basic
// Opportunity outcome tracking (PRD V2.2 R-27, Phase 15) — a pure read
// summarising the caller's own Opportunities as created/actioned/
// useful/notUseful from data Phases 9 and 14 already persist; no new
// table or column. Deliberately does not report "reviewed" — see
// service.ts's Phase 15 section for why.
// Does NOT own CRM or Outreach — see MVP_SCOPE_BOUNDARY.md §6.2-6.4.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-acquisition's suggestOffers()/scoreProspect()/rankProspects().
// -----------------------------------------------------------------------

export { toOfferSignals, toServiceRule } from './adapters';

export {
  CreateOpportunityValidationError,
  FeedbackValidationError,
  OpportunityNotFoundError,
  OpportunityProspectNotFoundError,
} from './errors';
export type { CreateOpportunityValidationReason, FeedbackValidationReason } from './errors';

export { createPgFeedbackRepository } from './feedbackPgRepository';
export type { FeedbackRepository } from './feedbackRepository';

export { FEEDBACK_REASON_MAX_LENGTH, validateRecordFeedbackInput } from './feedbackValidation';

export { createPgOpportunityRepository } from './pgRepository';
export type { OpportunityRepository } from './repository';

export { createPgOpportunityScoreRepository } from './scorePgRepository';
export type { OpportunityScoreRepository } from './scoreRepository';

export {
  classifyOpportunityStaleness,
  createOpportunity,
  createOpportunityForOwner,
  getFeedback,
  getOpportunity,
  getOpportunityNextAction,
  getOpportunityScore,
  getOpportunityTrackingSummary,
  listOpportunities,
  rankOpportunities,
  recordFeedback,
  scoreOpportunity,
  SCORER_VERSION,
} from './service';
export type {
  OpportunityDeps,
  OpportunityFeedbackDeps,
  OpportunityScoreDeps,
  OpportunityTrackingDeps,
} from './service';

export { PROSPECT_ID_MAX_LENGTH, validateCreateOpportunityInput } from './validation';

export type {
  CreateOpportunityInput,
  DetectedOffer,
  OpportunityState,
  OpportunityTrackingSummary,
  RankedOpportunity,
  RecordFeedbackInput,
  StoredFeedback,
  StoredOpportunity,
  StoredOpportunityScore,
} from './types';
