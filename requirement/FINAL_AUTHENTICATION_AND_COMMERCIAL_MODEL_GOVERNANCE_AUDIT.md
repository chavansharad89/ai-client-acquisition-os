# FINAL Product Owner Governance Audit — Authentication + Commercial + Subscription Model

**Status:** GOVERNANCE ONLY. This document consolidates and reconciles two prior same-day governance records (`CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISIONS_RECORD.md` and `COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md` + its `COMMERCIAL_PO_08_12_CANCELLATION_RENEWAL_OLD_DATA_ADDENDUM.md`), records two new decisions (AUTH-PO-25, AUTH-PO-26) that resolve two previously-open questions, and re-verifies every implementation claim against the current repository state as of this pass.

**Date:** 2026-10-10.
**No application code, database schema, migration, database row, test, or fixture was created, modified, or deleted in producing this document. No commit, push, or deployment was made.**

**Addendum (2026-10-10, same day, later pass):** Records AUTH-PO-27 through AUTH-PO-29 and COMMERCIAL-PO-13 through COMMERCIAL-PO-15 (new), reaffirms several existing decisions without new IDs, and leaves one cancellation-mechanism question explicitly PENDING by direct PO instruction. See the "Addendum: Q3–Q13 Authentication and Commercial Model Decisions" section at the end of this document.

**Addendum 3 (2026-10-10, same day, later pass):** Records COMMERCIAL-PO-18 (new) — retires the PCG-3B launch gate rather than redefining it, closing the one new open question raised by `AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md` §20. See "Addendum 3: PCG-3B Launch-Gate Retirement Decision" at the end of this document.

---

## 1. Executive Summary

The authentication model (AUTH-PO-01 → AUTH-PO-26) and the commercial model (COMMERCIAL-PO-01 → COMMERCIAL-PO-12) are each **internally consistent** and are **consistent with each other** (no decision in one family contradicts a decision in the other). Both models are, however, **almost entirely unimplemented** against the current, committed repository state (`b3f1827`): the ₹1,499 subscription checkout still hard-requires a pre-existing session (conflicting with AUTH-PO-01/14), no pending-identity mechanism exists, no cancellation mechanism exists for any of the three products, ₹99/₹499 have no subscription/period lifecycle at all today, and the ₹1,499 complete-package access cascade (→ ₹99 + ₹499) does not exist in the access-resolution code. These are **implementation gaps against new PO decisions**, not conflicts between PO decisions.

The two new decisions recorded in §2 below (AUTH-PO-25, AUTH-PO-26) close the two architecturally load-bearing open questions left by the prior authentication addendum: the pending-purchase identity is a **dormant/password-less `users` row** (Option A), and activation/eligibility continues to be computed from the **existing `subscription_periods` period model** rather than a new live Razorpay-status lookup (Option A). With these two decisions in hand, there is a clear, single implementation path for the Conflict-1 precondition problem; nothing about it remains conceptually open.

No old data was touched. The one non-obviously-fake old-SKU record (`chavan.sharad89@gmail.com`) remains classified, by explicit prior PO directive (COMMERCIAL-PO-06 revised / PO-08), as development/test data — not migrated, not deleted, not used as evidence of a production customer.

**Counts:** 2 true conflicts (both already resolved by superseding PO decisions — see §4), 7 implementation gaps, 2 documentation gaps, 1 test/fixture gap (by omission — see §14), 4 genuinely open PO questions, 2 new combined-model questions raised by this audit. Full lists in §§11–15.

**Implementation is NOT authorized by this audit.** See §17.

---

## 2. Authoritative Authentication Decisions

### 2.1 AUTH-PO-01 through AUTH-PO-24 (verbatim, recorded earlier today)

Recorded in full, with their original conflict/impact analysis, in `requirement/CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISIONS_RECORD.md` §1 and §1B. Summarized by topic (full text in that document; not reproduced here per the token-efficiency instruction against re-pasting unchanged content already in the repository):

| ID | Topic |
|---|---|
| AUTH-PO-01 | Purchase-first activation flow — no account before payment |
| AUTH-PO-02 | Email verified only by activation-link consumption |
| AUTH-PO-03 | Signup/profile fields (required: email, first/last name, phone, password; optional: DOB) |
| AUTH-PO-04 | Always reuse existing account by exact email; never duplicate |
| AUTH-PO-05 | Repeat-purchase entitlement isolation |
| AUTH-PO-06 | Payment valid independent of activation; 24h/single-use/latest-wins links |
| AUTH-PO-07 | Generic, rate-limited activation resend |
| AUTH-PO-08 | Email+password is the normal login mechanism |
| AUTH-PO-09 | Set password if null; never overwrite an existing password |
| AUTH-PO-10 | Strict account-enumeration prevention on unauthenticated endpoints |
| AUTH-PO-11 | Permanently disable `POST /api/auth/session`'s email-only mint path |
| AUTH-PO-12 | Resend as production email provider; preserve an email abstraction |
| AUTH-PO-13 | One account → one auth model → one login experience (end-state) |
| AUTH-PO-14 | Confirms AUTH-PO-01 for an unauthenticated new visitor; forbids trusting a client-supplied id |
| AUTH-PO-15 | Pending-purchase identity keyed to an immutable purchase email; identity chain purchase-email → Razorpay subscription → activation token → verified email → `users.id` |
| AUTH-PO-16 | Existing account at activation: reuse, never duplicate/overwrite; skip signup if password already set, auto-login directly into Client Finder |
| AUTH-PO-17 | Existing account with password: never block Client Finder on missing profile fields |
| AUTH-PO-18 | Different email = different identity; no auto-merge |
| AUTH-PO-19 | Unactivated subscription continues its normal Razorpay lifecycle; non-activation ≠ cancellation |
| AUTH-PO-20 | Renewal proceeds regardless of activation state |
| AUTH-PO-21 | No fixed calendar activation deadline; eligible while the subscription is active; 24h per-link TTL |
| AUTH-PO-22 | Activation allowed while active, not allowed once expired/ended (Option A) |
| AUTH-PO-23 | Cancellation does not shorten the current paid period; activation remains allowed until its actual end |
| AUTH-PO-24 | Renewal failure ends activation eligibility only at the current paid period's actual expiry; no grace period |

### 2.2 AUTH-PO-25 and AUTH-PO-26 (NEW — recorded verbatim in this document for the first time)

> **AUTH-PO-25 — Pending purchase identity mechanism.** OPTION A. Use a dormant, password-less `users` row — created at checkout time, before payment, bound immutably to the purchase email, with no login capability until activation — to represent the eventual account identity. This row satisfies `subscription_periods.user_id NOT NULL` at subscription-creation time and at every subsequent renewal charge, and is the mechanism through which AUTH-PO-14/15/19/20 are implemented.
>
> **AUTH-PO-26 — Subscription activation eligibility mechanism.** OPTION A. Use the existing computed subscription-period model (`activation_at + duration_days`, the same model migration `0040_subscription_periods` already implements and that IRL-O already establishes as the sole access authority) to determine activation eligibility. Do NOT introduce a new live Razorpay-subscription-status lookup mechanism as a second, independent source of truth. AUTH-PO-21 through AUTH-PO-24's "active"/"expired" language is satisfied entirely by this existing, already-stored data.

**Effect of AUTH-PO-25/26:** these two decisions resolve, respectively, **New PO Question 1B** and **New PO Question 2B** from the authentication addendum (`CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISIONS_RECORD.md` §7B items 1–2). Both questions are now **CLOSED**. Specifically:
- AUTH-PO-25 settles that a dormant pre-verified `users` row is an acceptable reading of AUTH-PO-01/14's "does not create an account before payment" — the row is not login-capable and not an "account" in the sense those decisions use the word, even though it exists in the `users` table.
- AUTH-PO-26 settles that AUTH-PO-21–24's "use the existing Razorpay lifecycle/status" language (originally flagged as a documentation/terminology mismatch, §3B/§2B of the addendum, because the system's actual access authority is the locally computed period model, not a live Razorpay status read) is to be read as satisfied by the existing computed-period model. The addendum's Documentation Gap (old C classification) is now closed by PO directive rather than left as a wording ambiguity.

---

## 3. Authoritative Commercial Decisions

### 3.1 COMMERCIAL-PO-01 through COMMERCIAL-PO-05, 07 (verbatim, unchanged from the base record)

Recorded in full in `requirement/COMMERCIAL_PO_01_07_THREE_PRODUCT_SUBSCRIPTION_MODEL_GOVERNANCE_AUDIT.md` §A. Restated by the PO in this pass in substantively identical form (per `COMMERCIAL_PO_08_12_CANCELLATION_RENEWAL_OLD_DATA_ADDENDUM.md` §A: "status: ALREADY RECORDED, UNCHANGED"). Summarized:

| ID | Topic |
|---|---|
| COMMERCIAL-PO-01 | Three independent product subscriptions (₹99, ₹499, ₹1,499), each a 30-day period; ₹99/₹499 independently purchasable |
| COMMERCIAL-PO-02 | Active ₹1,499 grants ₹99+₹499+Client-Finder access; ₹99/₹499/₹99+₹499 never auto-grant ₹1,499 |
| COMMERCIAL-PO-03 | Independent subscription lifecycles; buying/cancelling one never cancels/replaces/merges another |
| COMMERCIAL-PO-04 | ₹1,499 renewal extends complete-package access; never rewrites independent ₹99/₹499 |
| COMMERCIAL-PO-05 | Old one-time `ai_client_acquisition_1499` retired from new purchases; `..._subscription` is now the ₹1,499 commercial offering |
| COMMERCIAL-PO-07 | Unify architecture where appropriate; do not silently change ₹99/₹499's established functionality |

### 3.2 COMMERCIAL-PO-06 (revised), COMMERCIAL-PO-08 through COMMERCIAL-PO-12 (verbatim, from the addendum)

Recorded in full in `requirement/COMMERCIAL_PO_08_12_CANCELLATION_RENEWAL_OLD_DATA_ADDENDUM.md` §A. Summarized:

| ID | Topic |
|---|---|
| COMMERCIAL-PO-06 (revised) | Old-data record for `chavan.sharad89@gmail.com` explicitly classified as TEST/DEVELOPMENT DATA by PO directive; no migration, no deletion in this task |
| COMMERCIAL-PO-08 | Same classification, restated |
| COMMERCIAL-PO-09 | ₹99 cancellation: stop-renewal only, current paid period unaffected, no refund/proration — **supersedes** the prior "no cancellation capability" decision |
| COMMERCIAL-PO-10 | ₹499 cancellation: identical model to ₹99 |
| COMMERCIAL-PO-11 | ₹1,499 cancellation: stop-renewal; package access (₹99+₹499+CF) continues through the current paid period; independents unaffected; at period end without renewal, package-granted lower-tier access ends |
| COMMERCIAL-PO-12 | ₹1,499 renewal failure: current paid period runs to actual expiry, no grace period; at expiry, ₹1,499 and its package-granted access end; independents unaffected |

**Core restated principle (not a new numbered decision):** subscription ownership and access/entitlement are distinct. An active ₹99 (alone) grants only ₹99; an active ₹499 (alone) grants only ₹499; ₹99+₹499 together still never grant Client Finder; only an active ₹1,499 grants all three.

---

## 4. Superseded Historical Decisions

Carried forward from the two prior records, unchanged, plus the ID-collision housekeeping item resolved in this pass:

1. `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` §5 item 1 / §7, and `requirement/CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` IRL-K — "`ai_client_acquisition_1499` remains unchanged / stays open for new purchases indefinitely." **SUPERSEDED by COMMERCIAL-PO-05.** The SKU-naming portion of both documents (the literal id `ai_client_acquisition_1499_subscription`, and "no automatic relationship/credit/waiver between the two SKUs") is **not** superseded.
2. `requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md` §6 item 7 — "DECIDED: NOT ALLOWED. No refund or cancellation capability exists for the ₹99 product... unless a future, separate Product Owner decision changes this." **SUPERSEDED by COMMERCIAL-PO-09**, exactly as that document itself anticipated. Narrowly: only the *existence* of a cancellation capability is overturned; "no refund" survives into PO-09 itself.
3. `packages/core-payments/src/createSubscription.ts:14-26`'s documented engineering rationale ("a visitor reaching the 'Subscribe' action is already expected to be signed in... this follows directly from the data model migration 0040 already fixes") — this is a committed **engineering** decision, not a PO decision, but it was treated as a hard precondition until now. **Superseded in principle by AUTH-PO-01/14/25**: the precondition it documents is exactly what AUTH-PO-25's dormant-row mechanism is designed to remove. The code itself is unchanged (see §8) — this entry records that the rationale no longer reflects PO intent, not that the code has been updated.
4. `requirement/CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISION_QUESTIONNAIRE.md` Part 2/Part 3 — this questionnaire reused `AUTH-PO-01`..`AUTH-PO-13` as identifiers for 13 **different** open questions before the decisions record (§2.1 above) reused the same IDs for the PO's actual answers (flagged as "Conflict 2 — record-keeping" in the original decisions record §2). **Resolved in this pass by housekeeping, not by a new PO decision:** the questionnaire is marked **CLOSED/SUPERSEDED** by the decisions record for recordkeeping purposes — its Part 3 decision table is intentionally left blank and should stay blank; all authoritative answers live in §2.1/§2.2 above. No requirement content changed by this item; it only resolves which document a reader should trust when `AUTH-PO-0X` appears in isolation.
5. **(Addendum pass, below)** COMMERCIAL-PO-05's "retired from new purchases" is **sharpened, not overturned**, by COMMERCIAL-PO-13: COMMERCIAL-PO-13 additionally authorizes complete removal of the accidental one-time SKU's development/test records from the development environment. See the Addendum section.

Explicitly **not** superseded, only reinforced:
- `requirement/CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` IRL-D (lines 108–119), IRL-N/IRL-O (lines 342–384) — COMMERCIAL-PO-11/12's cancellation/renewal-failure timing rules restate these verbatim; IRL-N/O's stale "credits forfeited" language refers to a ledger model the later `subscription_periods` schema (migration `0040`) deliberately does not have — a pre-existing documentation/implementation evolution, not something this audit creates.
- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` PO-D1 and its own flagged open item 12 (whether PO-D1 applies retroactively to kits already sold under a one-time/perpetual understanding) — reinforced, not resolved, by COMMERCIAL-PO-01. Carried forward as Open PO Question 4 below.

---

## 5. Authentication Consistency Review

All 26 AUTH-PO decisions are internally coherent. Point-by-point against the specific contradiction classes named in the governing instructions:

| Area | Decisions | Consistency finding |
|---|---|---|
| Purchase-before-account | AUTH-PO-01, 14 | Consistent with each other (14 reconfirms 01 for the unauthenticated-visitor case specifically) |
| Dormant `users` row | AUTH-PO-25 (new) | Resolves the only open question about how 01/14/15 are implemented; no contradiction with 01's literal wording once "account" is read as "login-capable account" (see §2.2) |
| Immutable purchase email | AUTH-PO-15, 18 | Consistent; 18 extends 15's "immutable" rule to explicitly forbid any similarity-based auto-merge |
| Activation token | AUTH-PO-02, 06, 07, 21 | Consistent; 21's "no fixed deadline, 24h per-link TTL" is the same TTL already used by 06/07 and does not introduce a second, conflicting TTL |
| Existing account reuse | AUTH-PO-04, 09, 16 | Consistent; 16 is the subscription-specific instance of 04's general rule, adding the "skip signup page, auto-login" behavior for the password-already-set case |
| Existing password | AUTH-PO-09, 16 | Consistent; both say never overwrite an existing password |
| Auto-login | AUTH-PO-16, 17 | Consistent with each other; 17 extends 16 by also forbidding blocking Client Finder on missing profile fields |
| Unified login | AUTH-PO-08, 13 | Consistent; 13 is 08's stated end-state, not a second mechanism |
| Account enumeration | AUTH-PO-07, 10 | Consistent; 10 is the general rule, 07 is its instance for activation-resend |
| Unsafe email-only session endpoint | AUTH-PO-11 | No tension with any other decision; 13 explicitly does not require 11 to wait (per the original record's cross-impact trace) |
| Subscription ownership before activation | AUTH-PO-19, 20 | Consistent; both say billing/ownership is independent of activation status |
| Activation after cancellation | AUTH-PO-23 | Consistent with 19/20 — cancellation only stops future renewal, current period (and activation eligibility within it) is unaffected |
| Activation after renewal failure | AUTH-PO-24 | Consistent with 23 — same "runs to current period's actual end" rule, just triggered by a different lifecycle event |
| 30-day activation period | AUTH-PO-21, 26 (new) | Consistent; 26 settles that this is read from the existing computed period, not a live status poll |

**No contradictions found.** The only items that were ever in tension were against the *existing codebase's own prior engineering decision* (§4 item 3), not between PO decisions — and AUTH-PO-25 now settles the resolution direction for that.

---

## 6. Commercial Consistency Review

All 12 COMMERCIAL-PO decisions are internally coherent. Re-verified specifically:

- PO-01 (three independent products, 30-day periods) does not contradict PO-02 (₹1,499 grants all three) — "independent lifecycle" governs *ownership*, PO-02 governs *access*, and PO-03 explicitly names this as two different concepts (§3.2, "core restated principle").
- PO-03's "buying/cancelling one never affects another" does not contradict PO-11's "₹1,499-granted ₹99/₹499 access ends when ₹1,499 ends" — the access that ends is the *package-granted* access, not the *independent* subscription; an independently-held ₹99/₹499 row is explicitly carved out in PO-11's own text ("Independently purchased ₹99 and/or ₹499 subscriptions remain unaffected").
- PO-09/PO-10 (₹99/₹499 cancellation = stop-renewal only, current period unaffected, no refund/proration) are symmetric and do not conflict with PO-11/PO-12's identical timing rule for ₹1,499 — all four products (counting ₹1,499's two failure modes separately) use exactly one timing rule: *the current paid period always runs to its own computed end; nothing shortens it; nothing extends it; no grace period is ever added.*
- PO-04 (₹1,499 renewal extends package access, never rewrites ₹99/₹499) does not conflict with PO-12 (₹1,499 renewal *failure* ends package access at expiry) — these are the success/failure branches of the same event, not competing rules.

**No contradictions found.**

---

## 7. Scenario Verification

All nine scenarios named in the governing instructions were checked against COMMERCIAL-PO-01 through 12. Each is **consistent with the decision set as written** (no PO-level contradiction). The implementation-readiness column is separate — see §8/§12.

| Scenario | Expected outcome | Consistent with PO decisions? | Currently implementable? |
|---|---|---|---|
| A — ₹99 only | ₹99✅ ₹499❌ CF❌ | Yes (PO-01/02) | No — ₹99 has no subscription-period lifecycle today (§9) |
| B — ₹499 only | ₹99❌ ₹499✅ CF❌ | Yes (PO-01/02) | No — same gap, for ₹499 |
| C — ₹99+₹499 | ₹99✅ ₹499✅ CF❌ | Yes (PO-02: ₹99+₹499 never auto-grants CF) | Partially — both already coexist in `entitlements` with no exclusivity constraint (§9), but neither has a period/cancellation concept |
| D — direct ₹1,499 | ₹99✅ ₹499✅ CF✅ | Yes (PO-02) | No — `hasClientFinderAccess()` (`packages/core-subscriptions/src/access.ts:34-50`, re-verified this pass) checks only the ₹1,499 slug; it does not grant ₹99/₹499 |
| E — ₹99 then ₹1,499 | ₹99 independent active; ₹1,499 active grants all three | Yes (PO-02/03) | No — same access-cascade gap as D, plus no coexistence test exists yet beyond schema capability |
| F — ₹99+₹499 then ₹1,499 | All three independent; all three accesses active | Yes (PO-03) | No — same gap as E |
| G — ₹99+₹1,499, cancel ₹1,499 | ₹99 stays active throughout; ₹1,499 (and its package access) ends only at period end | Yes (PO-11) | No — no cancellation mechanism exists at all (§9); access cascade also missing |
| H — ₹99+₹499+₹1,499, ₹1,499 renewal fails | All three accessible through the paid period; after expiry, independents remain, ₹1,499/package access ends | Yes (PO-12) | No — same two gaps as G |
| I — only ₹1,499, renewal fails | After expiry: ₹99❌ ₹499❌ CF❌ | Yes (PO-12 — nothing independent exists to remain active) | Partially — the "fail = no new period, nothing else changes" half is already correct by omission (webhook simply does not insert a new row; re-verified `packages/core-payments/src/webhookHandler.ts:103-108`, no `payment.failed` handling exists or is needed per AUTH-PO-26/IRL-O); the package-access-ends half still needs the same cascade logic as D–H |

**No scenario produces a PO-level contradiction.** Every scenario's gap is an **implementation gap**, enumerated once (not per-scenario) in §12.

---

## 8. Current Implementation Audit

Re-verified directly against the working tree this pass (not solely carried forward from the two prior audits), including the files with uncommitted changes shown by `git status`.

| Area | Current behavior | Files | Classification |
|---|---|---|---|
| **A. ₹99 subscription** | No subscription/period concept. Tracked only as a one-time row in `entitlements` (`UNIQUE(customer_email, product_slug)`), no expiry, no renewal, no cancellation field. | `packages/db/prisma/migrations/0004_entitlements/migration.sql` | MISSING |
| **B. ₹499 subscription** | Same as A. | Same table | MISSING |
| **C. ₹1,499 subscription** | Fully modeled: `subscription_periods` table, created only by the Razorpay webhook on `subscription.charged`; checkout route creates the Razorpay subscription object but writes no local row until the webhook fires. Checkout precondition still `requireUser()` (re-confirmed this pass, line 44 of the route; see below). | `apps/web/app/api/payments/create-subscription/route.ts:14-21,44`; `packages/core-payments/src/createSubscription.ts`; `packages/db/prisma/migrations/0040_subscription_periods/migration.sql` | PARTIALLY IMPLEMENTED (billing side works for an already-authenticated user; pre-purchase/activation side per AUTH-PO-01/14/25 does not exist) |
| **D. Complete-package access cascade** | `hasClientFinderAccess()` reads only `CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG` ("ai_client_acquisition_1499_subscription"); falls back only to a per-opportunity permanent `lead_unlocks` row (IRL-I), never to a ₹99/₹499 grant. No code anywhere grants ₹99/₹499 access from an active ₹1,499 subscription. | `packages/core-subscriptions/src/access.ts:18-52` (re-read in full this pass) | MISSING |
| **E. Cancellation (all three products)** | No cancellation API route exists anywhere under `apps/web/app/api/**` (re-confirmed by direct `find` this pass — zero matches for `*cancel*`). No `cancelled_at`/`auto_renew` column on `subscription_periods`. No `subscription.cancelled`/`subscription.halted` webhook handling. | Repo-wide `find`/`grep`, re-run this pass; `packages/core-payments/src/webhookHandler.ts:103-108` | MISSING |
| **F. Renewal (success)** | Each successful `subscription.charged` webhook event inserts one new `subscription_periods` row; prior rows are never mutated. Already consistent with COMMERCIAL-PO-04's "never rewrites" rule, by construction. | `packages/core-payments/src/webhookHandler.ts` | IMPLEMENTED (for ₹1,499 only — no renewal concept exists for ₹99/₹499, see A/B) |
| **G. Renewal failure** | No explicit handling exists, and per AUTH-PO-26/IRL-O none is required: a failed charge simply produces no new `subscription_periods` row, which already satisfies COMMERCIAL-PO-12's "no grace period, current period runs to actual expiry" by omission. `SUPPORTED_EVENTS` (re-confirmed this pass, lines 103–108) still lists only `payment.captured`, `refund.created`, `refund.processed`, `subscription.charged` — no `payment.failed` entry, and none is needed for the timing rule itself. | `packages/core-payments/src/webhookHandler.ts:103-108` | IMPLEMENTED (timing rule, by omission) / MISSING (the access-cascade-ends-at-expiry half, same gap as D) |
| **H. Expiry** | Computed at read time as `activation_at + duration_days`, never stored (`packages/core-subscriptions/src/access.ts:67-77`, `getClientFinderSubscriptionStatus`, re-read this pass). This is exactly the mechanism AUTH-PO-26 directs be used. | `packages/core-subscriptions/src/access.ts:67-77` | IMPLEMENTED (for ₹1,499 only) |
| **I. Activation (₹1,499 subscription path)** | Does not exist. The existing `claim_tokens` table/flow (migration `0038`) is wired to the one-time `orders` table (`order_id TEXT NOT NULL` FK) and to the ₹99/₹500/one-time-₹1,499 claim journey; the subscription checkout creates no `orders` row, so this table cannot be reused as-is. | `packages/db/prisma/migrations/0038_claim_tokens_and_account_linkage/migration.sql`; `apps/web/app/api/auth/signup/route.ts` | MISSING |
| **J. Authentication (`/api/auth/*`)** | `POST /api/auth/session`'s email-only mint path still exists, unchanged (AUTH-PO-11 not yet implemented). `POST /api/auth/login` (password-based) already exists and is unaffected. `POST /api/auth/signup`'s existing-account branch mints no session and tells the customer to log in manually — the opposite of AUTH-PO-16/17's "auto-login, skip profile" requirement, confirmed still true this pass (no auth route files appear in `git status`'s changed-file list). | `apps/web/app/api/auth/session/route.ts`; `apps/web/app/api/auth/signup/route.ts:134-144` | PARTIALLY IMPLEMENTED (login primitive exists; AUTH-PO-11/16/17's specific requirements do not) |
| **K. Entitlement calculation** | One-time products (`entitlements` table) already support multiple independent rows per customer with no exclusivity constraint — directly usable, unmodified, for COMMERCIAL-PO-03's coexistence requirement once ₹99/₹499 have *some* lifecycle concept. Subscription-side calculation checks only one hardcoded slug. | `packages/core-subscriptions/src/access.ts:18-52`; `packages/db/prisma/migrations/0004_entitlements/migration.sql` | PARTIALLY IMPLEMENTED |

**New-this-pass observation (uncommitted work in progress):** `apps/web/src/checkout/types.ts` and `request.ts` have uncommitted changes (`git status`/`git diff`, re-read in full this pass) that add a `createSubscriptionRequest()`/`SubscriptionPaymentInfo` pathway to the frontend checkout state machine. This work **keeps** the single-SKU, session-required model exactly as documented (`CreateSubscriptionRequest` still carries no `productId`; the code's own comment, re-read this pass, still says "there is exactly one subscription SKU, so create-subscription's own request schema takes none"; `toSubscriptionCheckoutError()` still maps HTTP 401 to "Please log in..."). It does not resolve, worsen, or otherwise touch Conflict 1/AUTH-PO-14, and does not change any finding in this audit — recorded here only so the next engineering pass knows this frontend work was in flight at audit time and is consistent with (not a step toward) the still-unimplemented AUTH-PO-25 mechanism.

---

## 9. Data-Model Audit

Re-verified against `packages/db/prisma/migrations/` directly this pass (latest on disk: `0042_lead_unlock_contacts`; no new migrations in the working tree per `git status`).

| Requirement | Can the current model represent it? | Evidence |
|---|---|---|
| Independent ₹99 subscription | **No** — `entitlements` has no period/expiry/cancellation concept | `0004_entitlements/migration.sql` |
| Independent ₹499 subscription | **No** — same gap | Same |
| Independent ₹1,499 subscription | **Yes** — `subscription_periods`, already live | `0040_subscription_periods/migration.sql` |
| Multiple simultaneous subscriptions for one user | **Yes, already** — no `UNIQUE(user_id)` constraint on `subscription_periods`; only `razorpay_payment_id` is unique, `(user_id, product_slug)` is a plain lookup index; `entitlements` has `UNIQUE(customer_email, product_slug)`, i.e. one row per product, many products per customer | `0040_subscription_periods/migration.sql:32-67`; `0004_entitlements/migration.sql:57-58` |
| One subscription granting multiple product entitlements | **No** — no table expresses "this row's product_slug implies access to these other slugs"; the one-time-product equivalent (`packages/catalog/src/ladder.ts:16-20`) is a hardcoded list specific to the old one-time SKU, not a general mechanism | `ladder.ts:16-20`; `access.ts:18-52` |
| Independent cancellation | **No column exists** — `subscription_periods` schema is `id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, activation_at, duration_days, refunded_at, created_at, updated_at`; no `cancelled_at`/`auto_renew` | `0040_subscription_periods/migration.sql:31-49` |
| 30-day periods | **Yes, already** — `duration_days` column, computed expiry at read time | Same migration |
| Renewal | **Yes, already** — one new row per successful charge, by construction (webhook never updates, only inserts) | `webhookHandler.ts` |
| Renewal failure | **Yes, already, by omission** — no row inserted; access.ts's read-time computation naturally reflects "no new active period" | `access.ts:67-77` |
| Activation state | **No** — no table exists for a pending/unverified purchase identity; `claim_tokens` is FK'd to `orders`, which the subscription flow never creates | `0038_claim_tokens_and_account_linkage/migration.sql` |

**Minimum data-model changes implied (report only — not decided or implemented here):**
1. A mechanism for ₹99/₹499 to carry a period/expiry/cancellation concept. Given `subscription_periods` already supports multiple rows per `(user_id, product_slug)` with no exclusivity constraint, and already has exactly the 30-day/renewal/no-grace-period semantics COMMERCIAL-PO-09/10 require, **reusing `subscription_periods` for `ai_income_99`/`ai_freelancing_499` rows is the lower-risk, less-novel option** compared to retrofitting an expiry/cancellation concept onto the one-time `entitlements` table from scratch. This is an engineering architecture choice, answerable from already-authoritative requirements (COMMERCIAL-PO-01's "each is a subscription/product entitlement with its own lifecycle" plus the schema facts above) — **not sent back to the PO as an open question** (see §15 on why).
2. A `cancelled_at` (or `auto_renew` boolean) column on whichever table ends up holding ₹99/₹499/₹1,499 periods, read by the access/expiry computation exactly as it does today (no new "cancelled but still active" state machine needed — PO-09/10/11 all describe the same "ignore cancellation flag until the already-computed period ends" rule AUTH-PO-26 already establishes as the pattern).
3. A pending-purchase-identity mechanism per AUTH-PO-25: either a dormant `users` row (no new table) or, if the engineering team prefers to keep `users` strictly "real accounts only," a new table mapping `purchase_email → razorpay_subscription_id → activation_token`. AUTH-PO-25 decides which **model concept** to use (dormant row); it does not mandate a specific table name or column list, which remains an implementation plan detail.
4. A complete-package access-resolution function that, given an active ₹1,499 row, also returns "has access" for `ai_income_99`/`ai_freelancing_499` — no schema change required, this is pure logic layered on data that already exists once (1) is in place.

No schema change was made. No architecture is decided beyond what the PO decisions already imply.

---

## 10. Old ₹1,499 Product Audit

Re-confirmed this pass (catalog/ladder files are unchanged per `git status` — not among the modified/untracked files):

- `ai_client_acquisition_1499` is still defined as an active, purchasable `ProductId` in `packages/catalog/src/products.ts:31-51` and still appears on `PRODUCT_LADDER` (`packages/catalog/src/ladder.ts:16-20`). **Not yet retired from new purchases in code** — COMMERCIAL-PO-05 is a decision, not yet an implementation (consistent with §12 below).
- The one non-fixture-pattern record, the order/payment/entitlement for `chavan.sharad89@gmail.com`, remains classified as **TEST/DEVELOPMENT DATA** per COMMERCIAL-PO-06 (revised)/PO-08 — a Product Owner policy classification, not a new finding of this pass. **Not migrated. Not deleted. No new entitlement created from it. Not used as evidence of a production customer.** No database read was performed in producing this document (the prior audit's own read-only `SELECT` already established this fact and is cited, not re-run, per the token-efficiency instruction against repeating established information).
- All other old-SKU-adjacent records (a second, PENDING, obviously-fixture order row; the `e2e-1499-test@example.test`/`e2e-1499-nosub@example.test` subscription-SKU fixtures; every test file listed in the base commercial audit §C) remain classified as development/test/dummy data, unchanged.

---

## 11. True Conflicts

Both items below are **already resolved** (by a superseding PO decision) rather than open — listed here because the governing instructions require every discrepancy to be classified, including resolved ones, so the audit trail is complete.

1. **AUTH-PO-01/14 vs. the committed `requireUser()` precondition on `create-subscription` + `subscription_periods.user_id NOT NULL`.** Was a true conflict between the new PO decision and the existing, deliberately-documented engineering precondition (`createSubscription.ts:14-26`). **Resolved in principle by AUTH-PO-25** (§2.2, §4 item 3) — the dormant-row mechanism is compatible with the `NOT NULL` constraint and removes the need for `requireUser()` to gate checkout. Code has not yet been changed (§8) — the conflict is resolved as a *decision*, not yet as an *implementation*. Tracked forward as Implementation Gap §12 item 1.
2. **COMMERCIAL-PO-05 vs. `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`/IRL-K's "old SKU remains unchanged, stays open indefinitely."** Resolved by explicit supersession (§4 item 1). No further PO input needed.

---

## 12. Implementation Gaps

1. ₹1,499 subscription checkout still requires an authenticated session before talking to Razorpay (`create-subscription/route.ts:44`); AUTH-PO-25's dormant-row mechanism is decided but not built.
2. No pending-purchase-identity / activation-token mechanism exists for the subscription path; `claim_tokens` cannot be reused as-is (FK'd to `orders`, which this checkout never creates).
3. `apps/web/app/api/auth/signup/route.ts:134-144`'s existing-account branch mints no session and tells the customer to log in manually — the opposite of AUTH-PO-16/17's required auto-login/skip-profile behavior for the new subscription-activation path specifically (scope question — see Open PO Question 2 below).
4. No cancellation mechanism exists for any of the three products: no API route, no webhook handler for `subscription.cancelled`/`halted`, no `cancelled_at` column.
5. ₹99/₹499 have no subscription/period lifecycle at all today (one-time `entitlements` rows only) — a precondition for COMMERCIAL-PO-09/10's cancellation requirement, not merely a parallel gap.
6. The complete-package access cascade (active ₹1,499 → also grants ₹99/₹499) does not exist in `packages/core-subscriptions/src/access.ts` — the single largest piece of missing logic behind Scenarios D–I in §7.
7. The old one-time `ai_client_acquisition_1499` SKU is still live in the catalog/checkout/ladder code (`products.ts`, `ladder.ts`) — COMMERCIAL-PO-05's retirement has not been implemented.

None of these are PO-level conflicts; all are code that does not yet exist to satisfy a decision that does.

---

## 13. Documentation Gaps

1. `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`'s ES-1/7/8/10 decide ₹499↔₹1,499 coexistence and independent usage limits but never mention ₹99 at all — COMMERCIAL-PO-02/03 now require the identical treatment for ₹99, and the entitlement-stacking record should be extended (or superseded by a successor) to say so explicitly rather than leaving ₹99 to be inferred by analogy.
2. AUTH-PO-21–24's own wording ("use the existing Razorpay lifecycle/status") described a mechanism the system does not actually use (live Razorpay status reads) — **now closed by AUTH-PO-26** (§2.2), but the four original decision documents' text itself still contains the stale phrasing. Recommend a one-line editorial note in the authentication decisions record cross-referencing AUTH-PO-26, so a future reader does not re-open a question AUTH-PO-26 already settled. (No PO action needed — a documentation-hygiene note only.)

---

## 14. Test/Fixture Gaps

- No test exists anywhere in the repository for: the complete-package access cascade (Scenarios D–I), any cancellation flow (none exists to test), ₹99/₹499 coexisting with an active ₹1,499 subscription, or the dormant-row pending-identity mechanism (none exists to test). This is a gap **by omission**, tracking 1:1 with the implementation gaps in §12 — there is nothing yet to write tests against. Existing tests for the old one-time ₹1,499 SKU, the ₹1,499 subscription's own checkout/webhook/access logic, and ₹99/₹499's one-time entitlement behavior remain accurate for what they each currently test and require no change from this audit.

---

## 15. Open Product Owner Questions

Trimmed to genuinely unresolved product questions only — every item below was checked against the existing authoritative requirement set first and could **not** be resolved from it or from pure engineering judgment.

1. **Scope of "retired from new purchases" (COMMERCIAL-PO-05).** Does retirement mean only that checkout/catalog should stop accepting new orders for `ai_client_acquisition_1499` (existing purchasers keep current access/downloads unchanged), or does it also mean removing the product from public listings/marketing pages? No existing document answers this, and the governing instructions for this audit series direct that no additional feature change be inferred. **PARTIALLY ADDRESSED (addendum pass):** COMMERCIAL-PO-13 authorizes complete removal of the accidental SKU's *development/test records* in the dev environment. The public-listing/marketing-page question remains open.
2. **Scope of AUTH-PO-16/17's auto-login/skip-profile behavior.** Should this new behavior be built *only* for the new ₹1,499-subscription activation path (leaving the existing ₹99/₹499/one-time-₹1,499 claim-flow's "mint no session, log in manually" behavior untouched, per COMMERCIAL-PO-07/the governing instruction not to alter established product functionality), or does the PO want the older claim-flow brought in line with the new auto-login behavior too? AUTH-PO-16/17's text names only "the ₹1,499 subscription." **RESOLVED (addendum pass) by AUTH-PO-27:** unified activation behavior — existing-account-with-password reuse, no unnecessary signup — now applies consistently across ₹99, ₹499, and ₹1,499.
3. **Retroactive application of subscription-lifecycle/cancellation to already-sold ₹99/₹499 kits.** `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`'s own flagged item 12 asks whether PO-D1's period framing applies retroactively to kits already sold under a one-time/perpetual understanding. COMMERCIAL-PO-09/10 made this concrete: does a ₹99/₹499 customer who bought *before* the subscription-lifecycle architecture ships get a synthetic 30-day period starting at migration time (and can then "cancel" it), or does the new cancellable-30-day model apply only to purchases made *after* the new architecture ships, with pre-existing purchasers kept on their original one-time/perpetual access until they repurchase? **CLOSED for the current development environment (addendum pass) by COMMERCIAL-PO-14:** every existing ₹99/₹499 purchase record in the current environment is a dummy development record and may be removed; there is accordingly no real pre-architecture purchase in the development environment that retroactive treatment would apply to, so this question does not block current implementation. A hypothetical real legacy purchase under a one-time/perpetual understanding in a production environment is not treated as a blocker and is not decided here — it remains a question for if/when that scenario is real, not for the current development state.
4. **Proactive migration of existing password-less accounts toward unified login (AUTH-PO-13's end-state).** ~~Should existing password-less ₹99/₹499/one-time-₹1,499 accounts that never touch the new ₹1,499 subscription be proactively prompted to set a password, and on what timeline — or do they remain untouched indefinitely, reachable only via whichever login surface survives AUTH-PO-11's removal of the email-only session mint?~~ **CLOSED for the current development environment (addendum pass) by AUTH-PO-28:** the current environment is development-only; existing password-less development accounts may be removed; no migration path is required; the unified authentication model is implemented from a clean state. No existing governing requirement in this repository explicitly requires deciding a migration timeline for a hypothetical real, non-dummy password-less account, so no such question is carried forward here. If a real password-less account is ever identified, that would be a new fact requiring a new, separately-scoped PO decision — not an extension of this already-closed question.

### New questions raised specifically by the combined authentication + commercial model

5. **Identity/auth mechanism for ₹99/₹499 cancellation requests.** COMMERCIAL-PO-09/10 give ₹99/₹499 customers a cancellation capability for the first time, but many existing ₹99/₹499 customers are password-less (claim-token-only access, no login). AUTH-PO-11 is permanently removing the one existing email-only session mechanism. What identity/authentication mechanism does a password-less ₹99/₹499 customer use to request cancellation — a new password-less, single-use "manage my subscription" link (mirroring the activation-link pattern), or a requirement to first set a password via AUTH-PO-09's existing-account path? Neither AUTH-PO-01–26 nor COMMERCIAL-PO-01–12 answers this; it only becomes a live question once both decision sets are combined. **Related but distinct from Q13 (addendum pass, PENDING):** this item (5) is about *authentication identity* for a password-less customer; Q13 is about the *initiation mechanism* (self-service UI vs. support/manual) for any customer, password-less or not. Both remain open; Q13 is explicitly PENDING by direct PO instruction, not to be resolved by inference from item 5 or vice versa.
6. **Whether the new ₹1,499-subscription activation-link pattern (AUTH-PO-01/14/15/25) should also become the onboarding mechanism for ₹99/₹499 once they move onto a subscription lifecycle**, or whether ₹99/₹499 keep today's existing claim-token flow (which already supports password-less entitlement linkage) unchanged, with only a cancellation capability added on top. COMMERCIAL-PO-07 says not to silently change ₹99/₹499's established functionality, which argues for the latter — but this has not been explicitly decided, only implied.

---

## 16. Recommended Implementation Sequencing

Sequencing only — **not an authorization to begin any of it** (see §17).

1. **Foundation — pending-purchase identity.** Implement AUTH-PO-25's dormant-row mechanism and remove/replace the `requireUser()` precondition on `create-subscription`. This unblocks the entire ₹1,499 purchase-first flow and is a prerequisite for almost everything else (activation, AUTH-PO-16/17's auto-login path, and indirectly the ₹99/₹499 cancellation-identity question in Open PO Question 5).
2. **Activation.** Build the activation-link/token mechanism (new table or generalized `claim_tokens`), the activation email (Resend, AUTH-PO-12), and the activation-consumption endpoint implementing AUTH-PO-02/06/07/16/17.
3. **AUTH-PO-11.** Remove the email-only `/api/auth/session` mint path once its replacement (step 1–2's authenticated session issuance) exists.
4. **₹99/₹499 subscription-lifecycle foundation.** Resolve Open PO Question 3 (retroactive scope), then extend `subscription_periods` (or the chosen equivalent) to cover `ai_income_99`/`ai_freelancing_499`, including the `cancelled_at`/`auto_renew` column needed by all three products.
5. **Cancellation.** Build one cancellation mechanism (API route + webhook handling where applicable) reused across ₹99/₹499/₹1,499, since COMMERCIAL-PO-09/10/11 all describe the identical timing rule.
6. **Complete-package access cascade.** Extend `hasClientFinderAccess()`/the access-resolution layer so an active ₹1,499 row also grants `ai_income_99`/`ai_freelancing_499` access. This can be built in parallel with steps 4–5 since it only reads existing-shape data once step 4 exists for ₹99/₹499, and the ₹1,499 side already has everything it needs today.
7. **Old-SKU retirement.** Remove `ai_client_acquisition_1499` from new-purchase checkout/catalog paths per the resolution of Open PO Question 1, without touching existing purchasers' access or deleting any file/row (COMMERCIAL-PO-05/06).
8. **Documentation hygiene.** Close the stale-wording note in §13 item 2 and formally mark the questionnaire superseded per §4 item 4. Low effort, no dependencies, can happen at any point.

---

## 17. Explicit Implementation Authorization Status

**IMPLEMENTATION IS NOT AUTHORIZED BY THIS AUDIT.**

No code, schema, migration, test, or production change is authorized by this document. The next steps are, in order:

1. Resolve the four genuinely open PO questions in §15 (items 1–4) and decide the two new combined-model questions (items 5–6).
2. Create an implementation plan from the sequencing in §16.
3. Review that implementation plan.
4. Obtain explicit Product Owner authorization to implement.
5. Only then implement.

---

## 18. Confirmation

- No application code was changed.
- No database schema was changed.
- No migration was changed or created.
- No database row was changed, inserted, or deleted (all old-data findings in §10 are carried forward from the prior audit's own read-only query and cited, not re-queried).
- No test or fixture was changed.
- No file outside this document and the two documents it consolidates (both already present in the repository, unmodified by this pass) was created or changed.
- No commit was made.
- No push was made.
- No deployment was made.

---
---

# Addendum: Q3–Q13 Authentication and Commercial Model Decisions

**Status:** GOVERNANCE / REQUIREMENTS RECORD ONLY. Recorded verbatim from a Product Owner decision round held after the pass above. **No application code, database schema, migration, database row, test, or fixture was created, modified, or deleted. No commit, push, or deployment was made.** This is a recording task only — no code implementation is authorized or implied.

**Note on identifiers:** AUTH-PO-27 and COMMERCIAL-PO-13 are the **latest authoritative Product Owner decisions from the current PO decision round**. The governing instructions for this round named them "AUTH-PO-27" and "COMMERCIAL-PO-13" and listed them under "existing decisions to preserve." A targeted search of the repository (every `requirement/*.md` file, tracked and untracked) found **no prior use of `AUTH-PO-27` or any ID above `AUTH-PO-26`, and no prior use of `COMMERCIAL-PO-13` or any ID above `COMMERCIAL-PO-12`.** These two decisions are therefore **recorded here as new repository decision IDs, precisely because those IDs were not previously present in the repository** — the same way AUTH-PO-25/26 were recorded directly in §2.2 of this document. They are authoritative as of this round regardless of that absence; the absence is a repository-recordkeeping fact, not a question about whether the decisions themselves are authoritative. See the Consistency/Audit Check below.

---

## A1. New Authentication Decisions (AUTH-PO-27 → AUTH-PO-29)

> **AUTH-PO-27 — Unified activation behavior across all three products.** Unified activation behavior applies consistently across ₹99, ₹499, and ₹1,499. An existing account that already has a password is reused; the password is not overwritten. The signup/profile form must not be shown unnecessarily. Accounts needing setup go through secure activation/setup. Entitlements determine access, not which activation path was used.

> **AUTH-PO-28 — Existing password-less development accounts.** OPTION A — clean development environment. Existing password-less/dummy development accounts may be removed. No migration path is required for those development accounts. The new unified authentication model is implemented from a clean state. Legacy password-less development-account behavior is not preserved. Real/unrelated accounts and data are not affected.

> **AUTH-PO-29 — Purchase-and-activation flow, extended to all three products.** OPTION A — purchase first → activation → account setup → access, for **all three products (₹99, ₹499, ₹1,499)**: (1) customer enters purchase email; (2) customer completes payment; (3) payment creates/maintains the purchase/subscription identity; (4) a secure activation email is sent to the purchase email; (5) customer consumes the activation link; (6) email is verified; (7) an account is created or an existing account is reused; (8) customer sets up a password if required; (9) customer is authenticated; (10) product access is determined by resulting entitlements. No account is required before purchase, for any of the three products.

---

## A2. New Commercial Decisions (COMMERCIAL-PO-13 → COMMERCIAL-PO-15)

> **COMMERCIAL-PO-13 — Accidental one-time ₹1,499 product, complete removal.** The accidental old one-time product `ai_client_acquisition_1499` is **not** part of the intended product. It is to be completely removed from the development environment. Only `ai_client_acquisition_1499_subscription` is the intended ₹1,499 product. Existing accidental one-time-₹1,499 development/test records should be removed. These records are not migrated to the subscription. The accidental product is not preserved for historical compatibility.

> **COMMERCIAL-PO-14 — Existing ₹99/₹499 dummy purchases.** Existing ₹99 and ₹499 purchases in the current environment are dummy development records. Existing ₹99 dummy purchases may be removed. Existing ₹499 dummy purchases may be removed. No migration of these dummy purchase records is required. No backward compatibility is required for these dummy records. The new 30-day subscription model can be implemented from a clean development state. This does not affect unrelated real/non-dummy data, and **does not** authorize deleting real customer purchases in a production environment — this decision is scoped to the current development environment's dummy records only.

> **COMMERCIAL-PO-15 — ₹99/₹499 renewal payment failure.** For both ₹99 and ₹499: if a renewal payment fails, the current paid 30-day period remains active until actual expiry. Failed renewal does not immediately remove access. No additional grace period is added after expiry. If renewal remains unsuccessful by expiry, access ends. Other independently active subscriptions remain unaffected. (This is the renewal-failure analog of COMMERCIAL-PO-12, which previously covered only ₹1,499; COMMERCIAL-PO-09/10 covered ₹99/₹499 customer-initiated cancellation but did not separately address a failed renewal charge.)

---

## A3. Reaffirmed Decisions — No New ID Assigned

The Product Owner also restated the following in this round. Each restatement was checked word-for-word against the existing authoritative text (§2.1/§2.2, §3.1/§3.2, and the two source documents they summarize) and found to be **substantively identical, with no new content**. Per the governing instruction to avoid creating duplicate/conflicting decision records where an existing one can be reconciled cleanly, **no new ID is assigned** to any of the five items below; each is recorded here only as a cross-reference to the ID that already carries this content.

| Restated as | Reaffirms | Finding |
|---|---|---|
| "Normal future login = email + password; activation link is not normal login; no passwordless/magic-link as the standard mechanism" | AUTH-PO-08, AUTH-PO-13 | Identical in substance. No new content. |
| "₹99 and ₹499 each have independent 30-day lifecycles; cancelling/renewal-failure of one does not affect the other; no merged lifecycle" | COMMERCIAL-PO-01, COMMERCIAL-PO-03 | Identical in substance. No new content. |
| "₹1,499 coexists independently with ₹99/₹499; grants the complete package; independents continue on their own periods if ₹1,499 ends" | COMMERCIAL-PO-02, COMMERCIAL-PO-03, COMMERCIAL-PO-04 | Identical in substance. No new content. |
| "₹1,499 cancellation: stops next renewal only, current period stays active, no refund/proration, package access ends at period end if not renewed, independents unaffected" | COMMERCIAL-PO-11 | Word-for-word identical in substance, including the "no refund, no proration" clause already present in COMMERCIAL-PO-11's original text. No new content. |
| "₹99/₹499 cancellation: same rule — stop-renewal only, current period stays active, no refund/proration, inactive at period end if not renewed" | COMMERCIAL-PO-09, COMMERCIAL-PO-10 | Identical in substance. No new content. |
| "₹1,499 renewal failure: current period runs to actual expiry, no grace period, access ends at expiry, independents unaffected" | COMMERCIAL-PO-12 | Identical in substance. No new content. |

Each item above explicitly concerned the *effect* of cancellation/renewal-failure, not the *mechanism* by which a customer initiates cancellation — consistent with how COMMERCIAL-PO-09/10/11 were originally scoped, and consistent with Q13 below being left pending.

---

## A4. Q13 — Cancellation Initiation Mechanism: Explicitly PENDING

**STATUS: PENDING. NOT DECIDED. NOT TO BE INFERRED.**

The Product Owner explicitly instructed that the mechanism by which a customer *initiates* cancellation — for ₹99, ₹499, and ₹1,499 alike — remains undecided. Per direct instruction, this document does **not** decide, and does **not** record as authoritative, either of:
- that cancellation must be available through the authenticated UI, or
- that cancellation must be a support/manual process.

Only the cancellation **effect** decisions (AUTH/COMMERCIAL-PO-09, -10, -11, -12, and their reaffirmation in §A3 above) are authoritative. The mechanism question is cross-referenced, but not answered by, Open PO Question 5 in §15 above (see the annotation added there) — Question 5 is specifically about authentication identity for password-less customers; Q13 is the broader, product-wide question of where/how cancellation is requested at all. Both are open. Neither resolves the other.

---

## A5. Consistency / Audit Check (this pass)

Checked against §2 (AUTH-PO-01–26), §3 (COMMERCIAL-PO-01–12), §4 (superseded items), and §15 (open questions) of the document above:

1. **No contradictions found** between any of AUTH-PO-27–29, COMMERCIAL-PO-13–15, or the six reaffirmed items in §A3, and any existing AUTH-PO-01–26 or COMMERCIAL-PO-01–12 decision. Every new item either (a) extends an existing decision's scope to products it did not previously cover (AUTH-PO-27 extends AUTH-PO-16/17's auto-login scope; AUTH-PO-29 extends AUTH-PO-01/14's purchase-first scope from ₹1,499-only to all three; COMMERCIAL-PO-15 extends COMMERCIAL-PO-12's renewal-failure rule from ₹1,499-only to ₹99/₹499), or (b) authorizes a data-cleanup action not previously authorized at that scope (COMMERCIAL-PO-13 extends COMMERCIAL-PO-06/08's single-record classification to the whole accidental-SKU record set; COMMERCIAL-PO-14 extends it to ₹99/₹499 dummy purchases; AUTH-PO-28 extends it to password-less dev accounts), or (c) restates existing content with no material change (§A3).
2. **Identifier provenance (flagged, not silently resolved):** AUTH-PO-27 and COMMERCIAL-PO-13 are the latest authoritative Product Owner decisions from this round. No document in this repository used those IDs before this pass, so they are recorded here as new repository decision IDs — precisely because the IDs were not previously present — not as a correction of, or substitute for, some other prior record. If a separate, earlier record of these two decisions exists outside this repository, it has not been reconciled against this entry and should be checked against the verbatim text in §A1/§A2 above for drift.
3. **Q13 (§A4) does not contradict COMMERCIAL-PO-09/10/11/12** or their reaffirmation in §A3 — the effect of cancellation (what happens to access and billing) is fully decided; only the initiation mechanism (how a customer triggers it) is pending, and this document takes no position on it.
4. **Governing-instruction compliance:** no PO decision was invented or inferred beyond the verbatim text supplied for this round; no prior decision was silently changed (all scope extensions and the one partial supersession — COMMERCIAL-PO-05 by COMMERCIAL-PO-13, §4 item 5 above — are explicitly marked); Q13 was left pending as instructed; no code, schema, data, commit, or push was made.
5. **Files/records relevant to COMMERCIAL-PO-13's "identify exact files/records exclusively belonging to the accidental SKU" instruction:** already identified by this document's own prior-pass audit (§10 above) — `packages/catalog/src/products.ts:31-51` and `packages/catalog/src/ladder.ts:16-20` define `ai_client_acquisition_1499` in code; the one non-fixture-pattern data record is the `chavan.sharad89@gmail.com` order/payment/entitlement (§10, classified as test/development data per COMMERCIAL-PO-06 revised/08). Re-cited here, not re-queried, per the token-efficiency instruction against repeating established findings. A full file/record inventory for the eventual cleanup task was not re-run in this pass, since this is a recording task and the cleanup itself remains a separate, not-yet-authorized task per the governing instructions' own "no deletion in this task" directive.

**No code, migration, test, commit, push, or deployment was made in producing this addendum.**

---
---

# Addendum 2: Final Q1/Q2/Q3/Q13 Product Owner Decisions

**Status:** GOVERNANCE / REQUIREMENTS RECORD ONLY. Recorded verbatim from a final Product Owner decision round for the authentication and commercial model. **No application code, database schema, migration, database row, test, or fixture was created, modified, or deleted in producing this addendum. No commit, push, or deployment was made.** Recording only — no implementation is authorized or implied.

**Date:** 2026-10-10 (same day, later pass than Addendum 1).

---

## B1. New Decision — COMMERCIAL-PO-17 (Q1: old one-time ₹1,499 product, complete customer-facing removal)

> **COMMERCIAL-PO-17 — Old accidental one-time ₹1,499 product: public-facing removal. OPTION A — REMOVE EVERYWHERE.** The accidental old one-time product `ai_client_acquisition_1499` is not part of the intended product. It must be removed from ALL customer-facing surfaces, including: product/catalog listings; pricing pages; checkout; purchase flows; access pages; marketing/product documentation; navigation and links; and any other customer-facing surface exposing the old SKU. Only the intended `ai_client_acquisition_1499_subscription` is to be presented as the ₹1,499 product. This is in addition to, not a replacement for, the existing decision (COMMERCIAL-PO-13) that the accidental product's development/test records are removed from the development environment. The accidental product is not preserved for historical compatibility.

**Relationship to existing decisions:** COMMERCIAL-PO-17 does not supersede COMMERCIAL-PO-05 or COMMERCIAL-PO-13 — it **sharpens and completes** them. COMMERCIAL-PO-05 decided the old SKU is retired from new purchases; COMMERCIAL-PO-13 decided its development/test *records* are removed from the dev environment; neither, until now, explicitly settled whether removal also covers public listings, marketing pages, and navigation/links. COMMERCIAL-PO-17 answers that question directly and, in doing so, **fully closes Open PO Question 1** (§15 item 1 above), which was previously only "PARTIALLY ADDRESSED."

---

## B2. New Decision — AUTH-PO-30 (Q3: unified secure activation-link onboarding for ₹99/₹499/₹1,499)

> **AUTH-PO-30 — ₹99/₹499 onboarding unified with the ₹1,499 secure activation-link model. OPTION A.** For new purchases of all three products (₹99, ₹499, ₹1,499), the onboarding model is unified: purchase → secure activation email → activation-link consumption → email verification → account creation/reuse → password setup if required → authenticated access. ₹99 and ₹499 do **not** retain a separate legacy claim-token onboarding flow (`apps/web/app/api/auth/signup/route.ts`'s current `claimToken`/password flow, per `packages/db/prisma/migrations/0038_claim_tokens_and_account_linkage/migration.sql`) for new purchases going forward. All three products use the single unified secure activation-link onboarding model described above. Normal future login remains email + password; activation links are for initial activation/setup only, not normal future login.

**Relationship to existing decisions:** AUTH-PO-30 is consistent with, and makes concrete, AUTH-PO-27 (unified activation behavior) and AUTH-PO-29 (purchase-first flow extended to all three products) — neither of those decisions, on its own text, had explicitly settled whether the existing ₹99/₹499 legacy claim-token onboarding path would be retired or kept running in parallel with the new unified flow. AUTH-PO-30 settles that directly: the legacy claim-token *onboarding* path for new ₹99/₹499 purchases is retired in favor of the unified model. This **fully closes Open PO Question 6** (§15 item 6 above). This is an explicit, direct Product Owner decision to change ₹99/₹499's established onboarding functionality — it is not a silent change, so it does not conflict with COMMERCIAL-PO-07's general instruction against silently changing ₹99/₹499's established functionality; COMMERCIAL-PO-07 governs *inference*, not an explicit subsequent PO decision that supersedes the prior default.

---

## B3. New Decision — COMMERCIAL-PO-16 (Q2 + Q13: cancellation out of scope; no cancellation authentication mechanism)

> **COMMERCIAL-PO-16 — Cancellation is out of scope for all packages; Q13 closed.** Cancellation is **not currently in scope** for any package (₹99, ₹499, or ₹1,499). Therefore: no cancellation authentication mechanism, no passwordless cancellation mechanism, and no cancellation-specific login flow are required. No cancellation mechanism (API route, UI, or support/manual process) is to be built, and none is implied by this decision. Existing development accounts/records may be removed as part of the clean development environment (consistent with AUTH-PO-28/COMMERCIAL-PO-14). If cancellation becomes an in-scope future requirement, it requires a new, explicit Product Owner decision — none is inferred here.

**Effect on open items:**
- **Q13 (§A4 above) is changed from PENDING to CLOSED / OUT OF SCOPE.** No cancellation initiation mechanism (self-service UI or support/manual) is selected, because no cancellation mechanism of any kind is currently being built.
- **Open PO Question 5** (§15 item 5: "what identity/authentication mechanism does a password-less ₹99/₹499 customer use to request cancellation") is **closed as moot** — there is currently no cancellation request to authenticate for.

**Relationship to existing decisions — explicitly not a supersession:** COMMERCIAL-PO-16 does **not** supersede or invalidate COMMERCIAL-PO-09, COMMERCIAL-PO-10, COMMERCIAL-PO-11, COMMERCIAL-PO-12, or their §A3 reaffirmation. Those decisions remain the authoritative record of what *would happen* to access/billing if a subscription were cancelled or a renewal failed (stop-renewal only, current period runs to actual expiry, no refund/proration, no grace period). COMMERCIAL-PO-16 only decides that no mechanism to *trigger* a customer-initiated cancellation is being built right now. The two are independent: an effect model can be fully decided while the feature that would invoke it remains unbuilt.

---

## B4. Previously-Recorded Decisions Reconfirmed — No New ID Assigned

Per the instruction against creating a duplicate decision ID for content that already exists verbatim, the following are reconfirmed as authoritative and unchanged, with no new ID:

| Reconfirmed | Already recorded as |
|---|---|
| Unified secure activation behavior across ₹99, ₹499, ₹1,499 | AUTH-PO-27 |
| Existing password-less development accounts may be removed; no migration required | AUTH-PO-28 |
| Purchase-first flow across all three products | AUTH-PO-29 |
| Accidental old one-time ₹1,499 product not part of intended product; must be removed | COMMERCIAL-PO-13 |
| Existing ₹99/₹499 records in current dev environment are dummy records, may be removed | COMMERCIAL-PO-14 |
| Independent ₹99/₹499 subscriptions | COMMERCIAL-PO-01 |
| ₹1,499 complete-package access | COMMERCIAL-PO-02 |
| Coexistence of independently-purchased ₹99/₹499 with ₹1,499 | COMMERCIAL-PO-02, COMMERCIAL-PO-03 |
| Cancellation EFFECT decisions (not mechanism) | COMMERCIAL-PO-09, COMMERCIAL-PO-10, COMMERCIAL-PO-11, COMMERCIAL-PO-12 |

---

## B5. Updated Status of All Previously Open Product Owner Questions (§15)

| # | Question | Status after this addendum |
|---|---|---|
| 1 | Scope of "retired from new purchases" (public listings/marketing pages) | **CLOSED** by COMMERCIAL-PO-17 (§B1) — remove everywhere, all customer-facing surfaces |
| 2 | Scope of AUTH-PO-16/17's auto-login/skip-profile behavior | Already **RESOLVED** by AUTH-PO-27 (unchanged by this addendum) |
| 3 | Retroactive application of subscription-lifecycle/cancellation to already-sold ₹99/₹499 kits | Already **CLOSED** for the dev environment by COMMERCIAL-PO-14 (unchanged by this addendum) |
| 4 | Proactive migration of existing password-less accounts | Already **CLOSED** for the dev environment by AUTH-PO-28 (unchanged by this addendum) |
| 5 | Identity/auth mechanism for ₹99/₹499 cancellation requests | **CLOSED as moot** by COMMERCIAL-PO-16 (§B3) — no cancellation mechanism exists to authenticate for |
| 6 | Should ₹99/₹499 adopt the activation-link pattern, or keep the legacy claim-token flow? | **CLOSED** by AUTH-PO-30 (§B2) — unified activation-link model adopted; legacy claim-token onboarding flow retired for new purchases |
| Q13 | Cancellation initiation mechanism | **CLOSED / OUT OF SCOPE** by COMMERCIAL-PO-16 (§B3), changed from the explicit PENDING status recorded in §A4 |

**Every previously open Product Owner question in this governance record is now closed.**

---

## B6. Governance Consistency / Audit Check (this pass)

1. **No contradictions found** between COMMERCIAL-PO-16/17, AUTH-PO-30, and any existing AUTH-PO-01–29 or COMMERCIAL-PO-01–15 decision. Each new decision either closes a previously-open question (§B5) or sharpens/completes an existing decision's scope (§B1, §B2) without altering that decision's original content.
2. **No duplicate IDs created.** §B4 confirms five previously-recorded decision families are reconfirmed, not reissued, because their content is unchanged.
3. **No silent modification of existing requirements.** COMMERCIAL-PO-17 and AUTH-PO-30 each explicitly state their relationship to the decisions they sharpen/complete (§B1, §B2) rather than quietly altering COMMERCIAL-PO-05/13 or AUTH-PO-27/29's original text. COMMERCIAL-PO-16 explicitly states it does not supersede COMMERCIAL-PO-09–12 (§B3).
4. **No PO decision was invented.** Only the four decisions given for this round (Q1, Q2, Q3, Q13) were recorded, mapped to three new IDs (COMMERCIAL-PO-16 covers both Q2 and Q13, since both are the same underlying "cancellation out of scope" decision applied to two previously-separate open items).
5. **Scope discipline:** COMMERCIAL-PO-16's development-environment record-removal allowance is consistent with, and does not extend beyond, the scope already established by AUTH-PO-28/COMMERCIAL-PO-14 (dummy development records only; no production data implication).
6. **No implementation authorized.** §17 above ("IMPLEMENTATION IS NOT AUTHORIZED BY THIS AUDIT") is unchanged and applies equally to COMMERCIAL-PO-16, COMMERCIAL-PO-17, and AUTH-PO-30.

---

## B7. Confirmation

- No application code was changed.
- No database schema, migration, or database row was changed, inserted, or deleted.
- No test or fixture was changed.
- No file other than this document was created or changed.
- No commit was made.
- No push was made.
- No deployment was made.

---

# Addendum 3: PCG-3B Launch-Gate Retirement Decision

**Status:** GOVERNANCE / REQUIREMENTS RECORD ONLY. Recorded verbatim from a Product Owner decision resolving the sole new open question raised by `AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md` §20 (PCG-3B / "Tier B" launch-gate redefinition). **No application code, database schema, migration, database row, test, or fixture was created, modified, or deleted in producing this addendum. No commit, push, or deployment was made.** Recording only — no implementation is authorized or implied.

**Date:** 2026-10-10 (same day, later pass than Addendum 2).

---

## C1. New Decision — COMMERCIAL-PO-18 (PCG-3B launch gate: retire, do not redefine)

> **COMMERCIAL-PO-18 — PCG-3B launch gate: OPTION A — RETIRE.** The current environment is development-only. The old one-time `ai_client_acquisition_1499` product is accidental and is being completely removed (COMMERCIAL-PO-05/13/17). PCG-3B is currently tied to that obsolete product/conversion measurement and is retired along with it:
> 1. The old PCG-3B measurement/code tied to the accidental one-time ₹1,499 product is retired.
> 2. Development/test records associated exclusively with that obsolete PCG-3B measurement may be removed.
> 3. PCG-3B is **not** redefined as a new ₹99 → ₹1,499 subscription conversion metric.
> 4. No replacement PCG-3B metric is created unless a future PO decision explicitly requires one.
> 5. This decision does not affect unrelated launch gates or unrelated production data.
> 6. Actual code/data cleanup is **not** authorized by this decision — recording only.

**Relationship to existing decisions:** COMMERCIAL-PO-18 does not conflict with COMMERCIAL-PO-05/13/17 — it **completes** them. Those decisions already required the old SKU's removal from new purchases, dev records, and all customer-facing surfaces; none of them, until now, settled what happens to PCG-3B, which is defined directly on the old SKU's product id (`packages/core-launch-gates/src/pcg3b.ts:7-8`, `combined.ts:10`, `packages/core-launch-gates-validation/src/recompute.ts:32`). COMMERCIAL-PO-18 answers that question by retiring the gate rather than redefining it, and in doing so **fully closes** `AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md` §20's single open question. PCG-3B's sibling gate, PCG-3A ("Tier A", `ai_freelancing_499`), is unaffected — nothing in this decision touches ₹499's existing role in `pcg3.ts`.

**Effect on open items:**
- `AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md` §4, §13 ("UNCERTAIN — PO REVIEW REQUIRED"), §18 Phase 6, §19 (Blocker 1), §20, and §21 are all **resolved by this decision** — see that document's own updated text.
- No replacement metric is commissioned. If a future PO decision wants a ₹99→₹1,499 (or any other) conversion signal, that is a new, separate decision — none is inferred or implied here.

---

## C2. Consistency / Audit Check (this pass)

1. **No contradictions found** between COMMERCIAL-PO-18 and any existing AUTH-PO-01–30 or COMMERCIAL-PO-01–17 decision. It completes COMMERCIAL-PO-05/13/17's scope (old-SKU removal) by settling the one dependent concept (the PCG-3B gate) those decisions did not individually reach.
2. **No duplicate ID created.** PCG-3B retirement had no prior ID; COMMERCIAL-PO-18 is newly assigned, continuing the existing sequence after COMMERCIAL-PO-17.
3. **No silent modification of existing requirements.** COMMERCIAL-PO-18 explicitly states its relationship to COMMERCIAL-PO-05/13/17 (§C1) rather than altering their original text.
4. **No PO decision was invented.** Only the single decision given for this round (retire, not redefine, PCG-3B) was recorded, mapped to one new ID.
5. **Scope discipline:** the development/test-record-removal allowance in §C1 item 2 is consistent with, and does not extend beyond, the scope already established by COMMERCIAL-PO-13/14/AUTH-PO-28 (dummy development records only; no production data implication; no deletion authorized by this recording).
6. **No implementation authorized.** §17 above ("IMPLEMENTATION IS NOT AUTHORIZED BY THIS AUDIT") is unchanged and applies equally to COMMERCIAL-PO-18.
7. **Remaining open PO questions after this decision: none found.** §B5 above already closed every question open as of Addendum 2; this addendum closes the one further question raised by the subsequent implementation-impact audit. No other "PO must decide" / "UNCERTAIN" item was found in that audit beyond the PCG-3B item this decision resolves (see that document's own re-run consistency check for the one phrasing — the marketing-page repoint-vs-remove note in its §4 — which COMMERCIAL-PO-17's existing "REMOVE EVERYWHERE" text already answers and is not a second open question).

---

## C3. Confirmation

- No application code was changed.
- No database schema, migration, or database row was changed, inserted, or deleted.
- No test or fixture was changed.
- No file other than this document and `AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md` was created or changed.
- No commit was made.
- No push was made.
- No deployment was made.

**No code, migration, test, commit, push, or deployment was made in producing this addendum.**
