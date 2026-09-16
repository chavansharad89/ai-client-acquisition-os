import { describe, expect, it } from 'vitest';

import { PRODUCT_CATALOG } from '@acos/catalog';

import { formatInrDisplay } from './inr';

describe('formatInrDisplay', () => {
  it('renders each catalog price exactly as the pricing copy promises', () => {
    expect(formatInrDisplay(PRODUCT_CATALOG.ai_income_99.amountPaise)).toBe('₹99');
    expect(formatInrDisplay(PRODUCT_CATALOG.ai_freelancing_499.amountPaise)).toBe('₹499');
    expect(formatInrDisplay(PRODUCT_CATALOG.ai_client_acquisition_1499.amountPaise)).toBe('₹1,499');
  });

  it('groups with Indian digit grouping, not thousands grouping', () => {
    expect(formatInrDisplay(10_000_000)).toBe('₹1,00,000');
  });

  it('never renders paise or rounding artifacts', () => {
    expect(formatInrDisplay(0)).toBe('₹0');
    expect(formatInrDisplay(9900)).not.toContain('.');
  });

  it('refuses a fractional-rupee amount rather than rounding it silently', () => {
    expect(() => formatInrDisplay(9901)).toThrow(RangeError);
    expect(() => formatInrDisplay(1.5)).toThrow(RangeError);
  });
});
