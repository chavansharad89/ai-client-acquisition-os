-- 0053_companies_normalized_domain_nullable
-- =======================================================================
-- Global Entity Architecture, Website-less discovery (C-1;
-- Q5_CLOSURE §4.1/§4.3). This is the one MODIFYING, not purely
-- additive, schema change in the entire Global Entity Architecture
-- layer -- relaxing companies.normalized_domain from NOT NULL to
-- nullable, required by C-1's website-less discovery fix
-- (normalizeCandidate() no longer rejects a candidate for lacking a
-- website, scoped to packages/core-discovery/src/service.ts only).
--
-- This migration is safe to apply to the current database: no existing
-- row has a NULL normalized_domain today (every row was written under
-- the NOT NULL constraint this migration relaxes), so this migration
-- itself preserves all existing data byte-for-byte.
--
-- The existing UNIQUE(user_id, normalized_domain) index (migration 0015)
-- is dropped and replaced by a partial unique index that excludes NULL,
-- preserving today's exact dedup guarantee for domain-having companies.
-- Under ordinary Postgres NULL semantics, two NULL-domain rows are never
-- "equal" for a unique index -- a second website-less discovery for the
-- same user does NOT dedupe via this index; Entity-resolver-based dedup
-- (via identity_evidence, migration 0051) is the only mechanism that can
-- cover website-less companies, and only when Category 1-3 evidence is
-- actually present. This is a known, accepted, already-specified
-- consequence (ENGINEERING_SPECIFICATION_FINAL.md §6/§8), not a defect
-- introduced here.
-- =======================================================================

DROP INDEX "companies_user_id_normalized_domain_key";

ALTER TABLE "companies" ALTER COLUMN "normalized_domain" DROP NOT NULL;

CREATE UNIQUE INDEX "companies_user_id_normalized_domain_key"
    ON "companies"("user_id", "normalized_domain")
    WHERE "normalized_domain" IS NOT NULL;
