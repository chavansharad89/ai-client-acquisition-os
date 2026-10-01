import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, type KeyObject } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IntentSignalValidationError } from './intentSignal';
import {
  normalizeProviderResult,
  normalizeVerifiedProviderResult,
  PROVIDER_FAILURE_HANDLING,
  PROVIDER_OPERATIONAL_CONTRACT,
} from './intentSourceProviderContract';
import { aiPlatformSignal, PROVIDER_FIXTURE_NOW } from './intentSourceProviderFixtures';
import {
  createProviderPublicKeyRegistry,
  MAX_PROVIDER_ENVELOPE_BYTES,
  PROVIDER_SIGNATURE_FRESHNESS_MS,
  ProviderKeyRegistryConfigurationError,
  requireProviderAuthenticityForIntake,
  verifyProviderEnvelope,
  type ProviderEnvelopeRequest,
  type ProviderPublicKeyRegistry,
  type VerifiedProviderResult,
} from './providerAuthenticity';

// OD-13 Option B (IA-OD13-B). Test-only material: Ed25519 keys derived from
// fixed seeds, test-only integration / key ids, synthetic fixtures. No
// provider, network or database. Every test runs under a fetch guard.

const NOW = PROVIDER_FIXTURE_NOW;
const OPTIONS = { searchId: 'search_1', now: NOW };
const INTEGRATION = 'fixture-integration';
const KEY_ID = 'test-key-1';

function seededKey(byte: string): KeyObject {
  return createPrivateKey({ key: Buffer.from(`302e020100300506032b657004220420${byte.repeat(32)}`, 'hex'), format: 'der', type: 'pkcs8' });
}
const PRIVATE_KEY = seededKey('11');
const OTHER_PRIVATE_KEY = seededKey('22');

function registry(overrides: Partial<Parameters<typeof createProviderPublicKeyRegistry>[0][number]> = {}): ProviderPublicKeyRegistry {
  return createProviderPublicKeyRegistry([
    { integrationId: INTEGRATION, keyId: KEY_ID, publicKey: createPublicKey(PRIVATE_KEY), validFrom: new Date(0), validUntil: null, ...overrides },
  ]);
}

interface EnvelopeParts {
  version?: unknown;
  integrationId?: unknown;
  keyId?: unknown;
  signedAt?: unknown;
  result?: unknown;
}

function envelopeBytes(parts: EnvelopeParts = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      version: 1,
      integrationId: INTEGRATION,
      keyId: KEY_ID,
      signedAt: NOW.toISOString(),
      result: aiPlatformSignal(),
      ...parts,
    }),
  );
}

function request(rawBody: Buffer = envelopeBytes(), key: KeyObject = PRIVATE_KEY, patch: Partial<ProviderEnvelopeRequest> = {}): ProviderEnvelopeRequest {
  return { rawBody, integrationId: INTEGRATION, keyId: KEY_ID, signature: sign(null, rawBody, key).toString('base64'), ...patch };
}

function verify(req: ProviderEnvelopeRequest, reg = registry(), receivedAt = NOW) {
  return verifyProviderEnvelope(req, { registry: reg, receivedAt });
}

function verified(req = request(), reg = registry()): VerifiedProviderResult {
  const outcome = verify(req, reg);
  if (!outcome.ok) throw new Error(`expected verification, got ${JSON.stringify(outcome.rejection)}`);
  return outcome.verified;
}

function refused(req: ProviderEnvelopeRequest, reg = registry(), receivedAt = NOW) {
  const outcome = verify(req, reg, receivedAt);
  expect(outcome.ok).toBe(false);
  return (outcome as Extract<typeof outcome, { ok: false }>).rejection;
}

let fetchCalls = 0;
beforeEach(() => {
  fetchCalls = 0;
  vi.stubGlobal('fetch', vi.fn(() => {
    fetchCalls += 1;
    throw new Error('network is not allowed');
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  expect(fetchCalls).toBe(0);
});

describe('P1 — verifyProviderEnvelope (Ed25519 over the exact received bytes, before parsing)', () => {
  it('a correctly signed, fresh, version-1 envelope verifies and exposes the verified identity', () => {
    const proof = verified();
    expect(proof).toMatchObject({ integrationId: INTEGRATION, keyId: KEY_ID, signedAt: NOW, receivedAt: NOW });
    expect(Object.isFrozen(proof)).toBe(true);
  });

  it('signatures are deterministic for the fixed test key (synthetic, reproducible fixtures)', () => {
    expect(request().signature).toBe(request().signature);
  });

  it.each([
    ['missing', { signature: undefined }, 'signature', 'required'],
    ['empty', { signature: '' }, 'signature', 'required'],
    ['not base64', { signature: '!'.repeat(88) }, 'signature', 'invalid'],
    ['wrong length', { signature: Buffer.alloc(32).toString('base64') }, 'signature', 'invalid'],
    ['all-zero 64 bytes', { signature: Buffer.alloc(64).toString('base64') }, 'signature', 'invalid'],
    ['integration id missing', { integrationId: null }, 'integrationId', 'required'],
    ['key id missing', { keyId: '' }, 'keyId', 'required'],
  ])('malformed transport (%s) → REJECTED %s/%s', (_name, patch, field, reason) => {
    expect(refused(request(undefined, undefined, patch as Partial<ProviderEnvelopeRequest>))).toEqual({
      status: 'REJECTED',
      externalId: null,
      field,
      reason,
      message: expect.any(String),
    });
  });

  it('a signature by a different key (wrong key) is REJECTED', () => {
    expect(refused(request(envelopeBytes(), OTHER_PRIVATE_KEY))).toMatchObject({ field: 'signature', reason: 'invalid' });
  });

  it('any change to the signed bytes — even whitespace — is REJECTED (no canonicalization)', () => {
    const original = request();
    const spaced = Buffer.concat([original.rawBody, Buffer.from(' ')]);
    expect(refused({ ...original, rawBody: spaced })).toMatchObject({ field: 'signature', reason: 'invalid' });
    const flipped = Buffer.from(original.rawBody);
    flipped[flipped.length - 5] = flipped[flipped.length - 5]! ^ 0x01;
    expect(refused({ ...original, rawBody: flipped })).toMatchObject({ field: 'signature', reason: 'invalid' });
  });

  it('verifies before parsing: a correctly signed non-JSON body passes the signature and is refused as an envelope; an unsigned one never reaches the parser', () => {
    const parse = vi.spyOn(JSON, 'parse');
    const junk = Buffer.from('not json at all');
    expect(refused(request(junk, OTHER_PRIVATE_KEY))).toMatchObject({ field: 'signature' });
    expect(parse).not.toHaveBeenCalled();
    expect(refused(request(junk))).toMatchObject({ field: 'envelope', reason: 'invalid' });
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('unknown key id or unregistered integration → REJECTED not-allowed, no lookup outside the registry', () => {
    const body = envelopeBytes();
    expect(refused(request(body, PRIVATE_KEY, { keyId: 'test-key-unknown' }))).toMatchObject({ field: 'keyId', reason: 'not-allowed' });
    expect(refused(request(body, PRIVATE_KEY, { integrationId: 'unregistered-integration' }))).toMatchObject({
      field: 'keyId',
      reason: 'not-allowed',
    });
  });

  it('a key outside its validity window is REJECTED (validFrom inclusive, validUntil exclusive)', () => {
    expect(refused(request(), registry({ validFrom: new Date(NOW.getTime() + 1) }))).toMatchObject({ field: 'keyId', reason: 'not-allowed' });
    expect(refused(request(), registry({ validUntil: NOW }))).toMatchObject({ field: 'keyId', reason: 'not-allowed' });
    expect(verify(request(), registry({ validFrom: NOW, validUntil: new Date(NOW.getTime() + 1) })).ok).toBe(true);
  });

  it('more than one key per integration may be valid at once (rotation)', () => {
    const rotated = createProviderPublicKeyRegistry([
      { integrationId: INTEGRATION, keyId: KEY_ID, publicKey: createPublicKey(PRIVATE_KEY), validFrom: new Date(0), validUntil: null },
      { integrationId: INTEGRATION, keyId: 'test-key-2', publicKey: createPublicKey(OTHER_PRIVATE_KEY), validFrom: new Date(0), validUntil: null },
    ]);
    expect(verify(request(), rotated).ok).toBe(true);
    const body = envelopeBytes({ keyId: 'test-key-2' });
    expect(verify(request(body, OTHER_PRIVATE_KEY, { keyId: 'test-key-2' }), rotated).ok).toBe(true);
    // A signature by key 1 does not verify when it claims key 2.
    expect(refused(request(body, PRIVATE_KEY, { keyId: 'test-key-2' }), rotated)).toMatchObject({ field: 'signature' });
  });

  it('freshness: signedAt exactly 5 minutes before or after receipt is accepted; 1 ms beyond is REJECTED', () => {
    expect(PROVIDER_SIGNATURE_FRESHNESS_MS).toBe(300_000);
    const at = (offset: number) => request(envelopeBytes({ signedAt: new Date(NOW.getTime() + offset).toISOString() }));
    expect(verify(at(-PROVIDER_SIGNATURE_FRESHNESS_MS)).ok).toBe(true);
    expect(verify(at(PROVIDER_SIGNATURE_FRESHNESS_MS)).ok).toBe(true);
    expect(refused(at(-PROVIDER_SIGNATURE_FRESHNESS_MS - 1))).toMatchObject({ field: 'envelope.signedAt', reason: 'invalid' });
    expect(refused(at(PROVIDER_SIGNATURE_FRESHNESS_MS + 1))).toMatchObject({ field: 'envelope.signedAt', reason: 'invalid' });
  });

  it.each([
    ['absent', { signedAt: undefined }],
    ['not a string', { signedAt: 1769940000000 }],
    ['not UTC ISO-8601', { signedAt: '2026-02-01 12:00:00' }],
    ['impossible instant', { signedAt: '2026-13-45T00:00:00.000Z' }],
  ])('signedAt %s → REJECTED', (_name, parts) => {
    expect(refused(request(envelopeBytes(parts)))).toMatchObject({ field: 'envelope.signedAt', reason: 'invalid' });
  });

  it.each([
    ['absent', { version: undefined }],
    ['unknown number', { version: 2 }],
    ['string "1"', { version: '1' }],
  ])('envelope version %s → REJECTED unsupported', (_name, parts) => {
    expect(refused(request(envelopeBytes(parts)))).toMatchObject({ field: 'envelope.version', reason: 'unsupported' });
  });

  it('the signed integrationId / keyId must equal the transport claims used to select the key', () => {
    expect(refused(request(envelopeBytes({ integrationId: 'other-integration' })))).toMatchObject({
      field: 'envelope.integrationId',
      reason: 'invalid',
    });
    expect(refused(request(envelopeBytes({ keyId: 'test-key-9' })))).toMatchObject({ field: 'envelope.keyId', reason: 'invalid' });
  });

  it.each([
    ['a JSON array', Buffer.from('[1,2,3]')],
    ['JSON null', Buffer.from('null')],
    ['invalid UTF-8', Buffer.from([0xff, 0xfe, 0xfd])],
  ])('a signed body that is %s is REJECTED as an envelope', (_name, body) => {
    expect(refused(request(body))).toMatchObject({ field: 'envelope', reason: 'invalid' });
  });

  it('an envelope with no result object is REJECTED', () => {
    expect(refused(request(envelopeBytes({ result: null })))).toMatchObject({ field: 'envelope.result', reason: 'required' });
    expect(refused(request(envelopeBytes({ result: [aiPlatformSignal()] })))).toMatchObject({ field: 'envelope.result' });
  });

  it('empty or oversized bodies are refused before any verification work', () => {
    expect(refused({ ...request(), rawBody: Buffer.alloc(0) })).toMatchObject({ field: 'body', reason: 'required' });
    const big = Buffer.alloc(MAX_PROVIDER_ENVELOPE_BYTES + 1, 0x20);
    expect(refused({ ...request(), rawBody: big })).toMatchObject({ field: 'body', reason: 'too-long' });
  });

  it('never throws on attacker input', () => {
    const garbage: unknown[] = [null, undefined, {}, { rawBody: 'string body' }, { rawBody: Buffer.from('x'), integrationId: 5, keyId: KEY_ID, signature: 'x' }];
    for (const value of garbage) {
      expect(() => verifyProviderEnvelope(value as ProviderEnvelopeRequest, { registry: registry(), receivedAt: NOW })).not.toThrow();
      expect(verifyProviderEnvelope(value as ProviderEnvelopeRequest, { registry: registry(), receivedAt: NOW }).ok).toBe(false);
    }
    const throwingRegistry: ProviderPublicKeyRegistry = {
      find: () => {
        throw new Error('boom');
      },
    };
    expect(refused(request(), throwingRegistry)).toMatchObject({ field: 'keyId', reason: 'not-allowed' });
  });

  it('rejections carry field + reason + fixed text only — never the signature, body or claimed values', () => {
    const secret = 'SECRET-BODY-VALUE';
    const req = request(envelopeBytes({ result: { note: secret }, integrationId: 'SECRET-CLAIM' }));
    const rejections = [
      refused(req),
      refused({ ...req, signature: Buffer.alloc(64, 7).toString('base64') }),
      refused(request(envelopeBytes({ result: { note: secret } }), OTHER_PRIVATE_KEY)),
    ];
    for (const rejection of rejections) {
      expect(Object.keys(rejection).sort()).toEqual(['externalId', 'field', 'message', 'reason', 'status']);
      expect(JSON.stringify(rejection)).not.toMatch(/SECRET|AAAA|BwcH/);
    }
  });

  it('a failure does not halt anything: the next genuine envelope still verifies; no retry, no budget use', () => {
    const reg = registry();
    expect(refused(request(envelopeBytes(), OTHER_PRIVATE_KEY), reg).field).toBe('signature');
    expect(verify(request(), reg).ok).toBe(true);
    // Inbound authenticity never reuses the outbound AUTHENTICATION_FAILED halt; the operational contract is unchanged.
    expect(PROVIDER_FAILURE_HANDLING.AUTHENTICATION_FAILED).toMatchObject({ outcome: 'FAILED', haltIntegration: true });
    expect(PROVIDER_OPERATIONAL_CONTRACT).toMatchObject({ maxProviderCallsPerAcquisitionEvent: 1, automaticRetries: 0 });
  });
});

describe('key-registry boundary (public keys only; caller-supplied; nothing registered here)', () => {
  const base = { integrationId: INTEGRATION, keyId: KEY_ID, publicKey: createPublicKey(PRIVATE_KEY), validFrom: new Date(0), validUntil: null };

  it('accepts an SPKI PEM public key', () => {
    const pem = createPublicKey(PRIVATE_KEY).export({ type: 'spki', format: 'pem' }).toString();
    expect(verify(request(), createProviderPublicKeyRegistry([{ ...base, publicKey: pem }])).ok).toBe(true);
  });

  it.each([
    ['a private key', { publicKey: PRIVATE_KEY }],
    ['a non-Ed25519 key', { publicKey: generateKeyPairSync('ec', { namedCurve: 'P-256' }).publicKey }],
    ['an unreadable PEM', { publicKey: 'not a key' }],
    ['a blank integrationId', { integrationId: ' ' }],
    ['a padded keyId', { keyId: ' test-key-1' }],
    ['an invalid validFrom', { validFrom: new Date('nope') }],
    ['validUntil not after validFrom', { validFrom: NOW, validUntil: NOW }],
  ])('refuses %s as a configuration fault', (_name, patch) => {
    expect(() => createProviderPublicKeyRegistry([{ ...base, ...patch } as never])).toThrow(ProviderKeyRegistryConfigurationError);
  });

  it('refuses a duplicate integrationId / keyId pair', () => {
    expect(() => createProviderPublicKeyRegistry([base, base])).toThrow(ProviderKeyRegistryConfigurationError);
  });
});

describe('P2 — normalizeVerifiedProviderResult (verified-result boundary)', () => {
  it('an unverified result with SUPPLIED_TO_US is REJECTED before normalization (OD-13)', () => {
    expect(normalizeProviderResult(aiPlatformSignal(), OPTIONS)).toMatchObject({
      status: 'REJECTED',
      externalId: 'aiad-0001',
      field: 'authenticity',
      reason: 'required',
    });
  });

  it('a result without SUPPLIED_TO_US stays outside the requirement (Q12)', () => {
    const published = aiPlatformSignal({ authorization: null, evidence: [{ ...aiPlatformSignal().evidence[0]!, origin: 'PUBLISHED' }] });
    expect(normalizeProviderResult(published, OPTIONS).status).toBe('NORMALIZED');
  });

  it('a verified result normalizes to FIRST_PARTY with Dates revived, and its intake carries the proof', () => {
    const proof = verified();
    const outcome = normalizeVerifiedProviderResult(proof, OPTIONS);
    if (outcome.status !== 'NORMALIZED') throw new Error(JSON.stringify(outcome));
    expect(outcome.event.signals.map((s) => s.kind)).toEqual(['FIRST_PARTY']);
    expect(outcome.event.intake.providerAuthenticity).toBe(proof);
    expect(outcome.event.intake.signals[0]!.authorizationEvidence!.authorizedAt).toBeInstanceOf(Date);
  });

  it('a forged proof (not issued by the verifier) is REJECTED', () => {
    const forged = { integrationId: INTEGRATION, keyId: KEY_ID, signedAt: NOW, receivedAt: NOW } as unknown as VerifiedProviderResult;
    expect(normalizeVerifiedProviderResult(forged, OPTIONS)).toMatchObject({ status: 'REJECTED', field: 'authenticity', reason: 'required' });
  });

  it('each normalization re-reads the verified bytes: mutating an earlier outcome cannot alter a later one', () => {
    const proof = verified();
    const first = normalizeVerifiedProviderResult(proof, OPTIONS);
    if (first.status !== 'NORMALIZED') throw new Error('expected NORMALIZED');
    (first.event.intake.signals[0] as { quote: string }).quote = 'tampered';
    const second = normalizeVerifiedProviderResult(proof, OPTIONS);
    if (second.status !== 'NORMALIZED') throw new Error('expected NORMALIZED');
    expect(second.event.intake.signals[0]!.quote).not.toBe('tampered');
  });

  it('V3 binding: the verified identity must equal provenance.integration and authorization.integrationId', () => {
    const signal = aiPlatformSignal();
    const otherProvenance = { ...signal, provenance: { ...signal.provenance, integration: 'other-integration' } };
    expect(normalizeVerifiedProviderResult(verified(request(envelopeBytes({ result: otherProvenance }))), OPTIONS)).toMatchObject({
      status: 'REJECTED',
      field: 'provenance.integration',
      reason: 'invalid',
    });
    const otherAuthorization = { ...signal, authorization: { ...signal.authorization!, integrationId: 'other-integration' } };
    expect(normalizeVerifiedProviderResult(verified(request(envelopeBytes({ result: otherAuthorization }))), OPTIONS)).toMatchObject({
      status: 'REJECTED',
      field: 'authorization.integrationId',
      reason: 'invalid',
    });
  });

  it('the existing OD-1..OD-6 rules still apply to a verified result', () => {
    const signal = aiPlatformSignal();
    const revoked = { ...signal, authorization: { ...signal.authorization!, status: 'REVOKED' } };
    expect(normalizeVerifiedProviderResult(verified(request(envelopeBytes({ result: revoked }))), OPTIONS)).toMatchObject({
      status: 'REJECTED',
      field: 'authorization.status',
      reason: 'not-allowed',
    });
  });
});

describe('P3 — requireProviderAuthenticityForIntake (save boundary)', () => {
  function intakeSignals(proof: VerifiedProviderResult) {
    const outcome = normalizeVerifiedProviderResult(proof, OPTIONS);
    if (outcome.status !== 'NORMALIZED') throw new Error('expected NORMALIZED');
    return outcome.event.intake.signals.map((s) => ({ kind: s.kind as string, authorizationEvidence: s.authorizationEvidence }));
  }

  function refusedAtSave(run: () => void) {
    try {
      run();
    } catch (error) {
      expect(error).toBeInstanceOf(IntentSignalValidationError);
      return error as IntentSignalValidationError;
    }
    throw new Error('expected the save boundary to refuse');
  }

  it('no FIRST_PARTY signal → no proof required', () => {
    expect(() => requireProviderAuthenticityForIntake([{ kind: 'PUBLIC_INTENT' }], undefined, NOW)).not.toThrow();
  });

  it('FIRST_PARTY without a proof, or with a forged one, is refused', () => {
    const signals = intakeSignals(verified());
    expect(refusedAtSave(() => requireProviderAuthenticityForIntake(signals, undefined, NOW))).toMatchObject({
      field: 'providerAuthenticity',
      reason: 'required',
    });
    const forged = { integrationId: INTEGRATION, keyId: KEY_ID };
    expect(refusedAtSave(() => requireProviderAuthenticityForIntake(signals, forged, NOW))).toMatchObject({ field: 'providerAuthenticity' });
  });

  it('a genuine proof whose signature re-verifies is accepted — freshness is a receipt-time rule and is not re-applied', () => {
    const proof = verified();
    const later = new Date(NOW.getTime() + 60 * 60 * 1000);
    expect(() => requireProviderAuthenticityForIntake(intakeSignals(proof), proof, later)).not.toThrow();
  });

  it('re-verification uses the key as registered at save time: an expired key stops acceptance from that moment', () => {
    const reg = registry({ validUntil: new Date(NOW.getTime() + 1000) });
    const proof = verified(request(), reg);
    const signals = intakeSignals(proof);
    expect(() => requireProviderAuthenticityForIntake(signals, proof, NOW)).not.toThrow();
    expect(refusedAtSave(() => requireProviderAuthenticityForIntake(signals, proof, new Date(NOW.getTime() + 1000)))).toMatchObject({
      field: 'providerAuthenticity.keyId',
      reason: 'not-allowed',
    });
  });

  it('a FIRST_PARTY signal whose integrationId differs from the verified identity is refused', () => {
    const proof = verified();
    const [signal] = intakeSignals(proof);
    const other = { ...signal!, authorizationEvidence: { ...signal!.authorizationEvidence!, integrationId: 'other-integration' } };
    expect(refusedAtSave(() => requireProviderAuthenticityForIntake([{ kind: 'PUBLIC_INTENT' }, other], proof, NOW))).toMatchObject({
      field: 'signals[1].authorizationEvidence.integrationId',
      reason: 'invalid',
    });
  });

  it('the verified object exposes no signature or raw bytes', () => {
    const proof = verified();
    expect(JSON.stringify(proof)).not.toMatch(/signature|rawBody|body/);
    expect(Object.keys(proof).sort()).toEqual(['integrationId', 'keyId', 'receivedAt', 'signedAt']);
  });
});
