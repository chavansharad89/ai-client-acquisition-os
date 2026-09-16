import { randomUUID } from 'node:crypto';

import type { WebhookRejection } from './webhook';
import type { RedactionStore } from './webhookRetention';
import type { WebhookTx } from './webhookHandler';

// PostgreSQL wiring for the webhook boundary.
// -----------------------------------------------------------------------
// Raw SQL rather than Prisma, matching apps/worker's pgRepository: the
// dedupe needs `ON CONFLICT DO NOTHING` with a reported row count, and
// the whole handler needs one explicit transaction whose rollback
// semantics are visible in this file rather than inferred.
// -----------------------------------------------------------------------

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

/** A pool that can hand out a single pinned connection for a transaction. */
export interface SqlPool extends SqlClient {
  connect(): Promise<SqlClient & { release: () => void }>;
}

/**
 * Records a refused request.
 *
 * Runs OUTSIDE any transaction and writes only the metadata fields — the
 * table has no payload column, so this cannot persist attacker content
 * even if a future caller passed it something it should not.
 */
export async function recordWebhookRejection(
  sql: SqlClient,
  rejection: WebhookRejection,
): Promise<void> {
  await sql.query(
    `INSERT INTO webhook_rejections
       (id, provider, received_at, reason, body_bytes,
        signature_present, signature_well_formed, source_ip)
     VALUES ($1, 'razorpay', $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      rejection.receivedAt,
      rejection.reason,
      rejection.bodyBytes,
      rejection.signaturePresent,
      rejection.signatureWellFormed,
      rejection.sourceIp ?? null,
    ],
  );
}

/**
 * Runs the handler's writes inside ONE transaction on ONE connection.
 *
 * The connection is pinned deliberately: a pool that round-robins
 * statements across connections would leave BEGIN on one and the INSERTs
 * on another, which looks like it works right up until it silently
 * doesn't.
 */
export function createWebhookTransactionRunner(pool: SqlPool) {
  return async function webhookTransaction<T>(fn: (tx: WebhookTx) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(makeTx(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      // Best-effort rollback: if this throws too, the original error is
      // the one worth surfacing.
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  };
}

function makeTx(sql: SqlClient): WebhookTx {
  return {
    async insertWebhookEvent({ razorpayEventId, eventName, orderId, payload, receivedAt }) {
      // ON CONFLICT DO NOTHING against the razorpay_event_id unique index
      // IS the dedupe. A SELECT-then-INSERT would let two concurrent
      // retries both pass the check and both process the payment; here
      // the database picks exactly one winner and tells the loser by
      // returning zero rows.
      const { rowCount } = await sql.query(
        `INSERT INTO webhook_events
           (id, provider, razorpay_event_id, event_name, order_id, payload,
            signature_valid, received_at, updated_at)
         VALUES ($1, 'razorpay', $2, $3, $4, $5, true, $6, now())
         ON CONFLICT (razorpay_event_id) DO NOTHING`,
        [randomUUID(), razorpayEventId, eventName, orderId, JSON.stringify(payload), receivedAt],
      );
      return (rowCount ?? 0) > 0;
    },

    async findOrderByRazorpayOrderId(razorpayOrderId) {
      const { rows } = await sql.query(
        `SELECT id, customer_email, product_slug, amount_paise, currency
           FROM orders WHERE razorpay_order_id = $1
           FOR UPDATE`,
        [razorpayOrderId],
      );
      const row = rows[0] as
        | {
            id: string;
            customer_email: string;
            product_slug: string;
            amount_paise: number;
            currency: string;
          }
        | undefined;
      return row
        ? {
            id: row.id,
            customerEmail: row.customer_email,
            productSlug: row.product_slug,
            amountPaise: Number(row.amount_paise),
            currency: row.currency,
          }
        : null;
    },

    async upsertCapturedPayment({ razorpayPaymentId, orderId, amountPaise, currency }) {
      // Idempotent on razorpay_payment_id. The amount comes from the
      // ORDER, never the webhook payload — and migration 0003's
      // payments_match_order trigger enforces that independently.
      await sql.query(
        `INSERT INTO payments
           (id, razorpay_payment_id, order_id, amount_paise, currency, status, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'CAPTURED', now())
         ON CONFLICT (razorpay_payment_id) DO NOTHING`,
        [randomUUID(), razorpayPaymentId, orderId, amountPaise, currency],
      );
    },

    async markOrderPaid(orderId) {
      // Only `status` — amount, currency and product_slug are frozen by
      // migration 0003's orders_financials_frozen trigger once a payment
      // exists, and this statement must not fight it.
      await sql.query(`UPDATE orders SET status = 'PAID', updated_at = now() WHERE id = $1`, [
        orderId,
      ]);
    },

    async grantEntitlement({ customerEmail, productSlug, orderId }) {
      await sql.query(
        `INSERT INTO entitlements
           (id, customer_email, product_slug, order_id, granted_at, updated_at)
         VALUES ($1, lower($2), $3, $4, now(), now())
         ON CONFLICT (customer_email, product_slug) DO NOTHING`,
        [randomUUID(), customerEmail, productSlug, orderId],
      );
    },

    async enqueueMetaPurchase({ metaEventId, orderId, product, valuePaise, currency }) {
      // The outbox. Unique on meta_event_id AND on order_id (migration
      // 0002), so a replayed webhook cannot enqueue a second Purchase.
      await sql.query(
        `INSERT INTO meta_events
           (id, meta_event_id, order_id, event_name, product, value_paise,
            currency, status, attempts, next_attempt_at, updated_at)
         VALUES ($1, $2, $3, 'Purchase', $4, $5, $6, 'PENDING', 0, now(), now())
         ON CONFLICT (meta_event_id) DO NOTHING`,
        [randomUUID(), metaEventId, orderId, product, valuePaise, currency],
      );
    },

    async markWebhookProcessed(razorpayEventId, at) {
      await sql.query(
        `UPDATE webhook_events SET processed_at = $2, updated_at = now()
          WHERE razorpay_event_id = $1`,
        [razorpayEventId, at],
      );
    },
  };
}

/**
 * The retention policy's PostgreSQL half.
 *
 * The UPDATE narrows the payload in place using the SQL function from
 * migration 0011 rather than reading rows into the application and
 * writing them back: the body never has to cross the process boundary to
 * be redacted, which would be a strange way to reduce its exposure.
 *
 * `payload_redacted_at IS NULL` in the WHERE clause is what makes a
 * second run a no-op, and the CTE bounds the statement to `limit` rows so
 * a long-untended backlog cannot hold a lock across the path every
 * incoming webhook takes.
 */
export function createRedactionStore(sql: SqlClient): RedactionStore {
  return {
    async redactBatch(cutoff, limit, now) {
      const result = await sql.query(
        `WITH due AS (
           SELECT id
             FROM webhook_events
            WHERE payload_redacted_at IS NULL
              AND received_at <= $1
            ORDER BY received_at
            LIMIT $2
            FOR UPDATE SKIP LOCKED
         )
         UPDATE webhook_events AS w
            SET payload = redact_webhook_payload(w.payload),
                payload_redacted_at = $3,
                updated_at = $3
           FROM due
          WHERE w.id = due.id`,
        [cutoff, limit, now],
      );
      return result.rowCount ?? 0;
    },
  };
}
