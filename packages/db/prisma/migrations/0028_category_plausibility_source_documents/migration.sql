-- 0028_category_plausibility_source_documents
-- =======================================================================
-- A-11 / A11-P1 M-2 — persist the model-seen source text (requirement/
-- PATH_2_CATEGORY_PLAUSIBILITY_A11_P1_SOURCE_CAPTURE_PRODUCT_DECISION.md;
-- authorization A11-P1-IMPL-AUTH-001).
--
-- One row per source document supplied to the model for a category-
-- plausibility determination, so a later reviewer can perform D11 §6.3
-- (substantive reading) and §6.4 (verbatim spot-check) against exactly
-- what the model saw, not a later re-fetch of the page.
--
-- `source_text` is the text AFTER researchInputSchema.parse() — the value
-- buildUserMessage() renders into the prompt — never raw HTML, never a
-- re-extraction. `content_sha256` is the SHA-256 of that exact text
-- (UTF-8, lower-case hex), computed by the writer before insert.
--
-- Traceability: determination_id -> category_plausibility_determinations
-- (which already carries search_id, prospect_id). No Search/Prospect/
-- Opportunity column is duplicated here. Ownership is inherited through
-- that chain (DEC-008 pattern — no user_id column).
--
-- Additive only, numbered after 0027 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled; determinations written before this
-- migration simply have no captured sources.
-- =======================================================================

CREATE TABLE "category_plausibility_source_documents" (
    "id"                  TEXT NOT NULL,
    "determination_id"    TEXT NOT NULL,

    -- 0-based position in the supplied document list; with the unique
    -- constraint below, multiple sources for one determination never
    -- overwrite one another.
    "document_index"      INTEGER NOT NULL,

    "source_label"        TEXT NOT NULL,
    "source_url"          TEXT NOT NULL,
    "source_text"         TEXT NOT NULL,
    "content_sha256"      TEXT NOT NULL,

    -- The only kind M-2 produces; the CHECK keeps any other
    -- representation (e.g. a facilitator snapshot) out of this table.
    "capture_kind"        TEXT NOT NULL,

    -- How the SourceDocumentProvider produced the text ('UNDECLARED'
    -- when the provider does not declare it — never guessed).
    "extraction_method"   TEXT NOT NULL,

    "fetched_at"          TIMESTAMP(3) NOT NULL,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_plausibility_source_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "category_plausibility_source_documents_determination_id_fkey"
        FOREIGN KEY ("determination_id") REFERENCES "category_plausibility_determinations"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "category_plausibility_source_documents_capture_kind_check"
        CHECK ("capture_kind" = 'MODEL_SEEN_SOURCE'),
    CONSTRAINT "category_plausibility_source_documents_document_index_check"
        CHECK ("document_index" >= 0),
    CONSTRAINT "category_plausibility_source_documents_sha256_check"
        CHECK ("content_sha256" ~ '^[0-9a-f]{64}$')
);

-- Reviewer read: every captured source for one determination, in order.
-- Also enforces one row per (determination, position).
CREATE UNIQUE INDEX "category_plausibility_source_documents_determination_index_key"
    ON "category_plausibility_source_documents"("determination_id", "document_index");
