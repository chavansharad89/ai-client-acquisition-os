# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-004 1-B Schema / Migration Implementation Authorization — Product Owner Decision

**Decision ID:** INTENT-INTAKE-PO-DEC-005
**Status:** **DECIDED — OPTION C — AUTHORIZE WITH ADDITIONAL RESTRICTIONS**
**Decided by:** Product Owner
**Decision date:** 2026-09-30
**Decision authority:** delegated Product Owner authority supplied in this session (working session, 2026-09-30:
"You are authorized to act as the delegated Product Owner for `INTENT-INTAKE-PO-DEC-005`"). No person's name is
recorded.
**Preparation record:**
`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DECISION_PREPARATION.md`
(INTENT-INTAKE-PO-DEC-005 preparation), sha256 `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819`
(verified before this record was written; not modified).
**Schema-design decision:** INTENT-INTAKE-PO-DEC-005-SCHEMA
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION.md`), revision 2,
sha256 `078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33` — DECIDED. Not modified.
**Prerequisite decision:** INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_PREREQUISITES_DECISION.md`),
sha256 `572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca` — DECIDED. Not modified.
**Governing decision:** INTENT-INTAKE-PO-DEC-004, sha256
`0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` — DECIDED. Not modified.
**Underlying decision:** INTENT-INTAKE-PO-DEC-003, sha256
`5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` — DECIDED, Option A. Not modified.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

```text
INTENT-INTAKE-PO-DEC-005 .............. DECIDED — OPTION C — MIGRATION CREATION + LOCAL STRUCTURAL TESTING AUTHORIZED
INTENT-INTAKE-PO-DEC-005-SCHEMA ....... DECIDED (revision 2) — UNCHANGED
INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ  DECIDED — UNCHANGED
DEC-004 / DEC-003 ..................... DECIDED — UNCHANGED
MIGRATION EXECUTION (5434 / PROD / UPPER) NOT AUTHORIZED — SEPARATE AUTHORIZATION
EXISTING-DATA MUTATION ................ NOT AUTHORIZED — MIGRATION CONTAINS NO DML
IMPLEMENTATION ........................ NOT PERFORMED BY THIS RECORD
```

> **Recording this decision is governance authorization only. No implementation was performed in the task that
> recorded it. Implementation requires its own implementation record (preparation §12).**

---

## 1. Baseline (verified before writing)

| Item | sha256 / value | Result |
|---|---|---|
| DEC-005 preparation record | `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819` | matches; PENDING before this record |
| INTENT-INTAKE-PO-DEC-005-SCHEMA (rev. 2) | `078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33` | matches |
| DEC-005 §5.4 preparation record | `8d789550fe01683b8a9ea8a75a0ac31a88887c52b4197c12fa882ecacb50adb8` | matches |
| INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ | `572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca` | matches |
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | matches |
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | matches |
| Implementation fingerprint | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Working tree | 209 uncommitted entries before this record | recorded |
| INTENT-INTAKE-PO-DEC-005 decision record | none existed; ID "reserved" in the preparation record | confirmed |
| Later conflicting decision | none | confirmed |

No database was connected to establish any fact in this record.

## 2. Product Owner decision (preparation §11 form)

```text
INTENT-INTAKE-PO-DEC-005 — DEC-004 1-B Schema / Migration Implementation Authorization

Selected option: C — AUTHORIZE WITH ADDITIONAL RESTRICTIONS

If C, additional restrictions: §4 (C1–C8)

Authorized schema scope: §3.1–§3.5
Authorized migration scope: §3.6
Explicitly excluded scope: §5

Production migration execution authorized: separate authorization
Existing-data mutation authorized: no (see C1)
Runtime retention/expiry/revocation implementation authorized: separate authorization
Provider/API calls authorized: no

Rationale: §6

Decided by / date: Product Owner / 2026-09-30
Decision authority: delegated Product Owner authority supplied in this session
```

## 3. Authorization boundary

Authorized: implementing the minimum schema change and migration for DEC-004 option 1-B, exactly as designed in
INTENT-INTAKE-PO-DEC-005-SCHEMA (revision 2) and INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ, subject to §4.

### 3.1 Schema additions (1-A, 2-D; PREREQ §4)

Six columns added to `research_signals` only. `research_signal_sources` is unchanged. No new table.

| Field | Type | Nullability | Default |
|---|---|---|---|
| `business_id` | `TEXT` | NULLABLE | none |
| `auth_status` | `TEXT` | NULLABLE | none |
| `auth_scope` | `TEXT` | NULLABLE | none |
| `auth_timestamp` | `TIMESTAMP(3)` | NULLABLE | none |
| `integration_id` | `TEXT` | NULLABLE | none |
| `revoked_at` | `TIMESTAMP(3)` | NULLABLE | none |

There is no conditional NOT NULL, no CHECK constraint, no enum, no length restriction and no lookup table.
**No foreign key is added**: `business_id` has no FK to any table or external business ledger.

### 3.2 Historical backfill boundary (3-C; revision 2 §11.1; PREREQ §5)

- Eligible population: first-party AI-platform historical `research_signals` with existing authoritative evidence
  (PREREQ §5.1–§5.4) only. PUBLIC_INTENT and non-AI-platform rows are excluded.
- Missing evidence stays NULL. No synthetic evidence, no `LEGACY_AUTHORIZED`, no Nil UUID, no fabricated timestamp.
- PREREQ §5.5 found no authoritative source in the repository, so the qualifying population is empty.
  **Zero updated historical rows is an acceptable and expected outcome** (see C1).

### 3.3 Immutability boundary (4-A; revision 2 §11.2; PREREQ §6)

- Database-level enforcement covers exactly `business_id`, `auth_status`, `auth_scope`, `auth_timestamp` and
  `integration_id`.
- The mechanism is a `BEFORE UPDATE OF <those five columns>` row trigger on `research_signals`. It raises when any of
  them `IS DISTINCT FROM` its old value, including NULL to non-NULL, following the 0009 precedent.
- The trigger is created **last** in the same migration file, which Prisma runs as one transaction.
- **Exceptions:** `revoked_at` and `superseded_at` are excluded. Other existing columns are also outside it: whole-row
  immutability is prohibited.
- The trigger does not govern row deletion. No bypass of any kind is authorized.

### 3.4 Revocation / supersession (6-B; revision 2 §11.3)

- `revoked_at` is added as a column only. Nothing writes it.
- A revocation event does not retroactively populate `revoked_at`. DEC-004 §3.5 (stored signals retained unchanged) is
  preserved.
- `superseded_at` keeps its existing behavior (`supersedePrevious`) unchanged.

### 3.5 Index (7-C; PREREQ §7)

```sql
CREATE INDEX "research_signals_business_id_auth_status_idx"
    ON "research_signals"("business_id", "auth_status");
```

This is a standard composite index with no partial predicate. No other index, unique constraint or
status-vocabulary constraint is added.

### 3.6 Migration and testing scope (preparation §5.3; 8-B)

- **Creation:** create one new migration in the established form, `packages/db/prisma/migrations/0030_<descriptive
  name>/migration.sql`, raw SQL, additive only. It contains, in order: the six `ADD COLUMN`s, the index, then the
  immutability function and trigger.
- **Tests:** add only the migration test(s) or structural validation strictly necessary to verify that migration.
- **Testing database:** tests may use throwaway databases on the local test server `127.0.0.1:5433`, created by the
  existing test harness, and nothing else.
- **Upper environments:** executing the migration against the validation database (`5434`), production, staging or
  any other upper environment is **not** authorized by this decision. That needs separate authorization, as with
  migration 0029 (preparation §3.4, §8).

## 4. Additional restrictions (Option C)

- **C1 — No DML in the migration.** The migration contains no `UPDATE`, `INSERT` or `DELETE`. The 3-C backfill step is
  empty because the qualifying population is empty (PREREQ §5.5). Any non-empty backfill requires a separate Product
  Owner decision that names the authoritative source. Existing-data mutation authorized: **no**.
- **C2 — File scope.** Only these may be created or changed:
  - the one new migration directory (§3.6);
  - the strictly necessary migration test(s);
  - one implementation record under `requirement/`.

  No production code, `schema.prisma`, configuration, dependency or `migrations-blocked/` change.
- **C3 — No reader or writer.** No application code reads or writes any of the six new columns.
- **C4 — Database connections.** Only to throwaway databases on `127.0.0.1:5433`. None to `5434`, production or any
  upper environment.
- **C5 — Stop conditions.** Preparation §9 conditions 1–20 apply in full. Condition 5 (backfill) is not triggered only
  because C1 makes the backfill empty. Any need for a non-empty backfill stops the work.
- **C6 — Naming.** Trigger and function names follow the existing `<table>_<purpose>` / `enforce_<purpose>()`
  convention (0009). The migration directory uses the next sequence number, `0030`. No other naming decision is
  implied.
- **C7 — Implementation record.** Implementation must produce its own implementation record with baseline, files
  changed, tests run and safety counters (preparation §12).
- **C8 — Source control and deployment.** Committing, pushing, merging and deploying are outside this decision. They
  happen only on explicit instruction.

## 5. Explicit non-authorizations

Not authorized by this decision:

- provider-contract changes; provider adapter changes; `normalizeIntentEvent`, `toIntentIntakeInput` or
  `recordIntentIntakeForOwner` changes;
- new gateway / header extraction runtime behavior;
- PUBLIC_INTENT persistence changes; non-AI-platform persistence changes;
- synthetic historical evidence; fabricated timestamps; Nil UUID backfills; any backfill DML;
- new mapping tables; new source rows (`research_signal_sources`);
- foreign keys, including to unidentified external systems;
- log-aggregator integration; retention-policy implementation; deletion mechanisms;
- expiry or revocation runtime handling; refusal of new signals; writing `revoked_at`;
- changes to existing research-signal semantics (including `superseded_at` / `supersedePrevious`);
- changes to Opportunity behavior or downstream outputs;
- implementing DEC-003's fail-closed authorization check;
- production database execution; migration execution against `5434` or any upper environment; applying migration
  0029;
- participant or user validation; validation sessions; participant contact;
- external API calls (Anthropic, OpenAI, Gemini, Google Search / Places / Ads); external HTTP; live-source fetches;
  browser automation; worker execution;
- configuration or dependency changes; `migrations-blocked/` changes;
- unrelated refactoring, tests or production changes.

**No runtime behavior beyond what the authorized schema / migration strictly requires is authorized.** The only new
runtime effect is the database trigger rejecting updates to the five evidence fields.

Provider-contract work remains separately unauthorized. Because the contract does not retain authorization metadata
(PREREQ R5), the new fields will stay NULL for new rows as well as historical ones until separately authorized
provider-contract and persistence work exists. This decision does not assume that metadata exists.

The privacy boundary (DEC-004 preparation §8) is unchanged and applies in full. DEC-004 and DEC-003 are unchanged.

## 6. Rationale

- The schema design is now fully decided: table, fields, types, nullability, backfill semantics, immutability scope
  and sequencing, revocation treatment, index definition and name, and testing database. No open implementation
  question from preparation §5.4 remains unanswered.
- The restrictions keep the change additive and data-neutral:
  - nullable columns with no default rewrite no existing row;
  - C1 removes all DML;
  - the trigger is created last inside one transaction, with no bypass.
- Execution against shared databases, and every runtime and provider concern, stay behind separate authorizations,
  as preparation §6–§8 require.

## 7. Execution counters (this record)

```text
Files written: 1 (this record)
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

**INTENT-INTAKE-PO-DEC-005 DECIDED — OPTION C — MIGRATION CREATION AND LOCAL (5433) STRUCTURAL TESTING AUTHORIZED WITHIN
§3–§4 — NO DML — NO UPPER-ENVIRONMENT EXECUTION — NO PROVIDER CHANGES — IMPLEMENTATION NOT YET PERFORMED**
