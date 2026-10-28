-- 0048_opportunity_relevant_subservices
-- =======================================================================
-- Phase 7B (MULR item 6 -- CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001;
-- CF-SERVICE-CATALOG-PO-DEC-001; CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-
-- INTERNAL-PO-DEC-001; final evidence-semantics audit authorization):
-- persists which of the selected top-level service's catalogue
-- sub-services (internal metadata only -- never a user-facing selection
-- or a separate result category) were deterministically found relevant
-- to this Opportunity's Research evidence.
--
-- One Opportunity, multiple array entries -- mirrors offer_based_on's
-- own TEXT[] NOT NULL DEFAULT '{}' shape (migration 0017). Never a
-- separate subservice table, never one Opportunity per subservice.
--
-- Additive only, numbered after 0047 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled.
-- =======================================================================

ALTER TABLE "opportunities"
    ADD COLUMN "relevant_subservices" TEXT[] NOT NULL DEFAULT '{}';
