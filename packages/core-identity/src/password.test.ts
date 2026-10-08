import { describe, expect, it } from 'vitest';

import { hashPassword, MIN_PASSWORD_LENGTH, validatePassword, verifyPassword } from './password';

describe('validatePassword', () => {
  it('rejects a password shorter than the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe('too-short');
  });

  it('accepts a password at exactly the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it('rejects an absurdly long password', () => {
    expect(validatePassword('a'.repeat(257))).toBe('too-long');
  });
});

describe('hashPassword / verifyPassword', () => {
  it('a password verifies against its own hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('a wrong password does not verify', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('wrong password entirely', hash)).toBe(false);
  });

  it('two hashes of the same password are different (random salt per hash)', async () => {
    const a = await hashPassword('same password');
    const b = await hashPassword('same password');
    expect(a).not.toBe(b);
    expect(await verifyPassword('same password', a)).toBe(true);
    expect(await verifyPassword('same password', b)).toBe(true);
  });

  it('a malformed stored hash fails closed rather than throwing', async () => {
    expect(await verifyPassword('anything', 'not-a-real-hash')).toBe(false);
    expect(await verifyPassword('anything', '')).toBe(false);
    expect(await verifyPassword('anything', ':')).toBe(false);
  });
});
