# Implementation Impact Audit — Authentication + Commercial Model

**Status: AUDIT ONLY.** No application code, migration, database row, test, or fixture was created, modified, or deleted in producing this document. No commit, push, or deployment was made.

**Date:** 2026-10-10.
**Decision source of truth:** `requirement/FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md` (AUTH-PO-01→30, COMMERCIAL-PO-01→18, all previously-open PO questions now closed per that document's §B5 and Addendum 3 §C1). This audit does not restate those decisions verbatim; it cites them by ID and audits the repository against them, going deeper on areas that document's own implementation-audit pass (§8–§16) did not cover in the requested level of detail: full repo-wide old-SKU inventory, Client Finder regression risk against the new uncommitted contact-unlock feature, test-by-category impact, and migration/schema specifics.

**Update (2026-10-10, later pass):** The PCG-3B blocker identified below (originally §4, §13, §18 Phase 6, §19, §20) is **resolved** by `COMMERCIAL-PO-18` (Addendum 3 of the decision source of truth): PCG-3B is **retired**, not redefined. This pass re-runs the consistency check with that decision applied; see the updated §4, §13, §18, §19, §20, §21, and Rollup below. No code, migration, or data change was made in producing this update.

---

## 1. Executive Summary

The authoritative decision set (AUTH-PO-01→30, COMMERCIAL-PO-01→17) is fully recorded, internally consistent, and every previously-open PO question is closed. Implementation against that decision set remains almost entirely undone, confirmed by this pass against the current working tree (checkout `requireUser()` precondition and old-SKU catalog entries unchanged since the last audit pass).

Two findings are new in this pass and change the risk picture:

1. **The old one-time SKU (`ai_client_acquisition_1499`) is not merely a catalog/checkout leftover — it was the defined subject of a mandatory launch-gate (PCG-3B) and two of its dependents (`combined.ts`, `recompute.ts`).** Removing it per COMMERCIAL-PO-05/13/17 is not a string replacement; it is a type-level breaking change to those three files. **RESOLVED this pass by COMMERCIAL-PO-18 (retire PCG-3B, do not redefine it)** — see §4, §13, §19, §20.
2. **A split-brain access-check risk exists today between `packages/core-subscriptions/src/access.ts` and `packages/core-subscriptions/src/leadUnlockService.ts`** — both independently hardcode the same single product-slug check via two separate call sites. If the ₹1,499→₹99/₹499 entitlement cascade (COMMERCIAL-PO-02) is implemented in one and not the other, the Client Finder UI and the actual contact-unlock write path can disagree about who has access. This is a concrete regression mechanism against the already-Razorpay-test-mode-validated Client Finder feature, not a hypothetical one.

Everything else confirms the prior audit's findings: no pending-identity mechanism, no cancellation mechanism (correctly — COMMERCIAL-PO-16 puts cancellation out of scope), no ₹99/₹499 subscription lifecycle, no complete-package cascade, old SKU still live in catalog/checkout/ladder/marketing pages.

**Implementation is NOT authorized by this audit.**

---

## 2. Current Architecture

- **Products:** `packages/catalog/src/products.ts` defines four SKUs: `ai_income_99`, `ai_freelancing_499`, `ai_client_acquisition_1499` (old, one-time), `ai_client_acquisition_1499_subscription` (new, intended). `packages/catalog/src/ladder.ts` encodes a linear upsell ladder (₹99 → ₹499 → old ₹1,499) that assumes owning a higher tier implies all lower tiers — a model COMMERCIAL-PO-01 (independent lifecycles) does not match for the new subscription world.
- **One-time purchase path:** `createOrder` → Razorpay order → `payment.captured` webhook → `entitlements` row (unique per `customer_email, product_slug`) → `claim_tokens`-based claim flow (`apps/web/app/api/auth/signup/route.ts`) → password-setting signup, with a "mint no session, log in manually" branch for existing accounts.
- **Subscription purchase path (₹1,499 only today):** `POST /api/payments/create-subscription` → **requires an authenticated session (`requireUser()`)** → Razorpay subscription object → `subscription.charged` webhook inserts a `subscription_periods` row (one row per successful charge, never mutated). Expiry is computed at read time (`activation_at + duration_days`), never stored.
- **Access resolution:** `packages/core-subscriptions/src/access.ts` (`hasClientFinderAccess`/`getClientFinderSubscriptionStatus`) and `packages/core-subscriptions/src/leadUnlockService.ts` (`unlockOpportunity`) **each independently** call `findActiveForUser(userId, CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG, now)` — two call sites, one hardcoded slug, no shared gate.
- **New, uncommitted work in this tree:** Client Finder contact-unlock/masking feature (`ContactUnlockPanel.tsx`, `contactAccess.ts`, `contactValueMasking.ts`, `SubscriptionStatusBadge.tsx`, modified opportunity/search pages) and in-progress frontend checkout-machine plumbing for a second SKU (`createSubscriptionRequest()`), which per its own code comment still assumes "there is exactly one subscription SKU." Neither of these touches the auth/commercial decisions directly, but both are newly in scope for regression analysis (§15).
- **Launch gates:** `packages/core-launch-gates/{pcg3.ts,pcg3b.ts,combined.ts}` and `packages/core-launch-gates-validation/src/recompute.ts` define a "Tier B" population/conversion gate **as the old one-time ₹1,499 SKU specifically** (`TIER_B_PRODUCT_ID = PRODUCT_CATALOG.ai_client_acquisition_1499.id`). This is a previously-unaudited dependency on the SKU being retired.

---

## 3. Decision-by-Decision Compliance Matrix

Full decision text lives in `FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md` §2–§3 and its addenda. Compliance re-verified this pass against the current working tree (not changed since that audit for the files it names).

| Decision | Topic | Implemented? | Evidence |
|---|---|---|---|
| AUTH-PO-01/14/25/29 | Purchase-first, no account before payment, dormant-row mechanism, all 3 products | **NO** | `create-subscription/route.ts` still calls `requireUser()` before any Razorpay call |
| AUTH-PO-02/06/07/21 | Activation-link model (24h TTL, resend, latest-wins) | **NO** (mechanism doesn't exist for subscriptions) | No activation-token table for subscriptions; `claim_tokens` is FK'd to `orders`, which subscription checkout never creates |
| AUTH-PO-08/13 | Email+password normal login, unified end-state | **PARTIAL** | Password login route exists and is unaffected; unification across flows not done |
| AUTH-PO-04/09/16/17/27 | Reuse existing account, never overwrite password, auto-login/skip-profile | **NO** | `signup/route.ts:134-144`'s existing-account branch mints no session, tells customer to log in manually — opposite of required behavior |
| AUTH-PO-11 | Disable email-only `/api/auth/session` mint | **NO** | Route unchanged |
| AUTH-PO-15/18 | Immutable purchase-email identity, no auto-merge | **N/A — mechanism doesn't exist yet** | — |
| AUTH-PO-19/20/22/23/24 | Billing independent of activation; no grace period | **YES, by construction, for ₹1,499** | Webhook inserts rows independent of any activation state; expiry computed at read time |
| AUTH-PO-26 | Use existing computed-period model, not live Razorpay status | **YES** | `access.ts:67-77` already does this |
| AUTH-PO-28 | Dev password-less accounts may be removed | **Not yet acted on** (cleanup task, separately authorized) | — |
| AUTH-PO-30 | Retire legacy claim-token *onboarding* for new ₹99/₹499 purchases | **NO** | `signup/route.ts` claim-token flow still the only onboarding path for ₹99/₹499 |
| COMMERCIAL-PO-01/03 | Independent 30-day lifecycles, ₹99/₹499 | **NO** | `entitlements` has no period/expiry/cancellation concept at all |
| COMMERCIAL-PO-02/04 | ₹1,499 complete-package cascade; renewal extends, never rewrites | **NO (cascade) / YES (renewal-never-rewrites, by construction)** | `access.ts:18-52` checks only the single ₹1,499 slug |
| COMMERCIAL-PO-05/13/17 | Old SKU retired from new purchases, dev records removed, removed from ALL customer-facing surfaces | **NO** | Old SKU live in catalog, ladder, checkout types, marketing page (`client-acquisition-system/page.tsx`), public `kits` page, `docs/PAYMENTS.md`; see §4/§13 |
| COMMERCIAL-PO-06/08/14 | Dev data classified as dummy, may be removed | **Classification done; deletion not done** (correctly — deletion not authorized here) | — |
| COMMERCIAL-PO-09/10/11/12/15/16 | Cancellation *out of scope*; effect-only decisions remain as historical reference | **CORRECTLY absent** | No cancellation API/UI/webhook handling exists anywhere — matches COMMERCIAL-PO-16 exactly |
| COMMERCIAL-PO-07 | Don't silently change ₹99/₹499 behavior | **N/A** (no change has been made yet, silent or otherwise) | — |

No PO-level conflicts found. Every row above is an implementation gap against a decision, not a conflict between decisions (consistent with the FINAL audit's own §11 finding).

---

## 4. Product/Catalog Impact

| File | Current Behavior | Required Change | Decision Source | Risk |
|---|---|---|---|---|
| [packages/catalog/src/types.ts:22-30](packages/catalog/src/types.ts) | `ProductId` union includes both old and new ₹1,499 literals | Remove old literal | COMMERCIAL-PO-05/13/17 | **HIGH** — breaking type change; every file below must change in lockstep or the build fails |
| [packages/catalog/src/products.ts:31-37,78](packages/catalog/src/products.ts) | Old SKU's full catalog entry (price, name) defined and frozen | Remove entry | COMMERCIAL-PO-05/13/17 | HIGH (compile-time cascade) |
| [packages/catalog/src/ladder.ts:19](packages/catalog/src/ladder.ts) | Old SKU is the top rung of a linear upsell ladder; drives the live `/upsell/[productId]` funnel page | Remove old SKU from ladder; ladder concept itself conflicts with COMMERCIAL-PO-01's independent-lifecycle model and needs PO/engineering redesign, not just a one-line edit | COMMERCIAL-PO-01/05 | HIGH — changes a live upsell funnel's behavior |
| [packages/catalog/src/deliverables.ts:122-150](packages/catalog/src/deliverables.ts) | Old SKU's deliverable manifest (4 files, `storageKey` prefix) | Remove entry | COMMERCIAL-PO-05/13/17 | MEDIUM |
| [apps/web/app/(marketing)/client-acquisition-system/page.tsx:8](apps/web/app/\(marketing\)/client-acquisition-system/page.tsx) | Public marketing/landing page renders `ProductLanding productId="ai_client_acquisition_1499"` | Remove page (or repoint to subscription SKU — PO must decide which) | COMMERCIAL-PO-17 (explicit: "removed from... marketing/product documentation") | HIGH — customer-facing |
| [apps/web/app/kits/page.tsx:11-12](apps/web/app/kits/page.tsx) | Public kits listing shows old-SKU blurb | Remove blurb | COMMERCIAL-PO-17 | HIGH — customer-facing |
| [docs/PAYMENTS.md:13](docs/PAYMENTS.md) | Pricing table lists old SKU as a currently-sold product | Remove row | COMMERCIAL-PO-17 | LOW (docs only) |
| **[packages/core-launch-gates/src/pcg3b.ts:7-8](packages/core-launch-gates/src/pcg3b.ts), [combined.ts:10](packages/core-launch-gates/src/combined.ts), [packages/core-launch-gates-validation/src/recompute.ts:32](packages/core-launch-gates-validation/src/recompute.ts)** | PCG-3B launch gate and its two dependents define "Tier B" **as this exact product id** | **RESOLVED.** Per COMMERCIAL-PO-18: retire PCG-3B entirely (do not redefine "Tier B" as the new subscription SKU, do not invent a replacement metric). Remove the gate and its two dependents' "Tier B" code together with the old SKU | COMMERCIAL-PO-18 | **MEDIUM — resolved; still a breaking compile-time change requiring these three files to change in lockstep with §4's other rows, but no longer blocked on a PO decision** |

**Not yet authorized to change anything above.**

---

## 5. Checkout Impact

Re-confirmed this pass against the live route (`apps/web/app/api/payments/create-subscription/route.ts:1-50`): the route's own header comment still documents "REQUIRES AN AUTHENTICATED SESSION... unlike create-order's guest-or-session convention," and `requireUser()` is called before any Razorpay interaction.

- **Current architecture cannot support purchase-first without the AUTH-PO-25 dormant-row mechanism.** `subscription_periods.user_id` is `NOT NULL` (confirmed §7 below) — a real `users` row must exist before the first subscription period can ever be written, so either (a) a dormant/password-less row is created at checkout time (AUTH-PO-25's decided direction), or (b) the schema changes. AUTH-PO-25 already decided (a); no further PO input needed on this point.
- `createOrder` (one-time path) already supports guest/no-session checkout (`orders` has no FK to `users.id` at all — keyed on `customer_email`). The subscription path's `requireUser()` gate is the only asymmetry; removing it is an engineering task, not a schema blocker.
- ₹99/₹499 today use the one-time `createOrder` path, not subscription creation at all — extending AUTH-PO-29/30's unified activation-link model to them requires either routing them through `createSubscription` too (treating all three as subscriptions, consistent with COMMERCIAL-PO-01's "each a 30-day period") or building a parallel activation mechanism for one-time orders. The former is the lower-risk option per the FINAL audit's own §9 engineering recommendation (reuse `subscription_periods`, not retrofit `entitlements`).
- Frontend checkout-machine work in flight (`apps/web/src/checkout/{types,request}.ts`) is purely additive plumbing for a second SKU and does not resolve, worsen, or block any of the above — confirmed unchanged from the prior audit's own characterization.

---

## 6. Authentication Impact

1. **Reusable as-is:** password-based login route; `requireUser`/session-resolution logic in `packages/core-identity/src/session.ts` already distinguishes a real session token (`user_id` set, required) from an "entitlement-only" token (`user_id IS NULL`, rejected as not-a-session) — this is a pre-existing primitive well-suited to a dormant/pre-activation identity, confirmed by the Client Finder regression pass (§15) to already gate opportunity pages correctly against non-session tokens.
2. **Must be generalized:** the claim-token issuance/consumption pipeline (`claimToken.ts`, `claimEmail.ts`) is currently scoped to one order → one claim → one entitlement link. AUTH-PO-30 directs the legacy ₹99/₹499 claim-token *onboarding* flow be retired for new purchases in favor of the unified activation-link model — whether the new activation mechanism reuses this primitive (generalized) or is built as a parallel module is an open engineering design choice, not a PO question (both are consistent with AUTH-PO-30's text).
3. **Must be retired for new purchases:** `apps/web/app/api/auth/signup/route.ts`'s `claimToken`-based signup flow, for new ₹99/₹499 purchases specifically (AUTH-PO-30). It is not deleted outright — COMMERCIAL-PO-07/AUTH-PO-30's scoping means it may need to remain reachable for any pre-cutover purchases still in flight, though COMMERCIAL-PO-14 (dev records are dummy, may be removed) means this compatibility concern does not currently bind in the development environment.
4. **No unsafe email-only login path remains uncovered by a decision:** `POST /api/auth/session`'s email-only mint path still exists in code (AUTH-PO-11 not yet implemented) — a known, already-decided gap, not a new finding.
5. **Purchase-first activation can securely establish identity without trusting client-supplied IDs**, per the already-decided identity chain (AUTH-PO-15): purchase email → Razorpay subscription/payment → activation token → verified email → `users.id` → session. The schema supports this (§7). No architectural blocker found beyond the engineering work itself.

---

## 7. Identity/Data Model Impact

Re-verified directly against migration files (latest on disk: `0042_lead_unlock_contacts`; no new migrations in the working tree).

| Table | Relevant columns | Finding |
|---|---|---|
| `users` | `id`, `email` (UNIQUE, lowercase-checked), `created_at`, `password_hash` (nullable, added 0038) | **No email-verification-state column exists at all.** A dormant pre-activation row and a fully-activated row are schema-indistinguishable except by `password_hash IS NULL` — sufficient for AUTH-PO-25's decided mechanism, but worth flagging: there is no explicit "email_verified_at" to query. Not a blocker; a possible future migration if a reporting/audit need for verification state arises (not currently required by any PO decision). |
| `entitlements` | `user_id` nullable, FK ON DELETE SET NULL; UNIQUE(`customer_email`, `product_slug`) | Not a blocker for coexistence (one row per product, many products per customer already supported) |
| `subscription_periods` | **`user_id` NOT NULL**, FK ON DELETE CASCADE; UNIQUE(`razorpay_payment_id`) only — no unique constraint on `(user_id, product_slug)` | **Confirmed blocking FK**: a subscription period cannot be written without an existing `users` row. This is exactly why AUTH-PO-25's dormant-row mechanism is required — the schema does not support a null/deferred owner. No `cancelled_at`/`auto_renew` column exists (confirmed absent — required for COMMERCIAL-PO-09/10/11 if a cancellation mechanism is ever built, though COMMERCIAL-PO-16 currently puts that out of scope entirely). |
| `claim_tokens` | FK'd to `orders` (NOT NULL), not to `subscription_periods` or any pending-identity table | Cannot be reused as-is for subscription activation without either adding an `orders` row to the subscription flow or building a parallel token table |
| `orders` | No FK to `users.id` at all; keyed on `customer_email` | Not a blocker for anything |

**Minimum schema changes implied (not decided, not created here):**
1. Extend `subscription_periods` (or an equivalent) to cover `ai_income_99`/`ai_freelancing_499` — no new uniqueness blocker, already supports multiple simultaneous rows per user.
2. A `cancelled_at`/`auto_renew` column, if/when cancellation is ever in scope (currently it is not — COMMERCIAL-PO-16).
3. A pending-identity mechanism — AUTH-PO-25 already decided this is a dormant `users` row, not a new table; no schema change beyond ensuring checkout creates that row before the first `subscription_periods` insert.
4. A complete-package cascade is pure logic on existing data — no schema change required.

---

## 8. ₹99 Subscription Impact

- **Today:** one-time `entitlements` row only. No period, no expiry, no renewal, no cancellation field (consistent with COMMERCIAL-PO-16, cancellation is correctly absent).
- **Required for COMMERCIAL-PO-01/15:** a 30-day period concept with independent renewal and renewal-failure timing (current-period-runs-to-actual-expiry, no grace period). Lower-risk path (engineering recommendation, not a new PO question): reuse `subscription_periods` rather than retrofit `entitlements`.
- **Onboarding:** per AUTH-PO-30, moves to the unified activation-link model for new purchases; legacy claim-token path retired for new ₹99 purchases.
- **Test impact:** `ladder.test.ts` and `catalog.test.ts` currently encode ₹99 as the bottom of a linear-implication ladder — this framing does not hold once ₹99 is an independent subscription (§16).

---

## 9. ₹499 Subscription Impact

Identical shape to §8. Additionally: `packages/core-launch-gates/src/pcg3.ts`/`pcg3b.ts` name `ai_freelancing_499` as "Tier A" alongside the old ₹1,499 SKU as "Tier B" — ₹499's existing launch-gate role is unaffected by the commercial-model changes themselves, but is coupled to the same gate files resolved for removal in §4 (PCG-3B retirement, COMMERCIAL-PO-18). Any engineering work retiring PCG-3B should account for ₹499's continued role as "Tier A" in the same gate definition — PCG-3A itself is not retired.

---

## 10. ₹1,499 Complete-Package Impact

- **Confirmed gap (unchanged from FINAL audit):** `hasClientFinderAccess()`/`getClientFinderSubscriptionStatus()` check only the single ₹1,499 subscription slug; no code anywhere grants ₹99/₹499 access from an active ₹1,499 subscription.
- **New this pass — split-brain risk:** the cascade, if built, must land in **both** `access.ts` (read path, used by opportunity-page gating/status badge) and `leadUnlockService.ts` (write path, used by the actual unlock API route) — these are two independent call sites with duplicated slug-check logic, not one shared gate. Building the cascade in only one creates a user-visible inconsistency: the status badge could show "active" while the unlock POST still throws `NoActiveClientFinderSubscriptionError`, or vice versa. See §15 for full detail.
- **Independent-purchase coexistence:** schema-level, already supported (no uniqueness blocker, §7). Confirmed no credit/quota model remains in the ₹1,499 path — `subscription_periods` has no credit/ledger columns; `lead_unlocks` (0041) is a separate, already-reviewed-in-prior-audits concept not touched by this audit's scope.
- **Expiry removes only package-granted access, not independent access:** this is a logic requirement for whichever function implements the cascade — it does not yet exist, so it cannot yet be verified either way.

---

## 11. Razorpay/Webhook Impact

Confirmed unchanged from the FINAL audit's §8 items F/G: `SUPPORTED_EVENTS` in `packages/core-payments/src/webhookHandler.ts` lists `payment.captured`, `refund.created`, `refund.processed`, `subscription.charged` only — no `payment.failed`/`subscription.cancelled`/`subscription.halted` handling, and per AUTH-PO-26/COMMERCIAL-PO-16 none is currently required (renewal-failure timing is satisfied by omission; cancellation is out of scope). No refund-event requirement is introduced by this audit (none was asked for; scope boundary respected).

**Changes required for ₹99/₹499 subscriptions specifically:** the webhook handler's `subscription.charged` branch currently inserts a `subscription_periods` row keyed by whatever `product_slug` the Razorpay subscription plan carries — extending it to ₹99/₹499 is additive (new plan IDs mapped to the existing insert logic), not a rewrite, provided §8's "reuse `subscription_periods`" direction is taken.

---

## 12. Claim-Token Retirement Impact

- **Where used today:** `apps/web/app/api/auth/signup/route.ts` (consumption), `packages/core-entitlements/src/{claimToken,claimEmail,linking}.ts` (issuance/linking), FK'd to `orders` via the `claim_tokens` table (migration 0038/0039).
- **Which products use it:** the one-time path for ₹99, ₹499, and the old one-time ₹1,499 SKU.
- **Required by ₹99/₹499 today:** yes — it is currently the *only* onboarding mechanism for those two products.
- **Reusable as secure activation infrastructure:** the single-use/expiry/latest-wins primitives (`token_hash`, `expires_at`, `claimed_at`, `invalidated_at`) are structurally similar to what AUTH-PO-06/21 require for activation links — reusable in spirit, but the table's hard FK to `orders` (NOT NULL) means it cannot be reused unmodified for the subscription path, which never creates an `orders` row.
- **Must be retired for new purchases:** the signup route's `claimToken`-consumption branch, for new ₹99/₹499 purchases, per AUTH-PO-30.
- **Must remain for legacy/unrelated functionality:** the FINAL audit's own scoping (and COMMERCIAL-PO-14's dummy-data classification) means this is not currently a live compatibility concern in the development environment; whether it must remain in a production environment for pre-cutover purchasers is a question that only arises outside the current dev-only scope and is not decided here.

---

## 13. Old One-Time ₹1,499 Removal Inventory

Full repo-wide inventory (code, tests, docs) — classified per the five categories requested.

### MUST REMOVE
- `packages/catalog/src/types.ts:22-30` — `ProductId` union literal
- `packages/catalog/src/products.ts:31-37,78` — catalog entry
- `packages/catalog/src/ladder.ts:19` — top rung of `PRODUCT_LADDER`
- `packages/catalog/src/deliverables.ts:122-150` — deliverable manifest
- `apps/web/app/(marketing)/client-acquisition-system/page.tsx:8` — marketing/landing page
- `apps/web/app/kits/page.tsx:11-12` — public kits-listing blurb
- `docs/PAYMENTS.md:13` — pricing table row
- `packages/core-launch-gates/src/pcg3b.ts`, `combined.ts:10`, `packages/core-launch-gates-validation/src/recompute.ts:32` — PCG-3B "Tier B" gate and its two dependents, retired per **COMMERCIAL-PO-18** (resolved this pass — formerly listed as UNCERTAIN; see §4, §19, §20). `packages/core-launch-gates/src/pcg3.ts:9`'s comment referencing the old SKU should be updated/removed in the same change; PCG-3A ("Tier A", `ai_freelancing_499`) itself is unaffected and stays.

### UNCERTAIN — PO REVIEW REQUIRED
None remaining. The PCG-3B item previously listed here is resolved (above) by COMMERCIAL-PO-18.

### TEST/DUMMY DATA TO CLEAN
`tests/integration/{create-order-idempotency,entitlements,launch-gates-phase9,payment-capture,create-order}.integration.test.ts`; `packages/core-entitlements/src/{access,delivery,funnel}.test.ts`; `packages/catalog/src/{catalog,ladder}.test.ts`; `packages/core-payments/src/createOrder.test.ts`; `apps/web/src/checkout/request.test.ts:178`; `apps/web/src/lib/format/inr.test.ts:11`. (13 test files total; full line references in the companion research pass — available on request, omitted here to keep this document to decision-relevant content per the token-efficiency convention already used elsewhere in this repo's governance docs.)

### HISTORICAL GOVERNANCE REFERENCE — KEEP
All 16 `requirement/*.md` documents that reference the old SKU in the course of recording PO decisions about it (full list: `COMMERCIAL_PO_08_12_CANCELLATION_RENEWAL_OLD_DATA_ADDENDUM.md`, `CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISIONS_RECORD.md`, `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`, `COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md`, `CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISION_QUESTIONNAIRE.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md`, `CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md`, `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`, `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md`, `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`, `FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md`, `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`, `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`, `PROJECT_MASTER_CHECKLIST.md`, `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md`, `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`).

### MUST REPLACE WITH SUBSCRIPTION SKU
None found — no code location uses the old SKU where the new subscription SKU should be substituted in place (the two are referenced as distinct, co-existing identifiers everywhere they appear together, e.g. `types.ts`, `products.ts`, `catalog.test.ts`).

No seed/fixture script creates a database row for the old SKU — only test files construct it in-memory/in-test-DB at runtime, and one non-fixture-pattern production-shaped record (`chavan.sharad89@gmail.com`) already classified as test/development data per COMMERCIAL-PO-06/08/13/14 (not re-queried this pass, cited from the FINAL audit).

---

## 14. Development Data Cleanup Inventory

Per COMMERCIAL-PO-13/14/AUTH-PO-28 (classification only — no deletion performed or authorized by this document):

- Old one-time ₹1,499 dev/test records: the `chavan.sharad89@gmail.com` order/payment/entitlement row (previously identified, cited not re-queried) plus whatever matches the fixture email patterns used across the 13 test files in §13.
- ₹99/₹499 dummy purchases: every existing `entitlements`/`orders` row for `ai_income_99`/`ai_freelancing_499` in the current environment, per COMMERCIAL-PO-14's blanket dev-environment classification.
- Password-less development accounts: every `users` row with `password_hash IS NULL` in the current environment, per AUTH-PO-28.
- **How to safely identify them:** a read-only query filtering `users.password_hash IS NULL`, `entitlements.product_slug IN ('ai_income_99','ai_freelancing_499','ai_client_acquisition_1499')`, is sufficient — no heuristic/fuzzy matching needed since this is a development-only environment per COMMERCIAL-PO-14's own scoping. Not run as part of this audit.

---

## 15. Client Finder Regression Analysis

Audited the existing Razorpay-test-mode-validated ₹1,499 subscription feature and the new, uncommitted contact-unlock/masking work against the proposed changes.

1. **Entitlement-cascade split-brain (HIGH).** `access.ts` (read path: opportunity-page gating, subscription status badge) and `leadUnlockService.ts:79` (write path: the actual `POST /api/opportunities/:id/unlock`) each independently call `findActiveForUser(userId, CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG, now)`. If COMMERCIAL-PO-02's cascade is added to only one, the UI and the write path can disagree — a user could see "Unlock Contact" available (badge/page says active) while the POST throws `NoActiveClientFinderSubscriptionError`, or the reverse. **Any cascade implementation must land in both call sites atomically**, and ideally be refactored into one shared function first.
2. **Test-mock fidelity gap (HIGH, but pre-existing, not newly introduced).** `opportunities/[id]/page.test.ts`'s `fakeSubscriptionPeriods()` helper ignores the `productSlug`/`now` parameters and keys only on `userId` — it cannot currently detect a slug-selection regression (wrong slug, stale slug, or a cascade bug). This test would stay green through a broken cascade implementation. Flagged as a pre-implementation test-coverage gap, not a currently-failing test.
3. **Purchase-first / dormant-row risk to existing session gating (LOW-MEDIUM).** `requireUser`/`session.ts` already distinguishes a real session (`user_id` set) from an entitlement-only token (`user_id IS NULL`, explicitly rejected). A dormant pre-activation row, so long as it is never used to mint a real session before activation, does not weaken existing opportunity-page/contact-unlock gating — both pages already handle "no valid session" via `redirect('/login')`. The risk is **only** if a future implementation mistakenly mints a full session for the dormant row at purchase time, before password/activation — no code does this today; it is a future-implementation hazard to flag for whoever builds AUTH-PO-25, not a current regression.
4. **Old-SKU removal (LOW — contact-unlock code not coupled to it).** No reference to the bare `ai_client_acquisition_1499` slug exists anywhere in the contact-unlock/masking file set; `CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG` is a separately-declared constant in `access.ts` unaffected by catalog changes to the old SKU.
5. **Slug duplication across layers (MEDIUM).** The same subscription-SKU literal is hardcoded in four places (`access.ts` ×2 call sites, `leadUnlockService.ts` ×1, plus the frontend's `checkout/types.ts`) — any slug-related change (cascade or old-SKU removal) has four places to update in lockstep; missing one fails silently (wrong CTA link, badge mismatch, or unlock-path mismatch) rather than loudly.
6. **Contact masking itself (`contactValueMasking.ts`) — not at risk.** No subscription/auth dependency; pure text-processing logic, unaffected by any of the proposed changes.

**Summary: the already-working ₹1,499 subscription creation, webhook handling, and single-slug access determination are not at risk from the proposed changes by themselves. The risk is specifically in how the ₹1,499→₹99/₹499 cascade gets implemented** — it must be built as one shared gate, not two independently-patched call sites, and the existing test fixture should be hardened to actually assert on the slug/cascade logic before that work lands.

---

## 16. Test Impact

| Category | Files | Disposition |
|---|---|---|
| UNIT / PAYMENT | `checkout/request.test.ts`, `checkout/machine.test.ts`, `core-payments/src/createOrder.test.ts` | CHANGED — one-time old-SKU assertions and single-subscription-SKU assumptions no longer hold |
| UNIT / PAYMENT (new surface) | `core-payments/src/createSubscription.test.ts`, `core-payments/src/reconciliation.test.ts` | ADDED-TO — need ₹99/₹499 subscription-creation and pending-identity cases |
| UNIT / AUTH | `core-identity/src/session.test.ts`, `core-entitlements/src/{claimToken,claimEmail,linking}.test.ts` | CHANGED — activation-link semantics change what a pre-activation token/session looks like |
| UNIT / AUTH (new surface) | — | ADDED — no signup/login/activation route test file exists yet; this is wholly new test surface, not an edit |
| UNIT | `core-entitlements/src/{access,funnel,delivery}.test.ts`, `catalog/src/{catalog,ladder}.test.ts` | CHANGED — ladder/implied-access model conflicts with independent-lifecycle + explicit-cascade model; old-SKU fixtures break on removal |
| UNIT / AUTH | `core-subscriptions/src/access.test.ts` | CHANGED — must be generalized or paralleled for ₹99/₹499 |
| UNIT | `core-subscriptions/src/leadUnlockService.test.ts` | UNCHANGED (orthogonal business logic) — but must be updated in lockstep with `access.test.ts` once the cascade lands (§15 item 1) |
| INTEGRATION | `tests/integration/{create-order,create-order-idempotency,entitlements,payment-capture}.integration.test.ts` | CHANGED — old-SKU fixtures |
| INTEGRATION | `tests/integration/launch-gates-phase9.integration.test.ts` | CHANGED — tied to PCG-3B retirement (§4, COMMERCIAL-PO-18) |
| WEBHOOK | `core-payments/src/{webhook,webhookRetention}.test.ts` | UNCHANGED — verification/retention logic orthogonal to commercial model |
| INTEGRATION/BROWSER | `opportunities/[id]/page.test.ts` | ADDED-TO, and its subscription fake should be HARDENED (§15 item 2) before cascade work begins |
| UNIT | `components/client-finder/contactAccess.test.ts`, `core-research/src/contactValueMasking.test.ts` | UNCHANGED — pure view-logic/text-processing, no access.ts dependency |

No E2E test files were found referencing checkout/auth/subscription flows in this repository as of this pass.

---

## 17. Migration Impact

No migration is created by this audit. Based on §7's confirmed schema facts, a future implementation would need:

1. **₹99/₹499 period support** — extend `subscription_periods` (preferred, per §8's engineering recommendation) to accept `ai_income_99`/`ai_freelancing_499` as `product_slug` values. No new table required; no new unique-constraint conflict (confirmed, §7).
2. **Cancellation columns** — `cancelled_at`/`auto_renew` on `subscription_periods` — **not currently required**, since COMMERCIAL-PO-16 puts cancellation out of scope. Listed here only as a forward-looking note, not a current requirement.
3. **Pending-identity support** — no new table required; AUTH-PO-25 decided a dormant `users` row satisfies this, and the existing `users` schema (email + nullable `password_hash`) already supports a password-less row.
4. **No migration needed for the complete-package cascade** — pure read-time logic over existing rows.
5. **Backward compatibility:** none of the above changes an existing column's type or removes a constraint relied on by current code — all are additive. Dummy-data cleanup (§14) is explicitly a separate, not-yet-authorized task from any schema migration.

---

## 18. Implementation Phases

Sequencing only — **not an authorization to begin any phase.**

| Phase | Purpose | Files/Tables | Dependencies | Risks | Tests | Rollback | PO Support |
|---|---|---|---|---|---|---|---|
| 1 | Pending-purchase identity (AUTH-PO-25) — dormant `users` row at checkout; remove `requireUser()` precondition on `create-subscription` | `create-subscription/route.ts`, `createSubscription.ts`, `users` table (no schema change) | None | Must not mint a real session for the dormant row (§15 item 3) | New: dormant-row creation + non-session-until-activation | Revert route to require session | AUTH-PO-25, AUTH-PO-14 |
| 2 | Activation mechanism — token table/reuse, activation email (Resend, AUTH-PO-12), consumption endpoint | New/generalized token table, email sender | Phase 1 | Reusing `claim_tokens` requires relaxing its `orders` FK or building a parallel table | New auth-route tests (currently absent) | Feature-flag the endpoint | AUTH-PO-02/06/07/16/17/27/29/30 |
| 3 | AUTH-PO-11 — remove email-only session mint | `auth/session/route.ts` | Phase 2 (replacement session issuance must exist first) | Low | Existing session tests | Revert | AUTH-PO-11 |
| 4 | ₹99/₹499 subscription-period foundation | `subscription_periods` (extend), webhook handler (map new plan IDs) | None (independent of 1-3) | Must not disturb existing ₹1,499 rows (no shared unique constraint today, confirmed §7) | `access.test.ts`, `catalog.test.ts`, `ladder.test.ts` rewrites | Additive only — safe to roll back by ignoring new slugs | COMMERCIAL-PO-01/03/15 |
| 5 | Complete-package cascade | `access.ts` AND `leadUnlockService.ts` together (§15 item 1 — must not be split) | Phase 4 | Split-brain if built in only one file | Harden `fakeSubscriptionPeriods()` first (§15 item 2) | Revert both files together | COMMERCIAL-PO-02/04 |
| 6 | Old-SKU removal from catalog/checkout/ladder/marketing, **and** retirement of `pcg3b.ts`/`combined.ts`/`recompute.ts`'s "Tier B" code | `types.ts`, `products.ts`, `ladder.ts`, `deliverables.ts`, marketing/kits pages, `docs/PAYMENTS.md`, `pcg3b.ts`, `combined.ts`, `recompute.ts` | None — PCG-3B question resolved (§4, §19) | Must change all of §4's rows, including the three launch-gate files, in one lockstep change or the build fails | 13 test files (§13/§16) | Keep old SKU in catalog but hide from customer-facing surfaces as an interim step, if PO wants to decouple timing | COMMERCIAL-PO-05/13/17/18 |
| 7 | Dev-data cleanup | `users`, `entitlements`, `orders`, `subscription_periods` dummy rows | Phases above should land first so new rows aren't immediately re-created as dummy | None beyond the dev-only scope already established | None | N/A (data op, not code) | COMMERCIAL-PO-13/14, AUTH-PO-28 |
| 8 | Documentation hygiene | `docs/PAYMENTS.md` stale "no subscriptions implemented" line (pre-existing, unrelated staleness noted in §13 research) | None | None | None | N/A | — |

---

## 19. Risks / Blockers

1. **RESOLVED — PCG-3B launch gate.** New finding at §4/§13, resolved this pass by **COMMERCIAL-PO-18**: PCG-3B is retired (not redefined) along with the old SKU. Removing the old SKU per COMMERCIAL-PO-05/13/17/18 is still a breaking compile-time change to `pcg3b.ts`/`combined.ts`/`recompute.ts` — those three files must be edited in the same change as §4's other rows — but it is no longer blocked on a PO decision.
2. **Split-brain cascade risk** (§15 item 1) — mitigated by sequencing Phase 5 as a single atomic change across both files.
3. **Weak test fixture** (§15 item 2) — the opportunity-page test's subscription fake cannot currently catch a cascade/slug regression; recommend hardening before Phase 5, not after.
4. **Ladder-model conflict** — `packages/catalog/src/ladder.ts`'s linear-implication model is structurally in tension with COMMERCIAL-PO-01's independent-lifecycle model; this is a design decision for Phase 4/6, not merely a test-fixture update.
5. **No regression to the already-validated ₹1,499 subscription creation/webhook path** is anticipated **provided** Phase 5 is built as specified (§15 summary) — this is the key existing-feature protection finding of this audit.

---

## 20. Open PO Decisions

Per the FINAL governance audit's §B5 and Addendum 3 §C1, every previously-open question — including the one this audit itself raised (PCG-3B / "Tier B" launch-gate redefinition, resolved by **COMMERCIAL-PO-18**: retire, do not redefine) — is now closed.

**Re-run consistency check (this pass):** scanned this document for every remaining "PO must decide" / "UNCERTAIN" / open-question marker to confirm no other genuine PO decision is pending:

1. §4's marketing-page row (`apps/web/app/(marketing)/client-acquisition-system/page.tsx`) still carries the parenthetical "(or repoint to subscription SKU — PO must decide which)". **Not a genuine open question** — COMMERCIAL-PO-17's text is explicit ("removed from... marketing/product documentation", "OPTION A — REMOVE EVERYWHERE"), not "repoint." The parenthetical is stale phrasing from before COMMERCIAL-PO-17 was finalized; the already-decided answer is **remove**, not repoint. No new PO input is needed here.
2. No other "PO must decide," "UNCERTAIN," or open-question marker was found anywhere else in this document (§§1–19, §21, Rollup) after the PCG-3B resolution above.

**Zero open PO blockers remain.** Every other finding in this document is either an already-decided-but-unbuilt gap (tracked in §3's compliance matrix) or a pure engineering/sequencing judgment call consistent with existing decisions (per the same reasoning the FINAL audit itself used in its own §9 and §16).

---

## 21. Final Readiness Assessment

**NOT READY TO IMPLEMENT** — but no longer for a governance reason.

- All governance decisions are final, consistent, and complete; the one new PCG-3B question raised by this audit is now resolved (§20) by COMMERCIAL-PO-18.
- **Zero open PO blockers remain.** Readiness is now gated purely on implementation effort, not on any pending PO decision.
- The regression risk against the already-working Client Finder subscription feature (§15) is real but fully mitigable by sequencing the entitlement cascade as one atomic change across `access.ts` and `leadUnlockService.ts`, and by hardening the existing test fixture first — no architectural blocker exists there.
- All phases in §18 (1-8, including Phase 6's old-SKU-and-PCG-3B removal) have no open PO questions blocking them and could be planned once implementation is authorized.
- **Implementation is still NOT authorized by this audit or its update** — see §1 and the confirmation footer.

---

## Rollup

**Files requiring modification:** `packages/catalog/src/{types,products,ladder,deliverables}.ts`; `apps/web/app/(marketing)/client-acquisition-system/page.tsx`; `apps/web/app/kits/page.tsx`; `docs/PAYMENTS.md`; `apps/web/app/api/payments/create-subscription/route.ts`; `packages/core-payments/src/createSubscription.ts`; `apps/web/app/api/auth/{session,signup}/route.ts`; `packages/core-subscriptions/src/{access.ts,leadUnlockService.ts}`; `packages/core-payments/src/webhookHandler.ts`; `packages/core-launch-gates/src/{pcg3b,combined}.ts`; `packages/core-launch-gates-validation/src/recompute.ts`.

**Files requiring deletion (pending PO confirmation of scope):** `apps/web/app/(marketing)/client-acquisition-system/page.tsx` (or repoint — PO choice).

**Files requiring creation:** activation-token mechanism (new table or generalized `claim_tokens`); activation email templates/sender wiring; new auth-route tests (signup/login/activation currently untested as routes); new `access.ts`/`leadUnlockService.ts` shared-gate module (recommended refactor, not strictly required).

**Migrations required:** none created by this audit; §17 lists what a future implementation would need (extend `subscription_periods` for ₹99/₹499; no cancellation columns needed while COMMERCIAL-PO-16 holds; no new table for pending identity).

**Data cleanup required:** per §14 — dummy ₹99/₹499/old-₹1,499 records and password-less dev accounts; not performed here.

**Tests affected:** 24+ files across UNIT/INTEGRATION/PAYMENT/AUTH/WEBHOOK categories; full list in §16.

**Blockers:** none. The only PO-level blocker found (PCG-3B redefinition, §19/§20) is resolved by COMMERCIAL-PO-18.

**Risks:** entitlement-cascade split-brain; weak test fixture; ladder-model conflict (§19).

**Safe to implement without another PO decision:** all of Phases 1-8 of §18, including Phase 6 (old-SKU and PCG-3B removal together).

**Must come back to the Product Owner:** nothing outstanding. §20's re-run consistency check found no other genuine open PO question in this document.

---

**Confirmation:** No application code, database schema, migration, database row, test, or fixture was created, modified, or deleted in producing this document. No commit, push, or deployment was made.
