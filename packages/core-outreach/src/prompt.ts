import { CHANNEL_SPECS, type OutreachChannel } from './channels';
import { SPAM_PHRASES } from './verify';
import type { GenerationInput } from './schema';

// The outreach prompt, versioned.
// -----------------------------------------------------------------------
// PROMPT_VERSION is stored on every generated message. When a batch of
// outreach performs badly — or embarrasses someone — the question is
// always "which prompt wrote this", and without a stored version the
// answer is archaeology.
//
// Bump it for ANY change to the text below. It is cheap to bump and
// expensive to have been wrong about.
// -----------------------------------------------------------------------

export const PROMPT_VERSION = 'outreach-2026-06-24.1';

export const SYSTEM_PROMPT = `You write first-contact messages for a freelancer approaching a company.

You are given evidence that was directly OBSERVED about the company — quotes from their own site, job posts and profiles. That evidence is everything you know. You have no other knowledge of this company.

Hard rules:

1. Never state a fact about the company that is not in the evidence. No revenue, headcount, funding, customer counts, tooling or history unless a quote says so. If you want to say something and cannot point to a quote, do not say it.
2. Never invent numbers. Every number you write must appear in the evidence.
3. Reference something real and specific. A message that would read identically to a hundred other companies is worthless — it costs the reader nothing to ignore and costs the sender their reputation.
4. Explain the business impact of what you noticed. Not "I can help with content" but what the observed situation is costing or delaying. One sentence.
5. One call to action. One question, at most one question mark. Two asks reliably costs you the first.
6. Sound like a person. Short sentences. No hedging, no throat-clearing, no compliment openers.

Never use these phrases: ${SPAM_PHRASES.slice(0, 8).join('; ')}.

For each message you must declare which evidence quotes you used, the business impact you argued, and your single call to action. Quote the evidence exactly as supplied — do not paraphrase it in the evidenceUsed field.`;

export function buildUserMessage(input: GenerationInput): string {
  const channelBriefs = input.channels
    .map((channel) => {
      const spec = CHANNEL_SPECS[channel as OutreachChannel];
      return [
        `### ${channel}`,
        `Length: ${spec.minChars}-${spec.maxChars} characters.`,
        spec.hasSubject
          ? `Subject line required, max ${spec.subjectMaxChars} characters.`
          : 'No subject line.',
        `Register: ${spec.register}.`,
        spec.guidance,
      ].join('\n');
    })
    .join('\n\n');

  const evidence = input.evidence
    .map((item, index) => `${index + 1}. "${item.quote}"\n   source: ${item.sourceUrl}`)
    .join('\n');

  return [
    'COMPANY',
    `Name: ${input.company.name}`,
    input.company.industry ? `Industry: ${input.company.industry}` : null,
    '',
    'PERSON',
    input.lead.firstName ? `First name: ${input.lead.firstName}` : 'First name: unknown',
    input.lead.role ? `Role: ${input.lead.role}` : 'Role: unknown',
    '',
    'OBSERVED EVIDENCE — this is everything you know about them',
    evidence,
    '',
    'WHAT IS BEING OFFERED',
    `Service: ${input.service}`,
    `Why it fits: ${input.offerRationale}`,
    '',
    `You are writing as ${input.senderFirstName}.`,
    '',
    'WRITE ONE MESSAGE PER CHANNEL',
    channelBriefs,
    '',
    'Each message must name the company, lean on at least one evidence quote, and make a different argument than simply restating the service.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/** Fed back when verification fails. Specific defects, not "try again". */
export function buildRepairMessage(
  failures: readonly { channel: string; explanation: string }[],
): string {
  return [
    'These messages failed verification:',
    ...failures.map((failure) => `- ${failure.channel}: ${failure.explanation}`),
    '',
    'Rewrite only the failed channels. The most common causes are writing a number that is not in the evidence, and asking two questions instead of one.',
  ].join('\n');
}
