import { describe, expect, it, vi } from 'vitest';

import {
  createAnthropicResearchProvider,
  InsufficientEvidenceError,
} from './anthropicResearchProvider';
import type { ModelInvocationUsage, ModelResult, ResearchModel } from './researcher';
import type { LeadResearch } from './schema';
import { SourceFetchTransportError, type SourceDocumentProvider } from './sourceDocumentProvider';

// Phase 18 — the concrete ResearchProvider composing SourceDocumentProvider
// + researchLead() + an onUsage metering hook. No real Anthropic call: the
// model is a fake ResearchModel, the same injection technique
// anthropicModel.test.ts uses for the SDK client.

const unknownField = () => ({
  classification: 'UNKNOWN' as const,
  value: null,
  evidence: [],
  basis: null,
  confidence: 0,
});

function sampleLeadResearch(): LeadResearch {
  return {
    companySummary: unknownField(),
    businessModel: unknownField(),
    targetCustomers: unknownField(),
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 40,
    gaps: [],
  } as unknown as LeadResearch;
}

function fakeUsage(overrides: Partial<ModelInvocationUsage> = {}): ModelInvocationUsage {
  return {
    provider: 'anthropic',
    model: 'claude-opus-5',
    providerMessageId: 'msg_1',
    inputTokens: 100,
    outputTokens: 50,
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
    ...overrides,
  };
}

function fakeSourceDocuments(
  docs: readonly { label: string; url: string; text: string }[] | (() => Promise<never>),
): SourceDocumentProvider {
  return {
    async fetchSourceDocuments() {
      if (typeof docs === 'function') return docs();
      return docs;
    },
  };
}

const ONE_DOC = [{ label: 'Homepage', url: 'https://acme.example.com', text: 'A'.repeat(300) }];

describe('createAnthropicResearchProvider', () => {
  it('passes fetched source documents into the research input and returns the model result', async () => {
    let seenSourceDocuments: unknown;
    const model: ResearchModel = vi.fn(async (request) => {
      seenSourceDocuments = request.messages;
      return { kind: 'json', value: sampleLeadResearch(), usage: fakeUsage() } satisfies ModelResult;
    });

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fakeSourceDocuments(ONE_DOC),
    });

    const result = await provider.research({
      prospectId: 'prospect_1',
      companyId: 'company_1',
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(result).toEqual(sampleLeadResearch());
    expect(model).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(seenSourceDocuments)).toContain('acme.example.com');
  });

  it('throws InsufficientEvidenceError without invoking the model when no source documents are found', async () => {
    const model: ResearchModel = vi.fn();
    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fakeSourceDocuments([]),
    });

    await expect(
      provider.research({
        prospectId: 'prospect_1',
        companyId: 'company_1',
        companyName: 'Acme',
        normalizedDomain: 'acme.example.com',
      }),
    ).rejects.toBeInstanceOf(InsufficientEvidenceError);
    expect(model).not.toHaveBeenCalled();
  });

  it('propagates a SourceFetchTransportError unchanged — never converts it into InsufficientEvidenceError', async () => {
    const model: ResearchModel = vi.fn();
    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fakeSourceDocuments(async () => {
        throw new SourceFetchTransportError('source homepage unreachable');
      }),
    });

    await expect(
      provider.research({
        prospectId: 'prospect_1',
        companyId: 'company_1',
        companyName: 'Acme',
        normalizedDomain: 'acme.example.com',
      }),
    ).rejects.toBeInstanceOf(SourceFetchTransportError);
    expect(model).not.toHaveBeenCalled();
  });

  it('calls onUsage exactly once per invocation, with the correct prospectId', async () => {
    const model: ResearchModel = vi.fn(
      async (): Promise<ModelResult> => ({ kind: 'json', value: sampleLeadResearch(), usage: fakeUsage() }),
    );
    const onUsage = vi.fn();

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fakeSourceDocuments(ONE_DOC),
      onUsage,
    });

    await provider.research({
      prospectId: 'prospect_42',
      companyId: 'company_1',
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(onUsage).toHaveBeenCalledTimes(1);
    expect(onUsage).toHaveBeenCalledWith(fakeUsage(), 'initial', 'prospect_42');
  });

  it('propagates a model error without calling onUsage (no fabricated usage event)', async () => {
    const model: ResearchModel = vi.fn(async () => {
      throw new Error('model unavailable');
    });
    const onUsage = vi.fn();

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fakeSourceDocuments(ONE_DOC),
      onUsage,
    });

    await expect(
      provider.research({
        prospectId: 'prospect_1',
        companyId: 'company_1',
        companyName: 'Acme',
        normalizedDomain: 'acme.example.com',
      }),
    ).rejects.toThrow('model unavailable');
    expect(onUsage).not.toHaveBeenCalled();
  });

  it('meters each repair-round invocation as its own distinct event, never deduplicated', async () => {
    let call = 0;
    const model: ResearchModel = vi.fn(async (): Promise<ModelResult> => {
      call += 1;
      if (call === 1) {
        // Schema-invalid first response — triggers a repair round.
        return {
          kind: 'json',
          value: { ...sampleLeadResearch(), confidence: 'not-a-number' },
          usage: fakeUsage({ providerMessageId: 'msg_1' }),
        };
      }
      return { kind: 'json', value: sampleLeadResearch(), usage: fakeUsage({ providerMessageId: 'msg_2' }) };
    });
    const onUsage = vi.fn();

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fakeSourceDocuments(ONE_DOC),
      onUsage,
    });

    await provider.research({
      prospectId: 'prospect_1',
      companyId: 'company_1',
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(onUsage).toHaveBeenCalledTimes(2);
    const messageIds = onUsage.mock.calls.map((call) => call[0].providerMessageId);
    expect(messageIds).toEqual(['msg_1', 'msg_2']);
  });
});
