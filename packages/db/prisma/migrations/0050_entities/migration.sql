-- 0050_entities
-- =======================================================================
-- Global Entity Architecture (CF-GLOBAL-ENTITY-ARCH-PO-DEC-001 D1/D8/D10;
-- CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_CLOSURE_ENGINEERING_READINESS_AND_
-- CONSISTENCY_AUDIT.md §4.1). The root table of the global identity
-- layer: every persisted real-world business (an "Entity") receives an
-- independent, permanent internal id, never derived from name, domain,
-- phone, provider id, or any other external attribute (D1). user_id-free
-- (D8: identity is global across the platform, not user-owned).
--
-- No UPDATE/DELETE path is ever issued against this table by application
-- code (D10: permanent id, no delete). Entity Status is a *derived* read
-- over entity_status_evidence (migration 0056), never a mutable column
-- here.
--
-- Additive only. Does not touch companies/prospects/searches/
-- opportunities/research_signals/lead_unlocks or any other existing
-- table.
-- =======================================================================

CREATE TABLE "entities" (
    "id"          TEXT NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);
