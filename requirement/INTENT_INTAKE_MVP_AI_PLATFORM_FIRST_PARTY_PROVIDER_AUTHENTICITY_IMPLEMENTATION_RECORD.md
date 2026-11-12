# IA-OD13-B — Inbound Asymmetric Signature Verification — Implementation Record

**Authorization:** IA-OD13-B (implements INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 §13, Option B)
**Date:** 2026-09-30
**Branch:** `phase-17-r34-worker-orchestration` (uncommitted)

## 1. Files changed

| Kind | File |
|---|---|
| Production (new) | `packages/core-research/src/providerAuthenticity.ts` |
| Production | `packages/core-research/src/intentSourceProviderContract.ts` |
| Production | `packages/core-research/src/intentSignal.ts` (optional `providerAuthenticity` on `RecordIntentIntakeInput`; type-only import) |
| Production | `packages/core-research/src/index.ts` (exports) |
| Production | `apps/worker/src/searchWorker/intentIntake.ts` (P3 precondition + gate comment) |
| Test (new) | `packages/core-research/src/providerAuthenticity.test.ts` |
| Test | `packages/core-research/src/intentSourceProviderContract.test.ts` |
| Test | `apps/worker/src/searchWorker/worker.test.ts` |

## 2. Mechanism

| Item | Implementation |
|---|---|
| Verification boundary (P1) | `verifyProviderEnvelope({ rawBody, integrationId, keyId, signature }, { registry, receivedAt })`. Transport `integrationId` / `keyId` select the key; signature verified over the exact bytes **before** `JSON.parse`; then the signed envelope must repeat the same ids. Never throws on request input. |
| Signature algorithm | Ed25519 (`node:crypto` `verify(null, …)`), base64 64-byte signature. |
| Signed bytes | The exact received body bytes, no canonicalization. Body = JSON envelope `{ version: 1, integrationId, keyId, signedAt, result }`. Size limit 1 MiB. |
| Freshness | `|receivedAt − signedAt| ≤ 5 min` (inclusive), enforced at P1 only (receipt-time rule). No nonce / replay store. |
| Version | `version` must be exactly `1`; otherwise `REJECTED` (`envelope.version`, `unsupported`). In-process contract remains unversioned (OD-9). |
| Verified-result boundary | `VerifiedProviderResult` — branded (non-exported `unique symbol`), frozen, issued only by the verifier and tracked in a module-private `WeakMap`; carries no signature or bytes. |
| P2 | `normalizeVerifiedProviderResult(verified, options)` re-parses the result from the verifier's private copy of the bytes, binds the verified identity to `provenance.integration` and `authorization.integrationId` (V3), then runs the unchanged normalization; the NORMALIZED intake carries the proof. `normalizeProviderResult` now REJECTs any AI-platform result with `SUPPLIED_TO_US` (`authenticity`, `required`). PUBLISHED-only results unchanged (Q12). |
| P3 (save boundary) | `recordIntentIntakeForOwner` calls `requireProviderAuthenticityForIntake` after input validation and before any lookup or write: when any signal is FIRST_PARTY, the proof must be verifier-issued, its signature is **re-verified** against the key as registered at save time, and every FIRST_PARTY `integrationId` must equal the verified identity. No FIRST_PARTY → no-op. |
| Key registry boundary | `createProviderPublicKeyRegistry(entries)` — in-memory, caller-supplied, Ed25519 public keys only (private / non-Ed25519 keys refused), multiple keys per integration, `validFrom` inclusive / `validUntil` exclusive. No env, config schema, DB or runtime fetch. |
| Failure behavior | `REJECTED` with `field` / `reason` / fixed message only (externalId `null` at P1); whole result refused before parsing/normalization/save; no halt (`AUTHENTICATION_FAILED` untouched); no retry; nothing persisted. |

## 3. Tests

| Command | Result |
|---|---|
| `packages/core-research: npx vitest run` | 19 files, 565 passed |
| `apps/worker: npx vitest run src/searchWorker/worker.test.ts` | 91 passed |
| `tsc --noEmit` (core-research, worker) | clean |
| `eslint` on changed files | clean |

New coverage: valid envelope; deterministic signatures; missing / malformed / wrong-length / zero signatures; wrong key; byte tampering; verify-before-parse (parser not called for bad signatures); unknown key / unregistered integration; validity window; rotation; freshness edges (±5 min accepted, ±5 min + 1 ms refused) and malformed `signedAt`; version errors; envelope id mismatch; non-object / non-UTF-8 bodies; empty / oversized bodies; never-throws; redacted rejections; no halt; registry configuration faults; P2 unverified refusal, forged proof, re-parse isolation, V3 binding, OD-1..OD-6 still applied; P3 missing / forged / other-integration proof, key expiry at save time, no-FIRST_PARTY no-op.

`tests/integration/intent-intake.integration.test.ts` does not call `recordIntentIntakeForOwner` and was **not run** (no database authorization in scope).

## 4. Confirmations

- No real integration named or enabled; only test ids (`fixture-integration`, `integration-0001`, `test-key-*`).
- No real key registered; test keys are fixed-seed Ed25519 keys inside test files only. No signing capability in production code.
- No provider, network or database calls (tests run under fetch / socket guards).
- OD-13 runtime gate remains in force: no ingress route, no runtime caller wired.

## 5. Safety counters

```text
Production code changes: 5 files (1 new)
Test changes: 3 files (1 new)
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
```

## 6. Remaining issues

1. P3 binds the proof to FIRST_PARTY signals by verified `integrationId` only (the decided V3 binding). It does not
   check that each FIRST_PARTY signal's content came from that specific verified result, so in-process code holding a
   genuine proof could pair it with other signals of the same integration. Tightening this is a separate decision.
2. `RecordIntentIntakeInput` gained an optional `providerAuthenticity` field, required by intake whenever a FIRST_PARTY
   signal is present (the Q4 P3 precondition). OD-1..OD-12 checks, OD-8 transaction and OD-12 retry behavior are unchanged.

## 7. Governance state

```text
OD-13 design decision: DECIDED
Option B implementation: IMPLEMENTED
Integration authorization: NOT GRANTED
Key registration authorization: NOT GRANTED
Runtime wiring authorization: NOT GRANTED
Provider-call authorization: NOT GRANTED
Validation authorization: NOT GRANTED
Deployment authorization: NOT GRANTED
```
