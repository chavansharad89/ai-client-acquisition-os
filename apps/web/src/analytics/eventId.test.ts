import { describe, expect, it } from 'vitest';

import { buildPurchaseEventId } from '@acos/core-capi';

import {
  deriveCaptureEventId,
  deriveOrderEventId,
  derivePurchaseEventId,
  deriveViewEventId,
  EventIdError,
  stableEventId,
} from './eventId';

describe('browser and server agree on the Purchase event id', () => {
  it.each(['pay_abc123', 'pay_MkT9xZq0LpQ2Rd', 'pay_0', 'pay_with-dashes_and_UPPER'])(
    'matches core-capi exactly for %s',
    async (paymentId) => {
      // This is the whole dedup contract. If these ever diverge, Meta counts
      // every sale twice.
      expect(await derivePurchaseEventId(paymentId)).toBe(buildPurchaseEventId({ paymentId }));
    },
  );

  it('normalises whitespace the same way on both sides', async () => {
    expect(await derivePurchaseEventId('  pay_abc  ')).toBe(
      buildPurchaseEventId({ paymentId: 'pay_abc' }),
    );
  });

  it('produces the documented shape', async () => {
    expect(await derivePurchaseEventId('pay_abc')).toMatch(/^purchase_[0-9a-f]{64}$/);
  });

  it('is deterministic, so a retry reuses the same id', async () => {
    const first = await derivePurchaseEventId('pay_retry');
    const second = await derivePurchaseEventId('pay_retry');
    expect(first).toBe(second);
  });

  it('distinguishes different payments', async () => {
    expect(await derivePurchaseEventId('pay_a')).not.toBe(await derivePurchaseEventId('pay_b'));
  });
});

describe('other stable ids', () => {
  it('namespaces by prefix so an order id and a payment id never collide', async () => {
    expect(await deriveOrderEventId('x')).not.toBe(await deriveCaptureEventId('x'));
    expect(await deriveOrderEventId('x')).toMatch(/^rzporder_/);
    expect(await deriveCaptureEventId('x')).toMatch(/^capture_/);
  });

  it('view ids are stable within a scope and differ across products', async () => {
    const a = await deriveViewEventId('tab1', 'ProductView', 'ai_income_99');
    const b = await deriveViewEventId('tab1', 'ProductView', 'ai_income_99');
    const c = await deriveViewEventId('tab1', 'ProductView', 'ai_freelancing_499');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('rejects an empty key rather than hashing the empty string', async () => {
    await expect(stableEventId('purchase', '   ')).rejects.toThrow(EventIdError);
  });

  it('rejects a prefix that would produce an unparseable id', async () => {
    await expect(stableEventId('Bad-Prefix', 'x')).rejects.toThrow(EventIdError);
  });
});
