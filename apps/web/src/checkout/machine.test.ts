import { describe, expect, it } from 'vitest';

import {
  canSubmit,
  checkoutReducer,
  initialCheckoutState,
  isBusy,
  isPurchaseConfirmed,
} from './machine';
import type { CheckoutEvent, CheckoutState, OrderPaymentInfo } from './types';

const order: OrderPaymentInfo = {
  orderId: 'order_1',
  razorpayOrderId: 'rzp_order_1',
  razorpayKeyId: 'rzp_test_public',
  amountPaise: 49_900,
  currency: 'INR',
  productId: 'ai_freelancing_499',
  productName: 'AI Freelancing Launch Kit',
  status: 'PENDING',
};

const run = (events: CheckoutEvent[], from: CheckoutState = initialCheckoutState) =>
  events.reduce(checkoutReducer, from);

const ALL_PHASES: CheckoutState[] = [
  { phase: 'idle' },
  { phase: 'creating' },
  { phase: 'opening', order },
  { phase: 'confirming', order },
  { phase: 'dismissed', order },
  { phase: 'failed', error: { kind: 'server', message: 'x' } },
];

describe('the happy path', () => {
  it('walks idle -> creating -> opening -> confirming', () => {
    expect(run([{ type: 'SUBMIT' }]).phase).toBe('creating');
    expect(run([{ type: 'SUBMIT' }, { type: 'ORDER_CREATED', order }]).phase).toBe('opening');
    expect(
      run([{ type: 'SUBMIT' }, { type: 'ORDER_CREATED', order }, { type: 'PAYMENT_SUBMITTED' }])
        .phase,
    ).toBe('confirming');
  });

  it('carries the server-issued order through every phase', () => {
    const state = run([{ type: 'SUBMIT' }, { type: 'ORDER_CREATED', order }]);
    expect(state).toMatchObject({ order: { razorpayOrderId: 'rzp_order_1', amountPaise: 49_900 } });
  });
});

describe('the browser is never the authority on payment', () => {
  it('a Razorpay success reaches "confirming", never a confirmed sale', () => {
    const state = run([
      { type: 'SUBMIT' },
      { type: 'ORDER_CREATED', order },
      { type: 'PAYMENT_SUBMITTED' },
    ]);
    expect(state.phase).toBe('confirming');
    expect(state.phase).not.toBe('confirmed');
  });

  it('no reachable state reports a confirmed purchase', () => {
    for (const state of ALL_PHASES) {
      expect(isPurchaseConfirmed(state), state.phase).toBe(false);
    }
  });

  it('there is no event a hostile client could send to claim success', () => {
    const forged = [
      { type: 'PAYMENT_SUBMITTED' },
      { type: 'CHECKOUT_OPENED' },
      { type: 'ORDER_CREATED', order },
    ] as CheckoutEvent[];
    for (const event of forged) {
      expect(isPurchaseConfirmed(checkoutReducer({ phase: 'idle' }, event))).toBe(false);
    }
  });

  it('PAYMENT_SUBMITTED without an order is ignored, not promoted', () => {
    expect(run([{ type: 'PAYMENT_SUBMITTED' }]).phase).toBe('idle');
  });
});

describe('double submission', () => {
  it('a second SUBMIT while creating is ignored, so one tap makes one order', () => {
    const state = run([{ type: 'SUBMIT' }, { type: 'SUBMIT' }, { type: 'SUBMIT' }]);
    expect(state.phase).toBe('creating');
  });

  it('SUBMIT is ignored while the Razorpay modal is open', () => {
    const open: CheckoutState = { phase: 'opening', order };
    expect(checkoutReducer(open, { type: 'SUBMIT' })).toBe(open);
  });

  it('canSubmit is false exactly while work is in flight', () => {
    expect(canSubmit({ phase: 'idle' })).toBe(true);
    expect(canSubmit({ phase: 'creating' })).toBe(false);
    expect(canSubmit({ phase: 'opening', order })).toBe(false);
    expect(canSubmit({ phase: 'failed', error: { kind: 'network', message: 'x' } })).toBe(true);
    expect(canSubmit({ phase: 'dismissed', order })).toBe(true);
  });
});

describe('failure and retry', () => {
  it('an order failure is recoverable', () => {
    const failed = run([
      { type: 'SUBMIT' },
      { type: 'ORDER_FAILED', error: { kind: 'provider', message: 'down' } },
    ]);
    expect(failed.phase).toBe('failed');
    expect(checkoutReducer(failed, { type: 'RETRY' }).phase).toBe('idle');
  });

  it('a dismissed modal is recoverable and is not an error', () => {
    const dismissed = run([
      { type: 'SUBMIT' },
      { type: 'ORDER_CREATED', order },
      { type: 'CHECKOUT_DISMISSED' },
    ]);
    expect(dismissed.phase).toBe('dismissed');
    expect(checkoutReducer(dismissed, { type: 'RETRY' }).phase).toBe('idle');
  });

  it('a payment failure keeps the order so a retry can reuse it', () => {
    const failed = run([
      { type: 'SUBMIT' },
      { type: 'ORDER_CREATED', order },
      { type: 'PAYMENT_FAILED', error: { kind: 'provider', message: 'declined' } },
    ]);
    expect(failed).toMatchObject({ phase: 'failed', order: { orderId: 'order_1' } });
  });

  it('RETRY does nothing from a phase that is not recoverable', () => {
    for (const state of [{ phase: 'creating' } as const, { phase: 'confirming', order } as const]) {
      expect(checkoutReducer(state, { type: 'RETRY' })).toBe(state);
    }
  });

  it('a dismissal after payment was submitted cannot undo the confirming state', () => {
    const confirming = run([
      { type: 'SUBMIT' },
      { type: 'ORDER_CREATED', order },
      { type: 'PAYMENT_SUBMITTED' },
      { type: 'CHECKOUT_DISMISSED' },
    ]);
    expect(confirming.phase).toBe('confirming');
  });
});

describe('busy state', () => {
  it('is true only while the person must wait', () => {
    expect(isBusy({ phase: 'creating' })).toBe(true);
    expect(isBusy({ phase: 'opening', order })).toBe(true);
    expect(isBusy({ phase: 'idle' })).toBe(false);
    expect(isBusy({ phase: 'confirming', order })).toBe(false);
  });
});

describe('robustness', () => {
  it('every event is safe from every phase', () => {
    const events: CheckoutEvent[] = [
      { type: 'SUBMIT' },
      { type: 'ORDER_CREATED', order },
      { type: 'ORDER_FAILED', error: { kind: 'server', message: 'x' } },
      { type: 'CHECKOUT_OPENED' },
      { type: 'PAYMENT_SUBMITTED' },
      { type: 'CHECKOUT_DISMISSED' },
      { type: 'PAYMENT_FAILED', error: { kind: 'provider', message: 'x' } },
      { type: 'RETRY' },
    ];
    for (const state of ALL_PHASES) {
      for (const event of events) {
        const next = checkoutReducer(state, event);
        expect(typeof next.phase, `${state.phase} + ${event.type}`).toBe('string');
        expect(isPurchaseConfirmed(next)).toBe(false);
      }
    }
  });
});
