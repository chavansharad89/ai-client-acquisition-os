import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  buildPurchaseEventId,
  hashUserData,
  MetaCapiResponseError,
  MetaCapiValidationError,
  sendMetaPurchase,
} from './index';
import { fetchJsonTransport, MetaCapiTimeoutError } from './transport';

const config = { pixelId: '123', apiVersion: 'v20.0', accessToken: 'secret-token' };
const input = {
  eventId: 'purchase_persisted_1',
  eventTime: new Date('2026-09-13T10:00:00.000Z'),
  productId: 'ai_freelancing_499',
  productName: 'AI Freelancing Launch Kit',
  value: 499,
  currency: 'INR',
  email: ' Buyer@Example.COM ',
  phone: '+91 (987) 654-3210',
  clientIp: '203.0.113.8',
  userAgent: 'test-agent',
  fbp: 'fb.1.1.abc',
  fbc: 'fb.1.1.def',
};
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

describe('Meta Purchase event', () => {
  it('normalizes and hashes email and phone', () => {
    expect(hashUserData({ email: input.email, phone: input.phone })).toEqual({
      em: digest('buyer@example.com'),
      ph: digest('919876543210'),
    });
  });
  it('derives the same event id for every retry of a payment', () => {
    expect(buildPurchaseEventId({ paymentId: 'pay_123' })).toBe(
      buildPurchaseEventId({ paymentId: 'pay_123' }),
    );
    expect(buildPurchaseEventId({ paymentId: 'pay_123' })).not.toBe(
      buildPurchaseEventId({ paymentId: 'pay_456' }),
    );
  });
  it('sends the complete Purchase payload using the supplied stable event id', async () => {
    const transport = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, body: { events_received: 1 } });
    await sendMetaPurchase(config, input, { transport });
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://graph.facebook.com/v20.0/123/events',
        body: expect.objectContaining({
          access_token: 'secret-token',
          data: [
            expect.objectContaining({
              event_name: 'Purchase',
              action_source: 'website',
              event_id: input.eventId,
              user_data: expect.objectContaining({
                em: digest('buyer@example.com'),
                ph: digest('919876543210'),
                client_ip_address: input.clientIp,
                client_user_agent: input.userAgent,
                fbp: input.fbp,
                fbc: input.fbc,
              }),
              custom_data: expect.objectContaining({
                content_ids: [input.productId],
                content_name: input.productName,
                value: 499,
                currency: 'INR',
                content_type: 'product',
              }),
            }),
          ],
        }),
      }),
    );
  });
  it('rejects HTTP failures and malformed success responses', async () => {
    await expect(
      sendMetaPurchase(config, input, {
        transport: vi.fn().mockResolvedValue({ ok: false, status: 400, body: {} }),
      }),
    ).rejects.toBeInstanceOf(MetaCapiResponseError);
    await expect(
      sendMetaPurchase(config, input, {
        transport: vi
          .fn()
          .mockResolvedValue({ ok: true, status: 200, body: { events_received: 0 } }),
      }),
    ).rejects.toBeInstanceOf(MetaCapiResponseError);
  });
  it('propagates a timeout and validates required data before a request', async () => {
    const timeout = new MetaCapiTimeoutError(10);
    await expect(
      sendMetaPurchase(config, input, { transport: vi.fn().mockRejectedValue(timeout) }),
    ).rejects.toBe(timeout);
    await expect(
      sendMetaPurchase(config, { ...input, eventId: '' }, { transport: vi.fn() }),
    ).rejects.toBeInstanceOf(MetaCapiValidationError);
  });

  it('aborts the underlying transport when its timeout expires', async () => {
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(
        fetchJsonTransport({ url: 'https://example.test/events', body: {}, timeoutMs: 1 }),
      ).rejects.toBeInstanceOf(MetaCapiTimeoutError);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
