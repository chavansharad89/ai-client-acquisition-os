import type { ProductId } from '@acos/catalog';

import { captureAttribution, loadAttribution } from './attribution';
import { derivePurchaseEventId, deriveOrderEventId, deriveViewEventId } from './eventId';
import { toEventProperties, type FunnelEventName, type FunnelEventPayload } from './funnelEvents';
import { firePixel } from './pixel';

// The one function the UI calls.
// -----------------------------------------------------------------------
// Attaches attribution, fires the Meta Pixel with the shared event id, and
// forwards to any generic sink. Never throws — an analytics failure must
// not take a checkout down with it.
// -----------------------------------------------------------------------

export interface GenericSink {
  (name: FunnelEventName, properties: Record<string, unknown>): void;
}

let sink: GenericSink | null = null;

export function setFunnelSink(next: GenericSink | null): void {
  sink = next;
}

/** Per-tab scope so a re-render does not double-count a view. */
let scopeId: string | null = null;
function tabScope(): string {
  if (!scopeId) scopeId = globalThis.crypto.randomUUID();
  return scopeId;
}

export interface TrackInput {
  productId: ProductId;
  /** Major units. */
  value: number;
  currency?: string;
  orderId?: string;
  razorpayOrderId?: string;
  /** Required for Purchase and PaymentCaptured — it is the dedup key. */
  razorpayPaymentId?: string;
}

async function eventIdFor(name: FunnelEventName, input: TrackInput): Promise<string> {
  if ((name === 'Purchase' || name === 'PaymentCaptured') && input.razorpayPaymentId) {
    // Both sides derive this from the same payment id, so the browser
    // Pixel and the server CAPI call deduplicate.
    return derivePurchaseEventId(input.razorpayPaymentId);
  }
  if (name === 'RazorpayOrderCreated' && input.razorpayOrderId) {
    return deriveOrderEventId(input.razorpayOrderId);
  }
  return deriveViewEventId(tabScope(), name, input.productId);
}

export async function trackFunnel(name: FunnelEventName, input: TrackInput): Promise<void> {
  try {
    const attribution = name === 'LandingPageView' ? captureAttribution() : loadAttribution();
    const payload: FunnelEventPayload = {
      eventId: await eventIdFor(name, input),
      productId: input.productId,
      value: input.value,
      currency: input.currency ?? 'INR',
      attribution,
      ...(input.orderId ? { orderId: input.orderId } : {}),
      ...(input.razorpayOrderId ? { razorpayOrderId: input.razorpayOrderId } : {}),
    };

    firePixel(name, payload);
    sink?.(name, toEventProperties(payload));
  } catch {
    // Deliberately swallowed. See the module note.
  }
}
