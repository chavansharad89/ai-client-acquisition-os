# Path 2 — Category Plausibility

## G-6 — Zero-Segment Determination Validity — Product Owner Decision Preparation

**Decision ID:** G6-PO-DEC-001
**Status:** **PREPARED — PENDING PRODUCT OWNER RULING**
**Option selected:** NONE
**Authority granted by this record:** NONE
**Source finding:** `PATH_2_CATEGORY_PLAUSIBILITY_F1_OPEN_GAP_D11_READINESS_ASSESSMENT.md` (F1-GAP-D11-ASSESS-001) §2, §3
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
G-6 ....................... UNRESOLVED — PRODUCT OWNER RULING REQUIRED
P4 ........................ DECIDED (P4-PO-DEC-001) — not altered by this record
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

This record prepares one question for a Product Owner ruling. It decides nothing, and it changes
no code, test, schema, migration, UI, determination, or existing governance record.

---

### 1. Decision Question

> May a category-plausibility determination whose `segment_results` is empty (zero parsed
> segments) qualify as `VALID` under F-1 §11 item 5, and therefore, under P4-PO-DEC-001, as a
> member of the A-11 validation set?

**How a zero-segment determination arises.** It arises when the Search's `targetCustomer` is
empty, whitespace-only, or all-delimiter:
- `parseTargetSegments` returns `[]`;
- the determination is persisted with `target_segments = []` and `segment_results = []`;
- the aggregate is `UNKNOWN`.

Sources: F-1 §10, final table row; D11-H "Target segments reaching Research" and aggregation rule; `categoryPlausibility.ts` `parseTargetSegments`, `aggregateCategoryFit`.

---

### 2. Sources Reviewed

| Record | Sections used | sha256 (first 16) |
|---|---|---|
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1) | §10, §11, §13, §14, §17 | `ba4e6a73ef73fc3e` |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION_D3_CORRECTIONS.md` | — | **Not present** in the repository |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md` (the existing F-1 correction record) | §2–§8 | `5233826fcf47c32d` |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_CONFORMANCE_REVIEW.md` | Note N-5 | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_P4_DETERMINATION_ELIGIBILITY_PRODUCT_OWNER_DECISION.md` (P4-PO-DEC-001) | §3, §8 | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_IMPLEMENTATION_CONFORMANCE_AUDIT.md` (F1-IMPL-AUDIT-001) | §5 G-6 | `0ce6b8bf7fff5d50` |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_OPEN_GAP_D11_READINESS_ASSESSMENT.md` (F1-GAP-D11-ASSESS-001) | §2, §3 | `d877ea44ebfc35f6` (unchanged) |
| `PATH_2_CATEGORY_PLAUSIBILITY_A12_SECTION_6_3_COMPANION_RECORD.md` (Companion) | §2, §3, §6 | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` (D11-H) | Target-segment and aggregation sections | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (D11) | §3, §4, §6, §10 | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md` (Gate Audit) | §11, §13 | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md` (VS-PO-DEC-001) | §4 | unchanged per manifest |
| `PATH_2_CATEGORY_PLAUSIBILITY_A11_CLOSURE_EVIDENCE_MATRIX.md` (A-11 matrix) | E1–E3 | unchanged per manifest |

The only existing F-1 correction record, `F1_D3_INFERRED_CORRECTION`, concerns the source of the
segment `INFERRED` prohibition. It does not address segment count or determination completeness.

---

### 3. Current Implementation Fact (A)

1. **The completeness function is segment-level.**
   - `isF1CompleteSegmentDetermination(result)` (`packages/core-research/src/categoryPlausibility.ts`) takes **one** `StoredSegmentDetermination`.
   - It returns `false` for a segment missing any F-1 field or violating F-1 §14 rule 5.
2. **A zero-segment determination has no segment that can fail that check.**
   - Applied per segment, the function is never invoked for `segment_results = []`.
   - Lifted to a determination as `segmentResults.every(isF1CompleteSegmentDetermination)`, it returns `true` vacuously.
3. **No production code performs a whole-determination completeness check.**
   - The function is exported and called only in tests (`categoryPlausibility.test.ts`, `service.test.ts`).
   - No code computes `VALID`. `VALID` is recorded by the facilitator in the Companion §2 Determination Register.
4. **Related Companion behaviour.** The Companion §6 structural session result reads "`PASS` only if every VALID segment in §3 is `PASS`". A session whose only `VALID` determination had zero segments would satisfy that rule vacuously (F1-GAP-D11-ASSESS-001 §3).
5. **No code change is authorized by this task.** None was made.

---

### 4. Contract Question (B)

Which of the four statements does the authoritative F-1 contract make?

| # | Statement | Found in F-1? | Evidence |
|---|---|---|---|
| 1 | Every `VALID` determination must contain at least one segment | **No** | §11 item 5 says only "determinations created after the F-1 implementation, with complete fields, are validation-valid". It sets no minimum segment count. |
| 2 | A zero-segment determination is invalid | **No** | §10 treats zero segments as an ordinary outcome: "`segment_results = []`, aggregate UNKNOWN, as today. There is nothing per segment to record." It is not described as invalid. |
| 3 | Zero-segment determinations are formally undefined | **Not in the F-1 decision itself.** Stated in the F-1 Conformance Review. | N-5: "a row with **zero segments** … has no segment objects, so the rule cannot tell legacy from post-change. … Its validation status is nonetheless formally undefined." N-5 also states such a row "cannot satisfy any D11 coverage item", and classes it "Non-blocking". The Review is a conformance record, not a Product Owner decision. |
| 4 | The contract is silent | **Yes, on validity** | F-1 §10–§17 define completeness only through segment objects: §11 item 1 ("segment objects lack `basis`"), §13 (per-segment table), §14 rule 5 (per-segment consistency). None of these provisions addresses a determination with no segment objects. |

**Finding.**
- The F-1 decision is **silent** on whether a zero-segment determination can be `VALID`.
- The only record to characterize the question, F-1 Conformance Review N-5, calls it "formally undefined".
- This record does not infer a requirement from either.

A related point, recorded but not decided here: F-1 §11 item 1 defines a legacy row through its
segment objects. For a zero-segment determination, neither "legacy" nor "complete fields" can be
read from the row. Companion §2 asks the facilitator to answer both "Created after F-1
implementation (YES / NO)" and "All F-1 fields complete (YES / NO)" per determination. For such a
row the second column has no stated answer. The first depends on a reference point for "the F-1
implementation" that no record fixes. The implementation exists as uncommitted working-tree
changes on HEAD `5992b82`.

---

### 5. P4 Interaction (C)

**P4-PO-DEC-001 §8.1, substance preserved exactly:**
1. "F-1 implementation must precede creation of any determination intended for the A-11 validation set."
2. "The A-11 validation set must contain only determinations that are `VALID` under F-1 §11 item 5 — determinations created after F-1 implementation, with complete fields."

**The distinction:**

| Question | Governing record | Status |
|---|---|---|
| Which determinations are eligible for the A-11 validation set | **P4**: only `VALID` under F-1 §11 item 5 | DECIDED; unchanged |
| Whether a zero-segment determination can satisfy the `VALID` condition ("with complete fields") | **G-6**: this question | UNRESOLVED |

**How they interact.**
- P4 makes set membership depend on F-1 §11 item 5.
- G-6 asks how §11 item 5's completeness condition applies to a determination with no segments. G-6 therefore sits inside P4's test, and does not replace it.
- Any G-6 ruling operates only through the words "with complete fields".
- It cannot admit a pre-F-1 determination. It cannot admit a determination that fails any other F-1 requirement. It cannot change P4's rule that F-1 implementation precedes creation of any validation-set determination.

**This record does not alter P4.**

---

### 6. D11 Interaction (D)

Does any D11 gate explicitly require a non-empty determination?

| Point | Explicit non-empty requirement? | Evidence |
|---|---|---|
| Scheduling a validation session | **No** | D11 §10 and Gate Audit §11/§13 prerequisites (D11-I, runtime, session design, participant, etc.) do not mention segment count. Gate Audit §11.4 asks the session to "pre-plan a compound (≥2 segment) `targetCustomer`". That is a session-design preparation item for exercising D2 aggregation. It is not an eligibility rule for determinations. |
| Creating a `VALID` determination | **No** | Companion §2 defines `VALID` by F-1 §11 item 5 alone. VS-PO-DEC-001 §4 P4, P11 and P12 add no segment-count condition. |
| Performing E1 / E2 / E3 | **No** | E1 (A-11 matrix): captured source evidence "for each determination included in the authorized A-11 validation set". There is no segment condition. E2/E3 operate on OBSERVED claims and on §6.3 segments; they require segments to produce findings, but no record states that a zero-segment determination is excluded from the set. |
| Full D11 sign-off | **No** | D11 §3 and §4 coverage items refer to segment-level outcomes (MATCH, MISMATCH, UNKNOWN with recorded insufficiency, multiple segments, first-party evidence). No item states that a zero-segment determination is ineligible. F-1 Conformance Review N-5 asserts that such a row "cannot satisfy any D11 coverage item". That is a conformance-record observation, not a gate rule. |

**Finding.**
- The records do not establish an explicit non-empty requirement at any of the four points.
- A zero-segment determination could contribute no segment-level finding to E2, E3, or the segment-based D11 coverage items. Whether it may nonetheless be a validation-set member, and thereby enter E1 or the Companion's vacuous §6 structural result, is exactly the question left unresolved.

---

### 7. Alternatives (E)

The alternatives are presented without recommendation, ranking or selection. None is preferred by
this record.

#### OPTION 1 — Zero-segment determinations cannot be `VALID`

- A `VALID` determination under F-1 §11 item 5 must contain at least one segment.
- A zero-segment determination is not `VALID`, and is therefore ineligible for the A-11 validation set under P4.
- The facilitator records it in Companion §2 with an exclusion status. Which existing status applies, or whether one needs to be named, is part of the ruling.
- If the Product Owner expects the repository to enforce this mechanically, a future, separately authorized implementation and test change may be required. This record authorizes none.

#### OPTION 2 — Zero-segment determinations may be `VALID`

- The absence of segments does not by itself invalidate a determination.
- `VALID` eligibility continues to depend only on the requirements explicitly established by F-1 §11 item 5: created after the F-1 implementation, with complete fields. Under this option, a zero-segment determination has no field that can be incomplete.
- Such a determination may be included in the A-11 validation set if every other P4/F-1 requirement is met.
- It contributes no segment to Companion §3–§5. The Companion §6 structural session rule would be satisfied vacuously by it. Whether that is acceptable is part of the ruling.
- No implementation change is authorized by this record.

#### OPTION 3 — Zero-segment eligibility is left explicitly unresolved

- The question is recorded as a governance ambiguity and not answered now.
- Until a later ruling resolves it, a zero-segment determination may **not** be used for A-11 evidence (E1, E2 or E3) or counted toward any D11 result.
- No implementation change is authorized.

---

### 8. Product Owner Questions (F)

The ruling must answer:

1. **May a determination with zero segments qualify as `VALID` under F-1?**
2. **If not:** does the Product Owner intend that requirement to be mechanically enforced by implementation? If yes, that implementation needs its own separate authorization. And which Companion §2 status records such a determination?
3. **If yes:** may such a determination be included in the A-11 validation set, provided all other P4/F-1 requirements are satisfied? And is the vacuous Companion §6 structural result acceptable for it?
4. **Does the ruling change any existing D11 readiness status?**

   For reference, no D11 gate currently depends on this question (§6). D11's recorded blockers, such as D11-I (Gate Audit §13.1; VS-PO-DEC-001 P2), are independent of it.

Related and optional. It is not required to decide G-6, but it is adjacent (§4):
- whether the Product Owner wishes to fix the reference point for "created after the F-1 implementation" used in Companion §2.

---

### 9. Status Preserved

```text
G-6 ....................... UNRESOLVED — PRODUCT OWNER RULING REQUIRED
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
P4 ........................ DECIDED (P4-PO-DEC-001), unchanged
```

The A-11 matrix header still shows E1 as "OPEN". It predates P4-PO-DEC-001 §8.2, which set E1 to
**BLOCKED** without editing the matrix. This record follows P4-PO-DEC-001 and does not edit the
matrix.

---

### 10. Authority Boundary

Creating this record grants **NO** authority for:
- F-1 implementation changes, including any zero-segment check;
- D11 readiness transition;
- validation-session execution;
- provider calls;
- live source fetching;
- participant interaction;
- determination creation or modification;
- E1, E2 or E3 execution;
- A-11 closure;
- Companion Record updates;
- D11-H updates;
- modification of P4-PO-DEC-001, VS-PO-DEC-001, the A-11 matrix, the F-1 records, or any other existing governance record.

---

### 11. Repository Safety

**Before writing:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --porcelain .... 136 lines (sha256 253dc858…f858c80e)
Tracked diff sha256 ....... 99bb951f…2585991
git diff --check .......... clean
G-6 assessment ............ sha256 d877ea44…193f209 (unchanged since creation)
Modified + untracked ...... 136 files hashed, stored outside the repository
```

No test, typecheck, build, Docker, Postgres, browser, or provider command was run. The after-state
is verified at creation and reported with this record.

## STOP
