import type { StoredResearchSignal } from '@acos/core-research';

import type { PersonalizationEvidenceItem } from './types';

// Evidence selection (Phase 21, R-44). Pure, deterministic: the same
// signals + qualification always select the same bounded evidence set.
// -----------------------------------------------------------------------
// Candidate pool (Phase 21 scope-lock Decision P4): the Prospect's
// currently-active, non-UNKNOWN ResearchSignals whose id is a member of
// the Qualification's own `evidenceSignalIds` — exactly the evidence
// @acos/core-qualification's `evaluateEvidencePresent()` already proved
// sufficient to qualify this Opportunity. Never a broader or
// independently-chosen pool: Personalization must not go looking for
// evidence Qualification did not already rely on (R-43: "do not perform
// new discovery/research").
//
// `evaluateEvidencePresent()` requires evidentiary.length > 0 for
// QUALIFIED, so `qualifiedEvidenceSignalIds` is always non-empty here —
// callers only reach this module once R-42's eligibility gate passed.
// -----------------------------------------------------------------------

/** Bounded set size (R-44 "a bounded set of relevant existing ResearchSignals"). */
export const MAX_PERSONALIZATION_EVIDENCE = 5;

/**
 * A live signal (`supersededAt === null`) that also carries an actual
 * claim (`classification !== 'UNKNOWN'`) — the same "evidentiary" filter
 * @acos/core-qualification's `rules.ts` already applies, for the same
 * reason: an UNKNOWN row has no signal text a claim could be traced to
 * (R-44: "UNKNOWN must not be converted into a factual claim").
 */
function isEvidentiary(signal: StoredResearchSignal): boolean {
  return signal.supersededAt === null && signal.classification !== 'UNKNOWN' && signal.signal !== null;
}

/**
 * Selects the bounded, ordered evidence set for a Personalization (R-44).
 * `signals` should be the Prospect's currently-active signals (e.g. from
 * `ResearchSignalRepository.listByProspect`); `qualifiedEvidenceSignalIds`
 * is the Qualification's own `evidenceSignalIds`. Ordered by confidence
 * descending (ties broken by id, for determinism), capped at
 * {@link MAX_PERSONALIZATION_EVIDENCE}.
 */
export function selectPersonalizationEvidence(
  signals: readonly StoredResearchSignal[],
  qualifiedEvidenceSignalIds: readonly string[],
): readonly PersonalizationEvidenceItem[] {
  const qualifiedIds = new Set(qualifiedEvidenceSignalIds);

  const candidates = signals.filter((signal) => isEvidentiary(signal) && qualifiedIds.has(signal.id));

  const ordered = [...candidates].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return ordered.slice(0, MAX_PERSONALIZATION_EVIDENCE).map((signal) => ({
    signalId: signal.id,
    field: signal.field,
    kind: signal.kind,
    classification: signal.classification,
    // isEvidentiary() already excludes signal === null.
    signal: signal.signal as string,
    confidence: signal.confidence,
    basis: signal.basis,
  }));
}
