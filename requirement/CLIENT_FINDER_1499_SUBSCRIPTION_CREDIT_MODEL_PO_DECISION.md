# Client Finder / Kit Subscriptions — Subscription Duration & ₹1,499 Credit Model Decision

## 0. SUPERSEDED NOTICE (added — the credit-figure items below are no longer current for ₹1,499)

**PO-D3 (300 credits/period), PO-D4 (no-rollover), and PO-D9 (credits scoped to the period) are SUPERSEDED for the
₹1,499 product's current commercial model** by `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`
(`...-PO-DEC-002`) §6 — the current ₹1,499 model has **no credits**. **PO-D1 (subscription-period validity for
all kits), PO-D2 (₹1,499 = top-tier all-kit eligibility), and PO-D6 through PO-D11's duration-in-days mechanics
(not the credit-specific clauses) remain in force, unaffected.** This record is **preserved as historical
governance** and is not deleted or rewritten below.



`CLIENT-FINDER-1499-SUBSCRIPTION-CREDIT-MODEL-PO-DEC-001` (amended by the correction in §5A)

## 2. Decision status

**DECIDED** (PO-D1 through PO-D11 below only). PO-D6 through PO-D11 (§5A) are a **subsequent Product Owner
clarification/correction** to the "monthly" terminology used in the original PO-D1, PO-D3, PO-D4, and PO-D5 — the
underlying commercial substance (300 credits, no rollover, fresh allocation on renewal, all-tier eligibility while
active) is unchanged; only the duration model and terminology are corrected, per §5A. This is a **Product Owner
commercial/entitlement decision record only**. It grants **no implementation, billing, entitlement, checkout, UI,
API, schema, credit-accounting, usage-enforcement, migration, deployment, or release authority**. No code, test,
schema, migration, catalog, or payment logic is modified, authorized, or implied by this record.

## 3. Decision authority

**Product Owner.** PO-D1 through PO-D5 were supplied directly by the Product Owner and are recorded here verbatim,
without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. Governing sources consulted (not modified by this record)

| Record | Role |
|---|---|
| `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | ₹499=50 / ₹1,499=300 monthly credit caps; "resets each billing cycle" |
| `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | ES-9: renewal/expiry/cancellation previously OUT OF MVP |
| `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` | Independent, full-price, no-cross-kit-discount purchase rule |
| `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | Credit/overage accounting mechanism recorded as undesigned |
| `MVP_SCOPE_BOUNDARY.md` §6.5 | Recurring subscriptions/subscription plans previously excluded from MVP |
| PRD V2.2 R-30 | Subscriptions previously FUTURE/NOT IMPLEMENTED |
| `packages/catalog/src/products.ts` | Current `ai_client_acquisition_1499` SKU shape (one-time purchase, no validity field) |

## 5. DECIDED (original — terminology corrected by §5A; substance unchanged)

### PO-D1 — Subscription validity applies to all kits
All paid kits (₹99, ₹499, ₹1,499) are valid for one subscription period. After that subscription period, the
customer must purchase/renew the applicable subscription to continue access. There is no perpetual access from a
single historical purchase. *(See §5A for the duration-in-days mechanics of "subscription period.")*

### PO-D2 — ₹1,499 is the top-tier all-kit subscription
An active ₹1,499 subscription makes the customer eligible for all ₹99, ₹499, and ₹1,499 tier functionality during
the active subscription period, without separately purchasing ₹99 or ₹499. No additional benefit is implied beyond
this.

### PO-D3 — ₹1,499 lead-unlock credits per subscription period
Each active ₹1,499 subscription period provides 300 lead-unlock credits, for the Client Finder lead-unlock action.
Derived capacity: 300 credits / 10 credits per successful unlock = up to 30 successful lead unlocks per subscription
period (not "per month").

### PO-D4 — Credits belong to the subscription period and do not roll over
The 300 credits belong to their specific ₹1,499 subscription period. Unused credits at the end of that subscription
period expire; they do not roll over, accumulate, or transfer to the next period. A new/renewed subscription period
grants a fresh 300.

### PO-D5 — No active ₹1,499 subscription = no active ₹1,499 credits
When the ₹1,499 subscription is not active, its subscription-period 300-credit allocation is not active. A new
allocation requires purchase/renewal (i.e., a new subscription period).

## 5A. SUBSEQUENT PO CORRECTION — Subscription Duration Model (supersedes "monthly" terminology)

This section is a **subsequent Product Owner clarification/correction** to PO-D1, PO-D3, PO-D4, and PO-D5 above.
It corrects the terminology — replacing "monthly subscription" / "per month" / "monthly credits" / "30
unlocks/month" with "subscription", "subscription period", "subscription duration in days", "300 credits per
active ₹1,499 subscription period", and "up to 30 successful lead unlocks per subscription period" — and replaces
the implicit calendar-month framing with an explicit configurable-duration-in-days model. **PO-D3's 300-credit
figure, PO-D4's no-rollover rule, PO-D5's "no active subscription = no active credits" rule, the 10-credit
successful-unlock cost, Q-UNLOCK-1, Q-UNLOCK-1B, K1 semantics, the target-customer-match requirement, and the
distinct-new-SKU decision are explicitly NOT reopened or changed by this correction.**

### PO-D6 — Not a calendar-month subscription
The ₹1,499 subscription is **not** to be modeled or described as a "monthly" subscription. It is based on a
configurable number of days.

### PO-D7 — Configurable duration, default 30 days
Each subscription has an explicit configured duration in days. The current default/configured duration for the
₹1,499 subscription is **30 days**. This duration is a configurable plan/product-configuration value — it must
**not** be hard-coded as a permanent 30-day business rule.

### PO-D8 — Expiry mechanics
Subscription expiry occurs when the configured number of days has elapsed from the subscription's defined
activation/start timestamp. Once the configured duration has elapsed, the subscription becomes inactive.

### PO-D9 — Credits are scoped to the subscription period, not a calendar month
The 300-credit allocation (PO-D3) belongs to the specific subscription period it was granted for. Unused credits
expire when that subscription period expires. They do not roll over, accumulate, or transfer (PO-D4, restated in
duration-based terms, not calendar-month terms). A new or renewed subscription period receives a fresh 300-credit
allocation.

### PO-D10 — Historical rule: duration is fixed at activation time
If the configured subscription duration value is changed in the future (e.g., the default is changed from 30 days
to some other number of days), an already-active subscription retains the duration that was assigned to it at the
time that subscription period was activated. The configuration change must not retroactively alter an existing
active subscription's expiry.

### PO-D11 — Terminology replacement, substance unchanged
Wherever this record (or any record derived from it) refers to the ₹1,499 credit/validity model, "monthly
subscription" / "per month" / "monthly credits" / "30 unlocks/month" are replaced by "subscription", "subscription
period", "subscription duration in days", "300 credits per active ₹1,499 subscription period", and "up to 30
successful lead unlocks per subscription period." The derived capacity (300 ÷ 10 = 30 successful unlocks) is
unchanged; it is per subscription period, not per calendar month.

## 6. Relationship to prior records

- Clarifies, narrows, and gives lifecycle mechanics to the "resets each billing cycle" language in PDEF-2 §11/§17;
  does not reopen the 50/300 figures themselves.
- Supersedes ES-9's "out of MVP" status for renewal/expiry as a *policy* matter (PO-D1); does not edit ES-9's text,
  and does not authorize the billing/subscription *implementation* ES-9 also placed out of scope.
- Does not alter `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`'s independent-purchase/no-discount rule.
- Does not decide the SKU/catalog question in §7 below.
- §5A does not reopen or change PO-D2/PO-D3's 300-credit figure, the 10-credit unlock cost, Q-UNLOCK-1,
  Q-UNLOCK-1B, K1 semantics, the target-customer-match requirement, or the distinct-new-SKU decision; it corrects
  only the "monthly" duration framing and terminology of PO-D1/PO-D3/PO-D4/PO-D5.

## 7. Explicitly unresolved (not decided by this record)

1. Exact definition of the "lead-unlock" event that consumes one credit. *(Now separately decided — see
   `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md` — retained here for history.)*
2. Whether a credit is consumed before or after successful lead retrieval/unlock. *(Now separately decided —
   same record as above — retained here for history.)*
3. Exact subscription-period calculation/renewal boundary, including the exact activation/start-timestamp
   semantics used to compute the configured-duration expiry in PO-D8.
4. Treatment of existing user data/history after subscription expiry.
5. Whether ₹99/₹499 carry their own credits beyond PDEF-2's existing 50 (₹499), and that allocation's own
   expiry/rollover mechanics.
6. Purchasing ₹499 while an active ₹1,499 subscription is already held.
7. Purchasing ₹1,499 while an active ₹99 or ₹499 subscription is already held.
8. Whether overlapping purchases extend, replace, or otherwise affect validity periods.
9. Refund/cancellation treatment for subscription periods and unused credits.
10. Overage behavior once the 300 credits are exhausted mid-period.
11. Whether `ai_client_acquisition_1499` is reused as a recurring SKU or a new subscription product ID is created
    (see repository audit; not decided here; PO has separately decided Option B — new, distinct SKU — but the
    literal SKU ID itself remains undecided; see `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`).
12. Whether PO-D1's subscription-period validity applies retroactively to kits already sold under the existing
    one-time/perpetual-purchase understanding (`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`,
    `NINETY_NINE_KIT_FULFILLMENT_PRODUCT_OWNER_DECISION.md`).
13. Renewal timing mechanics, failed-payment/grace-period behavior for renewal of a subscription period.
14. Exact mechanism/location for storing the configurable subscription-duration value (e.g., a field on the
    product/plan configuration vs. a separate plan table) — an engineering detail, not decided by this record.

## 8. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
credit-ledger, billing, or subscription implementation; checkout, entitlement, or UI changes; payment processing;
deployment, release, or production traffic of any kind; commit or push of any file.

## 9. Governance statement

This is a Product Owner commercial/entitlement decision record only. It does not implement, authorize
implementation of, or modify any code, test, schema, migration, catalog, PRD, UI, API, billing, payment, or
credit-accounting mechanism. It does not resolve §7. It does not modify `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_
DECISION.md`, `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`, `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`,
`MVP_SCOPE_BOUNDARY.md`, the PRD, or `PROJECT_MASTER_CHECKLIST.md` — where those records should eventually reflect
this decision, that is a follow-up task, not performed here. §5A's correction likewise does not modify any of
those records, and does not modify `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`,
`CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md`,
`CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md`, or
`CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` — it corrects only the duration-model terminology of
PO-D1/PO-D3/PO-D4/PO-D5 in this record.

**Next governance action:** Product Owner review/approval of this record (including the §5A correction); then, if
approved, resolution of §7 items (especially #11, the SKU/catalog question, and #14, the duration-configuration
storage mechanism) before any implementation planning begins.
