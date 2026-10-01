# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-005 §5.4 Schema Design Questions — Product Owner Decision Preparation

**Decision ID (reserved):** INTENT-INTAKE-PO-DEC-005-SCHEMA
**Status:** **PENDING PRODUCT OWNER DECISION**

> **This record is decision preparation only. It makes no schema decision, grants no implementation authority, and
> does not authorize database access, migration creation, migration execution, code changes, provider calls, or
> runtime behavior changes.**

**Authorization for this record:** the Product Owner's instruction to "Prepare the unresolved DEC-005 §5.4
schema-design questions as a separate governance-only decision-preparation record" (working session, 2026-09-30).
This record grants no authority of its own.
**Parent question:** INTENT-INTAKE-PO-DEC-005 preparation
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DECISION_PREPARATION.md`),
sha256 `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819` — PENDING PRODUCT OWNER DECISION. Not
modified.
**Governing decision:** INTENT-INTAKE-PO-DEC-004
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_BLOCKERS_DECISION.md`), sha256
`0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` — DECIDED. Not modified.
**Underlying decision:** INTENT-INTAKE-PO-DEC-003
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md`), sha256
`5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` — DECIDED, Option A. Not modified.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

```text
INTENT-INTAKE-PO-DEC-005-SCHEMA .. PENDING — 8 SCHEMA-DESIGN QUESTIONS (DEC-005 §5.4), OPTIONS UNRANKED
INTENT-INTAKE-PO-DEC-005 ......... PENDING PRODUCT OWNER DECISION — UNCHANGED
DEC-004 .......................... DECIDED — 1-B / 2-A / 3.1–3.8 = a — UNCHANGED
DEC-003 .......................... DECIDED — OPTION A — UNCHANGED
SCHEMA / MIGRATION ............... NOT AUTHORIZED — NONE CREATED BY THIS RECORD
IMPLEMENTATION ................... BLOCKED — NOT AUTHORIZED BY THIS RECORD
```

Option labels in this record (e.g. "1-B", "2-A") are local to INTENT-INTAKE-PO-DEC-005-SCHEMA. They are not DEC-004's
option labels; where DEC-004 is referenced, it is referenced as "DEC-004 1-B", "DEC-004 2-A", etc.

This record keeps four things separate:
1. **Repository evidence** (§2) — what the repository establishes.
2. **Implementation analysis** — the factual consequence stated under each option (§4–§11).
3. **Product Owner decisions** — the selections requested in §14.
4. **Implementation authorization** — governed by DEC-005 alone, not by this record (§12, §13).

---

## 1. Baseline (verified before writing)

| Item | sha256 / value | Result |
|---|---|---|
| DEC-005 preparation record | `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819` | matches; PENDING PRODUCT OWNER DECISION |
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | matches; DECIDED |
| DEC-004 preparation record | `cbd5674abb2ae678f5d40a8a802b87bdf20192ff447dcea0803ba41fe3c2cbbc` | matches |
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | matches; DECIDED |
| DEC-003 preparation record | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` | matches |
| Implementation fingerprint | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | matches |
| `packages/db/prisma` tree (sorted per-file sha256, hashed) | `86fec394c87ebeb384276fb099b8288d225e26f182277e17ccfffe0086102e2d` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Working tree | 206 uncommitted entries before this record | recorded |
| `INTENT-INTAKE-PO-DEC-005-SCHEMA` | not used by any existing record | confirmed |
| Existing record covering DEC-005 §5.4 decisions | none | confirmed |

**ID choice:** the ID `INTENT-INTAKE-PO-DEC-005-SCHEMA` is the one named in the Product Owner's decision-form
structure for this task. It marks this record as a sub-decision of DEC-005 rather than an independent decision.
`INTENT-INTAKE-PO-DEC-006` remains unused.

No database was connected to establish any fact below.

## 2. Repository evidence (facts only)

### 2.1 DEC-003 authorization-evidence items (authoritative wording)

DEC-003 answer 3 (verbatim): "Business identifier, authorization status, authorization scope, authorization timestamp,
and integration identifier."

The five items are therefore:

| # | Item (DEC-003 answer 3) |
|---|---|
| E1 | Business identifier |
| E2 | Authorization status |
| E3 | Authorization scope |
| E4 | Authorization timestamp |
| E5 | Integration identifier |

DEC-003 answer 6 (verbatim): "Retain authorization evidence sufficient to establish who authorized it, what was
authorized, when, and through which integration." DEC-004 2-A fixes "who" as the business / legal entity.
DEC-003 answer 2: "Per business and per integration."

### 2.2 The provenance tables (migration `0016_research_signals`, altered by `0029_research_signal_intent_kinds`)

`research_signals` columns (0016): `id` TEXT NOT NULL (PK), `prospect_id` TEXT NOT NULL (FK → `prospects.id`, ON DELETE
CASCADE), `field` TEXT NOT NULL, `kind` TEXT NOT NULL, `classification` TEXT NOT NULL, `signal` TEXT (NULL only for
UNKNOWN), `confidence` INTEGER NOT NULL, `basis` TEXT, `observed_at` TIMESTAMP(3) NOT NULL, `superseded_at`
TIMESTAMP(3), `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP.
Constraints: PK; FK to `prospects`; CHECKs on `classification`, `kind` (widened by 0029 to include `PUBLIC_INTENT` and
`FIRST_PARTY`), `confidence` range, and signal-null-iff-UNKNOWN. Indexes: `research_signals_prospect_id_idx`;
partial `research_signals_prospect_id_active_idx` (`WHERE superseded_at IS NULL`).

`research_signal_sources` columns (0016): `id` TEXT NOT NULL (PK), `signal_id` TEXT NOT NULL (FK →
`research_signals.id`, ON DELETE CASCADE), `source_url` TEXT NOT NULL, `source_quote` TEXT NOT NULL, `source_label`
TEXT NOT NULL, `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP. Index:
`research_signal_sources_signal_id_idx`.

Granularity (0016 comments): `research_signals` is "One row per claim (Observation), append-only".
`research_signal_sources` is "zero-or-more rows per signal"; per 0016, OBSERVED signals carry one or more, INFERRED
and UNKNOWN carry none. `research_signals` carries no `user_id`; ownership is inherited through `prospect_id`.

Migration 0029 states: "No new Signal table: intake signals reuse research_signals / research_signal_sources exactly as
migration 0016 defined them."

### 2.3 Persistence code (`packages/core-research/src/pgRepository.ts`)

- Writes: `INSERT INTO research_signals`, `INSERT INTO research_signal_sources`, and one
  `UPDATE research_signals SET superseded_at = $2` (`supersedePrevious`).
- The file's comment states it inserts rows, never upserts, and that `supersedePrevious` only sets `superseded_at`.
- The "append-only" property is therefore application-level. No trigger, rule or database-level immutability
  mechanism exists on either provenance table (no trigger / function is created in 0016 or 0029).
- Rows can be removed by `ON DELETE CASCADE` from `prospects` (0016).
- Repository evidence does not establish whether the intent-intake path calls `supersedePrevious`.

### 2.4 Provider contract (`packages/core-research/src/intentSourceProviderContract.ts`)

- `AiPlatformAuthorization` has exactly: `integrationId: string`, `basis: string`, `reference: string | null`.
- `AiPlatformProviderSignal` carries `business: ProviderBusinessIdentity | null` and `authorization:
  AiPlatformAuthorization | null`.
- The outcome notes report authorization as `'NOT_APPLICABLE' | 'PRESENT' | 'MISSING'`.
- Repository evidence does not establish a contract field for E2 (authorization status as supplied by the
  integration), E3 (authorization scope) or E4 (authorization timestamp). Whether `basis` or `reference` corresponds to
  any of E2–E4 is not established. Changing the provider contract is not authorized (DEC-005 preparation §6).

### 2.5 Existing columns vs. the five items

Repository evidence does not establish that any existing column represents E1–E5:
- `prospect_id` references the system's Prospect; repository evidence does not establish that it is the business
  identifier supplied by the integration (E1).
- `source_label` holds source family / type text (ADAPTER-IMPL-REC-001 §5); it is not established as the integration
  identifier (E5).
- `created_at` / `observed_at` are the system capture time and the observation time; neither is established as the
  authorization timestamp (E4).
- No existing column is established as E2 or E3.

### 2.6 Migration and schema conventions

- Migrations are raw SQL at `packages/db/prisma/migrations/NNNN_<name>/migration.sql`; latest is `0029`. The research
  tables are not modelled in `packages/db/prisma/schema.prisma`.
- 0016 and 0029 describe themselves as "Additive only"; 0016: "Nothing existing is altered, dropped, or backfilled."
- `JSONB` columns are used in other migrations (0001, 0007, 0011, 0018, 0022, 0023, 0024, 0025, 0027); not in the
  provenance tables.
- Database-level triggers are used in 0003, 0004, 0009 and 0011. 0009 includes a trigger that raises
  `captured_payment_frozen … amount and currency are immutable` on the `payments` table.
- Retention precedent: 0011 (`webhook_payload_retention`) adds a nullable audit column `payload_redacted_at` to
  `webhook_events` for a 180-day retention policy documented in `docs/SECURITY.md`. That policy concerns a different
  table and is context only.
- The only column defaults on the provenance tables are `created_at DEFAULT CURRENT_TIMESTAMP`. Repository evidence
  does not establish any default value for authorization evidence.
- Repository evidence does not establish any centralized log aggregator: no reference to one exists outside
  `requirement/`.

### 2.7 Test-database convention

Existing integration tests create throwaway databases on the local test server `127.0.0.1:5433` (harness default); the
validation database is port 5434 (PROVIDER-CONTRACT-REC-001 §7). Every prior governance record reports "Database
connections: 0" for its own execution.

## 3. How to read §4–§11

Each section states one DEC-005 §5.4 question, then unranked options (order presentational only). The consequence
listed under each option is a factual schema observation, not a ranking. No option is recommended. No option is
currently implemented.

## 4. Question 1 — Which table or tables receive the new fields?

Candidate tables (§2.2): `research_signals`, `research_signal_sources`. A new table is not authorized (DEC-004 1-B:
"existing intent-signal provenance tables"; DEC-005 preparation §5.1).

- **1-A — Add the authorized fields only to `research_signals`.**
  Consequence: evidence is held once per claim row. An intake event that produces several signals would store the
  evidence once per resulting signal row. `research_signal_sources` is unchanged.
- **1-B — Add the authorized fields only to `research_signal_sources`.**
  Consequence: evidence is held once per source row. A signal with several source rows would store the evidence on
  each; a signal with no source row (per 0016, INFERRED / UNKNOWN) would have nowhere to hold evidence.
  `research_signals` is unchanged.
- **1-C — Add different authorized fields to both tables, only where each field's meaning is directly tied to the
  corresponding record.**
  Consequence: both tables change; the Product Owner must state which item belongs to which table (§14, "Exact scope").
- **1-D — Use another existing table established by repository evidence.**
  Consequence: repository evidence establishes no other existing intent-signal provenance table (0029). A table outside
  `research_signals` / `research_signal_sources` would need to be named by the Product Owner and would fall outside the
  wording of DEC-004 1-B; if that requires DEC-004 to change, DEC-005 stop condition 1 / 17 applies.
- **1-E — Other.** The Product Owner specifies the exact table / scope.

Factual note for every option: authorization in DEC-003 is "per business and per integration" (answer 2), while both
candidate tables hold rows per claim or per source. Repository evidence does not establish a per-business-per-
integration row in either table.

## 5. Question 2 — Exact field set / mapping of E1–E5

The five items are E1–E5 (§2.1). This record does not name fields, types, nullability or defaults.

- **2-A — One structured field per authorization-evidence item.**
  Consequence: five added fields (E1–E5) in the table(s) selected under Question 1. Names, types and nullability to be
  specified by the Product Owner in §14.
- **2-B — Use existing columns where an existing column already represents an item; add fields only for items not
  already represented.**
  Consequence: repository evidence does not establish that any existing column represents E1–E5 (§2.5). Unless the
  Product Owner identifies such a column explicitly, this option adds fields for all five items.
- **2-C — Use a structured representation with fewer physical columns where the repository's existing persistence
  conventions support it.**
  Consequence: `JSONB` is an existing repository convention (§2.6), not used on the provenance tables. Individual items
  would not be separately typed columns; the Product Owner must specify the representation and its content.
- **2-D — Define the exact field mapping explicitly in the Product Owner decision.**
  Consequence: the mapping written in §14 ("Exact field mapping") is the complete field set.
- **2-E — Other.** The Product Owner specifies the exact field set / mapping.

Factual note for every option: the provider contract does not currently carry E2, E3 or E4 as named fields (§2.4).
Populating any new field is runtime behavior and is not authorized (§12). Changing the provider contract is not
authorized.

## 6. Question 3 — Existing rows

Existing rows (including every PUBLIC_INTENT and non-AI-platform signal) hold no authorization evidence.

**A destructive rewrite or unapproved historical transformation is not authorized by this preparation record.**

- **3-A — All newly authorized fields are nullable for existing rows; no backfill.**
  Consequence: no data mutation. Existing rows hold NULL in the new fields. Matches the "Additive only … not backfilled"
  wording of 0016 / 0029 and the nullable-audit-column form of 0011 (§2.6).
- **3-B — A repository-established default is used for existing rows.**
  Consequence: repository evidence establishes no default for authorization evidence (§2.6); the only defaults on these
  tables are `created_at DEFAULT CURRENT_TIMESTAMP`. Selecting 3-B requires the Product Owner to name the default.
  Adding a column with a default assigns that value to existing rows — **this is data mutation.**
- **3-C — Existing rows are explicitly backfilled with a Product Owner-authorized value or representation.**
  Consequence: **data mutation / historical backfill.** Excluded by DEC-005 preparation §7 unless separately and
  explicitly authorized.
- **3-D — Existing rows are excluded from the new evidence requirement, with exact semantics specified.**
  Consequence: depends on the semantics specified; if expressed as a constraint that exempts existing rows, it relates
  to Question 7. The Product Owner must specify the exact semantics.
- **3-E — Other.** The Product Owner specifies treatment.

## 7. Question 4 — Immutability enforcement location

DEC-004 1.3: Immutable = yes. This question concerns only where immutability is enforced. It does not change the
policy. No option is currently implemented.

- **4-A — Database-level enforcement.**
  Consequence: schema objects beyond columns (e.g. a trigger) on the selected table(s). Repository precedent exists
  for trigger-based immutability on `payments` (0009, §2.6); none exists on the provenance tables.
- **4-B — Application / runtime-level enforcement.**
  Consequence: no schema object; enforcement is runtime behavior, which is not authorized by DEC-005 as prepared (§6
  "Runtime behavior") and would need separate authorization.
- **4-C — Existing append-only persistence mechanism is relied upon, if repository evidence establishes that it
  satisfies the requirement.**
  Consequence: repository evidence does **not** establish that it does. The mechanism is application-level; it
  performs an `UPDATE` of `superseded_at` on `research_signals`, and rows are removable by `ON DELETE CASCADE` from
  `prospects` (§2.3). Whether this satisfies "immutable" for the evidence fields is a Product Owner determination.
- **4-D — Combined database and runtime enforcement.**
  Consequence: both 4-A's schema objects and 4-B's runtime behavior; the runtime part needs separate authorization.
- **4-E — Other.** The Product Owner specifies.

## 8. Question 5 — Retention / log-aggregator schema

DEC-004 1.1 (90 days) and 1.2 (read-only for Security Audit and Compliance teams via the centralized log aggregator)
are fixed. **Choosing a schema representation does not authorize implementation of retention enforcement or
log-aggregator integration.**

- **5-A — No additional schema beyond the authorization-evidence fields.**
  Consequence: 90-day retention and log-aggregator access have no schema representation in this change.
- **5-B — Add only schema fields directly required to represent retention metadata.**
  Consequence: additional field(s) on the selected table(s); the Product Owner specifies which. 0011 is a precedent of a
  nullable retention audit column on another table (§2.6).
- **5-C — Add only schema fields directly required to represent audit-access / log-aggregator metadata.**
  Consequence: repository evidence establishes no centralized log aggregator (§2.6); the Product Owner specifies the
  field(s).
- **5-D — Add both retention and access metadata where repository evidence establishes they belong in this persistence
  layer.**
  Consequence: repository evidence does not establish that either belongs in this persistence layer; the Product Owner
  must specify both.
- **5-E — Defer the question because retention / log-aggregator implementation is separately unauthorized.**
  Consequence: no retention / access schema in this change; the question returns when retention or log-aggregator
  implementation is authorized.
- **5-F — Other.** The Product Owner specifies.

## 9. Question 6 — Expiry / revocation state

DEC-004 3.1–3.8 are fixed. This question is only whether that state exists in the newly authorized schema. **No
option authorizes implementing provider events, expiry, revocation or refusal of new signals.**

- **6-A — No expiry / revocation fields; the schema change is limited to authorization evidence.**
  Consequence: expiry / revocation state has no representation in this change.
- **6-B — Add only the state necessary to represent revocation status.**
  Consequence: additional field(s) on the selected table(s). Under DEC-004 3.5 (stored signals retained unchanged),
  recording revocation on existing rows would be an update to those rows; whether that conflicts with 3.5 or with
  immutability (DEC-004 1.3) is a Product Owner determination.
- **6-C — Add only the state necessary to represent expiry status.**
  Consequence: additional field(s); DEC-004 3.1 fixes the duration at 90 days; whether expiry is stored or derived is
  not established.
- **6-D — Add both expiry and revocation state.**
  Consequence: the consequences of 6-B and 6-C together.
- **6-E — Defer expiry / revocation schema because runtime implementation requires separate authorization.**
  Consequence: no expiry / revocation schema in this change.
- **6-F — Other.** The Product Owner specifies.

## 10. Question 7 — Indexes / constraints

Any index or constraint must be tied to an explicitly authorized field / use. Performance optimization is not a basis
for additional schema work unless explicitly decided.

- **7-A — No new indexes or constraints.**
  Consequence: only the authorized fields are added.
- **7-B — Add only constraints strictly required for data integrity of the authorized fields.**
  Consequence: CHECK / NOT NULL / FK style constraints on the authorized fields, specified by the Product Owner. A
  constraint that existing rows would violate interacts with Question 3.
- **7-C — Add only indexes strictly required by an explicitly authorized query / access pattern.**
  Consequence: repository evidence establishes no authorized query / access pattern over the new fields; the Product
  Owner must name the pattern.
- **7-D — Add both required constraints and required indexes.**
  Consequence: the consequences of 7-B and 7-C together.
- **7-E — Other.** The Product Owner specifies.

## 11. Question 8 — Migration test database

- **8-A — No database connection; use static / schema / migration inspection only.**
  Consequence: the migration is validated without executing it; "Database connections" stays 0.
- **8-B — Allow a local throwaway validation database at `127.0.0.1:5433`, with no production connection.**
  Consequence: the migration is executed against throwaway databases on the local test server (§2.7); "Database
  connections" becomes non-zero for implementation. The validation database (5434) and production remain excluded.
- **8-C — Allow local database testing only after a separate explicit authorization.**
  Consequence: no local database connection under DEC-005 until that separate authorization exists.
- **8-D — Other.** The Product Owner specifies.

Clarifications:
- Local test-database access is different from production database access.
- This preparation record itself authorizes neither.
- Production database access, and execution against the validation database (5434), remain outside scope under every
  option.

## 12. Cross-cutting boundaries

These schema-design decisions must **not** be interpreted as authorization for:

- production code changes;
- migration creation;
- migration execution;
- database connections;
- database writes;
- backfills;
- destructive data changes;
- runtime retention;
- expiry;
- revocation;
- provider / API calls;
- log-aggregator integration;
- participant contact;
- live validation;
- validation sessions;
- configuration changes;
- dependency changes;
- changes to DEC-004;
- changes to DEC-003;
- changes to PUBLIC_INTENT.

The Product Owner's future selections resolve design questions only. Implementation authorization remains governed by
DEC-005. The privacy boundary (DEC-004 preparation §8) is unchanged and applies in full.

## 13. Decision dependencies

- A schema-design answer in this record does not itself authorize implementation.
- DEC-005 remains PENDING PRODUCT OWNER DECISION until separately decided.
- If the Product Owner later selects DEC-005 Option A, C or D, implementation must remain within the exact
  schema-design decisions recorded under this ID.
- If DEC-005 Option B is selected, these design decisions authorize nothing and implementation of DEC-004 1-B remains
  blocked.
- If a future implementation reveals a requirement outside these decisions, it stops and seeks further authorization
  (DEC-005 preparation §9).
- Answers here that select a data-mutating path (3-B, 3-C) or runtime enforcement (4-B, 4-D runtime part) still need
  the corresponding DEC-005 form field ("Existing-data mutation authorized", "Runtime … implementation authorized") to
  grant it; this record does not.
- Question 8's answer interacts with DEC-005 §11's migration scope; neither record authorizes production database
  execution.

## 14. Product Owner decision required

**Blank fields are not permissions.** Any field left blank, or returned as a placeholder, grants nothing and is
recorded as not supplied.

```text
INTENT-INTAKE-PO-DEC-005-SCHEMA — §5.4 Schema Design Decisions

1. Candidate table(s)
Selected option: [ 1-A | 1-B | 1-C | 1-D | 1-E ]
Exact scope: ______________________________

2. Exact field set / mapping
Selected option: [ 2-A | 2-B | 2-C | 2-D | 2-E ]
Exact field mapping: ______________________________

3. Existing rows
Selected option: [ 3-A | 3-B | 3-C | 3-D | 3-E ]
Exact treatment/value: ______________________________

4. Immutability enforcement
Selected option: [ 4-A | 4-B | 4-C | 4-D | 4-E ]

5. Retention / log-aggregator schema
Selected option: [ 5-A | 5-B | 5-C | 5-D | 5-E | 5-F ]

6. Expiry / revocation state
Selected option: [ 6-A | 6-B | 6-C | 6-D | 6-E | 6-F ]

7. Indexes / constraints
Selected option: [ 7-A | 7-B | 7-C | 7-D | 7-E ]
Exact index/constraint scope: ______________________________

8. Migration test database
Selected option: [ 8-A | 8-B | 8-C | 8-D ]

Other specifications:
____________________________________________

Rationale (optional):
____________________________________________

Decided by / date:
____________________________________________
```

## 15. Execution counters (this preparation)

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

**DEC-005 §5.4 SCHEMA-DESIGN PREPARATION CREATED — PENDING PRODUCT OWNER DECISION — DEC-005 PENDING — DEC-004 /
DEC-003 UNCHANGED — NO SCHEMA CHANGE — NO MIGRATION — NO DATABASE — NO PROVIDERS**
