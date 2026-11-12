# CLIENT_FINDER_PDEF_4_POST_COMMIT_IMPLEMENTATION_STATUS_AUDIT_PREPARATION

**STATUS: PREPARATION ONLY. NOT A DECISION RECORD.**

This record is an audit-and-planning artifact produced after commit
`1898d8180d35909f5a2465061d8d8b4c5539d152` ("feat(core-research,worker): wire
PCG-4 TARGET_CUSTOMER_MATCH into production"). It makes no Product Owner
decision, no Engineering Design decision, and no implementation,
deployment, release, or launch authorization. It records verified facts
about the current state of the repository and lays out the remaining
decision/implementation surface so a future decision record can be
prepared against a clean factual basis.

Scope note: this audit relies on the governing chain already recorded
under `requirement/`. It does not reinterpret, resolve, or supersede any
existing decision. Where a step in the chain is itself only a
`_PREPARATION` document (no corresponding decision exists), that is
reported as a gap, not resolved.

---

## 1. Baseline

- **HEAD:** `1898d8180d35909f5a2465061d8d8b4c5539d152`
- **Branch:** `feature/client-intent-discovery-complete`
- **Upstream:** `origin/feature/client-intent-discovery-complete`, confirmed at the same SHA — no commit exists after the PCG-4 commit, locally or on origin.
- **Working tree:** 110 changed entries relative to HEAD (24 modified tracked files, 86 untracked new files). None of these were modified or created by this audit; this audit added exactly one new file (this record).
  - Everything introduced *by* commit `1898d818` is enumerated in §2 below and is therefore already part of HEAD, not working-tree drift.
  - Everything else in the working tree (new packages `core-funnel-events`, `core-launch-gates`, `core-launch-gates-validation`, `core-qualification-equivalence`; migrations `0031`–`0035`; `apps/web/middleware.ts`; `apps/web/src/server/visitor.ts`; most `requirement/*.md` files; modified payment/search/opportunity files) **predates** the PCG-4 commit and was already uncommitted working-tree state before this task began.

## 2. Files touched by commit `1898d818` (PCG-4 production wiring)

30 files changed, 7,416 insertions, 0 deletions:

- `apps/worker/src/index.ts`
- `apps/worker/src/searchWorker/worker.ts`, `worker.test.ts` (new)
- `packages/core-research/src/index.ts`, `service.ts`, `service.test.ts`, `testSupport.ts`
- `packages/core-research/src/targetCustomerMatch.ts` (new), `targetCustomerMatch.test.ts` (new)
- `packages/core-research/src/targetCustomerMatchRepository.ts` (new), `targetCustomerMatchRepository.test.ts` (new)
- `packages/db/prisma/migrations/0036_target_customer_match_determinations/migration.sql` (new)
- `packages/db/prisma/migrations/0037_target_customer_match_source_documents/migration.sql` (new)
- `tests/integration/search-worker.integration.test.ts`
- 15 `requirement/*.md` files: the full PCG-4 sub-chain (PO decision, Engineering Design decision, Evaluation Mechanism PO decision, Technical Design decision, Implementation Authorization decision, Production Wiring decision) plus their `_PREPARATION`/`_QUESTIONNAIRE` precursors.

## 3. Governing-chain verification

All records are human-readable markdown under `requirement/`. Chronological/supersession order, as actually found in the repository (not assumed from filenames):

| # | Record | Authority | Status |
|---|---|---|---|
| 1 | `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | Direct human PO | DECIDED. Not superseded. |
| 2 | `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | Direct human PO | Partial first pass — PCG-4/5/6 left PENDING. |
| 3 | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | Direct human PO | Supersedes #2. PDEF-3 fully decided at policy level: thresholds PCG-1 1:500, PCG-2 ≥50, PCG-3A ≥10%, PCG-3B ≥5%, PCG-4 ≥60%, PCG-5 ≤8%, rolling 30-day default window. |
| 4 | `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | Direct human PO | DECIDED (ES-1, ES-5..11). Supersedes two earlier all-PENDING drafts in place. |
| 5 | `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | **Delegated AI authority** (explicitly distinguished from #1–4 in its own provenance section) | DECIDED (Q1–Q10). Supersedes an earlier all-PENDING draft. |
| — | `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_COMPLETION_DECISION_PREPARATION.md` | — | **PREPARATION ONLY — no corresponding completion decision exists.** Gap. |
| 6 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | Delegated AI authority | DECIDED (Q-1..Q-12). |
| 7 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | Delegated AI authority | DECIDED (ED-1..13, PO-D1/D2). |
| 8 | `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` | Delegated AI authority | DECIDED (B-1..B-11c). Self-flags a label mismatch in its own source questionnaire (B-2/B-3) and resolves against evidence rather than the mislabeled text — flagged explicitly in the record, not silently corrected. |
| 9 | `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` | Delegated AI authority | AUTHORIZED W-1..W-16 (all 16, 0 blocked). Records PO-1 (90-day validation evidence retention), PO-2 (no `completed_at` backfill), PO-3 (₹1,499 pricing finding). Explicitly **not** a deployment/release/launch authorization. |
| 10 | `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md` | Delegated AI authority | Records what was actually built for W-1..16 pre-PCG-4-wiring. PCG-4 recorded as NOT YET EVALUABLE at that point. ED-3 recorded as an unimplemented gap (disposition C). Phase 9 (16-scenario real-Postgres suite) closed in §4A addendum. |
| 11a | `..._PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (PDEF4-PCG4-PO-DEC-001) | Delegated AI authority | DECIDED — product semantics of TARGET_CUSTOMER_MATCH; defines path to eventual evaluability via a new Research-time signal. |
| 11b | `..._ENGINEERING_DESIGN_DECISION.md` (PDEF4-PCG4-ED-DEC-001) | Delegated AI authority | DECIDED — ED-TC-1/3/4/6/8/9, table/timing/storage shape. |
| 11c | `..._EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` (PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001) | Delegated AI authority | DECIDED — TC-MATCH-1..12: verified-quote requirement, contradiction → NOT_YET_OBSERVED, model/version persistence, no freshness window. |
| 11d | `..._TECHNICAL_DESIGN_DECISION.md` (PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001) | Delegated AI authority | DECIDED — TD-1..16: model I/O shape, aggregation, metadata, migration/table naming. |
| 11e | `..._IMPLEMENTATION_AUTHORIZATION_DECISION.md` (PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001) | Delegated AI authority | AUTHORIZED the code/schema/migrations/tests actually landed in commit `1898d818` (migrations 0036/0037, `targetCustomerMatch.ts`, repository, `pcg4.ts` join). |
| 11f | `..._PRODUCTION_WIRING_DECISION.md` (PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001) | Delegated AI authority | AUTHORIZED **only** the dependency-injection wiring in `apps/worker/src/index.ts` and `searchWorker/worker.ts` (+ tests). Explicitly not a deployment/release/launch authorization. |
| 12 | `CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_PREPARATION.md` | — | **PREPARATION ONLY — no decision file exists at this path.** This is the step that would authorize wiring `evaluateAllGates`/`recomputeBlockerGates` into an actual API route, cron, or CLI. Gap, confirmed consistent with the code finding in §5 (zero call sites). |

All `*_PREPARATION.md`, `*_QUESTIONNAIRE.md`, `*_ORDERED_QUESTIONNAIRE.md`, and `*_FACILITATION_RECORD.md` files were checked and correctly self-identify as non-authoritative; none was found presenting itself as a decision. No record was found overclaiming what was actually built.

**Provenance caveat applying to the entire chain from item 5 onward:** every PDEF-4 record (items 5–12) is recorded under delegated AI authority, not direct human Product Owner input, and each record states this distinction itself. This audit treats that distinction as load-bearing: it does not elevate any delegated-authority record to direct-PO status, and does not treat the existence of a delegated decision as equivalent to Product Owner sign-off where a record itself says otherwise.

## 4. PDEF-4 workstream matrix

| Workstream | Governance status | Implementation | Tests | Wiring | Operational | Remaining dependency | Classification |
|---|---|---|---|---|---|---|---|
| PCG-1 (1:500 search:qualifying) | DECIDED (#3) | `pcg1.ts` present | Covered via `window.test.ts`/`ratio.test.ts` + Phase 9, no dedicated file | Library only | No production call site | Gate Evaluation Operational Wiring decision (#12, prep only) | PARTIAL |
| PCG-2 (≥50 payments) | DECIDED (#3) | `pcg2.ts` present | Same as above | Library only | No production call site | Same as PCG-1 | PARTIAL |
| PCG-3A (≥10% funnel step) | DECIDED (#3) | `pcg3a.ts` present; writer path (`recordFunnelEvent`) IS live from `apps/web/app/upsell/[productId]/page.tsx` | No dedicated file; Phase 9 covers | Writer wired; evaluator not | Writer operational; evaluator not | Gate Evaluation Operational Wiring (#12) | PARTIAL |
| PCG-3B (≥5% funnel step) | DECIDED (#3) | `pcg3b.ts` present, same writer path as 3A | Same | Writer wired; evaluator not | Writer operational; evaluator not | Gate Evaluation Operational Wiring (#12) | PARTIAL |
| PCG-4 (TARGET_CUSTOMER_MATCH ≥60%) | DECIDED, full sub-chain 11a–11f | Full path implemented (see §5) | `pcg4.test.ts`, `targetCustomerMatch.test.ts`, `targetCustomerMatchRepository.test.ts`, Phase 9 | DI-wired into worker | Research call path live; gate-evaluation call path not | Gate Evaluation Operational Wiring (#12); no E2E test proves real MATCH → nonzero numerator | PARTIAL |
| PCG-5 (≤8% refunds) | DECIDED (#3) | `pcg5.ts` present; `refundEvents.ts` present | No dedicated file; Phase 9 covers | Library only | No production call site | Gate Evaluation Operational Wiring (#12) | PARTIAL |
| PCG-6 (review-based gate) | DECIDED (#3) | `pcg6.ts` present | No dedicated file; Phase 9 covers | Library only | No production call site | Gate Evaluation Operational Wiring (#12) | PARTIAL |
| Gate Evaluation Operational Wiring | **Only a PREPARATION doc exists; no decision** | N/A | N/A | N/A | N/A | Decision must be made/prepared first | PO DECISION REQUIRED (or ENGINEERING DECISION REQUIRED, depending on how the decision is scoped — see §6) |
| PDEF-4 Launch Criteria Completion | **Only a PREPARATION doc exists; no decision** | N/A | N/A | N/A | N/A | Decision must be made first | PO DECISION REQUIRED |
| ED-3 bot/internal-traffic exclusion | Designed (disposition C, Option B per conformance record) | **Not implemented** — zero references in source, only in compiled `.next` chunks and requirement docs | N/A | N/A | N/A | Operational allowlist input (IP/account-ID list) never supplied | OPERATIONAL INPUT |
| core-launch-gates-validation | Authorized under W-1..16 | Implemented | Unit-tested + Phase 9 | No caller in `apps/` | Test-only harness | None blocking; usable now if a caller is authorized | IMPLEMENTATION AUTHORIZED (caller not yet authorized) |
| core-qualification-equivalence | Authorized under W-1..16 | Implemented | Unit-tested (8 tests per conformance record) | Called only by `pcg4.ts` | Inert (pcg4.ts itself uncalled) | Same as PCG-4 operational gap | PARTIAL |
| core-funnel-events | Authorized under W-1..16 | Implemented | Unit-tested | Writer live | Writer operational | Reader path not needed until gate wiring exists | PARTIAL (writer COMPLETE, reader pending wiring) |
| Visitor cookie / middleware (`middleware.ts`, `visitor.ts`) | Not a PDEF-4-named workstream; supports PCG-3A/3B attribution and order `visitorId` (migration 0032) | Implemented | Not separately audited for dedicated unit tests in this pass | Wired (Next.js middleware matcher on `/upsell`, `/api/payments/create-order`, `/opportunities`) | Operational — runs on every matched request | Matcher pattern flagged by conformance record for review against actual route-group structure before production reliance | COMPLETE (implementation), with a flagged review item |
| Usage metering for TARGET_CUSTOMER_MATCH model calls | Explicitly deferred per Production Wiring decision (11f) | Not implemented | N/A | N/A | N/A | None — explicitly deferred, not blocked | OPERATIONAL INPUT / already-scoped-out (not a blocker) |

## 5. PCG-1..6 status matrix (IMPLEMENTED / TESTED / WIRED / OPERATIONAL / DEPLOYED distinction)

| Gate | IMPLEMENTED | TESTED (unit) | TESTED (real-PG E2E, Phase 9) | WIRED (has a caller outside its own package) | OPERATIONAL (reachable from a live request/cron path) | DEPLOYED (running in production right now) |
|---|---|---|---|---|---|---|
| PCG-1 | Yes | Indirect (window/ratio) | Yes | No | No | No |
| PCG-2 | Yes | Indirect | Yes | No | No | No |
| PCG-3A | Yes | Indirect | Yes | Writer only | Writer only | Writer only |
| PCG-3B | Yes | Indirect | Yes | Writer only | Writer only | Writer only |
| PCG-4 | Yes (full chain, see §6) | Yes, direct | Yes | DI-wired into worker (research call), not into gate evaluation | Research-call path yes; gate-read path no | Research-call path yes (once this branch deploys); gate-evaluation output no |
| PCG-5 | Yes | Indirect | Yes | No | No | No |
| PCG-6 | Yes | Indirect | Yes | No | No | No |

No PCG is DEPLOYED in the sense of "its computed gate status is currently visible or acted upon anywhere outside a test." `evaluateAllGates`/`recomputeBlockerGates` (or equivalent entry points in `core-launch-gates`) have zero call sites in `apps/web` or `apps/worker`.

## 6. PCG-4 TARGET_CUSTOMER_MATCH deep audit

Every hop in the governing chain's intended path was traced against actual code and confirmed present:

1. `Search.targetCustomer` → `packages/core-research/src/service.ts:200` reads `search.parameters.targetCustomer` and passes it verbatim to `evaluateTargetCustomerMatch`. **Confirmed.**
2. Research source documents → `service.ts:193-197` reuses the documents already fetched for the Prospect research call (`capture.supplied?.documents`), independent of `categoryPlausibility`'s own computation. **Confirmed.**
3. `targetCustomerMatch` evaluation (`packages/core-research/src/targetCustomerMatch.ts`):
   - Dedicated bounded model call (`callTargetCustomerMatchModel`), reusing generic retry/backoff/repair primitives, not sharing `categoryPlausibility`'s call. **Confirmed.**
   - Verification: `verifyTargetCustomerMatchFindings()` requires a verbatim (post-normalization) quote match against the cited source document; unverifiable findings are silently dropped (lines ~101-128). **Confirmed.**
   - Tri-state aggregation (`aggregateTargetCustomerMatch()`, lines ~139-148): MATCH+NO_MATCH both present → `NOT_YET_OBSERVED` (contradiction never auto-resolved); neither present → `NOT_YET_OBSERVED`; exactly one present → that result. Matches TC-MATCH-3/4/5/6. **Confirmed.**
   - Fail-soft: provider failure, refusal, or schema-never-valid all resolve to empty findings → `NOT_YET_OBSERVED`, never thrown (except caller abort/deadline, which propagates by design). **Confirmed.**
   - Model/provider/promptVersion metadata persisted non-null on every row, including failure rows (TD-6). **Confirmed** against both the return shape and the migration's NOT NULL columns.
4. Determination repository (`targetCustomerMatchRepository.ts`):
   - `supersedePrevious()` + `save()` run sequentially, **not** inside a single DB transaction — explicitly flagged in `service.ts` (lines ~186-187) as a separate, undecided question per TD-10 §5. This is a known, named gap, not a silent one.
   - DB uniqueness: migration `0036` creates a **partial unique index** on `(search_id, prospect_id) WHERE superseded_at IS NULL` — DB-enforced current-row uniqueness. **Confirmed.**
   - Concurrent-write handling: `save()` catches Postgres error `23505` on that specific constraint and treats it as an idempotent no-op, returning the already-current row rather than throwing or double-inserting. **Confirmed.**
   - Source binding: migration `0037` stores `source_text` + `content_sha256` (lower-case hex, SQL `CHECK`-enforced) per determination, enabling replay/audit. **Confirmed.**
5. Migrations `0036`/`0037`: **both exist** and were introduced by commit `1898d818`.
6. Worker wiring: `apps/worker/src/index.ts:143-144` constructs `targetCustomerMatch: { repository: createPgTargetCustomerMatchRepository(pool), ... }`; `apps/worker/src/searchWorker/worker.ts:200-202,435` forwards it conditionally to the research call. **Confirmed real, non-mocked wiring** at both the DI-construction and forwarding layers.
7. Persisted determination → `pcg4.ts`: `LEFT JOIN` on `target_customer_match_determinations WHERE superseded_at IS NULL`, translated via `toObservedTargetCustomer()` — `MATCH` → the literal `targetCustomer` string, `NO_MATCH` → a structurally-impossible NUL-byte-delimited sentinel (Postgres `TEXT` cannot carry a NUL byte, so no real value can collide), `NOT_YET_OBSERVED`/row-absent → `null`. **Confirmed.**
8. PCG-4 result: numerator requires `evaluateQualificationEquivalence(...).match === true` for a reviewed+useful opportunity. The Phase 9 fixture suite's PCG-4 scenario still shows a structurally-zero numerator in its fixture (no real determination row is seeded for that scenario) — this is the documented, by-design pre-population state, not a defect.

**What still prevents PCG-4 from being fully evaluable in production:** the research-call-to-determination-row path is wired and correct, but (a) no call site exists anywhere that reads `pcg4.ts`'s output as part of an actual gate evaluation run (same gap as all other PCGs — see §5), and (b) no test was found that exercises the full path end-to-end with a *real* Research call producing a *real* MATCH row that then flows into a nonzero PCG-4 numerator — unit tests for `pcg4.ts` mock the evaluator/row data directly, and the Phase 9 integration suite confirms the zero-numerator pre-population state rather than a populated one. Both gaps are consistent with the governing records' own stated scope (Production Wiring decision 11f authorized DI wiring only, not gate-evaluation wiring or an end-to-end proof).

## 7. Remaining blockers, separated by category

**A. Product Owner decisions required**
- PDEF-4 Launch Criteria Completion (only a `_PREPARATION` doc exists).
- Whether/how to scope the "Gate Evaluation Operational Wiring" decision itself may require PO input on where gate results surface (internal dashboard? API? cron-only computation persisted to a snapshot table?) before an Engineering Design decision can be prepared — this audit does not decide that split; it is flagged as open.

**B. Engineering decisions required**
- Gate Evaluation Operational Wiring: the actual mechanism (API route vs. cron vs. CLI) that would call `evaluateAllGates`/`recomputeBlockerGates` and expose/persist the result — currently only a preparation document exists, no decision.
- Whether `supersedePrevious()` + `save()` in `targetCustomerMatchRepository.ts` must be moved into a single DB transaction (flagged by the implementation itself per TD-10 §5 as undecided).
- An end-to-end test strategy that would prove a real Research-pipeline MATCH flows to a nonzero PCG-4 numerator (currently absent).

**C. Operational inputs required**
- ED-3 bot/internal-traffic allowlist (IP list or account-ID list) — design exists (disposition C / Option B), no input has ever been supplied, so it remains unimplemented.
- Usage metering wiring for the new TARGET_CUSTOMER_MATCH model call — explicitly deferred per the Production Wiring decision; not currently blocking anything, but will need an owner before cost/usage visibility is required.
- Review of the `middleware.ts` route matcher against the actual route-group structure (flagged by the conformance record, not yet confirmed correct).

**D. Already-authorized implementation (could begin without a new decision)**
- Nothing further is authorized for PCG-4 beyond what commit `1898d818` already implements; the Production Wiring decision (11f) scoped its authorization exactly to the DI wiring that was committed.
- `core-launch-gates-validation`, `core-qualification-equivalence`, and `core-funnel-events` are all implemented and tested under existing W-1..16 authorization; no further work on these three packages themselves is pending — the pending item is a *caller*, which requires the Gate Evaluation Operational Wiring decision (category B above), not more work inside these packages.

**E. Deployment/release restrictions**
- Every decision record in the PCG-4 sub-chain (11a–11f) and the top-level Implementation Authorization decision (#9) explicitly states it is not a deployment, release, or launch authorization. No record in the repository authorizes deploying this branch, merging to a release branch, or declaring PDEF-4 launch-ready. This audit does not change that.

## 8. Next-workstream candidates

For each candidate below: objective, existing authorization, likely files, dependencies, risks, tests required, whether further decision preparation is needed, and whether implementation could begin immediately.

**Candidate 1 — Gate Evaluation Operational Wiring**
- Objective: expose `evaluateAllGates`/`recomputeBlockerGates` through a real call path (API route, cron, or CLI) so gate status is actually computed outside tests.
- Existing authorization: none — only `CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_PREPARATION.md` exists.
- Files likely affected: new route/cron file under `apps/web` or `apps/worker`; possibly `packages/core-launch-gates/src/combined.ts` as the entry point; `packages/core-launch-gates/src/snapshotRepository.ts` if persisting results.
- Dependencies: a decision on where results surface (internal-only vs. exposed), and whether `core-launch-gates-validation` should run inline (shadow-validate) or stay test-only.
- Risks: computing gates against production data before ED-3 bot exclusion exists could produce numbers inflated/deflated by bot/QA traffic.
- Tests required: new integration test proving the call path actually invokes the evaluator against real data; should extend, not duplicate, Phase 9.
- Decision prep required: **yes** — a PO and/or Engineering Design decision must be prepared and made before implementation.
- Can implementation begin now: **no.**

**Candidate 2 — PDEF-4 Launch Criteria Completion decision**
- Objective: close the open `_PREPARATION` doc with an actual completion decision.
- Existing authorization: none.
- Files affected: none (documentation/decision only).
- Dependencies: none technical; purely a governance step.
- Risks: none to code; risk is only that PDEF-4 remains formally "incomplete" until this is closed.
- Tests required: none.
- Decision prep required: **yes**, this *is* the decision step itself.
- Can implementation begin now: N/A (not an implementation workstream).

**Candidate 3 — ED-3 bot/internal-traffic exclusion**
- Objective: implement the already-designed (disposition C / Option B) allowlist filter.
- Existing authorization: design exists; no implementation authorization found that covers building the actual filter mechanism against a real operational input.
- Files likely affected: wherever gate-evaluation input is assembled (depends on Candidate 1's outcome), plus a new config/allowlist source.
- Dependencies: **blocked on an operational input** (the actual IP/account-ID list) that has never been supplied, and likely blocked on Candidate 1 existing first (no point filtering input to a computation that has no caller).
- Risks: building the mechanism before the input exists risks guessing the wrong shape (IP list vs. account flag vs. header-based).
- Tests required: unit tests for the filter; integration test proving excluded traffic doesn't affect gate numerators.
- Decision prep required: possibly an Engineering Design decision for the filter mechanism's exact interface, even though the policy (disposition C) is already decided.
- Can implementation begin now: **no** — operational input missing, and likely sequenced after Candidate 1.

**Candidate 4 — Single-transaction write for `targetCustomerMatchRepository`**
- Objective: resolve the self-flagged open question (TD-10 §5) of whether `supersedePrevious()` + `save()` need to be atomic.
- Existing authorization: none — explicitly left open by the implementation itself.
- Files likely affected: `packages/core-research/src/targetCustomerMatchRepository.ts`, its test file.
- Dependencies: none external; self-contained.
- Risks: low — a narrow, well-understood change (wrap two statements in a transaction) if decided to proceed; risk of *not* deciding is a narrow window where a concurrent supersede+save could interleave inconsistently (bounded in practice by the unique-index idempotency guard already in place).
- Tests required: a concurrency test proving atomicity if implemented.
- Decision prep required: a small Engineering Decision, not a full PO cycle — this is the narrowest-scoped open item in the entire audit.
- Can implementation begin now: **no**, per this task's own constraint (no new Engineering Design decisions may be made here) — but this is the cheapest item to resolve once a decision is made.

**Candidate 5 — End-to-end proof test for PCG-4 (real MATCH → nonzero numerator)**
- Objective: add an integration test that runs a real `evaluateTargetCustomerMatch` call (or a faithful fixture of one) through to a persisted row and then through `pcg4.ts` to a nonzero numerator, closing the gap noted in §6.
- Existing authorization: arguably already covered by the existing Phase 9 test-authorization scope (W-1..16), since it's "more tests for an already-authorized gate," not new product behavior.
- Files likely affected: `tests/integration/target-customer-match.integration.test.ts` (already exists — may just need extension) or `tests/integration/launch-gates-phase9.integration.test.ts`.
- Dependencies: none blocking.
- Risks: low — test-only change.
- Tests required: this candidate *is* the test.
- Decision prep required: likely **no** — this looks implementable under existing test-authorization scope, but flagged here rather than decided, since this audit is not authorized to make that call either.
- Can implementation begin now: **plausibly yes, under existing authorization — but this audit does not authorize it.** A future decision record should confirm this reading before anyone proceeds.

## 9. Recommended next slice

**Recommended: Candidate 5 (end-to-end proof test for PCG-4) is the smallest, lowest-risk, most clearly-already-authorized next slice** — IF a decision record confirms it falls under existing test-authorization scope. It touches no production code path, carries no deployment implication, and directly closes the one concrete correctness gap this audit found in an otherwise fully-implemented PCG-4 path (§6, point 8).

It is preferable to Candidates 1–3 because those three all require a new PO and/or Engineering Design decision before any implementation may begin (per this task's own constraints, this audit cannot make those decisions or imply they're already made). It is preferable to Candidate 4 because Candidate 4, while narrowly scoped, still requires a new Engineering Decision on transactional semantics that has been explicitly left open by the implementation itself.

**This audit does not authorize Candidate 5 or any other candidate.** It only identifies it as the candidate most likely to require the least additional governance work before it could be authorized. A short preparation/decision record confirming that Candidate 5 is in scope under existing Phase 9 / W-1..16 test authorization would be sufficient to unblock it — no new product or engineering decision content appears to be required, only a confirmation of scope.

If the user wants the single smallest thing that is **unambiguously already authorized with zero further decisions needed**, the honest answer is: **nothing is currently authorized to proceed without at least a scope-confirmation step.** Every PCG gate's *evaluator* is done; what's missing is either (a) a caller for it (Candidate 1, needs new decisions) or (b) proof that the already-built PCG-4 path works end-to-end (Candidate 5, needs only a scope confirmation, not new decision content).

## 10. Governance stop conditions

Before further implementation proceeds, the following should be resolved:

1. A decision (not merely preparation) on Gate Evaluation Operational Wiring — without it, no PCG becomes operationally meaningful no matter how complete the evaluators are.
2. A decision (not merely preparation) closing PDEF-4 Launch Criteria Completion.
3. Resolution of the open transactional-semantics question in `targetCustomerMatchRepository.ts` (TD-10 §5) before that code path is relied upon under concurrent load.
4. Supply of the ED-3 operational allowlist input, or an explicit decision to keep deferring it.
5. Confirmation of whether Candidate 5 (an E2E proof test) is in scope under existing authorization, before anyone writes it under the assumption that it is.
6. No deployment, release, or launch step should be taken on this branch — every governing record in the PCG-4 chain and the top-level Implementation Authorization decision explicitly excludes that from its own scope.

## 11. Verification

- HEAD confirmed unchanged throughout this task: `1898d8180d35909f5a2465061d8d8b4c5539d152`.
- No tracked file was modified by this task.
- No file other than this single preparation record was created or modified by this task. (The 109 other working-tree entries pre-existed this task and were only read, never written.)
- SHA-256 of this record and final `git status` are to be captured immediately after this file is written, in the task's final report (not inside the file itself, to avoid a self-referential hash).

---

**PREPARATION ONLY — NO IMPLEMENTATION AUTHORIZED BY THIS TASK.**
