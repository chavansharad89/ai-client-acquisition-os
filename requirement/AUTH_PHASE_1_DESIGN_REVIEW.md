# Phase 1 Design Review — Security + Governance Consistency Check

**Status: REVIEW ONLY.** No application code, migration, database row, test, or fixture was created, modified, or deleted in producing this document. No commit, push, or deployment was made.

**Date:** 2026-10-10.
**Reviewed artifact:** `requirement/AUTH_PHASE_1_PURCHASE_IDENTITY_ACTIVATION_DESIGN.md`.
**Reviewed against:** AUTH-PO-01→30 and COMMERCIAL-PO-01→18, as recorded (verbatim, re-read in full for this review, including both addenda) in `requirement/FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md`; the current repository implementation (re-inspected directly, not assumed from the design doc's own citations); `requirement/AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md`; and the just-completed Phase 0 shared-gate implementation (`packages/core-subscriptions/src/access.ts`).

---

## A. EXECUTIVE VERDICT

**PASS WITH REQUIRED CHANGES — specific design corrections required before implementation authorization.**

The design is sound at the architecture level and correctly represents 28 of 30 AUTH-PO decisions (the remaining two are decisions the design is explicitly authorized to defer, not contradict). One finding from the design's own self-review is independently **confirmed as CRITICAL and correct** by this pass — the design's Phase 1a/Phase 1b ordering must be preserved and treated as a hard gate, not a convenience. One **new HIGH finding**, not previously identified by the design or by any prior audit, is raised in this review: the design's activation-eligibility check for ₹1,499 must call Phase 0's shared gate function rather than re-deriving its own query, or it reintroduces the exact split-brain pattern Phase 0 was built to eliminate.

---

## B. PO CONSISTENCY MATRIX

| ID | Topic | Verdict | Note |
|---|---|---|---|
| AUTH-PO-01 | Purchase-first, no account before payment | PASS | Dormant row explicitly carved out as "not login-capable, not an account" per AUTH-PO-25's own text (§2.2 of the governance audit) |
| AUTH-PO-02 | Email verified only by activation-link consumption | PASS | `email_verified_at` set exactly once, only at consume (design §2, §4) |
| AUTH-PO-03 | Signup/profile fields | PASS | All required fields present in design §4 step 8, §10; DOB optional as specified |
| AUTH-PO-04 | Always reuse existing account by exact email | PASS | §3, §7 |
| AUTH-PO-05 | Repeat-purchase entitlement isolation | PASS | Explicitly unchanged/preserved (design §7 case F) |
| AUTH-PO-06 | Payment valid independent of activation; 24h/single-use/latest-wins | PASS | §5 |
| AUTH-PO-07 | Generic, rate-limited activation resend | PASS | §5, §11 — explicit contrast drawn with the existing non-generic `claim-link/resend` route |
| AUTH-PO-08 | Email+password normal login | PASS | Correctly identified as already-correct, unchanged (§1.2) |
| AUTH-PO-09 | Set password if null; never overwrite existing | PASS | §4 step 8, §7 case A |
| AUTH-PO-10 | Strict account-enumeration prevention, unauthenticated endpoints | PASS (new endpoints) / non-blocking gap (legacy endpoint) | See Finding LOW-1 below — the pre-existing `claim-link/resend` leak is left untouched, which is defensible scope but worth naming explicitly rather than leaving implicit |
| AUTH-PO-11 | Permanently disable email-only session mint | GAP (correctly, by authorization) | The authorization itself says "do NOT implement that retirement yet" — the design does not implement it, and is not required to. This is an authorized gap, not a flaw |
| AUTH-PO-12 | Resend as production email provider | GAP (documentation fidelity only) | See Finding MEDIUM-1 |
| AUTH-PO-13 | One account → one auth model → one login experience | PASS | End-state design converges here |
| AUTH-PO-14 | Confirms 01; forbids client-supplied id | PASS | §6 |
| AUTH-PO-15 | Immutable purchase email, identity chain | PASS | §3, §6 |
| AUTH-PO-16 | Existing account: reuse, skip signup if password set, auto-login | PASS | §7 case A, §4 step 8 |
| AUTH-PO-17 | Existing + password: never block on missing profile fields | PASS | §7 case A |
| AUTH-PO-18 | Different email = different identity, no auto-merge | PASS | §6, §7 |
| AUTH-PO-19 | Unactivated subscription continues normal lifecycle | PASS | §13 |
| AUTH-PO-20 | Renewal proceeds regardless of activation state | PASS | §13 "RENEWAL WITHOUT ACTIVATION" |
| AUTH-PO-21 | No fixed deadline; eligible while active; 24h per-link TTL | PASS | §5 |
| AUTH-PO-22 | Activation allowed while active, not once ended | PASS | §5 `isEligibleForActivation`, §13 "EXPIRED SUBSCRIPTION" |
| AUTH-PO-23 | Cancellation doesn't shorten current period | PASS (vacuously) | No cancellation mechanism exists or is built (COMMERCIAL-PO-16) — nothing in the design could violate this even in principle |
| AUTH-PO-24 | Renewal failure ends eligibility only at actual expiry, no grace | PASS | §5 — eligibility is purely the stored period computation, no grace logic anywhere |
| AUTH-PO-25 | Dormant/password-less row, Option A | PASS | This is the design's own central mechanism (§3) |
| AUTH-PO-26 | Use existing computed-period model, not live Razorpay lookup | PASS, with a required correction | The *principle* is followed (no live Razorpay call anywhere in §5) but the *specific query* should reuse Phase 0's exported function rather than being re-derived independently — see Finding HIGH-1 |
| AUTH-PO-27 | Unified activation behavior across all 3 products | PASS | §9 |
| AUTH-PO-28 | Existing password-less dev accounts may be removed | N/A, correctly out of scope | Design neither performs nor blocks this cleanup |
| AUTH-PO-29 | Purchase-and-activation flow, all 3 products, 10-step | PASS | §4 maps almost 1:1 onto AUTH-PO-29's own 10 steps |
| AUTH-PO-30 | Unified activation-link onboarding; retire legacy claim-token onboarding for new purchases | PASS | §5's "Key Design Question" resolution, §9, §11 — `claim_tokens` explicitly frozen for legacy only |

**COMMERCIAL-PO, where relevant:**

| ID | Relevance | Verdict |
|---|---|---|
| COMMERCIAL-PO-07 | "Don't silently change ₹99/₹499 functionality" | PASS — retiring legacy claim-token onboarding for new 99/499 purchases is an explicit AUTH-PO-30 decision, not an inference; the governance doc's own §B2 already settles that this is not a COMMERCIAL-PO-07 violation, and this review concurs |
| COMMERCIAL-PO-16 | Cancellation out of scope; no cancellation auth mechanism required | PASS — design builds none |
| COMMERCIAL-PO-01→05, 08→15, 17, 18 | Entitlement/pricing/SKU model | N/A — correctly untouched; the design never changes `entitlements`, `subscription_periods` semantics, pricing, or catalog |

**No PO decision is contradicted. No new PO question needs to be raised** — both gaps found (AUTH-PO-11, AUTH-PO-12) are gaps the authorization itself already expects at this phase, not omissions the design introduced.

---

## C. SECURITY FINDINGS

### CRITICAL-1 — Confirmed: dormant-row creation must not ship ahead of a guard on `POST /api/auth/session`

**Evidence (re-verified directly against the file, not assumed from the design doc):** `apps/web/app/api/auth/session/route.ts:51-70` — `POST` resolves `identity.findUserByEmail(email)` and, if found, calls `mintUserSession(identity, { id: user.id, email: user.email })` directly. **There is no reference to `password_hash`, no call to `verifyPassword`, and no other check anywhere in this function.** `mintUserSession` itself (`packages/core-identity/src/session.ts:104-118`) also performs no such check — it mints for any `{id, email}` it is handed, by design (its doc comment confirms this is deliberate, for the *already-provisioned* case).

**Why it matters:** Today, the only way a `users` row comes into existence is `apps/web/app/api/auth/signup/route.ts:147`, reached only *after* a real purchase and a real password hash have already been set — so `/api/auth/session`'s lack of a password check is currently latent (every row it could possibly mint a session for already has a password, even though the route never checks one). The design's own Phase-1 mechanism (§3) changes this precondition: `findOrCreate(users, email)` at checkout time means a `users` row now exists for **any email a visitor types into a checkout form**, before any payment clears. The moment that lands, `/api/auth/session` can mint a session for that row with zero proof of ownership — worse than the base AUTH-PO-11 finding, because no purchase is even required to reach it, only an abandoned checkout attempt.

**Cross-check against the existing governance record:** `requirement/FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md` §16 ("Recommended Implementation Sequencing") lists step 1 as the dormant-row mechanism and step 3 as AUTH-PO-11's removal, with no caveat connecting the two — **that sequencing, if followed literally, reopens exactly this hole.** This is not a defect in that document (its own §5 explicitly notes "13 explicitly does not require 11 to wait" — but that statement is about AUTH-PO-13's end-state requirement, not about AUTH-PO-25's dormant-row mechanism, which did not exist as a decision at the time that consistency note was written). This review independently confirms the design's own finding is correct, not already covered by existing governance text, and not an artifact of the design's own framing.

**Exact design correction required:** none — the design already states this correctly (§8, §14 invariant 17, §17 Phase 1a). **This review's required action is to keep Phase 1a as a hard, sequenced prerequisite of Phase 1b, and to add one clarification**: the governance document's own §16 sequencing should be read as superseded on this one point by the design's Phase 1a/1b split, since §16 pre-dates AUTH-PO-25 being combined with knowledge of `/api/auth/session`'s exact implementation. No new PO decision is needed (the *effect* — AUTH-PO-11 must eventually remove the route entirely — is already decided; this is purely an implementation-sequencing fact).

### HIGH-1 — Activation eligibility must reuse Phase 0's shared gate function, not re-derive its own query

**Evidence:** `packages/core-subscriptions/src/access.ts:37-43` exports `findActiveClientFinderSubscriptionPeriod(deps, userId, now)` — created specifically in the just-completed Phase 0 work, whose own doc comment (lines 26-35) states its reason for existing: *"`hasClientFinderAccess`, `getClientFinderSubscriptionStatus`, and leadUnlockService's `unlockOpportunityForOwner`... all resolve through this function instead of each independently re-querying — previously they did not, which is the split-brain risk `AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md` §15 item 1 flagged."*

The Phase 1 design's §5 defines `isEligibleForActivation(userId, now)` with its own inline pseudocode:
```
EXISTS (subscription_periods WHERE user_id = userId AND refunded_at IS NULL AND activation_at + duration_days > now)
```
This is a **fourth independent re-derivation** of the exact query Phase 0 just consolidated into one function, for the exact same product/table. If a future engineer implements this literally, any later change to the ₹1,499 access rule (an additional guard clause, a grace-period exception, whatever) that lands in `access.ts` but not in this separately-written activation-eligibility query will silently drift — precisely the failure mode Phase 0 exists to prevent.

**Why it matters:** this does not weaken any security invariant by itself (both queries currently compute the same thing), but it reopens the architectural risk Phase 0 was authorized specifically to close, in a brand-new fourth call site, in the very next phase after Phase 0 landed.

**Exact design correction required:** §5 and §9 of the design must be amended so that the ₹1,499 leg of `isEligibleForActivation` calls `findActiveClientFinderSubscriptionPeriod(deps, userId, now)` (returning non-null = eligible) instead of writing an independent `EXISTS` clause. The ₹99/₹499 leg (`entitlements.revoked_at IS NULL`) has no equivalent shared-gate function yet and may remain as designed — there is no Phase 0 precedent to violate there.

### MEDIUM-1 — §12 should name AUTH-PO-12 (Resend) explicitly, not leave the production-provider decision unattributed

**Evidence:** AUTH-PO-12 (`FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md:47`) reads "Resend as production email provider; preserve an email abstraction." The design's §12 correctly states that no Resend integration exists in the repository today (independently re-verified by this review — the only "resend" hits anywhere in the codebase are the unrelated `claim-link/resend` route name and rate-limit policy identifiers) and correctly declines to invent one, per the authorization's own instruction. But §12's text frames this as a generic, unattributed "pre-existing gap," without naming that the eventual provider is already decided to be Resend specifically.

**Why it matters:** low — this is a documentation-fidelity point, not a security or architecture issue. A future reader of the design doc alone, without cross-referencing AUTH-PO-12, could reasonably (and incorrectly) treat provider selection as still open.

**Exact design correction required:** one sentence added to §12: "the eventual production provider is already decided (AUTH-PO-12: Resend) — this phase does not wire it, consistent with the authorization's instruction not to invent provider configuration values." Not blocking; recommended before authorization for traceability, not required for safety.

### LOW-1 — Existing `claim-link/resend` enumeration leak is left untouched (correctly scoped, worth stating explicitly)

Already a pre-existing condition (`apps/web/app/api/payments/claim-link/resend/route.ts:83-108`, 404 on unknown order / 409 on unpaid order), not introduced by this design. The design's §1.3/§11 correctly identify it as a contrast case and correctly do not extend or reuse its pattern for the new endpoint. Leaving the legacy route as-is is defensible given AUTH-PO-30 scopes the new mechanism to *new* purchases and AUTH-PO-28/COMMERCIAL-PO-14 classify the data behind the legacy route as dev-only/removable. Non-blocking.

### LOW-2 — Activation-consume's generic-response collapsing is stricter than AUTH-PO-07/10 require (not wrong, just conservative)

The design's §5 collapses all four internal rejection reasons (`unknown` / `expired` / `already-consumed` / `superseded`) into one generic HTTP response at the **consume** endpoint. AUTH-PO-07/10's enumeration concern is about **identifier-based** requests (an attacker supplying an email or similar and learning whether it exists) — a party that already possesses a specific, unguessable 256-bit token is not in an enumeration position by holding it, so revealing e.g. "this link was already used" vs. "this link is invalid" at consume time would not violate AUTH-PO-10. This is not a defect — collapsing to one generic message is strictly safe — but it is a UX-conservatism choice the design states as if it were a hard security requirement. Non-blocking; may be relaxed during implementation without reopening any invariant.

---

## D. PHASE ORDER

**Confirmed, with one clarification.** The design's sequencing (§17: 1a → 1b → 2 → 3 → 4, with 5 and 6 flexible) is correct and should be preserved as-is, with:

- **Phase 1a is a hard prerequisite of Phase 1b** — confirmed necessary by Finding CRITICAL-1, not merely a nice-to-have. This also **corrects** (does not contradict) the pre-existing recommended sequencing in `FINAL_AUTHENTICATION_AND_COMMERCIAL_MODEL_GOVERNANCE_AUDIT.md` §16, which did not have this ordering constraint because it was written before AUTH-PO-25 was combined with a direct inspection of `/api/auth/session`'s exact (lack of) password check.
- **Clarification (non-blocking):** Phase 1a does not need to ship as a separate, earlier release from 1b — it needs to be live in the **same deployed state** no later than 1b. Shipping both in one atomic change is equally safe; the requirement is "the guard must never be absent while dormant-row creation is possible," not "1a must be a temporally separate rollout."
- **Phase 3 (`activation_tokens` schema + pure primitives)** has no dependency on 1a/1b/2 at all — it is pure additive schema and pure functions. It may be built, and even merged, in parallel with or ahead of 1a/1b, with no ordering risk. The design's own table (§17) already shows this correctly (Phase 3's only listed dependency is Phase 2, which is slightly stricter than necessary — Phase 3 could precede Phase 2 too — but this is a non-blocking scheduling observation, not a correctness issue).
- **No other ordering dependency** was found beyond what the design already states. Phase 5 (profile columns) is correctly flagged as independent of everything else. Phase 6 (subscription-path activation trigger) correctly depends on both 2 and 3.

---

## E. REQUIRED DESIGN CHANGES

Only items that must change before implementation authorization:

1. **(HIGH-1)** §5 and §9: `isEligibleForActivation`'s ₹1,499 leg must call `findActiveClientFinderSubscriptionPeriod` (`packages/core-subscriptions/src/access.ts:37-43`) rather than independently re-deriving the `subscription_periods` query. This is the one substantive architectural correction this review requires.
2. **(CRITICAL-1, already present, reconfirm only)** Phase 1a must remain a hard, enforced prerequisite of Phase 1b in whatever implementation plan follows this design — no change to the design's own text is needed here, since it already states this; this item exists in this list only so the requirement is not lost in translation when an implementation plan is written from this design.

No other change is required before authorization.

---

## F. NON-BLOCKING OBSERVATIONS

1. **(MEDIUM-1)** Name AUTH-PO-12 explicitly in §12 for traceability. Cosmetic; does not affect safety or correctness.
2. **(LOW-1)** The legacy `claim-link/resend` route's enumeration leak remains unfixed — correctly out of scope, worth a one-line acknowledgment in a future implementation plan so it is not mistaken for an oversight.
3. **(LOW-2)** Activation-consume's reason-collapsing is more conservative than strictly required by AUTH-PO-07/10; may be relaxed during implementation (e.g., distinguishing "already used" from "invalid/expired") without reopening any invariant, since the token itself is never an enumeration vector.
4. Removing `requireUser()` from `create-subscription` makes that route reachable by any anonymous visitor, same as `create-order` already is today — the design does not propose new IP/abuse rate-limiting for checkout itself (only for the new activation endpoints). This is not a new gap relative to `create-order`'s existing, already-accepted guest-checkout convention, but worth a note in a future implementation plan.
5. Phase 3 (`activation_tokens` schema + primitives) can be scheduled independently of, and even ahead of, Phase 2 — the design's phase table lists Phase 2 as its only dependency, which is slightly stricter than the actual constraint.

---

## G. FINAL IMPLEMENTATION READINESS

**Phase 1 implementation is NOT yet authorized by this review.**

The design is structurally sound, faithful to all 30 AUTH-PO decisions (with the two expected, explicitly-authorized deferrals — AUTH-PO-11's full retirement and AUTH-PO-12's provider wiring — correctly left for a later phase), does not silently introduce any out-of-scope commercial/cancellation/credit/K1/SKU change, and correctly builds on top of Phase 0's shared access gate **once Required Change #1 (§E) is applied**. The one independently-confirmed CRITICAL finding (dormant-row creation must not precede a guard on the email-only session endpoint) is already correctly reflected in the design's own Phase 1a — this review's role there was verification, not correction.

**Before implementation authorization is granted, Required Change #1 (§E) should be folded into the design document** (a small edit to §5/§9 naming the exact function to call) so the eventual implementation plan is written against a design that cannot regress Phase 0's split-brain fix. Once that one edit lands, this reviewer's assessment is **PASS**.

No application code, migration, database row, test, or fixture was created, modified, or deleted in producing this review. No commit, push, or deployment was made.
