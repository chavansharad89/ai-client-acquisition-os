import { checkPricing } from './pricing';
import type { GeneratedProposal, ProposalInput } from './schema';
import { templateById, type ProposalSection, type ProposalTemplate } from './templates';

// Proposal verification.
// -----------------------------------------------------------------------
// Beyond price integrity (pricing.ts), three things are checked that a
// proposal reliably gets wrong:
//
//   * ABSOLUTE DATES. The model was given a duration, not a start date.
//     "Delivered by 14 March" is a commitment nobody made.
//   * TIMELINE ARITHMETIC. Phase durations that do not add up to the
//     agreed total are how a four-week project becomes seven.
//   * UNEVIDENCED CLAIMS ABOUT THE CLIENT. Anything asserted about their
//     situation that is not in the evidence belongs in assumptions —
//     which is precisely what the assumptions section is for.
// -----------------------------------------------------------------------

export type ProposalDefect =
  | 'section-too-short'
  | 'section-too-long'
  | 'absolute-date'
  | 'timeline-mismatch'
  | 'too-few-deliverables'
  | 'too-many-deliverables'
  | 'no-assumptions'
  | 'fabricated-number'
  | 'pricing';

export interface Defect {
  code: ProposalDefect;
  detail: string;
}

export interface ProposalVerification {
  ok: boolean;
  defects: readonly Defect[];
  explanation: string;
}

/** Month names and dd/mm patterns — a date the operator never supplied. */
const ABSOLUTE_DATE =
  /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|jun(e)?|jul(y)?|aug(ust)?|sep(tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b20\d{2}-\d{2}-\d{2}\b/i;

const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

function significantNumbers(text: string): string[] {
  return (text.match(/\b\d[\d,]*\b/g) ?? [])
    .map((raw) => raw.replace(/,/g, ''))
    .filter((raw) => Number(raw) > 10);
}

export function verifyProposal(
  proposal: GeneratedProposal,
  input: ProposalInput,
  template: ProposalTemplate | null = templateById(input.templateId),
): ProposalVerification {
  const defects: Defect[] = [];
  if (!template) {
    return {
      ok: false,
      defects: [{ code: 'section-too-short', detail: `unknown template "${input.templateId}"` }],
      explanation: `Unknown template "${input.templateId}".`,
    };
  }

  // --- section lengths --------------------------------------------------
  const prose: Partial<Record<ProposalSection, string>> = {
    problem: proposal.problem,
    currentSituation: proposal.currentSituation,
    recommendedSolution: proposal.recommendedSolution,
    pricing: proposal.pricing,
    nextStep: proposal.nextStep,
  };
  for (const [section, text] of Object.entries(prose) as [ProposalSection, string][]) {
    const spec = template.sectionSpecs[section];
    const words = wordCount(text);
    if (words < spec.minWords) {
      defects.push({
        code: 'section-too-short',
        detail: `${section} is ${words} words; ${template.name} wants at least ${spec.minWords}`,
      });
    }
    if (words > spec.maxWords) {
      defects.push({
        code: 'section-too-long',
        detail: `${section} is ${words} words; ${template.name} allows ${spec.maxWords}`,
      });
    }
  }

  // --- deliverables -----------------------------------------------------
  const [minDeliverables, maxDeliverables] = template.deliverableRange;
  if (proposal.deliverables.length < minDeliverables) {
    defects.push({
      code: 'too-few-deliverables',
      detail: `${proposal.deliverables.length} deliverables; ${template.name} expects at least ${minDeliverables}`,
    });
  }
  if (proposal.deliverables.length > maxDeliverables) {
    defects.push({
      code: 'too-many-deliverables',
      detail: `${proposal.deliverables.length} deliverables; ${template.name} expects at most ${maxDeliverables}`,
    });
  }

  // --- assumptions ------------------------------------------------------
  if (proposal.assumptions.length === 0) {
    defects.push({
      code: 'no-assumptions',
      detail: 'a proposal with no stated assumptions is one that has not been thought about',
    });
  }

  // --- dates ------------------------------------------------------------
  const timelineText = [
    ...proposal.timeline.map((phase) => `${phase.phase} ${phase.outcome}`),
    proposal.nextStep,
  ].join(' ');
  if (ABSOLUTE_DATE.test(timelineText)) {
    defects.push({
      code: 'absolute-date',
      detail: 'the timeline names a calendar date; only durations were agreed',
    });
  }

  // --- timeline arithmetic ---------------------------------------------
  const totalWeeks = proposal.timeline.reduce((sum, phase) => sum + phase.durationWeeks, 0);
  if (totalWeeks !== input.timeline.totalWeeks) {
    defects.push({
      code: 'timeline-mismatch',
      detail: `phases total ${totalWeeks} weeks but ${input.timeline.totalWeeks} was agreed`,
    });
  }

  // --- unevidenced specifics -------------------------------------------
  const evidenceNumbers = new Set(
    significantNumbers(input.evidence.map((item) => item.quote).join(' ')),
  );
  const agreedNumbers = new Set([
    String(input.timeline.totalWeeks),
    ...proposal.timeline.map((phase) => String(phase.durationWeeks)),
  ]);
  const claimText = `${proposal.problem} ${proposal.currentSituation}`;
  for (const number of significantNumbers(claimText)) {
    if (!evidenceNumbers.has(number) && !agreedNumbers.has(number)) {
      defects.push({
        code: 'fabricated-number',
        detail: `"${number}" is asserted about the client but appears in no evidence`,
      });
    }
  }

  // --- pricing ----------------------------------------------------------
  for (const defect of checkPricing(proposal.pricing, input).defects) {
    defects.push({ code: 'pricing', detail: defect.detail });
  }

  return {
    ok: defects.length === 0,
    defects,
    explanation:
      defects.length === 0
        ? 'Passes every check. A human still has to read it before it goes out.'
        : `Not sendable: ${defects.map((d) => d.detail).join('; ')}.`,
  };
}
