// The opportunity lifecycle.
// -----------------------------------------------------------------------
// Nine states. Two earn their place in ways an earlier draft of this file
// missed:
//
//   REPLIED is a state, not a flag. A lead who answered is in a different
//   situation from one who has not, and the follow-up machinery must stop
//   for them — modelling that as a boolean on a CONTACTED row means every
//   consumer has to remember to check it, and one that forgets keeps
//   sending a sequence to someone who already replied.
//
//   PAUSED is not LOST. Deferring a lead ("circle back after their funding
//   closes") is an ordinary decision, and without a state for it the only
//   options are to lose the lead or to leave it stalling in the queue
//   forever. It remembers where it came from so resuming is not a guess.
//
// TRACK and IMPROVE remain reads across closed opportunities rather than
// states — nothing waits in them. See metrics.ts.
// -----------------------------------------------------------------------

export const OPPORTUNITY_STAGES = [
  'NEW',
  'RESEARCHED',
  'CONTACTED',
  'REPLIED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
  'PAUSED',
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

/** The ordered happy path. WON/LOST/PAUSED are exits, not steps. */
export const PIPELINE_ORDER: readonly OpportunityStage[] = [
  'NEW',
  'RESEARCHED',
  'CONTACTED',
  'REPLIED',
  'QUALIFIED',
  'PROPOSAL_SENT',
];

export const TERMINAL_STAGES: readonly OpportunityStage[] = ['WON', 'LOST'];

/** Stages a paused opportunity may resume into. */
export const RESUMABLE_STAGES: readonly OpportunityStage[] = PIPELINE_ORDER;

/**
 * Allowed transitions.
 *
 * Every live stage may go to LOST or PAUSED, because a lead can decline or
 * be deferred at any point. Only PROPOSAL_SENT may go to WON: a deal that
 * never had a proposal cannot be won, which stops the pipeline being
 * "fixed" by dragging something straight to closed.
 *
 * CONTACTED does not advance on its own — it stays put while follow-ups
 * run, and moves only when the lead replies or the operator qualifies
 * them. That is why there is no FOLLOWING_UP state: following up is what
 * happens *in* CONTACTED, not a place the opportunity goes.
 */
const TRANSITIONS: Record<OpportunityStage, readonly OpportunityStage[]> = {
  NEW: ['RESEARCHED', 'LOST', 'PAUSED'],
  RESEARCHED: ['CONTACTED', 'LOST', 'PAUSED'],
  CONTACTED: ['REPLIED', 'QUALIFIED', 'LOST', 'PAUSED'],
  REPLIED: ['QUALIFIED', 'CONTACTED', 'LOST', 'PAUSED'],
  QUALIFIED: ['PROPOSAL_SENT', 'LOST', 'PAUSED'],
  PROPOSAL_SENT: ['WON', 'LOST', 'PAUSED'],
  WON: [],
  LOST: [],
  PAUSED: [...PIPELINE_ORDER, 'LOST'],
};

export function allowedTransitions(from: OpportunityStage): readonly OpportunityStage[] {
  return TRANSITIONS[from];
}

export function canTransition(from: OpportunityStage, to: OpportunityStage): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTerminal(stage: OpportunityStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

/** True while an opportunity is still workable. PAUSED is not active. */
export function isActive(stage: OpportunityStage): boolean {
  return !isTerminal(stage) && stage !== 'PAUSED';
}

export class InvalidStageTransitionError extends Error {
  constructor(
    readonly from: OpportunityStage,
    readonly to: OpportunityStage,
  ) {
    super(
      `cannot move an opportunity from ${from} to ${to}` +
        (TRANSITIONS[from].length === 0
          ? ` — ${from} is terminal`
          : ` — allowed: ${TRANSITIONS[from].join(', ')}`),
    );
    this.name = 'InvalidStageTransitionError';
  }
}

export function assertTransition(from: OpportunityStage, to: OpportunityStage): void {
  if (!canTransition(from, to)) throw new InvalidStageTransitionError(from, to);
}

/** 0-based position on the happy path; -1 for exits. */
export function pipelinePosition(stage: OpportunityStage): number {
  return PIPELINE_ORDER.indexOf(stage);
}

/** A pause, with the stage to return to. Guessing on resume loses context. */
export interface PauseRecord {
  pausedFrom: OpportunityStage;
  reason: string;
  resumeAt: Date | null;
}

export function pause(from: OpportunityStage, reason: string, resumeAt: Date | null): PauseRecord {
  assertTransition(from, 'PAUSED');
  if (!reason.trim()) throw new Error('pausing an opportunity requires a reason');
  return { pausedFrom: from, reason, resumeAt };
}

export function resume(record: PauseRecord): OpportunityStage {
  if (!RESUMABLE_STAGES.includes(record.pausedFrom)) {
    throw new InvalidStageTransitionError('PAUSED', record.pausedFrom);
  }
  return record.pausedFrom;
}
