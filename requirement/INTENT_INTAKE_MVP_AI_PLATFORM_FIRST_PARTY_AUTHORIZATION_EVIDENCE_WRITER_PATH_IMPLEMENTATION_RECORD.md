# INTENT INTAKE MVP

## Implementation Record — OD Writer Path (FIRST_PARTY Authorization Evidence)

**Record ID:** IA-OD-WRITER-001-IMPL-REC-001
**Authorization:** IA-OD-WRITER-001, IA-1 = AUTHORIZE (Product Owner, 2026-09-30)
**Design:** INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001, revision 2 (§14, OD-1 to OD-13)
**Date:** 2026-09-30
**Status:** **IMPLEMENTED IN WORKING TREE — UNCOMMITTED — NOT WIRED TO ANY RUNTIME CALLER — OD-13 GATE IN FORCE**

## 1. Baseline (verified before any change)

| Item | Value | Result |
|---|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | = design record §1.1 / §14.1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | = design record §14.1 |
| Staged files | 0 | matches |
| Working-tree entries | 215 | = design record §14.1 |
| Migration 0030 `migration.sql` | `3dc76684e0b363eb…` | = IMPL-REC-001 |

The writer-path files are partly untracked, so their pre-change sha256 values were recorded individually (first 16):

| File | Before | After |
|---|---|---|
| `packages/core-research/src/intentSourceProviderContract.ts` | `dcedfba224652b15` | `3c1868800a51a620` |
| `packages/core-research/src/intentSource.ts` | `55fd91dead83608d` | `0ef099cfd658db1a` |
| `packages/core-research/src/intentSourceAdapters.ts` | `8b5b2073960698a7` | `9fdaa89ee8123cc8` |
| `packages/core-research/src/intentSignal.ts` | `36913042b57f8650` | `a754118f4114ff6e` |
| `packages/core-research/src/pgRepository.ts` | `8113b18665a048c8` | `290c57d2a6ebe0f2` |
| `packages/core-research/src/types.ts` | `38a22fe7fc7a99e8` | `1645ab6cb104205f` |
| `packages/core-research/src/repository.ts` | (tracked; in fingerprint) | `12f82a0f6a82b27f` |
| `packages/core-research/src/index.ts` | `09838d53c5d77e9d` | `194b499cf7d25bca` |
| `apps/worker/src/searchWorker/intentIntake.ts` | `b8ca7ae97452b1d0` | `c2776411d97db6d1` |
| `apps/worker/src/searchWorker/index.ts` | `c2eca7de2f2441c0` | `d74470ec282826c0` |
| `packages/core-research/src/intentSourceProviderContract.test.ts` | `c644cbf0d1ecec90` | `914c6f9009178806` |
| `packages/core-research/src/intentSourceProviderFixtures.ts` | `8e63bebbd6c98077` | `e6847deb19abba5d` |
| `packages/core-research/src/intentSource.test.ts` | `07ef13fe04da25c1` | `862af28d71c52d6e` |
| `packages/core-research/src/intentSourceFixtures.ts` | `abf9d293725797a1` | `a76c635e8c553ddd` |
| `packages/core-research/src/intentSignal.test.ts` | `5f5442eece951790` | `791fcfb8d7c5e935` |
| `apps/worker/src/searchWorker/worker.test.ts` | (tracked; in fingerprint) | `91da811831c4c1a3` |
| `tests/integration/intent-intake.integration.test.ts` | (untracked; not hashed before) | `97637977c1303581` |

Fingerprint after the change: `f94e3c0d6eb3de6fd6fde91bfdb4e90fb3f873397cb6b6cb21da508dccb4f6c2`. Working-tree entries
after the change: 217 before this record and DP-1 were written. The two new entries are the IA-1 record and
`packages/core-research/src/types.ts`, which was clean before. 0 staged.

## 2. Governing-record hashes (re-checked before implementation; unchanged after)

| Record | sha256 (first 16) |
|---|---|
| INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 (rev. 2) | `57f6a42fe2b8bfb9` (full: `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c`) |
| INTENT-INTAKE-PO-DEC-005 | `0da5daed74ed9812` (= design §1.2) |
| DEC-005-SCHEMA (rev. 2) | `078f46834497ba70` (= design §1.2) |
| DEC-005-SCHEMA-PREREQ | `572359a848cc7170` (= design §1.2) |
| IMPL-REC-001 / EXEC-REC-001 | `625fe44151e2ddda` / `1c22782c38135962` (= design §1.2) |
| IA-OD-WRITER-001 (IA-1 AUTHORIZE) | `55d249a3474e8ee6` (full: `55d249a3474e8ee66fcd35096c3d1de135c7caaa7318ed4ad6448b0a1a63cd5d`) |

The IA-1 record was saved to `requirement/…_WRITER_PATH_IMPLEMENTATION_AUTHORIZATION.md` before implementation and
hashed then. No governing record was modified by the implementation.

## 3. Pre-implementation verification (IA-1 instruction 3)

| Item in IA-1 §3 | Decided in the design record? | Where |
|---|---|---|
| Existing `REJECTED` outcome for rejected results | **Yes** | OD-6 item 2 (whole result returned as `REJECTED` with `field` / `reason` / `message`); OD-11 item 1 (surfaced through the existing `REJECTED` outcome; messages name field and rule only) |
| Explicitly decided retry behavior | **Yes** | OD-12 items 1–3 (no automatic persistence retry; retry = new operator-initiated submission re-running full validation incl. OD-2 expiry; no dedup added) |

No decision-preparation item was needed for either.

## 4. What was implemented — mapping to OD-1 … OD-13

| OD | Implemented as |
|---|---|
| OD-1 | `AUTHORIZATION_STATUSES = GRANTED / REVOKED / EXPIRED` (application code only). Absent → `required`; any other value, including empty, other casing or padded → `invalid`; `REVOKED` / `EXPIRED` → `not-allowed`. Stored verbatim (always `GRANTED`). |
| OD-2 | `authorization.authorizedAt` (Date) → `auth_timestamp`. Must be a valid Date (`invalid`); must not be after `capturedAt` (`invalid`); rejected when receipt `now` is more than 90 days after it (`not-allowed`). Exactly 90 days is accepted. |
| OD-3 | `AUTHORIZATION_SCOPES = ACQUISITION`. Absent / empty / whitespace → `required`; any other value → `not-allowed`. `basis` is not the scope. |
| OD-4 | `authorization.businessId` → `business_id`, verbatim. Non-empty text required. A personal email or `mailto:` / `tel:` / `sms:` value → `not-allowed` (the existing identifier screen, now shared as `isPersonalContactIdentifier`). Nothing system-side is substituted. |
| OD-5 | `authorization.integrationId` is canonical → `integration_id`. With any SUPPLIED_TO_US item it must equal `provenance.integration` exactly, or the result is rejected (`invalid`, field `authorization.integrationId`). Results without SUPPLIED_TO_US: unchanged. |
| OD-6 | In `prepareAiPlatform`, before the adapter runs and before any write: with any SUPPLIED_TO_US item, the authorization object and all five values are required, plus the existing `basis`. Any defect returns the whole result as `REJECTED`, including its PUBLISHED items. Other batch results are unaffected. No downgrade. Results with no SUPPLIED_TO_US item are unchanged. |
| OD-7 | Evidence carrier: raw record → adapter candidate → `normalizeIntentEvent`, which attaches it to FIRST_PARTY intake entries only. `toIntentSignalInput` (and so `toIntentIntakeInput`) rejects FIRST_PARTY without valid evidence and rejects any evidence on PUBLIC_INTENT. `recordIntentSignalForOwner` rejects `kind: 'FIRST_PARTY'` (`not-allowed`). No source-family column. |
| OD-8 | `saveSignals` binds the five values as parameters of the signal row's own `INSERT` (NULL when absent). New `createPgResearchSignalTransactionRunner` follows the `createWebhookTransactionRunner` precedent: pinned connection, BEGIN / COMMIT / ROLLBACK. `recordIntentIntakeForOwner` now takes `IntentIntakeDeps = ProspectPipelineDeps & { signalTransaction }` and writes every signal + source row of the event inside one transaction. Company / Prospect find-or-create and the Research / post-research pipeline stay outside. `revoked_at` is never written. |
| OD-9 | No version field. The contract change is made in place. |
| OD-10 | `basis` stays required and validated; `reference` stays optional. Neither is carried or persisted: the validator returns exactly the five values. |
| OD-11 | The existing `REJECTED` outcome only. Messages name the field and rule, never the value (tested). No audit table and no aggregator. Item 3 (Logger for REJECTED outcomes) applies only once a runtime caller is wired, so it is not implemented (see §7). |
| OD-12 | No retry anywhere. A persistence failure is thrown after rollback (tested: the save is called once and not repeated). No deduplication added. |
| OD-13 | No runtime caller wired (see §6). The gate is documented in `intentSignal.ts` and `intentIntake.ts`. |

### 4.1 Implementation choices (within the ODs, not changing them)

- **Reason codes the ODs leave open:** absent value → `required`; after `capturedAt` → `invalid`; expired → `not-allowed`
  (the same reason code as the `EXPIRED` status). These reuse the existing `IntentSignalValidationReason` vocabulary.
- **Intake-level upper bound for `authorizedAt`:** `RecordIntentIntakeInput` has no `capturedAt`, so at intake the
  upper bound is `now`. `capturedAt ≤ now` is already enforced by `normalizeIntentEvent`. At the provider boundary the
  bound is `capturedAt`, as OD-2 states.
- **Verbatim storage:** `businessId` / `integrationId` are not trimmed. Whitespace-only counts as missing (OD-6).
- **`eventId`** does not include evidence. The in-batch dedup semantics are unchanged (OD-12 item 3).
- **`FIRST_PARTY_CONSENT_POLICY`** value and `notes.authorization` are unchanged. Only the stale doc comment was
  corrected. Their meaning after OD-1 to OD-13 is raised as **DP-1**
  (`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_CONSENT_POLICY_LABEL_DECISION_PREPARATION.md`).
- **Test fixtures:** the AI-platform provider fixture's `provenance.integration` now equals its
  `authorization.integrationId` (`fixture-integration`), as OD-5 requires. FIRST_PARTY test entries use an AI-platform
  source label rather than "Landing-page form" (OD-7 item 4).

## 5. Files changed

**Production code (core-research, worker):** `intentSignal.ts`, `intentSource.ts`, `intentSourceAdapters.ts`,
`intentSourceProviderContract.ts`, `pgRepository.ts`, `repository.ts`, `types.ts`, `index.ts` (exports);
`apps/worker/src/searchWorker/intentIntake.ts`, `apps/worker/src/searchWorker/index.ts` (type export).

**Tests / fixtures:** `intentSignal.test.ts`, `intentSource.test.ts`, `intentSourceProviderContract.test.ts`,
`intentSourceFixtures.ts`, `intentSourceProviderFixtures.ts`, `apps/worker/src/searchWorker/worker.test.ts`,
`tests/integration/intent-intake.integration.test.ts`.

**Records:** IA-1 record (saved), this record, DP-1.

**Not changed:** `apps/worker/src/index.ts`, `apps/web/**`, migrations, Prisma schema, package manifests, lockfile,
configuration, and every governing record.

## 6. Gate verification (§4 / §7 of IA-OD-WRITER-001)

- **OD-13 / runtime wiring:** a search of `apps/` and `packages/` for `recordIntentIntakeForOwner`,
  `recordIntentSignalForOwner`, `normalizeProviderResult`, `normalizeProviderBatch`, `normalizeIntentEvent(` and
  `createPgResearchSignalTransactionRunner`, excluding tests and fixtures, finds only their definitions and
  re-exports. No worker entrypoint, web route or other runtime caller uses them. **No runtime caller is connected or
  enabled.**
- **Deferred decisions:** none were implemented: no revocation events, no `revoked_at` writes, no review interval, no
  stored-row expiry, no deduplication, no `basis` / `reference` retention, no audit store, no versioning, and no
  non-AI-platform FIRST_PARTY source.
- **Schema:** unchanged. Migration 0030 sha256 is unchanged. No CHECK / enum / constraint was added. The five columns are
  written only at INSERT.
- **PUBLIC_INTENT:** kind, confidence, persistence and NULL evidence columns are unchanged, and PUBLIC-only results
  behave as before (tested).
- **Other source families:** unchanged.

## 7. Tests run

| Command | Result |
|---|---|
| `vitest run src/intentSourceProviderContract.test.ts` (core-research) | 157 passed |
| `vitest run src/intentSignal.test.ts src/intentSource.test.ts src/intentSourceProviderContract.test.ts` | 227 passed |
| `vitest run` (core-research, full package, unit only) | 18 files, 511 passed |
| `vitest run src/searchWorker/worker.test.ts` (worker) | 87 passed |
| `tsc --noEmit` core-research, worker, `tests/tsconfig.json` | clean |

All unit tests use fakes and run under the contract tests' existing I/O guard, where one applies.

**Not run:** `tests/integration/intent-intake.integration.test.ts`. It was updated for the new FIRST_PARTY rule and
gained two cases: evidence columns written verbatim with PUBLIC_INTENT / `revoked_at` NULL, and a transaction rollback
of signal + source rows. It needs a PostgreSQL connection (the throwaway suite database on the test server).
IA-OD-WRITER-001 does not say whether that is covered, so it was **not executed** (see §9).

## 8. Safety counters (IA-OD-WRITER-001 §11)

```text
Production code changes: 10 files (writer path only, §5)
Migration changes: 0
Schema changes: 0
Test changes: 7 files (unit tests, fixtures, one integration test file — not executed)
Configuration changes: 0
Dependency changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Validation sessions: 0
Participant contacts: 0
Commits: 0
```

## 9. Remaining blockers / open items

1. **OD-13:** the provider-authenticity mechanism is not decided and not built. No runtime caller may be wired until it
   is (IA-OD-WRITER-001 §4.1–4.2).
2. **OD-11 item 3:** Logger output for `REJECTED` AI-platform outcomes is due only when a runtime caller is wired. It is
   blocked by item 1.
3. **Integration test execution:** running the updated `intent-intake.integration.test.ts` against a local test
   PostgreSQL needs explicit confirmation that a database connection is in scope.
4. **DP-1:** `FIRST_PARTY_CONSENT_POLICY` / `notes.authorization` label semantics are pending a Product Owner
   decision.
5. **Stale comment (not changed, outside scope):** the header of
   `tests/integration/research-signal-authorization-evidence.integration.test.ts` says no application code touches the
   0030 columns. That is no longer true for the writer path. The file belongs to DEC-005 and was left unchanged.
6. Deferred decisions remain deferred: revocation events, `revoked_at`, review interval, stored-row expiry,
   deduplication, `basis` / `reference` retention, rejection audit, versioning, non-AI-platform FIRST_PARTY sources.

Completing this implementation does not authorize deployment, enablement, validation or connecting a runtime caller.

**IA-OD-WRITER-001-IMPL-REC-001 — WRITER PATH IMPLEMENTED (OD-1..OD-12 in code, OD-13 gate intact) — UNCOMMITTED — NO
RUNTIME CALLER — NO DATABASE / PROVIDER / NETWORK ACTIVITY**
