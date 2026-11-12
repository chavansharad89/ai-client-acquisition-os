# Customer Roadmap UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended, see note below) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Revision (2026-11-02):** Original plan (2026-11-01) built one view — a roadmap tree + detail panel. New PO requirement adds a second, independent view over the *same* data (a flat, sequential "topic N of M" view with Previous/Next), and requires both views to share one topic-selection/navigation model. Task 1 (tree-building) is unchanged. A new Task 2 (shared navigation model) is inserted before the view components; the former Task 2 is now Task 3 (View A only); a new Task 4 adds View B; the former Task 3 is now Task 5 (CSS + a view switcher + final wiring).

**Goal:** Render `/access/[productId]`'s CMS-backed branch as **two selectable customer views over one shared `content_items` tree** — View A, a roadmap (sections → topics, each selectable, with a detail panel) and View B, a flat sequential topic list with Previous/Next and "X of Y" — with no new content model, no new query, and no change to the legacy-manifest branch.

**Architecture:** Both views read the same `ContentTreeNode[]` from Task 1 (unchanged: `listAccessibleCmsContent` → `buildContentTree`, already access-filtered and PUBLISHED-only). A new shared module (Task 2) derives one flat, ordered list of `ASSET` topics from that tree and owns the single "which topic is selected" state both views read and mutate — so switching views never loses your place and there is exactly one navigation implementation, not two. View A (Task 3) is the tree+detail layout from the original plan, now driven by the shared model instead of its own local state. View B (Task 4) is new: a flat list + Previous/Next + position, built on the same model and reusing View A's detail-panel component rather than duplicating it. Task 5 adds a small view-mode switcher, the CSS for both, and the final wiring into `page.tsx`.

**Tech Stack:** Unchanged — Next.js 14 App Router (server component page + client components), `app/globals.css` plain-CSS tokens (not Tailwind v4 — see Global Constraints), Vitest. The navigation math (new in this revision) is plain, hook-free functions, unit-tested directly — see Task 2 — which is stronger coverage than this codebase's existing precedent for CMS client components (see Global Constraints), not weaker.

**Spec:** Original pasted requirement "Customer UI Requirement — Roadmap-Style Learning Experience" (2026-11-01) + this revision's pasted requirement "Update the existing customer roadmap UI implementation plan" / View A + View B (2026-11-02), both delivered in chat, no file. Cross-checked against `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` §6/§11 and the existing, passing `apps/web/app/access/[productId]/page.test.ts` (all 7 pre-existing cases must keep passing unmodified throughout).

## Global Constraints

- Do not touch the legacy-manifest rendering path (`renderLibraryPage`, `deliverablesFor`) — it must render identically for every product not on the CMS path.
- Do not introduce a second styling system on this route. `styles/tailwind-foundation.css` (Tailwind v4) is scoped to `/cms/*` and `/(marketing-v2)/*` only; `/access/*` uses `app/globals.css`'s plain-CSS classes. Neither view imports the Tailwind v4 foundation or reuses the Tailwind-v4-styled `RoadmapSection`/`RoadmapCanvas`/`ContentInspector` components directly.
- Reuse `buildContentTree`/`locateNode`/`ContentTreeNode` from `apps/web/src/cms-admin/contentTree.ts` by import, not by copy.
- No new API route, query, or schema change, for either view. `GET` via `listAccessibleCmsContent` (list) and `/access/[productId]/download/[assetId]` (signed download redirect) are the only data operations either view performs, both already existing and already tested.
- A product's own `/access/[productId]` page only ever renders content owned by that one `productId` — unchanged, out of scope (see original plan's rationale).
- **Both views are one feature behind one toggle, not two routes.** Decision for this revision: the view choice is in-page client state (`useState<'roadmap' | 'topics'>`, no persistence, no new URL) — see "Unresolved decisions" below; this is the assumption the plan is built on, flagged for confirmation, not silently permanent.
- No `@testing-library/react` exists in `apps/web`; this plan still does not add it (Task 2's logic is tested without it — see Task 2; rendering is still verified only via `renderToStaticMarkup` + manual click-through, matching existing precedent for `RoadmapCanvas`/`RoadmapSection`/`ContentInspector`).

## Review Focus

- **A tree with nested topics (Topic under Section under Roadmap, 3+ levels)** — View B's flattened sequence must include every `ASSET` regardless of depth, in the same document order as View A's tree (pre-order, `orderIndex`-sorted at each level) — this is Task 2's `flattenTopics`, the direct answer to "how nested topics are handled in sequential navigation": depth is irrelevant to the sequence; only document order matters, and `CONTAINER` nodes are never sequence members themselves.
- **First/last topic in View B** — Previous must be inert (disabled, not merely unstyled) at index 0; Next must be inert at the last index; neither wraps around.
- **Switching from View A with a `CONTAINER` selected into View B** — the shared selection may not correspond to any entry in the flattened topic list (`currentIndex === -1`). View B must still render something coherent (falls back to displaying topic 1 of N without mutating the shared selection) rather than a blank panel or a crash.
- **A product with exactly one published topic** — "1 of 1", both Previous and Next inert simultaneously; must not divide-by-zero or render "1 of 0".
- **Zero published `ASSET` rows anywhere (only `CONTAINER`s, or truly empty)** — unchanged from the original plan: this is the existing Variant-1 fallback to the legacy manifest, decided once in Task 1, upstream of both views; neither view ever renders in this case.

---

## Task 1: Hierarchical, product-scoped tree instead of a flat asset list

*(Unchanged from the 2026-11-01 plan.)*

**Files:**
- Modify: `apps/web/app/access/[productId]/page.tsx:73-104` (replace `cmsLibraryItems`)
- Test: `apps/web/app/access/[productId]/page.test.ts`

**Interfaces:**
- Produces: `cmsLibraryTree(productId: ProductId, userId: string): Promise<ContentTreeNode[] | null>` — `null` means "render the legacy branch." Task 5 consumes this; Task 2 consumes its non-null return value.

- [ ] **Step 1: Write the failing tests** (two cases: nested container+asset renders; empty-container-only still falls back) — see original plan body for the exact test code; unchanged by this revision.
- [ ] **Step 2: Run to verify they fail.**
- [ ] **Step 3: Implement** `cmsLibraryTree` exactly as the original plan specifies (same-product filter, `ASSET`-count-based fallback check, `buildContentTree(filtered.map(toPublicContentItem))`).
- [ ] **Step 4: Run to verify they pass** (7 existing + 2 new = 9).
- [ ] **Step 5: Commit.**

---

## Task 2: Shared topic-selection and navigation model

**Files:**
- Create: `apps/web/components/access/topicNavigation.ts` (plain functions + one hook; not `.tsx` — no JSX here)
- Test: `apps/web/components/access/topicNavigation.test.ts` (new — pure-function unit tests, no React rendering needed)

**Interfaces:**
- Consumes: `ContentTreeNode` (`@/src/cms-admin/contentTree`).
- Produces:
  - `flattenTopics(tree: readonly ContentTreeNode[]): ContentTreeNode[]` — pre-order DFS, `ASSET` nodes only, document order.
  - `clampIndex(current: number, total: number): number` — resolves the "`CONTAINER` selected, no matching topic" case to `0` when `current === -1` and `total > 0`; used by both the hook and View B's render fallback so the two never disagree.
  - `useTopicNavigation(tree: readonly ContentTreeNode[], initialId: string): TopicNavigation`, where:
    ```ts
    interface TopicNavigation {
      selectedId: string;
      select: (id: string) => void;
      topics: ContentTreeNode[];      // flattenTopics(tree), memoized
      currentIndex: number;           // topics.findIndex(t => t.id === selectedId); -1 if selectedId is a CONTAINER
      total: number;                  // topics.length
      hasPrev: boolean;               // currentIndex > 0 (currentIndex === -1 treated as 0 — see clampIndex)
      hasNext: boolean;               // clampIndex(currentIndex, total) < total - 1
      goPrev: () => void;             // select(topics[clampIndex(currentIndex, total) - 1].id), no-op if !hasPrev
      goNext: () => void;             // select(topics[clampIndex(currentIndex, total) + 1].id), no-op if !hasNext
    }
    ```
  Task 3 (View A) uses only `selectedId`/`select`. Task 4 (View B) uses every field.

- [ ] **Step 1: Write the failing tests**

```ts
describe('flattenTopics', () => {
  it('collects ASSET nodes in document order regardless of nesting depth', () => {
    const tree = fakeTree([
      { id: 'section-1', nodeType: 'CONTAINER', children: [
        { id: 'topic-1', nodeType: 'ASSET' },
        { id: 'sub-section', nodeType: 'CONTAINER', children: [{ id: 'topic-2', nodeType: 'ASSET' }] },
      ] },
      { id: 'topic-3', nodeType: 'ASSET' },
    ]);
    expect(flattenTopics(tree).map((t) => t.id)).toEqual(['topic-1', 'topic-2', 'topic-3']);
  });
});

describe('clampIndex', () => {
  it('maps -1 (no match) to 0 when topics exist', () => {
    expect(clampIndex(-1, 5)).toBe(0);
  });
  it('passes a valid index through unchanged', () => {
    expect(clampIndex(2, 5)).toBe(2);
  });
});
```

(`fakeTree` is a small local test helper building minimal `ContentTreeNode`-shaped objects — not a new shared fixture, just inline in this test file, since no other suite needs it.)

- [ ] **Step 2: Run to verify they fail.**

Run: `cd apps/web && npx vitest run "components/access/topicNavigation.test.ts"`

- [ ] **Step 3: Implement `flattenTopics` and `clampIndex`**

Per the signatures above. `useTopicNavigation` wraps `useState(initialId)` + `useMemo(() => flattenTopics(tree), [tree])` and derives the rest per the field comments above — no new logic beyond what's already specified in the interface block.

- [ ] **Step 4: Run to verify they pass.**

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/access/topicNavigation.ts apps/web/components/access/topicNavigation.test.ts
git commit -m "feat(access): add shared topic flattening + navigation model for roadmap/topic views"
```

---

## Task 3: View A — Roadmap tree + detail panel

*(Same component shape as the original plan's Task 2, retargeted onto the shared model.)*

**Files:**
- Create: `apps/web/components/access/RoadmapView.tsx` (`'use client'`)
- Create: `apps/web/components/access/TopicDetails.tsx` (`'use client'`) — **extracted out so Task 4 can reuse it unchanged**, rather than each view rendering its own copy of "title + description + download link / child list."

**Interfaces:**
- Consumes: `ContentTreeNode[]` (Task 1), `TopicNavigation` (Task 2), `locateNode` (`@/src/cms-admin/contentTree`), `assetIcon` (`@/src/cms-admin/assetIcon`).
- Produces: `RoadmapView({ tree, productId, nav }: { tree: ContentTreeNode[]; productId: string; nav: TopicNavigation })`; `TopicDetails({ node, productId, onSelectChild }: { node: ContentTreeNode; productId: string; onSelectChild: (id: string) => void })` — consumed by both Task 3 and Task 4.

- [ ] **Step 1: Implement `TopicDetails`** — identical content to the original plan's Task 2 Step 2 (`ASSET`: title/description/download link via the existing signed route; `CONTAINER`: title/description/children list calling `onSelectChild`).
- [ ] **Step 2: Implement the recursive `TreeRow`** — identical to the original plan's Task 2 Step 1, now calling `nav.select` instead of a locally-owned setter.
- [ ] **Step 3: Implement `RoadmapView`** — two-column layout (`roadmap-layout`): left = `tree.map(node => <TreeRow .../>)` using `nav.selectedId`/`nav.select`; right = `locateNode(tree, nav.selectedId)` fed into `<TopicDetails node={...} productId={productId} onSelectChild={nav.select} />`. No local `useState` here anymore — selection lives entirely in `nav` (Task 2).
- [ ] **Step 4: Manual verification** — same bar as the original plan (no automated interaction test exists for any CMS client component in this codebase; a short description or screenshot of expand/select/download-link-resolves is the expected evidence).
- [ ] **Step 5: Commit**

```bash
git add apps/web/components/access/RoadmapView.tsx apps/web/components/access/TopicDetails.tsx
git commit -m "feat(access): add roadmap tree view (View A), built on the shared navigation model"
```

---

## Task 4: View B — Sequential topic list with Previous/Next

**Files:**
- Create: `apps/web/components/access/TopicView.tsx` (`'use client'`)

**Interfaces:**
- Consumes: `TopicNavigation` (Task 2, all fields), `TopicDetails` (Task 3, reused unchanged), `productId: string`.
- Produces: `TopicView({ productId, nav }: { productId: string; nav: TopicNavigation })`.

- [ ] **Step 1: Write the failing test** (extends `topicNavigation.test.ts` from Task 2, since the behavior under test is navigation-state transitions, not JSX rendering):

```ts
describe('useTopicNavigation-equivalent index math, exercised directly', () => {
  it('at the first topic, hasPrev is false and hasNext is true when more than one topic exists', () => {
    // construct nav state directly from flattenTopics(tree) + currentIndex = 0, assert hasPrev/hasNext per the field formulas in Task 2's interface block
  });
  it('at the last topic, hasNext is false', () => { /* currentIndex = total - 1 */ });
  it('with exactly one topic, both hasPrev and hasNext are false, and total is 1', () => { /* total = 1, currentIndex = 0 */ });
});
```

These assert the *formulas* from Task 2 directly (no component render needed), which is what actually needs proving — View B's JSX only reads `nav.hasPrev`/`nav.hasNext`/`nav.currentIndex`/`nav.total` and renders them, matching the existing (untested-at-the-component-level) precedent for presentational JSX in this codebase, while the logic they display gets real coverage.

- [ ] **Step 2: Run to verify they fail** (they should already pass if Task 2 is correct — if so, this step confirms Task 2's formulas via a second, independent set of assertions framed around View B's actual needs; keep them as regression coverage, not fabricated failure).
- [ ] **Step 3: Implement `TopicView`**
  - A flat, non-expandable list of `nav.topics`, each row calling `nav.select(topic.id)` on click, highlighted when `topic.id === nav.selectedId`. Each topic's nearest-ancestor `CONTAINER` title renders once as a plain, non-interactive label above the first topic under it (reuses data already in `nav.topics`' source tree — requires passing the ancestor title through, e.g. by having `flattenTopics` return `{ topic, sectionTitle }` pairs, OR computing section boundaries in this component from `tree` directly via `locateNode`. **Resolved choice: compute section boundaries in `TopicView` from `tree` via `locateNode(tree, topic.id).parent?.title`, not by changing `flattenTopics`'s return shape** — keeps Task 2's interface simple and reusable by Task 3 unchanged.)
  - Display index: `const displayIndex = clampIndex(nav.currentIndex, nav.total);` — never read `nav.currentIndex` directly for rendering (Review Focus: `CONTAINER`-selected-on-arrival case).
  - Position label: `{displayIndex + 1} of {nav.total}`.
  - Previous/Next buttons: `disabled={!nav.hasPrev}` / `disabled={!nav.hasNext}`, `onClick={nav.goPrev}` / `onClick={nav.goNext}` — disabled via the `disabled` attribute (dimmed, non-clickable), not hidden, matching the existing `disabled={busy}` convention already used in `ContentInspector.tsx`.
  - Detail panel: `<TopicDetails node={nav.topics[displayIndex]} productId={productId} onSelectChild={nav.select} />` — the exact same component Task 3 uses, unchanged.
- [ ] **Step 4: Run tests.**
- [ ] **Step 5: Manual verification** — click through first topic (Previous inert), middle, last topic (Next inert), confirm position label matches the real topic count for a seeded multi-section tree.
- [ ] **Step 6: Commit**

```bash
git add apps/web/components/access/TopicView.tsx apps/web/components/access/topicNavigation.test.ts
git commit -m "feat(access): add sequential topic view (View B) with Previous/Next, built on the shared navigation model"
```

---

## Task 5: View switcher, CSS, and final page wiring

*(Was Task 3 in the original plan; now also owns the switcher between View A and View B.)*

**Files:**
- Modify: `apps/web/app/globals.css` (append; do not edit existing rules)
- Modify: `apps/web/app/access/[productId]/page.tsx` (render the switcher branch instead of `renderLibraryPage` on the CMS branch)
- Create: `apps/web/components/access/ProductRoadmap.tsx` (`'use client'`) — the actual thing `page.tsx` renders; owns the single `useTopicNavigation` instance and the view-mode toggle, so both views share one navigation state (switching views preserves position — the point of Task 2).

**Interfaces:**
- Consumes: `cmsLibraryTree` (Task 1), `useTopicNavigation` (Task 2), `RoadmapView` (Task 3), `TopicView` (Task 4).
- Produces: `ProductRoadmap({ tree, productId }: { tree: ContentTreeNode[]; productId: string })`, rendered by `page.tsx` in place of `renderLibraryPage`'s list on the CMS branch only.

- [ ] **Step 1: Add CSS classes** — everything from the original plan's Task 3 Step 1 (`.roadmap-layout`, `.roadmap-tree`, `.roadmap-node`, `.roadmap-node-selected`, `.roadmap-node-toggle`, `.roadmap-detail`, `.roadmap-detail-empty`), **plus** for View B and the switcher: `.topic-list`, `.topic-row`, `.topic-row-selected`, `.topic-nav` (Previous/Next + position row), `.view-switcher`. Same file, same flat-kebab-case convention, same existing color/spacing tokens — no new variables. Responsive: both `.roadmap-layout` and `.topic-list` + detail collapse to a single stacked column under whatever breakpoint `.pricing`/`.sections` already use in this file; `.topic-nav`'s Previous/Next become full-width at that breakpoint for thumb reach.
- [ ] **Step 2: Implement `ProductRoadmap`** — `const [view, setView] = useState<'roadmap' | 'topics'>('roadmap'); const initialId = /* first ASSET in document order, same DFS as the original plan's Review Focus item 2 */; const nav = useTopicNavigation(tree, initialId);` then a small `.view-switcher` (two buttons/tabs) toggling `view`, and `view === 'roadmap' ? <RoadmapView tree={tree} productId={productId} nav={nav} /> : <TopicView productId={productId} nav={nav} />`. Reuses the page-shell markup (`<Link>`/`<h1>`/unlocked-status) the same way the original plan's Task 3 Step 2 specified, so `renderLibraryPage` stays untouched.
- [ ] **Step 3: Wire `page.tsx`** — `const cmsTree = await cmsLibraryTree(...); if (cmsTree) return <ProductRoadmap tree={cmsTree} productId={product.id} />;`, otherwise unchanged (`renderLibraryPage(displayName, legacyItems)`).
- [ ] **Step 4: Run the full existing + new page/unit tests.**

Run: `cd apps/web && npx vitest run "app/access/[productId]/page.test.ts" "components/access/topicNavigation.test.ts"`
Expected: 9 (page) + however many Task 2/4 added, all PASS.

- [ ] **Step 5: Manual verification** — load `/access/ai_income_99` as a seeded Plus customer with a multi-section CMS tree, toggle View A ↔ View B, confirm the selected topic is preserved across the toggle, confirm Previous/Next and position in View B, confirm mobile layout (resize/emulate) for both views.
- [ ] **Step 6: Commit**

```bash
git add apps/web/app/globals.css apps/web/app/access/[productId]/page.tsx apps/web/components/access/ProductRoadmap.tsx
git commit -m "feat(access): add roadmap/topic view switcher and wire the shared model into the product page"
```

---

## Additional PO clarification (2026-11-02, mid-implementation #2): Roadmap View visual redesign — flowchart, not sidebar tree

The original "hierarchical visualization" requirement (item 1 of the first PO requirement) was interpreted as a collapsible sidebar tree. The PO clarified, with a roadmap.sh screenshot, that this was always meant literally: a spatial flowchart — a central vertical **spine** of top-level topics in sequence, each with **satellite boxes** branching left/right via dotted connector lines, some satellites themselves grouped multi-item boxes (e.g. roadmap.sh's "Core LLM Elements" box listing seven items). Chosen approach (PO confirmed "Full flowchart redesign" over a lighter boxed-card restyle of the existing tree):

- **No new dependency.** Connector lines use the same technique the existing admin tree already uses for its indent guide (`RoadmapSection.tsx`'s absolutely-positioned `border-left` span) — plain CSS, absolutely-positioned dotted borders — not a graph-layout library (React Flow, etc.), which would be new infrastructure for a single view.
- **Mapping from `ContentTreeNode`:** depth-0 nodes are the spine, in `orderIndex` order. Each spine node's direct children are partitioned into satellite boxes: a `CONTAINER` child with its own children becomes one grouped box listing those grandchildren as rows (roadmap.sh's "Core LLM Elements" shape); an `ASSET` child becomes its own single box. Children alternate left/right by index — no PO guidance on a specific placement rule, so alternation is this plan's own choice, flagged as a ruling once made.
- **Depth beyond spine → satellite → group-row (3 levels):** roadmap.sh's own reference doesn't nest further than this either. A fourth level (grandchild of a grouped box's row) is out of scope for the spatial layout — it renders as a nested indented list inside that row, same technique the admin tree already uses, rather than inventing further spatial branching. Flagged as a ruling.
- **Selection/interaction model is unchanged** — still the same shared `TopicNavigation` from Task 2; every box (spine or satellite) calls `nav.select(node.id)` and gets `roadmap-node-selected` styling, satisfying CMS-PO-011(E)'s "every node interactive, clear highlight" unchanged from before. `TopicDetails` is reused unchanged.
- **Responsive:** the left-spine-right 3-column spatial layout only makes sense above a reasonably wide viewport; below the existing 860px breakpoint it collapses to a single stacked column (spine, then each spine node's satellites immediately indented beneath it) — same breakpoint convention as the rest of this plan's CSS, not a new one.

## Additional PO clarification (2026-11-02, mid-implementation): every roadmap node is interactive

Received during implementation. Does not change the approved shared navigation architecture or the `content_items` data model — it tightens how `RoadmapView` must use what Task 3 already built, and is recorded in `requirement/CMS_PO_011_CUSTOMER_ROADMAP_UI_PO_DECISIONS.md` §8 for traceability.

Status against each point, checked against the actual implementation:

1. **Clicking a container selects it, shows its details, exposes children** — already true: `TreeRow`'s `onClick` fires `nav.select(node.id)` for every node regardless of `nodeType`, and `TopicDetails` branches on `nodeType !== 'ASSET'` to render the container's description + its children as clickable rows. No change needed.
2. **Clicking an asset shows TopicDetails + download** — already true (unchanged from the original Task 3 design).
3. **Clear visual highlight on the selected node** — already true (`roadmap-node-selected`), but only visible if the node is actually rendered — see point 4.
4. **Nested navigation at arbitrary depth** — this is where the review's "deep selection hidden behind a collapsed ancestor" finding (see below) stops being just a polish bug and becomes a direct violation of this requirement: a selected node 3+ levels deep must be visible, not merely selected-but-hidden. Fixed as part of this same pass: `TreeRow`'s expansion is no longer purely local state — a node auto-expands whenever it is an ancestor of the current selection (`ancestorIds(tree, selectedId)`), in addition to its existing manual-toggle/default-depth behavior.
5. **Switching views preserves the selected topic "wherever possible"** — refined: when the shared selection is a `CONTAINER` (not representable in Topic View's flat topic list) and the customer switches to Topic View, it now resolves to the *first topic nested under that container* (`firstDescendantTopicId`), not an arbitrary global first topic — a closer reading of "wherever possible" than the original plan's flat fallback-to-index-0. Falls back to the global first topic only if the selected container has no topic descendants at all (e.g., an empty section).
6. **Containers are never decorative/dead-end** — satisfied by point 1; `TopicDetails` always gives a container a next action (its children, clickable).

## Decided (CMS-PO-011, approved 2026-11-02)

The four items below were flagged as open in the previous revision and are now resolved — see `requirement/CMS_PO_011_CUSTOMER_ROADMAP_UI_PO_DECISIONS.md` for the full record and traceability note:

1. **View routing (CMS-PO-011(A))** — one page, in-page toggle (`useState<'roadmap'|'topics'>`), no new route/URL.
2. **Default view (CMS-PO-011(B))** — Roadmap View (A), same for every plan.
3. **View-choice persistence (CMS-PO-011(C))** — none; resets to the default every page load.
4. **Topic View section labels (CMS-PO-011(D))** — a small, non-interactive label naming each topic's nearest-ancestor section, not a fully flat list.

Task 5 below implements all four as the plan already specified them (no change to the task steps — the plan's working assumptions and the approved decisions are identical). Everything else in the plan body (nested-topic flattening order, Previous/Next disabling mechanism, the `CONTAINER`-selected-on-view-switch fallback, position-label edge cases) was already resolved design, not open, and is unaffected by this approval.

## Self-review notes (per the writing-plans skill)

1. **Spec coverage** — View A requirements (hierarchy, sections/topics/nesting, selectable nodes, detail section, downloadable resources) → Tasks 1 & 3, unchanged from the original plan. View B requirements (structured list, dedicated details on select, Previous/Next, position "X of Y", first/last disabling) → Tasks 2 & 4. Shared requirements (same data, no duplication, ordering/nesting preserved, Plus/Pro/Max preserved, existing download route, responsive) → enforced by construction: both views consume the one `ContentTreeNode[]` from Task 1 and the one `TopicNavigation` from Task 2; Plus/Pro/Max and the download route are untouched, upstream of both views (Global Constraints).
2. **Step scan** — every implementation step names an exact file, signature, or formula already given in an Interfaces block; no step says "handle appropriately" without a resolution stated above it.
3. **Type consistency** — `ContentTreeNode` (Task 1) and `TopicNavigation` (Task 2) are the only two shared types; Tasks 3 and 4 both consume them by the same names and shapes, and both consume the same `TopicDetails` component rather than each defining their own.
4. **Review Focus** — five entries above, each naming a concrete input (nested depth, first/last index, view-switch-mid-container-selection, single-topic product, zero-asset product) with the behavior this plan commits to, not a TBD.
5. **Proportion** — five tasks total (one unchanged, one new shared-logic task, two view tasks, one integration task); the shared-model task (2) is the only genuinely new piece of logic in this revision — both views are otherwise thin rendering over it.
