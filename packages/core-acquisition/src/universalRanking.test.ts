import { describe, expect, it } from 'vitest';

import {
  compareRankingProfiles,
  rankByUniversalProfile,
  unknownRankingProfile,
  type UniversalRankingProfile,
} from './universalRanking';

function profile(overrides: Partial<UniversalRankingProfile> = {}): UniversalRankingProfile {
  return { ...unknownRankingProfile(), ...overrides };
}

describe('compareRankingProfiles', () => {
  it('STRONG outranks MODERATE on the same dimension', () => {
    const strong = profile({ needOpportunity: 'STRONG' });
    const moderate = profile({ needOpportunity: 'MODERATE' });
    expect(compareRankingProfiles(strong, moderate)).toBeLessThan(0);
    expect(compareRankingProfiles(moderate, strong)).toBeGreaterThan(0);
  });

  it('MODERATE outranks WEAK on the same dimension', () => {
    const moderate = profile({ serviceFit: 'MODERATE' });
    const weak = profile({ serviceFit: 'WEAK' });
    expect(compareRankingProfiles(moderate, weak)).toBeLessThan(0);
  });

  it('WEAK outranks UNKNOWN on the same dimension', () => {
    const weak = profile({ evidenceQuality: 'WEAK' });
    const unknown = profile({ evidenceQuality: 'UNKNOWN' });
    expect(compareRankingProfiles(weak, unknown)).toBeLessThan(0);
  });

  it('a Primary-dimension tier outranks any Important/Supporting difference', () => {
    // a loses on Primary (needOpportunity) but wins on every Important/
    // Supporting dimension — Primary must still decide the comparison.
    const a = profile({
      needOpportunity: 'WEAK',
      evidenceQuality: 'STRONG',
      evidenceFreshness: 'STRONG',
      contactability: 'STRONG',
      currentActivity: 'STRONG',
      commercialReadiness: 'STRONG',
    });
    const b = profile({ needOpportunity: 'MODERATE' });
    expect(compareRankingProfiles(a, b)).toBeGreaterThan(0);
  });

  it('an Important-dimension tier outranks any Supporting-only difference, once Primary ties', () => {
    const a = profile({ evidenceQuality: 'WEAK', contactability: 'STRONG', currentActivity: 'STRONG' });
    const b = profile({ evidenceQuality: 'MODERATE' });
    expect(compareRankingProfiles(a, b)).toBeGreaterThan(0);
  });

  it('is deterministic — identical profiles compare equal', () => {
    const a = profile({ needOpportunity: 'STRONG', serviceFit: 'MODERATE' });
    const b = profile({ needOpportunity: 'STRONG', serviceFit: 'MODERATE' });
    expect(compareRankingProfiles(a, b)).toBe(0);
  });

  it('never produces or relies on a numeric composite — every dimension is a tier string, not a number', () => {
    const a = profile({ needOpportunity: 'STRONG' });
    const b = profile({ needOpportunity: 'WEAK' });
    expect(Object.values(a).every((value) => typeof value === 'string')).toBe(true);
    expect(compareRankingProfiles(a, b)).toBeLessThan(0);
  });
});

describe('rankByUniversalProfile', () => {
  it('orders candidates by dimension tier, never eliminating one', () => {
    const candidates = [
      { id: 'c1', ranking: profile({ needOpportunity: 'WEAK' }) },
      { id: 'c2', ranking: profile({ needOpportunity: 'STRONG' }) },
      { id: 'c3', ranking: profile({ needOpportunity: 'MODERATE' }) },
    ];

    const ranked = rankByUniversalProfile(candidates);

    expect(ranked.map((c) => c.id)).toEqual(['c2', 'c3', 'c1']);
    expect(ranked).toHaveLength(candidates.length);
  });

  it('breaks a total tie by id, ascending — stable and deterministic', () => {
    const candidates = [
      { id: 'b', ranking: unknownRankingProfile() },
      { id: 'a', ranking: unknownRankingProfile() },
    ];

    const ranked = rankByUniversalProfile(candidates);

    expect(ranked.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('identical inputs produce identical ordering across repeated calls', () => {
    const candidates = [
      { id: 'c1', ranking: profile({ serviceFit: 'MODERATE' }) },
      { id: 'c2', ranking: profile({ serviceFit: 'STRONG' }) },
      { id: 'c3', ranking: profile({ serviceFit: 'WEAK' }) },
    ];

    const first = rankByUniversalProfile(candidates);
    const second = rankByUniversalProfile(candidates);

    expect(second.map((c) => c.id)).toEqual(first.map((c) => c.id));
  });

  it('a fully-UNKNOWN candidate (no evidence at all) still appears, ranked last among evidenced peers', () => {
    const candidates = [
      { id: 'evidenced', ranking: profile({ needOpportunity: 'WEAK' }) },
      { id: 'no-evidence', ranking: unknownRankingProfile() },
    ];

    const ranked = rankByUniversalProfile(candidates);

    expect(ranked.map((c) => c.id)).toEqual(['evidenced', 'no-evidence']);
    expect(ranked).toHaveLength(2);
  });
});
