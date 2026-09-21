// core-personalization (Phase 21, R-42..R-53)
// -----------------------------------------------------------------------
// Owns: Personalization — given a QUALIFIED Opportunity
// (@acos/core-qualification's output), selecting a bounded, traceable
// subset of that Prospect's existing ResearchSignals and generating a
// structured, evidence-backed artifact (opening context, value
// proposition, rationale) explaining what to say to this prospect —
// persisted as a durable, re-evaluable record (migration 0023). A
// downstream consumer of Opportunity/Qualification/ResearchSignal/
// ServiceProfile, never a second qualification or need-detection
// mechanism: it never calls `suggestOffers()`, never re-evaluates
// Qualification, never rewrites `Opportunity.needDetected`/`offer`, and
// never mutates a ResearchSignal or Qualification row.
//
// Deterministic only (Phase 21 scope-lock Decision P1) — no LLM call, no
// external fetch. See requirement/PHASE_21_PERSONALIZATION_SCOPE_LOCK.md
// for the full rule set and the decisions (P1-P4) behind it.
//
// Does NOT own Outreach, CRM, sending, or scheduling — see
// MVP_SCOPE_BOUNDARY.md and the Phase 21 scope-lock's exclusions.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-qualification's evaluateQualification()/
// @acos/core-opportunity's createOpportunityForOwner()/suggestOffers().
// -----------------------------------------------------------------------

export { MAX_PERSONALIZATION_EVIDENCE, selectPersonalizationEvidence } from './evidence';

export { generatePersonalization, GENERATOR_VERSION } from './generator';
export type { PersonalizationGeneratorInput } from './generator';

export { createPgPersonalizationRepository } from './pgRepository';
export type { PersonalizationRepository } from './repository';

export {
  evaluateOpportunityPersonalization,
  evaluatePersonalizationForOwner,
  getOpportunityPersonalization,
} from './service';
export type { PersonalizationDeps } from './service';

export { PERSONALIZATION_STATES } from './types';
export type {
  PersonalizationEvidenceItem,
  PersonalizationGeneration,
  PersonalizationState,
  StoredPersonalization,
} from './types';
