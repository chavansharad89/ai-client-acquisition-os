-- 0061_plan_display_names
-- =======================================================================
-- Plus/Pro/Max CMS, Phase 1 (PO-1 of
-- requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md §5, authorized by
-- the Product Owner's "FINAL PO CLARIFICATION" round).
--
-- CMS-configurable plan display name, kept strictly separate from
-- product/SKU identity:
--   - `product_id` is NOT a new identity. It is a plain TEXT foreign key
--     onto the existing, immutable `ProductId` domain already defined in
--     @acos/catalog (packages/catalog/src/types.ts). No new product
--     table is created and no existing product id is renamed.
--   - This table is an OVERRIDE layer only. An absent row means "use the
--     hardcoded default name in PRODUCT_CATALOG" (resolved in
--     application code, not here) -- so an empty table changes nothing
--     about current behavior.
--   - Changing a row here must never touch `orders`, `payments`,
--     `entitlements`, or `subscription_periods` -- none of those tables
--     are referenced by this migration.
--
-- There is deliberately no CHECK constraint enumerating valid product
-- ids: `ProductId` is a TypeScript-level closed union, not a Postgres
-- enum anywhere in this schema (consistent with how `entitlements.
-- product_slug` and `subscription_periods.product_slug` are also plain
-- TEXT, validated at the application boundary via
-- @acos/catalog's `isValidProductId`/`resolveProduct`, not by the
-- database). Application code is responsible for only ever writing a
-- known ProductId here.
--
-- Additive only, numbered after 0060. Nothing existing is altered.
-- =======================================================================

CREATE TABLE "plan_display_names" (
    "product_id"   TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by"   TEXT,

    CONSTRAINT "plan_display_names_pkey" PRIMARY KEY ("product_id"),
    CONSTRAINT "plan_display_names_display_name_not_blank"
        CHECK (length(trim("display_name")) > 0)
);
