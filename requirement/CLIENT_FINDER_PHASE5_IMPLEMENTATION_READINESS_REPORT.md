# CLIENT FINDER — PHASE 5 IMPLEMENTATION READINESS REPORT

**Decision ID:** CF-PHASE5-IMPLEMENTATION-READINESS-REPORT-001
**Related decisions:** [CF-PHASE5-PRE-RESEARCH-ADMISSION-INPUT-GAP-PO-DEC-001](CLIENT_FINDER_PHASE5_PRE_RESEARCH_ADMISSION_INPUT_GAP_PO_DECISION_ROUND.md) (PO-1, PO-3, PO-4, PO-5), [CF-PHASE5-TOP-RELIABILITY-SIGNAL-CATEGORY-PO-DEC-PREP-001](CLIENT_FINDER_PHASE5_TOP_RELIABILITY_SIGNAL_CATEGORY_PO_DECISION_PREPARATION.md) (PO-2 questionnaire), PO-2 decision (Option 1 — fixed maximum-confidence signals by `OBSERVED_FACT_CONFIDENCE`), communicated directly to engineering, not yet filed as its own standalone decision record — see §16 below, [CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001](CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md), [CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md](CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md) §0/§16
**Date:** 2026-10-15
**Authority:** Engineering readiness review, per PO instruction, prior to Phase 5 implementation.
**Status:** READ-ONLY REVIEW. No code, schema, test, or configuration has been changed to produce this report.

**AMENDMENT — 2026-10-15:** §13 below is superseded by the PO's explicit decision on AI-budget scope across retries: [CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION.md](CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION.md) (CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001, Option B — per-Search-lifecycle budget). New §17–§19 below cover the resulting PO-BUDGET semantics, the durability investigation, and the revised file/status implications. §13's original text is left intact for record-keeping but its "no new PO decision required" conclusion no longer holds — see §17.

---

## 1. PO-1 decision and exact runtime implications

**PO-1 (APPROVED, Option A):** every discovered prospect may have its public homepage fetched, non-LLM, before AI admission, via the existing `SourceDocumentProvider` (`packages/core-research/src/sourceDocumentProvider.ts`).

**Current runtime state (confirmed by code inspection):** `apps/worker/src/searchWorker/worker.ts:420` still calls `eliminateDeterministically({ id: prospect.id }, [])` — a literal empty array, with the in-code comment "No signal is available at this point in the pipeline yet." PO-1's pre-admission fetch is **not implemented**. Implementing it means inserting a `SourceDocumentProvider.fetchSourceDocuments()` call between Discovery and this line, feeding its result through `createWebDevelopmentSignalCatalogue().evaluate()` to produce `DeterministicSignal[]` in place of `[]`. Fetch failure must resolve to `[]` (already `createHttpSourceDocumentProvider()`'s existing behavior), never a thrown error — a failed pre-fetch degrades to "no pre-Research evidence," not a failed Search.

## 2. PO-2 decision and exact strong-signal bypass semantics

**PO-2 (APPROVED, Option 1):** a signal is "top-reliability" when its confidence is pinned at the `OBSERVED_FACT_CONFIDENCE` constant (= 100, `packages/core-research/src/deterministicSignals.ts:76`). For the current catalogue, this means exactly one signal qualifies: absent SSL/TLS (`detectAbsentSsl()`, `deterministicSignals.ts:78-91`), dimension `NEED_OPPORTUNITY_GAP`.

**Bypass formula (from `CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md` §0 item 5 / §16.5 — the only place this formula is recorded; see §16 of this report):** a candidate bypasses the normal rank/threshold admission test iff it has **≥ 2 independent signals**, each `OBSERVED` (not `INFERRED`/`UNKNOWN`), each drawn from a service-specific top-reliability category, with **≥ 1** being a Primary-dimension signal (`needOpportunity` or `serviceFit` — confirmed Primary via `service.ts`'s dimension precedence order and `service.test.ts:774`'s "Primary dimension" / "Important-dimension" tier language). A website-absence signal alone never qualifies; a single signal of any kind never qualifies.

**Exact consequence for today's catalogue:** absent SSL/TLS is `OBSERVED`, top-reliability (PO-2), and Primary-dimension (`NEED_OPPORTUNITY_GAP`) — it satisfies the "≥ 1 Primary-dimension" half of the formula by itself. But it is the **only** deterministic signal implemented anywhere in the codebase (confirmed: no other producer exists in `core-opportunity`, `core-discovery`, `core-research`, or the worker). **The strong-signal bypass therefore cannot currently fire for any candidate** — the ≥ 2-independent-signal condition has no second signal to draw on. This is not weakened by PO-2; PO-2 only answers which category a signal must belong to, not how many are required. No second signal is proposed or invented by this report, consistent with the governance boundary stated in the PO-2 decision.

## 3. PO-3 signal → universal-dimension mapping boundary

**PO-3 (APPROVED IN PRINCIPLE):** wires absent-SSL's already-declared `NEED_OPPORTUNITY_GAP` dimension tag through to where it is currently discarded.

**Current runtime state (confirmed):** `packages/core-opportunity/src/service.ts`'s `buildRankingProfile()` (lines 272-286) still returns `...unknownRankingProfile()` and only overrides `serviceFit`, `evidenceQuality`, `evidenceFreshness` — `needOpportunity` is hardcoded `UNKNOWN` today, exactly as PO-3's own text states, because "Phase 1's `createWebDevelopmentSignalCatalogue()` is not yet reachable here" (the function's own header comment, line 263). PO-3 authorizes no new mapping table — the signal already self-declares `NEED_OPPORTUNITY_GAP` — only threading that tag from the Phase 1 catalogue output into `buildRankingProfile()`'s `needOpportunity` field when a live signal exists.

## 4. PO-4 bounded pre-fetched SourceDocument reuse

**PO-4 (AVOID IF BOUNDED):** `ResearchProviderInput`/`ResearchDeps` (`packages/core-research/src/provider.ts:11-60`) would gain one additional optional field (e.g. `suppliedSourceDocuments?: readonly SourceDocument[]`).

**Current runtime state (confirmed):** no such field exists in `provider.ts` today. `anthropicResearchProvider.ts:58` and `fallbackResearchProvider.ts:82` both call `deps.sourceDocuments.fetchSourceDocuments(...)` unconditionally — there is no check for a pre-supplied document. Implementing PO-4 means adding the optional field and gating both call sites on it, falling back to the existing fetch when absent. This is additive to an already-optional-field-bearing input shape; no existing caller's behavior changes.

## 5. PO-5 Google Places expansion remains deferred

**Confirmed, no action required.** No Google Places field-mask change, no `core-discovery` change. Not touched by this report or by Phase 5 as scoped.

## 6. Exact Phase 5 files expected to change

Per the PO-1/3/4/5 decision round's own file list, confirmed still accurate against current code:

- `apps/worker/src/searchWorker/worker.ts` — insert pre-admission fetch/signal-evaluation call before line 420's `eliminateDeterministically()` call; pass resulting signals onward to opportunity scoring; (separately, if Phase 5's admission-gate/budget mechanism is implemented in the same pass — see §10 — this file also gains the Top-N/threshold/bypass/budget admission check around the existing `researchProspectForOwner` call at line 423).
- `packages/core-research/src/deterministicSignals.ts` — expose/adapt `createWebDevelopmentSignalCatalogue()` for pre-Research use against a fetched `SourceDocument`.
- `packages/core-research/src/provider.ts` — add the optional `suppliedSourceDocuments` field to `ResearchProviderInput`/`ResearchDeps` (PO-4).
- `packages/core-research/src/anthropicResearchProvider.ts` and `packages/core-research/src/fallbackResearchProvider.ts` — check for supplied documents before calling `fetchSourceDocuments()` (PO-4).
- `apps/worker/src/index.ts` — composition root: wire the pre-admission `SourceDocumentProvider` call through to both elimination and Research deps.
- `packages/core-opportunity/src/service.ts` — `buildRankingProfile()` to consume the mapped `NEED_OPPORTUNITY_GAP` signal instead of hardcoding `UNKNOWN` (PO-3).

No other file is implicated by PO-1/PO-2/PO-3/PO-4. PO-5 touches no file.

## 7. Exact files that must NOT change

K1 (Client Intent Discovery) code/schema; `₹499` (Client Finder base) and `₹1,499` (subscription) commercial/auth/payment paths (`packages/core-payments/**`, `apps/web/app/api/payments/**`, `apps/web/app/api/webhooks/razorpay/**`, `apps/web/src/checkout/**`, `packages/core-subscriptions/**`, `packages/core-identity/**`); `core-discovery`'s Google Places field mask; `eliminateDeterministically()`'s own elimination semantics/signature (only its call-site input changes, from `[]` to real signals — the function itself, and its `ENTITY_REALITY`-only gate, is unmodified); the five-dimension framework definition; `UniversalRankingProfile`'s shape or its comparator/persistence layer.

## 8. Whether any migration is required

**No.** Confirmed by direct inspection of `packages/db/prisma/migrations/` (latest: `0045_research_signal_cache_index`, Phase 4's cache index) — no Phase 5 migration exists or is required. PO-1 boundary #10 already forbids new schema absent proof of genuine need; nothing in PO-1/2/3/4/5 as scoped requires a new column or table. `SourceDocument`, `DeterministicSignal`, and `UniversalRankingProfile` shapes are unchanged; `opportunity_score.factors` (migration 0044) already carries the qualitative ranking profile.

## 9. Exact deterministic signal(s) available pre-Research

Exactly one, system-wide: absent SSL/TLS (`detectAbsentSsl()`), Web Development service family only, dimension `NEED_OPPORTUNITY_GAP`, confidence fixed at `OBSERVED_FACT_CONFIDENCE` (100). The other 16 service families (`CF-SERVICE-CATALOG-PO-DEC-001`) have no catalogue and thus no pre-Research signal at all — a candidate in any other service family reaches admission with zero deterministic signals, i.e. always `UNKNOWN` on every dimension except whatever `serviceFit`/`evidenceQuality`/`evidenceFreshness` can derive from the offer/AI-free evidence already live.

## 10. Exact admission behavior

Per `CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` and `CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md` §0/§16 (the only source for the concrete numbers below — see §16 of this report on its provenance):

| Case | Behavior |
|---|---|
| **Normal threshold** | Candidate admitted to AI escalation iff `needOpportunity ≥ MODERATE OR serviceFit ≥ MODERATE` (Primary-dimension OR-gate), **and** a shared budget unit is still available. Threshold governs AI-escalation eligibility only — never elimination/eligibility (Phase 2 unaffected). |
| **Strong-signal bypass** | Admitted ahead of normally-ranked candidates, skipping the rank/threshold test, **only if** it has ≥ 2 independent `OBSERVED` top-reliability signals with ≥ 1 Primary-dimension signal (§2 above). Still draws from the same shared budget — never an additional allowance. **Currently cannot fire for any candidate** — only one qualifying signal exists system-wide (§2). |
| **Top-N** | N = 10. Governs AI-escalation admission breadth only — never how many opportunities are shown to the freelancer. Candidates outside Top-N remain visible with deterministic-only evidence. |
| **Budget exhaustion** | B = 10 escalation units per Search (one unit = Research + optional conditional TCM together, for one candidate). Once exhausted, no further escalation occurs in that Search — regardless of remaining candidates' rank or bypass eligibility. Must be implemented as a named configurable constant (plan §21), not a magic number. |
| **AI failure** | Provider failure, timeout, or "no usable provider" are treated identically to budget exhaustion at the per-candidate level: the candidate is not dropped/hidden/blocked, falls back to deterministic-only presentation with a "not AI-reviewed" provenance marker. Already supported by the existing `ResearchProvider` interface's catch semantics (`provider.ts:59-61`). |
| **Cache hit** | Fresh, same-freelancer persisted Research for the (freelancer, entity) pair (Phase 4, migration 0045 index) → reuse, skip AI entirely for that candidate, does not consume a budget unit. Cross-freelancer reuse is product-decided but its shared-cache infrastructure is explicitly not authorized yet (Item #8) — same-freelancer only for now. |
| **Cache miss** | Proceeds to escalation admission (threshold or bypass) as above. |
| **Zero-AI search** | Explicitly authorized, not a failure state: §11 of `CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` requires deterministic-only candidates to be able to satisfy the Minimum Useful Lead Result on their own — a Search where every candidate is eliminated, below threshold without bypass, outside Top-N, or budget-exhausted before admission must still return deterministic-only results, never an empty or failed Search outcome for that reason alone. |

**Current runtime state:** none of this admission/budget/cache-consultation logic exists in `worker.ts` today. `researchProspectForOwner` (line 423) is called unconditionally for every candidate that survives the (currently vacuous) elimination check — i.e. for every discovered candidate. The Phase 4 cache index (`signalCache`, migration 0045) is wired through to `runResearchForOwner` but is explicitly **not consulted for admission decisions yet** — its own comment at `worker.ts:212-213` states "Phase 5 is what will consult this index before deciding whether to escalate — this pipeline does not read it."

## 11. AI remains enrichment/qualification-input only

Confirmed unaffected by Phase 5 as scoped. Research supplies narrative evidence and category-plausibility (consumed by Qualification); Target Customer Match supplies a stored signal, not an eligibility gate (`CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` DEC-002). Neither call performs elimination or computes the ranking score — both happen only after deterministic ranking has already ordered the candidate pool. Nothing in PO-1 through PO-5 or in this report changes this.

## 12. Candidate-level fallback behavior

Confirmed per §10 of `CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001`: AI skipped, denied, unavailable, or exhausted → candidate still shown, deterministic evidence only, transparent "not AI-reviewed" provenance marker, never dropped/hidden/blocked. MULR fields otherwise AI-derived (e.g. "why found") are populated from the deterministic signal(s) that drove discovery/ranking instead; a genuinely unavailable field uses the existing "missing information" MULR item and OBSERVED/INFERRED/UNKNOWN provenance model.

## 13. Retry/idempotency cannot consume unlimited AI budget

**Bounded, but not to exactly B per Search — flagged here as a residual risk requiring explicit test coverage, not a new PO decision.**

- Search attempts are capped: `MAX_SEARCH_ATTEMPTS = 3` (`packages/core-search/src/retry.ts:13`), enforced in `worker.ts:282`. A failed Search attempt is retried, not retried indefinitely.
- A retried attempt re-runs `runCanonicalPipeline` from the top, re-iterating every discovered prospect. Nothing resets a "budget consumed" count across attempts other than the Phase 4 cache: any prospect whose Research already persisted successfully on a prior attempt will cache-hit on the retry (§10) and consume no new budget unit.
- **Worst case:** if a Search attempt fails before any Research call persists (e.g., a crash immediately after escalation but before the DB write), the cache has nothing to hit on retry, and up to B = 10 units can be spent again on that retry — and again on the next, up to `MAX_SEARCH_ATTEMPTS` times. Total worst-case AI spend per Search is therefore bounded by `MAX_SEARCH_ATTEMPTS × B` = 3 × 10 = 30 units, **not unlimited**, but not a single-B guarantee either.
- This bound follows mechanically from already-decided architecture (cache-first check runs on every pass, including retries; `MAX_SEARCH_ATTEMPTS` is a pre-existing, unrelated constant) — it requires no new PO decision. It does require an explicit test, which the Implementation Plan's existing §13 test strategy does not currently list (it covers cache-hit/miss and budget-exhaustion within a single pass, not the cross-attempt interaction). **Recommend adding this as a Phase 5 test case before implementation is marked complete**, not before it starts.

## 14. No ₹499/₹1,499/K1/auth/payment/subscription changes

Confirmed: no file under §7's "must NOT change" list appears in the Phase 5 file list (§6). PO-1 through PO-5 each explicitly state this boundary; nothing discovered in this review contradicts it.

---

## 15. Strong-signal bypass clarification (explicit statement per PO instruction)

The strong-signal bypass **cannot currently fire** for any candidate. Exactly one qualifying signal (absent SSL/TLS, `OBSERVED_FACT_CONFIDENCE`, Primary-dimension `NEED_OPPORTUNITY_GAP`) exists system-wide; the bypass formula requires ≥ 2 independent qualifying signals. No second signal is invented or proposed here. Until a second independently-authorized qualifying signal exists (a separate, future, Product-Owner-gated decision per PO-2's own governance boundary — this does not authorize creating one), every candidate must clear the normal Top-N/threshold path to reach AI; none can bypass it.

## 16. Traceability note (not a blocker)

The concrete numeric values used throughout §10 (Top-N = 10, budget = 10, the threshold formula, and the ≥2-signal/≥1-Primary bypass formula) are recorded in `CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md` §0 ("Reconciliation Update — 2026-10-13"), which states they were "resolved by the Product Owner" but — unlike PO-1/PO-3/PO-4/PO-5 and the PO-2 decision communicated for this report — does not cite its own standalone Decision ID or a separately filed PO decision record. This report treats that plan section as authoritative because it is already relied upon as closed governance elsewhere in the decided chain (the PO-1..PO-5 decision round's own header lists it among "the now-closed governance set"). Flagged for completeness, not raised as an unresolved decision: nothing in this report's review surfaced a conflict with it, and no part of Phase 5 as scoped depends on a number not already in that section.

---

## 17. PO-BUDGET — lifecycle-wide B=10 (supersedes §13's conclusion)

**PO-BUDGET (DECIDED, CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001):** B=10 is a per-Search-**lifecycle** budget. All `MAX_SEARCH_ATTEMPTS = 3` attempts for one Search share a single pool of 10 units; a retried attempt must not reset or add to the remaining budget. §13's "3 × 10 = 30, not unlimited" worst case is explicitly rejected as the governing behavior — the PO has decided the true ceiling per Search is 10, full stop, including across crash-triggered retries.

This changes §13's conclusion ("no new PO decision required") after the fact: a PO decision was in fact required and has now been made. It does **not** change §10's table (threshold, Top-N, bypass, cache-hit, AI-failure, zero-AI-search rows are all unaffected) or any of PO-1 through PO-5 — only the cross-attempt scope of the budget row in §10.

Locked unit/consumption semantics (full text in the decision record):
- One admitted candidate = one unit, covering Research + conditional TCM together; internal provider retries for that candidate create no extra unit.
- A cache hit never consumes a unit (unchanged from §10).
- A candidate-level AI failure still consumes the unit (spent at admission, not at success) — this is a refinement of §10's "AI failure" row, not a contradiction of it.
- The strong-signal bypass draws from the same shared, lifecycle-wide pool — never an additional allowance.

## 18. Durability boundary — STOP condition triggered, no migration created

Investigated per explicit PO instruction, by inspecting the actual persisted shape of a Search (not inferred):

- Confirmed `searches` table columns, from every migration that has ever touched it ([0014_searches](packages/db/prisma/migrations/0014_searches/migration.sql), [0033_searches_completed_at](packages/db/prisma/migrations/0033_searches_completed_at/migration.sql)): `attempts, last_error, lease_owner, lease_expires_at, idempotency_key, completed_at` plus the immutable parameter snapshot and identity columns. None represents AI-unit consumption; `attempts` in particular counts worker-claim retries, a quantity independent of AI spend (a Search can exhaust its budget on attempt 1, or spend zero units across all 3 attempts).
- **No existing column can be reused without changing its decided meaning.** A genuine persistence requirement is therefore demonstrated, per the same bar PO-1's boundary #10 and this report's own §8 already apply ("no new schema absent proof of genuine need").
- An in-memory-only counter cannot satisfy the lifecycle guarantee: `runCanonicalPipeline` retries are specifically designed to survive a worker crash ([retry.ts:10-11](packages/core-search/src/retry.ts:10)), meaning the process holding an in-memory counter is exactly the thing that may not exist on the next attempt.

**Exactly what must be persisted:** one non-negative integer per Search, representing total AI escalation units consumed across all attempts (0–10), atomically readable/incrementable by whichever process runs the next attempt, incremented at admission time (not at AI success/failure), consistent with the locked "failure still consumes the unit" rule.

**Proposed schema shape (engineering proposal only — not authorized, not applied):**
```
-- PROPOSAL ONLY
ALTER TABLE "searches" ADD COLUMN "ai_escalation_units_consumed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "searches" ADD CONSTRAINT "searches_ai_escalation_units_consumed_non_negative"
  CHECK ("ai_escalation_units_consumed" >= 0);
```
Open question the proposal does not resolve: whether a single counter is sufficient or whether a per-candidate consumption ledger is needed to avoid double-charging a candidate admitted-but-uncommitted across a crash. Full reasoning in [CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION.md](CLIENT_FINDER_PHASE5_AI_BUDGET_SCOPE_ACROSS_RETRIES_PO_DECISION.md) §4.

**Why this requires separate authorization, not inferred from PO-BUDGET's approval:** the PO decision approves Option B's *scope and semantics*; it does not, by itself, authorize a schema change. The PO's own instruction for this investigation was explicit: no migration is to be created, and the schema requirement is to be reported, not resolved, here.

## 19. Revised files-expected-to-change (conditional on separate migration authorization)

§6/§7 are unchanged for PO-1 through PO-5. **Additively, if and only if the §18 migration is separately authorized**, the following would also change (not authorized by this report, listed for completeness only):
- A new numbered migration under `packages/db/prisma/migrations/` adding `ai_escalation_units_consumed` to `searches` (per §18's proposal).
- `packages/core-search/src/types.ts` (`StoredSearch`), `pgRepository.ts`, `repository.ts` — surface the new column.
- `apps/worker/src/searchWorker/worker.ts` — read remaining budget from the Search row at admission time instead of (or in addition to) an in-process counter; atomic increment call at admission.

No other file is implicated. §7's "must NOT change" list is unaffected.

---

## STOP CONDITION CHECK

Reviewed for: additional unresolved Product Owner decision, schema requirement, eligibility change, or architectural change outside PO-1 through PO-5.

- PO decision was required and has been made for budget scope across retries (§17) — §13's original "no new PO decision required" conclusion is superseded, not valid as a standalone claim anymore.
- Schema/migration **is** required to make the PO-decided lifecycle guarantee durable across worker crash/restart (§18) — §8's "No" conclusion stands only for PO-1 through PO-5 as originally scoped; it does not extend to PO-BUDGET's durability requirement, which is a distinct question raised after §8 was written.
- No eligibility change (§3, §11, §12) — unaffected by PO-BUDGET.
- No architectural change beyond what PO-1 through PO-5, `CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001`, and CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001 already authorize.

**PHASE 5 IMPLEMENTATION STATUS: PARTIALLY READY — BLOCKED ON BUDGET DURABILITY AUTHORIZATION**

PO-1 through PO-5 (pre-admission fetch, bypass category, dimension mapping, SourceDocument reuse, Places deferral) remain READY as described in §1–§16. The budget-scope *semantics* (PO-BUDGET, §17) are also DECIDED. Implementation of the admission/budget mechanism itself must not proceed until the §18 durability question is resolved — either by authorizing the proposed migration (or an alternative), or by the PO explicitly accepting a non-durable (in-memory-only, crash-vulnerable) implementation as a known, temporary gap. Neither has happened yet.

No code yet.
No migration yet.
No commit.
No push.

## 20. Durability MECHANISM — questionnaire issued, still blocked (2026-10-15)

§18 established *that* durable persistence is required; it did not resolve *which* mechanism. That choice is now a formal, separate PO decision: [CLIENT_FINDER_PHASE5_AI_BUDGET_DURABILITY_MECHANISM_PO_DECISION_QUESTIONNAIRE.md](CLIENT_FINDER_PHASE5_AI_BUDGET_DURABILITY_MECHANISM_PO_DECISION_QUESTIONNAIRE.md) (CF-PHASE5-AI-BUDGET-DURABILITY-PO-DEC-PREP-001), presenting Option A (single durable counter on `searches`) vs. Option B (per-candidate durable ledger) neutrally, grounded in the existing lease-fencing pattern ([pgRepository.ts:146-239](packages/core-search/src/pgRepository.ts:146)) and the confirmed-sequential candidate loop ([worker.ts:410-422](apps/worker/src/searchWorker/worker.ts:410)). Finding: Option A alone already satisfies every locked budget-semantics rule from §17; a ledger is not required by those rules and would only be chosen for additional auditability/idempotency properties the PO may or may not want.

**PHASE 5 IMPLEMENTATION STATUS (unchanged from §19): BLOCKED on budget durability.** Narrowed from "is persistence required" (resolved: yes) to three specific open questions in the linked questionnaire — mechanism (A/B), whether candidate-level auditability is wanted as its own goal, and whether the 10-unit ceiling is enforced at the database layer or in application code. No migration proposed or authorized; no code changed.
