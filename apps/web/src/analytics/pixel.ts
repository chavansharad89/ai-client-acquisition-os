import {
  assertNoPii,
  DEDUPLICATED_EVENTS,
  toPixelCustomData,
  type FunnelEventName,
  type FunnelEventPayload,
} from './funnelEvents';

// Meta Pixel wrapper.
// -----------------------------------------------------------------------
// The only place `fbq` is called. Every conversion call passes
// `{ eventID }`, which is the half of deduplication the browser owns —
// the server passes the same string as `event_id` on the CAPI call, and
// Meta collapses the pair.
//
// Passing eventID is not optional for deduplicated events, so this module
// refuses to fire one without it rather than silently double-counting.
// -----------------------------------------------------------------------

type Fbq = (
  command: 'track' | 'trackCustom',
  event: string,
  data?: Record<string, unknown>,
  options?: { eventID: string },
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** Events Meta recognises natively; everything else goes via trackCustom. */
const STANDARD_EVENTS: readonly string[] = ['Purchase', 'ViewContent', 'InitiateCheckout'];

const PIXEL_NAME: Partial<Record<FunnelEventName, string>> = {
  ProductView: 'ViewContent',
  CheckoutStarted: 'InitiateCheckout',
  Purchase: 'Purchase',
};

export class MissingEventIdError extends Error {
  constructor(event: string) {
    super(
      `${event} is deduplicated against the server and cannot fire without an eventID — ` +
        'firing it anyway would double-count every sale.',
    );
    this.name = 'MissingEventIdError';
  }
}

export interface PixelCall {
  command: 'track' | 'trackCustom';
  event: string;
  data: Record<string, unknown>;
  options: { eventID: string };
}

/** Pure: what the Pixel call would be. Exported so tests assert on it. */
export function buildPixelCall(name: FunnelEventName, payload: FunnelEventPayload): PixelCall {
  if (DEDUPLICATED_EVENTS.includes(name) && !payload.eventId) {
    throw new MissingEventIdError(name);
  }
  const event = PIXEL_NAME[name] ?? name;
  const data = toPixelCustomData(payload);
  assertNoPii(data);
  return {
    command: STANDARD_EVENTS.includes(event) ? 'track' : 'trackCustom',
    event,
    data,
    options: { eventID: payload.eventId },
  };
}

/** Fires the Pixel. A missing or blocked fbq is never fatal. */
export function firePixel(name: FunnelEventName, payload: FunnelEventPayload): void {
  const call = buildPixelCall(name, payload);
  try {
    window.fbq?.(call.command, call.event, call.data, call.options);
  } catch {
    // An ad blocker must not break checkout.
  }
}
