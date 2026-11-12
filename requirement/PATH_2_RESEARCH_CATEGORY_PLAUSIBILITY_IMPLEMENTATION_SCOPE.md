# PATH 2 — RESEARCH-LEVEL CATEGORY PLAUSIBILITY
# IMPLEMENTATION SCOPE

```text
IMPLEMENTATION: NOT AUTHORIZED
STATUS: SCOPE PREPARATION ONLY
```

## 1. Status

```text
PRODUCT DECISION:
OPTION B — RESEARCH / QUALIFICATION-OWNED
PATH 2 — RESEARCH-LEVEL PLAUSIBILITY

SCOPE:
PREPARED (implementation-ready boundaries; open product decisions listed)

IMPLEMENTATION:
NOT AUTHORIZED
```

## 2. Governing Decisions

This document is downstream of, and does not revisit:
- `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` — Option B selected (Research/Qualification-owned, not Discovery).
- `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` — Path 2 selected over Path 1.
- `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` — the prior conceptual scope lock for Path 2, whose terminology (MATCH/MISMATCH/UNKNOWN, evidence tiers, R-71/scoring boundaries) is preserved and reused verbatim here, now grounded in a deeper trace of the actual persistence/evidence mechanics.
- `requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, `requirement/PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`, `requirement/PHASE_24_R70_R71_DECISION.md` — R-70/R-71 definition and implementation.
- `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` — scoring/ranking as a separately authorized, decoupled pipeline stage.
- `requirement/MVP_SCOPE_BOUNDARY.md` and the PRD V2.2 — no category-match criterion is currently defined for any stage.

This document does not reinterpret or expand any of the above. It does not authorize implementation.

## 3. Current Architecture

**Research is already multi-provider**, a fact not surfaced in the prior scope-lock document and material to this implementation scope: `packages/core-research/src/researchModelFactory.ts` is "the ONE place in the codebase allowed to branch on provider identity" (its own header comment), selecting among `anthropic`/`openai`/`gemini` adapters and returning a single provider-neutral `ResearchModel` interface (`researcher.ts:44-56`). Everything above that factory — `researchLead()` (`researcher.ts:151-293`), `schema.ts`, `provenance.ts`, `ResearchProvider`, and every downstream package — is provider-unaware. Any new input/output field must be added at the shared-contract layer (`schema.ts`, `provider.ts`), never inside a provider-specific adapter, or it silently breaks for two of the three configured providers.

**The orchestration loop** (`researcher.ts:151-293`, `researchLead()`) already does, generically, for every field in `LeadResearch`:
- Retries transient provider failures with jittered backoff, distinct from validation-failure repair (lines 190-292).
- Validates the model's raw output against `leadResearchSchema` (`schema.ts`).
- Verifies provenance — that OBSERVED claims' quotes/URLs are real, drawn from `input.sourceDocuments`, not invented (`verifyProvenance`, line 253).
- On a schema or provenance failure, asks the model to repair only the failing subtree, not regenerate the whole document (`planRepair`/`applyRepair`).

This machinery is field-agnostic in the sense that it operates on whatever `leadResearchSchema` currently defines — a new field participates in retry/validate/repair/provenance-check automatically once it exists in the schema. It is **not** agnostic in a second sense that matters for this scope: two downstream mapping functions enumerate fields by a **hardcoded literal list**, not reflectively:

- `allObservations()` (`schema.ts:229-244`) — lists exactly `companySummary`, `businessModel`, `targetCustomers` as single-value fields and six named list fields. A new field is invisible to this function, and therefore to everything built on it, until explicitly added here.
- `FIELD_KIND` (`persist.ts:38-48`) — maps each named field to a `ResearchSourceKind` (`WEBSITE`/`NEWS`/`TECH_STACK`/etc.) for the scorer; a field absent from this map falls back to `'WEBSITE'` (line 81, `?? 'WEBSITE'`) rather than erroring, so omission is silent, not a build failure.

**Two parallel persistence adapters exist**, both built on `allObservations()`, serving different consumers:

1. `packages/core-research/src/mapping.ts` (`toNewResearchSignals`) → `NewResearchSignalInput` → `ResearchSignalRepository` (`repository.ts:13-28`) — this is the live MVP path. `runResearchForOwner` (`service.ts:62-...`) uses this; the worker (`apps/worker/src/searchWorker/worker.ts`) and Qualification (via `signals.listByProspect`) consume from this table. Every `Observation` (including UNKNOWN ones) becomes one `NewResearchSignalInput`, unfiltered, preserving raw `classification`/`confidence`/`basis`/full `evidence[]` — explicitly documented (`mapping.ts:5-14`) as intentionally different from `persist.ts`'s adapter, per "PRD V2.1 EVIDENCE MODEL / AC-12."
2. `packages/core-research/src/persist.ts` (`toResearchRows`/`storeResearch`) → `acq_lead_research` rows / `ResearchRepository` — an older/parallel adapter that drops UNKNOWN observations, halves INFERRED confidence, and keeps only the first evidence source. Whether this path is still live-wired into the current worker pipeline was not re-verified in this task (out of scope to re-trace the full worker wiring a second time); it is documented here because a new field must be considered against **both** adapters if both are active, and against at least the first (confirmed live) if only one is.

**Freshness/rerun mechanism**: both persistence paths use a supersede-then-insert pattern — `ResearchSignalRepository.supersedePrevious(prospectId, at)` marks every currently-active signal for a Prospect as superseded (not deleted) before new rows are inserted (`repository.ts:13-18`); `persist.ts`'s `storeResearch()` does the same for its own table (`persist.ts:136-157`, "old rows must stop counting before the new ones start, or the scorer briefly sees both and double-counts"). This is a generic, field-agnostic mechanism — a re-run of Research automatically supersedes a stale plausibility observation the same way it supersedes any other field's stale observation, once the new field participates in `allObservations()`.

## 4. Confirmed Data-Flow Gap

Unchanged from the prior scope-lock document (`PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §4), reconfirmed here:

- `ResearchProviderInput` (`provider.ts:11-16`) carries `prospectId`, `companyId`, `companyName`, `normalizedDomain` only.
- `ResearchInput` (`schema.ts:207-224`) has unused `industry`/`location` optional fields — wired into the prompt (`prompt.ts:36,55-56`) but populated by no caller.
- The worker's Research call (`worker.ts:358-368`) passes only `{ prospectId }`, despite `runCanonicalPipeline` holding `search.parameters.targetCustomer` in scope.
- `LeadResearch.targetCustomers` (`schema.ts:176-201`) means "who the discovered business serves," not a comparison to the participant's intent (`adapters.ts:136-152`).

No code path compares participant `targetCustomer` to any business-side evidence today.

## 5. Proposed Input Boundary

**Smallest viable contract**: add one new field to `ResearchProviderInput` and `ResearchInput` carrying the participant's target-customer intent, sourced from `search.parameters.targetCustomer` and threaded through the worker's Research call site (`worker.ts:358-368`) and `runResearchForOwner` (`service.ts`).

**Raw string vs. structured/normalized representation** — this is the multi-segment question (§12) restated at the input boundary:

- **Option I-A (raw string passthrough)**: pass `search.parameters.targetCustomer` verbatim, exactly as Discovery's `buildQuery()` already does (`googlePlacesProvider.ts:11-15`) — the smallest possible change, consistent with the existing `industry`/`location` fields' own framing as unverified, operator-supplied text (`prompt.ts:36`, "supplied, unverified"). The LLM would then be responsible for interpreting a compound, semicolon-delimited string like `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"` unaided.
- **Option I-B (pre-parsed/structured)**: split the string into discrete segments before it reaches Research (e.g. an array of target-segment strings). No existing code performs this parsing anywhere in the traced pipeline — this would be new logic, and its exact splitting rule (on `;`? on `,`? both, with what precedence — note the example string uses `,` *within* a segment, "Restaurants, Cafes," and `;` *between* segments) is undefined by any document.

```text
REQUIRES EXPLICIT PRODUCT AUTHORIZATION — Option I-A vs I-B is not decided by this document.
```

Given `ResearchModelConfig`/the shared-contract constraint in §3, whichever option is chosen must live in `provider.ts`/`schema.ts`, not inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` individually.

## 6. Proposed Output Contract

**PROPOSED — NOT AUTHORIZED**

Smallest new output needed to express MATCH/MISMATCH/UNKNOWN: one new `Observation`-shaped field on `LeadResearch`, distinct from `targetCustomers`, e.g. conceptually `targetCustomerPlausibility` (name not approved) — reusing the existing `Observation` type's `classification`/`confidence`/`evidence[]`/`basis`/`value` shape (`schema.ts`) rather than inventing a new shape. This is directly supported by the existing architecture: `Observation` is already generic enough to carry any single claim uniformly.

For this to actually reach persistence and every downstream consumer, three specific, concrete edits are required (not automatic, per §3's correction):

1. Add the field to `leadResearchSchema` in `schema.ts` (alongside `companySummary`/`businessModel`/`targetCustomers`).
2. Add an entry for it to `allObservations()`'s hardcoded `single` list (`schema.ts:232-236`) — otherwise it is invisible to both persistence adapters and to `observedRatio()`.
3. Add an entry for it to `FIELD_KIND` (`persist.ts:38-48`) — otherwise it silently defaults to `'WEBSITE'` in the `persist.ts` adapter (not necessarily wrong, but undocumented/accidental if left unaddressed).

**Distinguished explicitly from `targetCustomers`**: the existing field states who the business serves (descriptive fact about the business, independent of any participant); the proposed new field states whether that business plausibly falls within *this specific participant's* stated target — a comparison, not a description. The two must not be merged, per the semantic distinction established in `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §4 and §7 of this document's governing documents.

**Whether the result needs a richer shape than `Observation` provides** (e.g. an explicit `matchedSegment` sub-field, distinct from the free-text `value`) is unresolved — see §12.

## 7. Evidence Policy

Reusing the existing tiers from `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §9, now grounded against the confirmed evidence machinery in §3:

| Tier | Maps to existing `classification` | Confirmed mechanism |
|---|---|---|
| Tier 1 — direct self-identification | `OBSERVED`, high confidence | `verifyProvenance()` (`researcher.ts:253`) already requires OBSERVED claims to cite real quotes/URLs from `sourceDocuments` — a fabricated Tier-1 claim would already fail provenance verification and trigger a repair round, for free, with no new code |
| Tier 2 — strong contextual evidence | `OBSERVED` or `INFERRED`, depending on directness | Same provenance machinery applies if scored OBSERVED; `effectiveConfidence()` (`persist.ts:58-62`) halves INFERRED confidence before scoring, an existing, reusable discount |
| Tier 3 — weak inference (name-only) | `INFERRED`, capped confidence (schema already caps INFERRED at 80 per `PATH_2..._SCOPE_LOCK.md` §9) | Same halving applies; `isEvidentiary()` in `packages/core-qualification/src/rules.ts` treats only `OBSERVED` as evidentiary for `EVIDENCE_PRESENT` — a relevant precedent, not an automatic transfer, for whether Tier 3 alone should ever support MATCH/MISMATCH |
| UNKNOWN | `UNKNOWN` | Per `persist.ts:10-13`, UNKNOWN observations are deliberately excluded from the `persist.ts` scored-signal path ("no value... would score as zero-weight noise") but are **not** excluded from `mapping.ts`'s `toNewResearchSignals()` (which persists every observation unfiltered, per `mapping.ts:5-14`) — so a plausibility field's UNKNOWN state is visible to Qualification (via the live MVP `ResearchSignalRepository` path) even though it would be dropped from the parallel scored-signal path if that adapter is also active |

**Minimum acceptable evidence tier is not decided by this document** — this remains the same open product decision named in the prior scope-lock (§9 there), now with the added, concrete precedent that `isEvidentiary()`'s OBSERVED-only rule exists elsewhere in the codebase for a structurally similar purpose (evidence sufficiency for a qualification-relevant claim).

**Conflicting evidence**: no new representation is required — `evidence[]` already supports multiple entries per observation (`schema.ts:31-57`), so contradictory source quotes can already be captured; how the model should *resolve* (not just represent) a conflict into a single classification/value is undefined by any document and is not decided here.

## 8. Qualification Integration

Trace confirmed: `LeadResearch` → `toNewResearchSignals()` (`mapping.ts`) → `ResearchSignalRepository.saveResearch`-equivalent write → `signals.listByProspect(userId, prospectId)` (`repository.ts:28`) → available to Qualification's `evaluateQualificationForOwner` (`packages/core-qualification/src/service.ts:59-78`), which already fetches signals this way for the existing `EVIDENCE_PRESENT` criterion.

**Q1 — New Qualification criterion** (conceptually `CATEGORY_PLAUSIBILITY`, name not approved): extends `QUALIFICATION_CRITERIA` (`packages/core-qualification/src/types.ts:12`, currently `['NEED_DETECTED', 'EVIDENCE_PRESENT']`), adds a rule function in `rules.ts`, invoked from `evaluator.ts`. No new `QualificationDeps` dependency is required for Path 2 specifically (unlike Path 1) — the new field arrives via the existing `signals` dependency, already present.

**Q2 — Evidence-only consumption**: Research produces and persists the determination; Qualification does not gate on it in this iteration — it is simply readable alongside other signals (e.g., for participant review, §15 of the prior scope-lock) without changing `QUALIFICATION_CRITERIA` or `evaluator.ts` at all.

**Tradeoff**: Q1 makes the determination load-bearing (a MISMATCH can flip an opportunity to `NOT_QUALIFIED`); Q2 defers that decision, shipping the Research capability first and letting a later, separate authorization decide gating. Q2 has a strictly smaller implementation and review surface.

```text
REQUIRES PRODUCT OWNER DECISION — Q1 vs Q2 not chosen here.
```

**MATCH / MISMATCH / UNKNOWN behavior, if and when Qualification does consume the result** (regardless of Q1/Q2, since even Q2 exposes the value to something):
- MATCH → not decided; candidate behaviors range from "no effect" to "supports EVIDENCE_PRESENT" to "required for NEED_DETECTED" depending on Q1/Q2 and gating decisions not made here.
- MISMATCH → not decided; candidate behaviors range from "no effect" to "produces NOT_QUALIFIED" — this is precisely the gating decision flagged as unresolved.
- UNKNOWN → not decided; per §7, UNKNOWN observations are visible via the live `ResearchSignalRepository` path but excluded from the (possibly inactive) `persist.ts` scored path — whether Qualification should treat UNKNOWN as "no opinion, proceed" or "insufficient evidence, hold" is undecided.

No gating behavior is invented by this document, per instruction.

## 9. Opportunity Boundary

Per `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §11 and `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §13 (not re-litigated here): the current architecture supports Opportunity creation proceeding unconditionally, with Qualification acting as the (optional, per Q1/Q2 above) gating point after the fact. `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) and `evaluateQualificationForOwner` are independent, separately-invoked steps; `StoredOpportunity` has no category field and none is added by this document.

Category plausibility does **not** move into Discovery, and does **not** change Opportunity creation, under this scope. Any future decision to gate Opportunity creation itself (rather than only Qualification) is explicitly out of scope and would require separate, explicit product authorization.

## 10. R-71 Boundary

```text
R-71: UNCHANGED
```

Confirmed against `packages/core-qualification/src/adapters.ts:136-152`: `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` governs exclusion from `suggestOffers()`/`toOfferSignals()`. The proposed new field (§6) is:
- **not** added to `TOPICAL_FIELDS`,
- **not** routed through `toOfferSignals()`/`suggestOffers()`,
- **not** used to compute `needDetected`.

This keeps category plausibility structurally outside R-71's mechanism, consistent with the finding in `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:307` that an additive field "would not, on the evidence available, require changing R-71's exclusion rule at all." R-70 (source-to-business attribution) is likewise untouched — no traced code path connects it to category plausibility.

## 11. Scoring / Ranking Boundary

```text
SCORING: UNCHANGED
RANKING: UNCHANGED
```

Confirmed per `packages/core-opportunity/src/service.ts:264-401` and `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`: scoring (`scoreOpportunity`/`scoreOpportunityForOwner`) and ranking (`rankOpportunities`) are independently authorized, separately-gated worker steps with no data dependency on Research's field set or Qualification's criteria. The proposed new field is not added to `FACTOR_WEIGHTS`, not consumed by the scorer, and does not alter the four-factor treatment or `OpportunityScore` persistence. Note: `persist.ts`'s `FIELD_KIND`/`effectiveConfidence()` mechanism (§3, §7) does feed a *separate* scorer (`packages/core-acquisition`'s `scoreProspect`, referenced in `service.ts:1`) if that parallel persistence path is active — whether the new field should be assigned a `FIELD_KIND` entry that participates in that scorer, or should be deliberately excluded/omitted from `FIELD_KIND` to keep it out of that scoring path entirely, is an open implementation detail flagged here, not resolved. Default (no entry added) falls back to `'WEBSITE'` silently (§3) — an explicit decision to add or deliberately omit the entry is safer than relying on that silent default.

```text
REQUIRES EXPLICIT IMPLEMENTATION DECISION — FIELD_KIND entry, or deliberate omission, for the new field, to avoid accidentally feeding the core-acquisition scorer.
```

## 12. Multi-Segment Handling

Restated from the prior scope-lock (§10 there) with the concrete example: `ServiceProfile.targetCustomer` is a single `string` (`packages/core-service-profile/src/types.ts:10-14`), and the real case that exposed this issue was `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"` — three segments in one unparsed string, confirmed inserted verbatim into Discovery's query with no per-segment structure (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:116`).

Available semantic choices, none selected here:
- **AND semantics** — a business must plausibly match every stated segment (unlikely to be intended, given the segments read as alternatives, but not ruled out by any document).
- **OR semantics** — a business matching any one stated segment counts as an overall MATCH.
- **Weighted matching** — segments are not equally important; requires a weighting scheme with no existing precedent.
- **First-match semantics** — the first-listed segment takes precedence; arbitrary, no precedent.
- **Dominant-segment semantics** — the segment with the strongest evidence determines the result; requires a comparison rule across segments with no existing precedent.

```text
REQUIRES EXPLICIT PRODUCT AUTHORIZATION — none of the above is chosen by this document, per instruction.
```

This choice is coupled to §5's Option I-A/I-B (whether segments are parsed before Research sees them, or left for the model to interpret as one string) — if I-A (raw passthrough) is chosen, the model itself would need to decide how to interpret and match against a compound string, which is a materially different (and less controllable) design than pre-parsing under I-B and then applying an explicit OR/AND/weighted rule downstream. Both remain unresolved.

## 13. Persistence

Building on §3's confirmed architecture:

**If the new field is added to `leadResearchSchema` and to `allObservations()`'s hardcoded list** (§6, both edits required, not automatic): it flows into `toNewResearchSignals()` → `ResearchSignalRepository` — the live MVP persistence path — with no new table, no new repository interface, and no migration, because `NewResearchSignalInput`/`StoredResearchSignal` already have a `field: string` (not a literal union, per `types.ts:26-27,47`), so a new field name requires no type-level schema change to those types themselves.

**If the parallel `persist.ts`/`acq_lead_research` path is also active** (its current live-wiring status was not re-verified in this task, per §3): the new field additionally needs a `FIELD_KIND` entry (§11) to avoid silently defaulting to `'WEBSITE'`, and would be subject to that adapter's UNKNOWN-exclusion and confidence-halving behavior.

**Tables/models involved**: whatever underlies `ResearchSignalRepository` (the concrete Postgres implementation was not re-read in this task; the interface alone was confirmed) and, conditionally, `acq_lead_research` (per `persist.ts:5`).

**Migration implications**: none identified for the `ResearchSignalRepository` path specifically, because `field` is a free string column/type already able to carry a new field name without a schema migration — **this is an inference from the type signature (`field: string`), not a confirmed reading of the actual Postgres migration/column definition**, which was not inspected in this task.

```text
REQUIRES EXPLICIT IMPLEMENTATION AUTHORIZATION before any schema/migration work, and before confirming the above inference against the actual Postgres schema.
```

## 14. Freshness / Reruns

Confirmed generic mechanism (§3): `supersedePrevious(prospectId, at)` marks all prior active signals for a Prospect as superseded before new ones are inserted, for both persistence paths. A rerun of Research for the same prospect automatically supersedes a stale plausibility observation the same way it supersedes every other field — no new freshness policy is required structurally, provided the new field participates in the same `allObservations()`/`toNewResearchSignals()` flow as every existing field.

**Undecided**: whether a change to `ServiceProfile.targetCustomer` (the participant editing their profile) should itself trigger a Research rerun for already-researched prospects. Per `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §5, `StoredSearch.parameters` is an immutable snapshot taken at Search-creation time — a later `ServiceProfile` edit does not change an existing Search's `targetCustomer`, so an already-completed Research run's plausibility observation would not become stale merely because the participant edited their profile *after* that Search was created. Whether a *new* Search against an updated profile, for a previously-discovered/researched company, should force a rerun (rather than reusing a stale plausibility observation from an old Search with a different `targetCustomer`) is undecided and not addressed by any existing freshness mechanism traced.

```text
REQUIRES PRODUCT DECISION — targetCustomer-change rerun behavior across Searches, not resolved by the existing per-Prospect supersede mechanism alone.
```

## 15. UI / User Visibility

```text
visible to user? undecided
```

Not modified by this document; no UI files were inspected in this task (out of scope, per instruction not to modify or assume UI exposure). If exposed, the existing evidence-display pattern used elsewhere for Research signals would be the natural mechanism to extend (per the prior scope-lock's §16), since the proposed field reuses the standard `Observation` shape (`value`/`classification`/`confidence`/`evidence[]`). No frontend requirement is created here.

## 16. Testing Scope

**Unit tests** (future, not written here):
- `targetCustomer` propagation from `ServiceProfileFields`/`StoredSearch` into the new `ResearchProviderInput` field (whichever of §5's I-A/I-B is chosen).
- Classification of the new plausibility field: MATCH, MISMATCH, UNKNOWN.
- Conflicting evidence within the new field's `evidence[]`.
- Multi-segment behavior, once §12 is resolved — tests would need to cover each chosen semantic (AND/OR/weighted/etc.) explicitly.
- `allObservations()` and `FIELD_KIND` correctly include the new field (a regression test guarding against the "silent omission" failure mode noted in §3/§11).

**Integration tests**:
- `ServiceProfile` → `Search` → worker → Research: confirm participant `targetCustomer` reaches the Research call (currently it does not, per §4).
- Research result, including the new field, is persisted via `ResearchSignalRepository` and readable via `signals.listByProspect`.
- If Q1 (§8) is authorized: Qualification consumes the result and the new criterion behaves as specified once gating semantics are decided.
- Supersede-on-rerun behavior (§14) correctly marks a stale plausibility observation superseded when Research reruns for the same prospect.

**End-to-end validation** (future, not run here): observe the full chain `discovered candidate → research evidence → category determination (new field) → Qualification outcome (if gated) → participant review`, requiring a funded Anthropic (or configured OpenAI/Gemini, per §3's multi-provider finding) account — the same blocker noted in the prior scope-lock (§13 there) remains unresolved and unrelated to this scope.

No tests are written or modified by this document.

## 17. Explicit Non-Goals

This scope does NOT authorize:
- Discovery query redesign.
- Google Places provider changes.
- Discovery category filtering.
- R-71 changes.
- `TOPICAL_FIELDS` changes.
- `suggestOffers()` changes.
- Scoring changes.
- Ranking changes.
- `OpportunityScore` changes.
- Four-factor scoring changes.
- Outreach.
- CRM.
- Follow-up.
- Broad SaaS work.
- Unrelated provider work.
- OpenAI/Gemini provider work beyond the shared-contract constraint already noted in §3 (i.e., this document does not propose changing `openAIModel.ts`/`geminiModel.ts` individually — any input/output change happens at the shared `schema.ts`/`provider.ts` layer that all three providers already consume identically).

## 18. Implementation Boundary Map

```text
INPUT (ServiceProfile.targetCustomer)
  CURRENT: read only by Discovery's buildQuery(); not forwarded past Discovery
  PROPOSED: worker reads search.parameters.targetCustomer and passes it into the Research call
  REQUIRES AUTHORIZATION: raw string (I-A) vs. structured/segmented (I-B), §5
↓
Worker (apps/worker/src/searchWorker/worker.ts, Research call site, lines 358-368)
  CURRENT: passes { prospectId } only
  PROPOSED: passes { prospectId, <new targetCustomer field> }
  REQUIRES AUTHORIZATION: exact field name/shape, dependent on §5's decision
↓
ResearchProviderInput / ResearchInput (provider.ts:11-16, schema.ts:207-224)
  CURRENT: no participant-context field wired to any caller
  PROPOSED: new field added to both types; provider-neutral (must not live in a single provider adapter, per §3)
  REQUIRES AUTHORIZATION: field definition, prompt wording in prompt.ts
↓
Research provider (researchModelFactory.ts → anthropicModel.ts/openAIModel.ts/geminiModel.ts)
  CURRENT: unaware of any target-customer concept
  PROPOSED: no per-provider change needed if the field is added at the shared layer; prompt.ts renders it uniformly for all three
  REQUIRES AUTHORIZATION: none beyond §5/§6, since this layer is provider-neutral by design
↓
Research output (LeadResearch, schema.ts:176-201)
  CURRENT: no plausibility-shaped field exists; targetCustomers means something different (§4)
  PROPOSED: new Observation-shaped field, distinctly named, added to leadResearchSchema
  REQUIRES AUTHORIZATION: exact field name, MATCH/MISMATCH/UNKNOWN semantics (§6), evidence tier sufficiency (§7)
↓
Persistence (allObservations() schema.ts:229-244; FIELD_KIND persist.ts:38-48; mapping.ts; ResearchSignalRepository)
  CURRENT: hardcoded field lists in two places would silently omit or misclassify an unlisted field
  PROPOSED: add the new field to allObservations()'s single-field list and to FIELD_KIND (or deliberately omit from FIELD_KIND, §11)
  REQUIRES AUTHORIZATION: whether the new field should participate in the core-acquisition scorer via FIELD_KIND (§11); confirmation against the actual Postgres schema (§13)
↓
Qualification (packages/core-qualification/src/service.ts, evaluator.ts, rules.ts, types.ts)
  CURRENT: reads existing signals via signals.listByProspect; no plausibility-aware criterion
  PROPOSED: either Q1 (new criterion) or Q2 (evidence-only, no criterion change), §8
  REQUIRES AUTHORIZATION: Q1 vs Q2; MATCH/MISMATCH/UNKNOWN gating behavior
↓
UI / user visibility (if authorized)
  CURRENT: not inspected in this task
  PROPOSED: none — out of scope
  REQUIRES AUTHORIZATION: whether exposure happens at all, and how (§15)
```

## 19. Required Product Decisions

1. Exact MATCH/MISMATCH/UNKNOWN semantics for the new field (§6, §7).
2. Minimum evidence tier sufficient for MATCH/MISMATCH — does Tier 3 (name-only inference) ever suffice, or is `OBSERVED`-only required, following the `isEvidentiary()` precedent (§7)?
3. Multi-segment semantics — AND/OR/weighted/first-match/dominant-segment (§12) — and whether this is coupled to pre-parsing the compound `targetCustomer` string (§5, Option I-B) or left to the model (Option I-A).
4. Whether plausibility is a new `LeadResearch` field (as scoped here) or a separate artifact entirely (the prior scope-lock's §7 listed alternative candidate locations; this document assumes the `LeadResearch`-field option as the smallest viable contract but does not foreclose the others).
5. Persistence depth — whether the minimal `Observation` shape suffices or a richer shape (e.g. an explicit matched-segment sub-field) is required (§6, §13).
6. Whether Qualification gets a new criterion (Q1) or consumes the result as evidence only (Q2) (§8).
7. MATCH behavior in Qualification, if gated (§8).
8. MISMATCH behavior in Qualification, if gated (§8) — specifically whether it can produce `NOT_QUALIFIED`.
9. UNKNOWN behavior in Qualification, if gated (§8) — "no opinion, proceed" vs. "insufficient evidence, hold."
10. Whether mismatch can ever prevent Opportunity creation (rather than only affecting Qualification) — this document assumes not, consistent with governing decisions (§9).
11. UI visibility — whether and how the result is shown to the participant (§15).
12. Freshness/rerun behavior when `ServiceProfile.targetCustomer` changes across Searches, beyond the existing per-Prospect supersede mechanism (§14).
13. Whether the new field should be assigned a `FIELD_KIND` entry, deliberately including or excluding it from the `core-acquisition` scorer's input if the `persist.ts` path is active (§11).
14. Confirmation that the `field: string` typing (`types.ts:26-27,47`) means no Postgres migration is needed for the `ResearchSignalRepository` path — this document infers it from the type signature but did not inspect the actual schema/migration files (§13).
15. R-71 permanent separation — this document assumes the separation established in §10 holds indefinitely; any future routing of plausibility data through need detection requires separate, explicit authorization.
16. Scoring/ranking unchanged — this document assumes so (§11); any future coupling requires separate authorization.
17. Validation acceptance criteria for a future live-validation run (§16) — what must be observed to consider the feature working, beyond the generic chain already named.

Decisions already made by prior governance (Option B, Path 2) are not re-listed here. No decision above is selected by this document.

## 20. Implementation Authorization Status

```text
NOT AUTHORIZED
```

This document defines implementation-ready boundaries and open decisions only. No code, test, schema, migration, or configuration change is made or authorized by it.

## 21. Repository Safety

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
Option B / Path 2 governance documents, none of which were modified):
  .claude/, CLAUDE.md, requirement/*.md (existing set, incl.
  OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md,
  OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md,
  PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md)
New file added by this task:
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md
No git add/commit/push/reset/restore/checkout/clean/stash performed.
No application/web/worker process started, no search created, no Google Places calls, no Anthropic/OpenAI/Gemini API calls, no migrations, no database modifications.
```
