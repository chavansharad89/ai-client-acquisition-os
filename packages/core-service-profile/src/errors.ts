export type ServiceProfileValidationReason =
  | 'required'
  | 'too-long'
  | 'not-integer'
  | 'negative'
  | 'not-an-array'
  | 'too-many-items'
  | 'invalid-item'
  | 'not-in-vocabulary';

/**
 * Thrown by {@link validateServiceProfileInput} for any untrusted value
 * that fails validation. Callers at a system boundary are expected to
 * catch this and respond 400 rather than let it surface as a 500 — see
 * @acos/catalog's InvalidProductIdError for the same convention.
 */
export class ServiceProfileValidationError extends Error {
  readonly field: string;
  readonly reason: ServiceProfileValidationReason;

  constructor(field: string, reason: ServiceProfileValidationReason, message: string) {
    super(message);
    this.name = 'ServiceProfileValidationError';
    this.field = field;
    this.reason = reason;
  }
}
