import { randomBytes, scrypt as scryptAsync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Password hashing — scrypt, from node:crypto.
// -----------------------------------------------------------------------
// No new dependency: every credential primitive in this repository
// (access tokens, claim tokens, download grants) already uses
// node:crypto directly rather than an npm package, and scrypt is the one
// node:crypto primitive actually designed for low-entropy human
// passwords (deliberately memory-hard, unlike the plain SHA-256 digest
// accessToken.ts uses for its high-entropy tokens — a work factor there
// would only slow every legitimate request for no benefit; here it is
// the point).
// -----------------------------------------------------------------------

const scrypt = promisify(scryptAsync);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

/** Minimum length only — repository has no existing password-complexity policy to encode here (see engineering note). */
export const MIN_PASSWORD_LENGTH = 8;

export type PasswordValidationError = 'too-short' | 'too-long';

/** The only policy this repository has ever specified: a length floor. Complexity rules are a future PO/engineering decision, not invented here. */
export function validatePassword(password: string): PasswordValidationError | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'too-short';
  if (password.length > 256) return 'too-long';
  return null;
}

/** `<saltHex>:<hashHex>` — one column, no separate salt column needed. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

/** Constant-time verification against a `hashPassword()` output. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const separator = stored.indexOf(':');
  if (separator <= 0) return false;
  const salt = Buffer.from(stored.slice(0, separator), 'hex');
  const expected = Buffer.from(stored.slice(separator + 1), 'hex');
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = (await scrypt(password, salt, expected.length)) as Buffer;
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
