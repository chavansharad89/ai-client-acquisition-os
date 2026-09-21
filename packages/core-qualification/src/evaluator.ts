import type { StoredResearchSignal } from '@acos/core-research';

import { evaluateEvidencePresent, evaluateNeedDetected } from './rules';
import type { QualificationEvaluation } from './types';

export interface QualificationEvaluatorInput {
  needDetected: boolean;
  signals: readonly StoredResearchSignal[];
}

/**
 * Pure, deterministic evaluation (R-37/R-39): the same input always
 * produces the same output — no I/O, no clock, no randomness, no LLM
 * call. Idempotency (R-39) follows directly from this purity; ./service.ts
 * is the only place a clock/persistence layer is involved.
 *
 * Short-circuits on NEED_DETECTED per Decision D1: when it fails,
 * EVIDENCE_PRESENT is not evaluated at all (not even recorded as
 * skipped) and the overall state is NOT_QUALIFIED.
 */
export function evaluateQualification(input: QualificationEvaluatorInput): QualificationEvaluation {
  const needDetected = evaluateNeedDetected(input.needDetected);

  if (!needDetected.satisfied) {
    return {
      state: 'NOT_QUALIFIED',
      criteria: [needDetected],
      evidenceSignalIds: [],
    };
  }

  const evidencePresent = evaluateEvidencePresent(input.signals);
  const criteria = [needDetected, evidencePresent];
  const evidenceSignalIds = Array.from(
    new Set(criteria.flatMap((criterion) => criterion.evidenceSignalIds)),
  );

  return {
    state: evidencePresent.satisfied ? 'QUALIFIED' : 'INSUFFICIENT_EVIDENCE',
    criteria,
    evidenceSignalIds,
  };
}
