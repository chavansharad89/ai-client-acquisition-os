import type { ServiceRule } from '@acos/core-acquisition';
import type { ServiceProfileFields } from '@acos/core-service-profile';
import { describe, expect, it } from 'vitest';

import { hasCredibleNeedEvidence, toOfferSignals, toServiceRule } from './adapters';
import { SCORER_VERSION } from './service';

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

  it('INTENT-INTAKE-PO-DEC-001 D3: passes PUBLIC_INTENT/FIRST_PARTY through only when the profile lists them', () => {
    expect(toServiceRule(serviceProfileFields()).triggers).toEqual(['JOB_POST', 'WEBSITE']);
    expect(
      toServiceRule(serviceProfileFields({ triggers: ['WEBSITE', 'PUBLIC_INTENT', 'FIRST_PARTY'] })).triggers,
    ).toEqual(['WEBSITE', 'PUBLIC_INTENT', 'FIRST_PARTY']);
  });

  it('INTENT-INTAKE-PO-DEC-001 D2: passing PUBLIC_INTENT/FIRST_PARTY triggers through toServiceRule does not, by itself, change SCORER_VERSION', () => {
    // D2's guard was never "this string is frozen forever" — it was that
    // intent-intake's trigger-vocabulary expansion (D3, tested above)
    // must not be the thing that bumps it. Phase 3 of the deterministic
    // architecture plan (CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md)
    // is a separate, separately-authorized reason to bump it: the
    // ranking algorithm itself changed from the seven-factor numeric
    // scorer to the qualitative UniversalRankingProfile, which is
    // exactly the "allows a ranking to be reproduced after the algorithm
    // changes" case this field exists for.
    expect(SCORER_VERSION).toBe('universalRanking-v1');
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

// ---- K5-D1 (Need/Opportunity evidence sufficiency) ----------------------
// requirement/CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md, K5-D1
// (Option C): a catalogue trigger+keyword match alone must not
// establish NEED_DETECTED for a NEW search — see hasCredibleNeedEvidence()'s
// own header in ./adapters.ts for the sufficiency rule itself.

describe('hasCredibleNeedEvidence — K5-D1 Need/Opportunity sufficiency', () => {
  const ANY_COMPANY = { name: 'Meridian Fitness Club' };

  const NEED_RULE: ServiceRule = {
    service: 'AI & Automation',
    triggers: ['WEBSITE', 'TECH_STACK'],
    keywords: ['broken', 'wordpress', 'shopify', 'has a website', 'publishes videos'],
    typicalValuePaise: 10_000_000,
    rationale: 'test',
  };

  it('1. strong need evidence (>=2 independent OBSERVED, full-confidence signals) establishes credible need', () => {
    const stored = [
      signalWith({
        id: 'sig_1',
        field: 'websiteIssues',
        signal: 'the checkout flow is broken on mobile devices',
        confidence: 100,
      }),
      signalWith({
        id: 'sig_2',
        field: 'visibleProblems',
        signal: 'the contact form is broken and returns a server error',
        confidence: 100,
      }),
    ];
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(true);
  });

  it('2. an explicit service keyword without a stated need (single signal) stays UNKNOWN (not credible)', () => {
    const stored = [signalWith({ signal: 'the website uses WordPress', confidence: 100 })];
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(false);
  });

  it('3. website existence alone (single signal) stays UNKNOWN', () => {
    const stored = [
      signalWith({ field: 'visibleProblems', signal: 'the business has a website', confidence: 100 }),
    ];
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(false);
  });

  it('4. technology usage alone (single signal) stays UNKNOWN', () => {
    const stored = [
      signalWith({
        field: 'aiOpportunities',
        kind: 'TECH_STACK',
        signal: 'uses Shopify for its storefront',
        confidence: 100,
      }),
    ];
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(false);
  });

  it('5. generic service terminology alone (single signal) stays UNKNOWN', () => {
    const stored = [
      signalWith({
        field: 'contentOpportunities',
        signal: 'the business publishes videos regularly',
        confidence: 100,
      }),
    ];
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(false);
  });

  it('6. multiple weak (INFERRED, partial-confidence) signals do not automatically become a need', () => {
    const stored = [
      signalWith({
        id: 'sig_1',
        field: 'websiteIssues',
        classification: 'INFERRED',
        signal: 'may have a broken checkout, inferred indirectly',
        confidence: 50,
        basis: 'indirect reasoning',
        sources: [],
      }),
      signalWith({
        id: 'sig_2',
        field: 'visibleProblems',
        classification: 'INFERRED',
        signal: 'possibly a broken contact form, inferred',
        confidence: 50,
        basis: 'indirect reasoning',
        sources: [],
      }),
    ];
    // Two independent fields, but neither is OBSERVED at full confidence —
    // corroborating count never substitutes for evidentiary strength.
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(false);
  });

  it('7. existing R-71 filtering still applies — topical-field matches are never considered, even strong and corroborated', () => {
    const stored = [
      signalWith({ id: 'sig_1', field: 'companySummary', signal: 'the company website is broken', confidence: 100 }),
      signalWith({
        id: 'sig_2',
        field: 'businessModel',
        signal: 'its business model relies on a broken legacy system',
        confidence: 100,
      }),
    ];
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(false);
  });

  it('8. existing valid need evidence is not accidentally discarded — the same input still fully survives toOfferSignals()', () => {
    const stored = [
      signalWith({
        id: 'sig_1',
        field: 'websiteIssues',
        signal: 'the checkout flow is broken on mobile devices',
        confidence: 100,
      }),
      signalWith({
        id: 'sig_2',
        field: 'visibleProblems',
        signal: 'the contact form is broken and returns a server error',
        confidence: 100,
      }),
    ];
    expect(toOfferSignals(stored, ANY_COMPANY)).toHaveLength(2);
    expect(hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE)).toBe(true);
  });

  it('9. is a pure, synchronous function over already-persisted fields — no AI/LLM call, no I/O', () => {
    const stored = [
      signalWith({
        id: 'sig_1',
        field: 'websiteIssues',
        signal: 'the checkout flow is broken on mobile devices',
        confidence: 100,
      }),
      signalWith({
        id: 'sig_2',
        field: 'visibleProblems',
        signal: 'the contact form is broken and returns a server error',
        confidence: 100,
      }),
    ];
    const result = hasCredibleNeedEvidence(stored, ANY_COMPANY, NEED_RULE);
    expect(result).not.toBeInstanceOf(Promise);
    expect(typeof result).toBe('boolean');
  });
});
