# PATH 2 — CATEGORY PLAUSIBILITY

## A-11 CLOSURE EVIDENCE MATRIX — POST-T6 UPDATE

**Document:** `PATH_2_CATEGORY_PLAUSIBILITY_A11_CLOSURE_EVIDENCE_MATRIX.md`
**Status:** UPDATED EVIDENCE MATRIX
**A-11 Status:** **OPEN**
**Related decision:** A11-P1-PO-DEC-002 — M-2 selected
**Related implementation authorization:** A11-P1 M-2 implementation authorization
**Related execution authorization:** A11-T6-EXEC-AUTH-001

```text
A-11 ...................... OPEN
A-12 ...................... CLOSED
F-1 IMPLEMENTATION ........ NOT AUTHORIZED (except the completed, specifically authorized A11-P1 M-2 scope)
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
```

> The A11-P1 M-2 implementation authorization was limited to its stated scope. It does not grant general F-1 implementation authority.

---

## §0. Purpose and scope

This update reconciles the A-11 closure evidence matrix with the completed M-2 implementation and authorized T6 real-PostgreSQL verification.

It records:

* M-2 source-text persistence as implemented;
* T6 and T6.1–T6.7 as complete;
* the resulting technical evidence available for A-11;
* the remaining A-11 closure evidence requirements E1, E2 and E3.

This update does **not** close A-11.

The matrix continues to distinguish technical infrastructure verification from the actual validation-session evidence required for A-11 closure.

## §0.1 Authoritative A-11 definition

The authoritative definition of A-11 is in `PATH_2_CATEGORY_PLAUSIBILITY_F1_CONSOLIDATED_CONFORMANCE_AUDIT.md` §18:

> A-11 | Capture of the fetched source for the §6.3 substantive check and the §6.4 spot-check | D11 §6.4; F1-D §8; Gate Audit §11.6 | Fetched text is not persisted | No for the contract; **live-validation prerequisite**

**Scope of this matrix.** This matrix is deliberately scoped to that definition: A-11 is the source capture required for the §6.3 substantive check and the §6.4 spot-check. It does not extend A-11 to broader D11 live-validation requirements. Those remain D11 requirements and are not A-11 closure evidence.

---

# §1. Current A-11 state

| Item                                      | Status                                  |
| ----------------------------------------- | --------------------------------------- |
| A11-P1 capture-method decision            | **COMPLETE — M-2 SELECTED**             |
| M-2 implementation                        | **COMPLETE**                            |
| M-2 implementation conformance audit      | **RECORDED**                            |
| T6 real-PostgreSQL execution              | **COMPLETE — PASS**                     |
| T6.1–T6.7                                 | **ALL PASS**                            |
| Post-T6 implementation conformance update | **RECORDED**                            |
| E1 — captured source evidence             | **OPEN**                                |
| E2 — §6.4 manual spot-check               | **OPEN**                                |
| E3 — §6.3 substantive check               | **OPEN**                                |
| A-11 closure decision                     | **NOT YET AUTHORIZED / NOT YET CLOSED** |

---

# §2. Infrastructure prerequisites

## P1 — Capture-method decision

**Status: COMPLETE**

Product Owner decision **A11-P1-PO-DEC-002** selected:

> **M-2 — store the source text actually captured at the model-input boundary.**

The decision did not authorize implementation by itself.

---

## P2 — M-2 implementation

**Status: COMPLETE**

The separately authorized implementation established the source-text persistence path, including:

* source-text persistence;
* source-to-determination traceability;
* source classification;
* fetch timestamp;
* extraction metadata;
* content hash;
* ownership-scoped retrieval;
* multiple-source preservation.

The implementation conformance audit recorded the implementation and its deviations.

No additional implementation authority is granted by this matrix.

---

## P3 — T6 real-PostgreSQL verification

**Status: COMPLETE — PASS**

T6 was executed under **A11-T6-EXEC-AUTH-001**.

T6 verified the database-level behavior against real PostgreSQL.

### T6.1–T6.7

| Criterion                                             | Status   |
| ----------------------------------------------------- | -------- |
| T6.1 Migration 0028 exercised                         | **PASS** |
| T6.2 Persistence                                      | **PASS** |
| T6.3 Exact retrieval                                  | **PASS** |
| T6.4 PostgreSQL-side hash recomputation               | **PASS** |
| T6.5 Source classification and uniqueness constraints | **PASS** |
| T6.6 Traceability and ownership isolation             | **PASS** |
| T6.7 Multiple-source persistence                      | **PASS** |

The post-T6 conformance update records the execution and repository-safety results.

### Limitation

T6 does **not** establish:

* live-provider behavior;
* live source retrieval;
* §6.3 substantive validation;
* §6.4 manual spot-check evidence;
* participant validation;
* provider neutrality;
* A-11 closure.

---

# §3. A-11 closure evidence

The following three evidence items remain the substantive closure package.

## E1 — Captured source evidence

**Status: OPEN — HARD BLOCKER**

### Required evidence

For each determination included in the authorized A-11 validation set, provide the actual persisted model-seen source record(s), including the applicable traceability information.

The evidence must allow the reviewer to identify:

* the determination;
* the captured source document;
* the source text;
* source metadata;
* the source's relationship to the determination.

The evidence must be from the M-2 persistence path, not a newly fetched or independently reconstructed page.

### Acceptance condition

**PASS only if** the captured source evidence is available and traceable for every required determination in the validation set.

A T6 fixture does not satisfy E1.

T6 establishes that the mechanism can persist and retrieve source text; E1 requires actual validation-session source evidence.

---

# §4. E2 — §6.4 manual spot-check

**Status: OPEN — HARD BLOCKER**

### Required evidence

For each required §6.4 spot-check:

1. identify the applicable determination and source;
2. identify the quoted/cited source text used by the determination;
3. inspect the captured model-seen source;
4. independently compare the citation against that captured source;
5. record the manual result.

The check must not rely solely on the system's own provenance mechanism.

### Acceptance condition

**PASS only if** the required §6.4 comparison is independently recorded against the captured source and the result is documented.

A successful T6 hash test does not satisfy E2.

A successful automated provenance check does not by itself satisfy E2.

---

# §5. E3 — §6.3 substantive check

**Status: OPEN — HARD BLOCKER**

### Required evidence

For each required determination and segment:

* use the captured source material;
* preserve the stored classification, confidence and basis exactly as recorded;
* preserve the relevant evidence and rationale;
* perform the required independent substantive assessment;
* record the resulting ACCEPT, REJECT or NOT ASSESSABLE finding under the A-12 §6.3 Companion Record rules.

The assessment must not derive its conclusion solely from the stored label.

### Acceptance condition

**PASS only if** the required §6.3 substantive assessment is independently recorded against the captured source and satisfies the Companion Record requirements.

T6 does not satisfy E3.

M-2 implementation conformance does not satisfy E3.

---

# §6. Evidence dependency

The relationship between the completed technical work and the remaining closure evidence is:

```text
A11-P1 decision
       ↓
M-2 implementation
       ↓
T6 / T6.1–T6.7 PASS
       ↓
source-capture capability established
       ↓
       ├── E1 actual captured-source evidence
       │      ↓
       ├── E2 §6.4 manual spot-check
       │      ↓
       └── E3 §6.3 substantive check
              ↓
       A-11 closure decision
```

M-2 and T6 are **enabling evidence**.

E1, E2 and E3 are the remaining **closure evidence**.

No completed infrastructure item is treated as a substitute for an open closure item.

---

# §7. Evidence that does NOT close A-11

The following do not independently close A-11:

* M-2 implementation;
* migration `0028`;
* T6 PASS;
* T6.1–T6.7 PASS;
* unit-test results;
* PostgreSQL hash recomputation;
* automated provenance results;
* a facilitator snapshot that is not the model-seen source;
* a newly fetched copy of the source;
* a blank Companion Record;
* the existence of the M-2 persistence table.

These may support the closure package but cannot replace E1, E2 or E3.

---

# §8. Authority boundary

This matrix update grants no new authority.

It does not authorize:

* live provider calls;
* participant validation;
* D11 live validation;
* additional application implementation;
* schema or migration changes;
* changes to D11-H;
* changes to F1-D;
* changes to D0–D11;
* changes to the participant-facing instrument;
* changes to the A-12 Companion Record;
* A-11 closure.

Any execution required to produce E1, E2 or E3 requires the applicable authorization.

---

# §9. Current blockers

### Hard blockers

| Blocker                                 | Status   |
| --------------------------------------- | -------- |
| E1 — actual captured source evidence    | **OPEN** |
| E2 — independent §6.4 manual spot-check | **OPEN** |
| E3 — independent §6.3 substantive check | **OPEN** |

### Completed prerequisites

| Prerequisite               | Status       |
| -------------------------- | ------------ |
| M-2 selection              | **COMPLETE** |
| M-2 implementation         | **COMPLETE** |
| T6                         | **PASS**     |
| T6.1–T6.7                  | **ALL PASS** |
| Post-T6 conformance record | **RECORDED** |

---

# §10. Final disposition

**M-2:** COMPLETE
**T6:** PASS
**T6.1–T6.7:** ALL PASS
**E1:** OPEN
**E2:** OPEN
**E3:** OPEN
**A-11:** **OPEN**

The completed M-2 implementation and T6 verification establish the technical capability required to capture and retrieve model-seen source text.

They do not constitute the actual E1/E2/E3 validation evidence.

**A-11 remains OPEN until the required E1, E2 and E3 evidence is separately produced, reviewed, and accepted under the applicable governance process.**
