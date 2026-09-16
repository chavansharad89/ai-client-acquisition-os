import { describe, expect, it } from 'vitest';

import {
  availableChannels,
  chooseChannel,
  dueFollowUps,
  isHumanAuthorized,
  MAX_FOLLOW_UPS,
  pause,
  planNextFollowUp,
  recordAuthorization,
  recordDecline,
  recordProposal,
  recordSend,
  recordStageChange,
  resume,
  SYSTEM_ACTOR,
  timeline,
  UnauthorizedActorError,
  type ContactChannels,
  type FollowUpContext,
} from './index';

const NOW = new Date('2026-08-03T09:00:00.000Z'); // a Monday
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const allChannels: ContactChannels = {
  email: true,
  linkedIn: true,
  whatsApp: true,
  instagram: true,
};

const context = (over: Partial<FollowUpContext> = {}): FollowUpContext => ({
  opportunityId: 'opp_1',
  leadName: 'Asha at Northwind',
  stage: 'CONTACTED',
  lastTouchAt: daysAgo(10),
  lastReplyAt: null,
  followUpsSent: 0,
  channels: allChannels,
  lastChannel: 'EMAIL',
  unsubscribed: false,
  pausedUntil: null,
  ...over,
});

// ================================================ never auto-send ======

describe('nothing is ever sent without authorisation', () => {
  it('every proposal is flagged as requiring authorisation', () => {
    const stages = ['NEW', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'WON', 'PAUSED'] as const;
    for (const stage of stages) {
      expect(planNextFollowUp(context({ stage }), NOW).requiresAuthorization, stage).toBe(true);
    }
  });

  it('the module exposes no way to send', () => {
    // A scheduler that can both decide and send is one bug from mailing
    // the whole list. Sending lives behind the approval gate instead.
    const proposal = planNextFollowUp(context(), NOW);
    expect(Object.keys(proposal)).not.toContain('send');
    expect(proposal.decision).toBe('SCHEDULE');
  });

  it('SYSTEM cannot authorise a follow-up', () => {
    const proposal = planNextFollowUp(context(), NOW);
    expect(() => recordAuthorization(proposal, SYSTEM_ACTOR, NOW)).toThrow(UnauthorizedActorError);
    expect(() => recordAuthorization(proposal, '   ', NOW)).toThrow(UnauthorizedActorError);
  });

  it('SYSTEM cannot record a send', () => {
    expect(() => recordSend('opp_1', SYSTEM_ACTOR, 'msg_1', NOW)).toThrow(UnauthorizedActorError);
  });

  it('explains why, so the guard is not removed as an inconvenience', () => {
    expect(() => recordSend('opp_1', SYSTEM_ACTOR, 'm', NOW)).toThrow(/named human actor/);
  });

  it('a named person can authorise and send', () => {
    const proposal = planNextFollowUp(context(), NOW);
    const authorised = recordAuthorization(proposal, 'sharad@example.com', NOW);
    const sent = recordSend('opp_1', 'sharad@example.com', 'msg_1', NOW);
    expect(isHumanAuthorized(authorised)).toBe(true);
    expect(isHumanAuthorized(sent)).toBe(true);
  });

  it('a machine proposal is never mistaken for an authorisation', () => {
    const entry = recordProposal(planNextFollowUp(context(), NOW), NOW);
    expect(entry.actor).toBe(SYSTEM_ACTOR);
    expect(isHumanAuthorized(entry)).toBe(false);
  });
});

// ======================================================== when =========

describe('when to follow up', () => {
  it('schedules when the touch is due', () => {
    const proposal = planNextFollowUp(context(), NOW);
    expect(proposal.decision).toBe('SCHEDULE');
    expect(proposal.attempt).toBe(1);
  });

  it('waits when it is not due yet', () => {
    const proposal = planNextFollowUp(context({ lastTouchAt: daysAgo(1) }), NOW);
    expect(proposal.decision).toBe('WAIT');
    expect(proposal.dueAt).not.toBeNull();
    expect(proposal.reason).toMatch(/not due until/);
  });

  it('stops once the sequence is exhausted', () => {
    const proposal = planNextFollowUp(context({ followUpsSent: MAX_FOLLOW_UPS }), NOW);
    expect(proposal.decision).toBe('STOP_EXHAUSTED');
    expect(proposal.reason).toMatch(/close the file/);
  });

  it('never starts before the first message has gone out', () => {
    expect(planNextFollowUp(context({ stage: 'RESEARCHED' }), NOW).decision).toBe(
      'STOP_NOT_CONTACTED',
    );
    expect(planNextFollowUp(context({ lastTouchAt: null }), NOW).decision).toBe(
      'STOP_NOT_CONTACTED',
    );
  });

  it('orders the due queue by date', () => {
    const queue = dueFollowUps(
      [
        context({ opportunityId: 'later', lastTouchAt: daysAgo(8) }),
        context({ opportunityId: 'earlier', lastTouchAt: daysAgo(40) }),
      ],
      NOW,
    );
    expect(queue.map((p) => p.opportunityId)).toEqual(['earlier', 'later']);
  });

  it('the due queue contains only things to act on', () => {
    const queue = dueFollowUps(
      [context(), context({ stage: 'WON' }), context({ lastReplyAt: daysAgo(1) })],
      NOW,
    );
    expect(queue).toHaveLength(1);
  });
});

// =============================================== stop conditions =======

describe('when NOT to follow up', () => {
  it('stops the moment a lead replies', () => {
    const replied = planNextFollowUp(context({ lastReplyAt: daysAgo(2) }), NOW);
    expect(replied.decision).toBe('STOP_REPLIED');
    expect(replied.reason).toMatch(/Answer them yourself/);
  });

  it('stops for a lead in the REPLIED state even with no reply timestamp', () => {
    expect(planNextFollowUp(context({ stage: 'REPLIED' }), NOW).decision).toBe('STOP_REPLIED');
  });

  it('never contacts someone who unsubscribed, whatever the stage', () => {
    for (const stage of ['CONTACTED', 'QUALIFIED', 'REPLIED'] as const) {
      const proposal = planNextFollowUp(context({ stage, unsubscribed: true }), NOW);
      expect(proposal.decision, stage).toBe('STOP_UNSUBSCRIBED');
    }
  });

  it('unsubscribe outranks every other rule', () => {
    const proposal = planNextFollowUp(
      context({ unsubscribed: true, lastReplyAt: daysAgo(1), stage: 'REPLIED' }),
      NOW,
    );
    expect(proposal.decision).toBe('STOP_UNSUBSCRIBED');
  });

  it('stops while paused, and says until when', () => {
    const proposal = planNextFollowUp(
      context({ stage: 'PAUSED', pausedUntil: new Date('2026-10-01T00:00:00.000Z') }),
      NOW,
    );
    expect(proposal.decision).toBe('STOP_PAUSED');
    expect(proposal.reason).toContain('2026-10-01');
  });

  it('stops for closed opportunities', () => {
    expect(planNextFollowUp(context({ stage: 'WON' }), NOW).decision).toBe('STOP_CLOSED');
    expect(planNextFollowUp(context({ stage: 'LOST' }), NOW).decision).toBe('STOP_CLOSED');
  });

  it('stops when there is no channel to use', () => {
    const proposal = planNextFollowUp(
      context({
        channels: { email: false, linkedIn: false, whatsApp: false, instagram: false },
      }),
      NOW,
    );
    expect(proposal.decision).toBe('STOP_NO_CHANNEL');
  });

  it('gives a reason for every stop — silence is a bad answer', () => {
    const stops = [
      context({ unsubscribed: true }),
      context({ lastReplyAt: NOW }),
      context({ stage: 'PAUSED' }),
      context({ stage: 'LOST' }),
      context({ followUpsSent: MAX_FOLLOW_UPS }),
      context({ stage: 'NEW' }),
    ];
    for (const input of stops) {
      const proposal = planNextFollowUp(input, NOW);
      expect(proposal.reason.length, proposal.decision).toBeGreaterThan(10);
    }
  });
});

// ===================================================== channel =========

describe('which channel', () => {
  it('escalates to a different channel on later attempts', () => {
    const first = chooseChannel(allChannels, 1, null);
    const second = chooseChannel(allChannels, 2, first);
    expect(second).not.toBe(first);
  });

  it('only offers channels the lead actually has', () => {
    const emailOnly = { email: true, linkedIn: false, whatsApp: false, instagram: false };
    expect(availableChannels(emailOnly)).toEqual(['EMAIL']);
    expect(chooseChannel(emailOnly, 3, 'EMAIL')).toBe('EMAIL');
  });

  it('returns null when there is nowhere to send', () => {
    expect(
      chooseChannel({ email: false, linkedIn: false, whatsApp: false, instagram: false }, 1, null),
    ).toBeNull();
  });

  it('names the channel switch in the reason', () => {
    const proposal = planNextFollowUp(context({ followUpsSent: 1, lastChannel: 'EMAIL' }), NOW);
    expect(proposal.reason).toMatch(/instead of EMAIL/);
  });
});

// ===================================================== message =========

describe('what the message should say', () => {
  it('gives each attempt a different angle', () => {
    // Spacing widens to 13 business days by the last attempt, so the last
    // touch must be far enough back for every attempt to be due.
    const angles = [1, 2, 3, 4].map(
      (n) =>
        planNextFollowUp(context({ followUpsSent: n - 1, lastTouchAt: daysAgo(60) }), NOW)
          .messageAngle,
    );
    expect(angles.every((angle) => angle !== null)).toBe(true);
    expect(new Set(angles).size).toBe(4);
  });

  it('ends by asking whether to close the file, not by pitching again', () => {
    const last = planNextFollowUp(
      context({ followUpsSent: MAX_FOLLOW_UPS - 1, lastTouchAt: daysAgo(60) }),
      NOW,
    );
    expect(last.decision).toBe('SCHEDULE');
    expect(last.messageAngle).toMatch(/close the file/);
  });

  it('supplies no angle when nothing is being scheduled', () => {
    expect(planNextFollowUp(context({ stage: 'WON' }), NOW).messageAngle).toBeNull();
  });
});

// ======================================================== pause ========

describe('pause and resume', () => {
  it('remembers where it was paused from', () => {
    const record = pause('QUALIFIED', 'their budget reopens in Q4', null);
    expect(record.pausedFrom).toBe('QUALIFIED');
    expect(resume(record)).toBe('QUALIFIED');
  });

  it('requires a reason', () => {
    expect(() => pause('CONTACTED', '  ', null)).toThrow(/requires a reason/);
  });

  it('refuses to pause something already closed', () => {
    expect(() => pause('WON', 'why', null)).toThrow();
  });
});

// ==================================================== audit ============

describe('audit trail', () => {
  it('records who did what and why', () => {
    const entry = recordStageChange(
      'opp_1',
      'CONTACTED',
      'REPLIED',
      'sharad',
      'they answered',
      NOW,
    );
    expect(entry).toMatchObject({
      kind: 'STAGE_CHANGED',
      actor: 'sharad',
      reason: 'they answered',
    });
    expect(entry.detail).toEqual({ from: 'CONTACTED', to: 'REPLIED' });
  });

  it('labels a pause and a resume distinctly', () => {
    expect(recordStageChange('o', 'CONTACTED', 'PAUSED', 'a', 'r', NOW).kind).toBe('PAUSED');
    expect(recordStageChange('o', 'PAUSED', 'CONTACTED', 'a', 'r', NOW).kind).toBe('RESUMED');
  });

  it('records a decline with the human who declined it', () => {
    const proposal = planNextFollowUp(context(), NOW);
    const entry = recordDecline(proposal, 'sharad', 'wrong timing', NOW);
    expect(entry).toMatchObject({ kind: 'FOLLOW_UP_DECLINED', actor: 'sharad' });
    expect(() => recordDecline(proposal, SYSTEM_ACTOR, 'x', NOW)).toThrow(UnauthorizedActorError);
  });

  it('distinguishes a machine stop from a machine proposal', () => {
    const scheduled = recordProposal(planNextFollowUp(context(), NOW), NOW);
    const stopped = recordProposal(planNextFollowUp(context({ stage: 'WON' }), NOW), NOW);
    expect(scheduled.kind).toBe('FOLLOW_UP_PROPOSED');
    expect(stopped.kind).toBe('SEQUENCE_STOPPED');
  });

  it('builds a chronological narrative', () => {
    const entries = [
      recordSend('o', 'sharad', 'm', new Date(NOW.getTime() + 2000)),
      recordProposal(planNextFollowUp(context(), NOW), NOW),
      recordAuthorization(
        planNextFollowUp(context(), NOW),
        'sharad',
        new Date(NOW.getTime() + 1000),
      ),
    ];
    expect(timeline(entries).map((entry) => entry.kind)).toEqual([
      'FOLLOW_UP_PROPOSED',
      'FOLLOW_UP_AUTHORIZED',
      'FOLLOW_UP_SENT',
    ]);
  });

  it('every entry carries a non-empty reason', () => {
    const entries = [
      recordStageChange('o', 'NEW', 'RESEARCHED', 'a', 'researched them', NOW),
      recordProposal(planNextFollowUp(context(), NOW), NOW),
      recordAuthorization(planNextFollowUp(context(), NOW), 'sharad', NOW),
      recordSend('o', 'sharad', 'm', NOW),
    ];
    for (const entry of entries) expect(entry.reason.trim().length).toBeGreaterThan(0);
  });
});
