import type { SubscriptionPeriodRepository } from './subscriptionPeriodRepository';

// Plus/Pro/Max CMS content-access foundation (PO-2/PO-3/PO-5 of
// requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md §8-9), Phase 1.
// -----------------------------------------------------------------------
// This is a NEW, additive access gate, parallel to -- not built on --
// `findActiveClientFinderSubscriptionPeriod`/`hasClientFinderAccess` in
// access.ts. Those existing functions, their hardcoded
// `CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG`, and the Client Finder
// feature gate they back are untouched by this file.
//
// Deliberately NOT built on @acos/catalog's `PRODUCT_LADDER`/
// `impliedProductIds`: that ladder expresses cumulative one-time-SKU
// tiers for the retired `ai_client_acquisition_1499` chain and
// structurally excludes the subscription SKU entirely (`tierOf`
// returns -1 for it). Max's inheritance is star-shaped, not tiered --
// Max implies Plus and Pro, but Plus and Pro do not imply each other --
// so it needs its own map, defined here.
//
// `SubscriptionPeriodRepository.findActiveForUser` is already generic
// over `productSlug` (subscriptionPeriodRepository.ts) -- no change to
// that repository or its Postgres/fake implementations was needed to
// support Plus/Pro/Max uniformly.
// -----------------------------------------------------------------------

/**
 * The three CMS-eligible plans (PO-1/PO-2/PO-3/PO-5). Deliberately a
 * narrower set than @acos/catalog's full `ProductId` union -- the
 * retired one-time `ai_client_acquisition_1499` SKU is out of scope of
 * this CMS and is never a member of this type.
 */
export const CMS_PLAN_PRODUCT_IDS = [
  'ai_income_99',
  'ai_freelancing_499',
  'ai_client_acquisition_1499_subscription',
] as const;

export type CmsPlanProductId = (typeof CMS_PLAN_PRODUCT_IDS)[number];

/**
 * Max -> Plus + Pro + Max; Plus -> Plus only; Pro -> Pro only (PO-2).
 * Content is never duplicated to express this -- inheritance is applied
 * only here, at the access-resolution layer, when expanding a user's
 * directly-active plans into the full set of plans whose published
 * content they may see.
 */
export const CMS_PLAN_INHERITANCE: Readonly<Record<CmsPlanProductId, readonly CmsPlanProductId[]>> = {
  ai_income_99: ['ai_income_99'],
  ai_freelancing_499: ['ai_freelancing_499'],
  ai_client_acquisition_1499_subscription: [
    'ai_income_99',
    'ai_freelancing_499',
    'ai_client_acquisition_1499_subscription',
  ],
};

export interface CmsAccessDeps {
  subscriptionPeriods: SubscriptionPeriodRepository;
}

/**
 * The CMS plans for which the user directly holds a currently-active
 * `subscription_periods` row, BEFORE inheritance is applied. "Active" is
 * computed by the repository exactly as it already is for Max
 * (`refunded_at IS NULL AND activation_at + duration_days days > now`) --
 * no second expiry mechanism is introduced (PO-5).
 */
export async function findActiveCmsPlans(
  deps: CmsAccessDeps,
  userId: string,
  now: Date = new Date(),
): Promise<ReadonlySet<CmsPlanProductId>> {
  // Sequential, not Promise.all: a caller may hand this a single-connection
  // SqlClient (e.g. a test harness's bare pg.Client rather than a Pool),
  // which does not support true concurrent queries -- querying one at a
  // time keeps this correct regardless of what kind of client is injected.
  const active = new Set<CmsPlanProductId>();
  for (const productId of CMS_PLAN_PRODUCT_IDS) {
    const period = await deps.subscriptionPeriods.findActiveForUser(userId, productId, now);
    if (period) active.add(productId);
  }
  return active;
}

/**
 * The full set of plans whose published content the user may see right
 * now: their directly-active plans, expanded through
 * {@link CMS_PLAN_INHERITANCE}. Verified against PO-5's explicit table:
 * active-Plus-only -> {Plus}; active-Pro-only -> {Pro}; active-Max ->
 * {Plus, Pro, Max}; any expired plan contributes nothing to the union.
 */
export async function permittedContentPlans(
  deps: CmsAccessDeps,
  userId: string,
  now: Date = new Date(),
): Promise<ReadonlySet<CmsPlanProductId>> {
  const active = await findActiveCmsPlans(deps, userId, now);
  const permitted = new Set<CmsPlanProductId>();
  for (const plan of active) {
    for (const implied of CMS_PLAN_INHERITANCE[plan]) {
      permitted.add(implied);
    }
  }
  return permitted;
}
