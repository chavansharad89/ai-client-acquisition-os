-- 0024_outreach_preparations
-- =======================================================================
-- Outreach Preparation (Phase 22, R-54..R-60): gives
-- @acos/core-outreach-preparation's deterministic generator somewhere to
-- persist a structured, evidence-backed, human-reviewable draft message
-- for an existing Opportunity that already has a Personalization
-- (migration 0023) — a downstream consumer of Personalization, never a
-- second qualification/personalization mechanism and never a sending
-- mechanism.
--
-- NO-SEND BY CONSTRUCTION (R-58): this table has no `sent_at`,
-- `delivered_at`, `scheduled_at`, `approved_by`, or `approval_state`
-- column, and `state` is CHECK-constrained to exactly
-- ('PREPARED', 'READY_FOR_REVIEW') — there is no value this column can
-- hold that represents or implies a successful (or attempted) outbound
-- transmission. This is deliberate: the schema itself, not just the
-- application code, makes an outbound-send record unrepresentable.
--
-- Ownership (DEC-008): outreach_preparations carries NO user_id. It is
-- the fifth named ownership-inheritance exception (alongside
-- research_signals migration 0016, opportunity_scores migration 0018,
-- qualifications migration 0022, and personalizations migration 0023).
-- Ownership is inherited through opportunity_id -> opportunities.user_id;
-- every ownership-scoped read joins to opportunities and filters there
-- (see @acos/core-outreach-preparation's pgRepository.ts), the same
-- convention those four tables already use.
--
-- One current outreach preparation per Opportunity, not an append-only
-- history (R-57, mirroring migration 0023's own personalizations
-- design): UNIQUE(opportunity_id). Re-generation replaces the row via
-- upsert rather than inserting a new one. ResearchSignal, Qualification,
-- and Personalization rows are never touched by this table's writes.
--
-- source_personalization_id is a genuine foreign key (not merely
-- denormalised, unlike prospect_id below) to personalizations.id, so
-- provenance (R-56) is enforced by the database itself, not just by
-- application convention: an outreach_preparations row can never
-- reference a Personalization that does not exist.
--
-- Persisted shape (R-54): state ('PREPARED' | 'READY_FOR_REVIEW' —
-- see the Phase 22 scope-lock's Decision O1 for why only
-- 'READY_FOR_REVIEW' is ever written by v1's generator), subject_line,
-- message_body, call_to_action (all generated prose), evidence (a
-- bounded, ordered JSONB array copied unmodified from the source
-- Personalization's own `evidence` column — mirrors migration 0023's
-- JSONB choice, for the same reason: evidence items have no independent
-- identity of their own to normalise into a child table), generator_version,
-- generated_at.
--
-- prospect_id is denormalised onto this table (same rationale as
-- personalizations.prospect_id in migration 0023) solely so a read needs
-- no second join through opportunities to see which Prospect this draft
-- was prepared for; it is never used for ownership, and is kept in sync
-- only because the row is always fully replaced, never patched, on
-- re-generation.
--
-- Additive only, numbered after 0023 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. No Phase 18/19/20/21 table or column
-- is touched.
-- =======================================================================


-- ---- outreach_preparations --------------------------------------------
--
-- Ownership inherited through opportunity_id -> opportunities.user_id
-- (DEC-008) -- never a denormalised user_id column here.

CREATE TABLE "outreach_preparations" (
    "id"                         TEXT NOT NULL,
    "opportunity_id"             TEXT NOT NULL,
    "prospect_id"                TEXT NOT NULL,
    "source_personalization_id"  TEXT NOT NULL,

    "state"                      TEXT NOT NULL,

    "subject_line"               TEXT NOT NULL,
    "message_body"               TEXT NOT NULL,
    "call_to_action"             TEXT NOT NULL,

    -- Bounded, ordered array of PersonalizationEvidenceItem objects,
    -- copied unmodified from personalizations.evidence
    -- ({signalId, field, kind, classification, signal, confidence, basis}).
    "evidence"                   JSONB NOT NULL,

    -- Identifies the generator build that produced this row (mirrors
    -- personalizations.generator_version, migration 0023).
    "generator_version"          TEXT NOT NULL,
    "generated_at"               TIMESTAMP(3) NOT NULL,

    "created_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_preparations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outreach_preparations_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outreach_preparations_source_personalization_id_fkey"
        FOREIGN KEY ("source_personalization_id") REFERENCES "personalizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outreach_preparations_state_check"
        CHECK ("state" IN ('PREPARED', 'READY_FOR_REVIEW'))
);

-- One current outreach preparation per Opportunity. Also the index every
-- ownership-safe lookup (getByOpportunityId, upsert) uses -- the join to
-- `opportunities` for the user_id filter is covered by that table's own
-- primary key and opportunities_user_id_idx (migration 0017).
CREATE UNIQUE INDEX "outreach_preparations_opportunity_id_key" ON "outreach_preparations"("opportunity_id");
