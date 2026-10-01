import type { StoredCategoryPlausibilityDetermination, StoredResearchSignal } from '@acos/core-research';

import { evaluateCategoryPlausible, evaluateEvidencePresent, evaluateNeedDetected } from './rules';
import type { QualificationEvaluation, QualificationState } from './types';

export interface QualificationEvaluatorInput {
  needDetected: boolean;
  signals: readonly StoredResearchSignal[];
  /**
   * The current Search + Prospect category-plausibility determination
   * (Path 2, D4/D6) — `null` when Research has not produced one yet.
   * ./service.ts resolves this via @acos/core-research's
   * `getCurrentByProspectId`, never an arbitrary/latest-across-Searches
   * lookup (D6).
   */
  categoryPlausibility: StoredCategoryPlausibilityDetermination | null;
}

/**
 * Pure, deterministic evaluation (R-37/R-39): the same input always
 * produces the same output — no I/O, no clock, no randomness, no LLM
 * call. Idempotency (R-39) follows directly from this purity; ./service.ts
 * is the only place a clock/persistence layer is involved.
 *
 * Short-circuits EVIDENCE_PRESENT on NEED_DETECTED per Decision D1: when
 * NEED_DETECTED fails, EVIDENCE_PRESENT is not evaluated at all (not even
 * recorded as skipped) and the overall state is NOT_QUALIFIED.
 * CATEGORY_PLAUSIBLE (Path 2, D4) is deliberately NOT part of that
 * short-circuit — it is "distinct... not routed through Need Detection"
 * (D4's own wording), so it is evaluated unconditionally, in both
 * branches, purely for observability (E5); it never overrides
 * NOT_QUALIFIED into a different state on its own once NEED_DETECTED has
 * already failed.
 */
export function evaluateQualification(input: QualificationEvaluatorInput): QualificationEvaluation {
  const needDetected = evaluateNeedDetected(input.needDetected);
  const categoryPlausible = evaluateCategoryPlausible(input.categoryPlausibility);

  if (!needDetected.satisfied) {
    return {
      state: 'NOT_QUALIFIED',
      criteria: [needDetected, categoryPlausible],
      evidenceSignalIds: [],
    };
  }

  const evidencePresent = evaluateEvidencePresent(input.signals);
  const criteria = [needDetected, evidencePresent, categoryPlausible];
  const evidenceSignalIds = Array.from(
    new Set(criteria.flatMap((criterion) => criterion.evidenceSignalIds)),
  );

  // D5's three-way behavior: MATCH lets the pre-existing evidence-driven
  // outcome stand; MISMATCH fails qualification outright (NOT_QUALIFIED);
  // UNKNOWN fails/holds (INSUFFICIENT_EVIDENCE — the existing state
  // already meaning "evidence exists but is not sufficient", the closer
  // fit per E6, since no new QualificationState is introduced).
  const fit = input.categoryPlausibility?.aggregateResult ?? 'UNKNOWN';
  const state: QualificationState = !evidencePresent.satisfied
    ? 'INSUFFICIENT_EVIDENCE'
    : fit === 'MATCH'
      ? 'QUALIFIED'
      : fit === 'MISMATCH'
        ? 'NOT_QUALIFIED'
        : 'INSUFFICIENT_EVIDENCE';

  return { state, criteria, evidenceSignalIds };
}
