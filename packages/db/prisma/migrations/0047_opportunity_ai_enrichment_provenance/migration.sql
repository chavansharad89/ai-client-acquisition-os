-- 0047_opportunity_ai_enrichment_provenance
-- =======================================================================
-- Phase 6 (CLIENT_FINDER_PHASE6_IMPLEMENTATION_READINESS_REPORT.md,
-- approved engineering proposal) -- candidate-level AI enrichment
-- provenance over the admission/cache/budget/escalation behavior Phase 5
-- (migration 0046) already implemented: whether an Opportunity's current
-- evidence came from an AI Research/TCM run (or a fresh reusable cache
-- hit of one), or only from deterministic signals, and why not when it
-- did not.
--
-- Two columns, both on `opportunities` (the row every
-- processOneCandidate() branch already converges on -- see
-- runPostResearchPipelineForOwner), never on `research_signals`: this is
-- a classification of the OPPORTUNITY's current evidence state, not a
-- new evidence kind, and not a per-candidate AI-consumption ledger
-- (already rejected for the budget itself by migration 0046's own
-- header; a ledger is equally out of scope here).
--
-- ai_enrichment: AI_ENRICHED | DETERMINISTIC_ONLY, default
-- DETERMINISTIC_ONLY -- mirrors opportunities.staleness's own
-- NOT NULL DEFAULT (migration 0019): every pre-Phase-6 row, and any row
-- inserted before this Opportunity's provenance is explicitly recorded,
-- reads as the conservative value, never a false AI_ENRICHED claim.
--
-- ai_enrichment_reason: NULL for AI_ENRICHED (successful Research/TCM,
-- or a fresh reusable cache hit of prior AI Research -- the cached
-- evidence is still AI-derived, never relabeled deterministic); one of
-- NOT_ESCALATED / ESCALATION_FAILED / PROVIDER_EXHAUSTED for
-- DETERMINISTIC_ONLY. Nullable, no default: the application sets it
-- explicitly in the same call that sets `ai_enrichment` (see
-- @acos/core-opportunity's recordAiEnrichmentForOwner), the same
-- "explicit step" convention `staleness_computed_at` uses relative to
-- `staleness`.
--
-- Reclassifiable, not append-only: a Search retry/reprocessing of the
-- same Prospect calls recordAiEnrichmentForOwner again for the existing
-- Opportunity, which UPDATEs these two columns in place -- the same
-- "update the existing row, never insert a duplicate" convention
-- `updateStaleness` (migration 0019) already established for this table.
--
-- Additive only, numbered after 0046 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled.
-- =======================================================================

ALTER TABLE "opportunities"
    ADD COLUMN "ai_enrichment" TEXT NOT NULL DEFAULT 'DETERMINISTIC_ONLY',
    ADD COLUMN "ai_enrichment_reason" TEXT;

ALTER TABLE "opportunities"
    ADD CONSTRAINT "opportunities_ai_enrichment_check"
        CHECK ("ai_enrichment" IN ('AI_ENRICHED', 'DETERMINISTIC_ONLY'));

ALTER TABLE "opportunities"
    ADD CONSTRAINT "opportunities_ai_enrichment_reason_check"
        CHECK ("ai_enrichment_reason" IN ('NOT_ESCALATED', 'ESCALATION_FAILED', 'PROVIDER_EXHAUSTED'));
