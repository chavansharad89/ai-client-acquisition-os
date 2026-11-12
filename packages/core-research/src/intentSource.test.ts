import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IntentSignalValidationError, toIntentIntakeInput } from './intentSignal';
import {
  INTENT_SOURCE_TYPES,
  normalizeIntentEvent,
  type AcquisitionSourceAdapter,
  type IntentSourceCandidate,
} from './intentSource';
import {
  aiPlatformAcquisitionAdapter,
  publicIntentNoticeAdapter,
  publicWebSearchAdapter,
} from './intentSourceAdapters';
import {
  aiPlatformAcquisitionFixture,
  FIXTURE_CAPTURED_AT,
  authorizationEvidenceFixture,
  FIXTURE_NOW,
  publicIntentNoticeFixture,
  publicWebSearchFixture,
} from './intentSourceFixtures';
import { fakeResearchSignalRepository } from './testSupport';

// Acquisition-source adapter layer — provider-free. Fixtures only; fetch is
// stubbed to fail so any network attempt would surface as an error.

const OPTIONS = { searchId: 'search_1', capturedAt: FIXTURE_CAPTURED_AT, now: FIXTURE_NOW };

const fetchSpy = vi.fn(() => {
  throw new Error('network access is not allowed in adapter tests');
});
beforeEach(() => {
  fetchSpy.mockClear();
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  vi.unstubAllGlobals();
  expect(fetchSpy).not.toHaveBeenCalled();
});

function rejection(fn: () => unknown): IntentSignalValidationError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(IntentSignalValidationError);
    return error as IntentSignalValidationError;
  }
  throw new Error('expected IntentSignalValidationError');
}

/** Wraps an adapter so a test can tamper with its candidate. */
function tampered<Raw>(
  adapter: AcquisitionSourceAdapter<Raw>,
  edit: (candidate: IntentSourceCandidate) => unknown,
): AcquisitionSourceAdapter<Raw> {
  return { ...adapter, normalize: (raw) => edit(adapter.normalize(raw)) as IntentSourceCandidate };
}

const CASES: ReadonlyArray<{ name: string; adapter: AcquisitionSourceAdapter<never>; fixture: () => never }> = [
  { name: 'public web search', adapter: publicWebSearchAdapter, fixture: publicWebSearchFixture as () => never },
  {
    name: 'AI-platform acquisition',
    adapter: aiPlatformAcquisitionAdapter,
    fixture: aiPlatformAcquisitionFixture as () => never,
  },
  { name: 'public intent notice', adapter: publicIntentNoticeAdapter, fixture: publicIntentNoticeFixture as () => never },
];

describe('adapter contract', () => {
  it.each(CASES)('$name satisfies the common contract, deterministically', ({ adapter, fixture }) => {
    const raw = fixture();
    const identity = adapter.identifySource(raw);
    expect(identity.sourceFamily).toBe(adapter.sourceFamily);
    expect(INTENT_SOURCE_TYPES[adapter.sourceFamily] as readonly string[]).toContain(identity.sourceType);

    const candidate = adapter.normalize(raw);
    expect(candidate).toMatchObject(identity);
    for (const key of ['kind', 'confidence', 'classification']) {
      expect(candidate).not.toHaveProperty(key);
      for (const signal of candidate.signals) expect(signal).not.toHaveProperty(key);
    }

    const first = normalizeIntentEvent(adapter, raw, OPTIONS);
    const replay = normalizeIntentEvent(adapter, fixture(), OPTIONS);
    expect(replay.eventId).toBe(first.eventId);
    expect(first.eventId).toMatch(/^[0-9a-f]{64}$/);
  });

  it('different source content gives a different eventId', () => {
    const a = normalizeIntentEvent(publicWebSearchAdapter, publicWebSearchFixture(), OPTIONS);
    const b = normalizeIntentEvent(
      publicWebSearchAdapter,
      { ...publicWebSearchFixture(), excerpt: 'A different public requirement for an app' },
      OPTIONS,
    );
    expect(b.eventId).not.toBe(a.eventId);
  });

  it('rejects malformed source data', () => {
    expect(
      rejection(() => normalizeIntentEvent(publicWebSearchAdapter, { ...publicWebSearchFixture(), excerpt: '' }, OPTIONS)),
    ).toMatchObject({ field: 'signals[0].quote', reason: 'required' });
    expect(
      rejection(() =>
        normalizeIntentEvent(publicWebSearchAdapter, { ...publicWebSearchFixture(), requirement: 'companySummary' as never }, OPTIONS),
      ),
    ).toMatchObject({ field: 'signals[0].field', reason: 'unsupported' });
    expect(
      rejection(() =>
        normalizeIntentEvent(publicWebSearchAdapter, { ...publicWebSearchFixture(), resultType: 'AI_REFERRAL' as never }, OPTIONS),
      ),
    ).toMatchObject({ field: 'sourceType', reason: 'unsupported' });
    expect(
      rejection(() => normalizeIntentEvent(publicIntentNoticeAdapter, { ...publicIntentNoticeFixture(), requirements: [] }, OPTIONS)),
    ).toMatchObject({ field: 'signals', reason: 'required' });
    expect(
      rejection(() =>
        normalizeIntentEvent(
          publicWebSearchAdapter,
          { ...publicWebSearchFixture(), organization: { name: 'Example EdTech Pvt Ltd', website: '' } },
          OPTIONS,
        ),
      ),
    ).toMatchObject({ field: 'website', reason: 'required' });
    expect(
      rejection(() => normalizeIntentEvent(tampered(publicWebSearchAdapter, (c) => ({ ...c, sourceFamily: 'PUBLIC_INTENT_NOTICE' })), publicWebSearchFixture(), OPTIONS)),
    ).toMatchObject({ field: 'sourceFamily' });
  });

  it('rejects missing or unusable provenance', () => {
    expect(
      rejection(() => normalizeIntentEvent(publicWebSearchAdapter, { ...publicWebSearchFixture(), pageUrl: '' }, OPTIONS)),
    ).toMatchObject({ field: 'signals[0].sourceReference', reason: 'required' });
    expect(
      rejection(() => normalizeIntentEvent(publicWebSearchAdapter, { ...publicWebSearchFixture(), pageUrl: 'not a url' }, OPTIONS)),
    ).toMatchObject({ field: 'signals[0].sourceReference', reason: 'invalid' });
    expect(
      rejection(() =>
        normalizeIntentEvent(publicWebSearchAdapter, { ...publicWebSearchFixture(), publishedAt: undefined as never }, OPTIONS),
      ),
    ).toMatchObject({ field: 'signals[0].observedAt', reason: 'required' });
    expect(
      rejection(() =>
        normalizeIntentEvent(
          publicWebSearchAdapter,
          { ...publicWebSearchFixture(), publishedAt: new Date(FIXTURE_CAPTURED_AT.getTime() + 1) },
          OPTIONS,
        ),
      ),
    ).toMatchObject({ field: 'signals[0].observedAt', reason: 'invalid' });
    expect(
      rejection(() =>
        normalizeIntentEvent(publicWebSearchAdapter, publicWebSearchFixture(), { ...OPTIONS, capturedAt: new Date('invalid') }),
      ),
    ).toMatchObject({ field: 'capturedAt', reason: 'invalid' });
  });

  it('rejects a source-assigned confidence, classification or kind — at event or signal level', () => {
    for (const key of ['confidence', 'classification', 'kind']) {
      const eventLevel = tampered(publicWebSearchAdapter, (c) => ({ ...c, [key]: key === 'confidence' ? 100 : 'OBSERVED' }));
      expect(rejection(() => normalizeIntentEvent(eventLevel, publicWebSearchFixture(), OPTIONS))).toMatchObject({
        field: key,
        reason: 'not-allowed',
      });
      const signalLevel = tampered(publicWebSearchAdapter, (c) => ({
        ...c,
        signals: c.signals.map((s) => ({ ...s, [key]: key === 'confidence' ? 95 : 'INFERRED' })),
      }));
      expect(rejection(() => normalizeIntentEvent(signalLevel, publicWebSearchFixture(), OPTIONS))).toMatchObject({
        field: `signals[0].${key}`,
        reason: 'not-allowed',
      });
    }
  });

  it('public-web and public-notice sources cannot claim first-party disclosure', () => {
    const claimsFirstParty = tampered(publicIntentNoticeAdapter, (c) => ({
      ...c,
      signals: c.signals.map((s) => ({ ...s, disclosure: 'SUPPLIED_TO_US' })),
    }));
    expect(rejection(() => normalizeIntentEvent(claimsFirstParty, publicIntentNoticeFixture(), OPTIONS))).toMatchObject({
      field: 'signals[0].disclosure',
      reason: 'unsupported',
    });
  });
});

describe('normalization — fixed D5 values through the central path', () => {
  it('Google public-intent fixture → PUBLIC_INTENT, OBSERVED, 70', () => {
    const event = normalizeIntentEvent(publicWebSearchAdapter, publicWebSearchFixture(), OPTIONS);
    expect(event.signals).toHaveLength(1);
    expect(event.signals[0]).toMatchObject({
      kind: 'PUBLIC_INTENT',
      classification: 'OBSERVED',
      confidence: 70,
      field: 'requestedMobileApp',
      evidence: 'Public RFP seeking development of a mobile learning platform',
    });
    expect(event.intake.companyName).toBe('Example EdTech Pvt Ltd');
  });

  it('AI-ad fixture (supplied by the business through the integration) → FIRST_PARTY, OBSERVED, 90', () => {
    const event = normalizeIntentEvent(aiPlatformAcquisitionAdapter, aiPlatformAcquisitionFixture(), OPTIONS);
    expect(event.signals[0]).toMatchObject({ kind: 'FIRST_PARTY', classification: 'OBSERVED', confidence: 90 });
    expect(event.signals[0]!.provenance.sourceReference).toBe('https://landing.example.com/forms/ai-ad');
  });

  it('generic public-intent fixture → PUBLIC_INTENT, OBSERVED, 70', () => {
    const event = normalizeIntentEvent(publicIntentNoticeAdapter, publicIntentNoticeFixture(), OPTIONS);
    expect(event.signals[0]).toMatchObject({ kind: 'PUBLIC_INTENT', classification: 'OBSERVED', confidence: 70 });
  });

  it('the intake payload is exactly what toIntentIntakeInput accepts, and carries no confidence/classification', () => {
    for (const { adapter, fixture } of CASES) {
      const event = normalizeIntentEvent(adapter, fixture(), OPTIONS);
      const validated = toIntentIntakeInput(event.intake, FIXTURE_NOW);
      expect(validated.signals.map((s) => s.signal.confidence)).toEqual(event.signals.map((s) => s.confidence));
      for (const entry of event.intake.signals) {
        expect(entry).not.toHaveProperty('confidence');
        expect(entry).not.toHaveProperty('classification');
      }
    }
  });
});

describe('multi-signal source events', () => {
  it('PUBLIC_INTENT + FIRST_PARTY in one AI-platform event → one intake event, both signals, own observedAt', () => {
    const raw = aiPlatformAcquisitionFixture();
    const published = new Date('2026-01-25T07:00:00.000Z');
    raw.interests = [
      ...raw.interests,
      {
        disclosure: 'PUBLISHED',
        requirement: 'statedRequirement',
        statement: 'Our public tender invites bids for a campus app',
        referenceUrl: 'https://university.example.edu/tenders/campus-app',
        occurredAt: published,
      },
    ];
    const event = normalizeIntentEvent(aiPlatformAcquisitionAdapter, raw, OPTIONS);
    expect(event.signals.map((s) => [s.kind, s.confidence])).toEqual([
      ['FIRST_PARTY', 90],
      ['PUBLIC_INTENT', 70],
    ]);
    expect(event.intake.signals.map((s) => s.observedAt)).toEqual([raw.interests[0]!.occurredAt, published]);
    expect(event.intake.signals[1]!.sourceUrl).toBe('https://university.example.edu/tenders/campus-app');
  });

  it('OD-7: the event evidence rides on FIRST_PARTY intake entries only, and reaches the validated row', () => {
    const raw = aiPlatformAcquisitionFixture();
    raw.interests = [
      ...raw.interests,
      {
        disclosure: 'PUBLISHED',
        requirement: 'statedRequirement',
        statement: 'Our public tender invites bids for a campus app',
        referenceUrl: 'https://university.example.edu/tenders/campus-app',
        occurredAt: new Date('2026-01-25T07:00:00.000Z'),
      },
    ];
    const event = normalizeIntentEvent(aiPlatformAcquisitionAdapter, raw, OPTIONS);
    expect(event.intake.signals[0]!.authorizationEvidence).toEqual(authorizationEvidenceFixture());
    expect(event.intake.signals[1]).not.toHaveProperty('authorizationEvidence');
    const validated = toIntentIntakeInput(event.intake, FIXTURE_NOW);
    expect(validated.signals[0]!.signal.authorizationEvidence).toEqual(authorizationEvidenceFixture());
    expect(validated.signals[1]!.signal).not.toHaveProperty('authorizationEvidence');
  });

  it('OD-7: a FIRST_PARTY event without evidence is rejected before anything is returned', () => {
    const { authorizationEvidence: _omitted, ...raw } = aiPlatformAcquisitionFixture();
    expect(rejection(() => normalizeIntentEvent(aiPlatformAcquisitionAdapter, raw, OPTIONS))).toMatchObject({
      field: 'signals[0].authorizationEvidence',
      reason: 'required',
    });
  });

  it('multiple same-kind signals in one notice are all kept', () => {
    const raw = publicIntentNoticeFixture();
    raw.requirements = [...raw.requirements, { requirement: 'requestedMobileApp', text: 'A companion mobile app is also required' }];
    const event = normalizeIntentEvent(publicIntentNoticeAdapter, raw, OPTIONS);
    expect(event.signals.map((s) => s.kind)).toEqual(['PUBLIC_INTENT', 'PUBLIC_INTENT']);
  });

  it('one invalid entry rejects the whole event', () => {
    const raw = aiPlatformAcquisitionFixture();
    raw.interests = [...raw.interests, { ...raw.interests[0]!, statement: '' }];
    expect(rejection(() => normalizeIntentEvent(aiPlatformAcquisitionAdapter, raw, OPTIONS))).toMatchObject({
      field: 'signals[1].quote',
    });
  });
});

describe('provenance', () => {
  it('source metadata survives normalization and reaches the persistence input', async () => {
    const event = normalizeIntentEvent(publicWebSearchAdapter, publicWebSearchFixture(), OPTIONS);
    expect(event).toMatchObject({
      sourceFamily: 'PUBLIC_WEB_SEARCH',
      sourceType: 'PROCUREMENT_NOTICE',
      externalId: 'result-edtech-0001',
      capturedAt: FIXTURE_CAPTURED_AT,
      context: { targetCustomer: 'EdTech companies', geography: 'India', service: 'Mobile app development' },
    });
    expect(event.signals[0]!.provenance).toEqual({
      sourceFamily: 'PUBLIC_WEB_SEARCH',
      sourceType: 'PROCUREMENT_NOTICE',
      externalId: 'result-edtech-0001',
      sourceReference: 'https://procurement.example.org/notices/edtech-mobile-learning',
      sourceLabel: 'Public web search · procurement notice',
      observedAt: new Date('2026-01-28T08:00:00.000Z'),
      capturedAt: FIXTURE_CAPTURED_AT,
    });

    // Persistence input: the same rows recordIntentIntakeForOwner saves.
    const repo = fakeResearchSignalRepository();
    for (const { signal, observedAt } of toIntentIntakeInput(event.intake, FIXTURE_NOW).signals) {
      await repo.saveSignals('p1', [signal], observedAt);
    }
    expect(repo.rows[0]).toMatchObject({
      kind: 'PUBLIC_INTENT',
      confidence: 70,
      observedAt: new Date('2026-01-28T08:00:00.000Z'),
      sources: [
        expect.objectContaining({
          sourceUrl: 'https://procurement.example.org/notices/edtech-mobile-learning',
          sourceQuote: 'Public RFP seeking development of a mobile learning platform',
          sourceLabel: 'Public web search · procurement notice',
        }),
      ],
    });
  });
});

describe('privacy boundary', () => {
  it('the normalized contract needs no individual-level data and declares it', () => {
    for (const { adapter, fixture } of CASES) {
      const event = normalizeIntentEvent(adapter, fixture(), OPTIONS);
      for (const signal of event.signals) {
        expect(signal.privacy).toMatchObject({ personalDataUsed: false, individualIdentityRequired: false });
        expect(signal.privacy.publicBusinessSignal).toBe(signal.kind === 'PUBLIC_INTENT');
        expect(signal.privacy.consentRequired).toBe(signal.kind === 'PUBLIC_INTENT' ? false : null);
      }
    }
  });

  it.each([
    ['searchHistory', ['restaurant app developers']],
    ['search_query', 'app developer near me'],
    ['cookies', 'NID=abc'],
    ['deviceId', 'device-123'],
    ['advertising_id', 'ad-123'],
    ['googleAccountId', '1234567890'],
    ['conversation', [{ role: 'user', content: 'build me a website' }]],
    ['prompt', 'build me a website'],
    ['email', 'someone@example.com'],
    ['userId', 'user-1'],
  ])('rejects raw input carrying %s', (key, value) => {
    const raw = { ...aiPlatformAcquisitionFixture(), [key]: value };
    expect(rejection(() => normalizeIntentEvent(aiPlatformAcquisitionAdapter, raw, OPTIONS))).toMatchObject({
      field: key,
      reason: 'not-allowed',
    });
  });

  it('rejects personal data nested inside a source record', () => {
    const raw = aiPlatformAcquisitionFixture();
    const interests = [{ ...raw.interests[0]!, chatTranscript: 'user: I need a website' }];
    expect(
      rejection(() => normalizeIntentEvent(aiPlatformAcquisitionAdapter, { ...raw, interests }, OPTIONS)),
    ).toMatchObject({ field: 'interests[0].chatTranscript', reason: 'not-allowed' });
  });

  it('rejects a source reference carrying a click/tracking identifier', () => {
    const raw = { ...publicWebSearchFixture(), pageUrl: 'https://procurement.example.org/n/1?gclid=abc123' };
    expect(rejection(() => normalizeIntentEvent(publicWebSearchAdapter, raw, OPTIONS))).toMatchObject({
      field: 'signals[0].sourceReference',
      reason: 'not-allowed',
    });
  });
});
