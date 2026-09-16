import type { FollowUpDecision, FollowUpProposal } from './followUp';
import type { OpportunityStage } from './stages';

// The audit trail.
// -----------------------------------------------------------------------
// Append-only. Every stage change, every follow-up decision, and every
// authorisation is recorded with who did it and why.
//
// The "who" matters more than it looks: the difference between a message
// the system proposed and one a person approved is the whole basis for
// answering "why did we email this person", and an entry without an actor
// cannot answer it. `SYSTEM` is a legitimate actor for a decision, but
// never for an authorisation.
// -----------------------------------------------------------------------

export type AuditEventKind =
  | 'STAGE_CHANGED'
  | 'PAUSED'
  | 'RESUMED'
  | 'FOLLOW_UP_PROPOSED'
  | 'FOLLOW_UP_AUTHORIZED'
  | 'FOLLOW_UP_DECLINED'
  | 'FOLLOW_UP_SENT'
  | 'SEQUENCE_STOPPED';

export const SYSTEM_ACTOR = 'SYSTEM' as const;
export type Actor = string;

export interface AuditEntry {
  opportunityId: string;
  kind: AuditEventKind;
  /** A user identifier, or SYSTEM for an automated decision. */
  actor: Actor;
  /** Always populated. An audit entry without a reason explains nothing. */
  reason: string;
  detail?: Record<string, unknown>;
  occurredAt: Date;
}

export class UnauthorizedActorError extends Error {
  constructor(kind: AuditEventKind) {
    super(
      `${kind} requires a named human actor — SYSTEM cannot authorise or send outreach on its own`,
    );
    this.name = 'UnauthorizedActorError';
  }
}

/** Events that a machine may never be the actor for. */
const HUMAN_ONLY: readonly AuditEventKind[] = [
  'FOLLOW_UP_AUTHORIZED',
  'FOLLOW_UP_DECLINED',
  'FOLLOW_UP_SENT',
];

export function recordStageChange(
  opportunityId: string,
  from: OpportunityStage,
  to: OpportunityStage,
  actor: Actor,
  reason: string,
  occurredAt: Date,
): AuditEntry {
  return {
    opportunityId,
    kind: to === 'PAUSED' ? 'PAUSED' : from === 'PAUSED' ? 'RESUMED' : 'STAGE_CHANGED',
    actor,
    reason,
    detail: { from, to },
    occurredAt,
  };
}

/** A proposal is a machine decision; SYSTEM is the correct actor. */
export function recordProposal(proposal: FollowUpProposal, occurredAt: Date): AuditEntry {
  return {
    opportunityId: proposal.opportunityId,
    kind: proposal.decision === 'SCHEDULE' ? 'FOLLOW_UP_PROPOSED' : 'SEQUENCE_STOPPED',
    actor: SYSTEM_ACTOR,
    reason: proposal.reason,
    detail: {
      decision: proposal.decision satisfies FollowUpDecision,
      channel: proposal.channel,
      attempt: proposal.attempt,
      dueAt: proposal.dueAt?.toISOString() ?? null,
    },
    occurredAt,
  };
}

/**
 * Records a human authorising a follow-up.
 *
 * Throws if the actor is SYSTEM. This is the enforcement point for "never
 * send without explicit authorisation": there is no way to write an
 * authorisation entry that a machine produced, so an unauthorised send
 * leaves an audit trail that visibly has no approver.
 */
export function recordAuthorization(
  proposal: FollowUpProposal,
  actor: Actor,
  occurredAt: Date,
): AuditEntry {
  assertHumanActor('FOLLOW_UP_AUTHORIZED', actor);
  return {
    opportunityId: proposal.opportunityId,
    kind: 'FOLLOW_UP_AUTHORIZED',
    actor,
    reason: `Authorised follow-up ${proposal.attempt} on ${proposal.channel}.`,
    detail: { attempt: proposal.attempt, channel: proposal.channel },
    occurredAt,
  };
}

export function recordDecline(
  proposal: FollowUpProposal,
  actor: Actor,
  reason: string,
  occurredAt: Date,
): AuditEntry {
  assertHumanActor('FOLLOW_UP_DECLINED', actor);
  return {
    opportunityId: proposal.opportunityId,
    kind: 'FOLLOW_UP_DECLINED',
    actor,
    reason,
    detail: { attempt: proposal.attempt },
    occurredAt,
  };
}

export function recordSend(
  opportunityId: string,
  actor: Actor,
  messageId: string,
  occurredAt: Date,
): AuditEntry {
  assertHumanActor('FOLLOW_UP_SENT', actor);
  return {
    opportunityId,
    kind: 'FOLLOW_UP_SENT',
    actor,
    reason: `Sent after authorisation by ${actor}.`,
    detail: { messageId },
    occurredAt,
  };
}

export function assertHumanActor(kind: AuditEventKind, actor: Actor): void {
  if (!HUMAN_ONLY.includes(kind)) return;
  if (!actor.trim() || actor === SYSTEM_ACTOR) throw new UnauthorizedActorError(kind);
}

/** True only for an entry a named person is responsible for. */
export function isHumanAuthorized(entry: AuditEntry): boolean {
  return (
    HUMAN_ONLY.includes(entry.kind) && entry.actor !== SYSTEM_ACTOR && entry.actor.trim() !== ''
  );
}

/** Chronological, oldest first — the narrative of one opportunity. */
export function timeline(entries: readonly AuditEntry[]): readonly AuditEntry[] {
  return [...entries].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}
