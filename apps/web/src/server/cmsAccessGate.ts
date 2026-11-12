import type { ProductId } from '@acos/catalog';
import { canAccessProduct } from '@acos/core-entitlements';
import { permittedContentPlans, type CmsAccessDeps } from '@acos/core-subscriptions';

// FINAL PRODUCT RULE: there must be no perpetual Plus/Pro access.
// -----------------------------------------------------------------------
// `currentAccess()` (access.ts) and the download route
// (app/api/downloads/[productId]/[assetId]/route.ts) both resolve a
// "purchased" list from `entitlements.listActiveByUser` — a query with
// NO expiry condition (`WHERE user_id = $1 AND revoked_at IS NULL`,
// packages/core-entitlements/src/pgRepository.ts) — and feed it into
// `canAccessProduct`/`accessibleProducts`, @acos/catalog's cumulative
// PRODUCT_LADDER. That is the proven mechanism by which an old,
// never-expiring ai_income_99/ai_freelancing_499 entitlement grants
// perpetual access, independent of @acos/core-subscriptions'
// subscription_periods-based CMS model.
//
// This module is the minimum access-foundation fix for that, nothing
// more: it adjusts the "purchased" list these two call sites already
// build, so the EXISTING `canAccessProduct`/`funnelStateFor` downstream
// keep working completely unchanged — no new UI, no content catalog, no
// admin surface.
//
// A naive fix ("just also check subscription_periods") would have a
// real bug: PRODUCT_LADDER's `impliedProductIds` is cumulative — owning
// a higher tier implies every lower one. That is a LEGITIMATE, existing,
// unrelated grant for the retired one-time `ai_client_acquisition_1499`
// SKU (someone who holds it is still meant to see ai_income_99 and
// ai_freelancing_499 as unlocked — COMMERCIAL-PO-02-style bundling,
// untouched by this change). But it would ALSO mean a customer's own
// direct `ai_freelancing_499` (Pro) entitlement implies `ai_income_99`
// (Plus) via that same ladder — directly contradicting PO-2/PO-3 ("Pro
// does NOT inherit Plus"). `resolveCmsAwarePurchased` avoids this by
// stripping ai_income_99/ai_freelancing_499 out of the ladder's OWN
// input before computing implications (so only a genuinely higher tier,
// the retired SKU, can still imply them), then adding each one back in
// only if `permittedContentPlans` (subscription_periods-based, with
// correct Max -> Plus+Pro+Max inheritance) says it is currently active.
// -----------------------------------------------------------------------

const CMS_GATED_PRODUCT_IDS = ['ai_income_99', 'ai_freelancing_499'] as const;

function isCmsGatedProductId(id: ProductId): id is 'ai_income_99' | 'ai_freelancing_499' {
  return id === 'ai_income_99' || id === 'ai_freelancing_499';
}

/**
 * Takes the raw, entitlements-derived "purchased" list `currentAccess()`
 * and the download route already compute, and returns the corrected
 * list to feed into `canAccessProduct`/`funnelStateFor` instead.
 *
 * ai_income_99/ai_freelancing_499 are only present in the result if an
 * active `subscription_periods` row currently justifies them (directly,
 * or via an active Max subscription's inheritance) — never merely
 * because an old entitlement row for them exists. Every other product
 * id (notably the retired one-time `ai_client_acquisition_1499`) passes
 * through completely unchanged, and — if present — still correctly
 * implies ai_income_99/ai_freelancing_499 downstream exactly as before,
 * since this function never removes IT from the list.
 */
export async function resolveCmsAwarePurchased(
  deps: CmsAccessDeps,
  userId: string,
  entitlementsPurchased: readonly ProductId[],
  now: Date = new Date(),
): Promise<readonly ProductId[]> {
  const permitted = await permittedContentPlans(deps, userId, now);
  const withoutCmsGated = entitlementsPurchased.filter((id) => !isCmsGatedProductId(id));
  const cmsGranted = CMS_GATED_PRODUCT_IDS.filter((id) => permitted.has(id));
  return [...withoutCmsGated, ...cmsGranted];
}

/**
 * Convenience single-product check built on {@link resolveCmsAwarePurchased}
 * — identical rule, for a call site that only needs one product's answer
 * (e.g. a future route) rather than the whole corrected list.
 */
export async function hasCmsAwareAccess(
  deps: CmsAccessDeps,
  userId: string,
  entitlementsPurchased: readonly ProductId[],
  productId: ProductId,
  now: Date = new Date(),
): Promise<boolean> {
  const corrected = await resolveCmsAwarePurchased(deps, userId, entitlementsPurchased, now);
  return canAccessProduct(corrected, productId);
}
