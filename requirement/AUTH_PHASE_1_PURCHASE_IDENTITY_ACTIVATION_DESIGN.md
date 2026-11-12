# Phase 1 Design — Purchase-First Identity + Secure Activation

**Status: DESIGN ONLY.** No application code, migration, database row, test, or fixture was created, modified, or deleted in producing this document. No commit, push, or deployment was made.

**Date:** 2026-10-10.
**Authorization:** Phase 1 design-only authorization, following Phase 0 (passed). Decision source of truth: AUTH-PO-01→30, as supplied in the authorization and already recorded in `requirement/FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md`. Repository evidence source: this document's own inspection pass (§1), consistent with and extending `requirement/AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md`.
**Non-goals carried over unchanged from the authorization:** no code, no migrations, no data changes, no SKU/PCG-3B deletion, no ₹99/₹499 commercial-model conversion, no ₹1,499 cascade, no cancellation, no webhook-shape changes to K1/contact extraction/masking, no deploy, no commit, no push.

---

## 1. Current State

### 1.1 Identity creation today

- `users` (migration `0012_user_identity`): `id`, `email` (UNIQUE, `CHECK (email = lower(email))`), `created_at`. Migration `0038_claim_tokens_and_account_linkage` adds `password_hash` (nullable — [`0038_claim_tokens_and_account_linkage/migration.sql:26`](packages/db/prisma/migrations/0038_claim_tokens_and_account_linkage/migration.sql)).
- **No row is ever created at checkout today.** `orders` ([`0001_init`](packages/db/prisma/schema.prisma)) has no FK to `users` at all — it is keyed on `customer_email` (denormalized, by design — see the model's own header comment, `schema.prisma:1-11`). A `users` row is created in exactly one place: `apps/web/app/api/auth/signup/route.ts:147`, inside claim-token consumption, after payment.
- `access_tokens.user_id` (migration `0012`) is nullable and overloaded: `NULL` = legacy entitlement credential, `NOT NULL` = an authenticated session. `packages/core-identity/src/session.ts:25-34` (`evaluateSessionToken`) is the enforcement point — a token whose row has `user_id IS NULL` is rejected with reason `'not-a-session'`, never treated as a login.

### 1.2 Current login / session creation

- `POST /api/auth/login` ([`apps/web/app/api/auth/login/route.ts`](apps/web/app/api/auth/login/route.ts)) — email + password, already enumeration-safe (identical generic rejection for unknown email, no-password-set, and wrong password, line 79-84), already rate-limited (`LOGIN_EMAIL_POLICY` + `LOGIN_IP_POLICY`, line 61-63). **This already is AUTH-PO-08's target "normal login" and needs no change.**
- `POST /api/auth/session` ([`apps/web/app/api/auth/session/route.ts`](apps/web/app/api/auth/session/route.ts)) — mints a session from **email alone**: `findUserByEmail` → 404 if absent → `mintUserSession`, **no password check anywhere in this path** (lines 51-70). This is the literal AUTH-PO-11 target.
- `mintUserSession` ([`packages/core-identity/src/session.ts:104-118`](packages/core-identity/src/session.ts)) has no opinion about `password_hash` — it mints for *any* `{id, email}` it is given. The password check, where it exists, is entirely the caller's responsibility (`login/route.ts:79-82`; `signup/route.ts` after creating/hashing one). **`/api/auth/session` is the only caller that skips this check.**

### 1.3 Current claim-token flow (₹99 / ₹499 one-time path)

- `claim_tokens` (migration `0038`, `0039`): `token_hash` (UNIQUE, SHA-256), `order_id` (**NOT NULL**, FK → `orders`, `ON DELETE RESTRICT`), `customer_email` (denormalized at mint time), `expires_at`, `claimed_at` (single-use gate), `invalidated_at` (latest-wins gate, added `0039`).
- Mint + invalidate-previous + send is one call: `issueClaimLink()` ([`packages/core-entitlements/src/claimEmail.ts:196-215`](packages/core-entitlements/src/claimEmail.ts)). The invalidate-previous step lives in the repository, keyed **per `order_id`**: `UPDATE claim_tokens SET invalidated_at = $2 WHERE order_id = $1 AND claimed_at IS NULL AND invalidated_at IS NULL` ([`packages/core-entitlements/src/pgRepository.ts:144-145`](packages/core-entitlements/src/pgRepository.ts)).
- TTL is already 24h (`CLAIM_TOKEN_TTL_MS`, [`claimToken.ts:22`](packages/core-entitlements/src/claimToken.ts)) — matches AUTH-PO-06/21 exactly.
- Consumption: `POST /api/auth/signup { claimToken, password }` ([`apps/web/app/api/auth/signup/route.ts`](apps/web/app/api/auth/signup/route.ts)). Explicitly rejects a request body containing `email` (lines 77-86) — the email is always `verdict.customerEmail`, server-derived from the token. **Existing-account branch (lines 134-144) links the entitlement but does NOT mint a session** — it tells the buyer to log in manually. This is the one place that directly conflicts with AUTH-PO-16/17 (should reuse-and-continue when the account already has a password, not force a second manual step).
- Automatic issuance: the webhook route calls `issueClaimLink` only when `payment.captured` granted an entitlement ([`apps/web/app/api/webhooks/razorpay/route.ts:121-134`](apps/web/app/api/webhooks/razorpay/route.ts)). Manual resend: `POST /api/payments/claim-link/resend { razorpayOrderId }` ([`apps/web/app/api/payments/claim-link/resend/route.ts`](apps/web/app/api/payments/claim-link/resend/route.ts)) — looks the order up by Razorpay order id and **returns 404 for an unknown order, 409 for an unpaid one** (lines 83-108). This is **not** enumeration-safe and must not be the template for the new activation-resend endpoint (§6, §11).

### 1.4 Current ₹1,499 subscription onboarding

- `subscription_periods` (migration `0040`): `user_id` **NOT NULL** (FK → `users`, `ON DELETE CASCADE`), `product_slug`, `razorpay_subscription_id`, `razorpay_payment_id` (UNIQUE — the idempotency anchor), `activation_at`, `duration_days` (snapshotted), `refunded_at`. No `expires_at` column — expiry is computed at read time (`activation_at + duration_days`), per AUTH-PO-26 / already-decided IRL-O.
- `POST /api/payments/create-subscription` ([`apps/web/app/api/payments/create-subscription/route.ts:43-61`](apps/web/app/api/payments/create-subscription/route.ts)) calls `requireUser(identity, token)` **before** any Razorpay interaction — the route's own header says so explicitly ("REQUIRES AN AUTHENTICATED SESSION... unlike create-order's guest-or-session convention"). `createSubscription()` ([`packages/core-payments/src/createSubscription.ts`](packages/core-payments/src/createSubscription.ts)) creates **only** a Razorpay Subscription object — no local DB row — and embeds `userId` into `notes.userId` (line 132), server-derived from the session, never from the request body.
- **Already purchase-first-shaped, unused:** `createSubscriptionRequestSchema` ([`packages/core-payments/src/schemas.ts:53-66`](packages/core-payments/src/schemas.ts)) already accepts `{ customerEmail, customerPhone? }` in the body — the route ignores this for identity purposes today (identity comes from the session), but the shape is exactly what a purchase-first flow needs.
- `subscription.charged` webhook ([`packages/core-payments/src/webhookHandler.ts:345-376`](packages/core-payments/src/webhookHandler.ts)) reads `notes.userId` and **throws, rolling back the whole webhook row,** if it is absent (lines 356-364) — there is no fallback email-based attribution for this path today.

### 1.5 Current email delivery

- `ClaimEmailSender` abstraction ([`packages/core-entitlements/src/claimEmail.ts`](packages/core-entitlements/src/claimEmail.ts)): `ConsoleClaimEmailSender` (dev default — logs JSON), `GmailDevClaimEmailSender` (dev-only real SMTP via a personal Gmail App Password, explicitly refused in production, lines 169-174). `createClaimEmailSender()` throws `EmailProviderNotConfiguredError` for **any other provider name**, and for production with no provider configured at all.
- **No Resend (resend.com) integration exists anywhere in this repository.** The only "resend" hits in the codebase are the unrelated `claim-link/resend` HTTP route name and `CLAIM_LINK_RESEND_*` rate-limit policy identifiers — confirmed by direct inspection, not assumed from the audit. There is no production-grade transactional email provider wired up today; this gap already exists for the current claim-email flow and is **not introduced** by this design.

### 1.6 Current subscription ownership / access computation

- `packages/core-subscriptions/src/access.ts` computes ₹1,499 access by reading `subscription_periods` for the user and computing `activation_at + duration_days` at query time (AUTH-PO-26 already satisfied, unchanged by this design). ₹99/₹499 ownership is `entitlements` rows (`revoked_at IS NULL`), perpetual, no period concept — unchanged by this design (commercial-model conversion is an explicit non-goal).

### 1.7 Where current implementation conflicts with AUTH-PO-01→30

| AUTH-PO | Conflict | Evidence |
|---|---|---|
| 01/14/25/29 | No dormant row, `requireUser()` gates subscription checkout before payment | `create-subscription/route.ts:61` |
| 02/06/07/21 | No activation-token mechanism for subscriptions at all; `claim_tokens` is hard-FK'd to `orders`, which subscription checkout never creates | `0038.../migration.sql:77-78` |
| 04/16/17 | Existing-account branch does not reuse/continue; mints no session | `signup/route.ts:134-144` |
| 09 | Not exercised today (existing-account branch never reaches password logic) — latent, not yet violated | `signup/route.ts:134-144` |
| 11 | Email-only session mint still live, no password check | `auth/session/route.ts:51-70` |
| 07/10 | `claim-link/resend` leaks order-existence (404/409) | `claim-link/resend/route.ts:83-108` |
| 15/18 | No immutable-purchase-email mechanism exists yet (nothing to violate; nothing to rely on either) | — |
| 30 | `claim_tokens`/`signup` route remains the only onboarding path for ₹99/₹499; nothing new exists to retire it in favor of | `signup/route.ts` |

No PO-level conflicts were found between AUTH-PO-01→30 themselves — every row above is an implementation gap, consistent with the prior audit's own finding.

---

## 2. Target Identity Model

**Design principle: two new columns, one new table. No change to `orders`, `entitlements`, or `subscription_periods`.**

| State | Persisted or derived | How it is known |
|---|---|---|
| `PURCHASED` | Derived | An `entitlements` row (99/499) or `subscription_periods` row (1,499) exists for this `user_id` — unchanged existing tables |
| `ACTIVATION_PENDING` | Derived | `users.password_hash IS NULL` — the row exists, nothing more is true yet |
| `EMAIL_VERIFIED` | **Persisted (new)** | `users.email_verified_at IS NOT NULL` — set exactly once, when an `activation_tokens` row for this `user_id` is consumed |
| `ACCOUNT_SETUP_REQUIRED` | Derived | `users.password_hash IS NULL` at the moment an activation token is consumed (the *only* branch condition — see §7) |
| `AUTHENTICATED` | Derived (live) | A valid session (`access_tokens` row, `user_id` set, unexpired, unrevoked) — unchanged `session.ts` semantics |
| `ACTIVE_SUBSCRIPTION` | Derived | ₹1,499: `activation_at + duration_days > now AND refunded_at IS NULL` (unchanged, AUTH-PO-26). ₹99/₹499: `revoked_at IS NULL` (unchanged — commercial model untouched, non-goal) |
| `EXPIRED_SUBSCRIPTION` | Derived | Negation of the above, ₹1,499 only (99/499 have no expiry concept in this phase) |

**Why `email_verified_at` is added, deliberately, even though the prior audit flagged it as "not currently required":** this phase's own requirement (§2, §14 invariant 6) is to state EMAIL_VERIFIED as a checkable fact. Deriving it by scanning `activation_tokens` history for a consumed row is possible but indirect and gets re-derived on every check; a single nullable timestamp, set once, at the one place that can set it, is the cheaper and more auditable choice, and is additive/no-backfill like every other column in this schema's history.

**`subscriptions` / `subscription_periods` / `orders`:** no new table. `subscription_periods` already is the ₹1,499 "subscription" model; `orders`/`entitlements` already are the ₹99/₹499 model. AUTH-PO-29/30's unification is at the **onboarding/activation layer**, not the entitlement-storage layer — conflating the two would be exactly the over-reach the authorization's non-goals forbid (no ₹99/₹499 commercial conversion, no ₹1,499 cascade).

---

## 3. Dormant User Model

- **Created:** at checkout time, inside `createOrder()` and `createSubscription()` (or their callers), via an idempotent `findOrCreate`-by-normalized-email against `users`. Not by the webhook, not by activation.
- **Fields:** `email` (from the checkout body, lowercased — matches the existing `CHECK (email = lower(email))` invariant already enforced on `users`), `password_hash` = `NULL`, `email_verified_at` = `NULL`, `created_at` = now. No `first_name`/`last_name`/`phone`/`date_of_birth` at creation — those are collected only during account setup (§7), never fabricated from Razorpay metadata.
- **`password_hash` is NULL.** This is the entire distinguishing fact between a dormant row and an activated one — no separate `status` column is introduced (`ACCOUNT_SETUP_REQUIRED` is derived, not stored, per §2).
- **How the purchase is associated:** `users.id` is resolved (created or reused) **before** the Razorpay call, and is the value embedded as the owning identity for whatever the webhook later writes — `notes.userId` for the subscription path (already this shape, just currently sourced from a session instead of the dormant row — one-line change in spirit, not in schema), and a `findUserByEmail(order.customerEmail)` lookup inside the `payment.captured` webhook transaction for the one-time path (cheap, unique-indexed, and safe because the row is guaranteed to already exist by the time any webhook fires).
- **How it differs from an authenticated account:** nothing except `password_hash IS NULL` and `email_verified_at IS NULL`. It has the same `id`, same row, same FKs as every other `users` row — this is deliberate (AUTH-PO-25: "this represents the eventual identity"), not a separate shadow table.
- **Can a dormant user log in?** No — `POST /api/auth/login` already requires `credentials.passwordHash != null` to even attempt verification (`login/route.ts:79-80`); a dormant row has no hash, so login correctly falls through to the generic rejection, **unchanged**.
- **Can a dormant user obtain a session another way?** **This is the sharpest risk in this entire design — see §8's dedicated callout.** `POST /api/auth/session` mints a session from **email alone**, with no password check (§1.2). The moment Phase 1's dormant-row mechanism ships, **every email address a visitor merely types into a checkout form becomes a `users` row that `/api/auth/session` can mint a session for, with zero proof of ownership** — this does not merely leave AUTH-PO-11's existing hole open, it **turns every checkout attempt into a free account-takeover primitive** for that email, since no payment or activation is needed to reach the vulnerable endpoint — only a `users` row, which this phase creates unconditionally. **Invariant 17 (§14) and the phase breakdown (§18) treat this as a blocking sequencing dependency, not a follow-on cleanup item.**
- **Existing-account purchases:** if `findOrCreate` finds a row that already has a password, nothing is created or altered at checkout time — the existing `id` is simply reused as the owning identity for this purchase (AUTH-PO-04, AUTH-PO-18: a different email is a different identity, never merged by name/phone/DOB similarity — there is no code path in this design that compares anything but the exact normalized email string).

---

## 4. Purchase Identity Flow

```
1.  Visitor enters purchase email (client-side only — not authoritative)
2.  createOrder() / createSubscription() called with { productId?, customerEmail, customerPhone? }
       → AUTHORITATIVE: server-side findOrCreate(users, email) resolves/creates the dormant row,
         BEFORE any Razorpay call. This is the one and only creation point (AUTH-PO-25).
3.  Razorpay order/subscription created
       → one-time: Razorpay Order (unchanged shape)
       → subscription: Razorpay Subscription, notes.userId = the id resolved in step 2
         (same mechanism as today, §1.4 — just no longer sourced from a session)
4.  Webhook confirms payment
       → payment.captured: AUTHORITATIVE grant of an `entitlements` row, user_id attributed via
         findUserByEmail(order.customerEmail) inside the same transaction
       → subscription.charged: AUTHORITATIVE grant of a `subscription_periods` row, user_id read
         directly from notes.userId (unchanged mechanism, §1.4)
5.  Activation becomes eligible
       → AUTHORITATIVE: isEligibleForActivation(userId, now) — see §5 — becomes true the instant
         step 4's row exists. Nothing new to compute; this reads the same tables step 4 wrote.
6.  Activation email sent
       → AUTHORITATIVE: issueActivationLink() mints + persists (invalidating any prior unconsumed
         token for this user_id) + sends, triggered right after step 4, mirroring the existing
         payment.captured → issueClaimLink() call site (§1.3) — a second, equivalent call site is
         added for subscription.charged, which has no such trigger today.
7.  Token consumed
       → AUTHORITATIVE: POST /api/auth/activation/consume. Hash → lookup → evaluate (unknown /
         expired / already-consumed / superseded) → atomic single-use consume → live re-check of
         isEligibleForActivation(userId, now) (AUTH-PO-21/22 — a token can be structurally valid
         but the subscription it was issued for may have since ended) → set
         users.email_verified_at (AUTHORITATIVE for EMAIL_VERIFIED, exactly once, idempotent to
         set again).
8.  Existing account reused OR account setup
       → AUTHORITATIVE branch, decided by exactly one fact: users.password_hash IS NULL at the
         instant of step 7. NOT NULL → skip straight to step 9, ignore any password field the
         client sent (AUTH-PO-09). NULL → require password + first/last name + phone (+ optional
         DOB) in this same request; hash + persist.
9.  Session created
       → AUTHORITATIVE: mintUserSession(identity, { id, email }) — the existing, unchanged
         primitive (§1.2).
10. Client Finder access
       → unchanged — existing session-gated routes already work once a valid session cookie
         exists.
```

---

## 5. Activation Token Design

**Engineering decision (not a PO decision — see "Key Design Question" resolution below): a new `activation_tokens` table, bound to `user_id`, not a generalization of `claim_tokens`.**

- **Generation:** `randomBytes(32).toString('base64url')` — same primitive as `mintClaimToken()` ([`claimToken.ts:32`](packages/core-entitlements/src/claimToken.ts)), reused, not reinvented.
- **Entropy:** 256 bits, identical to claim tokens and access tokens — no new entropy analysis needed, this repository's existing choice is already generous.
- **Storage format / hashing:** only `SHA-256(token)` is stored (`hashAccessToken`, reused from `accessToken.ts`), identical rationale to every other token table in this repository: a database leak discloses nothing usable.
- **Lookup:** by `token_hash` (UNIQUE index), never by plaintext — the raw token never touches a `WHERE` clause.
- **TTL:** 24 hours (AUTH-PO-06/07/21) — reuses the exact constant shape `CLAIM_TOKEN_TTL_MS` already uses, under a new name (`ACTIVATION_TOKEN_TTL_MS`) so the two are not accidentally coupled if one is ever changed independently.
- **Single-use:** `consumed_at IS NULL` is the atomic consume gate — `UPDATE ... SET consumed_at = $1 WHERE token_hash = $2 AND consumed_at IS NULL AND invalidated_at IS NULL`, identical idiom to `markClaimTokenClaimed` (two concurrent consume attempts can only ever have one winner, decided by the database, not a read-then-write race in the route handler).
- **Latest-token-wins / invalidation:** keyed by `user_id`, not `order_id` (the key architectural departure from `claim_tokens` — see below): `UPDATE activation_tokens SET invalidated_at = $1 WHERE user_id = $2 AND consumed_at IS NULL AND invalidated_at IS NULL`, run every time a new token is minted for that user, inside the same `issueActivationLink()` call (mirrors `issueClaimLink`'s structure exactly, §1.3).
- **Rate limiting:** two policies, mirroring `LOGIN_EMAIL_POLICY`/`LOGIN_IP_POLICY` and `CLAIM_LINK_RESEND_EMAIL_POLICY`/`...IP_POLICY` — one keyed on the normalized email, one on client IP — applied to both the activation-request and activation-consume endpoints (consume needs its own, tighter policy: it is a token-guessing surface, not just a resend-spam surface).
- **Resend behavior:** minting a new token always invalidates every previous unconsumed, non-invalidated token for that `user_id` — there is never more than one *live* token per user at a time, which is exactly AUTH-PO-07's "issuing a new link invalidates the previous link."
- **Generic responses:** the activation-request endpoint returns **the identical response body and status** whether the email is unknown, known-but-ineligible (no purchase, or subscription ended), known-and-eligible, or known-and-already-fully-activated. See §6, §11 for the exact contrast with the existing, non-generic `claim-link/resend` route.
- **Replay behavior:** a consumed or invalidated token presented again hits the same `WHERE consumed_at IS NULL AND invalidated_at IS NULL` guard and fails the same way a never-issued token would — `evaluateActivationToken()` (a pure function, mirroring `evaluateClaimToken()`) returns `{ valid: false, reason: 'already-consumed' | 'superseded' }`, both of which the HTTP layer maps to the same generic rejection as `unknown`/`expired` (no reason-specific message is exposed to the client — unlike `evaluateClaimToken`'s current four-way reason split, which is fine internally but must not leak which specific reason applied, to avoid a timing/enumeration signal between "token never existed" and "token existed but expired").
- **Expired-token behavior:** `expires_at <= now` → same generic rejection.
- **Subscription eligibility check:** `isEligibleForActivation(userId, now)` is evaluated **twice** — once when minting (don't even send a link for an ineligible purchase) and once again when consuming (AUTH-PO-21/22: the subscription may have ended in the 24h window between mint and click). It is a small OR across the two existing access models. **The ₹1,499 leg MUST NOT re-derive its own `subscription_periods` predicate — it calls the Phase 0 shared gate function directly** (required correction, Design Review Finding HIGH-1):
  ```
  isEligibleForActivation(userId, now) =
       (findActiveClientFinderSubscriptionPeriod(deps, userId, now) !== null)
    OR EXISTS (entitlements WHERE user_id = userId AND revoked_at IS NULL)
  ```
  `findActiveClientFinderSubscriptionPeriod` (`packages/core-subscriptions/src/access.ts:37-43`) is the single Phase 0 Client Finder subscription-access decision point — it already resolves `product_slug`, `activation_at`, `duration_days`, and `refunded_at` against the current time, and is the same function `hasClientFinderAccess`, `getClientFinderSubscriptionStatus`, and `unlockOpportunityForOwner` all resolve through. `isEligibleForActivation` must call it rather than writing a parallel `EXISTS` clause over the same table — a fifth independent re-derivation of that predicate would reopen exactly the split-brain risk Phase 0 was built to close. The ₹99/₹499 leg (`entitlements.revoked_at IS NULL`) has no equivalent shared-gate function yet and remains as an inline predicate — there is no Phase 0 precedent to violate there.
  This function does not live inside `core-payments` or `core-subscriptions` exclusively — it is a new, small read-only helper in `core-identity` (or a new `core-activation` module, §9) that calls `findActiveClientFinderSubscriptionPeriod` for the subscription leg and reads `entitlements` directly for the one-time leg, because activation eligibility is explicitly a cross-cutting concern by AUTH-PO-27/29.
- **Identity binding / email binding:** the token is bound to `user_id` **only** — no `customer_email` column on the token itself (a deliberate simplification versus `claim_tokens`, which denormalizes `customer_email` at mint time). The activation target email is always re-read live as `users.email WHERE id = user_id` at send time, which is strictly simpler and cannot drift from the user row, because nothing in this design ever writes to `users.email` after creation (§6).
- **Plaintext storage:** never. The raw token exists only in memory for the duration of one request (mint → build URL → send → discard) and in the recipient's inbox — identical guarantee to `claim_tokens` today.

### Key Design Question — resolved: generalize (A) vs. new mechanism (B) vs. other (C)

**Decision: (B) — a new, separate `activation_tokens` table**, not a generalization of `claim_tokens`. Repository evidence for why:

1. `claim_tokens.order_id` is **`NOT NULL`** with `ON DELETE RESTRICT` ([`0038.../migration.sql:58-78`](packages/db/prisma/migrations/0038_claim_tokens_and_account_linkage/migration.sql)). Generalizing it to support the subscription path means relaxing a constraint that is currently a hard invariant of a table other code already depends on (the resend route keys entirely off `order_id`, §1.3). Relaxing a `NOT NULL` FK on a table with existing relied-upon semantics is itself a nontrivial migration risk, not a simplification.
2. **AUTH-PO-30 says the legacy mechanism is *retired* for new purchases, not evolved.** Reusing the same table (even generalized) for new purchases blurs exactly the line AUTH-PO-30 draws. A new table makes "every new purchase, of any of the three products, mints an `activation_tokens` row; `claim_tokens` is frozen, touched only by whatever legacy, dev-only rows already exist (AUTH-PO-28)" a structural fact, not a convention someone has to remember.
3. Eligibility for activation has **nothing to do with an order row** — it is "does this `user_id` currently hold an active grant," computed against `subscription_periods` and `entitlements` directly (§5's `isEligibleForActivation`). Keeping an `order_id` column on the token, generalized or not, would be dead weight that invites exactly the coupling this design is removing.
4. The dormant-user mechanism (§3) means every purchase already has a `user_id` **before** payment — binding the new token to `user_id` from its very first mint is the natural fit; binding it to `order_id` (or generalizing a column that currently means that) is solving a problem (no `orders` row exists for the subscription path) that `user_id`-binding never has in the first place.

---

## 6. Immutable Purchase Email

- **Binding:** the activation target is `users.email` for the `user_id` the token was minted against — fixed the moment the dormant row is created (§3), from the checkout body's `customerEmail`, server-side, inside the same request that calls Razorpay.
- **No endpoint in this design ever accepts or honors a client-supplied email on an existing identity.** `createOrder`/`createSubscription` accept `customerEmail` only to **resolve** (find-or-create) a `users` row — never to **update** one. There is no "change email" endpoint in scope, and activation-consume (§4 step 7-8) never reads an email from its request body at all — it only ever reads `users.email` by `user_id`, exactly as `signup/route.ts` already refuses an `email` field in its body today (§1.3) for the same reason.
- **A malicious client cannot change the activation email:** there is no write path from any request body to `users.email` anywhere in this design.
- **Cannot substitute another user's email / activate another user's subscription / attach a subscription to an arbitrary `user_id`:** every write that associates a payment with an identity is server-derived —
  - subscription path: `notes.userId` is set server-side from the dormant row resolved at checkout (§3), never read from the client at webhook time; the webhook **throws and rolls back** if it is absent (`webhookHandler.ts:356-364`, unchanged mechanism).
  - one-time path: the webhook resolves `user_id` via `findUserByEmail(order.customerEmail)`, where `order.customerEmail` is itself server-held (the `orders` row, written at `createOrder()` time from the same server-validated body, never re-read from any later client request).
  - activation consume: operates on `user_id` resolved from the **token**, never from anything the client asserts in the consume request.
- **Where server-side ownership is established:** three points, all server-only — (1) checkout's `findOrCreate(users, email)` (§3), (2) the webhook's attribution of a payment to that `user_id` (§4 step 4), (3) the activation token's binding to that same `user_id` at mint time (§5). A client never supplies a `user_id` at any of these three points; it only ever supplies an email, which is used purely as a lookup/creation key, never trusted as an assertion of identity by itself (consistent with AUTH-PO-14's explicit instruction not to "simply remove authentication... and trust a client-provided userId/email" — this design trusts the email only as far as "mint a token and email it there," which is the same trust model `claim_tokens` already uses safely today).

---

## 7. Existing Account Behavior

| Case | Behavior |
|---|---|
| A. Existing account + password | Checkout reuses the existing `id` (no new row). Activation link still sent and still consumed once (proves the purchaser owns this specific email for this specific purchase) — but consuming it **skips** password/profile setup entirely (AUTH-PO-16/17) and goes straight to session mint. Any password field present in the consume request body is **ignored**, never hashed, never written (AUTH-PO-09). |
| B. Existing account + `password_hash` NULL | Same dormant-row shape this design already produces for a brand-new purchaser. Checkout reuses the existing `id`. Activation-consume requires password + profile setup (§4 step 8, NULL branch) — identical path to a first-time purchaser, because the row's state is identical to one. |
| C. No `users` row | Checkout's `findOrCreate` creates one (§3). Everything else is case B from that point on. |
| D. Existing account with unrelated active products | No special handling needed — `isEligibleForActivation` (§5) is an OR across products; owning product X does not change how activation for product Y behaves. Checkout for a second product reuses the same `id` (same email ⇒ same row, by construction). |
| E. Existing account already has another subscription | Same as D — a second `subscription_periods` row is created by the webhook exactly as today (no uniqueness conflict, confirmed §1.4/`0040` schema — only `razorpay_payment_id` is unique, not `(user_id, product_slug)`). Activation is per-`user_id`, not per-subscription, so one activation covers every product the user holds. |
| F. Same email buys again | Checkout's `findOrCreate` resolves the same `id`; a second purchase of the same product is handled exactly as it is today (idempotent `entitlements.grant`, or an independent `subscription_periods` row per the existing renewal/independent-period model) — unchanged by this design. |
| G. Different email buys separately | A different normalized email string ⇒ a different `users` row, by construction of `findOrCreate` — no merge logic exists anywhere in this design, satisfying AUTH-PO-18 by the absence of any code path that could do otherwise, not by a check that prevents one. |

**No code in this design compares name, phone, DOB, or any other similarity signal between two `users` rows.** The only identity key anywhere in this flow is the normalized email string, and the only thing it does is resolve-or-create exactly one row.

---

## 8. Authentication Security

This design eliminates, or explicitly does not yet eliminate (flagged):

- **Email-only login:** `POST /api/auth/session` is unchanged *by this phase* (its removal is explicitly out of scope — "Do NOT implement that retirement yet," per the authorization). **This is why §3's dormant-user mechanism is dangerous to ship ahead of it — see the callout below.**
- **Account takeover via activation:** impossible to reach another user's account through activation, because the token is bound to `user_id` server-side at mint time (§5, §6) and the only branch that sets a password requires `password_hash IS NULL` at consume time (§7 case A explicitly skips password-setting) — an attacker who obtains someone else's valid activation link can, at most, prove they received an email sent to that address, which they cannot do without compromising the mailbox.
- **Enumeration:** the activation-request endpoint returns one generic response regardless of email existence/eligibility/already-activated state (§5, §11) — unlike the existing `claim-link/resend` route (§1.3), which this design does not touch but also does not use as a template.
- **Activation-token replay:** `consumed_at`/`invalidated_at` guards, atomic UPDATE, same idiom as `claim_tokens` (§5).
- **Token substitution / identity substitution:** tokens are bound to `user_id` at mint time and never re-bindable (§5, §6).
- **Client-controlled `userId`:** no endpoint in this design accepts a `userId` from a request body; every identity resolution is email-lookup (checkout) or token-lookup (activation) or session-cookie (everything post-login) (§6).
- **Cross-account activation:** not possible — see §7 case A/B, §6.

**Critical sequencing risk (restated from §3): shipping the dormant-user mechanism (AUTH-PO-25) before AUTH-PO-11 is implemented, or before an equivalent minimal guard is added to `/api/auth/session`, directly arms that endpoint.** Today, `/api/auth/session` can only mint a session for an email that already has a `users` row — which today requires having *already completed a claim* (i.e., already paid and already set a password, since `signup/route.ts` is the only current row-creation path). Once checkout alone creates a `users` row for **any** email a visitor types in, with no payment and no verification required, `/api/auth/session` becomes mintable for that email with **zero cost to an attacker** — they do not even need to run a real checkout to completion; starting one is enough to create the row. **This is a strictly worse version of the exact bug AUTH-PO-11 already names**, and it is created by this design's own §3, not by anything pre-existing. The phase breakdown (§18) treats closing this gap — at minimum, rejecting `password_hash IS NULL` rows in `/api/auth/session`, short of full retirement — as a hard prerequisite of implementing §3, not a nice-to-have.

---

## 9. ₹99 / ₹499 / ₹1,499 Unification

```
purchase (any of the 3 products)
   → findOrCreate(users, email)              [identical code path, all 3 products — §3]
   → product-specific grant on webhook        [unchanged: entitlements for 99/499, subscription_periods for 1,499]
   → isEligibleForActivation(userId, now)     [one function; ₹1,499 leg calls Phase 0's
                                                 findActiveClientFinderSubscriptionPeriod,
                                                 ORs with the ₹99/₹499 entitlements check — §5]
   → issueActivationLink(userId)              [identical code path, all 3 products]
   → activation_tokens, 24h TTL, user_id-bound [one table, all 3 products]
   → consume → email_verified_at + session    [identical code path, all 3 products]
```

The unification is entirely in the **onboarding/activation layer** — one `findOrCreate`, one token table, one eligibility check, one consume endpoint, used identically regardless of which product triggered it. The **entitlement/grant layer stays exactly as fragmented as it is today** (`entitlements` vs. `subscription_periods`) because unifying *that* is a commercial-model decision (COMMERCIAL-PO-01 et al.), explicitly out of scope here. `isEligibleForActivation`'s shape — delegating the ₹1,499 leg to Phase 0's shared gate and ORing it with the ₹99/₹499 entitlements check — is the seam that lets the activation layer be unified without requiring the grant layer to be, and without introducing a second decision point for Client Finder subscription access alongside Phase 0's.

No entitlement, price, or duration semantics change for any of the three products.

---

## 10. Database Design

| Change | Table | Detail |
|---|---|---|
| New column | `users` | `password_hash` — already exists (migration 0038), no change |
| New column | `users` | `email_verified_at TIMESTAMP(3) NULL` — set once, by activation-consume only |
| New column | `users` | `first_name TEXT NULL`, `last_name TEXT NULL`, `phone TEXT NULL`, `date_of_birth DATE NULL` — all nullable, all written only by account-setup (§4 step 8, NULL branch); never fabricated, never required for an existing-account-with-password activation (§7 case A) |
| New table | `activation_tokens` | `id` (PK), `token_hash` (UNIQUE), `user_id` (**NOT NULL**, FK → `users`, `ON DELETE CASCADE` — mirrors `subscription_periods`' FK shape, not `claim_tokens`' `RESTRICT`, since a deleted user's pending activation has nothing left to protect), `created_at`, `expires_at`, `consumed_at NULL`, `invalidated_at NULL` |
| Index | `activation_tokens` | `UNIQUE(token_hash)` (lookup), `INDEX(user_id)` (invalidate-previous, eligibility re-check) |
| Constraint | `activation_tokens` | `CHECK (expires_at > created_at)` — same idiom as `claim_tokens`/`access_tokens` |
| No change | `orders` | Stays keyed on `customer_email`, no FK to `users` — the one-time webhook resolves `user_id` by lookup, not by a new column (§3) |
| No change | `entitlements` | Already has nullable `user_id` (migration 0038) |
| No change | `subscription_periods` | Already has `NOT NULL user_id` (migration 0040) — already the dormant-row-compatible shape |
| No change | `claim_tokens` | Frozen for new purchases (AUTH-PO-30); untouched, including its existing `order_id NOT NULL` FK |

No cancellation columns. No credit/ledger tables. No new table beyond `activation_tokens`. All changes additive, no backfill (every new column is nullable; `activation_tokens` is a wholly new, empty table) — consistent with every migration already in this repository's history.

---

## 11. API Design

| Endpoint | Auth | Input | Identity source | Response | Security |
|---|---|---|---|---|---|
| `POST /api/payments/create-order` (existing, extended) | Unauthenticated | `{ productId, customerEmail, customerPhone? }` (unchanged schema) | **New:** server-side `findOrCreate(users, customerEmail)` added before the Razorpay call | Unchanged | Unchanged guest-checkout convention; email is a lookup/creation key only (§6) |
| `POST /api/payments/create-subscription` (existing, changed) | **Unauthenticated** (removes `requireUser()`) | `{ customerEmail, customerPhone? }` (schema already supports this, §1.4) | Server-side `findOrCreate(users, customerEmail)`, same as create-order | Unchanged shape | `notes.userId` now sourced from the dormant row instead of a session — same server-derived guarantee (§6) |
| `POST /api/auth/activation/request` (new) | Unauthenticated | `{ email }` | `findUserByEmail` (not revealed in response) | **Always identical** `202`-style body, regardless of unknown/ineligible/already-activated/eligible | Rate-limited by email + IP (new policies, mirroring `LOGIN_EMAIL_POLICY`/`CLAIM_LINK_RESEND_EMAIL_POLICY`); never discloses which branch was taken (§5, §8) — explicitly fixes the leak pattern in the existing `claim-link/resend` route (§1.3), which this endpoint does not call or extend |
| `POST /api/auth/activation/consume` (new) | Unauthenticated (bearer is the token itself) | `{ token, password?, firstName?, lastName?, phone?, dateOfBirth? }` — **no `email` field accepted, same protocol-violation rejection as `signup/route.ts:77-86`** | Token hash → `user_id` | `200`/`201` with session cookie set, or one generic rejection for unknown/expired/consumed/superseded/now-ineligible | Rate-limited by IP (token-guessing surface); re-checks `isEligibleForActivation` live (§5); branches on `password_hash IS NULL` only (§7); never overwrites an existing hash (AUTH-PO-09) |
| `POST /api/auth/login` (existing) | Unauthenticated | `{ email, password }` | Unchanged | Unchanged | Already correct (§1.2) — no change |
| `POST /api/auth/session` (existing) | Unauthenticated | `{ email }` | Unchanged **in this phase** | Unchanged | **Flagged, not fixed, in this phase** — see §8's callout. Retirement is explicitly deferred (non-goal), but shipping §3 without at least neutralizing this route for `password_hash IS NULL` rows reopens a worse version of AUTH-PO-11 |
| `POST /api/payments/claim-link/resend` (existing) | Unauthenticated | Unchanged | Unchanged | Unchanged | **Left as-is for legacy/dev-only ₹99/₹499 `claim_tokens` rows** (AUTH-PO-30 scoping, AUTH-PO-28 dev-data classification) — not merged with or replaced by the new activation-request endpoint |

No endpoint in this design accepts `userId` from a request body. No endpoint accepts `email` on an authenticated or token-bearing request.

---

## 12. Email Design

- **Activation email:** new template, parallel structure to the existing claim email (`GmailDevClaimEmailSender.send`, [`claimEmail.ts:110-120`](packages/core-entitlements/src/claimEmail.ts)) — states the activation URL, its exact expiry timestamp, and that it is single-use. Does not state which product triggered it beyond what's needed for the buyer to recognize the purchase (no new PII surfaced).
- **Activation URL:** `${APP_BASE_URL}/activate/${token}` (mirrors `buildClaimUrl`'s shape exactly, [`claimEmail.ts:184-186`](packages/core-entitlements/src/claimEmail.ts), new path segment so the two flows are never confusable).
- **Expiry:** 24h, stated in the email in absolute ISO form (same as the existing claim email).
- **Resend:** via the new generic `POST /api/auth/activation/request` (§11) — not the existing `claim-link/resend` route.
- **Invalidation:** automatic, on every new mint for the same `user_id` (§5) — the email itself should say "if you requested multiple links, only the most recent one will work," matching the existing claim email's spirit.
- **Existing email infrastructure reused as-is:** the `ActivationEmailSender` interface is a near-identical sibling of `ClaimEmailSender` (same `send({ to, url, expiresAt })` shape) — reusing `ConsoleActivationEmailSender`/`GmailDevActivationEmailSender`-equivalents built the same way as their claim-email counterparts, not a new transport mechanism.
- **Production provider:** the eventual production provider is already decided (AUTH-PO-12: Resend) — **not wired up here** (per the authorization's own instruction not to invent provider configuration values). The existing `EmailProviderNotConfiguredError` gap (§1.5) — no real transactional provider configured — applies equally to activation email and is **not** this design's problem to solve; it is a pre-existing gap this phase inherits, unchanged.
- **Development behavior:** identical to today's claim-email dev behavior — console logging by default, or real Gmail SMTP if `EMAIL_PROVIDER=gmail-dev` is set.
- **Production behavior:** identical gap to today's — a production boot with no provider configured throws at send time, exactly as the claim-email path already does. This phase does not close that gap, by design (non-goal: no provider configuration invented).

---

## 13. State / Sequence Diagrams

**NEW CUSTOMER**
```
visitor --email--> createOrder/createSubscription
                       --> findOrCreate(users) [dormant row, password_hash=NULL]
                       --> Razorpay object created (userId embedded server-side for subscription;
                           resolved by email lookup at webhook time for one-time)
                       --> webhook confirms payment --> grant (entitlements | subscription_periods)
                       --> isEligibleForActivation = true --> issueActivationLink --> email sent
visitor <--click-- activation link
visitor --token--> consume --> re-check eligibility (still true) --> email_verified_at set
                       --> password_hash IS NULL --> require password+profile --> hash+persist
                       --> mintUserSession --> session cookie
visitor --> Client Finder (session-gated routes, unchanged)
```

**EXISTING ACCOUNT**
```
visitor --email (matches existing users row with password_hash set)--> createOrder/createSubscription
                       --> findOrCreate resolves EXISTING id, nothing created
                       --> webhook confirms payment --> grant attributed to existing id
                       --> issueActivationLink --> email sent
visitor --token--> consume --> re-check eligibility (true) --> email_verified_at set
                       --> password_hash IS NOT NULL --> SKIP password/profile entirely,
                           any password field in the request body is ignored
                       --> mintUserSession --> session cookie
visitor --> Client Finder
```

**EXPIRED SUBSCRIPTION**
```
users row exists, password_hash IS NULL (never activated), subscription_periods row's
activation_at + duration_days <= now, no other active grant
visitor requests a new activation link (or clicks an old, still-24h-valid one)
   --> isEligibleForActivation(userId, now) = false
   --> activation/request: generic response returned (identical to any other case, §5/§11) —
       no new token minted
   --> activation/consume (if an old unexpired token is somehow still presented):
       re-check at consume time also returns false --> generic rejection, no session minted
```

**RENEWAL WITHOUT ACTIVATION**
```
users row, password_hash IS NULL, subscription continues to renew
   --> each subscription.charged creates a new, independent subscription_periods row
       (unchanged existing mechanism, IRL-C) — no activation step is required for renewal to
       proceed, and none is triggered by renewal itself
   --> isEligibleForActivation(userId, now) stays true for as long as ANY period (initial or
       renewed) is currently active
   --> the customer may request activation at any point while eligible, even months after the
       original purchase (AUTH-PO-21) — nothing about renewal timing changes this
```

---

## 14. Security Invariants

Implementation tests MUST enforce (1-16 as specified in the authorization, verbatim; 17 added from repository evidence found in this design pass, §3/§8):

1. Email alone never creates a session.
2. Dormant users cannot authenticate.
3. Activation token is single-use.
4. Previous activation token becomes invalid after resend.
5. Activation token expires after 24h.
6. Activation is bound to the purchase email.
7. Activation requires eligible active subscription.
8. Expired subscription cannot activate.
9. Renewal does not require prior activation.
10. Existing password is never overwritten.
11. Existing `users.id` is reused.
12. Duplicate users are never created for the same email.
13. Client cannot choose `users.id`.
14. Client cannot change purchase email.
15. Cross-account activation is impossible.
16. Unauthenticated requests do not reveal account/purchase existence.
17. **A `users` row with `password_hash IS NULL` must be rejected by every session-minting path, including the pre-existing `POST /api/auth/session` — this invariant must hold BEFORE the dormant-user mechanism (AUTH-PO-25) is implemented, not after, because it is the dormant-row mechanism itself that makes an attacker-chosen email reach a `users` row for the first time without any payment (§3, §8).**

---

## 15. Test Plan

Unit:
- `evaluateActivationToken` — unknown / expired / already-consumed / superseded / valid (mirrors `evaluateClaimToken`'s existing test shape).
- `isEligibleForActivation` — active subscription only, active entitlement only, both, neither, refunded period, revoked entitlement, period that has lapsed by duration.
- `mintUserSession` unchanged-behavior regression (still mints for any `{id, email}` — this function is NOT where invariant 17 is enforced; it is enforced in the route layer).
- `findOrCreate(users, email)` — creates when absent, returns existing `id` unchanged when present (no field overwritten on an existing row).

Integration / API:
- New customer: checkout → webhook → activation request → consume → session minted, profile fields persisted.
- Existing account + password: checkout → webhook → activation consume → session minted, **no password/profile fields written, existing hash byte-for-byte unchanged**.
- Existing account, `password_hash` NULL (a second purchase before the first was ever activated): checkout reuses `id`, no duplicate row, one eligible-and-current token wins.
- Wrong token: consume with an unrelated valid-shaped token → generic rejection.
- Expired token: consume after `expires_at` → generic rejection.
- Reused (already-consumed) token: second consume attempt → generic rejection, no second session.
- Old token after resend: request a new link, then attempt to consume the old one → generic rejection (`superseded`).
- Changed-email attempt: consume request body containing an `email` field → rejected outright (protocol violation, same shape as `signup/route.ts`).
- Wrong `users.id` attempt: no endpoint accepts one — test that a crafted body field named `userId`/`id` is ignored or rejected, not silently honored.
- Expired subscription: purchase, let the period lapse, request activation → generic ineligible response; attempt consume of an old still-unexpired-by-TTL token → generic rejection.
- Active subscription: standard happy path (covered above).
- Renewal before activation: two `subscription.charged` events, no activation in between → both periods persist, activation still succeeds afterward using either period as eligibility evidence.
- Duplicate purchase: same email, same product, twice → one `users` row, idempotent grant (unchanged existing behavior), activation unaffected.
- Different email: two separate purchases under two emails → two separate `users` rows, confirmed never merged.
- Enumeration attempts: activation/request with a known-ineligible email, an unknown email, and a known-already-activated email → **byte-for-byte identical response** across all three (status, headers, body) — this is the one test category most worth being paranoid about, since a subtle timing or shape difference is the usual way this kind of guarantee quietly breaks.
- Email-only session attempt: `POST /api/auth/session` against a freshly-created dormant row (created via a checkout that never completed payment) → must be rejected (invariant 17) — **this test should be written and should FAIL against the current `/api/auth/session` implementation until invariant 17's guard is added**, which is the explicit point of flagging it in §8/§14 rather than silently assuming it already holds.
- Dormant-user login attempt: `POST /api/auth/login` against a dormant row → generic rejection (already covered by existing `login/route.ts` behavior, §1.2 — regression test only).
- Existing password preservation: covered above (existing account + password case).

E2E: none exist today for checkout/auth/subscription flows (confirmed, prior audit §16) — this is new test surface entirely, to be built alongside the eventual implementation, not retrofitted onto anything existing.

---

## 16. Migration / Rollout Plan

- All schema changes (§10) are additive, nullable, no backfill — safe to apply to the current development database without touching any existing row.
- AUTH-PO-28 (existing password-less/dummy development accounts may be removed) applies to the **current** dev dataset, independently of this design — this design does not require that cleanup as a precondition, since every new column/table it introduces is additive and does not conflict with any existing row's shape.
- No production migration compatibility concern exists yet, because nothing is implemented or deployed from this document.
- **Not performed here:** no migration file was written, no `prisma migrate dev` or equivalent was run, no database row was touched. This section describes what a future, separately-authorized implementation would do.

---

## 17. Implementation Phase Breakdown

Sequencing only — **not an authorization to begin any phase.**

| Phase | Purpose | Files/Tables | Dependencies | Tests | Completion criteria |
|---|---|---|---|---|---|
| 1a | **Neutralize `/api/auth/session` for dormant rows** (invariant 17) — minimal guard: reject when `password_hash IS NULL` | `auth/session/route.ts` | None | New regression test (§15, "email-only session attempt") | Guard lands and test passes **before** 1b ships |
| 1b | Dormant-row creation at checkout | `createOrder.ts`, `createSubscription.ts`, `create-subscription/route.ts` (remove `requireUser()`) | 1a | `findOrCreate` unit tests | Checkout creates/reuses a `users` row with no password, no session minted |
| 2 | Webhook attribution to dormant row | `webhookHandler.ts` (`payment.captured` branch: add `findUserByEmail` lookup; `subscription.charged` branch: source `notes.userId` from 1b instead of session) | 1b | Webhook attribution tests | Both grant paths attribute to the correct `user_id` with no client-controlled identity input |
| 3 | `activation_tokens` table + core primitives | New migration, `mintActivationToken`/`evaluateActivationToken`/`issueActivationLink` (new module, mirroring `claimToken.ts`/`claimEmail.ts`) | 2 | Unit tests (§15) | Primitives tested in isolation against a fake repository |
| 4 | Activation request/consume endpoints | `POST /api/auth/activation/{request,consume}` | 3 | Integration/API tests (§15) | Full new-customer and existing-account flows pass end-to-end against a test database |
| 5 | Account-setup fields on `users` | Migration adding `email_verified_at`, `first_name`, `last_name`, `phone`, `date_of_birth` | Can land alongside Phase 3's migration | Schema test only | Columns exist, nullable, no backfill required |
| 6 | Subscription-path activation trigger | New call site in the `subscription.charged` webhook flow, equivalent to the existing `payment.captured → issueClaimLink` call site | 2, 3 | Webhook+activation integration test | A ₹1,499 purchase now receives an activation email exactly once per eligible period |

Explicitly **not** in this phase breakdown (future, separately authorized): retiring `/api/auth/session` entirely (AUTH-PO-11's full scope, beyond 1a's minimal guard), any ₹99/₹499 commercial-model change, any ₹1,499 cascade, any old-SKU removal, any cancellation mechanism, any production email provider selection.

---

## 18. Risks / Open Engineering Questions

1. **(Resolved by this design, flagged as the top sequencing risk):** dormant-row creation ahead of neutralizing `/api/auth/session` — see §8, §14 invariant 17, §17 Phase 1a. Not a new PO question (AUTH-PO-11 already decided the endpoint must go; this design only establishes that a minimal guard must land *before* §3, not simultaneously with its full retirement).
2. **Email delivery provider gap** (§1.5, §12) is pre-existing and unaffected by this design either way — flagged so it is not mistaken for something this phase was supposed to close.
3. **Rate-limit policy naming/tuning** for the two new endpoints (§5, §11) is an engineering detail (exact thresholds), not a PO question — existing policies (`LOGIN_EMAIL_POLICY`, `CLAIM_LINK_RESEND_EMAIL_POLICY`) are precedent for shape, not necessarily for exact numbers.
4. **`isEligibleForActivation`'s home package** (§5, §9) — `core-identity` vs. a new small `core-activation` module. Pure engineering/placement choice; either reads `entitlements` and `subscription_periods` the same way, and does not affect any PO decision.

No PO decision is missing. Every item above is either already resolved by an existing AUTH-PO (and restated here only because repository evidence changes *how* to sequence it, not *whether*), or a pure implementation-placement choice with no commercial or security consequence either way.

---

## Final Report

**PHASE 1 DESIGN STATUS:**

**PASS — design complete and ready for PO/engineering review**

One sequencing risk was found during this design pass that was not visible from the PO decisions alone: implementing the dormant-user mechanism (AUTH-PO-25) without first closing even a minimal version of AUTH-PO-11's gap in `POST /api/auth/session` would make that endpoint strictly more dangerous than it is today, because checkout would start creating `users` rows for arbitrary, unverified emails with no payment required. This is captured as Security Invariant 17 and as a hard-ordered Phase 1a in §17, ahead of dormant-row creation itself. No other blocker was found; no PO decision is missing or contradicted.

No application code, migration, database row, test, or fixture was created, modified, or deleted in producing this document. No commit, push, or deployment was made. The next step after this report is a separate, explicit implementation authorization.
