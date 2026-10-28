# CLIENT INTENT DISCOVERY — CODE GAP K1 — IMPLEMENTATION AUTHORITY PD-1 DECISION

**Record ID:** `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPLEMENTATION-AUTHORITY-PD1-DEC-001`

## A. Decision Metadata

- **Decision:** PD-1-A
- **Decision status:** DECIDED
- **Decision authority:** Delegated Product Owner authority (option supplied explicitly by the user via interactive confirmation; not selected by the assistant)
- **Date/time:** 2026-10-02
- **Baseline at time of decision:**
  - Branch: `feature/client-intent-discovery-complete`
  - HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`
  - Staged files: `0`
  - Working-tree changes: only files under `requirement/` modified/untracked; no source, test, schema, migration, dependency, or configuration file changed
- **Governing-record hashes (re-verified immediately before this decision, all MATCHED):**
  - PD-1 preparation record (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_PREPARATION.md`): `4dcc6346dcfa52467ef741632a733ad21a26a7b9046015a867c3f286761ba8b4`
  - ED-004 (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT_004.md`): `c5b0b364dc630ff258570073c564935e31720a1cd59b98f66be281327f311295`
  - REV-005 (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md`): `cec9fde59c27215beeeae9ac93ef1d3e6026ac80efa1f58ef4cf70e76bb44f5f`
  - REV-005 conformance audit (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005_CONFORMANCE_AUDIT.md`): `d59bdd04dc050c2bfc425d9f53a3a21e17b95b4110fa65873bc171917db4086d`

## B. Question

Is implementation of K1 according to REV-005 authorized?

## C. Selected Option

**PD-1-A — IMPLEMENTATION AUTHORIZED**

## D. Scope

Implementation of the K1 detector and enforcement paths is authorized **exactly** according to `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md` and nothing beyond it. The authorization covers:

- implementation of `contactIdentifiers.ts` (detector module: `detectContactIdentifiers`, `containsPersonalContactIdentifier`, `containsAnyContactIdentifier`);
- provider-path enforcement (the three call sites in `intentSourceProviderContract.ts`: `preparePublicWeb`, `prepareAiPlatform`, `preparePublicIntent`);
- intake-path enforcement (`toIntentSignalInput` in `intentSignal.ts`);
- context-field enforcement (`context.targetCustomer`, `context.geography`, `context.service`);
- required PG-3 behavior (transient fields `title`, `snippet`, `body`, `authorization.basis` remain unscreened and excluded from persistence/events/intake/saved rows);
- required error/rejection behavior (reuse of existing `ProviderResultOutcome.REJECTED` / `IntentSignalValidationError`; no new enum/message unless REV-005 itself requires one);
- all tests required by REV-005 (the `contactIdentifiers.test.ts` suite and the additive rows in the existing provider-contract/intent-signal/worker-intake suites).

If implementation encounters a contradiction or ambiguity in governing policy that REV-005 does not resolve, the affected implementation work must STOP and the discrepancy must be escalated through governance. Implementation must not silently reinterpret policy.

## E. Explicit Exclusions

Regardless of the option selected, and remaining in force even though implementation is authorized under PD-1-A:

- **Validation:** NOT AUTHORIZED
- **Provider/API calls:** NOT AUTHORIZED
- **External research:** NOT AUTHORIZED
- **Participant contact:** NOT AUTHORIZED
- **Deployment/release:** NOT AUTHORIZED
- **Commit/push:** NOT AUTHORIZED

## F. Existing Policy Preservation

This decision does not reopen, modify, replace, or reinterpret any existing Product Owner, K1-I, PG, engineering, contract, adapter, or readiness decision.

## G. Governance Rule

If implementation later discovers that REV-005 conflicts with an already-decided policy, the affected implementation must stop and the discrepancy must be raised for governance review. Implementation must not resolve the conflict unilaterally.

## Final State Check

**Baseline**
- Branch: `feature/client-intent-discovery-complete`
- HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` (unchanged)
- Staged count: `0` (unchanged)
- Code fingerprint: unchanged — no source/test/schema/migration/dependency/config file touched
- Working-tree changes: only `requirement/` files modified/untracked (this record is the single new addition from this task)

**Decision**
- PD-1-A
- Decision status: DECIDED
- Decision-record path: `requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md`
- Record ID: `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPLEMENTATION-AUTHORITY-PD1-DEC-001`
- SHA-256: this field is self-referential (the hash of the file changes each time the hash value is written into it); the authoritative SHA-256 of the final, as-delivered file is reported in the task completion report, not embedded here.

**Governance (PD-1-A)**
- Implementation authorized: YES
- Implementation performed: NO
- Validation authorized: NO
- Provider calls: NO
- External research: NO
- Participant contact: NO
- Deployment/release: NO
- Commit/push: NO

This task is decision recording only. No source code, tests, schemas, migrations, dependencies, or configuration were created or modified. No commit or push was made. Implementation itself must occur in a separate, subsequent task.
