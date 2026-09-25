-- 0026_ai_usage_events_fallback_request_kind
-- =======================================================================
-- Multi-Model Research Provider fallback accounting (requirement/
-- MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md Decision 5;
-- requirement/MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §8).
--
-- Widens ai_usage_events.request_kind (migration 0021) to admit a third
-- value, 'fallback', fired for an invocation made against a non-primary
-- provider in a cross-provider fallback chain (see @acos/core-research's
-- createFallbackResearchProvider). Every invocation belonging to a
-- fallback attempt is tagged 'fallback' regardless of that inner
-- attempt's own initial/repair distinction (see
-- @acos/core-research/fallbackResearchProvider.ts's own module note).
--
-- Purely additive: no existing row is touched, no existing value's
-- meaning changes ('initial'/'repair' keep exactly the meaning migration
-- 0021 gave them), and every existing query/index (none of which filter
-- on request_kind) is unaffected. No monetary column is added (still
-- forbidden per migration 0021's own D10/D11 note) -- this remains
-- token-usage telemetry only.
-- =======================================================================

ALTER TABLE "ai_usage_events" DROP CONSTRAINT "ai_usage_events_request_kind_check";

ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_request_kind_check"
    CHECK ("request_kind" IN ('initial', 'repair', 'fallback'));
