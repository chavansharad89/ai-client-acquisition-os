# ₹1,499 Advanced Subscription — Credit Consumption Rate Decision

## 0. SUPERSEDED NOTICE (added — this record's §5 credit figures are no longer current)

**This entire record's commercial substance — "10 credits = 1 successful unlock," the 300-credit allocation it
divides against, and the derived "30 unlocks/month" capacity — is SUPERSEDED for the ₹1,499 product's current
commercial model by `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md`
(`CLIENT-FINDER-1499-SUBSCRIPTION-ACCESS-MODEL-PO-DEC-002`) §6.** The current ₹1,499 model has **no credits, no
balance, and no per-unlock charge** — contact access does not consume credits. This record is **preserved as
historical governance** and is not deleted or rewritten below.



`CLIENT-FINDER-1499-CREDIT-CONSUMPTION-RATE-PO-DEC-001`

## 2. Decision status

**DECIDED** (item 1 in §5 only). This is a **Product Owner commercial/credit-consumption decision record only**.
It grants **no implementation, catalog, schema, payment, entitlement, credit-ledger, enforcement, UI, or
test-authoring authority**. No code, test, schema, migration, catalog file, or payment/entitlement logic is
modified, authorized, or implied by this record.

## 3. Decision authority

**Product Owner.** The decision in §5 was supplied directly by the Product Owner and is recorded here verbatim,
without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. Relationship to prior records (complementary, not a modification)

This record is **complementary to**:
- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D1–PO-D5: one-month validity;
  all-kit eligibility; 300 monthly credits; no rollover; no active subscription = no active credits).
- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` (new, distinct product id required; existing
  `ai_client_acquisition_1499` not repurposed).

Neither record is modified, reopened, or reinterpreted by this one. This record answers only the "price of the
action" question — how many of the 300 monthly credits a single successful unlock consumes.

### Governing sources consulted (not modified by this record)

| Source | Relevant fact |
|---|---|
| `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` R-1.2, OQ-9 | Defines "canonical opportunity" as the system's target object; OQ-9 ("when does a signal become a canonical opportunity") is an open question, not resolved |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` §7 | Defines target-customer match as a qualification criterion (match/no-match/not-yet-observed); not a credit-consuming or unlock event |
| `packages/core-research/src/contactIdentifiers.ts` | K1: read-only detection of contact-identifier presence in evidence; does not expose values or constitute "access" |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION_PREPARATION.md` lines 130, 160, 167 | Confirms "lead unlock" / "successful client contact" / "completion" is **not currently defined** in any governance record |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` line 106 | Confirms zero code references to a credit ledger or lead-unlock mechanism exist anywhere in the codebase |
| `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` | 300 monthly credits; no rollover; expiry at month end — unchanged by this record |

## 5. DECIDED

**10 credits = 1 successful real-client lead unlock.**

- An active ₹1,499 subscription provides 300 credits per subscription month (unchanged; see
  `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`).
- Each successful real-client lead unlock consumes exactly 10 credits.
- **Derived capacity: 300 ÷ 10 = up to 30 successful real-client lead unlocks per subscription month.**
- Ordinary searching/browsing does not itself consume credits merely because a search was performed.
- The 10-credit charge applies to the successful real-client lead unlock event specifically — not to a search, a
  displayed result, a discovered opportunity, a contact field, or an API call.
- Unused credits expire at the end of the subscription month; credits do not roll over (unchanged).
- Renewal/new ₹1,499 subscription provides a fresh 300 credits (unchanged).

## 6. Explicitly distinguished (not decided or redefined by this record)

This record records the *price* of an action; it does not define the action's success condition. The following
remain functionally and definitionally distinct, per existing requirements/code, and none is altered here:

- **Searching/browsing** — no existing requirement ties this to credit consumption; this record confirms it does
  not consume credits.
- **Discovering an opportunity** — intent-signal capture (`intentSignal.ts`); upstream of qualification or unlock.
- **Qualifying an opportunity** — target-customer match determination (PCG-4); a qualification signal, not a
  credit-consuming event.
- **Unlocking a real-client lead** — the priced event under this record (10 credits). Its precise success
  condition is **not defined by this record** (see §7).
- **Contact/detail access after unlock** — K1 contact-identifier detection is read-only presence-detection, not an
  access grant; whether/how contact access relates to or follows "unlock" is not defined by this record.

## 7. Explicitly unresolved — not decided here

**What constitutes a "successful real-client lead unlock" is not sufficiently defined in any existing requirement
or implementation.** No governance record or code module names, implements, or gates an action called "lead
unlock." `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION_PREPARATION.md` raised the same definitional gap for a
different purpose (PCG-6 "completion") and left it unresolved; that gap is not closed by this record.

**Q-UNLOCK-1 (proposed, not answered here):** Does a "successful real-client lead unlock" require only (a) a
target-customer match (PCG-4) being reached, or (b) a target-customer match plus at least one contact identifier
(K1) detected as present in the evidence, or (c) some further event not yet represented in any existing
requirement or code (e.g., an explicit user-initiated "unlock" action, contact-detail reveal, or export)?

This record does **not** select (a), (b), or (c), and does not invent any other definition. Resolving Q-UNLOCK-1
is a separate, future Product Owner decision.

## 8. Also explicitly not decided here

- Overage behavior once 30 unlocks/300 credits are exhausted mid-month.
- Refunds/cancellations for subscription periods or unused credits.
- Subscription renewal/period-boundary mechanics.
- The 300-credit monthly allocation itself (unchanged; governed by
  `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`).
- No-rollover/expiry policy itself (unchanged; same record).
- The new product id's literal value (unchanged; governed by
  `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`).

## 9. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
credit-ledger, enforcement, or consumption-tracking implementation; entitlement, access, or UI changes; payment
processing; deployment, release, or production traffic of any kind; commit or push of any file.

## 10. Governance statement

This is a Product Owner commercial/credit-consumption decision record only. It fixes the price of one successful
real-client lead unlock at 10 credits (30/month derived capacity) and explicitly does not define the success
condition that action requires — that gap (Q-UNLOCK-1) is recorded as a distinct, unresolved, future Product Owner
decision. It does not modify `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`,
`CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`, PDEF-2, PDEF-3, PDEF-4, the Entitlement Stacking
decision, or any code, schema, or test file.

**Next governance action:** Product Owner resolution of Q-UNLOCK-1 before any credit-consumption enforcement can
be designed or implemented.
