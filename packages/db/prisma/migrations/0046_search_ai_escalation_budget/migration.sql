-- 0046_search_ai_escalation_budget
-- =======================================================================
-- Phase 5 (CLIENT_FINDER_PHASE5_IMPLEMENTATION_READINESS_REPORT.md,
-- CLIENT_FINDER_PHASE5_AI_BUDGET_DURABILITY_MECHANISM_PO_DECISION_QUESTIONNAIRE.md
-- -- PO decision: Option A), resolving the readiness report's own STOP
-- CONDITION ("PARTIALLY READY -- BLOCKED ON BUDGET DURABILITY
-- AUTHORIZATION", report sections 18-20).
--
-- A single durable per-Search counter gating AI escalation (Research +
-- conditional Target Customer Match together, per admitted candidate)
-- behind a fixed budget B=10, shared across every MAX_SEARCH_ATTEMPTS=3
-- worker retry of the same Search row (CF-PHASE5-AI-BUDGET-LIFECYCLE-
-- PO-DEC-001) -- a retry must never reset or add to the remaining
-- budget. An in-memory-only counter cannot satisfy this: retries are
-- specifically designed to survive a worker crash, so the process
-- holding an in-memory value is exactly what may not exist on the next
-- attempt (readiness report Sec.18).
--
-- Option A, explicitly: ONE counter column, no per-candidate ledger
-- table. The PO decision rejected a ledger (Option B of the durability
-- questionnaire) as unneeded complexity for this budget -- candidate-
-- level AI-consumption auditability is NOT a Phase 5 product
-- requirement. This migration's job is only to make the counter atomic
-- and bounded, not to record which candidate consumed which unit.
--
-- No existing searches column is reused (attempts/last_error/
-- lease_owner/lease_expires_at/idempotency_key/completed_at each
-- already has a decided, different meaning -- see 0014_searches,
-- 0033_searches_completed_at). No version column either: the atomic
-- consume operation fences on the existing lease_owner/status idiom
-- (see createPgSearchRepository's completeClaimed/recordAttemptFailure),
-- the same compare-on-current-state convention every other mutation on
-- this table already uses -- not optimistic-concurrency versioning.
--
-- CHECK bounds: >= 0 (no decrement operation exists -- a unit, once
-- consumed at admission, is never refunded, including on candidate-
-- level AI failure) and <= 10 (the current Phase 5 budget B). The upper
-- bound is intentionally the literal current value, not a parameter --
-- a future change to B is a new migration's decision, not a runtime
-- config value this constraint reads.
-- =======================================================================

ALTER TABLE "searches"
  ADD COLUMN "ai_escalation_units_consumed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "searches"
  ADD CONSTRAINT "searches_ai_escalation_units_consumed_bounds"
  CHECK ("ai_escalation_units_consumed" >= 0 AND "ai_escalation_units_consumed" <= 10);
