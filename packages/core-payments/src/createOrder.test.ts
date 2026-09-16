import { describe, expect, it, vi } from 'vitest';

import {
  CreateOrderValidationError,
  IdempotencyKeyConflictError,
  InvalidProductError,
  OrderPersistenceError,
  RazorpayOrderCreationError,
} from './errors';
import { createOrder, idempotencyConflicts } from './createOrder';
import type { CreateOrderRecordInput, OrderRepository, PersistedOrder } from './orderRepository';
import { UniqueConstraintViolationError } from './orderRepository';
import type { CreateRazorpayOrderParams, RazorpayOrder, RazorpayOrdersClient } from './razorpayClient';

// -----------------------------------------------------------------------
// Pure unit tests: no real Postgres, no real Razorpay API. Both
// dependencies are hand-rolled fakes implementing the exact interfaces
// createOrder.ts depends on, so these tests run in milliseconds and
// exercise ONLY the orchestration logic in createOrder.ts — the real
// Prisma-backed and Razorpay-SDK-backed implementations are exercised
// separately by the integration tests in /tests/integration.
// -----------------------------------------------------------------------

const RAZORPAY_KEY_ID = 'rzp_test_fake_key_id';

function makeFakeRazorpay(overrides?: Partial<RazorpayOrdersClient>): RazorpayOrdersClient & {
  calls: CreateRazorpayOrderParams[];
} {
  const calls: CreateRazorpayOrderParams[] = [];
  return {
    calls,
    createOrder: vi.fn(async (params: CreateRazorpayOrderParams): Promise<RazorpayOrder> => {
      calls.push(params);
      return {
        razorpayOrderId: `order_fake_${calls.length}`,
        amountPaise: params.amountPaise,
        currency: params.currency,
        receipt: params.receipt,
        status: 'created',
      };
    }),
    ...overrides,
  };
}

function makeFakeOrderRepository(
  seed: PersistedOrder[] = [],
): OrderRepository & { rows: PersistedOrder[] } {
  const rows = [...seed];
  let nextId = rows.length + 1;
  return {
    rows,
    async findByIdempotencyKey(key: string) {
      return rows.find((r) => r.idempotencyKey === key) ?? null;
    },
    async create(input: CreateOrderRecordInput) {
      if (input.idempotencyKey && rows.some((r) => r.idempotencyKey === input.idempotencyKey)) {
        throw new UniqueConstraintViolationError(['idempotency_key']);
      }
      const row: PersistedOrder = {
        id: `local_${nextId++}`,
        razorpayOrderId: input.razorpayOrderId,
        idempotencyKey: input.idempotencyKey,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        productSlug: input.productSlug,
        productName: input.productName,
        amountPaise: input.amountPaise,
        currency: input.currency,
        status: 'PENDING',
        createdAt: new Date(),
      };
      rows.push(row);
      return row;
    },
  };
}

const VALID_BODY = {
  productId: 'ai_income_99',
  customerEmail: 'buyer@example.com',
};

describe('createOrder — valid input, happy path', () => {
  it('creates a Razorpay order using ONLY the catalog price, never a client-supplied one', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const result = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );

    expect(razorpay.calls).toHaveLength(1);
    expect(razorpay.calls[0]?.amountPaise).toBe(9900); // ai_income_99's catalog price
    expect(razorpay.calls[0]?.currency).toBe('INR');

    expect(result.amountPaise).toBe(9900);
    expect(result.currency).toBe('INR');
    expect(result.productId).toBe('ai_income_99');
    expect(result.productName).toBe('AI Income Starter Kit');
    expect(result.razorpayKeyId).toBe(RAZORPAY_KEY_ID);
    expect(result.status).toBe('PENDING');
  });

  it('a client-supplied amount/price field is REJECTED, not silently ignored', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const maliciousBody = { ...VALID_BODY, amountPaise: 1 }; // trying to pay ₹0.01
    await expect(
      createOrder(maliciousBody, { razorpayKeyId: RAZORPAY_KEY_ID }, { razorpay, orders }),
    ).rejects.toBeInstanceOf(CreateOrderValidationError);

    expect(razorpay.calls).toHaveLength(0); // never even reached Razorpay
  });

  it('persists a local order snapshot with the correct product/amount/customer data', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    await createOrder(
      { ...VALID_BODY, customerPhone: '+919876543210' },
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );

    expect(orders.rows).toHaveLength(1);
    const row = orders.rows[0]!;
    expect(row.productSlug).toBe('ai_income_99');
    expect(row.productName).toBe('AI Income Starter Kit');
    expect(row.amountPaise).toBe(9900);
    expect(row.currency).toBe('INR');
    expect(row.customerEmail).toBe('buyer@example.com');
    expect(row.customerPhone).toBe('+919876543210');
    expect(row.status).toBe('PENDING');
    expect(row.razorpayOrderId).toBe(razorpay.calls[0] && `order_fake_1`);
  });

  it('lower-cases and trims the customer email before persisting', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    await createOrder(
      { productId: 'ai_income_99', customerEmail: '  Buyer@Example.COM  ' },
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );

    expect(orders.rows[0]?.customerEmail).toBe('buyer@example.com');
  });

  it('returns only safe payment information — no secrets, no raw customer data', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const result = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );

    const keys = Object.keys(result).sort();
    expect(keys).toEqual(
      ['amountPaise', 'currency', 'orderId', 'productId', 'productName', 'razorpayKeyId', 'razorpayOrderId', 'status'].sort(),
    );
    expect(JSON.stringify(result)).not.toContain('buyer@example.com');
    expect(JSON.stringify(result)).not.toMatch(/secret/i);
  });
});

describe('createOrder — invalid product', () => {
  it.each(['not_a_real_product', '', 'AI_INCOME_99', '__proto__'])(
    'rejects productId=%s with InvalidProductError, without calling Razorpay',
    async (productId) => {
      const razorpay = makeFakeRazorpay();
      const orders = makeFakeOrderRepository();

      await expect(
        createOrder(
          { ...VALID_BODY, productId },
          { razorpayKeyId: RAZORPAY_KEY_ID },
          { razorpay, orders },
        ),
      ).rejects.toBeInstanceOf(productId === '' ? CreateOrderValidationError : InvalidProductError);

      expect(razorpay.calls).toHaveLength(0);
      expect(orders.rows).toHaveLength(0);
    },
  );

  it('InvalidProductError carries the offending productId', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    try {
      await createOrder(
        { ...VALID_BODY, productId: 'nonexistent' },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay, orders },
      );
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidProductError);
      expect((err as InvalidProductError).receivedProductId).toBe('nonexistent');
      expect((err as InvalidProductError).code).toBe('INVALID_PRODUCT');
    }
  });
});

describe('createOrder — invalid email', () => {
  it.each([
    'not-an-email',
    'missing-domain@',
    '@missing-local.com',
    'spaces in@email.com',
    '',
    undefined,
    123,
    null,
  ])('rejects customerEmail=%o with CreateOrderValidationError', async (customerEmail) => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    await expect(
      createOrder(
        { productId: 'ai_income_99', customerEmail },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay, orders },
      ),
    ).rejects.toBeInstanceOf(CreateOrderValidationError);

    expect(razorpay.calls).toHaveLength(0);
  });

  it('rejects an invalid customerPhone format when provided', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    await expect(
      createOrder(
        { ...VALID_BODY, customerPhone: 'not-a-phone-number' },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay, orders },
      ),
    ).rejects.toBeInstanceOf(CreateOrderValidationError);
  });

  it('CreateOrderValidationError exposes structured issues, not just a message string', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    try {
      await createOrder(
        { productId: 'ai_income_99', customerEmail: 'bad' },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay, orders },
      );
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(CreateOrderValidationError);
      const issues = (err as CreateOrderValidationError).issues;
      expect(issues.some((i) => i.path === 'customerEmail')).toBe(true);
    }
  });
});

describe('createOrder — Razorpay failure', () => {
  it('propagates RazorpayOrderCreationError and never persists a local order', async () => {
    const razorpay = makeFakeRazorpay({
      createOrder: vi.fn(async () => {
        throw new RazorpayOrderCreationError('Razorpay order creation failed: network timeout');
      }),
    });
    const orders = makeFakeOrderRepository();

    await expect(
      createOrder(VALID_BODY, { razorpayKeyId: RAZORPAY_KEY_ID }, { razorpay, orders }),
    ).rejects.toBeInstanceOf(RazorpayOrderCreationError);

    expect(orders.rows).toHaveLength(0);
  });
});

describe('createOrder — database failure', () => {
  it('wraps a generic repository failure in OrderPersistenceError', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    orders.create = vi.fn(async () => {
      throw new Error('connection terminated unexpectedly');
    });

    await expect(
      createOrder(VALID_BODY, { razorpayKeyId: RAZORPAY_KEY_ID }, { razorpay, orders }),
    ).rejects.toBeInstanceOf(OrderPersistenceError);
  });

  it('wraps a findByIdempotencyKey failure in OrderPersistenceError', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    orders.findByIdempotencyKey = vi.fn(async () => {
      throw new Error('connection terminated unexpectedly');
    });

    await expect(
      createOrder(
        VALID_BODY,
        { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey: 'some-key' },
        { razorpay, orders },
      ),
    ).rejects.toBeInstanceOf(OrderPersistenceError);
  });
});

describe('createOrder — duplicate/retry requests (idempotency)', () => {
  it('returns the SAME order info on a retried request with the same Idempotency-Key, without calling Razorpay again', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    const idempotencyKey = 'checkout-attempt-abc123';

    const first = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
      { razorpay, orders },
    );
    const second = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
      { razorpay, orders },
    );

    expect(razorpay.calls).toHaveLength(1); // NOT called twice
    expect(second).toEqual(first);
    expect(orders.rows).toHaveLength(1); // only one local order ever created
  });

  it('two DIFFERENT idempotency keys for the same product/customer create two separate orders', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const first = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey: 'attempt-1' },
      { razorpay, orders },
    );
    const second = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey: 'attempt-2' },
      { razorpay, orders },
    );

    expect(razorpay.calls).toHaveLength(2);
    expect(first.orderId).not.toBe(second.orderId);
    expect(orders.rows).toHaveLength(2);
  });

  it('self-heals a concurrent race on the same Idempotency-Key by returning the winner\'s row', async () => {
    // Simulates two requests racing: both pass the "not found yet" check,
    // both call Razorpay, but only one wins the DB insert — the loser's
    // repository.create() throws UniqueConstraintViolationError, which
    // createOrder must catch and resolve by re-reading the winner's row.
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    const idempotencyKey = 'race-key';

    // Seed the "winner" row as if the other concurrent request already committed it.
    const winnerRow: PersistedOrder = {
      id: 'winner_local_id',
      razorpayOrderId: 'order_winner',
      idempotencyKey,
      customerEmail: 'buyer@example.com',
      customerPhone: null,
      productSlug: 'ai_income_99',
      productName: 'AI Income Starter Kit',
      amountPaise: 9900,
      currency: 'INR',
      status: 'PENDING',
      createdAt: new Date(),
    };

    // First call to findByIdempotencyKey (the pre-check) returns null —
    // simulating that this request started before the winner committed.
    let findCallCount = 0;
    orders.findByIdempotencyKey = vi.fn(async () => {
      findCallCount += 1;
      // pre-check (call #1): not found yet. post-race-failure re-read
      // (call #2): winner is now visible.
      return findCallCount === 1 ? null : winnerRow;
    });
    orders.create = vi.fn(async () => {
      throw new UniqueConstraintViolationError(['idempotency_key']);
    });

    const result = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey },
      { razorpay, orders },
    );

    expect(result.orderId).toBe('winner_local_id');
    expect(result.razorpayOrderId).toBe('order_winner');
    // This request's own Razorpay order (order_fake_1) is now orphaned on
    // Razorpay's side — a known, documented, bounded consequence (see
    // createOrder.ts's TODO comment on IdempotencyReconciliation).
    expect(razorpay.calls).toHaveLength(1);
  });

  it('a request with NO Idempotency-Key never dedupes, even for identical bodies', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const first = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );
    const second = await createOrder(
      VALID_BODY,
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );

    expect(razorpay.calls).toHaveLength(2);
    expect(first.orderId).not.toBe(second.orderId);
  });
});

// ================================== idempotency key binding semantics ===
//
// An idempotency key is a promise about ONE request: "if you see this key
// again, it is that same request being retried." A hit is therefore not
// automatically a retry — it is only a retry if the request matches.
//
// Before this, a key reused with a different product or a different email
// silently returned the first order. The caller asked to buy the ₹1,499
// system and was handed the ₹99 kit, or handed an order belonging to
// somebody else entirely.

const KEY = 'idem_11111111-2222-3333-4444-555555555555';
const STARTER = 'ai_income_99';
const SYSTEM = 'ai_client_acquisition_1499';

async function create(
  body: Record<string, unknown>,
  deps: { razorpay: RazorpayOrdersClient; orders: OrderRepository },
  idempotencyKey = KEY,
) {
  return createOrder(body, { razorpayKeyId: RAZORPAY_KEY_ID, idempotencyKey }, deps);
}

describe('idempotencyConflicts — which attributes bind to a key', () => {
  const base = {
    productSlug: STARTER,
    customerEmail: 'a@example.com',
    customerPhone: '+919999999999',
  };

  it('reports nothing for an identical request', () => {
    expect(idempotencyConflicts(base, { ...base })).toEqual([]);
  });

  it('reports the product', () => {
    expect(idempotencyConflicts(base, { ...base, productSlug: SYSTEM })).toEqual(['productSlug']);
  });

  it('reports the email', () => {
    expect(idempotencyConflicts(base, { ...base, customerEmail: 'b@example.com' })).toEqual([
      'customerEmail',
    ]);
  });

  it('reports the phone — it is part of the request body', () => {
    expect(idempotencyConflicts(base, { ...base, customerPhone: '+918888888888' })).toEqual([
      'customerPhone',
    ]);
  });

  it('reports adding or removing an optional phone', () => {
    expect(idempotencyConflicts(base, { ...base, customerPhone: null })).toEqual(['customerPhone']);
    expect(
      idempotencyConflicts({ ...base, customerPhone: null }, base),
    ).toEqual(['customerPhone']);
  });

  it('reports every differing field, not just the first', () => {
    expect(
      idempotencyConflicts(base, {
        productSlug: SYSTEM,
        customerEmail: 'b@example.com',
        customerPhone: null,
      }),
    ).toEqual(['productSlug', 'customerEmail', 'customerPhone']);
  });

  it('ignores case and surrounding whitespace on the email', () => {
    expect(idempotencyConflicts(base, { ...base, customerEmail: '  A@Example.COM ' })).toEqual([]);
  });
});

describe('idempotency key reuse', () => {
  // ------------------------------------------------------------- 1 ----
  it('1. same key + same request -> the same order, and no second Razorpay order', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const first = await create({ productId: STARTER, customerEmail: 'a@example.com' }, {
      razorpay,
      orders,
    });
    const second = await create({ productId: STARTER, customerEmail: 'a@example.com' }, {
      razorpay,
      orders,
    });

    expect(second).toEqual(first);
    expect(orders.rows).toHaveLength(1);
    // The retry must not burn provider quota or create an orphan.
    expect(razorpay.calls).toHaveLength(1);
  });

  it('1b. treats a differently-cased email as the same request', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const first = await create({ productId: STARTER, customerEmail: 'a@example.com' }, {
      razorpay,
      orders,
    });
    const second = await create({ productId: STARTER, customerEmail: 'A@Example.COM' }, {
      razorpay,
      orders,
    });

    expect(second.orderId).toBe(first.orderId);
    expect(orders.rows).toHaveLength(1);
  });

  // ------------------------------------------------------------- 2 ----
  it('2. same key + different product -> conflict, not the first order', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const first = await create({ productId: STARTER, customerEmail: 'a@example.com' }, {
      razorpay,
      orders,
    });

    await expect(
      create({ productId: SYSTEM, customerEmail: 'a@example.com' }, { razorpay, orders }),
    ).rejects.toBeInstanceOf(IdempotencyKeyConflictError);

    // Nothing was created, and the first order was not handed over.
    expect(orders.rows).toHaveLength(1);
    expect(orders.rows[0]!.productSlug).toBe(STARTER);
    expect(first.amountPaise).toBe(9900);
    // The ₹1,499 request never reached Razorpay.
    expect(razorpay.calls).toHaveLength(1);
  });

  it('2b. the conflict names the field and leaks no stored value', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    await create({ productId: STARTER, customerEmail: 'victim@example.com' }, { razorpay, orders });

    let error: unknown;
    try {
      await create({ productId: SYSTEM, customerEmail: 'attacker@example.com' }, {
        razorpay,
        orders,
      });
      expect.unreachable('expected an idempotency conflict');
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(IdempotencyKeyConflictError);
    const conflict = error as IdempotencyKeyConflictError;
    expect(conflict.conflictingFields).toEqual(['productSlug', 'customerEmail']);
    expect(conflict.code).toBe('IDEMPOTENCY_KEY_CONFLICT');
    // A guessed key must not become an oracle for someone else's data.
    expect(conflict.message).not.toContain('victim@example.com');
    expect(conflict.message).not.toContain(STARTER);
  });

  // ------------------------------------------------------------- 3 ----
  it('3. same key + different email -> conflict', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    await create({ productId: STARTER, customerEmail: 'a@example.com' }, { razorpay, orders });

    await expect(
      create({ productId: STARTER, customerEmail: 'b@example.com' }, { razorpay, orders }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_CONFLICT' });
    expect(orders.rows).toHaveLength(1);
    expect(orders.rows[0]!.customerEmail).toBe('a@example.com');
  });

  it('3b. same key + different phone -> conflict', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    await create(
      { productId: STARTER, customerEmail: 'a@example.com', customerPhone: '+919999999999' },
      { razorpay, orders },
    );

    await expect(
      create(
        { productId: STARTER, customerEmail: 'a@example.com', customerPhone: '+918888888888' },
        { razorpay, orders },
      ),
    ).rejects.toMatchObject({ conflictingFields: ['customerPhone'] });
  });

  // ------------------------------------------------------------- 4 ----
  it('4. concurrent identical requests -> exactly one logical order', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    const body = { productId: STARTER, customerEmail: 'a@example.com' };

    const results = await Promise.all([
      create(body, { razorpay, orders }),
      create(body, { razorpay, orders }),
      create(body, { razorpay, orders }),
    ]);

    // All three callers get the same order id...
    expect(new Set(results.map((r) => r.orderId)).size).toBe(1);
    // ...and only one row exists.
    expect(orders.rows).toHaveLength(1);
  });

  // ------------------------------------------------------------- 5 ----
  it('5. concurrent conflicting requests -> the loser is refused, never silently reused', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const settled = await Promise.allSettled([
      create({ productId: STARTER, customerEmail: 'a@example.com' }, { razorpay, orders }),
      create({ productId: SYSTEM, customerEmail: 'b@example.com' }, { razorpay, orders }),
    ]);

    const fulfilled = settled.filter((r) => r.status === 'fulfilled');
    const rejected = settled.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      IdempotencyKeyConflictError,
    );
    expect(orders.rows).toHaveLength(1);

    // The winner got its OWN product, not the other request's.
    const winner = (fulfilled[0] as PromiseFulfilledResult<{ productId: string }>).value;
    expect(winner.productId).toBe(orders.rows[0]!.productSlug);
  });

  // ------------------------------------------------------------- 6 ----
  it('6. a blank or whitespace-only key is ignored, not treated as a key', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    const body = { productId: STARTER, customerEmail: 'a@example.com' };

    const a = await create(body, { razorpay, orders }, '   ');
    const b = await create(body, { razorpay, orders }, '');

    // No key means no idempotency: two independent orders, no conflict.
    expect(a.orderId).not.toBe(b.orderId);
    expect(orders.rows).toHaveLength(2);
    expect(orders.rows.every((r) => r.idempotencyKey === null)).toBe(true);
  });

  it('6b. without a key, a different product is simply a different order', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    await createOrder(
      { productId: STARTER, customerEmail: 'a@example.com' },
      { razorpayKeyId: RAZORPAY_KEY_ID },
      { razorpay, orders },
    );
    await expect(
      createOrder(
        { productId: SYSTEM, customerEmail: 'a@example.com' },
        { razorpayKeyId: RAZORPAY_KEY_ID },
        { razorpay, orders },
      ),
    ).resolves.toBeDefined();
    expect(orders.rows).toHaveLength(2);
  });

  // ------------------------------------------------------------- 7 ----
  it('7. a new key -> a new order, priced from the catalog', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();

    const first = await create({ productId: STARTER, customerEmail: 'a@example.com' }, {
      razorpay,
      orders,
    });
    const second = await create(
      { productId: SYSTEM, customerEmail: 'a@example.com' },
      { razorpay, orders },
      'idem_a-completely-different-key',
    );

    expect(second.orderId).not.toBe(first.orderId);
    expect(orders.rows).toHaveLength(2);
    // Server-side pricing preserved on both.
    expect(first.amountPaise).toBe(9900);
    expect(second.amountPaise).toBe(149900);
  });

  it('preserves server-side pricing even on a replay', async () => {
    const razorpay = makeFakeRazorpay();
    const orders = makeFakeOrderRepository();
    const body = { productId: SYSTEM, customerEmail: 'a@example.com' };

    const first = await create(body, { razorpay, orders });
    const replay = await create(body, { razorpay, orders });

    expect(replay.amountPaise).toBe(149900);
    expect(replay.amountPaise).toBe(first.amountPaise);
    // And a client that tries to smuggle a price is still rejected outright.
    await expect(
      create({ ...body, amountPaise: 1 }, { razorpay, orders }, 'idem_price-attempt'),
    ).rejects.toBeInstanceOf(CreateOrderValidationError);
  });
});
