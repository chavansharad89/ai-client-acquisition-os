import { describe, expect, it } from 'vitest';

import { recommendOpportunityAction, type OpportunityActionInput } from './index';

const input = (over: Partial<OpportunityActionInput> = {}): OpportunityActionInput => ({
  state: 'NEW',
  needDetected: true,
  staleness: 'FRESH',
  ...over,
});

describe('recommendOpportunityAction', () => {
  it('recommends HOLD when no need was detected, regardless of state or staleness', () => {
    expect(recommendOpportunityAction(input({ needDetected: false })).kind).toBe('HOLD');
    expect(
      recommendOpportunityAction(input({ needDetected: false, state: 'RESEARCHED' })).kind,
    ).toBe('HOLD');
    expect(
      recommendOpportunityAction(input({ needDetected: false, staleness: 'SUPERSEDED' })).kind,
    ).toBe('HOLD');
  });

  it('recommends REFRESH_RESEARCH when evidence is STALE, regardless of state', () => {
    expect(recommendOpportunityAction(input({ staleness: 'STALE', state: 'NEW' })).kind).toBe(
      'REFRESH_RESEARCH',
    );
    expect(
      recommendOpportunityAction(input({ staleness: 'STALE', state: 'RESEARCHED' })).kind,
    ).toBe('REFRESH_RESEARCH');
  });

  it('recommends REFRESH_RESEARCH when evidence is SUPERSEDED, regardless of state', () => {
    expect(recommendOpportunityAction(input({ staleness: 'SUPERSEDED', state: 'NEW' })).kind).toBe(
      'REFRESH_RESEARCH',
    );
    expect(
      recommendOpportunityAction(input({ staleness: 'SUPERSEDED', state: 'RESEARCHED' })).kind,
    ).toBe('REFRESH_RESEARCH');
  });

  it('recommends CONSIDER_OFFER for a NEW opportunity with a detected need and FRESH evidence', () => {
    expect(recommendOpportunityAction(input({ state: 'NEW', staleness: 'FRESH' })).kind).toBe(
      'CONSIDER_OFFER',
    );
  });

  it('recommends REVIEW_EVIDENCE for a RESEARCHED opportunity with a detected need and FRESH evidence', () => {
    expect(
      recommendOpportunityAction(input({ state: 'RESEARCHED', staleness: 'FRESH' })).kind,
    ).toBe('REVIEW_EVIDENCE');
  });

  it('evidence-sufficiency outranks staleness — HOLD wins even over SUPERSEDED', () => {
    expect(
      recommendOpportunityAction(input({ needDetected: false, staleness: 'SUPERSEDED' })).kind,
    ).toBe('HOLD');
  });

  it('staleness outranks pipeline position — REFRESH_RESEARCH wins even for RESEARCHED', () => {
    expect(
      recommendOpportunityAction(input({ state: 'RESEARCHED', staleness: 'STALE' })).kind,
    ).toBe('REFRESH_RESEARCH');
  });

  it('returns a non-empty, kind-specific label alongside the kind', () => {
    const kinds: OpportunityActionInput[] = [
      input({ needDetected: false }),
      input({ staleness: 'STALE' }),
      input({ state: 'NEW' }),
      input({ state: 'RESEARCHED' }),
    ];
    for (const one of kinds) {
      const action = recommendOpportunityAction(one);
      expect(action.label.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic — the same input recommends identically every call', () => {
    const one = input({ state: 'RESEARCHED', staleness: 'FRESH', needDetected: true });
    expect(recommendOpportunityAction(one)).toEqual(recommendOpportunityAction(one));
  });
});
