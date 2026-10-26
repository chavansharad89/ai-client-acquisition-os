# Governance Record: CMS Administrator Representation (CMS-PO-006)

**Identifier-collision notice (read first):** `CMS-PO-006` was already used in `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md` for a *different* decision (the DRAFT→PUBLISHED→ARCHIVED content lifecycle, there disambiguated as `CMS-PO-006(R1)` once the R1/R2 collision was discovered). That file is **not rewritten**. Per the same disambiguation convention that file itself established for the R1/R2 collision, this round's decision is referred to as **`CMS-PO-006(R3)`** anywhere precision matters, and as `CMS-PO-006` only where the Product Owner's own words are quoted verbatim. This is the second time `CMS-PO-00N` numbering has collided across rounds; a future housekeeping pass should renumber all three rounds onto non-colliding IDs.

**Scope:** Record the Product Owner's decision on how a CMS administrator is represented and authorized, following CMS Phase 4A's read-only finding that no role/permission/admin concept exists anywhere in this repository today. No admin API or UI is built by this record. No migration is applied by this record.

## 1. Background — why this decision was needed

CMS Phase 3 deferred the CMS administration HTTP API because the repository had no established admin authentication/authorization mechanism. CMS Phase 4A's read-only survey confirmed this exhaustively:

- `users` (`packages/db/prisma/migrations/0012_user_identity/migration.sql`, extended by `0038`/`0043`) has exactly 9 columns — `id, email, created_at, password_hash, email_verified_at, first_name, last_name, phone, date_of_birth` — no role/tier/kind/`is_admin` column anywhere.
- `StoredUser` (`packages/core-identity/src/types.ts`) is `{id, email, createdAt}`.
- `requireUser()`/`resolveSession()` (`packages/core-identity/src/session.ts`) resolve an opaque session token to a bare `userId: string` — no privilege, no role.
- No `/admin` route exists anywhere in `apps/web/app/api/`.
- Repo-wide grep for `role`/`permission`/`isAdmin`/`admin`/`authorization` found zero real RBAC hits (only unrelated homonyms: LLM message roles, a lead's job title, download-grant "authorization").
- `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md` line 76 and `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` §7 had already independently reached the same conclusion and declined to invent a mechanism without a decision.

Deciding how "CMS administrator" is represented is therefore a genuine product/security decision, not an engineering implementation detail — it determines who can write customer-facing content and how that privilege is granted and revoked.

## 2. The decision, recorded verbatim

> **CMS-PO-006(R3) — CMS Administrator Representation.** I approve Option 3 — a separate `cms_admins` table keyed by `users.id`. CMS administrator status is represented by membership in a dedicated `cms_admins` table. The model is: authenticated user + row in `cms_admins` = CMS administrator. CMS admin status MUST NOT be derived from a Plus, Pro, or Max subscription, payment history, entitlement history, ProductId, or customer status. There is no self-service admin provisioning. CMS administrator membership must only be provisioned through a trusted operator-controlled mechanism. For the development environment, the initial administrator may be provisioned explicitly by a trusted operator/database operation after the schema exists.

## 3. Alternatives considered

1. **Boolean `users.is_cms_admin`.** Smallest column-level diff, but mutates the core identity table; a wrong migration default or future bug in user-creation code could, in principle, default a customer into admin.
2. **`users.role` (e.g. `'customer' | 'cms_admin'`).** Same risk class as (1); leaves room for more roles later at the cost of the same default-correctness hazard now, for a need (a general role system) this decision explicitly does not want.
3. **Dedicated `cms_admins` table.** Admin-ness is a row's *presence*, not a column's value — no existing user row can become admin by a wrong default, because there is no column on `users` to default at all.

## 4. Selected

Option 3 — dedicated `cms_admins` table.

## 5. Rationale

- Smallest security blast radius: a migration mistake can add an unwanted row to a new, empty table, but cannot flip an existing customer's identity row into "admin" via a bad default.
- Explicit, membership-based authorization — "is this `user_id` present in `cms_admins`" is a single unambiguous check, not a value comparison that could be mis-typed (`'admin'` vs `'Admin'`, `true` vs `1`, etc.).
- Does not alter the core customer identity model (`users`) at all — zero risk to the existing signup/login/session code path.
- Consistent with this repository's existing presence-based access pattern: `entitlements` and `subscription_periods` both express "access granted" as "a row exists for this user," never as a flag — this decision extends that same idiom to CMS administration rather than introducing a second one.
- Avoids dangerous default-value mistakes structurally, not by convention or code review discipline.
- Supports multiple administrators without any schema change.
- Keeps CMS administration fully independent from commercial entitlements: nothing a customer purchases, claims, or subscribes to can ever insert a row into this table.

## 6. Provisioning

- No self-service admin signup.
- No automatic promotion from any customer state (Plus/Pro/Max subscription, payment, entitlement).
- Admin membership is controlled exclusively by a trusted operator acting directly against the database (or an operator-only tool built in a later phase) — never through a customer-facing or self-service code path.
- The initial development-environment administrator's identity is **not supplied by this record** and must not be invented here; it will be provisioned explicitly, separately, once the schema exists.

## 7. Relationship to existing governance

No existing decision defines an administrator concept for this repository — this is a greenfield decision with nothing to supersede or conflict with. It is consistent with, and resolves, the open gap both `PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md` (line 76, "no role concept to extend") and `PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` (§7, "this spec does not design a specific admin authentication architecture... called out as a Phase 2 dependency and a risk") had already flagged as outstanding.

## 8. Implementation status

This is a Product Owner governance record. As of this record:

- No migration has been applied.
- No code implementing `cms_admins`, its repository, or an authorization service has been written.
- No admin row has been inserted anywhere, in any environment.
- No CMS admin API or UI has been built.

A draft (unapplied) migration SQL file implementing this schema has been prepared under `packages/db/prisma/migrations/0065_cms_admins/migration.sql`, per this repository's existing convention of authoring a complete, reviewable migration file before it is applied in a separate, explicitly authorized step (the same convention followed for migrations `0061`–`0064`).
