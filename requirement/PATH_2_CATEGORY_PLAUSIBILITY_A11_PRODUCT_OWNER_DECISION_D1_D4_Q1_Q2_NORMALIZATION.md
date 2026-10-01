# PATH_2_CATEGORY_PLAUSIBILITY_A11_PRODUCT_OWNER_DECISION_D1_D4_Q1_Q2_NORMALIZATION.md

## A-11 Product Owner Decision

**Decision ID:** A11-PO-DEC-003
**Status:** DECIDED
**Scope:** D-1, D-4, Q-1, Q-2, and manual §6.4 normalization only

---

## 1. Purpose

This record resolves five open A-11 questions identified by the A-11 E1/E2/E3 evidence-readiness assessment:

* D-1 — M-2 capture point;
* D-4 — determinations with no captured source;
* Q-1 — retention and access for stored source text;
* Q-2 — extraction-method identity;
* manual normalization for the §6.4 spot-check.

This decision does not modify D11-H, F1-D, D0–D11, the participant-facing instrument, the A-12 Companion, or the M-2 implementation.

---

## 2. D-1 — Capture Point

**Decision:** D-1 is **ACCEPTED AS A DOCUMENTED IMPLEMENTATION DEVIATION; NOT WAIVED**.

The M-2 capture point in `researcher.ts` is accepted as the intended capture point because it captures the parsed document text used to construct the research prompt.

The exactness requirement remains unchanged: the persisted `source_text` must be the text captured at that point and subsequently passed unchanged through the provider path.

This decision does not authorize any further implementation change.

---

## 3. D-4 — No Source Supplied

**Decision:** D-4 is **ACCEPTED AS A KNOWN EVIDENCE LIMITATION; NOT WAIVED**.

A determination that has no corresponding M-2 source-capture rows must **not** be treated as having nothing to check.

For A-11 evidence purposes:

* a determination intended to qualify as `VALID` must have the required captured source evidence;
* absence of required capture rows is an E1 failure;
* such a determination cannot satisfy E1–E3;
* the absence of a source-capture row must be recorded as an evidence deficiency rather than silently treated as a successful no-source case.

No implementation of a separate "no source supplied" record is authorized by this decision.

---

## 4. Q-1 — Retention and Access

**Decision:** Stored M-2 source text may be retained as evidence for the A-11 §6.3 and §6.4 checks and must remain accessible through an owner-scoped, read-only retrieval path for authorized reviewers.

The evidence record must preserve the source text together with its traceability to the relevant determination.

Access must remain scoped to the owning user/context. The T6 ownership boundary remains the applicable implementation constraint.

This decision does not authorize creation or modification of a new reviewer-facing access mechanism.

---

## 5. Q-2 — Extraction Identity

**Decision:** The persisted `extraction_method` field is the extraction identity for A-11 evidence.

The recorded value must identify the extraction path used to produce the text captured by M-2.

Where the provider does not supply an extraction identity, `UNDECLARED` remains the stored value and must be explicitly flagged during evidence review.

No retrospective re-extraction may be used to establish the extraction identity of an already captured source.

---

## 6. Manual §6.4 Normalization Rule

**Decision:** The §6.4 manual spot-check may apply the same normalization described by the existing verification rule, but the reviewer must perform that normalization independently rather than invoke the provenance implementation.

The reviewer must document the normalization applied, including at minimum:

* whitespace normalization; and
* quote-character normalization where applicable.

The reviewer must then independently determine whether the cited quote is present in the persisted model-seen source.

The finding must not be copied from, derived from, or represented as the result of `provenance.ts` or another automated provenance check.

The manual result remains the authoritative §6.4 evidence for the A-11 review.

---

## 7. Authority Boundary

This decision:

* does **not** authorize further implementation;
* does **not** authorize schema or migration changes;
* does **not** authorize production-code changes;
* does **not** authorize live provider calls;
* does **not** authorize participant interaction;
* does **not** authorize D11 live validation;
* does **not** close E1, E2, E3, or A-11;
* does **not** modify D11-H, F1-D, D0–D11, the participant-facing instrument, or the A-12 Companion.

Any implementation or live-validation work requires separate authorization.

---

## 8. Result

The five Product Owner questions are resolved as follows:

| Item               | Decision                                                               | Status   |
| ------------------ | ---------------------------------------------------------------------- | -------- |
| D-1                | Capture point accepted as documented deviation                         | RESOLVED |
| D-4                | Missing capture rows are an evidence deficiency                        | RESOLVED |
| Q-1                | Retain source text with owner-scoped read-only access                  | RESOLVED |
| Q-2                | `extraction_method` is the extraction identity                         | RESOLVED |
| §6.4 normalization | Manual application of existing normalization, independently documented | RESOLVED |

**A-11 remains OPEN.**

E1, E2 and E3 remain open until their required evidence is actually produced.

**F-1 remains NOT AUTHORIZED outside the completed M-2 scope.**

**D11 remains NOT READY FOR LIVE VALIDATION.**
