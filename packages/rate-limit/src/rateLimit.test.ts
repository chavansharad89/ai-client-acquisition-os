import { describe, expect, it } from 'vitest';

import {
  bucketKey,
  consumeAll,
  createMemoryRateLimiter,
  CREATE_ORDER_EMAIL_POLICY,
  CREATE_ORDER_IP_POLICY,
  windowStart,
  type RateLimitPolicy,
} from './index';

const T0 = new Date('2026-04-01T12:00:00.000Z');
const at = (ms: number) => new Date(T0.getTime() + ms);

/** Small and fast, so the boundary cases are readable. */
const POLICY: RateLimitPolicy = { name: 'test', limit: 3, windowMs: 60_000 };

describe('the limit itself', () => {
  it('allows every request under the limit', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 1; i <= POLICY.limit - 1; i += 1) {
      const decision = await limiter.consume('1.2.3.4', POLICY, T0);
      expect(decision.allowed, `request ${i}`).toBe(true);
      expect(decision.remaining).toBe(POLICY.limit - i);
    }
  });

  it('allows the request that sits exactly AT the limit', async () => {
    const limiter = createMemoryRateLimiter();
    let decision = await limiter.consume('1.2.3.4', POLICY, T0);
    for (let i = 2; i <= POLICY.limit; i += 1) {
      decision = await limiter.consume('1.2.3.4', POLICY, T0);
    }
    // The Nth request of a limit-N policy is permitted. Off-by-one here
    // would refuse a customer their last legitimate retry.
    expect(decision.allowed).toBe(true);
    expect(decision.remaining).toBe(0);
  });

  it('refuses the request OVER the limit', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < POLICY.limit; i += 1) await limiter.consume('1.2.3.4', POLICY, T0);

    const decision = await limiter.consume('1.2.3.4', POLICY, T0);
    expect(decision.allowed).toBe(false);
    expect(decision.remaining).toBe(0);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps refusing while the window is open, without resetting on refusal', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < POLICY.limit + 5; i += 1) await limiter.consume('1.2.3.4', POLICY, T0);
    const decision = await limiter.consume('1.2.3.4', POLICY, at(59_000));
    expect(decision.allowed).toBe(false);
  });
});

describe('separate clients have separate budgets', () => {
  it('does not let one caller exhaust another caller', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < POLICY.limit + 1; i += 1) await limiter.consume('1.1.1.1', POLICY, T0);

    expect((await limiter.consume('1.1.1.1', POLICY, T0)).allowed).toBe(false);
    expect((await limiter.consume('2.2.2.2', POLICY, T0)).allowed).toBe(true);
  });

  it('keeps policies apart even for the same identifier', async () => {
    const limiter = createMemoryRateLimiter();
    const other: RateLimitPolicy = { name: 'other', limit: 1, windowMs: 60_000 };

    await limiter.consume('same@example.test', other, T0);
    expect((await limiter.consume('same@example.test', other, T0)).allowed).toBe(false);
    // The identifier is exhausted under `other` and untouched under POLICY.
    expect((await limiter.consume('same@example.test', POLICY, T0)).allowed).toBe(true);
  });

  it('treats an identifier case-insensitively, so EMAIL and email are one budget', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < POLICY.limit; i += 1) await limiter.consume('Buyer@Example.test', POLICY, T0);
    expect((await limiter.consume('buyer@example.TEST', POLICY, T0)).allowed).toBe(false);
  });
});

describe('retry behaviour', () => {
  it('reopens the budget in the next window', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < POLICY.limit + 1; i += 1) await limiter.consume('1.2.3.4', POLICY, T0);
    expect((await limiter.consume('1.2.3.4', POLICY, at(30_000))).allowed).toBe(false);

    // A caller who honours Retry-After is served again.
    const after = await limiter.consume('1.2.3.4', POLICY, at(POLICY.windowMs));
    expect(after.allowed).toBe(true);
  });

  it('never advises a retry of zero seconds', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < POLICY.limit + 1; i += 1) await limiter.consume('1.2.3.4', POLICY, T0);
    // 1ms before the window closes: rounding down would say "retry in 0",
    // which invites an immediate retry that is refused again.
    const decision = await limiter.consume('1.2.3.4', POLICY, at(POLICY.windowMs - 1));
    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('leaves a realistic checkout retry sequence completely untouched', async () => {
    const limiter = createMemoryRateLimiter();
    // Load page, click Buy, card declined, retry, different card, retry.
    // Five attempts over four minutes — a normal bad day, not an attack.
    for (const [i, offset] of [0, 20_000, 60_000, 130_000, 240_000].entries()) {
      const ip = await limiter.consume('203.0.113.4', CREATE_ORDER_IP_POLICY, at(offset));
      const email = await limiter.consume('buyer@example.test', CREATE_ORDER_EMAIL_POLICY, at(offset));
      expect(ip.allowed, `ip attempt ${i + 1}`).toBe(true);
      expect(email.allowed, `email attempt ${i + 1}`).toBe(true);
    }
  });

  it('leaves an office sharing one IP room to check out', async () => {
    const limiter = createMemoryRateLimiter();
    // Ten different people behind one NAT, one attempt each. A tight
    // per-IP limit would lock out the whole building.
    for (let person = 0; person < 10; person += 1) {
      const ip = await limiter.consume('198.51.100.1', CREATE_ORDER_IP_POLICY, T0);
      const email = await limiter.consume(`person${person}@example.test`, CREATE_ORDER_EMAIL_POLICY, T0);
      expect(ip.allowed, `person ${person}`).toBe(true);
      expect(email.allowed, `person ${person}`).toBe(true);
    }
  });
});

describe('consumeAll', () => {
  it('returns the first refusal', async () => {
    const limiter = createMemoryRateLimiter();
    const tight: RateLimitPolicy = { name: 'tight', limit: 1, windowMs: 60_000 };
    await limiter.consume('1.2.3.4', tight, T0);

    const decision = await consumeAll(
      limiter,
      [
        { identifier: '1.2.3.4', policy: tight },
        { identifier: 'a@example.test', policy: POLICY },
      ],
      T0,
    );
    expect(decision.allowed).toBe(false);
    expect(decision.policy).toBe('tight');
  });

  it('counts every policy even after one has refused', async () => {
    const limiter = createMemoryRateLimiter();
    const tight: RateLimitPolicy = { name: 'tight', limit: 1, windowMs: 60_000 };
    await limiter.consume('1.2.3.4', tight, T0);

    for (let i = 0; i < POLICY.limit; i += 1) {
      await consumeAll(
        limiter,
        [
          { identifier: '1.2.3.4', policy: tight },
          { identifier: 'a@example.test', policy: POLICY },
        ],
        T0,
      );
    }
    // The email counter advanced despite the IP refusing first — a
    // distributed attack on one identity must not hide behind that.
    expect((await limiter.consume('a@example.test', POLICY, T0)).allowed).toBe(false);
  });
});

describe('the bucket key carries no personal data', () => {
  it('hashes the identifier', () => {
    const key = bucketKey(CREATE_ORDER_EMAIL_POLICY, 'buyer@example.test');
    expect(key).not.toContain('buyer@example.test');
    expect(key).not.toContain('example.test');
    expect(key.startsWith(`${CREATE_ORDER_EMAIL_POLICY.name}:`)).toBe(true);
    expect(key).toMatch(/:[0-9a-f]{64}$/);
  });

  it('hashes an IP too', () => {
    expect(bucketKey(CREATE_ORDER_IP_POLICY, '203.0.113.9')).not.toContain('203.0.113.9');
  });

  it('is stable, and different per policy', () => {
    const a = bucketKey(CREATE_ORDER_IP_POLICY, 'x');
    expect(bucketKey(CREATE_ORDER_IP_POLICY, 'x')).toBe(a);
    expect(bucketKey(CREATE_ORDER_EMAIL_POLICY, 'x')).not.toBe(a);
  });

  it('stays inside the length the schema permits', () => {
    const long = `${'a'.repeat(400)}@example.test`;
    expect(bucketKey(CREATE_ORDER_EMAIL_POLICY, long).length).toBeLessThanOrEqual(128);
  });
});

describe('windows', () => {
  it('floors to the window boundary, so a window is shared not per-caller', () => {
    expect(windowStart(new Date('2026-04-01T12:03:59.999Z'), 60_000).toISOString()).toBe(
      '2026-04-01T12:03:00.000Z',
    );
  });

  it('rejects a nonsensical policy rather than limiting nothing', async () => {
    const limiter = createMemoryRateLimiter();
    for (const bad of [0, -1, 1.5]) {
      await expect(
        limiter.consume('x', { name: 'bad', limit: bad, windowMs: 1000 }),
      ).rejects.toThrow(RangeError);
    }
  });
});

describe('the configured policies', () => {
  it('are generous enough for real retries and tight enough to bound abuse', () => {
    expect(CREATE_ORDER_IP_POLICY.limit).toBeGreaterThanOrEqual(10);
    expect(CREATE_ORDER_EMAIL_POLICY.limit).toBeGreaterThanOrEqual(3);
    // The email budget is the tighter of the two: an email identifies a
    // person far better than a shared IP does.
    expect(CREATE_ORDER_EMAIL_POLICY.limit).toBeLessThan(CREATE_ORDER_IP_POLICY.limit);
  });
});
