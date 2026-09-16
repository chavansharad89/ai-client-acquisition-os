-- 0015_discovery
-- =======================================================================
-- Discovery: turns a RUNNING Search into persisted, deduplicated
-- businesses (PRD V2.1 R-06/R-07/R-08, Stages E-G). Company and Prospect
-- are the third and fourth user-owned Client Finder domain objects.
--
-- Company (DEC-005): user-owned for MVP, NOT a global/shared identity —
-- the MVP is itself validating whether normalized_domain is a reliable
-- identity key; committing to a global namespace before that answer
-- exists bakes in a guess, and a wrong dedup rule in a shared namespace
-- would corrupt every user's data at once. UNIQUE(user_id,
-- normalized_domain) makes normalized_domain the PER-USER identity key:
-- rediscovering the same business in a later Search reuses the same
-- Company row instead of creating a duplicate.
--
-- Prospect: the join between a Search and a Company (V2.1 tenancy:
-- Search -> Prospect -- Company). UNIQUE(search_id, company_id) is the
-- MVP deduplication rule itself (R-08 / PFR-11 / release gate G-02):
-- one real business appears once within a Search, but the same business
-- may legitimately reappear in a later Search with fresh research —
-- which is exactly why this constraint is scoped to search_id, not
-- user_id. status is fixed to DISCOVERED only by this migration;
-- DISCOVERED -> RESEARCHED (Stage H) belongs to Research, out of scope
-- for this phase (see MVP_SCOPE_BOUNDARY.md).
--
-- Additive only, numbered after 0014 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. Independent of the quarantined
-- 0005/0006 (see migrations-blocked/README.md) — no acq_* table, no
-- OutreachChannel/OpportunityStage type, no CRM relation.
-- =======================================================================


-- ---- companies ------------------------------------------------------------
--
-- Owned by `users` (R-01: the opaque id). Ownership is enforced
-- server-side on every read and write, via user_id — never a
-- caller-supplied id (see @acos/core-discovery).
--
-- Minimal fields only (DEC-005: "do not over-model company metadata").
-- normalized_domain is persisted (PFR-10) as the deterministic join key
-- a future global-identity reconciliation would need — computed
-- identically for every row by @acos/core-discovery's normalizeDomain(),
-- never by this migration.

CREATE TABLE "companies" (
    "id"                  TEXT NOT NULL,
    "user_id"             TEXT NOT NULL,
    "name"                TEXT NOT NULL,
    "normalized_domain"   TEXT NOT NULL,

    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "companies_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Every ownership-scoped query filters on user_id; this index is what
-- keeps that filter cheap as the table grows.
CREATE INDEX "companies_user_id_idx" ON "companies"("user_id");

-- DEC-005's per-user identity key. Not a global namespace: two different
-- users discovering the same real business each get their own Company
-- row for it.
CREATE UNIQUE INDEX "companies_user_id_normalized_domain_key"
    ON "companies"("user_id", "normalized_domain");


-- ---- prospects --------------------------------------------------------
--
-- One row per (Search, Company) pair — the dedup boundary itself
-- (R-08/PFR-11). user_id is carried directly rather than only derived
-- through a join: DEC-008 names only research_signals and
-- opportunity_scores as the ownership-inheriting exceptions to "every
-- top-level MVP model carries user_id" — Prospect is a top-level owned
-- model per the V2.1 tenancy diagram, so it is enforced the same way as
-- every other table here.
--
-- search_id references searches ON DELETE CASCADE, company_id references
-- companies ON DELETE CASCADE: a Prospect has no meaning once either
-- parent is gone. NOT a V2.1 requirement — V2.1 only fixes the
-- UNIQUE(search_id, company_id) constraint and G-02's "no orphaned child
-- rows"; CASCADE is this migration's own choice to keep that second
-- property true, mirroring migration 0014's stated approach for the
-- same open question.

CREATE TABLE "prospects" (
    "id"          TEXT NOT NULL,
    "user_id"     TEXT NOT NULL,
    "search_id"   TEXT NOT NULL,
    "company_id"  TEXT NOT NULL,

    "status"      TEXT NOT NULL DEFAULT 'DISCOVERED',

    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prospects_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prospects_search_id_fkey"
        FOREIGN KEY ("search_id") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prospects_company_id_fkey"
        FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prospects_status_check"
        CHECK ("status" IN ('DISCOVERED'))
);

CREATE INDEX "prospects_user_id_idx" ON "prospects"("user_id");
CREATE INDEX "prospects_search_id_idx" ON "prospects"("search_id");
CREATE INDEX "prospects_company_id_idx" ON "prospects"("company_id");

-- The MVP deduplication rule (R-08/PFR-11/G-02): one real business
-- appears once within a Search. Scoped to search_id, NOT user_id — a
-- later Search may legitimately rediscover the same business.
CREATE UNIQUE INDEX "prospects_search_id_company_id_key"
    ON "prospects"("search_id", "company_id");
