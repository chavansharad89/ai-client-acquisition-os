-- 0056_entity_status_evidence
-- =======================================================================
-- Global Entity Architecture (D15/D16; OQ-9; Q5_CLOSURE §4.1, Q6).
-- Append-only Entity Status observations. Current Entity Status is a
-- DERIVED READ over this table (OQ-9's freshness-gated, most-recent-
-- fresh-wins precedence) -- never a stored mutable column anywhere.
--
-- status CHECK deliberately EXCLUDES 'ACTIVE' and 'UNKNOWN' from the
-- stored enum. D15 names four status *values*, but the only existing
-- producer (detectPlacesEntityReality(), Phase 8) ever positively
-- observes is the two closed states -- 'OPERATIONAL'/null produce no
-- signal at all. 'ACTIVE' and 'UNKNOWN' are derived read-time outcomes
-- only (OQ-9: "no fresh observation -> UNKNOWN"; "ACTIVE is never
-- inferred merely from the absence of a negative status observation") --
-- allowing them in the stored enum would invite a future write path to
-- store 'ACTIVE' from mere absence-of-negative-signal, which OQ-9
-- explicitly forbids.
--
-- Index (entity_id, observed_at DESC) is the exact access pattern OQ-9's
-- derivation algorithm needs. No uniqueness -- append-only, conflicting
-- observations coexist (D11, OQ-9). Insert-only, never updated or
-- deleted.
--
-- This does not alter Phase 8's detectPlacesEntityReality() or Entity
-- Reality elimination semantics (D16: Entity Status is separate from,
-- and is not, Entity Reality / Opportunity eligibility).
-- =======================================================================

CREATE TABLE "entity_status_evidence" (
    "id"           TEXT NOT NULL,
    "entity_id"    TEXT NOT NULL,
    "status"       TEXT NOT NULL,
    "source"       TEXT NOT NULL,
    "observed_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_status_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "entity_status_evidence_entity_id_fkey"
        FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "entity_status_evidence_status_check"
        CHECK ("status" IN ('CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'))
);

CREATE INDEX "entity_status_evidence_entity_id_observed_at_idx"
    ON "entity_status_evidence"("entity_id", "observed_at" DESC);
