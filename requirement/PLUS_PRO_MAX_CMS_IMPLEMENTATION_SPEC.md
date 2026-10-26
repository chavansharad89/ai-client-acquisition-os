# Plus / Pro / Max CMS — Implementation-Ready Technical Specification

**This document is an architecture/specification only. No implementation is authorized by this task.**

No application code, schema, migration, test, or UI was changed in producing this document. Nothing was committed or pushed. No database was modified. This document does not supersede, weaken, or reinterpret `requirement/PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md` — it is built on top of that audit's accepted baseline, cited throughout as **PO-1** through **PO-5**.

**Date:** 2026-10-25
**Baseline governance:** `requirement/PLUS_PRO_MAX_CMS_PO_001_005_FINAL_GOVERNANCE_AUDIT.md` (accepted), `requirement/PLUS_PRO_CMS_PO_001_007_GOVERNANCE_AUDIT.md`, `requirement/COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md`, `requirement/COMMERCIAL_PO_08_12_CANCELLATION_RENEWAL_OLD_DATA_ADDENDUM.md`.

---

## 1. Executive summary

Plus (`ai_income_99`), Pro (`ai_freelancing_499`), and Max (`ai_client_acquisition_1499_subscription`) today have: stable, immutable product identities and hardcoded display names (`packages/catalog/src/products.ts:19,26,47`); a flat, hardcoded content manifest for Plus (10 items) and Pro (3 items) (`packages/catalog/src/deliverables.ts`); no 30-day expiry for Plus/Pro (one-time `entitlements` rows only); and a Max access check that looks at nothing but its own subscription slug (`packages/core-subscriptions/src/access.ts:19`) — it grants zero Plus/Pro access today.

This spec proposes: (1) a thin, CMS-editable display-name overlay that leaves `ProductId` untouched (PO-1); (2) a new `content_items` table with plan ownership, self-referencing hierarchy, and a DRAFT/PUBLISHED/ARCHIVED lifecycle, replacing the hardcoded manifest over time without deleting it immediately (PO-4); (3) a new plan-inheritance resolution function (distinct from the existing one-time-SKU "ladder") that expresses Max → {Plus, Pro, Max} while keeping Plus and Pro mutually exclusive (PO-2/PO-3); (4) moving Plus/Pro onto the existing `subscription_periods` table/pattern already used by Max, instead of a new expiry mechanism (PO-5); and (5) extending the existing download-authorization and `/access` UI pattern to the new model, reusing the signed-grant mechanism as-is.

No conflicts with governance were found. One historical-compatibility question is resolved in §15 by a proposed default (grandfather pre-cutover entitlements, apply 30-day tracking only to new/renewed Plus/Pro access going forward) rather than escalated as a new PO question, since it follows this project's own established precedent (never retroactively alter historical access/purchase data — `COMMERCIAL-PO-06/08`).

---

## 2. Governing PO decisions

Recorded verbatim in the originating request and treated as authoritative and unmodified throughout this document:

- **PO-1** — CMS-configurable plan display names; SKU identity stable and separate from display name; changing a name must not change SKU, historical purchases, payments, subscriptions, entitlements, or access.
- **PO-2** — Max inheritance: Max → Plus + Pro + Max; Pro → Pro only; Plus → Plus only; no content duplication under Max.
- **PO-3** — Strict Plus/Pro content separation; no locked-content/upgrade-prompt presentation inside the CMS/content catalog; this is distinct from any separate site-wide product upsell mechanism, which is documented, not changed, here.
- **PO-4** — CMS is the long-term source of truth for Plus/Pro/Max content; hierarchy, files, short videos, metadata, ordering, draft/published/archived; content inventory not defined here; existing hardcoded content must be migratable without destroying historical customer/purchase/access records.
- **PO-5** — Plus/Pro/Max all 30-day; access determined through existing subscription/entitlement infrastructure, not a new CMS-specific expiry system; renewal follows the existing model.

---

## 3. Current-state architecture (read-only findings, with citations)

### 3.1 Product/catalog
- `ProductId` is a closed string-literal union of 4 ids (`packages/catalog/src/types.ts:19-30`); `PRODUCT_CATALOG` is a frozen `Record<ProductId, Product>` (`packages/catalog/src/products.ts:75-82`), each entry `{id, name, amountPaise, currency, metaValueInr}`.
- Display names are literal strings in this frozen object: `ai_income_99` → `"AI Income Starter Kit"` (`products.ts:19`); `ai_freelancing_499` → `"AI Freelancing Launch Kit"` (`:26`); `ai_client_acquisition_1499_subscription` → `"AI Client Finder — 30 Days"` (`:47`). None currently reads "Plus"/"Pro"/"Max" anywhere.
- `getProduct`/`resolveProduct`/`isValidProductId` (`packages/catalog/src/validate.ts:29-59`) are the only sanctioned lookup paths; `resolveProduct` is the untrusted-input entrypoint, throwing `InvalidProductIdError` on an invalid id.
- `isRetiredFromNewPurchases`/`RETIRED_PRODUCT_IDS` (`products.ts:93-115`) is the existing precedent for "preserve historical resolution, gate only new/forward-looking behavior."

### 3.2 Access/entitlement
- **`entitlements` table** (`packages/db/prisma/migrations/0004_entitlements/migration.sql:30-63`, plus `user_id` added by `0038_claim_tokens_and_account_linkage/migration.sql:36-41`): `id, customer_email, product_slug, order_id, granted_at, revoked_at, revoked_reason, created_at, updated_at, user_id`. One-time, no expiry column. Unique on `(customer_email, product_slug)`. Two triggers (`entitlements_require_capture`, `entitlements_match_order`, same file lines 70-131) enforce payment-backed, order-consistent rows — this project's established pattern of enforcing cross-row invariants with DB triggers, not just application code.
- **`subscription_periods` table** (`packages/db/prisma/migrations/0040_subscription_periods/migration.sql:32-68`): `id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, activation_at, duration_days, refunded_at, created_at, updated_at`. No stored `expires_at`/`status` — expiry is computed as `activation_at + duration_days` at read time; `duration_days` is snapshotted per-row, never recomputed from current config. Unique on `razorpay_payment_id` (idempotency).
- **`packages/core-subscriptions/src/access.ts`** (full file): `CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG = 'ai_client_acquisition_1499_subscription'` (line 19) — hardcoded, singular. `findActiveClientFinderSubscriptionPeriod` (37-43), `hasClientFinderAccess` (53-68), `requireClientFinderAccess` (71-79), `getClientFinderSubscriptionStatus` (92-104, computes `expiresAt = activationAt + durationDays*MS_PER_DAY`). **This module checks nothing but the Max slug — it has no path to Plus/Pro access today.**
- **`packages/catalog/src/ladder.ts`** (full file, 47 lines): `PRODUCT_LADDER = ['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499']` — cumulative tiers for the **old one-time** SKU chain only. `tierOf('ai_client_acquisition_1499_subscription')` returns `-1`; `impliedProductIds` returns only the product itself for the subscription SKU. **This ladder is not reusable for Max→Plus+Pro inheritance** — it is tier-cumulative (each tier implies all lower tiers) whereas Max's inheritance is star-shaped (Max implies Plus and Pro; Plus and Pro do not imply each other), and it structurally excludes the subscription SKU.
- **`packages/core-entitlements/src/funnel.ts`** (`accessibleProducts`, `canAccessProduct`, lines 21-32) — one-time-product access, built on `ladder.ts`. **`packages/core-entitlements/src/delivery.ts`** (`authorizeDownload`, lines 48-86) — four-step check: identity → `canAccessProduct` → signed-grant verification → `findDeliverable` asset lookup.

### 3.3 Existing Plus/Pro content
- `packages/catalog/src/deliverables.ts` (full file, 189 lines) is the entire content definition for both products:
  - `ai_income_99`: 10 flat `Deliverable` entries (`{id, title, kind, storageKey, bytes}`), lines 27-98.
  - `ai_freelancing_499`: 3 flat entries, lines 99-121.
  - `ai_client_acquisition_1499_subscription`: `[]` (deliberately empty — pure time-bounded feature access, not downloadable files, per the module's own comment lines 152-157).
  - No hierarchy of any kind (flat array per product); no status field; no plan-separation concept beyond "which product's array it's in."
- **Storage**: `apps/web/src/server/contentStore.ts` (47 lines) resolves `storageKey` under a local `CONTENT_ROOT = path.resolve(process.cwd(), 'content')` via `fs.readFile`, with a `startsWith(CONTENT_ROOT)` guard (line 28). Its documented safety invariant: `storageKey` is trusted **only because it always originates from the frozen catalog manifest, never from a request** (file header comment, lines 18-24). No object storage; `CONTENT_TYPES` maps `AssetKind`→MIME (lines 38-43).
- **Download route**: `apps/web/app/api/downloads/[productId]/[assetId]/route.ts` (142 lines) — 9-step authorization: valid product id → session → user+active entitlements → `canAccessProduct` (ladder-aware) → grant param present → `verifyDownloadGrant` (HMAC, 10-min TTL, defined `packages/core-entitlements/src/downloadGrant.ts:60-125`) → claims match URL → `findDeliverable` → `readDeliverableFile` → stream with headers. Re-verifies entitlement server-side independent of what the UI shows — the right defense-in-depth pattern to replicate for CMS content.
- **Customer UI**: `apps/web/app/access/page.tsx` (library/dashboard) and `apps/web/app/access/[productId]/page.tsx` (per-product deliverable list, calls `createDownloadGrant` at line 42) — both already generalize over "an arbitrary deliverables array," not hardcoded counts.

### 3.4 Existing Max behavior, traced end to end
`purchase` → Razorpay subscription checkout (not re-audited in depth here; out of scope of this spec's changes) → `subscription.charged` webhook (`packages/core-payments/src/webhookHandler.ts:355-397`) → inserts a `subscription_periods` row with `productSlug` **hardcoded to the literal `'ai_client_acquisition_1499_subscription'`** (line 384, not derived from the webhook payload), `userId` from the Razorpay subscription's `notes.userId`, `activationAt = verified.receivedAt`, `durationDays` from `deps.clientFinderSubscriptionDurationDays` (default 30) → `packages/core-subscriptions/src/access.ts` checks only this one slug → Client Finder UI (`apps/web/app/(client-finder)/...`) gates via `requireClientFinderAccess`.

**Where the missing Plus/Pro inheritance must be implemented:** nowhere today does anything query `ai_income_99`/`ai_freelancing_499` entitlements when resolving Max access. The gap is squarely inside (or alongside) `packages/core-subscriptions/src/access.ts` — it needs a new function that, given an active Max subscription period, also resolves Plus/Pro content permission (§8).

### 3.5 Admin/RBAC
`grep -rn "role" packages/core-identity/src/` → zero matches. Broader grep across `core-identity`, `core-entitlements`, `core-subscriptions`, and the Prisma schema dir for `role|isAdmin|admin_flag` → zero matches. `StoredUser` (`packages/core-identity/src/types.ts:1-6`) is `{id, email, createdAt}` only. The `users` table (`packages/db/prisma/migrations/0012_user_identity/migration.sql:19-29`, plus additive columns in `0038`/`0043`) has no role/permission column. **No admin authentication or authorization architecture exists anywhere in this repository.** This spec does not invent one (§7, §13) — it flags this as a required new surface with a dependency marker, per the explicit instruction not to invent RBAC without evidence.

### 3.6 Schema-tooling note
`packages/db/prisma/schema.prisma` declares (header comment) it intentionally models only 6 tables (`Order, Payment, WebhookEvent, MetaEvent, IdempotencyReconciliation, ProductionIndexMigration`); `entitlements`, `users`, `subscription_periods`, `access_tokens`, `claim_tokens`, `activation_tokens` exist only as hand-authored SQL migrations with no corresponding Prisma model. Any new CMS tables should follow the same hand-authored-SQL-migration convention already used for every access/identity table in this repo, not the Prisma schema file.

---

## 4. Target-state architecture (overview)

```
Admin (new auth surface, §7)
   │  writes
   ▼
content_items (new table, §6)  ──┐
   │  owning_product_id           │  plan_display_names (new table, §5)
   ▼                              │
Customer request                 │
   │                              ▼
   ├─ active entitlements/subscription_periods (existing + extended, §9)
   │        │
   │        ▼
   │  permittedContentPlans(userId)  (new function, §8 — NOT the old ladder)
   │        │
   │        ▼
   └─ query content_items WHERE owning_product_id IN permitted AND status='PUBLISHED'
            │
            ▼
      Customer catalog UI (extends existing /access shell, §11)
            │
            ▼
      Download route (extends existing route, §12) — re-verifies permission + status server-side
```

Nothing above requires changing `ProductId`, `PRODUCT_CATALOG`, `orders`, `payments`, or any historical row in `entitlements`/`subscription_periods`.

---

## 5. Plan naming model (PO-1)

**Design:** a thin, additive overlay table — never a change to `ProductId` or `PRODUCT_CATALOG`.

```sql
-- Conceptual only — not a migration file.
CREATE TABLE "plan_display_names" (
    "product_id"  TEXT PRIMARY KEY REFERENCES <ProductId domain, app-enforced>,
    "display_name" TEXT NOT NULL,
    "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by"   TEXT  -- nullable until admin auth (§7) exists; FK to an admin identity once it does
);
```

- `product_id` is the row's key and is drawn from the existing closed `ProductId` union — this table **extends** the catalog, it does not duplicate or replace it. No new identity is created; this directly satisfies "do not make SKU/product IDs editable through the plan-name UI" and "do not create duplicate product identities."
- Resolution function `resolveDisplayName(productId): string` — checks `plan_display_names` for an override row; falls back to `PRODUCT_CATALOG[productId].name` (today's hardcoded string) if no row exists. This makes the feature additive and zero-risk at cutover: with an empty table, every display name is byte-identical to today's hardcoded value.
- All 8 existing customer-facing render sites (`apps/web/app/access/page.tsx:71,76`; `apps/web/app/access/[productId]/page.tsx:54,79`; `apps/web/app/upsell/[productId]/page.tsx`; `apps/web/app/page.tsx`; `apps/web/app/checkout/[productId]/page.tsx`; `ProductLanding.tsx`; `CheckoutPanel.tsx`; `ProductCard.tsx`) must be changed to call `resolveDisplayName(productId)` instead of reading `product.name` directly — this is the one place behavior must change everywhere "consistently," per PO-1.
- `orders.product_name` (`packages/db/prisma/migrations/0001_init/migration.sql:35-59`) is a **historical snapshot** column, frozen post-payment by the `orders_financials_frozen` trigger (`0003_payment_integrity_constraints/migration.sql:121-145`) — it must **not** be retroactively rewritten when a display name changes, since PO-1 explicitly says changing a name must not change historical purchases. This column simply keeps whatever name was in effect at order time; `plan_display_names` governs only forward-looking, current display.

---

## 6. Content model (PO-2, PO-3, PO-4)

**Design:** one self-referencing table, `content_items`, modeling both containers (chapter/topic/folder) and leaf assets (file/video) — the minimum structure flexible enough for "chapter-wise, topic-wise, or another supported hierarchy" without inventing a specific inventory.

```sql
-- Conceptual only — not a migration file.
CREATE TABLE "content_items" (
    "id"                TEXT NOT NULL PRIMARY KEY,
    "owning_product_id" TEXT NOT NULL,               -- app-enforced: one of 'ai_income_99' | 'ai_freelancing_499' | 'ai_client_acquisition_1499_subscription'
    "parent_id"         TEXT REFERENCES "content_items"("id") ON DELETE RESTRICT,
    "node_type"         TEXT NOT NULL,                -- 'CONTAINER' | 'ASSET'
    "asset_kind"        TEXT,                         -- 'pdf' | 'zip' | 'sheet' | 'video' | ... ; NULL for CONTAINER
    "title"             TEXT NOT NULL,
    "description"       TEXT,
    "storage_key"       TEXT,                         -- NULL for CONTAINER; required for ASSET
    "bytes"             BIGINT,                       -- NULL for CONTAINER
    "order_index"        INTEGER NOT NULL DEFAULT 0,
    "status"            TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    "archived_at"        TIMESTAMP(3),
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_items_node_shape" CHECK (
      ("node_type" = 'ASSET' AND "storage_key" IS NOT NULL AND "asset_kind" IS NOT NULL)
      OR
      ("node_type" = 'CONTAINER' AND "storage_key" IS NULL AND "asset_kind" IS NULL)
    ),
    CONSTRAINT "content_items_status_valid" CHECK ("status" IN ('DRAFT','PUBLISHED','ARCHIVED')),
    CONSTRAINT "content_items_archived_consistency" CHECK (
      ("status" = 'ARCHIVED' AND "archived_at" IS NOT NULL) OR
      ("status" != 'ARCHIVED' AND "archived_at" IS NULL)
    )
);

CREATE INDEX "content_items_owning_product_id_idx" ON "content_items"("owning_product_id", "status");
CREATE INDEX "content_items_parent_id_idx" ON "content_items"("parent_id");

-- Trigger (conceptual), following this repo's existing convention of enforcing
-- cross-row invariants with BEFORE INSERT/UPDATE triggers rather than application
-- code alone (precedent: entitlements_require_capture, entitlements_match_order,
-- payments_match_order — packages/db/prisma/migrations/0003_.../migration.sql,
-- 0004_.../migration.sql):
--   enforce_content_item_matches_parent_plan — a child's owning_product_id must
--   equal its parent's owning_product_id. A content item never changes plan by
--   virtue of being nested; this is what makes "exactly one plan per item" hold
--   even inside a hierarchy, satisfying PO-3/CMS-PO-003(R1).
```

- **One content item belongs to exactly one plan** (PO-3): enforced by the single non-nullable `owning_product_id` column and the proposed trigger above — no many-to-many join table exists, satisfying the explicit "no M2M" instruction from the R1 governance round.
- **Max does not duplicate Plus/Pro content** (PO-2): Max's own content (if any) is simply rows with `owning_product_id = 'ai_client_acquisition_1499_subscription'`. Plus/Pro content stays owned by `ai_income_99`/`ai_freelancing_499` respectively. Inheritance is expressed **only** at the access-resolution layer (§8), never by copying rows.
- **Hierarchy**: `parent_id` self-reference supports arbitrary depth (chapter → topic → file, or just file directly under a product root with `parent_id = NULL`) without a fixed schema for "chapter" vs "topic" — satisfying "flexible enough that chapters/topics can be changed through CMS without application code changes." No specific hierarchy is invented here, per PO-4's explicit instruction.
- **Versioning**: not included. The current system has no versioning concept anywhere (the manifest is simply edited in git); PO-4 asks only for "content updates/replacement," which an in-place `UPDATE` on `content_items` satisfies. Full version history is listed as a non-goal (§20) unless a future decision requires it.
- **Lifecycle** (PO-4/PO-6(R1)): see §10 for the full published/draft/archived semantics.

---

## 7. Admin authentication/authorization — explicit gap, not invented

No role, admin flag, or RBAC concept exists anywhere in this repository (§3.5). This spec **does not design a specific admin authentication architecture**, per the explicit instruction not to invent one without evidence. What is established, so a future design has a starting point:

- The only existing identity primitive is `core-identity`'s session/user model (`StoredUser {id, email, createdAt}`, `packages/core-identity/src/session.ts`), with no notion of privilege above "is a logged-in user."
- Any CMS write endpoint (create/edit/publish/archive content, edit a plan display name) needs an authorization check that does not exist today in any form — not a missing feature of an existing gate, a **wholly new gate**.
- This is called out as a **Phase 2 dependency** (§17) and a **risk** (§19), not specified further here.

---

## 8. Access/entitlement model (PO-2, PO-3, PO-5)

**New function, distinct from `ladder.ts`:**

```ts
// Conceptual signature only — not implementation.
// Lives alongside packages/core-subscriptions/src/access.ts or as a new
// sibling module; must NOT reuse packages/catalog/src/ladder.ts, whose
// cumulative-tier semantics (and exclusion of the subscription SKU — see
// §3.2) do not match Max's star-shaped inheritance.

const CMS_PLAN_INHERITANCE: Record<CmsPlanProductId, readonly CmsPlanProductId[]> = {
  ai_income_99: ['ai_income_99'],
  ai_freelancing_499: ['ai_freelancing_499'],
  ai_client_acquisition_1499_subscription: [
    'ai_income_99',
    'ai_freelancing_499',
    'ai_client_acquisition_1499_subscription',
  ],
};

async function permittedContentPlans(deps, userId, now = new Date()): Promise<ReadonlySet<CmsPlanProductId>> {
  // 1. Determine the set of CMS-eligible products with CURRENTLY ACTIVE access
  //    for this user (expired/revoked excluded) — see §9 for how Plus/Pro
  //    "active" is determined during and after the 30-day migration.
  // 2. Expand each active product id through CMS_PLAN_INHERITANCE.
  // 3. Return the union.
}
```

- `CmsPlanProductId` is explicitly **not** the full `ProductId` union — it is restricted to the three ids PO-1/PO-2/PO-3/PO-5 actually discuss (`ai_income_99`, `ai_freelancing_499`, `ai_client_acquisition_1499_subscription`). The old, retired one-time `ai_client_acquisition_1499` SKU is **out of scope** of this inheritance map — no PO decision in this track defines it as Plus/Pro/Max, and it is excluded from `PRODUCT_LADDER`'s subscription-adjacent logic already (§3.2).
- **Access rule verification against PO-5's explicit table:**
  - Plus active → `permittedContentPlans` = `{ai_income_99}` → sees Plus content only. ✓
  - Pro active → `{ai_freelancing_499}` → Pro content only. ✓
  - Max active → `{ai_income_99, ai_freelancing_499, ai_client_acquisition_1499_subscription}` → Plus + Pro + Max. ✓
  - Any expired → excluded from step 1 above → contributes nothing to the union. ✓
- **Content query**: `content_items WHERE owning_product_id IN permittedContentPlans(userId) AND status = 'PUBLISHED'` is the entire customer-catalog authorization rule. This is also exactly where PO-3's "no locked-content presentation" is satisfied structurally — a Pro-only row is never selected by a Plus-only query in the first place, so there is nothing to hide or grey out; it simply isn't in the result set.
- This function is **additive** — it does not change `hasClientFinderAccess`/`requireClientFinderAccess` (§3.2), which continue to gate the Client Finder *product feature* exactly as today. It is a new, CMS-content-specific resolution path.

---

## 9. 30-day model (PO-5)

**Current state:** Max uses `subscription_periods` (time-bounded, computed expiry, renewal = new row per `subscription.charged`, §3.2/§3.4). Plus/Pro use `entitlements` (one-time, no expiry column, perpetual by construction).

**Target state:** Plus/Pro purchases and renewals also write `subscription_periods` rows, reusing the existing table and computed-expiry pattern — **no second expiry mechanism**, per PO-5's explicit instruction.

**What must change to get there (engineering-level, not decided here):**
1. The `subscription.charged` webhook handler (`packages/core-payments/src/webhookHandler.ts:384`) currently **hardcodes** `productSlug: 'ai_client_acquisition_1499_subscription'` — this must become parametric (read from the Razorpay subscription's plan/notes, the same way `userId` already is at line 376-381) once Plus/Pro can also be purchased as recurring subscriptions.
2. Checkout (`create-subscription`) must support creating a Plus or Pro subscription, not only the Max one — out of scope to design further here; flagged as a dependency (§17).
3. `permittedContentPlans` (§8) must check `subscription_periods` for `ai_income_99`/`ai_freelancing_499` the same way `findActiveClientFinderSubscriptionPeriod` already does for Max (`core-subscriptions/src/access.ts:37-43`) — i.e., generalize that function over `productSlug` rather than hardcoding it.
4. Renewal reuses the existing model exactly: each successful recurring charge inserts a new, independent `subscription_periods` row (never mutates a prior one) — already true today for Max (§3.4) and requires no new mechanism for Plus/Pro once (1)-(3) exist.

**Historical-record consideration (PO-4/PO-5's "historical data must remain safe"):** existing Plus/Pro customers hold **non-expiring** `entitlements` rows today (sold before any 30-day concept existed for these products — confirmed no expiry field exists, §3.2; also consistent with `NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md` DEC-010, which never mentions expiry). PO-5 states the steady-state rule ("expired Plus → no Plus access") but does not, in its literal text, address what happens to these already-sold, never-expiring rows.

**Proposed default (architecture decision, not a new PO decision):** leave pre-cutover `entitlements` rows for `ai_income_99`/`ai_freelancing_499` untouched and perpetually valid — i.e., `permittedContentPlans` treats a non-revoked legacy `entitlements` row as a standing, non-expiring grant, exactly as it resolves today, **in parallel with** the new `subscription_periods`-based 30-day model applying to every purchase/renewal from the CMS cutover forward. This is not a new PO decision because it requires no policy input beyond what is already established elsewhere in this project: `COMMERCIAL-PO-06/08` already set the precedent of never retroactively altering historical purchase/access data without a separate, explicit authorization, and PO-4 itself requires "historical customer/purchase/access data must remain safe" for the content-migration case specifically. The same principle is applied here to the entitlement-migration case. **If this reading is wrong — i.e., if the Product Owner intends existing Plus/Pro customers to start a 30-day clock retroactively from the CMS cutover date — that would be a new, explicit policy decision requiring its own confirmation before implementation, since it could remove access customers reasonably believe they already paid for perpetually.** No other open question meets this bar; see §17.

---

## 10. Lifecycle (PO-4, PO-6(R1))

`DRAFT → PUBLISHED → ARCHIVED`, on the `status` column (§6).

| State | Admin visibility | Customer visibility (via `permittedContentPlans` query, §8) |
|---|---|---|
| DRAFT | Visible, editable | **Not visible** — excluded by the `status = 'PUBLISHED'` filter, regardless of entitlement. |
| PUBLISHED | Visible, editable | Visible **only** if the viewer's `permittedContentPlans` includes `owning_product_id`, per §8. |
| ARCHIVED | Visible (PO-4: "remains available to administrators"), editable (e.g., to republish) | **Not visible** — same filter exclusion as DRAFT. This holds even for a customer who still holds an active entitlement for that plan: archival removes content from "normal customer-facing published content" (PO-4) independent of entitlement status. |

- **Archived ≠ deleted**: `status = 'ARCHIVED'` sets `archived_at`, row stays in `content_items` indefinitely. This satisfies the earlier round's `CMS-PO-004(R1)` ("archive rather than permanent delete") and PO-4's migration-safety requirement.
- **Recoverable**: yes — an admin can set `status` back to `PUBLISHED` (un-archive), since the row and its metadata/history are retained, not purged.
- **Enforcement must be server-side at every read path, not just the catalog list** — the same `status = 'PUBLISHED'` check must be re-applied at download-grant verification time (§12), not only when building the customer's catalog page. Hiding an archived item from a list view but still serving its file to a direct/remembered URL would violate PO-4; the request's own §7 makes this explicit ("not sufficient to hide... in the UI").

---

## 11. Customer workflow

Extends the existing `/access` and `/access/[productId]` shell (§3.3) — not a new UI paradigm.

- **Active Plus**: Login → `/access` → shows a Plus-branded entry (display name from §5) → drills into `/access/ai_income_99` (or a CMS-specific route) → lists `content_items` where `owning_product_id = 'ai_income_99'` and `status = 'PUBLISHED'`, in `parent_id`/`order_index` tree order → chapters/topics/files/videos as modeled. No Pro entry appears (per §8's query, Pro is simply absent from `permittedContentPlans`, not shown-and-disabled).
- **Active Pro**: symmetric — only Pro content, no Plus content "unless another active entitlement explicitly grants Plus" (quoting the request) — i.e., a customer who separately owns both Plus and Pro sees both, each resolved independently through §8; this is not a special case, it falls out of the union naturally.
- **Active Max**: sees Plus + Pro + Max content merged into one catalog view (or clearly sectioned — a UI-layer choice, not a PO decision), with no duplicated rows, since the underlying query returns each `content_items` row exactly once regardless of how many of the three plans the viewer's `permittedContentPlans` set contains.
- **Expired** (any plan): that plan's `owning_product_id` drops out of `permittedContentPlans` → its content disappears from the catalog and its direct download links 403, exactly as an unentitled product does in today's download route (§3.3) — same mechanism, new plan set.
- **Migration note**: today's `/access/[productId]` page reads `deliverablesFor(productId)` directly from the hardcoded manifest; the target state reads from `content_items` instead. Per §14, both can coexist during a transition window.

---

## 12. Storage/file delivery

- **Reused as-is**: `createDownloadGrant`/`verifyDownloadGrant` (HMAC-SHA256, base64url, 10-minute TTL, `packages/core-entitlements/src/downloadGrant.ts`) — the signed-grant mechanism is plan-agnostic already (it signs `{productId, assetId, customerEmail, expiresAt}`); it needs no change to secure CMS-served files, only a call-site update to populate `assetId` with a `content_items.id` instead of a `Deliverable.id`.
- **Changed**: the download route's authorization chain (§3.3) must replace step 4 (`canAccessProduct`, old ladder) with `permittedContentPlans(userId)` (§8), and must replace step 7 (`findDeliverable`, manifest lookup) with a `content_items` lookup by id that **also requires `status = 'PUBLISHED'`** — an archived or draft item must 404 exactly like an unknown asset, not merely be hidden from the listing (§10).
- **Storage trust model — a real change, flagged as a security item (§13)**: today's `contentStore.ts` safety argument is "`storageKey` only ever comes from the frozen, compile-time catalog, never from a request" (§3.3). Once `storage_key` is admin-entered, DB-stored data, that argument no longer holds as stated — an admin-facing upload/edit path must generate or validate `storage_key` server-side (e.g., a generated opaque key, never a client-supplied path string) so the existing `startsWith(CONTENT_ROOT)` guard remains a backstop, not the only line of defense. This is a necessary design point for whoever builds the admin upload path, not an implementation decision made here.
- **Video**: the existing single whole-file response model (`contentTypeFor('video') → 'video/mp4'`, no range requests) is carried forward as sufficient for PO-4's literal "short videos" requirement. Range-request/streaming support is listed as a non-goal unless a future decision requires it (§20).

---

## 13. Security/authorization

| Boundary | Current state | Required for CMS |
|---|---|---|
| Admin authentication | **Does not exist** (§7). | New gate required before any write endpoint ships. Not designed here. |
| Admin authorization/RBAC | **Does not exist**. | Same as above — likely a minimal "is this user an admin" check, not a full permission matrix, per the request's explicit "do not over-design" instruction. |
| Customer entitlement checks | Exists for one-time products via `canAccessProduct`/ladder (§3.2); exists for Max via its own slug check only. | New `permittedContentPlans` (§8), checked server-side at both the catalog-query layer and the download-route layer — **both**, not just one, per §10/§12. |
| Cross-plan content leakage | N/A (no content-item-level model exists yet). | Structurally prevented by the `owning_product_id IN permittedContentPlans` filter at the query layer (§8) — there is no "locked item" object ever constructed for a plan the viewer lacks, so there is nothing to leak via a client-side bug that might otherwise render a disabled/greyed item. |
| Direct URL access to inaccessible files | Already defended today — the download route re-verifies entitlement server-side regardless of how the URL was obtained (§3.3). | Same pattern, extended to re-verify `permittedContentPlans` **and** `status = 'PUBLISHED'** at request time (§12), not cached from an earlier page load. |
| Archived content access | N/A today. | Must 404 at the download route even for an entitled, previously-valid link (§10/§12) — admins exempted via a separate admin-only read path, not the customer download route. |
| Expired entitlement access | Already defended for one-time products (`canAccessProduct` re-checked per request) and for Max (`hasClientFinderAccess` re-checked per request, no caching in a long-lived token). | Same pattern must hold for the new `permittedContentPlans` — compute fresh per request, same as today's `getClientFinderSubscriptionStatus`. |
| Max inherited access | N/A today (Max currently grants nothing extra). | Covered by `CMS_PLAN_INHERITANCE` expansion inside `permittedContentPlans` (§8) — a single function, so there is one place this rule can drift, not several. |
| File/download authorization | Signed grant + server-side re-check, both required today (§3.3). | Unchanged mechanism; new content source, same two-factor requirement (grant **and** live entitlement/status check — neither alone is sufficient, matching the existing route's own design). |

---

## 14. Hardcoded-content migration strategy (PO-4)

1. **What exists today**: `packages/catalog/src/deliverables.ts` — 10 Plus items, 3 Pro items, flat, no hierarchy, no lifecycle (§3.3, full manifest quoted in the research pass behind this spec).
2. **Where represented**: a compiled TypeScript module (code, not data) plus physical files under a local `content/` directory read by `contentStore.ts`.
3. **Mapping into the CMS model**: each `Deliverable` → one `content_items` row, `node_type = 'ASSET'`, `owning_product_id` = its current `ProductId`, `parent_id = NULL` (flat, matching today's structure exactly — **no hierarchy is invented** during migration, per PO-4's explicit instruction; chapters/topics can be introduced afterward by an admin), `storage_key` copied **unchanged** (so no physical file move is required), `status = 'PUBLISHED'` (not `DRAFT` — see point 8).
4. **Historical access behavior preserved**: reuse each `Deliverable.id` string verbatim as the new `content_items.id`. Because `createDownloadGrant`'s TTL is only 10 minutes (§3.3), there are no long-lived old links to worry about breaking; what matters is that any *newly generated* grant for the same asset id continues to resolve, which it does as long as the id and `storage_key` are carried over unchanged.
5. **Code eventually removable**: `packages/catalog/src/deliverables.ts`'s `MANIFEST`/`DELIVERABLES`/`deliverablesFor`/`findDeliverable`/`allDeliverables` — once `content_items` is verified as the live source in production.
6. **Code that must remain**: `ProductId`/`PRODUCT_CATALOG` (PO-1, untouched); `entitlements` table and its historical rows (untouched by content migration — this is a separate migration from the 30-day/entitlement one, §9); `contentStore.ts`'s path-traversal guard (retained regardless of where `storage_key` values originate, §12); `createDownloadGrant`/`verifyDownloadGrant` (retained as-is); `ladder.ts`/`funnel.ts` (govern the **old, separate, still-retired** one-time `ai_client_acquisition_1499` SKU and any product-level upsell mechanism — explicitly out of scope of this migration, per PO-3's instruction to document, not change, that separate mechanism).
7. **One-time or incremental**: **incremental**, with a parallel-run window. A one-time backfill script (not an auto-run migration) populates `content_items` from `deliverables.ts`. The existing download route and `/access/[productId]` page keep working against the old manifest **unchanged** until the new `content_items`-backed path is verified; only then does the route/page cut over to read from `content_items`; only after that is the old manifest module deleted (point 5).
8. **Avoiding breakage for existing customers**: migrated rows must be inserted as `status = 'PUBLISHED'`, never `DRAFT`/`ARCHIVED` — these customers already see this content today, so the migration is a storage-layer change, not a customer-visible content change. `storage_key` values and asset ids are preserved unchanged (point 4) specifically so no physical reorganization is needed. The content migration does not touch `entitlements` rows at all (point 6) — it is decoupled from the 30-day/entitlement migration in §9, which is a separate, later concern.

---

## 15. Historical compatibility

| Data | Must remain safe because | How this spec preserves it |
|---|---|---|
| `ProductId` / `PRODUCT_CATALOG` | PO-1: SKU identity must not depend on display name. | §5 — display names live in a new, separate table; `ProductId` is never edited. |
| `orders.product_name` | PO-1: historical purchases must not change. | §5 — this column is a frozen-at-order-time snapshot, untouched by `plan_display_names`. |
| `entitlements` rows (Plus/Pro, pre-cutover) | PO-4/PO-5: historical access/purchase data must remain safe. | §9 — proposed default is to leave these rows as standing, non-expiring grants, resolved in parallel with the new 30-day model for new/renewed access. |
| `subscription_periods` rows (Max) | Untouched by this spec — no Max-specific schema change proposed. | Not modified; `CMS_PLAN_INHERITANCE` only reads these rows, never writes them differently than today. |
| Physical content files under `content/` | PO-4: existing hardcoded content must be migratable without destroying historical access. | §14 — `storage_key` values are carried over unchanged; no file move required. |
| Existing download links in flight | Same as above. | §14 point 4 — 10-minute grant TTL means no long-lived link outlives a migration window; new grants resolve identically post-migration. |

---

## 16. Test strategy

Following this repo's existing convention (colocated `*.test.ts` next to source; cross-cutting flows in `tests/integration/`, confirmed by directory listing in §3):

- **Plan naming**: unit test for `resolveDisplayName` (override present / absent / updated) — likely colocated next to wherever it's implemented (a new `packages/catalog/src/displayName.test.ts` or similar). Integration test confirming a changed name appears on `/access`, `/checkout/[productId]`, and the homepage without altering `orders.product_name` for a pre-existing order — likely added to `tests/integration/`.
- **Access matrix** (per the request's own table): unit tests for `permittedContentPlans` covering Plus→{Plus}, Pro→{Pro}, Max→{Plus,Pro,Max}, and the negative cases (Plus does NOT get Pro, Pro does NOT get Plus) — natural home: a new `packages/core-subscriptions/src/cmsAccess.test.ts` or extension of `access.test.ts`.
- **Expiry**: active/expired for each of Plus, Pro, Max (6 cases) — extends the pattern already in `packages/core-subscriptions/src/access.test.ts`.
- **Content lifecycle**: draft/published/archived visibility, for both the catalog-list query and the download route independently (per §10's "both layers" requirement) — likely a new integration test alongside `tests/integration/entitlements.integration.test.ts`'s pattern.
- **Security**: direct-access attempts — Pro content as a Plus-only user, Plus content as a Pro-only user, expired-entitlement access, archived-content access, a tampered/expired signed grant — extending the existing `tests/integration/adversarial.integration.test.ts` pattern (confirmed to exist, §3) is the natural home.
- **Historical compatibility**: a regression test asserting a pre-cutover `entitlements` row for `ai_income_99`/`ai_freelancing_499` still resolves content access after the migration script runs, and that `orders`/`payments` rows for existing customers are byte-identical before/after.

---

## 17. Implementation phases

| Phase | Scope | Dependencies | Risks | Acceptance criteria | Must NOT change |
|---|---|---|---|---|---|
| **1 — Data model & entitlement foundation** | Create `content_items`, `plan_display_names` tables (§5, §6); implement `resolveDisplayName`, `permittedContentPlans`, `CMS_PLAN_INHERITANCE` (§8). No UI. | None beyond this spec. | Schema design mistakes are expensive to unwind once content exists — review constraints (§6) carefully before first write. | Unit tests for both new functions pass against the access matrix in §16; zero behavior change to any existing page (nothing calls the new code yet). | `ProductId`, `PRODUCT_CATALOG`, `entitlements`, `subscription_periods`, `orders`, `payments` schemas. |
| **2 — Admin auth + minimal CMS write path** | Build the net-new admin authentication/authorization gate (§7); minimal create/edit/publish/archive endpoints for `content_items` and `plan_display_names`. | Phase 1. | Largest unscoped risk in this spec — no existing RBAC to extend (§3.5, §19). | An admin can create a draft item, publish it, archive it; a non-admin cannot. | Customer-facing routes (none of this is customer-visible yet). |
| **3 — Customer CMS catalog** | Extend `/access`/`/access/[productId]` (or new CMS-specific routes) to query `content_items` via `permittedContentPlans` (§11); extend the download route (§12). | Phases 1-2 (content must exist to display). | Must not regress the existing deliverables-based flow for products not yet migrated. | A test Plus-only user sees only published Plus content; Pro/Max analogous; expired sees none; direct download URLs re-verify server-side. | Old `/access/[productId]` behavior for any product not yet migrated to `content_items`. |
| **4 — Migration from hardcoded content** | Run the one-time backfill script (§14) for Plus/Pro; verify parity; cut over read paths; retire the old manifest module. | Phase 3 proven correct in a non-production environment first. | Breaking an existing customer's access if `storage_key`/id values are not carried over exactly (§14 points 4, 8). | Every existing Plus/Pro deliverable is reachable via the new path with identical `storage_key`/bytes; old manifest module can be deleted with zero test failures. | `storage_key` values, asset ids, `entitlements` rows. |
| **5 — 30-day Plus/Pro transition** | Generalize `subscription.charged` handling beyond the hardcoded Max slug (§9); support Plus/Pro recurring checkout. | Phase 1 (`permittedContentPlans` must already distinguish legacy-entitlement vs. subscription-period sourced access, §9). | The historical-compatibility question flagged in §9/§15 — get explicit confirmation of the proposed grandfathering default before this phase ships, since it is the phase that could change real customer access if the default is wrong. | New Plus/Pro purchases create `subscription_periods` rows and expire correctly after 30 days; pre-existing `entitlements` rows continue to grant access exactly as before. | Any existing `entitlements` row (read-only in this phase). |
| **6 — Max inheritance (end-to-end)** | Confirm `permittedContentPlans`'s Max expansion is exercised by a real active Max subscription against real migrated Plus/Pro content. | Phases 1, 4, 5. | Low — this is mostly already covered by Phase 1's unit tests; this phase is the integration proof. | A test Max subscriber sees Plus + Pro + Max content with no duplicates, through the real UI, not just unit tests. | Nothing new — this phase is verification. |
| **7 — End-to-end validation** | Full regression per §16; security test pass (§13/§16). | All prior phases. | Standard pre-launch risk; no new risk introduced by this phase itself. | All tests in §16 pass; no existing customer-facing behavior regresses (verified against the existing test suites listed in §3/§16). | Everything — this is a verification-only phase. |

---

## 18. Acceptance criteria (spec-level, cross-phase)

- A Plus-only customer never receives, in any API response or page render, a reference to a Pro-owned `content_items` row (draft, published, or archived).
- A Pro-only customer never receives a reference to a Plus-owned row.
- A Max customer receives Plus + Pro + Max published content with zero duplicate rows.
- No `DRAFT` or `ARCHIVED` content is ever served to a customer, including via a direct/remembered download URL, even when the customer holds an otherwise-valid entitlement for that plan.
- Changing a `plan_display_names` row updates every one of the 8 cited render sites consistently, with zero change to any `ProductId`, `orders.product_name`, `entitlements`, or `subscription_periods` row.
- Every pre-cutover Plus/Pro customer retains exactly the access they had immediately before the CMS migration (per the §9/§15 default), verified by a before/after regression test.
- Every existing automated test listed in §16's referenced files continues to pass unmodified (no test is edited to "make it pass" around a regression).

---

## 19. Risks

- **No admin authentication exists** (§7) — this is the single largest net-new, unscoped piece of work in this spec; underestimating it risks either shipping a CMS with no real access control or significantly delaying Phase 2.
- **Storage trust-model shift** (§12) — moving `storage_key` from "always a frozen compile-time constant" to "admin-entered, DB-stored" removes an implicit safety argument the current code relies on; an insufically-validated admin upload path could reintroduce path-traversal risk that `contentStore.ts`'s guard was never designed to be the *only* defense against.
- **Historical-entitlement grandfathering default** (§9) — if the proposed default (perpetual legacy access, 30-day only for new/renewed access) is not what the Product Owner actually intends, shipping Phase 5 without confirming it first could silently cut off access for existing paying customers.
- **Parallel-run window complexity** (§14) — maintaining two working content-read paths (old manifest, new `content_items`) simultaneously during Phases 3-4 is additional, temporary complexity; a rushed cutover that skips the parallel-run step risks breaking existing customers rather than protecting them.
- **Webhook hardcoding generalization** (§9) — `subscription.charged`'s hardcoded `productSlug` (`webhookHandler.ts:384`) has been a `single-SKU` assumption baked into production payment code; generalizing it is a change to financially-sensitive, trigger-guarded code and warrants extra review/testing care beyond typical feature work.

---

## 20. Explicit non-goals

- Email/notification features for CMS publishing or access events — not required by any PO-1..5 decision; not introduced here.
- Analytics, quizzes, comments, certificates, DRM, or collaborative editing — explicitly excluded by the originating request; no PO decision requires them.
- Video streaming, range-requests, or transcoding beyond today's whole-file response — PO-4's "short videos" is satisfied by the existing serving model; adaptive streaming is a future enhancement only if a later decision requires it.
- Full content version history — update-in-place satisfies PO-4's "content updates/replacement"; a versioned history table is not built here.
- Multi-currency or internationalized plan names — out of scope; `plan_display_names.display_name` is a single string per plan, matching today's single-locale behavior.
- Any change to the old, retired one-time `ai_client_acquisition_1499` SKU, its ladder-based implied-access logic, or any existing site-wide product-level upsell mechanism — explicitly preserved and undisturbed per PO-3's instruction to document, not alter, that separate mechanism.
- A fully designed admin RBAC/permission matrix — a minimal "is this user an admin" gate is in scope (§7, §17 Phase 2); a general permission system is not.

---

## PO decisions required

**No additional Product Owner decisions identified** beyond the single historical-compatibility consideration already resolved in this document by a proposed default consistent with existing project precedent (§9, §15) — which is flagged for confirmation before Phase 5 ships (§17), not escalated as a blocking open question for the rest of this spec.

## Implementation authorization

**This document is an architecture/specification only. No implementation is authorized by this task.** No source code, schema, migration, test, or UI was created or modified. No commit or push was made.
