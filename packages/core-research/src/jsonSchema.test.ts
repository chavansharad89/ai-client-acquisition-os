import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { zodToJsonSchema } from './jsonSchema';
import { leadResearchSchema, observationSchema } from './schema';

describe('zodToJsonSchema', () => {
  it('does not emit maxItems for arrays', () => {
    const schema = z.object({
      evidence: z.array(z.string()).max(5),
      observations: z.array(z.string()).max(8),
    });

    const jsonSchema = zodToJsonSchema(schema) as {
      properties: {
        evidence: Record<string, unknown>;
        observations: Record<string, unknown>;
      };
    };

    expect(jsonSchema.properties.evidence).not.toHaveProperty('maxItems');
    expect(jsonSchema.properties.observations).not.toHaveProperty('maxItems');
  });

  it('preserves supported minimum array constraints', () => {
    const schema = z.object({
      evidence: z.array(z.string()).min(1).max(5),
    });

    const jsonSchema = zodToJsonSchema(schema) as {
      properties: {
        evidence: Record<string, unknown>;
      };
    };

    expect(jsonSchema.properties.evidence).toHaveProperty('minItems', 1);
    expect(jsonSchema.properties.evidence).not.toHaveProperty('maxItems');
  });

  it('keeps the Zod max constraint authoritative after conversion', () => {
    const schema = z.array(z.string()).max(5);

    expect(schema.safeParse(['1', '2', '3', '4', '5']).success).toBe(true);
    expect(schema.safeParse(['1', '2', '3', '4', '5', '6']).success).toBe(false);
  });

  it('does not emit minimum or maximum for integer schemas', () => {
  const schema = z.object({
    confidence: z.number().int().min(0).max(100),
  });

  const jsonSchema = zodToJsonSchema(schema) as {
    properties: {
      confidence: Record<string, unknown>;
    };
  };

  expect(jsonSchema.properties.confidence).toEqual({
    type: 'integer',
  });
});

it('keeps Zod numeric bounds authoritative after conversion', () => {
  const schema = z.number().int().min(0).max(100);

  expect(schema.safeParse(0).success).toBe(true);
  expect(schema.safeParse(100).success).toBe(true);
  expect(schema.safeParse(-1).success).toBe(false);
  expect(schema.safeParse(101).success).toBe(false);
});

});

describe('leadResearchSchema $defs/$ref deduplication', () => {
  // observationSchema is passed by REFERENCE, matching how
  // anthropicModel.ts actually calls zodToJsonSchema() in production —
  // dedup is opt-in and identity-based, never automatic/heuristic (see
  // ZodToJsonSchemaOptions's doc comment for why: an earlier version
  // that tried to auto-detect "the repeated ZodObject" instead named
  // ANY non-root object "Observation", and recommendedService's object
  // silently overwrote the real definition in $defs).
  const dedupOptions = { defs: { Observation: observationSchema } };

  it('deduplicates the repeated observation schema into one $defs entry', () => {
    const jsonSchema = zodToJsonSchema(leadResearchSchema, dedupOptions);

    expect(jsonSchema.$defs).toBeDefined();
    expect(Object.keys(jsonSchema.$defs ?? {})).toEqual(['Observation']);
  });

  it('uses $ref for all nine observation schema occurrences', () => {
    const jsonSchema = zodToJsonSchema(leadResearchSchema, dedupOptions);

    const properties = jsonSchema.properties as Record<string, any>;

    expect(properties.companySummary).toEqual({
      $ref: '#/$defs/Observation',
    });

    expect(properties.businessModel).toEqual({
      $ref: '#/$defs/Observation',
    });

    expect(properties.targetCustomers).toEqual({
      $ref: '#/$defs/Observation',
    });

    for (const field of [
      'visibleProblems',
      'growthOpportunities',
      'aiOpportunities',
      'websiteIssues',
      'contentOpportunities',
      'automationOpportunities',
    ]) {
      expect(properties[field]).toMatchObject({
        type: 'array',
        items: {
          $ref: '#/$defs/Observation',
        },
      });
    }
  });

  it('keeps nullable value and basis unions exactly once in the definition', () => {
    const jsonSchema = zodToJsonSchema(leadResearchSchema, dedupOptions);

    const observation = jsonSchema.$defs?.Observation as any;

    expect(observation.properties.value.anyOf).toEqual([
      {
        type: 'string',
        minLength: 1,
        maxLength: 1200,
      },
      {
        type: 'null',
      },
    ]);

    expect(observation.properties.basis.anyOf).toEqual([
      {
        type: 'string',
        minLength: 1,
        maxLength: 600,
      },
      {
        type: 'null',
      },
    ]);
  });

  it('contains exactly two anyOf nodes and nine observation references', () => {
    const jsonSchema = zodToJsonSchema(leadResearchSchema, dedupOptions);

    let anyOfCount = 0;
    let refCount = 0;

    const walk = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const item of value) {
          walk(item);
        }
        return;
      }

      if (!value || typeof value !== 'object') {
        return;
      }

      const object = value as Record<string, unknown>;

      if ('anyOf' in object) {
        anyOfCount += 1;
      }

      if (object.$ref === '#/$defs/Observation') {
        refCount += 1;
      }

      for (const child of Object.values(object)) {
        walk(child);
      }
    };

    walk(jsonSchema);

    expect(anyOfCount).toBe(2);
    expect(refCount).toBe(9);
  });

  it('does not emit Anthropic-incompatible maxItems or integer bounds', () => {
    const jsonSchema = zodToJsonSchema(leadResearchSchema, dedupOptions);

    const serialized = JSON.stringify(jsonSchema);

    expect(serialized).not.toContain('"maxItems"');
    expect(serialized).not.toContain('"minimum"');
    expect(serialized).not.toContain('"maximum"');
  });

  it('never dedupes/renames a ZodObject that was not explicitly listed in defs', () => {
    // Direct regression test for the actual bug found: a prior
    // implementation auto-detected "the first non-root ZodObject" and
    // named it "Observation" unconditionally, so recommendedService's
    // object — also non-root, also a ZodObject — got named "Observation"
    // too and silently overwrote the real definition. Only a schema
    // passed BY REFERENCE in `defs` may ever become a $ref; everything
    // else — including another distinct, equally-"repeatable"-looking
    // object — must stay fully inlined.
    const jsonSchema = zodToJsonSchema(leadResearchSchema, dedupOptions) as {
      properties: { recommendedService: Record<string, unknown> };
    };

    expect(jsonSchema.properties.recommendedService).not.toHaveProperty('$ref');
    expect(jsonSchema.properties.recommendedService).toMatchObject({
      type: 'object',
      properties: {
        service: { enum: expect.arrayContaining(['NONE']) },
        rationale: expect.any(Object),
        basedOn: expect.any(Object),
      },
    });

    // The one and only $defs entry must be the actual Observation shape —
    // never recommendedService's fields.
    const observation = jsonSchema as unknown as { $defs: { Observation: Record<string, unknown> } };
    const observationKeys = Object.keys(
      (observation.$defs.Observation.properties as Record<string, unknown>) ?? {},
    );
    expect(observationKeys).toEqual(['classification', 'value', 'evidence', 'basis', 'confidence']);
    expect(observationKeys).not.toContain('service');
    expect(observationKeys).not.toContain('rationale');
    expect(observationKeys).not.toContain('basedOn');
  });

  it('is opt-in: calling without the defs option leaves the schema fully inlined (backward compatible)', () => {
    // Every pre-existing caller (research.test.ts's schema-conversion
    // tests) calls zodToJsonSchema(leadResearchSchema) with one
    // argument and navigates the fully-inlined shape directly — this
    // must keep working unchanged for a caller that never opts in.
    const jsonSchema = zodToJsonSchema(leadResearchSchema) as {
      $defs?: unknown;
      properties: { companySummary: Record<string, unknown> };
    };

    expect(jsonSchema.$defs).toBeUndefined();
    expect(jsonSchema.properties.companySummary).not.toHaveProperty('$ref');
    expect(jsonSchema.properties.companySummary).toHaveProperty('properties');
  });
});

describe('zodToJsonSchema defs option — generic identity behavior', () => {
  it('dedupes an arbitrary repeated schema reference passed via defs, by identity not shape', () => {
    const shared = z.object({ a: z.string().nullable(), b: z.number().int() });
    // A DIFFERENT schema that happens to have a similarly-shaped nullable
    // string field — must never be conflated with `shared` just because
    // it looks alike.
    const lookalike = z.object({ a: z.string().nullable(), c: z.string() });

    const root = z.object({ first: shared, second: shared, third: lookalike });

    const jsonSchema = zodToJsonSchema(root, { defs: { Shared: shared } }) as {
      $defs: Record<string, unknown>;
      properties: Record<string, unknown>;
    };

    expect(jsonSchema.properties.first).toEqual({ $ref: '#/$defs/Shared' });
    expect(jsonSchema.properties.second).toEqual({ $ref: '#/$defs/Shared' });
    // Not passed in `defs`, and not reference-equal to `shared` — must
    // stay fully inlined, never renamed to "Shared" or merged into it.
    expect(jsonSchema.properties.third).not.toHaveProperty('$ref');
    expect(Object.keys(jsonSchema.$defs)).toEqual(['Shared']);
  });
});
