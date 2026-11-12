import { createHash } from 'node:crypto';

import { ProviderHttpError } from './errors';
import { zodToJsonSchema } from './jsonSchema';
import type { ModelInvocationUsage, ModelResult, ResearchModel } from './researcher';
import { leadResearchSchema } from './schema';

// The Gemini adapter (Multi-Model Research Provider — initial candidate,
// requirement/MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §5).
// -----------------------------------------------------------------------
// The only file that talks to Gemini. Implemented via `fetch` against the
// public Generative Language API, mirroring openAIModel.ts and
// sourceDocumentProvider.ts's fetchImpl injection pattern — no SDK
// dependency added.
//
// Two translations are genuinely adapter-specific here, not shared with
// the other providers:
//
//   1. system/messages -> systemInstruction + contents/parts (Gemini's
//      request shape, structurally different from a single message
//      array — confirmed adapter-internal-only in the technical spike).
//   2. The JSON Schema zodToJsonSchema() already produces is NOT
//      resubmitted as-is: Gemini's `responseSchema` is an
//      OpenAPI-3.0-subset dialect (uppercase `type` enum values,
//      `nullable: true` instead of `anyOf` with a null branch, no
//      `$ref`/`$defs`). toGeminiSchema() below translates it. This is
//      exactly the "adapter-internal translation, not a ResearchModel
//      contract change" the technical spike anticipated — zodToJsonSchema()
//      itself is UNMODIFIED. Called WITHOUT the `defs` dedup option
//      Anthropic's adapter uses (that option exists only to work around
//      a documented Anthropic parameter-count limit Gemini does not
//      share), so observationSchema is inlined at each of its 9
//      occurrences rather than $ref'd.
//
// Both the schema-dialect acceptance and the exact refusal/response-ID
// field names below are UNVERIFIED against a live Gemini call — see the
// technical spike. The mapping follows Google's publicly documented
// Generative Language API request/response shape.
// -----------------------------------------------------------------------

/** Thrown for a missing key or model — a wiring fault, never an attacker's doing. */
export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiConfigError';
  }
}

export interface GeminiModelOptions {
  /** Required. Never read from process.env by this module — see createGeminiResearchModel. */
  apiKey?: string;
  /** Required. No default — see openAIModel.ts's identical rule and rationale. */
  model: string;
  maxOutputTokens?: number;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 16_000;
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

interface JsonSchemaNode {
  [key: string]: unknown;
}

/**
 * Translates the shared, provider-neutral JSON Schema into Gemini's
 * OpenAPI-3.0-subset `responseSchema` dialect. Adapter-internal only —
 * does not touch jsonSchema.ts, which stays exactly as Anthropic (and,
 * per the technical spike, likely OpenAI) already consume it.
 */
export function toGeminiSchema(node: JsonSchemaNode): JsonSchemaNode {
  if (Array.isArray(node.anyOf)) {
    const branches = node.anyOf as JsonSchemaNode[];
    const nonNull = branches.find((branch) => branch.type !== 'null');
    const hasNull = branches.some((branch) => branch.type === 'null');
    const inner = nonNull ? toGeminiSchema(nonNull) : {};
    return hasNull ? { ...inner, nullable: true } : inner;
  }

  const out: JsonSchemaNode = {};
  if (typeof node.description === 'string') out.description = node.description;

  switch (node.type) {
    case 'object': {
      out.type = 'OBJECT';
      const properties = (node.properties as Record<string, JsonSchemaNode> | undefined) ?? {};
      out.properties = Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [key, toGeminiSchema(value)]),
      );
      if (Array.isArray(node.required)) out.required = node.required;
      return out;
    }
    case 'array':
      out.type = 'ARRAY';
      out.items = toGeminiSchema(node.items as JsonSchemaNode);
      if (typeof node.minItems === 'number') out.minItems = node.minItems;
      return out;
    case 'string':
      out.type = 'STRING';
      if (Array.isArray(node.enum)) out.enum = node.enum;
      if (typeof node.minLength === 'number') out.minLength = node.minLength;
      if (typeof node.maxLength === 'number') out.maxLength = node.maxLength;
      return out;
    case 'integer':
      out.type = 'INTEGER';
      return out;
    default:
      throw new Error(`toGeminiSchema: unsupported JSON Schema node type "${String(node.type)}"`);
  }
}

interface GeminiGenerateContentResponse {
  responseId?: string;
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
  };
}

/** Finish reasons Gemini uses to signal a safety/policy block rather than a normal stop. */
const REFUSAL_FINISH_REASONS = new Set(['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'RECITATION']);

/**
 * Builds the research model. `apiKey` and `model` are REQUIRED and
 * explicit — see openAIModel.ts's identical rule.
 */
export function createGeminiResearchModel(options: GeminiModelOptions): ResearchModel {
  if (!options.apiKey?.trim()) {
    throw new GeminiConfigError(
      'createGeminiResearchModel needs an apiKey (pass loadEnv().GEMINI_API_KEY). ' +
        'It will not read the ambient environment.',
    );
  }
  if (!options.model?.trim()) {
    throw new GeminiConfigError('createGeminiResearchModel needs an explicit model identifier.');
  }

  const apiKey = options.apiKey;
  const model = options.model;
  const maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const responseSchema = toGeminiSchema(zodToJsonSchema(leadResearchSchema));

  return async ({ system, messages, signal }): Promise<ModelResult> => {
    const response = await fetchImpl(`${baseUrl}/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
        // Header, not a `?key=` query string — matches this repository's
        // own existing precedent for Google Places (GOOGLE_PLACES_API_KEY,
        // "Sent only via the X-Goog-Api-Key header, never a query string").
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          maxOutputTokens,
        },
      }),
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ProviderHttpError(
        `Gemini research model call failed (HTTP ${response.status}): ${body.slice(0, 500)}`,
        response.status,
      );
    }

    const bodyText = await response.text();
    const data = JSON.parse(bodyText) as GeminiGenerateContentResponse;
    const candidate = data.candidates?.[0];

    // A stable per-response identifier is required for R-29's
    // idempotency boundary. `responseId` is used when present; otherwise
    // a deterministic hash of the response body is used instead of a
    // random value, so a genuinely duplicated response still collides —
    // see this file's module note on why the exact field is unverified.
    const providerMessageId =
      data.responseId ?? `gemini-sha256-${createHash('sha256').update(bodyText).digest('hex')}`;

    const usage: ModelInvocationUsage = {
      provider: 'gemini',
      model,
      providerMessageId,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: data.usageMetadata?.cachedContentTokenCount ?? null,
    };

    if (data.promptFeedback?.blockReason) {
      return { kind: 'refusal', category: data.promptFeedback.blockReason, usage };
    }
    if (candidate?.finishReason && REFUSAL_FINISH_REASONS.has(candidate.finishReason)) {
      return { kind: 'refusal', category: candidate.finishReason, usage };
    }

    const text = (candidate?.content?.parts ?? []).map((part) => part.text ?? '').join('');
    if (!text.trim()) {
      throw new Error('the model returned no text content');
    }

    // Always parse, never string-match — mirrors anthropicModel.ts /
    // openAIModel.ts. researchLead()'s own retry/repair handling is
    // unchanged by which adapter produced a malformed body.
    return { kind: 'json', value: JSON.parse(text) as unknown, usage };
  };
}
