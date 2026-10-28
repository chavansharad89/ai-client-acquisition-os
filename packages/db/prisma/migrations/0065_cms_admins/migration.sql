-- 0065_cms_admins
-- =======================================================================
-- CMS administrator representation (CMS-PO-006(R3) of
-- requirement/CMS_PO_006_ADMINISTRATOR_AUTHORIZATION_PO_DECISION.md).
--
-- DRAFT -- NOT YET APPLIED. Prepared for review per the same convention
-- migrations 0061-0064 followed: a complete, reviewable .sql file
-- authored first, applied via `prisma migrate deploy` only in a
-- separate, explicitly authorized step.
--
-- Membership-based, presence-only administrator model: a user is a CMS
-- administrator if and only if a row for their `user_id` exists here --
-- there is no boolean/role column on `users` to default incorrectly,
-- and no column at all added to `users`. This table has no
-- relationship to `entitlements`, `subscription_periods`, `orders`, or
-- `payments` -- nothing a customer purchases or subscribes to can ever
-- insert a row here. Provisioning is operator-only (direct database
-- action), never a self-service or customer-facing code path; this
-- migration itself inserts no rows.
--
-- `user_id` is the PRIMARY KEY, not a separate UNIQUE column with its
-- own surrogate id -- the same "the natural key is the primary key, no
-- extra id column" shape as `plan_display_names.product_id` (migration
-- 0061). This is what directly enforces "a user can have at most one
-- CMS-admin membership": a second INSERT for the same user_id violates
-- the primary key, it cannot silently succeed.
--
-- FOREIGN KEY ... ON DELETE CASCADE ON UPDATE CASCADE mirrors
-- `subscription_periods.user_id`'s exact FK shape (migration 0040): if
-- a user row is ever deleted, their admin membership is removed with
-- it rather than left orphaned; there is no `users.id` update path in
-- this codebase today, but ON UPDATE CASCADE is kept for the same
-- reason the existing FK has it -- consistency with that precedent.
--
-- `created_by` is free-text, nullable, and NEVER populated from a
-- client-controlled/HTTP request value -- same shape and same
-- constraint-free convention as `plan_display_names.updated_by`
-- (migration 0061). It exists only so a trusted operator's own
-- provisioning action can record who granted a given membership, for
-- audit; it is not a foreign key and not validated against any
-- "operators" table (none exists).
--
-- Revocation is row deletion, not a status flag: removing a user's row
-- from this table immediately and completely revokes CMS admin
-- authorization (CMS-PO-006(R3) §7 of the governance record) -- there
-- is deliberately no `revoked_at`/ARCHIVED-style soft-delete here,
-- unlike `content_items`/`entitlements`. Administrator membership is
-- not customer-facing content or a purchase record; nothing in this
-- repository's "preserve history, never hard-delete" convention applies
-- to it.
--
-- Additive only, numbered after 0064. Nothing existing is altered.
-- =======================================================================

CREATE TABLE "cms_admins" (
    "user_id"    TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "cms_admins_pkey" PRIMARY KEY ("user_id"),

    CONSTRAINT "cms_admins_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
