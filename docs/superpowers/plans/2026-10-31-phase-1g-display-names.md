# Phase 1G — Display Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CMS-PO-001(R2) ("Plan Names Are CMS-Configurable") actually true end-to-end: a CMS admin can edit a plan's display name through a real UI, and every customer-facing render of that plan's name reflects the change, without touching product/SKU identity, entitlements, purchases, or subscriptions.

**Architecture:** The backend (migration 0061, `resolveDisplayName`/`setDisplayNameOverride`, the admin API route) is already complete and tested — nothing there changes. This plan does exactly two things: (1) replace the admin UI stub with a form against the existing API, and (2) replace `product.name` with a resolved display name at every one of the 8 verified customer-facing render sites, via one new, small server-side helper that wraps the existing `resolveDisplayName` primitive.

**Tech Stack:** Next.js App Router (Server + Client Components), TypeScript, Vitest, existing Postgres-backed repositories via `commerceRepositories()`.

**Spec:** `requirement/PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md:25` (CMS-PO-001(R2), quoted in full in Section 2 below). No separate engineering spec exists; this plan argues directly from that PO decision and from this session's own read-only audit (reproduced/re-verified in Section 3/4).

## Global Constraints

- The 3 CMS-eligible plans only: `ai_income_99`, `ai_freelancing_499`, `ai_client_acquisition_1499_subscription` — never the retired `ai_client_acquisition_1499`.
- `ProductId`/`PRODUCT_CATALOG` (`@acos/catalog`) are never modified, never renamed, never used as a display-name source once an override exists.
- No change to `orders`, `payments`, `entitlements`, `subscription_periods`, `cms_admins`, `content_items`, or any lifecycle/inheritance/access-control code.
- No new backend endpoint, repository method, migration, or database schema change — `resolveDisplayName`, `setDisplayNameOverride`, and the existing admin API route are reused unmodified.
- No delete/reset-to-default UI action — the repository has no delete method (`planDisplayNameRepository.ts` exposes only `findByProductId`/`upsert`), so this is not implementable without new backend work, which is out of scope (see Section 13).
- Admin surface stays gated by the existing `requireUser → requireCmsAdmin` chain — no new authorization code.

## Review Focus

- **A page with no override row renders the wrong thing (blank, "undefined", or an error) instead of the catalog default** — `resolveDisplayName` already guarantees a non-null string for every valid `ProductId`, but the new call sites must actually await it correctly and not accidentally pass a stale/cached `product.name`. Covered by Task 2's per-call-site tests (no-override case).
- **The retired legacy SKU (`ai_client_acquisition_1499`) shown on `/kits` via `ProductCard` behaves differently once the helper is introduced** — `resolveDisplayName` works for any `ProductId`, including non-CMS-eligible ones, and simply falls through to the catalog default since no override can ever exist for it (`setDisplayNameOverride` rejects it). Covered by Task 2's `/kits` test asserting the legacy SKU's name is unchanged.
- **A client component (`CheckoutPanel.tsx`) ends up needing to call a server-only function directly**, which would crash the build — resolved by passing the already-resolved `displayName` string down as a prop from its server-component parent, never calling `resolveDisplayName` client-side. Covered by Task 3's type-level contract (prop, not a function).
- **Static/ISR pages silently become slower or go stale** because adding a live DB read changes their rendering mode — this is a real, evidence-based risk (Section 4) with an explicit, flagged design choice, not silently resolved. Covered by Task 2's explicit rendering-mode note per page and Section 11.
- **The admin UI silently allows writing to a non-CMS-eligible product** — already impossible server-side (`setDisplayNameOverride` rejects it), but the UI itself must never construct a request for anything outside the 3-product list it renders. Covered by Task 1's "only the 3 eligible products are ever offered" test.

---

## 1. Phase 1G Objective

Close the two concrete gaps the read-only audit identified for CMS-PO-001(R2): a non-functional admin UI, and zero customer-facing wiring. Nothing else.

## 2. Governing Requirements

**CMS-PO-001(R2), verbatim** (`requirement/PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md:25`):
> Plan/customer-facing names must be configurable/editable from the CMS. The underlying product/SKU identity must remain stable and must NOT depend on the display name. Example: `ai_income_99` → display name could be "Plus"; `ai_freelancing_499` → display name could be "Pro"; `ai_client_acquisition_1499_subscription` → display name could be "Max". If the Product Owner changes a plan name in CMS, the new name must automatically be reflected consistently across the website/platform wherever that plan's customer-facing name is displayed. Changing the display name must NOT change: product/SKU identity; historical purchases; historical entitlements; subscription records; existing customer access; payment records. Do NOT hardcode "Plus", "Pro", or "Max" as permanent product identities.

(The CMS-PO-001(R1)/(R2) identifier collision noted in the prior audit is unchanged and not re-litigated here — this plan implements (R2), the display-name decision, per the codebase's own established convention.)

## 3. Current Repository Baseline

Re-verified fresh this session (not assumed from the prior audit), against HEAD `1ee808bd10ecd39b5280c7db4f6aabb39b1204f4`:

| Component | File | State |
|---|---|---|
| Migration | `packages/db/prisma/migrations/0061_plan_display_names/migration.sql` | Applied (confirmed live against the dev DB: table exists, matches schema exactly, one real row already present) |
| Read resolver | `packages/core-cms/src/displayName.ts` (`resolveDisplayName`) | Complete, tested (5 tests) |
| Write service | `packages/core-cms/src/displayNameService.ts` (`setDisplayNameOverride`) | Complete, tested (5 tests) |
| Repository | `packages/core-cms/src/planDisplayNameRepository.ts` | Complete — **only `findByProductId`/`upsert` exist, no delete method** |
| Eligibility guard | `packages/core-cms/src/cmsEligibility.ts` (`isCmsEligibleProduct`) | Complete, single canonical source (re-reads `CMS_PLAN_PRODUCT_IDS` from `@acos/core-subscriptions`) |
| Admin API | `apps/web/app/api/cms/admin/display-names/[productId]/route.ts` (GET/POST) | Complete, tested (11 tests: auth, validation, identity-safety) |
| Admin UI | `apps/web/app/cms/display-names/page.tsx` | **Stub** — hardcoded "Coming in a later phase" `EmptyState`, no form, calls no API |
| Customer-facing resolution | repo-wide `resolveDisplayName` callers | Exactly 2: the admin GET route above, and this session's own `apps/web/src/server/cmsPreviewService.ts` (admin-only Phase 1H preview, not customer-facing) |

## 4. Customer-Facing Call-Site Inventory

Re-verified by fresh repo search this session (`grep -rln "getProduct(" apps/web/app apps/web/src apps/web/components`), then each file read in full. **8 distinct files, matching the prior audit's count — confirmed unchanged, not assumed.** One additional nuance found this pass: `apps/web/app/page.tsx` has a second, fully independent hardcoded name (its static `metadata.title`) separate from the `product.name` in its body.

| File | Current behavior | Required change | Risk |
|---|---|---|---|
| `apps/web/app/page.tsx` | `const product = getProduct(ENTRY_PRODUCT_ID)`; renders `{product.name}` in an `<h1>`. Separately, `export const metadata = { title: 'AI Income Starter Kit', ... }` is a **hardcoded literal string**, not derived from `product.name` at all. No `dynamic` export — static-eligible today. | Replace the `<h1>` content with the resolved display name. The static `metadata.title` cannot be resolved at module-eval time (no async in a plain object literal) — needs `generateMetadata` instead, which can `await`. | **Rendering-mode risk**: adding a DB read here makes this currently-static funnel entry page dynamic (or needs ISR) — see Section 11. This is the site with an explicit code comment about performance ("price is in the HTML before any JavaScript runs"). |
| `apps/web/app/access/page.tsx` | Already `force-dynamic`. Loops `PRODUCT_LADDER.map(id => getProduct(id))`; renders `product.name` twice per card (heading, "Open {product.name}" link text). | Resolve a display name per product in the loop; replace both `product.name` usages per card. | Low — already dynamic, no rendering-mode change. `PRODUCT_LADDER` may include the retired SKU; `resolveDisplayName` handles that safely (falls through to catalog default). |
| `apps/web/app/access/[productId]/page.tsx` | Already `force-dynamic`. Body `<h1>{product.name}</h1>`; separately `generateMetadata` returns `{ title: getProduct(params.productId).name }`. | Resolve once in the page body, reuse in both the `<h1>` and (since `generateMetadata` is already a separate, already-async-capable function) a second resolve call there. | Low — already dynamic. |
| `apps/web/app/upsell/[productId]/page.tsx` | Already `force-dynamic` (explicit comment: "entitlement-dependent; never cached"). Body uses `product.name` twice (already-owned message, main upsell copy); `generateMetadata` returns `` `Add the ${getProduct(...).name}` ``. | Resolve once, reuse in both body occurrences; resolve again in `generateMetadata`. | Low — already dynamic. |
| `apps/web/app/checkout/[productId]/page.tsx` | Server Component, **not** `force-dynamic`; has `generateStaticParams` (SSG-eligible for all non-retired products today). Body renders `{product.name}` in the lede text, and passes the whole `product` object as a prop to `<CheckoutPanel product={product} />`. | Resolve the display name server-side; use it in the lede; pass it to `CheckoutPanel` as a **new, separate `displayName` prop** (never mutate `product`). | **Rendering-mode risk** (same category as `page.tsx`) — see Section 11. Also the one site where a Client Component downstream needs the resolved value handed to it, not computed by it. |
| `apps/web/src/components/CheckoutPanel.tsx` | `'use client'`. Receives `product: Product` as a prop; renders `<dt>{product.name}</dt>` in the order summary. | Accept a new `displayName: string` prop from its parent; render that instead of `product.name`. **Never call `resolveDisplayName` from this file** — it is a Client Component and the function is server-only. | None beyond the prop-plumbing itself — no new rendering-mode question (this component has no independent rendering mode; it inherits its parent's). |
| `apps/web/src/components/ProductLanding.tsx` | Receives `productId` prop; calls `getProduct(productId)` itself (Server Component — no `'use client'`); renders `product.name` twice (`<h1>`, "Buy {product.name}" button). Used by `apps/web/app/(marketing)/launch-kit/page.tsx` and `apps/web/app/(marketing)/starter-kit/page.tsx` — neither page declares `dynamic`, both static-eligible today. | Resolve the display name inside `ProductLanding` itself (it already does its own `getProduct` call; same pattern) and use it in both occurrences. | **Rendering-mode risk** — both marketing pages become dynamic (or need ISR) once this component does a DB read. |
| `apps/web/src/components/ProductCard.tsx` | Server Component (no `'use client'`). Receives `product: Product` as a prop; renders it twice (`<h2>`, "Buy {product.name}" button). Used by `apps/web/app/kits/page.tsx`, which calls `listProducts()` — **this includes the retired legacy `ai_client_acquisition_1499` SKU** (present in `kits/page.tsx`'s own `BLURBS` map) — and has no `dynamic` export, static-eligible today. | `ProductCard` needs a `displayName: string` prop (it receives `product` as a prop already, same pattern as `CheckoutPanel`); `kits/page.tsx` resolves it per product before rendering. | **Rendering-mode risk**, same category. Also the one site that must correctly handle the retired SKU — `resolveDisplayName` already does, by design, since no override can ever exist for it. |

## 5. Admin UI Design

Smallest UI that satisfies CMS-PO-001(R2) and reuses the existing API exactly:

- A server-rendered page (`requireCmsAdminForPage()` at the top, same as every other `/cms/*` page) that, on load, calls the existing `GET /api/cms/admin/display-names/[productId]` for each of the 3 `CMS_PRODUCT_TIERS` entries (`apps/web/src/cms-admin/products.ts`) to get `{ displayName, override }` for each.
- One row per product: shows the stable `productId` (read-only, labeled distinctly from the editable name — e.g. a small muted mono-font tag, matching the existing CMS visual language's use of `StatusBadge`-style small tags), the currently-effective display name (pre-filled into an editable text input), and an indicator of whether it's a CMS override or the catalog default (e.g. "Catalog default" vs. "Custom" — small text/badge, no new component system needed).
- A client-side form component (since saving needs interactivity) that `POST`s `{ displayName }` to `/api/cms/admin/display-names/[productId]` on submit, using the exact same validation the backend already enforces (non-blank) — client-side blank check is a UX nicety, not a new authority; the backend's `CmsValidationError` remains the actual gate.
- Success: show the saved name and switch the "Catalog default"/"Custom" indicator; failure: show the error message the API returned (`err.message`/`field`), matching the existing `CmsApiError` pattern already used by `apps/web/src/cms-admin/api.ts`'s other admin actions.
- No delete/reset (no backend support exists — Section 13), no audit history, no scheduling, no approvals, no versioning, no bulk editing, no role management — none of these are required by CMS-PO-001(R2) and none are added.

**Flagged design choice, not silently decided:** CMS-PO-001(R2) does not define a "reset to catalog default" behavior, and the repository has no delete path for an override row. If the Product Owner wants true reset-to-default, that requires a new repository method + API behavior — explicitly out of this plan's scope (Section 13) and listed as a possible future PO decision (Section 12) rather than invented here.

## 6. Backend/API Reuse

**Reused, unmodified:**
- `resolveDisplayName` (`packages/core-cms/src/displayName.ts`)
- `setDisplayNameOverride` (`packages/core-cms/src/displayNameService.ts`)
- `GET`/`POST /api/cms/admin/display-names/[productId]` (`apps/web/app/api/cms/admin/display-names/[productId]/route.ts`)
- `requireCmsAdminForPage` (`apps/web/src/cms-admin/requireCmsAdminPage.ts`)
- `CMS_PRODUCT_TIERS` (`apps/web/src/cms-admin/products.ts`)
- `commerceRepositories()` (`apps/web/src/server/commerceRepositories.ts`) — already exposes `planDisplayNames`

**Does NOT need modification:** the migration, the repository, the service layer, the admin API route, `cmsEligibility.ts`, `requireCmsAdminPage.ts`, `commerceRepositories.ts`, and everything in `@acos/catalog` (the frozen `ProductId`/`PRODUCT_CATALOG`). This plan adds exactly one new, small server-side helper (below) and otherwise only touches page/component files.

**New helper — the one piece of new backend-adjacent code this plan introduces:**
- **Location:** `apps/web/src/server/customerDisplayName.ts`
- **Responsibility:** the one place that composes `commerceRepositories()`'s `planDisplayNames` with `resolveDisplayName`, so none of the 8 call sites duplicate that two-line composition — mirrors the existing convention of `cmsContentService.ts`/`cmsPreviewService.ts` as the "glue" layer between a package and the app's repositories.
- **Input:** `productId: ProductId`
- **Output:** `Promise<string>`
- **Why needed:** 8 call sites each need the identical `const { planDisplayNames } = commerceRepositories(); return resolveDisplayName({ planDisplayNames }, productId);` — one function avoids 8 copies of that composition, with nothing invented beyond what's already proven (`resolveDisplayName` itself, unchanged).

## 7. Implementation Tasks

### Task 1: Admin UI — Display Names management page

**Files:**
- Modify: `apps/web/app/cms/display-names/page.tsx` (replace the stub)
- Create: `apps/web/components/cms/DisplayNameForm.tsx` (the per-row editable form, `'use client'`)
- Test: `apps/web/components/cms/DisplayNameForm` has no existing component-test precedent in this repo (confirmed in the Phase 1H work — no `@testing-library/react`/jsdom in this repo); covered instead by browser verification plus the already-existing, unchanged API-level tests this UI merely calls

**Interfaces:**
- Consumes: `requireCmsAdminForPage()`, `CMS_PRODUCT_TIERS` (`apps/web/src/cms-admin/products.ts`), the existing admin API's JSON shape (`{ productId, displayName, override }` on GET; `{ productId, displayName, updatedAt, updatedBy }` on a successful POST; `{ error, code, field? }` on a 4xx)
- Produces: the `/cms/display-names` route itself — nothing downstream consumes this page's exports

- [ ] **Step 1: Replace the stub page to fetch and render current state for the 3 eligible products**

Server Component: `requireCmsAdminForPage()`, then for each `CMS_PRODUCT_TIERS` entry, resolve its current display name server-side via the new helper (Task 2 produces this — see dependency note below) rather than round-tripping through its own admin API from the server; render one `DisplayNameForm` per product with the resolved current value as its initial prop.

- [ ] **Step 2: Implement `DisplayNameForm`**

`'use client'` component, props `{ productId: ProductId, tier: 'Plus' | 'Pro' | 'Max', initialDisplayName: string, isOverride: boolean }`. An input pre-filled with `initialDisplayName`, a Save button that `POST`s to `/api/cms/admin/display-names/${productId}` with `{ displayName: <input value> }`, local state for busy/error/success, rendering the API's own error message on failure.

- [ ] **Step 3: Browser-verify**

Load `/cms/display-names` as a CMS admin: confirm exactly 3 rows (Plus/Pro/Max), each showing its stable `productId` distinctly from the editable name, the correct current value (catalog default or the one real override already in the dev DB for `ai_income_99`). Edit one name, save, confirm success state and the "Catalog default"/"Custom" indicator updates. Submit a blank name, confirm the existing backend validation error surfaces. Load as a non-admin/unauthenticated visitor, confirm the existing `/cms` layout gate still applies (no new authorization code was written, so this reconfirms the unchanged gate, not a new one).

- [ ] **Step 4: Commit** (per whatever commit convention is authorized at execution time — not pre-authorized by this plan)

---

### Task 2: Shared customer-facing display-name helper

**Files:**
- Create: `apps/web/src/server/customerDisplayName.ts`
- Test: `apps/web/src/server/customerDisplayName.test.ts`

**Interfaces:**
- Consumes: `resolveDisplayName` (`@acos/core-cms`), `commerceRepositories()` (`apps/web/src/server/commerceRepositories.ts`)
- Produces: `getCustomerDisplayName(productId: ProductId): Promise<string>` — consumed by Task 3's 8 call sites and reusable by Task 1's admin page

- [ ] **Step 1: Write the failing test**

Using the same `fakePlanDisplayNameRepository` pattern already established in `displayName.test.ts`: assert it returns the catalog default when no override exists, the override when one is set, and that it never touches any field other than `planDisplayNames` on whatever deps shape `commerceRepositories()` actually returns (verify by constructing the test against the real exported type, not a hand-rolled one).

- [ ] **Step 2: Run test, verify it fails** (module not found)

- [ ] **Step 3: Implement**

```typescript
export async function getCustomerDisplayName(productId: ProductId): Promise<string> {
  const { planDisplayNames } = commerceRepositories();
  return resolveDisplayName({ planDisplayNames }, productId);
}
```

- [ ] **Step 4: Run test, verify it passes**

- [ ] **Step 5: Commit**

---

### Task 3: Wire all 8 customer-facing call sites

**Files:** the 8 files in Section 4's table, each modified per its own "Required change" column.

**Interfaces:**
- Consumes: `getCustomerDisplayName` (Task 2)
- Produces: nothing new — these are leaf render sites

- [ ] **Step 1: `apps/web/app/page.tsx`** — add `generateMetadata` (replacing the static `metadata` export) that awaits `getCustomerDisplayName(ENTRY_PRODUCT_ID)` for the title; resolve the same value in the page body for the `<h1>`. **Rendering-mode decision required first** — see Section 11; this step assumes whatever this plan's Section 11 recommendation resolves to.

- [ ] **Step 2: `apps/web/app/access/page.tsx`** — inside the existing `PRODUCT_LADDER.map`, resolve `getCustomerDisplayName(id)` per product (already dynamic, no rendering-mode change) and use it for both occurrences.

- [ ] **Step 3: `apps/web/app/access/[productId]/page.tsx`** — resolve once in the page body for the `<h1>`; resolve again in `generateMetadata` for the title (already dynamic).

- [ ] **Step 4: `apps/web/app/upsell/[productId]/page.tsx`** — resolve once, reuse for both body occurrences; resolve again in `generateMetadata` (already dynamic).

- [ ] **Step 5: `apps/web/app/checkout/[productId]/page.tsx` + `CheckoutPanel.tsx`** — resolve server-side in the page, use for the lede text, pass as a new `displayName` prop to `<CheckoutPanel product={product} displayName={displayName} />`; `CheckoutPanel.tsx` adds `displayName: string` to its props type and renders it instead of `product.name` at its one call site. **Rendering-mode decision required first** (Section 11).

- [ ] **Step 6: `ProductLanding.tsx` + its 2 marketing pages** — resolve inside `ProductLanding` itself (it already does its own `getProduct` call), use for both occurrences. **Rendering-mode decision required first** (Section 11).

- [ ] **Step 7: `ProductCard.tsx` + `kits/page.tsx`** — `kits/page.tsx` resolves a display name per product from `listProducts()` (including the retired legacy SKU, which safely falls through to its catalog default) and passes it as a new `displayName` prop to `<ProductCard product={product} displayName={displayName} blurb={...} />`; `ProductCard.tsx` adds `displayName: string` to its props and renders it at both its occurrences. **Rendering-mode decision required first** (Section 11).

- [ ] **Step 8: Browser-verify every one of the 8 sites** — set a CMS override for one product via the Task 1 UI, confirm it appears at every render site for that product (page body, page `<title>` where applicable), confirm the other two products still show their catalog defaults, confirm the retired legacy SKU on `/kits` is unaffected.

- [ ] **Step 9: Commit**

## 8. Test Plan

**Unit:**
- `apps/web/src/server/customerDisplayName.test.ts` (Task 2) — override present/absent, correct deps shape.
- Existing `displayName.test.ts` (5), `displayNameService.test.ts` (5) — unchanged, must stay green (regression).

**API:**
- Existing `apps/web/app/api/cms/admin/display-names/[productId]/route.test.ts` (11 tests) — unchanged, must stay green (regression). No new API test needed since no API changes.

**UI:**
- No automated render test (no test infra for this in the repo, confirmed in Phase 1H and reconfirmed here). Covered by the browser-verification steps in Task 1 Step 3: admin can load names, all 3 eligible products appear, current override/default displayed correctly, valid save works, blank name rejected, API errors surfaced, non-admin/unauthenticated blocked (via the existing, unchanged gate).

**Customer-facing behavior:**
1. No override → catalog default displayed — covered per-site by Task 3 Step 8's browser verification, and structurally guaranteed by `resolveDisplayName`'s own already-tested fallback behavior (Task 2 doesn't duplicate those assertions, just confirms its own pass-through is correct).
2. Override exists → CMS override displayed — same.
3. Changing override → next render uses the new name — `resolveDisplayName` does a live read every call (no caching introduced), so this follows directly; verified in Task 3 Step 8 by changing a value in the admin UI and reloading a customer page.
4. Product/SKU identity unchanged — structurally guaranteed (the `product` object itself is never mutated at any of the 8 sites; only a separate `displayName` string is introduced) and spot-checked in Task 3 Step 8 by confirming checkout/purchase links still use `product.id`, not the display name.

**Regression:** full `pnpm --filter web test` run at the end of Task 3, confirming the pre-existing 497 (now +however many Task 2 adds) still pass, plus typecheck/lint/build, per this session's established Phase 1H pattern.

**Acceptance-level (not implemented, described for future execution):** an integration test that (a) calls `setDisplayNameOverride` or `POST`s the admin API for a test product, (b) renders/fetches one customer-facing page for that product, (c) asserts the new name appears. Given this repo's existing test conventions (service-level tests with fake repositories, not full Next.js route rendering), the most consistent shape would be a `customerDisplayName.test.ts` case that calls `setDisplayNameOverride` then `getCustomerDisplayName` against the same fake repository and asserts the new value — proving the "change → next read reflects it" property at the layer this repo actually tests, rather than inventing new page-rendering test infrastructure.

## 9. Acceptance Criteria

Directly traceable to CMS-PO-001(R2):
1. A CMS admin can set a display name for each of the 3 CMS-eligible products through `/cms/display-names`, using only the existing admin API.
2. Every one of the 8 verified customer-facing render sites (Section 4) shows the CMS override when one is set, and the catalog default otherwise — no site is missed, no site shows a stale or hardcoded name once an override exists.
3. `ProductId`/`PRODUCT_CATALOG` are byte-for-byte unchanged by this work; no `product` object passed to any component is ever mutated to carry the resolved name — it is always a separate `displayName` value.
4. No entitlement, purchase, subscription, or payment record is read, written, or referenced by any file this plan touches.
5. The retired legacy SKU continues to render its catalog name on `/kits` exactly as before (no override is ever possible for it).
6. All pre-existing Display Names tests (21) and this plan's new tests remain green; no regression in the existing 497-test web suite.

## 10. Release Gates

Minimum evidence before Phase 1G can be declared complete:
1. Task 1–3 implemented per this plan, each task's own tests passing.
2. Full `pnpm --filter web test` green (no regression).
3. Typecheck, lint, build clean for `apps/web`.
4. Browser verification of all items in Task 1 Step 3 and Task 3 Step 8.
5. Given this is a customer-facing change touching the primary purchase/marketing funnel pages (CLAUDE.md §2.1 risk screening — personal/customer-facing display, though not auth/payment logic itself), an independent review pass is warranted before shipping; whether that is `octo:personas:security-auditor` (as Phase 1H used) or a different reviewer is a call for whoever authorizes implementation, not decided here.
6. Explicit resolution of the Section 11 rendering-mode question before Task 3 Steps 1, 5, 6, 7 are implemented — this is a blocking prerequisite for exactly those 4 of 9 steps, not the whole task.

## 11. Risks

Only evidence-based, from this session's direct repository inspection:

1. **Rendering-mode change on currently-static pages.** `apps/web/app/page.tsx`, `apps/web/app/checkout/[productId]/page.tsx` (has `generateStaticParams`), `apps/web/app/kits/page.tsx`, and the two `ProductLanding`-based marketing pages (`launch-kit`, `starter-kit`) currently declare no `dynamic` export and are static-generation-eligible today — confirmed by direct inspection (no `export const dynamic`, no existing per-request data dependency). Adding a live `resolveDisplayName` DB read to any of them forces either full dynamic rendering (`export const dynamic = 'force-dynamic'`) or Next.js ISR (`export const revalidate = <seconds>`) — both are real, user-facing performance/freshness tradeoffs the PO decision text doesn't address. **Flagged as a design choice, not silently resolved:** this plan does not pick one on the Product Owner's behalf. The PO decision explicitly does not require caching, but "does not require" is not "forbids" — `revalidate` is a framework-native mechanism already part of this stack, not new infrastructure (no Redis, no new dependency), and would bound staleness to a short, known window while mostly preserving today's performance; `force-dynamic` guarantees always-fresh at the cost of making every visit to these pages a live DB-read request. Recommend this be resolved explicitly (Section 12) before Task 3's affected steps are implemented.
2. **`CheckoutPanel.tsx` and `ProductCard.tsx` are Client Components (one explicitly, one implicitly by convention with its sibling) receiving `product` as a prop.** Mitigated entirely by design in this plan (resolve server-side, pass `displayName` as a separate prop) — listed as a risk only because it is the one place a naive implementation could accidentally try to call a server-only function from client code, which would fail at build time, not silently misbehave at runtime.
3. **`PRODUCT_LADDER`/`listProducts()` include products beyond the 3 CMS-eligible plans** (the retired legacy SKU in particular). Mitigated by `resolveDisplayName`'s existing, already-tested behavior of working for any `ProductId` and falling through to the catalog default when no override can exist — no new code is needed to handle this case correctly, but Task 3 Step 8's browser verification explicitly checks it rather than assuming it.

## 12. Product Owner Decisions

One decision is needed before (not during) implementation of Task 3 Steps 1, 5, 6, 7:

> **Rendering-mode choice for the 5 currently-static customer-facing pages/components** (`apps/web/app/page.tsx`, `apps/web/app/checkout/[productId]/page.tsx`, `apps/web/app/kits/page.tsx`, `apps/web/app/(marketing)/launch-kit/page.tsx`, `apps/web/app/(marketing)/starter-kit/page.tsx`): make them fully dynamic (`force-dynamic`, always-fresh, a DB read on every visit), or use Next.js ISR (`revalidate`, fresh within a bounded window, e.g. 60s, no new infrastructure), or something else. This is a performance/freshness tradeoff the PO decision text doesn't address, and this plan does not choose it unilaterally.

> No other additional Product Owner decision required — everything else in this plan implements CMS-PO-001(R2) as written, using only infrastructure that already exists and is already tested.

## 13. Explicit Non-Goals

- Delete/reset-to-catalog-default UI or API (no backend support exists; would require a new repository method + API behavior).
- Audit history / change log for display-name edits.
- Scheduling or approval workflow for name changes.
- Versioning of display names.
- Bulk-editing UI.
- Role management beyond the existing binary CMS-admin check.
- Any change to `ProductId`, `PRODUCT_CATALOG`, entitlements, subscriptions, payments, or the legacy SKU retirement logic.
- Any change to CMS-PO-002/003/004/005 inheritance, content separation, source-of-truth, or 30-day-validity logic.
- Any change to Phase 1H's `cmsPreviewService.ts`/`CustomerRoadmapView.tsx` — Phase 1H already reuses `resolveDisplayName` correctly and needs no rewrite.
- Caching/Redis/new infrastructure beyond, at most, Next.js's own built-in `revalidate` (and only if Section 12's PO decision chooses it).

## 14. Expected Change-Set

```text
New:
  apps/web/src/server/customerDisplayName.ts
  apps/web/src/server/customerDisplayName.test.ts
  apps/web/components/cms/DisplayNameForm.tsx

Modified:
  apps/web/app/cms/display-names/page.tsx          (stub replaced with real UI)
  apps/web/app/page.tsx                            (resolved name in body + generateMetadata)
  apps/web/app/access/page.tsx                     (resolved name per product in the loop)
  apps/web/app/access/[productId]/page.tsx         (resolved name in body + generateMetadata)
  apps/web/app/upsell/[productId]/page.tsx         (resolved name in body + generateMetadata)
  apps/web/app/checkout/[productId]/page.tsx       (resolved name; new displayName prop to CheckoutPanel)
  apps/web/src/components/CheckoutPanel.tsx        (new displayName prop, used instead of product.name)
  apps/web/src/components/ProductLanding.tsx       (resolved name, both occurrences)
  apps/web/app/kits/page.tsx                       (resolved name per product; new displayName prop to ProductCard)
  apps/web/src/components/ProductCard.tsx          (new displayName prop, used instead of product.name)
  apps/web/app/(marketing)/launch-kit/page.tsx     (no direct edit expected -- verify at implementation time; it only passes productId through to ProductLanding)
  apps/web/app/(marketing)/starter-kit/page.tsx    (same as above)

Expected unchanged:
  packages/core-cms/src/displayName.ts
  packages/core-cms/src/displayNameService.ts
  packages/core-cms/src/planDisplayNameRepository.ts
  packages/core-cms/src/cmsEligibility.ts
  packages/db/prisma/migrations/0061_plan_display_names/migration.sql
  apps/web/app/api/cms/admin/display-names/[productId]/route.ts
  apps/web/src/cms-admin/requireCmsAdminPage.ts
  apps/web/src/cms-admin/products.ts
  apps/web/src/server/commerceRepositories.ts
  apps/web/src/server/cmsPreviewService.ts  (Phase 1H — already correct, not touched)
  @acos/catalog (all of it)
```

All "Modified" and "New" paths above were directly read and verified to exist in this session (Section 3/4), except the two `(marketing)` page files, which were confirmed to exist and to import `ProductLanding` but were not opened in full — listed as "no direct edit expected" rather than claimed as a verified edit, per this plan's own evidence standard.

---

## Self-review notes

- **Spec coverage:** all 14 requested sections present with concrete, evidence-backed content, not placeholders.
- **Step scan:** each Task step names an exact file and either an exact signature (Task 2) or an exact, already-enumerated change (Task 3, cross-referenced to Section 4's table) — no step says "handle appropriately" without specifics.
- **Type consistency:** `getCustomerDisplayName(productId: ProductId): Promise<string>` is defined once (Task 2) and referenced identically everywhere else (Section 6, Task 1, Task 3).
- **Review Focus:** the five entries were chosen after drafting the full call-site inventory, specifically for the failure modes the table's "Risk" column surfaced — each has an owning verification step.
- **Proportion:** long because the call-site inventory and the rendering-mode evidence are themselves the plan's main value — the actual code change per site is 1-3 lines; Task 3's steps intentionally don't repeat Section 4's table, they reference it.

---

**Confirmation:** no application code, test, configuration, schema, or migration was changed in producing this plan. No database row was changed (only read-only queries). No commit, push, or deployment occurred. This file is the only artifact created.
