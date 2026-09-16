// Stable event IDs.
// -----------------------------------------------------------------------
// Meta deduplicates a browser Pixel event against a server CAPI event when
// both carry the same `event_id` (and event name) within its dedup window.
// Get this wrong and every sale is counted twice, which corrupts reported
// ROAS and — worse — teaches the ad optimiser to bid on a conversion rate
// that does not exist.
//
// The derivation below is deliberately IDENTICAL to
// @acos/core-capi.buildPurchaseEventId:
//
//     purchase_<sha256-hex of the trimmed razorpay payment id>
//
// Deterministic from a value both sides already hold means neither side
// has to transmit an id to the other, and a retry on either side produces
// the same id again. `eventId.test.ts` asserts the two implementations
// agree byte for byte, so a change to one without the other fails CI.
//
// Web Crypto is async, which is why these return promises. That is fine:
// the Pixel fires after Razorpay's handler resolves, not on a hot path.
// -----------------------------------------------------------------------

const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export class EventIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventIdError';
  }
}

/**
 * `<prefix>_<sha256hex(key)>`.
 *
 * The key must be something both browser and server can see — a Razorpay
 * payment id, an order id. Never a random value, or the two sides will
 * disagree and Meta will double-count.
 */
export async function stableEventId(prefix: string, key: string): Promise<string> {
  const normalised = key.trim();
  if (!normalised) throw new EventIdError(`${prefix} event id needs a non-empty key`);
  if (!/^[a-z][a-z0-9_]*$/.test(prefix)) {
    throw new EventIdError(`invalid event id prefix: ${prefix}`);
  }
  return `${prefix}_${await sha256Hex(normalised)}`;
}

/**
 * The Purchase event id. MUST equal the server's
 * `buildPurchaseEventId({ paymentId })` for the same payment.
 */
export function derivePurchaseEventId(razorpayPaymentId: string): Promise<string> {
  return stableEventId('purchase', razorpayPaymentId);
}

export function deriveOrderEventId(razorpayOrderId: string): Promise<string> {
  return stableEventId('rzporder', razorpayOrderId);
}

export function deriveCaptureEventId(razorpayPaymentId: string): Promise<string> {
  return stableEventId('capture', razorpayPaymentId);
}

/**
 * For events with no natural shared key — page views, upsell impressions.
 *
 * Scoped to a per-tab id so the same view is not counted twice on a
 * re-render, but NOT shared with the server, because these events are
 * never sent from both sides and so never need deduplicating.
 */
export function deriveViewEventId(scopeId: string, name: string, product: string): Promise<string> {
  return stableEventId('view', `${scopeId}:${name}:${product}`);
}
