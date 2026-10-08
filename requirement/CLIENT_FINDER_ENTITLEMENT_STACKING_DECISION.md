# Client Finder / Client Intent Discovery — Entitlement Stacking Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `CLIENT-FINDER-ENTITLEMENT-STACKING-PO-DEC-001` |
| Date | 2026-10-04 |
| Type | Governance decision record — recording only. **Not an implementation, validation, deployment, or release authorization** (see §9, NOT AUTHORIZED). |
| Decision status | **DECIDED.** The Product Owner has supplied explicit decisions for ES-1 and ES-5 through ES-11. These supersede the prior two recording attempts at this same path, which recorded all items as PENDING/UNDEFINED because no concrete selection had yet been supplied. |

## 2. Decision authority

**Product Owner.** The decisions in §6 were supplied directly by the Product Owner, with concrete selections and
exact rule text for every ES question, and are recorded here verbatim, without improvement, reinterpretation, or
added mechanics beyond what was explicitly stated.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged) |
| Staged files | 0 |
| Working tree before this record | 10 untracked files, including this record's prior all-PENDING content (SHA-256 `7e0704beb333b68a487f85aea88d21e1ee6a1996c5292a6bea4716b126c5c127`) and `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION_PREPARATION.md` (hash matching §4) |
| File updated by this record | this file only — updates its own prior content; no other file created or modified |

## 4. Governing sources (hashes verified at baseline, unchanged by this record)

| Record | SHA-256 | Role |
|---|---|---|
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION_PREPARATION.md` | `0b76af3b17e65ddb052628728dfe1b3debd3dca610e6aacd93258f6345f4fa71` | Source of the ES-1/ES-5..ES-11 question IDs and terminology preserved here. Not modified. |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` | Independent-purchase rule and 50/300 credit figures; Advanced-access definition referenced by ES-7. Not reopened, not changed. |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` | Credit-accounting mechanism flagged undesigned (§14). Not reopened, not changed. |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` | Cross-gate measurement rule (§12). Not reopened, not changed. |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` | `5b54709269a16a75d3dc22394c102af5be77b4c55d1b66909a96375fab26d4ef` | Q7/Q8 remain PENDING/UNDEFINED there; ES-11 defers to them. Not decided here, not changed. |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` | Consulted; unaffected, not changed. |
| `requirement/INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` | `c089858cd32704ff28c64a89a88b9f963bd7d8762ab1c5abb53bbb5fbe7deb83` | Monetary-pricing / independent-purchase rule; ES-10 preserves this. Not reopened, not changed. |
| `requirement/MVP_SCOPE_BOUNDARY.md` §6.5 | not independently hashed (read-only reference, unchanged) | Subscription/billing scope boundary; ES-9 decision is consistent with it. Not changed. |
| PRD V2.2 §R-30 | not independently hashed (read-only reference, unchanged) | Subscriptions FUTURE/NOT IMPLEMENTED; ES-9 decision is consistent with it. Not changed. |

All hashes above were re-verified immediately before writing this record and match the values most recently
recorded for each file. None of these records is modified by this decision record. PDEF-2, PDEF-3, and PDEF-4 are
not modified or decided by this record.

## 5. Relationship to PDEF-2

PDEF-2 is **not reopened or altered**. ₹499 = Basic access / 50 monthly lead-unlock credits; ₹1,499 = Advanced
access / 300 monthly lead-unlock credits; both independently purchasable with no prior-tier prerequisite in either
direction. This record decides only what happens when both entitlements are held by the same user at once,
consistent with and not overriding PDEF-2.

## 6. DECIDED

### ES-1 — Entitlement relationship

**DECIDED: A — CUMULATIVE / COEXISTING.** ₹499 and ₹1,499 Client Finder entitlements may coexist for the same
user; both remain valid according to their applicable entitlement periods.

### ES-5 — Existing ₹499 credits when ₹1,499 is purchased

**DECIDED: KEEP SEPARATE / DO NOT FORFEIT.** Purchasing ₹1,499 does not erase, convert, or consume already-issued
unused ₹499 credits. Unused ₹499 credits remain associated with the ₹499 entitlement and retain whatever validity
period applies to that entitlement. (Credit-expiry implementation mechanics are not designed by this decision.)

### ES-6 — Credit buckets

**DECIDED: SEPARATE CREDIT BUCKETS.** ₹499 credits and ₹1,499 credits are separate entitlements/buckets. They must
not be automatically pooled into a single 350-credit balance. (Credit-ledger implementation is not performed by
this decision.)

### ES-7 — Feature access when both tiers are held

**DECIDED: ₹1,499 ADVANCED ACCESS GOVERNS FEATURE ACCESS.** When a user simultaneously holds active ₹499 and
₹1,499 Client Finder entitlements, the user receives the Advanced Client Finder access defined by PDEF-2. The ₹499
entitlement is not used to downgrade the user's feature access while the ₹1,499 entitlement is active.

### ES-8 — Usage limits when both tiers are held

**DECIDED: BOTH LIMITS REMAIN INDEPENDENTLY AVAILABLE.** The ₹499 entitlement provides its decided 50 monthly
lead-unlock credits and the ₹1,499 entitlement provides its decided 300 monthly lead-unlock credits. The two
allowances remain attributable to their respective entitlements rather than being merged into one 350-credit pool.
(Implementation priority, ledger mechanics, rollover mechanics, and overage mechanics are not specified by this
decision.)

### ES-9 — Renewal / expiry / cancellation / downgrade

**DECIDED: OUT OF MVP.** Renewal, expiry, cancellation, downgrade, and recurring-subscription lifecycle mechanics
are outside the current MVP scope and are not decided or authorized by this record. (No billing/subscription
implementation requirement is created by this decision.)

### ES-10 — Reverse purchase order

**DECIDED: YES.** A user who already owns an active ₹1,499 Client Finder entitlement may subsequently purchase
₹499 independently. This preserves PDEF-2's independent-purchase rule in both directions: owning ₹1,499 does not
require prior ₹499 purchase, and owning ₹1,499 does not prevent a later ₹499 purchase.

### ES-11 — Measurement / PDEF-4 interaction

**DECIDED: FOLLOW PDEF-4.** Entitlement stacking does not establish a separate commercial-gate measurement policy.
Treatment of users holding both tiers for PCG measurement and launch criteria remains governed by
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` Q7/Q8 once those questions are decided. This
decision does not decide PDEF-4 Q7 or Q8.

## 7. STILL PENDING

Only matters not explicitly decided above:

- Detailed credit-ledger mechanics (how the separate ₹499/₹1,499 buckets are actually stored, debited, and
  reconciled).
- Rollover/expiry mechanics for unused credits (ES-5 decides they are not forfeited on ₹1,499 purchase, but not how
  expiry otherwise works).
- Overage/enterprise mechanism (behavior once a bucket's monthly allowance is exhausted).
- Billing/subscription implementation (explicitly out of scope per ES-9).
- `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` Q7 and Q8 — explicitly deferred to by ES-11, not
  decided by this record.
- Any implementation-level entitlement behavior not specified in §6 (e.g., API/schema representation of "two
  separate buckets," order of consumption if a feature draws from both, audit/reporting of dual-tier usage).

## 8. Interaction with independent purchase, the 50/300 credit policy, PDEF-3 measurement, PDEF-4, and MVP scope

- **Independent ₹499/₹1,499 purchase (PDEF-2):** reinforced, not altered — ES-10 explicitly preserves it in both
  directions.
- **50/300 credit policy (PDEF-2):** both figures stand exactly as decided; ES-6/ES-8 keep them as two separate
  entitlements rather than merging them.
- **PDEF-3 measurement (cross-gate rule):** unaffected; not altered by this record.
- **PDEF-4 (Q7/Q8):** unaffected and not advanced; ES-11 explicitly defers to it rather than competing with it.
- **MVP-scope boundary (`MVP_SCOPE_BOUNDARY.md` §6.5; PRD R-30):** ES-9's "OUT OF MVP" decision is consistent with,
  and does not resolve beyond, the existing scope boundary.

## 9. NOT AUTHORIZED

This record does not authorize, and nothing in it should be read as authorizing:

- Any change to PDEF-2, PDEF-3, or PDEF-4 (including Q7/Q8).
- Credit-ledger, billing, or subscription implementation.
- Analytics or instrumentation implementation.
- Any code, test, schema, migration, configuration, dependency, PRD, checklist, or pricing-logic change.
- Any provider/API call.
- Validation, deployment, release, or launch of any kind.
- Any commit or push.

## 10. No authorization statement (restated)

**This record grants no implementation, credit-ledger, billing, subscription, analytics, instrumentation,
schema/migration, validation, deployment, release, or launch authority of any kind.** It records the Product
Owner's explicit ES-1/ES-5..ES-11 decisions (§6) and the matters those decisions leave open (§7). It does not
modify `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION_PREPARATION.md`, PDEF-2, PDEF-3, PDEF-4 preparation, the PRD,
`MVP_SCOPE_BOUNDARY.md`, `PROJECT_MASTER_CHECKLIST.md`, `INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`, or any
code, test, schema, migration, configuration, or dependency. It is not committed or pushed.

**Next governance action:** PDEF-4 Q7/Q8 remain the open dependency ES-11 defers to. Once those are decided,
entitlement-accounting implementation (credit-ledger mechanics, rollover/expiry, overage) may be scoped as a
distinct, separately authorized task — not performed here.
