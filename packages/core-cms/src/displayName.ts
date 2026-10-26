import { getProduct, type ProductId } from '@acos/catalog';

import type { PlanDisplayNameRepository } from './planDisplayNameRepository';

// CMS-configurable plan display name (PO-1).
// -----------------------------------------------------------------------
// `ProductId` and `PRODUCT_CATALOG` (@acos/catalog) are never modified by
// this module -- the override table (migration 0061) is purely additive,
// which is what makes an empty table behave identically to today: with
// no override row, `resolveDisplayName` returns exactly
// `PRODUCT_CATALOG[productId].name`, byte-for-byte what every existing
// render site already shows.
// -----------------------------------------------------------------------

export interface DisplayNameDeps {
  planDisplayNames: PlanDisplayNameRepository;
}

/**
 * The display name to show for `productId`: the CMS override if one has
 * been set, otherwise the catalog's hardcoded default. `productId` is
 * the stable, immutable identity (@acos/catalog's `ProductId`) -- this
 * function only ever reads it, never writes or renames it.
 */
export async function resolveDisplayName(
  deps: DisplayNameDeps,
  productId: ProductId,
): Promise<string> {
  const override = await deps.planDisplayNames.findByProductId(productId);
  if (override) return override.displayName;
  return getProduct(productId).name;
}
