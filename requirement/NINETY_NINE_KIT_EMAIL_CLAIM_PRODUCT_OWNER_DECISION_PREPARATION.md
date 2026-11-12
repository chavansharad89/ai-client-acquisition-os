# ₹99 Kit — Email-Delivered Claim/Setup Link — Product Owner Decision Preparation

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `DEC-014-PREP` (prepares a decision for the register continuing `DEC-013`; this record is not itself a decision and does not consume the `DEC-014` slot) |
| Date | 2026-10-07 |
| Type | **Decision-preparation record only.** Not a decision, not an implementation, schema, migration, validation, deployment, or release authorization. |
| Purpose | Present the Product Owner with Decision 1 (and, conditionally, Decisions 2–5) on whether initial ₹99 account activation requires an email-delivered claim/setup link, following the read-only audit delivered earlier in this session. |
| Status | **AWAITING PRODUCT OWNER DECISION.** No choice recorded below is final until the Product Owner selects it in a successor record. |

## 2. Current architecture finding (repository fact, not opinion)

Traced end-to-end in the prior audit:

[CheckoutPanel.tsx:163](../apps/web/src/components/CheckoutPanel.tsx) → [claim/[razorpayOrderId]/page.tsx](../apps/web/app/claim/%5BrazorpayOrderId%5D/page.tsx) → [claim-token/route.ts](../apps/web/app/api/payments/claim-token/route.ts) → [signup/route.ts](../apps/web/app/api/auth/signup/route.ts).

- After a verified Razorpay payment, the same browser tab polls `/api/payments/status`, then is redirected client-side to `/claim/{razorpayOrderId}` — a value the browser already holds from checkout, not anything delivered through a separate channel.
- `/api/payments/claim-token` mints a single-use claim token for any caller that supplies a `razorpayOrderId` with an existing entitlement. It does not verify that the caller controls the order's associated email.
- The claim token is returned directly in the HTTP response to that POST request.
- `/api/auth/signup` correctly derives the account email only from the claim token server-side (`claimToken.ts`'s `customerEmail`), never from request input — this part is already compliant with `DEC-011` item 7 regardless of which Decision 1 option is chosen below.
- `mintClaimToken` / `evaluateClaimToken` / `markClaimTokenClaimed` ([claimToken.ts](../packages/core-entitlements/src/claimToken.ts)) are single-use, short-TTL (30 minutes), and server-email-derived by construction — this primitive is channel-agnostic and does not need to change shape under either Decision 1 option.
- No transactional email-sending infrastructure exists anywhere in the repository (`apps/`, `packages/`) — confirmed by search for mailer/SMTP/provider usage in the prior audit. Email delivery would be new infrastructure, not configuration of something existing.
- No resend/reissue mechanism exists today for any token type.
- No handling exists today for "multiple claim links requested for the same order."
- The existing-account path is already implemented: `signup/route.ts` links the entitlement to a pre-existing `users` row by email and returns `existing-account` without minting a session, directing the caller to log in instead — this is channel-agnostic and is preserved unchanged by this record (see §8).

## 3. Security/trust distinction (analyst finding, not a decision)

Two different properties are being conflated unless this decision separates them explicitly:

| Property | What proves it today | What it does NOT prove |
|---|---|---|
| "This HTTP request is tied to a paid, webhook-confirmed order" | Knowledge of a valid, unclaimed `razorpayOrderId` | — |
| "The person making this request controls the purchase email inbox" | **Nothing, today** | Order-ID possession is not email possession |

The current flow proves the first property only. For the common case (same buyer, same browser, immediately post-payment) the two coincide in practice. They diverge whenever the order ID is observable to someone other than the buyer before the buyer claims it — shared/kiosk devices, screen-share support sessions, browser history on a shared machine, or leaked analytics/logs. The `razorpayOrderId` is not treated as a secret anywhere in the current design (`claimToken.ts`'s own doc comment frames the claim token as "proof that a specific order's entitlement may be claimed," not proof of email ownership).

**Analyst/security recommendation:** Option B (email-delivered claim link) more directly satisfies the Product Owner's stated launch trust chain — "verified entitlement → possession of the purchase email → account creation" — because it inserts an inbox-control check between payment and account creation that Option A does not have. This is a recommendation only; the Product Owner decides.

## 4. Existing DEC-010 constraint (repository fact)

[`DEC-010`](NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md) item 4: *"Email delivery (confirmation email, access-link email, etc.) is not required for ₹99 launch... No part of the launch-critical path may depend on an email being sent or received."*

If Decision 1 selects Option B, the claim/setup step becomes part of the launch-critical path (account creation → library access) and would depend on an email being sent and received. **This is a direct conflict with `DEC-010` item 4 as currently written**, and selecting Option B requires an explicit future amendment to that item — not a reinterpretation, and not made in this record. This record does not modify `DEC-010` or `DEC-011`; see §12.

## 5. Decision 1 — Initial claim mechanism

**Product Owner choice required. Not decided here.**

| Option | Description | Consequence if selected |
|---|---|---|
| **A — Keep current same-browser/order-ID claim** | Payment confirmation in the checkout browser is sufficient for the buyer to obtain the claim token, exactly as implemented today. | No change to current implementation. `DEC-010` item 4 remains satisfied as-is. The order-ID-possession vs. email-possession gap in §3 remains accepted as-is. |
| **B — Require email-delivered claim/setup link** | After verified payment/entitlement, the server sends a single-use claim/setup link to the purchase email. Initial account creation is permitted only through that link — the same-browser redirect in `CheckoutPanel.tsx` would need to stop granting a claim token directly. | Requires: (a) a future amendment to `DEC-010` item 4 (§10), (b) new email-sending infrastructure (§9), (c) Decisions 2–5 below, (d) engineering changes described in §11. None of this is authorized by this record. |

Analyst/security recommendation: **B**, for the reason in §3. The Product Owner makes the final selection.

## 6. Decision 2 — Claim-link lifetime (only relevant if Decision 1 = B)

**Product Owner choice required. No value is proposed as a recommendation below — only engineering options, per instruction.**

Repository fact: `CLAIM_TOKEN_TTL_MS` is currently `30 * 60 * 1000` (30 minutes) — [claimToken.ts:16](../packages/core-entitlements/src/claimToken.ts), documented as "long enough to return to a slow checkout tab." That rationale assumes the buyer is already mid-session; it does not account for email transit/delivery delay, spam-folder discovery time, or a buyer opening the link from a different device later.

Engineering options for the Product Owner to choose among (none selected here):

| Option | Shape |
|---|---|
| Keep 30 minutes | No change to the existing constant; buyer must act on the email quickly after it arrives. |
| Extend to a fixed longer window (e.g., hours) | Same single-use/short-lived mechanism, larger TTL constant. Exact duration is a Product Owner value, not invented here. |
| Extend to a multi-day window | Trades leaked-link risk (longer exposure) for buyer convenience. Exact duration is a Product Owner value, not invented here. |
| Separate TTL constant for email-delivered tokens vs. same-session tokens (if Option A is kept for some path) | Two constants instead of one; only relevant if any same-session path survives alongside B. |

## 7. Decision 3 — Resend/reissue (only relevant if Decision 1 = B)

**Product Owner choice required.**

Repository fact: no resend/reissue mechanism exists for any token in the repository today. Building one is new work regardless of which option is chosen.

Options for the Product Owner to choose among (none selected here):

| Option | Shape |
|---|---|
| No self-service resend; manual/support-assisted recovery only | Smallest engineering scope. Buyer who loses the email must contact support. |
| Buyer can self-service request a new claim link (e.g., from a "resend" action tied to the order or purchase email) | Requires a new endpoint, its own rate-limiting, and a decision on how the buyer re-identifies their order (order ID again? email address lookup? — itself a sub-question if chosen). |
| Another bounded option the Product Owner specifies | Not proposed here; repository analysis does not surface a third established pattern to offer beyond the two above. |

## 8. Decision 4 — Multiple claim links (only relevant if Decision 1 = B)

**Product Owner choice required.**

Repository fact: no handling exists today for a second claim token being issued against the same order before the first is claimed or expired. `saveClaimToken`/`findClaimToken` as currently used key off the token hash, not off the order, so nothing today enforces single-link-per-order.

Options for the Product Owner to choose among (none selected here):

| Option | Shape |
|---|---|
| Latest link invalidates all previous links for that order | Requires the server to mark prior unclaimed tokens for the order as void when minting a new one. |
| Multiple valid links coexist until each expires or one is claimed | Simplest to implement on top of the current single-use-per-token design (first one claimed wins, others become `already-claimed`-equivalent via the entitlement already being linked) — but allows several live links to exist simultaneously. |
| Another bounded approach the Product Owner specifies | Not proposed here. |

## 9. Decision 5 — Existing-account behavior

**Not reopened.** Repository fact: `signup/route.ts` already implements this — if a `users` row exists for the verified purchase email, the entitlement is linked to that existing user (`entitlements.linkEntitlementsToUser`) and no session is minted; the caller is told to log in instead ([signup/route.ts:129-139](../apps/web/app/api/auth/signup/route.ts)). This logic reads the claim token's server-derived email the same way regardless of how that email was delivered (same-browser redirect today, or an emailed link under Option B) — nothing about it changes based on Decision 1's outcome. The audit found no conflict requiring this to be reopened, per the Product Owner's instruction.

## 10. Impact on DEC-010 if email claim is selected

If the Product Owner selects Decision 1 = B, this creates a **required future amendment to `DEC-010` item 4**, specifically:

- `DEC-010` item 4 currently states no part of the launch-critical path may depend on an email being sent or received.
- Option B makes the claim/setup step — and therefore initial account creation and first library access — depend on an email being sent and received.
- This record does **not** perform that amendment. A successor record must explicitly amend `DEC-010` item 4 (scoped narrowly to the initial-claim step, not to recovery/notifications generally, unless the Product Owner wants a broader reopening) before any implementation proceeds.
- `DEC-010` items 1, 2, 3, 5, 6, 7 and `DEC-011` items 1–10 are unaffected either way and are not reopened by this record or by a future amendment limited to item 4.

## 11. Engineering implications (engineering proposal, not a decision)

If Decision 1 = B is selected, at minimum the following would need engineering design (not performed here):

- `CheckoutPanel.tsx`'s post-payment redirect to `/claim/{razorpayOrderId}` would need to stop issuing a claim token directly; the same-session flow would instead show a "check your email" state.
- `/api/payments/claim-token` (or an equivalent server-side trigger) would need to send the email at mint time rather than return the token in the HTTP response.
- The `/claim/[razorpayOrderId]` page's claim-token-fetch-on-mount behavior would need to change to consuming a token from an emailed link's query parameter/path instead of self-minting one on load.
- New: an email-sending abstraction, a resend endpoint (if Decision 3 selects one), and multiple-link handling (if Decision 4 requires invalidation logic).
- The existing `claimToken.ts` primitive, `evaluateClaimToken`, `markClaimTokenClaimed`, and the existing-account branch in `signup/route.ts` require no redesign — only the issuance trigger and delivery channel change.

## 12. Explicit statement — no implementation authorized

**This record authorizes nothing.** Specifically, this record does not:

- Modify `DEC-010` or `DEC-011` in any way.
- Modify any code, route, schema, migration, test, or configuration.
- Add, select, or configure any email provider, SMTP service, sender address, API credential, or environment variable.
- Select a final value for claim-link TTL, resend policy, or multiple-link handling — §6–§8 present options only.
- Authorize validation, deployment, release, or launch of any kind.
- Commit or push any change.

**Next governance action:** the Product Owner selects Decision 1 (§5). If B is selected, the Product Owner (or a delegated follow-up) also selects Decisions 2–4 (§6–§8), and a successor record must perform the explicit `DEC-010` item 4 amendment (§10) before any engineering work on §11 begins.
