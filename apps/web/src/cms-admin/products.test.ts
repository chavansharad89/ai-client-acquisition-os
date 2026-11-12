import { describe, expect, it } from 'vitest';

import { CMS_PRODUCT_TIERS, DEFAULT_CMS_PRODUCT_ID, isCmsProductId, tierForProductId } from './products';

describe('isCmsProductId', () => {
  it('accepts exactly the three CMS plan product ids', () => {
    expect(isCmsProductId('ai_income_99')).toBe(true);
    expect(isCmsProductId('ai_freelancing_499')).toBe(true);
    expect(isCmsProductId('ai_client_acquisition_1499_subscription')).toBe(true);
  });

  it('rejects the retired one-time SKU and unknown values', () => {
    expect(isCmsProductId('ai_client_acquisition_1499')).toBe(false);
    expect(isCmsProductId('not-a-product')).toBe(false);
    expect(isCmsProductId(undefined)).toBe(false);
    expect(isCmsProductId('')).toBe(false);
  });
});

describe('tierForProductId', () => {
  it('maps each CMS-eligible product to its Plus/Pro/Max tier label', () => {
    expect(tierForProductId('ai_income_99')).toBe('Plus');
    expect(tierForProductId('ai_freelancing_499')).toBe('Pro');
    expect(tierForProductId('ai_client_acquisition_1499_subscription')).toBe('Max');
  });

  it('falls back to the raw id for an unknown product', () => {
    expect(tierForProductId('unknown')).toBe('unknown');
  });
});

describe('CMS_PRODUCT_TIERS / DEFAULT_CMS_PRODUCT_ID', () => {
  it('defaults to Plus, the first tier', () => {
    expect(DEFAULT_CMS_PRODUCT_ID).toBe('ai_income_99');
    expect(CMS_PRODUCT_TIERS[0]?.productId).toBe(DEFAULT_CMS_PRODUCT_ID);
  });

  it('lists exactly the three CMS-eligible tiers, in product-ladder order', () => {
    expect(CMS_PRODUCT_TIERS.map((t) => t.tier)).toEqual(['Plus', 'Pro', 'Max']);
  });
});
