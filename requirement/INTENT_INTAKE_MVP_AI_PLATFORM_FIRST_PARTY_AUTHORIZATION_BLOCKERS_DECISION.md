# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization — Implementation Blockers — Product Owner Decision

**Decision ID:** INTENT-INTAKE-PO-DEC-004
**Status:** **DECIDED — 1-B / 2-A / 3.1–3.8 = a**
**Decision date:** 2026-09-30
**Decided by:** not supplied (see §5)
**Preparation record:**
`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_BLOCKERS_DECISION_PREPARATION.md`
(INTENT-INTAKE-PO-DEC-004 preparation), sha256 `cbd5674abb2ae678f5d40a8a802b87bdf20192ff447dcea0803ba41fe3c2cbbc`
(verified before this record was written; not modified).
**Source of the decision:** the Product Owner's DEC-004 selections supplied in the working session on 2026-09-30,
reproduced in §2. Nothing in this record is inferred.
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
INTENT-INTAKE-PO-DEC-004 .. DECIDED — BLOCKER 1 = 1-B, BLOCKER 2 = 2-A, BLOCKER 3 = 3.1–3.8 ALL "a"
DEC-003 ................... DECIDED — OPTION A — UNCHANGED
IMPLEMENTATION ............ NOT PERFORMED AND NOT AUTHORIZED BY THIS RECORD (see §7)
SCHEMA CHANGE ............. NOT AUTHORIZED — 1.4 = "no — separate authorization"
PROVIDERS / VALIDATION .... NOT AUTHORIZED BY THIS RECORD
```

---

## 1. Decision question (from the preparation record §4)

Answers 5 and 6 of DEC-003 could not be implemented without further Product Owner decisions on three blockers:

- **Blocker 1 — Audit retention (DEC-003 answer 6).**
- **Blocker 2 — Meaning of "who authorized it" (DEC-003 answer 6).**
- **Blocker 3 — Expiry / revocation (DEC-003 answer 5).**

## 2. Product Owner decision (as supplied)

```text
INTENT-INTAKE-PO-DEC-004 — AI-platform FIRST_PARTY authorization: implementation blockers

Blocker 1 — Audit retention
  Selected option: 1-B
  1.1 Retention period: 90 days
  1.2 Access: Read-only for Security Audit and Compliance teams via the centralized log aggregator
  1.3 Immutable: yes
  1.4 Schema change authorized by this decision: no — separate authorization

Blocker 2 — Meaning of "who authorized it"
  Selected option: 2-A
  No 2-E exact-form specification applies.
  No 2-C privacy-boundary change applies.

Blocker 3 — Expiry / revocation
  3.1 Duration: a   value: 90 days
  3.2 Review interval: a   value: Quarterly
  3.3 Revocation mechanism: a
  3.4 Effective time: a
  3.5 Stored signals: a
  3.6 Opportunities: a
  3.7 Downstream outputs: a
  3.8 Expiry treatment: a
  No additional "Other" / "b" specification was supplied.

Decision date: 2026-09-30
Decided by: NOT SUPPLIED
```

## 3. Selections and their definitions (definitions verbatim from the preparation record)

### 3.1 Blocker 1 — Audit retention (preparation §5)

**Selected option:** **1-B — Additional structured fields on the existing intent-signal provenance tables.**
Preparation-record consequence: "requires a schema change and migration, which would need explicit authorization."

| Sub-question (preparation §5) | Product Owner answer |
|---|---|
| 1.1 How long must authorization evidence be retained? | 90 days |
| 1.2 Who may access the retained evidence? | Read-only for Security Audit and Compliance teams via the centralized log aggregator |
| 1.3 Must retained evidence be immutable once written? | yes |
| 1.4 Is the schema change authorized by this decision, or does it need a separate authorization? | no — separate authorization |

Per 1.4, this decision does **not** authorize the schema change or migration that option 1-B requires. That change
remains unauthorized until a separate authorization is given.

### 3.2 Blocker 2 — Meaning of "who authorized it" (preparation §6)

**Selected option:** **2-A — The business / legal entity.**
Preparation-record consequence: "consistent with `individualIdentityRequired = false` and the existing prohibitions;
the retained evidence cannot show which person acted for the business."

No 2-E exact form and no 2-C privacy-boundary change apply. No identity, representative or privacy-boundary change
beyond option 2-A as defined in the preparation record is recorded or inferred.

### 3.3 Blocker 3 — Expiry / revocation (preparation §7)

| Sub-question | Selected | Definition (preparation §7) | Value |
|---|---|---|---|
| 3.1 Authorization duration | 3.1-a | Fixed duration set by the Product Owner (value to be supplied). | 90 days |
| 3.2 Review interval | 3.2-a | Fixed interval set by the Product Owner (value to be supplied). | Quarterly |
| 3.3 Revocation mechanism | 3.3-a | The integration supplies a revocation event through the provider contract. | — |
| 3.4 Effective time of revocation | 3.4-a | When the revocation is received by this system. | — |
| 3.5 Already-stored signals after revocation | 3.5-a | Retained unchanged; only new signals are refused. | — |
| 3.6 Already-created Opportunities | 3.6-a | Unchanged. | — |
| 3.7 Downstream outputs derived before revocation | 3.7-a | Unchanged. | — |
| 3.8 Expiry treatment | 3.8-a | Expiry is treated the same as revocation for 3.4–3.7. | — |

No additional "Other" / "b" specification was supplied.

## 4. Deferred items

None. Every question on the preparation §9 form received a selection or value; none was marked deferred.

## 5. Fields not supplied

- **Decided by:** not supplied. The Product Owner's submission states "NOT SUPPLIED — do not invent a name or role."
  No name or role is recorded or inferred. This follows the DEC-003 precedent (DEC-003 §4). The Product Owner may
  complete this field.
- **Rationale (optional):** not supplied. No rationale is recorded or inferred.
- **Decision date:** supplied — 2026-09-30.

## 6. Unselected options (preserved, unranked)

As defined in the preparation record, order presentational only:

- **Blocker 1:** 1-A (new dedicated authorization-evidence store), 1-C (evidence encoded in existing columns),
  1-D (external / upstream retention with reference), 1-E (retention deferred; signals not accepted meanwhile),
  1-F (Other).
- **Blocker 2:** 2-B (authorized business role), 2-C (named individual representative), 2-D (opaque reference to the
  integration's authorization record), 2-E (Other).
- **Blocker 3:** 3.1-b/c/d/e, 3.2-b/c/d, 3.3-b/c/d/e, 3.4-b/c, 3.5-b/c/d, 3.6-b/c/d/e, 3.7-b/c/d/e, 3.8-b/c.

## 7. Governance decision vs. implementation authorization

This record captures **governance decisions only**. It does **not** authorize implementation of any of them.

In particular, the following are **not** authorized by this record:

- the schema change / migration required by option 1-B (1.4 = "no — separate authorization");
- implementing 90-day retention, read-only Security Audit / Compliance access, centralized-log-aggregator
  integration or immutability of authorization evidence;
- implementing the 90-day authorization duration, quarterly review, revocation events, revocation effective time or
  expiry handling;
- implementing DEC-003, including the fail-closed authorization check before normalization;
- any change to the provider contract, adapters, `normalizeIntentEvent`, `toIntentIntakeInput` or
  `recordIntentIntakeForOwner`;
- any change to PUBLIC_INTENT semantics, D1–D5, E1, E2, scoring or ServiceProfile opt-in;
- any database connection, read or write, or migration execution;
- any live provider integration, credential, live API call (Anthropic, OpenAI, Gemini, Google Search, Google Places,
  Google Ads), external HTTP request, live-source fetch, worker execution, Search submission or retry;
- participant contact or interaction, validation, a validation session, or resuming D11;
- configuration or dependency changes.

Implementation after DEC-004 requires its own authorization and implementation record, and the 1-B schema change
additionally requires the separate authorization named in 1.4.

**Privacy boundary** (preparation §8) is unchanged and applies in full: no individual-level AI conversation access;
no ChatGPT / Gemini / Claude prompt capture; no user search history; no cookies; no device, account or click
identifiers; no personal email / phone harvesting; no inference that a named individual uses an AI platform; no
consumer-level behavioural surveillance. **PUBLIC_INTENT is unaffected** (DEC-003 answer 8).

## 8. Execution counters (this record)

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

**INTENT-INTAKE-PO-DEC-004 DECIDED — DEC-003 UNCHANGED — IMPLEMENTATION NOT AUTHORIZED — SCHEMA CHANGE SEPARATELY
UNAUTHORIZED — NO PROVIDERS — NO LIVE VALIDATION**
