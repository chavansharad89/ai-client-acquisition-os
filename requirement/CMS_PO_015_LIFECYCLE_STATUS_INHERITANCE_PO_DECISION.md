# Governance Record: CMS Lifecycle Status Inheritance (CMS-PO-015)

**Type:** Product Owner decision — **APPROVED** (behavioral decisions LI-001, LI-002, LI-003; chat, 2026-11-09). **Technical decisions TD-001 (enforcement point) and Decision 2 (ancestor-resolution mechanism, Option 4B) are also now APPROVED** (chat, 2026-11-09) — see §9.1 for their exact recorded scope. This is a **new, separate requirement**, independent of CMS-PO-014. It does not merge into, amend, or expand CMS-PO-014's scope in any way — see §10.

**Status: APPROVED — behavioral decisions (LI-001–003) and technical decisions TD-001/Decision 2 (§9.1). Items in §9.2 remain open (not load-bearing for release). Independent security review (§6) has been performed across three rounds, and all three returned APPROVED WITH FINDINGS (no Critical, High, or Medium findings); every Low finding across those rounds (F-01, F-02, R-1, R-2) has since been remediated and independently confirmed closed — see §6 for the full review history. Gates 1–4 are now all satisfied: explicit Product Owner release authorization for CMS-PO-015 was given via chat instruction, 2026-11-10 — see §11. This authorization covers release of CMS-PO-015 only; it does not itself authorize staging, committing, pushing, deployment, any `CMS_ACCESS_CUTOVER_ENABLED` change, or customer cutover, each of which remains its own, separately controlled action.**

---

## 1. Problem statement and business impact

The CMS content model (`content_items`, migration 0062) represents hierarchy via self-referencing `parentId` links, with an independent `DRAFT`/`PUBLISHED`/`ARCHIVED` `status` column on every row — container and asset alike. Today, every customer-facing read path evaluates **only a single row's own `status`** when deciding whether to expose it. No path checks whether any ancestor of that row is itself `DRAFT` or `ARCHIVED`.

This was investigated and independently confirmed in this session (read-only, no code changed) while reviewing a Finding from the CMS-PO-014 Requirement A review: a `PUBLISHED` child whose parent is `ARCHIVED`/`DRAFT` not only remains visible in principle, but — because the parent row is filtered out of the result set before the content tree is built — the child can be **promoted to appear as its own top-level item** in the customer-facing hierarchy, rather than correctly staying hidden as part of a hidden subtree.

**Business impact:** an administrator can archive or draft a top-level section (e.g. to pull an entire module from sale) and reasonably expect everything under it to disappear for customers. Today, any descendant whose own `status` happens to still be `PUBLISHED` remains fully visible and downloadable — and, in the CMS-PO-014 Learning-Path-Selection context specifically, can surface as an unintended, independently-linkable top-level "learning path." This is a content-governance correctness gap, not a theoretical one: it was reproduced by direct code tracing against the real implementation, not assumed.

## 2. Existing behavior and verified evidence

Every claim below was independently re-verified against current source in this session (not merely carried over from the prior investigation).

| Claim | File / line | Verified evidence |
|---|---|---|
| Lifecycle status changes affect exactly one row | `packages/core-cms/src/contentService.ts:140-151` (`setLifecycleStatus`/`archiveContentItem`); `packages/core-cms/src/contentItemRepository.ts:225-238` (`setStatus`); `packages/core-cms/src/testing/fakeContentItemRepository.ts:89-99` | `UPDATE content_items SET status = $2 ... WHERE id = $1` — a single-row `WHERE id = $1`, in both the real Postgres implementation and the fake. No recursive query, no loop over children, in either. |
| Publication queries filter each row by its own status only | `packages/core-cms/src/customerContentService.ts:32-39` (`listPublishedContentForPlans`), `:50-60` (`getPublishedContentItemForPlans`) | `.filter((item) => item.status === 'PUBLISHED')` over a flat list; the single-item lookup checks `item.status !== 'PUBLISHED'` on the fetched row alone. Neither function reads `parentId` or performs any ancestor lookup. |
| Ancestor status is never checked anywhere | Confirmed by the absence of any such check in the two functions above, in `contentService.ts`, and in every DB trigger on `content_items` | Grepped `contentService.ts` for "children"/"descendant"/"cascade" — only hits are unrelated parent-*type* validation at creation time (`assertValidParent`, lines 36-64), not status. |
| The only DB trigger on `content_items` is unrelated to status | `packages/db/prisma/migrations/0062_cms_content_items/migration.sql:109-139` (`enforce_content_item_matches_parent_plan`); `0066_cms_content_item_replacement/migration.sql:119-149` (`enforce_content_item_replacement_same_product`) | Both enforce `owning_product_id` consistency, never `status`. No other `TRIGGER`/`FUNCTION` exists on this table across all six migrations that touch it (0062, 0065–0068). |
| The tree builder promotes a node whose parent is absent from its input to a root | `apps/web/src/cms-admin/contentTree.ts:16-32` (`buildContentTree`) | `const parent = item.parentId ? byId.get(item.parentId) : undefined; if (parent) { parent.children.push(node); } else { roots.push(node); }` — confirmed directly; this is also this function's own documented, deliberate behavior for genuinely malformed/dangling data, not a bug in itself. The problem is **what gets handed to it**: a `PUBLISHED` child whose `ARCHIVED`/`DRAFT` parent has already been filtered out of the list by `listPublishedContentForPlans` arrives here indistinguishable from a true orphan. |
| No governance record, test, or DB constraint anywhere states or assumes an ancestor-status rule | Grepped `requirement/*.md` for "cascade", "descendant", "archiv" in combination; grepped all `*.test.ts` under `packages/core-cms` and `apps/web` for ARCHIVED + parent/child/descendant/cascade combinations | Zero hits. `requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md` (the foundational CMS spec) discusses `ARCHIVED` exclusively as a per-item property (§10) — it never describes a parent/child status relationship. |

**Customer-facing read-path inventory (verified by direct call-site search, not assumed):**

| # | Path | File | Underlying function |
|---|---|---|---|
| 1 | `/access/[productId]` overview/roadmap rendering | `apps/web/app/access/[productId]/page.tsx:88-104` (`cmsLibraryTree`) | `listAccessibleCmsContent` → `listPublishedContentForPlans` |
| 2 | `/access/[productId]/download/[assetId]` | `apps/web/app/access/[productId]/download/[assetId]/route.ts` | `getAccessibleCmsContentItem` → `getPublishedContentItemForPlans` |
| 3 | `GET /api/cms/content` | `apps/web/app/api/cms/content/route.ts` | `listAccessibleCmsContent` → `listPublishedContentForPlans` |
| 4 | `GET /api/cms/content/[id]` | `apps/web/app/api/cms/content/[id]/route.ts` | `getAccessibleCmsContentItem` → `getPublishedContentItemForPlans` |
| 5 | `GET /api/cms/content/[id]/download` | `apps/web/app/api/cms/content/[id]/download/route.ts` | `getAccessibleCmsContentItem` → `getPublishedContentItemForPlans` |

All five converge on exactly two functions in `packages/core-cms/src/customerContentService.ts` — confirmed by direct grep of every call site in `apps/web`, not inferred. (A sixth potential path — the Learning Progress view/complete API — does not yet exist on this branch; `feature/learning-progress` is unmerged per CMS-PO-013 §4. It is noted in §8 as a path to re-check once merged, not included in this inventory as a currently-existing path.)

## 3. Approved decisions

> **LI-001 — DRAFT/ARCHIVED inheritance.** If a parent container has status `DRAFT` or `ARCHIVED`, its entire descendant chain is effectively hidden from customers, irrespective of individual descendants' stored statuses.
>
> **LI-002 — Restoration behavior.** If a parent container is restored to `PUBLISHED`, descendants do not automatically become visible. Every descendant must independently have status `PUBLISHED`.
>
> **LI-003 — Enforcement scope.** The effective-status rule applies to every customer-facing CMS read path, including: published content listing; direct content-item retrieval; asset retrieval; download authorization; and any other customer-facing path that can expose content or grant access to it — **whether that path exists today or is introduced at any point in the future.** This decision is not limited to the specific routes identified at the time of this record (§2's inventory is a snapshot of what exists today, not a closed enumeration of this decision's scope); any new customer-facing CMS read path built after this record is approved is automatically in scope for LI-003 and must enforce the same effective-status rule, without requiring a new Product Owner decision to bring it into scope.

Approved via chat instruction, 2026-11-09. These are behavioral decisions. **No technical implementation mechanism for any of them is approved by this record** — see §9.

## 4. Effective-status definition and examples

**Definition:** an item's **effective status** is `PUBLISHED` if and only if:
1. the item's own stored `status` is `PUBLISHED`, **and**
2. every ancestor in its chain up to the root (walking `parentId` to `parentId` to `parentId`...) also has stored `status` of `PUBLISHED`.

If either condition fails, the item's effective status is **not** `PUBLISHED` ("effectively hidden"), regardless of what triggered the failure. Per the explicit semantics given:
- **The item's own stored status is never changed by this rule.** No physical cascade of status updates ever happens when a parent's status changes (this is explicit in the approved semantics, and consistent with §2's finding that status mutation is already, and remains, single-row-only). Effective status is **computed at read time**, not stored.

**Examples:**

| Root | Section | Topic | Topic's effective status | Why |
|---|---|---|---|---|
| PUBLISHED | PUBLISHED | PUBLISHED | **PUBLISHED** (visible) | Every ancestor and the item itself are `PUBLISHED`. |
| **ARCHIVED** | PUBLISHED | PUBLISHED | **Hidden** | Root ancestor is `ARCHIVED`, even though Topic's own stored status is `PUBLISHED` (LI-001). |
| PUBLISHED | **DRAFT** | PUBLISHED | **Hidden** | An intermediate ancestor (Section), not just the immediate parent, is `DRAFT` — the rule applies at every level, not only the direct parent. |
| PUBLISHED | PUBLISHED | **DRAFT** | **Hidden** | Ordinary case already correctly handled today — the item's own status fails. |
| PUBLISHED (restored from ARCHIVED) | PUBLISHED | PUBLISHED (was always stored as PUBLISHED throughout) | **PUBLISHED** (visible again) | LI-002: nothing needed to change on Topic — its stored status was never touched while Root was archived, so once Root's own status is restored, the computed effective status naturally reflects Topic's unchanged, independently-`PUBLISHED` stored status. |
| PUBLISHED (restored from ARCHIVED) | PUBLISHED | **DRAFT** (an admin manually drafted it while Root was archived) | **Still hidden** | LI-002's explicit point: restoring the parent does not restore a descendant that was independently changed — Topic must *independently* be `PUBLISHED`. |

## 5. In-scope and out-of-scope

**In scope (approved by this record):**
- The behavioral rule in §4, applied to **every customer-facing CMS read path that exposes CMS content or grants access to it — current and future alike**, per LI-003. §2's inventory lists the five paths that exist in the *current* implementation; it is a current-implementation coverage checklist, not an exhaustive limit on this decision's scope. **Any new customer-facing CMS read path introduced after this record is approved, that exposes CMS content or grants access to it, is automatically within LI-003's scope the moment it exists — no additional Product Owner decision is required merely to bring it into scope.** (Consistent with LI-003 in §3 and acceptance criterion 1 in §12.)
- No change to stored data: no migration, no backfill, no physical cascade of status values.

**Explicitly out of scope / not decided by this record:**
- **The implementation mechanism.** Whether effective status is computed via an in-memory ancestor walk, a new recursive-query repository method, a stored/cached column, or any other technique is **not decided here** — see §9.
- Any admin-facing UI indicator explaining *why* a `PUBLISHED` item isn't customer-visible (e.g. "hidden — archived ancestor"). Not required by LI-001–003's literal text; a reasonable follow-up, not authorized here.
- Retroactive cleanup of any content that is *already* orphan-promoted in a live environment today. An operations/content-curation action, not an engineering authorization from this record (parallel to CMS-PO-014 §9.1's existing content-hygiene dependency).
- Any change to CMS-PO-014 (Learning Path Selection or Complete Learning Path Download) — see §10.
- Any change to the legacy, non-CMS `deliverables.ts` manifest path — out of CMS scope entirely, a separate system.

**Note on paths not yet built (e.g. the Learning Progress API) — not an exclusion from scope:**

The Learning Progress API (view/complete routes) is **not** listed above as "out of scope" because it is **not categorically excluded from LI-003** — it is simply absent from §2's current-implementation inventory because `feature/learning-progress` is not yet merged into this branch. Its absence from today's inventory has no bearing on whether LI-003 applies to it once it exists:
- **If**, once merged, any route in that API exposes CMS content **or** grants access to it, that route is automatically within LI-003's scope the instant it exists, by the same automatic-scope principle as §3/§12 — no additional Product Owner decision is required to bring it in.
- **If** a given route only records or updates progress state without exposing content **and** without granting access (e.g. a bare `POST .../progress/view` that writes a tracking row and returns no content), its relationship to LI-003 is not automatic either way. Whether a specific merged route exposes content or grants access is then a **factual determination against that route's real, merged behavior** (per CMS-PO-013 §4's existing merge-sequencing decision) — not a new policy decision about whether LI-003 itself applies to qualifying paths, and not a new approval dependency.
- The separate, narrower, and still-genuinely-open question — whether merely *recording* a view/complete event should itself be blocked for an effectively-hidden item, for a route that neither exposes content nor grants access — is preserved as open in §8, item 5, and is not resolved by this note.

## 6. Security and authorization implications

This rule is a **content-exposure/access-control correctness control**, not a cosmetic one: per §2's verified evidence, its absence allows a customer to view, retrieve, or download content that an administrator intended to withdraw by archiving/drafting a parent. Per this project's engineering policy, any area touching access control to entitled content is security-sensitive **regardless of the size of the eventual diff**. Implementation of this record, once a mechanism is chosen and separately authorized, requires:
- Independent security review before any production-facing code is accepted — the relevant attack surface is a customer reaching content via a direct/remembered id (the single-item paths, #2/#4/#5 in §2's inventory) that a list-level fix alone would not necessarily close; any chosen mechanism must be shown to close all five paths, not just the listing ones.
- Explicit human/Product Owner approval before any production-facing or release action, independent of this record's own approval of the behavioral decisions.
- No change to `requireUser`, `permittedContentPlans`, `canAccessProduct`, or any other existing entitlement/session code — this rule is additive filtering *within* already-permitted content, not a change to who is permitted.
- A fail-closed default for any ancestor-resolution failure (e.g. a missing/unreadable ancestor row, which should not occur given the existing `ON DELETE RESTRICT` foreign key, but must not be assumed impossible): such a failure must result in the item being treated as **not** effectively published, never the reverse. This is a requirement of this record, not a Product Owner decision deferred as "open" — it follows directly from LI-001's hiding behavior and this project's existing no-existence-leak convention (CMS-PO-013 §2a.5).

**Independent security review, round 1 — performed (chat, 2026-11-09).** `octo:personas:security-auditor`, independent of the implementer, reviewed the implementation against this section's requirements. Verdict: **APPROVED WITH FINDINGS** — no Critical, High, or Medium findings; two Low findings (test-coverage gaps: a mixed-sibling-visibility case and a more precise LI-002 restoration test) and several Informational observations (none blocking), none of which identified an authorization bypass. This satisfied this section's independent-review requirement for the reviewed code as it stood at that review's time.

**Remediation and re-review, rounds 2–3 (2026-11-09).** The two Low findings above were remediated with new test coverage, then independently re-reviewed in two further rounds:
- **Round 2** (`octo:droids:octo-security-auditor`, independent of the implementer) verified the remediation of F-01 and F-02. Verdict: **APPROVED WITH FINDINGS** — no Critical, High, or Medium findings; F-01 and F-02 confirmed closed; three further Low/informational items raised (two deferred as optional follow-ups, carried forward as R-1/R-2 below; one misleading test comment, fixed immediately and re-verified).
- **Round 3** (`octo:droids:octo-security-auditor`, independent of the implementer) verified the remediation of R-1 and R-2. Verdict: **APPROVED WITH FINDINGS** — no Critical, High, or Medium findings; R-1 and R-2 confirmed closed; two Informational items raised (I-1, I-2), neither blocking.

| Finding | Outcome |
|---|---|
| F-01 | Closed — mixed-siblings and Plus Learning Path Selection regression coverage added |
| F-02 | Closed — restoration lifecycle test strengthened, including stored-status assertions |
| R-1 | Closed — hidden-content `?path=` deep-link regression coverage added |
| R-2 | Closed — PostgreSQL integration test now verifies stored status and restoration behavior |
| I-1 | Informational — optional follow-up remains open (not required for release) |
| I-2 | Informational — optional follow-up remains open (not required for release) |

No round of this review — rounds 1, 2, or 3 — ever reported a Critical, High, or Medium finding, or identified an authorization bypass. Across all three rounds, this still **does not constitute, and must not be read as, release or customer-cutover authorization** — that remains a separate, explicit Product Owner action per §11.

## 7. Migration and backward-compatibility considerations

- **No schema migration is required or authorized by the behavioral decisions alone** — effective status is computed, not stored (§4). If a future, separately-authorized technical decision (§9) chose to cache or materialize effective status as a stored column, *that* would require its own migration and backfill, authorized separately, not by this record.
- **No existing stored `status` value changes.** Every currently-`PUBLISHED` row remains stored as `PUBLISHED`; only what is *computed and exposed* to customers changes, for the specific cases in §4 where an ancestor is not `PUBLISHED`.
- **Backward-compatibility risk:** any currently-live content that is already in the "orphan-promoted" or "visible descendant under an archived/draft ancestor" state (per §2's finding) will, once this rule is correctly enforced, newly become hidden from customers who could previously see it. This is the *intended* effect of LI-001, not a regression — but it is a real, customer-visible behavior change for any content currently in that state, and should be checked against actual production/staging content (once this application is deployed — it is not yet, per `docs/DEPLOYMENT.md`) before enabling.

## 8. Open questions and risks

1. **Performance of ancestor resolution for the three single-item read paths** (#2/#4/#5 in §2's inventory). The listing paths (#1/#3) already fetch every row for the product via `findAllByOwningProduct`, so an in-memory ancestor walk adds no new query. The single-item paths fetch exactly one row today (`findById`); enforcing this rule for them requires either several additional sequential lookups (bounded by nesting depth, believed shallow — 2-4 levels per the existing "Roadmap/Section/Topic/Lesson" UI depth-label convention, `apps/web/src/cms-admin/contentTree.ts:78-86` — but not empirically measured) or one new recursive-query repository method. This is a real open question, not resolved here — see §9.
2. **Caching/memoization within a single request.** When rendering a full tree (path #1), many nodes share ancestors; whether to memoize ancestor-chain lookups within one request is an efficiency detail, not decided here.
3. **Retroactive visibility of this record's effect on the Learning Path Selection feature (CMS-PO-014).** Correctly enforcing LI-001–003 at the read paths in §2's inventory is expected to also close the orphan-promotion risk flagged in the CMS-PO-014 independent review — because the mechanism that causes orphan-promotion (a filtered-out ancestor) and the mechanism LI-001 asks to be fixed (an unchecked ancestor) are the same underlying gap. This is noted here as a relevant consequence, not a decision — the specific fix is explored, with unresolved options presented, in the companion implementation plan referenced in §9; that plan does not authorize implementation, and no fix is asserted as already true by this record.
4. **Whether this rule should also govern any future admin-facing "preview as customer" feature**, if one is ever built. Not addressed — no such feature exists today.
5. **The Learning Progress API**, once merged (§5) — if a route in it exposes CMS content or grants access, it is automatically covered by LI-003, no new Product Owner decision required. The narrower, separate question — whether merely recording a view/complete event should itself be blocked for an effectively-hidden item, for a route that neither exposes CMS content nor grants access to it, and only records progress against a content-item id — is not answered by LI-003 either way and remains open for that merge's own review.
6. **Concurrent lifecycle updates and consistent reads.** If a parent or ancestor's status changes *while* a customer-facing single-item read is resolving that item's ancestor chain, the read must not make an access decision based on a mixture of pre-change and post-change database states (e.g. treating an item as effectively published because an ancestor was read as `PUBLISHED` a moment before an admin archived it, or the reverse). **Resolved for the single-item resolution path by Decision 2 (§9.1):** the approved Option 4B mechanism inherently provides this — the item and its complete ancestor chain are resolved in one recursive SQL statement, which Postgres evaluates against one snapshot regardless of isolation level, so no separate transaction-isolation-level decision is required for that path. This record does not separately address the list path's consistency beyond what §9.1 records.

## 9. Technical decisions

### 9.1 Approved technical decisions (chat, 2026-11-09)

**TD-001 — Effective-status enforcement point.** Approved enforcement boundary: `packages/core-cms/src/customerContentService.ts`. Its two existing functions, `listPublishedContentForPlans` and `getPublishedContentItemForPlans`, centrally enforce effective publication status. Repository methods retrieve the necessary data; they do not themselves decide what is effectively published. Customer-facing routes and pages must not independently bypass this enforcement boundary. All current and future customer-facing CMS paths that expose content or grant access to it remain covered by LI-003 (§3) — TD-001 fixes *where* that coverage is enforced, it does not change LI-003's own scope.

**Decision 2 — Ancestor resolution: Option 4B (PostgreSQL recursive CTE).** Approved. Binding implementation constraints:
- The requested item and its complete ancestor chain are resolved in one recursive SQL statement.
- The initial item lookup and the ancestor traversal share that same statement's snapshot.
- Sequential per-ancestor lookups (Option 4A) are not used.
- Defensive cycle detection is included.
- A missing ancestor fails closed.
- A query or resolution failure fails closed.
- A missing parent is never treated as a legitimate root item.

Whether the enforcement point is this file, and whether ancestor resolution uses Option 4B, are no longer open questions — see §9.2 for what remains open.

### 9.2 Still requiring further Product Owner / engineering approval (explicitly not approved by this record)

- Whether any caching/memoization is introduced, and if so, its invalidation strategy.
- Whether a stored/materialized effective-status representation is ever introduced (not currently proposed; would need its own migration if chosen).
- The exact 404/not-found response shape for each of the three single-item paths once an item is excluded by this rule — Decision 2 fixes the resolution mechanism, not each route's response contract.
- Exact test strategy and regression scope beyond what the companion implementation plan already specifies (detailed there).

## 10. Relationship to existing governance — CMS-PO-014 is unchanged

**This record does not merge into, amend, supersede, or expand CMS-PO-014** (`requirement/CMS_PO_014_LEARNING_PATH_SELECTION_AND_COMPLETE_DOWNLOAD_PO_DECISION.md`) in any way. CMS-PO-014's approved decisions (D1–D7, D9, D10), its unresolved blockers (D8; the §3.7 complete-book designation mechanism), its acceptance criteria, and its release gates all remain exactly as previously approved, untouched by this record. CMS-PO-015 is a **separate, independent governance record** addressing a distinct gap (ancestor-status enforcement) that happens to have been discovered during CMS-PO-014's independent review, but is not part of CMS-PO-014's scope, Requirement A, or Requirement B. Likewise, this record does not alter CMS-PO-011, CMS-PO-012, or CMS-PO-013.

## 11. Current authorization — technical decisions recorded; implementation separately authorized and reported; Gate 4 release authorization now granted

This amendment records, as resolved: (a) finalizing this decision document and its companion implementation plan, and (b) the technical decisions in §9.1 (TD-001, Decision 2) — satisfying this record's own prior condition that they be "resolved and recorded... before implementation begins." Implementation against these decisions was separately authorized by the Product Owner and has been reported as completed, outside this record; this record does not itself re-verify that report's claims against the code — that verification is the independent security review required by §6, whose findings are recorded in §6's review history rather than rewriting this section. **That review has since been performed, across three rounds, and all three returned APPROVED WITH FINDINGS (no Critical, High, or Medium findings); every Low finding (F-01, F-02, R-1, R-2) has since been remediated and independently confirmed closed, and both I-1 and I-2 remain recorded as optional, open, informational follow-ups — see §6.**

**Gate 4 — explicit Product Owner release authorization: APPROVED, 2026-11-10.** Given via chat instruction, following the same "approved via chat instruction" convention this record already uses for LI-001–003, TD-001, and Decision 2. This authorization was given after, and is expressly conditioned on, Gates 1–3 already being satisfied (TD-001/Decision 2 recorded; implementation separately authorized and reported; the three-round independent security review in §6 closed with no Critical/High/Medium findings and every Low finding remediated). It covers **release of CMS-PO-015 only** — it is not blanket authorization for any other requirement, decision, or change. **This record does not authorize, and this Gate 4 grant does not itself extend to, staging any file, creating a commit, pushing to any remote, deploying, changing `CMS_ACCESS_CUTOVER_ENABLED`, or performing customer cutover — each of those remains its own, separately controlled action requiring its own explicit authorization**, consistent with this project's established CMS-PO-011/013/014 pattern of separating design approval, implementation authorization, and release authorization from the mechanics of shipping a change.

## 12. Acceptance criteria

1. For every customer-facing CMS read path that exposes content or grants access to it — the five currently identified in §2's inventory, and any added after this record is approved (LI-003) — an item whose own stored status is `PUBLISHED` but which has at least one ancestor with status `DRAFT` or `ARCHIVED` is never returned, exposed, or made downloadable to a customer.
2. An item's own stored `status` is never modified as a side effect of an ancestor's status changing (no physical cascade), for any read path or any write path.
3. Restoring a parent to `PUBLISHED` does not, by itself, make any descendant visible unless that descendant's own stored status is independently `PUBLISHED` (LI-002), verified for a descendant left in each of `DRAFT`/`ARCHIVED`/`PUBLISHED` during the parent's archived period.
4. The rule applies identically regardless of nesting depth — an ancestor two or more levels above an item must be checked, not only the immediate parent.
5. A root-level item (no parent) is governed by its own stored status alone, exactly as today — this rule introduces no change for depth-0 items.
6. No existing, currently-passing test for entitlement, publication of a correctly-all-`PUBLISHED` chain, 30-day validity, or download authorization regresses.
7. Every ancestor-resolution failure mode (a missing/unreadable ancestor row) results in the item being treated as not effectively published (fail-closed), never the reverse.
