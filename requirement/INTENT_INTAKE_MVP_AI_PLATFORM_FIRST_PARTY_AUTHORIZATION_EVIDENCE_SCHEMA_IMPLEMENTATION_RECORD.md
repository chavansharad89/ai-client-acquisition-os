# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-005 Schema / Migration — Implementation Record

**Record ID:** INTENT-INTAKE-DEC-005-IMPL-REC-001
**Implements:** INTENT-INTAKE-PO-DEC-005 — **Option C — AUTHORIZE WITH ADDITIONAL RESTRICTIONS**
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_DECISION.md`, sha256
`0da5daed74ed9812bf2add6550468f39d1abe334400d66a70603a2fd0e1938da`; verified before implementation, not modified)
**Design authority:** INTENT-INTAKE-PO-DEC-005-SCHEMA (revision 2, sha256
`078f46834497ba70a188befb55d4d6998a5fefb9f45b5e56955b987c5fbd8a33`) and INTENT-INTAKE-PO-DEC-005-SCHEMA-PREREQ (sha256
`572359a848cc7170ff14ecac7c66bf52dad4f39b0ef8ade9e928b951e48151ca`). Both unchanged.
**Governing decisions:** DEC-004 (`0991bd9d…a412`), DEC-003 (`5d77fe84…4c41`). Both unchanged.
**Date:** 2026-09-30
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`53870a0247f74614091c8b51bf978075dba48650799770fdcaf34af1fea7441e` before and after. No tracked file changed; the
three new files are untracked.

```text
MIGRATION 0030 ............ CREATED — additive; 6 columns, 1 index, 1 function, 1 trigger
BACKFILL / DML ............ NONE — zero historical rows updated (C1)
APPLICATION CODE .......... UNCHANGED (C2, C3)
DATABASE .................. throwaway databases on 127.0.0.1:5433 only (C4)
UPPER ENVIRONMENTS ........ NOT EXECUTED — 5434 / production / other: none
COMMIT .................... NONE (C8)
```

---

## 1. Baseline (verified before implementation)

| Item | Result |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` — matches |
| DEC-005, DEC-005-SCHEMA, DEC-005-SCHEMA-PREREQ, DEC-005 / §5.4 preparation, DEC-004, DEC-003 | sha256 match |
| Implementation fingerprint | `53870a02…441e` — matches |
| Latest migration | `0029_research_signal_intent_kinds`; `0030` unused |
| Staged files | none |
| Local test server `127.0.0.1:5433` | reachable |

## 2. DEC-005 Option C restrictions — conformance

| Restriction | Conformance |
|---|---|
| C1 — no DML in the migration | Met. No `UPDATE` / `INSERT` / `DELETE`; asserted by the static test. Zero historical rows updated. |
| C2 — file scope | Met. Only the migration, one migration test, and this record. |
| C3 — no reader / writer of new columns | Met. No application code changed. |
| C4 — DB connections only to 5433 throwaway DBs | Met. Every connection went to temporary databases created and dropped by `tests/integration/support/pgIndexHarness.ts` on `127.0.0.1:5433`. |
| C5 — preparation §9 stop conditions | None triggered. |
| C6 — naming | Met. `0030`; trigger `research_signals_authorization_evidence_frozen`; function `enforce_research_signal_authorization_evidence_frozen()` (0009 convention). |
| C7 — implementation record | This record. |
| C8 — no commit / push / merge / deploy | Met. Nothing staged or committed. |

## 3. Implementation

**Migration path:**
`packages/db/prisma/migrations/0030_research_signal_authorization_evidence/migration.sql`
(sha256 `3dc76684e0b363ebae5aed9a258b2526bcbe42c95432ed503453f17878b529f8`)

Statement order: columns → index → function → trigger. The file runs as one transaction under Prisma (0002).

### 3.1 Schema changes (`research_signals` only)

| Column | Type | Nullable | Default |
|---|---|---|---|
| `business_id` | `TEXT` | yes | none |
| `auth_status` | `TEXT` | yes | none |
| `auth_scope` | `TEXT` | yes | none |
| `auth_timestamp` | `TIMESTAMP(3)` | yes | none |
| `integration_id` | `TEXT` | yes | none |
| `revoked_at` | `TIMESTAMP(3)` | yes | none |

No FK, CHECK, enum, status-vocabulary constraint, table, mapping table or source row. `research_signal_sources`
unchanged. `schema.prisma` unchanged (the research tables are not modelled there).

### 3.2 Index

```sql
CREATE INDEX "research_signals_business_id_auth_status_idx"
    ON "research_signals"("business_id", "auth_status");
```

Standard composite b-tree index. No partial predicate. No other index.

### 3.3 Trigger / function

```sql
CREATE OR REPLACE FUNCTION enforce_research_signal_authorization_evidence_frozen() RETURNS trigger ...
  -- raises 'research_signal_authorization_evidence_frozen: …' USING ERRCODE = '23514'
  -- when NEW.<f> IS DISTINCT FROM OLD.<f> for any of the five evidence fields

CREATE TRIGGER research_signals_authorization_evidence_frozen
  BEFORE UPDATE OF business_id, auth_status, auth_scope, auth_timestamp, integration_id ON research_signals
  FOR EACH ROW EXECUTE FUNCTION enforce_research_signal_authorization_evidence_frozen();
```

- **Protected:** `business_id`, `auth_status`, `auth_scope`, `auth_timestamp` and `integration_id`. Any change,
  including NULL to a value, is rejected, so evidence can be set only at `INSERT`.
- **Not protected:** `revoked_at`, `superseded_at` and every other column. There is no whole-row immutability, and
  the trigger does not govern deletes.
- **No bypass:** there is no bypass mechanism of any kind.

## 4. Tests

**New file:** `tests/integration/research-signal-authorization-evidence.integration.test.ts`
(sha256 `f48f49fe44623981f97071617bc46e5c8c8ab9d07a2df5e05d5563f2ba94f626`). It uses the existing harness and runs
against the throwaway databases on `127.0.0.1:5433`.

| # | Test | Result |
|---|---|---|
| 1 | Static: migration has no `INSERT INTO` / `DELETE FROM` / `UPDATE … SET`, no `DEFAULT`, `REFERENCES` or `CHECK` | pass |
| 2 | Six columns exist with decided types (timestamps precision 3), all nullable, no defaults | pass |
| 3 | `research_signals` constraints are exactly the six from 0016 — no new FK / CHECK | pass |
| 4 | Index definition is exactly `(business_id, auth_status)` btree, no `WHERE`; no other new index | pass |
| 5 | Trigger column list is exactly the five evidence fields | pass |
| 6 | Row inserted under 0029, then 0030 applied: all six columns NULL (no backfill) | pass |
| 7 | UPDATE of each of the five fields fails with `23514`; value→NULL and NULL→value also fail | pass |
| 8 | `revoked_at`, `superseded_at` and `confidence` update successfully; no-op self-assignment allowed | pass |

**Command:**
`npx vitest run --config integration/vitest.config.ts integration/research-signal-authorization-evidence.integration.test.ts`
(from `tests/`). Result: **8 / 8 passed**.

**Regression:** every integration suite applies the full migration chain, so these existing suites were re-run, also
against 5433 throwaway databases:
- `integration/research.integration.test.ts`: 17 / 17 passed;
- `integration/intent-intake.integration.test.ts`: 5 / 5 passed.

The full integration suite was not run.

**Test data:** synthetic values (`biz-test`, `status-test`, etc.) inserted only into throwaway databases, which the
harness dropped afterwards. No production data was used.

## 5. Confirmations

- **No DML / backfill:** migration 0030 contains no data-changing statement; no historical row was backfilled or
  updated.
- **No application code changed:** no production code, provider contract, adapter, `schema.prisma`, configuration,
  dependency or `migrations-blocked/` file changed. The tracked-file fingerprint is unchanged.
- **No upper-environment migration:** nothing was executed against `5434`, production or any other environment. The
  migration ran only inside throwaway databases on `127.0.0.1:5433`.
- **New columns unused:** no application code reads or writes them. Because the provider contract does not retain
  authorization metadata, they stay NULL for new rows until separately authorized provider-contract work exists.

## 6. Safety counters

```text
Files written: 3 (migration, migration test, this record)
Production code changes: 0
Test changes: 1 (new migration test file; no existing test modified)
Migration changes: 1 (new 0030; no existing migration modified)
Schema changes: 1 migration authored (applied to throwaway 5433 databases only)
Configuration changes: 0
Dependency changes: 0
Database connections: throwaway databases on 127.0.0.1:5433 only (test harness)
Database writes: throwaway 5433 databases only (created, migrated, seeded, dropped)
Database connections to 5434 / production / upper environments: 0
Migrations executed outside throwaway 5433 databases: 0
Historical rows backfilled: 0
Provider calls: 0
External HTTP requests: 0
Browser automation: 0
Live-source fetches: 0
Worker executions: 0
Participant contacts: 0
Validation sessions: 0
Commits: 0
```

**DEC-005 OPTION C IMPLEMENTED — MIGRATION 0030 CREATED AND VERIFIED ON 5433 THROWAWAY DATABASES — NO DML — NO
APPLICATION CHANGES — NO UPPER-ENVIRONMENT EXECUTION — NOT COMMITTED**
