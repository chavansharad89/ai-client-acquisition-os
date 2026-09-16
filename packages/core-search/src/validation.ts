import { SearchValidationError } from './errors';
import type { CreateSearchInput } from './types';

export const SERVICE_PROFILE_ID_MAX_LENGTH = 200;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 200;

/** Validates the untrusted shape of createSearch()'s input. Does not check that serviceProfileId exists or is owned — that is createSearch()'s job. */
export function validateCreateSearchInput(input: CreateSearchInput): {
  serviceProfileId: string;
  idempotencyKey: string | null;
} {
  if (typeof input.serviceProfileId !== 'string' || input.serviceProfileId.trim().length === 0) {
    throw new SearchValidationError('serviceProfileId', 'required', 'serviceProfileId is required');
  }
  const serviceProfileId = input.serviceProfileId.trim();
  if (serviceProfileId.length > SERVICE_PROFILE_ID_MAX_LENGTH) {
    throw new SearchValidationError(
      'serviceProfileId',
      'too-long',
      `serviceProfileId must be at most ${SERVICE_PROFILE_ID_MAX_LENGTH} characters`,
    );
  }

  if (input.idempotencyKey !== undefined && typeof input.idempotencyKey !== 'string') {
    throw new SearchValidationError(
      'idempotencyKey',
      'required',
      'idempotencyKey must be a string when supplied',
    );
  }
  const trimmedKey = input.idempotencyKey?.trim() || null;
  if (trimmedKey && trimmedKey.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new SearchValidationError(
      'idempotencyKey',
      'too-long',
      `idempotencyKey must be at most ${IDEMPOTENCY_KEY_MAX_LENGTH} characters`,
    );
  }

  return { serviceProfileId, idempotencyKey: trimmedKey };
}
