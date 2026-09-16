import type { RepairPlan } from './repair';
import type { ResearchInput } from './schema';

// The research prompt.
// -----------------------------------------------------------------------
// Two jobs: tell the model what counts as evidence, and make the cheapest
// path the honest one. The schema rejects unevidenced OBSERVED claims, so
// the prompt's task is to make UNKNOWN feel like a correct answer rather
// than a failure — otherwise the model strains to fill every field and
// the retry loop just burns tokens producing rejected output.
// -----------------------------------------------------------------------

export const SYSTEM_PROMPT = `You research companies for a freelancer deciding who to approach and what to offer.

You work ONLY from the source documents provided in the user message. You have no browsing ability and no background knowledge of this company. If a document does not say something, you do not know it.

Classify every claim you make:

OBSERVED — the source documents state this. You must quote the exact text and give the URL it came from. Paraphrased quotes are not quotes.
INFERRED — you reasoned this from observed facts. State what you reasoned from in "basis". Do not attach evidence: evidence means you saw it, which would make it OBSERVED. Confidence cannot exceed 80.
UNKNOWN — the documents do not tell you. Set value to null, evidence to [], confidence to 0.

UNKNOWN is a correct and useful answer. A freelancer who knows what you could not find out is better served than one given a plausible guess. Do not fill a field to avoid leaving it empty.

Never state a company's revenue, headcount, funding, customer count, or tooling unless a document says so. Never infer a person's seniority or intent from a job title alone. Never describe a problem the company has not shown evidence of having.

For recommendedService, "NONE" is a legitimate answer when the documents do not support a specific offer. Choosing it is better than recommending something generic.

List anything you could not determine in "gaps".`;

/** Renders the input into the user message. Pure, so the prompt is testable. */
export function buildUserMessage(input: ResearchInput): string {
  const facts = [
    `Company name: ${input.companyName}`,
    `Website: ${input.websiteUrl}`,
    input.industry ? `Industry (supplied, unverified): ${input.industry}` : null,
    input.location ? `Location (supplied, unverified): ${input.location}` : null,
    input.socialProfileUrl ? `Social profile: ${input.socialProfileUrl}` : null,
  ].filter(Boolean);

  const documents =
    input.sourceDocuments.length === 0
      ? 'NO SOURCE DOCUMENTS WERE PROVIDED. You can observe nothing. Almost every field should be UNKNOWN.'
      : input.sourceDocuments
          .map(
            (doc, index) =>
              `--- DOCUMENT ${index + 1} ---\nLabel: ${doc.label}\nURL: ${doc.url}\n\n${doc.text}\n`,
          )
          .join('\n');

  return [
    'SUPPLIED FACTS',
    ...facts,
    '',
    'The industry and location above were supplied by the operator, not verified by you.',
    'Treat them as INFERRED at best; do not cite them as OBSERVED.',
    '',
    'SOURCE DOCUMENTS',
    documents,
  ].join('\n');
}

/**
 * The correction appended on a retry after schema validation failed.
 *
 * Feeding the exact validation errors back is what makes the retry worth
 * making — a bare "try again" usually reproduces the same shape.
 */
export function buildRepairMessage(errors: readonly string[]): string {
  return [
    'Your previous response failed validation with these errors:',
    ...errors.map((error) => `- ${error}`),
    '',
    'Fix them and return the corrected research. The most common cause is marking a claim OBSERVED without quoting the source text — if you cannot quote it, the claim is INFERRED or UNKNOWN.',
  ].join('\n');
}

/** Just the document block, so a repair can include it only when needed. */
function renderDocuments(input: ResearchInput): string {
  if (input.sourceDocuments.length === 0) {
    return 'NO SOURCE DOCUMENTS WERE PROVIDED. You can observe nothing. Almost every field should be UNKNOWN.';
  }
  return input.sourceDocuments
    .map(
      (doc, index) =>
        `--- DOCUMENT ${index + 1} ---\nLabel: ${doc.label}\nURL: ${doc.url}\n\n${doc.text}\n`,
    )
    .join('\n');
}

/**
 * The targeted correction sent on a repair round.
 *
 * Carries four things and nothing else: what failed, where, the current
 * content of ONLY those places, and — only when the failures are about
 * evidence — the source documents.
 *
 * The instruction to return a complete document is not a contradiction of
 * that narrowness. The response schema requires one, and the caller
 * splices back only the named paths, so whatever the model says about
 * everything else is discarded rather than trusted. Saying so plainly
 * here is what stops the model treating the omission of other fields as
 * permission to reinvent them.
 */
export function buildTargetedRepairMessage(plan: RepairPlan, input: ResearchInput): string {
  const lines: string[] = [
    'Your previous response failed validation.',
    '',
    'WHAT FAILED:',
    ...plan.issues.map((issue) => `- ${issue.path}: ${issue.message}`),
    ...(plan.omittedIssues > 0
      ? [`- (and ${plan.omittedIssues} more of the same kind — fix them all)`]
      : []),
    '',
    `FIX ONLY THESE FIELDS: ${plan.roots.join(', ')}`,
    '',
    'Their current content, which is what was rejected:',
    JSON.stringify(plan.excerpt, null, 2),
  ];

  if (plan.includeSources) {
    lines.push(
      '',
      'The source documents again, because these failures are about evidence.',
      'Every OBSERVED quote must be copied verbatim from one of these, and its',
      'sourceUrl must be that document\'s URL:',
      '',
      renderDocuments(input),
    );
  } else {
    lines.push(
      '',
      'These failures do not involve evidence, so the source documents are not',
      'repeated. Do not invent new quotes.',
    );
  }

  lines.push(
    '',
    'Return the complete research object as usual. Only the fields listed above',
    'will be taken from your answer — everything else is carried over from your',
    'previous response, so do not try to restate it and do not treat its absence',
    'here as licence to change it.',
    '',
    'The most common cause is marking a claim OBSERVED without quoting the source',
    'text. If you cannot copy the quote, the claim is INFERRED or UNKNOWN.',
  );

  return lines.join('\n');
}
