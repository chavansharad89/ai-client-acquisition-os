# Phase 5 — AI Escalation Budget Durability Mechanism: PO Decision Questionnaire

**Decision ID (prep):** CF-PHASE5-AI-BUDGET-DURABILITY-PO-DEC-PREP-001
**Builds on (DECIDED, not reopened):** [CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION.md](CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION.md) (CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001)
**Date:** 2026-10-15
**Status:** QUESTIONNAIRE — awaiting PO decision. No code, migration, commit, or push.
**Scope:** durability *mechanism* only — how the already-decided budget is made to survive worker/process crashes. Nothing in §1 is being reopened by this document.

---

## 1. Locked context — already decided, NOT reopened here

The following is restated for reference only. This questionnaire does not ask the PO to revisit any of it:

- `B = 10` AI escalation units per Search **lifecycle** (not per attempt). All `MAX_SEARCH_ATTEMPTS = 3` retries share one pool.
- A Search-level retry does not reset or add to the remaining budget.
- One admitted candidate consumes exactly 1 unit, covering Research + conditional TCM together.
- Internal provider/model retries for the same candidate do not consume additional units.
- A cache hit that avoids AI consumes 0 units.
- A candidate-level AI failure still consumes the unit that was admitted to that candidate.
- The strong-signal bypass draws from the same shared budget — never an additional allowance.
- No candidate may bypass the 10-unit ceiling.
- Top-N = 10.
- AI never determines eligibility or ranking.
- An in-memory-only implementation is not acceptable — it cannot guarantee the lifecycle-wide ceiling across worker/process crashes.
- No migration is authorized yet.

## 2. Evidence from the current codebase (grounds for everything below)

To avoid inventing implementation detail, the following was confirmed directly against the repository rather than assumed:

- **No reusable field exists.** The `searches` table's full column history (migrations [0014_searches](packages/db/prisma/migrations/0014_searches/migration.sql), [0033_searches_completed_at](packages/db/prisma/migrations/0033_searches_completed_at/migration.sql)) and the `StoredSearch` type contain no column that represents AI-unit consumption. `attempts` specifically counts worker-claim retries and is a materially different, independently-decided quantity (previously established — not reopened here).
- **No per-candidate AI-consumption ledger of any kind exists today.** The Phase 4 cache index (migration 0045) tracks per-(freelancer, entity) Research freshness for reuse — a different concept from "how many lifecycle units has this Search spent." There is no existing table this questionnaire's "ledger" option could extend; a ledger would be new.
- **Search claiming is already lease-fenced.** `claimNextPending` claims a Search via `UPDATE ... FOR UPDATE SKIP LOCKED`, setting `lease_owner`/`lease_expires_at` ([pgRepository.ts:146-175](packages/core-search/src/pgRepository.ts:146)). `completeClaimed` and `recordAttemptFailure` both fence their writes on `WHERE id = $1 AND status = 'RUNNING' AND lease_owner = $2` ([pgRepository.ts:192-212](packages/core-search/src/pgRepository.ts:192), [214-239](packages/core-search/src/pgRepository.ts:214)) — a worker whose lease has since expired and been reclaimed (`releaseExpiredLeases`) cannot complete or record failure against that Search anymore, because its `lease_owner` no longer matches. **This fencing pattern exists today only at completion/failure-recording time** — whether a future budget-increment write adopts the same `lease_owner`-fenced pattern is an open implementation question, not something already decided.
- **Candidate processing within one attempt is strictly sequential.** `runCanonicalPipeline`'s prospect loop is a `for...of` with `await` on each candidate ([worker.ts:410-422](apps/worker/src/searchWorker/worker.ts:410)) — no parallel admission within a single attempt. The only realistic concurrency scenario the repository evidence supports is **cross-process**: a worker whose lease expired mid-attempt (e.g., a slow or stalled process) continuing to run while a second worker has already reclaimed and is also running the same Search. Nothing in the evidence suggests concurrent admission within one process.

## 3. Durability alternatives — presented neutrally

### Option A — Single durable Search-level counter

One column on `searches` (e.g. `ai_escalation_units_consumed INTEGER`), holding only the current total consumed. Incremented atomically at admission time.

### Option B — Per-candidate durable ledger

A new table recording one row per admitted candidate (Search id, candidate/prospect id, admitted-at, outcome), from which "units consumed" is derived (e.g. `COUNT(*)` or `SUM`) rather than stored directly as a single number.

### Option C — Materially different alternative

No third alternative is evidenced by the current codebase. Nothing in the repository (existing tables, existing patterns in `core-search`/`core-research`/`core-payments`) suggests a mechanism other than A or B — e.g., there is no existing event-log/outbox table in this codebase that a budget mechanism could piggyback on, and no external (non-Postgres) durable store is used anywhere in Client Finder's worker path. **This questionnaire does not propose an Option C.** If the PO or engineering is aware of a reason to consider one, that would need to be raised separately with its own evidence.

## 4. Consequences — addressed per question, per option

| Question | Option A — single counter | Option B — per-candidate ledger |
|---|---|---|
| **Atomic admission/increment** | A single conditional `UPDATE ... SET consumed = consumed + 1 WHERE consumed < 10` is natively atomic in Postgres (one row, one statement) — no additional locking construct needed beyond the existing row-level update. | Requires an `INSERT` into the ledger table *and* a budget check (`SELECT COUNT(*) ... < 10`) to be atomic together — either a single statement with a guard (e.g. a partial unique index or a `CHECK`-like application-level transaction) or an explicit transaction wrapping both. More moving parts to get equally atomic. |
| **Duplicate admission/idempotency** (same candidate admitted twice, e.g. across a retry) | The counter alone cannot distinguish "candidate X was already charged once" from "candidate X is being charged for the first time" — it has no memory of *which* candidates were charged, only *how many*. Preventing a double-charge for the same candidate across attempts would need a separate mechanism (e.g. consulting whether that candidate already has a persisted Research/TCM result — the existing Phase 4 cache check already does something adjacent, but that answers "do we need AI at all," not "was a unit already charged for this candidate specifically"). | A ledger keyed on (Search id, candidate id) can enforce idempotency directly — a unique constraint on that pair means a second admission attempt for the same candidate either no-ops or is rejected, and "was this candidate already charged" becomes a direct, indexed lookup rather than an inference. |
| **Crash after admission, before AI work starts** | Counter already incremented (by design — admission is what consumes the unit). Budget correctly shows the unit spent. Candidate's eventual state (did AI run or not) is not recorded by the counter itself. | Ledger row exists from admission; its own fields (if designed to carry one) could record "admitted, outcome pending" separately from the aggregate count, giving a durable record of exactly which candidate is in this state — the counter alone cannot say *which* candidate without separately correlating against Research/TCM tables. |
| **Crash after AI work completes, before the result persists** | Counter was already incremented at admission (not at completion), so the budget figure is unaffected by this crash — correctly reflects a spent unit either way, matching the locked "failure still consumes the unit" rule. | Same outcome for the aggregate count. A ledger additionally retains a durable record that this specific candidate was the one in-flight at crash time, which the counter-only option does not retain anywhere. |
| **Search-level retry** | Counter persists in the `searches` row itself, read fresh by whichever process claims the next attempt — reflects the true lifetime total with no reset, by construction. | Same correctness property, derived by counting ledger rows for that Search id instead of reading a stored number directly. |
| **Does a consumed unit remain consumed after candidate-level AI failure?** | Yes, under both options — already locked by the PO decision, and mechanically guaranteed under Option A because the increment happens at admission, not at success. | Yes, same guarantee, and additionally the ledger would show *which* candidate's unit was spent on a failure, if the ledger's own schema is designed to record outcome. |
| **Does the system need an auditable candidate→unit relationship?** | Not provided by this option. The counter answers "how many," never "which candidates." If a later need arises (support/debugging "why did this Search run out of budget," or confirming no double-charge occurred), it would have to be reconstructed indirectly from Research/TCM records' timestamps, which is not guaranteed to be unambiguous. | Provided directly — this is the ledger's main structural advantage over a bare counter. |
| **How is `consumed <= 10` enforced?** | A `CHECK` constraint on the column (`consumed >= 0`, and either an upper-bound `CHECK (consumed <= 10)` or leaving the ceiling to application logic since `10` is a product-configurable constant, not necessarily fit for a hardcoded schema constraint) plus the conditional `WHERE consumed < 10` on the increment statement. | Enforced by comparing `COUNT(*) < 10` before inserting the next row, inside the same atomicity boundary as the insert; a hard upper bound as a schema-level constraint is less direct (would need e.g. a trigger, since a plain `CHECK` can't count sibling rows). |
| **Could concurrent workers overspend the Search?** | Evidence-grounded answer, not assumed: within a single attempt, no — the prospect loop is sequential (§2). Across attempts, the existing `lease_owner`-based fencing ([pgRepository.ts:192-239](packages/core-search/src/pgRepository.ts:192)) prevents a *stale* worker from completing or recording failure once its lease has been reclaimed — **but that fencing pattern has not yet been extended to a budget-increment statement**, because that statement doesn't exist yet. Whether the increment query is written to also fence on current `lease_owner` is an implementation decision, not something either option inherently solves by its data shape alone. | Same answer — a ledger's uniqueness constraint (per candidate) prevents double-charging *the same candidate*, but does not, by itself, prevent two different candidates each being charged by two different processes that both believe they still hold the lease, unless the ledger inserts are also lease-fenced. |
| **Schema/index/constraint changes required** | One new column, one non-negative `CHECK`, no new table, no new index strictly required (reads/writes are by Search `id`, already the primary key). | One new table, a foreign key to `searches`, a unique index on (Search id, candidate id) for idempotency, and likely an index on Search id alone to make the "count consumed so far" query cheap. Meaningfully more schema surface than Option A. |

## 5. Separating recommendation from decision

**ENGINEERING OBSERVATION — NOT A PO DECISION:** every locked semantic rule in §1 is satisfiable by Option A alone. None of the PO's already-decided rules (lifecycle cap, no reset on retry, failure still consumes the unit, bypass shares the budget, no candidate bypasses the ceiling) require knowing *which* candidate consumed *which* unit — they only require knowing the running total. Option B's advantages (idempotency-by-constraint, auditability, crash-state visibility per candidate) are real, but they are additional capabilities, not requirements implied by anything the PO has decided so far. Per the explicit instruction not to assume a ledger is required merely because it provides better auditability: **it is not required by the locked semantics; it would be an additional, separately-justified capability.**

This observation does not resolve the PO decision below — both options satisfy the locked semantics; the choice is about which additional properties (idempotency guarantees, audit trail, schema footprint, implementation cost) the PO wants, not about which one is "correct."

## 6. Which questions are true PO decisions vs. engineering implementation detail

**True PO decisions (this questionnaire's purpose):**
- Which durability option (A or B) to authorize.
- Whether candidate-level auditability (which candidate consumed which unit) is a requirement the PO wants, independent of whether the locked semantics strictly demand it.
- Whether a hard schema-level ceiling (`consumed <= 10` enforced by the database itself) is required, or whether application-level enforcement (checked before each increment) is sufficient.

**Engineering implementation detail (not asked of the PO here):**
- The exact column/table name.
- Whether the increment statement is additionally fenced on `lease_owner` to close the stale-worker race identified in §4's "concurrent workers" row.
- The exact index shape for Option B if chosen.
- Whether Option A's upper-bound constraint is expressed as a `CHECK` or left to application logic.

## 7. Does Option A satisfy the PO's already-decided semantics?

Yes. Nothing in the locked rules (§1) requires a candidate→unit audit trail; a single durable, atomically-incremented counter on the `searches` row, read and checked before each admission, correctly enforces: lifecycle-wide 10-unit cap, no reset across retries, unit spent at admission regardless of candidate-level AI outcome, and the bypass sharing the same pool. A ledger (Option B) is not required by any already-decided requirement — it would be chosen, if at all, for the additional properties named in §5/§6, as a PO preference rather than a semantic necessity.

---

## PO DECISION REQUIRED

1. **Durability mechanism:** Option A (single durable counter) or Option B (per-candidate durable ledger)?
2. **Candidate-level auditability:** required as its own goal, independent of the locked budget semantics — yes or no?
3. **Schema-enforced ceiling:** should `consumed <= 10` be enforced by the database itself (e.g. a constraint/trigger), or is an application-level check before each increment sufficient?

## STOP CONDITION CHECK

- Budget scope/semantics: DECIDED (CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001) — not reopened.
- Durability *mechanism*: **UNDECIDED** — this questionnaire's three questions above are unresolved.
- No migration authorized — none proposed as final here; §4's schema/index notes are comparative analysis, not a submitted migration.
- No code changed to produce this document.
- Phase 5's admission/budget mechanism implementation **remains blocked** until the three questions above are answered.

No code.
No migration.
No commit.
No push.
