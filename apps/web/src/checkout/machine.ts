import type { CheckoutEvent, CheckoutState } from './types';

// The checkout state machine, as a pure reducer.
// -----------------------------------------------------------------------
// Kept free of React, fetch and the Razorpay SDK so the transitions that
// matter — especially "never go from a browser-reported success to a
// confirmed sale" — can be tested exhaustively without a DOM.
// -----------------------------------------------------------------------

export const initialCheckoutState: CheckoutState = { phase: 'idle' };

export function checkoutReducer(state: CheckoutState, event: CheckoutEvent): CheckoutState {
  switch (event.type) {
    case 'SUBMIT':
      // Ignored while a request is already in flight, so a double tap
      // cannot create two orders.
      return state.phase === 'creating' || state.phase === 'opening'
        ? state
        : { phase: 'creating' };

    case 'ORDER_CREATED':
      return state.phase === 'creating' ? { phase: 'opening', order: event.order } : state;

    case 'ORDER_FAILED':
      return { phase: 'failed', error: event.error };

    case 'CHECKOUT_OPENED':
      return state;

    case 'PAYMENT_SUBMITTED':
      // Razorpay told the browser it went through. That is a hint, not a
      // fact: the server confirms via the signed webhook.
      return 'order' in state && state.order ? { phase: 'confirming', order: state.order } : state;

    case 'CHECKOUT_DISMISSED':
      return state.phase === 'opening' ? { phase: 'dismissed', order: state.order } : state;

    case 'PAYMENT_FAILED':
      return 'order' in state && state.order
        ? { phase: 'failed', error: event.error, order: state.order }
        : { phase: 'failed', error: event.error };

    case 'RETRY':
      return state.phase === 'failed' || state.phase === 'dismissed' ? { phase: 'idle' } : state;

    default:
      return state;
  }
}

/** Whether the form should accept another submission. */
export function canSubmit(state: CheckoutState): boolean {
  return state.phase === 'idle' || state.phase === 'failed' || state.phase === 'dismissed';
}

/** Whether a spinner/busy state should be shown. */
export function isBusy(state: CheckoutState): boolean {
  return state.phase === 'creating' || state.phase === 'opening';
}

/**
 * Whether the UI may tell the person their purchase is complete.
 *
 * Always false. The browser never learns that a payment settled — only
 * the webhook does — so no client state is allowed to claim it. This
 * exists as a named, tested invariant rather than an unwritten rule.
 */
export function isPurchaseConfirmed(_state: CheckoutState): false {
  return false;
}
