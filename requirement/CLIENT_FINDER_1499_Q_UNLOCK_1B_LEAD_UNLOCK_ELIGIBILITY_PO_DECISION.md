# ₹1,499 Advanced Subscription — Q-UNLOCK-1B: Lead Unlock Eligibility Decision

## 0. SUPERSESSION NOTICE (added — this record's §5 eligibility rule is no longer current)

**This record's §5.1/§5.3 eligibility rule — target-customer match = YES AND at least one of `BUSINESS_EMAIL`/
`PHONE` — is SUPERSEDED for ₹1,499 opportunity-eligibility purposes by
`CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md`
(`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002`).**

The new, current rule is: **at least one contact channel available** (`BUSINESS_EMAIL`, `PERSONAL_EMAIL`,
`UNCERTAIN_EMAIL`, or `PHONE`) — full stop. Target-customer match is no longer an eligibility gate; it is a
qualification/ranking signal only.

This record is **preserved as historical governance** and is not deleted or rewritten below. §6's K1 boundary
statement (PHONE's acceptance is a commercial eligibility rule, not a K1 change) remains correct and unaffected by
the supersession. §7 (Q-UNLOCK-1 preservation: user-initiated, idempotent unlock) is also unaffected.

## 1. Decision ID

`CLIENT-FINDER-1499-Q-UNLOCK-1B-LEAD-UNLOCK-ELIGIBILITY-PO-DEC-001`

(Unchanged from this record's original creation. Preserved per Product Owner instruction; this correction updates
this record's own content in place rather than creating a competing record.)

## 2. Decision status

**DECIDED** (items in §5 only, including the §5.3 correction). This is a **Product Owner commercial/behavioral
decision record only**. It grants **no implementation, catalog, schema, database, payment, entitlement,
credit-ledger, enforcement, UI, or test-authoring authority**. No code, test, schema, migration, catalog file,
route, service, or payment/entitlement/billing logic is modified, authorized, or implied by this record.

## 2A. Correction notice

This record was originally created stating that only `BUSINESS_EMAIL` satisfies the business-contact-identifier
leg of unlock eligibility, with `PHONE` excluded (per a clarification given earlier in the same governance task).
The Product Owner has since corrected that outcome. **§5 below is the final, authoritative version of this
decision**, superseding the original §5.2/§5.3 treatment of `PHONE`. §5.1 (the two-condition structure) and §5.4
(Q-UNLOCK-1 preservation) are unchanged from the original version. The correction concerns only which K1-detected
contact channels satisfy condition #2 of §5.1.

## 3. Decision authority

**Product Owner.** The decision in §5 (Option B, as corrected) was supplied directly by the Product Owner and is
recorded here verbatim, without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. Relationship to prior records (complementary, not a modification)

This record is **complementary to**, and does not alter the text of:

- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (one-month validity; all-kit
  eligibility; 300 monthly credits; no rollover).
- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` (new, distinct product id required).
- `requirement/CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` (10 credits = 1 successful real-client
  lead unlock; 30 unlocks/month derived capacity).
- `requirement/CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md` (Q-UNLOCK-1: a successful
  real-client lead unlock is an explicit user-initiated unlock of a qualified lead that successfully reveals/
  accesses the lead's qualifying business contact information; only success consumes 10 credits; idempotency
  required).
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (already-governed
  definition of target-customer match: a tri-state match/no-match/not-yet-observed qualification criterion).
- `packages/core-research/src/contactIdentifiers.ts` (already-governed K1 contact-identifier detection code —
  **its classification semantics are unchanged by this record**; see §6).

This record resolves **Q-UNLOCK-1B** — a distinct question from Q-UNLOCK-1: Q-UNLOCK-1 defined what a successful
unlock *is*; this record defines what makes a lead *eligible to be unlocked at all*. No change to the text of any
record listed above was found necessary; a cross-reference is added here instead, consistent with the Product
Owner's instruction to stop and report rather than modify them if a change were required.

## 5. DECIDED

### 5.1 Eligibility rule (Option B — unchanged)

**A lead is eligible for a real-client lead unlock only when BOTH of the following are satisfied:**

1. **Target-customer match = YES** (per the already-governed definition in
   `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` §7 — unmodified, unredefined here).
   Target-customer match alone is **not** sufficient for unlock eligibility.
2. **At least one qualifying contact channel exists**, per §5.2/§5.3 below. The existence of a qualifying contact
   channel alone is **not** sufficient; the lead must first satisfy condition 1.

A lead without at least one qualifying contact channel must **not** be unlockable and must **not** consume
credits. No unlock-eligibility condition beyond these two is introduced by this record.

### 5.2 K1's existing classification (unchanged, for reference only)

Per `packages/core-research/src/contactIdentifiers.ts` (**not modified by this record**), K1's existing,
already-governed `ContactIdentifierKind` enum is `BUSINESS_EMAIL | PERSONAL_EMAIL | UNCERTAIN_EMAIL | PHONE |
FRAGMENT`. The existing exported helper `containsPersonalContactIdentifier` (lines 1223-1227) groups `PHONE` with
`PERSONAL_EMAIL` and `UNCERTAIN_EMAIL` as personal, within K1 itself. **This classification is not changed,
reinterpreted, or overridden by this record** — see §6.

### 5.3 FINAL CORRECTION — qualifying contact channels for ₹1,499 unlock eligibility

**For condition #2 of §5.1, the following K1-detected kinds qualify as a "qualifying contact channel" for ₹1,499
unlock-eligibility purposes:**

| K1-detected kind | Qualifies for ₹1,499 unlock eligibility? |
|---|---|
| `BUSINESS_EMAIL` | **Yes** |
| `PHONE` | **Yes** |
| `PERSONAL_EMAIL` | No |
| `UNCERTAIN_EMAIL` | No |
| `FRAGMENT` | No (not a contact identifier) |
| No qualifying contact detected | Not eligible |

Therefore: `BUSINESS_EMAIL` alone → eligible (subject to §5.1 condition 1); `PHONE` alone → eligible (subject to
§5.1 condition 1); `BUSINESS_EMAIL` + `PHONE` → eligible (subject to §5.1 condition 1); `PERSONAL_EMAIL` alone →
not eligible; `UNCERTAIN_EMAIL` alone → not eligible; no qualifying contact → not eligible.

## 6. CRITICAL K1 BOUNDARY — commercial eligibility vs. K1 classification

**The acceptance of `PHONE` for ₹1,499 unlock eligibility is a NEW COMMERCIAL/PRODUCT ELIGIBILITY RULE. It is not,
and must not be represented as, a change to K1's existing classification.**

> PHONE satisfies the ₹1,499 unlock-eligibility contact condition for this commercial product only. This does not
> change K1's existing classification of PHONE or the behavior of `containsPersonalContactIdentifier`.

Specifically, this record does **not** authorize, and nothing in it should be read as authorizing:

- Renaming `PHONE` to `BUSINESS_PHONE`.
- Creating a `BUSINESS_PHONE` K1 classification or any new `ContactIdentifierKind` member.
- Any change to `ContactIdentifierKind`.
- Any change to `containsPersonalContactIdentifier` or any other existing K1 detection/classification function.
- Any change to K1's existing detection/classification semantics or requirements.
- Reinterpreting `PHONE` as a "business" kind within K1 itself.

K1 continues to classify `PHONE` exactly as it does today (grouped with personal/uncertain email under
`containsPersonalContactIdentifier`). The ₹1,499 commercial product's unlock-eligibility rule (§5.3) is a separate,
product-level decision that happens to treat a K1-detected `PHONE` as sufficient for its own eligibility purposes —
it reads K1's existing detection output without altering K1 itself.

## 7. Preserved from Q-UNLOCK-1 (unmodified)

- The user must explicitly initiate the unlock.
- Only a successful reveal/access of qualifying business contact information consumes credits.
- A successful unlock consumes exactly 10 credits.
- Searching = 0 credits. Browsing = 0 credits. Discovery = 0 credits. Qualification = 0 credits. Failed unlock
  attempts = 0 credits.
- The unlock/debit operation must be idempotent.

## 8. Also explicitly unchanged / not reopened

- The 10-credit consumption rate, the 300-credit monthly allocation, and the 30/month derived capacity (governed
  by `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`).
- Q-UNLOCK-1's definition of a successful unlock (governed by
  `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md`).
- K1's existing classification rules (`packages/core-research/src/contactIdentifiers.ts`) — see §6.
- The existing PCG-4 target-customer-match decision.
- The new product id's literal value (governed by `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`).

## 9. Explicitly unresolved — not decided here

- **"Qualifying business contact information"** (the substance of what is revealed/accessed upon a successful
  unlock) remains unresolved, per `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md` §7.
  This record decides *eligibility to attempt* an unlock, not the definition of the revealed information itself.
- Any idempotency implementation mechanism, eligibility-check implementation, schema, route, or service.
- Overage behavior, refunds/cancellations, and renewal/period-boundary mechanics.

## 10. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
any modification to `ContactIdentifierKind`, `packages/core-research/src/contactIdentifiers.ts`, or K1's
classification/detection semantics; database changes; credit-ledger, enforcement, eligibility-check, or
idempotency-mechanism implementation; entitlement, access, or UI changes; payment or billing logic; route or
service changes; deployment, release, or production traffic of any kind; commit or push of any file.

## 11. Governance statement

This is a Product Owner commercial/behavioral decision record only. It decides that lead unlock eligibility
requires both target-customer match = YES and at least one qualifying contact channel, where `BUSINESS_EMAIL` and
`PHONE` (as detected by K1's existing, unmodified classification) both qualify and `PERSONAL_EMAIL`/
`UNCERTAIN_EMAIL` do not; that neither the match condition nor the contact condition alone is sufficient; and that
no further eligibility condition is introduced. It preserves Q-UNLOCK-1's credit-consumption and idempotency terms
unmodified. It explicitly does not modify K1's `ContactIdentifierKind`, `containsPersonalContactIdentifier`, or any
other K1 detection/classification code or semantics — PHONE's acceptance here is a commercial eligibility rule
read on top of K1's existing, unchanged output, not a change to K1 itself. It does not modify
`CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`, `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`,
`CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`, `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md`,
`CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md`, PDEF-2, PDEF-3, PDEF-4, the
Entitlement Stacking decision, or any code, schema, or test file.

**Next governance action:** Product Owner definition of "qualifying business contact information" (§9) before any
unlock-eligibility or credit-debit implementation can be designed or implemented.
