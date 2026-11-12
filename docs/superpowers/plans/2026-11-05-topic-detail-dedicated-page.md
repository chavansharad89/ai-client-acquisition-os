# Dedicated Topic-Detail Page & Full-Width Learning Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking any topic (ASSET node) in either Roadmap View or Topic List View on `/access/[productId]` navigates to a dedicated, full-width topic-detail view — reached via `?topic=<contentItemId>` on the same route — with breadcrumb, download, Previous/Next, Mark Complete, and a link back to the overview; the overview itself (Roadmap/Topic List toggle) becomes full-width too, with no topic content rendered inline below it.

**Architecture:** `apps/web/app/access/[productId]/page.tsx` (a Server Component) reads `searchParams.topic`, resolves it against the already entitlement-filtered CMS tree via a new pure function, and renders either the existing `ProductRoadmap` overview (no match / no param) or a new `TopicDetailView` (match) — never both. Topic selection inside the overview is rewired so clicking an ASSET node navigates (`?topic=<id>`) instead of updating local React state; clicking a CONTAINER node keeps its existing in-page expand/select behavior unchanged. All new URL/selection decisions are pure functions added to the existing `topicNavigation.ts` module, consistent with that file's existing design.

**Tech Stack:** Next.js App Router (Server Components + `next/navigation`), existing plain-CSS design system (`apps/web/app/globals.css`), Vitest, `react-dom/server`'s `renderToStaticMarkup` (the project's existing pattern for this page — no new test library is introduced).

**Spec:** `requirement/CMS_PO_013_TOPIC_DETAIL_DEDICATED_PAGE_PO_DECISION.md` (approved 2026-11-05, including clarifications in its §2a). Executors read both documents; this plan does not restate §2a's eight clarifications beyond what each task needs.

## Global Constraints

- No new route segment — everything stays on `/access/[productId]`, selection carried by `?topic=<contentItemId>` (CMS-PO-013 §2, §2a.1).
- Topic resolution is **exclusively** via the entitlement-filtered CMS tree already built for the overview (`cmsLibraryTree()` → `listAccessibleCmsContent`) — no independent lookup, no trusting a client-supplied node type (CMS-PO-013 §2a.4).
- Every rejection reason (unknown id, CONTAINER id, wrong-product id, archived/unpublished id, unentitled id) takes the **same** fallback path — render the overview as if no `topic` param were given. No distinguishing error, no redirect, no 404 (CMS-PO-013 §2a.5).
- Do not touch: CMS schema/migrations, `requireUser`/`canAccessProduct`/`permittedContentPlans`/`apps/web/src/server/access.ts`, payment/subscription code, the Learning Progress API's route contracts, CMS content identifiers, `RoadmapFlowchart.tsx`/`flowchartLayout.ts`, the CMS-PO-012 prototype, or CMS-PO-011(B)–(E) (CMS-PO-013 §3).
- Do not merge `feature/learning-progress` as part of this work (CMS-PO-013 §4). Its merge happens separately, first, through the project's previously approved merge procedure. Task 5 (view tracking + Mark Complete) does not begin — not even against a documented contract — until that merge has actually landed on this branch; at that point, implement against the merged branch's real routes, types, and repository behavior, verified by reading them, not against this plan's or the original Learning Progress plan's description of what was proposed.
- No new npm dependency — this repo has no DOM-interaction test library (`@testing-library/react` is not installed); client-click behavior is tested by extracting the decision into a plain function and unit-testing that function directly, matching `topicNavigation.ts`'s existing style, not by adding a new test library.
- `.lede` (`max-width: 60ch`) is the existing readable-measure convention (`apps/web/app/globals.css:108-112`) — reuse it for long-form topic body copy; do not invent a second one.

## Review Focus

- A `topic` param pointing at a real, entitled ASSET in a **different product's** tree must fall back to the overview, not render that other product's content — exercised in Task 3's route-resolution tests (the tree passed in is already product-scoped, but the test must prove it, not assume it).
- A `topic` param pointing at a CONTAINER id (a real, entitled node, just the wrong type) must fall back to the overview, not throw or render a half-filled detail view — exercised in Task 1 (`resolveTopicParam`) and Task 3.
- Switching Roadmap View ↔ Topic List View while a CONTAINER is selected must still preserve CMS-PO-011(E)'s existing nearest-descendant-topic behavior, since this plan does not touch that logic — exercised by confirming `apps/web/components/access/topicNavigation.test.ts`'s existing `firstDescendantTopicId`/`openTopicsView`-related tests still pass unmodified in Task 6.
- The Previous/Next links on the dedicated topic page must be absent/disabled (not pointing at an invalid id) at the first and last topic in document order — exercised in Task 1 (`getAdjacentTopicIds`) and Task 3.
- Refreshing a topic-detail URL, or opening it directly with a cold session, must re-run the full entitlement gate (redirect anonymous → `/access`, wrong-product → `/upsell/:id`) exactly like the overview does today, before topic resolution is even attempted — exercised in Task 3 by reusing `page.test.ts`'s existing gate tests against a URL that also carries `?topic=`.
- A `topic` query parameter supplied more than once (Next.js's `string[]` form for a repeated key) must be treated as invalid input and fall back to the overview, not throw or arbitrarily pick the first/last value — exercised in Task 3.

---

### Task 1: Pure navigation/URL helpers in `topicNavigation.ts`

**Files:**
- Modify: `apps/web/components/access/topicNavigation.ts`
- Test: `apps/web/components/access/topicNavigation.test.ts`

**Interfaces:**
- Consumes: `ContentTreeNode`, `locateNode` (`../../src/cms-admin/contentTree`, already imported in this file); `flattenTopics` (already defined in this file).
- Produces:
  ```ts
  export function resolveTopicParam(tree: readonly ContentTreeNode[], topicParam: string | undefined): ContentTreeNode | null;
  export type NodeClickAction = { type: 'navigate'; href: string } | { type: 'select'; id: string };
  export function resolveNodeClick(tree: readonly ContentTreeNode[], id: string, productId: string): NodeClickAction;
  export function getAdjacentTopicIds(tree: readonly ContentTreeNode[], topicId: string): { prevId: string | null; nextId: string | null };
  export function ancestorPath(tree: readonly ContentTreeNode[], id: string): ContentTreeNode[];
  ```
  Task 3 and Task 4 consume all four directly; nothing else from this module changes shape.

- [ ] **Step 1: Write the failing tests**

```ts
describe('resolveTopicParam', () => {
  it('returns the matching ASSET node when topicParam is a real topic id', () => { /* ... */ });
  it('returns null when topicParam is undefined', () => { /* ... */ });
  it('returns null when topicParam does not match any node in the tree', () => { /* ... */ });
  it('returns null when topicParam matches a CONTAINER node id (never an ASSET)', () => { /* ... */ });
});

describe('resolveNodeClick', () => {
  it('returns {type: "navigate", href: "/access/<productId>?topic=<id>"} for an ASSET node id', () => { /* ... */ });
  it('returns {type: "select", id} for a CONTAINER node id', () => { /* ... */ });
  it('returns {type: "select", id} for an id not present in the tree (no navigation on an unknown id)', () => { /* ... */ });
});

describe('getAdjacentTopicIds', () => {
  it('returns {prevId: null, nextId: <second topic id>} for the first topic in document order', () => { /* ... */ });
  it('returns {prevId: <second-to-last>, nextId: null} for the last topic', () => { /* ... */ });
  it('returns both prevId and nextId for a topic in the middle of the sequence', () => { /* ... */ });
  it('returns {prevId: null, nextId: null} when topicId is not in the flattened sequence', () => { /* ... */ });
});

describe('ancestorPath', () => {
  it('returns [] for a top-level (root) node', () => { /* ... */ });
  it('returns the ordered chain of CONTAINER ancestors, root first, for a deeply nested node', () => { /* ... */ });
  it('returns [] for an id not present in the tree', () => { /* ... */ });
});
```

- [ ] **Step 2: Run the test file, verify the four new describe blocks fail** (functions not exported yet)

Run: `pnpm --filter web test -- components/access/topicNavigation`
Expected: FAIL — `resolveTopicParam is not a function` (and similarly for the other three).

- [ ] **Step 3: Implement the four functions**

`resolveTopicParam`: `topicParam ? flattenTopics(tree).find((t) => t.id === topicParam) ?? null : null`.

`resolveNodeClick`: look up `locateNode(tree, id)?.node`; if its `nodeType === 'ASSET'`, return `{ type: 'navigate', href: `/access/${productId}?topic=${id}` }`; otherwise return `{ type: 'select', id }` (covers CONTAINER and "not found" identically — falling through to existing local-select behavior is the safe default for an id this function doesn't recognize as a topic).

`getAdjacentTopicIds`: index `id` in `flattenTopics(tree)`; if not found, both null; else `prevId` is the previous element's id or null at index 0, `nextId` is the next element's id or null at the last index.

`ancestorPath`: pre-order DFS over `tree` accumulating the path of ancestor nodes seen so far; return that accumulated path (excluding the target itself) the first time `id` is matched, `[]` if never matched. (Mirrors `locateNode`'s own walk, but returns the full chain instead of just the immediate parent.)

- [ ] **Step 4: Run the test file, verify all cases pass**

Run: `pnpm --filter web test -- components/access/topicNavigation`

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/access/topicNavigation.ts apps/web/components/access/topicNavigation.test.ts
git commit -m "feat(access): add topic-detail URL resolution helpers"
```

---

### Task 2: Full-width layout for the overview and the new topic-detail view

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/components/access/ProductRoadmap.tsx:46`
- Modify: `apps/web/components/access/TopicDetails.tsx:26`

**Interfaces:**
- Produces: CSS class `.shell-wide` (new), usable by `ProductRoadmap.tsx` (this task) and `TopicDetailView.tsx` (Task 3).

- [ ] **Step 1: Add `.shell-wide` next to the existing `.shell` rule**

In `apps/web/app/globals.css`, immediately after the `.shell` rule (currently lines 88-92), add:

```css
.shell-wide {
  max-width: var(--shell-wide);
  width: 100%;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 56px) clamp(16px, 4vw, 48px) 72px;
}
```

Add `--shell-wide: 1600px;` next to the existing `--shell: 1080px;` declaration (same `:root` block, line 32) — a one-line addition, not a change to the existing `--shell` value, so no other page using `.shell` is affected.

- [ ] **Step 2: Apply `.shell-wide` to the overview**

In `ProductRoadmap.tsx:46`, change `<main id="main" className="shell">` to `<main id="main" className="shell-wide">`. Do not change `renderLibraryPage`'s own `<main className="shell">` in `page.tsx` (legacy, non-CMS products — out of scope per CMS-PO-013 §3, not requested).

- [ ] **Step 3: Pin a readable measure for topic body copy**

In `TopicDetails.tsx:26`, change `<p>{node.description}</p>` to `<p className="lede">{node.description}</p>` — this is the one place both the overview's inline CONTAINER description and (via Task 3's reuse) the dedicated topic page's body copy render, so one change covers both.

- [ ] **Step 4: Verify with a build/typecheck** (no unit test for a CSS-only change; `.lede`'s effect on `TopicDetails` is exercised indirectly by Task 3's/Task 4's rendering tests, which assert the class is present)

Run: `pnpm --filter web exec tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/access/ProductRoadmap.tsx apps/web/components/access/TopicDetails.tsx
git commit -m "feat(access): full-width overview layout with a readable body-copy measure"
```

---

### Task 3: Dedicated `TopicDetailView` and server-side routing in `page.tsx`

**Files:**
- Create: `apps/web/components/access/TopicDetailView.tsx`
- Modify: `apps/web/app/access/[productId]/page.tsx`
- Modify: `apps/web/app/access/[productId]/page.test.ts`

**Interfaces:**
- Consumes: `resolveTopicParam`, `getAdjacentTopicIds`, `ancestorPath` (Task 1); `TopicDetails` (existing, `./TopicDetails`); `ContentTreeNode` (`../../src/cms-admin/contentTree`).
- Produces:
  ```ts
  export function TopicDetailView(props: {
    tree: ContentTreeNode[];
    productId: string;
    displayName: string;
    topic: ContentTreeNode;
  }): JSX.Element;
  ```
  Task 5 adds a `<MarkCompleteButton>` inside this component's own output; no other task depends on its internals beyond this signature.

- [ ] **Step 1: Write the failing `TopicDetailView` rendering assertions, inside the extended `page.test.ts` (Step 4 below) rather than a separate test file** — this component has no interactive behavior of its own (Task 4 handles that in the components it modifies), so it is covered end-to-end through the page that renders it, matching this file's existing convention of testing `page.tsx` as the integration point rather than every leaf component in isolation.

- [ ] **Step 2: Implement `TopicDetailView`**

Renders, inside `<main id="main" className="shell-wide">`:
1. A breadcrumb (`<nav aria-label="Breadcrumb">`): `<Link href={`/access/${productId}`}>{displayName}</Link>` → one non-interactive span per `ancestorPath(tree, topic.id)` entry's `title` → the current `topic.title` (plain text, not a link).
2. `<Link href={`/access/${productId}`}>← Back to course overview</Link>` (mirrors the existing `← Your library` link pattern already used in `page.tsx`/`ProductRoadmap.tsx`).
3. `<TopicDetails node={topic} productId={productId} onSelectChild={() => {}} />` — reuses the existing title/description/Download rendering verbatim; `onSelectChild` is a stable no-op because `topic` is always an ASSET here (TopicDetails' CONTAINER branch, which is the only branch that calls `onSelectChild`, is unreachable for this prop).
4. Previous/Next: `const { prevId, nextId } = getAdjacentTopicIds(tree, topic.id);` then two `<Link>`s to `/access/${productId}?topic=${prevId}` / `...${nextId}`, each replaced by a `disabled` `<span className="btn btn-secondary" aria-disabled="true">` when the corresponding id is `null` (mirrors the existing Previous/Next button styling in the now-removed `TopicView` block from Task 4, same class names).

- [ ] **Step 3: Wire `page.tsx`**

Change the page signature to accept `searchParams`:
```ts
export default async function ProductAccessPage({
  params,
  searchParams,
}: {
  params: { productId: string };
  searchParams?: { topic?: string | string[] };
}) { ... }
```
After `const cmsTree = await cmsLibraryTree(...)` (existing line 120) and before its existing `if (cmsTree) return <ProductRoadmap .../>`, insert:
```ts
if (cmsTree) {
  const topicParam = typeof searchParams?.topic === 'string' ? searchParams.topic : undefined;
  const selectedTopic = resolveTopicParam(cmsTree, topicParam);
  if (selectedTopic) {
    return <TopicDetailView tree={cmsTree} productId={product.id} displayName={displayName} topic={selectedTopic} />;
  }
  return <ProductRoadmap tree={cmsTree} productId={product.id} displayName={displayName} />;
}
```
(Replacing, not duplicating, the existing `if (cmsTree) return <ProductRoadmap ... />` line.) Import `resolveTopicParam` from `../../../components/access/topicNavigation` and `TopicDetailView` from `../../../components/access/TopicDetailView`. The legacy `renderLibraryPage` branch below is untouched — it never sees `searchParams.topic`.

Note on duplicate query parameters: when `?topic=` is supplied more than once, Next.js passes `searchParams.topic` as a `string[]`, not a `string`. The `typeof searchParams?.topic === 'string'` guard above already treats that array as `undefined` — this is intentional, not an oversight, and Step 4 below adds a test proving it, so a future edit to this guard can't silently change that behavior.

- [ ] **Step 4: Write the failing `page.test.ts` cases**

Extend the existing `renderProduct` helper to accept search params:
```ts
async function renderProduct(productId: string, searchParams?: Record<string, string>) {
  const { default: ProductAccessPage } = await import('./page');
  return renderToStaticMarkup(await ProductAccessPage({ params: { productId }, searchParams }));
}
```
Add, under a new `describe('/access/[productId] — dedicated topic-detail view (CMS-PO-013)', ...)`:
```ts
it('renders the dedicated topic-detail view for a valid ?topic= matching a published ASSET', async () => {
  // flag on, grant(['ai_income_99']), create + publish an ASSET, render with searchParams: { topic: asset.id }
  // expect(html).toContain(asset.title); expect(html).toContain(`/access/ai_income_99/download/${asset.id}`);
  // expect(html).not.toContain('Roadmap'); // the view-switcher button text, proving the overview did not also render
});
it('falls back to the overview when ?topic= does not match any node', async () => { /* searchParams: { topic: 'does-not-exist' }; expect(html).toContain('Roadmap'); */ });
it('falls back to the overview when ?topic= matches a CONTAINER, not an ASSET', async () => { /* create a container via createContainer, use its id */ });
it('falls back to the overview when ?topic= matches a real ASSET owned by a different product', async () => { /* seed the asset under ai_freelancing_499, request ai_income_99 with that id */ });
it('falls back to the overview when ?topic= matches a DRAFT (unpublished) ASSET', async () => { /* same as the existing DRAFT-fallback test, but with a topic param set */ });
it('still redirects an anonymous visitor even when ?topic= is present', async () => { /* no grant(); expect renderProduct(..., {topic: 'x'}) to reject/throw REDIRECT /access, same as the existing gate test, proving topic resolution never runs before the gate */ });
it('falls back to the overview when ?topic= is supplied more than once', async () => { /* render with searchParams: { topic: [asset.id, 'something-else'] } — the array form Next.js produces for a repeated key; expect(html).toContain('Roadmap'); expect(html).not.toContain(`/access/ai_income_99/download/${asset.id}`) */ });
```

- [ ] **Step 5: Run the test file, verify the new cases fail for the right reason, then pass**

Run: `pnpm --filter web test -- access/\[productId\]/page`
Expected: FAIL before Steps 2-3 (`TopicDetailView` / `resolveTopicParam` import errors or missing markup), PASS after.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/access/TopicDetailView.tsx apps/web/app/access/\[productId\]/page.tsx apps/web/app/access/\[productId\]/page.test.ts
git commit -m "feat(access): dedicated topic-detail view resolved via ?topic= query param"
```

---

### Task 4: Rewire topic selection — navigate on ASSET, keep local select on CONTAINER

**Files:**
- Modify: `apps/web/components/access/ProductRoadmap.tsx`
- Modify: `apps/web/components/access/RoadmapView.tsx`
- Modify: `apps/web/components/access/TopicView.tsx`

**Interfaces:**
- Consumes: `resolveNodeClick` (Task 1).
- Produces: `ProductRoadmap` passes a new `onSelect: (id: string) => void` prop (distinct from `nav`) to `RoadmapView` only, replacing its direct use of `nav.select` for click handling. `TopicView` receives no `onSelect` — every row it renders is already a direct navigation link (Step 4 below), so it has no click decision left to delegate.

- [ ] **Step 1: Write the failing test for the branching decision** — already covered by Task 1's `resolveNodeClick` tests; this task adds no new pure-function tests, only rewires three components to use it. Confirm no test currently asserts the old inline-ASSET-detail behavior this task removes (grep `page.test.ts`/`topicNavigation.test.ts` for `roadmap-detail` or asset-description assertions tied to click simulation) — none exist today (these files test markup/pure functions, not click simulation), so no existing test needs deleting.

- [ ] **Step 2: Implement the `handleSelect` wrapper in `ProductRoadmap.tsx`**

```ts
'use client';
import { useRouter } from 'next/navigation';
// ...
const router = useRouter();
function handleSelect(id: string) {
  const action = resolveNodeClick(tree, id, productId);
  if (action.type === 'navigate') router.push(action.href);
  else nav.select(action.id);
}
```
Pass `onSelect={handleSelect}` to `<RoadmapView>` (line 74) only, alongside its existing `tree`/`productId`/`nav` props. `<TopicView>` (line 76) keeps its existing `tree`/`productId`/`nav` props and receives no `onSelect` — see Step 4.

- [ ] **Step 3: Update `RoadmapView.tsx`**

Add `onSelect: (id: string) => void` to its props type. Change `<RoadmapFlowchart tree={tree} selectedId={nav.selectedId} onSelect={nav.select} />` to `onSelect={onSelect}`. Change the inline detail rendering (line 30) from unconditional:
```ts
{location && <TopicDetails node={location.node} productId={productId} onSelectChild={nav.select} />}
```
to CONTAINER-only (no inline rendering for an ASSET selection — including the initial default selection, which Task 3's fallback already seeds from the first ASSET):
```ts
{location && location.node.nodeType === 'CONTAINER' && (
  <TopicDetails node={location.node} productId={productId} onSelectChild={onSelect} />
)}
```

- [ ] **Step 4: Update `TopicView.tsx`**

Replace the whole `.roadmap-layout` two-column body (current lines 30-62: the topic-row list plus the inline `TopicDetails`/Previous/Next block) with a single-column list where every row is a real link, not a `nav.select` button:
```tsx
export function TopicView({
  tree,
  productId,
  nav,
}: {
  tree: ContentTreeNode[];
  productId: string;
  nav: TopicNavigation;
}) {
  const rows = topicsWithSectionLabels(tree, nav.topics);
  return (
    <ul className="topic-list" style={{ listStyle: 'none', padding: 0 }}>
      {rows.map(({ topic, sectionTitle, showSectionLabel }) => (
        <li key={topic.id}>
          {showSectionLabel && <p className="topic-section-label">{sectionTitle}</p>}
          <Link href={`/access/${productId}?topic=${topic.id}`} className="topic-row">
            {topic.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```
Every row targets an ASSET (`nav.topics` is `flattenTopics(tree)`, ASSET-only), so every row becomes a navigation link — `TopicView` has no CONTAINER rows and therefore no click decision to delegate, so it keeps no `onSelect` prop at all (removed per Product Owner correction; `ProductRoadmap`'s call to `<TopicView>` is updated to match — Step 2 above passes `onSelect` to `RoadmapView` only). `nav` stays a required prop here because `topicsWithSectionLabels(tree, nav.topics)` still needs `nav.topics`. Remove the now-unused `clampIndex` import and `TopicDetails` import from this file — both become unused once the inline detail/Previous-Next block is removed. Do not delete the `.roadmap-layout`, `.topic-nav`, or `.topic-row-selected` CSS rules in `globals.css` — they become unused by this change but removing unused CSS is out of scope for this task (note under "Remaining issues" in the completion report instead).

- [ ] **Step 5: Run the existing test suites that exercise these files**

Run: `pnpm --filter web test -- components/access`
Expected: `topicNavigation.test.ts` and `flowchartLayout.test.ts` still pass unmodified (neither tests `TopicView`/`RoadmapView`/`ProductRoadmap` directly — confirm this is still true by checking the test run's file list in the output, not just the pass count).

- [ ] **Step 6: Run `page.test.ts` again to confirm Task 3's new cases still pass with the real `ProductRoadmap`/`RoadmapView`/`TopicView` now wired through `handleSelect`**

Run: `pnpm --filter web test -- access/\[productId\]/page`

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/access/ProductRoadmap.tsx apps/web/components/access/RoadmapView.tsx apps/web/components/access/TopicView.tsx
git commit -m "feat(access): topic clicks navigate to the dedicated page; container clicks stay local"
```

---

### Task 5: Learning Progress integration — view tracking and Mark Complete

**Gate — do not start this task until `feature/learning-progress` has actually been merged into this branch, through the project's existing, previously approved branch-integration procedure (CMS-PO-013 §4).** This task is written against that merge's *result*, not against this plan's or the original `docs/superpowers/plans/2026-11-02-learning-progress.md` description of what was proposed — that plan is a planning-time reference only, and the branch may have evolved since it was written (review history, follow-up fixes). Step 1 below is a mandatory re-verification step; do not skip to Step 2 without it.

**Files:**
- Create: `apps/web/components/access/progressRequests.ts`
- Create: `apps/web/components/access/progressRequests.test.ts`
- Create: `apps/web/components/access/RecordTopicView.tsx`
- Create: `apps/web/components/access/MarkCompleteButton.tsx`
- Create: `apps/web/components/access/MarkCompleteButton.test.ts`
- Modify: `apps/web/components/access/TopicDetailView.tsx` (Task 3)

**Interfaces:**
- Produces:
  ```ts
  export function buildProgressRequest(
    kind: 'view' | 'complete',
    productId: string,
    contentItemId: string,
  ): { url: string; method: 'POST'; body: string };
  export function RecordTopicView(props: { productId: string; contentItemId: string }): null;
  export function MarkCompleteButton(props: { productId: string; contentItemId: string }): JSX.Element;
  ```
- Consumes (at runtime only, once the merge in the Gate above has landed): the real, merged `POST /access/[productId]/progress/view` and `POST /access/[productId]/progress/complete` routes — their actual request/response shapes as found in Step 1, not assumed.

- [ ] **Step 1: Re-verify the merged contract before writing any integration code**

Read the actual merged files — `apps/web/app/access/[productId]/progress/view/route.ts`, `.../progress/complete/route.ts`, and the `ContentItemProgressRepository`/`ContentItemProgress` type in `@acos/core-cms` — and confirm or correct, in this plan (editing this task before continuing), each of: the request body shape, the success response shape, the error/rejection shape, the unauthenticated behavior, and whether a read endpoint for existing completion state exists (the original Learning Progress plan specified none — `recordView`/`markComplete` only — so confirm whether that is still true post-merge; if a read endpoint was added, record that here and use it in Step 5 instead of the no-read-API fallback described there).

- [ ] **Step 2: Write the failing tests for the pure request builder**
```ts
describe('buildProgressRequest', () => {
  it('builds a POST to /access/<productId>/progress/view with {contentItemId} as the JSON body', () => { /* kind: 'view' */ });
  it('builds a POST to /access/<productId>/progress/complete with {contentItemId} as the JSON body', () => { /* kind: 'complete' */ });
});
```

- [ ] **Step 3: Run the tests, verify they fail** (module doesn't exist).

- [ ] **Step 4: Implement `buildProgressRequest`** per the verified contract from Step 1 (adjust the body/URL shape here if Step 1 found it differs from the `{ contentItemId }` shape assumed above).

- [ ] **Step 5: Implement `RecordTopicView`** — a client component (`'use client'`) that fires exactly one `view` request per distinct `(productId, contentItemId)` it is mounted with, and renders nothing:
```tsx
export function RecordTopicView({ productId, contentItemId }: { productId: string; contentItemId: string }) {
  const firedFor = useRef<string | null>(null);
  useEffect(() => {
    if (firedFor.current === contentItemId) return; // guards React 18 Strict Mode's intentional dev double-invoke, and any re-render that doesn't actually change topic
    firedFor.current = contentItemId;
    const { url, method, body } = buildProgressRequest('view', productId, contentItemId);
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  }, [productId, contentItemId]);
  return null;
}
```
The `useEffect` dependency array (`[productId, contentItemId]`) is what prevents an unrelated re-render of the page (e.g. from `MarkCompleteButton`'s own state changing) from re-firing the view request — it only re-runs when the user actually navigates to a different topic, which is the one case a new "view" event is correct, not a duplicate. The `firedFor` ref additionally prevents the double-fire React 18 Strict Mode intentionally triggers in development (mount → unmount → mount) from producing two network requests for the same mount. Client-side route prefetching (`<Link>` hover prefetch) does not execute this effect — Next.js prefetch only fetches the RSC payload, it does not mount client components — so prefetching a topic link never triggers a spurious view event for a topic the user hasn't actually opened.

- [ ] **Step 6: Implement `MarkCompleteButton`**

Client component (`'use client'`) with local `useState<'idle' | 'pending' | 'done' | 'error'>('idle')`; its click handler calls `buildProgressRequest('complete', ...)`, `fetch`s it, and sets `'done'` on an ok response or `'error'` otherwise. Button label: `'Mark complete'` (idle/error) / `'Marking complete…'` (pending, disabled) / `'Completed'` (done, disabled). Once `'done'`, the button stays disabled for the remainder of that mounted instance — it never re-sends or reverts to idle on an unrelated re-render — which is the "preserve completion state" requirement at the level this task can actually guarantee: **there is no read endpoint for prior completion state** (confirmed or corrected in Step 1), so a fresh page load of an already-completed topic starts the button at `'idle'` regardless of server state; marking it again is harmless (the merged `markComplete` upsert is idempotent per the original plan's design — reconfirm this in Step 1 too), but the UI cannot show "Completed" on load without a read API. Record this as a known limitation in the completion report, not as a silent gap — do not attempt to fetch/poll a read endpoint that Step 1 did not confirm exists.

- [ ] **Step 7: Wire both into `TopicDetailView.tsx`**

Add `<RecordTopicView productId={productId} contentItemId={topic.id} />` and `<MarkCompleteButton productId={productId} contentItemId={topic.id} />` below the `<TopicDetails>` block from Task 3. `RecordTopicView` renders nothing (`null`) — it exists only for its effect.

- [ ] **Step 8: Run the unit tests, verify they pass**

Run: `pnpm --filter web test -- components/access/progressRequests` and `pnpm --filter web test -- components/access/MarkCompleteButton`

- [ ] **Step 9: Run `page.test.ts` once more** to confirm `TopicDetailView`'s two new children don't break Task 3's markup assertions (e.g., `MarkCompleteButton`'s text `Mark complete` must not collide with any `expect(html).not.toContain(...)` assertion, and `RecordTopicView` rendering `null` must not change the static markup at all).

Run: `pnpm --filter web test -- access/\[productId\]/page`

- [ ] **Step 10: Manual verification that view-tracking does not duplicate requests** (no DOM/effect-testing library in this repo, per Global Constraints — this is not covered by an automated test): with the dev server running against the merged branch, open a topic page with the browser's Network tab open and confirm exactly one `/progress/view` POST fires per topic page load — including once under React Strict Mode in development — and that hovering a topic `<Link>` (prefetch) fires none. Fold this into Task 6's manual verification pass rather than repeating it there.

- [ ] **Step 11: Commit**

```bash
git add apps/web/components/access/progressRequests.ts apps/web/components/access/progressRequests.test.ts apps/web/components/access/RecordTopicView.tsx apps/web/components/access/MarkCompleteButton.tsx apps/web/components/access/MarkCompleteButton.test.ts apps/web/components/access/TopicDetailView.tsx
git commit -m "feat(access): wire view tracking and Mark Complete to the merged Learning Progress API"
```

---

### Task 6: Full regression pass and manual verification

**Files:** none created — verification only.

- [ ] **Step 1: Run every test file this plan touched or could affect**

Run: `pnpm --filter web test -- access` and `pnpm --filter web test -- components/access`
Record the exact pass/fail counts and file list — not a summary of "all passed."

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web exec tsc --noEmit`

- [ ] **Step 3: Manual browser verification** (no Playwright/Cypress in this repo; this is a UI change, so automated tests alone do not establish the feature works — per this project's verification standard, do this via the dev server, not by assumption):
  - Start the dev server (`pnpm --filter web exec next dev`, or this harness's `preview_start`/`run` tooling) against seeded CMS content.
  - Roadmap View: click a topic (ASSET) node → lands on the dedicated page with correct breadcrumb/title/download/Previous-Next; click a section (CONTAINER) node → still expands/selects inline, as before.
  - Topic List View: click a topic row → lands on the dedicated page; confirm no topic content renders inline below the list anymore.
  - On the dedicated page: Previous/Next navigate correctly and disable at the ends of the sequence; "← Back to course overview" returns to the overview with the default Roadmap View (no persisted selection, per CMS-PO-011(C), unchanged).
  - Type a topic URL directly into the address bar, and refresh an existing topic URL — both render the same dedicated page (proves the Server Component path, not client-only state).
  - Click a topic, then a different topic via Previous/Next, then press browser Back twice — confirm it steps back topic → topic → overview, not directly to overview (CMS-PO-013 §2a.6).
  - Resize to desktop, tablet (768px), and mobile (375px) widths: confirm both the overview and the dedicated page use the available width with no horizontal overflow, and that the topic body text does not stretch to the full width (the `.lede` measure from Task 2).
  - Keyboard and focus: Tab through the Roadmap View flowchart, the Topic List rows, and the dedicated topic page's breadcrumb/Previous/Next/back-to-overview/Mark Complete controls — confirm every one of them is reachable and operable via keyboard alone (`Enter`/`Space`), that focus order follows visual/document order, and that a visible focus outline is present throughout (none of this plan's changes remove `:focus` styling, but confirm rather than assume, since `TopicView`'s row elements change from `<button>` to `<Link>` in Task 4 and `RoadmapView`'s conditional rendering changes in the same task). After navigating to a new topic via keyboard (Previous/Next or a topic link), confirm focus lands somewhere sensible on the new page (e.g. the main heading or the breadcrumb) rather than being silently dropped to `<body>`.
  - Task 5's view-tracking duplicate-request check (Step 10 of that task) — confirm it was done; do not redo it here if already verified.

- [ ] **Step 4: If anything regressed, stop and fix before proceeding** — this task authorizes no scope beyond Tasks 1-5's own files.

---

## Self-Review

**1. Spec coverage:** §2a.1 (reuse `?topic=`) → Task 3. §2a.2/§2a.3 (overview without param / dedicated view with valid param) → Task 3. §2a.4 (exclusive server-side resolution) → Task 1 (`resolveTopicParam`) + Task 3. §2a.5 (uniform rejection, including the duplicate-parameter case added in this revision) → Task 1 + Task 3's six fallback test cases. §2a.6 (Back/Forward) → Task 4's link-based navigation (real history entries) + Task 6's manual check. §2a.7 (preserve CMS-PO-011(A)-(E) otherwise) → Task 4 keeps CONTAINER behavior unchanged and untouched CMS-PO-011(B)-(E) logic. §2a.8 (full-width, readable measure) → Task 2. Breadcrumb/Prev-Next/back-link (user's original request §2) → Task 3. CMS-PO-013 §3's authorization of **both** `progress/view` and `progress/complete` → Task 5 (revised this round to cover both, gated on the separate `feature/learning-progress` merge per CMS-PO-013 §4 and this round's correction). Accessibility (keyboard/focus) → Task 6, added this revision.

**2. Step scan:** every code step names an exact file, an exact signature, and a specific test name or command; no step says "handle edge cases" without a named case. Task 5's Step 1 ("re-verify the merged contract") is deliberately a judgment step, not a coding step — it exists because the actual contract cannot be pinned until the gated merge lands, which is a real constraint, not an unresolved decision this plan is ducking.

**3. Type consistency:** `resolveTopicParam`/`resolveNodeClick`/`getAdjacentTopicIds`/`ancestorPath` (Task 1) are used with the same names and signatures in Tasks 3-4. `TopicDetailView`'s props (Task 3) match what Task 5 adds to. `onSelect: (id: string) => void` is now threaded only from `ProductRoadmap` to `RoadmapView` (Task 4, corrected this round) — `TopicView`'s signature no longer includes it anywhere in the plan, matching its Interfaces block, its Step 2/4 prose, and its code sample. `buildProgressRequest(kind, productId, contentItemId)` (Task 5, corrected this round to a single shared builder instead of two near-duplicate ones) is the one function both `RecordTopicView` and `MarkCompleteButton` call, each with a different `kind` literal.

**4. Review Focus:** all six items (five original plus the duplicate-parameter item added this round) map to a named test — wrong-product fallback (Task 3), CONTAINER-id fallback (Task 1 + Task 3), CMS-PO-011(E) preservation (Task 6's regression run of the existing, unmodified `topicNavigation.test.ts` cases), Previous/Next boundary behavior (Task 1's `getAdjacentTopicIds` edge cases + Task 3), the entitlement-gate-before-topic-resolution ordering (Task 3's "still redirects an anonymous visitor" case), and duplicate `topic` parameters (Task 3's new test case).

**5. Proportion:** code blocks are either exact signatures/test names or short, non-mechanical decision bodies (the four Task 1 functions; `RecordTopicView`'s dedup-guard effect in Task 5, written out in full because its exact dependency array and ref-guard are the correctness-bearing decision, not something a signature alone would pin); no task transcribes a full component's JSX beyond what fixes an ambiguity the signature alone would leave open (the breadcrumb structure, the `TopicView` rewrite, and the button-state machine in `MarkCompleteButton` are each genuine decisions this plan has to pin, not restatements of something already determined).

**Revisions this round (Product Owner correction, 2026-11-05):**
1. Task 5 rewritten to cover both `progress/view` and `progress/complete` (CMS-PO-013 §3 authorizes both; the previous draft implemented only `complete`). Added an explicit gate: this task does not start until `feature/learning-progress` is merged separately, and its first step is re-verifying the actual merged contract rather than assuming the planning-time description. Added `RecordTopicView` with a `useRef`-guarded `useEffect` to prevent duplicate view requests from React re-renders or Strict-Mode double-invocation, and documented why `<Link>` prefetch cannot trigger it. Documented the real limitation on "preserving completion state" (no read endpoint exists per the original Learning Progress plan — confirm/correct in Step 1) rather than silently implying full persistence.
2. Removed the unused `onSelect` prop from `TopicView` (Task 4) and its caller in `ProductRoadmap` — `onSelect` is now passed only to `RoadmapView`, where it is actually used for CONTAINER selection.
3. Added a duplicate-`topic`-query-parameter test to Task 3 and a corresponding Review Focus item, with an explicit note on why the existing `typeof ... === 'string'` guard already handles it safely.
4. Added keyboard-navigation and focus-order verification to Task 6's manual pass.

No change to Tasks 1-3's scope, to CMS-PO-013, or to CMS-PO-011(A)-(E) was made or implied by this revision.
