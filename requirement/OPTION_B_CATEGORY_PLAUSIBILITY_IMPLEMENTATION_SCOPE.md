# Option B — Category Plausibility Implementation Scope

## 1. Status

```text
DECISION:
OPTION B — RESEARCH / QUALIFICATION-OWNED

IMPLEMENTATION:
NOT AUTHORIZED

SCOPE ANALYSIS:
COMPLETE
```

## 2. Objective

The Product Owner has already decided (see `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md`) that "category plausibility" — comparing the participant's stated target-customer intent (`ServiceProfileFields.targetCustomer`) against evidence about a discovered business — is owned by Research/Qualification, not Discovery ("Option B"). This document is a read-only technical/product scope analysis. It asks and answers one question only:

> **How could Option B be implemented without accidentally changing R-71, scoring, ranking, or other frozen MVP behavior?**

It does not choose an implementation path and authorizes no implementation.

## 3. Current Data Flow

```text
ServiceProfile (packages/core-service-profile/src/types.ts:10-14)
  targetCustomer: string   — participant-authored, free text
    ↓ snapshot copy, unchanged, at Search-creation time
Search (packages/core-search/src/types.ts:30-46; service.ts:82-90)
  StoredSearch.parameters: ServiceProfileFields (includes targetCustomer)
    ↓ Discovery reads search.parameters only to build a Google Places text query
Discovery (packages/core-discovery/src/googlePlacesProvider.ts:11-15)
  buildQuery() interpolates targetCustomer into a free-text query string; nothing
  further downstream carries it — DiscoveryCandidate (provider.ts:9-12),
  NormalizedCandidate (normalize.ts:3-6), StoredCompany (types.ts:7-14) have
  no category/industry/target-customer field at all
    ↓
Company / Prospect (no category field)
    ↓
Research input (packages/core-research/src/provider.ts:11-16)
  ResearchProviderInput { prospectId, companyId, companyName, normalizedDomain }
  — actually constructed by runResearchForOwner (service.ts:76-81); carries no
    participant context
  (A wider schema, ResearchInput — schema.ts:207-224 — has optional industry/
   location fields consumed by the prompt builder, but no caller populates them)
    ↓
Research provider (packages/core-research/src/anthropicResearchProvider.ts:67-70)
    ↓
Research result — LeadResearch (packages/core-research/src/schema.ts:176-201)
  includes targetCustomers (plural) — an observation about who the DISCOVERED
  BUSINESS serves, not a comparison to the participant's targetCustomer
    ↓
ResearchSignal (persisted rows, one per LeadResearch field, field='targetCustomers' etc.)
    ↓
Opportunity (packages/core-opportunity/src/service.ts:112-151)
  createOpportunityForOwner independently re-fetches the Search row (has
  search.parameters.targetCustomer in scope) but toServiceRule()
  (adapters.ts:41-49) drops targetCustomer and geography when building the
  offer-matching rule; StoredOpportunity (types.ts:40-59) has no category field
    ↓
Qualification (packages/core-qualification/src/service.ts:59-78)
  evaluateQualificationForOwner takes only opportunityId; QualificationDeps
  (service.ts:16-21) = { identity, opportunities, signals, qualifications } —
  no SearchRepository, so targetCustomer is unreachable even indirectly
```

## 4. Target Customer Data Flow

The participant's `targetCustomer` (singular, `ServiceProfileFields.targetCustomer: string`, `packages/core-service-profile/src/types.ts:10-14`) originates as one of four user-authored Service Profile fields and is persisted to a `target_customer` column (`pgRepository.ts:49,95,123`).

1. **Origin**: `ServiceProfile` (user-authored), `packages/core-service-profile/src/types.ts:10-14`.
2. **Persisted**: Postgres `target_customer` column, `packages/core-service-profile/src/pgRepository.ts:49,95,123`; validated required non-empty, `validation.ts:104-106,139`.
3. **Available to the worker**: Yes. `runCanonicalPipeline(deps, search: StoredSearch)` (`apps/worker/src/searchWorker/worker.ts:327-451`) holds the full `search.parameters.targetCustomer` in scope throughout the pipeline run.
4. **Available to Research**: No. The worker's Research call (`worker.ts:358-368`) passes only `{ prospectId }`; `runResearchForOwner` builds only the 4-field `ResearchProviderInput`, which never carries `targetCustomer`.
5. **Available to Qualification**: No, and more fundamentally than for Research — `QualificationDeps` has no repository (`searches` or `serviceProfiles`) capable of reaching it at all, even if a call site wanted to pass it.
6. **Where the flow loses access**: `targetCustomer` is last touched at Discovery's `buildQuery()` (query construction) and, separately, remains reachable-but-unread inside `createOpportunityForOwner` (which fetches the Search row but `toServiceRule()` drops the field). It is never forwarded into the Research call or into the Qualification dependency surface.

## 5. Current Research Capability

**Actual input** (`ResearchProviderInput`, `provider.ts:11-16`): `prospectId`, `companyId`, `companyName`, `normalizedDomain`. No participant context of any kind.

**Wider, unused input schema** (`ResearchInput`, `schema.ts:207-224`, Zod): `companyName`, `websiteUrl`, `industry?`, `location?`, `socialProfileUrl?`, `sourceDocuments`. `industry`/`location` are already wired into the LLM prompt (`prompt.ts:36,55-56`, rendered as "Industry (supplied, unverified): ..." and explicitly flagged to the model as unverified/INFERRED-at-best) but no caller in the codebase ever sets them.

**Output** (`LeadResearch`, `schema.ts:176-201`) — relevant fields:

| Field | Current purpose | Current producer | Current consumers |
|---|---|---|---|
| `companySummary` | Topical/descriptive claim, classified OBSERVED/INFERRED/UNKNOWN | LLM | Persisted signal; excluded from offer matching (`TOPICAL_FIELDS`, `adapters.ts:152`) |
| `businessModel` | Same shape as above | LLM | Same exclusion |
| `targetCustomers` (plural) | Who the **discovered business** itself serves — a fact about the target business | LLM | Persisted signal; in `TOPICAL_FIELDS`; excluded from R-71 need detection |
| `visibleProblems`, `growthOpportunities`, `aiOpportunities`, `websiteIssues`, `contentOpportunities`, `automationOpportunities` | Problem/opportunity-shaped claims | LLM | Offer-eligible (not topical) |
| `recommendedService` | LLM's own service recommendation (fixed enum incl. `'NONE'`) | LLM | Not consumed by `suggestOffers()` (separate keyword-based logic) |
| `classification`, `confidence`, `evidence[]`, `basis` | Evidence/confidence/source-attribution model, applied uniformly to every field above | LLM | Qualification's `EVIDENCE_PRESENT` criterion; R-71's topical/problem split |

**`targetCustomers` disambiguation** (confirmed by direct code quote, `adapters.ts:136-152`): `targetCustomers` means "who the discovered business serves," an observation about the target business — it is **not** a comparison against the participant's `targetCustomer`. No code today computes or persists such a comparison. The near-identical English names are a vocabulary coincidence, not a derivation relationship.

## 6. Current Qualification Capability

**Criteria** (`packages/core-qualification/src/types.ts:12`): exactly `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT']`. `evaluator.ts:21-43` calls both sequentially with a short-circuit (failing `NEED_DETECTED` skips `EVIDENCE_PRESENT`).

**Inputs**: `evaluateQualificationForOwner(deps, userId, opportunityId, now)` (`service.ts:59-78`) takes only `opportunityId`; internally fetches the `Opportunity` and its `ResearchSignal`s.

**Evidence available**: `Opportunity.needDetected` plus the Prospect's `ResearchSignal`s (via `signals.listByProspect`).

**Extension point**: None exists as a plugin/strategy pattern. Adding a criterion requires direct edits to three files: `types.ts` (extend the criteria tuple), `rules.ts` (new `evaluateX()` function), `evaluator.ts` (call it, fold into result). `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md:333` documents this as an intended, supported extension pattern ("qualification-v1 evaluator versioning already supports adding new criteria without breaking existing ones").

**Access to ServiceProfile**: No. `QualificationDeps` (`service.ts:16-21`) = `{ identity, opportunities, signals, qualifications }` — no `SearchRepository`, no `ServiceProfileRepository`.

**Access to participant `targetCustomer`**: No, for the same reason — the dependency surface itself cannot reach it without adding a new repository dependency (mirroring `OpportunityDeps`, which already includes `searches`).

Precedent for deferring similar decisions exists in the same file: `rules.ts:1-12` explicitly states a confidence/fit threshold and a negative-evidence criterion were deliberately left out of v1 ("no repository contract represents either concept today; inventing one would be a business-rule guess") — the same category of gap category-plausibility falls into.

## 7. R-71 Boundary

**R-71's stated purpose** (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md:161-216`): ensure a detected "need" reflects a genuine, service-relevant business problem, not a topical keyword mention. Its inputs are live `ResearchSignal`s plus a narrowed slice of the Service Profile (`service`, `keywords`, `rationale`, `minProjectValuePaise` via `toServiceRule()` — explicitly **not** `targetCustomer`). Its acceptance criteria concern topic-vs-problem distinction only, never category/audience match.

**As implemented** (`adapters.ts:136-152`, confirmed live):
```text
const TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers']);
```
`targetCustomers` is one of exactly three fields excluded from offer-eligibility/need-detection input, so a topical-field keyword collision cannot spuriously trigger a need. This exclusion exists for the topic-vs-problem axis, not for any category-plausibility purpose.

**Case A vs Case B, per the repository's own evidence**:

- **Case A (no R-71 collision)**: if a future implementation reads `targetCustomers` as input to a new, additive Qualification criterion — without feeding it into `suggestOffers()`/`toOfferSignals()`/need detection — this does not touch `TOPICAL_FIELDS` or R-71's mechanism at all. `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:307` states this directly: such a criterion "would not, on the evidence available, require changing R-71's exclusion rule at all."
- **Case B (R-71 collision)**: if a future implementation instead routed `targetCustomers` (or new category evidence) through need detection (`suggestOffers()`/`toOfferSignals()`) to influence `needDetected`, that would collide with R-71's current exclusion and require an explicit boundary change (same source, line 306).

No document authorizes either routing choice; this remains an open implementation-design question, explicitly flagged as unresolved in the decision doc's own follow-up section.

## 8. Path 1 — New Qualification Criterion

### Concept

```text
Research
   ↓
Category evidence
   ↓
Category plausibility determination
   ↓
Qualification
   ↓
NEW CATEGORY-PLAUSIBLE criterion (conceptual name only, e.g. TARGET_CUSTOMER_MATCH — not approved)
```

### Data Flow

Participant `targetCustomer` would need to reach Qualification's evaluation step, either by (a) adding `searches`/`serviceProfiles` to `QualificationDeps` so it can fetch the Search snapshot itself (mirroring `OpportunityDeps`), or (b) computing the plausibility determination earlier (in Research or Opportunity creation) and persisting a field Qualification can read without a new dependency.

### Required Changes

- `packages/core-qualification/src/types.ts`: extend `QUALIFICATION_CRITERIA`.
- `packages/core-qualification/src/rules.ts`: new rule function comparing evidence to the participant's target category.
- `packages/core-qualification/src/evaluator.ts`: invoke the new rule, fold into state/criteria.
- `packages/core-qualification/src/service.ts`: extend `QualificationDeps` with a repository able to reach `targetCustomer` (new dependency), and pass it through.
- Possibly `packages/core-research/src/*`: no changes strictly required if Research already produces `targetCustomers`/evidence usable as-is; may still want `industry`/`location` populated in `ResearchProviderInput`→`ResearchInput` if richer business-side evidence is desired for the comparison.

### Reusable Existing Components

- `LeadResearch.targetCustomers` and its evidence/confidence/classification fields (already computed, already persisted as `ResearchSignal`s).
- The existing evaluator short-circuit pattern (`evaluator.ts`) and multi-criterion state model.
- `StoredQualification`'s existing per-criterion result shape (extend, not replace).

### New Components Potentially Required

- A new repository dependency on `QualificationDeps` (`searches` or `serviceProfiles`).
- A new rule function encoding the comparison logic between participant `targetCustomer` and business `targetCustomers` evidence.
- Possibly a new stored field to record the plausibility determination if it must be queryable independently of the criterion pass/fail flag.

### Tests Potentially Required

- Unit tests for the new rule function (rules.ts).
- Evaluator-level tests exercising the new criterion in combination with existing `NEED_DETECTED`/`EVIDENCE_PRESENT` short-circuit behavior.
- Service-level tests covering the new dependency wiring.
- Worker integration tests confirming Qualification still receives correct data end-to-end.

### R-71 Interaction

Case A (no collision) as described in §7, provided the new criterion does not route `targetCustomers` through `suggestOffers()`/`toOfferSignals()`.

### Scoring / Ranking Interaction

None identified — scoring/ranking (`core-opportunity`/`core-acquisition`) is architecturally decoupled from Qualification's criteria (see §16). A new criterion could, if a future decision chose to, be wired into scoring later, but nothing in the current code creates that coupling automatically.

### Risks / Unknowns

- Whether `EVIDENCE_PRESENT`'s current logic needs to account for the new criterion's evidence separately.
- Whether a `NOT_QUALIFIED` result from the new criterion should short-circuit like `NEED_DETECTED` does today, or run independently.
- Whether ambiguous/insufficient evidence should be a distinct outcome from a plausibility mismatch (see §11).
- Schema/versioning implications for `StoredQualification` if new fields are persisted.

## 9. Path 2 — Research-Level Plausibility

### Concept

```text
Participant targetCustomer
          ↓
Research
          ↓
Category evidence / plausibility
          ↓
Qualification consumes research result
```

### Data Flow

Participant `targetCustomer` would need to be threaded into the Research call itself — `runResearchForOwner`'s `ResearchProviderInput` would need a new field (or the existing but unused `ResearchInput.industry` would need to actually be populated from `search.parameters.targetCustomer`), so the LLM/provider can produce a plausibility determination as part of its output rather than leaving the comparison for a later stage.

### Required Changes

- `packages/core-research/src/provider.ts`: extend `ResearchProviderInput` with a target-customer/category field.
- `packages/core-research/src/service.ts` (`runResearchForOwner`): source that field from the Search snapshot — requires threading it through from the worker call site.
- `apps/worker/src/searchWorker/worker.ts`: pass `search.parameters.targetCustomer` into the Research call (currently only `{ prospectId }` is passed).
- `packages/core-research/src/schema.ts`: extend `LeadResearch` (or `ResearchInput`) with an explicit plausibility-result shape, distinct from the existing descriptive `targetCustomers` field.
- `packages/core-research/src/prompt.ts` / `anthropicResearchProvider.ts`: incorporate the participant's target category into the prompt and parse/validate the new output field.
- `packages/core-qualification/src/rules.ts`: a (possibly simpler) rule that merely reads the already-computed plausibility result rather than computing it.

### Reusable Existing Components

- The existing `industry`/`location` optional fields in `ResearchInput` and their prompt wiring (currently unused plumbing) could be repurposed, though they are framed today as "supplied, unverified" business-context inputs, not explicitly as a comparison target — reuse would need care not to conflate the two purposes.
- Existing evidence/classification/confidence model (`classification`, `confidence`, `evidence[]`, `basis`).

### New Components Potentially Required

- A new output field/shape in `LeadResearch` explicitly representing a plausibility determination (as opposed to reusing the existing descriptive `targetCustomers` field, which has a different meaning per §5).
- Schema validation for the new field.
- Possibly a distinct `ResearchSignal` kind/field name to avoid conflating with the existing `targetCustomers` observation.

### Tests Potentially Required

- Schema validation tests for the new Research input/output fields.
- Provider/prompt tests confirming the participant's target category is correctly incorporated and the new output field is parsed.
- Worker tests confirming `targetCustomer` is threaded from `search.parameters` into the Research call.
- Qualification tests confirming it correctly consumes the new field.

### R-71 Interaction

Same as Path 1's Case A/Case B framing (§7) applies to whatever new field is produced: it stays outside R-71 as long as it is not routed into `suggestOffers()`/`toOfferSignals()`. Because Path 2 introduces a *new* field (distinct from the existing `targetCustomers`), it would not by itself change `TOPICAL_FIELDS` unless a decision were made to add the new field to that set or to feed it into need detection.

### Scoring / Ranking Interaction

None identified, per the same reasoning as Path 1 (§16) — Research output changes do not automatically reach scoring/ranking, which is a separately wired stage.

### Risks / Unknowns

- Larger surface area than Path 1: touches Research's input contract, worker wiring, prompt content, and provider parsing, in addition to Qualification.
- Introduces a live-provider-facing change (prompt content), which increases the chance of affecting existing Research behavior for fields unrelated to category plausibility if not carefully scoped.
- Requires deciding whether the plausibility determination is deterministic (rule-based on existing evidence) or newly evidence-generating (LLM produces a fresh judgment) — the two have different reliability/testability profiles.

## 10. Path Comparison

| Dimension | Path 1 — Qualification Criterion | Path 2 — Research-Level |
|---|---|---|
| Participant targetCustomer availability | Requires adding a new repository dependency to `QualificationDeps` | Requires threading it from worker → `ResearchProviderInput` (worker already has it in scope) |
| Research changes | None required (can reuse existing `targetCustomers` evidence) | Required: new input field, new/extended output field, prompt changes |
| Qualification changes | Required: new criterion, new dependency, evaluator changes | Required, but narrower: consumes an already-computed field |
| Evidence storage | Reuses existing `ResearchSignal`/`targetCustomers` evidence | Needs a new field/shape to avoid conflating with existing `targetCustomers` meaning |
| New contract required | New Qualification-side dependency contract | New Research input/output contract |
| R-71 interaction | Case A if kept out of need detection (no code change needed) | Case A if kept out of need detection (no code change needed); new field means `TOPICAL_FIELDS` is not directly implicated unless later decided |
| Scoring impact | None identified | None identified |
| Ranking impact | None identified | None identified |
| Opportunity impact | None required (Qualification acts downstream of Opportunity) | None required, unless the new field is also surfaced on `StoredOpportunity` |
| Test impact | Qualification unit/service/evaluator tests | Research schema/prompt/provider tests plus worker wiring tests, plus Qualification consumption tests |
| UI impact | Unclear — depends on whether/where a plausibility result is surfaced | Unclear — same open question |
| Governance required | Yes — criterion definition, pass/fail semantics, R-71 boundary confirmation | Yes — new field semantics, prompt content review, evidence standard, R-71 boundary confirmation |

## 11. Evidence Standard

**Direct evidence**: e.g. a business website explicitly states its own category or customer base ("we are a family restaurant," "serving small business clients").

**Strong indirect evidence**: e.g. website content specific to the expected category exists (menu/reservation content for a restaurant; project-portfolio content for a design agency) without an explicit self-identification statement.

**Weak inference**: e.g. the business name alone suggests a category ("Joe's Cafe") with no corroborating website content.

No document reviewed defines a threshold for which of these should count as a "match" for qualification purposes, whether weak inference alone is sufficient, or how OBSERVED/INFERRED/UNKNOWN classification (the existing Research evidence model) should map onto a plausibility pass/fail/unknown outcome. This is an open question for a future scope-lock (see §13).

## 12. Failure Modes

- **Target customer missing**: not currently possible — `targetCustomer` is a required, validated field on `ServiceProfile` (`validation.ts:104-106,139`), so this failure mode would only arise from a data-integrity issue, not normal operation.
- **Research evidence missing**: `targetCustomers` (or a new plausibility field) may be absent/UNKNOWN if the source document didn't support a claim — needs a defined behavior (e.g. does Qualification treat this as fail, pass, or a third "insufficient evidence" state).
- **Ambiguous category**: evidence supports multiple plausible categories at once — needs a defined resolution rule.
- **Contradictory evidence**: multiple signals disagree — needs a defined precedence/confidence-weighting rule.
- **Generic business website**: no category-specific content at all — likely falls under "insufficient evidence."
- **Wrong business type**: evidence clearly contradicts the participant's target — needs a defined "definite mismatch" outcome, distinct from "insufficient evidence."
- **Insufficient source content**: Research couldn't fetch/parse enough of the business's web presence — same class as "evidence missing."
- **Research provider failure**: existing Research error-handling paths would apply; whether a plausibility determination should default to a specific state on provider failure is undecided.

No document authorizes specific handling for any of these; they are listed as cases a future scope-lock must resolve, not resolved here.

## 13. Required Product Decisions

1. Should category plausibility be a Qualification criterion (Path 1), a Research-level determination consumed by Qualification (Path 2), or something else?
2. What is the conceptual name and exact semantics of the new criterion/field, if any (e.g. is `TARGET_CUSTOMER_MATCH` the right name/shape)?
3. Should ambiguous or insufficient category evidence produce a distinct `UNKNOWN` outcome rather than an automatic pass or fail?
4. What evidence threshold (direct / strong indirect / weak inference, per §11) constitutes a "match"?
5. Should a category mismatch prevent Opportunity creation, or only prevent Qualification from passing (i.e., does Discovery/Opportunity stay unchanged and only Qualification gates on it)?
6. Should category plausibility affect scoring or ranking, or remain isolated from those stages (current architecture keeps them decoupled; a product decision could choose to couple them later)?
7. Should the plausibility determination be persisted as its own field/row, or only exist as a transient Qualification-evaluation input?
8. Should the participant's exact `targetCustomer` string be passed into Research verbatim, or normalized/structured first?
9. How should multiple target segments (if `targetCustomer` ever becomes multi-valued) be evaluated?
10. What happens when a business plausibly belongs to multiple segments, only one of which matches the participant's target?
11. Should the new field/criterion feed into need detection (Case B, §7) at all, ever — or should R-71's current exclusion boundary be treated as permanent for this concept?
12. Should the existing `targetCustomers` (plural, descriptive) field be reused for the comparison, or should a new, distinct field be introduced to avoid conflating "who the business serves" with "does the business match the user's target" (per §5's disambiguation)?

## 14. Explicit Non-Goals

- Discovery query redesign.
- Discovery category filtering.
- Scoring changes.
- Ranking changes.
- R-70 changes.
- R-71 changes.
- Opportunity state-machine redesign.
- Outreach.
- CRM.
- Live validation.
- Provider changes (Google Places, Anthropic research provider configuration).

## 15. Implementation Authorization

```text
NO IMPLEMENTATION AUTHORIZED
```

This document only defines the scope decision surface.

## 16. MVP Status

```text
MVP ENGINEERING EXIT:
SATISFIED

OPTION B:
DECIDED

OPTION B IMPLEMENTATION:
NOT AUTHORIZED
```

## 17. Repository Safety

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
Pre-existing untracked files (untouched by this task):
  .claude/, CLAUDE.md, requirement/*.md (existing set)
New file added by this task:
  requirement/OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md
No git add/commit/push/reset/restore/checkout/clean/stash performed.
No application run, no search created, no Google Places calls, no Anthropic API calls, no migrations, no database modifications.
```
