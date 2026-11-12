# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-004 1-B Schema / Migration Implementation Authorization — Product Owner Decision Preparation

**Decision ID (reserved):** INTENT-INTAKE-PO-DEC-005
**Status:** **PENDING PRODUCT OWNER DECISION**
**This preparation record makes no decision and grants no execution authority.**
**Authorization for this record:** the Product Owner's instruction to create a decision-preparation record only for
INTENT-INTAKE-PO-DEC-005, "Authorization to implement only the minimum schema change and migration required to support
DEC-004's already-decided audit-retention mechanism, option 1-B" (working session, 2026-09-30). This record grants no
authority of its own.
**Governing decision:** INTENT-INTAKE-PO-DEC-004
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_BLOCKERS_DECISION.md`), sha256
`0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` — DECIDED. Not modified.
**DEC-004 preparation record:**
`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_BLOCKERS_DECISION_PREPARATION.md`, sha256
`cbd5674abb2ae678f5d40a8a802b87bdf20192ff447dcea0803ba41fe3c2cbbc`. Not modified.
**Underlying decision:** INTENT-INTAKE-PO-DEC-003
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
INTENT-INTAKE-PO-DEC-005 .. PENDING — 1 DECISION (1-B SCHEMA / MIGRATION AUTHORIZATION), OPTIONS UNRANKED
DEC-004 ................... DECIDED — 1-B / 2-A / 3.1–3.8 = a — UNCHANGED
DEC-003 ................... DECIDED — OPTION A — UNCHANGED
SCHEMA / MIGRATION ........ NOT AUTHORIZED — NONE CREATED BY THIS RECORD
IMPLEMENTATION ............ BLOCKED — NOT AUTHORIZED BY THIS RECORD
```

**This record authorizes nothing.** It:
- does **not** select an option or decide any question;
- does **not** record DEC-005 as decided;
- does **not** change, reopen, reinterpret or supplement DEC-004 or DEC-003;
- does **not** authorize any schema change, migration, table, column, index, constraint or trigger;
- does **not** authorize creating, validating or executing a migration;
- does **not** authorize any production code, test, configuration or dependency change;
- does **not** authorize any database connection, read or write;
- does **not** authorize any provider connection, credential, live API call, external HTTP request, live-source fetch
  or Search submission;
- does **not** authorize participant contact or validation.

---

## 1. Baseline (verified before writing)

| Item | sha256 / value | Result |
|---|---|---|
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | matches; DECIDED |
| DEC-004 preparation record | `cbd5674abb2ae678f5d40a8a802b87bdf20192ff447dcea0803ba41fe3c2cbbc` | matches |
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | matches; DECIDED |
| DEC-003 preparation record | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` | matches |
| Implementation fingerprint | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Working tree | 205 uncommitted entries before this record | recorded |
| Latest migration in chain | `packages/db/prisma/migrations/0029_research_signal_intent_kinds` | recorded |
| `INTENT-INTAKE-PO-DEC-005` | not used by any existing record | confirmed |

## 2. Facts already decided by DEC-004 (governing — unchanged)

From DEC-004 §2–§3 (definitions verbatim from the DEC-004 preparation record):

**Blocker 1 — Audit retention**
- **Selected option 1-B — Additional structured fields on the existing intent-signal provenance tables.**
  Preparation-record consequence: "requires a schema change and migration, which would need explicit authorization."
- 1.1 Retention period: 90 days
- 1.2 Access: Read-only for Security Audit and Compliance teams via the centralized log aggregator
- 1.3 Immutable: yes
- 1.4 Schema change authorized by this decision: no — separate authorization

**Blocker 2 — "Who authorized it":** 2-A — The business / legal entity.

**Blocker 3 — Expiry / revocation**

| Sub-question | Selected | Definition | Value |
|---|---|---|---|
| 3.1 Authorization duration | 3.1-a | Fixed duration set by the Product Owner | 90 days |
| 3.2 Review interval | 3.2-a | Fixed interval set by the Product Owner | Quarterly |
| 3.3 Revocation mechanism | 3.3-a | The integration supplies a revocation event through the provider contract. | — |
| 3.4 Effective time | 3.4-a | When the revocation is received by this system. | — |
| 3.5 Already-stored signals | 3.5-a | Retained unchanged; only new signals are refused. | — |
| 3.6 Already-created Opportunities | 3.6-a | Unchanged. | — |
| 3.7 Downstream outputs | 3.7-a | Unchanged. | — |
| 3.8 Expiry treatment | 3.8-a | Expiry is treated the same as revocation for 3.4–3.7. | — |

DEC-004 Decided by: not supplied (DEC-004 §5). Not resolved here.

The evidence content that 1-B retains is set by DEC-003, not by this record:
- DEC-003 answer 3: "Business identifier, authorization status, authorization scope, authorization timestamp, and
  integration identifier."
- DEC-003 answer 6: "Retain authorization evidence sufficient to establish who authorized it, what was authorized,
  when, and through which integration." ("who" = 2-A, the business / legal entity.)

## 3. Implementation-record context (facts only — not decisions)

From INTENT-SOURCE-ADAPTER-IMPL-REC-001 (§5, §8, §9) and INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 (§4, §6, §7), and
the migration directory:

1. Intent provenance persists through existing columns only: `research_signal_sources.source_label`, `source_url`,
   `source_quote`, `research_signals.signal`, `research_signals.observed_at` and `research_signals.created_at`.
2. Authorization metadata exists on the normalized event / outcome only and is **not persisted**. "Persisting them
   needs a schema change and is not authorized" (PROVIDER-CONTRACT-REC-001 §6.3).
3. The provenance tables `research_signals` and `research_signal_sources` were introduced by the raw-SQL migration
   `packages/db/prisma/migrations/0016_research_signals/migration.sql` and altered by
   `0029_research_signal_intent_kinds`. Migrations in the chain are directories of the form
   `packages/db/prisma/migrations/NNNN_<name>/migration.sql`; the latest is `0029`.
4. Migration 0029 is not applied to the validation database (ADAPTER-IMPL-REC-001 §8). Applying it is listed as not
   authorized (DEC-003 §6). The repository therefore already treats applying a migration to a database as requiring
   its own authorization, separate from creating it.
5. Existing integration tests create throwaway databases on the local test server (`127.0.0.1:5433`, the harness
   default); the validation database (port 5434) is kept separate (PROVIDER-CONTRACT-REC-001 §7).
6. Intake persistence is append-only (DEC-004 preparation fact 3.3).
7. `packages/db/prisma/migrations-blocked/` holds migrations deliberately kept out of the chain; it is not part of this
   scope.

These facts describe the current repository. None of them selects an option below.

## 4. Purpose of DEC-005

DEC-004 selected option 1-B for audit retention and, under 1.4, explicitly withheld schema-change authorization
("no — separate authorization"). Option 1-B cannot be implemented without a schema change and migration. DEC-005 is
that separate authorization question.

**Question:** May the repository implement the minimum schema change and migration required to support DEC-004's
already-decided option 1-B audit-retention mechanism?

DEC-005 does **not** reopen DEC-004. Every DEC-004 selection and value in §2 is fixed input to this question.

## 5. Proposed minimum scope (what Options A and C would cover)

### 5.1 Tables

Only the existing intent-signal provenance tables implicated by DEC-004 option 1-B: `research_signals` and / or
`research_signal_sources` (fact 3.3). No new table. No other table.

### 5.2 Additional structured fields

Only the minimum structured fields necessary to hold the authorization evidence that 1-B retains (§2: DEC-003
answers 3 and 6, with "who" = 2-A).

**No field name, type, nullability, default, index, constraint or trigger is established by any repository record.**
This record does not invent them. They are listed as open implementation questions in §5.4.

### 5.3 Migration

Limited to:
- **creating** one new migration in the established location and form (fact 3.3) that introduces only the authorized
  fields;
- the minimum migration logic necessary to establish that schema (additive column definitions only);
- migration tests or structural validation strictly necessary to verify that migration.

**Creating / validating a migration is distinct from executing it against a database.** The proposed scope covers
creation and validation only. It does not cover executing the migration against the validation database or any
production database (§8).

### 5.4 Open implementation questions (not resolved by this record)

These cannot be established from the repository without a new design decision. Unless the Product Owner resolves them
in the DEC-005 form, an implementer reaching them must stop (§9, condition 18).

1. **Table placement.** Whether the evidence fields belong on `research_signals`, `research_signal_sources`, or both.
   No record establishes this.
2. **Field set.** The exact mapping of DEC-003 answer 3's five items (business identifier, authorization status,
   authorization scope, authorization timestamp, integration identifier) to columns, including whether any existing
   column already serves one of them. Field names, types, lengths and nullability are not established.
3. **Existing rows.** Existing rows (including all PUBLIC_INTENT and non-AI-platform signals) have no authorization
   evidence. Any new field that is not nullable and has no default would require a value for existing rows, which is a
   backfill / data transformation (§7) and outside the proposed scope.
4. **Immutability (1.3 = yes).** Whether any database-level immutability mechanism (e.g. a trigger or constraint) is
   part of the "minimum schema", or whether immutability is runtime behavior. Not established. It is not included in
   the proposed scope unless the Product Owner explicitly includes it.
5. **Retention (1.1 = 90 days) and access (1.2).** Whether any schema element is needed to support 90-day retention or
   read-only access via the centralized log aggregator. Not established. Retention enforcement, deletion and
   log-aggregator integration are excluded (§6).
6. **Expiry / revocation state (3.1–3.8).** Whether expiry, review or revocation state belongs in the 1-B evidence
   fields. 1-B is Blocker 1's retention mechanism; Blocker 3 did not select a storage mechanism. Not included in the
   proposed scope unless the Product Owner explicitly includes it.
7. **Indexes / constraints.** Whether any index or constraint is required. Not established; none is included unless
   explicitly authorized.
8. **Validation database.** Whether migration tests against throwaway databases on the local test server
   (`127.0.0.1:5433`, fact 3.5) count as a permitted database connection for "structural validation". The safety
   counters in every prior record report database connections as 0; the Product Owner must state whether this is
   permitted.

## 6. What DEC-005 would not authorize

Approval of DEC-005 (under any option, unless the Product Owner's decision explicitly states otherwise) would **not**
authorize:

**Policy changes**
- changing DEC-004;
- changing the 90-day retention period;
- changing the quarterly review interval;
- changing access restrictions;
- changing immutability;
- changing 2-A authorization identity;
- changing expiry semantics;
- changing revocation semantics;
- changing treatment of stored signals;
- changing treatment of Opportunities;
- changing downstream-output treatment;
- changing PUBLIC_INTENT.

**Runtime behavior**
- implementing retention enforcement;
- deleting records after 90 days;
- implementing expiry;
- implementing revocation;
- refusing new signals;
- changing Opportunity behavior;
- changing downstream outputs;
- provider event generation;
- provider event consumption.

**External activity**
- Anthropic API calls;
- OpenAI API calls;
- Gemini API calls;
- Google Search;
- Google Places;
- Google Ads;
- external HTTP;
- live-source fetching;
- browser automation.

**Operational activity**
- database connections;
- database writes;
- production migration execution;
- worker execution;
- participant contact;
- participant interaction;
- live validation;
- validation sessions.

**Other engineering work**
- unrelated refactoring;
- unrelated schema cleanup;
- new architectural components;
- dependency changes;
- configuration changes;
- unrelated migrations;
- unrelated tests.

Also not authorized: implementing DEC-003 (including the fail-closed authorization check before normalization);
changing the provider contract, adapters, `normalizeIntentEvent`, `toIntentIntakeInput` or
`recordIntentIntakeForOwner`; writing authorization evidence into the new fields; centralized-log-aggregator
integration; any change to `packages/db/prisma/migrations-blocked/`; applying migration 0029.

## 7. Data safety boundary

The proposed DEC-005 authorization would **not** automatically authorize:

- destructive deletion;
- rewriting existing provenance records;
- changing existing intent signals;
- changing existing Opportunities;
- modifying downstream outputs;
- historical backfills;
- data transformation.

A schema migration does not authorize data mutation. If implementing the minimum schema requires any of the above
(see open question 5.4.3), that requires a separate Product Owner decision or explicit authorization.

## 8. Migration execution boundary

Two distinct authorizations:

1. **Authorization to create the migration** — writing the migration file(s) and the strictly necessary migration
   tests / structural validation (§5.3). This is what Options A and C would cover.
2. **Authorization to execute the migration against a database** — running it against the validation database or any
   production database. **The proposed DEC-005 scope does not include this.**

Repository convention (fact 3.4) already requires separate authorization before a migration is applied: migration 0029
remains unapplied to the validation database and applying it is listed as not authorized. That requirement is
preserved. Whether migration tests may run against throwaway local test databases is open question 5.4.8.

## 9. Stop conditions

Implementation under any eventual DEC-005 authorization must **stop and seek further authorization** if any of the
following occurs:

1. DEC-004 must be changed to implement the schema.
2. More schema elements are required than the minimum necessary for option 1-B.
3. A new table is required but is not explicitly authorized.
4. Existing data must be destructively modified.
5. Historical data must be rewritten or backfilled.
6. Runtime retention behavior must be implemented.
7. Expiry behavior must be implemented.
8. Revocation behavior must be implemented.
9. Provider calls are required.
10. External HTTP requests are required.
11. A production database connection is required.
12. A production migration must be executed.
13. Participant contact is required.
14. Live validation is required.
15. A privacy boundary must change.
16. PUBLIC_INTENT must change.
17. Any existing governance decision must be changed.
18. An implementation choice cannot be derived without introducing a new product/governance decision.
19. The work expands beyond the minimum schema/migration scope.
20. The implementation requires an assumption not explicitly authorized by DEC-004 or the eventual DEC-005 decision.

When a stop condition is encountered, implementation stops; authorization is not inferred.

## 10. Product Owner options

Options (unranked; order presentational only). No option is recommended.

- **Option A — AUTHORIZE.** Authorize the minimum schema change and migration required for DEC-004 option 1-B, within
  the exact boundaries defined by this preparation record (§5–§9).
  This does not authorize runtime retention, expiry, revocation, provider calls, production migration execution, or any
  other non-authorized activity (§6–§8).
- **Option B — DO NOT AUTHORIZE.** Do not authorize the schema / migration work.
  DEC-004 remains decided, but implementation of option 1-B remains blocked.
- **Option C — AUTHORIZE WITH ADDITIONAL RESTRICTIONS.** Authorize the minimum schema / migration scope subject to
  additional Product Owner restrictions specified in the decision. The additional restrictions must be recorded
  explicitly.
- **Option D — OTHER.** The Product Owner specifies a different authorization boundary.
  Exact authorization: ______________________________

Under Options A and C, the open implementation questions in §5.4 remain open unless the Product Owner answers them in
the scope fields of §11; an implementer reaching an unanswered one stops (§9, condition 18).

## 11. Product Owner decision required

**Blank fields are not permissions.** Any field left blank, or returned as a placeholder, grants nothing and is
recorded as not supplied.

```text
INTENT-INTAKE-PO-DEC-005 — DEC-004 1-B Schema / Migration Implementation Authorization

Selected option:
[ A — AUTHORIZE |
  B — DO NOT AUTHORIZE |
  C — AUTHORIZE WITH ADDITIONAL RESTRICTIONS |
  D — OTHER ]

If C, additional restrictions:
____________________________________________

If D, exact authorization:
____________________________________________

Authorized schema scope:
____________________________________________

Authorized migration scope:
____________________________________________

Explicitly excluded scope:
____________________________________________

Production migration execution authorized:
[ yes | no | separate authorization ]

Existing-data mutation authorized:
[ yes | no | separate authorization ]

Runtime retention/expiry/revocation implementation authorized:
[ yes | no | separate authorization ]

Provider/API calls authorized:
[ yes | no | separate authorization ]

Rationale (optional):
____________________________________________

Decided by / date:
____________________________________________
```

## 12. Unchanged commitments (regardless of the eventual DEC-005 decision)

- DEC-004 remains unchanged.
- DEC-004's 1-B selection remains unchanged.
- The 90-day retention policy remains unchanged.
- The access rule remains unchanged.
- Immutability remains unchanged.
- 2-A remains unchanged.
- 3.1–3.8 remain unchanged.
- PUBLIC_INTENT remains unaffected.
- No participant authority is granted.
- No live-validation authority is granted.
- No provider-call authority is granted.
- No production database execution authority is granted merely by creating the preparation record.
- This preparation record itself authorizes nothing.

The privacy boundary (DEC-004 preparation §8) is unchanged and applies in full: no individual-level AI conversation
access; no ChatGPT / Gemini / Claude prompt capture; no user search history; no cookies; no device, account or click
identifiers; no personal email / phone harvesting; no inference that a named individual uses an AI platform; no
consumer-level behavioural surveillance.

Implementation after DEC-005 requires the DEC-005 decision record and its own implementation record.

## 13. Execution counters (this preparation)

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

**DEC-005 DECISION PREPARATION CREATED — PENDING PRODUCT OWNER DECISION — DEC-004 / DEC-003 UNCHANGED — NO SCHEMA
CHANGE — NO MIGRATION — NO PROVIDERS — NO LIVE VALIDATION**
