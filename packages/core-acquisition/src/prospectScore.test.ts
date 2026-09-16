import { describe, expect, it } from 'vitest';

import {
  BAND_THRESHOLDS,
  bandFor,
  FACTOR_WEIGHTS,
  INFERENCE_DISCOUNT,
  rankProspects,
  SCORE_FACTORS,
  scoreProspect,
  type ClaimBasis,
  type ProspectInput,
  type ResearchSignal,
} from './index';

const NOW = new Date('2026-07-01T09:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const signal = (over: Partial<ResearchSignal> = {}): ResearchSignal => ({
  kind: 'JOB_POST',
  signal: 'hiring 3 content writers',
  confidence: 90,
  observedAt: daysAgo(2),
  ...over,
});

const base = (over: Partial<ProspectInput> = {}): ProspectInput => ({
  signals: [signal()],
  icp: {
    industryMatch: { value: true, basis: 'OBSERVED', note: 'logistics, per their site' },
    sizeMatch: { value: true, basis: 'OBSERVED', note: '11-50 on LinkedIn' },
    geoMatch: { value: true, basis: 'OBSERVED', note: 'Pune' },
  },
  abilityToPay: { value: 'strong', basis: 'OBSERVED', note: 'three open roles advertised' },
  urgency: { value: 'immediate', basis: 'OBSERVED', note: 'roles posted this week' },
  serviceFit: { value: 85, basis: 'OBSERVED' },
  contact: { hasEmail: true, hasLinkedIn: true, hasPhone: true, unsubscribed: false },
  ...over,
});

const allInferred = (): ProspectInput =>
  base({
    signals: [],
    icp: {
      industryMatch: { value: true, basis: 'INFERRED' },
      sizeMatch: { value: true, basis: 'INFERRED' },
      geoMatch: { value: true, basis: 'INFERRED' },
    },
    abilityToPay: { value: 'strong', basis: 'INFERRED' },
    urgency: { value: 'immediate', basis: 'INFERRED' },
    serviceFit: { value: 100, basis: 'INFERRED' },
  });

const nothingKnown = (): ProspectInput =>
  base({
    signals: [],
    icp: {
      industryMatch: { value: null, basis: 'UNKNOWN' },
      sizeMatch: { value: null, basis: 'UNKNOWN' },
      geoMatch: { value: null, basis: 'UNKNOWN' },
    },
    abilityToPay: { value: null, basis: 'UNKNOWN' },
    urgency: { value: null, basis: 'UNKNOWN' },
    serviceFit: { value: null, basis: 'UNKNOWN' },
    contact: { hasEmail: false, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
  });

// ================================================== seven factors ======

describe('the seven factors', () => {
  it('are exactly the ones specified', () => {
    expect([...SCORE_FACTORS]).toEqual([
      'icpFit',
      'visibleProblem',
      'abilityToPay',
      'urgency',
      'serviceFit',
      'evidenceQuality',
      'contactability',
    ]);
  });

  it('have weights summing to exactly 100', () => {
    const total = Object.values(FACTOR_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    expect(total).toBe(100);
  });

  it('all appear in every result, including the ones scoring zero', () => {
    const result = scoreProspect(nothingKnown(), NOW);
    expect(result.factors.map((f) => f.factor)).toEqual([...SCORE_FACTORS]);
  });

  it('never let a single factor exceed its weight', () => {
    const result = scoreProspect(base(), NOW);
    for (const factor of result.factors) {
      expect(factor.points, factor.factor).toBeLessThanOrEqual(factor.weight);
    }
  });
});

// ===================================================== the score =======

describe('score and band', () => {
  it('scores a strong, fully observed prospect HIGH', () => {
    const result = scoreProspect(base(), NOW);
    expect(result.score).toBeGreaterThanOrEqual(BAND_THRESHOLDS.HIGH);
    expect(result.band).toBe('HIGH');
  });

  it('scores an unknown prospect LOW', () => {
    const result = scoreProspect(nothingKnown(), NOW);
    expect(result.score).toBe(0);
    expect(result.band).toBe('LOW');
  });

  it('is always within 0-100', () => {
    const inputs = [base(), allInferred(), nothingKnown(), base({ signals: [] })];
    for (const input of inputs) {
      const { score } = scoreProspect(input, NOW);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('bands are exhaustive and contiguous', () => {
    expect(bandFor(100)).toBe('HIGH');
    expect(bandFor(BAND_THRESHOLDS.HIGH)).toBe('HIGH');
    expect(bandFor(BAND_THRESHOLDS.HIGH - 1)).toBe('MEDIUM');
    expect(bandFor(BAND_THRESHOLDS.MEDIUM)).toBe('MEDIUM');
    expect(bandFor(BAND_THRESHOLDS.MEDIUM - 1)).toBe('LOW');
    expect(bandFor(0)).toBe('LOW');
  });
});

// ======================================== inference is not fact ========

describe('AI inference is never presented as fact', () => {
  it('labels every reason with how it was arrived at', () => {
    const result = scoreProspect(base(), NOW);
    expect(result.reasons.length).toBeGreaterThan(0);
    for (const reason of result.reasons) {
      expect(reason, reason).toMatch(/^(Observed|Inferred|Not established|Capped):/);
    }
  });

  it('never emits a bare reason with no basis prefix', () => {
    for (const input of [base(), allInferred(), nothingKnown()]) {
      for (const reason of scoreProspect(input, NOW).reasons) {
        expect(reason).toMatch(/^(Observed|Inferred|Not established|Capped):/);
      }
    }
  });

  it('halves an inferred factor against an identical observed one', () => {
    const observed = scoreProspect(
      base({ abilityToPay: { value: 'strong', basis: 'OBSERVED' } }),
      NOW,
    );
    const inferred = scoreProspect(
      base({ abilityToPay: { value: 'strong', basis: 'INFERRED' } }),
      NOW,
    );
    const observedPay = observed.factors.find((f) => f.factor === 'abilityToPay')!.points;
    const inferredPay = inferred.factors.find((f) => f.factor === 'abilityToPay')!.points;
    expect(inferredPay).toBe(Math.round(observedPay * INFERENCE_DISCOUNT));
  });

  it('gives an UNKNOWN factor no points at all', () => {
    const result = scoreProspect(base({ urgency: { value: null, basis: 'UNKNOWN' } }), NOW);
    expect(result.factors.find((f) => f.factor === 'urgency')!.points).toBe(0);
  });

  it('caps a prospect whose case is mostly inference, however confident', () => {
    // Observed signals carry visibleProblem and evidenceQuality; everything
    // that makes this look like a priority is inferred. Arithmetically it
    // reaches HIGH, and it must not be allowed to stay there.
    const mostlyInferred = base({
      // Three strong signals max out visibleProblem and evidenceQuality,
      // which is what pushes the arithmetic to 68 — HIGH territory.
      signals: [signal({ confidence: 95 }), signal({ confidence: 95 }), signal({ confidence: 95 })],
      icp: {
        industryMatch: { value: true, basis: 'INFERRED' },
        sizeMatch: { value: true, basis: 'INFERRED' },
        geoMatch: { value: true, basis: 'INFERRED' },
      },
      abilityToPay: { value: 'strong', basis: 'INFERRED' },
      urgency: { value: 'immediate', basis: 'INFERRED' },
      serviceFit: { value: 100, basis: 'INFERRED' },
    });
    const result = scoreProspect(mostlyInferred, NOW);

    expect(result.observedShare).toBeLessThan(0.5);
    expect(result.band).not.toBe('HIGH');
    expect(result.cap).toMatch(/inference/i);
  });

  it('an inference-only prospect cannot reach HIGH arithmetically either', () => {
    // Belt and braces: with every factor inferred and no signals, the
    // discount alone keeps it below the threshold.
    const result = scoreProspect(allInferred(), NOW);
    expect(result.band).not.toBe('HIGH');
    expect(result.observedShare).toBe(0);
  });

  it('explains the cap in the reasons, not just a field', () => {
    const result = scoreProspect(
      base({
        signals: [
          signal({ confidence: 95 }),
          signal({ confidence: 95 }),
          signal({ confidence: 95 }),
        ],
        icp: {
          industryMatch: { value: true, basis: 'INFERRED' },
          sizeMatch: { value: true, basis: 'INFERRED' },
          geoMatch: { value: true, basis: 'INFERRED' },
        },
        abilityToPay: { value: 'strong', basis: 'INFERRED' },
        urgency: { value: 'immediate', basis: 'INFERRED' },
        serviceFit: { value: 100, basis: 'INFERRED' },
      }),
      NOW,
    );
    expect(result.reasons.some((reason) => reason.startsWith('Capped:'))).toBe(true);
  });

  it('does not count having an email address as evidence for the case', () => {
    // Contactability is administrative, not evidential — see the comment
    // in prospectScore.ts. Counting it would mask inference-heavy leads.
    const withContact = scoreProspect(allInferred(), NOW);
    expect(withContact.observedShare).toBe(0);
  });

  it('reports what share of the score is actually evidenced', () => {
    expect(scoreProspect(base(), NOW).observedShare).toBeGreaterThan(0.5);
    expect(scoreProspect(allInferred(), NOW).observedShare).toBeLessThan(0.5);
  });
});

// ======================================================= reasons =======

describe('every score includes reasons', () => {
  it('always returns at least one', () => {
    for (const input of [base(), allInferred(), nothingKnown()]) {
      expect(scoreProspect(input, NOW).reasons.length).toBeGreaterThan(0);
    }
  });

  it('orders the strongest contributors first', () => {
    const result = scoreProspect(base(), NOW);
    const points = result.reasons
      .map((reason) => Number(/\(\+(\d+)\)/.exec(reason)?.[1] ?? -1))
      .filter((n) => n >= 0);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it('names what is missing, not only what scored', () => {
    const result = scoreProspect(base({ urgency: { value: null, basis: 'UNKNOWN' } }), NOW);
    expect(result.reasons.some((r) => r.includes('Not established') && r.includes('timing'))).toBe(
      true,
    );
  });

  it('quotes the actual signal rather than a category', () => {
    const result = scoreProspect(base(), NOW);
    expect(result.reasons.join(' ')).toContain('hiring 3 content writers');
  });

  it('names every unestablished factor when nothing is known', () => {
    const result = scoreProspect(nothingKnown(), NOW);
    expect(result.reasons.length).toBeGreaterThanOrEqual(5);
    expect(result.reasons.every((reason) => reason.startsWith('Not established:'))).toBe(true);
  });
});

// ================================================== consistency ========

describe('scoring consistency', () => {
  it('is deterministic — the same input scores the same every time', () => {
    const input = base();
    const runs = Array.from({ length: 20 }, () => scoreProspect(input, NOW));
    const first = JSON.stringify(runs[0]);
    for (const run of runs) expect(JSON.stringify(run)).toBe(first);
  });

  it('does not depend on object identity', () => {
    expect(scoreProspect(base(), NOW).score).toBe(scoreProspect(base(), NOW).score);
  });

  it('is monotonic: adding a stronger signal never lowers the score', () => {
    const weak = scoreProspect(base({ signals: [signal({ confidence: 55 })] }), NOW).score;
    const strong = scoreProspect(base({ signals: [signal({ confidence: 95 })] }), NOW).score;
    expect(strong).toBeGreaterThanOrEqual(weak);
  });

  it('is monotonic across every factor independently', () => {
    const upgrades: [string, ProspectInput, ProspectInput][] = [
      [
        'abilityToPay',
        base({ abilityToPay: { value: 'weak', basis: 'OBSERVED' } }),
        base({ abilityToPay: { value: 'strong', basis: 'OBSERVED' } }),
      ],
      [
        'urgency',
        base({ urgency: { value: 'someday', basis: 'OBSERVED' } }),
        base({ urgency: { value: 'immediate', basis: 'OBSERVED' } }),
      ],
      [
        'serviceFit',
        base({ serviceFit: { value: 20, basis: 'OBSERVED' } }),
        base({ serviceFit: { value: 95, basis: 'OBSERVED' } }),
      ],
      [
        'contactability',
        base({
          contact: { hasEmail: true, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
        }),
        base({
          contact: { hasEmail: true, hasLinkedIn: true, hasPhone: true, unsubscribed: false },
        }),
      ],
    ];
    for (const [name, lower, higher] of upgrades) {
      expect(scoreProspect(higher, NOW).score, name).toBeGreaterThanOrEqual(
        scoreProspect(lower, NOW).score,
      );
    }
  });

  it('upgrading a basis from INFERRED to OBSERVED never lowers the score', () => {
    for (const basis of ['INFERRED', 'OBSERVED'] as ClaimBasis[]) {
      void basis;
    }
    const inferred = scoreProspect(
      base({ urgency: { value: 'immediate', basis: 'INFERRED' } }),
      NOW,
    );
    const observed = scoreProspect(
      base({ urgency: { value: 'immediate', basis: 'OBSERVED' } }),
      NOW,
    );
    expect(observed.score).toBeGreaterThanOrEqual(inferred.score);
  });

  it('decays consistently with the shared signal rule', () => {
    const fresh = scoreProspect(base({ signals: [signal({ observedAt: daysAgo(1) })] }), NOW).score;
    const old = scoreProspect(base({ signals: [signal({ observedAt: daysAgo(150) })] }), NOW).score;
    const dead = scoreProspect(
      base({ signals: [signal({ observedAt: daysAgo(400) })] }),
      NOW,
    ).score;
    expect(fresh).toBeGreaterThan(old);
    expect(old).toBeGreaterThan(dead);
  });

  it('ignores superseded signals', () => {
    const withSuperseded = scoreProspect(
      base({ signals: [signal(), signal({ supersededAt: NOW, confidence: 100 })] }),
      NOW,
    );
    const withoutIt = scoreProspect(base({ signals: [signal()] }), NOW);
    expect(withSuperseded.score).toBe(withoutIt.score);
  });

  it('ranks stably, breaking ties the same way every time', () => {
    const prospects = [
      { id: 'c', score: scoreProspect(base(), NOW) },
      { id: 'a', score: scoreProspect(base(), NOW) },
      { id: 'b', score: scoreProspect(base(), NOW) },
    ];
    expect(rankProspects(prospects).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(rankProspects(prospects).map((p) => p.id)).toEqual(
      rankProspects([...prospects].reverse()).map((p) => p.id),
    );
  });

  it('prefers the better-evidenced prospect when scores tie', () => {
    const evidenced = { id: 'z', score: scoreProspect(base(), NOW) };
    const guessed = { id: 'a', score: scoreProspect(allInferred(), NOW) };
    // Force equal scores to isolate the tiebreak.
    const tied = [
      { ...guessed, score: { ...guessed.score, score: 50 } },
      { ...evidenced, score: { ...evidenced.score, score: 50 } },
    ];
    expect(rankProspects(tied)[0]!.id).toBe('z');
  });
});

// ================================================== hard stop ==========

describe('unsubscribed is a hard stop', () => {
  it('scores zero regardless of how good the fit is', () => {
    const result = scoreProspect(
      base({ contact: { hasEmail: true, hasLinkedIn: true, hasPhone: true, unsubscribed: true } }),
      NOW,
    );
    expect(result.score).toBe(0);
    expect(result.band).toBe('LOW');
  });

  it('says why, so nobody tries to override it', () => {
    const result = scoreProspect(
      base({ contact: { hasEmail: true, hasLinkedIn: true, hasPhone: true, unsubscribed: true } }),
      NOW,
    );
    expect(result.cap).toMatch(/unsubscribed/);
    expect(result.reasons[0]).toMatch(/must not be contacted/);
  });
});
