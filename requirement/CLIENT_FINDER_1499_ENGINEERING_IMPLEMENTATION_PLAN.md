# ₹1,499 Advanced Client Finder Subscription — Engineering Implementation Plan

## 0. Document status

**THIS IS A PLAN. NO CODE, SCHEMA, MIGRATION, TEST, ROUTE, OR CONFIGURATION FILE WAS MODIFIED TO PRODUCE IT.**
Nothing was staged, committed, pushed, or deployed. This document is read-only engineering analysis and proposed
design, grounded in the repository state and the finalized Product Owner governance records listed in §B. It
introduces **no new Product Owner decisions**; where the repository audit surfaced a gap the governance records do
not resolve, it is reported in §Q, not silently resolved.

### 0A. Revision 2 notice — credit model removed

This is **Revision 2** of this plan. Revision 1 designed a 300-credit / 10-credit-per-unlock / 30-unlock-per-period
commercial model. The Product Owner has since superseded that commercial model — see
`requirement/CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`
(`CLIENT-FINDER-1499-SUBSCRIPTION-ACCESS-MODEL-PO-DEC-002`). The ₹1,499 product is now **time-bounded (30-day)
access to the AI Client Finder, with no credit balance, no per-unlock charge, and no fixed lead/unlock quota.**

**What this revision changes, section by section:**
- **Removed entirely:** the credit ledger (§F, previously a full design section — now a historical-note stub),
  `credit_ledger_entries` (previously §E.2), credit allocation/debit services, credit-related migrations, the
  `INSUFFICIENT_CREDITS` route response, and every credit-balance check.
- **Unchanged:** subscription periods (§E.1, minus credit-snapshot columns), the lead-unlock eligibility test
  (Q-UNLOCK-1B — target-customer-match + qualifying contact channel), the reveal content (IRL-J), permanent unlock
  ownership (IRL-I), the Razorpay recurring-payment design (§H), and the subscription lifecycle (activation,
  expiry, renewal, failed payment, overlap, refund, cancellation).
- **Newly resolved:** the zero-entitlement-access question (previously open §Q.3 / Blocker 2) — now decided: a
  zero-entitlement user may browse/discover; subscriber-only actions (unlock) require an active subscription. See
  `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §5.5.
- **Not reopened by this revision:** K1 semantics, Path A/Path B behavior, the new SKU literal, or any lifecycle
  mechanic not tied to credits.

This plan remains **analysis and proposed design only** — Revision 2 carries the same non-authorization scope as
Revision 1 (§R).

### 0B. Revision 3 notice — opportunity-eligibility rule replaced (target-customer match no longer a gate)

This is **Revision 3** of this plan. The Product Owner has replaced the Q-UNLOCK-1B eligibility rule with a new
rule in `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-
PO-DEC-002`):

> **Opportunity eligibility = at least one contact channel available** (`BUSINESS_EMAIL`, `PERSONAL_EMAIL`,
> `UNCERTAIN_EMAIL`, or `PHONE`). **Target-customer match is NOT an eligibility gate** — it is a
> qualification/ranking signal only.

**What this revision changes, section by section:**
- **§B:** the Q-UNLOCK-1B row is updated to show the superseded two-condition rule alongside the current
  one-condition rule.
- **§G:** the eligibility evaluation steps drop the target-customer-match check entirely; the
  `NOT_TARGET_CUSTOMER_MATCH` ineligibility reason code is removed; only `NO_QUALIFYING_CONTACT` remains, now
  checking all four K1 kinds (`BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE`) instead of two. Reveal
  now covers all four kinds, not two.
- **§I:** the access-control table's cross-reference to Q-UNLOCK-1B is updated to reflect that unlocking is gated
  on contact-channel presence only, independent of target-customer match.
- **§L:** the UNLOCK test-plan cases are updated — the `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL` "rejected" cases and the
  "target match NO" rejection case from Revision 2 are removed; new cases reflect that any qualifying channel
  alone is sufficient regardless of target-customer-match state, and that no-contact-at-all is the only rejection
  path.
- **Not reopened by this revision:** the ₹1,499 no-credit commercial model (§0A, unaffected), K1 semantics, Path
  A/Path B behavior, the new SKU literal, the subscription lifecycle mechanics, or the contact-value-capture
  blocker's existence (Risk #1 — though its *scope* widens; see §Q.1).

This plan remains **analysis and proposed design only** — Revision 3 carries the same non-authorization scope as
Revision 1/2 (§R).

### 0C. Revision 4 notice — final reconciliation pass (Razorpay event inventory, contact-display rule, no new PO decisions)

This is **Revision 4** of this plan — a final engineering reconciliation pass requested after the Product Owner
confirmed three things: (1) the ₹1,499 = 30-day/no-credit/no-quota model (§0A) and the any-one-of-four-channel
opportunity-eligibility rule (§0B) are final and not reopened; (2) the **contact-display rule** is made explicit —
when an opportunity has multiple contact channels, **all** are shown, with no invented precedence that hides one
in favor of another; (3) the Product Owner supplied the **actual Razorpay webhook event names currently available
in their dashboard configuration**, replacing the "candidate, unverified names" framing in Revision 1–3's §H.

**What this revision changes, section by section:**
- **§G:** adds an explicit confirmation of the contact-display rule (no change to the already-multi-field reveal
  shape — Revision 3 already modeled it correctly; this revision just states the rule itself, since it was
  previously only implicit in the response shape).
- **§H:** replaced wholesale. The event list is no longer "candidates to verify" — it is now partitioned into (a)
  the one event this plan's access model actually needs to act on (`subscription.charged`), (b) events that are
  log-only / no access-layer effect under the already-decided IRL-O principle ("Razorpay's own status is never the
  access authority"), and (c) events genuinely out of scope for this feature. Exact **payload field shapes and API
  call parameters remain unverified** and are still marked `RAZORPAY VERIFICATION REQUIRED` — only the *existence*
  of these event names in the account's webhook configuration is now confirmed, not their fields.
- **§I:** adds explicit rows for `paused`, `halted`, `resumed`, `completed`, `authenticated`/`pending`, and
  `updated` provider states. **No new commercial rule is invented for any of them** — per the task's own
  instruction, since none of these is explicitly governed, they are resolved using the *already-decided* IRL-O
  architectural principle (provider status is informational, never the access gate) rather than treated as a new
  PO decision. This is reported as an engineering resolution, not a silently-invented commercial rule.
- **§L, §M, §Q:** updated to reflect the above — new test cases for the log-only provider events, a concrete
  13-step manual E2E procedure with infeasible-in-Test-Mode scenarios flagged, and §Q.4 narrowed (event *names*
  are no longer unverified; payload *fields* still are).
- **Not reopened by this revision:** the no-credit commercial model, the four-channel eligibility rule, K1
  semantics, Path A/Path B, the new SKU literal, or the contact-value-capture blocker (Risk #1, §Q.1) — which
  remains the single largest unresolved item and is unaffected by any of the above.

This plan remains **analysis and proposed design only** — Revision 4 carries the same non-authorization scope as
Revisions 1–3 (§R). **No application code, schema, migration, route, or test file was modified to produce this
revision; nothing was staged, committed, pushed, or deployed.**

### 0D. Revision 5 notice — contact-value-capture spike resolves Risk #1's scope

This is **Revision 5** — a documentation-only correction applied immediately after
`requirement/CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md` (an investigation/design spike, not an
implementation) determined exactly how contact values can be recovered from already-persisted evidence, without
touching K1, Path A, or Path B. **What changes:** §E.3's `revealed_business_email`/`revealed_phone` scalar columns
are removed and replaced by a new §E.5 child table, `lead_unlock_contacts` (one row per revealed value, supporting
any number of values across all four K1 kinds); §G's eligibility footnote referencing an unresolved capture
mechanism is resolved; §K's file list gains the new extraction module and migration; §Q.1 is downgraded from
"BLOCKER — large and unscoped" to "ENGINEERING DETAIL — scoped." **Not reopened:** the commercial model, the
eligibility rule, the contact-display rule, K1, Path A, Path B, or any other section. This revision, like 1–4,
remains analysis and proposed design only — **no application code, schema, migration, route, or test file was
modified; nothing was staged, committed, pushed, or deployed.**

---

## A. Executive Summary

**What must be built.** The repository today has **zero code supporting any subscription or time-bound entitlement
concept.** The ₹1,499 subscription model requires net-new work in every layer: catalog identity, database schema,
a lead-unlock (reveal) transaction, Razorpay recurring-payment handling, and — for the first time — actual
entitlement/product-tier gating on Client Finder routes (which today have **none**; see §C.3). This is not an
extension of an existing subscription system; it is the first one. **It is also, as of Revision 2, not a credit
system** — there is no ledger, no balance, and no per-action charge to implement.

**What already exists and can be reused.** The repository has strong, directly-reusable patterns for exactly the
hard parts of this problem:
- Idempotent webhook ingestion with signature verification, `ON CONFLICT DO NOTHING` dedupe, and raw-SQL
  transactions (`packages/core-payments/src/webhookHandler.ts`, `webhookPgStore.ts`, `webhook.ts`).
- Idempotency-key + unique-index + race-self-heal pattern for request-level idempotency
  (`packages/core-payments/src/createOrder.ts`).
- Append-only, timestamp-revocation (never delete/mutate) data modeling, already used for `entitlements.revoked_at`
  and `claim_tokens.invalidated_at`.
- A tri-state, append-only, source-bound determination model (`target_customer_match_determinations`), a useful
  structural precedent for the append-only `subscription_periods`/`lead_unlocks` rows this plan still proposes.
- A worker process (`apps/worker`) already running a periodic tick loop (Pattern B gate-evaluation), a direct
  precedent for an expiry-sweep or reconciliation job if one is wanted (not required — expiry can also be computed
  on read; see §D.8).

**What is missing (the real gaps, not just "needs a table").**
1. **No code anywhere stores the actual `BUSINESS_EMAIL`/`PHONE` string value** for an Opportunity/Prospect/Company
   — K1 (`contactIdentifiers.ts`) is a presence/rejection detector only; it never returns the matched value. This
   directly blocks the "reveal contact information" half of the unlock transaction (IRL-J) and remains, unchanged
   by Revision 2, the largest unknown in this plan. See §Q, Risk #1.
2. **Client Finder has no product/entitlement gating of any kind today** — only session authentication
   (`apps/web/app/api/searches/route.ts:27-41`). Building ₹1,499-subscription-gated access is not "add a check to
   an existing gate" — it is building Client Finder's first commercial gate.
3. **No Razorpay Subscriptions API usage exists anywhere** — the entire payment integration is one-time-order
   based (`razorpayClient.ts` calls only `orders.create` and `orders.fetchPayments`). Recurring billing is 100%
   new integration work. **As of Revision 4, the Product Owner has confirmed which subscription webhook event
   *names* are available in the account's dashboard configuration (§H) — but the exact payload field shapes and
   `subscriptions.create`/customer-identity API call parameters remain unverified against Razorpay's live API**
   and must be confirmed before implementation (flagged as an external dependency, not invented here).
4. **The Prisma schema is 39 migrations behind the raw-SQL schema** (`schema.prisma` models only 6 of 30+ actual
   tables). Any new subscription tables should follow the repository's dominant, already-proven convention —
   hand-written SQL migrations + raw `pg` repositories — not introduce a second ORM-modeled island.
5. A mapping ambiguity between the governance records' "₹499/₹1,499 Client Finder entitlement" framing and the
   actual catalog (`ai_freelancing_499` is a *different* product from whatever "Client Finder ₹499" means) — see
   §Q, Risk #2. This affects what "all-tier access" in PO-D2 actually gates in code today.

**Major implementation risks.** (1) the contact-value-capture gap is a genuinely large, not-yet-scoped build item
touching the research/evidence pipeline, not just a schema addition; (2) Razorpay Subscriptions API mechanics are
unverified against the live provider; (3) Client Finder's current zero-gating state means this plan's access-control
section is greenfield, not an extension.

**Can the repository support this without architectural restructuring?** **Yes, and Revision 2 needs less new
architecture than Revision 1 did.** The existing idempotency/transaction/append-only-row patterns are directly
reusable and no existing system needs to be torn up. The necessary structural addition is a new bounded context
(`packages/core-subscriptions`, proposed in §D) for subscription periods and lead-unlock ownership only — no
credit ledger is part of it. This is additive, not a restructuring of `core-entitlements`, `core-payments`, or
`core-research`.

---

## B. Governing Decisions

All items below are **already DECIDED** by the Product Owner and are treated as authoritative and unmodified by
this plan. Full text is in the cited files; only load-bearing facts are summarized here.

| Record | Key decided facts | Status after Revision 2 |
|---|---|---|
| `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` (`...-PO-DEC-002`) | ₹1,499 = 30-day time-bounded Client Finder access; no credits, no balance, no per-unlock charge, no fixed lead/unlock quota; zero-entitlement users may browse/discover; subscriber-only actions require an active subscription. | **Current authoritative commercial model.** |
| `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D1–PO-D11) | Subscription-period (not calendar-month) validity; ₹1,499 active subscription = all-tier Client Finder eligibility; configurable `duration_days`, default 30, snapshotted at activation. | **PO-D1/PO-D2/PO-D6–PO-D8/PO-D10 remain in force** (duration/validity mechanics). **PO-D3/PO-D4/PO-D9 (credit figures, no-rollover, period-scoped credits) are SUPERSEDED** — see access-model record §6. |
| `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` (§5, §5A) | `ai_client_acquisition_1499` is **not** repurposed. New, distinct SKU literal: **`ai_client_acquisition_1499_subscription`**. | **Unaffected — in force.** |
| `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` | 10 credits = 1 successful unlock. Derived: 30 unlocks/period. | **SUPERSEDED in full** — see access-model record §6. Retained as historical governance only. |
| `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md` (Q-UNLOCK-1) | Successful unlock = explicit user-initiated unlock of a qualified lead that reveals/accesses qualifying business contact information. | **Behavioral definition remains in force; its "only success consumes credits" clause is moot (no credits exist to consume).** The idempotency requirement remains. |
| `CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md` (§5.1, §5.3, §6) | Eligible only if target-customer match = YES **AND** at least one of `BUSINESS_EMAIL`/`PHONE` is K1-detected. `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL` never qualify. PHONE's acceptance is commercial-layer only — K1 unchanged. | **SUPERSEDED as of Revision 3** — see `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`...-PO-DEC-002`) below. §6's K1 boundary statement remains correct and in force. |
| `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002`) | Eligible if at least one of `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE` is K1-detected. Target-customer match is **not** a gate — qualification/ranking signal only. Reveal must cover all four kinds, not just two. | **Current authoritative opportunity-eligibility rule.** |
| `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` (IRL-A through IRL-P, + P-CORRECTION) | Full lifecycle: activation, expiry, renewal, failed payment, overlap rejection, unlock ownership, reveal content, historical-SKU independence, post-expiry access, refund/cancellation, provider-lifecycle interpretation, configuration-vs-identity rules. | **IRL-A/B/C/D/E/I/J/K/L/M(minus credit clause)/N(minus credit clause)/O remain in force. IRL-F, IRL-G, and IRL-H's debit-specific clauses, and the `credits_per_period`/`credits_per_unlock` portions of IRL-P/P-CORRECTION, are SUPERSEDED** — see access-model record §6–§8. `duration_days`'s treatment in IRL-P is unaffected. |
| `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` (ES-1, ES-5–ES-11) | ₹499/₹1,499 Client Finder entitlements are cumulative, not mutually exclusive (ES-1); ₹1,499 (while active) governs feature access (ES-7); renewal/expiry/cancellation lifecycle superseded as policy by PO-D1/IRL. | **Unaffected by Revision 2** — ES-5/ES-6 (separate credit buckets) are now moot for ₹1,499 specifically (no ₹1,499 credit bucket exists), but this plan does not reopen ES-5/ES-6 for ₹499. |
| `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` (cited, not re-litigated) | ₹499 = 50, ₹1,499 = 300 "monthly" credit caps. | **PDEF-2's ₹1,499 figure (300) is superseded by the access-model record for the ₹1,499 subscription specifically; its ₹499 figure (50) is untouched and not reopened here.** |

**Not reopened by this plan:** any figure, rule, or definition above, beyond the specific credit-model supersession
already recorded in `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`. Where the repository audit (§C)
could not find code implementing a decision's premise (e.g., no Client Finder entitlement gate exists at all
today), that is reported as a finding in §Q — not treated as license to reinterpret any decision.

---

## C. Current-State Repository Map

*(Unchanged by Revision 2 — this is a repository audit, not a design choice. Retained from Revision 1.)*

### C.1 Product/Catalog — `packages/catalog/src/`
- `types.ts:19-22` — `ProductId` is a **closed literal union**: `'ai_income_99' | 'ai_freelancing_499' |
  'ai_client_acquisition_1499'`. No `ai_client_acquisition_1499_subscription` yet (expected — not yet authorized).
- `types.ts:35-63` — `Product` interface: `id, name, amountPaise, currency ('INR' only), metaValueInr`. No
  recurrence, validity, or interval field of any kind.
- `products.ts:31-37` — `ai_client_acquisition_1499`: flat one-time price, `amountPaise: 149900`, name "AI Client
  Acquisition System".
- `deliverables.ts:122-151` — four static one-time deliverables (PDF/ZIP/ZIP/MP4) tied to that id.
- `ladder.ts:16-20` — `ai_client_acquisition_1499` is top rung of a one-time-purchase "ladder" (owning higher rung
  implies owning lower rungs' *deliverables*) — no time dimension.
- Zero matches anywhere in the package for `subscription|recurring|expiry|validity|renew`.
- **Note:** `ai_freelancing_499` ("AI Freelancing Launch Kit") is the only ₹499 product in this catalog. It is
  product-wise distinct from whatever "₹499 Client Finder" means in PDEF-2/ES decisions — see §Q Risk #2.

### C.2 Entitlements / Access — `packages/core-entitlements/src/`, `apps/web/src/server/`
- `types.ts:4-13` — `Entitlement { id, customerEmail, productSlug, orderId, grantedAt, revokedAt, userId }`. **No
  `expiresAt`.** One-time grant + optional revocation (timestamp, never delete) by design.
- `access.ts:31-74` — `resolveAccess()`, `requireProductAccess()`, delegating to `funnel.ts`'s `canAccessProduct()`
  (ladder-expanded, not exact-match).
- `apps/web/src/server/access.ts:37-54` — `currentAccess()`, the app-level equivalent used by catalog product
  pages (`/access`, `/access/[productId]`, `/upsell/[productId]`, download routes).
- **Client Finder routes use none of the above.** `apps/web/app/api/searches/route.ts:27-41` gates only on session
  token (`UnauthenticatedError` → 401); no `ProductId`/entitlement check anywhere in Client Finder code.

### C.3 Database — `packages/db/prisma/`
- ORM: Prisma, but `schema.prisma` models only 6 tables (`Order, Payment, WebhookEvent, MetaEvent,
  IdempotencyReconciliation, ProductionIndexMigration`); everything from migration `0004` onward (`entitlements`,
  `users`, `searches`, `companies`, `prospects`, `opportunities`, `target_customer_match_determinations`,
  `claim_tokens`, etc. — 30+ tables) exists **only as raw SQL**, accessed via hand-written `pg` repositories.
- **Latest migration: `0039_claim_tokens_invalidated_at`** (sequence 0001→0039, unbroken; a `migrations-blocked/`
  directory holds two never-applied migrations).
- Existing idempotency-key patterns: `orders.idempotency_key` (unique), `webhook_events.razorpay_event_id`
  (unique, `ON CONFLICT DO NOTHING`), `meta_events.meta_event_id` (unique), `refund_events.razorpay_refund_id`
  (unique, same dedupe idiom), `searches.(user_id, idempotency_key)` (scoped partial unique), `claim_tokens.token_hash`
  (unique, single-use).
- **Zero existing tables/columns** for subscriptions, subscription periods, or lead-unlock ownership — confirmed
  by exhaustive grep.
- Transaction convention in actual use: raw `BEGIN/COMMIT/ROLLBACK` via `createWebhookTransactionRunner`
  (`packages/core-payments/src/webhookPgStore.ts:65-82`), wired through `apps/web/src/server/webhookStore.ts:32-33`
  and `apps/worker/src/reconciliation/worker.ts:75`. Prisma's `$transaction` exists but is unused by application
  logic.
- Locking conventions: `SELECT ... FOR UPDATE` (refund/webhook dedupe), `FOR UPDATE SKIP LOCKED` (queue-claim
  pattern for `searches`/`meta_events` worker leasing), `FOR SHARE` (trigger-level race closing in
  `payments_match_order`).

### C.4 Razorpay — `packages/core-payments/src/`, `apps/web/app/api/payments/`, `apps/web/app/api/webhooks/razorpay/`
- **100% one-time-order based. No Razorpay Subscriptions/Plans API usage anywhere** (confirmed by grep across
  `packages/core-payments` and the payments routes; only `instance.orders.create` and `instance.orders.fetchPayments`
  SDK calls exist).
- `createOrder.ts` — price authority is the catalog only (client-supplied price rejected by `.strict()` Zod
  schema); `Idempotency-Key` header + DB-unique-index + race-self-heal-via-reread pattern.
- `apps/web/app/api/payments/verify/route.ts` — confirmed a literal 21-line **501 stub**, explicitly scoped to
  "fast optimistic thank-you UX only," forbidden from ever granting entitlement — that is reserved for the webhook
  path.
- `webhookHandler.ts:64` — `SUPPORTED_EVENTS = ['payment.captured', 'refund.created', 'refund.processed']`;
  anything else is acknowledged as `'ignored'` (HTTP 200, no retry storm).
- Signature verification: HMAC-SHA256 + `timingSafeEqual`, 1 MiB body cap checked before hashing, raw-bytes
  required before any JSON parse (type-enforced `VerifiedWebhook` branding).
- Dedupe: `webhook_events.razorpay_event_id` unique + `ON CONFLICT DO NOTHING`; refunds have a second, independent
  dedupe on `refund_events.razorpay_refund_id`.
- `.env.example:23-29` / `packages/config/src/env.ts:36-40,151-159` — only `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
  `RAZORPAY_WEBHOOK_SECRET` exist. No plan/subscription-id env var.
- Tests: `createOrder.test.ts`, `webhook.test.ts`, `webhookRetention.test.ts`, `reconciliation.test.ts`,
  `tests/integration/webhook-route.integration.test.ts`, `tests/integration/create-order(-idempotency).integration.test.ts`
  — none reference subscriptions/plans/recurring billing.

### C.5 Client Finder / K1 / PCG-4 — `packages/core-research/src/`, `packages/core-opportunity/src/`
- K1 `contactIdentifiers.ts:18-23` — `ContactIdentifierKind = 'BUSINESS_EMAIL' | 'PERSONAL_EMAIL' | 'UNCERTAIN_EMAIL'
  | 'PHONE' | 'FRAGMENT'` (string-literal union, not exported from package `index.ts`). `containsPersonalContactIdentifier`
  (lines 1223-1227) groups `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE` as personal; `containsAnyContactIdentifier`
  additionally includes `BUSINESS_EMAIL`. Both are built on `detectContactIdentifiers()`, which returns **only**
  `readonly ContactIdentifierKind[]` — never the matched text, offset, or value. Explicit header comment: "never
  strips, masks, or rewrites a value... no value, substring, offset, or quote is ever returned."
- **Confirmed: no field anywhere (`StoredCompany`, `StoredProspect`, `StoredOpportunity`) holds an actual
  email/phone string.** K1's only call sites (`intentSignal.ts:338`, `intentSourceProviderContract.ts:373-396`)
  use it exclusively to **reject** evidence containing personal identifiers at intake — never to capture a value.
- PCG-4 `targetCustomerMatch.ts:32-33` — confirmed tri-state `'MATCH' | 'NO_MATCH' | 'NOT_YET_OBSERVED'`, aggregated
  fail-closed (contradictory or absent evidence → `NOT_YET_OBSERVED`, never auto-resolved to a match).
  Persisted in `target_customer_match_determinations` (append-only, `supersededPrevious()`, never deleted); **no
  API route exposes this today.**
- `StoredOpportunity` (`packages/core-opportunity/src/types.ts:40-59`) — `id, userId, prospectId, state,
  needDetected, offer, staleness, stalenessComputedAt, createdAt, updatedAt`. No contact, match-status, or
  unlock/reveal field.
- Client Finder API surface (full inventory of `apps/web/app/api/**`): no `GET /api/opportunities` list/detail
  route exists; the only Opportunity route is `opportunities/[id]/feedback` (deliberately scoped to feedback only,
  per its own code comment). No route anywhere implements "unlock" or "reveal contact."
- Tests: `contactIdentifiers.test.ts`, `targetCustomerMatch.test.ts`, `targetCustomerMatchRepository.test.ts`,
  `tests/integration/target-customer-match.integration.test.ts`, `tests/integration/opportunity*.integration.test.ts`
  — exhaustive on classification/match logic, none touch contact-value storage (because none exists) or unlock.

---

## D. Target Architecture

**New bounded context: `packages/core-subscriptions`** (proposed name/location; not yet created). Mirrors the
existing `packages/core-payments` / `packages/core-search` convention: a `pg`-based repository layer, a
dependency-injected `transaction` helper reusing the existing `createWebhookTransactionRunner`-style pattern, and
pure functions for lifecycle logic separated from I/O (mirroring `targetCustomerMatch.ts`'s pure-evaluator +
`targetCustomerMatchRepository.ts`'s I/O split). **No credit ledger is part of this context as of Revision 2.**

| Concern | Authoritative state | Derived state | Provider state | Cached/operational state |
|---|---|---|---|---|
| 1. Subscription product | New catalog entry (`packages/catalog`) | — | Razorpay Plan id (external) | — |
| 2. Subscription periods | `subscription_periods` row (this plan, §E) | "is active" (computed from `activation_at + duration_days` vs now, and `refunded_at`) | Razorpay subscription id/status (reference only, per IRL-O — **never the access authority**) | — |
| 3. ~~Credit allocations~~ | ~~REMOVED~~ — no credit ledger exists in Revision 2 | — | — | — |
| 4. ~~Credit debits~~ | ~~REMOVED~~ — no credit ledger exists in Revision 2 | — | — | — |
| 5. Unlock (reveal) ownership | `lead_unlocks` row, unique `(user_id, opportunity_id)` — now a reveal-and-permanent-grant record only, no debit attached | — | — | — |
| 6. Entitlement/access gating | Existing `entitlements` table (₹99/₹499/one-time ₹1,499) **+ new**: "does this user have an active `subscription_periods` row for `ai_client_acquisition_1499_subscription`" | Combined access decision (new gate; see §I) — a pure boolean, no balance component | — | — |
| 7. Razorpay recurring lifecycle | Webhook-captured events only (IRL-A, IRL-O) | — | Razorpay subscription object | — |
| 8. Expiry | `activation_at + duration_days` (computed, not polled — IRL-B/O) | "active" boolean at read time | — | optional: a worker sweep *only* if a scheduled access-revocation side-effect (e.g. notification) is wanted later — **not required for correctness**, since expiry is computed on every access check |
| 9. Renewal | New, independent `subscription_periods` row per successful charge (IRL-C) | — | — | — |
| 10. Refund | `subscription_periods.refunded_at` (timestamp, never delete — same idiom as `entitlements.revoked_at`) | "active" excludes refunded rows | Razorpay refund event | — |
| 11. Cancellation | No new state needed beyond "no further renewal webhook arrives" (IRL-N/O) — current period simply runs to its own expiry | — | Razorpay cancellation status (informational only) | — |
| 12. Idempotency | Unique DB constraints (period creation keyed to the capturing charge; reveal keyed to `(user_id, opportunity_id)`) | — | Razorpay webhook `X-Razorpay-Event-Id` (reused for the outer webhook-event dedupe, same as today) | — |
| 13. Concurrency control | DB unique-constraint + `ON CONFLICT`/re-read (period creation), single transactional boundary for reveal (unlock) | — | — | — |

**Key architectural principle (directly from IRL-O, restated for engineering):** the product's own computed
`activation_at + duration_days` and `refunded_at` are the sole authority for access. Razorpay's own subscription
status field is read only for display/reconciliation, never as a gate. **As of Revision 2, access is a pure
boolean (active/inactive) with no balance dimension.**

---

## E. Database / Migration Plan

Proposed as **raw SQL migrations** (next available: `0040`+), consistent with the repository's dominant convention
(§C.3) rather than extending the already-behind Prisma schema. **No SQL is written here — this is a column-level
specification only, per the task's instruction not to write SQL yet.**

### E.1 `subscription_periods`

| Field | Type | Null? | Purpose |
|---|---|---|---|
| `id` | TEXT (PK) | NOT NULL | Period identity |
| `user_id` | TEXT (FK → users, CASCADE) | NOT NULL | Owning user |
| `product_slug` | TEXT | NOT NULL | `'ai_client_acquisition_1499_subscription'` (constant today; column kept generic, not hard-coded, for future subscription SKUs) |
| `razorpay_subscription_id` | TEXT | NOT NULL | Provider subscription identity (reference only, IRL-O) |
| `razorpay_payment_id` | TEXT | NOT NULL | The specific captured charge that activated **this** period — the idempotency anchor |
| `activation_at` | TIMESTAMPTZ | NOT NULL | IRL-A: webhook-captured-charge timestamp |
| `duration_days` | INTEGER | NOT NULL | Snapshotted at creation (PO-D10, IRL-P) |
| `refunded_at` | TIMESTAMPTZ | NULL | Timestamp-not-delete pattern, mirrors `entitlements.revoked_at` (N) |
| `created_at` / `updated_at` | TIMESTAMPTZ | NOT NULL | Standard |

**Revision 2 change:** the `credits_per_period_snapshot` and `credits_per_unlock_snapshot` columns proposed in
Revision 1 are **removed** — there is no credit figure to snapshot.

- **Uniqueness:** `UNIQUE(razorpay_payment_id)` — guarantees one period per captured charge. A secondary index on
  `(user_id, product_slug)` supports the "does this user have an active period" and overlapping-purchase-rejection
  (E) checks.
- **No `expiry_at` stored column is required** — it is `activation_at + duration_days * interval '1 day'`,
  computable in a query or exposed via a generated column if read-performance later demands it (engineering
  choice, not decided here).
- **Foreign keys:** `user_id → users(id)`.
- **Lifecycle:** append-only; a row is never updated except to set `refunded_at` once.
- **Backfill:** none — no prior data of this shape exists (confirmed §C.3).

### E.2 ~~`credit_ledger_entries`~~ — REMOVED

**This table is no longer part of the plan.** Revision 1 specified an append-only allocation/debit ledger scoped
per `subscription_period_id`. The Product Owner has removed the credit commercial model entirely
(`CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §6, §11) — there is no balance to allocate, debit,
or derive. No migration for this table should be written. (Previously proposed as migration `0041` — that number
is simply not used; nothing was ever applied, so there is nothing to roll back.)

### E.3 `lead_unlocks`

| Field | Type | Null? | Purpose |
|---|---|---|---|
| `id` | TEXT (PK) | NOT NULL | Row identity |
| `user_id` | TEXT (FK → users) | NOT NULL | Owning user — permanent grant (I) |
| `opportunity_id` | TEXT (FK → opportunities) | NOT NULL | The unlocked lead |
| `subscription_period_id` | TEXT (FK → subscription_periods) | NOT NULL | Provenance only — **not** a re-check gate; ownership survives period expiry (I) |
| `unlocked_at` | TIMESTAMPTZ | NOT NULL | When the unlock occurred |
| `created_at` | TIMESTAMPTZ | NOT NULL | Standard |

**Revision 5 change (`CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md` §13, §15):** the `revealed_business_email`/
`revealed_phone` scalar columns proposed in Revision 1–4 are **removed from this table** — two fixed columns
cannot hold more than one value per kind, and Revision 4's contact-display rule requires supporting an arbitrary
number of values across all four kinds. Captured values now live in a new child table, §E.5
`lead_unlock_contacts`, one row per revealed value, FK'd to this table's `id`.

**Revision 2 change (unaffected by Revision 5):** this table was never credit-bearing itself (the credit debit
lived in the now-removed ledger table, linked by a `lead_unlock_id` FK that no longer has anywhere to point). This
table remains necessary (§11 of the access-model decision record): it is still the permanent-grant record (IRL-I)
and the idempotency anchor for the reveal operation (Q-UNLOCK-1's idempotency requirement), just without any
associated debit.

- **Uniqueness:** `UNIQUE(user_id, opportunity_id)` — **the** idempotency key for the entire unlock (reveal)
  transaction: a retried/duplicate request hits this constraint and the handler returns the existing row instead of
  re-processing.
- **Dependency (narrowed by Revision 5):** the contact-value-capture gap (§Q, Risk #1) is no longer unscoped — the
  capture spike determined the exact extraction mechanism and the exact new table (§E.5) this row's values are
  written to. This table itself no longer carries the captured values directly, so it can be created independently
  of §E.5 being finished.
- **Backfill:** none; per IRL-L, no pre-existing data is retroactively treated as unlocked.

### E.4 Subscription/provider relationship

A `subscription_periods` row references exactly one `razorpay_subscription_id` (the provider's recurring mandate)
and one `razorpay_payment_id` (the specific charge that created *this* period). Renewal charges on the same
provider subscription produce additional, independent `subscription_periods` rows sharing the same
`razorpay_subscription_id` but each with its own `razorpay_payment_id` — directly implementing IRL-C's "new,
independent period per charge, never mutate the prior row."

### E.5 `lead_unlock_contacts` (new in Revision 5)

| Field | Type | Null? | Purpose |
|---|---|---|---|
| `id` | TEXT (PK) | NOT NULL | Row identity |
| `lead_unlock_id` | TEXT (FK → lead_unlocks, CASCADE) | NOT NULL | The unlock this value was captured for |
| `kind` | TEXT, `CHECK IN ('BUSINESS_EMAIL','PERSONAL_EMAIL','UNCERTAIN_EMAIL','PHONE')` | NOT NULL | Which K1 kind this value classified as (excludes `FRAGMENT` — never a qualifying kind) |
| `value` | TEXT | NOT NULL | The extracted literal contact value |
| `created_at` | TIMESTAMPTZ | NOT NULL | Standard |

One row per distinct `(kind, value)` revealed for that unlock — supports any number of values, across all four
kinds, per the contact-display rule (§G). Populated once, inside the same unlock transaction that inserts the
`lead_unlocks` row (§G), by the new extraction module determined in the capture spike (§13 there) — never at
ingestion time, never touching Path A, Path B, or K1. See
`CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md` §12-§13 for the full options analysis and rationale.

---

## F. Credit Ledger Design — REMOVED (historical note only)

**Revision 1 of this document specified a full append-only credit-ledger design here** (allocation/debit row
kinds, worked balance examples, insufficient-balance handling). **That design is removed in Revision 2** because
the commercial model it supported (300 credits/period, 10 credits/unlock) is superseded —
see `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §6. No ledger, balance, or per-action charge is
part of this plan going forward. The full Revision 1 text remains available in version control history for this
file if ever needed for reference; it is not reproduced here to avoid presenting removed design as current.

---

## G. Lead Unlock Design

- **Route:** `POST /api/opportunities/{id}/unlock` (new; mirrors the existing `opportunities/[id]/feedback` route's
  shape and auth convention).
- **Request:** `{}` (no body needed — `id` from the path, user from session). No client-supplied price, amount, or
  credit count — there is no credit count at all as of Revision 2.
- **Response (success):** `{ unlocked: true, opportunityId, revealedContact: { businessEmail?: string,
  personalEmail?: string, uncertainEmail?: string, phone?: string } }`. **Revision 2 change:** the
  `creditsRemaining` field from Revision 1 is removed — there is no balance to report. **Revision 3 change:**
  `personalEmail`/`uncertainEmail` fields added to the reveal shape — both are now qualifying, revealable channels
  per `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` §7.
- **Response (already unlocked):** identical shape, same data, HTTP 200 — not a new reveal (I).
- **Response (ineligible):** HTTP 409 (or 422) with a reason code: `NO_QUALIFYING_CONTACT` — no `lead_unlocks` row
  written. **Revision 3 removal:** `NOT_TARGET_CUSTOMER_MATCH` is removed as a reason code — target-customer match
  no longer gates eligibility, so an opportunity cannot be ineligible on that basis alone.
- **Response (insufficient credits):** **REMOVED.** This response no longer exists — there is no credit balance to
  be insufficient.
- **Authorization:** session-authenticated user (existing `readSessionToken`/`resolveSession` pattern) **plus** the
  new subscription-or-permanent-unlock access gate (§I) — now a pure active/inactive check, with no balance
  component.
- **Eligibility evaluation (Revision 3 — per `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md`), in
  order:**
  1. Check K1-detected kinds already present in the opportunity's evidence for **any** of `BUSINESS_EMAIL`,
     `PERSONAL_EMAIL`, `UNCERTAIN_EMAIL`, or `PHONE` — via K1's existing, **unmodified**
     `containsAnyContactIdentifier`-style presence check over the text `listByProspect` already returns.
     **(Revision 5, resolved):** eligibility itself needs no new store — only the *reveal* step (below) needs the
     new `lead_unlock_contacts` capture table (§E.5); see `CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md`.
  2. If no qualifying channel is present, reject (409/422, `NO_QUALIFYING_CONTACT`) before touching
     `lead_unlocks`.
  3. **Removed in Revision 3:** the target-customer-match check (previously step 1) is no longer part of
     eligibility. The opportunity's target-customer-match determination
     (`target_customer_match_determinations`) may still be read and surfaced for ranking/display purposes, but
     it must not be used to reject an unlock request.
- **Transaction boundary:** one DB transaction, reusing `createWebhookTransactionRunner`'s style: (a) confirm the
  user holds an active `subscription_periods` row (or a pre-existing permanent unlock for this opportunity), (b)
  insert the `lead_unlocks` row (idempotency anchor), (c) read and return the captured contact value(s). All or
  nothing — a thrown error at any step rolls back the whole transaction. **Revision 2 change:** no debit step, no
  row-lock-for-balance step — the transaction is simpler than Revision 1's debit+reveal design because reveal is
  the only side effect.
- **Idempotency/concurrency:** `UNIQUE(user_id, opportunity_id)` on `lead_unlocks` is the single source of
  idempotency; a duplicate or concurrent request either inserts successfully (first winner) or hits the unique
  violation and re-reads the winning row (same pattern as `createOrder.ts`), returning the same result without a
  second reveal-row.
- **Permanent unlock storage:** `lead_unlocks` row, never deleted, never scoped by subscription expiry (I).
- **Reveal:** exactly the K1-detected contact value(s) present for that opportunity — as of Revision 3, any of
  `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE`, nothing else (J, as superseded by
  `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` §7).

**Explicitly confirmed, per the task's instruction:**
- **K1 remains unchanged.** No modification to `ContactIdentifierKind`, `containsPersonalContactIdentifier`,
  `containsAnyContactIdentifier`, or `detectContactIdentifiers` is proposed anywhere in this plan.
- **No `BUSINESS_PHONE` is introduced.** The commercial eligibility rule reads K1's existing `PHONE` classification
  as-is — this plan proposes no new `ContactIdentifierKind` member.
- **No credit/balance mechanism is introduced anywhere in this section**, consistent with Revision 2.
- **Target-customer match is not an eligibility input**, consistent with Revision 3.
- **Contact-display rule (Revision 4, made explicit):** when an opportunity has more than one qualifying contact
  channel captured, the reveal response includes **all** of them — there is no precedence rule that shows only
  one channel and hides the others, and a channel is never omitted merely because K1 classified it as
  `PERSONAL_EMAIL` or `UNCERTAIN_EMAIL` rather than `BUSINESS_EMAIL`. The `revealedContact` shape above
  (`businessEmail?`, `personalEmail?`, `uncertainEmail?`, `phone?` — all independently optional, not
  mutually exclusive) already models this correctly as of Revision 3; this revision states the rule itself rather
  than leaving it implicit in the shape. K1's own classification (e.g. `PERSONAL_EMAIL` vs `BUSINESS_EMAIL`) may
  still be surfaced alongside each value as qualification metadata, but must not gate whether that value is
  included.

---

## H. Razorpay Recurring Payment Plan

**Current state (confirmed, §C.4 — re-verified for Revision 4, unchanged):** zero Subscriptions API usage;
one-time-order-only integration; only `orders.create`/`orders.fetchPayments` SDK calls exist; no plan/subscription
env vars; `SUPPORTED_EVENTS = ['payment.captured', 'refund.created', 'refund.processed']`.

### H.1 Confirmed-available event inventory (Revision 4 input)

The Product Owner has confirmed the following events are **available in the account's current Razorpay webhook
dashboard configuration** — this is new information as of Revision 4 and replaces Revision 1–3's "candidate,
unverified names" framing. **This confirms the event names exist as configurable options; it does NOT confirm
their exact payload shapes, field names, or firing order/timing** — those remain `RAZORPAY VERIFICATION REQUIRED`
against Razorpay's live API/docs before any handler branch is written against them.

| Family | Events available |
|---|---|
| Subscription | `authenticated`, `pending`, `resumed`, `completed`, `paused`, `charged`, `halted`, `activated`, `cancelled`, `updated` |
| Invoice | `partially_paid`, `expired`, `paid` |
| Payment | `failed`, `authorized`, `captured`, `dispute.*` |
| Refund | `created`, `processed`, `failed`, `speed_changed` |
| Order | `paid`, `notification.delivered`, `notification.failed` |

**Not every available event is required.** The engineering task is to determine which ones this feature actually
needs to act on, per the task's explicit instruction not to treat the full list as a requirements list.

### H.2 Event disposition — what this plan actually needs

**(a) Acted on — causes a state change (REQUIRED):**

| Event | Application effect | Governing decision |
|---|---|---|
| `subscription.charged` | Creates a new `subscription_periods` row — the **first** `charged` webhook for a given `razorpay_subscription_id` is activation (A); every subsequent `charged` webhook for the same subscription is an independent renewal period (C). `razorpay_payment_id` from the webhook is the idempotency anchor (unique constraint, §E.1). | IRL-A, IRL-C |
| `refund.created` / `refund.processed` (existing, reused) | If the refunded payment corresponds to a `subscription_periods.razorpay_payment_id`, set that period's `refunded_at` (N) — additive branch alongside the existing one-time-order refund handling, not a replacement of it. | IRL-N |

No other event is required to mutate `subscription_periods`, `entitlements`, or any access-control decision. This
is a deliberate consequence of the already-decided IRL-O principle restated in §D: **the product's own computed
`activation_at + duration_days` and `refunded_at` are the sole access authority; Razorpay's own status field is
read only for display/reconciliation.** Because access is computed from *our own* rows, not polled from Razorpay's
live subscription status, none of the provider lifecycle-state events below need to flip an access bit.

**(b) Log-only — no access-layer effect, acknowledge and record for observability/reconciliation (RECOMMENDED,
not required for correctness):**

| Event | Why it needs no state change |
|---|---|
| `subscription.authenticated`, `subscription.pending` | Pre-activation signals (mandate authentication / awaiting first debit). The application's activation authority is the **captured charge** (`subscription.charged`), not the authentication step — per IRL-A, so these fire before any period would be created anyway. |
| `subscription.activated` | Razorpay's own "subscription is now active" signal. **Exact firing order relative to the first `subscription.charged` is unverified** (`RAZORPAY VERIFICATION REQUIRED` — §Q) — until confirmed, period creation stays anchored to `charged` only, to avoid a double-creation race between two events that may or may not both fire for the same activation. |
| `subscription.paused`, `subscription.resumed` | A paused/resumed mandate does not retroactively change a period already created by a past charge — that period's access remains governed solely by its own computed expiry (IRL-O). A "resumed" mandate simply means a future `subscription.charged` may arrive again; no code path depends on `resumed` itself. |
| `subscription.halted` | Razorpay's signal that automatic retries for a failed recurring charge have been exhausted. Functionally equivalent to "no further renewal will happen on this mandate" — the current period (if any) still runs to its own computed expiry, exactly like the already-designed `subscription.cancelled` handling (no new state on `subscription_periods`). |
| `subscription.completed` | The mandate has run its full configured `total_count` of cycles and will not renew again. Same resolution as `cancelled`/`halted` — no application-layer action; the last-created period simply runs to its own expiry. |
| `subscription.cancelled` (already scoped in Revision 1–3) | Unchanged — no state change beyond recording the event; current period runs to its own expiry (O). |
| `subscription.updated` | **Exact payload/meaning unverified** (`RAZORPAY VERIFICATION REQUIRED` — could mean a plan change, a schedule change, or a metadata update). Until verified, treat as log-only; do not infer an access-control meaning from the event name alone. |
| `payment.failed` (subscription-scoped) | No-op at the product/access layer (D) — the current period, if any, is simply untouched; may be logged for observability only. (Unchanged from Revision 1–3.) |

**Engineering recommendation (not forced, flagged as an implementation-detail choice):** add the family (b) events
to `SUPPORTED_EVENTS` with a log-only branch (acknowledge `'processed'`, structured log including
`razorpay_subscription_id` and event type, no DB mutation) rather than letting them fall through the existing
generic `'ignored'` catch-all — this preserves subscription-specific observability without adding any new access
logic. Either choice is correct; this is engineering discretion, not a PO decision.

**(c) Not needed for this feature (NON-BLOCKING — out of scope, no handler required):** `invoice.partially_paid`,
`invoice.expired`, `invoice.paid`, `payment.authorized`, `payment.dispute.*`, `refund.failed`, `refund.speed_changed`,
`order.paid`, `order.notification.delivered`, `order.notification.failed`. These belong to invoice-based billing,
dispute handling, and one-time-order notification flows that this subscription feature does not use (Razorpay
Subscriptions bills via the `charged`/refund events above, not via a separate invoice object this plan needs to
read). If a future, separate project needs dispute or invoice-level reconciliation, that is its own scope.

### H.3 What must still be built

1. **Subscription/plan creation (external, one-time setup, not application code):** a Razorpay **Plan** must be
   created (via Razorpay dashboard or a one-time API call) representing the ₹1,499/30-day recurring charge. The
   resulting `plan_id` is operational configuration (env var), not something this plan's code creates per-request.
   **Flagged as an external dependency to complete before any subscription-creation code is written.**
2. **Subscription creation at checkout:** a new code path (likely alongside `createOrder.ts`, as a sibling
   `createSubscription.ts`) calls Razorpay's `instance.subscriptions.create({ plan_id, customer_notify, total_count,
   notes })` (exact parameter shape to be verified against Razorpay's current API — **not invented here**, flagged
   as external verification in §Q). Must reuse the same price-authority principle (the plan/amount is
   server-resolved, never client-supplied) and a client-supplied idempotency key, following `createOrder.ts`'s
   existing pattern.
3. **Customer identity:** Razorpay Subscriptions associates a `customer_id`. Whether to create/reuse a Razorpay
   Customer object per user (vs. the current one-time flow's guest-checkout style) is an **engineering decision to
   verify against Razorpay's current API requirements for recurring mandates** — flagged in §Q.
4. **Signature verification:** reuse the existing `verifyRazorpayWebhookSignature`/`verifyRazorpayWebhook`
   machinery unchanged — Razorpay signs subscription webhooks the same way as order webhooks (HMAC over raw body
   with the same `RAZORPAY_WEBHOOK_SECRET`), so no new verification mechanism is needed, only new event names in
   `SUPPORTED_EVENTS` and the one new handler branch (H.2a).
5. **Idempotency:** extend `SUPPORTED_EVENTS` and add the new `subscription.charged` branch in `webhookHandler.ts`'s
   existing dispatch, reusing the exact same `webhook_events.razorpay_event_id` unique-insert dedupe already in
   place for the outer webhook-event layer, plus the new `subscription_periods.razorpay_payment_id` unique
   constraint (§E.1) for the inner period-creation idempotency — no new outer dedupe mechanism needed.
6. **Provider/API failures and reconciliation:** the existing `reconciliation.ts` sweep
   (`findEligibleOrdersForReconciliation`) is a precedent for a parallel "did a subscription charge actually
   succeed but its webhook never arrive" reconciliation job, using `instance.subscriptions.fetch`/
   `instance.invoices.list` equivalents — **exact API verification required**, flagged in §Q.

---

## I. Access-Control Plan

A new gate function (proposed name: `requireClientFinderAccess(userId)`), analogous in structure to
`requireProductAccess` but evaluating a different, time-bound condition, is required because **no such gate exists
today** (§C.2). It must be enforced server-side on every Client Finder subscriber-only action (unlock), not only in
the frontend. **Revision 2 change:** this gate is now a pure boolean (active subscription period exists, or a
pre-existing permanent unlock covers this specific opportunity) — no credit-balance check is layered on top.

| Scenario | Governing decision | Access outcome |
|---|---|---|
| 1. Active ₹1,499 subscription | PO-D2, IRL-B | Full all-tier Client Finder access; can unlock leads (no balance check — unlocking is gated on contact-channel-availability eligibility only, per `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md`, not target-customer match) |
| 2. Expired subscription | IRL-B, IRL-M | All-tier access ends; reverts to whatever ₹99/₹499 entitlement (if any) the user separately holds; no new unlocks |
| 3. Refunded subscription | IRL-N | Immediately treated as scenario 2 (inactive) as of the refund event, regardless of original expiry |
| 4. Failed renewal | IRL-D | No change — current period (if still unexpired) continues exactly as scenario 1 until its own expiry |
| 5. Cancelled-but-not-expired | IRL-N, IRL-O | No change — treated as scenario 1 until the period's own computed expiry |
| 6. Existing one-time ₹1,499 owner (no subscription) | IRL-K | No automatic subscription benefit; access governed solely by their one-time entitlement's existing rules (unaffected by this plan) |
| 7. Permanent unlocked leads, no active subscription | IRL-I, IRL-M | Those specific leads remain accessible without charge; no *new* unlocks or all-tier browsing beyond what any other entitlement already grants |
| 8. No entitlement at all | **Now decided** — `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §5.5 | Browse/discover access is allowed; subscriber-only actions (unlock) are **not** — this resolves what was Risk #3 in Revision 1 |
| 9. Subscription in Razorpay `paused`/`resumed` state | **Not separately governed — resolved via IRL-O, not a new PO decision (Revision 4)** | No change from scenario 1/5: the current period's access is governed solely by its own computed `activation_at + duration_days`, not by Razorpay's live mandate state. A paused mandate does not suspend an already-active, unexpired period; a resumed mandate has no effect beyond allowing a future `subscription.charged` to arrive. |
| 10. Subscription in Razorpay `halted` or `completed` state | **Not separately governed — resolved via IRL-O, not a new PO decision (Revision 4)** | Treated identically to scenario 5 (cancelled-but-not-expired): the current period (if any) runs to its own computed expiry; no new period will be created without a further `subscription.charged` webhook, but no *immediate* access change occurs on `halted`/`completed` itself. |
| 11. Subscription in Razorpay `authenticated`/`pending` state (no charge captured yet) | **Not separately governed — resolved via IRL-A (Revision 4)** | Treated as scenario 8 (no entitlement) for access purposes — no `subscription_periods` row exists yet, since period creation is anchored to the captured charge (`subscription.charged`), not to mandate authentication. |

**Note on scenarios 9–11 (Revision 4):** per the task's explicit instruction not to invent a commercial rule for
an ungoverned provider state, none of these three rows introduces new policy — each is a direct, mechanical
consequence of a *rule the Product Owner already decided* (IRL-O's "provider status is never the access
authority," IRL-A's "activation is the captured charge, not the mandate"). If a future need arises to treat
`paused`/`halted` as its own first-class, separately-communicated state (e.g., a user-facing "your subscription is
paused" notice distinct from "your subscription expired"), that would be a new, additive **PO decision** — it is
flagged here as a possible future question, not decided or assumed.

**Enforcement points:** any future opportunity list/detail route and the new unlock route must call the same gate
function for the unlock action specifically — not duplicate the check. Per §5.5 of the access-model decision,
search/browse/discover routes (e.g. `apps/web/app/api/searches/route.ts`) are **not** required to add an
entitlement gate by this plan — only the unlock action is subscriber-gated. Frontend-only checks are explicitly
insufficient (per the task's instruction) and are not proposed as the enforcement mechanism anywhere in this plan.

---

## J. API / Route Changes

| Method | Path | Auth | Entitlement | Request | Response | Idempotency | Transaction |
|---|---|---|---|---|---|---|---|
| POST | `/api/payments/create-subscription` (new) | Session or guest (match existing create-order convention) | None (pre-purchase) | `{ idempotencyKey, customerEmail, customerPhone? }` | `{ razorpaySubscriptionId, shortUrl/checkoutParams }` | Client `Idempotency-Key` header, same pattern as `createOrder.ts` | Single order-style transaction, no cross-table work yet |
| POST | `/api/webhooks/razorpay` (existing, extended) | Signature-verified, no user session | N/A | Raw bytes | `{ status: 'processed'|'duplicate'|'ignored' }` | `webhook_events.razorpay_event_id` unique (existing) + new `subscription_periods.razorpay_payment_id` unique (new) | Existing `createWebhookTransactionRunner` |
| GET | `/api/subscriptions/status` (new) | Session | None (read-only) | — | `{ active: boolean, expiresAt, durationDays }` (**Revision 2:** `creditsRemaining` field removed) | N/A (read) | N/A |
| POST | `/api/opportunities/{id}/unlock` (new) | Session + `requireClientFinderAccess` | Active ₹1,499 subscription OR pre-existing permanent unlock for this id | `{}` | See §G (**Revision 2:** no `creditsRemaining` in response) | `UNIQUE(user_id, opportunity_id)` | Single atomic reveal transaction (§G) |
| GET | `/api/opportunities` / `/api/opportunities/{id}` | Session only (browse/discover; no entitlement gate per §5.5) | None for browsing; `requireClientFinderAccess` only for unlock-status-specific detail, if ever added | — | Opportunity list/detail, including unlock status if already unlocked | N/A (read) | N/A |

Existing routes requiring modification: `packages/core-payments/src/webhookHandler.ts` (extend `SUPPORTED_EVENTS`
and dispatch). **Revision 2 change:** `apps/web/app/api/searches/route.ts` no longer needs a
`requireClientFinderAccess` call for browsing/search creation — per §5.5 of the access-model decision, that action
remains available to zero-entitlement users; only the unlock route is gated.

---

## K. File-by-File Implementation Plan

### Modified files

| File | Current responsibility | Proposed change | Reason | Dependencies | Tests affected |
|---|---|---|---|---|---|
| `packages/catalog/src/types.ts` | Closed `ProductId` union | Add `'ai_client_acquisition_1499_subscription'` literal | New SKU (governance §5A) | None | Exhaustiveness-check tests for `ProductCatalog` |
| `packages/catalog/src/products.ts` | Product definitions | Add new product entry (name, `amountPaise`, `metaValueInr` — values to confirm, not decided here) | New SKU | types.ts change | Catalog unit tests |
| `packages/catalog/src/ladder.ts` | One-time purchase tier containment | Decide (engineering, not PO) whether subscription implies the *existing one-time* lower-rung deliverables, or is entirely orthogonal to the ladder — **recommend orthogonal**, since PO-D2 governs Client Finder feature access, not kit-deliverable downloads | Avoid conflating two different "tier" concepts (§Q Risk #2) | — | Ladder tests |
| `packages/core-payments/src/webhookHandler.ts` | Dispatches `payment.captured`/`refund.*` | Add `subscription.charged` state-changing branch (required, §H.2a); optionally add log-only branches for the family-(b) events in §H.2 (recommended, not required) | New event types — names now confirmed-available (Revision 4, §H.1); payload fields still `RAZORPAY VERIFICATION REQUIRED` | Payload-field verification (§Q) | `webhook.test.ts`, integration webhook tests |
| `packages/core-payments/src/razorpayClient.ts` | Wraps `orders.*` SDK calls | Add `subscriptions.create`/`subscriptions.fetch` wrappers | New Razorpay surface | Razorpay API verification | New unit tests |
| `.env.example`, `packages/config/src/env.ts` | Three Razorpay keys | Add `RAZORPAY_PLAN_ID` (or equivalent) | New config | Plan created externally | Config validation tests |

**Revision 2 removal:** `apps/web/app/api/searches/route.ts` is **no longer** in this list — Revision 1 proposed
adding `requireClientFinderAccess` here; per §5.5 of the access-model decision, browsing/search remains ungated for
zero-entitlement users, so this route needs no change for this feature.

### New files (proposed)

| File | Responsibility |
|---|---|
| `packages/core-subscriptions/src/types.ts` | `SubscriptionPeriod`, `LeadUnlock` types (**Revision 2:** `CreditLedgerEntry` removed) |
| `packages/core-subscriptions/src/subscriptionPeriodRepository.ts` | Raw-SQL repository for `subscription_periods` (create-on-charge, lookup-active-for-user) |
| `packages/core-subscriptions/src/leadUnlockRepository.ts` | Raw-SQL repository for `lead_unlocks` |
| `packages/core-subscriptions/src/leadUnlockService.ts` | Orchestrates eligibility check (§G) + atomic reveal transaction (**Revision 2:** no debit step) |
| `packages/core-subscriptions/src/access.ts` | `requireClientFinderAccess(userId)` — the new gate (§I), a pure boolean check |
| `packages/core-payments/src/createSubscription.ts` | Mirrors `createOrder.ts` for subscription checkout |
| `packages/db/prisma/migrations/0040_subscription_periods/migration.sql` | Schema for §E.1 |
| `packages/db/prisma/migrations/0041_lead_unlocks/migration.sql` | Schema for §E.3 (**Revision 2:** renumbered — the credit-ledger migration previously proposed at `0041` is removed; this is now the next table) |
| `packages/db/prisma/migrations/0042_lead_unlock_contacts/migration.sql` | Schema for §E.5 (**new in Revision 5**) |
| `apps/web/app/api/payments/create-subscription/route.ts` | New route |
| `apps/web/app/api/subscriptions/status/route.ts` | New route |
| `apps/web/app/api/opportunities/[id]/unlock/route.ts` | New route (§G) |
| `packages/core-research/src/contactValueExtraction.ts` | **(Revision 5, resolved — was the open "Risk #1" placeholder in Revisions 1–4)** a new, additive, read-time module, in the same package as K1 so it can import `contactIdentifiers.ts` directly without a public-index export, finding candidate substrings in already-persisted evidence text and classifying each via K1's existing, unmodified `detectContactIdentifiers()`. Full rationale and options analysis: `CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md` §7, §12–§13. Does not modify K1, Path A, or Path B. |

**Revision 2 removal:** `packages/core-subscriptions/src/creditLedgerRepository.ts` (Revision 1) is **removed** —
no ledger exists in this revision.

No file is proposed to change merely for style; every entry above is required by a specific decision item cited in
its "reason."

---

## L. Test Plan

**PRODUCT:** new SKU resolves via catalog; old `ai_client_acquisition_1499` unaffected (price, deliverables,
entitlement behavior unchanged); the two products are independently purchasable in either order.

**SUBSCRIPTION:** activation on webhook-captured charge; expiry at `activation_at + duration_days`; renewal before
expiry creates a new period without altering the old one; renewal after expiry creates a new period starting at
its own activation with no gap-filling; failed payment leaves the current period untouched; overlapping purchase
attempt while active is rejected; refund marks the period inactive immediately without re-locking past unlocks;
cancellation without refund runs to the existing expiry unaffected.

**CREDITS:** **REMOVED.** This test category no longer applies — there is no allocation, debit, balance, or
rollover to test.

**UNLOCK (Revision 3 — per `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md`):** target match YES +
`BUSINESS_EMAIL` only → eligible; target match YES + `PERSONAL_EMAIL` only → eligible; target match YES +
`UNCERTAIN_EMAIL` only → eligible; target match YES + `PHONE` only → eligible; target match NO + `BUSINESS_EMAIL`
only → eligible; target match NO + `PERSONAL_EMAIL` only → eligible; target match NO + `UNCERTAIN_EMAIL` only →
eligible; target match NO + `PHONE` only → eligible; target match YES + no contact → rejected (`NO_QUALIFYING_
CONTACT`); target match NO + no contact → rejected (`NO_QUALIFYING_CONTACT`); duplicate unlock request → second
request returns identical result, no second reveal-row written; concurrent duplicate requests → exactly one
`lead_unlocks` row results; previously-unlocked lead remains accessible after the owning subscription later
expires; an unlock attempt with **no** active subscription and **no** pre-existing permanent unlock for that
opportunity is rejected at the access-gate level (§I), before the eligibility check runs. (**Revision 2 removal:**
no "balance < 10 rejected," "30th unlock succeeds," or "31st rejected" cases — there is no quota. **Revision 3
removal:** no case rejects solely on `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL` classification or on target-customer-match
= NO; those were Revision 2's eligibility conditions and are now superseded.)

**K1:** all existing `contactIdentifiers.test.ts` cases pass unmodified; no `BUSINESS_PHONE` literal appears
anywhere in the type system; `containsPersonalContactIdentifier`/`containsAnyContactIdentifier` behavior is
bit-for-bit unchanged (regression-tested by re-running the existing suite, not by new assertions).

**RAZORPAY:** valid `subscription.charged` webhook processed (first occurrence → activation, creates period);
invalid signature rejected (reusing the existing signature test suite's fixtures); duplicate `subscription.charged`
webhook (same `razorpay_payment_id`) is a no-op (idempotency, §E.1); a renewal `subscription.charged` webhook
creates a second, independent period; `payment.failed` webhook is a no-op on current access; `refund.created`/
`refund.processed` webhook deactivates the correct period (`refunded_at` set) without touching other periods or
past unlocks; a reconciliation sweep (if built) detects a captured-but-unwebhooked subscription charge.
**(Revision 4 additions)** `subscription.paused`, `subscription.resumed`, `subscription.halted`,
`subscription.completed`, `subscription.cancelled`, `subscription.authenticated`, `subscription.pending`, and
`subscription.updated` webhooks are each acknowledged (`'processed'` or `'ignored'` per §H.2's engineering choice)
**without** creating, mutating, or expiring any `subscription_periods` row — assert the row set is byte-for-byte
unchanged before and after each of these webhooks fires against a fixture with an existing active period.

**ACCESS:** all 11 scenarios in §I's table, each asserted against the actual route-level gate (not just the unit
function) via an integration test hitting a real route with a real Postgres-backed period/entitlement fixture.
Scenario 8 (zero entitlement) must assert both halves: browse/search succeeds, unlock is rejected. **(Revision 4)**
Scenarios 9–11 (paused/resumed, halted/completed, authenticated/pending) must assert that access is unaffected by
these provider-state webhooks arriving — i.e., the access-gate function's result is identical before and after,
driven purely by the unchanged `subscription_periods` row set.

---

## M. Manual Real-World E2E Validation Plan

**Automated** (CI, no human involved): everything in §L.

**Manual, user-run, Razorpay Test Mode** (the user will personally execute):
1. Create/configure the Razorpay Plan in Test Mode dashboard (₹1,499, 30-day period; `total_count` per whatever
   the final checkout design uses) — or via a one-off script using test keys.
2. Create a subscription through the actual checkout UI once built (calls `subscriptions.create`).
3. Complete Test Mode payment/authentication (Razorpay's test-mode card/UPI flow + mandate authentication screen).
4. Verify the webhook arrives and is processed: inspect Razorpay's test-mode webhook delivery log and the app's
   own `webhook_events` row for the `subscription.charged` event (`razorpay_event_id` present, `status =
   'processed'`).
5. Verify the `subscription_periods` row was created with correct `activation_at`/`duration_days` values via direct
   DB query. (**Revision 2:** no credit-snapshot columns to verify.)
6. Verify Client Finder access is active (a previously-blocked unlock action now succeeds at the gate level).
7. Find a lead (opportunity) with at least one qualifying contact channel present.
8. Reveal — perform a real unlock and confirm **all** available contact channels for that opportunity are returned
   (Revision 4's contact-display rule, §G), not just one. (This step's full execution depends on Risk #1 — contact
   value capture — being resolved first; until then, this step can only be exercised against manually-seeded test
   fixtures that already carry a captured value.)
9. Verify persistence/history: repeat the same unlock request and confirm no second `lead_unlocks` row is created
   and the identical reveal is returned (idempotency).
10. Test renewal: trigger a second Test Mode charge against the same subscription mandate and confirm a second,
    independent `subscription_periods` row is created without altering the first.
11. Test failure: trigger a Test Mode failed-charge scenario (if Razorpay's test mode supports forcing a card
    decline on a recurring charge) and confirm the current period, if any, is left untouched (no-op per §H.2).
12. Test cancellation/refund where realistically testable: cancel the Test Mode subscription (or trigger a Test
    Mode refund on a captured subscription payment) and confirm the expected outcome per §I scenario 3/10 — refund
    sets `refunded_at` immediately; cancellation alone does not change current-period access.
13. Verify expiry behavior: manually advance/simulate expiry (e.g., a short `duration_days` in test config, since
    Razorpay Test Mode cannot be made to wait out a real 30-day period) and confirm access reverts per §I scenario
    2, while any already-unlocked lead remains visible (IRL-I, permanent grant survives period expiry).

**Scenarios difficult or impossible to simulate directly in Razorpay Test Mode (flagged, not silently skipped):**
- **`subscription.halted`** — this fires only after Razorpay's own configured retry schedule for failed recurring
  charges is exhausted (typically days), which is impractical to wait out manually in Test Mode. **Reconciliation
  path:** exercise the `halted` handler via a direct, synthetic webhook POST (correctly signed with the test
  `RAZORPAY_WEBHOOK_SECRET`) against the local/staging endpoint instead of waiting for Razorpay to emit it
  naturally — this tests the handler logic, not the provider's retry timing.
- **`subscription.completed`** — requires the mandate to actually reach its configured `total_count` of billing
  cycles, impractical to wait out for a 30-day cycle. Same synthetic-webhook reconciliation path as `halted`.
- **`subscription.paused`/`subscription.resumed`** — Razorpay Test Mode's dashboard may not expose a manual pause
  control identically to live mode; if unavailable, use the same synthetic-webhook reconciliation path.
- **A genuine 30-day wait for natural expiry** — step 13 above uses a shortened `duration_days` test
  configuration rather than a real-time wait; this is a test fixture substitution, not a skipped scenario.

**Production-only validation** (explicitly out of scope for pre-release testing): live-mode webhook latency/
reliability under real payment-network conditions; real customer support flows for disputed charges; the real
≥24h+ timing of `subscription.halted`/`completed` under live retry schedules — none of these are part of this
plan's pre-release test matrix.

---

## N. Environment Variables / Secrets

| Variable | Required in | Classification |
|---|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | dev/test/prod (already exist) | Unchanged by this plan |
| `RAZORPAY_PLAN_ID` (or equivalent — exact name to be confirmed once the Plan is created in Razorpay) | dev/test/prod | **New.** Required once the subscription checkout path exists. Value itself (a Razorpay-generated id) is not invented here — created externally per §H.1 |
| Any new per-environment default for `duration_days` | dev/test/prod, optional | **New, optional.** Engineering may adjust this without a new PO decision (PO-D7). **Revision 2 removal:** the `credits_per_period`/`credits_per_unlock` configuration entries from Revision 1 are removed — no such values exist. |

No secret values are invented or disclosed here, consistent with the task's constraint.

---

## O. Observability / Auditability

- **Subscription activation/renewal:** log `{ subscriptionPeriodId, userId, razorpaySubscriptionId, razorpayPaymentId, activationAt, durationDays }` — mirrors the existing webhook-processing log shape in `webhookHandler.ts`.
- **Expiry:** no event to log at expiry time itself (it's computed, not polled) — instead, log at the *next access
  attempt* after expiry that access was denied due to expiry (for support diagnosis), without logging contact PII.
- **Failed payment:** log the webhook event id and that it was a no-op (D), at the existing webhook-ignored log level.
- **Refund:** log `{ subscriptionPeriodId, refundedAt }` (**Revision 2:** no `creditsForfeited` field — there are no
  credits).
- **Reveal (unlock):** every `lead_unlocks` insert is itself an audit row — a reveal's log line should include
  `{ userId, opportunityId, subscriptionPeriodId }` and **must not** log the revealed contact value. (**Revision
  2:** no `creditsRemaining` field logged — it no longer exists.)
- **Duplicate webhook:** already logged today via the existing `'duplicate'` status path — extend, don't replace.
- **Duplicate unlock:** log at `info` that a `(user, opportunity)` unlock request resolved to an existing row,
  without re-logging the contact value a second time.
- **Concurrency conflict:** log the unique-constraint-violation-then-reread path (mirrors existing `createOrder.ts`
  race-self-heal logging) for both period-creation and unlock paths.
- **Reconciliation:** any new subscription reconciliation sweep should log exactly like `reconciliation.ts`'s
  existing order sweep (counts checked, counts fixed, counts still pending).
- **PII discipline:** per the task's explicit instruction, no log line proposed above includes a revealed
  business email or phone value.

---

## P. Rollout / Migration / Rollback

| Phase | Content | Prerequisites | Validation | Rollback |
|---|---|---|---|---|
| 1 — Schema | Migration 0040 (`subscription_periods`, §E.1) | None | Migration applies cleanly on a copy of prod schema (currently at 0039) | Drop the table; no existing table is altered, so this is fully reversible |
| 2 — Repositories/services | `core-subscriptions` package (subscription periods, lead unlocks — no ledger) | Phase 1 | Unit tests | Package removal; no other package depends on it yet |
| 3 — Razorpay | Plan creation (external) + `createSubscription.ts` + webhook event branches | Phase 2, Razorpay API verification (§Q) | Test-mode webhook integration tests | Feature-flag the new checkout entry point off; existing one-time checkout is untouched |
| 4 — Unlock | Migration 0041 (`lead_unlocks`, §E.3) + `leadUnlockService` + route, **gated on Risk #1 resolution** | Phase 3, contact-value capture mechanism | §L UNLOCK tests | Route returns 501/feature-flagged-off until Risk #1 is resolved |
| 5 — Access control | `requireClientFinderAccess` wired into the unlock route only (not search/browse, per §5.5) | Phase 4 | §L ACCESS tests | Revert the route change; unlock reverts to not existing |
| 6 — Tests | Full matrix (§L) | Phases 1–5 | CI green | N/A |
| 7 — Manual E2E | §M | Phase 6, Razorpay Test Mode access | User-executed checklist | N/A |
| 8 — Release readiness | PO sign-off that §Q blockers are resolved | Phase 7 | This document's §R gate | N/A |

**Revision 2 change:** the previous Phase 4 ("Credit ledger") is removed; phases are renumbered accordingly (8
phases instead of 9).

**Protection of the existing one-time ₹1,499 SKU:** no phase above modifies `packages/catalog/src/products.ts`'s
existing `ai_client_acquisition_1499` entry, its deliverables, or its entitlement row shape; the new SKU is
strictly additive (IRL-K). No migration in Phases 1–4 touches the `orders`, `payments`, or `entitlements` tables.

---

## Q. Contradictions / Risks / Unknowns

1. **ENGINEERING DETAIL — scoped by Revision 5 (was BLOCKER — large and unscoped in Revisions 1–4).** No code
   anywhere stores the actual `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE` *value* for any
   Opportunity/Prospect/Company — only K1's boolean presence detection exists (§C.5). The focused design spike
   this item previously called for has now been done:
   `requirement/CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md` traced both ingestion paths, verified that
   `offer_based_on` is copied text with no FK-recoverable path (confirming the long-standing suspicion), confirmed
   the `prospect_id` FK chain *is* a reliable opportunity-to-evidence association for this purpose, and determined
   a concrete minimum architecture: a new, additive, read-time extraction module (§E.5/§K here; §7/§13 there) that
   never modifies K1, Path A, or Path B, plus one small new table (`lead_unlock_contacts`, §E.5) to make a
   revealed value permanent once unlocked. **What remains open** (non-blocking, see the spike's §17): exact
   behavior when K1 confirms a `PHONE` is present but no clean literal value can be isolated from an obfuscated
   source (a narrow edge case, not a redesign); and whether the opportunity-adapter's private
   cross-business-contamination defense (`hasConflictingSource`, R-70) should be reused by the new extractor.
   Neither blocks starting implementation.

2. **NON-BLOCKING, but should be reported rather than silently assumed. Unchanged by Revision 2.** The governance
   records (PDEF-2, the ES decisions) describe "₹499/₹1,499 Client Finder entitlements" as an apparently-existing
   commercial concept, but the actual catalog's only ₹499 product (`ai_freelancing_499`, "AI Freelancing Launch
   Kit") is a different product line, and Client Finder currently has **zero** product-tier gating of any kind
   (session-auth only). This plan interprets this as: Client Finder commercial gating has simply never been built
   yet, and this ₹1,499 subscription project is the **first** real implementation of any Client-Finder-specific
   entitlement gate.

3. **RESOLVED by `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §5.5 (was a blocker in Revision 1).**
   Zero-entitlement Client Finder access is now decided: browse/discover is allowed; unlock is not, absent an active
   subscription or a pre-existing permanent unlock. §I scenario 8 and §L's ACCESS test category reflect this.

4. **EXTERNAL VERIFICATION — narrowed by Revision 4, not resolved.** Event *names* are now confirmed-available in
   the account's dashboard (§H.1 — this is new, Product-Owner-supplied information). **Still unverified:** exact
   webhook payload field names/shapes for each event, the firing order between `subscription.activated` and the
   first `subscription.charged` (§H.2b), and the `subscriptions.create`/customer-identity API call parameters.
   Must be confirmed against Razorpay's current developer documentation or a sandbox call before Phase 3 (§P)
   begins.

5. **ENGINEERING DETAIL, can be resolved by implementation. Narrower in Revision 2.** Whether `duration_days` is
   stored as a dedicated `plans`/`product_config` table versus a column directly on `subscription_periods`
   (snapshot-only) is unresolved — IRL-P explicitly leaves this as engineering-only. **Revision 2 removes the
   `credits_per_period`/`credits_per_unlock` half of this question entirely**, since those values no longer exist.
   This plan's §E proposes the simpler of the two remaining options (snapshot column only); this is a
   recommendation, not a decision.

6. **ENGINEERING DETAIL. Unchanged by Revision 2.** Whether expiry needs an active worker sweep (for e.g. a
   notification side-effect) or is purely computed-on-read is unresolved; this plan recommends computed-on-read
   only (no sweep needed for correctness).

7. **NON-BLOCKING. Unchanged by Revision 2.** The catalog's product ladder (`ladder.ts`) currently couples one-time
   kit-deliverable access to tier ownership; this plan recommends the new subscription SKU be kept **orthogonal**
   to that ladder (governs Client Finder feature access only, not kit PDF/ZIP/MP4 downloads).

8. **NEW in Revision 2 — non-blocking, carried from the access-model decision's own open items.** Whether Path B's
   phone-number intake-rejection gate should ever be loosened for business-context phone numbers remains open and
   non-blocking while Path B stays fixtures-only (`CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`
   §10; `CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md` §9's second question). Not reopened or
   resolved here.

9. **NEW in Revision 4 — ENGINEERING DETAIL, resolved, not a blocker.** Whether `paused`/`halted`/`resumed`/
   `completed`/`authenticated`/`pending` provider states need their own access-control rule. **Resolved**: per
   IRL-O (already decided — provider status is never the access authority) and IRL-A (already decided —
   activation is the captured charge, not the mandate), none of these states requires a new rule; see §I scenarios
   9–11. No new PO decision was created to resolve this — it followed mechanically from decisions already on
   record. Flagged here only so the resolution path is visible, not hidden inside §H/§I.

10. **NEW in Revision 4 — EXTERNAL VERIFICATION, non-blocking for Phases 1–2, blocking for Phase 3.** The exact
    meaning and payload of `subscription.updated` is unknown (could signal a plan change, schedule change, or
    unrelated metadata update). Treated as log-only (§H.2b) until verified; if verification later reveals it
    signals something access-relevant (e.g., a plan downgrade), that would require its own, new engineering design
    pass — and, if it implies a commercial consequence, a PO decision — neither of which this plan invents
    preemptively.

11. **NEW in Revision 4 — NON-BLOCKING, informational.** The invoice/order/dispute event families (§H.2c) are
    confirmed available but out of scope for this feature. If a future reconciliation or dispute-handling project
    needs them, that is new scope, not a gap in this plan.

---

## R. Implementation Gate

**Is the plan implementation-ready? Materially more so as of Revision 5, but not fully — one spike-flagged
engineering choice is still outstanding.** The subscription lifecycle and access-control design (§D–§E, §I) are
implementation-ready today: they rest entirely on already-decided PO rules and already-proven repository
patterns. The lead-unlock contact-reveal path (§G) was blocked on unscoped work through Revision 4; as of
Revision 5, `CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md` has scoped it down to a concrete, additive
architecture (§E.5, §K) with no outstanding Product Owner decision — only the two narrow, non-blocking items in
that spike's §17 (the obfuscated-value edge case; whether to reuse the R-70 cross-business defense) remain open,
and neither requires redesign.

**What still requires Product Owner decision:** none currently outstanding — §Q.3 (the previous PO blocker) is
resolved by `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §5.5.

**What requires external Razorpay verification:**
- §Q.4 — **narrowed by Revision 4**: event *names* are now confirmed-available (§H.1); exact payload field shapes,
  `subscription.activated`-vs-`subscription.charged` firing order, and the `subscriptions.create`/customer-identity
  API call parameters remain unverified. The Plan-creation step itself is also external, per §H.3 item 1.
- §Q.10 — exact meaning/payload of `subscription.updated`, non-blocking until Phase 3.

**What is engineering-only and can proceed without further PO or external input:**
- Schema design (§E), transaction boundaries (§G), file placement (§K), test matrix (§L), observability (§O) — all
  can be refined and executed once Risk #1 is scoped.

**Exact next engineering step to authorize (if and when implementation is authorized separately):** the
contact-value-capture design spike this section previously called for is now done
(`CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md`) — it confirms no new K1 export and no personal-identifier
exposure beyond what Revisions 2–4's governance already authorized. The next step is Phase 1 of §P (schema
migrations for `subscription_periods`, `lead_unlocks`, and the now-added `lead_unlock_contacts`). This plan does
not authorize that migration's code or any other implementation artifact — implementation requires its own,
separate, explicit Product Owner authorization, consistent with the governance scope stated throughout this
document and in `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §13.
