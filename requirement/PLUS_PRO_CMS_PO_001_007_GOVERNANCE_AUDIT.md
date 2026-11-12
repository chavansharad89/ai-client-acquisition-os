# Governance Record: Plus/Pro CMS Product Owner Decisions (CMS-PO-001 .. 007) and Repository Audit

**Status:** GOVERNANCE / REQUIREMENTS RECORD ONLY. No application code, schema, migration, database record, test, or any file outside this document was changed in producing this record. Not committed. Not pushed. Not deployed.

**Date:** 2026-10-25
**Prepared by:** Repository governance / requirements analyst pass, at Product Owner request.
**Scope:** Record the Product Owner's CMS-PO-001..007 decisions for the ₹99 Plus and ₹499 Pro plan CMS/content system verbatim; check them against the existing authoritative requirement set; perform a read-only audit of what repository infrastructure already exists for this scope. No resolution, architecture, or implementation is decided here. This is a Product Owner decision record, not an analyst recommendation.

---

## A. AUTHORITATIVE PRODUCT OWNER DECISIONS (CMS-PO-001 .. 007)

Supplied directly by the Product Owner. Recorded verbatim below.

> **CMS-PO-001 — Plan-specific content access.** Each plan has its own content. Plus users can access ONLY Plus content. Pro users can access ONLY Pro content. Pro users do NOT inherit Plus content. Plus users do NOT see Pro content. There is NO locked Pro-content/upgrade-prompt experience. Do not show content belonging to another plan. Access rule: ACTIVE entitlement for exact plan → access that plan's published content. No entitlement / expired entitlement → no access to that plan's content.
>
> **CMS-PO-002 — Plan duration.** All three plans are 30-day plans. For the current Plus/Pro scope: ₹99 Plus = 30 days; ₹499 Pro = 30 days. After 30 days, the plan must be renewed to regain access. Do NOT treat Plus or Pro as lifetime purchases. Do NOT assume that historical one-time-product behavior applies to these plans.
>
> **CMS-PO-003 — One content item belongs to exactly one plan.** A content item may belong to ONLY ONE plan. A content item must NOT be shared between Plus and Pro through a many-to-many plan association. If substantially identical content is required in both plans, it should be represented as separate plan-specific content according to future Product Owner decisions.
>
> **CMS-PO-004 — Content removal.** Content must NOT be permanently deleted from the CMS. The CMS supports ARCHIVE rather than permanent deletion. Archived content: is retained; is removed from normal customer-facing published content; remains available to administrators; retains its metadata/history as supported by the implementation.
>
> **CMS-PO-005 — CMS-managed content.** The actual Plus and Pro content is NOT hardcoded into application code. Content will be uploaded and managed through the CMS. Content may be organized chapter-wise, topic-wise, or using another supported CMS hierarchy. The exact content inventory is intentionally OUT OF SCOPE. The CMS must support at minimum: files/documents; short videos. The hierarchy should be flexible enough that chapters/topics can be changed through CMS without requiring application code changes.
>
> **CMS-PO-006 — Publishing.** CMS content must support a publishing lifecycle. At minimum: DRAFT → PUBLISHED → ARCHIVED. Only PUBLISHED content should be available to customers with the corresponding active plan entitlement. Do not expose draft or archived content through the normal customer content experience.
>
> **CMS-PO-007 — Plus/Pro purchase independence.** Do not introduce a sequential-purchase prerequisite between Plus and Pro. Unless an existing governing decision explicitly says otherwise, Plus and Pro remain independently purchasable. Do not require Plus purchase before Pro purchase. Do not require Pro purchase before Plus purchase.

These are Product Owner decisions, not analyst recommendations. Nothing has been implemented as a result of recording them.

---

## B. RELATIONSHIP TO EXISTING GOVERNANCE

### B.1 — Identity of "Plus"/"Pro" is not yet established in writing

No existing governance record uses the names "Plus" or "Pro" for any product. The existing authoritative commercial model (`COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md`, COMMERCIAL-PO-01) names the three products as **"₹99 kit"** (`ai_income_99`), **"₹499 kit"** (`ai_freelancing_499`), and **"₹1,499 Client Finder"** (`ai_client_acquisition_1499_subscription`). The prices named in this request (₹99, ₹499) match the ₹99 kit and ₹499 kit exactly, which is strong circumstantial evidence that "Plus" = ₹99 kit and "Pro" = ₹499 kit under new customer-facing names — but this mapping is **not stated anywhere in this request** and is not assumed as decided here. **See Open Question 1.**

### B.2 — CMS-PO-002 (30-day duration): reinforces, no conflict
Matches **COMMERCIAL-PO-01** ("each subscription period is 30 days") and **COMMERCIAL-PO-09/10** (₹99/₹499 cancellation model, both already decided as 30-day renewable subscriptions). No conflict. If the Plus/Pro ↔ ₹99/₹499 mapping (§B.1) is confirmed, this decision restates existing policy rather than introducing new policy.

### B.3 — CMS-PO-007 (independent purchasability): reinforces, no conflict
Matches **COMMERCIAL-PO-02/03** (no purchase prerequisite in either direction between ₹99/₹499/₹1,499) and `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`. No conflict.

### B.4 — CMS-PO-001 (plan-specific, non-inheriting content access): reinforces one existing decision, raises a UX-pattern question against another
- **Reinforces:** `NINETY_NINE_KIT_DELIVERABLE_BUNDLE_PRODUCT_OWNER_DECISION.md` (DEC-013) §6 already drew a hard content boundary between the ₹99 tier and the ₹499 ("higher") tier for three specific assets (opportunity qualification checklist, prospect scorecard, follow-up sequences), explicitly stating higher-tier content "remains the ₹499 tier's territory, undisturbed" by ₹99. CMS-PO-001 generalizes this same non-inheritance principle across all content. No conflict.
- **Does not conflict with, but does not address, the ₹1,499 complete-package grant:** `COMMERCIAL-PO-02` grants an active ₹1,499 subscriber access to ₹99 kit + ₹499 kit content as part of the "complete package." CMS-PO-001's access rule ("ACTIVE entitlement for exact plan → access that plan's content") is satisfied for a ₹1,499 holder *if* the complete-package grant is implemented as "the ₹1,499 holder also holds an effective active entitlement for the exact Plus/Pro plans" — which is consistent, not contradictory. This CMS-PO-001..007 request does not mention ₹1,499 or the complete package at all, so this interaction is **not decided here** and should not be inferred either way. **See Open Question 2.**
- **Raises a question against the existing customer-library UI pattern:** The current `/access` page (`apps/web/app/access/page.tsx`) is built around showing **unlocked vs. locked products side-by-side with an upsell CTA** for products the customer does not own. CMS-PO-001 states "There is NO locked Pro-content/upgrade-prompt experience" and "Do not show content belonging to another plan" for *content*. It is unclear whether this bans only showing another plan's *content items* (chapters/files/videos) to a non-entitled user, or also bans the existing product-level "you don't have Pro yet, here's a CTA" pattern used elsewhere in the app for plan/product discovery. This is a real tension with an established UI pattern, not a written-requirement conflict, and is reported rather than resolved. **See Open Question 3.**

### B.5 — CMS-PO-005 (CMS-managed, non-hardcoded content): conflicts with current ₹99 architecture, no ₹499 content exists to conflict with
- **₹99 kit:** Current content is a **hardcoded, PO-approved static manifest** — `DEC-012`/`DEC-013` set an exact, named 10-asset bundle, implemented as a literal array in `packages/catalog/src/deliverables.ts`, served from local disk via `apps/web/src/server/contentStore.ts`. This is the opposite of "not hardcoded... uploaded and managed through the CMS." CMS-PO-005 does not state whether it is meant to **replace** this existing static bundle with CMS-managed content, or to **add** a new CMS-managed content layer alongside/within the existing Plus plan. Classified as **B. IMPLEMENTATION GAP / unresolved relationship to DEC-012/DEC-013**, not a written-requirement conflict — those records remain in force unless and until superseded. **See Open Question 4.**
- **₹499 kit:** No existing decision defines any ₹499 content/deliverables at all (confirmed: no `*499*FULFILLMENT*` or `*499*DELIVERABLE*` record exists in `requirement/`). No conflict — this is a fresh decision with nothing to supersede for Pro.

### B.6 — CMS-PO-003, CMS-PO-004, CMS-PO-006: no conflict (greenfield)
No existing decision or schema defines a content-item model, an archive/delete policy for content, or a draft/published/archived lifecycle for content. These are fresh decisions with nothing to supersede. (CMS-PO-004's "archive, never hard-delete" principle is consistent with the project's established data-handling posture elsewhere — e.g. COMMERCIAL-PO-06/08's "do not delete old records" — but that is a different data domain and is noted only as a consistent precedent, not as the same decision.)

---

## C. REPOSITORY AUDIT (read-only; nothing modified)

| Area | Status | Existing implementation/evidence | Relevant files | PO compatibility |
|---|---|---|---|---|
| 1. Plus product | UNKNOWN (naming) / **PARTIALLY EXISTS** if Plus = ₹99 kit | No product named "Plus" exists. `ai_income_99` ("₹99 kit") exists as a catalog entry with a PO-approved static 10-file bundle (DEC-012/013). | `packages/catalog/src/products.ts`, `packages/catalog/src/deliverables.ts` | Compatible only once the Plus↔₹99-kit mapping is confirmed (Open Q1); CMS-PO-002/007 already match ₹99 kit's decided behavior. |
| 2. Pro product | UNKNOWN (naming) / **PARTIALLY EXISTS** if Pro = ₹499 kit | No product named "Pro" exists. `ai_freelancing_499` ("₹499 kit") exists as a catalog entry only — no content/deliverable decision has ever been recorded for it. | `packages/catalog/src/products.ts` | Compatible only once the Pro↔₹499-kit mapping is confirmed (Open Q1); no conflicting content decision exists to supersede. |
| 3. Product catalog | **EXISTS AND REUSABLE** | `PRODUCT_CATALOG`: a frozen `Record<ProductId, Product>`, flat `{id, name, amountPaise, currency, metaValueInr}`; `ProductId` is a closed string-literal union; includes `isRetiredFromNewPurchases`. | `packages/catalog/src/types.ts`, `packages/catalog/src/products.ts` | Compatible as the product/plan registry; adding `ProductId` values is a closed-union edit, not a redesign. |
| 4. Product IDs/SKUs | **EXISTS AND REUSABLE** | 4 existing IDs incl. `ai_income_99`, `ai_freelancing_499`. | `packages/catalog/src/types.ts` | Compatible — same pattern could register Plus/Pro ids if distinct from the kit ids. |
| 5. Subscription/30-day periods | **EXISTS AND REUSABLE** (for ₹1,499 only today) | `subscription_periods` table models 30-day, renewable, non-exclusive-per-user periods; already used by the ₹1,499 subscription. ₹99/₹499 are NOT on this table today — they are one-time rows in `entitlements` with no expiry (per `COMMERCIAL_PO_01_07_...AUDIT.md` §D, still an open architecture question as of that record). | `packages/db/prisma/migrations/0040_subscription_periods/migration.sql`; `packages/db/prisma/migrations/0004_entitlements/migration.sql` | Schema pattern is reusable for Plus/Pro 30-day periods (CMS-PO-002) once/if ₹99/₹499 move onto it — but that move is itself still an open, unimplemented question from prior governance, not something this record resolves. |
| 6. Entitlements | **EXISTS AND REUSABLE** (one-time model only) | `entitlements` table, `UNIQUE(customer_email, product_slug)`, one row per product per customer, no expiry field. | `packages/db/prisma/migrations/0004_entitlements/migration.sql` | Compatible as a base pattern; does not by itself express "expires after 30 days" (CMS-PO-002) without added logic. |
| 7. Access control | **PARTIALLY EXISTS** | `currentAccess()` / `PRODUCT_LADDER` resolve one-time-product access incl. implied lower-tier access for `ai_client_acquisition_1499`; subscription-side access checks only the single hardcoded ₹1,499 subscription slug. No plan-specific *content-item* access-control concept exists at all (nothing to check CMS-PO-001/003 against yet). | `apps/web/src/server/access.ts`; `packages/catalog/src/ladder.ts`; `packages/core-subscriptions/src/access.ts` | Product-level access exists; content-item-level, plan-exclusive access (CMS-PO-001) does not exist and is new. |
| 8. Content/library/download functionality | **EXISTS AND REUSABLE** (product-level, flat-file model only) | `/access` (library/dashboard) and `/access/[productId]` (per-product deliverable list) already render an "arbitrary deliverables array" per product, with signed per-file download grants. | `apps/web/app/access/page.tsx`; `apps/web/app/access/[productId]/page.tsx` | UI shell is reusable for a CMS-backed Plus/Pro library, but today's locked/upsell pattern on this same page is the tension flagged in §B.4/Open Q3. |
| 9. File storage | **PARTIALLY EXISTS** | Local-disk-only `contentStore.ts` reads files from a local `CONTENT_ROOT` by `storageKey`, with path-traversal guard. Explicit code comment: no storage adapter existed before this; swapping for object storage changes only this one file. No S3/blob/CDN integration. | `apps/web/src/server/contentStore.ts` | Compatible as a starting point for CMS-PO-005's "files/documents" minimum, but is not itself a CMS (no DB-backed metadata, no draft/published/archived state, no upload path). |
| 10. Video storage/streaming | **PARTIALLY EXISTS** (storage only, no streaming) | One existing `'video'` deliverable kind (`ai_client_acquisition_1499/walkthrough.mp4`, served as a single full-file response, no range requests/transcoding). | `packages/catalog/src/deliverables.ts`; `apps/web/src/server/contentStore.ts` | Serves a whole-file MP4 today; does not meet typical "short video" streaming expectations (range requests) without further work. Meets CMS-PO-005's minimum only in the loosest sense (a video file can be served). |
| 11. CMS/admin functionality | **DOES NOT EXIST** | No CMS, no content-authoring UI, no upload path, no admin content model anywhere in the repo. | — | Entirely new build required for CMS-PO-005/006. |
| 12. Publishing/draft/archive states | **DOES NOT EXIST** (for content) | No draft/published/archived concept for any content-like entity. The only adjacent enum, `OutreachApprovalState` (`DRAFT`/`APPROVED`/`REJECTED`/`SENT`), lives in `packages/db/prisma/migrations-blocked/0005_outreach_provenance/migration.sql` — an **unapplied, blocked migration**, unrelated domain (outreach messages, not CMS content), not reusable as-is. | `packages/db/prisma/migrations-blocked/0005_outreach_provenance/migration.sql` | Nothing to reuse; CMS-PO-006's DRAFT→PUBLISHED→ARCHIVED lifecycle is a new build. |
| 13. Existing content hierarchy | **DOES NOT EXIST** | `deliverables.ts` models content as one flat array per product (`Record<ProductId, Deliverable[]>`), no chapter/topic/module nesting. | `packages/catalog/src/deliverables.ts` | CMS-PO-005's chapter/topic hierarchy is new; nothing to migrate from structurally. |
| 14. Existing admin authentication/authorization | **DOES NOT EXIST** | No `/admin` route (`find apps/web/app -iname "*admin*"` empty). No `role`/RBAC field anywhere in `packages/core-identity`. Only customer session/user/activation-token primitives exist. | `packages/core-identity/src/*` | Admin auth for CMS-PO-004's "remains available to administrators" is entirely new; no role concept to extend. |
| 15. Existing customer library/access UI | **EXISTS AND REUSABLE** | See item 8. | `apps/web/app/access/page.tsx`, `apps/web/app/access/[productId]/page.tsx` | Reusable shell; current locked/upsell pattern needs PO clarification (Open Q3) before reuse for plan-exclusive content views. |
| 16. Existing email/access-delivery mechanisms | **EXISTS AND REUSABLE** | `ActivationEmailSender` interface (console/SMTP/Resend implementations), separate `claimEmail.ts` sender for purchase-claim links; `EMAIL_PROVIDER` config supports `resend`/`gmail-dev`. | `packages/core-identity/src/activationEmail.ts`; `packages/core-entitlements/src/claimEmail.ts`; `packages/config/src/env.ts` | Reusable as-is if Plus/Pro ever need an activation/notification email; CMS-PO-005/006 do not require email at all, so this is incidental, not blocking. |
| 17. Existing tests relevant to these areas | **DOES NOT EXIST** (for CMS concepts) | Zero test matches for "cms", "chapter", "publish" (word-boundary search). "Library"-named tests are all for the existing product-level `/access` page, not content/CMS. | `apps/web/app/access/page.test.ts`; `packages/core-entitlements/src/delivery.test.ts`, `funnel.test.ts` | No regression risk from this governance record (no code touched); no existing CMS test suite to extend later. |

---

## D. EXISTING REUSABLE INFRASTRUCTURE

- Product/catalog registry pattern (`packages/catalog/src/types.ts`, `products.ts`) — closed-union `ProductId`, frozen catalog record.
- `subscription_periods` 30-day-period schema and pattern (currently ₹1,499-only) — directly matches CMS-PO-002's duration model if extended to Plus/Pro.
- Local file storage adapter (`contentStore.ts`) with path-traversal guard — meets CMS-PO-005's minimum file-serving need as a starting point, not a finished CMS.
- `/access` library UI shell, already designed around an arbitrary per-product deliverable array with signed download grants.
- Email-sender abstractions (activation + claim-link) — available if ever needed, not required by CMS-PO-001..007.

## E. MISSING INFRASTRUCTURE

- Any CMS/content-authoring system, content database model, or admin UI (items 11, 13).
- Any draft/published/archived lifecycle for content (item 12).
- Any admin authentication/authorization or role concept (item 14).
- Plan-exclusive, content-item-level access control (CMS-PO-001/003) — only product-level access control exists today.
- 30-day subscription lifecycle for ₹99/₹499 specifically (still an open item from prior governance, now also a CMS-PO-002 dependency if Plus/Pro map to those products).
- Video streaming (range requests) beyond whole-file serving, if "short videos" is expected to behave like typical in-app video playback.

## F. CONFLICTING INFRASTRUCTURE

- `packages/catalog/src/deliverables.ts`'s hardcoded, PO-approved static ₹99 bundle (DEC-012/DEC-013) is architecturally the opposite of CMS-PO-005's "not hardcoded, CMS-managed" requirement. Not a written-requirement conflict (DEC-012/013 are not superseded by this record), but a direct implementation-pattern conflict requiring explicit PO direction on scope (Open Q4).
- The existing `/access` page's locked-product/upsell-CTA pattern is in tension with CMS-PO-001's "no locked Pro-content/upgrade-prompt experience," pending clarification of whether that ban is content-level only or also product-level (Open Q3).

## G. RECOMMENDED NEXT IMPLEMENTATION BOUNDARY (recommendation only — not implementation, not authorized by this record)

Before any CMS build begins, the Open Questions in §H should be resolved, since they change the shape of the work materially (e.g., whether this is a new content layer bolted onto the existing ₹99/₹499 kits, or a replacement of the existing static-file model; whether the existing `/access` page can be reused as-is or needs a new plan-exclusive view). Once resolved, the narrowest first slice would likely be: (a) a content-item data model satisfying CMS-PO-003/005/006 (plan FK, single hierarchy level to start, draft/published/archived enum) with no admin UI yet (seed via script/migration), (b) a read-only customer-facing plan-exclusive content list reusing the existing `/access` route shell, gated by whatever entitlement mechanism Plus/Pro end up using. This is a suggestion for future scoping only.

---

## H. OPEN PRODUCT OWNER QUESTIONS

1. **Is "Plus" = the existing ₹99 kit (`ai_income_99`) and "Pro" = the existing ₹499 kit (`ai_freelancing_499`), under new customer-facing names — or are Plus/Pro new, distinct products?** The prices match exactly; nothing else confirms the mapping. This gates almost everything else in this audit.
2. **How does CMS-PO-001's plan-exclusive access rule interact with the ₹1,499 Client Finder "complete package" grant (COMMERCIAL-PO-02)?** Does a ₹1,499 subscriber see Plus content, Pro content, both, or neither, once Plus/Pro content exists? This request does not mention ₹1,499 and nothing here should be read as deciding it.
3. **Does "no locked Pro-content/upgrade-prompt experience" (CMS-PO-001) ban only showing another plan's content items, or also ban the existing product-level "you don't own this yet" upsell pattern currently used on `/access` for product/plan discovery?**
4. **Is CMS-PO-005 intended to replace the existing PO-approved static ₹99 deliverable bundle (DEC-012/DEC-013) with CMS-managed content, or to introduce CMS-managed content as an additional/new content layer, leaving the existing static bundle and its download mechanism untouched?**
5. **If Plus/Pro map to the existing ₹99/₹499 kits, should they move onto the `subscription_periods` table (as COMMERCIAL-PO-01/09/10 already directed for ₹99/₹499 generally), or is the Plus/Pro CMS content system expected to carry its own separate entitlement/period tracking?**

---

## I. IMPLEMENTATION STATUS

- No application code changed.
- No database migrations changed or created.
- No database records changed, inserted, or deleted.
- No tests changed.
- No files outside this governance record were created or changed.
- No commit was made.
- No push was made.
- No deployment was made.

This is a Product Owner governance record only. CMS-PO-001 through CMS-PO-007 have not been implemented. The CMS has not been built. No existing product, catalog, schema, or UI behavior has been changed.
