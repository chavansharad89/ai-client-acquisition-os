-- 0052_companies_entity_id
-- =======================================================================
-- Global Entity Architecture (D1/D8; Q5_CLOSURE §4.1 "companies
-- (additive change only)"). Adds a nullable entity_id FK to the
-- existing companies table, populated by the resolver (migration-free,
-- application-code change) at discovery time going forward.
--
-- NULL for every historical row, and never backfilled by inference
-- (CF-GLOBAL-ENTITY-ARCH-PO-DEC-001 D14; historical-safety plan,
-- ENGINEERING_SPECIFICATION_FINAL.md §11). Purely additive -- no
-- existing column, index, or constraint on companies is touched.
-- =======================================================================

ALTER TABLE "companies" ADD COLUMN "entity_id" TEXT;

ALTER TABLE "companies"
    ADD CONSTRAINT "companies_entity_id_fkey"
        FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "companies_entity_id_idx" ON "companies"("entity_id");
