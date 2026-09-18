-- 0019_opportunity_staleness
-- =======================================================================
-- Opportunity staleness (PRD V2.1 R-19, Stage S "OPPORTUNITY STALENESS"):
-- "Represent an opportunity whose evidence has aged ... Stale
-- opportunities are marked, never silently deleted." Phase 11's own
-- carry-forward noted this had no persisted representation yet --
-- migration 0017 explicitly deferred it ("no lifecycle beyond
-- NEW/RESEARCHED (out of scope for this phase)").
--
-- Vocabulary: FRESH / STALE / SUPERSEDED (PRD V2.1 Stage S: "FRESH ·
-- STALE · SUPERSEDED (or approved equivalent)"). This is an independent
-- classification, NOT a fourth value bolted onto `state` -- an
-- Opportunity's state (NEW/RESEARCHED) and its staleness answer
-- different questions ("what step is this at" vs "is its evidence still
-- current") and must not be conflated.
--
-- Not derived ad hoc on every read: the PRD requires stale opportunities
-- be "marked", so the classification is a value that gets written by an
-- explicit operation (@acos/core-opportunity's classifyOpportunityStaleness,
-- mirroring Phase 10's scoreOpportunity()) and persists until that
-- operation runs again -- the same "explicit step, not automatic"
-- decision Phase 10's header made for scoring.
--
-- `staleness_computed_at` is NULL until the first classification, then
-- records when the persisted value was produced -- mirrors
-- opportunity_scores.scored_at (migration 0018), distinct from
-- `updated_at`, which already changes for unrelated Opportunity writes.
--
-- Ownership: unchanged. Opportunity already carries its own user_id
-- (migration 0017); these are additional columns on that same
-- top-level-owned row, not a new table.
--
-- Additive only, numbered after 0018 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled -- both new columns are nullable-
-- default so every existing row (and 0017/0018's own tests) remains
-- valid unchanged. Independent of the quarantined 0005/0006 (see
-- migrations-blocked/README.md) -- no CRM relation, no OutreachChannel,
-- no Next Action persistence, no lifecycle expansion beyond
-- NEW/RESEARCHED (out of scope for this phase).
-- =======================================================================


ALTER TABLE "opportunities"
    ADD COLUMN "staleness" TEXT NOT NULL DEFAULT 'FRESH',
    ADD COLUMN "staleness_computed_at" TIMESTAMP(3);

ALTER TABLE "opportunities"
    ADD CONSTRAINT "opportunities_staleness_check"
        CHECK ("staleness" IN ('FRESH', 'STALE', 'SUPERSEDED'));

-- Supports "show me what's gone stale" without a full table scan, the
-- same rationale as opportunities_user_id_idx (migration 0017) -- a
-- per-user staleness filter is the shape Stage T's future Next Action
-- queue (out of scope for this phase) will need.
CREATE INDEX "opportunities_user_id_staleness_idx" ON "opportunities"("user_id", "staleness");
