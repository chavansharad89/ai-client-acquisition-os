-- 0029_research_signal_intent_kinds
-- =======================================================================
-- Intent intake (INTENT-INTAKE-PO-DEC-001, C1): widens the
-- research_signals kind vocabulary with PUBLIC_INTENT and FIRST_PARTY.
-- Additive only — every existing row and every existing kind remains
-- valid; no column, default, index or other constraint changes. No new
-- Signal table: intake signals reuse research_signals /
-- research_signal_sources exactly as migration 0016 defined them.
-- =======================================================================

ALTER TABLE "research_signals" DROP CONSTRAINT "research_signals_kind_check";

ALTER TABLE "research_signals"
    ADD CONSTRAINT "research_signals_kind_check"
        CHECK ("kind" IN ('WEBSITE', 'JOB_POST', 'LINKEDIN', 'NEWS', 'FUNDING', 'TECH_STACK', 'REVIEW', 'MANUAL',
                          'PUBLIC_INTENT', 'FIRST_PARTY'));
