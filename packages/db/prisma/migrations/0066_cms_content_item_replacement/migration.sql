-- 0066_cms_content_item_replacement
-- =======================================================================
-- CMS-PO-010(R2) Phase 1 -- database/schema foundation only
-- (requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md).
--
-- Implements the selected engineering architecture ("Option B -- a
-- pending replacement is a separate content_items row", not pending
-- columns on the same row): a replacement is an ordinary second
-- content_items row (node_type = ASSET, status = DRAFT) linked to the
-- logical asset it would replace via the new replaces_content_item_id
-- self-reference -- the same self-referencing idiom this table already
-- uses for parent_id (migration 0062).
--
-- This migration adds only what representing the following requires:
--   - a normal published asset (unchanged; no existing row is affected);
--   - a pending replacement asset (replaces_content_item_id, populated
--     only on an ASSET/DRAFT row);
--   - at most one pending replacement per logical asset (a partial
--     unique index -- a database invariant, not an application
--     convention);
--   - same-product replacement only (a trigger mirroring this table's
--     own enforce_content_item_matches_parent_plan);
--   - previous physical-object retention metadata
--     (previous_storage_key / previous_storage_retention_until), for the
--     obsolete object a row leaves behind once a pending replacement is
--     published onto it (CMS-PO-010(R2)-G, 30-day retention);
--   - a safe replacement lifecycle (the FK's ON DELETE RESTRICT below
--     prevents a live asset from being deleted while a replacement still
--     references it, and the node-shape CHECK below rejects a
--     replacement pointer on anything but a DRAFT asset).
--
-- No version-history table, no generic revision system, and no change to
-- the existing DRAFT -> PUBLISHED -> ARCHIVED lifecycle are introduced --
-- CMS-PO-010(R2)-F is explicit that full CMS-level version history is
-- NOT required, and this migration adds nothing beyond the above.
--
-- IMPORTANT KEY SEMANTIC (deliberate non-constraint): there is no check
-- requiring content_items.id to appear inside storage_key. The approved
-- design lets a PUBLISHED row adopt the physical storage_key originally
-- generated for its (now-consumed) replacement row -- e.g. row A, once a
-- replacement is published onto it, may carry
-- storage_key = 'cms/<product>/assets/<B's id>.<ext>' where B was the
-- separate row the replacement was uploaded under. storage_key's shape
-- is left exactly as unconstrained as migration 0062 already left it;
-- nothing here narrows it.
--
-- Scope boundary: this migration is schema-only. It does not implement
-- upload authorization, R2/signed URLs, asset completion, replacement
-- publication, or cleanup jobs -- those are later phases of the same
-- engineering design and are deliberately not part of this change.
--
-- Additive only, numbered after 0065. Nothing existing is altered beyond
-- adding nullable columns and new constraints/indexes/triggers. The one
-- pre-existing content_items row in dev (an ARCHIVED CONTAINER with no
-- asset fields, no parent) is unaffected: all three new columns default
-- to NULL for it, which every new constraint below treats as the valid,
-- "not a replacement, nothing obsolete pending retention" case.
-- =======================================================================

ALTER TABLE "content_items"
    ADD COLUMN "replaces_content_item_id"         TEXT,
    ADD COLUMN "previous_storage_key"              TEXT,
    ADD COLUMN "previous_storage_retention_until"  TIMESTAMP(3);

-- A replacement row points at the logical asset it would replace. RESTRICT
-- (not CASCADE) means that live asset cannot be deleted while a pending
-- replacement still references it -- the same choice this table already
-- made for parent_id.
ALTER TABLE "content_items"
    ADD CONSTRAINT "content_items_replaces_content_item_id_fkey"
        FOREIGN KEY ("replaces_content_item_id") REFERENCES "content_items"("id") ON DELETE RESTRICT;

-- A replacement pointer may only ever appear on a DRAFT asset -- never on
-- a CONTAINER (pure hierarchy node), never on a PUBLISHED or ARCHIVED row
-- (the thing being replaced is the PUBLISHED row; the replacement itself
-- starts, and stays, DRAFT until explicitly published -- at which point
-- the replacement row is consumed, not left pointing at anything).
ALTER TABLE "content_items"
    ADD CONSTRAINT "content_items_replacement_shape" CHECK (
        "replaces_content_item_id" IS NULL
        OR ("node_type" = 'ASSET' AND "status" = 'DRAFT')
    );

-- Mirrors content_items_not_self_parent: a row cannot claim to replace
-- itself.
ALTER TABLE "content_items"
    ADD CONSTRAINT "content_items_not_self_replacement"
        CHECK ("replaces_content_item_id" IS DISTINCT FROM "id");

-- Retention metadata for an obsolete physical object is meaningful only
-- as a pair: a key with no deadline, or a deadline with no key, is not a
-- state cleanup can act on safely.
ALTER TABLE "content_items"
    ADD CONSTRAINT "content_items_previous_storage_consistency" CHECK (
        ("previous_storage_key" IS NOT NULL AND "previous_storage_retention_until" IS NOT NULL)
        OR
        ("previous_storage_key" IS NULL AND "previous_storage_retention_until" IS NULL)
    );

-- At most one pending replacement per logical asset -- enforced by
-- Postgres, not application logic. A second concurrent attempt to create
-- a pending replacement for the same asset fails this index rather than
-- silently succeeding.
CREATE UNIQUE INDEX "content_items_one_pending_replacement"
    ON "content_items"("replaces_content_item_id")
    WHERE "replaces_content_item_id" IS NOT NULL;

-- Supports the future retention-cleanup job's query
-- (WHERE previous_storage_retention_until <= now()) without a full-table
-- scan. Schema-only addition -- no job is implemented by this migration.
CREATE INDEX "content_items_previous_storage_retention_until_idx"
    ON "content_items"("previous_storage_retention_until")
    WHERE "previous_storage_retention_until" IS NOT NULL;

-- A replacement must stay within the same plan as the asset it replaces
-- -- mirrors enforce_content_item_matches_parent_plan (migration 0062)
-- exactly, for the same reason: the FK alone only guarantees the
-- referenced row exists, not that it belongs to the same product.
CREATE OR REPLACE FUNCTION enforce_content_item_replacement_same_product()
RETURNS TRIGGER AS $$
DECLARE
    replaced_owning_product_id TEXT;
BEGIN
    IF NEW."replaces_content_item_id" IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT "owning_product_id" INTO replaced_owning_product_id
      FROM "content_items"
     WHERE "id" = NEW."replaces_content_item_id";

    IF replaced_owning_product_id IS NULL THEN
        RAISE EXCEPTION 'content_items: replaces_content_item_id % does not exist', NEW."replaces_content_item_id";
    END IF;

    IF replaced_owning_product_id != NEW."owning_product_id" THEN
        RAISE EXCEPTION
            'content_items: replacement owning_product_id (%) must match replaced owning_product_id (%)',
            NEW."owning_product_id", replaced_owning_product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_items_replacement_same_product
    BEFORE INSERT OR UPDATE ON "content_items"
    FOR EACH ROW
    EXECUTE FUNCTION enforce_content_item_replacement_same_product();
