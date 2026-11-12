# Path 2 — Research-Level Category Plausibility Scope Lock

## 1. Status

```text
PRODUCT DECISION:
PATH 2 — RESEARCH-LEVEL PLAUSIBILITY

SCOPE:
PREPARED

IMPLEMENTATION:
NOT AUTHORIZED
```

## 2. Objective

Define, precisely enough to scope-lock a future implementation, what Path 2 means: Research (not Qualification, not Discovery) becomes responsible for producing a category-plausibility determination by comparing the participant's `ServiceProfile.targetCustomer` against evidence about the discovered business, and Qualification consumes that determination. This document does not implement Path 2. It defines the contract surface, the open product decisions, and the boundaries that must not be crossed (R-71, scoring, ranking, Discovery, Opportunity state machine) so that a future implementation task can proceed without re-deriving this analysis.

## 3. Accepted Architecture

```text
ServiceProfile.targetCustomer
        ↓
Research
        ↓
Category plausibility
        ↓
Qualification
```

This is the Path 2 shape selected in `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §5. It is fixed for this document; Path 1 is not reconsidered here.

## 4. Current Architecture Gap

Per the prior scope analysis (`requirement/OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md` §3–§5), the current runtime has no channel connecting the participant's `targetCustomer` to Research at all:

- `ResearchProviderInput` (`packages/core-research/src/provider.ts:11-16`) — the type actually constructed and passed to the provider — contains exactly `prospectId`, `companyId`, `companyName`, `normalizedDomain`. No participant context.
- The wider `ResearchInput` Zod schema (`packages/core-research/src/schema.ts:207-224`) has optional `industry`/`location` fields already wired into the LLM prompt (`prompt.ts:36,55-56`, rendered as "Industry (supplied, unverified): ...") but **no caller in the codebase sets them today** — this is unused plumbing, not a wired path.
- The worker's Research call (`apps/worker/src/searchWorker/worker.ts:358-368`) passes only `{ prospectId }`, even though `runCanonicalPipeline` holds the full `search.parameters.targetCustomer` in scope.
- `LeadResearch` (`schema.ts:176-201`) already produces a `targetCustomers` (plural) field, but per `adapters.ts:136-152` this means "who the discovered business itself serves" — a fact about the business, not a comparison to the participant's intent. No code computes such a comparison today.

Path 2 must close this gap: thread `targetCustomer` into Research's input, and add a genuinely new output — not repurpose the existing `targetCustomers` field, which has a different, already-established meaning.

## 5. Target Customer Data Flow

1. **Origin**: `ServiceProfile.targetCustomer: string`, `packages/core-service-profile/src/types.ts:10-14` — free text, participant-authored, one of four user-authored MVP fields.
2. **Persisted**: Postgres `target_customer` column, `packages/core-service-profile/src/pgRepository.ts:49,95,123`; required non-empty, validated in `validation.ts:104-106,139`.
3. **Search snapshot**: copied verbatim, immutably, into `StoredSearch.parameters` at Search-creation time (`packages/core-search/src/service.ts:82-90`).
4. **Worker access**: `runCanonicalPipeline(deps, search: StoredSearch)` (`apps/worker/src/searchWorker/worker.ts:327-451`) holds `search.parameters.targetCustomer` in scope throughout the pipeline run — this is the point from which Path 2 must draw the value.
5. **Current stop point**: Discovery's `buildQuery()` (`packages/core-discovery/src/googlePlacesProvider.ts:11-15`) is the only place `targetCustomer` is read today; it is not forwarded past Discovery.
6. **Path 2 requirement**: the worker's Research call must be extended to pass `targetCustomer` (or a value derived from it) into whatever new field is added to `ResearchProviderInput`.

## 6. Research Input Contract

**Existing**: `ResearchProviderInput` (`provider.ts:11-16`): `{ prospectId, companyId, companyName, normalizedDomain }`. Actually constructed by `runResearchForOwner` (`service.ts:76-81`) and passed to `deps.provider.research(...)`.

**Reusable**: the wider `ResearchInput` schema's optional `industry`/`location` fields (`schema.ts:207-224`) already have prompt wiring (`prompt.ts:36,55-56`) that frames operator-supplied context as unverified/INFERRED-at-best — this framing pattern is directly reusable for how a participant-supplied `targetCustomer` should be presented to the model (i.e., as stated intent, not verified fact).

**New**: a field conceptually carrying the participant's target-customer intent needs to be added to `ResearchProviderInput` (so it survives the `runResearchForOwner` → provider boundary) and to `ResearchInput` (so the prompt builder can render it). Whether this reuses/extends the existing `industry` field or is a wholly new field (e.g. `targetCustomerIntent`) is a **PRODUCT/DESIGN DECISION REQUIRED** — the existing `industry` field's documented framing ("supplied, unverified") is close in spirit but was not designed with a plausibility-comparison purpose in mind, and conflating the two risks ambiguity for future maintainers.

**Provider-independent contract implications**: `ResearchProviderInput`/`ResearchInput` are provider-agnostic types (the Anthropic provider is one implementation of `ResearchProvider`). Adding a `targetCustomer`-carrying field at this layer, rather than inside the Anthropic-specific provider, is consistent with future multi-provider compatibility (a concern already tracked in `requirement/MULTI_MODEL_RESEARCH_PROVIDER_*` documents) — any new field should live in the shared contract, not in `anthropicResearchProvider.ts` alone.

**Worker wiring implications**: `worker.ts:358-368`'s Research call must change from `{ prospectId }` to include the new field, sourced from `search.parameters.targetCustomer`.

**Test implications**: `worker.test.ts` fixtures already distinguish `targetCustomer` (ServiceProfileFields fixtures) from `targetCustomers` (LeadResearch fixtures) as separate concepts (lines 528/616/1258 vs. 565/599/1289) — a new field would extend this fixture pattern, not replace it.

This section documents implications only. No interface change is made by this document.

## 7. Research Output Contract

Candidate locations for the plausibility result, evaluated on repository evidence:

| Candidate | Advantages | Constraints | Downstream availability | Persistence implications |
|---|---|---|---|---|
| New field on `LeadResearch` (`schema.ts:176-201`) | Follows the existing pattern every other Research fact uses (uniform `classification`/`confidence`/`evidence[]`/`basis` model already applies structurally to every field) | Must be named distinctly from the existing `targetCustomers` field to avoid the exact conflation this document is written to prevent (§4) | Naturally flows into `ResearchSignal` persistence and is visible to Qualification via `signals.listByProspect`, same as every other field | Persisted as a new `ResearchSignal` row (`field='<newName>'`), consistent with existing rows |
| New `ResearchSignal` kind, separate from the generic per-field pattern | Could carry a richer structure (matched segment, MATCH/MISMATCH/UNKNOWN state) than the uniform evidence model supports today | Would require a new persistence shape not currently modeled by `ResearchSignal`'s existing field-per-row pattern | Same repository access path as above, but with a bespoke shape | Larger schema change than reusing the existing `LeadResearch` field pattern |
| Research metadata (outside `LeadResearch`, e.g. attached to the Research run itself) | Decouples plausibility from the per-field evidence model entirely | No existing metadata-at-the-run-level construct was found in the traced code — this would be a new concept, not an extension of an existing one | Would need new plumbing to reach Qualification (no evidence today of a metadata-level channel to Qualification) | Undefined — no existing precedent |
| Separate category-plausibility result object, produced by Research but not part of `LeadResearch` at all | Cleanest separation from the existing evidence model | No existing precedent in the codebase for a Research output shape outside `LeadResearch` | Would require new wiring, comparable in size to the "new `ResearchSignal` kind" option | Undefined — no existing precedent |

**Recommendation is not made here** (this document defines options, not the choice) — but the first option ("new field on `LeadResearch`, following the existing uniform evidence model, distinctly named from `targetCustomers`") is the one most directly supported by existing repository patterns and requires the least new machinery. Selecting among these remains a **PRODUCT DECISION REQUIRED** (§21, item 5).

**Explicit exclusions, regardless of which location is chosen**: the new output must not be treated as a Need Detection signal, an Offer signal, part of `StoredOpportunity`'s scoring inputs, or a ranking factor. Nothing in the current codebase couples Research's field set to `suggestOffers()`/`toOfferSignals()` automatically — inclusion in `TOPICAL_FIELDS` (`adapters.ts:152`) is an explicit, opt-in set, and the new field must not be added to it without a separate decision (see §11).

## 8. Category Plausibility Semantics

Per repository evidence, no existing code defines a MATCH/MISMATCH/UNKNOWN model for category plausibility — the closest existing pattern is `LeadResearch`'s `classification` enum (`OBSERVED`/`INFERRED`/`UNKNOWN`, `schema.ts:20-22`), which is a *evidence-quality* classification applied uniformly to every field, not a plausibility *result*. The three states below are the requested model; nothing in the repository contradicts them, but nothing in the repository has implemented them either — this is new semantics, not a discovered fact.

**MATCH** — evidence supports that the business belongs to at least one participant target segment.

**MISMATCH** — evidence supports that the business is outside all participant target segments.

**UNKNOWN** — available evidence is insufficient, ambiguous, inaccessible, or contradictory.

No numerical scoring is introduced. `OpportunityScore` (`packages/core-opportunity/src/service.ts:264-338`) and its factor-weight model are untouched by this semantics definition — category plausibility is not proposed as, and must not become, an eighth scoring factor without separate authorization (§17, §20).

## 9. Evidence Standard

| Tier | Examples | Sufficiency for MATCH/MISMATCH |
|---|---|---|
| Tier 1 — Direct evidence | Business explicitly self-identifies as a restaurant/hotel/retailer/e-commerce business on its official site | Sufficient basis for MATCH or MISMATCH, at the strongest confidence the existing `classification: OBSERVED` model supports |
| Tier 2 — Strong contextual evidence | Menus/reservations (restaurant), booking/accommodation info (hotel/resort), catalogue/cart flow (retailer/e-commerce), tour/package booking pages (tour operator) | Plausible basis for MATCH or MISMATCH, but weaker than Tier 1 — whether it alone is sufficient is a **PRODUCT DECISION REQUIRED** |
| Tier 3 — Weak inference | Business name sounds like a restaurant; generic directory categorization; inferred industry from ambiguous wording | This corresponds most closely to the existing `classification: INFERRED` tier. **Whether Tier 3 alone is sufficient for MATCH or MISMATCH is a PRODUCT DECISION REQUIRED.** Relevant precedent: `packages/core-qualification/src/rules.ts`'s `isEvidentiary()` treats only `OBSERVED` as evidentiary for the existing `EVIDENCE_PRESENT` criterion (per the Scenario E/Option C decision) — if that precedent is followed, Tier 3 alone would *not* suffice, but no document extends that precedent to category plausibility specifically. |

No final threshold is set by this document.

## 10. Multiple Target Segments

The participant profile that exposed this issue used a single, unparsed compound string: `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"` (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:22,54`). Confirmed in code: `ServiceProfileFields.targetCustomer` is typed as a single `string` (`packages/core-service-profile/src/types.ts:10-14`) with no delimiter-based structure recognized anywhere in Discovery's query construction — the entire string is inserted verbatim into one clause (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:116`: "the three participant-supplied segments... are not parsed into separate terms, not deduplicated against each other, and not weighted individually").

Conceptual handling required, none of it decided by existing governance:

- **One target segment**: straightforward — evidence is compared against a single category.
- **Multiple target segments**: requires either (a) Research/Qualification parsing the compound string into discrete segments, or (b) treating the whole string as one composite target and evaluating evidence against it holistically. Both are undecided.
- **MATCH to one segment (of several)**: does an overall MATCH require matching only one segment, or is partial matching itself an UNKNOWN/ambiguous case? Undecided.
- **MATCH to multiple segments**: if a business plausibly fits more than one participant segment, is that simply a stronger MATCH, or does it need to be recorded per-segment? Undecided.
- **MATCH to none**: this is the MISMATCH case, straightforwardly, once "target segment" boundaries are defined — but that definition itself is what's undecided.
- **Ambiguous evidence**: falls under UNKNOWN by the definitions in §8, but the multi-segment context increases the likelihood of this state (evidence might support one segment weakly while contradicting another).

No segment weighting or ranking between segments is introduced by this document, per instruction. Whether Path 2 requires segment parsing at all — and if so, where it would occur (Research prompt-time, or a pre-processing step before Research) — is itself a **PRODUCT DECISION REQUIRED** (§21, item 3); this document does not implement parsing and flags the ambiguity it introduces (a parsed segment might not map cleanly onto how the participant intended the phrase to be read, e.g. "Boutique Retailers & E-commerce Brands" as one segment vs. two).

## 11. R-71 Boundary

```text
R-71:
UNCHANGED
```

Verified against `packages/core-qualification/src/adapters.ts:136-152`: `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` — this set governs exclusion from `suggestOffers()`/`toOfferSignals()` (need/offer detection) for the topic-vs-problem relevance purpose R-71 was designed for. Category plausibility, as scoped in this document, is a **separate concept** from topic-vs-problem relevance:

- Category plausibility answers "does this business belong to the participant's target audience?"
- R-71 answers "does a detected problem-claim reflect a genuine, service-relevant issue, as opposed to a topical keyword mention?"

The new Research output field defined in §7 is **not** added to `TOPICAL_FIELDS`, and is **not** routed through `toOfferSignals()`/`suggestOffers()`, by this scope lock. This keeps category plausibility structurally separate from R-71's mechanism, consistent with `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:307`'s finding that an additive field/criterion "would not, on the evidence available, require changing R-71's exclusion rule at all." R-70 is likewise untouched — no code path traced in this or prior documents connects R-70 (source-to-business attribution) to category plausibility.

## 12. Qualification Boundary

```text
Research
    ↓
Category plausibility (new output field, §7)
    ↓
Qualification
```

Two options exist, per `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §5 (Path 2 analysis):

- **Option A** — Qualification consumes the result only as additional evidence (e.g., read but not gated on, surfaced for participant review).
- **Option B** — Qualification eventually introduces a dedicated criterion (extending `QUALIFICATION_CRITERIA`, currently `['NEED_DETECTED', 'EVIDENCE_PRESENT']`, `packages/core-qualification/src/types.ts:12`) that reads the new Research field.

Neither is chosen by this document.

```text
FOLLOW-UP PRODUCT DECISION REQUIRED
```

This scope lock defines only the Research output (§6–§9); it does not authorize a Qualification redesign. Whichever option is eventually chosen, `QualificationDeps` (`service.ts:16-21`) has no dependency today capable of reaching `ServiceProfile`/`targetCustomer` directly — but Path 2's design (comparison happens in Research, not Qualification) means Qualification only needs to read the new Research-produced field via the existing `signals.listByProspect` path, not add a new repository dependency of its own. This is a structural advantage of Path 2 over Path 1, consistent with the minimal-change-surface comparison in `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §12.

## 13. Opportunity Boundary

Two placements were analyzed in `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §11:

```text
Discovery → Research + category plausibility → Opportunity → Qualification
```

versus

```text
Discovery → Research + category plausibility → reject before Opportunity
```

**Current architecture supports the first (Opportunity created regardless, category plausibility evaluated as part of/after Research, consumed at Qualification time) without any Opportunity state-machine change.** `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) and Qualification (`evaluateQualificationForOwner`, `packages/core-qualification/src/service.ts:59-78`) already run as independent, separately-invoked steps — `StoredOpportunity` (`types.ts:40-59`) has no category field today and this document does not add one.

The second placement (rejecting before Opportunity creation) is not supported by any traced code path and is not implied by Path 2's definition in `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` — Path 2 is described there as "Qualification consumes research result," implying Opportunity creation is unconditional and Qualification is the gating point, consistent with the current architecture.

```text
PRODUCT DECISION REQUIRED — only if a future decision wants to move the gate earlier than Qualification; not required for the placement this document scopes.
```

The current MVP Opportunity state machine is not modified by this document.

## 14. Failure / UNKNOWN Semantics

Distinguishing **UNKNOWN category** (a valid plausibility result, per §8) from **Research execution failure** (the pipeline could not produce a result at all) is required — the two are not the same:

| Case | Category | Notes |
|---|---|---|
| Missing `targetCustomer` | N/A — not currently possible; `targetCustomer` is a required, validated `ServiceProfile` field (`validation.ts:104-106,139`) | Would only occur from a data-integrity issue, not normal operation |
| Research execution failure (provider error, timeout, unavailable, invalid response) | Research execution failure, not UNKNOWN category | Existing Research error-handling paths apply; this document does not modify provider error handling or introduce retry behavior, per instruction |
| No evidence found for the business | UNKNOWN category | Business website exists but contains no category-identifying content |
| Conflicting evidence | UNKNOWN category | Multiple signals disagree — precedence/resolution rule is a **PRODUCT DECISION REQUIRED** |
| Ambiguous business (plausibly multiple categories) | UNKNOWN or MATCH, depending on the multi-segment resolution chosen in §10 | Undecided pending §10/§21 |
| Provider timeout / provider unavailable | Research execution failure | Not a plausibility state; existing provider failure handling governs this, unmodified |
| Invalid research response (schema validation failure) | Research execution failure | Existing `ResearchInput`/`LeadResearch` Zod validation already handles malformed provider output at the schema level; this document does not change that validation |

This document does not invent retry behavior and does not modify provider error handling, per instruction.

## 15. Persistence

**Required for MVP implementation** (if/when authorized):
- The plausibility result itself (MATCH/MISMATCH/UNKNOWN) — needed for Qualification to read it (§12) and for participant review (§16).
- Supporting evidence, reusing the existing `evidence[].quote/sourceUrl/sourceLabel` shape (`schema.ts:31-57`) already applied to every `LeadResearch` field — no new evidence model needed if the "new field on `LeadResearch`" option from §7 is chosen.
- `classification`/`confidence`/`basis`, reusing the existing uniform model, same rationale.

**Optional future enhancement** (not required for a minimal Path 2 implementation):
- Which specific target segment was matched (relevant only once §10's multi-segment handling is decided).
- A distinct "reason" field beyond what `evidence[]`/`basis` already capture.
- Freshness/re-evaluation timestamp tracking beyond whatever staleness mechanism `StoredOpportunity` already uses (`staleness`/`stalenessComputedAt`, `packages/core-opportunity/src/types.ts:40-59`) — whether category plausibility should participate in that staleness model at all is undecided.

No schema is finalized by this document; existing governance does not already define one.

## 16. User-Facing Behavior

Not modified by this document. For a future implementation, minimum candidates to consider:

- The category result (MATCH/MISMATCH/UNKNOWN).
- Matched target segment, if/when §10 is resolved.
- Supporting evidence (quote/source), reusing the existing evidence display pattern already used elsewhere for Research signals.
- A human-readable reason, if a distinct "reason" field is added (§15).
- An explanation for UNKNOWN (e.g., "insufficient evidence found on business website").

```text
UI DECISIONS UNRESOLVED — no frontend requirement is created by this document beyond noting these candidates exist.
```

## 17. Scoring / Ranking Boundary

```text
OpportunityScore:
UNCHANGED

FACTOR_WEIGHTS:
UNCHANGED

Ranking:
UNCHANGED
```

Confirmed per `packages/core-opportunity/src/service.ts:264-401` and `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`: scoring/ranking is an independently authorized, separately-gated worker step (`worker.ts:385-395`) with no data dependency on Research's field set or Qualification's criteria in either direction. Category plausibility, as scoped here, is not wired into scoring and must not silently become a scoring factor. Any future decision to have category fit affect ranking requires separate, explicit authorization — not implied or granted by this document.

## 18. Test Scope

**Unit tests** (future, not written here): `targetCustomer` propagation from `ServiceProfileFields`/`StoredSearch` into the new Research input field; category-result parsing/validation; MATCH; MISMATCH; UNKNOWN; multiple segments; ambiguous evidence; contradictory evidence.

**Provider contract tests**: confirm `targetCustomer` reaches the provider via the new input field; confirm a structured category result is returned and validated; confirm malformed provider output for the new field is handled by existing schema validation, not a new bespoke path.

**Integration tests**: confirm the real worker (`apps/worker/src/searchWorker/worker.ts`) passes participant `targetCustomer` into the Research call; confirm Research produces the new plausibility field; confirm the result reaches Qualification via the existing `signals.listByProspect` path.

**E2E** (future): a full product-path test proving `DEFINE → FIND → RESEARCH → CATEGORY PLAUSIBILITY → OPPORTUNITY → QUALIFICATION → DISPLAY`, once UI (§16) is resolved.

No tests are written by this document.

## 19. Acceptance Criteria

```text
AC-01
Participant targetCustomer reaches Research without loss.

AC-02
Research receives both business context and participant targetCustomer.

AC-03
Research returns a category plausibility result using the approved semantic model (MATCH/MISMATCH/UNKNOWN, §8).

AC-04
MATCH / MISMATCH / UNKNOWN are distinguishable in the persisted result.

AC-05
Supporting evidence is attributable to a source, reusing the existing evidence[] shape.

AC-06
Category plausibility remains separate from R-71 Need/Offer Detection — the new field is not added to TOPICAL_FIELDS and is not routed through suggestOffers()/toOfferSignals().

AC-07
Scoring and ranking remain unchanged — no new scoring factor, no FACTOR_WEIGHTS change.

AC-08
Existing MVP behavior remains unchanged outside the authorized scope (Discovery, R-70, Opportunity state machine, existing Qualification criteria all unaffected).

AC-09
Failure and UNKNOWN states are distinguishable (§14) — a Research execution failure must not be silently recorded as an UNKNOWN category result.

AC-10
The real worker path (apps/worker/src/searchWorker/worker.ts) is covered by integration testing, not only unit tests on isolated functions.
```

These are scope-lock candidates for a future implementation task, not implementation instructions executed here. Any criterion whose exact threshold or semantics is undecided (evidence tier sufficiency, multi-segment handling, Qualification consumption mode, persistence schema) is marked as such in the relevant section above and repeated in §21.

## 20. Implementation Boundary

**In scope for a future Path 2 implementation**:
```text
ResearchProviderInput
Research worker wiring (apps/worker/src/searchWorker/worker.ts, the Research call site)
Research provider prompt/schema (packages/core-research/src/prompt.ts, schema.ts, anthropicResearchProvider.ts)
Research result contract (LeadResearch or the new output location chosen per §7)
Research persistence (ResearchSignal, if that's the chosen location)
Qualification consumption (reading the new field; NOT a new QualificationDeps repository dependency, per §12)
Relevant tests for all of the above
```

**Explicitly excluded**:
```text
Discovery provider (googlePlacesProvider.ts)
Discovery query construction (buildQuery())
Discovery category filtering
R-70
R-71 (TOPICAL_FIELDS, suggestOffers(), toOfferSignals())
Scoring algorithm (scoreOpportunity/scoreOpportunityForOwner)
FACTOR_WEIGHTS
Ranking (rankOpportunities)
Outreach
CRM
```

**Unresolved, marked separately rather than assumed in scope**: whether Opportunity creation itself needs any change (§13 concludes it does not, for the placement this document scopes) and whether Qualification needs a new criterion vs. consuming the result as evidence (§12, FOLLOW-UP PRODUCT DECISION REQUIRED).

## 21. Required Product Decisions

1. Exact MATCH/MISMATCH/UNKNOWN evidence threshold (§9) — is Tier 2 alone sufficient, or is Tier 1 required?
2. Whether Tier-3 (weak inference) can ever produce MATCH or MISMATCH, or only ever UNKNOWN (§9).
3. Multiple target-segment semantics (§10) — whether/where the compound `targetCustomer` string is parsed, and how partial/multi-segment matches are resolved.
4. Whether the category result is persisted beyond the minimal MVP set in §15, and with what schema.
5. Exact Research output contract location (§7) — new `LeadResearch` field vs. new `ResearchSignal` kind vs. metadata vs. separate result object.
6. Whether Qualification gets a new criterion (Option B, §12) or consumes the result only as evidence (Option A, §12).
7. Whether category mismatch prevents Qualification only, or (a separate, currently unsupported placement) prevents Opportunity creation (§13).
8. UI evidence display — what the participant sees, and how UNKNOWN is explained (§16).
9. Freshness/research re-evaluation semantics — whether category plausibility participates in the existing staleness model (§15).
10. Confirmation that category plausibility remains permanently outside R-71, or whether a future decision might route it through need detection (Case B in the original scope document) — this document assumes permanent separation (§11) but flags that as the currently-scoped default, not an irreversible constraint absent a future explicit decision to change it.
11. Confirmation that scoring/ranking remain unchanged (§17) — this document assumes so; any future coupling requires separate authorization.

## 22. Explicit Non-Goals

- Discovery query redesign.
- Discovery category filtering.
- R-70 modification.
- R-71 modification.
- Scoring changes.
- Ranking changes.
- OpportunityScore changes.
- Outreach.
- CRM.
- Provider replacement.
- Live validation during implementation.

## 23. Implementation Authorization

```text
NOT AUTHORIZED
```

## 24. MVP Status

```text
MVP ENGINEERING EXIT:
SATISFIED

CATEGORY PLAUSIBILITY:
OPTION B

SELECTED PATH:
PATH 2 — RESEARCH-LEVEL

IMPLEMENTATION:
NOT AUTHORIZED
```

## 25. Repository Safety

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
Pre-existing untracked files (untouched by this task, including the two
prior Option B governance documents, which were not modified):
  .claude/, CLAUDE.md, requirement/*.md (existing set, incl.
  OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md,
  OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md)
New file added by this task:
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md
No git add/commit/push/reset/restore/checkout/clean/stash performed.
No application/web/worker process started, no search created, no Google Places calls, no Anthropic API calls, no migrations, no database modifications.
```
