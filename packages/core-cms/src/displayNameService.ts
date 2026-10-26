import { isCmsEligibleProduct } from './cmsEligibility';
import type { DisplayNameDeps } from './displayName';
import type { PlanDisplayName } from './types';

// Admin-facing display-name service (PO-1), layered on top of
// displayName.ts's read-only `resolveDisplayName` (re-exported from
// index.ts as the "get" operation -- no wrapper needed here, it already
// does exactly "CMS override, else catalog default").
export interface DisplayNameServiceDeps extends DisplayNameDeps {}

/**
 * Sets (or clears, by setting back to the catalog name) the CMS
 * override for `productId`. Rejects a non-CMS-eligible product and a
 * blank name before ever reaching the repository -- the DB's
 * `plan_display_names_display_name_not_blank` CHECK is the backstop,
 * this is the clean, typed failure path for the service caller. Never
 * touches `ProductId`/`PRODUCT_CATALOG`, `orders`, `payments`,
 * `entitlements`, or `subscription_periods` (PO-1).
 */
export async function setDisplayNameOverride(
  deps: DisplayNameServiceDeps,
  productId: string,
  displayName: string,
  updatedBy: string | null,
): Promise<PlanDisplayName> {
  if (!isCmsEligibleProduct(productId)) {
    throw new Error(`plan_display_names: '${productId}' is not a CMS-eligible product`);
  }
  if (displayName.trim().length === 0) {
    throw new Error('plan_display_names: display_name must not be blank');
  }
  return deps.planDisplayNames.upsert(productId, displayName, updatedBy);
}
