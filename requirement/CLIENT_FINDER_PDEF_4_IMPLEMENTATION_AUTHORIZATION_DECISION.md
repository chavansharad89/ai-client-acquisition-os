# Client Finder / Client Intent Discovery — PDEF-4 Implementation Authorization Decision

**Record ID:** `CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-DEC-001`
**Date:** 2026-10-05
**Type:** Authorization decision — determines which implementation workstreams may begin. **Not** a deployment,
release, or launch authorization (see §8).

> **Authority notice.** Every determination below is made under **delegated Product Owner authority exercised by
> Claude for this task**, at the user's explicit instruction, consistent with the provenance model already used in
> `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`, `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`,
> `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`, and
> `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`. This record does not reopen any policy or engineering
> decision made in those four records; it determines only which already-decided workstreams may now be built.

## 0. New Product Owner decisions supplied for this task (PO-1, PO-2, PO-3)

These three were supplied directly as task instructions, not derived by delegated authority, and are treated as
authoritative inputs to this record:

- **PO-1 — Validation evidence retention.** 90 days post-validation-run; immutable after creation; must identify
  gate, measurement window, dataset/snapshot, calculation, validation result, and reconciliation outcome;
  read-only audit/compliance access only. **Does not authorize deployment, release, or launch.** This resolves
  the retention-duration item that `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` §4 (B-2, item 8) and
  `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` §7 left open as classification **C**.
- **PO-2 — `completed_at` backfill.** No historical backfill. `searches.completed_at` applies only to searches
  completed after instrumentation deployment; historical rows remain `NULL`. This resolves the classification-**C**
  item left open in the preparation record §1.4 field 13.
- **PO-3 — ₹1,499 exposure (implementation-readiness, not new policy).** Repository inspection performed for this
  record (below) establishes the facts needed to close the preparation record's §1.3/§7 classification-D-candidate
  item.

## 1. PO-3 repository finding (performed before authorizing W-3/W-4)

**Finding:** There is no dedicated ₹1,499 UI component, and none is needed. The upsell flow is one generic,
server-rendered page — `apps/web/app/upsell/[productId]/page.tsx` — parameterized by the `productId` route
segment, which Next.js resolves **server-side** before render. The page resolves `productId` to a `Product` via
`getProduct()` (`@acos/catalog`, backed by the frozen `PRODUCT_CATALOG` in `packages/catalog/src/products.ts`),
and already distinguishes tiers server-side today (`product.amountPaise === 49900 ? '₹499' : '₹1,499'`,
`apps/web/app/upsell/[productId]/page.tsx:62`). `productId` (enum: `'ai_freelancing_499' | 'ai_client_acquisition_1499'`,
among others) is therefore **already** a minimum, server-resolvable tier identity, unambiguous and not
client-supplied, available at the exact render call site where `UpsellTracker` (`apps/web/src/components/UpsellTracker.tsx`)
fires today's browser-only `upsell_viewed` event with `{ productId, fromTier }`.

**Determination:** The existing generic component is sufficient. No new UI component is invented, and PDEF-4 is
not amended merely because the component is generic. The minimum server-resolvable tier identity for exposure
persistence (§1.3/§1.4 below) is `productId` (equivalently, `Product.amountPaise` from the frozen catalog) —
already resolved server-side at the exposure screen's own render path. **PO-3's stop condition (inability to
distinguish ₹499 vs. ₹1,499 exposure) does not apply; W-3/W-4 are not blocked.**

## 2. Discrepancy noted, not silently resolved (PCG-6 denominator)

The task's W-10/constraint-9 text states PCG-6 should use "denominator = exposure population." No governing
record defines a PCG-6 "exposure population" — "exposure" is exclusively a PCG-3A/3B concept (first impression of
a tier's offer screen, per `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` Q-5/Q-6). PCG-6's
actual, already-decided denominator is `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` §12 (B-8): the
activation population from B-5 (holders with ≥1 `Search` row reaching `completed_at`). This record treats the
task's wording as a mistaken paraphrase, not a redefinition instruction — the same treatment
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`'s own header applied to its B-2/B-3 label discrepancy.
**W-10 below authorizes B-8's actual decision (activation population), not a new, undecided "exposure population"
denominator.** Numerator = reviewed event (B-1) and "no additional numeric sample floor" (B-9) are followed as
stated and are not in tension with any governing record.

## 3. Governing records reconciled (read in full for this decision; none reopened)

`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`, `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`, `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`,
`CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_ORDERED_QUESTIONNAIRE.md`, `MVP_SCOPE_BOUNDARY.md`,
`docs/ARCHITECTURE.md`, `PROJECT_MASTER_CHECKLIST.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`,
`CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`, `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`. SHA-256 of each,
verified immediately before writing this record, is repeated in §9 and re-verified unchanged after.

No contradiction with any of the above was found. No stop condition in §7 of the task instruction (contradiction
with a governing decision; missing required policy; untrustworthy evidence path; ₹499/₹1,499 indistinguishability;
semantics-altering schema change; unresolved security/privacy issue affecting measurement evidence) is triggered by
any workstream below, for the reasons stated per-workstream. **No workstream is classified BLOCKED.**

---

## 4. Authorization matrix

Classification legend: **AUTHORIZED** (implementation may begin), **NOT AUTHORIZED** (explicitly out of scope —
none here), **BLOCKED** (a stop condition applies — none here).

### W-1 — PCG-1 authoritative demonstrated-intent evidence — **AUTHORIZED**

1. **Exact scope:** Build the PCG-1 computation reading the server-created `Order` row (any status) as the
   "demonstrated intent" evidence, joined to the visitor identity captured at funnel entry (W-2), windowed on
   `Order.createdAt`. The browser `CheckoutStarted` event is **not** used as launch-gating evidence.
2. **Governing decision:** B-11a/B-11b/B-11c (`ENGINEERING_BLOCKER_DECISION.md` §1–§3); Q-1/Q-2
   (`INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`); PDEF-4 §6.5 (floor = 500).
3. **Repository files:** `packages/core-payments/src/createOrder.ts:116-138` (read-only reference — **no change**
   to payment logic); `packages/db/prisma/schema.prisma` `Order` model (add nullable `visitor_id` only, per W-2);
   a new PCG-1 computation module (location to be chosen during implementation — no existing `packages/core-*`
   module is an obvious home; this is implementation detail, not a policy gap).
4. **Schema impact:** One new nullable column, `Order.visitor_id` (see W-2/W-15, M-3). No change to existing
   `Order` columns, constraints, or payment semantics.
5. **Tests:** Fixture cases per `IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` §1.1 field 9 (qualifying
   visitor counts; funnel-entry-only without `Order` does not count; boundary cases at window edges).
6. **Acceptance criteria:** PCG-1's count matches an independently-written cross-check query (W-13) over the same
   raw rows; no visitor is counted from a `CheckoutStarted` event alone.
7. **Dependencies:** W-2 (visitor identity) must exist first — the join key.
8. **Rollback considerations:** Purely additive (new nullable column, new read-only computation module); no
   existing write path is altered; rollback is "drop the new column/module," with no data-loss risk to `Order`.
9. **Validation requirements:** Hard-blocker gate — full B-2 process applies (CI fixtures + named
   non-implementing-role production cross-check) before any result is used for launch-qualification (not before
   implementation).

### W-2 — First-party visitor identity — **AUTHORIZED**

1. **Exact scope:** A new, dedicated first-party cookie, set server-side on first contact, independent of
   `_fbp`/`_fbc`/`tabScope`. Cookie name, lifetime, and `SameSite`/security attributes are engineering
   implementation detail and may be finalized during implementation; they do not alter governing policy.
2. **Governing decision:** B-10 (`ENGINEERING_BLOCKER_DECISION.md` §5); Q-2.
3. **Repository files:** New cookie-issuance call site (candidate: middleware or a server action — not yet
   located); `apps/web/app/api/payments/create-order/route.ts` and `createOrder.ts` (read the cookie, thread it
   into the `Order` insert as `visitor_id`); funnel-entry capture call site (read the same cookie).
4. **Schema impact:** None directly for the cookie. Enables `Order.visitor_id` (W-1/W-15, M-3).
5. **Tests:** Same-session stability across both funnel-entry paths (Q-2); two distinct browsers never merge.
6. **Acceptance criteria:** A single browser session is counted once in PCG-1 regardless of entry path.
7. **Dependencies:** None upstream. W-1 and W-3/W-4 depend on this.
8. **Rollback considerations:** A new cookie and a new nullable column are both fully additive; removing the
   cookie-issuance code leaves existing checkout/payment flows unaffected (the column stays nullable/unused).
9. **Validation requirements:** Covered by W-1/W-3/W-4's own validation; no independent validation of the cookie
   mechanism itself is separately required by any governing record.
   **Note (not a blocker, per §7 stop-condition analysis):** privacy/consent-banner treatment of a new first-party
   tracking cookie was not found or assessed as an existing process in this repository pass, and is not fabricated
   here. This does not block building the mechanism; it is flagged for confirmation before production traffic
   flows through it (a deployment-time, not implementation-time, concern — K1-10 remains the separate gate for
   that).

### W-3 — PCG-3A exposure persistence — **AUTHORIZED**

1. **Exact scope:** Persist first-exposure-only, per-visitor, per-tier offer-screen impressions for the ₹499
   upsell screen, using the existing `upsell_viewed` event name, extended with a server-resolved visitor id (W-2)
   and the server-resolved `productId` established in §1 above (not a client-supplied value).
2. **Governing decision:** Q-5/Q-6 (`INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`); ED-5 (`ENGINEERING_DESIGN_DECISION.md`
   — reuse `upsell_viewed` name, server-resolved id, Option C).
3. **Repository files:** `apps/web/src/components/UpsellTracker.tsx`, `apps/web/app/upsell/[productId]/page.tsx`,
   `apps/web/src/analytics/events.ts`; new persistence write (table/row-type per W-15, M-6).
4. **Schema impact:** New table or new row type within ED-1's event store for `{ visitorId, productId, tier,
   exposedAt }`, deduplicated by `(visitorId, productId)`, first-exposure timestamp only.
5. **Tests:** Same visitor viewing the same tier's screen twice (only first counts, per PREPARATION §1.3 field 9);
   dual-tier visitor tracked independently per tier.
6. **Acceptance criteria:** PCG-3A's exposure population, independently reconstructed from raw records, matches
   the primary computation's reported denominator.
7. **Dependencies:** W-2 (visitor identity).
8. **Rollback considerations:** New table/row-type, purely additive; no existing `upsell_viewed` consumer is
   changed in behavior, only in persistence.
9. **Validation requirements:** Hard-blocker gate (PCG-3A) — full B-2 process required before launch-qualification
   use.

### W-4 — PCG-3B exposure-window mechanics — **AUTHORIZED**

1. **Exact scope:** Identical mechanism to W-3, applied to the ₹1,499 offer screen, using the same generic
   `apps/web/app/upsell/[productId]/page.tsx` render path with `productId = 'ai_client_acquisition_1499'` (per §1
   finding — no separate component). Independent of ₹499 ownership, per PDEF-2.
2. **Governing decision:** Q-5/Q-6; PDEF-2 (independent purchase, not reopened).
3. **Repository files:** Same as W-3 (shared generic page/component).
4. **Schema impact:** Same table/row-type as W-3 (M-6), `tier`/`productId`-discriminated.
5. **Tests:** Same as W-3, plus a fixture confirming ₹499 and ₹1,499 exposure rows are independently attributable
   for a dual-tier-eligible visitor.
6. **Acceptance criteria:** PCG-3B's exposure population matches an independent reconstruction; never conflated
   with PCG-3A's.
7. **Dependencies:** W-2, and shares W-3's persistence mechanism (built once, used for both tiers).
8. **Rollback considerations:** Same as W-3.
9. **Validation requirements:** Hard-blocker gate (PCG-3B) — full B-2 process required before launch-qualification
   use.

### W-5 — `searches.completed_at` — **AUTHORIZED** (no backfill, per PO-2)

1. **Exact scope:** Add `searches.completed_at TIMESTAMPTZ NULL`, set exactly once by the existing
   `completeClaimed()` write that transitions a search to `COMPLETE`. **No historical backfill** (PO-2): rows
   completed before this migration ships remain `NULL` permanently; no value is inferred from `createdAt`,
   `updatedAt`, feedback timestamps, or any other proxy.
2. **Governing decision:** B-5 (`ENGINEERING_BLOCKER_DECISION.md` §6); PO-D1 (`status = 'COMPLETE'` filter); **PO-2
   (this task, §0 above — resolves the backfill item the preparation record left open as classification C).**
3. **Repository files:** `packages/db/prisma/schema.prisma` (`Search`/`searches` model); `packages/core-search/src/pgRepository.ts:191-209`
   (`completeClaimed`'s existing `UPDATE ... WHERE status = 'RUNNING' AND lease_owner = $2` statement — add
   `completed_at = $3` to the same `SET` clause, reusing the existing `now` parameter); `packages/core-search/src/types.ts`
   (`Search` type gains `completedAt: Date | null`).
4. **Schema impact:** One new migration, one new nullable column. No change to `status`, `lease_owner`,
   `updated_at`, or any existing column semantics.
5. **Tests:** `completed_at` set exactly once, equals `now` at the `COMPLETE` transition, never touched by
   lease-claim or error-recording writes that also touch `updated_at`; always `NULL` for any non-`COMPLETE`
   status; always `NULL` for rows completed before this migration (PO-2 compliance check).
6. **Acceptance criteria:** For completed searches post-deployment, `completed_at` falls between `created_at` and
   now, never null; for searches completed pre-deployment, `completed_at` is `NULL` and never backfilled.
7. **Dependencies:** None upstream. W-7 (PCG-6 denominator) and W-9/W-10 depend on this.
8. **Rollback considerations:** Additive nullable column on an existing lease-fenced write path; the existing
   `WHERE status = 'RUNNING' AND lease_owner = $2` idempotency guard is reused, not modified — rollback is
   dropping the column; no risk to existing search-completion behavior.
9. **Validation requirements:** PCG-4/PCG-6 are monitoring-only — no §6.10 independent-validation requirement
   applies to this column.

### W-6 — Refund-event persistence/idempotency — **AUTHORIZED**

1. **Exact scope:** A new `refund_events` table (FK to `Payment`; amount; full/partial flag; timestamp; source
   webhook event id; reversed/corrected flag), written inside the same transaction as the existing
   `WebhookEvent` dedup insert, for `refund.processed` (and any reversal event Razorpay emits). Reuses
   `WebhookEvent.razorpayEventId @unique` for raw dedup — no new idempotency primitive. Full refunds, partial
   refunds, reversals, duplicates, and economic finality (Q-11/Q-12) are all represented by this table's shape.
   No existing payment behavior is altered.
2. **Governing decision:** B-6 (`ENGINEERING_BLOCKER_DECISION.md` §7); B-4 (test scope, §11); ED-6
   (`ENGINEERING_DESIGN_DECISION.md` — reuse dedup, isolate logic); Q-11/Q-12.
3. **Repository files:** `packages/core-payments/src/webhookHandler.ts:7-19,48,137` (extend `SUPPORTED_EVENTS`;
   reuse the documented transaction/dedup pattern — insert `webhook_event`, then `refund_events`, in one
   transaction); `packages/core-payments/src/webhookRetention.ts:86-105` (existing allowlist already anticipates
   the payload shape); `tests/contract/razorpay-webhook.contract.test.ts` (fill the three `it.todo` stubs).
4. **Schema impact:** One new migration, one new table (`refund_events`). `PaymentStatus.REFUNDED` (existing enum
   value) is **not** used as the sole representation, per B-6 — no change to `Payment`'s existing columns.
5. **Tests (B-4 behavioral scope):** the three existing stubs; duplicate `refund.processed` delivery; partial-
   then-partial refund on one `Payment` (counts once); reversal before window close (corrects numerator);
   same reversal after window close (does not reopen); out-of-order delivery; unresolvable `order_id`/`payment_id`.
6. **Acceptance criteria:** Every behavioral-scope test passes; a reversed-then-re-refunded transaction counts
   exactly once in PCG-5; a post-close refund never changes a closed PCG-5 evaluation.
7. **Dependencies:** None upstream.
8. **Rollback considerations:** New table, new event-type handling added to an existing dispatch — no existing
   `payment.captured` handling path is modified; rollback drops the new table/branch with no effect on existing
   payment processing.
9. **Validation requirements:** PCG-5 is monitoring-only — no §6.10 requirement. PCG-2 (hard blocker) does not
   read refund state at all (Q-4), so this workstream carries no hard-blocker validation obligation.

### W-7 — Reviewed-event persistence — **AUTHORIZED**

1. **Exact scope:** First-view-only, deduplicated-by-`(userId, opportunityId)` "reviewed" event, persisted as a
   side effect on `apps/web/app/(client-finder)/opportunities/[id]/page.tsx`'s first render for a given pair, via
   a unique-constraint-guarded insert (not a feedback-submission proxy).
2. **Governing decision:** B-1 (`ENGINEERING_BLOCKER_DECISION.md` §9); ED-9 (dedicated event, decided).
3. **Repository files:** `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` (add the side-effect write
   alongside existing reads); `packages/core-opportunity/src/service.ts:517-553` (read-only reference — the
   Phase-15 comment documenting this prior gap; **not** modifying `recordFeedback`, lines 486-503).
4. **Schema impact:** A new table (or a new row type within ED-1's generic event store, if its schema supports
   that without a new table — an implementation choice, not a policy question) with a uniqueness constraint on
   `(userId, opportunityId)`.
5. **Tests:** Two renders by the same user produce exactly one row; two different users viewing the same
   opportunity each produce their own row.
6. **Acceptance criteria:** Reviewed-event count for an opportunity never exceeds distinct viewing users;
   re-renders by the same user never increment it.
7. **Dependencies:** ED-1's durable event store must exist.
8. **Rollback considerations:** Additive side-effect write on an existing read-only render path; the existing
   render and its data-fetching are untouched if the write is removed; no risk to the opportunity-detail page's
   existing behavior.
9. **Validation requirements:** Feeds PCG-6 (monitoring-only) — no §6.10 requirement applies.

### W-8 — Standalone qualification evaluator — **AUTHORIZED**

1. **Exact scope:** A new, standalone, pure evaluator module — structurally parallel to, but **not inside or
   extending**, `packages/core-qualification/` — taking `{ search: Search, opportunity: Opportunity }` and
   returning a structured per-criterion result (service match, customer match, value-threshold match; each
   independently satisfied/not-satisfied, with fail-soft behavior on missing/malformed criteria fields: a
   specific criterion is marked not-satisfied with a stated reason rather than throwing). Deterministic — no I/O,
   no clock, no randomness. Result is persisted in a new table, separate from `qualifications`.
2. **Governing decision:** B-3 (`ENGINEERING_BLOCKER_DECISION.md` §8); ED-10 (`ENGINEERING_DESIGN_DECISION.md` —
   new standalone module, decided); Q-10 (non-equivalence finding, decided, not reopened).
3. **Repository files:** New module (location not yet chosen — e.g. `packages/core-client-finder-match/`;
   implementation detail); `packages/core-search/src/types.ts` (`Search.criteria`, read-only dependency);
   `packages/core-opportunity/src/types.ts` (`Opportunity`, read-only dependency). **No file under
   `packages/core-qualification/` is modified.**
4. **Schema impact:** One new table for the evaluator's persisted result, upserted on `(searchId, opportunityId,
   evaluatorVersion)`. No change to the existing `qualifications` table (migration `0022`).
5. **Tests:** Fully-matching opportunity; fully-non-matching; missing/malformed criteria field exercising the
   fail-soft path per criterion; same input run twice produces identical output (determinism check).
6. **Acceptance criteria:** For a fixed input the evaluator always returns the same result; a malformed criteria
   field never throws and marks only that criterion not-satisfied, with a stated reason.
7. **Dependencies:** None upstream. W-9 depends on this.
8. **Rollback considerations:** Entirely new, isolated module and table; zero coupling to `core-qualification`'s
   existing code; removing the module has no effect on existing qualification behavior.
9. **Validation requirements:** Feeds PCG-4 (monitoring-only) — no §6.10 requirement applies directly; its
   determinism is a design-quality property, not a formal validation obligation for this module.
   **Open, non-blocking item carried forward:** the precise semantic distinction between "not-satisfied" and
   "indeterminate" under fail-soft behavior is an engineering-design detail to resolve before the test suite is
   finalized (per `ENGINEERING_BLOCKER_DECISION.md` §8 item 8) — does not block starting this workstream.

### W-9 — Useful-outcome calculation — **AUTHORIZED**

1. **Exact scope:** PCG-4 numerator = `feedback.useful = true` **AND** W-8's evaluator match = true, evaluated
   per-opportunity (both conditions on the same opportunity). No OR condition.
2. **Governing decision:** B-7 (`ENGINEERING_BLOCKER_DECISION.md` §10); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`
   §9 (verbatim text, not reopened).
3. **Repository files:** Migration `0020_feedback` (`feedback.useful`, read-only); W-8's new persisted result
   table (read-only); a new PCG-4 computation module (location TBD, implementation detail).
4. **Schema impact:** None beyond W-5 and W-8.
5. **Tests:** `useful=true` + evaluator match (counts); `useful=true` alone (does not count); evaluator match
   alone (does not count); neither (does not count).
6. **Acceptance criteria:** Numerator equals the count of opportunities satisfying both operands on the same
   opportunity, never either alone.
7. **Dependencies:** W-8 (evaluator), W-5 (activation population via `completed_at`).
8. **Rollback considerations:** Read-only aggregation query; no write path; trivially removable with no data
   impact.
9. **Validation requirements:** PCG-4 is monitoring-only — no §6.10 requirement.

### W-10 — PCG-6 measurement — **AUTHORIZED** (per §2's discrepancy note — B-8/B-9, not a new "exposure population")

1. **Exact scope:** Numerator = W-7's reviewed event; denominator = W-5's activation population (holders with ≥1
   `Search` row at `status = 'COMPLETE'`, via `completed_at`) — **the already-decided B-8 denominator**, not the
   PCG-3A/3B "exposure population" concept (see §2). No numeric sample floor (B-9) — raw percentage and raw
   denominator always reported together, never suppressed.
2. **Governing decision:** B-8, B-9 (`ENGINEERING_BLOCKER_DECISION.md` §12–§13).
3. **Repository files:** Reads W-7's reviewed-event store and W-5's `completed_at` column; a new PCG-6
   computation module (location TBD).
4. **Schema impact:** None beyond W-5/W-7.
5. **Tests:** Activated holder with a reviewed-event row (counts); activated holder without (does not count);
   fixture confirming no NOT-YET-EVALUABLE suppression is ever applied regardless of denominator size.
6. **Acceptance criteria:** Percentage and denominator both always render; denominator always equals W-5's
   activation definition.
7. **Dependencies:** W-5, W-7.
8. **Rollback considerations:** Read-only aggregation; trivially removable.
9. **Validation requirements:** Monitoring-only — no §6.10 requirement.

### W-11 — Rolling-window query/reporting — **AUTHORIZED**

1. **Exact scope:** Extract `core-reconciliation`'s half-open-window boundary discipline into a small, shared,
   reusable boundary utility (ED-7); apply it across all six gates' windowing, with per-gate population/filter
   logic kept bespoke (not forced into a shared abstraction). Report the four PO-D2 numeric floors (PCG-3A: 100,
   PCG-3B: 200, PCG-4: 25, PCG-5: 125) as NOT-YET-EVALUABLE gates below their denominator floor; PCG-1/PCG-2 use
   their existing absolute floors (500/50, PDEF-4 §6.5); PCG-6 uses no floor (B-9).
2. **Governing decision:** ED-7 (`ENGINEERING_DESIGN_DECISION.md`); Q-8/PO-D2 (`INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`
   §5); PDEF-4 §6.5; B-9.
3. **Repository files:** `packages/core-reconciliation/` (reference pattern, read-only — the boundary logic is
   extracted, not the module itself modified beyond that extraction); new shared windowing utility module
   (location TBD).
4. **Schema impact:** None directly; consumed by every other workstream's computation query.
5. **Tests:** No double-count/no-gap boundary-tiling cases (window edges, exactly-at-floor denominators) for each
   of the four floored gates.
6. **Acceptance criteria:** No PCG-1..6 window ever double-counts or gaps an event at a boundary; the four PO-D2
   floors and the two absolute floors are applied exactly as decided, inventing no new numbers.
7. **Dependencies:** Feeds every other computation workstream (W-1, W-3/W-4, W-9, W-10).
8. **Rollback considerations:** A shared utility extracted from an existing, already-tested module; no change to
   `core-reconciliation`'s own existing behavior.
9. **Validation requirements:** Boundary correctness is exactly what W-12's fixture suite is required to exercise
   for the four hard-blocker gates.

### W-12 — Independent-validation fixtures — **AUTHORIZED**

1. **Exact scope:** A deterministic fixture/replay test suite (ED-12 track B) covering window boundaries,
   duplicate events, dual-tier users, refund reversals, and insufficient-sample conditions, run in CI on every
   change touching gate-computation code, for PCG-1/2/3A/3B.
2. **Governing decision:** B-2 (`ENGINEERING_BLOCKER_DECISION.md` §4); ED-12 Option C (decided, not reopened).
3. **Repository files:** New fixture directory (location TBD, e.g. `tests/validation/`); new CI workflow step.
4. **Schema impact:** None.
5. **Tests:** This workstream *is* the test suite — its own requirement is exercising every case enumerated in
   W-1/W-3/W-4/W-6's own field-5 test lists.
6. **Acceptance criteria:** Every fixture case passes deterministically in CI.
7. **Dependencies:** W-1, W-3, W-4 (and W-6 for refund-reversal fixtures) must exist to be exercised against.
8. **Rollback considerations:** Test-only artifact; no production code path; zero rollback risk.
9. **Validation requirements:** This workstream *is* part of the §6.10 validation requirement for PCG-1/2/3A/3B
   — it is required infrastructure, not itself subject to a further validation obligation.

### W-13 — Production cross-check validation — **AUTHORIZED** (build/role-process only; see dependency note)

1. **Exact scope:** A production cross-check query, independently written from the primary PCG-1/2/3A/3B
   aggregation, performed and signed off by a named, non-implementing engineering role (an engineer who did not
   author the corresponding gate-computation workstream), per B-2's Option 4 hybrid process. This record
   authorizes **building** this mechanism and the role-based process definition's operational use; it does
   **not** authorize treating any resulting cross-check as sufficient to approve a production launch (§8).
2. **Governing decision:** B-2 (`ENGINEERING_BLOCKER_DECISION.md` §4); ED-12 Option C; PDEF-4 §6.10.
3. **Repository files:** New, independently-authored query/report code (W-18 in the original workstream
   catalogue), structurally following `packages/core-reconciliation/src/report.ts`'s pattern.
4. **Schema impact:** None required by the cross-check mechanism itself; evidence storage is covered by W-14.
5. **Tests:** N/A — this is itself a verification process, not production code requiring its own test suite
   beyond code review during implementation.
6. **Acceptance criteria:** A recorded match/mismatch outcome, with raw source rows, the primary value, and the
   independent value, exists for a given window before that window's PCG-1/2/3A/3B result is used for
   launch-qualification.
7. **Dependencies:** W-1, W-3, W-4 (the computations being cross-checked) must exist first. **Note:** meaningfully
   exercising this against real production data presupposes production traffic exists, which in turn presupposes
   K1-10 deployment/release — a separately gated, still-NOT-AUTHORIZED decision this record does not resolve or
   advance. Building and dry-running the mechanism against fixture/staging data is not blocked by that gate.
8. **Rollback considerations:** Read-only verification code and process; no write path; no rollback risk.
9. **Validation requirements:** This workstream is itself the §6.10 production-cross-check requirement. Its
   evidence must comply with PO-1's retention/shape requirements (W-14).

### W-14 — Audit/evidence bundle — **AUTHORIZED** (retention now resolved by PO-1)

1. **Exact scope:** A per-window, per-gate evidence-bundle persistence (ED-4: snapshot of value, denominator,
   computed-at timestamp) paired with a `core-reconciliation`-style reporting layer (ED-13) and W-13's
   match/mismatch record. **Per PO-1:** every independent-validation evidence record for PCG-1/2/3A/3B must be
   retained 90 days post-validation-run, be immutable after creation, identify gate/measurement
   window/dataset-snapshot/calculation/validation result/reconciliation outcome, and be accessible read-only for
   authorized audit/compliance purposes only. This resolves the retention-duration item left open as
   classification C in `ENGINEERING_BLOCKER_DECISION.md` §4 item 8 and the preparation record §7.
2. **Governing decision:** ED-4, ED-13 (`ENGINEERING_DESIGN_DECISION.md`); B-2 (evidence shape, decided); **PO-1
   (this task, §0 above).**
3. **Repository files:** New per-window snapshot table/structure; new reporting module, pattern-matched on
   `packages/core-reconciliation/src/report.ts`.
4. **Schema impact:** New table(s) for the per-gate-per-window snapshot and the validation-evidence record,
   with an immutability constraint (no update path after creation) and a 90-day retention policy (PO-1).
5. **Tests:** A written evidence record cannot be mutated after creation; a read against audit/compliance access
   succeeds read-only; a record older than 90 days is eligible for removal per PO-1 (removal mechanism itself is
   implementation detail, not decided here beyond the 90-day figure).
6. **Acceptance criteria:** Every PCG-1/2/3A/3B validation run produces an immutable record meeting PO-1's six
   required fields, retained exactly 90 days, readable only by an authorized audit/compliance role.
7. **Dependencies:** W-13 (the cross-check whose output this stores).
8. **Rollback considerations:** New, additive audit tables; no coupling to existing production write paths;
   removing them has no effect on live gate computation, only on audit history.
9. **Validation requirements:** This workstream's correctness (does the evidence bundle actually capture what
   PO-1 requires) is itself verified by W-12's fixture suite exercising the evidence-write path.

### W-15 — Required schema/migrations — **AUTHORIZED**

1. **Exact scope:** The following migration batch, each additive, each named by an upstream workstream, none
   altering existing column semantics or payment/search/feedback behavior:
   - **M-1** `searches.completed_at TIMESTAMPTZ NULL` (W-5)
   - **M-2** `refund_events` table (W-6)
   - **M-3** `Order.visitor_id` nullable column (W-1/W-2)
   - **M-4** reviewed-event table or row-type (W-7)
   - **M-5** qualification-evaluator-result table, separate from `qualifications` (W-8)
   - **M-6** offer-exposure table or row-type (W-3/W-4)
   - Supporting: a per-window evidence-snapshot table and a validation-evidence table (W-14)
2. **Governing decision:** B-5, B-6, B-1, B-3/ED-10, Q-5/Q-6, ED-4/ED-13, as cited per workstream above; PO-2
   (M-1 carries no backfill).
3. **Repository files:** `packages/db/prisma/schema.prisma` and new migration files under
   `packages/db/prisma/migrations/`.
4. **Schema impact:** As enumerated. No existing table's existing column is dropped, renamed, or retyped; no
   existing constraint is loosened or tightened in a way that changes current behavior.
5. **Tests:** Migration up/down (where reversible) tested in the same manner as existing migrations in this
   repository; each new table/column's own workstream test plan (W-1, W-3–W-8) exercises it.
6. **Acceptance criteria:** All six migrations apply cleanly against the current schema with zero data loss to
   existing rows; `searches`/`Order`/`Payment`/`feedback`/`qualifications` existing rows are unaffected.
7. **Dependencies:** Each migration is required by its citing workstream (W-1 through W-8, W-14); none has a
   circular dependency.
8. **Rollback considerations:** Every migration is purely additive (new nullable column or new table) — each is
   independently reversible by dropping the new column/table with no impact on pre-existing data.
9. **Validation requirements:** Schema correctness is exercised by each citing workstream's own test plan (§5
   fields above); no separate migration-level validation beyond standard migration testing is required by any
   governing record.

### W-16 — Required automated tests — **AUTHORIZED**

1. **Exact scope:** The full test plan named per-workstream above (W-1 through W-14's own field-5 entries),
   including B-4's refund behavioral scope and the ED-12 track B fixture suite (W-12).
2. **Governing decision:** B-4 (test scope); every workstream's own governing decision (test obligations are
   carried, not separately invented).
3. **Repository files:** `tests/contract/razorpay-webhook.contract.test.ts` (fill existing `it.todo` stubs); new
   test files colocated with each new module per this project's existing conventions.
4. **Schema impact:** None (test-only).
5. **Tests:** This workstream *is* the test requirement — see each W-1..W-14 field 5 for exact enumeration.
6. **Acceptance criteria:** Every enumerated test case exists and passes; no `it.todo` stub for refund behavior
   remains unimplemented after W-6 is built.
7. **Dependencies:** Each corresponding implementation workstream must exist to be tested.
8. **Rollback considerations:** Test-only; zero production risk.
9. **Validation requirements:** Tests are themselves part of the W-12 validation infrastructure for the four
   hard-blocker gates; for monitoring-only gates they are ordinary engineering quality assurance, not a §6.10
   obligation.

---

## 5. Blocked items

**None.** Every workstream W-1 through W-16 is AUTHORIZED under the scope stated above. No stop condition from the
task's §"Stop conditions" (contradiction with a governing decision; missing required policy; untrustworthy
evidence path; ₹499/₹1,499 indistinguishability; semantics-altering schema change; unresolved security/privacy
issue affecting measurement evidence) was found to apply to any workstream, for the reasons given per-workstream
above (notably: §1's PO-3 finding resolves the ₹1,499-distinguishability concern; PO-1/PO-2 resolve the two
previously-open classification-C items; every named schema change is additive and does not alter existing
semantics; the one open privacy/consent item on W-2's cookie is noted as a pre-deployment, not pre-implementation,
concern, consistent with K1-10 remaining the separate gate for production traffic).

Two narrow, explicitly non-blocking open items are carried forward, unresolved, for engineering judgment during
implementation (neither prevents starting the corresponding workstream):

1. W-8's exact "not-satisfied" vs. "indeterminate" semantic distinction under fail-soft behavior (must be
   resolved before that module's test suite is finalized, per `ENGINEERING_BLOCKER_DECISION.md` §8 item 8).
2. The exact module location for each new gate-computation query (W-1, W-9, W-10) and the exact storage container
   for W-7's reviewed event (new table vs. a new row type in ED-1's generic store) — ordinary implementation
   detail not affecting any governing decision.

## 6. Exact implementation scope authorized by this record

Source changes, schema/migrations (M-1 through M-6 plus the W-14 evidence tables), instrumentation code,
automated tests, deterministic validation fixtures, and validation/evidence-generation infrastructure for
workstreams W-1 through W-16, exactly as scoped per-workstream in §4. Nothing beyond that scope is authorized.
Specifically **not** authorized by this record, regardless of how W-1–W-16 are implemented:

- Any change to `packages/core-qualification/`'s existing code (W-8 is additive and separate, per Q-10/ED-10/B-3).
- Any change to `Order`/`Payment` payment-processing logic beyond the additive `Order.visitor_id` column (W-1/W-2)
  and the additive `refund_events` table (W-6) — existing payment semantics are unchanged.
- Any historical backfill of `searches.completed_at` (PO-2).
- Any new ₹1,499-specific UI component (PO-3 — not needed; see §1).
- Any PDEF-2/PDEF-3/PDEF-4/entitlement-stacking/MVP-scope change.
- Billing, pricing, or credit-ledger changes outside what is already named.
- Production deployment, release, or production traffic of any kind.

## 7. Implementation sequencing note (not a new decision)

Per the dependency fields above: W-2 → W-1, W-3, W-4; W-5 → W-7 (population), W-9, W-10; W-8 → W-9; W-6 → W-16's
refund fixtures; W-1/W-3/W-4/W-6 → W-12/W-13 → W-14. This restates, and does not alter, the dependency graph
already established in `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` §8.

## 8. Explicit authorization boundaries

**This record authorizes implementation workstreams W-1 through W-16 as scoped in §4. It does NOT authorize, under
any circumstance:**

- Production deployment, release, production traffic, or public/commercial launch of any kind. **K1-10 remains a
  separate, explicitly NOT AUTHORIZED deployment/release gate**, entirely unaffected by this record.
- Any PDEF-2, PDEF-3, PDEF-4, entitlement-stacking, or MVP-scope change.
- Any billing or pricing change outside the decided scope named in §6.
- Treating a completed W-13 production cross-check, by itself, as a launch decision — PDEF-4 §6.10's requirement
  that validation exist is necessary, not sufficient, for a launch decision, which remains a separate act this
  record does not perform.
- Commit or push authority — this task performs neither.

No implementation may begin on the strength of this record alone being read; it begins only when a developer or
agent is separately, explicitly instructed to implement one of the AUTHORIZED workstreams above, in a task
distinct from this one. This record itself makes **no** code, test, schema, or migration change.

## 9. Final verification (performed before reporting completion)

| Field | Value |
|---|---|
| HEAD before and after | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0, before and after |
| Tracked files modified (`git diff --name-only`) | 0 |
| Files created by this task | This record only (`requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`) |
| Source/test/schema/config/dependency files modified | 0 |
| Commit made | No |
| Push made | No |

Governing-record SHA-256 hashes, re-verified immediately before writing this record (unchanged throughout):

| Record | SHA-256 |
|---|---|
| `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | `8ddf7d0410ae4023a109e2712e6b4c86b9007df80d2f2880d6d28f720deadde9` |
| `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` | `b587a0de43f3bcae8ccb8bcb25df9c634751848dc00d9760721bdaf18b22e148` |
| `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` | `26c65e7305a07b985f0467b8f1679e948c7893cf9184213b361873e4a843d3be` |
| `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_ORDERED_QUESTIONNAIRE.md` | `ffc8485868ce830ff0f574a1749374ad06912f129f64e43d573807cfb5d3b51f` |
| `MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |
| `docs/ARCHITECTURE.md` | `845241d9a75b3dd28848ff3a5cfe0ddc4ab8cead031427ea73533fd4e5d053b8` |
| `PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |

No amendment was made to any governing record. **Deployment, release, and launch remain explicitly unauthorized**
regardless of W-1–W-16's authorization status above. Implementation of any authorized workstream must occur in a
separate, subsequent task — this record performs no implementation itself.
