import { decayFactor, type ResearchSignal } from './scoring';

// HAS THE EVIDENCE AGED — Opportunity staleness (PRD V2.1 R-19, Stage S).
// -----------------------------------------------------------------------
// A different question from Next Action's per-stage "how long has this
// sat here" (nextAction.ts's STALE_AFTER_DAYS, keyed by OpportunityStage
// — a CRM-funnel concept the MVP's two-state Opportunity doesn't have).
// This is about the EVIDENCE, not the pipeline: does the Opportunity
// still rest on signals worth acting on today?
//
// Reuses the same age/decay curve scoring already relies on
// (decayFactor/SIGNAL_FRESH_DAYS from ./scoring, `supersededAt` from
// ResearchSignal) rather than inventing a second one:
//   * SUPERSEDED — no currently-active signal remains. Every observation
//     that once backed this Opportunity has been superseded by a later
//     research run (scoring.ts: "superseded findings are history, not
//     evidence"), so there is nothing current to act on.
//   * FRESH — at least one active signal is still at full decay weight
//     (decayFactor === 1, i.e. within SIGNAL_FRESH_DAYS).
//   * STALE — active signals remain, but the freshest of them has
//     already started decaying.
// -----------------------------------------------------------------------

export type OpportunityStaleness = 'FRESH' | 'STALE' | 'SUPERSEDED';

const DAY_MS = 24 * 60 * 60 * 1000;

export function classifyStaleness(
  signals: readonly ResearchSignal[],
  now: Date = new Date(),
): OpportunityStaleness {
  const active = signals.filter((signal) => !signal.supersededAt);
  if (active.length === 0) return 'SUPERSEDED';

  const freshestAgeDays = Math.min(
    ...active.map((signal) => Math.max(0, (now.getTime() - signal.observedAt.getTime()) / DAY_MS)),
  );

  return decayFactor(freshestAgeDays) >= 1 ? 'FRESH' : 'STALE';
}
