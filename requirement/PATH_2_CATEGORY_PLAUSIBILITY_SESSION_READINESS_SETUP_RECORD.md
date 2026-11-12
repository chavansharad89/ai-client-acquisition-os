# PATH 2 — CATEGORY PLAUSIBILITY

## §9.3(b) Session-Readiness Setup Record

**Record ID:** VS-SETUP-REC-001
**Type:** Operator setup and readiness record. It is not a decision and grants no authority.
**Date:** 2026-09-29
**Authority basis (unchanged):**
- VS-PO-DEC-001 Option C: the sole session authority (one bounded session; §9.3(b), §9.4, §9.8).
- VS-GO-PO-DEC-001 = A: no additional go-ahead once §9.3(b) is satisfied and recorded.
- MIGRATION-SETUP-PO-DEC-001 = A: applying the existing, unmodified 0027/0028 files is §9.3(b)
  operator setup.

**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28` (implementation uncommitted; nothing staged)

```text
MIGRATIONS 0027 / 0028 .... APPLIED (operator setup, this record)
READINESS ................. NOT READY — §9.8 STOP
VALIDATION SESSION ........ NOT PERFORMED
```

This record was created separately so that the VS-GO preparation record, whose sha256 is pinned in
VS-GO-PO-DEC-001, stays unchanged.

---

## 1. Baseline (before any action)

| Item | Value |
|---|---|
| `git status --short` entries | 166 |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `3ce19e2b00abd8e06fa70d0f517a15acf5ec3edcfbcfe6324cb04e59efc68a2e` |
| 0027 `migration.sql` sha256 | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` (= MIGRATION-SETUP-PO-DEC-001 §3) |
| 0028 `migration.sql` sha256 | `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986` (= MIGRATION-SETUP-PO-DEC-001 §3) |
| Gate Audit / VS-READY / VS-PO-DEC-001 sha256 (first 16) | `85831899387e2eec` / `306b8bc6b4756ffa` / `92249c8f830a4a18` |
| Migration-setup decision / VS-GO decision / VS-GO preparation sha256 (first 16) | `5468bcba03d01665` / `9dd3ef4167880420` / `361b91243b47674c` |
| Web app / worker processes | None; nothing listening on 3000/3001 |
| Runtime DB | `localhost:5434/acos_dev` in container `acos_postgres_validation` (credentials not read out); container Exited |

## 2. Migration setup (MIGRATION-SETUP-PO-DEC-001 = A)

1. The container `acos_postgres_validation` was started (ready after 1 `pg_isready` probe).
2. `prisma migrate status` (read-only; Prisma 5.22.0 from the local install; telemetry disabled with
   `CHECKPOINT_DISABLE=1`) reported exactly two unapplied migrations, 0027 and 0028, and no drift.
3. File hashes re-checked against MIGRATION-SETUP-PO-DEC-001 §3: **match**.
4. `prisma migrate deploy` applied `0027_category_plausibility_determinations` and then
   `0028_category_plausibility_source_documents`: "All migrations have been successfully applied."
   No other migration ran. No file was modified or generated.
5. Read-only verification query on `_prisma_migrations`:

| migration_name | finished | not rolled back | applied_steps_count | finished (time) |
|---|---|---|---|---|
| 0026_ai_usage_events_fallback_request_kind | t | t | 1 | 14:22:47.618 (earlier date) |
| 0027_category_plausibility_determinations | t | t | 1 | 09:33:48.400 |
| 0028_category_plausibility_source_documents | t | t | 1 | 09:33:48.408 |

6. File hashes after application: unchanged.
7. **Container left running.** Stopping it afterwards was not permitted in this environment's
   permission mode, so `acos_postgres_validation` remains running. Nothing else was started. Whether
   it stays running until the session is the operator's choice.

## 3. §9.3(b) readiness matrix

| §9.3(b) prerequisite | Status | Evidence | Action remaining |
|---|---|---|---|
| P5 web app running | **UNVERIFIED** | Not running; not started | Operator starts and verifies at session start |
| P5 worker running | **UNVERIFIED** | Not running; not started. Starting it could consume queued Search jobs and trigger external calls, so it was not started. | Operator starts it at session start |
| P5 Postgres reachable | **SATISFIED** (at time of record) | Container running; accepted connections; `migrate status` / query succeeded | Re-confirm at session start |
| Migration 0027 applied | **SATISFIED** | §2 item 5 | None |
| Migration 0028 applied | **SATISFIED** | §2 item 5 | None |
| P5 Places key/quota confirmed by operator (account/console) | **UNVERIFIED** | `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACES_API_BASE_URL` present by name; no local quota source; no call made | Operator confirms from the console |
| §9.3(b)2 provider configuration recorded | **UNVERIFIED** | No `RESEARCH_*` key in `.env`, `apps/web/.env.local` or the shell; `packages/config/src/env.ts:72, 76` defaults to `anthropic` with no fallback; the environment of the process that will run the session is not established | Record at session start (non-secret) |
| §9.3(b)3 roles recorded | **SESSION-TIME** | R-1, R-2 = Product Owner; D11-H §1 / Companion §1 fields present and blank | Record at session start |
| §9.3(b)4 participant arranged | **NOT YET RECORDED** | No record of an arranged participant; none contacted | Facilitator arranges one (§9.6) |
| §9.3(b)5 P8 design agreed and recorded | **SATISFIED** | VS-READY R-3–R-7, R-8; P8-PO-DEC-001; TPL-SEARCH-ID; SVC-BLOCK; URL-DOMAIN; EVID-TRACE; Gate §11 item 8 | None |
| §9.3(b)6 D11-H / Companion blank for live values | **SATISFIED** | D11-H §1 blank, "NOT YET PERFORMED"; Companion §1–§2 "Live values: BLANK"; linkage, Session ID, §12/§4.x evidence and §14 provider fields present; hashes unchanged | None |
| Session ID | **SESSION-TIME** | SESSION-ID-PO-DEC-001: assigned by the facilitator at session time — not yet assigned | Assign at session start |
| Session-start fingerprint (R-11) | **SESSION-TIME** | Reference implementation fingerprint in §1; not a substitute | Re-capture at session start |

## 4. Classification

```text
NOT READY — §9.8 STOP
Unmet before execution: web app running; worker running; provider configuration recorded;
Places quota confirmed; participant arranged; roles, Session ID and fingerprint (session-time).
```

No governance question is open. The session remains stopped under VS-PO-DEC-001 §9.8 until every
§9.3(b) item is true and recorded.

## 5. Activity during this setup

| Counter | Value |
|---|---|
| Anthropic / other provider calls | 0 |
| Google Places / Google Search calls | 0 |
| Live-source fetches | 0 |
| Participant contacts / sessions / determinations | 0 / 0 / 0 |
| Database connections | 4: `pg_isready` probe ×1; `prisma migrate status` ×1; `prisma migrate deploy` ×1; `psql` verification ×1 |
| Read-only SQL queries (by this operator) | 1 (`_prisma_migrations` verification); Prisma's own internal status queries not counted individually |
| Migrations executed | 2 (0027, 0028), via `prisma migrate deploy` |
| Container actions | 1 start (`acos_postgres_validation`); stop not performed (not permitted) |
| Code / migration file / schema / config / dependency / lockfile changes | 0 |

## STOP
