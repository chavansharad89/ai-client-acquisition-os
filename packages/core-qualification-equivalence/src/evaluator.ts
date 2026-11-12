import { evaluateMinimumValueMatch, evaluateServiceMatch, evaluateTargetCustomerMatch } from './rules';
import type {
  QualificationEquivalenceResult,
  QualificationEquivalenceSubject,
  SearchSnapshot,
} from './types';

/**
 * Pure, deterministic, fail-soft (ED-10/B-3): never throws, and a
 * criterion this evaluator cannot decide resolves to 'UNKNOWN' rather
 * than failing the whole evaluation. No I/O, no clock — every input it
 * needs is passed in.
 */
export function evaluateQualificationEquivalence(
  snapshot: SearchSnapshot,
  subject: QualificationEquivalenceSubject,
): QualificationEquivalenceResult {
  const criteria = [
    evaluateServiceMatch(snapshot, subject),
    evaluateTargetCustomerMatch(snapshot, subject),
    evaluateMinimumValueMatch(snapshot, subject),
  ];

  const anyFalse = criteria.some((c) => c.satisfied === false);
  const anyUnknown = criteria.some((c) => c.satisfied === 'UNKNOWN');

  const match: boolean | 'UNKNOWN' = anyFalse ? false : anyUnknown ? 'UNKNOWN' : true;

  return { match, criteria };
}
