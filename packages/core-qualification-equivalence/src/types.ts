/**
 * PCG-4's qualification-equivalence evaluator (ED-10/B-3), authorized
 * under CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
 *
 * Deliberately disjoint from @acos/core-qualification: that package
 * evaluates NEED_DETECTED/EVIDENCE_PRESENT/CATEGORY_PLAUSIBLE from
 * research signals and a category-plausibility determination. This
 * evaluator answers a narrower, different question — "does this
 * Opportunity's recorded offer match what the Search that found it was
 * actually looking for?" — from the Search's own immutable parameter
 * snapshot (service, target_customer, min_project_value_paise — the
 * `searches` row, @acos/core-search), never from research signals or a
 * category-plausibility determination (B-3: search snapshot only).
 */

/** The immutable Search-parameter snapshot (@acos/core-search's StoredSearch.parameters) — the criteria being matched against. */
export interface SearchSnapshot {
  service: string;
  targetCustomer: string;
  geography: string;
  minProjectValuePaise: number;
}

/**
 * What is known about the Opportunity being evaluated against that
 * snapshot. Each field is independently nullable because an Opportunity
 * may not have reached the pipeline stage that populates it yet — fail
 * soft (UNKNOWN), never throw, on a missing field.
 */
export interface QualificationEquivalenceSubject {
  /** The recommended offer's service/product label, or null if no offer was recommended (AC-14). */
  offerService: string | null;
  /** The recommended offer's estimated deal value, or null. */
  offerEstimatedValuePaise: number | null;
  /** The business's observed target-customer category, or null if not yet determined. */
  observedTargetCustomer: string | null;
}

export const QUALIFICATION_EQUIVALENCE_CRITERIA = [
  'SERVICE_MATCH',
  'TARGET_CUSTOMER_MATCH',
  'MINIMUM_VALUE_MATCH',
] as const;
export type QualificationEquivalenceCriterionId = (typeof QUALIFICATION_EQUIVALENCE_CRITERIA)[number];

/** satisfied is 'UNKNOWN' when the subject lacks the data this criterion needs — never thrown. */
export interface QualificationEquivalenceCriterionResult {
  criterion: QualificationEquivalenceCriterionId;
  satisfied: boolean | 'UNKNOWN';
  /** Human-readable, observability only — never parsed back into a decision. */
  reason: string;
}

/**
 * match: true only if every criterion is satisfied; false if any
 * criterion is definitively unsatisfied; 'UNKNOWN' if nothing is
 * unsatisfied but at least one criterion could not be evaluated
 * (fail-soft — PCG-4's numerator (B-7) treats anything short of a firm
 * `true` as not a match, conjunctively with feedback.useful).
 */
export interface QualificationEquivalenceResult {
  match: boolean | 'UNKNOWN';
  criteria: readonly QualificationEquivalenceCriterionResult[];
}
