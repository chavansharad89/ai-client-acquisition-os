-- 0014_searches
-- =======================================================================
-- Search: the second user-owned Client Finder domain object (PRD V2.1
-- R-05). An asynchronous, owned, resumable unit of work started from a
-- ServiceProfile (migration 0013).
--
-- Two things this table must hold, per R-05 and DEC-007:
--
--   1. An IMMUTABLE SNAPSHOT of the seven ServiceProfile fields as they
--      were at Search-creation time (service, target_customer, geography,
--      min_project_value_paise, triggers, keywords, rationale). These
--      columns are never re-read from service_profiles after INSERT — a
--      later edit to the profile must not change what a completed Search
--      meant. service_profile_id is retained separately, for lineage
--      display only.
--
--   2. Job state for the worker that will claim and execute it in a later
--      phase (attempts, last_error, lease_owner, lease_expires_at,
--      idempotency_key) — see PRD V2.1 "WORKER OWNERSHIP": the worker
--      claims a row and reads ownership out of it; it is never handed a
--      userId. This migration only fixes the storage shape; no worker
--      claims a Search row yet (that is Discovery/Worker execution, R-06
--      / R-34 — explicitly out of scope for this phase, see
--      MVP_SCOPE_BOUNDARY.md).
--
-- Status vocabulary is fixed by R-05: PENDING, RUNNING, COMPLETE, FAILED,
-- CANCELLED. No other value is valid; enforced by CHECK, not just at the
-- application boundary.
--
-- Additive only, numbered after 0013 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled.
-- =======================================================================


-- ---- searches ------------------------------------------------------------
--
-- Owned by `users` (R-01: the opaque id, never the email). Ownership is
-- enforced server-side on every read and write, via user_id — never a
-- caller-supplied id (see @acos/core-search).
--
-- service_profile_id references service_profiles ON DELETE RESTRICT.
--
-- NOT a V2.1 requirement — V2.1 says a Search must RETAIN
-- service_profile_id for lineage (R-05) and defines G-02 as "no orphaned
-- child rows", but nowhere specifies what must happen when a
-- ServiceProfile with existing Searches is deleted. RESTRICT is this
-- migration's own implementation choice to keep both of those properties
-- true (lineage stays resolvable, no orphan/no silently-nulled reference)
-- until product defines actual delete semantics. The visible consequence
-- today: deleteServiceProfile() on a profile that has any Search throws a
-- raw Postgres foreign-key-violation error, uncaught by
-- @acos/core-service-profile — this is NOT part of the MVP promise and is
-- an open decision for a later phase (see Phase 5 completion report),
-- not a resolved product policy.

CREATE TABLE "searches" (
    "id"                       TEXT NOT NULL,
    "user_id"                  TEXT NOT NULL,
    "service_profile_id"       TEXT NOT NULL,

    "status"                   TEXT NOT NULL DEFAULT 'PENDING',

    -- Immutable parameter snapshot (DEC-007) — copied from service_profiles
    -- at creation time, never re-read from it afterwards.
    "service"                  TEXT NOT NULL,
    "target_customer"          TEXT NOT NULL,
    "geography"                TEXT NOT NULL,
    "min_project_value_paise"  INTEGER NOT NULL,
    "triggers"                 TEXT[] NOT NULL DEFAULT '{}',
    "keywords"                 TEXT[] NOT NULL DEFAULT '{}',
    "rationale"                TEXT NOT NULL,

    -- Job state (R-05) — foundation for worker claiming in a later phase.
    "attempts"                 INTEGER NOT NULL DEFAULT 0,
    "last_error"               TEXT,
    "lease_owner"              TEXT,
    "lease_expires_at"         TIMESTAMP(3),
    "idempotency_key"          TEXT,

    "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "searches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "searches_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "searches_service_profile_id_fkey"
        FOREIGN KEY ("service_profile_id") REFERENCES "service_profiles"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "searches_status_check"
        CHECK ("status" IN ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED', 'CANCELLED')),
    CONSTRAINT "searches_min_project_value_paise_non_negative"
        CHECK ("min_project_value_paise" >= 0),
    CONSTRAINT "searches_attempts_non_negative"
        CHECK ("attempts" >= 0)
);

-- Every ownership-scoped query (getById, list, transition) filters on
-- user_id; this index is what keeps that filter cheap as the table grows.
CREATE INDEX "searches_user_id_idx" ON "searches"("user_id");

-- Lineage lookups (and the future worker's own bookkeeping) filter on the
-- originating profile.
CREATE INDEX "searches_service_profile_id_idx" ON "searches"("service_profile_id");

-- A client-supplied retry key is unique per user, never globally — same
-- scoping rule @acos/core-payments uses for order idempotency keys.
-- Partial: most Search rows carry no key at all.
CREATE UNIQUE INDEX "searches_user_id_idempotency_key_key"
    ON "searches"("user_id", "idempotency_key")
    WHERE "idempotency_key" IS NOT NULL;
