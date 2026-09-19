import { FeedbackValidationError } from './errors';
import type { RecordFeedbackInput } from './types';

// Domain validation for recordFeedback()'s input (R-21).
// -----------------------------------------------------------------------
// OQ-5 resolved: `reason` is free-form text, never a closed set. This
// validates only syntactic shape (present, a string, within a generous
// bound) — the same convention every other free-text field in this
// repository uses (see @acos/core-service-profile's `rationale`). It
// must never restrict, classify, or rewrite the semantic content of a
// caller-supplied reason.
// -----------------------------------------------------------------------

export const FEEDBACK_REASON_MAX_LENGTH = 1000;

/** Validates the untrusted shape of recordFeedback()'s input. Does not check that opportunityId exists or is owned — that is recordFeedback()'s job. */
export function validateRecordFeedbackInput(input: RecordFeedbackInput): RecordFeedbackInput {
  if (typeof input.useful !== 'boolean') {
    throw new FeedbackValidationError('useful', 'not-boolean', 'useful must be a boolean');
  }
  if (typeof input.reason !== 'string' || input.reason.trim().length === 0) {
    throw new FeedbackValidationError('reason', 'required', 'reason is required');
  }
  const reason = input.reason.trim();
  if (reason.length > FEEDBACK_REASON_MAX_LENGTH) {
    throw new FeedbackValidationError(
      'reason',
      'too-long',
      `reason must be at most ${FEEDBACK_REASON_MAX_LENGTH} characters`,
    );
  }

  return { useful: input.useful, reason };
}
