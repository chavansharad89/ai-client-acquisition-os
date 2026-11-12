# INTENT INTAKE MVP

## Implementation Authorization — OD Writer Path

**Decision ID:** IA-OD-WRITER-001 (question IA-1)
**Status:** **DECIDED — AUTHORIZE**
**Decision owner:** Product Owner
**Classification:** IMPLEMENTATION AUTHORIZATION ONLY
**Scope:** the writer path covered by OD-1 through OD-13 (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001, revision 2, §14)

## 1. Purpose

This decision asks whether to authorize implementation of the already-decided OD-1 through OD-13 writer-path design.
It does not reopen, modify, reinterpret or replace OD-1 through OD-13. It exists solely to determine whether
implementation restriction C3 (DEC-005) may be lifted for this specific writer path.

## 2. Decision to be made

**IA-1 — Writer-path implementation authorization.** May implementation proceed for the writer path covered by OD-1
through OD-13, with C3 lifted only for that writer path and only within the boundaries stated in this record?

- **Option A — AUTHORIZE:** lift C3 only for implementation of the OD-1 through OD-13 writer-path design, subject to
  every gate and restriction in §4 remaining in force.
- **Option B — DO NOT AUTHORIZE:** keep C3 in force. No implementation work is authorized under this decision.

## 3. What this authorization permits

Implementation may cover only the design decisions already recorded in OD-1 through OD-13, including:

- the authorization evidence contract;
- the five required authorization values;
- validation of authorization status, timestamp, scope, business identity and integration identity;
- completeness and expiry checks;
- FIRST_PARTY evidence requirements;
- propagation of evidence into the writer-path intake types;
- the specified transactional persistence behavior;
- the specified immutable evidence insertion behavior;
- the existing `REJECTED` outcome for rejected results;
- the explicitly decided retry behavior;
- tests and fixtures necessary to implement and verify those decisions.

Implementation must follow the exact decisions recorded in OD-1 through OD-13. No implementation choice may silently
change an OD decision.

## 4. Gates and restrictions that remain in force

Lifting C3 under IA-1 does not lift any other gate.

- **4.1 OD-13 provider-verification gate.** No runtime caller may feed AI-platform results containing FIRST_PARTY items
  into saving until a provider-verification mechanism has been separately decided and built. This authorization does
  not authorize connecting or enabling such a runtime caller.
- **4.2 Runtime wiring remains blocked.** No new runtime caller may be enabled merely because the writer-path
  implementation has been completed.
- **4.3 Deferred decisions remain deferred:** revocation events; `revoked_at`; review interval; deduplication;
  automatic expiry of already-stored rows; any other item explicitly deferred by the OD design record. Implementation
  must not invent behavior for these matters.
- **4.4 Provider-contract changes remain bounded** to those necessary to implement the OD-1 through OD-13 contract. No
  additional provider behavior, provider verification mechanism, retry policy or provider integration.
- **4.5 No validation authority:** no validation session, live source fetching, participant contact,
  participant-facing testing, production validation, or additional provider calls for validation purposes.
- **4.6** All existing restrictions (DEC-003, DEC-004, DEC-005 and subsequent governance records) remain in force
  unless a separate decision explicitly changes them.

## 5. Implementation boundary

Implement the writer-path design already decided in OD-1 through OD-13, and nothing beyond it. The implementation must
not: resolve an undecided governance question through code; create a new interpretation of an OD decision; connect a
runtime caller that OD-13 still blocks; introduce a provider-verification mechanism; broaden the writer path to other
source families; create additional persistence fields; add an audit mechanism rejected by OD-11; add automatic retry
or deduplication; alter unrelated production paths merely for convenience.

## 6. Required implementation discipline

Establish the baseline; work only within scope; do not modify the OD record or earlier PO decisions; record any new
ambiguity as a separate decision-preparation item; make no provider calls; do not connect a runtime caller blocked by
OD-13; keep unrelated working-tree changes untouched; run appropriate tests; report files changed, tests run, external
calls, database activity and remaining blockers.

## 7. Acceptance boundary

Every implemented behavior maps to OD-1 through OD-13 or a pre-existing rule; no deferred decision silently decided;
OD-13 enforced; no blocked runtime caller connected; no validation authority inferred; no unrelated production path
expanded; existing governance gates intact. Completion of the code work does not constitute authorization to deploy,
enable, validate or connect a runtime caller.

## 8. Product Owner decision

**IA-1 selected option: AUTHORIZE**
**Decision date:** 2026-09-30
**Decision maker:** Product Owner
**Decision notes (verbatim from the Product Owner):**

> Lift C3 only for implementation of the writer path defined by OD-1 through OD-13, subject to every gate and
> restriction in IA-OD-WRITER-001.
> Do not interpret this as authorization for: OD-13 provider verification; connecting or enabling a runtime caller
> blocked by OD-13; validation sessions or participant contact; live source fetching or validation; deferred
> decisions; production deployment or enablement; any behavior not already decided by OD-1 through OD-13.
>
> Before implementation: 1. Establish and record the baseline. 2. Re-check the hashes of the OD design record,
> DEC-005, and IA-1. 3. Verify the "REJECTED" outcome and retry behavior against the actual OD-1 through OD-13 design
> record. 4. If either is not actually decided there, create a separate decision-preparation item and do not resolve
> it through code. 5. Implement only within the authorized §3–§5 boundary. 6. Preserve all existing gates. 7. Finish
> with the required implementation record and §11 safety counters.
>
> No additional execution authority is granted by this decision.

## 9. Governance consequence

C3 is lifted only for the implementation scope defined in this record. It does not constitute general implementation
authority for the surrounding system.

## 10. Explicit non-decisions

OD-13 provider verification; runtime caller authorization; revocation behavior; `revoked_at`; review interval;
deduplication; production deployment; production enablement; validation-session authorization; participant contact;
live validation; any change to OD-1 through OD-13.

## 11. Safety counters to report after implementation

Production code changes; migration changes; schema changes; test changes; configuration changes; dependency changes;
database connections; database writes; provider calls; external HTTP requests; validation sessions; participant
contacts; commits.

**IA-OD-WRITER-001 — IA-1 AUTHORIZE (2026-09-30) — C3 LIFTED FOR THE OD-1..OD-13 WRITER PATH ONLY — OD-13 RUNTIME
GATE IN FORCE**
