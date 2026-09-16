import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
  MIN_RETENTION_DAYS,
  REDACTION_ALLOWLIST,
  redactExpiredPayloads,
  redactionCutoff,
  redactWebhookPayload,
  resolveRetentionDays,
  type RedactionStore,
} from './webhookRetention';

// A `payment.captured` body as Razorpay actually sends it — every
// identifier included, because a redactor tested against a tidy fixture
// is a redactor tested against nothing.
const REAL_PAYLOAD = {
  entity: 'event',
  account_id: 'acc_JKm3nQ2pLd9xYz',
  event: 'payment.captured',
  contains: ['payment'],
  created_at: 1_772_000_000,
  payload: {
    payment: {
      entity: {
        id: 'pay_PqR7sTuV2wXyZa',
        entity: 'payment',
        amount: 149_900,
        currency: 'INR',
        status: 'captured',
        order_id: 'order_PqR7sTuV2wXyZ0',
        invoice_id: null,
        international: false,
        method: 'upi',
        amount_refunded: 0,
        refund_status: null,
        captured: true,
        // --- everything below is PII or instrument data ---
        description: 'AI Income Blueprint — Sharad C, Andheri West',
        card_id: 'card_PqR7sTuV2wXyZb',
        card: {
          id: 'card_PqR7sTuV2wXyZb',
          last4: '4321',
          network: 'Visa',
          type: 'debit',
          issuer: 'HDFC',
          international: false,
          emi: false,
          sub_type: 'consumer',
        },
        bank: 'HDFC',
        wallet: null,
        vpa: 'sharad.chavan@okhdfcbank',
        email: 'buyer@example.test',
        contact: '+919876543210',
        customer_id: 'cust_PqR7sTuV2wXyZc',
        token_id: 'token_PqR7sTuV2wXyZd',
        notes: {
          customer_name: 'Sharad Chavan',
          shipping_address: '14 Link Road, Andheri West, Mumbai 400053',
        },
        fee: 3538,
        tax: 540,
        error_code: null,
        error_description: null,
        error_source: null,
        error_step: null,
        error_reason: null,
        acquirer_data: {
          rrn: '432109876543',
          upi_transaction_id: 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6',
          bank_transaction_id: '99887766',
        },
        created_at: 1_772_000_000,
      },
    },
  },
} as const;

/** Every string anywhere in a value, so nothing can hide in a nested object. */
function allStrings(value: unknown, into: string[] = []): string[] {
  if (typeof value === 'string') into.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, into));
  else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      into.push(k);
      allStrings(v, into);
    }
  }
  return into;
}

describe('what redaction removes', () => {
  const redacted = redactWebhookPayload(REAL_PAYLOAD);
  const serialised = JSON.stringify(redacted);

  it.each([
    ['email', 'buyer@example.test'],
    ['phone', '+919876543210'],
    ['UPI handle', 'sharad.chavan@okhdfcbank'],
    ['card last4', '4321'],
    ['card network', 'Visa'],
    ['issuing bank', 'HDFC'],
    ['name in notes', 'Sharad Chavan'],
    ['address in notes', '14 Link Road, Andheri West, Mumbai 400053'],
    ['free-text description', 'AI Income Blueprint'],
    ['acquirer RRN', '432109876543'],
    ['UPI transaction id', 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6'],
    ['bank transaction id', '99887766'],
    ['provider customer id', 'cust_PqR7sTuV2wXyZc'],
    ['instrument token', 'token_PqR7sTuV2wXyZd'],
  ])('drops the %s', (_label, needle) => {
    expect(serialised).not.toContain(needle);
  });

  it('drops the containers too, not just their contents', () => {
    const keys = allStrings(redacted);
    for (const container of ['card', 'notes', 'acquirer_data', 'vpa', 'email', 'contact']) {
      expect(keys).not.toContain(container);
    }
  });
});

describe('what redaction preserves', () => {
  const redacted = redactWebhookPayload(REAL_PAYLOAD) as Record<string, any>;

  it('preserves event identity and type', () => {
    expect(redacted.event).toBe('payment.captured');
    expect(redacted.account_id).toBe('acc_JKm3nQ2pLd9xYz');
    expect(redacted.created_at).toBe(1_772_000_000);
    expect(redacted.contains).toEqual(['payment']);
  });

  it('preserves the financial skeleton — what was charged, and its outcome', () => {
    const e = redacted.payload.payment.entity;
    expect(e.id).toBe('pay_PqR7sTuV2wXyZa');
    expect(e.order_id).toBe('order_PqR7sTuV2wXyZ0');
    expect(e.amount).toBe(149_900);
    expect(e.currency).toBe('INR');
    expect(e.status).toBe('captured');
    expect(e.captured).toBe(true);
    expect(e.amount_refunded).toBe(0);
    expect(e.fee).toBe(3538);
    expect(e.tax).toBe(540);
  });

  it('preserves the payment method but not the instrument', () => {
    const e = redacted.payload.payment.entity;
    // "paid by UPI" is a fact about the transaction.
    expect(e.method).toBe('upi');
    // "this UPI handle, on this bank, ending 4321" is a fact about a person.
    expect(e.vpa).toBeUndefined();
    expect(e.card).toBeUndefined();
    expect(e.bank).toBeUndefined();
  });

  it('preserves a JSON null the provider actually sent, distinct from absent', () => {
    const e = redacted.payload.payment.entity;
    expect('invoice_id' in e).toBe(true);
    expect(e.invoice_id).toBeNull();
    expect(e.refund_status).toBeNull();
  });

  it('preserves failure diagnostics, which carry no identity', () => {
    const failed = redactWebhookPayload({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_x',
            status: 'failed',
            error_code: 'BAD_REQUEST_ERROR',
            error_source: 'customer',
            error_step: 'payment_authentication',
            error_reason: 'payment_failed',
            error_description: 'Your payment could not be completed',
            contact: '+919876543210',
          },
        },
      },
    }) as Record<string, any>;
    const e = failed.payload.payment.entity;
    expect(e.error_code).toBe('BAD_REQUEST_ERROR');
    expect(e.error_step).toBe('payment_authentication');
    expect(e.error_reason).toBe('payment_failed');
    // error_description is provider free text and is not on the allowlist.
    expect(e.error_description).toBeUndefined();
    expect(e.contact).toBeUndefined();
  });
});

describe('the allowlist is an allowlist', () => {
  it('drops a field nobody has seen before — failing closed', () => {
    const withNewField = redactWebhookPayload({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_x',
            // Razorpay ships something new next quarter.
            payer_account_type: 'bank_account',
            upi: { payer_account_type: 'bank_account', vpa: 'someone@okaxis' },
          },
        },
      },
    }) as Record<string, any>;
    const e = withNewField.payload.payment.entity;
    expect(e.id).toBe('pay_x');
    expect(e.payer_account_type).toBeUndefined();
    expect(e.upi).toBeUndefined();
    expect(JSON.stringify(withNewField)).not.toContain('someone@okaxis');
  });

  it('names no field that is a known identifier', () => {
    const banned = [
      'email', 'contact', 'vpa', 'card', 'card_id', 'token_id', 'bank',
      'wallet', 'notes', 'description', 'customer_id', 'acquirer_data',
      'error_description',
    ];
    for (const path of REDACTION_ALLOWLIST) {
      const leaf = path.split('.').pop()!;
      expect(banned, `${path} is on the allowlist`).not.toContain(leaf);
    }
  });
});

describe('redaction is total and idempotent', () => {
  it('redacting twice changes nothing the second time', () => {
    const once = redactWebhookPayload(REAL_PAYLOAD);
    expect(redactWebhookPayload(once)).toEqual(once);
  });

  it('survives payloads that are not the shape we expect', () => {
    for (const junk of [null, undefined, 'a string', 42, [1, 2, 3], true]) {
      expect(redactWebhookPayload(junk)).toEqual({});
    }
  });

  it('does not invent structure that was not there', () => {
    // No payment block in, no payment block out — an empty envelope is
    // not a payment of zero rupees.
    expect(redactWebhookPayload({ event: 'payout.processed' })).toEqual({
      event: 'payout.processed',
    });
  });

  it('does not mutate its input', () => {
    const copy = structuredClone(REAL_PAYLOAD);
    redactWebhookPayload(copy);
    expect(copy).toEqual(REAL_PAYLOAD);
  });
});

describe('the retention period', () => {
  it('defaults to the card-dispute window plus room to answer one', () => {
    expect(DEFAULT_RETENTION_DAYS).toBe(180);
    expect(DEFAULT_RETENTION_DAYS).toBeGreaterThan(120);
    expect(resolveRetentionDays(undefined)).toBe(180);
  });

  it('clamps to the documented bounds rather than trusting the environment', () => {
    expect(resolveRetentionDays(0)).toBe(MIN_RETENTION_DAYS);
    expect(resolveRetentionDays(-1)).toBe(MIN_RETENTION_DAYS);
    expect(resolveRetentionDays(10_000)).toBe(MAX_RETENTION_DAYS);
    expect(resolveRetentionDays(Number.NaN)).toBe(DEFAULT_RETENTION_DAYS);
    expect(resolveRetentionDays(90)).toBe(90);
    expect(resolveRetentionDays(90.9)).toBe(90);
  });

  it('computes the cutoff as exactly N days before now', () => {
    const now = new Date('2026-09-15T00:00:00.000Z');
    expect(redactionCutoff(now, 180).toISOString()).toBe('2026-03-19T00:00:00.000Z');
  });
});

/** A store that reports a fixed sequence of batch sizes. */
function fakeStore(sequence: number[]): RedactionStore & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  let i = 0;
  return {
    calls,
    async redactBatch(cutoff, limit, now) {
      calls.push([cutoff, limit, now]);
      return sequence[i++] ?? 0;
    },
  };
}

describe('the scheduled run', () => {
  const NOW = new Date('2026-09-15T00:00:00.000Z');

  it('drains the backlog and stops on a short batch', async () => {
    const store = fakeStore([500, 500, 137]);
    const result = await redactExpiredPayloads(store, NOW, { batchSize: 500 });

    expect(result.redacted).toBe(1137);
    expect(result.batches).toBe(3);
    expect(result.incomplete).toBe(false);
    // A short batch means drained; asking again costs a statement to
    // learn what we already know.
    expect(store.calls).toHaveLength(3);
  });

  it('stops at the ceiling and says so rather than looping forever', async () => {
    const store = fakeStore(Array(50).fill(10));
    const result = await redactExpiredPayloads(store, NOW, { batchSize: 10, maxBatches: 4 });

    expect(result.batches).toBe(4);
    expect(result.redacted).toBe(40);
    expect(result.incomplete).toBe(true);
  });

  it('is a no-op when nothing is due', async () => {
    const store = fakeStore([0]);
    const result = await redactExpiredPayloads(store, NOW);
    expect(result).toMatchObject({ redacted: 0, batches: 1, incomplete: false });
  });

  it('passes the cutoff, not now, to the store', async () => {
    const store = fakeStore([0]);
    await redactExpiredPayloads(store, NOW, { retentionDays: 180 });
    expect(store.calls[0]![0]).toEqual(new Date('2026-03-19T00:00:00.000Z'));
    expect(store.calls[0]![2]).toEqual(NOW);
  });

  it('clamps a reckless configured retention before touching the database', async () => {
    const store = fakeStore([0]);
    const result = await redactExpiredPayloads(store, NOW, { retentionDays: 0 });
    // Not "redact everything that has ever arrived".
    expect(result.retentionDays).toBe(MIN_RETENTION_DAYS);
    expect(store.calls[0]![0]).toEqual(new Date('2026-08-16T00:00:00.000Z'));
  });

  it('stops promptly when the caller aborts', async () => {
    const controller = new AbortController();
    const store: RedactionStore = {
      redactBatch: vi.fn(async () => {
        controller.abort();
        return 500;
      }),
    };
    const result = await redactExpiredPayloads(store, NOW, {
      batchSize: 500,
      maxBatches: 100,
      signal: controller.signal,
    });
    expect(store.redactBatch).toHaveBeenCalledTimes(1);
    expect(result.incomplete).toBe(true);
  });
});
