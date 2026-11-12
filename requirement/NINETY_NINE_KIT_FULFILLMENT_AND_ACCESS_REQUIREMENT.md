# ₹99 Kit Fulfillment and Access — Requirement

## 1. Status and authority

This is a **product/customer requirement**, not a decision record. Its authority is
`DEC-010` (`requirement/NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md`), where the
Product Owner decided the seven items restated normatively in §3–§6 below. This document adds
no Product Owner decision beyond what `DEC-010` already decided, except where a clause is
explicitly labelled "engineering dependency" or "future Product Owner decision."

Where any statement here appears to conflict with `DEC-010`, `DEC-010` governs — see §9 for the
conflict check performed before this document was written (no conflict found).

This document does **not** change, reopen, or supersede: `DEC-002`, `DEC-003`, R-01, R-02, ED-2,
ED-3, Q10, K1, `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`, or PCG-1…PCG-5.

## 2. Scope

**In scope:** post-purchase fulfillment, account/access, and payment-reconciliation behavior for
the ₹99 kit (`ai_income_99`).

**Out of scope** (governed elsewhere, unchanged by this document):
- Independent-purchase pricing rules — `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`.
- K1-governed external-intent discovery — unrelated to ₹99 fulfillment unless a future record
  says otherwise.
- The visitor↔authenticated-user analytics merge — ED-2 (`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` §ED-2).
- The bot/QA-traffic exclusion key — ED-3 (`visitor_id`, per `CLIENT_FINDER_PDEF_4_ED3_EXCLUSION_KEY_DECISION.md`).
- The independent-validator identity question — Q10.
- The numeric values of the ₹99 launch gate — PCG-1…PCG-5 (§7).

## 3. Product/customer requirements

### A1 — Primary delivery
The ₹99 kit **shall** be delivered through an authenticated in-app library.

### A2 — Account access
A buyer **shall** be able to establish an account consisting of a username and password. The
resulting authenticated account/session **shall** be the mechanism used for all subsequent access
to the purchased product. This requirement does not specify the authentication implementation
(hashing library, session/cookie/JWT mechanism) — see §8.

### A3 — Product contents
The ₹99 kit **shall** include both (a) downloadable files and (b) a web-based workflow/tool,
both accessible from the in-app library. The concrete functional definition of the workflow/tool
is not specified here — see §8.

### A4 — Email
Email delivery **shall not** be a launch dependency for the ₹99 kit. No launch-critical
fulfillment path may depend on an email being sent or received. Email delivery may be added in a
later phase.

### A5 — Lost access
Account login **shall** be the launch recovery mechanism for lost access. Email-based recovery
(password-reset email, magic-link resend) **shall not** be required for launch.

### A6 — Refund / cancellation
No refund or cancellation capability **shall** exist for the ₹99 product at launch. No
refund/cancellation exception may be introduced except by a future, separate Product Owner
decision.

## 4. Fulfillment journey requirement

A ₹99 purchase **shall** result in the following chain, and an entitlement record alone is
**not** sufficient to satisfy this requirement — a successful customer purchase **shall**
ultimately result in usable, authenticated access to the purchased product:

```
₹99 purchase
  → payment confirmation
  → entitlement
  → account setup (username/password)
  → authenticated session
  → in-app library
  → downloadable files + web-based workflow/tool
```

This requirement does not specify how the entitlement (keyed on purchase email) is bound to the
account (keyed on account email) — that matching rule is an open engineering dependency already
identified in `DEC-010` §8, not decided here.

## 5. Payment reconciliation requirement

A successful Razorpay payment **shall** be recoverable/reconcilable when its webhook is missing,
delayed, or otherwise not successfully processed, such that:

```
successful payment → recover/reconcile → order correctly recognized
  → entitlement correctly established → customer can establish/access their account
```

Reconciliation **shall** be idempotent: re-running reconciliation for an already-reconciled
payment **shall not** create duplicate payment or entitlement effects.

Per `DEC-010` item 6, this requirement is **launch-blocking** for ₹99 validation — unlike A4/A5,
it is not deferrable.

This requirement does not specify polling frequency, scheduler technology, worker implementation,
or which Razorpay API method is used — see §8.

## 6. Validation requirement

The ₹99 product **shall not** enter its validation test as a customer-usable product unless the
complete critical path in §4 works end to end:

```
₹99 purchase → payment confirmation → entitlement → account setup
  → authenticated access → in-app library → downloadable content → web-based workflow/tool
```

The missing/late-webhook recovery path (§5) **shall** also be tested before ₹99 validation
begins.

This requirement does not set, change, or decide the numeric launch-gate thresholds. Those remain
PCG-1…PCG-5 as recorded in `PROJECT_MASTER_CHECKLIST.md` §3 — **Product Owner decision status:
PENDING** at the time this requirement was written (500 qualified visitors / ≥50 buyers / ≥10%
conversion / ≥60% useful outcome / ≤8% refunds are *proposed* values, not yet decided). This
requirement adds a functional precondition — the critical path and webhook-recovery test must
pass — to whichever numeric thresholds the Product Owner ultimately sets for PCG-1…PCG-5; it does
not supply, approve, or imply those values.

## 7. Explicit out of scope (launch)

The following remain outside ₹99 launch scope unless governed elsewhere:
- Email delivery and email-based recovery (A4, A5).
- Refund and cancellation processing (A6).
- Any change to ED-2 or ED-3.
- Q10 validation.
- K1-dependent functionality unrelated to the ₹99 kit.
- Selection of a specific authentication technology, password-hashing implementation, or session
  mechanism.
- Selection of a specific reconciliation scheduling mechanism or Razorpay API call.
- The numeric values of PCG-1…PCG-5 (§6).

## 8. Engineering dependencies (design only — no implementation authority granted here)

- Account-setup design: hashing mechanism, session/cookie binding, and how it reuses or replaces
  the existing `access_tokens`/`users` primitives.
- Identity-linking design: how a post-purchase account is matched to the pre-existing
  `entitlements` row (matching key, duplicate-email handling, mismatched-email handling) —
  `DEC-010` §8.
- Functional design of the web-based workflow/tool deliverable (A3).
- Reconciliation mechanism design: polling cadence, Razorpay API calls, idempotency guarantee
  (§5).

None of the above is authorized for implementation by this document. This document establishes
the business requirement; implementation authorization is a separate governance step.

## 9. Conflict check performed before writing this requirement

| Existing requirement/decision | Relationship | Result |
|---|---|---|
| `DEC-010` (PO decision, items 1–7) | This document restates items 1–7 in normative form and adds the fulfillment/reconciliation/validation requirements items 1–7 imply | Compatible — no conflict, no re-decision |
| `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` | Governs independent purchasability/pricing; this document does not touch purchase order or pricing | Compatible — no overlap |
| `DEC-002`/`DEC-003` (PRD V2.2) | Identity ≠ entitlement ≠ payment; server-bound identity | Compatible — A2/§4 bind entitlement to account via existing shared email key, not reopened |
| ED-2 | Deferred visitor↔user analytics merge | Not triggered — ₹99 account linkage is payment-identity→account-identity, unrelated to `funnel_events.visitor_id` |
| ED-3 | `visitor_id` exclusion key | Not touched |
| Q10 | Independent validator | Not touched |
| PCG-1…PCG-5 (`PROJECT_MASTER_CHECKLIST.md`) | Proposed, PENDING launch-gate thresholds | Not touched — §6 adds a functional precondition only, no numeric value set or implied |

## 10. Not authorized

This document does not authorize any code, schema, migration, test, configuration, dependency,
deployment, or commit/push. It records a requirement only.
