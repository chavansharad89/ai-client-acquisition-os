# Path 2 — Category Plausibility

## F1-D Classification — Product Owner Clarification / Decision

```text
STATUS: DECIDED
F1-D: OPTION A — FEATURE-LOCAL SEGMENT CLASSIFICATION
      (values OBSERVED | UNKNOWN; INFERRED not permitted; code-derived;
       feature-local type; OBSERVED carries a category-plausibility-specific meaning)
D0–D11: IMMUTABLE
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This is a governance record. It resolves **only** F1-D. That is the classification ambiguity
recorded as C-1, C-2 and C-3 in
`PATH_2_CATEGORY_PLAUSIBILITY_F1_CONFORMANCE_REVIEW.md` §5 and §10.

It does not reopen F1-A, F1-B, F1-C, F1-E, F1-F, the Option A architecture, or any D0–D11 decision.
It modifies no code, test, schema, migration, provider, worker, UI, PRD, configuration, D11-H
facilitator record, or existing governance document. It makes no live call.

---

### 1. Baseline

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28   (matches the F-1 documents)
Staged .................... none
git status --short ........ 104 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
Untracked files hashed .... 56 (stored outside the repository for §13)
Target file ............... absent before this task
```

---

### 2. Decision Statement

The Product Owner resolves F1-D as follows:

1. **Feature-local.** The segment-level `classification` is a category-plausibility-specific field.
   - Its value domain is `OBSERVED | UNKNOWN`.
   - Its word `OBSERVED` carries the **feature-local meaning** defined in §5.
   - It does not reuse or redefine the ResearchSignal meaning of OBSERVED / INFERRED / UNKNOWN. That meaning stays exactly as it is in `schema.ts` and the existing chain.
2. **INFERRED is not permitted** for segment results.
   - The governance basis for this is a Product Owner choice made under F-1, consistent with the locked F-1 contract (§6).
   - It is **not** a prohibition contained in D3. The F-1 decision's §9 statement that INFERRED "would conflict with D3's evidence-sufficiency rules" is superseded for F1-D by this document (§3, C-2).
3. **A reasoned-but-quote-grounded verdict is OBSERVED.** A MATCH/MISMATCH whose cited, verbatim-verified quotes support the verdict through reasoning is classified `OBSERVED` under the feature-local meaning.
   - This applies only when every premise the reasoning needs is present in the cited quotes.
   - A verdict that needs any premise **not** present in the cited quotes is not a valid MATCH/MISMATCH. It must be UNKNOWN (§6).
4. **Code-derived.** Classification remains deterministic and code-derived from the outcome. The mapping in F-1 §9 and §13 is unchanged.
5. **§6.3 is substantive.** D11 §6.3 is applied as a substantive check. The facilitator checks whether each MATCH/MISMATCH is OBSERVED **in substance**, meaning grounded in its cited quotes, rather than INFERRED in substance. The facilitator does not read the stored label as proof (§8).

---

### 3. Issue Being Resolved

From the F-1 Conformance Review §5.3 and §10:

- **C-1.** F-1 §9 labels every MATCH/MISMATCH `OBSERVED` and calls this "exactly the OBSERVED obligation". It does not declare the meaning feature-local.
  - In the existing chain and source, OBSERVED means *a supplied document states the claim* (`schema.ts:9-10`, `observationSchema`).
  - The D3 preparation mapping (Final Decision Record §162) classifies by directness: Tier 2 contextual evidence is "`OBSERVED` or `INFERRED` depending on directness".
- **C-2.** F-1 §9 grounds the INFERRED prohibition in D3.
  - Locked D3 (Consolidated Scope Lock §119-131) contains no OBSERVED-only rule and does not forbid INFERRED.
  - D3 requires first-party primary evidence, "evidence specific enough to support the determination", UNKNOWN on insufficiency, and no new evidence-tier taxonomy.
- **C-3.** D11 §6.1, §6.3 and §6.4 can be applied under two different semantics.
  - If classification is derived from the outcome and every qualifying segment is `OBSERVED` by definition, then §6.3's "consistent with the claim's classification (OBSERVED vs. INFERRED)" becomes **tautological** when read against the stored label alone.
  - The implementation type is also unspecified: the shared `Classification` enum or a separate type.

This document accepts all three findings as accurate and resolves them.

---

### 4. Authoritative Evidence

| Source | Relevant text | Use here |
|---|---|---|
| `schema.ts:6-14, 20-22` (source, terminology only) | OBSERVED "seen directly. MUST cite evidence"; INFERRED "reasoned from observations. MUST state what it reasoned from. Cannot cite evidence it did not observe."; UNKNOWN "null value and no evidence"; `CLASSIFICATIONS = ['OBSERVED','INFERRED','UNKNOWN']` | The existing research-signal meaning. Unchanged. |
| Locked D3 (Scope Lock §119-131) | first-party primary; supporting metadata secondary; weak snippets "must not independently establish a definitive MATCH/MISMATCH"; "evidence specific enough to support the determination"; insufficient → UNKNOWN; "No new evidence-tier taxonomy" | Sets the evidence bar. **Does not** mandate OBSERVED or forbid INFERRED. |
| D3 preparation (Final Decision Record §162-176) | Tier 2 → "`OBSERVED` or `INFERRED` depending on directness"; Choice B note: "directly-quoted contextual content (not model inference) still counts as `OBSERVED`" | Context only. It is preparation text, not a locked rule. It is consistent with §5's line between quote-grounded content and model inference. |
| D10-C / §5 / Constraint 4 | each segment's evidence exposes URL, label, quote, confidence, basis | Unchanged. |
| D11 §6.1 | "Every OBSERVED claim underlying a reviewed MATCH or MISMATCH has at least one `evidence[]` entry with a real `sourceUrl` and a verbatim `sourceQuote`." | Interpreted in §8. |
| D11 §6.3 | "Confidence and basis fields are populated and consistent with the claim's classification (OBSERVED vs. INFERRED)…" | Interpreted in §8, non-tautologically. |
| D11 §6.4 | at least one OBSERVED claim per session independently verified against the actual fetched source | Interpreted in §8. |
| F-1 Decision §6, §7, §9, §13, §14 | F1-A confidence 1–100 / 0, "INFERRED ≤ 80 cap does not apply, because segments are never INFERRED (F1-D)"; F1-B code-assigned closed `basis`; F1-D mapping; locked contract and consistency rule 5 | Locked. Bounds the option space (§6, §10). |
| F-1 Conformance Review §5, §10 | C-1, C-2, C-3 | The issue resolved. |

---

### 5. Selected Classification Semantics

**Segment `classification` (category plausibility only)** is a closed, two-valued, code-derived field:

| Value | Feature-local meaning |
|---|---|
| `OBSERVED` | The segment's MATCH or MISMATCH verdict is **grounded in its cited evidence**. All four conditions hold: (a) ≥1 cited quote passed verbatim verification against a supplied source document (F-1 §14 rule 2); (b) the cited quotes, read in their source, **directly state** the verdict for this segment **or contain every premise** from which the verdict follows; (c) the verdict depends on no uncited premise, such as model background knowledge, the business name alone, or facts in the rationale that appear in no cited quote; (d) the grounding is first-party primary per D3. |
| `UNKNOWN` | The segment has no MATCH/MISMATCH verdict (outcome UNKNOWN, either F1-B basis). |

Properties:

- **Two senses of OBSERVED, kept distinct.**
  - *Research-signal OBSERVED*: a document states the claim value. Unchanged, used by ResearchSignals, `isEvidentiary()`, and everything outside this feature.
  - *Segment OBSERVED*: the verdict is grounded in cited evidence. Used only inside `segment_results` of `category_plausibility_determinations`.
  - Segment OBSERVED is broader. It admits a verdict that is reasoned from quoted text, provided the reasoning uses only premises contained in the quotes.
- **Not an evidence tier.** The label does not grade Tier 1 versus Tier 2 directness. It introduces no new evidence-tier taxonomy (D3) and no first-party/supporting label (D10-C). Directness within a quote-grounded verdict is not recorded in the classification field.
- **Code cannot verify condition (b)/(c).** Code assigns `OBSERVED` from the outcome. Conditions (b)–(d) are **obligations on the verdict**: the prompt conveys them to the model (§11), and D11 checks them (§8). The stored label records the **claim** that the verdict meets them. It is not proof that it does.

---

### 6. MATCH / MISMATCH / UNKNOWN Rules

| Outcome | `classification` | Required for validity | Otherwise |
|---|---|---|---|
| MATCH | `OBSERVED` | F-1 §14 rule 2 (evidence 1–3, verbatim, supplied URL, rationale, confidence 1–100) **and** §5 conditions (b)–(d): the quotes directly state, or contain every premise showing, that the business serves this segment. | If grounding needs an uncited premise, the correct outcome is UNKNOWN. The model must return UNKNOWN. If this is detected at D11, it is a §6.3 failure (§8). |
| MISMATCH | `OBSERVED` | Same as MATCH. The quotes must directly state, or contain every premise showing, that the business does **not** serve this segment. A MISMATCH reasoned from quoted text describing what the business does is permitted **only** if that text by itself excludes the segment. The absence of a mention is not a quoted premise. | Absence, silence, or ambiguity is UNKNOWN, never MISMATCH (D3, unchanged). |
| UNKNOWN | `UNKNOWN` | F-1 §10 / §14 rule 3 unchanged: `evidence = []`, `confidence = 0`, and `basis` ∈ {`MODEL_REPORTED_INSUFFICIENT_EVIDENCE`, `NO_MODEL_VERDICT`}. Rationale is required for the model-reported case and `null` for `NO_MODEL_VERDICT`. | — |

The code mapping is unchanged from F-1 §9 and §13: MATCH/MISMATCH → `OBSERVED`; UNKNOWN → `UNKNOWN`. F-1 §14 rule 5, the stored-row consistency rule, is unchanged.

---

### 7. INFERRED Treatment

- **Permitted?** No. `INFERRED` is not a member of the segment classification domain, and no segment result may carry it.
- **Governance basis (corrected).** The exclusion is a **Product Owner choice made under F-1**. It is required for consistency with the already-locked F-1 contract, which this document may not reopen:
  - **F1-A** fixes MATCH/MISMATCH confidence at 1–100. It states the INFERRED ≤ 80 cap does not apply "because segments are never INFERRED".
  - **F1-B** makes `basis` a code-assigned closed value (`CITED_SOURCE_EVIDENCE` for MATCH/MISMATCH). It explicitly does not carry the ResearchSignal INFERRED meaning (a model-stated reasoning trail).
  - **§13/§14** require ≥1 verbatim-verified evidence entry for every MATCH/MISMATCH.
  - The existing INFERRED obligations are: cannot cite evidence it did not observe, `basis` = reasoning trail, confidence ≤ 80. These are structurally incompatible with that contract.
  - **D3 does not itself forbid INFERRED.** The exclusion is consistent with D3's "evidence specific enough to support the determination" and "weak … must not independently establish". It is not derived from any OBSERVED-only text in D3.
- **What would have been INFERRED.** A verdict that the chain's directness mapping would call INFERRED falls into one of two cases:
  1. It is **quote-grounded** (all premises in the cited quotes). It is segment-`OBSERVED` under §5.
  2. It **depends on an uncited premise**. It is not a valid MATCH/MISMATCH and must be UNKNOWN.
- There is no third, "INFERRED MATCH/MISMATCH" state.

---

### 8. Facilitator / D11 Interpretation

D11's text is not changed. For category-plausibility segment results, the facilitator applies it as follows. Only determinations that are validation-valid under F1-F count: post-implementation rows with complete fields.

**D11 §6.1 — evidence presence.**
- "OBSERVED claim underlying a reviewed MATCH or MISMATCH" means **each MATCH/MISMATCH segment result**, all of which carry segment `OBSERVED`.
- For each reviewed MATCH/MISMATCH segment, the facilitator confirms ≥1 `evidence[]` entry with a real `sourceUrl` (one of the supplied source documents) and a verbatim quote.
- UNKNOWN segments have no evidence and are outside §6.1.

**D11 §6.3 — consistency with classification. This check is substantive, not tautological.** It has two parts.

1. *Structural (mechanical).*
   - `confidence` and `basis` are populated.
   - The stored row satisfies F-1 §14 rule 5 (`OBSERVED` ⇔ MATCH/MISMATCH ⇔ `CITED_SOURCE_EVIDENCE` ⇔ confidence ≥ 1; `UNKNOWN` ⇔ UNKNOWN ⇔ UNKNOWN-basis ⇔ confidence = 0).
   - No segment carries `INFERRED` or any other value.
   - This part is guaranteed by construction and is expected always to pass. A failure indicates an implementation defect.
2. *Substantive (OBSERVED vs. INFERRED in substance).*
   - For each reviewed MATCH/MISMATCH segment, the facilitator reads the cited quotes in their source, together with the rationale.
   - The facilitator decides independently, **without relying on the stored label**, whether the verdict is:
     - **OBSERVED in substance.** The quotes directly state the verdict, or contain every premise from which it follows (§5 b–d). **Accept.**
     - **INFERRED in substance.** The verdict depends on at least one premise not present in any cited quote. Examples: the rationale introduces an uncited fact, the verdict rests on the business name or general category knowledge, or a MISMATCH rests on the absence of a mention. **Reject.** This is recorded as a §6.3 failure for that segment: the stored `OBSERVED` / `CITED_SOURCE_EVIDENCE` / confidence ≥ 1 is **inconsistent** with the evidence actually cited.

   This substantive part is where D11 §6.3's "OBSERVED vs. INFERRED" axis operates. Because it compares the stored classification with the facilitator's reading of the evidence, not with the outcome, it can fail even when the structural part passes. It is therefore not tautological.

**D11 §6.4 — manual spot-check.**
- "At least one OBSERVED claim" means at least one MATCH/MISMATCH segment result.
- The technical reviewer compares its cited quote directly against the actual fetched source document, confirming the URL and verbatim text. This tests provenance, as D11 states.
- The reviewer may perform the §6.3 substantive reading on the same segment. §6.4 itself is not expanded.

**Acceptable evidence, by classification:**

| Stored classification | Facilitator accepts when | Facilitator rejects when |
|---|---|---|
| `OBSERVED` (MATCH) | ≥1 verified first-party quote either states that the business serves the segment, or contains every premise showing it does | Grounding needs an uncited premise; only supporting-tier or weak evidence (D3/§6.2); the quote is not verbatim or not at the URL |
| `OBSERVED` (MISMATCH) | ≥1 verified first-party quote either states that the business does not serve the segment, or contains text that by itself excludes it | Grounding rests on absence or silence, an uncited premise, or name-only evidence; the quote is not verbatim or not at the URL |
| `UNKNOWN` (`MODEL_REPORTED_INSUFFICIENT_EVIDENCE`) | `evidence = []`, confidence 0, and a rationale stating what was absent or insufficient. The D11-H §9 genuineness judgment is unchanged. | Evidence present, confidence ≠ 0, or rationale missing |
| `UNKNOWN` (`NO_MODEL_VERDICT`) | Structurally valid (F-1 §10). It does **not** count as genuine insufficiency for D11 coverage (F1-E, unchanged). | — |

Directness is not a pass/fail criterion. A verdict whose quote directly states the answer, and one whose quote contains the premises, are both acceptable as OBSERVED. This document adds no field, column or template change to the D11-H facilitator record. Findings are recorded through the record's existing §6.3 evidence-check entries.

---

### 9. Type / Interface Decision

- **Feature-local type.** The implementation must define a category-plausibility-specific type and schema for segment classification, with exactly two members: `'OBSERVED' | 'UNKNOWN'`.
- It must **not** reuse `Classification`, `CLASSIFICATIONS`, or `classificationSchema` from `packages/core-research/src/schema.ts`. Those carry the `INFERRED` member and the ResearchSignal association.
- The existing `Classification` type and its research-signal semantics are unchanged and untouched.
- The field is **not** part of the model-facing schema. This is unchanged from F-1 §14 rule 4. It is assigned in shared, provider-agnostic code after validation.
- The read type keeps the field optional for legacy rows only (F1-F, unchanged).
- Naming of the type and schema identifiers is left to the future authorized implementation. Nothing in this document requires them to be exported beyond the category-plausibility module and its persistence/read types.

---

### 10. Interaction with F1-A / B / C / E / F

| Decision | Effect of this document | Contradiction? |
|---|---|---|
| F1-A (confidence) | None. "Segments are never INFERRED" remains true, so the ≤ 80 cap stays inapplicable. | No |
| F1-B (basis) | None. `CITED_SOURCE_EVIDENCE` ("rests on ≥1 quote that passed verbatim verification") is compatible with the §5 feature-local OBSERVED. | No |
| F1-C (basis vs. rationale) | None. The rationale is read at D11 to detect uncited premises (§8). Its role is unchanged. | No |
| F1-E (UNKNOWN) | None. UNKNOWN rules and the `NO_MODEL_VERDICT` exclusion are unchanged. | No |
| F1-F (legacy) | None. Legacy rows lack `classification` and remain D11-invalid. | No |
| F1-D (original, F-1 §9) | The mapping, persistence, non-display and ResearchSignal separation are **retained**. The equivalence claim ("exactly the OBSERVED obligation") and the D3-based justification are **superseded** by §5 and §7. | Clarified, not contradicted |
| Option A architecture | None. | No |

No direct contradiction with F1-A, B, C, E or F was found, so no STOP condition arose.

---

### 11. Implementation Constraints (for a future, separately authorized implementation)

1. Use a feature-local two-member classification type (§9). Do not import the ResearchSignal `Classification` enum for this field.
2. Keep classification code-derived, using the F-1 §13 mapping. Do not add it to the model output schema.
3. The shared prompt must state that MATCH/MISMATCH requires cited quotes that state the verdict or contain every premise for it, and that otherwise the model must return UNKNOWN. This is prompt wording under D9's single shared prompt, identical for every provider. It is not a schema or provider change.
4. Do not add any automated "directness" or "INFERRED-in-substance" detector. That judgment belongs to D11 §6.3 (§8).
5. Code comments that describe segment `OBSERVED` must state its feature-local meaning (§5), so that it is not confused with the research-signal meaning.
6. Nothing here changes D11-F. The structured-output translation-test precondition stands (F-1 §16).

---

### 12. Explicit Non-Decisions

This document does **not**:
- amend any D0–D11 text or the D11-H facilitator record;
- change the research-signal meaning of OBSERVED / INFERRED / UNKNOWN, `isEvidentiary()`, or any ResearchSignal field;
- reopen F1-A, F1-B, F1-C, F1-E, F1-F, or the Option A architecture;
- introduce an evidence tier, a directness field, or a first-party/supporting label;
- decide prompt wording beyond the constraint in §11.3, confidence calibration (N-1), or basis display wording (N-3);
- resolve N-5 (zero-segment row recognition) or D11-I (provider funding);
- change the Live Validation Gate status, which remains **NOT READY FOR LIVE VALIDATION**;
- authorize implementation, tests, migration, or any live call.

---

### 13. Safety Verification

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 104 → 105 lines (+ this document only)
Pre-existing untracked files: all 56 SHA-1s identical to baseline
Production / test / schema / migration / provider / worker / UI / PRD / config changes: 0
Existing governance documents modified: 0
Commit / push ............. none / none
Live API/provider/database calls: 0
```

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

## STOP
