# Option B — Category Plausibility Path Decision

## 1. Status

```text
OPTION B:
DECIDED

IMPLEMENTATION:
NOT AUTHORIZED

PATH DECISION:
PRODUCT DECISION REQUIRED
```

## 2. Existing Product Decision

Category plausibility — comparing the participant's stated target-customer intent against evidence about a discovered business — is owned by Research/Qualification, not Discovery. This is recorded in `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` and confirmed unchanged by `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md`. This decision is not reopened here.

## 3. Decision Being Prepared

The remaining, unmade decision is which of the two implementation paths identified in the scope document should be authorized:

- **Path 1** — a new Qualification criterion.
- **Path 2** — a Research-level plausibility determination consumed by Qualification.

This document prepares that decision factually. It does not make it.

## 4. Path 1 — New Qualification Criterion

**Definition test** — where the system would decide plausibility:

| Element | Path 1 |
|---|---|
| Producer | A new Qualification rule function (`packages/core-qualification/src/rules.ts`), evaluated inside `evaluator.ts` |
| Input | Participant `targetCustomer` (requires a new dependency, e.g. `searches` or `serviceProfiles`, added to `QualificationDeps`, `service.ts:16-21`) + existing `ResearchSignal`s already available to Qualification (specifically the `targetCustomers` field and its evidence/classification/confidence) |
| Output | A new criterion result folded into `StoredQualification`'s existing per-criterion result shape |
| Evidence | Reuses existing `LeadResearch.targetCustomers` evidence — no new Research output required |
| Consumer | Qualification's own evaluation state/outcome; whatever downstream reads `StoredQualification` today |
| Persistence | Extends the existing Qualification persistence path; no new Research/Opportunity storage required |
| Failure state | Governed by however the new rule function is written — Qualification's `NOT_QUALIFIED` semantics already exist as a pattern to extend |

Per `packages/core-qualification/src/types.ts:12`, current criteria are exactly `['NEED_DETECTED', 'EVIDENCE_PRESENT']`. `evaluator.ts:21-43` calls both sequentially with a short-circuit. Adding a criterion is a known, supported extension pattern (`PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md:333`: "qualification-v1 evaluator versioning already supports adding new criteria without breaking existing ones").

**Required Research changes**: none — Research already produces `targetCustomers` evidence.

**Required Qualification changes**: extend the criteria tuple, add a rule function, invoke it in the evaluator, and add a repository dependency capable of reaching `targetCustomer` (none exists today — `QualificationDeps` has no `SearchRepository`).

## 5. Path 2 — Research-Level Plausibility

**Definition test**:

| Element | Path 2 |
|---|---|
| Producer | Research (`packages/core-research/src/anthropicResearchProvider.ts` / `prompt.ts`), producing a plausibility-shaped output alongside the existing `LeadResearch` fields |
| Input | Participant `targetCustomer`, threaded from `search.parameters` (worker already holds this, `apps/worker/src/searchWorker/worker.ts:327-451`) into a new/extended `ResearchProviderInput` (`provider.ts:11-16`, currently 4 fields with no participant context) |
| Output | A new field/shape in `LeadResearch` (`schema.ts:176-201`), distinct from the existing descriptive `targetCustomers` field per §7 below |
| Evidence | New evidence generated at Research time, using the existing classification/confidence/evidence[] model already applied to every `LeadResearch` field |
| Consumer | Qualification reads the already-computed field — its own logic is narrower than Path 1's |
| Persistence | A new `ResearchSignal` field/kind, or an extension of `LeadResearch`'s persisted shape |
| Failure state | Governed by however the new Research output field's absence/UNKNOWN state is defined |

**Required Research changes**: extend `ResearchProviderInput`, thread `targetCustomer` through `runResearchForOwner` (`service.ts:76-81`) and the worker's Research call (`worker.ts:358-368`, which today passes only `{ prospectId }`), extend `LeadResearch`/`ResearchInput` schema, update `prompt.ts` to incorporate the participant's target category, update the provider to parse the new field.

**Required Qualification changes**: narrower than Path 1 — a rule that reads an already-computed field rather than computing the comparison itself. Still requires deciding whether this becomes a distinct criterion (`CATEGORY_PLAUSIBLE`) or is folded into `EVIDENCE_PRESENT`.

## 6. Data Flow Comparison

```text
PATH 1

Participant targetCustomer
   ↓ (new: QualificationDeps gains a searches/serviceProfiles dependency)
Qualification
   ↑ reads existing LeadResearch.targetCustomers evidence (already persisted, unchanged)
   ↓
NEW CATEGORY-PLAUSIBLE criterion (conceptual name, not approved)
```

```text
PATH 2

Participant targetCustomer
   ↓ (new: worker → ResearchProviderInput, currently unthreaded)
Research
   ↓ (new: LeadResearch gains a plausibility-shaped field, distinct from existing targetCustomers)
Category evidence / plausibility determination
   ↓
Qualification consumes the already-computed result
```

Both paths require touching exactly one "producer" location that does not exist today (a Qualification-side comparison, or a Research-side comparison) — they differ in which package's contract is extended and how many downstream files that extension touches (Path 2's change surface reaches further upstream, into the worker call site and the LLM prompt).

## 7. Semantic Boundary

| Field | Meaning | Owner | Current Consumer |
|---|---|---|---|
| `ServiceProfile.targetCustomer` (singular) | The participant's own stated target-customer intent — free text, e.g. `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"` (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:22`) | Participant (user-authored), `packages/core-service-profile/src/types.ts:10-14` | Discovery's `buildQuery()` (query text only); otherwise unread past Discovery today |
| `LeadResearch.targetCustomers` (plural) | Who the **discovered business itself** serves, per research evidence — a fact about the target business, not a comparison to the participant's intent | Research provider (LLM), `packages/core-research/src/schema.ts:176-201` | Persisted as a `ResearchSignal`; excluded from need detection by R-71 (`TOPICAL_FIELDS`, `adapters.ts:152`) |

No code today compares these two fields. The near-identical English names are a vocabulary coincidence, not a derivation relationship (see `packages/core-research/src/adapters.ts:136-152` for the field's actual documented purpose). Neither field is renamed or changed by this document.

## 8. Evidence / UNKNOWN Model

**What exists today**: `LeadResearch`'s uniform evidence model — `classification` (`OBSERVED`/`INFERRED`/`UNKNOWN`, `schema.ts:20-22`), `confidence` (0-100, `schema.ts:90`), `evidence[].quote/sourceUrl/sourceLabel` (`schema.ts:31-57`), `basis` (INFERRED reasoning trail, `schema.ts:88`) — applies to every field including `targetCustomers`. `UNKNOWN` is therefore an **already-established pattern** in the classification enum, reusable by either path without inventing a new three-state model.

Separately, `packages/core-qualification/src/rules.ts`'s `isEvidentiary()` treats only `classification === 'OBSERVED'` as evidentiary for the existing `EVIDENCE_PRESENT` criterion (per the Scenario E / Option C decision, `requirement/PHASE_24_SCENARIO_E_*`). Whether a category-plausibility MATCH/MISMATCH/UNKNOWN determination should follow the same OBSERVED-only standard, or a different one, is undefined by any existing document.

**What remains undefined** (neither path resolves this — it is a product decision, §13):
- What evidence tier (direct self-identification, strong indirect content, weak name-only inference — per the scope document's §11) is sufficient for MATCH vs. MISMATCH vs. UNKNOWN.
- Whether `INFERRED`-only evidence (e.g., a business name alone) can ever support MISMATCH, given the existing precedent that `INFERRED` is excluded from `EVIDENCE_PRESENT`'s qualifying evidence.
- No numeric threshold, scoring mechanism, or reuse of `OpportunityScore` is assumed or proposed by this document, consistent with the constraint against introducing scoring.

## 9. R-71 Interaction

**Confirmed facts** (from `packages/core-qualification/src/adapters.ts:136-152` and `requirement/PHASE_24_R70_R71_DECISION.md`):

1. R-71's purpose is topic-vs-problem relevance in need detection — not category/audience matching. Its inputs are live `ResearchSignal`s plus a narrowed slice of the Service Profile (`toServiceRule()` — `service`, `keywords`, `rationale`, `minProjectValuePaise`; explicitly **not** `targetCustomer`).
2. `targetCustomers` (plural, business-side) is already excluded from need detection via `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` — this exclusion exists for the topic-vs-problem axis, not for category plausibility.
3. **Does Path 1 require an R-71 change?** No, provided the new Qualification criterion reads `targetCustomers`/participant `targetCustomer` directly and does not route either value through `suggestOffers()`/`toOfferSignals()` (need detection). This is stated as fact in `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:307`.
4. **Does Path 2 require an R-71 change?** No, by the same reasoning — Path 2's new Research output field is distinct from the existing `targetCustomers` field, so it is not automatically a member of `TOPICAL_FIELDS`, and nothing requires it to be routed through need detection.
5. **Can category plausibility remain entirely separate from Need/Offer Detection?** Yes, on the evidence available, for both paths — provided the implementation choice explicitly keeps the new criterion/field out of `suggestOffers()`/`toOfferSignals()`.
6. **Would either path require using `targetCustomers` in R-71 itself?** No — neither path's minimal implementation requires modifying `TOPICAL_FIELDS`, `suggestOffers()`, or any R-71 code path.
7. **Unresolved question**: whether a *future* decision might still want category-mismatch information to influence need detection (Case B in the scope document, §7) — this is explicitly not decided by either path's minimal form and is listed as an open product decision (§13, item 10).

## 10. Scoring / Ranking Boundary

Confirmed (per `packages/core-discovery/src/service.ts`, `packages/core-opportunity/src/service.ts:264-401`, and `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`): scoring and ranking are implemented in `core-opportunity`/`core-acquisition`, wired into the worker as an independently authorized, separately-gated step (`worker.ts:385-395`, `if (deps.scores) { ... }`), with no data dependency on Qualification's criteria or Research's fields in either direction.

```text
SCORING:
UNCHANGED

RANKING:
UNCHANGED
```

Neither path, in its minimal form, necessarily touches `scoreOpportunity`/`rankOpportunities`, factor weights, factor basis, or `OpportunityScore`. No score adjustment is proposed by this document.

## 11. Opportunity Boundary

**Before Opportunity creation**: would require Discovery- or pre-Opportunity-stage filtering — explicitly out of scope (Option B already assigns ownership to Research/Qualification, not Discovery; see §2). Neither Path 1 nor Path 2, in the form analyzed here, proposes evaluating plausibility before Opportunity creation.

**After Opportunity creation, during Qualification** (both paths as analyzed): the current architecture already supports this placement without changing the Opportunity state machine. `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) runs independently of Qualification, which is invoked separately (`evaluateQualificationForOwner`, `packages/core-qualification/src/service.ts:59-78`) against an already-created `Opportunity`. `StoredOpportunity` (`types.ts:40-59`) has no category field today, and neither path's minimal form requires adding one — the plausibility determination lives in Qualification's own result (Path 1) or in a Research-produced field Qualification reads (Path 2), not in `StoredOpportunity` itself.

```text
Opportunity exists
      ↓
Qualification rejects/holds candidate
```

This sequence is achievable under the current architecture without Opportunity state-machine changes, for both paths, based on the code traced. Whether a category mismatch should *also* eventually prevent Opportunity creation (moving the check earlier) is a separate, unresolved product question (§13, item 7) — not required by either path's minimal implementation.

## 12. Minimal Change Surface

### Path 1

| Existing component | Required change | Why |
|---|---|---|
| `packages/core-qualification/src/types.ts` | Extend `QUALIFICATION_CRITERIA` tuple | New criterion needs an identifier |
| `packages/core-qualification/src/rules.ts` | New rule function | Encodes the comparison logic |
| `packages/core-qualification/src/evaluator.ts` | Invoke new rule, fold into result | Wires the criterion into evaluation |
| `packages/core-qualification/src/service.ts` (`QualificationDeps`) | Add a repository dependency reaching `targetCustomer` | None exists today |
| **Must NOT change**: Discovery, Research, `TOPICAL_FIELDS`/R-71, scoring, ranking, `StoredOpportunity`, Opportunity state machine | — | No path-1 element requires touching these |

### Path 2

| Existing component | Required change | Why |
|---|---|---|
| `packages/core-research/src/provider.ts` (`ResearchProviderInput`) | Add a target-customer/category field | Currently 4 fields, no participant context |
| `packages/core-research/src/service.ts` (`runResearchForOwner`) | Source the new field from the Search snapshot | Currently builds `ResearchProviderInput` without it |
| `apps/worker/src/searchWorker/worker.ts` | Pass `search.parameters.targetCustomer` into the Research call | Currently passes only `{ prospectId }` |
| `packages/core-research/src/schema.ts` (`LeadResearch`/`ResearchInput`) | New field/shape, distinct from existing `targetCustomers` | Avoid conflating "who the business serves" with "does it match the user's target" |
| `packages/core-research/src/prompt.ts` / `anthropicResearchProvider.ts` | Incorporate participant target category into prompt; parse new output field | Research must actually produce the new evidence |
| `packages/core-qualification/src/rules.ts` | New, narrower rule reading the already-computed field | Qualification still needs to act on the result |
| **Must NOT change**: Discovery, `TOPICAL_FIELDS`/R-71 (unless a later decision opts in), scoring, ranking, `StoredOpportunity`, Opportunity state machine | — | No path-2 element requires touching these |

Path 1's change surface is confined to `core-qualification`. Path 2's change surface spans `core-research`, the worker, and `core-qualification`.

## 13. Required Product Decisions

1. Which path is authorized — Path 1 or Path 2?
2. What exactly constitutes category MATCH?
3. What constitutes MISMATCH?
4. What constitutes UNKNOWN, and does it reuse the existing `OBSERVED`/`INFERRED`/`UNKNOWN` classification model (§8)?
5. How is multiple-target matching handled — e.g. the observed real case of a single compound `targetCustomer` string spanning three segments (`Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators`, `requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:22`), inserted today as one unparsed clause with no per-segment structure (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:116`)? Does a business matching only one of several segments count as MATCH overall? Does ambiguity across segments produce UNKNOWN?
6. Does mismatch block Qualification (`NOT_QUALIFIED`), or only surface as information?
7. Does mismatch prevent Opportunity creation, or does Opportunity creation remain unconditional and only Qualification gates on it (§11)?
8. Should the plausibility determination be persisted as its own field/row, or only exist as a transient evaluation input?
9. What evidence must be displayed to the user/participant (raw evidence quotes, a MATCH/MISMATCH/UNKNOWN label, both, neither)?
10. Does category plausibility remain completely separate from R-71/need detection permanently, or could a future decision route it through need detection (Case B, §9 item 7)?
11. Does scoring remain unchanged (confirmed as a constraint in this document, §10) — is that constraint expected to hold indefinitely or only for this authorization?
12. What participant feedback is required during a future live validation to confirm the mechanism works (see below)?

**Validation-observability note** (informational only — no validation run is proposed or performed here): the most recent live-validation attempt referenced in `requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:39-40` and `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:52` produced 12 discovered candidates, 0 researched, 0 opportunities, and 0 participant reviews, because Research failed with `HTTP 400 "Your credit balance is too low to access the Anthropic API"` before any candidate reached Research. This blocker is unrelated to and unresolved by either path. A future validation of category plausibility, once authorized and implemented, would need to observe the full chain — discovered candidate → research evidence → category determination → qualification outcome → participant review — which requires a funded Anthropic account regardless of which path is eventually chosen.

## 14. Decision

```text
UNDECIDED

PATH 1:
NOT SELECTED

PATH 2:
NOT SELECTED
```

## 15. Explicit Non-Goals

- Discovery redesign.
- Discovery category filtering.
- Scoring changes.
- Ranking changes.
- R-70 changes.
- R-71 changes.
- Outreach.
- CRM.
- Live validation.
- Provider replacement.

## 16. Implementation Authorization

```text
NO IMPLEMENTATION AUTHORIZED
```

## 17. MVP Status

```text
MVP ENGINEERING EXIT:
SATISFIED

OPTION B:
DECIDED

PATH:
UNDECIDED

IMPLEMENTATION:
NOT AUTHORIZED
```

## 18. Repository Safety

Verified via `git status --short`, `git rev-parse HEAD`, and `git branch -vv` before and after this analysis:

```text
HEAD: 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged throughout)
Branch: phase-17-r34-worker-orchestration
Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts
Pre-existing untracked files (untouched by this task, including the prior
scope document, which was not modified):
  .claude/, CLAUDE.md, requirement/*.md (existing set, incl.
  OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md)
New file added by this task:
  requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md
No git add/commit/push/reset/restore/checkout/clean/stash performed.
No application run, no search created, no Google Places calls, no Anthropic API calls, no migrations, no database modifications.
```
