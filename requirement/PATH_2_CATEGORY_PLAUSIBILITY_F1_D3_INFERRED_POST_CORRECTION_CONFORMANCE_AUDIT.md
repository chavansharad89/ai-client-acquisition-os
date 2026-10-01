# Path 2 — Category Plausibility

## F-1 §9 D3-INFERRED Correction: Post-Correction Conformance Audit (Read-Only)

```text
DOCUMENT TYPE: READ-ONLY GOVERNANCE CONFORMANCE AUDIT
SUBJECT: requirement/PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md
FINAL CLASSIFICATION: CONFORMING WITH NON-BLOCKING NOTES
D0–D11: IMMUTABLE
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

---

### 1. Audit Purpose

This audit verifies one thing: whether the correction record formally resolves the stale
F-1 Product Decision §9 statement. That statement credited D3 as the source of the
prohibition on segment-level `INFERRED`.

This audit:
- makes no Product Owner decision;
- recommends no classification policy;
- does not modify the correction record or any other file.

---

### 2. Audit Scope

**In scope:**
- the stale §9 claim;
- the locked D3 text;
- F1-D authority and its feature-local semantics;
- precedence;
- D11 §6.3;
- F1-A through F1-F consistency;
- the consolidated-audit findings A-1 to A-14, as they relate to D3 attribution;
- D0–D11 immutability;
- implementation and readiness status;
- remaining documentation contradictions.

**Out of scope:**
- implementation;
- test changes;
- live calls;
- resolving any open item.

---

### 3. Authority / Precedence

Applied as instructed, highest first:
1. D0–D11 locked text (`PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md`);
2. `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1 Decision);
3. `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` (F1-D Decision);
4. `PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md` (Correction);
5. historical evidence only:
   - `…_F1_EVIDENCE_PRODUCT_DECISION_PREPARATION.md`
   - `…_F1_CONFORMANCE_REVIEW.md`
   - `…_F1_CONSOLIDATED_CONFORMANCE_AUDIT.md`

**The ordering conflict and how it resolves.** On the specific question of where the
prohibition comes from, the Correction (rank 4) says it governs over F-1 Decision §9
(rank 2): Correction §8, "Where F-1 Product Decision §9 and this record differ … this
record governs".

This is not a silent reconciliation:
- F1-D Decision §2.2 and §10, which rank above the Correction, already state that the §9 D3 justification "is superseded for F1-D by this document".
- So the supersession has its authority from F1-D. The Correction formalises it.
- Where the documents differ on where the prohibition comes from, this audit applies the Correction's stated precedence.

---

### 4. Baseline Repository State

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --short ........ 107 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
Untracked files hashed .... 59 (stored outside the repository)
Target file ............... absent before this task
```

---

### 5. Exact Superseded F-1 §9 Statement

**Location:** F-1 Decision, line 152, §9, first bullet after the mapping table. The
bullet reads verbatim:

> **`INFERRED` is not permitted for segments.** An INFERRED MATCH/MISMATCH would be an
> outcome without cited evidence. D3 and the current schema route that case to UNKNOWN,
> so allowing INFERRED would conflict with D3's evidence-sufficiency rules.

**Correction §2 reproduces the bullet exactly.** It divides the bullet as follows:

| Part | Status under the Correction |
|---|---|
| "`INFERRED` is not permitted for segments." | **Remains in force.** Its source is now F1-D. |
| "D3 and the current schema route that case to UNKNOWN" (as grounds for the prohibition) | **Superseded** |
| "so allowing INFERRED would conflict with D3's evidence-sufficiency rules" | **Superseded** |
| "An INFERRED MATCH/MISMATCH would be an outcome without cited evidence." | Not expressly superseded or preserved. The Correction supersedes "the bullet's attribution of the prohibition to D3", and this sentence makes no D3 attribution. It describes the ResearchSignal INFERRED obligation, which F-1 §5 records separately. See Note N-A. |

**Explicitly out of the Correction's scope:** the "exactly the OBSERVED obligation" wording
in the same §9 table. It is already superseded by F1-D Decision §5 and §10.

**Result: CONFORMING.** The superseded portion is identified precisely, and the retained
portion is stated.

---

### 6. Exact Correction

Correction §3 contains both required sentences verbatim:
- "**D3 does not itself forbid INFERRED.**"
- "**The prohibition of INFERRED for category-plausibility segment classification is established by the F1-D Product Owner decision.**"

It cites F1-D Decision §2.2 and §7 as the source.

**Result: CONFORMING.**

---

### 7. D3 Verification

The locked D3 text is at Scope Lock lines 119-131:

> FIRST-PARTY WEBSITE EVIDENCE PRIMARY; SEARCH-DERIVED BUSINESS METADATA SUPPORTING;
> UNKNOWN ON INSUFFICIENT EVIDENCE.

It has three rules and a hierarchy:
- "A definitive MATCH/MISMATCH requires evidence specific enough to support the determination — not generic name/keyword coincidence."
- "Insufficient evidence → **UNKNOWN**, never a default MISMATCH."
- "No new evidence-tier taxonomy beyond the above is introduced."
- The evidence hierarchy: first-party, then reliable metadata as supporting, then weak snippets that "must not independently establish a definitive MATCH/MISMATCH".

**Evidence:**
- A case-insensitive search for `INFERRED|OBSERVED` over lines 119-131 returns **0** matches.
- D3 neither mentions nor prohibits `INFERRED`.
- The evidence-sufficiency language governs *what evidence supports MATCH/MISMATCH*. It does not govern *which classification label a verdict may carry*. No prohibition is inferred from it.

**Where "D3" and "INFERRED" appear together elsewhere in F-1 documents** (full search of
the F-1 Decision and F-1 Preparation):
- **F-1 Decision line 152:** the superseded statement.
- **Preparation lines 236, 281 and 303:** these say an INFERRED segment classification "would … interact with D3's evidence-sufficiency rules". They frame this as an open Product Owner question. They do **not** assert a prohibition. They are historical evidence, not governing (Note N-B).

**Result: CONFORMING.** Correction §3's reading of D3 is accurate.

---

### 8. F1-D Verification

| Check | F1-D Decision | Correction | Result |
|---|---|---|---|
| F1-D governs segment classification | §2.1, §5, §9 | §4 ("authoritative source"), §8 | Consistent |
| Feature-local `OBSERVED` | §5: verdict grounded in cited, verbatim-verified quotes that state it or contain every premise; no uncited premise; first-party per D3 | §4: same, in summary | Consistent. The summary does not narrow or widen F1-D §5. |
| Feature-local `UNKNOWN` | §5: no MATCH/MISMATCH verdict | §4: same | Consistent |
| `INFERRED` prohibited | §2.2, §7 | §3, §4 | Consistent |
| Prohibition described as "consistent with D3, not derived from it" | §7 ("consistent with … It is not derived from any OBSERVED-only text in D3") | §3 | Consistent |
| No redefinition of ResearchSignal `Classification` | §2.1, §9, §12 | §5 | Consistent |

**One wording point.** F1-D §5(d) refers to first-party grounding "per D3". That is a
correct use of D3's evidence hierarchy inside the OBSERVED definition. It is **not** a
D3 attribution of the INFERRED prohibition. NOT AN ISSUE.

**Result: CONFORMING.**

---

### 9. Segment Classification Semantics

According to F1-D, as restated by Correction §4:

| Value | Meaning | Source |
|---|---|---|
| `OBSERVED` | Feature-local: the verdict is grounded in cited evidence (F1-D §5 a–d) | F1-D |
| `UNKNOWN` | Feature-local: no MATCH/MISMATCH verdict | F1-D |
| `INFERRED` | Not permitted | F1-D (Product Owner choice) |

The classification is code-derived, and implementation must use a separate two-member
type (F1-D §9; Correction §4).

This is consistent across all rank-2 to rank-4 documents once F-1 §9's superseded
clauses are disregarded.

---

### 10. Existing Research-Signal Classification Semantics

Correction §5 preserves the ResearchSignal `OBSERVED / INFERRED / UNKNOWN` contract
unchanged. That contract includes:
- `Classification`, `CLASSIFICATIONS` and `classificationSchema` (`schema.ts`);
- the obligations attached to them;
- the prompt text;
- `isEvidentiary()`.

Correction §5 also states that F1-D does not change it.

**No document in the chain claims otherwise:**
- F-1 §18 lists "existing ResearchSignal `confidence`/`basis`/`classification` semantics" as not authorised to change.
- F1-D §12 says the same.

**Result: CONFORMING.**

---

### 11. D11 §6.3 Implications

| Check | Evidence | Result |
|---|---|---|
| §6.3 still applies | Correction §6 quotes it and applies it according to F1-D §8 | Yes |
| Facilitator judges the evidence, not the label | Correction §6: "does **not** rely on the stored feature-local `OBSERVED` label" | Yes |
| Unquoted premise → failure | Correction §6: "does not satisfy the F1-D definition … recorded as a §6.3 failure", matching F1-D §8 ("Reject … §6.3 failure") | Yes |
| Validation rule kept distinct from where the prohibition comes from | Correction §6: "This requirement comes from D11 §6.3 as applied by F1-D. It is **not** a D3 requirement." §3 covers the source of the prohibition separately. | Yes |

**Still open (not introduced by the Correction):**
- *Where* in the D11-H record a §6.3 failure is recorded is still undetermined (consolidated audit A-12).
- The Correction repeats "recorded as a §6.3 failure" without naming a record field.
- That is consistent with F1-D. It leaves A-12 open and does not make it worse.

**Result: CONFORMING.**

---

### 12. F1-A Through F1-F Consistency

| Decision | Did it depend on the former D3 attribution? | Effect of the Correction | Remaining contradiction |
|---|---|---|---|
| F1-A confidence | Indirectly. F-1 §6 says the ≤ 80 cap does not apply "because segments are never INFERRED (F1-D)", which cites F1-D, not D3. | None. The premise still holds and is now sourced in F1-D. | None |
| F1-B basis | No. §7 ties consistency to classification (F1-D), not D3. | None | None |
| F1-C rationale/basis | No | None | None |
| F1-D classification | Yes. The prohibition's stated grounds were in F-1 §9. | Grounds corrected to a Product Owner choice. Mapping and prohibition unchanged. | None |
| F1-E UNKNOWN | No. It relies on D3's "insufficient → UNKNOWN", which is accurately attributed. | None | None |
| F1-F legacy rows | No | None | None |

**No contradiction caused by the former D3 attribution remains in F1-A to F1-F.**

---

### 13. D0–D11 Immutability

- **Correction §7** states that no D0–D11 decision changes.
- **This audit confirms the Correction's own boundary:**
  - It edits no document.
  - It quotes D3 without amending it.
  - It applies D11 §6.3 only as F1-D already did.
- **D3's meaning is unchanged.** Removing an inaccurate attribution *to* D3 does not change D3.

**Result: CONFORMING.**

---

### 14. Consolidated-Audit Impact

This covers findings A-1 to A-14 from
`PATH_2_CATEGORY_PLAUSIBILITY_F1_CONSOLIDATED_CONFORMANCE_AUDIT.md` §18, plus the earlier
review's C-2.

| ID | Subject | Relation to the D3 attribution | Status after the Correction |
|---|---|---|---|
| C-2 (Review) | F-1 §9 grounds the prohibition in D3 | Direct | **Resolved.** F1-D re-grounded the prohibition; the Correction formally supersedes the stale text. |
| A-13 | F-1 §9 still carries the superseded D3 justification | Direct | **Resolved as a governance matter.** The text physically remains, because governance documents are immutable. A formal supersession record now identifies it and sets precedence. |
| A-3 | §6.3 confidence consistency is structural only | Unrelated (confidence) | Still open |
| A-5 | Shared prompt carries two OBSERVED meanings; ResearchSignal INFERRED text | Related to INFERRED *semantics*, not to D3 attribution | Still open. Unrelated to this correction. |
| A-6 | Repair text says "INFERRED or UNKNOWN" | Same as A-5 | Still open. Unrelated to this correction. |
| A-12 | D11-H recording location for §6.3 results | Adjacent (D11 §6.3) | Still open. Not introduced or worsened. |
| A-1, A-2, A-4, A-7, A-8, A-9, A-10, A-11, A-14 | Calibration, placement, nullability, naming, read typing, zero-segment rows, read validation, source capture, D11-F tests | Unrelated | Still open. Unrelated to this correction. |

---

### 15. Remaining Contradictions

These are documentation contradictions. None is resolved here.

| Topic | Finding | Classification |
|---|---|---|
| D3 attribution | F-1 §9 line 152 still physically contains the D3 wording. It is formally superseded, and precedence is set by F1-D §2.2 and Correction §8. | Documentation note. Non-blocking. |
| D3 attribution (historical) | Note N-B: Preparation lines 236, 281 and 303 describe an "interaction" with D3's evidence-sufficiency rules. No prohibition is asserted, and the lines were posed as a Product Owner question. The Correction does not mention the Preparation. | Historical evidence. Non-blocking. Not a contradiction. |
| INFERRED semantics | Note N-A: F-1 §9's sentence "An INFERRED MATCH/MISMATCH would be an outcome without cited evidence" is neither expressly superseded nor expressly preserved. It is accurate for ResearchSignal INFERRED. F1-D §7 says the prohibition is needed for consistency with the locked contract, not D3, so the sentence carries no governing weight. | Non-blocking note |
| OBSERVED semantics | F-1 §9 table's "exactly the OBSERVED obligation" remains in place. It is superseded by F1-D §5 and §10, and the Correction expressly leaves it out of scope. | Documentation note. Non-blocking. |
| D11 §6.3 | No contradiction. Structural plus substantive, as recorded in F1-D §8 and Correction §6. | — |
| Facilitator-record handling | A-12: F1-D §8 refers to "existing §6.3 evidence-check entries" that the D11-H record lacks. The Correction does not address it. | Documentation/status inconsistency (pre-existing relative to this Correction). Still open. |
| F-1 implementation details | A-5 and A-6: prompt and repair text vs. the feature-local OBSERVED / no-INFERRED rule | Non-blocking implementation detail. Still open. |

**No unresolved product contradiction was found.**

---

### 16. Remaining Implementation Details

All are unchanged by the Correction: A-1 to A-12 and A-14 from the consolidated audit.
None is resolved here, and none is made more severe.

The Correction itself adds **no** implementation detail. It changes no schema, type,
prompt or test requirement (Correction §7).

---

### 17. D11 Readiness Impact

**None.** The Correction does not alter:
- the Live Validation Gate classification;
- D11-I (provider funding, unresolved);
- the F-1 implementation gap (confidence/basis/classification absent in code);
- the prerequisites A-11, A-12 and A-14.

```text
F-1 IMPLEMENTATION ........ NOT IMPLEMENTED
IMPLEMENTATION AUTHORIZATION: NOT GRANTED (Correction §1, §9; this audit)
Production/test/schema/migration/UI changes authorized: NONE
D11 ....................... NOT READY FOR LIVE VALIDATION
```

---

### 18. Regression / Test Evidence

**No tests were run.** This is a governance-document audit, and tests cannot establish
governance conformance.

Evidence that the implementation is unchanged:
- The tracked diff SHA-1 is unchanged (`e21f4e7…`).
- No source file has changed since the last recorded suite results (consolidated audit §2, §17).

---

### 19. Repository Safety Verification

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 107 → 108 lines (+ this document only)
Pre-existing untracked files: all 59 SHA-1s identical to baseline
  (includes the Correction record, F1-D Decision, F-1 Decision, D11-H record)
Commit / push ............. none / none
Tests / API / provider / database calls: 0
```

---

### 20. Final Classification

```text
CONFORMING WITH NON-BLOCKING NOTES
```

**Why.** The Correction formally resolves the stale F-1 §9 D3 attribution:
- It identifies the superseded text exactly and states which part remains in force.
- It states accurately that D3 does not forbid INFERRED, which the locked D3 text confirms.
- It correctly places the prohibition in the F1-D Product Owner decision.
- It preserves the ResearchSignal classification semantics.
- It keeps D11 §6.3's substantive check separate from the source of the prohibition.
- It alters no D0–D11 or F1-A to F1-F decision.

**The notes are non-blocking:**
- N-A: the unaddressed descriptive sentence in F-1 §9;
- N-B: the historical "interaction" wording in the Preparation;
- the superseded text staying physically in the immutable F-1 Decision;
- A-12, still open and not caused by the Correction.

**Separately, and unchanged:** D11 live validation remains **NOT READY FOR LIVE
VALIDATION**, and implementation authorization remains **NOT GRANTED**.

## STOP
