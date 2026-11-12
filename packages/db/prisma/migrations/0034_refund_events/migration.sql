-- 0034_refund_events
-- =======================================================================
-- Refund ledger (B-6), authorized under
-- CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
--
-- Razorpay refund webhooks are not processed at all today (webhookHandler
-- supports only payment.captured). This table is the append-only record
-- of refund webhooks once that support is added, reusing the
-- WebhookEvent dedupe idiom (migration 0007): the unique index on
-- razorpay_refund_id, not a SELECT-then-INSERT, is the dedupe, so two
-- concurrent retries of the same refund webhook cannot double-count.
--
-- refund_type is classification only (FULL when the refunded amount
-- equals the payment's captured amount, else PARTIAL) — PCG-5's gate math
-- treats both as the same binary "this transaction had a refund" fact
-- (B-6); that treatment lives in the gate-computation query layer, not
-- here. Likewise, "reversals correct the numerator only before window
-- close, immutable after" (PCG-5) is a read-time rule applied by the gate
-- query against occurred_at vs a window boundary, not a write-time
-- constraint on this table — this table never rejects or blocks an
-- insert for any window-related reason.
--
-- No FK to payments: a refund webhook can reference a payment this system
-- never captured (e.g. a manually-issued refund in the Razorpay
-- dashboard); payment_id is best-effort linkage, not an invariant.
--
-- Additive only.
-- =======================================================================

CREATE TABLE "refund_events" (
    "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "razorpay_refund_id" TEXT NOT NULL,
    "order_id"           TEXT NOT NULL,
    "payment_id"         TEXT,
    "amount_paise"       INTEGER NOT NULL,
    "currency"           TEXT NOT NULL DEFAULT 'INR',
    "refund_type"        TEXT NOT NULL,
    "status"             TEXT NOT NULL,
    "reason"             TEXT,
    "occurred_at"        TIMESTAMP(3) NOT NULL,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "refund_events_razorpay_refund_id_key" UNIQUE ("razorpay_refund_id"),
    CONSTRAINT "refund_events_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "refund_events_payment_id_fkey"
        FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "refund_events_amount_paise_positive" CHECK ("amount_paise" > 0),
    CONSTRAINT "refund_events_refund_type_check" CHECK ("refund_type" IN ('FULL', 'PARTIAL'))
);

CREATE INDEX "refund_events_order_id_idx" ON "refund_events"("order_id");
CREATE INDEX "refund_events_occurred_at_idx" ON "refund_events"("occurred_at");
