import type { CategoryFit, StoredCategoryPlausibilityDetermination, StoredResearchSignal } from '@acos/core-research';
import { describe, expect, it } from 'vitest';

import { evaluateQualification } from './evaluator';

// UNIT tests (pure — no fakes needed, the evaluator has no I/O). Mirrors
// the validation plan in requirement/PHASE_20_QUALIFICATION_SCOPE_LOCK.md
// and, for CATEGORY_PLAUSIBLE, Path 2's D4/D5.

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

/**
 * Path 2 (D1/D6) determination fixture. Every pre-existing test below
 * (written before CATEGORY_PLAUSIBLE existed) passes MATCH_DETERMINATION
 * so its original NEED_DETECTED/EVIDENCE_PRESENT-only assertions keep
 * holding — a new gating criterion necessarily changes the overall
 * `state` for a scenario that supplies none, per D5's own "UNKNOWN ->
 * candidate does NOT qualify" text, so every pre-existing QUALIFIED
 * scenario must now supply a MATCH explicitly. Dedicated MISMATCH/
 * UNKNOWN/null coverage lives in its own describe block below.
 */
function determination(
  fit: CategoryFit,
  overrides: Partial<StoredCategoryPlausibilityDetermination> = {},
): StoredCategoryPlausibilityDetermination {
  return {
    id: 'category_plausibility_1',
    searchId: 'search_1',
    prospectId: 'prospect_1',
    targetCustomer: 'Restaurants, Cafes',
    targetSegments: ['Restaurants, Cafes'],
    aggregateResult: fit,
    segmentResults: [
      {
        segment: 'Restaurants, Cafes',
        fit,
        rationale: fit === 'UNKNOWN' ? null : 'fixture',
        evidence:
          fit === 'UNKNOWN'
            ? []
            : [{ quote: 'we serve restaurants and cafes across the city', sourceUrl: 'https://acme.test/about', sourceLabel: 'homepage' }],
      },
    ],
    observedAt: new Date('2026-01-01T00:00:00.000Z'),
    supersededAt: null,
    ...overrides,
  };
}

const MATCH_DETERMINATION = determination('MATCH');

describe('evaluateQualification', () => {
  it('QUALIFIED: needDetected, at least one live evidentiary signal, and CATEGORY_PLAUSIBLE MATCH', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal()],
      categoryPlausibility: MATCH_DETERMINATION,
    });

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
        reason: '1 live, OBSERVED signal(s) support the detected need',
        evidenceSignalIds: ['signal_1'],
      },
      {
        criterion: 'CATEGORY_PLAUSIBLE',
        satisfied: true,
        reason: 'the target customer plausibly matches at least one supplied segment (MATCH)',
        evidenceSignalIds: [],
      },
    ]);
    expect(result.evidenceSignalIds).toEqual(['signal_1']);
  });

  it('NOT_QUALIFIED: needDetected=false short-circuits — EVIDENCE_PRESENT is not evaluated (Decision D1)', () => {
    const result = evaluateQualification({
      needDetected: false,
      signals: [signal()], // present but irrelevant — never inspected
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('NOT_QUALIFIED');
    // CATEGORY_PLAUSIBLE is evaluated unconditionally (Path 2 E5) even
    // though NEED_DETECTED short-circuited EVIDENCE_PRESENT — it is
    // simply not the criterion here that decides NOT_QUALIFIED.
    expect(result.criteria).toHaveLength(2);
    expect(result.criteria[0]!.criterion).toBe('NEED_DETECTED');
    expect(result.criteria[0]!.satisfied).toBe(false);
    expect(result.criteria[1]!.criterion).toBe('CATEGORY_PLAUSIBLE');
    expect(result.evidenceSignalIds).toEqual([]);
  });

  it('INSUFFICIENT_EVIDENCE: needDetected=true but zero live signals remain (all superseded)', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ supersededAt: new Date('2026-02-01T00:00:00.000Z') })],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(false);
    expect(evidencePresent.reason).toBe('no live, OBSERVED ResearchSignal remains for this Prospect');
    expect(result.evidenceSignalIds).toEqual([]);
  });

  it('INSUFFICIENT_EVIDENCE: no signals at all for the Prospect', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('INSUFFICIENT_EVIDENCE: only UNKNOWN signals remain', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ classification: 'UNKNOWN', signal: null, confidence: 0 })],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('Decision D2 pinned: a low-confidence evidentiary signal still yields QUALIFIED — no fit/confidence threshold exists in v1', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ confidence: 1 })],
      categoryPlausibility: MATCH_DETERMINATION,
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
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('QUALIFIED');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.evidenceSignalIds).toEqual(['signal_pos', 'signal_neg']);
  });

  it('is deterministic — repeated calls with identical inputs produce an identical result', () => {
    const input = { needDetected: true, signals: [signal()], categoryPlausibility: MATCH_DETERMINATION };

    const first = evaluateQualification(input);
    const second = evaluateQualification(input);

    expect(second).toEqual(first);
  });

  it('excludes a signal from evidenceSignalIds when it is live but a duplicate id is not double-counted', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ id: 'signal_1' }), signal({ id: 'signal_2', field: 'growthOpportunities' })],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect([...result.evidenceSignalIds].sort()).toEqual(['signal_1', 'signal_2']);
  });
});

// Phase 24 Scenario E, Option C — OBSERVED REQUIRED
// (requirement/PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md). EVIDENCE_PRESENT
// now requires at least one live OBSERVED signal; INFERRED-only and
// UNKNOWN-only no longer satisfy it. NEED_DETECTED, needDetected itself,
// R-70/R-71, and scoring are untouched by this predicate — these cases
// all assume needDetected=true was already reached.
describe('evaluateQualification — Phase 24 Scenario E (Option C: OBSERVED required)', () => {
  it('E1: INFERRED-only evidence is INSUFFICIENT_EVIDENCE (not QUALIFIED)', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ classification: 'INFERRED', basis: 'reasoned from sparse content' })],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(false);
    expect(evidencePresent.evidenceSignalIds).toEqual([]);
    expect(result.evidenceSignalIds).toEqual([]);
  });

  it('E2: OBSERVED-only evidence satisfies EVIDENCE_PRESENT (QUALIFIED, since NEED_DETECTED already passed)', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ classification: 'OBSERVED' })],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('QUALIFIED');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(true);
    expect(evidencePresent.evidenceSignalIds).toEqual(['signal_1']);
  });

  it('E3: OBSERVED + INFERRED satisfies EVIDENCE_PRESENT via the OBSERVED signal alone', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [
        signal({ id: 'signal_observed', classification: 'OBSERVED' }),
        signal({
          id: 'signal_inferred',
          classification: 'INFERRED',
          basis: 'reasoned from sparse content',
        }),
      ],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('QUALIFIED');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(true);
    // Only the OBSERVED signal is counted as qualifying evidence.
    expect(evidencePresent.evidenceSignalIds).toEqual(['signal_observed']);
  });

  it('E4: UNKNOWN-only evidence is INSUFFICIENT_EVIDENCE', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [signal({ classification: 'UNKNOWN', signal: null, confidence: 0 })],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(false);
  });

  it('E5: INFERRED + UNKNOWN evidence is INSUFFICIENT_EVIDENCE (no OBSERVED signal present)', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [
        signal({
          id: 'signal_inferred',
          classification: 'INFERRED',
          basis: 'reasoned from sparse content',
        }),
        signal({ id: 'signal_unknown', classification: 'UNKNOWN', signal: null, confidence: 0 }),
      ],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(false);
    expect(evidencePresent.evidenceSignalIds).toEqual([]);
  });

  it('E6: OBSERVED + UNKNOWN satisfies EVIDENCE_PRESENT via the OBSERVED signal alone', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [
        signal({ id: 'signal_observed', classification: 'OBSERVED' }),
        signal({ id: 'signal_unknown', classification: 'UNKNOWN', signal: null, confidence: 0 }),
      ],
      categoryPlausibility: MATCH_DETERMINATION,
    });

    expect(result.state).toBe('QUALIFIED');
    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(true);
    expect(evidencePresent.evidenceSignalIds).toEqual(['signal_observed']);
  });
});

// Path 2 — Research-level Category Plausibility (D4/D5). NEED_DETECTED
// and EVIDENCE_PRESENT are held fixed at their passing values throughout
// this block — only CATEGORY_PLAUSIBLE varies — so each case isolates
// exactly what D5 specifies for that one aggregate result.
describe('evaluateQualification — CATEGORY_PLAUSIBLE (Path 2, D4/D5)', () => {
  const evidentSignal = signal();

  it('MATCH: criterion passes; normal (evidence-driven) flow continues to QUALIFIED', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [evidentSignal],
      categoryPlausibility: determination('MATCH'),
    });

    expect(result.state).toBe('QUALIFIED');
    const criterion = result.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!;
    expect(criterion.satisfied).toBe(true);
  });

  it('MISMATCH: criterion fails; overall state is NOT_QUALIFIED, not INSUFFICIENT_EVIDENCE', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [evidentSignal],
      categoryPlausibility: determination('MISMATCH'),
    });

    expect(result.state).toBe('NOT_QUALIFIED');
    const criterion = result.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!;
    expect(criterion.satisfied).toBe(false);
    expect(criterion.reason).toContain('MISMATCH');
  });

  it('UNKNOWN: criterion fails/holds; overall state is INSUFFICIENT_EVIDENCE', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [evidentSignal],
      categoryPlausibility: determination('UNKNOWN'),
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const criterion = result.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!;
    expect(criterion.satisfied).toBe(false);
    expect(criterion.reason).toContain('UNKNOWN');
  });

  it('null (no determination yet): treated the same as UNKNOWN, never a silent pass', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [evidentSignal],
      categoryPlausibility: null,
    });

    expect(result.state).toBe('INSUFFICIENT_EVIDENCE');
    const criterion = result.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!;
    expect(criterion.satisfied).toBe(false);
  });

  it('MISMATCH does not reintroduce a negative-evidence path for EVIDENCE_PRESENT — that criterion is unaffected', () => {
    const result = evaluateQualification({
      needDetected: true,
      signals: [evidentSignal],
      categoryPlausibility: determination('MISMATCH'),
    });

    const evidencePresent = result.criteria.find((c) => c.criterion === 'EVIDENCE_PRESENT')!;
    expect(evidencePresent.satisfied).toBe(true);
  });

  it('is deterministic across MATCH/MISMATCH/UNKNOWN — repeated calls produce identical results', () => {
    for (const fit of ['MATCH', 'MISMATCH', 'UNKNOWN'] as const) {
      const input = { needDetected: true, signals: [evidentSignal], categoryPlausibility: determination(fit) };
      expect(evaluateQualification(input)).toEqual(evaluateQualification(input));
    }
  });
});
