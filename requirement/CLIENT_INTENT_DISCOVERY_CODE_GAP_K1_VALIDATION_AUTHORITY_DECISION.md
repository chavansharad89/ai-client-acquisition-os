# CLIENT INTENT DISCOVERY — CODE GAP K1 — VALIDATION AUTHORITY DECISION (PD-VA)

**Record ID:** `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-AUTHORITY-PO-DEC-001`

## A. Decision Metadata

- **Decision:** OPTION A — AUTHORIZE K1 VALIDATION
- **Decision status:** DECIDED
- **Decision authority:** Product Owner, supplied explicitly by the user in chat (not selected by the assistant)
- **Date:** 2026-10-03
- **Baseline at time of decision:**
  - Branch: `feature/client-intent-discovery-complete`
  - HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`
  - Staged files: `0`
  - Working-tree changes: only the 6 K1 implementation files under `packages/core-research/src/` (contactIdentifiers.ts, contactIdentifiers.test.ts — new; intentSourceProviderContract.ts, intentSourceProviderContract.test.ts, intentSignal.ts, intentSignal.test.ts — modified) plus pre-existing `requirement/` documentation state
- **Governing-record hashes (re-verified immediately before this decision, all MATCHED):**
  - ED-004: `c5b0b364dc630ff258570073c564935e31720a1cd59b98f66be281327f311295`
  - REV-005: `cec9fde59c27215beeeae9ac93ef1d3e6026ac80efa1f58ef4cf70e76bb44f5f`
  - REV-005 conformance audit: `d59bdd04dc050c2bfc425d9f53a3a21e17b95b4110fa65873bc171917db4086d`
  - PD-1 preparation: `4dcc6346dcfa52467ef741632a733ad21a26a7b9046015a867c3f286761ba8b4`
  - PD-1 decision: `8cba9f378fd53e0605411ed1cffd4ab9d5989bf813a13fd236e5efc1f56a6cc4`
  - Post-implementation K1 conformance audit: `15025941f119f93b30edc5f18a0a5fb024247fb6275710478774e0835b54417c`
  - K1 Validation Authority preparation: `f721e4848dbfe72e8992fd909356030c2013092d4b5f7ccaca625ffab966b1c1`

## B. Decision

**OPTION A — AUTHORIZE K1 VALIDATION**

Validation of the implemented K1 detector and enforcement paths is authorized, according to the existing governing records and REV-005. This authorization is **only** for the defined validation scope below.

## C. Authorized Scope

Validation may examine:
- the implemented `contactIdentifiers.ts` detector;
- provider-path K1 enforcement (`preparePublicWeb`, `prepareAiPlatform`, `preparePublicIntent`);
- intake-path K1 enforcement (`toIntentSignalInput`);
- `context.*` enforcement (`targetCustomer`, `geography`, `service`);
- PG-3 behavior (transience of `title`, `snippet`, `body`, `basis`);
- provider/intake equivalence;
- REV-005 conformance;
- shipped K1 tests and validation evidence;
- the two known non-blocking findings F-01 and F-02 (see §E).

Validation must compare observed behavior against the governing REV-005 specification and the already-decided K1 policy. It must not reinterpret either.

## D. Validation Boundaries

**Authorized:** only validation activities necessary to verify the implemented K1 behavior against the authorized specification.

**Not authorized, unless a later decision explicitly authorizes them:**
- source-code changes
- test changes
- bug fixes
- schema changes
- migrations
- dependency changes
- provider/API calls
- external research
- participant contact
- deployment
- release
- production traffic
- commit
- push

If validation discovers a defect, it must be recorded, not fixed. If validation requires an authorization not granted here, that activity must stop and the blocker must be recorded.

## E. F-01 and F-02 — Carried Forward as Open Findings

**F-01:** `98765 43XXX ext 204` produces two `FRAGMENT` detections rather than one (zero enforcement effect per the post-implementation audit's own classification).

**F-02:** Mixed `*`/`•` mask runs are implemented as homogeneous-only — a confirmed, fail-closed deviation from REV-005's literal text for genuinely interleaved mixed runs.

Neither finding is closed by this decision. Neither fix is authorized by this decision. Validation may determine whether either finding has a material effect on K1 conformance — that determination belongs to the validation evidence produced in the (not-yet-performed) validation step, not to this decision record.

## F. Provider/API Boundary

The K1 Validation Authority preparation record did not identify any governing authorization that requires or permits provider/API calls as part of the K1 validation scope. Authorizing validation does not, by itself, authorize provider/API calls.

**Provider/API calls: NOT AUTHORIZED**

## G. Deployment/Release Boundary

No existing governing record couples K1 validation to deployment or release authorization. These remain separate decisions.

**Deployment/release: NOT AUTHORIZED**

## H. Decision Status Summary

- Product Owner decision: **DECIDED**
- Validation authority: **AUTHORIZED** (scope per §C–D above)
- Implementation authority: already granted separately under PD-1-A (unaffected by this decision)
- Validation execution: **NOT PERFORMED** — this record authorizes a future validation step; it does not execute it
- Provider/API calls: **NOT AUTHORIZED**
- External research: **NOT AUTHORIZED**
- Participant contact: **NOT AUTHORIZED**
- Deployment/release: **NOT AUTHORIZED**
- Commit/push: **NOT AUTHORIZED**

## I. Existing Policy Preservation

This decision does not reopen, modify, replace, or reinterpret any existing Product Owner, K1-I, PG, engineering, contract, adapter, readiness, PD-1, or audit record. It does not claim validation has occurred.

## Final State Check

- HEAD unchanged: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`
- Staged count unchanged: `0`
- Code fingerprint unchanged — no source/test/schema/migration/dependency/config file created or modified by this task
- This record is the only new file created by this task
- SHA-256 of this record: *(this field is self-referential; the authoritative SHA-256 of the final, as-delivered file is reported in the task completion report, not embedded here — see the precedent set by the PD-1 decision record for why this field is handled this way)*
