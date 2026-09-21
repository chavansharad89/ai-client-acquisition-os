import type { DetectedOffer } from '@acos/core-opportunity';
import { describe, expect, it } from 'vitest';

import { generatePersonalization, GENERATOR_VERSION } from './generator';
import type { PersonalizationEvidenceItem } from './types';

function observedItem(overrides: Partial<PersonalizationEvidenceItem> = {}): PersonalizationEvidenceItem {
  return {
    signalId: 'signal_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring a content writer',
    confidence: 88,
    basis: null,
    ...overrides,
  };
}

function inferredItem(overrides: Partial<PersonalizationEvidenceItem> = {}): PersonalizationEvidenceItem {
  return {
    signalId: 'signal_2',
    field: 'growthOpportunities',
    kind: 'JOB_POST',
    classification: 'INFERRED',
    signal: 'scaling their sales team',
    confidence: 60,
    basis: 'multiple job posts for the same role',
    ...overrides,
  };
}

function sampleOffer(overrides: Partial<DetectedOffer> = {}): DetectedOffer {
  return {
    service: 'AI content system',
    rationale: 'They are hiring for content (hiring a content writer) — a system delivers it without a headcount.',
    estimatedValuePaise: 15_000_000,
    fit: 80,
    basedOn: ['hiring a content writer'],
    ...overrides,
  };
}

const serviceProfile = { targetCustomer: 'Restaurants', geography: 'Mumbai' };

describe('generatePersonalization', () => {
  it('is pure and deterministic: identical input always produces identical output', () => {
    const input = { companyName: 'Acme Co', offer: sampleOffer(), evidence: [observedItem()], serviceProfile };

    const first = generatePersonalization(input);
    const second = generatePersonalization(input);

    expect(second).toEqual(first);
  });

  it('R-46/R-47: openingContext and valueProposition are traceable to the evidence and the existing offer', () => {
    const item = observedItem();
    const offer = sampleOffer();

    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer,
      evidence: [item],
      serviceProfile,
    });

    expect(result.openingContext).toContain('Acme Co');
    expect(result.openingContext).toContain(item.signal);
    expect(result.valueProposition).toContain(offer.service);
    expect(result.valueProposition).toContain(offer.rationale);
    expect(result.offerService).toBe(offer.service);
  });

  it('R-47: never introduces a service other than the Opportunity\'s own offer.service', () => {
    const offer = sampleOffer({ service: 'Lead generation automation' });

    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer,
      evidence: [observedItem()],
      serviceProfile,
    });

    expect(result.offerService).toBe('Lead generation automation');
    expect(result.valueProposition).toContain('Lead generation automation');
  });

  it('R-48: OBSERVED evidence is stated directly, without inference hedging', () => {
    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer: sampleOffer(),
      evidence: [observedItem()],
      serviceProfile,
    });

    expect(result.openingContext).not.toContain('inferred');
    expect(result.openingContext).not.toContain('may indicate');
  });

  it('R-48: INFERRED evidence is hedged and carries its own basis inline — never stated as a fact', () => {
    const item = inferredItem();

    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer: sampleOffer(),
      evidence: [item],
      serviceProfile,
    });

    expect(result.openingContext).toContain('inferred');
    expect(result.openingContext).toContain(item.basis as string);
  });

  it('R-48: never states a business outcome or causal claim beyond the evidence text itself', () => {
    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer: sampleOffer(),
      evidence: [observedItem(), inferredItem()],
      serviceProfile,
    });

    for (const forbidden of ['losing customers', 'missing revenue', 'is failing', 'guaranteed']) {
      expect(result.openingContext.toLowerCase()).not.toContain(forbidden);
      expect(result.valueProposition.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('R-45: personalizationRationale reports observed/inferred counts and the caller\'s own service profile', () => {
    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer: sampleOffer(),
      evidence: [observedItem(), inferredItem()],
      serviceProfile,
    });

    expect(result.personalizationRationale).toContain('2 qualifying research signal');
    expect(result.personalizationRationale).toContain('1 observed');
    expect(result.personalizationRationale).toContain('1 inferred');
    expect(result.personalizationRationale).toContain('Restaurants');
    expect(result.personalizationRationale).toContain('Mumbai');
  });

  it('carries the selected evidence through unchanged, for provenance', () => {
    const items = [observedItem(), inferredItem()];

    const result = generatePersonalization({
      companyName: 'Acme Co',
      offer: sampleOffer(),
      evidence: items,
      serviceProfile,
    });

    expect(result.evidence).toEqual(items);
  });

  it('exposes a stable GENERATOR_VERSION constant', () => {
    expect(GENERATOR_VERSION).toBe('personalization-v1');
  });
});
