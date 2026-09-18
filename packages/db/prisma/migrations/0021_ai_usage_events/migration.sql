-- 0021_ai_usage_events
-- =======================================================================
-- AiUsageEvent (PRD V2.2 R-29, AC-24; Phase 16 scope lock
-- requirement/PHASE_16_R29_PREFLIGHT_SCOPE_LOCK.md): "minimum
-- instrumentation to understand execution cost." One row per actual
-- provider/model invocation that produced a provider response with
-- usage (scope lock D1/D7) -- initial, repair, and any provider-error
-- retry of either get their own row; a call that fails before returning
-- a response is not represented here at all.
--
-- Ownership (scope lock D2/D3): top-level user_id, NOT DEC-008's
-- inheritance exception -- that remains limited to exactly
-- research_signals/opportunity_scores, per migration 0016's own
-- comment. user_id is carried directly because @acos/core-research's
-- runResearch()/@acos/core-ai-usage's runMeteredResearch() already
-- resolve it via requireUser() before any AI call -- the same reasoning
-- migration 0020's feedback table documents. prospect_id places the
-- event under the Prospect being researched, not Search: no
-- Search->AI-execution path exists anywhere in this repository (that
-- wiring is R-34/Phase 17, explicitly out of bounds here).
--
-- Idempotency (scope lock D8): UNIQUE(provider, provider_message_id).
-- provider_message_id is the provider's own response identifier (for
-- Anthropic, Message.id -- unique per response, confirmed against the
-- installed SDK's own type declarations). Recording the same provider
-- response twice must not create a second row -- see
-- @acos/core-ai-usage's pgRepository.ts, which INSERTs with
-- ON CONFLICT (provider, provider_message_id) DO NOTHING and reads back
-- the original row on conflict, the same convention
-- @acos/core-entitlements' grant() and @acos/core-payments' webhook
-- dedupe use.
--
-- No monetary column of any kind (scope lock D10/D11) -- this table
-- measures provider-reported token usage, not spend, and none of
-- currency/price/amount/pricing_version is authorized. No prompt or
-- response content is stored (D13).
--
-- Additive only, numbered after 0020 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled.
-- =======================================================================

CREATE TABLE "ai_usage_events" (
    "id"                            TEXT NOT NULL,
    "user_id"                       TEXT NOT NULL,
    "prospect_id"                   TEXT NOT NULL,

    "provider"                      TEXT NOT NULL,
    "model"                         TEXT NOT NULL,
    -- 'initial' | 'repair' -- @acos/core-research's researcher.ts's own
    -- retry-loop vocabulary (see its repairRoots-based distinction). A
    -- provider-error retry of the first attempt is still 'initial': it
    -- retries the same original message, not a repair round.
    "request_kind"                  TEXT NOT NULL,

    -- The provider's own response identifier -- the idempotency
    -- identity (D8). Only ever populated for a response that actually
    -- carried usage (see input_tokens/output_tokens below).
    "provider_message_id"           TEXT NOT NULL,

    -- Provider-reported usage (D6). Required: a row is only ever
    -- inserted for a provider response that carried usage (D7) -- there
    -- is no "row with unknown required usage" case.
    "input_tokens"                  INTEGER NOT NULL,
    "output_tokens"                 INTEGER NOT NULL,
    -- Optional cache-usage breakdown -- NULL, never 0, when the
    -- provider's response omits it (D6).
    "cache_creation_input_tokens"   INTEGER,
    "cache_read_input_tokens"       INTEGER,

    "created_at"                    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ai_usage_events_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_usage_events_prospect_id_fkey"
        FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_usage_events_request_kind_check"
        CHECK ("request_kind" IN ('initial', 'repair')),
    CONSTRAINT "ai_usage_events_input_tokens_non_negative"
        CHECK ("input_tokens" >= 0),
    CONSTRAINT "ai_usage_events_output_tokens_non_negative"
        CHECK ("output_tokens" >= 0),
    CONSTRAINT "ai_usage_events_cache_creation_input_tokens_non_negative"
        CHECK ("cache_creation_input_tokens" IS NULL OR "cache_creation_input_tokens" >= 0),
    CONSTRAINT "ai_usage_events_cache_read_input_tokens_non_negative"
        CHECK ("cache_read_input_tokens" IS NULL OR "cache_read_input_tokens" >= 0)
);

-- Every ownership-scoped query filters on user_id; same rationale as
-- feedback_user_id_idx (migration 0020).
CREATE INDEX "ai_usage_events_user_id_idx" ON "ai_usage_events"("user_id");

-- Lineage / read-by-Prospect lookups filter on this column.
CREATE INDEX "ai_usage_events_prospect_id_idx" ON "ai_usage_events"("prospect_id");

-- The idempotency boundary (D8) and recordEvent()'s ON CONFLICT target.
CREATE UNIQUE INDEX "ai_usage_events_provider_provider_message_id_key"
    ON "ai_usage_events"("provider", "provider_message_id");
