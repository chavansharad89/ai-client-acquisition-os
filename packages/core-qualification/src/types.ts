/**
 * Canonical Qualification domain model (Phase 20, R-35). Persisted
 * domain object for the Qualification layer — see ./repository and
 * migration 0022. Ownership is inherited through `opportunityId` ->
 * `opportunities.user_id` (DEC-008's third named exception, alongside
 * `research_signals` and `opportunity_scores`) — no `userId` field here.
 */

export const QUALIFICATION_STATES = ['QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE'] as const;
export type QualificationState = (typeof QUALIFICATION_STATES)[number];

export const QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT'] as const;
export type QualificationCriterionId = (typeof QUALIFICATION_CRITERIA)[number];

/**
 * One rule's outcome (R-37). `evidenceSignalIds` are the
 * `StoredResearchSignal` ids this criterion's decision rests on — empty
 * when the criterion found none (e.g. EVIDENCE_PRESENT failing).
 */
export interface QualificationCriterionResult {
  criterion: QualificationCriterionId;
  satisfied: boolean;
  /** Human-readable, observability only (R-40) — never parsed back into a decision. */
  reason: string;
  evidenceSignalIds: readonly string[];
}

/** A persisted qualifications row (migration 0022). One current row per Opportunity. */
export interface StoredQualification {
  id: string;
  opportunityId: string;
  prospectId: string;
  state: QualificationState;
  criteria: readonly QualificationCriterionResult[];
  /** Union of every criterion's evidenceSignalIds — the full evidence set considered. */
  evidenceSignalIds: readonly string[];
  evaluatorVersion: string;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** The evaluator's pure output, before an id/timestamps are assigned by persistence. */
export interface QualificationEvaluation {
  state: QualificationState;
  criteria: readonly QualificationCriterionResult[];
  evidenceSignalIds: readonly string[];
}
