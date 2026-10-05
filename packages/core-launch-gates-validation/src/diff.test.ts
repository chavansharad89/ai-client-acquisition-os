import type { GateResult } from '@acos/core-launch-gates';
import { describe, expect, it } from 'vitest';

import { diffGateResult, diffGateResults } from './diff';

const WINDOW = { start: new Date('2025-12-31T00:00:00.000Z'), end: new Date('2026-01-30T00:00:00.000Z') };

function result(overrides: Partial<GateResult> = {}): GateResult {
  return { gate: 'PCG-1', window: WINDOW, status: 'EVALUATED', numerator: 10, ...overrides };
}

describe('diffGateResult', () => {
  it('matches when production and validation agree', () => {
    const diff = diffGateResult(result(), result());
    expect(diff.matches).toBe(true);
  });

  it('flags a numerator mismatch', () => {
    const diff = diffGateResult(result({ numerator: 10 }), result({ numerator: 9 }));
    expect(diff.matches).toBe(false);
    expect(diff.delta.numerator).toBe(false);
  });

  it('flags a status mismatch (e.g. one side thinks the window is not closed)', () => {
    const diff = diffGateResult(result({ status: 'EVALUATED' }), result({ status: 'NOT_YET_EVALUABLE' }));
    expect(diff.matches).toBe(false);
  });

  it('throws if asked to diff two different gates', () => {
    expect(() => diffGateResult(result({ gate: 'PCG-1' }), result({ gate: 'PCG-2' }))).toThrow();
  });
});

describe('diffGateResults', () => {
  it('diffs a list pairwise by gate', () => {
    const production = [result({ gate: 'PCG-1' }), result({ gate: 'PCG-2', numerator: 5 })];
    const validation = [result({ gate: 'PCG-1' }), result({ gate: 'PCG-2', numerator: 5 })];
    const diffs = diffGateResults(production, validation);
    expect(diffs.every((d) => d.matches)).toBe(true);
  });

  it('throws if validation is missing a gate production reported', () => {
    expect(() => diffGateResults([result({ gate: 'PCG-1' })], [])).toThrow();
  });
});
