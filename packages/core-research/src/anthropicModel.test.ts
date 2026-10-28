import { describe, expect, it, vi } from 'vitest';

import { createAnthropicResearchModel } from './anthropicModel';

// Adapter-level translation test (G-7, G7-PO-DEC-001 / F-1 §16 / D11 §7).
// No network call — the Anthropic client is faked, mirroring
// research.test.ts's fakeAnthropicClient. Asserts the schema this adapter
// actually sends in output_config.format, not the shared schema directly.

interface JsonNode {
  [key: string]: unknown;
}

async function capturedFormat(): Promise<JsonNode> {
  const stream = vi.fn((_params: unknown) => ({
    finalMessage: async () => ({
      id: 'msg_1',
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: '{}' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
  }));
  const model = createAnthropicResearchModel({ client: { messages: { stream } } as never });
  await model({ system: 'system prompt', messages: [] });

  expect(stream).toHaveBeenCalledTimes(1);
  const params = stream.mock.calls[0]?.[0] as { output_config: { format: JsonNode } };
  return params.output_config.format;
}

describe('createAnthropicResearchModel — F-1 segment schema translation (G-7)', () => {
  it('sends the extended category-plausibility segment in output_config.format', async () => {
    const format = await capturedFormat();
    expect(format.type).toBe('json_schema');

    const schema = format.schema as { properties: Record<string, JsonNode> };
    const segments = schema.properties.categoryPlausibility as { type: string; items: JsonNode };
    expect(segments.type).toBe('array');

    const item = segments.items as {
      type: string;
      properties: Record<string, JsonNode>;
      required: string[];
      additionalProperties: unknown;
    };
    expect(item.type).toBe('object');
    expect(Object.keys(item.properties)).toEqual(['fit', 'rationale', 'evidence', 'confidence']);
    expect(item.required).toEqual(['fit', 'rationale', 'evidence', 'confidence']);
    expect(item.additionalProperties).toBe(false);

    // basis and classification are code-assigned (F-1), never model-supplied.
    expect(item.properties).not.toHaveProperty('basis');
    expect(item.properties).not.toHaveProperty('classification');

    // UNKNOWN is a representable verdict.
    expect(item.properties.fit).toMatchObject({ type: 'string', enum: ['MATCH', 'MISMATCH', 'UNKNOWN'] });

    // confidence: required integer. The 1-100 / exactly-0 range is carried in
    // the description and enforced by the shared Zod parse — integer bounds
    // are deliberately not emitted to Anthropic (jsonSchema.ts).
    const confidence = item.properties.confidence as JsonNode;
    expect(confidence.type).toBe('integer');
    expect(confidence).not.toHaveProperty('minimum');
    expect(confidence).not.toHaveProperty('maximum');
    expect(confidence.description).toContain('1-100 for MATCH/MISMATCH');
    expect(confidence.description).toContain('exactly 0 for UNKNOWN');

    // rationale: required key, nullable in the model-facing shape only.
    const rationale = item.properties.rationale as { anyOf: JsonNode[]; description: string };
    expect(rationale.anyOf).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'string' }), { type: 'null' }]),
    );
    expect(rationale.description).toContain('For UNKNOWN');

    const evidence = item.properties.evidence as { type: string; items: { properties: Record<string, unknown> } };
    expect(evidence.type).toBe('array');
    expect(evidence.items.properties).toHaveProperty('quote');
    expect(evidence.items.properties).toHaveProperty('sourceUrl');
  });
});
