-- 0037_target_customer_match_source_documents
-- =======================================================================
-- TD-5 — structural/cryptographic binding of a target-customer-match
-- classification to the source document it was derived from, reusing
-- the exact migration-0028 pattern (requirement/
-- CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION.md
-- TD-5/TD-9).
--
-- One row per source document supplied to the model for a
-- target-customer-match determination, so replay/audit (TC-MATCH-10) is
-- possible against exactly what the model saw. `source_text` is the
-- text after researchInputSchema.parse() — never raw HTML, never a
-- re-extraction. `content_sha256` is the SHA-256 of that exact text
-- (UTF-8, lower-case hex), computed by the writer before insert.
--
-- Traceability: determination_id -> target_customer_match_determinations
-- (which already carries search_id, prospect_id). No Search/Prospect
-- column is duplicated here. Ownership inherited through that chain
-- (DEC-008 pattern — no user_id column).
--
-- Additive only, numbered after 0036 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled; determinations written without
-- captured sources simply have none.
-- =======================================================================

CREATE TABLE "target_customer_match_source_documents" (
    "id"                  TEXT NOT NULL,
    "determination_id"    TEXT NOT NULL,

    -- 0-based position in the supplied document list.
    "document_index"      INTEGER NOT NULL,

    "source_label"        TEXT NOT NULL,
    "source_url"          TEXT NOT NULL,
    "source_text"         TEXT NOT NULL,
    "content_sha256"      TEXT NOT NULL,

    "fetched_at"          TIMESTAMP(3) NOT NULL,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "target_customer_match_source_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "target_customer_match_source_documents_determination_id_fkey"
        FOREIGN KEY ("determination_id") REFERENCES "target_customer_match_determinations"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "target_customer_match_source_documents_document_index_check"
        CHECK ("document_index" >= 0),
    CONSTRAINT "target_customer_match_source_documents_sha256_check"
        CHECK ("content_sha256" ~ '^[0-9a-f]{64}$')
);

-- Reviewer read: every captured source for one determination, in order.
-- Also enforces one row per (determination, position).
CREATE UNIQUE INDEX "target_customer_match_source_documents_determination_index_key"
    ON "target_customer_match_source_documents"("determination_id", "document_index");
