import type { z } from 'zod';

// Minimal Zod -> JSON Schema conversion for output_config.format.
// -----------------------------------------------------------------------
// Hand-rolled rather than pulling in `zod-to-json-schema`: this package
// needs one schema converted, the dependency is another supply-chain
// surface in a payments monorepo, and the conversion for the shapes used
// in schema.ts is small enough to read in one sitting.
//
// It covers exactly what schema.ts uses. An unsupported node throws rather
// than emitting a lax schema, because a silently permissive schema is how
// structured output stops constraining anything.
// -----------------------------------------------------------------------

export class UnsupportedSchemaNodeError extends Error {
  constructor(typeName: string) {
    super(`cannot convert Zod node "${typeName}" to JSON Schema — extend jsonSchema.ts`);
    this.name = 'UnsupportedSchemaNodeError';
  }
}

interface JsonSchemaNode {
  [key: string]: unknown;
}

export function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchemaNode {
  return convert(schema);
}

interface ZodCheck {
  kind: string;
  value?: number;
}

/**
 * Carries `.describe()` text through to the emitted node.
 *
 * This is the only channel the current architecture has for telling the
 * model what a field MEANS as opposed to what type it is — the cross-field
 * rules live in `.superRefine`, which JSON Schema cannot express. Dropping
 * descriptions meant the model was handed a schema saying `quote` is a
 * string, with no hint that it must be copied verbatim from a supplied
 * document. Post-generation verification is still what decides; this just
 * stops the model being asked to guess.
 */
function withDescription(
  node: JsonSchemaNode,
  def: { [k: string]: unknown },
): JsonSchemaNode {
  return typeof def.description === 'string' && def.description.length > 0
    ? { ...node, description: def.description }
    : node;
}

function convert(schema: z.ZodTypeAny): JsonSchemaNode {
  const def = (schema as { _def: { typeName: string; [k: string]: unknown } })._def;

  switch (def.typeName) {
    case 'ZodEffects':
      // .superRefine wraps the inner type; JSON Schema cannot express the
      // cross-field rules, so they stay enforced by Zod after parsing —
      // and, for evidence, by provenance.ts against the source documents.
      return withDescription(convert(def.schema as z.ZodTypeAny), def);

    case 'ZodDefault':
      return withDescription(convert(def.innerType as z.ZodTypeAny), def);

    case 'ZodOptional':
      return withDescription(convert(def.innerType as z.ZodTypeAny), def);

    case 'ZodNullable':
      return withDescription(
        { anyOf: [convert(def.innerType as z.ZodTypeAny), { type: 'null' }] },
        def,
      );

    case 'ZodString': {
      const node: JsonSchemaNode = { type: 'string' };
      for (const check of (def.checks as ZodCheck[] | undefined) ?? []) {
        if (check.kind === 'min' && check.value !== undefined) node.minLength = check.value;
        if (check.kind === 'max' && check.value !== undefined) node.maxLength = check.value;
        if (check.kind === 'url') node.format = 'uri';
      }
      return withDescription(node, def);
    }

    case 'ZodNumber': {
      const node: JsonSchemaNode = { type: 'integer' };
      for (const check of (def.checks as ZodCheck[] | undefined) ?? []) {
        if (check.kind === 'min' && check.value !== undefined) node.minimum = check.value;
        if (check.kind === 'max' && check.value !== undefined) node.maximum = check.value;
      }
      return withDescription(node, def);
    }

    case 'ZodEnum':
      return withDescription({ type: 'string', enum: [...(def.values as string[])] }, def);

    case 'ZodArray': {
      const node: JsonSchemaNode = { type: 'array', items: convert(def.type as z.ZodTypeAny) };
      const min = def.minLength as { value: number } | null | undefined;
      const max = def.maxLength as { value: number } | null | undefined;
      if (min) node.minItems = min.value;
      if (max) node.maxItems = max.value;
      return withDescription(node, def);
    }

    case 'ZodObject': {
      const shape = (def.shape as () => Record<string, z.ZodTypeAny>)();
      const properties: Record<string, JsonSchemaNode> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = convert(value);
        if (!isOptional(value)) required.push(key);
      }
      return withDescription(
        {
          type: 'object',
          properties,
          required,
          // Structured outputs require this; without it the model may add
          // fields the schema never mentioned.
          additionalProperties: false,
        },
        def,
      );
    }

    default:
      throw new UnsupportedSchemaNodeError(def.typeName);
  }
}

function isOptional(schema: z.ZodTypeAny): boolean {
  const typeName = (schema as { _def: { typeName: string } })._def.typeName;
  // A defaulted field is still required in the JSON the model returns —
  // the default only applies when Zod parses, and the model should be
  // told to produce it explicitly.
  return typeName === 'ZodOptional';
}
