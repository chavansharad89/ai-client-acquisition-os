# Intent Intake MVP

## AI-Platform FIRST_PARTY — OD-13 Ingress (Alternative I) — Implementation Record

**Record ID:** IA-OD13-INGRESS-I-IMPL-REC-001
**Date:** 2026-09-30
**Type:** Implementation record (Alternative I only)
**Implements:** INTENT-INTAKE-OD13-INGRESS-DEC-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md`,
sha256 `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6`), IG-1..IG-7
**Authorization:** Product Owner implementation authorization (2026-09-30), limited to: (1) the push ingress route in
`apps/web`; (2) the `apps/web` → `@acos/worker` dependency; (3) the owner/search binding in the integration
registration. No naming, key registration, real configuration, runtime activation, DB, provider, validation or
deployment authority.

```text
Implementation status: IMPLEMENTED (uncommitted)
Selected decision: Alternative I
Route live for any integration: NO (registrations empty)
Implementation authorization used: Alternative I only
Runtime-wiring authority: NONE
OD-13 runtime gate: IN FORCE
```

---

## 1. Pre-change verification

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = DEC-001 §1 |
| Staged files / working-tree entries | 0 / 231 | = DEC-001 + DEC-001 itself |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `b056fc1315ae7da155d693a63d2c38de06fd61b5fc11d4c483341f8c19fab3fd` | = DEC-001 §1 |
| Decision DEC-001 | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` | as created |
| Preparation PREP-001 | `b1c558bd574cff4a878a610e790c5d4f0c1dca244764c4ea9d328a14472b94e7` | unchanged |
| OD-13 / Option B / X1 / C-1 / design rev. 2 records | `9b50e6cf…`, `ac3c9d5f…`, `508e512e…`, `c67d09a8…`, `e1b77213…`, `164ed393…`, `55dd133e…`, `7e6e4113…`, `57f6a42f…` | = DEC-001 §1.1 |
| Implementation files | `index.ts` `c20182e5`, `providerAuthenticity.ts` `2b891350`, `intentSourceProviderContract.ts` `313607c8`, `intentSignal.ts` `90db6d7d`, `intentIntake.ts` `4f36ff2a`, `providerAuthenticity.test.ts` `03982587`, `intentSourceProviderContract.test.ts` `d33606f6`, `worker.test.ts` `cca074df` | = DEC-001 §1.1 |

## 2. Changes

| Area | File | sha256 prefix |
|---|---|---|
| Route (new) | `apps/web/app/api/intent-sources/push/route.ts` — `POST`, `runtime = 'nodejs'`, lazy registry/intake, thin adapter | `173373c2` |
| Route logic (new) | `apps/web/src/server/intentIngress.ts` — capped raw-body read → `verifyProviderEnvelope` → owner from verified identity → `normalizeVerifiedProviderResult` → P3; IG-4 mapping | `a5ac1536` |
| P3 binding (new) | `apps/web/src/server/intentIngressIntake.ts` — calls `@acos/worker/searchWorker` `recordIntentIntakeForOwner`; pg deps built lazily on first call; `notConfiguredResearchProviderFactory()` | `a9fc8823` |
| Registration (new) | `apps/web/src/server/intentIntegrationRegistry.ts` — `{ integrationId, owner: { userId, searchId }, keys[] }`; builds the unchanged `createProviderPublicKeyRegistry`; `ownerOf(verifiedIntegrationId)`; `INTENT_INTEGRATION_REGISTRATIONS = []` | `2485c0c0` |
| Dependency | `apps/web/package.json`: `"@acos/worker": "workspace:*"` (1 line) | `a9316de1` |
| Lockfile | `pnpm-lock.yaml`: `+3` lines (`@acos/worker: link:../worker` under `apps/web`), via `pnpm install --offline` | `5219f133` |
| Tests (new) | `apps/web/src/server/intentIngress.test.ts` (21), `apps/web/src/server/intentIngressIntake.test.ts` (2), `apps/web/app/api/intent-sources/push/route.test.ts` (2) | `a85af6e0`, `0efc4331`, `bc3bea89` |

Implementation choices within DEC-001 (Q10 left header names and body limit to implementation):

- Headers: `x-acos-integration-id`, `x-acos-key-id`, `x-acos-signature`.
- Body read as a stream capped at `MAX_PROVIDER_ENVELOPE_BYTES`; `Content-Length` over the cap is refused unread.
- `200 {"status":"accepted"}`; `401 {"error":"Invalid signature"}` for every P1 refusal and for a verified identity
  without registration; `400 {"error":"Unprocessable payload"}` for P2 non-`NORMALIZED` outcomes and for P3
  `IntentSignalValidationError` / `IntentIntakeSearchNotFoundError`; `500 {"error":"Internal error"}` otherwise.
- Log meta limited to `externalId`, `field`, `reason` (OD-11); the 500 log carries only the error name.

## 3. What stayed unchanged

`providerAuthenticity.ts`, `intentSourceProviderContract.ts`, `intentSignal.ts`, `index.ts` (C-1 intact; no re-export of
`requireProviderAuthenticityForIntake`), `intentIntake.ts` (not moved or copied), `apps/worker` exports, OD-1..OD-13,
Q1..Q12, X1, IA-1, OD-8 transaction, OD-12 no-retry, 90-day rule, 5-minute freshness, no retention; schema,
migrations, `next.config.mjs`, env files, Dockerfile.

## 4. Verification (local only)

| Check | Result |
|---|---|
| New tests (3 files) | 25 / 25 passed |
| `apps/web` full unit suite (`vitest run`) | 13 files, 198 / 198 passed |
| `tsc --noEmit` `apps/web` (`--incremental false`; `tsconfig.tsbuildinfo` not rewritten) | exit 0 |
| `tsc --noEmit` `apps/worker`, `packages/core-research` | exit 0, exit 0 |
| `eslint` on the 7 new files | 0 errors, 0 warnings |

Covered: exact-bytes verification (pretty-printed signed body accepted; one appended byte refused); non-JSON body with
bad signature → 401 (no parse before verification); missing signature, unknown key, stale `signedAt`, oversized
body → 401; owner/search from registration despite `x-acos-user-id` headers, envelope `userId`/`searchId` and a
different `businessId`; unregistered sender-asserted integration → 401; P2 REJECTED / no evidence → 400; P3
validation and search-not-found → 400; unexpected error → 500 without detail; malformed registrations refused;
production registrations empty → 401 and `getPool` never called; P3 delegates to the worker function; C-1 barrel
check. The accepted-path fake P3 runs the real `requireExactProviderResultForIntake` (X1).

Not run: any database-backed or integration test, `next build`.

## 5. Remaining issues (not in scope)

1. **Research step not configured on this path.** `researchProvider` is the not-configured factory (provider-call
   authority NONE). If a pushed result's Prospect has no category-plausibility determination, the inline Research
   step throws after the OD-8 signal transaction has committed, and the push gets a 500 with signals saved.
   Resolving this needs a provider-call decision at wiring time.
2. **`NO_INTENT_EVIDENCE` / `UNATTRIBUTED` → 400.** IG-4 names only saved / authenticity / validation / error;
   these non-saved P2 outcomes were mapped to the 400 class. Product Owner confirmation advisable.
3. **Docker build.** `apps/web/Dockerfile` deps stage copies `apps/web/package.json` and `packages/` but not
   `apps/worker/package.json`; the new workspace dependency will likely not resolve in the image build. Deployment
   authority is NONE; not changed.
4. **Configuration source for registrations.** Registrations are a code-level empty list; loading them from
   validated server configuration (Q3 b) is left to the integration-naming / key-registration authorization.
5. Fresh DB-backed integration run (audit item 12) still outstanding.

## 6. Execution counters

```text
Production files changed: 4 new (route.ts, intentIngress.ts, intentIngressIntake.ts, intentIntegrationRegistry.ts)
                          + apps/web/package.json (1 line) + pnpm-lock.yaml (+3 lines)
Test files changed: 3 new
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0 (pnpm install --offline)
Runtime wiring: 0 (route not live; no integration registered)
Integration naming: 0
Key registration: 0
Validation: 0
Deployment: 0
Commits: 0
Code fingerprint after (excl. requirement/; tracked files only): 2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b
Files created: 8 (7 code/test + this record)
```

## 7. Authority

```text
Implementation authorization used: Alternative I only
Runtime-wiring authorization: NONE
Provider-call authorization: NONE
Database authority: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Deployment authority: NONE
OD-13 runtime gate: IN FORCE
```

**IA-OD13-INGRESS-I-IMPL-REC-001 — ALTERNATIVE I IMPLEMENTED — NOT LIVE — OD-13 RUNTIME WIRING: NOT AUTHORIZED / GATE IN FORCE**
