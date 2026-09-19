import { describe, expect, it } from 'vitest';

import { ServiceProfileValidationError } from './errors';
import type { ServiceProfileInput } from './types';
import { RULE_FIELD_MAX_ITEMS, validateServiceProfileInput } from './validation';

// UNIT tests — pure function, no I/O.

function validInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'Content writing',
    targetCustomer: 'D2C restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content.',
    ...overrides,
  };
}

describe('valid input', () => {
  it('passes through trimmed fields unchanged', () => {
    const result = validateServiceProfileInput(validInput({ service: '  Content writing  ' }));
    expect(result.service).toBe('Content writing');
    expect(result.minProjectValuePaise).toBe(3_000_000);
  });

  it('accepts a minimum project value of exactly zero', () => {
    const result = validateServiceProfileInput(validInput({ minProjectValuePaise: 0 }));
    expect(result.minProjectValuePaise).toBe(0);
  });
});

describe('required fields', () => {
  it.each(['service', 'targetCustomer', 'geography', 'rationale'] as const)(
    'rejects an empty %s',
    (field) => {
      expect(() => validateServiceProfileInput(validInput({ [field]: '' }))).toThrow(
        ServiceProfileValidationError,
      );
    },
  );

  it.each(['service', 'targetCustomer', 'geography', 'rationale'] as const)(
    'rejects a missing %s',
    (field) => {
      const input: Record<string, unknown> = { ...validInput() };
      delete input[field];
      expect(() => validateServiceProfileInput(input as unknown as ServiceProfileInput)).toThrow(
        ServiceProfileValidationError,
      );
    },
  );
});

describe('minProjectValuePaise', () => {
  it('rejects a negative value', () => {
    expect(() => validateServiceProfileInput(validInput({ minProjectValuePaise: -1 }))).toThrow(
      ServiceProfileValidationError,
    );
  });

  it('rejects a non-integer value', () => {
    expect(() => validateServiceProfileInput(validInput({ minProjectValuePaise: 100.5 }))).toThrow(
      ServiceProfileValidationError,
    );
  });

  it('rejects a non-numeric value without coercing it', () => {
    const input = validInput({ minProjectValuePaise: '3000' as unknown as number });
    expect(() => validateServiceProfileInput(input)).toThrow(ServiceProfileValidationError);
  });
});

describe('triggers / keywords bounds', () => {
  it('rejects too many items', () => {
    const tooMany = Array.from({ length: RULE_FIELD_MAX_ITEMS + 1 }, (_, i) => `t${i}`);
    expect(() => validateServiceProfileInput(validInput({ triggers: tooMany }))).toThrow(
      ServiceProfileValidationError,
    );
  });

  it('rejects an oversized item', () => {
    const oversized = 'x'.repeat(101);
    expect(() => validateServiceProfileInput(validInput({ keywords: [oversized] }))).toThrow(
      ServiceProfileValidationError,
    );
  });

  it('rejects a non-array value', () => {
    const input = validInput({ triggers: 'JOB_POST' as unknown as string[] });
    expect(() => validateServiceProfileInput(input)).toThrow(ServiceProfileValidationError);
  });

  it('rejects an empty-string item', () => {
    expect(() => validateServiceProfileInput(validInput({ keywords: [''] }))).toThrow(
      ServiceProfileValidationError,
    );
  });
});

describe('rationale bounds', () => {
  it('rejects an oversized rationale', () => {
    const input = validInput({ rationale: 'x'.repeat(1001) });
    expect(() => validateServiceProfileInput(input)).toThrow(ServiceProfileValidationError);
  });
});
