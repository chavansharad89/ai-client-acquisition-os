import type { PersonalizationEvidenceItem } from '@acos/core-personalization';

/**
 * Canonical Follow-Up Preparation domain model (Phase 23, R-64/R-65).
 * Persisted domain object for the Follow-Up Preparation layer — see
 * ./repository and migration 0025. Ownership is inherited through
 * `opportunityId` -> `opportunities.user_id` (DEC-008's sixth named
 * exception, alongside `research_signals`, `opportunity_scores`,
 * `qualifications`, `personalizations`, and `outreach_preparations`) — no
 * `userId` field here.
 */

/**
 * Deliberately excludes any value that could imply transmission — no
 * `SENT`, `DELIVERED`, or `SCHEDULED` (R-67, R-68). `generateFollowUpPreparation()`
 * (./generator.ts) always produces `READY_FOR_REVIEW` for v1, mirroring
 * @acos/core-outreach-preparation's own Decision O1: generation is
 * synchronous and complete once an Outreach Preparation exists to draw
 * from, so there is no intermediate state a v1 draft is ever caught in.
 * `PREPARED` is kept as a genuine second value for forward compatibility,
 * not exercised business logic invented now.
 */
export const FOLLOW_UP_PREPARATION_STATES = ['PREPARED', 'READY_FOR_REVIEW'] as const;
export type FollowUpPreparationState = (typeof FOLLOW_UP_PREPARATION_STATES)[number];

/** A persisted follow_up_preparations row (migration 0025). One current row per Opportunity. */
export interface StoredFollowUpPreparation {
  id: string;
  opportunityId: string;
  prospectId: string;
  /**
   * The exact `outreach_preparations.id` this follow-up was generated
   * from (R-63 provenance) — never a snapshot copy that could drift from
   * the Outreach Preparation it was derived from.
   */
  sourceOutreachPreparationId: string;
  state: FollowUpPreparationState;
  followUpContext: string;
  followUpContent: string;
  rationale: string;
  /**
   * Copied unmodified from the source Outreach Preparation's own
   * `evidence` (R-63) — never re-derived from ResearchSignal or
   * Personalization, never independently selected or widened.
   */
  evidence: readonly PersonalizationEvidenceItem[];
  generatorVersion: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** The generator's pure output, before an id/timestamps are assigned by persistence. */
export interface FollowUpPreparationGeneration {
  followUpContext: string;
  followUpContent: string;
  rationale: string;
  evidence: readonly PersonalizationEvidenceItem[];
}
