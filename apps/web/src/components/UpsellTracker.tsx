'use client';

import { useEffect } from 'react';

import type { ProductId } from '@acos/catalog';

import { track } from '../analytics/events';

/**
 * Fires the upsell_viewed event. A tiny client island so the upsell page
 * itself can stay a server component — the offer renders without
 * JavaScript, and only the measurement needs the browser.
 */
export function UpsellTracker({ productId, fromTier }: { productId: ProductId; fromTier: number }) {
  useEffect(() => {
    track('upsell_viewed', { productId, fromTier });
  }, [productId, fromTier]);
  return null;
}
