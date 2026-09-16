import { buildDashboard, type Dashboard, type DashboardSnapshot } from '@acos/core-acquisition';

// Dashboard data loading.
// -----------------------------------------------------------------------
// WIRING NOTE: the acquisition repositories do not exist yet — the engine
// is pure domain logic and nothing populates the acq_* tables. So this
// returns an empty snapshot, which renders the real "no leads yet" state
// rather than fabricated demo numbers.
//
// That is deliberate. A dashboard seeded with plausible fake data is the
// hardest kind of bug to notice: it looks like it works. An empty one
// tells the truth and exercises the empty-state copy, which is the part
// most likely to be wrong when the first real user arrives.
//
// When repositories land, this is the only function that changes.
// -----------------------------------------------------------------------

export const EMPTY_SNAPSHOT: DashboardSnapshot = {
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
    NEW: 0,
    RESEARCHED: 0,
    CONTACTED: 0,
    REPLIED: 0,
    QUALIFIED: 0,
    PROPOSAL_SENT: 0,
    WON: 0,
    LOST: 0,
    PAUSED: 0,
  },
  opportunities: [],
};

export async function loadDashboard(now: Date = new Date()): Promise<Dashboard> {
  return buildDashboard(EMPTY_SNAPSHOT, now);
}
