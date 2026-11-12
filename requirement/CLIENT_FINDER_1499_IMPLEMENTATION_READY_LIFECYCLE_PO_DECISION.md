# ₹1,499 Advanced Subscription — Implementation-Ready Lifecycle Decisions (Delegated PO Authority)

## 1. Decision ID

`CLIENT-FINDER-1499-IMPLEMENTATION-READY-LIFECYCLE-PO-DEC-001`

## 2. Decision status

**DECIDED** (items A–P in §5, plus the P-CORRECTION amendment in §5 finalizing configuration semantics — see §3).
The P-CORRECTION is a **subsequent Product Owner clarification/correction** to item P's original wording, which
left room to imply that `credits_per_period` and `credits_per_unlock` were ordinary engineering configuration;
the Product Owner has corrected this — see P-CORRECTION. No other item (A–O, or P's `duration_days` treatment) is
changed by this amendment. This is a **Product Owner commercial/behavioral decision record only**. It grants **no
implementation, catalog, schema, payment, entitlement, credit-ledger, enforcement, UI, worker, route, or
test-authoring authority**. No code, test, schema, migration, catalog file, route, service, webhook, or
payment/entitlement/billing logic is modified, authorized, or implied by this record.

## 3. Decision authority

**Delegated Product Owner authority.** The Product Owner explicitly delegated decision authority for the
remaining product/behavior questions needed to make the already-approved ₹1,499 subscription model
implementation-ready (session instruction: "PRODUCT OWNER DELEGATION — ₹1,499 ADVANCED CLIENT FINDER
IMPLEMENTATION DESIGN DECISIONS"), explicitly stating this delegation is **not** implementation authorization.
Items A–P below are decided under that delegation, applying the Product Owner's stated decision principles
(simple user-facing behavior; predictable billing; no accidental double charging; no accidental double credit
allocation; strong financial/audit correctness; easy recovery from webhook retries; clear subscription-period
boundaries; no silent changes to historical products; minimal implementation complexity; compatibility with the
existing repository architecture). No item below reinterprets, narrows, or overrides an already-decided PO
requirement; where an item touches an area a prior record left open, that prior record is cited and not modified.

## 4. Already-decided requirements consulted (authoritative; NOT reopened by this record)

| Record | Already-decided fact this record builds on, without changing |
|---|---|
| `CLIENT_FINDER_1499_SUBSCRIPTION_CREDIT_MODEL_PO_DECISION.md` (PO-D1–PO-D11) | Subscription-period (not calendar-month) validity for all kits; ₹1,499 = all-tier eligibility while active; 300 credits/period; no rollover; fresh 300 on renewal; configurable duration-in-days, default 30; duration fixed at a period's own activation even if config later changes |
| `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` (§5, §5A) | `ai_client_acquisition_1499` unchanged/unrepurposed; new, distinct SKU literal `ai_client_acquisition_1499_subscription`; SKU does not encode duration/credits |
| `CLIENT_FINDER_1499_CREDIT_CONSUMPTION_RATE_PO_DECISION.md` | 10 credits = 1 successful unlock; 30 unlocks/period derived capacity |
| `CLIENT_FINDER_1499_Q_UNLOCK_1_SUCCESSFUL_UNLOCK_DEFINITION_PO_DECISION.md` (Q-UNLOCK-1) | Successful unlock = explicit user-initiated unlock of a qualified lead that successfully reveals/accesses qualifying business contact information; only success consumes credits; debit must be idempotent; §7 left "qualifying business contact information" itself undefined |
| `CLIENT_FINDER_1499_Q_UNLOCK_1B_LEAD_UNLOCK_ELIGIBILITY_PO_DECISION.md` (Q-UNLOCK-1B) | Eligibility = target-customer match (PCG-4) = YES **and** at least one of `BUSINESS_EMAIL`/`PHONE` (K1-detected); `PERSONAL_EMAIL`/`UNCERTAIN_EMAIL` do not qualify; PHONE's acceptance is commercial-layer only, K1 unchanged — **SUPERSEDED for opportunity eligibility by `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`...-PO-DEC-002`): current rule is at least one contact channel available (`BUSINESS_EMAIL`/`PERSONAL_EMAIL`/`UNCERTAIN_EMAIL`/`PHONE`), target-customer match is a qualification/ranking signal only, not a gate** |
| `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` (ES-1, ES-5–ES-11) | ₹499/₹1,499 Client Finder entitlements are cumulative/coexisting with separate credit buckets; ₹1,499 governs feature access while active; ES-9 ("renewal/expiry/cancellation OUT OF MVP") was already superseded **as policy** by PO-D1, not as implementation — this record continues that policy-level resolution under the present delegation, still without authorizing implementation |
| `packages/core-entitlements/*`, `packages/core-payments/*`, `packages/catalog/*`, `packages/core-opportunity/*`, `packages/core-research/contactIdentifiers.ts`, `packages/core-research/targetCustomerMatch.ts` | Repository architecture consulted per §4 of the delegation — see citations inline in §5 below |

## 5. DECIDED (A–P, under delegated PO authority)

### A. Subscription activation/start timestamp

- **Decision ID:** `IRL-A`
- **Question:** When exactly does a subscription period's "start" occur?
- **Decision:** A subscription period's activation/start timestamp is the timestamp at which the recurring-charge
  **capture** event for that period is durably recorded via the Razorpay webhook (the same deterministic,
  webhook-sourced event the existing one-time flow already relies on for `payment.captured`, in
  `packages/core-payments/src/webhookHandler.ts`) — not the timestamp of a client-side checkout call, UI
  confirmation, or order creation.
- **Rationale:** The existing one-time flow already treats the webhook-captured event, not client confirmation, as
  authoritative (`apps/web/app/api/payments/verify/route.ts` is explicitly a non-trusted 501 stub). Reusing that
  pattern for subscription activation keeps one deterministic source of truth and avoids a second, less reliable
  signal.
- **User-visible behavior:** The subscription (and its credits) become usable as soon as payment is confirmed
  server-side — typically near-instant, with no separate "activation" step for the user to perform.
- **Implementation implication:** A future subscription-webhook handler would record this timestamp once per
  period, analogous to how `payment.captured` currently triggers entitlement grant.
- **Engineering-only (not decided here):** Exact webhook event name/payload shape for Razorpay subscription
  capture; retry/backoff mechanics for webhook delivery.

### B. Subscription expiry semantics

- **Decision ID:** `IRL-B`
- **Question:** Exactly when does access become inactive after the configured duration?
- **Decision:** `expiry_timestamp = activation_timestamp (A) + duration_days (the value configured and locked in
  for that period at its own activation, per PO-D7/PO-D10)`. The period — and the all-tier access and credit
  allocation it carries — is active while the current time is strictly before `expiry_timestamp`, and inactive at
  or after `expiry_timestamp`. No separate "grace window" is implied by this definition alone (see D for payment
  failure specifically).
- **Rationale:** Directly implements PO-D7/PO-D8/PO-D10 as a deterministic function of two already-decided
  values; introduces no new concept.
- **User-visible behavior:** Access and remaining credits stop being usable at a precise, predictable moment the
  user could compute themselves (activation date + configured days).
- **Implementation implication:** Expiry is computed, not polled from a provider status flag — see O.
- **Engineering-only:** Which worker/mechanism checks this (on-demand at request time vs. a periodic sweep) is an
  implementation choice; not decided here.

### C. Renewal behavior

- **Decision ID:** `IRL-C`
- **Question:** When does a new period start, when are fresh credits allocated, does renewal extend or replace,
  and what happens if renewal payment succeeds after the previous period already expired?
- **Decision:**
  1. Each successful recurring charge (first charge or any subsequent renewal charge) creates a **new,
     independent subscription-period record** — it does not mutate or extend the prior period's row.
  2. The fresh 300-credit allocation (PO-D9) is granted atomically with that new period's creation (see F for
     idempotency).
  3. If a renewal charge is captured **after** the previous period already reached its own `expiry_timestamp`
     (B), the new period simply starts at its own activation timestamp (A) — there is no backdating and no
     "gap-filling" to cover the elapsed time between expiry and the new charge. Any access gap between the old
     period's expiry and the new period's activation is not compensated.
- **Rationale:** Independent, append-only period records match the repository's existing preference for
  immutable, auditable records (`webhook_events`, `IdempotencyReconciliation`) over mutable rolling state, and
  avoid ever needing to "undo" or retroactively edit a prior period — consistent with PO-D10's own
  no-retroactive-alteration principle, generalized to renewal timing. Not compensating gaps is the simplest rule
  that avoids inventing proration/make-up-credit mechanics the Product Owner did not request.
- **User-visible behavior:** Each successful payment visibly starts a fresh, full-duration, full-credit period;
  if a renewal happens to be delayed past the prior period's expiry, the user experiences a gap in access until
  the new charge is actually captured — no automatic backdating restores it.
- **Implementation implication:** Period records are keyed by their own id, not by a mutable "current
  subscription" row with an extended end date.
- **Engineering-only:** Exact schema shape for a period record; not decided here.

### D. Failed renewal/payment behavior

- **Decision ID:** `IRL-D`
- **Question:** What happens on a failed recurring payment — retry window, immediate access loss vs. temporary
  continuation, credit usability during any grace period?
- **Decision:** A failed recurring charge creates **no** new subscription period and allocates **no** credits. It
  has **no effect** on any currently active period — if the existing period has not yet reached its own
  `expiry_timestamp` (B), it continues exactly as before, with its already-allocated credits still usable, until
  that period's own already-fixed expiry. No separate grace-period mechanism beyond "the current period's own
  remaining duration" is introduced.
- **Rationale:** This is the simplest rule consistent with "no accidental double credit allocation" and "minimal
  implementation complexity" — it avoids inventing a new grace-period state machine distinct from the
  already-decided period/duration model, and avoids any access change triggered purely by a failed charge in
  isolation (a failed charge during an already-active, already-paid-for period should not punish the user for a
  renewal attempt that simply hasn't succeeded yet).
- **User-visible behavior:** A failed renewal charge has no immediate visible effect while the current period is
  still within its paid duration; the user only loses access once that period's own expiry (B) is reached,
  exactly as it would without any renewal attempt at all.
- **Implementation implication:** Failure handling is a no-op at the entitlement/credit layer — retries are a
  payment-provider concern (see O), not a product-state concern, until/unless a renewal eventually succeeds (C)
  or the current period expires (B).
- **Engineering-only:** Razorpay-side retry schedule/configuration; not decided here.

### E. Overlapping subscriptions

- **Decision ID:** `IRL-E`
- **Question:** What happens if a purchase/renewal is attempted while an existing ₹1,499 period is still active?
- **Decision:** A new, separate (non-renewal) purchase attempt for `ai_client_acquisition_1499_subscription` while
  the user already holds an active period for that same product is **rejected at the product level** — the user
  is directed to their existing active subscription rather than being charged again. Periods do not extend
  sequentially, do not overlap, and remaining duration is not "added" to a new purchase. (This is distinct from a
  genuine renewal charge on the existing subscription, which is governed by C, not by this item.)
- **Rationale:** The decided model has no requirement for subscription stacking or duration-extension; rejecting a
  redundant purchase is the simplest rule that avoids double charging and avoids inventing extension/proration
  mechanics the Product Owner did not request. It is also the behavior most compatible with how a recurring
  Razorpay subscription is normally managed (the user does not re-"buy" an already-running subscription; they
  manage/cancel the existing one).
- **User-visible behavior:** If a user somehow attempts to purchase the subscription again while already
  subscribed, they are told they already have an active subscription rather than being charged twice.
- **Implementation implication:** A purchase-initiation check against "does this user already hold an active
  period for this product" is required before creating a new order/subscription-checkout session.
- **Engineering-only:** UI copy/flow for this rejection; not decided here.

### F. Credit allocation

- **Decision ID:** `IRL-F`
- **Question:** Exactly when do the 300 credits become available, and how is duplicate/failed allocation avoided?
- **Decision:** The 300-credit allocation for a period is granted exactly once, atomically with that period's
  creation (A, C) — keyed uniquely per period (e.g., one allocation row per period id). Duplicate webhook delivery
  of the same activation/renewal event must be a no-op for allocation, reusing the same idempotency pattern
  already proven for one-time orders (`packages/core-payments/src/createOrder.ts`'s idempotency-key + unique-index
  pattern, and the webhook `eventId` dedupe in `packages/core-payments/src/webhookPgStore.ts`). A failed payment
  (D) never reaches this path, because allocation is tied to a *captured* charge event, not an attempted one.
- **Rationale:** Directly reuses existing, already-proven repository idempotency patterns rather than inventing a
  new one — satisfies "easy recovery from webhook retries" and "no accidental double credit allocation."
- **User-visible behavior:** Credits appear exactly once per successful payment, even if the payment provider
  redelivers the same webhook multiple times.
- **Implementation implication:** A credit-allocation row's uniqueness constraint should be on the period id (or
  the underlying payment/charge event id), not on a time window.
- **Engineering-only:** Exact unique-constraint column choice; not decided here.

### G. Credit ledger semantics

- **Decision ID:** `IRL-G`
- **Question:** What is the minimum durable model supporting allocation, debit, expiry, no rollover, idempotency,
  auditability, and refunds/reversals?
- **Decision:** The minimum model is an **append-only ledger of two row kinds**, scoped per subscription period:
  1. **Allocation rows** — one per period (F), recording the 300 credits granted to that specific period id.
  2. **Debit rows** — one per successful unlock (H), recording the 10-credit consumption against that period id,
     keyed uniquely per unlock so a retry cannot double-debit.
  A period's usable balance is derived (`sum(allocations) − sum(debits)` for that period id only) rather than
  stored as a single mutable counter — this makes "no rollover" automatic (a new period's balance derivation never
  references a prior period's rows) and makes the ledger auditable (nothing is ever overwritten). A
  refund/reversal (N) is recorded as a new, signed ledger row referencing the original allocation — never by
  deleting or mutating a prior row.
- **Rationale:** Mirrors the repository's existing preference for immutable, append-only records
  (`webhook_events`, `IdempotencyReconciliation`, `Order`/`Payment`) over a single mutable balance column, which
  directly satisfies "strong financial/audit correctness" and avoids over-engineering (no new credit *types*, no
  arbitrary credit purchases, no multi-currency credit concepts — just two row kinds).
- **User-visible behavior:** None directly; this underpins a correct, auditable balance wherever one is shown.
- **Implementation implication:** A new ledger table/package (none currently exists — confirmed absent in the
  prior repository audit) scoped by period id, user id, and row kind.
- **Engineering-only:** Exact table/column design, indexing; not decided here.

### H. Successful unlock transaction semantics

- **Decision ID:** `IRL-H`
- **Question:** When does the 10-credit debit happen; what if reveal succeeds but debit fails, or vice versa; how
  do duplicate/simultaneous unlock requests behave; can an already-unlocked lead be re-accessed without charge?
- **Decision:**
  1. The debit and the contact reveal are a **single atomic, all-or-nothing operation**: the system only shows the
     user the lead's contact information if the 10-credit debit for that specific unlock is durably recorded in
     the same operation. There is no state where reveal succeeds but the debit did not, and no state where a
     debit is recorded without a corresponding reveal.
  2. The whole operation is keyed by a unique idempotency identifier scoped to `(user, opportunity)` — a retried
     or duplicate request for the same lead by the same user is a no-op that returns the same prior result (per
     Q-UNLOCK-1's idempotency requirement) rather than re-debiting.
  3. Two simultaneous unlock requests for the same `(user, opportunity)` resolve to exactly one successful debit
     and one revealed result; the second request observes the first's outcome rather than racing it into a double
     debit.
  4. An already-unlocked lead (by that user) is accessible again at any time **without any further charge** —
     see I for the ownership rule this follows from.
- **Rationale:** All-or-nothing framing is the only way to satisfy Q-UNLOCK-1's "only a successful unlock
  consumes credits" together with "no accidental double charging" — a partial success (charged but not shown, or
  shown but not charged) would violate one or the other. Keying idempotency on `(user, opportunity)` reuses the
  same unique-index pattern already used for order idempotency and search-creation idempotency in this
  repository.
- **User-visible behavior:** A user is never charged without seeing the contact info they paid for, and never
  sees contact info they weren't charged for; clicking "unlock" twice, or on a flaky connection, never results in
  a double charge; revisiting an already-unlocked lead never prompts another charge.
- **Implementation implication:** The unlock operation needs one transactional boundary covering both the credit
  debit and the persisted "revealed" marker, and a unique constraint on `(user_id, opportunity_id)` for that
  marker.
- **Engineering-only:** Exact transaction/locking mechanism (DB transaction vs. application-level lock); not
  decided here.

### I. Lead unlock ownership

- **Decision ID:** `IRL-I`
- **Question:** Is an unlocked lead permanently unlocked for that user, or only for the current subscription
  period?
- **Decision:** Once a lead is successfully unlocked by a user, that specific `(user, opportunity)` grant is
  **permanent** — it remains accessible to that user without any further charge regardless of later subscription
  expiry, renewal, or lapse. This permanent-access grant does **not** itself restore general subscription access,
  credits, or the ability to unlock *other* leads once the subscription is inactive (M still governs general
  access).
- **Rationale:** The delegation explicitly calls for "the behavior that... avoids surprising repeat charges" —
  re-charging a user to see contact information they already paid 10 credits for, just because their subscription
  later lapsed, would be exactly such a surprise. This also matches the existing one-time-entitlement precedent in
  this codebase, where a grant is not silently revoked by an unrelated later event.
- **User-visible behavior:** A user can always revisit contact details for any lead they previously unlocked,
  even after their subscription expires or lapses, without being charged credits or asked to resubscribe for that
  specific lead.
- **Implementation implication:** The "unlocked" marker from H is not scoped or deleted by subscription expiry.
- **Engineering-only:** None beyond H's own implementation.

### J. Contact reveal

- **Decision ID:** `IRL-J`
- **Question:** What exactly does the user receive after a successful unlock, without inventing contact fields
  K1 does not support? *(This closes the "qualifying business contact information" gap Q-UNLOCK-1 §7 explicitly
  left open and flagged as blocking.)*
- **Decision:** A successful unlock reveals the specific contact value(s) already present in that opportunity's
  verified research evidence, **limited to the same two K1-detected kinds that make the lead eligible under
  Q-UNLOCK-1B**: the `BUSINESS_EMAIL` value and/or the `PHONE` value, whichever is present. No other K1 kind
  (`PERSONAL_EMAIL`, `UNCERTAIN_EMAIL`, `FRAGMENT`) is ever revealed by this commercial unlock, and no contact
  field beyond what K1's existing `ContactIdentifierKind` already recognizes is introduced.
- **Rationale:** Directly satisfies the delegation's explicit constraint ("do not invent contact fields that K1
  does not support") by scoping reveal to exactly K1's existing, already-governed kinds, and keeps reveal content
  consistent with Q-UNLOCK-1B's eligibility test (what made the lead unlockable is exactly what gets revealed —
  no broader data exposure than the eligibility check implies).
- **User-visible behavior:** After unlocking, the user sees the business email address and/or phone number for
  that lead — never a personal email, an uncertain email, or any other field.
- **Implementation implication:** The reveal step must read the same underlying evidence/value that K1's
  detector classified as `BUSINESS_EMAIL`/`PHONE` for that opportunity — K1's public boolean-presence helpers
  (`containsAnyContactIdentifier`, etc.) only report presence, not the value itself; the actual stored value this
  decision refers to is whatever the opportunity's own verified research evidence already holds for that kind.
- **Engineering-only, and explicitly flagged for confirmation:** Where the raw `BUSINESS_EMAIL`/`PHONE` *value*
  (as opposed to just its detected presence) is actually stored today for a given opportunity is a repository
  fact to be confirmed during implementation design, not decided here — this record only decides which kinds may
  be shown, not the storage/retrieval mechanism.
- **SUPERSEDED NOTICE (added):** the "limited to the same two K1-detected kinds" scoping above (`BUSINESS_EMAIL`/
  `PHONE` only) tracked the Q-UNLOCK-1B eligibility rule that was current at the time. `CLIENT_FINDER_1499_
  OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` (`...-PO-DEC-002`) §7 now requires reveal of `PERSONAL_EMAIL` and
  `UNCERTAIN_EMAIL` values as well, when those are the qualifying channel present. The "reveal matches eligibility"
  rationale in this item is unaffected in principle — it now simply covers all four K1 kinds that qualify under
  the current rule, not two. `FRAGMENT` remains never revealed.

### K. Existing one-time ₹1,499 product's relationship to the new subscription

- **Decision ID:** `IRL-K`
- **Question:** Does ownership of historical `ai_client_acquisition_1499` have any relationship to
  `ai_client_acquisition_1499_subscription`?
- **Decision:** **No automatic relationship.** Owning the historical one-time `ai_client_acquisition_1499` product
  grants no discount, credit, waiver, or entitlement toward the new subscription, and does not require or imply
  the new subscription. They are commercially and functionally independent products; a customer may hold either,
  both, or neither.
- **Rationale:** Directly preserves the explicit governance instruction that the historical product's identity,
  historical meaning, and historical purchase/access behavior remain unchanged (per
  `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md`), and is consistent with ES-10's existing precedent that
  purchases in this product family are independent in both directions.
- **User-visible behavior:** A past one-time ₹1,499 purchaser sees no automatic subscription access, credits, or
  discount; they must separately purchase the subscription like any other customer.
- **Implementation implication:** No cross-product entitlement lookup or migration is needed between the two SKUs.
- **Engineering-only:** None.

### L. Existing users/data

- **Decision ID:** `IRL-L`
- **Question:** What migration/compatibility behavior applies to existing one-time kit purchasers, Client Finder
  users, Opportunities, and previously discovered leads?
- **Decision:** No existing one-time kit purchaser, Client Finder user, Opportunity, or previously discovered lead
  is automatically granted any ₹1,499-subscription benefit (credits, all-tier access, or unlock eligibility) by
  virtue of pre-existing data alone. Subscription benefits begin only from an actual active
  `ai_client_acquisition_1499_subscription` entitlement (consistent with K). Previously discovered
  Opportunities/leads remain visible and browsable exactly as before — searching, browsing, discovery, and
  qualification remain zero-credit events regardless of when the lead was first discovered — but are subject to
  the same unlock-eligibility (Q-UNLOCK-1B) and credit rules (10 credits/unlock) as any lead unlocked going
  forward, with no retroactive "free" or "already-unlocked" status granted to pre-existing leads.
- **Rationale:** Directly follows the delegation's own instruction ("do not silently grant new subscription
  benefits unless the product decision supports it") and K's independence rule; it is also the simplest rule that
  requires no backfill/migration logic for existing data.
- **User-visible behavior:** Existing users see no change to their past data or browsing ability; they simply
  need an active subscription (and credits) to unlock any lead, old or new, going forward.
- **Implementation implication:** No backfill of ledger rows, entitlements, or "already unlocked" markers for
  historical data is required.
- **Engineering-only:** None.

### M. Access after subscription expiry

- **Decision ID:** `IRL-M`
- **Question:** What happens to Client Finder access, previously unlocked leads, historical opportunity data, and
  unused credits once a subscription period expires?
- **Decision:**
  1. **Client Finder all-tier/Advanced access (PO-D2):** ends at `expiry_timestamp` (B); the user's access reverts
     to whatever independent ₹99/₹499 entitlements they separately hold, if any (consistent with ES-1/ES-7 — the
     ₹1,499 entitlement only *governs* access while it is itself active).
  2. **Previously, permanently unlocked leads:** remain accessible without charge — this specific grant does not
     expire (per I); expiry affects the ability to unlock *further* leads, not leads already paid for.
  3. **Historical Opportunity/search data:** is not deleted, hidden, or altered by expiry; it remains visible
     read-only exactly as before (consistent with L — no destructive action on existing data is introduced by
     this record).
  4. **Unused credits:** are forfeited at expiry — this restates, and does not change, the already-decided
     no-rollover rule (PO-D4/PO-D9).
- **Rationale:** Each sub-point directly follows from an already-decided rule (B, I, PO-D4/PO-D9) or the
  no-destructive-action default (L); nothing new is invented beyond assembling these into one clear statement of
  post-expiry behavior.
- **User-visible behavior:** After expiry, a user keeps everything they already paid for (unlocked contacts,
  browsing history) but cannot unlock new leads or use ₹99/₹499-exclusive-while-₹1,499-active features until they
  renew.
- **Implementation implication:** Expiry is a gate on *new* unlock/all-tier-access actions, not a data-deletion
  or access-revocation event for already-granted permanent unlocks.
- **Engineering-only:** None beyond B/F/G/I's own implementation.

### N. Refund/cancellation behavior

- **Decision ID:** `IRL-N`
- **Question:** What minimum product behavior is needed for refund/cancellation of a subscription period?
- **Decision:** If a subscription period's payment is refunded, or the subscription is cancelled with an
  associated refund, that period is marked inactive immediately upon the corresponding payment-provider webhook
  event (reusing the existing `refund.created`/`refund.processed` dedupe pattern already used for one-time orders
  in `packages/core-payments/src/webhookHandler.ts`). Any credits remaining unused in that period's allocation are
  forfeited at that point (not separately re-billed). Leads already permanently unlocked (per I) during that
  period are **not** retroactively re-locked. Cancellation **without** a refund does not by itself end the current
  period early — it only prevents future renewal (see O); the current, already-paid-for period runs to its own
  `expiry_timestamp` (B) as usual. Partial refunds, pro-rated amounts, and any financial/accounting treatment
  beyond "period becomes inactive, remaining credits forfeited" are **not** decided here and remain open financial
  questions outside product-behavior scope.
- **Rationale:** Reuses an already-proven webhook-dedupe pattern (satisfies "compatibility with the existing
  repository architecture" and "easy recovery from webhook retries") and extends I's "no surprising repeat
  charges" principle to the refund case — a user is not charged to re-unlock something refund processing should
  not touch. Distinguishing "cancel" from "cancel + refund" avoids inventing an early-termination mechanic the
  Product Owner did not request.
- **User-visible behavior:** A refunded subscription period stops granting new access/credits immediately upon
  the refund being processed; a merely-cancelled-but-not-refunded period continues until its already-paid duration
  ends; previously unlocked leads are unaffected either way.
- **Implementation implication:** The refund webhook path needs to also mark the corresponding subscription
  period inactive and forfeit its remaining ledger balance, mirroring how it already revokes one-time entitlements
  today.
- **Engineering-only:** Partial-refund/proration handling; not decided here — flagged as a genuinely open
  financial question if it arises.

### O. Recurring Razorpay lifecycle — product-level interpretation

- **Decision ID:** `IRL-O`
- **Question:** What is the product-level meaning of initial activation, successful recurring charge, failed
  charge, cancellation, and expiry — without assuming provider-specific technical mechanics?
- **Decision:** (Consolidates A, C, D, B, N at the product level; no new rule beyond cross-referencing them.)
  - **Initial activation** = first successful recurring charge captured (A).
  - **Successful recurring charge (renewal)** = a new, independent subscription period with fresh credits (C, F).
  - **Failed charge** = no new period, no new credits, no effect on any currently active period (D).
  - **Cancellation** (no refund) = no further renewals; the current, already-active period still runs to its own
    configured expiry (B, N).
  - **Cancellation with refund** = the current period becomes inactive immediately and forfeits remaining credits
    (N).
  - **Expiry** = the product's own `activation_timestamp + duration_days` calculation (B) is authoritative for
    access — **not** a live read of the payment provider's own subscription-status field, so the product remains
    correct even if a provider status update is delayed or temporarily inconsistent.
- **Rationale:** Assembling already-decided rules into one lifecycle statement, per the delegation's instruction
  to give a product-level interpretation "without provider-specific technical assumptions."
- **User-visible behavior:** Identical to A/B/C/D/N; this item adds no new user-facing behavior.
- **Implementation implication:** The product's own period/expiry records, not a provider status flag, should
  drive access checks.
- **Engineering-only:** Exact Razorpay subscription webhook event names/payloads; not decided here.

### P. Subscription configuration — what is configurable vs. immutable SKU identity

- **Decision ID:** `IRL-P`
- **Question:** Which values are product configuration rather than immutable SKU identity?
- **Decision:**
  - `duration_days` (default **30**) — product/plan configuration, not SKU identity (already decided, PO-D7);
    the value actually used for a given period is locked/snapshotted onto that period's own record at its
    activation (A), per PO-D10, so later configuration changes never retroactively alter an already-active
    period's expiry.
  - `credits_per_period` (default **300**) — product/plan configuration, not SKU identity; the actual amount
    granted to a given period is an immutable fact of that period's allocation ledger row (G) once recorded,
    regardless of later configuration changes — this follows automatically from G's append-only design, not from
    a separate snapshot rule.
  - `credits_per_unlock` (default **10**) — product/plan configuration, not SKU identity; applied at the
    **current** configured rate at the moment of each debit (H), rather than snapshotted per subscription period.
  None of these three values are encoded into the SKU literal `ai_client_acquisition_1499_subscription` itself
  (already decided, `CLIENT_FINDER_1499_SUBSCRIPTION_NEW_SKU_PO_DECISION.md` §5A).
- **Rationale:** `duration_days` snapshotting is an explicit prior PO instruction (PO-D10); `credits_per_period`'s
  immutability falls directly out of G's ledger design without needing a separate rule; `credits_per_unlock` is
  treated as a live, current rate because no prior record asked for it to be period-locked, and treating it
  otherwise would add a snapshot mechanism beyond what was requested (minimal complexity).
- **User-visible behavior:** A plan-configuration change to the default duration or default credit amounts only
  affects *future* subscription periods — periods already active or already granted keep what they were actually
  given.
- **Implementation implication:** `duration_days` needs to be read-and-stored onto the period record at
  activation time, not re-read from configuration later; `credits_per_unlock` can be read fresh from
  configuration at each debit.
- **Engineering-only:** Exact configuration storage location (e.g., a `products`/`plans` config table vs. an
  environment/config value); not decided here.

### P-CORRECTION — Final configuration semantics (subsequent PO clarification)

This subsection is a **subsequent Product Owner clarification/correction** to item P above. P's original wording
described all three values as "product/plan configuration" in a way that could be read as implying
`credits_per_period` and `credits_per_unlock` are ordinary engineering configuration, changeable without further
Product Owner involvement. **That reading is corrected. This subsection is the final, authoritative statement of
configuration semantics for all three values, superseding P's framing where it conflicts; P's rationale and
implementation-implication text otherwise stand.**

**The repository may store all three values as configurable plan data — that is an engineering/configuration
capability only. It does not mean the Product Owner has delegated authority to change the commercial values
(`credits_per_period`, `credits_per_unlock`) without a new, explicit Product Owner decision.**

| Value | Current value | Nature | Snapshotting rule |
|---|---|---|---|
| `duration_days` | 30 (default) | Configurable plan value — engineering may adjust this without a new PO decision (already decided, PO-D7) | **Snapshotted** onto the period record at that period's own activation (A); a later plan-configuration change never alters an already-active period's assigned duration |
| `credits_per_period` | **300** | **PO-controlled commercial value** — changing it from 300 requires a new, explicit Product Owner decision; it is not a configuration change engineering may make unilaterally, even though it may be *stored* as plan configuration | **Snapshotted/locked** onto the period record at that period's creation; an active period must never silently receive a different allocation because the plan configuration later changes |
| `credits_per_unlock` | **10** | **PO-controlled commercial value** — changing it from 10 requires a new, explicit Product Owner decision; it is not a configuration change engineering may make unilaterally, even though it may be *stored* as plan configuration | **Snapshotted/locked** for the subscription period at that period's activation; the live/current configuration must never silently change the cost of an unlock for an already-active period |

**Worked example (duration):** Period A activates with `duration_days = 30`. The plan is later changed to
`duration_days = 60`. Period A remains 30 days. A newly activated Period B may receive 60 days.

**Worked example (credits per period):** Period A activates with `credits_per_period = 300`. The Product Owner
later approves a change to 500. Period A remains 300. A newly activated Period B may receive 500 only after that
new Product Owner decision is recorded.

**Worked example (credits per unlock):** Period A activates with `credits_per_unlock = 10`. The Product Owner
later approves a new value of 20. Period A continues to use 10 for the rest of its own period. A newly activated
Period B may use 20 only after that new Product Owner decision is recorded.

**Current commercial rules, restated, unchanged:** 300 credits per active ₹1,499 subscription period;
10 credits = 1 successful real-client lead unlock; derived capacity = 300 ÷ 10 = 30 successful lead unlocks per
subscription period.

**This correction supersedes only P's "applied at the current configured rate" treatment of `credits_per_unlock`
and P's implicit framing of `credits_per_period`'s snapshotting as following "automatically" from the ledger
rather than being a PO-controlled value in its own right. It does not change `duration_days`' treatment (already
correctly snapshotted per period in the original P), and it does not change any other item (A–O) in this record.**

- **Engineering-only (unchanged by this correction):** exact configuration storage location/mechanism for all
  three values; how a snapshotted value is physically attached to a period record (e.g., columns on the period
  row vs. a separate config-version reference). What is **not** engineering-only: the commercial values
  themselves (300, 10) and any change to them — those require a new Product Owner decision, as stated above.

## 6. Explicitly NOT decided / remains open (not resolved by this record)

- Exact Razorpay subscription webhook event names/payloads (A, F, O — engineering fact-finding, not a product
  decision).
- Exact schema/table design for subscription periods and the credit ledger (B, C, G — engineering design).
- Partial-refund/proration treatment (N).
- Where the raw `BUSINESS_EMAIL`/`PHONE` *value* is currently stored for a given opportunity, as distinct from
  K1's boolean presence detection (J) — flagged for confirmation during implementation design.
- Whether `ai_client_acquisition_1499_subscription` is exposed anywhere else in the catalog/ladder type system
  (e.g., `packages/catalog/src/ladder.ts`) — a catalog-design/implementation task, not decided here.

## 7. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, catalog, dependency, or configuration change;
credit-ledger, billing, subscription, webhook, route, worker, or UI implementation; any change to
`ContactIdentifierKind`, `containsPersonalContactIdentifier`, `packages/core-research/src/contactIdentifiers.ts`,
or any other K1 detection/classification code; any change to `packages/core-research/src/targetCustomerMatch.ts`;
any change to `ai_client_acquisition_1499`'s existing identity, pricing, or deliverables; deployment, release, or
production traffic of any kind; commit or push of any file. **Per the P-CORRECTION in §5: this record does not
authorize treating a change to the commercial values of `credits_per_period` (currently 300) or
`credits_per_unlock` (currently 10) as an ordinary engineering/configuration change — any such change requires its
own, separate, explicit Product Owner decision, regardless of whether these values are technically stored as
configurable plan data.**

## 8. Governance statement

This is a Product Owner commercial/behavioral decision record, made under explicit delegated authority, covering
items A–P: subscription activation, expiry, renewal, failed-payment, overlap, credit-allocation, credit-ledger,
unlock-transaction, unlock-ownership, contact-reveal, historical-SKU-relationship, existing-user/data treatment,
post-expiry access, refund/cancellation, provider-lifecycle interpretation, and configuration-vs-identity rules,
**as finalized by the P-CORRECTION amendment**: `duration_days` is configurable plan data, snapshotted per
period; `credits_per_period` (300) and `credits_per_unlock` (10) are Product-Owner-controlled commercial values,
also snapshotted per period, that may be *stored* as configurable plan data but may not be *changed* without a
new, explicit Product Owner decision. It does not reopen, narrow, or contradict any already-decided PO
requirement listed in §4, and the P-CORRECTION does not reopen or change items A–O or `duration_days`' own
treatment within P; where it touches an area a prior record left open, it resolves that specific gap under the
present delegation and cites the prior record rather than modifying it. It does not modify any code, schema,
test, or other governance file. It does not authorize implementation (§7).

**Next governance action:** none required before implementation-design planning begins — the open items in §6 are
engineering fact-finding/design tasks, not outstanding Product Owner decisions. Implementation itself still
requires its own, separate, explicit Product Owner authorization before any code is written.
