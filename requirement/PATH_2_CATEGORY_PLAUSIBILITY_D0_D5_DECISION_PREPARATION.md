# PATH 2 — CATEGORY PLAUSIBILITY: D0–D5 DECISION PREPARATION

```text
STATUS: READ-ONLY DECISION PREPARATION
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

## 1. Executive Summary

This document prepares factual, evidence-backed material for Product Owner decisions **D0–D5** on Path 2 (Research-Level Category Plausibility). It does not decide anything. Every claim below is tagged `CONFIRMED FROM REPOSITORY`, `INFERENCE`, `UNRESOLVED`, or `PRODUCT DECISION REQUIRED` — inference is never presented as fact. All six decisions remain open; none is selected, ranked, or recommended.

This document supplements, and does not replace, `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` (the existing D0–D11 questionnaire). It goes deeper on D0–D5 specifically, using direct first-hand reads of `MVP_SCOPE_BOUNDARY.md`, PRD V2.2, `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, and the two Phase 24 R-70/R-71 documents — material the prior record cited secondhand through the Path 2 chain.

---

## 2. Confirmed Existing Decisions (Not Reopened)

`CONFIRMED FROM REPOSITORY`:

| Decision | Evidence |
|---|---|
| Category plausibility is owned by Research/Qualification, not Discovery ("Option B") | `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §13 |
| Path 2 selected — Research produces the determination, Qualification consumes it | `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §14 |
| D6 — Persistence scope & historical attribution: **PER SEARCH + PROSPECT**, historical attribution **PRESERVE**, cross-search overwrite **NOT ALLOWED**, Qualification consumes the current Search + Prospect determination | `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3, D6 (status `DECIDED`) |
| R-71 unchanged — `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` governs exclusion from `suggestOffers()`/`toOfferSignals()`; not extended | `packages/core-qualification/src/adapters.ts:136-152`; `requirement/PHASE_24_R70_R71_DECISION.md` §7 |
| Scoring/ranking unchanged — `scoreOpportunity`/`scoreOpportunityForOwner`/`rankOpportunities` are an independently authorized, separately-gated worker step | `packages/core-opportunity/src/service.ts:264-401`; `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` |
| No implementation authorization exists anywhere in the Path 2 chain | Every upstream document's authorization section |

This document does not reopen any of the above.

---

## 3. D0 — MVP Status / Scope Placement

**Question:** Is Path 2 category plausibility explicitly required by the MVP, implied by an existing MVP criterion, an MVP enhancement, or explicitly post-MVP?

### 3.1 Literal checklist requirements — `CONFIRMED FROM REPOSITORY`

`MVP_SCOPE_BOUNDARY.md` §10's 19-item MVP Exit Criteria checklist contains no line addressing category correctness or target-customer matching. The Discovery-stage items are literally: "Businesses are discovered" and "Duplicates are removed" (`MVP_SCOPE_BOUNDARY.md:499-500`). Both are satisfied by the current implementation regardless of whether discovered businesses match the participant's target-customer category — Discovery's normalization (`packages/core-discovery/src/normalize.ts:43-52`, per prior audits) checks only name-presence and URL-parseability, never category. No exit-criterion line requires more.

§5.2 (Discovery, in-scope) lists exactly: "Business discovery," "Provider abstraction," "Candidate normalization," "Deduplication" (`MVP_SCOPE_BOUNDARY.md:181-184`) — no category-match item. §5.3 (Research, in-scope) lists: "Research execution," "Source collection," "Evidence extraction," "Observed / inferred / unknown classification," "Confidence," "Provenance," "`observedAt`," "Freshness / decay," "Supersession" (`MVP_SCOPE_BOUNDARY.md:188-196`) — no category-plausibility item, and no comparison-to-participant-intent item of any kind.

PRD V2.2's R-06 ("Requirement. Obtain candidate businesses from an external source behind a provider abstraction, so the source can change without changing the engine," `PRD V2.2:627-628`), R-07 ("Convert provider-shaped results into one internal representation," `:637-638`), and R-08 ("One real business appears once within a Search," `:647`) describe discovery/normalization/deduplication mechanics only — none mentions target-customer category matching. R-09 (Research, `:657-666`) requires "structured, schema-valid research per prospect" — a format guarantee, not a content guarantee about category fit.

**`CONFIRMED FROM REPOSITORY`: no literal MVP checklist item, in either `MVP_SCOPE_BOUNDARY.md` or PRD V2.2, requires category plausibility.**

### 3.2 Product promise — `CONFIRMED FROM REPOSITORY` + interpretive tension

`MVP_SCOPE_BOUNDARY.md` §2's core MVP promise: *"A user can define what they sell, and the system can find approximately 20 businesses that appear to have a genuine need for that service, explain why with evidence, rank the opportunities, and allow the user to provide feedback"* (`MVP_SCOPE_BOUNDARY.md:75-78`). This is worded at the level of **need**, not explicitly at the level of **category membership**. A business can have a genuine, evidenced need for a service while not obviously belonging to the participant's stated target-customer category (or vice versa) — the promise's literal text does not require category correctness as a precondition for counting toward the ~20.

§9, Criterion 9: *"The system does not fabricate business needs"* — *"An invented need is worse than no opportunity: it wastes the user's credibility with a real business and teaches them not to trust the ranking"* (`MVP_SCOPE_BOUNDARY.md:469-473`). This is the criterion every prior Path 2 document has identified as being in interpretive tension with a high category-mismatch rate, without any document claiming the literal text is violated.

### 3.3 Direct precedent — an almost-identical prior MVP-status question, already resolved once — `CONFIRMED FROM REPOSITORY`

`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` faced structurally the same question for a different gap (R-70 source-attribution, R-71 service-problem relevance) and answered it using `MVP_SCOPE_BOUNDARY.md` §8's own four-question test (`MVP_SCOPE_BOUNDARY.md:418-425`: *"1. Is it required for the Client Finder MVP? 2. Does the MVP fail without it? 3. Is it necessary for data integrity, security, or reliability? 4. Can it be deferred without invalidating the MVP experiment? ... If the honest answers are no, no, no, yes — defer it."*).

`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` §2 applied this test to R-70/R-71 and answered **yes, yes, yes, no** for both (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md:87-97`), concluding they are MVP-gating — a decision that was later ratified: `PHASE_24_R70_R71_DECISION.md` records both as `IMPLEMENTED` (§2, §7). This is direct precedent that this repository's governance has, at least once, treated an evidence-quality gap discovered during live validation as MVP-gating rather than deferring it — using the same four-question mechanism §8 provides for any new candidate, including category plausibility.

**This is presented as precedent for the *existence of a mechanism*, not as an argument that category plausibility should reach the same conclusion.** No document has run the §8 four-question test against category plausibility specifically, and this document does not run it either — that is the Product Owner's decision to make, not a fact to discover.

### 3.4 Distinguishing interpretations — `PRODUCT DECISION REQUIRED`

| Interpretation | Supporting evidence | Status |
|---|---|---|
| **Literal checklist requirement** (already covered by an existing §10 criterion) | Not supported — no §10 line addresses category correctness (§3.1 above) | `CONFIRMED FROM REPOSITORY`: not this interpretation |
| **Product promise** (implied by §2's "genuine need" / §9 Criterion 9, even though no checklist line states it) | §9's "does not fabricate business needs" sits in tension with a high mismatch rate, per every prior Path 2 document's own framing; not a literal violation | `PRODUCT DECISION REQUIRED` — this is an interpretive judgment, not a textual fact |
| **Implementation assumption** (something the current pipeline silently assumes works, without a document requiring it) | No document was found assuming category plausibility is handled anywhere in the pipeline; the opposite is true — `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §8 confirms no stage compares a discovered business against `targetCustomer` today | `CONFIRMED FROM REPOSITORY`: not an existing silent assumption — it is an acknowledged, named gap |
| **Unresolved ambiguity requiring Product Owner clarification** | Consistent with `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18's own conclusion: *"the issue exposes an ambiguity that requires Product Owner clarification before the live validation can be interpreted"* — while simultaneously noting *"the issue is outside the existing 19-criterion exit contract"* (both reported, not resolved to one) | `CONFIRMED FROM REPOSITORY` that this is how the repository's own prior analysis characterized the situation |

### 3.5 Would adding category plausibility reopen the existing MVP exit, remain an in-MVP enhancement, or be post-MVP? — `PRODUCT DECISION REQUIRED`

`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18 states directly: *"MVP ENGINEERING EXIT: SATISFIED... The 19-criterion engineering exit is not reopened by this product-boundary clarification"* (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:380-387`). This is `CONFIRMED FROM REPOSITORY` as the existing governance position: the current MVP exit is not retroactively reopened by this gap's existence. Whether a *future* decision to build category plausibility should be scheduled inside the current MVP effort (as an addition, without reopening the already-satisfied exit), as a scheduled post-MVP enhancement, or left unscheduled, is not addressed by any document and is squarely `PRODUCT DECISION REQUIRED`.

**Choices, presented without ranking:**
- **A — Reopen/extend MVP exit**: treat category plausibility as a new, 20th exit criterion, blocking further MVP sign-off until built.
- **B — MVP enhancement (exit stays satisfied)**: build it as work that proceeds without reopening or blocking the already-satisfied §10 exit.
- **C — Post-MVP**: schedule it for a later phase (per `MVP_SCOPE_BOUNDARY.md` §11's phase sequence — Phase 2 "Acquisition workflow," Phase 3 "Proposal/CRM," etc., `MVP_SCOPE_BOUNDARY.md:522-546`), with no work beginning now.

**Status:** `PRODUCT OWNER DECISION REQUIRED`

---

## 4. D1 — Output Location / Contract Location

### 4.1 Confirmed architecture trace — `CONFIRMED FROM REPOSITORY`

```text
Search  (StoredSearch.parameters, immutable snapshot — packages/core-search/src/service.ts:82-90)
 ↓
Worker  (apps/worker/src/searchWorker/worker.ts:358-368 — Research call site; passes only { prospectId } today)
 ↓
ResearchProviderInput  (packages/core-research/src/provider.ts:11-16 — currently { prospectId, companyId, companyName, normalizedDomain })
 ↓
ResearchProvider → researchModelFactory.ts  (the ONE place in the codebase allowed to branch on provider identity, per its own header comment — selects anthropic/openai/gemini)
 ↓
ResearchModel  (researcher.ts:44-56 — single provider-neutral interface)
 ↓
leadResearchSchema  (packages/core-research/src/schema.ts:176-201, 229-244 — allObservations() is a hardcoded literal field list, not reflective)
 ↓
validation / repair  (researcher.ts:151-293 — researchLead(): retries transient failures with jittered backoff; validates against leadResearchSchema; verifyProvenance() at researcher.ts:253 requires OBSERVED claims to cite real quotes/URLs from sourceDocuments; repairs only the failing subtree on validation/provenance failure)
 ↓
mapping  (packages/core-research/src/mapping.ts — toNewResearchSignals(), iterates allObservations(), consults FIELD_KIND from persist.ts:38-48 for the persisted kind field)
 ↓
ResearchSignalRepository  (packages/core-research/src/repository.ts:13-28 — concrete Postgres implementation at pgRepository.ts:50; supersedePrevious(prospectId, at) marks all prior active signals for a Prospect superseded, keyed by Prospect only)
 ↓
Qualification  (packages/core-qualification/src/service.ts:59-78, evaluateQualificationForOwner() — reads via signals.listByProspect(userId, prospectId))
```

A second, parallel persistence path exists — `persist.ts`'s `storeResearch()`/`ResearchRepository` (the `acq_lead_research` table) — but is `CONFIRMED FROM REPOSITORY` as **inactive**: it has no concrete implementation anywhere in the codebase and is not called by `service.ts`, `worker.ts`, or any file outside `persist.ts`/`index.ts`'s re-export (`requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §3, a finding from a repository-wide grep performed in that prior task). `FIELD_KIND` is nonetheless consulted by the **live** `mapping.ts` path too (`mapping.ts:1,19`), so it is not purely dead code even though `persist.ts`'s own scorer path is inactive.

### 4.2 Candidate 1 — New `LeadResearch` field

| Dimension | Finding | Tag |
|---|---|---|
| Source-of-truth location | `leadResearchSchema` (`schema.ts`), reusing the existing `Observation` shape (`value`/`classification`/`confidence`/`evidence[]`/`basis`) | `CONFIRMED FROM REPOSITORY` (shape exists) |
| Persistence implications | Flows automatically into `toNewResearchSignals()` → `ResearchSignalRepository` once added to `allObservations()`'s hardcoded list — no new repository interface | `CONFIRMED FROM REPOSITORY` |
| Evidence/provenance support | `verifyProvenance()` and the retry/repair loop are field-agnostic — apply automatically, no new code | `CONFIRMED FROM REPOSITORY` |
| Search attribution / D6 compatibility | **Does NOT natively satisfy D6.** `ResearchSignal`'s persistence key is Prospect-only (`supersedePrevious(prospectId, at)`); every field using this candidate inherits the per-Prospect-only supersession D6 explicitly disallows for this data. Satisfying D6 with this candidate requires either a new attribution key on `ResearchSignal` itself (a change affecting the shared type used by every other field) or a workaround stored elsewhere. | `CONFIRMED FROM REPOSITORY` (gap) / `UNRESOLVED` (how to close it) |
| Provider-neutrality | Compliant if added at the shared `schema.ts` layer, per the `researchModelFactory.ts` constraint | `CONFIRMED FROM REPOSITORY` |
| Qualification consumption | Via existing `signals.listByProspect` — no new `QualificationDeps` dependency | `CONFIRMED FROM REPOSITORY` |
| Freshness/rerun behavior | Automatic per-Prospect supersession on any Research rerun — but see D6 conflict above: this is precisely the behavior D6 disallows for this field | `CONFIRMED FROM REPOSITORY` (mechanism) / conflicts with D6 unless separately addressed |
| UI implications | Reuses whatever pattern displays other `LeadResearch` fields (existence/extensibility of such a pattern not verified — no UI files inspected in any Path 2 document) | `UNRESOLVED` |
| Schema/migration implications | `field` is typed as a plain `string` (not a literal union) on `NewResearchSignalInput`/`StoredResearchSignal` (`types.ts:26-27,47`) — suggested to need no migration for the field name itself | `INFERENCE` from the TypeScript type signature; the actual Postgres column/migration definition was not read in this or any prior task |
| Risk of coupling to scoring | `FIELD_KIND` omission defaults silently to `'WEBSITE'` (`persist.ts:81`); inclusion pre-commits a `kind` if the inactive `acq_lead_research` scorer is ever reactivated (already flagged as D7) | `CONFIRMED FROM REPOSITORY` |
| Impact on existing contracts | None to other fields, provided the new field is distinctly named from `targetCustomers` (which means something else — "who the business serves," `adapters.ts:136-152`) | `CONFIRMED FROM REPOSITORY` |

### 4.3 Candidate 2 — Dedicated category-plausibility research signal (new `ResearchSignal` kind)

| Dimension | Finding | Tag |
|---|---|---|
| Source-of-truth location | A new, bespoke shape distinct from the generic per-field `Observation` model | `CONFIRMED FROM REPOSITORY`: no existing precedent for a non-`Observation`-shaped `ResearchSignal` |
| Persistence implications | Would require new persistence machinery — `ResearchSignalRepository`'s current shape is built around one row per field-observation, keyed by Prospect | `CONFIRMED FROM REPOSITORY` (gap, larger than Candidate 1) |
| Evidence/provenance support | Could reuse `evidence[]`/`classification`/`confidence` conceptually, but would not automatically inherit `verifyProvenance()`'s generic field-agnostic checking unless built to match the existing shape closely | `INFERENCE` |
| Search attribution / D6 compatibility | Same underlying constraint as Candidate 1 — `ResearchSignalRepository`'s supersession is Prospect-keyed; a "new kind" does not by itself change the persistence key, unless the kind is deliberately given a different key structure (a larger, unscoped change) | `CONFIRMED FROM REPOSITORY` (gap) |
| Provider-neutrality | Same shared-layer requirement as Candidate 1 | `CONFIRMED FROM REPOSITORY` |
| Qualification consumption | Would require Qualification to know how to interpret a non-uniform shape, rather than reading it the same way as every other signal | `INFERENCE` |
| Freshness/rerun behavior | Same Prospect-keyed supersession constraint as Candidate 1 | `CONFIRMED FROM REPOSITORY` |
| UI implications | Same unresolved status as Candidate 1 | `UNRESOLVED` |
| Schema/migration implications | Larger than Candidate 1 — a genuinely new persisted shape, not a new value of an already-generic `field: string` column | `INFERENCE` |
| Risk of coupling to scoring | Same `FIELD_KIND` consideration as Candidate 1, if the new kind still routes through `mapping.ts` | `INFERENCE` |
| Impact on existing contracts | Larger — touches `ResearchSignalRepository`'s interface, not just its data | `CONFIRMED FROM REPOSITORY` (larger surface than Candidate 1) |

### 4.4 Candidate 3 — Dedicated Search + Prospect category-plausibility record/entity

| Dimension | Finding | Tag |
|---|---|---|
| Source-of-truth location | A wholly new entity, keyed by (Search, Prospect) rather than living inside `LeadResearch`/`ResearchSignal` at all | `CONFIRMED FROM REPOSITORY`: no existing precedent for a Research-produced entity outside `LeadResearch`/`ResearchSignal` |
| Persistence implications | New table/repository interface, new repository implementation | `CONFIRMED FROM REPOSITORY` (largest schema footprint of the three) |
| Evidence/provenance support | Would need to be built explicitly — would not automatically inherit `verifyProvenance()`/the retry-repair loop unless deliberately wired to reuse them, since those operate on `leadResearchSchema`'s fields specifically | `INFERENCE` |
| Search attribution / D6 compatibility | **This is the only candidate whose natural key (Search, Prospect) directly matches D6's decided scope** ("PER SEARCH + PROSPECT," historical attribution preserved, cross-search overwrite not allowed) without requiring a change to the existing Prospect-only `ResearchSignal`/`supersedePrevious()` mechanism. | `CONFIRMED FROM REPOSITORY` (structural fit); this is an architectural observation about fit, not a recommendation to select this candidate |
| Provider-neutrality | Same shared-layer requirement — the *producer* is still Research, regardless of where the result is persisted, so the input/output contract must still live in the provider-neutral layer | `CONFIRMED FROM REPOSITORY` |
| Qualification consumption | Would require `QualificationDeps` to gain a new repository dependency to reach this entity — a dependency that does not exist today (unlike Candidates 1/2, which reuse the existing `signals` dependency) | `CONFIRMED FROM REPOSITORY` (new dependency required — a departure from the Path 2 minimal-change-surface premise in `OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §12) |
| Freshness/rerun behavior | Could be built to key supersession by (Search, Prospect) directly, natively satisfying D6's "no cross-search overwrite" without a workaround — but this "could be built" is a feasibility observation, not evidence that it exists | `INFERENCE` (feasible, not existing) |
| UI implications | Same unresolved status as Candidates 1/2 | `UNRESOLVED` |
| Schema/migration implications | Requires an actual new table and migration — the largest and only candidate that unambiguously requires a schema/migration change (no `field: string`-style escape hatch) | `CONFIRMED FROM REPOSITORY` |
| Risk of coupling to scoring | None by default — a new entity outside `ResearchSignal`/`FIELD_KIND` entirely is not consulted by the (inactive) `acq_lead_research` scorer unless deliberately wired to it | `CONFIRMED FROM REPOSITORY` |
| Impact on existing contracts | Largest — new table, new repository, new Qualification dependency; but zero change to `ResearchSignal`'s existing shape or supersession semantics for every other field | `CONFIRMED FROM REPOSITORY` |

### 4.5 Summary comparison — no selection made

```text
Candidate 1 (LeadResearch field):        smallest schema footprint, does NOT natively satisfy D6
Candidate 2 (new ResearchSignal kind):   medium footprint, does NOT natively satisfy D6
Candidate 3 (Search+Prospect entity):    largest footprint, DOES natively satisfy D6
```

This is a structural fact about which candidates satisfy an already-decided constraint (D6) without further modification — it is not a recommendation. Candidates 1 and 2 remain viable if paired with a separate mechanism to satisfy D6 (e.g., extending `ResearchSignal`'s key, which is a larger and currently-unscoped change to a type shared by every existing field). No prior Path 2 document scoped that extension; this document does not scope it either.

**Status:** `PRODUCT OWNER DECISION REQUIRED`

---

## 5. D2 — Multi-Segment Semantics and Parsing

### 5.1 Current representation — `CONFIRMED FROM REPOSITORY`

`ServiceProfile.targetCustomer` is typed as a single `string` (`packages/core-service-profile/src/types.ts:10-14`). The real participant example:

```text
Restaurants, Cafes
1. Boutique Retailers & E-commerce Brands
2. Hotels, Resorts & Tour Operators
```

is stored, transmitted, and (today) consumed as one unparsed compound string — no delimiter-based structure is recognized anywhere in the codebase (`DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:116`, cited in every prior Path 2 document). The system today treats it as **one free-form string**, not structured segments — this is a repository fact, not an inference.

### 5.2 Candidate semantics — none selected

**Semantic A — MATCH if ANY segment plausibly matches.**
- Meaning: a business need only fit one of the participant's stated segments to count as a category MATCH.
- Effect on Research: the model (or a pre-processing step) must be able to evaluate the business against each segment and report the best result.
- Effect on MATCH/MISMATCH/UNKNOWN: MISMATCH would require failing *every* segment; ambiguity in one segment while matching another still yields overall MATCH.
- Effect on evidence: evidence supporting the matched segment is sufficient; evidence about other segments becomes irrelevant to the final result (though it could still be recorded).
- Effect on persistence: a single overall value suffices if per-segment detail is not required; a richer shape is needed only if per-segment attribution must be retained.
- Effect on Qualification: consumes a single MATCH/MISMATCH/UNKNOWN value, same as any other semantic once resolved.
- Effect on user interpretation: a participant might expect to know *which* segment matched, which this semantic alone does not guarantee unless paired with segment-level output.
- Structured parsing required? Not strictly — the model could be asked to evaluate "does this business fit any of the following segments" against the raw string, or segments could be pre-parsed for a more controllable evaluation. Both are open (§5.3).

**Semantic B — MATCH only if ALL segments plausibly match.**
- Meaning: a business must plausibly serve every stated segment to count as MATCH.
- Effect on Research/MATCH: `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §6 observes (as a fact about the real example, not a decision) that the three segments in the audited case read as *alternative* acceptable customer types rather than a conjunctive requirement — under this semantic, a business serving only restaurants (not hotels or retailers) would be classified MISMATCH despite plausibly being an excellent single-segment fit. This is presented as an observation about the shape of the real example, not as an argument against Semantic B.
- Effect on evidence: requires evidence across all segments, raising the bar for what counts as sufficient evidence substantially compared to Semantic A.
- Structured parsing required? Effectively yes, in practice — evaluating "all" requires knowing what the discrete units are.

**Semantic C — Segment-level result, aggregated.**
- Meaning: evaluate each segment independently (its own MATCH/MISMATCH/UNKNOWN), then apply an aggregation rule (majority, any, weighted — none defined by any document).
- Effect on output shape: requires a richer shape than a single `Observation` (a list of per-segment results), directly coupling this decision to D1 (a single-value field, per Candidate 1/2 in §4, cannot cleanly carry this without extension).
- Effect on Qualification: Qualification would need to interpret either the aggregate or the full per-segment breakdown, depending on what's persisted.
- Structured parsing required? Yes, by definition — there is no way to produce independent per-segment results from an unparsed string.

**Semantic D — Preserve original text; let Research interpret the compound target as-is.**
- Meaning: no explicit semantic rule is imposed by the system; the model receives the raw compound string and produces a single holistic judgment, with its own internal (unspecified, unverifiable) interpretation of what "matching" the compound target means.
- Effect on controllability: the least controllable of the four — the model's interpretation of compound intent is not constrained by an explicit rule, so behavior may vary run-to-run or model-to-model (a live provider-neutrality concern per §7.4 below, since Anthropic/OpenAI/Gemini could each interpret the compound differently absent an explicit rule).
- Structured parsing required? No — this is the "no parsing" option definitionally.

### 5.3 Parsing options — none selected

1. **No parsing** — the compound string reaches Research verbatim; whichever semantic is chosen (most naturally Semantic D, though Semantic A could theoretically still be requested via prompt instruction without formal parsing) is entirely prompt-driven.
2. **Deterministic structured parsing before Research** — a fixed rule (e.g., split on `;`, treat `,` as intra-segment) applied in code before the value reaches the model. `CONFIRMED FROM REPOSITORY`: no such rule exists anywhere in the codebase today, and the real example itself is ambiguous under a naive delimiter rule — it uses `,` *within* a segment ("Restaurants, Cafes") and `;` *between* segments, with no numbering/list structure consistently present (the example as given in this task uses a numbered list for two of three segments and no list marker for the first).
3. **Model-assisted parsing** — a separate step (or the same Research call) asks the model to first segment the string, then evaluate against each segment. `CONFIRMED FROM REPOSITORY`: no existing precedent for a two-phase parse-then-evaluate Research step; would be new orchestration logic.
4. **Hybrid parsing** — deterministic splitting as a first pass, with model-assisted disambiguation for cases the deterministic rule cannot confidently resolve. No precedent exists for this either.

**What the repository actually supports today vs. what requires new implementation — `CONFIRMED FROM REPOSITORY`:** the repository supports exactly Option 1 (no parsing) with zero new code, because Research today receives no participant context at all (the input-contract gap, D8, already established in the final decision record). Options 2–4 all require new code with no existing precedent to build from — none is a smaller variant of an existing mechanism.

**Status:** `PRODUCT OWNER DECISION REQUIRED`

---

## 6. D3 — Evidence Sources, Sufficiency, and Insufficient-Evidence Behavior

### 6.1 What evidence sources are available today — `CONFIRMED FROM REPOSITORY`

Research fetches **exactly the candidate's own homepage** at `normalizedDomain` — no disambiguation, no external search (`PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md` §3, consistent with `sourceDocumentProvider.ts`'s O-18-03 Phase 18 scope boundary as named in `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md:147-149`). This means **all evidence available to Research under the current architecture is first-party** (the business's own website). No document defines or authorizes fetching third-party sources (directories, review sites, social profiles) for this or any other Research field.

A directly relevant, previously-established limit: `PHASE_24_R70_R71_DECISION.md` §6 found that *"the full extracted source-document text is available only in-memory, inside `researcher.ts`/`anthropicResearchProvider.ts`, and is discarded once `research()` returns; it is never persisted"* (`PHASE_24_R70_R71_DECISION.md:166-169`). This is `CONFIRMED FROM REPOSITORY` as an existing architectural constraint that would apply identically to a category-plausibility determination: whatever evidence Research uses to decide MATCH/MISMATCH/UNKNOWN must be captured *at Research time*, in the `evidence[]` quotes it persists — there is no later opportunity to re-inspect the original source document once the Research call returns.

### 6.2 Existing evidence-quality vocabulary — `CONFIRMED FROM REPOSITORY`

- `classification`: `OBSERVED` / `INFERRED` / `UNKNOWN` (`schema.ts:20-22`; PRD V2.2 R-10, `PRD:670-679`).
- `OBSERVED` claims must quote verbatim from the cited source document, enforced by `verifyProvenance()` (`researcher.ts:253`), case-sensitive, rejecting quotes below a minimum length (PRD V2.2 R-10 evidence note, `PRD:683-686`).
- `confidence`: persisted raw, unadjusted at capture time (PFR-04, `PRD:679`); `effectiveConfidence()` (`persist.ts:58-62`) halves `INFERRED` confidence, but only within the confirmed-**inactive** `persist.ts` scoring path.
- `evidence[]`: supports multiple `{quote, sourceUrl, sourceLabel}` entries per claim (`schema.ts:31-57`), so conflicting source quotes are already representable without new machinery.

**These describe the quality of a claim** ("is this well-sourced"), and are distinct from a proposed **MATCH/MISMATCH/UNKNOWN category-plausibility result** ("does this business fit the target"), which is a different axis entirely — `CONFIRMED FROM REPOSITORY` per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §4's explicit statement that the three-state plausibility model "was first introduced in the prior scope-lock document as the requested model, not discovered in the repository." This distinction must not be collapsed: a `classification: OBSERVED` plausibility claim and a `determination: MATCH` plausibility result are two different fields on the same proposed `Observation`, not synonyms.

### 6.3 Evidence tiers, mapped to the existing model — `CONFIRMED FROM REPOSITORY` + `INFERENCE`

| Tier | Definition | Maps to | Mechanism already in place |
|---|---|---|---|
| Tier 1 — Direct first-party evidence | Business explicitly self-identifies as belonging to the target category on its own site | `OBSERVED`, high confidence | `verifyProvenance()` already gates this — a fabricated Tier-1 claim fails provenance and triggers repair, with no new code (`CONFIRMED FROM REPOSITORY`) |
| Tier 2 — Other attributable source evidence already supported | Strong contextual first-party content (menus, booking flows, catalogues) that identifies the category without an explicit self-description sentence | `OBSERVED` or `INFERRED`, depending on directness | Same provenance machinery applies if scored `OBSERVED` (`CONFIRMED FROM REPOSITORY`); whether contextual-but-undeclared content should be scored `OBSERVED` at all is `UNRESOLVED` — no document defines this boundary |
| Tier 3 — Model inference from available evidence | Name-only or generic inference with no direct textual support | `INFERRED`, capped at confidence ≤80 by schema | `isEvidentiary()` (`packages/core-qualification/src/rules.ts:26-28`) — the existing precedent for what Qualification treats as sufficient evidence for a *different* criterion (`EVIDENCE_PRESENT`) — excludes `INFERRED` entirely. Whether that precedent transfers to a category-plausibility determination is `UNRESOLVED`, not decided by any document. |

**Note on first-party vs. third-party specifically — `CONFIRMED FROM REPOSITORY`:** since Research today has no mechanism to fetch or consult third-party sources at all, "should third-party evidence be permitted" is currently a hypothetical extension to Research's architecture, not a choice between two currently-supported options. Authorizing third-party evidence would require new fetch/source logic beyond anything any Path 2 document scopes — this is presented as a fact about feasibility, not a recommendation against it.

### 6.4 Sufficiency choices — none selected

1. **Which evidence sources are permitted:** {first-party (homepage) only — the only option requiring zero new Research-architecture work; first-party plus third-party — requires new, unscoped fetch logic}.
2. **Minimum evidence required for MATCH:** {Tier 1 only; Tier 1+2; Tier 1+2+3}.
3. **Minimum evidence required for MISMATCH:** same tier choices as above, decided independently (a document could set a different bar for MATCH than for MISMATCH, though none currently does).
4. **Can inference alone (Tier 3 / `INFERRED`) establish MATCH?** {Yes; No — requires at least `OBSERVED`}.
5. **Can inference alone establish MISMATCH?** {Yes; No}. The task instruction is explicit that absence of evidence must not itself become MISMATCH — this is distinct from the question of whether a *weak inference* (not mere absence) can establish MISMATCH, which remains open.
6. **Insufficient-evidence behavior:** {UNKNOWN (working assumption per task instruction, not yet formally ratified by Product Owner — see `requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §4, Decision 1); reject/hold in Qualification; continue without gating (consistent with a Q2/informational-only D4 choice); require stronger evidence before any determination is recorded at all; another repository-compatible behavior not yet identified}.

**Status:** `PRODUCT OWNER DECISION REQUIRED`

---

## 7. D4 — Qualification Consumption Mode

### 7.1 Current architecture — `CONFIRMED FROM REPOSITORY`

- `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT']` exactly (`packages/core-qualification/src/types.ts:12`).
- `evaluateEvidencePresent()` (`rules.ts:67-79`) uses `isEvidentiary()` (`rules.ts:26-28`: `classification === 'OBSERVED' && supersededAt === null`) as its sufficiency test.
- `evaluateNeedDetected()` (`rules.ts:42-51`) passes through `Opportunity.needDetected` unchanged, explicitly declining (per its own doc comment) to "reinterpret research evidence to create a need Need Detection did not detect."
- Signals reach Qualification via `signals.listByProspect(userId, prospectId)` (`repository.ts:28`), already used for `EVIDENCE_PRESENT`.
- `evaluateQualificationForOwner()` (`service.ts:59-78`) evaluates criteria sequentially with a short-circuit (`evaluator.ts:21-43`).
- Opportunity creation (`createOpportunityForOwner`, `packages/core-opportunity/src/service.ts:112-151`) and Qualification are independent, separately-invoked steps — no code path today gates the former on the latter or on any Research result.

### 7.2 Q1 — New Qualification criterion

| Aspect | Finding | Tag |
|---|---|---|
| Required code surface | `types.ts` (extend `QUALIFICATION_CRITERIA`), `rules.ts` (new rule function, pattern-matching `evaluateNeedDetected()`/`evaluateEvidencePresent()`), `evaluator.ts` (invoke, fold into result) | `CONFIRMED FROM REPOSITORY` |
| Result semantics | The new criterion's pass/fail becomes load-bearing — can affect whether an Opportunity reaches `QUALIFIED`, subject to D5 | `CONFIRMED FROM REPOSITORY` (mechanism) / `PRODUCT DECISION REQUIRED` (whether it should) |
| UNKNOWN behavior | Not defined by any existing criterion pattern — `EVIDENCE_PRESENT`'s `isEvidentiary()` treats non-`OBSERVED` as simply not evidentiary (pass/fail binary), with no explicit third "hold" state in `StoredQualification` today | `CONFIRMED FROM REPOSITORY` (gap) |
| MISMATCH behavior | Same gap — no existing criterion produces a result equivalent to "actively disqualifying evidence," only "evidence present" or "evidence absent" | `CONFIRMED FROM REPOSITORY` (gap) |
| Evidence presentation | Would reuse whatever the new field (D1) persists | Depends on D1 |
| Interaction with existing criteria | `evaluator.ts`'s short-circuit pattern (`:21-43`) would need to accommodate a third criterion; `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md` §13 already documents this extension pattern as supported: *"qualification-v1 evaluator versioning already supports adding new criteria without breaking existing ones"* (`PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md:333`) | `CONFIRMED FROM REPOSITORY` (precedent that the pattern is extensible) |

**Directly relevant precedent — `CONFIRMED FROM REPOSITORY`:** R-72 (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md:220-263`) proposed exactly this shape of extension for a different evidence-quality gate: *"`INSUFFICIENT_EVIDENCE` or `NOT_QUALIFIED` must be reachable outcomes specifically because of an R-70 or R-71 failure, distinguishable... from today's only failure reason"* (`:235-239`), to be recorded "at minimum in the persisted `criteria` reasons, per the existing `qualifications.criteria` jsonb shape." This shows the `criteria` jsonb shape is already understood, elsewhere in this repository's governance, as extensible to carry a *reason* distinguishable from "no need detected" — a directly applicable precedent for how a category-plausibility criterion's failure reason could be represented, without this document deciding that it should be.

### 7.3 Q2 — Evidence-only / non-gating

| Aspect | Finding | Tag |
|---|---|---|
| Consumption mechanism | Reads the Research-produced field via the existing `signals.listByProspect` path, for display/review purposes; `QUALIFICATION_CRITERIA`/`evaluator.ts` untouched | `CONFIRMED FROM REPOSITORY` |
| Whether Qualification remains unchanged | Yes, entirely — zero code change in `core-qualification` | `CONFIRMED FROM REPOSITORY` |
| How users would see it | Would require a UI decision (D10 in the final decision record) independent of this choice — Q2 does not itself define visibility | `UNRESOLVED` |
| Business value without gating | The determination exists and is queryable/reviewable but cannot, by construction, change whether an Opportunity reaches `QUALIFIED` — its value under Q2 is informational/advisory only, contingent on some consumer (human reviewer, future UI) actually reading it | `INFERENCE` (a logical consequence of "non-gating," not a new fact) |

### 7.4 Opportunity creation / state-machine impact — `CONFIRMED FROM REPOSITORY`

Neither Q1 nor Q2, in the forms analyzed by any prior Path 2 document, requires changing `createOpportunityForOwner` or the Opportunity state machine — `StoredOpportunity` (`packages/core-opportunity/src/types.ts:40-59`) has no category field today and none is proposed by either option. A *third*, more disruptive placement — using the plausibility result to prevent Opportunity creation itself, rather than only gating Qualification afterward — has **no existing architectural support in any form** (no traced code path gates `createOpportunityForOwner` on any Research result today). This placement question is carried forward as part of D5 (§8.4 below), since it is really a question about *when* MISMATCH takes effect, not about the Q1/Q2 consumption-mode choice itself.

**Status:** `PRODUCT OWNER DECISION REQUIRED`

---

## 8. D5 — MATCH / MISMATCH / UNKNOWN & Gating

### 8.1 Precise meaning of each state, per Path 2 scope — `CONFIRMED FROM REPOSITORY` (as previously defined, not repository-derived facts)

These three states were **introduced** by `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §8 as "the requested model," explicitly **not** discovered in the repository — this document does not treat them as pre-existing repository facts, only as the working definitions carried forward consistently across every Path 2 document:

- **MATCH** — evidence supports that the business belongs to at least one participant target segment (subject to D2's segment semantics).
- **MISMATCH** — evidence supports that the business is outside all participant target segments (subject to D2).
- **UNKNOWN** — available evidence is insufficient, ambiguous, inaccessible, or contradictory (subject to D3's sufficiency bar).

These are distinct from, and must not be conflated with, the existing `OBSERVED`/`INFERRED`/`UNKNOWN` **evidence-classification** enum (§6.2 above) — the same word "UNKNOWN" appears in both vocabularies with different meanings (evidence quality vs. plausibility result), a distinction every Path 2 document has preserved and this document preserves as well.

### 8.2 MATCH — decision questions

- **What minimum evidence is required?** Directly a function of D3 (§6.4) — not decided here.
- **What does MATCH permit?** `PRODUCT DECISION REQUIRED` — no document states an effect. Candidates: {no effect (pure information); supports the existing `EVIDENCE_PRESENT` criterion somehow — relationship undefined by any document; contributes toward `QUALIFIED` as part of a new criterion under Q1}.
- **Does MATCH merely inform Qualification, or explicitly allow progression?** `PRODUCT DECISION REQUIRED` — "allow progression" implies MATCH could be a precondition for something (e.g., required for `QUALIFIED`), which is a stronger, gating role than "inform." No document chooses between these.

### 8.3 MISMATCH — decision questions

**What does MISMATCH mean?** Per §8.1, evidence supporting exclusion from all target segments — this much is fixed by the working definition. What it *does* is entirely open:

1. **Fails a Qualification criterion** — requires Q1 (D4); requires a new failure-reason distinguishable in the `criteria` jsonb, per the R-72 precedent (§7.2).
2. **Holds the candidate** — no "hold" state exists in `StoredQualification` today (`CONFIRMED FROM REPOSITORY`: only `QUALIFIED`/`NOT_QUALIFIED`-shaped outcomes are traced in any prior document); a hold state would be new.
3. **Prevents Opportunity creation** — `CONFIRMED FROM REPOSITORY`: no traced code path in `createOpportunityForOwner` gates on any Research result today; this is the most architecturally disruptive of the five options.
4. **Prevents display** — no UI mechanism was inspected by any Path 2 document (D10, unresolved); whether "prevent display" is even a meaningful distinct option depends on UI decisions not made anywhere.
5. **Remains informational only** — requires Q2 (D4); zero Qualification-code effect.

**Architectural possibility of each, traced:**

| Behavior | Architecturally possible today without new mechanism? |
|---|---|
| Fails a Qualification criterion (Option 1) | Yes, via Q1's new-criterion pattern (extensible per `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md:333`) |
| Holds the candidate (Option 2) | No — no "hold" state exists in `StoredQualification`/`StoredOpportunity` today |
| Prevents Opportunity creation (Option 3) | No — no gating mechanism exists on `createOpportunityForOwner` in any form |
| Prevents display (Option 4) | `UNRESOLVED` — depends on undecided UI (D10) |
| Informational only (Option 5) | Yes, trivially — this is the "do nothing new" option |

### 8.4 UNKNOWN — decision questions

**What does UNKNOWN mean?** Per §8.1 and the task's working assumption (§6.4 item 6): insufficient/ambiguous/inaccessible/contradictory evidence, explicitly not equated with MISMATCH by default (this is a working assumption from task instruction, `requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §4, not yet formally ratified). What it *does*:

1. **Remains eligible** ("no opinion, proceed") — Qualification behaves as if the criterion were not evaluated.
2. **Fails Qualification** — treats absence of a positive determination the same as a negative one; the same architectural gap as MISMATCH Option 1 (requires Q1).
3. **Holds** — same "no hold state exists" gap as MISMATCH Option 2.
4. **Requires more research** — implies a rerun-triggering mechanism; `CONFIRMED FROM REPOSITORY`: no existing mechanism observes a plausibility result and triggers a fresh Research run (this is a broader gap than D6's freshness questions, which concern *how* reruns are scoped once triggered, not *whether* one is triggered by an UNKNOWN result specifically).
5. **Remains informational only** — same as MISMATCH Option 5.

### 8.5 Opportunity creation gate — the central architectural question

> **Should category plausibility be able to prevent Opportunity creation, or should it only affect Qualification after an Opportunity already exists?**

**Consequences of each, traced against current code:**

- **Only affects Qualification (no Opportunity-creation gate):** `CONFIRMED FROM REPOSITORY` as the only placement with existing architectural support. `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) and `evaluateQualificationForOwner` (`packages/core-qualification/src/service.ts:59-78`) are independent, separately-invoked steps today — an Opportunity would be created unconditionally, and category plausibility (under Q1) would determine only whether it subsequently reaches `QUALIFIED`. This preserves every Opportunity as a durable, reviewable record (consistent with R-13's requirement, `PRD:714-723`, that Opportunity creation persist "prospect + detected need + evidence linkage + recommended offer as a durable record with a state" — a MISMATCH would become part of that state, not prevent the record from existing).
- **Prevents Opportunity creation:** `CONFIRMED FROM REPOSITORY` as requiring **new gating logic with no existing precedent in any form** — no traced code path today conditions `createOpportunityForOwner` on any Research result. This would be a materially larger architectural change than any other option analyzed in D4/D5, and would mean a MISMATCH candidate leaves no durable record at all (a different tradeoff than "record exists but is not qualified").

This must remain a Product Owner decision — no document resolves it, and this document does not resolve it either.

**Status:** `PRODUCT OWNER DECISION REQUIRED` (MATCH effect, MISMATCH effect, UNKNOWN effect, and the Opportunity-creation-gate placement are four distinguishable sub-decisions, none selected)

---

## 9. Cross-Cutting Constraints

### 9.1 D6 compatibility — traced per D0–D5 option, not assumed

D6 is `DECIDED`: **PER SEARCH + PROSPECT** storage scope, historical attribution **PRESERVE**, cross-search overwrite **NOT ALLOWED**.

- **D1:** As shown in §4.5, only Candidate 3 (a dedicated Search+Prospect entity) natively satisfies D6 without further change. Candidates 1 and 2 (both built on the existing, Prospect-only-keyed `ResearchSignal`) would violate D6 if implemented using `ResearchSignal`'s current supersession mechanism unmodified — this is the same architectural tension the final decision record's D6 section already names as the "architectural implication," now confirmed to apply specifically and only to Candidates 1/2, not to Candidate 3.
- **D2:** No direct D6 interaction — multi-segment semantics affect what a single Search's determination *contains*, not which Search it belongs to.
- **D3:** No direct D6 interaction — evidence sufficiency affects the *quality bar* for a determination, not its attribution.
- **D4/D5:** If Qualification gates on a per-Search-scoped result (per D6), then "the current Search + Prospect determination" (D6's own consumption rule) must be what any Q1 criterion reads — `CONFIRMED FROM REPOSITORY` that the existing `signals.listByProspect(userId, prospectId)` call, unmodified, returns signals scoped by Prospect only, not by Search. **This means: whichever D1 candidate is chosen, if it does not natively carry a Search-scoping key, Qualification's read path (`signals.listByProspect`) would need to change to also filter by the current Search — a consequence not previously identified in the D4 analysis (§7.1), and not addressed by any prior Path 2 document.** This is presented as a newly surfaced dependency, not a decision.

### 9.2 R-71 separation — `CONFIRMED FROM REPOSITORY`, re-verified in this task

`TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` (`packages/core-qualification/src/adapters.ts:136-152`) governs exclusion from `suggestOffers()`/`toOfferSignals()` for the topic-vs-problem relevance axis (R-71) specifically. None of the D0–D5 options analyzed in this document — regardless of which choice is eventually made — requires adding the new field to `TOPICAL_FIELDS`, routing it through `suggestOffers()`/`toOfferSignals()`, or otherwise touching Need Detection or Opportunity creation's *existing* logic (as opposed to the separate, D5-specific question of a *new*, category-plausibility-driven gate, which is architecturally distinct from R-71's mechanism). R-71 remains unchanged under every option surveyed.

### 9.3 Scoring/ranking separation — `CONFIRMED FROM REPOSITORY`, re-verified in this task

`scoreOpportunity`/`scoreOpportunityForOwner` (`packages/core-opportunity/src/service.ts:264-401`) and `rankOpportunities` are an independently authorized, separately-gated worker step (`worker.ts:385-395`) with no data dependency on Research's field set or Qualification's criteria in either direction. None of the D0–D5 options requires changing `FACTOR_WEIGHTS`, `OpportunityScore`, or the ranking algorithm. The only scoring-adjacent touchpoint identified anywhere in the Path 2 chain is `FIELD_KIND` (D7, already separately tracked in the final decision record) — and D7 was already confirmed to have zero live-scoring consequence today, since the `acq_lead_research`/`core-acquisition` scorer path is confirmed inactive.

### 9.4 Provider neutrality — `CONFIRMED FROM REPOSITORY`

`researchModelFactory.ts` is documented in its own header comment as "the ONE place in the codebase allowed to branch on provider identity," selecting among Anthropic/OpenAI/Gemini adapters behind a single `ResearchModel` interface (`researcher.ts:44-56`). Every D1 candidate, every D2 semantic/parsing option, and every D3 evidence-sufficiency choice must be expressed at the shared `schema.ts`/`provider.ts`/`prompt.ts` layer to remain compliant — none may be implemented only inside `anthropicModel.ts` (or any single provider's adapter) without breaking behavioral consistency for the other two configured providers. This is not a new constraint introduced by category plausibility; it is an existing architectural rule that every option analyzed in this document must satisfy identically. Specifically relevant to D2: Semantic D ("let Research interpret the compound target as-is," §5.2) carries the highest provider-neutrality risk of the four semantics, because an unconstrained, prompt-only interpretation of a compound string could plausibly be interpreted differently by Anthropic, OpenAI, and Gemini absent an explicit rule — this is a risk observation, not an argument against selecting Semantic D.

---

## 10. Decision Dependency Map

```text
D0  (MVP status — gates whether D1–D5 are acted on now)
     ↓
D1  (output location) — must be evaluated against the already-DECIDED D6 constraint;
     Candidates 1/2 require a separate, unscoped D6-compatibility mechanism;
     Candidate 3 satisfies D6 natively but has the largest schema/dependency footprint
     ⇅ (coupled)
D2  (multi-segment semantics/parsing) — Semantic C requires a richer D1 shape than
     Semantics A/B/D; parsing choice affects D8 (input contract, tracked in the final
     decision record) as well
     ↓
D3  (evidence sufficiency) — must be fixed before D4/D5 can meaningfully define what
     a MATCH/MISMATCH/UNKNOWN determination actually rests on
     ↓
D4  (Qualification consumption mode: Q1 vs Q2) — cannot be chosen against an undefined
     evidentiary signal from D3
     ↓
D5  (state behavior + Opportunity-creation-gate placement) — meaningless until D4 fixes
     whether Qualification gates on the result at all; the Opportunity-creation-gate
     question is independent of D4/D5's other sub-questions and can, in principle, be
     answered before or after them, but has no existing architectural support either way
```

This ordering is evidence-based: D1↔D2's coupling, D3's precedence over D4, and D4's precedence over D5 are traced directly to structural dependencies identified in §§4, 5, 7, 8 above — not assumed by analogy to the earlier D0–D11 dependency map (which remains valid and is not contradicted by this document, only elaborated for D0–D5 specifically).

---

## 11. Product Owner Questions

Direct-answer form, for convenience — full evidence for each is in §§3–8 above:

1. **D0:** Is category plausibility required now (reopening/extending the MVP exit), an enhancement inside the current MVP effort (exit stays satisfied), or post-MVP (scheduled later, per `MVP_SCOPE_BOUNDARY.md` §11's phase sequence)?
2. **D1:** Which output-location candidate — new `LeadResearch` field, new `ResearchSignal` kind, or a dedicated Search+Prospect entity — and, if Candidate 1 or 2, how should the D6 per-Search-attribution requirement be satisfied given `ResearchSignal`'s current Prospect-only keying?
3. **D2:** Which multi-segment semantic (ANY / ALL / segment-level-aggregated / raw-compound-as-is), and which parsing approach (none / deterministic / model-assisted / hybrid)?
4. **D3:** Which evidence sources are permitted (first-party only, or first-party plus third-party requiring new Research-architecture work); what minimum tier is required for MATCH; what minimum tier is required for MISMATCH; can inference alone establish either; and what is the exact behavior when evidence is insufficient (beyond the working UNKNOWN-not-MISMATCH assumption, which itself needs formal ratification)?
5. **D4:** Q1 (new Qualification criterion, load-bearing) or Q2 (evidence-only, non-gating)?
6. **D5:** What does MATCH permit; what does MISMATCH do (informational / new criterion failure / hold / prevent Opportunity creation / prevent display); what does UNKNOWN do (same five-option range); and should category plausibility ever be able to prevent Opportunity creation itself, given that no existing code path supports that placement today?

---

## 12. Explicitly Undecided Items

Everything in §§3–8 remains undecided by this document. In addition, this document surfaces one previously unstated dependency (§9.1): satisfying D6 for Qualification's *read* path (`signals.listByProspect`) may require a change to that function's filtering (to also scope by current Search), independent of which D1 output-location candidate is chosen — this is flagged as a newly identified consequence of combining D6 (already decided) with D4/D5 (not yet decided), not as a new decision this document adds to the register, since it is a direct implication of D6 rather than a free-standing choice.

---

## 13. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

D0–D5 preparation, including the newly surfaced D6-compatibility dependency in §9.1, does not grant, imply, or partially authorize any implementation work.

---

## 14. Repository Safety Record

```text
Starting HEAD:              5992b82b9adff492c480442d68a954f2a03bfb28
Ending HEAD:                5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Branch:                     phase-17-r34-worker-orchestration

Files created:              requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md (this file)
Production files changed:   0
Test files changed:          0
PRD changed:                 0
Configuration changed:       0
Database/schema changed:     0
Provider implementations changed: 0
Existing decision documents modified: 0 (including
  PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md, not touched by this task)
Live API calls:              0
Staged files:                none
Commit:                      none
Push:                        none

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, all prior requirement/*.md
documents, .claude/, and CLAUDE.md included).
```
