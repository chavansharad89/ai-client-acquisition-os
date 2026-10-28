# Intent Intake MVP

## AI-Platform FIRST_PARTY — Legacy Integration-ID Check (`requireProviderAuthenticityForIntake`) — Product Owner Decision

**Record ID:** INTENT-INTAKE-OD13-LEGACY-P3-DEC-001
**Date:** 2026-09-30
**Type:** Product Owner decision (policy only, no implementation authority)
**Decides:** §5 of INTENT-INTAKE-OD13-LEGACY-P3-PREP-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_LEGACY_AUTHENTICITY_CHECK_DECISION_PREPARATION.md`,
sha256 `164ed3939f285b02dc6f3b4dc55c8ea517a68db1897841d93882842816394ec6`)

```text
Decision status: DECIDED

Selected policy: C — Restrict
Selected mechanism: C-1 — Remove the barrel re-export

Implementation authorization: NONE
Runtime-wiring authorization: NONE
Provider-call authorization: NONE
Database authority: NONE
Validation authority: NONE
Deployment authority: NONE
```

The preparation record is not modified by this decision. This record changes no code, test, export, annotation,
configuration, schema or wiring. The selected policy is **not operational** until a separate implementation
authorization is issued and executed.

---

## 1. Pre-decision verification

No test, typecheck, build, lint or database command was run. Checks were read-only (git, sha256, text search).

### 1.1 Repository baseline

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = PREP-001 §1 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `6f27bd66e28ce687e92c9c2769bb2272c9e9240236bd826ff01e5fb1e0e3b195` | = PREP-001 §1 |
| Staged files / working-tree entries (before this record) | 0 / 227 | 226 in PREP-001 + PREP-001 itself |

### 1.2 Governing-record hashes (sha256)

All files are `requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_…`. Every hash equals PREP-001 §1.1.

| Record | File | sha256 |
|---|---|---|
| INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 | `AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| INTENT-INTAKE-PO-DEC-003 | `AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| INTENT-INTAKE-PO-DEC-004 | `AUTHORIZATION_BLOCKERS_DECISION.md` | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` |
| INTENT-INTAKE-PO-DEC-005 | `AUTHORIZATION_EVIDENCE_SCHEMA_DECISION.md` | `0da5daed74ed9812bf2add6550468f39d1abe334400d66a70603a2fd0e1938da` |
| DEC-005-SCHEMA rev. 2 | `AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION.md` | `078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33` |
| DEC-005-SCHEMA-PREREQ | `AUTHORIZATION_EVIDENCE_SCHEMA_PREREQUISITES_DECISION.md` | `572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca` |
| DEC-005 IMPL-REC-001 | `AUTHORIZATION_EVIDENCE_SCHEMA_IMPLEMENTATION_RECORD.md` | `625fe44151e2dddabd60b583cbeb34a4142541afd64c28011f9b328f385fa711` |
| DEC-005 EXEC-REC-001 | `AUTHORIZATION_EVIDENCE_SCHEMA_VALIDATION_DB_EXECUTION_RECORD.md` | `1c22782c381359620a2eb966cb07ec73168c146ee0cdf54220165c96d6dfcf77` |
| IA-OD-WRITER-001 | `AUTHORIZATION_EVIDENCE_WRITER_PATH_IMPLEMENTATION_AUTHORIZATION.md` | `55d249a3474e8ee66fcd35096c3d1de135c7caaa7318ed4ad6448b0a1a63cd5d` |
| IA-OD-WRITER-001-IMPL-REC-001 | `AUTHORIZATION_EVIDENCE_WRITER_PATH_IMPLEMENTATION_RECORD.md` | `9d00c78fd94115b3ae82bb0a4dae105a99d7e7951a996ef0116aa637c61b56c7` |
| DP-1 preparation | `CONSENT_POLICY_LABEL_DECISION_PREPARATION.md` | `22eafc7be188a51c4f9769c4e477780a7bf1fd6475eb8074cdfc5ab700c406d4` |
| OD-13 preparation + decision (rev. 2) | `PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| IA-OD13-B implementation record | `PROVIDER_AUTHENTICITY_IMPLEMENTATION_RECORD.md` | `ac3c9d5f36d58a5eb7ee237832c2882577bd424a62ba1de6f7d4067d307ed035` |
| X1 preparation | `EXACT_RESULT_BINDING_DECISION_PREPARATION.md` | `508e512ed42945695ae899f079b63ce67841d25a4b1711ac139427b8407d3c42` |
| **X1 decision** (INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001) | `EXACT_RESULT_BINDING_DECISION.md` | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` |
| **X1 implementation record** (IA-OD13-X1-IMPL-REC-001) | `EXACT_RESULT_BINDING_IMPLEMENTATION_RECORD.md` | `e1b772134a2798b0ac99238eb72296526ff058b30843f0630aac6990437f20e2` |
| **Legacy-check preparation** (PREP-001, decided here) | `LEGACY_AUTHENTICITY_CHECK_DECISION_PREPARATION.md` | `164ed3939f285b02dc6f3b4dc55c8ea517a68db1897841d93882842816394ec6` |

### 1.3 Legacy function and X1 unchanged

| File | sha256 prefix | Result |
|---|---|---|
| `packages/core-research/src/providerAuthenticity.ts` | `2b891350` | = PREP-001 §1 |
| `packages/core-research/src/intentSourceProviderContract.ts` | `313607c8` | = PREP-001 §1 |
| `packages/core-research/src/intentSignal.ts` | `90db6d7d` | = PREP-001 §1 |
| `packages/core-research/src/index.ts` | `a1d3f43e` | = PREP-001 §1 |
| `apps/worker/src/searchWorker/intentIntake.ts` | `4f36ff2a` | = PREP-001 §1 |
| `packages/core-research/src/intentSourceProviderContract.test.ts` | `d33606f6` | = PREP-001 §1 |
| `apps/worker/src/searchWorker/worker.test.ts` | `cca074df` | = PREP-001 §1 |
| `packages/core-research/src/providerAuthenticity.test.ts` | `03982587` | = PREP-001 §1 |

References to `requireProviderAuthenticityForIntake` (source, excluding `node_modules`, `.git`, `.next`, `.turbo`, `dist`)
match PREP-001 §2.3 exactly: definition `providerAuthenticity.ts:357`, header comment `:16`, barrel re-export
`index.ts:279`, production import `intentSourceProviderContract.ts:34` with one call `:696` (comments `:678`, `:704`),
and the test import and 7 calls in `providerAuthenticity.test.ts`. No other importer.

### 1.4 Active FIRST_PARTY save path and runtime reachability

- `recordIntentIntakeForOwner` (`intentIntake.ts:93`) calls `requireExactProviderResultForIntake` at `:101`, before
  any lookup or write. `recordIntentSignalForOwner` (`:151`) delegates to it. X1 remains the active save-path check.
- Outside tests, both intake functions are only defined, called internally and re-exported
  (`apps/worker/src/searchWorker/index.ts:9-10`). **No runtime caller. OD-13 runtime gate: IN FORCE.**

---

## 2. Decision

| Item | Decision |
|---|---|
| Option | **C — Restrict** |
| Mechanism | **C-1 — Remove the `requireProviderAuthenticityForIntake` re-export from `packages/core-research/src/index.ts`; keep the module-level export in `providerAuthenticity.ts`** |
| Implementation authorization | NONE; requires a separate authorization |

### 2.1 Product Owner rationale (from PREP-001 §2 and §3)

1. **The exposure is real but latent.** The function binds FIRST_PARTY signals to a proof by integration ID only
   (PREP-001 §2.1). Called alone, it would restore the pre-X1 binding. No caller does so today: its only production
   caller is the first step of `requireExactProviderResultForIntake` (§2.3), and no runtime caller is wired (§2.5).
2. **Option A leaves the weaker check on the declared public entry point** with a JSDoc that still calls it the P3
   "save boundary", and nothing in code distinguishes "sub-step of X1" from "sufficient check" (§3 A-4, A-6, A-8).
   Correct use by a future wiring change would rest on documentation and review alone.
3. **Option B is advisory only.** The repository has no `@deprecated` usage and no deprecated-symbol lint rule
   (§3 B-6), `tsc` does not fail on deprecated use (B-2), and a tag on the function would also flag X1's own internal
   call and the tests (B-3). It discourages misuse but does not remove the exposure.
4. **C-1 is the narrowest restricting mechanism.** It takes the weaker check off the declared public entry point of
   `@acos/core-research`, so the package's public API offers only the exact-result check as the FIRST_PARTY save
   precondition (§3 C-4 row). The static search found nothing that imports the symbol through the barrel (§2.3, §2.7):
   both importers use the relative module path.
5. **C-1 leaves X1 untouched.** The module-level export, signature and behavior stay the same, so X1's first step and
   the X1 implementation record's "unchanged" statement remain valid (§2.7, §4). C-3 would instead require changing
   X1's call site and rewriting 5 tests across 4 files; removing the underlying function would require changing X1.
6. **C-1 needs no configuration change.** C-2 (package `"exports"` map) affects all 9 dependents with unverified
   resolver compatibility, and C-4 (lint rule) is enforced only where lint runs; both are configuration changes and
   broader than this concern (§3 C-2, C-4).

### 2.2 Known limits accepted with this decision

- **Deep-path imports are not blocked.** `@acos/core-research/package.json` has no `"exports"` field; a deep import of
  `src/providerAuthenticity` is not prevented by package configuration, and whether it would resolve under each
  dependent is unverified (PREP-001 §2.2, C-1 note). No such deep import exists today.
- **"No current break" is from static search only.** The finding that removing the barrel re-export breaks nothing has
  not been compilation-verified (PREP-001 §2.7).
- The module-level export remains, because X1 lives in another module and imports it relatively (PREP-001 C-3 note;
  INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 §3.2).

### 2.3 Consequences to be carried into any implementation authorization

A future implementation authorization for C-1 should, at minimum:

1. Limit the production change to removing the one re-export line at `packages/core-research/src/index.ts:279`.
2. Leave `providerAuthenticity.ts`, `intentSourceProviderContract.ts`, `intentIntake.ts` and X1's behavior unchanged.
3. Include compile verification of the dependents of `@acos/core-research` to confirm the static finding in §2.2.
4. State whether an optional test asserting that the barrel does not export the symbol (PREP-001 §3 C-7) is in scope.
5. State whether the header comment or JSDoc wording is in scope; this decision does not authorize either.

This decision does **not** select C-2, C-3 or C-4, and does not select Option B's annotation in addition to C-1.

---

## 3. What stays unchanged

- The X1 check (`requireExactProviderResultForIntake`) and its call from `recordIntentIntakeForOwner`.
- The decided P3 behavior that X1 runs first (verifier-issued proof, Ed25519 re-verified at save time, integration-ID
  match).
- `requireProviderAuthenticityForIntake` itself: definition, module-level export, signature, behavior and tests.
- OD-1 to OD-13, IA-1, IA-2, DP-1, DOC-1, IA-OD13-B, and the X1 decision and implementation.
- The OD-13 runtime gate. This decision does not lift it.
- PREP-001, which is preserved unchanged.

## 4. Authority

```text
Implementation authorization: NONE
Runtime-wiring authorization: NONE
Provider-call authorization: NONE
Database authority: NONE
Validation authority: NONE
Deployment authority: NONE
```

## 5. Final state

```text
Decision status: DECIDED
Selected policy: C — Restrict
Selected mechanism: C-1 — Remove the barrel re-export
Selected policy operational: NO
Legacy function status: EXPORTED (module and barrel; unchanged until separately authorized)
Current FIRST_PARTY save path: requireExactProviderResultForIntake (via recordIntentIntakeForOwner)
Identified current runtime bypass: NONE
OD-13 runtime gate: IN FORCE
Implementation authority: NONE
Runtime-wiring authority: NONE
```

## 6. Execution counters (this record)

```text
Production files changed: 0
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring changes: 0
Validation sessions: 0
Participant contacts: 0
Commits: 0
Files created: 1 (this record)
Files modified: 0
```

**INTENT-INTAKE-OD13-LEGACY-P3-DEC-001 — DECIDED — OPTION C / C-1 SELECTED — NO IMPLEMENTATION AUTHORITY**
