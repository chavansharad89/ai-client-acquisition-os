-- 0031_funnel_events
-- =======================================================================
-- Generic append-only funnel event log (ED-1), authorized under
-- CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
--
-- Serves two of the gate instrumentation needs: PCG-3A/3B tier-exposure
-- ("upsell_viewed") and PCG-6/B-1's "opportunity_reviewed" event. Both are
-- the same shape (who / what / when / payload), so one table serves both
-- rather than bespoke tables per event name.
--
-- Raw SQL, not a Prisma model: this is an acquisition-domain table
-- (alongside searches, feedback), not part of the commerce-core six
-- models in schema.prisma.
--
-- Identity (ED-2): a row carries EITHER visitor_id (anonymous, pre-auth)
-- OR user_id (authenticated), sometimes both once an anonymous visitor
-- later authenticates. The actual anonymous->identified MERGE is deferred
-- (ED-2) — this migration only reserves both columns.
--
-- First-exposure / first-view-only semantics (B-1, PCG-3A/3B "exposure
-- start = first exposure") are enforced by the two partial unique
-- indexes below, reusing the WebhookEvent/MetaEvent `ON CONFLICT DO
-- NOTHING` dedupe idiom (migrations 0007/0002): the first successful
-- insert for a given (event_name, identity, subject_id) IS the
-- first-exposure/first-view row; every later attempt is a no-op.
--
-- Additive only.
-- =======================================================================

CREATE TABLE "funnel_events" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "event_name"   TEXT NOT NULL,
    "visitor_id"   TEXT,
    "user_id"      TEXT,
    "subject_type" TEXT NOT NULL,
    "subject_id"   TEXT NOT NULL,
    "payload"      JSONB NOT NULL DEFAULT '{}',
    "occurred_at"  TIMESTAMP(3) NOT NULL,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "funnel_events_has_identity"
        CHECK ("visitor_id" IS NOT NULL OR "user_id" IS NOT NULL)
);

-- First-exposure/first-view dedupe, anonymous identity.
CREATE UNIQUE INDEX "funnel_events_visitor_dedup_idx"
    ON "funnel_events"("event_name", "visitor_id", "subject_id")
    WHERE "visitor_id" IS NOT NULL;

-- First-exposure/first-view dedupe, authenticated identity.
CREATE UNIQUE INDEX "funnel_events_user_dedup_idx"
    ON "funnel_events"("event_name", "user_id", "subject_id")
    WHERE "user_id" IS NOT NULL;

-- Gate computation's access pattern: scan one event_name within a rolling
-- window.
CREATE INDEX "funnel_events_event_name_occurred_at_idx"
    ON "funnel_events"("event_name", "occurred_at");
