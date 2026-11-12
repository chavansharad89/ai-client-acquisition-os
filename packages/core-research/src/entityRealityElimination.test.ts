import { describe, expect, it } from 'vitest';

import {
  createWebDevelopmentSignalCatalogue,
  detectPlacesEntityReality,
  type DeterministicSignal,
} from './deterministicSignals';
import { eliminateDeterministically } from './entityRealityElimination';

const CANDIDATE = { id: 'prospect_1' };

function entitySignal(
  overrides: Partial<DeterministicSignal['signal']> = {},
  establishesNonReality?: boolean,
): DeterministicSignal {
  return {
    dimension: 'ENTITY_REALITY',
    field: 'test.entityReality',
    ...(establishesNonReality !== undefined ? { establishesNonReality } : {}),
    signal: {
      kind: 'WEBSITE',
      signal: 'placeholder entity-reality signal',
      confidence: 100,
      observedAt: new Date('2026-10-13T00:00:00.000Z'),
      ...overrides,
    },
  };
}

describe('eliminateDeterministically (Phase 2 Entity Reality boundary)', () => {
  it('a clearly eligible candidate with no signals remains eligible', () => {
    expect(eliminateDeterministically(CANDIDATE, [])).toEqual({ eligible: true });
  });

  it('missing evidence (no signals at all) remains eligible, never eliminated for lack of evidence', () => {
    const result = eliminateDeterministically(CANDIDATE, []);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('a weak/low-confidence ENTITY_REALITY signal does not eliminate — ambiguity is preserved, not treated as fake', () => {
    const weak = entitySignal({ confidence: 10, signal: 'weak, inconclusive entity-reality evidence' });
    expect(eliminateDeterministically(CANDIDATE, [weak])).toEqual({ eligible: true });
  });

  it('conflicting ENTITY_REALITY signals do not eliminate — conflict is shown, not auto-resolved to elimination', () => {
    const a = entitySignal({ signal: 'evidence suggesting real' });
    const b = entitySignal({ signal: 'evidence suggesting not real' });
    expect(eliminateDeterministically(CANDIDATE, [a, b])).toEqual({ eligible: true });
  });

  it(
    'an ENTITY_REALITY-dimension signal that does NOT carry establishesNonReality does not eliminate — ' +
      'dimension alone is deliberately insufficient (D15/O1)',
    () => {
      const present = entitySignal();
      expect(eliminateDeterministically(CANDIDATE, [present])).toEqual({ eligible: true });
    },
  );

  it('absent-SSL (NEED_OPPORTUNITY_GAP dimension) never causes Entity Reality elimination', () => {
    const catalogue = createWebDevelopmentSignalCatalogue();
    const [absentSsl] = catalogue.evaluate({
      documents: [{ label: 'homepage', url: 'http://insecure.example.com', text: 'hello' }],
      fetchedAt: new Date('2026-10-13T00:00:00.000Z'),
      extractionMethod: 'HTTP_HOMEPAGE_EXTRACTION',
    });
    expect(absentSsl!.dimension).toBe('NEED_OPPORTUNITY_GAP'); // sanity: confirms what is actually being fed in below
    expect(eliminateDeterministically(CANDIDATE, [absentSsl!])).toEqual({ eligible: true });
  });

  it('a candidate with no eliminating evidence carries no reason', () => {
    const result = eliminateDeterministically(CANDIDATE, [entitySignal()]);
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  // ---- Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001) ----

  describe('Google Places Entity-Reality producer (Phase 8)', () => {
    const NOW = new Date('2026-10-17T00:00:00.000Z');

    it('CLOSED_PERMANENTLY eliminates (D3-C1)', () => {
      const signal = detectPlacesEntityReality('CLOSED_PERMANENTLY', NOW);
      const result = eliminateDeterministically(CANDIDATE, [signal!]);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('CLOSED_PERMANENTLY');
    });

    it('CLOSED_TEMPORARILY does NOT eliminate, even though it shares the ENTITY_REALITY dimension (D3-C2/D15-O1)', () => {
      const signal = detectPlacesEntityReality('CLOSED_TEMPORARILY', NOW);
      expect(signal!.dimension).toBe('ENTITY_REALITY'); // sanity: same dimension as the eliminating case above
      expect(signal!.establishesNonReality).not.toBe(true);
      expect(eliminateDeterministically(CANDIDATE, [signal!])).toEqual({ eligible: true });
    });

    it('a missing/no-result businessStatus produces no signal, so it cannot eliminate (D3-C3/D14)', () => {
      expect(detectPlacesEntityReality(null, NOW)).toBeNull();
      expect(eliminateDeterministically(CANDIDATE, [])).toEqual({ eligible: true });
    });

    it('OPERATIONAL produces no signal (not a reason to eliminate or to flag anything)', () => {
      expect(detectPlacesEntityReality('OPERATIONAL', NOW)).toBeNull();
    });

    it('CLOSED_PERMANENTLY alongside a CLOSED_TEMPORARILY-shaped signal still eliminates — one qualifying signal is enough', () => {
      const permanent = detectPlacesEntityReality('CLOSED_PERMANENTLY', NOW)!;
      const temporary = detectPlacesEntityReality('CLOSED_TEMPORARILY', NOW)!;
      expect(eliminateDeterministically(CANDIDATE, [temporary, permanent]).eligible).toBe(false);
    });
  });
});
