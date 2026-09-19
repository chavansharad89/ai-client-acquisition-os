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

describe('toOfferSignals', () => {
  it('excludes UNKNOWN rows (signal IS NULL), counted nowhere but not crashing on them', () => {
    const signals = toOfferSignals([
      {
        id: 'sig_1',
        prospectId: 'prospect_1',
        field: 'companySummary',
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
    ]);

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
    const signals = toOfferSignals([
      {
        id: 'sig_1',
        prospectId: 'prospect_1',
        field: 'businessModel',
        kind: 'TECH_STACK',
        classification: 'INFERRED',
        signal: 'Likely enterprise SaaS',
        confidence: 65,
        basis: 'their homepage lists enterprise logos',
        observedAt: new Date('2026-01-01T00:00:00.000Z'),
        supersededAt: null,
        sources: [],
      },
    ]);

    expect(signals[0]?.confidence).toBe(65);
  });

  it('returns an empty array for an empty input, never throwing', () => {
    expect(toOfferSignals([])).toEqual([]);
  });
});
