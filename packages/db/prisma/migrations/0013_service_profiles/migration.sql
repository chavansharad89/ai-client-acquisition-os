-- 0013_service_profiles
-- =======================================================================
-- ServiceProfile: the first user-owned Client Finder domain object (PRD
-- V2.1 DEC-004). Proves authenticated session -> server-derived userId ->
-- user-owned repository -> cross-user isolation.
--
-- Exactly the seven MVP fields (DEC-004): four user-authored (service,
-- target_customer, geography, min_project_value_paise) plus three
-- system-derived rule fields (triggers, keywords, rationale). No CRM
-- fields, no typical/estimated value columns — only the authoritative
-- min_project_value_paise.
--
-- Additive only, numbered after 0012 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled.
-- =======================================================================


-- ---- service_profiles ---------------------------------------------------
--
-- Owned by `users` (R-01: the opaque id, never the email). Ownership is
-- enforced server-side on every read and write, via user_id — never a
-- caller-supplied id (see @acos/core-service-profile).

CREATE TABLE "service_profiles" (
    "id"                       TEXT NOT NULL,
    "user_id"                  TEXT NOT NULL,

    "service"                  TEXT NOT NULL,
    "target_customer"          TEXT NOT NULL,
    "geography"                TEXT NOT NULL,
    "min_project_value_paise"  INTEGER NOT NULL,

    -- System-derived rule fields (DEC-004). How they are derived is an
    -- open question (OQ-4); this migration only fixes the storage shape.
    "triggers"                 TEXT[] NOT NULL DEFAULT '{}',
    "keywords"                 TEXT[] NOT NULL DEFAULT '{}',
    "rationale"                TEXT NOT NULL,

    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_profiles_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_profiles_min_project_value_paise_non_negative"
        CHECK ("min_project_value_paise" >= 0)
);

-- Every ownership-scoped query (getById, list, update, delete) filters on
-- user_id; this index is what keeps that filter cheap as the table grows.
CREATE INDEX "service_profiles_user_id_idx" ON "service_profiles"("user_id");
