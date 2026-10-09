-- 0040_subscription_periods
-- =======================================================================
-- ₹1,499 Client Finder subscription (distinct SKU
-- `ai_client_acquisition_1499_subscription`, never the existing one-time
-- `ai_client_acquisition_1499`), authorized under
-- CLIENT-FINDER-1499-SUBSCRIPTION-ACCESS-MODEL-PO-DEC-002 and
-- requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md
-- (Revision 5) §E.1.
--
-- Pure time-bounded access, no credit/balance dimension: a row records
-- one activated period (one captured Razorpay recurring charge), never a
-- balance to debit. Append-only -- a row is never updated except once,
-- to set refunded_at (same timestamp-not-delete idiom as
-- entitlements.revoked_at). `razorpay_payment_id` is UNIQUE: it is the
-- idempotency anchor for period creation on `subscription.charged`
-- (IRL-A/IRL-C) -- the first charge for a subscription activates it, and
-- every later charge on the SAME razorpay_subscription_id creates its
-- own independent, new period row, never mutates a prior one.
--
-- `duration_days` is snapshotted at creation (PO-D10/IRL-P) so a later
-- configuration change never retroactively alters a period already
-- granted. No `expiry_at` column: expiry is computed
-- (`activation_at + duration_days` days) at read time, not stored,
-- consistent with IRL-O ("the product's own computed
-- activation_at + duration_days and refunded_at are the sole access
-- authority; Razorpay's own status field is read only for
-- display/reconciliation").
--
-- Additive only, numbered after 0039. Nothing existing is altered.
-- =======================================================================

CREATE TABLE "subscription_periods" (
    "id"                        TEXT NOT NULL,
    "user_id"                   TEXT NOT NULL,
    "product_slug"              TEXT NOT NULL,
    "razorpay_subscription_id"  TEXT NOT NULL,
    "razorpay_payment_id"       TEXT NOT NULL,
    "activation_at"             TIMESTAMP(3) NOT NULL,
    "duration_days"             INTEGER NOT NULL,
    "refunded_at"               TIMESTAMP(3),

    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_periods_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscription_periods_duration_days_positive"
        CHECK ("duration_days" > 0)
);

-- The idempotency anchor (IRL-A/IRL-C): one period per captured charge.
CREATE UNIQUE INDEX "subscription_periods_razorpay_payment_id_key"
    ON "subscription_periods"("razorpay_payment_id");

-- "Does this user have an active period for this product" is the access
-- gate's hot path (requireClientFinderAccess) -- this is the index it runs on.
CREATE INDEX "subscription_periods_user_id_product_slug_idx"
    ON "subscription_periods"("user_id", "product_slug");

-- Groups every period (initial + renewals) under one Razorpay recurring
-- mandate -- used by refund handling (a refund.* webhook's payment_id
-- resolves to one period directly via the unique index above; this index
-- supports provider-side reconciliation across a subscription's whole history).
CREATE INDEX "subscription_periods_razorpay_subscription_id_idx"
    ON "subscription_periods"("razorpay_subscription_id");

ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
