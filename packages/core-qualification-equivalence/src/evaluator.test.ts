import { describe, expect, it } from 'vitest';

import { evaluateQualificationEquivalence } from './evaluator';
import type { QualificationEquivalenceSubject, SearchSnapshot } from './types';

const SNAPSHOT: SearchSnapshot = {
  service: 'AI content system',
  targetCustomer: 'Restaurants',
  geography: 'Mumbai',
  minProjectValuePaise: 15_000_000,
};

function subject(overrides: Partial<QualificationEquivalenceSubject> = {}): QualificationEquivalenceSubject {
  return {
    offerService: null,
    offerEstimatedValuePaise: null,
    observedTargetCustomer: null,
    ...overrides,
  };
}

describe('evaluateQualificationEquivalence', () => {
  it('matches when every criterion is satisfied', () => {
    const result = evaluateQualificationEquivalence(
      SNAPSHOT,
      subject({
        offerService: 'AI content system',
        offerEstimatedValuePaise: 20_000_000,
        observedTargetCustomer: 'Restaurants',
      }),
    );
    expect(result.match).toBe(true);
    expect(result.criteria.every((c) => c.satisfied === true)).toBe(true);
  });

  it('is case/whitespace-insensitive on string criteria', () => {
    const result = evaluateQualificationEquivalence(
      SNAPSHOT,
      subject({
        offerService: '  AI CONTENT SYSTEM  ',
        offerEstimatedValuePaise: 15_000_000,
        observedTargetCustomer: 'restaurants',
      }),
    );
    expect(result.match).toBe(true);
  });

  it('does not match when the offer service differs', () => {
    const result = evaluateQualificationEquivalence(
      SNAPSHOT,
      subject({
        offerService: 'Website development',
        offerEstimatedValuePaise: 20_000_000,
        observedTargetCustomer: 'Restaurants',
      }),
    );
    expect(result.match).toBe(false);
    expect(result.criteria.find((c) => c.criterion === 'SERVICE_MATCH')!.satisfied).toBe(false);
  });

  it('does not match when the estimated value is below the minimum', () => {
    const result = evaluateQualificationEquivalence(
      SNAPSHOT,
      subject({
        offerService: 'AI content system',
        offerEstimatedValuePaise: 1_000_000,
        observedTargetCustomer: 'Restaurants',
      }),
    );
    expect(result.match).toBe(false);
  });

  it('is UNKNOWN (not a throw) when the offer has not been recommended yet', () => {
    const result = evaluateQualificationEquivalence(SNAPSHOT, subject());
    expect(result.match).toBe('UNKNOWN');
    expect(result.criteria.every((c) => c.satisfied === 'UNKNOWN')).toBe(true);
  });

  it('a definite mismatch outranks an unknown — match is false, not UNKNOWN', () => {
    const result = evaluateQualificationEquivalence(
      SNAPSHOT,
      subject({
        offerService: 'Website development', // mismatch
        // the other two fields are left unknown
      }),
    );
    expect(result.match).toBe(false);
  });

  it('never throws regardless of subject shape', () => {
    expect(() => evaluateQualificationEquivalence(SNAPSHOT, subject())).not.toThrow();
  });

  // See requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md.
  // TARGET_CUSTOMER_MATCH has no authorized data source in production
  // today (callers pass observedTargetCustomer: null) — this criterion
  // resolves to 'UNKNOWN' on its own, and 'UNKNOWN' blocks an overall
  // `true` even when SERVICE_MATCH and MINIMUM_VALUE_MATCH both pass.
  it('TARGET_CUSTOMER_MATCH alone being UNKNOWN keeps the overall match from ever being true, even with every other criterion satisfied', () => {
    const result = evaluateQualificationEquivalence(
      SNAPSHOT,
      subject({
        offerService: 'AI content system', // satisfied
        offerEstimatedValuePaise: 20_000_000, // satisfied
        observedTargetCustomer: null, // the unresolved gap — no authorized source
      }),
    );
    expect(result.criteria.find((c) => c.criterion === 'TARGET_CUSTOMER_MATCH')!.satisfied).toBe(
      'UNKNOWN',
    );
    expect(result.criteria.find((c) => c.criterion === 'SERVICE_MATCH')!.satisfied).toBe(true);
    expect(result.criteria.find((c) => c.criterion === 'MINIMUM_VALUE_MATCH')!.satisfied).toBe(
      true,
    );
    expect(result.match).toBe('UNKNOWN');
    expect(result.match).not.toBe(true);
  });
});
