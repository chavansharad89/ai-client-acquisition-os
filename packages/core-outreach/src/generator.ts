import { randomUUID } from 'node:crypto';

import type { Observation } from '@acos/core-research';

import { buildRepairMessage, buildUserMessage, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt';
import {
  generationInputSchema,
  generationOutputSchema,
  type GeneratedMessage,
  type GenerationInput,
  type StoredMessage,
} from './schema';
import { verifyAll, type Verification } from './verify';

// Generation: build, verify, repair, store as DRAFT.
// -----------------------------------------------------------------------
// The output is never "a message" — it is a draft plus its verification.
// Callers are handed both, so a failing message is visible rather than
// silently dropped, and a reviewer can see why the machine was unhappy
// before deciding for themselves.
// -----------------------------------------------------------------------

export interface OutreachModel {
  (request: {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<{ kind: 'json'; value: unknown } | { kind: 'refusal'; category: string | null }>;
}

export class OutreachRefusedError extends Error {
  constructor(readonly category: string | null) {
    super(`the model refused to write this outreach${category ? ` (${category})` : ''}`);
    this.name = 'OutreachRefusedError';
  }
}

export class OutreachGenerationError extends Error {
  constructor(
    readonly attempts: number,
    readonly issues: readonly string[],
  ) {
    super(
      `outreach generation failed after ${attempts} attempt(s): ${issues.slice(0, 4).join('; ')}`,
    );
    this.name = 'OutreachGenerationError';
  }
}

/**
 * Strips research down to what a message may be built from.
 *
 * Only OBSERVED claims with real evidence survive. This is the structural
 * half of "never fabricate": the model is not asked to avoid using
 * inferences — it is never shown them.
 */
export function toEvidencePool(
  observations: readonly (Observation & { field?: string })[],
): GenerationInput['evidence'] {
  return observations
    .filter((observation) => observation.classification === 'OBSERVED')
    .flatMap((observation) =>
      observation.evidence.map((evidence) => ({
        quote: evidence.quote,
        sourceUrl: evidence.sourceUrl,
        signal: observation.value ?? evidence.quote,
      })),
    )
    .slice(0, 8);
}

export interface GenerateOptions {
  maxAttempts?: number;
  model?: string;
  promptVersion?: string;
  now?: () => Date;
  newId?: () => string;
}

export interface GeneratedDraft {
  message: StoredMessage;
  verification: Verification;
}

export interface GenerateResult {
  drafts: readonly GeneratedDraft[];
  attempts: number;
  /** Channels still failing verification after the last attempt. */
  failedChannels: readonly string[];
}

export interface GenerateContext {
  opportunityId: string;
  leadId: string;
  /** Identifies the research run the evidence came from. */
  researchVersion: string;
}

export async function generateOutreach(
  model: OutreachModel,
  rawInput: GenerationInput,
  context: GenerateContext,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const input = generationInputSchema.parse(rawInput);
  const maxAttempts = options.maxAttempts ?? 2;
  const modelName = options.model ?? 'claude-opus-5';
  const promptVersion = options.promptVersion ?? PROMPT_VERSION;
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => randomUUID());

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: buildUserMessage(input) },
  ];

  let attempts = 0;
  let lastIssues: string[] = [];
  let best: { messages: GeneratedMessage[]; verifications: Record<string, Verification> } | null =
    null;

  while (attempts < maxAttempts) {
    attempts += 1;

    const result = await model({ system: SYSTEM_PROMPT, messages });
    if (result.kind === 'refusal') throw new OutreachRefusedError(result.category);

    const parsed = generationOutputSchema.safeParse(result.value);
    if (!parsed.success) {
      lastIssues = parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      );
      if (attempts >= maxAttempts) break;
      messages.push({ role: 'assistant', content: JSON.stringify(result.value) });
      messages.push({
        role: 'user',
        content: `Your response did not match the required shape: ${lastIssues.join('; ')}. Return corrected JSON.`,
      });
      continue;
    }

    const verifications = verifyAll(parsed.data.messages, input);
    best = { messages: parsed.data.messages, verifications };

    const failures = Object.entries(verifications)
      .filter(([, verification]) => !verification.ok)
      .map(([channel, verification]) => ({ channel, explanation: verification.explanation }));

    if (failures.length === 0) break;

    lastIssues = failures.map((failure) => `${failure.channel}: ${failure.explanation}`);
    if (attempts >= maxAttempts) break;

    messages.push({ role: 'assistant', content: JSON.stringify(parsed.data) });
    messages.push({ role: 'user', content: buildRepairMessage(failures) });
  }

  if (!best) throw new OutreachGenerationError(attempts, lastIssues);

  const generatedAt = now();
  const drafts: GeneratedDraft[] = best.messages.map((message) => ({
    // Always DRAFT. There is no code path that produces an approved
    // message — only a person can do that.
    message: {
      id: newId(),
      opportunityId: context.opportunityId,
      leadId: context.leadId,
      channel: message.channel,
      subject: message.subject,
      body: message.body,
      model: modelName,
      promptVersion,
      generatedAt,
      researchVersion: context.researchVersion,
      evidenceUsed: message.evidenceUsed,
      impactClaim: message.impactClaim,
      callToAction: message.callToAction,
      approvalState: 'DRAFT',
      approvedBy: null,
      approvedAt: null,
      rejectedReason: null,
      sentAt: null,
      editedByHuman: false,
    },
    verification: best!.verifications[message.channel]!,
  }));

  return {
    drafts,
    attempts,
    failedChannels: drafts
      .filter((draft) => !draft.verification.ok)
      .map((draft) => draft.message.channel),
  };
}
