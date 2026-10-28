-- 0042_lead_unlock_contacts
-- =======================================================================
-- Captures the contact value(s) revealed by one lead_unlocks row,
-- authorized under CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md
-- §13/§15 (Option C) and
-- requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md
-- (Revision 5) §E.5.
--
-- Supersedes the two scalar `revealed_business_email`/`revealed_phone`
-- columns earlier revisions of the plan proposed directly on
-- lead_unlocks: a fixed pair of columns cannot hold more than one value
-- per kind, and the contact-display rule (plan §G) requires surfacing
-- every qualifying channel found, not just one of each.
--
-- One row per distinct (kind, value) revealed for a given unlock.
-- Populated exactly once, inside the same transaction that inserts the
-- owning lead_unlocks row (plan §G step (b)-(c)) -- never at ingestion
-- time, never touching Path A, Path B, or K1
-- (packages/core-research/src/contactIdentifiers.ts, unmodified).
-- `kind` deliberately excludes 'FRAGMENT' -- K1 never treats it as a
-- qualifying contact kind (see contactIdentifiers.ts).
--
-- Additive only, numbered after 0041. Nothing existing is altered.
-- =======================================================================

CREATE TABLE "lead_unlock_contacts" (
    "id"             TEXT NOT NULL,
    "lead_unlock_id" TEXT NOT NULL,
    "kind"           TEXT NOT NULL,
    "value"          TEXT NOT NULL,

    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_unlock_contacts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lead_unlock_contacts_kind_check"
        CHECK ("kind" IN ('BUSINESS_EMAIL', 'PERSONAL_EMAIL', 'UNCERTAIN_EMAIL', 'PHONE'))
);

-- De-duplication anchor: at most one row per distinct (kind, value) per
-- unlock, mirroring the extraction module's own
-- "(kind, normalized value)" de-dup rule (capture spike §8) at the
-- storage layer too.
CREATE UNIQUE INDEX "lead_unlock_contacts_lead_unlock_id_kind_value_key"
    ON "lead_unlock_contacts"("lead_unlock_id", "kind", "value");

CREATE INDEX "lead_unlock_contacts_lead_unlock_id_idx" ON "lead_unlock_contacts"("lead_unlock_id");

ALTER TABLE "lead_unlock_contacts" ADD CONSTRAINT "lead_unlock_contacts_lead_unlock_id_fkey"
    FOREIGN KEY ("lead_unlock_id") REFERENCES "lead_unlocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
