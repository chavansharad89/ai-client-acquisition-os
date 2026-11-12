# Governance Record: Learning Path Selection & Complete Learning Path Download (CMS-PO-014)

**Type:** Product Owner decision — **APPROVED** (Product Owner, chat, 2026-11-09). Decisions D1–D4, D5 (Option A — synchronous package generation during the customer request, with no asynchronous queue, background generation, polling, or notifications; strict resource limits must be justified), D6, D7, D9, and D10 are approved as recorded. D8 remains unresolved and is an explicit implementation blocker for Requirement B. The complete-book CMS designation mechanism referenced by D6 (§3.7) is a separate, unresolved technical design dependency, also blocking only Requirement B. **This document is approved as a complete governance record in its current form** — see §12. No code, route, schema, configuration, or CMS content has been changed. This record amends only the specific CMS-PO-011 clause identified in §6; it does not alter CMS-PO-012 or CMS-PO-013.

**Status: APPROVED (Product Owner, chat, 2026-11-09). Implementation of Requirement A is separately authorized — see §11 and the accompanying implementation plan. Requirement B remains blocked at the design level by D8 and the §3.7 complete-book designation dependency.**

---

## 1. Background

The Product Owner issued two related requirements (chat, 2026-11-09) affecting the Plus customer learning experience at `/access/[productId]`:

- **Requirement A — Learning Path Selection:** replace the current behavior, where opening a product (e.g. "AI Income Starter Kit") goes straight to the Roadmap View, with an intermediate page presenting the product's available learning paths as selectable cards; selecting one opens that path's existing Roadmap View / Topic-wise View experience unchanged.
- **Requirement B — Complete Learning Path Download:** let a customer download an entire selected learning path as a single package (a pre-existing complete-book PDF if one exists, otherwise a ZIP preserving folder structure), in addition to (not instead of) existing per-chapter downloads.

Both requirements were investigated read-only against the current codebase and local dev database before this record was drafted; findings are reported in §2–§3 and are load-bearing for the decisions in §7.

This record distinguishes, throughout:
- **PO requirement** — a verbatim obligation from the Product Owner's own instructions, not open for engineering substitution.
- **Proposed engineering decision** — a design choice proposed to satisfy a PO requirement, presented here for explicit approval, not self-authorized by this record.

---

## 2. Requirement A — Learning Path Selection

### 2.1 PO requirement (verbatim intent)

1. Clicking "Open AI Income Starter Kit" opens a Learning Path Selection page instead of going straight to Roadmap View.
2. Available learning paths are shown as selectable cards (illustrative examples only — AI Engineer, System Design, Data Structures, Backend Engineer).
3. Cards reflect the actual published Plus learning paths, derived from the existing content structure — no hardcoded inventory.
4. Selecting a card opens that path's learning experience.
5. Within a path, the already-approved Roadmap View / Topic-wise View toggle is retained unchanged: Roadmap View default, every node clickable, Topic-wise View keeps Previous/Next.
6. Existing entitlement enforcement, CMS publication rules, download authorization, and 30-day access validity are preserved.
7. No duplicated CMS content, no hardcoded topic inventory.

### 2.2 Findings (read-only investigation)

- The CMS content model (`packages/core-cms/src/types.ts`) is a single self-referencing tree per product: `content_items` rows with `owningProductId`, `parentId`, `nodeType: CONTAINER | ASSET`. Nothing in the schema restricts a product to one depth-0 `CONTAINER`.
- Confirmed directly against the local dev database: the Plus product (`ai_income_99`) currently has **five** depth-0 `CONTAINER` rows (four `PUBLISHED`, one `ARCHIVED`). This demonstrates the mechanism already supports multiple top-level groupings per product without any schema change.
- The current renderer (`apps/web/components/access/flowchartLayout.ts`, `buildFlowchart`) flattens **every** depth-0 `CONTAINER` of a product into one continuous spine. This, not a missing data model, is why customers see one merged roadmap today rather than separate selectable paths.
- The customer route (`apps/web/app/access/[productId]/page.tsx`) already resolves a `?topic=<contentItemId>` query parameter to a dedicated topic view, per CMS-PO-013. No equivalent exists yet for selecting among multiple depth-0 containers.
- `ProductRoadmap`, `RoadmapView`, `RoadmapFlowchart`, `TopicView`, `TopicDetailView`, and the shared `topicNavigation`/`useTopicNavigation` helpers all already operate on whatever `ContentTreeNode[]` subtree they are handed — none of them is intrinsically tied to "the whole product tree."

### 2.3 Proposed engineering decision — representation

**Proposed:** a "learning path," for the purposes of this feature, is a depth-0 `CONTAINER` node under a product's entitlement-filtered content tree. No new table, column, enum value, or migration. This is a direct reading of requirements A.3 and A.7 against the existing model — it introduces no new inventory and duplicates no content.

### 2.4 Approved engineering decisions — routing (D1–D4)

- **D1 — APPROVED (Option A, Product Owner decision 2026-11-09):** the Learning Path Selection page is **always** shown when a CMS content tree exists for the product — including when exactly one `PUBLISHED` depth-0 `CONTAINER` exists. There is no count-based skip. A customer must explicitly select a path before entering its learning experience, even if only one path is currently published. (This replaces the previously proposed "skip when only one path exists" behavior.)
- **D2 — APPROVED (Option A, Product Owner decision 2026-11-09):** every `PUBLISHED` depth-0 `CONTAINER` in the product's CMS hierarchy represents a selectable learning path. No new database column or CMS designation is required for identifying learning paths. `DRAFT` and `ARCHIVED` depth-0 containers must not appear as cards. No new admin-facing flag distinguishes an "intended" learning path from an incidental top-level container — this relies on CMS content being curated correctly; the existing content-hygiene dependency concerning published test containers (§9.1) is preserved and still applies.
- **D3 — APPROVED (Option A, Product Owner decision 2026-11-09):** scope is initially Plus only (`ai_income_99`). Pro and Max retain their existing navigation behavior unchanged. The underlying mechanism (depth-0 containers under an entitlement-filtered tree) is identical for Pro and Max, but this record grants **no implicit authorization** to extend the feature to other products — any such extension requires its own, separate Product Owner decision.
- **D4 — APPROVED (Option A, Product Owner decision 2026-11-09):** the selection page applies only when a CMS content tree exists for the product (`cmsLibraryTree` returns non-null). The existing legacy flat-manifest fallback path is preserved unchanged.

### 2.5 Approved routing mechanism

Extend the existing `/access/[productId]` route (no new route segment, consistent with CMS-PO-011(A) and CMS-PO-013 §2's established pattern) with a new query parameter, analogous to CMS-PO-013's `?topic=`:
- No path parameter, CMS content tree exists (D4) → **always** render the selection component listing one card per `PUBLISHED` depth-0 `CONTAINER` (D2), regardless of how many exist, including exactly one (D1).
- Path parameter present → resolve it against the same server-side entitlement-filtered tree already built for the overview (no independent or client-trusted lookup, mirroring CMS-PO-013 §2a.4) → render only that container's subtree through the existing, unmodified Roadmap View / Topic-wise View toggle.

---

## 3. Requirement B — Complete Learning Path Download

### 3.1 PO requirement (verbatim intent)

1. Provide a prominent "Download Complete Book" action on the selected learning path page.
2. Include all eligible published content belonging to that learning path, including nested topics/chapters.
3. If the learning path has a single complete book PDF, deliver that PDF.
4. If its content consists of multiple files, provide a ZIP preserving the logical folder/topic structure.
5. Continue supporting individual chapter/resource downloads.
6. Exclude drafts, archived assets, and content belonging to other learning paths.
7. Enforce existing product entitlement, ownership, and 30-day expiry rules.
8. Reuse existing authorized download infrastructure where possible; never expose storage keys or bypass download authorization.
9. Define behavior for missing files, unsupported formats, empty paths, and large packages.
10. Do not assume a ZIP-generation service or complete-book PDF mechanism already exists; inspect current implementation and identify required engineering changes.

### 3.2 Findings (read-only investigation) — this is a greenfield feature

Per requirement B.10, the current implementation was inspected directly. Every capability this requirement needs is absent today:

| Capability needed | Current state |
|---|---|
| Fetch a learning path's subtree by container id | Does not exist. `listPublishedContentForPlans()` returns every published node for the whole product, flat, with no subtree filter. |
| "Complete book" PDF concept | Does not exist. `assetKind` is simply the uploaded file's extension (`pdf`, `mp4`, …), not an enum; no bundle/book marker exists anywhere in the model. |
| ZIP (or any multi-file archive) generation | Does not exist anywhere in this codebase. No archive library of any kind is a dependency in any package in the monorepo. The only existing `zip`-related handling is accepting a pre-made `.zip` as a single opaque uploaded asset — unrelated to generating one. |
| Multi-object / streaming storage reads | Does not exist. The storage abstraction (`packages/core-cms/src/assetStorage.ts`, R2-backed) operates on exactly one object key at a time and only ever returns a presigned URL — the application server never reads or streams an object's bytes itself today. |
| Folder-structure reconstruction for a ZIP | Not derivable from storage directly — R2 storage keys are flat and carry no hierarchy. Folder structure would have to be reconstructed from `content_items.parentId`/`title` at request time. |
| Large-response / background-job handling | No job-queue library exists in this codebase. The closest existing primitive is `apps/worker`'s bespoke DB-poll-loop pattern (used for cleanup/reconciliation/search-indexing), which is not currently wired to any download flow. |
| Deployment/runtime data to size limits against | This application has not been deployed (per `docs/DEPLOYMENT.md`, no container has ever been built; several unrelated production blockers are already tracked there). There is no empirical timeout or memory data point available to size any limit against. |

No existing governance record addresses bulk, "download all," complete-book, or ZIP downloads. This is confirmed as a net-new PO decision area, not an extension of an existing one.

### 3.3 Approved engineering decision — complete-book PDF detection (D6)

**D6 — APPROVED (Option B, Product Owner decision 2026-11-09):** a PDF is delivered directly as the "complete book" **only when it is explicitly designated as the complete book in CMS.** A single PDF is never inferred to be the complete book merely because it happens to be the only PDF in the path's eligible content. Absent an explicit designation, a learning path's download is **always** a ZIP containing its eligible document assets (subject to D9). This replaces the previously proposed "exactly one PDF → infer it's the book" rule.

The current CMS has **no mechanism to record such a designation** — no column, flag, or convention exists today (confirmed in §3.2). This record does **not** introduce one; doing so would be a silent schema change, which is explicitly out of scope for a documentation-only record. The required CMS representation for a complete-book designation is recorded as its own unresolved technical design dependency in §3.7, separate from D8.

### 3.4 Approved engineering decision — package generation strategy (D5)

**D5 — APPROVED (Option A, Product Owner decision 2026-11-09):** packages are generated **synchronously**, within the customer's download request. There is no asynchronous job queue, no background generation, no customer polling, and no notification workflow for Requirement B. (This replaces the previously proposed hybrid sync/async strategy.)

Synchronous generation must operate within **justified resource limits** (maximum package size, maximum file count, maximum generation/request duration). Those limits are not established by this record — that is D8, below. **Approval of D5 is not permission to implement synchronous generation without D8 being resolved first.** D5 and D8 are both required before Requirement B's package-generation path may be built; D5 alone is insufficient.

### 3.5 Unresolved and blocking — resource limits (D8)

**D8 is UNRESOLVED and remains an explicit IMPLEMENTATION BLOCKER for Requirement B.** No numerical size, file-count, duration, or byte-count limit is decided, assumed, or implied by this record — per Product Owner instruction, no such number is invented here. The limits that must eventually be established cover, at minimum:
- Maximum package size.
- Maximum file count per package.
- Maximum generation/request duration.

These limits must be established using **actual staging/deployment measurements** — not estimated, guessed, or derived from this record's own reasoning — before Requirement B's synchronous generation (D5) is implemented. Approval of D5 does not constitute, and must not be treated as, permission to implement Requirement B's generation path while D8 remains unresolved. Until D8 is resolved and recorded as an amendment to this decision, Requirement B may not proceed past design.

### 3.6 Approved engineering decisions — remaining gaps (D7, D9, D10)

- **D7 — APPROVED (Option A, Product Owner decision 2026-11-09):** if any asset in the eligible set is missing or unreadable in storage at generation time, the **entire** package generation is aborted. A partial package is never delivered as if it were complete. The customer receives a clear, generic error, and the failure is logged for operational investigation.
- **D9 — APPROVED (Option A, Product Owner decision 2026-11-09):** a generated ZIP includes **eligible document assets only**; video and audio assets are **excluded** from the ZIP. The logical CMS topic/folder hierarchy is preserved inside the ZIP. Existing individual resource downloads (including of video/audio assets) are unaffected by this exclusion — they remain available via the existing single-asset download mechanism (B.5).
- **D10 — APPROVED (Option A, Product Owner decision 2026-11-09):** a published learning path remains **visible** as a selectable card even when it currently contains no eligible assets — a path is never hidden merely because its content is still being prepared. Only the "Download Complete Book" action is hidden when there are no eligible assets to package. Independently of the UI, the underlying endpoint rejects a direct request that would produce an empty package with a defined empty-state response — the UI hiding the button is not relied upon as the only safeguard.

### 3.7 Unresolved technical design dependency — complete-book designation mechanism

Stemming from D6: before a PDF can ever be delivered as a "complete book" under D6, a CMS-side mechanism to explicitly designate a specific asset as that learning path's complete book must be designed and approved. This record explicitly does **not** decide that mechanism (e.g. a new `content_items` column, a separate designation table, or some other representation) — introducing one silently is explicitly out of scope here. Until that mechanism is designed and separately approved, every learning path's "Download Complete Book" action produces a ZIP (per D6's default), never a direct PDF. This dependency is distinct from, and independent of, D8: it blocks only the direct-PDF-delivery path of Requirement B, not ZIP generation itself, and does not block Requirement A at all.

---

## 4. Explicit distinction — PO requirements, approved decisions, and unresolved dependencies

To satisfy the Product Owner's instruction to keep these separate:

- **Explicit Product Owner requirements (verbatim, not open to engineering substitution):** §2.1 (A.1–A.7) and §3.1 (B.1–B.10) in full. This revision does not weaken or replace either list.
- **Approved engineering decisions (Product Owner decision, 2026-11-09):** D1, D2, D3, D4 (§2.4); D5 (§3.4) — Option A, synchronous package generation during the customer request, with no asynchronous queue, background generation, polling, or notifications, subject to strict resource limits that must be justified (see D8, §3.5); D6, D7, D9, D10 (§3.3, §3.6). Each is approved as recorded, with its specific option and rationale stated in the section cited.
- **Unresolved and blocking (Requirement B only):** D8 (§3.5) — no resource limit is decided or invented; Requirement B's package-generation path (synchronous, per approved D5) may not be implemented until D8 is resolved and recorded as an amendment to this decision.
- **Other unresolved engineering design dependency (Requirement B only, independent of D8):** the complete-book CMS designation mechanism (§3.7) required to execute D6's direct-PDF-delivery path. Not decided here; not authorized to be introduced silently.
- **Not blocked by either unresolved item:** Requirement A (§2) — D1–D4 are fully approved and do not depend on D8 or §3.7 in any way.

---

## 5. Acceptance criteria

**Requirement A** (approved; not blocked by D8 or §3.7):
1. Opening a Plus product with a CMS content tree **always** shows the Learning Path Selection page first — including when exactly one `PUBLISHED` depth-0 container exists (D1). There is no count-based skip; the customer must explicitly select a path before entering its learning experience.
2. Only `PUBLISHED` depth-0 containers appear as selectable cards; `DRAFT` and `ARCHIVED` depth-0 containers never appear (D2).
3. A published learning path with zero eligible assets still appears as a selectable card — a path is never hidden merely because it is still being prepared (D10, applies to card visibility).
4. This scope is Plus (`ai_income_99`) only (D3); Pro and Max are unaffected and retain their current navigation behavior exactly as today.
5. Selecting a card opens that container's subtree in the existing, unmodified Roadmap View / Topic-wise View toggle (Roadmap View default, every node clickable, Topic-wise Previous/Next intact).
6. Card content (title, any displayed metadata) comes only from existing `content_items` fields — no new content authored or duplicated for this feature; no new database column or CMS designation is introduced to identify learning paths (D2).
7. Entitlement, publication (`PUBLISHED`-only), download authorization, and 30-day validity checks are unchanged and still apply identically within a selected path.

**Requirement B** (blocked overall on D8 per §3.5, and on the §3.7 designation mechanism specifically for the direct-PDF path; criteria below apply once unblocked):
8. A "Download Complete Book" action appears on a learning-path page only when its eligible-content set is non-empty; it is hidden when empty, even though the path card itself remains visible (D10).
9. The delivered artifact contains exactly the `PUBLISHED`, non-archived, non-draft document assets belonging to the selected learning path's subtree — verified against the same per-asset entitlement/ownership checks used by existing single-chapter download.
10. A PDF is delivered directly **only** when explicitly designated in CMS as that path's complete book (via the mechanism designed under §3.7); a single PDF is never inferred to be the complete book merely because it is the only PDF present. In every other case, a ZIP is delivered (D6).
11. A delivered ZIP contains eligible document assets only, excluding video and audio, while preserving the logical CMS topic/folder hierarchy (D9).
12. Individual chapter/resource downloads — including of video and audio assets excluded from ZIPs — continue to function exactly as before, unmodified (B.5, D9).
13. No storage key, internal id, or unsigned URL is exposed to the client at any point; every byte reaches the client only through an authorized-download mechanism (B.8).
14. A missing/unreadable source file at generation time aborts the **entire** package request with a generic customer-facing error and is logged for operational investigation — never delivered as a silently-incomplete package (D7).
15. Package generation is synchronous, within the customer's request, with no job queue, background generation, polling, or notification workflow (D5) — and does not proceed to implementation until D8's resource limits are established from actual staging/deployment measurements (§3.5).

---

## 6. Relationship to existing governance — traceability

- **CMS-PO-011** (`requirement/CMS_PO_011_CUSTOMER_ROADMAP_UI_PO_DECISIONS.md`, approved 2026-11-02): this record amends **only** CMS-PO-011(B)'s "Roadmap View is the default view shown on open" clause, by inserting a selection step before that default applies — per D1, unconditionally (not only when more than one path exists). CMS-PO-011(C) (no view-choice persistence), (D) (Topic View section labels), and (E) (every node clickable at any depth) are preserved unchanged and apply unmodified once inside a selected path. CMS-PO-011(A)'s "no new route segment" constraint is preserved — §2.5 proposes a query parameter on the existing route, not a new path, exactly as CMS-PO-013 already did for topic selection.
- **CMS-PO-013** (`requirement/CMS_PO_013_TOPIC_DETAIL_DEDICATED_PAGE_PO_DECISION.md`, approved 2026-11-05): unaffected and unamended. This record's proposed path-selection query parameter is additive to, and modeled directly on, CMS-PO-013's `?topic=` pattern and its server-side-only resolution principle (§2a.4 of that record) — the same entitlement-filtered tree is the sole source of truth for resolving either parameter.
- **CMS-PO-012** (`requirement/CMS_PO_012_ROADMAP_GRAPH_RENDERER_PROTOTYPE_DECISION.md`): unaffected. Neither requirement touches `RoadmapFlowchart.tsx`, `flowchartLayout.ts`, or the `@xyflow/react` prototype.
- **`requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md`**: its explicit choice not to invent a hierarchy level beyond the single self-referencing `content_items` tree is preserved — §2.3 of this record reads "learning path" out of the existing depth-0 `CONTAINER` concept rather than proposing a schema change.
- No other governance record addresses either requirement (confirmed by search of `requirement/` and `docs/`).

---

## 7. Security requirements

Both requirements, and Requirement B in particular, touch download authorization and entitlement enforcement — a risk area under this project's engineering policy regardless of the apparent size of the eventual change. The following are binding requirements on any future implementation under this record, not optional engineering preferences:

1. No new independent authorization path may be introduced. Every asset included in a selection-page card or a complete-book/ZIP package must pass the same entitlement + publication + ownership + 30-day-validity check already enforced for single-chapter downloads — re-checked at request time, not cached or inferred from an earlier check.
2. Folder-structure reconstruction from `content_items.parentId`/`title` (needed for Requirement B's ZIP, §3.2) must not allow a crafted or unusual title to escape its intended location inside the archive ("zip-slip") — this must be an explicit test case before any such code is approved for release, not an assumption.
3. No response may ever expose a storage key, an unsigned object URL, or any other internal identifier (B.8) — this is an unconditional requirement, not contingent on D5/D8.
4. A subtree-selection or package-generation request must never be able to return content belonging to a different learning path, a different product, or a different user's entitlement than the one explicitly requested and authorized (B.6, requirement A's "no content belonging to other learning paths").
5. Per this project's governance policy, implementation of Requirement B specifically requires independent security review before any production-facing code is accepted, given the new attack surface described in points 2 and 4 above. This record does not perform that review — it records that the review is required once implementation is authorized.

---

## 8. Negative / edge cases to be covered

- Unknown, inaccessible, archived, or wrong-product path identifier in the proposed `?path=` parameter: rejected with the same no-existence-leak outcome CMS-PO-013 already established for `?topic=` — not a distinguishing error per rejection reason.
- A product with exactly one `PUBLISHED` depth-0 container: the selection page is still shown (D1) — this is not an edge case to special-case around, it is the approved default behavior.
- A learning path (depth-0 container) with zero eligible children at all (no topics/assets yet authored): still appears as a selectable card (D10) — but does not expose a "Download Complete Book" action, and a direct request to the download endpoint for that path is independently rejected with a defined empty-state response.
- A learning path whose only content is archived or draft: that content is excluded from both Requirement A card metadata and Requirement B's eligible set, but the card itself is not hidden on that basis alone (see previous bullet).
- A learning path whose eligible content includes video/audio but zero eligible **document** assets: **no ZIP is generated** — this is not a ZIP containing zero files, it is treated identically to having no eligible content at all. The "Download Complete Book" action is hidden, and a direct request to the download endpoint is independently rejected with the same defined empty-state response as a path with no eligible assets whatsoever. Video/audio assets remain individually downloadable via the existing single-asset mechanism, unaffected by this (D9, D10).
- An asset expected by the eligible-content listing but absent/unreadable from storage at generation time: whole request fails per D7, not a partial result.
- A Requirement B request whose package would exceed the (currently undetermined, D8) resource limits: explicitly unresolved — not silently allowed to proceed unbounded, and not silently rejected with an invented limit either. No behavior is authorized here until D8 resolves.
- A learning path with a PDF present but no explicit complete-book designation recorded (since no designation mechanism exists yet, per §3.7): always produces a ZIP, never an inferred direct-PDF delivery.
- The legacy, non-CMS-tree fallback path (D4): Requirement A's selection page does not apply; Requirement B is out of scope for that fallback entirely, since there is no CMS subtree to derive a package from.

---

## 9. Dependencies and unresolved technical design items (recorded, not resolved by this decision)

### 9.1 Existing content-hygiene issue (dependency)

The read-only investigation for this record found that the Plus product's local dev database currently contains two `PUBLISHED` depth-0 containers that are evidently test fixtures ("TEST 1", "Test sub") alongside two that appear to be genuine content ("AI Engineering", "System Design"). Under the approved representation (§2.3) and D2, **any** `PUBLISHED` depth-0 container becomes a customer-visible learning-path card. This record does **not** change, archive, or otherwise modify any existing CMS content or record — per instruction, no CMS data has been touched. It is recorded here as a **pre-implementation dependency**: whoever curates Plus CMS content must ensure only intended learning paths are `PUBLISHED` at depth 0 before this feature is enabled for customers, or customers will see test fixtures as selectable "paths." This is a content-operations dependency, not an engineering task this record authorizes engineering to resolve by code.

### 9.2 Complete-book designation mechanism (unresolved technical design dependency)

As recorded in §3.7: D6 requires a CMS-side way to explicitly designate a specific asset as a learning path's "complete book," and no such mechanism exists today. This record does not design or approve one — doing so here would be an undiscussed, silent schema or content-model change. This is tracked as its own open item, separate from and not blocking Requirement A, and separate from D8 (it blocks only the direct-PDF-delivery branch of Requirement B's download, not ZIP generation).

---

## 10. Release gates

This record does not authorize release of either requirement. Before either requirement may ship:
1. Requirement A: this document is approved as a complete record; the resulting implementation plan passes this project's standard test/verification requirements; the content-hygiene dependency in §9.1 is confirmed resolved for the Plus product's actual published content (operations responsibility, verified before enabling the feature, not by engineering).
2. Requirement B: all of the above, **plus** D8 is resolved and recorded as an amendment to this decision with a justified (not invented) resource limit, **plus**, for the direct-PDF-delivery branch specifically, the §3.7 complete-book designation mechanism is separately designed and approved, **plus** the independent security review required by §7.5 has run to completion with findings resolved or explicitly accepted by the Product Owner.
3. Requirement A's release does **not** depend on D8 or §3.7 being resolved — those block only Requirement B.
4. Neither requirement may be released based on this design record alone — a separate, explicit Product Owner authorization to implement is required (§11), and a further explicit authorization to release, consistent with this project's existing CMS-PO-011/013 pattern of separating design approval, implementation authorization, and release authorization.

---

## 11. Current authorization — design only

This record, once approved as a complete document, authorizes **finalizing this decision document only**. It does not authorize writing an implementation plan, and does not authorize any code, schema, configuration, or CMS content change. Requirement A's decisions (D1–D4) may be planned and implementation-authorized independently of Requirement B once this document is approved — D8 and §3.7 block only Requirement B. Requirement B remains blocked at the design level: D8 blocks its package-generation path entirely, and §3.7 additionally blocks its direct-PDF-delivery branch specifically, regardless of any implementation authorization given to Requirement A.

## 12. Approval

**APPROVED by the Product Owner (chat, 2026-11-09).** The complete revised document — including decisions D1–D4, D5 (Option A — synchronous package generation during the customer request, with no asynchronous queue, background generation, polling, or notifications; strict resource limits must be justified), D6, D7, D9, and D10, all unresolved dependencies and blockers (D8; the §3.7 complete-book designation mechanism), acceptance criteria, security requirements, and release gates — is approved in its current form. No substantive decision was changed by this approval. D8 remains unresolved and blocking for Requirement B's package-generation path; the §3.7 complete-book designation mechanism remains a separate unresolved dependency blocking only Requirement B's direct-PDF-delivery branch. Neither blocks Requirement A.

Separately, the Product Owner has authorized creation of the Requirement A implementation plan (chat, 2026-11-09). That authorization does not extend to Requirement B, to implementation itself, or to release.
