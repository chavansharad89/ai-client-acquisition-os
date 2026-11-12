# Learning Path Selection (CMS-PO-014, Requirement A) Implementation Plan — DRAFT

> **Status: DRAFT, awaiting Product Owner review.** This plan is created under explicit Product Owner authorization (chat, 2026-11-09) to plan Requirement A only. It does not itself authorize implementation or release — see CMS-PO-014 §11 and §10.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Requirement B (Complete Learning Path Download) is out of scope for this plan in its entirety** — do not add any download/package-generation code while executing this plan, even if it looks convenient to do alongside a task here.

**Goal:** On the Plus product (`ai_income_99`) only, opening `/access/[productId]` with a CMS content tree always shows a Learning Path Selection page first — one card per `PUBLISHED` depth-0 `CONTAINER` in that product's entitlement-filtered tree — instead of going straight to Roadmap View. Selecting a card opens that container's subtree through the existing, completely unmodified Roadmap View / Topic-wise View toggle and dedicated topic-detail page. Pro (`ai_freelancing_499`) and Max (`ai_client_acquisition_1499_subscription`) are untouched and keep today's behavior exactly.

**Architecture:** `apps/web/app/access/[productId]/page.tsx` (a Server Component) already builds an entitlement-filtered `ContentTreeNode[]` (`cmsLibraryTree`) and already resolves a `?topic=` query parameter against it (CMS-PO-013). This plan adds a sibling `?path=` query parameter, resolved by a new pure function, that picks out one depth-0 `CONTAINER` from that same tree. When no valid `path` is selected (Plus only), the page renders a new `LearningPathSelection` component listing the available containers as cards. When a valid `path` is selected, the page renders the **existing, unmodified** `ProductRoadmap`/`TopicDetailView` components, passed a one-element tree (`[selectedPath]`) instead of the whole product tree — which is also the mechanism that keeps every nested navigation decision (Roadmap View default, Topic-wise Previous/Next, breadcrumbs, topic adjacency) automatically scoped to the chosen path, since all of `topicNavigation.ts`'s existing functions already operate on whatever tree they are given. Pro/Max keep calling the pre-existing code path unchanged, selected by a single product-id check.

**Tech Stack:** Next.js App Router (Server Components + `next/navigation`), existing plain-CSS design system (`apps/web/app/globals.css`), Vitest, `react-dom/server`'s `renderToStaticMarkup` (this page's existing test pattern — no new test library).

**Spec:** `requirement/CMS_PO_014_LEARNING_PATH_SELECTION_AND_COMPLETE_DOWNLOAD_PO_DECISION.md` (approved 2026-11-09, Requirement A / §2, §5 criteria 1–7). Traceability: amends only CMS-PO-011(B)'s "Roadmap View is the default on open" clause (`requirement/CMS_PO_011_CUSTOMER_ROADMAP_UI_PO_DECISIONS.md`); does not touch CMS-PO-012 (`requirement/CMS_PO_012_ROADMAP_GRAPH_RENDERER_PROTOTYPE_DECISION.md`) or CMS-PO-013 (`requirement/CMS_PO_013_TOPIC_DETAIL_DEDICATED_PAGE_PO_DECISION.md`) — this plan is additive to CMS-PO-013's `?topic=` pattern, not a change to it. Executors read CMS-PO-014 in full before starting; this plan does not restate its acceptance criteria beyond what each task maps to (see Self-Review).

## Global Constraints

- **Git authorization.** No task in this plan commits or pushes automatically. Each task's changes are left staged/uncommitted on completion. Creating a git commit, and any push, each require their own separate, explicit Product Owner (or user) authorization at the time — this plan's authorization to create and execute it is not that authorization.
- **Requirement B is entirely out of scope.** No "Download Complete Book" action, no ZIP/PDF package generation, no new download route. CMS-PO-014 D8 (resource limits) is unresolved and blocks Requirement B regardless of this plan's progress; the §3.7 complete-book designation mechanism is similarly out of scope. Nothing in this plan depends on either.
- **Plus only (CMS-PO-014 D3).** The branch that shows `LearningPathSelection` and scopes rendering to a single `?path=` container applies only when `product.id === 'ai_income_99'`. Pro (`ai_freelancing_499`) and Max (`ai_client_acquisition_1499_subscription`) must render exactly as they do today — same code path, same output — verified by regression tests, not by inspection alone.
- **Always show selection (CMS-PO-014 D1).** No count-based skip. A Plus product with exactly one published depth-0 container still shows the selection page; this is the single most important regression to pin with a test, since it is the opposite of what a "smallest change" instinct might otherwise implement.
- **No new table, column, or migration (CMS-PO-014 §2.3, D2).** A "learning path" is read, not stored — it is exactly a depth-0 `CONTAINER` row already present in `content_items`. `listPublishedContentForPlans` (upstream of `cmsLibraryTree`) already excludes `DRAFT`/`ARCHIVED` rows entirely, so no additional status filtering is needed to satisfy D2's "draft/archived must not appear" — confirm this with a test rather than relying on this plan's own claim.
- **Do not touch:** CMS schema/migrations, `requireUser`/`canAccessProduct`/`permittedContentPlans`/`apps/web/src/server/access.ts`, `apps/web/src/server/cmsContentService.ts`, `apps/web/src/server/cmsAccessGate.ts`, the download route(s), payment/subscription code, `RoadmapFlowchart.tsx`/`flowchartLayout.ts`, the CMS-PO-012 prototype, the Learning Progress API, or any existing content identifiers. This plan only adds a new component and a new branch inside `page.tsx`, plus two new pure functions in `topicNavigation.ts`.
- **Zero changes to `ProductRoadmap.tsx`, `RoadmapView.tsx`, `TopicView.tsx`, `TopicDetailView.tsx`, or any existing export of `topicNavigation.ts`.** They already accept whatever `ContentTreeNode[]` they're handed; passing a one-element array (a single learning path's subtree) instead of the whole product tree requires no change to any of them. If a task in this plan finds that claim false, stop and record why before proceeding — it is load-bearing for the "smallest safe change" scope.
- No new npm dependency.

## Review Focus

- A Plus product with exactly one published depth-0 container must still show the selection page — not auto-resolve into Roadmap View (CMS-PO-014 D1). This is the one case most likely to be "fixed" back to the old behavior by habit; the test for it must exist and must fail if that happens.
- A `?path=` value that resolves to a real, entitled container belonging to a **different product** must not leak that product's content — exercised by confirming `cmsLibraryTree`'s existing per-product filtering (already relied on by `resolveTopicParam` today) also governs `resolvePathParam`, since both read from the same already-product-scoped `cmsTree`.
- A `?path=` value that matches a real container id, but one that is **not at depth 0** (i.e. a nested section, not a root), must be rejected — a learning path is specifically a depth-0 container (CMS-PO-014 D2), not any container anywhere in the tree.
- A `?topic=` value that is valid in the whole product's tree but **does not belong to the currently selected `?path=`** must fall back to that path's own Roadmap View — never to a different path's content and never by searching outside the one-element scoped tree. This is the concrete mechanism that prevents cross-path content leakage (CMS-PO-014 §7.4).
- A published learning path with zero children must still appear as a selectable card (CMS-PO-014 D10/acceptance criterion 3) — not hidden, not rendered with an error.
- Pro and Max, with a CMS tree that happens to also have multiple depth-0 containers, must render exactly as before (no selection page, straight to `ProductRoadmap` over the whole tree) — this is the regression most likely to break silently if the Plus-only guard is misplaced.
- The existing entitlement-gate-before-content-resolution ordering (anonymous → redirect `/access`; wrong product → redirect `/upsell/:id`) must still run before any path/topic resolution is attempted, for Plus exactly as it already does for Pro/Max and as it already does for topics today.

---

### Task 1: Pure learning-path helpers in `topicNavigation.ts`

**Files:**
- Modify: `apps/web/components/access/topicNavigation.ts`
- Modify (add cases to existing file): `apps/web/components/access/topicNavigation.test.ts`

**Interfaces:**
- Consumes: `ContentTreeNode` (`../../src/cms-admin/contentTree`, already imported in this file).
- Produces:
  ```ts
  export function learningPaths(tree: readonly ContentTreeNode[]): ContentTreeNode[];
  export function resolvePathParam(tree: readonly ContentTreeNode[], pathParam: string | undefined): ContentTreeNode | null;
  ```
  Task 2 consumes `learningPaths`; Task 3 consumes both. Neither function is recursive over the whole tree — both inspect only `tree`'s own top-level entries, which is what makes "depth-0" the correct, cheap definition of a learning path (no separate depth-tracking needed, unlike `locateNode`/`ancestorPath` which do walk the full tree for other purposes).

- [ ] **Step 1: Write the failing tests**

```ts
describe('learningPaths', () => {
  it('preserves the order of the tree it is given — e.g. buildContentTree\'s orderIndex-sorted roots', () => {
    // Build raw PublicContentItem rows with root-level orderIndex values supplied out of insertion order
    // (orderIndex: 1, then orderIndex: 0, then orderIndex: 2), run them through the existing, unmodified
    // buildContentTree() to get the real root ordering production code would produce, THEN call
    // learningPaths() on that result. Assert the returned array's order matches buildContentTree's own
    // output order exactly (orderIndex 0, 1, 2) — proving learningPaths() does not reorder what it's
    // given, not that learningPaths() itself sorts by orderIndex. It doesn't, and must not need to:
    // buildContentTree's own `sortTree(roots)` call (apps/web/src/cms-admin/contentTree.ts, the
    // `sortTree` closure applied to `roots` before the function returns) already sorts the top-level
    // array by orderIndex before learningPaths() ever sees it — confirmed by reading that
    // implementation directly, not assumed. learningPaths() only needs to be a plain, order-preserving
    // filter (Array.prototype.filter already preserves order) — do not add a second sort inside
    // learningPaths() itself; there is no repository evidence it would do anything but duplicate work
    // buildContentTree already does.
  });
  it('excludes a top-level ASSET node (not a CONTAINER) from the result', () => { /* tree with one root CONTAINER and one root ASSET; result has length 1 */ });
  it('includes a CONTAINER with zero children', () => { /* root CONTAINER with children: [] still appears */ });
  it('returns an empty array for a tree with no top-level CONTAINER nodes', () => { /* tree of only a root ASSET */ });
});

describe('resolvePathParam', () => {
  it('returns the matching top-level CONTAINER when pathParam matches its id', () => { /* ... */ });
  it('returns null when pathParam is undefined', () => { /* ... */ });
  it('returns null when pathParam does not match any node in the tree', () => { /* ... */ });
  it('returns null when pathParam matches a top-level ASSET id (not a CONTAINER)', () => { /* ... */ });
  it('returns null when pathParam matches a CONTAINER id that exists in the tree but is NOT at depth 0 (a nested section)', () => { /* build a tree where the matching container is a child of a root container; resolvePathParam must not find it via a full-tree search */ });
});
```

- [ ] **Step 2: Run the test file, verify the new cases fail** (functions not exported yet)

Run: `pnpm --filter web test -- components/access/topicNavigation`

- [ ] **Step 3: Implement the two functions**

```ts
export function learningPaths(tree: readonly ContentTreeNode[]): ContentTreeNode[] {
  return tree.filter((node) => node.nodeType === 'CONTAINER');
}

export function resolvePathParam(tree: readonly ContentTreeNode[], pathParam: string | undefined): ContentTreeNode | null {
  if (!pathParam) return null;
  return tree.find((node) => node.id === pathParam && node.nodeType === 'CONTAINER') ?? null;
}
```
`tree` is already sorted by `orderIndex` at every level by `buildContentTree` — `learningPaths` does not need to sort again. Neither function recurses into `children`; a nested-container id simply never matches `tree.find(...)` at the top level, which is exactly the depth-0-only behavior Review Focus requires — no explicit depth check needed beyond "look only at the array you were given, not its descendants."

- [ ] **Step 4: Run the test file, verify all cases pass**

Run: `pnpm --filter web test -- components/access/topicNavigation`

**Do not commit.** This task's changes are left staged/uncommitted on completion — committing and pushing require separate, explicit Product Owner authorization (see "Git authorization" below), not an automatic step of this plan.

---

### Task 2: `LearningPathSelection` component

**Files:**
- Create: `apps/web/components/access/LearningPathSelection.tsx`

**Interfaces:**
- Consumes: `ContentTreeNode` (`../../src/cms-admin/contentTree`), `Link` (`next/link`).
- Produces:
  ```ts
  export function LearningPathSelection(props: {
    paths: ContentTreeNode[];
    productId: string;
    displayName: string;
  }): JSX.Element;
  ```
  Task 3 is the only consumer, passing `learningPaths(cmsTree)` (Task 1) as `paths`. No test file for this component alone — per this codebase's existing convention (see the prior `TopicDetailView`/`TopicDetails` plan), a presentational component with no interactive behavior of its own is covered end-to-end through `page.test.ts` (Task 3), not in isolation.

- [ ] **Step 1: Implement the component**

```tsx
import Link from 'next/link';

import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

// CMS-PO-014 (Requirement A, Plus only): the page shown before any
// Roadmap View / Topic-wise View, listing one card per depth-0
// CONTAINER (= one "learning path") in the product's entitlement-
// filtered tree. Reuses the same list/button pattern as the legacy
// library page (`renderLibraryPage` in page.tsx) rather than
// introducing new layout — this is a selectable list, same shape.
export function LearningPathSelection({
  paths,
  productId,
  displayName,
}: {
  paths: ContentTreeNode[];
  productId: string;
  displayName: string;
}) {
  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '62ch' }}>
        <p style={{ margin: 0 }}>
          <Link href="/access">← Your library</Link>
        </p>
        <h1 className="page-title">{displayName}</h1>
        <p style={{ margin: 0 }}>Choose a learning path to get started.</p>
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {paths.map((path) => (
            <li key={path.id}>
              <Link className="btn btn-secondary btn-block" href={`/access/${productId}?path=${path.id}`}>
                {path.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web exec tsc --noEmit`

**Do not commit.** Same authorization boundary as Task 1 — see "Git authorization" below.

---

### Task 3: Wire `page.tsx` — Plus-only branch, `?path=` resolution, scoped rendering

**Files:**
- Modify: `apps/web/app/access/[productId]/page.tsx`
- Modify: `apps/web/app/access/[productId]/page.test.ts`

**Interfaces:**
- Consumes: `learningPaths`, `resolvePathParam` (Task 1); `LearningPathSelection` (Task 2); existing `resolveTopicParam`, `ProductRoadmap`, `TopicDetailView`.
- Produces: no new exports; changes `ProductAccessPage`'s internal branching and its `searchParams` type to `{ topic?: string | string[]; path?: string | string[] }`.

- [ ] **Step 1: Write the failing `page.test.ts` cases**

Extend the existing `renderProduct` helper (currently typed `searchParams?: { topic?: string | string[] }`) to also accept `path`:
```ts
async function renderProduct(productId: string, searchParams?: { topic?: string | string[]; path?: string | string[] }) {
  const { default: ProductAccessPage } = await import('./page');
  return renderToStaticMarkup(
    await ProductAccessPage(searchParams ? { params: { productId }, searchParams } : { params: { productId } }),
  );
}
```
Add a new `describe('/access/[productId] — Learning Path Selection (CMS-PO-014, Plus only)', ...)` with (each seeding `ai_income_99` CMS content via the existing `createContainer`/`createAsset`/`fakeContentItemRepository` helpers already used elsewhere in this file):
```ts
it('shows the selection page with one card per published depth-0 container, no ?path=', async () => {
  // grant(['ai_income_99']); create two root containers "AI Engineering" and "System Design", each published, each with a child asset
  // const html = await renderProduct('ai_income_99');
  // expect(html).toContain('AI Engineering'); expect(html).toContain('System Design');
  // expect(html).not.toContain('Roadmap'); // the view-switcher button text — proves ProductRoadmap did not also render
});
it('still shows the selection page when exactly one published depth-0 container exists (D1 — no count-based skip)', async () => {
  // grant(['ai_income_99']); create exactly one root container with a child asset, no ?path=
  // const html = await renderProduct('ai_income_99');
  // expect(html).toContain('Choose a learning path'); expect(html).not.toContain('Roadmap');
});
it('a published depth-0 container with zero children still appears as a card', async () => {
  // create a root container with no children; assert its title is in the selection html
});
it('excludes DRAFT and ARCHIVED depth-0 containers from the selection, showing only the PUBLISHED one (CMS-PO-014 acceptance criterion 2)', async () => {
  // grant(['ai_income_99']); create three root containers sharing owningProductId 'ai_income_99' — one status: 'PUBLISHED' titled "Published Path", one status: 'DRAFT' titled "Draft Path", one status: 'ARCHIVED' titled "Archived Path" — via the existing createContainer/fakeContentItemRepository helpers' status option
  // const html = await renderProduct('ai_income_99');
  // expect(html).toContain('Published Path'); expect(html).not.toContain('Draft Path'); expect(html).not.toContain('Archived Path');
  // Note: the DRAFT/ARCHIVED rows are excluded before this plan's code ever runs, by the existing, unmodified listPublishedContentForPlans() (inside listAccessibleCmsContent()) — this test exercises that existing guarantee end-to-end through the new selection page, rather than asserting it only by description.
});
it('renders the existing ProductRoadmap, scoped to only the selected path, for a valid ?path=', async () => {
  // two root containers "A" and "B", each with a distinct child asset; renderProduct('ai_income_99', { path: <A.id> })
  // expect(html).toContain('A'); expect(html).toContain(A's asset title); expect(html).not.toContain('B'); expect(html).not.toContain(B's asset title)
});
it('falls back to the selection page for an unknown ?path= value', async () => { /* path: 'does-not-exist' */ });
it('falls back to the selection page when ?path= matches a nested (non-root) container id', async () => {
  // root container "A" with a child container "A-section"; renderProduct('ai_income_99', { path: <'A-section'.id> })
  // expect selection-page markup, not A-section's content
});
it('falls back to the selected path\'s own Roadmap View (not the selection page) when ?topic= belongs to a different path', async () => {
  // two root containers A (asset a1) and B (asset b1); renderProduct('ai_income_99', { path: A.id, topic: b1.id })
  // expect(html).toContain('A'); expect(html).not.toContain('Choose a learning path'); expect(html).not.toContain(b1's title as a dedicated-page heading)
});
it('does not apply Learning Path Selection to Pro (ai_freelancing_499) — renders ProductRoadmap over the whole tree as today', async () => {
  // grant(['ai_freelancing_499']); create two root containers; renderProduct('ai_freelancing_499')
  // expect(html).toContain('Roadmap'); expect(html).not.toContain('Choose a learning path')
});
it('does not apply Learning Path Selection to Max (ai_client_acquisition_1499_subscription) — renders ProductRoadmap over the whole tree as today', async () => {
  // same shape as the Pro case, for Max
});
it('legacy fallback (no CMS tree) for Plus is unaffected by this feature', async () => {
  // grant(['ai_income_99']); CMS_ACCESS_CUTOVER_ENABLED unset (default false, per beforeEach) or zero published items
  // expect(html).not.toContain('Choose a learning path'); existing legacy-library assertions still hold
});
```

- [ ] **Step 2: Run the test file, verify the new cases fail for the right reason**

Run: `pnpm --filter web test -- access/\[productId\]/page`
Expected: FAIL — `LearningPathSelection`/`resolvePathParam`/`learningPaths` not wired yet, or old unconditional `ProductRoadmap` render for Plus.

- [ ] **Step 3: Implement the `page.tsx` changes**

```ts
import { learningPaths, resolvePathParam, resolveTopicParam } from '../../../components/access/topicNavigation';
import { LearningPathSelection } from '../../../components/access/LearningPathSelection';
```
Add, near the top of the file (module scope, alongside existing constants):
```ts
// CMS-PO-014 D3: Learning Path Selection applies to Plus only. Pro and
// Max keep today's behavior (straight to ProductRoadmap over the whole
// tree) exactly — this record grants no implicit extension to them.
const PLUS_PRODUCT_ID: ProductId = 'ai_income_99';
```
Add a small helper (not exported — local to this file) to avoid duplicating the topic-resolution branch between the Plus and Pro/Max paths:
```ts
function renderRoadmapOrTopic(
  tree: ContentTreeNode[],
  productId: string,
  displayName: string,
  topicParam: string | undefined,
) {
  const selectedTopic = resolveTopicParam(tree, topicParam);
  if (selectedTopic) {
    return <TopicDetailView tree={tree} productId={productId} displayName={displayName} topic={selectedTopic} />;
  }
  return <ProductRoadmap tree={tree} productId={productId} displayName={displayName} />;
}
```
Change the page's `searchParams` type and replace the existing `if (cmsTree) { ... }` block:
```ts
export default async function ProductAccessPage({
  params,
  searchParams,
}: {
  params: { productId: string };
  searchParams?: { topic?: string | string[]; path?: string | string[] };
}) {
  // ...unchanged gate logic above...

  const cmsTree = await cmsLibraryTree(product.id, access.context.userId);
  if (cmsTree) {
    const topicParam = typeof searchParams?.topic === 'string' ? searchParams.topic : undefined;

    if (product.id !== PLUS_PRODUCT_ID) {
      return renderRoadmapOrTopic(cmsTree, product.id, displayName, topicParam);
    }

    const pathParam = typeof searchParams?.path === 'string' ? searchParams.path : undefined;
    const selectedPath = resolvePathParam(cmsTree, pathParam);
    if (!selectedPath) {
      return <LearningPathSelection paths={learningPaths(cmsTree)} productId={product.id} displayName={displayName} />;
    }
    return renderRoadmapOrTopic([selectedPath], product.id, displayName, topicParam);
  }

  // ...unchanged legacy fallback below...
}
```
As with the existing `topic` guard, a repeated `?path=` key arrives as `string[]`, and the `typeof searchParams?.path === 'string'` check intentionally treats that as "no path selected" (→ selection page), not an error — same pattern as the existing `topic` guard, for the same reason.

- [ ] **Step 4: Run the test file, verify all cases pass, including the full existing suite in this file**

Run: `pnpm --filter web test -- access/\[productId\]/page`
Expected: every pre-existing case in this file (gate redirects, legacy fallback, CMS-PO-013 topic-detail cases, Pro/Max cases) still passes unmodified, plus all new cases from Step 1.

**Do not commit.** Same authorization boundary as Tasks 1–2 — see "Git authorization" below.

---

### Task 4: Full regression pass and manual verification

**Files:** none created — verification only.

- [ ] **Step 1: Run every test file this plan touched or could affect**

Run: `pnpm --filter web test -- access` and `pnpm --filter web test -- components/access`
Record exact pass/fail counts and the file list — not a summary of "all passed."

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web exec tsc --noEmit`

- [ ] **Step 3: Manual browser verification** (no Playwright/Cypress in this repo — a UI change needs this, not just unit tests, per this project's verification standard):
  - Seed Plus (`ai_income_99`) CMS content with ≥2 published root containers, one with zero children.
  - Start the dev server against seeded content.
  - Open `/access/ai_income_99`: confirm the selection page shows, with a card per root container including the empty one, and no Roadmap/Topic toggle visible yet.
  - Click a card: confirm it lands on that path's Roadmap View (default), that the Topic-wise toggle still works, that every node is still clickable, and that only that path's topics appear (not the other path's).
  - From inside a path, click "← Your library": confirm it returns to `/access` (library list), not the Learning Path Selection page — this plan does not add a "back to path selection" link; note this as an observation for the Product Owner, not a defect, since no acceptance criterion requires one.
  - Manually edit the URL to `?path=<a valid id from the OTHER path>`: confirm it switches to that other path's Roadmap View correctly.
  - Manually edit the URL to `?path=<valid path>&topic=<a topic id belonging to the OTHER path>`: confirm it falls back to the selected path's own Roadmap View, not the global selection page and not the other path's topic.
  - Reduce Plus content to exactly one published root container: confirm the selection page still appears (not auto-skipped) — this is the single most important manual check given D1.
  - Open Pro (`ai_freelancing_499`) and, if seeded, Max (`ai_client_acquisition_1499_subscription`): confirm both go straight to their existing Roadmap View, no selection page.
  - Resize to mobile (375px): confirm the selection page cards are usable with no horizontal overflow (reusing the existing `.shell`/`.btn-block` pattern, which is already responsive elsewhere in this app).

- [ ] **Step 4: If anything regressed, stop and fix before proceeding** — this task authorizes no scope beyond Tasks 1-3's own files.

---

## Security, regression, and release risks

- **No new authorization path is introduced.** `resolvePathParam` and `learningPaths` both read from `cmsTree`, which is already built by the existing, unmodified `cmsLibraryTree()` → `listAccessibleCmsContent()` → `permittedContentPlans()` chain. No file in that chain is touched by this plan.
- **Cross-path leakage is structurally prevented, not just filtered.** Once a path is selected, every downstream component (`ProductRoadmap`, `RoadmapView`, `TopicView`, `TopicDetailView`, all of `topicNavigation.ts`) receives a one-element tree containing only that path's subtree — there is no code path by which a topic or node from a different learning path's subtree can be reached, because the data simply isn't present in what's passed down. This is the main reason this plan requires zero changes to any of those components.
- **Cross-product leakage is unchanged from today's guarantee** — `cmsTree` is already filtered to `product.id` before this plan's new logic ever sees it (unchanged `cmsLibraryTree` behavior).
- **Regression risk is concentrated in Task 3's branch logic**, specifically the `product.id !== PLUS_PRODUCT_ID` check — if this check is ever removed, inverted, or bypassed, Pro/Max would unexpectedly show a selection page (a behavior change CMS-PO-014 D3 explicitly does not authorize). Task 3's Pro/Max regression tests exist specifically to catch this.
- **Release risk:** this plan's scope is implementation only. Per CMS-PO-014 §10/§11, Requirement A's release still requires (a) this plan's tests passing, and (b) the content-hygiene dependency (CMS-PO-014 §9.1 — Plus's actual published root containers being genuine learning paths, not leftover test fixtures) being resolved by whoever curates CMS content, before this feature is enabled for real customers. This plan does not resolve that dependency; it is a content-operations action, out of this plan's scope.

## Test strategy mapped to CMS-PO-014 acceptance criteria (§5, Requirement A)

| CMS-PO-014 criterion | Covered by |
|---|---|
| 1. Selection page always shown, including for exactly one path | Task 3, `renderProduct` test "still shows... exactly one published depth-0 container" |
| 2. Only `PUBLISHED` depth-0 containers appear; `DRAFT`/`ARCHIVED` never do | Task 3's test "excludes DRAFT and ARCHIVED depth-0 containers from the selection, showing only the PUBLISHED one (CMS-PO-014 acceptance criterion 2)" — a tree with one `PUBLISHED`, one `DRAFT`, and one `ARCHIVED` root container, asserting only the `PUBLISHED` one's title appears |
| 3. A published path with zero eligible assets still appears as a card | Task 3, "zero children still appears as a card" |
| 4. Plus only; Pro/Max unaffected | Task 3, Pro and Max regression tests |
| 5. Selecting a card opens the existing, unmodified Roadmap View / Topic-wise toggle | Task 3, "scoped to only the selected path" test + Task 4 manual verification of the toggle/node-click/Previous-Next behavior, none of which this plan modifies |
| 6. Card content from existing fields only; no new DB column | Task 1/2 — `learningPaths`/`LearningPathSelection` read only `title`/`id`/`nodeType`, all pre-existing `ContentTreeNode` fields |
| 7. Entitlement/publication/download/30-day checks unchanged | No file under `apps/web/src/server/access.ts`, `cmsContentService.ts`, or `cmsAccessGate.ts` is modified; Task 3's full regression run of this file's pre-existing gate tests confirms no change in observed behavior |

## Unresolved questions and assumptions (not silently resolved — flagged for Product Owner awareness)

1. **A depth-0 `ASSET` with no container (no parent) is excluded from `learningPaths` and is therefore unreachable through this UI.** CMS-PO-014 D2 only defines a learning path as a depth-0 `CONTAINER`; it does not address a bare top-level `ASSET`. This plan does not resolve that gap — it simply does not surface such a node as a path, consistent with the literal text of D2. This is believed to be an unlikely data shape (existing CMS authoring always nests assets under a container), but it is not verified against real admin tooling behavior, and no governance record decides it either way.
2. **A bare `?topic=` without `?path=` on Plus does not bypass the selection page.** CMS-PO-014 §2.5 says "no path parameter → always render the selection component," with no stated exception for a topic parameter. This plan reads that literally: if an old or manually-constructed `?topic=`-only URL is opened on Plus with no `?path=`, the customer sees the selection page, not the topic. Since this feature is not yet deployed and no `?topic=`-only links are in circulation for Plus, this is not a backward-compatibility break in practice — but it is a specific reading of an otherwise-silent case, not something CMS-PO-014 explicitly spells out, and it is flagged here rather than assumed silently.
3. **Selection-page styling reuses the existing `.shell` / `btn-secondary btn-block` list pattern** (the same one `renderLibraryPage`'s legacy library list already uses), rather than the wider `.shell-wide` class `ProductRoadmap` uses for its flowchart. This is a presentational default chosen for consistency with the closest existing analogous UI (a selectable list of items), not a Product Owner decision — easily revisited without affecting any acceptance criterion.
4. **Card content is title-only.** CMS-PO-014 does not require description, topic count, or other metadata on a card, and none of §5's criteria depend on it. This plan does not add any, consistent with "smallest change that satisfies the stated criteria" — flagged in case the Product Owner wants richer cards, which would be a new, separate ask.
5. **No "back to path selection" link is added from inside a selected path.** Not required by any CMS-PO-014 criterion (the existing "← Your library" link already provides a way out); Task 4's manual verification step records this as an observation, not a defect, so the Product Owner can decide whether it's wanted as a follow-up.

---

## Self-Review

**1. Spec coverage:** CMS-PO-014 §2 Requirement A, decisions D1–D4, and acceptance criteria 1–7 are each mapped to a specific task and test above (see the acceptance-criteria table). Requirement B, D5–D10, and §3.7 are explicitly out of scope and touched by no task.

**2. Step scan:** every code step names an exact file, an exact signature, or a specific test description; no step says "handle edge cases" without naming the case.

**3. Type consistency:** `learningPaths`/`resolvePathParam` (Task 1) are used with the same names and signatures by `LearningPathSelection` (Task 2, via its `paths` prop) and `page.tsx` (Task 3). `renderRoadmapOrTopic`'s signature in Task 3 matches both call sites (Plus-scoped and Pro/Max-unscoped).

**4. Review Focus:** all seven items map to a named test — D1's no-skip behavior, cross-product leakage (pre-existing, re-verified), non-root `?path=` rejection, cross-path `?topic=` isolation, empty-path card visibility, Pro/Max regression, and gate-ordering (reuse of this file's existing redirect tests) — each has a corresponding `it(...)` block or regression-run step in Task 3/4.

**5. Proportion:** code blocks are either exact signatures/test names or short, genuinely load-bearing decision bodies (the two Task 1 functions; the `renderRoadmapOrTopic` dedup helper, written out because its exact shape is what keeps Task 3's two branches from duplicating logic); no task restates JSX or logic that a signature alone would already pin down, and no task modifies a file not named in its own **Files** list.
