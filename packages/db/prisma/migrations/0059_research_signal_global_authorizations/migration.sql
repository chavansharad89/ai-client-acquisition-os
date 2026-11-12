-- 0059_research_signal_global_authorizations
-- =======================================================================
-- Global Entity Architecture, Q5-B sharing gate
-- (CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001 Q5-B;
-- CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
-- SPECIFICATION.md §E.2). The Q5-B differentiator: an explicit,
-- out-of-band authorization allowlist, structurally separate from
-- research_signals and NEVER written by saveSignals() or any other
-- existing research-persistence code path.
--
-- A research_signals row with no entry here has never been authorized
-- -- this is the mechanism (not a convention) that guarantees "OBSERVED
-- + verified quote + Q5-A overlap-check-pass" can never, by itself,
-- imply cross-freelancer sharing is permitted (Q5-B). Starts empty, and
-- MUST remain empty for any pre-existing research_signals row unless a
-- future, separate, explicit PO decision authorizes a one-time
-- historical re-evaluation (Q5-C) -- this migration itself performs no
-- backfill.
--
-- Append-only revocation: revoked_at is a nullable timestamp, not a
-- deleted row -- a later write does not delete an earlier authorization
-- record (D11's append-only evidence principle). A read-time check must
-- treat a revoked authorization (revoked_at IS NOT NULL) as currently
-- ineligible without deleting the historical record.
--
-- No column is added to research_signals itself -- this keeps the
-- gate's storage wholly additive, auditable independently of the
-- research pipeline, and trivially reversible.
-- =======================================================================

CREATE TABLE "research_signal_global_authorizations" (
    "id"             TEXT NOT NULL,
    "signal_id"      TEXT NOT NULL,
    "authorized_at"  TIMESTAMP(3) NOT NULL,
    "authorized_by"  TEXT NOT NULL,
    "revoked_at"     TIMESTAMP(3),

    CONSTRAINT "research_signal_global_authorizations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "research_signal_global_authorizations_signal_id_fkey"
        FOREIGN KEY ("signal_id") REFERENCES "research_signals"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "research_signal_global_authorizations_signal_id_idx"
    ON "research_signal_global_authorizations"("signal_id");
