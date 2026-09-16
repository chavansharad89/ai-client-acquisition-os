-- 0017_opportunities
-- =======================================================================
-- Opportunity: the sixth user-owned Client Finder domain object (PRD
-- V2.1 R-11/R-12/R-13, Stages DETECT NEED / RECOMMEND OFFER / CREATE
-- OPPORTUNITY). Gives @acos/core-acquisition's existing, already-tested
-- offer engine (offer.ts's suggestOffers()) somewhere to write --
-- REPOSITORY STATUS TABLE: "Need detection ... PARTIAL ... NOT
-- INTEGRATED" / "Opportunity creation ... NOT IMPLEMENTED".
--
-- Ownership: unlike research_signals (DEC-008, ownership inherited
-- through prospect_id), Opportunity carries its own user_id directly --
-- it is a top-level MVP model, matching companies/prospects/searches/
-- service_profiles, not one of the two named inherited-ownership
-- exceptions (research_signals, and opportunity_scores which remains
-- out of scope for this phase -- OpportunityScore persistence is not to
-- be invented before Opportunity exists).
--
-- One Opportunity per Prospect (prospect_id UNIQUE): CREATE OPPORTUNITY
-- is a single step in the MVP journey following RESEARCH, not an
-- append-only evidence log like research_signals -- state changes in
-- place on the same row.
--
-- Need/offer model (R-11/R-12, AC-13/AC-14): suggestOffers() returns
-- EMPTY when nothing matches -- "I have no idea what to sell these
-- people" -- represented here as every offer_* column NULL and
-- need_detected = false ("NO SUITABLE OFFER", never a default to the
-- user's own service). When it returns a suggestion, need_detected =
-- true and every offer_* column is populated together from that
-- suggestion's OfferSuggestion shape (service, rationale,
-- estimatedValuePaise, fit, basedOn) -- evidence-backed, per
-- MVP_SCOPE_BOUNDARY.md §5.4. All-or-nothing, enforced by CHECK, the
-- same idiom migration 0016 uses for research_signals' UNKNOWN/signal
-- pairing.
--
-- State: canonical vocabulary is @acos/core-acquisition's stages.ts
-- OPPORTUNITY_STAGES (nine values) -- this migration does not introduce
-- a second enum, only narrows the CHECK to the two values PRD V2.1
-- reaches in MVP ("the MVP exercises NEW and RESEARCHED"; stages beyond
-- RESEARCHED are Phase 2+), the same convention core-discovery's
-- ProspectStatus already uses (fixed to 'DISCOVERED' alone today, out of
-- a larger future vocabulary). This phase only ever writes 'NEW' at
-- creation; no transition function is implemented here.
--
-- Additive only, numbered after 0016 per DEC-006. Nothing existing is
-- altered, dropped, or backfilled. Independent of the quarantined
-- 0005/0006 (see migrations-blocked/README.md) -- no opportunity_scores
-- table, no CRM relation, no OutreachChannel, no lifecycle beyond
-- NEW/RESEARCHED (out of scope for this phase).
-- =======================================================================


-- ---- opportunities --------------------------------------------------------
--
-- Owned by `users` (R-01: the opaque id, never the email). Ownership is
-- enforced server-side on every read and write, via user_id -- never a
-- caller-supplied id (see @acos/core-opportunity).

CREATE TABLE "opportunities" (
    "id"                         TEXT NOT NULL,
    "user_id"                    TEXT NOT NULL,
    "prospect_id"                TEXT NOT NULL,

    "state"                      TEXT NOT NULL DEFAULT 'NEW',

    -- Need/offer, from suggestOffers()'s top-ranked OfferSuggestion.
    -- NULL together = NO SUITABLE OFFER (need_detected = false).
    "need_detected"              BOOLEAN NOT NULL,
    "recommended_service"        TEXT,
    "offer_rationale"            TEXT,
    "offer_estimated_value_paise" INTEGER,
    "offer_fit"                  INTEGER,
    -- Evidence backing the offer -- the specific signal claims it was
    -- based on (OfferSuggestion.basedOn). Empty when there is no offer.
    "offer_based_on"             TEXT[] NOT NULL DEFAULT '{}',

    "created_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "opportunities_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "opportunities_prospect_id_fkey"
        FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "opportunities_state_check"
        CHECK ("state" IN ('NEW', 'RESEARCHED')),
    CONSTRAINT "opportunities_offer_fit_range"
        CHECK ("offer_fit" IS NULL OR ("offer_fit" >= 0 AND "offer_fit" <= 100)),
    CONSTRAINT "opportunities_offer_estimated_value_non_negative"
        CHECK ("offer_estimated_value_paise" IS NULL OR "offer_estimated_value_paise" >= 0),
    CONSTRAINT "opportunities_need_offer_consistency"
        CHECK (
            ("need_detected" = false
                AND "recommended_service" IS NULL
                AND "offer_rationale" IS NULL
                AND "offer_estimated_value_paise" IS NULL
                AND "offer_fit" IS NULL) OR
            ("need_detected" = true
                AND "recommended_service" IS NOT NULL
                AND "offer_rationale" IS NOT NULL
                AND "offer_estimated_value_paise" IS NOT NULL
                AND "offer_fit" IS NOT NULL)
        )
);

-- Every ownership-scoped query (getById, list) filters on user_id; this
-- index is what keeps that filter cheap as the table grows.
CREATE INDEX "opportunities_user_id_idx" ON "opportunities"("user_id");

-- One Opportunity per Prospect -- also the index a re-evaluation would
-- look up by.
CREATE UNIQUE INDEX "opportunities_prospect_id_key" ON "opportunities"("prospect_id");
