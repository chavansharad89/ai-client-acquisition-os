import { createHmac, timingSafeEqual } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

// -----------------------------------------------------------------------
// All tests here are pure — real Node `crypto`, no mocks, no network, no
// external SDK — EXCEPT the "implementation proof" suite at the bottom,
// which partially mocks `node:crypto` solely to spy on `timingSafeEqual`.
// That mock must be set up via `vi.mock` with `importOriginal` (not
// `vi.spyOn` directly on the imported namespace object): Node's built-in
// ESM module exports are non-configurable, so `vi.spyOn(cryptoModule,
// 'timingSafeEqual')` throws "Cannot redefine property" — `vi.mock`
// intercepts module resolution itself instead of mutating the frozen
// namespace object, which works for built-ins.
// -----------------------------------------------------------------------

const { timingSafeEqualSpy } = vi.hoisted(() => ({
  timingSafeEqualSpy: vi.fn(),
}));

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  timingSafeEqualSpy.mockImplementation(actual.timingSafeEqual);
  return {
    ...actual,
    timingSafeEqual: timingSafeEqualSpy,
  };
});

const { RazorpaySignatureConfigError, verifyRazorpayWebhookSignature } =
  await import('./verifySignature');

const SECRET = 'whsec_test_secret_do_not_use_in_prod';
const OTHER_SECRET = 'whsec_a_completely_different_secret';
// Deliberately pretty-printed (indented) so that JSON.stringify(JSON.parse(x))
// — which produces compact, unindented output — is GUARANTEED to differ in
// raw bytes from this, even though the parsed data is identical. This is
// what makes the "modified body via round-trip" test below meaningful
// rather than accidentally already-canonical.
const BODY = JSON.stringify(
  {
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_abc123', amount: 9900, status: 'captured' } } },
  },
  null,
  2,
);

function sign(body: string | Buffer, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

afterEach(() => {
  // NOTE: `vi.clearAllMocks()`, not `restoreAllMocks()` — the latter
  // would wipe the `mockImplementation` wired up in the `node:crypto`
  // mock factory above (it has no "original" to restore to, since it's
  // a plain `vi.fn()`, not a `vi.spyOn` on an existing method), which
  // would break `timingSafeEqual` for every test after the first.
  vi.clearAllMocks();
});

// =========================================================================
// 1. Valid signature
// =========================================================================
describe('1. valid signature', () => {
  it('returns true for a correctly computed signature', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature, SECRET)).toBe(true);
  });

  it('returns true when the raw body is a Buffer instead of a string', () => {
    const bodyBuffer = Buffer.from(BODY, 'utf-8');
    const signature = sign(bodyBuffer, SECRET);
    expect(verifyRazorpayWebhookSignature(bodyBuffer, signature, SECRET)).toBe(true);
  });

  it('a Buffer body and an identical string body produce and verify the same signature', () => {
    const bodyBuffer = Buffer.from(BODY, 'utf-8');
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(bodyBuffer, signature, SECRET)).toBe(true);
    expect(verifyRazorpayWebhookSignature(BODY, signature, SECRET)).toBe(true);
  });

  it('accepts an uppercase-hex signature (hex is case-insensitive)', () => {
    const signature = sign(BODY, SECRET).toUpperCase();
    expect(verifyRazorpayWebhookSignature(BODY, signature, SECRET)).toBe(true);
  });

  it('is order-of-arguments-safe: verifying twice with the same inputs gives the same result', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature, SECRET)).toBe(true);
    expect(verifyRazorpayWebhookSignature(BODY, signature, SECRET)).toBe(true);
  });
});

// =========================================================================
// 2. Invalid signature
// =========================================================================
describe('2. invalid signature', () => {
  it('returns false for a well-formed but simply wrong signature', () => {
    const wrongSignature = sign('completely different content', SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, wrongSignature, SECRET)).toBe(false);
  });

  it('returns false for a signature that is valid hex but all zeros', () => {
    const allZeros = '0'.repeat(64);
    expect(verifyRazorpayWebhookSignature(BODY, allZeros, SECRET)).toBe(false);
  });

  it('returns false for a random 64-hex-char string', () => {
    const random64Hex = Buffer.from(
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)),
    ).toString('hex');
    expect(verifyRazorpayWebhookSignature(BODY, random64Hex, SECRET)).toBe(false);
  });
});

// =========================================================================
// 3. Modified body
// =========================================================================
describe('3. modified body', () => {
  it('returns false when the body is modified after signing', () => {
    const signature = sign(BODY, SECRET);
    const tamperedBody = BODY.replace('9900', '1'); // attacker tries to change the amount
    expect(verifyRazorpayWebhookSignature(tamperedBody, signature, SECRET)).toBe(false);
  });

  it('returns false for a single-character change anywhere in the body', () => {
    const signature = sign(BODY, SECRET);
    const tamperedBody = BODY.slice(0, -1) + (BODY.endsWith('}') ? ')' : '}');
    expect(verifyRazorpayWebhookSignature(tamperedBody, signature, SECRET)).toBe(false);
  });

  it('CRITICAL: parsing the body and re-serializing it — even with IDENTICAL data — invalidates the signature', () => {
    // This is exactly the bug "never parse JSON before signature
    // verification" guards against: JSON.stringify(JSON.parse(x)) is not
    // guaranteed to equal `x` byte-for-byte (key order, whitespace,
    // number formatting can all differ), which silently breaks HMAC
    // verification even though the *data* is unchanged.
    const signature = sign(BODY, SECRET);
    const roundTripped = JSON.stringify(JSON.parse(BODY));
    // Only meaningful if round-tripping actually changed the bytes —
    // assert that precondition so this test can't silently pass for the
    // wrong reason.
    expect(roundTripped).not.toBe(BODY);
    expect(verifyRazorpayWebhookSignature(roundTripped, signature, SECRET)).toBe(false);
  });

  it('returns false when whitespace alone is added to the body', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY + ' ', signature, SECRET)).toBe(false);
    expect(verifyRazorpayWebhookSignature(' ' + BODY, signature, SECRET)).toBe(false);
  });

  it('returns false for an empty body when a signature was computed for a non-empty one', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature('', signature, SECRET)).toBe(false);
  });
});

// =========================================================================
// 4. Modified signature
// =========================================================================
describe('4. modified signature', () => {
  it('returns false when a single hex character is flipped', () => {
    const signature = sign(BODY, SECRET);
    const firstChar = signature[0] === 'a' ? 'b' : 'a';
    const flipped = firstChar + signature.slice(1);
    expect(verifyRazorpayWebhookSignature(BODY, flipped, SECRET)).toBe(false);
  });

  it('returns false when only the LAST character is flipped (proves full-length comparison, not a prefix check)', () => {
    const signature = sign(BODY, SECRET);
    const lastChar = signature[signature.length - 1] === 'a' ? 'b' : 'a';
    const flipped = signature.slice(0, -1) + lastChar;
    expect(verifyRazorpayWebhookSignature(BODY, flipped, SECRET)).toBe(false);
  });

  it('returns false when the signature is reversed', () => {
    const signature = sign(BODY, SECRET);
    const reversed = signature.split('').reverse().join('');
    // Guard against the astronomically unlikely case the reversal is a palindrome.
    if (reversed !== signature) {
      expect(verifyRazorpayWebhookSignature(BODY, reversed, SECRET)).toBe(false);
    }
  });

  it('returns false when characters are truncated (too short)', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature.slice(0, 63), SECRET)).toBe(false);
    expect(verifyRazorpayWebhookSignature(BODY, signature.slice(0, 32), SECRET)).toBe(false);
  });

  it('returns false when extra characters are appended (too long)', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature + 'a', SECRET)).toBe(false);
    expect(verifyRazorpayWebhookSignature(BODY, signature + signature, SECRET)).toBe(false);
  });
});

// =========================================================================
// 5. Empty signature
// =========================================================================
describe('5. empty signature', () => {
  it('returns false for an empty string signature', () => {
    expect(verifyRazorpayWebhookSignature(BODY, '', SECRET)).toBe(false);
  });

  it('returns false for a whitespace-only signature', () => {
    expect(verifyRazorpayWebhookSignature(BODY, '   ', SECRET)).toBe(false);
  });

  it('returns false (not a throw) when the header value is effectively missing, represented as null', () => {
    // Mirrors `request.headers.get('X-Razorpay-Signature')` returning
    // `null` when the header is absent — this is untrusted/attacker-
    // reachable input (an unauthenticated request), so it must be
    // REJECTED, not thrown, unlike the config-error cases below.
    expect(verifyRazorpayWebhookSignature(BODY, null as unknown as string, SECRET)).toBe(false);
  });

  it('returns false when the signature is undefined', () => {
    expect(verifyRazorpayWebhookSignature(BODY, undefined as unknown as string, SECRET)).toBe(
      false,
    );
  });
});

// =========================================================================
// 6. Malformed signature
// =========================================================================
describe('6. malformed signature', () => {
  it('returns false for non-hex characters', () => {
    const notHex = 'z'.repeat(64);
    expect(verifyRazorpayWebhookSignature(BODY, notHex, SECRET)).toBe(false);
  });

  it('returns false for a signature with a "sha256=" prefix (a GitHub/Stripe-style convention Razorpay does NOT use)', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, `sha256=${signature}`, SECRET)).toBe(false);
  });

  it('returns false for a base64-encoded digest instead of hex', () => {
    const base64Signature = createHmac('sha256', SECRET).update(BODY).digest('base64');
    expect(verifyRazorpayWebhookSignature(BODY, base64Signature, SECRET)).toBe(false);
  });

  it('returns false for a signature containing spaces', () => {
    const signature = sign(BODY, SECRET);
    const withSpace = signature.slice(0, 32) + ' ' + signature.slice(33);
    expect(verifyRazorpayWebhookSignature(BODY, withSpace, SECRET)).toBe(false);
  });

  it('returns false for a signature containing unicode/emoji', () => {
    expect(verifyRazorpayWebhookSignature(BODY, '🔒'.repeat(20), SECRET)).toBe(false);
  });

  it('returns false for an odd-length hex-looking string (would silently truncate with plain Buffer.from)', () => {
    // 63 valid hex characters — one short of a full digest. If this
    // module used `Buffer.from(str,'hex').length === Buffer.from(other,
    // 'hex').length` as its only guard instead of the {64}-char regex,
    // Node's lenient hex parser could decode this without throwing,
    // masking the malformation. The regex must reject it outright.
    const oddLengthHex = 'a'.repeat(63);
    expect(verifyRazorpayWebhookSignature(BODY, oddLengthHex, SECRET)).toBe(false);
  });

  it('returns false for a JSON-looking string passed as the signature', () => {
    expect(verifyRazorpayWebhookSignature(BODY, '{"signature":"not-real"}', SECRET)).toBe(false);
  });

  it('never throws for any malformed signature input — always resolves to false', () => {
    const malformedInputs = [
      '',
      ' ',
      'not-hex-at-all',
      'a'.repeat(63),
      'a'.repeat(65),
      'sha256=' + 'a'.repeat(64),
      '🔒',
      '\n\t',
      '-'.repeat(64),
    ];
    for (const input of malformedInputs) {
      expect(() => verifyRazorpayWebhookSignature(BODY, input, SECRET)).not.toThrow();
      expect(verifyRazorpayWebhookSignature(BODY, input, SECRET)).toBe(false);
    }
  });
});

// =========================================================================
// 7. Different webhook secret
// =========================================================================
describe('7. different webhook secret', () => {
  it('returns false when verifying with a different secret than the one used to sign', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature, OTHER_SECRET)).toBe(false);
  });

  it('returns false even when secrets differ by a single character', () => {
    const almostSameSecret = SECRET.slice(0, -1) + (SECRET.endsWith('t') ? 'x' : 't');
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature, almostSameSecret)).toBe(false);
  });

  it('the SAME body+signature verifies true with the correct secret and false with every other secret tried', () => {
    const signature = sign(BODY, SECRET);
    expect(verifyRazorpayWebhookSignature(BODY, signature, SECRET)).toBe(true);
    for (const wrongSecret of [OTHER_SECRET, '', 'x', SECRET + 'x', SECRET.toUpperCase()]) {
      if (wrongSecret === '') continue; // empty secret is a config error, tested separately
      expect(verifyRazorpayWebhookSignature(BODY, signature, wrongSecret)).toBe(false);
    }
  });
});

// =========================================================================
// Configuration errors (distinct from attacker-controlled rejection)
// =========================================================================
describe('configuration errors — thrown, not returned as false', () => {
  it('throws RazorpaySignatureConfigError when webhookSecret is an empty string', () => {
    const signature = sign(BODY, SECRET);
    expect(() => verifyRazorpayWebhookSignature(BODY, signature, '')).toThrow(
      RazorpaySignatureConfigError,
    );
  });

  it('throws RazorpaySignatureConfigError when webhookSecret is undefined', () => {
    expect(() =>
      verifyRazorpayWebhookSignature(BODY, 'irrelevant', undefined as unknown as string),
    ).toThrow(RazorpaySignatureConfigError);
  });

  it('throws RazorpaySignatureConfigError when rawBody is null', () => {
    expect(() =>
      verifyRazorpayWebhookSignature(null as unknown as string, 'irrelevant', SECRET),
    ).toThrow(RazorpaySignatureConfigError);
  });

  it('throws RazorpaySignatureConfigError when rawBody is undefined', () => {
    expect(() =>
      verifyRazorpayWebhookSignature(undefined as unknown as string, 'irrelevant', SECRET),
    ).toThrow(RazorpaySignatureConfigError);
  });

  it('throws RazorpaySignatureConfigError when rawBody is a parsed object (the exact misuse this API is designed to prevent)', () => {
    const parsedBody = JSON.parse(BODY);
    expect(() =>
      verifyRazorpayWebhookSignature(parsedBody as unknown as string, 'irrelevant', SECRET),
    ).toThrow(RazorpaySignatureConfigError);
  });

  it('config error messages never leak the webhook secret value', () => {
    try {
      verifyRazorpayWebhookSignature(BODY, 'irrelevant', '');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as Error).message).not.toContain(SECRET);
    }
  });
});

// =========================================================================
// Implementation proof: timing-safe comparison is actually used
// =========================================================================
describe('uses a true timing-safe comparison, not string equality', () => {
  it('calls node:crypto.timingSafeEqual when the signature is well-formed', () => {
    timingSafeEqualSpy.mockClear();
    const signature = sign(BODY, SECRET);
    verifyRazorpayWebhookSignature(BODY, signature, SECRET);

    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1);
    const [a, b] = timingSafeEqualSpy.mock.calls[0]!;
    expect(Buffer.isBuffer(a)).toBe(true);
    expect(Buffer.isBuffer(b)).toBe(true);
  });

  it('does NOT call timingSafeEqual for a malformed signature (rejected before reaching it, avoiding a throw on length mismatch)', () => {
    timingSafeEqualSpy.mockClear();
    verifyRazorpayWebhookSignature(BODY, 'too-short', SECRET);
    expect(timingSafeEqualSpy).not.toHaveBeenCalled();
  });

  it('sanity check: timingSafeEqual really does throw on unequal-length buffers (justifies the pre-guard)', () => {
    expect(() => timingSafeEqual(Buffer.from('ab'), Buffer.from('abcd'))).toThrow();
  });
});
