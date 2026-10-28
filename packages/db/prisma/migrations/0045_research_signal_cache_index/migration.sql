-- 0045_research_signal_cache_index
-- =======================================================================
-- Phase 4 (CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md
-- Phase 4 -- "Cache-First Evidence Reuse"), authorized by
-- CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001.
--
-- DATABASE GATE finding: research_signals carries no user_id (DEC-008 --
-- ownership inherits through prospect_id -> prospects.user_id) and no
-- domain column (normalized_domain lives on companies, reached only via
-- prospect_id -> prospects.company_id -> companies.normalized_domain, a
-- two-hop join). No existing index supports a (user, domain, signal kind)
-- lookup. This table is a pointer/index only -- it duplicates no evidence
-- content (no signal/basis/confidence/source columns); every read still
-- goes back to research_signals/research_signal_sources, so reuse can
-- never diverge from, or rewrite, the original evidence (CF-SAME-
-- FREELANCER-EVIDENCE-REUSE-PO-DEC-001, "Evidence Integrity" section).
--
-- Same-freelancer only (PO decision points 6/7): user_id is denormalized onto
-- this table itself specifically so the lookup never has to join through
-- prospects, and so a cross-user query is structurally impossible without
-- also supplying a different user_id -- there is no table or view here
-- that spans owners.
--
-- Kind vocabulary deliberately excludes PUBLIC_INTENT/FIRST_PARTY (unlike
-- research_signals_kind_check, migration 0029): those two kinds are
-- captured, owner-specific intent EVENTS (see intentSignal.ts), not
-- "public/non-owner-specific factual evidence about a business" -- the
-- only evidence category this authorization permits reusing. A signal of
-- either kind is simply never recorded into this index (see
-- @acos/core-research's service.ts).
--
-- No uniqueness on (user_id, normalized_domain, signal_kind) alone: the
-- plan's Phase 4 "conflicting" cache-hit outcome requires more than one
-- live (non-superseded) signal to remain representable per key; "latest"
-- is resolved at query time by ORDER BY observed_at DESC, not by a
-- unique constraint here.
--
-- Freshness (CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001): exact per-kind TTL
-- values are an explicit, still-open PO non-decision -- not invented here
-- or in application code. No TTL/expiry column exists on this table;
-- freshness is evaluated at read time by application code that currently
-- always reports STALE pending that decision (see
-- @acos/core-research's signalCache.ts).
--
-- Retention: append-only, like research_signals itself. A superseded
-- research_signals row is not pruned from this index; a lookup always
-- re-joins to research_signals and filters WHERE superseded_at IS NULL,
-- so a stale index row simply stops matching rather than needing its own
-- cleanup job (no new retention policy invented).
-- =======================================================================

CREATE TABLE "research_signal_cache_index" (
    "id"                 TEXT NOT NULL,
    "user_id"            TEXT NOT NULL,
    "normalized_domain"  TEXT NOT NULL,
    "signal_kind"        TEXT NOT NULL,
    "signal_id"          TEXT NOT NULL,
    "observed_at"        TIMESTAMP(3) NOT NULL,

    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "research_signal_cache_index_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "research_signal_cache_index_signal_id_fkey"
        FOREIGN KEY ("signal_id") REFERENCES "research_signals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "research_signal_cache_index_kind_check"
        CHECK ("signal_kind" IN ('WEBSITE', 'JOB_POST', 'LINKEDIN', 'NEWS', 'FUNDING', 'TECH_STACK', 'REVIEW', 'MANUAL')),
    CONSTRAINT "research_signal_cache_index_unique_pointer"
        UNIQUE ("user_id", "normalized_domain", "signal_kind", "signal_id")
);

-- The cache lookup itself: same freelancer, same normalized domain, same
-- signal kind -- see Phase 4's "CACHE IDENTITY" scope.
CREATE INDEX "research_signal_cache_index_lookup_idx"
    ON "research_signal_cache_index"("user_id", "normalized_domain", "signal_kind");
