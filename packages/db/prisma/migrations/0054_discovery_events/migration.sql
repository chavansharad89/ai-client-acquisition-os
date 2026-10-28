-- 0054_discovery_events
-- =======================================================================
-- Global Entity Architecture (D21/C-5/C-7; OQ-8; Q5_CLOSURE §4.1/§4.2).
-- Dedicated discovery-provenance record: provider/source, the actual
-- query sent, the discovery timestamp, and the resolved entity_id
-- (D21's stated minimum fields, entity_id non-nullable). "Why Found"
-- must be derived from this persisted row, never reconstructed from the
-- current/mutable query-building logic (C-7).
--
-- No uniqueness constraint: D21 explicitly sanctions duplicate events --
-- each retry creates its own immutable row. Insert-only; no UPDATE/
-- DELETE path is ever issued against this table (D21 "immutable
-- historical record"). search_id/prospect_id are nullable structural
-- FKs (Q5_CLOSURE §4: "ordinary schema discretion, not C-5's reserved
-- richer-provenance-model question") -- D21/C-5's stated minimum fields
-- do not require them.
--
-- Now adds the deferred FK from identity_evidence.discovery_event_id
-- (migration 0051), completing that table's forward reference.
-- =======================================================================

CREATE TABLE "discovery_events" (
    "id"            TEXT NOT NULL,
    "entity_id"     TEXT NOT NULL,
    "search_id"     TEXT,
    "prospect_id"   TEXT,
    "provider"      TEXT NOT NULL,
    "actual_query"  TEXT NOT NULL,
    "discovered_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "discovery_events_entity_id_fkey"
        FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discovery_events_search_id_fkey"
        FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discovery_events_prospect_id_fkey"
        FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "discovery_events_entity_id_idx" ON "discovery_events"("entity_id");

ALTER TABLE "identity_evidence"
    ADD CONSTRAINT "identity_evidence_discovery_event_id_fkey"
        FOREIGN KEY ("discovery_event_id") REFERENCES "discovery_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
