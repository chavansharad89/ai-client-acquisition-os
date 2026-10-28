-- 0060_research_signal_cache_index_entity_id
-- =======================================================================
-- Global Entity Architecture (ENGINEERING_SPECIFICATION_FINAL.md §6
-- "Cache"; CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
-- SPECIFICATION.md §I). Adds entity_id as a new, nullable, parallel
-- lookup dimension on research_signal_cache_index for public-cleared
-- kinds only, now that the Entity layer (migration 0050) exists.
--
-- The existing (user_id, normalized_domain, signal_kind) key is NOT
-- replaced -- only supplemented. No consuming cross-freelancer read path
-- exists yet (per the gate specification, that read path "DOES NOT
-- EXIST TODAY" and remains a separate, future piece of work) -- this
-- column is additive metadata only, carrying zero runtime effect until
-- that future read path is built, and that future read path MUST
-- re-check live Q5-B authorization state on every read rather than
-- trusting a cache hit as an implicit pre-verified authorization (gate
-- spec §H/§I) -- this migration does not and cannot enforce that by
-- itself; it only adds the column the specification anticipates.
-- =======================================================================

ALTER TABLE "research_signal_cache_index" ADD COLUMN "entity_id" TEXT;

ALTER TABLE "research_signal_cache_index"
    ADD CONSTRAINT "research_signal_cache_index_entity_id_fkey"
        FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "research_signal_cache_index_entity_id_idx"
    ON "research_signal_cache_index"("entity_id") WHERE "entity_id" IS NOT NULL;
