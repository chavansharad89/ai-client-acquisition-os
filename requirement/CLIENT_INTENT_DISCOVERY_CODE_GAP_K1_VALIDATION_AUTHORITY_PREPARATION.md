# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — VALIDATION AUTHORITY — PRODUCT OWNER DECISION PREPARATION

**Record ID:** `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-AUTHORITY-PREP-001`
**Record type:** PRODUCT OWNER DECISION PREPARATION (documentation only)
**Date:** 2026-10-02

## 0. This record grants NO authorization

This record does not authorize validation, implementation, deployment/release, provider/API calls, external
research, participant contact, or commit/push. It prepares one question for the Product Owner. No decision is made
here.

## 1. Baseline (preserved, unchanged)

- Branch: `feature/client-intent-discovery-complete`
- HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` (unchanged)
- Staged files: `0` (unchanged)
- Working-tree state: identical to the state described in the K1 post-implementation conformance audit — the same 6
  implementation files (`packages/core-research/src/contactIdentifiers.ts` + `.test.ts` new;
  `intentSourceProviderContract.ts` + `.test.ts`, `intentSignal.ts` + `.test.ts` modified), plus pre-existing
  `requirement/` documentation state. No source, test, schema, migration, dependency, or configuration file was
  touched in preparing this record.
- Code fingerprint (SHA-256, re-verified before writing this record):
  - `contactIdentifiers.ts`: `d0440bae51d3a0b9d3a30f18884dbc6b57799572a4a15e22f9f1d9195251ac8f`
  - `contactIdentifiers.test.ts`: `6b6fe9f05fac495b7651839278fa71edfdcc4ccf4dcdd2bb33a253a3f427baf5`
  - `intentSourceProviderContract.ts`: `3ae9087715315391a2092015d9bd1e5bf33ffb9ec494d4b8f7ad27ff245e99ff`
  - `intentSourceProviderContract.test.ts`: `7128cd7a33e558307b1b223f17632cd67241079d44c115797a90a1a94a541561`
  - `intentSignal.ts`: `c36c694f07d65f21bae3f2eaa92c13bb4aeddbc84fc321466f5da80e834606b5`
  - `intentSignal.test.ts`: `2b10684177495321d006f16b37cd2070133cbcc9c51b6afb41eb41b9a7ae9fdd`
- Governing-record SHA-256 (re-verified this round; unchanged from the post-implementation audit's own figures):
  - ED-001 (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md`): `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb`
  - ED-002 (`..._ENGINEERING_DECISION_AMENDMENT.md`): `b9c7aaa8af5e99b2c6e2cd74054eaa0f163944b8acb33a47edb3fdc805abefde`
  - ED-003 (`..._ENGINEERING_DECISION_AMENDMENT_003.md`): `681707ac9e41230da36b2550d3c3e0e1f7bd1599af86707e75902638a0b59fc8`
  - ED-004 (`..._ENGINEERING_DECISION_AMENDMENT_004.md`): `c5b0b364dc630ff258570073c564935e31720a1cd59b98f66be281327f311295`
  - REV-003 (`..._ENGINEERING_SPECIFICATION_REVISION_003.md`): `c3f42694d2b3a76d34fd9cd1118711103e0fe61bed4780e68c5f05c259e374bf`
  - REV-004 (`..._ENGINEERING_SPECIFICATION_REVISION_004.md`): `d9b1f918c4c85c72121affffb8b3a1a150330fb9bff0cca1760622dd37a5c4f4`
  - REV-005 (`..._ENGINEERING_SPECIFICATION_REVISION_005.md`): `cec9fde59c27215beeeae9ac93ef1d3e6026ac80efa1f58ef4cf70e76bb44f5f`
  - REV-005 conformance audit: `d59bdd04dc050c2bfc425d9f53a3a21e17b95b4110fa65873bc171917db4086d`
  - PD-1 preparation: `4dcc6346dcfa52467ef741632a733ad21a26a7b9046015a867c3f286761ba8b4`
  - PD-1-A decision: `8cba9f378fd53e0605411ed1cffd4ab9d5989bf813a13fd236e5efc1f56a6cc4`
  - K1 post-implementation conformance audit: `15025941f119f93b30edc5f18a0a5fb024247fb6275710478774e0835b54417c`
  - K1 Residual PO decision: `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc`
  - PROVIDER_NEUTRAL_MVP_READINESS: `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26`
  - PROVIDER_FINALIZATION_DECISION: `adcb7f5333511cdc673bd4046b86217d1c6e889801521c80c34bd9fae2ab6bab`
  - PROJECT_MASTER_CHECKLIST: `43e6a04ed747395d93f1ee5c4b6582a60acf6806996f3bbe4b98596189ec8359`
  - CLIENT_INTENT_DISCOVERY_REQUIREMENT: `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1`

  These were cross-checked for internal consistency against the post-implementation audit's own §3 citations
  (ED-004, REV-005, REV-005 audit, PD-1 preparation, PD-1 decision hashes) — all match. No discrepancy found.

## 2. Why this record exists — the derived next gate

This is documentation/governance preparation only, following the K1 post-implementation conformance audit
(`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POST_IMPLEMENTATION_CONFORMANCE_AUDIT.md`), which found the implementation
**CONFORMANT WITH NON-BLOCKING FINDINGS** (0 blockers/critical/major, 2 minor: F-01, F-02) and explicitly stated it
authorizes nothing.

Three independent governing records converge on the same next gate — **validation authorization** — none of which
is a reflexive default:

1. **REV-005 §11** (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md:891-892`):
   "Implementation requires the Product Owner to decide PD-1 **and a separate authorization**." REV-005's own
   closing block lists `Validation authorized: NO` as a distinct line item from `Implementation authorized: NO`.
2. **PD-1-A decision §E** (`CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md:44-53`):
   implementation is authorized, but "Explicit Exclusions ... remaining in force even though implementation is
   authorized under PD-1-A" lists `Validation: NOT AUTHORIZED` separately from implementation.
3. **CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md §11** (Blockers table, line 400): `No validation
   authority (testing)` is listed as its own blocker row, `Additional PO decision needed? → Yes`, `Existing
   decision? → No`, distinct from the `No implementation authorization for the core` row (PD-1).

The K1 post-implementation conformance audit itself (§1) states: "This audit does not authorize validation,
provider/API calls, deployment/release, or commit/push," confirming it did not close this gate.

No existing record grants validation authority. `ls requirement/*VALIDATION_AUTHORITY* *PD2* *PD-2*` and a grep for
PD-numbered validation decisions returned nothing resembling a decided validation-authorization record for K1.
`PROJECT_MASTER_CHECKLIST.md` (a pre-REV-005 snapshot, still referencing the superseded Rev. 3 re-audit as the "next
task," so not treated as current for sequencing beyond its general pattern) independently shows the same governance
shape: "`→ PD-1 [PENDING] → implementation → tests → validation → release`" and "`8. Perform implementation
validation (under a validation authorization). — BLOCKED`" — validation is a distinct, separately gated step after
implementation and tests, not folded into PD-1.

**Conclusion: the next governance gate is validation authorization for K1.** This is not assumed from the prior
audit's informal suggestion; it is derived from REV-005 §11, PD-1-A §E, and READINESS §11 independently agreeing
that validation requires its own, not-yet-granted authorization.

### Note on naming

`CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md §9` already uses `PD-2` for an unrelated question
(representation of inferred business need, K-4). To avoid colliding with that existing ID, and because READINESS
§11 itself lists "No validation authority (testing)" without assigning it a PD number, this record does **not**
number the validation-authority question as `PD-2`. It is referred to as the **K1 Validation Authority** decision.
A Product Owner may assign a formal PD number when deciding it.

## 3. Scope under consideration

Whether, and under what exact scope, to authorize **validation** of the K1 implementation already found CONFORMANT
WITH NON-BLOCKING FINDINGS by the post-implementation audit. "Validation" here means whatever execution-authority
activity the Product Owner intends beyond the read-only audit already performed — this record does not presume a
specific validation method (e.g., further automated testing, live data review, controlled real-user scenario per
`MVP_REAL_USER_VALIDATION_TEMPLATE.md`, or something narrower); that choice is itself part of what the Product Owner
must decide, per §5 below.

This record is strictly about **authorizing validation to occur**, not about performing it, not about provider/API
calls, not about deployment/release, and not about correcting F-01 or F-02.

## 4. Existing policy / engineering facts / proposed options / open questions

### 4.1 Existing policy (not reopened by this record)

- K1 policy layer (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4) — decided, preserved, not reopened.
- PD-1-A — implementation authorized, already exercised; validation explicitly excluded from that authorization.
- REV-005 is the controlling engineering specification; it grants no authorization itself (§11).
- No existing record authorizes deployment/release, provider/API calls, external research, or participant contact
  for K1. Those remain separately gated and are not addressed by this record.

### 4.2 Engineering facts (established, not decided here)

- 729/729 tests pass across the full local suite (`npx vitest run --root packages/core-research`), independently
  re-run and confirmed by the post-implementation audit.
- 139 of 165 REV-005 §10.1–§10.5a detector-level row-IDs are literally referenced in shipped tests
  (`contactIdentifiers.test.ts`); the audit additionally spot-checked ~45 further inputs by direct execution during
  the audit (not left in the working tree).
- Provider/intake equivalence was verified by code inspection (same exported functions, same effective inputs on
  both paths).
- No provider/API call was made in producing the post-implementation audit or this preparation record.
- No deployment occurred.
- Two MINOR, non-blocking findings remain open: F-01 and F-02 (carried forward verbatim in §6 below).

### 4.3 Proposed decision options

See §5.

### 4.4 Unresolved questions for the Product Owner

- UQ-1: Should K1 validation be authorized now, given the audit's CONFORMANT WITH NON-BLOCKING FINDINGS verdict?
- UQ-2: If authorized, what is the exact validation scope — e.g., limited to the already-existing deterministic test
  suite and audit evidence (no new execution), or does it include additional controlled test execution, and if so
  under what boundaries (still excluding provider/API calls, external research, participant contact, deployment)?
- UQ-3: Does authorizing K1 validation also authorize deployment/release, or are those to remain separately gated?
  (Nothing in REV-005, PD-1-A, or READINESS §11 couples validation and deployment for K1; absent an explicit
  Product Owner statement to the contrary, this record treats them as separate.)
- UQ-4: Do F-01 or F-02 need to be corrected before validation, or may validation proceed with both recorded open
  (per the audit's own classification, see §6)?

## 5. Decision options

**OPTION A — AUTHORIZE K1 VALIDATION**
Authorize validation strictly within the scope the Product Owner specifies (e.g., the existing deterministic suite
plus any additional execution explicitly named). Explicitly excluded unless separately authorized: implementation
changes, provider/API calls, external research, participant contact, deployment/release, production traffic,
commit/push.

**OPTION B — DO NOT AUTHORIZE K1 VALIDATION**
Validation remains blocked. K1 implementation stands as audited (CONFORMANT WITH NON-BLOCKING FINDINGS) but no
further validation activity may proceed.

**OPTION C — NARROWED VALIDATION**
Not included. No existing governing record defines a meaningful narrower validation scope specific to K1 beyond
"the deterministic suite already run" (which is already complete) versus "further validation" (undefined without
Product Owner input); inventing a narrower scope here would add a requirement not implied by the governing chain.
If the Product Owner wants a narrower scope, it should be stated as part of Option A's scope specification rather
than as a separate option.

## 6. F-01 / F-02 treatment (carried forward, not reopened)

- **F-01** (`98765 43XXX ext 204` yields two `FRAGMENT` detections instead of one; `FRAGMENT` has no enforcement
  effect) — still open, MINOR, per the post-implementation audit §17: "NO — implementation-only fix, no policy
  change needed."
- **F-02** (mixed `*`/`•` mask runs implemented as homogeneous-only; confirmed fail-closed deviation from REV-005
  §4.6.4's literal text) — still open, MINOR, per the post-implementation audit §17: "NO — PD-1 preparation already
  dispositioned this as a recorded drafting-gap, not requiring a fresh PO decision."
- Re-reading the audit's own §17 and §18 confirms both are classified **non-blocking** by the audit itself ("No
  BLOCKER, CRITICAL or MAJOR finding was identified" / "CONFORMANT WITH NON-BLOCKING FINDINGS"). This record does
  not silently close either finding, does not reclassify them, and does not propose code changes to fix them; UQ-4
  above surfaces whether the Product Owner wants either addressed before validation.

## 7. Test / validation state (recorded facts, not re-verified by re-running)

- 729/729 full local suite passed (as reported by the post-implementation audit, which ran it independently).
- Post-implementation conformance audit completed; verdict CONFORMANT WITH NON-BLOCKING FINDINGS.
- 139/165 detector-level REV-005 rows directly covered by shipped tests; ~45 additional live-function spot checks
  performed during that audit (throwaway file, deleted before the audit record was written).
- Provider/intake equivalence verified by code inspection.
- No provider/API calls were made in preparing this record.
- No deployment occurred.
- This record did not rerun the test suite — not required for documentation preparation and the figures above are
  already established by the post-implementation audit.

## 8. Write boundary / no-authorization confirmation

This record is the only file created in this task. No existing file was modified. This record does not authorize
validation, deployment, release, provider calls, API calls, external research, participant contact, commit, or
push.

## Final State Check

**Baseline**
- Branch: `feature/client-intent-discovery-complete`
- HEAD: `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` (unchanged)
- Staged count: `0` (unchanged)
- Code fingerprint: unchanged (see §1)
- Implementation files: unchanged (6 files, same as post-implementation audit scope)
- Governing-record hashes: unchanged (see §1)

**This record**
- Record type: PRODUCT OWNER DECISION PREPARATION (no decision made)
- Record ID: `CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-VALIDATION-AUTHORITY-PREP-001`
- Path: `requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_VALIDATION_AUTHORITY_PREPARATION.md`
- SHA-256: self-referential (the hash of this file changes once this value is written); the authoritative SHA-256 of
  the final, as-delivered file is reported in the task completion report, not embedded here.

**Governance**
- Implementation authorized: prior (PD-1-A); not reopened here
- Validation authorized: NO (this record prepares the question; it does not decide it)
- Provider/API calls: NO
- External research: NO
- Participant contact: NO
- Deployment/release: NO
- Commit/push: NO

Files created this round: 1 (this record). Existing records modified: 0.
