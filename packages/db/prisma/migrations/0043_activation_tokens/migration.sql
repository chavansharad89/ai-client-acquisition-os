-- 0043_activation_tokens
-- =======================================================================
-- AUTH Phase 2 — secure ₹1,499 Client Finder activation, per
-- requirement/AUTH_PHASE_1_PURCHASE_IDENTITY_ACTIVATION_DESIGN.md §10.
--
-- Two additive changes, no backfill, nothing existing altered:
--
--   1. users gains email_verified_at (set exactly once, by activation
--      consumption only) and first_name/last_name/phone/date_of_birth
--      (written only by account setup, never fabricated). All nullable.
--   2. activation_tokens — a dedicated, single-use, 24h-lived proof that
--      a specific user_id's purchase may be activated. Bound to user_id,
--      NOT order_id: deliberately a new table rather than a
--      generalization of claim_tokens (design §5 "Key Design Question"),
--      because claim_tokens.order_id is NOT NULL/RESTRICT and activation
--      eligibility has nothing to do with an order row — it is "does
--      this user_id currently hold an active grant", read from
--      subscription_periods via the Phase 0 shared gate.
-- =======================================================================


-- ---- users: email verification + account-setup fields --------------------

ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "first_name" TEXT;
ALTER TABLE "users" ADD COLUMN "last_name" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "date_of_birth" DATE;


-- ---- activation_tokens -----------------------------------------------------
--
-- Only the SHA-256 of the token is stored (same rationale as
-- claim_tokens/access_tokens: a database leak discloses nothing usable).
-- `consumed_at IS NULL` is the atomic single-use gate. `invalidated_at`
-- is the latest-token-wins gate, keyed by user_id (not order_id, unlike
-- claim_tokens) — set on every new mint for the same user_id, inside the
-- same call that inserts the new row (mirrors claim_tokens' invalidate-
-- previous idiom, core-entitlements/src/pgRepository.ts saveClaimToken).

CREATE TABLE "activation_tokens" (
    "id"               TEXT NOT NULL,
    "token_hash"       TEXT NOT NULL,
    "user_id"          TEXT NOT NULL,

    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"       TIMESTAMP(3) NOT NULL,
    "consumed_at"      TIMESTAMP(3),
    "invalidated_at"   TIMESTAMP(3),

    CONSTRAINT "activation_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "activation_tokens_expiry_after_creation" CHECK ("expires_at" > "created_at")
);

CREATE UNIQUE INDEX "activation_tokens_token_hash_key" ON "activation_tokens"("token_hash");
CREATE INDEX "activation_tokens_user_id_idx" ON "activation_tokens"("user_id");

-- ON DELETE CASCADE (not claim_tokens' RESTRICT): a deleted user's
-- pending activation has nothing left to protect, mirroring
-- subscription_periods' FK shape rather than claim_tokens'.
ALTER TABLE "activation_tokens" ADD CONSTRAINT "activation_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
