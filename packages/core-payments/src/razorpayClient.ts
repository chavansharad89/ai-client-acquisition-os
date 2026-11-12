// -----------------------------------------------------------------------
// Thin wrapper around the `razorpay` SDK, expressed as a narrow interface
// so createOrder.ts depends on a contract, not a concrete SDK — this is
// what lets unit tests substitute a fake implementation instead of
// hitting the real Razorpay API (and lets integration tests do the same,
// since we explicitly do NOT want tests making real charges/API calls
// against a live or even sandbox Razorpay account on every CI run).
// -----------------------------------------------------------------------

export interface CreateRazorpayOrderParams {
  /** Authoritative amount from @acos/catalog — NEVER client-supplied. */
  amountPaise: number;
  currency: string;
  /**
   * Our own locally-generated order id, sent as Razorpay's `receipt`
   * field. This lets us reconcile a Razorpay-side order back to our
   * local row even if the local DB write that follows this call fails
   * (see createOrder.ts's error handling for that scenario).
   */
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  receipt: string;
  status: string;
}

/** One payment Razorpay recorded against an order, narrowed to what reconciliation needs. */
export interface RazorpayPaymentSummary {
  razorpayPaymentId: string;
  status: string;
  amountPaise: number;
  currency: string;
}

export interface RazorpayOrdersClient {
  createOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrder>;
  /**
   * For reconciliation only: asks Razorpay directly whether an order has
   * a captured payment, for the case where our own webhook never
   * arrived. Never used on the checkout-return path — that remains
   * webhook-only per architecture §5/§14 item 12 (see
   * apps/web/app/api/payments/verify/route.ts's own doc comment).
   */
  fetchPayments(razorpayOrderId: string): Promise<readonly RazorpayPaymentSummary[]>;
}

// -----------------------------------------------------------------------
// ₹1,499 Client Finder SUBSCRIPTION (plan §H.3 item 2) — a thin wrapper
// around Razorpay's Subscriptions API, same narrow-interface-over-the-SDK
// shape as RazorpayOrdersClient above, for the same reason (tests
// substitute a fake rather than calling the real Razorpay API).
//
// `totalCount` and the exact `subscriptions.create` parameter shape are
// flagged by requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md
// §H.3 item 2/§Q.4 as RAZORPAY VERIFICATION REQUIRED — this wrapper
// passes through exactly what the caller supplies rather than inventing
// a business meaning for any field, but createSubscription.ts's own
// choice of `totalCount` IS an implementation-only engineering
// assumption (documented there) pending that verification.
// -----------------------------------------------------------------------

export interface CreateRazorpaySubscriptionParams {
  /** The Razorpay Plan id representing the recurring ₹1,499 charge (external, operator-configured — RAZORPAY_SUBSCRIPTION_PLAN_ID). */
  planId: string;
  /** Whether Razorpay sends its own notification emails/SMS for this subscription's charges. */
  customerNotify: boolean;
  /** Number of billing cycles Razorpay will attempt before the mandate completes on its own. */
  totalCount: number;
  notes?: Record<string, string>;
}

export interface RazorpaySubscription {
  razorpaySubscriptionId: string;
  status: string;
  /** Razorpay's hosted checkout page for this subscription, when provided. */
  shortUrl: string | null;
}

export interface RazorpaySubscriptionsClient {
  createSubscription(params: CreateRazorpaySubscriptionParams): Promise<RazorpaySubscription>;
}

/**
 * Real implementation, backed by the same `razorpay` npm SDK instance
 * shape as {@link createRazorpayOrdersClient}. Constructed once per
 * process and passed in as a dependency, same convention.
 */
export function createRazorpaySubscriptionsClient(config: {
  keyId: string;
  keySecret: string;
}): RazorpaySubscriptionsClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  const instance = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });

  return {
    async createSubscription(params: CreateRazorpaySubscriptionParams): Promise<RazorpaySubscription> {
      let response: { id: string; status: string; short_url?: string };

      try {
        response = await instance.subscriptions.create({
          plan_id: params.planId,
          customer_notify: params.customerNotify ? 1 : 0,
          total_count: params.totalCount,
          notes: params.notes,
        });
      } catch (cause) {
        const { RazorpaySubscriptionCreationError } = await import('./errors');
        const message =
          cause instanceof Error
            ? `Razorpay subscription creation failed: ${cause.message}`
            : 'Razorpay subscription creation failed: unknown error';
        throw new RazorpaySubscriptionCreationError(message, cause);
      }

      return {
        razorpaySubscriptionId: response.id,
        status: response.status,
        shortUrl: response.short_url ?? null,
      };
    },
  };
}

/**
 * Real implementation, backed by the official `razorpay` npm SDK.
 * Constructed once per process (apps/web wires this up at module scope
 * or per-request using @acos/config's validated env) and passed into
 * createOrder as a dependency — never imported directly by createOrder.ts.
 */
export function createRazorpayOrdersClient(config: {
  keyId: string;
  keySecret: string;
}): RazorpayOrdersClient {
  // Lazy require so that unit tests which never construct this client
  // (they use a fake RazorpayOrdersClient instead) don't need the
  // `razorpay` package to even resolve.
  // typescript-eslint v8 renamed no-var-requires to no-require-imports; the
  // old directive silenced nothing once lint could actually run.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  const instance = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });

  return {
    async createOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrder> {
      let response: {
        id: string;
        amount: number | string;
        currency: string;
        receipt?: string;
        status: string;
      };

      try {
        response = await instance.orders.create({
          amount: params.amountPaise,
          currency: params.currency,
          receipt: params.receipt,
          notes: params.notes,
        });
      } catch (cause) {
        // Import here (not top-level) to keep this the one place that
        // needs to know about CreateOrderError's shape from this module.
        const { RazorpayOrderCreationError } = await import('./errors');
        const message =
          cause instanceof Error
            ? `Razorpay order creation failed: ${cause.message}`
            : 'Razorpay order creation failed: unknown error';
        throw new RazorpayOrderCreationError(message, cause);
      }

      return {
        razorpayOrderId: response.id,
        amountPaise: Number(response.amount),
        currency: response.currency,
        receipt: response.receipt ?? params.receipt,
        status: response.status,
      };
    },

    async fetchPayments(razorpayOrderId: string): Promise<readonly RazorpayPaymentSummary[]> {
      let response: { items: { id: string; status: string; amount: number | string; currency: string }[] };
      try {
        response = await instance.orders.fetchPayments(razorpayOrderId);
      } catch (cause) {
        const { RazorpayApiError } = await import('./errors');
        const message =
          cause instanceof Error
            ? `Razorpay fetch-payments failed: ${cause.message}`
            : 'Razorpay fetch-payments failed: unknown error';
        throw new RazorpayApiError(message, cause);
      }
      return response.items.map((item) => ({
        razorpayPaymentId: item.id,
        status: item.status,
        amountPaise: Number(item.amount),
        currency: item.currency,
      }));
    },
  };
}
