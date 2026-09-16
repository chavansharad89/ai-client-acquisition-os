import {
  SOURCE_WEIGHT,
  type ResearchSignal as OfferSignal,
  type ResearchSourceKind,
  type ServiceRule,
} from '@acos/core-acquisition';
import type { StoredResearchSignal } from '@acos/core-research';
import type { ServiceProfileFields } from '@acos/core-service-profile';

// Pure adapters onto @acos/core-acquisition's existing, unmodified
// offer.ts `suggestOffers()` — PRD V2.1 "no replacement scoring
// framework is introduced" applies equally to the offer engine: this
// package adapts persisted shapes onto its contract, it does not
// reimplement need/offer detection itself. Mirrors
// @acos/core-research's scoringAdapter.ts.
// -----------------------------------------------------------------------

const VALID_TRIGGER_KINDS = new Set<string>(Object.keys(SOURCE_WEIGHT));

function isResearchSourceKind(value: string): value is ResearchSourceKind {
  return VALID_TRIGGER_KINDS.has(value);
}

/**
 * Adapts one caller's ServiceProfile snapshot (as retained, immutably,
 * on their Search — DEC-007) onto `suggestOffers()`'s `ServiceRule`
 * contract, replacing offer.ts's generic `DEFAULT_SERVICE_RULES` with
 * the actual service the caller sells.
 *
 * `typicalValuePaise` derives from `minProjectValuePaise` at this
 * boundary — ServiceProfileFields deliberately does not carry a
 * separate typical-value field (see @acos/core-service-profile's
 * types.ts).
 *
 * `triggers` is filtered to the fixed `ResearchSourceKind` vocabulary:
 * `service_profiles.triggers` is stored as unconstrained text (OQ-4 —
 * how the field is derived is not decided), so a value outside the
 * eight kinds `suggestOffers()` understands is dropped here rather than
 * passed through.
 */
export function toServiceRule(fields: ServiceProfileFields): ServiceRule {
  return {
    service: fields.service,
    triggers: fields.triggers.filter(isResearchSourceKind),
    keywords: fields.keywords,
    typicalValuePaise: fields.minProjectValuePaise,
    rationale: fields.rationale,
  };
}

/**
 * Adapts persisted ResearchSignal rows (migration 0016) onto
 * `suggestOffers()`'s `ResearchSignal` input. UNKNOWN rows (signal IS
 * NULL) carry no claim text to match keywords against and are excluded
 * — the same exclusion @acos/core-research's scoringAdapter.ts makes for
 * seven-factor scoring, for the same reason.
 *
 * Confidence is passed through RAW: the inference discount (PRD V2.1
 * "INFERENCE DISCOUNT — CANONICAL FLOW") is reserved for the seven-factor
 * score, not need/offer detection — `suggestOffers()`'s ResearchSignal
 * contract carries no classification field to apply it by.
 */
export function toOfferSignals(stored: readonly StoredResearchSignal[]): readonly OfferSignal[] {
  const signals: OfferSignal[] = [];

  for (const row of stored) {
    if (row.classification === 'UNKNOWN' || row.signal === null) continue;

    signals.push({
      kind: row.kind,
      signal: row.signal,
      confidence: row.confidence,
      observedAt: row.observedAt,
      supersededAt: row.supersededAt,
    });
  }

  return signals;
}
