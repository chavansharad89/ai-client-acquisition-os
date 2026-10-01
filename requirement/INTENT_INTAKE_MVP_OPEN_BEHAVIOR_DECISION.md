# INTENT INTAKE MVP

## Open Intake Behaviors — Product Owner Decision Record

**Decision ID:** INTENT-INTAKE-PO-DEC-002
**Status:** **DECIDED** — E1, E2 **DECIDED**
**Previous status:** PENDING PRODUCT OWNER DECISION (preparation record, below)
**Preparation record:** `INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION_PREPARATION.md`
(sha256 `d4858705e70002839a97acdcc460385ead2e2857bee6dc49cd599b46aceeb4c9`). It is kept unchanged for
traceability, and its factual findings (§2, §3) and options are not modified by this record.
**Product Owner:** Product Owner, by explicit selection during the decision round on 2026-09-30, recorded here under
that authorization
**Repository HEAD at recording:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8. No
Path 2 record is read as changed or is changed by this record.

```text
INTENT-INTAKE-PO-DEC-002 .. DECIDED — E1 E2 DECIDED
IMPLEMENTATION ............ NOT AUTHORIZED BY THIS RECORD
MIGRATION ................. NONE CREATED, MODIFIED OR APPLIED BY THIS RECORD
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — REMAINS STOPPED (§9.8)
```

---

## 1. Decision authority

The Product Owner supplied both selections during the decision round on 2026-09-30:

| Decision | Selected option |
|---|---|
| E1 | **A** — Accept the current behavior |
| E2 | **A** — Accept any status |

No rationale was supplied for either selection, and none is recorded here. This record is the decision authority for E1
and E2. The implementation state in §7 is corroborating context only; it is not the source of these decisions.

## 2. Predecessor record

| Record | Path | sha256 |
|---|---|---|
| Preparation (reserved INTENT-INTAKE-PO-DEC-002) | `requirement/INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION_PREPARATION.md` | `d4858705e70002839a97acdcc460385ead2e2857bee6dc49cd599b46aceeb4c9` |

The preparation record raised E1 and E2 from INTENT-INTAKE-IMPL-REVIEW-001 §5 (items A and C).

## 3. E1 — Intake for a Prospect that already has an Opportunity

**Selected: A — Accept the current behavior.**

- The existing find-or-create behavior remains unchanged.
- An intake event for a Prospect that already has an Opportunity does not create another Opportunity.
- The existing Opportunity is not re-evaluated merely because another intake signal arrives.
- No new offer or next-action evaluation is introduced by E1.

E1 adds no other requirement.

## 4. E2 — Search status accepted by intake

**Selected: A — Accept any status.**

- Intake does not reject a Search based on Search status.
- The Search ownership lookup (an existing, caller-owned Search) remains the relevant lookup condition.
- No status allow-list is introduced by E2.

Search status is not evidence of research success. Accepting a Search reference does not establish research evidence
or a CATEGORY_PLAUSIBLE determination; existing evidence and qualification rules are unchanged.

## 5. Unselected alternatives

Kept as listed in the preparation record, unselected and unranked.

**E1**
- **B — Re-evaluate the offer on intake.** Not selected.
- **C — Reject intake for such a Prospect.** Not selected.
- **Other** — the Product Owner's exact rule. Not selected.

**E2**
- **B — Restrict to named statuses.** Not selected.
- **Other** — the Product Owner's exact rule. Not selected.

Only E1 and E2 are decided by this record.

## 6. Scope and non-authority

This record does **not** authorize:
- production code changes;
- test changes;
- migration creation or execution;
- database changes;
- provider calls (Anthropic, Google, Gemini or other);
- Search submission or Search retry;
- validation execution;
- participant contact;
- live-source fetching;
- any change to the stopped validation session.

It establishes E1 and E2 governance only.

## 7. Context references (not decision authority)

Recorded as context only, unchanged by this record:

| Item | Value |
|---|---|
| Migration `0029_research_signal_intent_kinds` | `ca498e33…da21c`; not applied by this record |
| Implementation record (INTENT-INTAKE-IMPL-REC-001) | `f1ab2804…d4a9` |
| Review record (INTENT-INTAKE-IMPL-REVIEW-001) | `27c534d5…f89a` |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `5401f9491d38f7c5df97081eaab00abd81608b83d87948a00a271cec156e3100` |

Implementation facts at that fingerprint (corroborating, not authoritative):
- E1: the existing behavior keeps an existing Opportunity unchanged when an intake signal arrives.
- E2: intake accepts a Search in PENDING, RUNNING, COMPLETE, FAILED and CANCELLED status.

## 8. Relationship to D1–D5

- D1–D5 remain governed by INTENT-INTAKE-PO-DEC-001 (`requirement/INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`,
  sha256 `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407`). This record does not restate, alter or
  reinterpret them.
- E1 and E2 are separate open-behavior decisions governed by INTENT-INTAKE-PO-DEC-002.

## 9. Decision conclusion

```text
INTENT-INTAKE-PO-DEC-002 — DECIDED
  E1 = A
  E2 = A
```

No other decision is made by this record.

Files created: this record only. Files modified: none.
