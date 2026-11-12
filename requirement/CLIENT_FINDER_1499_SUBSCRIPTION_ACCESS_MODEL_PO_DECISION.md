# ₹1,499 Advanced Client Finder — Subscription Access Model (Credits Removed)

## 1. Decision ID

`CLIENT-FINDER-1499-SUBSCRIPTION-ACCESS-MODEL-PO-DEC-002`

## 2. Decision status

**DECIDED.** This is a **Product Owner commercial-model decision record only**. It is a **governance change at this
stage** — it grants **no implementation, schema, migration, route, test, catalog, payment, entitlement, or
credit-ledger authority**. No code, test, schema, migration, catalog file, route, service, or payment/entitlement
logic is modified, authorized, or implied by this record. Nothing is staged, committed, pushed, or deployed as a
result of this record.

This record **supersedes the commercial substance** (not the lifecycle mechanics) of the credit/unlock-quota model
previously decided in the records listed in §6, for the ₹1,499 product specifically. It does **not** modify K1,
`ContactIdentifierKind`, `containsPersonalContactIdentifier`, `targetCustomerMatch.ts`, Path A, or Path B.

## 3. Decision authority

**Product Owner.** The decision in §5 was supplied directly by the Product Owner and is recorded here verbatim,
without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. The authoritative commercial decision

### ₹1,499 Advanced Client Finder

**The ₹1,499 product provides access to the AI Client Finder for a subscription period of 30 days.**

The customer is purchasing **time-bounded access to the AI Client Finder**, not a fixed quantity of leads or
contact unlocks.

The product must **not** promise or guarantee:
- 300 credits
- 30 lead unlocks
- any fixed number of leads
- any fixed number of client opportunities

The system must be allowed to find zero opportunities, a small number of opportunities, or many opportunities,
based on the actual availability and quality of relevant opportunities. The system must **not** manufacture,
downgrade, or fabricate opportunities merely to satisfy a numerical lead/credit commitment (see §9, the business
model principle).

## 5. DECIDED

### 5.1 What is included during an active subscription period

During an **active** ₹1,499 subscription period, the user receives access to the governed AI Client Finder
functionality, including:
- opportunity discovery
- searching/browsing
- qualification
- target-customer matching (PCG-4)
- opportunity research
- access to qualifying contact information
- lead/contact unlocking

There is **no** per-lead credit deduction, **no** fixed lead allowance, **no** credit balance, and **no**
requirement to consume a certain number of opportunities.

### 5.2 Access duration

The current/default subscription duration is **30 days**. The existing subscription lifecycle decision
(`CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md`, items A–P + P-CORRECTION) remains applicable
for duration mechanics specifically:
- activation begins from the governed subscription activation timestamp (IRL-A).
- expiry is activation timestamp + configured duration (IRL-B).
- duration is a configurable engineering/product configuration value (PO-D7, IRL-P).
- the duration applicable to an active subscription period is snapshotted at that period's own activation (PO-D10,
  IRL-P).
- changing the future default duration must not retroactively modify an already-active period (PO-D10, IRL-P).

This is **not** a calendar-month subscription (PO-D6, unchanged).

### 5.3 Leads/opportunities — no quota

There is **no** minimum or guaranteed number of leads. The AI Client Finder must prioritize opportunity quality and
relevance over any numeric target. If no suitable opportunity exists, the system may legitimately return no
qualifying opportunity. The product must **not** generate weak or irrelevant leads solely because the customer paid
₹1,499.

### 5.4 Contact unlock — no credit charge

The previous commercial credit charge is **removed**. A qualifying contact may be revealed to an eligible active
subscriber **without consuming credits** — there is no credit cost, and no credit balance to check.

**SUPERSEDED NOTICE:** the two-condition eligibility rule previously restated immediately below (target-customer
match = YES AND `BUSINESS_EMAIL`/`PHONE`) is **no longer current**. It has been superseded by
`CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-
DEC-002`): the current rule is **at least one contact channel available** — `BUSINESS_EMAIL`, `PERSONAL_EMAIL`,
`UNCERTAIN_EMAIL`, or `PHONE` — with target-customer match reclassified as a qualification/ranking signal only, not
an eligibility gate. The original text below is retained for historical traceability; do not treat it as current.

~~The existing governing eligibility decision remains applicable, unchanged, for *which* leads may be unlocked at
all (`CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md`, §5.1/§5.3):~~
~~- target-customer match = YES, **AND**~~
~~- at least one qualifying contact channel exists: `BUSINESS_EMAIL` qualifies; `PHONE` qualifies (commercial-layer
  rule only); `PERSONAL_EMAIL` does not qualify; `UNCERTAIN_EMAIL` does not qualify.~~

This does **not** modify K1 classification. Do **not** introduce `BUSINESS_PHONE`, change `ContactIdentifierKind`,
change `containsPersonalContactIdentifier()`, or change K1 detection semantics. The distinction between K1
classification and commercial eligibility remains exactly as already governed.

The content of what is revealed on a successful unlock is unchanged (`CLIENT_FINDER_1499_IMPLEMENTATION_READY_
LIFECYCLE_PO_DECISION.md`, IRL-J): the `BUSINESS_EMAIL` and/or `PHONE` value(s) already present in that
opportunity's verified research evidence — no other K1 kind, no other field.

### 5.5 Zero-entitlement access (resolves the open Blocker 2 / §Q.3 question)

The previously recorded PO decision for zero-entitlement users remains, and is now made explicit as the answer to
the question Blocker 2 of `CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md` (§9, option B) left
open:

**A logged-in user with zero Client Finder entitlements may browse/discover Client Finder opportunities.**

However, **active subscription access is required for the commercial subscriber-only capabilities** governed by
this product — specifically, contact unlocking/reveal. Do **not** invent additional free-tier capabilities beyond
browse/discover. If the repository contains a conflict with this decision (e.g., a route that currently gates
browsing itself), report it rather than silently changing it.

### 5.6 Fair-use / abuse protection — not a hidden quota

Do **not** introduce credits as a substitute for abuse protection. Engineering may later propose rate limiting,
concurrency limits, anti-abuse controls, request throttling, or provider-cost controls. These are **engineering
safeguards**, not a hidden lead quota. Do **not** create a new numerical commercial limit without PO approval.

## 6. Historical credit decisions — explicitly superseded for the ₹1,499 current commercial model

The following previously decided model is **SUPERSEDED for the ₹1,499 subscription product's current commercial
terms** by this record:

| Superseded commercial element | Previously decided in |
|---|---|
| 300 credits per subscription period | `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D3, PO-D9) |
| 10 credits per successful unlock | `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` |
| 30 successful unlocks per period (derived) | Same two records above |
| Unused credit expiry/forfeiture | `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D4, PO-D9); `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` (IRL-M.4, IRL-N, credit-forfeiture clauses only) |
| Credit rollover prohibition | `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D4) |
| Credit ledger (allocation/debit row model) | `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` (IRL-F, IRL-G, IRL-H's debit-specific clauses) |
| Credit allocation/debit lifecycle | Same record (IRL-F, IRL-H) |
| `credits_per_period`/`credits_per_unlock` as PO-controlled snapshotted commercial values | `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` (IRL-P, the P-CORRECTION amendment) |

**These records are not deleted or rewritten.** They remain in the repository as historical governance, accurately
reflecting a commercial model the Product Owner decided at the time and later superseded. This record does not
pretend they never existed; it states explicitly that **they no longer govern the current ₹1,499 commercial
model.** Any future reader consulting those records for the ₹1,499 product's *current* terms must be directed to
this record instead.

**Not superseded — unaffected by this record:**
- Q-UNLOCK-1's definition of a successful unlock as an explicit user-initiated action that reveals/accesses
  qualifying contact information (`CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md`) — the
  *behavioral* definition of "unlock" stands; only its credit cost (§6 table above) is removed.
- Q-UNLOCK-1B's eligibility rule in full (§5 above restates it, does not change it).
- The new, distinct SKU decision (`CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`) — unaffected.
- IRL-A through IRL-E, IRL-I through IRL-O, and IRL-P's `duration_days` treatment — unaffected (see §7).
- PDEF-2's 50-credit ₹499 figure and PDEF-3's credit/overage framing for products **other than** the ₹1,499
  subscription — this record speaks only to the ₹1,499 subscription's own commercial model and does not reopen
  ₹499's credit model.

## 7. Subscription lifecycle decisions that remain unchanged

The following existing lifecycle decisions remain exactly as already decided, because they do not depend on the
credit mechanism:

- New, distinct subscription SKU remains: `ai_client_acquisition_1499_subscription`.
- Existing one-time SKU remains unchanged: `ai_client_acquisition_1499`, independent of the subscription (IRL-K).
- A successful recurring charge creates a subscription period (IRL-A, IRL-C, IRL-O).
- Activation timestamp is based on the governed successful captured recurring charge (IRL-A).
- Each renewal creates a new subscription period (IRL-C); renewal does not backdate and does not extend the
  previous period's remaining time (IRL-C).
- Failed payment creates no new period (IRL-D).
- Overlapping purchase while active is rejected (IRL-E).
- Expiry ends subscription access (IRL-B, IRL-M.1) — "unused credits forfeited" (IRL-M.4) is now moot (there are no
  credits), but "access ends at expiry" itself is unchanged.
- Refund makes the affected subscription period inactive immediately (IRL-N) — the credit-forfeiture clause is moot
  for the same reason; "period becomes inactive immediately" is unchanged.
- Cancellation without refund runs through existing expiry (IRL-N, IRL-O).
- Permanent historical/unlocked lead access remains according to the existing lifecycle rules (IRL-I, IRL-M.2): a
  lead a user has successfully unlocked remains accessible to that user without further action, regardless of later
  subscription expiry, renewal, or lapse.
- Historical Opportunity/search data is not deleted, hidden, or altered by expiry (IRL-M.3).
- `duration_days`'s configuration/snapshot treatment (PO-D7, PO-D10, IRL-P) is unchanged — it was never a
  credit-specific value.

Only the **credit-specific** lifecycle behavior (allocation, debit, forfeiture-of-unused-credits, ledger
mechanics) is removed; everything else in the lifecycle record stands.

## 8. "Unlock" as a product action — unchanged terminology

Do **not** automatically delete every reference to "unlock." "Unlock" remains a valid product action where the
existing architecture needs a distinction between a user *seeing* an opportunity and *accessing its qualifying
contact information*. **The change is: unlock no longer consumes credits.** The eligibility test (§5.4), the
reveal content (IRL-J), the idempotency requirement (IRL-H.2/H.3, re-scoped to a reveal-only operation), and the
permanent-ownership rule (IRL-I) all remain — only the credit debit half of the previously-combined
debit+reveal transaction is removed, leaving a reveal-only, idempotent, permanent-grant operation.

## 9. Business model principle

**The product sells access to an AI client-acquisition system, not a predetermined quantity of contacts.**

Therefore:

- **GOOD:** "No strong opportunities found today."
- **BAD:** "Here are 15 weak leads because the customer has unused entitlement."

The system must optimize for relevance and usefulness rather than consuming an artificial quota. This principle
governs any future engineering or product decision that might otherwise be tempted to reintroduce a disguised
quota (e.g., a per-period "soft cap" on opportunities surfaced) without a new, explicit Product Owner decision.

## 10. Contact-value investigation — re-evaluated status (unchanged)

The previously identified contact-value investigation
(`CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md`) remains relevant and is **not** affected by the
removal of credits: the system still needs to reveal qualifying `BUSINESS_EMAIL`/`PHONE` values on a successful
unlock, independent of what that unlock costs. Specifically, unchanged:
- Path A has stored source text containing contact values.
- Path B currently rejects phone-containing evidence before persistence.
- Path A may support current implementation.
- Path B phone reveal remains a future-scope issue unless current launch scope requires it.

Path B and K1 are **not** modified by this record.

## 11. Architecture re-evaluation (governance-level only — no implementation)

Re-evaluating `requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md`'s proposed architecture now that
credits are removed:

| Component | Status |
|---|---|
| `credit_ledger_entries` (table) | **No longer needed.** Removed from the plan. |
| Credit allocation/debit services | **No longer needed.** Removed from the plan. |
| Credit-related migrations (previously proposed `0041_credit_ledger_entries`) | **Removed from the plan** — never applied, so nothing to roll back. |
| `lead_unlocks` | **Remains necessary** — provides permanent contact-access/history (IRL-I) and the idempotency anchor for the reveal operation, independent of any credit cost. |
| `subscription_periods` | **Remains necessary** — the sole basis for time-bounded access gating, renewal, expiry, and refund. |
| Entitlement/access gating (`requireClientFinderAccess`) | **Remains necessary** — now a pure "is there an active period" check, with no credit-balance check layered on top. |
| Subscription lifecycle services (activation, renewal, expiry computation, refund handling) | **Remain necessary**, unchanged in design from the existing plan's §D/§H. |
| Razorpay recurring-payment integration | **Remains necessary**, unchanged in design. |

The revised implementation architecture is recorded in the updated
`requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md` (Revision 2 notice at its top), which this
record directs but does not itself constitute.

## 12. Remaining genuine Product Owner questions

Re-checked against this decision; already-decided items are **not** reopened:

- Subscription duration — already decided (30 days default, configurable, snapshotted). **Not reopened.**
- Renewal behavior — already decided (IRL-C). **Not reopened.**
- Overlapping subscription — already decided (IRL-E). **Not reopened.**
- Refund/cancellation — already decided (IRL-N), credit-forfeiture clause now moot but the inactive-immediately
  rule stands. **Not reopened.**
- Zero-entitlement access — **now decided by this record** (§5.5), closing the previously open Blocker 2 question.
- Contact eligibility — already decided (Q-UNLOCK-1B). **Not reopened.**
- Contact reveal — already decided (IRL-J). **Not reopened.**
- Permanent unlock/history — already decided (IRL-I). **Not reopened.**
- Fair-use limits — explicitly **not** decided here; left to engineering to propose as a non-commercial safeguard,
  subject to its own future PO approval if it would function as a de facto quota (§5.6).

**No new genuine PO blocker is identified by this record.** The two items still outstanding are carried over
unchanged from prior records, not introduced here:
1. The Path-B PHONE intake-rejection question (non-blocking while Path B remains fixtures-only; same status as
   `CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md` §9's second question).
2. External Razorpay Subscriptions API/webhook verification (engineering fact-finding, not a PO question).

## 13. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
credit-ledger, billing, subscription, webhook, route, worker, or UI implementation; any change to
`ContactIdentifierKind`, `containsPersonalContactIdentifier`, `packages/core-research/src/contactIdentifiers.ts`, or
any other K1 detection/classification code; any change to `packages/core-research/src/targetCustomerMatch.ts`; any
change to Path B's intake-rejection behavior; any change to `ai_client_acquisition_1499`'s existing identity,
pricing, or deliverables; deployment, release, or production traffic of any kind; commit or push of any file.
Nothing has been staged, committed, pushed, or deployed as a result of this record.

## 14. Governance statement

This is a Product Owner commercial-model decision record. It replaces the ₹1,499 subscription's commercial
substance — a 300-credit / 10-credit-per-unlock / 30-unlock quota model — with a time-bounded (30-day), no-credit,
no-quota access model, while explicitly preserving (a) the historical credit-model records as superseded-but-not-
deleted governance, (b) the subscription lifecycle mechanics (activation, expiry, renewal, failed payment, overlap,
refund, cancellation, permanent unlock ownership, historical data) that do not depend on credits, (c) the unchanged
eligibility and reveal-content rules (Q-UNLOCK-1B, IRL-J), and (d) the unchanged K1/Path-B boundary. It resolves the
previously open zero-entitlement-access question (§5.5), closing Blocker 2 of
`CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md`. It does not modify any code, schema, test, or
other governance file beyond the engineering-plan revision this record directs in §11.

**Next governance action:** none required before implementation-design planning continues under the revised
architecture (§11) — the two items in §12 are engineering fact-finding, not outstanding Product Owner decisions.
Implementation itself still requires its own, separate, explicit Product Owner authorization before any code is
written.
