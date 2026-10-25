-- 0049_research_signal_google_places_status_kind
-- =======================================================================
-- Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D11/D16):
-- widens the research_signals kind vocabulary with GOOGLE_PLACES_STATUS,
-- the dedicated source kind for Google Places operational-status
-- evidence (businessStatus), produced by
-- packages/core-research/src/deterministicSignals.ts's
-- detectPlacesEntityReality(). Additive only, same pattern as migration
-- 0029 (PUBLIC_INTENT/FIRST_PARTY) — every existing row and every
-- existing kind remains valid; no column, default, or index changes.
-- =======================================================================

ALTER TABLE "research_signals" DROP CONSTRAINT "research_signals_kind_check";

ALTER TABLE "research_signals"
    ADD CONSTRAINT "research_signals_kind_check"
        CHECK ("kind" IN ('WEBSITE', 'JOB_POST', 'LINKEDIN', 'NEWS', 'FUNDING', 'TECH_STACK', 'REVIEW', 'MANUAL',
                          'PUBLIC_INTENT', 'FIRST_PARTY', 'GOOGLE_PLACES_STATUS'));
