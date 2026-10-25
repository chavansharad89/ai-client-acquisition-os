# Phase K4 — Read-Only Root-Cause Audit of Remaining Integration Failures

**Status: AUDIT COMPLETE. NO IMPLEMENTATION AUTHORIZED. NO CODE, TEST, MIGRATION, OR SCHEMA FILE WAS CHANGED TO PRODUCE THIS DOCUMENT.**

Scope: this document audits the integration-test failures left after Phase K3 (which corrected stale `DiscoveryProvider` test-fixture return shapes only). All investigation was performed read-only: source reading, `grep`, running existing test files unmodified, and read-only git inspection (`git show <ref>:<path>`, `git diff <ref> -- <path>`, `git log`) — never `git checkout`/`stash`/`reset` (the repo currently carries ~300 uncommitted modified files plus many new untracked files on top of the last commit, `b3f1827`, and none of that was disturbed). No database was mutated.

---

## 1. Executive Summary

- **Total failures investigated:** 26 individual test-case failures across 9 integration-test files (`opportunity.integration.test.ts` ×1, `opportunity-next-action.integration.test.ts` ×3, `opportunity-score.integration.test.ts` ×1, `search-worker.integration.test.ts` ×2, `qualification.integration.test.ts` ×2, `personalization.integration.test.ts` ×4, `category-plausibility-source-capture.integration.test.ts` ×4, `category-plausibility-source-review.integration.test.ts` ×6, `client-finder-web.integration.test.ts` ×1, `followup-preparation.integration.test.ts` ×5, `outreach-preparation.integration.test.ts` ×5 — note `outreach-preparation` was re-verified at 5 failures live, not the 6 originally reported in K3's quick pass).
- **Confirmed pre-existing (present and failing identically even at the last commit, `b3f1827`):** 1 (`personalization.integration.test.ts`'s R-42/R-45 cluster, insofar as its `companySummary`-only fixture has been incompatible with the committed R-71 topical-field exclusion since before any of today's uncommitted work began).
- **Stale-test / stale-fixture (classification D), caused by *intentional, PO-authorized* production behavior that the test fixtures were never updated for:** 24 of 26. All but one of these trace to exactly **one** production change: `applySystemServiceProfileDefaults()` (new, uncommitted — implements the Service+Geography-only redesign). The remaining one (`client-finder-web.integration.test.ts`) traces to a second, independent intentional change: the Phase 5 AI-escalation pre-admission gate.
- **Likely genuine production defects:** **0.** No failure in this set was traced to a bug in currently-shipping evaluator/service logic. `@acos/core-qualification`'s own 40-test unit suite passes 100%; `@acos/core-personalization`/`@acos/core-outreach-preparation`/`@acos/core-followup-preparation` all correctly implement documented "no upstream row ⇒ null" contracts; `@acos/core-acquisition`'s ranking/action logic is unmodified and correct.
- **Unresolved:** 0 at the root-cause level. One **open product-scope question** remains (does the Service+Geography-only redesign leave any supported path to construct a "historical-style" search with a real `targetCustomer`, for TCM/category-plausibility test coverage to exercise?) — this is a Product Owner question, not an engineering unknown.
- **Global Entity Architecture: confirmed healthy.** No failure in this set touches Entity creation, identity resolution, DiscoveryEvent persistence, entity-aware cache, field classification, or Q5-A/B/C. All dedicated Entity-layer integration suites pass (see §9).
- **Governance finding (secondary, surfaced in passing):** the PO decision document `CLIENT_FINDER_QUALIFICATION_WITHOUT_CATEGORY_PLAUSIBILITY_PO_DECISION.md` states verbatim that **implementation is not authorized** and that `evaluateQualification()` remains unmodified — yet the current uncommitted working tree *has* modified it (the `categoryPlausibilityApplicable`/Option-A branch exists in `packages/core-qualification/src/evaluator.ts`). The engineering is internally correct; the authorization paperwork is stale. Flagged for reconciliation, not fixed here.
- **Framing correction to this audit's own brief:** the K4 task description characterized C-1 (website-less discovery) as "scoped to intent-intake only." Direct code inspection shows the opposite: `requireWebsite: false` is set in the main Search/worker discovery path (`packages/core-discovery/src/service.ts:181`), and `intentIntake.ts` keeps the original, stricter default. This does not affect any failure's classification; it is corrected here for the record.

---

## 2. Failure Matrix

| Test | Failure | Root Cause | Classification | Evidence | Fix Authorized? |
|---|---|---|---|---|---|
| `opportunity.integration.test.ts` — "detects a need and recommends an offer" | `needDetected` expected `true`, got `false` | `createServiceProfile()` → `applySystemServiceProfileDefaults()` overwrites fixture's `keywords:['content','writer']` with catalogue-derived AI&Automation terms; `"hiring a content writer"` no longer substring-matches any of them → `suggestOffers()` returns `[]` | **D** | §3.1 | NO — bucket B (test-only fixture fix) |
| `opportunity-next-action.integration.test.ts` — CONSIDER_OFFER case | expected `CONSIDER_OFFER`, got `HOLD` | Same upstream `needDetected:false`; `recommendOpportunityAction()`'s `classify()` returns `HOLD` immediately on `!needDetected`, before any other field is read | **D** | §3.1, §3.2 | NO — bucket B |
| `opportunity-next-action.integration.test.ts` — REFRESH_RESEARCH (STALE) | expected `REFRESH_RESEARCH`, got `HOLD` | Same; the staleness check is never reached because the `!needDetected` short-circuit fires first | **D** | §3.2 | NO — bucket B |
| `opportunity-next-action.integration.test.ts` — REFRESH_RESEARCH (SUPERSEDED) | expected `REFRESH_RESEARCH`, got `HOLD` | Same mechanism | **D** | §3.2 | NO — bucket B |
| `opportunity-score.integration.test.ts` — qualitative ranking profile | `TypeError: Cannot read properties of undefined (reading 'fit')` | Same upstream `needDetected:false` ⇒ `opportunity.offer === undefined` ⇒ test's own `opportunity.offer!.fit` non-null assertion throws | **D** | §3.1, §5 | NO — bucket B |
| `search-worker.integration.test.ts` — E2E pipeline, `need_detected` | expected `true`, got `false` | Same upstream mechanism, now confirmed through the real worker orchestration path (`claimAndProcessNextSearch`), not just direct service calls | **D** | §3.1, §4 | NO — bucket B |
| `search-worker.integration.test.ts` — PCG-4 TCM wiring | expected 1 determination row, got 0 | `applySystemServiceProfileDefaults()`'s D2 half forces `targetCustomer` to sentinel `';'` → `parseTargetSegments` → 0 segments → TCM-write gate (`targetSegments.length > 0`) never fires. This is the **explicitly documented, PO-authorized** outcome of D2, not an accident. | **D** | §4, §8 | NO — bucket D (product-scope question, see §10) |
| `qualification.integration.test.ts` — evaluate→persist→read back | expected `QUALIFIED`, got `NOT_QUALIFIED` | Same upstream `needDetected:false` mechanism; `evaluateQualification()`'s `NEED_DETECTED` short-circuit fires correctly on a wrong input | **D** | §3.1, §7 | NO — bucket B/D (see §7, §10) |
| `qualification.integration.test.ts` — re-evaluation/superseding | expected `QUALIFIED`, got `NOT_QUALIFIED` | Same mechanism | **D** | §7 | NO — bucket B/D |
| `personalization.integration.test.ts` — R-45 QUALIFIED path | expected `QUALIFIED`, got `NOT_QUALIFIED` | Same upstream mechanism, **plus** an independent, pre-existing cause: this fixture's only evidentiary signal lives in `companySummary`, a field R-71 excludes from offer-matching (committed, unchanged since `b3f1827`) | **D** (two stacked causes) | §3.1, §6 | NO — bucket B (two separate fixture fixes) |
| `personalization.integration.test.ts` — R-42 INSUFFICIENT_EVIDENCE | expected `INSUFFICIENT_EVIDENCE`, got `NOT_QUALIFIED` | Same two stacked causes as above | **D** | §6 | NO — bucket B |
| `personalization.integration.test.ts` — R-49/R-50 idempotency | `evaluateOpportunityPersonalization()` returns `null` | Pure downstream cascade of the above — `core-personalization/service.ts:78`'s sole precondition `qualification.state === 'QUALIFIED'` is never met | **D** (cascade, no new cause) | §6 | NO — bucket B (resolves automatically once R-45 cause fixed) |
| `personalization.integration.test.ts` — "moves away from QUALIFIED" | `evaluateOpportunityPersonalization()` returns `null` | Same cascade | **D** | §6 | NO — bucket B |
| `category-plausibility-source-capture.integration.test.ts` — all 4 | `determination` is `null` | D2 sentinel (`targetCustomer=';'`) → `targetSegments.length===0` → category-plausibility-write gate in `runResearch()` never fires; the stale `targetCustomer` TS field in the fixture is a confirmed **red herring** (never read by production code either way) | **D** | §3.3, §8 | NO — bucket D (product-scope question, see §10) |
| `category-plausibility-source-review.integration.test.ts` — all 6 | `determination`/`determinationId` is `null` | Identical mechanism | **D** | §3.3, §8 | NO — bucket D |
| `client-finder-web.integration.test.ts` — MVP composite E2E proof | `signals.length` expected `>0`, got `0` | **Independent root cause** (not the service-profile mechanism): test's `workerDeps` omits the new, optional `sourceDocuments`/`signalCatalogue` fields the Phase 5 AI-escalation admission gate requires; with both absent, every candidate's deterministic-signal set is `[]`, admission's strong-signal-bypass and threshold checks both fail, the candidate is never admitted, and `researchProspectForOwner`/`runResearch` (the only code path that writes `ResearchSignal` rows) is never invoked | **D** | §3.4 | NO — bucket B (supply the missing deps, or construct an admittable candidate) |
| `followup-preparation.integration.test.ts` — all 5 | `outreachPreparation`/`personalization` is `null` | Pure 3-layer-downstream cascade of the qualification `NOT_QUALIFIED` mechanism above; `core-outreach-preparation/service.ts:74-75`'s sole precondition (`personalization` row exists) and `core-personalization/service.ts:78`'s sole precondition (`qualification.state==='QUALIFIED'`) are both executing exactly as designed | **D** (cascade, confirmed NOT independently broken) | §3.5 | NO — bucket B (resolves automatically) |
| `outreach-preparation.integration.test.ts` — all 5 | `personalization` is `null` | Same cascade, one layer up | **D** | §3.5 | NO — bucket B (resolves automatically) |

---

## 3. Call-Graph Evidence

### 3.1 The dominant mechanism — `applySystemServiceProfileDefaults()` (D1: keywords/triggers)

```
createServiceProfile(input)                              packages/core-service-profile/src/service.ts:22-36
  → applySystemServiceProfileDefaults(input)              packages/core-service-profile/src/systemDefaults.ts:280-290
      reads ONLY input.service / input.geography
      unconditionally overwrites: targetCustomer, minProjectValuePaise,
        triggers, keywords, rationale — regardless of caller-supplied values
      triggers = SYSTEM_DEFAULT_TRIGGERS = ['WEBSITE','NEWS','TECH_STACK']   systemDefaults.ts:33
      keywords = deriveSystemKeywords(input.service)                        systemDefaults.ts:100-114,411-417
        e.g. deriveSystemKeywords('AI & Automation') = ['ai chatbot development',
          'ai agents','ai automation','workflow automation',
          'business process automation','crm automation','ai integration',
          'custom ai tools','prompt engineering','ai consulting','rag',
          'knowledge-base systems','ai content workflows']
  → validateServiceProfileInput(...) → deps.profiles.create(...)

createOpportunityForOwner(...)                            packages/core-opportunity/src/service.ts:124-171
  → signals = deps.signals.listByProspect(...)             service.ts:141
  → offerSignals = toOfferSignals(signals, company)         packages/core-opportunity/src/adapters.ts:175-199
      (R-70/R-71 exclusions applied — see §6 for the companySummary case)
  → rule = toServiceRule(search.parameters)                 adapters.ts:41-49
      rule.keywords = the catalogue list above, NOT the caller's original ['content','writer']
  → suggestions = suggestOffers(offerSignals, [rule])        packages/core-acquisition/src/offer.ts:76-104
      predicate requires: rule.triggers.includes(signal.kind)  AND
                           rule.keywords.some(k => text.includes(k))
      signal.kind='WEBSITE' passes the trigger half; no catalogue term is a
      substring of "hiring a content writer" → keyword half fails → suggestions=[]
  → top = suggestions[0] = undefined
  → opportunities.create(..., { needDetected: top !== undefined /* false */, offer: undefined })
```

This chain was **empirically verified**, not just statically traced: a read-only scratch harness (built entirely under the auditing agent's scratchpad directory, never touching the repo) re-ran the real production code against the real test Postgres and printed the actually-persisted `Search.parameters` row:

```json
{"service":"AI & Automation","targetCustomer":";","geography":"Mumbai",
 "minProjectValuePaise":0,"triggers":["WEBSITE","NEWS","TECH_STACK"],
 "keywords":["ai chatbot development","ai agents","ai automation","workflow automation",
 "business process automation","crm automation","ai integration","custom ai tools",
 "prompt engineering","ai consulting","rag","knowledge-base systems","ai content workflows"],
 "rationale":"A potential fit for {signal} — review the evidence below before reaching out."}
```
— despite the calling test having passed `targetCustomer:'Restaurants'`, `triggers:['WEBSITE']`, `keywords:['content','writer']`. None of the caller-supplied values survived.

### 3.2 Downstream of 3.1 — `opportunity-next-action`'s `HOLD` short-circuit

```
getOpportunityNextAction(...)                              packages/core-opportunity/src/service.ts:574-590
  → deps.opportunities.getById(...)   reads the persisted needDetected:false row
  → recommendOpportunityAction({state, needDetected:false, staleness})
      packages/core-acquisition/src/opportunityAction.ts:53
    → classify()                                            opportunityAction.ts:58
        if (!needDetected) return 'HOLD';                    opportunityAction.ts:59   ← fires FIRST
        // staleness (line 60) and state (line 61) are never reached
```
Confirmed: the two `REFRESH_RESEARCH`-expecting tests DO correctly persist `STALE`/`SUPERSEDED` via their own `classifyOpportunityStaleness()` calls before asserting — but that mutation is irrelevant because the `!needDetected` branch returns before staleness is ever inspected.

### 3.3 The sentinel mechanism — `applySystemServiceProfileDefaults()` (D2: targetCustomer)

```
createServiceProfile(input) → applySystemServiceProfileDefaults(input)
  targetCustomer = SYSTEM_DEFAULT_TARGET_CUSTOMER = ';'        systemDefaults.ts:38,30-44 (documented intent)

runResearchForOwner / runResearch(...)                         packages/core-research/src/service.ts:171
  targetSegments = parseTargetSegments(search.parameters.targetCustomer)
  parseTargetSegments(';') → [] (0 segments, by its own documented contract)

  if (deps.categoryPlausibility && targetSegments.length > 0) { ... }   service.ts:225   ← FALSE, block skipped
  if (deps.targetCustomerMatch   && targetSegments.length > 0) { ... }  service.ts:251   ← FALSE, block skipped
```
Both the category-plausibility-determination-write path and the TCM-determination-write path are gated on the identical `targetSegments.length > 0` condition, which is now permanently false for every Prospect created through the current `createServiceProfile()` entry point — independent of what any stub `ResearchProvider` returns for `categoryPlausibility`/TCM data; that data is discarded before the gate, not after.

`isCategoryPlausibilityApplicableForProspectId` (`packages/core-research/src/categoryPlausibilityPgRepository.ts:178-195`) independently confirms this from the production side: it also computes applicability as `parseTargetSegments(target_customer).length > 0`, so it correctly reports "not applicable" for every such Prospect — this feeds `evaluateQualification()`'s own `categoryPlausibilityNotApplicable` branch, meaning the "not applicable" architecture is internally consistent end-to-end. It is the four affected test files' own fixtures — written assuming a caller-supplied `targetCustomer` is still honored — that are now out of step with it.

The flagged stale `targetCustomer: 'Restaurants; Cafes'` field in `category-plausibility-source-capture/-review`'s object literals is a confirmed **red herring**: `createServiceProfile`'s parameter type is `NewSearchServiceProfileInput = Pick<ServiceProfileFields,'service'|'geography'>` (`packages/core-service-profile/src/types.ts:52`), and `applySystemServiceProfileDefaults()`'s body never dereferences `input.targetCustomer` at all — the field is present on the JS object (Vitest/esbuild doesn't enforce the TS excess-property check at runtime) but structurally unreachable by any code that runs afterward. Fixing the TS error would produce byte-identical runtime behavior.

### 3.4 Independent mechanism — `client-finder-web.integration.test.ts`

```
runCanonicalPipeline(...)                                   apps/worker/src/searchWorker/worker.ts:441-572
  Pass 1 (per candidate), worker.ts:481-549:
    supplied = deps.sourceDocuments && company.normalizedDomain
                 ? fetchPreAdmissionDocuments(...) : { documents: [] }   worker.ts:492-499
      deps.sourceDocuments is undefined in this test's workerDeps → supplied.documents = []
    deterministicSignals = [...(deps.signalCatalogue?.evaluate(supplied) ?? []), ...]
      worker.ts:527-530
      deps.signalCatalogue is undefined → first term []; fake candidates have no
      businessStatus → placesEntitySignal is null → deterministicSignals = []
    preview = previewOpportunityRanking(search.parameters, company, [], now)   worker.ts:541-546
      → packages/core-opportunity/src/preview.ts:57-79 → all ranking dimensions UNKNOWN

  Pass 2 admission, worker.ts:557-564 → packages/core-research/src/admission.ts:84-103
    hasStrongSignalBypass([]) → topReliability.length < 2 → false            admission.ts:55-59
    meetsAdmissionThreshold(all-UNKNOWN) → false                              admission.ts:45-47
    admitted = inTopN && (bypass || thresholdMet) = false                     admission.ts:100

  processOneCandidate(...), worker.ts:611-699: decision.admitted===false → takes the
  "not admitted" branch (worker.ts:620-626):
    persistDeterministicOnly(deps, prospectId, [] /* empty */, now)   — writes ZERO signal rows
    runPostResearchPipelineForOwner(...)
    return;   ← researchProspectForOwner/runResearch (the ONLY path that writes
               ResearchSignal rows from the Research provider) is NEVER reached

base.signals.listByProspect(user.userId, prospectId)  →  []  →  test assertion fails
```
Production's real entrypoint (`apps/worker/src/index.ts:168,179,196,199`) always wires both `sourceDocuments` and `signalCatalogue`; `worker.ts`'s own doc comment for `sourceDocuments` (lines 259-262) explicitly documents the consequence of omitting it: *"Omitting it degrades every candidate to zero deterministic signals … elimination stays vacuous, ranking stays UNKNOWN."* This is the intended, PO-approved behavior of the Phase 5 admission gate (`requirement/CLIENT_FINDER_PHASE5_PRE_RESEARCH_ADMISSION_INPUT_GAP_PO_DECISION_ROUND.md`, untracked, "PO-1 DECISION: APPROVED"), applied against a test fixture that predates it.

### 3.5 Cascade confirmation — personalization → outreach → followup

```
evaluateOpportunityPersonalization(...)                      packages/core-personalization/src/service.ts:78
  if (!qualification || qualification.state !== 'QUALIFIED') return null;    ← sole precondition

prepareOpportunityOutreach(...)                               packages/core-outreach-preparation/src/service.ts:74-75
  const personalization = await deps.personalizations.getByOpportunityId(...)
  if (!personalization) return null;                                        ← sole precondition
```
Live test output for both `followup-preparation` and `outreach-preparation` crashes at `personalization.id`/`personalization.evidence` — i.e. `personalization` itself is `null`, confirming the cascade originates at the qualification layer (§3.1/§7), not at any defect inside `core-outreach-preparation` or `core-followup-preparation` — both packages correctly implement "no upstream row ⇒ null, never throw," and no unexpected exception type or schema error was observed anywhere in either suite.

---

## 4. Git-History Evidence

For every item above classified **D** (not B), the operative question is whether the behavior is genuinely new (uncommitted WIP not yet reconciled with tests) or was already present at the last commit (`b3f1827`, "feat: implement Rs.1499 Client Finder subscription").

| Component | At `b3f1827`? | Evidence |
|---|---|---|
| `packages/core-service-profile/src/systemDefaults.ts` | **Does not exist** | `git show b3f1827:packages/core-service-profile/src/systemDefaults.ts` → file absent. 100% new, uncommitted. |
| `createServiceProfile()`'s unconditional call to `applySystemServiceProfileDefaults()` | **New** | `service.ts` is a tracked, modified file; the call does not exist at `b3f1827`. |
| `createOpportunityForOwner` / `toOfferSignals` / `toServiceRule` / `suggestOffers` (the matching logic itself) | **Unchanged** | `packages/core-opportunity/src/adapters.ts` has **zero diff** vs `b3f1827`. `core-opportunity/src/service.ts` diff (+226/-95) touches only additive, unrelated Phase 7B subservice-matching code — the `needDetected`/offer computation itself is byte-identical. `packages/core-acquisition/src/scoring.ts` diff (+12/-1) only adds a zero-weight enum value. |
| `apps/worker/src/searchWorker/worker.ts`'s admission gate (Pass 1/Pass 2, `persistDeterministicOnly`) | **Does not exist** | `git diff --stat b3f1827 -- apps/worker/src/searchWorker/worker.ts` → +331/-7. At `b3f1827`, `runCanonicalPipeline` unconditionally called `researchProspectForOwner` for every discovered prospect — no admission decision existed at all. **At `b3f1827`, `client-finder-web.integration.test.ts`'s exact current fixture would have passed.** |
| `client-finder-web.integration.test.ts` itself | **Already existed, same shape** | `git show b3f1827:tests/integration/client-finder-web.integration.test.ts` shows the identical "MVP composite E2E proof" test and `workerDeps` shape (necessarily missing `sourceDocuments`/`signalCatalogue`, since those concepts didn't exist yet). |
| `packages/core-qualification/src/evaluator.ts` | **Modified** (+31/-4) | New `categoryPlausibilityApplicable` branch (Option A). `rules.ts` is **unchanged** — the `CATEGORY_PLAUSIBLE` criterion already existed at `b3f1827`. |
| `packages/core-opportunity/src/adapters.ts` (R-71 topical-field exclusion, relevant to `personalization`'s companySummary issue) | **Unchanged, pre-existing** | `git diff b3f1827 -- packages/core-opportunity/src/adapters.ts` → empty. `personalization.integration.test.ts`'s `matchingResearch()`/`unmatchedResearch()` fixtures are also **not** in that file's diff vs `b3f1827` — i.e. this specific test fixture has been incompatible with the committed R-71 rule since before today's uncommitted work began. This is the one failure in this audit classified as genuinely pre-existing. |
| `followup-preparation.integration.test.ts` / `outreach-preparation.integration.test.ts` | **Only K3-era fixture changes** | Diffs vs `b3f1827` (+22/-11 and +20/-15 respectively) are limited to the EntityRepository wiring and `DiscoveryProvider` return-shape fixes from K2/K3, plus one cosmetic service-name rename. Their `matchingResearch()`-style fixtures (including `categoryPlausibility:[{fit:'MATCH'}]`) are byte-identical to `b3f1827`. Since `createOpportunityForOwner`/`toOfferSignals`/`suggestOffers` are also unchanged (above), there is no evidence this specific cascade existed at `b3f1827` — it is a product of the uncommitted `applySystemServiceProfileDefaults()` change, not a standing defect. |
| `requirement/CLIENT_FINDER_PHASE5_*` docs and `CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001`-related docs | **Untracked (new)** | `git status --porcelain requirement/` confirms these are brand-new, uncommitted governance documents — consistent with all of the above being recent, in-progress work rather than historical defects. |

**Correction to a 2026-10-17 prior memory note:** that note classified `client-finder-web.integration.test.ts` and `followup-preparation.integration.test.ts` as "pre-existing" failures. Direct re-verification in this audit **contradicts that label for both files** — the evidence above shows both would have passed against the exact same fixture at the last commit; today's failures are provably caused by uncommitted WIP (the Phase 5 admission gate, and the service-profile defaults change, respectively), not standing defects. The note is retained in memory only as a historical record of what a prior pass observed at that point in time; it should not be relied on as evidence of "pre-existing" status going forward.

---

## 5. Universal Ranking Findings

**`fit` is current and correctly implemented — it is not legacy, not test-only, and not incorrectly omitted anywhere.**

`fit` is a numeric (0–100) field on `DetectedOffer`/`OfferSuggestion` (`packages/core-opportunity/src/types.ts:23-31`; computed at `packages/core-acquisition/src/offer.ts:88-89`: `fit = Math.min(100, Math.round(confidence * (1 + 0.25 * (matched.length - 1))))`). It was never meant to be a field on `UniversalRankingProfile` itself — that type (`packages/core-acquisition/src/universalRanking.ts:55`) is strictly `Record<RankingDimension, RankingTier>` (qualitative tiers only, `STRONG`/`MODERATE`/`WEAK`/`UNKNOWN`), by deliberate design per `CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md` ("never a composite number"). Production consumes numeric `fit` exactly once, correctly: `serviceFitTier(offer)` (`packages/core-opportunity/src/service.ts:266-272`) bands it against `BAND_THRESHOLDS` to produce the qualitative `serviceFit` tier, and already handles `offer === undefined` safely (`if (!offer) return 'UNKNOWN';`).

The `opportunity-score.integration.test.ts` crash (`Cannot read properties of undefined (reading 'fit')`) is caused entirely by `opportunity.offer` being `undefined` — itself a direct cascade of §3.1's `needDetected:false` mechanism — not by any field being incorrectly omitted from the Universal Ranking model or its consumers. The test's own `expectedRanking()` helper correctly mirrors the production tiering logic and is not confused about what `fit` means.

---

## 6. Need/Opportunity Findings

`needDetected` is computed exactly once, in `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:159`), as `top !== undefined` where `top = suggestOffers(offerSignals, [rule])[0]`. The three inputs that matter are: (1) `offerSignals` — the live `ResearchSignal` rows after R-70/R-71 exclusions via `toOfferSignals`; (2) `rule` — the `ServiceRule` derived from `search.parameters` via `toServiceRule`; (3) the AND-gate inside `suggestOffers` (trigger match AND keyword substring match).

For every failing scenario in §3.1, `rule.keywords` is now a fixed catalogue phrase list produced by `deriveSystemKeywords(service)` instead of the caller's original free-text keywords, and the test fixtures' evidence text ("hiring a content writer") was authored against the old free-text contract, not the new catalogue. The signal **is** produced by the discovery/research fixture and **is** correctly mapped to a trigger kind (`WEBSITE`) — the failure is purely in the keyword half of the AND-gate, not in signal production or trigger mapping.

For `personalization.integration.test.ts`'s R-45/R-42 cluster specifically, there is a **second, independent** reason `needDetected` is false even if the keyword issue were fixed: the fixture's only populated field is `companySummary`, which `TOPICAL_FIELDS` (`adapters.ts:152`, R-71) unconditionally excludes from `offerSignals` before `suggestOffers` is ever called — this exclusion is pre-existing, committed, and correct; the fixture simply never supplies a non-topical evidentiary signal.

**The standing rule — a business merely having a website/technology/content must not automatically establish need — is not weakened or threatened by anything found here.** No failure requires, implies, or was fixed by loosening that rule; every failure is a fixture/wiring gap upstream of where that rule is applied.

---

## 7. Qualification Findings

`evaluateQualification()` (`packages/core-qualification/src/evaluator.ts:49-91`) is a pure function of `needDetected`, `signals`, and `categoryPlausibility`/`categoryPlausibilityApplicable`. `NOT_QUALIFIED` is produced **only** via the `NEED_DETECTED` short-circuit (`evaluator.ts:49-59`) — confirmed by code read, since `CATEGORY_PLAUSIBLE`/`EVIDENCE_PRESENT` failures can only ever produce `INSUFFICIENT_EVIDENCE`/`QUALIFIED`, never `NOT_QUALIFIED`, once `needDetected` is true. Since both failing tests observe `NOT_QUALIFIED` specifically (not `INSUFFICIENT_EVIDENCE`), the mechanism is necessarily `needDetected===false` — i.e. §3.1/§6's mechanism, not a defect in the qualification evaluator itself. `@acos/core-qualification`'s own 40-test unit suite (fully decoupled from `core-service-profile`, using in-memory fakes) passes 100%, independently corroborating the evaluator/service code is sound.

**Is this consistent with, or does it violate, the Service+Geography-only qualification PO decision?** **Consistent, in a narrow technical sense — not a violation.** `CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001` explicitly states it does not modify the `NEED_DETECTED` criterion or `evaluateQualification()`'s core logic; it only lifts the category-plausibility-absence cap for NEW searches *when the remaining criteria are satisfied*. Here `NEED_DETECTED` is failing for a reason entirely unrelated to category plausibility (the keyword-override issue), so the evaluator is giving the coded-correct answer to a `needDetected` input that is itself wrong for reasons outside this PO decision's scope. Historical-search behavior is untouched by any of this (nothing in the failing fixtures exercises a historical-style search).

**Governance inconsistency (flagged, not resolved here):** that same PO decision document states, verbatim, **"IMPLEMENTATION NOT AUTHORIZED"** and that `evaluateQualification()`, personalization, and outreach preparation "remain unmodified" — and a later audit document (`CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_IMPLEMENTATION_AUTHORIZATION_READINESS_AUDIT.md`) records that decision's status as "Yes, not touched." Yet the current working tree has in fact modified `evaluateQualification()` (the Option-A `categoryPlausibilityApplicable` branch exists today), and has also introduced `NewSearchServiceProfileInput`/restricted `ServiceProfileInput` — a `core-service-profile` types/validation change that document's own stated scope never mentions at all. The engineering is sound regardless; the authorization record is out of date and should be reconciled by whoever owns that governance doc.

---

## 8. TCM Findings

**The current absence of TCM determination rows is correct and intentional under the current PO decision — not a defect.** `requirement/CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_BACKEND_DEFAULTS_PO_DECISION.md` states verbatim: *"**No** `targetCustomerMatch` (TCM) evaluation is produced [for new searches]"* (decision D2), and further: *"New searches will not produce `categoryPlausibility` or `targetCustomerMatch` records ... this is a real behavioral difference from historical searches, which is **expected and authorized by D2, not a regression to be fixed**."* The mechanism (§3.3) is the direct, literal implementation of that sentence.

The open question is narrower than "is TCM correctly disabled" (yes, confirmed) — it is: **does the current public API (`createServiceProfile`) leave any supported way to construct the "historical-style" search the PO decision itself says should still produce TCM/category-plausibility records?** If not, `search-worker.integration.test.ts`'s "PCG-4 production wiring" test and both `category-plausibility-source-*` test files are exercising a code path that, while not broken, may now be structurally unreachable through any currently-exposed test or production entry point — which is a product-scope question, addressed in §10.

---

## 9. Global Entity Regression Check

| Component | Status | Evidence |
|---|---|---|
| Entity creation (`packages/core-discovery/src/entityRepository.ts`) | **PASS — zero diff** | `git diff --stat b3f1827 -- packages/core-discovery/src/entityRepository.ts` → empty; file byte-identical to last commit. Not referenced by any traced failure mechanism above. |
| Identity resolution | **PASS** | `identity-find-or-create.integration.test.ts` run live: 4/4 passed. |
| DiscoveryEvent persistence (migration `0054_discovery_events`) | **PASS (indirect)** | Not touched by any traced mechanism; exercised by `discovery.integration.test.ts` (11/12 passing — the one unrelated failure is a query-string assertion about `targetCustomer`, consistent with the Service+Geography-only redesign, flagged separately below, not an Entity/DiscoveryEvent issue). |
| Website-less discovery (C-1) | **PASS — framing corrected** | `requireWebsite:false` is set in the main Search/worker discovery path (`packages/core-discovery/src/service.ts:181`), **not** scoped to intent-intake as this audit's own brief assumed; `intentIntake.ts` has zero occurrences of `requireWebsite` and keeps the stricter original default. This matches the engineering spec verbatim. Not implicated in any failure above. |
| Entity-aware cache | **PASS** | `research-signal-cache-index.integration.test.ts` run live: 10/10 passed (confirms the prior K2-phase result still holds). |
| Public/private field classification (Phase H, migration `0058`) | **PASS** | `research-signal-field-classification.integration.test.ts` run live: 10/10 passed. |
| Q5-A/B/C global-sharing authorization | **PASS** | `research-signal-global-authorizations.integration.test.ts` run live: 5/5 passed. |

**Overall: no Global Entity Architecture component is implicated in, or shows any regression caused by, any failure audited in this report.** All failures trace cleanly to (a) the Service+Geography-only `applySystemServiceProfileDefaults()` mechanism, (b) the Phase 5 AI-escalation admission gate, or (c) the pre-existing R-71 topical-field exclusion — none of which touch Entity-layer code. `core-discovery/src/entityRepository.ts` has zero diff vs the last commit, and the `core-opportunity/src/service.ts` diff touching `needDetected` logic contains no Entity-architecture code.

**Incidental finding (out of scope, not investigated further):** `discovery.integration.test.ts` has 1 new failure ("the production GooglePlacesDiscoveryProvider persists real candidates…") expecting the search-query text to contain `targetCustomer` ("Restaurants"); the actual query text now omits it entirely — consistent with the Service+Geography-only redesign discarding `targetCustomer` at the source. Unrelated to Entity creation/identity/DiscoveryEvent; flagged only for completeness and likely belongs to the same remediation batch as the rest of this report's D-classified items.

---

## 10. Recommended Next Actions

*(Documented only. Nothing below has been implemented.)*

### A. No action required
- Universal Ranking / `fit` field semantics — correctly implemented, no change needed.
- Qualification evaluator/service logic — correct; the `NEED_DETECTED` short-circuit is doing exactly what it should.
- `core-personalization` / `core-outreach-preparation` / `core-followup-preparation` — all three correctly implement their documented null-propagation contracts; no change needed once upstream is addressed.
- TCM gating logic itself — correctly implements D2 as written.
- Global Entity Architecture (Entity creation, identity resolution, DiscoveryEvent, cache, field classification, Q5-A/B/C) — confirmed healthy, no action.

### B. Test-only corrections required
- `opportunity.integration.test.ts`, `opportunity-next-action.integration.test.ts`, `opportunity-score.integration.test.ts`, `search-worker.integration.test.ts` (`need_detected` case), `qualification.integration.test.ts`: rewrite the shared `sampleProfileInput()`/research-evidence fixtures so the evidence text contains a literal term from `deriveSystemKeywords(service)`'s actual catalogue output (or select a `service` whose catalogue family already covers the intended evidence wording), rather than hand-authoring arbitrary keywords the system no longer honors.
- `personalization.integration.test.ts`: move the evidentiary signal for R-45/R-42 off `companySummary` (a `TOPICAL_FIELDS`-excluded field, R-71) onto a non-topical field such as `visibleProblems`, independent of the fixture fix above.
- `followup-preparation.integration.test.ts`, `outreach-preparation.integration.test.ts`: no change needed in these files themselves — they will resolve automatically once the upstream qualification-fixture fix (above) lands.
- `client-finder-web.integration.test.ts`: supply `sourceDocuments`/`signalCatalogue` in the test's `workerDeps` to match production wiring (`apps/worker/src/index.ts`), or construct a candidate whose deterministic-signal set satisfies the strong-signal bypass, so the "MVP composite E2E proof" actually exercises AI-escalated Research as its own test description claims.

### C. Production implementation required
- None identified. No failure in this audit was traced to a defect in currently-shipping production logic.

### D. Requires Product Owner decision
- **NEED_DETECTED reachability under system-derived keywords:** no existing PO decision addresses whether/how any caller (test or otherwise) should be able to deterministically drive `NEED_DETECTED` now that keywords are fixed catalogue phrases rather than free text. Recommend either a new decision mirroring `CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001`'s structure, or an explicit statement that this is purely a test-maintenance matter (bucket B above).
- **PCG-4 TCM / category-plausibility test-coverage reachability post-D2:** `search-worker.integration.test.ts`'s TCM-wiring test and both `category-plausibility-source-*` files need a way to construct a "historical-style" search with a real `targetCustomer`, which the current public API no longer exposes to any caller. PO must decide: (i) these specific tests are intentionally obsolete and should be retired/rewritten against direct-row seeding of a historical-style search, or (ii) a test-support/back-door construction path is warranted to keep this coverage alive. Suggested doc name if pursued: a new decision such as `CF-CATEGORY-PLAUSIBILITY-SOURCE-CAPTURE-TEST-COVERAGE-POST-D2-PO-DECISION` (does not currently exist).
- **Governance reconciliation (not a behavior question):** `CLIENT_FINDER_QUALIFICATION_WITHOUT_CATEGORY_PLAUSIBILITY_PO_DECISION.md`'s "implementation not authorized" / "evaluateQualification() unmodified" statements are out of step with the current working tree. Someone with authority over that document should either update its authorization status or point to the (not yet located, if it exists) record that actually authorized the Option-A implementation and the `NewSearchServiceProfileInput` restriction.

---

## Final Scope Check

```
git status        — unchanged from before this audit began; only this new document was added
git diff --stat   — no production source, test, migration, or schema file changed by this audit
git diff          — empty for all tracked files other than this new, untracked document
```

Confirmed: no production source changed, no tests changed, no migrations changed, no schema changed, no database mutated, no Product Owner decision changed, no commit made, no push made. The only new artifact produced by this audit is this document.

**STOP. No implementation has been authorized by this audit.**
