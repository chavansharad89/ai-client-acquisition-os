// WHO SHOULD I CONTACT — lead scoring.
// -----------------------------------------------------------------------
// A score is a ranking device, not a truth claim. Its job is to put the
// twenty leads worth an hour today at the top of a list of five thousand.
//
// Two properties matter more than the exact numbers:
//   1. EXPLAINABLE. Every score carries the reasons that produced it, so
//      the operator can disagree with it. An unexplained 73 is noise.
//   2. DECAYING. A signal from fourteen months ago ("they were hiring")
//      is not evidence today. Without decay, stale leads outrank fresh
//      ones forever and the list ossifies.
// -----------------------------------------------------------------------

export type ResearchSourceKind =
  'WEBSITE' | 'JOB_POST' | 'LINKEDIN' | 'NEWS' | 'FUNDING' | 'TECH_STACK' | 'REVIEW' | 'MANUAL';

export interface ResearchSignal {
  kind: ResearchSourceKind;
  signal: string;
  /** 0-100: how much the source is believed. */
  confidence: number;
  observedAt: Date;
  supersededAt?: Date | null;
}

/**
 * Base weight per source kind.
 *
 * A job post is the strongest ordinary signal because it is a company
 * stating a need in public and attaching a budget to it. A homepage
 * inference is the weakest because it is our guess about someone else's
 * priorities.
 */
export const SOURCE_WEIGHT: Record<ResearchSourceKind, number> = {
  JOB_POST: 30,
  FUNDING: 25,
  NEWS: 15,
  TECH_STACK: 15,
  LINKEDIN: 12,
  REVIEW: 10,
  WEBSITE: 8,
  MANUAL: 20, // the operator saw something themselves
};

/** A signal older than this contributes nothing. */
export const SIGNAL_MAX_AGE_DAYS = 180;
/** Full weight below this age, then linear decay to zero. */
export const SIGNAL_FRESH_DAYS = 30;

export interface ScoreComponent {
  signal: string;
  kind: ResearchSourceKind;
  points: number;
  ageDays: number;
}

export interface LeadScore {
  /** 0-100, clamped. */
  score: number;
  components: readonly ScoreComponent[];
  /** One line the operator can read. */
  reason: string;
}

export function decayFactor(ageDays: number): number {
  if (ageDays <= SIGNAL_FRESH_DAYS) return 1;
  if (ageDays >= SIGNAL_MAX_AGE_DAYS) return 0;
  const span = SIGNAL_MAX_AGE_DAYS - SIGNAL_FRESH_DAYS;
  return 1 - (ageDays - SIGNAL_FRESH_DAYS) / span;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function scoreLead(signals: readonly ResearchSignal[], now: Date = new Date()): LeadScore {
  const components: ScoreComponent[] = [];

  for (const signal of signals) {
    // Superseded findings are history, not evidence.
    if (signal.supersededAt) continue;

    const ageDays = Math.max(0, (now.getTime() - signal.observedAt.getTime()) / DAY_MS);
    const confidence = Math.min(Math.max(signal.confidence, 0), 100) / 100;
    const points = Math.round(SOURCE_WEIGHT[signal.kind] * confidence * decayFactor(ageDays));
    if (points <= 0) continue;

    components.push({
      signal: signal.signal,
      kind: signal.kind,
      points,
      ageDays: Math.floor(ageDays),
    });
  }

  components.sort((a, b) => b.points - a.points);
  const score = Math.min(
    100,
    components.reduce((sum, component) => sum + component.points, 0),
  );

  return { score, components, reason: explain(score, components) };
}

function explain(score: number, components: readonly ScoreComponent[]): string {
  if (components.length === 0) return 'No current signals — nothing to act on yet.';
  const top = components.slice(0, 2).map((c) => c.signal);
  const rest = components.length - top.length;
  const tail = rest > 0 ? `, plus ${rest} more signal${rest === 1 ? '' : 's'}` : '';
  return `${score}/100 — ${top.join('; ')}${tail}.`;
}

/** The threshold above which a lead is worth an operator's time. */
export const CONTACT_THRESHOLD = 25;

export function isWorthContacting(score: LeadScore): boolean {
  return score.score >= CONTACT_THRESHOLD;
}
