# Governance Record: Plus/Pro/Max CMS — Final Product Owner Decisions (CMS-PO-001 .. 005, this round) and Read-Only Implementation Audit

**Status:** GOVERNANCE / READ-ONLY AUDIT RECORD ONLY. No application code, schema, migration, database record, or test was changed in producing this record. Not committed. Not pushed. Not deployed.

**Date:** 2026-10-25
**Scope:** Record the Product Owner's final round of Plus/Pro/Max CMS decisions verbatim; determine what existing governance already covers each rule; identify conflicts, implementation gaps, and any genuinely remaining PO decisions. No implementation performed or authorized.

**Identifier-collision notice (read first):** This round's decisions are numbered `CMS-PO-001` through `CMS-PO-005`. Those exact IDs were already used for five *different* decisions in `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md` (dated the same day, earlier in this governance track). That earlier file is **not deleted or rewritten** — per §3/§4 below, each of its seven decisions is either already-governed-and-restated or clarified by this round, and none is contradicted. To avoid ambiguity going forward, this document refers to the earlier file's decisions as `CMS-PO-001(R1)` .. `CMS-PO-007(R1)` and this round's as `CMS-PO-001(R2)` .. `CMS-PO-005(R2)`. **This numbering collision itself is flagged as a documentation issue requiring attention, not silently resolved** — a future housekeeping pass should assign the R1/R2 decisions non-colliding IDs (e.g., renumber R2 as CMS-PO-008..012) so `CMS-PO-00N` always means one thing.

---

## 1. Executive summary

- All five R2 decisions are consistent with, and mostly already implied by, existing governance (`COMMERCIAL-PO-01/02/03`, R1's own `CMS-PO-001(R1)`/`CMS-PO-005(R1)`). None contradicts a written decision. R2's main governance value is **resolving four of the five open questions R1 itself raised** (see §3).
- **No conflicts (category C) were found.** Everything classifies as A (already governed), B (newly decided/clarified), or D (implementation gap).
- **Every piece of required functionality is an implementation gap (D).** Display-name configurability, Max→Plus+Pro inheritance, plan-exclusive content visibility, a CMS, and 30-day expiry for Plus/Pro all require new code; nothing here is already built.
- **No genuine remaining PO decision (category E) was found.** One candidate question (which existing table ₹99/₹499 should use for 30-day tracking) is explicitly ruled out as a PO question by the user's own instruction, since it is an implementation-detail choice, not a policy gap.
- Plan display names ARE currently hardcoded in application code today, confirmed at `packages/catalog/src/products.ts:19,26,33,47` and rendered at 8 customer-facing call sites (§5, item 7).
- Max currently grants **no** access to ₹99/₹499 content of any kind — confirmed gap, already on record from the prior commercial audit (§5, item 6).

---

## 2. The five finalized PO decisions (CMS-PO-001(R2) .. 005(R2)), recorded verbatim

> **CMS-PO-001(R2) — Plan Names Are CMS-Configurable.** Plan/customer-facing names must be configurable/editable from the CMS. The underlying product/SKU identity must remain stable and must NOT depend on the display name. Example: `ai_income_99` → display name could be "Plus"; `ai_freelancing_499` → display name could be "Pro"; `ai_client_acquisition_1499_subscription` → display name could be "Max". If the Product Owner changes a plan name in CMS, the new name must automatically be reflected consistently across the website/platform wherever that plan's customer-facing name is displayed. Changing the display name must NOT change: product/SKU identity; historical purchases; historical entitlements; subscription records; existing customer access; payment records. Do NOT hardcode "Plus", "Pro", or "Max" as permanent product identities.
>
> **CMS-PO-002(R2) — Max Includes Plus + Pro Content.** An active Max entitlement gives the customer access to Max content, Plus content, and Pro content. Max users should NOT require duplicate copies of Plus/Pro content; the CMS/content-access system should reuse the existing Plus and Pro content. The rule is entitlement-based inheritance: Max → Plus + Pro + Max. However: Pro → Pro only; Plus → Plus only. Pro does NOT inherit Plus. Plus does NOT inherit Pro.
>
> **CMS-PO-003(R2) — Strict Content Separation for Plus/Pro.** Customer content visibility must be strictly separated. An active Plus user sees Plus content only. An active Pro user sees Pro content only. A Plus user must NOT see: Pro folders; Pro chapters; Pro topics; Pro files; Pro videos; locked Pro content; Pro-content upgrade prompts inside the CMS/content catalog. There should be no "locked Pro content" presentation. The CMS customer catalog should simply show content the user's active entitlement allows them to access. Max is the exception because Max is explicitly entitled to Plus + Pro + Max.
>
> **CMS-PO-004(R2) — CMS Becomes the Source of Truth.** The CMS becomes the long-term source of truth for all customer-facing content for Plus, Pro, and Max. Content must be managed through CMS rather than being permanently hardcoded into application code. The CMS should support the content-management needs already discussed, including as applicable: content hierarchy; chapters/topics/categories; files/documents; short videos; metadata; ordering; draft/published/archived lifecycle; content updates/replacement. The actual content inventory is NOT being defined in this decision. Do NOT invent or hardcode a specific chapter/topic/file/video inventory. Existing hardcoded content definitions may need migration/retirement as part of implementation, but historical customer/purchase/access data must remain safe.
>
> **CMS-PO-005(R2) — Reuse Existing 30-Day Entitlement Infrastructure.** Plus, Pro, and Max all have 30-day validity. After the 30-day period expires, access to that entitlement's content must become unavailable. Use the existing subscription/entitlement infrastructure for determining active access. Do NOT create a second CMS-specific expiry/access-duration system. Rules: Active Plus → Plus content; Active Pro → Pro content; Active Max → Max + Plus + Pro content; Expired Plus → no Plus access through that expired entitlement; Expired Pro → no Pro access through that expired entitlement; Expired Max → no Max/Plus/Pro access through that expired entitlement. Renewal should follow the existing subscription/entitlement model.

These are Product Owner decisions, recorded verbatim, not reinterpreted. Nothing has been implemented as a result of recording them.

---

## 3. Existing governing decisions found, and classification (A/B/C/D/E)

| R2 decision | A. Already governed by | B. Newly decided/clarified | C. Conflict | D. Implementation gap |
|---|---|---|---|---|
| **CMS-PO-001(R2)** (display names CMS-configurable, SKU stable) | No prior decision separates display name from SKU identity. `ProductId` being a closed, permanent literal union (`packages/catalog/src/types.ts:19-30`, comment: "Never renamed once shipped") already establishes SKU stability as an architectural principle — consistent with, not contradicted by, this decision. | **Yes.** This is the first decision requiring the *name* to be editable independent of code. Also resolves R1's Open Question 1 (confirms Plus=`ai_income_99`, Pro=`ai_freelancing_499`, and introduces Max=`ai_client_acquisition_1499_subscription`). | None | **Yes** — see §5 item 7. |
| **CMS-PO-002(R2)** (Max → Plus+Pro+Max inheritance, no duplication) | **Yes, substantively.** `COMMERCIAL-PO-02` (`requirement/COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md` §A) already decided: "An active ₹1,499 Client Finder subscription grants access to ₹99 kit + ₹499 kit + ₹1,499 Client Finder." | The "do not duplicate content, reuse Plus/Pro content for Max" instruction is a new implementation-level directive not previously stated. Also resolves R1's Open Question 2 (confirms Max inheritance is in scope for the CMS content layer, not just product-level access). | None | **Yes** — see §5 item 6 (Max currently grants zero ₹99/₹499 access). |
| **CMS-PO-003(R2)** (strict Plus/Pro separation, no locked-content UI in the catalog) | **Yes, almost verbatim.** `CMS-PO-001(R1)` already decided: "Plus users can access ONLY Plus content... Pro users do NOT inherit Plus content... There is NO locked Pro-content/upgrade-prompt experience... Do not show content belonging to another plan." | Adds specificity (folders/chapters/topics/files/videos) and — importantly — **resolves R1's Open Question 3** by explicitly scoping the "no locked content" prohibition to "inside the CMS/customer content catalog," distinguishing it from any separate, existing product-level upsell mechanism elsewhere in the app (see §4). | None | **Yes** — no content-item-level, plan-exclusive access control exists at all today (nothing to check this against; see §5 item 8). |
| **CMS-PO-004(R2)** (CMS = source of truth; hierarchy, draft/published/archived; migration of old hardcoded content permitted, historical data safe) | **Yes, mostly.** `CMS-PO-005(R1)` (CMS-managed, not hardcoded; chapter/topic hierarchy; files + short videos) and `CMS-PO-006(R1)` (DRAFT→PUBLISHED→ARCHIVED lifecycle) already decided this. | **Resolves R1's Open Question 4 directly**: explicitly authorizes that "existing hardcoded content definitions may need migration/retirement as part of implementation" — while requiring "historical customer/purchase/access data must remain safe." This settles the tension R1 flagged against `DEC-012`/`DEC-013`'s hardcoded ₹99 bundle: the *static-file representation* may be migrated into CMS form; the *already-paid access and purchase history* of customers who bought under that bundle must not be affected. | None (clarifies, does not contradict, `DEC-012`/`DEC-013` — see §4) | **Yes** — no CMS, no admin UI, no content DB model, no draft/published/archived enum for content exists (see §5 items 9-13). |
| **CMS-PO-005(R2)** (reuse existing subscription/entitlement infra; no second expiry system) | **Yes, on duration.** `COMMERCIAL-PO-01` (30-day periods for all three products) and `CMS-PO-002(R1)` already decided 30-day validity for Plus/Pro. | **Resolves R1's Open Question 5**: explicitly directs reuse of "the existing subscription/entitlement infrastructure" rather than a new CMS-specific one — without mandating a specific existing table, which is correctly left as an implementation choice (see §6, not elevated to a PO question per the user's own instruction). | None | **Yes** — `ai_income_99`/`ai_freelancing_499` have no expiry/period tracking of any kind today (one-time `entitlements` rows only); see §5 item 5. |

---

## 4. Conflicts

**None found.** Specifically:

- CMS-PO-004(R2)'s permission to migrate/retire existing hardcoded content definitions does **not** contradict `DEC-012`/`DEC-013` (the PO-approved, hardcoded 10-asset ₹99 bundle) — it explicitly anticipates and authorizes exactly that migration at implementation time, while ring-fencing historical access/purchase data. This is a **clarification/amendment of mechanism**, not a conflict.
- CMS-PO-003(R2)'s "no locked Pro-content/upgrade-prompt... inside the CMS/customer content catalog" does **not** contradict the existing `/access` page's product-level locked/upsell pattern (`apps/web/app/access/page.tsx` — shows unlocked vs. locked *products* with an upsell CTA, per the prior audit's item 6/15 finding). The user's own special-requirement instruction in this round explicitly draws this line: "Plus users cannot see Pro content" is distinct from "the entire website can never mention that Pro exists." The existing product-level upsell mechanism is **identified here, not removed or preserved as though decided** — its fate (keep, change, or restrict) is not addressed by any decision in this round and is not assumed.

---

## 5. Implementation gaps (D), with citations

1. **Display names are hardcoded in application code today**, not CMS-editable: `packages/catalog/src/products.ts:19` (`'AI Income Starter Kit'`), `:26` (`'AI Freelancing Launch Kit'`), `:33` (`'AI Client Acquisition System'`), `:47` (`'AI Client Finder — 30 Days'`); doc comment at `packages/catalog/src/types.ts:49` confirms this field is "for display (checkout page, receipts, dashboard)." Rendered customer-facing at: `apps/web/app/access/page.tsx:71,76`; `apps/web/app/access/[productId]/page.tsx:54,79` (also used as the page `<title>`); plus `apps/web/app/upsell/[productId]/page.tsx`, `apps/web/app/page.tsx`, `apps/web/app/checkout/[productId]/page.tsx`, `apps/web/src/components/ProductLanding.tsx`, `apps/web/src/components/CheckoutPanel.tsx`, `apps/web/src/components/ProductCard.tsx`. None of these read from a CMS; all read the frozen, compiled-in `PRODUCT_CATALOG`.
2. **Max currently grants zero access to ₹99/₹499** of any kind: `packages/core-subscriptions/src/access.ts:18-52` checks only the single hardcoded `ai_client_acquisition_1499_subscription` slug (per `COMMERCIAL_PO_01_07_...AUDIT.md` §B row 4, re-confirmed here, not re-derived). The implied-lower-tier "ladder" logic (`packages/catalog/src/ladder.ts:16-20`) exists only for the old one-time `ai_client_acquisition_1499` SKU, which is a different product and is retired from new purchases — it is not wired to the subscription at all.
3. **No plan-exclusive, content-item-level access control exists** — only product-level access exists (`apps/web/src/server/access.ts`). Nothing currently checks "does this user's active entitlement cover this specific content item's plan," because no content item exists yet.
4. **No CMS, admin UI, content database model, or draft/published/archived state exists anywhere** in the repository (confirmed by word-boundary search for "cms"/"chapter"/"publish" across `tests/`, `packages/`, `apps/` — zero matches, per the earlier infrastructure audit in this same governance track).
5. **`ai_income_99`/`ai_freelancing_499` have no subscription/expiry tracking today** — both are one-time rows in the `entitlements` table (`packages/db/prisma/migrations/0004_entitlements/migration.sql`), with no `activation_at`/`duration_days`/expiry concept. Only `ai_client_acquisition_1499_subscription` uses the `subscription_periods` table (`packages/db/prisma/migrations/0040_subscription_periods/migration.sql`).
6. **No content hierarchy exists** — `packages/catalog/src/deliverables.ts` models content as one flat array per product (`Record<ProductId, Deliverable[]>`), no chapters/topics.

---

## 6. Reusable existing infrastructure

- **`subscription_periods` table and pattern** (`packages/db/prisma/migrations/0040_subscription_periods/migration.sql`) — already a 30-day, renewable, multi-product-capable period table; satisfies CMS-PO-005(R2)'s "use existing... infrastructure" directive if Plus/Pro are moved onto it. (Whether they are moved onto this table vs. an expiry column added to `entitlements` is an implementation design choice the user's own instruction explicitly says should NOT be escalated into a PO question — see §7.)
- **`PRODUCT_CATALOG` / `ProductId` registry** (`packages/catalog/src/products.ts`, `types.ts`) — the stable-SKU half of CMS-PO-001(R2) is already architecturally guaranteed (closed literal union, "never renamed once shipped"); only the display-name field needs to move off this frozen structure and onto a CMS-backed, overridable source.
- **`/access` and `/access/[productId]` UI shell** (`apps/web/app/access/page.tsx`, `apps/web/app/access/[productId]/page.tsx`) — already renders an arbitrary per-product deliverable list from a signed-download model; reusable as the rendering shell for a future plan-exclusive content catalog, once a content/entitlement model exists to drive it.
- **Local file storage adapter** (`apps/web/src/server/contentStore.ts`) — reusable as a starting point for CMS-PO-004(R2)'s files/videos minimum, though it has no DB-backed metadata, upload path, or draft/published/archived state of its own.
- **`isRetiredFromNewPurchases` pattern** (`packages/catalog/src/products.ts:93-115`) — demonstrates the project's existing convention for "preserve historical resolution, change only forward-looking behavior," directly applicable to CMS-PO-004(R2)'s "historical access/purchase data must remain safe" requirement when old hardcoded content definitions are eventually retired.

---

## 7. Remaining genuine PO decisions

**None identified.** The one candidate — "should ₹99/₹499 reuse `subscription_periods`, or get an expiry column added to `entitlements`?" — is explicitly an unspecified implementation detail, not a policy gap: CMS-PO-005(R2) already states the policy ("use the existing subscription/entitlement infrastructure... do not create a second CMS-specific expiry system") and leaves the specific existing mechanism as an engineering choice, consistent with the user's explicit instruction not to manufacture PO questions out of undesigned implementation details. No other ambiguity rises to the level of a required PO decision.

---

## 8. Recommended next step (recommendation only — not implementation, not authorized by this record)

Resolve the identifier-collision housekeeping item in the header note (so future records don't have two different meanings for "CMS-PO-00N"), then scope implementation in this order, since each is a dependency of the next: (1) move display names off the frozen catalog and onto a CMS-editable source, preserving `ProductId` as the stable key (CMS-PO-001(R2)); (2) give `ai_income_99`/`ai_freelancing_499` a 30-day period mechanism using existing infrastructure (CMS-PO-005(R2)); (3) build the minimal content-item model (plan FK, draft/published/archived enum) and extend subscription access-resolution to express Max→Plus+Pro+Max inheritance (CMS-PO-002(R2)); (4) build the plan-exclusive customer catalog view on top of (3), reusing the `/access` shell (CMS-PO-003(R2)); (5) CMS/admin authoring UI last, since it is the least urgent to prove the access model end-to-end. This is a sequencing suggestion only.

---

## 9. Implementation status

No application code, schema, migration, test, or configuration was changed. No files outside this governance record were created or changed. No commit was made. No push was made. No deployment was made. CMS-PO-001(R2) through CMS-PO-005(R2) have not been implemented.
