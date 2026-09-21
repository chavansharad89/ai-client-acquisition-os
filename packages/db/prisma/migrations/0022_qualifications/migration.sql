-- 0022_qualifications
-- =======================================================================
-- Qualification (Phase 20, R-35..R-41): gives @acos/core-qualification's
-- deterministic evaluator (evaluateQualification()) somewhere to persist
-- its result for an existing Opportunity — a re-check of evidence
-- sufficiency layered on top of Need Detection's already-persisted
-- `needDetected`/`offer`, never a second need-detection mechanism.
--
-- Ownership (DEC-008): qualifications carries NO user_id. It is the
-- third named ownership-inheritance exception (alongside
-- research_signals, migration 0016, and opportunity_scores, migration
-- 0018). Ownership is inherited through opportunity_id ->
-- opportunities.user_id; every ownership-scoped read joins to
-- opportunities and filters there (see @acos/core-qualification's
-- pgRepository.ts), the same convention those two tables already use.
--
-- One current qualification per Opportunity, not an append-only history
-- (Phase 20 scope-lock Decision D4, mirroring migration 0018's own
-- Phase 10 decision for opportunity_scores): UNIQUE(opportunity_id).
-- Re-evaluation replaces the row via upsert rather than inserting a new
-- one. Historical ResearchSignal rows are never touched by this table's
-- writes, so "historical evidence not mutated" (R-38) holds trivially.
--
-- Persisted shape (R-35): state (QUALIFIED | NOT_QUALIFIED |
-- INSUFFICIENT_EVIDENCE), criteria[] (an ordered array of
-- {criterion, satisfied, reason, evidenceSignalIds}), evidence_signal_ids
-- (the union of every criterion's evidence — StoredResearchSignal ids),
-- evaluator_version, evaluated_at. `criteria` is stored as JSONB — the
-- same choice migration 0018 made for opportunity_scores' `factors` —
-- since it has no independent identity of its own to normalise into a
-- child table.
--
-- prospect_id is denormalised onto this table (unlike opportunity_scores)
-- solely so R-40 observability reads need no second join through
-- opportunities to find the Prospect; it is never used for ownership and
-- is kept in sync only because the row is always fully replaced, never
-- patched, on re-evaluation.
--
-- Additive only, numbered after 0021 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. No Phase 18/19 table or column is
-- touched.
-- =======================================================================


-- ---- qualifications -----------------------------------------------
--
-- Ownership inherited through opportunity_id -> opportunities.user_id
-- (DEC-008) -- never a denormalised user_id column here.

CREATE TABLE "qualifications" (
    "id"                    TEXT NOT NULL,
    "opportunity_id"        TEXT NOT NULL,
    "prospect_id"           TEXT NOT NULL,

    "state"                 TEXT NOT NULL,

    -- Ordered array of QualificationCriterionResult objects
    -- ({criterion, satisfied, reason, evidenceSignalIds}).
    "criteria"              JSONB NOT NULL,
    -- Union of every criterion's evidenceSignalIds -- StoredResearchSignal ids.
    "evidence_signal_ids"   TEXT[] NOT NULL DEFAULT '{}',

    -- Identifies the evaluator build that produced this row (R-40),
    -- mirroring opportunity_scores.scorer_version.
    "evaluator_version"     TEXT NOT NULL,
    "evaluated_at"          TIMESTAMP(3) NOT NULL,

    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qualifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "qualifications_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qualifications_state_check"
        CHECK ("state" IN ('QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE'))
);

-- One current qualification per Opportunity. Also the index every
-- ownership-safe lookup (getByOpportunityId, upsert) uses -- the join to
-- `opportunities` for the user_id filter is covered by that table's own
-- primary key and opportunities_user_id_idx (migration 0017).
CREATE UNIQUE INDEX "qualifications_opportunity_id_key" ON "qualifications"("opportunity_id");
