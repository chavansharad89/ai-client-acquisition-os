# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Basis — Product Owner Decision Preparation

**Decision ID (reserved):** INTENT-INTAKE-PO-DEC-003
**Status:** **PENDING PRODUCT OWNER DECISION**
**Raised by:** INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 §6.2 ("PENDING PRODUCT OWNER DECISION — FIRST_PARTY consent /
authorization basis for AI-platform signals"). Earlier noted in INTENT-SOURCE-ADAPTER-IMPL-REC-001 §9.3.
**Authorization for this record:** the Product Owner's instruction "Record the FIRST_PARTY AI-Platform Authorization
Decision — No Implementation or Live Providers" (2026-09-30). This record grants no authority of its own.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` (= INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 §9)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

```text
INTENT-INTAKE-PO-DEC-003 .. PENDING — 1 DECISION (AI-PLATFORM FIRST_PARTY AUTHORIZATION BASIS), OPTIONS UNRANKED
IMPLEMENTATION ............ NOT AUTHORIZED BY THIS RECORD
PROVIDER CONTRACT ......... UNCHANGED BY THIS RECORD
```

**This is a governance decision-preparation record only.** It:
- does **not** select an option or decide any question;
- does **not** authorize implementation, refactoring, migration or configuration;
- does **not** authorize any provider connection or credential;
- does **not** authorize any live API call, live-source fetch or Search submission;
- does **not** authorize participant contact or validation;
- does **not** change the existing provider contract, adapters, normalization or intake path.

---

## 1. Baseline (verified before writing)

| Item | sha256 | Result |
|---|---|---|
| INTENT-INTAKE-PO-DEC-001 (`INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` | matches |
| INTENT-INTAKE-PO-DEC-002 (`INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION.md`) | `638b9aa30a3c1f36598b14278fd994729a8f14bbd320c0607244ba23f2f132c4` | matches |
| INTENT-INTAKE-IMPL-REC-002 (`INTENT_INTAKE_MVP_E1_E2_IMPLEMENTATION_RECORD.md`) | `8dc2859aa37731bd3329b61837967c111f5933110192c256e3249d8f7635a449` | matches |
| INTENT-SOURCE-ADAPTER-IMPL-REC-001 (`INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md`) | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | matches |
| INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 (`INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md`) | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | matches |
| Migration 0029 (`0029_research_signal_intent_kinds/migration.sql`) | `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Implementation fingerprint | `53870a02…441e` | matches |

No existing record was modified.

## 2. Governing decisions (in force, unchanged)

- **INTENT-INTAKE-PO-DEC-001 (D1–D5):** intent intake exists; `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90` (D5, fixed,
  system-assigned); ServiceProfile opt-in is required for offer triggering (D3); intake does not bypass Research /
  Qualification (D4).
- **INTENT-INTAKE-PO-DEC-002:** E1 = A, E2 = A.

None of these decides an authorization or consent basis for AI-platform FIRST_PARTY signals.

## 3. Implementation facts (evidence only — not a policy selection)

From INTENT-SOURCE-ADAPTER-IMPL-REC-001 and INTENT-SOURCE-PROVIDER-CONTRACT-REC-001:

1. Three source families exist: public web / search, AI-platform acquisition, public-intent sources.
2. Provider results flow: provider contract → adapter → `normalizeIntentEvent` → `toIntentIntakeInput` →
   `recordIntentIntakeForOwner`. No second acquisition pipeline exists.
3. `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90`. ServiceProfile opt-in remains required for offer triggering.
4. Provider calls are currently prohibited. Maximum provider calls (1 per acquisition event) and retry behaviour
   (no automatic retries) are contractually constrained.
5. Personal identity, AI conversations / prompts, search history, cookies, device IDs, account IDs, click IDs and
   inferred AI usage are prohibited and rejected.
6. The provider layer reports AI-platform authorization metadata as `PRESENT` or `MISSING` but does not enforce it.
   It exposes `FIRST_PARTY_CONSENT_POLICY = 'PENDING_PRODUCT_OWNER_DECISION'` and `consentRequired = null` for
   FIRST_PARTY signals.

**Evidence discipline:** fact 6 is a deliberate placeholder that records the absence of a decision. That the code
currently accepts a signal with `MISSING` metadata is **not** evidence that the Product Owner has chosen to accept
such signals, and the wording of the implementation records is not a decision. No option below is favoured by the
current implementation.

## 4. Decision question

> Under what authorization / consent basis may a business-originated `FIRST_PARTY` signal, supplied through an
> AI-platform acquisition integration, be accepted into the AI Client Acquisition OS?

**In scope:** only the acceptance basis for FIRST_PARTY signals in the `AI_PLATFORM_ACQUISITION` family.

**Out of scope (separate questions, not decided here):**
- whether ChatGPT, Gemini or Claude expose such data;
- whether scraping is permitted;
- whether consumer conversations can be accessed;
- whether individual users can be identified;
- whether advertising platforms should be used;
- whether Google Search or Google Ads should be connected;
- pricing;
- lead scoring;
- offer ranking;
- persistence schema;
- duplicate handling.

## 5. Options (unranked — no recommendation)

The order below is presentational only.

**Option A — Explicit authorization required.**
Accept a FIRST_PARTY AI-platform signal only when the upstream integration provides explicit evidence that the
business authorized the sharing / use of the signal for acquisition.

**Option B — Contractual / business authorization.**
Accept the signal when the integration operates under documented contractual / business authorization sufficient for
the intended processing, without requiring a separate per-event consent field.

**Option C — No AI-platform FIRST_PARTY signals in MVP.**
Keep the AI-platform source family contractually defined, but reject all FIRST_PARTY AI-platform signals until a later
governance decision explicitly authorizes them.

**Option D — Other.**
The Product Owner specifies another exact authorization basis.

## 6. Questions left pending (not answered by this record)

1. What constitutes sufficient authorization evidence?
2. Is authorization required per integration, per business, per event, or another defined scope?
3. What minimum metadata must an authorized provider supply?
4. What happens when authorization metadata is `MISSING`?
5. Must authorization expire or be revocable?
6. What evidence must be retained for audit?
7. Does the same rule apply to all AI-platform sources, or does it vary by provider?
8. Does the decision apply only to `FIRST_PARTY`, leaving `PUBLIC_INTENT` unaffected?

## 7. Privacy boundary (preserved under every option)

No option, and no answer to §6, may relax any of the following:

- no individual-level AI conversation access;
- no ChatGPT / Gemini / Claude prompt capture;
- no user search history;
- no cookies;
- no device identifiers;
- no account identifiers;
- no click identifiers;
- no personal email / phone harvesting;
- no inference that a named individual uses an AI platform;
- no consumer-level behavioural surveillance.

The intended signal is a **business's own disclosed project / intent**, not an individual's private AI activity.
Every normalized signal continues to declare `personalDataUsed = false` and `individualIdentityRequired = false`.

## 8. Decision form (for the Product Owner)

```text
INTENT-INTAKE-PO-DEC-003 — AI-platform FIRST_PARTY authorization basis
Selected option: [ A | B | C | D ]
If D, exact basis: ______________________________________
Answers to §6 questions 1–8 (or "deferred" with reason): ____
Decided by / date: ______________________________________
```

Any implementation following the decision needs its own authorization and implementation record.

## 9. Execution counters (this preparation)

```text
Anthropic API calls: 0
Google Search calls: 0
Google Ads calls: 0
Google Places calls: 0
OpenAI API calls: 0
Gemini API calls: 0
Claude consumer access: 0
External HTTP requests: 0
Browser automation: 0
Live-source fetches: 0
Database connections: 0
Migrations executed: 0
Worker executions: 0
Searches submitted: 0
Participant contacts: 0
Validation sessions: 0
Production code changes: 0
Test changes: 0
Configuration changes: 0
Dependency changes: 0
Files created: 1 (this record)
```

**AI-PLATFORM FIRST_PARTY AUTHORIZATION DECISION PREPARATION COMPLETE — DECISION PENDING — NO PROVIDERS CALLED — NO
LIVE VALIDATION AUTHORIZED**
