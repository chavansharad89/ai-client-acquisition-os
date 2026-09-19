import { ServiceProfileValidationError } from './errors';
import type { ServiceProfileFields, ServiceProfileInput } from './types';

// Domain validation for the seven ServiceProfile fields.
// -----------------------------------------------------------------------
// Bounds are deliberately generous, bounded limits — not business rules
// V2.1 does not specify. No silent coercion: a value that fails a check
// throws rather than being trimmed/clamped/defaulted into something valid.
// -----------------------------------------------------------------------

export const SERVICE_MAX_LENGTH = 200;
export const TARGET_CUSTOMER_MAX_LENGTH = 200;
export const GEOGRAPHY_MAX_LENGTH = 200;
export const RATIONALE_MAX_LENGTH = 1000;
export const RULE_FIELD_MAX_ITEMS = 25;
export const RULE_ITEM_MAX_LENGTH = 100;

function requireNonEmptyString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new ServiceProfileValidationError(field, 'required', `${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ServiceProfileValidationError(field, 'required', `${field} must not be empty`);
  }
  if (trimmed.length > maxLength) {
    throw new ServiceProfileValidationError(
      field,
      'too-long',
      `${field} must be at most ${maxLength} characters`,
    );
  }
  return trimmed;
}

function requireNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ServiceProfileValidationError(field, 'not-integer', `${field} must be an integer`);
  }
  if (value < 0) {
    throw new ServiceProfileValidationError(field, 'negative', `${field} must not be negative`);
  }
  return value;
}

function requireStringList(
  value: unknown,
  field: string,
  maxItems: number,
  maxItemLength: number,
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new ServiceProfileValidationError(field, 'not-an-array', `${field} must be an array`);
  }
  if (value.length > maxItems) {
    throw new ServiceProfileValidationError(
      field,
      'too-many-items',
      `${field} must have at most ${maxItems} items`,
    );
  }
  return value.map((item) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new ServiceProfileValidationError(
        field,
        'invalid-item',
        `${field} items must be non-empty strings`,
      );
    }
    const trimmed = item.trim();
    if (trimmed.length > maxItemLength) {
      throw new ServiceProfileValidationError(
        field,
        'too-long',
        `${field} items must be at most ${maxItemLength} characters`,
      );
    }
    return trimmed;
  });
}

/**
 * Validates an untrusted {@link ServiceProfileInput} and returns the
 * trimmed, checked {@link ServiceProfileFields}. Throws
 * {@link ServiceProfileValidationError} on the first violation found.
 */
export function validateServiceProfileInput(input: ServiceProfileInput): ServiceProfileFields {
  const service = requireNonEmptyString(input.service, 'service', SERVICE_MAX_LENGTH);
  const targetCustomer = requireNonEmptyString(
    input.targetCustomer,
    'targetCustomer',
    TARGET_CUSTOMER_MAX_LENGTH,
  );
  const geography = requireNonEmptyString(input.geography, 'geography', GEOGRAPHY_MAX_LENGTH);
  const minProjectValuePaise = requireNonNegativeInteger(
    input.minProjectValuePaise,
    'minProjectValuePaise',
  );
  const triggers = requireStringList(
    input.triggers,
    'triggers',
    RULE_FIELD_MAX_ITEMS,
    RULE_ITEM_MAX_LENGTH,
  );
  const keywords = requireStringList(
    input.keywords,
    'keywords',
    RULE_FIELD_MAX_ITEMS,
    RULE_ITEM_MAX_LENGTH,
  );
  const rationale = requireNonEmptyString(input.rationale, 'rationale', RATIONALE_MAX_LENGTH);

  return {
    service,
    targetCustomer,
    geography,
    minProjectValuePaise,
    triggers,
    keywords,
    rationale,
  };
}
