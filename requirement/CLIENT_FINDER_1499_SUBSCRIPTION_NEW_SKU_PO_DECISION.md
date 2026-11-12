# ₹1,499 Advanced Subscription — New Product Identity Decision (Option B)

## 1. Decision ID

`CLIENT-FINDER-1499-SUBSCRIPTION-NEW-SKU-PO-DEC-001`

## 2. Decision status

**DECIDED** (items 1–4 below). Item 4 (§5A) is the **final Product Owner resolution of the literal SKU value**,
completing the Option B decision in items 1–3. This is a **Product Owner commercial/catalog decision record
only**. It grants **no implementation, catalog, schema, payment, entitlement, credit, subscription, migration, UI,
or test-authoring authority**. No code, test, schema, migration, catalog file, or payment/entitlement logic is
modified, authorized, or implied by this record.

## 3. Decision authority

**Product Owner.** The decision in §5 was supplied directly by the Product Owner (Option B) and is recorded here
verbatim, without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. Relationship to prior records (complementary, not a modification)

This record is **complementary to** `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`
(`CLIENT-FINDER-1499-SUBSCRIPTION-CREDIT-MODEL-PO-DEC-001`), which decided PO-D1 through PO-D5 (one-month validity
for all kits; ₹1,499 all-kit eligibility while active; 300 monthly lead-unlock credits; no rollover; no active
subscription = no active credits). That record is **not modified, reopened, or reinterpreted** by this one. This
record answers only the SKU/catalog-identity question that record's §7 item 11 left open.

### Governing sources consulted (not modified by this record)

| Source | Relevant fact |
|---|---|
| `packages/catalog/src/products.ts:31-37` | Current `ai_client_acquisition_1499` entry: flat one-time price, no validity/recurrence field |
| `packages/catalog/src/types.ts` | `id` doc comment: "Never renamed once shipped — persisted verbatim onto `orders.product_slug`, part of the permanent financial record"; `ProductId` is a closed 3-member literal union; `Product` has no recurrence/credit field |
| `packages/catalog/src/ladder.ts:16-20` | `ai_client_acquisition_1499` is the top rung of `PRODUCT_LADDER`; owning it implies owning the two lower one-time rungs |
| `packages/catalog/src/deliverables.ts:122-148` | Four static one-time deliverables tied to this id |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` §15 | Names this id "AI Client Acquisition System" (ACQUIRE); bundles Advanced Client Finder into it at the product-definition level; did not address recurrence |
| `requirement/CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` | The approved monthly-validity/credit-model decision this new SKU will represent |
| `requirement/INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md` | Independent-purchase rule, unaffected by this record |

## 5. DECIDED

**OPTION B — NEW SUBSCRIPTION PRODUCT ID.**

1. The existing `ai_client_acquisition_1499` product id is **not repurposed**. Its existing product identity,
   historical meaning, one-time pricing, and associated deliverables remain unchanged.
2. The monthly ₹1,499 Advanced subscription described in
   `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D1–PO-D5: one-month validity; all-kit
   eligibility while active; 300 monthly lead-unlock credits; no rollover; renewal grants a fresh 300) is a
   **distinct product identity** from `ai_client_acquisition_1499`, requiring its own, new, distinct product id.
3. This is a **catalog identity decision only** — it decides that a new id is required and what commercial concept
   it represents. It does not create that id in code, and does not decide the id's literal value/name.

## 5A. DECIDED — Final SKU literal (resolves item 3 above)

**4. The literal product id for the new, distinct ₹1,499 Advanced Client Finder subscription is:**

   ```
   ai_client_acquisition_1499_subscription
   ```

   This is the **final Product Owner decision** for the new subscription SKU's literal value. It completes items
   1–3 above; it does not reopen them.

   - This literal is **not** a rename or repurposing of the existing `ai_client_acquisition_1499` one-time product,
     which remains unchanged in identity, historical meaning, existing financial records, existing one-time
     product semantics, existing catalog identity, existing deliverables, and existing historical purchase/access
     behavior (see §7).
   - The literal deliberately does **not** encode: the 30-day duration, the word "monthly," the 300-credit figure,
     "30 unlocks," or a version number. Reason (per Product Owner): subscription duration is configurable (current
     default 30 days, see `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` §5A, PO-D6–PO-D11); credits
     are a product configuration/rule that may change independently (same record, PO-D9); the SKU is a stable
     product identity and must not be coupled to values that can change.
   - Cross-reference: the subscription's duration-in-days model, 30-day default, per-subscription-period credit
     scoping, and duration-retention-at-activation rule are governed by
     `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` §5A (PO-D6–PO-D11) and are **not** re-decided or
     altered here. The 10-credit unlock cost, Q-UNLOCK-1, Q-UNLOCK-1B, and K1 semantics (including that PHONE
     qualifies for ₹1,499 commercial unlock eligibility only, without modifying K1) are likewise governed elsewhere
     and unchanged by this record.

## 6. Explicitly not decided here

- Subscription-period calculation and renewal mechanics.
- Overlapping-purchase handling (new subscription vs. existing one-time kits).
- Refund/cancellation rules.
- Overage behavior.
- Exact lead-unlock consumption event and credit-consumption timing.
- Payment-provider (Razorpay) subscription implementation.
- Database schema/migrations for the new id, recurrence, or credits.
- Entitlement/access-control implementation.

All of the above remain governed by the open items in `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md`
§7 and are not advanced, narrowed, or resolved by this record.

## 7. Explicitly unaffected

- The independent-purchase rule (`INDEPENDENT_KIT_PURCHASE_PRICING_REQUIREMENT.md`) is unchanged.
- `ai_client_acquisition_1499`'s existing identity, historical meaning, existing price (₹1,499 / 149900 paise),
  name ("AI Client Acquisition System"), existing financial records, existing one-time product semantics, existing
  catalog identity, existing deliverables, existing historical purchase/access behavior, and ladder position are
  all unchanged. `ai_client_acquisition_1499_subscription` (§5A) is a distinct product identity and is not a
  rename or repurposing of it.
- PDEF-2, Entitlement Stacking, and the Subscription/Credit-Model decision are unchanged and not reopened.

## 8. NOT AUTHORIZED

This record does not authorize: any change to `packages/catalog/src/products.ts`, `packages/catalog/src/types.ts`,
`packages/catalog/src/ladder.ts`, or `packages/catalog/src/deliverables.ts`; creation of the new product id (or the
existing `ai_client_acquisition_1499`'s entry) in code; Razorpay/payment-provider changes; entitlement, credit, or
subscription logic; database schema or migration changes; UI changes; test changes; any commit or push. Recording
the literal `ai_client_acquisition_1499_subscription` in this governance record does not create, reserve, or wire
that id in any catalog file, schema, migration, payment integration, or code path.

## 9. Governance statement

This is a Product Owner commercial/catalog decision record only. It decides that the configurable-duration ₹1,499
Advanced subscription requires a new, distinct product id, that `ai_client_acquisition_1499` is not repurposed for
it, and (§5A) that the final literal value of that new id is `ai_client_acquisition_1499_subscription`. It does not
modify any existing governance record, catalog file, schema, or code, and does not authorize implementation of any
kind.

**Next governance action:** a separate catalog-design/implementation-planning task to introduce
`ai_client_acquisition_1499_subscription` into `packages/catalog/src/types.ts`/`products.ts` and the code/schema
changes needed to represent it — not performed here, and requiring its own explicit Product Owner authorization
before any code is written.
