import type { StoredPersonalization } from '@acos/core-personalization';

import type { OutreachPreparationGeneration } from './types';

// Pure, deterministic draft construction (Phase 22, R-55/R-56). No LLM, no
// I/O, no clock, no randomness, no fetch of any kind — mirrors
// @acos/core-personalization's own generator.ts (Decision P1) and
// @acos/core-qualification's evaluator.ts.
// -----------------------------------------------------------------------
// The ONLY input is an already-persisted StoredPersonalization. This
// module never reads ResearchSignal, Qualification, Search, Company, or
// Prospect directly — it cannot perform new discovery, new research, a
// new qualification decision, or a re-personalization, because it has no
// dependency capable of reaching any of those. `evidence` is passed
// through unmodified (R-56); `subjectLine`/`messageBody`/`callToAction`
// are template sentences built only from the Personalization's own
// `offerService`/`openingContext`/`valueProposition` — nothing here
// invents a company fact, metric, testimonial, relationship, funding
// detail, technology-usage claim, or hiring signal.
// -----------------------------------------------------------------------

export const GENERATOR_VERSION = 'outreach-preparation-v1';

/**
 * Generates the Outreach Preparation draft's content fields from an
 * already-persisted Personalization. Pure: the same Personalization
 * content always produces the same draft.
 */
export function generateOutreachPreparation(
  personalization: Pick<
    StoredPersonalization,
    'offerService' | 'openingContext' | 'valueProposition' | 'evidence'
  >,
): OutreachPreparationGeneration {
  const callToAction = `Would you be open to a short conversation about ${personalization.offerService}?`;
  const subjectLine = `${personalization.offerService} — a quick note`;
  const messageBody =
    `${personalization.openingContext} ${personalization.valueProposition} ${callToAction}`.trim();

  return {
    subjectLine,
    messageBody,
    callToAction,
    evidence: personalization.evidence,
  };
}
