import type { ResearchSignal } from '@acos/core-acquisition';

import type { SuppliedSourceDocuments } from './provider';

// Phase 1 of requirement/CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md
// — deterministic evidence foundation. Emits ResearchSignal-shaped rows
// without any model call, from exactly the data SuppliedSourceDocuments
// already carries (fetched homepage text/url, Readability-extracted —
// see ./sourceDocumentProvider.ts). Not wired into any caller yet; that
// is Phases 2/3/5's job, once elimination/ranking/escalation exist to
// consume these signals.
//
// Scoped to one signal (absent SSL/TLS, from the document URL's scheme)
// because it is the only example in the plan's Phase 1 section that is
// actually derivable from current data without touching a file outside
// this phase's boundary or inventing an unauthorized heuristic:
//   - Google Places rating/opening_hours/user_ratings_total remain
//     unrequested; only businessStatus was added, under Phase 8
//     (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D11/D16) — see
//     detectPlacesEntityReality() below, fed by ./googlePlacesClient.ts's
//     now-widened field mask.
//   - "No website" is already unreachable here — core-discovery's
//     normalize.ts discards no-website candidates before a Prospect
//     exists (Known Gap 12, explicitly not touched by this plan), and
//     the governance item that would authorize treating "no website" as
//     a positive signal (Q1) states it "does not authorize any code...
//     change."
//   - Content-update date, contact-form presence, and pricing-page
//     presence all need either raw HTML (extraction strips to plain
//     text) or a second fetched page (the provider is frozen to
//     homepage-only, one document per prospect) — neither exists today.
//
// Must NOT invent evidence a source document doesn't support: a
// candidate with no supplied documents yields no signals (stays
// UNKNOWN downstream), never a guessed one.

/**
 * The universal five-dimension framework
 * (CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md).
 * Evidence Confidence and Freshness are cross-cutting modifiers on top
 * of these, not a sixth dimension — not represented here.
 */
export const UNIVERSAL_DIMENSIONS = [
  'ENTITY_REALITY',
  'CURRENT_ACTIVITY',
  'NEED_OPPORTUNITY_GAP',
  'SERVICE_FIT_CAPABILITY_FIT',
  'COMMERCIAL_CONTACT_READINESS',
] as const;

export type UniversalDimension = (typeof UNIVERSAL_DIMENSIONS)[number];

export interface DeterministicSignal {
  signal: ResearchSignal;
  dimension: UniversalDimension;
  /**
   * The reserved `research_signals.field` marker this signal persists
   * under (see ./deterministicSignalPersistence.ts) — every producer
   * sets its own, generalized from the single hardcoded SSL marker this
   * replaced (Phase 8, CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001).
   */
  field: string;
  /**
   * Set only by a producer whose evidence positively establishes the
   * candidate is not a real, operating entity (D3-C1 of
   * CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001). Absent/false for
   * any other ENTITY_REALITY-dimension evidence — e.g. a temporary-
   * closure signal (D2.2/D15) — so entityRealityElimination.ts's
   * predicate cannot be satisfied by dimension alone; it also requires
   * this explicit flag.
   */
  establishesNonReality?: boolean;
}

/**
 * One top-level service's deterministic checks
 * (CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md
 * — subservices stay internal to the service, never a separate key here).
 * `service` matches the existing free-form `service: string` convention
 * (see @acos/core-acquisition's offer.ts, @acos/core-opportunity's
 * types.ts) rather than introducing a new enum.
 */
export interface ServiceSignalCatalogue {
  readonly service: string;
  evaluate(supplied: SuppliedSourceDocuments): readonly DeterministicSignal[];
}

/**
 * A deterministic fact read directly off a source document carries no
 * uncertainty of its own (unlike a model's inference) — 100 is the top
 * of the existing 0-100 "how much the source is believed" scale
 * (ResearchSignal.confidence), not a newly invented weight. Exported for
 * Phase 5's strong-signal-bypass test (./admission.ts, PO-2: "top-
 * reliability" = confidence pinned at this constant).
 */
export const OBSERVED_FACT_CONFIDENCE = 100;

/**
 * Phase 5 (PO-3): the reserved `research_signals.field` value the
 * absent-SSL deterministic signal is persisted under, so
 * @acos/core-opportunity's buildRankingProfile() can recognize it after
 * persistence to derive the `needOpportunity` ranking tier. Necessary
 * because `research_signals` has no `dimension` column — `field` is the
 * only persisted marker this signal keeps (see
 * ./deterministicSignalPersistence.ts).
 */
export const DETERMINISTIC_ABSENT_SSL_FIELD = 'deterministic.absentSsl';

/**
 * A substring `detectAbsentSsl()`'s own fixed signal text below always
 * contains, lowercased (case-insensitively present in "...(no SSL): ...")
 * — exported so a ServiceRule-based consumer (see @acos/core-opportunity's
 * service.ts) can match this deterministic, NEED_OPPORTUNITY_GAP-dimension
 * evidence through the existing suggestOffers() trigger+keyword mechanism
 * (which lowercases signal text before matching), the same mechanism
 * needOpportunityTier() already uses this field's presence for, for
 * ranking. Kept here, next to the text it describes, so the two can never
 * drift apart. Does not change detectAbsentSsl()'s own literal text.
 */
export const DETERMINISTIC_ABSENT_SSL_KEYWORD = 'no ssl';

function detectAbsentSsl(supplied: SuppliedSourceDocuments): DeterministicSignal | null {
  const insecure = supplied.documents.find((doc) => /^http:\/\//i.test(doc.url));
  if (!insecure) return null;

  return {
    signal: {
      kind: 'WEBSITE',
      signal: `Website served over HTTP without TLS (no SSL): ${insecure.url}`,
      confidence: OBSERVED_FACT_CONFIDENCE,
      observedAt: supplied.fetchedAt,
    },
    dimension: 'NEED_OPPORTUNITY_GAP',
    field: DETERMINISTIC_ABSENT_SSL_FIELD,
  };
}

/**
 * Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D16): the
 * reserved `research_signals.field` markers for the two Google Places
 * operational-status signals below — mirrors
 * DETERMINISTIC_ABSENT_SSL_FIELD's role for the SSL signal.
 */
export const DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD = 'deterministic.placesClosedPermanently';
export const DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD = 'deterministic.placesClosedTemporarily';

/**
 * Phase 8's Entity-Reality producer (CF-PHASE8-ENTITY-REALITY-ACTIVATION-
 * PO-DEC-001, D1-D3, D14, D15, D16) — the first ENTITY_REALITY-dimension
 * signal in the codebase, activating entityRealityElimination.ts's
 * previously-vacuous predicate. Family-agnostic: runs identically for
 * every one of the 17 service families (D1), not scoped to any one
 * ServiceSignalCatalogue.
 *
 * - `businessStatus === 'CLOSED_PERMANENTLY'` (D2.1/D3-C1): positively
 *   establishes non-reality — `establishesNonReality: true`.
 * - `businessStatus === 'CLOSED_TEMPORARILY'` (D2.2/D3-C2/D15-O1):
 *   informational ENTITY_REALITY-adjacent evidence only.
 *   `establishesNonReality` is deliberately omitted, not set to
 *   `false` — entityRealityElimination.ts's predicate requires it to be
 *   exactly `true`, so this can never satisfy it, structurally.
 * - Anything else — `'OPERATIONAL'`, `null`, or an unrecognized value
 *   (D2.3/D3-C3/D14): missing/uncertain evidence is never fabricated
 *   into a claim — no signal at all, mirroring detectAbsentSsl's own
 *   "nothing noteworthy found" convention.
 */
export function detectPlacesEntityReality(
  businessStatus: string | null | undefined,
  observedAt: Date,
): DeterministicSignal | null {
  if (businessStatus === 'CLOSED_PERMANENTLY') {
    return {
      signal: {
        kind: 'GOOGLE_PLACES_STATUS',
        signal: 'Google Places reports this business as permanently closed (CLOSED_PERMANENTLY).',
        confidence: OBSERVED_FACT_CONFIDENCE,
        observedAt,
      },
      dimension: 'ENTITY_REALITY',
      field: DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD,
      establishesNonReality: true,
    };
  }

  if (businessStatus === 'CLOSED_TEMPORARILY') {
    return {
      signal: {
        kind: 'GOOGLE_PLACES_STATUS',
        signal: 'Google Places reports this business as temporarily closed (CLOSED_TEMPORARILY).',
        confidence: OBSERVED_FACT_CONFIDENCE,
        observedAt,
      },
      dimension: 'ENTITY_REALITY',
      field: DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD,
    };
  }

  return null;
}

/**
 * Web Development only, per the plan's Phase 1 scope — not generalized
 * to the other 16 service families. Phase 8
 * (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001) authorized a
 * universal, family-agnostic Entity-Reality signal instead (see
 * detectPlacesEntityReality() above) — true per-family signal expansion
 * (D7) remains separately unauthorized.
 */
export function createWebDevelopmentSignalCatalogue(): ServiceSignalCatalogue {
  return {
    service: 'Web Development',
    evaluate(supplied: SuppliedSourceDocuments): readonly DeterministicSignal[] {
      const signals: DeterministicSignal[] = [];
      const absentSsl = detectAbsentSsl(supplied);
      if (absentSsl) signals.push(absentSsl);
      return signals;
    },
  };
}
