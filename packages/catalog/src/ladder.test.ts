import { describe, expect, it } from 'vitest';

import { PRODUCT_IDS } from './products';
import { ENTRY_PRODUCT_ID, impliedProductIds, nextRung, PRODUCT_LADDER, tierOf } from './ladder';

describe('the ladder covers the catalog', () => {
  it('every sellable product is on exactly one rung', () => {
    expect([...PRODUCT_LADDER].sort()).toEqual([...PRODUCT_IDS].sort());
    expect(new Set(PRODUCT_LADDER).size).toBe(PRODUCT_LADDER.length);
  });

  it('is ordered entry-level first', () => {
    expect(PRODUCT_LADDER[0]).toBe('ai_income_99');
    expect(ENTRY_PRODUCT_ID).toBe('ai_income_99');
    expect(PRODUCT_LADDER[PRODUCT_LADDER.length - 1]).toBe('ai_client_acquisition_1499');
  });

  it('tiers ascend with price', () => {
    expect(tierOf('ai_income_99')).toBe(0);
    expect(tierOf('ai_freelancing_499')).toBe(1);
    expect(tierOf('ai_client_acquisition_1499')).toBe(2);
  });
});

describe('a higher rung contains the lower ones', () => {
  it('the entry kit grants only itself', () => {
    expect(impliedProductIds('ai_income_99')).toEqual(['ai_income_99']);
  });

  it('the launch kit grants the starter kit too', () => {
    expect(impliedProductIds('ai_freelancing_499')).toEqual(['ai_income_99', 'ai_freelancing_499']);
  });

  it('the top tier grants everything', () => {
    expect(impliedProductIds('ai_client_acquisition_1499')).toEqual([...PRODUCT_LADDER]);
  });

  it('implication is always a prefix of the ladder', () => {
    for (const id of PRODUCT_LADDER) {
      const implied = impliedProductIds(id);
      expect(implied).toEqual(PRODUCT_LADDER.slice(0, implied.length));
    }
  });
});

describe('nextRung', () => {
  it('climbs one step at a time', () => {
    expect(nextRung('ai_income_99')).toBe('ai_freelancing_499');
    expect(nextRung('ai_freelancing_499')).toBe('ai_client_acquisition_1499');
  });

  it('returns null at the top, so the funnel has an end', () => {
    expect(nextRung('ai_client_acquisition_1499')).toBeNull();
  });
});
