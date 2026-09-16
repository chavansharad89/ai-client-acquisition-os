// Display formatting for rupee amounts.
// -----------------------------------------------------------------------
// @acos/catalog's `formatPaiseAsInr` deliberately renders an ungrouped
// "₹1499" and is pinned by a catalog test, because its job is exactness,
// not presentation. Indian digit grouping ("₹1,499") is a presentation
// concern, so it lives here in the UI layer rather than changing a
// tested catalog primitive.
//
// This is display only. It never feeds a request body — the browser has
// no say in price (see buildCreateOrderRequest).
// -----------------------------------------------------------------------

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats integer paise as a grouped rupee string, e.g. 149900 -> "₹1,49,900"/"₹1,499". */
export function formatInrDisplay(amountPaise: number): string {
  if (!Number.isInteger(amountPaise)) {
    throw new RangeError(`formatInrDisplay: amountPaise must be an integer, got ${amountPaise}`);
  }
  if (amountPaise % 100 !== 0) {
    throw new RangeError(`formatInrDisplay: ${amountPaise} is not a whole-rupee amount`);
  }
  // Intl emits U+00A0 between symbol and digits in some ICU builds; strip
  // it so the markup contains a predictable, testable string.
  return INR.format(amountPaise / 100).replace(/\u00a0/g, '');
}
