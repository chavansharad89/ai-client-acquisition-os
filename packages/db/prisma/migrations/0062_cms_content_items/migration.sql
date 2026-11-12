-- 0062_cms_content_items
-- =======================================================================
-- Plus/Pro/Max CMS, Phase 1 (PO-2/PO-3/PO-4 of
-- requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md §6).
--
-- Foundational content model only -- no admin write API, no content
-- hierarchy UI, no upload path, and no hardcoded-content migration are
-- part of this change (all explicitly deferred to a later phase per the
-- Product Owner's Phase 1 scope control). This table is created empty
-- and has no reader/writer in application code yet.
--
-- One self-referencing table models both containers (chapter/topic/
-- folder) and leaf assets (file/video) -- the minimum structure flexible
-- enough for "chapter-wise, topic-wise, or another supported hierarchy"
-- without inventing a specific inventory (PO-4 explicitly forbids
-- inventing one).
--
-- `owning_product_id` is a plain TEXT reference onto the same ProductId
-- domain as `plan_display_names.product_id` (0061) -- restricted at the
-- application layer to the three CMS-eligible plans (`ai_income_99`,
-- `ai_freelancing_499`, `ai_client_acquisition_1499_subscription`); the
-- retired one-time `ai_client_acquisition_1499` SKU is out of scope of
-- this CMS and is never written here.
--
-- "One content item belongs to exactly one plan" (PO-3 / CMS-PO-003(R1)):
-- enforced by the single non-nullable `owning_product_id` column -- there
-- is no many-to-many join table. The trigger below additionally enforces
-- that a child never silently changes plan by virtue of being nested
-- under a different-plan parent.
--
-- Max does not duplicate Plus/Pro content (PO-2): this table has no
-- "inherited copy" concept at all -- inheritance is resolved purely at
-- the access layer (@acos/core-subscriptions' cmsAccess.ts, same Phase 1
-- change set), never by copying rows here.
--
-- Lifecycle (PO-4/PO-6(R1)): DRAFT -> PUBLISHED -> ARCHIVED on `status`.
-- Archived is retained, never deleted (consistent with this repo's
-- existing archive-not-delete idiom, e.g. `entitlements.revoked_at`,
-- `subscription_periods.refunded_at` -- a timestamp marker, not a row
-- deletion).
--
-- Follows this repository's existing convention of enforcing cross-row
-- invariants with a BEFORE INSERT/UPDATE trigger rather than application
-- code alone (precedent: entitlements_require_capture,
-- entitlements_match_order in 0004_entitlements/migration.sql;
-- payments_match_order in 0003_payment_integrity_constraints/migration.sql).
--
-- Additive only, numbered after 0061. Nothing existing is altered.
-- =======================================================================

CREATE TABLE "content_items" (
    "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "owning_product_id" TEXT NOT NULL,
    "parent_id"         TEXT,
    "node_type"         TEXT NOT NULL,
    "asset_kind"        TEXT,
    "title"             TEXT NOT NULL,
    "description"       TEXT,
    "storage_key"       TEXT,
    "bytes"             BIGINT,
    "order_index"       INTEGER NOT NULL DEFAULT 0,
    "status"            TEXT NOT NULL DEFAULT 'DRAFT',
    "archived_at"       TIMESTAMP(3),
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "content_items_parent_id_fkey"
        FOREIGN KEY ("parent_id") REFERENCES "content_items"("id") ON DELETE RESTRICT,

    CONSTRAINT "content_items_node_type_valid"
        CHECK ("node_type" IN ('CONTAINER', 'ASSET')),

    CONSTRAINT "content_items_status_valid"
        CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),

    -- An ASSET leaf must carry storage_key + asset_kind + bytes; a
    -- CONTAINER node must carry none of them (it is a pure hierarchy
    -- node -- chapter/topic/folder).
    CONSTRAINT "content_items_node_shape" CHECK (
        ("node_type" = 'ASSET'
            AND "storage_key" IS NOT NULL
            AND "asset_kind" IS NOT NULL
            AND "bytes" IS NOT NULL)
        OR
        ("node_type" = 'CONTAINER'
            AND "storage_key" IS NULL
            AND "asset_kind" IS NULL
            AND "bytes" IS NULL)
    ),

    CONSTRAINT "content_items_archived_consistency" CHECK (
        ("status" = 'ARCHIVED' AND "archived_at" IS NOT NULL)
        OR
        ("status" != 'ARCHIVED' AND "archived_at" IS NULL)
    ),

    CONSTRAINT "content_items_not_self_parent" CHECK ("parent_id" IS DISTINCT FROM "id")
);

CREATE INDEX "content_items_owning_product_id_status_idx"
    ON "content_items"("owning_product_id", "status");
CREATE INDEX "content_items_parent_id_idx" ON "content_items"("parent_id");

-- A child's owning_product_id must equal its parent's -- a content item
-- never changes plan by virtue of nesting, which is what makes "exactly
-- one plan per item" hold even inside a hierarchy (PO-3).
CREATE OR REPLACE FUNCTION enforce_content_item_matches_parent_plan()
RETURNS TRIGGER AS $$
DECLARE
    parent_owning_product_id TEXT;
BEGIN
    IF NEW."parent_id" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "owning_product_id" INTO parent_owning_product_id
      FROM "content_items"
     WHERE "id" = NEW."parent_id";

    IF parent_owning_product_id IS NULL THEN
        RAISE EXCEPTION 'content_items: parent_id % does not exist', NEW."parent_id";
    END IF;

    IF parent_owning_product_id != NEW."owning_product_id" THEN
        RAISE EXCEPTION
            'content_items: child owning_product_id (%) must match parent owning_product_id (%)',
            NEW."owning_product_id", parent_owning_product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_items_match_parent_plan
    BEFORE INSERT OR UPDATE ON "content_items"
    FOR EACH ROW
    EXECUTE FUNCTION enforce_content_item_matches_parent_plan();
