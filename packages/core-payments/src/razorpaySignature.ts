import { createHmac, timingSafeEqual } from 'node:crypto';

// -----------------------------------------------------------------------
// Razorpay webhook signature verification.
//
// This is the ONLY thing standing between "a webhook we should trust"
// and "an HTTP request shaped like a webhook that anyone on the internet
// could have sent." Per architecture §6 (Webhook Flow), this check must
// run — and pass — before a single byte of the payload is trusted,
// parsed, or acted upon.
//
// TYPE-LEVEL ENFORCEMENT OF "raw body, never parsed JSON": `rawBody`'s
// type is `string | Buffer`, not `unknown` or `object`. A caller who has
// already done `JSON.parse(rawBody)` no longer has a `string | Buffer`
// to pass here — they have an object, which this function's signature
// will not accept. This doesn't make misuse impossible (a caller could
// `JSON.stringify` a parsed-then-reserialized body and pass that), but
// it makes the *intended* misuse (passing the parsed object directly)
// a compile error rather than a silent bug, and the re-serialization
// case is covered explicitly in the test suite below (see "modified
// body" — key reordering/whitespace changes alone flip the signature).
// -----------------------------------------------------------------------

/**
 * Thrown for configuration/programming errors — a missing webhook secret
 * or a missing raw body. These are never attacker-controlled inputs, so
 * they are NOT the same failure mode as "signature didn't match" (which
 * this function reports by returning `false`, not by throwing). Treat
 * this as a fail-fast startup/wiring bug: if you see this in production,
 * an environment variable or a route handler is misconfigured.
 */
export class RazorpaySignatureConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RazorpaySignatureConfigError';
  }
}

/**
 * A valid Razorpay webhook signature is the lowercase-or-uppercase hex
 * encoding of a 32-byte (SHA-256) HMAC digest — i.e. exactly 64 hex
 * characters. Checking against this pattern up front does three things
 * at once, deliberately:
 *   1. Rejects malformed signatures (wrong characters, wrong shape)
 *      before any cryptographic work happens on them.
 *   2. Rejects length mismatches (too short/too long) — Node's own
 *      `Buffer.from(str, 'hex')` does NOT throw on an odd-length or
 *      truncated hex string; it silently decodes as many complete byte
 *      pairs as it can. Without this guard, two syntactically different
 *      "malformed" signatures of unequal true length could decode to
 *      equal-length buffers and reach `timingSafeEqual` — which requires
 *      equal-length inputs or it throws. Rejecting anything that isn't
 *      exactly 64 valid hex characters sidesteps that entirely.
 *   3. Rejects an empty signature (the empty string fails the {64} length
 *      requirement immediately).
 */
const SHA256_HEX_SIGNATURE_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * Verifies that `receivedSignature` is the correct HMAC-SHA256 signature
 * of `rawBody`, computed with `webhookSecret`, using a timing-safe
 * comparison.
 *
 * @param rawBody The EXACT raw bytes of the incoming request body, as
 *   received over the wire — before any JSON parsing, re-encoding, or
 *   whitespace normalization. A `string` is fine as long as it is the
 *   verbatim body text (e.g. from `await request.text()` in a Next.js
 *   route handler), not a value that has been through `JSON.parse` and
 *   back.
 * @param receivedSignature The value of the `X-Razorpay-Signature`
 *   request header, verbatim.
 * @param webhookSecret Your Razorpay webhook secret (from the Razorpay
 *   dashboard / `RAZORPAY_WEBHOOK_SECRET` env var) — NOT your API key
 *   secret; Razorpay webhooks and the Orders/Payments API use separate
 *   secrets.
 * @returns `true` if and only if the signature is valid. Never throws
 *   for attacker-controlled input (a malformed, empty, or wrong
 *   signature simply returns `false`) — only throws for a missing
 *   secret or missing body, which are configuration errors.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  receivedSignature: string,
  webhookSecret: string,
): boolean {
  if (typeof webhookSecret !== 'string' || webhookSecret.length === 0) {
    throw new RazorpaySignatureConfigError(
      'verifyRazorpayWebhookSignature: webhookSecret must be a non-empty string',
    );
  }
  if (rawBody === null || rawBody === undefined) {
    throw new RazorpaySignatureConfigError(
      'verifyRazorpayWebhookSignature: rawBody must not be null or undefined',
    );
  }
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    throw new RazorpaySignatureConfigError(
      'verifyRazorpayWebhookSignature: rawBody must be a string or Buffer — if you have a ' +
        'parsed object, you have already parsed the body and it is too late to verify safely; ' +
        'call this function with the raw request body BEFORE calling JSON.parse',
    );
  }

  // Reject malformed / empty / wrong-length signatures before doing any
  // cryptographic work. `receivedSignature` is attacker-controlled — a
  // non-string here (e.g. a missing header resolving to `null`) is
  // rejected, not thrown on, since a request simply lacking the header
  // is an unauthenticated request, not a config bug.
  if (typeof receivedSignature !== 'string') {
    return false;
  }
  if (!SHA256_HEX_SIGNATURE_PATTERN.test(receivedSignature)) {
    return false;
  }

  const expectedSignatureHex = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');
  const receivedBuffer = Buffer.from(receivedSignature, 'hex');

  // Both buffers are guaranteed to be exactly 32 bytes at this point:
  // `expectedSignatureHex` is our own HMAC-SHA256 digest (always 64 hex
  // chars), and `receivedSignature` already passed the {64}-hex-char
  // regex above. `timingSafeEqual` would throw on unequal-length
  // buffers — that can't happen here, but the invariant is exactly why
  // the regex guard above checks length as well as character set.
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
