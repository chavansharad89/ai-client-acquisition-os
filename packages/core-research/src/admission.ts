import {
  RANKING_TIERS,
  rankByUniversalProfile,
  type RankingTier,
  type UniversalRankingProfile,
} from '@acos/core-acquisition';

import { OBSERVED_FACT_CONFIDENCE } from './deterministicSignals';
import type { DeterministicSignal, UniversalDimension } from './deterministicSignals';

// Phase 5 AI-escalation admission gate
// (CLIENT_FINDER_PHASE5_IMPLEMENTATION_READINESS_REPORT.md Sec.10;
// CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md).
// -----------------------------------------------------------------------
// Pure, no I/O: decides WHICH candidates are escalation-eligible, never
// calls Research/the cache/the budget itself — those are the worker
// orchestration's job, strictly after this module returns (see
// apps/worker/src/searchWorker/worker.ts). Ranking is still never
// eligibility (@acos/core-acquisition's own rule) — this module only
// adds an escalation decision on top of an unmodified rank.
// -----------------------------------------------------------------------

/** Top-N governs AI-escalation admission breadth only — never how many opportunities are shown to the freelancer. */
export const DEFAULT_ADMISSION_TOP_N = 10;

/**
 * The two UniversalDimension values that map onto a Primary
 * RankingDimension (needOpportunity/serviceFit — see
 * @acos/core-acquisition's PRIMARY_DIMENSIONS) for the strong-signal
 * bypass's "≥1 Primary-dimension signal" test (PO-2 §2 of the readiness
 * report). ENTITY_REALITY, CURRENT_ACTIVITY and
 * COMMERCIAL_CONTACT_READINESS are deliberately excluded — none maps to
 * a Primary ranking dimension.
 */
const PRIMARY_UNIVERSAL_DIMENSIONS: readonly UniversalDimension[] = [
  'NEED_OPPORTUNITY_GAP',
  'SERVICE_FIT_CAPABILITY_FIT',
];

function isAtLeastModerate(tier: RankingTier): boolean {
  return RANKING_TIERS.indexOf(tier) <= RANKING_TIERS.indexOf('MODERATE');
}

/** Normal admission threshold: needOpportunity>=MODERATE OR serviceFit>=MODERATE (Primary-dimension OR-gate). */
export function meetsAdmissionThreshold(ranking: UniversalRankingProfile): boolean {
  return isAtLeastModerate(ranking.needOpportunity) || isAtLeastModerate(ranking.serviceFit);
}

/**
 * Strong-signal bypass (PO-2): ≥2 independent signals at top-reliability
 * (confidence pinned at OBSERVED_FACT_CONFIDENCE), with ≥1 mapping to a
 * Primary dimension. Skips the threshold test only — never Top-N, never
 * the budget (both enforced separately, at the call site).
 */
export function hasStrongSignalBypass(signals: readonly DeterministicSignal[]): boolean {
  const topReliability = signals.filter((entry) => entry.signal.confidence === OBSERVED_FACT_CONFIDENCE);
  if (topReliability.length < 2) return false;
  return topReliability.some((entry) => PRIMARY_UNIVERSAL_DIMENSIONS.includes(entry.dimension));
}

export interface AdmissionCandidate {
  readonly id: string;
  readonly ranking: UniversalRankingProfile;
  readonly deterministicSignals: readonly DeterministicSignal[];
}

export interface AdmissionDecision {
  readonly id: string;
  /** 1-based rank within this Search's full candidate set. */
  readonly rank: number;
  readonly topN: boolean;
  readonly bypass: boolean;
  readonly thresholdMet: boolean;
  /** topN && (bypass || thresholdMet). The ranking-only half of admission — still subject to the cache check and budget at the call site. */
  readonly admitted: boolean;
}

/**
 * Ranks every candidate once (rankByUniversalProfile — ranking is never
 * eligibility), then evaluates each one's admission. Never drops a
 * candidate from the returned list, mirroring rankByUniversalProfile's
 * own "every input appears in the output" contract.
 */
export function evaluateAdmission(
  candidates: readonly AdmissionCandidate[],
  topN: number = DEFAULT_ADMISSION_TOP_N,
): readonly AdmissionDecision[] {
  const ranked = rankByUniversalProfile(candidates);
  return ranked.map((candidate, index) => {
    const rank = index + 1;
    const inTopN = rank <= topN;
    const bypass = hasStrongSignalBypass(candidate.deterministicSignals);
    const thresholdMet = meetsAdmissionThreshold(candidate.ranking);
    return {
      id: candidate.id,
      rank,
      topN: inTopN,
      bypass,
      thresholdMet,
      admitted: inTopN && (bypass || thresholdMet),
    };
  });
}
