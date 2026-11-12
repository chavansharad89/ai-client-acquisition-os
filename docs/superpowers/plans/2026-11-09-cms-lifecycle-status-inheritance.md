# CMS Lifecycle Status Inheritance (CMS-PO-015) — Implementation Plan

> **Status: the technical choices this document originally presented as options are now DECIDED.** CMS-PO-015 §9.1 records TD-001 (enforcement point: `customerContentService.ts`) and Decision 2 (ancestor resolution: Option 4B, the recursive CTE) as approved (chat, 2026-11-09). Implementation against these decisions was separately authorized and has been reported as completed, outside this document. This plan is retained as the architecture/trade-off record that led to those decisions; it is still not itself a release or security-review authorization — see CMS-PO-015 §6/§9.2/§11 for what remains open.
>
> **Requirement B (CMS-PO-014) is unaffected and out of scope.** This plan does not expand CMS-PO-014 in any way.

**Goal:** every customer-facing CMS read path exposes an item only when its *effective status* (CMS-PO-015 §4: the item's own stored status is `PUBLISHED`, **and** every ancestor up to the root is also stored `PUBLISHED`) is `PUBLISHED` — without ever physically changing any row's own stored status as a side effect.

---

## 1. Architecture mapping — current state

```
content_items (migration 0062)
  id, owning_product_id, parent_id, node_type, status, ...
  status ∈ {DRAFT, PUBLISHED, ARCHIVED}, single-row, no cascade (CMS-PO-015 §2)

Admin write path (unaffected by this plan):
  contentService.ts: createContainer / createAsset / setLifecycleStatus / archiveContentItem
    → contentItemRepository.ts: create() / setStatus()   [single-row UPDATE, confirmed]

Customer read path (the five inventoried paths, all converging on two functions):
  customerContentService.ts:
    listPublishedContentForPlans(deps, permittedProductIds)
      → contentItems.findAllByOwningProduct(productId)  [fetches EVERY status, every depth]
      → .filter(item => item.status === 'PUBLISHED')    [← only enforcement point today; own-status only]
    getPublishedContentItemForPlans(deps, id, permittedProductIds)
      → contentItems.findById(id)                        [fetches ONE row]
      → checks item.status === 'PUBLISHED' && permittedProductIds.has(item.owningProductId)  [← own-status only]

  Five call sites (apps/web), all composing one of the two functions above via
  apps/web/src/server/cmsContentService.ts's listAccessibleCmsContent / getAccessibleCmsContentItem:
    1. apps/web/app/access/[productId]/page.tsx              (list)
    2. apps/web/app/access/[productId]/download/[assetId]/route.ts   (single-item)
    3. apps/web/app/api/cms/content/route.ts                  (list)
    4. apps/web/app/api/cms/content/[id]/route.ts             (single-item)
    5. apps/web/app/api/cms/content/[id]/download/route.ts    (single-item)

  apps/web/src/cms-admin/contentTree.ts: buildContentTree(items)
    → builds the tree ONLY from whatever `items` it's given (already filtered by #1/#3's
      call to listPublishedContentForPlans). An item whose parent was filtered out of
      `items` has no resolvable parent in buildContentTree's own id map, so it is treated
      as a root (contentTree.ts:26-31) — this is buildContentTree's own correct, documented
      behavior for genuinely malformed data; the defect is entirely in what `items` contains
      by the time it gets here, not in this function.
```

**Key architectural fact driving the recommendation below:** all five customer-facing paths already converge on exactly two functions in one file (`customerContentService.ts`). There is no second, independent implementation of "what is published" anywhere in `apps/web` — every route composes one of these two functions (confirmed by direct call-site search, CMS-PO-015 §2).

## 2. Affected services and read paths

| Layer | File | Role | Change needed? |
|---|---|---|---|
| DB schema/migrations | `packages/db/prisma/migrations/0062.../migration.sql` | Defines `content_items`, its triggers, its indexes | **No**, under the recommended (computed, not stored) approach. Only if a future, separately-decided caching approach stored effective status. |
| Repository | `packages/core-cms/src/contentItemRepository.ts` | `findById`, `findChildren`, `findRootsByOwningProduct`, `findAllByOwningProduct`, `setStatus`, etc. | **Possibly** — only if the chosen ancestor-resolution mechanism needs a new method (e.g. `findAncestorChain`/`findAncestorStatuses`). Not needed if ancestor resolution for single-item reads uses existing `findById` in a loop. See §4. |
| Canonical access computation | `packages/core-cms/src/customerContentService.ts` | `listPublishedContentForPlans`, `getPublishedContentItemForPlans` — **the single recommended enforcement point**, since both already sit upstream of all five paths | **Yes** — this is where effective-status computation belongs, per §3. |
| App-layer glue | `apps/web/src/server/cmsContentService.ts` | `listAccessibleCmsContent`, `getAccessibleCmsContentItem` — composes entitlement (`permittedContentPlans`) with the two functions above | No change expected — it already calls through to the two functions that would carry the new logic; it does not reimplement any status check itself. |
| Tree builder | `apps/web/src/cms-admin/contentTree.ts` | `buildContentTree` | **No change** under the recommended approach — if `listPublishedContentForPlans` only ever returns effectively-published items, `buildContentTree` never receives an orphan caused by ancestor-status exclusion in the first place, so its existing orphan-as-root behavior (which must remain, for genuinely malformed/dangling data) is never triggered by this scenario again. |
| Route handlers | The five files in §1's inventory | Call the functions above | No change expected — they already delegate entirely to the canonical functions; they contain no status logic of their own (confirmed by reading each). |

## 3. Recommended enforcement point

**Recommended: `packages/core-cms/src/customerContentService.ts`'s two existing functions**, because:
- Every one of the five inventoried paths already converges there — a single enforcement point, not five.
- No new call site needs to be touched; the fix is contained entirely within the function this file's own comments already call "the ONLY access computation for CMS content" (mirrored at the app layer in `cmsContentService.ts`'s own "CRITICAL ACCESS RULE" comment).
- It naturally and correctly resolves the orphan-promotion consequence noted in CMS-PO-015 §8.3 as a side effect, without touching `buildContentTree` at all.

**Alternative considered and rejected as insufficient on its own: enforcing only at the tree-building layer (`apps/web/src/cms-admin/contentTree.ts` or the page/component layer).** Rejected because three of the five inventoried paths (`#2`, `#4`, `#5` — the single-item/download paths) never call `buildContentTree` at all; a tree-level-only fix would leave a customer able to retrieve or download a specific item directly by id even while its ancestor is archived, which violates CMS-PO-015 LI-003's explicit enforcement-scope requirement ("direct content-item retrieval... asset retrieval... download authorization"). This alternative is recorded for completeness, not as a live option.

**Approved as TD-001 (CMS-PO-015 §9.1, chat, 2026-11-09).** This section's conclusion is no longer only a recommendation.

## 4. The open technical choice: ancestor resolution for single-item reads

For the two list paths (#1, #3), `findAllByOwningProduct` already fetches **every** row for the product, any status, any depth, in one query — so computing each item's ancestor chain is a free, in-memory walk over data already fetched. No new query, no new repository method needed for these two paths.

For the three single-item paths (#2, #4, #5), `getPublishedContentItemForPlans` fetches exactly **one** row via `findById`. Resolving that item's full ancestor chain requires one of:

- **Option 4A — Sequential `findById` calls up the chain.** Walk `item.parentId → findById → .parentId → findById → ...` until reaching a null `parentId` or a non-`PUBLISHED` ancestor (short-circuit on the first non-`PUBLISHED` ancestor found, fail-closed). *Trade-off:* zero new repository surface, but **each step of the walk is its own database round trip**, added on top of the single round trip this path makes today. Depth is believed shallow (the existing `apps/web/src/cms-admin/contentTree.ts:78-86` depth-label convention caps friendly names at `Roadmap`/`Section`/`Topic`/`Lesson`, suggesting a typical depth of 2-4), but this is not empirically measured against real content, and "believed shallow" is not a substitute for a measurement.
- **Option 4B — A new repository method performing one recursive query.** E.g. `findAncestorStatuses(id): Promise<readonly ContentLifecycleStatus[]>` implemented as a single `WITH RECURSIVE` CTE in the real Postgres repository (with a straightforward loop-based equivalent in the fake). *Trade-off:* one round trip regardless of depth, but adds new repository surface (interface + two implementations + its own tests) that doesn't exist today.

**Decided: Option 4B is approved (CMS-PO-015 §9.1, "Decision 2," chat, 2026-11-09).** The performance characteristics below remain accurate context for why; they no longer gate the choice itself.

**Performance characteristics, stated precisely (not "no worse than today"):**
- Under Option 4A, **every** ancestor-chain resolution adds at least one additional database round trip beyond today's single `findById`, and the common case — a `PUBLISHED` item under an all-`PUBLISHED` chain, which is expected to be the *typical*, not the exceptional, case — is also the case that requires walking the **full** chain to confirm, since there is no ancestor failure to short-circuit on. This is strictly more database round trips than today for that common case, not "no worse."
- **Short-circuiting on the first non-`PUBLISHED` ancestor only reduces round trips for the case where the chain actually fails** (an ancestor is `DRAFT`/`ARCHIVED`) — it stops the walk early in that case, but it does nothing to reduce the cost of the common, all-`PUBLISHED`-chain case, which must still walk to the root every time.
- **Total added latency is a function of two things neither of which is known yet:** actual hierarchy depth in real content, and actual database round-trip time in whatever environment this runs in (this application has not been deployed, per `docs/DEPLOYMENT.md` — there is no production or staging latency figure to reason from). Depth × round-trip time is the right mental model, but both factors are currently estimates, not measurements.
- **This performance impact must be measured against realistic content and a realistic environment before Option 4A or 4B is selected** — not reasoned about in the abstract, and not decided by this document.

## 4a. Concurrency and consistent reads — resolved for the single-item path by Decision 2

With Option 4B decided (§3/§4 above), this question is answered for the single-item resolution path, not merely analyzed: a single recursive SQL statement is evaluated by Postgres against one snapshot regardless of isolation level, so the item and its complete ancestor chain are never resolved from a mixture of pre-change and post-change state — no separate transaction-isolation-level decision was needed, and none was made. This was recorded as part of Decision 2 itself (CMS-PO-015 §9.1: "the initial item lookup and the ancestor traversal share the same statement snapshot").

What this section originally analyzed, kept for reference:
- The concern (a parent/ancestor status changing mid-resolution) is real under Option 4A's multiple sequential queries — it is why Option 4A was rejected as insufficient on its own for this requirement, not merely less efficient.
- Failure handling if resolution cannot complete: fail-closed, per CMS-PO-015 §6 — unchanged by this resolution.
- A test exercising a concurrent lifecycle-status change during an in-flight read remains a reasonable addition to §5's test strategy, though the implementation report supplied separately should be checked for whether one already exists before assuming it's still missing.

## 5. Test strategy

All of the following are **new test cases to be written when implementation is authorized** — none exist today (confirmed: grepped all `*.test.ts` under `packages/core-cms` and `apps/web` for ARCHIVED + parent/child/descendant combinations; zero hits).

**Core effective-status logic** (wherever Option 4A/4B places it — `customerContentService.test.ts` and/or `contentItemRepository.test.ts`):
- Root `PUBLISHED` → child `PUBLISHED` → effective `PUBLISHED` (baseline, must not regress).
- Root `ARCHIVED` → child `PUBLISHED` → child's effective status is hidden (LI-001, direct ancestor).
- Root `PUBLISHED` → section `DRAFT` → topic `PUBLISHED` → topic's effective status is hidden (LI-001, **non-immediate** ancestor — the case most likely to be missed by an implementation that only checks the direct parent).
- Root `PUBLISHED` → section `PUBLISHED` → topic `DRAFT` → hidden (ordinary own-status case, must still work unchanged).
- Mixed siblings: one child `PUBLISHED` under an `ARCHIVED` parent, another child `PUBLISHED` under a sibling `PUBLISHED` parent → only the second is effectively published (proves the rule is per-chain, not per-product-wide).
- **Restoration (LI-002):** parent `ARCHIVED` → child stored `PUBLISHED` throughout → parent restored to `PUBLISHED` → child's effective status becomes `PUBLISHED` again (no manual action needed on the child, since nothing was ever changed on it).
- **Restoration, independent descendant change (LI-002):** parent `ARCHIVED` → child manually set to `DRAFT` while parent is archived → parent restored to `PUBLISHED` → child remains hidden (its own status must independently be `PUBLISHED`).
- Root-level item (no parent): governed by its own status alone — no regression for the common, unnested case.
- Depth ≥ 3 ancestor chain with the failing ancestor at the very top: proves the walk doesn't stop at the immediate parent only.
- A missing/unreadable ancestor row (defensive case — should not occur given the `ON DELETE RESTRICT` FK, but must be tested as a fail-closed case per CMS-PO-015 §6): item treated as not effectively published.
- **Concurrent lifecycle-status change during an in-flight ancestor-chain read** (§4a): a test exercising a parent/ancestor status change that occurs while a single-item read is mid-resolution, asserting the read does not produce an access decision based on a mixture of pre- and post-change state. The specific test mechanics depend entirely on whichever consistent-read approach §4a's open design question resolves to — not specified here, since there is no chosen mechanism yet to write a test against.

**Per-read-path integration tests** (one per inventoried path, reusing each file's existing test conventions):
1. `apps/web/app/access/[productId]/page.test.ts` — a `PUBLISHED` topic under an `ARCHIVED` section never appears in the rendered tree/roadmap, for a Plus product with a CMS tree.
2. `apps/web/app/access/[productId]/download/[assetId]/route.test.ts` — a direct download request for a `PUBLISHED` asset under an `ARCHIVED`/`DRAFT` container 404s exactly like an unknown/unpublished asset (same no-existence-leak outcome as today's existing cases in this file).
3. `apps/web/app/api/cms/content/route.test.ts` (if present; create alongside if not) — list response excludes the effectively-hidden item.
4. `apps/web/app/api/cms/content/[id]/route.test.ts` — direct retrieval of an effectively-hidden item returns the same "not found" shape as an unknown id.
5. `apps/web/app/api/cms/content/[id]/download/route.test.ts` — same 404-parity requirement as #2.

**Regression coverage — Plus, Pro, Max, legacy fallback:**
- Re-run the full existing `access` suite (currently 108 tests across 8 files, including the CMS-PO-013/CMS-PO-014 cases) and confirm zero regressions — every existing all-`PUBLISHED`-chain test must continue to pass unmodified, since this change only *adds* an exclusion condition, never relaxes one.
- Explicitly add one Pro (`ai_freelancing_499`) and one Max-path-reachable-equivalent (Max's own route is pre-existing-unreachable via `/access/[productId]` per the prior session's finding — exercise the rule instead via `GET /api/cms/content`, which is not gated by the ladder-based `canAccessProduct` check) case each, so this isn't verified on Plus alone.
- Legacy (`deliverables.ts` manifest) fallback path: confirm it remains completely untouched and unreachable by this change — it has no `content_items` concept at all, so no test is needed beyond confirming the existing fallback tests still pass unmodified.
- CMS-PO-014's Learning Path Selection suite (`page.test.ts`'s "Learning Path Selection" describe block, 29 tests) must continue to pass unmodified — this plan does not touch any file that block depends on, but the regression run must prove that, not assume it.
- **Learning Progress API, if merged before this is implemented** (CMS-PO-015 §5/§8): per LI-003's automatic-scope principle, a merged route is automatically covered — and must be added to this test strategy's per-path coverage (§5 above) the same way the five currently-inventoried paths are, with no new Product Owner decision needed — whenever it meets **either** of these conditions:
  - it **exposes CMS content** (returns, lists, or renders content-item data to the customer), **or**
  - it **grants access to CMS content** (e.g. issues a download authorization or any other means of reaching the underlying asset), even if it does not itself return the content body.
  A route that does **neither** — one that only records or updates progress state without exposing content or granting access — is not automatically in scope under this plan and is assessed separately against its actual, merged behavior, per the decision record (CMS-PO-015 §5).

## 6. Database performance and query-efficiency considerations

- **List paths (#1, #3):** no additional query cost — `findAllByOwningProduct` already fetches the full per-product set today; the ancestor walk becomes a free in-memory operation over data already in hand.
- **Single-item paths (#2, #4, #5):** see §4's Option 4A vs. 4B trade-off. No benchmark exists yet; one should be run against realistic (not synthetic) content depth before committing to either option, if depth can plausibly exceed a small, fixed bound.
- **Indexes:** `content_items_parent_id_idx` (migration 0062) already indexes `parent_id`, which is exactly what either Option 4A's repeated `findById`-by-chain or Option 4B's recursive CTE would traverse — no new index is anticipated to be required, but this should be confirmed against an actual query plan (`EXPLAIN`) once an option is chosen, not assumed.
- No write-path performance concern exists: `setStatus` remains single-row regardless of which read-side option is chosen (CMS-PO-015 explicitly forbids introducing a physical cascade).

## 7. Backward compatibility and failure handling

- **No stored data changes** under the recommended approach — purely a read-time computation change. Existing rows, their statuses, and their relationships are untouched.
- **Customer-visible behavior changes for already-misconfigured content** (CMS-PO-015 §7): any content currently in the "visible descendant under an archived/draft ancestor" state will newly become hidden once this ships. This is correct, intended behavior per LI-001 — but should be checked against real (eventually staged) content before enabling, not assumed harmless.
- **Fail-closed on any resolution failure** (CMS-PO-015 §6): if an ancestor lookup fails for any reason (missing row, query error), the item must be treated as not effectively published — never fail-open. This must be an explicit test case (§5), not an incidental behavior.
- **No existing-customer entitlement impact**: this rule operates entirely *within* already-permitted content (per already-approved `permittedContentPlans`); it narrows what's shown within that permitted set, never who is permitted.

## 8. Task dependencies and verification gates

```
CMS-PO-015 (behavioral decision, APPROVED)
        │
        ▼
 [GATE 1 — SATISFIED] TD-001 + Decision 2 recorded as an amendment to CMS-PO-015 §9.1
        ▼
 [GATE 2 — SATISFIED] Explicit, separate Product Owner authorization to implement (given)
        │
        ▼
 Task A: Core effective-status logic in customerContentService.ts  — REPORTED COMPLETE
        ▼
 Task B: Per-path integration tests (5 paths)                       — REPORTED COMPLETE
        ▼
 Task C: Full regression run + typecheck                            — REPORTED COMPLETE
        │
        ▼
 [GATE 3 — SATISFIED] Independent security review (CMS-PO-015 §6 — mandatory, this is access-control-adjacent)
        │   — performed across three rounds, all APPROVED WITH FINDINGS (no Critical/High/Medium);
        │     every Low finding (F-01, F-02, R-1, R-2) remediated and independently confirmed closed —
        │     tracked in CMS-PO-015 §6; this plan does not itself re-verify that review's claims
        ▼
 [GATE 4 — SATISFIED] Explicit Product Owner release authorization
        │   — granted via chat instruction, 2026-11-10 (CMS-PO-015 §11); covers release of
        │     CMS-PO-015 only and does not itself authorize staging, committing, pushing,
        │     deployment, any CMS_ACCESS_CUTOVER_ENABLED change, or customer cutover —
        │     each remains its own, separately controlled action
        ▼
 Enable for real customers (also gated on the unrelated, already-known content-hygiene
 dependency from CMS-PO-014 §9.1 and CMS-PO-015 §8.3, if sharing a rollout, and on the
 separate repository/deployment/cutover authorizations above)
```

Gates 1, 2, 3, and 4 are all satisfied, per CMS-PO-015 §9.1/§6/§11. Tasks A–C are reported complete in the implementation report supplied separately — this plan does not itself re-verify that report against the code, nor does it itself re-verify the security review beyond citing its recorded, closed status in CMS-PO-015 §6, nor does it itself re-verify Gate 4 beyond citing its recorded grant in CMS-PO-015 §11. **Gate 4's grant is release authorization only — it does not automatically authorize staging, committing, pushing, deployment, any `CMS_ACCESS_CUTOVER_ENABLED` change, or customer cutover.** Each of those remains a separate, explicitly controlled action this plan does not grant.

## 9. Technical decisions

### 9.1 Decided (mirrors CMS-PO-015 §9.1; chat, 2026-11-09)
1. `customerContentService.ts` is the enforcement point (§3) — TD-001.
2. Option 4B (recursive-query repository method) for single-item ancestor resolution (§4) — Decision 2. Option 4A is not used.
3. Concurrency and consistent reads for the single-item path (§4a) — resolved by Decision 2's single-statement-snapshot property; no separate transaction-isolation-level decision needed for that path.

### 9.2 Still requiring Product Owner / engineering approval (mirrors CMS-PO-015 §9.2)
1. Whether any caching/memoization is introduced for the list path's ancestor walk (unlikely to be necessary given it's already in-memory over already-fetched data, but not ruled out here).
2. Whether a stored/materialized effective-status representation is ever wanted (not currently proposed; would need its own migration).
3. The exact 404/not-found response shape for each of the three single-item paths once an item is excluded by this rule — recommended to match each path's existing no-existence-leak convention exactly (same shape as "unknown id"), but this should be confirmed per-path, not assumed uniform across all three without checking.

---

## Self-review

**Scope discipline:** every section above traces to either CMS-PO-015's approved behavioral decisions (§3, §4 definitions) or to independently re-verified, cited evidence (§1, §2) — no technical choice is presented as decided when CMS-PO-015 §9 leaves it open; §4 and §9 explicitly flag the two live open questions rather than silently picking one. No file list or task above touches CMS-PO-014, Requirement B, or any file this plan doesn't name.

**Completeness against the request:** repository architecture mapping (§1), affected services/read paths (§2), recommended enforcement point with alternatives and trade-offs (§3, §4), test strategy covering nested containers/DRAFT-ARCHIVED ancestors/mixed descendants/restoration/direct retrieval/downloads (§5), regression coverage for Plus/Pro/Max/legacy fallback (§5), DB performance/query-efficiency considerations (§6), backward compatibility and failure handling (§7), task dependencies and verification gates (§8), and technical decisions requiring further Product Owner approval (§9) are each present as their own section.

**Addendum (governance amendment, chat, 2026-11-09):** the self-review above describes this plan as it stood when first written, when §3/§4/§4a/§9's technical choices were still open. They are no longer open — §9.1 (and the corresponding edits to §3, §4, §4a, §8) record TD-001 and Decision 2 as approved. This addendum preserves that history rather than rewriting the original self-review to pretend those choices were always decided.
