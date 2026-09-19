import { describe, expect, it } from 'vitest';

import { toNewResearchSignals } from './mapping';
import { leadResearchSchema, type LeadResearch } from './schema';

// UNIT tests for the Research Foundation's persistence adapter — the
// replacement for ./persist.ts's toResearchRows(), which the phase's
// corrections identified as unsuitable: it drops UNKNOWN, folds
// classification into confidence, and keeps only the first evidence
// source. These tests prove the replacement does none of that.

const HOMEPAGE = { url: 'https://acme.test/about', label: 'homepage' };
const CAREERS = { url: 'https://acme.test/careers', label: 'careers' };

const observed = (
  value: string,
  evidence: { quote: string; sourceUrl: string; sourceLabel: string }[] = [
    { quote: value, sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label },
  ],
  confidence = 90,
) => ({
  classification: 'OBSERVED' as const,
  value,
  evidence,
  basis: null,
  confidence,
});
const inferred = (value: string, confidence = 60) => ({
  classification: 'INFERRED' as const,
  value,
  evidence: [],
  basis: 'reasoned from other observations',
  confidence,
});
const unknown = () => ({
  classification: 'UNKNOWN' as const,
  value: null,
  evidence: [],
  basis: null,
  confidence: 0,
});

function research(overrides: Partial<LeadResearch> = {}): LeadResearch {
  return leadResearchSchema.parse({
    companySummary: observed('Acme sells warehouse robotics'),
    businessModel: inferred('Likely enterprise SaaS with services'),
    targetCustomers: unknown(),
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: {
      service: 'NONE',
      rationale: 'insufficient evidence',
      basedOn: [],
    },
    confidence: 50,
    gaps: [],
    ...overrides,
  });
}

describe('toNewResearchSignals', () => {
  it('preserves classification for every observation, unfiltered', () => {
    const signals = toNewResearchSignals(research());

    const byField = new Map(signals.map((s) => [s.field, s]));
    expect(byField.get('companySummary')?.classification).toBe('OBSERVED');
    expect(byField.get('businessModel')?.classification).toBe('INFERRED');
    expect(byField.get('targetCustomers')?.classification).toBe('UNKNOWN');
  });

  it('does NOT drop UNKNOWN observations (unlike toResearchRows)', () => {
    const signals = toNewResearchSignals(research());

    const unknownSignal = signals.find((s) => s.field === 'targetCustomers');
    expect(unknownSignal).toBeDefined();
    expect(unknownSignal?.classification).toBe('UNKNOWN');
    expect(unknownSignal?.signal).toBeNull();
    expect(unknownSignal?.confidence).toBe(0);
  });

  it('persists raw, unadjusted confidence — never pre-discounted for INFERRED', () => {
    const signals = toNewResearchSignals(research({ businessModel: inferred('x', 77) }));

    const inferredSignal = signals.find((s) => s.field === 'businessModel');
    // toResearchRows()'s effectiveConfidence() would have halved this to 38.
    expect(inferredSignal?.confidence).toBe(77);
  });

  it('persists raw confidence for OBSERVED unchanged', () => {
    const signals = toNewResearchSignals(
      research({ companySummary: observed('x', undefined, 82) }),
    );

    const observedSignal = signals.find((s) => s.field === 'companySummary');
    expect(observedSignal?.confidence).toBe(82);
  });

  it('preserves every evidence source, not only the first', () => {
    const multiSource = observed('Hiring for content roles', [
      { quote: 'Hiring for content roles', sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label },
      { quote: 'Three open content roles', sourceUrl: CAREERS.url, sourceLabel: CAREERS.label },
    ]);
    const signals = toNewResearchSignals(research({ companySummary: multiSource }));

    const signal = signals.find((s) => s.field === 'companySummary');
    expect(signal?.sources).toHaveLength(2);
    expect(signal?.sources.map((s) => s.sourceUrl)).toEqual([HOMEPAGE.url, CAREERS.url]);
  });

  it('carries INFERRED basis through for audit', () => {
    const signals = toNewResearchSignals(research({ businessModel: inferred('Likely SaaS') }));
    const signal = signals.find((s) => s.field === 'businessModel');
    expect(signal?.basis).toBe('reasoned from other observations');
  });

  it('derives kind from field, independent of evidence', () => {
    const signals = toNewResearchSignals(research());
    const companySummary = signals.find((s) => s.field === 'companySummary');
    expect(companySummary?.kind).toBe('WEBSITE');
  });

  it('maps a result with only UNKNOWN/empty-list fields to all-UNKNOWN signals, none dropped', () => {
    const allUnknown = research({
      companySummary: unknown(),
      businessModel: unknown(),
      targetCustomers: unknown(),
    });

    const signals = toNewResearchSignals(allUnknown);

    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals.filter((s) =>
      ['companySummary', 'businessModel', 'targetCustomers'].includes(s.field),
    )) {
      expect(s.classification).toBe('UNKNOWN');
      expect(s.signal).toBeNull();
    }
  });

  it('produces one signal per observation, matching allObservations() count', () => {
    const signals = toNewResearchSignals(research());
    // 3 single fields + 6 empty list fields = 3 observations total.
    expect(signals).toHaveLength(3);
  });
});
