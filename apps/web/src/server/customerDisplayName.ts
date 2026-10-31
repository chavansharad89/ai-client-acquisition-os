import type { ProductId } from '@acos/catalog';
import { resolveDisplayName } from '@acos/core-cms';

import { commerceRepositories } from './commerceRepositories';

// Phase 1G: the one place every customer-facing render site composes
// commerceRepositories()'s planDisplayNames with resolveDisplayName
// (@acos/core-cms), so none of the ~8 call sites duplicate that
// composition. Mirrors the existing cmsContentService.ts/
// cmsPreviewService.ts "glue" convention. No caching -- a live read on
// every call, per the Product Owner's explicit "correctness and
// freshness over premature caching" decision for Phase 1G.
export async function getCustomerDisplayName(productId: ProductId): Promise<string> {
  const { planDisplayNames } = commerceRepositories();
  return resolveDisplayName({ planDisplayNames }, productId);
}
