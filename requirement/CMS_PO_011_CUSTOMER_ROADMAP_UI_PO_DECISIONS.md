# Governance Record: Customer-Facing Roadmap/Topic UI (CMS-PO-011)

**Scope:** Record the Product Owner's decisions on four open UI/product questions surfaced while planning the customer-facing `/access/[productId]` roadmap redesign (two views — a hierarchical "Roadmap View" and a sequential "Topic View" — over the existing `content_items` CMS hierarchy). No code, schema, or architecture is changed by this record; it only resolves the open questions the implementation plan was blocked on. No admin/entitlement/payment/security decision is touched here — see `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` and `requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md` for those, unmodified.

## 1. Background — why this decision was needed

The implementation plan at `docs/superpowers/plans/2026-11-01-customer-roadmap-ui.md` (revision 2026-11-02) proposed a specific, concrete answer to four questions it could not resolve from the Product Owner's own requirement text alone, and listed them under "Unresolved decisions (need your call before implementation)" in the agent's report of that revision, delivered in chat on 2026-11-02. The Product Owner's reply to that report was: **"PO APPROVAL CONFIRMED,"** followed by an instruction to record the four decisions and proceed with implementation.

**Traceability note on this record's provenance:** the Product Owner's approval message did not re-state each of the four questions' answers individually; it approved the plan as delivered. This record therefore treats "PO APPROVAL CONFIRMED" as approval of the plan's own four stated proposals, reproduced verbatim as item 2 below. If any individual answer here does not in fact match the Product Owner's intent, this record should be corrected and re-approved before the corresponding part of the implementation proceeds — approving this record is not a substitute for restating a different answer if one was actually intended.

## 2. The four questions and the decisions, as proposed and approved

> **CMS-PO-011(A) — View routing.** One page, two views behind an in-page toggle (`useState<'roadmap' | 'topics'>`), not two separate URLs/routes. No new shareable URL per view; no new route segment.
>
> **CMS-PO-011(B) — Default view.** Roadmap View (the hierarchical tree) is the default on first visit, for every customer regardless of plan (Plus/Pro/Max). Topic View is reached via the toggle.
>
> **CMS-PO-011(C) — View-choice persistence.** The chosen view does not persist across visits or page loads. Every visit starts from the default (CMS-PO-011(B)).
>
> **CMS-PO-011(D) — Topic View section labels.** Topic View shows a small, non-interactive label naming each topic's nearest-ancestor section/container above the first topic under it, rather than a fully flat, ungrouped list.

## 3. Alternatives considered

Per question, as stated in the implementation plan's "Unresolved decisions" section:

- **(A)** Two separate routes/URLs (one per view) — rejected for this round as a larger, different change (new route segment, bookmarkable/shareable-per-view behavior, different browser-back semantics) than what was asked for; may be revisited later as its own decision.
- **(B)** No real alternative was proposed beyond "pick one consistent default" — Roadmap View was selected as it directly answers the PO's original "roadmap.sh-inspired" framing of the feature.
- **(C)** `localStorage`-based persistence of the last-chosen view — rejected for this round as an additional, not-strictly-required capability; would need its own explicit ask if wanted later.
- **(D)** A fully flat list with zero grouping/section hints — considered as the simpler alternative more in keeping with Topic View's "Normal" framing; rejected in favor of (D) above because a 17-topic flat list with no structural hint was judged harder to scan, at negligible implementation cost (the parent-title data already exists on every node).

## 4. Selected

(A) in-page toggle, no new route. (B) Roadmap View default. (C) No persistence. (D) Non-interactive section labels in Topic View.

## 5. Rationale

- All four are UI/UX-only — none touch `content_items`, access control, the download route, or product/plan separation, which the implementation plan independently keeps unchanged and upstream of either view (see that plan's Global Constraints).
- Each is the smallest-scope option that still satisfies the Product Owner's original two-view requirement (2026-11-01/2026-11-02 chat), consistent with this project's general preference (`CLAUDE.md` §5.4) for the smallest safe change over speculative extensibility (new routes, persistence) not asked for.
- All four are easily revisited later as their own, narrower decisions (e.g., "add a `/topics` route," "persist the view choice") without touching this record or re-opening it, since none of them is load-bearing for the other three.

## 6. Relationship to existing governance

Does not alter, amend, or supersede any decision in `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md`, `requirement/CMS_PO_007_010_ADMIN_SCOPE_PUBLISHING_ASSET_INGESTION_PO_DECISIONS.md`, `requirement/CMS_PO_006_ADMINISTRATOR_AUTHORIZATION_PO_DECISION.md`, or `requirement/CMS_PO_010_R4_CONTENT_READINESS_AUDIT.md`. Plus/Pro/Max access separation, the `content_items` hierarchy and lifecycle, and the signed-download mechanism are all unchanged by, and unrelated to, this record.

## 7. Approval

Approved via chat instruction, this session, 2026-11-02 ("PO APPROVAL CONFIRMED... Record the four approved decisions..."). Implementation proceeds under `docs/superpowers/plans/2026-11-01-customer-roadmap-ui.md` per this record.

## 8. Addendum — every roadmap node is interactive (clarification, 2026-11-02, mid-implementation)

> **CMS-PO-011(E) — Roadmap node interactivity.** Every roadmap node — top-level sections, topics, nested topics, and subtopics at any depth — must be clickable. Clicking a container selects it, shows its details, and exposes its children. Clicking an asset/topic selects it and shows its details and downloadable resources. The selection must be clearly highlighted and must work at arbitrary nesting depth. Switching to Topic View and back must preserve the selected topic wherever possible. Containers are never decorative or dead-end.

Not a new, separate product decision — a clarification of CMS-PO-011(A)'s already-approved behavior, prompted by a review finding (see `docs/superpowers/plans/2026-11-01-customer-roadmap-ui.md`'s own addendum section for the point-by-point status). Does not alter the shared navigation architecture (`TopicNavigation`, `ContentTreeNode`) or any decision in §2 above — it specifies how `RoadmapView` must use what was already built: auto-expanding a selected node's ancestors so arbitrary-depth selection stays visible, and resolving a container-to-topic-view switch to the nearest descendant topic rather than an arbitrary one.
