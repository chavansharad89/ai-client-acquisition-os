# Path 2 — Category Plausibility

## F-1 §9 Correction: Where the Segment `INFERRED` Prohibition Comes From

### 1. Status

```text
STATUS: DECIDED / CORRECTED
D0–D11: IMMUTABLE
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This is a governance correction record. It formally supersedes one inaccurate statement
in `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` §9: the statement that
D3 is the source of the prohibition on `INFERRED`.

It does not edit that document or any other existing document. It introduces no new
product decision.

**Authoritative basis:**
- the locked D3 text: `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md`, "D3 — Evidence Sufficiency";
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` §9;
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` §2, §5, §7, §8, §10;
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_CONFORMANCE_REVIEW.md` §5.3 (C-2);
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_CONSOLIDATED_CONFORMANCE_AUDIT.md` §4, §18 (A-13);
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` §6.3.

---

### 2. Superseded Statement

**Location:** `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md`, §9 ("F1-D
Decision — Classification"), first bullet after the mapping table. The bullet reads in
full:

> **`INFERRED` is not permitted for segments.** An INFERRED MATCH/MISMATCH would be an
> outcome without cited evidence. D3 and the current schema route that case to UNKNOWN,
> so allowing INFERRED would conflict with D3's evidence-sufficiency rules.

**What is superseded:** the bullet's attribution of the prohibition to D3. That is:
- the clause "D3 and the current schema route that case to UNKNOWN", insofar as it presents D3 as a ground for the prohibition;
- the conclusion "so allowing INFERRED would conflict with D3's evidence-sufficiency rules".

**What is not superseded:**
- The outcome stated in the bullet's lead sentence, "`INFERRED` is not permitted for segments", remains in force.
- Its source is now as recorded in §3 and §4 below.

**Out of scope:** the "exactly the OBSERVED obligation" wording in the same §9 table. The
F1-D Product Decision (§5, §10) already addressed it, and this record does not re-correct
it.

---

### 3. Authoritative Correction

**D3 does not itself forbid INFERRED.**

The locked D3 text contains the following rules:
- first-party website evidence is primary;
- search-derived business metadata is supporting;
- weak snippets "must not independently establish a definitive MATCH/MISMATCH";
- "A definitive MATCH/MISMATCH requires evidence specific enough to support the determination";
- "Insufficient evidence → **UNKNOWN**, never a default MISMATCH";
- "No new evidence-tier taxonomy beyond the above is introduced."

It contains no OBSERVED-only rule, and it does not mention `INFERRED`.

**The prohibition of INFERRED for category-plausibility segment classification is
established by the F1-D Product Owner decision.**

- **Source:** `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` §2.2 and §7.
- **What it records:** the exclusion is a Product Owner choice made under F-1. The F1-D decision describes the choice as consistent with D3 but not derived from it.

---

### 4. F1-D Authority

`PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` is the authoritative
source for the semantics of category-plausibility segment classification:

| Value | Status |
|---|---|
| `OBSERVED` | Feature-local meaning defined by F1-D §5: the MATCH/MISMATCH verdict is grounded in its cited, verbatim-verified, first-party quotes, which directly state the verdict or contain every premise for it. The verdict depends on no uncited premise. |
| `UNKNOWN` | Feature-local meaning defined by F1-D §5: the segment has no MATCH/MISMATCH verdict. |
| `INFERRED` | **Not permitted** for this feature-local field (F1-D §7). |

The classification is code-derived. MATCH/MISMATCH map to `OBSERVED`, and UNKNOWN maps to
`UNKNOWN`. It uses a separate two-member type (F1-D §9).

---

### 5. Existing Classification Semantics — Preserved

The existing research-signal classification `OBSERVED / INFERRED / UNKNOWN` is
**unchanged**. This covers:
- the `Classification` type, `CLASSIFICATIONS` and `classificationSchema` in `packages/core-research/src/schema.ts`;
- the obligations and prompt text attached to them;
- `isEvidentiary()`.

F1-D does not change that type or that meaning, and neither does this correction. The
feature-local segment classification must not be conflated with it.

---

### 6. D11 §6.3

D11 §6.3 remains applicable. Its text reads: "Confidence and basis fields are populated
and consistent with the claim's classification (OBSERVED vs. INFERRED)".

For category-plausibility segments it is applied as F1-D §8 records:
- **Substantive check.** The facilitator determines whether the cited evidence actually supports the verdict. The facilitator does **not** rely on the stored feature-local `OBSERVED` label to decide this.
- **Unquoted premises.** If the verdict requires a premise that is not present in any cited quote, it does not satisfy the F1-D definition of feature-local `OBSERVED`. It is recorded as a §6.3 failure for that segment.

This requirement comes from D11 §6.3 as applied by F1-D. It is **not** a D3 requirement.

---

### 7. Scope of Correction

This correction:
- changes no implementation;
- changes no schema;
- changes no test;
- changes no migration;
- changes no UI;
- changes no provider behavior;
- changes no D0–D11 decision;
- changes no F1-A, F1-B, F1-C, F1-E or F1-F decision, and does not alter F1-D;
- changes no existing governance document, including the F-1 Product Decision, the F1-D Product Decision, and the D11-H facilitator record;
- **only corrects where the F1-D `INFERRED` prohibition comes from.**

---

### 8. Governance Precedence

- **Category-plausibility segment classification:** F1-D governs.
- **Existing research-signal classification semantics:** the existing research-signal governance and code contract governs.
- **D3** must not be cited as the reason for prohibiting `INFERRED` in the F-1 segment field.
- **Where F-1 Product Decision §9 and this record differ** on where the prohibition comes from, this record governs.

---

### 9. Remaining Implementation Status

```text
F1 IMPLEMENTATION: NOT AUTHORIZED
D11 LIVE VALIDATION: NOT READY
```

This correction does not authorize implementation, does not start D11, and does not
change the Live Validation Gate classification. The other open items recorded in the F-1
Consolidated Conformance Audit §18 are not addressed here, including A-12.

---

### 10. Safety Verification

**Before creating this document:**

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --short ........ 106 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
Untracked files hashed .... 58 (stored outside the repository)
Target file ............... absent
```

**After creating it:**

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 106 → 107 lines (+ this document only)
Pre-existing untracked files: all 58 SHA-1s identical to baseline
Commit / push ............. none / none
Tests / API / provider / database calls: 0
```

## STOP
