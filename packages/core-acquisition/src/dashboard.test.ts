import { describe, expect, it } from 'vitest';

import {
  buildDashboard,
  DASHBOARD_SECTIONS,
  headlineFor,
  metricsFor,
  openOpportunities,
  sectionsFor,
  type DashboardSnapshot,
  type OpportunitySnapshot,
} from './index';

const NOW = new Date('2026-10-05T09:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const opportunity = (over: Partial<OpportunitySnapshot> = {}): OpportunitySnapshot => ({
  opportunityId: 'opp_1',
  leadName: 'Asha at Northwind',
  stage: 'CONTACTED',
  stageChangedAt: daysAgo(10),
  hasUnreadReply: false,
  followUpsSent: 0,
  ...over,
});

const snapshot = (over: Partial<DashboardSnapshot> = {}): DashboardSnapshot => ({
  leadsFound: 120,
  leadsResearched: 45,
  leadsWorthContacting: 30,
  outreachSent: 28,
  outreachAwaitingApproval: 4,
  replies: 7,
  unansweredReplies: 2,
  qualifiedLeads: 5,
  proposalsSent: 3,
  proposalsAwaitingApproval: 1,
  wins: 2,
  losses: 6,
  clients: 2,
  revenuePaise: 30_000_000,
  followUpsDue: 3,
  byStage: {
    NEW: 75,
    RESEARCHED: 12,
    CONTACTED: 18,
    REPLIED: 2,
    QUALIFIED: 5,
    PROPOSAL_SENT: 3,
    WON: 2,
    LOST: 6,
    PAUSED: 4,
  },
  opportunities: [opportunity()],
  ...over,
});

// ============================================ what should I do next ====

describe('what should I do next', () => {
  it('is the first thing the dashboard produces', () => {
    const dashboard = buildDashboard(snapshot(), NOW);
    expect(Object.keys(dashboard)[0]).toBe('nextActions');
    expect(dashboard.nextActions.length).toBeGreaterThan(0);
  });

  it('puts an unanswered reply at the top of the queue', () => {
    const dashboard = buildDashboard(
      snapshot({
        opportunities: [
          opportunity({ opportunityId: 'stale', stage: 'QUALIFIED', stageChangedAt: daysAgo(40) }),
          opportunity({ opportunityId: 'reply', hasUnreadReply: true }),
        ],
      }),
      NOW,
    );
    expect(dashboard.nextActions[0]!.opportunityId).toBe('reply');
  });

  it('says how many people are waiting, not just how many tasks', () => {
    const dashboard = buildDashboard(
      snapshot({
        opportunities: [
          opportunity({ opportunityId: 'a', hasUnreadReply: true }),
          opportunity({ opportunityId: 'b', hasUnreadReply: true }),
        ],
      }),
      NOW,
    );
    expect(dashboard.headline).toMatch(/2 people are waiting on a reply/);
  });

  it('uses the singular when one person is waiting', () => {
    const dashboard = buildDashboard(
      snapshot({ opportunities: [opportunity({ hasUnreadReply: true })] }),
      NOW,
    );
    expect(dashboard.headline).toMatch(/1 person is waiting/);
  });
});

// ================================================ the empty states =====

describe('an empty queue still answers the question', () => {
  it('tells a brand-new user where to start', () => {
    const dashboard = buildDashboard(
      snapshot({ leadsFound: 0, leadsResearched: 0, opportunities: [], followUpsDue: 0 }),
      NOW,
    );
    expect(dashboard.nextActions).toEqual([]);
    expect(dashboard.headline).toMatch(/start by finding companies/i);
  });

  it('distinguishes "no leads" from "no leads researched"', () => {
    const noLeads = headlineFor([], snapshot({ leadsFound: 0, leadsResearched: 0 }));
    const unresearched = headlineFor([], snapshot({ leadsFound: 40, leadsResearched: 0 }));
    expect(noLeads).not.toBe(unresearched);
    expect(unresearched).toMatch(/none researched/);
  });

  it('distinguishes "nothing due" from "nothing to do"', () => {
    const waiting = headlineFor([], snapshot({ followUpsDue: 0 }));
    expect(waiting).toMatch(/waiting on someone else/);
  });

  it('never renders emptiness as a blank panel', () => {
    for (const input of [
      snapshot({ leadsFound: 0, leadsResearched: 0, opportunities: [] }),
      snapshot({ opportunities: [], followUpsDue: 0 }),
      snapshot({ opportunities: [] }),
    ]) {
      expect(buildDashboard(input, NOW).headline.length).toBeGreaterThan(20);
    }
  });
});

// ==================================================== the metrics ======

describe('the ten metrics', () => {
  it('are exactly the ones specified', () => {
    expect(metricsFor(snapshot()).map((metric) => metric.key)).toEqual([
      'leadsFound',
      'leadsResearched',
      'outreachSent',
      'replies',
      'qualifiedLeads',
      'proposals',
      'wins',
      'conversionRate',
      'revenue',
      'averageDealValue',
    ]);
  });

  it('measures conversion against researched leads, not leads found', () => {
    // A rate measured against leads found rewards scraping harder.
    const metrics = metricsFor(snapshot({ leadsFound: 10_000 }));
    const conversion = metrics.find((metric) => metric.key === 'conversionRate')!;
    expect(conversion.value).toBeCloseTo(2 / 45);
    expect(conversion.note).toMatch(/not per lead found/);
  });

  it('computes average deal value from wins only', () => {
    const average = metricsFor(snapshot()).find((m) => m.key === 'averageDealValue')!;
    expect(average.value).toBe(15_000_000);
  });

  it('never divides by zero', () => {
    const empty = metricsFor(
      snapshot({ leadsResearched: 0, wins: 0, outreachSent: 0, revenuePaise: 0 }),
    );
    for (const metric of empty) {
      expect(Number.isFinite(metric.value), metric.key).toBe(true);
      expect(Number.isNaN(metric.value), metric.key).toBe(false);
    }
  });

  it('gives every metric a note, so no tile is a bare number', () => {
    for (const metric of metricsFor(snapshot())) {
      expect(metric.note.trim().length, metric.key).toBeGreaterThan(0);
    }
  });

  it('says plainly when there is nothing to average', () => {
    const average = metricsFor(snapshot({ wins: 0 })).find((m) => m.key === 'averageDealValue')!;
    expect(average.note).toMatch(/no wins yet/i);
  });

  it('carries a render format so money is never shown as a count', () => {
    const byKey = new Map(metricsFor(snapshot()).map((m) => [m.key, m.format]));
    expect(byKey.get('revenue')).toBe('paise');
    expect(byKey.get('averageDealValue')).toBe('paise');
    expect(byKey.get('conversionRate')).toBe('percent');
    expect(byKey.get('wins')).toBe('count');
  });
});

// =================================================== the sections ======

describe('the ten sections', () => {
  it('are exactly the ones specified, in order', () => {
    expect([...DASHBOARD_SECTIONS]).toEqual([
      'leads',
      'research',
      'opportunities',
      'outreach',
      'followUps',
      'conversations',
      'proposals',
      'clients',
      'revenue',
      'analytics',
    ]);
    expect(sectionsFor(snapshot()).map((s) => s.section)).toEqual([...DASHBOARD_SECTIONS]);
  });

  it('flags the sections that need the operator specifically', () => {
    const attention = buildDashboard(snapshot(), NOW).attention.map((s) => s.section);
    expect(attention).toContain('outreach'); // 4 drafts awaiting approval
    expect(attention).toContain('conversations'); // 2 unanswered replies
    expect(attention).toContain('proposals'); // 1 awaiting approval
    expect(attention).not.toContain('clients');
  });

  it('orders attention by how much is waiting', () => {
    const attention = buildDashboard(snapshot(), NOW).attention;
    const counts = attention.map((section) => section.needsAttention);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it('a big calm section does not outrank a small urgent one', () => {
    // Clients has 2 rows and needs nothing; proposals has 1 waiting.
    const dashboard = buildDashboard(snapshot(), NOW);
    const sections = dashboard.attention.map((s) => s.section);
    expect(sections).not.toContain('clients');
    expect(sections).toContain('proposals');
  });

  it('explains what each section wants, not just how many rows it has', () => {
    for (const section of sectionsFor(snapshot())) {
      expect(section.note.trim().length, section.section).toBeGreaterThan(10);
    }
  });

  it('counts unresearched leads as the leads section attention', () => {
    const leads = sectionsFor(snapshot()).find((s) => s.section === 'leads')!;
    expect(leads.needsAttention).toBe(120 - 45);
  });
});

// ==================================================== pipeline =========

describe('pipeline counts', () => {
  it('counts only live stages as open opportunities', () => {
    // Won, lost and paused are not open work.
    expect(openOpportunities(snapshot())).toBe(75 + 12 + 18 + 2 + 5 + 3);
  });

  it('excludes paused from open work', () => {
    const withMorePaused = openOpportunities(
      snapshot({ byStage: { ...snapshot().byStage, PAUSED: 400 } }),
    );
    expect(withMorePaused).toBe(openOpportunities(snapshot()));
  });
});

describe('consistency', () => {
  it('is deterministic', () => {
    const a = JSON.stringify(buildDashboard(snapshot(), NOW));
    const b = JSON.stringify(buildDashboard(snapshot(), NOW));
    expect(a).toBe(b);
  });

  it('handles a completely empty account without throwing', () => {
    const empty: DashboardSnapshot = {
      ...snapshot(),
      leadsFound: 0,
      leadsResearched: 0,
      leadsWorthContacting: 0,
      outreachSent: 0,
      outreachAwaitingApproval: 0,
      replies: 0,
      unansweredReplies: 0,
      qualifiedLeads: 0,
      proposalsSent: 0,
      proposalsAwaitingApproval: 0,
      wins: 0,
      losses: 0,
      clients: 0,
      revenuePaise: 0,
      followUpsDue: 0,
      byStage: {
        NEW: 0, RESEARCHED: 0, CONTACTED: 0, REPLIED: 0, QUALIFIED: 0,
        PROPOSAL_SENT: 0, WON: 0, LOST: 0, PAUSED: 0,
      },
      opportunities: [],
    };
    const dashboard = buildDashboard(empty, NOW);
    expect(dashboard.metrics).toHaveLength(10);
    expect(dashboard.sections).toHaveLength(10);
    expect(dashboard.attention).toEqual([]);
  });
});
