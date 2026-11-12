# Phase K5 — Implementation Readiness Audit for K5-D1 / K5-D2

**Status: READ-ONLY READINESS AUDIT. NO IMPLEMENTATION AUTHORIZED. NO SOURCE, TEST, MIGRATION, OR DATABASE STATE WAS MODIFIED TO PRODUCE THIS DOCUMENT.**

This document confirms, read-only, that the two Product Owner decisions recorded in `CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` —

- **K5-D1:** NEED_DETECTED for NEW Service+Geography-only searches must require a stronger approved evidence bar than catalogue-keyword/trigger match alone, consistent with R-71.
- **K5-D2:** PCG-4/category-plausibility test coverage is preserved via a test-only/back-door construction path, with no new production API and no freelancer-facing `targetCustomer` field.

— are implementable within the stated constraints, before any implementation is authorized. All findings below were produced by reading current source files directly (no file was edited); no agent or prior report's conclusion was taken on faith without independently re-reading the cited file.

---

## 1. Is K5-D1 consistent with R-71 and the current deterministic signal architecture?

**Yes.** R-71's exclusion (`TOPICAL_FIELDS = {'companySummary','businessModel','targetCustomers'}`, `packages/core-opportunity/src/adapters.ts:152,186`) and K5-D1's "stronger evidence bar" requirement operate at two different, non-conflicting points in the same pipeline:

- R-71 is a **field-level** exclusion applied in `toOfferSignals()`, before any signal ever reaches `suggestOffers()`. It removes signals whose *source field* is purely descriptive, "applies to OBSERVED and INFERRED alike" (per the function's own doc comment, `adapters.ts:166-168`), and is explicitly out of scope for K5-D1 (this audit does not propose touching it, and K5-D1's own text forbids weakening it).
- K5-D1 would add a **sufficiency** gate applied *after* R-71's field-level filtering has already run, on whatever signals survive it — i.e., K5-D1 narrows further within the set R-71 already allows through; it does not need to, and must not, loosen or bypass R-71 to be implemented.

The current deterministic signal architecture already carries exactly the vocabulary a sufficiency gate needs, without inventing new semantics:
- `StoredResearchSignal`/`ResearchSignal` already carries `classification` (`OBSERVED`/`INFERRED`) and a `confidence` number through to `suggestOffers()`'s input, confirmed read live in `adapters.ts:163-172` (confidence passed through raw) and `packages/core-research/src/persist.ts:74-75`: `OBSERVED` signals keep their full confidence; `INFERRED` signals are persisted at **half** confidence (`Math.floor(observation.confidence / 2)`). This distinction already exists on every signal row, independent of anything K5-D1 would add.
- A structurally analogous "stronger evidence" gate **already exists elsewhere** in this codebase for a parallel purpose (the Phase 5 AI-escalation admission gate, not Need/Opportunity detection): `hasStrongSignalBypass()` (`packages/core-research/src/admission.ts:50-56`) requires **≥2 independent signals at top reliability** (`confidence === OBSERVED_FACT_CONFIDENCE`, i.e. `100`, `deterministicSignals.ts:96`), with at least one mapping to a Primary ranking dimension. This is direct precedent that "require more than a single keyword hit" is an already-understood, already-implemented pattern in this codebase — K5-D1 does not require inventing a new kind of evidence-sufficiency concept from scratch, only applying an analogous pattern at the `createOpportunityForOwner`/`suggestOffers()` boundary instead of the admission-gate boundary.

**Conclusion: K5-D1 is architecturally consistent with both R-71 and the existing signal-classification/confidence vocabulary; no conflict or precondition gap was found.**

---

## 2. Does K5-D1 risk accidentally making Need/Opportunity a keyword-substring classifier?

**Today, yes — that is the current state, and this is precisely what K5-D1 requires changing.** Direct read of `packages/core-acquisition/src/offer.ts:76-104` (`suggestOffers()`) confirms its matching predicate is exactly:
```js
if (!rule.triggers.includes(signal.kind)) return false;
const text = signal.signal.toLowerCase();
return rule.keywords.some((keyword) => text.includes(keyword));
```
— a trigger-kind check AND a case-insensitive substring check. Nothing else gates a match today. `needDetected` (`packages/core-opportunity/src/service.ts:159`, `needDetected: top !== undefined`) is driven entirely by this function's output. This is the exact mechanism K4 found responsible for the dominant failure cascade, and it is, today, unambiguously a keyword-substring classifier.

**For K5-D1 to avoid simply re-creating that same classifier with a longer or different keyword list, any future implementation must add a gate that is not itself reducible to "does more text contain more substrings."** The groundwork identified in §1 above gives at least one concrete, bounded way to do this without touching `suggestOffers()` itself (preserving PRD V2.1's "no replacement scoring framework is introduced" constraint, confirmed as the governing rule for this exact function via `adapters.ts:9-13`'s doc comment): require that the matched signal(s) feeding a given offer suggestion additionally satisfy a classification/confidence-based sufficiency test (e.g., analogous to `hasStrongSignalBypass`'s "≥2 independent OBSERVED-confidence signals, ≥1 on a Primary dimension" pattern, or a single-signal OBSERVED-at-full-confidence requirement) **before** `top !== undefined` is allowed to set `needDetected: true`. This audit does not select or specify the exact threshold — that remains an implementation detail for whoever implements K5-D1 — but confirms a non-keyword-reducible mechanism is readily available using fields the architecture already persists.

**Conclusion: the risk is real and already present today; it is avoidable by construction (gate on classification/confidence, not on a bigger keyword list), and the necessary fields already exist. This is a "confirmed avoidable," not a "confirmed solved" — the exact sufficiency rule is a decision for implementation time, not this audit.**

---

## 3. Can K5-D2 preserve PCG-4/category-plausibility coverage without exposing `targetCustomer` to production NEW-search callers?

**Yes — confirmed via direct inspection of the repository-layer type boundaries, and the mechanism already exists without requiring any new production code.**

- `createServiceProfile()`'s public parameter type is `NewSearchServiceProfileInput = Pick<ServiceProfileFields, 'service' | 'geography'>` (`packages/core-service-profile/src/types.ts:58`). This restriction is enforced **only** at this one function's signature/call boundary (`packages/core-service-profile/src/service.ts:22-36`), which every real production caller must go through (confirmed: the only non-test production call site anywhere in the repo is `apps/web/app/api/service-profiles/route.ts`, the HTTP route for creating a new profile — grepped directly, no other production file calls `createServiceProfile`).
- The **repository layer underneath it has no such restriction.** `ServiceProfileRepository.create(userId: string, input: ServiceProfileFields, now: Date)` (`packages/core-service-profile/src/repository.ts:11`) accepts the **full** `ServiceProfileFields` shape, which includes `targetCustomer: string` (`types.ts:12`) — i.e., the repository is fully capable of persisting a real `targetCustomer` today; nothing new needs to be added to it.
- Likewise, `SearchRepository.create(userId, input: { serviceProfileId, parameters: ServiceProfileFields, idempotencyKey }, now)` (confirmed in `packages/core-search/src/testSupport.ts`'s fake implementation, mirroring the real `pgRepository.ts`'s contract) also takes the full `ServiceProfileFields` as `parameters` — not the restricted `NewSearchServiceProfileInput`.
- Therefore, a test-only helper can call `deps.profiles.create(userId, { service, targetCustomer: 'Restaurants', geography, minProjectValuePaise, triggers, keywords, rationale }, now)` and `deps.searches.create(userId, { serviceProfileId, parameters: thatSameObject, idempotencyKey }, now)` **directly**, entirely bypassing `createServiceProfile()`/`applySystemServiceProfileDefaults()`, with **zero changes to any production file**. The resulting `Search.parameters.targetCustomer` would be a real, non-sentinel value, so `parseTargetSegments(...)` (`packages/core-research/src/service.ts:171`) would correctly resolve a non-empty segment list, and the existing, unmodified `targetSegments.length > 0` gates (`service.ts:225,251`) would fire exactly as they do for any genuine historical search — exercising the real TCM/category-plausibility write paths end-to-end, with real production code, not a mock.
- No new production API, no new HTTP route, no new field on any freelancer-facing form, and no change to `NewSearchServiceProfileInput`'s restriction is required for this to work. The helper would live entirely under `tests/integration/support/` (or equivalent test-only module), calling existing repository constructors that already accept the shape needed.

**Conclusion: K5-D2 is fully implementable as specified — through a test-only helper calling existing, unmodified repository functions — with no production API exposure of `targetCustomer` and no freelancer-facing surface change of any kind.**

---

## 4. Do historical searches remain unchanged?

**Yes, by construction of both decisions and confirmed by the production call-site audit above.**

- `applySystemServiceProfileDefaults()` only executes inside `createServiceProfile()`, which is only invoked at **profile-creation time** for a brand-new `ServiceProfile` — confirmed the only production caller is the `POST`-style creation route (`apps/web/app/api/service-profiles/route.ts`); there is no update/re-save path that re-invokes `createServiceProfile()` against an existing row. An already-persisted historical `ServiceProfile`/`Search` row's `targetCustomer` is therefore never read, rewritten, or reinterpreted by anything K5-D1 or K5-D2 implies.
- `isCategoryPlausibilityApplicableForProspectId`'s `targetSegments.length > 0` gate (`packages/core-research/src/categoryPlausibilityPgRepository.ts:178-195`) is a pure read-time computation over whatever `target_customer` value is already stored on a given Search row — for a genuine historical row carrying a real value, this continues to evaluate `true` exactly as it does today, unaffected by anything proposed here.
- K5-D2's test-only helper (§3) only ever constructs **new, test-fixture** rows that *mimic* a historical search's shape for test purposes — it does not read, touch, or migrate any actual historical row, and this audit does not propose or authorize any migration or backfill (consistent with the PO decision's explicit historical-safety requirement).

**Conclusion: confirmed — nothing in K5-D1 or K5-D2's implementation path touches, reinterprets, or requires migrating any historical row.**

---

## 5. No Global Entity, K1, Phase 7B, Phase 8, or ₹1,499 behavior changes

Confirmed by direct inspection of where each named initiative's code lives, relative to the bounded scope of K5-D1/K5-D2 (§7):

| Initiative | Where it lives | Overlap with K5-D1/D2 scope? |
|---|---|---|
| Global Entity Architecture (K1) | `packages/core-discovery/src/entityRepository.ts`, `packages/core-research/src/signalAuthorization.ts`, `q5aEvidenceFloor.ts`, field-classification migration 0058 | **None.** K5-D1 touches only `createOpportunityForOwner`'s offer-signal sufficiency check in `@acos/core-opportunity`; K5-D2 touches only test-support construction of `ServiceProfileFields`/`Search` rows. Neither reads, writes, or depends on any Entity table or repository. K4 already confirmed zero code diff in `entityRepository.ts` against the last commit, independent of K5. |
| Phase 7B (relevant predefined subservices, MULR item 6) | `packages/core-opportunity/src/subserviceMatching.ts`, `serviceCatalog.ts`, and one additive line in `service.ts:148` computing `relevantSubservices` | **None.** Confirmed by direct read: Phase 7B's `relevantSubservices` field is computed independently, in the same function (`createOpportunityForOwner`) but from a wholly separate code path (`matchRelevantSubservices(...)`) that does not feed, and is not fed by, `toOfferSignals`/`toServiceRule`/`suggestOffers`/`needDetected`. K5-D1's gate sits strictly within the `needDetected`/offer-detection path and does not touch `relevantSubservices` or its inputs. |
| Phase 8 (Entity-Reality activation, `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001`) | `packages/core-research/src/deterministicSignals.ts`, `entityRealityElimination.ts` — feeds the Phase 5 AI-escalation **admission gate** (`admission.ts`'s `deterministicSignals`/`evaluateAdmission`), a wholly separate decision from Need/Opportunity offer-detection | **None.** Phase 8's signals feed candidate *admission* (whether AI-escalated Research runs at all), computed in the worker's Pass 1/Pass 2 before `createOpportunityForOwner` is ever called. K5-D1's sufficiency gate operates strictly inside `createOpportunityForOwner`, after admission has already happened, on `ResearchSignal` rows already persisted by `runResearch` — it reads the same `classification`/`confidence` vocabulary Phase 8 also uses, but reads it independently; no Phase 8 code is modified or depended upon. |
| ₹1,499 Client Finder subscription | `packages/core-subscriptions/`, `apps/web/src/checkout/`, `apps/web/app/api/payments/`, `apps/web/app/api/webhooks/razorpay/` | **None.** This is billing/access-control/entitlement logic, architecturally and physically disjoint from `@acos/core-opportunity`, `@acos/core-service-profile`, `@acos/core-research`, and `tests/integration/support/`. Neither K5-D1 nor K5-D2 touches any file under these paths. |

**Conclusion: no overlap found with any of the four named initiatives; both decisions' implementation scope is confirmed disjoint from all of them.**

---

## 6. Are the remaining K4 engineering-only corrections separately identified?

**Yes — carried forward unchanged from `CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` §5, and reconfirmed still unimplemented** (both files remain untouched in the current working tree as of this audit):

1. **`client-finder-web.integration.test.ts`** — supply the missing `sourceDocuments`/`signalCatalogue` worker deps (or construct an admittable candidate), so the Phase 5 admission gate — a separately, already-approved and unrelated change — does not starve the test of any deterministic signals. This correction is independent of K5-D1/K5-D2 and does not require either decision to land first.
2. **`personalization.integration.test.ts`** — move the R-45/R-42 fixture's evidentiary signal off `companySummary` (a pre-existing, committed R-71-excluded field) onto a non-topical field such as `visibleProblems`. **Note (carried from K5):** this fixture is also independently affected by the K5-D1 mechanism (its `service`/evidence pairing would additionally need to satisfy whatever sufficiency bar K5-D1's implementation lands on), so fully fixing this test requires both corrections — the `companySummary` move is necessary but not sufficient on its own, and should not be scheduled to complete before K5-D1 implementation without accounting for that dependency.

Neither correction is implemented by this audit. Both remain available for separate authorization at any time, independent of whether/when K5-D1 and K5-D2 are implemented (correction 1 is fully independent; correction 2 has the noted partial dependency on K5-D1).

---

## 7. Exact implementation scope is bounded

This section lists, for the record, the files a future implementation pass would touch for each decision — **nothing below is implemented by this audit.**

### K5-D1 implementation scope (future, not authorized by this audit)
- **Would touch:**
  - `packages/core-opportunity/src/service.ts` — `createOpportunityForOwner`'s `needDetected` computation, to add a sufficiency check consuming `suggestOffers()`'s output plus the matched signals' `classification`/`confidence`.
  - Possibly a small new pure function/module (e.g. alongside `offer.ts` or inside `core-opportunity`), analogous in shape to `admission.ts`'s `hasStrongSignalBypass`, but this audit does not specify its exact threshold or location.
  - Test fixtures requiring rewritten evidence to satisfy the new bar: `opportunity.integration.test.ts`, `opportunity-next-action.integration.test.ts`, `opportunity-score.integration.test.ts`, `search-worker.integration.test.ts` (the `need_detected` case), `qualification.integration.test.ts`, and (partially, per §6) `personalization.integration.test.ts`.
- **Would NOT touch:** `packages/core-acquisition/src/offer.ts` (`suggestOffers()` itself — PRD V2.1's "no replacement scoring framework" constraint is preserved by gating on its output, not altering its matching logic), `packages/core-opportunity/src/adapters.ts` (R-71/`toOfferSignals` stay exactly as committed), `packages/core-qualification/*` (it only consumes `needDetected`, never computes it), any Entity-layer file, Phase 7B's `subserviceMatching.ts`/`serviceCatalog.ts`, Phase 8's `deterministicSignals.ts`/`entityRealityElimination.ts`, any migration, or any `core-subscriptions`/checkout/billing file.

### K5-D2 implementation scope (future, not authorized by this audit)
- **Would touch:**
  - One new test-support helper module (e.g. under `tests/integration/support/`) that constructs a `ServiceProfileFields` object with a real `targetCustomer` and calls the existing, unmodified `deps.profiles.create(...)`/`deps.searches.create(...)` repository functions directly.
  - Test files updated to use that helper for the parts of their setup that need a real `targetCustomer`: `search-worker.integration.test.ts` (the PCG-4/TCM-wiring test only), `category-plausibility-source-capture.integration.test.ts`, `category-plausibility-source-review.integration.test.ts`.
- **Would NOT touch:** `packages/core-service-profile/src/service.ts` (`createServiceProfile()` and its `NewSearchServiceProfileInput` restriction stay exactly as they are — no change for any real caller), any HTTP route under `apps/web/app/api/`, any freelancer-facing form/component, any production repository interface (only existing, already-general repository functions are called, nothing new is added to them), any migration, or any Entity-layer/Phase 7B/Phase 8/₹1,499 file.

**Conclusion: both decisions' implementation scopes are bounded to a small, named, and mutually non-overlapping set of files, confirmed disjoint from every excluded architecture/initiative in §5.**

---

## Final Scope Check

```
git status        — unchanged from before this audit began; only this new document added
git diff --stat   — no production source, test, migration, or schema file changed
git diff          — empty for all tracked files
```

Confirmed: no source code modified, no tests modified, no migrations modified, no database state modified, no commit, no push. The only new artifact produced by this audit is this document.

**STOP. Implementation of K5-D1 and K5-D2 remains unauthorized pending explicit go-ahead.**
