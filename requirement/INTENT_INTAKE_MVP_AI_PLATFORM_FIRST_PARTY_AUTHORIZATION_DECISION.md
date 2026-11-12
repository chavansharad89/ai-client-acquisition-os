# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Basis — Product Owner Decision

**Decision ID:** INTENT-INTAKE-PO-DEC-003
**Status:** **DECIDED — Option A**
**Preparation record:** `requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md`
(INTENT-INTAKE-PO-DEC-003 preparation), sha256 `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251`
(verified before this record was written; not modified).
**Source of the decision:** the Product Owner's DEC-003 selection supplied in the working session on 2026-09-30,
reproduced verbatim in §2. Nothing in this record is inferred.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

```text
INTENT-INTAKE-PO-DEC-003 .. DECIDED — OPTION A (EXPLICIT AUTHORIZATION REQUIRED)
IMPLEMENTATION ............ NOT PERFORMED BY THIS RECORD (see §6)
PROVIDERS / VALIDATION .... NOT AUTHORIZED BY THIS RECORD
```

---

## 1. Decision question (from the preparation record §4)

> Under what authorization / consent basis may a business-originated `FIRST_PARTY` signal, supplied through an
> AI-platform acquisition integration, be accepted into the AI Client Acquisition OS?

Scope: only the acceptance basis for FIRST_PARTY signals in the `AI_PLATFORM_ACQUISITION` family. The out-of-scope
list in preparation §4 remains out of scope and undecided.

## 2. Product Owner decision (verbatim)

```text
DEC-003
Option: A

1. Explicit evidence from the upstream integration that the business authorized sharing/use of the signal for acquisition.
2. Per business and per integration.
3. Business identifier, authorization status, authorization scope, authorization timestamp, and integration identifier.
4. Reject the signal.
5. Yes — authorization must be revocable and have an expiry/review mechanism.
6. Retain authorization evidence sufficient to establish who authorized it, what was authorized, when, and through which integration.
7. Same rule for all AI-platform sources.
8. Yes — this decision applies only to FIRST_PARTY; PUBLIC_INTENT is unaffected.

Rationale: [optional]
Decided by/date: [name/date]
```

**Selected option:** **Option A — Explicit authorization required.** As defined in preparation §5: "Accept a
FIRST_PARTY AI-platform signal only when the upstream integration provides explicit evidence that the business
authorized the sharing / use of the signal for acquisition."

## 3. Answers to the preparation §6 questions (as supplied)

| # | Question (preparation §6) | Product Owner answer |
|---|---|---|
| 1 | What constitutes sufficient authorization evidence? | Explicit evidence from the upstream integration that the business authorized sharing/use of the signal for acquisition. |
| 2 | Per integration, per business, per event, or another scope? | Per business and per integration. |
| 3 | Minimum metadata an authorized provider must supply? | Business identifier, authorization status, authorization scope, authorization timestamp, and integration identifier. |
| 4 | What happens when authorization metadata is `MISSING`? | Reject the signal. |
| 5 | Must authorization expire or be revocable? | Yes — authorization must be revocable and have an expiry/review mechanism. |
| 6 | What evidence must be retained for audit? | Retain authorization evidence sufficient to establish who authorized it, what was authorized, when, and through which integration. |
| 7 | Same rule for all AI-platform sources, or per provider? | Same rule for all AI-platform sources. |
| 8 | Only FIRST_PARTY, leaving PUBLIC_INTENT unaffected? | Yes — this decision applies only to FIRST_PARTY; PUBLIC_INTENT is unaffected. |

All eight questions are answered; none is recorded as deferred.

## 4. Fields not supplied

- **Rationale:** not supplied. The form was returned with the placeholder `[optional]`; no rationale is recorded or
  inferred.
- **Decided by / date:** not supplied. The form was returned with the placeholder `[name/date]`. This record notes only
  that the selection was received in the working session on 2026-09-30. The Product Owner may complete this field; no
  name is inferred.

## 5. Unselected options (preserved, unranked)

As defined in preparation §5, order presentational only:

- **Option B — Contractual / business authorization.** Accept the signal when the integration operates under
  documented contractual / business authorization sufficient for the intended processing, without requiring a
  separate per-event consent field.
- **Option C — No AI-platform FIRST_PARTY signals in MVP.** Keep the AI-platform source family contractually defined,
  but reject all FIRST_PARTY AI-platform signals until a later governance decision explicitly authorizes them.
- **Option D — Other.** The Product Owner specifies another exact authorization basis.

## 6. Evidence discipline and boundary

- The implementation facts in preparation §3 are context only. The decision comes solely from §2 of this record. The
  current code's acceptance of `MISSING` metadata was not a decision and is superseded by answer 4 once implemented.
- Privacy boundary (preparation §7) is unchanged and applies in full: no individual-level AI conversation access; no
  ChatGPT / Gemini / Claude prompt capture; no user search history; no cookies; no device, account or click
  identifiers; no personal email / phone harvesting; no inference that a named individual uses an AI platform; no
  consumer-level behavioural surveillance.
- Unchanged: D1–D5 (including `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90`, D3 opt-in, D4), E1 = A, E2 = A, and
  PUBLIC_INTENT semantics (answer 8).
- This record does **not** authorize: live providers or credentials, live API calls, live-source fetches, Search
  submission or retry, participant contact, validation, or applying migration 0029. Per preparation §8, any
  implementation needs its own authorization and implementation record.

## 7. Execution counters (this record)

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

**INTENT-INTAKE-PO-DEC-003 DECIDED — OPTION A — NO PROVIDERS CALLED — NO LIVE VALIDATION AUTHORIZED**
