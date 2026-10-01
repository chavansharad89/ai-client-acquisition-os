# Path 2 — Category Plausibility

## G-6 — Zero-Segment Determination Validity — Product Owner Decision Record

**Decision ID:** G6-PO-DEC-001
**Status:** **G6-PO-DEC-001 — DECIDED** (2026-09-27)
**Previous status:** G6-PO-DEC-001 — PREPARED / PENDING PRODUCT OWNER DECISION
**Decision (substance):** A zero-segment category-plausibility determination may not qualify as `VALID`. A `VALID` determination must contain at least one segment, and every segment must satisfy the F-1 completeness requirements.
**Authority granted by this record:** G-6 governance resolution only (see §5)
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_G6_ZERO_SEGMENT_VALIDITY_PRODUCT_OWNER_DECISION_PREPARATION.md` (sha256 `4c24c4cc9759b8bd…`), kept unchanged for traceability
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
G-6 ....................... DECIDED (G6-PO-DEC-001)
P4 ........................ DECIDED (P4-PO-DEC-001) — not altered by this record
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

This record decides G-6 only. It is a governance decision. It changes no code, test, schema,
verifier, repository, service, UI, determination, or existing governance record.

The preparation record still reads "PREPARED — PENDING PRODUCT OWNER RULING". Its text is not
edited. This record supersedes that status.

---

### 1. Decision Question

As prepared (preparation record §1):

> May a category-plausibility determination whose `segment_results` is empty (zero parsed
> segments) qualify as `VALID` under F-1 §11 item 5, and therefore, under P4-PO-DEC-001, as a
> member of the A-11 validation set?

---

### 2. Ruling

**Answer: No.**

1. A category-plausibility determination with zero segments **may not** qualify as `VALID` for the purposes of:
   - F-1 §11 item 5;
   - P4 eligibility;
   - D11 evidence;
   - the A-11 validation set.
2. A `VALID` determination must contain **at least one segment**.
3. **Every** segment of a `VALID` determination must satisfy the F-1 completeness requirements.

The ruling operates through the words "with complete fields" in F-1 §11 item 5 (preparation
record §5). A determination with no segments does not have complete fields for this purpose.

This corresponds to OPTION 1 of the preparation record §7, as stated above. The Companion §2
exclusion status named in OPTION 1 and in question 2 of the preparation record §8 is not decided
by this record.

---

### 3. P4 Interaction — P4 Unchanged

This ruling does **not** alter P4-PO-DEC-001. Its already-decided rule stands:

- F-1 implementation must precede creation of any determination intended for the A-11 validation set.
- The A-11 validation set may contain only determinations that are `VALID` under F-1 §11 item 5.
- A pre-F-1 determination cannot be used for E1, E2 or E3.

G-6 applies inside P4's test. It narrows which determinations can be `VALID`. It admits no
determination that P4 excludes.

---

### 4. Consequences of G-6

- A zero-segment determination is **ineligible** for `VALID`.
- Therefore it **cannot** enter the A-11 validation set.
- It **cannot** satisfy E1, E2 or E3.
- It **cannot** be used as a D11 validation result.
- This ruling **does not require or authorize** a code-level enforcement change.
- Any implementation change needed to enforce this governance rule mechanically requires **separate authorization**.

Answers to the preparation record §8 questions:

| # | Question | Answer |
|---|---|---|
| 1 | May a zero-segment determination qualify as `VALID` under F-1? | **No.** |
| 2 | Is mechanical enforcement intended? | Not required or authorized by this record. Any enforcement change needs separate authorization. The Companion §2 exclusion status is not decided here. |
| 3 | If yes, may it enter the A-11 set? | Not applicable. |
| 4 | Does the ruling change any D11 readiness status? | **No.** D11 remains NOT READY FOR LIVE VALIDATION. |

The optional adjacent question (reference point for "created after the F-1 implementation") is
not decided.

---

### 5. Authority Boundary

**Authority granted:** G-6 governance resolution only.

This record grants **NO** authority for:
- validation sessions;
- provider calls;
- live source fetching;
- participant sessions;
- determination creation or modification;
- E1, E2 or E3 execution;
- A-11 closure;
- F-1 implementation, including any zero-segment check in code;
- modification of the schema, verifier, repository, service, UI or tests;
- Companion Record or D11-H modification;
- modification of the D11 Facilitator Record, the A-11 matrix, P4-PO-DEC-001, the G-6 preparation record, or any other existing governance record.

---

### 6. Status

```text
G-6 ....................... DECIDED
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

No other authority is granted.

## STOP
