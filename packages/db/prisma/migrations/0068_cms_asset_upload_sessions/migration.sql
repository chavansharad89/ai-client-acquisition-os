-- 0068_cms_asset_upload_sessions
-- =======================================================================
-- CMS-PO-010(R2)-G -- upload-session bookkeeping for abandoned-upload
-- cleanup.
--
-- Closes the persistence gap identified during the CMS-PO-010(R2)
-- cleanup phase: requestAssetUploadAuthorization()
-- (assetIngestionService.ts) generates a server-controlled
-- uploadSessionId/storageKey and asks R2 to authorize a direct upload,
-- but previously persisted neither value anywhere once its HTTP
-- response was sent. Without a record of "this key was authorized at
-- this time," there was no safe way to later distinguish an abandoned
-- upload (authorized, perhaps even uploaded to R2, but never completed
-- into a content_items row) from one still legitimately in progress --
-- this table is exactly that record.
--
-- The 24-hour abandoned-upload cleanup policy is already approved
-- (CMS-PO-010(R2)); this migration is the engineering/schema
-- implementation of that existing policy, not a new product decision.
-- No CMS-PO-010(R2) product behavior changes.
--
-- A row here represents "an upload that was authorized and has not yet
-- been successfully completed." Its own existence IS the "pending"
-- state -- there is deliberately no status column, mirroring
-- content_item_obsolete_objects' own "pure bookkeeping, consumed by
-- design" shape (migration 0067): requestAssetUploadAuthorization()
-- creates the row, completeAssetUpload() deletes it on success, and the
-- abandoned-upload cleanup job (apps/worker's cmsCleanup module) deletes
-- it once its physical object is gone (or was never there) and enough
-- time has passed.
--
-- Deliberately minimal, mirroring content_item_obsolete_objects'
-- discipline against scope creep: no title, description, content_type,
-- extension, version, or any other customer/admin-facing metadata.
-- `storage_key` already encodes the owning product and extension
-- (buildAssetStorageKey, assetValidation.ts); `owning_product_id` is
-- stored again anyway, in plain TEXT (matching content_items.owning_
-- product_id's own un-keyed TEXT column -- ProductId is an
-- application-level catalog, not a DB table, so no FK target exists for
-- it), purely so a direct, indexed-by-age query never needs to parse
-- storage_key's string shape to recover it for logging/audit.
--
-- `id` has NO default: it is always supplied by the application
-- (randomUUID(), assetIngestionService.ts), because the EXACT same value
-- is embedded into `storage_key` via buildAssetStorageKey() before this
-- row is ever inserted -- a DB-generated id here would not match what
-- the storage key already names.
--
-- NO FK to content_items: this table exists precisely BECAUSE no
-- content_items row exists yet for an unconfirmed upload, and even once
-- completeAssetUpload() succeeds, the resulting content_items.id is a
-- freshly DB-generated id (content_items' own DEFAULT -- see migration
-- 0062 / contentItemRepository.ts's create()), never the upload
-- session's own id. `storage_key` is the only value an upload session
-- and its eventual content_items row ever share -- exactly why
-- completion and cleanup both consume a session by storage_key, never
-- by id correlation.
--
-- UNIQUE(storage_key): every storage key this system generates is
-- unique by construction (buildAssetStorageKey always embeds a fresh
-- upload-session id -- assetValidation.ts), so a legitimate flow can
-- never produce two upload-session rows for the same key. Mirrors
-- content_item_obsolete_objects_storage_key_key's identical rationale
-- (migration 0067): a duplicate here can only mean an application bug,
-- and the constraint turns that into a loud, caught failure.
--
-- content_items_storage_key_idx (migration 0067, on content_items, not
-- touched here) already supports this table's own mandatory safety
-- check ("is this storage_key currently referenced by a live
-- content_items row") efficiently -- not recreated here.
--
-- SCOPE: schema only. No application code, API route, worker, or R2
-- integration is added or changed by this migration. Migrations 0066
-- and 0067 are NOT modified. Additive only, numbered after 0067. No row
-- in any other existing table is touched.
-- =======================================================================

CREATE TABLE "cms_asset_upload_sessions" (
    "id"                 TEXT NOT NULL,
    "storage_key"        TEXT NOT NULL,
    "owning_product_id"  TEXT NOT NULL,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_asset_upload_sessions_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "cms_asset_upload_sessions_storage_key_key" UNIQUE ("storage_key")
);

-- The abandoned-upload cleanup job's primary query:
-- WHERE created_at <= now() - interval '24 hours'.
CREATE INDEX "cms_asset_upload_sessions_created_at_idx"
    ON "cms_asset_upload_sessions"("created_at");
