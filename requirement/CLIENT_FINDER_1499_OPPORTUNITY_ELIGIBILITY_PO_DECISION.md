# ₹1,499 Advanced Client Finder — Opportunity Eligibility (Contact-Availability Rule)

## 1. Decision ID

`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002`

## 2. Decision status

**DECIDED.** This is a **Product Owner commercial/product decision record only**. It grants **no implementation,
schema, migration, route, test, catalog, payment, entitlement, or credit-ledger authority**. No code, test, schema,
migration, catalog file, route, service, or payment/entitlement logic is modified, authorized, or implied by this
record. Nothing is staged, committed, pushed, or deployed as a result of this record.

This record **supersedes the eligibility rule** (not the credit/lifecycle mechanics, and not K1) previously decided
in `CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md` §5.1/§5.3, for the ₹1,499 product's
*opportunity/unlock eligibility* specifically. It does **not** modify K1, `ContactIdentifierKind`,
`containsPersonalContactIdentifier`, `targetCustomerMatch.ts`, Path A, or Path B.

## 3. Decision authority

**Product Owner.** The decision in §4 below was supplied directly by the Product Owner and is recorded here
verbatim, without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. THE NEW AUTHORITATIVE OPPORTUNITY DEFINITION

For the ₹1,499 AI Client Finder, a prospect is an **opportunity eligible for contact access** when:

> **AT LEAST ONE CONTACT CHANNEL IS AVAILABLE.**

**Target-customer match is NOT an eligibility gate.** Target-customer match is a qualification/relevance signal
that may be displayed and used for ranking/scoring, but it does not determine whether the prospect is an
opportunity.

### 4.1 Qualifying contact channels

The following K1-detected `ContactIdentifierKind` values each independently satisfy the contact-availability
condition:

| K1-detected kind | Qualifies for ₹1,499 opportunity eligibility? |
|---|---|
| `BUSINESS_EMAIL` | **Yes** |
| `PERSONAL_EMAIL` | **Yes** |
| `UNCERTAIN_EMAIL` | **Yes** |
| `PHONE` | **Yes** |
| `FRAGMENT` | No (not a contact identifier) |
| No contact identifier detected | Not an unlockable opportunity |

Any single qualifying channel is sufficient. Any combination of qualifying channels is also sufficient. No contact
channel at all means the prospect is **not** an unlockable opportunity, regardless of target-customer match.

### 4.2 Worked examples

| Target-customer match | Contact channel | Opportunity? |
|---|---|---|
| YES | `BUSINESS_EMAIL` | Opportunity |
| YES | `PERSONAL_EMAIL` | Opportunity |
| YES | `UNCERTAIN_EMAIL` | Opportunity |
| YES | `PHONE` | Opportunity |
| NO | `BUSINESS_EMAIL` | Opportunity |
| NO | `PERSONAL_EMAIL` | Opportunity |
| NO | `UNCERTAIN_EMAIL` | Opportunity |
| NO | `PHONE` | Opportunity |
| YES | none | **Not** an unlockable opportunity |
| NO | none | **Not** an unlockable opportunity |

### 4.3 K1 boundary — unchanged

**This decision does NOT change K1 classification.** K1 must continue to classify contacts according to its
existing, already-governed semantics. This record does **not** authorize, and nothing in it should be read as
authorizing:

- Adding `BUSINESS_PHONE`.
- Modifying `ContactIdentifierKind`.
- Modifying `containsPersonalContactIdentifier()`.
- Modifying K1 detection rules.
- Changing K1 evidence rejection rules.

The product/commercial eligibility layer defined here is intentionally separate from K1 classification. This
record reads K1's existing detection output; it does not alter K1 itself.

## 5. Opportunity, qualification, and contact channel — defined as separate concepts

### Opportunity
A prospect for which at least one contact channel is available (§4.1).

### Qualification
How relevant the prospect is to the user's stated service/target customer (i.e., target-customer match, per
`CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` §7 — unmodified, unredefined here).
Qualification affects ranking, confidence, warnings, or presentation. **It does not affect opportunity
eligibility.**

### Contact channel
An available email or phone identifier (one of `BUSINESS_EMAIL` / `PERSONAL_EMAIL` / `UNCERTAIN_EMAIL` / `PHONE`,
as detected by K1) that can be used for outreach.

**The system must not discard an opportunity merely because:**
- the email is classified `PERSONAL_EMAIL`,
- the email is classified `UNCERTAIN_EMAIL`, or
- target-customer match is `NO`.

Those classifications may affect ranking, confidence, warnings, or presentation — they do not make the prospect
cease to be an opportunity.

## 6. Relationship to prior records

### 6.1 Explicitly superseded

`CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md` (`CLIENT-FINDER-1499-Q-UNLOCK-1B-LEAD-
UNLOCK-ELIGIBILITY-PO-DEC-001`), specifically its §5.1/§5.3 two-condition eligibility rule:

> target-customer match = YES **AND** at least one of `BUSINESS_EMAIL`/`PHONE`.

That rule is **no longer authoritative for the current ₹1,499 product's opportunity eligibility.** The new rule is
stated in §4 above: **at least one contact channel available**, full stop — where "contact channel" now also
includes `PERSONAL_EMAIL` and `UNCERTAIN_EMAIL`, and target-customer match is removed as a gating condition
entirely.

**That record is preserved as historical governance and is NOT deleted.** See §7 for the supersession notice added
to it.

### 6.2 Not reopened / unaffected

- `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` (`...-PO-DEC-002`) — the ₹1,499 = 30-day
  time-bounded-access commercial model (no credits, no balance, no per-unlock charge, no fixed lead/unlock quota)
  is **unaffected** and remains the governing commercial model. This record operates entirely under that model: no
  credits, no 300-credit allocation, no 10-credit debit, no fixed number of lead unlocks, no 30-lead promise.
  Contact access does **not** consume credits.
- `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md` (Q-UNLOCK-1) — the *behavioral*
  definition of a successful unlock (explicit user-initiated action that reveals/accesses qualifying contact
  information; idempotency required) is **unaffected**.
- `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`, `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_
  DECISION.md`, `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md`, `CLIENT_FINDER_1499_IMPLEMENTATION_
  READY_LIFECYCLE_PO_DECISION.md` — unaffected except where they themselves restate the now-superseded Q-UNLOCK-1B
  eligibility text; those restatements are addressed by the cross-reference notes in §7, not by rewriting those
  records' own decisions.
- `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` — the tri-state (match/no-match/
  not-yet-observed) definition of target-customer match itself is **unaffected**. What changes is only its *role*:
  it is a qualification/ranking signal, not an eligibility gate, for ₹1,499 opportunity purposes.
- K1 (`packages/core-research/src/contactIdentifiers.ts`) — unaffected (§4.3).
- Path B's current intake-rejection behavior — unaffected; not reopened or resolved here.

## 7. Contact reveal

The eventual implementation must reveal the actual available contact value(s) associated with the opportunity:

- `BUSINESS_EMAIL` available → reveal it.
- `PERSONAL_EMAIL` available → reveal it.
- `UNCERTAIN_EMAIL` available → reveal it.
- `PHONE` available → reveal it.
- Multiple channels available → reveal the available qualifying channels, according to the eventual engineering
  design.

Do **not** invent contact values. Do **not** expose unrelated personal information. Do **not** alter K1
classification.

## 8. Governance safety — not decided here

This record does not infer or decide any additional product behavior beyond §4–§7. In particular, the following
remain **separate, unresolved engineering/product questions**, not decided by this record:

- Ranking formulas.
- Scoring weights.
- Minimum evidence quality.
- Freshness requirements.
- Contact precedence (which channel is shown first/preferred when multiple are available).
- Whether all available contacts or only one contact is displayed.
- Fair-use limits.
- Rate limits.

## 9. Governing documents updated/referenced as a result of this record

- `CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md` — supersession/reference note added
  (§7 of this record's own tracking, applied as a new section in that file); file preserved, not rewritten or
  deleted.
- `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` — supersession/reference note added to §5.4, which
  had restated the now-superseded two-condition rule.
- `CLIENT_FINDER_1499_IMPLEMENTATION_READY_LIFECYCLE_PO_DECISION.md` — supersession/reference note added to its
  governing-decisions table row citing Q-UNLOCK-1B.
- `CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md` — updated (§B, §G, §I, §L) to reflect contact-availability
  eligibility and target-customer match as a qualification/ranking signal only; see that document's own Revision 3
  notice.
- `CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_INVESTIGATION.md` — updated only where necessary (§9 cross-
  reference, and a new note on Risk #1's scope) to reflect that `BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/
  `PHONE` can all qualify and that target-customer match is not an eligibility gate. Path A/Path B findings and K1
  are unchanged.

## 10. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
any modification to `ContactIdentifierKind`, `packages/core-research/src/contactIdentifiers.ts`, or K1's
classification/detection semantics; database changes; credit-ledger, enforcement, eligibility-check, or
idempotency-mechanism implementation; entitlement, access, or UI changes; payment or billing logic; route or
service changes; deployment, release, or production traffic of any kind; commit or push of any file.

## 11. Governance statement

This is a Product Owner commercial/product decision record only. It decides that ₹1,499 opportunity eligibility for
contact access requires **at least one available contact channel** (`BUSINESS_EMAIL`, `PERSONAL_EMAIL`,
`UNCERTAIN_EMAIL`, or `PHONE`, as detected by K1's existing, unmodified classification), and that target-customer
match is a qualification/ranking signal only, not an eligibility gate. It explicitly supersedes the two-condition
rule (target-customer match = YES **AND** `BUSINESS_EMAIL`/`PHONE`) previously decided in Q-UNLOCK-1B, for ₹1,499
opportunity-eligibility purposes specifically. It does not modify K1's `ContactIdentifierKind`,
`containsPersonalContactIdentifier`, or any other K1 detection/classification code or semantics. It does not modify
the ₹1,499 subscription/access commercial model (no credits), Q-UNLOCK-1's behavioral definition of a successful
unlock, the new SKU decision, or PCG-4's own definition of target-customer match. It does not decide ranking,
scoring, evidence-quality, freshness, contact-precedence, display-cardinality, fair-use, or rate-limit rules (§8).
No code, schema, migration, test, route, or service file is changed, staged, committed, pushed, or deployed as a
result of this record.

**Remaining genuine blockers before implementation authorization:**
1. Contact-value capture (unchanged, pre-existing blocker — see `CLIENT_FINDER_1499_PRE_IMPLEMENTATION_BLOCKER_
   INVESTIGATION.md` Risk #1): no code currently stores the actual matched `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`
   string value for an Opportunity/Prospect/Company (only `BUSINESS_EMAIL`/`PHONE` value-capture was previously in
   scope under the old rule); this record widens the set of values that eventually need to be revealable, which
   widens, not narrows, that pre-existing blocker's scope.
2. Razorpay Subscriptions API verification (unchanged, pre-existing blocker — unaffected by this record).
3. Display/precedence/ranking mechanics (§8) remain undecided and will need their own, separate Product Owner or
   engineering decision before the reveal UI/response shape can be finalized.

**Next governance action:** none required to proceed with engineering design of the opportunity-eligibility check
itself; implementation still requires its own, separate, explicit Product Owner authorization, consistent with the
governance scope stated throughout this and all related records.
