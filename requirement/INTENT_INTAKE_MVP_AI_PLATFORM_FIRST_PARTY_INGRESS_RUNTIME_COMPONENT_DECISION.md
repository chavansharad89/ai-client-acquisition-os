# Intent Intake MVP

## AI-Platform FIRST_PARTY — OD-13 Ingress / Runtime-Component — Product Owner Decision

**Decision ID:** INTENT-INTAKE-OD13-INGRESS-DEC-001
**Date:** 2026-09-30
**Type:** Product Owner decision (architecture only; no execution authority)
**Decides:** INTENT-INTAKE-OD13-INGRESS-PREP-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION_PREPARATION.md`,
sha256 `b1c558bd574cff4a878a610e790c5d4f0c1dca244764c4ea9d328a14472b94e7`), IG-1 to IG-7
**Decision maker:** Product Owner (delegated authority, as for OD-1..OD-13 and INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001)
**Convention:** separate decision file; the preparation record is left unchanged (as for the X1 and legacy-P3
decisions). Analyst alternatives and evidence remain in the preparation record; §3 below holds the decisions only.

```text
Decision status: DECIDED
Selected option: Alternative I — web ingress calls the worker's intake path in-process
IG-1 .. IG-7: DECIDED
Implementation authority: NONE
Runtime-wiring authority: NONE
Database authority: NONE
Provider-call authority: NONE
Deployment authority: NONE
OD-13 runtime gate: IN FORCE
```

---

## 1. Baseline re-verified before deciding

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = PREP-001 §1 |
| Staged files | 0 | = PREP-001 |
| Working-tree entries | 230 | 229 + PREP-001 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `b056fc1315ae7da155d693a63d2c38de06fd61b5fc11d4c483341f8c19fab3fd` | = PREP-001 §1 |
| PREP-001 (Record A) | `b1c558bd574cff4a878a610e790c5d4f0c1dca244764c4ea9d328a14472b94e7` | unchanged since creation |

### 1.1 Governing-record hashes (sha256) — all = PREP-001 §1.1

| Record | sha256 |
|---|---|
| OD-13 mechanism prep + decision (`…_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md`) | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| Option B implementation record | `ac3c9d5f36d58a5eb7ee237832c2882577bd424a62ba1de6f7d4067d307ed035` |
| X1 preparation | `508e512ed42945695ae899f079b63ce67841d25a4b1711ac139427b8407d3c42` |
| X1 decision | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` |
| X1 implementation record | `e1b772134a2798b0ac99238eb72296526ff058b30843f0630aac6990437f20e2` |
| Legacy P3 preparation | `164ed3939f285b02dc6f3b4dc55c8ea517a68db1897841d93882842816394ec6` |
| Legacy P3 decision (C-1) | `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95` |
| C-1 implementation record | `7e6e4113510752f37217a02c0c62d45ac9710e56143c8597f00994cceb9db743` |
| Evidence contract design rev. 2 (OD-1..OD-13) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |

Implementation files (sha256 prefix) unchanged: `index.ts` `c20182e5`, `providerAuthenticity.ts` `2b891350`,
`intentSourceProviderContract.ts` `313607c8`, `intentSignal.ts` `90db6d7d`, `intentIntake.ts` `4f36ff2a`,
`providerAuthenticity.test.ts` `03982587`, `intentSourceProviderContract.test.ts` `d33606f6`, `worker.test.ts`
`cca074df`.

## 2. Governing constraints applied (not reopened)

- **OD-13 Q1:** push only; signature over exact received bytes, verified before parsing (Q10); 5-minute freshness at
  receipt (Q5); no nonce store and no persistence of signatures, payloads or verification outcomes (Q5, Q9); no
  additional provider call for verification (Q7); authenticity failures `REJECTED` per result, no halt, no retry
  (Q8); public keys only, in validated server configuration, registered per named integration (Q3).
- **OD-13 §13.6:** integration naming + key registration, implementation, and runtime wiring each need their own
  authorization.
- **OD-4:** `authorization.businessId` is the integration's opaque identifier of the authorizing business; it is
  evidence only and never identifies a system user.
- **OD-11:** rejections surfaced as `REJECTED`; logged via redacted `@acos/observability` Logger (`externalId`,
  `field`, `reason`); no persisted rejection audit table.
- **OD-12:** no automatic persistence retry; retry is a new submission re-validated in full; no deduplication;
  duplicates accepted as a known limitation.
- **X1 / C-1:** P3 re-derives and compares against the exact verified result; unchanged.

Repository facts relied on (inspected for this decision):

| Fact | Evidence |
|---|---|
| Verification proof is process-local | `providerAuthenticity.ts:150` (`unique symbol` brand), `:179` (`WeakMap` issued state) |
| P3 needs the proof, the trusted `userId` and a caller-supplied `searchId` | `intentIntake.ts:93–104`; `RecordIntentIntakeInput` (`intentSignal.ts:361–371`); `normalizeVerifiedProviderResult(…, { searchId })` (`intentSourceProviderContract.ts:621–623`) |
| P3 checks search ownership against `userId` | `intentIntake.ts:104` (`searches.getById(userId, searchId)`) |
| Intake runs research and the post-research pipeline inline | `intentIntake.ts:134–141` |
| `apps/web` hosts a raw-body, verify-before-parse ingress | `apps/web/app/api/webhooks/razorpay/route.ts:32,59` |
| `@acos/worker` publishes a side-effect-free `./searchWorker` subpath already consumed by another workspace package | `apps/worker/package.json` `"exports"`; `apps/worker/src/searchWorker/index.ts` (re-exports only); `tests/package.json` + `tests/integration/*.ts` |
| `apps/worker` has no HTTP listener; runs a DB polling loop, no broker (R-34) | `apps/worker/src/searchWorker/pollLoop.ts` |

## 3. Product Owner decisions

### IG-1 — Ingress host and path to P3 — **DECIDED**

**Alternative I.** The P1 push ingress is a Node-runtime route handler in `apps/web`. In one request, in one process,
it reads the raw body, calls `verifyProviderEnvelope` (P1), then `normalizeVerifiedProviderResult` (P2), then
`recordIntentIntakeForOwner` (P3, with X1), importing the intake path from the existing `@acos/worker/searchWorker`
export. Alternatives II, III and IV are not selected.

**Rationale.**
1. The `VerifiedProviderResult` proof is process-local (`WeakMap`, branded type). Alternative I keeps P1, P2 and P3 in
   one process, so the proof is never serialized and the raw signed bytes are never replaced by a stored stand-in.
2. Freshness (Q5) is checked at the actual time of receipt, and nothing is persisted before P3 (Q9) — no reopening of
   OD-13 Q5/Q9 or DEC-005, which Alternative III would require.
3. The canonical intake path (IA-1, X1, C-1) stays in its current file and module; Alternative II would move
   implementation-verified code and require re-verification of those decisions.
4. `apps/web` is the only HTTP surface and already carries the exact-bytes, verify-before-parse precedent;
   Alternative IV would add a second HTTP surface and deployable and change the worker's runtime role.
5. The cost — a new `apps/web` → `@acos/worker` dependency via an already-published subpath — is accepted as the
   smallest structural change consistent with 1–4.

### IG-2 — Runtime owner of P3 — **DECIDED**

`recordIntentIntakeForOwner` remains defined in `apps/worker/src/searchWorker/intentIntake.ts` and is **executed at
runtime inside the `apps/web` server process** handling the push. No code move. A dependency `apps/web` →
`@acos/worker` limited to the `./searchWorker` subpath is accepted as the architecture; adding it is implementation
work requiring its own authorization. P3 behavior (OD-1..OD-13 enforcement, X1, OD-8 transaction) is unchanged.

### IG-3 — Pipeline timing — **DECIDED**

**Synchronous, unchanged.** The push request runs `recordIntentIntakeForOwner` exactly as it exists, including its
inline Research step and `runPostResearchPipelineForOwner`. No deferral, queue, hand-off record or new background
mechanism is introduced (consistent with R-34 "no broker" and Q9). OD-12 is unchanged: no automatic retry by this
system. Any external call the existing Research step makes with `deps.researchProvider` is governed by existing
research rules and is **not** authorized by this decision; it needs provider-call authorization at wiring time.
Request-duration limits are an implementation concern for the future authorization.

### IG-4 — HTTP response contract — **DECIDED**

| Outcome | Status | Body |
|---|---|---|
| Saved (P3 completed) | `200` | `{ "status": "accepted" }` — no identifiers, no evidence values |
| Authenticity refusal at P1 (any Q8 reason, including unknown or unregistered integration, unknown key, stale timestamp, oversized body) | `401` | `{ "error": "Invalid signature" }` — one generic response for all P1 reasons |
| P2 / P3 validation `REJECTED` (OD-1..OD-12, X1 `result-mismatch`) or ownership/search failure | `400` | `{ "error": "Unprocessable payload" }` |
| Unexpected error | `500` | `{ "error": "Internal error" }` |

- Response bodies never carry field names, reasons, evidence values or internal detail; the field/reason detail goes
  only to the redacted Logger (OD-11). **No rejection table** is written (OD-11 item 2), unlike the Razorpay path.
- A re-push by the integration after any response is a new submission, re-verified and re-validated in full
  (OD-12 item 2); resulting duplicates remain the accepted OD-12 item 3 limitation. This system performs no retry.

### IG-5 — Owner (`userId`) and search binding — **DECIDED**

1. The owner `userId` and target `searchId` are **never read from the pushed payload, headers, query string or any
   other request-supplied value**, and never from `authorization.businessId`, `business.{name, website}`,
   `provenance.integration` or `authorization.integrationId` as asserted by the sender.
2. They are resolved **server-side, only after P1 succeeds**, from the registration of the **verified** integration
   identity returned by `verifyProviderEnvelope`: each named integration's registration binds exactly one owner
   `userId` and exactly one `searchId` owned by that user.
3. P3's existing ownership check (`searches.getById(userId, searchId)`) remains in force; a failed check is a `400`
   (IG-4) and nothing is saved.
4. A verified integration with no binding is refused as not registered (Q8), before parsing.
5. `authorization.businessId` stays evidence of the authorizing business (OD-4) and never selects an owner.
6. One integration → one owner/search binding. An integration serving several owners is out of scope and returns to
   the Product Owner.

**Recorded dependency (not a reopening):** OD-13 Q3(b) defines the per-integration registration in validated server
configuration for public keys. This decision requires that the same per-integration registration also carry the
owner/search binding. Custody, rotation and revocation (Q3 a, c–e) are unchanged; revoking or removing a
registration removes both. The binding's values are set only by the separate integration-naming / key-registration
authorization (OD-13 §13.6 item 2). No configuration is created by this decision.

### IG-6 — Per-integration enablement — **DECIDED**

**Configuration is the single source of enablement; the ingress is the enforcement point.** An integration is
enabled only while its registration (public key(s) within validity + IG-5 binding) exists in validated server
configuration. The ingress enforces this during P1, before parsing. No database flag, runtime toggle or separate
kill switch is introduced; disabling = removing the registration (Q3 e). The route itself exists only after a
runtime-wiring authorization.

### IG-7 — Reopening OD-13 Q5/Q9 / DEC-005 — **DECIDED**

**Not applicable; nothing reopened.** Alternative III is not selected. OD-13 Q5, Q9 and DEC-005 stand unchanged; no
hand-off record, payload retention or schema change is introduced.

## 4. What this decision does not do

It establishes only the ingress/runtime architecture and IG-1..IG-7. It does **not** authorize: implementation; the
ingress route; the `apps/web` → `@acos/worker` dependency; package, export or configuration changes; naming any
integration; registering any public key or creating key material; owner/search bindings; runtime wiring; provider
calls (including Research); external HTTP; database connections or writes; validation sessions; participant
contact; deployment; commits. It changes no OD-1..OD-13 answer, Q1..Q12 answer, X1, C-1, IA-1, IA-2, DP-1 or DOC-1.

## 5. Remaining prerequisites before the OD-13 runtime gate can lift (each separate)

1. Implementation authorization for the IG-1..IG-6 architecture (route, dependency, registry binding shape), which
   should include a deep-import check and compile verification of dependents.
2. A fresh database-backed integration run on `127.0.0.1:5433` only, exercising the post-Option-B/X1 save boundary
   (audit item 12; constraints in PREP-001 §8 item 1).
3. Integration naming and public-key + owner/search registration (OD-13 §13.6 item 2).
4. Runtime-wiring authorization (OD-13 §13.6 item 3); provider-call, validation and deployment authorizations as
   needed (item 4).

## 6. Final state

```text
Decision status: DECIDED
Selected option: I
IG-1 DECIDED · IG-2 DECIDED · IG-3 DECIDED · IG-4 DECIDED · IG-5 DECIDED · IG-6 DECIDED · IG-7 DECIDED
Implementation authority: NONE
Runtime-wiring authority: NONE
Database authority: NONE
Provider-call authority: NONE
Integration-naming / key-registration authority: NONE
Validation authority: NONE
Deployment authority: NONE
OD-13 runtime gate: IN FORCE
```

## 7. Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0 (preparation record unchanged)
Production files changed: 0
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Package/dependency/export changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring: 0
Validation: 0
Participant contacts: 0
Deployment: 0
Commits: 0
```

**INTENT-INTAKE-OD13-INGRESS-DEC-001 — DECIDED — ALTERNATIVE I — NO EXECUTION AUTHORITY — OD-13 RUNTIME WIRING: NOT AUTHORIZED / GATE IN FORCE**
