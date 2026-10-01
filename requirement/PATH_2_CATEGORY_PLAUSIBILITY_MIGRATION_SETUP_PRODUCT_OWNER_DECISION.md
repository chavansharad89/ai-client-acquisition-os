# PATH 2 — CATEGORY PLAUSIBILITY

## Migration 0027 / 0028 Session Setup Authority — Product Owner Decision Record

**Decision ID:** MIGRATION-SETUP-PO-DEC-001
**Status:** **DECIDED** (2026-09-29)
**Previous status:** PENDING PRODUCT OWNER DECISION
**Selected option:** **A — Operator setup is permitted**
**Authority granted by this record:** a classification of applying the existing migration files 0027
and 0028 as §9.3(b) session/runtime setup (see §3). No new session authority.
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_MIGRATION_SETUP_PRODUCT_OWNER_DECISION_PREPARATION.md`
(sha256 `a6d655a2700295054685ae6e37aa4f45beecd975ea603245e470fce6a5bb6f76`), kept unchanged for traceability
**Parent records:** VS-PO-DEC-001 §9.3(b)1, §9.10; session go-ahead preparation record revision 2 §14.5
**Product Owner:** Product Owner, by explicit selection given in the working session on 2026-09-29,
recorded here under that authorization
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
MIGRATION-SETUP-PO-DEC-001 .. DECIDED — OPTION A
MIGRATIONS 0027 / 0028 ...... NOT EXECUTED BY THIS RECORD
VS-PO-DEC-001 ............... NOT MODIFIED
VALIDATION SESSION .......... NOT PERFORMED
```

---

## 1. Decision question

As prepared (preparation record §4): under VS-PO-DEC-001 §9.3(b), which requires migrations 0027 and
0028 to be applied before the bounded validation session, and §9.10, which withholds authorization for
"any ... migration ... change", what authority, if any, permits application of the already-existing
migration files 0027 and 0028 as session setup?

## 2. Ruling

**Option A — Operator setup is permitted** (preparation record §5, as selected):

> Applying the existing migration files 0027 and 0028 is ordinary session/runtime setup required by
> §9.3(b), not a separately authorized migration change under §9.10.
>
> No additional authorization is required beyond the existing bounded-session authorization.
>
> No code or migration-file modification is permitted.

## 3. Scope as recorded (no additions)

| Item | Value |
|---|---|
| Files covered | `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql` (sha256 `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508`); `packages/db/prisma/migrations/0028_category_plausibility_source_documents/migration.sql` (sha256 `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986`), as existing at decision |
| Basis | The existing VS-PO-DEC-001 Option C bounded-session authorization (§9.3(b)1) |
| Migration-file modification | **Not permitted** |
| Code modification | **Not permitted** |
| §9.10 | Unchanged. This ruling classifies the setup step and does not amend §9.10. VS-PO-DEC-001 is not edited. |
| Verification | §9.3(b)1 "This is verified by the operator." (unchanged) |

**Not stated by the ruling (recorded, not inferred):** the command or tool used to apply the
migrations, and when they are applied relative to the session. This record adds neither.

## 4. Consequences

- The migration item in the go-ahead preparation record (§14.3, §14.5) is no longer a question of
  authority. It remains **not satisfied** until the operator applies the migrations and verifies them.
- No database connection, SQL, container action or Prisma command was made in preparing or recording
  this decision.

## 5. Implementation impact

```text
Application implementation required = NO
Migration-file change ............... = NO
Schema-definition change ............ = NO
Configuration change ................ = NO
New dependency required ............. = NO
New AI agent required ............... = NO
```

## 6. Authority boundary

This record does not itself apply any migration, and it does not authorize: a second session; a third
Search; provider, Places, Search or live-source calls beyond VS-PO-DEC-001 §9.4; direct human
database queries; modification of migration files, code, schema definitions, configuration or
dependencies; participant contact; Session ID assignment; or any edit to VS-PO-DEC-001 or other
decision records.

## 7. Status

```text
MIGRATION-SETUP-PO-DEC-001 .. DECIDED — A
Migrations 0027 / 0028 ...... NOT APPLIED (operator setup step pending)
Validation session .......... NOT PERFORMED
```

## STOP
