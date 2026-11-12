# Client Finder / PDEF-4 — Launch-Criteria Q10 Independent-Validator Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-Q10-INDEPENDENT-VALIDATOR-PREP-001`
**Date:** 2026-10-05
**Type:** Read-only preparation record. **Grants no implementation, validation, staffing, deployment, release, or
launch authority.** Does not name a validator, does not select a method, does not reopen Q10's policy (already
decided in `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 — that policy stands unmodified here).

---

## 1. Why this is not decided under existing delegation

`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` was decided under delegated Product Owner authority "exercised
by Claude for this task" (consistent with the same scoping language in
`CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` §1 — every delegation grant in this governance
chain is per-task, not standing). That record's own §6.10 and §7 explicitly decline to name a validator or method,
stating: *"'Independent validation' is deliberately left undefined as to method or validator (e.g., which team,
what process)... Engineering leadership must separately define the validation method before this prerequisite can
actually be satisfied."* No later record extends that delegation to cover naming the validator.

Structurally, this question cannot be delegated to the same chain that built the instrumentation: Q10 requires a
validator "distinct from the team that built the instrumentation," and the implementation chain for PCG-1..6
(including this Claude session's own prior work in this repository) is that team. Naming a validator from within
it would not satisfy the requirement it is supposed to satisfy — it would only appear to.

**This record does not name a validator.** It isolates what a decision-maker needs to decide, and what the
validation procedure must contain once a validator exists.

## 2. What is already decided (not reopened)

- The four blocker gates requiring this validation: PCG-1, PCG-2, PCG-3A, PCG-3B (`LAUNCH_CRITERIA_DECISION.md`
  §6.3/§6.10).
- The three monitoring gates (PCG-4, PCG-5, PCG-6) do **not** require independent validation before use in
  post-launch monitoring (§6.10) — unaffected by this record.
- Validating this prerequisite authorizes only that the blocker gates may be *used* in a launch-qualification
  decision — it does not itself authorize deployment, release, or launch (`LAUNCH_CRITERIA_DECISION.md` §9; K1-10
  remains NOT AUTHORIZED regardless of this record's outcome).

## 3. What has NOT occurred yet (fact, not a decision)

No independent validation has been performed. The only validation to date is the Phase 9 real-Postgres test suite
(16/16 passing) and this repository's own implementation/conformance chain — all produced by the same engineering
chain that built the instrumentation. Per Q10's own text, this does not satisfy the independence requirement by
itself; it is evidence the eventual independent validator would inspect or rerun, not a substitute for them.

## 4. Decision elements required (for the questionnaire, not decided here)

1. **Who performs it** — a specific person/team not part of the instrumentation's build chain.
2. **Why they are independent** — their relationship (or lack of one) to the engineering work that built
   `packages/core-launch-gates`, `core-launch-gates-validation`, and the Phase 9 suite.
3. **Evidence scope** — at minimum, the Phase 9 fixture suite for PCG-1/2/3A/3B (`tests/integration/
   launch-gates-phase9.integration.test.ts` per the implementation conformance record) and the gate source files
   `pcg1.ts`/`pcg2.ts`/`pcg3.ts`/`pcg3a.ts`/`pcg3b.ts`.
4. **Environment** — whether the validator reruns the suite in a clean/separate database or inspects the existing
   results, and if rerun, whether a dedicated validation environment is required.
5. **Gates covered** — PCG-1, PCG-2, PCG-3A, PCG-3B only (per §2; monitoring gates excluded).
6. **Pass/fail criterion** — not yet defined; candidates include "independently reproduces 16/16 passing" or "an
   independent code read confirms the SQL/logic matches the documented PCG-1..6 semantics," or both.
7. **Evidence retention** — where/how the validator's findings are recorded (e.g., a signed validation record in
   `requirement/`, committed alongside or referencing the Phase 9 suite's state at time of validation).
8. **Sign-off** — who is recorded as having performed and approved the validation, and the record format.
9. **Scope of what validation authorizes** — explicitly: gate-qualification evaluability only, never deployment/
   release/launch (reiterating §2; a future K1-10 decision remains fully separate).

## 5. What this record does not do

Does not name a validator. Does not select a pass/fail method. Does not modify
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` or any PCG-1..6 implementation. Does not authorize any code,
test, or schema change. Is not committed or pushed.

**Status: PENDING — awaiting the Product Owner's (or whoever holds that authority's) answers in the companion
questionnaire.**
