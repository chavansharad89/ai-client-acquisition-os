-- 0064_retire_legacy_plus_pro_entitlements
-- =======================================================================
-- Plus/Pro/Max CMS, development-environment cleanup authorized by the
-- Product Owner's "FINAL PRODUCT RULE: the old non-expiring Plus/Pro
-- entitlement model is retired." This is NOT yet applied to
-- acos_postgres_dev -- created for review only, per that authorization.
--
-- Deliberately a SEPARATE migration from `0063_plus_pro_entitlement_
-- 30day_backfill` rather than a rewrite of it (migration strategy
-- Option B, chosen over rewriting 0063):
--   - 0063 already does one correct, independently useful, already-
--     tested thing (convert existing entitlements into subscription_
--     periods) and has never been applied to any persistent database
--     (only to disposable, per-test-run ephemeral Postgres instances
--     dropped seconds later -- docker-compose.test.yml's own header:
--     "do NOT reuse this instance" -- so there is no migration-history
--     to rewrite either way).
--   - Deletion is a strictly MORE dangerous operation than insertion and
--     deserves its own migration, reviewed on its own, rather than being
--     folded into the one that already passed review.
--   - Running this AFTER 0063 in the chain guarantees conversion always
--     happens before any deletion -- a row can only be deleted here if a
--     corresponding subscription_periods row already exists (see the
--     EXISTS clause below), so this can never run ahead of its own
--     precondition.
--
-- WHAT THIS DELETES, EXACTLY:
--   Only `entitlements` rows where:
--     - `product_slug IN ('ai_income_99', 'ai_freelancing_499')` -- Plus
--       and Pro only. The retired one-time `ai_client_acquisition_1499`
--       SKU and Max (which has never had entitlements rows at all -- it
--       is subscription_periods-only) are untouched by this filter.
--     - `user_id IS NOT NULL` -- CLAIMED only. An UNCLAIMED entitlement
--       (a real purchase whose buyer has not yet clicked their claim
--       link) is never deleted here: `linkEntitlementsToUser` (the
--       claim/signup flow, apps/web/app/api/auth/signup/route.ts) works
--       by UPDATING an existing entitlements row matching the buyer's
--       email -- deleting it would permanently destroy that buyer's
--       ability to ever claim a purchase they already paid for, with no
--       recovery path. This is a correctness requirement, not a
--       preference: see the repository's own claim_tokens FK (migration
--       0038), which targets `orders`, not `entitlements` -- confirming
--       the entitlement row itself (not just the order) is load-bearing
--       for an unclaimed purchase.
--     - a matching `subscription_periods` row already exists for the
--       same `(user_id, product_slug)` -- i.e., ONLY a row that has
--       already been converted (by 0063's historical backfill, or by
--       the live per-signup conversion in
--       @acos/core-subscriptions/cmsEntitlementConversion.ts) is
--       eligible for deletion. A claimed entitlement that, for any
--       reason, was never successfully converted is left alone rather
--       than silently losing its only remaining access signal.
--
-- WHAT THIS PRESERVES, EXPLICITLY:
--   - `orders` and `payments` -- not referenced by this migration at
--     all. No row in either table is touched.
--   - Unclaimed Plus/Pro entitlements (see above).
--   - Revoked Plus/Pro entitlements (`revoked_at IS NOT NULL`) -- these
--     were never converted by 0063/the live path either (both exclude
--     revoked rows), so the EXISTS clause below never matches them; they
--     are left as historical refund/revocation evidence, not touched.
--   - Every Max `subscription_periods` row, every unrelated entitlement
--     (any other product_slug), every `users`/`claim_tokens` row.
--   - The `entitlements` table and the entitlement MECHANISM itself --
--     this migration deletes rows, not the table, not the trigger
--     infrastructure (`entitlements_require_capture`,
--     `entitlements_match_order`, migration 0004), and not the ability
--     for a FUTURE purchase to create a new, temporary, pre-claim
--     entitlement row exactly as it does today.
--
-- Idempotent and safe to rerun by construction: a second run finds zero
-- matching rows (already deleted) and deletes nothing, raising no error.
--
-- Additive-in-effect, numbered after 0063. No existing migration file is
-- modified.
-- =======================================================================

CREATE OR REPLACE FUNCTION retire_legacy_plus_pro_entitlements()
RETURNS TABLE (deleted_count BIGINT) AS $$
DECLARE
    rows_deleted BIGINT;
BEGIN
    WITH removed AS (
        DELETE FROM "entitlements" e
         WHERE e."product_slug" IN ('ai_income_99', 'ai_freelancing_499')
           AND e."user_id" IS NOT NULL
           AND EXISTS (
               SELECT 1 FROM "subscription_periods" sp
                WHERE sp."user_id" = e."user_id"
                  AND sp."product_slug" = e."product_slug"
           )
        RETURNING 1
    )
    SELECT count(*) INTO rows_deleted FROM removed;

    RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- NOT executed against acos_postgres_dev by this review/preparation
-- task. This SELECT runs only when this migration file is actually
-- applied (e.g. against the ephemeral test database via `prisma migrate
-- deploy` in tests/CI) -- the Product Owner authorized creating this
-- migration for review, not applying it to the development database.
SELECT retire_legacy_plus_pro_entitlements();
