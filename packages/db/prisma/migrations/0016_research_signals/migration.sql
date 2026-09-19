-- 0016_research_signals
-- =======================================================================
-- ResearchSignal: the fifth user-owned Client Finder domain object (PRD
-- V2.1 R-09/R-10, Stages RESEARCH / COLLECT EVIDENCE / CLASSIFY
-- EVIDENCE). Gives @acos/core-research's existing, already-tested AI
-- research engine (schema.ts / provenance.ts / researcher.ts) somewhere
-- to write -- MVP_SCOPE_BOUNDARY.md section 7.3: "Research is finished
-- and has nowhere to write. Its persistence interface has no
-- implementation and its target table is not created by any migration."
--
-- Ownership (DEC-008): research_signals carries NO user_id. It is one of
-- exactly two named exceptions to "every top-level MVP model carries
-- user_id" (the other is opportunity_scores, out of scope for this
-- phase) -- ownership is inherited through prospect_id ->
-- prospects.user_id instead, because a denormalised owner column here
-- would be a second source of truth that can disagree with the first.
-- Every ownership-scoped read joins to prospects and filters there --
-- see @acos/core-research's pgRepository.ts.
--
-- Evidence model (PRD V2.1 "EVIDENCE MODEL"): classification, confidence
-- (RAW -- the inference discount is applied exactly once, later, at
-- scoring time by @acos/core-acquisition, never during persistence --
-- see "INFERENCE DISCOUNT -- CANONICAL FLOW"), observed_at and
-- superseded_at persist directly on the signal. classification =
-- UNKNOWN is a first-class, representable outcome (signal IS NULL,
-- confidence = 0) -- deliberately NOT dropped, unlike the pre-existing,
-- unintegrated toResearchRows() adapter in persist.ts. Rows are
-- append-only: a re-research run supersedes every currently-active row
-- for the Prospect (superseded_at set) before inserting fresh ones;
-- nothing is ever deleted or updated in place.
--
-- source_url / source_quote live in the child table below, not as
-- columns on research_signals itself, because a signal may carry more
-- than one piece of evidence -- reducing an observation to its first
-- source would defeat evidence inspection, attribution and re-research
-- (AC-12: "the UI can show more than one source for a claim").
--
-- Additive only, numbered after 0015 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. Independent of the quarantined
-- 0005/0006 (see migrations-blocked/README.md) -- no acq_* table, no
-- OutreachChannel/OpportunityStage type, no CRM relation, no Opportunity
-- or scoring table (out of scope for this phase).
-- =======================================================================


-- ---- research_signals --------------------------------------------------
--
-- One row per claim (Observation), append-only. `field` names which
-- claim this is (companySummary, visibleProblems, ...) -- the
-- Observation's field name from @acos/core-research's schema.ts. `kind`
-- is derived from `field` (see FIELD_KIND in persist.ts / mapping.ts),
-- not from evidence, and feeds @acos/core-acquisition's existing source
-- weighting (scoring.ts's SOURCE_WEIGHT) once that layer is wired to
-- this table in a later phase.

CREATE TABLE "research_signals" (
    "id"              TEXT NOT NULL,
    "prospect_id"     TEXT NOT NULL,

    "field"           TEXT NOT NULL,
    "kind"            TEXT NOT NULL,
    "classification"  TEXT NOT NULL,

    -- The claim text. NULL only for UNKNOWN -- UNKNOWN must survive
    -- persistence, representable and auditable, not silently dropped.
    "signal"          TEXT,

    -- 0-100, RAW and unadjusted. The inference discount is applied once,
    -- later, at scoring time -- never here.
    "confidence"      INTEGER NOT NULL,

    -- INFERRED's reasoning trail ("what observations led here"). NULL
    -- for OBSERVED/UNKNOWN.
    "basis"           TEXT,

    "observed_at"     TIMESTAMP(3) NOT NULL,
    "superseded_at"   TIMESTAMP(3),

    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_signals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "research_signals_prospect_id_fkey"
        FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "research_signals_classification_check"
        CHECK ("classification" IN ('OBSERVED', 'INFERRED', 'UNKNOWN')),
    CONSTRAINT "research_signals_kind_check"
        CHECK ("kind" IN ('WEBSITE', 'JOB_POST', 'LINKEDIN', 'NEWS', 'FUNDING', 'TECH_STACK', 'REVIEW', 'MANUAL')),
    CONSTRAINT "research_signals_confidence_range"
        CHECK ("confidence" >= 0 AND "confidence" <= 100),
    CONSTRAINT "research_signals_signal_null_iff_unknown"
        CHECK (
            ("classification" = 'UNKNOWN' AND "signal" IS NULL) OR
            ("classification" != 'UNKNOWN' AND "signal" IS NOT NULL)
        )
);

-- Every ownership-scoped read joins to prospects on this column; also
-- what keeps supersedePrevious()'s UPDATE cheap.
CREATE INDEX "research_signals_prospect_id_idx" ON "research_signals"("prospect_id");

-- supersedePrevious() and listByProspect() both filter to currently-active
-- rows (superseded_at IS NULL) per prospect -- a partial index keeps that
-- filter cheap as superseded history accumulates.
CREATE INDEX "research_signals_prospect_id_active_idx"
    ON "research_signals"("prospect_id")
    WHERE "superseded_at" IS NULL;


-- ---- research_signal_sources ---------------------------------------------
--
-- Evidence: zero-or-more rows per signal. OBSERVED signals carry one or
-- more (schema.ts's observationSchema requires at least one, verified
-- against the actual source document by provenance.ts's
-- verifyProvenance()); INFERRED and UNKNOWN carry none. A child table,
-- not columns on research_signals, specifically so more than one source
-- per claim remains representable.

CREATE TABLE "research_signal_sources" (
    "id"             TEXT NOT NULL,
    "signal_id"      TEXT NOT NULL,

    "source_url"     TEXT NOT NULL,
    "source_quote"   TEXT NOT NULL,
    "source_label"   TEXT NOT NULL,

    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_signal_sources_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "research_signal_sources_signal_id_fkey"
        FOREIGN KEY ("signal_id") REFERENCES "research_signals"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "research_signal_sources_signal_id_idx" ON "research_signal_sources"("signal_id");
