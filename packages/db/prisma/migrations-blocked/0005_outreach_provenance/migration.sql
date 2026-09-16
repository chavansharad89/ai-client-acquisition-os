-- 0005_outreach_provenance
-- =======================================================================
-- Adds the two channels the outreach generator writes for, and the
-- provenance + approval columns every generated message must carry.
--
-- ON THE ENUM ADDITIONS: since PostgreSQL 12, `ALTER TYPE ... ADD VALUE`
-- MAY run inside a transaction block — so Prisma can apply this file
-- normally. The restriction that remains is that a newly added value
-- cannot be USED in the same transaction that added it. This migration
-- only adds the values; nothing here inserts a row using them, so it is
-- safe as a single transactional migration.
--
-- (This is a different constraint from CREATE INDEX CONCURRENTLY, which
-- genuinely cannot run in a transaction at all — see migration 0002.)
-- =======================================================================


-- ---- channels ----------------------------------------------------------

ALTER TYPE "OutreachChannel" ADD VALUE IF NOT EXISTS 'INSTAGRAM_DM';
ALTER TYPE "OutreachChannel" ADD VALUE IF NOT EXISTS 'WHATSAPP';


-- ---- approval state ----------------------------------------------------
--
-- Separate from MessageStatus, which tracks DELIVERY (queued, sent,
-- bounced). Approval tracks PERMISSION. Conflating them would make
-- "approved" and "delivered" the same column and lose the ability to say
-- a message was approved but has not gone out yet.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OutreachApprovalState') THEN
    CREATE TYPE "OutreachApprovalState" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'SENT');
  END IF;
END
$$;


-- ---- provenance on generated messages ----------------------------------

ALTER TABLE "acq_outreach_messages"
    ADD COLUMN IF NOT EXISTS "model"            TEXT,
    ADD COLUMN IF NOT EXISTS "prompt_version"   TEXT,
    ADD COLUMN IF NOT EXISTS "generated_at"     TIMESTAMP(3),
    -- Identifies the research run the evidence came from, so messages
    -- built on research later found to be wrong can be located and pulled.
    ADD COLUMN IF NOT EXISTS "research_version" TEXT,
    ADD COLUMN IF NOT EXISTS "evidence_used"    JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "impact_claim"     TEXT,
    ADD COLUMN IF NOT EXISTS "call_to_action"   TEXT,

    ADD COLUMN IF NOT EXISTS "approval_state"   "OutreachApprovalState" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS "approved_by"      TEXT,
    ADD COLUMN IF NOT EXISTS "approved_at"      TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "rejected_reason"  TEXT,
    ADD COLUMN IF NOT EXISTS "edited_by_human"  BOOLEAN NOT NULL DEFAULT false;

-- An approved message must record who approved it. Anonymous approval is
-- not approval — it is a checkbox.
ALTER TABLE "acq_outreach_messages"
    DROP CONSTRAINT IF EXISTS "outreach_approved_has_approver";
ALTER TABLE "acq_outreach_messages"
    ADD CONSTRAINT "outreach_approved_has_approver"
    CHECK ("approval_state" <> 'APPROVED' OR "approved_by" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "acq_outreach_messages_approval_state_idx"
    ON "acq_outreach_messages"("approval_state");
CREATE INDEX IF NOT EXISTS "acq_outreach_messages_research_version_idx"
    ON "acq_outreach_messages"("research_version");


-- ---- the send gate -----------------------------------------------------
--
-- The application enforces the approval state machine, but the database
-- enforces the one rule that matters most: nothing reaches SENT without
-- having been approved by a named person. A bug in the sender, an admin
-- script, or a psql session cannot route around this.

CREATE OR REPLACE FUNCTION enforce_outreach_send_requires_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'SENT' AND NEW.approval_state <> 'SENT' THEN
    RAISE EXCEPTION
      'outreach_send_requires_approval: message % cannot be marked SENT while approval_state is %',
      NEW.id, NEW.approval_state
      USING ERRCODE = '23514';
  END IF;

  IF NEW.approval_state = 'SENT' AND NEW.approved_by IS NULL THEN
    RAISE EXCEPTION
      'outreach_send_requires_approval: message % was sent with no recorded approver',
      NEW.id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS outreach_send_requires_approval ON acq_outreach_messages;
CREATE TRIGGER outreach_send_requires_approval
  BEFORE INSERT OR UPDATE OF status, approval_state, approved_by ON acq_outreach_messages
  FOR EACH ROW EXECUTE FUNCTION enforce_outreach_send_requires_approval();
