import type { StoredResearchSignal } from '@acos/core-research';

import type { QualificationCriterionResult } from './types';

// Deterministic qualification rules (Phase 20, R-37). No LLM, no opaque
// score — every criterion is a pure function over already-persisted data.
// Two criteria only, evaluated in order, short-circuiting: NEED_DETECTED
// gates EVIDENCE_PRESENT. See requirement/PHASE_20_QUALIFICATION_SCOPE_
// LOCK.md's "R-37" section for why a minimum-confidence/fit threshold and
// a negative/disqualifying-evidence criterion are explicitly NOT part of
// this v1 rule set (decisions D2/D3 — no repository contract represents
// either concept today; inventing one would be a business-rule guess).
// -----------------------------------------------------------------------

/**
 * A live signal (`supersededAt === null`) that also carries an actual
 * claim (`classification !== 'UNKNOWN'`) — the same "evidentiary" filter
 * @acos/core-opportunity's `toOfferSignals`/@acos/core-research's
 * `toScoringSignals` already apply, for the same reason: an UNKNOWN row
 * has no signal text to reason about.
 */
function isEvidentiary(signal: StoredResearchSignal): boolean {
  return signal.supersededAt === null && signal.classification !== 'UNKNOWN';
}

/**
 * NEED_DETECTED (R-37, criterion 1): passes through the Opportunity's own
 * already-computed `needDetected` (@acos/core-opportunity's
 * `createOpportunityForOwner`, via `suggestOffers()`) unchanged.
 * Qualification never re-derives a need — Section 3 of the scope-lock:
 * "do not reinterpret research evidence to create a need Need Detection
 * did not detect."
 *
 * `needDetected=false` maps to a failed criterion (Decision D1): a
 * definite negative conclusion Need Detection already reached, not a
 * lack of evidence.
 */
export function evaluateNeedDetected(needDetected: boolean): QualificationCriterionResult {
  return {
    criterion: 'NEED_DETECTED',
    satisfied: needDetected,
    reason: needDetected
      ? 'a need was detected (suggestOffers() matched an offer)'
      : 'no need was detected (suggestOffers() found no matching offer)',
    evidenceSignalIds: [],
  };
}

/**
 * EVIDENCE_PRESENT (R-37, criterion 2): at least one currently-active,
 * evidentiary ResearchSignal exists for the Prospect. Only meaningful
 * once NEED_DETECTED has passed — see ./evaluator.ts for the
 * short-circuit. Catches the case `needDetected=true` was computed once,
 * at Opportunity-creation time, and never revisited: if every signal
 * that justified it is later superseded, this criterion fails and the
 * overall state becomes INSUFFICIENT_EVIDENCE rather than trusting a
 * possibly-stale flag (R-36).
 */
export function evaluateEvidencePresent(
  signals: readonly StoredResearchSignal[],
): QualificationCriterionResult {
  const evidentiary = signals.filter(isEvidentiary);
  const satisfied = evidentiary.length > 0;
  return {
    criterion: 'EVIDENCE_PRESENT',
    satisfied,
    reason: satisfied
      ? `${evidentiary.length} live, non-UNKNOWN signal(s) support the detected need`
      : 'no live, non-UNKNOWN ResearchSignal remains for this Prospect',
    evidenceSignalIds: evidentiary.map((signal) => signal.id),
  };
}
