-- 0041_lead_unlocks
-- =======================================================================
-- Permanent, no-credit unlock (reveal) grant for one Opportunity by one
-- user, authorized under
-- CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002 and
-- requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md
-- (Revision 5) §E.3. Carries no debit, balance, or credit reference --
-- the credit-ledger model this table might once have belonged to was
-- removed by the Product Owner before this migration was authorized
-- (see CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md §6,
-- §11).
--
-- `UNIQUE(user_id, opportunity_id)` is THE idempotency key for the whole
-- unlock transaction (Q-UNLOCK-1's idempotency requirement): a retried
-- or duplicate unlock request hits this constraint and the caller
-- re-reads the existing row rather than re-processing, the same
-- "self-heal via re-read" idiom createOrder.ts already uses for its own
-- idempotency key.
--
-- `subscription_period_id` is PROVENANCE ONLY, not a re-check gate --
-- ownership survives the period's own later expiry (IRL-I: a permanently
-- unlocked lead stays visible regardless of later expiry). FK is
-- RESTRICT, matching claim_tokens.order_id's precedent, because
-- subscription_periods rows are never deleted (0040's own header).
--
-- Additive only, numbered after 0040. Nothing existing is altered.
-- =======================================================================

CREATE TABLE "lead_unlocks" (
    "id"                      TEXT NOT NULL,
    "user_id"                 TEXT NOT NULL,
    "opportunity_id"          TEXT NOT NULL,
    "subscription_period_id"  TEXT NOT NULL,
    "unlocked_at"             TIMESTAMP(3) NOT NULL,

    "created_at"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_unlocks_pkey" PRIMARY KEY ("id")
);

-- The idempotency anchor (Q-UNLOCK-1): one unlock (reveal) per
-- (user, opportunity) pair, ever.
CREATE UNIQUE INDEX "lead_unlocks_user_id_opportunity_id_key"
    ON "lead_unlocks"("user_id", "opportunity_id");

CREATE INDEX "lead_unlocks_opportunity_id_idx" ON "lead_unlocks"("opportunity_id");
CREATE INDEX "lead_unlocks_subscription_period_id_idx" ON "lead_unlocks"("subscription_period_id");

ALTER TABLE "lead_unlocks" ADD CONSTRAINT "lead_unlocks_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_unlocks" ADD CONSTRAINT "lead_unlocks_opportunity_id_fkey"
    FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_unlocks" ADD CONSTRAINT "lead_unlocks_subscription_period_id_fkey"
    FOREIGN KEY ("subscription_period_id") REFERENCES "subscription_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
