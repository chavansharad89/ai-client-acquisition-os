# IA-OD13-X1 — FIRST_PARTY Exact-Result Binding (X1) — Implementation Record

**Record ID:** IA-OD13-X1-IMPL-REC-001
**Authorization:** Product Owner implementation authorization of 2026-09-30, X1 only (referred to here as IA-OD13-X1).
It implements INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_EXACT_RESULT_BINDING_DECISION.md`), Option X1, with Q-X1 to Q-X7 as decided
**Date:** 2026-09-30
**Branch:** `phase-17-r34-worker-orchestration` (uncommitted)

## 0. Pre-change verification (recorded before any edit)

| Check | Result |
|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28`: matches the decision record §1.1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `97aed26af4dc36210ad50ca930fc89de00dcaa15ae048465adde69eab77ea89a`: matches |
| Staged files / working-tree entries | 0 / 225 (= 224 at the decision + the decision record) |
| Governing-record hashes | All 13 in decision §1.2 match. Preparation record `508e512e…` matches. |
| X1 decision record | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637`, unchanged since it was written |
| Implementation state | All 11 files in decision §1.3 match their hashes. `requireProviderAuthenticityForIntake` bound by integration ID only. |
| Runtime callers | None. Outside tests there are only definitions, the internal single-signal call, re-exports and comments. |

## 1. Files changed

| Kind | File | Change |
|---|---|---|
| Production | `packages/core-research/src/intentSourceProviderContract.ts` | New `requireExactProviderResultForIntake` (the P3 check: authenticity, then X1 binding) |
| Production | `packages/core-research/src/providerAuthenticity.ts` | Verifier-private `receivedAt`. `openVerifiedProviderResult` also returns it. Header comment. |
| Production | `packages/core-research/src/intentSignal.ts` | `IntentSignalValidationReason` gains `'result-mismatch'` |
| Production | `packages/core-research/src/index.ts` | Export `requireExactProviderResultForIntake` |
| Production | `apps/worker/src/searchWorker/intentIntake.ts` | P3 calls `requireExactProviderResultForIntake(validated, proof, now)`. Gate comment. |
| Test | `packages/core-research/src/intentSourceProviderContract.test.ts` | `signProof` helper. New X1 `describe` (26 cases). |
| Test | `apps/worker/src/searchWorker/worker.test.ts` | The proof fixtures now sign the event's own FIRST_PARTY result. `aiPlatformEvent` goes through P1 + P2. 7 X1 cases. |

Post-change sha256: `intentSourceProviderContract.ts` `313607c8…`, `providerAuthenticity.ts` `2b891350…`,
`intentSignal.ts` `90db6d7d…`, `index.ts` `a1d3f43e…`, `intentIntake.ts` `4f36ff2a…`,
`intentSourceProviderContract.test.ts` `d33606f6…`, `worker.test.ts` `cca074df…`. Unchanged: `providerAuthenticity.test.ts`,
`pgRepository.ts`, `intentSource.ts` and both integration test files. Fingerprint after the change:
`6f27bd66e28ce687e92c9c2769bb2272c9e9240236bd826ff01e5fb1e0e3b195`.

## 2. Mechanism

`recordIntentIntakeForOwner` validates the event exactly as before (`toIntentIntakeInput` at P3's `now`, OD-1..OD-12).
It then calls `requireExactProviderResultForIntake(validated, input.providerAuthenticity, now)` before any lookup or write:

1. It runs `requireProviderAuthenticityForIntake` unchanged: proof issued by the verifier, Ed25519 re-verified against
   the key as registered at `now`, and the per-signal `integrationId`. The function is still a no-op when no signal is FIRST_PARTY.
2. It opens the proof: a fresh parse of the verifier's private copy of the exact bytes, plus the private `receivedAt`.
3. It re-derives with the same P2 function (`normalizeWith`, the path behind `normalizeVerifiedProviderResult`) at `receivedAt`
   (Q-X4), with the presented `searchId`, which is not compared (Q-X1). It then validates with `toIntentIntakeInput` at
   `receivedAt`. If the result does not normalize, there are no derived FIRST_PARTY signals.
4. It compares, in the saved (validated) form (Q-X1 to Q-X3):
   - `companyName`, then `website`;
   - the FIRST_PARTY entries, in order and position by position, on `field`, quote, `sourceUrl`, `sourceLabel`,
     `observedAt` and all five `authorizationEvidence` values, with the same count. PUBLIC_INTENT entries are skipped.
5. On a mismatch it throws `IntentSignalValidationError` with reason `result-mismatch` and one of these fields (Q-X6):
   - `signals[<index>]`: the first FIRST_PARTY entry that differs, is extra, or has no derived counterpart;
   - `signals`: the event omits trailing derived FIRST_PARTY entries;
   - `companyName` or `website`.

   Messages are fixed text, with no value (OD-11 item 3).

**Import cycle:** the check lives in `intentSourceProviderContract.ts`, which already imports `providerAuthenticity.ts`.
`providerAuthenticity.ts` gains no import. **Company fields:** passed through `ValidatedIntentIntake`, so no signature
changed. Nothing is recorded, nothing is persisted, and the proof is not consumed (Q-X5, Q-X7).

## 3. Tests

The tests use deterministic fixtures only: fixed-seed test Ed25519 keys, test integration ids and fake repositories. The
core tests run under the existing fetch / http / socket guards.

| Command | Result |
|---|---|
| `vitest run` in `packages/core-research` (unit) | 19 files, 591 passed |
| `vitest run` in `apps/worker` (unit) | 5 files, 230 passed |
| `tsc --noEmit` in `packages/core-research` and `apps/worker` | clean |
| `eslint` on the 7 changed files | clean |

X1 coverage:

- **Core:** exact match accepted; missing trailing FIRST_PARTY entry (`signals`); missing leading entry; extra entry;
  reordered entries; changed `field`, quote, `sourceUrl`, `sourceLabel`, `observedAt`.
- **Authorization evidence:** `businessId`, `authorizedAt`, `status` and `scope` are compared. `integrationId` is still
  refused first by the existing check.
- **Company and scope:** changed `companyName` or `website` refused. PUBLIC_INTENT entries dropped, altered or added
  are accepted. `searchId` is not compared.
- **Proofs:** one proof normalized twice and presented three times is accepted. A proof of another result of the same
  integration, a proof with no SUPPLIED_TO_US item, and a non-provider result are all refused.
- **Errors and timing:** errors contain no presented or verified value. Re-derivation happens at `receivedAt`: a result
  that would be refused at the save-time `now` is still bound. Existing P3 outcomes are unchanged (no proof, forged proof,
  no FIRST_PARTY).
- **Worker:** changed quote, extra entry, missing entry, changed `companyName` or `website` are refused as `result-mismatch`
  before the Search lookup, Company creation or any signal write, and the error carries no values. A genuine
  `{ fixture: true }` proof is refused. PUBLIC_INTENT and `searchId` are outside the binding, and one proof can be accepted twice.

Existing OD-1..OD-12 worker tests all pass unchanged (evidence, OD-6/OD-7 rejection, OD-8 single transaction and
rollback, OD-12 no retry, E1/E2, D3/D4/D5, supersession, replay append-only). Their fixtures now carry proofs of their own
FIRST_PARTY result.

Not run: database integration tests (`tests/integration/*`) and repository-wide builds. Neither is authorized or
required for this change.

## 4. Confirmations

- Unchanged: OD-1..OD-12 rules, the IA-1 writer and OD-8 transaction, OD-12 no retry, the 5-minute freshness rule
  (still P1 only), the OD-2 90-day rule (still applied at P3's `now`; only the X1 re-derivation uses `receivedAt`), Ed25519
  verification, no replay store, no retention, the DP-1 label and OD-13 runtime gating.
- No real integration named or enabled. No real key registered and no key configuration changed.
- No provider, network or database calls.
- No runtime caller wired. After the change, the references outside tests are still only definitions, internal calls,
  re-exports and comments.

## 5. Safety counters

```text
Production code changes: 5 files (0 new)
Test changes: 2 files (0 new)
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

1. `requireProviderAuthenticityForIntake` is still exported and, on its own, binds by integration ID only. The save
   boundary now uses `requireExactProviderResultForIntake`. Any future caller must use the latter; the public API was
   left unchanged.
2. The comparison uses the saved (trimmed, validated) form. A presented value that differs from the verified one only by
   leading or trailing whitespace saves the identical value and is accepted.
3. `IntentSignalValidationReason` gained the additive value `result-mismatch`. No exhaustive consumer was found.
4. The database integration tests were not run (no database authority). Their files are unchanged and do not call
   `recordIntentIntakeForOwner`.

## 7. Governance state

```text
Exact-result binding decision: DECIDED (X1)
Exact-result binding (X1): IMPLEMENTED (uncommitted)
Integration authorization: NOT GRANTED
Key registration authorization: NOT GRANTED
Runtime wiring authorization: NOT GRANTED
Provider-call authorization: NOT GRANTED
Database authorization: NOT GRANTED
Validation authorization: NOT GRANTED
Deployment authorization: NOT GRANTED
OD-13 runtime gate: IN FORCE
```

**IA-OD13-X1-IMPL-REC-001 — X1 IMPLEMENTED — UNCOMMITTED — OD-13 RUNTIME WIRING BLOCKED — NO INTEGRATION ENABLED**
