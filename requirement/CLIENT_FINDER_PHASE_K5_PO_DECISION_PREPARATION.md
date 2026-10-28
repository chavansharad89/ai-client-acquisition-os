# Phase K5 — PO Decision Preparation for K4 Findings

**Status: DECISION-PREPARATION DOCUMENT ONLY. NO IMPLEMENTATION AUTHORIZED. NO SOURCE, TEST, MIGRATION, OR GOVERNANCE FILE WAS MODIFIED TO PRODUCE THIS DOCUMENT.**

This document prepares two Product Owner decisions arising from `CLIENT_FINDER_PHASE_K4_REMAINING_INTEGRATION_FAILURE_ROOT_CAUSE_AUDIT.md`. It presents options neutrally. It does not recommend or select any option, and does not weaken, restore, or bypass any existing PO decision (specifically: it does not recommend restoring `targetCustomer` to the freelancer UI, does not recommend weakening the Service+Geography-only decision, and does not recommend changing the R-71 topical-field exclusion merely to make tests pass).

---

## 1. Executive Summary

Phase K4 audited 26 remaining integration-test failures and found:

- **No production defects.** Every failure traces to either (a) one intentional, already-authorized production mechanism whose downstream consequences on test fixtures were not previously decided, (b) an independent, also-intentional admission-gate change, or (c) one genuinely pre-existing fixture/evidence-placement mismatch.
- **Global Entity Architecture is confirmed healthy** — no regression, no code diff in the Entity repository, all Entity-layer integration suites pass.
- Two of the findings raise **product-behavior questions that engineering cannot resolve on its own**, because the current code's behavior is a side effect of an authorized architectural change (Service+Geography-only search input) whose downstream implications for `NEED_DETECTED` reachability and for PCG-4/category-plausibility test coverage were never explicitly decided. This document frames those two decisions (§3, §4) for the PO.
- Two further findings are **engineering/test corrections, not PO decisions** — they are documented here for completeness and future authorization, but are not placed before the PO (§5).
- Historical data and historical-search behavior are untouched by anything in K4 or this document, and nothing here authorizes any migration, backfill, or change to historical records (§6).

---

## 2. K4 Findings (carried forward, not re-derived here)

1. **Global Entity Architecture is healthy.** Entity creation, identity resolution, DiscoveryEvent persistence, entity-aware cache, field classification, and Q5-A/B/C global-sharing authorization all pass with no code diff in the Entity layer. No failure in K4's failure set touches this architecture.
2. **No production defects were identified.** `@acos/core-qualification`'s own unit suite passes 100%; `@acos/core-personalization`, `@acos/core-outreach-preparation`, and `@acos/core-followup-preparation` all correctly implement their documented null-propagation contracts; the ranking/next-action logic in `@acos/core-acquisition` is unmodified and correct.
3. **The dominant integration-test cascade** (21 of 26 failures) originates from `applySystemServiceProfileDefaults()` (`packages/core-service-profile/src/systemDefaults.ts`), which implements the Service+Geography-only redesign by unconditionally overwriting caller-supplied `keywords`, `triggers`, `targetCustomer`, `minProjectValuePaise`, and `rationale` with system/catalogue-derived values for every NEW search. This cascades: `needDetected=false` → `next-action=HOLD` → ranking's `offer.fit` reference crashes → `qualification=NOT_QUALIFIED` → `personalization=null` → `outreach=null` → `followup=null`; separately, the `targetCustomer` sentinel makes the TCM-write and category-plausibility-write gates (`targetSegments.length > 0`) permanently false for any search created this way.
4. **`client-finder-web.integration.test.ts` has an independent root cause**: the Phase 5 AI-escalation pre-admission gate (also new, uncommitted, separately PO-approved per `CLIENT_FINDER_PHASE5_PRE_RESEARCH_ADMISSION_INPUT_GAP_PO_DECISION_ROUND.md`) requires `sourceDocuments`/`signalCatalogue` worker dependencies that this test's fixture never supplies, so every discovered candidate fails admission and Research is never invoked for it.
5. **`personalization.integration.test.ts` has an independently confirmed pre-existing issue**: its only evidentiary signal is placed in `companySummary`, a field the committed (pre-dating all current uncommitted work) R-71 rule excludes from offer-matching. This is unrelated to Global Entity and unrelated to the Service+Geography-only mechanism.
6. **TCM and category-plausibility test coverage is now structurally incompatible** with the removal of caller-supplied `targetCustomer` for NEW searches — the current public API gives no supported way to construct the "historical-style" search these tests were written to exercise.

---

## 3. PO Decision 1 — Should `NEED_DETECTED` Remain Reachable for NEW Service+Geography-Only Searches?

**Current implementation:** `createServiceProfile()` → `applySystemServiceProfileDefaults()` → system-owned, catalogue-derived keywords/triggers (the freelancer supplies neither) → `suggestOffers()`'s keyword-substring match against live deterministic signals → `needDetected`. For every old integration fixture that supplied its own free-text `keywords`/`triggers`, those values are now silently discarded; `needDetected` evaluates false not because no need exists, but because the catalogue vocabulary does not literal-match the fixture's old free-text evidence wording.

This decision does not ask whether the Service+Geography-only redesign itself should change — that is settled. It asks what `NEED_DETECTED`'s relationship to that redesign's system-generated keyword set should be going forward, for both production behavior and test design.

### Option A — YES, through system-generated catalogue signals

**Product behavior:** The system-generated keyword/trigger catalogue (derived purely from `service` + `geography`) must itself be sufficient, whenever matching deterministic evidence genuinely exists, to produce a `NEED_DETECTED=true` result. The freelancer never supplies keywords/triggers; the catalogue is the sole vocabulary `suggestOffers()` matches against.

- **Architectural impact:** No change to the Service+Geography-only input model. The catalogue (`deriveSystemKeywords()`) becomes a load-bearing, product-facing vocabulary rather than an internal default — its completeness and accuracy become a product-quality concern, not just an engineering convenience.
- **Ranking impact:** None to the ranking model itself (`fit`/`UniversalRankingProfile` stay as designed); ranking already correctly handles `offer=undefined`. More opportunities would likely reach a detected offer than today, since the catalogue would need to be broadened/tuned to actually catch real evidence.
- **Qualification impact:** More opportunities would reach the `NEED_DETECTED` criterion satisfied, which is the only thing standing between many of today's failing fixtures and `QUALIFIED`/`INSUFFICIENT_EVIDENCE`.
- **Next-action impact:** Fewer opportunities would default to `HOLD` purely from `needDetected=false`; more would reach the staleness/state branches `recommendOpportunityAction()` was actually designed to exercise.
- **Impact on old integration tests:** Most of K4's §3.1-cascade failures (`opportunity`, `opportunity-next-action`, `opportunity-score`, `search-worker`'s need_detected case, `qualification`) would likely pass once the catalogue vocabulary is broadened to cover realistic evidence phrasing — but this requires catalogue content work, not just a test-fixture rewrite, since the fixtures' wording would need to be realistic evidence the catalogue is expected to catch.
- **Would implementation require a new PO decision?** Yes — selecting Option A authorizes nothing by itself; it would require a follow-up engineering-scoped decision on catalogue completeness/content strategy (e.g., should the catalogue include synonyms, or only literal canonical sub-service names?).
- **Risks:** False positives if the catalogue is broadened carelessly (e.g., overly generic terms matching unrelated evidence); false negatives remain wherever catalogue coverage is incomplete for a given service family. Risk is primarily a catalogue-content/maintenance burden, not an architectural one.

### Option B — NO, Need/Opportunity is optional and may remain UNKNOWN

**Product behavior:** For a NEW Service+Geography-only search, it is acceptable and expected that `NEED_DETECTED` sometimes (or often) does not fire, because the available deterministic evidence genuinely does not establish a need under current rules. No engineering change is made merely to force `NEED_DETECTED` to be reachable more often.

- **Architectural impact:** None — this is the status quo. Confirms the current `applySystemServiceProfileDefaults()` + `suggestOffers()` behavior as intentional and acceptable as-is.
- **Ranking impact:** None — `UNKNOWN`/no-offer opportunities continue to rank as they currently do.
- **Qualification impact:** `NOT_QUALIFIED` (or no Opportunity at all, depending on upstream gating) remains a legitimate, frequent outcome for NEW searches; this is treated as correct product behavior, not a gap.
- **Next-action impact:** `HOLD` remains the correct, frequent recommendation for such opportunities; no change.
- **Impact on old integration tests:** All of K4's §3.1-cascade failures remain legitimate failures of **stale test expectations**, not product gaps — they would be closed by rewriting the tests to accept/assert the current (correct) behavior, not by producing a detected need.
- **Would implementation require a new PO decision?** No new engineering-authorizing decision is required; only test-authoring guidance (how to write a NEW-search fixture that correctly exercises the "no need detected" path, separately from a fixture that exercises detected-need via sufficiently strong evidence under existing rules).
- **Risks:** If real freelancers frequently see `NEED_DETECTED=false` for genuinely needy prospects because the catalogue vocabulary is narrow, this risks under-delivering value on the core product promise, independent of what any test expects. This is a product-quality risk to monitor, not a correctness defect.

### Option C — YES, but only from stronger approved evidence

**Product behavior:** `NEED_DETECTED` should fire only when evidence meets a higher, independently-defined bar for establishing a need/opportunity — not merely because a system catalogue keyword happens to appear as a substring in signal text. This explicitly preserves the existing R-71 semantics (topical fields like `companySummary` remain excluded; a keyword appearing is necessary but should not be treated as sufficient on its own).

- **Architectural impact:** Requires defining what "stronger approved evidence" means beyond today's trigger-kind + keyword-substring AND-gate — e.g., signal confidence thresholds, multi-signal corroboration, or a new evidence-sufficiency criterion layered on top of `suggestOffers()`. This is a larger design surface than Option A.
- **Ranking impact:** Likely reduces the number of detected offers relative to both A and today's baseline (since the bar is higher than simple keyword match), which may shift more opportunities toward `UNKNOWN`/lower ranking tiers.
- **Qualification impact:** Fewer opportunities reach `NEED_DETECTED=true`, so `QUALIFIED` would become rarer under this option than under A, though more precisely justified when it does fire.
- **Next-action impact:** More opportunities would correctly receive `HOLD` or a different recommendation reflecting genuinely insufficient evidence, rather than a keyword-coincidence-driven `CONSIDER_OFFER`.
- **Impact on old integration tests:** Old fixtures relying on simple keyword presence would still fail under this option (likely more of them than under A), since the bar is explicitly higher than substring matching; tests would need to be rewritten to supply evidence meeting whatever the new sufficiency criterion turns out to be.
- **Would implementation require a new PO decision?** Yes — this option explicitly requires a follow-up decision defining the new evidence-sufficiency bar, separate from this document.
- **Risks:** Lower false-positive rate (good) but higher false-negative rate risk if the bar is set too high — genuinely needy prospects could be missed. Also carries the most engineering-design uncertainty of the three lettered options, since "stronger approved evidence" is not yet specified.

### Option D — Other

Reserved for a PO-defined alternative not captured by A/B/C (e.g., a hybrid: system catalogue is sufficient for some services/dimensions but not others; or a confidence-weighted blend).

**Note:** None of A/B/C/D above changes or recommends changing R-71 (the `companySummary`/topical-field exclusion). That finding (§5.2 below) is a separate, independently pre-existing issue and is explicitly carried as unchanged background in every option above.

---

## 4. PO Decision 2 — What Should Happen to Existing PCG-4 / Category-Plausibility Test Coverage?

**Current implementation:** NEW Service+Geography-only searches do not accept a caller-supplied `targetCustomer` (it is forced to a sentinel value). As a direct, documented, and already-authorized consequence (`CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_BACKEND_DEFAULTS_PO_DECISION.md`, decision D2), this disables, for NEW searches: the target-customer Discovery clause, category-plausibility determination-writing, and TCM determination-writing. This decision does not revisit D2 — it asks only what should happen to the test suites that were written against the pre-D2 behavior and now cannot construct the inputs D2 made unreachable.

### Option A — Retire/update those tests for NEW searches

**Exact behavior:** `search-worker.integration.test.ts`'s PCG-4/TCM-wiring test and both `category-plausibility-source-capture/-review.integration.test.ts` files are retired or rewritten to stop asserting TCM/category-plausibility production for a NEW-search-style fixture, since that is no longer achievable or expected behavior for that search type. Historical-search behavior is not touched by this option.

- **Pros:** Simplest to execute; keeps the test suite's assertions aligned with what the current public API can actually produce; removes tests that exercise an input combination (NEW search + real `targetCustomer`) no longer reachable via any production caller.
- **Cons:** Loses direct integration-test coverage of the TCM/category-plausibility write paths and the historical-search behavior those paths exist to serve, unless replaced by some other coverage mechanism (e.g., unit tests against the repository/service layer directly, bypassing `createServiceProfile`).
- **Architectural impact:** None — no production code changes; this option is purely about test-suite scope.
- **Test impact:** Three files' worth of tests are removed or substantially rewritten; some coverage of `categoryPlausibilityPgRepository`/TCM-save logic may need to move to a lower-level (unit or direct-repository) test if continued coverage is desired.
- **Product risk:** If the historical-search TCM/category-plausibility code path ever regresses silently (no integration test watching it), that regression could go undetected until it affects a real historical search. Risk is proportional to how much historical-search traffic is expected to continue flowing through that path.

### Option B — Preserve the tests through a test-only/back-door construction path

**Exact behavior:** Production callers remain unable to supply `targetCustomer` for NEW searches (D2 stands, unchanged, for every real caller). Test infrastructure only is given a way to construct a historical-style `ServiceProfile`/`Search` (e.g., a test-support helper that writes `Search.parameters.targetCustomer` directly, bypassing `createServiceProfile()`'s defaulting), so PCG-4/category-plausibility integration coverage can continue to exercise the real write paths. No production API surface is added or changed.

- **Pros:** Preserves real, end-to-end integration coverage of the TCM/category-plausibility write paths without reopening the production API; keeps the tests honest about exercising actual repository/service code rather than mocks.
- **Cons:** Introduces and must maintain a test-only construction path that does not mirror any real caller — if that path drifts from how a genuine historical search is actually shaped in the database, the tests could pass while silently not representing real historical data. Adds a small amount of ongoing test-infrastructure surface area to maintain.
- **Architectural impact:** None to production code paths; confined to `tests/integration/support/` or equivalent test-only helper code.
- **Test impact:** Requires building and documenting a new test-support helper (not yet authorized here); the three existing test files are kept with minimal changes (swap their `createServiceProfile()` call for the new helper for the parts of setup that need a real `targetCustomer`).
- **Product risk:** Low to production risk (no API surface change); moderate test-fidelity risk if the back-door construction path is not kept faithful to genuine historical-search shape over time.

### Option C — Keep both modes explicitly

**Exact behavior:** The system formally recognizes two explicit search modes going forward: (1) **NEW searches** — Service + Geography only, `targetCustomer` disabled, no category plausibility, no TCM, exactly as D2 already specifies; and (2) a **historical/legacy test mode** — `targetCustomer` can be constructed (by test infrastructure, as in Option B, or by some other documented mechanism), and category plausibility/TCM remain testable under that mode. This differs from Option B primarily in that the two-mode distinction is explicitly documented as a durable, named architectural concept (not just an ad-hoc test helper), potentially informing how historical searches are represented/queried elsewhere in the system too.

- **Pros:** Gives the two-mode distinction a durable, explicit name and place in the architecture rather than leaving it implicit in test-support code; could also serve as the basis for any future production-facing need to distinguish historical vs. NEW search records (e.g., reporting, migration tooling, analytics).
- **Cons:** Larger scope than strictly necessary to fix the immediate test-coverage gap; risks scope creep if "formalize the two-mode distinction" expands beyond what the PO actually intended to decide here.
- **Architectural impact:** Potentially broader than A/B — depends on how far "explicitly" is taken (test-only concept vs. a documented concept referenced elsewhere in the codebase/docs).
- **Test impact:** Similar to Option B at minimum, with the addition of explicit documentation of the two-mode concept (e.g., a short architecture note alongside the existing PO decision docs).
- **Product risk:** Low, provided the formalization stays test/documentation-scoped and does not itself imply any change to what real callers can do (which would re-open D2 — explicitly out of scope here).

### Option D — Other

Reserved for a PO-defined alternative (e.g., coverage is accepted as permanently lost for NEW-search-mode TCM/category-plausibility, with no replacement mechanism, on the grounds that D2 makes the feature itself dormant for NEW searches until/unless a future decision reactivates it).

**Note:** None of A/B/C/D above proposes restoring `targetCustomer` to the freelancer-facing UI, and none proposes weakening or revisiting D2 for real production callers. All four options hold D2 fixed and differ only in how (or whether) historical-style behavior remains testable.

---

## 5. Independent Engineering/Test Corrections (Not PO Decisions)

These two findings do not require a PO decision — they are documented here for completeness and for future authorization, but **nothing in this section is implemented by this document**.

### 5.1 `client-finder-web.integration.test.ts` — Phase 5 admission-gate fixture gap

K4 found this test's `workerDeps` fixture omits the `sourceDocuments` and `signalCatalogue` dependencies that the (separately, already-approved) Phase 5 AI-escalation pre-admission gate requires. Without them, every discovered candidate's deterministic-signal set is empty, admission's strong-signal-bypass and threshold checks both fail, and the candidate is never admitted — so `researchProspectForOwner`/`runResearch` (the only code path that persists `ResearchSignal` rows from the fake `ResearchProvider`) is never invoked, and the test's `signals.length > 0` assertion fails.

This is a pure test-fixture gap, not a product-behavior question: production's real entrypoint (`apps/worker/src/index.ts`) already wires both dependencies correctly, and the admission gate's behavior when they're absent is explicitly documented in its own source comments as intentional degradation, not a bug. Closing this gap is authorized to be addressed separately as a straightforward engineering/test correction (supply the missing deps, or construct a candidate whose signals satisfy the strong-signal bypass) — **not implemented here.**

### 5.2 `personalization.integration.test.ts` — pre-existing `companySummary`/R-71 mismatch

**Why this is pre-existing:** K4's git-history check showed `packages/core-opportunity/src/adapters.ts` (which defines `TOPICAL_FIELDS`, the set `{'companySummary','businessModel','targetCustomers'}` that R-71 excludes from offer-matching) has **zero diff** against the last commit (`b3f1827`), and this specific test file's `matchingResearch()`/`unmatchedResearch()` fixtures — which place their only evidentiary signal in `companySummary` — are **also unchanged** in that diff. In other words, this fixture has been incompatible with the committed R-71 rule since before any of today's uncommitted Service+Geography-only or Phase-5 work began. It is the one failure in K4's entire failure set that is genuinely pre-existing in the strict sense (present and identically broken even at the last commit), as opposed to a product of new uncommitted WIP.

**Why this is not a Global Entity regression:** R-71 and `TOPICAL_FIELDS` live entirely in `@acos/core-opportunity`'s offer-signal adaptation logic (`adapters.ts`), which has no dependency on, and makes no call into, any Entity-layer component (`entityRepository.ts`, identity resolution, DiscoveryEvent, cache, field classification, or Q5-A/B/C). K4's Entity safety check confirmed all of those components pass independently and show zero code diff from the last commit; this finding sits in a completely separate part of the codebase.

**Whether the test should be updated or its fixture evidence moved to an approved (non-topical) field:** this is exactly the kind of fixture-maintenance question that does not require a PO decision — R-71 itself is not in question (this document explicitly does not recommend changing it), only this one test fixture's choice of which field to place its evidence in. Moving the evidentiary signal from `companySummary` to a non-topical field such as `visibleProblems` (while keeping the test's intent — proving personalization requires a QUALIFIED opportunity — otherwise unchanged) is the straightforward correction; it is **not implemented here** and remains available for a future, separately-scoped engineering pass (which, per K4, would also need to account for PO Decision 1's resolution, since this fixture is additionally affected by the keyword-override mechanism independent of the `companySummary` issue).

---

## 6. Historical Safety

Nothing in K4 or this document touches, migrates, backfills, or otherwise modifies:

- **Historical ServiceProfiles** — untouched; `applySystemServiceProfileDefaults()` only applies to the `createServiceProfile()` call path for NEW searches going forward.
- **Historical Searches** — untouched; no historical `Search.parameters` row is read, rewritten, or reinterpreted by anything in K4 or this document.
- **Historical `targetCustomer` snapshots** — untouched; any `targetCustomer` value already persisted on an existing historical Search row is unaffected by the NEW-search sentinel-defaulting behavior, which only governs what gets written for newly created searches.
- **Historical category-plausibility behavior** — untouched; `isCategoryPlausibilityApplicableForProspectId`'s `targetSegments.length > 0` gate continues to evaluate true for any historical search whose persisted `targetCustomer` is a real (non-sentinel) value, exactly as before.

**No migration or backfill is authorized by K4 or by this document.** Any future work touching historical data would require its own, separate, explicit authorization.

---

## 7. Impact Matrix

| Decision / Option | Production code change | Test change | New PO decision needed | Historical data affected |
|---|---|---|---|---|
| Decision 1 — Option A | Yes (catalogue content/matching) | Yes (fixture rewrite to realistic evidence) | Yes (catalogue content strategy) | No |
| Decision 1 — Option B | None | Yes (rewrite tests to accept current behavior) | No | No |
| Decision 1 — Option C | Yes (new evidence-sufficiency criterion) | Yes (fixture rewrite to new bar) | Yes (define the new bar) | No |
| Decision 1 — Option D | Depends on PO specification | Depends | Likely yes | No |
| Decision 2 — Option A | None | Yes (retire/rewrite 3 files) | No | No |
| Decision 2 — Option B | None | Yes (new test-support helper + 3 files updated) | No | No |
| Decision 2 — Option C | None (unless scope expands) | Yes (as B, plus documentation) | Possibly, if scope expands beyond test/doc | No |
| Decision 2 — Option D | None | Depends on PO specification | Depends | No |
| §5.1 client-finder-web fix | None (test-only) | Yes (1 file) | No | No |
| §5.2 personalization fix | None (test-only) | Yes (1 file) | No | No |

---

## 8. Questions Requiring Explicit PO Selection

1. **Decision 1:** Which of Option A / B / C / D should govern `NEED_DETECTED` reachability for NEW Service+Geography-only searches?
2. **Decision 2:** Which of Option A / B / C / D should govern the future of PCG-4/TCM/category-plausibility test coverage, given that NEW searches cannot supply `targetCustomer`?

No other question in this document requires PO selection — §5's two items are engineering/test corrections available for separate authorization whenever the PO or engineering lead chooses, independent of how Decisions 1 and 2 resolve (though §5.2's fix is partly dependent on Decision 1's outcome, as noted).

---

## 9. No Implementation Authorized

This document selects no option, recommends no option, and changes nothing. Specifically, it does **not**:

- change or weaken the Service+Geography-only PO decision,
- restore `targetCustomer` to the freelancer-facing UI,
- change or recommend changing the R-71 topical-field exclusion,
- modify any production source file, test file, migration, or schema,
- modify any existing governance/PO decision record,
- authorize any migration or backfill of historical data,
- commit or push anything.

### Final Scope Check

```
git status        — unchanged from before this document was written; only this new document added
git diff --stat   — no production source, test, migration, or schema file changed
git diff          — empty for all tracked files
```

Confirmed: no source code modified, no tests modified, no migrations modified, no database changes, no existing governance decision modified, no commit, no push. The only new artifact produced is this document.

**STOP. Awaiting explicit PO selection on Decision 1 and Decision 2.**
