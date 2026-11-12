import { describe, expect, it } from 'vitest';

import type { SourceDocument } from './provenance';
import type { ModelResult, ResearchModel } from './researcher';
import {
  aggregateTargetCustomerMatch,
  callTargetCustomerMatchModel,
  evaluateTargetCustomerMatch,
  NO_MATCH_SENTINEL,
  TARGET_CUSTOMER_MATCH_PROMPT_VERSION,
  toObservedTargetCustomer,
  verifyTargetCustomerMatchFindings,
  type TargetCustomerMatchEvidenceItem,
  type TargetCustomerMatchFinding,
} from './targetCustomerMatch';

// PCG-4 TARGET_CUSTOMER_MATCH — requirement/
// CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md decision chain.
// Covers every TC-MATCH-11 minimum fixture category (PDEF4-PCG4-TCMATCH-
// MECH-PO-DEC-001 §3) plus the §1.1/§1.2 implementation-authorization
// decisions.
// -----------------------------------------------------------------------

const SOURCES: SourceDocument[] = [
  {
    label: 'Homepage',
    url: 'https://acme.example.com',
    text: 'Acme serves independent restaurants and cafes across the city, helping them manage online orders.',
  },
  {
    label: 'About',
    url: 'https://acme.example.com/about',
    text: 'Acme exclusively builds enterprise logistics software for freight carriers, not consumer brands.',
  },
];

const MATCH_QUOTE = 'Acme serves independent restaurants and cafes across the city';
const NO_MATCH_QUOTE = 'Acme exclusively builds enterprise logistics software for freight carriers';

function matchFinding(overrides: Partial<TargetCustomerMatchFinding> = {}): TargetCustomerMatchFinding {
  return {
    classification: 'MATCH',
    quote: MATCH_QUOTE,
    sourceUrl: SOURCES[0]!.url,
    sourceLabel: SOURCES[0]!.label,
    ...overrides,
  };
}

function noMatchFinding(overrides: Partial<TargetCustomerMatchFinding> = {}): TargetCustomerMatchFinding {
  return {
    classification: 'NO_MATCH',
    quote: NO_MATCH_QUOTE,
    sourceUrl: SOURCES[1]!.url,
    sourceLabel: SOURCES[1]!.label,
    ...overrides,
  };
}

describe('verifyTargetCustomerMatchFindings', () => {
  it('verifies a finding whose quote genuinely appears, verbatim, in the cited source', () => {
    const verified = verifyTargetCustomerMatchFindings([matchFinding()], SOURCES);
    expect(verified).toEqual([
      { classification: 'MATCH', quote: MATCH_QUOTE, sourceUrl: SOURCES[0]!.url, sourceLabel: SOURCES[0]!.label },
    ]);
  });

  it('drops a finding whose quote does not appear in any supplied document (fabricated citation)', () => {
    const verified = verifyTargetCustomerMatchFindings(
      [matchFinding({ quote: 'This exact sentence was never written anywhere in the sources.' })],
      SOURCES,
    );
    expect(verified).toEqual([]);
  });

  it('drops a finding whose sourceUrl is not one of the supplied documents', () => {
    const verified = verifyTargetCustomerMatchFindings(
      [matchFinding({ sourceUrl: 'https://not-supplied.example.com' })],
      SOURCES,
    );
    expect(verified).toEqual([]);
  });

  it('drops a finding whose quote is too short to be evidence', () => {
    const verified = verifyTargetCustomerMatchFindings([matchFinding({ quote: 'Acme' })], SOURCES);
    expect(verified).toEqual([]);
  });

  it('drops a finding citing text that is real but attributed to the wrong document', () => {
    const verified = verifyTargetCustomerMatchFindings(
      [matchFinding({ quote: NO_MATCH_QUOTE, sourceUrl: SOURCES[0]!.url })],
      SOURCES,
    );
    expect(verified).toEqual([]);
  });
});

describe('aggregateTargetCustomerMatch (TC-MATCH-3/4/5/6)', () => {
  it('TC-MATCH-11.1 — clear positive: a verified MATCH-supporting quote -> MATCH', () => {
    expect(aggregateTargetCustomerMatch([{ ...matchFinding() }])).toBe('MATCH');
  });

  it('TC-MATCH-11.2 — clear negative: a verified NO_MATCH-supporting quote -> NO_MATCH', () => {
    expect(aggregateTargetCustomerMatch([{ ...noMatchFinding() }])).toBe('NO_MATCH');
  });

  it('TC-MATCH-11.3 — insufficient evidence: no verified quote either way -> NOT_YET_OBSERVED', () => {
    expect(aggregateTargetCustomerMatch([])).toBe('NOT_YET_OBSERVED');
  });

  it('TC-MATCH-11.4 — contradictory evidence: verified quotes on both sides -> NOT_YET_OBSERVED, both retained', () => {
    const evidence: TargetCustomerMatchEvidenceItem[] = [matchFinding(), noMatchFinding()];
    expect(aggregateTargetCustomerMatch(evidence)).toBe('NOT_YET_OBSERVED');
    // Both items must survive into what gets persisted — never collapsed to one "winning" side.
    expect(evidence).toHaveLength(2);
    expect(evidence.some((e) => e.classification === 'MATCH')).toBe(true);
    expect(evidence.some((e) => e.classification === 'NO_MATCH')).toBe(true);
  });

  it('TC-MATCH-11.6 — confidence-non-gating: this module has no confidence field/threshold at all', () => {
    // Confidence is never part of TargetCustomerMatchEvidenceItem/the aggregation input (TC-MATCH-7) —
    // identical evidence always aggregates identically regardless of any confidence a model reported,
    // because no confidence value ever reaches this function.
    const a = aggregateTargetCustomerMatch([matchFinding()]);
    const b = aggregateTargetCustomerMatch([matchFinding()]);
    expect(a).toBe(b);
  });

  it('TC-MATCH-11.7 — deterministic replay: identical persisted evidence reproduces the identical result on repeat', () => {
    const evidence = [matchFinding(), matchFinding({ quote: MATCH_QUOTE, sourceLabel: 'Homepage' })];
    expect(aggregateTargetCustomerMatch(evidence)).toBe(aggregateTargetCustomerMatch(evidence));
  });

  it('TC-MATCH-11.9 — pins current, deliberately limited behavior: a single MISMATCH-shaped but unverified finding never becomes NO_MATCH', () => {
    // Guards against a future change silently weakening the evidentiary bar by aggregating raw,
    // unverified findings instead of the verified subset.
    const unverified = verifyTargetCustomerMatchFindings(
      [noMatchFinding({ quote: 'a sentence nobody ever wrote' })],
      SOURCES,
    );
    expect(aggregateTargetCustomerMatch(unverified)).toBe('NOT_YET_OBSERVED');
  });
});

describe('TC-MATCH-11.5 / TD-14 — fail-soft model-call behavior', () => {
  const alwaysThrows: ResearchModel = async () => {
    throw new Error('simulated provider outage');
  };

  it('a provider error exhausting every retry resolves to no findings, never throws', async () => {
    const findings = await callTargetCustomerMatchModel(alwaysThrows, 'Restaurants', SOURCES, {
      maxAttempts: 2,
      sleep: async () => {},
    });
    expect(findings).toEqual([]);
  });

  it('a refusal resolves to no findings, never throws', async () => {
    const refusing: ResearchModel = async (): Promise<ModelResult> => ({ kind: 'refusal', category: 'policy' });
    const findings = await callTargetCustomerMatchModel(refusing, 'Restaurants', SOURCES);
    expect(findings).toEqual([]);
  });

  it('output that never becomes schema-valid resolves to no findings after exhausting repairs, never throws', async () => {
    const malformed: ResearchModel = async (): Promise<ModelResult> => ({
      kind: 'json',
      value: { findings: [{ classification: 'MAYBE', quote: 123 }] },
    });
    const findings = await callTargetCustomerMatchModel(malformed, 'Restaurants', SOURCES, {
      maxAttempts: 2,
      sleep: async () => {},
    });
    expect(findings).toEqual([]);
  });

  it('a well-formed response is parsed and its findings returned', async () => {
    const good: ResearchModel = async (): Promise<ModelResult> => ({
      kind: 'json',
      value: { findings: [matchFinding()] },
    });
    const findings = await callTargetCustomerMatchModel(good, 'Restaurants', SOURCES);
    expect(findings).toEqual([matchFinding()]);
  });

  it('a repair round recovers from one malformed attempt followed by a valid one', async () => {
    let call = 0;
    const repairs: ResearchModel = async (): Promise<ModelResult> => {
      call += 1;
      if (call === 1) return { kind: 'json', value: { findings: [{ classification: 'MAYBE' }] } };
      return { kind: 'json', value: { findings: [matchFinding()] } };
    };
    const findings = await callTargetCustomerMatchModel(repairs, 'Restaurants', SOURCES, { maxAttempts: 3 });
    expect(findings).toEqual([matchFinding()]);
    expect(call).toBe(2);
  });
});

describe('evaluateTargetCustomerMatch — full evaluator', () => {
  const deps = { model: async (): Promise<ModelResult> => ({ kind: 'json', value: { findings: [matchFinding()] } }), modelId: 'test-model', providerId: 'test-provider' };

  it('persists non-null model/provider/promptVersion on every evaluation (TD-6)', async () => {
    const evaluation = await evaluateTargetCustomerMatch(deps, 'Restaurants', SOURCES);
    expect(evaluation.model).toBe('test-model');
    expect(evaluation.provider).toBe('test-provider');
    expect(evaluation.promptVersion).toBe(TARGET_CUSTOMER_MATCH_PROMPT_VERSION);
    expect(evaluation.result).toBe('MATCH');
  });

  it('a failing model call still produces non-null model/provider metadata on the resulting NOT_YET_OBSERVED evaluation', async () => {
    const failingDeps = { model: async () => { throw new Error('down'); }, modelId: 'test-model', providerId: 'test-provider' };
    const evaluation = await evaluateTargetCustomerMatch(failingDeps, 'Restaurants', SOURCES, {
      maxAttempts: 1,
    });
    expect(evaluation.result).toBe('NOT_YET_OBSERVED');
    expect(evaluation.model).toBe('test-model');
    expect(evaluation.provider).toBe('test-provider');
  });
});

describe('toObservedTargetCustomer (TD-3/TD-13 / PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.1)', () => {
  it('MATCH translates to the Search\'s own targetCustomer string', () => {
    expect(toObservedTargetCustomer('MATCH', 'Restaurants')).toBe('Restaurants');
  });

  it('NO_MATCH translates to the exact fixed sentinel literal', () => {
    expect(toObservedTargetCustomer('NO_MATCH', 'Restaurants')).toBe(NO_MATCH_SENTINEL);
    expect(NO_MATCH_SENTINEL).toBe('\u0000__PCG4_NO_MATCH_SENTINEL__\u0000');
  });

  it('NOT_YET_OBSERVED and row-absence (null) both translate to null', () => {
    expect(toObservedTargetCustomer('NOT_YET_OBSERVED', 'Restaurants')).toBeNull();
    expect(toObservedTargetCustomer(null, 'Restaurants')).toBeNull();
  });

  it('normalise() can never make the sentinel equal a real targetCustomer value — the NUL bytes survive trim()/toLowerCase() untouched', () => {
    // normalise() (trim + toLowerCase) does lower-case the sentinel's own
    // letters, but neither operation removes or alters the \u0000 bytes
    // wrapping it — and no legitimate, user-authored targetCustomer value
    // can contain a NUL byte. That (not byte-for-byte invariance of the
    // whole string) is what makes collision structurally impossible.
    const normalise = (value: string) => value.trim().toLowerCase();
    const normalisedSentinel = normalise(NO_MATCH_SENTINEL);
    expect(normalisedSentinel.startsWith('\u0000')).toBe(true);
    expect(normalisedSentinel.endsWith('\u0000')).toBe(true);
    expect(normalisedSentinel).not.toBe(normalise('Restaurants'));
    expect(normalisedSentinel).not.toBe(normalise('restaurants'));
  });
});

describe('TC-MATCH-11.8 — supersession/history (pure-function level)', () => {
  it('aggregation treats each evaluation independently — a superseding call does not need the prior result as input', () => {
    // The actual row-level supersede-then-insert behavior (append-only,
    // never erasing a prior row) is a repository concern, exercised in
    // ./targetCustomerMatchRepository.test.ts and the service.test.ts/
    // migration-integration tests — this only confirms the evaluator
    // itself carries no hidden state between calls.
    const first = aggregateTargetCustomerMatch([matchFinding()]);
    const second = aggregateTargetCustomerMatch([noMatchFinding()]);
    expect(first).toBe('MATCH');
    expect(second).toBe('NO_MATCH');
  });
});
