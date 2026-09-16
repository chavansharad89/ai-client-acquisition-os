import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertBrowserEmittable,
  SERVER_ONLY_EVENTS,
  ServerOnlyEventError,
  setAnalyticsSink,
  track,
} from './events';

afterEach(() => setAnalyticsSink(null));

describe('the browser cannot report a purchase', () => {
  it.each(SERVER_ONLY_EVENTS)('refuses to emit %s from the client', (name) => {
    expect(() => assertBrowserEmittable(name)).toThrow(ServerOnlyEventError);
    expect(() => track(name as never, {} as never)).toThrow(ServerOnlyEventError);
  });

  it('a hostile caller cannot slip one past the sink', () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    expect(() => track('purchase_completed' as never, {} as never)).toThrow();
    expect(sink).not.toHaveBeenCalled();
  });

  it('explains why, so the next person does not just delete the guard', () => {
    expect(() => assertBrowserEmittable('purchase_completed')).toThrow(/conversion data/i);
  });
});

describe('browser events', () => {
  it('reach the sink with their payload', () => {
    const sink = vi.fn();
    setAnalyticsSink(sink);
    track('checkout_started', { productId: 'ai_income_99', amountPaise: 9900 });
    expect(sink).toHaveBeenCalledWith('checkout_started', {
      productId: 'ai_income_99',
      amountPaise: 9900,
    });
  });

  it('are silently dropped when no sink is wired', () => {
    expect(() => track('upsell_declined', { productId: 'ai_income_99' })).not.toThrow();
  });

  it('never break the funnel when the sink itself throws', () => {
    setAnalyticsSink(() => {
      throw new Error('ad blocker');
    });
    expect(() => track('upsell_viewed', { productId: 'ai_income_99', fromTier: 0 })).not.toThrow();
  });
});
