-- 0039_claim_tokens_invalidated_at
-- =======================================================================
-- DEC-014 D4 (latest-link-wins): when a new claim token is issued for an
-- order, any previous unused token for that order must stop working.
-- `claimed_at` already means "consumed" and must not be overloaded to
-- also mean "superseded by a newer link" — those are different reasons
-- a token stopped being valid, and `claimed_at IS NOT NULL` already
-- carries a specific meaning elsewhere (the single-use consume gate).
-- A separate, additive column keeps both meanings distinct.
-- =======================================================================

ALTER TABLE "claim_tokens" ADD COLUMN "invalidated_at" TIMESTAMP(3);
