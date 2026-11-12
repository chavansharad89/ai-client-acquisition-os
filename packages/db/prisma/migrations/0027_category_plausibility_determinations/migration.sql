-- 0027_category_plausibility_determinations
-- =======================================================================
-- Path 2 — Research-level Category Plausibility (D0-D11, requirement/
-- PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md
-- and PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_AUTHORIZATION_GATE.md).
--
-- D1/D6: a DEDICATED Search + Prospect determination — not a Prospect-
-- global property, not a repurposing of research_signals/LeadResearch.
-- Keyed by (search_id, prospect_id), preserving historical attribution:
-- a later Search with a different targetCustomer produces a new,
-- independent row for the same Prospect rather than overwriting the
-- earlier one. A same-Search re-run supersedes its own prior row,
-- mirroring research_signals' (migration 0016) append-only,
-- supersede-then-insert convention.
--
-- D7: structurally outside FIELD_KIND/ResearchSignal/allObservations() —
-- this is a wholly separate table, never a research_signals row, so it
-- can never reach toNewResearchSignals()/toOfferSignals()/suggestOffers()
-- regardless of any field-name convention.
--
-- Ownership (DEC-008 pattern): no user_id column. Ownership is inherited
-- through prospect_id -> prospects.user_id, the same convention
-- research_signals (migration 0016) and qualifications (migration 0022)
-- already use; every ownership-scoped read joins to prospects.
--
-- Additive only, numbered after 0026 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled.
-- =======================================================================


CREATE TABLE "category_plausibility_determinations" (
    "id"                  TEXT NOT NULL,
    "search_id"           TEXT NOT NULL,
    "prospect_id"         TEXT NOT NULL,

    -- D6 attribution / D3 audit: exactly what targetCustomer this
    -- determination was evaluated against, plus its deterministic (D2)
    -- parse.
    "target_customer"    TEXT NOT NULL,
    "target_segments"     TEXT[] NOT NULL DEFAULT '{}',

    -- D2 aggregate: MATCH | MISMATCH | UNKNOWN (ANY-match over segments).
    "aggregate_result"    TEXT NOT NULL,

    -- Ordered array of per-segment results — {segment, fit, rationale,
    -- evidence: [{quote, sourceUrl, sourceLabel}]} — D2/D3/D10-B.
    "segment_results"     JSONB NOT NULL,

    "observed_at"         TIMESTAMP(3) NOT NULL,
    -- Never deleted — a same-Search re-run supersedes prior rows instead.
    "superseded_at"       TIMESTAMP(3),

    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_plausibility_determinations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "category_plausibility_determinations_search_id_fkey"
        FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "category_plausibility_determinations_prospect_id_fkey"
        FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "category_plausibility_determinations_aggregate_result_check"
        CHECK ("aggregate_result" IN ('MATCH', 'MISMATCH', 'UNKNOWN'))
);

-- Research/UI-facing read: every determination ever recorded for a given
-- Search + Prospect (D6 historical attribution — never unique, so a
-- same-Search re-run's supersede-then-insert has somewhere to land).
CREATE INDEX "category_plausibility_determinations_search_prospect_idx"
    ON "category_plausibility_determinations"("search_id", "prospect_id");

-- Qualification/UI "current determination for this Prospect" read
-- (D6: "Qualification reads the CURRENT Search + Prospect determination"
-- — a Prospect's search_id is itself immutable and unique per Prospect,
-- migration 0015's UNIQUE(search_id, company_id), so at most one row per
-- prospect_id is ever non-superseded at a time). Partial index mirrors
-- research_signals' own superseded_at IS NULL lookup pattern.
CREATE INDEX "category_plausibility_determinations_current_by_prospect_idx"
    ON "category_plausibility_determinations"("prospect_id")
    WHERE "superseded_at" IS NULL;
