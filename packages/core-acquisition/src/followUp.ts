import { MAX_FOLLOW_UPS, planFollowUp } from './cadence';
import { isActive, type OpportunityStage } from './stages';

// The follow-up workflow.
// -----------------------------------------------------------------------
// Decides four things: WHEN the next touch is due, on WHICH channel, WHAT
// the message should argue, and WHY now.
//
// It decides nothing about sending. Every output of this module is a
// PROPOSAL — a draft that a person must authorise. There is no function
// here that dispatches, and `FollowUpProposal` has no path to "sent"; that
// belongs to the approval gate in @acos/core-outreach, which requires a
// named human. A scheduler that can both decide and send is one bug away
// from mailing your entire list.
// -----------------------------------------------------------------------

export type FollowUpChannel = 'EMAIL' | 'LINKEDIN' | 'WHATSAPP' | 'INSTAGRAM_DM';

export interface ContactChannels {
  email: boolean;
  linkedIn: boolean;
  whatsApp: boolean;
  instagram: boolean;
}

export interface FollowUpContext {
  opportunityId: string;
  leadName: string;
  stage: OpportunityStage;
  /** When the last outbound touch went out. */
  lastTouchAt: Date | null;
  /** When the lead last replied, if ever. */
  lastReplyAt: Date | null;
  followUpsSent: number;
  channels: ContactChannels;
  /** The channel the previous touch used, so the next one can escalate. */
  lastChannel: FollowUpChannel | null;
  unsubscribed: boolean;
  /** Set while the opportunity is paused. */
  pausedUntil: Date | null;
}

export type FollowUpDecision =
  | 'SCHEDULE'
  | 'WAIT'
  | 'STOP_REPLIED'
  | 'STOP_EXHAUSTED'
  | 'STOP_UNSUBSCRIBED'
  | 'STOP_PAUSED'
  | 'STOP_CLOSED'
  | 'STOP_NOT_CONTACTED'
  | 'STOP_NO_CHANNEL';

export interface FollowUpProposal {
  opportunityId: string;
  decision: FollowUpDecision;
  /** Only set when decision is SCHEDULE. */
  dueAt: Date | null;
  channel: FollowUpChannel | null;
  attempt: number;
  /** The argument this touch should make — input to the message generator. */
  messageAngle: string | null;
  /** Why this, why now. Always present, including for every stop. */
  reason: string;
  /**
   * Always false. Nothing this module produces may be sent without a
   * person authorising it; the field exists so a caller cannot forget.
   */
  readonly requiresAuthorization: true;
}

/**
 * Channel escalation.
 *
 * Later touches move to a more personal channel rather than repeating the
 * same one. A third identical email is noise; a LinkedIn note after two
 * unanswered emails is a different attempt. Only channels the lead
 * actually has are considered.
 */
export const CHANNEL_ESCALATION: readonly FollowUpChannel[] = [
  'EMAIL',
  'LINKEDIN',
  'WHATSAPP',
  'INSTAGRAM_DM',
];

export function availableChannels(channels: ContactChannels): readonly FollowUpChannel[] {
  return CHANNEL_ESCALATION.filter((channel) =>
    channel === 'EMAIL'
      ? channels.email
      : channel === 'LINKEDIN'
        ? channels.linkedIn
        : channel === 'WHATSAPP'
          ? channels.whatsApp
          : channels.instagram,
  );
}

export function chooseChannel(
  channels: ContactChannels,
  attempt: number,
  lastChannel: FollowUpChannel | null,
): FollowUpChannel | null {
  const available = availableChannels(channels);
  if (available.length === 0) return null;

  // Escalate by attempt, but never past what is available; repeat the last
  // resort rather than inventing a channel the lead does not have.
  const preferred = available[Math.min(attempt - 1, available.length - 1)] ?? null;
  if (preferred && preferred !== lastChannel) return preferred;

  // Same channel as last time — acceptable only if there is nothing else.
  const alternative = available.find((channel) => channel !== lastChannel);
  return alternative ?? preferred;
}

/** What each touch should argue. Repeating the first pitch is why people stop reading. */
const ANGLE_BY_ATTEMPT: readonly string[] = [
  'restate the observation briefly and make the ask smaller',
  'add a second observed detail they may not have connected to the first',
  'offer something concrete and free — a teardown, a specific example',
  'acknowledge the silence plainly and ask whether to close the file',
];

export function angleFor(attempt: number): string {
  return ANGLE_BY_ATTEMPT[Math.min(attempt, ANGLE_BY_ATTEMPT.length) - 1]!;
}

const stop = (
  context: FollowUpContext,
  decision: FollowUpDecision,
  reason: string,
): FollowUpProposal => ({
  opportunityId: context.opportunityId,
  decision,
  dueAt: null,
  channel: null,
  attempt: context.followUpsSent,
  messageAngle: null,
  reason,
  requiresAuthorization: true,
});

/**
 * Decides the next follow-up.
 *
 * Every branch returns a reason, including the stops — "why is nothing
 * happening with this lead" is the question an operator asks most often,
 * and silence is a bad answer.
 */
export function planNextFollowUp(
  context: FollowUpContext,
  now: Date = new Date(),
): FollowUpProposal {
  if (context.unsubscribed) {
    return stop(
      context,
      'STOP_UNSUBSCRIBED',
      `${context.leadName} has unsubscribed — never contact again.`,
    );
  }

  if (context.stage === 'REPLIED' || context.lastReplyAt !== null) {
    // The single most important rule here. Continuing a sequence after a
    // reply is what makes outreach look automated and gets domains blocked.
    return stop(
      context,
      'STOP_REPLIED',
      `${context.leadName} replied — the sequence stops. Answer them yourself.`,
    );
  }

  if (!isActive(context.stage)) {
    return context.stage === 'PAUSED'
      ? stop(
          context,
          'STOP_PAUSED',
          context.pausedUntil
            ? `Paused until ${context.pausedUntil.toISOString().slice(0, 10)}.`
            : 'Paused indefinitely — resume it to restart follow-ups.',
        )
      : stop(context, 'STOP_CLOSED', `This opportunity is ${context.stage}; nothing to chase.`);
  }

  if (context.stage !== 'CONTACTED' || context.lastTouchAt === null) {
    return stop(
      context,
      'STOP_NOT_CONTACTED',
      `Nothing has been sent yet — follow-ups begin after the first message.`,
    );
  }

  const attempt = context.followUpsSent + 1;
  if (attempt > MAX_FOLLOW_UPS) {
    return stop(
      context,
      'STOP_EXHAUSTED',
      `${MAX_FOLLOW_UPS} follow-ups sent with no reply — close the file or come back in a quarter.`,
    );
  }

  const channel = chooseChannel(context.channels, attempt, context.lastChannel);
  if (channel === null) {
    return stop(
      context,
      'STOP_NO_CHANNEL',
      `No contact channel is available for ${context.leadName}.`,
    );
  }

  const plan = planFollowUp(context.lastTouchAt, attempt);
  const due = plan.dueAt;

  if (due.getTime() > now.getTime()) {
    return {
      opportunityId: context.opportunityId,
      decision: 'WAIT',
      dueAt: due,
      channel,
      attempt,
      messageAngle: null,
      reason: `Follow-up ${attempt} is not due until ${due.toISOString().slice(0, 10)}.`,
      requiresAuthorization: true,
    };
  }

  return {
    opportunityId: context.opportunityId,
    decision: 'SCHEDULE',
    dueAt: due,
    channel,
    attempt,
    messageAngle: angleFor(attempt),
    reason:
      `Follow-up ${attempt} of ${MAX_FOLLOW_UPS} is due. No reply since ` +
      `${context.lastTouchAt.toISOString().slice(0, 10)}; sending on ${channel} ` +
      `${context.lastChannel && channel !== context.lastChannel ? `instead of ${context.lastChannel} ` : ''}` +
      `to ${angleFor(attempt)}.`,
    requiresAuthorization: true,
  };
}

/** The operator's due queue. Only proposals awaiting their authorisation. */
export function dueFollowUps(
  contexts: readonly FollowUpContext[],
  now: Date = new Date(),
): readonly FollowUpProposal[] {
  return contexts
    .map((context) => planNextFollowUp(context, now))
    .filter((proposal) => proposal.decision === 'SCHEDULE')
    .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));
}
