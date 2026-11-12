# Phase 5 — AI Escalation Budget Scope Across Search Retries: PO Decision

**Decision ID:** CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001
**Supersedes/resolves:** [CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION_PREPARATION.md](CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION_PREPARATION.md) (Option A vs Option B)
**Date:** 2026-10-15
**Authority:** Product Owner decision, as communicated.
**Status:** DECIDED (scope/semantics). Durability mechanism: **investigated below, STOP condition triggered — see §4.** No code, migration, commit, or push has occurred.

---

## 1. Decision

**APPROVED: Option B — Per-Search-lifecycle budget.**

`B = 10` AI escalation units applies across the **entire lifecycle of a Search**, not per attempt. All `MAX_SEARCH_ATTEMPTS = 3` retry attempts for the same Search share one remaining budget.

- Attempt 1 + Attempt 2 + Attempt 3 share one pool of 10 units.
- A Search may consume at most 10 AI escalation units in total, ever.
- A fresh Search-level retry **MUST NOT** reset the budget to 10.
- This supersedes the per-attempt reading (Option A) considered in the preparation document. The `MAX_SEARCH_ATTEMPTS × B = 30` worst case described there is explicitly rejected as the governing behavior.

## 2. Unit semantics (locked)

One admitted candidate consumes exactly one AI escalation unit, covering:
- Research, plus
- conditional TCM, only when the approved `targetCustomer` criterion applies.

Internal provider/model retries for that same candidate (e.g. a provider timeout retried internally before falling back) do **not** create additional escalation units — the unit is consumed once, at admission, regardless of how many underlying provider calls that admission results in.

## 3. Locked rules

1. A cache hit that avoids AI does not consume an AI escalation unit.
2. A candidate-level AI failure still consumes the unit that was admitted to that candidate (the unit is spent at admission, not at success).
3. Retrying the same Search does not restore consumed units.
4. The strong-signal bypass draws from the same shared 10-unit budget — never an additional allowance.
5. Top-N remains 10.
6. No candidate may bypass the 10-unit lifetime ceiling.
7. No new signal may be invented merely to make the bypass fire.
8. The bypass still requires ≥ 2 independent qualifying `OBSERVED` top-reliability signals, with ≥ 1 Primary-dimension signal.
9. Only one qualifying deterministic signal currently exists (absent SSL/TLS); the bypass may remain non-functional until another independently authorized qualifying signal exists. This decision does not authorize creating one.
10. AI never determines eligibility or ranking.

None of PO-1 through PO-5, Top-N = 10, the threshold formula, or the bypass formula are altered by this decision — only the budget's cross-retry scope is being resolved here.

## 4. Durability boundary — investigation and STOP condition

Per PO instruction, an in-memory counter does not automatically satisfy a lifecycle-wide budget across worker/process crashes, because `MAX_SEARCH_ATTEMPTS` retries are specifically designed to survive exactly that case ([retry.ts:10-11](packages/core-search/src/retry.ts:10): "a worker crash (lease expiry) does not count against this budget" — i.e. crash-then-resume is treated as an expected, routine retry trigger, not an edge case). An in-memory counter dies with the process that held it; the next attempt, in a new process, would start counting from zero, silently reintroducing Option A's worst case for any Search that crashes rather than failing-and-returning cleanly within one process.

**Finding: durable, cross-process persistence of consumed-unit state is genuinely required to make this decision's §1 guarantee hold after a worker crash/restart.** This is confirmed by inspecting the actual persisted shape of a Search, not inferred:

- `searches` table columns, confirmed from every migration that has touched it ([0014_searches/migration.sql](packages/db/prisma/migrations/0014_searches/migration.sql), [0033_searches_completed_at/migration.sql](packages/db/prisma/migrations/0033_searches_completed_at/migration.sql)) and the application-level `StoredSearch` type ([types.ts](packages/core-search/src/types.ts:26)): `id, user_id, service_profile_id, status, service, target_customer, geography, min_project_value_paise, triggers, keywords, rationale, attempts, last_error, lease_owner, lease_expires_at, idempotency_key, created_at, updated_at, completed_at`.
- **No existing column can represent "AI escalation units consumed so far" without changing its own meaning:**
  - `attempts` counts Search-claim attempts (worker job retries) — unrelated to AI spend; a Search can exhaust its AI budget on attempt 1 and still have `attempts = 1`, or spend zero AI units across all 3 attempts (every candidate deterministic-only) while `attempts = 3`. These are independent quantities that happen to share a numeric type; overloading one to mean the other would make existing `attempts`-based retry logic (`retry.ts`, `worker.ts:282`) silently wrong.
  - `last_error`, `lease_owner`, `lease_expires_at`, `idempotency_key` are job-ownership/error bookkeeping, not spend counters.
  - `completed_at` is a one-time timestamp, not a counter.
  - No column of any kind currently tracks per-Search AI/cost consumption. The Phase 4 cache index (migration 0045) tracks per-(freelancer, entity) Research freshness, not a Search-scoped running total.
- Conclusion: **no existing durable field can legitimately represent this state. A genuine persistence requirement is demonstrated.**

### STOP — per PO instruction, no migration is created here.

**Exactly what would need to be persisted:** a single non-negative integer, scoped to one Search row, representing AI escalation units consumed so far across all attempts of that Search's lifecycle (0–10 inclusive once Phase 5 is live). It must be:
- readable and atomically incrementable by whichever worker process/attempt is currently executing `runCanonicalPipeline` for that Search (a different process than the one that ran a prior attempt, in the crash/restart case);
- incremented at the moment a candidate is **admitted** to escalation (not at AI success/failure), consistent with locked rule #2 above, so a crash between admission and the AI call recording its result does not grant extra budget on the next attempt.

**Why existing state is insufficient:** shown above — `attempts` and every other `searches` column already carry a distinct, decided meaning; repurposing any of them would make currently-correct retry/ownership logic read spend data or vice versa.

**Proposed schema shape — engineering proposal only, NOT authorized, NOT created:**
```
-- PROPOSAL ONLY — not applied
ALTER TABLE "searches"
  ADD COLUMN "ai_escalation_units_consumed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "searches"
  ADD CONSTRAINT "searches_ai_escalation_units_consumed_non_negative"
    CHECK ("ai_escalation_units_consumed" >= 0);
```
Consumption would be an atomic, conditional increment at admission time (e.g. `UPDATE searches SET ai_escalation_units_consumed = ai_escalation_units_consumed + 1 WHERE id = $1 AND ai_escalation_units_consumed < 10 RETURNING ai_escalation_units_consumed`), read once per admission decision to compute remaining budget. A simple counter does not by itself prevent double-charging the *same* candidate across attempts if that candidate was admitted (charged) on a prior attempt but its result never persisted before a crash — whether that risk is acceptable, or whether a per-candidate consumption ledger is needed instead of a single counter, is an open engineering question this proposal does not resolve.

**Why this requires separate authorization:** this decision record resolves the *meaning* of B=10 across retries (§1–§3). It does not, by itself, authorize a schema change — the PO's own standing instruction for this clarification was explicit ("no migration unless a genuine persistence requirement is demonstrated... do not create a migration... report... why this requires separate authorization"). A migration is a shared, hard-to-reverse change to production schema; the column name, constraint shape, increment strategy, and double-charge-prevention approach above are proposals for the PO/engineering to authorize deliberately, not a decision implicit in approving Option B.

## 5. Status

Budget **scope and semantics**: DECIDED (§1–§3), ready to inform implementation.
Budget **durability across crash/restart**: investigated, schema genuinely required, **not authorized here** — blocked pending separate authorization of the proposal in §4 (or an alternative the PO/engineering agree on).

See the updated [CLIENT_FINDER_PHASE5_IMPLEMENTATION_READINESS_REPORT.md](CLIENT_FINDER_PHASE5_IMPLEMENTATION_READINESS_REPORT.md) for how this interacts with the rest of Phase 5's readiness.

No code.
No migration.
No commit.
No push.
