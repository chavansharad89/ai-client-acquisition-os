import { describe, expect, it } from 'vitest';

import {
  aggregateCategoryFit,
  isF1CompleteSegmentDetermination,
  parseTargetSegments,
  toSegmentDeterminations,
  verifyCategoryPlausibility,
} from './categoryPlausibility';
import { leadResearchSchema, type CategorySegmentResult, type LeadResearch } from './schema';

// UNIT tests (pure). D2 (deterministic parsing/aggregation), D3 (evidence
// sufficiency), D9 §5 (parsing/aggregation is code, not provider
// interpretation).

describe('parseTargetSegments', () => {
  it('splits on ";" into distinct segments, keeping "," inside one segment', () => {
    expect(
      parseTargetSegments(
        'Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators',
      ),
    ).toEqual(['Restaurants, Cafes', 'Boutique Retailers & E-commerce Brands', 'Hotels, Resorts & Tour Operators']);
  });

  it('returns a single segment when there is no ";"', () => {
    expect(parseTargetSegments('Small business owners')).toEqual(['Small business owners']);
  });

  it('trims whitespace around each segment', () => {
    expect(parseTargetSegments('  Restaurants ;  Cafes  ')).toEqual(['Restaurants', 'Cafes']);
  });

  it('drops empty segments from a trailing delimiter (E9: malformed input, not fabricated)', () => {
    expect(parseTargetSegments('Restaurants;')).toEqual(['Restaurants']);
    expect(parseTargetSegments(';;')).toEqual([]);
  });

  it('returns [] for blank/whitespace-only input (E9)', () => {
    expect(parseTargetSegments('')).toEqual([]);
    expect(parseTargetSegments('   ')).toEqual([]);
  });

  it('is deterministic — repeated calls with the same input produce the same result', () => {
    const input = 'Restaurants, Cafes; Hotels';
    expect(parseTargetSegments(input)).toEqual(parseTargetSegments(input));
  });
});

describe('aggregateCategoryFit', () => {
  it('MATCH when any segment matches, regardless of others', () => {
    expect(aggregateCategoryFit(['MISMATCH', 'MATCH', 'UNKNOWN'])).toBe('MATCH');
    expect(aggregateCategoryFit(['MATCH'])).toBe('MATCH');
  });

  it('MISMATCH only when every segment mismatches', () => {
    expect(aggregateCategoryFit(['MISMATCH', 'MISMATCH'])).toBe('MISMATCH');
  });

  it('UNKNOWN when a mix of MISMATCH and UNKNOWN has no MATCH (D3: never a default MISMATCH)', () => {
    expect(aggregateCategoryFit(['MISMATCH', 'UNKNOWN'])).toBe('UNKNOWN');
  });

  it('UNKNOWN for an all-UNKNOWN input', () => {
    expect(aggregateCategoryFit(['UNKNOWN', 'UNKNOWN'])).toBe('UNKNOWN');
  });

  it('UNKNOWN for an empty list (no segments to evaluate)', () => {
    expect(aggregateCategoryFit([])).toBe('UNKNOWN');
  });
});

const SOURCE = { label: 'Homepage', url: 'https://acme.test/about', text: 'We proudly serve restaurants and cafes across the region.' };
const QUOTE = 'We proudly serve restaurants and cafes';

function matchResult(overrides: Partial<CategorySegmentResult> = {}): CategorySegmentResult {
  return {
    fit: 'MATCH',
    rationale: 'the homepage says so',
    evidence: [{ quote: QUOTE, sourceUrl: SOURCE.url, sourceLabel: SOURCE.label }],
    confidence: 90,
    ...overrides,
  };
}

function withCategoryPlausibility(results: CategorySegmentResult[]): LeadResearch {
  return leadResearchSchema.parse({
    companySummary: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    categoryPlausibility: results,
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
    confidence: 50,
    gaps: [],
  });
}

describe('verifyCategoryPlausibility', () => {
  it('returns no issues when targetSegments is empty, regardless of categoryPlausibility content', () => {
    const research = withCategoryPlausibility([matchResult()]);
    expect(verifyCategoryPlausibility(research, [SOURCE], [])).toEqual([]);
  });

  it('returns no issues for a completely empty categoryPlausibility ("not evaluated", not a failure)', () => {
    const research = withCategoryPlausibility([]);
    expect(verifyCategoryPlausibility(research, [SOURCE], ['Restaurants'])).toEqual([]);
  });

  it('flags a non-empty response of the wrong length as a repairable mismatch', () => {
    const research = withCategoryPlausibility([matchResult()]);
    const issues = verifyCategoryPlausibility(research, [SOURCE], ['Restaurants', 'Cafes']);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.path).toBe('categoryPlausibility');
    expect(issues[0]!.message).toContain('expected exactly 2 entries');
  });

  it('passes when count matches and evidence is genuinely quoted from a supplied source', () => {
    const research = withCategoryPlausibility([matchResult()]);
    expect(verifyCategoryPlausibility(research, [SOURCE], ['Restaurants'])).toEqual([]);
  });

  it('flags a fabricated quote not present in any supplied source document', () => {
    const research = withCategoryPlausibility([
      matchResult({ evidence: [{ quote: 'this text never appears anywhere', sourceUrl: SOURCE.url, sourceLabel: SOURCE.label }] }),
    ]);
    const issues = verifyCategoryPlausibility(research, [SOURCE], ['Restaurants']);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.path).toBe('categoryPlausibility.0.evidence.0.quote');
  });

  it('flags a sourceUrl that was not one of the supplied documents', () => {
    const research = withCategoryPlausibility([
      matchResult({ evidence: [{ quote: QUOTE, sourceUrl: 'https://not-supplied.example', sourceLabel: 'x' }] }),
    ]);
    const issues = verifyCategoryPlausibility(research, [SOURCE], ['Restaurants']);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.path).toBe('categoryPlausibility.0.evidence.0.sourceUrl');
  });

  it('never inspects an UNKNOWN entry\'s evidence (schema already forces it empty)', () => {
    const research = withCategoryPlausibility([
      { fit: 'UNKNOWN', rationale: 'no page mentions who they serve', evidence: [], confidence: 0 },
    ]);
    expect(verifyCategoryPlausibility(research, [SOURCE], ['Restaurants'])).toEqual([]);
  });
});

const EVIDENCE = [{ quote: QUOTE, sourceUrl: SOURCE.url, sourceLabel: SOURCE.label }];

describe('toSegmentDeterminations (F-1 §7/§9/§10/§13)', () => {
  it('zips segments with verdicts and code-assigns basis/classification for MATCH/MISMATCH', () => {
    const results = toSegmentDeterminations(
      ['Restaurants', 'Cafes'],
      [matchResult(), { fit: 'MISMATCH', rationale: 'they only serve hotels', evidence: EVIDENCE, confidence: 40 }],
    );

    expect(results).toEqual([
      { segment: 'Restaurants', fit: 'MATCH', rationale: 'the homepage says so', evidence: EVIDENCE, confidence: 90, basis: 'CITED_SOURCE_EVIDENCE', classification: 'OBSERVED' },
      { segment: 'Cafes', fit: 'MISMATCH', rationale: 'they only serve hotels', evidence: EVIDENCE, confidence: 40, basis: 'CITED_SOURCE_EVIDENCE', classification: 'OBSERVED' },
    ]);
  });

  it('records a model-returned UNKNOWN as MODEL_REPORTED_INSUFFICIENT_EVIDENCE, keeping its rationale', () => {
    const results = toSegmentDeterminations(
      ['Restaurants'],
      [{ fit: 'UNKNOWN', rationale: 'no page names a customer type', evidence: [], confidence: 0 }],
    );
    expect(results).toEqual([
      { segment: 'Restaurants', fit: 'UNKNOWN', rationale: 'no page names a customer type', evidence: [], confidence: 0, basis: 'MODEL_REPORTED_INSUFFICIENT_EVIDENCE', classification: 'UNKNOWN' },
    ]);
  });

  it('fills an empty model response as NO_MODEL_VERDICT: null rationale, no evidence, confidence 0', () => {
    const results = toSegmentDeterminations(['Restaurants', 'Cafes'], []);
    for (const result of results) {
      expect(result).toMatchObject({ fit: 'UNKNOWN', rationale: null, evidence: [], confidence: 0, basis: 'NO_MODEL_VERDICT', classification: 'UNKNOWN' });
    }
  });

  it('defaults a missing per-position result to NO_MODEL_VERDICT rather than throwing', () => {
    const results = toSegmentDeterminations(['Restaurants', 'Cafes'], [matchResult()]);
    expect(results[1]).toEqual({ segment: 'Cafes', fit: 'UNKNOWN', rationale: null, evidence: [], confidence: 0, basis: 'NO_MODEL_VERDICT', classification: 'UNKNOWN' });
  });

  it('is defensive against a `categoryPlausibility` value of undefined (a fixture that bypassed schema parsing)', () => {
    const results = toSegmentDeterminations(['Restaurants'], undefined);
    expect(results).toEqual([{ segment: 'Restaurants', fit: 'UNKNOWN', rationale: null, evidence: [], confidence: 0, basis: 'NO_MODEL_VERDICT', classification: 'UNKNOWN' }]);
  });

  it('never assigns INFERRED or any value outside the feature-local domain', () => {
    const results = toSegmentDeterminations(
      ['A', 'B', 'C'],
      [matchResult(), { fit: 'UNKNOWN', rationale: 'nothing said', evidence: [], confidence: 0 }],
    );
    expect(results.map((r) => r.classification)).toEqual(['OBSERVED', 'UNKNOWN', 'UNKNOWN']);
  });

  it('every produced result passes the stored-row completeness/consistency check (§14 rule 5)', () => {
    const results = toSegmentDeterminations(
      ['A', 'B', 'C'],
      [matchResult(), { fit: 'UNKNOWN', rationale: 'nothing said', evidence: [], confidence: 0 }],
    );
    expect(results.every(isF1CompleteSegmentDetermination)).toBe(true);
  });
});

describe('categorySegmentSchema (F-1 §14 rules 2-4)', () => {
  const parse = (entry: Record<string, unknown>) =>
    leadResearchSchema.shape.categoryPlausibility.safeParse([entry]);

  it('accepts MATCH/MISMATCH with confidence 1-100 and a model-returned UNKNOWN with rationale and confidence 0', () => {
    expect(parse({ ...matchResult(), confidence: 1 }).success).toBe(true);
    expect(parse({ ...matchResult(), fit: 'MISMATCH', confidence: 100 }).success).toBe(true);
    expect(parse({ fit: 'UNKNOWN', rationale: 'no customer types named', evidence: [], confidence: 0 }).success).toBe(true);
  });

  it('rejects MATCH/MISMATCH with confidence 0, over 100, non-integer, or missing', () => {
    expect(parse({ ...matchResult(), confidence: 0 }).success).toBe(false);
    expect(parse({ ...matchResult(), confidence: 101 }).success).toBe(false);
    expect(parse({ ...matchResult(), confidence: 50.5 }).success).toBe(false);
    const { confidence: _omit, ...withoutConfidence } = matchResult();
    expect(parse(withoutConfidence).success).toBe(false);
  });

  it('rejects MATCH/MISMATCH without rationale or evidence', () => {
    expect(parse({ ...matchResult(), rationale: null }).success).toBe(false);
    expect(parse({ ...matchResult(), evidence: [] }).success).toBe(false);
  });

  it('rejects a model-returned UNKNOWN with null rationale, non-zero confidence, or evidence', () => {
    expect(parse({ fit: 'UNKNOWN', rationale: null, evidence: [], confidence: 0 }).success).toBe(false);
    expect(parse({ fit: 'UNKNOWN', rationale: 'x', evidence: [], confidence: 5 }).success).toBe(false);
    expect(parse({ fit: 'UNKNOWN', rationale: 'x', evidence: EVIDENCE, confidence: 0 }).success).toBe(false);
  });

  it('does not accept basis or classification from the model (code assigns them)', () => {
    const parsed = parse({ ...matchResult(), basis: 'NO_MODEL_VERDICT', classification: 'INFERRED' });
    expect(parsed.success).toBe(true);
    expect(parsed.data![0]).not.toHaveProperty('basis');
    expect(parsed.data![0]).not.toHaveProperty('classification');
  });
});

describe('isF1CompleteSegmentDetermination (F-1 §11.5, §14 rule 5)', () => {
  const complete = {
    segment: 'Restaurants',
    fit: 'MATCH' as const,
    rationale: 'the homepage says so',
    evidence: EVIDENCE,
    confidence: 90,
    basis: 'CITED_SOURCE_EVIDENCE' as const,
    classification: 'OBSERVED' as const,
  };

  it('treats a legacy (pre-F-1) row missing any F-1 field as not complete', () => {
    const { confidence: _c, basis: _b, classification: _k, ...legacy } = complete;
    expect(isF1CompleteSegmentDetermination(legacy)).toBe(false);
    const { basis: _basisOnly, ...missingBasis } = complete;
    expect(isF1CompleteSegmentDetermination(missingBasis)).toBe(false);
  });

  it('rejects rows whose classification/basis/confidence are inconsistent with the outcome', () => {
    expect(isF1CompleteSegmentDetermination(complete)).toBe(true);
    expect(isF1CompleteSegmentDetermination({ ...complete, classification: 'UNKNOWN' })).toBe(false);
    expect(isF1CompleteSegmentDetermination({ ...complete, basis: 'NO_MODEL_VERDICT' })).toBe(false);
    expect(isF1CompleteSegmentDetermination({ ...complete, confidence: 0 })).toBe(false);
    expect(
      isF1CompleteSegmentDetermination({ ...complete, classification: 'INFERRED' as unknown as 'OBSERVED' }),
    ).toBe(false);
    expect(
      isF1CompleteSegmentDetermination({
        ...complete,
        fit: 'UNKNOWN',
        evidence: [],
        confidence: 0,
        basis: 'NO_MODEL_VERDICT',
        classification: 'UNKNOWN',
        rationale: 'fabricated reasoning',
      }),
    ).toBe(false);
  });
});
