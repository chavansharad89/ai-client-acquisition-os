-- 0030_research_signal_authorization_evidence
-- =======================================================================
-- AI-platform FIRST_PARTY authorization evidence (DEC-004 option 1-B),
-- implemented under INTENT-INTAKE-PO-DEC-005 (Option C) exactly as designed
-- in INTENT-INTAKE-PO-DEC-005-SCHEMA and INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ.
--
-- Additive only. Six nullable columns on research_signals, no defaults, so
-- no existing row is rewritten. research_signal_sources is unchanged.
--
-- NO BACKFILL. The repository persists no authoritative authorization
-- evidence for historical rows (PREREQ §5), so the qualifying population is
-- empty and this migration contains no UPDATE / INSERT / DELETE (DEC-005
-- C1). Every existing row keeps NULL in all six columns.
--
-- Deliberately absent: defaults, CHECK / enum / status vocabulary, foreign
-- keys (business_id references no table), partial predicates.
--
-- Order matters: columns, then index, then the immutability trigger LAST.
-- Prisma wraps this file in one transaction, so there is no window where
-- the columns exist unguarded and no bypass is needed.
-- =======================================================================

ALTER TABLE "research_signals"
    ADD COLUMN "business_id"     TEXT,
    ADD COLUMN "auth_status"     TEXT,
    ADD COLUMN "auth_scope"      TEXT,
    ADD COLUMN "auth_timestamp"  TIMESTAMP(3),
    ADD COLUMN "integration_id"  TEXT,
    ADD COLUMN "revoked_at"      TIMESTAMP(3);

-- Access pattern (7-C): lookups filtering by business_id and auth_status
-- for monitoring and compliance verification. Standard composite index; no
-- partial predicate.
CREATE INDEX "research_signals_business_id_auth_status_idx"
    ON "research_signals"("business_id", "auth_status");


-- ---- Authorization evidence is immutable (DEC-004 1.3, 4-A) ------------
--
-- Once a row exists, its authorization-evidence payload cannot change —
-- including NULL -> value, so evidence can only be set at INSERT. Scope is
-- exactly the five evidence fields: revoked_at and superseded_at are
-- lifecycle state and stay updateable, and the rest of the row is not
-- frozen here (4-A is not whole-row immutability).

CREATE OR REPLACE FUNCTION enforce_research_signal_authorization_evidence_frozen()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.business_id IS DISTINCT FROM OLD.business_id
     OR NEW.auth_status IS DISTINCT FROM OLD.auth_status
     OR NEW.auth_scope IS DISTINCT FROM OLD.auth_scope
     OR NEW.auth_timestamp IS DISTINCT FROM OLD.auth_timestamp
     OR NEW.integration_id IS DISTINCT FROM OLD.integration_id THEN
    RAISE EXCEPTION
      'research_signal_authorization_evidence_frozen: research signal % authorization evidence '
      '(business_id, auth_status, auth_scope, auth_timestamp, integration_id) is immutable.',
      OLD.id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS research_signals_authorization_evidence_frozen ON research_signals;
CREATE TRIGGER research_signals_authorization_evidence_frozen
  BEFORE UPDATE OF business_id, auth_status, auth_scope, auth_timestamp, integration_id ON research_signals
  FOR EACH ROW EXECUTE FUNCTION enforce_research_signal_authorization_evidence_frozen();
