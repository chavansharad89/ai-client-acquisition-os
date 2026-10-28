# PATH 2 — CATEGORY PLAUSIBILITY

## P4 — Determination Eligibility for A-11 E1 — Product Owner Decision Record

**Decision ID:** P4-PO-DEC-001
**Status:** **DECIDED** (2026-09-27; see §8)
**Decision (substance):** F-1 implementation must precede creation of any determination intended for the A-11 validation set; the A-11 validation set contains only F-1 §11 item 5 `VALID` determinations.
**Authority granted by this record:** NONE beyond resolving P4 (see §8.4)
**Parent record:** `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md` (VS-PO-DEC-001), §4 precondition P4
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
A-11 ...................... OPEN
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-12 ...................... CLOSED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
F-1 IMPLEMENTATION ........ NOT AUTHORIZED (except the completed A11-P1 M-2 scope)
VALIDATION SESSION ........ NOT AUTHORIZED — VS-PO-DEC-001 PENDING
P4 ........................ DECIDED — F-1 implementation must precede any A-11 validation-set determination
```

This record decides P4 only. §1–§7 are the preparation content as drafted and are kept unchanged for traceability; the decision is in §8. It does not perform, schedule or authorize a validation session, and it creates no determination.

No equivalent P4 decision record existed before this one.

---

## 1. Decision question

> Whether an A-11 validation session may produce an E1-qualifying determination under the currently authorized M-2/Q-1 scope, or whether F-1 implementation must precede that validation session.

---

## 2. Current evidence

Repository-supported facts only.

| # | Fact | Source |
|---|---|---|
| 1 | M-2 (store model-seen source text at the model-input boundary) is implemented. | A-11 matrix §1, §2 P2 |
| 2 | T6 and T6.1–T6.7 PASS. | A-11 matrix §2 P3 |
| 3 | Q-1 is implemented: an authenticated, owner-scoped, read-only retrieval path for persisted source documents; Q1-T1–Q1-T8 PASS. Q-1 closure remains a separate Product Owner determination. | VS-PO-DEC-001 §2 item 4; A11-PO-DEC-003 §4 |
| 4 | E1 requires actual validation-session source evidence. "A T6 fixture does not satisfy E1." | A-11 matrix §3 E1 |
| 5 | No qualifying validation-session determination exists. D11-H §1, Companion §1 Session Link and Companion §2 Determination Register are blank. | VS-PO-DEC-001 §1, §2 item 1 |
| 6 | D11 is NOT READY FOR LIVE VALIDATION. | Gate Audit §13; A-11 matrix header |
| 7 | F-1 is DECIDED; implementation authorization NOT GRANTED, except the specifically authorized A11-P1 M-2 scope. | F-1 Evidence Decision §1, §19; A-11 matrix header |
| 8 | The validation-session decision (VS-PO-DEC-001) is PENDING, option selected NONE. | VS-PO-DEC-001 §9 |
| 9 | The F-1 evidence contract (per-segment `confidence`, `basis`, `classification`) is not present in application code: no occurrence of the F-1 basis values `CITED_SOURCE_EVIDENCE` or `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` exists under `packages/` or `apps/`. No record states that the M-2 implementation is "the F-1 implementation" for F-1 §11 item 5. | Read-only search at drafting; F-1 Evidence Decision §13; M-2 decision "does not bundle M-2 with F-1" |
| 10 | The M-2 and Q-1 implementations and migrations 0027/0028 exist as uncommitted working-tree changes on top of HEAD `5992b82`. | VS-PO-DEC-001 §2 item 7 |

Consequence of facts 7 and 9, as a reading of existing definitions only: a determination created today would lack `basis` and would therefore be a legacy row (F-1 §11 item 1) and `EXCLUDED / PRE-F1` under Companion §2.

---

## 3. P4 rule

### 3.1 Authoritative rule

| Field | Value |
|---|---|
| Artifact | `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` |
| Section | §11 "F1-F Decision — Persistence / Backward Compatibility", item 5 (summarized again in §17) |
| Classification | **Product Owner decision** (record status "F-1 STATUS: DECIDED"). Authoritative. It does not itself authorize implementation (§19). |
| Wording | "**D11 validation validity:** only determinations created after the F-1 implementation, with complete fields, are validation-valid. Legacy rows may not be used to satisfy any D11 coverage item, evidence check, or spot-check." |
| Related definition | §11 item 1: "A legacy row is any determination row whose segment objects lack `basis`." |

### 3.2 Records that transcribe or apply the rule

| Artifact / section | Wording | Classification |
|---|---|---|
| `PATH_2_CATEGORY_PLAUSIBILITY_A12_SECTION_6_3_COMPANION_RECORD.md` §2 "Determination Register", "Validation status values (F-1 §11 item 5)" | "`VALID` — created after F-1 implementation, with complete fields." / "`EXCLUDED / PRE-F1` — created before F-1 implementation (legacy row)." / "`EXCLUDED — NOT VALIDATION-VALID` — created after F-1 implementation but with incomplete fields." Rule: an excluded determination's segments "are not assessed in §4 or §5 and do not enter any result in §6." | Facilitator instrument transcribing F-1 §11 item 5. Not an independent source of authority. |
| Companion §8 AMB-2, AMB-4 | Both exclusion markers are used; pre-F1 rows are read as entering "no §6 result and no D11 coverage". | Recorded ambiguity handling; "None; recorded only". |
| `PATH_2_CATEGORY_PLAUSIBILITY_A11_PRODUCT_OWNER_DECISION_D1_D4_Q1_Q2_NORMALIZATION.md` (A11-PO-DEC-003) §3 "D-4 — No Source Supplied" | "For A-11 evidence purposes: a determination intended to qualify as `VALID` must have the required captured source evidence; absence of required capture rows is an E1 failure; such a determination cannot satisfy E1–E3". | Product Owner decision. Sets a source-capture requirement for `VALID`-intended determinations. It does **not** state that a non-`VALID` determination is ineligible for E1. |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md` §11 item 2 | "F-1 disposition: decide how D11 §6.3 (confidence/basis) will be satisfied. Without that decision, no session can reach PASS." | Audit observation (live-validation prerequisite). Creates no authorization. |
| `PATH_2_CATEGORY_PLAUSIBILITY_A11_CLOSURE_EVIDENCE_MATRIX.md` §3 E1 | "For each determination included in the authorized A-11 validation set, provide the actual persisted model-seen source record(s) …" Acceptance: "PASS only if the captured source evidence is available and traceable for every required determination in the validation set." | Evidence matrix. Defines E1 without reference to `VALID` status. Does not define membership of "the authorized A-11 validation set". |

### 3.3 What the rule does and does not settle

**Settled by existing authority (not reinterpreted here):**

1. A determination is D11-validation-valid only if created after the F-1 implementation with complete fields (F-1 §11 item 5).
2. A legacy/PRE-F1 determination may not satisfy any D11 coverage item, evidence check or spot-check (F-1 §11 item 5).
3. An excluded determination is not assessed in Companion §4 (substantive §6.3) or §5, and enters no §6 result (Companion §2 Rule).
4. E3 requires a §6.3 finding that "satisfies the Companion Record requirements" (A-11 matrix §5), and E2 is the §6.4 spot-check (A-11 matrix §4). Read with items 2 and 3, a PRE-F1 determination cannot supply E2 or E3 evidence.

**Not settled by any record found:**

5. Whether **E1 alone** (persisted, traceable, Q-1-retrievable model-seen source) may be supplied by a determination classified `EXCLUDED / PRE-F1`. The E1 text does not mention validation status; F-1 §11 item 5 speaks of "D11" checks; A11-PO-DEC-003 §3 addresses `VALID`-intended determinations only; and no record defines who decides, or on what criteria, membership of "the authorized A-11 validation set".
6. Whether E1 evidence from a PRE-F1 determination would have any closure value, given that E2 and E3 depend on E1 (A-11 matrix §6) and cannot use that determination (items 2–4).

**Finding.** The repository does not contain an explicit rule adopting Interpretation A (M-2/Q-1 persistence is sufficient for E1 even if the determination is `EXCLUDED / PRE-F1`). It contains an explicit rule excluding PRE-F1 determinations from D11 checks and from the Companion §6.3 substantive assessment, which blocks E2/E3 for such determinations, but it does not explicitly extend that exclusion to E1. On E1 eligibility specifically, the records are ambiguous (Interpretation C). This record does not resolve that ambiguity.

---

## 4. Concept separation

These four concepts are distinct. None of them determines another by itself.

| # | Concept | Governing record | Current state |
|---|---|---|---|
| 1 | **F-1 implementation authorization** — whether the F-1 evidence contract (§13–§16) may be implemented. | F-1 Evidence Decision §19 | NOT GRANTED (M-2 scope excepted; M-2 does not implement the F-1 contract) |
| 2 | **Determination classification / validity** — `VALID`, `EXCLUDED / PRE-F1`, `EXCLUDED — NOT VALIDATION-VALID`. A property of each persisted determination. | F-1 §11 items 1 and 5; Companion §2 | No determination exists. Any determination created before F-1 implementation would be `EXCLUDED / PRE-F1`. |
| 3 | **D11 live-validation readiness** — whether a D11 session may be scheduled. | Gate Audit §11, §13; D11 Decision §10 | NOT READY FOR LIVE VALIDATION |
| 4 | **A-11 E1 evidence eligibility** — whether a determination's persisted model-seen source may count toward E1. | A-11 matrix §3 E1; A11-PO-DEC-003 §3 | Not defined for non-`VALID` determinations — this is P4 |

**Is `M-2 source persistence + Q-1 retrieval` sufficient for E1 if the determination is `EXCLUDED / PRE-F1`?** The repository does not say. It is recorded here as unresolved governance, not answered.

---

## 5. Alternatives

Listed without ranking. None is selected.

### P4-A — M-2/Q-1 evidence eligibility

A determination created during a properly authorized validation session may supply E1 evidence if the determination and its source records satisfy the A-11 E1 requirements (A-11 matrix §3; A11-PO-DEC-003 §3), even though general F-1 implementation remains unauthorized.

If selected, the Product Owner must state explicitly:

* whether a determination classified `EXCLUDED / PRE-F1` may be used for E1 (this record does not presume either answer);
* that such a determination remains `EXCLUDED / PRE-F1` in the Companion and, under F-1 §11 item 5 and Companion §2, still cannot supply E2, E3, any D11 coverage item, evidence check or spot-check — unless the Product Owner separately and explicitly amends that authority;
* how "the authorized A-11 validation set" (A-11 matrix §3 E1) is defined for this purpose.

### P4-B — F-1 prerequisite

F-1 implementation must be separately authorized and completed before a validation-session determination can qualify for E1. Only a `VALID` determination (F-1 §11 item 5) may enter the A-11 validation set.

Under this alternative, no live validation session should be authorized for E1 purposes until F-1 is separately authorized and completed.

### P4-C — Governance ambiguity remains

The existing records do not establish whether A-11 E1 evidence eligibility can be separated from F-1 determination validity. P4 stays unresolved.

The additional Product Owner decision required: **an explicit ruling on whether membership of "the authorized A-11 validation set" (A-11 matrix §3 E1) requires Companion §2 status `VALID`, or may include determinations classified `EXCLUDED / PRE-F1`; and, if the latter, what closure value such E1 evidence has given that E2 and E3 cannot use those determinations.**

---

## 6. Consequence mapping

This table describes consequences. It is not an authorization.

| P4 outcome | D11 | Validation session | E1 |
|---|---|---|---|
| P4-A | unchanged unless separately authorized | requires separate authorization (VS-PO-DEC-001) | potentially eligible once session evidence exists |
| P4-B | unchanged unless separately authorized | blocked pending F-1 | blocked |
| P4-C | unchanged | blocked | blocked |

Under every outcome, E2 and E3 remain OPEN and A-11 remains OPEN until their own evidence and authorizations exist.

---

## 7. Authority boundary

### This record grants NO authority for:

* D11 readiness or reclassification;
* live provider calls;
* live source fetching;
* participant validation;
* creation of a validation-session determination;
* modifying the A-12 Companion Record;
* modifying D11-H;
* E1 execution;
* E2 execution;
* E3 execution;
* A-11 closure;
* general F-1 implementation.

This record only prepares the Product Owner to resolve **P4 determination eligibility**. It does not decide VS-PO-DEC-001, does not rule on P3 or P10, does not amend F-1 §11 item 5, and does not close Q-1.

D11 remains **NOT READY FOR LIVE VALIDATION** unless a separate explicit authorization says otherwise.

---

## 8. Product Owner decision

```text
STATUS ............ DECIDED
DECISION .......... F-1 IMPLEMENTATION MUST PRECEDE ANY A-11 VALIDATION-SET DETERMINATION
AUTHORITY GRANTED . NONE BEYOND RESOLVING P4
```

**Source of decision.** Explicit Product Owner instruction given on 2026-09-27, recorded here as an authorized update to this record. Before recording it, a read-only search of `requirement/` confirmed that no other Product Owner ruling resolved P4.

**Label note.** This decision is stated by substance only. The alternative letters in §5 of this record and in `PATH_2_CATEGORY_PLAUSIBILITY_P4_DETERMINATION_ELIGIBILITY_PRODUCT_OWNER_DECISION_PREPARATION.md` §1.1 use opposite mappings. For traceability only: the substance decided corresponds to §5 "F-1 prerequisite" of this record, and to "F-1 implementation must precede the validation session" in the preparation record. The letters carry no decision weight.

### 8.1 Substantive decision

1. **F-1 implementation must precede creation of any determination intended for the A-11 validation set.**
2. **The A-11 validation set must contain only determinations that are `VALID` under F-1 §11 item 5** — determinations created after F-1 implementation, with complete fields.
3. **A determination created under the current M-2/Q-1 state, before F-1 implementation, may NOT be used to satisfy E1** as part of the authorized A-11 validation set.

This resolves the question in §1 and the ambiguity recorded in §3.3 items 5–6 and §4: A-11 E1 evidence eligibility is **not** separable from F-1 determination validity. `M-2 source persistence + Q-1 retrieval` is **not** sufficient for E1 when the determination is `EXCLUDED / PRE-F1`.

It does not amend F-1 §11 item 5, the A-11 matrix, the Companion Record or any other record.

### 8.2 Consequences

| Item | Consequence |
|---|---|
| **E1** | Remains **BLOCKED** until a post-F-1 `VALID` determination exists and its M-2 source documents can be retrieved through Q-1. |
| **E2** | Requires a post-F-1 `VALID` determination. Remains **OPEN**. |
| **E3** | Requires a post-F-1 `VALID` determination. Remains **OPEN**. |
| **PRE-F1 / EXCLUDED determinations** | No `EXCLUDED / PRE-F1` or `EXCLUDED — NOT VALIDATION-VALID` determination may satisfy E1, E2 or E3. |
| **M-2 / Q-1** | Remain valid infrastructure. They do not themselves create an eligible validation determination. |
| **D11** | **Must remain NOT READY FOR LIVE VALIDATION.** This decision does not transition D11. |
| **A-11** | Remains **OPEN**. |
| **VS-PO-DEC-001** | P4 is resolved. The validation-session decision itself remains PENDING and is not decided here. |

### 8.3 Dependencies recorded (not performed)

These later actions follow from the decision. Each needs its own explicit authorization. None is performed or authorized here.

1. A separate Product Owner authorization of F-1 implementation (F-1 Evidence Decision §19), then completion and conformance of that implementation.
2. A separate D11 readiness decision reclassifying D11 from NOT READY FOR LIVE VALIDATION, after its recorded blockers are resolved (VS-PO-DEC-001 §4).
3. A separate validation-session authorization (VS-PO-DEC-001), which must be given after F-1 implementation if the session is to produce A-11 validation-set determinations.
4. Creation, within that authorized session, of post-F-1 `VALID` determinations, with M-2 source captured and retrievable through Q-1.
5. Separate authorizations for E1, E2 and E3 execution, and later for any A-11 closure decision.
6. Any update to VS-PO-DEC-001 to record that P4 is resolved requires its own authorized edit; that record is not changed by this decision.

### 8.4 Authority

**Granted:** resolution of P4 only, as stated in §8.1.

**Withheld.** This decision does NOT:

* authorize general F-1 implementation;
* authorize a validation session;
* transition D11 to READY FOR LIVE VALIDATION;
* authorize provider calls;
* authorize live source fetching;
* authorize participant validation;
* authorize creation of a validation determination;
* authorize E1, E2 or E3 execution;
* authorize A-11 closure;
* authorize modification of the A-11 matrix, D11-H, the D11 Facilitator Record, the Companion Record, F-1 records, VS-PO-DEC-001, or the M-2/Q-1 implementations.

| Field | Value |
|---|---|
| Decision (substance) | F-1 implementation must precede creation of any determination intended for the A-11 validation set |
| May an `EXCLUDED / PRE-F1` determination supply E1? | **NO** |
| Definition of "the authorized A-11 validation set" | Only determinations `VALID` under F-1 §11 item 5 (created after F-1 implementation, with complete fields) |
| Must F-1 implementation precede the validation determination? | **YES** |
| D11 transition | **NONE** — remains NOT READY FOR LIVE VALIDATION |
| Product Owner | Product Owner (explicit instruction, recorded 2026-09-27) |
| Date | 2026-09-27 |

---

## 9. Status after this record

```text
P4 ........................... DECIDED — F-1 implementation must precede any A-11 validation-set determination
Validation-session decision .. PENDING (VS-PO-DEC-001)
D11 .......................... NOT READY FOR LIVE VALIDATION
F-1 implementation ........... NOT AUTHORIZED (except completed M-2 scope)
E1 ........................... BLOCKED
E2 ........................... OPEN
E3 ........................... OPEN
A-11 ......................... OPEN
A-12 ......................... CLOSED
```

## STOP
