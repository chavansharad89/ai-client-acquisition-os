import type { ProductId } from '@acos/catalog';

// Funnel analytics.
// -----------------------------------------------------------------------
// Two families, kept apart on purpose.
//
// BROWSER events describe what a person did in the UI — viewed an offer,
// started checkout, declined an upsell. The browser is the only thing that
// knows these, and nothing downstream depends on them being truthful.
//
// PURCHASE events describe money. The browser cannot be allowed to emit
// them: anyone can call an analytics function from a console, and a
// client-reported purchase would corrupt conversion data and, worse, feed
// Meta's optimiser with sales that never happened. They are emitted
// server-side from the webhook handler, alongside the MetaEvent row.
// `assertBrowserEmittable` makes that a type error AND a runtime error,
// rather than a convention.
// -----------------------------------------------------------------------

export interface FunnelEventMap {
  funnel_entry_viewed: { productId: ProductId };
  checkout_started: { productId: ProductId; amountPaise: number };
  checkout_dismissed: { productId: ProductId };
  checkout_failed: { productId: ProductId; reason: string };
  payment_submitted: { productId: ProductId; orderId: string };
  upsell_viewed: { productId: ProductId; fromTier: number };
  upsell_accepted: { productId: ProductId };
  upsell_declined: { productId: ProductId };
  access_granted_view: { accessibleCount: number };
  access_denied: { productId: ProductId; reason: string };
}

/** Emitted by the server only. Never add one of these to FunnelEventMap. */
export interface ServerEventMap {
  purchase_completed: { productId: ProductId; orderId: string; amountPaise: number };
  entitlement_granted: { productId: ProductId; customerEmail: string };
}

export type BrowserEventName = keyof FunnelEventMap;
export type ServerEventName = keyof ServerEventMap;

export const SERVER_ONLY_EVENTS: readonly ServerEventName[] = [
  'purchase_completed',
  'entitlement_granted',
];

export class ServerOnlyEventError extends Error {
  constructor(name: string) {
    super(
      `${name} is a server-authoritative event and cannot be emitted from the browser — ` +
        'a client-reported purchase would corrupt conversion data and Meta optimisation.',
    );
    this.name = 'ServerOnlyEventError';
  }
}

export function assertBrowserEmittable(name: string): asserts name is BrowserEventName {
  if ((SERVER_ONLY_EVENTS as readonly string[]).includes(name)) {
    throw new ServerOnlyEventError(name);
  }
}

export interface AnalyticsSink {
  (name: BrowserEventName, payload: Record<string, unknown>): void;
}

let sink: AnalyticsSink | null = null;

/** Wire a real sink (GA, Segment, Pixel) once, at app boot. */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

/**
 * Records a browser funnel event. Never throws on a missing sink — losing
 * analytics must not break a checkout.
 */
export function track<K extends BrowserEventName>(name: K, payload: FunnelEventMap[K]): void {
  assertBrowserEmittable(name);
  try {
    sink?.(name, payload as Record<string, unknown>);
  } catch {
    // Analytics is never allowed to take the funnel down with it.
  }
}
