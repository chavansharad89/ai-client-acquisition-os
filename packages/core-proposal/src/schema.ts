import { z } from 'zod';

// Proposal schema and version record.
// -----------------------------------------------------------------------
// PRICING IS AN INPUT, NOT AN OUTPUT. The model receives the figure and
// may describe what it covers; it may not produce one. That is why the
// stored `amountPaise` comes from the caller and the generated pricing
// section is prose only — see pricing.ts for the check that keeps the
// prose consistent with the figure.
// -----------------------------------------------------------------------

export const sectionTextSchema = z.string().trim().min(1).max(4000);

export const generatedProposalSchema = z.object({
  problem: sectionTextSchema,
  currentSituation: sectionTextSchema,
  recommendedSolution: sectionTextSchema,
  /** One line per artefact. Rendered as a list. */
  deliverables: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
  /** Phases with durations. Durations are relative — never absolute dates. */
  timeline: z
    .array(
      z.object({
        phase: z.string().trim().min(1).max(120),
        durationWeeks: z.number().int().min(1).max(52),
        outcome: z.string().trim().min(1).max(300),
      }),
    )
    .min(1)
    .max(8),
  pricing: sectionTextSchema,
  /**
   * Everything the proposal takes for granted. Required and non-empty:
   * a proposal with no assumptions is one that has not been thought about.
   */
  assumptions: z.array(z.string().trim().min(1).max(300)).min(1).max(10),
  nextStep: sectionTextSchema,
});

export type GeneratedProposal = z.infer<typeof generatedProposalSchema>;

export const PROPOSAL_STATES = ['DRAFT', 'APPROVED', 'SENT', 'ACCEPTED', 'DECLINED'] as const;
export const proposalStateSchema = z.enum(PROPOSAL_STATES);
export type ProposalState = (typeof PROPOSAL_STATES)[number];

/**
 * One immutable version.
 *
 * Versions are never edited in place — an edit creates the next version.
 * That is what makes "what exactly did we send them" answerable months
 * later, when the current draft has moved on.
 */
export const proposalVersionSchema = z.object({
  proposalId: z.string().min(1),
  version: z.number().int().min(1),
  templateId: z.string().min(1),
  content: generatedProposalSchema,

  /** Authoritative. Supplied by the caller, never by the model. */
  amountPaise: z.number().int().positive(),
  currency: z.string().min(3).max(3),

  /** Provenance. */
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  researchVersion: z.string().min(1),
  createdAt: z.date(),
  /** Who produced this version: SYSTEM for generation, a user id for an edit. */
  createdBy: z.string().min(1),
  /** Set when a human edited rather than generated. */
  editSummary: z.string().nullable().default(null),
});

export type ProposalVersion = z.infer<typeof proposalVersionSchema>;

export const proposalSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  leadId: z.string().min(1),
  state: proposalStateSchema,
  /** Points at the version that is current. Older ones are kept. */
  currentVersion: z.number().int().min(1),
  versions: z.array(proposalVersionSchema).min(1),
  approvedBy: z.string().nullable().default(null),
  sentAt: z.date().nullable().default(null),
  answeredAt: z.date().nullable().default(null),
});

export type Proposal = z.infer<typeof proposalSchema>;

// ---- generation input ----

export const proposalInputSchema = z.object({
  lead: z.object({
    firstName: z.string().trim().max(80).nullable().default(null),
    role: z.string().trim().max(120).nullable().default(null),
  }),
  company: z.object({
    name: z.string().trim().min(1).max(200),
    industry: z.string().trim().max(120).nullable().default(null),
  }),
  /** OBSERVED evidence only — the caller strips inferences. */
  evidence: z
    .array(
      z.object({
        quote: z.string().trim().min(1),
        sourceUrl: z.string().trim().url(),
      }),
    )
    .min(1)
    .max(10),
  identifiedProblem: z.string().trim().min(1).max(600),
  proposedService: z.string().trim().min(1).max(160),
  pricing: z.object({
    amountPaise: z.number().int().positive(),
    currency: z.string().length(3).default('INR'),
    /** 'fixed' | 'monthly' — changes how the figure is described. */
    basis: z.enum(['fixed', 'monthly']).default('fixed'),
  }),
  timeline: z.object({
    totalWeeks: z.number().int().min(1).max(52),
    startNote: z.string().trim().max(200).nullable().default(null),
  }),
  templateId: z.string().min(1),
  senderFirstName: z.string().trim().min(1).max(80),
});

export type ProposalInput = z.infer<typeof proposalInputSchema>;
