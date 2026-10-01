# Discovery Category-Plausibility Product Decision

```text
STATUS: DECIDED
DECISION: OPTION B — RESEARCH / QUALIFICATION-OWNED
```

**Decision history** (preserved, not overwritten): this document was first published with `STATUS: PRODUCT DECISION REQUIRED` / `DECISION: UNDECIDED` on 2026-09-25, as pure decision-preparation material (§1-§12 below, unchanged since). The Product Owner has since reviewed that material and selected Option B on 2026-09-25. Nothing in §1-§12's factual findings has been altered by that selection — they are reproduced below exactly as originally established.

This document records that decision and its immediate scope boundary. **It does not implement Option B.** No repository state beyond this file was changed to produce it (see §20).

---

## 1. Decision Metadata

```text
Status:                 DECIDED
Decision:                OPTION B — RESEARCH / QUALIFICATION-OWNED
Decided:                 2026-09-25
Current HEAD:            5992b82b9adff492c480442d68a954f2a03bfb28
Branch:                  phase-17-r34-worker-orchestration
Triggering live validation: first controlled Client Finder validation, 2026-09-25
Search ID:               b81ab156-edca-42e6-8b05-0c0f05bc0511
Prior audit consumed:    requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md
```

---

## 2. Decision Question

> **Where should category-plausibility of discovered businesses be owned in the Client Finder MVP — Discovery, Research/Qualification, or explicitly deferred (accepted as a known MVP limitation)?**

**Answered:** Research/Qualification (Option B).

---

## 3. Observed Evidence

From the one completed live search (`b81ab156-edca-42e6-8b05-0c0f05bc0511`):

```text
Businesses discovered:              12
Identifiable target-segment matches: 0
Confirmed mismatches (by name text): 8
Ambiguous (by name text):            4
Businesses researched:               0
Opportunities created:               0
Qualification results:               0
Participant reviews:                 0
```

Research did not execute for any candidate — the Anthropic account had insufficient credit balance (HTTP 400). This is a single observation from a single search, not a repeated-trial measurement. **This blocker is unrelated to, and unresolved by, the decision recorded here** (see §20).

---

## 4. Confirmed Facts

Each traced to code, persisted data, or a governance document by `DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md`:

- **FACT.** The participant's full `targetCustomer` text reached the Google Places request unmodified — traced through `packages/core-search/src/service.ts:78-95` (verbatim `ServiceProfile` → `Search.parameters` copy, no transformation) into `packages/core-discovery/src/googlePlacesProvider.ts:11-15` (`buildQuery`).
- **FACT.** The constructed query for this run was the single free-text sentence `"Website development for Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators in Mumbai"`, with `service` as the grammatical lead clause.
- **FACT.** The Google Places request (`packages/core-discovery/src/googlePlacesClient.ts:64-117`) sends only `{ textQuery: <string> }` with field mask `places.displayName,places.websiteUri` — no `includedType`, `locationBias`, or `strictTypeFiltering` is sent.
- **FACT.** `DiscoveryCandidate` (`packages/core-discovery/src/provider.ts:9-12`) and `StoredCompany` (`packages/core-discovery/src/types.ts:7-14`) carry no category/type/industry field of any kind — this is a structural property of the current contract, not an omission in one function.
- **FACT.** `normalizeCandidate()` (`packages/core-discovery/src/normalize.ts:43-52`) accepts a candidate iff it has a non-empty name and a parseable website URL. It performs no category, industry, or target-customer check, and structurally cannot — the type it receives carries no such field.
- **FACT.** Research's own schema has a `targetCustomers` observation field (`packages/core-opportunity/src/adapters.ts:140,152` — `TOPICAL_FIELDS`), but it describes **who the discovered business itself serves** (a topical/descriptive fact about that business), not whether the business matches the participant's stated target-customer category. Per R-71 (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, implemented in `adapters.ts`), fields in `TOPICAL_FIELDS` are explicitly **excluded** from need/offer detection (`suggestOffers()`) — so even where Research runs successfully, this adjacent field does not today feed into any category-plausibility determination.
- **FACT.** Of the 12 discovered businesses, 8 names contain explicit self-description as a web-development/software/digital-marketing/adtech business (e.g., "Web Development & Digital Marketing Agency," "Software Development Company... Website Development"); 4 have generic names with no sector language; 0 contain any indication of being a restaurant, cafe, boutique retailer, e-commerce brand, hotel, resort, or tour operator.
- **FACT.** No governance document reviewed (`MVP_SCOPE_BOUNDARY.md`, PRD V2.2 R-06/R-07/R-08, `DISCOVERY_PROVIDER_SELECTION_AUDIT.md`, `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`, `PHASE_18_PROVIDER_EXECUTION_CLOSURE.md`) assigns responsibility for target-customer category-plausibility to a specific pipeline stage.

---

## 5. Inferences

Explicitly separated from fact:

- **INFERENCE.** The query's shape — `service` leading, `targetCustomer` compounded into one trailing clause — is *consistent with* Google's Text Search NLP weighting the short "Website development... in Mumbai" phrase more heavily than the long compound target-customer clause, given that 5 of the 12 returned names contain the near-literal phrase "Website Development... Company in Mumbai." This is not proven: no comparison call with a differently-structured query was made (disallowed under this task's and the prior audit's read-only rules), so Google's actual ranking mechanism was not observed directly.
- **INFERENCE.** The 4 "ambiguous" businesses (generic names, e.g. "Waytoglobal Solutions," "Stymeta Technologies") were discovered by the same query, alongside 8 explicit web/software vendors — it is plausible they belong to the same general category, but this is not established from stored data (no category field exists to check), so it remains an inference, not a fact.

---

## 6. Unknowns

- **UNKNOWN.** Whether Google Places' own ranking/matching algorithm treats this query's phrasing as favoring "service" over "target customer" — would require a controlled comparison experiment, not run in this or the prior audit.
- **UNKNOWN.** Whether Research, had it executed, would have produced any usable evidence for any of the 12 candidates (since 0 were researched, no data exists either way).
- **UNKNOWN.** Whether a category-filtered or restructured Discovery query would produce a meaningfully different result set for this same participant profile — not tested.
- **UNKNOWN.** Whether this specific 0/12 outcome is representative of this query shape in general, or an outcome specific to this one geography/service/target-customer combination — only one search has been run.

---

## 7. Current MVP Contract

Answers to the five required questions, citing the exact document/section reviewed. Governance documents consulted: `requirement/MVP_SCOPE_BOUNDARY.md`, `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md`, `requirement/DISCOVERY_PROVIDER_SELECTION_AUDIT.md`, `requirement/PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`, `requirement/PHASE_18_PROVIDER_EXECUTION_CLOSURE.md`.

**Question 1 — Does the current MVP contract explicitly require discovered businesses to match the target-customer category?**

```text
UNSPECIFIED
```
`MVP_SCOPE_BOUNDARY.md` §2 states the MVP promise as finding businesses "that appear to have a genuine need for that service" — this is worded at the level of *need*, not explicitly at the level of *category membership*. §5.2 (Discovery, in-scope) lists only "Business discovery," "Provider abstraction," "Candidate normalization," "Deduplication" — no category-match line item. PRD V2.2 R-06 (line 625-632) says only: "Obtain candidate businesses from an external source behind a provider abstraction, so the source can change without changing the engine." Neither document uses the words "category," "target-customer match," or "plausibility" in connection with Discovery.

**Question 2 — Does it explicitly assign that responsibility to Discovery?**

```text
UNSPECIFIED
```
No document reviewed states this. R-06/R-07/R-08 describe Discovery's job as obtaining, normalizing, and deduplicating candidates — none mention filtering by category or target-customer.

**Question 3 — Does it explicitly assign that responsibility to Research?**

```text
UNSPECIFIED
```
PRD V2.2 Stage H (RESEARCH, line 350-362) states Research's job as: "Gather sources; produce structured, schema-valid output" with "AI responsibility: Produce observations with evidence; never assert without a source." This describes evidence quality and provenance, not target-customer category verification. As noted in §4 above, Research's schema does collect a `targetCustomers` field, but it is explicitly a *topical* field excluded from need/offer detection by R-71 — no document states this field is (or should be) used to verify category match against the participant's own target-customer parameter. **This document's decision (§13) newly assigns category-plausibility to Research/Qualification going forward — it does not retroactively claim the PRD already assigned it there.**

**Question 4 — Does it explicitly assign that responsibility to Qualification?**

```text
UNSPECIFIED
```
Qualification's documented criteria, per `DISCOVERY_PROVIDER_SELECTION_AUDIT.md`'s own citation of `packages/core-qualification/src/service.ts` (`evaluateQualificationForOwner()`), are `NEED_DETECTED`/`EVIDENCE_PRESENT` — need and evidence presence, not target-customer category match. No document reviewed states Qualification is responsible for category-plausibility. **Same caveat as Question 3 applies.**

**Question 5 — Does it explicitly allow broad category-mismatched candidates?**

```text
UNSPECIFIED
```
No document explicitly permits this, and no document explicitly forbids it. `MVP_SCOPE_BOUNDARY.md` §9 Criterion 9 ("the system does not fabricate business needs") and the primary validation question ("Would you actually contact this business?") speak to the *ultimate, user-facing* outcome, not to what Discovery itself may return internally before Research/Qualification/human review.

---

## 8. Current Architecture

Traced by the prior audit (`DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md` §4, §8) and re-confirmed here; no code was modified to produce this description.

**Discovery** (`packages/core-discovery`): Receives a frozen `Search.parameters` snapshot (service, targetCustomer, geography, keywords — minProjectValuePaise/triggers/rationale are never read by Discovery). Constructs one free-text query string via `buildQuery()`. Requests only `displayName`+`websiteUri` from Google Places (no category/type field requested). Normalizes candidates by checking only name-presence and website-URL-parseability. Persists via find-or-create keyed on `normalized_domain` (per-user) and `(search_id, company_id)` (per-search) — pure identity dedup, no relevance filtering.

**Research** (`packages/core-research`): For each persisted Prospect, fetches exactly the homepage at the candidate's `normalizedDomain` (no disambiguation, no search) and asks the selected LLM (Anthropic/OpenAI/Gemini, per `RESEARCH_PROVIDER`) to produce structured observations across a fixed schema, including topical fields (`companySummary`, `businessModel`, `targetCustomers` — the business's own customers) and problem/opportunity fields (`visibleProblems`, `growthOpportunities`, `websiteIssues`, etc.), each classified `OBSERVED`/`INFERRED`/`UNKNOWN` with confidence and provenance.

**Opportunity Creation** (`packages/core-acquisition/src/offer.ts`, `packages/core-opportunity/src/adapters.ts`): `suggestOffers()` performs a case-insensitive **substring** match of the participant's service-rule keywords against research-signal text, restricted to problem/opportunity-shaped fields (topical fields like `targetCustomers` are excluded from this match per R-71). It does not read or compare against the participant's `targetCustomer` parameter at all — matching is keyword-vs-service-rule only, not keyword-vs-target-customer.

**Qualification** (`packages/core-qualification/src/service.ts`, `evaluateOpportunityQualification()`): Evaluates exactly two criteria, `NEED_DETECTED`/`EVIDENCE_PRESENT` (`packages/core-qualification/src/types.ts:12`, `QUALIFICATION_CRITERIA`), against the Opportunity's persisted evidence. Per the prior audit's citation, this does not reference the participant's `targetCustomer` parameter either. `packages/core-qualification/src/rules.ts:8-12`'s own comment records that a minimum-confidence/fit threshold and a disqualifying-evidence criterion were **deliberately excluded from v1** ("no repository contract represents either concept today; inventing one would be a business-rule guess") — a documented precedent of the same kind of gap this decision now addresses for category-plausibility specifically.

**Observation:** at no point in the traced pipeline — Discovery, Research, Opportunity, or Qualification — does any existing code compare a discovered business against the participant's stated `targetCustomer` value. The 12 discovered names in this run were never checked against "Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators" by any stage, at any point, for any reason.

---

## 9. Option A — Discovery-Owned

### Definition
Discovery is responsible for producing candidates that are plausibly within the participant's target-customer category, before Research runs.

### Evidence supporting compatibility
`buildQuery()` already receives `targetCustomer` as one of its inputs (FACT, §4) — the value is available at the point a category-aware query or filter could be constructed, without needing to plumb a new field through from elsewhere. `DiscoveryCandidate`/`normalizeCandidate()` are the natural point in the existing pipeline where a plausibility check would run before persistence, since this is already the sole gate today (FACT, §4/§8).

### Consequences
- Query construction would need to change from the current single blended sentence (documented consequence: FACT, this is achievable without changing the `DiscoveryProvider` contract's external shape, per `DISCOVERY_PROVIDER_SELECTION_AUDIT.md` §14's note that adding logic inside the existing adapter requires no downstream contract change).
- Requesting Google's category/type fields (`types`, `includedType`) would require extending the field mask (currently `places.displayName,places.websiteUri` only) and extending `DiscoveryCandidate`/`StoredCompany` to carry a category value if that value is to be persisted (INFERENCE: a reasonable engineering consequence of wanting to filter or display category, not proven necessary if filtering happens transiently without persisting category).
- Any new filtering logic and its tests would be new code, not present today.

### Required future scope if selected
A separate, explicitly-scoped implementation task would be required to: (a) decide the specific query/filter mechanism, (b) decide whether category is persisted or only used transiently, (c) write tests. This decision record does not authorize any of that.

### Non-goals
Selecting Option A does **not** authorize a specific query rewrite, a specific filtering algorithm, a schema change, or any code change. It establishes ownership only.

**Status: NOT SELECTED.**

---

## 10. Option B — Research/Qualification-Owned

### Definition
Discovery remains intentionally broad. Research and/or Qualification determines whether a candidate is a plausible target customer, using evidence gathered from the candidate's own source material.

### Evidence supporting compatibility
Research already collects a `targetCustomers` field per candidate (FACT, §4/§8) — structurally, a place to compare "who this business serves" against the participant's stated target customer already exists in the schema, even though it is currently excluded from downstream matching (R-71) and never compared against the participant's own `targetCustomer` value by any code today.

### Consequences
- Discovery would continue returning candidates without regard to category (as it does today) — this is a continuation of current behavior, not a change.
- Research cost (LLM calls) would be incurred for candidates that a category check might have excluded earlier — **FACT, evidenced by this run**: this search incurred 3 Anthropic call attempts against candidates that, on their face, are unlikely target customers (8 of 12 are self-described competitors of the participant), though the calls failed for an unrelated reason (insufficient credit) before any research cost was actually realized here.
- Qualification does not currently evaluate target-customer evidence at all (FACT, §8) — using this option would require Qualification's criteria to be extended, which is not authorized by this decision record.
- The existing R-71 exclusion of `targetCustomers` from need/offer detection interacts with using that same field for category-plausibility — see §16 for the precise, non-resolved boundary question.

### Required future scope if selected
A separate, explicitly-scoped task would be required to: (a) decide how/whether the existing `targetCustomers` research field is used for plausibility, (b) decide whether Qualification gains a new criterion, (c) reconcile this with R-71's existing exclusion rule, (d) write tests. This decision record does not authorize any of that.

### Non-goals
Selecting Option B does **not** authorize changing Research's schema, Qualification's criteria, or `suggestOffers()`'s matching logic. It establishes ownership only.

**Status: SELECTED BY THE PRODUCT OWNER, 2026-09-25.**

---

## 11. Option C — Explicitly Deferred

### Definition
Accept broad Discovery results, including category mismatches, as a known and explicitly documented MVP limitation. No new filtering at any stage.

### Evidence supporting compatibility
This is the option requiring the least change from current, observed behavior: today's code (Discovery through Qualification) performs no category-plausibility check anywhere (FACT, §8), so "explicitly deferring" it is a documentation act, consistent with the system's current behavior without any code change.

### Consequences
- Category-mismatched candidates would continue reaching Research/Opportunity/Qualification/the human reviewer exactly as they do today.
- The next live validation would measure how much category mismatch reaches a human reviewer and what effect (if any) it has on the primary validation question ("Would you actually contact this business?") — this is a measurement opportunity this option enables, not a claim about what that measurement would show.
- `MVP_SCOPE_BOUNDARY.md` §9 Criterion 9 ("the system does not fabricate business needs") would remain the operative safeguard against user-facing harm from a mismatched candidate, rather than a category check preventing the candidate from ever reaching Research.

### Required future scope if selected
Recording the acceptance itself (e.g., an amendment noting this as a known, accepted limitation) is the only action associated with this option, and even that is not authorized by this decision record — it would require its own explicit step.

### Non-goals
Selecting Option C does **not** retroactively validate that the 0/12 outcome observed in this run is acceptable product quality — it only means no engineering response is undertaken for this specific gap at this time.

**Status: NOT SELECTED.**

---

## 12. Option Comparison

| Dimension | Option A — Discovery | Option B — Research/Qualification | Option C — Deferred |
|---|---|---|---|
| Current code compatibility | `targetCustomer` already available inside `buildQuery()`'s scope (FACT); no category data currently requested/stored (FACT) — a gap to close | `targetCustomers` field already exists in Research's schema (FACT) but is currently excluded from downstream matching by R-71 (FACT) | Fully compatible with current code as-is — no gap to close (FACT) |
| Current governance compatibility | Not explicitly authorized or forbidden (§7, all UNSPECIFIED) | Not explicitly authorized or forbidden (§7, all UNSPECIFIED) | Not explicitly authorized or forbidden (§7, all UNSPECIFIED) |
| New Discovery responsibility | Would gain a plausibility-check responsibility it does not have today (FACT: not present in current code) | None — Discovery responsibility unchanged | None — Discovery responsibility unchanged |
| Research implications | Research would only run against Discovery-pre-filtered candidates (INFERENCE: fewer candidates reach Research, not proven since no filter exists yet to measure) | Research's existing `targetCustomers` field would need a defined role in a new plausibility determination, with a boundary question against R-71's current exclusion (FACT: interaction exists; resolution not defined — see §16) | None — Research behavior unchanged |
| Qualification implications | Likely none — Qualification would continue receiving only candidates Discovery already filtered (INFERENCE) | Would need a new criterion referencing target-customer evidence, which does not exist today (FACT: not present in current `NEED_DETECTED`/`EVIDENCE_PRESENT` criteria) | None — Qualification behavior unchanged |
| Candidate filtering implications | New filtering logic at/after `normalizeCandidate()` or in query construction (FACT: no such logic exists today) | New filtering logic after Research, before/at Qualification (FACT: no such logic exists today) | No new filtering anywhere (FACT: matches current behavior) |
| Research/API cost implications | Fewer candidates may reach Research if filtered earlier (INFERENCE, not measured) | Research cost is incurred for all discovered candidates regardless of category, as observed in this run (FACT: 3 Anthropic attempts were made against candidates including 8 self-described non-target-segment businesses, though all 3 failed for an unrelated credit reason) | Same as Option B's cost profile — unchanged from current behavior (FACT) |
| Effect on current MVP implementation | Requires new code in `core-discovery` (not yet written) | Requires new code in `core-research`/`core-opportunity`/`core-qualification` (not yet written) | No code change (FACT) |
| Required future changes | Query/filter design, possible schema extension, tests — all unscoped by this document | Qualification criteria design, R-71 reconciliation, tests — all unscoped by this document | Optional documentation of the accepted limitation only |
| Validation implications | Next validation would test Discovery output against a plausibility bar before Research runs | Next validation could allow broad Discovery and observe whether Research/Qualification, once extended, separates target businesses | Next validation would measure how much mismatch reaches a human reviewer |

No score, tier, or ranking was assigned to any row or option. **Option B is recorded above as selected (§10); this comparison table is preserved unedited from the original decision-preparation pass.**

---

## 13. Product Owner Decision

```text
DECISION: OPTION B — RESEARCH / QUALIFICATION-OWNED
DECIDED: 2026-09-25
```

**Recorded decision text (verbatim from the Product Owner's instruction):**

> Category plausibility of discovered businesses is owned by Research / Qualification, not Discovery. The Discovery layer remains responsible for broad candidate discovery. Research / Qualification is responsible for determining whether a discovered business plausibly belongs to the user's target-customer category.

### What this decision does NOT mean

Per the Product Owner's explicit instruction, Option B is an **ownership decision**, not an implementation mandate. It does **not** automatically mean:

- Research must be changed now;
- Qualification must be changed now;
- `targetCustomers` must immediately become a qualification field;
- R-71 must immediately be changed;
- Discovery must be left permanently unchanged (a future, separate decision could still add Discovery-side improvements unrelated to category-plausibility ownership);
- every discovered candidate must be researched;
- category plausibility must become a scoring factor.

Each of the above, if pursued, is a separate implementation or product decision requiring its own explicit authorization.

---

## 14. Accepted MVP Boundary

**Discovery.** Discovery may return broad candidate businesses. Discovery is **not** required to establish target-customer category plausibility before a candidate is persisted or before Research runs.

**Research.** Research is the intended stage at which evidence about a discovered business can be used to determine whether it plausibly matches the participant's target-customer definition.

**Qualification.** Qualification may consume that determination/evidence when deciding whether a candidate can proceed toward being surfaced as an Opportunity.

**However:** no implementation of this behavior is authorized by this decision record alone (§13, §15, §20).

---

## 15. Explicit Non-Goals

This decision does **not** authorize:

- Discovery query redesign;
- Google Places provider changes;
- category filtering inside Discovery;
- Discovery schema changes;
- immediate Research schema changes;
- immediate Qualification rule changes;
- scoring changes;
- ranking changes;
- R-70/R-71 changes;
- Opportunity state-machine changes;
- a live validation rerun;
- Anthropic usage;
- PRD modification.

Any of the above requires separate, explicit implementation authorization.

---

## 16. R-71 Interaction Analysis

Read: `requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, `requirement/PHASE_24_R70_R71_DECISION.md`, `requirement/PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`.

**Confirmed** (directly established by `PHASE_24_R70_R71_DECISION.md` §7-8 and `packages/core-opportunity/src/adapters.ts:135-152`):
- R-71's settled guarantee is narrow and specific: *"A purely topical/descriptive claim must not become offer-eligible merely because a service keyword appears"* (`PHASE_24_R70_R71_DECISION.md` line 191-194). It governs **need/offer detection** (`suggestOffers()`) only.
- `targetCustomers` sits in `TOPICAL_FIELDS` (an exclusion/denylist, per `adapters.ts:152` and `PHASE_24_R70_R71_DECISION.md` §8's own description of `TOPICAL_FIELDS` as "currently an exclusion/denylist") specifically so that a keyword collision inside a topical/descriptive field cannot spuriously trigger a "need" match.
- R-71's own recorded limitation states it "does not independently determine whether a problem-field claim is semantically relevant to the caller's specific service" (`PHASE_24_R70_R71_DECISION.md` line 221-223) — i.e., R-71 was never designed to address category-plausibility (a discovery-target-audience question) at all; it addresses topic-vs-problem relevance (a need-detection question). These are different questions that happen to share one field (`targetCustomers`).

**Potential conflict** (not resolved by any document, and not resolved here):
- If a future Option-B implementation chooses to feed `targetCustomers` (or new target-customer evidence) into **Need Detection** (`suggestOffers()`) rather than into a separate, new Qualification criterion, that would collide with R-71's current exclusion of `targetCustomers` from offer-eligibility and would require an explicit R-71 boundary decision.
- If instead a future implementation adds an **entirely new, additive Qualification criterion** (alongside the existing `NEED_DETECTED`/`EVIDENCE_PRESENT`) that consumes `targetCustomers` (or new evidence) independently of `suggestOffers()`, this would not, on the evidence available, require changing R-71's exclusion rule at all — but this is an implementation design choice not made by this document.
- `PHASE_24_R70_R71_DECISION.md` §8 separately records an open, unrelated regression risk: *"A future new topical research field could become offer-eligible unless [it is added to `TOPICAL_FIELDS`]"* — a general maintenance hazard for `TOPICAL_FIELDS`'s denylist design, not specific to this decision, but relevant if a *new* field (rather than the existing `targetCustomers`) were introduced for category-plausibility.

**Not authorized:**
- This document does not decide whether category-plausibility evidence should flow through Need Detection, a new Qualification criterion, or some other mechanism.
- This document does not modify, extend, or reinterpret R-71, `TOPICAL_FIELDS`, or `suggestOffers()`.

```text
FOLLOW-UP PRODUCT / SCOPE DECISION REQUIRED
```
(Specifically: whether target-customer-plausibility evidence participates in Need Detection, in a new Qualification criterion, or in neither existing mechanism — deferred to a future, separately-scoped decision.)

---

## 17. Implementation Gap Analysis

Documented for sizing only. **Nothing below is implemented or authorized by this document.**

### Research

| Item | Status |
|---|---|
| `targetCustomers` observation field exists in `leadResearchSchema` (`packages/core-research/src/schema.ts:179`) | `CURRENTLY EXISTS` |
| `researchInputSchema` has an optional `industry` field, already wired into the model prompt when present (`packages/core-research/src/prompt.ts:36,55`) | `CURRENTLY EXISTS` (field + prompt wiring), but **`CONFIRMED UNUSED`**: traced through `packages/core-research/src/service.ts:76-81` (`runResearchForOwner`, passes only `prospectId`/`companyId`/`companyName`/`normalizedDomain`) and `packages/core-research/src/anthropicResearchProvider.ts:66-71` (constructs `ResearchInput` with only `companyName`/`websiteUrl`/`sourceDocuments`) — no caller in the current codebase ever sets `industry`, `location`, or `socialProfileUrl` |
| Plumbing the participant's `targetCustomer` value from `Search.parameters` through to Research's input (e.g., into the existing but unused `industry` field, or a new field) | `LIKELY REQUIRED` if Research is to compare a candidate against the participant's actual target-customer text — today Research receives no participant-supplied context at all, only the candidate's own name/domain |
| A defined comparison/determination mechanism (prompt instruction, new schema field, or post-hoc classification) that turns "candidate's own described customers" + "participant's target customer" into a plausibility judgment | `REQUIRES SEPARATE DECISION` — no existing schema field or code path performs this comparison |

### Qualification

| Item | Status |
|---|---|
| `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT']` (`packages/core-qualification/src/types.ts:12`) — exactly two criteria, no third | `CURRENTLY EXISTS` (and is exhaustive — no extension point already present) |
| A documented precedent for deliberately deferring a related concept: `packages/core-qualification/src/rules.ts:8-12` records that a "minimum-confidence/fit threshold" was excluded from v1 because "no repository contract represents either concept today; inventing one would be a business-rule guess" | `CURRENTLY EXISTS` (as documented precedent, not as a mechanism) |
| A new `CATEGORY_PLAUSIBLE`-shaped criterion (or equivalent) | `REQUIRES SEPARATE DECISION` — would extend `QUALIFICATION_CRITERIA`, `evaluator.ts`, and `rules.ts`, none of which currently reference the participant's `targetCustomer` |

### Evidence

| Item | Status |
|---|---|
| `ResearchSignal`'s `OBSERVED`/`INFERRED`/`UNKNOWN` classification and provenance model | `CURRENTLY EXISTS` and is reusable in principle for a category-plausibility claim, the same way it is used for problem/opportunity claims today |
| A specific rule for what evidence justifies "plausible target customer" (e.g., is an `INFERRED` classification sufficient, as `EVIDENCE_PRESENT` currently requires `OBSERVED` only per Phase 24 Scenario E, Option C) | `REQUIRES SEPARATE DECISION` |

### Tests

| Item | Status |
|---|---|
| Existing qualification/research integration test harness (real Postgres, per `MVP_SCOPE_BOUNDARY.md` §5.7's "Integration testing" foundation) | `CURRENTLY EXISTS` |
| New unit tests for any new Research prompt/schema behavior | `LIKELY REQUIRED` if Research is extended |
| New unit tests for any new Qualification criterion | `LIKELY REQUIRED` if Qualification is extended |
| New end-to-end coverage proving category-plausibility affects real Search → Qualification outcomes | `LIKELY REQUIRED` if this decision is later implemented |

### Governance

| Item | Status |
|---|---|
| A PRD/requirement update documenting Research/Qualification's new category-plausibility responsibility | `REQUIRES SEPARATE DECISION` — see §18's `PRD CLARIFICATION MAY BE REQUIRED` note; not drafted here |
| An R-71 boundary clarification, if and only if `targetCustomers` (or new evidence) is routed through Need Detection rather than a separate Qualification criterion | `REQUIRES SEPARATE DECISION` (§16) |

---

## 18. MVP Exit Impact

Two of the task's three lettered sub-questions are independently supported by direct evidence; they are not mutually exclusive, so both are reported rather than forcing a single selection:

**Supported: "B — the issue is outside the existing 19-criterion exit contract."**
`MVP_SCOPE_BOUNDARY.md` §10's 19 exit criteria include "Businesses are discovered" and "Duplicates are removed" for the Discovery stage — both literally true for this run (12 discovered, dedup functioning per the prior audit's §9 footnote). No criterion states or implies a category-match requirement. On the literal text, this finding does not fail any of the 19 criteria.

**Also supported: "C — the issue exposes an ambiguity that requires Product Owner clarification before the live validation can be interpreted."**
`MVP_SCOPE_BOUNDARY.md` §2's core promise ("find approximately 20 businesses that appear to have a genuine need for that service") and §9 Criterion 9 ("the system does not fabricate business needs") are worded at a level that a 0-of-12 category-plausibility outcome sits in tension with, even though no single §10 checklist line is violated. **This ambiguity is the one this document's §13 decision now resolves at the ownership level** (Research/Qualification, not Discovery) — though the resolution is a scope assignment, not yet an implementation that would change what the next validation actually observes.

**Not supported: "A — the issue is already covered by an existing criterion."** No §10 criterion, read literally, addresses category-plausibility (§7, Questions 1-2 both `UNSPECIFIED`).

```text
MVP ENGINEERING EXIT:
SATISFIED

DISCOVERY CATEGORY-PLAUSIBILITY DECISION:
DECIDED — OPTION B
```

The 19-criterion engineering exit is **not** reopened by this product-boundary clarification. This decision does not claim the Research/Qualification category-plausibility behavior is implemented — it is explicitly `NOT STARTED` (§13, §20). If implementation work is later required, it is a separately authorized scope, per §15.

```text
PRD CLARIFICATION MAY BE REQUIRED
```
(No PRD or requirement document has been or will be edited by this task. If pursued, the clarification itself is not drafted here.)

---

## 19. Next Validation Implications

The next live validation should **not** treat the Discovery-stage category mismatch observed in search `b81ab156-edca-42e6-8b05-0c0f05bc0511` alone as a Discovery failure, now that category-plausibility ownership has been assigned to Research/Qualification rather than Discovery. Instead, **if** Research succeeds in a future run, the validation should observe whether Research/Qualification — once separately authorized and implemented — can determine whether discovered businesses are plausible target customers. This is a factual consequence of the decision recorded in §13, not a recommendation about when or how to implement it.

**The separate Anthropic billing blocker from the previous validation is preserved and unresolved by this decision:** the live search that produced the 12-business Discovery result failed at the Research stage with `HTTP 400 "Your credit balance is too low to access the Anthropic API"` (§3). Nothing in this document addresses, resolves, or depends on resolving that blocker. A future live validation still requires a funded Anthropic account regardless of which category-plausibility option was selected.

This document does not start, schedule, or authorize the next validation.

---

## 20. Safety / Scope

```text
Production code changed: 0
Tests changed:            0
PRD changed:               0
Configuration changed:     0
Database changed:          0
Provider changed:          0
Live APIs called:          0
Searches rerun:            0
```
