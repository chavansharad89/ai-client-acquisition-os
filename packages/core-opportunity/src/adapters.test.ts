import type { ServiceProfileFields } from '@acos/core-service-profile';
import { describe, expect, it } from 'vitest';

import { toOfferSignals, toServiceRule } from './adapters';

function serviceProfileFields(overrides: Partial<ServiceProfileFields> = {}): ServiceProfileFields {
  return {
    service: 'Website development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST', 'WEBSITE'],
    keywords: ['website', 'redesign'],
    rationale: 'They lack a working website.',
    ...overrides,
  };
}

describe('toServiceRule', () => {
  it('maps every ServiceProfileFields field onto ServiceRule', () => {
    const rule = toServiceRule(serviceProfileFields());

    expect(rule).toEqual({
      service: 'Website development',
      triggers: ['JOB_POST', 'WEBSITE'],
      keywords: ['website', 'redesign'],
      typicalValuePaise: 3_000_000,
      rationale: 'They lack a working website.',
    });
  });

  it('derives typicalValuePaise from minProjectValuePaise, not a separate field', () => {
    const rule = toServiceRule(serviceProfileFields({ minProjectValuePaise: 7_500_000 }));
    expect(rule.typicalValuePaise).toBe(7_500_000);
  });

  it('drops trigger values outside the fixed ResearchSourceKind vocabulary rather than passing them through', () => {
    const rule = toServiceRule(
      serviceProfileFields({ triggers: ['JOB_POST', 'not-a-real-kind', 'TECH_STACK'] }),
    );
    expect(rule.triggers).toEqual(['JOB_POST', 'TECH_STACK']);
  });
});

const HOMEPAGE = { url: 'https://acme.test/about', label: 'homepage' };
const ACME = { name: 'Acme Co' };

describe('toOfferSignals', () => {
  it('excludes UNKNOWN rows (signal IS NULL), counted nowhere but not crashing on them', () => {
    const signals = toOfferSignals(
      [
        {
          id: 'sig_1',
          prospectId: 'prospect_1',
          // A problem/opportunity field (R-71) — see the dedicated R-71
          // describe block below for the topical-field exclusion itself.
          field: 'websiteIssues',
          kind: 'WEBSITE',
          classification: 'OBSERVED',
          signal: 'Acme sells warehouse robotics',
          confidence: 92,
          basis: null,
          observedAt: new Date('2026-01-01T00:00:00.000Z'),
          supersededAt: null,
          sources: [
            { id: 'src_1', sourceUrl: HOMEPAGE.url, sourceQuote: 'x', sourceLabel: 'homepage' },
          ],
        },
        {
          id: 'sig_2',
          prospectId: 'prospect_1',
          field: 'targetCustomers',
          kind: 'WEBSITE',
          classification: 'UNKNOWN',
          signal: null,
          confidence: 0,
          basis: null,
          observedAt: new Date('2026-01-01T00:00:00.000Z'),
          supersededAt: null,
          sources: [],
        },
      ],
      ACME,
    );

    expect(signals).toHaveLength(1);
    expect(signals[0]).toEqual({
      kind: 'WEBSITE',
      signal: 'Acme sells warehouse robotics',
      confidence: 92,
      observedAt: new Date('2026-01-01T00:00:00.000Z'),
      supersededAt: null,
    });
  });

  it('passes confidence through raw — no inference discount applied at this boundary', () => {
    const signals = toOfferSignals(
      [
        {
          id: 'sig_1',
          prospectId: 'prospect_1',
          field: 'aiOpportunities', // a problem/opportunity field (R-71)
          kind: 'TECH_STACK',
          classification: 'INFERRED',
          signal: 'Likely enterprise SaaS',
          confidence: 65,
          basis: 'their homepage lists enterprise logos',
          observedAt: new Date('2026-01-01T00:00:00.000Z'),
          supersededAt: null,
          sources: [],
        },
      ],
      ACME,
    );

    expect(signals[0]?.confidence).toBe(65);
  });

  it('returns an empty array for an empty input, never throwing', () => {
    expect(toOfferSignals([], ACME)).toEqual([]);
  });
});

// ---- R-70 (source-to-business attribution) ------------------------------
// requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md's Goregaon Sports
// Club / heydrop.me case. See worker.test.ts's "phase24 regression: B1/B2/
// B3" for the end-to-end (Discovery -> Research -> Opportunity ->
// Qualification) proof; these are the focused unit-level equivalents.

function signalWith(overrides: Partial<Parameters<typeof toOfferSignals>[0][number]>) {
  return {
    id: 'sig_1',
    prospectId: 'prospect_1',
    field: 'websiteIssues' as const,
    kind: 'WEBSITE' as const,
    classification: 'OBSERVED' as const,
    signal: 'the homepage has no pricing page',
    confidence: 80,
    basis: null,
    observedAt: new Date('2026-01-01T00:00:00.000Z'),
    supersededAt: null,
    sources: [{ id: 'src_1', sourceUrl: 'https://meridian.test', sourceQuote: '', sourceLabel: 'Homepage' }],
    ...overrides,
  };
}

describe('toOfferSignals — R-70 source-to-business attribution', () => {
  const MERIDIAN = { name: 'Meridian Fitness Club' };

  it('B1: ordinary evidence that never restates the business name is unaffected (the common case)', () => {
    const signals = toOfferSignals(
      [signalWith({ signal: 'no pricing page is visible on the homepage' })],
      MERIDIAN,
    );
    expect(signals).toHaveLength(1);
  });

  it('B1: evidence that self-identifies AND matches the target business is unaffected', () => {
    const signals = toOfferSignals(
      [signalWith({ signal: 'Meridian Fitness Club. Our website is outdated and hard to navigate.' })],
      MERIDIAN,
    );
    expect(signals).toHaveLength(1);
  });

  it('B2: a signal that self-identifies as a DIFFERENT business is excluded', () => {
    const signals = toOfferSignals(
      [signalWith({ signal: 'HeyDrop. A simple way to share your digital business card.' })],
      MERIDIAN,
    );
    expect(signals).toHaveLength(0);
  });

  it('B2: a mismatch on ONE signal excludes every OBSERVED signal for the same Prospect — the underlying defect is a property of the source, not one claim', () => {
    const signals = toOfferSignals(
      [
        signalWith({
          id: 'sig_identity',
          field: 'companySummary',
          signal: 'HeyDrop. A simple way to share your digital business card.',
        }),
        signalWith({
          id: 'sig_problem',
          field: 'websiteIssues',
          signal: 'Our website is outdated and difficult to use on mobile devices.',
        }),
      ],
      MERIDIAN,
    );
    expect(signals).toHaveLength(0);
  });

  it('B3: a source that cannot be attributed at all (identifies as neither the target nor a real business) is excluded, not defaulted to accepted', () => {
    const signals = toOfferSignals(
      [signalWith({ signal: 'Page Not Found. This domain is not configured.' })],
      MERIDIAN,
    );
    expect(signals).toHaveLength(0);
  });

  it('does not reject a signal merely because the company name is absent — only a conflicting self-identification triggers exclusion', () => {
    const signals = toOfferSignals(
      [signalWith({ signal: 'response times are slow and support tickets pile up' })],
      MERIDIAN,
    );
    expect(signals).toHaveLength(1);
  });

  it('INFERRED signals are unaffected by classification either way — R-70 is orthogonal to Scenario E', () => {
    const signals = toOfferSignals(
      [
        signalWith({
          classification: 'INFERRED',
          signal: 'may need a website redesign based on its sparse homepage',
          basis: 'reasoned from the sparse homepage content',
          sources: [],
        }),
      ],
      MERIDIAN,
    );
    expect(signals).toHaveLength(1);
  });
});

// ---- R-71 (topic-vs-problem relevance) -----------------------------------

describe('toOfferSignals — R-71 topic-vs-problem relevance', () => {
  const ANY_COMPANY = { name: 'Meridian Fitness Club' };

  it('D1: a topical field (companySummary/businessModel/targetCustomers) never becomes offer-eligible, even with a keyword match', () => {
    const signals = toOfferSignals(
      [signalWith({ field: 'companySummary', signal: 'Meridian Fitness Club has a website.' })],
      ANY_COMPANY,
    );
    expect(signals).toHaveLength(0);
  });

  it('D2: the same claim in a problem field IS offer-eligible', () => {
    const signals = toOfferSignals(
      [
        signalWith({
          field: 'websiteIssues',
          signal: "Meridian Fitness Club's website navigation is broken on mobile.",
        }),
      ],
      ANY_COMPANY,
    );
    expect(signals).toHaveLength(1);
  });

  it('businessModel and targetCustomers are excluded the same way as companySummary', () => {
    expect(toOfferSignals([signalWith({ field: 'businessModel' })], ANY_COMPANY)).toHaveLength(0);
    expect(toOfferSignals([signalWith({ field: 'targetCustomers' })], ANY_COMPANY)).toHaveLength(0);
  });
});
