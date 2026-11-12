# Intent Intake MVP

## AI-Platform FIRST_PARTY Exact-Result Binding — Implementation Decision Preparation

**Record ID:** INTENT-INTAKE-OD13-EXACT-BINDING-PREP-001
**Date:** 2026-09-30
**Type:** Decision preparation (implementation mechanism only)
**Governs:** OD-13 (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2), INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (§13 of the
provider-authenticity record), IA-OD13-B and its implementation record

```text
Product Owner requirement: DECIDED
Implementation mechanism: PENDING
Implementation authority: NONE
```

This record doesn't choose, rank or score an option. It doesn't reinterpret the Product Owner requirement, and it
doesn't change OD-1 to OD-13, INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001, IA-1, IA-2, DP-1, DOC-1 or IA-OD13-B.

---

## 0. The decided requirement [DECIDED]

As stated by the Product Owner (2026-09-30, design decision only, no implementation authority):

> Every FIRST_PARTY / SUPPLIED_TO_US signal saved must be bound to the exact provider result whose authenticity was
> successfully verified, rather than only to the integration ID.

Purpose as stated: to prevent a valid authentication proof for integration X from being paired with unrelated
FIRST_PARTY signals from integration X.

The relationship in scope is: **authenticated provider result → exact result → FIRST_PARTY signal being persisted.**

---

## 1. Baseline (verified before writing)

| Item | Value | Result |
|---|---|---|
| Branch | `phase-17-r34-worker-orchestration` | = OD-13 record §13.1 |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | = OD-13 record §13.1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `97aed26af4dc36210ad50ca930fc89de00dcaa15ae048465adde69eab77ea89a` | Was `f94e3c0d…` at §13.1. The change is from IA-OD13-B's edits to tracked files. `git diff HEAD` does not cover untracked files. |
| Staged files | 0 | matches |
| Working-tree entries | 223 (before this record) | = 220 at §13.1 + 3 IA-OD13-B untracked files (`providerAuthenticity.ts`, `providerAuthenticity.test.ts`, the implementation record). `intentIntake.ts` was already untracked. |
| Files modified after the IA-OD13-B implementation record (mtime 2026-09-30T20:30:11), excl. `node_modules`, `.git`, `.next`, `.turbo` | none | no later change |

### 1.1 Governing-record hashes (sha256)

| Record | File (`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_…`) | sha256 | Result |
|---|---|---|---|
| INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 | `AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` | = OD-13 record §1.1 |
| INTENT-INTAKE-PO-DEC-003 | `AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | = §1.1 |
| INTENT-INTAKE-PO-DEC-004 | `AUTHORIZATION_BLOCKERS_DECISION.md` | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | = §1.1 |
| INTENT-INTAKE-PO-DEC-005 | `AUTHORIZATION_EVIDENCE_SCHEMA_DECISION.md` | `0da5daed74ed9812bf2add6550468f39d1abe334400d66a70603a2fd0e1938da` | = §1.1 |
| DEC-005-SCHEMA rev. 2 | `AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION.md` | `078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33` | = §1.1 |
| DEC-005-SCHEMA-PREREQ | `AUTHORIZATION_EVIDENCE_SCHEMA_PREREQUISITES_DECISION.md` | `572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca` | = §1.1 |
| DEC-005 IMPL-REC-001 | `AUTHORIZATION_EVIDENCE_SCHEMA_IMPLEMENTATION_RECORD.md` | `625fe44151e2dddabd60b583cbeb34a4142541afd64c28011f9b328f385fa711` | = §1.1 |
| DEC-005 EXEC-REC-001 | `AUTHORIZATION_EVIDENCE_SCHEMA_VALIDATION_DB_EXECUTION_RECORD.md` | `1c22782c381359620a2eb966cb07ec73168c146ee0cdf54220165c96d6dfcf77` | = §1.1 |
| IA-OD-WRITER-001 | `AUTHORIZATION_EVIDENCE_WRITER_PATH_IMPLEMENTATION_AUTHORIZATION.md` | `55d249a3474e8ee66fcd35096c3d1de135c7caaa7318ed4ad6448b0a1a63cd5d` | = §1.1 |
| IA-OD-WRITER-001-IMPL-REC-001 | `AUTHORIZATION_EVIDENCE_WRITER_PATH_IMPLEMENTATION_RECORD.md` | `9d00c78fd94115b3ae82bb0a4dae105a99d7e7951a996ef0116aa637c61b56c7` | = §1.1 |
| DP-1 preparation | `CONSENT_POLICY_LABEL_DECISION_PREPARATION.md` | `22eafc7be188a51c4f9769c4e477780a7bf1fd6475eb8074cdfc5ab700c406d4` | = §1.1 |
| OD-13 preparation + decision (rev. 2) | `PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` | No prior hash of rev. 2 is on file; §13.1 holds only the pre-rev-2 hash. Not modified since IA-OD13-B. |
| IA-OD13-B implementation record | `PROVIDER_AUTHENTICITY_IMPLEMENTATION_RECORD.md` | `ac3c9d5f36d58a5eb7ee237832c2882577bd424a62ba1de6f7d4067d307ed035` | First recorded hash (reference) |

No governing record was modified by this preparation.

### 1.2 Option B implementation state

The IA-OD13-B implementation record lists its files but no file hashes. Current hashes are recorded below as the
reference for any later work. No file was modified after that record was written (§1). Inspection confirms each file
still matches the behavior the record describes.

| File | sha256 | Matches IA-OD13-B record |
|---|---|---|
| `packages/core-research/src/providerAuthenticity.ts` | `e73234ef2b3a6b84b47c43e24a96ef1b89d261ac5e271fe69f560021780dc0ee` | yes |
| `packages/core-research/src/intentSourceProviderContract.ts` | `0823225a6b53a577cc4f660f6a1de75fcb6136a94dded56682ea77b7ed83cc6f` | yes |
| `packages/core-research/src/intentSignal.ts` | `8e60e8ff7abe0c4a047a752ef76218b17ca66203e483a86fc10bf94bd175a8f9` | yes |
| `packages/core-research/src/index.ts` | `1e6410584504175e0323e10b729c888641f326527a4559321f36a21ad071dbe5` | yes |
| `apps/worker/src/searchWorker/intentIntake.ts` | `9bae14671db5788bdb5654a9858fd95b475180ff0fd9f9a9d3e9f7c10e44f217` | yes |
| `packages/core-research/src/providerAuthenticity.test.ts` | `039825872df8008ca84df0ca5f5e24867f7654f108f5ade8ef2dc931af2b6028` | yes |
| `packages/core-research/src/intentSourceProviderContract.test.ts` | `208ac0acda0fe75298c689eddc58017b6f3412e4449f5574ac7b74633e35ea11` | yes |
| `apps/worker/src/searchWorker/worker.test.ts` | `7886cce3746eb25a7e5602a0c4165c7658614be10a16746e076737fc5b4515d4` | yes |
| `tests/integration/intent-intake.integration.test.ts` | `97637977c1303581885d9136a3382c2e3b83553ed3618bc13d4cc287aba48ddf` | = OD-13 record §1.2 (unchanged) |
| `tests/integration/research-signal-authorization-evidence.integration.test.ts` | `1827bde7cfa54c891b73371bb9ee87969ff923ae678e15dbbfb1096e55e190e0` | = OD-13 record §1.2 (unchanged) |
| `packages/core-research/src/pgRepository.ts` (IA-1 writer) | `290c57d2a6ebe0f2ff15a8b01b113636d2c1e265627e6f25c982ac7972444f91` | not an IA-OD13-B file |

No tests were run for this record. No database connection or provider call was made.

### 1.3 Current save-boundary behavior: integration ID only [IMPL-FACT]

`requireProviderAuthenticityForIntake` (`providerAuthenticity.ts:343`), called from `recordIntentIntakeForOwner`
(`intentIntake.ts:97–101`), does the following:

1. It returns immediately when no signal is FIRST_PARTY.
2. It requires that the proof was issued by the verifier (the `ISSUED` WeakMap, `:174`).
3. It re-runs `checkSignature` over the verifier's private copy of the bytes, using the key as registered at save time.
4. For each FIRST_PARTY signal, it requires `authorizationEvidence.integrationId === state.integrationId`.

**Nothing compares a FIRST_PARTY signal's content with the verified result's content.** The worker tests show this
directly: `providerProof()` (`worker.test.ts:2361`) signs a result of `{ fixture: true }`, which contains no
`SUPPLIED_TO_US` item at all. The intake still accepts hand-built FIRST_PARTY entries paired with that proof
(`:2651`, `:2979`). The gap is the one listed as remaining issue 1 in the IA-OD13-B record.

Runtime wiring was re-checked. Outside tests, `verifyProviderEnvelope`, `normalizeVerifiedProviderResult`,
`requireProviderAuthenticityForIntake` and `recordIntentIntakeForOwner` appear only as definitions, internal calls,
re-exports (`core-research/src/index.ts`, `apps/worker/src/searchWorker/index.ts`) or comments. **No runtime caller
exists. OD-13 runtime gate: IN FORCE.**

---

## 2. Identity available at each boundary [IMPL-FACT]

### 2.1 The five identities

| Identity | What it is today | Where it lives |
|---|---|---|
| **Integration identity** | `integrationId` string | Registry entry. Transport claim. Envelope `integrationId`. `provenance.integration`. `authorization.integrationId`. FIRST_PARTY `authorizationEvidence.integrationId`. Persisted as `research_signals.integration_id`. |
| **Provider envelope identity** | `{ version, integrationId, keyId, signedAt }` inside the signed bytes | Signed body. Public fields of `VerifiedProviderResult` (`integrationId`, `keyId`, `signedAt`, `receivedAt`; `:156`). |
| **Cryptographic verification identity** | Registered key `(integrationId, keyId)` plus an Ed25519 signature over the exact bytes | Verifier-private `VerifiedState` (`:164`): `registry`, `integrationId`, `keyId`, `body` (private copy of the exact bytes), `signature`. Never persisted (Q9). |
| **Exact-result identity** | The `envelope.result` inside the verified bytes. Within it, `externalId` is the integration's own event id; it is integration-asserted and uniqueness is not enforced. At P2, `NormalizedIntentEvent.eventId` is a sha256 over family, type, externalId, website and each signal's kind, field, evidence, source reference and observed time (`intentSource.ts:363–371`). | Bytes: verifier-private. `externalId` / `eventId`: only on the P2 outcome (`event.externalId`, `event.eventId`). **Neither is on `RecordIntentIntakeInput` or its entries, and neither is persisted** (no column; `pgRepository.ts:77–81`). |
| **Individual FIRST_PARTY signal identity** | Before the save, an intake entry: `kind`, `field`, `quote`, `sourceUrl`, `sourceLabel`, `observedAt`, `authorizationEvidence` (`intentSignal.ts` `RecordIntentSignalInput`) | After the save: `research_signals.id` (generated by the database at INSERT) plus a `research_signal_sources` row. No identifier exists before the INSERT. |

### 2.2 At each boundary

| Boundary | Integration | Envelope | Crypto | Exact result | FIRST_PARTY signal |
|---|---|---|---|---|---|
| **P1** `verifyProviderEnvelope` (`:257`) | transport claim, then the signed value | checked (version, ids, freshness) | verified | bytes captured privately | — (not parsed into signals) |
| **P2** `normalizeVerifiedProviderResult` (`intentSourceProviderContract.ts:615`) | bound to provenance and authorization (`bindVerifiedIdentity`, `:561`) | available via the proof | not re-checked (reads the private bytes) | re-parsed fresh from the bytes (`openVerifiedProviderResult`, `:321`); `externalId` / `eventId` on the outcome | derived: `event.intake.signals`, with the proof attached as `intake.providerAuthenticity` (`:631`) |
| **Between P2 and P3** (caller-held) | — | — | — | **the link is only co-location**: the caller can replace `intake.signals` and keep the proof | caller-controlled |
| **P3** `recordIntentIntakeForOwner` → `requireProviderAuthenticityForIntake` | compared per FIRST_PARTY signal | not used | re-verified | **not used**: the private bytes are reachable but never read for comparison | validated entries (`toIntentIntakeInput`) |
| **IA-1 writer** `saveSignals` (`pgRepository.ts:64`) | written to `integration_id` | — | — | — | row plus source row |

### 2.3 Does `VerifiedProviderResult` already carry enough to bind?

**Yes, for an in-memory check at P3.** The verifier-private state holds the exact verified bytes. From those, the full
provider result can be re-parsed: `externalId`, `business`, `sourceReference`, every evidence item (`origin`,
`requirement`, `statement`, `referenceUrl`, `observedAt`) and `authorization`. The same deterministic mapping that
produced the intake entries at P2 can then be recomputed. No persisted field is needed for a save-time check, because
the requirement concerns what is **saved**. Whether the binding must also be **recorded** in the database is not
stated by the requirement; see Q-X7.

Implementation facts that any in-memory option has to handle:

- **Import direction.** `intentSourceProviderContract.ts` imports `openVerifiedProviderResult` from
  `providerAuthenticity.ts` at run time. `providerAuthenticity.ts` imports only types back. Any re-derivation that
  calls the contract's normalization from inside `providerAuthenticity.ts` creates a runtime import cycle unless the
  code is placed differently.
- **Receipt time.** P2 normalization uses `options.now` for the OD-2 90-day check and for `normalizeIntentEvent`. P3
  runs later with its own `now`. A re-derivation must pick which instant it uses (Q-X4).
- **Company identity.** `searchId`, `companyName` and `website` sit on the intake event, not on the entries.
  `companyName` / `website` come from `result.business`. `searchId` is caller-chosen and is not part of the verified
  result.

---

## 3. Implementation options [OPEN — not ranked, none selected]

Options X1 to X3 each aim at the invariant on their own. X4 needs a schema change. X5 is a complement and does not
establish the invariant alone. Sub-choices shared by several options are listed in §4.

### Option X1 — Re-derive at P3 from the verified bytes

| # | Property | Content |
|---|---|---|
| 1 | Invariant | Every FIRST_PARTY entry presented at P3 equals an entry obtained by re-deriving the intake from the proof's own verified bytes (scope per Q-X1, matching per Q-X2 and Q-X3). A proof whose result has no `SUPPLIED_TO_US` item cannot authorize any FIRST_PARTY signal. |
| 2 | Data | The verifier-private `body`. The deterministic P2 mapping (adapter plus `normalizeIntentEvent` intake construction). The presented entries. |
| 3 | Binding created | Implicitly at P1, when the exact bytes are captured. |
| 4 | Binding checked | P3, inside `requireProviderAuthenticityForIntake` (or its replacement), before any lookup or write. |
| 5 | `VerifiedProviderResult` carries it? | Yes. The private bytes already exist; the public shape doesn't change. |
| 6 | `RecordIntentIntakeInput` changes? | No. `providerAuthenticity` already exists. |
| 7 | `recordIntentIntakeForOwner` changes? | Not in signature. It may need to pass `input` (company fields), not only `validated.signals`, if Q-X1 widens the scope. |
| 8 | `intentSignal` / source records change? | No. The derivation logic has to be reachable from the P3 check, which means relocating code or adding a function to avoid the import cycle (§2.3). |
| 9 | Schema / migrations | None. |
| 10 | IA-1 writer contract | Unchanged (`saveSignals`, OD-8 transaction, columns). An additional precondition before it. |
| 11 | Tests | Worker FIRST_PARTY tests must supply proofs whose signed result actually yields the entries (the current `{ fixture: true }` proof would be refused), or build intakes through `normalizeVerifiedProviderResult`. New tests: swapped signal, altered quote / field / observedAt / evidence, extra FIRST_PARTY entry, proof with no `SUPPLIED_TO_US`, proof from another result of the same integration. The core-research contract tests and the integration test files are unaffected (they don't call `recordIntentIntakeForOwner`). |
| 12 | Trust assumptions | The P3 re-derivation is the same deterministic function as P2. The verifier-private state can't be reached outside the module. In-process code can still pass the right proof with its own genuine entries; that is the intended case. |
| 13 | Failure | `IntentSignalValidationError` at P3 (field per Q-X6). The whole event is refused before any lookup or write. No halt, no retry, nothing persisted. |
| 14 | Runtime wiring | Remains blocked by OD-13. |

### Option X2 — Record the derivation at P2, compare at P3

| # | Property | Content |
|---|---|---|
| 1 | Invariant | Every FIRST_PARTY entry presented at P3 equals one that `normalizeVerifiedProviderResult` produced from that proof. |
| 2 | Data | The P2 outcome's intake entries (or a digest of them, per Q-X3), stored in verifier-controlled in-memory state keyed by the proof or by a new token. |
| 3 | Binding created | P2, in `normalizeVerifiedProviderResult`, when it produces a NORMALIZED outcome. |
| 4 | Binding checked | P3, before any lookup or write. |
| 5 | `VerifiedProviderResult` carries it? | Variant (a): yes, as additional private state on the same object; the public shape is unchanged. Variant (b): a new branded "authenticated intake" object issued at P2, with `VerifiedProviderResult` left as is. |
| 6 | `RecordIntentIntakeInput` changes? | Variant (a): no. Variant (b): yes; the `providerAuthenticity` field type becomes the new branded type. |
| 7 | `recordIntentIntakeForOwner` changes? | No signature change in (a). A type-only change in (b). |
| 8 | `intentSignal` / source records change? | No. P2 needs a module-internal way to record the derivation against the proof, which means code in `providerAuthenticity.ts` and the contract, without creating a runtime import cycle. |
| 9 | Schema / migrations | None. |
| 10 | IA-1 writer contract | Unchanged. An additional precondition before it. |
| 11 | Tests | As X1. In addition, worker tests must obtain intakes through `normalizeVerifiedProviderResult`, because no other path records a derivation. Tests are also needed for normalizing one proof twice with different `searchId` / `now` (per Q-X5). |
| 12 | Trust assumptions | The binding is only as good as P2's integrity. It relies on P2 being the only producer of recorded derivations. The in-memory state lives only as long as the proof object. |
| 13 | Failure | As X1. A proof that was never normalized at P2 has no recorded derivation and is refused. |
| 14 | Runtime wiring | Remains blocked by OD-13. |

### Option X3 — Result reference on each FIRST_PARTY entry, plus a content check

| # | Property | Content |
|---|---|---|
| 1 | Invariant | Each FIRST_PARTY entry names the exact verified result it came from, for example a digest of the verified bytes or `(integrationId, externalId, eventId)`. P3 requires that reference to equal the proof's, **and** requires the entry's content to match that result (X1 or X2 style). The reference on its own is copyable, so it establishes only "claims the same result", not "derived from it". |
| 2 | Data | A reference value computed from the verified result; entry content. |
| 3 | Binding created | P2, when intake entries are built for a verified result. |
| 4 | Binding checked | P3. |
| 5 | `VerifiedProviderResult` carries it? | It can expose or compute the reference, which adds a public field or accessor. |
| 6 | `RecordIntentIntakeInput` changes? | Yes. `IntentSignalEntry` / `RecordIntentSignalInput` gain a field, and `toIntentSignalInput` must accept it on FIRST_PARTY and refuse it elsewhere (OD-7 pattern). |
| 7 | `recordIntentIntakeForOwner` changes? | Behavior only (passes the entries through). No signature change. |
| 8 | `intentSignal` / source records change? | Yes: the entry type and validation, and `normalizeIntentEvent` intake construction (`intentSource.ts:312–330`) or its wrapper at P2. `NewResearchSignalInput` is unchanged unless the reference is persisted (that is X4). |
| 9 | Schema / migrations | None if the reference is dropped before `saveSignals`. |
| 10 | IA-1 writer contract | Unchanged if the reference is not passed to `saveSignals`. The intake-entry contract does change. |
| 11 | Tests | As X1. In addition: entry-validation tests for the new field (allowed on FIRST_PARTY only), reference-mismatch tests, and updates to every FIRST_PARTY entry fixture in `worker.test.ts` and `intentSignal.test.ts`. |
| 12 | Trust assumptions | As X1 or X2 for the content check. The reference is advisory, not cryptographic. |
| 13 | Failure | As X1. A reference mismatch gets its own field / reason (Q-X6). |
| 14 | Runtime wiring | Remains blocked by OD-13. |

### Option X4 — Persist a result binding on the signal row

| # | Property | Content |
|---|---|---|
| 1 | Invariant | Each saved FIRST_PARTY row carries a durable reference to its exact verified result, so the binding is checkable after the save. It still needs X1, X2 or X3 at P3 to be enforced at save time. |
| 2 | Data | A result digest and / or `externalId`, written in the row's own INSERT. |
| 3 | Binding created | P2 or P3. |
| 4 | Binding checked | P3 (enforcement); later reads (audit). |
| 5 | `VerifiedProviderResult` carries it? | It supplies the value. |
| 6 | `RecordIntentIntakeInput` changes? | Yes, or the value is derived at P3 from the proof. |
| 7 | `recordIntentIntakeForOwner` changes? | Yes. It passes the value to the writer. |
| 8 | `intentSignal` / source records change? | Yes: `NewResearchSignalInput` and `StoredResearchSignal` gain a field. |
| 9 | Schema / migrations | **Yes.** A new column on `research_signals` (and likely an extension of the 0030 immutability trigger). This is outside DEC-005's fixed column set. |
| 10 | IA-1 writer contract | **Changes** (INSERT columns). |
| 11 | Tests | Unit tests as X1. Pg repository tests. A migration integration test, which needs a database target. |
| 12 | Trust assumptions | As the enforcing option. A persisted digest is a verification-derived value. |
| 13 | Failure | As the enforcing option. |
| 14 | Runtime wiring | Remains blocked by OD-13. |

Governance facts for X4: it needs a schema decision, it changes the IA-1 writer contract, and it intersects Q9
("the signature, raw signed payload, key identifier and verification outcome are not persisted"). Whether a result
digest counts as a Q9 artefact is not decided. IA-OD13-B §4 and §8 place schema changes outside current authority.

### Option X5 — Single-use proof (complement)

| # | Property | Content |
|---|---|---|
| 1 | Invariant | A proof authorizes at most one intake event (or one save). **On its own, this does not bind signals to the result's content.** |
| 2 | Data | A consumed flag in verifier-private in-memory state. |
| 3 | Binding created | P1 (issued unconsumed). |
| 4 | Binding checked | P3, marked consumed on acceptance. The order relative to the OD-8 transaction has to be defined; a transaction failure after consumption would leave the proof consumed. |
| 5 | `VerifiedProviderResult` carries it? | Yes, as private state. |
| 6 | `RecordIntentIntakeInput` changes? | No. |
| 7 | `recordIntentIntakeForOwner` changes? | Behavior only. |
| 8 | `intentSignal` / source records change? | No. |
| 9 | Schema / migrations | None (in memory only; resets per process). |
| 10 | IA-1 writer contract | Unchanged. It interacts with the OD-12 no-retry behavior, because a caller cannot re-submit the same proof after a failed transaction. |
| 11 | Tests | Second use refused. Behavior after a transaction failure. Existing worker replay tests (`source adapter: replaying the same normalized event`) would need a fresh proof per call. |
| 12 | Trust assumptions | In-process state only. It does not survive restarts and is not a replay store. |
| 13 | Failure | Refused at P3; the field / reason is to be decided. |
| 14 | Runtime wiring | Remains blocked by OD-13. |

Governance fact for X5: IA-OD13-B §5 excludes "adding replay storage or replay protection beyond the already-decided
behavior", and OD-12 item 3 accepts duplicate persistence. Whether in-memory single use falls under that exclusion is
not decided.

---

## 4. Sub-choices common to the options [OPEN]

| # | Question | Notes |
|---|---|---|
| Q-X1 | **Comparison scope.** FIRST_PARTY entries only, or also the event's PUBLIC_INTENT entries, or also `companyName` / `website`? | The requirement names FIRST_PARTY signals. PUBLIC_INTENT items from the same result are outside OD-13 (Q12). Company identity determines the Company / Prospect the FIRST_PARTY row attaches to. |
| Q-X2 | **Matching fields.** Which entry fields must match: `field`, `quote`, `sourceUrl`, `sourceLabel`, `observedAt`, `authorizationEvidence` (all five values)? | All are deterministic outputs of the P2 mapping. `sourceLabel` is derived from family and type rather than supplied by the integration. |
| Q-X3 | **Multiplicity and order.** An exact ordered sequence, a multiset, or a subset (can a caller save fewer FIRST_PARTY signals than the result carries)? | A result may contain identical `SUPPLIED_TO_US` items. The intake preserves input order. |
| Q-X4 | **Receipt time for re-derivation (X1).** Use the proof's `receivedAt` or P3's `now` for the OD-2 check and the observed-time checks? | Using P3's `now` can refuse a result whose 90-day authorization window closed between receipt and save. Using `receivedAt` reproduces the P2 outcome exactly. OD-2 itself is unchanged either way. |
| Q-X5 | **One proof, several normalizations (X2).** Is repeated P2 normalization of one proof (for example with a different `searchId`) allowed, and does each produce its own recorded derivation? | `searchId` is not part of the verified result. |
| Q-X6 | **Failure field / reason naming** for a binding mismatch. | Must follow OD-11 item 3: identifier, field and reason only, never the value. |
| Q-X7 | **Save-time check or also a durable record.** Is enforcement at the save boundary enough, or must the binding be recoverable from the database later? | Only X4 provides a durable record, and it needs a schema decision. The requirement text ("every … signal saved must be bound") does not settle this. |

---

## 5. What stays unchanged under every option

- OD-1 to OD-13, INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (Option B, Ed25519, exact bytes, the 5-minute window, no
  nonce store, per-result rejection without halt, no retention, envelope-only version), IA-1, IA-2, DP-1, DOC-1,
  IA-OD13-B.
- One provider call per acquisition event; no automatic retry; no runtime key fetch; public keys only.
- The OD-13 runtime gate: no runtime caller may feed FIRST_PARTY results into saving until an integration is named,
  its key is registered and runtime wiring is authorized, each separately. **Exact-result binding does not lift the gate.**

---

## 6. Product Owner decision form

| Item | Decision |
|---|---|
| Mechanism (X1 / X2 / X3 / X4 / other; X5 as a complement or not) | PENDING |
| Q-X1 to Q-X7 | PENDING |
| Implementation authorization | NONE; requires a separate authorization |

---

## 7. Final state

```text
Product Owner requirement: DECIDED
Implementation mechanism: PENDING
Implementation authority: NONE
Current exact-result binding: NOT PRESENT (save boundary binds by integration ID only)
OD-13 runtime gate: IN FORCE
```

## 8. Execution counters (this record)

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
```

**INTENT-INTAKE-OD13-EXACT-BINDING-PREP-001 — REQUIREMENT DECIDED — MECHANISM PENDING — NO IMPLEMENTATION AUTHORITY**
