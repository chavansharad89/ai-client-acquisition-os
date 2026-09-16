import { CreateOpportunityValidationError } from './errors';
import type { CreateOpportunityInput } from './types';

export const PROSPECT_ID_MAX_LENGTH = 200;

/** Validates the untrusted shape of createOpportunity()'s input. Does not check that prospectId exists or is owned — that is createOpportunity()'s job. */
export function validateCreateOpportunityInput(input: CreateOpportunityInput): {
  prospectId: string;
} {
  if (typeof input.prospectId !== 'string' || input.prospectId.trim().length === 0) {
    throw new CreateOpportunityValidationError('prospectId', 'required', 'prospectId is required');
  }
  const prospectId = input.prospectId.trim();
  if (prospectId.length > PROSPECT_ID_MAX_LENGTH) {
    throw new CreateOpportunityValidationError(
      'prospectId',
      'too-long',
      `prospectId must be at most ${PROSPECT_ID_MAX_LENGTH} characters`,
    );
  }

  return { prospectId };
}
