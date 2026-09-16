import { z } from 'zod';

// Lead research output schema.
// -----------------------------------------------------------------------
// "Never invent facts" is enforced here, not merely asked for in the
// prompt. A prompt is a request; a schema is a gate. Every claim the model
// makes must be classified, and the classification carries obligations
// that Zod checks:
//
//   OBSERVED  — seen directly. MUST cite evidence (a quote and a source).
//   INFERRED  — reasoned from observations. MUST state what it reasoned
//               from. Cannot cite evidence it did not observe.
//   UNKNOWN   — not determinable. MUST have a null value and no evidence.
//
// A model that returns OBSERVED with no evidence fails validation and the
// request is retried with the error fed back — so the failure mode is a
// rejected response, not a confident fabrication reaching the database.
// -----------------------------------------------------------------------

export const CLASSIFICATIONS = ['OBSERVED', 'INFERRED', 'UNKNOWN'] as const;
export const classificationSchema = z.enum(CLASSIFICATIONS);
export type Classification = (typeof CLASSIFICATIONS)[number];

// The descriptions below are not documentation for humans — jsonSchema.ts
// carries them into the schema handed to the model, and they are the only
// channel that survives the trip. The cross-field rules live in
// .superRefine, which JSON Schema cannot express, so without these the
// model sees "quote: string" and is left to infer the contract. They state
// what provenance.ts will check; verification, not the wording, is what
// decides.
export const evidenceSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .describe(
      'Text copied VERBATIM from one of the supplied source documents. This is checked ' +
        'character by character against that document — a paraphrase, a summary, or a ' +
        'sentence you composed will be rejected. Copy, do not rewrite.',
    ),
  sourceUrl: z
    .string()
    .trim()
    .url()
    .describe(
      'The URL of the supplied source document this quote was copied from. Must be one of ' +
        'the document URLs given in the user message, and must be the document the quote ' +
        'actually came from. Do not cite a URL you were not given.',
    ),
  sourceLabel: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .describe('The Label of that same supplied document, for auditing.'),
});
export type Evidence = z.infer<typeof evidenceSchema>;

/**
 * One claim, with its provenance.
 *
 * The cross-field rules below are the whole point — without them a model
 * can label anything OBSERVED and the classification means nothing.
 */
export const observationSchema = z
  .object({
    classification: classificationSchema.describe(
      'OBSERVED: a supplied document states this, and you can quote it. INFERRED: you ' +
        'reasoned it from what the documents say; give `basis`, attach no evidence, ' +
        'confidence at most 80. UNKNOWN: the documents do not say; value null, evidence [], ' +
        'confidence 0.',
    ),
    /** Null only when UNKNOWN. */
    value: z.string().trim().min(1).max(1200).nullable(),
    /** Required for OBSERVED; forbidden otherwise. */
    evidence: z
      .array(evidenceSchema)
      .max(5)
      .default([])
      .describe(
        'Required and non-empty when classification is OBSERVED; must be [] for INFERRED ' +
          'and UNKNOWN. Every entry is verified against the supplied documents after you ' +
          'answer, so an invented quote or URL fails and the whole response comes back to ' +
          'you for correction.',
      ),
    /** Required for INFERRED: what observations led here. */
    basis: z.string().trim().min(1).max(600).nullable().default(null),
    /** 0-100. How strongly the model holds this claim. */
    confidence: z.number().int().min(0).max(100),
  })
  .superRefine((obs, ctx) => {
    if (obs.classification === 'OBSERVED') {
      if (obs.value === null) {
        ctx.addIssue({ code: 'custom', path: ['value'], message: 'OBSERVED requires a value' });
      }
      if (obs.evidence.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['evidence'],
          message:
            'OBSERVED requires at least one quote with a source URL — if you cannot cite it, it is INFERRED or UNKNOWN',
        });
      }
    }

    if (obs.classification === 'INFERRED') {
      if (obs.value === null) {
        ctx.addIssue({ code: 'custom', path: ['value'], message: 'INFERRED requires a value' });
      }
      if (!obs.basis) {
        ctx.addIssue({
          code: 'custom',
          path: ['basis'],
          message: 'INFERRED requires `basis` naming the observations it was reasoned from',
        });
      }
      if (obs.evidence.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['evidence'],
          message:
            'INFERRED must not cite evidence — evidence means you observed it, so classify it OBSERVED',
        });
      }
      // An inference asserted with near-certainty is usually a disguised
      // fabrication; cap it so ranking never treats it as fact.
      if (obs.confidence > 80) {
        ctx.addIssue({
          code: 'custom',
          path: ['confidence'],
          message:
            'INFERRED confidence cannot exceed 80 — if you are more certain than that, cite evidence and mark it OBSERVED',
        });
      }
    }

    if (obs.classification === 'UNKNOWN') {
      if (obs.value !== null) {
        ctx.addIssue({
          code: 'custom',
          path: ['value'],
          message: 'UNKNOWN must have a null value — do not guess',
        });
      }
      if (obs.evidence.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['evidence'],
          message: 'UNKNOWN cannot have evidence',
        });
      }
      if (obs.confidence !== 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['confidence'],
          message: 'UNKNOWN confidence must be 0',
        });
      }
    }
  });

export type Observation = z.infer<typeof observationSchema>;

/** A list of claims, each independently classified. */
const observationList = z.array(observationSchema).max(8);

export const RECOMMENDED_SERVICES = [
  'AI content system',
  'Lead generation automation',
  'Analytics and reporting setup',
  'Workflow automation',
  'NONE',
] as const;

export const leadResearchSchema = z.object({
  companySummary: observationSchema,
  businessModel: observationSchema,
  targetCustomers: observationSchema,

  visibleProblems: observationList,
  growthOpportunities: observationList,
  aiOpportunities: observationList,
  websiteIssues: observationList,
  contentOpportunities: observationList,
  automationOpportunities: observationList,

  recommendedService: z.object({
    /** 'NONE' is a valid answer and must stay available. */
    service: z.enum(RECOMMENDED_SERVICES),
    rationale: z.string().trim().min(1).max(800),
    /** Which findings support it. */
    basedOn: z.array(z.string().trim().min(1)).max(8).default([]),
  }),

  /** Overall confidence in the research as a whole, 0-100. */
  confidence: z.number().int().min(0).max(100),

  /** What the model could not determine. Being explicit beats silence. */
  gaps: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
});

export type LeadResearch = z.infer<typeof leadResearchSchema>;

// ---- input ----

export const researchInputSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  websiteUrl: z.string().trim().url(),
  industry: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().min(1).max(120).optional(),
  socialProfileUrl: z.string().trim().url().optional(),
  /** Raw text the caller already fetched. The model sees only this. */
  sourceDocuments: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        url: z.string().trim().url(),
        text: z.string().trim().min(1),
      }),
    )
    .max(10)
    .default([]),
});

export type ResearchInput = z.infer<typeof researchInputSchema>;

/** Every claim in a result, flattened — for persistence and auditing. */
export function allObservations(
  research: LeadResearch,
): readonly (Observation & { field: string })[] {
  const single: [string, Observation][] = [
    ['companySummary', research.companySummary],
    ['businessModel', research.businessModel],
    ['targetCustomers', research.targetCustomers],
  ];
  const lists: [string, Observation[]][] = [
    ['visibleProblems', research.visibleProblems],
    ['growthOpportunities', research.growthOpportunities],
    ['aiOpportunities', research.aiOpportunities],
    ['websiteIssues', research.websiteIssues],
    ['contentOpportunities', research.contentOpportunities],
    ['automationOpportunities', research.automationOpportunities],
  ];
  return [
    ...single.map(([field, obs]) => ({ ...obs, field })),
    ...lists.flatMap(([field, list]) => list.map((obs) => ({ ...obs, field }))),
  ];
}

/** Share of claims that are OBSERVED. A low ratio means thin research. */
export function observedRatio(research: LeadResearch): number {
  const all = allObservations(research);
  if (all.length === 0) return 0;
  return all.filter((o) => o.classification === 'OBSERVED').length / all.length;
}
