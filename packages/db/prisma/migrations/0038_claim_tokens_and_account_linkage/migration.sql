-- 0038_claim_tokens_and_account_linkage
-- =======================================================================
-- Supports DEC-010/DEC-011: a buyer claims their ₹99 (or any kit's)
-- entitlement into a username/password account, without email delivery
-- and without ever trusting a client-supplied email.
--
-- Three additive changes, no backfill, nothing existing altered:
--
--   1. users.password_hash — nullable. Existing out-of-band-provisioned
--      rows have none; only self-service signup (this flow) sets it.
--   2. entitlements.user_id — nullable FK to users, same additive shape
--      as access_tokens.user_id (migration 0012). This is the
--      authorization gate going forward: "does this authenticated user
--      own this product", not "does users.email equal
--      entitlements.customer_email".
--   3. claim_tokens — a dedicated, single-use, short-lived proof that a
--      specific order's entitlement may be claimed. Deliberately NOT a
--      third purpose bolted onto access_tokens: a claim is minutes-lived
--      and single-use, access_tokens' shared 30-day TTL and reusable
--      session/entitlement-credential semantics don't fit it.
-- =======================================================================


-- ---- users.password_hash ------------------------------------------------

ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;


-- ---- entitlements.user_id ------------------------------------------------
--
-- Nullable, no default, no backfill: every entitlement that exists today
-- was granted before any account existed to claim it. Authorization reads
-- (core-entitlements) move to this column once a claim links it; until
-- then, access remains exactly as before (legacy email-token path).

ALTER TABLE "entitlements" ADD COLUMN "user_id" TEXT;

ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "entitlements_user_id_idx" ON "entitlements"("user_id");


-- ---- claim_tokens ---------------------------------------------------------
--
-- One row per claim attempt. Only the SHA-256 of the token is stored,
-- same rationale as access_tokens: a database leak discloses nothing
-- usable. `claimed_at IS NULL` is the single-use gate — consuming a
-- token is an atomic UPDATE ... WHERE claimed_at IS NULL, so two
-- concurrent consume attempts (two tabs, a retried request) can only
-- ever have one winner.
--
-- customer_email is copied from the order/entitlement at MINT time, not
-- read from the client at CONSUME time — that is what makes the eventual
-- account-creation email server-derived rather than client-supplied
-- (DEC-011 item 7).

CREATE TABLE "claim_tokens" (
    "id"             TEXT NOT NULL,
    "token_hash"     TEXT NOT NULL,
    "order_id"       TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,

    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"     TIMESTAMP(3) NOT NULL,
    "claimed_at"     TIMESTAMP(3),

    CONSTRAINT "claim_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "claim_tokens_email_lowercase" CHECK ("customer_email" = lower("customer_email")),
    CONSTRAINT "claim_tokens_expiry_after_creation" CHECK ("expires_at" > "created_at")
);

CREATE UNIQUE INDEX "claim_tokens_token_hash_key" ON "claim_tokens"("token_hash");
CREATE INDEX "claim_tokens_order_id_idx" ON "claim_tokens"("order_id");
CREATE INDEX "claim_tokens_expires_at_idx" ON "claim_tokens"("expires_at");

ALTER TABLE "claim_tokens" ADD CONSTRAINT "claim_tokens_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
