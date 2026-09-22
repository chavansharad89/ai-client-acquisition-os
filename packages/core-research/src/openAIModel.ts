import { ProviderHttpError } from './errors';
import { zodToJsonSchema } from './jsonSchema';
import type { ModelInvocationUsage, ModelResult, ResearchModel } from './researcher';
import { leadResearchSchema, observationSchema } from './schema';

// The OpenAI adapter (Multi-Model Research Provider — initial candidate,
// requirement/MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §4).
// -----------------------------------------------------------------------
// The only file that talks to OpenAI. Everything else — schema, prompt,
// retry, persistence, provenance — is unmodified and identical to the
// Anthropic path; this file exists only to translate ResearchModel's
// {system, messages, signal} request into OpenAI's Chat Completions
// request shape and translate its response back into ModelResult.
//
// Implemented against the raw HTTP API via `fetch`, not the `openai`
// npm package — mirroring this package's own stated preference
// (jsonSchema.ts: "the dependency is another supply-chain surface in a
// payments monorepo") and sourceDocumentProvider.ts's existing
// `fetchImpl` injection pattern, reused here unchanged for testability.
//
// The exact acceptance of the JSON Schema `zodToJsonSchema()` already
// produces, and the exact refusal/error response shapes below, are
// UNVERIFIED against a live OpenAI call — see the technical spike's
// OpenAI section. Nothing here fabricates a live-verified claim; the
// mapping follows OpenAI's publicly documented Chat Completions +
// structured-outputs request/response shape.
// -----------------------------------------------------------------------

/** Thrown for a missing key or model — a wiring fault, never an attacker's doing. */
export class OpenAIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIConfigError';
  }
}

export interface OpenAIModelOptions {
  /** Required. Never read from process.env by this module — see createOpenAIResearchModel. */
  apiKey?: string;
  /**
   * Required. No default is supplied — this package's requirement
   * documents deliberately avoid prescribing an OpenAI model identifier
   * without an authoritative source, so a caller must choose one
   * explicitly (see requirement/MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md §7).
   */
  model: string;
  maxTokens?: number;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_MAX_TOKENS = 16_000;
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

interface OpenAIChatResponse {
  id: string;
  choices?: {
    message?: { content?: string | null; refusal?: string | null };
    finish_reason?: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

/**
 * Builds the research model. `apiKey` and `model` are REQUIRED and
 * explicit, mirroring createAnthropicResearchModel's own rule: never
 * read from the ambient environment by this module. Supply
 * `loadEnv().OPENAI_API_KEY` / `loadEnv().RESEARCH_MODEL` at the call
 * site.
 */
export function createOpenAIResearchModel(options: OpenAIModelOptions): ResearchModel {
  if (!options.apiKey?.trim()) {
    throw new OpenAIConfigError(
      'createOpenAIResearchModel needs an apiKey (pass loadEnv().OPENAI_API_KEY). ' +
        'It will not read the ambient environment.',
    );
  }
  if (!options.model?.trim()) {
    throw new OpenAIConfigError('createOpenAIResearchModel needs an explicit model identifier.');
  }

  const apiKey = options.apiKey;
  const model = options.model;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return async ({ system, messages, signal }): Promise<ModelResult> => {
    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          ...messages.map((message) => ({ role: message.role, content: message.content })),
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'lead_research',
            strict: true,
            // Identical, unmodified output to the Anthropic path — the
            // $defs/$ref dedup this produces for `observationSchema` was
            // tuned to a documented Anthropic parameter-count limit, but
            // is standard JSON Schema and not incorrect for OpenAI; Zod
            // remains the authoritative post-parse validator regardless.
            schema: zodToJsonSchema(leadResearchSchema, { defs: { Observation: observationSchema } }),
          },
        },
      }),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ProviderHttpError(
        `OpenAI research model call failed (HTTP ${response.status}): ${body.slice(0, 500)}`,
        response.status,
      );
    }

    const data = (await response.json()) as OpenAIChatResponse;
    const choice = data.choices?.[0];

    const usage: ModelInvocationUsage = {
      provider: 'openai',
      model,
      providerMessageId: data.id,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: data.usage?.prompt_tokens_details?.cached_tokens ?? null,
    };

    // A refusal surfaces as a distinct `message.refusal` string, or as
    // `finish_reason: 'content_filter'` — both treated as a safety
    // decline, never as malformed JSON to repair.
    if (choice?.message?.refusal) {
      return { kind: 'refusal', category: choice.message.refusal, usage };
    }
    if (choice?.finish_reason === 'content_filter') {
      return { kind: 'refusal', category: 'content_filter', usage };
    }

    const text = choice?.message?.content ?? '';
    if (!text.trim()) {
      throw new Error('the model returned no text content');
    }

    // Always parse, never string-match — mirrors anthropicModel.ts.
    // An unparseable body surfaces as a thrown SyntaxError here, exactly
    // as it already does for the Anthropic adapter; researchLead()'s own
    // retry/repair handling is unchanged by which adapter produced it.
    return { kind: 'json', value: JSON.parse(text) as unknown, usage };
  };
}
