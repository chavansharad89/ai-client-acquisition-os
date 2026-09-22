import { describe, expect, it, vi } from 'vitest';

import { InsufficientEvidenceError } from './anthropicResearchProvider';
import { createFallbackResearchProvider } from './fallbackResearchProvider';
import { ResearchProviderError, ResearchRefusedError } from './index';
import type { ModelInvocationUsage, ModelResult, ResearchModel } from './researcher';
import { leadResearchSchema, type LeadResearch } from './schema';
import type { SourceDocumentProvider } from './sourceDocumentProvider';

// Cross-provider fallback (requirement/
// MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §6/§7 — "Option A,
// refined"). Every scenario the technical spike and the decision review
// require is exercised here with fake ResearchModels — no network call.

const HOMEPAGE = {
  label: 'homepage',
  url: 'https://acme.test/about',
  text: 'Acme sells warehouse robotics. We have shipped to 40 distribution centres.',
};

const observed = (value: string, quote: string = value) => ({
  classification: 'OBSERVED' as const,
  value,
  evidence: [{ quote, sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label }],
  basis: null,
  confidence: 90,
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
    businessModel: unknown(),
    targetCustomers: unknown(),
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient signal', basedOn: [] },
    confidence: 50,
    gaps: [],
  });

/** Schema-valid, but the evidence quote never occurs in any supplied source document. */
const evidenceInvalidResearch = (): LeadResearch => ({
  ...validResearch(),
  companySummary: observed('Acme sells warehouse robotics', 'a sentence nobody actually wrote'),
});

function fakeUsage(provider: string): ModelInvocationUsage {
  return {
    provider,
    model: `${provider}-test-model`,
    providerMessageId: `${provider}-msg-${Math.random()}`,
    inputTokens: 10,
    outputTokens: 5,
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
  };
}

function okModel(provider: string): ResearchModel {
  return vi.fn(
    async (): Promise<ModelResult> => ({ kind: 'json', value: validResearch(), usage: fakeUsage(provider) }),
  );
}

function throwingModel(provider: string, error: unknown): ResearchModel {
  return vi.fn(async () => {
    throw error;
  });
}

function fakeSourceDocuments(): SourceDocumentProvider {
  return { fetchSourceDocuments: vi.fn(async () => [HOMEPAGE]) };
}

const INPUT = {
  prospectId: 'prospect_1',
  companyId: 'company_1',
  companyName: 'Acme Robotics',
  normalizedDomain: 'acme.test',
};

// Fast, deterministic retry budget for every test below — the fallback
// wrapper's own eligibility logic is what's under test, not backoff timing.
const FAST_RETRY = { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0, random: () => 0 };

describe('createFallbackResearchProvider — successful primary (no fallback)', () => {
  it('returns the primary result and never calls the fallback model', async () => {
    const primary = okModel('anthropic');
    const fallback = vi.fn(async () => {
      throw new Error('fallback must never be called when the primary succeeds');
    });
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: FAST_RETRY,
    });

    const result = await provider.research(INPUT);
    expect(result).toEqual(validResearch());
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });
});

describe('createFallbackResearchProvider — source-document fetching', () => {
  it('fetches source documents exactly once, even when the primary fails and a fallback runs', async () => {
    const sourceDocuments = fakeSourceDocuments();
    const primary = throwingModel('anthropic', new ResearchProviderError('rate limited', 429, true));
    const fallback = okModel('openai');
    const provider = createFallbackResearchProvider({
      sourceDocuments,
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: FAST_RETRY,
    });

    const result = await provider.research(INPUT);
    expect(result).toEqual(validResearch());
    expect(sourceDocuments.fetchSourceDocuments).toHaveBeenCalledTimes(1);
  });

  it('throws InsufficientEvidenceError, with no attempt made, when no source document is found', async () => {
    const sourceDocuments: SourceDocumentProvider = { fetchSourceDocuments: vi.fn(async () => []) };
    const primary = vi.fn(async () => {
      throw new Error('must never be called with zero source documents');
    });
    const provider = createFallbackResearchProvider({
      sourceDocuments,
      attempts: [{ provider: 'anthropic', model: primary }],
    });
    await expect(provider.research(INPUT)).rejects.toBeInstanceOf(InsufficientEvidenceError);
    expect(primary).not.toHaveBeenCalled();
  });
});

describe('createFallbackResearchProvider — FALLBACK-ELIGIBLE failures', () => {
  it.each([
    ['timeout', new ResearchProviderError('timeout', 408, true)],
    ['rate limit', new ResearchProviderError('rate limited', 429, true)],
    ['provider outage', new ResearchProviderError('outage', 503, true)],
    ['authentication failure', new ResearchProviderError('bad key', 401, false)],
    // No distinct signal exists per-vendor for this yet (technical spike
    // §5's open item) — it still surfaces as ResearchProviderError today.
    ['context-length failure', new ResearchProviderError('too long', 400, false)],
  ])('falls back to the next provider on %s', async (_label, error) => {
    const primary = throwingModel('anthropic', error);
    const fallback = okModel('openai');
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: FAST_RETRY,
    });

    const result = await provider.research(INPUT);
    expect(result).toEqual(validResearch());
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('exhausts the primary\'s own retry budget before falling back — not on the first retryable error', async () => {
    const primary = throwingModel('anthropic', new ResearchProviderError('rate limited', 429, true));
    const fallback = okModel('openai');
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: { ...FAST_RETRY, maxAttempts: 3 },
    });

    await provider.research(INPUT);
    // researchLead()'s own retry loop, unmodified, calls the primary up
    // to maxAttempts times before this wrapper ever sees the failure.
    expect(primary).toHaveBeenCalledTimes(3);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('propagates the last error when every attempt in the chain is exhausted', async () => {
    const primary = throwingModel('anthropic', new ResearchProviderError('outage', 503, true));
    const secondary = throwingModel('openai', new ResearchProviderError('outage', 503, true));
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: secondary },
      ],
      researchOptions: FAST_RETRY,
    });
    await expect(provider.research(INPUT)).rejects.toBeInstanceOf(ResearchProviderError);
  });
});

describe('createFallbackResearchProvider — FALLBACK-INELIGIBLE failures', () => {
  it('does NOT fall back on a provider refusal', async () => {
    const primary: ResearchModel = vi.fn(
      async (): Promise<ModelResult> => ({ kind: 'refusal', category: 'policy', usage: fakeUsage('anthropic') }),
    );
    const fallback = vi.fn(async () => {
      throw new Error('fallback must never be called after a refusal');
    });
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: FAST_RETRY,
    });
    await expect(provider.research(INPUT)).rejects.toBeInstanceOf(ResearchRefusedError);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('does NOT fall back on a schema-validation failure (repair loop exhausted)', async () => {
    const primary: ResearchModel = vi.fn(
      async (): Promise<ModelResult> => ({
        kind: 'json',
        value: { totally: 'the wrong shape' },
        usage: fakeUsage('anthropic'),
      }),
    );
    const fallback = vi.fn(async () => {
      throw new Error('fallback must never be called after schema validation exhausts');
    });
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: FAST_RETRY,
    });
    await expect(provider.research(INPUT)).rejects.toThrow(/failed validation/);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('does NOT fall back on an evidence/provenance-validation failure (fabricated quote)', async () => {
    const primary: ResearchModel = vi.fn(
      async (): Promise<ModelResult> => ({
        kind: 'json',
        value: evidenceInvalidResearch(),
        usage: fakeUsage('anthropic'),
      }),
    );
    const fallback = vi.fn(async () => {
      throw new Error('fallback must never be called after provenance verification exhausts');
    });
    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      researchOptions: FAST_RETRY,
    });
    await expect(provider.research(INPUT)).rejects.toThrow(/failed validation/);
    expect(fallback).not.toHaveBeenCalled();
  });
});

describe('createFallbackResearchProvider — R-29 metering', () => {
  it('tags every invocation from a non-primary provider with requestKind "fallback", preserving provider/model identity per call', async () => {
    const primary = throwingModel('anthropic', new ResearchProviderError('outage', 503, true));
    const fallback = okModel('openai');
    const events: { provider: string; requestKind: string }[] = [];

    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [
        { provider: 'anthropic', model: primary },
        { provider: 'openai', model: fallback },
      ],
      onUsage: (usage, requestKind) => {
        events.push({ provider: usage.provider, requestKind });
      },
      researchOptions: FAST_RETRY,
    });

    await provider.research(INPUT);

    // The primary never returns a response (it always throws), so it
    // never fires onUsage — R-29 already never meters a call that fails
    // before producing a response (scope lock D7), unchanged here.
    expect(events).toEqual([{ provider: 'openai', requestKind: 'fallback' }]);
  });

  it('reports the inner call\'s own initial/repair distinction, unchanged, for the PRIMARY attempt', async () => {
    const primary = okModel('anthropic');
    const events: { provider: string; requestKind: string }[] = [];

    const provider = createFallbackResearchProvider({
      sourceDocuments: fakeSourceDocuments(),
      attempts: [{ provider: 'anthropic', model: primary }],
      onUsage: (usage, requestKind) => {
        events.push({ provider: usage.provider, requestKind });
      },
      researchOptions: FAST_RETRY,
    });

    await provider.research(INPUT);
    expect(events).toEqual([{ provider: 'anthropic', requestKind: 'initial' }]);
  });
});
