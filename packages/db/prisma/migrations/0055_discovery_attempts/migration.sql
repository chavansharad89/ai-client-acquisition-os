-- 0055_discovery_attempts
-- =======================================================================
-- Global Entity Architecture (OQ-8; Q5_CLOSURE §4.1, Q3). A separate
-- pre-Entity discovery/attempt log for provider results that fail
-- normalization and therefore cannot produce an Entity -- discovery_events
-- (migration 0054) remains strictly associated with a resolved Entity
-- (entity_id stays non-nullable there), exactly as D21 states.
--
-- Structurally -- not conventionally -- no entity_id column exists on
-- this table at all: this is the actual mechanism that prevents a fake
-- Entity from ever being associated with a failed-normalization attempt.
--
-- failure_reason is a closed, enumerated CHECK list, not open-ended free
-- text -- the exact two reasons normalizeCandidate() currently produces
-- (packages/core-discovery/src/normalize.ts). No raw candidate payload
-- column (Q3's engineering-resolved decision, grounded in migration
-- 0011's own lesson about unbounded raw-payload accumulation with no
-- reader).
--
-- No uniqueness -- duplicates are expected and harmless. Insert-only.
-- =======================================================================

CREATE TABLE "discovery_attempts" (
    "id"             TEXT NOT NULL,
    "search_id"      TEXT,
    "provider"       TEXT NOT NULL,
    "actual_query"   TEXT NOT NULL,
    "failure_reason" TEXT NOT NULL,
    "attempted_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "discovery_attempts_search_id_fkey"
        FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discovery_attempts_failure_reason_check"
        CHECK ("failure_reason" IN ('MISSING_NAME', 'MISSING_WEBSITE_UNPARSEABLE'))
);

CREATE INDEX "discovery_attempts_search_id_idx" ON "discovery_attempts"("search_id");
