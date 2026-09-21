-- 0023_personalizations
-- =======================================================================
-- Personalization (Phase 21, R-42..R-53): gives @acos/core-personalization's
-- deterministic generator somewhere to persist a structured, evidence-backed
-- personalization artifact for an existing, QUALIFIED Opportunity — a
-- downstream consumer of Qualification (migration 0022), never a second
-- qualification/need-detection mechanism.
--
-- Ownership (DEC-008): personalizations carries NO user_id. It is the
-- fourth named ownership-inheritance exception (alongside research_signals
-- migration 0016, opportunity_scores migration 0018, and qualifications
-- migration 0022). Ownership is inherited through opportunity_id ->
-- opportunities.user_id; every ownership-scoped read joins to opportunities
-- and filters there (see @acos/core-personalization's pgRepository.ts), the
-- same convention those three tables already use.
--
-- One current personalization per Opportunity, not an append-only history
-- (R-49, mirroring migration 0022's own Decision D4 for qualifications):
-- UNIQUE(opportunity_id). Re-evaluation replaces the row via upsert rather
-- than inserting a new one. ResearchSignal and Qualification rows are never
-- touched by this table's writes.
--
-- Persisted shape (R-45): state (currently only 'GENERATED' — see the
-- Phase 21 scope-lock's Decision P3 for why no second value exists yet),
-- opening_context, value_proposition, personalization_rationale (all
-- generated prose), evidence (a bounded, ordered JSONB array of
-- {signalId, field, kind, classification, signal, confidence, basis} —
-- mirrors migration 0022's JSONB choice for `criteria`, since evidence
-- items have no independent identity of their own to normalise into a
-- child table), generator_version, generated_at.
--
-- prospect_id and offer_service are denormalised onto this table (same
-- rationale as qualifications.prospect_id in migration 0022) solely so a
-- read needs no second join through opportunities to see which Prospect
-- and recommended service this personalization was generated for; neither
-- is ever used for ownership, and both are kept in sync only because the
-- row is always fully replaced, never patched, on re-evaluation.
--
-- Additive only, numbered after 0022 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. No Phase 18/19/20 table or column is
-- touched.
-- =======================================================================


-- ---- personalizations -----------------------------------------------
--
-- Ownership inherited through opportunity_id -> opportunities.user_id
-- (DEC-008) -- never a denormalised user_id column here.

CREATE TABLE "personalizations" (
    "id"                        TEXT NOT NULL,
    "opportunity_id"            TEXT NOT NULL,
    "prospect_id"               TEXT NOT NULL,

    "state"                     TEXT NOT NULL,

    "offer_service"             TEXT NOT NULL,
    "opening_context"           TEXT NOT NULL,
    "value_proposition"         TEXT NOT NULL,
    "personalization_rationale" TEXT NOT NULL,

    -- Bounded, ordered array of PersonalizationEvidenceItem objects
    -- ({signalId, field, kind, classification, signal, confidence, basis}).
    "evidence"                  JSONB NOT NULL,

    -- Identifies the generator build that produced this row (mirrors
    -- qualifications.evaluator_version, migration 0022).
    "generator_version"         TEXT NOT NULL,
    "generated_at"              TIMESTAMP(3) NOT NULL,

    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalizations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "personalizations_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "personalizations_state_check"
        CHECK ("state" IN ('GENERATED'))
);

-- One current personalization per Opportunity. Also the index every
-- ownership-safe lookup (getByOpportunityId, upsert) uses -- the join to
-- `opportunities` for the user_id filter is covered by that table's own
-- primary key and opportunities_user_id_idx (migration 0017).
CREATE UNIQUE INDEX "personalizations_opportunity_id_key" ON "personalizations"("opportunity_id");
