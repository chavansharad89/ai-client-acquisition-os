-- 0020_feedback
-- =======================================================================
-- Feedback (PRD V2.1 R-21, Stage R "FEEDBACK", AC-22): "Capture useful /
-- not useful plus a reason, persisted against the opportunity ...
-- Unpersisted feedback is a UI gesture, not feedback." Phases 9-13
-- exhausted MVP_SCOPE_BOUNDARY.md §5.4 (Opportunity); R-21 was the next
-- untouched MVP requirement, with no reusable implementation anywhere in
-- the repository.
--
-- reason is free-form TEXT, no CHECK constraint and no closed set (OQ-5
-- resolved: PRD V2.1's "Free text or a closed set ... Not decided" is
-- decided as free text -- the system must not categorize, classify or
-- rewrite a user's stated reason).
--
-- Ownership: Feedback carries its own user_id directly. It is a
-- top-level owned model, NOT one of DEC-008's two named ownership-
-- inheritance exceptions (research_signals, opportunity_scores) -- PRD
-- V2.1's "USER / TENANCY MODEL" places Feedback in the same top-level
-- chain as Opportunity/Search/Prospect/ServiceProfile, each of which
-- carries user_id directly (migration 0017's own comment: "user_id is
-- carried directly rather than only derived").
--
-- One current verdict per Opportunity, not an append-only history
-- (mirrors migration 0018's opportunity_scores / migration 0019's
-- staleness "explicit step, replace in place" convention):
-- UNIQUE(opportunity_id). Resubmitting feedback for the same Opportunity
-- replaces the existing verdict via upsert, never inserts a second row.
--
-- Additive only, numbered after 0019 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. Independent of the quarantined
-- 0005/0006 (see migrations-blocked/README.md) -- no CRM relation, no
-- outcome-tracking/improvement-loop table (R-27/R-28, out of scope for
-- this phase).
-- =======================================================================

CREATE TABLE "feedback" (
    "id"             TEXT NOT NULL,
    "user_id"        TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,

    "useful"         BOOLEAN NOT NULL,
    -- Free-form user text (OQ-5 resolved: free text, not a closed set).
    -- No CHECK constraint on content -- only non-emptiness is validated,
    -- at the application layer (@acos/core-opportunity's
    -- validateRecordFeedbackInput), never a category/taxonomy.
    "reason"         TEXT NOT NULL,

    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "feedback_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Every ownership-scoped query filters on user_id; this index is what
-- keeps that filter cheap as the table grows, the same rationale as
-- opportunities_user_id_idx (migration 0017).
CREATE INDEX "feedback_user_id_idx" ON "feedback"("user_id");

-- One current verdict per Opportunity (see header) -- also the conflict
-- target for upsert.
CREATE UNIQUE INDEX "feedback_opportunity_id_key" ON "feedback"("opportunity_id");
