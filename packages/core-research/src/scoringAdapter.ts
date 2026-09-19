import { INFERENCE_DISCOUNT, type ResearchSignal as ScoringSignal } from '@acos/core-acquisition';

import type { StoredResearchSignal } from './types';

// Adapts persisted ResearchSignal rows (migration 0016) onto
// @acos/core-acquisition's scoring ResearchSignal input (prospectScore.ts
// / scoring.ts) — PRD V2.1 "SEVEN-FACTOR SCORING — AUTHORITATIVE MODEL":
// no replacement scoring framework, the existing algorithm is reused
// unmodified.
//
// Persisted confidence is RAW and already on the 0-100 scale the scorer
// itself expects (see ./types.ts's StoredResearchSignal and
// @acos/core-acquisition's ResearchSignal — both documented "0-100"; the
// scorer divides by 100 internally where it needs a fraction). No
// rescale happens here — only the ONE inference discount the PRD's
// "INFERENCE DISCOUNT — CANONICAL FLOW" reserves for scoring time,
// applied by `classification` exactly the way `basis` drives
// prospectScore.ts's own discount.
//
// UNKNOWN rows (signal IS NULL, confidence 0) carry no positive claim
// the scorer's ResearchSignal shape can represent — that shape has no
// UNKNOWN case of its own, only "a signal exists" or "it doesn't". They
// are therefore excluded from `signals`, but counted rather than
// silently dropped, so a caller can see how much of a Prospect's
// research came back unestablished.
// -----------------------------------------------------------------------

export interface ScoringSignalAdaptation {
  signals: readonly ScoringSignal[];
  /** Persisted rows classified UNKNOWN — excluded from `signals`, counted rather than discarded. */
  unknownCount: number;
}

export function toScoringSignals(stored: readonly StoredResearchSignal[]): ScoringSignalAdaptation {
  const signals: ScoringSignal[] = [];
  let unknownCount = 0;

  for (const row of stored) {
    if (row.classification === 'UNKNOWN' || row.signal === null) {
      unknownCount += 1;
      continue;
    }

    const confidence =
      row.classification === 'INFERRED'
        ? Math.round(row.confidence * INFERENCE_DISCOUNT)
        : row.confidence;

    signals.push({
      kind: row.kind,
      signal: row.signal,
      confidence,
      observedAt: row.observedAt,
      supersededAt: row.supersededAt,
    });
  }

  return { signals, unknownCount };
}
