import {
  impliedProductIds,
  ENTRY_PRODUCT_ID,
  PRODUCT_LADDER,
  tierOf,
  type ProductId,
} from '@acos/catalog';

import type { FunnelState } from './types';

// Funnel logic — pure, so every rule is testable without a database.
// -----------------------------------------------------------------------
// These functions decide what a visitor may see and what they are offered
// next. They take the set of PURCHASED products as input and never read
// storage themselves, which is what keeps the "no localStorage authority"
// rule enforceable: the only way to call them is with a set the server
// resolved.
// -----------------------------------------------------------------------

/** Expands purchases through the ladder, deduped and ordered by tier. */
export function accessibleProducts(purchased: readonly ProductId[]): readonly ProductId[] {
  const granted = new Set<ProductId>();
  for (const product of purchased) {
    for (const implied of impliedProductIds(product)) granted.add(implied);
  }
  return PRODUCT_LADDER.filter((id) => granted.has(id));
}

/** Whether this visitor may open a product, honouring ladder implication. */
export function canAccessProduct(purchased: readonly ProductId[], productId: ProductId): boolean {
  return accessibleProducts(purchased).includes(productId);
}

/**
 * The next product to offer.
 *
 * Offers the rung directly above the highest one reached, so a visitor who
 * jumped straight to the top tier is never shown a lower one, and a
 * visitor who owns nothing is offered the entry product.
 */
export function nextUpsell(purchased: readonly ProductId[]): ProductId | null {
  const accessible = accessibleProducts(purchased);
  if (accessible.length === 0) return ENTRY_PRODUCT_ID;
  const highest = Math.max(...accessible.map(tierOf));
  return PRODUCT_LADDER[highest + 1] ?? null;
}

/**
 * Whether buying `productId` would be a duplicate.
 *
 * True when it is already accessible — including when access came from a
 * HIGHER purchase. Someone who bought the ₹1,499 system must not be sold
 * the ₹99 kit they already have.
 */
export function isDuplicatePurchase(
  purchased: readonly ProductId[],
  productId: ProductId,
): boolean {
  return canAccessProduct(purchased, productId);
}

/** The whole funnel position in one object. */
export function funnelStateFor(purchased: readonly ProductId[]): FunnelState {
  const accessible = accessibleProducts(purchased);
  const tier = accessible.length === 0 ? -1 : Math.max(...accessible.map(tierOf));
  return {
    purchased: PRODUCT_LADDER.filter((id) => purchased.includes(id)),
    accessible,
    upsell: nextUpsell(purchased),
    complete: accessible.length === PRODUCT_LADDER.length,
    tier,
  };
}

/**
 * Where a visitor should be sent after a successful purchase: the upsell
 * if one remains, otherwise their library.
 */
export function postPurchaseDestination(purchased: readonly ProductId[]): string {
  const upsell = nextUpsell(purchased);
  return upsell ? `/upsell/${upsell}` : '/access';
}
