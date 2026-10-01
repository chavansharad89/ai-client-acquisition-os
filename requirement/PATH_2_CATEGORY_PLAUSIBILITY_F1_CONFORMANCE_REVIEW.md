# Path 2 — Category Plausibility

## F-1 Decision Conformance Review (Read-Only)

```text
DOCUMENT TYPE: READ-ONLY GOVERNANCE CONFORMANCE REVIEW
SUBJECT: requirement/PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md
FINAL CLASSIFICATION: PRODUCT OWNER CLARIFICATION REQUIRED
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

D0–D11 are treated as immutable. This review does not change the F-1 decision
and does not choose a resolution for any ambiguity it finds. The F-1 record was
drafted in an earlier task of this same session; this review assesses it
against the chain on the same terms as any other document.

---

### 1. Baseline

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28   (matches expected)
Staged .................... none
git status --short ........ 103 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
Untracked files hashed .... 55 (stored outside the repository for §13)
```

---

### 2. Source Documents Reviewed

Governance:
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (subject)
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION_PREPARATION.md`
- `PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md` (§2, §4, §5, §11)
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (§3, §4, §6, §7)
- `PATH_2_CATEGORY_PLAUSIBILITY_D8_WIDENING_PRODUCT_DECISION.md` (§1, §10)
- `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` (D3 §119-131, D10 §198-210, entity sketch §425-445)
- `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §162-175 (D3 preparation tier mapping; read only to check terminology)

Source, for terminology:
- `packages/core-research/src/schema.ts`: header comment (lines 1-18), `observationSchema`, `categorySegmentSchema`
- `packages/core-research/src/types.ts:25-57`
- `packages/core-qualification/src/rules.ts` (`isEvidentiary`, `evaluateCategoryPlausible`)
- `categoryPlausibility.ts`
- migration 0027
- `opportunities/[id]/page.tsx`

All of these were verified in earlier tasks of this session. Source was not re-read beyond terminology.

---

### 3. F1-A Conformance — Confidence

| Check | Result |
|---|---|
| Explicitly scoped to category plausibility | **Yes.** §6 says "category-plausibility-specific meaning"; "not the research-wide `LeadResearch.confidence`, and it is not any Observation's confidence." |
| Does not alter ResearchSignal confidence | **Yes.** §6 last bullet and §18 explicitly preserve it. |
| No conflict with D10-C / D10 §5 | **Yes.** Shown for MATCH/MISMATCH and suppressed for UNKNOWN, which matches D10 §5 ("suppressed for UNKNOWN") and the existing convention. |
| No conflict with D11 evidence requirements | **Yes.** It makes §6.3's "populated" satisfiable. It never changes an outcome, so D2/D4/D5 are untouched. |
| Unambiguous MATCH/MISMATCH/UNKNOWN semantics | **Yes, at contract level.** MATCH/MISMATCH are 1–100, model-produced. UNKNOWN is exactly 0 (model-produced when model-reported; code-set for `NO_MODEL_VERDICT`). §14 rule 5 ties confidence ≥ 1 to OBSERVED/MATCH/MISMATCH. |
| `1–100` / `0` a deliberate new contract, not accidental reuse | **Yes.** The decision states the scale is reused but the meaning is new ("how strongly the verbatim-verified evidence cited for this segment supports the recorded outcome", "not a probability"). The lower bound of 1 for MATCH/MISMATCH deliberately differs from ResearchSignal OBSERVED, which allows 0. The INFERRED ≤ 80 cap is explicitly declared inapplicable. |

**Assessment: CONFORMING.**

Non-blocking note N-1: no calibration guidance is locked (what a model should put for 30 versus 90). That is prompt wording, not semantics. The field is informational only, and two implementations cannot diverge in effect.

---

### 4. F1-B / F1-C Conformance — Quote, Rationale, Basis

| Check | Result |
|---|---|
| quote = cited evidence text | **Yes** (§7). Model-produced, verbatim-verified. |
| rationale = model explanation | **Yes** (§7, §8). Model-produced free text. Kept, not renamed. Extended to model-reported UNKNOWN. |
| basis = deterministic system classification | **Yes** (§7). Code-assigned, closed vocabulary, not accepted from the model (§14 rule 4). |
| The three basis values are mutually understandable | **Yes.** They are disjoint by construction: `CITED_SOURCE_EVIDENCE` ⇔ MATCH/MISMATCH; `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` ⇔ model-returned UNKNOWN; `NO_MODEL_VERDICT` ⇔ code-filled UNKNOWN. §14 rule 5 makes them checkable. |
| ResearchSignal `basis` semantics unchanged | **Yes.** §7 says it "does not inherit the ResearchSignal meaning", and §18 confirms it. |

**Assessment: CONFORMING.**

Non-blocking note N-2: D10 Constraint 4 says "no new evidence schema should be invented". F-1 reuses the `basis` field slot but gives it a new closed value domain. F-1 §3 declares this explicitly as a feature-scoped meaning. It is recorded as a deliberate Product Owner act, not a silent reinterpretation.

Non-blocking note N-3: `basis` is rendered as its literal value (§15), for example `NO_MODEL_VERDICT`. This follows the literal-label convention of D10-D/E/F. No user-facing wording is defined, and none is required by D10.

---

### 5. F1-D Conformance — Classification (highest priority)

#### 5.1 Existing locked and source meanings

| Term | Existing meaning |
|---|---|
| OBSERVED | `schema.ts:9-10`: "seen directly. MUST cite evidence (a quote and a source)". `observationSchema`: "a supplied document **states this**, and you can quote it". Here the *claim value* itself is stated by the document. |
| INFERRED | `schema.ts:11-12`: "reasoned from observations. MUST state what it reasoned from. Cannot cite evidence." Confidence ≤ 80. `basis` is required. |
| UNKNOWN | Not determinable. Value null, no evidence, confidence 0. |
| Evidence classification in the Path 2 chain | Final Decision Record §162 (D3 preparation) maps category evidence to this vocabulary by **directness**: Tier 1 direct self-identification → OBSERVED; Tier 2 strong contextual (menus, booking flows) → "**OBSERVED or INFERRED depending on directness**"; Tier 3 weak/name-only → INFERRED. |
| Locked D3 (scope lock §119-131) | First-party primary, supporting metadata secondary, UNKNOWN on insufficiency, "evidence specific enough to support the determination". D3 **does not** state that a determination must be OBSERVED, and **does not** forbid INFERRED. |
| D11 §6.1 / §6.3 / §6.4 | §6.1: "Every OBSERVED claim **underlying** a reviewed MATCH or MISMATCH…". §6.3: "consistent with the claim's classification (OBSERVED vs. INFERRED)". §6.4: spot-check "at least one OBSERVED claim". D11 uses OBSERVED/INFERRED in the chain's existing sense. |

#### 5.2 F-1's mapping

```text
MATCH → OBSERVED;  MISMATCH → OBSERVED;  UNKNOWN → UNKNOWN;  INFERRED → forbidden
(deterministic, code-assigned, persisted, not rendered)
```

Mechanically, the mapping is unambiguous. It is a pure function of the outcome, so two engineers would write the same code for it.

#### 5.3 Conformance issues

**C-1 — `OBSERVED` is not declared feature-local, and its meaning differs from the chain's.**
- F-1 §9 justifies the mapping as follows: every MATCH/MISMATCH requires verbatim-verified evidence, "which is exactly the OBSERVED obligation". That equates the two meanings; it does not declare a feature-local one.
- Under the existing meaning, OBSERVED means the document **states** the claim.
- A MISMATCH usually rests on a quote that shows what the business *does*, from which *not serving* a segment is reasoned. Under the chain's directness mapping (Final Decision Record §162), that is INFERRED-from-observed.
- F-1's OBSERVED therefore means "backed by verbatim-verified cited evidence". That is a different, broader meaning, applied under the same word.
- F-1 §9 does keep the storage separate from ResearchSignal. It does **not** state that the word OBSERVED carries a different meaning here.

**C-2 — F-1 attributes to D3 a prohibition D3 does not contain.**
- F-1 §9 says INFERRED "would conflict with D3's evidence-sufficiency rules".
- Locked D3 contains no OBSERVED-only rule. The evidence requirement for MATCH/MISMATCH is an *implementation* rule in `categorySegmentSchema`. The D3 preparation mapping explicitly contemplated INFERRED for some contextual evidence.
- Forbidding INFERRED may well be a legitimate Product Owner choice. But its recorded basis is inaccurate, and D11 §6.3 names "OBSERVED vs. INFERRED" as the axis to check.

**C-3 — Where the divergence would show up.**

This is where two people could apply different semantics:
- **Validation.** A facilitator running D11 §6.1/§6.4 using the chain's meaning ("does the quote *state* the claim?") could reject a MISMATCH that F-1 labels OBSERVED. A facilitator using F-1's meaning ("is the verdict backed by a verified quote?") would accept it. D11 §6.3's consistency check becomes trivially true under F-1, because classification is derived from the outcome, but it stays a substantive check under the chain's meaning.
- **Implementation.** One engineer might type the field with the existing `Classification` / `classificationSchema` enum (`schema.ts:20-22`), which carries the INFERRED member and the ResearchSignal association. Another might define a separate two-value type. F-1 does not say which.

Per this review's instructions, this is recorded as an **open Product Owner clarification**, not an implementation choice. This review does not select a resolution.

**Assessment: PRODUCT OWNER CLARIFICATION REQUIRED (C-1, C-2, C-3).**

Items the Product Owner would need to clarify (listed, not answered):
- whether segment `OBSERVED` is a feature-local label meaning "evidence-backed verdict", or carries the chain's "directly stated" meaning;
- what the correct governance basis is for forbidding INFERRED;
- how D11 §6.1/§6.3/§6.4 facilitators are to apply OBSERVED to segment verdicts;
- whether the implementation type is shared with, or separate from, the ResearchSignal `Classification` enum.

---

### 6. F1-E Conformance — UNKNOWN

| Case | F-1 representation | Explicit? |
|---|---|---|
| Model-reported UNKNOWN | `basis = MODEL_REPORTED_INSUFFICIENT_EVIDENCE`, rationale required, evidence [], confidence 0 | Yes (§10, §13, §14 rule 3) |
| Downgrade after failed verification | Recorded as model-reported UNKNOWN | Yes (§10 row 2) |
| Empty / no model verdict | `basis = NO_MODEL_VERDICT`, rationale null, confidence 0. Excluded from D11 "genuine insufficiency" | Yes |
| Missing determination | No row; existing Qualification reason | Yes |
| Failed Research run | No row | Yes |
| Zero segments | `segment_results = []`, aggregate UNKNOWN | Yes |

**D11 compatibility:**
- A model-reported UNKNOWN with recorded insufficiency rationale **can** satisfy D11 §3.5 / §4.3 / §4.6 at system level.
- D11-H §9's facilitator judgment of genuineness is preserved.
- D3's "never default to MISMATCH" and "UNKNOWN has no evidence" are preserved.
- **Nothing has been observed live.** This is a contract-level assessment only.

**Assessment: CONFORMING.**

Non-blocking note N-4: at **aggregate** level, a row whose segments are all `NO_MODEL_VERDICT` is still aggregate UNKNOWN and Qualification `INSUFFICIENT_EVIDENCE`, the same as a genuine UNKNOWN. That is unchanged behavior (D2/D4/D5). D11 only needs the distinction per segment, which F-1 provides.

---

### 7. F1-F Conformance — Legacy Rows

| Check | Result |
|---|---|
| New fields optional on read | Yes (§11.1, §13 last column) |
| No backfill | Yes (§11.3) |
| Old rows keep Qualification behavior | Yes (§11.4). `aggregateResult` is still the only input. |
| Only post-change determinations are D11-valid | Yes (§11.5) |
| How a post-change row is recognized | **Mostly.** §11.1 defines a legacy row as one "whose segment objects lack `basis`". Every post-change row with ≥1 segment has `basis` on every segment, because code assigns it, so recognition works for those rows. |

Non-blocking note N-5: a row with **zero segments** (`segment_results = []`, from an empty or all-delimiter `targetCustomer`) has no segment objects, so the rule cannot tell legacy from post-change. No timestamp cutoff or version marker is defined. Such a row cannot satisfy any D11 coverage item: it is UNKNOWN "by construction", not genuine insufficiency. So it has no practical effect on D11. Its validation status is nonetheless formally undefined.

**Assessment: CONFORMING WITH NOTE N-5.**

---

### 8. Option A Architecture Conformance

| Boundary | Result | Basis |
|---|---|---|
| D1/D7 separation | Preserved | All additions stay inside `segment_results` JSONB of `category_plausibility_determinations`. There is no path to `research_signals`, `allObservations()`, `FIELD_KIND`, or the offer path (F-1 §12, §9). |
| Prospect attribution | Preserved | `prospect_id` column is untouched. |
| Search currentness / supersession | Preserved | `supersedePrevious(search_id, prospect_id)` and `getCurrentByProspectId` SQL read no JSONB keys. |
| D9 provider neutrality | Preserved | Additions go in the shared Zod schema and prompt. Adapters derive their schema from it. Code-assigned fields are provider-agnostic. The D11-F translation-test precondition is explicitly re-applied (F-1 §16). |
| D8 input contract | Unaffected | F-1 changes output only. D8 Widening §10 ("no further widening of `ResearchProviderInput`") is respected. |
| Discovery | Unmodified | Not in the change set (F-1 §18). |
| Scoring / ranking | Unmodified | Confidence never feeds scoring. The list page is untouched (F-1 §15, §18). |
| Opportunity creation / state machine | Unmodified | D5 is unchanged (F-1 §18). |
| Migration 0027 | Behavior unchanged | No DDL. The descriptive header comment will be stale; F-1 §17 acknowledges this. |

The scope lock's entity sketch (§425-445) lists `evidence` next to `segment_results`. The built entity nests evidence inside `segment_results`, and F-1 builds on the built shape. The sketch was marked illustrative, so this is not a conflict.

**Assessment: CONFORMING.**

---

### 9. D0–D11 Boundary Verification

- **D0–D11 text:** unmodified. F-1 claims no amendment (F-1 §3, §18).
- **D2 aggregation, D4/D5 Qualification, D6 attribution, D7 separation, D8, D9:** preserved (§3–§8 above).
- **D3:** preserved in effect, since UNKNOWN on insufficiency and first-party primary are unchanged. However, F-1 §9 **misstates** D3 as prohibiting INFERRED (C-2).
- **D10-C / Constraint 4:** satisfied for URL, label, quote, confidence, and basis. The new basis value domain is explicitly declared (N-2).
- **D11 §6.3:** "populated" becomes satisfiable. Whether "consistent with the claim's classification (OBSERVED vs. INFERRED)" is meaningfully satisfied depends on C-1.
- **Existing ResearchSignal confidence, basis, and classification semantics:** stated as unchanged. C-1 is a *naming* collision that risks confusion; it does not change ResearchSignal behavior.

---

### 10. Findings

| ID | Area | Severity | Finding |
|---|---|---|---|
| C-1 | F1-D | **Clarification required** | Segment `OBSERVED` means "backed by verbatim-verified evidence" in F-1, but "document states the claim" in the chain and in source. F-1 does not declare it feature-local, and in §9 asserts equivalence. |
| C-2 | F1-D | **Clarification required** | F-1 §9 grounds "INFERRED forbidden" in D3, but locked D3 contains no such rule. The D3 preparation mapping allowed INFERRED for some contextual evidence, and D11 §6.3 names OBSERVED vs. INFERRED. |
| C-3 | F1-D | **Clarification required** | Consequence of C-1/C-2: D11 §6.1/§6.3/§6.4 can be applied with two different semantics, and the implementation type (shared `Classification` enum vs. a separate type) is unspecified. |
| N-1 | F1-A | Non-blocking | No confidence calibration guidance. Informational field; prompt-level detail. |
| N-2 | F1-B | Non-blocking | New closed value domain for `basis` under D10 Constraint 4. Explicitly declared by F-1. |
| N-3 | UI | Non-blocking | Basis rendered as a literal enum value. Consistent with D10's literal-label convention. |
| N-4 | F1-E | Non-blocking | Aggregate-level UNKNOWN does not distinguish `NO_MODEL_VERDICT`. Unchanged behavior; not required by D11. |
| N-5 | F1-F | Non-blocking | Zero-segment rows cannot be classified as legacy or post-change. No D11 effect. |

F1-A, F1-B/C, F1-E, F1-F, and the Option A architecture are internally consistent and precise enough to implement. F1-D is not.

---

### 11. Final Classification

```text
PRODUCT OWNER CLARIFICATION REQUIRED
```

The ambiguity in F1-D (C-1 to C-3) could lead two engineers or facilitators to apply different semantics to "OBSERVED" for segment verdicts. The review instructions require this classification in that case. No resolution is selected here.

---

### 12. Implementation Authorization Status

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This review does not authorize implementation, does not amend the F-1 decision, and does not start D11. The Live Validation Gate status stays **NOT READY FOR LIVE VALIDATION**.

---

### 13. Safety Verification

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 103 → 104 lines (+ this document only)
Pre-existing untracked files: all 55 SHA-1s identical to baseline
  (includes the F-1 decision, F-1 preparation, D11-H record)
Production / test / schema / migration / provider / worker / UI / PRD / config changes: 0
Existing governance documents modified: 0
Commit / push ............. none / none
Live API/provider/database calls: 0
```

## STOP
