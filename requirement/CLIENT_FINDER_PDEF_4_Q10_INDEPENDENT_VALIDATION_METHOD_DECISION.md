# Client Finder / PDEF-4 — Launch-Criteria Q10 Independent-Validation Method Decision

**Record ID:** `CLIENT-FINDER-PDEF-4-Q10-VALIDATION-METHOD-DEC-001`
**Date:** 2026-10-05
**Prepared by:** `CLIENT-FINDER-PDEF-4-Q10-INDEPENDENT-VALIDATOR-PREP-001`
**Companion (still open):** `CLIENT-FINDER-PDEF-4-Q10-INDEPENDENT-VALIDATOR-QUESTIONNAIRE-001` — **not superseded,
not answered, by this record.** Q-V1 (validator identity) in that questionnaire remains unanswered.
**Decided by:** Sharad Chavan, acting as Product Owner, with Claude (Sonnet 5) delegated in-session to record
this decision, consistent with the same self-attested delegation basis as
`CLIENT-FINDER-PDEF-4-LAUNCH-CRITERIA-PO-DEC-001`.

**Delegation notice:** This record's provenance is **delegated-AI decision, not independently supplied human
Product Owner input**, exactly as stated in `LAUNCH_CRITERIA_DECISION.md` §1–§2. Human Product Owner ratification
should be sought before treating this as final if that distinction matters.

**Scope of what is, and is not, decided here:** This record decides the **method, evidence scope, and
failure-handling policy** for Q10's independent validation (Q10-2, Q10-3, Q10-4 below). It explicitly does
**NOT** decide, name, or imply **Q10-1, the validator's identity** — no repository or governance record
establishes an actual person or team distinct from the instrumentation's build chain, and none is invented here.
Until Q10-1 is answered (via the still-open companion questionnaire, by whoever holds that staffing authority),
this method has no one authorized to execute it, and Q10 remains unsatisfied.

---

## Why Q10-1 cannot be decided under this delegation

Delegation in this governance chain has consistently authorized reconciling and choosing among **policy options
already implied by existing governing facts** (e.g., `LAUNCH_CRITERIA_DECISION.md` Q1–Q10 selected among
proposals the analyst record had already derived from PDEF-2/PDEF-3/ES). Naming a validator is different in kind:
it asserts a real-world fact (that a specific person or team exists, is available, and is organizationally
distinct from the build chain) that no record in this repository supplies. Deciding it anyway would not be
exercising delegated judgment — it would be fabricating the fact the requirement exists to test for. Constraint
4 of this task's own instructions directs exactly this outcome: where no actual independent identity can be
established, select the option that keeps the requirement blocked.

Claude and this implementation chain are explicitly disqualified from being named here, by construction: Q10
requires a validator "distinct from the team that built the instrumentation," and this session is part of that
team.

---

## Decisions

### Q10-1 — Validator identity
**Not decided. Remains BLOCKED.** No identity is named. The companion questionnaire
(`CLIENT-FINDER-PDEF-4-Q10-INDEPENDENT-VALIDATOR-QUESTIONNAIRE-001`, Q-V1/Q-V2) remains the open instrument for
whoever holds staffing/process authority to answer. This record does not answer it on their behalf.

### Q10-2 — Validation method
**DECISION:** Once a validator is named (Q10-1), the minimum independent validation procedure is:

1. **Environment:** The validator independently reruns the Phase 9 real-Postgres fixture suite
   (`tests/integration/launch-gates-phase9.integration.test.ts`) in a database environment they provision or
   control themselves — not the engineering team's existing CI run or local environment — to avoid relying on a
   result the build chain already produced.
2. **Independent code review:** The validator independently reads `packages/core-launch-gates/src/pcg1.ts`,
   `pcg2.ts`, `pcg3.ts`/`pcg3a.ts`/`pcg3b.ts` against the documented semantics in `LAUNCH_CRITERIA_DECISION.md`
   and `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` (thresholds, populations, windows), independent of the
   Phase 9 rerun.
3. **Gates covered:** PCG-1 (500 qualified visitors), PCG-2 (≥50 buyers), PCG-3A (≥10% ₹99→₹499), PCG-3B (≥5%
   independent ₹1,499 conversion). PCG-4/5/6 (monitoring-only) are explicitly excluded, per
   `LAUNCH_CRITERIA_DECISION.md` §6.10.
4. **Pass criterion:** Both of the following must hold: (a) the validator's independent rerun reproduces the
   existing 16/16 Phase 9 pass result for the PCG-1/2/3A/3B-relevant test cases, with no discrepancy; and (b) the
   validator's independent code read finds no deviation between the implemented logic and the documented
   semantics for those four gates.
5. **Fail criterion:** Any discrepancy under either (a) or (b) above constitutes a failure (see Q10-4).
6. **Evidence retention:** The validator's findings (environment used, rerun output/log, code-read notes, and
   the pass/fail determination per gate) are recorded in a new `requirement/*.md` record at the time validation
   is performed — not fabricated or summarized in advance by this record.
7. **Sign-off:** The named validator (per Q10-1, once answered) is recorded as the signatory on that evidence
   record. Self-sign-off by any member of the instrumentation build chain does not satisfy this requirement.

### Q10-3 — Scope
**DECISION, confirmed:** A passing result under this method authorizes **only** that PCG-1/2/3A/3B may be used in
a launch-qualification decision. It does **not** authorize deployment, release, rollout, or production
activation of any kind. K1-10 (deployment/release) remains explicitly **NOT AUTHORIZED**, unaffected by this
record or by a future passing validation result. This mirrors, and does not alter, the boundary already stated in
`LAUNCH_CRITERIA_DECISION.md` §9.

### Q10-4 — Failure handling
**DECISION:** If independent validation (Q10-2) produces any discrepancy — a Phase 9 rerun failure, or a code-read
finding that implementation deviates from documented semantics — the affected gate(s) are marked **VALIDATION
FAILED**, not merely "not yet validated." A gate marked VALIDATION FAILED may not be used in a launch-qualification
decision until: (a) the discrepancy is root-caused, (b) a correction is implemented and separately authorized
through the normal engineering-authorization chain (this record grants no such authorization in advance), and (c)
independent validation is re-run and passes. No partial-credit or override path exists under this decision —
Q10-3's scope boundary applies regardless of validation outcome.

---

## What remains unresolved after this record

1. **Q10-1** — the validator's actual identity. Unresolved; requires the companion questionnaire to be answered
   by whoever holds that authority. Until then, Q10-2's method has no one authorized to execute it.
2. Whether PCG-1/2/3A/3B are validated at all: **no.** This record decides a method; it does not perform
   validation and does not claim validation has occurred.

## Explicit authorization boundaries

This record grants none of: implementation authority, validator-identity authority, execution authority to
perform the validation described in Q10-2, deployment/release/launch authority, or commit/push authority. It
does not modify `LAUNCH_CRITERIA_DECISION.md`, the Q10 preparation record, the Q10 questionnaire, PDEF-2, PDEF-3,
entitlement stacking, ED-3, or any code/test/schema/migration. It is not committed or pushed.

**Status of Q10 after this record: `DECIDED (METHOD) — VALIDATOR IDENTITY UNRESOLVED — VALIDATION NOT YET
PERFORMED`.**
