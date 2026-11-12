import { CMS_PLAN_PRODUCT_IDS, type CmsPlanProductId } from '@acos/core-subscriptions';

// Shared CMS-eligible-product guard, used by both displayNameService.ts
// and contentService.ts so there is exactly one place that decides
// whether a product may own CMS content/display-name overrides.
// `CMS_PLAN_PRODUCT_IDS` itself stays canonical in @acos/core-subscriptions'
// cmsAccess.ts (the access layer) -- this is a read-only re-check of
// that same list, never a second copy of it.
export function isCmsEligibleProduct(productId: string): productId is CmsPlanProductId {
  return (CMS_PLAN_PRODUCT_IDS as readonly string[]).includes(productId);
}
