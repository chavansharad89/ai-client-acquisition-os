# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-005 §5.4 Implementation Prerequisites — Product Owner Decision

**Decision ID:** INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ
**Status:** **DECIDED — PRODUCT OWNER**
**Decided by:** Product Owner
**Decision date:** 2026-09-30 (30 September 2026)
**Provenance:** the Product Owner delegated these four decisions, in writing, in the working session on 2026-09-30
("You are authorized to act as the Product Owner for the DEC-005 governance decisions in this task"), limited to the
four questions in §2. The decisions were formed under that delegation from the governance records and read-only
repository evidence cited below. No person's name is recorded.
**Parent decision:** INTENT-INTAKE-PO-DEC-005-SCHEMA
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION.md`), revision 2,
sha256 `4a1341a7fa4646930b65351bee17249dbb0bedfa408b9e4a320b456047c1c4af` before the linkage line added by this task —
DECIDED. Not reopened.
**Preparation record:**
`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DESIGN_DECISION_PREPARATION.md`,
sha256 `8d789550fe01683b8a9ea8a75a0ac31a88887c52b4197c12fa882ecacb50adb8`. Not modified. No separate preparation
record exists for these four questions; they are the residual points recorded in the parent decision (§5, §8, and
the remaining issues after revision 2).
**DEC-005 preparation:** sha256 `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819` — PENDING PRODUCT
OWNER DECISION. Not modified.
**Governing decision:** INTENT-INTAKE-PO-DEC-004, sha256
`0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` — DECIDED. Not modified.
**Underlying decision:** INTENT-INTAKE-PO-DEC-003, sha256
`5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` — DECIDED, Option A. Not modified.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` (unchanged)

> **This decision record authorizes governance decisions only. It does not authorize schema modification, migration
> creation, migration execution, backfill execution, production deployment, runtime changes, provider-contract
> changes, or any other implementation activity.**

```text
INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ .. DECIDED — PRODUCT OWNER — Q1 TYPES / Q2 EVIDENCE / Q3 SEQUENCING / Q4 NAME
INTENT-INTAKE-PO-DEC-005-SCHEMA ......... DECIDED (revision 2) — NOT REOPENED
INTENT-INTAKE-PO-DEC-005 ................ PENDING PRODUCT OWNER DECISION — UNCHANGED
DEC-004 / DEC-003 ....................... DECIDED — UNCHANGED
SCHEMA / MIGRATION / BACKFILL ........... NOT AUTHORIZED — NONE CREATED OR EXECUTED
```

---

## 1. Baseline (verified before writing)

| Item | sha256 / value | Result |
|---|---|---|
| INTENT-INTAKE-PO-DEC-005-SCHEMA (revision 2) | `4a1341a7fa4646930b65351bee17249dbb0bedfa408b9e4a320b456047c1c4af` | present; revision 2 §11 present |
| DEC-005 §5.4 preparation record | `8d789550fe01683b8a9ea8a75a0ac31a88887c52b4197c12fa882ecacb50adb8` | present; unchanged |
| DEC-005 preparation record | `61e9373add9674373027c3daed60255bad8cc6b17a07fc7b7f2737a35f94f819` | unchanged |
| INTENT-INTAKE-PO-DEC-004 | `0991bd9df847070c9b552e8f157e9399e3d3f3b8c8da6e09658675206003a412` | unchanged |
| INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | unchanged |
| Implementation fingerprint | `53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` | matches |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | matches |
| Staged files | none | matches |
| Working tree | 208 uncommitted entries before this record | recorded |
| `INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ` | not used by any existing record | confirmed |
| Later decision resolving these four questions | none | confirmed |

No database was connected to establish any fact in this record.

## 2. Scope of this decision

Exactly four questions, left open by INTENT-INTAKE-PO-DEC-005-SCHEMA:

- **Q1** — exact data types for the six fields;
- **Q2** — authoritative evidence source and semantics for the 3-C historical backfill;
- **Q3** — sequencing / mechanism for the 3-C backfill consistent with 4-A immutability;
- **Q4** — exact name of the already-decided 7-C index.

Not reopened: 1-A, 2-D, 3-C population, 4-A scope, 5-A, 6-B, 7-C columns and predicate, 8-B, Option B nullability.

## 3. Repository evidence (read-only; facts only)

| # | Fact | Source |
|---|---|---|
| R1 | Every identifier column in the provenance tables is `TEXT` (`id`, `prospect_id`, `signal_id`); ids are generated as `gen_random_uuid()::text`. | `0016_research_signals/migration.sql`; `packages/core-research/src/pgRepository.ts` (`INSERT INTO research_signals … VALUES (gen_random_uuid()::text, …)`) |
| R2 | Status / vocabulary values on `research_signals` (`kind`, `classification`, `field`) are `TEXT`. | 0016 |
| R3 | Every timestamp in `research_signals` is `TIMESTAMP(3)` (`observed_at`, `superseded_at`, `created_at`). No migration in `packages/db/prisma/migrations/` uses `TIMESTAMPTZ` or `WITH TIME ZONE`. | 0016; search over all migrations |
| R4 | The provider contract types `AiPlatformAuthorization.integrationId` as `string`, `basis` as `string`, `reference` as `string \| null`. The contract carries no field for authorization status, scope or timestamp. | `packages/core-research/src/intentSourceProviderContract.ts:107–111` |
| R5 | For AI-platform results, the contract validates `authorization.integrationId` / `basis` when present, then builds the adapter input (`AiPlatformAcquisitionRecord`) **without** the `authorization` object. Only a transient outcome note `authorization: 'PRESENT' \| 'MISSING'` is returned. | `intentSourceProviderContract.ts:424–459` |
| R6 | `research_signals` inserts write only `id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at`. No column, table or file in the repository persists integration-supplied authorization metadata. | `pgRepository.ts:73–75`; preparation record §2.3–§2.5 |
| R7 | The business identity carried by AI-platform results is `{ name, website }` and is used to attribute the signal to a Prospect; it is not an integration-supplied business identifier (preparation §2.5). | `intentSourceProviderContract.ts:433–439` |
| R8 | Prisma 5.22.0 wraps each migration file in one transaction. | `0002_concurrent_unique_indexes/migration.sql` ("Prisma 5.22.0 wraps each migration file in one") |
| R9 | Database immutability precedent: `BEFORE UPDATE OF <columns> … FOR EACH ROW` triggers raising a prefixed exception when `NEW.<col> IS DISTINCT FROM OLD.<col>`. | `0009_*/migration.sql` (`payments_captured_frozen`, `enforce_captured_payment_frozen()`) |
| R10 | Index names follow `<table>_<column(s)>_idx` (composite: `meta_events_status_next_attempt_at_idx`; this table: `research_signals_prospect_id_idx`, `research_signals_prospect_id_active_idx`). No index in any migration uses an `idx_` prefix. | all `CREATE INDEX` statements in `packages/db/prisma/migrations/` |

## 4. Q1 — Exact data types

**Decision:**

| Field | Type | Nullability | Default | Constraint |
|---|---|---|---|---|
| `business_id` | `TEXT` | NULL | none | none |
| `auth_status` | `TEXT` | NULL | none | none |
| `auth_scope` | `TEXT` | NULL | none | none |
| `auth_timestamp` | `TIMESTAMP(3)` | NULL | none | none |
| `integration_id` | `TEXT` | NULL | none | none |
| `revoked_at` | `TIMESTAMP(3)` | NULL | none | none |

No enum, CHECK constraint, lookup table, length restriction, default or foreign key is added.

**Rationale:** identifiers and status vocabularies on `research_signals` are `TEXT` (R1, R2); the contract types the
integration identifier as `string` (R4); every timestamp in the repository is `TIMESTAMP(3)` (R3). `business_id` is
opaque integration-supplied text, so `UUID` would reject valid values and would imply a structure no record establishes.
`auth_scope` has no established structure, so `JSONB` is not selected. Nullability is revision 1 Option B.

## 5. Q2 — Authoritative backfill evidence

**Finding:** the repository contains **no** authoritative source for any of the five dimensions for historical rows.
The authorization object is validated and then dropped before normalization and persistence (R5, R6); the persisted
business identity is not an integration-supplied identifier (R7); status, scope and timestamp are not carried by the
contract at all (R4).

**Decision:**

1. **What qualifies as authoritative evidence.** A value qualifies only if it (a) was supplied by the authorized
   integration for the specific intake event, (b) was retained at or after capture in a persisted, auditable record
   that exists at backfill time, and (c) states the specific dimension directly. Values derived, inferred,
   reconstructed, defaulted or copied from another dimension do not qualify. `prospect_id`, `source_label`,
   `created_at`, `observed_at`, `basis` and the transient `PRESENT` / `MISSING` note do not qualify (preparation §2.5;
   R5).
2. **Association with the historical signal.** A value may be written to a `research_signals` row only through an
   exact, one-to-one link from that row to the evidence record (the row's own `id`, or the integration event identifier
   preserved for that row). Matching by business name, website, time proximity or any heuristic does not qualify.
3. **Missing evidence.** Evaluated per field: a dimension without authoritative evidence stays NULL for that row.
4. **Ambiguous evidence.** If a row links to more than one evidence record, the evidence values conflict, or the link
   is not one-to-one, all five fields stay NULL for that row.
5. **Consequence on current evidence.** Because no authoritative source exists in the repository (Finding), the 3-C
   backfill population is **empty**: every historical row keeps NULL in all six fields. Using a source that later
   comes to light requires a separate Product Owner decision naming it; it is not inferred here.
6. **Unchanged:** PUBLIC_INTENT and non-AI-platform rows are excluded; `revoked_at` is not backfilled (revision 2
   §11.3); no synthetic value is permitted (revision 2 §11.1).

## 6. Q3 — Backfill vs. immutability sequencing

**Decision — migration ordering (option A), in one migration file:**

1. add the six nullable columns;
2. run the authorized 3-C backfill, restricted by §5 (empty on current evidence, so no row changes);
3. create the 7-C index;
4. create the 4-A immutability enforcement last.

Because Prisma wraps each migration file in one transaction (R8), the backfill and enforcement land atomically. There
is no window where evidence is written but unenforced, and no state where enforcement exists but the migration is
half-applied.

**Enforcement semantics:** a `BEFORE UPDATE OF business_id, auth_status, auth_scope, auth_timestamp, integration_id`
row trigger on `research_signals` that raises when any of those five columns `IS DISTINCT FROM` its old value,
following the 0009 precedent (R9). Once active it blocks every change to those five fields, including NULL to
non-NULL, so the values can be set only at `INSERT`. It does not cover `revoked_at`, `superseded_at` or any other
column (revision 2 §11.2), and does not govern row deletion (4-A is not whole-row).

**Not authorized:** any trigger bypass, session flag, `session_replication_role` change, disabled-trigger window,
privileged or application-layer mutation path, or later backfill under an active trigger. Backfilling after
enforcement is active would need a separate Product Owner decision.

**Rationale:** ordering inside one transactional migration needs no bypass, so the permanent rule is never weakened.
Option B (a migration-time bypass) would add a mechanism with no repository precedent.

## 7. Q4 — Index name

**Decision:** the 7-C index is named `research_signals_business_id_auth_status_idx`:

```sql
CREATE INDEX "research_signals_business_id_auth_status_idx"
    ON "research_signals"("business_id", "auth_status");
```

Columns and order (`business_id`, `auth_status`) are unchanged. This is a standard composite index with no partial
predicate. There are no additional columns, indexes, unique constraints, foreign keys or status-vocabulary
constraints.

**Rationale:** the repository has an established `<table>_<column(s)>_idx` convention with no `idx_` prefix (R10).
Under the rule given for this question, the convention applies. This supersedes only the name
`idx_research_signals_compliance` in revision 2 §11.4; nothing else in §11.4 changes.

## 8. Recording boundary

**A. Decided by this record:** Q1 types (§4); Q2 authoritative-evidence semantics (§5); Q3 sequencing (§6); Q4 index
name (§7).

**B. Governed separately — not authorized by this record:** DEC-005 implementation authorization; migration creation;
migration execution; database / schema modification; creating the index or trigger; backfill execution; runtime
lifecycle behavior (including revocation handling); provider-contract or adapter changes (including retaining the
authorization object); PUBLIC_INTENT changes; `migrations-blocked/` changes; production deployment; validation
sessions; database connections; provider / API calls; external HTTP requests.

**This decision record authorizes governance decisions only. It does not authorize schema modification, migration
creation, migration execution, backfill execution, production deployment, runtime changes, provider-contract changes,
or any other implementation activity.** Implementation remains governed by the separate DEC-005 implementation
authorization, which is PENDING PRODUCT OWNER DECISION. The privacy boundary (DEC-004 preparation §8) is unchanged.

## 9. Execution counters (this record)

```text
Files written: 2 (this record; one linkage line in INTENT-INTAKE-PO-DEC-005-SCHEMA)
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

**INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ DECIDED — PRODUCT OWNER — TYPES TEXT / TIMESTAMP(3) — BACKFILL POPULATION EMPTY
ON CURRENT EVIDENCE — ORDERED SINGLE-TRANSACTION MIGRATION, NO BYPASS — INDEX research_signals_business_id_auth_status_idx —
IMPLEMENTATION NOT AUTHORIZED**
