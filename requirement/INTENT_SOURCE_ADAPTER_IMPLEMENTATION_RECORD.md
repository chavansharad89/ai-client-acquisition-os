# INTENT INTAKE MVP

## Provider-Free Acquisition-Source Adapter Layer — Implementation Record

**Record ID:** INTENT-SOURCE-ADAPTER-IMPL-REC-001
**Status:** **IMPLEMENTED** (not committed; no migration; no live provider)
**Governing decisions (unchanged):**
- INTENT-INTAKE-PO-DEC-001, D1–D5 (`requirement/INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`, sha256
  `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407`)
- INTENT-INTAKE-PO-DEC-002, E1/E2 (`requirement/INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION.md`, sha256
  `638b9aa30a3c1f36598b14278fd994729a8f14bbd320c0607244ba23f2f132c4`)

**Prior implementation record:** INTENT-INTAKE-IMPL-REC-002 (`requirement/INTENT_INTAKE_MVP_E1_E2_IMPLEMENTATION_RECORD.md`,
sha256 `8dc2859aa37731bd3329b61837967c111f5933110192c256e3249d8f7635a449`, unchanged)
**Authorization:** the Product Owner's instruction of 2026-09-30, "Implement the provider-free source-adapter layer".
This record grants no authority of its own.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

```text
SOURCE ADAPTER LAYER ...... IMPLEMENTED — FIXTURES AND FAKES ONLY
CANONICAL INTAKE PATH ..... UNCHANGED (recordIntentIntakeForOwner not modified)
SCHEMA / MIGRATION ........ NONE — existing research_signal_sources columns carry provenance
NO LIVE PROVIDERS USED — NO LIVE VALIDATION AUTHORIZED
```

---

## 1. Baseline

| Item | Value |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Implementation fingerprint before (`git diff HEAD --binary`, excl. `requirement/`) | `5401f9491d38f7c5df97081eaab00abd81608b83d87948a00a271cec156e3100` (matches INTENT-INTAKE-IMPL-REC-002) |
| Implementation fingerprint after | `7a0810e54a88849db5d6f39ba4e092086b7d44b1f2b366bb4726c24ec2f671c6` |
| Migration 0029 | `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c` (unchanged) |
| Decisions confirmed | E1 = A, E2 = A, `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90`, D3 ServiceProfile opt-in |

**Fingerprint coverage note:** `git diff HEAD` covers tracked files only. The new files in §2 are untracked, so they
are pinned by their own hashes instead:
- `intentSource.ts`: `72c7f3b8…832b`
- `intentSourceAdapters.ts`: `fc7e1006…1236`

## 2. Files

**Production (3):**
- `packages/core-research/src/intentSource.ts` (new): the contract and `normalizeIntentEvent`.
- `packages/core-research/src/intentSourceAdapters.ts` (new): three adapters.
- `packages/core-research/src/index.ts`: exports.

**Test and fixture files (4):**
- `packages/core-research/src/intentSourceFixtures.ts` (new): fixtures, not exported from the package.
- `packages/core-research/src/intentSource.test.ts` (new)
- `apps/worker/src/searchWorker/worker.test.ts`
- `tests/integration/intent-intake.integration.test.ts`

**Not modified:**
- `recordIntentIntakeForOwner`, `intentSignal.ts`
- Research, qualification, offer, scoring, personalization, outreach and follow-up code
- ServiceProfiles, migrations, configuration and dependencies

## 3. Source-adapter contract

```text
raw source record
  -> AcquisitionSourceAdapter.identifySource / normalize   (pure mapping, no I/O)
  -> normalizeIntentEvent                                  (single central path)
  -> NormalizedIntentEvent.intake : RecordIntentIntakeInput
  -> recordIntentIntakeForOwner                            (canonical, unchanged)
  -> Prospect / signals -> existing Research (D4) -> Qualification -> Opportunity / offer
```

**`AcquisitionSourceAdapter<Raw>`:**
- `sourceFamily`
- `identifySource(raw)` returns `{ sourceFamily, sourceType, externalId }`.
- `normalize(raw)` returns an `IntentSourceCandidate` containing the business, the context (target customer,
  geography, service) and the signals. Each signal carries disclosure, field, verbatim evidence, `sourceReference`
  and `observedAt`.

**What adapters never do:** persist, create Prospects, Opportunities, determinations, offers or outreach, or set kind,
confidence or classification.

| Family | Types | Adapter | Allowed disclosure |
|---|---|---|---|
| `PUBLIC_WEB_SEARCH` (Google Search / public web) | `SEARCH_RESULT`, `PUBLIC_PAGE`, `PROCUREMENT_NOTICE`, `PROJECT_POSTING` | `publicWebSearchAdapter` | `PUBLISHED` |
| `AI_PLATFORM_ACQUISITION` (AI-platform ads, referrals, sponsored placement) | `AI_PLATFORM_AD`, `AI_REFERRAL`, `SPONSORED_PLACEMENT` | `aiPlatformAcquisitionAdapter` | `PUBLISHED`, `SUPPLIED_TO_US` |
| `PUBLIC_INTENT_NOTICE` (RFPs, requests, announcements, hiring, migrations) | `RFP_NOTICE`, `PROJECT_REQUEST`, `COMPANY_ANNOUNCEMENT`, `HIRING_SIGNAL`, `TECHNOLOGY_MIGRATION` | `publicIntentNoticeAdapter` | `PUBLISHED` |

## 4. Normalization (`normalizeIntentEvent`)

**Checks, in order:**
1. Privacy screen of the raw record.
2. Adapter, identity and candidate agree on family, type and `externalId`, and the type belongs to the family.
3. A source-assigned `kind`, `confidence` or `classification` is rejected (`not-allowed`), at event or signal level.
4. The disclosure is allowed for the family.
5. `sourceReference` is required and must be an absolute URL with no click or tracking identifier.
6. `capturedAt` must be valid and not in the future; `observedAt` must not be after `capturedAt`.

**Kind, derived centrally from disclosure:**
- `PUBLISHED` → `PUBLIC_INTENT`
- `SUPPLIED_TO_US` → `FIRST_PARTY`

This follows the repository's existing intake semantics: a quote someone published (for example a public forum post)
versus one supplied to us (for example a landing-page form).

**Then:** the event goes through the existing `toIntentIntakeInput`. D5's fixed values (`PUBLIC_INTENT = 70`,
`FIRST_PARTY = 90`, OBSERVED), the entry-level rejections and "whole event validated before any write" are therefore
enforced in one place, not per adapter.

**Multi-signal events:**
- One source event may carry several signals, including `PUBLIC_INTENT` + `FIRST_PARTY` and several of the same kind.
- `observedAt` is kept per signal.
- One invalid entry rejects the whole event.
- Separate sources are never merged into one event.

**`eventId`:** sha256 over family, type, `externalId`, website and the signal content. Replaying the same record gives
the same id.

## 5. Provenance

| Contract field | Normalized event | Persisted (existing columns) |
|---|---|---|
| sourceFamily, sourceType | yes | `research_signal_sources.source_label`, e.g. "Public web search · procurement notice" (plain text, as D10-C) |
| sourceReference | yes | `source_url` |
| evidence | yes | `source_quote` and `research_signals.signal` |
| observedAt | yes | `research_signals.observed_at` |
| capturedAt | yes | not stored as supplied; `research_signals.created_at` is the system's capture time |
| confidence, classification, kind | yes | `research_signals` |
| externalId, context, privacy flags | yes | not persisted |

No schema change was required to answer "why does the system believe this prospect has this intent?" Each row keeps
the verbatim evidence, the URL, the source family and type, and the event time.

## 6. Privacy boundary

- **Business-level evidence only.** The raw record and the adapter output are both screened recursively. Keys naming
  individual-level data are rejected, never stripped: search history or queries, cookies, device, browser,
  advertising, client, user or account IDs, email, phone, IP, user agent, session, AI-conversation content or
  transcript, prompts, and click IDs.
- **Source references** carrying `gclid`, `fbclid`, `msclkid`, `dclid`, `gbraid` or `wbraid` are rejected.
- **Privacy flags on each normalized signal:**
  - `personalDataUsed = false` and `individualIdentityRequired = false` on every signal.
  - `publicBusinessSignal` is `true` for `PUBLIC_INTENT` and `false` for `FIRST_PARTY`.
  - `consentRequired` is `false` for `PUBLIC_INTENT`. It is `null` ("not determined by this layer") for
    `FIRST_PARTY`; see §9.
- **AI platforms:** the AI-platform adapter represents only what an authorized integration supplies about the
  business's own stated interest. It does not assume that anyone's request to ChatGPT, Gemini or Claude is observable.
  Any source that needs individual-level data is **OUT OF SCOPE**.

## 7. Tests

**Added (32), all provider-free:**
- **`intentSource.test.ts` (29).** `fetch` is stubbed to throw, and each test asserts it was never called.
  - Contract: each adapter, determinism of `eventId`, malformed data, missing or invalid provenance, and
    confidence/classification/kind rejection at both levels.
  - Disclosure restriction.
  - Normalization of all three fixtures: public web → `PUBLIC_INTENT` 70, AI ad → `FIRST_PARTY` 90, notice →
    `PUBLIC_INTENT` 70.
  - Multi-signal: `PUBLIC_INTENT` + `FIRST_PARTY`, same-kind signals, and whole-event rejection.
  - Provenance through to persistence input.
  - Privacy: declared flags, 10 prohibited raw keys, nested personal data, and tracking identifiers.
- **Worker (2):**
  - A normalized `PUBLIC_INTENT` + `FIRST_PARTY` event goes through the unchanged `recordIntentIntakeForOwner`:
    provenance labels and URLs are persisted and research runs. Opt-in is unchanged (`needDetected = false` for a
    non-opted profile). A MISMATCH research result gives NOT_QUALIFIED, so there is no category-plausibility shortcut.
  - Replaying the same event reuses the Opportunity unchanged (E1) and shows the persistence is append-only.
- **Integration, real Postgres (1):** a normalized public-web event persists label, URL, quote, `observed_at`, 70
  and OBSERVED.

**Results:**

| Area | Result |
|---|---|
| core-research | 337/337 passed (308 prior + 29) |
| worker | 210/210 passed (208 prior + 2) |
| core-acquisition / -opportunity / -service-profile / -qualification / -personalization | 155 / 97 / 31 / 30 / 31 passed |
| Integration (11 files: intent-intake, research, search-worker, qualification, opportunity ×7) | 109/109 passed |
| Typecheck (`tsc --noEmit`): core-research, worker | passed |
| ESLint on the changed files | passed |

**Test environment:**
- Integration tests used throwaway databases on the local test server (`127.0.0.1:5433`). The validation database
  (port 5434) was not touched.
- Existing regression tests for E1, E2, opt-in, D4 and "no second Opportunity" all passed, unmodified.
- The personalization, outreach-preparation and follow-up-preparation integration suites were **not run**. They are
  not represented as passing; their 14 pre-existing failures are recorded in INTENT-INTAKE-IMPL-REVIEW-001.

## 8. Migration

- No migration was created, modified or executed.
- 0027, 0028 and 0029 are unchanged, and 0029 is still not applied to the validation database.
- This record does not authorize applying it.

## 9. Known limitations and decision-required items

1. **Replay is not deduplicated at persistence (decision required).** `eventId` is deterministic, but intake is
   append-only, so replaying an event appends its signals again. The worker test shows this. It is not merged into a
   second Opportunity. Persistence-level replay safety would need a stored external or event id, which means a schema
   change, and a dedup policy. Neither is authorized.
2. **`externalId`, adapter `capturedAt`, context and privacy flags are not persisted.** Storing them structurally
   would need a schema change, which is not authorized.
3. **Consent for FIRST_PARTY from AI-platform integrations is undetermined (decision required before any live
   integration).** Whether such events need a consent or terms basis on record is not decided, so `consentRequired`
   is `null`.
4. **The personal-data screen is key-based.** It cannot detect personal data inside free-text evidence.
5. **No live adapters.** None calls a provider, and no HTTP caller exists.
6. Cross-source Prospect merging (G3) and signal-count limits remain undecided and unimplemented.

## 10. Safety counters

```text
Anthropic API calls: 0
Google API calls (Search / Places / Ads): 0
Gemini API calls: 0
OpenAI / ChatGPT calls: 0
Claude consumer calls: 0
Live-source fetches / external HTTP: 0
Participant contacts: 0
Validation sessions: 0
Searches submitted: 0
Manual retries: 0
Validation DB writes: 0
Migrations executed: 0
Schema changes: 0
Configuration changes: 0
Dependencies changed: 0
```

## 11. Scope boundary

- No change to D1–D5, E1 or E2, ServiceProfiles, `suggestOffers`, qualification criteria, scoring or
  `SCORER_VERSION`.
- A source appearance is an acquisition signal, not a research determination.
- This record does not authorize:
  - live providers or credentials;
  - live validation;
  - Search submission or retry;
  - participant contact;
  - applying migration 0029.

**NO LIVE PROVIDERS USED — NO LIVE VALIDATION AUTHORIZED**
