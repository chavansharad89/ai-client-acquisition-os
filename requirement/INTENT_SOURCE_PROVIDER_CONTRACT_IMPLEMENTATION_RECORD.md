# INTENT INTAKE MVP

## Provider-Neutral Provider-Result Contract Layer — Implementation Record

**Record ID:** INTENT-SOURCE-PROVIDER-CONTRACT-REC-001
**Status:** **IMPLEMENTED** (not committed; no migration; no live provider)
**Governing decisions (unchanged):**
- INTENT-INTAKE-PO-DEC-001, D1–D5 (`requirement/INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`, sha256
  `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407`)
- INTENT-INTAKE-PO-DEC-002, E1 = A / E2 = A (`requirement/INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION.md`, sha256
  `638b9aa30a3c1f36598b14278fd994729a8f14bbd320c0607244ba23f2f132c4`)

**Prior records relied upon (unchanged):**
- INTENT-INTAKE-IMPL-REC-002 (`requirement/INTENT_INTAKE_MVP_E1_E2_IMPLEMENTATION_RECORD.md`, sha256
  `8dc2859aa37731bd3329b61837967c111f5933110192c256e3249d8f7635a449`)
- INTENT-SOURCE-ADAPTER-IMPL-REC-001 (`requirement/INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md`, sha256
  `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5`)

**Authorization:** the Product Owner's instruction of 2026-09-30, "Provider Contract & Governance Preparation".
This record grants no authority of its own.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28` (unchanged; nothing staged before or after)

```text
PROVIDER CONTRACT LAYER ... IMPLEMENTED — FIXTURES AND FAKES ONLY
EXISTING ADAPTER LAYER .... REUSED (normalizeIntentEvent / adapters / toIntentIntakeInput unchanged in behaviour)
CANONICAL INTAKE PATH ..... UNCHANGED (recordIntentIntakeForOwner not modified)
SCHEMA / MIGRATION ........ NONE
FIRST_PARTY CONSENT ....... PENDING PRODUCT OWNER DECISION (recorded, not enforced, not decided)
```

**NO LIVE PROVIDERS WERE CALLED.**
**NO LIVE VALIDATION WAS AUTHORIZED.**

---

## 1. Baseline (verified before any edit)

| Item | Value | Result |
|---|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `7a0810e54a88849db5d6f39ba4e092086b7d44b1f2b366bb4726c24ec2f671c6` | = REC-001 "after" |
| `intentSource.ts` | `72c7f3b87a70b37c22eb10774fdb1d11b6963b03e62efdd445f3b2677dc5832b` | = REC-001 |
| `intentSourceAdapters.ts` | `fc7e1006287101cb773a16ab80dfb985f2d88daaa689cf984df0a6783a1c1236` | = REC-001 |
| INTENT-INTAKE-PO-DEC-001 | `52ee6164…7407` | matches |
| INTENT-INTAKE-PO-DEC-002 (E1 = A, E2 = A) | `638b9aa3…32c4` | matches |
| INTENT-INTAKE-IMPL-REC-002 | `8dc2859a…a449` | matches |
| INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a01…dcce5` | matches |
| Migration 0029 | `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c` | matches |
| `INTENT_SIGNAL_CONFIDENCE` | `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90` | confirmed |
| ServiceProfile opt-in (D3), E1, E2 | unchanged | confirmed |

All governance hashes were re-verified after implementation and are unchanged.

## 2. Contract layer

```text
provider result  (PublicWebSearchProviderResult | AiPlatformProviderSignal | PublicIntentProviderNotice)
  -> normalizeProviderResult / normalizeProviderBatch      NEW — pure, no I/O
       provider-level privacy screen, structure, verbatim-evidence check,
       attribution, system-assigned-key rejection; maps to the adapter raw record
  -> existing AcquisitionSourceAdapter.normalize            unchanged
  -> existing normalizeIntentEvent                          unchanged behaviour
  -> existing toIntentIntakeInput (D5: 70 / 90, OBSERVED)   unchanged
  -> NormalizedIntentEvent.intake
  -> recordIntentIntakeForOwner                             unchanged
  -> Prospect -> Research (D4) -> Qualification -> Opportunity -> ServiceProfile opt-in -> Offer / Next Action
```

No second pipeline exists. The contract layer ends in the existing `NormalizedIntentEvent`.

**Provider result vs acquisition signal.** A provider result is not an acquisition signal. It becomes one only when
it carries a business-level intent statement that appears **verbatim** in the result's own text (title + snippet, or
title + body). Outcomes:

| Status | Meaning | Sent to intake |
|---|---|---|
| `NORMALIZED` | Valid business-level intent evidence; carries the `NormalizedIntentEvent` and contract notes | yes |
| `NO_INTENT_EVIDENCE` | Result states no business intent (e.g. an ordinary listing). A search result alone is not proof of intent | no |
| `UNATTRIBUTED` | No business identity in the source. Identity is never inferred from the URL | no |
| `DUPLICATE_IN_BATCH` | Same `eventId` already produced earlier in the same batch | no |
| `REJECTED` | Malformed, missing provenance, privacy violation, non-verbatim evidence or source-assigned kind/confidence/classification. One bad result never aborts the batch | no |

### 2.1 Google Search / public web — `PublicWebSearchProviderResult`

`sourceFamily = PUBLIC_WEB_SEARCH`, `resultType`, `externalId` (stable, required), `title`, `url` (http(s), required),
`snippet`, `observedAt`, `capturedAt`, `business` (name + website, or null), `publication` (publisher, publishedAt,
or null), `provenance` (`integration`, `retrieval`), `intentEvidence` (`requirement`, verbatim `evidence`, or null),
optional `context`.

`resultType`: `SEARCH_RESULT`, `PUBLIC_PAGE`, `PROCUREMENT_NOTICE`, `PROJECT_POSTING`, and — **added additively** in
this record — `HIRING_SIGNAL` and `TECHNOLOGY_MIGRATION` (so a Google-found hiring or migration page keeps its
type). Labels follow the existing rule, e.g. "Public web search · hiring signal". Disclosure stays `PUBLISHED` only.

### 2.2 AI-platform acquisition — `AiPlatformProviderSignal`

`sourceFamily = AI_PLATFORM_ACQUISITION`, `acquisitionType` (`AI_PLATFORM_AD`, `AI_REFERRAL`,
`SPONSORED_PLACEMENT`), `externalId`, `business`, `sourceReference` (authorized landing/source reference),
`evidence[]` (`origin` `PUBLISHED | SUPPLIED_TO_US`, `derivation = STATED_BY_BUSINESS`, `requirement`, `statement`,
optional `referenceUrl`, per-item `observedAt`), `capturedAt`, `provenance`, `authorization`
(`integrationId`, `basis`, `reference`, or null), optional `context`.

- Represents only data an authorized integration legitimately supplies about the business's **own** statement.
- Assumes no access to ChatGPT / Gemini / Claude conversations, prompts, search history, account identifiers,
  cookies, device identifiers, click IDs or private user identity; any such key is rejected (§3).
- `derivation` other than `STATED_BY_BUSINESS` (e.g. inference from platform-user activity) is rejected.
- `authorization` is **recorded, not evaluated**: the outcome reports `PRESENT` or `MISSING`. It is not enforced
  because the policy is undecided (§6.2).

### 2.3 Public intent — `PublicIntentProviderNotice`

`sourceFamily = PUBLIC_INTENT_NOTICE`, `noticeType` (`RFP_NOTICE`, `PROJECT_REQUEST`, `COMPANY_ANNOUNCEMENT`,
`HIRING_SIGNAL`, `TECHNOLOGY_MIGRATION`), `externalId`, `title`, `url`, `body`, `observedAt`, `capturedAt`,
`business`, `publication`, `provenance`, `intentEvidence[]` (each verbatim in title/body), optional `context`.

Published/public evidence only: this family can never yield `FIRST_PARTY` (existing `FAMILY_DISCLOSURES`). First-party
supplied evidence exists only in the AI-platform family via `origin = SUPPLIED_TO_US`. No personal intent is inferred
and no individual-level targeting data is created.

## 3. Privacy boundary

Applied by `normalizeProviderResult` **before** mapping, recursively, in addition to the existing adapter-level screen
(which still runs inside `normalizeIntentEvent`). Violations are **rejected, never stripped**.

- **Keys** (`PROVIDER_PROHIBITED_KEYS`, a superset of `PROHIBITED_PERSONAL_DATA_KEYS`): email / personal email,
  phone / mobile / telephone, AI conversation / chat history / chat log, prompts, search terms / queries / history,
  browsing history, cookies, device / advertising / account / platform-user / visitor IDs, click IDs (`gclid`,
  `fbclid`, `msclkid`, `dclid`, `gbraid`, `wbraid`, `ttclid`, `clickId`), user profile / personal data / private user
  data, personal names, date of birth, home address, and private-AI-usage inference keys.
- **Values:** any string outside the free-text fields (`title`, `snippet`, `body`, `statement`, `evidence`,
  `basis`) that is an email address or a `mailto:` / `tel:` / `sms:` reference is rejected — so a personal email can
  never serve as an identifier.
- **Source references** must be http(s); click/tracking parameters are rejected (existing check).
- **Flags:** every normalized signal still declares `personalDataUsed = false` and
  `individualIdentityRequired = false` (existing contract; asserted for every valid fixture).

## 4. Provenance

Every normalized signal carries `sourceFamily`, `sourceType`, `externalId`, `sourceReference`, `sourceLabel`,
`observedAt` (per signal) and `capturedAt`, plus the verbatim `evidence`. The outcome's `notes` add the provider
provenance (`integration`, `retrieval`), `publication` and the authorization status.

| Contract field | Normalized event | Persisted (existing columns, no migration) |
|---|---|---|
| source family + type | yes | `research_signal_sources.source_label` |
| source URL / reference | yes | `source_url` |
| evidence | yes | `source_quote`, `research_signals.signal` |
| observed time (per signal) | yes | `research_signals.observed_at` |
| capture time | yes (`provenance.capturedAt`) | not stored as supplied; `research_signals.created_at` is the system's capture time (as REC-001 §5) |
| externalId, provider provenance, publication, authorization | yes (event / notes) | not persisted |

Every traceability item required by the instruction is present on the normalized signal. The persisted chain (label,
URL, quote, observed time, system capture time) is the one REC-001 already accepted. No schema change was needed or
made; the non-persisted fields are listed as an open question (§6.3), not silently added.

## 5. Operational (cost / retry) contract

Defined in `PROVIDER_OPERATIONAL_CONTRACT`, `PROVIDER_FAILURE_HANDLING` and `createProviderCallBudget`. Nothing
calls a provider and no retry is implemented.

| Requirement | Contract |
|---|---|
| Max calls per acquisition event | 1 (`createProviderCallBudget` refuses a second call and refuses budgets > 1) |
| Automatic retry | prohibited (0); every failure kind has `automaticRetry: false` |
| Manual retry | `OPERATOR_INITIATED_ONLY`: a new, separately authorized call with its own budget. Not implemented |
| Timeout | required and finite per call (value set at authorization time); outcome `FAILED`, no retry |
| Rate limit | `FAILED`, run halted; later calls refused |
| Authentication failure | `FAILED`, run halted |
| Provider unavailable | `FAILED`, run halted |
| Malformed provider response | `REJECTED` |
| Empty result | `COMPLETED_EMPTY`, no events |
| Duplicate provider result | `SKIPPED_DUPLICATE` (in-batch, `DUPLICATE_IN_BATCH`) |

No failure kind produces intake events.

## 6. Known open questions

1. **KNOWN OPEN DESIGN QUESTION — replay / persistence deduplication.** `eventId` is deterministic (tested for every
   family), but persistence does not enforce uniqueness: re-submitting the same event appends its signals again (the
   REC-001 worker test shows this; E1 still reuses the Opportunity). `normalizeProviderBatch` skips identical results
   only **within one batch**; identical results in different batches are forwarded. A deterministic `eventId` does
   **not** currently prevent duplicate persistence. No migration or unique constraint was created.
2. **PENDING PRODUCT OWNER DECISION — FIRST_PARTY consent / authorization basis for AI-platform signals.** Not decided
   in any record (REC-001 §9.3). The code exposes `FIRST_PARTY_CONSENT_POLICY = 'PENDING_PRODUCT_OWNER_DECISION'`,
   reports authorization metadata as `PRESENT`/`MISSING`, and keeps `consentRequired = null`. Missing metadata is
   flagged, not blocked, so no policy is chosen in code. Must be decided before any live AI-platform integration. A
   separate decision-preparation record was not created: the contract is fully testable without the decision and no
   hard-stop condition was reached.
3. **Non-persisted provenance.** Provider `capturedAt`, `externalId`, provider provenance, publication and
   authorization metadata live on the normalized event / outcome only. Persisting them needs a schema change and is
   not authorized.
4. **Privacy screen limits.** Free-text fields are not PII-scanned (a public RFP body may quote a business contact
   email; tested as accepted). A phone number supplied as a bare digit string under a neutral key cannot be told apart
   from a numeric identifier; only phone-named keys and `tel:` references are rejected.
5. **Operational values.** The concrete timeout value, rate-limit resumption and the manual-retry authorization process
   are to be set when a live integration is authorized.
6. Cross-source Prospect merging (G3) and signal-count limits remain undecided (unchanged from REC-001).

## 7. Tests

**Added (131), all provider-free:**

- **`intentSourceProviderContract.test.ts` (130).** An I/O guard stubs `fetch` and spies on `node:http`/`node:https`
  `request`/`get` and `net.connect`/`createConnection`; each throws and is counted, and `afterEach` asserts every
  counter is 0. A static test asserts the contract, adapter and normalization files import no network client, SDK
  (Anthropic, OpenAI, Google, Gemini) or browser-automation library.
  - Google/public web: ordinary result, no-intent result, non-verbatim evidence, procurement/RFP, project request,
    hiring, technology migration, malformed (6 variants), missing / invalid / non-http URL, missing identity,
    in-batch duplicate, batch isolation.
  - AI platform: authorized signal (FIRST_PARTY 90, consent pending), provenance preservation, missing authorization
    metadata, private conversation / prompt rejection (5), inference rejection, personal identifiers (5), published
    evidence → PUBLIC_INTENT.
  - Public intent: RFP notice, project request, announcement, hiring, migration, malformed (3), no-intent, never
    first-party.
  - Cross-provider (11 valid fixtures each): deterministic `eventId` and change sensitivity; privacy flags,
    fixed confidence, provenance, `toIntentIntakeInput` acceptance. Plus multi-signal with per-signal observed times,
    PUBLIC_INTENT vs FIRST_PARTY, existing validation (too-long, observed-after-capture), source-assigned values,
    unknown family.
  - Privacy, every family: 18 prohibited items × 3 families, tracking parameters × 3, free-text limitation.
  - Operational: call budget, no automatic retry for all 7 failure kinds, halting kinds, empty response.
- **Worker (1).** Mock provider batch (valid notice, duplicate, unattributed) → `normalizeProviderBatch` → adapter →
  `normalizeIntentEvent` → unchanged `recordIntentIntakeForOwner` → Prospect → Research → Qualification. Asserts two
  PUBLIC_INTENT 70 / OBSERVED signals with provenance, research ran, one Opportunity, opt-in unchanged
  (`needDetected = false`), NOT_QUALIFIED on MISMATCH (no category-plausibility shortcut), and no `fetch`.

**Results (run and passed):**

| Area | Result |
|---|---|
| core-research | 467/467 (337 prior + 130) |
| worker | 211/211 (210 prior + 1) |
| core-acquisition / core-opportunity / core-service-profile / core-qualification / core-personalization | 155 / 97 / 31 / 30 / 31 |
| Integration, real Postgres (11 files: intent-intake, research, search-worker, qualification, opportunity ×7) | 109/109 |
| Integration: service-profile | 7/7 |
| Typecheck (`tsc --noEmit`): core-research, worker | passed |
| ESLint on all changed files | passed, 0 warnings |
| `git diff --check` | clean |

**Not run (not represented as passing):** repository-wide typecheck / lint / build; the web app typecheck (index.ts
changes are additive exports only); the personalization, outreach-preparation and follow-up-preparation integration
suites (14 pre-existing failures recorded in INTENT-INTAKE-IMPL-REVIEW-001); all other integration suites.

**Test environment:** integration tests created throwaway databases on the local test server (`127.0.0.1:5433`, the
harness default; no `DATABASE_URL` override). The validation database (port 5434) was not touched and migration 0029
was not run against it.

## 8. Files changed

**Production (4):**
- `packages/core-research/src/intentSourceProviderContract.ts` (new): provider-result contracts,
  `normalizeProviderResult`, `normalizeProviderBatch`, provider privacy screen, operational contract, call budget.
- `packages/core-research/src/intentSource.ts`: `PUBLIC_WEB_SEARCH` gains `HIRING_SIGNAL`, `TECHNOLOGY_MIGRATION`
  (additive).
- `packages/core-research/src/intentSourceAdapters.ts`: `PublicWebSearchRecord.resultType` derived from
  `INTENT_SOURCE_TYPES` (type-only).
- `packages/core-research/src/index.ts`: exports.

**Tests and fixtures (3):**
- `packages/core-research/src/intentSourceProviderFixtures.ts` (new, not exported from the package)
- `packages/core-research/src/intentSourceProviderContract.test.ts` (new)
- `apps/worker/src/searchWorker/worker.test.ts`

**Not modified:** `recordIntentIntakeForOwner`, `intentSignal.ts`, `normalizeIntentEvent` logic, existing adapters'
mapping, research, qualification, scoring, offers, ServiceProfiles, personalization, outreach, follow-up, migrations,
configuration, dependencies, and all existing decision records.

## 9. Final fingerprint

| Item | Value |
|---|---|
| Implementation fingerprint after (`git diff HEAD --binary`, excl. `requirement/`) | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` |
| `intentSource.ts` | `55fd91dead83608dc0add5f728cb0a2fb5ac76292a5cb87f2626645722a04634` |
| `intentSourceAdapters.ts` | `8b5b2073960698a77e878b8ab9647b28776b5c2b230d63c700bf36414fe5d299` |
| `intentSourceProviderContract.ts` | `dcedfba224652b15c871c18bdae2f9199f86781a03bd5c90679e05b6f9b019f9` |
| `intentSourceProviderContract.test.ts` | `c644cbf0d1ecec907330ed93d2469db070ac7fe2419e04595c05945a2a7e2651` |
| `intentSourceProviderFixtures.ts` | `8e63bebbd6c9807e07e22ca5df019b7fdf61aba9ee11be089974cfe8a0ea96f5` |
| `intentSourceFixtures.ts`, `intentSource.test.ts` | unchanged (`abf9d293…6949`, `07ef13fe…dbb9`) |
| Migration 0029 | `ca498e33…da21c` (unchanged) |

The tracked-file fingerprint covers `index.ts` and `worker.test.ts`. The other files are untracked and are pinned by
their own hashes above.

## 10. Safety counters

```text
Anthropic API calls: 0
Google Search calls: 0
Google Places calls: 0
Google Ads calls: 0
OpenAI API calls: 0
Gemini API calls: 0
Claude consumer calls: 0
External HTTP calls: 0
Live-source fetches: 0
Participant contacts: 0
Validation sessions: 0
Searches submitted: 0
Manual retries: 0
Validation DB writes: 0
Validation migrations executed: 0
Production code changes: 4
Schema changes: 0
Configuration changes: 0
Dependencies changed: 0
```

## 11. Scope boundary

- No change to D1–D5, E1, E2, ServiceProfile opt-in, qualification criteria, Opportunity behaviour, research
  semantics, confidence values or scoring.
- This record does not authorize live providers or credentials, live validation, Search submission or retry,
  participant contact, applying migration 0029, persistence deduplication, or any FIRST_PARTY consent policy.

**NO LIVE PROVIDERS WERE CALLED. NO LIVE VALIDATION WAS AUTHORIZED.**

```text
PROVIDER CONTRACT LAYER COMPLETE — PROVIDERS NOT CALLED
```
