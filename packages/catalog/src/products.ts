import type { Product, ProductCatalog, ProductId } from './types';

// -----------------------------------------------------------------------
// The product catalog. This is the single source of truth for pricing —
// nowhere else in the system is permitted to hardcode or recompute a
// product's amountPaise or metaValueInr.
//
// Amounts are entered as plain integers, computed by hand once, not
// derived at module-load time via `rupees * 100` — this keeps the
// catalog itself free of any arithmetic (floating point or otherwise)
// that could be a source of drift. The relationship between the two
// amount fields is enforced by a test (see catalog.test.ts), not by
// runtime computation.
// -----------------------------------------------------------------------

const RAW_CATALOG = {
  ai_income_99: {
    id: 'ai_income_99',
    name: 'AI Income Starter Kit',
    amountPaise: 9900,
    currency: 'INR',
    metaValueInr: 99,
  },
  ai_freelancing_499: {
    id: 'ai_freelancing_499',
    name: 'AI Freelancing Launch Kit',
    amountPaise: 49900,
    currency: 'INR',
    metaValueInr: 499,
  },
  ai_client_acquisition_1499: {
    id: 'ai_client_acquisition_1499',
    name: 'AI Client Acquisition System',
    amountPaise: 149900,
    currency: 'INR',
    metaValueInr: 1499,
  },
} as const satisfies Record<ProductId, Product>;
// ^ `satisfies Record<ProductId, Product>` is what makes this a compile
// error if a ProductId is missing, extra, or has a field of the wrong
// shape — while `as const` keeps every literal (including each id)
// narrowed instead of widened to `string`/`number`, so e.g.
// PRODUCT_CATALOG.ai_income_99.id is the literal type 'ai_income_99',
// not `string`.

/**
 * Deep-freezes an object one level down (sufficient here: Product has no
 * nested objects/arrays). Runtime enforcement of immutability — the
 * `readonly` modifiers in types.ts only stop the TypeScript compiler,
 * not a caller who ignores types or accesses this from plain JS.
 */
function deepFreezeProduct(product: Product): Product {
  return Object.freeze({ ...product });
}

/**
 * The exported, immutable catalog. Frozen at two levels: the top-level
 * map cannot have keys added/removed/reassigned, and each individual
 * Product cannot have its own fields mutated.
 */
export const PRODUCT_CATALOG: ProductCatalog = Object.freeze({
  ai_income_99: deepFreezeProduct(RAW_CATALOG.ai_income_99),
  ai_freelancing_499: deepFreezeProduct(RAW_CATALOG.ai_freelancing_499),
  ai_client_acquisition_1499: deepFreezeProduct(RAW_CATALOG.ai_client_acquisition_1499),
});

/**
 * All valid product ids, derived from the catalog itself (not
 * hand-duplicated) so this can never drift out of sync with
 * PRODUCT_CATALOG.
 */
export const PRODUCT_IDS: readonly ProductId[] = Object.freeze(
  Object.keys(PRODUCT_CATALOG) as ProductId[],
);

/**
 * Read-only list of every product, for rendering the funnel/marketing
 * pages. This is safe to expose to the client for DISPLAY — the
 * prohibition is on the client dictating what gets *charged*, not on
 * the client knowing what things cost.
 */
export function listProducts(): readonly Product[] {
  return PRODUCT_IDS.map((id) => PRODUCT_CATALOG[id]);
}
