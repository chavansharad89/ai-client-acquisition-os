import { planFollowUp, MAX_FOLLOW_UPS } from './cadence';
import { isTerminal, type OpportunityStage } from './stages';

// WHAT SHOULD I DO NEXT — the daily queue.
// -----------------------------------------------------------------------
// The engine's whole point. A freelancer opening this tool should see one
// ordered list, not nine dashboards.
//
// Two ideas do the work:
//   * Every stage has ONE next action. If a stage cannot name what to do
//     next, the stage is wrong.
//   * Urgency comes from STALENESS, not from stage. An opportunity sitting
//     in QUALIFIED for three weeks is more urgent than a fresh NEW one,
//     because the cost of a stalled warm lead is higher.
// -----------------------------------------------------------------------

export type ActionKind =
  | 'RESEARCH_LEAD'
  | 'CHOOSE_OFFER'
  | 'DRAFT_MESSAGE'
  | 'SEND_MESSAGE'
  | 'SEND_FOLLOW_UP'
  | 'REVIEW_REPLY'
  | 'SEND_PROPOSAL'
  | 'CHASE_PROPOSAL'
  | 'CLOSE_OR_DROP'
  | 'NOTHING';

export interface OpportunitySnapshot {
  opportunityId: string;
  leadName: string;
  stage: OpportunityStage;
  stageChangedAt: Date;
  /** Unanswered inbound reply waiting on the operator. */
  hasUnreadReply: boolean;
  followUpsSent: number;
  nextFollowUpDueAt?: Date | null;
  estimatedValuePaise?: number | null;
}

export interface NextAction {
  opportunityId: string;
  leadName: string;
  kind: ActionKind;
  /** Imperative, specific. This is the line the operator reads. */
  label: string;
  /** Higher is more urgent. */
  priority: number;
  dueAt?: Date;
  stalledDays: number;
}

/** Days in a stage before it is considered stalled. */
export const STALE_AFTER_DAYS: Record<OpportunityStage, number> = {
  NEW: 7,
  RESEARCHED: 3,
  CONTACTED: 4,
  // A reply waiting on an answer goes stale fastest — it is the one place
  // delay costs a warm lead rather than a cold one.
  REPLIED: 1,
  QUALIFIED: 3,
  PROPOSAL_SENT: 5,
  WON: Number.POSITIVE_INFINITY,
  LOST: Number.POSITIVE_INFINITY,
  PAUSED: Number.POSITIVE_INFINITY,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const STAGE_ACTION: Record<OpportunityStage, { kind: ActionKind; label: string }> = {
  NEW: { kind: 'RESEARCH_LEAD', label: 'Find a reason to contact them' },
  RESEARCHED: { kind: 'DRAFT_MESSAGE', label: 'Draft the opening message' },
  CONTACTED: { kind: 'SEND_FOLLOW_UP', label: 'Follow up' },
  REPLIED: { kind: 'REVIEW_REPLY', label: 'Reply to them' },
  QUALIFIED: { kind: 'SEND_PROPOSAL', label: 'Send the proposal' },
  PROPOSAL_SENT: { kind: 'CHASE_PROPOSAL', label: 'Chase the proposal' },
  WON: { kind: 'NOTHING', label: 'Won' },
  LOST: { kind: 'NOTHING', label: 'Closed' },
  PAUSED: { kind: 'NOTHING', label: 'Paused' },
};

export function nextActionFor(snapshot: OpportunitySnapshot, now: Date = new Date()): NextAction {
  const stalledDays = Math.floor((now.getTime() - snapshot.stageChangedAt.getTime()) / DAY_MS);
  const base = { opportunityId: snapshot.opportunityId, leadName: snapshot.leadName, stalledDays };

  if (isTerminal(snapshot.stage) || snapshot.stage === 'PAUSED') {
    return { ...base, kind: 'NOTHING', label: STAGE_ACTION[snapshot.stage].label, priority: 0 };
  }

  // A human waiting on a reply outranks everything. Nothing in the
  // pipeline is worth more than answering someone who answered you.
  if (snapshot.hasUnreadReply) {
    return {
      ...base,
      kind: 'REVIEW_REPLY',
      label: `Reply to ${snapshot.leadName}`,
      priority: 1000 + stalledDays,
    };
  }

  // An exhausted sequence needs a decision, not another email.
  if (snapshot.stage === 'CONTACTED' && snapshot.followUpsSent >= MAX_FOLLOW_UPS) {
    return {
      ...base,
      kind: 'CLOSE_OR_DROP',
      label: `Close or drop ${snapshot.leadName} — ${MAX_FOLLOW_UPS} follow-ups sent, no reply`,
      priority: 300 + stalledDays,
    };
  }

  // A scheduled follow-up that is not yet due is not work today.
  if (snapshot.nextFollowUpDueAt && snapshot.nextFollowUpDueAt.getTime() > now.getTime()) {
    return {
      ...base,
      kind: 'NOTHING',
      label: `Waiting — next touch ${snapshot.nextFollowUpDueAt.toISOString().slice(0, 10)}`,
      priority: 0,
      dueAt: snapshot.nextFollowUpDueAt,
    };
  }

  const action = STAGE_ACTION[snapshot.stage];
  const threshold = STALE_AFTER_DAYS[snapshot.stage];
  const overdue = Math.max(0, stalledDays - threshold);

  // Value breaks ties between equally stale opportunities: chase the
  // bigger one first.
  const valueBonus = Math.min(50, Math.floor((snapshot.estimatedValuePaise ?? 0) / 1_000_000));

  return {
    ...base,
    kind: action.kind,
    label: `${action.label} — ${snapshot.leadName}`,
    priority: 100 + overdue * 10 + valueBonus,
  };
}

/** The operator's queue: most urgent first, nothing-to-do removed. */
export function buildQueue(
  snapshots: readonly OpportunitySnapshot[],
  now: Date = new Date(),
): readonly NextAction[] {
  return snapshots
    .map((snapshot) => nextActionFor(snapshot, now))
    .filter((action) => action.kind !== 'NOTHING')
    .sort((a, b) => b.priority - a.priority || a.leadName.localeCompare(b.leadName));
}

export { planFollowUp };
