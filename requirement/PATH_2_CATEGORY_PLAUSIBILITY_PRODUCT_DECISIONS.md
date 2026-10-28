# PATH 2 — CATEGORY PLAUSIBILITY
# PRODUCT DECISIONS

## 1. Status

```text
PRODUCT DECISION:
OPTION B — RESEARCH / QUALIFICATION-OWNED
PATH 2 — RESEARCH-LEVEL PLAUSIBILITY

DOCUMENT PURPOSE:
DECISION RECORD PREPARATION ONLY

IMPLEMENTATION AUTHORIZATION:
NOT GRANTED
```

## 2. Governing Decisions

This document does not reopen, and is downstream of:
- `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` — Option B selected.
- `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` — Path 2 selected over Path 1.
- `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` — Path 2 conceptual scope lock.
- `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md` — Path 2 implementation-ready boundary map, whose 17 open product decisions this document works through individually.
- `requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`, `requirement/PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`, `requirement/PHASE_24_R70_R71_DECISION.md` — R-70/R-71.
- `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` — scoring/ranking decoupling.
- `requirement/MVP_SCOPE_BOUNDARY.md` and the PRD V2.2 — no existing category-match criterion at any stage.

Terminology (`MATCH`/`MISMATCH`/`UNKNOWN`, `targetCustomer` vs. `targetCustomers`, Tier 1/2/3 evidence, Q1/Q2, I-A/I-B) is preserved from these documents.

## 3. Current Architecture Facts

Verified in this task, extending the prior implementation-scope document's findings:

- **Participant context stops at Discovery.** `ServiceProfile.targetCustomer` (`packages/core-service-profile/src/types.ts:10-14`) is copied verbatim into `StoredSearch.parameters` (`packages/core-search/src/service.ts:82-90`), read by Discovery's `buildQuery()` (`packages/core-discovery/src/googlePlacesProvider.ts:11-15`), and never forwarded past Discovery. The worker's Research call (`apps/worker/src/searchWorker/worker.ts:358-368`) passes only `{ prospectId }` despite holding `search.parameters.targetCustomer` in scope.
- **`ResearchProviderInput`** (`packages/core-research/src/provider.ts:11-16`) carries no participant context; `ResearchInput`'s unused `industry`/`location` fields (`schema.ts:207-224`) are wired into the prompt but populated by no caller.
- **`LeadResearch.targetCustomers`** (`schema.ts:176-201`) means "who the discovered business serves" (`adapters.ts:136-152`) — not a comparison to the participant's intent. No code computes such a comparison today.
- **`allObservations()`** (`schema.ts:229-244`) and **`FIELD_KIND`** (`persist.ts:38-48`) are hardcoded literal field lists, not reflective — a new field is invisible/silently misclassified unless both are explicitly edited.
- **Two persistence paths exist, only one is live.** `mapping.ts`'s `toNewResearchSignals()` → `ResearchSignalRepository` is imported and used by `service.ts` (`runResearchForOwner`) and has a concrete Postgres implementation, `createPgResearchSignalRepository()` (`pgRepository.ts:50`), implementing `ResearchSignalRepository`. By contrast, `persist.ts`'s `storeResearch()`/`ResearchRepository` (the `acq_lead_research` path) is **not imported by `service.ts`, `worker.ts`, or any file outside `persist.ts` itself and `index.ts`'s re-export** (confirmed by repository-wide grep in this task), and **no Postgres (or other) implementation of its `ResearchRepository` interface exists anywhere in the codebase** — only the interface definition. This is a stronger, corrected finding than the prior implementation-scope document's "not re-verified" note: **the `persist.ts`/`acq_lead_research` path is confirmed inactive in the current runtime.**
- **`isEvidentiary()`** (`packages/core-qualification/src/rules.ts:26-28`): `signal.supersededAt === null && signal.classification === 'OBSERVED'` — the existing precedent for what counts as usable evidence for `EVIDENCE_PRESENT` (`evaluateEvidencePresent()`, `rules.ts:67-79`). `evaluateNeedDetected()` (`rules.ts:42-51`) passes through `Opportunity.needDetected` unchanged, explicitly declining to "reinterpret research evidence to create a need Need Detection did not detect" (its own doc comment).
- **`QUALIFICATION_CRITERIA`** (`packages/core-qualification/src/types.ts:12`) = exactly `['NEED_DETECTED', 'EVIDENCE_PRESENT']`.
- **`supersedePrevious(prospectId, at)`** (`repository.ts:13-18`) marks all prior active signals for a Prospect superseded before new ones are inserted — a generic, per-Prospect (not per-Search, not per-`targetCustomer`) freshness mechanism.

## 4. Decision 1 — MATCH / MISMATCH / UNKNOWN

**MATCH**

```text
Decision: PRODUCT DECISION REQUIRED
```
Rationale: no existing document defines the exact evidentiary bar for "plausibly relevant." The closest precedent, `isEvidentiary()`, defines sufficiency for a *different* claim (need/problem evidence, OBSERVED-only) — it is not established anywhere that the same bar transfers to a category/audience claim.
Evidence requirement: undetermined — candidates range from "any OBSERVED evidence of category fit" to "OBSERVED evidence plus absence of contradicting evidence," neither authorized by existing governance.
Examples: a business whose website explicitly states "we are a family-owned restaurant" against a participant `targetCustomer` of "Restaurants, Cafes" — this would satisfy MATCH under any plausible reading of Tier 1 evidence, but no document formally certifies this as the accepted example/threshold.

**MISMATCH**

```text
Decision: PRODUCT DECISION REQUIRED
```
Rationale: same gap as MATCH. Additionally, the instruction explicitly warns against equating absence of evidence with MISMATCH — no existing source authorizes that equivalence, so a business with no category-identifying content must not default to MISMATCH.
Evidence requirement: undetermined — whether MISMATCH requires explicit contradicting evidence (e.g., "Software Development Company" self-description against a "Restaurants, Cafes" target) or can be inferred from strong category-signal absence is not decided.
Examples: `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:66` records 8 of 12 discovered businesses in the audited run with explicit self-description as web-development/software/digital-marketing businesses against a target of "Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators" — this is the kind of case a MISMATCH determination is meant to catch, but the document does not itself define the rule, only the motivating observation.

**UNKNOWN**

```text
Decision: PRODUCT DECISION REQUIRED
```
Rationale: the three-state model (MATCH/MISMATCH/UNKNOWN) itself is not sourced from any governance document — it was first introduced in the prior scope-lock document as the requested model, not discovered in the repository. It is consistent with, but not derived from, the existing `classification: OBSERVED/INFERRED/UNKNOWN` enum (a claim-quality classification, not a plausibility-result classification).
Evidence requirement: per the instruction's own caution, absence of evidence must produce UNKNOWN, not MISMATCH, unless a future decision explicitly authorizes otherwise. This is the one sub-point closest to a default the instructions establish directly — but it is an instruction to this task, not a discovery from existing repository governance, so it is recorded here as the working assumption rather than a settled product decision.
Examples: a business with a generic, contentless website (no menu, no service pages, no self-description) against any target segment — the audit's own language, "0 contain any indication of being a restaurant, cafe, boutique retailer..." (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:66`), for the 4 "generic names with no sector language" businesses, is closer to UNKNOWN than MISMATCH under this document's working assumption, though this too is not formally decided.

## 5. Decision 2 — Minimum Evidence

```text
MINIMUM EVIDENCE TIER: PRODUCT DECISION REQUIRED
```

| Candidate policy | Protects against | May miss | Current evidence model support |
|---|---|---|---|
| Tier 1 only | Fabricated/weak inferences producing false MATCH/MISMATCH; keeps the bar at the same level `isEvidentiary()` already uses for `EVIDENCE_PRESENT` (OBSERVED-only) | Businesses with strong contextual (Tier 2) signals but no explicit self-identification — would fall to UNKNOWN even when a human reviewer would confidently call it | Fully supported — `classification: OBSERVED` plus `verifyProvenance()` (`researcher.ts:253`) already gate exactly this tier with no new machinery |
| Tier 1 + Tier 2 | Same fabrication risk as above, while capturing businesses identifiable from strong contextual content (menus, booking flows, catalogues) without an explicit self-description sentence | Loosens the bar relative to the `EVIDENCE_PRESENT` precedent — a business could be judged MATCH/MISMATCH on OBSERVED evidence that is contextual rather than a direct claim; whether that is an acceptable relaxation is undecided | Supported by the existing `evidence[]`/`classification: OBSERVED` model as long as Tier 2 content is itself scored OBSERVED (a genuine quote from the site, not the model's own inference) — no new machinery needed, but requires clarifying in the prompt that contextual evidence still counts as OBSERVED when directly quoted |
| Tier 1 + Tier 2 + Tier 3 | Maximizes recall — fewest businesses fall to UNKNOWN | Directly conflicts with the `isEvidentiary()` precedent (INFERRED explicitly excluded from `EVIDENCE_PRESENT`); Tier 3 (name-only inference) is capped at INFERRED confidence ≤80 by schema and halved again by `effectiveConfidence()` (`persist.ts:58-62`) if the (currently inactive, §3) scored path were ever reactivated — using it for MATCH/MISMATCH would mean this new criterion holds itself to a *lower* evidentiary bar than the existing `EVIDENCE_PRESENT` criterion, an inconsistency no document authorizes | Technically representable (the `classification: INFERRED` state already exists), but adopting it as sufficient is a policy choice unsupported by existing precedent |
| Other explicitly defined combination | N/A | N/A | Not evaluated — no other combination is named in governing documents |

No tier is selected. The `isEvidentiary()` precedent (OBSERVED-only) is the strongest available anchor but is not itself an authorization to reuse the same bar for a different criterion.

## 6. Decision 3 — Multi-Segment Semantics

```text
MULTI-SEGMENT SEMANTICS: PRODUCT DECISION REQUIRED
```

Confirmed fact (§3, and `requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:22,54,116`): `ServiceProfile.targetCustomer` is a single, unparsed compound string (e.g., `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"`), inserted verbatim into Discovery's query today with no segment structure recognized anywhere in the codebase.

- **OR** — MATCH if the business plausibly matches at least one target segment. No document selects this.
- **AND** — MATCH only if the business plausibly matches every target segment. No document selects this; given the segments in the real example read as alternative acceptable customer types rather than a conjunctive requirement, AND semantics would very likely reject every real-world MATCH, but this is an observation about plausibility, not a decision this document is authorized to make.
- **Segment-level result** — evaluate each segment independently, derive an aggregate. No document selects this, nor defines the aggregation rule (majority? any? weighted?) it would require.
- **Other** — no other approach is established by any existing document.

This decision is additionally coupled to §7 (Decision 4)'s output-contract shape (a single `Observation`-style value cannot cleanly carry a per-segment breakdown without a richer shape) and to whether `targetCustomer` is parsed before or at Research time (raised, not resolved, in the prior implementation-scope document §5, Options I-A/I-B).

## 7. Decision 4 — Research Output Contract

**Distinction preserved, not repurposed**: `LeadResearch.targetCustomers` (existing) states who the discovered business serves, as an independent fact; the proposed `participantTargetCustomerPlausibility` (name illustrative, not approved) would state whether that business plausibly falls within *this participant's* stated target — a comparison. These remain two separate fields under every option below; none of them merges the two.

**Schema**: a new field would be added to `leadResearchSchema` (`schema.ts`), most naturally as another `Observation`-shaped entry (reusing `value`/`classification`/`confidence`/`evidence[]`/`basis`) unless Decision 3 requires a richer, multi-segment-aware shape — undecided.

**Provider contract**: per the confirmed multi-provider architecture (`researchModelFactory.ts` — the sole file permitted to branch on provider identity), any new field must be added at the shared `schema.ts`/`provider.ts` layer, not inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` individually, so all three configured providers stay behaviorally consistent.

**Observation enumeration**: `allObservations()` (`schema.ts:229-244`) — a new field must be added to its hardcoded `single`-field array (or, if list-shaped per a segment-level Decision 3 outcome, its `lists` array) or it is invisible to every downstream consumer, including `observedRatio()`.

**Persistence mapping**: `mapping.ts`'s `toNewResearchSignals()` (`mapping.ts:16-30`) iterates `allObservations()` — once the field is added there, it flows automatically into `NewResearchSignalInput`/`ResearchSignalRepository` with no separate mapping-file edit required (confirmed: `toNewResearchSignals()` itself has no per-field special-casing beyond `FIELD_KIND` lookup).

**Provenance verification**: `verifyProvenance()` (`researcher.ts:253`) operates generically over whatever `leadResearchSchema` defines — a new OBSERVED claim on the new field is automatically checked against `input.sourceDocuments` with no new code.

**Repair/retry behavior**: `researchLead()`'s retry-on-provider-failure and repair-on-validation/provenance-failure loop (`researcher.ts:151-293`) is likewise generic — a new field's validation or provenance failure triggers the same targeted-repair mechanism as any existing field, with no new code required.

**Every location that would need updating**, if a new field is authorized (enumerated, not changed, per instruction):
1. `packages/core-research/src/schema.ts` — add the field to `leadResearchSchema`.
2. `packages/core-research/src/schema.ts` — add an entry to `allObservations()` (line ~232-244).
3. `packages/core-research/src/persist.ts` — add an entry to `FIELD_KIND` (line ~38-48), or deliberately omit it (see Decision 9); note this file is confirmed inactive in the live runtime (§3), so this edit only matters if that path is ever reactivated, or if `FIELD_KIND`'s lookup is reused elsewhere — reuse elsewhere was not found in this task.
4. `packages/core-research/src/provider.ts` — extend `ResearchProviderInput` for the participant-context *input* side (a separate contract from the output side this decision covers).
5. `packages/core-research/src/schema.ts` (`ResearchInput`) and `packages/core-research/src/prompt.ts` — extend the input schema and prompt rendering for the participant-context input.
6. `apps/worker/src/searchWorker/worker.ts` — the Research call site, to source and pass the new input field.
7. `packages/core-research/src/service.ts` (`runResearchForOwner`) — construct the extended `ResearchProviderInput`.

No edit to any of the above is made by this document.

## 8. Decision 5 — Qualification Integration

**Q1 — new Qualification criterion**
- Code surface: `packages/core-qualification/src/types.ts` (extend `QUALIFICATION_CRITERIA`), `rules.ts` (new rule function, pattern-matching `evaluateNeedDetected()`/`evaluateEvidencePresent()`), `evaluator.ts` (invoke and fold into result).
- Behavioral effect: the new criterion becomes load-bearing — its pass/fail state can affect whether an Opportunity reaches `QUALIFIED` (subject to Decision 6's gating question, itself unresolved).
- Test surface: new rule unit tests, evaluator integration tests covering the new criterion alongside the existing short-circuit between `NEED_DETECTED` and `EVIDENCE_PRESENT`.
- MVP implications: expands the qualification-v1 rule set beyond its current two criteria — `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md:333` documents this extension pattern as already supported by "qualification-v1 evaluator versioning."

**Q2 — evidence-only, no Qualification gating**
- Code surface: none in `core-qualification` — the new field is simply readable via the existing `signals.listByProspect` path, already used for `EVIDENCE_PRESENT`.
- Behavioral effect: no change to `QUALIFICATION_CRITERIA`, `evaluator.ts`, or Qualification outcomes; the value exists for review/display purposes only.
- Test surface: none required in `core-qualification`; only Research-side tests (Decision 4/§7) apply.
- MVP implications: smaller, reversible, defers the gating question entirely — can be adopted first with Q1 layered on later without re-touching Research.

```text
Q1 vs Q2: PRODUCT DECISION REQUIRED — no existing document selects one.
```

## 9. Decision 6 — State Behavior

For each state, the possible behaviors listed by the task are recorded as **options**, not selections:

**MATCH**: {Opportunity continues, Opportunity is QUALIFIED, no distinguishable effect (Q2)} — undecided.

**MISMATCH**: {Opportunity continues unaffected, Opportunity is rejected at Qualification (`NOT_QUALIFIED`), Opportunity is flagged `INSUFFICIENT_EVIDENCE`-equivalent, human review required} — undecided. Note: no `INSUFFICIENT_EVIDENCE` or "human review required" state exists in the current `StoredQualification`/Opportunity model (`packages/core-qualification/src/types.ts`, `packages/core-opportunity/src/types.ts:40-59`) — either would be a new state, not a reuse of an existing one, if selected.

**UNKNOWN**: {Opportunity continues unaffected ("no opinion"), Opportunity held pending more evidence, human review required} — undecided.

```text
Should MISMATCH block Qualification? PRODUCT DECISION REQUIRED
Should UNKNOWN block Qualification? PRODUCT DECISION REQUIRED
Should MISMATCH ever prevent Opportunity creation? PRODUCT DECISION REQUIRED (see also Decision 7 — existing architecture does not support this placement without a new mechanism, independent of whether it is desired)
```

## 10. Decision 7 — Opportunity Creation Boundary

Confirmed boundary, consistent with all prior Path 2 documents and not reopened: Discovery remains broad (unchanged — no category filtering added to Discovery by any authorized document); Research determines plausibility; Qualification may consume it. Category plausibility is not moved into Discovery by this or any prior document.

Per `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §11: the current architecture already supports "post-Opportunity, Qualification-time" consumption without any Opportunity state-machine change — `createOpportunityForOwner` and `evaluateQualificationForOwner` are independent, separately-invoked steps, and `StoredOpportunity` has no category field.

Whether plausibility should ever be allowed to influence Opportunity *creation* itself (rather than only Qualification, after the Opportunity already exists) is a distinct placement with **no existing architectural support** — it would require new logic gating `createOpportunityForOwner` on a Research result, which does not exist today in any form.

```text
Placement: PRODUCT DECISION REQUIRED. The "post-Opportunity, Qualification-time" placement is the only one with existing architectural support; the "influences Opportunity creation" placement would require new mechanism regardless of which is chosen.
```

## 11. Decision 8 — Persistence

**Which path is active, confirmed from code** (§3): the live MVP path is `mapping.ts` → `ResearchSignalRepository`, with a concrete Postgres implementation (`pgRepository.ts:50`, `createPgResearchSignalRepository`). The parallel `persist.ts` → `acq_lead_research` path (`storeResearch`/`ResearchRepository`) has **no concrete implementation anywhere in the codebase** and is **not called by `service.ts`, `worker.ts`, or any file outside `persist.ts`/`index.ts`'s re-export** — confirmed inactive in the current runtime.

**Should the new field be persisted**: if Decision 4/5 authorize the field and either Q1 or Q2, then yes — some persisted form is required for Qualification (Q1) or for review/display (Q2) to read it after the Research run completes; a purely in-memory/transient value would not survive past the worker invocation that produced it. This is a structural inference from the existing pipeline shape (Research and Qualification run as separate, later-invoked steps), not itself an authorization to build the persistence.

**Where**: the live `ResearchSignalRepository` path, per the same generic `allObservations()` → `toNewResearchSignals()` flow every existing field uses — no new table or repository interface identified as necessary.

**Whether UNKNOWN is persisted**: yes, by the live path's existing behavior — `toNewResearchSignals()` maps every `Observation` including UNKNOWN ones (`mapping.ts:5-14`, explicitly contrasted with `persist.ts`'s UNKNOWN-dropping behavior, which is moot since that path is inactive).

**Whether provenance is persisted**: yes, by the live path's existing behavior — `NewResearchSignalInput.sources` carries the full `evidence[]` array (`mapping.ts:24-28`), not just the first source (unlike the inactive `persist.ts` path).

**Schema/migration changes**: `field` is typed as a plain `string` (not a literal union) on `NewResearchSignalInput`/`StoredResearchSignal` (`types.ts:26-27,47`), suggesting the underlying column already accepts arbitrary field names without a migration — **this remains an inference from the TypeScript type signature; the actual Postgres column/migration definition backing `pgRepository.ts` was not read in this task** and would need confirming before implementation.

```text
Persistence location and whether a migration is truly unneeded: PRODUCT/TECHNICAL DECISION REQUIRED to confirm against the actual Postgres schema before implementation, though no migration is currently anticipated from the type evidence available.
```

## 12. Decision 9 — FIELD_KIND / Scoring Exposure

Inspected `FIELD_KIND` (`persist.ts:38-48`): a `Record<string, ResearchSourceKind>` consumed only by `persist.ts`'s own `toResearchRows()` (`persist.ts:81`, `FIELD_KIND[observation.field] ?? 'WEBSITE'`), which feeds the `acq_lead_research`/`core-acquisition` scorer path. Per Decision 8's confirmed finding, **this entire path is inactive in the current runtime** — `FIELD_KIND` is not consulted by anything in the live `mapping.ts`/`ResearchSignalRepository` flow, and `toNewResearchSignals()` (the live mapper) does independently also reference `FIELD_KIND` (`mapping.ts:1,19`) for its own `NewResearchSignalInput.kind` field — **this is a correction to treat carefully: `FIELD_KIND` IS consulted by the live path too** (`mapping.ts` imports it from `persist.ts` and uses it at line 19), even though `persist.ts`'s own `storeResearch()`/`ResearchRepository` machinery is not called. So a missing `FIELD_KIND` entry affects the live `ResearchSignalRepository`-persisted `kind` field (silently defaulting to `'WEBSITE'`), independent of whether the separate `acq_lead_research` scorer path is ever reactivated.

**Include** (add a `FIELD_KIND` entry): the new field gets an explicit, correct `kind` classification (rather than a silent `'WEBSITE'` default) in the live `ResearchSignalRepository` persistence. Whether that also exposes it to the (currently inactive, but not deleted) `core-acquisition` scorer *if that path is ever reactivated* is a secondary, forward-looking concern — not a live scoring change today, since `scoreProspect`/`core-acquisition` is not invoked from the current worker pipeline via `persist.ts` (per Decision 8).

**Exclude** (omit, accept the `'WEBSITE'` default): avoids any explicit acknowledgment of the field in scoring-adjacent code, at the cost of a less accurate `kind` classification in the live `ResearchSignalRepository` record.

```text
Include vs. exclude: PRODUCT DECISION REQUIRED. Neither choice changes live scoring today (§Decision 8 confirms the acq_lead_research/scorer path is inactive), but the choice does affect the accuracy of the kind field persisted to the live ResearchSignalRepository table, and pre-commits a position on future core-acquisition scorer exposure if that path is ever reactivated — that reactivation itself would be a separate authorization, not implied by either choice here.
```

Explicitly preserved regardless of this decision:
```text
MVP scoring algorithm: unchanged
OpportunityScore: unchanged
ranking: unchanged
```

## 13. Decision 10 — UI Visibility

```text
visible to user? UNRESOLVED
```

No UI files were inspected in this task (out of scope). No existing document establishes whether category plausibility should be user-visible. If visible, the conceptual output named by the task — "Target-customer fit / MATCH / MISMATCH / UNKNOWN / Evidence / Confidence / Source" — maps directly onto the existing `Observation` shape's fields, requiring no new display primitive beyond whatever pattern already renders other Research signals, but this is a technical observation, not a decision that visibility should happen at all.

## 14. Decision 11 — Freshness / Reruns

Confirmed generic mechanism (§3): `supersedePrevious(prospectId, at)` operates **per Prospect**, not per Search and not per `targetCustomer` value. Consequences for each scenario:

1. **Research is rerun** (same prospect, same Search/`targetCustomer`): prior plausibility observation is superseded, new one inserted — handled correctly by the existing generic mechanism, no new logic needed.
2. **Evidence changes** (business website changes between runs): same as (1) — a rerun naturally picks up new evidence and supersedes the old observation.
3. **Prospect website changes**: same as (2), contingent on Research actually being rerun — nothing in the traced code triggers an automatic rerun on external website changes; that is outside this scope and unrelated to category plausibility specifically.
4. **Participant changes `targetCustomer`**: per `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §5, `StoredSearch.parameters` is an immutable snapshot at Search-creation time — editing `ServiceProfile.targetCustomer` does not retroactively change an already-created Search's parameters or trigger a rerun of already-completed Research for that Search.
5. **Same prospect in another Search with a different target customer**: the per-Prospect supersede mechanism would supersede the *first* Search's plausibility observation when the *second* Search's Research run completes — this is very likely the wrong behavior if plausibility is genuinely Search/participant-intent-specific (see Decision 12), because it means only the most recent Search's plausibility result survives, even though the prospect may legitimately be researched under two different target-customer contexts.

**Whether plausibility should be tied to**: {the Research result only, the Search, the ServiceProfile, or recomputed whenever `targetCustomer` changes} — **undecided**, and Decision 12 shows the existing per-Prospect supersede semantics do not cleanly support the "tied to the Search" option without a mechanism change.

```text
PRODUCT DECISION REQUIRED, with a flagged architectural tension: the existing supersede-per-Prospect mechanism silently discards a still-valid plausibility result from Search A when Search B's Research completes for the same prospect, unless plausibility is deliberately scoped per-Search rather than per-Prospect — which the current ResearchSignal model does not do for any existing field either.
```

## 15. Decision 12 — Target Customer Changes

Scenario: Search A (`targetCustomer = "Restaurants"`) and Search B (`targetCustomer = "Hotels"`) both discover the same prospect.

**Can one Research result safely serve both searches?** No, not if the plausibility determination is genuinely a function of `targetCustomer` (which is the entire premise of category plausibility) — a MATCH computed against "Restaurants" is not meaningfully a MATCH or MISMATCH against "Hotels"; the value is participant-intent-specific by construction (§7's semantic distinction between `targetCustomers` and the proposed comparison field).

**Architectural consequence, if this is confirmed as the intended behavior**: the current `ResearchSignal` model keys signals by Prospect (via `listByProspect(userId, prospectId)`, `repository.ts:28`) and supersedes by Prospect, not by (Prospect, Search) or (Prospect, targetCustomer) pairs. A prospect discovered under two different target-customer contexts would, under the current mechanism, end up with only one active plausibility observation at a time — whichever Search's Research ran most recently — silently overwriting the other's result rather than maintaining two independently valid determinations.

```text
PRODUCT DECISION REQUIRED: whether this single-active-result-per-Prospect behavior is acceptable for category plausibility specifically, or whether it requires a new persistence key (e.g. scoped per-Search rather than per-Prospect) — the latter would be a structural change beyond what any prior Path 2 document has scoped, and is not authorized here.
```

## 16. Decision 13 — R-71 Boundary

```text
R-71 = topic-vs-problem relevance
Category plausibility = right-audience-vs-wrong-audience
```
Confirmed as distinct concepts, consistent with every prior Path 2 document, re-verified against `packages/core-qualification/src/adapters.ts:136-152` in this task (`TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])`, governing exclusion from `suggestOffers()`/`toOfferSignals()` for the topic-vs-problem axis specifically).

```text
TOPICAL_FIELDS: unchanged
suggestOffers(): unchanged
toOfferSignals(): unchanged
```
The new category-plausibility field is not added to `TOPICAL_FIELDS` and is not routed through `suggestOffers()`/`toOfferSignals()` by any decision recorded in this document.

## 17. Decision 14 — Scoring / Ranking

```text
FACTOR_WEIGHTS: unchanged
scoring algorithm: unchanged
OpportunityScore: unchanged
ranking: unchanged
four-factor treatment: unchanged
```
Confirmed per `packages/core-opportunity/src/service.ts:264-401` and `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` — scoring/ranking is an independently authorized, separately-gated worker step with no data dependency on Research's field set or Qualification's criteria. Per Decision 9, the field's presence or absence in `FIELD_KIND` does not change live scoring today (the `acq_lead_research`/`core-acquisition` scorer path is confirmed inactive), but is recorded there as a separate, forward-looking authorization question should that path ever be reactivated.

## 18. Decision 15 — Validation

**Technical**, to be proven by a future implementation (not performed here):
```text
participant targetCustomer reaches Research (worker → ResearchProviderInput)
Research produces a category plausibility result using the approved semantic model
evidence/provenance is valid (verifyProvenance() passes for OBSERVED claims)
result persists correctly via ResearchSignalRepository
Qualification consumes it, if Q1 is authorized (Decision 5)
```

**Product**, for real participant validation (not performed here):
```text
Does the discovered business belong to one of the participant's target segments?
Would the participant consider the business a legitimate target?
```

No validation is conducted by this document. The unresolved Anthropic-credit blocker noted in prior Path 2 documents (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:39-40`) remains unrelated to and unresolved by this decision record.

## 19. Decision 16 — MVP Status

```text
MVP-required / MVP enhancement / post-MVP: PRODUCT DECISION REQUIRED
```
Existing governance evidence: `MVP_SCOPE_BOUNDARY.md`'s exit criteria (per `requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:307`) list "Businesses are discovered" and "Duplicates are removed" as the Discovery-stage bar, with no category-correctness criterion — the audit itself records this as "UNDETERMINED whether this counts as covered." No document states that category plausibility is required to close the existing, already-satisfied 19-criterion MVP engineering exit, and this document does not reopen that exit. Whether this capability should nonetheless be built as part of the current MVP effort, as a later enhancement, or deferred post-MVP is not established by any existing document and is not decided here.

## 20. Decision 17 — Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This holds regardless of how many of the above decisions might already appear self-evident — a separate, explicit implementation-authorization step is required and does not occur in this document.

## 21. Consolidated Decision Register

| # | Decision | Status |
|---|---|---|
| 1 | MATCH evidentiary bar | PRODUCT DECISION REQUIRED |
| 2 | MISMATCH evidentiary bar | PRODUCT DECISION REQUIRED |
| 3 | UNKNOWN default for absent evidence | Working assumption per task instruction (not equated with MISMATCH); not formally authorized by repository governance |
| 4 | Minimum evidence tier (Tier 1 / 1+2 / 1+2+3) | PRODUCT DECISION REQUIRED |
| 5 | Multi-segment semantics (OR/AND/segment-level/other) | PRODUCT DECISION REQUIRED |
| 6 | Research output contract shape/name | PRODUCT DECISION REQUIRED (candidate: new `Observation`-shaped `LeadResearch` field, not repurposing `targetCustomers`) |
| 7 | Qualification integration (Q1 new criterion vs. Q2 evidence-only) | PRODUCT DECISION REQUIRED |
| 8 | MATCH → Qualification/Opportunity effect | PRODUCT DECISION REQUIRED |
| 9 | MISMATCH → Qualification/Opportunity effect, incl. whether it blocks Qualification | PRODUCT DECISION REQUIRED |
| 10 | UNKNOWN → Qualification/Opportunity effect, incl. whether it blocks Qualification | PRODUCT DECISION REQUIRED |
| 11 | Whether MISMATCH can ever prevent Opportunity creation | PRODUCT DECISION REQUIRED (no existing architectural support for this placement either way) |
| 12 | Persistence location/depth, incl. migration confirmation | PRODUCT/TECHNICAL DECISION REQUIRED (live `ResearchSignalRepository` path identified as the candidate; migration need inferred as unlikely but unconfirmed against actual schema) |
| 13 | `FIELD_KIND` inclusion/exclusion for the new field | PRODUCT DECISION REQUIRED |
| 14 | UI visibility | UNRESOLVED |
| 15 | Freshness scoping (per-Prospect vs. per-Search vs. per-ServiceProfile) | PRODUCT DECISION REQUIRED (existing per-Prospect supersede mechanism confirmed insufficient for genuinely Search-specific plausibility, per Decision 12) |
| 16 | Behavior when the same prospect appears under two different `targetCustomer` values | PRODUCT DECISION REQUIRED |
| 17 | R-71 boundary | CONFIRMED UNCHANGED |
| 18 | Scoring/ranking boundary | CONFIRMED UNCHANGED |
| 19 | Validation acceptance criteria | Candidate list recorded (Decision 15); not formally adopted |
| 20 | MVP status (required/enhancement/post-MVP) | PRODUCT DECISION REQUIRED |
| 21 | Implementation authorization | NOT GRANTED |

## 22. Explicit Non-Goals

- Discovery query redesign.
- Discovery category filtering.
- R-70 modification.
- R-71 modification.
- `TOPICAL_FIELDS` modification.
- `suggestOffers()`/`toOfferSignals()` modification.
- Scoring algorithm changes.
- `FACTOR_WEIGHTS` changes.
- `OpportunityScore` changes.
- Ranking changes.
- Opportunity state-machine changes.
- UI implementation.
- Schema/migration changes.
- Outreach, CRM, follow-up.
- Live validation.
- Selecting any of the unresolved decisions listed in §21.

## 23. Repository Safety

Verified via `git status --short`, `git diff --stat`, `git diff --check`, and `git rev-parse HEAD` before and after this analysis:

```text
HEAD: 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Production files changed: 0
Tests changed: 0
PRD changed: 0
Config changed: 0
Database changed: 0
Existing scope documents changed: 0 (DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md,
  OPTION_B_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md,
  OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md,
  PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md,
  PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md — all untouched)
Only new file: requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md
Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts
Staged: none
Commit: none
Push: none
Live API calls: none
```
