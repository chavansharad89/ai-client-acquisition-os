-- 0006_opportunity_lifecycle
-- =======================================================================
-- Replaces the opportunity stage enum with the specified lifecycle and
-- adds pause provenance.
--
-- WHY A NEW TYPE RATHER THAN ALTER TYPE: three values are being RENAMED
-- (SOURCED -> NEW, PROPOSED -> PROPOSAL_SENT) and two REMOVED
-- (PERSONALIZED, FOLLOWING_UP). `ALTER TYPE ... RENAME VALUE` exists but
-- there is no `DROP VALUE`, so an in-place edit would leave two dead
-- values in the type forever. Creating the new type and swapping the
-- column is the only way to end up with exactly the nine intended states.
--
-- The old values are mapped, not discarded: PERSONALIZED becomes
-- RESEARCHED (the work was done, the message had not gone out) and
-- FOLLOWING_UP becomes CONTACTED (following up is what happens *in*
-- CONTACTED, which is why the state was removed).
-- =======================================================================

CREATE TYPE "OpportunityStage_new" AS ENUM (
  'NEW',
  'RESEARCHED',
  'CONTACTED',
  'REPLIED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
  'PAUSED'
);

ALTER TABLE "acq_opportunities"
  ALTER COLUMN "stage" DROP DEFAULT;

ALTER TABLE "acq_opportunities"
  ALTER COLUMN "stage" TYPE "OpportunityStage_new"
  USING (
    CASE "stage"::text
      WHEN 'SOURCED'      THEN 'NEW'
      WHEN 'PERSONALIZED' THEN 'RESEARCHED'
      WHEN 'FOLLOWING_UP' THEN 'CONTACTED'
      WHEN 'PROPOSED'     THEN 'PROPOSAL_SENT'
      ELSE "stage"::text
    END
  )::"OpportunityStage_new";

ALTER TABLE "acq_opportunities"
  ALTER COLUMN "stage" SET DEFAULT 'NEW';

DROP TYPE "OpportunityStage";
ALTER TYPE "OpportunityStage_new" RENAME TO "OpportunityStage";


-- ---- pause provenance --------------------------------------------------
--
-- A paused opportunity must remember where it came from. Without this,
-- resuming is a guess, and the commonest guess — "put it back in
-- CONTACTED" — silently restarts a sequence for a lead who was paused
-- mid-proposal.

ALTER TABLE "acq_opportunities"
  ADD COLUMN IF NOT EXISTS "paused_from_stage" "OpportunityStage",
  ADD COLUMN IF NOT EXISTS "paused_reason"     TEXT,
  ADD COLUMN IF NOT EXISTS "paused_until"      TIMESTAMP(3);

-- Pausing without a reason produces a queue of leads nobody can triage.
ALTER TABLE "acq_opportunities"
  DROP CONSTRAINT IF EXISTS "opportunity_paused_has_reason";
ALTER TABLE "acq_opportunities"
  ADD CONSTRAINT "opportunity_paused_has_reason"
  CHECK ("stage" <> 'PAUSED' OR ("paused_reason" IS NOT NULL AND "paused_from_stage" IS NOT NULL));

CREATE INDEX IF NOT EXISTS "acq_opportunities_paused_until_idx"
  ON "acq_opportunities"("paused_until") WHERE "stage" = 'PAUSED';
