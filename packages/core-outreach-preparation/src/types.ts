import type { PersonalizationEvidenceItem } from '@acos/core-personalization';

/**
 * Canonical Outreach Preparation domain model (Phase 22, R-54). Persisted
 * domain object for the Outreach Preparation layer — see ./repository and
 * migration 0024. Ownership is inherited through `opportunityId` ->
 * `opportunities.user_id` (DEC-008's fifth named exception, alongside
 * `research_signals`, `opportunity_scores`, `qualifications`, and
 * `personalizations`) — no `userId` field here.
 */

/**
 * Deliberately excludes any value that could imply transmission — no
 * `SENT`, `DELIVERED`, or `SCHEDULED` (R-54, R-58). `generateOutreachPreparation()`
 * (./generator.ts) always produces `READY_FOR_REVIEW` for v1, since
 * generation is synchronous and complete once a Personalization exists to
 * draw from — there is no intermediate state a v1 draft is ever caught in.
 * `PREPARED` is kept as a genuine second value for forward compatibility
 * (e.g. a future verification step between generation and
 * review-readiness), not exercised business logic invented now — mirrors
 * the Phase 21 scope-lock's identical Decision P3 for `PersonalizationState`.
 */
export const OUTREACH_PREPARATION_STATES = ['PREPARED', 'READY_FOR_REVIEW'] as const;
export type OutreachPreparationState = (typeof OUTREACH_PREPARATION_STATES)[number];

/** A persisted outreach_preparations row (migration 0024). One current row per Opportunity. */
export interface StoredOutreachPreparation {
  id: string;
  opportunityId: string;
  prospectId: string;
  /**
   * The exact `personalizations.id` this draft was generated from (R-56
   * provenance) — never a snapshot copy that could drift from the
   * Personalization it was derived from.
   */
  sourcePersonalizationId: string;
  state: OutreachPreparationState;
  subjectLine: string;
  messageBody: string;
  callToAction: string;
  /**
   * Copied unmodified from the source Personalization's own `evidence`
   * (R-56) — never re-derived from ResearchSignal, never independently
   * selected or widened.
   */
  evidence: readonly PersonalizationEvidenceItem[];
  generatorVersion: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** The generator's pure output, before an id/timestamps are assigned by persistence. */
export interface OutreachPreparationGeneration {
  subjectLine: string;
  messageBody: string;
  callToAction: string;
  evidence: readonly PersonalizationEvidenceItem[];
}
