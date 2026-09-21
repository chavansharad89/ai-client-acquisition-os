import type { StoredOutreachPreparation } from '@acos/core-outreach-preparation';

import type { FollowUpPreparationGeneration } from './types';

// Pure, deterministic draft construction (Phase 23, R-64). No LLM, no I/O,
// no clock, no randomness, no fetch of any kind — mirrors
// @acos/core-outreach-preparation's own generator.ts.
// -----------------------------------------------------------------------
// The ONLY input is an already-persisted StoredOutreachPreparation. This
// module never reads Personalization, Qualification, ResearchSignal,
// Search, Company, or Prospect directly — it cannot perform new
// discovery, new research, a new qualification decision, a new
// personalization, or a new outreach draft, because it has no dependency
// capable of reaching any of those (R-61). `evidence` is passed through
// unmodified (R-63); `followUpContext`/`followUpContent`/`rationale` are
// template sentences built only from the Outreach Preparation's own
// `subjectLine`/`callToAction` — nothing here invents a company fact,
// metric, testimonial, relationship, funding detail, technology-usage
// claim, hiring signal, or a claim about whether/how the prospect
// responded.
// -----------------------------------------------------------------------

export const GENERATOR_VERSION = 'followup-preparation-v1';

/**
 * Generates the Follow-Up Preparation draft's content fields from an
 * already-persisted Outreach Preparation. Pure: the same Outreach
 * Preparation content always produces the same draft.
 */
export function generateFollowUpPreparation(
  outreachPreparation: Pick<StoredOutreachPreparation, 'subjectLine' | 'callToAction' | 'evidence'>,
): FollowUpPreparationGeneration {
  const followUpContext = `Follow-up to the previously prepared outreach draft: "${outreachPreparation.subjectLine}".`;
  const followUpContent = `Following up on my earlier note — ${outreachPreparation.callToAction}`;
  const rationale =
    'Deterministically generated as a follow-up to an existing, prepared Outreach Preparation draft; content and evidence are carried through unmodified for human review.';

  return {
    followUpContext,
    followUpContent,
    rationale,
    evidence: outreachPreparation.evidence,
  };
}
