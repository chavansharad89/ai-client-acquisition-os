import type { Classification, ResearchSourceKind } from '@acos/core-research';

/**
 * Canonical Personalization domain model (Phase 21, R-45). Persisted
 * domain object for the Personalization layer — see ./repository and
 * migration 0023. Ownership is inherited through `opportunityId` ->
 * `opportunities.user_id` (DEC-008's fourth named exception, alongside
 * `research_signals`, `opportunity_scores`, and `qualifications`) — no
 * `userId` field here.
 */

/**
 * A single value for v1 (see the Phase 21 scope-lock's Decision P3): a
 * row is only ever written once R-42's eligibility gate (Qualification
 * state === QUALIFIED) already passed, so there is no second state this
 * generator itself produces. Kept as a field, not a boolean/literal,
 * purely so `StoredPersonalization` has an explicit, forward-compatible
 * extension point without inventing an unspecified business rule now.
 */
export const PERSONALIZATION_STATES = ['GENERATED'] as const;
export type PersonalizationState = (typeof PERSONALIZATION_STATES)[number];

/**
 * One ResearchSignal selected as evidence (R-44). Preserves
 * classification/kind/field/signal/confidence/basis unchanged from the
 * StoredResearchSignal it was selected from — never rewritten, never
 * reclassified. `signal` is never null here: UNKNOWN rows (no claim
 * text) are excluded from selection entirely (./evidence.ts).
 */
export interface PersonalizationEvidenceItem {
  signalId: string;
  field: string;
  kind: ResearchSourceKind;
  classification: Classification;
  signal: string;
  confidence: number;
  basis: string | null;
}

/** A persisted personalizations row (migration 0023). One current row per Opportunity. */
export interface StoredPersonalization {
  id: string;
  opportunityId: string;
  prospectId: string;
  state: PersonalizationState;
  /** Denormalised from the Opportunity's own offer at generation time (R-47) — never a new recommendation. */
  offerService: string;
  openingContext: string;
  valueProposition: string;
  /** Human-readable, observability only (mirrors QualificationCriterionResult.reason) — never parsed back into a decision. */
  personalizationRationale: string;
  evidence: readonly PersonalizationEvidenceItem[];
  generatorVersion: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** The generator's pure output, before an id/timestamps are assigned by persistence. */
export interface PersonalizationGeneration {
  offerService: string;
  openingContext: string;
  valueProposition: string;
  personalizationRationale: string;
  evidence: readonly PersonalizationEvidenceItem[];
}
