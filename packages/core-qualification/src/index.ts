// core-qualification (Phase 20, R-35..R-41)
// -----------------------------------------------------------------------
// Owns: Qualification — evaluating whether an existing Opportunity
// (@acos/core-opportunity's Need Detection output) still has sufficient,
// currently-active evidence to be considered qualified, and persisting
// that evaluation as a durable, reviewable, re-evaluable record
// (migration 0022). A downstream consumer of Opportunity/ResearchSignal,
// never a second need-detection mechanism: it never calls
// suggestOffers(), never manufactures a need Need Detection did not
// detect, and never rewrites `Opportunity.needDetected`/`offer`.
//
// Deterministic only (R-37) — no LLM call, no opaque score. See
// requirement/PHASE_20_QUALIFICATION_SCOPE_LOCK.md for the full rule set
// and the decisions (D1-D4) behind it.
//
// Does NOT own Personalization, Outreach, CRM, or scoring/ranking — see
// MVP_SCOPE_BOUNDARY.md and the Phase 20 scope-lock's exclusions.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-opportunity's createOpportunityForOwner()/suggestOffers().
// -----------------------------------------------------------------------

export { evaluateQualification } from './evaluator';
export type { QualificationEvaluatorInput } from './evaluator';

export { evaluateEvidencePresent, evaluateNeedDetected } from './rules';

export { createPgQualificationRepository } from './pgRepository';
export type { QualificationRepository } from './repository';

export {
  evaluateOpportunityQualification,
  evaluateQualificationForOwner,
  EVALUATOR_VERSION,
  getOpportunityQualification,
} from './service';
export type { QualificationDeps } from './service';

export {
  QUALIFICATION_CRITERIA,
  QUALIFICATION_STATES,
} from './types';
export type {
  QualificationCriterionId,
  QualificationCriterionResult,
  QualificationEvaluation,
  QualificationState,
  StoredQualification,
} from './types';
