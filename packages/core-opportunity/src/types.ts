import type {
  OpportunityStage,
  OpportunityStaleness,
  UniversalRankingProfile,
} from '@acos/core-acquisition';

/**
 * Canonical vocabulary is @acos/core-acquisition's stages.ts
 * `OPPORTUNITY_STAGES` (nine values) — this is deliberately NOT a second
 * enum, only the subset PRD V2.1 reaches in MVP ("the MVP exercises NEW
 * and RESEARCHED"; stages beyond RESEARCHED are Phase 2+). Mirrors
 * @acos/core-discovery's `ProspectStatus`, fixed to 'DISCOVERED' alone
 * out of a larger future vocabulary.
 */
export type OpportunityState = Extract<OpportunityStage, 'NEW' | 'RESEARCHED'>;

/**
 * The persisted need/offer outcome of one @acos/core-acquisition
 * `suggestOffers()` call (R-11/R-12). `undefined` (no offer fields)
 * represents AC-14's NO SUITABLE OFFER — an explicit, representable
 * outcome, never a default to the user's own service.
 */
export interface DetectedOffer {
  service: string;
  rationale: string;
  estimatedValuePaise: number;
  /** 0-100. How well the signals matched. */
  fit: number;
  /** The signal claims this offer was based on — the evidence backing it. */
  basedOn: readonly string[];
}

/** Untrusted shape a caller supplies to create an Opportunity. Never carries id/userId. */
export interface CreateOpportunityInput {
  prospectId: string;
}

/**
 * Candidate-level AI enrichment provenance (Phase 6, migration 0047):
 * whether this Opportunity's current evidence came from a successful
 * Research/TCM run (or a fresh reusable cache hit of one), or only from
 * deterministic signals.
 */
export type AiEnrichment = 'AI_ENRICHED' | 'DETERMINISTIC_ONLY';

/**
 * Why `aiEnrichment` is 'DETERMINISTIC_ONLY'. Always `null` for
 * 'AI_ENRICHED' — see {@link StoredOpportunity.aiEnrichmentReason}.
 */
export type AiEnrichmentReason = 'NOT_ESCALATED' | 'ESCALATION_FAILED' | 'PROVIDER_EXHAUSTED';

/** A row as persisted. `userId` is always server-derived (DEC-003) — never accepted as input. */
export interface StoredOpportunity {
  id: string;
  userId: string;
  prospectId: string;
  state: OpportunityState;
  needDetected: boolean;
  /** The recommended offer, or `undefined` for NO SUITABLE OFFER (AC-14). */
  offer: DetectedOffer | undefined;
  /**
   * Whether this Opportunity's evidence is still current (R-19, Stage
   * S) — an independent classification from `state`, not a lifecycle
   * transition. Defaults to 'FRESH' at creation; only
   * classifyOpportunityStaleness() (Phase 12) changes it.
   */
  staleness: OpportunityStaleness;
  /** When `staleness` was last computed. `null` until first classified. */
  stalenessComputedAt: Date | null;
  /**
   * Candidate-level AI enrichment provenance (Phase 6). Defaults to
   * 'DETERMINISTIC_ONLY' at creation; recordAiEnrichmentForOwner() is
   * what sets the real outcome, same "explicit step" convention as
   * `staleness`.
   */
  aiEnrichment: AiEnrichment;
  /** Why `aiEnrichment` is 'DETERMINISTIC_ONLY'. `null` when 'AI_ENRICHED'. */
  aiEnrichmentReason: AiEnrichmentReason | null;
  /**
   * Phase 7B (MULR item 6, migration 0048): the selected top-level
   * service's catalogue sub-services (`@acos/core-opportunity`'s
   * serviceCatalog.ts) found relevant to this Opportunity by
   * `matchRelevantSubservices()` at creation time. Internal metadata
   * only (CF-SERVICE-CATALOG-PO-DEC-001) — never a separate result
   * category, never re-derived at render time. Empty when none matched.
   */
  relevantSubservices: readonly string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A persisted OpportunityScore row (migration 0018, qualitative shape
 * since migration 0044 / Phase 3 of the deterministic architecture plan
 * — CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md). Holds the
 * caller's own, already-computed {@link UniversalRankingProfile} — a
 * tier (STRONG/MODERATE/WEAK/UNKNOWN) per dimension, never a composite
 * number. Ownership is inherited through `opportunityId` ->
 * `opportunities.user_id` (DEC-008, the second named exception alongside
 * `research_signals`) — no `userId` field of its own. One current score
 * per Opportunity, not an append-only history — re-scoring replaces this
 * row.
 *
 * The legacy seven-factor numeric score (`total`/`band`/`observedShare`/
 * `cap`) is formally superseded as a ranking source
 * (CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md)
 * and deliberately absent from this type — migration 0044 made the
 * underlying columns nullable rather than dropping them, so historical
 * rows survive at the database layer, but the application never reads
 * them back into a value a caller could see.
 */
export interface StoredOpportunityScore {
  id: string;
  opportunityId: string;
  /**
   * `null` only for a row written before migration 0044 (scorer_version
   * 'prospectScore-v1') — its `factors` column still holds the legacy
   * seven-factor array, never reinterpreted as a UniversalRankingProfile
   * (see scorePgRepository.ts's mapRow()). A row from the current
   * scorer always carries a real profile here.
   */
  ranking: UniversalRankingProfile | null;
  /** Ordered, human-readable explanation of each dimension's tier. Every row carries at least one. */
  reasons: readonly string[];
  /** Identifies the ranking-formula build that produced this row (so an order can be reproduced or distinguished after the formula changes). */
  rankerVersion: string;
  scoredAt: Date;
  createdAt: Date;
}

/**
 * One entry of rankOpportunities()'s result (Phase 11, R-15/AC-17).
 * `rank` is the 1-based ranked position; `score` is the Opportunity's
 * own persisted OpportunityScore row, carried through unmodified —
 * ranking only orders what scoreOpportunity() already persisted, never
 * recomputes or mutates a score.
 */
export interface RankedOpportunity {
  opportunityId: string;
  rank: number;
  score: StoredOpportunityScore;
}

/** Untrusted shape a caller supplies to recordFeedback() (R-21). Never carries id/userId. */
export interface RecordFeedbackInput {
  useful: boolean;
  /** Free-form text (OQ-5 resolved: free text, not a closed set) — never rewritten or categorized. */
  reason: string;
}

/**
 * A persisted Feedback row (PRD V2.1 R-21/AC-22, Stage R, migration
 * 0020). Unlike OpportunityScore, Feedback carries its own `userId` — it
 * is a top-level owned model, not one of DEC-008's two named ownership-
 * inheritance exceptions. One current verdict per Opportunity, not an
 * append-only history — resubmitting replaces this row.
 */
export interface StoredFeedback {
  id: string;
  userId: string;
  opportunityId: string;
  useful: boolean;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Basic outcome tracking for one caller's own Opportunities (R-27, Phase
 * 15). Covers only the two verbs R-27's "opportunities created, reviewed,
 * actioned" has an authoritative, already-persisted signal for:
 * `created` (Opportunity existence, R-13) and `actioned` (Feedback
 * existence, R-21 — Stage R's user verdict is the terminal MVP action on
 * an Opportunity). "Reviewed" has no persisted signal anywhere in the
 * MVP data model or PRD and is deliberately not represented here — see
 * this package's index.ts header and the Phase 15 final report for why.
 */
export interface OpportunityTrackingSummary {
  /** Count of the caller's own Opportunities (R-13). */
  created: number;
  /** Of `created`, how many have a recorded Feedback verdict (R-21). */
  actioned: number;
  /** Of `actioned`, how many verdicts were useful. */
  useful: number;
  /** Of `actioned`, how many verdicts were not useful. */
  notUseful: number;
  /** `actioned / created`. `0` (never `NaN`) when `created` is `0`. */
  actionedRate: number;
}
