# ₹99 Kit — Email-Delivered Claim/Setup Link — Product Owner Decision (Amends `DEC-010` item 4)

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `DEC-014` (continues the register; last entry before this is `DEC-013`) |
| Date | 2026-10-07 |
| Type | Governance decision record — **amends `DEC-010` item 4, narrowly.** Not an implementation, schema, migration, validation, deployment, or release authorization (see §9). |
| Decision status | **FULLY DECIDED. Decisions 1–5 are all now DECIDED.** Decisions 2–4, previously recorded as PENDING, were resolved by the Product Owner in a follow-up to this same record (2026-10-07, same day). No new decision ID was created for this resolution — it updates `DEC-014` in place, as instructed. |
| Resolves | All of Decision 1–5 from `NINETY_NINE_KIT_EMAIL_CLAIM_PRODUCT_OWNER_DECISION_PREPARATION.md` §5/§6–§9. Nothing from that preparation record remains open. |

### Decision summary

| # | Decision | Status |
|---|---|---|
| 1 | Initial claim mechanism | **DECIDED: B — email-delivered claim/setup link** |
| 2 | Claim-link lifetime (TTL) | **DECIDED: 24 hours from issuance**, subject to the existing single-use constraint |
| 3 | Resend/reissue | **DECIDED: allowed, with rate limiting** (exact rate-limit values are an engineering implementation detail, not decided here) |
| 4 | Multiple claim links | **DECIDED: latest claim link wins** — issuing a new link invalidates the previous unused link; an already-consumed claim remains single-use and cannot be reused regardless |
| 5 | Existing-account behavior | **DECIDED: CONFIRMED, unchanged from current implementation** |

## 2. Decision authority

**Product Owner.** The decision in §4 was supplied directly by the Product Owner in this session and is recorded here without improvement, reinterpretation, or added mechanics beyond what was explicitly stated.

## 3. Historical `DEC-010` text — preserved, not rewritten

`DEC-010` (`NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md`) item 4 reads, verbatim, unchanged, and still in force as the historical record of what was decided on 2026-10-06:

> ### 4 — Email
> **DECIDED: NOT A LAUNCH DEPENDENCY.** Email delivery (confirmation email, access-link email, etc.) is not required for ₹99 launch. It may be implemented in a later phase. No part of the launch-critical path may depend on an email being sent or received.

**This record does not edit, delete, or replace that text.** `DEC-010`'s file is untouched by this record. This record instead adds a narrower, later-in-time decision that supersedes item 4 *for one specific step only* — the initial claim/account-activation step — exactly as described in §4 below. Everywhere `DEC-010` item 4's original language ("confirmation email," "access-link email," general "launch-critical path") refers to anything other than that one step, it remains fully in force, unamended.

## 4. DECIDED — the amendment

**For initial ₹99 account activation, a verified payment entitlement must be claimed through a single-use claim/setup link delivered to the canonical purchase email. Initial account creation and entitlement-to-user linkage require successful validation of that claim.**

Email is therefore **launch-critical specifically for initial claim/account activation** — and only for that step.

### Scope of the amendment (narrow — what changes)

- `DEC-010` item 4's "not a launch dependency" status is withdrawn **only** with respect to the single step of initial claim/setup-link delivery and validation, as described above.
- The claim/setup link replaces the current same-browser/order-ID mechanism ([claim-token/route.ts](../apps/web/app/api/payments/claim-token/route.ts), [claim/[razorpayOrderId]/page.tsx](../apps/web/app/claim/%5BrazorpayOrderId%5D/page.tsx)) as the only path by which initial account creation may occur. Possession of a `razorpayOrderId` value alone no longer establishes account-creation authority (see §7, security rationale).

### Explicitly NOT broadened (what does not change)

This decision does **not** make email launch-critical for, and does not reopen:

- General email notifications of any kind.
- Password recovery / "forgot password" flows.
- Ongoing email communication with buyers.
- Marketing email.
- Purchase receipts.
- Any future account-recovery mechanism beyond initial claim.

`DEC-010` item 5 ("account login is the recovery mechanism; email-based recovery is explicitly not a launch dependency") remains **fully in force, unamended** — recovery after the account already exists is a separate concern from initial activation and is not touched by this record.

## 5. Preserved decisions — explicitly not reopened

The following remain exactly as previously decided, unaffected by this amendment:

- **`DEC-010` items 1, 2, 3, 5, 6, 7** — in-app library delivery model; account+password as the access-authorizing mechanism; kit contents (downloadable files + deferred web workflow/tool, per `DEC-012`); lost-access recovery via login (not email); Razorpay reconciliation remains launch-blocking; no refund/cancellation.
- **`DEC-011` items 1–10, in full** — purchase email is the sole canonical account email; account-setup screen displays it pre-populated; buyer never retypes it; the email field is disabled/non-editable; the buyer's only required input is the password; the browser cannot substitute a different email by any client-side means; the server derives the account email exclusively from verified purchase/claim context, never from client input; the resulting account email equals the verified purchase email with no exception; email cannot be changed during initial setup; changing it after creation remains out of scope for launch.
- **No separate username** — the account is identified by the verified purchase email alone; this record introduces no username concept.
- **Entitlement-to-user linkage** — entitlement ownership remains linked to the authenticated user exactly as `DEC-010`/`DEC-011` already establish; this record changes only how the claim proving that linkage is delivered, not the linkage model itself.
- **`DEC-012`** — the ≥10-downloadable-asset requirement and the web-based workflow/tool's deferral from ₹99 launch scope, unchanged.
- **`DEC-013`** — the approved 3-asset current bundle under the 10+-asset architecture, unchanged.
- **Decision 5 — Existing-account behavior — CONFIRMED, unchanged.** If the verified purchase email already belongs to a `users` row: no duplicate account is created; the verified paid entitlement is linked to that existing user; subsequent access requires normal login (no session is minted for an unauthenticated claimant of an existing account). This is already implemented in [signup/route.ts:129-139](../apps/web/app/api/auth/signup/route.ts:129) and is **preserved unchanged** — this logic reads the claim token's server-derived email the same way regardless of delivery channel, so it requires no modification under this decision.

## 6. Decisions 2–4 — now resolved (previously pending)

All three sub-decisions raised in `NINETY_NINE_KIT_EMAIL_CLAIM_PRODUCT_OWNER_DECISION_PREPARATION.md` §6–§8, and left `PENDING PRODUCT OWNER DECISION` in the initial version of this record, have now been decided by the Product Owner. Each entry below distinguishes the **Product Owner decision** (what was decided) from the **engineering implementation detail** (what remains open for engineering to design — not decided here).

### 6.1 Claim-link lifetime (Decision 2) — **DECIDED: 24 hours**

**Product Owner decision:** the email-delivered claim/setup link remains valid for **24 hours from issuance**, subject to the existing single-use constraint (§6.4) — once consumed, or once 24 hours elapse, whichever comes first, the link is no longer valid.

This supersedes the same-session `CLAIM_TOKEN_TTL_MS = 30 * 60 * 1000` (30 minutes) constant's applicability to the email-delivered flow — [claimToken.ts:16](../packages/core-entitlements/src/claimToken.ts:16) was designed for "return to a slow checkout tab," not email transit/delivery delay, and 24 hours is the Product Owner's selected replacement value for that flow.

**Engineering implementation detail, not decided here:** whether the existing `CLAIM_TOKEN_TTL_MS` constant is changed in place, or a new constant is introduced for the email-delivered path (e.g., if any same-session path is retained elsewhere) — that is an implementation choice for a future engineering change, once implementation is authorized.

### 6.2 Resend/reissue (Decision 3) — **DECIDED: allowed, with rate limiting**

**Product Owner decision:** the buyer must have a way to request/reissue the claim email if the original is not received or is no longer usable. Resend/reissue is permitted. Rate limiting is required on this capability to prevent abuse.

**Engineering implementation detail, not decided here:** the exact rate-limit values (request count, window, scope — e.g., per order, per email, per IP), the resend endpoint's shape, and how a buyer re-identifies their order to request a resend. None of these are invented in this record; the repository's existing `@acos/rate-limit` package and `CLAIM_TOKEN_IP_POLICY` pattern ([claim-token/route.ts:2](../apps/web/app/api/payments/claim-token/route.ts:2)) are the kind of existing mechanism such a resend endpoint would likely reuse, but selecting or configuring it is an implementation step, not a governance decision.

### 6.3 Multiple claim links (Decision 4) — **DECIDED: latest claim link wins**

**Product Owner decision:**
- When a new claim link is issued for an order, the previous unused claim link becomes invalid.
- Only the newest issued claim link remains valid at any given time.
- A successfully consumed claim link remains single-use — once claimed, it cannot be reused, regardless of whether a newer link was later issued.
- An already-consumed claim cannot be reused under any circumstance.

**Engineering implementation detail, not decided here:** the mechanism by which a prior unclaimed token is invalidated when a new one is minted (e.g., marking prior `claim_tokens` rows for the order as voided, or deleting them) — `saveClaimToken`/`findClaimToken` currently key off the token hash, not the order, so this requires an order-scoped lookup/invalidation step that does not exist yet. That implementation is not authorized by this record (§9).

### 6.4 Claim-token security properties — unchanged, reconfirmed

Independent of the TTL/resend/multi-link values now decided above, the claim token itself must remain (already true of the existing `claimToken.ts` primitive, unaffected by Decisions 2–4):

- Tied to a specific, verified, paid entitlement (never mintable without one — `claim-token/route.ts` already requires an existing `entitlements` row for the order before minting).
- Single-use (`markClaimTokenClaimed`'s atomic claim, already implemented) — preserved exactly as-is by Decision 4's "already-consumed claim cannot be reused."
- Server-generated (`mintClaimToken`, `randomBytes(32)`) — never client-supplied.
- Server-validated (`evaluateClaimToken`, `claimTokenHashesMatch`'s constant-time compare) — never trusted on the client's say-so.
- Incapable of being substituted for another purchaser's entitlement — the token is bound at mint time to one `orderId` and its server-derived `customerEmail`.

## 7. Security/identity rationale (analyst finding, recorded for context — not itself a new decision)

The prior audit traced the current mechanism: payment confirmation redirects the same browser to `/claim/{razorpayOrderId}`, which self-mints a claim token on page load, gated only on "does an entitlement exist for this order." This proves *possession of a `razorpayOrderId` value*, not *possession/control of the purchase email inbox*. Those properties coincide in the common case (same buyer, same browser, immediately post-payment) but diverge whenever the order ID is observable to someone other than the buyer before it is claimed (shared devices, screen-share support sessions, browser history, leaked logs). The Product Owner's stated requirement — that the buyer must not "establish ownership merely by knowing a Razorpay order ID" — is precisely the gap this amendment closes: the single-use email-delivered link inserts an inbox-control check between verified payment and account creation, which order-ID knowledge alone does not provide.

## 8. Engineering implications (recorded for context — implementation not authorized by this record)

At minimum, the following would require engineering design once a successor record authorizes implementation:

- `CheckoutPanel.tsx`'s post-payment redirect to `/claim/{razorpayOrderId}` must stop issuing a claim token directly; the same-session flow must instead present a "check your email" state.
- The claim-token mint trigger must move from "browser requests it" to "server sends it," at the point an entitlement is confirmed (webhook or reconciliation).
- The `/claim/[razorpayOrderId]` page's claim-token-fetch-on-mount behavior must change to consuming a token delivered via the emailed link's own URL, not self-minting one.
- A resend endpoint and multiple-link invalidation logic, if and when §6.2/§6.3 are resolved.
- The existing `claimToken.ts` primitives (`mintClaimToken`, `evaluateClaimToken`, `markClaimTokenClaimed`) and the existing-account branch in `signup/route.ts` require **no redesign** — only the issuance trigger and delivery channel change.
- **Email infrastructure dependency:** no transactional email-sending infrastructure (provider, SMTP service, sender address, API credentials, or related environment variables) exists anywhere in this repository today. This decision records that gap as a required implementation dependency. **This record does not select** a provider, sender address, SMTP service, API credentials, or environment variable names/values — those remain separate, future decisions (Product Owner and/or engineering, as appropriate) unless already established elsewhere in the repository, which they are not.

## 9. NOT AUTHORIZED

This record does not authorize, and nothing in it should be read as authorizing:

- Any modification to application code, routes, or the claim-token implementation.
- Any schema or migration change.
- Any email provider integration, SMTP configuration, API credentials, or environment variable addition.
- Any modification to tests.
- Any email provider/infrastructure addition or rate-limit implementation change.
- Selection of exact rate-limit values, resend-endpoint design, or token-invalidation mechanics for Decisions 3–4 — those remain engineering implementation details (§6.2, §6.3), not decided here.
- Validation, deployment, release, or launch of any kind.
- Any commit or push.

**Implementation is NOT authorized by this record**, even though Decisions 1–5 are now fully decided. A successor record or explicit engineering authorization is required before any code, schema, route, rate-limit, or configuration change may begin.

## 10. No authorization statement (restated)

This record amends `DEC-010` item 4 narrowly (initial claim/account-activation only), preserves `DEC-010` items 1–3 and 5–7 and all of `DEC-011` unchanged, preserves `DEC-012`/`DEC-013`, and preserves the already-implemented existing-account linkage behavior. **Decisions 1–5 are now all DECIDED** (24-hour TTL; resend/reissue allowed with rate limiting; latest-link-wins invalidation). The only matters left open are engineering implementation details explicitly called out in §6.1–§6.3 (exact rate-limit values, resend-endpoint shape, token-invalidation mechanics) — none of which required a further Product Owner decision per the instruction resolving this record. It is not committed or pushed.
