-- 0057_research_signal_cache_index_google_places_status
-- =======================================================================
-- Global Entity Architecture (ENGINEERING_SPECIFICATION_FINAL.md §6
-- "Cache": "research_signal_cache_index's signal_kind CHECK widened to
-- include GOOGLE_PLACES_STATUS"). Narrow, additive widening, same
-- pattern as migration 0049 (research_signals.kind) -- every existing
-- row and every existing kind remains valid; no column, default, or
-- index change.
-- =======================================================================

ALTER TABLE "research_signal_cache_index" DROP CONSTRAINT "research_signal_cache_index_kind_check";

ALTER TABLE "research_signal_cache_index"
    ADD CONSTRAINT "research_signal_cache_index_kind_check"
        CHECK ("signal_kind" IN ('WEBSITE', 'JOB_POST', 'LINKEDIN', 'NEWS', 'FUNDING', 'TECH_STACK', 'REVIEW', 'MANUAL',
                                  'GOOGLE_PLACES_STATUS'));
