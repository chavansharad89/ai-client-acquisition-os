-- 0018_opportunity_scores
-- =======================================================================
-- OpportunityScore: gives @acos/core-acquisition's existing, already-
-- tested seven-factor scorer (prospectScore.ts's scoreProspect()) and
-- @acos/core-research's signal adapter (scoringAdapter.ts's
-- toScoringSignals()) somewhere to write for a persisted Opportunity
-- (PRD V2.1 R-14/R-15/R-17, "SEVEN-FACTOR SCORING — AUTHORITATIVE
-- MODEL") -- REPOSITORY STATUS TABLE: "Seven-factor scoring ...
-- IMPLEMENTED LOGIC ... NOT INTEGRATED".
--
-- Ownership (DEC-008): opportunity_scores carries NO user_id. It is the
-- second of exactly two named ownership-inheritance exceptions (the
-- other is research_signals) -- migration 0017's header and
-- @acos/core-opportunity's pgRepository.ts/index.ts both name this table
-- as the deliberately-deferred seam this migration now fills. Ownership
-- is inherited through opportunity_id -> opportunities.user_id; every
-- ownership-scoped read joins to opportunities and filters there (see
-- @acos/core-opportunity's opportunityScorePgRepository.ts), the same
-- convention research_signals already uses.
--
-- One current score per Opportunity, not an append-only history
-- (Phase 10 decision): UNIQUE(opportunity_id). Re-scoring replaces the
-- row via upsert rather than inserting a new one -- score history and
-- versioning beyond scorer_version are explicitly out of scope for this
-- phase.
--
-- Persisted shape (PRD V2.1 "SEVEN-FACTOR SCORING — AUTHORITATIVE
-- MODEL"): total, band, factors[] (factor, weight, raw, points, basis,
-- reason), reasons[], observed_share, cap?, scorer_version, scored_at --
-- @acos/core-acquisition's ProspectScore, unmodified, mapped onto
-- columns rather than reduced to a single total (per-factor weight/raw/
-- points/basis/reason must remain independently retrievable -- AC-16).
-- `factors` is stored as JSONB (an ordered array of seven objects) since
-- it has no independent identity of its own to normalise into a child
-- table, unlike research_signals' multi-source evidence.
--
-- Additive only, numbered after 0017 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. Independent of the quarantined
-- 0005/0006 (see migrations-blocked/README.md) -- no CRM relation, no
-- OutreachChannel, no Opportunity lifecycle expansion, no score history
-- table (out of scope for this phase).
-- =======================================================================


-- ---- opportunity_scores ----------------------------------------------
--
-- Ownership inherited through opportunity_id -> opportunities.user_id
-- (DEC-008) -- never a denormalised user_id column here.

CREATE TABLE "opportunity_scores" (
    "id"               TEXT NOT NULL,
    "opportunity_id"   TEXT NOT NULL,

    "total"            INTEGER NOT NULL,
    "band"             TEXT NOT NULL,

    -- Ordered array of the seven FactorScore objects
    -- ({factor, weight, raw, points, basis, reason}) -- @acos/core-
    -- acquisition's ProspectScore.factors, unmodified.
    "factors"          JSONB NOT NULL,
    -- Ordered, human-readable -- ProspectScore.reasons, unmodified.
    "reasons"          TEXT[] NOT NULL DEFAULT '{}',
    -- Share of the score resting on OBSERVED facts (0-1).
    "observed_share"   DOUBLE PRECISION NOT NULL,
    -- Set only when a rule (e.g. the inference-heavy HIGH cap) overrode
    -- the arithmetic. NULL otherwise.
    "cap"              TEXT,

    -- Identifies the scorer build that produced this row, so a ranking
    -- can be reproduced or distinguished after the algorithm's weights
    -- change (PRD V2.1: "scorerVersion is what allows a ranking to be
    -- reproduced after weights change").
    "scorer_version"   TEXT NOT NULL,
    "scored_at"        TIMESTAMP(3) NOT NULL,

    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_scores_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "opportunity_scores_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "opportunity_scores_band_check"
        CHECK ("band" IN ('HIGH', 'MEDIUM', 'LOW')),
    CONSTRAINT "opportunity_scores_total_range"
        CHECK ("total" >= 0 AND "total" <= 100),
    CONSTRAINT "opportunity_scores_observed_share_range"
        CHECK ("observed_share" >= 0 AND "observed_share" <= 1)
);

-- One current score per Opportunity. Also the index every ownership-safe
-- lookup (getByOpportunityId, upsert) uses -- the join to `opportunities`
-- for the user_id filter is covered by that table's own primary key and
-- opportunities_user_id_idx (migration 0017).
CREATE UNIQUE INDEX "opportunity_scores_opportunity_id_key" ON "opportunity_scores"("opportunity_id");
