import { buildQueue, type NextAction, type OpportunitySnapshot } from './nextAction';
import { PIPELINE_ORDER, type OpportunityStage } from './stages';

// Dashboard data.
// -----------------------------------------------------------------------
// The dashboard answers one question first — "what should I do next?" —
// and everything else is context for it. So this module computes the
// action queue as its primary output and the metrics as supporting
// material, not the other way round.
//
// That ordering is deliberate. A grid of ten numbers tells a freelancer
// how they have been doing; it does not tell them what to open. A queue
// does, and the numbers are what they consult when they want to know
// whether the queue is working.
// -----------------------------------------------------------------------

export const DASHBOARD_SECTIONS = [
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
] as const;

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

/** The counts a repository supplies. Pure in, pure out. */
export interface DashboardSnapshot {
  leadsFound: number;
  leadsResearched: number;
  /** Leads with a score at or above the contact threshold. */
  leadsWorthContacting: number;
  outreachSent: number;
  /** Outreach drafts waiting for a human to approve them. */
  outreachAwaitingApproval: number;
  replies: number;
  unansweredReplies: number;
  qualifiedLeads: number;
  proposalsSent: number;
  proposalsAwaitingApproval: number;
  wins: number;
  losses: number;
  clients: number;
  revenuePaise: number;
  followUpsDue: number;
  /** Open opportunities by stage, for the pipeline strip. */
  byStage: Readonly<Record<OpportunityStage, number>>;
  opportunities: readonly OpportunitySnapshot[];
}

export interface Metric {
  key: string;
  label: string;
  value: number;
  /** 'count' | 'percent' | 'paise' — tells the UI how to render it. */
  format: 'count' | 'percent' | 'paise';
  /** What this number means, in one line. Never a bare number on a tile. */
  note: string;
}

/**
 * The ten headline metrics.
 *
 * Conversion rate is deliberately wins ÷ leads *researched*, not wins ÷
 * leads found. Leads found is a number you control by scraping harder; a
 * rate measured against it rewards volume and hides whether the work is
 * any good.
 */
export function metricsFor(snapshot: DashboardSnapshot): readonly Metric[] {
  const denominator = snapshot.leadsResearched;
  const conversionRate = denominator === 0 ? 0 : snapshot.wins / denominator;
  const averageDealPaise = snapshot.wins === 0 ? 0 : Math.round(snapshot.revenuePaise / snapshot.wins);

  return [
    {
      key: 'leadsFound',
      label: 'Leads found',
      value: snapshot.leadsFound,
      format: 'count',
      note: 'Sourced, not yet worked.',
    },
    {
      key: 'leadsResearched',
      label: 'Researched',
      value: snapshot.leadsResearched,
      format: 'count',
      note: 'Have a reason to be contacted.',
    },
    {
      key: 'outreachSent',
      label: 'Outreach sent',
      value: snapshot.outreachSent,
      format: 'count',
      note: 'First messages that have gone out.',
    },
    {
      key: 'replies',
      label: 'Replies',
      value: snapshot.replies,
      format: 'count',
      note:
        snapshot.outreachSent === 0
          ? 'Nothing sent yet.'
          : `${Math.round((snapshot.replies / snapshot.outreachSent) * 100)}% of outreach.`,
    },
    {
      key: 'qualifiedLeads',
      label: 'Qualified',
      value: snapshot.qualifiedLeads,
      format: 'count',
      note: 'Confirmed need and budget.',
    },
    {
      key: 'proposals',
      label: 'Proposals',
      value: snapshot.proposalsSent,
      format: 'count',
      note: 'Sent and awaiting an answer.',
    },
    {
      key: 'wins',
      label: 'Wins',
      value: snapshot.wins,
      format: 'count',
      note: `${snapshot.losses} lost.`,
    },
    {
      key: 'conversionRate',
      label: 'Conversion',
      value: conversionRate,
      format: 'percent',
      note: 'Wins per researched lead — not per lead found.',
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: snapshot.revenuePaise,
      format: 'paise',
      note: 'Won business, all time.',
    },
    {
      key: 'averageDealValue',
      label: 'Average deal',
      value: averageDealPaise,
      format: 'paise',
      note: snapshot.wins === 0 ? 'No wins yet.' : `Across ${snapshot.wins} win${snapshot.wins === 1 ? '' : 's'}.`,
    },
  ];
}

export interface SectionSummary {
  section: DashboardSection;
  label: string;
  /** The number shown on the nav item. */
  count: number;
  /** Items needing the operator specifically. Drives the attention badge. */
  needsAttention: number;
  /** Why it needs attention, or what the count means. */
  note: string;
}

/**
 * Per-section summaries.
 *
 * `needsAttention` is the important field: it is what turns navigation
 * into a worklist. A section with a large count and nothing waiting is
 * calm; a section with three items waiting on a decision is not, however
 * small it is.
 */
export function sectionsFor(snapshot: DashboardSnapshot): readonly SectionSummary[] {
  return [
    {
      section: 'leads',
      label: 'Leads',
      count: snapshot.leadsFound,
      needsAttention: snapshot.leadsFound - snapshot.leadsResearched,
      note: 'Unresearched leads have no reason to be contacted yet.',
    },
    {
      section: 'research',
      label: 'Research',
      count: snapshot.leadsResearched,
      needsAttention: 0,
      note: 'Findings that outreach is built from.',
    },
    {
      section: 'opportunities',
      label: 'Opportunities',
      count: openOpportunities(snapshot),
      needsAttention: snapshot.byStage.RESEARCHED,
      note: 'Researched opportunities with no message drafted.',
    },
    {
      section: 'outreach',
      label: 'Outreach',
      count: snapshot.outreachSent,
      needsAttention: snapshot.outreachAwaitingApproval,
      note: 'Drafts cannot send themselves — they wait for you.',
    },
    {
      section: 'followUps',
      label: 'Follow-ups',
      count: snapshot.followUpsDue,
      needsAttention: snapshot.followUpsDue,
      note: 'Due today and waiting on your authorisation.',
    },
    {
      section: 'conversations',
      label: 'Conversations',
      count: snapshot.replies,
      needsAttention: snapshot.unansweredReplies,
      note: 'Someone answered you and is waiting.',
    },
    {
      section: 'proposals',
      label: 'Proposals',
      count: snapshot.proposalsSent,
      needsAttention: snapshot.proposalsAwaitingApproval,
      note: 'Drafted proposals awaiting your approval.',
    },
    {
      section: 'clients',
      label: 'Clients',
      count: snapshot.clients,
      needsAttention: 0,
      note: 'Won work, and the outreach that produced each one.',
    },
    {
      section: 'revenue',
      label: 'Revenue',
      count: snapshot.wins,
      needsAttention: 0,
      note: 'Closed business and what produced it.',
    },
    {
      section: 'analytics',
      label: 'Analytics',
      count: 0,
      needsAttention: 0,
      note: 'Where opportunities die, and which angles convert.',
    },
  ];
}

export function openOpportunities(snapshot: DashboardSnapshot): number {
  return PIPELINE_ORDER.reduce((sum, stage) => sum + (snapshot.byStage[stage] ?? 0), 0);
}

export interface Dashboard {
  /** The answer to the only question that matters. Never empty-by-omission. */
  nextActions: readonly NextAction[];
  /** One line above the queue: what today looks like. */
  headline: string;
  metrics: readonly Metric[];
  sections: readonly SectionSummary[];
  /** Sections with something waiting, most urgent first. */
  attention: readonly SectionSummary[];
}

export function buildDashboard(snapshot: DashboardSnapshot, now: Date = new Date()): Dashboard {
  const nextActions = buildQueue(snapshot.opportunities, now);
  const sections = sectionsFor(snapshot);

  return {
    nextActions,
    headline: headlineFor(nextActions, snapshot),
    metrics: metricsFor(snapshot),
    sections,
    attention: sections
      .filter((section) => section.needsAttention > 0)
      .sort((a, b) => b.needsAttention - a.needsAttention),
  };
}

/**
 * The line above the queue.
 *
 * An empty queue gets a real answer rather than a blank panel — "nothing
 * to do" and "you have no leads" are different situations and a dashboard
 * that renders both as emptiness is useless in exactly the moment someone
 * needs direction.
 */
export function headlineFor(
  actions: readonly NextAction[],
  snapshot: DashboardSnapshot,
): string {
  if (actions.length > 0) {
    const replies = actions.filter((action) => action.kind === 'REVIEW_REPLY').length;
    const lead = replies > 0
      ? `${replies} ${replies === 1 ? 'person is' : 'people are'} waiting on a reply`
      : `${actions.length} thing${actions.length === 1 ? '' : 's'} to do`;
    return `${lead}. Start at the top.`;
  }
  if (snapshot.leadsFound === 0) {
    return 'No leads yet. Start by finding companies worth approaching.';
  }
  if (snapshot.leadsResearched === 0) {
    return `${snapshot.leadsFound} leads found and none researched. Research gives you a reason to contact them.`;
  }
  if (snapshot.followUpsDue === 0 && openOpportunities(snapshot) > 0) {
    return 'Nothing is due today. Everything in the pipeline is waiting on someone else.';
  }
  return 'Nothing to do right now. Add leads to keep the pipeline moving.';
}
