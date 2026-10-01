# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-005 §5.4 Schema Design Questions — Product Owner Decision

**Decision ID:** INTENT-INTAKE-PO-DEC-005-SCHEMA
**Status:** **DECIDED — 1-A / 2-D / 3-C / 4-A / 5-A / 6-B / 7-C / 8-B — NULLABILITY OPTION B (ALL NULLABLE)**
(revision 2, 2026-09-30: the four open points of §5 resolved — APPROVED — FINAL PRODUCT OWNER DECISIONS; see §11.
§1–§10 are the revision 1 text, retained for traceability)
**Linked decision:** INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_PREREQUISITES_DECISION.md`) decides
column types, backfill-evidence semantics, backfill / immutability sequencing and the 7-C index name.
**Decision date:** 2026-09-30 (30 September 2026)
**Decided by:** Product Owner
**Preparation record:**
`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION_PREPARATION.md`
(INTENT-INTAKE-PO-DEC-005-SCHEMA preparation), sha256
`8d789550fe01683b8a9ea8a75a0ac31a88887c52b4197c12fa882ecacb50adb8` (verified before this record was written; not
modified).
**Source of the decision:** the Product Owner's selections, nullability resolution and rationale supplied in the
working session on 2026-09-30, reproduced in §2. Nothing in this record is inferred.
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
INTENT-INTAKE-PO-DEC-005-SCHEMA .. DECIDED — 1-A / 2-D / 3-C / 4-A / 5-A / 6-B / 7-C / 8-B; ALL FIELDS NULLABLE
INTENT-INTAKE-PO-DEC-005 ......... PENDING PRODUCT OWNER DECISION — UNCHANGED
DEC-004 .......................... DECIDED — 1-B / 2-A / 3.1–3.8 = a — UNCHANGED
DEC-003 .......................... DECIDED — OPTION A — UNCHANGED
SCHEMA / MIGRATION ............... NOT AUTHORIZED — NONE CREATED BY THIS RECORD
BACKFILL ......................... DESIGNED (3-C) — EXECUTION NOT AUTHORIZED
IMPLEMENTATION ................... NOT PERFORMED AND NOT AUTHORIZED BY THIS RECORD (see §7)
```

Option labels in this record (e.g. "1-A", "2-D") are local to INTENT-INTAKE-PO-DEC-005-SCHEMA, as defined in the
preparation record. They are not DEC-004's or DEC-005's option labels.

This record keeps four things separate, as the preparation record does:
1. **Repository evidence** — preparation record §2; not restated or changed here.
2. **Analyst proposal** — the nullability proposal the Product Owner accepted (§4).
3. **Product Owner decisions** — §2, §3, §4, §5.
4. **Implementation authorization** — governed by DEC-005 alone, not by this record (§7).

---

## 1. Baseline (verified before writing)

| Item | sha256 / value | Result |
|---|---|---|
| DEC-005 §5.4 preparation record | `8d789550fe01683b8a9ea8a75a0ac31a88887c52b4197c12fa882ecacb50adb8` | present; PENDING PRODUCT OWNER DECISION |
| DEC-005 preparation record | `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819` | matches the §5.4 preparation record; PENDING |
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | matches; DECIDED |
| DEC-004 preparation record | `cbd5674abb2ae678f5d40a8a802b87bdf20192ff447dcea0803ba41fe3c2cbbc` | matches |
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | matches; DECIDED |
| DEC-003 preparation record | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` | matches |
| Implementation fingerprint | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| `INTENT-INTAKE-PO-DEC-005-SCHEMA` decision record | none existed; ID appeared only as "reserved" in the preparation record | confirmed |
| Option codes 1-A, 2-D, 3-C, 4-A, 5-A, 6-B, 7-C, 8-B | each defined in preparation §4–§11 | confirmed |

No database was connected to establish any fact in this record.

## 2. Product Owner decision (as supplied)

```text
INTENT-INTAKE-PO-DEC-005-SCHEMA — §5.4 Schema Design Decisions

1. Candidate table(s)
Selected option: 1-A
Exact scope: Authorization-evidence fields are scoped to research_signals only.
             No authorization-evidence fields are added to research_signal_sources.

2. Exact field set / mapping
Selected option: 2-D
Exact field mapping: the explicit field mapping established by the §5.4 decision context (see §3.2).

3. Existing rows
Selected option: 3-C
Exact treatment/value: Explicit historical backfill treatment. The backfill population is strictly
             limited to first-party AI-platform historical signals. It excludes PUBLIC_INTENT and
             non-AI-platform historical rows. No fabricated authorization evidence is assigned to
             excluded populations.

4. Immutability enforcement
Selected option: 4-A
(Database-level immutability/enforcement for the authorized authorization-evidence fields.
 Not whole-row immutability.)

5. Retention / log-aggregator schema
Selected option: 5-A
(No retention or access schema is authorized by this decision.)

6. Expiry / revocation state
Selected option: 6-B
(Revocation-state treatment is represented by revoked_at.)

7. Indexes / constraints
Selected option: 7-C
Exact index/constraint scope: Only indexes required by an explicitly authorized access pattern.
             Authorized access pattern:
               Lookups filtering by business_id and auth_status to populate real-time
               monitoring and compliance verification dashboards.
             No ACTIVE partial index. No status-vocabulary constraint.

8. Migration test database
Selected option: 8-B
(Local throwaway database at 127.0.0.1:5433. This decision does not authorize running such tests now.)

Other specifications:
Final nullability: Option B — remain NULLABLE
  business_id      = NULLABLE
  auth_status      = NULLABLE
  auth_timestamp   = NULLABLE
  integration_id   = NULLABLE
  auth_scope       = NULLABLE
  revoked_at       = NULLABLE
Supersedes the earlier proposed final NOT NULL state.
No conditional NOT NULL constraint. Q7 remains 7-C.

Rationale: see §6 (verbatim).

Decided by / date: Product Owner / 30 September 2026
```

## 3. Selections and their definitions (definitions verbatim from the preparation record)

### 3.1 Question 1 — Candidate table(s) (preparation §4)

**Selected option:** **1-A — Add the authorized fields only to `research_signals`.**
Preparation-record consequence: "evidence is held once per claim row. An intake event that produces several signals
would store the evidence once per resulting signal row. `research_signal_sources` is unchanged."

**Exact scope:** `research_signals` only. No authorization-evidence field is added to `research_signal_sources`.

### 3.2 Question 2 — Exact field set / mapping (preparation §5)

**Selected option:** **2-D — Define the exact field mapping explicitly in the Product Owner decision.**
Preparation-record consequence: "the mapping written in §14 ("Exact field mapping") is the complete field set."

**Exact field mapping** (the explicit mapping established by the §5.4 decision context; field names as supplied by the
Product Owner; E-numbers as defined in preparation §2.1):

| DEC-003 answer 3 item | Field on `research_signals` | Nullability |
|---|---|---|
| E1 Business identifier | `business_id` | NULLABLE |
| E2 Authorization status | `auth_status` | NULLABLE |
| E3 Authorization scope | `auth_scope` | NULLABLE |
| E4 Authorization timestamp | `auth_timestamp` | NULLABLE |
| E5 Integration identifier | `integration_id` | NULLABLE |
| Revocation state (Question 6, 6-B) | `revoked_at` | NULLABLE |

This is the complete field set. Column data types were not supplied and are recorded as not supplied (§8); none is
inferred.

### 3.3 Question 3 — Existing rows (preparation §6)

**Selected option:** **3-C — Existing rows are explicitly backfilled with a Product Owner-authorized value or
representation.**
Preparation-record consequence: "**data mutation / historical backfill.** Excluded by DEC-005 preparation §7 unless
separately and explicitly authorized."

**Exact treatment:**
- Backfill population: **strictly limited to first-party AI-platform historical signals.**
- Excluded: `PUBLIC_INTENT` rows; non-AI-platform historical rows.
- No fabricated authorization evidence is assigned to the excluded populations; their new fields remain NULL.
- Per the nullability resolution (§4), the backfill does not require any placeholder or synthetic value.

Selecting 3-C records the design treatment only. **Executing the backfill is not authorized** (§7). Per preparation
§13, the corresponding DEC-005 "Existing-data mutation authorized" field is still required to grant it.

### 3.4 Question 4 — Immutability enforcement (preparation §7)

**Selected option:** **4-A — Database-level enforcement.**
Preparation-record consequence: "schema objects beyond columns (e.g. a trigger) on the selected table(s). Repository
precedent exists for trigger-based immutability on `payments` (0009, §2.6); none exists on the provenance tables."

**Scope:** database-level immutability / enforcement for the authorized authorization-evidence fields. **This is not
whole-row immutability.** DEC-004 1.3 (Immutable = yes) is unchanged.

### 3.5 Question 5 — Retention / log-aggregator schema (preparation §8)

**Selected option:** **5-A — No additional schema beyond the authorization-evidence fields.**
Preparation-record consequence: "90-day retention and log-aggregator access have no schema representation in this
change."

No retention or access schema is authorized by this decision. DEC-004 1.1 / 1.2 are unchanged.

### 3.6 Question 6 — Expiry / revocation state (preparation §9)

**Selected option:** **6-B — Add only the state necessary to represent revocation status.**
Preparation-record consequence: "additional field(s) on the selected table(s). Under DEC-004 3.5 (stored signals
retained unchanged), recording revocation on existing rows would be an update to those rows; whether that conflicts
with 3.5 or with immutability (DEC-004 1.3) is a Product Owner determination."

**Representation:** revocation-state treatment is represented by `revoked_at` (NULLABLE). No expiry field is added.
No provider event, expiry, revocation or refusal of new signals is implemented or authorized (preparation §9).

### 3.7 Question 7 — Indexes / constraints (preparation §10)

**Selected option:** **7-C — Add only indexes strictly required by an explicitly authorized query / access pattern.**
Preparation-record consequence: "repository evidence establishes no authorized query / access pattern over the new
fields; the Product Owner must name the pattern."

**Authorized access pattern (named by the Product Owner, verbatim):**

```text
Lookups filtering by business_id and auth_status to populate real-time
monitoring and compliance verification dashboards.
```

**Exclusions:** no `ACTIVE` partial index; no status-vocabulary constraint; no `auth_status` CHECK constraint or enum;
no foreign key; no conditional `NOT NULL` constraint. 7-C does not include 7-B constraints.

### 3.8 Question 8 — Migration test database (preparation §11)

**Selected option:** **8-B — Allow a local throwaway validation database at `127.0.0.1:5433`, with no production
connection.**
Preparation-record consequence: "the migration is executed against throwaway databases on the local test server
(§2.7); "Database connections" becomes non-zero for implementation. The validation database (5434) and production
remain excluded."

**This decision does not authorize running such tests now.** Database connections for this record: 0.

## 4. Nullability resolution — analyst proposal and Product Owner decision

**Analyst proposal (working session, 2026-09-30):** Option B — the six fields remain NULLABLE rather than moving to an
earlier proposed final `NOT NULL` state. The earlier `NOT NULL` proposal and Option B were presented in the working
session; neither appears in the preparation record, which names no fields, types or nullability (preparation §5).

**Product Owner decision:** **Option B — remain NULLABLE**, accepted by the Product Owner.

```text
business_id      = NULLABLE
auth_status      = NULLABLE
auth_timestamp   = NULLABLE
integration_id   = NULLABLE
auth_scope       = NULLABLE
revoked_at       = NULLABLE
```

- This supersedes the earlier proposed final `NOT NULL` state.
- No conditional `NOT NULL` constraint is added.
- Question 7 remains `7-C`.

The decision is the Product Owner's. The analyst proposed; the Product Owner decided.

## 5. Consistency with the preparation record

Every selection above is an option defined in the preparation record, and every "Exact scope / mapping / treatment"
entry fills a field the preparation §14 form left for the Product Owner. No selection changes DEC-003, DEC-004 or
DEC-005. The following points are recorded as stated by the Product Owner and **not determined further** by this
record (revision 1 state; all four points are resolved in revision 2, §11):

- **3-C backfill value / representation:** the population and exclusions are specified (§3.3); no specific backfill
  value is specified beyond the prohibition on fabricated evidence and the nullable resolution (§4).
- **6-B vs. DEC-004 3.5 / 1.3:** the preparation record names this interaction as a Product Owner determination; the
  Product Owner selected 6-B with `revoked_at`. No further determination was supplied.
- **4-A field scope:** stated as "the authorized authorization-evidence fields", not whole-row. Whether that scope
  includes `revoked_at` was not separately stated and is not inferred.
- **7-C index shape:** the access pattern is named; the exact index definition is not specified and is not inferred.

## 6. Product Owner rationale (verbatim)

```text
Your proposal provides the most structurally sound path forward under DEC-005
§5.4. Specifically, I endorse this direction because it:

- Preserves strict data integrity: It avoids the risk of manufacturing
  synthetic authorization evidence or injecting arbitrary placeholders like
  Nil UUIDs into our historical ledger.

- Minimizes scope creep: Keeping these fields nullable successfully isolates
  the authorized backfill to first-party AI-platform historical signals
  without inadvertently expanding the PUBLIC_INTENT boundary.

- Contains architectural risk: It removes the need to design, test, and
  maintain complex, conditional database constraints that are not currently
  native to our repository design, while keeping the Q7 index strategy highly
  focused.
```

## 7. Governance decision vs. implementation authorization

**Recording `INTENT-INTAKE-PO-DEC-005-SCHEMA` authorizes governance/design decisions only. It does not authorize
implementation.**

Specifically, this decision does **NOT** authorize:

- creating or modifying a database migration;
- altering the database schema;
- executing any migration;
- executing the historical backfill;
- modifying existing data;
- adding runtime behavior;
- implementing gateway-header extraction;
- changing the provider contract;
- changing provider adapters;
- adding a foreign key;
- adding an `auth_status` CHECK constraint or enum;
- creating synthetic source rows;
- creating mapping tables;
- changing `PUBLIC_INTENT` persistence;
- changing `migrations-blocked/`;
- production deployment;
- validation-session execution;
- database connections;
- provider/API calls;
- external HTTP requests.

The cross-cutting boundaries of preparation §12 continue to apply in full.

**The existing DEC-005 implementation authorization remains separate.** INTENT-INTAKE-PO-DEC-005 remains PENDING
PRODUCT OWNER DECISION. Per preparation §13: if DEC-005 Option A, C or D is later selected, implementation must remain
within the exact schema-design decisions recorded under this ID; if DEC-005 Option B is selected, these design
decisions authorize nothing and implementation of DEC-004 1-B remains blocked. A future implementation that reveals a
requirement outside these decisions stops and seeks further authorization.

**Privacy boundary** (DEC-004 preparation §8) is unchanged and applies in full. **PUBLIC_INTENT is unaffected**
(DEC-003 answer 8).

## 8. Fields not supplied

(Revision 1 state. The exact index definition and the backfill representation are supplied in revision 2, §11.
Column data types remain not supplied.)

- **Column data types** for the six fields: not supplied. None is recorded or inferred.
- **Exact index definition** under 7-C: not supplied beyond the named access pattern.
- **Specific backfill value / representation** under 3-C: not supplied beyond §3.3 and §4.
- **Decided by:** supplied — Product Owner.
- **Decision date:** supplied — 30 September 2026.
- **Rationale:** supplied — §6.

## 9. Unselected options (preserved, unranked)

As defined in the preparation record, order presentational only:

- **Question 1:** 1-B, 1-C, 1-D, 1-E.
- **Question 2:** 2-A, 2-B, 2-C, 2-E.
- **Question 3:** 3-A, 3-B, 3-D, 3-E.
- **Question 4:** 4-B, 4-C, 4-D, 4-E.
- **Question 5:** 5-B, 5-C, 5-D, 5-E, 5-F.
- **Question 6:** 6-A, 6-C, 6-D, 6-E, 6-F.
- **Question 7:** 7-A, 7-B, 7-D, 7-E.
- **Question 8:** 8-A, 8-C, 8-D.

## 10. Execution counters (this record)

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
Migration changes: 0
Schema changes: 0
Configuration changes: 0
Dependency changes: 0
Commits: 0
Files created: 1 (this record)
```

**INTENT-INTAKE-PO-DEC-005-SCHEMA DECIDED — ALL SIX FIELDS NULLABLE — DEC-005 PENDING — DEC-004 / DEC-003 UNCHANGED —
NO SCHEMA CHANGE — NO MIGRATION — NO BACKFILL EXECUTED — NO DATABASE — NO PROVIDERS — IMPLEMENTATION NOT AUTHORIZED**

---

## 11. Revision 2 — Resolution of the four open points (2026-09-30)

**Status:** **APPROVED — FINAL PRODUCT OWNER DECISIONS**
**Decided by:** Product Owner
**Decision date:** 2026-09-30 (30 September 2026)
**Source:** the Product Owner's final decisions supplied in the working session on 2026-09-30, reproduced below.
Nothing in this revision is inferred.
**Record before this revision:** sha256 `f62fe3b94d53f9a74956680e8e20669a15afe4372970afd53f8f597a3b769232`
(revision 1; verified before writing). Revision 1 selections (1-A / 2-D / 3-C / 4-A / 5-A / 6-B / 7-C / 8-B) and the
Option B nullability resolution are unchanged.

This revision resolves exactly the four points listed as not determined in §5. It does not change any other
selection, boundary or field.

### 11.1 Q3 / 3-C — Backfill representation

The backfill is strictly restricted to first-party AI-platform historical `research_signals` with existing,
authoritative evidence.

Non-backfilled populations and missing evidence fields must remain NULL.

No synthetic values are permitted, including:
- `LEGACY_AUTHORIZED`
- Nil UUIDs
- fabricated timestamps

This decision supersedes any earlier analyst-proposed representation that would manufacture or assign synthetic
historical authorization evidence.

**This decision defines the governance representation only. It does NOT authorize execution of the backfill.**

### 11.2 Q4 / 4-A — Immutability scope

Database-level immutability applies strictly to the authorization-evidence payload:

- `business_id`
- `auth_status`
- `auth_scope`
- `auth_timestamp`
- `integration_id`

The immutability rule explicitly excludes:

- `revoked_at`
- `superseded_at`

The exclusion exists so lifecycle-state updates are not blocked.

Immutability does not extend beyond these stated boundaries.

### 11.3 Q6 / 6-B — Interaction with DEC-004 §3.5

Stored signals remain unchanged in accordance with DEC-004 §3.5.

A revocation event does NOT trigger a retrofitted update to populate `revoked_at` on existing historical rows.

`revoked_at` is reserved solely for separately authorized lifecycle states that do not alter the immutable
authorization-evidence payload.

No additional revocation behavior is inferred. Runtime implementation of revocation handling is not authorized.

### 11.4 Q7 / 7-C — Exact index definition

The authorized index definition is:

```sql
CREATE INDEX idx_research_signals_compliance
ON research_signals (business_id, auth_status);
```

The index is a standard composite index. It has **NO** partial predicate.

The following are not added unless separately authorized elsewhere:
- `WHERE auth_status = ...`
- additional columns
- additional indexes
- unique constraints
- foreign keys
- status-vocabulary constraints

Recording this definition does not create, apply or authorize a migration containing it.

### 11.5 Recording boundary

**A. Decided by this revision:**
- 3-C backfill representation (§11.1);
- 4-A immutability scope (§11.2);
- 6-B interaction with DEC-004 §3.5 (§11.3);
- 7-C exact index definition (§11.4).

**B. Governed separately — not authorized by this revision:**
- DEC-005 implementation authorization;
- migration creation;
- migration execution;
- database / schema modification;
- backfill execution;
- runtime lifecycle behavior;
- provider-contract changes;
- any other engineering work outside the recorded decisions.

**Recording these decisions does NOT authorize implementation or execution.** Any implementation authorization
remains governed by the separate DEC-005 implementation authorization. INTENT-INTAKE-PO-DEC-005 remains PENDING
PRODUCT OWNER DECISION. §7 continues to apply in full.

Still not supplied after this revision: column data types for the six fields (§8).

### 11.6 Execution counters (this revision)

```text
Files written: 1 (this record, amended)
Production code changes: 0
Test changes: 0
Migration changes: 0
Schema changes: 0
Configuration changes: 0
Dependency changes: 0
Database connections: 0
Database writes: 0
Migrations executed: 0
Provider calls: 0
External HTTP requests: 0
Browser automation: 0
Live-source fetches: 0
Worker executions: 0
Participant contacts: 0
Validation sessions: 0
Commits: 0
```

**INTENT-INTAKE-PO-DEC-005-SCHEMA REVISION 2 — FOUR OPEN POINTS RESOLVED — APPROVED — FINAL PRODUCT OWNER DECISIONS —
DEC-005 PENDING — NO BACKFILL EXECUTED — NO MIGRATION — NO SCHEMA CHANGE — IMPLEMENTATION NOT AUTHORIZED**
