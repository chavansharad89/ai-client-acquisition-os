-- 0036_target_customer_match_determinations
-- =======================================================================
-- PCG-4 TARGET_CUSTOMER_MATCH (requirement/
-- CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md decision chain —
-- PDEF4-PCG4-PO-DEC-001, PDEF4-PCG4-ED-DEC-001, PDEF4-PCG4-TCMATCH-MECH-
-- PO-DEC-001, PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001 (TD-1..TD-16),
-- PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001).
--
-- A dedicated Search + Prospect determination (ED-TC-1), structurally
-- parallel to 0027_category_plausibility_determinations but NEVER
-- reusing its computed values (TC-MATCH-12). Tri-state `result`
-- (ED-TC-3): MATCH | NO_MATCH | NOT_YET_OBSERVED. Row absence is also,
-- and always, NOT_YET_OBSERVED (ED-DEC-001 §5) — this table is never
-- pre-populated ahead of an actual Research-time observation.
--
-- Append-only, supersede-then-insert (ED-TC-8), same convention as 0027.
-- Unlike 0027, current-row uniqueness is DB-enforced here (TD-8): a
-- partial UNIQUE index guarantees at most one non-superseded row per
-- (search_id, prospect_id) pair, closing the gap 0027 left to
-- application-code ordering alone.
--
-- model/provider/prompt_version (TD-6) are scoped per-determination (one
-- set of values per row), mirroring ai_usage_events' column names
-- without reusing or joining to that table — ai_usage_events is keyed to
-- a usage EVENT, not a determination, and its granularity (repair
-- attempts included) does not map 1:1 to this row.
--
-- Ownership (DEC-008 pattern): no user_id column — inherited through
-- prospect_id -> prospects.user_id, same as category_plausibility_
-- determinations.
--
-- Additive only, numbered after 0035 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. No Prisma model is added (none exists
-- for Opportunity/Prospect either).
-- =======================================================================

CREATE TABLE "target_customer_match_determinations" (
    "id"                  TEXT NOT NULL,
    "search_id"           TEXT NOT NULL,
    "prospect_id"         TEXT NOT NULL,

    -- Denormalised snapshot of what this determination was evaluated
    -- against (TD-7), mirroring 0027's own target_customer column — the
    -- live value remains independently recoverable from searches.target_customer.
    "target_customer"     TEXT NOT NULL,

    -- ED-TC-3 / TD-7: MATCH | NO_MATCH | NOT_YET_OBSERVED.
    "result"              TEXT NOT NULL,

    -- TD-2/TD-4: array of { classification: 'MATCH'|'NO_MATCH', quote,
    -- sourceUrl, sourceLabel }. Contradictory findings (TC-MATCH-6) are
    -- both retained here, never collapsed to a single "winning" item.
    "evidence"            JSONB NOT NULL,

    -- TD-6: per-determination replay/audit metadata. Non-null on every
    -- row, including a NOT_YET_OBSERVED row explicitly persisted per
    -- TC-MATCH-5(b) (the model/provider actually attempted are still
    -- known even when the call itself failed).
    "model"               TEXT NOT NULL,
    "provider"            TEXT NOT NULL,
    "prompt_version"      TEXT NOT NULL,

    "observed_at"         TIMESTAMP(3) NOT NULL,
    -- Never deleted — a same-Search-Prospect re-run supersedes prior rows instead (ED-TC-8).
    "superseded_at"       TIMESTAMP(3),

    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "target_customer_match_determinations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "target_customer_match_determinations_search_id_fkey"
        FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "target_customer_match_determinations_prospect_id_fkey"
        FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "target_customer_match_determinations_result_check"
        CHECK ("result" IN ('MATCH', 'NO_MATCH', 'NOT_YET_OBSERVED'))
);

-- Historical/audit read: every determination ever recorded for a given
-- Search + Prospect (ED-TC-8 — never unique, so supersede-then-insert
-- always has somewhere to land).
CREATE INDEX "target_customer_match_determinations_search_prospect_idx"
    ON "target_customer_match_determinations"("search_id", "prospect_id");

-- TD-8: DB-enforced "at most one current row per (search_id, prospect_id)
-- pair" — a concurrent writer that would violate this fails at the
-- database with a unique-constraint error (handled as an idempotent
-- no-op by the repository, per PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.2)
-- rather than silently producing two "current" rows.
CREATE UNIQUE INDEX "target_customer_match_determinations_current_idx"
    ON "target_customer_match_determinations"("search_id", "prospect_id")
    WHERE "superseded_at" IS NULL;
