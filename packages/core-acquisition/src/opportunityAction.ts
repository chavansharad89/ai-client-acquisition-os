import type { OpportunityStage } from './stages';
import type { OpportunityStaleness } from './staleness';

// WHAT SHOULD I DO NEXT — MVP Opportunity Next Action (PRD V2.1 R-20, Stage T).
// -----------------------------------------------------------------------
// A different engine from nextAction.ts's buildQueue()/nextActionFor():
// that one assumes the full nine-stage CRM pipeline (CONTACTED, REPLIED,
// QUALIFIED, PROPOSAL_SENT, follow-up cadence, unread replies) — none of
// which the MVP Opportunity model has. The MVP Opportunity only ever
// reaches NEW or RESEARCHED (core-opportunity's OpportunityState) and
// carries no outreach/CRM state at all (MVP_SCOPE_BOUNDARY.md §6.2-6.4:
// autonomous outreach, CRM and proposal sending are all out of scope).
//
// This recommends ONE of four things a user can do — never an outreach,
// contact, or proposal action, and never anything autonomous (R-20:
// "Recommendation only; never autonomous action").
// -----------------------------------------------------------------------

export type OpportunityActionKind = 'HOLD' | 'REFRESH_RESEARCH' | 'CONSIDER_OFFER' | 'REVIEW_EVIDENCE';

export interface OpportunityActionInput {
  state: Extract<OpportunityStage, 'NEW' | 'RESEARCHED'>;
  needDetected: boolean;
  staleness: OpportunityStaleness;
}

export interface OpportunityAction {
  kind: OpportunityActionKind;
  /** Imperative, specific. The line the user reads. */
  label: string;
}

const LABEL: Record<OpportunityActionKind, string> = {
  HOLD: 'No suitable offer — nothing to act on yet',
  REFRESH_RESEARCH: 'Evidence has aged — refresh research before acting',
  CONSIDER_OFFER: 'Review the recommended offer',
  REVIEW_EVIDENCE: 'Review the evidence and reach out',
};

/**
 * Recommends one action for an Opportunity (R-20/AC-21), from fields the
 * MVP Opportunity already persists — never recomputes staleness or
 * re-detects a need. Deterministic: same input, same result.
 *
 * Precedence:
 *   1. No detected need / no offer (AC-14 NO SUITABLE OFFER) -> HOLD.
 *   2. Evidence no longer current (STALE or SUPERSEDED) -> REFRESH_RESEARCH,
 *      regardless of state — aged evidence should be refreshed before
 *      anything else, whether the Opportunity is NEW or RESEARCHED.
 *   3. Otherwise, state decides: NEW -> CONSIDER_OFFER, RESEARCHED ->
 *      REVIEW_EVIDENCE.
 */
export function recommendOpportunityAction(input: OpportunityActionInput): OpportunityAction {
  const kind = classify(input);
  return { kind, label: LABEL[kind] };
}

function classify({ state, needDetected, staleness }: OpportunityActionInput): OpportunityActionKind {
  if (!needDetected) return 'HOLD';
  if (staleness === 'STALE' || staleness === 'SUPERSEDED') return 'REFRESH_RESEARCH';
  return state === 'NEW' ? 'CONSIDER_OFFER' : 'REVIEW_EVIDENCE';
}
