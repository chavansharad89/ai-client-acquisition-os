import type { StoredPersonalization } from '@acos/core-personalization';
import { describe, expect, it } from 'vitest';

import { generateOutreachPreparation } from './generator';

const NOW = new Date('2026-09-01T00:00:00.000Z');

function seedPersonalization(overrides: Partial<StoredPersonalization> = {}): StoredPersonalization {
  return {
    id: 'personalization_1',
    opportunityId: 'opportunity_1',
    prospectId: 'prospect_1',
    state: 'GENERATED',
    offerService: 'Website development',
    openingContext: 'Acme Co — your homepage shows needs a website redesign.',
    valueProposition: 'Website development is the recommended fit: they need a website refresh.',
    personalizationRationale: 'Generated from 1 qualifying research signal(s) (1 observed, 0 inferred).',
    evidence: [
      {
        signalId: 'signal_1',
        field: 'companySummary',
        kind: 'WEBSITE',
        classification: 'OBSERVED',
        signal: 'needs a website redesign',
        confidence: 88,
        basis: null,
      },
    ],
    generatorVersion: 'personalization-v1',
    generatedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('generateOutreachPreparation', () => {
  it('is deterministic — the same Personalization always produces the same draft', () => {
    const personalization = seedPersonalization();

    const first = generateOutreachPreparation(personalization);
    const second = generateOutreachPreparation(personalization);

    expect(second).toEqual(first);
  });

  it('R-56: evidence is passed through unmodified — never re-derived or re-selected', () => {
    const personalization = seedPersonalization();

    const draft = generateOutreachPreparation(personalization);

    expect(draft.evidence).toBe(personalization.evidence);
  });

  it('R-47/AC-04: valueProposition-derived content only ever names the Opportunity\'s own offer', () => {
    const personalization = seedPersonalization({ offerService: 'Workflow automation' });

    const draft = generateOutreachPreparation(personalization);

    expect(draft.subjectLine).toContain('Workflow automation');
    expect(draft.callToAction).toContain('Workflow automation');
  });

  it('never invents a company fact — messageBody contains only openingContext + valueProposition + a fixed CTA template', () => {
    const personalization = seedPersonalization();

    const draft = generateOutreachPreparation(personalization);

    expect(draft.messageBody).toBe(
      `${personalization.openingContext} ${personalization.valueProposition} ${draft.callToAction}`,
    );
  });

  it('produces no field named or shaped like a send/delivery outcome', () => {
    const draft = generateOutreachPreparation(seedPersonalization());

    expect(draft).not.toHaveProperty('sentAt');
    expect(draft).not.toHaveProperty('deliveredAt');
    expect(draft).not.toHaveProperty('scheduledAt');
    expect(draft).not.toHaveProperty('state');
  });
});
