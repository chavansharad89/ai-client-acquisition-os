import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// -----------------------------------------------------------------------
// All tests in this file mock the `razorpay` SDK package entirely — no
// real HTTP call is ever made. `vi.hoisted` is required here (not just
// plain top-level `const`) because `vi.mock` factories run before any
// other module-level code, including normal `const` initializers; using
// plain consts referenced inside the factory would hit a temporal-dead-
// zone error at mock-setup time.
// -----------------------------------------------------------------------

const { mockOrdersCreate, mockPaymentsFetch, MockRazorpayConstructor } = vi.hoisted(() => {
  const mockOrdersCreate = vi.fn();
  const mockPaymentsFetch = vi.fn();
  const MockRazorpayConstructor = vi.fn().mockImplementation(() => ({
    orders: { create: mockOrdersCreate },
    payments: { fetch: mockPaymentsFetch },
  }));
  return { mockOrdersCreate, mockPaymentsFetch, MockRazorpayConstructor };
});

vi.mock('razorpay', () => ({
  default: MockRazorpayConstructor,
}));

const { createRazorpayClient, validateRazorpayEnv, RazorpayConfigError, RazorpayApiError } =
  await import('./client');

const FAKE_ENV = { keyId: 'rzp_test_fake_key_id', keySecret: 'fake_secret_do_not_leak_12345' };

/** Serializes every own property of an object, deeply, with NO key
 *  allow-list filtering — unlike `JSON.stringify(obj, arrayOfKeys)`,
 *  which (because the same key array is reapplied at every nesting
 *  level) can silently hide leaked data in nested objects whose keys
 *  aren't in the allow-list. This is deliberately paranoid: it exists
 *  only to make the secret-leak tests below trustworthy. */
function deepSerializeOwnProperties(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value as object)) {
    return '[circular]';
  }
  seen.add(value as object);
  const result: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = deepSerializeOwnProperties((value as Record<string, unknown>)[key], seen);
  }
  return result;
}

beforeEach(() => {
  mockOrdersCreate.mockReset();
  mockPaymentsFetch.mockReset();
  MockRazorpayConstructor.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('validateRazorpayEnv', () => {
  it('returns keyId/keySecret when both env vars are present', () => {
    const env = validateRazorpayEnv({
      RAZORPAY_KEY_ID: 'rzp_live_abc',
      RAZORPAY_KEY_SECRET: 'shh_secret',
    });
    expect(env).toEqual({ keyId: 'rzp_live_abc', keySecret: 'shh_secret' });
  });

  it('throws RazorpayConfigError when RAZORPAY_KEY_ID is missing', () => {
    expect(() => validateRazorpayEnv({ RAZORPAY_KEY_SECRET: 'shh_secret' })).toThrow(
      RazorpayConfigError,
    );
  });

  it('throws RazorpayConfigError when RAZORPAY_KEY_SECRET is missing', () => {
    expect(() => validateRazorpayEnv({ RAZORPAY_KEY_ID: 'rzp_live_abc' })).toThrow(
      RazorpayConfigError,
    );
  });

  it('throws RazorpayConfigError when both are missing', () => {
    expect(() => validateRazorpayEnv({})).toThrow(RazorpayConfigError);
  });

  it('throws when a var is present but empty string', () => {
    expect(() => validateRazorpayEnv({ RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: 'x' })).toThrow(
      RazorpayConfigError,
    );
  });

  it('the error message names which variable is missing, never a secret value', () => {
    try {
      validateRazorpayEnv({ RAZORPAY_KEY_ID: 'rzp_live_abc' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RazorpayConfigError);
      expect((err as Error).message).toContain('RAZORPAY_KEY_SECRET');
    }
  });
});

describe('createRazorpayClient — construction', () => {
  it('constructs the SDK exactly once with the provided credentials', () => {
    createRazorpayClient(FAKE_ENV);
    expect(MockRazorpayConstructor).toHaveBeenCalledTimes(1);
    expect(MockRazorpayConstructor).toHaveBeenCalledWith({
      key_id: FAKE_ENV.keyId,
      key_secret: FAKE_ENV.keySecret,
    });
  });

  it('defaults to validating process.env when no env is passed', () => {
    vi.stubEnv('RAZORPAY_KEY_ID', 'rzp_from_process_env');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'secret_from_process_env');

    createRazorpayClient();

    expect(MockRazorpayConstructor).toHaveBeenCalledWith({
      key_id: 'rzp_from_process_env',
      key_secret: 'secret_from_process_env',
    });
  });

  it('propagates RazorpayConfigError if process.env is invalid and no explicit env is passed', () => {
    vi.stubEnv('RAZORPAY_KEY_ID', '');
    vi.stubEnv('RAZORPAY_KEY_SECRET', '');
    expect(() => createRazorpayClient()).toThrow(RazorpayConfigError);
  });
});

describe('createRazorpayClient — createOrder', () => {
  it('calls the SDK with exactly the given amount/currency/receipt (no client-side recomputation)', async () => {
    mockOrdersCreate.mockResolvedValueOnce({
      id: 'order_abc123',
      amount: 9900,
      currency: 'INR',
      receipt: 'local-order-1',
      status: 'created',
    });

    const client = createRazorpayClient(FAKE_ENV);
    await client.createOrder({
      amountPaise: 9900,
      currency: 'INR',
      receipt: 'local-order-1',
      notes: { productId: 'ai_income_99' },
    });

    expect(mockOrdersCreate).toHaveBeenCalledWith({
      amount: 9900,
      currency: 'INR',
      receipt: 'local-order-1',
      notes: { productId: 'ai_income_99' },
    });
  });

  it('maps a successful response into RazorpayOrderResult', async () => {
    mockOrdersCreate.mockResolvedValueOnce({
      id: 'order_abc123',
      amount: 49900,
      currency: 'INR',
      receipt: 'local-order-2',
      status: 'created',
    });

    const client = createRazorpayClient(FAKE_ENV);
    const result = await client.createOrder({
      amountPaise: 49900,
      currency: 'INR',
      receipt: 'local-order-2',
    });

    expect(result).toEqual({
      id: 'order_abc123',
      amountPaise: 49900,
      currency: 'INR',
      receipt: 'local-order-2',
      status: 'created',
    });
  });

  it('normalizes a string amount from the SDK into a number, with no precision loss', async () => {
    mockOrdersCreate.mockResolvedValueOnce({
      id: 'order_xyz',
      amount: '149900', // some SDK/API versions return amount as a string
      currency: 'INR',
      status: 'created',
    });

    const client = createRazorpayClient(FAKE_ENV);
    const result = await client.createOrder({
      amountPaise: 149900,
      currency: 'INR',
      receipt: 'local-order-3',
    });

    expect(result.amountPaise).toBe(149900);
    expect(Number.isInteger(result.amountPaise)).toBe(true);
  });

  it('never makes a real network call — only the mocked SDK method is invoked', async () => {
    mockOrdersCreate.mockResolvedValueOnce({
      id: 'order_1',
      amount: 9900,
      currency: 'INR',
      status: 'created',
    });
    const client = createRazorpayClient(FAKE_ENV);
    await client.createOrder({ amountPaise: 9900, currency: 'INR', receipt: 'r1' });

    expect(mockOrdersCreate).toHaveBeenCalledTimes(1);
    // The constructor was only ever called with our fake credentials —
    // there is no code path here that could reach a real Razorpay host.
    expect(MockRazorpayConstructor).toHaveBeenCalledWith({
      key_id: FAKE_ENV.keyId,
      key_secret: FAKE_ENV.keySecret,
    });
  });

  it('wraps an SDK failure in RazorpayApiError with sanitized fields', async () => {
    mockOrdersCreate.mockRejectedValueOnce({
      statusCode: 400,
      error: {
        code: 'BAD_REQUEST_ERROR',
        description: 'The amount must be at least INR 1.00',
        reason: 'input_validation_failed',
      },
    });

    const client = createRazorpayClient(FAKE_ENV);
    let thrown: unknown;
    try {
      await client.createOrder({ amountPaise: 0, currency: 'INR', receipt: 'r2' });
      expect.unreachable('should have thrown');
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(RazorpayApiError);
    const apiErr = thrown as InstanceType<typeof RazorpayApiError>;
    expect(apiErr.operation).toBe('createOrder');
    expect(apiErr.statusCode).toBe(400);
    expect(apiErr.errorCode).toBe('BAD_REQUEST_ERROR');
    expect(apiErr.description).toContain('amount must be at least');
  });

  it('CRITICAL: never leaks the key secret when the SDK error object carries an Authorization header', async () => {
    // Simulates the realistic failure mode: an Axios-style error where
    // the outgoing request config (including the Basic-Auth header built
    // from key_id:key_secret) is attached to the error object, as real
    // HTTP client libraries commonly do.
    const leakySecretSubstring = FAKE_ENV.keySecret;
    const base64Credentials = Buffer.from(`${FAKE_ENV.keyId}:${FAKE_ENV.keySecret}`).toString(
      'base64',
    );

    mockOrdersCreate.mockRejectedValueOnce({
      statusCode: 401,
      error: { code: 'UNAUTHORIZED', description: 'Authentication failed' },
      // The leak vector: a raw HTTP client error commonly attaches the
      // full outgoing request, including auth headers, here.
      config: {
        headers: { Authorization: `Basic ${base64Credentials}` },
      },
      request: { path: '/v1/orders', auth: `${FAKE_ENV.keyId}:${FAKE_ENV.keySecret}` },
    });

    const client = createRazorpayClient(FAKE_ENV);
    let thrown: unknown;
    try {
      await client.createOrder({ amountPaise: 9900, currency: 'INR', receipt: 'r3' });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(RazorpayApiError);
    const serialized = JSON.stringify(deepSerializeOwnProperties(thrown));
    expect(serialized).not.toContain(leakySecretSubstring);
    expect(serialized).not.toContain(base64Credentials);
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('config');
    expect(serialized).not.toContain('request');
  });
});

describe('createRazorpayClient — fetchPayment', () => {
  it('calls the SDK with the given payment id', async () => {
    mockPaymentsFetch.mockResolvedValueOnce({
      id: 'pay_abc123',
      order_id: 'order_abc123',
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      method: 'card',
      captured: true,
      created_at: 1_700_000_000,
    });

    const client = createRazorpayClient(FAKE_ENV);
    await client.fetchPayment('pay_abc123');

    expect(mockPaymentsFetch).toHaveBeenCalledWith('pay_abc123');
  });

  it('maps a successful response into FetchPaymentResult, including a proper Date', async () => {
    mockPaymentsFetch.mockResolvedValueOnce({
      id: 'pay_abc123',
      order_id: 'order_abc123',
      amount: 49900,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      captured: true,
      created_at: 1_700_000_000, // unix seconds
    });

    const client = createRazorpayClient(FAKE_ENV);
    const result = await client.fetchPayment('pay_abc123');

    expect(result).toEqual({
      id: 'pay_abc123',
      orderId: 'order_abc123',
      amountPaise: 49900,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      captured: true,
      createdAt: new Date(1_700_000_000 * 1000),
    });
  });

  it('maps a payment with no order_id to orderId: null (not undefined, not omitted)', async () => {
    mockPaymentsFetch.mockResolvedValueOnce({
      id: 'pay_orphan',
      order_id: null,
      amount: 9900,
      currency: 'INR',
      status: 'failed',
      method: null,
      captured: false,
      created_at: 1_700_000_000,
    });

    const client = createRazorpayClient(FAKE_ENV);
    const result = await client.fetchPayment('pay_orphan');

    expect(result.orderId).toBeNull();
    expect(result.method).toBeNull();
    expect(result.captured).toBe(false);
  });

  it('wraps an SDK failure (e.g. payment not found) in RazorpayApiError', async () => {
    mockPaymentsFetch.mockRejectedValueOnce({
      statusCode: 404,
      error: { code: 'BAD_REQUEST_ERROR', description: 'The id provided does not exist' },
    });

    const client = createRazorpayClient(FAKE_ENV);
    let thrown: unknown;
    try {
      await client.fetchPayment('pay_does_not_exist');
      expect.unreachable('should have thrown');
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(RazorpayApiError);
    const apiErr = thrown as InstanceType<typeof RazorpayApiError>;
    expect(apiErr.operation).toBe('fetchPayment');
    expect(apiErr.statusCode).toBe(404);
  });

  it('never leaks the key secret on a fetchPayment failure either', async () => {
    mockPaymentsFetch.mockRejectedValueOnce({
      statusCode: 401,
      error: { code: 'UNAUTHORIZED', description: 'Authentication failed' },
      config: { headers: { Authorization: `Basic leaked-${FAKE_ENV.keySecret}` } },
    });

    const client = createRazorpayClient(FAKE_ENV);
    let thrown: unknown;
    try {
      await client.fetchPayment('pay_x');
    } catch (err) {
      thrown = err;
    }

    const serialized = JSON.stringify(deepSerializeOwnProperties(thrown));
    expect(serialized).not.toContain(FAKE_ENV.keySecret);
    expect(serialized).not.toContain('Authorization');
  });
});

describe('createRazorpayClient — secret never exposed via the returned client object', () => {
  it('the returned client has exactly the two expected methods, nothing else', () => {
    const client = createRazorpayClient(FAKE_ENV);
    expect(Object.keys(client).sort()).toEqual(['createOrder', 'fetchPayment']);
  });

  it('JSON.stringify-ing the client never contains the secret (functions do not serialize)', () => {
    const client = createRazorpayClient(FAKE_ENV);
    expect(JSON.stringify(client)).toBe('{}');
  });

  it('no enumerable or own property of the client contains the secret substring', () => {
    const client = createRazorpayClient(FAKE_ENV);
    const allPropertyNames = Object.getOwnPropertyNames(client);
    for (const name of allPropertyNames) {
      expect(name).not.toContain(FAKE_ENV.keySecret);
    }
    // Belt and suspenders: even function source text (toString()) must
    // not have closed over and stringified the secret literally.
    for (const value of Object.values(client)) {
      if (typeof value === 'function') {
        expect(value.toString()).not.toContain(FAKE_ENV.keySecret);
      }
    }
  });
});
