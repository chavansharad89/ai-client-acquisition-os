'use client';

import type { Product } from '@acos/catalog';
import Link from 'next/link';
import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react';


import { trackFunnel } from '../analytics/track';
import { loadRazorpay } from '../checkout/loadRazorpay';
import { canSubmit, checkoutReducer, initialCheckoutState, isBusy } from '../checkout/machine';
import {
  buildCreateOrderRequest,
  buildCreateSubscriptionRequest,
  createOrderRequest,
  createSubscriptionRequest,
  newIdempotencyKey,
} from '../checkout/request';
import { SUBSCRIPTION_PENDING_ACTIVATION } from '../checkout/statusCopy';
import {
  isSubscriptionPaymentInfo,
  isSubscriptionProduct,
  type CheckoutPaymentInfo,
} from '../checkout/types';
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

  const isSubscription = isSubscriptionProduct(product.id);

  const start = useCallback(async () => {
    if (!validate()) return;
    dispatch({ type: 'SUBMIT' });
    void trackFunnel('CheckoutStarted', {
      productId: product.id,
      value: product.amountPaise / 100,
    });

    // The subscription SKU and every one-time SKU go through different
    // APIs with different auth requirements and different success shapes
    // (see SubscriptionPaymentInfo's doc comment) — branched fully here
    // rather than forced into one shared code path.
    let payment: CheckoutPaymentInfo;
    if (isSubscription) {
      const body = buildCreateSubscriptionRequest({ customerEmail: email, customerPhone: phone });
      const result = await createSubscriptionRequest(body, newIdempotencyKey());
      if (!result.ok) {
        dispatch({ type: 'ORDER_FAILED', error: result.error });
        return;
      }
      payment = result.subscription;
      void trackFunnel('RazorpayOrderCreated', {
        productId: product.id,
        value: product.amountPaise / 100,
      });
    } else {
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
      payment = result.order;
      void trackFunnel('RazorpayOrderCreated', {
        productId: product.id,
        value: payment.amountPaise / 100,
        currency: payment.currency,
        orderId: payment.orderId,
        razorpayOrderId: payment.razorpayOrderId,
      });
    }
    dispatch({ type: 'ORDER_CREATED', order: payment });

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

    const prefill = { email: email.trim(), ...(phone.trim() ? { contact: phone.trim() } : {}) };
    const handlePaymentSuccess = (response: { razorpay_payment_id: string }) => {
      dispatch({ type: 'PAYMENT_SUBMITTED' });
      // The browser half of Meta deduplication: the event id is derived
      // from this payment id, and the server's CAPI call derives the
      // identical id from the same value in the webhook.
      const shared = {
        productId: product.id,
        value: product.amountPaise / 100,
        currency: product.currency,
        razorpayPaymentId: response.razorpay_payment_id,
        ...(!isSubscriptionPaymentInfo(payment) ? { orderId: payment.orderId } : {}),
      };
      void trackFunnel('PaymentCaptured', shared);
      void trackFunnel('Purchase', shared);
    };

    // Every figure below comes from the server's response, never from the
    // catalog constant rendered above — so what is charged is what the
    // server decided, and a tampered client cannot alter it. The
    // subscription branch omits amount/currency/order_id entirely:
    // Razorpay reads the recurring charge from the Plan attached to
    // `subscription_id`, not from this options object.
    const instance = new Razorpay(
      isSubscriptionPaymentInfo(payment)
        ? {
            key: payment.razorpayKeyId,
            subscription_id: payment.razorpaySubscriptionId,
            name: 'AI Client Acquisition OS',
            description: payment.productName,
            prefill,
            handler: handlePaymentSuccess,
            modal: { ondismiss: () => dispatch({ type: 'CHECKOUT_DISMISSED' }) },
          }
        : {
            key: payment.razorpayKeyId,
            order_id: payment.razorpayOrderId,
            amount: payment.amountPaise,
            currency: payment.currency,
            name: 'AI Client Acquisition OS',
            description: payment.productName,
            prefill,
            handler: handlePaymentSuccess,
            modal: { ondismiss: () => dispatch({ type: 'CHECKOUT_DISMISSED' }) },
          },
    );

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
  }, [email, phone, product, isSubscription, validate]);

  // While Razorpay has told the browser it succeeded but the webhook
  // (or reconciliation, if the webhook is late) has not yet landed, poll
  // the server for its own truth. This never claims success itself — it
  // only asks whether the server already has — so it does not weaken
  // isPurchaseConfirmed()'s invariant that the browser's own belief is
  // never trusted.
  //
  // DEC-014 D1: for a one-time order, once the server confirms an
  // entitlement exists, this no longer redirects to a claim page the
  // browser can reach on its own — the webhook handler (or
  // reconciliation) has already emailed a claim link to the purchase
  // address, and that email is the only way to reach account setup.
  //
  // For the subscription SKU there is no claim link at all — the buyer
  // was already signed in to reach create-subscription (see
  // createSubscription.ts's own header) — so this instead polls the
  // authoritative subscription status (GET /api/subscriptions/status,
  // backed by the subscription_periods row the webhook creates) and,
  // once active, surfaces a link into the product rather than an email
  // promise.
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (state.phase !== 'confirming') return;
    const payment = state.order;
    let stopped = false;

    const poll = async () => {
      try {
        const response = isSubscriptionPaymentInfo(payment)
          ? await fetch('/api/subscriptions/status')
          : await fetch(
              `/api/payments/status?razorpayOrderId=${encodeURIComponent(payment.razorpayOrderId)}`,
            );
        if (!response.ok) return;
        const body = (await response.json()) as {
          entitlementExists?: boolean;
          active?: boolean;
        };
        const ready = isSubscriptionPaymentInfo(payment) ? body.active : body.entitlementExists;
        if (!stopped && ready) {
          setConfirmed(true);
        }
      } catch {
        // Transient network error — the next tick tries again.
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      if (!confirmed) void poll();
    }, 3000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [state, confirmed]);

  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const resendClaimEmail = useCallback(async () => {
    if (!('order' in state) || !state.order || isSubscriptionPaymentInfo(state.order)) return;
    setResendState('sending');
    try {
      const response = await fetch('/api/payments/claim-link/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: state.order.razorpayOrderId }),
      });
      setResendState(response.ok ? 'sent' : 'error');
    } catch {
      setResendState('error');
    }
  }, [state]);

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

        <CheckoutStatus
          state={state}
          onRetry={() => dispatch({ type: 'RETRY' })}
          confirmed={confirmed}
          resendState={resendState}
          onResend={() => void resendClaimEmail()}
        />
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
          <li>
            {isSubscription
              ? 'Access unlocks automatically once payment settles'
              : 'Account setup link emailed after payment'}
          </li>
        </ul>
      </aside>
    </div>
  );
}

function CheckoutStatus({
  state,
  onRetry,
  confirmed,
  resendState,
  onResend,
}: {
  state: ReturnType<typeof checkoutReducer>;
  onRetry: () => void;
  confirmed: boolean;
  resendState: 'idle' | 'sending' | 'sent' | 'error';
  onResend: () => void;
}) {
  switch (state.phase) {
    case 'creating':
      return <StatusMessage tone="busy" title="Preparing your order…" />;

    case 'opening':
      return <StatusMessage tone="busy" title="Opening secure checkout…" />;

    case 'confirming': {
      // Deliberately does NOT say "payment successful". Razorpay told the
      // browser; only the signed webhook tells us — and even once it
      // has, this still never claims the browser itself can finish
      // setup on its own for a one-time order. DEC-014 D1: that only
      // happens via the claim link we email to the purchase address.
      //
      // The subscription branch needs no claim link — the buyer was
      // already signed in to reach create-subscription — so once the
      // server confirms the subscription_periods row exists (not before:
      // see the polling effect above), it links straight into the
      // product instead.
      const subscription = isSubscriptionPaymentInfo(state.order);

      if (confirmed && subscription) {
        return (
          <div className="stack">
            <StatusMessage tone="good" title="Subscription active.">
              {' '}
              Your Client Finder subscription is confirmed and ready to use.
            </StatusMessage>
            <Link className="btn btn-primary" href="/opportunities">
              Go to Client Finder
            </Link>
          </div>
        );
      }

      if (subscription) {
        // AUTH-PO-14/25: checkout no longer assumes an authenticated
        // buyer, so this can no longer promise an automatic flip to
        // "confirmed" — that only happens for a buyer who already holds
        // a session (GET /api/subscriptions/status is auth-only and is
        // never weakened to answer this for a guest checkout). The
        // copy lives in checkout/statusCopy.ts so it stays correct on
        // its own, independent of whether that poll ever resolves.
        return (
          <StatusMessage tone="pending" title={SUBSCRIPTION_PENDING_ACTIVATION.title}>
            {' '}
            {SUBSCRIPTION_PENDING_ACTIVATION.body}
          </StatusMessage>
        );
      }

      if (confirmed) {
        return (
          <div className="stack">
            <StatusMessage tone="good" title="Payment confirmed — check your email.">
              {' '}
              We&rsquo;ve emailed a secure link to set up your account and access your library.
              It&rsquo;s valid for 24 hours.
            </StatusMessage>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onResend}
              disabled={resendState === 'sending'}
            >
              {resendState === 'sending' ? 'Resending…' : 'Resend email'}
            </button>
            {resendState === 'sent' ? <p className="hint">Sent — check your inbox again shortly.</p> : null}
            {resendState === 'error' ? (
              <p className="field-error">Could not resend right now. Please try again.</p>
            ) : null}
          </div>
        );
      }
      return (
        <StatusMessage tone="pending" title="Payment received — confirming it now.">
          {' '}
          We confirm every payment with our provider before releasing access. We&rsquo;ll email
          you a link to set up your account as soon as that&rsquo;s done — usually a few seconds.
        </StatusMessage>
      );
    }

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
