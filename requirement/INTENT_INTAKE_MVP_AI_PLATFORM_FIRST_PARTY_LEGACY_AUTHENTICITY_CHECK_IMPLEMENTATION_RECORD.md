# Intent Intake MVP

## AI-Platform FIRST_PARTY — Legacy Integration-ID Check — C-1 Implementation Record

**Record ID:** IA-OD13-LEGACY-C1-IMPL-REC-001
**Date:** 2026-09-30
**Type:** Implementation record (C-1 only)
**Implements:** INTENT-INTAKE-OD13-LEGACY-P3-DEC-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_LEGACY_AUTHENTICITY_CHECK_DECISION.md`,
sha256 `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95`), Option C, mechanism C-1
**Authorization:** Product Owner implementation authorization IA-OD13-LEGACY-C1 (2026-09-30): remove the
`requireProviderAuthenticityForIntake` re-export from `packages/core-research/src/index.ts` and compile-verify dependents.

```text
Implementation status: IMPLEMENTED (uncommitted)
Selected decision: C-1
Legacy function status: MODULE EXPORT ONLY (removed from package barrel)
Implementation authorization used: C-1 only
Runtime-wiring authority: NONE
OD-13 runtime gate: IN FORCE
```

---

## 1. Pre-change verification

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = DEC-001 §1.1 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `6f27bd66e28ce687e92c9c2769bb2272c9e9240236bd826ff01e5fb1e0e3b195` | = DEC-001 §1.1 |
| Staged / working-tree entries | 0 / 228 | 227 in DEC-001 + DEC-001 itself |
| C-1 decision (DEC-001) | `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95` | as created |
| Preparation (PREP-001) | `164ed3939f285b02dc6f3b4dc55c8ea517a68db1897841d93882842816394ec6` | unchanged |
| X1 decision | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` | unchanged |
| X1 implementation record | `e1b772134a2798b0ac99238eb72296526ff058b30843f0630aac6990437f20e2` | unchanged |
| `index.ts` / `providerAuthenticity.ts` / `intentSourceProviderContract.ts` / `intentIntake.ts` / `providerAuthenticity.test.ts` | `a1d3f43e…` / `2b891350…` / `313607c8…` / `4f36ff2a…` / `03982587…` | = DEC-001 §1.3 |
| Runtime callers of `recordIntentIntakeForOwner` / `recordIntentSignalForOwner` | definition, internal call, re-export in `apps/worker/src/searchWorker/index.ts:9-10` only | none wired; OD-13 IN FORCE |

## 2. Change

`packages/core-research/src/index.ts`: removed one line, `requireProviderAuthenticityForIntake,`, from the
`export { … } from './providerAuthenticity'` block (formerly line 279). No other line changed.

| Check | Value |
|---|---|
| `index.ts` sha256 after | `c20182e5fb9ebab4364fc4e2e68d409a229557cfc4894d7c5c9bad33453af7fc` |
| Reinserting the removed line into the new file reproduces | `a1d3f43e0c50f590fc57cdbd7d3edec10829d0498f424f4b4abf9e54fce926a6` (= pre-change), so the delta is exactly one line |
| Code fingerprint after (excl. `requirement/`) | `b056fc1315ae7da155d693a63d2c38de06fd61b5fc11d4c483341f8c19fab3fd` |
| Code fingerprint after (excl. `requirement/` and `index.ts`) | `15bfaa2d65787572c82e9ba43a00e11294326210add4d0aca28d23ca497cd793` |
| Working-tree entries after (before this record) | 228 (`index.ts` was already modified vs HEAD) |

Unchanged after the edit (sha256 prefix): `providerAuthenticity.ts` `2b891350`, `intentSourceProviderContract.ts`
`313607c8`, `intentSignal.ts` `90db6d7d`, `intentIntake.ts` `4f36ff2a`, `providerAuthenticity.test.ts` `03982587`,
`intentSourceProviderContract.test.ts` `d33606f6`, `worker.test.ts` `cca074df`.

## 3. Consumer search (after change)

Scope: repository, excluding `node_modules`, `.git`, `.next`, `.turbo`, `dist`; `.next` checked separately.

| Category | Findings |
|---|---|
| Internal relative imports (production) | `intentSourceProviderContract.ts:34` (`./providerAuthenticity`), 1 call `:696` — the X1 first step. Comments `:678`, `:704`; header comment `providerAuthenticity.ts:16`; definition `:357`. |
| Public `@acos/core-research` barrel imports of the symbol | **None.** |
| Deep-path imports (`@acos/core-research/…`) | None. Two text matches are comments (`apps/worker/src/index.ts:66`, `packages/core-opportunity/src/adapters.ts:138`). |
| Namespace / dynamic barrel use | `apps/web/app/(client-finder)/opportunities/[id]/page.test.ts:62` spreads `importOriginal<typeof import('@acos/core-research')>()` inside a `vi.mock`; it does not name the symbol. |
| Test-only references | `providerAuthenticity.test.ts:18` (relative import) and 7 calls in 5 tests. |
| Stale build artifacts | `apps/web/.next/server/app/(client-finder)/opportunities/page.js` and `…/[id]/page.js` contain the module text. Derived output, not a consumer; not modified. |

## 4. Compile / type verification

`tsc --noEmit` (each package's own `typecheck` script command) run in each package that is or depends on
`@acos/core-research`. `apps/web` was run with `--incremental false` so its tracked `tsconfig.tsbuildinfo` was not
rewritten (its sha256 was identical before and after).

| Package | Exit | TS errors |
|---|---|---|
| `packages/core-research` | 0 | 0 |
| `apps/worker` | 0 | 0 |
| `apps/web` | 0 | 0 |
| `packages/core-ai-usage` | 0 | 0 |
| `packages/core-outreach` | 0 | 0 |
| `packages/core-proposal` | 0 | 0 |
| `packages/core-opportunity` | 0 | 0 |
| `packages/core-qualification` | 0 | 0 |
| `packages/core-personalization` | 0 | 0 |
| `tests` | 0 | 0 |

This confirms by compilation the static finding in PREP-001 §2.7 and closes DEC-001 §2.2 item 2. No unit,
integration or database test was run.

## 5. Limits that remain (from DEC-001 §2.2)

- Deep-path imports are still not blocked by package configuration (no `"exports"` field). None exists today.
- The module-level export remains, as decided, because X1 imports it relatively from another module.
- The JSDoc/header comment still describes the function as the P3 save boundary; not in scope of this authorization.

## 6. What stays unchanged

- `requireProviderAuthenticityForIntake`: definition, module-level export, signature, behavior and tests.
- `requireExactProviderResultForIntake` (X1) and its call from `recordIntentIntakeForOwner`.
- All other exports of `index.ts`; all configuration, schema, migrations and runtime wiring.
- The OD-13 runtime gate.

## 7. Authority

```text
Implementation authorization used: C-1 only
Runtime-wiring authorization: NONE
Provider-call authorization: NONE
Database authority: NONE
Validation authority: NONE
Deployment authority: NONE
```

## 8. Execution counters

```text
Production files changed: 1 (packages/core-research/src/index.ts)
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Runtime wiring changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Validation sessions: 0
Participant contacts: 0
Commits: 0
Typecheck runs: 10 packages, 0 errors
Files created: 1 (this record)
```

**IA-OD13-LEGACY-C1-IMPL-REC-001 — C-1 IMPLEMENTED — BARREL RE-EXPORT REMOVED — DEPENDENTS TYPECHECK CLEAN — OD-13 GATE IN FORCE**
