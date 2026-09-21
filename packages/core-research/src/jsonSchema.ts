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

interface JsonSchemaDocument extends JsonSchemaNode {
  $defs?: Record<string, JsonSchemaNode>;
}

interface ZodCheck {
  kind: string;
  value?: number;
}

/**
 * Zod schema objects — matched by reference identity (`===`), never by
 * name or shape — that should be emitted once under `$defs` and
 * referenced via `$ref` everywhere they recur, instead of inlined at
 * every occurrence.
 *
 * Exists because Anthropic's structured-output compiler counts every
 * inlined nullable/union field separately: a schema reused many times
 * (this package's `observationSchema`, used 9 times inside
 * `leadResearchSchema`) multiplies its own union-field count by every
 * occurrence, not just its own shape ("18 parameters with type arrays or
 * anyOf" against a 16-parameter limit). Sharing it via `$ref` keeps the
 * count to the number of DISTINCT union fields, not the number of uses.
 *
 * The caller supplies the exact schema reference it wants deduplicated
 * (see anthropicModel.ts's `{ Observation: observationSchema }`) — this
 * converter never guesses which ZodObject repeats and never invents a
 * name for one. A prior version tried to detect repetition generically
 * ("the first non-root ZodObject encountered is named Observation") and
 * silently corrupted the output: `recommendedService`'s object was also
 * non-root, so it got named "Observation" too and overwrote the real
 * one in `$defs`, leaving every `$ref` to `companySummary` etc. pointing
 * at `recommendedService`'s shape instead. Requiring an explicit,
 * caller-identified reference removes that ambiguity entirely — no two
 * distinct schemas can ever be conflated under one name by accident.
 */
export interface ZodToJsonSchemaOptions {
  defs?: Record<string, z.ZodTypeAny>;
}

export function zodToJsonSchema(
  schema: z.ZodTypeAny,
  options: ZodToJsonSchemaOptions = {},
): JsonSchemaDocument {
  const defNameByRef = new Map<z.ZodTypeAny, string>();
  for (const [name, defSchema] of Object.entries(options.defs ?? {})) {
    defNameByRef.set(defSchema, name);
  }
  const emittedDefs: Record<string, JsonSchemaNode> = {};

  // Every recursive call inside convertNode() goes through this wrapper,
  // not convertNode() directly, so a declared def is caught wherever it
  // recurs — a property value, an array's item type, a nullable's inner
  // type, and so on — no matter how deep.
  function convert(node: z.ZodTypeAny): JsonSchemaNode {
    const defName = defNameByRef.get(node);
    if (defName === undefined) return convertNode(node);

    if (!(defName in emittedDefs)) {
      emittedDefs[defName] = convertNode(node);
    }
    return { $ref: `#/$defs/${defName}` };
  }

  function convertNode(schema: z.ZodTypeAny): JsonSchemaNode {
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
        // Anthropic structured outputs currently reject minimum/maximum
        // on integer schemas. Keep numeric bounds authoritative in Zod
        // post-response validation rather than sending unsupported keywords.
        return withDescription({ type: 'integer' }, def);
      }

      case 'ZodEnum':
        return withDescription({ type: 'string', enum: [...(def.values as string[])] }, def);

      case 'ZodArray': {
        const node: JsonSchemaNode = { type: 'array', items: convert(def.type as z.ZodTypeAny) };
        const min = def.minLength as { value: number } | null | undefined;
        // Anthropic structured outputs reject maxItems — Zod stays
        // authoritative for the upper bound after model output.
        if (min) node.minItems = min.value;
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

  const root = convert(schema);
  return Object.keys(emittedDefs).length > 0 ? { ...root, $defs: emittedDefs } : root;
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
function withDescription(node: JsonSchemaNode, def: { [k: string]: unknown }): JsonSchemaNode {
  return typeof def.description === 'string' && def.description.length > 0
    ? { ...node, description: def.description }
    : node;
}

function isOptional(schema: z.ZodTypeAny): boolean {
  const typeName = (schema as { _def: { typeName: string } })._def.typeName;
  // A defaulted field is still required in the JSON the model returns —
  // the default only applies when Zod parses, and the model should be
  // told to produce it explicitly.
  return typeName === 'ZodOptional';
}
