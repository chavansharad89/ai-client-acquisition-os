import { DiscoveryValidationError } from './errors';
import type { RunDiscoveryInput } from './types';

export const SEARCH_ID_MAX_LENGTH = 200;

/** Validates the untrusted shape of runDiscovery()'s input. Does not check that searchId exists or is owned — that is runDiscovery()'s job. */
export function validateRunDiscoveryInput(input: RunDiscoveryInput): { searchId: string } {
  if (typeof input.searchId !== 'string' || input.searchId.trim().length === 0) {
    throw new DiscoveryValidationError('searchId', 'required', 'searchId is required');
  }
  const searchId = input.searchId.trim();
  if (searchId.length > SEARCH_ID_MAX_LENGTH) {
    throw new DiscoveryValidationError(
      'searchId',
      'too-long',
      `searchId must be at most ${SEARCH_ID_MAX_LENGTH} characters`,
    );
  }

  return { searchId };
}
