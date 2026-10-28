import { describe, expect, it, vi } from 'vitest';

import { reconcileOrder, type OrderToReconcile } from './reconciliation';
import type { RazorpayOrdersClient, RazorpayPaymentSummary } from './razorpayClient';
import type { WebhookTx } from './webhookHandler';

const BASE_ORDER: OrderToReconcile = {
  id: 'order_1',
  razorpayOrderId: 'order_rzp_1',
  customerEmail: 'buyer@example.com',
  productSlug: 'ai_income_99',
  amountPaise: 9900,
  currency: 'INR',
  status: 'PENDING',
};

function fakeRazorpay(payments: readonly RazorpayPaymentSummary[]): RazorpayOrdersClient {
  return {
    createOrder: vi.fn(),
    fetchPayments: vi.fn(async () => payments),
  };
}

/** Records every call made against the WebhookTx surface, for assertions. */
function fakeTx() {
  const calls: Record<string, unknown[]> = {
    upsertCapturedPayment: [],
    markOrderPaid: [],
    grantEntitlement: [],
    enqueueMetaPurchase: [],
  };
  const tx: Partial<WebhookTx> = {
    upsertCapturedPayment: vi.fn(async (input) => {
      calls.upsertCapturedPayment.push(input);
    }),
    markOrderPaid: vi.fn(async (orderId) => {
      calls.markOrderPaid.push(orderId);
    }),
    grantEntitlement: vi.fn(async (input) => {
      calls.grantEntitlement.push(input);
    }),
    enqueueMetaPurchase: vi.fn(async (input) => {
      calls.enqueueMetaPurchase.push(input);
    }),
  };
  return { tx: tx as WebhookTx, calls };
}

describe('reconcileOrder', () => {
  it('skips an order that is not PENDING/ATTEMPTED — never re-checks an already-settled order', async () => {
    const razorpay = fakeRazorpay([]);
    const { tx } = fakeTx();
    const result = await reconcileOrder(
      { ...BASE_ORDER, status: 'PAID' },
      { razorpay, transaction: (fn) => fn(tx), buildMetaEventId: (id) => `meta_${id}` },
    );
    expect(result).toEqual({ status: 'order-not-eligible' });
    expect(razorpay.fetchPayments).not.toHaveBeenCalled();
  });

  it('reports still-pending when Razorpay has no captured payment for this order yet', async () => {
    const razorpay = fakeRazorpay([{ razorpayPaymentId: 'pay_1', status: 'failed', amountPaise: 9900, currency: 'INR' }]);
    const { tx, calls } = fakeTx();
    const result = await reconcileOrder(BASE_ORDER, {
      razorpay,
      transaction: (fn) => fn(tx),
      buildMetaEventId: (id) => `meta_${id}`,
    });
    expect(result).toEqual({ status: 'still-pending' });
    expect(calls.grantEntitlement).toHaveLength(0);
  });

  it('replays the grant sequence when Razorpay reports a captured payment the webhook never recorded', async () => {
    const razorpay = fakeRazorpay([
      { razorpayPaymentId: 'pay_1', status: 'captured', amountPaise: 9900, currency: 'INR' },
    ]);
    const { tx, calls } = fakeTx();
    const result = await reconcileOrder(BASE_ORDER, {
      razorpay,
      transaction: (fn) => fn(tx),
      buildMetaEventId: (id) => `meta_${id}`,
    });

    expect(result).toEqual({ status: 'reconciled', razorpayPaymentId: 'pay_1' });
    // Amount/currency come from the ORDER, never from Razorpay's response.
    expect(calls.upsertCapturedPayment).toEqual([
      { razorpayPaymentId: 'pay_1', orderId: 'order_1', amountPaise: 9900, currency: 'INR' },
    ]);
    expect(calls.markOrderPaid).toEqual(['order_1']);
    expect(calls.grantEntitlement).toEqual([
      { customerEmail: 'buyer@example.com', productSlug: 'ai_income_99', orderId: 'order_1' },
    ]);
    expect(calls.enqueueMetaPurchase).toHaveLength(1);
  });

  it('picks a captured payment even when it is not the only one Razorpay returns', async () => {
    const razorpay = fakeRazorpay([
      { razorpayPaymentId: 'pay_failed', status: 'failed', amountPaise: 9900, currency: 'INR' },
      { razorpayPaymentId: 'pay_captured', status: 'captured', amountPaise: 9900, currency: 'INR' },
    ]);
    const { tx } = fakeTx();
    const result = await reconcileOrder(BASE_ORDER, {
      razorpay,
      transaction: (fn) => fn(tx),
      buildMetaEventId: (id) => `meta_${id}`,
    });
    expect(result).toEqual({ status: 'reconciled', razorpayPaymentId: 'pay_captured' });
  });
});
