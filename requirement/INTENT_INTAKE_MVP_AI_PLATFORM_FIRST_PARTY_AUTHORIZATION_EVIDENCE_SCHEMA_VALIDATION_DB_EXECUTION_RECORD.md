# INTENT INTAKE MVP

## AI-Platform FIRST_PARTY Authorization Evidence — DEC-005 — Validation-Database Migration Execution Record

**Record ID:** INTENT-INTAKE-DEC-005-EXEC-REC-001
**Implements:** INTENT-INTAKE-PO-DEC-005 (Option C), implemented under INTENT-INTAKE-DEC-005-IMPL-REC-001
(`requirement/INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_SCHEMA_IMPLEMENTATION_RECORD.md`)
**Execution approval:** DEC-005 Validation Database Migration Approval — **APPROVE**, Decided by: Product Owner,
Decision date: 2026-09-30 (working session). The approval covers:
- point 1: apply 0029 and 0030 together through the normal Prisma path;
- point 2: no manual `_prisma_migrations` change and no direct SQL;
- point 3: read-only pre- and post-checks on `127.0.0.1:5434`.

**Date:** 2026-09-30
**Target:** `localhost:5434/acos_dev` (container `acos_postgres_validation`, PostgreSQL 16.14), resolved from
`DATABASE_URL` in `.env`; credentials not read out.

```text
MIGRATIONS APPLIED ........ 0029_research_signal_intent_kinds, 0030_research_signal_authorization_evidence
TARGET .................... localhost:5434/acos_dev ONLY
MECHANISM ................. prisma migrate deploy (Prisma 5.22.0, CHECKPOINT_DISABLE=1)
POST-CHECKS ............... ALL PASSED (read-only)
EXISTING ROWS ............. 366 before / 366 after; checksum UNCHANGED
HISTORICAL BACKFILL ....... NONE — 0 rows populated in any of the six new columns
PRODUCTION / UPPER ENV .... NOT TOUCHED
COMMIT .................... NONE
```

---

## 1. Execution history

1. **First attempt:** preflight passed. The deploy command was blocked by Claude Code's permission system (no reason
   given). Nothing ran.
2. **Second attempt:** preflight passed and a pre-execution checksum was taken (§2). Blocked again. Nothing ran.
3. **Third attempt:** preflight passed. Blocked again ("Modify Shared Resources"). Nothing ran.
4. **Fourth attempt:** the Product Owner granted the Claude Code permission. Preflight passed and the command ran
   successfully (§3).

After each blocked attempt, a read-only `prisma migrate status` confirmed 0029 and 0030 were still pending. No
alternative execution route was attempted.

During the first preflight, `prisma --version` was run once without `CHECKPOINT_DISABLE=1`, so the CLI may have made
one telemetry request. Every other Prisma command used `CHECKPOINT_DISABLE=1`.

## 2. Preflight (read-only; session `default_transaction_read_only=on`)

| Check | Result |
|---|---|
| Target | `acos_dev` at `localhost:5434` — **pass** |
| `prisma migrate status` | exactly `0029_research_signal_intent_kinds`, `0030_research_signal_authorization_evidence` pending; no drift — **pass** |
| `_prisma_migrations` | latest `0028_category_plausibility_source_documents`; no unfinished / rolled-back rows — **pass** |
| `research_signals` | exists; 11 original columns; pre-0029 `kind` CHECK; no 0030 columns, index, trigger or function — **pass** |
| Row count | 366 (FIRST_PARTY 0, PUBLIC_INTENT 0, superseded 144) — **pass** |
| Checksum | `f1b53798cb70810707ee33adab37f6fd` — **pass** |
| Migration file sha256 | 0029 `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c`; 0030 `3dc76684e0b363ebae5aed9a258b2526bcbe42c95432ed503453f17878b529f8` (= IMPL-REC-001) |

**Checksum definition:**
`md5(string_agg(concat_ws('|', id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at,
superseded_at, created_at), E'\n' ORDER BY id))` over `research_signals`, covering the 11 columns that existed before
0030.

## 3. Execution

Command, run from the repository root:

```bash
CHECKPOINT_DISABLE=1 packages/db/node_modules/.bin/prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

Output: "Applying migration `0029_research_signal_intent_kinds`", then "Applying migration
`0030_research_signal_authorization_evidence`", then "All migrations have been successfully applied." No other
migration ran. No SQL was executed directly and `_prisma_migrations` was not edited by hand.

## 4. Post-checks (read-only)

| # | Check | Result |
|---|---|---|
| 1 | 0029 and 0030 in `_prisma_migrations`: finished, not rolled back, `applied_steps_count` 1; no unfinished / rolled-back rows | **pass** |
| 2 | `prisma migrate status`: "Database schema is up to date!" (no drift, nothing pending) | **pass** |
| 3–4 | `business_id`, `auth_status`, `auth_scope`, `integration_id`: `text`, nullable. `auth_timestamp`, `revoked_at`: `timestamp without time zone` precision 3 (`TIMESTAMP(3)`), nullable | **pass** |
| 5 | No defaults on the six columns (only `created_at` has a default, from 0016). Constraints unchanged from 0016 except `research_signals_kind_check`, widened by 0029 to add `PUBLIC_INTENT` and `FIRST_PARTY`, as 0029 defines. No FK, CHECK or enum added by 0030 | **pass** |
| 6 | `CREATE INDEX research_signals_business_id_auth_status_idx ON public.research_signals USING btree (business_id, auth_status)` with no `WHERE`; no other new index | **pass** |
| 7 | Trigger `research_signals_authorization_evidence_frozen` enabled: `BEFORE UPDATE OF business_id, auth_status, auth_scope, auth_timestamp, integration_id … FOR EACH ROW EXECUTE FUNCTION enforce_research_signal_authorization_evidence_frozen()`. Function present. Protected columns are exactly the five evidence fields | **pass** |
| 8 | `revoked_at` and `superseded_at` are not in the trigger column list, and the function body does not reference them | **pass** |
| 9 | Row count 366 (FIRST_PARTY 0, PUBLIC_INTENT 0, superseded 144), same as preflight | **pass** |
| 10–11 | Checksum `f1b53798cb70810707ee33adab37f6fd`, **identical** to preflight: no existing row changed | **pass** |
| 12 | Non-NULL counts for all six new columns: 0 / 0 / 0 / 0 / 0 / 0 — no historical backfill | **pass** |

No write-based behavioral test was run on 5434. Behavioral immutability was verified only on 5433 throwaway databases
(IMPL-REC-001 §4).

## 5. Confirmations

- **No backfill:** no historical rows were backfilled. All six new columns are NULL on all 366 rows.
- **Immutability scope:** `revoked_at` and `superseded_at` remain outside the immutability trigger and are updateable.
  Only the five evidence fields are protected.
- **Other environments:** no production or upper environment was touched. No connection was made to 5433 or any
  other database during this execution.
- **No other changes:** no application code, migration file, test, configuration, dependency or governance record
  changed. Only this record was written.
- **Other activity:** no provider or API calls, no external HTTP (apart from the possible telemetry request noted in
  §1), no validation session and no participant contact.
- **Source control:** nothing staged or committed.

## 6. Safety counters

```text
Files written: 1 (this record)
Migrations executed: 2 (0029, 0030) — on localhost:5434/acos_dev only
Database connections: localhost:5434/acos_dev only (read-only checks + one prisma migrate deploy)
Database writes: DDL from 0029/0030 + 2 _prisma_migrations rows written by Prisma; 0 data rows changed
Historical rows backfilled: 0
Production / upper-environment connections: 0
5433 connections (this execution): 0
Write-based behavioral tests on 5434: 0
Production code changes: 0
Test changes: 0
Migration file changes: 0
Configuration changes: 0
Dependency changes: 0
Provider calls: 0
External HTTP requests: 0 intended; possibly 1 Prisma telemetry attempt (§1)
Browser automation: 0
Live-source fetches: 0
Worker executions: 0
Participant contacts: 0
Validation sessions: 0
Staged: 0
Commits: 0
```

**0029 + 0030 APPLIED TO localhost:5434/acos_dev — ALL READ-ONLY POST-CHECKS PASSED — CHECKSUM UNCHANGED — NO BACKFILL —
NO PRODUCTION / UPPER ENVIRONMENT — NOT COMMITTED**
