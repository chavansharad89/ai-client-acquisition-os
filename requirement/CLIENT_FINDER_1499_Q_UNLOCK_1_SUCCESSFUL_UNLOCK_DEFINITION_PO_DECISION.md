# ₹1,499 Advanced Subscription — Q-UNLOCK-1: Successful Real-Client Lead Unlock Definition Decision

## 0. SUPERSEDED / RESOLVED NOTICE (added)

1. **§5's "only a successful unlock... consumes credits" and "consumes exactly 10 credits" clauses are
   SUPERSEDED** by `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` (`...-PO-DEC-002`) §6 — the
   current ₹1,499 model has no credits; contact access does not consume credits. The *behavioral* definition of a
   successful unlock (explicit user-initiated action that reveals/accesses qualifying contact information,
   idempotent) is **unaffected** and remains in force.
2. **§7's "qualifying business contact information" open question is now RESOLVED downstream**, first by
   `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` (IRL-J) and then widened by
   `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`...-PO-DEC-002`) §7: the revealed contact
   value(s) are whichever of `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE` K1 detected as present for
   that opportunity. §7's framing of the question as "open" is historical; it is no longer an open question as of
   those later records.

This record is **preserved as historical governance** and is not deleted or rewritten below.

## 1. Decision ID

`CLIENT-FINDER-1499-Q-UNLOCK-1-SUCCESSFUL-UNLOCK-DEFINITION-PO-DEC-001`

## 2. Decision status

**DECIDED** (items in §5 only). This is a **Product Owner commercial/behavioral decision record only**. It grants
**no implementation, catalog, schema, payment, entitlement, credit-ledger, enforcement, UI, or test-authoring
authority**. No code, test, schema, migration, catalog file, route, service, or payment/entitlement/billing logic
is modified, authorized, or implied by this record.

## 3. Decision authority

**Product Owner.** The decision in §5 was supplied directly by the Product Owner, resolving Q-UNLOCK-1 as raised
in `requirement/CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` §7, and is recorded here verbatim,
without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. Relationship to prior records (complementary, not a modification)

This record is **complementary to**, and does not alter the text of:

- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D1–PO-D5: one-month validity;
  all-kit eligibility; 300 monthly credits; no rollover; no active subscription = no active credits).
- `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` (new, distinct product id required; existing
  `ai_client_acquisition_1499` not repurposed).
- `requirement/CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` (10 credits = 1 successful real-client
  lead unlock; 30 unlocks/month derived capacity; §7 of that record raised Q-UNLOCK-1 and left it unresolved).

This record resolves Q-UNLOCK-1 as that prior record's §7 posed it — what event constitutes a "successful
real-client lead unlock" — without reopening the 10-credit rate, the 30/month derived capacity, the 300-credit
monthly allocation, the no-rollover policy, or the new-SKU decision. No change to those records' own text was
found necessary to record this decision; a cross-reference is added here instead, consistent with the Product
Owner's instruction to stop and report rather than modify them if a change were required.

### Governing sources consulted (not modified by this record)

| Source | Relevant fact |
|---|---|
| `requirement/CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` §7 | Raised Q-UNLOCK-1; left open whether success means (a) target-customer match alone, (b) match + K1 contact-identifier presence, or (c) another event; selected none |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` §7 | Target-customer match is a qualification criterion (match/no-match/not-yet-observed) — confirmed distinct from "unlock" |
| `packages/core-research/src/contactIdentifiers.ts` | K1: read-only detection of contact-identifier *presence* in evidence; does not expose values; confirmed distinct from "revealing/accessing" contact information |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION_PREPARATION.md` lines 130, 160, 167 | Confirms no existing record defines "lead unlock" / "successful client contact" |
| Repository-wide search (this task) | No file or code module anywhere defines, names, or uses the phrase "qualifying business contact information" |

## 5. DECIDED

### Q-UNLOCK-1 — Definition of a successful real-client lead unlock

**A successful real-client lead unlock is an explicit user-initiated unlock of a qualified lead that successfully
results in the system revealing/accessing the lead's qualifying business contact information.**

- Only a successful unlock, as defined above, consumes credits.
- A successful unlock consumes exactly **10 credits** (unchanged; per
  `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` §5).

### Zero-credit events

The following consume **0 credits**:
- Searching
- Browsing
- Discovery
- Qualification
- Failed unlock attempts

### Idempotency requirement (commercial/behavioral, not an implementation prescription)

The unlock/debit operation must be **idempotent**: retries or duplicate requests must not consume credits more
than once for the same successful unlock. This is recorded as an approved commercial/behavioral requirement. No
implementation technology, mechanism, schema, or code path is prescribed, designed, or authorized by this record.

## 6. Explicitly distinguished (reaffirmed, not newly decided)

Consistent with `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` §6, the following remain distinct:

- **Discovery** — intent-signal capture; zero-credit, per §5.
- **Qualification** — target-customer match determination (PCG-4); zero-credit, per §5.
- **Unlock attempt** — a user-initiated unlock request; not itself credit-consuming unless it succeeds per §5.
- **Successful unlock** — the sole credit-consuming event defined in §5; consumes 10 credits.
- **Failed unlock attempt** — zero-credit, per §5.

## 7. Explicitly unresolved — not decided here

**What precisely constitutes "qualifying business contact information" is not decided by this record.** No
existing, already-authorized requirement or governance record defines this phrase or establishes its contents
(confirmed by repository-wide search; see §4 table). This record does **not** infer, select, or imply that:

- target-customer match (PCG-4) alone qualifies;
- presence of a K1 business contact identifier alone qualifies;
- email alone qualifies;
- phone alone qualifies;
- email and phone are both required;
- or any other condition qualifies.

This question remains **open** and is deferred to a separate, future Product Owner decision. Nothing in §5 or §6
above should be read as resolving it by implication.

## 8. Also explicitly not decided here

- The 300-credit monthly allocation, no-rollover policy, and validity period (unchanged; governed by
  `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`).
- The 10-credit consumption rate and 30/month derived capacity (unchanged; governed by
  `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`).
- The new product id's literal value (unchanged; governed by
  `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`).
- Overage behavior, refunds/cancellations, and renewal/period-boundary mechanics (unchanged; remain unresolved per
  prior records).
- Any idempotency implementation mechanism (key design, storage, retry semantics, database constraint, etc.).

## 9. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
credit-ledger, enforcement, consumption-tracking, or idempotency-mechanism implementation; entitlement, access, or
UI changes; payment or billing logic; route or service changes; deployment, release, or production traffic of any
kind; commit or push of any file.

## 10. Governance statement

This is a Product Owner commercial/behavioral decision record only. It resolves Q-UNLOCK-1 by defining a
successful real-client lead unlock as an explicit user-initiated unlock of a qualified lead that successfully
reveals/accesses the lead's qualifying business contact information, confirms that only this event consumes the
already-decided 10 credits, confirms search/browse/discovery/qualification/failed-attempt events remain
zero-credit, and records an idempotency requirement at the commercial/behavioral level only. It explicitly leaves
"qualifying business contact information" undefined and unresolved. It does not modify
`CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`, `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`,
`CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`, PDEF-2, PDEF-3, PDEF-4, the Entitlement Stacking
decision, or any code, schema, or test file.

**Next governance action:** Product Owner definition of "qualifying business contact information" before any
unlock-eligibility or credit-debit implementation can be designed or implemented.
