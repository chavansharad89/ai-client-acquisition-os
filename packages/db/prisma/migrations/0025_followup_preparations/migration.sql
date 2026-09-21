-- 0025_followup_preparations
-- =======================================================================
-- Follow-Up Preparation (Phase 23, R-61..R-69): gives
-- @acos/core-followup-preparation's deterministic generator somewhere to
-- persist a structured, evidence-backed, human-reviewable follow-up
-- draft for an existing Opportunity that already has an Outreach
-- Preparation (migration 0024) — a downstream consumer of Outreach
-- Preparation, never a second qualification/personalization/outreach-
-- drafting mechanism and never a sending mechanism.
--
-- NO-SEND / NO-SCHEDULE BY CONSTRUCTION (R-68): this table has no
-- `sent_at`, `delivered_at`, `scheduled_at`, `approved_by`, or
-- `approval_state` column, and `state` is CHECK-constrained to exactly
-- ('PREPARED', 'READY_FOR_REVIEW') — there is no value this column can
-- hold that represents or implies a successful (or attempted) outbound
-- transmission, or a scheduled future one. This is deliberate: the
-- schema itself, not just the application code, makes an outbound-send
-- or scheduled-send record unrepresentable.
--
-- Ownership (DEC-008): follow_up_preparations carries NO user_id. It is
-- the sixth named ownership-inheritance exception (alongside
-- research_signals migration 0016, opportunity_scores migration 0018,
-- qualifications migration 0022, personalizations migration 0023, and
-- outreach_preparations migration 0024). Ownership is inherited through
-- opportunity_id -> opportunities.user_id; every ownership-scoped read
-- joins to opportunities and filters there (see
-- @acos/core-followup-preparation's pgRepository.ts), the same
-- convention those five tables already use.
--
-- One current follow-up preparation per Opportunity, not an append-only
-- history (R-65/R-69, mirroring migration 0024's own outreach_preparations
-- design): UNIQUE(opportunity_id). Re-generation replaces the row via
-- upsert rather than inserting a new one. ResearchSignal, Qualification,
-- Personalization, and Outreach Preparation rows are never touched by
-- this table's writes.
--
-- source_outreach_preparation_id is a genuine foreign key (not merely
-- denormalised, unlike prospect_id below) to outreach_preparations.id,
-- so provenance (R-63) is enforced by the database itself, not just by
-- application convention: a follow_up_preparations row can never
-- reference an Outreach Preparation that does not exist.
--
-- Persisted shape (R-64): state ('PREPARED' | 'READY_FOR_REVIEW' — v1's
-- generator only ever writes 'READY_FOR_REVIEW', mirroring the Phase 22
-- scope-lock's identical Decision O1), follow_up_context, follow_up_content,
-- rationale (all generated prose), evidence (a bounded, ordered JSONB
-- array copied unmodified from the source Outreach Preparation's own
-- `evidence` column — mirrors migration 0024's JSONB choice, for the
-- same reason: evidence items have no independent identity of their own
-- to normalise into a child table), generator_version, generated_at.
--
-- prospect_id is denormalised onto this table (same rationale as
-- outreach_preparations.prospect_id in migration 0024) solely so a read
-- needs no second join through opportunities to see which Prospect this
-- follow-up was prepared for; it is never used for ownership, and is
-- kept in sync only because the row is always fully replaced, never
-- patched, on re-generation.
--
-- Additive only, numbered after 0024 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. No Phase 18/19/20/21/22 table or
-- column is touched.
-- =======================================================================


-- ---- follow_up_preparations ---------------------------------------------
--
-- Ownership inherited through opportunity_id -> opportunities.user_id
-- (DEC-008) -- never a denormalised user_id column here.

CREATE TABLE "follow_up_preparations" (
    "id"                              TEXT NOT NULL,
    "opportunity_id"                  TEXT NOT NULL,
    "prospect_id"                     TEXT NOT NULL,
    "source_outreach_preparation_id"  TEXT NOT NULL,

    "state"                           TEXT NOT NULL,

    "follow_up_context"               TEXT NOT NULL,
    "follow_up_content"               TEXT NOT NULL,
    "rationale"                       TEXT NOT NULL,

    -- Bounded, ordered array of PersonalizationEvidenceItem objects,
    -- copied unmodified from outreach_preparations.evidence
    -- ({signalId, field, kind, classification, signal, confidence, basis}).
    "evidence"                        JSONB NOT NULL,

    -- Identifies the generator build that produced this row (mirrors
    -- outreach_preparations.generator_version, migration 0024).
    "generator_version"               TEXT NOT NULL,
    "generated_at"                    TIMESTAMP(3) NOT NULL,

    "created_at"                      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_preparations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "follow_up_preparations_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follow_up_preparations_source_outreach_preparation_id_fkey"
        FOREIGN KEY ("source_outreach_preparation_id") REFERENCES "outreach_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follow_up_preparations_state_check"
        CHECK ("state" IN ('PREPARED', 'READY_FOR_REVIEW'))
);

-- One current follow-up preparation per Opportunity. Also the index every
-- ownership-safe lookup (getByOpportunityId, upsert) uses -- the join to
-- `opportunities` for the user_id filter is covered by that table's own
-- primary key and opportunities_user_id_idx (migration 0017).
CREATE UNIQUE INDEX "follow_up_preparations_opportunity_id_key" ON "follow_up_preparations"("opportunity_id");
