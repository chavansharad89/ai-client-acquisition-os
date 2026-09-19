import { RunResearchValidationError } from './signalErrors';
import type { RunResearchInput } from './types';

export const PROSPECT_ID_MAX_LENGTH = 200;

/** Validates the untrusted shape of runResearch()'s input. Does not check that prospectId exists or is owned — that is runResearch()'s job. */
export function validateRunResearchInput(input: RunResearchInput): { prospectId: string } {
  if (typeof input.prospectId !== 'string' || input.prospectId.trim().length === 0) {
    throw new RunResearchValidationError('prospectId', 'required', 'prospectId is required');
  }
  const prospectId = input.prospectId.trim();
  if (prospectId.length > PROSPECT_ID_MAX_LENGTH) {
    throw new RunResearchValidationError(
      'prospectId',
      'too-long',
      `prospectId must be at most ${PROSPECT_ID_MAX_LENGTH} characters`,
    );
  }

  return { prospectId };
}
