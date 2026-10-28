// Plus/Pro live-purchase 30-day conversion (PO-5's "FINAL PRODUCT RULE":
// there must NOT be a non-expiring purchase path for Plus or Pro).
// -----------------------------------------------------------------------
// WHY THIS DOES NOT LIVE IN webhookHandler.ts's `subscription.charged`
// BRANCH (the line-384 hardcoded product slug the Phase 1 report
// flagged): that branch is reached only for a real Razorpay
// *Subscription* object, which Plus/Pro purchases never create -- Plus/
// Pro checkout (@acos/core-payments' createOrder.ts) is a one-time
// Razorpay *Order*, handled by webhookHandler.ts's `payment.captured`
// fallthrough, which calls `grantEntitlement` (customerEmail-keyed, no
// userId). `subscription_periods.user_id` is NOT NULL with an FK to
// `users` (migration 0040) -- there is no userId to write at
// payment.captured time, because Plus/Pro checkout is deliberately
// anonymous (DEC-010 A2: the account is created AFTER purchase, via the
// emailed claim link). Generalizing line 384 would therefore do nothing
// for Plus/Pro: that branch is simply never reached for them.
//
// The first (and only) point a Plus/Pro entitlement acquires a `userId`
// today is `EntitlementsRepository.linkEntitlementsToUser`, called from
// apps/web/app/api/auth/signup/route.ts right after a claim token is
// consumed -- both for a brand-new account and for an existing one. This
// module is the live, per-signup counterpart to migration 0063's
// one-time historical backfill: same conversion rule (30-day period,
// `activation_at` = the entitlement's own `granted_at` -- the clock
// starts at purchase, matching the approved flow
// "payment captured -> 30-day subscription period" -- not at whatever
// later moment the buyer gets around to setting a password), same
// idempotency anchor (`subscription_periods.razorpay_payment_id`
// UNIQUE, migration 0040, `ON CONFLICT ... DO NOTHING`), scoped to the
// same two product slugs. It is intentionally a SEPARATE query (not a
// call into the migration's stored function) because this one is scoped
// to a single just-linked user via `user_id = $1` rather than
// rescanning the whole `entitlements` table on every signup.
//
// `razorpay_subscription_id` is synthesized as `'onetime-order:' ||
// entitlements.id` -- deliberately a DIFFERENT, equally-clearly-synthetic
// prefix from migration 0063's `'legacy-onetime:'`, so a
// `subscription_periods` row's origin (one-time historical backfill vs.
// this live per-signup conversion) stays forensically distinguishable.
//
// `entitlements` rows are NOT removed or stopped from being created at
// payment.captured time -- they remain the mechanism that carries a
// purchase through to the claim-link email (DEC-014) and through
// account linking itself. What changes is that `entitlements` is no
// longer the CANONICAL ACCESS mechanism for Plus/Pro: CMS access
// (@acos/core-subscriptions' cmsAccess.ts, same Phase 1 change set)
// reads only `subscription_periods`, never `entitlements`, for any of
// the three CMS plans.
// -----------------------------------------------------------------------

export interface CmsEntitlementConversionSqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

/**
 * Converts the CMS-eligible (Plus/Pro) entitlements already linked to
 * `userId` into 30-day `subscription_periods` rows. Must run AFTER
 * `EntitlementsRepository.linkEntitlementsToUser` has set
 * `entitlements.user_id = userId` for the relevant rows -- this query
 * only ever considers rows that already carry that `userId`.
 *
 * Idempotent: calling this twice for the same user inserts no duplicate
 * rows (the `razorpay_payment_id` unique index migration 0040 already
 * defines is the guard, exactly as it already is for Max's
 * `insertSubscriptionPeriod`).
 *
 * Returns the number of NEW subscription_periods rows inserted (0 on a
 * repeat call, or if the user holds no CMS-eligible entitlement).
 */
export async function convertLinkedCmsEntitlementsToSubscriptionPeriods(
  sql: CmsEntitlementConversionSqlClient,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  const { rows } = await sql.query(
    `INSERT INTO subscription_periods (
        id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id,
        activation_at, duration_days, created_at, updated_at
     )
     SELECT
        gen_random_uuid()::text,
        e.user_id,
        e.product_slug,
        'onetime-order:' || e.id,
        p.razorpay_payment_id,
        e.granted_at,
        30,
        $2,
        $2
       FROM entitlements e
       JOIN payments p
         ON p.order_id = e.order_id
        AND p.status = 'CAPTURED'
      WHERE e.user_id = $1
        AND e.product_slug IN ('ai_income_99', 'ai_freelancing_499')
        AND e.revoked_at IS NULL
     ON CONFLICT (razorpay_payment_id) DO NOTHING
     RETURNING 1`,
    [userId, now],
  );
  return rows.length;
}
