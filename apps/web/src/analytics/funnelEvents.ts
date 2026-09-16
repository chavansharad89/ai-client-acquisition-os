import type { ProductId } from '@acos/catalog';

import type { Attribution } from './attribution';

// The funnel's event contract.
// -----------------------------------------------------------------------
// Ten events, each carrying the commercial facts (product, value,
// currency) and the attribution needed to credit the sale.
//
// PII POLICY: no event on this list carries an email, phone, name or
// address. The browser Pixel never needs them — Meta matches on fbp/fbc,
// which are exactly what they exist for. The SERVER's CAPI call does send
// email and phone, hashed with SHA-256 by @acos/core-capi, because
// server-side matching materially improves attribution and hashing is
// what makes that acceptable. Sending raw PII to the browser Pixel would
// buy nothing and risk everything, so `assertNoPii` refuses it.
// -----------------------------------------------------------------------

export const FUNNEL_EVENTS = [
  'LandingPageView',
  'ProductView',
  'CheckoutStarted',
  'RazorpayOrderCreated',
  'PaymentCaptured',
  'Purchase',
  'UpsellShown',
  'UpsellAccepted',
  'UpsellDeclined',
  'ProductAccessed',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

/** Events also sent server-side, so they MUST carry a shared event_id. */
export const DEDUPLICATED_EVENTS: readonly FunnelEventName[] = ['Purchase'];

/** Commercial facts every funnel event carries. */
export interface FunnelEventPayload {
  /** Stable id. Shared with the server for deduplicated events. */
  eventId: string;
  productId: ProductId;
  /** Major units (499), matching Meta's `value`. Never paise. */
  value: number;
  currency: string;
  attribution: Attribution;
  /** Razorpay ids, where the event has them. Not PII. */
  orderId?: string;
  razorpayOrderId?: string;
}

const PII_KEYS = [
  'email',
  'customeremail',
  'phone',
  'customerphone',
  'contact',
  'name',
  'customername',
  'address',
  'ip',
  'firstname',
  'lastname',
];

export class PiiInEventError extends Error {
  constructor(key: string) {
    super(
      `"${key}" looks like PII and must not be sent to the browser Pixel. ` +
        'Server-side CAPI sends hashed email/phone; the Pixel matches on fbp/fbc.',
    );
    this.name = 'PiiInEventError';
  }
}

/** Fails closed on anything resembling a direct identifier. */
export function assertNoPii(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    if (PII_KEYS.includes(key.toLowerCase().replace(/[_-]/g, ''))) {
      throw new PiiInEventError(key);
    }
    const value = payload[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      assertNoPii(value as Record<string, unknown>);
    }
  }
}

/**
 * Flattens a payload into the properties an analytics sink receives.
 * Undefined attribution fields are omitted rather than sent as null.
 */
export function toEventProperties(payload: FunnelEventPayload): Record<string, unknown> {
  const { attribution, ...rest } = payload;
  const properties: Record<string, unknown> = {
    ...rest,
    ...Object.fromEntries(Object.entries(attribution).filter(([, value]) => value !== undefined)),
  };
  assertNoPii(properties);
  return properties;
}

/** Meta's `custom_data` for a Pixel call. Mirrors the server's CAPI shape. */
export function toPixelCustomData(payload: FunnelEventPayload): Record<string, unknown> {
  return {
    content_ids: [payload.productId],
    content_type: 'product',
    value: payload.value,
    currency: payload.currency,
  };
}
