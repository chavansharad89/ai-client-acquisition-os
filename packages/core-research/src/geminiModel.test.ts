import { describe, expect, it, vi } from 'vitest';

import { ProviderHttpError } from './errors';
import { createGeminiResearchModel, GeminiConfigError, toGeminiSchema } from './geminiModel';
import { zodToJsonSchema } from './jsonSchema';
import { leadResearchSchema } from './schema';

// Adapter-level tests (Multi-Model Research Provider — structured output,
// per requirement/MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §5).
// No network call — fetchImpl is faked.

function fakeResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

const REQUEST = {
  system: 'system prompt',
  messages: [
    { role: 'user' as const, content: 'hi' },
    { role: 'assistant' as const, content: 'reply' },
  ],
};

describe('toGeminiSchema', () => {
  it('translates the shared JSON Schema into Gemini\'s dialect: uppercase types, nullable, no $ref', () => {
    // Without the `defs` dedup option, exactly like geminiModel.ts calls it.
    const schema = toGeminiSchema(zodToJsonSchema(leadResearchSchema));

    expect(schema.type).toBe('OBJECT');
    expect(schema).not.toHaveProperty('$defs');
    expect(JSON.stringify(schema)).not.toContain('$ref');
    expect(JSON.stringify(schema)).not.toContain('anyOf');

    const properties = schema.properties as Record<string, { type?: string }>;
    // companySummary is a nullable-`value` Observation object — must
    // survive translation as OBJECT, not throw on the nullable anyOf.
    expect(properties.companySummary?.type).toBe('OBJECT');
    // visibleProblems is an array of Observation.
    expect(properties.visibleProblems?.type).toBe('ARRAY');
  });

  it('converts a nullable field (anyOf + null) into `nullable: true`', () => {
    const node = { anyOf: [{ type: 'string' }, { type: 'null' }] };
    expect(toGeminiSchema(node)).toEqual({ type: 'STRING', nullable: true });
  });

  it('preserves enum values on a translated string field', () => {
    const node = { type: 'string', enum: ['OBSERVED', 'INFERRED', 'UNKNOWN'] };
    expect(toGeminiSchema(node)).toEqual({ type: 'STRING', enum: ['OBSERVED', 'INFERRED', 'UNKNOWN'] });
  });
});

describe('createGeminiResearchModel', () => {
  it('requires an apiKey', () => {
    expect(() => createGeminiResearchModel({ model: 'gemini-test' })).toThrow(GeminiConfigError);
  });

  it('requires an explicit model — no default is assumed', () => {
    expect(() => createGeminiResearchModel({ apiKey: 'k' } as never)).toThrow(GeminiConfigError);
  });

  it('maps system -> systemInstruction and messages -> contents/parts with role translation', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | RequestInfo, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return fakeResponse({
        responseId: 'resp-1',
        candidates: [{ content: { parts: [{ text: '{"ok":true}' }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
      });
    });

    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const result = await model(REQUEST);

    expect(capturedBody?.systemInstruction).toEqual({ parts: [{ text: 'system prompt' }] });
    expect(capturedBody?.contents).toEqual([
      { role: 'user', parts: [{ text: 'hi' }] },
      { role: 'model', parts: [{ text: 'reply' }] }, // 'assistant' -> 'model'
    ]);
    const generationConfig = capturedBody?.generationConfig as Record<string, unknown>;
    expect(generationConfig.responseMimeType).toBe('application/json');
    expect(generationConfig.responseSchema).toBeDefined();

    expect(result.kind).toBe('json');
    if (result.kind === 'json') expect(result.value).toEqual({ ok: true });
  });

  it('sends the API key via the x-goog-api-key header, never a query string', async () => {
    let capturedUrl = '';
    let capturedHeaders: Record<string, string> | undefined;
    const fetchImpl = vi.fn(async (url: string | URL | RequestInfo, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedHeaders = init?.headers as Record<string, string>;
      return fakeResponse({
        responseId: 'r',
        candidates: [{ content: { parts: [{ text: '{}' }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });
    });
    const model = createGeminiResearchModel({
      apiKey: 'gm-super-secret-not-real',
      model: 'gemini-test',
      fetchImpl,
    });
    await model(REQUEST);
    expect(capturedUrl).not.toContain('gm-super-secret-not-real');
    expect(capturedHeaders?.['x-goog-api-key']).toBe('gm-super-secret-not-real');
  });

  it('extracts usage — input/output tokens required, cache field nullable when absent', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        responseId: 'r',
        candidates: [{ content: { parts: [{ text: '{}' }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 42, candidatesTokenCount: 7 },
      }),
    );
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const result = await model(REQUEST);
    expect(result.usage).toEqual({
      provider: 'gemini',
      model: 'gemini-test',
      providerMessageId: 'r',
      inputTokens: 42,
      outputTokens: 7,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    });
  });

  it('falls back to a deterministic content hash for providerMessageId when responseId is absent', async () => {
    const body = {
      candidates: [{ content: { parts: [{ text: '{}' }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
    };
    const fetchImpl = vi.fn(async () => fakeResponse(body));
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const result1 = await model(REQUEST);
    const result2 = await model(REQUEST);
    // Deterministic (not random): the identical response body must
    // produce the identical id both times, preserving R-29 idempotency.
    expect(result1.usage?.providerMessageId).toBe(result2.usage?.providerMessageId);
    expect(result1.usage?.providerMessageId).toMatch(/^gemini-sha256-/);
  });

  it('maps promptFeedback.blockReason (fully blocked prompt) to a refusal', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({ promptFeedback: { blockReason: 'SAFETY' } }),
    );
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const result = await model(REQUEST);
    expect(result).toMatchObject({ kind: 'refusal', category: 'SAFETY' });
  });

  it('maps a candidate finishReason of SAFETY to a refusal', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        responseId: 'r',
        candidates: [{ content: { parts: [] }, finishReason: 'SAFETY' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
      }),
    );
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const result = await model(REQUEST);
    expect(result).toMatchObject({ kind: 'refusal', category: 'SAFETY' });
  });

  it('does NOT treat MAX_TOKENS as a refusal — falls through to normal json/repair handling', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        responseId: 'r',
        candidates: [{ content: { parts: [{ text: '{"partial":' }] }, finishReason: 'MAX_TOKENS' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      }),
    );
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    // Malformed/truncated JSON throws (same "always parse" behavior as
    // every other adapter) rather than being silently classified as a refusal.
    await expect(model(REQUEST)).rejects.toThrow();
  });

  it('throws on invalid JSON content', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        responseId: 'r',
        candidates: [{ content: { parts: [{ text: 'not json{{{' }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      }),
    );
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    await expect(model(REQUEST)).rejects.toThrow();
  });

  it('throws when the model returns no text content', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        responseId: 'r',
        candidates: [{ content: { parts: [] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
      }),
    );
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    await expect(model(REQUEST)).rejects.toThrow(/no text content/);
  });

  it('throws a ProviderHttpError carrying the HTTP status on a transient failure (e.g. 429)', async () => {
    const fetchImpl = vi.fn(async () => fakeResponse({ error: 'rate limited' }, { ok: false, status: 429 }));
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const error = await model(REQUEST).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderHttpError);
    expect((error as ProviderHttpError).status).toBe(429);
  });

  it('throws a ProviderHttpError on an authentication failure (401/403)', async () => {
    const fetchImpl = vi.fn(async () => fakeResponse({ error: 'bad key' }, { ok: false, status: 403 }));
    const model = createGeminiResearchModel({ apiKey: 'k', model: 'gemini-test', fetchImpl });
    const error = await model(REQUEST).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderHttpError);
    expect((error as ProviderHttpError).status).toBe(403);
  });
});
