# D11 — Category Plausibility Validation Decision Preparation

## 1. Status

```text
PRODUCT OWNER DECISION REQUIRED

IMPLEMENTATION AUTHORIZATION: NOT GRANTED (unchanged — no D0-D10 authorization exists either)
```

This is a read-only, documentation/governance-only task. It prepares the decision required to define what evidence must exist before the Path 2 category-plausibility capability is declared **validated**. It does not run a validation, does not implement anything, and does not resolve D11. No production code, test, PRD, configuration, database/migration, provider, or worker file is created or modified by this document.

## 2. Purpose

D0–D10 fix *what* category plausibility is (a dedicated Search + Prospect determination, deterministically parsed, ANY-match, first-party-evidence-primary, a new Qualification criterion, MATCH/MISMATCH/UNKNOWN state behavior, Search-scoped attribution, provider-neutral, and — per D10 — surfaced on the Opportunity detail page). None of D0–D10 is implemented; every one of them carries `IMPLEMENTATION AUTHORIZATION: NOT GRANTED`.

D11 must fix a separate question: **once (and if) this capability is implemented, what has to be observed — technically and by a real participant — before the Product Owner can say "this works"?** This document surveys the repository's existing evidence (the one blocked live-validation attempt, the read-only Discovery audit that followed it, and the MVP real-user validation template) against the candidate validation questions D0–D10 already raised, and separates what the repository establishes from what remains a Product Owner judgment call. It does not select validation criteria; it prepares the choices.

## 3. Existing Evidence

Everything below is drawn directly from documents already in the repository; nothing is inferred beyond what those documents state.

**No implementation exists.** Every D0–D10 decision record ends with `IMPLEMENTATION AUTHORIZATION: NOT GRANTED`. A repository-wide review of this session's read files found no `FIELD_KIND`, schema, repository, Qualification criterion, or UI change for category plausibility — the capability described by D0–D10 does not exist in code today. **D11, therefore, is defining acceptance criteria for a future validation of a capability that has not yet been built**, not evaluating a completed one. This is a fact the task's own framing already anticipates ("what evidence should be required before declaring the category-plausibility enhancement validated") but it bears restating explicitly: no evidence gathered so far *could* validate the eventual implementation, because the eventual implementation does not yet exist.

**The one blocked live-validation attempt** (`requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md`, `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §3):

```text
Search ID:              b81ab156-edca-42e6-8b05-0c0f05bc0511
Businesses discovered:  12
Businesses researched:  0   (Anthropic HTTP 400 — insufficient credit balance, 3/3 attempts exhausted)
Opportunities created:  0
Qualification results:  0
Category-plausibility determinations: 0
Participant reviews:    0
```

This run demonstrates a real, observed failure mode (a funding/credit blocker preventing Research from executing at all) but produces **zero** data points relevant to whether category plausibility, once implemented, works — Research never ran, so no determination was ever attempted, correct or otherwise. Per the task's own framing, this blocked run must not be treated as evidence that a future Research-level implementation works or fails; it is evidence only that an unrelated operational blocker (Anthropic account funding) exists and must be resolved independently of every D0–D11 decision.

**The read-only Discovery audit's finding**, produced from the same blocked search using only persisted `name`/`normalized_domain` text (no Research ran, so no richer evidence existed to classify from): of 12 discovered candidates, 8 were confirmed mismatches by explicit self-description in the business name (e.g., "Web Development & Digital Marketing Agency"), 4 were ambiguous by name alone, and 0 were identifiable as belonging to any of the participant's three stated target segments (Restaurants/Cafes; Boutique Retailers & E-commerce Brands; Hotels/Resorts/Tour Operators). This is Discovery-stage evidence only — it says nothing about whether a future Research-level category-plausibility determination would classify these same 12 candidates correctly, since Research uses first-party website evidence (per D3), not name text alone.

**`requirement/MVP_REAL_USER_VALIDATION_TEMPLATE.md`** is a blank template — "No session has been run." Its structure: one copy per real participant/session; a "Service definition used" block; a "Search reviewed" block; a repeatable "Per-opportunity judgment" block whose **primary, exact-wording question is "Would you actually contact this business?"** (Yes/No), plus a useful/not-useful judgment and verbatim qualitative feedback; and a session-level notes section explicitly for unprompted trust/evidence/fabrication remarks (tied to `MVP_SCOPE_BOUNDARY.md` §9 Criterion 9). **The template contains no field today that asks the participant about category fit, target-segment match, or the MATCH/MISMATCH/UNKNOWN determination specifically** — it asks only the outcome-level contact question and a useful/not-useful judgment. Whether the template needs new fields to serve as D11's human-validation instrument, or whether the existing contact question is judged sufficient on its own, is not decided by any document and is addressed in §6 below.

**No other completed validation or audit document specific to Client Finder MVP category plausibility exists in `requirement/`** beyond the two named above. `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` and the recent scoring/web-surface commits (per this session's git log) concern Opportunity scoring and the web surface generally, not category plausibility, and are not consulted further here as out of this task's scope.

## 4. D11-A — Technical Correctness

**What must be demonstrated**, cross-checked against D0–D10's locked text (not assumed):

| Candidate technical check | Basis | Status |
|---|---|---|
| Participant `targetCustomer` reaches Research via whichever D8 mechanism is eventually built (Option B, non-binding — the exact candidate is still unselected) | D8 §13 | Legitimate — D8 fixes only the architectural *direction*, not a built mechanism; validation must confirm whatever gets built actually carries the value through, since D8 itself authorizes nothing |
| Deterministic segment parsing matches D2's requirement (structured segments, not raw-string passthrough) | D2 (Final Decision Record §3) | Legitimate — D2 explicitly does not authorize a specific parser; a future implementation's parsing rule must itself be validated against the compound-string examples already on record (e.g., the audited participant's three-segment string) |
| Search + Prospect attribution and historical preservation are correct (D1/D6) — a second Search with a different `targetCustomer` for the same Prospect must not overwrite the first Search's determination | D1, D6 | Legitimate — D6 is the most architecturally consequential locked decision (§9.1 of the D0–D5 preparation document flags this as the least-verified dependency) and deserves direct validation, not assumption |
| MATCH/MISMATCH/UNKNOWN aggregation follows D2's ANY/OR rule (MATCH if any segment is sufficiently evidenced; MISMATCH only if evidence excludes every segment; UNKNOWN if insufficient for all) | D2 | Legitimate |
| Evidence provenance is preserved and verifiable | D3; but see caveat below | Legitimate, **with an open implementation question already flagged upstream**, not newly discovered here: because D1's dedicated Search+Prospect entity is explicitly *not* a `LeadResearch` field/`ResearchSignal` row (D7, Candidate C), it does **not** automatically inherit `verifyProvenance()`'s generic, field-agnostic OBSERVED-claim checking the way every other Research field does (`PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md` §4.4: "would not automatically inherit `verifyProvenance()`/the retry-repair loop unless deliberately wired to reuse them"). **D11 validation must therefore explicitly confirm whatever provenance-checking mechanism the eventual implementation uses for this entity — it cannot assume the existing mechanism applies by default.** |
| UNKNOWN is produced when evidence is insufficient, rather than defaulting to MISMATCH | D3 | Legitimate — this is the working assumption D3 formally ratified; validation should specifically look for a case exercising this path, not only MATCH/MISMATCH |
| Fallback provider does not alter category-plausibility semantics | D9 §5 | Legitimate — D9 already specifies what a future validation should record when fallback fires (§9 of D9, reproduced in D11-F below) |
| D7 separation from `ResearchSignal`/`FIELD_KIND` is preserved (the determination never becomes a `StoredResearchSignal` row, never reaches `toOfferSignals()`/`suggestOffers()`) | D7 | Legitimate — and mechanically checkable by inspecting whatever persistence path is actually built, independent of any live Research run |

**Unresolved choices:**

```text
PRODUCT DECISION REQUIRED
```
- Whether all of the above are individually mandatory for D11 sign-off, or whether some (e.g., D7 separation, which is structurally guaranteed by D1's chosen persistence shape rather than behaviorally observable per-run) can be satisfied by code/architecture review alone rather than a live-run observation.
- Whether the `verifyProvenance()`-equivalent mechanism for D1's new entity must be built and validated as part of D11, or is properly a D1-implementation-scope question that D11 only checks the *outcome* of (i.e., are OBSERVED claims in the new entity actually quote-verified against source documents, regardless of which code path performs that check).

## 5. D11-B — End-to-End Validation

**Candidate pipeline:** Discovery → Research → category plausibility → Qualification → Opportunity → UI, per the task's own framing.

Cross-checked against D0–D10:

- **Discovery → Research**: mandatory. Category plausibility cannot be evaluated without a discovered candidate reaching Research (D1's determination is produced *by* Research).
- **Research → category plausibility determination persisted**: mandatory. This is the core capability under test.
- **→ Qualification**: mandatory per D4 (Q1, a new criterion) — otherwise the determination exists but its consumption (D4/D5's pass/fail/hold behavior) is unverified.
- **→ Opportunity**: per D5 (locked), Opportunity creation is **unconditional** and independent of the category-plausibility result — `createOpportunityForOwner` is not gated on it. This means Opportunity creation succeeding is not itself evidence that category plausibility is working; it would succeed identically whether the determination is MATCH, MISMATCH, or UNKNOWN, or even if the determination were never computed at all. Opportunity creation is a **necessary precondition for D10's UI display** (D10-A: Opportunity detail page only), not itself a validation target for category plausibility.
- **→ UI**: per D10 (locked, DECIDED), the determination is surfaced only on the Opportunity detail page, and only once the record exists (D10-H). Because the MVP real-user validation template's primary review mechanism is the participant looking at delivered Opportunities, a validation session that reaches a real participant will necessarily exercise the UI stage as a side effect of D10's own chosen placement — this is a structural consequence of D10, not a separate stage that must be independently scheduled.

**Which stages are mandatory for D11 validation:**

```text
PRODUCT DECISION REQUIRED
```

Two framings are both consistent with the repository evidence and neither is selected here:
- **Framing 1 — full pipeline required**: Discovery → Research → persisted determination → Qualification → (Opportunity, unconditionally) → UI must all be observed in at least one real run before D11 is satisfied, because D10 places the only planned surface for a human to see the result on the Opportunity detail page, and the MVP validation template's methodology is participant review of delivered Opportunities.
- **Framing 2 — backend-sufficient, UI deferred**: per the Final Decision Record §7's own note (preserved from D0–D9 planning, not overridden by D10's later lock): "the backend capability... can be fully implemented and validated technically without any UI decision." Under this framing, a technical validation (D11-A) could be satisfied without a real participant ever seeing the UI, with human validation (D11-C) treated as a separable, possibly later, gate.

D10 being now `DECIDED` (rather than open, as it was when the Final Decision Record's §7 note was written) narrows this choice somewhat — a built UI now exists in scope — but does not by itself resolve whether D11 requires exercising it.

## 6. D11-C — Human Participant Validation

**Should a real participant review the aggregate result, segment-level results, evidence, Qualification outcome, and Opportunity presence?**

`requirement/MVP_REAL_USER_VALIDATION_TEMPLATE.md` is the primary source, per the task instruction. As recorded in §3, its only structured judgment is the single primary question ("Would you actually contact this business?") plus a useful/not-useful rating and verbatim qualitative notes. It does not today ask the participant to evaluate the category-plausibility determination as its own artifact (aggregate MATCH/MISMATCH/UNKNOWN, segment breakdown, or evidence) — the template was authored before D0–D10 existed and is generic across all Opportunity review, not specific to this capability.

Two distinguishable questions, neither answered by any document:

1. **Is the existing "would you contact this business" question, by itself, sufficient evidence that category plausibility works?** A business the participant would contact is presumably a plausible target customer in the participant's own judgment, whether or not the system's own MATCH/MISMATCH/UNKNOWN label agrees — but the template's existing question does not ask the participant to react to the *system's* determination or evidence at all, only to the business itself. It would not, on its own, reveal a case where the system's label was wrong (e.g., a MISMATCH the participant would in fact have contacted, or a MATCH the participant would not have) unless the template is extended to elicit that comparison.
2. **Does D11 require the participant to see and react to the determination itself** (its label, its segment breakdown, its evidence) as recorded in D10's UI, and not just the underlying Opportunity? This would require either extending the template with new fields or relying on the "notable qualitative feedback" free-text field to capture any such reaction unprompted — the latter is unreliable as a designed validation mechanism, since it depends on the participant noticing and commenting on a UI element without being asked.

```text
PRODUCT DECISION REQUIRED
```

- Whether the template needs new, category-plausibility-specific fields (e.g., "did the system's MATCH/MISMATCH/UNKNOWN label match your own judgment?") — note that authoring or modifying the template is implementation-scope work not performed or authorized by this document.
- Whether human review of the Qualification outcome and Opportunity presence specifically (as opposed to the underlying business) is required, given D5 already fixes that MISMATCH does not block Opportunity creation — a participant could see and judge an Opportunity whose Qualification criterion failed, which may or may not be the intended validation signal.
- Whether examples of MATCH, MISMATCH, and UNKNOWN specifically must each reach a real participant (tied to D11-D below), or whether validating the mechanism on whatever mix of outcomes a real Search happens to produce is sufficient.

## 7. D11-D — Minimum Sample

No document in this repository establishes a statistical sample size for MVP real-user validation of any capability, category plausibility included. `MVP_REAL_USER_VALIDATION_TEMPLATE.md` itself specifies "one copy of this template = one real participant, one real session" but does not state how many copies constitute a closed validation gate for any capability, including the general Opportunity-review gate it already serves.

Per the task instruction, no sample size is invented here.

```text
PRODUCT DECISION REQUIRED
```

Candidate dimensions the Product Owner would need to fix, none selected or ranked:
- One real participant vs. multiple.
- One Search vs. multiple Searches (relevant because D6 specifically concerns behavior *across* Searches for the same Prospect — a single-Search validation session cannot exercise D6's cross-Search historical-attribution guarantee at all).
- One target-customer segment vs. multiple (relevant because D2's ANY-match semantics and per-segment breakdown are only meaningfully exercised by a compound `targetCustomer` value, such as the one already on record from the blocked validation attempt).
- Whether validation requires observing at least one MATCH, one MISMATCH, and one UNKNOWN outcome specifically (to prove the full state space functions), or whether validation is satisfied by whatever mix of outcomes one or more real Searches happen to produce.

## 8. D11-E — Evidence Quality

What must be observed about evidence, cross-checked against D3 (evidence sufficiency) and D10 (evidence presentation, already decided):

- **First-party source primacy**: per D3, a MATCH/MISMATCH determination must rest on first-party website evidence as the primary bar, with search-derived business metadata as supporting-only, never independently sufficient. Validation should confirm this hierarchy is respected in practice, not merely declared in the prompt/schema.
- **Quote, URL, confidence, basis**: per D10 §5, the UI reuses the existing evidence-item shape exactly (`{sourceUrl, sourceLabel, sourceQuote, confidence, basis}`) — validation should confirm these fields are populated and non-fabricated for OBSERVED claims (tied to D11-A's provenance-verification question).
- **First-party vs. supporting-evidence distinction is visible**: per D10 §5, this is a plain-text label, not a numeric tier — validation should confirm the distinction is actually rendered and matches D3's hierarchy for the specific evidence shown.
- **Provenance correctness**: whether OBSERVED claims cite real, verbatim quotes from actual source documents (the existing `verifyProvenance()` guarantee, if and only if D1's new entity is wired to use it — see D11-A's open question).

```text
PRODUCT DECISION REQUIRED
```
- Whether evidence quality must be independently checked by a technical reviewer (comparing a cited quote against the actual fetched source document) as part of D11, or whether passing the existing (or an equivalent) automated provenance check is sufficient without manual spot-checking.

## 9. D11-F — Provider Neutrality

D9 (locked, Option A — full provider neutrality including the existing fallback path) already specifies, in its own §9 ("Validation Implications"), what a future live validation should record without turning D11 into an artificial provider benchmark:

```text
- selected primary provider;
- whether fallback was invoked;
- actual provider that produced the Research result;
- category-plausibility state (MATCH/MISMATCH/UNKNOWN);
- evidence used;
- validation outcome;
- Search + Prospect attribution;
- Qualification result.
```

This directly answers the "how to establish provider neutrality without an artificial benchmark" question the task poses: D9 already anticipates that a real validation run will use whichever provider is actually configured (and whichever fallback naturally fires, if any) rather than requiring a designed, side-by-side multi-provider comparison. The existing fallback mechanism (`createFallbackResearchProvider`, per D9 §5) is treated as part of the same provider-neutral contract — a fallback execution during validation is not a confound to exclude, but an in-scope, expected part of the same live architecture.

**What D9 does not resolve, and D11 must still decide:**

```text
PRODUCT DECISION REQUIRED
```
- Whether D11 requires validating category plausibility under more than one configured provider at least once (e.g., running the same or an equivalent participant profile under both Anthropic and a fallback-triggering condition), or whether observing whichever provider a real validation run happens to use is sufficient, with cross-provider consistency treated as an architectural guarantee (per D9's constraints) rather than something D11 must separately re-prove empirically.
- Given D9 explicitly states "this document does not assert that Anthropic, OpenAI, and Gemini all currently satisfy these requirements for a category-plausibility field... this is recorded as an open verification item for a future implementation task, not a settled fact" — whether that per-provider capability verification (e.g., Gemini's `responseSchema` translation actually producing a contract-compliant category-plausibility shape) is itself part of D11, or a separate, earlier implementation-verification step that must pass before D11 can even begin.

## 10. D11-G — Regression Boundaries

Explicit unchanged boundaries, restated (not altered) from every D0–D10 document — a future D11 validation must positively confirm these remain true after implementation, not merely assume they do because no document authorized changing them:

```text
R-71:                  TOPICAL_FIELDS / suggestOffers() / toOfferSignals() unchanged;
                        category plausibility never added to TOPICAL_FIELDS; never
                        routed through Need Detection (D4, D7, D9 §10)

Scoring / Ranking:      scoreOpportunity / scoreOpportunityForOwner / FACTOR_WEIGHTS /
                        OpportunityScore / rankOpportunities unchanged; category
                        plausibility is never a score or rank input (D7 §6, D10 §8)

Discovery:              query construction, provider contract, category filtering
                        unchanged; targetCustomer continues reaching Discovery exactly
                        as today (D8 §2, D9 §10)

Opportunity creation:   createOpportunityForOwner remains unconditional; MISMATCH does
                        not block Opportunity creation (D5)

Opportunity state
machine:                no new Opportunity state introduced by MATCH, MISMATCH, or
                        UNKNOWN (D5, D10 §11 item 10)

Existing MVP exit
criteria:               the 19-criterion engineering exit (MVP_SCOPE_BOUNDARY.md §10)
                        remains satisfied; category plausibility is an MVP enhancement
                        that does not reopen it (D0)
```

**Unresolved:**

```text
PRODUCT DECISION REQUIRED
```
- Whether D11 requires a dedicated regression check against each boundary above (e.g., confirming `suggestOffers()`'s output is byte-identical before/after this capability ships for a fixed input) or whether passing existing, unmodified test suites for `core-opportunity`, `core-qualification`, and `core-discovery` is treated as sufficient regression evidence.

## 11. Proposed Validation Matrix

Factual matrix only — no scores or rankings assigned. "Existing evidence" reports only what this repository already contains; it does not imply sufficiency.

| Requirement | Evidence required | Existing evidence | Gap | Decision status |
|---|---|---|---|---|
| `targetCustomer` reaches Research (D8) | Trace/log confirming Search-scoped `targetCustomer` value is present in whatever mechanism D8's eventual candidate implements | None — D8 fixes direction only, non-binding, unimplemented | Full | PRODUCT DECISION REQUIRED (validation method) |
| Deterministic segment parsing correctness (D2) | Parsed segments match the participant's actual compound string (e.g., the 3-segment example already on record) | None — no parser exists | Full | PRODUCT DECISION REQUIRED |
| Search + Prospect attribution / historical preservation (D1, D6) | Two Searches, same Prospect, different `targetCustomer` → two distinct, non-overwriting determinations | None — D6 is decided but unimplemented; no cross-Search run has ever occurred (only one Search has been run, ever, per §3) | Full | PRODUCT DECISION REQUIRED |
| MATCH/MISMATCH/UNKNOWN aggregation correctness (D2) | At least one case each of MATCH, MISMATCH, UNKNOWN, correctly aggregated from segment-level results | None | Full | PRODUCT DECISION REQUIRED (tied to D11-D sample question) |
| Evidence provenance verified for the new entity (D3, D7) | Confirmation that OBSERVED claims in D1's entity are quote-verified against real source documents | None; upstream documents flag this as NOT automatically inherited from `verifyProvenance()` (§4 above) | Full, and mechanism itself undesigned | PRODUCT DECISION REQUIRED |
| UNKNOWN on insufficient evidence, never a default MISMATCH (D3) | At least one observed UNKNOWN case with recorded insufficiency reasoning | None | Full | PRODUCT DECISION REQUIRED |
| Fallback provider invariance (D9) | A run (or a deliberately induced condition) where fallback fires, with identical semantic contract preserved | None; D9 §9 defines what to record, not yet exercised | Full | PRODUCT DECISION REQUIRED (whether to force a fallback condition or wait for a natural one) |
| D7 separation preserved (never a `ResearchSignal`/`FIELD_KIND` row) | Code/architecture confirmation the entity never reaches `toNewResearchSignals()`/`toOfferSignals()` | D7 is structurally guaranteed by D1's chosen shape (not a runtime risk) per D7 §6-§8 | Verification method only | PRODUCT DECISION REQUIRED (review vs. runtime check) |
| Qualification criterion behavior (D4, D5) | MATCH passes; MISMATCH fails without blocking Opportunity creation; UNKNOWN fails/holds — each observed at least once | None | Full | PRODUCT DECISION REQUIRED |
| UI display correctness (D10) | Aggregate + segment results, evidence, Search context, and timestamp render on the Opportunity detail page per D10 §3-§7 | None — D10 decided, not built | Full | PRODUCT DECISION REQUIRED (whether in scope for D11 at all — §5 above) |
| Human participant primary-question review | A real, anonymized participant answers "Would you actually contact this business?" for Opportunities the capability affected | `MVP_REAL_USER_VALIDATION_TEMPLATE.md` exists but is blank; no session run; template does not currently ask about the determination itself | Full, plus a possible template-content gap | PRODUCT DECISION REQUIRED (§6 above) |
| Minimum sample size | Some fixed number of participants / Searches / segments / outcome types | None — no document establishes one | Full | PRODUCT DECISION REQUIRED (§7 above; explicitly not invented here) |
| Evidence quality (first-party primacy, quote/URL/confidence/basis) | Evidence items observed match D3's hierarchy and D10's presentation shape | None | Full | PRODUCT DECISION REQUIRED |
| Provider neutrality (D9) | Contract identical across whichever provider(s) a validation run actually exercises; D9 §9's fields recorded | None; D9 explicitly flags per-provider capability (e.g., Gemini schema translation) as unverified | Full | PRODUCT DECISION REQUIRED (§9 above) |
| Regression: R-71, scoring/ranking, Discovery, Opportunity creation/state machine, 19-criterion MVP exit | Confirmation each remains byte-for-byte/behaviorally unchanged | Every D-document states these are unchanged by *decision*; none has been re-verified against actual code because no implementation exists yet | Full (post-implementation only) | PRODUCT DECISION REQUIRED (regression-check method — §10 above) |

## 12. Product Decisions Required

Every item below is `PRODUCT DECISION REQUIRED`; none is resolved by this document:

1. Which D11-A technical-correctness items are individually mandatory vs. satisfiable by architecture/code review alone (§4).
2. Whether the `verifyProvenance()`-equivalent mechanism for D1's new entity is itself in D11's scope, or only its outcome (§4).
3. Which pipeline stages are mandatory for D11 sign-off — full pipeline including UI, or backend-sufficient with UI deferred (§5).
4. Whether `MVP_REAL_USER_VALIDATION_TEMPLATE.md` needs new, category-plausibility-specific fields, or whether the existing primary question is sufficient evidence on its own (§6).
5. Whether human review must specifically cover the Qualification outcome and Opportunity presence for a MISMATCH/UNKNOWN case, given D5 already permits an Opportunity to exist despite a failed category-plausibility criterion (§6).
6. Whether examples of MATCH, MISMATCH, and UNKNOWN must each specifically reach a real participant, or whether whatever mix a real Search produces is sufficient (§6, §7).
7. Minimum sample size across participants, Searches, target-customer segments, and prospects — explicitly not invented by this document (§7).
8. Whether evidence quality requires independent manual spot-checking against source documents, or automated/existing provenance checking is sufficient (§8).
9. Whether D11 requires deliberately exercising more than one provider (including a forced-fallback condition), or observing whichever provider a real run naturally uses is sufficient (§9).
10. Whether per-provider structured-output capability (e.g., Gemini's schema translation for this new shape) must be verified before or as part of D11 (§9).
11. Whether regression boundaries (R-71, scoring/ranking, Discovery, Opportunity creation/state machine, the 19-criterion MVP exit) require a dedicated comparison check or are satisfied by existing, unmodified test suites passing (§10).
12. Whether the Anthropic account funding blocker (or equivalent for whichever provider is used) must be resolved and documented as a precondition to scheduling any D11 validation session, given it is what prevented the only real-world attempt to date from producing any relevant data (§3).

## 13. Dependency on D0–D10

```text
D0–D10 ARE LOCKED.
D11 DEFINES VALIDATION CRITERIA ONLY.
```

This document does not reopen, reinterpret, or alter any decision recorded in D0 (MVP enhancement status), D1 (dedicated Search+Prospect determination), D2 (deterministic parsing + ANY-match), D3 (evidence sufficiency), D4 (Q1 new Qualification criterion), D5 (MATCH/MISMATCH/UNKNOWN state behavior), D6 (per Search+Prospect persistence, historical attribution preserved), D7 (outside FIELD_KIND/ResearchSignal), D8 (Option B, non-binding input-contract direction), D9 (full provider neutrality including fallback), or D10 (Opportunity-detail-only UI, aggregate + segment display). Every validation question raised above presupposes those decisions exactly as locked and asks only what must be *observed* to confirm an eventual implementation actually honors them.

## 14. Implementation Authorization

```text
NOT AUTHORIZED
```

This document authorizes no implementation of D1–D10's still-unbuilt mechanisms, no test code, no schema, no UI, no live validation session, and no live API call. It also does not authorize modifying `MVP_REAL_USER_VALIDATION_TEMPLATE.md`, even though §6/§12 identify a possible content gap in it — any such change is separate, unauthorized implementation-scope work.

## 15. Repository Safety

```text
Branch:                      phase-17-r34-worker-orchestration

Starting HEAD (git rev-parse HEAD, confirmed at task start): 5992b82b9adff492c480442d68a954f2a03bfb28
Expected HEAD per task instructions:                          5992b82b9adff492c480442d68a954f2a03bfb28
Match:                                                         CONFIRMED

Production code changed:      0
Tests changed:                 0
PRD changed:                    0
Configuration changed:           0
Database/migrations changed:      0
Provider code changed:              0
Worker code changed:                 0
Discovery code changed:               0
Research code changed:                 0
Qualification code changed:             0
Opportunity code changed:                0
Live API calls:                           0
Staged:                                      none
Commit:                                       none
Push:                                          none

File created by this task (the only file changed):
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D11_DECISION_PREPARATION.md

Files read for this task, not modified:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md
  requirement/MVP_REAL_USER_VALIDATION_TEMPLATE.md
  requirement/DISCOVERY_QUERY_CATEGORY_MISMATCH_AUDIT.md
  requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, .claude/, CLAUDE.md, and the
full pre-existing requirement/*.md set included).
```

## STOP

D11 remains `PRODUCT OWNER DECISION REQUIRED`. This document prepares evidence and unresolved choices only; it does not select validation criteria, does not run a validation, and does not implement anything. D0–D10 are unchanged. This task ends with the D11 preparation document created as above and repository safety verified.
