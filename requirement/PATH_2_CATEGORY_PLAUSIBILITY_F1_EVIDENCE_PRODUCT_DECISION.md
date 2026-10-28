# Path 2 — Category Plausibility

## F-1 Evidence Semantics — Product Decision

### 1. Status

```text
F-1 STATUS: DECIDED
SELECTED APPROACH: OPTION A — EXTEND THE SEGMENT RESULT
D0–D11 IMMUTABLE
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This is a governance record. It resolves F-1 only: the six open questions in
`PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION_PREPARATION.md` §13.
It locks an implementation contract for a **future, separately authorized**
implementation.

It modifies no code, test, schema, migration, provider, worker, UI, PRD,
configuration, D11-H record, or existing governance document. It makes no live call.

---

### 2. Baseline

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28   (matches expected)
Staged .................... none
git status --short ........ 102 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
```

This is identical to the end state of the F-1 decision-preparation task.
Hashes of all 54 untracked files were stored outside the repository for the
§21 comparison.

---

### 3. Decision Authority

These decisions are recorded as the Product Owner's resolution of F-1. The
Product Owner directed, in this session, that F-1's six sub-decisions be
resolved and recorded. Claude records them; the Product Owner holds the
authority.

This document stays inside the space the preparation document defined. It
does not amend any D0–D11 text. Where it gives meaning to a D10/D11 term
(`confidence`, `basis`, "classification") **for category-plausibility
segments only**, it says so explicitly (§6–§9). It does not silently
reinterpret D10 or D11, and it leaves those terms' existing ResearchSignal
meanings unchanged.

---

### 4. F-1 Problem Statement

D10-C, D10 §5, D10 Implementation Constraint 4, and D11 §6.3 require that each
segment's evidence expose URL, label, quote, **confidence**, and **basis**.
D11 §6.3 further requires confidence and basis to be "consistent with the
claim's classification (OBSERVED vs. INFERRED)".

The current implementation never produces, validates, persists, or renders
`confidence` or `basis` for segments, and segments carry no classification.
D11 §6.3 therefore cannot be satisfied. See the Gate Audit §10 and the
Preparation §7.

---

### 5. Existing Implementation Facts

These are relied on, not changed. The source was verified in the preparation task and not re-read beyond the terminology checks.

- **Model output per segment** (`schema.ts` `categorySegmentSchema`): `{fit, rationale, evidence[{quote, sourceUrl, sourceLabel}]}`.
  - UNKNOWN currently forces `rationale = null` and `evidence = []`.
  - MATCH/MISMATCH require a rationale and at least one piece of evidence.
- **Verification** (`categoryPlausibility.ts` `verifyCategoryPlausibility`):
  - When the response is non-empty, the entry count must equal the segment count.
  - The cited URL must be one of the supplied source documents.
  - The quote must appear verbatim and meet a minimum length.
  - An **empty** array is accepted, and `toSegmentDeterminations` fills UNKNOWN for every segment.
- **Persistence:** `category_plausibility_determinations.segment_results` (JSONB). Rows are keyed by `(search_id, prospect_id)`, with supersede-then-insert.
- **UI:** the D10 section renders fit, rationale, and evidence. It renders no confidence or basis.
- **Existing ResearchSignal semantics** (outside F-1's reach):
  - `confidence` is a raw 0–100 value; INFERRED is capped at 80 and UNKNOWN is 0.
  - `basis` is the "INFERRED's reasoning trail. Null for OBSERVED/UNKNOWN."
  - Both are claim-level fields.
- **Governance check:** no locked D0–D11 document requires UNKNOWN's `rationale` to be null. That rule is an implementation choice, confirmed by a governance grep in this task.

---

### 6. F1-A Decision — Confidence

**Decided:** each segment result carries its own `confidence`. It uses the existing 0–100 integer representation but has a **category-plausibility-specific meaning**.

- **Meaning:** how strongly the verbatim-verified evidence cited for this segment supports the recorded outcome (MATCH or MISMATCH) for this specific segment. It is not a probability. It is not the research-wide `LeadResearch.confidence`, and it is not any Observation's confidence.
- **Allowed values:**
  - MATCH / MISMATCH: integer **1–100**.
  - UNKNOWN: exactly **0**.
- **Source:**
  - For every model-returned entry, the **model produces** it.
  - For a code-filled entry (F1-E, `NO_MODEL_VERDICT`), code sets it to **0**.
- **Validated:** yes (§14).
- **Effect on the outcome:** **none.** D2's aggregation and D4/D5's Qualification read only `fit` and `aggregateResult`. No threshold is applied, and a low-confidence MATCH is still MATCH.
- **Display:** rendered on the Opportunity detail page for MATCH/MISMATCH and suppressed for UNKNOWN, following D10 §5 and the existing line-141 convention. Participant exposure is governed by the unchanged D11-C/D11-H methodology: the determination is not shown to the participant before they answer.
- **ResearchSignal confidence semantics:** unchanged. The INFERRED ≤ 80 cap does **not** apply, because segments are never INFERRED (F1-D).

---

### 7. F1-B Decision — Basis

**Decided:** for category-plausibility segments, `basis` is a **deterministic, code-assigned** statement of *what kind of grounds the outcome rests on*. It does not inherit the ResearchSignal meaning ("INFERRED's reasoning trail"). The model never produces it, and the model output schema does not accept it.

Allowed values:

| `basis` | Assigned when | Meaning |
|---|---|---|
| `CITED_SOURCE_EVIDENCE` | outcome is MATCH or MISMATCH | The outcome rests on ≥1 quote that passed verbatim verification against a supplied source document |
| `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` | the model returned an entry for this segment with outcome UNKNOWN | The model assessed the supplied evidence and reported it insufficient for this segment |
| `NO_MODEL_VERDICT` | code filled UNKNOWN because the model returned an empty `categoryPlausibility` array while ≥1 segment was supplied | No segment-level assessment was returned. This is **not** evidence of insufficiency |

How `quote`, `rationale` and `basis` differ:
- **`quote`** is the evidence itself: verbatim text copied from a supplied source document. It is model-produced and verified against the source.
- **`rationale`** is the model's explanation of *why* this segment received its outcome. It is model-produced free text (F1-C).
- **`basis`** says *what category of grounds* the outcome stands on. It is deterministic, closed-vocabulary, and assigned by code from verifiable facts: which outcome, and whether the model returned an entry.

Because `basis` is assigned by code from verified conditions, it is always consistent with the segment's classification (F1-D). ResearchSignal `basis` semantics are unchanged.

---

### 8. F1-C Decision — Relationship Between Basis and Rationale

**Decided:** `basis` and `rationale` are **distinct fields with distinct meanings** (§7). Neither is the canonical replacement for the other.

- `rationale` keeps its current name and role for MATCH/MISMATCH. It is not renamed or removed.
- `basis` is added alongside it.
- `rationale` is **extended to UNKNOWN** when the model returns an entry (F1-E), so a model-reported UNKNOWN carries its insufficiency reasoning.
- A code-filled `NO_MODEL_VERDICT` entry has `rationale = null`, because no model reasoning exists and none may be fabricated.

---

### 9. F1-D Decision — Classification

**Decided:** each segment result carries an explicit `classification`. It is **deterministic and code-assigned**, never produced by the model. Its only purpose is to make D11 §6.3's consistency check possible.

| Outcome | `classification` |
|---|---|
| MATCH / MISMATCH | `OBSERVED`: every MATCH/MISMATCH already structurally requires verbatim-verified cited evidence, which is exactly the OBSERVED obligation |
| UNKNOWN (either basis) | `UNKNOWN` |

- **`INFERRED` is not permitted for segments.** An INFERRED MATCH/MISMATCH would be an outcome without cited evidence. D3 and the current schema route that case to UNKNOWN, so allowing INFERRED would conflict with D3's evidence-sufficiency rules.
- **Persisted:** yes, in `segment_results`, so a validator can check it against confidence and basis in the stored row.
- **Displayed:** no. The segment's literal outcome already occupies that position under D10-B/D-E/D-F. D10 does not list classification among the rendered fields, and it is not added.
- **Not an evidence tier:** this is not a first-party/supporting tier. D10-C's "label only" rule is untouched.
- **Separation from ResearchSignal:** respected. Classification is a field inside the D1 entity's JSONB. It never becomes a `ResearchSignal`, never enters `allObservations()`/`FIELD_KIND`, and never reaches `toOfferSignals()`/`suggestOffers()` (D1/D7).

---

### 10. F1-E Decision — UNKNOWN Requirements

**Decided:** UNKNOWN must be recorded so that the following cases stay distinguishable. The UNKNOWN outcome itself and D3 (insufficient evidence never becomes MISMATCH) are unchanged.

| Case | Representation |
|---|---|
| Genuine insufficient evidence (the model returned UNKNOWN for the segment) | `basis = MODEL_REPORTED_INSUFFICIENT_EVIDENCE`; **`rationale` required** (1–400 characters, stating what evidence was absent or insufficient for this segment; it must not assert MATCH/MISMATCH); `evidence = []`; `confidence = 0` |
| Evidence that failed verification and was downgraded to UNKNOWN in repair | Recorded as the row above. The final outcome rests on no verifiable evidence, which is genuinely insufficient *verifiable* evidence. The model's rationale carries the reasoning |
| Empty/omitted model response (empty array with ≥1 segment) | `basis = NO_MODEL_VERDICT`; `rationale = null`; `evidence = []`; `confidence = 0`. **Does not count** as a D11 "genuinely insufficient evidence" case |
| Missing determination | No row, as today. The Qualification reason stays "no category-plausibility determination exists yet…" |
| Research failed (repair or provider exhausted) | No row, as today |
| Zero parsed segments | `segment_results = []`, aggregate UNKNOWN, as today. There is nothing per segment to record |

- UNKNOWN still requires **no evidence** (`evidence = []`).
- The accepted-empty-array behavior is kept. It is not turned into a failure, but it is now explicitly labelled `NO_MODEL_VERDICT`.
- **D11 compatibility:** an UNKNOWN with `basis = MODEL_REPORTED_INSUFFICIENT_EVIDENCE` and a recorded `rationale` satisfies D11 §3.5 / §4.6's "recorded insufficiency reasoning" at system level. The facilitator's genuineness judgment (D11-H §9) is unchanged.

---

### 11. F1-F Decision — Persistence / Backward Compatibility

**Decided:**

1. **Optional for legacy rows:** yes. A legacy row is any determination row whose segment objects lack `basis`. The read type must tolerate missing `confidence`, `basis`, and `classification`. Rows written after implementation must always carry all three.
2. **Legacy rendering:** legacy rows render with the fields that exist. Absent confidence/basis are simply not rendered. No placeholder value is shown, and nothing is fabricated.
3. **Backfill:** **none.** Confidence and model reasoning cannot be reconstructed after the fact, and inventing them would be fabrication. No migration or backfill is authorized or required. `segment_results` is JSONB and needs no DDL.
4. **Qualification:** unaffected. Legacy rows continue to drive `CATEGORY_PLAUSIBLE` through `aggregateResult`, exactly as today (D4/D5 unchanged).
5. **D11 validation validity:** **only determinations created after the F-1 implementation, with complete fields, are validation-valid.** Legacy rows may not be used to satisfy any D11 coverage item, evidence check, or spot-check. No live determination has ever been recorded, so this excludes only development/test data.

---

### 12. Selected Implementation Approach

```text
SELECTED: OPTION A — EXTEND THE SEGMENT RESULT
```

Model-produced additions are `confidence`, plus `rationale` for UNKNOWN. Code-assigned additions are `basis` and `classification`. This stays within Option A: it extends the segment result. It is not a fourth architecture.

Options B and C were not selected. The preparation document (§10) established that:
- B cannot produce `confidence` without inventing a value.
- C1 violates D1/D7.
- C2's Observation rules conflict with `fit`.

How Option A preserves each boundary:
- **D1/D7 separation:** every new field lives inside `segment_results` of the dedicated `category_plausibility_determinations` entity. Nothing is written to `research_signals`, `allObservations()`, `FIELD_KIND`, or the offer path.
- **D9 provider neutrality:** model-produced additions are defined once in the shared Zod schema and prompt. Each adapter's structured-output schema is derived from that single definition. Code-assigned fields are set after validation in shared, provider-agnostic code. No adapter or provider-branching change.
- **Search/Prospect attribution (D6):** `search_id`/`prospect_id` columns, supersession SQL, and current-row resolution are untouched. Only the JSONB contents change.
- **D10 UI:** it supplies exactly the fields D10-C, §5, and Constraint 4 require (URL, label, quote, confidence, basis) in the existing section. No layout change, no new route, no list-page change.
- **D11 validation:** it makes §6.3 checkable. Confidence and basis are populated, and a persisted classification allows the consistency check. It also makes §3.5's UNKNOWN reasoning recordable, and it keeps §6.1's verbatim-evidence guarantees unchanged.

---

### 13. Locked Evidence Contract

Per segment result, stored in `segment_results` JSONB and exposed on `SegmentDetermination`:

| Field | Source | MATCH | MISMATCH | UNKNOWN (model-reported) | UNKNOWN (`NO_MODEL_VERDICT`) | Legacy rows |
|---|---|---|---|---|---|---|
| `segment` | code (D2 parse) | required | required | required | required | present |
| outcome (existing field name `fit`, not renamed) | model | `MATCH` | `MISMATCH` | `UNKNOWN` | `UNKNOWN` (code) | present |
| `evidence[].quote` | model, verified | ≥1 entry required | ≥1 entry required | forbidden (`[]`) | forbidden (`[]`) | present |
| `evidence[].sourceUrl` | model, verified | required per entry | required per entry | — | — | present |
| `evidence[].sourceLabel` | model | required per entry | required per entry | — | — | present |
| `confidence` | model (code for NO_MODEL_VERDICT) | required, 1–100 | required, 1–100 | required, = 0 | = 0 | optional |
| `basis` | code | `CITED_SOURCE_EVIDENCE` | `CITED_SOURCE_EVIDENCE` | `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` | `NO_MODEL_VERDICT` | optional |
| `classification` | code | `OBSERVED` | `OBSERVED` | `UNKNOWN` | `UNKNOWN` | optional |
| `rationale` | model | required | required | **required** (insufficiency reasoning) | `null` | present (null for UNKNOWN) |

Evidence entries keep the existing `{quote, sourceUrl, sourceLabel}` shape, capped at 3 per segment. `confidence`, `basis`, and `classification` are **segment-level**. This matches the claim-level placement of the existing Evidence section (`page.tsx:132-156`), where one confidence/basis sits over a list of sources, and the Final Implementation Readiness Audit §8.1's conceptual contract.

---

### 14. Validation Rules

A segment record is valid only if all of the following hold. Unchanged rules are restated for completeness.

1. **Count/order (unchanged):** a non-empty response has exactly one entry per parsed segment, in order. Wrong length goes to repair. An empty array is accepted and code-filled as `NO_MODEL_VERDICT`.
2. **MATCH/MISMATCH:**
   - `rationale` non-null (1–400 characters);
   - evidence has 1–3 entries;
   - each `sourceUrl` is one of the supplied source documents;
   - each quote appears verbatim in that document and meets the existing minimum length;
   - `confidence` is an integer from 1 to 100.
   - Any missing or invalid item makes the result invalid and sends it to repair. A MATCH/MISMATCH with incomplete evidence fields can never pass.
3. **Model-returned UNKNOWN:**
   - `evidence = []`;
   - `confidence = 0`;
   - `rationale` non-null (1–400 characters).
   - A violation goes to repair.
4. **Model output must not contain `basis` or `classification`.** They are not part of the model-facing schema, and code assigns them after validation per §7/§9.
5. **Consistency (checkable on the stored row):**
   - `classification = OBSERVED` ⇔ outcome ∈ {MATCH, MISMATCH} ⇔ `basis = CITED_SOURCE_EVIDENCE` ⇔ `confidence ≥ 1`;
   - `classification = UNKNOWN` ⇔ outcome = UNKNOWN ⇔ `basis ∈ {MODEL_REPORTED_INSUFFICIENT_EVIDENCE, NO_MODEL_VERDICT}` ⇔ `confidence = 0`.
6. **Unchanged and not affected by these rules:**
   - aggregation (D2: any MATCH → MATCH; all MISMATCH → MISMATCH; otherwise UNKNOWN; [] → UNKNOWN);
   - Qualification mapping (D4/D5);
   - repair-loop mechanics.
   - Confidence never changes an outcome.

---

### 15. UI Requirements

For each segment in the existing D10 section of `opportunities/[id]/page.tsx`, the page renders:
- the segment text and literal outcome (as today);
- `rationale` when non-null (as today; now also for model-reported UNKNOWN);
- per evidence entry: `sourceLabel` as the link text to `sourceUrl`, followed by the quoted text (as today);
- **`confidence`** for MATCH/MISMATCH, suppressed for UNKNOWN (D10 §5, existing convention);
- **`basis`** as its literal value in plain text (mirroring D10-D/E/F's literal-label convention).

For legacy rows, absent confidence/basis are omitted.

`classification` is not rendered (§9). The aggregate, targetCustomer, and timestamp display stay unchanged.

This decision does not authorize:
- any layout redesign or new route;
- any list-page change;
- any first-party/supporting labelling change, which stays governed by D10-C/Constraint 5 as-is.

---

### 16. Provider-Neutrality Requirements

- Every provider (Anthropic, OpenAI, Gemini, and any fallback) must receive the same segment input and produce the same **logical** structured contract defined in §13–§14, from the single shared Zod definition and prompt.
- No provider-specific fields, values, semantics, prompts, or post-processing are authorized. Code-assigned fields are computed identically regardless of provider.
- The fallback chain keeps validating every attempt against the same schema. Its control flow is unchanged.
- **D11-F precondition re-applies.** The shared output schema changes, so structured-output translation tests for every configured provider must pass for the extended segment schema before any D11 session is scheduled (D11 §7, unchanged).

---

### 17. Backward Compatibility

See §11. In summary:
- the new fields are optional on read, for legacy rows only;
- legacy rows render without the new fields;
- there is no backfill and no migration;
- legacy rows are unaffected for Qualification;
- only post-implementation, complete determinations are D11-validation-valid.

Migration 0027's descriptive header comment will be stale after implementation. Applied migrations are not edited by this decision. Any shape documentation belongs in code comments under the future authorized implementation.

---

### 18. D0–D11 Boundary Preservation

```text
D0–D11 IMMUTABLE
```

This decision does **not** authorize changes to:
- Discovery;
- R-71;
- scoring or ranking;
- Opportunity creation;
- the Opportunity state machine;
- ResearchSignal attribution;
- **existing ResearchSignal `confidence`/`basis`/`classification` semantics**;
- any D0–D11 decision other than resolving F-1 within its prepared option space;
- the fallback-provider architecture;
- the D11 participant methodology (D11-C/D11-H).

D2's aggregation, D3's evidence-sufficiency and UNKNOWN rules, and D4/D5's Qualification behavior are unchanged.

---

### 19. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This document resolves F-1 and locks the contract in §13–§16. Implementing it requires a separate, explicit authorization.

Until then:
- the Gate Audit classification stays **NOT READY FOR LIVE VALIDATION**;
- D11-I, provider funding, remains separately unresolved.

---

### 20. Explicit Non-Actions

- No edit to `categoryPlausibility.ts`, `schema.ts`, `prompt.ts`, provider, persistence, Qualification, worker, UI, or test files.
- No schema, migration, or backfill.
- No PRD or configuration change.
- No change to any existing governance document, including D10, D11, the D11-H record, the Gate Audit, and the Preparation document.
- No D11 session started.
- No API, provider, or database call.
- No staging, commit, or push.

---

### 21. Final Safety Verification

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 102 → 103 lines (+ this document only)
Pre-existing untracked files: all 54 SHA-1s identical to baseline
Commit / push ............. none / none
Live API/provider/database calls: 0
```

## STOP
