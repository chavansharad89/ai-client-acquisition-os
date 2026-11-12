# Governance Record: Graph-Based Roadmap Renderer Prototype (CMS-PO-012)

**Type:** Product Owner decision authorizing a bounded technical prototype. Does not authorize production adoption — see §5.

**Scope:** Whether to evaluate a graph-rendering library (`@xyflow/react`) as a candidate replacement for the hand-rolled CSS flowchart built under CMS-PO-011's visual-redesign addendum, after `scripts/lib/official-roadmap.ts` in the public `nilbuild/developer-roadmap` mirror showed roadmap.sh's own data model uses an explicit `nodes`/`edges`/`dimensions` shape (per-node pixel positions, first-class edge objects) rather than a tree-derived algorithmic layout.

## 1. The decision, recorded verbatim

> **Product Owner Decision: Graph-Based Roadmap Renderer Prototype**
> I approve Option 1 for a bounded technical prototype using `@xyflow/react`.
>
> Authorized scope:
> 1. Review the existing roadmap implementation and its architecture.
> 2. Install `@xyflow/react` as a prototype dependency, after checking framework compatibility and bundle implications.
> 3. Build an isolated prototype using the existing roadmap data.
> 4. Support individually positioned custom nodes, connecting edges, zoom, pan and clickable topic navigation.
> 5. Compare the prototype with the existing CSS implementation against the roadmap.sh reference.
> 6. Report implementation complexity, performance, accessibility, maintainability and future CMS integration requirements.
>
> Restrictions:
> - Do not replace the existing production implementation.
> - Do not delete or refactor existing roadmap functionality.
> - Do not introduce database migrations.
> - Do not implement the visual CMS/editor yet.
> - Do not change Plus access control, authentication or learning progress functionality.
> - Do not assume roadmap.sh uses React Flow; independently verify its renderer only if reliable evidence is available.
> - Preserve all existing governance, testing and release-gate requirements.
>
> Deliverables:
> 1. Working isolated prototype.
> 2. Screenshots demonstrating the roadmap.
> 3. Comparison against the existing implementation.
> 4. Dependency and bundle impact assessment.
> 5. Recommended final architecture.
> 6. Explicit migration plan and risks.
>
> After delivering the prototype and assessment, STOP and request further Product Owner approval before production integration or broader architectural changes. This authorizes the prototype only, not production adoption.

Approved via chat instruction, this session, 2026-11-02.

## 2. Relationship to existing governance

Does not alter CMS-PO-011 (A)–(E) or any of its decisions — the existing CSS flowchart (`RoadmapFlowchart.tsx`, `flowchartLayout.ts`) remains the live, production implementation, untouched. Does not touch `content_items`, `permittedContentPlans`, the signed-download route, or any migration. Independent of `PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` and the CMS-PO-007..010 asset/lifecycle decisions, none of which this prototype's scope reaches.

## 3. Scope boundary (this record's own enforcement notes)

- The prototype is additive-only: a new, isolated route/module, not a modification of `/access/[productId]` or any file the production roadmap views depend on.
- No new database schema, no new `content_items` columns, no migration file.
- No visual editor/admin positioning UI — node positions for the prototype are computed, not hand-authored or persisted.
- No change to `requireUser`/`canAccessProduct`/`permittedContentPlans` or any entitlement/session code.
- Independent verification of roadmap.sh's actual renderer (not an assumption) is required before reporting a comparison — recorded with its evidence in the delivered report, not asserted from the data-model inference alone.

## 4. Status

**DELIVERED, awaiting Product Owner decision on final architecture.** Prototype built at `apps/web/app/prototypes/roadmap-reactflow/page.tsx` (admin-gated, real `ai_income_99` data); screenshots taken against sample data shaped like the roadmap.sh reference; comparison/bundle/migration report delivered in chat, this session, 2026-11-02. Production implementation (`RoadmapFlowchart.tsx`) unchanged and still live.

## 5. Explicit non-authorization

This record authorizes the prototype described above only. It does not authorize: replacing `RoadmapFlowchart.tsx` in production, adding `@xyflow/react` (or any other new dependency) to the production bundle beyond what the prototype itself needs to run, a CMS visual editor, or any database migration. Each of those requires its own, separate, explicit Product Owner approval after this prototype's findings are reviewed.
