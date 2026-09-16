import { describe, expect, it, vi } from 'vitest';

import { PRODUCT_CATALOG, PRODUCT_IDS } from '@acos/catalog';

import {
  buildCreateOrderRequest,
  CREATE_ORDER_ENDPOINT,
  createOrderRequest,
  toCheckoutError,
  UnsellableProductError,
} from './request';

const PRICE_FIELDS = ['amount', 'amountPaise', 'price', 'value', 'currency', 'total'];

describe('the browser has no price authority', () => {
  it('the request body contains only productId and contact details', () => {
    const body = buildCreateOrderRequest({
      productId: 'ai_freelancing_499',
      customerEmail: 'buyer@example.com',
      customerPhone: '+919876543210',
    });
    expect(Object.keys(body).sort()).toEqual(['customerEmail', 'customerPhone', 'productId']);
  });

  it.each(PRICE_FIELDS)('a caller-supplied %s never reaches the wire', (field) => {
    const body = buildCreateOrderRequest({
      productId: 'ai_income_99',
      customerEmail: 'a@b.com',
      [field]: 1,
    } as never);
    expect(Object.keys(body)).not.toContain(field);
    expect(JSON.stringify(body)).not.toContain('"1"');
  });

  it('sends no amount even though the UI displays one', () => {
    // The page renders ₹499 from the catalog; the request says only which
    // product. The server resolves the price from the same catalog.
    const body = buildCreateOrderRequest({
      productId: 'ai_freelancing_499',
      customerEmail: 'a@b.com',
    });
    expect(JSON.stringify(body)).not.toContain('49900');
    expect(PRODUCT_CATALOG.ai_freelancing_499.amountPaise).toBe(49_900);
  });

  it('omits an empty phone rather than sending a blank string', () => {
    const body = buildCreateOrderRequest({
      productId: 'ai_income_99',
      customerEmail: 'a@b.com',
      customerPhone: '   ',
    });
    expect(body).not.toHaveProperty('customerPhone');
  });

  it('trims contact details so whitespace cannot fork the idempotency key', () => {
    const body = buildCreateOrderRequest({
      productId: 'ai_income_99',
      customerEmail: '  a@b.com  ',
      customerPhone: ' +919876543210 ',
    });
    expect(body.customerEmail).toBe('a@b.com');
    expect(body.customerPhone).toBe('+919876543210');
  });
});

describe('product selection', () => {
  it.each(PRODUCT_IDS)('accepts the catalog product %s', (productId) => {
    expect(buildCreateOrderRequest({ productId, customerEmail: 'a@b.com' }).productId).toBe(
      productId,
    );
  });

  it.each(['', 'not_a_product', 'ai_income_99 ', 'AI_INCOME_99'])(
    'refuses %j before any network call',
    (productId) => {
      expect(() => buildCreateOrderRequest({ productId, customerEmail: 'a@b.com' })).toThrow(
        UnsellableProductError,
      );
    },
  );
});

describe('createOrderRequest', () => {
  const body = { productId: 'ai_income_99', customerEmail: 'a@b.com' } as const;

  it('posts JSON with the idempotency key header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ orderId: 'o1' }),
    });

    await createOrderRequest(body, 'key-123', fetchImpl as never);

    expect(fetchImpl).toHaveBeenCalledWith(
      CREATE_ORDER_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': 'key-123' },
      }),
    );
  });

  it('returns the server order on success', async () => {
    const order = { orderId: 'o1', amountPaise: 9900 };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => order });
    const result = await createOrderRequest(body, 'k', fetchImpl as never);
    expect(result).toEqual({ ok: true, order });
  });

  it('reports a network failure without throwing', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    const result = await createOrderRequest(body, 'k', fetchImpl as never);
    expect(result).toMatchObject({ ok: false, error: { kind: 'network' } });
  });

  it('survives a non-JSON error response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });
    const result = await createOrderRequest(body, 'k', fetchImpl as never);
    expect(result).toMatchObject({ ok: false, error: { kind: 'server' } });
  });
});

describe('error messages', () => {
  it('names the fixable thing for a validation failure', () => {
    expect(toCheckoutError(400).message).toMatch(/email/i);
  });

  it('distinguishes an unavailable product from bad input', () => {
    expect(toCheckoutError(400, 'INVALID_PRODUCT').kind).toBe('product');
    expect(toCheckoutError(400).kind).toBe('validation');
  });

  it('tells the person to retry when the provider is at fault', () => {
    expect(toCheckoutError(502)).toMatchObject({ kind: 'provider' });
    expect(toCheckoutError(502).message).toMatch(/try again/i);
  });

  it('never blames the person or leaks internals', () => {
    for (const status of [400, 500, 502, 418]) {
      const { message } = toCheckoutError(status);
      expect(message).not.toMatch(/you (did|entered) .*wrong/i);
      expect(message).not.toMatch(/stack|prisma|razorpay_key|undefined/i);
    }
  });
});
