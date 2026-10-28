import { describe, expect, it } from 'vitest';

import {
  ACTIVATION_BLOCKED_MESSAGE,
  buildActivationConsumeRequestBody,
  mapActivationConsumeResponse,
  validateActivationSetup,
  type ActivationSetupFields,
} from './activationForm';

// Unit coverage for the activation page's pure logic. The page itself
// (apps/web/app/activate/[token]/page.tsx) is not rendered here — this
// repo's vitest config runs apps/web tests under environment: 'node'
// with no @testing-library/react, so component-rendering tests are not
// available; this mirrors how checkout/machine.test.ts and
// checkout/request.test.ts cover CheckoutPanel.tsx's logic without
// rendering it.

const validFields: ActivationSetupFields = {
  firstName: 'Asha',
  lastName: 'Rao',
  phone: '+919876543210',
  password: 'correct-horse-battery',
  confirmPassword: 'correct-horse-battery',
  dateOfBirth: '',
};

describe('validateActivationSetup', () => {
  it('passes a fully filled, well-formed form (the new/passwordless account path)', () => {
    expect(validateActivationSetup(validFields)).toEqual({});
  });

  it('requires firstName, lastName, and phone', () => {
    const errors = validateActivationSetup({ ...validFields, firstName: '', lastName: '  ', phone: '' });
    expect(errors.firstName).toBeDefined();
    expect(errors.lastName).toBeDefined();
    expect(errors.phone).toBeDefined();
  });

  it('rejects a phone number that fails the pattern', () => {
    const errors = validateActivationSetup({ ...validFields, phone: 'not-a-phone' });
    expect(errors.phone).toBeDefined();
  });

  it('rejects a password shorter than 8 characters (mirrors core-identity MIN_PASSWORD_LENGTH)', () => {
    const errors = validateActivationSetup({ ...validFields, password: 'short', confirmPassword: 'short' });
    expect(errors.password).toBeDefined();
  });

  it('rejects a password longer than 256 characters (mirrors core-identity validatePassword)', () => {
    const long = 'a'.repeat(257);
    const errors = validateActivationSetup({ ...validFields, password: long, confirmPassword: long });
    expect(errors.password).toBeDefined();
  });

  it('rejects mismatched password/confirmPassword', () => {
    const errors = validateActivationSetup({ ...validFields, confirmPassword: 'different-password' });
    expect(errors.confirmPassword).toBeDefined();
    expect(errors.password).toBeUndefined();
  });

  it('does not require dateOfBirth (AUTH-PO-03: optional)', () => {
    expect(validateActivationSetup({ ...validFields, dateOfBirth: '' })).toEqual({});
  });
});

describe('buildActivationConsumeRequestBody', () => {
  it('includes the token and trimmed setup fields', () => {
    const body = buildActivationConsumeRequestBody('tok_123', {
      ...validFields,
      firstName: '  Asha  ',
      lastName: '  Rao  ',
      phone: ' +919876543210 ',
    });
    expect(body).toMatchObject({
      token: 'tok_123',
      firstName: 'Asha',
      lastName: 'Rao',
      phone: '+919876543210',
      password: validFields.password,
    });
  });

  it('never includes confirmPassword — it is a client-only check', () => {
    const body = buildActivationConsumeRequestBody('tok_123', validFields);
    expect(body).not.toHaveProperty('confirmPassword');
  });

  it('never includes email, userId, or id — the route rejects any request body containing one', () => {
    const body = buildActivationConsumeRequestBody('tok_123', validFields);
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('userId');
    expect(body).not.toHaveProperty('id');
  });

  it('omits dateOfBirth when not provided', () => {
    const body = buildActivationConsumeRequestBody('tok_123', { ...validFields, dateOfBirth: '' });
    expect(body).not.toHaveProperty('dateOfBirth');
  });

  it('includes dateOfBirth when provided', () => {
    const body = buildActivationConsumeRequestBody('tok_123', { ...validFields, dateOfBirth: '1990-05-20' });
    expect(body).toMatchObject({ dateOfBirth: '1990-05-20' });
  });

  it('sends the identical shape regardless of whether the account turns out to be new or existing — the client cannot know in advance', () => {
    const newAccountAttempt = buildActivationConsumeRequestBody('tok_new', validFields);
    const existingAccountAttempt = buildActivationConsumeRequestBody('tok_existing', validFields);
    expect({ ...newAccountAttempt, token: undefined }).toEqual({ ...existingAccountAttempt, token: undefined });
  });
});

describe('mapActivationConsumeResponse', () => {
  it('maps 2xx to activated (covers both the new-account and existing-password-account success paths)', () => {
    expect(mapActivationConsumeResponse(200)).toEqual({ kind: 'activated' });
    expect(mapActivationConsumeResponse(201)).toEqual({ kind: 'activated' });
  });

  it('maps 410 (rejected token) to a terminal blocked outcome with the generic message', () => {
    expect(mapActivationConsumeResponse(410)).toEqual({ kind: 'blocked', message: ACTIVATION_BLOCKED_MESSAGE });
  });

  it('maps 400 (validation-error) to the SAME terminal blocked outcome as 410', () => {
    // The token is already single-use consumed by the time either
    // response is possible, so there is nothing left to retry, and the
    // UI must not reveal which of the two branches was hit.
    expect(mapActivationConsumeResponse(400)).toEqual({ kind: 'blocked', message: ACTIVATION_BLOCKED_MESSAGE });
  });

  it('maps 429 to a retryable outcome, not blocked — the token was never touched', () => {
    const outcome = mapActivationConsumeResponse(429);
    expect(outcome.kind).toBe('retry');
  });

  it('maps an unexpected 500 to a generic retryable outcome', () => {
    const outcome = mapActivationConsumeResponse(500);
    expect(outcome.kind).toBe('retry');
  });
});
