'use client';

import { useCallback, useId, useReducer, useRef, useState } from 'react';

import type { Product } from '@acos/catalog';

import { loadRazorpay } from '../checkout/loadRazorpay';
import { canSubmit, checkoutReducer, initialCheckoutState, isBusy } from '../checkout/machine';
import {
  buildCreateOrderRequest,
  createOrderRequest,
  newIdempotencyKey,
} from '../checkout/request';
import { trackFunnel } from '../analytics/track';
import { formatInrDisplay } from '../lib/format/inr';
import { StatusMessage } from './StatusMessage';

// The checkout form and its states.
// -----------------------------------------------------------------------
// The only client component in the flow. Everything above it renders on
// the server, so the product page ships almost no JavaScript and the
// Razorpay SDK is fetched only when someone actually starts paying.
//
// The browser never decides whether a payment succeeded. Razorpay's
// success callback moves the UI to "confirming", which unlocks nothing —
// the signed webhook is what makes a sale real.
// -----------------------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;

export function CheckoutPanel({ product }: { product: Product }) {
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string }>({});

  const emailId = useId();
  const phoneId = useId();
  const emailErrorId = `${emailId}-error`;
  const phoneErrorId = `${phoneId}-error`;
  const emailRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((): boolean => {
    const next: { email?: string; phone?: string } = {};
    if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = 'Enter an email address we can send the kit to.';
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      next.phone = 'Enter a phone number with country code, digits only.';
    }
    setFieldErrors(next);
    if (next.email) emailRef.current?.focus();
    return Object.keys(next).length === 0;
  }, [email, phone]);

  const start = useCallback(async () => {
    if (!validate()) return;
    dispatch({ type: 'SUBMIT' });
    void trackFunnel('CheckoutStarted', {
      productId: product.id,
      value: product.amountPaise / 100,
    });

    const body = buildCreateOrderRequest({
      productId: product.id,
      customerEmail: email,
      customerPhone: phone,
    });
    const result = await createOrderRequest(body, newIdempotencyKey());

    if (!result.ok) {
      dispatch({ type: 'ORDER_FAILED', error: result.error });
      return;
    }
    const order = result.order;
    dispatch({ type: 'ORDER_CREATED', order });
    void trackFunnel('RazorpayOrderCreated', {
      productId: product.id,
      value: order.amountPaise / 100,
      currency: order.currency,
      orderId: order.orderId,
      razorpayOrderId: order.razorpayOrderId,
    });

    let Razorpay;
    try {
      Razorpay = await loadRazorpay();
    } catch {
      dispatch({
        type: 'PAYMENT_FAILED',
        error: {
          kind: 'provider',
          message: 'The payment window could not load. Check your connection and try again.',
        },
      });
      return;
    }

    // Every figure below comes from the server's response, never from the
    // catalog constant rendered above — so what is charged is what the
    // server decided, and a tampered client cannot alter it.
    const instance = new Razorpay({
      key: order.razorpayKeyId,
      order_id: order.razorpayOrderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: 'AI Client Acquisition OS',
      description: order.productName,
      prefill: { email: email.trim(), ...(phone.trim() ? { contact: phone.trim() } : {}) },
      handler: (response) => {
        dispatch({ type: 'PAYMENT_SUBMITTED' });
        // The browser half of Meta deduplication: the event id is derived
        // from this payment id, and the server's CAPI call derives the
        // identical id from the same value in the webhook.
        const shared = {
          productId: product.id,
          value: order.amountPaise / 100,
          currency: order.currency,
          orderId: order.orderId,
          razorpayPaymentId: response.razorpay_payment_id,
        };
        void trackFunnel('PaymentCaptured', shared);
        void trackFunnel('Purchase', shared);
      },
      modal: { ondismiss: () => dispatch({ type: 'CHECKOUT_DISMISSED' }) },
    });

    instance.on('payment.failed', () =>
      dispatch({
        type: 'PAYMENT_FAILED',
        error: {
          kind: 'provider',
          message: 'The payment did not go through. No money has left your account.',
        },
      }),
    );

    dispatch({ type: 'CHECKOUT_OPENED' });
    instance.open();
  }, [email, phone, product.id, validate]);

  const busy = isBusy(state);
  const submittable = canSubmit(state);

  return (
    <div className="checkout">
      <section className="panel stack" aria-labelledby="checkout-heading">
        <h2 id="checkout-heading" style={{ margin: 0, fontSize: '1.125rem' }}>
          Your details
        </h2>

        <form
          className="stack"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void start();
          }}
        >
          <div className="field">
            <label htmlFor={emailId}>Email address</label>
            <input
              id={emailId}
              ref={emailRef}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              aria-invalid={fieldErrors.email ? 'true' : undefined}
              aria-describedby={fieldErrors.email ? emailErrorId : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email ? (
              <p className="field-error" id={emailErrorId}>
                {fieldErrors.email}
              </p>
            ) : (
              <p className="hint">We send your kit and receipt here.</p>
            )}
          </div>

          <div className="field">
            <label htmlFor={phoneId}>
              Phone <span className="price-note">(optional)</span>
            </label>
            <input
              id={phoneId}
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+919876543210"
              value={phone}
              disabled={busy}
              aria-invalid={fieldErrors.phone ? 'true' : undefined}
              aria-describedby={fieldErrors.phone ? phoneErrorId : undefined}
              onChange={(event) => setPhone(event.target.value)}
            />
            {fieldErrors.phone ? (
              <p className="field-error" id={phoneErrorId}>
                {fieldErrors.phone}
              </p>
            ) : null}
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={!submittable}>
            {busy ? 'Opening secure checkout…' : `Pay ${formatInrDisplay(product.amountPaise)}`}
          </button>
        </form>

        <CheckoutStatus state={state} onRetry={() => dispatch({ type: 'RETRY' })} />
      </section>

      <aside className="summary" aria-label="Order summary">
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Order summary</h2>
        <dl>
          <div className="row">
            <dt>{product.name}</dt>
            <dd>{formatInrDisplay(product.amountPaise)}</dd>
          </div>
          <div className="row total">
            <dt>Total due</dt>
            <dd>{formatInrDisplay(product.amountPaise)}</dd>
          </div>
        </dl>
        <ul className="trust">
          <li>Secure payment by Razorpay</li>
          <li>UPI, cards, netbanking</li>
          <li>Instant delivery by email</li>
        </ul>
      </aside>
    </div>
  );
}

function CheckoutStatus({
  state,
  onRetry,
}: {
  state: ReturnType<typeof checkoutReducer>;
  onRetry: () => void;
}) {
  switch (state.phase) {
    case 'creating':
      return <StatusMessage tone="busy" title="Preparing your order…" />;

    case 'opening':
      return <StatusMessage tone="busy" title="Opening secure checkout…" />;

    case 'confirming':
      // Deliberately does NOT say "payment successful". Razorpay told the
      // browser; only the signed webhook tells us.
      return (
        <StatusMessage tone="pending" title="Payment received — confirming it now.">
          {' '}
          We confirm every payment with our provider before releasing access. Your kit arrives by
          email within a few minutes; you can close this page.
        </StatusMessage>
      );

    case 'dismissed':
      return (
        <div className="stack">
          <StatusMessage tone="pending" title="Checkout closed — nothing was charged.">
            {' '}
            Your order is still held, so you can pick up where you left off.
          </StatusMessage>
          <button className="btn btn-secondary" type="button" onClick={onRetry}>
            Resume payment
          </button>
        </div>
      );

    case 'failed':
      return (
        <div className="stack">
          <StatusMessage tone="error" title="We couldn't take that payment.">
            {' '}
            {state.error.message}
          </StatusMessage>
          <button className="btn btn-secondary" type="button" onClick={onRetry}>
            Try again
          </button>
        </div>
      );

    default:
      return null;
  }
}
