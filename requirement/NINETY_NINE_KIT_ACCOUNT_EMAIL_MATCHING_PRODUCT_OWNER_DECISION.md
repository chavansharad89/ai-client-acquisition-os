# ₹99 Kit — Account-Email Matching Rule (Claim/Account-Setup) — Product Owner Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `DEC-011` (continues the register in `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md`; last entry before this is `DEC-010`) |
| Date | 2026-10-06 |
| Type | Governance decision record — recording only. **Not an implementation, schema, migration, validation, deployment, or release authorization.** |
| Decision status | **DECIDED.** Resolves the narrow question `DEC-010` §8 flagged as unresolved — the exact account-setup email-matching rule. |
| Resolves | `DEC-010` (`requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md`) §8, and the "Option B — Narrow PO decision required" finding of the engineering design review conducted earlier in this session. |

## 2. Decision authority

**Product Owner.** The decision in §4 was supplied directly by the Product Owner in this session and is recorded here without improvement, reinterpretation, or added mechanics beyond what was explicitly stated.

## 3. Baseline

This record does not re-verify repository file hashes; it relies on the architecture facts already established and cited in `DEC-010` (§3–§4) and in the engineering design review delivered immediately before this record in the same session — specifically: `entitlements.customer_email` and `users.email` both enforce `CHECK (email = lower(email))`; no password column exists on `users`; no self-service signup endpoint exists; `/api/payments/verify` is architecturally forbidden from granting entitlement or trusting browser-supplied payment data for that purpose. None of those facts is changed by this record.

## 4. DECIDED

The account-setup email-matching rule for the ₹99 (and, by extension, any future kit using the same fulfillment path) is:

1. **The purchase email is the canonical account email.** The email already present on the verified, paid order/entitlement is the only email the resulting account may have.
2. **The account-setup screen shall display that email automatically**, pre-populated from the verified purchase/claim context — the buyer is not asked to type it.
3. **The buyer shall not be asked to type the email again.**
4. **The email field shall be non-editable/disabled in the UI.**
5. **The buyer's only required input at account setup is the password.**
6. **The browser shall not be able to substitute a different email** by modifying the disabled field, or by any other client-side means.
7. **The server shall derive the account email from the verified purchase/claim context — never from a client-supplied email value** — when creating the account.
8. **The resulting account's email shall equal the verified purchase email**, with no exception.
9. **Changing the email during initial account setup is not supported.**
10. **Changing the account email after account creation is out of scope for launch** and requires a separate, future Product Owner decision.

### Distinguishing the three behaviors this decision covers

- **UI behavior:** the email field is displayed, pre-populated with the verified purchase email, and disabled/non-editable. This is a user-experience constraint only.
- **Security behavior:** the disabled UI field carries **no security weight**. The server-side account-creation operation **must** obtain the canonical email exclusively from verified purchase/claim state (e.g. the order/entitlement record reached via a server-validated claim token or equivalent mechanism — the specific mechanism is engineering design, not decided here). Any email value arriving in the HTTP request body for this purpose **shall be rejected or ignored**, never trusted, never substituted for the server-derived value. A malicious client sending `attacker@example.com` in place of `customer@example.com` must not be able to influence which email the account is created under.
- **Account behavior:** the created account's `email` is fixed, permanently at launch, to the verified purchase email — items 8–10 above.

## 5. Relationship to `DEC-010` and other decisions — explicitly not reopened

- **`DEC-010` items 1–7** — not reopened. This record only resolves the §8 open question; it does not alter the in-app-library delivery model, the username/password mechanism itself, kit contents, email-not-required-for-launch, login-based recovery, the reconciliation requirement, or the no-refund/no-cancellation policy.
- **Email-not-required-for-launch (`DEC-010` item 4)** — not reopened. This decision does not require sending or receiving any email; the "purchase email" referenced throughout is read from the server-side order/entitlement record, not emailed to or from the buyer.
- **No-refund/no-cancellation (`DEC-010` item 7)** — not reopened, not touched.
- **ED-2** — not reopened, not triggered. This decision concerns only the payment-identity→account-identity binding (DEC-010 §8's own framing); it introduces no visitor-id or funnel-analytics dependency.
- **ED-3** — not reopened, not touched.
- **Q10** — not reopened, not touched.
- **Entitlement ownership** — not changed. `entitlements.customer_email` remains exactly as granted by the webhook; this record governs only how an *account* is subsequently bound to that existing entitlement, not how the entitlement itself is created or owned.

## 6. STILL PENDING (unchanged from `DEC-010`, not decided here)

- The concrete claim/possession mechanism by which the server authenticates "this request is acting on behalf of the verified purchase" before it will create the account (token shape, TTL, issuance point) — engineering design.
- The password-hashing mechanism and session/cookie binding — engineering design.
- Any future account-email change mechanism post-launch — explicitly deferred (§4 item 10), requires a separate Product Owner decision when raised.

## 7. NOT AUTHORIZED

This record does not authorize, and nothing in it should be read as authorizing:
- Any change to `DEC-010`, ED-2, ED-3, Q10, entitlement ownership, or the no-refund/no-cancellation policy.
- Any code, test, schema, migration, or configuration change.
- Selection of a specific claim-token, password-hashing, or session mechanism.
- Validation, deployment, release, or launch of any kind.
- Any commit or push.

**This record grants no implementation, schema/migration, or deployment authority.** It resolves the single open question identified in `DEC-010` §8 and closes the "narrow PO decision required" item from the preceding engineering design review.
