import { describe, expect, it, vi } from 'vitest';

import { ProviderHttpError } from './errors';
import { createOpenAIResearchModel, OpenAIConfigError } from './openAIModel';

// Adapter-level tests (Multi-Model Research Provider — structured output,
// per requirement/MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §4).
// No network call — fetchImpl is faked, mirroring
// sourceDocumentProvider.test.ts's own convention for this package.

function fakeResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

const REQUEST = { system: 'system prompt', messages: [{ role: 'user' as const, content: 'hi' }] };

describe('createOpenAIResearchModel', () => {
  it('requires an apiKey', () => {
    expect(() => createOpenAIResearchModel({ model: 'gpt-test' })).toThrow(OpenAIConfigError);
  });

  it('requires an explicit model — no default is assumed', () => {
    expect(() => createOpenAIResearchModel({ apiKey: 'k' } as never)).toThrow(OpenAIConfigError);
  });

  it('sends system + messages + the shared JSON schema, and returns a parsed json result', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | RequestInfo, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return fakeResponse({
        id: 'chatcmpl-abc123',
        choices: [{ message: { content: '{"ok":true}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });
    });

    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const result = await model(REQUEST);

    expect(result.kind).toBe('json');
    if (result.kind === 'json') expect(result.value).toEqual({ ok: true });

    expect(capturedBody?.model).toBe('gpt-test');
    expect(capturedBody?.messages).toEqual([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hi' },
    ]);
    expect(capturedBody?.response_format).toMatchObject({ type: 'json_schema' });
  });

  // G-7 (G7-PO-DEC-001 / F-1 §16 / D11 §7): adapter-level translation of
  // the extended category-plausibility segment, asserted on the request
  // body this adapter actually sends.
  it('sends the extended F-1 segment schema under strict structured outputs', async () => {
    let capturedBody: { response_format: { type: string; json_schema: Record<string, unknown> } } | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | RequestInfo, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return fakeResponse({
        id: 'chatcmpl-g7',
        choices: [{ message: { content: '{}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      });
    });
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    await model(REQUEST);

    const jsonSchema = capturedBody?.response_format.json_schema;
    expect(capturedBody?.response_format.type).toBe('json_schema');
    expect(jsonSchema?.name).toBe('lead_research');
    expect(jsonSchema?.strict).toBe(true);

    type Node = Record<string, unknown>;
    const schema = jsonSchema?.schema as Node & { properties: Record<string, Node> };
    const segments = schema.properties.categoryPlausibility as { type: string; items: Node };
    expect(segments.type).toBe('array');

    const item = segments.items as { properties: Record<string, Node>; required: string[]; additionalProperties: unknown };
    expect(Object.keys(item.properties)).toEqual(['fit', 'rationale', 'evidence', 'confidence']);
    expect(item.required).toEqual(['fit', 'rationale', 'evidence', 'confidence']);
    expect(item.additionalProperties).toBe(false);
    expect(item.properties).not.toHaveProperty('basis');
    expect(item.properties).not.toHaveProperty('classification');

    expect(item.properties.fit).toMatchObject({ type: 'string', enum: ['MATCH', 'MISMATCH', 'UNKNOWN'] });
    expect(item.properties.confidence).toMatchObject({ type: 'integer' });
    expect(item.properties.confidence?.description).toContain('1-100 for MATCH/MISMATCH');
    expect(item.properties.confidence?.description).toContain('exactly 0 for UNKNOWN');
    expect((item.properties.rationale as { anyOf: Node[] }).anyOf).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'string' }), { type: 'null' }]),
    );
    expect(item.properties.evidence).toMatchObject({ type: 'array' });

    // Strict mode requires every object — segment, evidence, and every
    // $defs entry — to list all its keys as required and forbid extras.
    const objects: Node[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      const n = node as Node;
      if (n.type === 'object') objects.push(n);
      Object.values(n).forEach(walk);
    };
    walk(schema);
    expect(objects.length).toBeGreaterThan(2);
    for (const object of objects) {
      expect(object.additionalProperties).toBe(false);
      expect(object.required).toEqual(Object.keys(object.properties as Node));
    }
  });

  it('extracts usage — input/output tokens required, cache fields nullable when absent', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        id: 'chatcmpl-usage',
        choices: [{ message: { content: '{}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 42, completion_tokens: 7 },
      }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const result = await model(REQUEST);

    expect(result.usage).toEqual({
      provider: 'openai',
      model: 'gpt-test',
      providerMessageId: 'chatcmpl-usage',
      inputTokens: 42,
      outputTokens: 7,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    });
  });

  it('extracts the provider response id for R-29 idempotency', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        id: 'chatcmpl-request-id-123',
        choices: [{ message: { content: '{}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const result = await model(REQUEST);
    expect(result.usage?.providerMessageId).toBe('chatcmpl-request-id-123');
  });

  it('maps an explicit refusal field to ModelResult.kind = "refusal"', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        id: 'chatcmpl-refusal',
        choices: [{ message: { refusal: 'cannot help with that' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const result = await model(REQUEST);
    expect(result).toMatchObject({ kind: 'refusal', category: 'cannot help with that' });
  });

  it('maps finish_reason "content_filter" to a refusal', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        id: 'chatcmpl-filtered',
        choices: [{ message: { content: null }, finish_reason: 'content_filter' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const result = await model(REQUEST);
    expect(result).toMatchObject({ kind: 'refusal', category: 'content_filter' });
  });

  it('throws on invalid JSON content — same "always parse" behavior as the Anthropic adapter', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        id: 'chatcmpl-malformed',
        choices: [{ message: { content: 'not json{{{' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    await expect(model(REQUEST)).rejects.toThrow();
  });

  it('throws when the model returns no text content', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({
        id: 'chatcmpl-empty',
        choices: [{ message: { content: '' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    await expect(model(REQUEST)).rejects.toThrow(/no text content/);
  });

  it('throws a ProviderHttpError carrying the HTTP status on a transient failure (e.g. 429)', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({ error: { message: 'rate limited' } }, { ok: false, status: 429 }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const error = await model(REQUEST).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderHttpError);
    expect((error as ProviderHttpError).status).toBe(429);
  });

  it('throws a ProviderHttpError on an authentication failure (401)', async () => {
    const fetchImpl = vi.fn(async () =>
      fakeResponse({ error: { message: 'invalid api key' } }, { ok: false, status: 401 }),
    );
    const model = createOpenAIResearchModel({ apiKey: 'k', model: 'gpt-test', fetchImpl });
    const error = await model(REQUEST).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderHttpError);
    expect((error as ProviderHttpError).status).toBe(401);
  });

  it('never puts the API key in the request body, only the Authorization header', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    let capturedBody: string | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | RequestInfo, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      capturedBody = init?.body as string;
      return fakeResponse({
        id: 'chatcmpl-1',
        choices: [{ message: { content: '{}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      });
    });
    const model = createOpenAIResearchModel({
      apiKey: 'sk-super-secret-not-real',
      model: 'gpt-test',
      fetchImpl,
    });
    await model(REQUEST);
    expect(capturedHeaders?.Authorization).toBe('Bearer sk-super-secret-not-real');
    expect(capturedBody).not.toContain('sk-super-secret-not-real');
  });
});
