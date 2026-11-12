// Pure logic backing apps/web/app/activate/[token]/page.tsx, split out so
// it can be unit-tested without a DOM rendering harness — this repo's
// vitest config runs apps/web tests under environment: 'node' with no
// @testing-library/react, the same reason checkout/machine.ts and
// checkout/request.ts are pure modules consumed (but not re-tested) by
// CheckoutPanel.tsx.
//
// This file owns ONLY client-side presentation concerns: form
// validation, the request body shape, and mapping an HTTP
// status/body pair to a UI outcome. It has no opinion on activation-
// token semantics, eligibility, or single-use behavior — those live
// entirely in @acos/core-identity and apps/web/src/server/activationService.ts
// and are not duplicated here.

export interface ActivationSetupFields {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  /** '' means "not provided" — optional per AUTH-PO-03. */
  dateOfBirth: string;
}

export type ActivationFieldName = 'firstName' | 'lastName' | 'phone' | 'password' | 'confirmPassword';
export type ActivationFieldErrors = Partial<Record<ActivationFieldName, string>>;

const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;

/**
 * Mirrors the server's own bounds (activationService.ts's
 * validation-error branch, core-identity's validatePassword) so a
 * client-side pass rarely disagrees with the server — important here
 * because the activation token is single-use and a server-side
 * validation-error still consumes it (see consumeClientFinderActivation).
 */
export function validateActivationSetup(fields: ActivationSetupFields): ActivationFieldErrors {
  const errors: ActivationFieldErrors = {};
  if (!fields.firstName.trim() || fields.firstName.trim().length > 200) {
    errors.firstName = 'First name is required.';
  }
  if (!fields.lastName.trim() || fields.lastName.trim().length > 200) {
    errors.lastName = 'Last name is required.';
  }
  if (!fields.phone.trim() || fields.phone.trim().length > 32 || !PHONE_PATTERN.test(fields.phone.trim())) {
    errors.phone = 'Enter a phone number with country code, digits only.';
  }
  if (fields.password.length < 8 || fields.password.length > 256) {
    errors.password = 'Password must be 8–256 characters.';
  }
  if (fields.confirmPassword !== fields.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

/**
 * The exact body sent to POST /api/auth/activation/consume. Never
 * includes `email`, `userId`, or `id` — the route rejects a request
 * body containing any of those outright (AUTH-PO-15/16, consume
 * route's own protocol check) — and never includes `confirmPassword`,
 * which is a client-only check.
 */
export function buildActivationConsumeRequestBody(
  token: string,
  fields: ActivationSetupFields,
): Record<string, unknown> {
  return {
    token,
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    phone: fields.phone.trim(),
    password: fields.password,
    ...(fields.dateOfBirth ? { dateOfBirth: fields.dateOfBirth } : {}),
  };
}

export const ACTIVATION_BLOCKED_MESSAGE =
  'This activation link has already been used and cannot complete a second time. ' +
  'If you still need access, check your purchase email for a valid activation link, or contact support.';

export type ActivationConsumeOutcome =
  | { kind: 'activated' }
  | { kind: 'blocked'; message: string }
  | { kind: 'retry'; message: string };

/**
 * Maps the consume route's HTTP response to a UI outcome.
 *
 * 400 (validation-error) and 410 (rejected) are DELIBERATELY collapsed
 * into the same terminal 'blocked' outcome, with the same fixed
 * message, rather than surfacing the server's specific `error` text:
 * the token is already consumed by the time either response is
 * possible (consumeClientFinderActivation marks it used before it
 * checks setup fields), so there is nothing left to retry, and showing
 * two different messages for "validation failed" vs "rejected" would
 * reveal more about which branch the token hit than the activation
 * system's own enumeration-safety design intends to expose.
 */
export function mapActivationConsumeResponse(status: number): ActivationConsumeOutcome {
  if (status >= 200 && status < 300) return { kind: 'activated' };
  if (status === 400 || status === 410) return { kind: 'blocked', message: ACTIVATION_BLOCKED_MESSAGE };
  if (status === 429) return { kind: 'retry', message: 'Too many attempts. Please wait a moment and try again.' };
  return { kind: 'retry', message: 'Something went wrong. Please try again.' };
}
