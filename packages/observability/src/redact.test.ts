import { describe, expect, it, vi } from 'vitest';

import { ALLOWED_KEYS, isRedactedKey, logger, redact, REDACTED } from './index';

// The line that must never leak.
// -----------------------------------------------------------------------
// `logger.error('capture failed', { order })` is the most natural line
// anyone will write in this codebase, and before redaction it shipped the
// customer's email, phone and address into log aggregation. These tests
// are written around that call, not around the redactor's API, because
// the call is what has to be safe.
// -----------------------------------------------------------------------

const ORDER = {
  id: 'ord_123',
  orderId: 'ord_123',
  razorpayOrderId: 'order_PqR7',
  customerEmail: 'buyer@example.test',
  customerPhone: '+919876543210',
  customerName: 'Sharad Chavan',
  productSlug: 'ai_income_99',
  amountPaise: 9900,
  currency: 'INR',
  status: 'PAID',
};

const PAYMENT_ENTITY = {
  id: 'pay_1',
  email: 'buyer@example.test',
  contact: '+919876543210',
  vpa: 'sharad@okhdfcbank',
  card: { last4: '4321', network: 'Visa' },
  notes: { customer_name: 'Sharad Chavan' },
  amount: 9900,
};

describe('what never reaches a log', () => {
  it.each([
    ['email', 'buyer@example.test'],
    ['phone', '+919876543210'],
    ['name', 'Sharad Chavan'],
  ])('redacts the customer %s from a logged order', (_label, needle) => {
    expect(JSON.stringify(redact(ORDER))).not.toContain(needle);
  });

  it('redacts a whole provider payment entity', () => {
    const out = JSON.stringify(redact(PAYMENT_ENTITY));
    for (const needle of ['buyer@example.test', '+919876543210', 'sharad@okhdfcbank', '4321']) {
      expect(out, needle).not.toContain(needle);
    }
  });

  it('redacts credentials and capabilities', () => {
    const out = redact({
      password: 'hunter2',
      apiKey: 'sk-live-abc',
      authorization: 'Bearer abc.def',
      cookie: 'session=xyz',
      signature: 'deadbeef',
      grant: 'eyJ...',
      webhookSecret: 'whsec_abc',
    }) as Record<string, unknown>;
    for (const v of Object.values(out)) expect(v).toBe(REDACTED);
  });

  it('redacts the whole body rather than trusting its shape', () => {
    const out = redact({ payload: PAYMENT_ENTITY, rawBody: '{"x":1}', body: 'anything' }) as Record<
      string,
      unknown
    >;
    expect(out.payload).toBe(REDACTED);
    expect(out.rawBody).toBe(REDACTED);
    expect(out.body).toBe(REDACTED);
  });

  it('redacts however the key is spelled', () => {
    for (const key of ['customerEmail', 'customer_email', 'CUSTOMER-EMAIL', 'Customer.Email']) {
      expect(isRedactedKey(key), key).toBe(true);
    }
  });

  it('redacts nested and array-wrapped occurrences, not just top level', () => {
    const out = JSON.stringify(
      redact({ orders: [{ deep: { nested: { customerEmail: 'buyer@example.test' } } }] }),
    );
    expect(out).not.toContain('buyer@example.test');
  });
});

describe('what still reaches a log, because otherwise it is useless', () => {
  it('keeps the identifiers that correlate a line to a transaction', () => {
    const out = redact(ORDER) as Record<string, unknown>;
    expect(out.orderId).toBe('ord_123');
    expect(out.razorpayOrderId).toBe('order_PqR7');
    expect(out.amountPaise).toBe(9900);
    expect(out.status).toBe('PAID');
    expect(out.productSlug).toBe('ai_income_99');
  });

  it('keeps a token HASH, which is not the token', () => {
    const out = redact({ tokenHash: 'abc123', token: 'plaintext' }) as Record<string, unknown>;
    expect(out.tokenHash).toBe('abc123');
    expect(out.token).toBe(REDACTED);
  });

  it('the allowlist genuinely overrides the denylist', () => {
    for (const key of ALLOWED_KEYS) expect(isRedactedKey(key), key).toBe(false);
  });

  it('keeps an error usable — message and stack, not its attached request', () => {
    const error = Object.assign(new Error('capture failed'), { customerEmail: 'buyer@example.test' });
    const out = redact({ error }) as Record<string, any>;
    expect(out.error.message).toBe('capture failed');
    expect(out.error.stack).toContain('capture failed');
    expect(JSON.stringify(out)).not.toContain('buyer@example.test');
  });
});

describe('redaction never breaks the thing it is logging', () => {
  it('survives a cycle instead of hanging', () => {
    const a: Record<string, unknown> = { name: 'a' };
    a.self = a;
    expect(() => redact(a)).not.toThrow();
    expect(JSON.stringify(redact(a))).toContain('[circular]');
  });

  it('survives a throwing getter', () => {
    const hostile = {
      get boom(): string {
        throw new Error('nope');
      },
      safe: 1,
    };
    const out = redact(hostile) as Record<string, unknown>;
    expect(out.boom).toBe('[unreadable]');
    expect(out.safe).toBe(1);
  });

  it('truncates rather than shipping a megabyte into the log stream', () => {
    const out = redact({ note: 'x'.repeat(10_000) }) as Record<string, string>;
    expect(out.note!.length).toBeLessThan(2_100);
    expect(out.note).toContain('10000 chars');
  });

  it('bounds arrays and depth', () => {
    const wide = redact({ xs: Array.from({ length: 500 }, (_, i) => i) }) as Record<string, unknown[]>;
    expect(wide.xs).toHaveLength(51);
    expect(wide.xs![50]).toBe('…450 more');

    let deep: unknown = 'bottom';
    for (let i = 0; i < 20; i += 1) deep = { down: deep };
    expect(JSON.stringify(redact(deep))).toContain('[depth limit]');
  });

  it('handles every primitive without throwing', () => {
    expect(() =>
      redact({ n: null, u: undefined, b: 1n, f: () => 1, s: Symbol('x'), d: new Date() }),
    ).not.toThrow();
  });
});

describe('the logger itself', () => {
  it('redacts meta before it reaches the console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('capture failed', { order: ORDER });
    const line = spy.mock.calls[0]![0] as string;
    spy.mockRestore();

    expect(line).not.toContain('buyer@example.test');
    expect(line).not.toContain('Sharad Chavan');
    // Still useful: the message and the correlating id survive.
    expect(line).toContain('capture failed');
    expect(line).toContain('ord_123');
  });

  it('emits one parseable JSON line, so meta cannot forge a second', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('hello', { note: 'line one\nlevel=error message=forged' });
    const line = spy.mock.calls[0]![0] as string;
    spy.mockRestore();

    expect(line.split('\n')).toHaveLength(1);
    const parsed = JSON.parse(line) as Record<string, any>;
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
  });

  it('logs a message with no meta at all', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('just a message');
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string) as Record<string, unknown>;
    spy.mockRestore();
    expect(parsed.message).toBe('just a message');
    expect('meta' in parsed).toBe(false);
  });
});
