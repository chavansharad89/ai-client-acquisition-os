# Governance Record: Dedicated Topic-Detail View & Full-Width Learning Layout (CMS-PO-013)

**Type:** Product Owner decision — **APPROVED 2026-11-05, subject to the clarifications in §2a.** CMS-PO-013 supersedes **only** the dedicated-topic-routing clause of CMS-PO-011(A) (the assumption that a selected topic's detail is always shown inline alongside the roadmap/topic-list, never as a full replacement of the view). All other CMS-PO-011 decisions — (A)'s "no new route segment" clause, and (B)–(E) in full — remain approved and in force, unchanged by this record. CMS-PO-012 is unaffected.

**Status: APPROVED (design). UI implementation is a separate authorization — see §7. No code, route, or layout has been changed under this record.**

## 1. Background — why this decision is needed

The Product Owner requested (chat, 2026-11-05) a UI change to the Plus/Pro/Max learning experience at `/access/[productId]`:
- Selecting a topic (in either Roadmap View or Topic View) should navigate to a dedicated topic-detail view, rather than showing the topic's content inline alongside the roadmap/topic list.
- That view needs a breadcrumb, title, content, existing download functionality, Previous/Next topic navigation, Mark Complete (existing Learning Progress API), and a clear way back to the course overview.
- The course-overview and topic-detail layouts should use the available viewport width instead of a narrow centered container, while keeping long-form content at a readable measure.
- The URL must carry the selected topic (direct navigation, refresh, browser Back/Forward all need to work), and existing entitlement/access checks must still gate what a direct URL can reach.

This intersects two existing governance items:

- **CMS-PO-011(A)** (approved 2026-11-02, `requirement/CMS_PO_011_CUSTOMER_ROADMAP_UI_PO_DECISIONS.md`): *"One page, two views behind an in-page toggle... No new shareable URL per view; no new route segment."* Its alternatives-considered section explicitly rejected a separate-route design "for this round... may be revisited later as its own decision" — this record is that revisit.
- A **pending, not-yet-approved Phase 1 topic deep-link design** (session note, 2026-11-02 08:19 UTC) that proposed `GET /access/[productId]?topic=<contentItemId>` on the *existing* route (explicitly no new path segment, to stay inside CMS-PO-011(A)), and explicitly flagged *"a dedicated path-segment route for prettier, more shareable per-topic URLs"* as a *"future separate decision, out of scope."* That design was itself never approved or implemented — it exists only as a proposal.

## 2. Proposed resolution — reuse the query-param contract; change what it renders

Rather than add a new Next.js route segment (e.g. `/access/[productId]/topics/[topicId]`), this record proposes keeping topic selection on the existing `/access/[productId]` route via a `?topic=<contentItemId>` query parameter (the same URL shape the unapproved Phase 1 design proposed), but changing what the route renders when `topic` is present:

- **Today, per CMS-PO-011(A)–(E) as approved:** Roadmap View or Topic View, with the selected topic's detail shown inline within that same view (side-by-side on wide screens, stacked below on narrow screens).
- **Proposed:** when a topic is selected, the route renders a dedicated full-width topic-detail layout (breadcrumb, title, content, download, Previous/Next, Mark Complete, link back to overview) **in place of** the roadmap/topic-list, not alongside it.

This satisfies every acceptance criterion in the request — a dedicated-feeling page, no detail rendered below the list, the topic preserved in the URL, direct navigation, refresh, and browser Back/Forward all working — while introducing **no new route segment**. It therefore does not touch CMS-PO-011(A)'s literal routing clause (no new URL *shape*, no new path), only its assumption that the detail is always shown inline rather than as a full replacement of the view. That assumption is what this record amends, which is why it is recorded as its own decision rather than implemented silently under "smallest safe change."

**Alternative considered and rejected: a new path-segment route** (`/access/[productId]/topics/[topicId]`). Rejected because (a) it is the exact alternative CMS-PO-011(A) already considered and declined "for this round"; (b) the query-param approach satisfies every stated acceptance criterion at smaller scope, consistent with this project's smallest-safe-change preference (`CLAUDE.md` §5.4); (c) the Product Owner's own request prefers "reusing the existing URL/deep-link contract rather than introducing unnecessary new routes."

## 2a. Clarifications incorporated per Product Owner approval (2026-11-05)

The Product Owner approved this record subject to the following, now binding on §3's scope:

1. Reuse `/access/[productId]?topic=<contentItemId>` — no new route segment, no new path.
2. Without a `topic` parameter: render the course overview with the existing Roadmap View / Topic List toggle, exactly as CMS-PO-011(A)–(E) already specify.
3. With a valid `topic` parameter: render a dedicated topic-detail layout that **replaces** the overview (not alongside it).
4. The topic parameter resolves **exclusively** through the server-side entitlement-filtered CMS tree (the same tree `listAccessibleCmsContent` builds for the overview) — no independent or client-trusted lookup path.
5. Invalid, inaccessible, archived, wrong-product, and non-`ASSET`-type topic ids are all rejected without exposing their existence or content — same no-existence-leak outcome for every rejection reason, not just unknown ids.
6. Browser Back and Forward must restore the previous overview/topic navigation state (not just "some" previous state) — history entries must correspond to actual navigation steps (overview → topic, topic → topic via Prev/Next).
7. All other approved CMS-PO-011(A) behavior (no new route segment) and all of CMS-PO-011(B)–(E) (default view, no persistence, section labels, node interactivity) are preserved unchanged.
8. Layouts (both overview and topic-detail) use the responsively available viewport width; long-form learning content keeps a readable measure (reusing the existing `.lede` `60ch` convention or equivalent) rather than stretching full-width.

## 3. Scope authorized by this decision (once approved)

1. Extending the `/access/[productId]` page (or a client subtree it renders) to read `?topic=` and, when present, render a dedicated full-width topic-detail layout instead of the roadmap/topic-list — reachable by clicking any topic in either Roadmap View or Topic View.
2. A per-topic entitlement re-check at that URL using the existing entitlement-filtered content tree (the same resolution the unapproved Phase 1 design proposed: a topic id only resolves if it is present in the tree built from `listAccessibleCmsContent`, is of node type `ASSET`, and belongs to the requested `productId`). No topic becomes reachable via URL that a click could not already reach. Invalid, unknown, inaccessible, archived, wrong-product, and non-`ASSET` (`CONTAINER`) ids are all rejected via the **same** fallback path with no distinguishing error — matching the existing download route's no-existence-leak pattern, and per clarification §2a.5, not special-cased per rejection reason.
3. Previous/Next topic navigation reusing the existing `apps/web/components/access/topicNavigation.ts` helpers (`resolveSelection`, `flattenTopics`, etc.) — no new traversal logic.
4. Wiring the topic-detail view to the existing Learning Progress API contract — `POST /access/[productId]/progress/view` and `/access/[productId]/progress/complete`, body `{contentItemId}` — per `docs/superpowers/plans/2026-11-02-learning-progress.md`. That plan's own Global Constraints left UI consumption of the API out of scope, so no prior decision authorizes or forbids a specific integration pattern; this record is that authorization. See §4 for a sequencing note.
5. Removing restrictive `max-width` container classes on the course-overview and new topic-detail layouts in favor of responsive full-width layout, while preserving a readable measure for long-form body copy (reusing the existing `.lede` `60ch` convention or equivalent) — a presentational change only, no new CSS architecture or dependency.

**Does not authorize, and explicitly leaves unchanged:**
- CMS schema or migrations.
- Authentication/entitlement architecture (`requireUser`, `canAccessProduct`, `permittedContentPlans`, `apps/web/src/server/access.ts`) — reused as-is, not modified.
- Payment/subscription functionality.
- The Learning Progress API's route contracts, request/response shapes, or server-side logic — consumed exactly as implemented, not changed.
- Existing CMS content identifiers.
- The production roadmap renderer (`RoadmapFlowchart.tsx` / `flowchartLayout.ts`) or the CMS-PO-012 `@xyflow/react` prototype — neither is touched.
- CMS-PO-011(B) (Roadmap View default), (C) (no view-choice persistence), (D) (Topic View section labels), (E) (node interactivity at any depth) — all remain exactly as approved.

## 4. Learning Progress dependency — merge sequencing (binding per Product Owner decision)

The Learning Progress API — migrations, repository, routes — is fully implemented on sibling branch `feature/learning-progress`, built from the same base commit (`48284c9`) as the current branch (`feature/client-intent-discovery-complete`), but **not yet merged into the current branch**.

Per Product Owner decision (2026-11-05): `feature/learning-progress` **must not** be merged as part of this UI implementation. It is merged separately into `feature/client-intent-discovery-complete` through the project's previously approved branch-integration procedure. Only after that merge is complete does implementation verify the actual resulting repository state and the Learning Progress API's real contracts (routes, request/response shapes, repository behavior) before writing the Mark Complete / view-tracking integration against them — not against this record's description of the contract, which is a planning-time reference only.

Until that merge lands, the topic-detail view's Mark Complete integration is specified by this plan but does not run end-to-end.

## 5. Relationship to existing governance

Amends only CMS-PO-011(A)'s inline-detail assumption, as described in §2. Does not alter CMS-PO-011(B)–(E), CMS-PO-012, `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md`, `requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md`, or `requirement/CMS_PO_006_ADMINISTRATOR_AUTHORIZATION_PO_DECISION.md`.

## 6. Approval

**APPROVED** via chat instruction, 2026-11-05 ("Decision: APPROVED, subject to incorporating these clarifications"), subject to and incorporating §2a. This record explicitly supersedes only CMS-PO-011(A)'s dedicated-topic-routing/inline-detail assumption; every other approved clause of CMS-PO-011 — including (A)'s own "no new route segment" restriction — remains in force. No code, route, or layout change has been made under this record.

## 7. Current authorization — design only

This approval authorizes **finalizing this decision document only**. It does not authorize beginning UI implementation. Implementation proceeds only under a separate, explicit Product Owner authorization, against `docs/superpowers/plans/2026-11-05-topic-detail-dedicated-page.md` (written and self-reviewed per this record; not yet authorized for execution).
