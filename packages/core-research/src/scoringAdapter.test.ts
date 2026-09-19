import { INFERENCE_DISCOUNT } from '@acos/core-acquisition';
import { describe, expect, it } from 'vitest';

import { toScoringSignals } from './scoringAdapter';
import type { StoredResearchSignal } from './types';

const OBSERVED_AT = new Date('2026-07-01T00:00:00.000Z');

function row(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring 3 content writers',
    confidence: 90,
    basis: null,
    observedAt: OBSERVED_AT,
    supersededAt: null,
    sources: [],
    ...overrides,
  };
}

describe('toScoringSignals', () => {
  it('carries an OBSERVED row through with confidence unchanged', () => {
    const { signals, unknownCount } = toScoringSignals([row({ confidence: 90 })]);

    expect(signals).toHaveLength(1);
    expect(signals[0]!.confidence).toBe(90);
    expect(unknownCount).toBe(0);
  });

  it('halves an INFERRED row confidence by exactly INFERENCE_DISCOUNT', () => {
    const { signals } = toScoringSignals([
      row({ classification: 'INFERRED', confidence: 80, basis: 'reasoned from job posts' }),
    ]);

    expect(signals).toHaveLength(1);
    expect(signals[0]!.confidence).toBe(Math.round(80 * INFERENCE_DISCOUNT));
    expect(signals[0]!.confidence).toBe(40);
  });

  it('excludes an UNKNOWN row from signals but counts it', () => {
    const { signals, unknownCount } = toScoringSignals([
      row({ classification: 'UNKNOWN', signal: null, confidence: 0 }),
    ]);

    expect(signals).toHaveLength(0);
    expect(unknownCount).toBe(1);
  });

  it('applies the discount exactly once — never doubled', () => {
    const { signals } = toScoringSignals([row({ classification: 'INFERRED', confidence: 100 })]);
    // 100 * 0.5 = 50 — not 25 (which a double-discount would produce).
    expect(signals[0]!.confidence).toBe(50);
  });

  it('never mutates the raw persisted confidence on the input row', () => {
    const input = row({ classification: 'INFERRED', confidence: 80 });
    toScoringSignals([input]);
    expect(input.confidence).toBe(80);
  });

  it('maps classification to the discount decision correctly across a mixed batch', () => {
    const { signals, unknownCount } = toScoringSignals([
      row({ id: 's1', classification: 'OBSERVED', confidence: 90 }),
      row({ id: 's2', classification: 'INFERRED', confidence: 60, basis: 'reasoned' }),
      row({ id: 's3', classification: 'UNKNOWN', signal: null, confidence: 0 }),
    ]);

    expect(unknownCount).toBe(1);
    expect(signals).toHaveLength(2);
    expect(signals.find((s) => s.confidence === 90)).toBeDefined(); // OBSERVED, unchanged
    expect(signals.find((s) => s.confidence === 30)).toBeDefined(); // INFERRED, halved
  });

  it('preserves kind, signal text, observedAt and supersededAt', () => {
    const supersededAt = new Date('2026-07-05T00:00:00.000Z');
    const { signals } = toScoringSignals([
      row({ kind: 'FUNDING', signal: 'raised a Series A', supersededAt }),
    ]);

    expect(signals[0]).toMatchObject({
      kind: 'FUNDING',
      signal: 'raised a Series A',
      observedAt: OBSERVED_AT,
      supersededAt,
    });
  });

  it('is deterministic — the same input adapts to the same output every time', () => {
    const input = [
      row({ id: 's1', classification: 'OBSERVED', confidence: 70 }),
      row({ id: 's2', classification: 'INFERRED', confidence: 55, basis: 'reasoned' }),
    ];
    const first = toScoringSignals(input);
    const second = toScoringSignals(input);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('returns an empty adaptation for no signals', () => {
    expect(toScoringSignals([])).toEqual({ signals: [], unknownCount: 0 });
  });
});
