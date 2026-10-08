import {
  createWebhookTransactionRunner,
  findEligibleOrdersForReconciliation,
  reconcileOrder,
  type RazorpayOrdersClient,
} from '@acos/core-payments';
import { issueClaimLink, type ClaimEmailSender, type EntitlementRepository } from '@acos/core-entitlements';

// Reconciliation tick — DEC-010 item 6's launch-blocking requirement:
// recover a payment Razorpay captured whose webhook never arrived.
// -----------------------------------------------------------------------
// One tick: find orders still PENDING/ATTEMPTED and old enough that a
// webhook had every reasonable chance to arrive, ask Razorpay about
// each, and replay the grant sequence (via reconcileOrder, which writes
// through the exact same WebhookTx methods the webhook handler uses) for
// any that Razorpay says actually captured.
//
// Idempotency is not reinvented here — see reconciliation.ts's own doc
// comment in @acos/core-payments. A tick that reconciles an order the
// webhook ALSO just reconciled (the race in design-review Case G) is a
// safe no-op by database constraint, not by anything in this file.
// -----------------------------------------------------------------------

export interface SqlPoolLike {
  query(sql: string, params?: readonly unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
  connect(): Promise<{
    query(sql: string, params?: readonly unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
    release: () => void;
  }>;
}

export interface ReconciliationTickDeps {
  pool: SqlPoolLike;
  razorpay: RazorpayOrdersClient;
  buildMetaEventId: (paymentId: string) => string;
  now?: () => Date;
  /**
   * How old a still-PENDING/ATTEMPTED order must be before this asks
   * Razorpay about it. ENGINEERING DEFAULT — no existing requirement or
   * decision specifies this value; see ./pollLoop.ts's own doc comment.
   */
  eligibilityAgeMs: number;
  batchSize: number;
  /**
   * DEC-014: issues and emails a claim/setup link for an order this
   * tick just reconciled — the recovery path's equivalent of the
   * webhook route's own post-grant step. Reconciliation only ever
   * reaches `reconcileOrder` for an order the webhook never confirmed,
   * so this is the ONLY place that order's claim link gets sent.
   */
  claimLink: {
    entitlements: Pick<EntitlementRepository, 'saveClaimToken'>;
    sender: ClaimEmailSender;
    baseUrl: string;
  };
}

export interface ReconciliationTickOutcome {
  checked: number;
  reconciled: number;
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
}

/** Runs exactly one reconciliation tick. A per-order failure is logged and does not stop the batch. */
export async function runReconciliationTick(
  deps: ReconciliationTickDeps,
): Promise<ReconciliationTickOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const cutoff = new Date(now.getTime() - deps.eligibilityAgeMs);
  const orders = await findEligibleOrdersForReconciliation(deps.pool, cutoff, deps.batchSize);

  const transaction = createWebhookTransactionRunner(deps.pool);
  let reconciled = 0;

  for (const order of orders) {
    try {
      const outcome = await reconcileOrder(order, {
        razorpay: deps.razorpay,
        transaction,
        buildMetaEventId: deps.buildMetaEventId,
      });
      if (outcome.status === 'reconciled') {
        reconciled += 1;
        console.log(
          JSON.stringify({
            event: 'reconciliation.order.reconciled',
            orderId: order.id,
            razorpayPaymentId: outcome.razorpayPaymentId,
          }),
        );

        // Non-fatal, same rationale as the webhook route: the payment
        // and entitlement are already committed, so a mail failure here
        // must not be treated as this order having failed reconciliation.
        try {
          await issueClaimLink(deps.claimLink.entitlements, deps.claimLink.sender, {
            orderId: order.id,
            customerEmail: order.customerEmail,
            baseUrl: deps.claimLink.baseUrl,
          });
        } catch (cause) {
          console.error(
            JSON.stringify({
              event: 'reconciliation.claim_link.failed',
              orderId: order.id,
              error: describeError(cause),
            }),
          );
        }
      }
    } catch (cause) {
      // Logged, not thrown: one bad order (a transient Razorpay API
      // error, say) must not stop the rest of the batch, and the order
      // simply remains eligible for the next tick.
      console.error(
        JSON.stringify({
          event: 'reconciliation.order.failed',
          orderId: order.id,
          error: describeError(cause),
        }),
      );
    }
  }

  console.log(
    JSON.stringify({ event: 'reconciliation.tick.completed', checked: orders.length, reconciled }),
  );
  return { checked: orders.length, reconciled };
}
