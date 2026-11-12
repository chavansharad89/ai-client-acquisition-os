# PHASE K7 — Personalization Test Semantics Audit

Read-only. No production code, test code, migrations, schema, or governance
documents were modified in the course of this audit. See §10/§11 for the
scope confirmation.

## 1. Executive Summary

The four failing tests in `tests/integration/personalization.integration.test.ts`
are not testing NEW-search need-detection semantics at all. All four use
`matchingResearch()`/`sampleProfileInput()` purely as a precondition to reach
a `QUALIFIED` Opportunity, so they can then exercise personalization-layer
behavior (generate/persist/read-back, idempotency, the evidence-superseded
case, the "moved away from QUALIFIED" case). None of the four assert
anything about `isHistoricalStyleSearch`, `hasCredibleNeedEvidence`, or
NEW-vs-historical search construction.

The fixture's own existing comments (`tests/integration/personalization.integration.test.ts:101-104`,
quoted in §3) already assume a real, segment-bearing `targetCustomer`
(`'Restaurants'`) that drives a genuine category-plausibility `MATCH`. That
assumption predates `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002`,
which changed `createServiceProfile()`'s public contract
(`packages/core-service-profile/src/service.ts:22-37`) so that **no normal
caller can supply a real `targetCustomer`/`triggers`/`keywords`/
`minProjectValuePaise`/`rationale` any more** — `applySystemServiceProfileDefaults()`
overwrites all five, unconditionally, before validation ever sees them
(`packages/core-service-profile/src/systemDefaults.ts:1-47`). The fixture's
`sampleProfileInput()` still *passes* those five fields, but production code
now silently discards them. That is why `search.parameters.targetCustomer`
is the sentinel `';'` at runtime (confirmed empirically in K6), not
`'Restaurants'` as the fixture's own comments assume.

This is exactly the situation `K5-D2` (`CF-PCG4-CATEGORY-PLAUSIBILITY-TEST-COVERAGE-PO-DEC-001`)
already solved for three other integration suites — see §8. Those suites
hit the identical problem (needing a real `targetCustomer` to exercise a
code path gated on `parseTargetSegments(...).length > 0`) and resolved it
with a dedicated, test-only construction helper
(`tests/integration/support/historicalServiceProfile.ts`) rather than by
feeding the NEW-search gate artificial evidence.

**Classification for all four failing tests: H — Historical.** None of them
logically test NEW-search need-detection semantics; all four were written
against (and still, in their own comments, assume) historical-style search
construction. See §2 for the per-test table and §9 for the three-way
resolution split.

## 2. Four Failing Tests

| Test | Intended Scenario | H/N/M/U | Evidence |
|---|---|---|---|
| `R-45: generate -> persist -> read back for a QUALIFIED Opportunity` (`:265`) | Proves the personalization generate→persist→read-back round-trip (evidence, offer, opening context, value proposition) for a `QUALIFIED` Opportunity. `QUALIFIED` is a precondition, not what's under test. | **H** | Fixture comment at `:101-104` explicitly ties the `categoryPlausibility` fixture's `MATCH` fit to `sampleProfileInput()`'s `targetCustomer` ('Restaurants') parsing to "exactly one segment (Path 2, D2)" — a historical-search-only code path (§6). The test never reads `isHistoricalStyleSearch`/`hasCredibleNeedEvidence`-related state. |
| `R-42: INSUFFICIENT_EVIDENCE produces no Personalization` (`:321`) | Proves that once the only evidentiary signal is superseded by a later Research run, Qualification flips to `INSUFFICIENT_EVIDENCE` and personalization is not generated (R-42 gate). | **H** | Same fixture, same precondition pattern: needs an initial `QUALIFIED`-reachable state at `:327` before the superseding run at `:330`. The behavior under test (evidence supersession → `INSUFFICIENT_EVIDENCE`) is orthogonal to NEW vs. historical search construction. |
| `R-49/R-50: idempotency — repeated evaluation of unchanged inputs overwrites the same row, no duplicates` (`:369`) | Proves `evaluateOpportunityPersonalization` is idempotent: two calls with unchanged inputs produce the same row, no duplicate insert. | **H** | Needs `QUALIFIED` purely as setup (`:375`) so personalization can be generated twice. No assertion anywhere in this test concerns need-detection semantics. |
| `a Qualification that later moves away from QUALIFIED leaves the existing Personalization row untouched` (`:401`) | Proves R-49/R-52: an existing Personalization row survives a later Qualification state change away from `QUALIFIED`. | **H** | Same precondition pattern: `QUALIFIED` first (`:406-409`), then superseded evidence (`:411-413`). The "moves away from QUALIFIED" transition is the thing under test, not how `QUALIFIED` was first reached. |

For all four, the required business assumptions traced from the fixture
(§3) are: a real `targetCustomer` (`'Restaurants'`), custom `triggers`
(`['WEBSITE']`) and `keywords` (`['redesign']`), a single `OBSERVED`
ResearchSignal, Need/Opportunity detected from that one signal matching the
profile's own custom rule, and Qualification reaching `QUALIFIED` on that
basis alone — i.e., exactly the pre-K5-D1/pre-Service+Geography-only
behavior model, not the NEW-search model.

## 3. Search Construction Trace

```
test (createProspect() helper, tests/integration/personalization.integration.test.ts:228-239)
→ createServiceProfile(d, token, sampleProfileInput())                [:233]
    sampleProfileInput() [:213-226] supplies:
      service: 'Web & Software Development'
      targetCustomer: 'Restaurants'
      geography: 'Mumbai'
      minProjectValuePaise: 15_000_000
      triggers: ['WEBSITE']
      keywords: ['redesign']
      rationale: 'They need a website refresh ({signal}).'
→ core-service-profile/src/service.ts:22-37 createServiceProfile()
    validateServiceProfileInput(applySystemServiceProfileDefaults(input))
    — applySystemServiceProfileDefaults() OVERWRITES, unconditionally,
      BEFORE validation ever runs (comment at service.ts:29-34):
        targetCustomer      -> SYSTEM_DEFAULT_TARGET_CUSTOMER = ';'   (systemDefaults.ts:47)
        triggers            -> SYSTEM_DEFAULT_TRIGGERS = ['WEBSITE','NEWS','TECH_STACK'] (systemDefaults.ts:33)
        keywords            -> catalogue-derived list for the chosen service
        minProjectValuePaise -> SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE = 0 (systemDefaults.ts:57)
        rationale           -> fixed D4 rationale template
    — fields.service + fields.geography are the ONLY two values from the
      caller's input that survive (createServiceProfile()'s own parameter
      type, NewSearchServiceProfileInput, structurally has no other
      caller-suppliable field — service.ts:25,29-34).
→ createSearch(d, token, { serviceProfileId: profile.id })  [:234]
    @acos/core-search's createSearch() snapshots the STORED profile's
    fields (already system-defaulted) into Search.parameters — unchanged,
    not touched by any of this (historicalServiceProfile.ts:26-29 confirms
    this snapshot step requires no change either way).
→ transitionSearch(..., { status: 'RUNNING' })  [:235]
→ runDiscovery(...)  [:237]
→ runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId })
    matchingResearch() [:90-123] supplies companySummary/websiteIssues/etc.
    observations AND a categoryPlausibility segment verdict — but
    core-research/src/service.ts:225/252 only WRITES a category-
    plausibility/target-customer-match determination when
    parseTargetSegments(search.parameters.targetCustomer).length > 0.
    Since targetCustomer is now ';' (sentinel), that length is 0, so
    NEITHER determination is ever persisted, regardless of what the
    fixture's categoryPlausibility field says.
→ createOpportunity(...)  [per test, e.g. :270]
    core-opportunity/src/service.ts:159: isHistoricalStyleSearch =
      parseTargetSegments(search.parameters.targetCustomer).length > 0
      = parseTargetSegments(';').length > 0 = false
    -> needDetected requires hasCredibleNeedEvidence() (K5-D1): >=2
       distinct admissible fields, >=1 OBSERVED at full confidence.
       matchingResearch() supplies evidence in only ONE field ->
       hasCredibleNeedEvidence() = false -> needDetected = false, while
       suggestOffers() still returns a match (offer populated) ->
       opportunities_need_offer_consistency CHECK violated (K6 finding).
→ evaluateQualificationForOwner(...)
    (would short-circuit to NOT_QUALIFIED on NEED_DETECTED alone, if the
    INSERT above didn't already throw first)
→ evaluateOpportunityPersonalization(...)
    never reached — blocked upstream.
```

**Where `targetCustomer = ';'` comes from:** `packages/core-service-profile/src/systemDefaults.ts:47`,
applied unconditionally inside `createServiceProfile()`
(`packages/core-service-profile/src/service.ts:33-35`). This is **not**
accidental test-fixture behavior and **not** a bug — it is the documented,
deliberate `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002` redesign:
"input's type carries only service+geography, so there is no
caller-suppliable value for the other five fields to read here at all"
(`service.ts:31-32`). It is an **old fixture assumption invalidated by the
Service+Geography redesign** — `sampleProfileInput()` was written when
`createServiceProfile()` still honored a caller-supplied `targetCustomer`/
`triggers`/`keywords`/`rationale`, and nothing in this test file was updated
when that stopped being true.

## 4. K5-D1 Interaction

K5-D1 (`CF-NEED-OPPORTUNITY-SUFFICIENCY-PO-DEC-001`, Option C) is not in
question and is not the defect. It correctly does exactly what it was
designed to do: for a search it can identify as NEW/system-defaulted
(`isHistoricalStyleSearch === false`), it refuses to let a bare
keyword/trigger match alone establish `needDetected`, requiring
`hasCredibleNeedEvidence()`'s stronger two-distinct-field-plus-OBSERVED
bar instead (`packages/core-opportunity/src/adapters.ts:240-258`).

The four failing tests trip this gate not because they are testing NEW-search
sufficiency, but because they were never NEW-style scenarios to begin with —
they inherited NEW-style construction only as an unintended side effect of
`createServiceProfile()`'s contract change (§3), while their own fixture
comments and narrative (a single, specific "needs a website redesign" fact,
tied to a specific target-customer segment match) still read as a
historical-style scenario.

## 5. K5-D2 Historical Helper Applicability

`tests/integration/support/historicalServiceProfile.ts` (`createHistoricalServiceProfile`)
bypasses only `applySystemServiceProfileDefaults()` — it still goes through
the same repository `.create()` call `createServiceProfile()` itself uses
internally (`historicalServiceProfile.ts:21-23`), and `createSearch()` needs
no change either way, since it already snapshots whatever the stored
profile's fields are. It adds no new production API.

Per-test answer — would constructing this test's ServiceProfile through the
K5-D2 historical helper accurately represent the behavior each test is
trying to verify?

| Test | Answer | Evidence |
|---|---|---|
| `R-45` (`:265`) | **YES** | The test's own fixture comment (`:101-104`) already assumes a real `targetCustomer` driving a `categoryPlausibility` `MATCH`. The historical helper is precisely what restores that assumption's validity; nothing about the R-45 assertions (`:282-297`, evidence/offer/opening-context/value-proposition round-trip) depends on NEW-search semantics. |
| `R-42: INSUFFICIENT_EVIDENCE` (`:321`) | **YES** | Needs the same `QUALIFIED` precondition as R-45, reached the same way (`:325-327`), before the test's actual subject (evidence supersession, `:330-332`) begins. |
| `R-49/R-50` (`:369`) | **YES** | Needs `QUALIFIED` purely as setup (`:373-375`) for the idempotency assertions (`:377-398`), which concern the Personalization repository's upsert behavior, not need-detection. |
| "moves away from QUALIFIED" (`:401`) | **YES** | Needs `QUALIFIED` first (`:405-409`) purely to have a Personalization row to later verify untouched; the transition under test (`:411-416`) is Qualification-state-change handling, not need detection. |

No test in this group has any assertion that depends on, or would be
weakened by, constructing its ServiceProfile through the historical path
instead of the NEW-search path.

## 6. Two-Signal Evidence Analysis

For completeness, per Step 4: could the business scenario each test
describes naturally contain two independent R-71-approved evidence fields?

`matchingResearch()` (`:90-123`) tells a single, specific story: a prospect
whose homepage evidence says "needs a website redesign," matched against a
freelancer who sells website redesigns. There is no second, independent
fact anywhere in the fixture's narrative — no second observed problem, no
unrelated opportunity, nothing in `growthOpportunities`/`aiOpportunities`/
`contentOpportunities`/`automationOpportunities` that the scenario's own
story would plausibly contain. Inventing one (e.g., fabricating a second,
unrelated `websiteIssues`/`contentOpportunities` claim purely so
`hasCredibleNeedEvidence()`'s two-distinct-field count is satisfied) would
be adding evidence the scenario does not actually have, to satisfy a gate
the test was never trying to exercise in the first place.

**Conclusion: adding a second signal solely to satisfy the K5-D1 gate would
be artificial**, for all four tests. This reinforces §5's conclusion rather
than offering an alternative to it — the two paths are not equally valid;
only the historical-construction path preserves the fixture's existing,
intended narrative without fabrication.

## 7. Historical/New Boundary Analysis

`parseTargetSegments(...).length > 0` (`packages/core-research/src/categoryPlausibility.ts:38`)
is used at exactly three production call sites, and documentation at each
site states this is one shared, authoritative boundary, not three
independent decisions:

1. **`packages/core-opportunity/src/service.ts:159`** — `isHistoricalStyleSearch`,
   gating whether `needDetected` can be established by `top !== undefined`
   alone (historical) or must also pass `hasCredibleNeedEvidence()` (NEW).
   This is the only call site in the codebase that binds the name
   `isHistoricalStyleSearch`; it is read exactly once, immediately after
   being computed (`:162`).
2. **`packages/core-research/src/service.ts:171`**, consumed at `:225` and
   `:252` — gates whether the category-plausibility and target-customer-match
   write blocks run and persist a determination at all for a given Search +
   Prospect. Comment at `:214-224`: a NEW search's sentinel `targetCustomer`
   "always resolves to zero segments — so this block ... is skipped for NEW
   searches without disabling the capability for historical/old-style
   searches."
3. **`packages/core-research/src/categoryPlausibilityPgRepository.ts:194`**
   (`isCategoryPlausibilityApplicableForProspectId`) — read-side query
   Qualification uses to distinguish "N/A, this is a NEW system-defaulted
   search" from "UNKNOWN, genuinely pending" when no determination exists.

No other production caller exists anywhere under `packages/*/src`
(repo-wide grep confirmed). **Changing `isHistoricalStyleSearch` or the
shared `parseTargetSegments(...).length > 0` boundary would alter
production semantics for every real NEW search and every real historical
search in the system** — it is the single authoritative distinction the
whole Service+Geography-only redesign is built on, not a locally-scoped
test concern. This audit does not recommend touching it, and flags it as
explicitly out of scope per the K7 brief's own Step 5/Step 6 instructions.

## 8. Comparison With Other Integration Tests

Three other suites already solved the identical problem the same way —
confirming this is an established, repeatable pattern, not a one-off:

- **`tests/integration/category-plausibility-source-capture.integration.test.ts`**:
  imports and uses `createHistoricalServiceProfile` (`:31`, called at `:135`
  inside the shared `researchedDetermination()` helper) for **all 4 of 4**
  tests. Zero tests in this file use plain `createServiceProfile`. Stated
  reason (`:129-134`, verbatim): *"K5-D2: this suite needs a real,
  non-sentinel targetCustomer so category-plausibility
  determination-writing (gated on
  parseTargetSegments(targetCustomer).length > 0) actually runs —
  createServiceProfile() can no longer supply one for a NEW search, so this
  historical-style construction is used instead."*
- **`tests/integration/category-plausibility-source-review.integration.test.ts`**:
  identical pattern — imports at `:32`, called at `:181`, used by **all 6 of
  6** tests, identical stated reason verbatim at `:175-180`.
- **`tests/integration/search-worker.integration.test.ts`** (PCG-4/TCM
  wiring): deliberately **mixed** — 13 of 14 tests use plain
  `createPendingSearch()` (NEW-style, `:106`) because those tests are
  genuinely testing NEW-search behavior; exactly **1** test (`:612-615`,
  the PCG-4/target-customer-match production-wiring test) uses
  `createHistoricalPendingSearch()` because *that one test* specifically
  needs `parseTargetSegments(...).length > 0` to be true to exercise the
  real write path. Stated reason (`:110-117`, verbatim): *"a historical-style
  PENDING Search for the PCG-4/TCM-wiring test only ... Every other test in
  this file keeps using createPendingSearch() (a NEW-style search)
  unchanged."*

This last file is the most instructive comparison: it shows the historical
helper is not an all-or-nothing suite-wide switch — it is applied
**per-test, based on what that specific test needs to prove**. The
personalization suite's four failing tests all independently need the same
thing (a `QUALIFIED` Opportunity reachable without NEW-search
corroboration), which is exactly the targeted, per-test use the
search-worker suite already demonstrates as the established convention.

## 9. Recommended Resolution

Classification (§2): **H — Historical**, for all four failing tests,
uniformly.

Per the K7 brief's own instruction, this audit does not choose or
implement a resolution. For completeness, the three possible paths are
separated below so a future, explicitly-scoped phase can pick one without
re-doing this analysis:

- **Test-only resolution (no PO decision needed):** Switch the four failing
  tests' `createProspect()`-driven setup to use `createHistoricalServiceProfile`
  instead of plain `createServiceProfile`, mirroring exactly the pattern
  already established in `category-plausibility-source-capture`/`-review`
  and `search-worker`'s PCG-4 test (§8). This requires no production code
  change, no K5-D1 change, no new PO decision — it only changes which
  already-existing, already-authorized test helper four tests call. This is
  the path §5/§6/§8's evidence converges on.
- **Engineering-only resolution:** None identified. There is no production
  defect here — `createServiceProfile()`'s contract change and K5-D1's
  2-signal requirement are both working exactly as designed and documented.
- **Product Owner decision required:** None identified for these four
  tests specifically. (A PO decision would only be needed if someone wanted
  these four tests to *validate NEW-search behavior instead* — but nothing
  in their current assertions asks for that, so there is no open question
  for a PO to resolve here.)

## 10. Final Status

**READY FOR TEST-ONLY FIX.**

The semantic classification (H, uniformly, for all four) clearly determines
the resolution path: switch these four tests' ServiceProfile construction
to the existing `createHistoricalServiceProfile` helper, the same
test-only, already-precedented mechanism three other suites already use for
the identical reason. No new product decision is required; no production
code changes; K5-D1, R-71, Global Entity, and the Service+Geography-only
redesign all remain exactly as they are.

## 11. Scope Check

- Production files modified: **none**.
- Test files modified: **none**.
- Migrations: **none**.
- Schema: **none**.
- Database changes: **none**.
- Governance decisions modified: **none**.
- Commits: **none**.
- Pushes: **none**.
- Only new artifact created by this audit: this document
  (`requirement/CLIENT_FINDER_PHASE_K7_PERSONALIZATION_TEST_SEMANTICS_AUDIT.md`).

STOP. No further phase begun.
