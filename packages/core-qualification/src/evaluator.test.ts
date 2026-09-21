import type { StoredResearchSignal } from '@acos/core-research';
import { describe, expect, it } from 'vitest';

import { evaluateQualification } from './evaluator';

// UNIT tests (pure — no fakes needed, the evaluator has no I/O). Mirrors
// the validation plan in requirement/PHASE_20_QUALIFICATION_SCOPE_LOCK.md.

function signal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring a content writer',
    confidence: 88,
    basis: null,
    observedAt: new Date('2026-01-01T00:00:00.000Z'),
    supersededAt: null,
    sources: [],
    ...overrides,
  };
}

describe('evaluateQualification', () => {
  it('QUALIFIED: needDetected and at least one live, evidentiary signal', () => {
    const result = evaluateQualification({ needDetected: true, signals: [signal()] });

    expect(result.state).toBe('QUALIFIED');
    expect(result.criteria).toEqual([
      {
        criterion: 'NEED_DETECTED',
        satisfied: true,
        reason: 'a need was detected (suggestOffers() matched an offer)',
        evidenceSignalIds: [],
      },
      {
        criterion: 'EVIDENCE_PRESENT',
        satisfied: true,
        reason: '1 live, non-UNKNOWN signal(s) support the detected need',
        evidenceSignalIds: ['signal_1'],
      },
    ]);
    expect(result.evidenceSignalIds).toEqual(['signal_1']);
  });

  it('NOT_QUALIFIED: needDetected=false short-circuits — EVIDENCE_PRESENT is not evaluated (Decision D1)', () => {
    const result = evaluateQualification({
      needDetected: false,
      signals: [signal()], // present but irrelevant — never inspected
    });

    expect(result.state).toBe('NOT_QUALIFIED');
    expect(result.criteria).toHaveLength(1);
    expect(result.criteria[0]!.criterion).toBe('NEED_DETECTED');
    expect(result.criteria[0]!.satisfied).toBe(false);
    expect(result.evidenceSignalIds).toEqual([]);
  });

  it('INSUFFICIENT_EVIDENCE: needDetected=true but zero live signals remain (all superseded)', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ supersededAt: new Date('2026-02-01T00:00:00.000Z') })],
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(false);
    expect(evidencePresent.reason).toBe('no live, non-UNKNOWN ResearchSignal remains for this Prospect');
    expect(result.evidenceSignalIds).toEqual([]);
  });

  it('INSUFFICIENT_EVIDENCE: no signals at all for the Prospect', () => {
    const result = evaluateQualification({ needDetected: true, signals: [] });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('INSUFFICIENT_EVIDENCE: only UNKNOWN signals remain', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ classification: 'UNKNOWN', signal: null, confidence: 0 })],
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('Decision D2 pinned: a low-confidence evidentiary signal still yields QUALIFIED — no fit/confidence threshold exists in v1', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ confidence: 1 })],
    });

    expect(result.state).toBe('QUALIFIED');
  });

  it('Decision D3 pinned: contradictory-looking signal text cannot disqualify — no negative-evidence criterion exists in v1', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [
        signal({ id: 'signal_pos', signal: 'hiring a content writer' }),
        signal({ id: 'signal_neg', signal: 'NOT hiring, content team fully staffed' }),
      ],
    });

    expect(result.state).toBe('QUALIFIED');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.evidenceSignalIds).toEqual(['signal_pos', 'signal_neg']);
  });

  it('is deterministic — repeated calls with identical inputs produce an identical result', () => {
    const input = { needDetected: true, signals: [signal()] };

    const first = evaluateQualification(input);
    const second = evaluateQualification(input);

    expect(second).toEqual(first);
  });

  it('excludes a signal from evidenceSignalIds when it is live but a duplicate id is not double-counted', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ id: 'signal_1' }), signal({ id: 'signal_2', field: 'growthOpportunities' })],
    });

    expect([...result.evidenceSignalIds].sort()).toEqual(['signal_1', 'signal_2']);
  });
});
