# Learning Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in customer's topic-level progress (viewed / completed) on the CMS roadmap be recorded and queried server-side, with no trust placed in anything the client sends beyond which topic was touched.

**Architecture:** One new table, `content_item_progress` (one row per (user, ASSET-leaf topic)), written through two idempotent Postgres upserts in a new `core-cms` repository, exposed by two product-scoped POST routes that reuse the existing `requireUser()` / `getAccessibleCmsContentItem()` authorization chain verbatim — no new auth or entitlement logic. A second, narrowly-scoped trigger on the pre-existing `content_items` table protects the new table's ASSET-only invariant against a future node_type change.

**Tech Stack:** Next.js App Router route handlers, raw-SQL Postgres migrations (Prisma Migrate, no Prisma schema model for this domain), the existing `@acos/core-cms` repository pattern, the existing `@acos/rate-limit` package.

**Spec:** This plan implements the Product Owner-approved design produced earlier in this conversation (Phase 1 URL design, Phase 2 schema proposal and its two review rounds). There is no separate spec file — the exact migration SQL, upsert SQL, API contract, and rate-limit policy values below are copied verbatim from that approved design and are not to be altered without a new Product Owner decision.

## Global Constraints

- Topic-level (ASSET-leaf) tracking only — no lesson/exercise-level model (PO decision).
- No un-completion path — `status` only ever moves `IN_PROGRESS` → `COMPLETED`, never back (PO decision).
- `user_id` is resolved exclusively via `requireUser()` — never accepted from the client, in body, query, or header.
- `getAccessibleCmsContentItem()` is the sole entitlement decision for every read/write of a topic; it takes no `productId`. The URL's `params.productId` is compared against the resolved item's `owningProductId` only as a consistency check, never as the authorization itself.
- Every rejection (nonexistent id, wrong product, non-ASSET, unentitled/archived) returns the same shape — no response may let a caller distinguish one denial reason from another.
- Rate limiting reuses the existing `@acos/rate-limit` package and `apps/web/src/server/rateLimit.ts` wrapper — no new rate-limiting mechanism.
- The ASSET/CONTAINER race between Task 1's and Task 2's triggers is closed by real PostgreSQL row-level locking (`SELECT ... FOR SHARE` inside Task 1's trigger, contending against the implicit row lock Task 2's `UPDATE` already takes) — never by an application-level check, and never by assuming a particular statement ordering.
- The unauthenticated response for both new routes is pinned to the exact behavior of the existing download route (`apps/web/app/access/[productId]/download/[assetId]/route.ts:79-85`): on `UnauthenticatedError`, `NextResponse.redirect(new URL('/access/login', loadEnv().APP_BASE_URL))` — never a bare 401, and never built from `request.url`.
- Out of scope, do not touch: topic-detail UI, roadmap UI, a learning dashboard, auth/entitlement architecture itself, payment/subscription code, production deployment.
- Before creating each migration folder, re-run `ls packages/db/prisma/migrations | sort | tail -3` and use the actual next number — this branch has had migrations land out of band with this conversation; 0069/0070 below are provisional.

## Review Focus

- A "view" call racing with a "complete" call for the same (user, topic) must never leave `status` regressed to `IN_PROGRESS`, `completed_at` cleared, or `first_viewed_at` disturbed — Task 3's real-concurrency test.
- A concurrent progress-insert and a concurrent `node_type` change on the *same* content item must never both succeed — whichever one commits first must cause the other to be rejected against the now-current state, proven by real Postgres row locking, not test ordering — Task 2's concurrency test.
- A `contentItemId` that is a real, entitled ASSET but belongs to a different product than the one in the URL must be rejected, not silently accepted — Task 4's route tests.
- A `contentItemId` referencing a CONTAINER must be rejected at the database layer even if a future application bug tries to write it — Task 1's integration test.
- Deleting the owning user's account must remove their progress rows (CASCADE), not error or leave orphans — Task 1's integration test.
- Two different users with progress on the *same* `content_item_id` must never collide or leak into each other's rows — Task 4's cross-user isolation test.

---

### Task 1: `content_item_progress` migration

**Files:**
- Create: `packages/db/prisma/migrations/<next>_content_item_progress/migration.sql`
- Test: `tests/integration/cms-content-item-progress.integration.test.ts`

**Interfaces:**
- Produces: table `content_item_progress` (columns `id, user_id, content_item_id, status, first_viewed_at, last_viewed_at, completed_at, created_at, updated_at`), consumed directly by Task 3's repository via raw SQL.

- [ ] **Step 1: Re-verify the next migration number**

Run: `ls packages/db/prisma/migrations | sort | tail -3`
Use the actual next integer; do not assume 0069.

- [ ] **Step 2: Write the migration file verbatim**

```sql
CREATE TABLE "content_item_progress" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id"          TEXT NOT NULL,
    "content_item_id"  TEXT NOT NULL,
    "status"           TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "first_viewed_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"     TIMESTAMP(3),
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_item_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "content_item_progress_status_valid"
        CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT "content_item_progress_completed_consistency" CHECK (
        ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL)
        OR
        ("status" = 'IN_PROGRESS' AND "completed_at" IS NULL)
    ),
    CONSTRAINT "content_item_progress_last_viewed_after_first"
        CHECK ("last_viewed_at" >= "first_viewed_at")
);

CREATE UNIQUE INDEX "content_item_progress_user_content_item_key"
    ON "content_item_progress"("user_id", "content_item_id");

CREATE INDEX "content_item_progress_user_last_viewed_idx"
    ON "content_item_progress"("user_id", "last_viewed_at" DESC);

ALTER TABLE "content_item_progress" ADD CONSTRAINT "content_item_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_item_progress" ADD CONSTRAINT "content_item_progress_content_item_id_fkey"
    FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Locking strategy (resolves the concurrent ASSET<->CONTAINER race with
-- Task 2's trigger): FOR SHARE takes a row lock on the referenced
-- content_items row that conflicts with the row lock any UPDATE on that
-- same row already takes (Postgres's implicit NO KEY UPDATE lock),
-- including Task 2's `UPDATE ... SET node_type`. Multiple concurrent
-- FOR SHARE readers never block each other, so many users viewing the
-- same topic concurrently is unaffected. Whichever of this INSERT or a
-- concurrent node_type UPDATE reaches the row first forces the other to
-- wait; Postgres re-reads the row's current committed state once the
-- wait ends (standard READ COMMITTED re-check), so the waiter always
-- validates against reality, never a stale snapshot. There is no
-- deadlock risk: the two triggers contend over exactly one shared row
-- (content_items(id)), never a cycle of two rows each waiting on the
-- other.
CREATE OR REPLACE FUNCTION enforce_content_item_progress_targets_asset()
RETURNS TRIGGER AS $$
DECLARE
    target_node_type TEXT;
BEGIN
    SELECT "node_type" INTO target_node_type FROM "content_items" WHERE "id" = NEW."content_item_id" FOR SHARE;
    IF target_node_type IS NULL THEN
        RAISE EXCEPTION 'content_item_progress: content_item_id % does not exist', NEW."content_item_id";
    END IF;
    IF target_node_type != 'ASSET' THEN
        RAISE EXCEPTION 'content_item_progress: content_item_id % must reference an ASSET, not a %',
            NEW."content_item_id", target_node_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_item_progress_targets_asset
    BEFORE INSERT OR UPDATE OF "content_item_id" ON "content_item_progress"
    FOR EACH ROW
    EXECUTE FUNCTION enforce_content_item_progress_targets_asset();
```

Add a standard header comment above this (mirroring 0062/0066's style): what this adds, why topic-level-only, why status is an explicit enum, why completion % is not stored here, "additive only."

- [ ] **Step 3: Apply the migration to the local/test database**

Run: `pnpm --filter @acos/db migrate:dev` (or the project's existing test-DB apply path used by `tests/integration/support/pgIndexHarness.ts` — check that file for how other CMS migrations reach the test database before assuming `migrate:dev` is sufficient).

- [ ] **Step 4: Write the failing integration test**

Follow `tests/integration/plus-pro-max-cms-phase1.integration.test.ts`'s `createTempDatabase`/`serverReachable` pattern. Cases:
```ts
it('rejects a content_item_id whose node_type is CONTAINER', async () => { /* insert attempt -> expect rejection */ });
it('cascades progress rows when the owning user is deleted', async () => { /* delete user -> progress row gone */ });
it('rejects content_item_id referencing a RESTRICTed deletion of the content item while progress exists', async () => { /* DELETE content_items row -> expect FK violation */ });
it('enforces one row per (user_id, content_item_id)', async () => { /* duplicate insert -> unique violation */ });
it('enforces status/completed_at pairing', async () => { /* IN_PROGRESS with completed_at set -> CHECK violation; COMPLETED with completed_at null -> CHECK violation */ });
```

- [ ] **Step 5: Run the test to verify it fails for the right reason (table doesn't exist) before Step 2/3, then passes after**

Run: `pnpm vitest run tests/integration/cms-content-item-progress.integration.test.ts`
Expected: all cases PASS after Steps 2–3 are applied.

- [ ] **Step 6: Commit**

```bash
git add packages/db/prisma/migrations tests/integration/cms-content-item-progress.integration.test.ts
git commit -m "feat(cms): add content_item_progress table"
```

---

### Task 2: `content_items` node_type-stability safeguard migration

**Files:**
- Create: `packages/db/prisma/migrations/<next>_content_items_node_type_stable_when_progress_exists/migration.sql`
- Test: extend `tests/integration/cms-content-item-progress.integration.test.ts` from Task 1

**Interfaces:**
- Consumes: `content_item_progress` (Task 1) — this trigger's function queries it.
- Produces: trigger `content_items_node_type_stable_when_progress_exists` on `content_items`.

- [ ] **Step 1: Re-verify the next migration number** (same command as Task 1, Step 1 — must now be one higher than Task 1's).

- [ ] **Step 2: Write the migration file verbatim**

```sql
CREATE OR REPLACE FUNCTION enforce_content_items_node_type_stable_when_progress_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."node_type" IS DISTINCT FROM OLD."node_type"
     AND EXISTS (SELECT 1 FROM content_item_progress WHERE content_item_id = OLD."id")
  THEN
    RAISE EXCEPTION
      'content_items: node_type cannot change for id % (% -> %) while content_item_progress rows reference it',
      OLD."id", OLD."node_type", NEW."node_type";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_items_node_type_stable_when_progress_exists
    BEFORE UPDATE OF "node_type" ON "content_items"
    FOR EACH ROW
    EXECUTE FUNCTION enforce_content_items_node_type_stable_when_progress_exists();
```

Header comment: this is deliberately narrower than unconditional immutability (Product Owner decision) — it only fires when a `content_item_progress` row already references the id; confirmed compatible with `publishReplacementTransaction` (`packages/core-cms/src/contentReplacementTransaction.ts:150-159`), which never writes `node_type`, and with `updateMetadata()` (`contentItemRepository.ts`), which is documented to never touch it either. This trigger needs no locking change of its own — it runs inside the same `UPDATE` statement that already holds the row lock Task 1's `FOR SHARE` contends against; the serialization is provided entirely by that one shared lock on `content_items(id)`.

- [ ] **Step 3: Apply the migration** (same mechanism as Task 1 Step 3).

- [ ] **Step 4: Write the failing sequential test cases**

```ts
it('allows node_type to change on a content item with no progress rows', async () => { /* UPDATE ... SET node_type -> succeeds */ });
it('rejects node_type change on a content item that has a progress row', async () => { /* seed progress row, then UPDATE node_type -> rejected */ });
```

- [ ] **Step 5: Write the failing real-concurrency tests — both orderings, deterministic via explicit transaction sequencing, not timing**

These use two separate `pg` client connections (not two statements on one connection — a single connection cannot hold two concurrent transactions) against the real test database, and prove the race from Refinement 1 is closed without relying on any sleep/timeout heuristic: each case issues the second operation *while the first transaction is still open and uncommitted*, so Postgres's own lock-wait is what forces the ordering, not test timing.

```ts
it('insert-then-update: a concurrent node_type change loses to an uncommitted progress insert and is rejected against the now-current state', async () => {
  const clientA = await pool.connect();
  const clientB = await pool.connect();
  await clientA.query('BEGIN');
  await clientA.query(insertProgressSql, [progressId, userId, assetId]); // trigger takes FOR SHARE on assetId; succeeds, uncommitted

  await clientB.query('BEGIN');
  const bUpdate = clientB.query(updateNodeTypeSql, ['CONTAINER', assetId]); // issued while A still holds the lock; must block server-side

  await clientA.query('COMMIT'); // releases the lock; B's pending UPDATE can now proceed and re-reads current state

  await expect(bUpdate).rejects.toThrow(/node_type cannot change/);
  await clientB.query('ROLLBACK');

  const item = await pool.query('SELECT node_type FROM content_items WHERE id = $1', [assetId]);
  expect(item.rows[0].node_type).toBe('ASSET');
  const progress = await pool.query('SELECT 1 FROM content_item_progress WHERE content_item_id = $1', [assetId]);
  expect(progress.rowCount).toBe(1);

  clientA.release();
  clientB.release();
});

it('update-then-insert: a concurrent progress insert loses to an uncommitted node_type change and is rejected against the now-current state', async () => {
  const clientA = await pool.connect();
  const clientB = await pool.connect();
  await clientB.query('BEGIN');
  await clientB.query(updateNodeTypeSql, ['CONTAINER', assetId]); // no progress rows yet; trigger permits it; succeeds, uncommitted

  await clientA.query('BEGIN');
  const aInsert = clientA.query(insertProgressSql, [progressId, userId, assetId]); // issued while B still holds the lock; must block server-side

  await clientB.query('COMMIT'); // node_type becomes CONTAINER; releases the lock; A's pending INSERT can now proceed and re-reads current state

  await expect(aInsert).rejects.toThrow(/must reference an ASSET/);
  await clientA.query('ROLLBACK');

  const item = await pool.query('SELECT node_type FROM content_items WHERE id = $1', [assetId]);
  expect(item.rows[0].node_type).toBe('CONTAINER');
  const progress = await pool.query('SELECT 1 FROM content_item_progress WHERE content_item_id = $1', [assetId]);
  expect(progress.rowCount).toBe(0);

  clientA.release();
  clientB.release();
});
```

Each test seeds its own fresh ASSET content item (via the Task 1 harness's existing content-item seeding helper) so the two cases don't interfere.

- [ ] **Step 6: Run the integration test file, verify all cases (Task 1 sequential + Task 2 sequential + Task 2 concurrency) pass**

Run: `pnpm vitest run tests/integration/cms-content-item-progress.integration.test.ts`

- [ ] **Step 7: Commit**

```bash
git add packages/db/prisma/migrations tests/integration/cms-content-item-progress.integration.test.ts
git commit -m "feat(cms): guard node_type stability once progress references a content item"
```

---

### Task 3: Progress repository and upserts

**Files:**
- Create: `packages/core-cms/src/contentItemProgressRepository.ts`
- Create: `packages/core-cms/src/testing/fakeContentItemProgressRepository.ts`
- Modify: `packages/core-cms/src/types.ts` (add `ContentItemProgress` type)
- Modify: `packages/core-cms/src/index.ts` (export the new repository, factory, type, fake)
- Modify: `apps/web/src/server/commerceRepositories.ts:57-70` (add `contentItemProgress: createPgContentItemProgressRepository(sql)`)
- Test: `packages/core-cms/src/contentItemProgressRepository.test.ts`

**Interfaces:**
- Consumes: `SqlClient` type from `./contentItemRepository` (reuse, don't redefine — same import style as `contentReplacementTransaction.ts`).
- Produces:
  ```ts
  export interface ContentItemProgress {
    id: string;
    userId: string;
    contentItemId: string;
    status: 'IN_PROGRESS' | 'COMPLETED';
    firstViewedAt: Date;
    lastViewedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface ContentItemProgressRepository {
    recordView(userId: string, contentItemId: string): Promise<ContentItemProgress>;
    markComplete(userId: string, contentItemId: string): Promise<ContentItemProgress>;
  }

  export function createPgContentItemProgressRepository(sql: SqlClient): ContentItemProgressRepository;
  export function fakeContentItemProgressRepository(): ContentItemProgressRepository & { rows: Map<string, ContentItemProgress> };
  ```
  Task 4's routes consume `recordView`/`markComplete` directly; nothing else from this module.

- [ ] **Step 1: Write the failing unit tests**

```ts
it('recordView creates an IN_PROGRESS row on first call', async () => { /* ... */ });
it('recordView updates last_viewed_at without touching an existing COMPLETED status or completed_at', async () => {
  // markComplete once, then recordView again; assert status stays 'COMPLETED' and completedAt is unchanged, lastViewedAt advances
});
it('markComplete sets status COMPLETED and completed_at on first call', async () => { /* ... */ });
it('markComplete is idempotent: a second call never changes completed_at', async () => { /* ... */ });
it('a concurrent recordView and markComplete for the same user/topic converge to one COMPLETED row without disturbing first_viewed_at', async () => {
  // Seed: await repo.recordView(userId, assetId) once first (sequentially) and capture its firstViewedAt.
  // Then: const [viewResult, completeResult] = await Promise.all([
  //   repo.recordView(userId, assetId),
  //   repo.markComplete(userId, assetId),
  // ]);
  // This is deterministic-by-construction, not timing-dependent: recordView's SET list never
  // names status/completed_at/first_viewed_at, and markComplete's SET list pins completed_at via
  // COALESCE against the existing row — so neither possible arrival order can produce a different
  // final state. Assert against the real row afterward:
  //   exactly one row for (userId, assetId);
  //   status === 'COMPLETED';
  //   completedAt !== null;
  //   firstViewedAt equals the seeded baseline, unchanged by either racing call.
});
```
Use the fake repository backed by an in-memory `pg`-shaped `SqlClient` test double for the first four cases, OR (preferred, since the upsert SQL itself is the thing under test) run these against the real Postgres test database via the Task 1 harness — follow whichever this package's existing tests for `contentItemRepository.ts` already do; match that file's own convention rather than introducing a second testing style in the same package. The concurrency case specifically MUST run against the real database (via `pool.connect()`/the shared pool), never the fake, since it is proving actual `ON CONFLICT` behavior under real concurrent connections, not the fake's single-threaded `Map`.

- [ ] **Step 2: Run tests, verify they fail** (module doesn't exist yet).

- [ ] **Step 3: Implement `createPgContentItemProgressRepository`**

```sql
-- recordView
INSERT INTO "content_item_progress"
    ("id", "user_id", "content_item_id", "status", "first_viewed_at", "last_viewed_at", "completed_at", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, $1, $2, 'IN_PROGRESS', now(), now(), NULL, now(), now())
ON CONFLICT ("user_id", "content_item_id") DO UPDATE SET
    "last_viewed_at" = now(),
    "updated_at" = now()
RETURNING *;

-- markComplete
INSERT INTO "content_item_progress"
    ("id", "user_id", "content_item_id", "status", "first_viewed_at", "last_viewed_at", "completed_at", "created_at", "updated_at")
VALUES
    (gen_random_uuid()::text, $1, $2, 'COMPLETED', now(), now(), now(), now(), now())
ON CONFLICT ("user_id", "content_item_id") DO UPDATE SET
    "status" = 'COMPLETED',
    "last_viewed_at" = now(),
    "completed_at" = COALESCE("content_item_progress"."completed_at", now()),
    "updated_at" = now()
RETURNING *;
```
These exact statements are the approved design — do not alter the column lists (in particular, `recordView`'s `SET` list must never name `status` or `completed_at`; that's what makes regression structurally impossible, not a `WHERE` guard). Map the returned row to `ContentItemProgress` the same way `toContentItem` maps `ContentItemRow` in `contentItemRepository.ts`.

- [ ] **Step 4: Implement `fakeContentItemProgressRepository`**, mirroring `fakeContentItemRepository.ts`'s in-memory-`Map` style, replicating the same regression-proof behavior (its `recordView` must likewise never touch `status`/`completedAt`).

- [ ] **Step 5: Wire exports** in `types.ts` and `index.ts`, and add `contentItemProgress: createPgContentItemProgressRepository(sql)` to `commerceRepositories()`.

- [ ] **Step 6: Run tests, verify they pass**

Run: `pnpm --filter @acos/core-cms test`

- [ ] **Step 7: Commit**

```bash
git add packages/core-cms apps/web/src/server/commerceRepositories.ts
git commit -m "feat(cms): add content item progress repository"
```

---

### Task 4: Progress API routes

**Files:**
- Create: `apps/web/app/access/[productId]/progress/view/route.ts`
- Create: `apps/web/app/access/[productId]/progress/view/route.test.ts`
- Create: `apps/web/app/access/[productId]/progress/complete/route.ts`
- Create: `apps/web/app/access/[productId]/progress/complete/route.test.ts`

**Interfaces:**
- Consumes: `requireUser` (`@acos/core-identity`), `getAccessibleCmsContentItem` (`apps/web/src/server/cmsContentService.ts`), `commerceRepositories()` (now exposing `contentItemProgress`), `readSessionToken` (`apps/web/src/server/session.ts`), Task 3's `recordView`/`markComplete`, Task 5's rate-limit policies.
- Produces: `POST /access/[productId]/progress/view` and `POST /access/[productId]/progress/complete`, each body `{ contentItemId: string }`, response `{ status: 'IN_PROGRESS' | 'COMPLETED', lastViewedAt: string, completedAt: string | null }` on success, or the same undifferentiated `{ error: 'Not found', code: 'NOT_FOUND' }` 404 shape the download route already uses for every rejection reason. Unauthenticated requests get exactly the download route's own behavior (`route.ts:79-85`): `catch (err) { if (err instanceof UnauthenticatedError) return NextResponse.redirect(new URL('/access/login', loadEnv().APP_BASE_URL)); ... }` — a redirect built from configured `APP_BASE_URL`, never from `request.url`/`Host`, and never a bare JSON 401. This is pinned, not a choice the implementer makes.

- [ ] **Step 1: Write the failing route tests**, mirroring `apps/web/app/access/[productId]/download/[assetId]/route.test.ts`'s `vi.mock` pattern for `commerceRepositories`/`readSessionToken` and its fakes. Per route, cover:
```ts
it('redirects an unauthenticated request to /access/login built from APP_BASE_URL', async () => {
  // no session cookie -> requireUser throws UnauthenticatedError
  const response = await POST(request, { params: { productId } });
  expect(response.status).toBe(307); // NextResponse.redirect's default, same as the download route
  expect(response.headers.get('location')).toBe(new URL('/access/login', loadEnv().APP_BASE_URL).toString());
});
it('rejects a contentItemId that does not exist', async () => { /* 404, same shape as the wrong-product case */ });
it('rejects a contentItemId belonging to a different product than the URL', async () => { /* owningProductId mismatch -> 404, same shape */ });
it('rejects a contentItemId whose nodeType is CONTAINER', async () => { /* 404, same shape */ });
it('rejects a contentItemId the caller is not entitled to (archived / wrong plan)', async () => { /* 404, same shape */ });
it('accepts a valid, entitled, same-product ASSET id and calls recordView/markComplete with the session userId, never a client-supplied one', async () => { /* assert fake repository received the session-resolved userId */ });
it('isolates progress between two different users touching the same contentItemId', async () => { /* two calls with two different session tokens -> two separate rows in the fake repository */ });
it('is idempotent under a concurrent double-submit for the same user and contentItemId', async () => { /* Promise.all of two calls -> fake repository ends with one row, matching Task 3's upsert semantics */ });
```

- [ ] **Step 2: Run tests, verify they fail** (routes don't exist yet).

- [ ] **Step 3: Implement both routes**

Each route's handler, in order: `requireUser(identity, readSessionToken(request))` → rate-limit check (Task 5) → `getAccessibleCmsContentItem(deps, userId, body.contentItemId)` → reject (404) unless non-null, `nodeType === 'ASSET'`, and `owningProductId === params.productId` → call the matching repository method → respond. Catch `UnauthenticatedError` with exactly `NextResponse.redirect(new URL('/access/login', loadEnv().APP_BASE_URL))`, copied from the download route verbatim, not reimplemented. No new authorization logic — this step only wires existing pieces together.

- [ ] **Step 4: Run tests, verify they pass**

Run: `pnpm --filter web test -- access/\[productId\]/progress`

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/access/\[productId\]/progress
git commit -m "feat(cms): add topic progress view/complete routes"
```

---

### Task 5: Rate-limit policies

**Files:**
- Modify: `packages/rate-limit/src/policy.ts`
- Modify: `apps/web/app/access/[productId]/progress/view/route.ts` (Task 4 — add the rate-limit check)
- Modify: `apps/web/app/access/[productId]/progress/complete/route.ts` (Task 4 — add the rate-limit check)
- Test: `packages/rate-limit/src/policy.test.ts` (extend if it exists, else create alongside the file it tests, matching this package's existing test convention)

**Interfaces:**
- Produces:
  ```ts
  export const PROGRESS_VIEW_USER_POLICY: RateLimitPolicy; // { name: 'progress-view:user', limit: 120, windowMs: 5 * 60_000 }
  export const PROGRESS_COMPLETE_USER_POLICY: RateLimitPolicy; // { name: 'progress-complete:user', limit: 60, windowMs: 5 * 60_000 }
  ```
- Consumes (in the routes): `checkLimits` from `apps/web/src/server/rateLimit.ts`, called as `checkLimits([{ identifier: userId, policy: PROGRESS_VIEW_USER_POLICY }])` (view route) / `..._COMPLETE_USER_POLICY` (complete route) — keyed by the session-resolved `userId`, never an IP or client-supplied value.

- [ ] **Step 1: Write the failing test** for the two new policy constants' shape (`assertPolicy` doesn't throw; `limit`/`windowMs` match the values above) — mirroring whatever existing test covers e.g. `CREATE_ORDER_IP_POLICY`.

- [ ] **Step 2: Add the two policy constants** to `policy.ts`, with a comment following this file's existing per-policy rationale style (why 120/5min for view, why 60/5min for complete — already justified in the approved design: generous relative to any realistic human click rate, tight enough to cap scripted hammering, keyed by userId rather than IP because this is an authenticated endpoint).

- [ ] **Step 3: Wire the check into both routes** (Task 4's handlers) immediately after `requireUser()` succeeds and before the entitlement check — add `return 429` with `Retry-After` on a rate-limit rejection.

- [ ] **Step 4: Extend each route's test file (Task 4)** with:
```ts
it('returns 429 after exceeding the view rate limit for one user', async () => { /* __setRateLimiterForTests with a limiter pre-exhausted for this policy+identifier */ });
it('does not rate-limit two different users independently hitting the same endpoint', async () => { /* ... */ });
```

- [ ] **Step 5: Run the full policy + route test files, verify pass.**

Run: `pnpm --filter @acos/rate-limit test && pnpm --filter web test -- access/\[productId\]/progress`

- [ ] **Step 6: Commit**

```bash
git add packages/rate-limit apps/web/app/access/\[productId\]/progress
git commit -m "feat(cms): rate-limit the topic progress endpoints"
```

---

### Task 6: Full regression pass

**Files:** none created — verification only.

- [ ] **Step 1: Run the full existing CMS/access/download/entitlement test surfaces** to confirm nothing in Tasks 1–5 altered existing behavior:

Run: `pnpm --filter web test -- access` and `pnpm --filter @acos/core-cms test` and `pnpm vitest run tests/integration/`

- [ ] **Step 2: Record the exact pass/fail counts as evidence** (do not summarize as "all passed" without the actual numbers — per this project's verification standard, a claim of passing needs the command and its output, not an assumption).

- [ ] **Step 3: If anything regressed, stop and fix before proceeding** — this task authorizes no scope beyond Tasks 1–5's own files, so a regression found here means one of those tasks touched something it shouldn't have.

---

### Task 7: Independent security review

**Files:** none — review only, no code changes expected unless the review finds something.

- [ ] **Step 1: Invoke `octo:personas:security-auditor` or `octo:droids:octo-security-auditor`** (Product Owner's Phase 2 decision explicitly authorizes this specific review) scoped to: the two new routes (Task 4), the rate-limit wiring (Task 5), and the two migrations (Tasks 1–2) — specifically the authorization/entitlement chain, the uniform-rejection property, and the DB invariants.
- [ ] **Step 2: Document, per this project's Independent Review Evidence requirement:** the actual persona/droid invoked, the scope reviewed, findings reported, which were resolved and how, which remain outstanding, and whether the review ran to completion.
- [ ] **Step 3: Resolve findings or explicitly carry them as outstanding** — do not declare the feature "security-verified" without this evidence captured.

---

## Self-Review

**1. Spec coverage:** A (table) → Task 1. B (narrowed trigger) → Task 2. C (routes, identity, entitlement, product-boundary check, rate limiting) → Tasks 4–5. D (unit/integration/concurrency/cross-user/entitlement/ASSET-invariant/rate-limit/regression tests, Octopus review) → Tasks 1–7 collectively, explicitly itemized. E (scope exclusions) → stated in Global Constraints, no task touches any excluded area. F (governance: re-verify migration head, preserve existing work) → Task 1 Step 1, Task 2 Step 1, and the plan header's branch note.

**2. Step scan:** Every code step names an exact file and either the exact SQL (spec-fixed) or an exact signature; no step says "handle edge cases" or leaves a type undefined that a later task relies on.

**3. Type consistency:** `ContentItemProgress`/`ContentItemProgressRepository` (Task 3) are the only names Task 4 consumes, and Task 4's interface block uses them unchanged. `PROGRESS_VIEW_USER_POLICY`/`PROGRESS_COMPLETE_USER_POLICY` (Task 5) match the names Task 4's Step 3 wiring and Step 4 extension both reference.

**4. Review Focus:** all six items map to a task's test step (upsert concurrency → Task 3; cross-table trigger race → Task 2, closed by `FOR SHARE` locking and proven by two deterministic, non-timing-based concurrent tests; cross-product → Task 4; CONTAINER rejection → Task 1; user-deletion cascade → Task 1; cross-user isolation → Task 4).

**5. Proportion:** code blocks above are either the already-approved exact SQL (spec-fixed, not generated here) or bare signatures/test names — the plan does not write route handler bodies or repository method bodies, leaving those to the implementer against the given interface and tests. The concurrency tests are written out more fully than other steps because their exact sequencing (what is awaited before what) is the correctness-bearing decision this plan must pin — an implementer paraphrasing "test it concurrently" could easily reach for a timing-based/flaky construction instead.

**Revisions for this review round:**
1. Closed the Task 1/Task 2 trigger race with real row-level locking (`FOR SHARE` in Task 1's trigger, contending against Task 2's implicit `UPDATE` row lock) — not an application check — and added two deterministic concurrent-transaction tests (Task 2, Step 5) proving both orderings resolve to a consistent final state. No sequential-only test stands in for this.
2. Added an explicit `recordView`/`markComplete` real-concurrency test to Task 3, run against the real database (never the fake), asserting exactly one row, final status `COMPLETED`, non-null/never-cleared `completed_at`, and a stable `first_viewed_at` against a pre-seeded baseline.
3. Pinned Task 4's unauthenticated behavior to the download route's exact, already-implemented redirect (`NextResponse.redirect(new URL('/access/login', loadEnv().APP_BASE_URL))`, 307, built from `APP_BASE_URL` not `request.url`) — removed "401/redirect" as alternatives from both the route spec and its test.

No PO-approved SQL contract, API boundary, rate-limit value, or scope exclusion was altered — Task 1's trigger gained a lock clause (`FOR SHARE`) on an existing `SELECT`, not a change to any constraint, upsert, route contract, or policy value.
