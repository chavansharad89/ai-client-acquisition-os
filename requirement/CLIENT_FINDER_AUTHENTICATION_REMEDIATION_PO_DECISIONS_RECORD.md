# Client Finder Authentication Remediation — Product Owner Decisions Record (AUTH-PO-01 → AUTH-PO-24)

**Status:** PO decisions recorded as authoritative below, verbatim. This is a decision record plus a read-only implementation-impact/consistency review. **No code, migration, requirement, commit, push, or deployment has been made.**

**Addendum (2026-10-10, same day, later pass):** AUTH-PO-14 through AUTH-PO-24 were added below in §1B. They are new identifiers — confirmed by repo-wide search to not collide with any existing use of `AUTH-PO-14` through `AUTH-PO-24` (the questionnaire referenced in the note below only defines `AUTH-PO-01`..`AUTH-PO-13`). §1 (AUTH-PO-01 → 13) is unchanged from the original pass. §2B/§3B/§7B below are net-new consistency findings for the addendum; §2–§7 (original) are left as originally written.

**Relationship to prior document:** `requirement/CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISION_QUESTIONNAIRE.md` (created earlier today from the Authentication Architecture Audit) posed 13 open questions, also numbered `AUTH-PO-01` through `AUTH-PO-13`, with Part 3 left blank for the PO to fill in. **The PO decisions below do not fill in that table — see "ID Collision" under Decision Consistency Result.** This document is the authoritative decision record for the 13 decisions as the PO actually stated them; it supersedes the questionnaire's Part 2 options wherever they address the same ground, and leaves the questionnaire's Part 3 table un-completed, flagged explicitly rather than silently resolved.

---

## 1. PO Decision Record (verbatim, authoritative)

### AUTH-PO-01 — Purchase-first activation flow
A genuinely new ₹1,499 Client Finder customer does NOT create an account before payment.
Journey: (1) enter email → (2) proceed to ₹1,499 checkout → (3) complete payment → (4) system sends activation email to the exact purchase email → (5) customer clicks activation link → (6) email ownership verified → (7) customer completes signup/profile → (8) account/session established → (9) customer enters Client Finder.
Payment and account activation are separate states.

### AUTH-PO-02 — Email verification
Email is verified ONLY by successful consumption of the secure, single-use activation link sent to the exact purchase email. Entering an email, paying, filling a signup form, or supplying an order/payment ID do NOT constitute verification. The activation token must be secure, time-limited, single-use, and server-associated with the correct purchase/account.

### AUTH-PO-03 — Signup/profile fields
After verification, collect: **Required** — email (verified, pre-populated, read-only/locked), first name, last name, phone number, password, confirm password. **Optional** — date of birth. DOB must not be required.

### AUTH-PO-04 — Existing account reuse
If the verified email already has a `users` record, ALWAYS reuse it. Never create a duplicate `users` record for the same email.

### AUTH-PO-05 — Existing entitlements
When an existing user buys the new ₹1,499 subscription: existing ₹99 / ₹499 / one-time-₹1,499 entitlements remain untouched; the new subscription attaches to the same `users.id`; no entitlement is replaced, merged incorrectly, deleted, or duplicated. Product isolation remains intact.

### AUTH-PO-06 — Unactivated paid customer
A successful ₹1,499 payment stays valid even if the customer never activates. Payment-successful / email-verification-pending / activation-pending are conceptually separate states. Customer can request another activation email. Links expire after 24 hours, are single-use, and a newly issued link invalidates the previous one. Failure to activate does NOT auto-cancel/reverse the payment.

### AUTH-PO-07 — Activation resend
Must return a generic response, not reveal whether an email has an account/purchase/pending activation, issue a new link where an eligible pending activation exists, invalidate the previous link, use 24-hour validity, and apply rate limiting. Example: *"If an eligible activation request exists, we've sent an activation link to your email."*

### AUTH-PO-08 — Normal future login
After activation, normal login is EMAIL + PASSWORD → authenticated session, using the existing secure password mechanism. The activation link is NOT the normal login mechanism.

### AUTH-PO-09 — Existing account without password
If the verified email belongs to an existing `users` account with `password_hash IS NULL`: allow setting a password during activation/setup; do not create another account. If the account already has a password: do NOT overwrite it merely because of this purchase/activation — preserve the existing credential.

### AUTH-PO-10 — Enumeration prevention
Unauthenticated account/activation-related requests must use generic responses. The system must not reveal via API response whether an email has an account, a purchase, or a pending activation. The customer learns the result through email, not through an informative API response.

### AUTH-PO-11 — Disable unsafe email-only session endpoint
`POST /api/auth/session`'s email-only authentication path must be permanently disabled/removed. It must no longer be possible to mint a session using only a supplied email. Normal login must use the secure password-based flow. The current behavior must NOT be preserved for compatibility. This is security-critical remediation.

### AUTH-PO-12 — Production email provider
Use **Resend** as the production transactional email provider, supporting activation, activation resend, password recovery/reset, and other future critical auth/account email. Preserve an email abstraction so the provider can change later.

### AUTH-PO-13 — One unified account login
End-state: ONE account per customer/email → ONE authentication model → ONE login experience → product-specific access/entitlements determine what a customer can reach, not which login page they use. The current separate Client Finder / general login surfaces must NOT become two permanent authentication systems. No permanent Client Finder-specific authentication model is to be introduced.

---

## 2. Decision Consistency Result: **CONFLICTS FOUND**

All 13 decisions are internally coherent with each other. Two classes of conflict exist against the *existing, already-implemented* system (not between the decisions themselves):

### Conflict 1 (critical) — AUTH-PO-01 vs. the already-shipped ₹1,499 subscription checkout precondition
`POST /api/payments/create-subscription` (`apps/web/app/api/payments/create-subscription/route.ts:44-45`) calls `requireUser(identity, token)` and returns 401 if there is no authenticated session — **before** it will even talk to Razorpay. `packages/core-payments/src/createSubscription.ts:14-26` documents this explicitly as a deliberate engineering decision: *"REQUIRES AN AUTHENTICATED SESSION... This follows directly from the data model migration 0040 already fixes: `subscription_periods.user_id` is NOT NULL... so a subscription period cannot be created without a real user_id at the moment of the activating webhook... a visitor reaching the 'Subscribe' action is already expected to be signed in."* Migration `0040_subscription_periods` enforces `user_id TEXT NOT NULL` at the database level.

AUTH-PO-01 requires the opposite for a genuinely new customer: email → checkout → payment, with **no account and no session yet**. Today's code cannot reach checkout at all without a pre-existing session. This is a direct, explicit conflict between the new PO decision and the current (committed, `b3f1827`) subscription architecture — not a matter of adding new code around existing code, but of changing a precondition and a NOT NULL constraint that the existing webhook attribution path (fact: `notes.userId` set server-side at subscription-creation time, verified by HMAC at webhook time — this part is correct and *not* in conflict) currently depends on.

This does **not** affect: the webhook's HMAC signature verification, the "never trust client/webhook-body `userId`" rule, or `subscription_periods.razorpay_payment_id` idempotency — those stay correct and are a separate mechanism from the precondition in conflict.

**Clarification needed (flagged below as a NEW PO QUESTION, not decided here):** closing this conflict requires either (a) deferring `subscription_periods.user_id` population to webhook time via a lookup/creation keyed by the activation record instead of `notes.userId` set at creation, or (b) creating an unverified, password-less, placeholder `users` row at email-entry time (before payment), with full profile completed only at activation. Option (b) raises a definitional question: does AUTH-PO-01's "does NOT create an account before payment" mean *no `users` row of any kind* pre-payment, or *no login-capable/verified account*? The text as given is literal ("does not create an account before payment") and (b) would create a row, even if dormant — this is a product-definition question, not an engineering one, and is NOT resolved here.

### Conflict 2 (record-keeping) — ID collision with the existing questionnaire
`requirement/CLIENT_FINDER_AUTHENTICATION_REMEDIATION_PO_DECISION_QUESTIONNAIRE.md` already uses `AUTH-PO-01` through `AUTH-PO-13` as identifiers for 13 **different, though related, open questions** (e.g., questionnaire `AUTH-PO-01` asks "should Client Finder use password authentication," with options A/B/C; questionnaire `AUTH-PO-05` asks "what happens to existing password-less ₹99/₹499/one-time-₹1,499 users," with options A/B/C). The new decisions reuse the same 13 identifiers for different content. They are not a 1:1 renumbered match — see the impact matrix below for the actual mapping. Left as-is, two documents in the same `requirement/` directory now use `AUTH-PO-0X` to mean two different things, which will confuse any future reader or audit trail. **This is flagged, not silently resolved**: the questionnaire's Part 3 decision table has deliberately been left blank rather than filled in with mismatched answers. Recommend the PO or engineering lead choose a disambiguating scheme (e.g., rename this record's items `AUTH-REMEDIATION-DEC-01..13`, or mark the questionnaire's Part 2 as superseded/closed) — this choice is listed under New PO Questions, not decided here.

### Non-conflicts confirmed
- AUTH-PO-04, AUTH-PO-09's "reuse existing account, never duplicate, never overwrite an existing password" matches the already-implemented claim-token signup behavior (`apps/web/app/api/auth/signup/route.ts`) exactly — no conflict, directly reusable pattern.
- AUTH-PO-11 does not require any change to Razorpay billing, K1, contact-unlock, or ₹99/₹499/one-time-₹1,499 entitlement logic — confirmed unaffected (see §6).
- AUTH-PO-12's "preserve an email abstraction" is achievable, but the existing abstraction (`ClaimEmailSender` / `ClaimEmailMessage` in `packages/core-entitlements/src/claimEmail.ts:26-34`) is narrowly shaped to one message type, `{ to, claimUrl, expiresAt }`, and named for claim-links specifically. It is not yet generic enough to carry activation, activation-resend, and password-reset emails as distinct message types without widening the interface — an engineering detail (category C below), not a conflict with the decision itself.

---

## 3. AUTH-PO-01 → AUTH-PO-13 Impact Matrix

| ID | What it decides | Maps to questionnaire item(s) | Conflicts with existing system? |
|---|---|---|---|
| AUTH-PO-01 | Purchase-first flow, no pre-payment account | Questionnaire AUTH-PO-02 (verify after payment = B) + AUTH-PO-01 (passwords = A) combined into one flow | **Yes — Conflict 1** (requireUser precondition + NOT NULL constraint) |
| AUTH-PO-02 | Activation-link-only verification | Questionnaire AUTH-PO-02 (=B), reinforces AUTH-PO-10 (=A) | No |
| AUTH-PO-03 | Required/optional signup fields incl. phone, DOB | New scope — questionnaire never asked about phone/DOB; partially maps to AUTH-PO-03 (password mandatory = A) | No conflict, but **new schema fields required** — see §4 |
| AUTH-PO-04 | Always reuse existing account | = Questionnaire AUTH-PO-04 (Option A) | No — already implemented for claim-token flow |
| AUTH-PO-05 | Entitlement isolation on repeat purchase | Distinct from questionnaire AUTH-PO-05 (which is about migrating existing password-less users, not entitlement isolation) — **not the same question despite same ID** | No — matches existing product-isolation facts |
| AUTH-PO-06 | Payment valid independent of activation; 24h/single-use/latest-wins links | = Questionnaire AUTH-PO-07 (Option A), plus new "payment doesn't reverse" clause (no questionnaire equivalent) | No |
| AUTH-PO-07 | Generic resend response, rate-limited | = Questionnaire AUTH-PO-07/08/09/10 combined (Option A each) | No |
| AUTH-PO-08 | Email+password is normal login | = Questionnaire AUTH-PO-01 (Option A) | No — `/api/auth/login` already implements this |
| AUTH-PO-09 | Password creation if null; never overwrite existing | = Questionnaire AUTH-PO-03 (Option A), **partially** overlaps AUTH-PO-05 but only for the subset of existing users who go through this specific new flow — does **not** address the broader existing password-less base who never touch ₹1,499 | No — but leaves questionnaire AUTH-PO-05's broader question unanswered (see New PO Questions) |
| AUTH-PO-10 | Strict enumeration prevention | = Questionnaire AUTH-PO-08/09/10 (Option A each) | No |
| AUTH-PO-11 | Permanently disable `/api/auth/session` email-only path | = Questionnaire AUTH-PO-11, decides **that** it must go, but not explicitly **when** relative to the replacement shipping (questionnaire's A vs. B sequencing choice) | No conflict; sequencing is an engineering detail (§4, category C) |
| AUTH-PO-12 | Resend as provider | = Questionnaire AUTH-PO-12 (Option A) | No |
| AUTH-PO-13 | One unified account/login, eventually | = Questionnaire AUTH-PO-13, decides **that** consolidation happens (not C), silent on timing (A vs. B) | No conflict — see cross-impact trace below |

### AUTH-PO-13 cross-impact trace (explicitly requested)

- **On AUTH-PO-08 (normal login):** Consistent and reinforcing. AUTH-PO-08 already mandates the *same* password mechanism (`/api/auth/login`) that `/access/login` uses today. AUTH-PO-13's end-state is a natural extension of AUTH-PO-08, not a new mechanism — the "one login experience" is UI/routing convergence onto a flow that already exists.
- **On AUTH-PO-11 (removing `/api/auth/session`):** No conflict. AUTH-PO-13 does not require AUTH-PO-11 to wait, nor vice versa — closing the critical bypass does not depend on UI consolidation, and the questionnaire's own engineering note (AUTH-PO-13 = Option B reasoning) explicitly warns against coupling the two. The PO's text names no sequencing dependency either.
- **On existing `/access/login`:** Already password-based via `/api/auth/login` — it is the UI that the Client Finder login will eventually converge toward, not a system that itself needs to change for AUTH-PO-11 to land.
- **On current Client Finder login (`LoginForm.tsx` → `/api/auth/session`):** Must be replaced (per AUTH-PO-11) regardless of whether UI consolidation (AUTH-PO-13) happens now or later. In the interim, Client Finder could run its own password-based login screen that calls `/api/auth/login` (same backend, different UI) without yet being the *same page* as `/access/login` — satisfying AUTH-PO-11 immediately while leaving AUTH-PO-13's UI unification as later-scoped work, consistent with the questionnaire's own Option B framing.
- **On account/session architecture:** No schema change required for AUTH-PO-13 itself — `users`/`access_tokens` already model one account with sessions distinguished from entitlement tokens (migration `0012_user_identity`). AUTH-PO-13 is a UI/routing decision layered on an already-unified identity model, not a new identity model.

---

## 4. Files / Routes / Schema Areas Affected

**Routes:**
- `apps/web/app/api/auth/session/route.ts` — must be disabled/removed (AUTH-PO-11).
- `apps/web/app/api/payments/create-subscription/route.ts` — precondition conflicts with AUTH-PO-01 (Conflict 1).
- `apps/web/app/api/auth/signup/route.ts` — pattern to generalize for activation signup (claim-token logic reusable; field set must grow per AUTH-PO-03).
- `apps/web/app/api/auth/login/route.ts` — unaffected, becomes the sole normal-login path (AUTH-PO-08).
- `apps/web/app/api/claim/validate/route.ts` and resend endpoint(s) — pattern reusable for activation-link validation/resend (AUTH-PO-06/07), generic-response requirement already matches AUTH-PO-10.
- New: an activation-resend endpoint and a password-reset endpoint do not exist today and must be created (AUTH-PO-07, AUTH-PO-12's "recovery/reset").

**UI:**
- `apps/web/src/components/client-finder/LoginForm.tsx` — must stop posting to `/api/auth/session`; needs password field.
- `apps/web/app/claim/[token]/page.tsx` — pattern to generalize/duplicate for ₹1,499 activation (adds first/last name, phone, DOB, confirm-password fields not present today).
- `/access/login` — unaffected now; candidate for later consolidation (AUTH-PO-13).

**Schema (`packages/db/prisma`):**
- `users` table currently has only `id`, `email`, `created_at`, `password_hash` (migrations `0012_user_identity`, `0038_claim_tokens_and_account_linkage`). AUTH-PO-03 requires **new columns**: first name, last name, phone number, optional date of birth. None exist today — a new migration is required (category A: required because of explicit PO decision).
- `claim_tokens` table (`0038`) has `order_id TEXT NOT NULL` FK to `orders`. The ₹1,499 subscription flow does not create an `orders` row (`createSubscription.ts` talks to Razorpay directly; `subscription_periods` is written only by the webhook, per migration `0040`'s own comments). Reusing the claim-token mechanism for subscription activation requires either a new purchase-reference column/table or a nullable/generalized reference — this is the schema shape of Conflict 1 and of implementation-plan item 7 in the governing instructions.
- `subscription_periods.user_id` — `NOT NULL` (migration `0040`). Central to Conflict 1; any resolution touches this constraint or the point at which it is populated.

**Email:**
- `packages/core-entitlements/src/claimEmail.ts` — `ClaimEmailSender`/`ClaimEmailMessage` interface is single-purpose (claim-link only); needs widening to carry activation, resend, and reset messages as Resend is integrated (AUTH-PO-12).
- No Resend sender implementation exists; only `ConsoleClaimEmailSender` (dev) and `GmailDevClaimEmailSender` (dev-only, hard-blocked in production) exist today.

---

## 5. Implementation Plan (NOT authorized to begin — planning only)

**A. Required because of explicit PO decisions**
- New activation-link flow for ₹1,499 subscription: email capture → checkout → payment → activation email → link consumption → verified signup (AUTH-PO-01, 02, 06).
- Signup form fields: first name, last name, phone number, password, confirm password (required), date of birth (optional) — and the corresponding `users` schema migration (AUTH-PO-03).
- Existing-account reuse/linking logic for the new flow, mirroring the proven claim-token "existing-account, no auto-session" pattern (AUTH-PO-04, 09).
- Activation resend endpoint: generic response, rate-limited, invalidate-and-reissue, 24h TTL (AUTH-PO-07).
- Resend integration as the production email sender for activation/resend/reset (AUTH-PO-12).

**B. Required security remediation**
- Permanently remove/disable `POST /api/auth/session`'s email-only mint path; replace `LoginForm.tsx`'s posting target (AUTH-PO-11).
- Apply the strict enumeration-prevention standard to every new unauthenticated endpoint touched by this work (AUTH-PO-10).

**C. Engineering implementation details (non-binding, flagged separately from PO decisions)**
- Resolving Conflict 1: either defer `subscription_periods.user_id` attribution to webhook-time lookup, or introduce a pre-verified placeholder `users` row at email-entry — **pending a PO answer**, see New PO Questions.
- Generalizing `ClaimEmailSender`/`ClaimEmailMessage` into a multi-template transactional email interface before adding a Resend implementation.
- Deciding whether `claim_tokens` is widened (nullable `order_id`, new reference column) or a parallel, equally-audited token table is introduced for purchase-activation outside the `orders` table.
- Sequencing of AUTH-PO-11's removal relative to the replacement login shipping (immediate break vs. coordinated same-change cutover) — a deploy-sequencing choice, not a product decision.
- Password-reset endpoint: reuse the claim-token primitives (hash-at-rest, single-use, TTL) generalized for "reset" rather than "claim" (serves AUTH-PO-12's "recovery/reset" email type).

**D. Optional/future UX cleanup**
- Consolidating Client Finder login and `/access/login` into one UI (AUTH-PO-13) — explicitly not required to land AUTH-PO-11, and should not block it per the questionnaire's own prior engineering recommendation.
- Proactive migration of existing password-less ₹99/₹499/one-time-₹1,499 accounts toward AUTH-PO-13's end-state — no PO decision exists yet on whether/when (see New PO Questions).

**E. Existing behavior that MUST remain unchanged**
- Razorpay webhook HMAC verification and signed-`notes` attribution mechanism (independent of the precondition in Conflict 1).
- `POST /api/auth/login`, `verifyPassword()`, its rate limiting and generic-error behavior.
- `POST /api/auth/logout`.
- K1, contact classification, contact-unlock eligibility, opportunity eligibility.
- ₹99, ₹499, and existing one-time-₹1,499 commercial behavior and entitlement rows.
- Product/SKU catalog routing (`ai_income_99`, `ai_freelancing_499`, one-time `ai_client_acquisition_1499`, recurring `ai_client_acquisition_1499_subscription`).

---

## 6. Unchanged/Protected Systems — Confirmed

K1, contact classification, contact-unlock eligibility, opportunity eligibility, ₹99 commercial behavior, ₹499 commercial behavior, existing one-time-₹1,499 behavior, and the Razorpay webhook's HMAC-verified, server-signed-notes attribution mechanism are all **architecturally independent** of these 13 decisions and are not altered by anything decided above. The only existing-system element that is *not* fully protected is the ₹1,499 **subscription checkout's own pre-payment precondition** (Conflict 1) — that is a direct, named exception, not a silent one.

---

## 7. New PO Questions (not decided here — flagged per governance instruction §13)

1. **Resolving Conflict 1:** For a genuinely new customer with no prior account, should the system (a) create a dormant/unverified `users` row at email-entry time (before payment), with the rest of the profile completed at activation, or (b) defer all user attribution to activation/webhook time with no `users` row existing until then? This determines whether `subscription_periods.user_id NOT NULL` and the `requireUser()` precondition on `create-subscription` need to change, and (a) raises the definitional question of whether a dormant row counts as "creating an account" under AUTH-PO-01's literal wording.
2. **ID collision disambiguation:** Should this decision record's identifiers be renamed (e.g., `AUTH-REMEDIATION-DEC-01..13`) to avoid colliding with the existing questionnaire's `AUTH-PO-01..13` open-question IDs, or should the questionnaire be marked superseded/closed instead?
3. **Scope of AUTH-PO-05 vs. questionnaire AUTH-PO-05:** Should existing password-less ₹99/₹499/one-time-₹1,499 accounts that never purchase the new ₹1,499 subscription be proactively migrated toward a password (per AUTH-PO-13's end-state), and on what timeline — or do they remain untouched indefinitely, reachable only via whatever login path survives AUTH-PO-11?
4. **Password-reset TTL:** Should the password-reset link TTL match the 24-hour activation-link TTL (AUTH-PO-06/07), or should it be shorter, given reset links are typically treated as higher-sensitivity than signup/activation links?
5. **AUTH-PO-11 sequencing:** Should the email-only session endpoint be disabled immediately (breaking current Client Finder login until the new flow ships) or in the same coordinated change as its replacement? (Framed here as a deploy-sequencing detail engineering would otherwise decide, but flagged in case the PO wants to set the cutover policy explicitly given it determines whether there is a login-downtime window.)

---

## 8. Explicit Confirmation

**No code, migrations, commits, pushes, or deployments were made.** This document and its review are the only outputs of this task.

---
---

# Addendum: AUTH-PO-14 → AUTH-PO-24

**Status:** Recorded as authoritative below, verbatim, per the PO's instruction. This addendum is a decision record plus a read-only implementation-impact/consistency review against the **current** repository state (re-verified 2026-10-10, same day as §1–§8 above). **No code, migration, test, commit, push, or deployment has been made.**

## 1B. PO Decision Record (verbatim, authoritative)

### AUTH-PO-14 — Pre-purchase authentication
YES — an unauthenticated new visitor may initiate and complete the ₹1,499 subscription checkout without an existing account/session. Flow: email entered at checkout → ₹1,499 checkout/payment → activation email → secure activation link → email verification → signup/profile if required → authenticated account/session → Client Finder. The implementation must NOT simply remove `requireUser()` and trust a client-supplied user ID or email — it must establish a secure pending-purchase identity before an account exists. Existing Razorpay webhook signature verification and ownership/security protections must remain intact.

### AUTH-PO-15 — Pending purchase identity
Until an account exists, the purchase is associated with the checkout email. The purchase email is the immutable activation target; the customer cannot change it through the client/signup flow. After verification, create or reuse the account for that email. Identity chain: purchase email → Razorpay subscription → activation token → verified email → users.id. No identity reassignment based merely on client-provided values.

### AUTH-PO-16 — Existing account at activation
If the activation email already corresponds to an existing `users.id`: reuse it, attach the new subscription to it, never duplicate, never overwrite an existing password. If the account already has a password, do NOT show the signup page after activation — activate/login the existing account directly into Client Finder. If the account has no password, show the required password-setup step.

### AUTH-PO-17 — Existing account profile
For an existing account with a password already set: after activation, do not show the signup/profile form, do not block Client Finder on missing profile fields, send the user directly into Client Finder. Missing profile fields may be completed later via profile settings.

### AUTH-PO-18 — Different email
A different checkout email is a different identity. No automatic merging; no automatic association based on name/phone/DOB similarity. Any future linking occurs only through an explicit authenticated account-linking flow.

### AUTH-PO-19 — Never-activated subscription
A successfully created ₹1,499 subscription continues per its normal Razorpay lifecycle even if never activated. Lack of activation does not cancel or reverse the subscription. Activation controls Client Finder access, not subscription existence. The customer may activate later while the subscription remains eligible.

### AUTH-PO-20 — Renewal while never activated
Renewal proceeds normally even if never activated. Billing lifecycle is governed by the Razorpay subscription lifecycle; activation is not a prerequisite for recurring billing. No separate activation-related billing state.

### AUTH-PO-21 — Activation eligibility deadline
No fixed calendar deadline (no 30/60/90-day cutoff). Activation eligibility lasts while the subscription is active. Individual activation links expire after 24 hours, but a new link may be requested at any time the subscription remains active and paying, even months later. If the subscription has ended/expired, activation cannot be requested/completed through it. No separate fixed activation deadline.

### AUTH-PO-22 — Activation after subscription expiry
Option A: active subscription → activation allowed; expired/ended subscription → activation not allowed. No post-expiry activation grace period unless separately authorized.

### AUTH-PO-23 — Cancellation during current paid period
Cancellation stops future renewal but does not terminate the current paid period. The current paid period remains active (and activation remains allowed) until its actual end. Cancellation-request time is not treated as immediate expiry.

### AUTH-PO-24 — Renewal payment failure
The initial ₹1,499 payment provides the initial 30-day active period; the customer has those 30 days to activate. If a renewal payment fails: there is no new paid period, the subscription becomes inactive per the existing Razorpay lifecycle, activation is no longer available once the current paid period ends, and there is no separate activation grace period. If renewal fails while the current paid period is still active, activation remains allowed until that period's actual expiry. Use the existing lifecycle/status to determine the exact inactive moment — no invented additional grace period.

---

## 2B. Decision Consistency Result (addendum): **NO TRUE CONFLICT FOUND; ONE EXTENDED CONFLICT (Conflict 1, re-scoped) AND SEVERAL GAPS**

All 11 new decisions are internally coherent with each other and with §1's AUTH-PO-01–13. Re-verified against current repository state (`b3f1827`, no auth/payments files touched by the working tree's uncommitted changes — confirmed via `git status` and direct inspection):

### Conflict 1, extended — AUTH-PO-14/15/19/20 sharpen, but do not newly create, the existing requireUser()/NOT-NULL conflict
`apps/web/app/api/payments/create-subscription/route.ts:44` still calls `requireUser()`; `packages/db/prisma/migrations/0040_subscription_periods/migration.sql` still declares `user_id TEXT NOT NULL`, and `webhookHandler.ts` still rejects/ignores a `subscription.charged` event with no attributable `notes.userId`. AUTH-PO-14 reconfirms §1's Conflict 1 exists (pre-purchase, no session). AUTH-PO-15's identity chain ("purchase email → Razorpay subscription → activation token → verified email → users.id") is consistent with resolving it via **Option (a)** from §7 Question 1 (a dormant/pending `users.id` minted at checkout, before verification) — a dormant row still satisfies `notes.userId` and the `NOT NULL` constraint on every subsequent renewal charge, which is what AUTH-PO-19/20 require (billing/renewal must keep working even if the customer never activates). **This decision does not formally close §7 Question 1** (the PO has not been asked "is a dormant pre-verified row acceptable under AUTH-PO-01's 'does not create an account before payment' wording," and AUTH-PO-15 does not use the word "dormant row") — it narrows the answer space but the explicit question remains open (carried forward below as New PO Question 1B).

### No conflict — AUTH-PO-21/22/23/24 vs. the existing access model (IRL-O)
`packages/db/prisma/migrations/0040_subscription_periods/migration.sql`'s own header states the access authority explicitly: *"No `expiry_at` column: expiry is computed (`activation_at + duration_days`) at read time... consistent with IRL-O ('the product's own computed activation_at + duration_days and refunded_at are the sole access authority; Razorpay's own status field is read only for display/reconciliation')."* This existing, already-PO-authorized principle (`requirement/CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`, cross-referenced as IRL-N/IRL-O: *"Cancellation without refund runs through existing expiry"*) already produces AUTH-PO-23's exact behavior (cancellation lets the current period run to its computed end, no special-case needed) and AUTH-PO-21/22's exact behavior ("active" = a currently-unexpired period exists for that `razorpay_subscription_id`; "expired" = it does not) **using data the system already stores**, with no new Razorpay API polling and no new webhook event type required. **This is confirmed NO CONFLICT, and is a materially better position than §7 Question 1's framing assumed** — but see Documentation Gap below, because AUTH-PO-24's own wording ("use the existing Razorpay lifecycle/status") describes a mechanism (reading Razorpay's live status) that is NOT how this system's access authority actually works today (IRL-O deliberately avoids that). The PO decision's *outcome* is achievable with existing architecture; its *stated mechanism* is not the one the architecture actually uses.

### Non-conflicts confirmed
- AUTH-PO-16/18's "never auto-merge, reuse by exact email only" is consistent with §1's AUTH-PO-04/05 and the already-implemented `findUserByEmail` + `linkEntitlementsToUser` pattern (`apps/web/app/api/auth/signup/route.ts:134-144`).
- AUTH-PO-21's 24-hour individual-link TTL matches the already-implemented `CLAIM_TOKEN_TTL_MS` constant exactly (`packages/core-entitlements/src/claimToken.test.ts:25`: `24 * 60 * 60 * 1000`) — directly reusable, no new TTL policy to invent.
- Confirmed by direct grep of `packages/core-payments` and `apps`: there is no existing handling anywhere in the repository for `subscription.cancelled`, `subscription.halted`, `subscription.completed`, `subscription.pending`, or `payment.failed` webhook events (`SUPPORTED_EVENTS` in `webhookHandler.ts:103-108` lists only `payment.captured`, `refund.created`, `refund.processed`, `subscription.charged`). Per the No-Conflict finding above, AUTH-PO-21–24 do not actually require adding handlers for these — the computed-period-expiry model already covers them — but this is recorded here as a fact check, not an assumption.

---

## 3B. AUTH-PO-14 → AUTH-PO-24 Impact Matrix

| ID | What it decides | Conflicts with existing system? | Classification |
|---|---|---|---|
| AUTH-PO-14 | Pre-purchase checkout, no session required | Reconfirms §1 Conflict 1 | A. TRUE REQUIREMENT CONFLICT (pre-existing, not new) |
| AUTH-PO-15 | Pending identity keyed to immutable purchase email | Narrows but does not close §7 Q1 | B. IMPLEMENTATION GAP (no pending-identity mechanism exists; `claim_tokens.order_id` is `NOT NULL` FK to `orders`, which a subscription checkout never creates) |
| AUTH-PO-16 | Existing-account reuse; skip signup if password set; auto-login to Client Finder | No conflict with the decision itself, but current ₹99 claim-flow pattern (`signup/route.ts:134-144`) does the opposite today: on an existing account it mints **no session** and tells the customer to log in manually, rather than auto-logging them in | B. IMPLEMENTATION GAP (new behavior must be built; nothing today auto-logs an existing account through this path) |
| AUTH-PO-17 | Skip profile form; don't block Client Finder on missing fields | No conflict | B. IMPLEMENTATION GAP (new UI branch; no existing code path distinguishes "has password" from "needs profile") |
| AUTH-PO-18 | Different email = different identity, no auto-merge | No conflict — matches existing no-merge posture | D. NO CONFLICT |
| AUTH-PO-19 | Unactivated subscription still follows normal Razorpay lifecycle | Tied to Conflict 1's resolution (notes.userId must exist at every charge, not just the first) | B. IMPLEMENTATION GAP, contingent on AUTH-PO-15's resolution |
| AUTH-PO-20 | Renewal proceeds regardless of activation | Same as AUTH-PO-19 | B. IMPLEMENTATION GAP, contingent on AUTH-PO-15's resolution |
| AUTH-PO-21 | No fixed deadline; eligible while subscription active; 24h link TTL | No conflict — satisfiable via existing IRL-O computed-expiry model | B. IMPLEMENTATION GAP (the eligibility *check* itself doesn't exist yet; the *data* it would read already does) |
| AUTH-PO-22 | Option A: active → allowed, expired → not allowed | No conflict — see §2B | D. NO CONFLICT (outcome); B. IMPLEMENTATION GAP (the check) |
| AUTH-PO-23 | Cancellation doesn't end current period early | No conflict — already the de facto existing behavior per IRL-N/IRL-O | D. NO CONFLICT |
| AUTH-PO-24 | Renewal failure ends eligibility at current period's end; no grace period | No conflict in outcome; **documentation/terminology mismatch** in stated mechanism | C. DOCUMENTATION GAP (decision text says "use Razorpay lifecycle/status"; actual access authority is the locally computed `activation_at + duration_days` period model, per IRL-O — these need to be reconciled in writing, not in code) |

---

## 4B. Files / Routes / Schema Areas Affected (addendum, re-verified against current repo)

**Routes (current state confirmed this pass):**
- `apps/web/app/api/payments/create-subscription/route.ts:44` — still calls `requireUser()`; still the Conflict 1 blocker for AUTH-PO-14.
- `apps/web/app/api/auth/signup/route.ts:134-144` — existing-account branch returns a "log in yourself" message and mints no session; must change for AUTH-PO-16/17's "auto-login, skip profile" requirement, but only for the new ₹1,499-subscription activation path — changing the existing ₹99 claim-flow's own behavior is explicitly out of scope (PDEF governing instruction: do not alter ₹99/₹499/one-time-₹1,499 behavior).
- No activation-eligibility endpoint exists yet (checking "is this subscription's current period still unexpired" before issuing/accepting an activation link) — net-new, needed for AUTH-PO-21/22/23/24.

**Schema:**
- `packages/db/prisma/migrations/0040_subscription_periods/migration.sql` — `user_id TEXT NOT NULL` (line 33) is the exact constraint AUTH-PO-15/19/20 must work within; re-confirmed unchanged (latest migration on disk is `0042_lead_unlock_contacts`; nothing between `0040` and `0042` touches this table).
- `claim_tokens` table (migration `0038`) — `order_id` is `NOT NULL`, FK to `orders`; the ₹1,499 subscription flow has no `orders` row (unchanged fact from §4). AUTH-PO-15's "activation token" for a subscription cannot reuse `claim_tokens` as-is without a schema change (nullable `order_id` or a new reference column, or a parallel token table) — same shape as §4's original finding, now directly required by AUTH-PO-15 rather than inferred.
- `users` table — still only `id`, `email`, `created_at`, `password_hash` (no model-level Prisma schema found; raw-SQL migrations confirmed through `0042`, none add user profile columns). AUTH-PO-03's required first/last name, phone, optional DOB (§1) remain unimplemented; AUTH-PO-16/17 add no new column requirements beyond what §1 already identified.

**Webhook handling:**
- `packages/core-payments/src/webhookHandler.ts:103-108` (`SUPPORTED_EVENTS`) — confirmed to still list only `payment.captured`, `refund.created`, `refund.processed`, `subscription.charged`. Per §2B's No-Conflict finding, AUTH-PO-19–24 do **not** require adding `subscription.cancelled`/`halted`/`completed`/`payment.failed` handlers — the computed-period-expiry model already covers the required outcomes — but this should be explicitly confirmed with engineering before implementation, since AUTH-PO-24's own text assumes a Razorpay-status-reading mechanism that doesn't exist (see Documentation Gap, §2B/§3B).

---

## 5B. Data-Model Impact (addendum, implications only — no implementation)

- A pending-purchase identity mechanism (AUTH-PO-15) requires either: (a) a dormant/unverified `users` row created at checkout time with no password set, bound immutably to the purchase email, or (b) a new table (parallel to `claim_tokens`) that holds the purchase-email-to-Razorpay-subscription binding until verification, with `users.id` created only at verification. Both are schema changes; neither is decided by the PO text as given (carried forward as New PO Question 1B).
- If (a) is chosen, `requireUser()`'s precondition on `create-subscription` would need to change from "has an authenticated session" to "has a resolvable pending-or-real identity" — a materially different authorization check than exists today, not a toggle.
- `claim_tokens.order_id NOT NULL` either needs to become nullable with a new `razorpay_subscription_id` reference column, or a new activation-token table is needed specifically for subscription purchases (same finding as §4 original, now load-bearing for AUTH-PO-15 specifically, not just Conflict 1 generally).
- An activation-eligibility read path needs to exist: "does a currently-unexpired `subscription_periods` row exist for this `razorpay_subscription_id`" — this reads the existing schema as-is; no new column is implied by AUTH-PO-21/22/23/24 themselves (contrary to what their "Razorpay lifecycle/status" phrasing might suggest — see Documentation Gap).

---

## 6B. Security Impact (addendum, implications only — no implementation)

- **Pending purchase identity (AUTH-PO-15):** whatever mechanism is chosen must not allow a client-supplied value to establish or redirect the pending identity — the purchase email must be set exactly once, server-side, at checkout, and never from a client-writable field thereafter (mirrors the existing DEC-011 pattern already enforced in `signup/route.ts:132`, `// Server-derived, per DEC-011 — not read from this request at any point`).
- **Immutable activation email (AUTH-PO-15/18):** the activation endpoint must not accept an email parameter from the client at all for the purposes of determining which purchase/identity it resolves to — only the server-held binding (token → purchase email) may determine it, matching the existing claim-token pattern's own security property.
- **Account takeover / enumeration (AUTH-PO-16/17 interacting with §1 AUTH-PO-10):** the existing-account branch must stay on the same generic-response discipline as §1's AUTH-PO-07/10 — auto-login on activation must not become a vector for probing whether an email has an account (the activation token itself, not the email, must gate the login; this is consistent with — not a change to — the existing claim-token security model).
- **Duplicate-account prevention:** AUTH-PO-16/18 reinforce, not weaken, §1 AUTH-PO-04's existing "always reuse by exact email, never duplicate" rule; no new risk identified.
- **Razorpay webhook ownership (AUTH-PO-19/20):** must not be weakened to accept an unattributed `subscription.charged` event (i.e., must not relax the existing `notes.userId`-required rejection in `webhookHandler.ts:362`) merely to make "renewal works pre-activation" easier — whatever pending-identity mechanism is chosen (§5B) must supply a real, server-controlled `userId` into `notes` at subscription-creation time, same as today's flow, so that this rejection rule and its anti-spoofing property are preserved unchanged.
- **Activation after cancellation/expiry (AUTH-PO-22/23/24):** the activation-eligibility check must be a server-side read of `subscription_periods` (or equivalent), never a client-asserted "my subscription is still active" claim — same trust boundary the existing entitlement-gate pattern already uses.

---

## 7B. Open Product Owner Questions (addendum — not decided here)

1. **New PO Question 1B (sharpens §7 Question 1):** Is a dormant, password-less, unverified `users` row — created at checkout time, before payment, bound immutably to the purchase email, with no login capability until activation — an acceptable implementation of AUTH-PO-14/15's "pending purchase identity," or does AUTH-PO-01/14's "does not create an account before payment" forbid any `users` row from existing pre-payment, requiring a separate non-`users` pending-identity table instead? This determines whether `subscription_periods.user_id NOT NULL` can be satisfied directly (option a) or requires deferring population to webhook-time lookup against a separate table (option b, as in §7 Q1).
2. **New PO Question 2B:** AUTH-PO-24's text says to "use the existing Razorpay lifecycle/status to determine the exact inactive moment," but the system's actual, already-PO-authorized access authority (IRL-O) is the locally computed `activation_at + duration_days` period model, not Razorpay's live subscription status (which this system treats as display/reconciliation-only, by deliberate prior design). Should AUTH-PO-21–24 be read as satisfied by the existing computed-period model (no new Razorpay-status-reading mechanism needed), or does the PO specifically want a new mechanism added that reads Razorpay's live subscription status as a second, independent source of truth? (If the latter, this would be a new decision to revisit IRL-O, not merely an implementation detail.)
3. **New PO Question 3B:** AUTH-PO-16/17's "auto-login an existing account directly into Client Finder on activation" is a different behavior from the already-implemented ₹99 claim-flow's existing-account branch, which mints no session and asks the customer to log in manually. Should this new auto-login behavior be scoped *only* to the new ₹1,499-subscription activation path (leaving the ₹99/₹499/one-time-₹1,499 claim-flow's existing behavior untouched, per the governing instruction not to alter it), or should the PO want the ₹99/₹499/one-time-₹1,499 flow brought in line with this new auto-login behavior too (a broader, separately-scoped decision, not implied by AUTH-PO-16/17's text, which speaks only of "the ₹1,499 subscription")?

---

## 8B. Implementation Status (addendum — explicit confirmation)

- No code changed.
- No migrations changed.
- No tests changed.
- No requirement document other than this one created or modified.
- No commit created.
- No push performed.
- No deployment performed.
