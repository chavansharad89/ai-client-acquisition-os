-- 0012_user_identity
-- =======================================================================
-- Server-derived user identity, kept separate from entitlement
-- (customer_email) and payment (orders/payments). See PRD V2.1
-- "IDENTITY ≠ ENTITLEMENT ≠ PAYMENT" and DEC-002.
--
-- Additive only: one new table, one new nullable column on an existing
-- table. Nothing existing is altered, dropped, or backfilled.
-- =======================================================================


-- ---- users -------------------------------------------------------------
--
-- Canonical identity (R-01). The opaque id — never the email — is what
-- every future owned row (service_profiles, searches, ...) will
-- reference. Email is retained only for out-of-band provisioning and
-- lookup (R-02: self-service signup is FUTURE, not this table's job).

CREATE TABLE "users" (
    "id"         TEXT NOT NULL,
    "email"      TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    -- Same invariant as entitlements/access_tokens: one address, one row.
    CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"))
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");


-- ---- access_tokens.user_id ----------------------------------------------
--
-- The existing token table now serves two purposes, distinguished by
-- this column (PRD V2.1 "ACCESS TOKEN RULE"):
--
--   user_id IS NULL      entitlement credential (legacy, unchanged)
--   user_id IS NOT NULL  authenticated Client Finder session
--
-- Nullable, no default, no backfill: every row that exists today was
-- issued before identity existed, and assigning one now would fabricate
-- an owner that was never established. requireUser() is what turns this
-- column into an enforced rule, not this migration.

ALTER TABLE "access_tokens" ADD COLUMN "user_id" TEXT;

ALTER TABLE "access_tokens" ADD CONSTRAINT "access_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "access_tokens_user_id_idx" ON "access_tokens"("user_id");
