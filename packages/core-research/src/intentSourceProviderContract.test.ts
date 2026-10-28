import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  INTENT_QUOTE_MAX_LENGTH,
  INTENT_SIGNAL_CONFIDENCE,
  IntentSignalValidationError,
  toIntentIntakeInput,
  type RecordIntentIntakeInput,
  type ValidatedIntentIntake,
} from './intentSignal';
import {
  createProviderCallBudget,
  FIRST_PARTY_CONSENT_POLICY,
  normalizeProviderBatch,
  normalizeProviderResult,
  normalizeVerifiedProviderResult,
  PROVIDER_FAILURE_HANDLING,
  PROVIDER_FAILURE_KINDS,
  PROVIDER_OPERATIONAL_CONTRACT,
  ProviderCallBudgetExceededError,
  requireExactProviderResultForIntake,
  type IntentProviderResult,
  type ProviderResultOutcome,
} from './intentSourceProviderContract';
import {
  aiPlatformSignal,
  noticeFixtures,
  PROVIDER_FIXTURE_AUTHORIZED_AT,
  PROVIDER_FIXTURE_CAPTURED_AT,
  PROVIDER_FIXTURE_NOW,
  webFixtures,
} from './intentSourceProviderFixtures';
import { createProviderPublicKeyRegistry, verifyProviderEnvelope } from './providerAuthenticity';

// Provider contract — provider-free (INTENT-SOURCE-PROVIDER-CONTRACT-REC-001).
// Every test runs under an I/O guard: fetch, node:http(s) and raw sockets
// throw and are counted; afterEach asserts every counter is 0.

const OPTIONS = { searchId: 'search_1', now: PROVIDER_FIXTURE_NOW };

const io = { fetch: 0, http: 0, https: 0, socket: 0 };
function blocked(counter: keyof typeof io) {
  return () => {
    io[counter] += 1;
    throw new Error(`external I/O (${counter}) is not allowed in provider contract tests`);
  };
}

beforeEach(() => {
  for (const key of Object.keys(io) as (keyof typeof io)[]) io[key] = 0;
  vi.stubGlobal('fetch', vi.fn(blocked('fetch')));
  vi.spyOn(http, 'request').mockImplementation(blocked('http'));
  vi.spyOn(http, 'get').mockImplementation(blocked('http'));
  vi.spyOn(https, 'request').mockImplementation(blocked('https'));
  vi.spyOn(https, 'get').mockImplementation(blocked('https'));
  vi.spyOn(net, 'connect').mockImplementation(blocked('socket'));
  vi.spyOn(net, 'createConnection').mockImplementation(blocked('socket'));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // Google / Anthropic / OpenAI / Gemini / Claude consumer / any external HTTP: all 0.
  expect(io).toEqual({ fetch: 0, http: 0, https: 0, socket: 0 });
});

// OD-13 Option B: SUPPLIED_TO_US results only normalize through a verified
// signed envelope. Test-only Ed25519 key from a fixed seed (deterministic);
// test-only integration / key ids. Never a production key.
const TEST_INTEGRATION_ID = 'fixture-integration';
const TEST_KEY_ID = 'test-key-1';
const TEST_PRIVATE_KEY = createPrivateKey({
  key: Buffer.from(`302e020100300506032b657004220420${'11'.repeat(32)}`, 'hex'),
  format: 'der',
  type: 'pkcs8',
});
const TEST_REGISTRY = createProviderPublicKeyRegistry([
  { integrationId: TEST_INTEGRATION_ID, keyId: TEST_KEY_ID, publicKey: createPublicKey(TEST_PRIVATE_KEY), validFrom: new Date(0), validUntil: null },
]);

function hasSuppliedToUs(result: unknown): boolean {
  const evidence = (result as { evidence?: unknown } | null)?.evidence;
  return Array.isArray(evidence) && evidence.some((item) => (item as { origin?: unknown } | null)?.origin === 'SUPPLIED_TO_US');
}

/** Signs `result` as the test integration and verifies it (P1), received at `receivedAt`. */
function signProof(result: unknown, receivedAt = OPTIONS.now) {
  const rawBody = Buffer.from(
    JSON.stringify({ version: 1, integrationId: TEST_INTEGRATION_ID, keyId: TEST_KEY_ID, signedAt: receivedAt.toISOString(), result }),
  );
  const signature = sign(null, rawBody, TEST_PRIVATE_KEY).toString('base64');
  const verification = verifyProviderEnvelope(
    { rawBody, integrationId: TEST_INTEGRATION_ID, keyId: TEST_KEY_ID, signature },
    { registry: TEST_REGISTRY, receivedAt },
  );
  if (!verification.ok) throw new Error(`test envelope failed verification: ${JSON.stringify(verification.rejection)}`);
  return verification.verified;
}

/** Signs `result` as the test integration, verifies it (P1) and normalizes it (P2). */
function normalizeSigned(result: unknown, options = OPTIONS): ProviderResultOutcome {
  return normalizeVerifiedProviderResult(signProof(result, options.now), options);
}

function normalize(result: unknown, options = OPTIONS): ProviderResultOutcome {
  return hasSuppliedToUs(result) ? normalizeSigned(result, options) : normalizeProviderResult(result as IntentProviderResult, options);
}

function normalized(result: IntentProviderResult) {
  const outcome = normalize(result);
  if (outcome.status !== 'NORMALIZED') throw new Error(`expected NORMALIZED, got ${JSON.stringify(outcome)}`);
  return outcome;
}

function rejected(result: unknown): Extract<ProviderResultOutcome, { status: 'REJECTED' }> {
  const outcome = normalize(result);
  expect(outcome.status).toBe('REJECTED');
  return outcome as Extract<ProviderResultOutcome, { status: 'REJECTED' }>;
}

describe('no provider I/O', () => {
  it('the contract, adapters and normalization import no network client, SDK or browser automation', () => {
    const forbidden = [
      /\bfetch\s*\(/,
      /from ['"]node:(http|https|net|tls|dgram)['"]/,
      /from ['"](axios|undici|got|node-fetch)['"]/,
      /@anthropic-ai|openai|@google|googleapis|generative-ai|playwright|puppeteer|selenium/i,
    ];
    for (const file of ['intentSourceProviderContract.ts', 'intentSourceAdapters.ts', 'intentSource.ts', 'providerAuthenticity.ts']) {
      const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
      for (const pattern of forbidden) expect(source, `${file} ${pattern}`).not.toMatch(pattern);
    }
  });
});

describe('Google / public web search results', () => {
  it('ordinary result with a stated business need → PUBLIC_INTENT 70, evidence is the stated need only', () => {
    const { event, notes } = normalized(webFixtures.ordinary());
    expect(event.sourceFamily).toBe('PUBLIC_WEB_SEARCH');
    expect(event.sourceType).toBe('SEARCH_RESULT');
    expect(event.externalId).toBe('web-0001');
    expect(event.signals).toHaveLength(1);
    expect(event.signals[0]).toMatchObject({
      kind: 'PUBLIC_INTENT',
      classification: 'OBSERVED',
      confidence: 70,
      field: 'requestedWebsite',
      evidence: 'looking for an agency to build a new ordering website',
    });
    expect(notes).toMatchObject({ authorization: 'NOT_APPLICABLE', firstPartyConsentPolicy: 'NOT_APPLICABLE' });
    expect(notes.publication?.publisher).toBe('Example Bakery');
  });

  it('a search result that states no business intent is NOT an acquisition signal', () => {
    expect(normalizeProviderResult(webFixtures.ordinaryWithoutIntent(), OPTIONS)).toMatchObject({
      status: 'NO_INTENT_EVIDENCE',
      externalId: 'web-0002',
    });
  });

  it('evidence not contained verbatim in the result is rejected (no generated or paraphrased intent)', () => {
    const result = {
      ...webFixtures.ordinary(),
      intentEvidence: { requirement: 'requestedMobileApp' as const, evidence: 'wants a mobile app' },
    };
    expect(rejected(result)).toMatchObject({ field: 'intentEvidence.evidence', reason: 'invalid' });
  });

  it.each([
    ['procurement / RFP', webFixtures.procurement, 'PROCUREMENT_NOTICE', 'Public web search · procurement notice'],
    ['project request', webFixtures.projectRequest, 'PROJECT_POSTING', 'Public web search · project posting'],
    ['hiring signal', webFixtures.hiring, 'HIRING_SIGNAL', 'Public web search · hiring signal'],
    ['technology migration', webFixtures.migration, 'TECHNOLOGY_MIGRATION', 'Public web search · technology migration'],
  ])('%s → PUBLIC_INTENT 70 with its source type and label', (_name, fixture, type, label) => {
    const result = fixture();
    const { event } = normalized(result);
    expect(event.sourceType).toBe(type);
    expect(event.signals[0]!.kind).toBe('PUBLIC_INTENT');
    expect(event.signals[0]!.confidence).toBe(70);
    expect(event.signals[0]!.provenance.sourceLabel).toBe(label);
    expect(event.signals[0]!.provenance.sourceReference).toBe(result.url);
  });

  it('malformed result is rejected', () => {
    expect(rejected(webFixtures.malformed())).toMatchObject({ field: 'snippet', reason: 'required' });
    expect(rejected({ ...webFixtures.ordinary(), resultType: 'AI_REFERRAL' })).toMatchObject({ field: 'resultType' });
    expect(rejected({ ...webFixtures.ordinary(), observedAt: 'yesterday' })).toMatchObject({ field: 'observedAt' });
    expect(rejected({ ...webFixtures.ordinary(), externalId: '' })).toMatchObject({ field: 'externalId' });
    expect(rejected({ ...webFixtures.ordinary(), provenance: undefined })).toMatchObject({ field: 'provenance' });
    expect(rejected(null)).toMatchObject({ field: 'result' });
  });

  it('missing or non-http URL is rejected', () => {
    expect(rejected(webFixtures.missingUrl())).toMatchObject({ field: 'url', reason: 'required' });
    expect(rejected({ ...webFixtures.ordinary(), url: 'not a url' })).toMatchObject({ field: 'url', reason: 'invalid' });
    expect(rejected({ ...webFixtures.ordinary(), url: 'ftp://files.example.com/a' })).toMatchObject({ field: 'url' });
  });

  it('missing business identity → UNATTRIBUTED; identity is never inferred from the URL', () => {
    expect(normalizeProviderResult(webFixtures.missingIdentity(), OPTIONS)).toMatchObject({
      status: 'UNATTRIBUTED',
      externalId: 'web-anon-0001',
    });
    expect(
      normalizeProviderResult({ ...webFixtures.ordinary(), business: { name: 'Example Bakery', website: '' } }, OPTIONS).status,
    ).toBe('UNATTRIBUTED');
  });

  it('duplicate result inside one batch → DUPLICATE_IN_BATCH, forwarded once', () => {
    const outcomes = normalizeProviderBatch(
      [webFixtures.ordinary(), webFixtures.procurement(), webFixtures.ordinary()],
      OPTIONS,
    );
    expect(outcomes.map((o) => o.status)).toEqual(['NORMALIZED', 'NORMALIZED', 'DUPLICATE_IN_BATCH']);
    const first = outcomes[0] as Extract<ProviderResultOutcome, { status: 'NORMALIZED' }>;
    expect(outcomes[2]).toMatchObject({ externalId: 'web-0001', eventId: first.event.eventId });
  });

  it('one malformed result in a batch does not abort the others', () => {
    const outcomes = normalizeProviderBatch([webFixtures.missingUrl(), webFixtures.hiring()], OPTIONS);
    expect(outcomes.map((o) => o.status)).toEqual(['REJECTED', 'NORMALIZED']);
  });
});

describe('AI-platform acquisition (authorized integration only)', () => {
  it('authorized business-level signal → FIRST_PARTY 90; consent policy surfaced as pending, not decided', () => {
    const { event, notes } = normalized(aiPlatformSignal());
    expect(event.signals[0]).toMatchObject({ kind: 'FIRST_PARTY', classification: 'OBSERVED', confidence: 90 });
    expect(event.signals[0]!.privacy.consentRequired).toBeNull();
    expect(notes).toMatchObject({ authorization: 'PRESENT', firstPartyConsentPolicy: FIRST_PARTY_CONSENT_POLICY });
    expect(FIRST_PARTY_CONSENT_POLICY).toBe('AUTHORIZATION_EVIDENCE_REQUIRED');
  });

  it('provenance preserved: family, type, landing reference, evidence, per-signal observed time, capture time', () => {
    const { event, notes } = normalized(aiPlatformSignal({ acquisitionType: 'SPONSORED_PLACEMENT' }));
    expect(event.signals[0]!.provenance).toEqual({
      sourceFamily: 'AI_PLATFORM_ACQUISITION',
      sourceType: 'SPONSORED_PLACEMENT',
      externalId: 'aiad-0001',
      sourceReference: 'https://landing.example.com/forms/ai-ad',
      sourceLabel: 'AI-platform acquisition · sponsored placement',
      observedAt: new Date('2026-01-30T09:15:00.000Z'),
      capturedAt: PROVIDER_FIXTURE_CAPTURED_AT,
    });
    expect(event.signals[0]!.evidence).toBe('We want a new admissions website');
    expect(notes.providerProvenance).toEqual({ integration: 'fixture-integration', retrieval: 'AUTHORIZED_INTEGRATION' });
  });

  it('OD-6: a SUPPLIED_TO_US result with no authorization object is REJECTED, not flagged MISSING', () => {
    expect(rejected(aiPlatformSignal({ authorization: null }))).toMatchObject({
      externalId: 'aiad-0001',
      field: 'authorization',
      reason: 'required',
    });
  });

  it('OD-6 item 4: a PUBLISHED-only AI-platform result is unchanged — no authorization required, flagged MISSING', () => {
    const published = aiPlatformSignal({
      authorization: null,
      evidence: [{ ...aiPlatformSignal().evidence[0]!, origin: 'PUBLISHED' }],
    });
    const outcome = normalized(published);
    expect(outcome.event.signals.map((s) => s.kind)).toEqual(['PUBLIC_INTENT']);
    expect(outcome.notes.authorization).toBe('MISSING');
    expect(outcome.notes.firstPartyConsentPolicy).toBe('NOT_APPLICABLE');
    expect(outcome.event.intake.signals[0]).not.toHaveProperty('authorizationEvidence');
    // When present on such a result, only integrationId / basis are checked, as before.
    const partial = { integrationId: 'x', basis: 'x', reference: null } as never;
    expect(normalized({ ...published, authorization: partial }).notes.authorization).toBe('PRESENT');
    expect(rejected({ ...published, authorization: { integrationId: '', basis: 'x', reference: null } as never })).toMatchObject({
      field: 'authorization.integrationId',
    });
  });

  it.each([
    ['aiConversation', { aiConversation: 'user: build me a site' }],
    ['conversation', { conversation: [{ role: 'user', content: 'hi' }] }],
    ['chatHistory', { chatHistory: ['...'] }],
    ['prompt', { prompt: 'find me a web agency' }],
    ['userPrompt', { userPrompt: 'find me a web agency' }],
  ])('rejects private conversation / prompt data (%s)', (_name, extra) => {
    expect(rejected({ ...aiPlatformSignal(), ...extra }).reason).toBe('not-allowed');
  });

  it('rejects statements inferred from platform-user activity rather than stated by the business', () => {
    const signal = aiPlatformSignal();
    const inferred = { ...signal, evidence: [{ ...signal.evidence[0]!, derivation: 'INFERRED_FROM_PLATFORM_USAGE' }] };
    expect(rejected(inferred)).toMatchObject({ field: 'evidence[0].derivation', reason: 'not-allowed' });
  });

  it.each([
    ['personal email as externalId', { externalId: 'jane.doe@gmail.com' }],
    ['platform user id', { platformUserId: 'u-123' }],
    ['account id', { accountId: 'acct-9' }],
    ['device id', { deviceId: 'dev-1' }],
    ['click id', { clickId: 'abc' }],
  ])('rejects personal identifiers (%s)', (_name, extra) => {
    expect(rejected({ ...aiPlatformSignal(), ...extra }).reason).toBe('not-allowed');
  });

  it('publicly published evidence inside an AI-platform event stays PUBLIC_INTENT', () => {
    const signal = aiPlatformSignal({
      evidence: [
        {
          origin: 'PUBLISHED',
          derivation: 'STATED_BY_BUSINESS',
          requirement: 'requestedMobileApp',
          statement: 'Looking for someone to build our app',
          referenceUrl: 'https://forum.example.org/t/1',
          observedAt: new Date('2026-01-29T08:00:00.000Z'),
        },
      ],
    });
    const { event, notes } = normalized(signal);
    expect(event.signals[0]).toMatchObject({ kind: 'PUBLIC_INTENT', confidence: 70 });
    expect(notes.firstPartyConsentPolicy).toBe('NOT_APPLICABLE');
  });
});

describe('public intent sources', () => {
  it.each([
    ['public notice (RFP)', noticeFixtures.publicNotice, 'RFP_NOTICE'],
    ['project request', noticeFixtures.projectRequest, 'PROJECT_REQUEST'],
    ['company announcement', noticeFixtures.announcement, 'COMPANY_ANNOUNCEMENT'],
    ['hiring signal', noticeFixtures.hiring, 'HIRING_SIGNAL'],
    ['technology migration', noticeFixtures.migration, 'TECHNOLOGY_MIGRATION'],
  ])('%s → PUBLIC_INTENT 70, published evidence only', (_name, fixture, type) => {
    const { event } = normalized(fixture());
    expect(event.sourceFamily).toBe('PUBLIC_INTENT_NOTICE');
    expect(event.sourceType).toBe(type);
    for (const signal of event.signals) {
      expect(signal).toMatchObject({ kind: 'PUBLIC_INTENT', confidence: 70, classification: 'OBSERVED' });
      expect(signal.privacy.publicBusinessSignal).toBe(true);
      expect(signal.privacy.consentRequired).toBe(false);
    }
  });

  it('malformed source is rejected', () => {
    expect(rejected(noticeFixtures.malformed())).toMatchObject({ field: 'noticeType', reason: 'unsupported' });
    expect(rejected({ ...noticeFixtures.publicNotice(), intentEvidence: 'x' })).toMatchObject({ field: 'intentEvidence' });
    expect(rejected({ ...noticeFixtures.publicNotice(), body: undefined })).toMatchObject({ field: 'body' });
  });

  it('a notice with no stated intent is not a signal', () => {
    expect(normalizeProviderResult({ ...noticeFixtures.publicNotice(), intentEvidence: [] }, OPTIONS).status).toBe(
      'NO_INTENT_EVIDENCE',
    );
  });

  it('a public notice can never be first-party evidence', () => {
    const { event, notes } = normalized(noticeFixtures.publicNotice());
    expect(event.signals.every((s) => s.kind === 'PUBLIC_INTENT')).toBe(true);
    expect(notes.firstPartyConsentPolicy).toBe('NOT_APPLICABLE');
  });
});

describe('cross-provider contract', () => {
  const ALL_VALID: ReadonlyArray<[string, () => IntentProviderResult]> = [
    ['web ordinary', webFixtures.ordinary],
    ['web procurement', webFixtures.procurement],
    ['web project', webFixtures.projectRequest],
    ['web hiring', webFixtures.hiring],
    ['web migration', webFixtures.migration],
    ['ai platform', () => aiPlatformSignal()],
    ['notice rfp', noticeFixtures.publicNotice],
    ['notice project', noticeFixtures.projectRequest],
    ['notice announcement', noticeFixtures.announcement],
    ['notice hiring', noticeFixtures.hiring],
    ['notice migration', noticeFixtures.migration],
  ];

  it.each(ALL_VALID)('%s: deterministic eventId for identical results; differs when content differs', (_name, fixture) => {
    const a = normalized(fixture()).event.eventId;
    expect(normalized(fixture()).event.eventId).toBe(a);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    const changed = { ...fixture(), externalId: 'different-id' } as IntentProviderResult;
    expect(normalized(changed).event.eventId).not.toBe(a);
  });

  it.each(ALL_VALID)('%s: privacy flags, provenance and intake validation', (_name, fixture) => {
    const { event } = normalized(fixture());
    for (const signal of event.signals) {
      expect(signal.privacy.personalDataUsed).toBe(false);
      expect(signal.privacy.individualIdentityRequired).toBe(false);
      expect(signal.confidence).toBe(INTENT_SIGNAL_CONFIDENCE[signal.kind]);
      expect(signal.provenance.sourceFamily).toBe(event.sourceFamily);
      expect(signal.provenance.sourceType).toBe(event.sourceType);
      expect(signal.provenance.sourceReference).toMatch(/^https?:\/\//);
      expect(signal.evidence.length).toBeGreaterThan(0);
      expect(signal.provenance.observedAt).toBeInstanceOf(Date);
      expect(signal.provenance.capturedAt).toEqual(PROVIDER_FIXTURE_CAPTURED_AT);
    }
    // The intake payload passes the existing, unchanged validation and carries no system-assigned values.
    expect(() => toIntentIntakeInput(event.intake, PROVIDER_FIXTURE_NOW)).not.toThrow();
    expect(JSON.stringify(event.intake)).not.toMatch(/confidence|classification/);
  });

  it('multi-signal event keeps per-signal observed timestamps and kinds (PUBLIC_INTENT + FIRST_PARTY)', () => {
    const t1 = new Date('2026-01-28T08:00:00.000Z');
    const t2 = new Date('2026-01-30T09:15:00.000Z');
    const { event } = normalized(
      aiPlatformSignal({
        evidence: [
          { origin: 'PUBLISHED', derivation: 'STATED_BY_BUSINESS', requirement: 'requestedMobileApp', statement: 'Need an app', referenceUrl: 'https://forum.example.org/t/9', observedAt: t1 },
          { origin: 'SUPPLIED_TO_US', derivation: 'STATED_BY_BUSINESS', requirement: 'requestedWebsite', statement: 'We want a website', observedAt: t2 },
        ],
      }),
    );
    expect(event.signals.map((s) => [s.kind, s.confidence, s.provenance.observedAt])).toEqual([
      ['PUBLIC_INTENT', 70, t1],
      ['FIRST_PARTY', 90, t2],
    ]);
    expect(event.intake.signals.map((s) => s.observedAt)).toEqual([t1, t2]);
    // One notice with two published requirements keeps both.
    expect(normalized(noticeFixtures.migration()).event.signals).toHaveLength(2);
  });

  it('existing toIntentIntakeInput validation still applies (too-long evidence, observed after capture)', () => {
    const long = 'x'.repeat(INTENT_QUOTE_MAX_LENGTH + 1);
    const tooLong = { ...webFixtures.ordinary(), snippet: long, intentEvidence: { requirement: 'requestedWebsite' as const, evidence: long } };
    expect(rejected(tooLong).reason).toBe('too-long');
    const future = { ...webFixtures.ordinary(), observedAt: new Date('2026-02-01T11:30:00.000Z') };
    expect(rejected(future)).toMatchObject({ field: 'signals[0].observedAt', reason: 'invalid' });
  });

  it('source-assigned confidence / classification / kind is rejected', () => {
    expect(rejected({ ...webFixtures.ordinary(), confidence: 99 }).reason).toBe('not-allowed');
    const signal = aiPlatformSignal();
    expect(rejected({ ...signal, evidence: [{ ...signal.evidence[0]!, kind: 'FIRST_PARTY' }] }).reason).toBe('not-allowed');
  });

  it('unknown source family is rejected', () => {
    expect(rejected({ ...webFixtures.ordinary(), sourceFamily: 'SOCIAL_DM' })).toMatchObject({ field: 'sourceFamily' });
  });
});

describe('FIRST_PARTY authorization evidence (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 OD-1..OD-6)', () => {
  function withAuthorization(patch: Record<string, unknown>, base = aiPlatformSignal()): IntentProviderResult {
    return { ...base, authorization: { ...base.authorization!, ...patch } } as IntentProviderResult;
  }

  it('complete GRANTED evidence is carried verbatim to the FIRST_PARTY intake entry only', () => {
    const published = { ...aiPlatformSignal().evidence[0]!, origin: 'PUBLISHED' as const, statement: 'Need an app', referenceUrl: 'https://forum.example.org/t/9' };
    const { event } = normalized(aiPlatformSignal({ evidence: [published, aiPlatformSignal().evidence[0]!] }));
    expect(event.intake.signals.map((s) => s.kind)).toEqual(['PUBLIC_INTENT', 'FIRST_PARTY']);
    expect(event.intake.signals[0]).not.toHaveProperty('authorizationEvidence');
    // Exactly the five values; basis / reference are not carried (OD-10).
    expect(event.intake.signals[1]!.authorizationEvidence).toEqual({
      businessId: 'fixture-business-0001',
      status: 'GRANTED',
      scope: 'ACQUISITION',
      authorizedAt: PROVIDER_FIXTURE_AUTHORIZED_AT,
      integrationId: 'fixture-integration',
    });
    const validated = toIntentIntakeInput(event.intake, PROVIDER_FIXTURE_NOW);
    expect(validated.signals[0]!.signal).not.toHaveProperty('authorizationEvidence');
    expect(validated.signals[1]!.signal.authorizationEvidence).toEqual(event.intake.signals[1]!.authorizationEvidence);
  });

  it.each([
    ['businessId absent', { businessId: undefined }, 'authorization.businessId', 'required'],
    ['businessId whitespace-only', { businessId: '   ' }, 'authorization.businessId', 'required'],
    ['businessId wrong type', { businessId: 42 }, 'authorization.businessId', 'required'],
    ['businessId is a personal email', { businessId: 'owner@gmail.com' }, 'authorization.businessId', 'not-allowed'],
    ['status absent', { status: undefined }, 'authorization.status', 'required'],
    ['status REVOKED', { status: 'REVOKED' }, 'authorization.status', 'not-allowed'],
    ['status EXPIRED', { status: 'EXPIRED' }, 'authorization.status', 'not-allowed'],
    ['status differently cased', { status: 'granted' }, 'authorization.status', 'invalid'],
    ['status padded', { status: ' GRANTED' }, 'authorization.status', 'invalid'],
    ['status empty', { status: '' }, 'authorization.status', 'invalid'],
    ['status unrecognized', { status: 'APPROVED' }, 'authorization.status', 'invalid'],
    ['scope absent', { scope: undefined }, 'authorization.scope', 'required'],
    ['scope empty', { scope: '' }, 'authorization.scope', 'required'],
    ['scope other value', { scope: 'MARKETING' }, 'authorization.scope', 'not-allowed'],
    ['authorizedAt absent', { authorizedAt: undefined }, 'authorization.authorizedAt', 'required'],
    ['authorizedAt not a Date', { authorizedAt: '2026-01-15' }, 'authorization.authorizedAt', 'invalid'],
    // On the wire an invalid Date arrives as an unparseable instant.
    ['authorizedAt invalid instant', { authorizedAt: '2026-13-45T00:00:00.000Z' }, 'authorization.authorizedAt', 'invalid'],
    ['authorizedAt after capturedAt', { authorizedAt: new Date('2026-02-01T11:00:00.001Z') }, 'authorization.authorizedAt', 'invalid'],
    ['authorization expired (> 90 days before receipt)', { authorizedAt: new Date('2025-11-03T11:59:59.999Z') }, 'authorization.authorizedAt', 'not-allowed'],
    ['integrationId absent', { integrationId: undefined }, 'authorization.integrationId', 'required'],
    ['basis absent (existing rule kept, OD-10)', { basis: '' }, 'authorization.basis', 'required'],
  ])('OD-6: %s → the whole result is REJECTED', (_name, patch, field, reason) => {
    expect(rejected(withAuthorization(patch))).toMatchObject({ externalId: 'aiad-0001', field, reason });
  });

  it('OD-2: exactly 90 days after authorizedAt is still accepted; the expiry check uses the receipt time', () => {
    const edge = new Date(PROVIDER_FIXTURE_NOW.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(normalize(withAuthorization({ authorizedAt: edge })).status).toBe('NORMALIZED');
    const later = { ...OPTIONS, now: new Date(PROVIDER_FIXTURE_NOW.getTime() + 1) };
    expect(normalize(withAuthorization({ authorizedAt: edge }), later)).toMatchObject({
      status: 'REJECTED',
      field: 'authorization.authorizedAt',
      reason: 'not-allowed',
    });
  });

  it('OD-5: provenance.integration must equal authorization.integrationId exactly', () => {
    const base = aiPlatformSignal();
    // Signed as fixture-integration: the verified-identity binding (OD-13 V3) refuses the mismatch first.
    for (const integration of ['other-integration', 'FIXTURE-INTEGRATION', ' fixture-integration']) {
      expect(rejected({ ...base, provenance: { ...base.provenance, integration } })).toMatchObject({
        field: 'provenance.integration',
        reason: 'invalid',
      });
    }
  });

  it('OD-6: a defect rejects the whole result, including its PUBLISHED items; other results in the batch are unaffected', () => {
    const published = { ...aiPlatformSignal().evidence[0]!, origin: 'PUBLISHED' as const };
    const mixed = aiPlatformSignal({ evidence: [published, aiPlatformSignal().evidence[0]!] });
    const bad = withAuthorization({ status: 'REVOKED' }, mixed);
    const outcomes = [normalize(bad), ...normalizeProviderBatch([webFixtures.hiring()], OPTIONS)];
    expect(outcomes.map((o) => o.status)).toEqual(['REJECTED', 'NORMALIZED']);
    expect(outcomes[0]).toMatchObject({ field: 'authorization.status' });
  });

  it('OD-11: rejection messages name the field and rule, never the evidence value', () => {
    const cases = [
      withAuthorization({ businessId: 'owner@gmail.com' }),
      withAuthorization({ status: 'SECRET-STATUS-VALUE' }),
      withAuthorization({ scope: 'SECRET-SCOPE-VALUE' }),
    ];
    for (const result of cases) {
      const { message } = rejected(result);
      expect(message).not.toMatch(/owner@gmail\.com|SECRET-STATUS-VALUE|SECRET-SCOPE-VALUE/);
    }
  });
});

describe('privacy — every source family', () => {
  const FAMILIES: ReadonlyArray<[string, () => IntentProviderResult]> = [
    ['public web', webFixtures.ordinary],
    ['AI platform', () => aiPlatformSignal()],
    ['public intent', noticeFixtures.publicNotice],
  ];
  const PROHIBITED: ReadonlyArray<[string, Record<string, unknown>]> = [
    ['personal email as identifier', { externalId: 'jane.doe@gmail.com' }],
    ['email in a non-text field', { contactRef: 'jane.doe@gmail.com' }],
    ['mailto reference', { business: { name: 'Example', website: 'mailto:owner@example.com' } }],
    ['phone number', { phone: '+91 98765 43210' }],
    ['telephone', { telephone: '555-0100' }],
    ['tel: identifier', { externalId: 'tel:+15550100' }],
    ['private AI conversation', { aiConversation: 'user asked for a website' }],
    ['prompt', { prompt: 'best app agency near me' }],
    ['search history', { searchHistory: ['app developer'] }],
    ['search query', { query: 'app developer near me' }],
    ['cookies', { cookies: 'sid=1' }],
    ['device id', { deviceId: 'd-1' }],
    ['advertising id', { advertisingId: 'a-1' }],
    ['account id', { accountId: 'acc-1' }],
    ['click id key', { gclid: 'abc' }],
    ['private user information', { userProfile: { interests: ['apps'] } }],
    ['private-AI-usage inference', { inferredAiUsage: 'asked ChatGPT about agencies' }],
    ['nested personal data', { provenance: { integration: 'fixture', retrieval: 'FIXTURE', userId: 'u-1' } }],
  ];

  for (const [family, fixture] of FAMILIES) {
    it.each(PROHIBITED)(`${family}: rejects %s`, (_name, extra) => {
      expect(rejected({ ...fixture(), ...extra }).reason).toBe('not-allowed');
    });
  }

  it.each(FAMILIES)('%s: rejects a click/tracking identifier in the source reference', (_name, fixture) => {
    const base = fixture();
    const tracked =
      base.sourceFamily === 'AI_PLATFORM_ACQUISITION'
        ? { ...base, sourceReference: `${base.sourceReference}?gclid=abc` }
        : { ...base, url: `${base.url}?gclid=abc` };
    expect(rejected(tracked).reason).toBe('not-allowed');
  });

  // L21 (REV-005 §10.8): retitled per K1-I5 rule 3 / PG-3 — `body` is transient on the pulled
  // path (never persisted, displayed, logged or passed onward) and is therefore not screened by
  // K1; PG-3 is the pushed-path counterpart (see intentSourceProviderContract L14 coverage).
  // Expectation unchanged (NORMALIZED).
  it('body is transient on the pulled path (K1-I5 rule 3) and is not screened for a contact identifier', () => {
    const notice = noticeFixtures.publicNotice();
    const withContact = { ...notice, body: `${notice.body} Questions: procurement@college.example.edu` };
    expect(normalizeProviderResult(withContact, OPTIONS).status).toBe('NORMALIZED');
  });
});

describe('operational (cost / retry) contract', () => {
  it('at most one provider call per acquisition event; automatic retries prohibited', () => {
    expect(PROVIDER_OPERATIONAL_CONTRACT).toMatchObject({
      maxProviderCallsPerAcquisitionEvent: 1,
      automaticRetries: 0,
      manualRetry: 'OPERATOR_INITIATED_ONLY',
      timeoutRequired: true,
    });
    const budget = createProviderCallBudget();
    budget.consume();
    expect(() => budget.consume()).toThrow(ProviderCallBudgetExceededError);
    expect(budget.used).toBe(1);
    expect(() => createProviderCallBudget(2)).toThrow(ProviderCallBudgetExceededError);
    expect(() => createProviderCallBudget(0)).toThrow(ProviderCallBudgetExceededError);
  });

  it.each(PROVIDER_FAILURE_KINDS)('%s: never retried automatically and never produces intake events', (kind) => {
    const handling = PROVIDER_FAILURE_HANDLING[kind];
    expect(handling.automaticRetry).toBe(false);
    expect(handling.producesIntakeEvents).toBe(false);
  });

  it('rate limit, authentication failure and provider unavailable halt the run; later calls are refused', () => {
    for (const kind of ['RATE_LIMITED', 'AUTHENTICATION_FAILED', 'PROVIDER_UNAVAILABLE'] as const) {
      const budget = createProviderCallBudget();
      budget.consume();
      expect(budget.recordFailure(kind).haltIntegration).toBe(true);
      expect(budget.halted).toBe(kind);
      expect(() => budget.consume()).toThrow(/halted/);
    }
    expect(PROVIDER_FAILURE_HANDLING.EMPTY_RESULT.outcome).toBe('COMPLETED_EMPTY');
    expect(PROVIDER_FAILURE_HANDLING.MALFORMED_RESPONSE.outcome).toBe('REJECTED');
    expect(PROVIDER_FAILURE_HANDLING.DUPLICATE_RESULT.outcome).toBe('SKIPPED_DUPLICATE');
    expect(PROVIDER_FAILURE_HANDLING.TIMEOUT).toMatchObject({ outcome: 'FAILED', haltIntegration: false });
  });

  it('an empty provider response yields no events', () => {
    expect(normalizeProviderBatch([], OPTIONS)).toEqual([]);
  });
});

describe('OD-13 X1 exact-result binding at the save boundary (INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001)', () => {
  const NOW = OPTIONS.now;
  // Two SUPPLIED_TO_US items and one PUBLISHED item from ONE verified result.
  const RESULT = aiPlatformSignal({
    evidence: [
      {
        origin: 'SUPPLIED_TO_US',
        derivation: 'STATED_BY_BUSINESS',
        requirement: 'requestedWebsite',
        statement: 'We want a new admissions website',
        referenceUrl: 'https://landing.example.com/forms/ai-ad/1',
        observedAt: new Date('2026-01-30T09:15:00.000Z'),
      },
      {
        origin: 'PUBLISHED',
        derivation: 'STATED_BY_BUSINESS',
        requirement: 'requestedMobileApp',
        statement: 'We are looking for a mobile app partner',
        referenceUrl: 'https://university.example.edu/news/app',
        observedAt: new Date('2026-01-29T08:00:00.000Z'),
      },
      {
        origin: 'SUPPLIED_TO_US',
        derivation: 'STATED_BY_BUSINESS',
        requirement: 'statedRequirement',
        statement: 'Budget approved for Q2',
        observedAt: new Date('2026-01-31T10:00:00.000Z'),
      },
    ],
  });
  const OTHER_RESULT = aiPlatformSignal({ externalId: 'aiad-0002' });
  const PUBLISHED_ONLY_RESULT = aiPlatformSignal({
    externalId: 'aiad-0003',
    evidence: [
      {
        origin: 'PUBLISHED',
        derivation: 'STATED_BY_BUSINESS',
        requirement: 'requestedWebsite',
        statement: 'We want a new admissions website',
        observedAt: new Date('2026-01-30T09:15:00.000Z'),
      },
    ],
  });

  function intakeOf(proof: ReturnType<typeof signProof>, options = OPTIONS): RecordIntentIntakeInput {
    const outcome = normalizeVerifiedProviderResult(proof, options);
    if (outcome.status !== 'NORMALIZED') throw new Error(`expected NORMALIZED, got ${JSON.stringify(outcome)}`);
    return outcome.event.intake;
  }

  /** Validates `intake` as recordIntentIntakeForOwner does, then runs the P3 check. */
  function bind(intake: RecordIntentIntakeInput, proof: unknown = intake.providerAuthenticity, at = NOW): void {
    requireExactProviderResultForIntake(toIntentIntakeInput(intake, at), proof, at);
  }

  function bindError(run: () => void): IntentSignalValidationError {
    try {
      run();
    } catch (error) {
      if (error instanceof IntentSignalValidationError) return error;
      throw error;
    }
    throw new Error('expected the save boundary to refuse the event');
  }

  function withSignals(intake: RecordIntentIntakeInput, signals: RecordIntentIntakeInput['signals']): RecordIntentIntakeInput {
    return { ...intake, signals };
  }

  function patchEntry(intake: RecordIntentIntakeInput, index: number, patch: Record<string, unknown>): RecordIntentIntakeInput {
    return withSignals(
      intake,
      intake.signals.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  }

  it('accepts FIRST_PARTY signals equal to those derived from the exact verified result', () => {
    const intake = intakeOf(signProof(RESULT));
    expect(intake.signals.map((entry) => entry.kind)).toEqual(['FIRST_PARTY', 'PUBLIC_INTENT', 'FIRST_PARTY']);
    expect(() => bind(intake)).not.toThrow();
  });

  it('refuses a missing trailing FIRST_PARTY entry (field `signals`)', () => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(withSignals(intake, intake.signals.slice(0, 2))));
    expect(error).toMatchObject({ field: 'signals', reason: 'result-mismatch' });
  });

  it('refuses a missing leading FIRST_PARTY entry at the first position that differs', () => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(withSignals(intake, intake.signals.slice(1))));
    expect(error).toMatchObject({ field: 'signals[1]', reason: 'result-mismatch' });
  });

  it('refuses an extra FIRST_PARTY entry, even a copy of a genuine one', () => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(withSignals(intake, [...intake.signals, intake.signals[2]!])));
    expect(error).toMatchObject({ field: 'signals[3]', reason: 'result-mismatch' });
  });

  it('refuses reordered FIRST_PARTY entries', () => {
    const intake = intakeOf(signProof(RESULT));
    const [a, b, c] = intake.signals;
    const error = bindError(() => bind(withSignals(intake, [c!, b!, a!])));
    expect(error).toMatchObject({ field: 'signals[0]', reason: 'result-mismatch' });
  });

  it.each([
    ['field', { field: 'requestedDevelopment' }],
    ['quote', { quote: 'We want a new admissions website and an app' }],
    ['sourceUrl', { sourceUrl: 'https://landing.example.com/forms/ai-ad/2' }],
    ['sourceLabel', { sourceLabel: 'AI-platform acquisition · ai referral' }],
    ['observedAt', { observedAt: new Date('2026-01-30T09:15:00.001Z') }],
  ])('refuses a changed %s', (_name, patch) => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(patchEntry(intake, 2, patch)));
    expect(error).toMatchObject({ field: 'signals[2]', reason: 'result-mismatch' });
  });

  it.each([
    ['businessId', { businessId: 'fixture-business-0002' }],
    ['authorizedAt', { authorizedAt: new Date('2026-01-16T00:00:00.000Z') }],
  ])('refuses a changed authorization-evidence %s', (_name, patch) => {
    const intake = intakeOf(signProof(RESULT));
    const evidence = intake.signals[0]!.authorizationEvidence!;
    const error = bindError(() => bind(patchEntry(intake, 0, { authorizationEvidence: { ...evidence, ...patch } })));
    expect(error).toMatchObject({ field: 'signals[0]', reason: 'result-mismatch' });
  });

  it.each([
    ['status', { status: 'REVOKED' }],
    ['scope', { scope: 'MARKETING' }],
  ])('compares authorization-evidence %s too (values OD-1 / OD-3 already refuse before P3)', (_name, patch) => {
    const proof = signProof(RESULT);
    const validated = toIntentIntakeInput(intakeOf(proof), NOW);
    const [first, ...rest] = validated.signals;
    const altered: ValidatedIntentIntake = {
      ...validated,
      signals: [
        { ...first!, signal: { ...first!.signal, authorizationEvidence: { ...first!.signal.authorizationEvidence!, ...patch } as never } },
        ...rest,
      ],
    };
    const error = bindError(() => requireExactProviderResultForIntake(altered, proof, NOW));
    expect(error).toMatchObject({ field: 'signals[0]', reason: 'result-mismatch' });
  });

  it('a changed authorization-evidence integrationId stays refused by the existing integration check', () => {
    const intake = intakeOf(signProof(RESULT));
    const evidence = intake.signals[0]!.authorizationEvidence!;
    const error = bindError(() => bind(patchEntry(intake, 0, { authorizationEvidence: { ...evidence, integrationId: 'other-integration' } })));
    expect(error).toMatchObject({ field: 'signals[0].authorizationEvidence.integrationId', reason: 'invalid' });
  });

  it.each([
    ['companyName', { companyName: 'Example College' }],
    ['website', { website: 'https://college.example.edu' }],
  ])('refuses a changed %s', (field, patch) => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind({ ...intake, ...patch }));
    expect(error).toMatchObject({ field, reason: 'result-mismatch' });
  });

  it('PUBLIC_INTENT entries do not participate: dropped, altered or added, the event is accepted', () => {
    const intake = intakeOf(signProof(RESULT));
    const [a, b, c] = intake.signals;
    const extraPublic = { ...b!, quote: 'An unrelated public statement', sourceUrl: 'https://forum.example.org/t/9' };
    expect(() => bind(withSignals(intake, [a!, c!]))).not.toThrow();
    expect(() => bind(withSignals(intake, [a!, { ...b!, quote: 'Changed public quote' }, c!]))).not.toThrow();
    expect(() => bind(withSignals(intake, [extraPublic, a!, b!, c!, extraPublic]))).not.toThrow();
  });

  it('searchId does not participate', () => {
    const intake = intakeOf(signProof(RESULT));
    expect(() => bind({ ...intake, searchId: 'search_other' })).not.toThrow();
  });

  it('one proof may be normalized more than once and presented more than once (not single-use, nothing recorded)', () => {
    const proof = signProof(RESULT);
    const first = intakeOf(proof, { searchId: 'search_1', now: NOW });
    const second = intakeOf(proof, { searchId: 'search_2', now: new Date(NOW.getTime() + 60_000) });
    expect(() => bind(first)).not.toThrow();
    expect(() => bind(second)).not.toThrow();
    expect(() => bind(first)).not.toThrow();
  });

  it('refuses FIRST_PARTY signals paired with a proof of another result of the same integration', () => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(intake, signProof(OTHER_RESULT)));
    expect(error).toMatchObject({ field: 'signals[0]', reason: 'result-mismatch' });
  });

  it('refuses FIRST_PARTY signals paired with a proof whose result carries no SUPPLIED_TO_US item', () => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(intake, signProof(PUBLISHED_ONLY_RESULT)));
    expect(error).toMatchObject({ field: 'signals[0]', reason: 'result-mismatch' });
  });

  it('refuses FIRST_PARTY signals paired with a proof whose result is not a provider result at all', () => {
    const intake = intakeOf(signProof(RESULT));
    const error = bindError(() => bind(intake, signProof({ fixture: true })));
    expect(error).toMatchObject({ field: 'signals[0]', reason: 'result-mismatch' });
  });

  it('mismatch errors name identifier, field and reason only — never a presented or verified value', () => {
    const intake = intakeOf(signProof(RESULT));
    const errors = [
      bindError(() => bind(patchEntry(intake, 0, { quote: 'SECRET-PRESENTED-QUOTE' }))),
      bindError(() => bind({ ...intake, companyName: 'SECRET-PRESENTED-COMPANY' })),
      bindError(() => bind({ ...intake, website: 'https://secret-presented.example.com' })),
      bindError(() => bind(withSignals(intake, intake.signals.slice(0, 2)))),
      bindError(() => bind(intake, signProof(OTHER_RESULT))),
    ];
    const secrets = [
      'SECRET-PRESENTED',
      'secret-presented',
      'We want a new admissions website',
      'Budget approved',
      'Example University',
      'university.example.edu',
      'landing.example.com',
      'fixture-business-0001',
      'fixture-integration',
      'aiad-000',
    ];
    for (const error of errors) {
      expect(error.reason).toBe('result-mismatch');
      const text = `${error.message} ${error.field} ${JSON.stringify(error)}`;
      for (const secret of secrets) expect(text).not.toContain(secret);
    }
  });

  it("re-derives at the proof's receivedAt, not at the save-time now (Q-X4)", () => {
    // authorizedAt 2026-01-15: inside 90 days at receipt, outside at the later save time.
    const receivedAt = new Date('2026-04-14T12:00:00.000Z');
    const savedAt = new Date('2026-04-20T12:00:00.000Z');
    const result = aiPlatformSignal({ capturedAt: receivedAt });
    const proof = signProof(result, receivedAt);
    const validatedAtReceipt = toIntentIntakeInput(intakeOf(proof, { searchId: 'search_1', now: receivedAt }), receivedAt);
    // Re-deriving at savedAt would refuse the authorization (OD-2) and so mismatch.
    expect(normalizeVerifiedProviderResult(proof, { searchId: 'search_1', now: savedAt }).status).toBe('REJECTED');
    expect(() => requireExactProviderResultForIntake(validatedAtReceipt, proof, savedAt)).not.toThrow();
  });

  it('existing P3 behavior is unchanged: no FIRST_PARTY needs no proof; a missing or forged proof is refused as before', () => {
    const intake = intakeOf(signProof(RESULT));
    const withoutProof: RecordIntentIntakeInput = { searchId: intake.searchId, companyName: intake.companyName, website: intake.website, signals: intake.signals };
    expect(() => bind(withSignals(withoutProof, [intake.signals[1]!]))).not.toThrow();
    expect(bindError(() => bind(withoutProof))).toMatchObject({ field: 'providerAuthenticity', reason: 'required' });
    expect(bindError(() => bind(intake, { integrationId: TEST_INTEGRATION_ID, keyId: TEST_KEY_ID }))).toMatchObject({
      field: 'providerAuthenticity',
      reason: 'required',
    });
  });
});

// K1 (CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md §6, §10.6, §10.8).
describe('K1 — provider-path contact-identifier enforcement', () => {
  it('L1/L3: an offending evidence statement rejects the whole result; other batch results unaffected', () => {
    const offending = webFixtures.ordinary();
    const withOffending = {
      ...offending,
      snippet: `${offending.snippet} Call 98765 43210 for details.`,
      intentEvidence: { ...offending.intentEvidence!, evidence: 'Call 98765 43210 for details' },
    };
    const outcomes = normalizeProviderBatch([webFixtures.hiring(), withOffending, webFixtures.migration()], OPTIONS);
    expect(outcomes.map((o) => o.status)).toEqual(['NORMALIZED', 'REJECTED', 'NORMALIZED']);
    expect(outcomes[1]).toMatchObject({ field: 'intentEvidence.evidence', reason: 'not-allowed' });
  });

  it('personal email in evidence is rejected; business email at the website domain is not', () => {
    const base = webFixtures.ordinary();
    const personal = {
      ...base,
      snippet: `${base.snippet} Reach us at jane@gmail.com.`,
      intentEvidence: { ...base.intentEvidence!, evidence: 'Reach us at jane@gmail.com' },
    };
    expect(rejected(personal)).toMatchObject({ field: 'intentEvidence.evidence', reason: 'not-allowed' });

    const business = {
      ...base,
      business: { name: base.business!.name, website: 'https://www.bakery.example.com' },
      snippet: `${base.snippet} Reach us at info@bakery.example.com.`,
      intentEvidence: { ...base.intentEvidence!, evidence: 'Reach us at info@bakery.example.com' },
    };
    expect(normalized(business).status).toBe('NORMALIZED');
  });

  it('L4: K1 runs after the UNATTRIBUTED skip -- an unattributed result with a personal email is UNATTRIBUTED, not REJECTED', () => {
    const base = webFixtures.ordinary();
    const unattributed = {
      ...base,
      business: null,
      snippet: `${base.snippet} jane@gmail.com`,
      intentEvidence: { ...base.intentEvidence!, evidence: base.intentEvidence!.evidence },
    };
    expect(normalize(unattributed).status).toBe('UNATTRIBUTED');
  });

  it('L2: AI-platform pushed path rejects a FIRST_PARTY+PUBLISHED mix on an offending PUBLISHED statement', () => {
    const clean = aiPlatformSignal().evidence[0]!;
    const offending = {
      ...clean,
      origin: 'PUBLISHED' as const,
      statement: 'Call 98765 43210 about the admissions website',
    };
    const result = aiPlatformSignal({ evidence: [clean, offending] });
    expect(rejected(result)).toMatchObject({ field: 'evidence[1].statement', reason: 'not-allowed' });
  });

  it('public-intent notice: offending intentEvidence[i].evidence rejects the whole notice', () => {
    const base = noticeFixtures.publicNotice();
    const offending = {
      ...base,
      body: `${base.body} Contact jane@gmail.com for queries.`,
      intentEvidence: base.intentEvidence.map((item, i) => (i === 0 ? { ...item, evidence: 'Contact jane@gmail.com for queries' } : item)),
    };
    expect(rejected(offending)).toMatchObject({ field: 'intentEvidence[0].evidence', reason: 'not-allowed' });
  });

  it('context.* (PG-2): an obfuscated email or phone in context.targetCustomer/geography/service rejects the result', () => {
    const base = webFixtures.ordinary();
    for (const field of ['targetCustomer', 'geography', 'service'] as const) {
      const withContext = { ...base, context: { [field]: 'call 98765 43210' } };
      expect(rejected(withContext)).toMatchObject({ field: `context.${field}`, reason: 'not-allowed' });
    }
    const obfuscatedEmail = { ...base, context: { targetCustomer: 'contact info [at] example [dot] com' } };
    expect(rejected(obfuscatedEmail)).toMatchObject({ field: 'context.targetCustomer', reason: 'not-allowed' });
  });

  it('context.* : ordinary values and fragments are not rejected by K1', () => {
    const base = webFixtures.ordinary();
    const ok = { ...base, context: { targetCustomer: 'mid-size manufacturers', geography: 'Pune, India', service: 'mobile app development' } };
    expect(normalized(ok).status).toBe('NORMALIZED');
    const fragments = { ...base, context: { targetCustomer: 'jane@', geography: '98765 XXXXX' } };
    expect(normalized(fragments).status).toBe('NORMALIZED');
  });

  it('PG-3 / L14: an identifier only in title or snippet (never in intentEvidence.evidence) is not screened and the result normalizes', () => {
    const base = webFixtures.ordinary();
    const titleOnly = { ...base, title: `${base.title} jane@gmail.com` };
    expect(normalized(titleOnly).status).toBe('NORMALIZED');
  });
});
