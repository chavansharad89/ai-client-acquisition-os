// -----------------------------------------------------------------------
// Product catalog types.
//
// ProductId is a closed literal union — NOT `string`. This is what makes
// "invalid product id" a compile-time error at every call site that
// accepts an already-validated id, and forces any boundary that receives
// an untyped string (an HTTP request body, a URL param) to go through
// the runtime validator in validate.ts before the type system will treat
// it as a real ProductId. See architecture principle: "client must never
// determine authoritative price."
// -----------------------------------------------------------------------

/**
 * The complete, closed set of sellable product ids. Adding a product
 * means adding a literal here AND an entry in products.ts — TypeScript
 * will refuse to compile products.ts until both are done (see the
 * `satisfies`/exhaustiveness check there), so the two can never drift.
 */
export type ProductId =
  | 'ai_income_99'
  | 'ai_freelancing_499'
  | 'ai_client_acquisition_1499';

/**
 * Currently INR-only by design (see architecture §14 item 2 — multi-
 * currency is an explicitly deferred decision, not silently assumed).
 */
export type Currency = 'INR';

/**
 * A single catalog entry. Every field here is `readonly` at the type
 * level; products.ts additionally `Object.freeze`s each entry so the
 * immutability holds at runtime too, not just at compile time.
 */
export interface Product {
  /** Immutable, stable identifier. Never renamed once shipped — it is
   *  persisted verbatim onto `orders.product_slug` and is part of the
   *  permanent financial record. */
  readonly id: ProductId;

  /** Human-readable name for display (checkout page, receipts, dashboard). */
  readonly name: string;

  /**
   * The ONLY authoritative amount for payment purposes. Always an
   * integer number of paise. Never a float, never derived from a
   * rupee value via division at request time — see
   * `assertNoFloatingPointDrift` in catalog.test.ts for why.
   */
  readonly amountPaise: number;

  readonly currency: Currency;

  /**
   * The value reported to Meta Conversions API's `custom_data.value`
   * field, which Meta expects in the *standard currency unit* (whole
   * rupees for INR), not paise. Stored explicitly rather than computed
   * via `amountPaise / 100` at call time, so there is no runtime
   * division in the payment/attribution path at all — see
   * requirement: "no floating-point monetary calculations."
   */
  readonly metaValueInr: number;
}

/**
 * The catalog itself: an exhaustive, frozen map from every ProductId to
 * its Product. `Record<ProductId, Product>` (not `Partial<...>` and not
 * `Map`) is deliberate — it is a compile error to define this constant
 * without an entry for every ProductId, and a compile error to look up
 * a key that isn't a ProductId.
 */
export type ProductCatalog = Readonly<Record<ProductId, Product>>;
