import { describe, expect, it } from 'vitest';

import { PRODUCT_LADDER } from '@acos/catalog';

import {
  accessibleProducts,
  canAccessProduct,
  funnelStateFor,
  isDuplicatePurchase,
  nextUpsell,
  postPurchaseDestination,
} from './funnel';

const STARTER = 'ai_income_99';
const LAUNCH = 'ai_freelancing_499';
const SYSTEM = 'ai_client_acquisition_1499';

describe('funnel state for a new visitor', () => {
  it('owns nothing, can open nothing, and is offered the entry product', () => {
    const state = funnelStateFor([]);
    expect(state).toMatchObject({
      purchased: [],
      accessible: [],
      upsell: STARTER,
      complete: false,
      tier: -1,
    });
  });

  it('cannot open any product', () => {
    for (const id of PRODUCT_LADDER) expect(canAccessProduct([], id)).toBe(false);
  });
});

describe('after buying the ₹99 starter kit', () => {
  const state = funnelStateFor([STARTER]);

  it('is offered the ₹499 launch kit next', () => {
    expect(state.upsell).toBe(LAUNCH);
  });

  it('can open the starter kit only', () => {
    expect(canAccessProduct([STARTER], STARTER)).toBe(true);
    expect(canAccessProduct([STARTER], LAUNCH)).toBe(false);
    expect(canAccessProduct([STARTER], SYSTEM)).toBe(false);
  });

  it('is sent to the upsell after purchase', () => {
    expect(postPurchaseDestination([STARTER])).toBe(`/upsell/${LAUNCH}`);
  });
});

describe('after buying the ₹499 launch kit', () => {
  it('is offered the ₹1,499 system next', () => {
    expect(nextUpsell([STARTER, LAUNCH])).toBe(SYSTEM);
  });

  it('can open the starter kit even if it was never bought separately', () => {
    // The copy promises "everything in the starter kit"; access follows.
    expect(canAccessProduct([LAUNCH], STARTER)).toBe(true);
  });
});

describe('after buying the ₹1,499 system', () => {
  const state = funnelStateFor([SYSTEM]);

  it('unlocks the whole ladder', () => {
    expect(state.accessible).toEqual([...PRODUCT_LADDER]);
    expect(state.complete).toBe(true);
  });

  it('has no upsell left', () => {
    expect(state.upsell).toBeNull();
  });

  it('is sent to their library, not to another offer', () => {
    expect(postPurchaseDestination([SYSTEM])).toBe('/access');
  });
});

describe('someone who skipped straight to the top', () => {
  it('is never shown a lower rung as an upsell', () => {
    expect(nextUpsell([SYSTEM])).toBeNull();
    expect(nextUpsell([LAUNCH])).toBe(SYSTEM);
  });

  it('is not sold something they already have', () => {
    expect(isDuplicatePurchase([SYSTEM], STARTER)).toBe(true);
    expect(isDuplicatePurchase([SYSTEM], LAUNCH)).toBe(true);
    expect(isDuplicatePurchase([SYSTEM], SYSTEM)).toBe(true);
  });
});

describe('duplicate purchase handling', () => {
  it('a product already owned directly is a duplicate', () => {
    expect(isDuplicatePurchase([STARTER], STARTER)).toBe(true);
  });

  it('a product not yet owned is not a duplicate', () => {
    expect(isDuplicatePurchase([STARTER], LAUNCH)).toBe(false);
  });

  it('a product owned only by implication is still a duplicate', () => {
    // This is the case a naive `purchased.includes(id)` gets wrong.
    expect([...[LAUNCH]].includes(STARTER as never)).toBe(false);
    expect(isDuplicatePurchase([LAUNCH], STARTER)).toBe(true);
  });
});

describe('robustness', () => {
  it('ignores duplicates and ordering in the purchased set', () => {
    expect(accessibleProducts([LAUNCH, STARTER, LAUNCH])).toEqual([STARTER, LAUNCH]);
    expect(accessibleProducts([SYSTEM, STARTER])).toEqual([...PRODUCT_LADDER]);
  });

  it('always returns accessible products in ladder order', () => {
    expect(accessibleProducts([SYSTEM])).toEqual([...PRODUCT_LADDER]);
  });

  it('every reachable state has a coherent tier', () => {
    expect(funnelStateFor([]).tier).toBe(-1);
    expect(funnelStateFor([STARTER]).tier).toBe(0);
    expect(funnelStateFor([LAUNCH]).tier).toBe(1);
    expect(funnelStateFor([SYSTEM]).tier).toBe(2);
  });

  it('the upsell is never something already accessible', () => {
    for (const owned of [[], [STARTER], [LAUNCH], [SYSTEM], [STARTER, LAUNCH]]) {
      const state = funnelStateFor(owned as never);
      if (state.upsell) expect(state.accessible).not.toContain(state.upsell);
    }
  });
});
