# PATH 2 — CATEGORY PLAUSIBILITY FINAL PRODUCT DECISION RECORD

## 1. Status

```text
PATH 2:
SELECTED

Implementation:
NOT AUTHORIZED

Product decisions:
D0–D6 DECIDED (see §3). D7–D11 remain PRODUCT OWNER DECISION REQUIRED / UNRESOLVED.
```

This document converts `requirement/PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md` into a direct-answer questionnaire for the Product Owner. D0–D6 are now formally decided and recorded in §3 (D6 was decided first; D0–D5 were locked in a subsequent Product Owner decision pass, recorded below in the same section). D7–D11 remain `PRODUCT OWNER DECISION REQUIRED` / `UNRESOLVED`. Every decision below carries the exact same evidentiary basis established in the packet and its five upstream documents (`PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md`, `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md`, `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md`, `OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md`, `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md`, and — for the D0–D5 locked decisions specifically — `PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md`); no new fact is introduced by the D0–D5 lock beyond the Product Owner's selections among the choices those documents already enumerated.

**This update is a documentation/governance change only.** It records that the Product Owner has selected among the already-enumerated choices for D0–D5. It does not implement, schema-design, migrate, or code anything. See §8 (Implementation Authorization) and §11 (Safety / Audit Record).

---

## 2. Already-Decided Boundaries

These are no longer open and are not reopened by this record:

- **Option B** — category plausibility is owned by Research/Qualification, not Discovery (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §13).
- **Path 2** — Research produces the plausibility determination; Qualification consumes it (not Path 1's Qualification-side comparison) (`OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` §14).
- **Discovery unchanged** — remains intentionally broad; `buildQuery()` continues receiving `targetCustomer` exactly as today; no category filtering is added to Discovery.
- **R-71 unchanged** — `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` (`packages/core-qualification/src/adapters.ts:136-152`) is not extended with the new field; the new field is not routed through `suggestOffers()`/`toOfferSignals()`.
- **Scoring unchanged** — `scoreOpportunity`/`scoreOpportunityForOwner` (`packages/core-opportunity/src/service.ts:264-401`) remains an independently authorized, separately-gated worker step with no data dependency on Research's field set or Qualification's criteria.
- **Ranking unchanged** — `rankOpportunities`, same trace as scoring.
- **Provider neutrality is architecturally enforced already** — `researchModelFactory.ts` is "the ONE place in the codebase allowed to branch on provider identity"; any new field must live in the shared `schema.ts`/`provider.ts` layer.
- **Provenance/validation machinery is not weakened by any option below** — `verifyProvenance()` (`researcher.ts:253`) and the retry/repair loop (`researcher.ts:151-293`) operate generically over whatever `leadResearchSchema` defines; a new field participates automatically with no new code and no relaxation of existing checks.
- **No implementation authorization exists** — every upstream document's authorization section reads `NOT AUTHORIZED` / `NOT GRANTED`; this record does not change that.
- **D0–D6 are DECIDED** — see §3. D6 (persistence scope & historical attribution) was the first decision locked: category plausibility is scoped per Search + Prospect, historical attribution across Searches is preserved, and cross-search overwrite is not allowed. D0–D5 (MVP status, output location, multi-segment semantics, evidence sufficiency, Qualification consumption, and MATCH/MISMATCH/UNKNOWN state behavior) have now also been locked by the Product Owner, per §3 below. D7–D11 remain open.

---

## 3. Product Decision Questionnaire

### D0 — MVP Status

**Question:** Is Research-level category plausibility (Path 2) part of the current MVP effort, a post-MVP enhancement, or unscheduled?

**Repository evidence:** `MVP_SCOPE_BOUNDARY.md`'s exit criteria include "Businesses are discovered" and "Duplicates are removed" for the Discovery stage, with no category-correctness criterion anywhere in the 19-criterion exit list. `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18 records "MVP ENGINEERING EXIT: SATISFIED" — the existing exit is not reopened by this capability's absence. No document (PRD V2.2 included) states this capability is required to close the current MVP.

**Choice A — MVP-required:** Treated as a blocking requirement for the current MVP milestone; implementation is scheduled immediately upon authorization.

**Choice B — MVP enhancement:** Treated as an in-scope but non-blocking improvement to the current MVP; may ship alongside or shortly after MVP close without blocking it.

**Choice C — Post-MVP:** Deferred entirely; no implementation work begins until a separate future authorization.

**Implementation consequence:**
- A: Work begins as soon as D1–D11 are answered; no other MVP work is gated on it, but it consumes near-term engineering time.
- B: Work is scheduled but does not block MVP sign-off; sequencing relative to other post-authorization work is a planning decision, not addressed here.
- C: No further decision below needs to be finalized until this is revisited; D1–D11 remain recorded but inactive.

**Locked Decision (Product Owner):**

```text
CATEGORY PLAUSIBILITY IS AN MVP ENHANCEMENT.
```

Selects **Choice B**. Interpretation:
- The capability belongs within the MVP product scope.
- It does NOT reopen or invalidate the already-established 19-criterion engineering MVP exit (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18, "MVP ENGINEERING EXIT: SATISFIED").
- The existing MVP engineering exit remains satisfied.
- Category plausibility is a separately scoped MVP enhancement/implementation workstream.
- This decision does not claim that implementation is complete. No implementation exists as of this record.

**Decision:**
DECIDED

---

### D1 — Output Contract / Output Location

**Question:** What exact representation does the category-plausibility result take, and where in Research's output/persistence does it live?

**Repository evidence:** `LeadResearch.targetCustomers` already exists (`schema.ts:176-201`) but is a *descriptive* fact ("who the business serves," `adapters.ts:136-152`), not a comparison to the participant's intent — it must not be repurposed. Candidate locations, per `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §7 and `PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md` §4: (1) a new field on `LeadResearch` reusing the existing `Observation` shape (`value`/`classification`/`confidence`/`evidence[]`/`basis`) — the smallest change, but does **not** natively satisfy the already-decided D6 per-Search-attribution requirement, since `ResearchSignal`'s persistence key is Prospect-only; (2) a new `ResearchSignal` kind with a bespoke shape — medium footprint, same D6-compatibility gap; (3) run-level metadata outside `LeadResearch` — no existing precedent found; (4) a dedicated Search + Prospect entity/record — the largest schema footprint, but the only candidate whose natural key (Search, Prospect) directly satisfies D6 without further modification to the existing Prospect-only `ResearchSignal`/`supersedePrevious()` mechanism.

**Choice A — New `LeadResearch` field (Observation-shaped):** Smallest change; reuses every existing mechanism (schema validation, provenance verification, retry/repair, persistence mapping) automatically once added to `allObservations()`. Does not natively satisfy D6 without a separate attribution-key mechanism.

**Choice B — New `ResearchSignal` kind (bespoke shape):** Could carry a richer structure (e.g., matched-segment breakdown) than the uniform `Observation` model supports, at the cost of new persistence machinery not currently modeled. Same D6-compatibility gap as Choice A.

**Choice C — Run-level metadata or a separate result object (outside `LeadResearch`):** Cleanest conceptual separation from the per-field evidence model, but no existing code path or precedent supports either; would require new plumbing end-to-end.

**Choice D — Dedicated Search + Prospect category-plausibility determination/entity:** A new record attributable to the specific (Search, Prospect) pair, distinct from `LeadResearch`/`ResearchSignal`'s existing Prospect-only keying. Natively satisfies D6. Largest schema/dependency footprint of the four (new persistence path, and `QualificationDeps` would gain a new repository dependency to reach it, unlike Choices A/B which reuse the existing `signals.listByProspect` path).

**Implementation consequence:**
- A/B: Touches `schema.ts`, `allObservations()`, `mapping.ts`, `FIELD_KIND`; would additionally require a separate, currently-unscoped mechanism to satisfy D6's per-Search attribution, since neither candidate's natural key matches (Search, Prospect).
- C: Requires new wiring comparable in size to B, with no existing pattern to build from, and would need a new channel to reach Qualification.
- D: Requires a new table/repository interface and a new `QualificationDeps` dependency; no schema, migration, TypeScript type, repository, Research code, or Qualification code is created by this decision — only the requirement is locked.

**Locked Decision (Product Owner):**

```text
USE A NEW DEDICATED SEARCH + PROSPECT CATEGORY-PLAUSIBILITY DETERMINATION.
```

Selects **Choice D**. Requirements:
- The determination must be attributable to the specific Search + Prospect combination.
- Do not store it as a Prospect-global determination.
- Do not repurpose `LeadResearch.targetCustomers` as the category-plausibility result.
- Do not route the determination through the existing R-71 offer-signal path.
- Preserve compatibility with the already-decided D6 historical attribution requirement (§ D6 below).
- The exact implementation/schema design (table shape, repository interface, migration, exact field names) remains implementation-scope work and is **not authorized** by this document update. See §9 and §10.

**Decision:**
DECIDED

---

### D2 — Multi-Segment Semantics

**Question:** How should a compound `targetCustomer` string (multiple target segments in one field) be represented to Research, and how should a business matching some-but-not-all segments be classified?

**Repository evidence:** `ServiceProfile.targetCustomer` is a single, unparsed `string` (`packages/core-service-profile/src/types.ts:10-14`). The real case that exposed this issue: `"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"` — three segments in one string, inserted verbatim into Discovery's query today with no segment structure recognized anywhere in the codebase (`DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md:22,54,116`). No delimiter precedence is established anywhere (the example uses `,` *within* a segment and `;` *between* segments).

**Choice A — Raw string passthrough (Option I-A):** Pass the compound string verbatim to Research, exactly as Discovery's `buildQuery()` already does; the model interprets and matches against the compound string unaided. Smallest input-side change; least controllable output.

**Choice B — Pre-parsed/structured segments (Option I-B):** Split the string into discrete segments before Research sees them via a deterministic rule, then apply an explicit matching rule downstream of Research or within the prompt.

**Choice C — OR semantics:** A business matching at least one stated segment counts as an overall MATCH.

**Choice D — AND semantics:** A business must plausibly match every stated segment to count as MATCH. (Evidence note only, not a recommendation: documents observe the real example's segments read as alternatives rather than a conjunctive requirement, which would make AND semantics reject nearly every real-world MATCH — this is a stated fact about the example, not a decision made here.)

**Choice E — Segment-level result:** Evaluate each segment independently and report a per-segment breakdown, with an aggregation rule (majority/any/weighted) that is itself undefined by any document.

**Implementation consequence:**
- A + C/D/E: is only fully coherent if paired with B (segments must exist as discrete units before a per-segment rule can apply); A + a segment-level rule (E) is not supported without new parsing logic.
- B requires new parsing code with no precedent, and a defined splitting rule.
- C/D require no new output shape beyond a single classification value; E requires a richer output shape than a single `Observation` provides, coupling this decision to D1.

**Locked Decision (Product Owner):**

```text
USE ANY-MATCH SEMANTICS WITH DETERMINISTIC SEGMENT PARSING.
```

Selects **Choice B (deterministic structured parsing) paired with Choice C (ANY/OR semantics)** — i.e., Semantic A + Parsing Option 2 in `PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md` §5. Requirements:
- A participant may provide multiple target-customer segments.
- Parse the participant's `targetCustomer` into explicit structured segments before category-plausibility evaluation.
- Evaluate each segment independently.
- Overall result is:
  - **MATCH** if at least one target segment is supported by sufficient evidence.
  - **MISMATCH** only when the evidence supports that none of the supplied target segments fit.
  - **UNKNOWN** when available evidence is insufficient to determine whether any supplied segment matches.
- Preserve the individual segment determinations/evidence so the overall result remains explainable.
- Do not silently treat the entire raw compound `targetCustomer` string as one semantic category.
- This decision does not authorize a particular parser library or implementation technique beyond the locked requirement for deterministic segment parsing. The exact splitting rule (delimiter precedence, etc.) remains implementation-scope work — see §9 and §10.

**Decision:**
DECIDED

---

### D3 — Evidence Requirements / Sufficiency / Insufficient Evidence

**Question:** What evidence tier and source type are sufficient to classify a business as MATCH or MISMATCH, and what happens when evidence is insufficient?

**Repository evidence:** No existing document defines an evidentiary bar for category plausibility. The closest precedent, `isEvidentiary()` (`packages/core-qualification/src/rules.ts:26-28`: `classification === 'OBSERVED'`), sets the bar for a *different* claim (`EVIDENCE_PRESENT`, need/problem evidence) — not established as transferable. Evidence tiers, as previously catalogued (`PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §9, `PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md` §7): Tier 1 (direct self-identification, maps to `OBSERVED` + `verifyProvenance()`, already gated with no new machinery); Tier 2 (strong contextual evidence — menus, booking flows, catalogues — maps to `OBSERVED` or `INFERRED` depending on directness); Tier 3 (weak/name-only inference, maps to `INFERRED`, capped at confidence ≤80, and directly conflicts with the `isEvidentiary()` precedent that excludes `INFERRED` from `EVIDENCE_PRESENT`). The task instruction is explicit that absence of evidence must not default to MISMATCH. Research today fetches only the candidate's own homepage at its `normalizedDomain` — all evidence available to Research under the current architecture is first-party; no document authorizes fetching third-party sources.

**Choice A — Tier 1 only (`OBSERVED`, direct self-identification required):** Strictest; consistent with the existing `isEvidentiary()` precedent; the smallest number of businesses receive a MATCH/MISMATCH determination, more fall to UNKNOWN.

**Choice B — Tier 1 + Tier 2 (`OBSERVED`, direct or strong contextual):** Moderate; captures businesses identifiable from context (e.g., a menu page) without an explicit self-description sentence; loosens the bar relative to the `EVIDENCE_PRESENT` precedent.

**Choice C — Tier 1 + Tier 2 + Tier 3 (including weak/name-only `INFERRED` evidence):** Maximizes recall (fewest UNKNOWNs); directly inconsistent with the existing `isEvidentiary()` precedent, since this criterion would then accept a lower evidentiary bar than the existing `EVIDENCE_PRESENT` criterion.

**On insufficient evidence:** Per task instruction and the working assumption recorded in `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §4 (Decision 1, UNKNOWN): insufficient, ambiguous, or absent evidence must produce UNKNOWN, not MISMATCH.

**Implementation consequence:**
- A: Requires the prompt/schema to require direct self-identification for a non-UNKNOWN result; more UNKNOWN outcomes reach Qualification/UI.
- B: Requires prompt clarification that directly-quoted contextual content (not model inference) still counts as `OBSERVED`.
- C: Requires no additional machinery beyond the existing `INFERRED` classification, but establishes an evidentiary double-standard relative to `EVIDENCE_PRESENT` that would need explicit acknowledgment.
- Third-party evidence (if ever authorized): would require new Research fetch/source logic not scoped by any Path 2 document — explicitly not proposed here.

**Locked Decision (Product Owner):**

```text
USE FIRST-PARTY WEBSITE EVIDENCE AS THE PRIMARY SUFFICIENCY BAR, WITH SEARCH-DERIVED
BUSINESS METADATA AS SUPPORTING EVIDENCE.
```

Evidence hierarchy:
1. First-party business website / authoritative business-owned content.
2. Reliable business metadata or discovery evidence as supporting evidence.
3. Search/discovery snippets or equivalent weak evidence may assist but must not independently establish a definitive MATCH/MISMATCH when stronger evidence is unavailable.

Minimum sufficiency:
- A definitive MATCH or MISMATCH requires sufficient evidence tied to the discovered business and the participant's structured target segment(s) (per D2).
- Evidence must be specific enough to support the category determination rather than merely relying on a generic business name or keyword coincidence.

Insufficient evidence:
- Produce **UNKNOWN**. This formally ratifies the working assumption previously recorded as unresolved in `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §4 and §21 item 3.
- Do not infer MATCH or MISMATCH merely because evidence is weak, ambiguous, missing, or generic.
- Preserve the evidence/basis supporting UNKNOWN.

This decision does not invent a new evidence-tier taxonomy beyond what is necessary to express the above (it maps most directly onto Choice B's Tier 1 + Tier 2 primary bar, with Tier 3 / weak signals demoted to supporting-only status rather than independently sufficient). Exact prompt wording and schema encoding remain implementation-scope work — see §9 and §10.

**Decision:**
DECIDED (including ratification of the UNKNOWN-not-MISMATCH working assumption)

---

### D4 — Qualification Consumption

**Question:** How, if at all, does Qualification consume the Research-produced plausibility result?

**Repository evidence:** `QUALIFICATION_CRITERIA` is exactly `['NEED_DETECTED', 'EVIDENCE_PRESENT']` today (`packages/core-qualification/src/types.ts:12`). Under Path 2's design, Qualification would read an already-computed Research field — no new `QualificationDeps` repository dependency is required for Choices A/B below; Choice D1's dedicated Search+Prospect entity would require a new dependency (see D1).

**Choice A — Informational only (no Qualification code change):** The field is persisted and readable (e.g., for participant review/UI) but Qualification's evaluation logic is entirely unaware of it; `QUALIFICATION_CRITERIA` and `evaluator.ts` are untouched.

**Choice B — Evidence-only consumption (Q2, per prior documents):** Same code footprint as Choice A functionally (no criteria change), framed as "the value exists for review/display purposes only" rather than gating anything.

**Choice C — New Qualification criterion (Q1, per prior documents):** Extends `QUALIFICATION_CRITERIA` with a new criterion (conceptually `CATEGORY_PLAUSIBLE`, name not approved), adds a rule function in `rules.ts`, invokes it in `evaluator.ts`. The result becomes load-bearing — it can affect whether an Opportunity reaches `QUALIFIED`, subject to D5's state-behavior answers.

**Implementation consequence:**
- A/B: Zero code change in `core-qualification`; only Research-side work (D1–D3, D8) is required; smaller, reversible, can be layered into C later without re-touching Research.
- C: Requires new criterion, rule function, evaluator wiring, and new tests covering the criterion alongside the existing `NEED_DETECTED`/`EVIDENCE_PRESENT` short-circuit; per `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md:333`, "qualification-v1 evaluator versioning already supports adding new criteria without breaking existing ones" — the extension pattern exists, but the criterion itself does not.

**Locked Decision (Product Owner):**

```text
Q1 — USE A NEW QUALIFICATION CRITERION.
```

Selects **Choice C**. Requirements:
- Category plausibility is a distinct Qualification concern.
- It must not be routed through R-71's Need Detection / offer-signal relevance logic.
- It must not alter R-71's `TOPICAL_FIELDS` or `suggestOffers()`/`toOfferSignals()` boundary.
- Qualification may consume the Search + Prospect category-plausibility determination (per D1).
- Exact criterion name, rule implementation, repository wiring, and state transitions are implementation-scope details and are **not authorized** by this document update. See §9 and §10.

**Decision:**
DECIDED

---

### D5 — State Behavior (MATCH / MISMATCH / UNKNOWN)

**Question:** What effect, if any, does each of MATCH, MISMATCH, and UNKNOWN have on Qualification's outcome and on Opportunity creation?

**Repository evidence:** No existing state models this — `StoredQualification` and `StoredOpportunity` (`packages/core-qualification/src/types.ts`, `packages/core-opportunity/src/types.ts:40-59`) have no category-plausibility-aware state today. `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) and `evaluateQualificationForOwner` (`packages/core-qualification/src/service.ts:59-78`) are independent, separately-invoked steps — the architecture supports gating at Qualification time without any Opportunity state-machine change, but supports no existing mechanism for gating Opportunity *creation* itself.

**MATCH:**
- **Choice A:** No effect (consistent with D4 = informational/evidence-only).
- **Choice B:** Supports the existing `EVIDENCE_PRESENT` criterion (would require deciding how a category-fit fact relates to an evidence-presence criterion — not defined by any document).
- **Choice C:** Contributes toward `QUALIFIED` as part of a new criterion (D4 = Choice C).

**MISMATCH:**
- **Choice A:** No effect — Opportunity/Qualification proceed exactly as they would without this capability.
- **Choice B:** Produces `NOT_QUALIFIED` — this is a **new state transition**; no such trigger exists today.
- **Choice C:** Produces a new, currently-nonexistent state (e.g., "flagged" or "insufficient evidence, held") distinct from a hard `NOT_QUALIFIED`.

**UNKNOWN:**
- **Choice A:** "No opinion, proceed" — Qualification behaves as if the criterion were not evaluated.
- **Choice B:** Holds the candidate pending more evidence — no existing hold state exists in `StoredQualification` today.
- **Choice C:** Requires human review — no existing review-required state exists today.

**Does MISMATCH or UNKNOWN affect Opportunity *creation* (not just Qualification)?**
- **Choice A — No:** `createOpportunityForOwner` remains unconditional; this is the only placement with existing architectural support (no code path today gates Opportunity creation on any Research result).
- **Choice B — Yes:** Requires new gating logic in `createOpportunityForOwner` or upstream of it — a change with no existing precedent or support in the current architecture.

**Implementation consequence:**
- Any "no effect" choice for MATCH/MISMATCH/UNKNOWN requires zero Qualification code change (consistent with D4 = A/B).
- Any state-changing choice for MISMATCH (Choice B or C) requires D4 = Choice C (a new criterion) at minimum, plus new state definitions in `StoredQualification`/possibly `StoredOpportunity`, plus new tests for the new transition.
- Opportunity-creation gating (the "Yes" choice above) is the single largest architectural change in this entire decision set — no traced code path supports it today in any form, for any reason, independent of every other decision.

**Locked Decision (Product Owner):**

**MATCH** — selects **Choice C**:
- Category plausibility criterion passes.
- Candidate may proceed through the normal Qualification flow, subject to the other existing qualification criteria.

**MISMATCH** — selects **Choice B** for the Qualification effect, and **Choice A** for the Opportunity-creation-gate placement:
- Category plausibility criterion fails.
- Candidate must NOT qualify.
- MISMATCH must NOT prevent Opportunity creation in the MVP architecture.
- Opportunity creation/state-machine behavior remains unchanged.
- The candidate may therefore exist as an Opportunity but must fail Qualification because category plausibility is mismatched.

**UNKNOWN** — selects a fail/hold treatment (a new, more precise option than the original A/B/C list — see below):
- Category plausibility is insufficiently evidenced.
- Candidate must NOT be treated as MATCH.
- Candidate must NOT qualify on the basis of UNKNOWN.
- UNKNOWN must therefore fail/hold the category-plausibility Qualification criterion.
- Do not invent a new Opportunity state or alter Opportunity creation.

Important separation, restated as part of this lock:
- Discovery remains broad.
- Research establishes category-plausibility evidence.
- Qualification consumes the determination.
- Opportunity creation remains unchanged.
- Scoring/ranking remain unchanged.

Exact rule implementation (new criterion function, `criteria` jsonb failure-reason encoding, any hold-state representation) remains implementation-scope work and is **not authorized** by this document update. See §9 and §10.

**Decision:**
DECIDED (four sub-decisions locked: MATCH effect, MISMATCH effect, UNKNOWN effect, Opportunity-creation gating)

---

### D6 — Persistence Scope & Historical Attribution

**Question:** How should the plausibility result be persisted, and how must it behave when the same Prospect is discovered across multiple Searches with different `targetCustomer` values?

**Repository evidence:** The live persistence path is `mapping.ts`'s `toNewResearchSignals()` → `ResearchSignalRepository`, with a concrete Postgres implementation (`pgRepository.ts:50`). `supersedePrevious(prospectId, at)` (`repository.ts:13-18`) marks **all** prior active signals for a Prospect as superseded before inserting new ones — this operates **per Prospect only**, not per Search and not per `targetCustomer` value. `StoredSearch.parameters` is an immutable snapshot taken at Search-creation time (`PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md` §5) — editing `ServiceProfile.targetCustomer` does not retroactively change an already-created Search's parameters.

**The confirmed architectural issue:** if Prospect P is discovered under Search A (`targetCustomer = "Restaurants"`) and later also under Search B (`targetCustomer = "Hotels"`) for the same participant, a plausibility determination is, by its own definition, specific to the `targetCustomer` it was evaluated against — a MATCH against "Restaurants" is not meaningfully a MATCH or MISMATCH against "Hotels." The unmodified per-Prospect supersede mechanism would let Search B's Research run silently overwrite (supersede) Search A's still-valid plausibility result, because the persistence key is Prospect-only, not (Prospect, Search) or (Prospect, `targetCustomer`).

**Decision:**
DECIDED

```text
STORAGE:
PER SEARCH + PROSPECT

HISTORICAL ATTRIBUTION:
PRESERVE

TARGETCUSTOMER CHANGE:
NEW SEARCH-SCOPED DETERMINATION

CROSS-SEARCH OVERWRITE:
NOT ALLOWED

QUALIFICATION:
CURRENT SEARCH + PROSPECT DETERMINATION
```

**Storage scope — PER SEARCH + PROSPECT.** Category plausibility is attributable to the specific Search context and the specific Prospect, not to the Prospect alone.

**Historical attribution — PRESERVE.** Prior category-plausibility determinations remain historically attributable and must not be silently overwritten when the participant's `targetCustomer` changes.

**TargetCustomer change.** When a later Search uses a different `targetCustomer`, that Search receives a new, Search-scoped category-plausibility determination for the same Prospect. It does not supersede the earlier Search's determination.

**Prior determinations.** Prior determinations remain retained and historically attributable to their original Search + Prospect context.

**Cross-search overwrite — NOT ALLOWED.** A later Search must not silently supersede or rewrite the category-plausibility determination belonging to an earlier Search.

**Qualification consumption.** Qualification must consume the category-plausibility determination belonging to the current Search + Prospect being evaluated — not whichever determination for that Prospect happens to be most recent across all Searches.

**Conceptual example** (preserving the distinction between Search context and Prospect):

```text
Search A:
  targetCustomer = Restaurants, Cafes
  Prospect X
  → MATCH

Search B:
  targetCustomer = Hotels, Resorts & Tour Operators
  Prospect X
  → MISMATCH
```

The system must retain both:

```text
Search A + Prospect X → MATCH
Search B + Prospect X → MISMATCH
```

It must **not** collapse this into:

```text
Prospect X → MISMATCH
```

— doing so would destroy the historical meaning of Search A's determination.

**Architectural implication (recorded as a consequence of this decision, not as an implementation instruction):** the existing per-Prospect research-signal supersession mechanism (`supersedePrevious(prospectId, at)`, `repository.ts:13-18`) must not be blindly reused for category plausibility, because doing so would let a later Search with a different `targetCustomer` overwrite the earlier Search's determination — the exact outcome this decision disallows. A future implementation needs an explicit Search-scoped attribution boundary for this field, distinct from the per-Prospect-only scoping every other `ResearchSignal` field uses today. A conceptual (not authorized, not schema) representation of what such a boundary would need to carry:

```text
category_plausibility
  search_id
  prospect_id
  target_customer_snapshot
  determination
  evidence
  timestamp
```

This is a conceptual model for this decision record only. No database schema, migration, TypeScript type, repository, Research code, or Qualification code is created or modified by this decision, and none is authorized by it. This conceptual shape is directly consistent with D1's now-locked "dedicated Search + Prospect determination" choice above.

**Implementation consequence:** whatever future implementation is eventually authorized (subject to D7–D11 remaining separately decided) must design persistence and supersession around a Search-scoped (or equivalent) attribution key for this field specifically — the existing per-Prospect-only mechanism, unmodified, is confirmed insufficient to satisfy this decision. No design, schema, or code change is made here; only the requirement is recorded.

**Status:**
DECIDED

---

### D7 — FIELD_KIND / Research-Signal Classification

**Question:** Should the new field be assigned an entry in `FIELD_KIND`, and does either choice have any consequence for existing scoring/research infrastructure?

**Repository evidence:** `FIELD_KIND` (`persist.ts:38-48`) is a `Record<string, ResearchSourceKind>`. It is consulted by the **live** `mapping.ts`'s `toNewResearchSignals()` (`mapping.ts:1,19`) to set the persisted `kind` field on every `ResearchSignal` — this is a correction to an earlier assumption that this lookup was confined to the confirmed-inactive `persist.ts`/`acq_lead_research` scorer path. A field with no `FIELD_KIND` entry silently defaults to `'WEBSITE'` (`persist.ts:81`, `?? 'WEBSITE'`) rather than erroring. Separately, the `persist.ts` → `acq_lead_research`/`ResearchRepository` path (which `FIELD_KIND` was originally built for) has **no concrete implementation anywhere in the codebase** and is not called by `service.ts`, `worker.ts`, or anything outside `persist.ts`/`index.ts`'s re-export — **confirmed inactive** in the current runtime.

**Choice A — Add an explicit `FIELD_KIND` entry:** The new field gets an accurate `kind` classification in the live `ResearchSignalRepository` persistence (rather than a silent, possibly-inaccurate `'WEBSITE'` default). This also pre-commits a `kind` classification that would apply automatically if the currently-inactive `acq_lead_research`/`core-acquisition` scorer is ever reactivated in the future — a forward-looking consequence, not a live one.

**Choice B — Omit the entry (accept the `'WEBSITE'` default):** Avoids any explicit acknowledgment of the field in scoring-adjacent code; the persisted `kind` value is less accurate but functionally inert today.

**Implementation consequence:** Neither choice changes live scoring today — the `acq_lead_research`/`core-acquisition` scorer path is confirmed inactive, and reactivating it would itself require separate, explicit authorization not implied by either choice here. The only live consequence is the accuracy of the `kind` field persisted to the (active) `ResearchSignalRepository` table.

**Decision:**
PRODUCT OWNER DECISION REQUIRED

---

### D8 — Research Input Contract

**Question:** What exact participant context does Research receive — `targetCustomer` alone, or additional context — and in what shape?

**Repository evidence:** `ResearchProviderInput` (`provider.ts:11-16`) carries exactly `prospectId`, `companyId`, `companyName`, `normalizedDomain` today — no participant context of any kind. The worker's Research call (`worker.ts:358-368`) passes only `{ prospectId }`, despite `runCanonicalPipeline` holding `search.parameters.targetCustomer` in scope throughout. `ResearchInput`'s existing but unused `industry`/`location` fields (`schema.ts:207-224`) are already wired into the prompt (`prompt.ts:36,55-56`) with an "Industry (supplied, unverified)" framing — directly reusable in spirit for how a participant-supplied `targetCustomer` should be presented (as stated intent, not verified fact), though no document decides whether to extend this existing field or add a new one.

**Choice A — `targetCustomer` alone (raw or structured per D2):** The smallest viable contract; sources only `search.parameters.targetCustomer` into a new/extended field, following Discovery's existing precedent of reading this single value.

**Choice B — `targetCustomer` plus additional `ServiceProfile`/search context** (e.g., `service`, `keywords`, geography): No document identifies a concrete need for more than `targetCustomer` for this specific comparison, but the option is not foreclosed.

**Choice C — Reuse the existing unused `industry` field** rather than adding a wholly new field: smallest schema footprint, but the existing field's "supplied, unverified" framing was not designed with a plausibility-comparison purpose in mind.

**Implementation consequence:**
- A: Minimal change to `ResearchProviderInput`/`ResearchInput`/`prompt.ts`/worker call site.
- B: Larger input contract; would need its own justification per field added, not established by any document today.
- C: Avoids adding a new schema field but overloads an existing field's documented meaning — a naming/semantics risk flagged, not resolved, by prior documents.

Whichever is chosen must live in the shared `schema.ts`/`provider.ts` layer (§ D9), not inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` individually.

**Decision:**
PRODUCT OWNER DECISION REQUIRED

---

### D9 — Provider Neutrality

**Question:** Confirm that whatever input/output contract is authorized must behave identically across Anthropic, OpenAI, and Gemini.

**Repository evidence:** `packages/core-research/src/researchModelFactory.ts` is documented in its own header comment as "the ONE place in the codebase allowed to branch on provider identity," selecting among `anthropic`/`openai`/`gemini` adapters and returning a single provider-neutral `ResearchModel` interface (`researcher.ts:44-56`). Everything above that factory — `researchLead()`, `schema.ts`, `provenance.ts`, `ResearchProvider`, and every downstream package — is provider-unaware today. This is an existing architectural constraint, not a new one being introduced by this decision.

**Choice A — Confirm provider-neutral placement (the only architecturally supported choice):** Any new input/output field is added at the shared `schema.ts`/`provider.ts` layer; `prompt.ts` renders it uniformly for all three providers; no provider-specific adapter code is touched.

**Choice B — Provider-specific implementation (e.g., only in the Anthropic adapter):** Not supported by the existing architecture without breaking the OpenAI/Gemini configurations, and not proposed by any Path 2 document. Listed here only because the task requires this constraint to be explicitly confirmed, not assumed.

**Implementation consequence:** Choice A carries no consequence beyond adherence to the existing pattern — it is effectively the only viable choice given the current architecture, but the record still surfaces it explicitly per instruction rather than treating it as silently settled. Choice B would require a documented, separate justification for deviating from the existing provider-neutral constraint, which no upstream document provides.

This decision does not modify any provider implementation. It confirms a constraint, it does not authorize provider work.

**Decision:**
PRODUCT OWNER DECISION REQUIRED (confirmation, not a design choice — but stated explicitly per instruction, not assumed)

---

### D10 — UI

**Question:** Is the category-plausibility result shown to the participant; if so, what evidence must be visible; and is UI work in MVP scope or deferred?

**Repository evidence:** No UI files were inspected by any prior Path 2 document — explicitly out of scope in each. No document establishes whether this capability should be user-visible at all. If shown, the underlying `Observation` shape (`value`/`classification`/`confidence`/`evidence[]`) maps directly onto whatever pattern already renders other Research signals elsewhere in the product — a technical observation about feasibility, not a decision that visibility should happen.

**Choice A — Not exposed in UI (backend-only):** The result exists solely to inform Qualification (per D4) or for internal review; no frontend work is required.

**Choice B — Exposed via the existing Research-signal display pattern:** Reuses whatever component/pattern already displays other `LeadResearch` fields; minimal new UI code, contingent on such a pattern existing and being extensible.

**Choice C — Exposed with new, purpose-built UI:** Displays the MATCH/MISMATCH/UNKNOWN result, matched segment (if D2 resolves to segment-level), supporting evidence quote/source, and a human-readable explanation for UNKNOWN. Requires new frontend design/implementation not scoped by any document.

**On MVP scope for UI work specifically:** Independent of D0 (whether the backend capability is MVP-required), the UI portion could be separately deferred even if the backend work proceeds — this is presented as an available choice, not a recommendation.

**Implementation consequence:**
- A: Zero frontend work.
- B: Frontend work is scoped by extending an existing pattern (pattern's existence/extensibility not verified in this or any Path 2 document).
- C: New frontend design and implementation work, sized only after D2/D3/D5's outputs are known (what exactly there is to display depends on those decisions — which are now locked, per §3 above).

**Decision:**
PRODUCT OWNER DECISION REQUIRED (visibility, evidence content, and MVP-vs-deferred timing are three sub-decisions)

---

### D11 — Validation

**Question:** What product-level questions must a future live validation answer to confirm this capability works as intended?

**Repository evidence:** No document defines acceptance criteria for a future live validation of this capability, beyond the generic chain `discovered candidate → research evidence → category determination → Qualification outcome (if gated) → participant review`. The most recent live-validation attempt (`DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md`, `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §3) produced 12 discovered candidates, 0 researched, because Research failed with `HTTP 400 "Your credit balance is too low to access the Anthropic API"` before any candidate reached Research. **This blocker is confirmed unrelated to, and unresolved by, any decision in this record** — a future validation requires a funded Anthropic (or configured OpenAI/Gemini) account regardless of which choices are made above.

**Candidate technical validation questions** (not adopted, listed for the Product Owner to select from or amend):
- Does participant `targetCustomer` reach Research without loss, via whichever contract D8 authorizes?
- Does Research produce a category-plausibility result using the semantic model D1/D2/D3 now lock?
- Is evidence/provenance valid (`verifyProvenance()` passes for `OBSERVED` claims)?
- Does the result persist correctly and remain attributable to the correct Search context, per D6?
- Does Qualification consume the result as D4/D5 now lock?

**Candidate product/participant validation questions** (not adopted):
- Does the discovered business actually belong to one of the participant's target segments, as judged by a human reviewer?
- Would the participant consider the business a legitimate target, independent of the system's MATCH/MISMATCH/UNKNOWN label?
- Does the capability visibly reduce the proportion of category-mismatched businesses reaching the participant, relative to the 8-of-12 mismatch rate observed in the one prior live search?

**Implementation consequence:** These questions inform test design and a future validation run but do not themselves constitute a validation — no validation is run by this record, and none is authorized by it.

**Decision:**
PRODUCT OWNER DECISION REQUIRED (which of the above questions, or others, constitute the accepted validation criteria)

---

## 4. Locked D0–D6 Decision Set

Concise summary of every decision locked in §3, for quick reference. This section restates, and does not alter, the fuller text above.

```text
D0  MVP STATUS:                CATEGORY PLAUSIBILITY IS AN MVP ENHANCEMENT
                                (does not reopen the 19-criterion engineering exit)

D1  OUTPUT LOCATION:           DEDICATED SEARCH + PROSPECT CATEGORY-PLAUSIBILITY
                                DETERMINATION (not a Prospect-global value; not
                                LeadResearch.targetCustomers; not routed through R-71)

D2  MULTI-SEGMENT SEMANTICS:   DETERMINISTIC SEGMENT PARSING + ANY-MATCH (OR) SEMANTICS
                                MATCH    = at least one segment sufficiently evidenced
                                MISMATCH = evidence excludes every supplied segment
                                UNKNOWN  = evidence insufficient for any segment

D3  EVIDENCE SUFFICIENCY:      FIRST-PARTY WEBSITE EVIDENCE PRIMARY; SEARCH-DERIVED
                                BUSINESS METADATA SUPPORTING; WEAK/GENERIC SIGNALS
                                INSUFFICIENT ALONE; UNKNOWN ON INSUFFICIENT EVIDENCE

D4  QUALIFICATION CONSUMPTION: Q1 — NEW, DISTINCT QUALIFICATION CRITERION
                                (not routed through R-71 Need Detection / offer signals)

D5  STATE BEHAVIOR:            MATCH    -> criterion passes; normal Qualification flow
                                MISMATCH -> criterion fails; candidate does NOT qualify;
                                            Opportunity creation NOT blocked
                                UNKNOWN  -> criterion fails/holds; candidate does NOT
                                            qualify on UNKNOWN; no new Opportunity state

D6  PERSISTENCE & ATTRIBUTION: PER SEARCH + PROSPECT; HISTORICAL ATTRIBUTION PRESERVED;
                                CROSS-SEARCH OVERWRITE NOT ALLOWED; QUALIFICATION READS
                                THE CURRENT SEARCH + PROSPECT DETERMINATION
                                (DECIDED separately/earlier — unchanged by this update)
```

Separation preserved by the full locked set:
```text
Discovery remains broad.
Research establishes category-plausibility evidence.
Qualification consumes the determination.
Opportunity creation remains unchanged.
Scoring/ranking remain unchanged.
```

---

## 5. Decision Dependencies

```text
D0  (MVP status — DECIDED: MVP enhancement)
     ↓
D1  (output contract shape — DECIDED: dedicated Search+Prospect determination)  ⇄  D2 (multi-segment semantics — DECIDED: deterministic parsing + ANY)
     ↓
D8  (input contract — coupled to D2's parsing choice; independent of D1) — OPEN
     ↓
D3  (evidence sufficiency — DECIDED: first-party primary, supporting metadata, UNKNOWN on insufficiency)
     ↓
D4  (Qualification integration mode — DECIDED: Q1, new criterion)
     ↓
D5  (state behavior — DECIDED: MATCH passes / MISMATCH fails qualification, does not block Opportunity creation / UNKNOWN fails-or-holds)
     ↓
D6  (persistence scope & historical attribution — DECIDED: per Search + Prospect, per §3)
     ↓
D7  (FIELD_KIND — depends on D1's chosen persistence path and D6) — OPEN
     ↓
D9  (provider neutrality — confirmable independently and in parallel with the above; constrains D1/D8's implementation but not their content) — OPEN
     ↓
D10 (UI — depends on knowing the final contract/shape from D1/D2 and the gating behavior from D4/D5, all now locked; the UI decision itself remains open) — OPEN
     ↓
D11 (validation criteria — depends on all of the above being fixed) — OPEN
```

D9 is a standing architectural constraint, not sequential — it can and should be confirmed at any point without blocking other decisions, but is listed in sequence here because it must be reconfirmed at the point D1/D8 are implemented.

---

## 6. Minimum Decisions Required Before Implementation Authorization

The following were the original hard blockers. D0–D6 are now product-decided (§3) and are removed from this blocking list on that basis only — **this does not mean implementation is authorized or complete.** Sizing, naming, and mechanical design details for each remain open implementation-scope work (see §9, §10).

- **D0** — DECIDED (MVP enhancement). No longer a blocker on the scheduling question.
- **D1** — DECIDED (dedicated Search + Prospect determination). No longer a blocker on the output-location question; exact schema/table/repository design remains implementation-scope work.
- **D2** — DECIDED (deterministic parsing + ANY-match). No longer a blocker on the semantics question; exact parsing rule/splitting logic remains implementation-scope work.
- **D3** — DECIDED (first-party primary, UNKNOWN on insufficiency). No longer a blocker on the evidentiary-bar question; exact prompt/schema encoding remains implementation-scope work.
- **D4** — DECIDED (Q1, new Qualification criterion). No longer a blocker on whether Qualification should be touched; exact criterion name/rule/wiring remains implementation-scope work.
- **D5** — DECIDED (MATCH passes; MISMATCH fails Qualification but does not block Opportunity creation; UNKNOWN fails/holds). No longer a blocker; exact state/reason encoding remains implementation-scope work.
- **D6** — DECIDED (§3: per Search + Prospect storage scope, historical attribution preserved, cross-search overwrite not allowed). Remaining implementation-sizing work (exact persistence-key mechanics) is deferred to the implementation task once authorized — no schema/repository/code change is made by that decision.
- **D8** — **Still a hard blocker.** The input contract must be fixed before `ResearchProviderInput`/`ResearchInput`/the worker call site can be touched. Not addressed by this update.

**Not a hard blocker on its own, but must be resolved before the corresponding code is written:** D7 (can be deferred to immediately before the Research-output work lands, since it only concerns a persistence-metadata field, not the primary contract).

**Implementation authorization itself remains ungranted regardless of how many of D0–D6 are now decided.** See §8.

---

## 7. Decisions That May Be Deferred

Presented as legitimately deferrable without creating an ambiguous implementation contract for the decisions in §6 — not assumed to be deferred:

- **D9 (provider-neutrality confirmation)** — this is a standing constraint already enforced by the existing architecture (`researchModelFactory.ts`); it does not require a fresh Product Owner decision so much as an acknowledgment, and can be reconfirmed at implementation time without blocking earlier scoping work.
- **D10 (UI)** — the backend capability (Research produces and persists a result; Qualification optionally consumes it) can be fully implemented and validated technically without any UI decision; UI can be decided and built in a later, separate phase without reopening D1–D8.
- **D11 (validation criteria)** — by definition, this only needs to be finalized once there is something to validate; it does not block scoping or building the capability itself, only the eventual live-validation task.
- **D7 (`FIELD_KIND` inclusion/exclusion)** — confirmed to have zero live-scoring consequence today (the `acq_lead_research`/`core-acquisition` scorer path is inactive); a placeholder choice (e.g., defaulting to omit, accepting `'WEBSITE'`) could be made now and revisited later without changing live behavior, though prior documents note this is less accurate, not incorrect.

---

## 8. Explicit Non-Goals

Confirmed and preserved from every governing Path 2 document; not reopened by this record:

- No Discovery changes — query construction, category filtering, or the Google Places provider.
- No R-71 changes — `TOPICAL_FIELDS`, `suggestOffers()`, `toOfferSignals()` remain untouched; R-70 likewise untouched.
- No scoring changes — `scoreOpportunity`/`scoreOpportunityForOwner`, `FACTOR_WEIGHTS`, `OpportunityScore` remain untouched.
- No ranking changes — `rankOpportunities` remains untouched.
- No provider-specific implementation — no change to `anthropicModel.ts`, `openAIModel.ts`, or `geminiModel.ts` individually; any change lives in the shared `schema.ts`/`provider.ts` contract layer.
- No unrelated acquisition/outreach work — Outreach, CRM, and follow-up remain out of scope.

---

## 9. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION

NOT GRANTED
```

The decisions in §3/§4 establish product scope and behavior only. They do not authorize production implementation. No production code, test code, PRD content, configuration, database schema/migration, or provider implementation is created or modified by this document or by the Product Owner decisions it records. A separate, explicit implementation-authorization step — naming which decisions were resolved and how, and covering the still-open D7–D11 items — is required before any such work begins.

---

## 10. Locked-for-Future-Implementation Boundary

The following are now product-decided (per §3/§4) and bound any future implementation task, but none of them is itself implemented, scheduled, or authorized by this document:

```text
LOCKED FOR FUTURE IMPLEMENTATION:
- Research-level category plausibility
- Search + Prospect attribution
- deterministic multi-segment parsing
- ANY-match semantics
- first-party evidence as primary sufficiency bar
- UNKNOWN on insufficient evidence
- dedicated Qualification criterion
- MATCH passes the category criterion
- MISMATCH fails qualification but does not block Opportunity creation
- UNKNOWN fails/holds the category criterion
- R-71 unchanged
- scoring/ranking unchanged
- Discovery remains broad
- Opportunity creation/state machine unchanged
```

**What remains unresolved** (not converted into Product Owner decisions by this update — still open per D7–D11 and per the implementation-scope gaps noted throughout §3):

```text
- exact schema/table implementation (D1's dedicated Search + Prospect entity — no
  table, migration, or repository interface is created by this document)
- exact field/criterion names (e.g., the illustrative "CATEGORY_PLAUSIBLE" criterion
  name and any persisted field name are not approved names)
- repository/API changes (QualificationDeps extension, new repository wiring)
- UI presentation (D10 — visibility, evidence content, MVP-vs-deferred timing)
- migration details (whether an actual Postgres migration is required — not
  confirmed against the live schema by any Path 2 document)
- test implementation (no tests are added, changed, or specified by this document)
- provider-specific prompt mechanics (exact prompt wording for Anthropic/OpenAI/
  Gemini, subject to the standing provider-neutrality constraint, D9)
- validation execution criteria not already locked (D11 — which technical/product
  questions constitute accepted validation criteria)
- Research input contract (D8 — still an open, hard blocker per §6)
- FIELD_KIND inclusion/exclusion for the new field (D7 — still open, deferrable)
```

These implementation details are not converted into Product Owner decisions by this document. They remain open, tracked here for visibility only.

---

## 11. Safety / Audit Record

```text
Production code changed:     0
Tests changed:                0
PRD changed:                   0
Configuration changed:         0
Database/migrations changed:   0
Provider code changed:         0
Live API calls:                0
Staged:                        none
Commit:                        none
Push:                          none

Starting HEAD:              5992b82b9adff492c480442d68a954f2a03bfb28
Ending HEAD:                5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Branch:                     phase-17-r34-worker-orchestration

File updated by this task:  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
                             (this file — D0-D5 locked decisions recorded alongside
                             the pre-existing D6 decision; no other section's
                             substantive meaning altered beyond what §3-§10 record)

Files explicitly NOT edited by this task:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md
  PRD (any version)
  any production code, test code, configuration, database/migration, or provider file

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, all prior requirement/*.md
documents, .claude/, and CLAUDE.md included):
  .claude/, CLAUDE.md, and the full pre-existing requirement/*.md set,
  including every governing Path 2 document and the decision packet consumed
  by this record.
```
