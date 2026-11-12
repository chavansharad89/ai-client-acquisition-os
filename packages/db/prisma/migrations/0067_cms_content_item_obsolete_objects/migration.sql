-- 0067_cms_content_item_obsolete_objects
-- =======================================================================
-- CMS-PO-010(R2) -- dedicated physical-object retention bookkeeping.
--
-- Migration 0066 gave each content_items row exactly ONE retention slot
-- (previous_storage_key / previous_storage_retention_until). That was an
-- implementation simplification, never a Product Owner decision -- the
-- governance record (CMS-PO-010(R2)-F/G, Secondary Decisions 7-9) says
-- an obsolete physical object is retained for 30 days and that cleanup
-- must verify it is unreferenced before deletion; it never says only one
-- obsolete object may exist per asset at a time. A single slot cannot
-- represent a second replacement published while an earlier replacement's
-- object is still inside its own 30-day window -- the Phase 2 code
-- worked around this by refusing that second publish outright, a
-- product-visible throttle no PO decision ever authorized. This table
-- removes the need for that workaround by letting a logical asset have
-- zero, one, or many obsolete physical objects awaiting retention
-- cleanup, each with its own independent deadline.
--
-- This table answers exactly one question, for exactly one purpose:
-- "which physical object is obsolete, for which logical asset, and when
-- may it be deleted?" It deliberately carries no title, description,
-- version number, human-readable version label, restore information, or
-- change reason -- any of those would make this a CMS version-history
-- table, which CMS-PO-010(R2)-F explicitly says is NOT required. Rows
-- here are never customer-visible or admin-visible as "content" -- no
-- planned route lists or exposes this table; it exists solely for a
-- future cleanup job to query.
--
-- Unlike content_items (which never hard-deletes -- archive, not delete,
-- preserves real customer/admin-facing history), a row in THIS table is
-- consumed by design: once its physical object is actually deleted, the
-- row has served its only purpose and is deleted too (by the future
-- cleanup job, not by this migration). There is no history to preserve
-- here -- the "never hard-delete" convention protects meaningful
-- business records, not a pure to-do bookkeeping row whose job is done.
--
-- UNIQUE(storage_key): every storage key this system ever generates is
-- unique by construction (buildAssetStorageKey always embeds a fresh,
-- never-reused upload-session/content-item id -- see assetValidation.ts
-- and CMS-PO-010(R2) Secondary Decision 3), so no legitimate replacement
-- cycle can ever produce the same key twice, whether across different
-- logical assets or across successive replacements of the same one. A
-- duplicate here could only mean an application bug (e.g. a retried
-- publish transaction re-inserting the same obsolete key). The
-- constraint turns that into a loud, caught failure instead of a silent
-- duplicate bookkeeping row -- the same "let Postgres be the final
-- backstop" convention 0062/0066 already follow. Verified empirically
-- against acos_dev before writing this migration: zero existing
-- content_items.storage_key values collide with each other, and zero
-- existing rows have previous_storage_key/previous_storage_retention_until
-- populated (so no backfill into this new table is needed or performed).
--
-- FK content_item_id -> content_items(id) ON DELETE RESTRICT mirrors
-- this schema's existing convention (content_items.parent_id,
-- content_items.replaces_content_item_id both use RESTRICT): a logical
-- asset cannot be deleted out from under pending retention bookkeeping
-- that still names it. (In practice content_items rows are never
-- hard-deleted at all, per the existing archive-not-delete convention --
-- this FK is defense-in-depth, consistent with how the existing FKs on
-- that table are reasoned about.)
--
-- The additional content_items_storage_key_idx (on the EXISTING
-- content_items table) supports the future cleanup job's second step --
-- "verify the storage_key is NOT currently referenced by any live/current
-- CMS asset" -- efficiently. It does not touch migration 0062 or 0066's
-- files; it is a new, additive index added by this migration, the same
-- way 0066 added new indexes onto the table 0062 created without
-- modifying 0062 itself.
--
-- SCOPE: schema only. No application code, API route, worker, or R2
-- integration is added or changed by this migration. Migration 0066 is
-- NOT modified -- its previous_storage_key / previous_storage_retention_until
-- columns are left in place, unused-but-retained, per the accompanying
-- engineering review (do not maintain two sources of truth by writing to
-- both; do not remove them yet without a compelling reason -- there is
-- none at this stage, since application code has not yet been updated to
-- stop depending on them).
--
-- Additive only, numbered after 0066. Nothing existing is altered beyond
-- one new index on content_items; no row in content_items,
-- subscription_periods, orders, payments, entitlements, cms_admins, or
-- plan_display_names is touched, and this table has no relationship to
-- any of those -- the same deliberate separation CMS-PO-010(R2)'s own
-- governance record draws between CMS availability/retention and
-- customer entitlement.
-- =======================================================================

CREATE TABLE "content_item_obsolete_objects" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "content_item_id"  TEXT NOT NULL,
    "storage_key"      TEXT NOT NULL,
    "retention_until"  TIMESTAMP(3) NOT NULL,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_item_obsolete_objects_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "content_item_obsolete_objects_content_item_id_fkey"
        FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE RESTRICT,

    CONSTRAINT "content_item_obsolete_objects_storage_key_key" UNIQUE ("storage_key")
);

-- Lookup "all obsolete objects for logical asset X" -- not auto-created
-- by the FK above (Postgres does not index the referencing column).
CREATE INDEX "content_item_obsolete_objects_content_item_id_idx"
    ON "content_item_obsolete_objects"("content_item_id");

-- The future cleanup job's primary query: WHERE retention_until <= now().
-- Not partial -- unlike 0066's sparse previous_storage_retention_until,
-- every row in this table always carries a meaningful retention_until.
CREATE INDEX "content_item_obsolete_objects_retention_until_idx"
    ON "content_item_obsolete_objects"("retention_until");

-- Supports the future cleanup job's "is this key still referenced by any
-- current CMS asset" check. Partial: CONTAINER rows always have a NULL
-- storage_key (content_items_node_shape, migration 0062) and would add
-- nothing but dead weight to this index.
CREATE INDEX "content_items_storage_key_idx"
    ON "content_items"("storage_key")
    WHERE "storage_key" IS NOT NULL;
