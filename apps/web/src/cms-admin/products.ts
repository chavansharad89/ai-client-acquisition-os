import type { ProductId } from '@acos/catalog';

// The CMS's own tier shorthand (product ladder §2: Plus/Pro/Max) — not
// the same thing as a plan's CMS-PO-001 display-name override, which
// customers see for the purchasable product itself. Deliberately
// hardcoded here rather than read from anywhere configurable: this is
// internal CMS navigation labeling, not customer-facing copy.

export interface CmsProductTier {
  productId: ProductId;
  tier: 'Plus' | 'Pro' | 'Max';
}

export const CMS_PRODUCT_TIERS: readonly CmsProductTier[] = [
  { productId: 'ai_income_99', tier: 'Plus' },
  { productId: 'ai_freelancing_499', tier: 'Pro' },
  { productId: 'ai_client_acquisition_1499_subscription', tier: 'Max' },
];

/** Plus — first tier, used when a page has no `?product=` yet. */
export const DEFAULT_CMS_PRODUCT_ID: ProductId = 'ai_income_99';

export function isCmsProductId(value: string | undefined): value is ProductId {
  if (!value) return false;
  return CMS_PRODUCT_TIERS.some((t) => t.productId === value);
}

export function tierForProductId(productId: string): string {
  return CMS_PRODUCT_TIERS.find((t) => t.productId === productId)?.tier ?? productId;
}
