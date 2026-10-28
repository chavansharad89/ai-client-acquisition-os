// Universal deterministic ranking.
// -----------------------------------------------------------------------
// Phase 3 of requirement/CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md
// (§0 item 1, RESOLVED 2026-10-13), implementing
// CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md. Supersedes
// prospectScore.ts's seven-factor, 0-100 score as a RANKING source —
// scoreProspect()/rankProspects() are NOT deleted (still a usable
// standalone model), they are simply no longer what orders candidates.
//
// Rule: ranking is not eligibility. This module only orders candidates;
// it has no concept of removing one. A candidate that is UNKNOWN on
// every dimension still gets a position, last among its peers, never a
// rejection.
// -----------------------------------------------------------------------

/** Never a number. A tier records how much a dimension's evidence supports, not a magnitude. */
export const RANKING_TIERS = ['STRONG', 'MODERATE', 'WEAK', 'UNKNOWN'] as const;
export type RankingTier = (typeof RANKING_TIERS)[number];

/** Higher index = weaker. Used only to compare two tiers, never summed or weighted. */
const TIER_ORDER: readonly RankingTier[] = RANKING_TIERS;

export const RANKING_DIMENSIONS = [
  'needOpportunity',
  'serviceFit',
  'evidenceQuality',
  'evidenceFreshness',
  'contactability',
  'currentActivity',
  'commercialReadiness',
] as const;
export type RankingDimension = (typeof RANKING_DIMENSIONS)[number];

/**
 * The three precedence groups the PO decision orders lexicographically,
 * Primary before Important before Supporting. Order within a group
 * matches the decision's own listing.
 */
export const PRIMARY_DIMENSIONS = ['needOpportunity', 'serviceFit'] as const;
export const IMPORTANT_DIMENSIONS = ['evidenceQuality', 'evidenceFreshness'] as const;
export const SUPPORTING_DIMENSIONS = [
  'contactability',
  'currentActivity',
  'commercialReadiness',
] as const;

/** Compare order for the lexicographic sort: Primary, then Important, then Supporting. */
const COMPARE_ORDER: readonly RankingDimension[] = [
  ...PRIMARY_DIMENSIONS,
  ...IMPORTANT_DIMENSIONS,
  ...SUPPORTING_DIMENSIONS,
];

/** One candidate's tier on every dimension. Never a derived/collapsed single value. */
export type UniversalRankingProfile = Readonly<Record<RankingDimension, RankingTier>>;

/** A profile with every dimension UNKNOWN — the honest starting point when no evidence exists for any of them. */
export function unknownRankingProfile(): UniversalRankingProfile {
  return {
    needOpportunity: 'UNKNOWN',
    serviceFit: 'UNKNOWN',
    evidenceQuality: 'UNKNOWN',
    evidenceFreshness: 'UNKNOWN',
    contactability: 'UNKNOWN',
    currentActivity: 'UNKNOWN',
    commercialReadiness: 'UNKNOWN',
  };
}

/**
 * -1 when `a` outranks `b`, 1 when `b` outranks `a`, 0 when this
 * dimension alone cannot decide between them (caller moves to the next
 * dimension in COMPARE_ORDER).
 */
function compareTier(a: RankingTier, b: RankingTier): number {
  return TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b);
}

/**
 * Lexicographic comparator: Primary dimensions decide first; only when
 * every Primary dimension ties do Important dimensions get consulted;
 * only when those also tie do Supporting dimensions get consulted. No
 * weighting, no numeric aggregation at any step — ties simply fall
 * through to the next dimension, and a caller-supplied id tie-break
 * (see {@link rankByUniversalProfile}) when every dimension ties.
 */
export function compareRankingProfiles(
  a: UniversalRankingProfile,
  b: UniversalRankingProfile,
): number {
  for (const dimension of COMPARE_ORDER) {
    const result = compareTier(a[dimension], b[dimension]);
    if (result !== 0) return result;
  }
  return 0;
}

/**
 * Orders candidates by {@link compareRankingProfiles}, breaking a total
 * tie on `id` ascending so the order is stable and reproducible —
 * mirrors prospectScore.ts's rankProspects() tie-break convention.
 * Never removes a candidate: every input candidate appears in the
 * output, exactly once, regardless of how many dimensions are UNKNOWN.
 */
export function rankByUniversalProfile<T extends { id: string; ranking: UniversalRankingProfile }>(
  candidates: readonly T[],
): readonly T[] {
  return [...candidates].sort(
    (a, b) => compareRankingProfiles(a.ranking, b.ranking) || a.id.localeCompare(b.id),
  );
}
