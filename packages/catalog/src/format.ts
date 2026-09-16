// -----------------------------------------------------------------------
// Display-only formatting helpers. These are for rendering prices in the
// UI (funnel pages, receipts) — they are never in the path of computing
// what to charge. Uses integer division only: safe here because every
// catalog amountPaise is, by construction and by test, an exact multiple
// of 100 (see catalog.test.ts's "no floating-point monetary
// calculations" suite).
// -----------------------------------------------------------------------

/**
 * Converts an integer paise amount to an integer rupee amount for
 * display. Throws rather than silently truncating if the amount is not
 * an exact multiple of 100 — a fractional-rupee amount would indicate a
 * bug elsewhere (e.g. a miscalculated discount), not something to paper
 * over here.
 */
export function paiseToWholeRupees(amountPaise: number): number {
  if (!Number.isInteger(amountPaise)) {
    throw new RangeError(`paiseToWholeRupees: amountPaise must be an integer, got ${amountPaise}`);
  }
  if (amountPaise % 100 !== 0) {
    throw new RangeError(
      `paiseToWholeRupees: amountPaise ${amountPaise} is not a whole-rupee amount`,
    );
  }
  return amountPaise / 100; // exact: divisibility already checked above
}

/**
 * Formats an integer paise amount as a "₹99" style string for display.
 */
export function formatPaiseAsInr(amountPaise: number): string {
  return `\u20B9${paiseToWholeRupees(amountPaise)}`;
}
