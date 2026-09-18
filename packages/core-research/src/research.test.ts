import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  backoffDelayMs,
  buildUserMessage,
  effectiveConfidence,
  leadResearchSchema,
  observationSchema,
  observedRatio,
  researchLead,
  ResearchProviderError,
  ResearchRefusedError,
  ResearchValidationError,
  storeResearch,
  SYSTEM_PROMPT,
  toProviderError,
  toResearchRows,
  zodToJsonSchema,
  AnthropicConfigError,
  createAnthropicResearchModel,
  abortableSleep,
  applyRepair,
  buildTargetedRepairMessage,
  Deadline,
  ResearchAbortedError,
  MAX_REPAIR_ISSUES,
  MIN_QUOTE_CHARS,
  needsSourceContext,
  planRepair,
  repairRoot,
  normaliseForMatch,
  verifyProvenance,
  type LeadResearch,
  type ModelResult,
  type ResearchInput,
  type ResearchRepository,
} from './index';

// The source documents these fixtures are allowed to quote from.
//
// Before provenance verification existed, `validResearch()` cited a quote
// that appeared in no document at all — the fixture was fabricating
// evidence exactly as a model would, and nothing noticed. Every OBSERVED
// claim below now quotes text that genuinely occurs in the document it
// names, which is the only way the fixture can be valid.
const HOMEPAGE = {
  label: 'homepage',
  url: 'https://acme.test/about',
  text: 'Acme sells warehouse robotics. We have shipped to 40 distribution centres.',
};
const CAREERS = {
  label: 'careers',
  url: 'https://acme.test/careers',
  text: 'Open roles: Content Marketer, Technical Writer, Content Designer. We are hiring three content roles this quarter.',
};

const observed = (value: string, source = HOMEPAGE, quote: string = value) => ({
  classification: 'OBSERVED' as const,
  value,
  evidence: [{ quote, sourceUrl: source.url, sourceLabel: source.label }],
  basis: null,
  confidence: 90,
});
const inferred = (value: string) => ({
  classification: 'INFERRED' as const,
  value,
  evidence: [],
  basis: 'their homepage lists enterprise logos',
  confidence: 60,
});
const unknown = () => ({
  classification: 'UNKNOWN' as const,
  value: null,
  evidence: [],
  basis: null,
  confidence: 0,
});

const validResearch = (): LeadResearch =>
  leadResearchSchema.parse({
    companySummary: observed('Acme sells warehouse robotics'),
    businessModel: inferred('Likely enterprise SaaS with services'),
    targetCustomers: unknown(),
    visibleProblems: [
      observed(
        'Hiring for three content roles at once',
        CAREERS,
        'We are hiring three content roles this quarter',
      ),
    ],
    growthOpportunities: [],
    aiOpportunities: [inferred('Content production could be systematised')],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: {
      service: 'AI content system',
      rationale: 'They are hiring for content',
      basedOn: ['Hiring for three content roles at once'],
    },
    confidence: 70,
    gaps: ['Headcount not stated anywhere'],
  });

const START = Date.parse('2026-05-01T00:00:00.000Z');

const input: ResearchInput = {
  companyName: 'Acme Robotics',
  websiteUrl: 'https://acme.test',
  industry: 'Logistics',
  location: 'Pune',
  sourceDocuments: [HOMEPAGE, CAREERS],
};

// ================================================= never invent facts ===

describe('the schema refuses unevidenced claims', () => {
  it('rejects OBSERVED with no evidence', () => {
    const result = observationSchema.safeParse({ ...observed('x'), evidence: [] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toMatch(/cannot cite it/i);
  });

  it('rejects OBSERVED with a null value', () => {
    expect(observationSchema.safeParse({ ...observed('x'), value: null }).success).toBe(false);
  });

  it('rejects evidence without a real source URL', () => {
    const bad = {
      ...observed('x'),
      evidence: [{ quote: 'x', sourceUrl: 'not-a-url', sourceLabel: 'homepage' }],
    };
    expect(observationSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects INFERRED that cites evidence — that would make it OBSERVED', () => {
    const bad = { ...inferred('x'), evidence: observed('x').evidence };
    const result = observationSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).toMatch(/classify it OBSERVED/);
  });

  it('rejects INFERRED with no stated basis', () => {
    expect(observationSchema.safeParse({ ...inferred('x'), basis: null }).success).toBe(false);
  });

  it('caps INFERRED confidence, so a guess never outranks a fact', () => {
    expect(observationSchema.safeParse({ ...inferred('x'), confidence: 95 }).success).toBe(false);
    expect(observationSchema.safeParse({ ...inferred('x'), confidence: 80 }).success).toBe(true);
  });

  it('forces UNKNOWN to be genuinely empty', () => {
    expect(observationSchema.safeParse({ ...unknown(), value: 'a guess' }).success).toBe(false);
    expect(observationSchema.safeParse({ ...unknown(), confidence: 40 }).success).toBe(false);
    expect(
      observationSchema.safeParse({ ...unknown(), evidence: observed('x').evidence }).success,
    ).toBe(false);
  });

  it('accepts all three classifications when they honour their obligations', () => {
    for (const obs of [observed('x'), inferred('x'), unknown()]) {
      expect(observationSchema.safeParse(obs).success).toBe(true);
    }
  });

  it('allows NONE as a recommended service', () => {
    const research = {
      ...validResearch(),
      recommendedService: { service: 'NONE', rationale: 'Nothing supports an offer', basedOn: [] },
    };
    expect(leadResearchSchema.safeParse(research).success).toBe(true);
  });
});

// ========================================================= prompt =======

describe('the prompt', () => {
  it('tells the model UNKNOWN is a correct answer', () => {
    expect(SYSTEM_PROMPT).toMatch(/UNKNOWN is a correct and useful answer/);
  });

  it('forbids inventing the facts most often hallucinated', () => {
    for (const forbidden of ['revenue', 'headcount', 'funding']) {
      expect(SYSTEM_PROMPT.toLowerCase()).toContain(forbidden);
    }
  });

  it('marks operator-supplied industry and location as unverified', () => {
    const message = buildUserMessage(input);
    expect(message).toMatch(/supplied by the operator, not verified/);
    expect(message).toContain('Logistics');
  });

  it('says plainly when there is nothing to research from', () => {
    const message = buildUserMessage({ ...input, sourceDocuments: [] });
    expect(message).toMatch(/NO SOURCE DOCUMENTS/);
    expect(message).toMatch(/should be UNKNOWN/);
  });

  it('labels every document with its URL so quotes can be traced', () => {
    expect(buildUserMessage(input)).toContain('https://acme.test/about');
  });
});

// ========================================================== retry =======

describe('retry and failure handling', () => {
  const ok = (): ModelResult => ({ kind: 'json', value: validResearch() });

  it('returns on the first valid response', async () => {
    const model = vi.fn().mockResolvedValue(ok());
    const outcome = await researchLead(model, input);
    expect(outcome.attempts).toBe(1);
    expect(outcome.repairs).toBe(0);
    expect(model).toHaveBeenCalledTimes(1);
  });

  it('repairs a schema-invalid response by feeding the errors back', async () => {
    const broken = { ...validResearch(), companySummary: { ...observed('x'), evidence: [] } };
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: broken })
      .mockResolvedValueOnce(ok());

    const outcome = await researchLead(model, input, { sleep: async () => {} });

    expect(outcome.repairs).toBe(1);
    const repairTurn = model.mock.calls[1]![0].messages.at(-1).content;
    expect(repairTurn).toMatch(/failed validation/);
    expect(repairTurn).toMatch(/INFERRED or UNKNOWN/);
    // And it names WHERE, not just what.
    expect(repairTurn).toMatch(/FIX ONLY THESE FIELDS: companySummary/);
  });

  it('gives up after maxAttempts and reports what was wrong', async () => {
    const broken = { ...validResearch(), confidence: 999 };
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: broken });

    await expect(
      researchLead(model, input, { maxAttempts: 2, sleep: async () => {} }),
    ).rejects.toThrow(ResearchValidationError);
    expect(model).toHaveBeenCalledTimes(2);
  });

  it('retries a transient provider failure with backoff', async () => {
    const model = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockResolvedValueOnce(ok());
    const sleep = vi.fn().mockResolvedValue(undefined);

    const outcome = await researchLead(model, input, { sleep, random: () => 0.5 });

    expect(outcome.attempts).toBe(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('does not retry a request that will always fail', async () => {
    const model = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
    await expect(researchLead(model, input, { sleep: async () => {} })).rejects.toThrow(
      ResearchProviderError,
    );
    expect(model).toHaveBeenCalledTimes(1);
  });

  it('classifies statuses correctly', () => {
    expect(toProviderError({ status: 429, message: 'x' }).retryable).toBe(true);
    expect(toProviderError({ status: 503, message: 'x' }).retryable).toBe(true);
    expect(toProviderError({ status: 408, message: 'x' }).retryable).toBe(true);
    expect(toProviderError({ status: 401, message: 'x' }).retryable).toBe(false);
    expect(toProviderError({ status: 404, message: 'x' }).retryable).toBe(false);
    expect(toProviderError(new Error('socket hang up')).retryable).toBe(true);
  });

  it('never retries a refusal', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'refusal', category: 'cyber' });
    await expect(researchLead(model, input, { sleep: async () => {} })).rejects.toThrow(
      ResearchRefusedError,
    );
    expect(model).toHaveBeenCalledTimes(1);
  });

  it('uses full jitter, so a rate-limited batch does not retry in lockstep', () => {
    expect(backoffDelayMs(1, 1000, 30_000, () => 0)).toBe(0);
    expect(backoffDelayMs(1, 1000, 30_000, () => 0.5)).toBe(500);
    expect(backoffDelayMs(3, 1000, 30_000, () => 1)).toBeLessThan(4000);
    expect(backoffDelayMs(99, 1000, 30_000, () => 0.999)).toBeLessThanOrEqual(30_000);
  });

  it('warns when the research is schema-valid but thin', async () => {
    const thin = {
      ...validResearch(),
      companySummary: unknown(),
      businessModel: unknown(),
      targetCustomers: unknown(),
      visibleProblems: [],
      aiOpportunities: [inferred('a guess')],
    };
    const outcome = await researchLead(
      vi.fn().mockResolvedValue({ kind: 'json', value: thin }),
      input,
    );
    expect(outcome.warning).toMatch(/OBSERVED/);
    expect(outcome.observedRatio).toBeLessThan(0.2);
  });
});

// ======================================================= persist =======

describe('storing results', () => {
  it('drops UNKNOWN claims rather than storing zero-weight noise', () => {
    const rows = toResearchRows(validResearch(), { leadId: 'lead_1' });
    expect(rows.every((row) => row.signal.length > 0)).toBe(true);
    // 5 observations in total; targetCustomers is UNKNOWN and is dropped.
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.signal)).not.toContain(null);
  });

  it('carries the source URL onto observed rows', () => {
    const rows = toResearchRows(validResearch(), { leadId: 'lead_1' });
    const summary = rows.find((row) => row.signal.includes('warehouse robotics'));
    expect(summary?.sourceUrl).toBe('https://acme.test/about');
  });

  it('halves inferred confidence so a guess never outranks a fact', () => {
    expect(effectiveConfidence(observed('x'))).toBe(90);
    expect(effectiveConfidence(inferred('x'))).toBe(30);
    expect(effectiveConfidence(unknown())).toBe(0);
  });

  it('supersedes old findings before inserting new ones', async () => {
    const order: string[] = [];
    const repository = {
      supersedePrevious: vi.fn(async () => {
        order.push('supersede');
        return 4;
      }),
      saveResearch: vi.fn(async () => {
        order.push('insert');
      }),
    };

    const result = await storeResearch(repository, validResearch(), {
      leadId: 'lead_1',
      model: 'claude-opus-5',
      attempts: 1,
      repairs: 0,
      observedRatio: 0.5,
    });

    expect(order).toEqual(['supersede', 'insert']);
    expect(result.superseded).toBe(4);
    expect(result.inserted).toBeGreaterThan(0);
  });

  it('keeps the whole validated result for audit', async () => {
    // Typed explicitly: an untyped vi.fn() infers a zero-length params
    // tuple, so mock.calls[0][0] does not typecheck.
    const saveResearch = vi.fn<ResearchRepository['saveResearch']>(async () => {});
    const repository: ResearchRepository = {
      supersedePrevious: async () => 0,
      saveResearch,
    };
    await storeResearch(repository, validResearch(), {
      leadId: 'lead_1',
      model: 'claude-opus-5',
      attempts: 2,
      repairs: 1,
      observedRatio: 0.5,
    });
    const saved = saveResearch.mock.calls[0]![0];
    expect(saved.run).toMatchObject({
      attempts: 2,
      repairs: 1,
      recommendedService: 'AI content system',
    });
    expect(saved.run.gaps).toContain('Headcount not stated anywhere');
  });
});

// ==================================================== json schema =======

describe('schema conversion for structured output', () => {
  it('produces a closed object schema', () => {
    const json = zodToJsonSchema(leadResearchSchema) as Record<string, unknown>;
    expect(json.type).toBe('object');
    expect(json.additionalProperties).toBe(false);
    expect(json.required).toContain('companySummary');
    expect(json.required).toContain('recommendedService');
  });

  it('keeps the classification enum closed', () => {
    const json = JSON.stringify(zodToJsonSchema(leadResearchSchema));
    expect(json).toContain('OBSERVED');
    expect(json).toContain('INFERRED');
    expect(json).toContain('UNKNOWN');
  });

  it('allows null values only where the schema does', () => {
    const json = JSON.stringify(zodToJsonSchema(leadResearchSchema));
    expect(json).toContain('"type":"null"');
  });
});

describe('observedRatio', () => {
  it('measures how much of the research is evidence', () => {
    // 2 OBSERVED of 5 total claims (2 inferred, 1 unknown).
    expect(observedRatio(validResearch())).toBeCloseTo(2 / 5);
  });
});

// ============================================== evidence provenance ===
//
// The schema can only check that an OBSERVED claim CARRIES evidence. These
// check that the evidence is REAL — that the quote occurs in the document
// it names and that the document was one we supplied. Without them,
// "OBSERVED" means only that the model typed the word OBSERVED.

describe('evidence provenance', () => {
  // Isolates the claim under test. validResearch() carries its own OBSERVED
  // claim citing CAREERS, so leaving it in would add a second, unrelated
  // issue whenever a case supplies a different document set.
  const research = (observation: ReturnType<typeof observed>): LeadResearch =>
    leadResearchSchema.parse({
      ...validResearch(),
      companySummary: observation,
      visibleProblems: [],
      aiOpportunities: [],
    });

  describe('quote matching', () => {
    it('accepts a quote that appears verbatim in the cited document', () => {
      const result = verifyProvenance(
        research(observed('Ships widely', HOMEPAGE, 'We have shipped to 40 distribution centres')),
        [HOMEPAGE, CAREERS],
      );
      expect(result).toEqual([]);
    });

    it('tolerates harmless whitespace and typographic differences', () => {
      const wrapped = {
        label: 'homepage',
        url: 'https://acme.test/about',
        // Line-wrapped, double-spaced, non-breaking space, curly apostrophe
        // and an en dash — all artefacts of HTML-to-text extraction.
        text: "Acme sells   warehouse robotics\nand we’re shipping 40–50 units.",
      };
      const result = verifyProvenance(
        research(
          observed('Ships units', wrapped, "Acme sells warehouse robotics and we're shipping 40-50 units"),
        ),
        [wrapped],
      );
      expect(result).toEqual([]);
    });

    it('rejects a fabricated quote that appears in no supplied document', () => {
      const result = verifyProvenance(
        research(
          observed('Raised a Series B', HOMEPAGE, 'Acme raised a $40M Series B led by Sequoia'),
        ),
        [HOMEPAGE, CAREERS],
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.path).toBe('companySummary.evidence.0.quote');
      expect(result[0]!.message).toMatch(/does not appear in any supplied source document/);
    });

    it('rejects a paraphrase of real source text', () => {
      // Every fact is true and present; the words are the model's own.
      // Fuzzy matching would let this through, which is why matching is
      // exact substring after formatting-only normalisation.
      const result = verifyProvenance(
        research(observed('Sells robots', HOMEPAGE, 'Acme is a seller of robotics for warehouses')),
        [HOMEPAGE],
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.message).toMatch(/does not appear in any supplied source document/);
    });

    it('rejects a quote too short to be evidence, closing the "a" bypass', () => {
      const result = verifyProvenance(research(observed('Sells things', HOMEPAGE, 'Acme')), [
        HOMEPAGE,
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]!.message).toMatch(/too short to be evidence/);
      expect(MIN_QUOTE_CHARS).toBeGreaterThan(1);
    });
  });

  describe('source URL matching', () => {
    it('accepts a sourceUrl that is one of the supplied documents', () => {
      expect(
        verifyProvenance(
          research(observed('Hiring', CAREERS, 'Content Marketer, Technical Writer')),
          [HOMEPAGE, CAREERS],
        ),
      ).toEqual([]);
    });

    it('tolerates a trailing-slash difference but nothing more', () => {
      const trailing = { ...HOMEPAGE, url: 'https://acme.test/about/' };
      expect(
        verifyProvenance(
          research(observed('Sells robots', trailing, 'Acme sells warehouse robotics')),
          [HOMEPAGE],
        ),
      ).toEqual([]);
    });

    it('rejects a fabricated sourceUrl even when the quote is real', () => {
      const invented = { ...HOMEPAGE, url: 'https://acme.test/press/series-b' };
      const result = verifyProvenance(
        research(observed('Sells robots', invented, 'Acme sells warehouse robotics')),
        [HOMEPAGE, CAREERS],
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.path).toBe('companySummary.evidence.0.sourceUrl');
      expect(result[0]!.message).toMatch(/is not one of the supplied source documents/);
    });

    it('rejects a real quote attributed to the wrong supplied document', () => {
      // Both halves exist; the pairing is invented. Checking quote and URL
      // independently would accept this.
      const result = verifyProvenance(
        research(observed('Hiring', HOMEPAGE, 'We are hiring three content roles this quarter')),
        [HOMEPAGE, CAREERS],
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.message).toMatch(/does not appear in "homepage"/);
      expect(result[0]!.message).toMatch(/it appears in "careers"/);
    });

    it('rejects everything OBSERVED when no documents were supplied', () => {
      const result = verifyProvenance(
        research(observed('Sells robots', HOMEPAGE, 'Acme sells warehouse robotics')),
        [],
      );
      expect(result).toHaveLength(1);
      expect(result[0]!.message).toMatch(/no source documents were supplied/);
    });
  });

  describe('multiple sources', () => {
    it('checks each citation against the document it names', () => {
      const THIRD = {
        label: 'blog',
        url: 'https://acme.test/blog/1',
        text: 'Our automation reduced picking time by 30%.',
      };
      const mixed = leadResearchSchema.parse({
        ...validResearch(),
        companySummary: observed('Sells robots', HOMEPAGE, 'Acme sells warehouse robotics'),
        visibleProblems: [
          observed('Hiring', CAREERS, 'We are hiring three content roles this quarter'),
          observed('Invented', THIRD, 'Our automation reduced picking time by 80%'),
        ],
      });
      const result = verifyProvenance(mixed, [HOMEPAGE, CAREERS, THIRD]);

      // Only the fabricated one is reported, and it is named precisely.
      expect(result).toHaveLength(1);
      expect(result[0]!.path).toBe('visibleProblems.1.evidence.0.quote');
    });

    it('reports every failing citation, not just the first', () => {
      const bad = leadResearchSchema.parse({
        ...validResearch(),
        companySummary: observed('A', HOMEPAGE, 'Fabricated sentence number one'),
        visibleProblems: [observed('B', CAREERS, 'Fabricated sentence number two')],
      });
      expect(verifyProvenance(bad, [HOMEPAGE, CAREERS])).toHaveLength(2);
    });
  });

  describe('the other classifications are left alone', () => {
    it('does not inspect INFERRED claims, whose rules stay in the schema', () => {
      const withInference = leadResearchSchema.parse({
        ...validResearch(),
        businessModel: inferred('Likely enterprise SaaS'),
      });
      expect(verifyProvenance(withInference, [HOMEPAGE, CAREERS])).toEqual([]);
      // And the schema still enforces what INFERRED owes.
      expect(
        observationSchema.safeParse({ ...inferred('x'), basis: null }).success,
      ).toBe(false);
      expect(
        observationSchema.safeParse({ ...inferred('x'), confidence: 95 }).success,
      ).toBe(false);
    });

    it('does not inspect UNKNOWN claims, whose semantics are unchanged', () => {
      // Nothing OBSERVED anywhere, and no sources at all: provenance has
      // nothing to say, even though every citation would fail if there
      // were any. UNKNOWN is not a claim about a document.
      const allUnknown = leadResearchSchema.parse({
        ...validResearch(),
        companySummary: unknown(),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [],
        aiOpportunities: [],
      });
      expect(verifyProvenance(allUnknown, [])).toEqual([]);
      expect(observationSchema.safeParse({ ...unknown(), value: 'a guess' }).success).toBe(false);
      expect(observationSchema.safeParse({ ...unknown(), confidence: 50 }).success).toBe(false);
    });

    it('still reports OBSERVED that carries no evidence at all', () => {
      const naked = {
        ...validResearch(),
        companySummary: { ...observed('x'), evidence: [] },
        visibleProblems: [],
      };
      const result = verifyProvenance(naked as LeadResearch, [HOMEPAGE]);
      expect(result).toHaveLength(1);
      expect(result[0]!.path).toBe('companySummary.evidence');
    });
  });

  describe('normalisation is formatting-only', () => {
    it('collapses whitespace, line breaks and typographic variants', () => {
      expect(normaliseForMatch('  a\r\n b\t\tc  ')).toBe('a b c');
      expect(normaliseForMatch('we’re')).toBe("we're");
      expect(normaliseForMatch('40–50')).toBe('40-50');
      expect(normaliseForMatch('a b')).toBe('a b');
    });

    it('does not fold case, word order, or wording', () => {
      expect(normaliseForMatch('Acme Sells')).not.toBe(normaliseForMatch('acme sells'));
      expect(normaliseForMatch('sells robotics')).not.toBe(normaliseForMatch('robotics sells'));
    });
  });
});

// ================================== provenance inside the repair loop ===

describe('provenance failures drive the repair loop', () => {
  const fabricated = (): LeadResearch =>
    leadResearchSchema.parse({
      ...validResearch(),
      companySummary: observed('Raised a Series B', HOMEPAGE, 'Acme raised a $40M Series B round'),
    });

  it('rejects a schema-valid response whose evidence was invented, then accepts the repair', async () => {
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: fabricated() })
      .mockResolvedValueOnce({ kind: 'json', value: validResearch() });

    const outcome = await researchLead(model, input, { sleep: async () => {} });

    expect(outcome.repairs).toBe(1);
    expect(outcome.attempts).toBe(2);
    expect(model).toHaveBeenCalledTimes(2);

    const repairTurn = model.mock.calls[1]![0].messages.at(-1).content;
    expect(repairTurn).toMatch(/companySummary\.evidence\.0\.quote/);
    expect(repairTurn).toMatch(/does not appear in any supplied source document/);
  });

  it('never returns research whose evidence was invented', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: fabricated() });

    await expect(
      researchLead(model, input, { maxAttempts: 2, sleep: async () => {} }),
    ).rejects.toThrow(ResearchValidationError);
    expect(model).toHaveBeenCalledTimes(2);
  });

  it('does not resend the whole rejected document on every round', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: fabricated() });

    await expect(
      researchLead(model, input, { maxAttempts: 3, sleep: async () => {} }),
    ).rejects.toThrow(ResearchValidationError);

    // A repair round is now ONE message: the targeted correction. It
    // replaces the brief rather than following it, because the brief's
    // bulk is the source documents and the correction carries those
    // itself only when the failures are about evidence.
    const second = model.mock.calls[1]![0].messages;
    const third = model.mock.calls[2]![0].messages;
    expect(second).toHaveLength(1);
    expect(third).toHaveLength(1);

    // Smaller than what the OLD loop sent, which is the comparison that
    // means anything: brief + the entire rejected document + the issues.
    // (Comparing against the FIRST round would be the wrong test — a
    // provenance repair legitimately re-sends the source documents,
    // because finding a real quote requires them, so it is the prior
    // JSON that this saves, not the sources.)
    const brief: string = model.mock.calls[0]![0].messages[0].content;
    const wholeDocument = JSON.stringify(fabricated());
    const oldStyle = brief.length + wholeDocument.length;
    const repairRound: string = second[0]!.content;

    expect(repairRound.length).toBeLessThan(oldStyle);
    // The excerpt is one observation, not twenty.
    expect(repairRound.length).toBeLessThan(wholeDocument.length + brief.length * 0.9);
  });

  it('caps how many issues a repair message carries', async () => {
    // Every OBSERVED claim fabricated, so there are more issues than the cap.
    const manyBad = leadResearchSchema.parse({
      ...validResearch(),
      visibleProblems: Array.from({ length: 8 }, (_, i) =>
        observed(`claim ${i}`, HOMEPAGE, `Fabricated sentence number ${i} about Acme`),
      ),
      growthOpportunities: Array.from({ length: 8 }, (_, i) =>
        observed(`growth ${i}`, HOMEPAGE, `Another fabricated sentence ${i} about Acme`),
      ),
    });
    // The repair response has to have the SAME SHAPE as what it repairs.
    // Repair paths are indexed (visibleProblems.3), so a response whose
    // arrays are shorter has nothing at that index and the prior value is
    // kept — safe, but it costs another round. An earlier version of this
    // test handed back validResearch(), whose lists are shorter, and so
    // tested a situation no real repair produces.
    const repaired = leadResearchSchema.parse({
      ...manyBad,
      visibleProblems: Array.from({ length: 8 }, (_, i) =>
        observed(`claim ${i}`, HOMEPAGE, 'Acme sells warehouse robotics'),
      ),
      growthOpportunities: Array.from({ length: 8 }, (_, i) =>
        observed(`growth ${i}`, HOMEPAGE, 'We have shipped to 40 distribution centres'),
      ),
    });
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: manyBad })
      .mockResolvedValueOnce({ kind: 'json', value: repaired });

    const outcome = await researchLead(model, input, { sleep: async () => {} });

    // ONE repair round fixes all sixteen. Capping the merge set as well
    // as the display would have needed two.
    expect(outcome.repairs).toBe(1);
    expect(model).toHaveBeenCalledTimes(2);

    const repairTurn: string = model.mock.calls[1]![0].messages.at(-1).content;
    const bullets = repairTurn.split('\n').filter((line) => line.startsWith('- '));
    expect(bullets.length).toBeLessThanOrEqual(MAX_REPAIR_ISSUES + 1);
    expect(repairTurn).toMatch(/more of the same kind/);
  });
});

// =========================== the model is told what will be verified ===

describe('the JSON schema communicates the evidence contract', () => {
  it('carries the verbatim-quote requirement into the schema the model sees', () => {
    const json = JSON.stringify(zodToJsonSchema(leadResearchSchema));
    expect(json).toMatch(/VERBATIM/);
    expect(json).toMatch(/checked/);
  });

  it('tells the model a cited URL must be one it was given', () => {
    const json = JSON.stringify(zodToJsonSchema(leadResearchSchema));
    expect(json).toMatch(/Must be one of the document URLs given in the user message/);
  });

  it('carries string and array bounds so the model is constrained, not just corrected', () => {
    const json = zodToJsonSchema(leadResearchSchema) as Record<string, never>;
    const quote = (json as unknown as {
      properties: {
        companySummary: {
          properties: { evidence: { items: { properties: { quote: Record<string, unknown> } } } };
        };
      };
    }).properties.companySummary.properties.evidence.items.properties.quote;
    expect(quote.maxLength).toBe(500);
    expect(quote.minLength).toBe(1);
    expect(quote.description).toMatch(/VERBATIM/);
  });

  it('still produces a closed schema with the enum intact', () => {
    const json = zodToJsonSchema(leadResearchSchema) as Record<string, unknown>;
    expect(json.additionalProperties).toBe(false);
    expect(JSON.stringify(json)).toContain('OBSERVED');
  });
});

// ============================ the API key is explicit, never ambient ===
//
// The regression this guards: `new Anthropic()` read ANTHROPIC_API_KEY
// out of process.env inside the SDK. The key was therefore never declared
// in @acos/config, never validated at boot, and absent from every
// deployment checklist — a process booted cleanly and died on its first
// research call, in production, with somebody else's error message.

describe('the Anthropic key must be supplied, not inherited', () => {
  it('refuses to build a model with no key and no client', () => {
    expect(() => createAnthropicResearchModel({})).toThrow(AnthropicConfigError);
    expect(() => createAnthropicResearchModel({ apiKey: '   ' })).toThrow(AnthropicConfigError);
  });

  it('does not fall back to the ambient environment', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-ambient-should-be-ignored';
    try {
      // Even with the variable set, an unconfigured call must fail: the
      // whole point is that this module never reads it.
      expect(() => createAnthropicResearchModel({})).toThrow(AnthropicConfigError);
    } finally {
      if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  it('never names the key value in its error', () => {
    try {
      createAnthropicResearchModel({ apiKey: '' });
      expect.unreachable('expected a config error');
    } catch (error) {
      expect((error as Error).message).toMatch(/loadEnv\(\)\.ANTHROPIC_API_KEY/);
      expect((error as Error).message).not.toMatch(/sk-ant/);
    }
  });

  it('accepts an explicit key, and an injected client without one', () => {
    expect(() => createAnthropicResearchModel({ apiKey: 'sk-ant-explicit' })).not.toThrow();
    const fakeClient = { messages: { stream: () => undefined } } as never;
    expect(() => createAnthropicResearchModel({ client: fakeClient })).not.toThrow();
  });
});

// ============================================ R-29 usage propagation ===
//
// Phase 16's authorized compatibility exception: anthropicModel.ts must
// expose the real Message's usage/id (never read before), and
// researcher.ts's retry loop must report it once per invocation via
// onInvocation. Nothing here persists anything — @acos/core-ai-usage
// owns the metering write; these tests only prove the data reaches that
// boundary correctly.

describe('usage propagation (R-29 compatibility exception)', () => {
  /** A fake Anthropic client whose stream().finalMessage() resolves to `message`. */
  function fakeAnthropicClient(message: {
    id: string;
    stop_reason: string;
    stop_details?: { category: string } | null;
    content: { type: string; text?: string }[];
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number | null;
      cache_read_input_tokens?: number | null;
    };
  }) {
    return {
      messages: {
        stream: () => ({ finalMessage: async () => message }),
      },
    } as never;
  }

  it('extracts provider, model, message id and token usage from a successful response', async () => {
    const client = fakeAnthropicClient({
      id: 'msg_01ABC',
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify(validResearch()) }],
      usage: { input_tokens: 1200, output_tokens: 340 },
    });
    const model = createAnthropicResearchModel({ client, model: 'claude-opus-5' });

    const result = await model({ system: SYSTEM_PROMPT, messages: [] });

    expect(result.kind).toBe('json');
    expect(result.usage).toEqual({
      provider: 'anthropic',
      model: 'claude-opus-5',
      providerMessageId: 'msg_01ABC',
      inputTokens: 1200,
      outputTokens: 340,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    });
  });

  it('preserves reported cache-usage fields rather than defaulting them to null', async () => {
    const client = fakeAnthropicClient({
      id: 'msg_01CACHE',
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify(validResearch()) }],
      usage: {
        input_tokens: 50,
        output_tokens: 20,
        cache_creation_input_tokens: 900,
        cache_read_input_tokens: 100,
      },
    });
    const model = createAnthropicResearchModel({ client });

    const result = await model({ system: SYSTEM_PROMPT, messages: [] });

    expect(result.usage?.cacheCreationInputTokens).toBe(900);
    expect(result.usage?.cacheReadInputTokens).toBe(100);
  });

  it('extracts usage from a refusal too — a decline still consumes tokens', async () => {
    const client = fakeAnthropicClient({
      id: 'msg_01REFUSED',
      stop_reason: 'refusal',
      stop_details: { category: 'cyber' },
      content: [],
      usage: { input_tokens: 80, output_tokens: 5 },
    });
    const model = createAnthropicResearchModel({ client });

    const result = await model({ system: SYSTEM_PROMPT, messages: [] });

    expect(result.kind).toBe('refusal');
    expect(result.usage).toMatchObject({ providerMessageId: 'msg_01REFUSED', inputTokens: 80 });
  });

  it('researchLead reports one invocation per model() call, tagged initial vs repair', async () => {
    const broken = { ...validResearch(), companySummary: { ...observed('x'), evidence: [] } };
    const model = vi
      .fn()
      .mockResolvedValueOnce({
        kind: 'json',
        value: broken,
        usage: {
          provider: 'anthropic',
          model: 'claude-opus-5',
          providerMessageId: 'msg_initial',
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
        },
      })
      .mockResolvedValueOnce({
        kind: 'json',
        value: validResearch(),
        usage: {
          provider: 'anthropic',
          model: 'claude-opus-5',
          providerMessageId: 'msg_repair',
          inputTokens: 60,
          outputTokens: 40,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
        },
      });

    const onInvocation = vi.fn();
    await researchLead(model, input, { sleep: async () => {}, onInvocation });

    expect(onInvocation).toHaveBeenCalledTimes(2);
    expect(onInvocation.mock.calls[0]![0].providerMessageId).toBe('msg_initial');
    expect(onInvocation.mock.calls[0]![1]).toBe('initial');
    expect(onInvocation.mock.calls[1]![0].providerMessageId).toBe('msg_repair');
    expect(onInvocation.mock.calls[1]![1]).toBe('repair');
  });

  it('reports a refusal as an invocation too, before the refusal is thrown', async () => {
    const onInvocation = vi.fn();
    const model = vi.fn().mockResolvedValue({
      kind: 'refusal',
      category: 'cyber',
      usage: {
        provider: 'anthropic',
        model: 'claude-opus-5',
        providerMessageId: 'msg_refusal',
        inputTokens: 10,
        outputTokens: 2,
        cacheCreationInputTokens: null,
        cacheReadInputTokens: null,
      },
    });

    await expect(
      researchLead(model, input, { sleep: async () => {}, onInvocation }),
    ).rejects.toThrow(ResearchRefusedError);

    expect(onInvocation).toHaveBeenCalledTimes(1);
    expect(onInvocation.mock.calls[0]![1]).toBe('initial');
  });

  it('does not report an invocation for a call that throws (no response, nothing to meter)', async () => {
    const onInvocation = vi.fn();
    const model = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockResolvedValueOnce({
        kind: 'json',
        value: validResearch(),
        usage: {
          provider: 'anthropic',
          model: 'claude-opus-5',
          providerMessageId: 'msg_after_retry',
          inputTokens: 5,
          outputTokens: 5,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
        },
      });

    await researchLead(model, input, { sleep: async () => {}, random: () => 0.5, onInvocation });

    // Two model() calls, but only the second ever returned a response.
    expect(model).toHaveBeenCalledTimes(2);
    expect(onInvocation).toHaveBeenCalledTimes(1);
    expect(onInvocation.mock.calls[0]![0].providerMessageId).toBe('msg_after_retry');
    // A provider-error retry of the FIRST attempt is still 'initial' —
    // it retries the same original message, not a repair round.
    expect(onInvocation.mock.calls[0]![1]).toBe('initial');
  });

  it('does not invoke the callback at all when the adapter reports no usage', async () => {
    const onInvocation = vi.fn();
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: validResearch() });

    await researchLead(model, input, { onInvocation });

    expect(onInvocation).not.toHaveBeenCalled();
  });
});

// ============================== targeted repair: what it does and does not ===
//
// The repair round narrows the PROMPT. It deliberately does not narrow
// validation: the merged document goes through leadResearchSchema and
// verifyProvenance in full on every round, exactly as before.

describe('targeted repair', () => {
  /** A document where exactly one observation has a fabricated quote. */
  const oneBadClaim = (): LeadResearch =>
    leadResearchSchema.parse({
      ...validResearch(),
      businessModel: observed('Raised a Series B', HOMEPAGE, 'Acme raised a $40M Series B round'),
    });

  it('names only the failing subtree, not every field', () => {
    const bad = oneBadClaim();
    const plan = planRepair(bad, verifyProvenance(bad, [HOMEPAGE, CAREERS]));

    expect(plan.roots).toEqual(['businessModel']);
    expect(Object.keys(plan.excerpt)).toEqual(['businessModel']);
    // The observations that passed are absent from the prompt entirely.
    expect(JSON.stringify(plan.excerpt)).not.toContain('warehouse robotics');
  });

  it('groups a field-level failure up to its observation', () => {
    // A bad quote is often not fixed by editing the quote — the honest
    // repair reclassifies the claim, which changes value, basis and
    // confidence together. So the unit of repair is the observation.
    expect(repairRoot('visibleProblems.2.evidence.0.quote')).toBe('visibleProblems.2');
    expect(repairRoot('companySummary.evidence.0.sourceUrl')).toBe('companySummary');
    expect(repairRoot('confidence')).toBe('confidence');
  });

  it('includes the source documents only when the failure is about evidence', () => {
    const provenanceIssue = [{ path: 'companySummary.evidence.0.quote', message: 'does not appear' }];
    const schemaIssue = [
      { path: 'businessModel.confidence', message: 'INFERRED confidence cannot exceed 80' },
    ];
    expect(needsSourceContext(provenanceIssue)).toBe(true);
    // Fixing a number does not require ten thousand tokens of source text.
    expect(needsSourceContext(schemaIssue)).toBe(false);
  });

  it('omits the documents from a schema-only repair message', () => {
    const plan = planRepair(validResearch(), [
      { path: 'confidence', message: 'Number must be less than or equal to 100' },
    ]);
    const message = buildTargetedRepairMessage(plan, input);

    expect(plan.includeSources).toBe(false);
    expect(message).not.toContain('DOCUMENT 1');
    expect(message).not.toContain(HOMEPAGE.text);
    expect(message).toMatch(/source documents are not\s+repeated/);
  });

  // ---------------------------------------------------------- succeeds ----
  it('repair still succeeds', async () => {
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: oneBadClaim() })
      .mockResolvedValueOnce({ kind: 'json', value: validResearch() });

    const outcome = await researchLead(model, input, { sleep: async () => {} });

    expect(outcome.repairs).toBe(1);
    expect(outcome.research.businessModel.classification).toBe('INFERRED');
  });

  // ------------------------------------------------ unrelated preserved ----
  it('preserves unrelated observations even when the model rewrites them', async () => {
    const bad = oneBadClaim();

    // A hostile repair response: it fixes the named field AND quietly
    // rewrites two that were never in question. Only the named one may
    // be taken — preservation is by construction, not by trusting this.
    const meddling = leadResearchSchema.parse({
      ...validResearch(),
      businessModel: inferred('Likely enterprise SaaS'),
      companySummary: observed('SOMETHING ELSE ENTIRELY', HOMEPAGE, 'Acme sells warehouse robotics'),
      gaps: ['rewritten by the repair'],
    });

    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: bad })
      .mockResolvedValueOnce({ kind: 'json', value: meddling });

    const outcome = await researchLead(model, input, { sleep: async () => {} });

    // The named field took the repair...
    expect(outcome.research.businessModel.classification).toBe('INFERRED');
    // ...and the meddling was discarded.
    expect(outcome.research.companySummary.value).toBe('Acme sells warehouse robotics');
    expect(outcome.research.gaps).toEqual(bad.gaps);
    expect(outcome.research.visibleProblems).toEqual(bad.visibleProblems);
  });

  it('applyRepair touches nothing outside the named roots', () => {
    const prior = { a: 1, b: { keep: true }, c: [{ x: 1 }, { x: 2 }] };
    const repaired = { a: 99, b: { keep: false }, c: [{ x: 8 }, { x: 9 }] };

    const merged = applyRepair(prior, repaired, ['c.1']) as typeof prior;

    expect(merged.a).toBe(1);
    expect(merged.b).toEqual({ keep: true });
    expect(merged.c[0]).toEqual({ x: 1 });
    expect(merged.c[1]).toEqual({ x: 9 });
    // And the original is untouched.
    expect(prior.c[1]).toEqual({ x: 2 });
  });

  it('leaves the prior value in place when the response lacks that path', () => {
    const prior = { list: [{ id: 'a' }, { id: 'b' }] };
    // A response with a shorter array has nothing at list.1.
    const merged = applyRepair(prior, { list: [{ id: 'z' }] }, ['list.1']) as typeof prior;
    // Safe direction: keep what validated, fail again, spend one more
    // bounded round. Never write undefined into the document.
    expect(merged.list[1]).toEqual({ id: 'b' });
  });

  // ---------------------------------------------------- provenance holds ----
  it('provenance is still enforced on the MERGED document', async () => {
    const bad = oneBadClaim();
    // The "repair" swaps one fabrication for another.
    const stillFabricated = leadResearchSchema.parse({
      ...validResearch(),
      businessModel: observed('Raised a Series C', HOMEPAGE, 'Acme raised a $90M Series C'),
    });

    const model = vi.fn().mockResolvedValue({ kind: 'json', value: stillFabricated });

    await expect(
      researchLead(model, { ...input }, { maxAttempts: 2, sleep: async () => {} }),
    ).rejects.toThrow(ResearchValidationError);
    void bad;
  });

  it('a merge cannot smuggle an unevidenced claim past validation', async () => {
    // The model returns a document that is schema-valid on its own but
    // whose repaired subtree cites a quote in no supplied document.
    const forged = leadResearchSchema.parse({
      ...validResearch(),
      businessModel: observed('Invented', HOMEPAGE, 'A sentence that appears in no document'),
    });
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: oneBadClaim() })
      .mockResolvedValue({ kind: 'json', value: forged });

    await expect(
      researchLead(model, input, { maxAttempts: 3, sleep: async () => {} }),
    ).rejects.toThrow(ResearchValidationError);
  });

  // -------------------------------------------------------- bounded ----
  it.each([1, 2, 3, 5])('never exceeds maxAttempts=%i model calls', async (maxAttempts) => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: oneBadClaim() });

    await expect(
      researchLead(model, input, { maxAttempts, sleep: async () => {} }),
    ).rejects.toThrow(ResearchValidationError);

    expect(model).toHaveBeenCalledTimes(maxAttempts);
  });

  it('counts repairs as attempts minus one, however many roots fail', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: oneBadClaim() });
    try {
      await researchLead(model, input, { maxAttempts: 4, sleep: async () => {} });
    } catch {
      /* expected */
    }
    expect(model).toHaveBeenCalledTimes(4);
  });

  // ------------------------------------------------------ the saving ----
  it('a schema-only repair is far smaller than the old brief-plus-document', async () => {
    // A realistic brief: source documents dominate it.
    const bulky: ResearchInput = {
      ...input,
      sourceDocuments: [
        { ...HOMEPAGE, text: `${HOMEPAGE.text} ${'filler sentence. '.repeat(400)}` },
        { ...CAREERS, text: `${CAREERS.text} ${'more filler. '.repeat(400)}` },
      ],
    };
    const overLimit = { ...validResearch(), confidence: 999 };
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: overLimit })
      .mockResolvedValueOnce({ kind: 'json', value: validResearch() });

    await researchLead(model, bulky, { sleep: async () => {} });

    const brief: string = model.mock.calls[0]![0].messages[0].content;
    const repair: string = model.mock.calls[1]![0].messages[0].content;
    const oldStyle = brief.length + JSON.stringify(overLimit).length;

    // The confidence field does not need the source documents, so this
    // repair drops nearly all of the prompt.
    expect(repair.length).toBeLessThan(oldStyle / 10);
    expect(repair).not.toContain('filler sentence');
  });
});

// ============================== no unbounded waits in the retry path ===
//
// CONTEXT, established by audit: researchLead has no production caller —
// neither apps/web nor apps/worker depends on @acos/core-research. So the
// honest answer to "HTTP-facing or worker-only?" is NEITHER YET, and this
// is a library whose consumer is undecided. It therefore has to be safe
// for both: a signal for whoever is watching (a request aborting, a
// worker shutting down) and a wall-clock deadline for when nobody is.

describe('abortable sleep', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the delay', async () => {
    vi.useFakeTimers();
    let done = false;
    const pending = abortableSleep(5_000).then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(4_999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(done).toBe(true);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('gone'));
    await expect(abortableSleep(60_000, controller.signal)).rejects.toThrow('gone');
  });

  it('rejects as soon as the signal fires, not when the timer would have', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const pending = abortableSleep(60_000, controller.signal);

    await vi.advanceTimersByTimeAsync(10);
    controller.abort(new Error('caller left'));

    await expect(pending).rejects.toThrow('caller left');
    // And it did not wait out the minute.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves no timer behind on either path', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();

    const aborted = abortableSleep(60_000, controller.signal);
    controller.abort(new Error('x'));
    await expect(aborted).rejects.toThrow();
    expect(vi.getTimerCount(), 'after abort').toBe(0);

    const completed = abortableSleep(1_000, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(1_000);
    await completed;
    expect(vi.getTimerCount(), 'after completion').toBe(0);
  });

  it('leaves no abort LISTENER behind, so a loop cannot accumulate them', async () => {
    // Static-ish import through require's type shape: the dynamic
    // import of 'node:events' resolves to the EventEmitter namespace,
    // which does not carry getEventListeners in its type.
    const events = (await import('node:events')) as unknown as {
      getEventListeners: (target: object, event: string) => unknown[];
    };
    const { getEventListeners } = events;
    vi.useFakeTimers();
    const controller = new AbortController();

    // The leak that is easy to miss: a long-lived signal reused across
    // many sleeps. Counting timers does NOT detect it — an earlier
    // version of this test did exactly that and passed happily with the
    // removeEventListener deleted. The listener count is the only thing
    // that actually sees it.
    for (let i = 0; i < 40; i += 1) {
      const pending = abortableSleep(10, controller.signal);
      await vi.advanceTimersByTimeAsync(10);
      await pending;
    }

    expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('treats a non-positive delay as no wait at all', async () => {
    await expect(abortableSleep(0)).resolves.toBeUndefined();
    await expect(abortableSleep(-5)).resolves.toBeUndefined();
  });
});

describe('the deadline', () => {
  it('reports what is left and clamps a wait to it', () => {
    const d = new Deadline(10_000, 1_000);
    expect(d.remainingMs(1_000)).toBe(10_000);
    expect(d.remainingMs(6_000)).toBe(5_000);
    // A 30s backoff with 5s left waits 5s — not 30, and not zero.
    // Skipping the wait entirely would hammer a provider that just
    // rate-limited us.
    expect(d.clamp(30_000, 6_000)).toBe(5_000);
    expect(d.expired(11_001)).toBe(true);
  });

  it('is unbounded when no budget is given', () => {
    const d = new Deadline(undefined, 0);
    expect(d.remainingMs(1e9)).toBe(Number.POSITIVE_INFINITY);
    expect(d.expired(1e9)).toBe(false);
    expect(d.clamp(30_000, 1e9)).toBe(30_000);
  });

  it('rejects a nonsensical budget rather than bounding nothing', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new Deadline(bad)).toThrow(RangeError);
    }
  });
});

describe('researchLead honours cancellation', () => {
  const transient = () => Object.assign(new Error('rate limited'), { status: 429 });

  it('stops before spending another provider call once aborted', async () => {
    const controller = new AbortController();
    const model = vi.fn().mockRejectedValue(transient());

    const promise = researchLead(model, input, {
      maxAttempts: 5,
      signal: controller.signal,
      // Abort during the first backoff.
      sleep: async () => controller.abort(new Error('caller left')),
    });

    await expect(promise).rejects.toThrow(ResearchAbortedError);
    // One call made, none after the abort.
    expect(model).toHaveBeenCalledTimes(1);
  });

  it('refuses to start at all when handed an already-aborted signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const model = vi.fn();

    await expect(researchLead(model, input, { signal: controller.signal })).rejects.toThrow(
      ResearchAbortedError,
    );
    expect(model).not.toHaveBeenCalled();
  });

  it('forwards the signal to the model, so an in-flight call is cancelled too', async () => {
    const controller = new AbortController();
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: validResearch() });

    await researchLead(model, input, { signal: controller.signal });

    expect(model.mock.calls[0]![0].signal).toBe(controller.signal);
  });

  it('classifies an abort surfacing through the model as an abort, not a provider fault', async () => {
    const controller = new AbortController();
    const model = vi.fn(async () => {
      controller.abort();
      throw new Error('The operation was aborted');
    });

    const outcome = researchLead(model, input, { maxAttempts: 5, signal: controller.signal });

    await expect(outcome).rejects.toThrow(ResearchAbortedError);
    // Not retried: a caller who has left must not be waited for.
    expect(model).toHaveBeenCalledTimes(1);
  });

  it('stops at the deadline even with nobody watching', async () => {
    // Deadline reads Date.now(), so the clock has to be ours for this to
    // be deterministic rather than a race against the machine.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(START));
    let clock = 0;
    const model = vi.fn().mockRejectedValue(transient());

    const promise = researchLead(model, input, {
      maxAttempts: 10,
      deadlineMs: 5_000,
      // Each backoff consumes budget, deterministically.
      sleep: async (ms: number) => {
        clock += ms;
        vi.setSystemTime(new Date(START + clock));
      },
      random: () => 1,
    });

    await expect(promise).rejects.toThrow(ResearchAbortedError);
    // Far fewer than the ten it was allowed, because the clock ran out.
    expect(model.mock.calls.length).toBeLessThan(10);
    vi.useRealTimers();
  });

  it('names the reason, so an operator can tell the two apart', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(START));
    const controller = new AbortController();
    controller.abort();
    let bySignal: unknown;
    try {
      await researchLead(vi.fn(), input, { signal: controller.signal });
    } catch (error) {
      bySignal = error;
    }
    expect(bySignal).toBeInstanceOf(ResearchAbortedError);
    expect((bySignal as ResearchAbortedError).reason).toBe('signal');

    vi.setSystemTime(new Date(START));
    let byDeadline: unknown;
    try {
      await researchLead(vi.fn().mockRejectedValue(transient()), input, {
        maxAttempts: 10,
        deadlineMs: 1,
        sleep: async () => {
          vi.setSystemTime(new Date(START + 10_000));
        },
      });
    } catch (error) {
      byDeadline = error;
    }
    expect(byDeadline).toBeInstanceOf(ResearchAbortedError);
    expect((byDeadline as ResearchAbortedError).reason).toBe('deadline');
    vi.useRealTimers();
  });

  it('clamps a backoff so it cannot outlive the deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(START));
    const slept: number[] = [];
    const model = vi.fn().mockRejectedValue(transient());

    await researchLead(model, input, {
      maxAttempts: 4,
      deadlineMs: 2_000,
      random: () => 1, // draw the full cap
      sleep: async (ms: number) => {
        slept.push(ms);
        vi.setSystemTime(new Date(START + slept.reduce((a, b) => a + b, 0)));
      },
    }).catch(() => undefined);

    // The uncapped draw would have been 1000, 2000, 4000... Every actual
    // wait fits inside the 2s budget.
    expect(slept.every((ms) => ms <= 2_000)).toBe(true);
    expect(slept.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(2_000);
    vi.useRealTimers();
  });

  it('is unchanged when neither a signal nor a deadline is supplied', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: validResearch() });
    const outcome = await researchLead(model, input);
    expect(outcome.attempts).toBe(1);
    expect(model.mock.calls[0]![0].signal).toBeUndefined();
  });
});
