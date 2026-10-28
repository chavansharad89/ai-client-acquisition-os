-- 0051_identity_evidence
-- =======================================================================
-- Global Entity Architecture (D12/D13/D22/D23; OQ-1/OQ-2/OQ-3/OQ-4;
-- Q5_CLOSURE §4.1). Append-only identity observations used by the
-- resolver to decide whether a new discovery matches an existing Entity.
--
-- category is exactly D22's four categories, named explicitly so a fifth
-- cannot be silently introduced by a typo:
--   PROVIDER_STABLE_ID     -- e.g. Google Place ID. May resolve alone (OQ-1).
--   OFFICIAL_DIGITAL_IDENTITY -- domain, official profile URL.
--   VERIFIED_CONTACT       -- verified phone, verified business email.
--   WEAK_SUPPORTING        -- name, geography, category, textual similarity,
--                             reviews/descriptions. NEVER independently
--                             resolves or merges an Entity (D12,
--                             unconditional) -- deliberately has no
--                             uniqueness constraint below.
--
-- The two partial unique indexes are what make a Place ID / domain /
-- profile-URL / phone / business-email collision a constraint violation
-- (surfaced to the resolver as the conflict case, OQ-3) rather than a
-- silent duplicate, scoped per source_provider namespace (D1: "a Place
-- ID from one provider namespace must never be compared against another
-- provider's id space"). Deliberately no unique index for
-- WEAK_SUPPORTING -- a uniqueness constraint on it would silently grant
-- it resolution power the PO decisions never authorize.
--
-- entity_id FK is RESTRICT, not CASCADE: D10 forbids Entity deletion, so
-- no delete path should ever reach this FK in practice -- RESTRICT makes
-- an accidental delete attempt fail loudly rather than silently cascade.
-- discovery_event_id FK is nullable + RESTRICT for the same reason
-- (discovery_events is also immutable/never deleted, migration 0054).
--
-- Append-only: no UPDATE path rewrites normalized_value/category/
-- evidence_type/verified once written (D11). The one narrow, explicitly
-- D13/D18-sanctioned mutation this table permits is conflict_state,
-- 'NONE' -> 'CONFLICTED' (OQ-3), never the reverse.
--
-- Additive only; discovery_event_id's FK target (discovery_events) is
-- created later (migration 0054) -- added here as a plain column, FK
-- constraint deferred to that migration to keep ordering correct.
-- =======================================================================

CREATE TABLE "identity_evidence" (
    "id"                  TEXT NOT NULL,
    "entity_id"           TEXT NOT NULL,
    "category"            TEXT NOT NULL,
    "evidence_type"       TEXT NOT NULL,
    "normalized_value"    TEXT NOT NULL,
    "source_provider"     TEXT NOT NULL,
    "verified"            BOOLEAN NOT NULL DEFAULT false,
    "observed_at"         TIMESTAMP(3) NOT NULL,
    "discovery_event_id"  TEXT,
    "conflict_state"      TEXT NOT NULL DEFAULT 'NONE',

    CONSTRAINT "identity_evidence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "identity_evidence_entity_id_fkey"
        FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "identity_evidence_category_check"
        CHECK ("category" IN ('PROVIDER_STABLE_ID', 'OFFICIAL_DIGITAL_IDENTITY', 'VERIFIED_CONTACT', 'WEAK_SUPPORTING')),
    CONSTRAINT "identity_evidence_conflict_state_check"
        CHECK ("conflict_state" IN ('NONE', 'CONFLICTED'))
);

CREATE INDEX "identity_evidence_entity_id_idx" ON "identity_evidence"("entity_id");

-- OQ-1: Place ID alone may resolve an Entity match.
CREATE UNIQUE INDEX "identity_evidence_provider_stable_id_key"
    ON "identity_evidence"("source_provider", "normalized_value")
    WHERE "category" = 'PROVIDER_STABLE_ID';

-- OQ-2: domain/profile-URL/phone/business-email anchors, scoped per
-- provider namespace, require two independent anchors from different
-- categories to resolve (enforced by resolver logic, not by this index --
-- this index only prevents two different Entities from claiming the
-- same single anchor value).
CREATE UNIQUE INDEX "identity_evidence_official_or_verified_key"
    ON "identity_evidence"("source_provider", "normalized_value")
    WHERE "category" IN ('OFFICIAL_DIGITAL_IDENTITY', 'VERIFIED_CONTACT');
