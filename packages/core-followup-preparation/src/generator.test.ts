import type { StoredOutreachPreparation } from '@acos/core-outreach-preparation';
import { describe, expect, it } from 'vitest';

import { generateFollowUpPreparation } from './generator';

const NOW = new Date('2026-09-01T00:00:00.000Z');

function seedOutreachPreparation(
  overrides: Partial<StoredOutreachPreparation> = {},
): StoredOutreachPreparation {
  return {
    id: 'outreach_preparation_1',
    opportunityId: 'opportunity_1',
    prospectId: 'prospect_1',
    sourcePersonalizationId: 'personalization_1',
    state: 'READY_FOR_REVIEW',
    subjectLine: 'Website development — a quick note',
    messageBody: 'Acme Co — your homepage shows needs a website redesign. Would you be open to a short conversation about Website development?',
    callToAction: 'Would you be open to a short conversation about Website development?',
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
    generatorVersion: 'outreach-preparation-v1',
    generatedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('generateFollowUpPreparation', () => {
  it('is deterministic — the same Outreach Preparation always produces the same draft', () => {
    const outreachPreparation = seedOutreachPreparation();

    const first = generateFollowUpPreparation(outreachPreparation);
    const second = generateFollowUpPreparation(outreachPreparation);

    expect(second).toEqual(first);
  });

  it('R-63: evidence is passed through unmodified — never re-derived or re-selected', () => {
    const outreachPreparation = seedOutreachPreparation();

    const draft = generateFollowUpPreparation(outreachPreparation);

    expect(draft.evidence).toBe(outreachPreparation.evidence);
  });

  it('R-64: follow-up content references only the source Outreach Preparation\'s own subjectLine/callToAction', () => {
    const outreachPreparation = seedOutreachPreparation({
      subjectLine: 'Workflow automation — a quick note',
      callToAction: 'Would you be open to a short conversation about Workflow automation?',
    });

    const draft = generateFollowUpPreparation(outreachPreparation);

    expect(draft.followUpContext).toContain('Workflow automation — a quick note');
    expect(draft.followUpContent).toContain('Workflow automation');
  });

  it('never invents a prospect fact or a claim about a response — rationale states only that this is a deterministic follow-up', () => {
    const draft = generateFollowUpPreparation(seedOutreachPreparation());

    expect(draft.rationale).toContain('Deterministically generated');
  });

  it('produces no field named or shaped like a send/delivery outcome', () => {
    const draft = generateFollowUpPreparation(seedOutreachPreparation());

    expect(draft).not.toHaveProperty('sentAt');
    expect(draft).not.toHaveProperty('deliveredAt');
    expect(draft).not.toHaveProperty('scheduledAt');
    expect(draft).not.toHaveProperty('state');
  });
});
