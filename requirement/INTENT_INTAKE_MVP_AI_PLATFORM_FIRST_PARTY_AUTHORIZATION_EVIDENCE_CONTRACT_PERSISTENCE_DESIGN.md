# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — Provider-Contract and Persistence Design (New Rows)

**Record ID:** INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001
**Status:** **DECIDED — OD-1 TO OD-13 (revision 2, 2026-09-30, delegated Product Owner authority; see §14) —
IMPLEMENTATION NOT AUTHORIZED.** Revision 1 status: PROPOSED / PENDING PRODUCT OWNER DECISION. §1–§13 are the
revision 1 analyst text, retained unchanged for traceability; the Product Owner decisions are in §14 only.
**Type:** design analysis only. It is not a decision record and not a preparation form. It records no Product Owner
decision.
**Date:** 2026-09-30
**Author role:** engineering analyst. Every proposal is labelled **ANALYST-PROPOSED**.

> **This document is design analysis only. It does not authorize implementation, provider-contract changes,
> persistence changes, migrations, database writes, production execution, validation sessions, provider calls, or
> external HTTP requests.** Implementation requires a separate Product Owner decision and authorization.

Three labels are used throughout:

- **[FACT]** — established by repository evidence, cited by file and line.
- **[ANALYST-PROPOSED]** — a design proposal. It has no authority until a Product Owner decides it.
- **[NOT SUPPLIED]** — neither the repository nor any record establishes it. It needs a governed decision.

---

## §1 Baseline and Evidence

### 1.1 Repository state (verified before writing)

| Item | Value | Result |
|---|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches every prior DEC-005 record |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | unchanged — no tracked implementation change |
| Staged files | 0 | — |
| Working tree | 214 uncommitted entries before this document | recorded |
| Migration 0030 `migration.sql` | sha256 `3dc76684e0b363eb…` | = IMPL-REC-001 |
| Validation DB (5434) | not connected by this task | 0029 + 0030 applied per EXEC-REC-001 |

### 1.2 Records consulted (sha256, first 16)

| Record | sha256 |
|---|---|
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320` |
| DEC-003 preparation | `cc2107b5d976b0a8` |
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c` |
| DEC-004 preparation | `cbd5674abb2ae678` |
| INTENT-INTAKE-PO-DEC-005 (Option C) | `0da5daed74ed9812` |
| DEC-005 preparation | `61e9373add967437` |
| INTENT-INTAKE-PO-DEC-005-SCHEMA (rev. 2) | `078f46834497ba70` |
| DEC-005 §5.4 preparation | `8d789550fe01683b` |
| INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ | `572359a848cc7170` |
| INTENT-INTAKE-DEC-005-IMPL-REC-001 | `625fe44151e2ddda` |
| INTENT-INTAKE-DEC-005-EXEC-REC-001 | `1c22782c38135962` |

All are unchanged by this task.

### 1.3 Implementation state [FACT]

- **Schema:** `research_signals` has six nullable columns (`business_id`, `auth_status`, `auth_scope`,
  `auth_timestamp`, `integration_id`, `revoked_at`) and the index `research_signals_business_id_auth_status_idx`. The
  trigger `research_signals_authorization_evidence_frozen` blocks any UPDATE that changes one of the five evidence
  fields, including NULL → value (migration 0030).
- **Application code:** no code reads or writes these columns (DEC-005 C3).
- **Validation database:** 0 FIRST_PARTY rows (EXEC-REC-001 §4).

### 1.4 Evidence-backed findings [FACT]

- **F1 — the intake path has no runtime caller.** `recordIntentIntakeForOwner` / `recordIntentSignalForOwner` are
  defined in `apps/worker/src/searchWorker/intentIntake.ts` and re-exported from `apps/worker/src/searchWorker/index.ts:9–10`.
  `normalizeProviderResult` / `normalizeProviderBatch` / `normalizeIntentEvent` are exported from
  `packages/core-research/src/index.ts:203, 235–236`. No non-test code calls any of them: the worker entrypoint
  (`apps/worker/src/index.ts`) and the web app wire none of them. So no FIRST_PARTY row can be produced at runtime
  today.
- **F2 — `saveSignals` callers.** `service.ts:135` (Research) and `intentIntake.ts:105` (intake).
  `createPgResearchSignalRepository` is built on a shared `pg` Pool in `apps/worker/src/index.ts:124` and
  `apps/web/src/server/clientFinderRepositories.ts:28`.
- **F3 — no transaction in this persistence path.** `SqlExecutor` exposes only `query()`
  (`packages/core-entitlements/src/pgRepository.ts:15–20`). `saveSignals` issues the signal INSERT and each source
  INSERT as separate statements (`packages/core-research/src/pgRepository.ts:71–100`).
  - **Precedent elsewhere:** a transaction runner exists in another package: `createWebhookTransactionRunner` pins one
    connection and runs BEGIN / COMMIT / ROLLBACK (`packages/core-payments/src/webhookPgStore.ts:63–80`), with a
    `transaction(fn)` dependency in `webhookHandler.ts:113–114`. `packages/core-reconciliation/src/detection.ts:294–301`
    does the same inline.
  - **Not in core-research:** there is no shared Unit-of-Work abstraction and nothing in `core-research`.
- **F4 — a logger exists, but no rejection audit.**
  - `packages/observability/src/index.ts` exports a `Logger` (`info` / `warn` / `error`), a console-based JSON
    emitter that runs every `meta` object through `redact()`. It describes itself as having structured output still
    outstanding. The Search worker uses `console.log` (`apps/worker/src/searchWorker/worker.ts:377`).
  - The only persisted rejection table in the schema is `webhook_rejections` (0007), which is payments-specific.
  - No mechanism records rejected intake events.
- **F5 — contract identifiers.**
  - Every provider result requires `externalId` (`checkCommon`, `intentSourceProviderContract.ts:325–333`). For
    AI-platform results it becomes `integrationEventId` → `IntentSourceIdentity.externalId`.
  - `normalizeIntentEvent` derives a deterministic `eventId` (sha256 over source content; `intentSource.ts:352–359`).
  - **No version field** exists in the contract, adapter or intent-source modules. **No revocation or expiry field**
    exists in them either.
- **F6 — two candidate integration identities.** `ProviderResultProvenance.integration` ("Opaque integration label",
  required, `:58–63, 306–311`) and `AiPlatformAuthorization.integrationId` (required only when `authorization` is
  present, `:107–111, 424–428`). No record establishes which is canonical or that they must agree.
- **F7 — business identity.**
  - **What the provider supplies:** `ProviderBusinessIdentity = { name, website }` (`:65–69`).
  - **How it is used:** identity is resolved into a Company through `normalizeCandidate` + `findOrCreateByDomain`
    (`intentIntake.ts:87–96`).
  - **What `companies.id` is:** `companies.id` is `gen_random_uuid()::text`, unique per `(user_id,
    normalized_domain)` (`packages/core-discovery/src/pgRepository.ts:41–44`; 0015). It is system-generated and scoped
    to one user.
  - **No upstream identifier:** there is no integration-supplied business identifier anywhere.
- **F8 — no stored authorization metadata or vocabulary.** No component persists any authorization metadata. No
  `auth_status`, scope or timestamp vocabulary or field exists anywhere in the repository (PREREQ R4–R6).

### 1.5 Governing requirements [FACT, verbatim sources]

- **DEC-003 §2:**
  - answer 1, "Explicit evidence from the upstream integration that the business authorized sharing/use of the signal
    for acquisition";
  - answer 2, "Per business and per integration";
  - answer 3, "Business identifier, authorization status, authorization scope, authorization timestamp, and integration
    identifier";
  - **answer 4, "Reject the signal"** (when authorization metadata is `MISSING`);
  - answer 5, revocable with expiry / review;
  - answer 6, retain evidence of who / what / when / which integration;
  - answer 7, "Same rule for all AI-platform sources";
  - answer 8, "applies only to FIRST_PARTY; PUBLIC_INTENT is unaffected".
  - **Scope:** FIRST_PARTY signals in the `AI_PLATFORM_ACQUISITION` family (DEC-003 §1).
- **DEC-004:** 1-B (fields on the existing provenance tables); 1.3 Immutable = yes; 2-A "who" = the business / legal
  entity; 3.3-a revocation event through the provider contract; 3.5-a stored signals retained unchanged.
- **DEC-005 / SCHEMA / PREREQ:**
  - `research_signals` only;
  - the six columns are nullable;
  - no conditional NOT NULL, CHECK, enum or FK;
  - immutability of the five fields, with `revoked_at` and `superseded_at` excluded;
  - `revoked_at` is not written retroactively;
  - no synthetic values;
  - no provider-contract change authorized.

### 1.6 Unresolved gaps

See §10. In summary, the repository establishes no source for business identifier, authorization status,
authorization scope or authorization timestamp. The canonical integration identifier is not established.

## §2 Current Authorization Flow [FACT]

```text
AiPlatformProviderSignal (contract)            intentSourceProviderContract.ts:126–137
  .authorization: { integrationId, basis, reference } | null
        │
        ▼ normalizeProviderResult → prepare → prepareAiPlatform        :533, 507, 405
        │   checkCommon: externalId, capturedAt, provenance{integration,retrieval}
        │   if authorization present: requireText(integrationId), requireText(basis)   :424–428
        │   if authorization null: NO rejection                                         (L0)
        │   no business identity → UNATTRIBUTED (skip)                                  :429–433
        │
        ▼ raw: AiPlatformAcquisitionRecord — built WITHOUT `authorization`             :434–446  (L1)
        │   notes.authorization = 'PRESENT' | 'MISSING' (returned in outcome only)    :455–458  (L2)
        │
        ▼ aiPlatformAcquisitionAdapter.normalize                intentSourceAdapters.ts:91–110
        │   interests[].disclosure → signal candidate
        │
        ▼ normalizeIntentEvent                                  intentSource.ts:254–
        │   kind = DISCLOSURE_KIND[disclosure]: SUPPLIED_TO_US → FIRST_PARTY, PUBLISHED → PUBLIC_INTENT  :72–75, 314
        │   intake: RecordIntentIntakeInput — no authorization, no source family       :309–321  (L3)
        │
        ▼ recordIntentIntakeForOwner (NO RUNTIME CALLER, F1)    intentIntake.ts:75
        │   toIntentIntakeInput → toIntentSignalInput: kind is CALLER-SUPPLIED          intentSignal.ts:139–146
        │   NewResearchSignalInput — no evidence fields                                 types.ts:25–38     (L4)
        │   Company / Prospect find-or-create, then saveSignals once per signal        intentIntake.ts:96–107
        │
        ▼ saveSignals — INSERT column list excludes the 0030 columns                    pgRepository.ts:73–75 (L5)
            separate INSERT per source row; no transaction                              pgRepository.ts:91–99
```

**Where the evidence is lost:**
- **L0:** a missing authorization object is not rejected.
- **L1:** the authorization object is discarded before the adapter.
- **L2:** only a presence flag survives, and nothing persists it.
- **L3 and L4:** there is no carrier for evidence or source family.
- **L5:** the columns are never written.

## §3 FIRST_PARTY Eligibility

### 3.1 What the repository establishes [FACT]

- FIRST_PARTY is the kind for disclosure `SUPPLIED_TO_US` (`intentSource.ts:65–75`).
- Only `AI_PLATFORM_ACQUISITION` may disclose `SUPPLIED_TO_US`. `PUBLIC_WEB_SEARCH` and `PUBLIC_INTENT_NOTICE` are
  `PUBLISHED`-only (`:77–81`), and `normalizeIntentEvent` rejects any other disclosure (`:295–301`).
- One AI-platform event may carry both disclosures, so it can yield both PUBLIC_INTENT and FIRST_PARTY signals.
- The authorization object is per provider result (per event), not per signal.

### 3.2 The gap

- **G-1 — direct `kind` bypass.** `RecordIntentIntakeInput` / `RecordIntentSignalInput` accept `kind:
  'FIRST_PARTY'` from the caller (`intentSignal.ts:61–73, 139–146`). A caller of `recordIntentIntakeForOwner` can
  persist FIRST_PARTY without the provider contract, the AI-platform family or any authorization. The documented
  example label is "Landing-page form" (`:70`).
- **G-2 — no source family on the row.** The persisted row does not record the source family. Only the free-text
  `research_signal_sources.source_label` hints at it. At the persistence boundary, "AI-platform FIRST_PARTY" cannot be
  told apart from "directly supplied FIRST_PARTY".
- **G-3 — `authorization: null` is accepted.** A null authorization still yields a FIRST_PARTY signal (§2, L0). This
  contradicts DEC-003 answer 4 once implemented.

### 3.3 Eligibility rule [ANALYST-PROPOSED]

- **E-1:** a new FIRST_PARTY signal is eligible for persistence only if it arrives through
  `normalizeProviderResult` from an `AI_PLATFORM_ACQUISITION` result carrying complete authorization evidence (§4).
- **E-2:** PUBLIC_INTENT signals, including PUBLISHED signals inside an AI-platform event, carry no evidence. Their
  evidence columns stay NULL and their behavior is unchanged.
- **E-3:** non-AI-platform families are unchanged; they cannot produce FIRST_PARTY (§3.1).
- **E-4:** whether FIRST_PARTY may still enter through the direct `kind` path (G-1), and under what evidence, is **not
  established**. DEC-003 governs only the AI-platform family. **Open decision OD-7.**

## §4 Provider Contract Changes

| Field | Current source | Required source (governing) | Repository-supported? | Contract change required? | Status |
|---|---|---|---|---|---|
| `business_id` | None. Only `{name, website}` (F7); `companies.id` is system-generated and per-user | Integration-supplied identifier of the authorizing business (DEC-003 ans. 1, 3; DEC-004 2-A) | **No** | **Yes** — new field | **BUSINESS_ID SOURCE: NOT ESTABLISHED — REQUIRES SEPARATE DESIGN / CONTRACT DECISION** |
| `auth_status` | None. `notes.authorization` is a presence flag, not a status (§2 L2) | Integration-supplied authorization status (DEC-003 ans. 3) | **No** | **Yes** — new field | **AUTH_STATUS VOCABULARY: NOT SUPPLIED / REQUIRES SEPARATE GOVERNED DECISION** |
| `auth_scope` | None. `authorization.basis` exists, but that basis = scope is not established (DEC-005 §5.4 prep §2.4) | Integration-supplied authorization scope (DEC-003 ans. 3) | **No** | **Yes** — new field, or a PO decision that `basis` is the scope | **NOT SUPPLIED** — meaning and representation need a decision |
| `auth_timestamp` | None. `capturedAt` (capture time) and `observedAt` (statement time) are not authorization time (§5.4 prep §2.5) | Integration-supplied time of authorization (DEC-003 ans. 3, 6 "when") | **No** | **Yes** — new field | **NOT SUPPLIED** — canonical source needs a decision |
| `integration_id` | `authorization.integrationId` (string, required when the object is present); also `provenance.integration` (opaque label, always required) (F6) | Integration identifier (DEC-003 ans. 3) | **Partly** — the field exists but the object is optional | **Yes** — make it mandatory for FIRST_PARTY and state which field is canonical | **Canonical field NOT ESTABLISHED.** [ANALYST-PROPOSED] use `authorization.integrationId`, since DEC-003 lists it as authorization metadata |

- **Derivation:** none of the five may be derived.
  - `companies.id` is not upstream evidence and is user-scoped.
  - `capturedAt` / `observedAt` are different events.
  - `notes.authorization` is a flag.

  Deriving any value would be application-derived or inferred, which DEC-003 answer 1 ("explicit evidence from the
  upstream integration") excludes.
- **Other contract points:**
  - **Version:** none exists (F5). **[NOT SUPPLIED]**
  - **Correlation:** `externalId` (required) and the deterministic `eventId` exist and can correlate evidence to an
    event (F5).
  - **`basis` / `reference`:** these have no column in the DEC-005 schema. Whether they are retained is **not
    established** (OD-10).
  - **Privacy screen:** new fields remain subject to `screenProviderKeys` / `checkIdentifier`. An identifier that is an
    email or phone is rejected (`:247–272`).

## §5 Persistence Design [ANALYST-PROPOSED — not implemented]

```text
1. Provider validation      prepareAiPlatform: existing checks + authorization-evidence completeness (§6)
2. Authorization validation reject the RESULT if any SUPPLIED_TO_US item exists and evidence is absent / incomplete /
                            malformed / ambiguous (DEC-003 ans. 4)
3. Normalization            carry an `authorizationEvidence` object on the raw record → adapter candidate →
                            normalizeIntentEvent attaches it ONLY to FIRST_PARTY signals; PUBLIC_INTENT signals get none
4. Business identity        Company / Prospect resolution unchanged ({name, website}); business_id is NOT taken from
                            companies.id — it is the contract's business identifier, carried unchanged
5. Signal persistence       toIntentSignalInput: FIRST_PARTY requires evidence; PUBLIC_INTENT must not carry it;
                            NewResearchSignalInput gains the five values; saveSignals writes them IN THE SAME INSERT
                            as the signal row (the only point the 0030 trigger allows)
6. Source persistence       research_signal_sources rows as today (unchanged columns)
7. Commit                   see §7 (atomicity is an open decision)
```

**Where each field is populated:** all five are bound as parameters of the single `INSERT INTO research_signals` in
`saveSignals`.
- `business_id` ← contract business identifier;
- `auth_status` ← contract status;
- `auth_scope` ← contract scope;
- `auth_timestamp` ← contract authorization time;
- `integration_id` ← the canonical contract integration identifier.

`revoked_at` is never written by this flow. `superseded_at` behavior is unchanged: `supersedePrevious` already
excludes intake kinds (`pgRepository.ts:53–62`).

## §6 Fail-Closed Behavior

**Principle [ANALYST-PROPOSED, consistent with DEC-003 ans. 4]:** a FIRST_PARTY signal is never persisted as an
apparently authorized signal when required evidence is absent, invalid, ambiguous or unverifiable.

**Rejection mechanism [FACT]:** `IntentSignalValidationError` → `REJECTED` outcome with `field` / `reason` / `message`.
One bad result does not abort a batch (`:528–568`).

**Retry [FACT]:** `automaticRetries: 0`; a manual retry is operator-initiated only (`:596–605`), for provider calls.
Persistence-retry semantics are **[NOT SUPPLIED]**. Persistence does not deduplicate events (known open question,
`:45–48`), so a retry can duplicate rows.

| Case | Persist as FIRST_PARTY? | Reject / fail | Downgrade to another kind? | Surface error | Retry | Partial row? | Basis |
|---|---|---|---|---|---|---|---|
| A. authorization object absent | No | Reject (REJECTED) | No | Yes (REJECTED outcome) | Not automatic | No — rejected before any write | **[FACT] DEC-003 ans. 4 "Reject the signal"**; the current code accepts it (G-3) |
| B. `integrationId` absent | No | Reject | No | Yes | Not automatic | No | [FACT] already rejected when the object is present (`:426`); A covers the absent-object case |
| C. status unavailable | No | Reject | No | Yes | Not automatic | No | [ANALYST-PROPOSED] ans. 3 lists status as minimum metadata; whether "partially missing" = MISSING is **OD-6** |
| D. authorization timestamp unavailable | No | Reject | No | Yes | Not automatic | No | as C |
| E. scope unavailable | No | Reject | No | Yes | Not automatic | No | as C |
| F. business identity unavailable | No | Reject (business identifier missing); name/website missing → UNATTRIBUTED skip [FACT, `:429–433`] | No | Yes | Not automatic | No | as C for `business_id` |
| G. evidence malformed (wrong type, empty, prohibited identifier) | No | Reject | No | Yes | Not automatic | No | [FACT] existing `requireText` / `checkIdentifier` pattern; extending it is [ANALYST-PROPOSED] |
| — unrecognized status value | No | Reject | No | Yes | Not automatic | No | [ANALYST-PROPOSED]; recognizing a status needs a vocabulary (**OD-1**) |
| — ambiguous (e.g. `provenance.integration` ≠ `authorization.integrationId`) | No | Reject | No | Yes | Not automatic | No | [ANALYST-PROPOSED]; the consistency rule is **OD-5** |
| — contract / version mismatch | — | — | — | — | — | — | **[NOT SUPPLIED]** — no version field (F5) |
| H. persistence failure after validation | No committed FIRST_PARTY row without evidence (evidence is in the same INSERT) | Error thrown to caller [FACT: today exceptions propagate] | No | Yes | **[NOT SUPPLIED]** | **Today: yes.** Company / Prospect / earlier signals / signal-without-sources can remain (§7) | atomicity is **OD-8** |
| I. signal row written, source INSERT fails | — | Error thrown | No | Yes | **[NOT SUPPLIED]** | **Today: yes** — a signal row without its source row | [ANALYST-PROPOSED] one transaction (§7) |

**Downgrade:** rejected in every case [ANALYST-PROPOSED]. The kind comes from the disclosure (`SUPPLIED_TO_US`), and
relabelling a supplied statement as PUBLIC_INTENT would misstate its provenance.

**Mixed events:** it is **not established** whether a failure rejects the whole event (including its PUBLISHED
signals) or only the FIRST_PARTY signals (**OD-6**). [ANALYST-PROPOSED] reject the whole result, which matches the
existing "validate every signal before any write" rule (`intentIntake.ts:21`).

## §7 Atomicity

**Current [FACT] — non-atomic at three levels:**
1. **Statement:** the signal INSERT and its source INSERTs are separate (F3).
2. **Signal:** `recordIntentIntakeForOwner` saves one signal per call (`intentIntake.ts:104–107`).
3. **Event:** Company / Prospect creation, the signals, then Research and the post-research pipeline run as separate
   writes.

All of these go through a shared Pool, with no pinned connection.

**Evidence ↔ signal row:** atomic by construction if the five values are in the signal's own INSERT (§5). A single
statement cannot commit a FIRST_PARTY row with the evidence half-written.

> **Can a FIRST_PARTY `research_signals` row exist without evidence after this design?**
> **At the database level: yes, and this is intentional** under DEC-005. The six columns are nullable, and a
> conditional NOT NULL / CHECK is expressly prohibited (DEC-005-SCHEMA Option B; DEC-005 §3.1). So only the
> application path enforces the rule. Such a row could arise from:
> - a writer bypassing that path, including the direct `kind` path (G-1) unless OD-7 closes it;
> - historical rows (none on 5434).
>
> **Through the designed application path: no.** Validation (§6) precedes the INSERT, and the evidence is bound in the
> same statement.

**Signal ↔ sources:** a FIRST_PARTY row with evidence but no source row is possible today (case I).
[ANALYST-PROPOSED] run the signal and source INSERTs in one transaction on one pinned connection, following the
existing `createWebhookTransactionRunner` precedent (F3). Whether the transaction must also cover multiple signals or
the whole event is **not established** (**OD-8**). The repository establishes no atomicity requirement for this path.

## §8 Immutability

| Field | DEC-005 immutable after INSERT? | Mechanism |
|---|---|---|
| `business_id` | Yes | trigger `research_signals_authorization_evidence_frozen` (0030) |
| `auth_status` | Yes | same |
| `auth_scope` | Yes | same |
| `auth_timestamp` | Yes | same |
| `integration_id` | Yes | same |
| `revoked_at` | **No** (excluded) | lifecycle — not written by this flow |
| `superseded_at` | **No** (excluded) | lifecycle — `supersedePrevious` unchanged |

**[FACT]** The trigger rejects NULL → value, so evidence can be set only at INSERT. The designed flow writes it only
at INSERT and never updates it.

**No bypass, no whole-row immutability, no deletion mechanism:** unchanged. **No retroactive rewriting of historical
evidence** (DEC-005-SCHEMA §11.1, §11.3).

**Corrections:** a mistaken evidence value cannot be corrected in place. Whether a correction is allowed at all (for
example, as a new row) is **[NOT SUPPLIED]**.

## §9 Existing Schema Constraints (respected)

- All six columns are nullable, with no default, CHECK, enum or FK (DEC-005 §3.1).
- No synthetic values or backfill (C1; PREREQ §5).
- No PUBLIC_INTENT change: its evidence columns stay NULL (DEC-003 ans. 8).
- No non-AI-platform persistence change.
- No provider-contract change is authorized yet (DEC-005 §5).
- `revoked_at` is not written. Revocation handling (DEC-004 3.3-a "revocation event through the provider contract")
  needs separate authorization. The contract has no revocation field (F5). Revocation belongs to a separate flow,
  outside this design.

## §10 Open Product Owner Decisions

Only questions that repository evidence cannot resolve:

| # | Decision | Why it is open |
|---|---|---|
| OD-1 | `auth_status` vocabulary, and which value(s) permit persistence (e.g. what happens if the integration reports a non-affirmative status) | No vocabulary exists (F8) |
| OD-2 | Canonical source and meaning of `auth_timestamp` (time of grant? time of last review?) | No contract field (§4) |
| OD-3 | Meaning and representation of `auth_scope`; whether `authorization.basis` is the scope | Not established (§4) |
| OD-4 | `business_id` source: a new integration-supplied business identifier in the contract | No upstream identifier; `companies.id` is unsuitable (F7) |
| OD-5 | Canonical `integration_id` (`authorization.integrationId` vs `provenance.integration`) and whether they must match | Two candidates (F6) |
| OD-6 | Partially available evidence: does missing any of the five count as "MISSING" (reject)? Does rejection cover the whole event or only its FIRST_PARTY signals? | DEC-003 ans. 4 names only `MISSING` |
| OD-7 | The direct `kind: 'FIRST_PARTY'` intake path (G-1): prohibit it, or allow it and under what evidence? | DEC-003 covers only the AI-platform family |
| OD-8 | Atomicity requirement: signal + sources in one transaction? Whole event? | Not established (§7) |
| OD-9 | Contract versioning | No version field (F5) |
| OD-10 | Retention of `basis` / `reference`, which have no DEC-005 column (retaining them would need a schema decision) | Not in DEC-005 scope |
| OD-11 | Observability: must rejected FIRST_PARTY events be logged or audited, and where? | **OBSERVABILITY MECHANISM: a redacting console `Logger` exists (F4); a rejection audit record is NOT SUPPLIED — SEPARATE DESIGN DECISION REQUIRED** |
| OD-12 | Persistence-retry semantics and duplicate handling | [NOT SUPPLIED]; persistence does not deduplicate |
| OD-13 | Provider authenticity: how an integration is verified as the authorized one | **Trust boundary gap:** `provenance.retrieval: 'AUTHORIZED_INTEGRATION'` is self-declared by the result; no authentication or signature mechanism exists in the contract |

### Security / trust boundary [FACT unless labelled]

| Concern | Layer that is authoritative today |
|---|---|
| Provider authenticity | **None established** (OD-13) |
| Contract shape | `normalizeProviderResult` (`prepare*`, `screenProviderKeys`) |
| Authorization evidence | **None.** It is recorded but "never evaluates or enforces it" (`FIRST_PARTY_CONSENT_POLICY`, `:51–56`) |
| Business identity | Contract `{name, website}` → Company via `normalizeCandidate`; no business identifier |
| Integration identity | Contract strings (F6); not verified |
| Persistence integrity | Database: 0030 trigger (immutability), existing CHECKs; application: `toIntentSignalInput` |

## §11 Recommended Next Decision

The smallest set of Product Owner decisions needed before implementation can safely start:

1. **Contract fields (OD-1, OD-2, OD-3, OD-4):** name and define the integration-supplied `business_id`,
   `auth_status` (with the permitted value or values), `auth_scope` and `auth_timestamp` in `AiPlatformAuthorization`.
   Without these the evidence cannot be populated from authoritative data, and every FIRST_PARTY result would be
   rejected under §6.
2. **Canonical integration identifier (OD-5).**
3. **Fail-closed scope (OD-6):** confirm that incomplete evidence = reject, and whether rejection covers the whole
   event.
4. **Direct FIRST_PARTY path (OD-7):** close it, or define its evidence rule.
5. **Atomicity (OD-8):** at minimum, signal plus sources in one transaction.

OD-9 to OD-13 can be decided later without blocking a first implementation, provided they are recorded as open. Any
implementation also needs its own authorization record covering the provider-contract change, which DEC-005 excludes.

## §12 Implementation boundary

This document authorizes nothing. It does not change DEC-003, DEC-004 or DEC-005. It is not a Product Owner decision.

## §13 Execution counters (this document)

```text
Files written: 1 (this document)
Production code changes: 0
Migration changes: 0
Schema changes: 0
Test changes: 0
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

**DESIGN ANALYSIS ONLY — PROPOSED / PENDING PRODUCT OWNER DECISION — NO IMPLEMENTATION AUTHORIZED**

---

## §14 Revision 2 — Product Owner Decisions on OD-1 to OD-13 (2026-09-30)

**Status:** **DECIDED — ALL THIRTEEN OPEN DECISIONS (OD-1 TO OD-13)**
**Decided by:** Product Owner, under delegated authority
**Decision authority:** delegated Product Owner authority supplied in the working session on 2026-09-30 ("You are
authorized to act as the **Product Owner on my behalf** for the open decisions **OD-1 through OD-13**"), limited to
OD-1 to OD-13 as worded in §10. No person's name is recorded.
**Decision date:** 2026-09-30
**Record before this revision:** sha256 `1e58ef85cf46e03612c43d09aeec5857170f7eab82ef593857f8ba9763fbdb0a`
(revision 1; verified before writing). §1–§13 are unchanged except the status line in the header.
**Convention followed:** amendment of the existing record with an appended revision section, as in
INTENT-INTAKE-PO-DEC-005-SCHEMA revision 2 (§11 of that record). No second decision record is created.

```text
INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 .. DECIDED (revision 2) — OD-1 … OD-13
DEC-003 / DEC-004 ....................... DECIDED — UNCHANGED
DEC-005 / DEC-005-SCHEMA / -PREREQ ...... DECIDED — UNCHANGED (nullable schema, immutability trigger, C1–C8)
IMPLEMENTATION .......................... NOT AUTHORIZED — SEPARATE AUTHORIZATION REQUIRED (§14.5)
PROVIDER-CONTRACT CHANGE ................ DESIGNED — NOT AUTHORIZED
PERSISTENCE / RUNTIME CHANGE ............ DESIGNED — NOT AUTHORIZED
RUNTIME CALLER WIRING ................... BLOCKED UNTIL OD-13 MECHANISM IS DECIDED AND IMPLEMENTED
```

### 14.1 Baseline (verified before writing)

| Item | Value | Result |
|---|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches §1.1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | matches §1.1 |
| Staged files | 0 | matches |
| Working tree | 215 uncommitted entries (214 + this document, untracked) | recorded |
| Migration 0030 `migration.sql` | `3dc76684e0b363eb…` | matches IMPL-REC-001 |
| DEC-003 / DEC-003 prep | `5d77fe841e7b6320…` / `cc2107b5d976b0a8…` | match §1.2 |
| DEC-004 / DEC-004 prep | `0991bd9df847070c…` / `cbd5674abb2ae678…` | match §1.2 |
| DEC-005 / DEC-005 prep | `0da5daed74ed9812…` / `61e9373add967437…` | match §1.2 |
| DEC-005-SCHEMA (rev. 2) / §5.4 prep | `078f46834497ba70…` / `8d789550fe01683b…` | match §1.2 |
| DEC-005-SCHEMA-PREREQ | `572359a848cc7170…` | matches §1.2 |
| IMPL-REC-001 / EXEC-REC-001 | `625fe44151e2ddda…` / `1c22782c38135962…` | match §1.2 |

The cited source lines in §1.4 and §2 were re-read and match (read-only). No database was connected.

### 14.2 Decision principles applied

Every decision below:
- keeps DEC-003 and DEC-004 unchanged and keeps DEC-005's schema (six nullable columns, no CHECK / enum / FK /
  conditional NOT NULL, immutability trigger on the five evidence fields) unchanged;
- takes every evidence value **only** from the integration, verbatim; no value is derived, defaulted, inferred or
  generated, and no Nil UUID, `companies.id`, domain, capture / observation time, `notes.authorization` flag or
  placeholder may stand in for evidence;
- prefers explicit rejection over downgrade or inference;
- leaves PUBLIC_INTENT kind, confidence, persistence and evidence columns (NULL) unchanged;
- introduces nothing the repository lacks without saying so: every new field, vocabulary, transaction mechanism or
  behavior is an **implementation requirement** for a later, separately authorized phase.

Labels used in §14.3: **Facts** (repository evidence, from §1–§10), **Analyst proposal** (revision 1 text, quoted or
summarized, no authority), **PO decision** (binding design decision), **Implementation requirement** (what a later
authorized phase must build), **Future authorization** (what still needs its own decision), **Not decided**.

### 14.3 Decisions

#### OD-1 — `auth_status` vocabulary and which value(s) permit persistence

- **Facts:** no status field or vocabulary exists (F8; PREREQ R4). `notes.authorization` is a presence flag, not a
  status (§2 L2). DEC-005 forbids a database CHECK / enum / status-vocabulary constraint. DEC-004 3.3-a: revocation is
  supplied by the integration through the provider contract.
- **Analyst proposal:** none selected; §6 proposed rejecting an unrecognized status and noted a vocabulary is needed.
- **PO decision:**
  1. A new required field `authorization.status` is added to the contract (`AiPlatformAuthorization`), supplied by
     the integration.
  2. Closed contract vocabulary: `GRANTED`, `REVOKED`, `EXPIRED`.
  3. **Only `GRANTED` permits persistence.** `REVOKED` and `EXPIRED` are recognized non-affirmative values: the
     result is rejected (reason `not-allowed`). Any other value, including empty, differently cased or padded text,
     is unrecognized: the result is rejected (reason `invalid`).
  4. `auth_status` stores the supplied value verbatim. Through the runtime path it is therefore always `GRANTED`.
  5. The vocabulary lives in application code only. No database CHECK, enum or lookup table (DEC-005 §3.1).
- **Rationale:** DEC-003 ans. 1 requires explicit evidence that the business *authorized* the use; only an
  affirmative status is that evidence. Recognizing `REVOKED` / `EXPIRED` lets a revocation reported inline by the
  integration (DEC-004 3.3-a, 3.8-a) be refused explicitly rather than as malformed input, without adding a
  revocation flow. Three values are the smallest set that distinguishes "authorized" from the two DEC-004 lifecycle
  ends.
- **Implementation requirement:** contract field, vocabulary constant, validation, verbatim mapping to `auth_status`.

#### OD-2 — Canonical source and meaning of `auth_timestamp`

- **Facts:** no contract field (§4). `capturedAt` is capture time and `observedAt` is statement time; neither is
  authorization time (DEC-005 §5.4 prep §2.5). DEC-004 3.1-a fixes authorization duration at 90 days; 3.4-a makes
  revocation effective on receipt; 3.8-a treats expiry the same as revocation (new signals refused). DEC-004 does not
  say when the 90 days start.
- **Analyst proposal:** none; listed as "time of grant? time of last review?".
- **PO decision:**
  1. A new required field `authorization.authorizedAt` (a valid `Date`) is added to the contract. It is the canonical
     and only source of `auth_timestamp`.
  2. **Meaning:** the instant at which the business granted the authorization being reported, as stated by the
     integration. A renewal by the business is a new grant with its own `authorizedAt`. It is not the capture time,
     observation time, review time or receipt time.
  3. **Validation (reject the result when violated):** must be a valid `Date`; must not be later than `capturedAt`;
     and the authorization must not be expired at intake — rejected when the normalization time (`now`, i.e. receipt
     by this system, DEC-004 3.4-a) is more than 90 days after `authorizedAt` (DEC-004 3.1-a, 3.8-a).
  4. `auth_timestamp` stores the supplied instant unchanged (`TIMESTAMP(3)`, as `observed_at` is stored today).
- **Rationale:** DEC-003 ans. 6 requires evidence of "when"; DEC-004 3.1-a needs a start point for the 90-day duration,
  and the grant time is the only one that makes the duration meaningful. Refusing an expired authorization at intake
  applies DEC-004 3.8-a to *new* signals only, uses only supplied evidence, and writes no lifecycle state.
- **Not decided here:** the quarterly review mechanism (DEC-004 3.2-a) and any expiry handling of *stored* rows. Both
  belong to the separate lifecycle flow (OD-13 does not cover them; they remain future authorization).
- **Implementation requirement:** contract field; the two checks above; mapping to `auth_timestamp`.

#### OD-3 — Meaning and representation of `auth_scope`; whether `authorization.basis` is the scope

- **Facts:** `basis` exists but is a free-text key (`FREE_TEXT_KEYS`, contract `:241`) and is not established as scope
  (DEC-005 §5.4 prep §2.4). DEC-003 ans. 1 defines the required authorization as "sharing/use of the signal for
  acquisition"; ans. 6 requires evidence of "what was authorized".
- **Analyst proposal:** new field, or a PO decision that `basis` is the scope.
- **PO decision:**
  1. **`basis` is not the scope.** It stays as it is (see OD-10).
  2. A new required field `authorization.scope` is added to the contract.
  3. Closed contract vocabulary with one permitted value: `ACQUISITION` — "the business authorized sharing and use of
     the statements it supplied, for client acquisition" (DEC-003 ans. 1). Any other value is rejected (reason
     `not-allowed` for a non-empty other value; `required` for absent / empty).
  4. `auth_scope` stores the supplied value verbatim; through the runtime path it is always `ACQUISITION`.
  5. No database constraint (DEC-005).
- **Rationale:** treating free text as scope would make "what was authorized" unevaluable, and persistence would then
  accept an authorization for a different purpose. A one-value vocabulary is the smallest representation that lets
  the system check the DEC-003 purpose. Broader scopes are not needed by any decided use.
- **Implementation requirement:** contract field, vocabulary constant, validation, mapping.

#### OD-4 — `business_id` source

- **Facts:** the provider supplies only `{name, website}` (F7). `companies.id` is `gen_random_uuid()::text`, per user,
  system-generated (F7). No upstream business identifier exists. DEC-004 2-A: "who" = the business / legal entity.
  DEC-003 ans. 2: authorization is per business and per integration.
- **Analyst proposal:** a new integration-supplied business identifier in the contract; `companies.id` unsuitable.
- **PO decision:**
  1. A new required field `authorization.businessId` is added to the contract: the integration's own opaque
     identifier of the authorizing business / legal entity (DEC-004 2-A). It is the only source of `business_id`.
  2. Stored verbatim. It must be non-empty text and passes the existing screens (`screenProviderKeys`,
     `checkIdentifier`): an email or phone value is rejected. It never identifies a person.
  3. **Prohibited as `business_id`:** `companies.id`, `prospect_id`, the website / normalized domain, the business
     name, a hash of any of these, a Nil UUID, or any system-generated value.
  4. No cross-check against `business.{name, website}` is performed or inferred. Company / Prospect resolution
     continues to use `{name, website}` unchanged.
- **Rationale:** DEC-003 ans. 1 requires evidence *from the upstream integration*; any system-side identifier would be
  application-derived and user-scoped, not evidence of who authorized.
- **Implementation requirement:** contract field, validation, mapping.

#### OD-5 — Canonical `integration_id` and whether the two candidates must match

- **Facts:** `authorization.integrationId` (required when the object is present) and `provenance.integration` (opaque
  label, always required) both exist; no record establishes which is canonical (F6). Neither is verified (§10 trust
  table).
- **Analyst proposal:** use `authorization.integrationId`; treat a mismatch as ambiguous and reject.
- **PO decision:**
  1. **`authorization.integrationId` is canonical** and the only source of `integration_id`, stored verbatim.
  2. For an AI-platform result carrying any `SUPPLIED_TO_US` item, `provenance.integration` must equal
     `authorization.integrationId` exactly (no trimming, case folding or mapping). A mismatch is ambiguous evidence:
     the result is rejected (reason `invalid`, field `authorization.integrationId`).
  3. Results without `SUPPLIED_TO_US` items are unchanged: no equality requirement is added.
- **Rationale:** DEC-003 ans. 3 lists the integration identifier as authorization metadata, so the authorization
  object is the right source. Requiring agreement prevents one result from asserting two integration identities; a
  mapping table between them would be a new, unauthorized mechanism.
- **Implementation requirement:** equality check; mapping.

#### OD-6 — Partially available evidence; scope of rejection

- **Facts:** DEC-003 ans. 4 names only `MISSING` → "Reject the signal". Rejection today is the `REJECTED` outcome,
  and one bad result does not abort a batch (`:528–568`). `normalizeIntentEvent` and intake already validate the whole
  event before any write (`intentIntake.ts:21`). One AI-platform event may carry both disclosures (§3.1).
- **Analyst proposal:** incomplete = reject; reject the whole result.
- **PO decision:**
  1. **Incomplete = MISSING.** For a result carrying any `SUPPLIED_TO_US` item, the authorization object and all five
     evidence values (`businessId`, `status`, `scope`, `authorizedAt`, `integrationId`) are required. Absent, null,
     empty, whitespace-only, wrong type, prohibited identifier, unrecognized or non-permitted value, expired
     (OD-2), or inconsistent (OD-5) evidence is treated as missing and rejected. The existing `basis` requirement
     stays (OD-10).
  2. **The whole provider result is rejected**, including its `PUBLISHED` items. Nothing from it is persisted, and it
     is returned as `REJECTED` with `field` / `reason` / `message`. Other results in the batch are unaffected.
  3. **No downgrade:** a `SUPPLIED_TO_US` item is never re-labelled `PUBLISHED` / PUBLIC_INTENT, and evidence is never
     completed from other data.
  4. **Results with no `SUPPLIED_TO_US` items are unchanged:** authorization is not required and, if present, is
     validated only as today (`integrationId`, `basis`). No evidence is attached to PUBLIC_INTENT signals; their five
     columns stay NULL.
  5. Rejection happens during normalization, before any write.
- **Rationale:** DEC-003 ans. 3 names all five as the *minimum* metadata, so a partial set is not the required
  evidence. Whole-result rejection follows the existing "validate the whole event before any write" rule and treats a
  result with defective FIRST_PARTY evidence as a defective result. It does not change what PUBLIC_INTENT means,
  scores or stores; PUBLIC_INTENT-only results behave exactly as today (DEC-003 ans. 8).
- **Implementation requirement:** completeness validation in `prepareAiPlatform` before the adapter runs.

#### OD-7 — The direct `kind: 'FIRST_PARTY'` intake path (G-1)

- **Facts:** `RecordIntentSignalInput` / `RecordIntentIntakeInput` accept `kind: 'FIRST_PARTY'` from the caller
  (`intentSignal.ts:61–73, 139–146`). The row has no source-family column (G-2). No runtime caller exists (F1). Only
  `AI_PLATFORM_ACQUISITION` can disclose `SUPPLIED_TO_US` (`intentSource.ts:77–81`). DEC-003 governs only that family.
- **Analyst proposal:** E-1 to E-3 (FIRST_PARTY eligible only via `normalizeProviderResult` from an AI-platform result
  with complete evidence); E-4 left open.
- **PO decision:**
  1. **No FIRST_PARTY signal may be persisted without the complete, validated five-field evidence, whatever path it
     arrives by.** The intake validation (`toIntentIntakeInput` / `toIntentSignalInput`) must reject a FIRST_PARTY
     signal that does not carry an evidence object satisfying OD-1 to OD-5, and must reject any evidence object on a
     PUBLIC_INTENT signal.
  2. **Source-family eligibility (E-1 to E-3 adopted):** the only sanctioned producer of FIRST_PARTY evidence is
     `normalizeProviderResult` for an `AI_PLATFORM_ACQUISITION` result; it attaches the evidence to FIRST_PARTY
     signals only. `PUBLIC_WEB_SEARCH` and `PUBLIC_INTENT_NOTICE` are unchanged and still cannot produce FIRST_PARTY.
  3. **The single-signal direct form `recordIntentSignalForOwner` rejects `kind: 'FIRST_PARTY'`.** It has no evidence
     carrier and no provider result behind it.
  4. **Non-AI-platform FIRST_PARTY sources** (e.g. the documented "Landing-page form" example) are **not permitted**
     until a separate governed decision defines their evidence rule. No such source exists at runtime today.
  5. No source-family column is added (G-2 stays; a schema change is not authorized and is not needed once every
     FIRST_PARTY row requires evidence).
- **Rationale:** the persistence boundary cannot tell AI-platform FIRST_PARTY from any other (G-2), so the only way to
  prevent an unauthorized FIRST_PARTY row through the application path is to require the evidence for every
  FIRST_PARTY. Rejecting is preferred to leaving an ungoverned bypass. There is no runtime behavior to preserve (F1).
- **Residual risk (recorded, not closed by this decision):** in-process code could construct an evidence object
  itself. This is contained by OD-13 (no runtime caller until authenticity is established) and by code review; the
  database cannot enforce it under DEC-005's nullable, constraint-free schema.
- **Implementation requirement:** evidence carrier on the intake input types; intake validation; single-signal
  rejection.

#### OD-8 — Atomicity

- **Facts:** no transaction in this path; the signal and each source are separate statements on a shared Pool (F3);
  one `saveSignals` call per signal (§7). Precedent: `createWebhookTransactionRunner` pins one connection with BEGIN /
  COMMIT / ROLLBACK (`webhookPgStore.ts:55–80`). The 0030 trigger allows evidence only at INSERT.
- **Analyst proposal:** at minimum signal + sources in one transaction; whole event left open.
- **PO decision:**
  1. **All `research_signals` rows and their `research_signal_sources` rows for one intake event are written in one
     database transaction on one pinned connection.** Any failure rolls back every signal and source row of that
     event.
  2. **Outside the transaction (unchanged):** Company and Prospect find-or-create (idempotent) and the downstream
     Research / post-research pipeline. A failure there leaves the committed signals, as today.
  3. **Evidence is written only in the signal row's own `INSERT`** — the five values are bound parameters of that
     statement. It is never written by a later `UPDATE` (the 0030 trigger would reject it). `revoked_at` is not
     written.
  4. The transaction mechanism follows the `createWebhookTransactionRunner` precedent. No new shared Unit-of-Work
     abstraction is introduced beyond what this path needs.
- **Rationale:** a FIRST_PARTY row without its source row (case I) or a half-persisted event (case H) would leave
  evidence detached from its provenance. Event-level signal atomicity costs one transaction around an existing loop,
  and makes a failed write leave no signal rows, which OD-12 relies on.
- **Implementation requirement:** transaction runner for this path; `saveSignals` (or its caller) run inside it;
  INSERT extended with the five columns.

#### OD-9 — Contract versioning

- **Facts:** no version field (F5). Results are in-process TypeScript objects supplied by callers; no wire format or
  live integration exists (F1; contract header).
- **Analyst proposal:** none (listed as non-blocking).
- **PO decision:** **no version field is introduced.** The contract change is made in place: TypeScript types expose
  the new required fields at compile time, and OD-6 fail-closed validation rejects any result that lacks them at run
  time, so an old-shape result cannot be persisted as FIRST_PARTY.
- **Rationale:** a version field would add a vocabulary and a compatibility policy with no consumer; fail-closed
  validation already gives the safety a version check would.
- **Future authorization:** if a serialized wire format or live integration is later authorized, versioning is
  decided then.

#### OD-10 — Retention of `basis` / `reference`

- **Facts:** neither has a DEC-005 column; retaining them needs a schema decision (§4). `basis` is required when the
  authorization object is present (`:427`); `reference` is optional.
- **Analyst proposal:** none.
- **PO decision:** **`basis` and `reference` are not persisted.** No schema change. `basis` remains required and
  validated as today; `reference` remains optional. Neither is mapped to any of the five columns.
- **Rationale:** DEC-003 ans. 6 (who / what / when / which integration) is met by `business_id`, `auth_scope`,
  `auth_timestamp` and `integration_id`. DEC-005 fixed the complete field set (2-D) and excludes further schema.
- **Future authorization:** any retention of `basis` / `reference` needs a separate schema decision.

#### OD-11 — Observability of rejected FIRST_PARTY events

- **Facts:** a redacting console `Logger` exists (F4); no rejection audit store; the only rejection table is
  payments-specific. DEC-004 1.2's centralized log aggregator is not established in the repository; log-aggregator
  integration is excluded by DEC-005 §5.
- **Analyst proposal:** none (flagged as a separate design decision).
- **PO decision:**
  1. Rejections are surfaced through the existing `REJECTED` outcome (`externalId`, `field`, `reason`, `message`).
     Messages name the field and rule only, never the evidence value.
  2. **No persisted rejection audit table and no log-aggregator integration** in this design.
  3. When a runtime caller is later wired (subject to OD-13), it must log each `REJECTED` AI-platform outcome through
     the existing `@acos/observability` `Logger` (redacted), with `externalId`, `field` and `reason` only — not the
     raw result.
- **Rationale:** the smallest mechanism that makes rejections visible without a new store or schema. A durable audit
  of rejections is not required by DEC-003 or DEC-004 (DEC-004 1-B covers accepted evidence).
- **Future authorization:** a persisted rejection audit or aggregator integration needs its own decision.

#### OD-12 — Persistence-retry semantics and duplicate handling

- **Facts:** `automaticRetries: 0`; manual retry is operator-initiated only (`:596–605`). Persistence does not
  deduplicate events — an existing KNOWN OPEN DESIGN QUESTION (`:45–48`); only in-batch duplicates are skipped.
- **Analyst proposal:** none.
- **PO decision:**
  1. **No automatic persistence retry.** A persistence failure is thrown to the caller. With OD-8, it leaves no
     signal or source rows for that event.
  2. **Retry is a new, operator-initiated submission** of the same provider result; it re-runs full validation,
     including the OD-2 expiry check at the new receipt time.
  3. **No persistence-level deduplication is added in this design.** In-batch deduplication (`DUPLICATE_IN_BATCH`)
     is unchanged. The pre-existing cross-batch duplicate question is **accepted as a known limitation** and is not
     widened: a duplicate FIRST_PARTY row can only carry the same integration-supplied evidence.
  4. **Corrections:** evidence on an existing row is never updated or deleted (0030 trigger; DEC-004 1.3, 3.5). A
     correction arrives only as a new provider result, which is persisted as new rows under the same rules.
- **Rationale:** consistent with the operational contract; deduplication would need a new key or constraint, which is
  a schema decision outside DEC-005.
- **Future authorization:** event deduplication remains the existing open question for a separate decision.

#### OD-13 — Provider authenticity (trust boundary)

- **Facts:** `provenance.retrieval: 'AUTHORIZED_INTEGRATION'` is self-declared; no authentication or signature
  mechanism exists in the contract (§10). No live provider is authorized (DEC-003 §6, DEC-004 §7, DEC-005 §5). No
  runtime caller exists (F1).
- **Analyst proposal:** none (flagged as a trust-boundary gap).
- **PO decision:**
  1. **Contract evidence is integration-asserted, not authenticated.** Neither `provenance.retrieval` nor any
     evidence field is treated as proof that the result came from the authorized integration.
  2. **Gate:** no runtime caller may pass `AI_PLATFORM_ACQUISITION` results containing `SUPPLIED_TO_US` items to
     `normalizeProviderResult` / intake persistence until a provider-authenticity mechanism has been separately
     decided and implemented for that integration.
  3. The contract, normalization, validation and persistence design in OD-1 to OD-12 may be implemented and tested
     with fixtures before that, once separately authorized; it does not open a runtime path.
- **Rationale:** evidence that cannot be attributed to the authorized integration is not "explicit evidence from the
  upstream integration" (DEC-003 ans. 1). Selecting an authentication mechanism depends on a live integration that is
  not authorized, so the safe design is to block the runtime path until one exists.
- **Future authorization:** the authenticity mechanism (and its decision) and any runtime-caller wiring.

### 14.4 Cross-reference: requested topics → deciding OD

| Topic | Decided in |
|---|---|
| `business_id` contract field | OD-4 |
| `auth_status` and vocabulary | OD-1 |
| `auth_scope` | OD-3 |
| `auth_timestamp` | OD-2 |
| canonical `integration_id` | OD-5 |
| incomplete / ambiguous evidence | OD-6 (with OD-5) |
| whole-event rejection | OD-6 |
| direct FIRST_PARTY caller paths; source-family eligibility | OD-7 |
| transaction boundary (signal + sources) | OD-8 |
| evidence immutability (INSERT-only, no correction in place) | OD-8 item 3, OD-12 item 4 — within DEC-005 / 0030, unchanged |
| revocation / lifecycle interaction | OD-1 (`REVOKED` / `EXPIRED` refused), OD-2 (expiry of new signals); revocation events, `revoked_at` writes, review and stored-row handling remain future authorization |
| OD-13 as defined in §10 (provider authenticity) | OD-13 |

**Resulting contract shape (design, not implemented):**

```text
AiPlatformAuthorization {
  integrationId: string          -> integration_id   (canonical; = provenance.integration when SUPPLIED_TO_US present)
  businessId:    string          -> business_id      (NEW; integration's identifier of the business / legal entity)
  status:        'GRANTED' | 'REVOKED' | 'EXPIRED'  -> auth_status   (NEW; only GRANTED persists)
  scope:         'ACQUISITION'   -> auth_scope       (NEW; only permitted value)
  authorizedAt:  Date            -> auth_timestamp   (NEW; grant time; ≤ capturedAt; ≤ 90 days before receipt)
  basis:         string          (unchanged; not persisted)
  reference:     string | null   (unchanged; not persisted)
}
Required (object and all five) when any evidence item has origin SUPPLIED_TO_US; unchanged otherwise.
```

Field names above are design decisions; the implementation must confirm they do not collide with
`PROVIDER_PROHIBITED_KEYS` / `SYSTEM_ASSIGNED_KEYS` (a read-only check at revision 2 found no collision).

### 14.5 Implementation boundary

**Decision vs. authorization.** §14.3 records design decisions only. **Nothing is implemented or authorized by this
revision.** No existing record authorizes this work: DEC-005 §5 excludes provider-contract, adapter,
`normalizeIntentEvent`, `toIntentIntakeInput` and `recordIntentIntakeForOwner` changes, and DEC-005 C3 forbids
application code reading or writing the six columns.

**Future authorization required (separately, before any implementation):**
1. an implementation authorization covering: the contract fields and vocabularies (OD-1 to OD-5); fail-closed
   validation (OD-6); the evidence carrier and intake rules (OD-7); the `saveSignals` INSERT extension and the
   transaction runner (OD-8); the rejection logging requirement where applicable (OD-11); and the tests for them. It
   must expressly lift DEC-005 C3 for this single writer path;
2. a separate decision selecting and authorizing a provider-authenticity mechanism (OD-13) before any runtime caller
   is wired;
3. separate decisions for: revocation events, `revoked_at` writes, quarterly review, stored-row expiry handling;
   retention of `basis` / `reference`; a persisted rejection audit or log-aggregator integration; event
   deduplication; contract versioning if a wire format is introduced; any non-AI-platform FIRST_PARTY source.

**Not decided by this revision:** anything outside OD-1 to OD-13, including the items in (3).

**Unchanged:** DEC-003, DEC-004, DEC-005, DEC-005-SCHEMA (rev. 2), DEC-005-SCHEMA-PREREQ, IMPL-REC-001, EXEC-REC-001;
the 0030 migration and trigger; PUBLIC_INTENT semantics; D1–D5; the privacy boundary (DEC-004 preparation §8).

### 14.6 Execution counters (this revision)

```text
Files written: 1 (this record, amended)
Production code changes: 0
Migration changes: 0
Schema changes: 0
Test changes: 0
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

**INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 REVISION 2 — OD-1 TO OD-13 DECIDED (DELEGATED PRODUCT OWNER, 2026-09-30) —
DEC-003 / DEC-004 / DEC-005 UNCHANGED — IMPLEMENTATION, PROVIDER-CONTRACT AND PERSISTENCE CHANGES NOT AUTHORIZED —
RUNTIME CALLER BLOCKED PENDING OD-13 MECHANISM**
