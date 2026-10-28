# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization — Implementation Blockers — Product Owner Decision Preparation

**Decision ID (reserved):** INTENT-INTAKE-PO-DEC-004
**Status:** **PENDING PRODUCT OWNER DECISION**
**Raised by:** the post-decision implementation assessment of INTENT-INTAKE-PO-DEC-003 (working session,
2026-09-30), which reported three blockers and stopped with "IMPLEMENTATION BLOCKED — DECISION REQUIRED".
**Authorization for this record:** the Product Owner's instruction "Prepare a Product Owner decision record for the
three implementation blockers discovered after INTENT-INTAKE-PO-DEC-003" (2026-09-30). This record grants no
authority of its own.
**Governing decision:** INTENT-INTAKE-PO-DEC-003
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md`), sha256
`5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` — DECIDED, Option A. Not modified.
**DEC-003 preparation record:**
`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md`, sha256
`cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251`. Not modified.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

```text
INTENT-INTAKE-PO-DEC-004 .. PENDING — 3 BLOCKERS (AUDIT RETENTION, "WHO", EXPIRY / REVOCATION), OPTIONS UNRANKED
DEC-003 ................... DECIDED — OPTION A — UNCHANGED
IMPLEMENTATION ............ BLOCKED — NOT AUTHORIZED BY THIS RECORD
```

**This record authorizes nothing.** It:
- does **not** select an option or decide any question;
- does **not** change, reinterpret or supplement DEC-003 or its eight answers;
- does **not** authorize implementation, including the fail-closed authorization check described after DEC-003;
- does **not** authorize any schema change, migration, table, column or external store;
- does **not** change the provider contract, adapters, normalization or intake path;
- does **not** authorize any provider connection, credential, live API call, live-source fetch or Search submission;
- does **not** authorize participant contact or validation.

---

## 1. Baseline (verified before writing)

| Item | sha256 / value | Result |
|---|---|---|
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | matches |
| DEC-003 preparation record | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` | matches |
| INTENT-INTAKE-PO-DEC-001 | `52ee6164…7407` | matches |
| INTENT-INTAKE-PO-DEC-002 | `638b9aa3…32c4` | matches |
| INTENT-INTAKE-IMPL-REC-002 | `8dc2859a…a449` | matches |
| INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a01…dcce5` | matches |
| INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a8890…f459` | matches |
| Migration 0029 | `ca498e33…da21c` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Working tree | 203 uncommitted entries before this record | recorded |
| `INTENT-INTAKE-PO-DEC-004` | not used by any existing record | confirmed |

## 2. Facts established by DEC-003 (governing — unchanged)

**Selected option:** Option A — Explicit authorization required.

| # | DEC-003 answer (verbatim) |
|---|---|
| 1 | Explicit evidence from the upstream integration that the business authorized sharing/use of the signal for acquisition. |
| 2 | Per business and per integration. |
| 3 | Business identifier, authorization status, authorization scope, authorization timestamp, and integration identifier. |
| 4 | Reject the signal. |
| 5 | Yes — authorization must be revocable and have an expiry/review mechanism. |
| 6 | Retain authorization evidence sufficient to establish who authorized it, what was authorized, when, and through which integration. |
| 7 | Same rule for all AI-platform sources. |
| 8 | Yes — this decision applies only to FIRST_PARTY; PUBLIC_INTENT is unaffected. |

DEC-003 §4: Rationale and Decided by / date were returned as placeholders. That is a gap in DEC-003's form; it is not
one of the blockers in this record and is not resolved here.

## 3. Facts established by existing implementation records (context only — not decisions)

From INTENT-SOURCE-ADAPTER-IMPL-REC-001 (§5, §9) and INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 (§4, §6):

1. Intent provenance persists through existing columns only: `research_signal_sources.source_label`, `source_url`,
   `source_quote`, `research_signals.signal`, `research_signals.observed_at`, and `research_signals.created_at`
   (system capture time).
2. `externalId`, provider provenance, publication and authorization metadata exist on the normalized event / outcome
   only and are **not persisted**. Persisting them "needs a schema change and is not authorized"
   (PROVIDER-CONTRACT-REC-001 §6.3).
3. Intake persistence is append-only; replaying an event appends signals again. E1 = A reuses the existing
   Opportunity (ADAPTER-IMPL-REC-001 §9.1).
4. The provider layer reports AI-platform authorization metadata as `PRESENT` / `MISSING` and does not enforce it
   (PROVIDER-CONTRACT-REC-001 §2.2, §6.2). DEC-003 answer 4 now governs that behaviour; implementing it is not
   authorized by this record.
5. The provider-level privacy screen rejects personal-name keys (`personname`, `fullname`, `firstname`, `lastname`),
   email / phone keys and email / `mailto:` / `tel:` identifier values; every normalized signal declares
   `personalDataUsed = false` and `individualIdentityRequired = false` (PROVIDER-CONTRACT-REC-001 §3).
6. Downstream of intake, the existing path is Prospect → Research → Qualification → Opportunity → ServiceProfile
   opt-in → Offer / Next Action (PROVIDER-CONTRACT-REC-001 §2).

These facts describe the current code. None of them selects an option below.

## 4. Newly discovered open questions

Answers 5 and 6 of DEC-003 cannot be implemented without further Product Owner decisions:

- **Blocker 1 — Audit retention (answer 6).** The mechanism for retaining authorization evidence is not decided, and
  no schema change is authorized (fact 3.2).
- **Blocker 2 — Meaning of "who authorized it" (answer 6).** "Who" is not defined, and some readings interact with the
  privacy constraints (fact 3.5; §8).
- **Blocker 3 — Expiry / revocation (answer 5).** Duration, review interval, mechanism, effective time and treatment
  of already-stored and derived data are not specified.

## 5. Blocker 1 — Audit retention

**Question:** How must the authorization evidence required by DEC-003 answer 6 (who, what, when, which integration)
be retained?

Options (unranked; order presentational only). The consequences listed are factual observations, not a ranking.

- **Option 1-A — New dedicated authorization-evidence store in the application database.**
  Consequence: requires a schema change and migration, which would need explicit authorization.
- **Option 1-B — Additional structured fields on the existing intent-signal provenance tables.**
  Consequence: requires a schema change and migration, which would need explicit authorization.
- **Option 1-C — Evidence encoded in existing columns (e.g. `source_label` / `source_quote` text), no schema change.**
  Consequence: evidence becomes unstructured text inside fields that currently hold source evidence; existing field
  length limits apply (e.g. source label ≤ 100 characters).
- **Option 1-D — Evidence retained by the upstream integration or an external audit store; this system keeps only a
  reference.**
  Consequence: the audit depends on the external party's retention and availability; storing the reference itself
  may still require a schema change.
- **Option 1-E — Retention mechanism deferred; FIRST_PARTY AI-platform signals are not accepted until a retention
  mechanism is decided and implemented.**
  Consequence: under DEC-003 answer 4 and this option, no AI-platform FIRST_PARTY signal enters intake in the interim.
- **Option 1-F — Other.** The Product Owner specifies the exact mechanism.

**Sub-questions (answer or mark "deferred" with reason):**
- 1.1 How long must authorization evidence be retained?
- 1.2 Who may access the retained evidence?
- 1.3 Must retained evidence be immutable once written?
- 1.4 If the selected option requires a schema change, is that schema change authorized by this decision, or does it
  need a separate authorization?

## 6. Blocker 2 — Meaning of "who authorized it"

**Question:** In DEC-003 answer 6, what does "who authorized it" identify?

Existing privacy constraints that bear on this question (from the DEC-003 preparation §7 and fact 3.5):
`individualIdentityRequired = false`; no personal identifiers; no personal email / phone harvesting; no
individual-level AI activity; no inference about an individual's AI-platform use.

Options (unranked; order presentational only):

- **Option 2-A — The business / legal entity.**
  Privacy / governance consequence: consistent with `individualIdentityRequired = false` and the existing prohibitions;
  the retained evidence cannot show which person acted for the business.
- **Option 2-B — An authorized business role, without identifying a natural person** (e.g. a role title supplied by
  the integration).
  Privacy / governance consequence: no personal identifier is stored; where a role is held by one identifiable person
  (e.g. a sole trader), a role title may still point to that person.
- **Option 2-C — A named individual representative of the business.**
  Privacy / governance consequence: requires retaining personal data about the authorizing person. This is not
  compatible with the current `individualIdentityRequired = false` declaration or with the existing rejection of
  personal-name, email and phone data (fact 3.5), and would require a separate, explicit Product Owner decision
  changing that boundary for authorization evidence. It would not change the prospect-side prohibitions.
- **Option 2-D — An opaque reference to the integration's own authorization record**, with the identity of the
  authorizer held only by the integration.
  Privacy / governance consequence: this system holds no identity of the authorizer; establishing "who" depends on the
  integration's records.
- **Option 2-E — Other.** The Product Owner specifies the exact form.

This record makes no statement about legal requirements.

## 7. Blocker 3 — Expiry / revocation

**Question:** How are DEC-003 answer 5's revocability and expiry / review mechanism defined?

Each sub-question takes one option (unranked; order presentational only) or "Other".

**3.1 Authorization duration**
- 3.1-a Fixed duration set by the Product Owner (value to be supplied).
- 3.1-b Expiry supplied by the integration per authorization.
- 3.1-c Expiry supplied by the integration, capped at a maximum set by the Product Owner (value to be supplied).
- 3.1-d No fixed expiry; periodic review only (see 3.2).
- 3.1-e Other.

**3.2 Review interval**
- 3.2-a Fixed interval set by the Product Owner (value to be supplied).
- 3.2-b Interval defined per integration.
- 3.2-c Review only at expiry.
- 3.2-d Other.

**3.3 Revocation mechanism**
- 3.3-a The integration supplies a revocation event through the provider contract.
- 3.3-b Revocation recorded manually by an operator in this system.
- 3.3-c Both 3.3-a and 3.3-b.
- 3.3-d Authorization status is checked at the integration when a signal is used. Consequence: requires provider
  calls, which are currently prohibited, and would need separate provider authorization.
- 3.3-e Other.

**3.4 Effective time of revocation**
- 3.4-a When the revocation is received by this system.
- 3.4-b At the revocation timestamp supplied by the integration (which may be earlier than receipt).
- 3.4-c Other.

**3.5 Already-stored signals after revocation**
- 3.5-a Retained unchanged; only new signals are refused.
- 3.5-b Retained but marked inactive / suppressed from downstream use.
- 3.5-c Deleted.
- 3.5-d Other.
Fact: persistence is currently append-only (fact 3.3); 3.5-b and 3.5-c would change that behaviour for these signals.

**3.6 Already-created Opportunities**
- 3.6-a Unchanged.
- 3.6-b Flagged / annotated as derived from a revoked authorization.
- 3.6-c Re-evaluated through the existing Research / Qualification path.
- 3.6-d Closed / archived.
- 3.6-e Other.
Fact: E1 = A governs intake for a Prospect with an existing Opportunity; any option changing Opportunities must not be
read as changing E1 unless the Product Owner says so.

**3.7 Downstream outputs derived before revocation** (offers, next actions and other outputs of the existing path,
fact 3.6)
- 3.7-a Unchanged.
- 3.7-b Flagged.
- 3.7-c Suppressed / withdrawn.
- 3.7-d Regenerated without the revoked signal.
- 3.7-e Other.

**3.8 Expiry treatment**
- 3.8-a Expiry is treated the same as revocation for 3.4–3.7.
- 3.8-b Expiry is treated differently (Product Owner specifies).
- 3.8-c Other.

## 8. Privacy boundary (preserved under every option)

No option, and no answer in this record, may relax any of the following (DEC-003 preparation §7, DEC-003 §6):

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

Option 2-C is the only option that would retain personal data, and only if the Product Owner separately and
explicitly changes the boundary for authorization evidence.

**PUBLIC_INTENT is unaffected** by these FIRST_PARTY authorization questions (DEC-003 answer 8).

## 9. Product Owner decisions required

```text
INTENT-INTAKE-PO-DEC-004 — AI-platform FIRST_PARTY authorization: implementation blockers

Blocker 1 — Audit retention
  Selected option: [ 1-A | 1-B | 1-C | 1-D | 1-E | 1-F ]
  If 1-F, exact mechanism: ______________________________
  1.1 Retention period: ____________ (or "deferred" with reason)
  1.2 Access: ____________ (or "deferred" with reason)
  1.3 Immutable: [ yes | no ] (or "deferred" with reason)
  1.4 Schema change authorized by this decision: [ yes | no — separate authorization | not applicable ]

Blocker 2 — Meaning of "who authorized it"
  Selected option: [ 2-A | 2-B | 2-C | 2-D | 2-E ]
  If 2-E, exact form: ______________________________
  If 2-C, explicit boundary change for authorization evidence: ______________________________

Blocker 3 — Expiry / revocation
  3.1 Duration: [ a | b | c | d | e ]   value(s): ________
  3.2 Review interval: [ a | b | c | d ]   value: ________
  3.3 Revocation mechanism: [ a | b | c | d | e ]
  3.4 Effective time: [ a | b | c ]
  3.5 Stored signals: [ a | b | c | d ]
  3.6 Opportunities: [ a | b | c | d | e ]
  3.7 Downstream outputs: [ a | b | c | d | e ]
  3.8 Expiry treatment: [ a | b | c ]
  Any "Other" / "b" specification: ______________________________

Rationale (optional): ______________________________
Decided by / date: ______________________________
```

## 10. Implementation that remains unauthorized

- Any implementation of DEC-003, including the fail-closed authorization check before normalization.
- Any schema change, migration, table, column or external audit store.
- Any change to the provider contract, adapters, `normalizeIntentEvent`, `toIntentIntakeInput` or
  `recordIntentIntakeForOwner`.
- Any change to PUBLIC_INTENT semantics, D1–D5, E1, E2, scoring or ServiceProfile opt-in.
- Any live provider integration, credential, live API call, live-source fetch, Search submission or retry.
- Participant contact, validation, or resuming D11.

Implementation after DEC-004 requires its own authorization and implementation record.

## 11. Execution counters (this preparation)

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
Database writes: 0
Migrations executed: 0
Worker executions: 0
Searches submitted: 0
Manual retries: 0
Participant contacts: 0
Validation sessions: 0
Production code changes: 0
Test changes: 0
Configuration changes: 0
Dependency changes: 0
Files created: 1 (this record)
```

**DECISION PREPARATION CREATED — DEC-003 UNCHANGED — IMPLEMENTATION STILL BLOCKED — NO PROVIDERS — NO LIVE
VALIDATION**
