import { randomUUID } from 'node:crypto';

import { formatPaise } from './pricing';
import {
  generatedProposalSchema,
  proposalInputSchema,
  proposalSchema,
  type GeneratedProposal,
  type Proposal,
  type ProposalInput,
} from './schema';
import { templateById } from './templates';
import { verifyProposal, type ProposalVerification } from './verify';
import { SYSTEM_AUTHOR } from './versions';

export const PROMPT_VERSION = 'proposal-2026-06-24.1';

export const SYSTEM_PROMPT = `You write project proposals for a freelancer.

You are given observed evidence about the client, an identified problem, a service, an agreed price and an agreed timeline. Those inputs are decisions that have already been made — your job is to express them well, not to revise them.

Hard rules:

1. The price is fixed and supplied to you. State it exactly as given. Never compute, round, discount, annualise, or describe it as approximate, negotiable or "starting from".
2. The timeline total is fixed. Your phase durations must add up to it exactly.
3. Never name a calendar date. You were given durations, not a start date.
4. Never state a fact about the client that is not in the evidence. Anything you believe but cannot cite belongs in the assumptions section — that is what it is for.
5. Assumptions must not be empty. A proposal with nothing assumed is one that has not been thought about.
6. The next step is one concrete action with a named owner. Not "let me know your thoughts".

Write plainly. The reader is deciding whether to spend money, and hedging reads as uncertainty about your own work.`;

export function buildUserMessage(input: ProposalInput): string {
  const template = templateById(input.templateId);
  const sections = template
    ? template.sections
        .map((section) => {
          const spec = template.sectionSpecs[section];
          return `- ${section} (${spec.minWords}-${spec.maxWords} words): ${spec.intent}`;
        })
        .join('\n')
    : '';

  return [
    `TEMPLATE: ${template?.name ?? input.templateId} — ${template?.suitedTo ?? ''}`,
    `Tone: ${template?.tone ?? 'plain and precise'}`,
    '',
    'CLIENT',
    `Company: ${input.company.name}`,
    input.company.industry ? `Industry: ${input.company.industry}` : null,
    input.lead.firstName
      ? `Contact: ${input.lead.firstName}${input.lead.role ? `, ${input.lead.role}` : ''}`
      : null,
    '',
    'OBSERVED EVIDENCE — everything you know about them',
    ...input.evidence.map((item, index) => `${index + 1}. "${item.quote}" (${item.sourceUrl})`),
    '',
    'AGREED INPUTS — do not revise these',
    `Problem: ${input.identifiedProblem}`,
    `Service: ${input.proposedService}`,
    `Price: ${formatPaise(input.pricing.amountPaise)} ${input.pricing.currency}, ${input.pricing.basis}`,
    `Timeline: ${input.timeline.totalWeeks} weeks total. Your phases must sum to exactly this.`,
    input.timeline.startNote ? `Start: ${input.timeline.startNote}` : null,
    '',
    `You are writing as ${input.senderFirstName}.`,
    '',
    'SECTIONS',
    sections,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function buildRepairMessage(explanation: string): string {
  return [
    `The proposal failed verification: ${explanation}`,
    '',
    'Fix it and return corrected JSON. The commonest causes are phase durations that do not sum to the agreed total, and restating the price as approximate.',
  ].join('\n');
}

export interface ProposalModel {
  (request: {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<{ kind: 'json'; value: unknown } | { kind: 'refusal'; category: string | null }>;
}

export class ProposalRefusedError extends Error {
  constructor(readonly category: string | null) {
    super(`the model refused to write this proposal${category ? ` (${category})` : ''}`);
    this.name = 'ProposalRefusedError';
  }
}

export class ProposalGenerationError extends Error {
  constructor(
    readonly attempts: number,
    readonly issues: readonly string[],
  ) {
    super(
      `proposal generation failed after ${attempts} attempt(s): ${issues.slice(0, 3).join('; ')}`,
    );
    this.name = 'ProposalGenerationError';
  }
}

export interface GenerateProposalOptions {
  maxAttempts?: number;
  model?: string;
  promptVersion?: string;
  now?: () => Date;
  newId?: () => string;
}

export interface GenerateProposalResult {
  proposal: Proposal;
  verification: ProposalVerification;
  attempts: number;
}

export interface ProposalContext {
  opportunityId: string;
  leadId: string;
  researchVersion: string;
}

export async function generateProposal(
  model: ProposalModel,
  rawInput: ProposalInput,
  context: ProposalContext,
  options: GenerateProposalOptions = {},
): Promise<GenerateProposalResult> {
  const input = proposalInputSchema.parse(rawInput);
  const maxAttempts = options.maxAttempts ?? 2;
  const modelName = options.model ?? 'claude-opus-5';
  const promptVersion = options.promptVersion ?? PROMPT_VERSION;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => randomUUID());

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: buildUserMessage(input) },
  ];

  let attempts = 0;
  let issues: string[] = [];
  let best: { content: GeneratedProposal; verification: ProposalVerification } | null = null;

  while (attempts < maxAttempts) {
    attempts += 1;
    const result = await model({ system: SYSTEM_PROMPT, messages });
    if (result.kind === 'refusal') throw new ProposalRefusedError(result.category);

    const parsed = generatedProposalSchema.safeParse(result.value);
    if (!parsed.success) {
      issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      if (attempts >= maxAttempts) break;
      messages.push({ role: 'assistant', content: JSON.stringify(result.value) });
      messages.push({ role: 'user', content: buildRepairMessage(issues.join('; ')) });
      continue;
    }

    const verification = verifyProposal(parsed.data, input);
    best = { content: parsed.data, verification };
    if (verification.ok) break;

    issues = verification.defects.map((defect) => defect.detail);
    if (attempts >= maxAttempts) break;
    messages.push({ role: 'assistant', content: JSON.stringify(parsed.data) });
    messages.push({ role: 'user', content: buildRepairMessage(verification.explanation) });
  }

  if (!best) throw new ProposalGenerationError(attempts, issues);

  const createdAt = now();
  const proposal = proposalSchema.parse({
    id: newId(),
    opportunityId: context.opportunityId,
    leadId: context.leadId,
    // Always DRAFT. Generation never approves anything.
    state: 'DRAFT',
    currentVersion: 1,
    versions: [
      {
        proposalId: 'pending',
        version: 1,
        templateId: input.templateId,
        content: best.content,
        // The authoritative figure comes from the input, never the model.
        amountPaise: input.pricing.amountPaise,
        currency: input.pricing.currency,
        model: modelName,
        promptVersion,
        researchVersion: context.researchVersion,
        createdAt,
        createdBy: SYSTEM_AUTHOR,
        editSummary: null,
      },
    ],
    approvedBy: null,
    sentAt: null,
    answeredAt: null,
  });

  return {
    proposal: {
      ...proposal,
      versions: proposal.versions.map((version) => ({ ...version, proposalId: proposal.id })),
    },
    verification: best.verification,
    attempts,
  };
}
