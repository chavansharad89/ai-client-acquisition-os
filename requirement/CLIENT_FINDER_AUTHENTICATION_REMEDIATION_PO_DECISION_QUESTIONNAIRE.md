# Client Finder Authentication Remediation — Product Owner Decision Questionnaire

**Status:** Awaiting Product Owner decisions. No code, migration, requirement, commit, push, or deployment has been changed as part of this document.
**Source:** Authentication Architecture Audit, 2026-10-10 (read-only, no code changes).
**Scope:** This questionnaire only proposes options and engineering opinions. Nothing below is authorized for implementation until the PO records a decision against each ID. Until decided, existing Razorpay subscription, webhook ownership, K1, contact-unlock, and all existing-product (₹99 / ₹499 / one-time ₹1,499) behavior remains unchanged.

---

## Part 1 — Facts Already Established by the Audit

These are observed, not opinions. They are the basis for the options below.

1. **`POST /api/auth/session` is an authentication bypass.** It accepts `{ email }` only, looks up the user by email, and mints a fully-privileged session cookie with zero proof of ownership (no password, OTP, or link token). Anyone who knows or guesses a registered user's email can obtain a session as that user. (`apps/web/app/api/auth/session/route.ts:29-75`)
2. **This endpoint is live and wired to the UI.** `apps/web/src/components/client-finder/LoginForm.tsx` is email-only (no password field) and posts directly to `/api/auth/session`. This is the current Client Finder login experience.
3. **A correct password-based login already exists and is unaffected:** `POST /api/auth/login` requires email + password, uses `verifyPassword()`, rate-limits per email and per IP, and returns an identical generic error for unknown email / no password set / wrong password (prevents enumeration). (`apps/web/app/api/auth/login/route.ts`)
4. **A separate, correct, production-grade email-ownership verification mechanism already exists and is in production use for ₹99 self-service signup**: the claim-token flow.
   - 32-byte random token, SHA-256 hashed at rest, 24-hour TTL, single-use via atomic `UPDATE ... WHERE claimed_at IS NULL`.
   - Email is always server-derived from the order record (`claim_tokens.customer_email`), never from client input. `POST /api/auth/signup` explicitly **rejects** any request that includes an `email` field.
   - Resend/reissue invalidates all prior unclaimed tokens for the order (latest-link-wins).
   - If the derived email already has a user account, entitlements are linked to that existing account but **no session is minted** — the caller is forced to log in normally. This specifically prevents account takeover via a replayed/leaked claim link.
   - (`packages/core-entitlements/src/claimToken.ts`, `claimEmail.ts`, `pgRepository.ts`; `apps/web/app/claim/[token]/page.tsx`; `apps/web/app/api/auth/signup/route.ts`; `apps/web/app/api/claim/validate/route.ts`)
5. **No production transactional email provider is configured.** Only `ConsoleClaimEmailSender` (dev, logs to stdout) and `GmailDevClaimEmailSender` (dev-only SMTP, explicitly throws if `NODE_ENV=production`) exist. `EMAIL_PROVIDER` is optional in config but production boot with no provider configured throws `EmailProviderNotConfiguredError`. No Resend/SES/Postmark implementation exists in the repo.
6. **Identity model:** `users` table is canonical identity (`id`, unique `email`, nullable `password_hash`). `access_tokens.user_id IS NULL` = entitlement credential (legacy); `user_id IS NOT NULL` = session. `requireUser()` enforces this distinction. Only one user in the current dataset has a password hash set; other accounts (including E2E test accounts) were provisioned out-of-band without passwords.
7. **Logout (`POST /api/auth/logout`) is correct and unaffected**: revokes the session token server-side, clears the cookie, is idempotent, and returns 200 regardless of prior session state.
8. **Subscription (recurring ₹1,499) webhook attribution is correct and unaffected by anything below**: `userId` is derived from Razorpay-signed `notes` set server-side at subscription creation (never from client/webhook body), HMAC signature is verified before any parsing, and `subscription_periods.user_id` has a NOT NULL DB constraint. This is architecturally independent of the login/session vulnerability — fixing AUTH-DEC-01 through AUTH-DEC-13 does not require touching webhook or payment code.
9. **Product/SKU catalog is unaffected by this audit**: `ai_income_99`, `ai_freelancing_499`, one-time `ai_client_acquisition_1499`, and recurring `ai_client_acquisition_1499_subscription` all route correctly to their respective checkout endpoints today, independent of login mechanism.
10. **Two parallel login surfaces exist today**: the Client Finder login (email-only, vulnerable) and `/access/login` (used by the ₹99/₹499/one-time-₹1,499 claim flow, password-based via `/api/auth/login`). They are not currently consolidated.

---

## Part 2 — Decision Questionnaire

Each item lists: the exact question, why it requires PO judgment (not an engineering call), the options, the engineering recommendation (clearly marked, non-binding), consequences, security implications, and which products/SKUs the decision affects.

---

### AUTH-PO-01 — Should Client Finder use password authentication?

**Why PO decision required:** This trades off user friction (remembering a password) against security and support cost (password reset flows). It also determines whether the ₹1,499 subscription product converges on the same identity model as ₹99/₹499/one-time ₹1,499, which is a product-shape decision, not a technical one.

**Options:**
- **A.** Yes — require password at account creation, same as the existing claim-token → signup flow.
- **B.** No — stay passwordless; replace the vulnerable email-only session mint with a secure passwordless mechanism (e.g., magic link / OTP per login, not just at signup).
- **C.** Hybrid — password required for the new ₹1,499 subscription; existing ₹99/₹499/one-time ₹1,499 customers keep whatever they have today (many have no password).

**Engineering recommendation:** **A.** The repo already has a complete, hardened password implementation (`/api/auth/login`, `verifyPassword`, rate limiting, generic error) and an existing claim-token signup flow that collects a password. Reusing it is the smallest-risk path and avoids building/maintaining a second (magic-link-per-login) auth mechanism.

**Consequences:**
- A: One auth mechanism to secure and support; users must remember a password; need reset flow (see AUTH-PO-06).
- B: No password to remember or leak in a breach, but requires building/hardening a magic-link-per-login flow that doesn't exist yet (claim-token flow is signup-only, single-use, tied to an order).
- C: Two different auth experiences by product; more support surface; existing passwordless users remain on a weaker path indefinitely unless separately remediated.

**Security implications:** Passwords add credential-stuffing/reuse risk (mitigated by rate limiting already present) but are a well-understood, already-implemented control. Passwordless-per-login shifts risk to email account security and link/OTP delivery integrity.

**Product impact:** Primarily the **new ₹1,499 subscription**. Option C explicitly also governs ₹99/₹499/one-time ₹1,499.

---

### AUTH-PO-02 — Must new users verify email ownership before ₹1,499 checkout?

**Why PO decision required:** This is a funnel-friction-vs-fraud tradeoff (pre-payment verification delays checkout; post-payment verification risks delivering access notifications to an unverified/wrong inbox) and determines the checkout UX.

**Options:**
- **A.** Verify before checkout (email link/OTP gates access to the payment form).
- **B.** Verify after payment, before granting access (current ₹99 pattern: pay → claim link → set password → access).
- **C.** No verification required beyond entering an email at checkout.

**Engineering recommendation:** **B.** This matches the pattern already proven in production for ₹99 (order → claim token → email-derived signup) and keeps checkout friction-free, which matters more for a paid conversion funnel than for a free signup.

**Consequences:**
- A: Lower paid-conversion risk of typo'd emails, but adds a step before the user has committed to pay (likely reduces conversion).
- B: Matches existing proven pattern; reuses existing claim-token code; a mistyped email at checkout means the claim link goes to the wrong address (mitigated by resend-to-correct-email support process, not a code gap).
- C: Fastest checkout, but the account is "claimed" without verification, which conflicts with AUTH-PO-10 (enumeration) and weakens the whole remediation's purpose.

**Security implications:** B preserves the audited claim-token guarantees (server-derived email, single-use, hashed, time-limited). C reintroduces an unverified-email surface similar to the one being removed.

**Product impact:** **New ₹1,499 subscription** only (this is the product currently missing a verified onboarding path).

---

### AUTH-PO-03 — Should verified users be required to set a password at signup?

**Why PO decision required:** Depends directly on AUTH-PO-01. If passwords are adopted, this decision fixes when in the flow the password is captured.

**Options:**
- **A.** Yes, mandatory at claim-link signup (current ₹99 pattern: password field on `/claim/[token]`).
- **B.** Optional — allow completing signup without a password, with a "secure your account" prompt deferred to later.
- **C.** Not applicable (only relevant if AUTH-PO-01 = A or C).

**Engineering recommendation:** **A**, contingent on AUTH-PO-01 = A/C. Matches `apps/web/app/claim/[token]/page.tsx` today; deferred/optional password capture is a known pattern for silent account abandonment (users who never return to set one), re-creating the exact out-of-band-no-password state the audit already flagged as a latent risk.

**Consequences:**
- A: Every subscription account has a password from day one; no lingering password-less accounts.
- B: Some accounts remain password-less; whatever login path serves them must still be secure (reopens AUTH-PO-01/AUTH-PO-11 questions for that subset).

**Security implications:** A closes the "accounts with no password_hash" gap noted in the audit (fact #6) for all new signups.

**Product impact:** **New ₹1,499 subscription** signups going forward. Does not retroactively change existing ₹99/₹499/one-time ₹1,499 accounts (see AUTH-PO-05).

---

### AUTH-PO-04 — How should an existing account be linked when a user buys ₹1,499 with an email that already has an account?

**Why PO decision required:** This is an account-ownership policy choice — whether a new purchase automatically extends an existing account or requires a separate confirmation step — with direct consequences for account-takeover risk.

**Options:**
- **A.** Auto-link entitlement to the existing account (by email match), require the user to log in normally afterward to see it — same behavior the audit confirms `/api/auth/signup` already implements for claim tokens (`existing-account` status, no session minted).
- **B.** Auto-link and also auto-mint a session for convenience.
- **C.** Block and require manual/support-assisted merge.

**Engineering recommendation:** **A.** It's already implemented and tested for the ₹99 flow and is the standard "don't let a claim link double as an account-takeover vector" pattern. B reopens exactly the account-takeover shape the existing code deliberately avoids; C adds support burden with no added security benefit over A.

**Consequences:**
- A: Zero new code for this case if the subscription checkout reuses the existing claim-token/signup endpoint; one extra login step for the customer.
- B: Convenient, but means possessing someone's purchase receipt/claim link is sufficient to obtain a live session for their account — the same shape of flaw as the audited vulnerability.
- C: Safe but adds manual ops work to every repeat purchase by an existing customer, which will recur often.

**Security implications:** B is explicitly the anti-pattern the current signup code was written to avoid (see fact #4). A preserves that invariant.

**Product impact:** Any product purchased by an email with an existing account — most relevant to **new ₹1,499 subscription** repeat/upgrade purchases, but the policy should be stated once and apply uniformly.

---

### AUTH-PO-05 — What happens to users who already hold ₹99 / ₹499 / one-time-₹1,499 entitlements today?

**Why PO decision required:** These are real existing customers/entitlement rows; any remediation must not strand or lock out their access. This is a migration/communication decision, not just a technical one.

**Options:**
- **A.** Leave untouched — existing entitlement rows and their current login path (claim-token login or out-of-band provisioned, password-less) continue to work exactly as today; only new ₹1,499 subscription signups get the new flow.
- **B.** Proactively migrate — send existing password-less accounts a one-time claim/reset link to set a password, on a PO-approved timeline.
- **C.** Force migration — existing accounts cannot log in again until they set a password.

**Engineering recommendation:** **A** now, with **B** as a separate, explicitly-scoped follow-up once a production email provider is in place (AUTH-PO-12). C is not recommended — it risks locking out paying customers with no advance notice.

**Consequences:**
- A: No regression risk to existing customers; the email-only `/api/auth/session` bypass remains reachable for them until a separate decision closes it (see AUTH-PO-11) — this is why AUTH-PO-11 must be decided explicitly and not left implicit.
- B: Improves security posture for the whole base over time; requires email provider and a comms plan.
- C: Highest security improvement, highest support/complaint risk; likely disproportionate for ₹99/₹499 customers.

**Security implications:** A alone does not close the vulnerability for existing users unless paired with an explicit AUTH-PO-11 decision to disable the bypass endpoint outright (which would then force this cohort onto password/claim-link login).

**Product impact:** **₹99, ₹499, existing one-time ₹1,499** entitlement holders specifically. Does not affect the new ₹1,499 subscription product's own flow.

---

### AUTH-PO-06 — What password reset/recovery mechanism should exist?

**Why PO decision required:** Only relevant if AUTH-PO-01 adopts passwords; the chosen mechanism has direct enumeration and account-takeover implications (see AUTH-PO-10) that are a risk-tolerance call, not purely technical.

**Options:**
- **A.** Email-link based reset, built on the same claim-token primitives (random token, hashed, single-use, time-limited) already in the repo, generalized beyond "claim an order" to "reset a password."
- **B.** No self-service reset — support-assisted only (current de facto state; `/api/auth/login` exists but there's no reset endpoint today).
- **C.** OTP-based reset (SMS or email code) instead of a link.

**Engineering recommendation:** **A.** Reuses the already-audited, already-correct token primitives (hash at rest, single-use, TTL, server-derived email) instead of inventing a new mechanism. Must return the same generic response whether or not the email has an account (ties to AUTH-PO-10).

**Consequences:**
- A: Moderate build effort (reuse of existing primitives, new endpoint + email template); standard, well-understood UX.
- B: Zero build effort now, but every password-based signup (AUTH-PO-01/03) creates support tickets for forgotten passwords indefinitely.
- C: Extra build effort (SMS integration, or still needs email) with no clear benefit over A for this product.

**Security implications:** Must not reveal account existence via response timing/content differences (same generic-response principle already used in `/api/auth/login`'s `INVALID_CREDENTIALS` response).

**Product impact:** **New ₹1,499 subscription**, and optionally extendable to ₹99/₹499/one-time ₹1,499 if AUTH-PO-05 = B.

---

### AUTH-PO-07 — What are the email-link expiry and resend rules?

**Why PO decision required:** This is a UX/support-load tradeoff (shorter expiry = more resend requests; longer expiry = larger window for a leaked/forwarded link to be abused) that only the PO can weigh against support capacity.

**Options:**
- **A.** Match existing claim-token behavior exactly: 24-hour TTL, resend invalidates all prior unclaimed links for that token family (latest-link-wins).
- **B.** Shorter TTL (e.g., 15–60 minutes) for higher-sensitivity actions (password reset) and keep 24h for signup/claim.
- **C.** Longer TTL (e.g., 72h) to reduce resend support load.

**Engineering recommendation:** **A** for signup/claim (no reason to diverge from the proven pattern); **B**'s shorter window specifically for password-reset links is a reasonable refinement engineering would suggest, since reset links are typically treated as more sensitive than signup links industry-wide — but this is explicitly offered as an option, not assumed.

**Consequences:** Shorter TTL increases resend-endpoint traffic and support contact volume; longer TTL increases the window in which a forwarded/leaked/stale link remains exploitable.

**Security implications:** The existing invalidate-prior-links-on-resend behavior must be preserved regardless of chosen TTL, to avoid stale valid links accumulating.

**Product impact:** **New ₹1,499 subscription** signup/reset links. No effect on ₹99/₹499/one-time ₹1,499 unless AUTH-PO-05/06 extend reset to them.

---

### AUTH-PO-08 — What should happen when a checkout/signup email already belongs to a user?

**Why PO decision required:** Directly determines whether the system leaks account-existence information (an enumeration vector), which is a risk-acceptance decision.

**Options:**
- **A.** Same generic message regardless of existing/non-existing email ("If an account exists, we've sent instructions"), with the real differentiation (link vs. "existing-account" entitlement-link path) happening only after the user clicks through a sent email.
- **B.** Immediately and explicitly tell the user "an account already exists for this email" at the point of checkout/signup.
- **C.** Silently create a second, unlinked record for the same email (not recommended; would violate the existing unique-email DB constraint anyway).

**Engineering recommendation:** **A.** This is the standard anti-enumeration pattern and is consistent with how `/api/auth/login` already behaves (identical error for unknown-email / no-password / wrong-password). Option C is not viable given the existing unique constraint on `users.email` and is listed only for completeness.

**Consequences:** A adds a small amount of user confusion ("why didn't I get a 'welcome' email, just 'check your inbox'?") in exchange for not revealing account existence. B is more transparent to legitimate users but tells an attacker whether a target email has an account.

**Security implications:** Directly feeds AUTH-PO-10 (enumeration prevention) — these two decisions should be made consistently, not independently.

**Product impact:** **New ₹1,499 subscription** checkout/signup flow primarily; the existing ₹99 claim-token flow already behaves like A (existing-account path returns a generic status, not an explicit "this email is taken" message) and would stay as-is.

---

### AUTH-PO-09 — What should happen when a checkout/login email does not belong to any user?

**Why PO decision required:** Same enumeration-risk tradeoff as AUTH-PO-08, from the opposite direction, plus a UX question about how clearly to guide a legitimate but mistyped-email user.

**Options:**
- **A.** Generic response, identical in form to the "email exists" case (e.g., always "check your email for next steps" on login/reset; checkout naturally proceeds to payment since no account check is needed pre-payment per AUTH-PO-02=B).
- **B.** Explicit "no account found for this email" message.

**Engineering recommendation:** **A**, for login/reset specifically, for the same anti-enumeration reason as AUTH-PO-08. Checkout itself (if AUTH-PO-02=B) doesn't need an account check at all — the email is simply where the claim link will go.

**Consequences:** A trades a small amount of user clarity for not confirming/denying account existence to a prober. B is more helpful for a genuinely mistyped email but is an enumeration oracle.

**Security implications:** Must be decided consistently with AUTH-PO-08 and AUTH-PO-10; mismatched responses between the "exists" and "doesn't exist" cases is itself the vulnerability class.

**Product impact:** **New ₹1,499 subscription** login/signup/reset surfaces. The existing `/api/auth/login` generic-error behavior already matches A and is unaffected.

---

### AUTH-PO-10 — What is the required standard for preventing account enumeration?

**Why PO decision required:** This sets the bar every other decision (AUTH-PO-06, 08, 09, 11) must satisfy. It's a risk-tolerance statement the PO should make explicitly rather than have it fall out implicitly from individual UX choices.

**Options:**
- **A.** Strict: no endpoint (login, signup, reset, resend) may ever return a response, status code, or timing difference that reveals whether an email has an account. All responses are generically worded and (where feasible) constant-time.
- **B.** Relaxed: enumeration resistance is "best effort" — generic wording preferred but not treated as a release blocker if it conflicts with a simpler UX.
- **C.** Not a requirement for this product tier (accept the risk explicitly).

**Engineering recommendation:** **A.** The codebase already implements this standard for `/api/auth/login` (identical `INVALID_CREDENTIALS` for all three failure modes) and for claim-token signup (generic `existing-account` vs `created` status without exposing *why*). Extending the same standard to new endpoints is low incremental cost and keeps the security posture coherent across the whole auth surface.

**Consequences:** A requires discipline in every new endpoint's error messages (easy to regress accidentally); B/C accept a known, named risk.

**Security implications:** This decision is the policy that AUTH-PO-06/08/09 implement; recommend deciding this one first, then treating 06/08/09 as "apply AUTH-PO-10's answer."

**Product impact:** Cross-cutting — governs the **new ₹1,499 subscription** auth surface; existing ₹99/₹499/one-time ₹1,499 paths already meet standard A today and would only be affected if a future decision changes them.

---

### AUTH-PO-11 — Should `/api/auth/session` be removed or permanently disabled?

**Why PO decision required:** This is the core remediation of the audit's critical finding. Removing it may break the current Client Finder login UI for any user relying on it today; the PO must weigh immediate risk closure against short-term login disruption and decide the cutover approach.

**Options:**
- **A.** Remove immediately, before shipping any replacement — accept that Client Finder login is broken until AUTH-PO-01/02/03 decisions are implemented.
- **B.** Disable immediately (return 410/404) and ship a replacement login (per AUTH-PO-01) in the same change, so there is no user-facing gap.
- **C.** Leave it live temporarily behind a feature flag/allowlist while a replacement is built, then remove.
- **D.** Keep it indefinitely, accept the risk (not recommended).

**Engineering recommendation:** **B.** This is a critical authentication bypass (any registered email → full session, no proof of ownership) with live production exposure (it's what the current `LoginForm.tsx` calls). It should not remain reachable any longer than it takes to ship its replacement. A is also acceptable if the PO prioritizes closing the hole over any downtime. D is explicitly not recommended — it leaves a confirmed account-takeover path open with no mitigating control.

**Consequences:**
- A: Fastest risk closure; Client Finder has no working login until the replacement ships (scope/sequencing risk if the replacement takes longer than expected).
- B: No risk window and no downtime, but requires sequencing the removal and the replacement as one coordinated change.
- C: Keeps the hole open for a bounded extra period (flag/allowlist adds its own complexity and can be misconfigured).
- D: Live exploitable account-takeover vulnerability remains indefinitely.

**Security implications:** This is the single highest-severity item in the whole questionnaire — it is a confirmed, trivially exploitable authentication bypass, not a theoretical risk.

**Product impact:** **New ₹1,499 subscription** Client Finder login UI directly. Does **not** affect ₹99/₹499/one-time ₹1,499 webhook/payment/entitlement logic, Razorpay subscription billing, K1, or contact-unlock — those are unaffected by this endpoint per fact #8/#9.

---

### AUTH-PO-12 — Which production email provider should be used?

**Why PO decision required:** This is a vendor/cost/ops decision (pricing, deliverability reputation, existing vendor relationships) outside engineering's authority to pick unilaterally, and it blocks AUTH-PO-02/06/07 from being usable in production regardless of which options are chosen there.

**Options:**
- **A.** Resend.
- **B.** Amazon SES.
- **C.** Postmark.
- **D.** Continue with Gmail SMTP dev sender but explicitly permit it in production (not recommended — code currently hard-blocks this via `NODE_ENV === 'production'` check, and Gmail SMTP is not designed for transactional production volume/deliverability).

**Engineering recommendation:** No preference between A–C from a technical-correctness standpoint — all three are viable transactional providers and would slot into the existing `createClaimEmailSender()` factory with a new implementation. This is primarily a cost/vendor decision for the PO. D is not recommended regardless of cost, since the code deliberately refuses it in production today and Gmail SMTP has no deliverability/volume guarantees.

**Consequences:** Whichever provider is chosen, implementation cost is similar (one new sender class + API key config); no existing code needs to change to accommodate any of A/B/C.

**Security implications:** Provider API keys must be stored as secrets, not committed; this is a standard operational requirement regardless of provider chosen.

**Product impact:** Blocks **new ₹1,499 subscription** checkout verification (AUTH-PO-02), reset (AUTH-PO-06), and resend (AUTH-PO-07) from functioning in production. Also blocks production delivery of **existing ₹99 claim-link** emails today — this is a pre-existing gap, not newly introduced by this remediation.

---

### AUTH-PO-13 — Should Client Finder login and `/access/login` ultimately be consolidated?

**Why PO decision required:** This is a product-information-architecture decision (one login surface vs. two) with roadmap/sequencing implications; it is not required to close the AUTH-PO-11 vulnerability and should not block it.

**Options:**
- **A.** Yes, consolidate into a single login surface/endpoint for all products, as a follow-up after the critical bypass (AUTH-PO-11) is closed.
- **B.** Yes, but only after AUTH-PO-01-03 decisions are implemented and stable for the ₹1,499 subscription specifically.
- **C.** No, keep them separate indefinitely (different products, different entry points is an acceptable product shape).

**Engineering recommendation:** **B**, as a deliberately separate, later-scoped piece of work. Consolidating now would couple an urgent security fix (AUTH-PO-11) to a larger refactor, increasing the time the critical vulnerability stays open. Once the new ₹1,499 subscription flow is password-based and stable, consolidating with `/access/login` (which already uses the same `/api/auth/login` endpoint) becomes a straightforward UI/routing change, not a new auth mechanism.

**Consequences:** A/B unify support documentation and reduce long-term maintenance of two login UIs; C keeps scope smaller per change but leaves two surfaces to secure/update in parallel going forward.

**Security implications:** None directly — both surfaces would end up calling the same already-audited `/api/auth/login` logic. Any benefit is in reduced long-term drift risk (two UIs could silently diverge in security posture over time, which is exactly how AUTH-PO-11's bypass came to exist as "an additional, weaker authentication path" alongside the correct one).

**Product impact:** Cross-cutting UI/routing only — **not** required for, and should not block, remediation of **new ₹1,499 subscription** login (AUTH-PO-11).

---

## Part 3 — Decision Record (to be completed by Product Owner)

| Decision ID | PO Choice | Date | Notes |
|---|---|---|---|
| AUTH-PO-01 | | | |
| AUTH-PO-02 | | | |
| AUTH-PO-03 | | | |
| AUTH-PO-04 | | | |
| AUTH-PO-05 | | | |
| AUTH-PO-06 | | | |
| AUTH-PO-07 | | | |
| AUTH-PO-08 | | | |
| AUTH-PO-09 | | | |
| AUTH-PO-10 | | | |
| AUTH-PO-11 | | | |
| AUTH-PO-12 | | | |
| AUTH-PO-13 | | | |

No implementation, migration, requirement change, commit, push, or deployment is authorized by this document. Implementation planning begins only after this table is completed.
