import type { ServiceProfileFields } from '@acos/core-service-profile';
import { describe, expect, it } from 'vitest';

import { previewOpportunityRanking } from './preview';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function profile(overrides: Partial<ServiceProfileFields> = {}): ServiceProfileFields {
  return {
    service: 'Website development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['WEBSITE'],
    keywords: ['website', 'redesign'],
    rationale: 'They lack a working website.',
    ...overrides,
  };
}

describe('previewOpportunityRanking', () => {
  it('ranks Need/Opportunity STRONG from a live Phase-1 deterministic signal, without persisting anything', () => {
    const preview = previewOpportunityRanking(
      profile(),
      { name: 'Acme Co' },
      [
        {
          signal: {
            kind: 'WEBSITE',
            signal: 'Website served over HTTP without TLS (no SSL): http://acme.test',
            confidence: 100,
            observedAt: NOW,
          },
          dimension: 'NEED_OPPORTUNITY_GAP',
          field: 'test.field',
        },
      ],
      NOW,
    );

    expect(preview.ranking.needOpportunity).toBe('STRONG');
  });

  it('with no deterministic signals, ranks Need/Opportunity and Service Fit as UNKNOWN (no fabricated offer)', () => {
    const preview = previewOpportunityRanking(profile(), { name: 'Acme Co' }, [], NOW);

    expect(preview.ranking.needOpportunity).toBe('UNKNOWN');
    expect(preview.offer).toBeUndefined();
  });
});
