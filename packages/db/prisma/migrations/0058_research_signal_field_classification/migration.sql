-- 0058_research_signal_field_classification
-- =======================================================================
-- Global Entity Architecture (D9/D22; OQ-6/Q4;
-- ENGINEERING_SPECIFICATION_FINAL.md §10 "Implementation Readiness
-- Matrix" / Q4 "Implementation contract"). Field-level (not kind-level)
-- public/private classification reference table for research_signals
-- fields. Purely additive metadata -- changes nothing about who can
-- read what; no existing research_signals row is touched.
--
-- Pre-populated per OQ-6 (companySummary/businessModel public-eligible;
-- websiteIssues/contentOpportunities/aiOpportunities/growthOpportunities
-- private) and Q4's interim default (targetCustomers/visibleProblems/
-- automationOpportunities default private, pending a future PO decision
-- to reclassify any of them public -- not decided here).
--
-- Invariant (Q4's "most important invariant" for this design): any
-- future read path serving public-eligible fields must treat an
-- UNLISTED field value as private by default (fail closed), never as
-- public by default (fail open). This is enforced by application code
-- reading this table, not by the table itself, since a table has no
-- way to enforce "absent row -> treat as private" on its own -- that is
-- the caller's required behavior, specified here for traceability.
-- =======================================================================

CREATE TABLE "research_signal_field_classification" (
    "field"       TEXT NOT NULL,
    "visibility"  TEXT NOT NULL,

    CONSTRAINT "research_signal_field_classification_pkey" PRIMARY KEY ("field"),
    CONSTRAINT "research_signal_field_classification_visibility_check"
        CHECK ("visibility" IN ('PUBLIC_ELIGIBLE', 'PRIVATE'))
);

INSERT INTO "research_signal_field_classification" ("field", "visibility") VALUES
    ('companySummary', 'PUBLIC_ELIGIBLE'),
    ('businessModel', 'PUBLIC_ELIGIBLE'),
    ('websiteIssues', 'PRIVATE'),
    ('contentOpportunities', 'PRIVATE'),
    ('aiOpportunities', 'PRIVATE'),
    ('growthOpportunities', 'PRIVATE'),
    ('targetCustomers', 'PRIVATE'),
    ('visibleProblems', 'PRIVATE'),
    ('automationOpportunities', 'PRIVATE');
