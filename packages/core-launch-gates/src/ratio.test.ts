import { describe, expect, it } from 'vitest';

import { buildCountResult, buildRatioResult } from './ratio';
import type { GateWindow } from './window';

const NOW = new Date('2026-03-01T00:00:00.000Z');
const CLOSED_WINDOW: GateWindow = {
  start: new Date('2025-12-31T00:00:00.000Z'),
  end: new Date('2026-01-30T00:00:00.000Z'),
};
const OPEN_WINDOW: GateWindow = { start: NOW, end: new Date(NOW.getTime() + 86_400_000) };

describe('buildRatioResult', () => {
  it('is NOT_YET_EVALUABLE when the window has not closed — regardless of counts', () => {
    const result = buildRatioResult('PCG-4', OPEN_WINDOW, NOW, 10, 20);
    expect(result.status).toBe('NOT_YET_EVALUABLE');
  });

  it('is NOT_YET_EVALUABLE on a zero denominator, never a division error', () => {
    const result = buildRatioResult('PCG-4', CLOSED_WINDOW, NOW, 0, 0);
    expect(result.status).toBe('NOT_YET_EVALUABLE');
    expect(result.value).toBeUndefined();
  });

  it('computes numerator/denominator as value when evaluable', () => {
    const result = buildRatioResult('PCG-4', CLOSED_WINDOW, NOW, 5, 20);
    expect(result).toMatchObject({ status: 'EVALUATED', numerator: 5, denominator: 20, value: 0.25 });
  });

  it('a non-zero denominator with a zero numerator is still EVALUATED, not insufficient sample (B-9: no floor)', () => {
    const result = buildRatioResult('PCG-5', CLOSED_WINDOW, NOW, 0, 3);
    expect(result).toMatchObject({ status: 'EVALUATED', value: 0 });
  });
});

describe('buildCountResult', () => {
  it('is NOT_YET_EVALUABLE when the window has not closed', () => {
    expect(buildCountResult('PCG-1', OPEN_WINDOW, NOW, 100).status).toBe('NOT_YET_EVALUABLE');
  });

  it('a closed window with a zero count is EVALUATED, not insufficient sample', () => {
    const result = buildCountResult('PCG-1', CLOSED_WINDOW, NOW, 0);
    expect(result).toMatchObject({ status: 'EVALUATED', numerator: 0 });
  });
});
