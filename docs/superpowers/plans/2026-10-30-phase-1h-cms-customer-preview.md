# Phase 1H — CMS Customer Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a CMS administrator see, read-only, exactly what a customer on a given plan (Plus/Pro/Max) would see in their content roadmap, plus DRAFT/ARCHIVED metadata for the admin's own review — with zero new entitlement, authorization, or asset-delivery mechanisms.

**Architecture:** A new admin-only page (`/cms/preview`) under the existing `/cms` layout (which already gates on `requireUser → requireCmsAdmin`) lets the admin pick a simulated plan. A new glue function in `apps/web/src/server/` composes two already-approved primitives — `@acos/core-cms`'s admin-scope `listByOwningProduct`/`toPublicContentItem`/`resolveDisplayName` and `@acos/core-subscriptions`'s `CMS_PLAN_INHERITANCE` — to assemble one content tree per implied product (Plus/Pro/Max, star-shaped inheritance, same algorithm the real customer path uses). A new, genuinely read-only presentational component renders those trees with no click targets, no fetch calls, and no mutation affordances, reusing the existing `StatusBadge`/icon/byte-formatting helpers already proven in the admin editor.

**Tech Stack:** Next.js App Router (Server Components), TypeScript, Vitest, existing Postgres-backed repositories via `commerceRepositories()`.

**Spec:** This plan's requirements come directly from the Product Owner instructions reproduced in full in Section 0 below (no separate spec document exists for Phase 1H yet). Supporting governance precedent: `requirement/PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md` (CMS-PO-001..005(R2): display-name configurability, Max→Plus+Pro inheritance, strict Plus/Pro separation, CMS-as-source-of-truth, reuse of existing entitlement infra) and `requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md` (admin scope / asset lifecycle). No record in `requirement/` or `docs/` names "Phase 1H," "Phase 1G," or "CMS Customer Preview" verbatim — this phase's scope is established by the Product Owner's instructions quoted below, not by a prior written governance record. This is flagged, not silently assumed.

## Global Constraints

- Admin-only: every data path requires `requireUser → requireCmsAdmin` (reuse `requireCmsAdminForPage()`, unchanged). No customer entitlement check anywhere in this feature.
- No new entitlement/session/token creation of any kind, for any user.
- No new backend endpoints, lifecycle states, database schema, or migrations.
- DRAFT/ARCHIVED assets: metadata only (filename, type, size, status) — no download, no playback, no new download endpoint.
- Never render `storageKey`, `previousStorageKey`, upload-session data, R2 credentials, or signed URLs — always pass data through `toPublicContentItem` first.
- Display names, product IDs, and Plus/Pro/Max inheritance come from the existing CMS primitives (`resolveDisplayName`, `ProductId`, `CMS_PLAN_INHERITANCE`) — never hardcoded or reimplemented.
- `ContentInspector` is never imported by the new customer-facing renderer.
- Phase numbering: this is Phase 1H. The existing Phase 1G / Display Names designation (`apps/web/app/cms/display-names/page.tsx`) is not renamed or touched.

## Review Focus

- **Plan-separation leak across trees:** a Plus-only preview must never show a Pro/Max container or asset row. Covered by Task 1's inheritance-filter tests (mirrors `customerContentService.test.ts`'s existing "cannot see Pro/Max content" pattern).
- **DRAFT/ARCHIVED row exposing a download/playback control:** the read-only renderer must have zero `<a href=download>`/`onClick`/fetch for any asset row, regardless of status. Covered by Task 2's browser-verification DOM check (no automated component-render test infra exists in this repo — see Task 2 rationale).
- **`storageKey`/`previousStorageKey` reaching the rendered HTML:** covered by Task 1's "no storage-key leakage" unit test (asserts the field is absent from the DTO, same shape `toPublicContentItem`'s own tests already assert) and by Task 3's browser `read_page`/`get_page_text` check finding no raw key string in the DOM.
- **Invalid/missing `?plan=` causing a 500 instead of a safe default:** covered by Task 3's default-to-Plus test, mirroring the existing `roadmaps/page.tsx` `?product=` defaulting pattern exactly.
- **An admin who is not a CMS administrator reaching `/cms/preview` directly:** the page sits under `app/cms/layout.tsx`, which already redirects/forbids before any child page renders — no new authorization code is introduced, so no new automated test is added for this case (would duplicate `cmsAdminAuthorization.test.ts` and `requireCmsAdminPage.ts`'s existing, unchanged coverage); it is instead confirmed by direct browser verification in Task 3, since that is the point where a regression in wiring (e.g. forgetting the page is under the gated layout) would actually show up.

---

## 0. Objective (Product Owner instructions, verbatim scope)

Build Phase 1H — an admin-only, read-only CMS customer preview. A CMS administrator selects a plan (Plus/Pro/Max) and sees the roadmap a real customer on that plan would see (PUBLISHED content only, Max inheriting Plus+Pro), plus DRAFT/ARCHIVED metadata for the admin's own review (never downloadable/playable, never a new endpoint). No entitlement, session, or authorization changes of any kind. No backend expansion beyond what is listed as reusable in Section 10. A dedicated independent security review (`octo:personas:security-auditor`) is mandatory before the phase is declared complete; the Product Owner's instructions for this task explicitly authorize that invocation for this scope (CLAUDE.md §4.2) — it still happens only at the gate in Section 13, never during this planning step, and never without being invoked for real (CLAUDE.md §3's Independent Review Evidence requirement: report what the reviewer actually found, or disclose that it did not run).

## 1. Scope

In scope: one new admin page, two new presentational components, one new server-side glue function and its unit tests, three small export-only edits to existing files (listed in Section 9), one nav-link addition. Out of scope: anything in Section 15 (Non-Goals).

## 2. Existing architecture being reused

| Concern | Existing primitive | Location |
|---|---|---|
| Admin authn/authz gate | `requireCmsAdminForPage()` | `apps/web/src/cms-admin/requireCmsAdminPage.ts:26-49` |
| Admin any-status content fetch | `listByOwningProduct(deps, productId)` | `packages/core-cms/src/contentService.ts:121-126` |
| Strip internal fields before any render | `toPublicContentItem(item)` | `packages/core-cms/src/contentItemDto.ts:15-18` |
| Plus/Pro/Max inheritance (star-shaped, Max→Plus+Pro+Max) | `CMS_PLAN_INHERITANCE`, `CMS_PLAN_PRODUCT_IDS` | `packages/core-subscriptions/src/cmsAccess.ts:32-55` |
| CMS-configured display name (falls back to catalog default) | `resolveDisplayName(deps, productId)` | `packages/core-cms/src/displayName.ts:25-32` |
| Flat rows → parent/child tree | `buildContentTree(items)` | `apps/web/src/cms-admin/contentTree.ts:16-41` |
| The 3 CMS-eligible plan IDs + tier labels | `CMS_PRODUCT_TIERS`, `isCmsProductId`, `DEFAULT_CMS_PRODUCT_ID` | `apps/web/src/cms-admin/products.ts` |
| Status pill styling | `StatusBadge` | `apps/web/components/cms/StatusBadge.tsx` |
| Shell/sidebar nav | `CmsShell`, `CmsSidebar` | `apps/web/components/cms/CmsSidebar.tsx:29-58` |
| Repository wiring | `commerceRepositories()` | `apps/web/src/server/commerceRepositories.ts:57-70` |
| Vitest + in-memory fakes, fixture-via-service pattern | `fakeContentItemRepository`, `createContainer`/`createAsset`/`setStatus` | `packages/core-cms/src/customerContentService.test.ts:1-30` (pattern to mirror) |

Confirmed NOT to exist anywhere in the repo (so none of it is assumed available): a reusable customer-facing roadmap renderer, a `page.test.ts`/component-render test for any existing `/cms/*` page, `@testing-library/react` or `jsdom` in any `package.json`/vitest config.

## 3. Proposed route/component structure

```
apps/web/app/cms/preview/page.tsx              (new — Server Component page)
apps/web/components/cms/PreviewPlanSwitcher.tsx (new — Plus/Pro/Max tab links)
apps/web/components/cms/CustomerRoadmapView.tsx  (new — read-only renderer)
apps/web/src/server/cmsPreviewService.ts         (new — glue: inheritance + fetch + tree)
apps/web/src/server/cmsPreviewService.test.ts    (new — unit tests)
apps/web/src/cms-admin/formatBytes.ts            (new — extracted from ContentInspector.tsx)
```

`/cms/preview` inherits the `requireCmsAdminForPage()` gate from `app/cms/layout.tsx` (unchanged) exactly as `/cms/roadmaps` and `/cms/display-names` already do, and additionally re-calls it itself for its own data fetch, matching the documented, intentional duplication pattern in `requireCmsAdminPage.ts:13-17`.

## 4. Authentication/authorization boundary

- `requireUser → requireCmsAdmin`, unchanged, via `requireCmsAdminForPage()`. No new authorization code is written.
- No customer entitlement, `permittedContentPlans`, or `subscription_periods` lookup anywhere in this feature — the "plan" being previewed is a value the admin picks from a closed 3-item list (`?plan=ai_income_99|ai_freelancing_499|ai_client_acquisition_1499_subscription`), not a real entitlement held by anyone.
- No session or token is minted. The admin's own session is the only one involved, and it is only ever used for the `requireCmsAdmin` check.

## 5. Product/plan selection behavior

- `?plan=` query param, validated with the existing `isCmsProductId` guard (`apps/web/src/cms-admin/products.ts:23-26`) — identical validation to `roadmaps/page.tsx`'s `?product=` handling. Invalid or missing value defaults to `DEFAULT_CMS_PRODUCT_ID` (Plus) — never a 500, never an error page.
- `PreviewPlanSwitcher` renders three plain `<Link>` tabs (Plus/Pro/Max, from `CMS_PRODUCT_TIERS`) to `/cms/preview?plan=<id>` — a server-rendered navigation, no client state, mirroring `ProductSwitcher.tsx:24-41`'s existing pattern.
- Selecting Max resolves, via `CMS_PLAN_INHERITANCE`, to three sections (Plus, Pro, Max) in that fixed order; selecting Plus or Pro resolves to exactly one section. This is the same algorithm `permittedContentPlans` uses for real customers (`packages/core-subscriptions/src/cmsAccess.ts:92-105`), applied directly to a chosen plan instead of a looked-up active subscription.

## 6. Published/DRAFT/ARCHIVED behavior

- The preview fetches **every** status for each implied product via the admin-scope `listByOwningProduct` (not the customer-scope `listPublishedContentForPlans`) — this is what makes it a preview that also shows DRAFT/ARCHIVED, as the Product Owner instructions require.
- `CustomerRoadmapView` always renders a `StatusBadge` on every row (DRAFT/PUBLISHED/ARCHIVED all visibly labeled) — there is no mode where a DRAFT/ARCHIVED row looks indistinguishable from a PUBLISHED one.
- No row of any status renders a download or playback control (Section 8).

## 7. Asset behavior

- Every item is passed through `toPublicContentItem` before it reaches a component prop — `storageKey`/`previousStorageKey` are never in scope past the service layer.
- **Design decision (flagged for Product Owner visibility, not silently chosen):** for PUBLISHED assets, the preview does **not** wire a live "Download" action, even though `GET /api/cms/content/[id]/download` already exists and could technically be called from this page. Reusing it here would authorize against the *viewing admin's own* real `subscription_periods` rows (via `permittedContentPlans` inside that route), not the plan being simulated — an admin previewing "Pro" who does not personally hold a Pro subscription would get a misleading 404/403 on an item that is genuinely PUBLISHED-and-Pro-visible to real customers, and an admin who happens to hold every plan would get a result that doesn't actually exercise plan separation at all. Wiring a *working-as-simulated* download would require either a new authorization path (forbidden by Section 15) or weakening the existing one (forbidden by the Product Owner instructions). The metadata-only treatment the instructions already mandate for DRAFT/ARCHIVED is therefore applied uniformly to PUBLISHED assets too: filename, type, size, status — reusing the exact existing delivery mechanism is deferred to the actual future customer-facing renderer (Section 15, non-goal), where the viewer's own entitlement and the plan being viewed are the same thing by construction.

## 8. Exact files expected to change/create

**Create:**
- `apps/web/app/cms/preview/page.tsx`
- `apps/web/components/cms/PreviewPlanSwitcher.tsx`
- `apps/web/components/cms/CustomerRoadmapView.tsx`
- `apps/web/src/server/cmsPreviewService.ts`
- `apps/web/src/server/cmsPreviewService.test.ts`
- `apps/web/src/cms-admin/formatBytes.ts`

**Modify (export-only, zero behavior change):**
- `apps/web/components/cms/ContentInspector.tsx:24-28` — remove the local `formatBytes` definition, import it from the new shared file instead.
- `apps/web/components/cms/RoadmapSection.tsx:11` — add `export` to `function assetIcon(...)` so `CustomerRoadmapView` can reuse the exact same icon mapping instead of duplicating it.
- `apps/web/components/cms/CmsSidebar.tsx` (around line 57) — add a `Customer Preview` nav entry linking to `/cms/preview`.

No other file changes. No schema/migration changes. No new routes under `app/api/**`.

## 9. API/service reuse

Every data-fetching primitive the new `cmsPreviewService.ts` calls already exists and is unchanged:
`listByOwningProduct`, `toPublicContentItem`, `resolveDisplayName` (all `@acos/core-cms`); `CMS_PLAN_INHERITANCE`, `CMS_PLAN_PRODUCT_IDS`, `CmsPlanProductId` (all `@acos/core-subscriptions`); `buildContentTree` (`apps/web/src/cms-admin/contentTree.ts`). No new package export, no new repository method, no new HTTP route.

## 10. TDD/test strategy

Business logic (plan inheritance, status inclusion, display-name resolution, storage-key stripping) is pure and fully unit-testable against the existing in-memory fakes (`fakeContentItemRepository`, `fakePlanDisplayNameRepository`) — this is where the Product Owner's required test list is covered, mirroring `customerContentService.test.ts`'s existing fixture-via-service pattern (`createContainer`/`createAsset` + `.setStatus(id, status)`, not hand-built `ContentItem` literals).

Presentation (the actual rendered DOM: no download/playback control anywhere, responsive layout, visible status labels, preview exit via the existing sidebar) has no automated test infra in this repo for Next.js Server Components (confirmed in Section 2) and is verified by browser instead (Section 11) rather than by inventing new test infrastructure, per CLAUDE.md §5.6/§5.8 (don't add tooling token efficiency and quality guardrails don't call for) and §4.3 (task boundaries — adding `@testing-library/react` to this repo is a larger, separate decision this task does not make unilaterally).

Mapping of the Product Owner's required test list onto where each is actually covered:

| Required test | Covered by |
|---|---|
| unauthenticated preview access | Browser verification (Task 3) — `requireCmsAdminForPage()` itself is unchanged and already covered by `cmsAdminAuthorization.test.ts` |
| authenticated non-admin access | Browser verification (Task 3), same rationale |
| CMS admin access | Browser verification (Task 3) |
| valid Plus/Pro/Max selection | Task 1, `buildPreviewSections` unit tests |
| invalid product selection | Task 1 (service trusts a pre-validated plan) + Task 3 (page-level default-to-Plus) |
| Plus inheritance | Task 1 |
| Pro inheritance | Task 1 |
| Max inheritance | Task 1 |
| plan separation | Task 1 (mirrors `customerContentService.test.ts`'s "cannot see Pro/Max content" tests) |
| PUBLISHED content visibility | Task 1 |
| DRAFT handling | Task 1 (included in the section, not filtered out — unlike the customer-only path) |
| ARCHIVED handling | Task 1 |
| asset metadata-only behavior | Task 2 (component has no download/playback markup) + Task 3 (browser DOM check) |
| no storage-key leakage | Task 1 (DTO-level assertion) + Task 3 (browser DOM/network check) |
| no entitlement mutation | N/A by construction — no write path exists anywhere in this feature; nothing to test |
| no customer session/token creation | N/A by construction — same reason |
| preview exit | Task 3, browser verification (navigate away via existing sidebar) |
| responsive rendering | Task 3, browser verification (`resize_window`) |

## 11. Browser verification plan

Using the existing `web-dev`-style Next.js dev server preview (per this session's `preview_start`/`preview_logs`/`read_page` tooling):
1. Sign in as a non-admin user, navigate to `/cms/preview` — expect the `app/cms/layout.tsx` "Not authorized" state, not the preview UI.
2. Sign in as a CMS admin, navigate to `/cms/preview` — expect the Plus section by default (no `?plan=`).
3. Click Pro, Max tabs — confirm the URL updates to `?plan=...` and the sections rendered change accordingly; for Max, confirm three sections (Plus, Pro, Max) appear in that order.
4. For a product with at least one DRAFT and one ARCHIVED item (seed via the existing `/cms/roadmaps` admin UI first, or confirm against whatever fixture data already exists), confirm both are visible with correct `StatusBadge` labels, and `get_page_text`/`read_page` show no "Download"/"Play" control and no raw storage-key-looking string for any row.
5. Navigate `/cms/preview?plan=not-a-real-id` — confirm it silently falls back to Plus, no error screen.
6. `resize_window` to mobile and tablet presets — confirm the layout has no horizontal overflow and remains readable.
7. Click a sidebar link (e.g. Roadmaps) from `/cms/preview` — confirm normal navigation away (the "preview exit" case — no special exit control is built per Section 6 of the plan body, the existing persistent sidebar already serves this).

## 12. Security-review plan (mandatory final gate)

1. Implementation tests pass (Task 1's unit tests, `pnpm --filter web test` or the targeted Vitest command for the touched packages).
2. Browser verification (Section 11) passes.
3. Typecheck passes for `apps/web` (targeted, not repo-wide, per CLAUDE.md §6.4 unless a repo-wide run is separately justified).
4. Lint passes for the touched files.
5. Build passes for `apps/web` (or the smallest build scope that exercises the new page/route).
6. Run `octo:personas:security-auditor`, scoped to: `apps/web/app/cms/preview/page.tsx`, `apps/web/components/cms/CustomerRoadmapView.tsx`, `apps/web/components/cms/PreviewPlanSwitcher.tsx`, `apps/web/src/server/cmsPreviewService.ts`, and the three export-only diffs in Section 9. Review scope explicitly includes: admin authorization correctness, plan isolation/leak risk, DRAFT/ARCHIVED exposure, asset-handling (storage-key leakage), preview parameter tampering (`?plan=`), and entitlement-bypass risk (Section 7's design decision in particular, since it is the one place a reviewer might expect a download control and find a deliberate absence instead). This invocation is pre-authorized for this task's scope by the Product Owner's own instructions (CLAUDE.md §4.2) — it is still only ever run for real, with its actual findings reported (fixed / outstanding / re-reviewed), never claimed without having actually executed, per CLAUDE.md §3's Independent Review Evidence requirement.
7. Review findings.
8. Fix any findings.
9. Re-run `octo:personas:security-auditor` if findings required code changes.
10. Only then is Phase 1H declared complete.

## 13. Rollback/containment considerations

- Fully additive: no migration, no schema change, no modification to any existing authorization, entitlement, or delivery code path (the three "modify" entries in Section 9 are export-only, behavior-preserving extractions).
- Rollback is `git revert` of the feature's commit(s) — nothing else references the new files, so reverting cannot strand data or break another feature.
- Blast radius if something is wrong: an admin-only, read-only page. No customer-facing behavior changes, so a defect here cannot affect a real customer's access, download, or session.

## 14. Explicit non-goals

- Wiring this renderer into the real, logged-in customer experience (a genuine future reuse target, per Section 3's "reusable between real customer presentation and admin preview if practical" instruction — the component is *shaped* to support it, but integrating it into an actual customer-facing route is separate work with its own authorization/UX review).
- A live, working download/playback action inside the preview for PUBLISHED assets (Section 7).
- Any change to `permittedContentPlans`, `subscription_periods`, `cms_admins`, or any entitlement/authorization primitive.
- Renaming, renumbering, or otherwise touching Phase 1G / Display Names.
- Resolving the pre-existing `CMS-PO-00N` identifier-collision housekeeping item noted in `requirement/PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md:8` — unrelated to this task, out of scope per CLAUDE.md §4.3.

## 15. Acceptance criteria

- A CMS administrator can reach `/cms/preview`, pick Plus/Pro/Max, and see the correct inherited set of sections with correct content for each.
- DRAFT and ARCHIVED items are visible with a clear status label and no download/playback control.
- PUBLISHED items are visible with no `storageKey`/`previousStorageKey` ever rendered or sent to the browser, and no live download control (Section 7).
- A non-admin or unauthenticated visitor never sees preview content.
- An invalid `?plan=` value never produces an error page.
- The page renders without horizontal overflow at mobile/tablet widths.
- All Task 1 unit tests pass; typecheck, lint, and build succeed for the touched scope; `octo:personas:security-auditor` has run with findings resolved (Section 12).

## 16. Release gate

Phase 1H may be declared complete only after, in order: Task 1 tests pass → Task 2/3 built and browser-verified (Section 11) → typecheck/lint/build pass → `octo:personas:security-auditor` run, findings resolved, re-reviewed if code changed → this report delivered to the Product Owner per CLAUDE.md §7. No commit or push happens before Product Owner approval of this plan (per the explicit "Do NOT implement yet / Do NOT commit / Do NOT push" instruction already in force).

---

## Task 1: Preview content service (plan inheritance + admin fetch + tree assembly)

**Files:**
- Create: `apps/web/src/server/cmsPreviewService.ts`
- Test: `apps/web/src/server/cmsPreviewService.test.ts`

**Interfaces:**
- Consumes: `listByOwningProduct`, `toPublicContentItem`, `resolveDisplayName` (`@acos/core-cms`); `CMS_PLAN_INHERITANCE`, `CMS_PLAN_PRODUCT_IDS`, `CmsPlanProductId` (`@acos/core-subscriptions`); `buildContentTree`, `ContentTreeNode` (`apps/web/src/cms-admin/contentTree.ts`); `createContainer`, `createAsset` (`@acos/core-cms`, test-only, for fixtures); `fakeContentItemRepository`, `fakePlanDisplayNameRepository` (`@acos/core-cms`, test-only).
- Produces: `PreviewSection { productId: ProductId; displayName: string; tree: ContentTreeNode[] }` and `buildPreviewSections(deps: CmsPreviewServiceDeps, plan: CmsPlanProductId): Promise<PreviewSection[]>`, where `CmsPreviewServiceDeps = ContentServiceDeps & DisplayNameDeps` (i.e. `{ contentItems, planDisplayNames }`) — consumed by Task 3's page.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, expect, it } from 'vitest';
import { createAsset, createContainer, fakeContentItemRepository, fakePlanDisplayNameRepository } from '@acos/core-cms';
import { buildPreviewSections } from './cmsPreviewService';

function deps() {
  return { contentItems: fakeContentItemRepository(), planDisplayNames: fakePlanDisplayNameRepository() };
}

describe('buildPreviewSections', () => {
  it('Plus plan resolves to exactly one section, for ai_income_99', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections.map((s) => s.productId)).toEqual(['ai_income_99']);
  });

  it('Pro plan resolves to exactly one section, for ai_freelancing_499', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_freelancing_499');
    expect(sections.map((s) => s.productId)).toEqual(['ai_freelancing_499']);
  });

  it('Max plan resolves to Plus, Pro, Max sections in that order', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_client_acquisition_1499_subscription');
    expect(sections.map((s) => s.productId)).toEqual([
      'ai_income_99',
      'ai_freelancing_499',
      'ai_client_acquisition_1499_subscription',
    ]);
  });

  it('plan separation: Plus section never includes Pro/Max content', async () => {
    const d = deps();
    await createContainer(d, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro chapter' });
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections).toHaveLength(1);
    expect(sections[0].tree).toEqual([]);
  });

  it('includes DRAFT content (unlike the customer-only path)', async () => {
    const d = deps();
    await createContainer(d, { owningProductId: 'ai_income_99', parentId: null, title: 'Draft chapter' });
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0].tree).toHaveLength(1);
    expect(sections[0].tree[0].status).toBe('DRAFT');
  });

  it('includes PUBLISHED content', async () => {
    const d = deps();
    const chapter = await createContainer(d, { owningProductId: 'ai_income_99', parentId: null, title: 'Published' });
    await d.contentItems.setStatus(chapter.id, 'PUBLISHED');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0].tree[0].status).toBe('PUBLISHED');
  });

  it('includes ARCHIVED content', async () => {
    const d = deps();
    const chapter = await createContainer(d, { owningProductId: 'ai_income_99', parentId: null, title: 'Archived' });
    await d.contentItems.setStatus(chapter.id, 'PUBLISHED');
    await d.contentItems.setStatus(chapter.id, 'ARCHIVED');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0].tree[0].status).toBe('ARCHIVED');
  });

  it('never leaks storageKey/previousStorageKey on an ASSET row', async () => {
    const d = deps();
    const asset = await createAsset(d, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'File',
      assetKind: 'FILE',
      storageKey: 'cms/ai_income_99/secret-key.pdf',
      bytes: '1024',
    });
    await d.contentItems.setStatus(asset.id, 'PUBLISHED');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0].tree[0]).not.toHaveProperty('storageKey');
    expect(sections[0].tree[0]).not.toHaveProperty('previousStorageKey');
  });

  it('resolves the CMS-configured display name when one is set', async () => {
    const d = deps();
    await d.planDisplayNames.upsert('ai_income_99', 'Plus', 'admin-1');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0].displayName).toBe('Plus');
  });

  it('falls back to the catalog default display name when no override is set', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0].displayName.length).toBeGreaterThan(0);
  });
});
```

(Confirm the exact exported names and signatures of `createAsset`/`createContainer`/`fakeContentItemRepository`/`fakePlanDisplayNameRepository` against `packages/core-cms/src/index.ts` and `packages/core-cms/src/customerContentService.test.ts` before writing — they are already used with this exact shape elsewhere in the codebase.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter web vitest run src/server/cmsPreviewService.test.ts`
Expected: FAIL with "Cannot find module './cmsPreviewService'" or similar.

- [ ] **Step 3: Implement `buildPreviewSections` in `apps/web/src/server/cmsPreviewService.ts`**

```typescript
export interface PreviewSection {
  productId: ProductId;
  displayName: string;
  tree: ContentTreeNode[];
}

export interface CmsPreviewServiceDeps extends ContentServiceDeps, DisplayNameDeps {}

export async function buildPreviewSections(
  deps: CmsPreviewServiceDeps,
  plan: CmsPlanProductId,
): Promise<PreviewSection[]>
```

Implementation approach: filter `CMS_PLAN_PRODUCT_IDS` by membership in `CMS_PLAN_INHERITANCE[plan]` to get a stably-ordered (Plus, Pro, Max) list of implied product IDs; for each, sequentially (not `Promise.all` — mirror `findActiveCmsPlans`'s existing single-connection-safety rationale in `cmsAccess.ts:73-76`, since both run against the same kind of injected SQL client) call `listByOwningProduct`, map through `toPublicContentItem`, call `resolveDisplayName`, and `buildContentTree` the mapped items into one `PreviewSection`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web vitest run src/server/cmsPreviewService.test.ts`
Expected: PASS, all 10 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/server/cmsPreviewService.ts apps/web/src/server/cmsPreviewService.test.ts
git commit -m "feat(cms): add Phase 1H preview content service"
```

---

## Task 2: Read-only renderer and plan switcher components

**Files:**
- Create: `apps/web/src/cms-admin/formatBytes.ts`
- Create: `apps/web/components/cms/CustomerRoadmapView.tsx`
- Create: `apps/web/components/cms/PreviewPlanSwitcher.tsx`
- Modify: `apps/web/components/cms/ContentInspector.tsx:24-28` (import `formatBytes` instead of defining it locally)
- Modify: `apps/web/components/cms/RoadmapSection.tsx:11` (export `assetIcon`)

**Interfaces:**
- Consumes: `PreviewSection`/`ContentTreeNode` (Task 1); `StatusBadge` (`apps/web/components/cms/StatusBadge.tsx`); `assetIcon` (now exported from `RoadmapSection.tsx`); `CMS_PRODUCT_TIERS` (`apps/web/src/cms-admin/products.ts`); `cn` (`apps/web/lib/utils`).
- Produces: `formatBytes(bytes: number): string`; `CustomerRoadmapView({ sections, showLifecycleBadges }: { sections: readonly PreviewSection[]; showLifecycleBadges: boolean })`; `PreviewPlanSwitcher({ activePlan }: { activePlan: ProductId })` — both consumed by Task 3's page.

There is no automated test for this task (no component-render test infra in this repo, per Section 2/10 of the plan body) — correctness is confirmed by Task 3's browser verification, which exercises these components as rendered by the real page.

- [ ] **Step 1: Extract `formatBytes` into its own file**

Move the existing 3-line function at `ContentInspector.tsx:24-28` into `apps/web/src/cms-admin/formatBytes.ts` verbatim (same thresholds/format), export it, and update `ContentInspector.tsx` to import it instead of defining it locally. No behavior change — confirm by re-reading `ContentInspector.tsx`'s two call sites (`:418`, `:592`) still compile and are unchanged.

- [ ] **Step 2: Export `assetIcon` from `RoadmapSection.tsx`**

Change `function assetIcon(...)` to `export function assetIcon(...)` at `RoadmapSection.tsx:11`. No other change to that file.

- [ ] **Step 3: Implement `CustomerRoadmapView.tsx`**

A Server Component (no `'use client'`, no `useState`) that, for each `PreviewSection`, renders a heading (`displayName`) and a recursive read-only tree: CONTAINER nodes with children as a native `<details open={depth < 2}><summary>...</summary>...</details>` (zero client JS needed for expand/collapse); ASSET leaves and childless CONTAINERs as a plain row showing the `assetIcon` icon, title, (for ASSET) `assetKind` and `formatBytes(Number(node.bytes))`, and — only when `showLifecycleBadges` is true — a `StatusBadge`. No `onClick`, no `role="button"`, no `<a href>`, no `fetch` anywhere in this file, for any status. An empty section's tree renders the existing `EmptyState` component with a message naming that section's `displayName`.

- [ ] **Step 4: Implement `PreviewPlanSwitcher.tsx`**

A Server Component rendering three `<Link href="/cms/preview?plan=...">` tabs from `CMS_PRODUCT_TIERS`, styled identically to the existing product-tab half of `ProductSwitcher.tsx:24-41` (same `cn(...)` active/inactive classes), linking to `/cms/preview` instead of `/cms/roadmaps`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/cms-admin/formatBytes.ts apps/web/components/cms/CustomerRoadmapView.tsx apps/web/components/cms/PreviewPlanSwitcher.tsx apps/web/components/cms/ContentInspector.tsx apps/web/components/cms/RoadmapSection.tsx
git commit -m "feat(cms): add read-only customer roadmap renderer and plan switcher"
```

---

## Task 3: Preview page, nav entry, and browser verification

**Files:**
- Create: `apps/web/app/cms/preview/page.tsx`
- Modify: `apps/web/components/cms/CmsSidebar.tsx` (add nav entry, near line 57)

**Interfaces:**
- Consumes: `requireCmsAdminForPage` (`apps/web/src/cms-admin/requireCmsAdminPage.ts`); `isCmsProductId`, `DEFAULT_CMS_PRODUCT_ID` (`apps/web/src/cms-admin/products.ts`); `buildPreviewSections` (Task 1); `CustomerRoadmapView`, `PreviewPlanSwitcher` (Task 2); `CmsPlanProductId` (`@acos/core-subscriptions`).
- Produces: the `/cms/preview` route itself — nothing downstream consumes this page's exports.

- [ ] **Step 1: Implement `apps/web/app/cms/preview/page.tsx`**

```typescript
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { plan?: string };
}

export default async function CmsPreviewPage({ searchParams }: Props)
```

Body: call `requireCmsAdminForPage()` to get `repos`; resolve `plan` via `isCmsProductId(searchParams.plan) ? searchParams.plan : DEFAULT_CMS_PRODUCT_ID` (cast to `CmsPlanProductId` with a one-line comment noting `isCmsProductId` only ever matches the 3 CMS-eligible ids, which are exactly `CmsPlanProductId`'s members); call `buildPreviewSections({ contentItems: repos.contentItems, planDisplayNames: repos.planDisplayNames }, plan)`; render a header (title "Customer Preview", one-sentence explanation that this shows what the selected plan's customers see, plus Draft/Archived for review) with `<PreviewPlanSwitcher activePlan={plan} />`, then `<CustomerRoadmapView sections={sections} showLifecycleBadges />`.

- [ ] **Step 2: Add the nav entry in `CmsSidebar.tsx`**

Add `{ label: 'Customer Preview', href: '/cms/preview' }` to the existing final `NAV_SECTIONS` entry (alongside `Display Names`), so both admin-facing standalone pages are grouped together.

- [ ] **Step 3: Browser-verify per Section 11 of the plan body**

Run through all 7 scenarios in Section 11 using the dev server preview tooling. Record pass/fail for each; any failure is fixed before proceeding to Step 4.

- [ ] **Step 4: Typecheck, lint, build (targeted to `apps/web`)**

Run the project's existing targeted commands for `apps/web` (not a full-repo run, per CLAUDE.md §5/§6 unless this scope proves insufficient).

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/cms/preview/page.tsx apps/web/components/cms/CmsSidebar.tsx
git commit -m "feat(cms): wire Phase 1H customer preview page and nav entry"
```

- [ ] **Step 6: Security review gate (Section 12)**

Invoke `octo:personas:security-auditor` with the scope listed in Section 12. Document, per CLAUDE.md's Independent Review Evidence requirement: persona invoked, files/scope reviewed, findings, which were resolved and how, which remain outstanding, and whether the review ran to completion. Fix findings and re-run if any required a code change. Only then is this task — and Phase 1H — complete.

---

## Self-review notes

- **Spec coverage:** all 17 Product-Owner-required sections appear above as numbered headings (0–16), each with concrete content, not placeholders. The four "implementation constraints" and "no backend expansion" lists are folded into Sections 4/7/9/14 rather than repeated verbatim.
- **Step scan:** each step above names an exact file, exact signature, or exact command; no step says "handle edge cases" or leaves a type undefined elsewhere.
- **Type consistency:** `PreviewSection`/`CmsPreviewServiceDeps`/`buildPreviewSections` are defined once in Task 1 and referenced, not redefined, in Tasks 2 and 3. `showLifecycleBadges` and `activePlan` prop names match between their Task 2 definition and Task 3 usage.
- **Review Focus:** the five entries above were selected by rereading the Product Owner's instructions after drafting the tasks; each has a named owning test or verification step.
- **Proportion:** this plan is long because the Product Owner's instructions mandated 17 explicit sections and a long required-test list; the actual code it describes is six small files and three one-line edits, with no task's code block exceeding what its signature and tests already determine.

---

**Confirmation:** no application code, test, configuration, schema, or migration was changed in producing this plan. No commit, push, or deployment occurred. This file is the only artifact created.
