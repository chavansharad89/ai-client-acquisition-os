import { scoreLead, scoreProspect, SOURCE_WEIGHT, type ProspectInput } from '@acos/core-acquisition';
import { describe, expect, it } from 'vitest';

import {
  AUTHORIZATION_DURATION_DAYS,
  INTENT_SIGNAL_CONFIDENCE,
  IntentSignalValidationError,
  isIntentSignalKind,
  toIntentIntakeInput,
  toIntentSignalInput,
  type AuthorizationEvidence,
  type RecordIntentIntakeInput,
  type RecordIntentSignalInput,
} from './intentSignal';
import { toScoringSignals } from './scoringAdapter';
import { fakeResearchSignalRepository } from './testSupport';
import type { NewResearchSignalInput } from './types';

// INTENT-INTAKE-PO-DEC-001: intake signal construction (D5), research
// supersession scope (C2), and the unchanged scoring contract (D1/D2).

const NOW = new Date('2026-02-01T12:00:00.000Z');
const OBSERVED_AT = new Date('2026-01-30T09:15:00.000Z');

/** Complete, valid FIRST_PARTY authorization evidence (OD-1..OD-5). */
function evidence(overrides: Record<string, unknown> = {}): AuthorizationEvidence {
  return {
    businessId: 'integration-business-0001',
    status: 'GRANTED',
    scope: 'ACQUISITION',
    authorizedAt: new Date('2026-01-15T00:00:00.000Z'),
    integrationId: 'integration-0001',
    ...overrides,
  } as AuthorizationEvidence;
}

function input(overrides: Record<string, unknown> = {}): RecordIntentSignalInput {
  return {
    searchId: 'search_1',
    companyName: 'Acme Co',
    website: 'https://acme.example.com',
    kind: 'PUBLIC_INTENT',
    field: 'requestedMobileApp',
    quote: 'Looking for someone to build an app',
    sourceUrl: 'https://forum.example.org/t/123',
    sourceLabel: 'Public forum post',
    observedAt: OBSERVED_AT,
    ...overrides,
  } as RecordIntentSignalInput;
}

function expectRejected(overrides: Record<string, unknown>, field: string, reason: string) {
  try {
    toIntentSignalInput(input(overrides), NOW);
  } catch (error) {
    expect(error).toBeInstanceOf(IntentSignalValidationError);
    expect(error).toMatchObject({ field, reason });
    return;
  }
  throw new Error('expected IntentSignalValidationError');
}

describe('toIntentSignalInput — construction (D5)', () => {
  it('PUBLIC_INTENT becomes an OBSERVED signal at the fixed confidence 70', () => {
    const { signal } = toIntentSignalInput(input(), NOW);
    expect(signal).toMatchObject({ kind: 'PUBLIC_INTENT', classification: 'OBSERVED', confidence: 70, basis: null });
  });

  it('FIRST_PARTY becomes an OBSERVED signal at the fixed confidence 90', () => {
    const { signal } = toIntentSignalInput(input({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence() }), NOW);
    expect(signal).toMatchObject({ kind: 'FIRST_PARTY', classification: 'OBSERVED', confidence: 90 });
  });

  it('pins the decided values exactly', () => {
    expect(INTENT_SIGNAL_CONFIDENCE).toEqual({ PUBLIC_INTENT: 70, FIRST_PARTY: 90 });
  });

  it('preserves provenance: quote as claim and source quote, URL, label, and the source event time', () => {
    const validated = toIntentSignalInput(input(), NOW);
    expect(validated.observedAt).toBe(OBSERVED_AT);
    expect(validated.signal.signal).toBe('Looking for someone to build an app');
    expect(validated.signal.field).toBe('requestedMobileApp');
    expect(validated.signal.sources).toEqual([
      {
        sourceUrl: 'https://forum.example.org/t/123',
        sourceQuote: 'Looking for someone to build an app',
        sourceLabel: 'Public forum post',
      },
    ]);
  });
});

describe('toIntentSignalInput — validation', () => {
  it('rejects a caller-supplied confidence, even one equal to the fixed value', () => {
    expectRejected({ confidence: 100 }, 'confidence', 'not-allowed');
    expectRejected({ confidence: 70 }, 'confidence', 'not-allowed');
  });

  it('rejects a caller-supplied classification', () => {
    expectRejected({ classification: 'INFERRED' }, 'classification', 'not-allowed');
  });

  it('accepts only PUBLIC_INTENT and FIRST_PARTY', () => {
    for (const kind of ['WEBSITE', 'JOB_POST', 'MANUAL', 'SEARCH', 'PAID_AI', '']) {
      expectRejected({ kind }, 'kind', 'unsupported');
    }
  });

  it('rejects topical fields (R-71) and unknown fields', () => {
    for (const field of ['companySummary', 'businessModel', 'targetCustomers', 'businessDescription', 'anything']) {
      expectRejected({ field }, 'field', 'unsupported');
    }
  });

  it('requires observedAt and never invents one', () => {
    expectRejected({ observedAt: undefined }, 'observedAt', 'required');
    expectRejected({ observedAt: '2026-01-30' }, 'observedAt', 'required');
    expectRejected({ observedAt: new Date('not a date') }, 'observedAt', 'required');
  });

  it('rejects an observedAt in the future', () => {
    expectRejected({ observedAt: new Date(NOW.getTime() + 1) }, 'observedAt', 'invalid');
  });

  it('requires an absolute http(s) sourceUrl', () => {
    expectRejected({ sourceUrl: 'forum post 123' }, 'sourceUrl', 'invalid');
    expectRejected({ sourceUrl: 'ftp://files.example.org/x' }, 'sourceUrl', 'invalid');
  });

  it('requires every text field, within length bounds', () => {
    for (const field of ['searchId', 'companyName', 'website', 'quote', 'sourceUrl', 'sourceLabel']) {
      expectRejected({ [field]: '   ' }, field, 'required');
    }
    expectRejected({ quote: 'x'.repeat(2001) }, 'quote', 'too-long');
  });
});

describe('FIRST_PARTY authorization evidence at intake (OD-1..OD-7)', () => {
  const firstParty = (patch: Record<string, unknown>) =>
    ({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence(patch) });

  it('carries exactly the five values, verbatim, on the FIRST_PARTY row', () => {
    const supplied = { ...evidence({ businessId: '  Biz-ID ' }), basis: 'not persisted', reference: 'x' };
    const { signal } = toIntentSignalInput(input({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: supplied }), NOW);
    expect(signal.authorizationEvidence).toEqual(evidence({ businessId: '  Biz-ID ' }));
    expect(signal.authorizationEvidence).not.toBe(supplied);
  });

  it('PUBLIC_INTENT carries none; any evidence on it is rejected (OD-7)', () => {
    expect(toIntentSignalInput(input(), NOW).signal).not.toHaveProperty('authorizationEvidence');
    expectRejected({ authorizationEvidence: evidence() }, 'authorizationEvidence', 'not-allowed');
    expectRejected({ authorizationEvidence: null }, 'authorizationEvidence', 'not-allowed');
  });

  it('FIRST_PARTY without evidence is rejected, whatever path it arrives by (OD-7)', () => {
    expectRejected({ kind: 'FIRST_PARTY', field: 'statedRequirement' }, 'authorizationEvidence', 'required');
    expectRejected({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: 'GRANTED' }, 'authorizationEvidence', 'required');
  });

  it.each([
    ['businessId missing', { businessId: '' }, 'authorizationEvidence.businessId', 'required'],
    ['businessId is a phone URI', { businessId: 'tel:+15550100' }, 'authorizationEvidence.businessId', 'not-allowed'],
    ['status REVOKED', { status: 'REVOKED' }, 'authorizationEvidence.status', 'not-allowed'],
    ['status EXPIRED', { status: 'EXPIRED' }, 'authorizationEvidence.status', 'not-allowed'],
    ['status unrecognized', { status: 'Granted' }, 'authorizationEvidence.status', 'invalid'],
    ['status missing', { status: null }, 'authorizationEvidence.status', 'required'],
    ['scope other', { scope: 'RESALE' }, 'authorizationEvidence.scope', 'not-allowed'],
    ['scope whitespace', { scope: '  ' }, 'authorizationEvidence.scope', 'required'],
    ['authorizedAt in the future', { authorizedAt: new Date(NOW.getTime() + 1) }, 'authorizationEvidence.authorizedAt', 'invalid'],
    [
      'authorization expired',
      { authorizedAt: new Date(NOW.getTime() - AUTHORIZATION_DURATION_DAYS * 86_400_000 - 1) },
      'authorizationEvidence.authorizedAt',
      'not-allowed',
    ],
    ['integrationId missing', { integrationId: ' ' }, 'authorizationEvidence.integrationId', 'required'],
  ])('rejects %s', (_name, patch, field, reason) => {
    expectRejected(firstParty(patch), field, reason);
  });

  it('in a multi-signal event the error names the entry and nothing is returned', () => {
    expect(() =>
      toIntentIntakeInput(
        {
          searchId: 'search_1',
          companyName: 'Acme Co',
          website: 'https://acme.example.com',
          signals: [
            { kind: 'PUBLIC_INTENT', field: 'requestedMobileApp', quote: 'q', sourceUrl: 'https://forum.example.org/t/1', sourceLabel: 'l', observedAt: OBSERVED_AT },
            { ...firstParty({ status: 'REVOKED' }), quote: 'q', sourceUrl: 'https://landing.example.com/f', sourceLabel: 'l', observedAt: OBSERVED_AT },
          ],
        } as RecordIntentIntakeInput,
        NOW,
      ),
    ).toThrow(expect.objectContaining({ field: 'signals[1].authorizationEvidence.status', reason: 'not-allowed' }));
  });
});

describe('toIntentIntakeInput — multi-signal event', () => {
  const OTHER_OBSERVED_AT = new Date('2026-01-31T10:00:00.000Z');

  function event(signals: Record<string, unknown>[], overrides: Record<string, unknown> = {}): RecordIntentIntakeInput {
    const { searchId, companyName, website, ...entry } = input();
    return {
      searchId,
      companyName,
      website,
      signals: signals.map((s) => ({ ...entry, ...s })),
      ...overrides,
    } as RecordIntentIntakeInput;
  }

  it('builds one OBSERVED row per signal at the fixed D5 confidence, each with its own observedAt', () => {
    const validated = toIntentIntakeInput(
      event([{}, { kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence(), observedAt: OTHER_OBSERVED_AT }]),
      NOW,
    );
    expect(validated.searchId).toBe('search_1');
    expect(validated.signals.map(({ signal, observedAt }) => [signal.kind, signal.classification, signal.confidence, observedAt])).toEqual([
      ['PUBLIC_INTENT', 'OBSERVED', 70, OBSERVED_AT],
      ['FIRST_PARTY', 'OBSERVED', 90, OTHER_OBSERVED_AT],
    ]);
  });

  it('a one-signal event equals the single-signal construction', () => {
    const single = toIntentSignalInput(input(), NOW);
    const validated = toIntentIntakeInput(event([{}]), NOW);
    expect(validated.signals).toEqual([{ signal: single.signal, observedAt: single.observedAt }]);
  });

  it('rejects an empty or missing signal list', () => {
    expect(() => toIntentIntakeInput(event([]), NOW)).toThrow(
      expect.objectContaining({ field: 'signals', reason: 'required' }),
    );
    expect(() => toIntentIntakeInput(event([], { signals: undefined }), NOW)).toThrow(
      expect.objectContaining({ field: 'signals', reason: 'required' }),
    );
  });

  it('rejects confidence / classification at event or entry level, naming the entry', () => {
    for (const key of ['confidence', 'classification']) {
      expect(() => toIntentIntakeInput(event([{}], { [key]: 70 }), NOW)).toThrow(
        expect.objectContaining({ field: key, reason: 'not-allowed' }),
      );
      expect(() => toIntentIntakeInput(event([{}, { [key]: 90 }]), NOW)).toThrow(
        expect.objectContaining({ field: `signals[1].${key}`, reason: 'not-allowed' }),
      );
    }
  });

  it('keeps event-level field names for event-level errors', () => {
    expect(() => toIntentIntakeInput(event([{}], { searchId: '' }), NOW)).toThrow(
      expect.objectContaining({ field: 'searchId', reason: 'required' }),
    );
    expect(() => toIntentIntakeInput(event([{}, { kind: 'JOB_POST' }]), NOW)).toThrow(
      expect.objectContaining({ field: 'signals[1].kind', reason: 'unsupported' }),
    );
  });
});

describe('research supersession scope (C2) — in-memory repository mirrors pgRepository', () => {
  const research = (field: string, kind: NewResearchSignalInput['kind']): NewResearchSignalInput => ({
    field,
    kind,
    classification: 'OBSERVED',
    signal: `${field} claim`,
    confidence: 80,
    basis: null,
    sources: [{ sourceUrl: 'https://acme.test', sourceQuote: `${field} claim`, sourceLabel: 'homepage' }],
  });

  it('supersedes every research kind but neither intake kind', async () => {
    const repo = fakeResearchSignalRepository();
    await repo.saveSignals('p1', [research('websiteIssues', 'WEBSITE'), research('growthOpportunities', 'NEWS')], NOW);
    await repo.saveSignals('p1', [toIntentSignalInput(input(), NOW).signal], OBSERVED_AT);
    await repo.saveSignals(
      'p1',
      [toIntentSignalInput(input({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence() }), NOW).signal],
      OBSERVED_AT,
    );

    const superseded = await repo.supersedePrevious('p1', NOW);

    expect(superseded).toBe(2);
    const active = repo.rows.filter((row) => row.supersededAt === null).map((row) => row.kind);
    expect(active.sort()).toEqual(['FIRST_PARTY', 'PUBLIC_INTENT']);
  });

  it('keeps existing behavior for research kinds, and never crosses Prospects', async () => {
    const repo = fakeResearchSignalRepository();
    await repo.saveSignals('p1', [research('websiteIssues', 'WEBSITE')], NOW);
    await repo.saveSignals('p2', [research('websiteIssues', 'WEBSITE')], NOW);
    expect(await repo.supersedePrevious('p1', NOW)).toBe(1);
    expect(repo.rows.find((row) => row.prospectId === 'p2')!.supersededAt).toBeNull();
  });

  it('isIntentSignalKind recognises only the two intake kinds', () => {
    expect(isIntentSignalKind('PUBLIC_INTENT')).toBe(true);
    expect(isIntentSignalKind('FIRST_PARTY')).toBe(true);
    for (const kind of Object.keys(SOURCE_WEIGHT).filter((k) => k !== 'PUBLIC_INTENT' && k !== 'FIRST_PARTY')) {
      expect(isIntentSignalKind(kind)).toBe(false);
    }
  });
});

describe('scoring contract (D1/D2) — unchanged arithmetic, downstream eligibility', () => {
  it('D1: SOURCE_WEIGHT carries PUBLIC_INTENT = 0 and FIRST_PARTY = 0; existing weights unchanged', () => {
    expect(SOURCE_WEIGHT).toEqual({
      JOB_POST: 30,
      FUNDING: 25,
      NEWS: 15,
      TECH_STACK: 15,
      LINKEDIN: 12,
      REVIEW: 10,
      WEBSITE: 8,
      MANUAL: 20,
      PUBLIC_INTENT: 0,
      FIRST_PARTY: 0,
    });
  });

  it('D1: intake signals contribute nothing to scoreLead()', () => {
    const lead = scoreLead(
      [
        { kind: 'PUBLIC_INTENT', signal: 'need an app', confidence: 70, observedAt: OBSERVED_AT },
        { kind: 'FIRST_PARTY', signal: 'need an app, 3 lakh', confidence: 90, observedAt: OBSERVED_AT },
      ],
      NOW,
    );
    expect(lead.score).toBe(0);
    expect(lead.components).toHaveLength(0);
  });

  it('no inference discount: intake confidence reaches the scorer unchanged', async () => {
    const repo = fakeResearchSignalRepository();
    await repo.saveSignals('p1', [toIntentSignalInput(input(), NOW).signal], OBSERVED_AT);
    await repo.saveSignals(
      'p1',
      [toIntentSignalInput(input({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence() }), NOW).signal],
      OBSERVED_AT,
    );
    const { signals } = toScoringSignals(repo.rows);
    expect(signals.map((s) => [s.kind, s.confidence])).toEqual([
      ['PUBLIC_INTENT', 70],
      ['FIRST_PARTY', 90],
    ]);
  });

  it('eligibility: the unchanged seven-factor scorer treats intake as OBSERVED evidence (visibleProblem ≥50, evidenceQuality ≥70)', () => {
    const neutral: Omit<ProspectInput, 'signals'> = {
      icp: {
        industryMatch: { value: null, basis: 'UNKNOWN' },
        sizeMatch: { value: null, basis: 'UNKNOWN' },
        geoMatch: { value: null, basis: 'UNKNOWN' },
      },
      abilityToPay: { value: null, basis: 'UNKNOWN' },
      urgency: { value: null, basis: 'UNKNOWN' },
      serviceFit: { value: null, basis: 'UNKNOWN' },
      contact: { hasEmail: false, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
    };
    const score = scoreProspect(
      {
        ...neutral,
        signals: [{ kind: 'PUBLIC_INTENT', signal: 'need an app', confidence: 70, observedAt: OBSERVED_AT }],
      },
      NOW,
    );
    const visible = score.factors.find((f) => f.factor === 'visibleProblem')!;
    const evidence = score.factors.find((f) => f.factor === 'evidenceQuality')!;
    expect(visible.basis).toBe('OBSERVED');
    expect(visible.points).toBe(Math.round(0.7 * 20));
    expect(evidence.basis).toBe('OBSERVED');
    expect(evidence.raw).toBeCloseTo(1 / 3);
  });
});

// K1 intake-path enforcement (CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md §7, §9).
describe('K1 — intake-path contact-identifier enforcement', () => {
  it('L6/L7/L8: a personal email, phone, obfuscated email or uncertain email in quote is rejected on quote', () => {
    expectRejected({ quote: 'Reach us at jane@gmail.com' }, 'quote', 'not-allowed');
    expectRejected({ quote: 'Call 98765 43210' }, 'quote', 'not-allowed');
    expectRejected({ quote: 'Reach us at jane [at] gmail [dot] com' }, 'quote', 'not-allowed');
    expectRejected({ quote: 'Reach us at jane@gmail' }, 'quote', 'not-allowed');
  });

  it('L9: a business email at the website domain in quote is accepted', () => {
    const validated = toIntentSignalInput(
      input({ website: 'https://www.acme.example.com', quote: 'Reach us at info@acme.example.com' }),
      NOW,
    );
    expect(validated.signal.signal).toBe('Reach us at info@acme.example.com');
  });

  it('L10: an email/phone-like companyName or digit runs in website/sourceUrl/sourceLabel are not rejected by K1', () => {
    const validated = toIntentSignalInput(
      input({
        companyName: 'Acme 98765 Co',
        website: 'https://acme192168.example.com',
        sourceUrl: 'https://forum.example.org/t/9876543210',
        sourceLabel: 'Public forum post #9876543210',
        quote: 'Looking for someone to build an app',
      }),
      NOW,
    );
    expect(validated.companyName).toBe('Acme 98765 Co');
  });

  it('L12: non-normalizable website still rejects an offending quote via K1 (checked before the website rejection)', () => {
    expectRejected({ website: 'not a url', quote: 'Call 98765 43210' }, 'quote', 'not-allowed');
  });

  it('multi-signal intake: offending quote in signals[1] of 3 is rejected with the prefixed field, no other write path reached', () => {
    const intake: RecordIntentIntakeInput = {
      searchId: 'search_1',
      companyName: 'Acme Co',
      website: 'https://acme.example.com',
      signals: [
        { kind: 'PUBLIC_INTENT', field: 'requestedMobileApp', quote: 'Looking for an app', sourceUrl: 'https://forum.example.org/t/1', sourceLabel: 'Post', observedAt: OBSERVED_AT },
        { kind: 'PUBLIC_INTENT', field: 'requestedWebsite', quote: 'Call 98765 43210', sourceUrl: 'https://forum.example.org/t/2', sourceLabel: 'Post', observedAt: OBSERVED_AT },
        { kind: 'PUBLIC_INTENT', field: 'requestedRedesign', quote: 'Need a redesign', sourceUrl: 'https://forum.example.org/t/3', sourceLabel: 'Post', observedAt: OBSERVED_AT },
      ],
    };
    try {
      toIntentIntakeInput(intake, NOW);
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(IntentSignalValidationError);
      expect(error).toMatchObject({ field: 'signals[1].quote', reason: 'not-allowed' });
    }
  });

  it('single-signal form reports field "quote" (not "signals[0].quote")', () => {
    try {
      toIntentSignalInput(input({ quote: 'jane@gmail.com' }), NOW);
      throw new Error('expected rejection');
    } catch (error) {
      expect(error).toMatchObject({ field: 'quote', reason: 'not-allowed' });
    }
  });

  it('provider / intake equivalence (§9): the same text and website yield the same decision as the provider path', () => {
    const cases: { text: string; website: string; shouldReject: boolean }[] = [
      { text: 'jane@gmail.com', website: 'https://www.example.com', shouldReject: true },
      { text: 'info@example.com', website: 'https://www.example.com', shouldReject: false },
      { text: 'call 98765 43210', website: 'https://www.example.com', shouldReject: true },
      { text: 'Tender No. 2026/IT/0457', website: 'https://www.example.com', shouldReject: false },
      { text: 'jane [at] gmail [dot] com', website: 'https://www.example.com', shouldReject: true },
    ];
    for (const { text, website, shouldReject } of cases) {
      if (shouldReject) {
        expectRejected({ website, quote: text }, 'quote', 'not-allowed');
      } else {
        expect(() => toIntentSignalInput(input({ website, quote: text }), NOW)).not.toThrow();
      }
    }
  });
});
