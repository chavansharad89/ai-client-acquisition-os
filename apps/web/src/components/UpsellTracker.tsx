'use client';

import { useEffect } from 'react';

import type { ProductId } from '@acos/catalog';

import { track } from '../analytics/events';

/**
 * Fires the upsell_viewed event for UI analytics. A tiny client island so
 * the upsell page itself can stay a server component.
 *
 * NOT the PCG-3A/3B gate's data source (ED-5): the server component at
 * app/upsell/[productId]/page.tsx persists its own server-authoritative
 * upsell_viewed row (via @acos/core-funnel-events) before this ever
 * mounts. This browser event has no server persistence and cannot be
 * trusted as exposure evidence — a disabled/slow/ad-blocked browser
 * still counts as exposed server-side.
 */
export function UpsellTracker({ productId, fromTier }: { productId: ProductId; fromTier: number }) {
  useEffect(() => {
    track('upsell_viewed', { productId, fromTier });
  }, [productId, fromTier]);
  return null;
}
