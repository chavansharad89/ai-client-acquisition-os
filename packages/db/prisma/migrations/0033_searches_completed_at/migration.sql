-- 0033_searches_completed_at
-- =======================================================================
-- Search completion timestamp (B-5), authorized under
-- CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
--
-- PCG-4's denominator (ED-8) needs "users with >=1 Search whose status is
-- COMPLETE in the relevant window" — `updated_at` is touched by every
-- state transition (attempt failure, lease changes), so it cannot
-- disambiguate "completed in this window" from "merely touched in this
-- window". completed_at is set exactly once, only by completeClaimed(),
-- reusing its existing lease/idempotency semantics (no change to that
-- WHERE clause).
--
-- Additive only.
-- =======================================================================

ALTER TABLE "searches" ADD COLUMN "completed_at" TIMESTAMP(3);
