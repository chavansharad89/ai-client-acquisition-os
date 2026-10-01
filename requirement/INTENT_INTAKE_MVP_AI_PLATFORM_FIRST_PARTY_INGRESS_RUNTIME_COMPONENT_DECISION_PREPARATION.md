# Intent Intake MVP

## AI-Platform FIRST_PARTY — OD-13 Ingress / Runtime-Component — Product Owner Decision Preparation

**Record ID:** INTENT-INTAKE-OD13-INGRESS-PREP-001
**Date:** 2026-09-30
**Type:** Decision preparation (no decision, no execution authority)
**Prepared for:** Product Owner
**Resolves (when decided):** OD-13 pre-wiring sign-off audit, items 8 and 14 (no runtime component or ingress host
designated)

```text
Record status: PENDING
Option selected: NONE
Recommendation: NONE (options are unranked)
Implementation authority: NONE
Runtime-wiring authority: NONE
Database authority: NONE
Provider-call authority: NONE
Deployment authority: NONE
OD-13 runtime gate: IN FORCE
```

---

## 1. Baseline (verified before writing)

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = audit |
| Staged files | 0 | = audit |
| Working-tree entries (before this record) | 229 | = audit |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `b056fc1315ae7da155d693a63d2c38de06fd61b5fc11d4c483341f8c19fab3fd` | = audit; = IA-OD13-LEGACY-C1-IMPL-REC-001 §2 |

### 1.1 Governing-record hashes (sha256)

| Record | sha256 | Result |
|---|---|---|
| OD-13 mechanism prep + decision (`…_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md`) | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` | unchanged |
| Option B implementation record (`…_PROVIDER_AUTHENTICITY_IMPLEMENTATION_RECORD.md`) | `ac3c9d5f36d58a5eb7ee237832c2882577bd424a62ba1de6f7d4067d307ed035` | unchanged |
| X1 preparation (`…_EXACT_RESULT_BINDING_DECISION_PREPARATION.md`) | `508e512ed42945695ae899f079b63ce67841d25a4b1711ac139427b8407d3c42` | = recorded |
| X1 decision (`…_EXACT_RESULT_BINDING_DECISION.md`) | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` | = recorded |
| X1 implementation record (`…_EXACT_RESULT_BINDING_IMPLEMENTATION_RECORD.md`) | `e1b772134a2798b0ac99238eb72296526ff058b30843f0630aac6990437f20e2` | = recorded |
| Legacy P3 preparation (`…_LEGACY_AUTHENTICITY_CHECK_DECISION_PREPARATION.md`) | `164ed3939f285b02dc6f3b4dc55c8ea517a68db1897841d93882842816394ec6` | = recorded |
| Legacy P3 decision C-1 (`…_LEGACY_AUTHENTICITY_CHECK_DECISION.md`) | `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95` | = recorded |
| C-1 implementation record (`…_LEGACY_AUTHENTICITY_CHECK_IMPLEMENTATION_RECORD.md`) | `7e6e4113510752f37217a02c0c62d45ac9710e56143c8597f00994cceb9db743` | unchanged |
| Evidence contract design rev. 2 (`…_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md`) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` | unchanged |

### 1.2 Implementation files (sha256 prefix; = IA-OD13-LEGACY-C1-IMPL-REC-001 §2)

`index.ts` `c20182e5` · `providerAuthenticity.ts` `2b891350` · `intentSourceProviderContract.ts` `313607c8` ·
`intentSignal.ts` `90db6d7d` · `intentIntake.ts` `4f36ff2a` · `providerAuthenticity.test.ts` `03982587` ·
`intentSourceProviderContract.test.ts` `d33606f6` · `worker.test.ts` `cca074df`. All unchanged. C-1 in force
(`requireProviderAuthenticityForIntake` absent from the `core-research` barrel).

### 1.3 Runtime state

| Check | Finding |
|---|---|
| Runtime callers of `recordIntentIntakeForOwner` | Definition `intentIntake.ts:93`, internal call `:166`, re-export `apps/worker/src/searchWorker/index.ts:9`. **None wired.** |
| Callers of `verifyProviderEnvelope` / `normalizeVerifiedProviderResult` outside tests | Definitions only. |
| Named integration / registered public key | None. `createProviderPublicKeyRegistry` has no production caller; `.env` / `.env.example` contain no key or integration entry. |
| Ingress route for intent sources | None. |
| Configuration / schema changes since the audit | None (fingerprint unchanged). |

## 2. The requirement this decision must satisfy [DECIDED — not reopened here]

OD-13 Q1 (`…_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` §13.3): **integration pushes**. FIRST_PARTY results reach
the system only by the integration pushing Ed25519-signed payloads to an inbound ingress (P1). No pull, no operator
import. Related decided constraints (§13.3 Q5, Q7–Q10; §13.5):

- signature over the **exact received bytes**, verified **before parsing**; bounded body size
  (`MAX_PROVIDER_ENVELOPE_BYTES` = 1 MiB);
- 5-minute freshness window measured against the time of receipt;
- no persistence of signatures, raw payloads or verification outcomes; no schema change; no nonce store (Q5, Q9);
- no additional provider call to verify (Q7); failures `REJECTED` per result, no halt, no retry (Q8);
- public keys only, held in validated server configuration (Q3).

## 3. Current architecture [IMPL-FACT]

### 3.1 Canonical chain

```text
verifyProviderEnvelope               packages/core-research/src/providerAuthenticity.ts:262        (P1)
  → normalizeVerifiedProviderResult  packages/core-research/src/intentSourceProviderContract.ts:621 (P2)
  → recordIntentIntakeForOwner       apps/worker/src/searchWorker/intentIntake.ts:93               (P3, X1)
       → signalTransaction → saveSignals → research_signals
       → researchProspectForOwner (when no category-plausibility determination exists) :137–139
       → runPostResearchPipelineForOwner :141
```

### 3.2 Component facts

| Fact | Evidence |
|---|---|
| `apps/web` is the only HTTP surface. | Next.js route handlers under `apps/web/app/api/**/route.ts`. |
| `apps/web` already hosts a raw-body, verify-before-parse push ingress. | `apps/web/app/api/webhooks/razorpay/route.ts:32,59` (`runtime = 'nodejs'`, `Buffer.from(await request.arrayBuffer())`). |
| `apps/worker` holds the canonical save path. | `recordIntentIntakeForOwner`, exported via `apps/worker` `"exports"` `./searchWorker`. |
| `apps/worker` has no HTTP listener. | No `createServer` / `.listen(` / HTTP framework in `apps/worker/src`. |
| `apps/worker` runs a PostgreSQL polling loop, not a queue/broker. | `apps/worker/src/searchWorker/pollLoop.ts` (R-34 scope-lock: "no queue, no broker"; `FOR UPDATE SKIP LOCKED`). |
| `apps/web` does not depend on `@acos/worker`. | `apps/web/package.json` lists `@acos/core-research`, `@acos/db`, etc., not `@acos/worker`. |
| The verification proof is in-process only. | `providerAuthenticity.ts:150,179`: branded `unique symbol` type; issued state in a module-level `WeakMap`. It cannot be serialized or carried across a process boundary. |
| X1 re-derives the result at P3 from the verified bytes. | X1 decision (Q-X4: proof `receivedAt`; save-time only, no durable record). |
| The save path can trigger research, which uses `deps.researchProvider`. | `intentIntake.ts:137–141`. Whichever component hosts P3 needs the pipeline deps. |
| No governing record names the ingress host. | Audit items 8 and 14. |

## 4. The architecture question [OPEN]

How does a raw push arriving at P1 reach P3 (`recordIntentIntakeForOwner`) while preserving §2 and the in-process
proof of §3.2?

## 5. Alternatives (unranked; none selected or recommended)

Each alternative lists only mechanical consequences drawn from §2–§3.

### Alternative I — Web ingress calls the worker's intake path in-process

A route in `apps/web` reads the raw body, runs P1 → P2 → P3 in the same request, importing the intake path from
`@acos/worker` (`./searchWorker` export).

- Adds an `apps/web` → `@acos/worker` dependency (app-to-app); `apps/web` would build the full intake deps
  (`signalTransaction`, pipeline repositories, research provider).
- Proof stays in-process; freshness is checked at receipt; no persistence of payloads.
- Research / post-research pipeline work runs inside the HTTP request unless separately bounded.
- Reuses the Razorpay raw-body precedent.

### Alternative II — Relocate the canonical intake path to a shared package, hosted by the web ingress

`recordIntentIntakeForOwner` (and what it needs) moves from `apps/worker` into a package that both apps can depend
on; the web route runs P1 → P2 → P3 in-process.

- No app-to-app dependency; changes the location/exports of an IA-1 / X1 implementation file (code move, needs its
  own implementation authorization and re-verification of IA-1/X1 behavior).
- Proof stays in-process. Same in-request pipeline consideration as Alternative I.

### Alternative III — Web ingress persists a hand-off; the worker performs P3

The web route receives the push and writes a durable hand-off (e.g. a table row, the existing polling pattern); the
worker claims it and calls `recordIntentIntakeForOwner`.

- The in-process proof cannot cross the boundary (§3.2). The worker would have to re-verify, which requires the raw
  signed bytes to be persisted — this conflicts with decided Q9 (no persistence of payloads/signatures) and needs a
  schema change (DEC-005 fixes the column set).
- Re-verification in the worker is measured against a later time than receipt; the 5-minute freshness rule (Q5)
  would need a defined meaning for delayed processing.
- Consistent with the R-34 "no broker" pattern (DB polling) but would reopen OD-13 Q5/Q9 and DEC-005.

### Alternative IV — Give `apps/worker` (or a new process) its own HTTP listener

The worker process (or a new, separately deployed component) exposes the push ingress and runs P1 → P2 → P3
in-process.

- No web ↔ worker dependency; proof stays in-process.
- Introduces a second HTTP surface: new listener, port, routing/TLS, deployment unit and operational ownership.
- The worker is currently a polling loop only; adding request handling changes its runtime role.

### Alternative V — Another repository-supported architecture

No further existing pattern was found (no queue/broker, no RPC between apps, no serverless function outside
`apps/web`). The Product Owner may name another option; it would need the same §2 checks.

## 6. Comparison of mechanical properties (factual, not a ranking)

| Property | I | II | III | IV |
|---|---|---|---|---|
| New app-to-app dependency | yes (web → worker) | no | no | no |
| Code relocation of IA-1/X1 path | no | yes | no | no |
| Proof crosses a process boundary | no | no | yes | no |
| Needs payload persistence (reopens Q9 / DEC-005) | no | no | yes | no |
| New HTTP surface / deployable | no | no | no | yes |
| Intake pipeline runs in HTTP request | yes | yes | no | yes |
| Reuses an existing raw-body precedent | yes | yes | yes (at P1) | no |

## 7. Decisions the Product Owner must make before runtime wiring can be authorized [OPEN]

| ID | Question |
|---|---|
| IG-1 | Which alternative (I–V) hosts the P1 ingress and the path to P3? |
| IG-2 | Which component owns P3 (`recordIntentIntakeForOwner`) at runtime, and is any code move or new dependency accepted? |
| IG-3 | Whether the research / post-research pipeline runs synchronously with the push, or is bounded/deferred — and if deferred, by what existing mechanism, without reopening OD-12 retry rules. |
| IG-4 | The HTTP response contract for accepted / `REJECTED` pushes (status codes; no detail leakage per OD-11). |
| IG-5 | Which owner (`userId`) and search a pushed result is saved under — P3 requires a trusted `userId`, which a push does not carry by itself. |
| IG-6 | Whether per-integration enablement (the gate lifting per integration, §13.5 item 11) is enforced at the ingress, in configuration, or both. |
| IG-7 | If Alternative III is considered: whether OD-13 Q5/Q9 and DEC-005 are to be reopened. |

## 8. Separate prerequisites not addressed by this record

1. **Fresh database-backed integration run (audit item 12).** The historical 7/7 run (IA-2) predates Option B and X1
   and did not exercise the save boundary. It requires its own Product Owner authorization. The repository has no
   convention of a separate preparation record for such a run (IA-2 was authorized directly), so none is created
   here. That authorization should cover: `127.0.0.1:5433` only; `TEST_ADMIN_DATABASE_URL` unset or restricted to
   that server; temporary database creation and deletion; no `5434`; no production database; tests discovered > 0,
   executed > 0, skipped = 0, failed = 0; the temporary database proven created and removed; the post-Option-B/X1
   save boundary exercised (not only direct `saveSignals`); provider calls, external HTTP, runtime wiring and
   deployment = 0.
2. **Integration naming and public-key registration (OD-13 §13.6 items 2).** Not decided, not prepared here.
3. **Runtime-wiring authorization (OD-13 §13.6 item 3).** Requires IG-1..IG-6 decided plus items 1 and 2.

## 9. What this record does not do

It selects nothing and authorizes nothing: no ingress route, runtime caller, dependency, package/export change,
queue, code move, configuration, key material, integration naming, schema/migration, provider call, external HTTP,
database connection, validation, participant contact, deployment or commit. It changes no OD-1..OD-13 answer, X1, C-1,
IA-1, IA-2, DP-1 or DOC-1.

## 10. Product Owner decision form

```text
IG-1 Alternative: ____   IG-2 P3 owner: ____   IG-3 Pipeline timing: ____
IG-4 Response contract: ____   IG-5 Owner/search binding: ____   IG-6 Enablement point: ____
IG-7 (only if III): ____
Decision ID: ____   Date: ____   Authority: ____
```

## 11. Execution counters (this record)

```text
Files created: 1 (this record)
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
Commits: 0
```

**INTENT-INTAKE-OD13-INGRESS-PREP-001 — PENDING — NO OPTION SELECTED — OD-13 RUNTIME WIRING: NOT AUTHORIZED / GATE IN FORCE**
