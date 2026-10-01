# PATH 2 — CATEGORY PLAUSIBILITY PRODUCT DECISION PACKET

## 1. Status

```text
PATH 2:                  SELECTED (requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md §14)
IMPLEMENTATION:          NOT GRANTED
PURPOSE:                 PRODUCT OWNER DECISION PREPARATION
```

This document consolidates 21 previously-identified unresolved decisions (`requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §21) into one decision-ready packet: evidence, choices, consequences, and dependency order — for the Product Owner to resolve. It answers none of them. It reads the repository; it changes nothing in it.

Source documents consumed (read in full for this packet, not reproduced verbatim):
`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md`, `OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md`, `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md`, `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md`, `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md`, `MVP_SCOPE_BOUNDARY.md`, PRD V2.2, `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, `PHASE_24_R70_R71_DECISION.md`.

---

## 2. Existing Decisions (Not Reopened)

| Decision | Recorded in | Note |
|---|---|---|
| Option B — category plausibility owned by Research/Qualification, not Discovery | `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §13 | Decided 2026-09-25 |
| Path 2 — Research-level plausibility determination, consumed by Qualification (not a Qualification-only comparison, Path 1) | `OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §14 | Path 1 not reconsidered |
| R-71 (topic-vs-problem relevance in need detection) unchanged | Confirmed in every Path 2 document; re-verified against `packages/core-qualification/src/adapters.ts:136-152` in this task | `TOPICAL_FIELDS` untouched, `suggestOffers()`/`toOfferSignals()` untouched |
| Scoring unchanged | `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`; `packages/core-opportunity/src/service.ts:264-401` traced as an independently-gated worker step with no data dependency on Research/Qualification fields | `FACTOR_WEIGHTS`, `OpportunityScore` untouched |
| Ranking unchanged | Same trace as above | `rankOpportunities` untouched |
| Discovery unchanged | `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §14; `buildQuery()` continues receiving `targetCustomer` as today, with no filtering added | Discovery remains intentionally broad |
| No implementation authorized to date | Every prior Path 2 document, §-numbered "Implementation Authorization" sections, all read `NOT AUTHORIZED` / `NOT GRANTED` | This packet does not change that |

---

## 3. Decision Dependency Map

```text
D0  MVP status (is this in-scope for the current MVP effort at all?)
     ↓
D1  Research output contract location & shape  ⇄  D2 Multi-segment semantics
     (mutually coupled: a per-segment result needs a richer shape than one Observation;
      see PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md §6, §7)
     ↓
D3  Evidence sufficiency (MATCH/MISMATCH evidentiary bar, minimum tier)
     ↓
D4  Qualification integration mode (Q1 new criterion vs. Q2 evidence-only)
     ↓
D5  State behavior (MATCH / MISMATCH / UNKNOWN → Qualification/Opportunity effect)
     ↓
D6  Persistence key & freshness scoping (per-Prospect vs. per-Search)
     ↓
D7  FIELD_KIND / scoring-adjacent exposure
     ↓
D8  Research input contract (raw string vs. structured targetCustomer)
     ↓
D9  UI visibility
     ↓
D10 Validation acceptance criteria
```

This ordering is supported by evidence, not assumed:

- **D0 first**: no document establishes this is required to close the existing 19-criterion MVP exit (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18 — "MVP ENGINEERING EXIT: SATISFIED"), so whether to invest in any decision below is itself gated on whether the Product Owner wants this built now, later, or not at all (§8.A below).
- **D1 ⇄ D2 before D3**: `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §6 states the output-contract shape and multi-segment semantics are "additionally coupled" — a single `Observation`-shaped value cannot cleanly carry a per-segment breakdown, so choosing OR/AND/segment-level semantics constrains which output shape is viable.
- **D3 before D4**: Qualification cannot decide how to consume a result (Q1/Q2) until the evidentiary bar producing that result (MATCH/MISMATCH/UNKNOWN thresholds) is fixed — otherwise Qualification's rule would be evaluating an undefined signal.
- **D4 before D5**: whether MISMATCH/UNKNOWN can affect an Opportunity's outcome is meaningless until it is decided whether Qualification gates on the result at all (Q1) or only displays it (Q2).
- **D5 before D6**: persistence depth (e.g., whether a matched-segment sub-field is needed) and freshness scoping only matter once it's known whether the result is load-bearing (gates Qualification) or advisory.
- **D6 before D7**: `FIELD_KIND` inclusion is a persistence-adjacent decision (`PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §12) that only makes sense once the field's persistence path (D6) is settled.
- **D8 (input contract) is not on the critical path for D1–D7** — it can be decided independently and in parallel, since it governs how `targetCustomer` reaches Research, not what Research produces — but it is listed before D9/D10 because UI and validation both depend on knowing what evidence reached the model.
- **D9/D10 last**: UI display candidates and validation acceptance criteria both consume the shape/semantics fixed by D1–D8; deciding them earlier would require guessing at an undecided contract.

---

## 4. Decision Register

| ID | Decision | Current Evidence | Choices | Implementation Impact | Dependency | Status |
|---|---|---|---|---|---|---|
| D0 | Is Path 2 category plausibility part of the current MVP, a post-MVP enhancement, or unscheduled? | `MVP_SCOPE_BOUNDARY.md`'s exit criteria list "Businesses are discovered" / "Duplicates are removed" for Discovery with no category-correctness criterion; no document states category plausibility is required to close the existing, already-satisfied 19-criterion exit (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18: "MVP ENGINEERING EXIT: SATISFIED"). | (a) In current MVP scope now; (b) post-MVP enhancement; (c) unscheduled/parked | Gates whether any decision below is acted on now | None (root decision) | **PRODUCT DECISION REQUIRED** |
| D1 | Where does the plausibility result live, and in what shape? | `LeadResearch.targetCustomers` already exists but means "who the business serves," not a comparison to participant intent (`adapters.ts:136-152`) — must not be repurposed. `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §7 lists 4 candidate locations (new `LeadResearch` field; new `ResearchSignal` kind; run-level metadata; separate result object) — no existing precedent for the latter two. | (a) New `Observation`-shaped `LeadResearch` field (smallest change, reuses `value`/`classification`/`confidence`/`evidence[]`/`basis`); (b) new `ResearchSignal` kind; (c) run-level metadata (no precedent); (d) separate result object (no precedent) | Determines edits to `schema.ts`, `allObservations()` (hardcoded list, `schema.ts:229-244`), `mapping.ts`, `FIELD_KIND` (`persist.ts:38-48`) | Coupled to D2 | **PRODUCT DECISION REQUIRED** |
| D2 | Multi-segment `targetCustomer` semantics | `ServiceProfile.targetCustomer` is one unparsed string, e.g. `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"` (`packages/core-service-profile/src/types.ts:10-14`; example per `DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:22`). No parsing exists anywhere in the codebase today. | (a) OR — match any one segment; (b) AND — match every segment (docs note this would likely reject nearly all real MATCHes given the segments read as alternatives, but this is not a decision made here); (c) segment-level result with an aggregation rule (undefined); (d) leave the whole string as one composite target, evaluated holistically (no parsing) | Determines whether segments are pre-parsed (new logic, no existing precedent) or left to the model as free text; determines whether D1's output shape needs a per-segment sub-field | Coupled to D1; also coupled to D8 (raw vs. structured input) | **PRODUCT DECISION REQUIRED** |
| D3a | MATCH evidentiary bar | No document defines this. Closest precedent, `isEvidentiary()` (`packages/core-qualification/src/rules.ts:26-28`), defines sufficiency for a *different* claim (OBSERVED-only, for `EVIDENCE_PRESENT`) — not established as transferable to a category/audience claim. | (a) Any `OBSERVED` evidence of fit; (b) `OBSERVED` evidence plus absence of contradicting evidence; (c) other | Determines prompt/schema wording and what `classification` value triggers MATCH | Independent of D1/D2, precedes D4 | **PRODUCT DECISION REQUIRED** |
| D3b | MISMATCH evidentiary bar | Same gap as D3a. Task instruction explicitly warns absence of evidence must not default to MISMATCH. | (a) Requires explicit contradicting evidence (e.g., self-described as "Software Development Company" against a "Restaurants" target); (b) inferable from strong category-signal absence (not authorized by any document) | Same as D3a | Independent of D1/D2, precedes D4 | **PRODUCT DECISION REQUIRED** |
| D3c | UNKNOWN default | Not sourced from any governance document — first introduced as the requested three-state model. Consistent with, but not derived from, the existing `OBSERVED`/`INFERRED`/`UNKNOWN` classification enum (a claim-quality classification, not a plausibility-result classification). | Working assumption per task instruction: absence/ambiguity of evidence → UNKNOWN, never MISMATCH by default | Determines default behavior when a business's website carries no category-identifying content | — | **Working assumption only — not formally authorized by repository governance; still requires Product Owner ratification** |
| D3d | Minimum evidence tier (Tier 1 only / Tier 1+2 / Tier 1+2+3) | Tier 1 (direct self-identification) maps to `OBSERVED`+`verifyProvenance()` (`researcher.ts:253`) — already gated with no new machinery. Tier 3 (name-only inference) maps to `INFERRED`, capped at confidence ≤80, and directly conflicts with the `isEvidentiary()` precedent that excludes `INFERRED` from `EVIDENCE_PRESENT`. | (a) Tier 1 only (strictest, consistent with existing `isEvidentiary()` precedent); (b) Tier 1+2 (moderate, requires clarifying contextual evidence still counts as OBSERVED when directly quoted); (c) Tier 1+2+3 (max recall, inconsistent with existing precedent) | Determines prompt instructions and whether a new criterion holds itself to a lower evidentiary bar than the existing `EVIDENCE_PRESENT` criterion | Precedes D4 | **PRODUCT DECISION REQUIRED** |
| D4 | Qualification integration mode | `QUALIFICATION_CRITERIA` is exactly `['NEED_DETECTED', 'EVIDENCE_PRESENT']` (`packages/core-qualification/src/types.ts:12`). Path 2's design means Qualification would read an already-computed Research field via the existing `signals.listByProspect` path — no new `QualificationDeps` dependency required either way. | (a) Q1 — new Qualification criterion (load-bearing, can affect `QUALIFIED`/`NOT_QUALIFIED`); (b) Q2 — evidence-only, no criteria change, value is readable/displayable only | Q1 touches `types.ts`, `rules.ts`, `evaluator.ts`, adds tests; Q2 touches nothing in `core-qualification` | Depends on D3a–D3d | **PRODUCT DECISION REQUIRED** |
| D5a | MATCH → effect | No existing state models this. | {No effect (Q2); supports `EVIDENCE_PRESENT`; required for `NEED_DETECTED`(unlikely, since `evaluateNeedDetected()` explicitly declines to reinterpret research evidence, `rules.ts:42-51`)} | Determines whether MATCH is load-bearing at all | Depends on D4 | **PRODUCT DECISION REQUIRED** |
| D5b | MISMATCH → effect, incl. whether it blocks Qualification | No `NOT_QUALIFIED`-by-category-mismatch mechanism exists today. | {No effect; produces `NOT_QUALIFIED`; a new "insufficient/flagged" state — none of which exists in `StoredQualification`/`StoredOpportunity` today (`packages/core-qualification/src/types.ts`, `packages/core-opportunity/src/types.ts:40-59`)} | A new state, if selected, is new code, not a reuse of an existing one | Depends on D4 | **PRODUCT DECISION REQUIRED** |
| D5c | UNKNOWN → effect, incl. whether it blocks Qualification | Same gap as D5b. | {No effect ("no opinion, proceed"); hold pending more evidence; human review required} | Same as D5b | Depends on D4 | **PRODUCT DECISION REQUIRED** |
| D5d | Can MISMATCH ever prevent Opportunity creation (rather than only affect Qualification, after the Opportunity exists)? | `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) and `evaluateQualificationForOwner` are independent, separately-invoked steps today; no traced code path gates Opportunity creation on any Research result. | (a) No — Opportunity creation stays unconditional (the only placement with existing architectural support); (b) Yes — requires new gating logic that does not exist in any form today | (b) is a strictly larger, currently-unsupported change | Depends on D4/D5b | **PRODUCT DECISION REQUIRED** (architecture supports (a) only, without new mechanism) |
| D6a | Persistence location/depth | Live path confirmed: `mapping.ts`'s `toNewResearchSignals()` → `ResearchSignalRepository`, concrete Postgres impl at `pgRepository.ts:50`. The parallel `persist.ts`/`acq_lead_research` path has **no concrete implementation anywhere in the codebase** and is not called by `service.ts`/`worker.ts` — confirmed inactive. `field` is typed as a plain `string` (not a literal union) on `NewResearchSignalInput`/`StoredResearchSignal` (`types.ts:26-27,47`), suggesting no migration is needed — **inferred from the type signature, not confirmed against the actual Postgres column/migration**. | (a) Persist via the live `ResearchSignalRepository` path (only path with evidence support); (b) richer/separate persistence (no precedent, larger change) | (a) requires no new table/repository interface, if D1 selects the "new `LeadResearch` field" option | Depends on D1, D4/D5 (whether persistence must be query-optimized for gating) | **PRODUCT/TECHNICAL DECISION REQUIRED** (also requires confirming the schema-migration inference against the actual Postgres definition before implementation) |
| D6b | Freshness/persistence scoping: per-Prospect vs. per-Search vs. per-ServiceProfile | `supersedePrevious(prospectId, at)` (`repository.ts:13-18`) operates **per Prospect only** — not per Search, not per `targetCustomer` value. Documented architectural tension (`PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §14–§15): if the same Prospect is discovered under two Searches with different `targetCustomer` values (e.g., Search A = "Restaurants", Search B = "Hotels"), the existing mechanism would silently let the second Search's Research run supersede — and discard — the first Search's still-valid plausibility result, because plausibility is participant-intent-specific by construction but the persistence key is not. | (a) Accept current per-Prospect behavior (only the most recent Search's plausibility result survives per prospect); (b) introduce a new persistence key scoped per-(Prospect, Search) or per-(Prospect, targetCustomer) — a structural change beyond anything any prior Path 2 document has scoped | (b) requires new persistence-key design, not currently modeled by `ResearchSignal` for any existing field | Depends on D1, D6a | **PRODUCT DECISION REQUIRED** — flagged as the single largest architectural risk of Path 2 (see §7) |
| D6c | Does a `ServiceProfile.targetCustomer` edit, or a new Search against an updated profile, force a Research rerun for a previously-researched prospect? | `StoredSearch.parameters` is an immutable snapshot at Search-creation time (`PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §5) — an existing Search's plausibility observation does not become stale merely because the profile changed after that Search was created. Whether a *new* Search against the updated profile should force a fresh Research run (rather than reuse a stale observation) is untraced by any freshness mechanism. | (a) No forced rerun — new Search simply produces its own Research run as normal, no special-casing; (b) explicit forced-rerun policy — new logic | No existing mechanism implements (b) | Depends on D6b | **PRODUCT DECISION REQUIRED** |
| D7 | `FIELD_KIND` inclusion/exclusion for the new field | `FIELD_KIND` (`persist.ts:38-48`) is consulted by the **live** `mapping.ts`'s `toNewResearchSignals()` (imports it, `mapping.ts:1,19`) for the persisted `kind` field — a correction from an earlier assumption that this lookup was confined to the inactive `persist.ts` scorer path. A missing entry silently defaults to `'WEBSITE'` (`persist.ts:81`). | (a) Add an explicit `FIELD_KIND` entry (accurate `kind` classification now; pre-commits a position if the currently-inactive `acq_lead_research`/`core-acquisition` scorer is ever reactivated); (b) omit it (accepts the silent `'WEBSITE'` default) | Neither choice changes live scoring today (the `acq_lead_research` scorer path is confirmed inactive) | Depends on D1, D6a | **PRODUCT DECISION REQUIRED** |
| D8 | Research input contract: raw string vs. structured/segmented `targetCustomer` | `ResearchProviderInput` (`provider.ts:11-16`) carries no participant context today; the worker's Research call (`worker.ts:358-368`) passes only `{ prospectId }` despite `search.parameters.targetCustomer` being in scope. `ResearchInput`'s existing but unused `industry`/`location` fields (`schema.ts:207-224`) are wired into the prompt (`prompt.ts:36,55-56`) with an "unverified, operator-supplied" framing directly reusable in spirit. | (a) Option I-A — raw string passthrough, smallest change, model interprets the compound string unaided; (b) Option I-B — pre-parsed/structured segments, new logic with an undefined splitting rule (the example string uses `,` within a segment and `;` between segments — no document defines precedence) | Whichever is chosen must live in the shared `schema.ts`/`provider.ts` layer, not inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` individually, per the confirmed provider-neutral architecture (`researchModelFactory.ts` — "the ONE place... allowed to branch on provider identity") | Coupled to D2 | **PRODUCT DECISION REQUIRED** |
| D9 | UI visibility | No UI files were inspected by any prior Path 2 document (explicitly out of scope). No document establishes whether the result should be shown to the participant. If shown, the `Observation` shape (`value`/`classification`/`confidence`/`evidence[]`) maps directly onto whatever pattern already renders other Research signals — a technical observation, not a decision that visibility should happen. | (a) Not exposed in UI (backend-only, informs Qualification); (b) exposed via the existing Research-signal display pattern; (c) exposed with new UI (matched segment, human-readable reason) | (c) requires new frontend work not scoped by any document | Depends on D1, D4/D5 | **UNRESOLVED** |
| D10 | Validation acceptance criteria | No document defines what a future live validation must observe to consider this capability working, beyond the generic chain `discovered candidate → research evidence → category determination → Qualification outcome → participant review`. Separately, the Anthropic credit-balance blocker (`HTTP 400`, `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §3) remains unresolved and is explicitly unrelated to this product decision. | Technical criteria and product/participant-facing criteria are two distinct lists (see `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §18) — neither is adopted here | Determines what a future test/validation task must check | Depends on D1–D9 | **PRODUCT DECISION REQUIRED** (candidate list exists; not adopted) |

---

## 5. Recommended Decision Order

This is the logical order in which the Product Owner should answer the dependent questions above — **not** a recommendation of which option to select within any decision.

1. **D0** — Confirm whether this is being built now, later, or not at all. If "not now," stop here; nothing below needs answering yet.
2. **D1 + D2 together** — Output contract shape and multi-segment semantics, because the shape decision cannot be finalized independently of whether a per-segment result is required.
3. **D8** — Input contract (raw vs. structured), because it is coupled to D2 and determines what Research actually receives.
4. **D3a–D3d** — Evidence sufficiency (MATCH bar, MISMATCH bar, UNKNOWN default, minimum tier), because Qualification's consumption mode cannot be meaningfully decided against an undefined signal.
5. **D4** — Qualification integration mode (Q1 vs. Q2).
6. **D5a–D5d** — State behavior (MATCH/MISMATCH/UNKNOWN effects; whether MISMATCH can block Opportunity creation), which only has meaning once D4 is settled.
7. **D6a–D6c** — Persistence location, per-Search/per-Prospect scoping, and rerun policy. Flagged as high-priority within this step because D6b identifies an existing architectural gap (single-active-result-per-Prospect) that Path 2 does not currently handle correctly for a genuinely Search-specific value.
8. **D7** — `FIELD_KIND` inclusion, once persistence (D6a) is fixed.
9. **D9** — UI visibility, once the contract and consumption mode are known.
10. **D10** — Validation acceptance criteria, last, since it depends on everything above.

---

## 6. Hard Constraints Already Established

Verified against current repository state in this task:

- **R-71 unchanged**: `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` (`packages/core-qualification/src/adapters.ts:136-152`) governs exclusion from `suggestOffers()`/`toOfferSignals()` for the topic-vs-problem axis specifically. No Path 2 document adds the new field to this set or routes it through need detection.
- **Scoring unchanged**: `scoreOpportunity`/`scoreOpportunityForOwner` (`packages/core-opportunity/src/service.ts:264-401`) is an independently authorized, separately-gated worker step (`worker.ts:385-395`) with no data dependency on Research's field set or Qualification's criteria in either direction.
- **Ranking unchanged**: `rankOpportunities` — same trace as scoring.
- **Discovery unchanged**: `buildQuery()` (`packages/core-discovery/src/googlePlacesProvider.ts:11-15`) continues receiving `targetCustomer` exactly as today; Discovery is not required to filter by category before persisting a candidate or before Research runs.
- **Provider neutrality**: Research is confirmed multi-provider — `researchModelFactory.ts` is "the ONE place in the codebase allowed to branch on provider identity," selecting among Anthropic/OpenAI/Gemini adapters behind a single `ResearchModel` interface. Any new input/output field must be added at the shared `schema.ts`/`provider.ts` layer; adding it only to `anthropicModel.ts` would silently break the OpenAI/Gemini configurations.
- **No fabricated evidence**: `verifyProvenance()` (`researcher.ts:253`) already requires `OBSERVED` claims to cite real quotes/URLs drawn from `input.sourceDocuments`; this machinery is field-agnostic and would apply automatically to a new plausibility field with no new code.
- **Existing provenance/repair machinery is field-agnostic**: `researchLead()`'s retry-on-failure and repair-on-validation/provenance-failure loop (`researcher.ts:151-293`) operates generically over whatever `leadResearchSchema` defines — a new field participates automatically once added to the schema and to `allObservations()`.
- **Existing freshness mechanism is generic but per-Prospect only**: `supersedePrevious(prospectId, at)` (`repository.ts:13-18`) marks all prior active signals for a Prospect superseded before inserting new ones — confirmed **not** scoped per-Search or per-`targetCustomer` (see D6b).
- **Two persistence paths exist; only one is live**: `mapping.ts` → `ResearchSignalRepository` (concrete Postgres implementation, `pgRepository.ts:50`) is the live MVP path. `persist.ts` → `acq_lead_research`/`ResearchRepository` has no concrete implementation anywhere in the codebase and is not called by `service.ts`, `worker.ts`, or anything outside `persist.ts`/`index.ts`'s re-export — confirmed inactive.
- **`allObservations()` and `FIELD_KIND` are hardcoded literal lists, not reflective** (`schema.ts:229-244`, `persist.ts:38-48`) — a new field is invisible to downstream consumers, or silently misclassified, unless both are explicitly edited.

---

## 7. Explicit Non-Goals

Confirmed as out of scope by every governing Path 2 document, and not reopened by this packet:

- Discovery query redesign or category filtering; Google Places provider changes.
- R-70 modification.
- R-71 modification; `TOPICAL_FIELDS`, `suggestOffers()`, `toOfferSignals()` modification.
- Scoring algorithm changes; `FACTOR_WEIGHTS` changes; `OpportunityScore` changes; ranking changes.
- Opportunity state-machine changes (beyond what D5d's "no" default already supports without change).
- Schema/migration changes (pending D6a's confirmation step).
- UI implementation.
- Outreach, CRM, follow-up.
- Provider replacement or per-provider (Anthropic/OpenAI/Gemini-specific) implementation work beyond the shared-contract layer.
- Live validation / live API calls of any kind.
- Selecting any option within any decision listed in §4 — this packet enumerates choices, it does not choose among them.

---

## 8. Open Questions That Cannot Be Answered From the Repository

These require Product Owner input, not further code inspection — no amount of additional repository reading resolves them:

- **A. MVP status (D0)** — whether this capability is required for the current MVP effort, a scheduled post-MVP enhancement, or unscheduled. No document states this; it is a scope/roadmap call, not a technical fact.
- **C/D. Classification model and evidence bar (D3a–D3d)** — what a human reviewer would accept as sufficient proof of category fit or mismatch. This is a business-judgment threshold, not derivable from code.
- **E. Multi-segment semantics (D2)** — how a participant intends a compound target-customer string to be read (as alternatives, as a conjunctive list, or as something else) is a question about user intent, not implementation.
- **F. Qualification behavior (D4, D5a–D5d)** — whether a category mismatch should cost a business owner a potential lead (by blocking Qualification/Opportunity) is a product-risk tradeoff between false rejections and reviewer noise — not a technical determination.
- **G. Freshness scoping (D6b, D6c)** — whether it is acceptable for a prospect's plausibility result to reflect only the most recently completed Search is a product-acceptability judgment about a known architectural gap, not something the repository "decides" on its own.
- **I. FIELD_KIND exposure (D7)** — a forward-looking policy choice about whether to keep a currently-inactive scoring path pre-wired for the new field, versus deferring that question entirely.
- **L. UI visibility (D9)** — whether and how end users should see this evidence has no existing precedent in the inspected code paths to extrapolate from.
- **M. Validation acceptance (D10)** — what a human participant would need to confirm ("would you consider this business a legitimate target?") is inherently a product/user-research question, not a code trace.

---

## 9. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This holds independent of how many decisions in §4 might appear self-evident to a reader. A separate, explicit authorization step — naming which decisions were resolved and how — is required before any code, schema, test, or configuration change begins. This document does not perform that step.

---

## 10. Safety / Audit Record

```text
Starting HEAD:              5992b82b9adff492c480442d68a954f2a03bfb28
Ending HEAD:                5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Branch:                     phase-17-r34-worker-orchestration

Files created:              requirement/PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md (this file)
Production files changed:   0
Tests changed:               0
PRD changed:                 0
Configuration changed:       0
Database changed:            0
Live API calls:              0
Staged files:                none
Commit:                       none
Push:                         none

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, all prior requirement/*.md
documents and .claude/, CLAUDE.md included):
  .claude/, CLAUDE.md, and the full pre-existing requirement/*.md set,
  including every governing Path 2 document consumed by this packet.
```
