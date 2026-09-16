import { describe, expect, it } from 'vitest';

import {
  addBusinessDays,
  allowedTransitions,
  anglePerformance,
  assertTransition,
  buildQueue,
  canTransition,
  CONTACT_THRESHOLD,
  decayFactor,
  fullSequence,
  InvalidStageTransitionError,
  isTerminal,
  isWorthContacting,
  MAX_FOLLOW_UPS,
  nextActionFor,
  OPPORTUNITY_STAGES,
  planFollowUp,
  scoreLead,
  suggestOffers,
  summarise,
  validateMessage,
  type ClosedOpportunity,
  type MessageBrief,
  type OpportunitySnapshot,
  type ResearchSignal,
} from './index';

const NOW = new Date('2026-06-15T09:00:00.000Z'); // a Monday
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const signal = (over: Partial<ResearchSignal> = {}): ResearchSignal => ({
  kind: 'JOB_POST',
  signal: 'hiring 3 content writers',
  confidence: 90,
  observedAt: daysAgo(2),
  ...over,
});

// ======================================================== stages =======

describe('the pipeline state machine', () => {
  it('has the nine specified states', () => {
    expect([...OPPORTUNITY_STAGES]).toEqual([
      'NEW',
      'RESEARCHED',
      'CONTACTED',
      'REPLIED',
      'QUALIFIED',
      'PROPOSAL_SENT',
      'WON',
      'LOST',
      'PAUSED',
    ]);
    expect(isTerminal('WON')).toBe(true);
    expect(isTerminal('LOST')).toBe(true);
    expect(isTerminal('PAUSED')).toBe(false); // paused is deferred, not closed
  });

  it('walks the happy path one step at a time', () => {
    const path = [
      'NEW',
      'RESEARCHED',
      'CONTACTED',
      'REPLIED',
      'QUALIFIED',
      'PROPOSAL_SENT',
      'WON',
    ] as const;
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i]!, path[i + 1]!), `${path[i]} -> ${path[i + 1]}`).toBe(true);
    }
  });

  it('lets any open stage be lost or paused', () => {
    for (const stage of OPPORTUNITY_STAGES) {
      if (isTerminal(stage)) continue;
      expect(canTransition(stage, 'LOST'), stage).toBe(true);
      if (stage !== 'PAUSED') expect(canTransition(stage, 'PAUSED'), stage).toBe(true);
    }
  });

  it('refuses to win a deal that was never proposed', () => {
    for (const stage of OPPORTUNITY_STAGES) {
      if (stage === 'PROPOSAL_SENT') continue;
      expect(canTransition(stage, 'WON'), stage).toBe(false);
    }
    expect(canTransition('PROPOSAL_SENT', 'WON')).toBe(true);
  });

  it('refuses to skip stages', () => {
    expect(canTransition('NEW', 'CONTACTED')).toBe(false);
    expect(canTransition('RESEARCHED', 'PROPOSAL_SENT')).toBe(false);
  });

  it('never reopens a closed opportunity', () => {
    expect(allowedTransitions('WON')).toEqual([]);
    expect(allowedTransitions('LOST')).toEqual([]);
    expect(() => assertTransition('LOST', 'CONTACTED')).toThrow(InvalidStageTransitionError);
  });

  it('explains a refused transition', () => {
    expect(() => assertTransition('NEW', 'WON')).toThrow(/allowed: RESEARCHED, LOST, PAUSED/);
    expect(() => assertTransition('WON', 'LOST')).toThrow(/terminal/);
  });

  it('lets a replied lead go back into a sequence if the thread dies', () => {
    expect(canTransition('REPLIED', 'CONTACTED')).toBe(true);
  });

  it('resumes a paused opportunity into any live stage', () => {
    for (const stage of [
      'NEW',
      'RESEARCHED',
      'CONTACTED',
      'REPLIED',
      'QUALIFIED',
      'PROPOSAL_SENT',
    ] as const) {
      expect(canTransition('PAUSED', stage), stage).toBe(true);
    }
    expect(canTransition('PAUSED', 'WON')).toBe(false);
  });
});

// ======================================================= scoring =======

describe('WHO should I contact', () => {
  it('scores a fresh job post highly and explains why', () => {
    const score = scoreLead([signal()], NOW);
    expect(score.score).toBeGreaterThanOrEqual(CONTACT_THRESHOLD);
    expect(score.reason).toContain('hiring 3 content writers');
    expect(isWorthContacting(score)).toBe(true);
  });

  it('decays old signals to nothing', () => {
    expect(decayFactor(0)).toBe(1);
    expect(decayFactor(30)).toBe(1);
    expect(decayFactor(180)).toBe(0);
    expect(decayFactor(105)).toBeCloseTo(0.5, 1);

    const stale = scoreLead([signal({ observedAt: daysAgo(200) })], NOW);
    expect(stale.score).toBe(0);
    expect(isWorthContacting(stale)).toBe(false);
  });

  it('ranks a recent signal above an identical old one', () => {
    const fresh = scoreLead([signal({ observedAt: daysAgo(1) })], NOW).score;
    const old = scoreLead([signal({ observedAt: daysAgo(120) })], NOW).score;
    expect(fresh).toBeGreaterThan(old);
  });

  it('weights a stated need above an inference', () => {
    const jobPost = scoreLead([signal({ kind: 'JOB_POST' })], NOW).score;
    const homepage = scoreLead([signal({ kind: 'WEBSITE' })], NOW).score;
    expect(jobPost).toBeGreaterThan(homepage);
  });

  it('scales with confidence', () => {
    const sure = scoreLead([signal({ confidence: 100 })], NOW).score;
    const unsure = scoreLead([signal({ confidence: 20 })], NOW).score;
    expect(sure).toBeGreaterThan(unsure);
  });

  it('ignores superseded findings', () => {
    const score = scoreLead([signal({ supersededAt: daysAgo(1) })], NOW);
    expect(score.score).toBe(0);
    expect(score.components).toEqual([]);
  });

  it('clamps at 100 however many signals pile up', () => {
    const many = Array.from({ length: 20 }, () => signal());
    expect(scoreLead(many, NOW).score).toBe(100);
  });

  it('says plainly when there is nothing to act on', () => {
    expect(scoreLead([], NOW).reason).toMatch(/no current signals/i);
  });
});

// ========================================================= offer =======

describe('WHAT service should I offer', () => {
  it('matches a hiring signal to a content system, with a rationale', () => {
    const [top] = suggestOffers([signal()]);
    expect(top?.service).toBe('AI content system');
    expect(top?.rationale).toContain('hiring 3 content writers');
    expect(top?.estimatedValuePaise).toBeGreaterThan(0);
  });

  it('returns nothing rather than guessing', () => {
    // A confident generic pitch is worse than silence.
    expect(suggestOffers([signal({ signal: 'they exist', kind: 'WEBSITE' })])).toEqual([]);
    expect(suggestOffers([])).toEqual([]);
  });

  it('ranks by fit and strengthens with corroboration', () => {
    const one = suggestOffers([signal()])[0]!.fit;
    const two = suggestOffers([signal(), signal({ signal: 'hiring an seo writer' })])[0]!.fit;
    expect(two).toBeGreaterThan(one);
  });

  it('names the signals it reasoned from', () => {
    expect(suggestOffers([signal()])[0]!.basedOn).toEqual(['hiring 3 content writers']);
  });

  it('ignores superseded signals', () => {
    expect(suggestOffers([signal({ supersededAt: NOW })])).toEqual([]);
  });
});

// ======================================================= cadence =======

describe('WHEN should I follow up', () => {
  it('widens the gap with each attempt', () => {
    const plans = fullSequence(NOW);
    const gaps = plans.map((plan, index) =>
      index === 0
        ? plan.dueAt.getTime() - NOW.getTime()
        : plan.dueAt.getTime() - plans[index - 1]!.dueAt.getTime(),
    );
    expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
  });

  it('stops after the configured number of touches', () => {
    expect(planFollowUp(NOW, MAX_FOLLOW_UPS).shouldSend).toBe(true);
    const past = planFollowUp(NOW, MAX_FOLLOW_UPS + 1);
    expect(past.shouldSend).toBe(false);
    expect(past.reason).toMatch(/sequence complete/i);
  });

  it('never schedules a touch on a weekend', () => {
    for (const plan of fullSequence(NOW)) {
      expect([0, 6]).not.toContain(plan.dueAt.getUTCDay());
    }
  });

  it('skips weekends when counting business days', () => {
    const friday = new Date('2026-06-19T09:00:00.000Z');
    expect(addBusinessDays(friday, 1).getUTCDay()).toBe(1); // Monday
  });

  it('rejects a nonsense attempt number', () => {
    expect(() => planFollowUp(NOW, 0)).toThrow(RangeError);
  });
});

// ==================================================== next action =======

describe('WHAT should I do next', () => {
  const snapshot = (over: Partial<OpportunitySnapshot> = {}): OpportunitySnapshot => ({
    opportunityId: 'opp_1',
    leadName: 'Asha at Northwind',
    stage: 'NEW',
    stageChangedAt: daysAgo(1),
    hasUnreadReply: false,
    followUpsSent: 0,
    ...over,
  });

  it('gives every live stage exactly one next action', () => {
    for (const stage of OPPORTUNITY_STAGES) {
      const action = nextActionFor(snapshot({ stage }), NOW);
      if (isTerminal(stage) || stage === 'PAUSED') expect(action.kind, stage).toBe('NOTHING');
      else expect(action.kind, stage).not.toBe('NOTHING');
    }
  });

  it('puts an unanswered reply above everything', () => {
    const queue = buildQueue(
      [
        snapshot({ opportunityId: 'stale', stage: 'QUALIFIED', stageChangedAt: daysAgo(60) }),
        snapshot({ opportunityId: 'reply', hasUnreadReply: true }),
      ],
      NOW,
    );
    expect(queue[0]?.opportunityId).toBe('reply');
    expect(queue[0]?.kind).toBe('REVIEW_REPLY');
  });

  it('ranks a stalled warm lead above a fresh cold one', () => {
    const queue = buildQueue(
      [
        snapshot({ opportunityId: 'fresh', stage: 'NEW', stageChangedAt: NOW }),
        snapshot({ opportunityId: 'stalled', stage: 'QUALIFIED', stageChangedAt: daysAgo(30) }),
      ],
      NOW,
    );
    expect(queue[0]?.opportunityId).toBe('stalled');
  });

  it('asks for a decision once the sequence is spent, not another email', () => {
    const action = nextActionFor(
      snapshot({ stage: 'CONTACTED', followUpsSent: MAX_FOLLOW_UPS }),
      NOW,
    );
    expect(action.kind).toBe('CLOSE_OR_DROP');
    expect(action.label).toMatch(/close or drop/i);
  });

  it('treats a not-yet-due follow-up as no work today', () => {
    const action = nextActionFor(
      snapshot({ stage: 'CONTACTED', nextFollowUpDueAt: new Date(NOW.getTime() + 86_400_000) }),
      NOW,
    );
    expect(action.kind).toBe('NOTHING');
  });

  it('breaks ties by deal value', () => {
    const queue = buildQueue(
      [
        snapshot({ opportunityId: 'small', estimatedValuePaise: 1_000_000 }),
        snapshot({ opportunityId: 'big', estimatedValuePaise: 40_000_000 }),
      ],
      NOW,
    );
    expect(queue[0]?.opportunityId).toBe('big');
  });

  it('leaves closed opportunities out of the queue', () => {
    expect(buildQueue([snapshot({ stage: 'WON' }), snapshot({ stage: 'LOST' })], NOW)).toEqual([]);
  });
});

// ======================================================= message =======

describe('WHAT should I say', () => {
  const brief: MessageBrief = {
    channel: 'EMAIL',
    companyName: 'Northwind',
    signals: [signal()],
    offer: suggestOffers([signal()])[0]!,
    sequenceIndex: 0,
    angle: 'hiring-signal',
  };

  it('accepts a personalised draft', () => {
    const result = validateMessage(
      {
        subject: 'Your three content roles',
        body: 'Saw Northwind is hiring 3 content writers — a system covers that without the headcount.',
        angle: 'hiring-signal',
      },
      brief,
    );
    expect(result.ok).toBe(true);
  });

  it('refuses an unfilled template', () => {
    const result = validateMessage(
      { subject: 'Hi', body: 'Hi {{firstName}}, I noticed {{signal}}.', angle: 'x' },
      brief,
    );
    expect(result.defects).toContain('unresolved-placeholder');
    expect(result.ok).toBe(false);
  });

  it('refuses a message that is personalised to nobody', () => {
    const result = validateMessage(
      { subject: 'Quick question', body: 'I help companies grow. Interested?', angle: 'x' },
      brief,
    );
    expect(result.defects).toContain('no-personalisation');
    expect(result.explanation).toMatch(/mentions neither/i);
  });

  it('enforces the channel limit', () => {
    const linkedin = { ...brief, channel: 'LINKEDIN' as const };
    const result = validateMessage({ body: `Northwind ${'x'.repeat(400)}`, angle: 'x' }, linkedin);
    expect(result.defects).toContain('too-long');
  });

  it('requires a subject on email only', () => {
    expect(validateMessage({ body: 'Northwind, hello', angle: 'x' }, brief).defects).toContain(
      'missing-subject',
    );
    expect(
      validateMessage({ body: 'Northwind, hello', angle: 'x' }, { ...brief, channel: 'LINKEDIN' })
        .defects,
    ).not.toContain('missing-subject');
  });
});

// ============================================== track and improve =======

describe('TRACK and IMPROVE', () => {
  const closed = (over: Partial<ClosedOpportunity> = {}): ClosedOpportunity => ({
    stage: 'LOST',
    furthestStage: 'CONTACTED',
    angle: 'hiring-signal',
    serviceOffer: 'AI content system',
    valuePaise: 15_000_000,
    followUpsSent: 2,
    openedAt: daysAgo(30),
    closedAt: daysAgo(2),
    ...over,
  });

  it('summarises the funnel', () => {
    const summary = summarise([
      closed({ stage: 'WON', furthestStage: 'PROPOSAL_SENT' }),
      closed(),
      closed(),
    ]);
    expect(summary).toMatchObject({ opened: 3, won: 1, lost: 2 });
    expect(summary.winRate).toBeCloseTo(1 / 3);
    expect(summary.revenuePaise).toBe(15_000_000);
  });

  it('ranks angles by wins, and reports the sample size beside the rate', () => {
    const [top] = anglePerformance([
      closed({ stage: 'WON', angle: 'hiring-signal' }),
      closed({ stage: 'WON', angle: 'hiring-signal' }),
      closed({ angle: 'hiring-signal' }),
      closed({ stage: 'WON', angle: 'lucky-one-off' }),
    ]);
    expect(top?.angle).toBe('hiring-signal');
    expect(top).toMatchObject({ sent: 3, won: 2 });
    // A 100% rate from one deal must not outrank two wins from three.
    expect(top?.winRate).toBeLessThan(1);
  });

  it('handles an empty history without dividing by zero', () => {
    expect(summarise([])).toMatchObject({ opened: 0, winRate: 0, medianDaysToClose: 0 });
    expect(anglePerformance([])).toEqual([]);
  });
});
