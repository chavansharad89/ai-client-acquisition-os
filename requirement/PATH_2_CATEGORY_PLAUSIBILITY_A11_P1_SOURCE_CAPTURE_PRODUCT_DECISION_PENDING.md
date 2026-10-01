# PATH 2 — CATEGORY PLAUSIBILITY

## A11-P1 PRODUCT OWNER DECISION — SOURCE CAPTURE METHOD

**Decision ID:** A11-P1-PO-DEC-001
**Status:** PENDING — NO OPTION SELECTED
**Scope:** A-11 source-capture gap only
**Authority:** Product Owner decision record
**Implementation authority:** NOT GRANTED
**Live-validation authority:** NOT GRANTED

---

## §0. Purpose

This decision record resolves the open A11-P1 question:

> **How should the fetched source be captured so that the §6.3 substantive check and §6.4 spot-check can be performed against preserved source material?**

A-11 is narrowly defined as the source-capture gap identified by the F-1 Consolidated Audit.

The current repository state indicates that:

* migration `0027` does not persist fetched source text; and
* `sourceDocumentProvider.ts` extracts page text in memory but does not persist the fetched text.

This record therefore concerns **source-capture method selection only**.

It does not authorize implementation.

---

# §1. Decision

**DECISION: PENDING**

No source-capture method is selected by this record.

Two alternatives remain available for a subsequent Product Owner decision:

* **M-1 — Facilitator Snapshot**
* **M-2 — Persist the Text Actually Seen by the Model**

Neither alternative is approved for implementation by this record.

---

# §2. Alternative M-1 — Facilitator Snapshot

### Description

At validation-session time, the facilitator captures the relevant source page or source content in a durable facilitator/analyst-side record.

The captured material would subsequently support:

* the §6.3 substantive check; and
* the §6.4 spot-check.

### Intended property

M-1 preserves source material available to the facilitator at validation time.

### Known limitation

The facilitator's snapshot may not be byte-for-byte identical to the source content that the model actually fetched and read.

The underlying page may have changed between:

1. the model's fetch; and
2. the facilitator's snapshot.

Therefore M-1 establishes a contemporaneous source record but does not necessarily establish exact identity with the model's fetched representation.

### Implementation implication

Depending on the final operating procedure, M-1 may be implementable through the facilitator/analyst-side validation process without changing the production persistence model.

No such implementation is authorized by this record.

---

# §3. Alternative M-2 — Persist Model-Seen Source Text

### Description

The system would persist the source text actually fetched and supplied to the model, or an equivalently exact representation of that fetched text sufficient to reconstruct what the model saw.

The persisted source would then be available for:

* the §6.3 substantive check; and
* the §6.4 spot-check.

### Intended property

M-2 provides a direct provenance relationship between:

**source fetched → source supplied to model → source subsequently reviewed**

rather than relying on a later facilitator snapshot.

### Known implementation implication

The current repository does not appear to persist this fetched text.

Implementing M-2 may therefore require changes to one or more of:

* source-fetching logic;
* persistence/schema;
* migration;
* related repository contracts/tests.

Those changes would require **separate implementation authorization**.

### Authority boundary

This record does **not** authorize those changes.

---

# §4. Comparison

| Dimension                             | M-1 — Facilitator Snapshot   | M-2 — Persist Model-Seen Text |
| ------------------------------------- | ---------------------------- | ----------------------------- |
| Preserves source for §6.3             | Yes, if correctly captured   | Yes                           |
| Preserves source for §6.4             | Yes, if correctly captured   | Yes                           |
| Guarantees exact model-seen text      | No                           | Intended yes                  |
| Requires production/schema change     | Not necessarily              | Potentially required          |
| Requires implementation authorization | If code changes are proposed | **Yes**                       |
| Selected by this record               | **No**                       | **No**                        |

This table is descriptive only. It does not rank the alternatives.

---

# §5. Open questions for subsequent decision

The following questions remain unresolved:

1. Is contemporaneous facilitator capture sufficient for the evidentiary purpose of A-11?
2. Does A-11 require exact preservation of the text actually supplied to the model?
3. If exact preservation is required, what representation constitutes sufficient preservation?
4. If M-1 is selected, what minimum capture fields and source identity information must accompany the snapshot?
5. If M-2 is selected, what exact repository changes are required?
6. What retention and access rules should apply to captured source material?
7. What verification must be performed to demonstrate that captured material is usable for both §6.3 and §6.4?

These questions are recorded for decision preparation and do not authorize implementation.

---

# §6. Evidence boundary

A-11 remains limited to the source-capture requirement needed for:

* **§6.3 substantive checking**, and
* **§6.4 spot-checking**.

The following remain **D11 live-validation requirements**, not A-11 closure criteria:

* live MATCH/MISMATCH/UNKNOWN validation;
* Search + Prospect historical attribution;
* participant validation;
* provider-neutrality validation;
* provider credential/readiness;
* other D11 live-validation evidence.

Their presence in this record would not change their governance ownership.

---

# §7. Authority boundary

This decision record grants:

* **No implementation authority.**
* **No schema/migration authority.**
* **No production-code modification authority.**
* **No test modification authority.**
* **No source-provider modification authority.**
* **No live-validation authority.**
* **No participant-validation authority.**
* **No modification authority for D11-H, F1-D, D0–D11, the participant-facing instrument, or the A-12 Companion Record.**

Any implementation resulting from a later selection of M-1 or M-2 requires its own appropriately scoped authorization.

---

# §8. Current repository state

At the time of this decision record:

* **A-11:** OPEN.
* **A-12:** CLOSED.
* **F-1 implementation:** NOT AUTHORIZED.
* **D11:** NOT READY FOR LIVE VALIDATION.
* **A-14:** OPEN.
* **D11-I:** OPEN.

The A-11 evidence matrix remains the governing preparation artifact for the source-capture closure path.

---

# §9. Decision status

**A11-P1: PENDING**

No option has been selected.

The next governance action is a separate Product Owner decision selecting either:

* **M-1 — Facilitator Snapshot**, or
* **M-2 — Persist Model-Seen Source Text**.

Only after that selection may an appropriately scoped implementation authorization be considered.

**This record does not close A-11.**
**This record does not authorize implementation.**
**This record does not authorize live validation.**
