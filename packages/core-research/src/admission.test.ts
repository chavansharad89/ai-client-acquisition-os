import { unknownRankingProfile, type UniversalRankingProfile } from '@acos/core-acquisition';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ADMISSION_TOP_N,
  evaluateAdmission,
  hasStrongSignalBypass,
  meetsAdmissionThreshold,
  type AdmissionCandidate,
} from './admission';
import { OBSERVED_FACT_CONFIDENCE } from './deterministicSignals';
import type { DeterministicSignal } from './deterministicSignals';

function ranking(overrides: Partial<UniversalRankingProfile> = {}): UniversalRankingProfile {
  return { ...unknownRankingProfile(), ...overrides };
}

function observedSignal(
  dimension: DeterministicSignal['dimension'],
  confidence: number = OBSERVED_FACT_CONFIDENCE,
): DeterministicSignal {
  return {
    signal: { kind: 'WEBSITE', signal: 'test signal', confidence, observedAt: new Date() },
    dimension,
    field: 'test.field',
  };
}

describe('meetsAdmissionThreshold', () => {
  it.each(['STRONG', 'MODERATE'] as const)('needOpportunity %s alone is sufficient', (tier) => {
    expect(meetsAdmissionThreshold(ranking({ needOpportunity: tier }))).toBe(true);
  });

  it.each(['STRONG', 'MODERATE'] as const)('serviceFit %s alone is sufficient', (tier) => {
    expect(meetsAdmissionThreshold(ranking({ serviceFit: tier }))).toBe(true);
  });

  it.each(['WEAK', 'UNKNOWN'] as const)('below MODERATE on both dimensions fails', (tier) => {
    expect(meetsAdmissionThreshold(ranking({ needOpportunity: tier, serviceFit: tier }))).toBe(
      false,
    );
  });
});

describe('hasStrongSignalBypass', () => {
  it('fires with 2 OBSERVED top-reliability signals, >=1 Primary-dimension', () => {
    const signals = [
      observedSignal('NEED_OPPORTUNITY_GAP'),
      observedSignal('CURRENT_ACTIVITY'),
    ];
    expect(hasStrongSignalBypass(signals)).toBe(true);
  });

  it('does not fire with only 1 qualifying signal', () => {
    expect(hasStrongSignalBypass([observedSignal('NEED_OPPORTUNITY_GAP')])).toBe(false);
  });

  it('does not fire with 0 signals', () => {
    expect(hasStrongSignalBypass([])).toBe(false);
  });

  it('does not fire when >=2 signals exist but none is Primary-dimension', () => {
    const signals = [
      observedSignal('CURRENT_ACTIVITY'),
      observedSignal('COMMERCIAL_CONTACT_READINESS'),
    ];
    expect(hasStrongSignalBypass(signals)).toBe(false);
  });

  it('a signal below top-reliability confidence does not count toward the >=2 threshold', () => {
    const signals = [
      observedSignal('NEED_OPPORTUNITY_GAP'),
      observedSignal('CURRENT_ACTIVITY', 80), // not top-reliability
    ];
    expect(hasStrongSignalBypass(signals)).toBe(false);
  });

  it('SERVICE_FIT_CAPABILITY_FIT also counts as a Primary dimension', () => {
    const signals = [
      observedSignal('SERVICE_FIT_CAPABILITY_FIT'),
      observedSignal('ENTITY_REALITY'),
    ];
    expect(hasStrongSignalBypass(signals)).toBe(true);
  });
});

describe('evaluateAdmission', () => {
  function candidate(id: string, needOpportunity: UniversalRankingProfile['needOpportunity']): AdmissionCandidate {
    return { id, ranking: ranking({ needOpportunity }), deterministicSignals: [] };
  }

  it('every input candidate appears in the output, none dropped', () => {
    const candidates = [candidate('a', 'STRONG'), candidate('b', 'UNKNOWN')];
    const decisions = evaluateAdmission(candidates);
    expect(decisions.map((d) => d.id).sort()).toEqual(['a', 'b']);
  });

  it('Top-N boundary is exact: the Nth-ranked candidate is in, the (N+1)th is not', () => {
    // 11 candidates, all STRONG on needOpportunity (ties broken by id).
    const candidates = Array.from({ length: DEFAULT_ADMISSION_TOP_N + 1 }, (_, i) =>
      candidate(`c${i}`, 'STRONG'),
    );
    const decisions = evaluateAdmission(candidates);
    const admittedCount = decisions.filter((d) => d.admitted).length;
    expect(admittedCount).toBe(DEFAULT_ADMISSION_TOP_N);
    expect(decisions.filter((d) => d.topN)).toHaveLength(DEFAULT_ADMISSION_TOP_N);
  });

  it('strong-signal bypass cannot push a candidate past Top-N — bypass never bypasses Top-N or the budget', () => {
    const outsideTopN: AdmissionCandidate[] = Array.from(
      { length: DEFAULT_ADMISSION_TOP_N + 1 },
      (_, i) => ({
        id: `bypass_${i}`,
        ranking: ranking(), // UNKNOWN everywhere -- would fail the threshold test
        deterministicSignals: [
          observedSignal('NEED_OPPORTUNITY_GAP'),
          observedSignal('CURRENT_ACTIVITY'),
        ],
      }),
    );
    const decisions = evaluateAdmission(outsideTopN);
    const admittedCount = decisions.filter((d) => d.admitted).length;
    expect(admittedCount).toBe(DEFAULT_ADMISSION_TOP_N);
    expect(decisions.every((d) => d.bypass)).toBe(true);
    expect(decisions.some((d) => d.bypass && !d.topN && d.admitted)).toBe(false);
  });

  it('a candidate below threshold and without bypass is ranked but not admitted', () => {
    const decisions = evaluateAdmission([candidate('solo', 'UNKNOWN')]);
    expect(decisions[0]).toMatchObject({ topN: true, bypass: false, thresholdMet: false, admitted: false });
  });
});
