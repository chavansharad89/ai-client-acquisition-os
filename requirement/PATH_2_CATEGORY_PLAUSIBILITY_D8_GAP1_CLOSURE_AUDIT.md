# Path 2 — D8 GAP 1 (Provider Pass-Through) Closure Audit

```text
DOCUMENT TYPE: READ-ONLY POST-TEST CONFORMANCE AND REGRESSION AUDIT
STATUS: AUDIT ONLY — NO PRODUCTION CODE, TEST, MIGRATION, SCHEMA, PRD,
        CONFIGURATION, PROVIDER, WORKER, UI, OR GOVERNANCE DOCUMENT WAS
        MODIFIED BY THIS TASK. THIS DOCUMENT IS THE ONLY FILE CREATED.
```

---

## 1. Audit Scope

Determine whether the test-only additions made by the preceding (authorized)
task close **GAP 1 — Provider pass-through**, as defined in
`PATH_2_CATEGORY_PLAUSIBILITY_D8_TEST_COVERAGE_GAP_AUDIT.md` §5/§9
(classified RECOMMENDED), while preserving D0–D11, the D8 Product Decision,
the D8 Widening Product Decision, and all existing architectural boundaries.

Out of scope: re-deciding any D0–D11 decision; authorizing or performing any
implementation; fixing any discrepancy; re-litigating GAP 2 (prompt
rendering), which was closed by the earlier `research.test.ts` additions and
is examined here only for its relationship to GAP 1 (§8).

## 2. Baseline State

Recorded at task start, before any file was read for analysis:

```text
Branch:                     phase-17-r34-worker-orchestration
HEAD:                       5992b82b9adff492c480442d68a954f2a03bfb28
Expected HEAD:              5992b82b9adff492c480442d68a954f2a03bfb28   MATCH
git diff --cached --stat:   (empty — nothing staged)
git diff --stat:            48 files changed, 1260 insertions(+), 59 deletions(-)
git status --short:         97 entries
git diff --check:           clean (exit 0)
```

### 2.1 Reconciliation against the last documented baseline

Every prior Path 2 governance document, up to and including the D8 Test
Coverage Gap Audit, records `47 files changed, 1119 insertions(+), 59
deletions(-)` and (at the Gap Audit's end) 96 status entries. The delta to
the current state is fully accounted for by exactly three test files:

| File | Numstat now | Of which pre-existing (in the 1119 baseline) | Of which added after the Gap Audit | Attributed to |
|---|---|---|---|---|
| `packages/core-research/src/research.test.ts` | +59 / −0 | +1 (`targetSegments: []` fixture line 112) | **+58** | Earlier GAP 2 task (prompt-rendering tests) |
| `packages/core-research/src/anthropicResearchProvider.test.ts` | +34 / −0 | +1 (`categoryPlausibility: []` in `sampleLeadResearch()`) | **+33** | Preceding GAP 1 task |
| `packages/core-research/src/fallbackResearchProvider.test.ts` | +50 / −0 | 0 (file was clean vs. HEAD before) | **+50** | Preceding GAP 1 task |

```text
1119 + 58 + 33 + 50 = 1260 insertions        MATCH
47 + 1 (fallbackResearchProvider.test.ts newly dirty) = 48 files   MATCH
96 + 1 (same file, new status entry) = 97 status entries           MATCH
deletions: 59 → 59                                                 UNCHANGED
```

Independent corroboration by filesystem modification time: a
`find apps packages tests -newer requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_TEST_COVERAGE_GAP_AUDIT.md`
(excluding `node_modules`/build output) returns **only** these three files.
No production, schema, migration, config, worker, UI, Discovery,
Opportunity, Qualification, or provider production file has been modified
since the Gap Audit.

**Conclusion:** the only changes attributable to the preceding task are the
two authorized test additions (`anthropicResearchProvider.test.ts`,
`fallbackResearchProvider.test.ts`). The earlier `research.test.ts`
prompt-rendering suite (`describe('target customer segments (D2/D8/D9)')`,
4 tests) is intact.

Task-start SHA-256 of the audited test files (used for the §14 check):

```text
eb8e919957fc6f3708d0a554bd7bb180e423286bb24253769dc13adb1154d20b  anthropicResearchProvider.test.ts
c3e2212e5abf0ee54946d30f09c3083c779e8931c2c944886728797fe153a62c  fallbackResearchProvider.test.ts
cb141c5ec26aa4d0d8011a968ce09f85ca8bd67c31195c69bb6ec468d8b90b31  research.test.ts
```

## 3. Governing Decisions

All ten required governance sources exist under `requirement/` with the
exact filenames given in the task — **no filename discrepancy**:

```text
PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md   (IMPLEMENTATION AUTHORIZATION: NOT GRANTED; §9–§13 hard boundaries)
PATH_2_CATEGORY_PLAUSIBILITY_FINAL_IMPLEMENTATION_READINESS_AUDIT.md     (READY EXCEPT FOR EXPLICITLY DEFERRED IMPLEMENTATION DETAILS)
PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_AUTHORIZATION_GATE.md        (READY FOR IMPLEMENTATION AUTHORIZATION)
PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md                      (DECIDED — OPTION B)
PATH_2_CATEGORY_PLAUSIBILITY_D8_WIDENING_PRODUCT_DECISION.md             (D8-DEVIATION: OPTION A — ACCEPT THE WIDENING, as the field exists today)
PATH_2_CATEGORY_PLAUSIBILITY_POST_IMPLEMENTATION_CONFORMANCE_AUDIT.md    (CONFORMING WITH NON-BLOCKING NOTES)
PATH_2_CATEGORY_PLAUSIBILITY_CONFORMANCE_CLOSURE_AUDIT.md                (CONFORMING WITH NON-BLOCKING NOTES)
PATH_2_CATEGORY_PLAUSIBILITY_D8_WIDENING_CONFORMANCE_AUDIT.md            (CONFORMING WITH NON-BLOCKING NOTES; names Gaps 1 & 2)
PATH_2_CATEGORY_PLAUSIBILITY_D8_TEST_COVERAGE_GAP_AUDIT.md               (GAP 1 RECOMMENDED; GAP 2 REQUIRED)
PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md                     (DECIDED; §7 provider-neutrality, §8 regression standard)
```

D0–D11 and the D8 Widening Product Decision are treated as immutable. None
is reopened or reinterpreted here.

## 4. Authorized Change Being Audited

Two additive test cases, no production change:

1. `anthropicResearchProvider.test.ts` — new `it('passes targetSegments
   through to the model, unchanged and in the supplied order (D8
   pass-through — GAP 1)')` inside the existing
   `describe('createAnthropicResearchProvider')`.
2. `fallbackResearchProvider.test.ts` — new
   `describe('createFallbackResearchProvider — D8 pass-through
   (targetSegments)')` with one `it('passes targetSegments through to every
   attempt, unchanged and in order — fallback routing does not alter the
   field (GAP 1)')`.

Diff content verified: both hunks are pure additions (0 deletions in either
file); no existing test, helper, or fixture was altered by the GAP 1 task.

## 5. GAP 1 Before / After Status

| Gap Audit §5.2 / §5.3 criterion | Before (Gap Audit, HEAD `5992b82`) | After (this audit) |
|---|---|---|
| Test calls production `createAnthropicResearchProvider().research()` with non-empty `targetSegments` and asserts on an observable effect | None (0 `targetSegments` refs) | **Present** — asserts values/order in the captured `ResearchModel` request |
| Same for production `createFallbackResearchProvider().research()` | None (0 refs) | **Present** — asserts on every attempt, primary and fallback |
| Regression (a): field dropped in either provider's `ResearchInput` construction | Would escape | **Caught** — `indexOf(segment) !== -1` fails |
| Regression (b): asymmetry between Anthropic and fallback providers | Would escape | **Caught** — both providers independently asserted |
| Regression (c): provider-specific branching/transformation of the field | Would escape | **Caught** for the fallback chain — `new Set(seenMessages).size === 1` across an `anthropic` → `openai` chain |

```text
GAP 1: OPEN (RECOMMENDED)  →  CLOSED
```

## 6. Anthropic Coverage Verification

Production path under test (unchanged, verified by read):
`anthropicResearchProvider.ts:71` — `targetSegments: [...(input.targetSegments ?? [])]`.

| Requirement | Verified | Evidence |
|---|---|---|
| `targetSegments` reaches the model | YES | `vi.fn` `ResearchModel` captures `JSON.stringify(request.messages)`; each of `['Restaurants','Boutique Hotels','Event Venues']` asserted present |
| Values preserved unchanged | YES | Exact segment strings located verbatim in the captured request (no escaping-sensitive characters in the fixture, so a substring match is an exact-value match) |
| Supplied ordering preserved | YES | `positions` asserted equal to its ascending sort — first-occurrence indices strictly follow supplied order |
| Uses existing fake `ResearchModel` harness | YES | Reuses the file's existing `sampleLeadResearch()`, `fakeUsage()`, `fakeSourceDocuments(ONE_DOC)` helpers and the `ResearchModel`/`ModelResult` types, same pattern as the adjacent source-document test |
| No live provider call | YES | Model is an in-process `vi.fn`; no SDK/adapter is constructed; no `*_API_KEY` present in the test environment (count 0) |

## 7. Fallback Coverage Verification

Production path under test (unchanged, verified by read):
`fallbackResearchProvider.ts:93-98` builds `researchInput` once, including
`targetSegments: [...(input.targetSegments ?? [])]` (line 97), then reuses
it for every `deps.attempts` entry (lines 101-120). Fallback eligibility is
still gated purely on `ResearchProviderError`.

| Requirement | Verified | Evidence |
|---|---|---|
| Survives fallback routing | YES | Primary throws `ResearchProviderError('outage', 503, true)`; fallback returns valid research; `research()` resolves |
| Primary **and** fallback attempts receive the field | YES | `expect(primary).toHaveBeenCalled()`, `expect(fallback).toHaveBeenCalledTimes(1)`, `seenMessages.length >= 2`; every captured message asserted to contain all segments |
| Ordering preserved | YES | Same ascending-position assertion, applied per attempt |
| Fallback does not transform or drop the field | YES | Per-attempt presence + order assertions |
| Captured requests equivalent where the architecture expects equivalence | YES | `expect(new Set(seenMessages).size).toBe(1)` — primary retries and the fallback attempt received byte-identical rendered messages, matching the "built exactly once and reused" design (`fallbackResearchProvider.ts:91-92` comment; Scope Lock §9) |
| Uses existing harness / no live call | YES | Reuses the file's `INPUT`, `validResearch()`, `fakeUsage()`, `fakeSourceDocuments()`, `FAST_RETRY`; models are `vi.fn` |

## 8. Prompt-Rendering Coverage Relationship

The two layers are complementary, not duplicative:

| Concern | `research.test.ts` (GAP 2) | Provider tests (GAP 1) |
|---|---|---|
| Entry point | `buildUserMessage(ResearchInput)` directly | `provider.research(ResearchProviderInput)` |
| Exercises `ResearchProviderInput → ResearchInput` construction | No | **Yes** (the only tests that do) |
| Exact header text, `1.`/`2.`/`3.` numbering, verbatim single segment | **Yes** | No — deliberately not re-asserted (in-test comments delegate wording to `research.test.ts`) |
| Empty `targetSegments` → block omitted | **Yes** | No |
| Determinism / provider-independence of rendering | **Yes** (pure function) | Complementary: identical messages across an anthropic→openai fallback chain |
| Values + order survive provider plumbing | No | **Yes** |

The provider tests assert only value presence and relative order, not
formatting, so a future prompt-wording change breaks only `research.test.ts`,
and a pass-through break is detected only by the provider tests. No
assertion is duplicated.

## 9. Provider-Neutrality Verification

```text
grep -nE "ResearchProviderInput|ResearchInput|targetSegments"
     anthropicModel.ts openAIModel.ts geminiModel.ts         → 0 matches (exit 1)
```

- **No leakage** of `ResearchProviderInput`/`ResearchInput` into any vendor
  adapter. Adapters remain behind the provider-neutral `ResearchModel`
  boundary (`{system, messages, signal} → ModelResult`); none of the three
  adapter files, nor `researchModelFactory.ts`, appears in `git diff`.
- **No provider-identity branching** when carrying `targetSegments`: the
  only consumption sites are `anthropicResearchProvider.ts:71` and
  `fallbackResearchProvider.ts:97`, each an identical unconditional
  expression. `fallbackResearchProvider.ts` reads `attempt.provider` nowhere
  in the `ResearchInput` construction; `isFallback` affects only the metering
  `requestKind`.
- **`RESEARCH_FALLBACK_PROVIDER` unchanged**: `packages/config/src/env.ts`
  (line 76, `z.enum(['anthropic','openai','gemini']).optional()`) has zero
  diff; `apps/worker/src/index.ts:98-102` fallback wiring is outside the only
  hunks in that file's pre-existing diff (the two `categoryPlausibility`
  repository lines, part of the audited Path 2 baseline, not the GAP 1 task).
- `ResearchProviderInput.targetSegments?` (`provider.ts:11-30`) remains
  `targetSegments?: readonly string[]` — **optional, additive**, identical to
  the field approved by the D8 Widening Product Decision, with its origin
  (`service.ts` `parseTargetSegments(...)`) and destinations (`ResearchInput`
  → `prompt.ts`, `verifyCategoryPlausibility`) confined to the Research
  orchestration/prompt path. `provider.ts` was not modified after the Gap
  Audit.

## 10. D0–D11 Boundary Verification

Because the change is two additive `*.test.ts` cases in `core-research` and
no non-test file changed after the Gap Audit (§2.1), production impact on
every boundary is zero by construction:

```text
D0  architecture / MVP-enhancement status ........ UNAFFECTED (no production change)
D1  persistence shape (migration 0027) ............ UNAFFECTED (no migration/repository change)
D2  deterministic parsing/splitting ............... UNAFFECTED (categoryPlausibility.ts untouched)
D3  evidence/provenance requirements .............. UNAFFECTED (schema.ts, provenance.ts, researcher.ts untouched)
D4  Qualification integration ..................... UNAFFECTED (core-qualification untouched since baseline)
D5  MATCH/MISMATCH/UNKNOWN behavior ............... UNAFFECTED
D6  Search+Prospect attribution ................... UNAFFECTED
D7  separation from FIELD_KIND / ResearchSignal ... UNAFFECTED (tests add no persistence path)
D8  Research orchestration/provider contract ...... UNAFFECTED; now directly asserted (GAP 1 closed)
D9  full provider neutrality incl. fallback ....... UNAFFECTED; fallback-path equivalence now asserted
D10 UI behavior ................................... UNAFFECTED (apps/web untouched since baseline)
D11 validation requirements ....................... UNAFFECTED; §8 regression standard met (§11)

R-71 (core-opportunity/src/adapters.ts TOPICAL_FIELDS/toOfferSignals) ... UNCHANGED (zero diff)
Scoring / ranking (core-opportunity service.ts) ......................... UNCHANGED (zero diff)
Discovery ............................................................... UNCHANGED since baseline (no change after Gap Audit)
Opportunity creation / state machine .................................... UNCHANGED (core-opportunity zero diff)
```

## 11. Regression Results

All read-only; nothing modified to make any test pass.

```text
Focused Anthropic provider test
  vitest run src/anthropicResearchProvider.test.ts
  → Test Files 1 passed (1) · Tests 7 passed (7)

Focused fallback provider test
  vitest run src/fallbackResearchProvider.test.ts
  → Test Files 1 passed (1) · Tests 16 passed (16)

GAP 1 tests in isolation (-t "GAP 1")
  → Tests 2 passed | 21 skipped (23)

Full core-research suite
  vitest run (packages/core-research)
  → Test Files 12 passed (12) · Tests 249 passed (249)

Scoped core-research typecheck
  tsc --noEmit (packages/core-research)
  → exit 0, no diagnostics
```

**Integration tests: not rerun.** Not necessary to establish change: the
GAP 1 change consists solely of two unit-test cases inside `core-research`
test files, which no integration test imports, and no production file
changed. Distinction preserved:

```text
Pre-existing 14 integration failures ... UNCHANGED; not caused by, and not intersecting,
                                          the change audited here (causally traced to
                                          core-opportunity suggestOffers()/NEED_DETECTED
                                          fixtures — Post-Implementation Conformance Audit §12)
Newly added D8 coverage ................ 2 unit tests, both passing
Genuinely new regression ............... NONE
```

## 12. Remaining Non-Blocking Gaps

None of these affects GAP 1 closure; recorded, not fixed:

1. **Provider tests use substring/position matching** on
   `JSON.stringify(request.messages)` rather than exact block equality. This
   is intentional (format is `research.test.ts`'s concern) and exact for the
   chosen fixture; a segment containing JSON-escaped characters (`"`, `\`)
   would not be matched verbatim. Non-blocking.
2. **No provider-level assertion for the omitted/empty case** (`targetSegments`
   undefined → `[]` → no segment block). The default path is exercised by
   every pre-existing provider test that omits the field, and the rendering
   outcome is asserted in `research.test.ts`, but no provider-level test
   asserts absence. Non-blocking.
3. **Orchestration-layer half (carried forward, Gap Audit §8):**
   `service.test.ts` still does not assert that the value computed by
   `runResearchForOwner` (`parseTargetSegments(search.parameters.targetCustomer)`)
   is the value passed to `deps.provider.research()`. Outside GAP 1 as
   scoped (provider forwarding). Non-blocking.
4. **Carried forward, unchanged:** MISMATCH/UNKNOWN not exercised end-to-end
   at worker/Postgres level; Gemini `toGeminiSchema()` translation of the
   category-plausibility schema unverified (E11 / D11 §7 precondition); no
   live-provider or human D11 validation performed; 14 pre-existing
   integration failures.

## 13. Final Conformance Classification

```text
CONFORMING WITH NON-BLOCKING NOTES
```

```text
D8 GAP 1 — PROVIDER PASS-THROUGH: CLOSED
```

Both authorized tests exercise the real production
`createAnthropicResearchProvider` and `createFallbackResearchProvider` code
paths with a non-empty `targetSegments`, prove the values reach the model
unchanged and in supplied order, prove the field survives fallback routing
identically for primary and fallback attempts, use only the existing fake
`ResearchModel` harness, make no live calls, and pass. They complement the
GAP 2 prompt-rendering suite without duplicating it. No production file,
contract, or D0–D11 boundary changed. The notes in §12 are non-blocking and
none is a product-decision issue or implementation defect.

No discrepancy was found. No fix was made.

## 14. Safety Verification

Run at task end:

```text
HEAD .......................................... 5992b82b9adff492c480442d68a954f2a03bfb28  (UNCHANGED)
git diff --cached ............................. empty  (nothing staged)
git diff --stat ............................... 48 files changed, 1260 insertions(+), 59 deletions(-)  (IDENTICAL to task start)
git status --short ............................ 98 entries (97 at start + this document, untracked)
git diff --check .............................. clean
Audited test files SHA-256 .................... identical to §2 task-start values
New files created ............................. exactly one: requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_GAP1_CLOSURE_AUDIT.md
Production / test / migration / schema /
  config / PRD / governance files modified .... 0
Commit / push ................................. none / none
Live API calls ................................ 0 (all models are vi.fn fakes; no API keys in environment)
```

Files read (not modified): the ten governance documents in §3;
`provider.ts`, `anthropicResearchProvider.ts` (diff),
`fallbackResearchProvider.ts` (lines 80-125 + diff), the three audited test
files (diffs), `apps/worker/src/index.ts` (diff + grep); greps of
`anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` and of
`RESEARCH_FALLBACK_PROVIDER` / `R-71` references.

## STOP
