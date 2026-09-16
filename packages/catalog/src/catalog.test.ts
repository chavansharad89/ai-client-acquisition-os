import { describe, expect, it } from 'vitest';

import { InvalidProductIdError } from './errors';
import { formatPaiseAsInr, paiseToWholeRupees } from './format';
import { PRODUCT_CATALOG, PRODUCT_IDS, listProducts } from './products';
import type { Product, ProductId } from './types';
import { getProduct, isValidProductId, resolveProduct } from './validate';

const EXPECTED_PRODUCT_IDS: ProductId[] = [
  'ai_income_99',
  'ai_freelancing_499',
  'ai_client_acquisition_1499',
];

describe('catalog completeness', () => {
  it('contains exactly the three specified products — no more, no fewer', () => {
    expect(PRODUCT_IDS.slice().sort()).toEqual(EXPECTED_PRODUCT_IDS.slice().sort());
    expect(Object.keys(PRODUCT_CATALOG).sort()).toEqual(EXPECTED_PRODUCT_IDS.slice().sort());
  });

  it('every catalog entry\'s own id matches its key in the catalog', () => {
    for (const id of PRODUCT_IDS) {
      expect(PRODUCT_CATALOG[id].id).toBe(id);
    }
  });

  it('listProducts() returns every product exactly once', () => {
    const listed = listProducts();
    expect(listed).toHaveLength(EXPECTED_PRODUCT_IDS.length);
    expect(listed.map((p) => p.id).sort()).toEqual(EXPECTED_PRODUCT_IDS.slice().sort());
  });
});

describe('valid product ids', () => {
  it.each(EXPECTED_PRODUCT_IDS)('isValidProductId(%s) is true', (id) => {
    expect(isValidProductId(id)).toBe(true);
  });

  it.each(EXPECTED_PRODUCT_IDS)('resolveProduct(%s) returns the catalog entry', (id) => {
    const product = resolveProduct(id);
    expect(product).toBe(PRODUCT_CATALOG[id]); // same frozen reference, not a copy
    expect(product.id).toBe(id);
  });

  it.each(EXPECTED_PRODUCT_IDS)('getProduct(%s) matches resolveProduct(%s)', (id) => {
    expect(getProduct(id)).toBe(resolveProduct(id));
  });
});

describe('invalid product ids', () => {
  const invalidValues: unknown[] = [
    'ai_income_100', // close but wrong
    'AI_INCOME_99', // wrong case
    'ai_income_99 ', // trailing whitespace
    ' ai_income_99', // leading whitespace
    '',
    'undefined',
    'null',
    '__proto__', // prototype-chain lookalike
    'constructor',
    'toString',
    'hasOwnProperty',
    123,
    null,
    undefined,
    {},
    [],
    { id: 'ai_income_99' },
    ['ai_income_99'],
    Symbol('ai_income_99'),
  ];

  it.each(invalidValues)('isValidProductId returns false for %o', (value) => {
    expect(isValidProductId(value)).toBe(false);
  });

  it.each(invalidValues)('resolveProduct throws InvalidProductIdError for %o', (value) => {
    expect(() => resolveProduct(value)).toThrow(InvalidProductIdError);
  });

  it('InvalidProductIdError carries the offending value for logging/debugging', () => {
    try {
      resolveProduct('not-a-real-product');
      expect.unreachable('resolveProduct should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidProductIdError);
      expect((err as InvalidProductIdError).receivedValue).toBe('not-a-real-product');
      expect((err as InvalidProductIdError).message).toContain('not-a-real-product');
    }
  });

  it('a prototype-pollution-style key never resolves to a real property value', () => {
    // Guards against a naive `PRODUCT_CATALOG[value]` implementation that
    // would return Object.prototype methods for keys like "toString".
    expect(isValidProductId('toString')).toBe(false);
    expect(() => resolveProduct('toString')).toThrow(InvalidProductIdError);
  });
});

describe('correct amounts', () => {
  const expected: Record<ProductId, { amountPaise: number; metaValueInr: number; name: string }> = {
    ai_income_99: {
      amountPaise: 9900,
      metaValueInr: 99,
      name: 'AI Income Starter Kit',
    },
    ai_freelancing_499: {
      amountPaise: 49900,
      metaValueInr: 499,
      name: 'AI Freelancing Launch Kit',
    },
    ai_client_acquisition_1499: {
      amountPaise: 149900,
      metaValueInr: 1499,
      name: 'AI Client Acquisition System',
    },
  };

  it.each(Object.entries(expected))('%s has the exact expected amount and name', (id, exp) => {
    const product = PRODUCT_CATALOG[id as ProductId];
    expect(product.amountPaise).toBe(exp.amountPaise);
    expect(product.metaValueInr).toBe(exp.metaValueInr);
    expect(product.name).toBe(exp.name);
    expect(product.currency).toBe('INR');
  });

  it('amountPaise strictly increases with tier (Starter < Launch < Acquisition)', () => {
    expect(PRODUCT_CATALOG.ai_income_99.amountPaise).toBeLessThan(
      PRODUCT_CATALOG.ai_freelancing_499.amountPaise,
    );
    expect(PRODUCT_CATALOG.ai_freelancing_499.amountPaise).toBeLessThan(
      PRODUCT_CATALOG.ai_client_acquisition_1499.amountPaise,
    );
  });
});

describe('no floating-point monetary calculations', () => {
  it('every amountPaise is an integer (never a float)', () => {
    for (const id of PRODUCT_IDS) {
      expect(Number.isInteger(PRODUCT_CATALOG[id].amountPaise)).toBe(true);
    }
  });

  it('every metaValueInr is an integer (never a float)', () => {
    for (const id of PRODUCT_IDS) {
      expect(Number.isInteger(PRODUCT_CATALOG[id].metaValueInr)).toBe(true);
    }
  });

  it('every amountPaise is an exact whole-rupee amount (divisible by 100 with no remainder)', () => {
    for (const id of PRODUCT_IDS) {
      // Integer modulo — not float division — so this is exact.
      expect(PRODUCT_CATALOG[id].amountPaise % 100).toBe(0);
    }
  });

  it('metaValueInr and amountPaise never drift apart: metaValueInr * 100 === amountPaise exactly', () => {
    // This is the load-bearing test: it proves the two independently
    // stored representations agree, using only integer multiplication
    // (never division, which is the more failure-prone direction for
    // floating point in general, though not actually lossy for these
    // particular values — the point is the *pattern* this test locks in).
    for (const id of PRODUCT_IDS) {
      const product = PRODUCT_CATALOG[id];
      expect(product.metaValueInr * 100).toBe(product.amountPaise);
    }
  });

  it('summing all three product prices in paise matches the hand-computed integer total exactly', () => {
    // Demonstrates that repeated integer addition across the catalog
    // introduces no drift — the kind of check that WOULD catch a bug if
    // amounts were ever stored as floats (e.g. 99.00) instead of integers.
    const total = PRODUCT_IDS.reduce((sum, id) => sum + PRODUCT_CATALOG[id].amountPaise, 0);
    expect(total).toBe(9900 + 49900 + 149900);
    expect(Number.isInteger(total)).toBe(true);
  });

  it('paiseToWholeRupees performs exact integer division, never a lossy float result', () => {
    expect(paiseToWholeRupees(9900)).toBe(99);
    expect(paiseToWholeRupees(49900)).toBe(499);
    expect(paiseToWholeRupees(149900)).toBe(1499);
  });

  it('paiseToWholeRupees rejects a non-whole-rupee amount rather than silently truncating', () => {
    expect(() => paiseToWholeRupees(9950)).toThrow(RangeError);
    expect(() => paiseToWholeRupees(1.5)).toThrow(RangeError);
  });

  it('formatPaiseAsInr renders the exact catalog price with no rounding artifacts', () => {
    expect(formatPaiseAsInr(PRODUCT_CATALOG.ai_income_99.amountPaise)).toBe('\u20B999');
    expect(formatPaiseAsInr(PRODUCT_CATALOG.ai_freelancing_499.amountPaise)).toBe('\u20B9499');
    expect(formatPaiseAsInr(PRODUCT_CATALOG.ai_client_acquisition_1499.amountPaise)).toBe(
      '\u20B91499',
    );
  });
});

describe('immutability (client/caller can never mutate authoritative pricing)', () => {
  it('PRODUCT_CATALOG itself is frozen', () => {
    expect(Object.isFrozen(PRODUCT_CATALOG)).toBe(true);
  });

  it('every individual product entry is frozen', () => {
    for (const id of PRODUCT_IDS) {
      expect(Object.isFrozen(PRODUCT_CATALOG[id])).toBe(true);
    }
  });

  it('attempting to mutate a product field does not change the stored value', () => {
    const product = PRODUCT_CATALOG.ai_income_99;
    const original = product.amountPaise;
    expect(() => {
      // @ts-expect-error — readonly at the type level; verifying the
      // runtime Object.freeze backs that up even if a caller casts past it.
      product.amountPaise = 1;
    }).toThrow(TypeError); // frozen objects throw on write in strict mode (ESM is strict by default)
    expect(PRODUCT_CATALOG.ai_income_99.amountPaise).toBe(original);
  });

  it('attempting to add a new product to the catalog does not change PRODUCT_IDS', () => {
    // Cast past the Record<ProductId, Product> key restriction to prove
    // the RUNTIME Object.freeze is what actually stops this, not just
    // the type system (a caller could reach this via plain JS/any).
    const mutableCatalog = PRODUCT_CATALOG as unknown as Record<string, Product>;
    expect(() => {
      mutableCatalog.new_product = {
        id: 'new_product' as ProductId,
        name: 'Should not be addable',
        amountPaise: 1,
        currency: 'INR',
        metaValueInr: 1,
      };
    }).toThrow(TypeError);
    expect(PRODUCT_IDS).toHaveLength(3);
  });

  it('mutating an object returned from listProducts() does not affect the catalog', () => {
    const products = listProducts();
    const first = products[0];
    expect(first).toBeDefined();
    const mutableFirst = first as unknown as { name: string };
    expect(() => {
      mutableFirst.name = 'Tampered';
    }).toThrow(TypeError);
    expect(PRODUCT_CATALOG[(first as Product).id].name).toBe((first as Product).name);
  });
});

describe('type safety at compile time (documented via comments — see also tsc --noEmit)', () => {
  it('ProductId values are exactly the three literals (runtime mirror of the compile-time union)', () => {
    // If a fourth literal were ever added to the ProductId union in
    // types.ts without a matching catalog entry, `products.ts`'s
    // `satisfies Record<ProductId, Product>` would fail to compile —
    // this test is the runtime counterpart of that guarantee.
    const idsFromType: ProductId[] = EXPECTED_PRODUCT_IDS;
    expect(idsFromType.every((id) => id in PRODUCT_CATALOG)).toBe(true);
  });
});
