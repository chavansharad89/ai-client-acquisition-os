# Intent Intake MVP

## AI-Platform FIRST_PARTY Exact-Result Binding — Product Owner Decision

**Record ID:** INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001
**Date:** 2026-09-30
**Type:** Product Owner decision (design only, no implementation authority)
**Decides:** Q-X1 to Q-X7 and the mechanism in INTENT-INTAKE-OD13-EXACT-BINDING-PREP-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_EXACT_RESULT_BINDING_DECISION_PREPARATION.md`,
sha256 `508e512ed42945695ae899f079b63ce67841d25a4b1711ac139427b8407d3c42`)

```text
Product Owner requirement: DECIDED
Q-X1: DECIDED
Q-X2: DECIDED
Q-X3: DECIDED
Q-X4: DECIDED
Q-X5: DECIDED
Q-X6: DECIDED
Q-X7: DECIDED

Selected implementation option: X1 — re-derive signals from verified bytes at save time

Implementation authority: NONE
Runtime-wiring authority: NONE
Provider-call authority: NONE
Database authority: NONE
Validation authority: NONE
Deployment authority: NONE
```

The preparation record is left unchanged. Its analyst findings (§1 to §5), its option table and its open
questions stay as written; this record holds only the Product Owner decisions. Where the two differ, the
preparation record's §6 form and §7 `Implementation mechanism: PENDING` are superseded by this record, not edited.

This record does not change OD-1 to OD-13, INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001, IA-1, IA-2, DP-1, DOC-1 or
IA-OD13-B. Everything listed in preparation §5 stays unchanged.

---

## 1. Pre-decision verification

No code was changed, no test was run, no database connection or provider call was made for these checks.

### 1.1 Repository baseline

| Item | Value | Result |
|---|---|---|
| Branch | `phase-17-r34-worker-orchestration` | = preparation §1 |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | = preparation §1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `97aed26af4dc36210ad50ca930fc89de00dcaa15ae048465adde69eab77ea89a` | = preparation §1 |
| Staged files | 0 | = preparation §1 |
| Working-tree entries | 224 (before this record) | = 223 at preparation §1 + the preparation record itself |

### 1.2 Governing-record hashes (sha256)

All files are `requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_…`.

| Record | File | sha256 | Result |
|---|---|---|---|
| INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 | `AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` | = preparation §1.1 |
| INTENT-INTAKE-PO-DEC-003 | `AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | = |
| INTENT-INTAKE-PO-DEC-004 | `AUTHORIZATION_BLOCKERS_DECISION.md` | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | = |
| INTENT-INTAKE-PO-DEC-005 | `AUTHORIZATION_EVIDENCE_SCHEMA_DECISION.md` | `0da5daed74ed9812bf2add6550468f39d1abe334400d66a70603a2fd0e1938da` | = |
| DEC-005-SCHEMA rev. 2 | `AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION.md` | `078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33` | = |
| DEC-005-SCHEMA-PREREQ | `AUTHORIZATION_EVIDENCE_SCHEMA_PREREQUISITES_DECISION.md` | `572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca` | = |
| DEC-005 IMPL-REC-001 | `AUTHORIZATION_EVIDENCE_SCHEMA_IMPLEMENTATION_RECORD.md` | `625fe44151e2dddabd60b583cbeb34a4142541afd64c28011f9b328f385fa711` | = |
| DEC-005 EXEC-REC-001 | `AUTHORIZATION_EVIDENCE_SCHEMA_VALIDATION_DB_EXECUTION_RECORD.md` | `1c22782c381359620a2eb966cb07ec73168c146ee0cdf54220165c96d6dfcf77` | = |
| IA-OD-WRITER-001 | `AUTHORIZATION_EVIDENCE_WRITER_PATH_IMPLEMENTATION_AUTHORIZATION.md` | `55d249a3474e8ee66fcd35096c3d1de135c7caaa7318ed4ad6448b0a1a63cd5d` | = |
| IA-OD-WRITER-001-IMPL-REC-001 | `AUTHORIZATION_EVIDENCE_WRITER_PATH_IMPLEMENTATION_RECORD.md` | `9d00c78fd94115b3ae82bb0a4dae105a99d7e7951a996ef0116aa637c61b56c7` | = |
| DP-1 preparation | `CONSENT_POLICY_LABEL_DECISION_PREPARATION.md` | `22eafc7be188a51c4f9769c4e477780a7bf1fd6475eb8074cdfc5ab700c406d4` | = |
| OD-13 preparation + decision (rev. 2) | `PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` | = |
| IA-OD13-B implementation record | `PROVIDER_AUTHENTICITY_IMPLEMENTATION_RECORD.md` | `ac3c9d5f36d58a5eb7ee237832c2882577bd424a62ba1de6f7d4067d307ed035` | = |
| INTENT-INTAKE-OD13-EXACT-BINDING-PREP-001 | `EXACT_RESULT_BINDING_DECISION_PREPARATION.md` | `508e512ed42945695ae899f079b63ce67841d25a4b1711ac139427b8407d3c42` | First recorded hash (reference) |

### 1.3 Exact-result binding implementation unchanged

All eleven files in preparation §1.2 have the same sha256 as recorded there (`providerAuthenticity.ts`
`e73234ef…`, `intentSourceProviderContract.ts` `0823225a…`, `intentSignal.ts` `8e60e8ff…`, `index.ts` `1e641058…`,
`intentIntake.ts` `9bae1467…`, `providerAuthenticity.test.ts` `03982587…`, `intentSourceProviderContract.test.ts`
`208ac0ac…`, `worker.test.ts` `7886cce3…`, both integration tests `97637977…` / `1827bde7…`, `pgRepository.ts`
`290c57d2…`). `requireProviderAuthenticityForIntake` (`providerAuthenticity.ts:343`) still binds by integration ID
only. Current exact-result binding: **NOT PRESENT**.

### 1.4 No runtime caller wired

Outside test files, `verifyProviderEnvelope`, `normalizeVerifiedProviderResult`,
`requireProviderAuthenticityForIntake`, `recordIntentIntakeForOwner` and `recordIntentSignalForOwner` appear only as
definitions, the internal call `intentIntake.ts:167` (single-signal form, which refuses FIRST_PARTY), re-exports
(`core-research/src/index.ts`, `apps/worker/src/searchWorker/index.ts`) or comments. **No runtime caller exists. OD-13
runtime gate: IN FORCE.**

---

## 2. Decisions on Q-X1 to Q-X7

Question wording is as in preparation §4.

| # | Question | Product Owner decision |
|---|---|---|
| Q-X1 | **Comparison scope.** FIRST_PARTY entries only, or also the event's PUBLIC_INTENT entries, or also `companyName` / `website`? | **DECIDED: FIRST_PARTY entries plus `companyName` and `website`.** PUBLIC_INTENT entries are not compared: they are outside OD-13 (Q12). `companyName` / `website` are compared because they come from `result.business` in the verified bytes and determine the Company / Prospect the FIRST_PARTY row attaches to; a genuine signal attached to a different company is not bound to its result. `searchId` is not compared: it is caller-chosen and not part of the verified result. The check applies only when the event has at least one FIRST_PARTY entry (as today). |
| Q-X2 | **Matching fields.** Which entry fields must match: `field`, `quote`, `sourceUrl`, `sourceLabel`, `observedAt`, `authorizationEvidence` (all five values)? | **DECIDED: all of them.** `field`, `quote`, `sourceUrl`, `sourceLabel`, `observedAt` and all five `authorizationEvidence` values must equal the re-derived entry exactly. All are deterministic outputs of the P2 mapping, so exact equality is achievable and leaves no field a caller can alter. |
| Q-X3 | **Multiplicity and order.** An exact ordered sequence, a multiset, or a subset? | **DECIDED: exact ordered sequence.** The presented FIRST_PARTY entries, taken in intake order, must equal the re-derived FIRST_PARTY entries in the same order, with the same count. No extra entry, no omitted entry, no reordering. Identical `SUPPLIED_TO_US` items are matched position by position. A caller cannot save fewer FIRST_PARTY signals than the verified result carries. |
| Q-X4 | **Receipt time for re-derivation (X1).** Use the proof's `receivedAt` or P3's `now`? | **DECIDED: the proof's `receivedAt`.** It reproduces the P2 outcome exactly, so a result is not refused only because its 90-day authorization window closed between receipt and save. This concerns the re-derivation only; OD-2 and every existing P3 validation at P3's `now` stay unchanged. |
| Q-X5 | **One proof, several normalizations (X2).** Is repeated P2 normalization of one proof allowed, and does each produce its own recorded derivation? | **DECIDED: repeated P2 normalization is allowed; no derivation is recorded.** Under the selected X1 there is no P2-recorded state: P3 re-derives from the verified bytes each time. `searchId` is not part of the verified result and is not compared (Q-X1). A proof is not single-use (X5 not adopted, §3); OD-12 item 3 duplicate persistence stays as decided. |
| Q-X6 | **Failure field / reason naming** for a binding mismatch. | **DECIDED:** `IntentSignalValidationError` with reason **`result-mismatch`** and field: `signals[<index>]` for a presented FIRST_PARTY entry (first in order) that differs from, or has no counterpart in, the re-derived sequence; `signals` when the presented sequence has fewer FIRST_PARTY entries than the re-derived one; `companyName` or `website` when that value differs. Per OD-11 item 3: identifier, field and reason only; no presented or verified value appears in the error. The whole event is refused before any lookup or write. |
| Q-X7 | **Save-time check or also a durable record.** | **DECIDED: save-time enforcement is sufficient.** The requirement concerns what is **saved**; enforcing at P3 before the write means no FIRST_PARTY row can be written unless bound to its verified result. No durable record is required, so no schema change, no IA-1 writer change and no Q9 question arises. A durable binding record would require its own Product Owner and schema decision. |

---

## 3. Selected implementation option

**Selected: X1 — re-derive signals from verified bytes at save time.**

X2, X3 and X4 are not selected. X5 is not adopted as a complement.

### 3.1 Product Owner rationale (from preparation §2 and §3)

- **It establishes the invariant on its own, at the save boundary.** Every FIRST_PARTY entry presented at P3 must
  equal one re-derived from the proof's own verified bytes. A proof whose result has no `SUPPLIED_TO_US` item cannot
  authorize any FIRST_PARTY signal. This is exactly the stated purpose: a valid proof for integration X can no longer
  be paired with unrelated FIRST_PARTY signals from integration X.
- **Its trust anchor is the verified bytes, not a caller-held link.** Preparation §2.2 finds that between P2 and P3
  the link is only co-location. X1 closes that gap by reading the verifier-private copy of the exact bytes already
  re-verified at P3. It does not rely on P2 being the only producer of recorded state (the X2 trust assumption), and
  it uses no copyable reference (the X3 advisory reference).
- **It needs no new persisted or public surface.** Preparation §2.3 finds `VerifiedProviderResult` already carries
  enough for an in-memory check at P3. X1 changes neither the public shape of `VerifiedProviderResult`, nor
  `RecordIntentIntakeInput`, nor the signature of `recordIntentIntakeForOwner`, nor the entry / source records, nor
  the schema, nor the IA-1 writer contract. It stays within DEC-005's fixed column set and Q9.
- **It fits the decided answers.** Q-X7 (save-time only) removes the need for X4. Q-X5 (no recorded derivation, no
  single use) removes the need for X2 state and for X5, which preparation §3 notes does not bind content alone and
  intersects IA-OD13-B §5 and OD-12 item 3.

### 3.2 Consequences to be carried into any implementation authorization

These are facts from the preparation record that a later implementation authorization must address. They are not
authorized here.

- **Import cycle** (preparation §2.3, X1 row 8): the deterministic P2 mapping must be reachable from the P3 check
  without a runtime import cycle between `providerAuthenticity.ts` and `intentSourceProviderContract.ts`, by
  placement or an added function.
- **Company fields** (X1 row 7): the P3 check needs `companyName` / `website` from the intake input, not only
  `validated.signals` (Q-X1). No signature change.
- **Same function** (X1 row 12): the P3 re-derivation must be the same deterministic mapping as P2, evaluated at
  `receivedAt` (Q-X4).
- **Tests** (X1 row 11): worker FIRST_PARTY tests must use proofs whose signed result yields the entries; the current
  `{ fixture: true }` proof would be refused. New tests: swapped signal, altered quote / field / observedAt /
  evidence, extra and omitted FIRST_PARTY entry, reordered entries, altered `companyName` / `website`, proof with no
  `SUPPLIED_TO_US`, proof from another result of the same integration.
- **Runtime wiring** (X1 row 14): remains blocked by OD-13.

---

## 4. What stays unchanged

- OD-1 to OD-13, INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (Option B, Ed25519, exact bytes, the 5-minute window, no
  nonce store, per-result rejection without halt, no retention, envelope-only version), IA-1, IA-2, DP-1, DOC-1,
  IA-OD13-B.
- One provider call per acquisition event; no automatic retry; no runtime key fetch; public keys only.
- The OD-13 runtime gate. **This decision does not lift it.** No runtime caller may feed FIRST_PARTY results into
  saving until an integration is named, its key is registered and runtime wiring is authorized, each separately.

---

## 5. Authority

The selected option is a design decision only. A separate implementation authorization is required before any code,
test, schema, configuration or wiring change.

```text
Implementation authority: NONE
Runtime-wiring authority: NONE
Provider-call authority: NONE
Database authority: NONE
Validation authority: NONE
Deployment authority: NONE
```

## 6. Final state

```text
Product Owner requirement: DECIDED
Q-X1 to Q-X7: DECIDED
Selected implementation option: X1
Current exact-result binding: NOT PRESENT (save boundary binds by integration ID only)
OD-13 runtime gate: IN FORCE
Implementation authorization: NONE
```

## 7. Execution counters (this record)

```text
Production files changed: 0
Test files changed: 0
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
Files created: 1 (this record)
Files modified: 0
```

**INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 — Q-X1 TO Q-X7 DECIDED — X1 SELECTED — NO IMPLEMENTATION AUTHORITY**
