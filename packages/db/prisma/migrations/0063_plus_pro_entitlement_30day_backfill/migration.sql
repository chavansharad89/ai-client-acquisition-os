-- 0063_plus_pro_entitlement_30day_backfill
-- =======================================================================
-- Plus/Pro/Max CMS, Phase 1 (PO-5 of
-- requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md §9), updated by the
-- Product Owner's "FINAL PO CLARIFICATION -- EXISTING PLUS/PRO
-- ENTITLEMENTS": this is a development environment; existing Plus/Pro
-- `entitlements` rows are NOT grandfathered as perpetual. They are
-- converted to the same 30-day `subscription_periods` model Max already
-- uses. After expiry, access is denied -- no second, CMS-specific expiry
-- mechanism is introduced (PO-5's explicit instruction).
--
-- WHAT THIS MIGRATION DOES, EXACTLY:
--   1. Defines `backfill_cms_30day_subscription_periods()`, a reusable,
--      idempotent SQL function (not only a one-shot migration step) --
--      so a future re-seed of `entitlements` in this development
--      environment can be converted again by calling it directly,
--      without writing a new migration each time. This is also what the
--      Phase 1 test suite calls directly to exercise the conversion
--      logic against fixture rows (see
--      packages/core-subscriptions/src/*.test.ts).
--   2. Calls that function once, now, to convert whatever `ai_income_99`/
--      `ai_freelancing_499` entitlement rows already exist in the target
--      database at migration time.
--
-- CONVERSION RULE (explicit, so it can be reviewed/corrected):
--   - Only `product_slug IN ('ai_income_99', 'ai_freelancing_499')` --
--     Plus and Pro. The retired one-time `ai_client_acquisition_1499`
--     SKU and the Max subscription (`ai_client_acquisition_1499_
--     subscription`, which already uses `subscription_periods` and is
--     therefore already compliant with PO-5) are both untouched.
--   - Only `revoked_at IS NULL` -- a revoked entitlement does not come
--     back to life as an active subscription period.
--   - Only `user_id IS NOT NULL` -- an entitlement never claimed into an
--     account cannot be converted to a user-keyed subscription_periods
--     row (that row's `user_id` is NOT NULL with a FK to `users`, per
--     migration 0040). Such rows are left exactly as they are; they
--     already grant no CMS-content access today and still grant none
--     after this migration -- this is not a new gap introduced here.
--   - Only entitlements with a matching `CAPTURED` payment (the same
--     payment-integrity rule `entitlements_require_capture`, migration
--     0004, already enforces for the row's own existence) -- the
--     resulting `subscription_periods.razorpay_payment_id` is that same
--     real, already-captured payment id, reused as the idempotency
--     anchor migration 0040 already requires it to be unique on. No
--     fabricated Razorpay payment id is invented.
--   - `razorpay_subscription_id` has no real counterpart for a one-time
--     purchase (there was never a Razorpay *subscription* here) -- this
--     migration writes the deterministic, clearly-synthetic, traceable
--     placeholder `'legacy-onetime:' || entitlements.id`, never a value
--     shaped like a genuine Razorpay id, so a converted row can always
--     be told apart from a real recurring-subscription-backed one.
--   - `activation_at` is set to the entitlement's own `granted_at` (the
--     original purchase time), NOT the migration's run time. This is a
--     deliberate, explicit choice: it means an entitlement already older
--     than 30 days converts directly into an EXPIRED subscription_periods
--     row, which is the intended effect of "do not grandfather" -- a
--     customer whose purchase would already be stale under the new rule
--     is not given a fresh 30-day window merely by running this
--     migration. `duration_days = 30` per the Product Owner's
--     clarification.
--   - Idempotent: `ON CONFLICT ("razorpay_payment_id") DO NOTHING`, using
--     the same unique index migration 0040 already defines -- calling
--     this function twice (or running it against a database where some
--     rows were already converted) inserts no duplicates and raises no
--     error.
--
-- WHAT THIS MIGRATION DOES NOT DO:
--   - It does not delete, revoke, or modify any `entitlements` row --
--     the historical purchase/access record is preserved exactly as it
--     was (the Product Owner's explicit instruction: "do NOT
--     unnecessarily delete historical purchase/payment records").
--   - It does not touch `orders` or `payments` at all.
--   - It does not alter any existing `subscription_periods` row
--     (including any pre-existing Max row) -- it only ever INSERTs new
--     rows for Plus/Pro.
--
-- Additive only, numbered after 0062. Nothing existing is altered.
-- =======================================================================

CREATE OR REPLACE FUNCTION backfill_cms_30day_subscription_periods()
RETURNS TABLE (inserted_count BIGINT) AS $$
DECLARE
    rows_inserted BIGINT;
BEGIN
    WITH converted AS (
        INSERT INTO "subscription_periods" (
            "id",
            "user_id",
            "product_slug",
            "razorpay_subscription_id",
            "razorpay_payment_id",
            "activation_at",
            "duration_days",
            "created_at",
            "updated_at"
        )
        SELECT
            gen_random_uuid()::text,
            e."user_id",
            e."product_slug",
            'legacy-onetime:' || e."id",
            p."razorpay_payment_id",
            e."granted_at",
            30,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM "entitlements" e
        JOIN "payments" p
          ON p."order_id" = e."order_id"
         AND p."status" = 'CAPTURED'
        WHERE e."product_slug" IN ('ai_income_99', 'ai_freelancing_499')
          AND e."revoked_at" IS NULL
          AND e."user_id" IS NOT NULL
        ON CONFLICT ("razorpay_payment_id") DO NOTHING
        RETURNING 1
    )
    SELECT count(*) INTO rows_inserted FROM converted;

    RETURN QUERY SELECT rows_inserted;
END;
$$ LANGUAGE plpgsql;

-- Run it once now, against whatever entitlements already exist in this
-- database at migration time.
SELECT backfill_cms_30day_subscription_periods();
