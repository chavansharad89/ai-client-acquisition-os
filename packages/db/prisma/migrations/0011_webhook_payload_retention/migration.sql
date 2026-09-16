-- 0011_webhook_payload_retention
-- =======================================================================
-- webhook_events.payload held a verbatim Razorpay payment entity with no
-- expiry. That entity carries email, contact (phone), vpa (a UPI handle,
-- which is a person's name and their bank), card last4/network/issuer,
-- bank, wallet, notes (arbitrary merchant fields, in practice names and
-- addresses), description, and acquirer_data (RRN / UPI / bank
-- transaction ids). Nothing in the application reads the column back --
-- it is written by insertWebhookEvent and selected by nothing -- so the
-- data was accumulating permanently to serve a use nobody had.
--
-- This migration does NOT delete audit information. It adds:
--
--   1. payload_redacted_at   -- when a payload was narrowed, so a reader
--                               can tell a redacted row from a sparse one
--   2. redact_webhook_payload(jsonb) -- an ALLOWLIST rebuild, so a field
--                               Razorpay adds tomorrow is dropped by
--                               default rather than retained by default
--   3. webhook_events_audit  -- a view with no payload column, for every
--                               reader that wants the audit trail and
--                               has no business with the body
--   4. a partial index on the rows a redaction run has to find
--
-- After redaction a row still carries its identity (razorpay_event_id),
-- its type (event_name), its processing status (processed_at,
-- processing_error), its linkage (order_id), its timings, and the
-- financial skeleton of the payload: ids, amount, currency, status,
-- method, fees, error codes. What it stops carrying is a second copy of
-- identifiers that `orders` already holds authoritatively.
--
-- Retention is 180 days, set by the longest external window that can
-- demand the original: card networks allow chargebacks up to roughly 120
-- days, and answering one takes time after it is raised. See
-- docs/SECURITY.md "Webhook payload retention".
-- =======================================================================


-- ---- 1. The audit mark -------------------------------------------------
--
-- Nullable, because "never redacted" is a real and common state. A
-- non-null value is a positive record that narrowing happened, which is
-- what keeps this from being a silent deletion.

ALTER TABLE "webhook_events"
    ADD COLUMN IF NOT EXISTS "payload_redacted_at" TIMESTAMP(3);

COMMENT ON COLUMN "webhook_events"."payload_redacted_at" IS
    'When payload was narrowed to the retention allowlist. NULL = still verbatim.';

COMMENT ON COLUMN "webhook_events"."payload" IS
    'Provider body. Contains PII until payload_redacted_at is set. Never expose through an API; read webhook_events_audit instead.';


-- ---- 2. The redaction function ----------------------------------------
--
-- Lives in SQL so that a database with no application attached -- pg_cron,
-- a psql cron entry, a DBA answering an incident -- can still apply the
-- policy. packages/core-payments/src/webhookRetention.ts is the same
-- function in TypeScript; the integration suite asserts the two produce
-- identical output, because one rule with two implementations drifts.
--
-- ALLOWLIST, not denylist. Anything not named here is dropped. The cost
-- of forgetting to add a field is a missing diagnostic; the cost of
-- forgetting to add it to a denylist is an identifier retained forever.

CREATE OR REPLACE FUNCTION redact_webhook_payload(raw jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $redact$
DECLARE
    -- Keep in lockstep with REDACTION_ALLOWLIST in webhookRetention.ts.
    allowed text[] := ARRAY[
        'entity',
        'account_id',
        'event',
        'contains',
        'created_at',

        'payload.payment.entity.id',
        'payload.payment.entity.entity',
        'payload.payment.entity.order_id',
        'payload.payment.entity.invoice_id',
        'payload.payment.entity.amount',
        'payload.payment.entity.currency',
        'payload.payment.entity.status',
        'payload.payment.entity.method',
        'payload.payment.entity.captured',
        'payload.payment.entity.amount_refunded',
        'payload.payment.entity.refund_status',
        'payload.payment.entity.international',
        'payload.payment.entity.fee',
        'payload.payment.entity.tax',
        'payload.payment.entity.error_code',
        'payload.payment.entity.error_source',
        'payload.payment.entity.error_step',
        'payload.payment.entity.error_reason',
        'payload.payment.entity.created_at',

        'payload.order.entity.id',
        'payload.order.entity.entity',
        'payload.order.entity.amount',
        'payload.order.entity.amount_paid',
        'payload.order.entity.amount_due',
        'payload.order.entity.currency',
        'payload.order.entity.status',
        'payload.order.entity.attempts',
        'payload.order.entity.created_at',

        'payload.refund.entity.id',
        'payload.refund.entity.entity',
        'payload.refund.entity.payment_id',
        'payload.refund.entity.amount',
        'payload.refund.entity.currency',
        'payload.refund.entity.status',
        'payload.refund.entity.speed_processed',
        'payload.refund.entity.created_at'
    ];
    one_path  text;
    parts     text[];
    prefix    text[];
    kept      jsonb := '{}'::jsonb;
    value     jsonb;
    depth     int;
    i         int;
BEGIN
    -- A payload that is not an object cannot be narrowed field by field,
    -- and is not something this system ever wrote. Drop it whole.
    IF raw IS NULL OR jsonb_typeof(raw) <> 'object' THEN
        RETURN '{}'::jsonb;
    END IF;

    FOREACH one_path IN ARRAY allowed LOOP
        parts := string_to_array(one_path, '.');
        value := raw #> parts;

        -- #> yields SQL NULL for an absent path and 'null'::jsonb for a
        -- JSON null the provider actually sent. Only the first is a
        -- reason to skip.
        CONTINUE WHEN value IS NULL;

        -- jsonb_set cannot create intermediate objects, so walk the
        -- prefixes and place an empty one wherever the parent is missing.
        depth := array_length(parts, 1);
        FOR i IN 1 .. depth - 1 LOOP
            prefix := parts[1:i];
            IF kept #> prefix IS NULL THEN
                kept := jsonb_set(kept, prefix, '{}'::jsonb, true);
            END IF;
        END LOOP;

        kept := jsonb_set(kept, parts, value, true);
    END LOOP;

    RETURN kept;
END;
$redact$;

COMMENT ON FUNCTION redact_webhook_payload(jsonb) IS
    'Rebuilds a Razorpay webhook body from the retention allowlist. Idempotent. Mirrors REDACTION_ALLOWLIST in @acos/core-payments.';


-- ---- 3. The read surface with no payload ------------------------------
--
-- Every column of webhook_events except the body, plus a flag saying
-- whether the body has been narrowed. Anything that wants to answer
-- "did we receive this event, and did we process it?" -- support tooling,
-- dashboards, reconciliation -- should read THIS, so that exposing the
-- payload requires naming the base table deliberately.

CREATE OR REPLACE VIEW "webhook_events_audit" AS
SELECT
    "id",
    "provider",
    "razorpay_event_id",
    "event_name",
    "order_id",
    "signature_valid",
    "received_at",
    "processed_at",
    "processing_error",
    "payload_redacted_at",
    ("payload_redacted_at" IS NOT NULL) AS "payload_is_redacted",
    "created_at",
    "updated_at"
FROM "webhook_events";

COMMENT ON VIEW "webhook_events_audit" IS
    'webhook_events without the provider body. The intended read surface; the base table is for the ingest path and forensics only.';


-- ---- 4. Finding the rows that are due ---------------------------------
--
-- The redaction job asks one question: "received before X and not yet
-- redacted?". A partial index answers it while indexing only the rows
-- that can still match -- once a row is redacted it leaves the index for
-- good, so the index shrinks as the job does its work rather than growing
-- with the table.

CREATE INDEX IF NOT EXISTS "webhook_events_payload_retention_idx"
    ON "webhook_events" ("received_at")
    WHERE "payload_redacted_at" IS NULL;
