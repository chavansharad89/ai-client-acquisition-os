import type { StoredResearchSignal } from '@acos/core-research';
import { describe, expect, it } from 'vitest';

import { MAX_PERSONALIZATION_EVIDENCE, selectPersonalizationEvidence } from './evidence';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function seedSignal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring a content writer',
    confidence: 88,
    basis: null,
    observedAt: NOW,
    supersededAt: null,
    sources: [],
    ...overrides,
  };
}

describe('selectPersonalizationEvidence', () => {
  it('R-44: selects only signals whose id is in the Qualification evidence set', () => {
    const a = seedSignal({ id: 'a' });
    const b = seedSignal({ id: 'b', signal: 'not relied on by qualification' });

    const result = selectPersonalizationEvidence([a, b], ['a']);

    expect(result).toHaveLength(1);
    expect(result[0]!.signalId).toBe('a');
  });

  it('excludes UNKNOWN signals even if their id is in the Qualification evidence set', () => {
    const unknown = seedSignal({ id: 'u', classification: 'UNKNOWN', signal: null });

    const result = selectPersonalizationEvidence([unknown], ['u']);

    expect(result).toHaveLength(0);
  });

  it('R-44: excludes superseded signals — never treats stale evidence as current', () => {
    const superseded = seedSignal({ id: 's', supersededAt: NOW });

    const result = selectPersonalizationEvidence([superseded], ['s']);

    expect(result).toHaveLength(0);
  });

  it('preserves classification, kind, field, signal, confidence, basis unchanged', () => {
    const signal = seedSignal({
      id: 'a',
      classification: 'INFERRED',
      basis: 'multiple job posts for the same role',
      confidence: 65,
      kind: 'JOB_POST',
      field: 'growthOpportunities',
      signal: 'scaling their sales team',
    });

    const [item] = selectPersonalizationEvidence([signal], ['a']);

    expect(item).toEqual({
      signalId: 'a',
      field: 'growthOpportunities',
      kind: 'JOB_POST',
      classification: 'INFERRED',
      signal: 'scaling their sales team',
      confidence: 65,
      basis: 'multiple job posts for the same role',
    });
  });

  it('orders by confidence descending', () => {
    const low = seedSignal({ id: 'low', confidence: 40 });
    const high = seedSignal({ id: 'high', confidence: 90 });

    const result = selectPersonalizationEvidence([low, high], ['low', 'high']);

    expect(result.map((item) => item.signalId)).toEqual(['high', 'low']);
  });

  it('breaks confidence ties by id ascending, for determinism', () => {
    const b = seedSignal({ id: 'b', confidence: 70 });
    const a = seedSignal({ id: 'a', confidence: 70 });

    const result = selectPersonalizationEvidence([b, a], ['a', 'b']);

    expect(result.map((item) => item.signalId)).toEqual(['a', 'b']);
  });

  it(`R-44: caps the selection at ${MAX_PERSONALIZATION_EVIDENCE} items`, () => {
    const signals = Array.from({ length: MAX_PERSONALIZATION_EVIDENCE + 3 }, (_, i) =>
      seedSignal({ id: `s${i}`, confidence: 100 - i }),
    );
    const ids = signals.map((s) => s.id);

    const result = selectPersonalizationEvidence(signals, ids);

    expect(result).toHaveLength(MAX_PERSONALIZATION_EVIDENCE);
  });

  it('is pure and deterministic: identical input always produces identical output', () => {
    const signals = [seedSignal({ id: 'a', confidence: 80 }), seedSignal({ id: 'b', confidence: 60 })];

    const first = selectPersonalizationEvidence(signals, ['a', 'b']);
    const second = selectPersonalizationEvidence(signals, ['a', 'b']);

    expect(second).toEqual(first);
  });
});
