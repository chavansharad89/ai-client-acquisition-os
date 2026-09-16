import { decayFactor, type ResearchSignal } from './scoring';

// Prospect scoring across seven factors.
// -----------------------------------------------------------------------
// Supersedes `scoreLead` for ranking. That function still exists and is
// reused here — it owns the signal-decay rule, and having two decay curves
// in one system is how two screens start disagreeing about the same lead.
//
// THE CENTRAL RULE: an inference is never presented as a fact. Every
// factor records whether it rests on something OBSERVED or something the
// model INFERRED; inferred contributions are halved; reasons are prefixed
// so a human reading them can never mistake one for the other; and a
// prospect whose case is inference-only cannot reach HIGH, however
// confident the model was. Confidence is not evidence.
// -----------------------------------------------------------------------

export type ClaimBasis = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';

/** A single piece of knowledge, carrying how it was arrived at. */
export interface Claim<T> {
  value: T | null;
  basis: ClaimBasis;
  /** Shown to the operator. For OBSERVED this should quote or cite. */
  note?: string;
}

export const SCORE_FACTORS = [
  'icpFit',
  'visibleProblem',
  'abilityToPay',
  'urgency',
  'serviceFit',
  'evidenceQuality',
  'contactability',
] as const;

export type ScoreFactor = (typeof SCORE_FACTORS)[number];

/** Weights sum to exactly 100 — asserted by a test, not by hope. */
export const FACTOR_WEIGHTS: Record<ScoreFactor, number> = {
  icpFit: 20,
  visibleProblem: 20,
  abilityToPay: 15,
  urgency: 15,
  serviceFit: 15,
  evidenceQuality: 10,
  contactability: 5,
};

export type PayBand = 'strong' | 'moderate' | 'weak';
export type UrgencyBand = 'immediate' | 'this-quarter' | 'someday';

export interface ProspectInput {
  /** Feeds visibleProblem and evidenceQuality. Superseded signals ignored. */
  signals: readonly ResearchSignal[];
  icp: {
    industryMatch: Claim<boolean>;
    sizeMatch: Claim<boolean>;
    geoMatch: Claim<boolean>;
  };
  abilityToPay: Claim<PayBand>;
  urgency: Claim<UrgencyBand>;
  /** 0-100 fit from suggestOffers, with how it was derived. */
  serviceFit: Claim<number>;
  contact: {
    hasEmail: boolean;
    hasLinkedIn: boolean;
    hasPhone: boolean;
    /** Hard stop. Overrides everything. */
    unsubscribed: boolean;
  };
}

export interface FactorScore {
  factor: ScoreFactor;
  weight: number;
  /** 0-1 before weighting and before the inference discount. */
  raw: number;
  /** Contribution to the final score, after weighting and discount. */
  points: number;
  basis: ClaimBasis;
  /** Prefixed with Observed / Inferred / Not established. Never bare. */
  reason: string;
}

export type ScoreBand = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ProspectScore {
  score: number;
  band: ScoreBand;
  factors: readonly FactorScore[];
  /** Ordered, human-readable. Every score carries these. */
  reasons: readonly string[];
  /** Share of the score that rests on observed facts. */
  observedShare: number;
  /** Set when a rule overrode the arithmetic. */
  cap?: string;
}

/** Band thresholds. HIGH is deliberately hard to reach. */
export const BAND_THRESHOLDS = { HIGH: 65, MEDIUM: 35 } as const;

/** An inferred factor contributes half — the same discount core-research applies. */
export const INFERENCE_DISCOUNT = 0.5;

const PREFIX: Record<ClaimBasis, string> = {
  OBSERVED: 'Observed',
  INFERRED: 'Inferred',
  UNKNOWN: 'Not established',
};

function factorScore(
  factor: ScoreFactor,
  raw: number,
  basis: ClaimBasis,
  detail: string,
): FactorScore {
  const clamped = Math.min(Math.max(raw, 0), 1);
  const weight = FACTOR_WEIGHTS[factor];
  const discount = basis === 'INFERRED' ? INFERENCE_DISCOUNT : basis === 'UNKNOWN' ? 0 : 1;
  return {
    factor,
    weight,
    raw: clamped,
    points: Math.round(clamped * weight * discount),
    basis,
    reason: `${PREFIX[basis]}: ${detail}`,
  };
}

/** The weakest basis present — a claim is only as solid as its softest input. */
function combineBasis(bases: readonly ClaimBasis[]): ClaimBasis {
  if (bases.some((b) => b === 'UNKNOWN'))
    return bases.every((b) => b === 'UNKNOWN') ? 'UNKNOWN' : 'INFERRED';
  return bases.some((b) => b === 'INFERRED') ? 'INFERRED' : 'OBSERVED';
}

const DAY_MS = 24 * 60 * 60 * 1000;

function liveSignals(signals: readonly ResearchSignal[]): readonly ResearchSignal[] {
  return signals.filter((signal) => !signal.supersededAt);
}

export function scoreProspect(input: ProspectInput, now: Date = new Date()): ProspectScore {
  const live = liveSignals(input.signals);

  // --- 1. ICP fit -------------------------------------------------------
  const icpChecks = [input.icp.industryMatch, input.icp.sizeMatch, input.icp.geoMatch];
  const known = icpChecks.filter((check) => check.basis !== 'UNKNOWN');
  const matched = known.filter((check) => check.value === true);
  const icp = factorScore(
    'icpFit',
    known.length === 0 ? 0 : matched.length / icpChecks.length,
    known.length === 0 ? 'UNKNOWN' : combineBasis(known.map((c) => c.basis)),
    known.length === 0
      ? 'no ICP attributes could be determined'
      : `${matched.length} of ${icpChecks.length} ICP attributes match` +
          (matched.length > 0
            ? ` (${
                matched
                  .map((c) => c.note)
                  .filter(Boolean)
                  .join('; ') || 'industry/size/geography'
              })`
            : ''),
  );

  // --- 2. Visible problem ----------------------------------------------
  // A problem the company has shown, not one we imagine for them.
  const problemSignals = live.filter((signal) => signal.confidence >= 50);
  const strongest = problemSignals.reduce<ResearchSignal | null>(
    (best, signal) => (!best || signal.confidence > best.confidence ? signal : best),
    null,
  );
  const problemRaw =
    strongest === null
      ? 0
      : (strongest.confidence / 100) *
        decayFactor((now.getTime() - strongest.observedAt.getTime()) / DAY_MS);
  const visibleProblem = factorScore(
    'visibleProblem',
    problemRaw,
    strongest === null ? 'UNKNOWN' : 'OBSERVED',
    strongest === null
      ? 'no current problem signal'
      : `${strongest.signal} (${strongest.kind.toLowerCase().replace('_', ' ')})`,
  );

  // --- 3. Ability to pay ------------------------------------------------
  const payRaw =
    input.abilityToPay.value === 'strong'
      ? 1
      : input.abilityToPay.value === 'moderate'
        ? 0.6
        : input.abilityToPay.value === 'weak'
          ? 0.2
          : 0;
  const abilityToPay = factorScore(
    'abilityToPay',
    payRaw,
    input.abilityToPay.basis,
    input.abilityToPay.note ??
      (input.abilityToPay.value ? `budget looks ${input.abilityToPay.value}` : 'budget unknown'),
  );

  // --- 4. Urgency -------------------------------------------------------
  const urgencyRaw =
    input.urgency.value === 'immediate'
      ? 1
      : input.urgency.value === 'this-quarter'
        ? 0.6
        : input.urgency.value === 'someday'
          ? 0.2
          : 0;
  const urgency = factorScore(
    'urgency',
    urgencyRaw,
    input.urgency.basis,
    input.urgency.note ??
      (input.urgency.value ? `timing looks ${input.urgency.value}` : 'timing unknown'),
  );

  // --- 5. Service fit ---------------------------------------------------
  const serviceFit = factorScore(
    'serviceFit',
    (input.serviceFit.value ?? 0) / 100,
    input.serviceFit.basis,
    input.serviceFit.note ??
      (input.serviceFit.value === null
        ? 'no service could be matched'
        : `service fit ${input.serviceFit.value}/100`),
  );

  // --- 6. Evidence quality ---------------------------------------------
  // How well-sourced the case is, independent of how good it looks.
  const sourced = live.filter((signal) => signal.confidence >= 70).length;
  const evidenceQuality = factorScore(
    'evidenceQuality',
    live.length === 0 ? 0 : Math.min(1, sourced / 3),
    live.length === 0 ? 'UNKNOWN' : 'OBSERVED',
    live.length === 0
      ? 'no current signals'
      : `${sourced} well-sourced signal${sourced === 1 ? '' : 's'} of ${live.length}`,
  );

  // --- 7. Contactability ------------------------------------------------
  const channels = [input.contact.hasEmail, input.contact.hasLinkedIn, input.contact.hasPhone];
  const reachable = channels.filter(Boolean).length;
  const contactability = factorScore(
    'contactability',
    input.contact.unsubscribed ? 0 : reachable / channels.length,
    'OBSERVED',
    input.contact.unsubscribed
      ? 'this person has unsubscribed and must not be contacted'
      : `${reachable} of 3 contact channels available`,
  );

  const factors = [
    icp,
    visibleProblem,
    abilityToPay,
    urgency,
    serviceFit,
    evidenceQuality,
    contactability,
  ];

  // --- assembly ---------------------------------------------------------
  if (input.contact.unsubscribed) {
    // Not a low score — a hard stop. Ranking an unsubscribed person at all
    // invites someone to contact them.
    return {
      score: 0,
      band: 'LOW',
      factors,
      reasons: ['Observed: this person has unsubscribed and must not be contacted.'],
      observedShare: 1,
      cap: 'unsubscribed — excluded from outreach regardless of fit',
    };
  }

  const total = factors.reduce((sum, factor) => sum + factor.points, 0);
  const score = Math.min(100, Math.max(0, total));

  // Contactability is excluded from this ratio on purpose. Having an email
  // address is always an OBSERVED fact, but it is an administrative one —
  // it says nothing about whether the CASE for this prospect is evidenced.
  // Counting it would add a guaranteed 5 observed points to every lead and
  // push borderline inference-heavy prospects over the line, which is
  // exactly the situation the cap below exists to catch.
  const evidential = factors.filter((factor) => factor.factor !== 'contactability');
  const evidentialPoints = evidential.reduce((sum, factor) => sum + factor.points, 0);
  const observedPoints = evidential
    .filter((factor) => factor.basis === 'OBSERVED')
    .reduce((sum, factor) => sum + factor.points, 0);
  const observedShare = evidentialPoints === 0 ? 0 : observedPoints / evidentialPoints;

  let band = bandFor(score);
  let cap: string | undefined;

  // The rule that keeps inference from masquerading as fact: a prospect
  // whose case is mostly reasoning rather than evidence cannot be HIGH,
  // however confident that reasoning was.
  if (band === 'HIGH' && observedShare < 0.5) {
    band = 'MEDIUM';
    cap =
      `capped at MEDIUM — only ${Math.round(observedShare * 100)}% of this score rests on observed ` +
      `facts, the rest is inference. Verify before treating it as a priority.`;
  }

  return {
    score,
    band,
    factors,
    reasons: buildReasons(factors, cap),
    observedShare,
    ...(cap ? { cap } : {}),
  };
}

export function bandFor(score: number): ScoreBand {
  if (score >= BAND_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= BAND_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

/** Strongest contributors first, then what is missing. Always non-empty. */
function buildReasons(factors: readonly FactorScore[], cap?: string): readonly string[] {
  const contributing = [...factors]
    .filter((factor) => factor.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((factor) => `${factor.reason} (+${factor.points})`);

  const missing = factors
    .filter((factor) => factor.basis === 'UNKNOWN')
    .map((factor) => `${factor.reason} (no contribution)`);

  const reasons = [...contributing, ...missing];
  if (cap) reasons.push(`Capped: ${cap}`);
  return reasons.length > 0
    ? reasons
    : ['Not established: nothing is known about this prospect yet.'];
}

/** Ranking helper. Ties break on observed share, then id, so order is stable. */
export function rankProspects<T extends { id: string; score: ProspectScore }>(
  prospects: readonly T[],
): readonly T[] {
  return [...prospects].sort(
    (a, b) =>
      b.score.score - a.score.score ||
      b.score.observedShare - a.score.observedShare ||
      a.id.localeCompare(b.id),
  );
}
