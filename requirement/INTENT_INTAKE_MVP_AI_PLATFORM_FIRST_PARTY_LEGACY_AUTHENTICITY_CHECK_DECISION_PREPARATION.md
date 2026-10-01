# Intent Intake MVP

## AI-Platform FIRST_PARTY — Legacy Integration-ID Check (`requireProviderAuthenticityForIntake`) — Decision Preparation

**Record ID:** INTENT-INTAKE-OD13-LEGACY-P3-PREP-001
**Date:** 2026-09-30
**Type:** Product Owner decision preparation (API exposure only)
**Relates to:** INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 (X1 decision), IA-OD13-X1-IMPL-REC-001 (X1 implementation record,
remaining issue 1), IA-OD13-B

```text
Current X1 implementation: IMPLEMENTED
Legacy function status: EXPORTED
Product Owner decision: PENDING
Implementation authority: NONE
Runtime-wiring authority: NONE
```

This record presents options A to C without recommending or ranking them. It changes no code, test, export, annotation,
caller, configuration or wiring.

### Scope of the concern

The concern is **future misuse and API exposure, not an identified current bypass.** Findings (§2):

- `recordIntentIntakeForOwner`, the only FIRST_PARTY save path, uses `requireExactProviderResultForIntake`.
- No runtime caller is wired. The OD-13 runtime gate is in force.
- `requireProviderAuthenticityForIntake` remains exported from the package's public entry point. On its own it binds
  FIRST_PARTY signals to a proof by integration ID only, not to the exact verified result.

---

## 1. Pre-change verification

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = IA-OD13-X1-IMPL-REC-001 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `6f27bd66e28ce687e92c9c2769bb2272c9e9240236bd826ff01e5fb1e0e3b195` | = post-change fingerprint in IA-OD13-X1-IMPL-REC-001 §1 |
| Staged files / working-tree entries | 0 / 226 | 225 + the X1 implementation record |
| X1 decision record (`…_EXACT_RESULT_BINDING_DECISION.md`) | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` | unchanged |
| X1 implementation record (`…_EXACT_RESULT_BINDING_IMPLEMENTATION_RECORD.md`) | `e1b772134a2798b0ac99238eb72296526ff058b30843f0630aac6990437f20e2` | First recorded hash (reference) |
| X1 production / test file hashes | `providerAuthenticity.ts` `2b891350…`, `intentSourceProviderContract.ts` `313607c8…`, `intentSignal.ts` `90db6d7d…`, `index.ts` `a1d3f43e…`, `intentIntake.ts` `4f36ff2a…`, `intentSourceProviderContract.test.ts` `d33606f6…`, `worker.test.ts` `cca074df…`, `providerAuthenticity.test.ts` `03982587…` | = IA-OD13-X1-IMPL-REC-001 §1 |

### 1.1 Governing-record hashes (sha256)

All files are `requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_…`. Every hash matches the value recorded in
INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 §1.2.

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

No test, typecheck, build or database command was run for this record.

---

## 2. Trace of `requireProviderAuthenticityForIntake` [IMPL-FACT]

The whole repository was searched, excluding `node_modules`, `.git`, `.next`, `.turbo` and `dist`. `.next` was then
checked separately (§2.6).

### 2.1 Definition

`packages/core-research/src/providerAuthenticity.ts:357`, as `export function requireProviderAuthenticityForIntake(signals, proof, now)`.
It does the following:

- It returns immediately when no signal is `FIRST_PARTY`.
- It requires a verifier-issued proof, using the module-private `ISSUED` WeakMap.
- It re-verifies Ed25519 against the key as registered at `now`.
- It requires each FIRST_PARTY `authorizationEvidence.integrationId` to equal the verified identity.

It does **not** compare signal content, company, order or count with the verified result. It also depends on the
module-private `ISSUED` state and `checkSignature`, so its body cannot be moved to another module without exposing
those.

### 2.2 Exports and public boundary

| Where | Line | Kind |
|---|---|---|
| `providerAuthenticity.ts` | 357 | module export (definition) |
| `packages/core-research/src/index.ts` | 279 | **re-export from the package barrel** |

`@acos/core-research/package.json` declares `"main": "src/index.ts"`, `"types": "src/index.ts"` and **no `"exports"`
field**. So `index.ts` is the declared public entry point, but nothing in package configuration restricts deep paths.
Whether a deep import such as `@acos/core-research/src/providerAuthenticity` would resolve under each dependent's
TypeScript or bundler settings was not verified. No such deep import of this package exists today.

These packages depend on `@acos/core-research`: `apps/web`, `apps/worker`, `packages/core-ai-usage`, `core-outreach`,
`core-proposal`, `core-opportunity`, `core-qualification`, `core-personalization` and `tests`.

### 2.3 Imports and calls

| File | Kind | Import path | Calls |
|---|---|---|---|
| `packages/core-research/src/intentSourceProviderContract.ts:34` | **production import** | relative `./providerAuthenticity` | **1 call** (`:696`), the first step of `requireExactProviderResultForIntake` (X1). Two comment mentions (`:678`, `:704`). |
| `packages/core-research/src/providerAuthenticity.test.ts:18` | **test import** | relative `./providerAuthenticity` | 7 calls in 5 tests (`:378`, `:383`, `:388`, `:394`, `:401`, `:402`, `:412`) in `describe('P3 — requireProviderAuthenticityForIntake (save boundary)')` |
| `packages/core-research/src/index.ts:279` | re-export | — | none |
| `packages/core-research/src/providerAuthenticity.ts:16` | header comment | — | none |

**No other file imports or calls it.** In particular, there is no import in `apps/worker` (production or test), `apps/web`,
any other package or `tests/integration`. `apps/worker/src/searchWorker/intentIntake.ts` imports
`requireExactProviderResultForIntake` only. **No importer uses the package barrel for this symbol.** Both importers use
the relative module path.

### 2.4 FIRST_PARTY and PUBLIC_INTENT use

| Question | Finding |
|---|---|
| Any caller that can process FIRST_PARTY / `SUPPLIED_TO_US`? | **Production: only `requireExactProviderResultForIntake`**, which calls it first and then applies the X1 comparison. Tests: `providerAuthenticity.test.ts` calls it directly with FIRST_PARTY signals derived through `normalizeVerifiedProviderResult` (integration-ID behavior only). |
| Any caller using it for PUBLIC_INTENT-only behavior? | **No production caller.** One test (`:378`) checks the PUBLIC_INTENT-only no-op, and `:412` includes a PUBLIC_INTENT entry alongside FIRST_PARTY. The PUBLIC_INTENT-only no-op of the save path is provided by `requireExactProviderResultForIntake`, which returns after this call when no signal is FIRST_PARTY. |
| Is `requireExactProviderResultForIntake` sufficient for every FIRST_PARTY save path? | **Yes, for the paths that exist.** The only production caller of the IA-1 writer that can carry FIRST_PARTY is `recordIntentIntakeForOwner` (`intentIntake.ts:128`), and it runs the X1 check before any lookup or write. `recordIntentSignalForOwner` refuses FIRST_PARTY and delegates to it. The Research path (`service.ts:135`) writes `toNewResearchSignals` output, whose kinds come from `FIELD_KIND` and never include FIRST_PARTY (`persist.ts:25`). |

### 2.5 Runtime reachability

**No runtime caller exists.** Outside tests, `recordIntentIntakeForOwner` and `recordIntentSignalForOwner` are only
defined, called internally and re-exported (`apps/worker/src/searchWorker/index.ts`). No route, job or entry point
calls them. `requireProviderAuthenticityForIntake` is reachable only through `requireExactProviderResultForIntake`,
which is itself reachable only from that unwired intake function. **OD-13 runtime gate: IN FORCE.**

### 2.6 Build output (derived; not source)

`apps/web/.next/server/app/(client-finder)/opportunities/page.js` and `…/[id]/page.js` (mtime 2026-09-30 20:45) contain
the text of `providerAuthenticity.ts` and `intentSourceProviderContract.ts`. The web app imports other symbols through
the `@acos/core-research` barrel, and the dev bundle includes the module source. `apps/web` source has no import or call
of the function. This is a derived artifact, not a caller.

### 2.7 What would break (static search only; not compiled)

| Change | Breaks |
|---|---|
| Remove only the `index.ts` re-export | Nothing found: no importer uses the barrel for this symbol. |
| Remove or rename the module-level export in `providerAuthenticity.ts` | `intentSourceProviderContract.ts` (the X1 check's first step) and `providerAuthenticity.test.ts` (5 tests). |
| Change its behavior or signature | The same two files, and X1's first step, whose behavior the X1 implementation record says is "unchanged". |

---

## 3. Options [OPEN — not ranked, none selected]

### Option A — Remain available

`requireProviderAuthenticityForIntake` stays exported from the module and the package barrel, usable as today.

| # | Aspect | Content |
|---|---|---|
| 1 | Security / invariant effect | No change today: the only FIRST_PARTY save path enforces X1. The weaker guarantee stays **available**: a future caller holding a genuine proof for integration X could call this function alone and then save FIRST_PARTY signals of integration X that did not come from that result. That would be the pre-X1 V3 binding. It is a latent API exposure, not a current bypass. |
| 2 | Compatibility effect | Full: no public API or behavior change. |
| 3 | Current callers affected | None. |
| 4 | FIRST_PARTY implications | No current FIRST_PARTY caller uses it alone; the X1 check calls it as a sub-step. Nothing in code distinguishes "sub-step of X1" from "sufficient save-boundary check". Its JSDoc still describes it as the P3 "save boundary". |
| 5 | PUBLIC_INTENT implications | None. It is a no-op for PUBLIC_INTENT-only events, and no production caller uses it that way. |
| 6 | Export / API implications | The barrel keeps two P3-named functions with different guarantees. |
| 7 | Test implications | None required. The existing P3 tests stay valid. |
| 8 | Runtime-wiring implications | Before any wiring authorization, whoever wires a caller must know to use `requireExactProviderResultForIntake` (or `recordIntentIntakeForOwner`). Only documentation and review would ensure this. |
| 9 | Code changes required | None. |
| 10 | Separate implementation authorization | Not required for the code, since nothing changes. Recording the decision is a Product Owner action. |

### Option B — Deprecate

The function stays available for compatibility but is marked as deprecated or unsuitable as a FIRST_PARTY save-boundary
check. One form is a JSDoc `@deprecated` tag with a message naming `requireExactProviderResultForIntake`, possibly with
an updated description or header comment.

| # | Aspect | Content |
|---|---|---|
| 1 | Security / invariant effect | Advisory only. **Deprecation does not technically prevent** a future caller from calling it and bypassing X1. Signature, behavior and export stay the same. |
| 2 | Compatibility effect | Full at compile time and run time. Editors may show a strike-through. `tsc` does not fail on deprecated use. |
| 3 | Current callers affected | Wording only. The internal call in `requireExactProviderResultForIntake` and the 7 test calls would appear as deprecated uses, unless the tag is placed only on the barrel path. TypeScript does not support per-re-export deprecation, so that would need an aliasing re-export. |
| 4 | FIRST_PARTY implications | It discourages using it alone for FIRST_PARTY saving; it does not prevent it. |
| 5 | PUBLIC_INTENT implications | None. |
| 6 | Export / API implications | Export unchanged. The deprecation text becomes part of the documented API. The repo currently has **no `@deprecated` usage and no ESLint deprecation rule** (`.eslintrc.json`, `eslint.config.mjs`). |
| 7 | Test implications | None strictly required. Optional: a test or lint check that no non-test module outside `core-research` imports the symbol. |
| 8 | Runtime-wiring implications | Adds an in-code warning for whoever wires a caller. Review is still needed. |
| 9 | Code changes required | Yes: comment and annotation only in `providerAuthenticity.ts` (and possibly `index.ts`). Optionally a lint rule, which is a configuration change. |
| 10 | Separate implementation authorization | Yes. This task grants none. |

### Option C — Restrict

Prevent callers outside the X1 check from using the integration-ID-only check as a FIRST_PARTY save boundary. Below
are the narrowest repository-compatible mechanisms found. **None is chosen or implemented.**

| Mechanism | What it would change | Notes (from §2) |
|---|---|---|
| **C-1** Remove the barrel re-export | Delete `requireProviderAuthenticityForIntake` from `index.ts:279`; keep the module-level export | The static search found nothing that breaks (§2.7). `intentSourceProviderContract.ts` and `providerAuthenticity.test.ts` import it relatively. The public entry point no longer offers it. **Deep-path imports are not blocked by package configuration** (no `"exports"` field; resolution under each dependent is unverified). |
| **C-2** Restrict package entry points | Add an `"exports"` map to `@acos/core-research/package.json` exposing only `"."` (plus C-1) | This is a configuration change affecting all 9 dependents. It also closes any other deep paths. It is broader than this concern, and compatibility with each dependent's resolver is unverified. |
| **C-3** Separate the weaker check from the intake API | Replace the public P3-named function with a module-level primitive used only by `requireExactProviderResultForIntake` (for example, a re-verification step that doesn't claim to be the P3 check), not re-exported from the barrel | This requires changes to `providerAuthenticity.ts`, `intentSourceProviderContract.ts`, `index.ts` and `providerAuthenticity.test.ts`. It must preserve X1's first-step behavior exactly. The primitive still needs a module-level export, because the X1 check lives in another module (the import-cycle constraint of INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 §3.2). |
| **C-4** Import restriction by lint | `no-restricted-imports` / `no-restricted-syntax` for the symbol outside `packages/core-research/src` | Enforced only where lint runs (CI or local). It is a configuration change and does not change the API. It can be combined with C-1. |

| # | Aspect | Content |
|---|---|---|
| 1 | Security / invariant effect | Narrows or removes the ways a future caller could reach the integration-ID-only check without X1. C-2 and C-3 are structural. C-1 removes it from the declared entry point only. C-4 is enforcement by tooling. None changes the X1 check or current runtime behavior. |
| 2 | Compatibility effect | C-1: no current break found. C-2: potential effect on every dependent (unverified). C-3: internal API change across 4 files. C-4: none at compile time. |
| 3 | Current callers affected | Production: `intentSourceProviderContract.ts` under C-3 only. Tests: `providerAuthenticity.test.ts` under C-3 (and possibly its import path). No worker or web caller. |
| 4 | FIRST_PARTY implications | The package API would expose only the exact-result check (or `recordIntentIntakeForOwner`) as the FIRST_PARTY save precondition. |
| 5 | PUBLIC_INTENT implications | None. The PUBLIC_INTENT-only no-op stays provided by `requireExactProviderResultForIntake`. |
| 6 | Export / API implications | This changes the public surface of `@acos/core-research` (C-1, C-2, C-3), or adds an import rule (C-4). |
| 7 | Test implications | C-1: none required; optionally a test asserting the barrel does not export the symbol. C-3: rewrite the 5 P3 tests against the primitive or the X1 function, and keep the key-expiry, forged-proof and integration-mismatch cases. C-2: a resolution check across dependents. C-4: a lint fixture or CI step. |
| 8 | Runtime-wiring implications | A future wiring change could not use the weaker check through the public API (to the degree of the mechanism chosen). The OD-13 gate is unaffected. |
| 9 | Code changes required | Yes (C-1, C-3). Configuration changes (C-2, C-4). |
| 10 | Separate implementation authorization | Yes. C-2 and C-4 also involve configuration changes, which are outside any current authority. |

---

## 4. What stays unchanged under every option

- The X1 check (`requireExactProviderResultForIntake`) and its call from `recordIntentIntakeForOwner`.
- The decided P3 behavior that X1 runs first: verifier-issued proof, Ed25519 re-verified at save time, and the
  integration-ID match (INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001; IA-OD13-X1-IMPL-REC-001 §2 step 1).
- OD-1 to OD-13, IA-1, IA-2, DP-1, DOC-1, IA-OD13-B, and the X1 decision and implementation.
- The OD-13 runtime gate. No option lifts it.

## 5. Product Owner decision form

| Item | Decision |
|---|---|
| Option (A / B / C; for C, which mechanism or mechanisms) | PENDING |
| Implementation authorization | NONE; requires a separate authorization |

## 6. Final state

```text
Current X1 implementation: IMPLEMENTED
Legacy function status: EXPORTED
Current FIRST_PARTY save path: requireExactProviderResultForIntake (via recordIntentIntakeForOwner)
Identified current runtime bypass: NONE (no runtime caller; the only production caller is the X1 check)
Product Owner decision: PENDING
Implementation authority: NONE
Runtime-wiring authority: NONE
OD-13 runtime gate: IN FORCE
```

## 7. Execution counters (this record)

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
```

**INTENT-INTAKE-OD13-LEGACY-P3-PREP-001 — LEGACY FUNCTION EXPORTED — DECISION PENDING — NO IMPLEMENTATION AUTHORITY**
