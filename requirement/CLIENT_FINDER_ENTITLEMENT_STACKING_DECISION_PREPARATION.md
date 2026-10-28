# Client Finder / Client Intent Discovery — Entitlement Stacking Decision Preparation

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `CLIENT-FINDER-ENTITLEMENT-STACKING-DECISION-PREPARATION-001` |
| Date | 2026-10-04 |
| Type | Read-only decision-preparation record. **Not a decision record. Not a Product Owner decision. Grants no implementation, validation, deployment, billing, credit-accounting, or launch authority of any kind** (see §15). |
| Decision status | **PENDING PRODUCT OWNER DECISION.** |

## 2. Decision title

**Entitlement stacking for customers who own more than one independently purchased Client-Finder-bearing kit** —
specifically, what lead-unlock credit entitlement applies to a customer who owns both the ₹499 Kit and the ₹1,499
Kit.

## 3. Decision authority

**Product Owner.** This record supplies options and analyst observations only. It does not select among them.

## 4. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged) |
| Staged files | 0 |
| Working tree before this record | 8 untracked files, including `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` and the PDEF-2/3/4 chain — all verified present with hashes matching §5 |
| File created by this record | this file only |

## 5. Governing sources (hashes verified at baseline, unchanged by this record)

| Record | SHA-256 | Role |
|---|---|---|
| `requirement/INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` | `c089858cd32704ff28c64a89a88b9f963bd7d8762ab1c5abb53bbb5fbe7deb83` | Establishes independent purchase and prohibits monetary price credit between tiers. Does not address usage/credit entitlement stacking. Not modified by this record. |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` | Decides ₹499 = Basic access, 50 monthly lead-unlock credits; ₹1,499 = Advanced access, 300 monthly lead-unlock credits; both independently purchasable. Does not decide combined-ownership behavior. Not modified by this record. |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` | §14 flags the credit accounting/enforcement mechanism (rollover, overage, top-ups, abuse controls) as "explicitly undesigned." Not modified. |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` | Reconfirms the 50/300 credit figures and independent-purchase rule; reconfirms the credit-accounting mechanism remains undesigned. Not modified. |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` | `5b54709269a16a75d3dc22394c102af5be77b4c55d1b66909a96375fab26d4ef` | Its Q7 ("Treatment of users who purchase/use both ₹499 and ₹1,499") and the cross-gate rule it carries forward from the completion decision overlap with this record's §11a ES-11. Not modified. |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` | Consulted for any entitlement-stacking or subscription-lifecycle content; none found beyond the PDEF chain already cited. Not modified. |
| `requirement/MVP_SCOPE_BOUNDARY.md` §6.5 | not independently hashed (read-only reference) | States "Recurring subscriptions," "Usage-based billing," and "Subscription plans" are **out of scope** for the current MVP. Relevant because PDEF-2's credit figures are phrased as "resetting each billing cycle" — see §6a below. Not modified. |
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` §R-30 | not independently hashed (read-only reference) | Lists "Subscriptions" (R-30) as **FUTURE / NOT IMPLEMENTED**; states "No subscription or billing infrastructure enters MVP." Not modified. |

None of these records is modified by this preparation record.

## 6. Current governing facts (not reopened by this record)

- ₹499 and ₹1,499 are each independently purchasable; neither requires prior ownership of the other
  (`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`; reconfirmed in `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §8).
- ₹499 entitlement = Basic Client Finder access, 50 monthly lead-unlock credits, resetting each billing cycle.
- ₹1,499 entitlement = Advanced Client Finder access, 300 monthly lead-unlock credits, resetting each billing cycle.
- Every subsequent kit purchase is charged at the full listed price; no prior purchase creates a monetary price
  credit, discount, or balance offset (`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` §3).
- The lead-unlock credit accounting/enforcement mechanism itself (rollover, overage billing, top-ups, abuse
  controls) is explicitly undesigned and not decided by any existing record.
- No existing record states what happens to a customer's entitlement when they own **both** ₹499 and ₹1,499 at
  the same time.

### 6a. Subscription/billing-cycle scope note (cross-dependency, not decided here)

PDEF-2 and PDEF-3's completion decision describe the 50/300 lead-unlock credit figures as resetting "each billing
cycle" / "monthly." `requirement/MVP_SCOPE_BOUNDARY.md` §6.5 lists "Recurring subscriptions," "Usage-based billing,"
and "Subscription plans" as **out of scope** for the current MVP, and the PRD (R-30) marks subscriptions as
**FUTURE / NOT IMPLEMENTED**, stating "No subscription or billing infrastructure enters MVP." Neither PDEF-2 nor
PDEF-3's completion decision reconciles this: the entitlement figures are stated in recurring-cycle terms, but no
recurring-billing mechanism is in scope to make a "cycle" happen. This record does not resolve that tension — it is
surfaced here because several of the ES-9 (renewal/expiry/cancellation/downgrade) sub-question's premises may be
**moot for the current MVP** if no recurring mechanism exists yet to renew, expire, or cancel against. See ES-9.

## 7. Exact unresolved question

**If a customer purchases ₹499 and later purchases ₹1,499 (or owns both by any order of purchase), what lead-unlock
credit entitlement and access level applies to that customer going forward?**

This is a **usage/entitlement-accounting question only**. It does not reopen, weaken, or alter the independent
monetary-pricing rule already established: both purchases remain full-price, independent, non-prerequisite
transactions. The two concepts are kept distinct throughout this record:

| Concept | Status |
|---|---|
| Monetary price credit (one purchase reducing a later purchase's price) | **Already decided: prohibited.** Not reopened here. |
| Lead-unlock/usage credit entitlement (what access level/credit volume an owner of multiple kits receives) | **Undecided.** This is the question this record prepares. |

## 8. Option A — Cumulative entitlements

A customer who owns both ₹499 and ₹1,499 receives the entitlements of both products, combined.

**Example:** ₹499 entitlement (50 credits/month) + ₹1,499 entitlement (300 credits/month) = 350 credits/month
combined.

## 9. Option B — Highest-tier supersedes

A customer who owns both ₹499 and ₹1,499 receives only the entitlement associated with the highest tier owned.

**Example:** ₹499 entitlement (50 credits/month) is superseded; effective entitlement = 300 credits/month (the
₹1,499 figure). The ₹499 purchase remains a valid, recorded purchase; it simply does not add its credits on top of
the ₹1,499 entitlement.

## 10. Option C — Other

The Product Owner defines a different entitlement model not captured by Option A or Option B (for example, a
model with partial stacking, a cap independent of either tier's figure, or a model where access level and credit
volume are decided independently of one another).

## 11. Decomposed sub-questions (ES-2 through ES-11)

§§8–10 (Options A/B/C) cover the master stacking-model question (ES-1). The sub-questions below decompose the
dimensions that the master question alone does not resolve. None is answered here; each lists only what is already
governed, what is genuinely open, and concrete options. None should be read as a recommendation.

### ES-2 — Can a customer own both ₹499 and ₹1,499 simultaneously?

| Field | Value |
|---|---|
| Governing state | Not explicitly stated, but **necessarily implied yes**: `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §8 states ₹1,499 "remains independently purchasable and does not require ₹499 ownership," which permits but does not forbid holding both; no record bars simultaneous ownership. |
| Product Owner decision required | No — included for completeness only; flagged as settled by necessary implication, not reopened. |

### ES-3 / ES-4 — Does ₹1,499 supersede, coexist with, or merge/upgrade the ₹499 entitlement?

This is the same question as the master ES-1 (Options A/B/C, §§8–10). Not restated separately to avoid asking it
twice; the Product Owner's §13 selection answers ES-3/ES-4 as well as ES-1.

### ES-5 — What happens to unused ₹499 credits at the moment ₹1,499 is purchased?

| Field | Value |
|---|---|
| Governing state | **PENDING / UNDEFINED.** No record addresses the transition moment itself, as distinct from the steady-state monthly figure. |
| Product Owner decision required | Yes — distinct from ES-1 even if ES-1 is answered, because ES-1 describes the ongoing entitlement, not what happens to a partially-used ₹499 cycle already in progress at the moment of the ₹1,499 purchase. |
| Decision options | (i) Unused ₹499-cycle credits are forfeited immediately on ₹1,499 purchase; (ii) unused credits carry over and are added to the new entitlement for the remainder of the current cycle only; (iii) the transition is prorated; (iv) moot under Option B if the ₹499 bucket is discarded entirely on supersession; (v) defer. |

### ES-6 — If entitlements stack (Option A), are credits pooled in one bucket or kept in separate per-tier buckets?

| Field | Value |
|---|---|
| Governing state | **PENDING / UNDEFINED.** Only relevant if Option A (or an Option C variant with partial stacking) is selected; moot under Option B. |
| Product Owner decision required | Conditionally — only if Option A or a stacking variant of Option C is selected. |
| Decision options | (i) single pooled bucket, consumed without regard to source; (ii) separate buckets per tier with a defined consumption order (e.g., ₹499 bucket first); (iii) other; (iv) defer. |

### ES-7 — Which entitlement controls feature/access level (Basic vs. Advanced) when both tiers are held?

| Field | Value |
|---|---|
| Governing state | **PENDING / UNDEFINED.** PDEF-2 ties access level (Basic/Advanced) to tier, but does not state which access level governs a dual-tier holder — this is distinct from credit *volume* (ES-1/ES-6). |
| Product Owner decision required | Yes. |
| Decision options | (i) highest tier's access level always applies regardless of which credit bucket is in use; (ii) access level follows whichever bucket credits are currently drawn from (only coherent under a separate-bucket model, ES-6); (iii) other; (iv) defer. |

### ES-8 — Which tier's usage limits (beyond raw credit volume, e.g. concurrency/rate limits, if any exist) apply when both are held?

| Field | Value |
|---|---|
| Governing state | **PENDING / UNDEFINED.** No record describes any Client Finder usage limit other than the monthly lead-unlock credit count itself; this question is recorded in case such limits exist or are later introduced. |
| Product Owner decision required | Yes, if any non-credit usage limit exists or is planned; otherwise moot. |
| Decision options | (i) highest tier's limits apply; (ii) limits are additive/cumulative; (iii) not applicable — no such limits exist; (iv) defer. |

### ES-9 — Renewal, expiry, cancellation, downgrade, and upgrade handling

| Field | Value |
|---|---|
| Governing state | **PENDING / UNDEFINED, and possibly out of current scope** — see §6a. `MVP_SCOPE_BOUNDARY.md` §6.5 and PRD R-30 place recurring subscriptions and usage-based billing out of scope for the current MVP, while PDEF-2's credit figures are phrased in recurring-cycle terms. |
| Product Owner decision required | Yes, but the Product Owner should first confirm whether this question is **in scope now** or **explicitly deferred/separately gated** pending subscription/billing infrastructure that does not yet exist. |
| Decision options | (i) address now, as a policy decision independent of whether billing infrastructure exists yet; (ii) explicitly defer this entire sub-question as out of scope until subscription/billing infrastructure is itself decided and built (treat as a separately gated item per the final governance task's instruction); (iii) other; (iv) defer. |

### ES-10 — Can a customer purchase ₹499 after already owning ₹1,499 (reverse order)?

| Field | Value |
|---|---|
| Governing state | **PENDING / UNDEFINED.** PDEF-2/PDEF-3 establish independence in the forward direction (₹1,499 does not require prior ₹499) but no record addresses the reverse order. The already-decided monetary rule is unaffected either way: any such purchase, if permitted, is still full price with no credit (`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` §3), and this question does not reopen that rule. |
| Product Owner decision required | Yes. |
| Decision options | (i) permitted; the purchase is recorded and the resulting entitlement is governed by whichever ES-1 option is selected (e.g., under Option B it would have no effect on the already-superseding ₹1,499 entitlement, but the purchase itself is not blocked); (ii) blocked/disallowed as offering no product value once ₹1,499 is owned; (iii) other; (iv) defer. |

### ES-11 — Does entitlement stacking affect PCG measurement populations or PDEF-4 launch criteria?

| Field | Value |
|---|---|
| Governing state | **Identified as a cross-dependency, not newly decided here.** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §12 already states a cross-gate rule (combined population is the primary gate; per-tier results are diagnostic only, not a separate pass/fail gate "unless separately decided"). `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` Q7 already asks how a dual-tier user is counted for PCG purposes, and Q8 already asks whether the "unless separately decided" clause should ever be invoked. |
| Product Owner decision required | Not as a new question in this record — this is PDEF-4's Q7/Q8, cross-referenced here so the entitlement-stacking decision (ES-1) and PDEF-4 Q7/Q8 are decided with awareness of each other, not independently and inconsistently. See §11a. |

## 11a. Explicitly out-of-scope / separately gated items

- The credit accounting/enforcement mechanism itself (rollover, overage billing, top-ups, abuse controls) — per
  `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` §14, remains separately undesigned and is not addressed by
  this record regardless of which ES option is selected.
- Subscription/billing-cycle infrastructure — per §6a, out of MVP scope per `MVP_SCOPE_BOUNDARY.md` §6.5 and PRD
  R-30; ES-9 asks the Product Owner to confirm this scoping rather than resolving renewal/expiry mechanics now.
- Instrumentation to measure any PCG gate, including any dual-tier population split — per
  `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` Q10, separately gated and not addressed here.
- Any implementation of entitlement logic in code, schema, or billing systems — not authorized by this record
  regardless of outcome (see §14).

## 12. Consequences of each option (for Product Owner awareness; not a recommendation)

| Option | Consequences to be aware of |
|---|---|
| A — Cumulative | Simplest mental model for the customer ("you get everything you paid for"). Increases total issuable credit volume per combined-owner, with downstream effect on any future PCG-style usage/completion gate that measures credit consumption, and on cost/margin modeling if lead-unlock credits carry a provider cost. Requires the (currently undesigned) credit-accounting mechanism to track and sum two separate entitlement records per customer rather than one. |
| B — Highest-tier supersedes | Simplest entitlement-accounting model (one active entitlement per customer at any time, no summing). May read, from the customer's perspective, as the ₹499 purchase being "wasted" once ₹1,499 is bought, which could interact with the requirement's §4 instruction that an upgrade "may be described as an upgrade" — the entitlement outcome under Option B is closer to a literal upgrade (replacement) than under Option A, even though the **price** paid is still full price under both options. |
| C — Other | Consequences depend entirely on the model the Product Owner specifies; cannot be assessed generically here. |

## 13. Analyst recommendation (non-binding)

**Non-binding observation, not a decision:** Option B (highest-tier supersedes) is the simpler accounting model and
most closely matches the requirement's own UX framing of a later purchase as an "upgrade" (§4 of
`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`), while Option A (cumulative) is the more customer-favorable
model and avoids any appearance that the ₹499 purchase bought nothing once ₹1,499 is added. This record does not
weigh these further or select between them — the choice, including any Option C variant, is reserved to the
Product Owner. No recommendation is offered for ES-2 (settled by implication) or ES-5 through ES-10; ES-11 is a
cross-reference, not a question this record answers.

## 14. Product Owner selection field

| Field | Value |
|---|---|
| ES-1 — Selected option (A / B / C) | **[ ] NOT YET SELECTED** |
| If Option C, define model | — |
| ES-5 — Unused ₹499-cycle credits at upgrade moment | **[ ] NOT YET SELECTED** |
| ES-6 — Pooled vs. separate buckets (if Option A/stacking) | **[ ] NOT YET SELECTED / N/A** |
| ES-7 — Which access level governs when both held | **[ ] NOT YET SELECTED** |
| ES-8 — Which usage limits govern when both held (if applicable) | **[ ] NOT YET SELECTED / N/A** |
| ES-9 — In scope now, or explicitly deferred pending billing infrastructure | **[ ] NOT YET SELECTED** |
| ES-10 — Can ₹499 be purchased after ₹1,499 is already owned | **[ ] NOT YET SELECTED** |
| Rationale (optional) | — |
| Date decided | — |

## 15. Governance / authorization boundaries

**This record grants no implementation, analytics, instrumentation, billing, credit-system, database/schema,
testing, validation, provider/API-call, external-research, deployment, production-traffic, or release authority of
any kind.** It does not decide the entitlement-stacking question, does not modify
`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` or any PDEF-2/3/4 record, does not alter pricing, does not alter
any launch gate, and does not implement any entitlement logic. It is not committed or pushed.

**Next governance action:** the Product Owner completes §14 (ES-1 and, where applicable, ES-5 through ES-10), and
confirms whether ES-9 is in scope now or explicitly deferred. Once supplied, a separate decision record should
capture the selections verbatim — ideally reconciled with PDEF-4 Q7/Q8 (§11 ES-11) in the same pass, since both
concern dual-tier users — after which entitlement-accounting implementation may be scoped as a distinct, separately
authorized task.
