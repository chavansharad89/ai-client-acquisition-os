import type { ProductId } from './types';

// The funnel ladder.
// -----------------------------------------------------------------------
// The catalog already owns what each product COSTS. This file adds what
// the product line's shape is: an ordered ladder where each rung contains
// everything below it.
//
// That containment is not a marketing claim — the landing copy says
// "Everything in the starter kit, plus…", so buying a higher rung must
// grant the lower ones. Encoding it here means access checks and upsell
// eligibility read the same source, and cannot drift from the copy.
// -----------------------------------------------------------------------

/** Entry-level first. Index is the tier. */
export const PRODUCT_LADDER = [
  'ai_income_99',
  'ai_freelancing_499',
  'ai_client_acquisition_1499',
] as const satisfies readonly ProductId[];

export type LadderProductId = (typeof PRODUCT_LADDER)[number];

/** 0-based rung, or -1 for a product that is not on the ladder. */
export function tierOf(productId: ProductId): number {
  return (PRODUCT_LADDER as readonly string[]).indexOf(productId);
}

/**
 * Everything owning `productId` grants — itself and every lower rung.
 * Ordered entry-level first.
 */
export function impliedProductIds(productId: ProductId): readonly ProductId[] {
  const tier = tierOf(productId);
  return tier < 0 ? [productId] : PRODUCT_LADDER.slice(0, tier + 1);
}

/** The first rung — what a new visitor is sold. */
export const ENTRY_PRODUCT_ID: LadderProductId = PRODUCT_LADDER[0];

/** The rung directly above `productId`, or null at the top. */
export function nextRung(productId: ProductId): ProductId | null {
  const tier = tierOf(productId);
  if (tier < 0) return null;
  return PRODUCT_LADDER[tier + 1] ?? null;
}
