// Rate-limit policies for the payment surface.
// -----------------------------------------------------------------------
// WHY THIS ENDPOINT NEEDS ONE AT ALL: every accepted POST to
// /api/payments/create-order makes a real outbound Razorpay Orders API
// call and commits a row. Unthrottled and unauthenticated, a script can
// exhaust the provider quota — at which point genuine customers cannot
// check out — and fill the orders table with junk that reconciliation
// and the worker then have to scan.
//
// CHOOSING THE NUMBERS. The constraint that matters is not "stop abuse"
// but "stop abuse WITHOUT breaking a real person retrying a payment".
// A real checkout looks like: load the page, click Buy, card declined,
// try again, try a different card. Three to five attempts in a few
// minutes is normal, not suspicious.
//
// So the per-IP window is deliberately loose. A single IP is a poor
// identity: carrier-grade NAT, office networks and university campuses
// put hundreds of unrelated people behind one address, and a tight
// per-IP limit locks out a whole building to inconvenience one script.
// The per-EMAIL window is tighter, because an email is a much better
// proxy for "one person" — and the two together cover the two shapes of
// abuse: one host making many requests, and many hosts replaying one
// identity.
// -----------------------------------------------------------------------

export interface RateLimitPolicy {
  /** Stable name, used in the bucket key so policies never collide. */
  name: string;
  /** Requests permitted per window. */
  limit: number;
  windowMs: number;
}

/**
 * Loose on purpose — see the NAT note above. This is a ceiling on
 * scripted abuse, not a tight behavioural model of one customer.
 */
export const CREATE_ORDER_IP_POLICY: RateLimitPolicy = {
  name: 'create-order:ip',
  limit: 20,
  windowMs: 5 * 60_000,
};

/**
 * Tighter, because an email identifies a person far better than an IP
 * does. Five checkout attempts for one address in fifteen minutes is
 * already generous for a genuine buyer having card trouble.
 */
export const CREATE_ORDER_EMAIL_POLICY: RateLimitPolicy = {
  name: 'create-order:email',
  limit: 5,
  windowMs: 15 * 60_000,
};

export function assertPolicy(policy: RateLimitPolicy): void {
  if (!Number.isInteger(policy.limit) || policy.limit < 1) {
    throw new RangeError(`policy ${policy.name}: limit must be a positive integer`);
  }
  if (!Number.isInteger(policy.windowMs) || policy.windowMs < 1) {
    throw new RangeError(`policy ${policy.name}: windowMs must be a positive integer`);
  }
}

/**
 * The start of the fixed window containing `now`.
 *
 * Fixed windows, not sliding. The tradeoff is real and worth stating: a
 * caller can send `limit` requests at the very end of one window and
 * `limit` more at the start of the next, so the true worst case is 2x
 * the limit across a boundary. For an endpoint whose purpose is to stop
 * quota exhaustion that is entirely acceptable — 40 requests in a
 * pathological 10 seconds is still nothing — and it buys an
 * implementation that is one atomic UPSERT with no read-modify-write
 * race. A sliding window would need per-request timestamps and a much
 * more expensive query for a bound nobody here needs.
 */
export function windowStart(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/**
 * Re-issuing a download link.
 *
 * Tighter than checkout, because the endpoint's side effect is an EMAIL
 * to an address the caller names. Unthrottled, that is a mail bomb
 * pointed at anyone, sent from our domain and our reputation. Three per
 * fifteen minutes is generous for somebody who lost a link and
 * uncomfortable for anybody else.
 */
export const REISSUE_EMAIL_POLICY: RateLimitPolicy = {
  name: 'reissue:email',
  limit: 3,
  windowMs: 15 * 60_000,
};

/** And a per-IP ceiling, so one host cannot walk a list of addresses. */
export const REISSUE_IP_POLICY: RateLimitPolicy = {
  name: 'reissue:ip',
  limit: 10,
  windowMs: 15 * 60_000,
};
