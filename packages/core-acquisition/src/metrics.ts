import { PIPELINE_ORDER, type OpportunityStage } from './stages';

// TRACK and IMPROVE.
// -----------------------------------------------------------------------
// These are the two process steps that are NOT stages. They are reads
// across closed opportunities: TRACK asks "what is happening", IMPROVE
// asks "what should I do differently". Neither is a place an opportunity
// sits, which is why the stage enum stops at WON/LOST.
// -----------------------------------------------------------------------

export interface ClosedOpportunity {
  stage: Extract<OpportunityStage, 'WON' | 'LOST'>;
  /** Furthest stage reached before closing. */
  furthestStage: OpportunityStage;
  angle: string;
  serviceOffer: string;
  valuePaise: number;
  followUpsSent: number;
  openedAt: Date;
  closedAt: Date;
}

export interface StageConversion {
  stage: OpportunityStage;
  reached: number;
  advanced: number;
  /** 0-1. Of those that reached this stage, how many got further. */
  rate: number;
}

/** TRACK: where opportunities die. */
export function stageConversions(closed: readonly ClosedOpportunity[]): readonly StageConversion[] {
  return PIPELINE_ORDER.map((stage, index) => {
    const position = index;
    const reached = closed.filter(
      (o) => PIPELINE_ORDER.indexOf(o.furthestStage) >= position || o.stage === 'WON',
    ).length;
    const advanced = closed.filter(
      (o) => PIPELINE_ORDER.indexOf(o.furthestStage) > position || o.stage === 'WON',
    ).length;
    return { stage, reached, advanced, rate: reached === 0 ? 0 : advanced / reached };
  });
}

export interface AnglePerformance {
  angle: string;
  sent: number;
  won: number;
  winRate: number;
  revenuePaise: number;
}

/**
 * IMPROVE: which opening angle actually converts.
 *
 * Deliberately reports raw counts alongside the rate. A 100% win rate from
 * one opportunity is not a finding, and a bare percentage invites treating
 * it as one.
 */
export function anglePerformance(
  closed: readonly ClosedOpportunity[],
): readonly AnglePerformance[] {
  const byAngle = new Map<string, AnglePerformance>();
  for (const opportunity of closed) {
    const entry = byAngle.get(opportunity.angle) ?? {
      angle: opportunity.angle,
      sent: 0,
      won: 0,
      winRate: 0,
      revenuePaise: 0,
    };
    entry.sent += 1;
    if (opportunity.stage === 'WON') {
      entry.won += 1;
      entry.revenuePaise += opportunity.valuePaise;
    }
    byAngle.set(opportunity.angle, entry);
  }
  return [...byAngle.values()]
    .map((entry) => ({ ...entry, winRate: entry.sent === 0 ? 0 : entry.won / entry.sent }))
    .sort((a, b) => b.won - a.won || b.winRate - a.winRate);
}

export interface FunnelSummary {
  opened: number;
  won: number;
  lost: number;
  winRate: number;
  revenuePaise: number;
  medianDaysToClose: number;
}

export function summarise(closed: readonly ClosedOpportunity[]): FunnelSummary {
  const won = closed.filter((o) => o.stage === 'WON');
  const days = closed
    .map((o) => (o.closedAt.getTime() - o.openedAt.getTime()) / 86_400_000)
    .sort((a, b) => a - b);
  const median = days.length === 0 ? 0 : days[Math.floor(days.length / 2)]!;

  return {
    opened: closed.length,
    won: won.length,
    lost: closed.length - won.length,
    winRate: closed.length === 0 ? 0 : won.length / closed.length,
    revenuePaise: won.reduce((sum, o) => sum + o.valuePaise, 0),
    medianDaysToClose: Math.round(median),
  };
}
