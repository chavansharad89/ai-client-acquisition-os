import { suggestOffers, type UniversalRankingProfile } from '@acos/core-acquisition';
import {
  DETERMINISTIC_ABSENT_SSL_FIELD,
  type DeterministicSignal,
  type StoredResearchSignal,
} from '@acos/core-research';
import type { ServiceProfileFields } from '@acos/core-service-profile';

import { toOfferSignals, toServiceRule, type SourceBusinessIdentity } from './adapters';
import { buildRankingProfile } from './service';
import type { DetectedOffer } from './types';

// Phase 5 — Pass-1 admission ranking preview.
// -----------------------------------------------------------------------
// The Opportunity itself stays write-once, created after Research runs
// (or after the decision to skip it) — unchanged from today. This module
// computes the SAME offer-suggestion and ranking-tier logic
// createOpportunityForOwner()/scoreOpportunityForOwner() apply after
// persistence, but purely in-memory, over only the Phase-1 deterministic
// evidence available before any AI call — no repository access, no
// Opportunity row written. Used only to rank/admit candidates
// (@acos/core-research's evaluateAdmission) before the worker decides
// which of them to escalate. Deliberately reuses buildRankingProfile()
// (exported from ./service) so the preview and the final persisted
// ranking can never diverge in their tier rules, only in which evidence
// is available at each point in time.
// -----------------------------------------------------------------------

export interface OpportunityRankingPreview {
  readonly offer: DetectedOffer | undefined;
  readonly ranking: UniversalRankingProfile;
}

/** Synthesizes a StoredResearchSignal-shaped view of one deterministic signal — no persistence, no real id. */
function toPreviewStoredSignal(entry: DeterministicSignal): StoredResearchSignal {
  return {
    id: 'preview',
    prospectId: 'preview',
    field: DETERMINISTIC_ABSENT_SSL_FIELD,
    kind: entry.signal.kind,
    classification: 'OBSERVED',
    signal: entry.signal.signal,
    confidence: entry.signal.confidence,
    basis: null,
    observedAt: entry.signal.observedAt,
    supersededAt: null,
    sources: [],
  };
}

/**
 * Pass-1 preview (Phase 5): offer-suggestion + ranking tier, computed
 * purely in-memory over the Phase-1 deterministic evidence only. Used
 * ONLY to rank/admit candidates; the real Opportunity is still created,
 * once, downstream — see apps/worker/src/searchWorker/worker.ts.
 */
export function previewOpportunityRanking(
  parameters: ServiceProfileFields,
  companyIdentity: SourceBusinessIdentity,
  deterministicSignals: readonly DeterministicSignal[],
  now: Date,
): OpportunityRankingPreview {
  const storedSignalsEquivalent = deterministicSignals.map(toPreviewStoredSignal);
  const offerSignals = toOfferSignals(storedSignalsEquivalent, companyIdentity);
  const rule = toServiceRule(parameters);

  const suggestions = suggestOffers(offerSignals, [rule]);
  const top = suggestions[0];
  const offer: DetectedOffer | undefined = top && {
    service: top.service,
    rationale: top.rationale,
    estimatedValuePaise: top.estimatedValuePaise,
    fit: top.fit,
    basedOn: top.basedOn,
  };

  const ranking = buildRankingProfile(offer, storedSignalsEquivalent, now);
  return { offer, ranking };
}
