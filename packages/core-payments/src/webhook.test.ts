import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { MAX_WEBHOOK_BODY_BYTES, verifyRazorpayWebhook } from './webhook';
import { RazorpaySignatureConfigError } from './razorpaySignature';
import { handleRazorpayWebhook, type WebhookHandlerDeps } from './webhookHandler';

// The trust boundary, as a unit.
// -----------------------------------------------------------------------
// The integration suite proves what does and does not reach the database.
// This proves the classification that decides it, and the type-level rule
// that makes "parse first, verify later" impossible to write.
// -----------------------------------------------------------------------

const SECRET = 'whsec_unit';
const BODY = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: {} }), 'utf8');
const sign = (raw: Buffer | string) => createHmac('sha256', SECRET).update(raw).digest('hex');

const verify = (over: Partial<Parameters<typeof verifyRazorpayWebhook>[0]> = {}) =>
  verifyRazorpayWebhook({
    rawBody: BODY,
    signatureHeader: sign(BODY),
    webhookSecret: SECRET,
    ...over,
  });

describe('verifyRazorpayWebhook', () => {
  it('accepts a correct signature over the raw bytes', () => {
    const result = verify();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.verified.rawBody).toBe(BODY);
  });

  it('classifies each refusal, and never by reading the body', () => {
    const cases: [Partial<Parameters<typeof verifyRazorpayWebhook>[0]>, string][] = [
      [{ signatureHeader: null }, 'missing-signature'],
      [{ signatureHeader: '' }, 'missing-signature'],
      [{ signatureHeader: 'not-hex-at-all' }, 'malformed-signature'],
      [{ signatureHeader: sign(BODY).slice(0, 63) }, 'malformed-signature'],
      [{ signatureHeader: `${sign(BODY)}ff` }, 'malformed-signature'],
      [{ signatureHeader: 'a'.repeat(64) }, 'bad-signature'],
      [{ rawBody: Buffer.alloc(0) }, 'empty-body'],
    ];
    for (const [over, reason] of cases) {
      const result = verify(over);
      expect(result.ok, reason).toBe(false);
      if (!result.ok) expect(result.rejection.reason).toBe(reason);
    }
  });

  it('refuses an oversized body BEFORE hashing it', () => {
    const huge = Buffer.alloc(MAX_WEBHOOK_BODY_BYTES + 1, 0x7b);
    const result = verifyRazorpayWebhook({
      rawBody: huge,
      // A signature that is genuinely correct for the huge body: the
      // point is that we refuse on size without doing the work, so even
      // a valid one does not get us to hash a megabyte for a stranger.
      signatureHeader: sign(huge),
      webhookSecret: SECRET,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.rejection.reason).toBe('body-too-large');
  });

  it('rejects a body that was parsed and re-serialised', () => {
    // Razorpay sends bytes, not a JS object, and real payloads carry
    // whitespace and their own key order. Re-serialising normalises both,
    // which changes the HMAC — the whole reason the route must hash what
    // arrived rather than request.json() output.
    const asSent = Buffer.from('{ "event": "payment.captured",\n  "payload": {} }', 'utf8');
    const signature = sign(asSent);

    expect(verify({ rawBody: asSent, signatureHeader: signature }).ok).toBe(true);

    const roundTripped = Buffer.from(JSON.stringify(JSON.parse(asSent.toString('utf8'))), 'utf8');
    expect(roundTripped.equals(asSent)).toBe(false); // the bytes really did change
    expect(verify({ rawBody: roundTripped, signatureHeader: signature }).ok).toBe(false);
  });

  it('carries only safe metadata on a rejection', () => {
    const result = verify({ signatureHeader: 'a'.repeat(64), sourceIp: '198.51.100.7' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.rejection).sort()).toEqual(
        [
          'bodyBytes',
          'reason',
          'receivedAt',
          'signaturePresent',
          'signatureWellFormed',
          'sourceIp',
        ].sort(),
      );
      // No body, no payload, no signature value.
      expect(JSON.stringify(result.rejection)).not.toContain('payment.captured');
      expect(JSON.stringify(result.rejection)).not.toContain('a'.repeat(64));
    }
  });

  it('throws — not rejects — on a missing secret, because that is our bug', () => {
    expect(() => verify({ webhookSecret: '' })).toThrow(RazorpaySignatureConfigError);
  });
});

describe('the handler cannot be reached without verification', () => {
  it('does not accept a raw body, a string, or a parsed object', () => {
    // `deps` is explicitly typed. Leaving it inferred was a real bug in
    // an earlier version of this test: the object did not satisfy
    // WebhookHandlerDeps, so every @ts-expect-error below was being
    // satisfied by the SECOND argument and the first was never checked.
    // The directives passed while proving nothing.
    const deps: WebhookHandlerDeps = {
      transaction: async (fn) =>
        fn({
          insertWebhookEvent: async () => true,
          findOrderByRazorpayOrderId: async () => null,
          upsertCapturedPayment: async () => undefined,
          markOrderPaid: async () => undefined,
          grantEntitlement: async () => undefined,
          enqueueMetaPurchase: async () => undefined,
          markWebhookProcessed: async () => undefined,
        }),
      buildMetaEventId: (id: string) => id,
      eventId: 'evt_1',
    };

    // Each of these is what a "parse first, verify later" implementation
    // would have in hand at the call site. None of them compile, which is
    // the enforcement — the ordering is a type rule, not a convention.
    // @ts-expect-error a raw Buffer is not a VerifiedWebhook
    void (() => handleRazorpayWebhook(BODY, deps));
    // @ts-expect-error a string is not a VerifiedWebhook
    void (() => handleRazorpayWebhook(BODY.toString('utf8'), deps));
    // @ts-expect-error a parsed object is not a VerifiedWebhook
    void (() => handleRazorpayWebhook({ event: 'payment.captured' }, deps));
    // @ts-expect-error nor is a hand-built look-alike — the brand is unforgeable
    void (() => handleRazorpayWebhook({ rawBody: BODY, receivedAt: new Date() }, deps));
    expect(true).toBe(true);
  });

  it('accepts the object verification produces', async () => {
    const result = verify();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const outcome = await handleRazorpayWebhook(result.verified, {
      transaction: async (fn) =>
        fn({
          insertWebhookEvent: async () => true,
          findOrderByRazorpayOrderId: async () => null,
          upsertCapturedPayment: async () => undefined,
          markOrderPaid: async () => undefined,
          grantEntitlement: async () => undefined,
          enqueueMetaPurchase: async () => undefined,
          markWebhookProcessed: async () => undefined,
        }),
      buildMetaEventId: (id) => id,
      eventId: 'evt_1',
    });
    // No payment entity in this body, so it is recorded and ignored.
    expect(outcome.status).toBe('ignored');
  });
});
