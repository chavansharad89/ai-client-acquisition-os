import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from './jsonSchema';
import { leadResearchSchema } from './schema';
import type { ModelResult, ResearchModel } from './researcher';

// The Anthropic adapter.
// -----------------------------------------------------------------------
// The only file that imports the SDK. Everything else — schema, prompt,
// retry, persistence — is provider-agnostic and testable without a network
// or an API key, which is the same boundary core-capi draws with
// HttpTransport.
//
// Streaming is used because adaptive thinking plus a large structured
// response can run long enough to hit the SDK's HTTP timeout on a
// non-streaming call.
// -----------------------------------------------------------------------

/** Thrown for a missing key — a wiring fault, never an attacker's doing. */
export class AnthropicConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnthropicConfigError';
  }
}

export interface AnthropicModelOptions {
  /**
   * The API key. Required unless `client` is supplied.
   *
   * Never read from process.env by this module — see the note on
   * createAnthropicResearchModel.
   */
  apiKey?: string;
  client?: Anthropic;
  model?: string;
  maxTokens?: number;
  /** low | medium | high | xhigh | max. Research rewards thoroughness. */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
}

/**
 * Builds the research model.
 *
 * `apiKey` is REQUIRED and explicit. The previous `new Anthropic()` read
 * ANTHROPIC_API_KEY out of the ambient environment inside the SDK — which
 * meant the key was never declared in @acos/config, never validated at
 * boot, and absent from every deployment checklist. A process could start
 * cleanly and then fail on its first research call, in production, with
 * an error from somebody else's library.
 *
 * Passing it in makes the dependency visible at the call site and puts
 * the validation where every other secret's lives. Supply
 * `loadEnv().ANTHROPIC_API_KEY`; supply `client` instead in tests.
 */
export function createAnthropicResearchModel(options: AnthropicModelOptions): ResearchModel {
  if (!options.client && !options.apiKey?.trim()) {
    throw new AnthropicConfigError(
      'createAnthropicResearchModel needs an apiKey (pass loadEnv().ANTHROPIC_API_KEY) ' +
        'or an injected client. It will not read the ambient environment.',
    );
  }
  const client = options.client ?? new Anthropic({ apiKey: options.apiKey });
  const model = options.model ?? 'claude-opus-5';
  const maxTokens = options.maxTokens ?? 16_000;
  const effort = options.effort ?? 'high';

  return async ({ system, messages, signal }): Promise<ModelResult> => {
    // The signal reaches the SDK, not just the retry loop. Aborting a
    // backoff while a streaming completion keeps running would cancel the
    // cheap half of the wait and leave the expensive half in flight.
    const stream = client.messages.stream({
      model,
      max_tokens: maxTokens,
      system,
      // Adaptive thinking: the model decides how much reasoning this
      // company needs. Reading a site and deciding what is evidence is
      // exactly the kind of work that benefits.
      thinking: { type: 'adaptive' },
      output_config: {
        effort,
        format: {
          type: 'json_schema',
          schema: zodToJsonSchema(leadResearchSchema),
        },
      },
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    },
    // Request options, not body fields — the SDK aborts the underlying
    // HTTP request when this fires.
    signal ? { signal } : undefined);

    const response = await stream.finalMessage();

    // A safety decline arrives as HTTP 200 with stop_reason 'refusal',
    // so checking stop_reason before reading content is not optional.
    if (response.stop_reason === 'refusal') {
      return { kind: 'refusal', category: response.stop_details?.category ?? null };
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!text.trim()) {
      throw new Error('the model returned no text content');
    }

    // Tool/structured output escaping varies; always parse, never
    // string-match.
    return { kind: 'json', value: JSON.parse(text) as unknown };
  };
}
