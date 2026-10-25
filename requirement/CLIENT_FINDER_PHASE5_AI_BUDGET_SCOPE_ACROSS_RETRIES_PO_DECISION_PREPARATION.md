# Phase 5 — AI Escalation Budget Scope Across Search Retries: PO Clarification Record

Status: **DRAFT FOR PO REVIEW — NO IMPLEMENTATION AUTHORIZED**

Source of this question: `CLIENT_FINDER_PHASE5_IMPLEMENTATION_READINESS_REPORT.md` §13
("Retry/idempotency cannot consume unlimited AI budget"), which flagged the
same arithmetic (3 × 10 = 30) as a residual risk requiring test coverage,
not a new PO decision. This record elevates it to an explicit PO decision
because the budget's scope across retries is a product-meaning question
("what does B=10 per Search mean"), not a mechanical consequence of
already-decided architecture.

## Problem statement

Decided: `B = 10` AI escalation units per Search (`CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md` §0; one unit = Research + conditional TCM for one candidate).

Decided, independently, for an unrelated domain: `MAX_SEARCH_ATTEMPTS = 3` ([retry.ts](packages/core-search/src/retry.ts:13)) — a Search that fails is requeued to `PENDING` and `runCanonicalPipeline` runs again from the top on the next claim, up to 3 attempts total before the Search is terminally `FAILED`.

Neither decision states whether the two compose. If a fresh budget is instantiated inside each `runCanonicalPipeline` invocation (the straightforward reading of "instantiate the budget where the pipeline runs"), the practical lifetime ceiling for one Search becomes `3 × 10 = 30`, not 10. This was not decided by either source document and must not be resolved by engineering by default.

## Option A — Per-attempt budget

Each `runCanonicalPipeline` attempt receives a fresh budget of 10. Lifetime maximum across `MAX_SEARCH_ATTEMPTS = 3`: **30**.

**Consistency with existing retry semantics.** Partially consistent, partially not. The retry mechanism's existing contract ([retry.ts:7-11](packages/core-search/src/retry.ts:7)) is attempt-scoped: "on the attempt that reaches this count, a failure is terminal." Nothing in that contract currently says state must carry across attempts — a retried attempt re-runs the full pipeline from the top, re-discovering prospects and re-evaluating signals from scratch. A fresh per-attempt budget is the path of least resistance against that existing shape. But the *product* framing of B as "10 units per Search" (not "10 units per attempt") reads as Search-scoped language being given attempt-scoped behavior — the inconsistency is semantic, not mechanical.

**Impact on predictable AI spend.** Breaks predictability. "B = 10 per Search" is the number the PO can forecast cost against. If spend is actually bounded by `3 × 10`, the true per-Search ceiling is 3x the stated figure, and that multiplier is invisible anywhere in product-facing language — it only exists as an artifact of how two unrelated constants happen to compose in code.

**"Hard upper bound" language.** Does not preserve it. The Phase 5 readiness report (§13) and the architecture decision both describe B as a ceiling for the Search. A ceiling that silently scales by `MAX_SEARCH_ATTEMPTS` under a specific failure pattern (early crash, before any Research persists) is not a hard bound on the Search — it is a hard bound on the attempt, with the Search's true bound left to depend on how many times it happens to retry.

**Can retries repeat Research for the same candidate?** Yes, for the unpersisted subset. Any candidate whose Research call succeeded and was durably written before the failure will cache-hit on the next attempt (Phase 4, migration 0045 same-freelancer reuse) and consume no new unit. Any candidate whose Research had *not* yet persisted at the time of failure — most dangerously, a crash after a successful AI call but before the DB write — has nothing to cache-hit on and will be re-escalated at full cost on the retry. This is exactly the worst case the readiness report's §13 already names.

**Interaction with idempotency/cache behavior.** The cache is what keeps Option A's worst case from being `30` on every retried Search — in the common case (failure happens after most persistence completes), most of the budget is "free" on retry because cache hits dominate. The worst case (early crash) is the one where the fresh-budget semantics actually matter, and it is also the least frequent. Option A's real-world spend is therefore bimodal: usually close to 10 total, occasionally close to 30, with no mechanism that currently distinguishes or limits the second case.

## Option B — Per-Search-lifetime budget

The Search receives one total escalation budget of 10. All retry attempts share the same remaining budget (e.g., attempt 1 consumes 7 → attempts 2/3 share 3 remaining; attempt 1 consumes 10 → later retries have zero remaining capacity).

**Fit with deterministic-first architecture.** Better fit. The deterministic-first architecture's own stated goal (`CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md`, readiness report §11) is that AI spend is a bounded, predictable addendum to a deterministic pipeline that must produce a usable result on its own. A budget that is actually bounded at 10 regardless of retry count matches that goal directly; a budget that can triple under failure does not.

**Impact on retry behavior.** A Search that has exhausted its lifetime budget on an earlier attempt still retries for its deterministic work (elimination, ranking, Top-N selection) — retry exists to recover from infrastructure failures (crash, lease expiry, transient provider/network errors), not to grant more AI spend. Under Option B, a retried attempt after budget exhaustion runs as a zero-AI-escalation pass: every candidate either cache-hits or falls back to deterministic-only presentation (already-supported "not AI-reviewed" provenance path, readiness report §10). This is a *stricter* outcome for some candidates than Option A would produce on retry, by design.

**Interaction with cache-first reuse.** Complementary, not overlapping. Cache hits already reduce consumption *within* the shared budget (a cache hit never consumes a unit, under either option). Option B additionally ensures the budget itself doesn't reset just because an attempt failed. The two mechanisms address different failure modes: cache answers "did we already pay for this candidate," budget-lifetime answers "how many times can the Search pay at all."

**Does this require schema persistence?** Only if the budget must survive a process crash with its consumed count intact (see crash scenario below). If the only requirement is "no more AI calls after 10 have been spent across retries that all occur within a single process's in-memory lifetime," no schema is needed — but Search retries in this system are explicitly designed to survive worker crashes (`retry.ts:10-11`: "a worker crash (lease expiry) does not count against this budget" — referring to the attempt-count budget, but confirming crashes are a normal, expected retry trigger here), so an in-memory-only counter cannot satisfy "10 across the Search's lifetime" in the case that matters most: the crash-and-resume case.

**Can an in-memory budget safely span the existing retry mechanism?** No, not for the crash case. `runCanonicalPipeline` is invoked once per claimed attempt, in a process that may not be the same process (or the same process instance) as the one that handled a prior attempt — that is the entire reason `MAX_SEARCH_ATTEMPTS` and lease expiry exist. An in-memory counter dies with the process. It can correctly enforce "10 per Search" only within a single attempt, which collapses Option B back into Option A for any Search that crashes rather than failing-and-returning-cleanly within one process.

**What happens if the process crashes and the Search is retried later?** This is the deciding case. If consumed-budget state is not persisted, the retried attempt has no way to know 7 of 10 units were already spent — it starts counting from zero again, in-process, and Option B degrades silently into Option A's worst case for exactly the scenario Option B exists to prevent. A genuine per-Search-lifetime guarantee that holds across crashes requires the consumed count (or the per-candidate ledger that implies it) to be durable — i.e., readable by whichever process picks up the next attempt. This is a real persistence requirement, not a precautionary one, if Option B is selected and the "survives a crash" case is intended to be covered.

## ENGINEERING RECOMMENDATION — NOT A PO DECISION

The architecture consistently describes B as a hard, predictable ceiling on AI spend "per Search" — not per attempt, per invocation, or per process. Every other place that number is used (readiness report §10's budget-exhaustion row, the architecture decision's cost-boundary framing) treats the Search as the unit the number bounds. Treating it as per-attempt would mean the one piece of language in this architecture described as a "hard upper bound" is, in the retry-heavy worst case, actually a soft bound that can triple — without that multiplier appearing anywhere a PO or finance stakeholder would see it.

On that basis, engineering's assessment is that "B = 10 per Search" is more consistent with the rest of the already-approved architecture read as **per-Search-lifetime** (Option B) than per-attempt (Option A). This is a reading of existing, already-approved language, not a request to change B's value, the Top-N value, the bypass rule, or any other already-decided number.

If the PO selects Option B, note the dependent consequence surfaced above: a genuine lifetime guarantee that holds across a worker crash requires persisting the consumed-budget count (or equivalent per-candidate ledger) somewhere durable, which was explicitly out of scope for this clarification ("no migration unless a genuine persistence requirement is demonstrated"). That requirement would then need its own, separate PO authorization before a migration is proposed — this document does not request or assume that authorization.

If the PO selects Option A instead, the known consequence is the one already flagged in the readiness report §13: worst-case lifetime spend of `MAX_SEARCH_ATTEMPTS × B` = 30 units per Search, accepted as a known and bounded (not unlimited) ceiling, with the cross-attempt interaction added to Phase 5's test plan as that report already recommended.

### PO DECISION REQUIRED

Should the approved B=10 AI escalation budget be:

1. **Per Search attempt** — maximum 10 per attempt, potentially up to 30 across the existing 3 Search attempts

OR

2. **Per Search lifecycle** — maximum 10 across all Search attempts combined

PHASE 5 IMPLEMENTATION REMAINS BLOCKED UNTIL THIS BUDGET-SCOPE CLARIFICATION IS RECORDED.

No code.
No migration.
No commit.
No push.
