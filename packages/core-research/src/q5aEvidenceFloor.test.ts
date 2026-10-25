import { describe, expect, it } from 'vitest';

import { evaluateQ5AFloor, passesOverlapCheck } from './q5aEvidenceFloor';
import type { StoredResearchSignal } from './types';

// Phase I — Q5-A evidence-integrity floor
// (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION.md §2; engineering
// spec §E.3 conditions 1-4). See ./signalAuthorization.test.ts for the
// end-to-end gate (floor + classification + authorization combined).

function signal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'companySummary',
    kind: 'WEBSITE',
    classification: 'OBSERVED',
    signal: 'Acme serves small businesses in Mumbai',
    confidence: 90,
    basis: null,
    observedAt: new Date('2026-06-01T00:00:00.000Z'),
    supersededAt: null,
    sources: [
      {
        id: 'source_1',
        sourceUrl: 'https://acme.test/about',
        sourceQuote: 'Acme serves small businesses in Mumbai',
        sourceLabel: 'homepage',
      },
    ],
    ...overrides,
  };
}

describe('passesOverlapCheck — Q5-A deterministic overlap heuristic', () => {
  it('a faithful restatement of its own quote passes', () => {
    expect(passesOverlapCheck('Acme serves small businesses', ['Acme serves small businesses in Mumbai'])).toBe(
      true,
    );
  });

  it('the exact repository-documented overreach pattern fails: "primarily targets SMBs" is not covered by "we serve small businesses"', () => {
    expect(passesOverlapCheck('Acme primarily targets SMBs', ['We serve small businesses'])).toBe(false);
  });

  it('a value with no significant tokens trivially passes — nothing to have overreached', () => {
    expect(passesOverlapCheck('', ['anything'])).toBe(true);
  });

  it('checks against the union of multiple cited quotes, not only the first', () => {
    expect(passesOverlapCheck('Acme builds robotics for warehouses', ['Acme builds robotics', 'for warehouses'])).toBe(
      true,
    );
  });

  it('is case/whitespace-insensitive via the same normalisation provenance.ts uses, but never treats absent words as present', () => {
    expect(passesOverlapCheck('ACME   serves   small businesses', ['acme serves small businesses'])).toBe(true);
    expect(passesOverlapCheck('Acme serves enterprise clients', ['Acme serves small businesses'])).toBe(false);
  });
});

describe('evaluateQ5AFloor — §E.3 conditions 1-4', () => {
  it('passes a well-formed OBSERVED companySummary/businessModel row with verified quote, URL, and overlap', () => {
    expect(evaluateQ5AFloor(signal()).passes).toBe(true);
    expect(evaluateQ5AFloor(signal({ field: 'businessModel' })).passes).toBe(true);
  });

  it('4/5/6. a field outside {companySummary, businessModel} fails FIELD_NOT_IN_SCOPE, regardless of classification/evidence', () => {
    const result = evaluateQ5AFloor(signal({ field: 'websiteIssues' }));
    expect(result).toEqual({ passes: false, failureReason: 'FIELD_NOT_IN_SCOPE' });
  });

  it('7. INFERRED never qualifies, even with evidence attached', () => {
    const result = evaluateQ5AFloor(signal({ classification: 'INFERRED' }));
    expect(result).toEqual({ passes: false, failureReason: 'NOT_OBSERVED' });
  });

  it('UNKNOWN never qualifies', () => {
    const result = evaluateQ5AFloor(signal({ classification: 'UNKNOWN', signal: null }));
    expect(result.passes).toBe(false);
    expect(result.failureReason).toBe('NOT_OBSERVED');
  });

  it('8. an OBSERVED row with no evidence rows at all fails MISSING_EVIDENCE (schema-invariant violation, handled defensively)', () => {
    const result = evaluateQ5AFloor(signal({ sources: [] }));
    expect(result).toEqual({ passes: false, failureReason: 'MISSING_EVIDENCE' });
  });

  it('9. an evidence row with an empty quote fails MISSING_QUOTE', () => {
    const result = evaluateQ5AFloor(
      signal({ sources: [{ id: 's1', sourceUrl: 'https://acme.test', sourceQuote: '   ', sourceLabel: 'homepage' }] }),
    );
    expect(result).toEqual({ passes: false, failureReason: 'MISSING_QUOTE' });
  });

  it('10. an evidence row with an empty source URL fails MISSING_SOURCE_URL', () => {
    const result = evaluateQ5AFloor(
      signal({ sources: [{ id: 's1', sourceUrl: '  ', sourceQuote: 'Acme serves small businesses', sourceLabel: 'homepage' }] }),
    );
    expect(result).toEqual({ passes: false, failureReason: 'MISSING_SOURCE_URL' });
  });

  it('11. a failed overlap check fails OVERLAP_CHECK_FAILED', () => {
    const result = evaluateQ5AFloor(
      signal({
        signal: 'Acme primarily targets SMBs',
        sources: [{ id: 's1', sourceUrl: 'https://acme.test', sourceQuote: 'We serve small businesses', sourceLabel: 'homepage' }],
      }),
    );
    expect(result).toEqual({ passes: false, failureReason: 'OVERLAP_CHECK_FAILED' });
  });

  it('a null signal text (should not occur for OBSERVED, handled defensively) fails OVERLAP_CHECK_FAILED rather than throwing', () => {
    const result = evaluateQ5AFloor(signal({ signal: null }));
    expect(result).toEqual({ passes: false, failureReason: 'OVERLAP_CHECK_FAILED' });
  });
});
