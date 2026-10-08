# Client Finder / PDEF-4 — Launch-Criteria Q10 Independent-Validator Decision Questionnaire

**Record ID:** `CLIENT-FINDER-PDEF-4-Q10-INDEPENDENT-VALIDATOR-QUESTIONNAIRE-001`
**Companion to:** `CLIENT-FINDER-PDEF-4-Q10-INDEPENDENT-VALIDATOR-PREP-001`
**Date:** 2026-10-05

This questionnaire decides only who performs Launch-Criteria Q10's independent validation and by what method. It
does not reopen Q10's policy, any PCG-1..6 semantics, or any deployment/release/launch authorization.

**Who may answer this:** the human Product Owner, or whoever in the organization holds staffing/process authority
over engineering validation — **not Claude**, and not anyone on the engineering chain that built
`packages/core-launch-gates`/`core-launch-gates-validation`/the Phase 9 suite, since that would fail to satisfy
the independence requirement by construction.

---

### Q-V1 — Validator identity

Decision required: who will perform the independent validation of PCG-1/2/3A/3B's instrumentation before it may
be used in a launch-qualification decision.

- [ ] A named internal person/team not involved in building the instrumentation — specify: _______________
- [ ] An external reviewer — specify: _______________
- [ ] Defer — no validator named yet; blocker gates remain unusable for an actual launch decision until named.

### Q-V2 — Independence basis

If Q-V1 names a party: state why they qualify as independent (e.g., different reporting line, no commit history
in `packages/core-launch-gates`, etc.): _______________________________________________

### Q-V3 — Evidence scope

Which evidence must the validator inspect or rerun? (See prep record §4.3 for the candidate set.)

- [ ] Rerun the Phase 9 real-Postgres suite independently (clean environment)
- [ ] Independently read the PCG-1/2/3A/3B source against the documented semantics (no rerun)
- [ ] Both
- [ ] Other — specify: _______________

### Q-V4 — Environment

- [ ] Validator reruns in a dedicated/clean validation database, separate from the engineering team's own test runs
- [ ] Validator may use the existing CI/test infrastructure as-is
- [ ] Not applicable (Q-V3 selected "read only, no rerun")

### Q-V5 — Pass/fail criterion

State the specific criterion the validator applies: _______________________________________________
(e.g., "16/16 Phase 9 tests independently reproduced" and/or "independent code read confirms SQL/logic matches
documented PCG-1..6 semantics with no discrepancy.")

### Q-V6 — Evidence retention and sign-off

Where is the validator's finding recorded, and who is named as having signed off?
_______________________________________________

### Q-V7 — Scope confirmation

- [ ] Confirmed: a passing result under this questionnaire authorizes only that PCG-1/2/3A/3B may be used in a
  launch-qualification decision. It does **not** authorize deployment, release, or launch (K1-10 remains a
  separate, NOT AUTHORIZED gate), and does not authorize any code/schema/test change.

---

## Explicitly out of scope
Naming Claude or any member of the instrumentation's build chain as the validator (fails independence by
construction); any change to PCG-1..6 semantics, thresholds, or windows; ED-3; Pattern A; deployment/release/
launch authorization; any new PCG gate.

## Stop condition
No validator is treated as named, and no validation is treated as performed, until this questionnaire is
answered.
