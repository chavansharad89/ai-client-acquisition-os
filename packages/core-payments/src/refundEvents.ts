import { randomUUID } from 'node:crypto';

import type { SqlClient } from './webhookPgStore';

// Refund ledger (B-6), authorized under
// CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// Isolated from webhookPgStore.ts's payment-confirmation logic (ED-6) —
// this file owns exactly the refund_events write and its one lookup.
// Reuses the WebhookEvent dedupe idiom: `ON CONFLICT (razorpay_refund_id)
// DO NOTHING` against the unique index IS the dedupe, not a
// SELECT-then-INSERT, for the same concurrency reason webhookPgStore.ts
// documents for payments.
// -----------------------------------------------------------------------

export interface RefundEventInput {
  razorpayRefundId: string;
  orderId: string;
  paymentId: string;
  amountPaise: number;
  currency: string;
  refundType: 'FULL' | 'PARTIAL';
  status: string;
  occurredAt: Date;
}

/** Inserts the refund ledger row. Returns false when the refund id already exists. */
export async function insertRefundEvent(sql: SqlClient, input: RefundEventInput): Promise<boolean> {
  const { rowCount } = await sql.query(
    `INSERT INTO refund_events
       (id, razorpay_refund_id, order_id, payment_id, amount_paise, currency,
        refund_type, status, occurred_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (razorpay_refund_id) DO NOTHING`,
    [
      randomUUID(),
      input.razorpayRefundId,
      input.orderId,
      input.paymentId,
      input.amountPaise,
      input.currency,
      input.refundType,
      input.status,
      input.occurredAt,
    ],
  );
  return (rowCount ?? 0) > 0;
}

/** The payment a refund webhook's payment_id refers to, or null. */
export async function findPaymentByRazorpayPaymentId(
  sql: SqlClient,
  razorpayPaymentId: string,
): Promise<{ id: string; orderId: string; amountPaise: number } | null> {
  const { rows } = await sql.query(
    `SELECT id, order_id, amount_paise FROM payments WHERE razorpay_payment_id = $1 FOR UPDATE`,
    [razorpayPaymentId],
  );
  const row = rows[0] as { id: string; order_id: string; amount_paise: number } | undefined;
  return row ? { id: row.id, orderId: row.order_id, amountPaise: Number(row.amount_paise) } : null;
}
