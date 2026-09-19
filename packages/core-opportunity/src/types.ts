import type {
  FactorScore,
  OpportunityStage,
  OpportunityStaleness,
  ScoreBand,
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A persisted OpportunityScore row (migration 0018). Maps
 * @acos/core-acquisition's `ProspectScore` (unmodified — PRD V2.1
 * "SEVEN-FACTOR SCORING — AUTHORITATIVE MODEL") onto columns rather than
 * reducing it to a single total: every factor's weight/raw/points/basis/
 * reason must remain independently retrievable (AC-16). Ownership is
 * inherited through `opportunityId` -> `opportunities.user_id` (DEC-008,
 * the second named exception alongside `research_signals`) — no
 * `userId` field of its own. One current score per Opportunity, not an
 * append-only history — re-scoring replaces this row.
 */
export interface StoredOpportunityScore {
  id: string;
  opportunityId: string;
  total: number;
  band: ScoreBand;
  factors: readonly FactorScore[];
  reasons: readonly string[];
  observedShare: number;
  /** Set only when a rule (e.g. the inference-heavy HIGH cap) overrode the arithmetic. */
  cap: string | undefined;
  /** Identifies the scorer build that produced this row (PRD V2.1: "allows a ranking to be reproduced after weights change"). */
  scorerVersion: string;
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
