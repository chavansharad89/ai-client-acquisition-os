import { z } from 'zod';

import { OUTREACH_CHANNELS } from './channels';

// Generated message schema + the stored record.
// -----------------------------------------------------------------------
// The generator must declare which evidence each message leans on. That is
// not bookkeeping: it is what makes the fabrication check possible, and it
// forces the model to pick a real observation before writing rather than
// writing first and justifying afterwards.
// -----------------------------------------------------------------------

export const channelSchema = z.enum(OUTREACH_CHANNELS);

export const generatedMessageSchema = z.object({
  channel: channelSchema,
  /** Present only for EMAIL; the schema check is in verify.ts. */
  subject: z.string().trim().max(120).nullable().default(null),
  body: z.string().trim().min(1).max(2000),
  /**
   * The exact observed quotes this message relies on. Must match evidence
   * the caller supplied — a quote the model invented fails verification.
   */
  evidenceUsed: z.array(z.string().trim().min(1)).min(1).max(4),
  /** The business impact stated, so a reviewer can check it is argued. */
  impactClaim: z.string().trim().min(1).max(300),
  /** Exactly one. Two asks is the commonest reason cold outreach fails. */
  callToAction: z.string().trim().min(1).max(200),
});

export type GeneratedMessage = z.infer<typeof generatedMessageSchema>;

export const generationOutputSchema = z.object({
  messages: z.array(generatedMessageSchema).min(1).max(4),
});

export type GenerationOutput = z.infer<typeof generationOutputSchema>;

// ---- the stored record ----

export const APPROVAL_STATES = ['DRAFT', 'APPROVED', 'REJECTED', 'SENT'] as const;
export const approvalStateSchema = z.enum(APPROVAL_STATES);
export type ApprovalState = (typeof APPROVAL_STATES)[number];

export const storedMessageSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  leadId: z.string().min(1),
  channel: channelSchema,

  subject: z.string().nullable(),
  body: z.string().min(1),

  /** Provenance — everything needed to explain or reproduce this message. */
  model: z.string().min(1),
  promptVersion: z.string().min(1),
  generatedAt: z.date(),
  /**
   * Which research run produced the evidence. A message generated from
   * stale research can be identified and pulled without guesswork.
   */
  researchVersion: z.string().min(1),

  evidenceUsed: z.array(z.string()),
  impactClaim: z.string(),
  callToAction: z.string(),

  approvalState: approvalStateSchema,
  approvedBy: z.string().nullable().default(null),
  approvedAt: z.date().nullable().default(null),
  rejectedReason: z.string().nullable().default(null),
  sentAt: z.date().nullable().default(null),
  /** Set when a human edits the body, so machine and human text are distinguishable. */
  editedByHuman: z.boolean().default(false),
});

export type StoredMessage = z.infer<typeof storedMessageSchema>;

// ---- generation input ----

export const generationInputSchema = z.object({
  lead: z.object({
    firstName: z.string().trim().min(1).max(80).nullable().default(null),
    role: z.string().trim().max(120).nullable().default(null),
  }),
  company: z.object({
    name: z.string().trim().min(1).max(200),
    industry: z.string().trim().max(120).nullable().default(null),
  }),
  /**
   * OBSERVED evidence only. The caller strips inferred and unknown claims
   * before they reach the model — see toEvidencePool.
   */
  evidence: z
    .array(
      z.object({
        quote: z.string().trim().min(1),
        sourceUrl: z.string().trim().url(),
        signal: z.string().trim().min(1),
      }),
    )
    .min(1)
    .max(8),
  service: z.string().trim().min(1).max(120),
  offerRationale: z.string().trim().min(1).max(600),
  senderFirstName: z.string().trim().min(1).max(80),
  channels: z.array(channelSchema).min(1).max(4),
});

export type GenerationInput = z.infer<typeof generationInputSchema>;
