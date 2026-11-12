import { describe, expect, it } from 'vitest';

import {
  createResearchModel,
  isResearchProviderName,
  MissingResearchModelError,
  MissingResearchProviderCredentialError,
  RESEARCH_PROVIDER_NAMES,
  UnknownResearchProviderError,
} from './researchModelFactory';

// Provider + model selection (requirement/
// MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md Decision 1/§8). The
// ONE place allowed to branch on provider identity — these tests prove
// selection, unknown-provider rejection, and missing-credential handling
// all happen HERE, at construction, never as a runtime surprise deeper
// in the orchestration.

describe('RESEARCH_PROVIDER_NAMES / isResearchProviderName', () => {
  it('lists exactly the initial supported providers', () => {
    expect(RESEARCH_PROVIDER_NAMES).toEqual(['anthropic', 'openai', 'gemini']);
  });

  it('recognizes only the supported provider names', () => {
    expect(isResearchProviderName('anthropic')).toBe(true);
    expect(isResearchProviderName('openai')).toBe(true);
    expect(isResearchProviderName('gemini')).toBe(true);
    expect(isResearchProviderName('grok')).toBe(false);
    expect(isResearchProviderName('')).toBe(false);
  });
});

describe('createResearchModel — Anthropic selection', () => {
  it('builds an Anthropic ResearchModel when the credential is supplied', () => {
    const model = createResearchModel({ provider: 'anthropic', anthropicApiKey: 'sk-ant-not-real' });
    expect(typeof model).toBe('function');
  });

  it('rejects Anthropic selection without its credential — deterministic, at instantiation', () => {
    expect(() => createResearchModel({ provider: 'anthropic' })).toThrow(
      MissingResearchProviderCredentialError,
    );
  });

  it('names the missing env var in the error, for an actionable failure', () => {
    try {
      createResearchModel({ provider: 'anthropic' });
      expect.unreachable('expected a credential error');
    } catch (error) {
      expect((error as MissingResearchProviderCredentialError).envVar).toBe('ANTHROPIC_API_KEY');
    }
  });

  it('leaves unrelated (unset) OpenAI/Gemini credentials untouched — an Anthropic-only selection never validates them', () => {
    expect(() =>
      createResearchModel({ provider: 'anthropic', anthropicApiKey: 'sk-ant-not-real' }),
    ).not.toThrow();
  });
});

describe('createResearchModel — OpenAI selection', () => {
  it('builds an OpenAI ResearchModel when apiKey and model are both supplied', () => {
    const model = createResearchModel({ provider: 'openai', openAIApiKey: 'sk-openai-not-real', model: 'gpt-test' });
    expect(typeof model).toBe('function');
  });

  it('rejects OpenAI selection without its credential', () => {
    expect(() => createResearchModel({ provider: 'openai', model: 'gpt-test' })).toThrow(
      MissingResearchProviderCredentialError,
    );
  });

  it('rejects OpenAI selection without an explicit model — no default is assumed', () => {
    expect(() => createResearchModel({ provider: 'openai', openAIApiKey: 'sk-openai-not-real' })).toThrow(
      MissingResearchModelError,
    );
  });
});

describe('createResearchModel — Gemini selection', () => {
  it('builds a Gemini ResearchModel when apiKey and model are both supplied', () => {
    const model = createResearchModel({ provider: 'gemini', geminiApiKey: 'gm-not-real', model: 'gemini-test' });
    expect(typeof model).toBe('function');
  });

  it('rejects Gemini selection without its credential', () => {
    expect(() => createResearchModel({ provider: 'gemini', model: 'gemini-test' })).toThrow(
      MissingResearchProviderCredentialError,
    );
  });

  it('rejects Gemini selection without an explicit model — no default is assumed', () => {
    expect(() => createResearchModel({ provider: 'gemini', geminiApiKey: 'gm-not-real' })).toThrow(
      MissingResearchModelError,
    );
  });
});

describe('createResearchModel — unknown provider rejection', () => {
  it('rejects a provider name outside the supported set', () => {
    expect(() =>
      createResearchModel({ provider: 'grok' as never, anthropicApiKey: 'x' }),
    ).toThrow(UnknownResearchProviderError);
  });
});
