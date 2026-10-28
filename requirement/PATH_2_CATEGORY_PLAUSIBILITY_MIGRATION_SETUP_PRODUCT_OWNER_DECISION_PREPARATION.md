# PATH 2 — CATEGORY PLAUSIBILITY

## Migration 0027 / 0028 Session Setup Authority — Product Owner Decision Preparation

**Decision ID (reserved):** MIGRATION-SETUP-PO-DEC-001
**Status:** **DECIDED** (round 1; see §8–§9). Earlier status: PENDING (§7).
**Parent records:** VS-PO-DEC-001 (§9.3(b)1, §9.10); `PATH_2_CATEGORY_PLAUSIBILITY_SESSION_GO_AHEAD_PRODUCT_OWNER_DECISION_PREPARATION.md`
(revision 2, §14.3–§14.5)
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

**Revision history**

| Revision | Date | Change |
|---|---|---|
| 1 | 2026-09-29 | Created; question and unranked options prepared. |
| 2 | 2026-09-29 | Decision round 1: Product Owner selected A. Decision record created. §8–§9 added. |

```text
THIS RECORD ............... PREPARATION ONLY — NO DECISION, NO AUTHORITY, NO EXECUTION
MIGRATIONS 0027 / 0028 .... NOT EXECUTED
VS-PO-DEC-001 ............. NOT MODIFIED
```

---

## 1. Governing wording (verbatim)

| Source | Text |
|---|---|
| VS-PO-DEC-001 §4 P5 | "Postgres reachable with the category-plausibility migrations applied (0027, and 0028 for M-2 capture)" |
| VS-PO-DEC-001 §9.3(b)1 | "Postgres is reachable, with migrations 0027 and 0028 applied." / "This is verified by the operator." |
| VS-PO-DEC-001 §9.3(b) | "The session must not start until all of these are true and recorded." |
| VS-PO-DEC-001 §9.10 Withheld | "any code, test, schema, migration or configuration change;" |
| VS-PO-DEC-001 §2 item 7 | "The M-2 and Q-1 implementations and migrations 0027/0028 currently exist as uncommitted working-tree changes on top of HEAD `5992b82`." |

## 2. Current state (from the go-ahead preparation record, revision 2, §14)

- Runtime database `localhost:5434/acos_dev` (`acos_postgres_validation`, stopped). The latest applied
  migration is `0026_ai_usage_events_fallback_request_kind`. 0027 and 0028 are **not applied**.
- The readiness classification is **BLOCKED** on §9.3(b)1.
- Migration files at drafting (sha256, first 16 hex, not executed):
  `0027_category_plausibility_determinations/migration.sql` `11823808d44c89ec`;
  `0028_category_plausibility_source_documents/migration.sql` `bd8777158f84bcfe`.

## 3. Gap

§9.3(b)1 requires 0027 and 0028 to be applied before the session, and says the operator verifies
this. It does not say who applies them. §9.10 withholds "any … migration … change". No record states
whether applying the existing, unmodified migration files to the runtime database is that withheld
change or is operator runtime setup.

## 4. Question

> Under VS-PO-DEC-001 §9.3(b), which requires migrations 0027 and 0028 to be applied before the
> bounded validation session, and §9.10, which withholds authorization for "any ... migration ...
> change", what authority, if any, permits application of the already-existing migration files 0027
> and 0028 as session setup?

## 5. Options (unranked)

| Option | Content | Required value |
|---|---|---|
| **A — Operator setup is permitted** | Applying the existing migration files 0027 and 0028 is ordinary session/runtime setup required by §9.3(b), not a separately authorized migration change under §9.10. No additional authorization is required beyond the existing bounded-session authorization. No code or migration-file modification is permitted. | None |
| **B — Explicit PO authorization required** | Applying 0027 and 0028 is a migration action covered by §9.10. A separate explicit PO authorization is required before either migration may be executed. | The exact permitted scope/limits of that authorization |
| **C — Do not apply under current authorization** | The existing authorization does not permit applying 0027/0028. The session remains blocked unless a later governance decision explicitly changes the authority. | None |
| **D — Other** | A bounded ruling with exact authority and limits. | The exact authority and limits |

Under every option the migration files are not modified, and nothing is executed by this record or by
its decision record.

## 6. Authorization boundary

This record authorizes nothing. It does not apply any migration, and makes no database connection, SQL
query, Prisma command, container action, provider, Places, Search or live-source call. It changes no
code, schema, configuration or migration file, contacts no participant and executes no session.

## 7. Status at preparation (retained; superseded by §9)

```text
MIGRATION-SETUP-PO-DEC-001 .. PENDING PRODUCT OWNER DECISION
```

## 8. Decision round 1 — outcome (2026-09-29)

| Field | Value |
|---|---|
| PO selection (as made) | **A — Operator setup** (§5 option A) |
| Required value | None under option A |
| Result | **DECIDED** — recorded in `PATH_2_CATEGORY_PLAUSIBILITY_MIGRATION_SETUP_PRODUCT_OWNER_DECISION.md` |
| Executed | Nothing. Migrations 0027/0028 not applied. |

## 9. Status (current)

```text
MIGRATION-SETUP-PO-DEC-001 .. DECIDED — A (see decision record)
```

## STOP
