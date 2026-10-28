# Client Finder / Client Intent Discovery — PDEF-4 Implementation Authorization Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-DECISION-PREPARATION-001`
**Date:** 2026-10-05

> ## STATUS: PREPARATION ONLY — IMPLEMENTATION NOT AUTHORIZED

This record converts the now-decided PDEF-4 instrumentation requirements into a concrete implementation map. It
authorizes **no** source-code change, test change, schema/migration change, configuration/dependency change,
billing change, instrumentation implementation, validation execution, deployment, release, or production
traffic. It is read-only preparation. A separate, explicitly authorized implementation-authorization decision
must exist before any item below is implemented.

---

## 0. Governing records read and reconciled

| Record | Role in this document | Reopened? |
|---|---|---|
| `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | PCG-1..6 definitions, hard-blocker/monitoring status, floors named directly (500, 50) | No |
| `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | Q-1..Q-12, PO-D1, PO-D2 | No |
| `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | ED-1..ED-13 | No |
| `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` | **The governing decision for this document** — B-11a/b/c, B-2, B-10, B-5, B-6, B-3, B-1, B-7, B-4, B-8, B-9, all resolved under delegated Product Owner authority | No |
| `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md` | Original W-1..W-19 workstream catalogue, gate computation contract, now superseded in places by the blocker decision (see §2 per workstream) | No (superseded content is marked, not deleted from the historical record) |
| `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | "Useful outcome" / "completion" verbatim text (§9/§11) | No |
| `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | Product/tier definitions | No |
| `MVP_SCOPE_BOUNDARY.md` | MVP scope fence (no recurring billing, no usage metering beyond what's decided) | No |
| `PROJECT_MASTER_CHECKLIST.md` | Checked for cross-reference only — see note below | No |
| `docs/ARCHITECTURE.md` | Checked for cross-reference only; no new architecture principle found needed beyond what ED-1..ED-13 already fix | No |

**Cross-reference note (not a conflict requiring an amendment):** `PROJECT_MASTER_CHECKLIST.md` lines 134–139
track PCG-1..6 as `PENDING`, owner `PRODUCT OWNER`, and line 166 (`T99-4`, "Instrumentation for proposed gate
metrics") as `SCOPE-DEPENDENT`, blocked on PDEF-3. Both are now stale relative to the fully decided chain this
document builds on (PDEF-3 is decided; PCG-1..6 now have an engineering-blocker decision). This document does
not edit `PROJECT_MASTER_CHECKLIST.md` — updating a tracking checklist is not authorized here and is noted only
so a future authorized pass knows to refresh it.

**Governance constraint followed throughout:** PDEF-2, PDEF-3, PDEF-4, the entitlement-stacking decision,
ED-1..ED-13, and B-1..B-11 are inputs, not reopened. Where repository evidence gathered for this document
surfaced anything in tension with one of them, it is flagged as an amendment dependency (§8) rather than
resolved by this document or by code.

---

## 1. Workstream matrix — explicit decision mappings

Each workstream below follows the required 14-field structure. Fields are numbered to match the task's
required-field list exactly.

### 1.1 PCG-1 — Qualified visitors (demonstrated-intent evidence + anchor)

1. **Governing decision:** B-11a (hybrid — server-persisted `Order` row is authoritative demonstrated-intent
   evidence, browser `CheckoutStarted` remains diagnostic-only); B-11b (`Order.createdAt` anchors the window);
   B-11c (no ED-1/ED-5 change needed); Q-1/Q-2 (eligibility/dedup, decided, not reopened); PDEF-4 §6.5 (floor =
   500, decided, not reopened).
2. **Exact repository files/modules affected:**
   - `packages/core-payments/src/createOrder.ts:116-138` — existing `createOrder()`, read-only reference point;
     no change to its payment logic, only to what else reads its output.
   - `packages/db/prisma/schema.prisma:98-137` — existing `Order` model; no schema change required for PCG-1
     itself (the row already exists and is already timestamped).
   - A new, not-yet-located PCG-1 computation module (W-8 in the original catalogue) — exact location to be
     chosen during implementation (candidates: `packages/core-analytics/` if it exists, or a new
     `packages/core-growth-gates/`; neither currently exists in the repository as inspected for this record —
     flagged under residual detail, §7).
   - `apps/web/app/api/payments/create-order/route.ts` — the existing API route; no change needed to accept the
     new visitor-identity cookie (see §1.2) if that cookie is already present as a request header/cookie by the
     time this route is called.
3. **Existing code that can be reused:** `createOrder()`'s existing `Order` insert, as-is, with no change to its
   payment semantics. The existing `razorpayOrderId`/`idempotencyKey` uniqueness already prevents duplicate
   `Order` rows for the same checkout attempt — no new idempotency mechanism is needed for the `Order` row itself.
4. **New code required:** A PCG-1 computation query joining (a) the visitor-identity cookie value captured at
   funnel-entry (browser-observed, per §1.2) with (b) `Order` rows carrying that same identity, counting a
   visitor once if both a funnel-entry record and an associated `Order` row exist within the rolling 30-day
   window anchored at `Order.createdAt`.
5. **Schema/migration changes:** None for the `Order` table itself. The join requires the new visitor-identity
   field to exist on whatever row captures funnel-entry (see §1.2's schema note) and, if `createOrder()`'s
   request does not already thread the identity cookie through to the `Order` row, a new nullable column on
   `Order` (e.g. `visitor_id`) to persist it. **This is a schema dependency, named here, not created.**
6. **Event/data contract:** Input: the visitor-identity cookie value (string) present on the request to
   `POST /api/payments/create-order`. Output: no new event; the existing `Order` row, read by the PCG-1
   computation, now also carrying `visitor_id`.
7. **Idempotency requirements:** Already satisfied by `Order.razorpayOrderId`/`idempotencyKey` uniqueness; the
   PCG-1 computation itself must count each distinct visitor once regardless of how many `Order` rows that
   visitor creates (e.g. multiple checkout attempts) — a `DISTINCT visitor_id` aggregation, not a new
   idempotency mechanism.
8. **Privacy/security implications:** The `Order` row already stores email/phone (per repository evidence
   gathered for the engineering-blocker decision); adding a `visitor_id` column does not increase the
   sensitivity class of this table, but does mean a pre-authentication identifier is now linkable to a
   payment-adjacent record — no new consent requirement is created beyond what the existing checkout flow
   already requires (the user already supplies contact details to check out), but this coupling should be
   reviewed under whatever privacy/consent process the Product Owner otherwise maintains (not found/assessed in
   this repository pass — not fabricated here).
9. **Test requirements:** Fixture cases for the deterministic suite (ED-12 track B, per B-2's decided process):
   a visitor with funnel-entry and a qualifying `Order` within the window (counts); a visitor with funnel-entry
   only, no `Order` (does not count — demonstrated intent absent); a visitor with an `Order` but no captured
   funnel-entry identity (edge case — should not happen under correct instrumentation; assert it is not silently
   fabricated into a count); boundary cases at exactly `window_start`/`window_end` on `Order.createdAt`.
10. **Independent-validation requirements:** PCG-1 is a hard launch blocker — B-2's decided process applies in
    full: CI-run deterministic fixtures plus a named non-implementing-engineer-role production cross-check
    before any PCG-1 result is used for launch-qualification.
11. **Acceptance criteria:** PCG-1's computed count, for a given window, matches an independently-written query
    over the same raw `Order`/funnel-entry rows (the B-2 cross-check), with a documented match/mismatch record;
    the count never includes a visitor whose only evidence is a browser `CheckoutStarted` event with no
    corresponding `Order` row.
12. **Dependencies:** §1.2 (visitor-identity bridge) must exist first, since PCG-1's join depends on it.
13. **Residual unresolved implementation detail:** Exact module location for the PCG-1 computation (no existing
    `packages/core-*` module is an obvious home); exact column name/type for the new `Order.visitor_id` field;
    whether `createOrder()`'s existing function signature needs a new parameter or reads the cookie from request
    context directly.
14. **Blocks authorization?** No — these are implementation-level details (classification A, see §7) that do
    not change the already-decided PCG-1 evidence model (B-11a/b/c) and can be resolved during implementation.

### 1.2 Visitor identity bridge (B-10)

1. **Governing decision:** B-10 (new, dedicated first-party cookie, server-set); Q-2 (cross-path dedup, decided,
   not reopened).
2. **Exact repository files/modules affected:**
   - `apps/web/src/analytics/track.ts` (existing `tabScope()` pattern — reference only, not reused directly per
     B-10's rationale).
   - A new cookie-issuance point — not yet located; candidates are Next.js middleware (`apps/web/middleware.ts`,
     existence not confirmed in this pass) or a server action/route invoked on first page load.
   - `apps/web/app/api/payments/create-order/route.ts` and `packages/core-payments/src/createOrder.ts` — would
     need to read this cookie's value and pass it through to the `Order` insert (per §1.1).
3. **Existing code that can be reused:** None directly — B-10 explicitly selected a new primitive over reusing
   `_fbp`/`tabScope`. The existing cookie-reading conventions in `apps/web/src/analytics/attribution.ts` (for
   `_fbp`/`_fbc`) are a structural pattern (how an existing cookie is read server-side) that the new cookie's
   read path can follow without reusing the cookie itself.
4. **New code required:** Cookie-issuance logic (set on first contact, server-side, `httpOnly` or not — see
   residual detail), a read-path for it in the checkout-order-creation flow, and a read-path for it wherever
   funnel-entry is recorded.
5. **Schema/migration changes:** None directly for the cookie itself (cookies are not a database schema
   concern); the `Order.visitor_id` column noted in §1.1 is the schema touchpoint.
6. **Event/data contract:** A cookie value (opaque identifier, format TBD — implementation detail) present on
   all subsequent requests from the same browser, readable server-side.
7. **Idempotency requirements:** The cookie must be set exactly once per new visitor (not reset on every visit)
   — standard "set if absent" cookie semantics, not a new mechanism.
8. **Privacy/security implications:** A new first-party tracking identifier is a privacy-relevant change even
   though it does not touch billing or payment semantics. Per B-10's own recorded residual item, this document
   does not assess or invent a consent-banner treatment — flagged in §7 as requiring confirmation of whatever
   privacy/consent process exists outside this repository's instrumentation code, if any.
9. **Test requirements:** A fixture verifying the same cookie value is present at funnel-entry and at
   `Order`-creation time for a single simulated browser session; a fixture verifying two different browsers (two
   different cookies) are never merged.
10. **Independent-validation requirements:** None beyond what PCG-1's own validation (§1.1 field 10) already
    covers, since this cookie's only measured effect is on PCG-1's join correctness.
11. **Acceptance criteria:** A single browser session, entering via either funnel path (Q-2's "both paths
    combined" requirement), is counted once in PCG-1 regardless of path, verified via this cookie's stability
    across the session.
12. **Dependencies:** None upstream; §1.1 depends on this.
13. **Residual unresolved implementation detail:** Cookie name, exact lifetime/expiry, `httpOnly`/`SameSite`
    attributes, and the exact issuance call site (middleware vs. route vs. layout-level server action) — **none
    of these affect the governing policy (B-10 only decided the primitive *type*, not these parameters)**, per
    the task's own instruction not to invent them yet.
14. **Blocks authorization?** No — classification A (implementation detail). B-10's policy-level decision
    (new dedicated cookie, not `_fbp`/`tabScope`) is already made; only parameters remain.

### 1.3 PCG-3A/3B exposure event (tier-specific offer screen)

1. **Governing decision:** Q-5 (exposure population, decided, not reopened); Q-6 (first-exposure timestamp,
   decided, not reopened); not covered by B-1..B-11 directly, but required by the already-decided PCG-3A/3B
   gate contract.
2. **Exact repository files/modules affected:**
   - `apps/web/src/components/UpsellTracker.tsx:16` — existing browser-only `upsell_viewed` emission (fires
     `track('upsell_viewed', { productId, fromTier })`); per the original implementation-authorization
     preparation record, this event is "not persisted server-side anywhere" today.
   - `apps/web/src/analytics/events.ts:26` — existing `upsell_viewed` type definition (`productId`, `fromTier`).
   - No existing tier-specific "offer screen" server-side render/route was found distinct from `UpsellTracker`
     (the ₹1,499 tier's own offer-screen component, if one exists separately from the ₹499 upsell, was not
     located in this pass — see residual detail).
3. **Existing code that can be reused:** `upsell_viewed`'s existing payload shape (`productId`, `fromTier`)
   already carries the tier attribution the gate needs — this is not duplicated, only persisted.
4. **New code required:** A server-side persistence path for an offer-exposure event, either by making
   `upsell_viewed` itself server-persisted (not merely browser-emitted, consistent with B-11a's general
   direction of preferring durable, verifiable evidence for commercial gates where practical) or by adding a
   new, dedicated exposure-record write distinct from the existing analytics event.
5. **Schema/migration changes:** A new table or a new row type within the existing event store (ED-1) to
   persist "visitor X was exposed to tier Y's offer screen at time T" — not yet designed in this document; named
   as a required design item for implementation, not performed here.
6. **Event/data contract (proposed, not implemented):** `{ visitorId, productId, tier, exposedAt }`, written
   once per first exposure per `(visitorId, productId)` pair.
7. **Idempotency requirements:** Deduplicated by `(visitorId, productId)` — only the *first* exposure counts,
   per Q-6's decided "first exposure" timestamp rule; later re-exposures (e.g. repeat visits to the same offer
   screen) must not create a second qualifying record or shift the anchor timestamp.
8. **Privacy/security implications:** Same visitor-identity dependency as §1.2 — this event needs the same
   cookie to attribute exposure to a visitor pre-purchase.
9. **Test requirements:** A fixture for a single visitor viewing the same tier's offer screen twice (only the
   first counts, timestamp does not move); a fixture for a dual-tier visitor (exposed to both ₹499 and ₹1,499
   screens — each tracked independently per PDEF-4's combined-primary rule, already decided, not reopened here).
10. **Independent-validation requirements:** PCG-3A/3B are hard launch blockers — B-2's decided validation
    process applies in full, same as PCG-1.
11. **Acceptance criteria:** Each tier's exposure population, independently reconstructed from raw exposure
    records, matches the primary computation's reported denominator for PCG-3A/3B.
12. **Dependencies:** §1.2 (visitor-identity bridge).
13. **Residual unresolved implementation detail:** (a) whether the ₹1,499 tier has its own, distinct
    offer-screen render call site, not confirmed in this repository pass — **this is a factual gap in this
    document's own evidence, not a policy question**, and must be confirmed before implementation, not guessed;
    (b) whether to persist via a server-side write at render time (requiring the offer-screen page itself to
    become a persisting call site, similar in kind to B-1's reviewed-event tension) or via upgrading
    `upsell_viewed` to a server-validated event; (c) exact new-table-vs-existing-store schema shape.
14. **Blocks authorization?** **Partially — item 13(a) (confirming the ₹1,499 render call site exists and
    where) should be resolved before implementation begins, since without it the exposure event's call site for
    one of the two tiers cannot be located at all. This is classification A/B boundary (see §7) — a factual
    repository check, not a policy question, but one this document could not complete with certainty in this
    pass.** Items 13(b)/(c) are ordinary engineering-design detail (classification B) that can be resolved during
    implementation without blocking authorization.

### 1.4 Search completion timestamp (B-5)

1. **Governing decision:** B-5 (new, dedicated `completed_at` column, set exactly once at the COMPLETE
   transition); PO-D1 (`status = 'COMPLETE'` qualifying filter, decided, not reopened).
2. **Exact repository files/modules affected:**
   - `packages/db/prisma/schema.prisma` — `Search`/`searches` model definition (exact line range not re-quoted
     here; a new nullable `completed_at` column is added alongside the existing `status`/`updated_at` fields).
   - `packages/core-search/src/pgRepository.ts:191-209` — the existing `completeClaimed({ id, workerId, now })`
     function; its `UPDATE searches SET status = 'COMPLETE', ... updated_at = $3 WHERE id = $1 AND status =
     'RUNNING' AND lease_owner = $2` statement (lines 201-206) is the exact write path a `completed_at = $3`
     assignment would be added to, reusing the same `now` parameter already passed into this function.
   - `packages/core-search/src/types.ts` — `Search` type would gain a `completedAt: Date | null` field alongside
     existing `createdAt`/`updatedAt`.
3. **Existing code that can be reused:** `completeClaimed`'s existing `now` parameter and its existing
   `WHERE status = 'RUNNING' AND lease_owner = $2` guard (which already ensures this write happens exactly once
   per search, since a search can only transition out of `RUNNING` once) — no new idempotency logic is needed;
   the existing optimistic-lease guard already provides it.
4. **New code required:** One additional column assignment in the existing `UPDATE` statement; one additional
   field read in `Search`'s existing row-mapping code.
5. **Schema/migration changes:** **A new migration** adding `searches.completed_at TIMESTAMPTZ NULL`. This is
   the schema dependency named in the engineering-blocker decision (B-5 §6/§7) and is not created by this
   document.
6. **Event/data contract:** No new event; an existing row gains one new, nullable column, set only on the
   COMPLETE transition.
7. **Idempotency requirements:** Already guaranteed by the existing lease-guard `WHERE` clause in
   `completeClaimed` — the same write cannot execute twice for the same search.
8. **Privacy/security implications:** None — this is an internal timing column with no new PII.
9. **Test requirements:** A fixture confirming `completed_at` is set exactly once, matches `now` at the moment of
   the COMPLETE transition, and is never touched by any other write path (lease-claim, error-recording) that
   also touches `updated_at` today — explicitly asserting the two columns diverge in the error/lease-claim
   non-COMPLETE cases that previously made `updated_at` ambiguous.
10. **Independent-validation requirements:** PCG-4/PCG-6 are monitoring-only (not hard blockers) — per PDEF-4
    §6.3, §6.10's independent-validation requirement does not apply to them; no production cross-check is
    required for this specific column, though it still feeds PCG-4/PCG-6's own reported numbers.
11. **Acceptance criteria:** For a sample of completed searches, `completed_at` falls between `created_at` and
    the current time, is never null for any row with `status = 'COMPLETE'`, and is always null for rows in any
    other status.
12. **Dependencies:** None upstream (independent per the facilitation record's dependency graph); B-1/B-8/B-12
    downstream depend on this.
13. **Residual unresolved implementation detail:** **Backfill.** The engineering-blocker decision (B-5) fixed
    the column's write path going forward; it did not address historical `Search` rows already in `COMPLETE`
    status before this migration ships. **Per the task's explicit instruction, this document does not backfill
    historical data and does not assume a default (e.g., copying `updated_at` into `completed_at` for old rows)
    without a separate decision authorizing it.** Left entirely open — see §7.
14. **Blocks authorization?** No for the column/write-path itself (classification A, already fully decided by
    B-5). **The backfill question is classification C (Product Owner decision required)** — whether historical
    `COMPLETE` searches should retroactively get a `completed_at` value (and if so, from what source) is a data
    policy choice, not an implementation detail, and is carried forward unresolved rather than guessed.

### 1.5 Refunds — `refund_events` persistence (B-6) and contract tests (B-4)

1. **Governing decision:** B-6 (new `refund_events` table); B-4 (behavioral test scope); ED-6 (reuse
   `WebhookEvent` dedup, isolate refund logic — decided, not reopened); Q-11/Q-12 (binary any-refund-counts,
   economic finality, pre-close-only correction — decided, not reopened).
2. **Exact repository files/modules affected:**
   - `packages/core-payments/src/webhookHandler.ts:7-19` (dedup/transaction-pattern comment), `:48`
     (`SUPPORTED_EVENTS = ['payment.captured']`, to be extended to include `refund.processed` and any reversal
     event name Razorpay uses — exact event name(s) not re-verified in this pass beyond what the existing
     `webhookRetention.ts` allowlist already anticipates), `:137` (`JSON.parse` call the existing dedup
     transaction wraps).
   - `packages/core-payments/src/webhookRetention.ts:86-105` — existing `REDACTION_ALLOWLIST` already naming
     `amount_refunded`/`refund_status`/`payload.refund.entity.*` — confirms the payload shape without needing to
     re-derive it.
   - `packages/db/prisma/schema.prisma:57-62` (existing, unused `PaymentStatus.REFUNDED` enum value — **not
     used** by this design, per B-6's selection of a dedicated table over enum reuse) and the new `refund_events`
     table definition (new).
   - `tests/contract/razorpay-webhook.contract.test.ts` — the three existing `it.todo` stubs, to be implemented
     per B-4's behavioral scope.
3. **Existing code that can be reused:** The exact transaction/dedup pattern already documented in
   `webhookHandler.ts:7-19` — "verified bytes -> JSON.parse -> schema -> ONE transaction: insert webhook_event
   (unique on `razorpay_event_id`) -> ..." — extended, not replaced, for refund events: insert `webhook_event`
   (same dedup), then insert/update `refund_events` within the same transaction, reusing the existing
   unique-index-not-SELECT-then-INSERT concurrency discipline the comment already documents.
4. **New code required:** Handling for `refund.processed` (and reversal, if Razorpay models it as a distinct
   event type — not confirmed in this pass) within `webhookHandler.ts`'s existing dispatch, writing to the new
   `refund_events` table.
5. **Schema/migration changes:** **A new migration** adding a `refund_events` table: FK to `Payment`, a
   reversed/corrected flag, a timestamp, and (per the engineering-blocker decision's own residual item) a
   minimum column set of amount, full/partial flag, source webhook/event id, and association to the original
   `Payment`/`Order` — exact DDL not written here, named as a required migration for implementation.
6. **Event/data contract:** Input: Razorpay `refund.processed` (and reversal) webhook payloads, already
   partially anticipated by the retention allowlist. Output: one `refund_events` row per distinct
   `razorpay_event_id`, linked to the originating `Payment`.
7. **Idempotency requirements:** Reuses `WebhookEvent.razorpay_event_id`'s existing unique-index dedup — a
   redelivered refund webhook is rejected at the `webhook_event` insert, before ever reaching the
   `refund_events` write, exactly as `payment.captured` already works today.
8. **Privacy/security implications:** None beyond what the existing `WebhookEvent`/`Payment` tables already
   carry — no new PII category is introduced.
9. **Test requirements (per B-4's decided behavioral scope):** the three existing stubs; duplicate
   `refund.processed` delivery (single-processing via `razorpayEventId` uniqueness); a partial-then-partial
   refund on the same `Payment` (counts once, Q-11); a reversal before window close (corrects the numerator,
   Q-12); the same reversal after window close (does not reopen a closed evaluation, Q-12); out-of-order
   delivery (refund event arriving before its `payment.captured`); an unresolvable `order_id`/`payment_id`.
10. **Independent-validation requirements:** PCG-5 (refund rate) is monitoring-only (PDEF-4, decided) — §6.10's
    independent-validation requirement does not apply; PCG-2 (buyer count) is a hard blocker but does not read
    refund state (per the original gate-computation contract, not reopened), so this workstream's validation
    need is lower than PCG-1/3A/3B's.
11. **Acceptance criteria:** Every behavioral-scope test case (field 9) passes; a reversed-then-re-refunded
    transaction counts exactly once in PCG-5's numerator; a post-window-close refund never changes a closed
    PCG-5 evaluation.
12. **Dependencies:** None upstream (B-6 is independent per the dependency graph); B-4 depends on B-6 (already
    satisfied — both are now decided).
13. **Residual unresolved implementation detail:** Exact `refund_events` column list beyond the named minimum
    (amount, full/partial flag, timestamp, source event id, Payment association, reversed/corrected flag) —
    carried forward from the engineering-blocker decision's own §7 residual item, not invented here; exact
    Razorpay event name(s) for a reversal (vs. a second `refund.processed` with a different amount) not
    re-verified against live Razorpay documentation in this pass.
14. **Blocks authorization?** No — classification A/B (ordinary schema-design and payload-mapping detail); the
    policy (B-6/B-4) and the reusable dedup pattern are both already fully decided.

### 1.6 Opportunity Reviewed event (B-1)

1. **Governing decision:** B-1 (first-view-only, deduplicated by `(userId, opportunityId)`, not
   feedback-submission-based); ED-9 (dedicated event, decoupled from `SearchStatus`/`feedback` — decided, not
   reopened).
2. **Exact repository files/modules affected:**
   - `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` — the existing server-rendered detail page,
     currently a read-only render (`force-dynamic`); this is the call site B-1 selected.
   - `packages/core-opportunity/src/service.ts:517-553` — the existing Phase-15 comment explicitly documenting
     this gap; the new "reviewed" persistence logic would live near, but not reuse, `recordFeedback` (lines
     486-503), since B-1 explicitly rejected the feedback-submission-based option.
   - A new table or event-store row type (per ED-1/ED-9, decided) for the reviewed event, not yet named/located
     in this repository pass.
3. **Existing code that can be reused:** The existing page's existing data-fetching (`getOpportunity`, etc.) —
   only a new side-effect write is added alongside the existing reads, not a new render path.
4. **New code required:** A check-then-write or unique-constraint-upsert guarded by `(userId, opportunityId)`,
   executed on the page's server-render path, writing to the new reviewed-event store.
5. **Schema/migration changes:** A new table (or a new event type within ED-1's existing store, if that store's
   schema is generic enough to add a new type without a new table — not confirmed in this pass) to persist
   `(userId, opportunityId, reviewedAt)` with a uniqueness guarantee on `(userId, opportunityId)`.
6. **Event/data contract:** `{ userId, opportunityId, reviewedAt }`, written at most once per pair.
7. **Idempotency requirements:** Enforced by a unique constraint on `(userId, opportunityId)` (preferred over an
   application-level check-then-write, which would be racy under concurrent requests for the same page) — a
   second render attempting the same insert is rejected/ignored by the database, mirroring the concurrency
   discipline already established for `WebhookEvent` in §1.5.
8. **Privacy/security implications:** None beyond what `feedback`/`Opportunity` already carry — no new PII.
9. **Test requirements:** A fixture confirming two renders of the same `[id]/page.tsx` by the same user produce
   exactly one reviewed-event row; a fixture confirming two different users viewing the same opportunity each
   produce their own row.
10. **Independent-validation requirements:** PCG-6 (the gate this event feeds) is monitoring-only — no §6.10
    cross-check requirement applies.
11. **Acceptance criteria:** The reviewed-event count for a given opportunity never exceeds the number of
    distinct users who have ever rendered its detail page; re-renders by the same user never increment it.
12. **Dependencies:** Requires ED-1's durable event store to exist (already decided, not reopened; build status
    not re-verified in this pass).
13. **Residual unresolved implementation detail:** **The exact persistence target (new dedicated table vs. a
    new row type in ED-1's existing generic store) was not confirmed in this repository pass** — this is a
    factual/design gap, not a policy question (B-1 already decided the *semantics*; this is only *where it is
    stored*).
14. **Blocks authorization?** No — classification A/B. B-1's semantics are fully decided; only the storage
    container detail remains, which does not change behavior and can be resolved during implementation.

### 1.7 Qualification-equivalence evaluator (B-3)

1. **Governing decision:** B-3 (inputs = Search snapshot + Opportunity attributes only; outputs = structured
   per-criterion breakdown; determinism = pure function, no I/O; failure behavior = fail-soft); ED-10 (new
   standalone evaluator module, persisted result, **not** extending `core-qualification` — decided, not
   reopened, and explicitly not reopened by this document either); Q-10 (non-equivalence finding, decided, not
   reopened).
2. **Exact repository files/modules affected:**
   - A new package or module, structurally parallel to but **not inside** `packages/core-qualification/` (per
     ED-10's explicit non-reuse finding) — exact location not yet chosen (candidate:
     `packages/core-client-finder-match/` or similar; not confirmed in this pass).
   - `packages/core-search/src/types.ts` — existing `Search.criteria` snapshot (read-only dependency, no
     change).
   - `packages/core-opportunity/src/types.ts` — existing `Opportunity` attributes (read-only dependency).
   - `packages/db/prisma/migrations/0022_qualifications` — cited only as a structural pattern to mirror (table
     shape: `criteria JSONB`, `state`, `evaluator_version`, `evaluated_at`), **not reused as the same table**.
3. **Existing code that can be reused:** None of `core-qualification`'s code (explicitly excluded by ED-10/Q-10);
   only its *structural pattern* (pure-function discipline, persisted-result table shape) is followed by
   analogy, as already noted in the engineering-blocker decision's own rationale.
4. **New code required:** A new, pure evaluator function taking `{ search: Search, opportunity: Opportunity }`
   and returning a structured per-criterion result (service match, customer match, value-threshold match, each
   independently satisfied/not/indeterminate — see residual detail below), plus a persistence write for that
   result.
5. **Schema/migration changes:** A new table for the evaluator's persisted result (per ED-10, decided; exact
   DDL not written here).
6. **Event/data contract:** Input: `Search.criteria` snapshot (service, target_customer, geography,
   min_project_value_paise, triggers, keywords, rationale) + `Opportunity` attributes. Output:
   `{ serviceMatch, customerMatch, valueThresholdMatch, evaluatorVersion, evaluatedAt }`, each match field one
   of satisfied/not-satisfied/indeterminate (pending the residual item below).
7. **Idempotency requirements:** Pure function — re-running it on the same inputs always produces the same
   output (no new idempotency mechanism needed beyond the function's own determinism); persistence write should
   still use an upsert keyed on `(searchId, opportunityId, evaluatorVersion)` to avoid duplicate rows on re-run.
8. **Privacy/security implications:** None — operates only on already-collected `Search`/`Opportunity` data.
9. **Test requirements:** Deterministic fixture suite (reusable for B-2's validation process) covering: a
   fully-matching opportunity (all three criteria satisfied); a fully-non-matching one; a missing/malformed
   `Search.criteria` field exercising the fail-soft path per criterion; re-running the same input twice and
   confirming identical output (determinism check).
10. **Independent-validation requirements:** This evaluator feeds PCG-4 (monitoring-only) — no §6.10
    requirement applies directly, but its determinism (field 7) is exactly what B-2's chosen validation process
    (CI-run deterministic fixtures) depends on for whichever hard-blocker gates might ever reuse this pattern —
    noted as a design-quality dependency, not a formal validation requirement for this specific module.
11. **Acceptance criteria:** For a fixed input, the evaluator always returns the same structured result; a
    criteria-snapshot field missing or malformed never throws, and the corresponding criterion is marked
    not-satisfied with a stated reason (not a hard error).
12. **Dependencies:** None upstream (independent per the dependency graph); B-7 (useful-outcome logic, §1.8)
    depends on this.
13. **Residual unresolved implementation detail:** **The exact semantic distinction between "not satisfied" and
    "indeterminate"** under the fail-soft decision — the engineering-blocker decision explicitly decided the
    *direction* (fail-soft) but left this definition open, carried forward unresolved here, not invented.
14. **Blocks authorization?** No for the module itself (classification A/B — inputs/outputs/determinism/
    failure-direction are all decided). **The not-satisfied-vs-indeterminate definition is classification B
    (engineering decision required) and should be resolved before this module's test suite is finalized, though
    it does not block authorizing the module's existence and basic shape.**

### 1.8 PCG-4 — Useful-outcome numerator (B-7)

1. **Governing decision:** B-7 (conjunctive: `feedback.useful = true` AND the §1.7 evaluator's match = true,
   evaluated per-opportunity); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §9 (verbatim "useful outcome"
   text, decided, not reopened); Q-9/Q-10 (denominator concept / numerator contingency, decided, not reopened).
2. **Exact repository files/modules affected:**
   - Migration `0020_feedback` — existing `feedback.useful` column, read-only dependency, no change.
   - §1.7's new evaluator's persisted result table, read-only dependency.
   - A new PCG-4 computation module (not yet located; same open-location note as §1.1's PCG-1 computation).
3. **Existing code that can be reused:** `feedback.useful`'s existing upsert semantics (one row per
   `(userId, opportunityId)`, per migration `0020`'s `UNIQUE(opportunity_id)`) — read as-is, no change.
4. **New code required:** A query joining, for each opportunity in the activation population (§1.4's
   `completed_at`-based population), a `feedback.useful = true` row and a matching §1.7 evaluator result with
   `serviceMatch`/`customerMatch`/`valueThresholdMatch` all satisfied, for the *same opportunity*.
5. **Schema/migration changes:** None beyond what §1.4 and §1.7 already name.
6. **Event/data contract:** No new event — a computed boolean per opportunity, derived from two existing/new
   persisted facts (field 4), documented here as exactly where each operand originates: `feedback.useful` comes
   from the user's own explicit submission via `FeedbackForm`/`recordFeedback` (existing, unchanged); the
   evaluator-match operand comes from §1.7's new, standalone module (not `core-qualification`).
7. **Idempotency requirements:** None beyond what §1.7's evaluator and `feedback`'s existing upsert already
   guarantee — this is a read-only aggregation, not a new write path.
8. **Privacy/security implications:** None beyond what the two source tables already carry.
9. **Test requirements:** A fixture with `feedback.useful = true` and a full evaluator match (counts); one with
   only `feedback.useful = true` and no evaluator match (does not count); one with only an evaluator match and
   no feedback (does not count); one with neither (does not count).
10. **Independent-validation requirements:** PCG-4 is monitoring-only — no §6.10 requirement applies.
11. **Acceptance criteria:** PCG-4's reported numerator equals the count of opportunities satisfying both
    operands for the same opportunity, never either operand alone.
12. **Dependencies:** §1.7 (evaluator) and §1.4 (activation population, via `completed_at`).
13. **Residual unresolved implementation detail:** Exact module location for the PCG-4 computation (same
    open-location note as PCG-1); no other open items — the combination logic itself is fully decided.
14. **Blocks authorization?** No — classification A.

### 1.9 PCG-6 — Completion rate (B-8, B-9)

1. **Governing decision:** B-8 (numerator = §1.6's reviewed event; denominator = §1.4's `completed_at`-based
   activation population); B-9 (no sample floor — report raw percentage and denominator, human-reviewed).
2. **Exact repository files/modules affected:** Same open-location note as PCG-1/PCG-4's computation modules;
   reads §1.6's reviewed-event store and §1.4's `completed_at` column.
3. **Existing code that can be reused:** `getOpportunityTrackingSummary()`
   (`packages/core-opportunity/src/service.ts`, Phase 15/R-27) is **not** reused for PCG-6's numerator per B-8's
   decision (it measures "actioned"/feedback, a different signal from B-1's reviewed event) — cited only to
   confirm this document is not silently reintroducing the conflation B-1/B-8 already decided against.
4. **New code required:** A query counting distinct holders in the activation population (§1.4) who have at
   least one reviewed-event row (§1.6) within the window.
5. **Schema/migration changes:** None beyond what §1.4/§1.6 already name.
6. **Event/data contract:** No new event — a computed percentage plus its raw denominator.
7. **Idempotency requirements:** None beyond what §1.4/§1.6 already guarantee.
8. **Privacy/security implications:** None beyond what the source tables already carry.
9. **Test requirements:** A fixture with an activated holder who has a reviewed-event row (counts); one who
    does not (does not count); a fixture confirming no NOT-YET-EVALUABLE suppression is ever applied (per B-9,
    the raw percentage and denominator are always reported together, regardless of sample size).
10. **Independent-validation requirements:** PCG-6 is monitoring-only — no §6.10 requirement applies.
11. **Acceptance criteria:** PCG-6's reported percentage and denominator both always render (never suppressed),
    and the denominator always equals the count of holders meeting §1.4's `completed_at`-based activation
    definition.
12. **Dependencies:** §1.4 and §1.6.
13. **Residual unresolved implementation detail:** Same open-location note as the other gate-computation
    modules; no policy items remain open for PCG-6 — B-8/B-9 are both fully decided, including the explicit
    decision **not** to introduce a new numeric threshold (per the task's own instruction, honored, not
    reopened).
14. **Blocks authorization?** No — classification A.

### 1.10 Independent-validation infrastructure (B-2)

1. **Governing decision:** B-2 (CI-run deterministic fixtures + a named non-implementing-engineer role for the
   production cross-check, before PCG-1/2/3A/3B results are used for launch-qualification); ED-12 (Option C,
   decided, not reopened); `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 (requirement, decided, not
   reopened).
2. **Exact repository files/modules affected:** No existing CI validation-gate configuration was found in this
   repository (confirmed in the original blocker-preparation record and not re-contradicted here); a new
   fixture directory (candidate: `tests/validation/`, location uncertain per the original record) and CI
   workflow configuration would be new.
3. **Existing code that can be reused:** `packages/core-reconciliation/`'s `ReconciliationReport`/`isClean()`/
   `formatReport()` — a reporting *format* precedent (what evidence looks like), reusable for the production
   cross-check's match/mismatch record shape, though not its process/ownership.
4. **New code required:** The fixture suite itself (covering the boundary/duplicate/dual-tier/refund/
   insufficient-sample cases already enumerated in the original implementation-authorization preparation
   record §6); a CI workflow step running it; a production cross-check query (W-18), written independently of
   the primary PCG-1/2/3A/3B computation code, by whoever is assigned the named non-implementing role.
5. **Schema/migration changes:** Possibly a new table for retaining cross-check evidence, depending on where
   B-2's "evidence location" residual item (carried forward, §7) is eventually resolved — not decided here.
6. **Event/data contract:** The cross-check's required evidence shape (already specified in the original
   preparation record §6, not reinvented here): raw source rows for the window, the primary value, the
   independent value, and a match/mismatch record with an explanation if they differ.
7. **Idempotency requirements:** Not applicable — this is a read-only verification process, not a write path.
8. **Privacy/security implications:** None beyond what the underlying gate computations already carry.
9. **Test requirements:** This workstream *is* the test/validation infrastructure; its own "test requirement" is
   that its fixture suite actually exercises every case named in field 4.
10. **Independent-validation requirements:** This workstream is the independent-validation requirement for
    PCG-1/2/3A/3B — it cannot validate itself; its own correctness is established by code review during
    implementation, not by this document.
11. **Acceptance criteria:** Every fixture case passes deterministically in CI; a production cross-check has
    been performed and recorded, with a match/mismatch outcome, before any PCG-1/2/3A/3B result is used for a
    launch-qualification decision.
12. **Dependencies:** PCG-1/3A/3B's own computation modules (§1.1, §1.3, and the as-yet-unbuilt PCG-2/3A/3B
    computation not detailed in this document since neither B-1..B-11 nor this task named a specific change to
    them beyond what the original implementation-authorization preparation record already covers).
13. **Residual unresolved implementation detail:** **Validation-evidence retention duration** (carried forward
    explicitly, per the engineering-blocker decision's own §4/§7 residual item — no governing record supplies a
    number, and none is invented here); exact evidence storage location (table vs. CI artifact vs. document).
14. **Blocks authorization?** No for building the infrastructure itself (classification A/B). **The retention
    duration is classification C (Product Owner decision required)** before validation evidence can be said to
    comply with any specific record-keeping expectation — but its absence does not block *building* the
    fixture/cross-check mechanism, only a fully specified *retention policy* around its output, consistent with
    the original blocker decision's own framing (B-2 field 8).

---

## 2. Consolidated schema/migration plan (named, not created)

| # | Table/column | Workstream | Required by |
|---|---|---|---|
| M-1 | `searches.completed_at TIMESTAMPTZ NULL` | §1.4 | B-5 |
| M-2 | `refund_events` (new table: FK to `Payment`, amount, full/partial flag, timestamp, source event id, reversed/corrected flag) | §1.5 | B-6 |
| M-3 | `Order.visitor_id` (new nullable column, or equivalent threading of the B-10 cookie value into the existing `Order` insert) | §1.1/§1.2 | B-11a + B-10 |
| M-4 | A new table for the B-1 reviewed event, OR a new row type within ED-1's existing event store (location not confirmed) | §1.6 | B-1 |
| M-5 | A new table for the §1.7 evaluator's persisted result (per ED-10, decided; not the `qualifications` table) | §1.7 | B-3 + ED-10 |
| M-6 | A new table or row type for the §1.3 offer-exposure event (not yet designed) | §1.3 | Q-5/Q-6 |

None of M-1 through M-6 is created, drafted as DDL, or migrated by this document. All six are named here so a
future Implementation Authorization Decision can scope them as a single, explicitly authorized migration batch
rather than discovering them piecemeal during implementation.

## 3. Consolidated event/data contracts

| Contract | Shape | Origin |
|---|---|---|
| PCG-1 demonstrated intent | Existing `Order` row (`createdAt`, `razorpayOrderId`, new `visitor_id`) | §1.1 |
| Visitor identity | Opaque cookie value, server-set, first-party | §1.2 |
| Offer exposure | `{ visitorId, productId, tier, exposedAt }`, first-exposure-only | §1.3 |
| Search completion | `searches.completed_at`, set once | §1.4 |
| Refund/reversal | `refund_events` row, FK to `Payment`, dedup via `WebhookEvent.razorpay_event_id` | §1.5 |
| Opportunity reviewed | `{ userId, opportunityId, reviewedAt }`, unique per pair | §1.6 |
| Qualification-equivalence match | `{ serviceMatch, customerMatch, valueThresholdMatch, evaluatorVersion, evaluatedAt }` | §1.7 |
| Useful outcome (PCG-4) | Computed boolean per opportunity: `feedback.useful = true AND` §1.7 match | §1.8 |
| Completion (PCG-6) | Computed percentage + raw denominator, no floor | §1.9 |

## 4. Consolidated test plan

Enumerated per-workstream in §1 (field 9 of each). No test file is created or modified by this document. The
existing `tests/contract/razorpay-webhook.contract.test.ts` stubs are the only currently-existing test artifacts
directly implicated; all other fixtures named above are new, not-yet-written test plans.

## 5. Consolidated independent-validation plan

Per B-2 (§1.10): CI-run deterministic fixtures (ED-12 track B) for all workstreams feeding PCG-1/2/3A/3B,
regardless of which specific workstream; a named, non-implementing-engineer-role production cross-check
(ED-12 track A / W-18) specifically before any PCG-1/2/3A/3B result is used for launch-qualification. PCG-4/5/6
(monitoring-only) do not require this process, though their own fixture tests (§1.7, §1.8, §1.9 field 9) remain
good practice, not a §6.10 obligation.

## 6. Consolidated acceptance criteria

Enumerated per-workstream in §1 (field 11 of each). At the program level: no PCG-1/2/3A/3B result is used for
launch-qualification without a completed, recorded independent-validation cross-check (§1.10); no PCG-4/5/6
result introduces a numeric threshold not already supplied by an existing governing decision (PO-D2's four
named floors, or B-9's explicit "no floor" for PCG-6); no workstream's implementation changes `core-qualification`,
reuses `Payment.status = REFUNDED` as the sole refund representation, or makes the B-1 reviewed event
feedback-submission-based — each would silently contradict an already-made decision (Q-10/ED-10, B-6, B-1
respectively) and must not occur.

## 7. Residual open decisions (explicit classification, not guessed)

| Item | Classification | Rationale |
|---|---|---|
| Validation-evidence retention duration (B-2) | **C — Product Owner decision required** | No governing record supplies a number; inventing one would violate the no-fabrication instruction already honored in the engineering-blocker decision. |
| First-party cookie name/lifetime/attributes (B-10) | **A — implementation detail** | B-10 decided the primitive *type* only; these parameters do not affect governing policy. |
| B-3 "not satisfied" vs. "indeterminate" semantics | **B — engineering decision required** | The *direction* (fail-soft) is decided; the precise state definitions are an implementation-design question, not a policy question, but need resolving before the evaluator's test suite can be finalized. |
| Complete `refund_events` column definition (B-6) | **A/B — implementation detail / engineering decision** | The minimum shape (amount, flag, timestamp, source id, Payment association, reversed flag) is already named; exact DDL/typing is ordinary schema-design work. |
| Exact reviewed-event UI call site's storage container (B-1, §1.6 field 13) | **B — engineering decision required** | B-1 decided the *semantics* (first-view, deduplicated, page-render call site) fully; only *where* the result is persisted (new table vs. existing store's new row type) remains open, and does not change behavior. |
| `searches.completed_at` historical backfill (§1.4 field 13) | **C — Product Owner decision required** | Explicitly not decided by B-5; this document does not assume a default per the task's own instruction. |
| ₹1,499 tier's offer-screen render call site (§1.3 field 13/14) | **A/B boundary — needs a factual repository confirmation before implementation**, not a policy question | Not confirmed to exist as a distinct component from the ₹499 `UpsellTracker` path in this repository pass; if it genuinely does not exist as a separate render path, that itself would be a **D — blocker requiring another governance record** (a product-design gap, not an engineering one), to be confirmed, not assumed, during implementation kickoff. |
| Exact module location for every new gate-computation query (PCG-1/4/6, §1.1/§1.8/§1.9) | **A — implementation detail** | No existing `packages/core-*` module is an obvious home; does not affect any governing decision. |
| Privacy/consent treatment of the new B-10 cookie | **C — Product Owner decision required, if a consent process exists; otherwise A** | Not assessed in this repository pass; this document does not fabricate a consent mechanism that may or may not already exist elsewhere in the product. |

No item above is resolved by this document. Items marked **D** are not treated as blockers to writing this
preparation document, but are flagged as needing confirmation before the corresponding workstream's
implementation is authorized.

## 8. Dependency graph (workstream level)

```
B-10 (visitor identity)         → §1.1 (PCG-1), §1.3 (PCG-3A/3B exposure)
§1.1 (PCG-1 Order-row evidence) → §1.10 (validation, for PCG-1 specifically)
§1.3 (exposure)                 → §1.10 (validation, for PCG-3A/3B specifically)
§1.4 (completed_at)             → §1.6 (reviewed event's population context), §1.8 (PCG-4 activation pop.), §1.9 (PCG-6 denominator)
§1.5 (refund_events)            → (feeds PCG-5, not separately detailed as its own gate-computation workstream in this document)
§1.6 (reviewed event)           → §1.9 (PCG-6 numerator)
§1.7 (qualification evaluator)  → §1.8 (PCG-4 numerator)
§1.8, §1.9                      → no further downstream workstream in this document
§1.10 (validation infra)        → gates launch-qualification *use* of §1.1/§1.3's outputs, not their construction
```

No contradiction with PDEF-2, PDEF-3, PDEF-4, the entitlement-stacking decision, or ED-1..ED-13 was found while
building this graph. No amendment dependency is created by this document (all amendment-triggering findings, if
any had occurred, would have been flagged in §7 as classification **D** — the one candidate, the ₹1,499 exposure
call site, is a factual-confirmation item, not a policy contradiction, and is flagged accordingly, not treated as
requiring a PDEF amendment).

## 9. Authorization boundary

This record authorizes **preparation only**. It does **not** authorize: source-code changes; test changes;
schema or migration changes (including every item in §2); configuration or dependency changes; billing changes;
instrumentation implementation; validation execution; deployment; release; or production traffic. A separate,
explicitly authorized Implementation Authorization Decision must exist, resolving at minimum the classification-
B and classification-C items in §7 (classification-D items confirmed one way or the other), before any
workstream in §1 is implemented. This document does not create that authorization and does not imply it will be
granted as proposed here.

---

## Final verification (performed before reporting completion)

- HEAD unchanged: `af9ede93830f5e3e611195dc2451a470364def74`.
- Staged files: 0.
- Tracked files modified: 0 (`git diff --name-only` empty).
- No source, test, schema, config, or dependency file changed.
- Only this preparation record created. All governing records re-verified byte-identical to their pre-task
  hashes:
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` → `b587a0de43f3bcae8ccb8bcb25df9c634751848dc00d9760721bdaf18b22e148`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md` → `d199db8c6a953ca11744a27774505a503bb7935d4c0e62845887d01c30909cd0`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` → `3e76f1f55186b0bc7399cc7c8d9d29644fd5550ca40cd15384c764fe3bc92286`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_FACILITATION_RECORD.md` → `8d12eb49b7c1e9629a485371c433442b2d657517076e4dfb8d57dd1ab2bdd360`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_ORDERED_QUESTIONNAIRE.md` → `ffc8485868ce830ff0f574a1749374ad06912f129f64e43d573807cfb5d3b51f`
  - `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` → `8ddf7d0410ae4023a109e2712e6b4c86b9007df80d2f2880d6d28f720deadde9`
  - `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` → `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226`
  - `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` → `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3`
  - `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md` → `e401fae086f0f8f849684c819464e6705f0144cac720d7aff5853b2104fdfebb`
  - `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` → `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c`
  - `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` → `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8`
  - `MVP_SCOPE_BOUNDARY.md` → `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3`
  - `PROJECT_MASTER_CHECKLIST.md` → `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` (read-only cross-reference; not edited despite being stale, per §0)
  - `docs/ARCHITECTURE.md` → `845241d9a75b3dd28848ff3a5cfe0ddc4ab8cead031427ea73533fd4e5d053b8`
- No amendment was made to any governing record.
- No commit made. No push made.
