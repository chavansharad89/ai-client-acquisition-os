# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Provider Authenticity (OD-13 Mechanism) — Product Owner Decision Preparation and Decision

**Preparation ID:** INTENT-INTAKE-OD13-AUTHENTICITY-PREP-001
**Decision ID:** INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (revision 2 of this record; see §13)
**Decision made:** OD13-M — selection of a provider-authenticity mechanism (OD-13 item 2)
**Status:** **DECIDED — OPTION B — DESIGN DECISION ONLY — GRANTS NO EXECUTION AUTHORITY**
(revision 1, §1–§12, was "PENDING — PREPARATION ONLY"; it is preserved unchanged as analyst material except for the
§11 form, which now points to §13)
**Date:** 2026-09-30
**Governing decision:** INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 revision 2, §14.3 OD-13 (unchanged by this record)

```text
OD-13 (decided) ................. IN FORCE — UNCHANGED
OD-13 Product Owner decision .... DECIDED (OD13-M = Option B; Q1–Q12 answered, §13)
Implementation authorization .... NONE
Runtime-wiring authorization .... NONE
Provider-call authorization ..... NONE
Validation authorization ........ NONE
Deployment authorization ........ NONE
OD-13 RUNTIME GATE .............. IN FORCE (OD-13 item 2; IA-OD-WRITER-001 §4.1–4.2) until Option B is separately
                                  authorized AND implemented for a named integration
```

Sections §1–§12 are the **analyst preparation (revision 1)**. Section §13 is the **Product Owner decision
(revision 2)** and is the only binding part of this record.

Labels used in this record: **[CAPABILITY]** existing system capability; **[DECIDED]** already decided by a governing
record (quoted); **[IMPL-FACT]** implementation fact read from the repository; **[OPEN]** requires a Product Owner
decision. Options in §7 are **unranked**; letters and order are presentational only.

---

## 1. Baseline (verified before writing)

| Item | Value | Result |
|---|---|---|
| Branch | `phase-17-r34-worker-orchestration` | — |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | = IA-OD-WRITER-001-IMPL-REC-001 §1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `f94e3c0d6eb3de6fd6fde91bfdb4e90fb3f873397cb6b6cb21da508dccb4f6c2` | = IMPL-REC-001 §1 (after) |
| Staged files | 0 | matches |
| Working-tree entries | 219 (before this record) | = 217 + IMPL-REC + DP-1 preparation |
| Migration 0030 `migration.sql` | `3dc76684e0b363eb…` | unchanged |

### 1.1 Governing-record hashes (sha256)

| Record | sha256 | Result |
|---|---|---|
| INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 (OD-1..OD-13) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` | = IMPL-REC §2 |
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | read; no prior hash on file in IMPL-REC |
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | read; no prior hash on file in IMPL-REC |
| INTENT-INTAKE-PO-DEC-005 | `0da5daed74ed9812bf2add6550468f39d1abe334400d66a70603a2fd0e1938da` | = IMPL-REC §2 |
| DEC-005-SCHEMA (rev. 2) | `078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33` | = IMPL-REC §2 |
| DEC-005-SCHEMA-PREREQ | `572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca` | = IMPL-REC §2 |
| DEC-005 IMPL-REC-001 | `625fe44151e2dddabd60b583cbeb34a4142541afd64c28011f9b328f385fa711` | = IMPL-REC §2 |
| DEC-005 EXEC-REC-001 | `1c22782c381359620a2eb966cb07ec73168c146ee0cdf54220165c96d6dfcf77` | = IMPL-REC §2 |
| IA-OD-WRITER-001 (IA-1 AUTHORIZE) | `55d249a3474e8ee66fcd35096c3d1de135c7caaa7318ed4ad6448b0a1a63cd5d` | = IMPL-REC §2 |
| IA-OD-WRITER-001-IMPL-REC-001 | `9d00c78fd94115b3ae82bb0a4dae105a99d7e7951a996ef0116aa637c61b56c7` | read |
| DP-1 preparation | `22eafc7be188a51c4f9769c4e477780a7bf1fd6475eb8074cdfc5ab700c406d4` | read |

No governing record was modified by this preparation.

### 1.2 IA-1 implementation state re-verified

All writer-path files match the "after" hashes in IMPL-REC-001 §1, with two expected exceptions, both explained by
later authorized work:

| File | IMPL-REC "after" | Now | Explanation |
|---|---|---|---|
| `intentSourceProviderContract.ts` | `3c1868800a51a620` | `e47430321c3846db` | DP-1 implementation (label value + its doc comment). The pre-DP-1 snapshot hashed to `3c1868800a51a620`. |
| `intentSourceProviderContract.test.ts` | `914c6f9009178806` | `95e35ee4a4c65ecb` | DP-1 assertion. The pre-DP-1 snapshot hashed to `914c6f9009178806`. |

All other 15 listed files (incl. `tests/integration/intent-intake.integration.test.ts` = `97637977c1303581`) are
unchanged. `research-signal-authorization-evidence.integration.test.ts` now hashes `1827bde7cfa54c89` (DOC-1 header
correction; not an IMPL-REC file).

**Integration-test result (IA-2, as reported 2026-09-30):** 7 discovered / 7 executed / 7 passed / 0 failed /
0 skipped, on `127.0.0.1:5433` only. The file is unchanged since that run (hash above). It was **not re-run** for
this record: this task authorizes no database connection.

**Runtime wiring re-verified:** outside tests and fixtures, `recordIntentIntakeForOwner`, `recordIntentSignalForOwner`,
`normalizeProviderResult`, `normalizeProviderBatch`, `normalizeIntentEvent(` and
`createPgResearchSignalTransactionRunner` appear only as definitions, internal calls and re-exports
(`apps/worker/src/searchWorker/index.ts`, `packages/core-research/src/index.ts`). **No runtime caller exists.**

---

## 2. The existing OD-13 requirement [DECIDED]

Verbatim from INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 §14.3, "OD-13 — Provider authenticity (trust boundary)":

> 1. **Contract evidence is integration-asserted, not authenticated.** Neither `provenance.retrieval` nor any
>    evidence field is treated as proof that the result came from the authorized integration.
> 2. **Gate:** no runtime caller may pass `AI_PLATFORM_ACQUISITION` results containing `SUPPLIED_TO_US` items to
>    `normalizeProviderResult` / intake persistence until a provider-authenticity mechanism has been separately
>    decided and implemented for that integration.
> 3. The contract, normalization, validation and persistence design in OD-1 to OD-12 may be implemented and tested
>    with fixtures before that, once separately authorized; it does not open a runtime path.

Rationale recorded there: evidence that cannot be attributed to the authorized integration is not "explicit evidence
from the upstream integration" (DEC-003 answer 1). **Future authorization:** "the authenticity mechanism (and its
decision) and any runtime-caller wiring." §14.5 item 2 repeats: "a separate decision selecting and authorizing a
provider-authenticity mechanism (OD-13) before any runtime caller is wired".

The gate is restated in IA-OD-WRITER-001 §4.1 as: "No runtime caller may feed AI-platform results containing
FIRST_PARTY items into saving until a provider-verification mechanism has been separately decided and built."

**Observation (no interpretation made):** OD-13 item 2 names both `normalizeProviderResult` **and** intake
persistence; IA-1 §4.1 names "saving". This record treats OD-13's wording as governing. Both are preserved unchanged.

### 2.1 What is already implemented vs. what OD-13 requires

| | Writer path (IA-1, implemented) | OD-13 (not built) |
|---|---|---|
| Question answered | *Is the evidence complete and well-formed, and is it stored atomically and immutably?* | *Did this result, including its evidence, actually come unmodified from the authorized integration it names?* |
| Checks | OD-1 status vocabulary; OD-2 timestamp bounds and 90-day expiry; OD-3 scope; OD-4 business id and personal-identifier screen; OD-5 `authorization.integrationId === provenance.integration`; OD-6 whole-result rejection; OD-7 FIRST_PARTY-only carrier; OD-8 single-transaction INSERT | Origin, integrity and binding of the result to a trusted identity (§4) |
| Trust input | Values inside the result object | Something the result cannot forge (secret, key, channel, or trusted operator), per the option chosen |
| Status | Implemented, unit- and integration-tested | Undecided; nothing exists |

The writer path guarantees **shape and consistency** of evidence. It does not, and was not designed to, establish
**who produced it**.

---

## 3. Why current evidence does not establish provider authenticity [IMPL-FACT]

1. **All provenance is self-declared.** `ProviderResultProvenance { integration, retrieval }`
   (`intentSourceProviderContract.ts:66–70`) is a field of the same object it describes. `checkProvenance` (`:329–334`)
   only requires both to be non-empty text.
2. **`retrieval` is not enforced for AI-platform results.** The union type admits `'AUTHORIZED_INTEGRATION'`, but at
   runtime any non-empty string is accepted. `prepareAiPlatform` (`:446–506`) never reads `retrieval`, so a result
   stating `'FIXTURE'` is processed the same as `'AUTHORIZED_INTEGRATION'`.
3. **OD-5 compares two self-declared fields.** `requireAuthorizationEvidence` (`:433–444`) checks
   `authorization.integrationId === provenance.integration`. Both come from the result, so equality proves internal
   consistency only.
4. **No credential, secret, key or signature exists anywhere in the contract.** The module header states: "No SDK,
   credential, HTTP client or browser is imported; results are supplied by the caller (fixtures today)"
   (`:47–48`). `ProviderResultProvenance` is documented "Never a credential" (`:65`).
5. **No transport exists.** `normalizeProviderResult` (`:579–621`) accepts an in-process object with `Date` fields.
   There is no wire format, byte representation, endpoint, or client, so there is nothing that could currently carry
   or be covered by a signature. Contract versioning is undecided (OD-9: no version field; §14.5 item 3 reserves
   "contract versioning if a wire format is introduced").
6. **No registry of authorized integrations.** No configuration key, table or constant lists which integrations are
   authorized, or their trust material. `integrationId` is an opaque string.
7. **Intake accepts caller-constructed evidence.** `recordIntentIntakeForOwner`
   (`apps/worker/src/searchWorker/intentIntake.ts:87`) takes a `RecordIntentIntakeInput` whose evidence is validated
   for shape only. OD-7's recorded residual risk: "in-process code could construct an evidence object itself. This is
   contained by OD-13 (no runtime caller until authenticity is established) and by code review; the database cannot
   enforce it under DEC-005's nullable, constraint-free schema."
8. **The database cannot help.** The 0030 columns are nullable text/timestamps with no FK/CHECK (DEC-005). The
   immutability trigger prevents later modification, not an untrusted first write.

Consequence: a result fabricated in-process, replayed, or altered in transit (once a transport exists) would pass
every implemented check if its fields are well-formed and internally consistent.

---

## 4. What must be verified before a FIRST_PARTY result may reach the writer path

Items V1–V3 follow directly from OD-13 item 1 and DEC-003 answer 1 **[DECIDED]**. Items V4–V6 are candidates whose
inclusion is **[OPEN]** (§9).

| # | Property | Source |
|---|---|---|
| V1 | **Origin** — the result was produced by the integration it names | OD-13 item 1 ("came from the authorized integration") |
| V2 | **Integrity** — the result, **including the `authorization` object and every `SUPPLIED_TO_US` evidence item**, is unmodified since the integration produced it | OD-13 item 1 ("nor any evidence field is treated as proof") |
| V3 | **Binding** — the verified identity equals `provenance.integration` and `authorization.integrationId` (OD-5), so a genuine integration cannot vouch for another | OD-5 + OD-13 |
| V4 | **Authorization of the integration** — the verified integration is one the system has authorized ("for that integration", OD-13 item 2; "per integration", DEC-003 ans. 2) | [OPEN] Q2, Q3 |
| V5 | **Freshness / replay** — a genuine result is not re-submitted | [OPEN] Q5 (interacts with OD-12 item 3, accepted duplicate limitation) |
| V6 | **Evidence truth** — the business actually granted what the integration asserts | [OPEN] Q6. DEC-003 ans. 1 accepts "explicit evidence from the upstream integration"; whether authenticity must go beyond the integration's own assertion is not decided |

Placement requirement [DECIDED, OD-13 item 2]: the check must complete **before** the result is passed to
`normalizeProviderResult` / intake persistence.

---

## 5. Current architecture and candidate verification points [IMPL-FACT]

```text
(none)  ── no transport, client, endpoint, or runtime caller exists ──
   │
   ▼ P1  ingress boundary (does not exist): where bytes arrive or are fetched
   │
   ▼ P2  normalizeProviderResult / prepareAiPlatform       intentSourceProviderContract.ts:579, 446
   │       checkCommon → checkProvenance (text only)        :348, 329
   │       requireAuthorizationEvidence (OD-1..OD-6)         :433
   ▼     aiPlatformAcquisitionAdapter → normalizeIntentEvent intentSourceAdapters.ts, intentSource.ts
   │
   ▼ P3  recordIntentIntakeForOwner (validates shape only)  apps/worker/src/searchWorker/intentIntake.ts:87
   │       toIntentIntakeInput → signalTransaction → saveSignals (OD-8)
   ▼     research_signals (0030 columns, INSERT-only)
```

| Point | What exists | Relevance |
|---|---|---|
| **P1 — ingress** | Nothing for intent sources. | The only point that sees raw bytes / channel identity. Required for byte-level signatures and transport authentication. |
| **P2 — contract normalization** | Pure function; no I/O; returns `REJECTED` for validation errors. | Can check a verification *result* passed in; cannot verify bytes (it receives parsed objects). |
| **P3 — intake** | Trusted `userId` + caller-built input. | Could require proof of verification to close the OD-7 residual risk (§3 item 7); changing its signature changes the IA-1 writer path. |
| **Operational contract** | `PROVIDER_OPERATIONAL_CONTRACT` (`:644–653`): 1 provider call per acquisition event, 0 automatic retries; `AUTHENTICATION_FAILED` → `FAILED` + halt integration (`:674–682`); `createProviderCallBudget` (`:701`). | Any option that adds a call per event conflicts with `maxProviderCallsPerAcquisitionEvent: 1`. |

### 5.1 Existing capabilities that an option could reuse [CAPABILITY]

| Capability | Location | What it shows |
|---|---|---|
| HMAC-SHA256 over raw body, timing-safe compare, never throws on attacker input | `packages/core-payments/src/razorpaySignature.ts:81–127` | Verify-before-parse on exact received bytes |
| Branded `VerifiedWebhook` that only the verifier can produce ("parse first, verify later does not compile") | `packages/core-payments/src/webhook.ts:53, 103`; route `apps/web/app/api/webhooks/razorpay/route.ts:52–71` (401 on bad signature) | Type-level propagation of a verification result |
| Body-size limit (`MAX_WEBHOOK_BODY_BYTES`) | `webhook.ts:41` | Ingress hardening precedent |
| HMAC-signed, expiring grants with typed rejections (`bad-signature`, `expired`, …) | `packages/core-entitlements/src/downloadGrant.ts:56–99` | Signed claims with expiry |
| Hashed tokens, timing-safe compare, revocation verdicts | `packages/core-entitlements/src/accessToken.ts` | Revocable bearer credentials |
| Validated secret configuration (`RAZORPAY_WEBHOOK_SECRET` required, non-blank) | `packages/config/src/env.ts:28` (zod schema) | Where trust material is loaded today |
| Transaction runner pattern | `createWebhookTransactionRunner` (core-payments) → `createPgResearchSignalTransactionRunner` | Already reused by OD-8 |
| Redacting `Logger` | `@acos/observability` | OD-11 item 3 logging once a caller is wired |

No asymmetric-signature, mTLS, JWS/JWT or key-registry code exists in the repository.

---

## 6. Separation of facts and decisions

| Category | Content |
|---|---|
| **[CAPABILITY]** existing | §5.1: HMAC webhook verification with branded type; signed expiring grants; hashed revocable tokens; validated secret config; transaction runner; redacting Logger; call budget and failure handling. |
| **[DECIDED]** by OD-13 | Evidence is integration-asserted, not authenticated (item 1). No runtime caller may pass AI-platform `SUPPLIED_TO_US` results to `normalizeProviderResult` / intake persistence until a mechanism is decided **and implemented for that integration** (item 2). Fixture-based implementation/testing allowed (item 3). |
| **[DECIDED]** elsewhere, constraining any mechanism | DEC-003: per business and per integration (ans. 2); same rule for all AI-platform sources (ans. 7); retain evidence showing "through which integration" (ans. 6). Operational contract: ≤ 1 provider call per event, no automatic retry. OD-6 whole-result rejection via `REJECTED`. OD-11: `REJECTED` outcome, Logger when wired, no audit table. OD-12: no automatic retry; duplicates accepted limitation. DEC-003 §6 / DEC-004 / DEC-005 §5 privacy boundary and no live providers without authorization. DEC-005: no schema change without separate authorization. |
| **[IMPL-FACT]** | §3 items 1–8; §5 (no ingress, no wire format, no integration registry, intake accepts caller-built evidence, no runtime caller). |
| **[OPEN]** | §9 Q1–Q12, and OD13-M itself. |

---

## 7. Implementation options (unranked; none selected or recommended)

Common to every option: the gate in §10 stays in force until the chosen option is **both** decided and implemented
for a named integration; no option is approved by appearing here.

### Option A — Inbound shared-secret signature (HMAC over the raw payload)

| Aspect | Description |
|---|---|
| Verifies | V1, V2, V3 (identity = the secret's owner). V4 if secrets exist only for registered integrations. V5 only if a signed timestamp/nonce is included and checked. |
| Where | P1: a new inbound endpoint verifies the HMAC over exact received bytes **before parsing** (Razorpay precedent), then parses into `AiPlatformProviderSignal`. |
| Trusted input | A per-integration shared secret held in validated server configuration; integration registry mapping `integrationId → secret`. |
| Propagation | A branded "verified provider result" type (as `VerifiedWebhook`) carrying the verified `integrationId`, required by P2 and/or P3; mismatch with `provenance.integration` / `authorization.integrationId` → reject. |
| Failure | Bad/missing signature: reject before normalization; nothing persisted. Classification (`REJECTED` vs `FAILED`/`AUTHENTICATION_FAILED` + halt) is [OPEN] Q8. |
| Persistence / schema | None required. Recording the verification outcome or the raw signed payload would need a schema decision (Q9). |
| Extra provider calls | None (push model). |
| Security assumptions | Secret known only to the integration and this system; secret compromise allows forgery for that integration; symmetric secret means this system could also forge (non-repudiation not provided); requires a defined wire format (OD-9 / Q10). |
| Test implications | Unit tests with test secrets and signed fixtures; tamper, wrong-secret, missing-header, integration-mismatch, oversize cases; no provider needed. |
| Runtime-wiring implications | Requires a new inbound route/handler (a runtime caller) and secret configuration — both need separate authorization. |

### Option B — Inbound asymmetric signature (integration signs; system verifies with registered public key)

| Aspect | Description |
|---|---|
| Verifies | V1, V2, V3; V4 via key registry; V5 if signed timestamp/nonce; provides non-repudiation (only the integration holds the private key). |
| Where | P1, over exact received bytes (or a defined canonical form) before parsing. |
| Trusted input | Registered public key(s) per integration; a key-registration and rotation procedure. |
| Propagation | Same branded-type approach as A; optionally the signature itself retained for later re-verification. |
| Failure | As A. Unknown key id / expired key → reject. |
| Persistence / schema | None required. Retaining signature + signed bytes for audit re-verification (DEC-003 ans. 6) would need schema authorization (Q9). |
| Extra provider calls | None for verification. Fetching public keys from the integration (e.g. a key endpoint) would be an additional external call (Q7). |
| Security assumptions | Private key remains with the integration; public-key registration channel is trusted; key rotation/revocation defined; no existing asymmetric code in the repository (new dependency or `node:crypto` usage to be decided). |
| Test implications | Generated test key pairs; tamper, wrong-key, rotated-key, unknown-key cases; deterministic without network if keys are configured. |
| Runtime-wiring implications | New inbound route/handler and key configuration — separate authorization. |

### Option C — Authenticated pull from a configured integration endpoint (channel authenticity)

| Aspect | Description |
|---|---|
| Verifies | V1 via TLS server identity of a configured endpoint plus this system's credential; V3 by **stamping** `integrationId` from configuration, not from the payload; V2 in transit only (no end-to-end integrity after receipt); V4 via the configured list. |
| Where | P1 inside a new provider client that performs the fetch; the client, not the payload, sets provenance. |
| Trusted input | Configured endpoint URL(s) and this system's API credential per integration; TLS trust store. |
| Propagation | Client-constructed branded result whose integration identity comes from configuration; payload values that disagree → reject. |
| Failure | Auth errors map to existing `AUTHENTICATION_FAILED` (`FAILED`, halt); other failures per `PROVIDER_FAILURE_HANDLING`. |
| Persistence / schema | None required. |
| Extra provider calls | **Yes** — the pull itself is a provider call (within `maxProviderCallsPerAcquisitionEvent: 1` if one fetch per event). Live provider calls are not authorized by any existing record. |
| Security assumptions | Endpoint and credential not compromised; TLS correctly validated; no protection against the integration's own host serving altered data; evidence cannot be re-verified later. |
| Test implications | Fake HTTP client / injected transport; credential-failure, halt, mismatch cases; no live calls in tests. |
| Runtime-wiring implications | A scheduled/worker caller performing fetches — separate authorization; also requires a live-provider authorization. |

### Option D — Transport-level mutual TLS at ingress

| Aspect | Description |
|---|---|
| Verifies | V1 and V3 via client-certificate identity mapped to `integrationId`; V2 in transit only; V4 via certificate allow-list. |
| Where | P1 at TLS termination (infrastructure), with the verified identity forwarded to the application. |
| Trusted input | A CA or pinned client certificates per integration; infrastructure that terminates mTLS and forwards identity safely. |
| Propagation | Verified identity passed from ingress to the handler, then into a branded result as in A. |
| Failure | Connection refused at TLS layer, or handler rejects when identity header absent/mismatched. |
| Persistence / schema | None required. |
| Extra provider calls | None. |
| Security assumptions | The forwarding of identity from TLS terminator to application cannot be spoofed; deployment environment supports mTLS (not established in the repository — no such infrastructure code exists); no end-to-end integrity after termination. |
| Test implications | Application-level tests can only simulate the forwarded identity; real verification is testable only in infrastructure. |
| Runtime-wiring implications | New inbound route plus infrastructure/deployment configuration — separate authorization. |

### Option E — Out-of-band authorization confirmation with the integration

| Aspect | Description |
|---|---|
| Verifies | V1/V3 via an authenticated call to the integration's own confirmation interface for `(integrationId, businessId, status, scope, authorizedAt)`; V2 of the **authorization evidence** (not of the whole result); partially V6 (the integration re-asserts the grant at confirmation time). |
| Where | Between P1 and P2 for results containing `SUPPLIED_TO_US`. |
| Trusted input | Configured confirmation endpoint and this system's credential per integration. |
| Propagation | A confirmed-evidence marker (branded type) passed to P2/P3; non-confirmed → reject. |
| Failure | Confirmation denied → reject whole result (OD-6); confirmation unavailable → `FAILED` per operational contract; no automatic retry (OD-12). |
| Persistence / schema | None required; recording the confirmation would need schema authorization (Q9). |
| Extra provider calls | **Yes — one additional call per result** with `SUPPLIED_TO_US`. Conflicts with `maxProviderCallsPerAcquisitionEvent: 1` unless that contract is amended (Q7). |
| Security assumptions | Confirmation channel authenticated (needs C or D style trust anyway); integration exposes such an interface (unknown — no integration identified). |
| Test implications | Fake confirmation client; denied/unavailable/mismatch cases; budget-exhaustion tests. |
| Runtime-wiring implications | Caller plus live-provider authorization; operational-contract change. |

### Option F — Operator-attested import (human trust anchor)

| Aspect | Description |
|---|---|
| Verifies | V1/V3 only by an authenticated operator's attestation that the result came from the named integration; V2 from the point of import onward; no cryptographic origin proof. |
| Where | P1: an operator-only import action using existing identity/session mechanisms (`@acos/core-identity`). |
| Trusted input | Authenticated operator identity and an operator procedure for obtaining results from the integration. |
| Propagation | Branded result carrying operator attestation (who, when, which integration); required at P2/P3. |
| Failure | Missing/invalid operator session or attestation → reject; no automatic retry. |
| Persistence / schema | Recording who attested would need schema authorization (Q9); without it, attestation is not durable. |
| Extra provider calls | None by the system. |
| Security assumptions | Operator is trusted and follows procedure; does not satisfy V1/V2 cryptographically; whether this meets "explicit evidence from the upstream integration" (DEC-003 ans. 1) is a PO judgement (Q11). |
| Test implications | Session/role tests; attestation required; no network. |
| Runtime-wiring implications | New operator-facing surface (a runtime caller) — separate authorization. |

### 7.1 Cross-cutting choice present in every option [OPEN — Q4]

Where the verification result is enforced:

- **At P2 only:** `normalizeProviderResult` requires a verified input for `SUPPLIED_TO_US`; `recordIntentIntakeForOwner`
  keeps accepting caller-built evidence (OD-7 residual risk remains, contained by code review).
- **At P2 and P3:** intake also requires proof of verification (branded type), closing the residual risk; this changes
  the IA-1 writer-path signature and needs its own implementation authorization.

---

## 8. Comparison of mechanical properties (factual, not a ranking)

| | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Delivery model | push | push | pull | push | push + confirm | manual |
| Cryptographic origin proof | yes (symmetric) | yes (asymmetric) | channel only | channel only | channel only | no |
| Integrity after receipt | yes, if payload retained | yes, if payload retained | no | no | evidence only, at confirm time | no |
| Extra provider calls | 0 | 0 (or key fetch) | the pull itself | 0 | +1 per result | 0 |
| Operational-contract change | no | no | no (if 1 fetch/event) | no | yes | no |
| Needs wire format / versioning decision | yes | yes | yes | yes | yes | depends on import format |
| Existing precedent in repo | Razorpay webhook | none | none | none | none | identity/sessions |
| Schema change required | no | no | no | no | no | no (yes, if attestation must be durable) |
| New runtime caller | yes | yes | yes | yes | yes | yes |

---

## 9. Questions requiring a Product Owner decision [OPEN]

| # | Question | Why the repository cannot answer it |
|---|---|---|
| Q1 | Which delivery model applies: integration pushes, system pulls, or operator imports? | No integration exists or is authorized (DEC-003 §6, DEC-004, DEC-005 §5). |
| Q2 | Which named integration(s) is the mechanism for? OD-13 requires it "for that integration". | No integration is identified anywhere in the repository. |
| Q3 | Trust anchor custody: where secrets/keys/certificates are held, who registers an integration, rotation and revocation of trust material. | Only a single-secret env pattern exists (`packages/config`); no registry. |
| Q4 | Enforcement point: P2 only, or P2 and P3 (§7.1)? | Trade-off between closing the OD-7 residual risk and changing the IA-1 writer path. |
| Q5 | Is replay/freshness (V5) part of authenticity? If so, what maximum age? | OD-12 accepts duplicates as a known limitation; not decided for authenticity. |
| Q6 | Must authenticity go beyond the integration's own assertion (V6)? | DEC-003 ans. 1 accepts integration evidence; not decided for OD-13. |
| Q7 | Are additional provider calls acceptable (options C, E, B-key-fetch), and may `maxProviderCallsPerAcquisitionEvent` change? | Operational contract fixes 1 call per event. |
| Q8 | Classification of an authenticity failure: `REJECTED` (per result, OD-6/OD-11 style) or `FAILED` with integration halt (`AUTHENTICATION_FAILED`)? | Both exist; neither is assigned to authenticity. |
| Q9 | Must the verification outcome, signature, raw payload or attestation be retained? | Requires a schema decision (DEC-005 restrictions); DEC-003 ans. 6 names integration only. |
| Q10 | Wire format and contract versioning for signed payloads. | OD-9: no version field; §14.5 item 3 reserves versioning "if a wire format is introduced". |
| Q11 | Does an operator attestation (option F) satisfy "explicit evidence from the upstream integration"? | Policy judgement. |
| Q12 | Do AI-platform results with **only** `PUBLISHED` items need authenticity? | OD-13 item 2 gates only results containing `SUPPLIED_TO_US`; silent on PUBLISHED-only. |

---

## 10. OD-13 gate — preserved

**No runtime caller may feed AI-platform results containing FIRST_PARTY (`SUPPLIED_TO_US`) items into
`normalizeProviderResult` or intake saving until a provider-authenticity mechanism has been separately decided and
built for that integration.**

This preparation record:

- does not change OD-13, OD-1..OD-12, IA-1, DP-1 (`FIRST_PARTY_CONSENT_POLICY = 'AUTHORIZATION_EVIDENCE_REQUIRED'`),
  DOC-1, IA-2, DEC-003, DEC-004 or DEC-005;
- does not select, rank or recommend an option, and no option is approved by being listed;
- does not authorize implementation, runtime wiring, provider calls, credentials, configuration, schema changes,
  validation, participant contact, deployment or commits.

Selecting OD13-M would decide the mechanism only. Implementing it, configuring trust material, and wiring any runtime
caller would each need separate authorization.

---

## 11. Product Owner decision form

```text
OD13-M — Provider-authenticity mechanism
Selected option: B   (A / B / C / D / E / F / Other: ______ / Defer)
Answers to §9: Q1 push  Q2 all AI-platform integrations, per named integration  Q3 §13.3  Q4 P2+P3
               Q5 yes, 5 min  Q6 no  Q7 no  Q8 REJECTED, no halt  Q9 no  Q10 §13.3  Q11 no  Q12 no
Decision date: 2026-09-30
Decision maker: Product Owner (decision authority delegated in the working session of 2026-09-30)
Notes: full answers, rationale, assumptions and implementation constraints in §13.
```

---

## 12. Execution counters (this record)

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

**INTENT-INTAKE-OD13-AUTHENTICITY-PREP-001 — PREPARATION ONLY — OD-13 GATE IN FORCE — NO OPTION SELECTED — NO
EXECUTION AUTHORITY** *(revision 1 closing line, preserved; superseded by §13 for decision status only)*

---

## 13. Revision 2 — Product Owner Decision (OD13-M and Q1–Q12)

**Decision ID:** INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001
**Decision date:** 2026-09-30
**Decision maker:** Product Owner (decision authority for Q1–Q12 and the Option A–F selection delegated in the working
session of 2026-09-30; decision authority only)
**Scope:** the policy / design question of OD-13 item 2 only. Everything in §1–§12 is analyst material and is not
modified by this section, except the §11 form now points here.

### 13.1 Baseline re-verified before deciding

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = §1 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `f94e3c0d6eb3de6fd6fde91bfdb4e90fb3f873397cb6b6cb21da508dccb4f6c2` | = §1 (unchanged) |
| Staged files | 0 | = §1 |
| Working-tree entries | 220 | = 219 (§1) + this record |
| Migration 0030 `migration.sql` | `3dc76684e0b363ebae5aed9a258b2526bcbe42c95432ed503453f17878b529f8` | = §1 prefix |
| This record before revision 2 | `32591df7c9d156fef829050c3e23e6055da711ffd02292050d9f46e1d9905e40` | — |
| All 11 governing records in §1.1 | sha256 recomputed | all match §1.1 |

Architecture re-checked (read-only): `FIRST_PARTY_CONSENT_POLICY = 'AUTHORIZATION_EVIDENCE_REQUIRED'`
(`intentSourceProviderContract.ts:63`); `retrieval` still text-checked only (`:333`); `normalizeProviderResult`
(`:579`) and `recordIntentIntakeForOwner` (`intentIntake.ts:87`) have no runtime caller outside tests (only the
internal calls at `:630` and `intentIntake.ts:158`); `maxProviderCallsPerAcquisitionEvent: 1` (`:646`);
`AUTHENTICATION_FAILED` → `FAILED` + halt (`:677`); Razorpay verify-before-parse precedent
(`razorpaySignature.ts:81`, `webhook.ts:53`). §3 and §5 remain accurate.

### 13.2 Selected authenticity mechanism

**OD13-M = Option B — Inbound asymmetric signature.** Each authorized AI-platform integration signs each result it
pushes with a private key that only the integration holds; this system verifies the signature over the exact received
bytes, **before parsing**, using a public key registered for that integration, and binds the verified identity to
`provenance.integration` and `authorization.integrationId`.

**Rationale:**
1. **It is the only option that makes the evidence attributable to the integration rather than to this system.**
   OD-13 item 1 exists because evidence that cannot be attributed to the integration is not "explicit evidence from
   the upstream integration" (DEC-003 ans. 1). Under Option B this system holds no material capable of producing a
   valid signature, so in-process code — the OD-7 residual risk (§3 item 7) — cannot fabricate an authenticated
   result. Option A's shared secret is held by this system and so leaves that risk open.
2. **It verifies V1–V3 end to end** (origin, integrity including the `authorization` object and every
   `SUPPLIED_TO_US` item, binding), whereas C and D prove only the channel and lose integrity at termination, and F
   provides no cryptographic origin (Q11).
3. **It fits the decided operational rules without amending them:** no additional provider call (Q7), push delivery
   consistent with DEC-004 3.3-a (revocation events supplied by the integration through the provider contract),
   whole-result rejection before any write (OD-6), no automatic retry (OD-12), and no schema change (DEC-005).
4. **It applies one rule to every AI-platform integration** (DEC-003 ans. 7) while keeping trust material per
   integration (DEC-003 ans. 2).

**Options not selected** (preserved in §7, not ranked): A, C, D, E, F. E is additionally excluded by Q7; F by Q11.

### 13.3 Answers to Q1–Q12

| # | Product Owner answer | Rationale |
|---|---|---|
| **Q1** Delivery model | **Integration pushes.** Results reach this system only by the integration pushing signed payloads to an inbound ingress (P1). No pull and no operator import for FIRST_PARTY results. | Push is the only model under which the integration can sign what it sends and this system needs no outbound provider call; it matches DEC-004 3.3-a. Pull (C) adds live provider calls and proves only the channel; operator import is excluded by Q11. |
| **Q2** Which integration(s) | **All `AI_PLATFORM_ACQUISITION` integrations, under one mechanism, instantiated per named integration.** No integration is named by this decision. The OD-13 gate lifts only for an integration that (a) has been named and authorized by a separate decision and (b) has Option B implemented and its public key registered. Until then the gate applies to every integration. | DEC-003 ans. 7 (same rule for all AI-platform sources) and ans. 2 (per integration); OD-13 item 2 ("for that integration"). No integration exists or is authorized (DEC-003 §6, DEC-004 §7, DEC-005 §5), so naming one would exceed the evidence. |
| **Q3** Trust-anchor custody, registration, rotation, revocation | (a) **Custody:** the integration alone holds its private key; this system holds **public keys only** and never receives, generates or stores an integration's private key. (b) **Registry:** each public key is registered against exactly one `integrationId` with a key identifier and a validity window, held in validated server configuration (the `packages/config` pattern); no database table. (c) **Registration:** only on Product Owner authorization of the named integration, with the key received through an authenticated out-of-band channel with the integration; never fetched at runtime. (d) **Rotation:** more than one key per integration may be valid at once so keys can be rotated without downtime; each signature names its key identifier. (e) **Revocation of trust material:** removing a key, or reaching its validity end, stops acceptance of signatures by that key from that moment; on suspected key compromise the key is removed and the integration's results are refused until a new key is registered. | Public-key-only custody is what gives Option B its value (§13.2 rationale 1). Configuration custody follows the only existing precedent and avoids a schema change (DEC-005). Out-of-band registration keeps the trust anchor outside the payload. |
| **Q4** Enforcement point | **P2 and P3.** `normalizeProviderResult` must require a verified result for any AI-platform result containing `SUPPLIED_TO_US`, and intake (`recordIntentIntakeForOwner`) must require proof of verification for any FIRST_PARTY signal. Proof is a branded "verified provider result" type that only the verifier can produce (the `VerifiedWebhook` precedent). | OD-13 item 2 gates both `normalizeProviderResult` **and** intake persistence (§2 observation), and only P3 enforcement closes the OD-7 residual risk. The P3 requirement is an **additional precondition in front of** the IA-1 writer path; it does not change any OD-1–OD-12 check, rejection, transaction or retry behavior, and it is built only under a future implementation authorization. |
| **Q5** Replay / freshness (V5) | **Yes, freshness is part of authenticity.** The signed content must include a signing timestamp; a result is refused if that timestamp is more than **5 minutes** before or after receipt. **No nonce / replay store** is introduced. A replay of a genuine result within the window is an accepted limitation, consistent with OD-12 item 3. | A freshness window blocks stale replays with no persistence. A nonce store would be a deduplication mechanism, which OD-12 leaves undecided and which would need a schema decision. This window is independent of, and does not alter, OD-2's 90-day `authorizedAt` bound. |
| **Q6** Evidence truth (V6) | **No.** Authenticity establishes that the result, including its evidence, came unmodified from the named integration. Whether the business actually granted what the integration asserts remains the integration's assertion. | DEC-003 ans. 1 sets the standard as explicit evidence *from the upstream integration*; going further would change DEC-003. |
| **Q7** Additional provider calls | **No.** Verification makes no provider call; public keys are never fetched from the integration at runtime. `maxProviderCallsPerAcquisitionEvent` stays **1** and the operational contract is unchanged. | The operational contract is decided; Option B needs no call. This also excludes Option E. |
| **Q8** Failure classification | **`REJECTED`, per result, with no integration halt.** Missing / malformed / invalid signature, unknown key identifier, key outside its validity window, integration not registered, signing timestamp outside the Q5 window, verified identity ≠ `provenance.integration` or ≠ `authorization.integrationId`, or unknown envelope version → the whole result is refused **before parsing / normalization**, nothing is persisted, other results are unaffected, no automatic retry. When a caller is wired, each refusal is logged through the redacted `@acos/observability` Logger with identifier, field and reason only (OD-11 item 3). `AUTHENTICATION_FAILED` (`FAILED` + halt) keeps its existing meaning for this system's own outbound credential failures and is not used for inbound authenticity. | Inbound signature failures can be triggered by any sender; halting the integration on them would let an unauthenticated party stop a genuine integration. Per-result rejection matches OD-6 and OD-11; no retry matches OD-12. OD-6 rejection rules themselves are unchanged — this refusal happens before them. |
| **Q9** Retention of verification artefacts | **No.** The signature, raw signed payload, key identifier and verification outcome are not persisted. No schema change. | DEC-003 ans. 6 ("through which integration") is met by `integration_id`, which Option B now binds to a verified identity. DEC-005 fixes the column set; OD-10 precedent. Any later retention needs a separate schema decision. |
| **Q10** Wire format and versioning | The signature covers the **exact received bytes** of the pushed body (no canonicalization), verified before the body is parsed. The signed content must carry: the integration identifier, the key identifier, the signing timestamp (Q5), an **envelope version**, and the provider result. Signature algorithm: **Ed25519**. Unknown envelope version → `REJECTED`. The in-process `AiPlatformProviderSignal` / `AiPlatformAuthorization` contract stays unversioned (OD-9 unchanged); the version applies to the transport envelope only. Exact header / field names and body-size limit are left to the implementation authorization, within these rules. | Signing exact bytes avoids a canonical-form ambiguity and follows the Razorpay verify-before-parse precedent. OD-9 deferred versioning to the introduction of a wire format; placing the version on the envelope answers that without reopening OD-9. Ed25519 is available in `node:crypto`. |
| **Q11** Operator attestation (Option F) | **No.** An operator attestation does not satisfy "explicit evidence from the upstream integration". | An attestation is evidence from this system's operator, not from the integration; it provides no origin or integrity proof. |
| **Q12** `PUBLISHED`-only results | **No.** OD-13's gate and this mechanism are **mandatory only for results containing `SUPPLIED_TO_US`**; the gate's scope is unchanged. Because verification precedes parsing, every payload arriving at an Option B ingress is verified regardless of content. `PUBLISHED`-only results arriving by any other path remain under existing rules. Any runtime caller for such results still needs its own runtime-wiring authorization, which this decision does not grant. | OD-13 item 2 gates only `SUPPLIED_TO_US`; DEC-003 ans. 8 keeps PUBLIC_INTENT unaffected. Widening the gate would reinterpret OD-13. |

### 13.4 Explicit assumptions

1. A future named AI-platform integration can sign its pushed payloads with Ed25519 and exchange public keys through
   an authenticated out-of-band channel. **If it cannot, the gate stays in force for that integration and the
   question returns to the Product Owner**; no other option is implicitly authorized.
2. This system's clock is accurate enough for the 5-minute freshness window.
3. The inbound ingress can read the raw request body before any parsing (true of the existing Razorpay route).
4. The integration protects its private key; a compromised private key allows forgery for that integration until
   its key is removed (Q3 e).

### 13.5 Constraints any later implementation must respect

1. **Unchanged rules:** OD-1 to OD-12; the five evidence values; FIRST_PARTY evidence requirements; OD-6 rejection
   behavior; OD-8 transaction behavior; OD-12 retry behavior; DP-1's `AUTHORIZATION_EVIDENCE_REQUIRED` label; the
   IA-1 writer-path implementation. Option B adds a verification precondition in front of them and alters none.
2. Verify over exact received bytes **before parsing**; never throw on attacker input; bounded body size.
3. The verified identity must equal both `provenance.integration` and `authorization.integrationId` (OD-5 binding).
4. Enforce at **P2 and P3** via a branded verified type producible only by the verifier (Q4).
5. Public keys only; no private key, shared secret or signing capability in this system for integration payloads
   (Q3 a).
6. No additional provider call; no runtime key fetch; operational contract unchanged (Q7).
7. Authenticity failures → `REJECTED`, whole result, nothing persisted, no halt, no automatic retry (Q8).
8. No schema change, no nonce / dedup store, no persistence of signatures or payloads (Q5, Q9).
9. Envelope version on the transport only; in-process contract unversioned (Q10, OD-9).
10. Tests use generated test key pairs and signed fixtures only; no network, no live integration.
11. The OD-13 gate lifts **per integration** only after that integration is named and authorized, Option B is
    implemented, and its key is registered — each under its own authorization.
12. Privacy boundary (DEC-003 §6, DEC-004 §7) unchanged and applies in full.

### 13.6 What this decision does not do

It resolves the OD-13 policy / design question only. It does **not** authorize implementation, provider
authentication code, an ingress route, key or credential provisioning, configuration changes, a runtime caller or its
enablement, provider calls, external HTTP, database connections, validation, participant contact, deployment or
commits. It does not change OD-1 to OD-13, DEC-003, DEC-004, DEC-005, IA-1, IA-2, DP-1 or DOC-1.

**Future authorization required, separately:** (1) implementation authorization for Option B within §13.5;
(2) authorization naming each AI-platform integration and registering its public key; (3) runtime-wiring
authorization for any caller; (4) any provider-call, validation or deployment authorization.

### 13.7 Final state

```text
OD-13 Product Owner decision: DECIDED
Selected authenticity mechanism: Option B — inbound asymmetric signature (Ed25519, verify-before-parse, P2+P3)
Implementation authorization: NONE
Runtime-wiring authorization: NONE
Provider-call authorization: NONE
Validation authorization: NONE
Deployment authorization: NONE
OD-13 runtime gate: IN FORCE
```

### 13.8 Execution counters (revision 2)

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
Files modified: 1 (this record)
```

**INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 — DECIDED — OPTION B — NO IMPLEMENTATION, RUNTIME-WIRING, PROVIDER-CALL,
VALIDATION OR DEPLOYMENT AUTHORITY — OD-13 GATE IN FORCE**
