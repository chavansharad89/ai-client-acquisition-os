# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation Implementation Authorization Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-IMPLEMENTATION-AUTHORIZATION-PREPARATION-001`
**Date:** 2026-10-05
**Type:** Read-only preparation document. **This record creates, implies, infers, or authorizes no implementation,
no source-code change, no test change, no schema/migration change, no configuration/dependency change, no
validation execution, no billing/credit-ledger change, and no deployment/release/launch action of any kind.** It
does not modify any existing decision record, the PRD, or `docs/ARCHITECTURE.md`.

---

## 1. Baseline

| Field | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD at start and end of this task | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0, before and after |
| Working-tree state | 20 untracked files before this task (per `git status --porcelain`), including the governing records this task reads; 1 additional untracked file (this record) after |
| Governing implementation input | **Confirmed:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` (`CLIENT-FINDER-PDEF-4-INSTRUMENTATION-ENGINEERING-DESIGN-PO-DEC-001`) is the governing, adopted engineering-design decision (ED-1..13 and PO-D1/PO-D2) for all workstreams below. Nothing below reopens it. |

Governing-record hashes (re-verified at this HEAD; none modified by this task):

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | `8ddf7d0410ae4023a109e2712e6b4c86b9007df80d2f2880d6d28f720deadde9` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_PRODUCT_OWNER_DECISION_PREPARATION.md` | `573833f7be37d8bad63e50973b4c85c1008fc11d4f0aa84f61cd75815a3d462e` |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |

PRD V2.2 (`requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md`) and `docs/ARCHITECTURE.md` were both located and consulted for repository-mapping context (their text is not reproduced here); neither is altered.

No baseline discrepancy was found; proceeding with preparation was not blocked.

---

## 2. Implementation workstreams

Each workstream states its governing decision, current repository capability (re-verified against the unchanged HEAD above), likely affected files/modules, schema impact, test impact, dependencies, unresolved questions, acceptance criteria, and whether implementation authorization is required (it always is, for every workstream — none is pre-authorized by this or any prior record).

### W-1 Durable funnel/visitor event storage
- **Governing decision:** ED-1 (generic append-only event table).
- **Current capability:** No durable server-side funnel/visitor event table exists. `apps/web/src/analytics/events.ts`/`funnelEvents.ts` define browser-emittable event *names* only (`funnel_entry_viewed`, `upsell_viewed`, etc., and `FUNNEL_EVENTS` in `funnelEvents.ts`); the only durable, queryable event table, `meta_events` (`packages/db/prisma/schema.prisma:214`), is scoped to Meta CAPI purchase dispatch.
- **Files/modules likely affected:** new migration under `packages/db/prisma/migrations/` (next number after `0030_research_signal_authorization_evidence`); `packages/db/prisma/schema.prisma` (new model); a new package/module to own write/query access (not yet named).
- **Schema impact:** new table (generic `event_type`/`payload`, visitor id, timestamp, indexed).
- **Test impact:** new unit/contract tests for the write path; no existing test is modified.
- **Dependencies:** none upstream; blocks W-2, W-3, W-5, W-7.
- **Unresolved questions:** exact column set, index strategy, and retention policy are engineering detail not fixed by ED-1 (ED-1 fixed the architecture class, not the DDL).
- **Acceptance criteria:** a funnel/visitor event can be durably written and queried by visitor id and timestamp range; no existing table/behavior changes.
- **Implementation authorization required:** Yes.

### W-2 Visitor identity handling
- **Governing decision:** ED-2 (defer merge; reserve field only).
- **Current capability:** No visitor-id concept exists at all yet (it is introduced by W-1); `users.id` (migration `0012_user_identity`) and `entitlements.customer_email` (migration `0004_entitlements`) are the only identity concepts today, bridged only by email equality.
- **Files/modules likely affected:** whatever table W-1 introduces (a nullable `linked_user_id`-style column, unused).
- **Schema impact:** one nullable column on W-1's new table; no merge logic.
- **Test impact:** none beyond confirming the column is nullable and unused.
- **Dependencies:** depends on W-1.
- **Unresolved questions:** none beyond W-1's own column-naming detail.
- **Acceptance criteria:** the reserved column exists and is never written to by any code path in this phase.
- **Implementation authorization required:** Yes.

### W-3 Bot/internal-traffic exclusion
- **Governing decision:** ED-3 (narrow known-identifier allowlist).
- **Current capability:** Only generic per-IP/per-email rate limiting exists (`packages/rate-limit/src/policy.ts`), confirmed to be an abuse throttle on the payment-creation endpoint, not a visitor classifier.
- **Files/modules likely affected:** `packages/rate-limit/src/policy.ts` (reference pattern only, not reused); whatever module computes PCG-1 (W-8); a new allowlist config/module (not yet named).
- **Schema impact:** none required in principle (an allowlist can be static config), unless the Product Owner wants it DB-managed — not decided here.
- **Test impact:** new unit tests for the exclusion check.
- **Dependencies:** depends on W-1 (an event store to apply the exclusion against).
- **Unresolved questions:** the allowlist's concrete contents (which IPs/account identifiers) and whether it is config-file-based or DB-based are engineering detail not fixed by ED-3.
- **Acceptance criteria:** a known-allowlisted identifier's events are excluded from PCG-1's count; nothing else changes who is "qualified" under Q-1.
- **Implementation authorization required:** Yes.

### W-4 Immutable event/snapshot semantics
- **Governing decision:** ED-4 (explicit per-window snapshot).
- **Current capability:** No snapshot table exists. The closest existing structural analogs are `WebhookEvent.razorpayEventId @unique` (dedup, not snapshotting) and `entitlements.granted_at`/`revoked_at` (state transition via field update, not a new-row-per-close pattern).
- **Files/modules likely affected:** a new snapshot table (name not proposed); every future PCG-computation module (W-8..W-13).
- **Schema impact:** new table (gate id, window bounds, computed value, denominator, computed-at timestamp).
- **Test impact:** new tests asserting a closed window's snapshot does not change on recomputation.
- **Dependencies:** depends on W-1 and W-7 (rolling-window computation).
- **Unresolved questions:** exact snapshot cadence (on-demand at window close vs. a scheduled job) is engineering detail not fixed by ED-4.
- **Acceptance criteria:** once a window closes, its snapshot is immutable; a later raw-event write (e.g., a late-arriving duplicate) does not alter an already-closed snapshot.
- **Implementation authorization required:** Yes.

### W-5 Tier-specific offer-exposure persistence (PCG-3A/3B)
- **Governing decision:** ED-5 (extend `upsell_viewed` with a server-resolved visitor id).
- **Current capability:** `upsell_viewed { productId, fromTier }` exists as a browser-emittable event *name* only (`apps/web/src/analytics/events.ts:26`); not persisted server-side anywhere.
- **Files/modules likely affected:** `apps/web/src/analytics/events.ts` (event shape); W-1's new table (persistence); the browser call site(s) that currently emit `upsell_viewed` (not yet enumerated — **uncertain location requiring engineering confirmation**, since the event-name file does not show every emission call site).
- **Schema impact:** uses W-1's generic event table; no new table if ED-1's architecture is followed.
- **Test impact:** update/extend `apps/web/src/analytics/events.test.ts`; new persistence-path tests.
- **Dependencies:** depends on W-1; interacts with W-2 only if cross-session exposure tracking is later wanted (not required by Q-6).
- **Unresolved questions:** the exact server-resolution point for the visitor id (which request-handling layer attaches it) is engineering detail not fixed by ED-5; must not violate the existing `assertNoPii()` boundary.
- **Acceptance criteria:** a tier-specific offer impression is durably recorded with a server-resolved visitor id and a first-exposure timestamp, per Q-5/Q-6.
- **Implementation authorization required:** Yes.

### W-6 Refund webhook ingestion and idempotency
- **Governing decision:** ED-6 (reuse `WebhookEvent` dedup; isolate refund business logic in its own module).
- **Current capability:** Confirmed — `packages/core-payments/src/webhookHandler.ts:48`: `export const SUPPORTED_EVENTS = ['payment.captured'] as const;` — refund events are not accepted. `WebhookEvent.razorpayEventId @unique` (`packages/db/prisma/schema.prisma:171,174`) is the existing idempotency primitive. `packages/core-payments/src/webhookRetention.ts`'s `REDACTION_ALLOWLIST` (lines 86, 104–105) already names `payload.payment.entity.amount_refunded` and `payload.payment.entity.refund_status`, confirming the refund payload shape is partially known in this codebase already, though not yet acted on. `tests/contract/razorpay-webhook.contract.test.ts:8–10` has three `it.todo` stubs, including `it.todo('accepts a real refund.processed payload shape')`, confirmed still unimplemented.
- **Files/modules likely affected:** `packages/core-payments/src/webhookHandler.ts` (add refund event(s) to `SUPPORTED_EVENTS`); a new refund-business-logic module (not yet named, per ED-6); possibly a new `refunds`/reversal table or reuse of `Payment.status` transitions; `tests/contract/razorpay-webhook.contract.test.ts` (the existing `it.todo` stubs — filling these in is test-implementation work, not performed here).
- **Schema impact:** possibly a new table for refund/reversal state, or new `PaymentStatus` transitions (`packages/db/prisma/schema.prisma:57`) — not decided by ED-6, which fixed the dedup/isolation pattern, not the storage shape.
- **Test impact:** the three `it.todo` stubs require implementation; new tests for the isolated refund-logic module.
- **Dependencies:** none beyond existing `Payment`/`Order`/`WebhookEvent` infrastructure.
- **Unresolved questions:** (1) the exact refund-table/column design is not fixed; (2) whether Q-12's "economic finality" correction logic lives as a service function or a DB trigger-equivalent is engineering detail.
- **Acceptance criteria:** a `refund.processed` (or equivalent) webhook is accepted, deduplicated via the existing `razorpayEventId` uniqueness, and Q-11/Q-12's policy (binary any-refund-counts, economic finality, pre-close-only correction) is implemented in an isolated module.
- **Implementation authorization required:** Yes.

### W-7 Rolling 30-day boundary utility
- **Governing decision:** ED-7 (shared boundary-mechanics utility; bespoke per-gate population logic).
- **Current capability:** Confirmed via `grep -rli "rolling"` across `packages/` and `apps/` — zero matches; no rolling-window utility exists. `packages/core-reconciliation/src/detection.ts` uses a half-open (`created_at >= $1 AND created_at < $2`) windowed query pattern, built for duplicate detection, the closest structural analog.
- **Files/modules likely affected:** a new shared module (not yet named); `packages/core-reconciliation/src/detection.ts` as reference pattern only (not imported).
- **Schema impact:** none directly; consumed by every PCG-computation module.
- **Test impact:** new unit tests for boundary correctness (no double-count, no gap) at window edges.
- **Dependencies:** depends on W-1/W-5/W-6 providing underlying events/tables to query; blocks W-8..W-13.
- **Unresolved questions:** timezone normalization strategy (the utility must be timezone-consistent per ED-4/ED-7's requirements) is not fixed by ED-7 beyond "half-open window."
- **Acceptance criteria:** given a table/timestamp column/window length, the utility returns a deterministic, non-overlapping, gap-free partition of events into rolling windows.
- **Implementation authorization required:** Yes.

### W-8 PCG-1 computation (qualified visitors)
- **Governing decision:** Q-1/Q-2 (`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`) — not reopened; PCG-1 = aggregate count of visitors meeting funnel-entry + demonstrated-intent, no additional eligibility criterion, shared across both tiers.
- **Current capability:** No computation exists; depends entirely on W-1/W-3/W-7 being built first.
- **Files/modules likely affected:** a new PCG-1 computation module (not yet named).
- **Schema impact:** none beyond W-1/W-4's tables.
- **Test impact:** new unit/fixture tests (feeds W-17/W-18).
- **Dependencies:** W-1, W-3 (exclusion), W-7 (windowing), W-4 (snapshotting).
- **Unresolved questions:** none beyond the above workstreams' own open items.
- **Acceptance criteria:** see §4 gate contract below.
- **Implementation authorization required:** Yes.

### W-9 PCG-2 computation (30-day buyer retention/activity — per PDEF-3 definition)
- **Governing decision:** Q-3/Q-4 — window anchored to payment-capture; refunded buyers still count (immutable at close).
- **Current capability:** `Order`/`Payment` tables (`packages/db/prisma/schema.prisma:98,143`) already exist and carry the payment-capture event via `PaymentStatus`; no window/aggregation layer exists yet.
- **Files/modules likely affected:** a new PCG-2 computation module; consumes `Order`/`Payment` directly.
- **Schema impact:** none beyond W-4/W-7.
- **Test impact:** new unit/fixture tests.
- **Dependencies:** W-7 (windowing), W-4 (snapshotting).
- **Unresolved questions:** none identified beyond upstream workstreams.
- **Acceptance criteria:** see §4.
- **Implementation authorization required:** Yes.

### W-10 PCG-3A computation (₹99→₹499 conversion)
- **Governing decision:** Q-5/Q-6/Q-7 — exposure = impression of the ₹499 offer screen; window anchored to first exposure; refunded conversions still count.
- **Current capability:** Depends on W-5 (exposure persistence) and `Order`/`Payment` for the converting purchase.
- **Files/modules likely affected:** a new PCG-3A computation module.
- **Schema impact:** none beyond W-4/W-5/W-7.
- **Test impact:** new unit/fixture tests, including the PO-D2 floor (n ≥ 100).
- **Dependencies:** W-5, W-7, W-4.
- **Unresolved questions:** none beyond upstream workstreams.
- **Acceptance criteria:** see §4.
- **Implementation authorization required:** Yes.

### W-11 PCG-3B computation (₹1,499 conversion, independent of ₹499 ownership)
- **Governing decision:** Q-5/Q-6/Q-7, applied to the ₹1,499 offer screen; independence from ₹499 ownership per PDEF-2/Completion Decision.
- **Current capability:** Same as W-10, for the ₹1,499 offer.
- **Files/modules likely affected:** a new PCG-3B computation module (likely sharing structure with W-10, not code, per each gate remaining bespoke under ED-7's Option C).
- **Schema impact:** none beyond W-4/W-5/W-7.
- **Test impact:** new unit/fixture tests, including the PO-D2 floor (n ≥ 200).
- **Dependencies:** W-5, W-7, W-4.
- **Unresolved questions:** none beyond upstream workstreams.
- **Acceptance criteria:** see §4.
- **Implementation authorization required:** Yes.

### W-12 PCG-4 computation (useful-outcome rate among activated holders)
- **Governing decision:** Q-9 (denominator concept) + PO-D1 (`Search.status = 'COMPLETE'` only) + Q-10 (numerator contingent on the equivalence review) + ED-8/ED-10/ED-11.
- **Current capability:** `packages/core-search/src/types.ts:9` confirms `SearchStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED'`; `packages/core-qualification/src/types.ts` confirms `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE']`, keyed to `prospectId`/`opportunityId` (migration `0022_qualifications`), with no field for a searching user's own configured service/customer/value criteria — independently re-confirmed NOT EQUIVALENT to PDEF-3 condition (b). `feedback` table (migration `0020_feedback`) exists with a `useful BOOLEAN` column.
- **Files/modules likely affected:** `packages/core-search/src/types.ts`/`repository.ts`/`pgRepository.ts` (read-only query, per ED-8); a new standalone qualification-equivalence evaluator module, separate from `core-qualification` (per ED-10); a new PCG-4 computation module joining `entitlements` × `searches` × the new evaluator's result × `feedback` (per ED-11).
- **Schema impact:** a new table for the ED-10 evaluator's persisted per-opportunity result.
- **Test impact:** new unit/fixture tests, including the PO-D2 floor (n ≥ 25); the Q-10 equivalence review (W-16) is a precondition for finalizing the numerator, not for building the denominator/join plumbing.
- **Dependencies:** W-7, W-4, PO-D1 (decided), and W-16 (Q-10 equivalence review, still open).
- **Unresolved questions:** Q-10's equivalence review outcome determines whether any `core-qualification` logic is reusable at all for the "service/customer/value match" part of condition (b) versus needing to be written fully from scratch — carried forward as unresolved, see §7.
- **Acceptance criteria:** see §4. PCG-4 is monitoring-only (PDEF-4 §6.3); it does not block launch.
- **Implementation authorization required:** Yes.

### W-13 PCG-5 computation (refund rate)
- **Governing decision:** Q-11/Q-12 — transaction-based, binary any-refund-counts, economic finality, pre-close-only correction, immutable at close (PDEF-4 §6.6).
- **Current capability:** Depends entirely on W-6 (refund ingestion) existing first; `Payment`/`Order` already exist for the denominator (all transactions in window).
- **Files/modules likely affected:** a new PCG-5 computation module.
- **Schema impact:** none beyond W-4/W-6/W-7.
- **Test impact:** new unit/fixture tests, including the PO-D2 floor (n ≥ 125), and reversal/duplicate-webhook edge cases.
- **Dependencies:** W-6, W-7, W-4.
- **Unresolved questions:** none beyond W-6's own open items.
- **Acceptance criteria:** see §4. PCG-5 is monitoring-only.
- **Implementation authorization required:** Yes.

### W-14 PCG-6 computation (completion rate from first activation)
- **Governing decision:** PDEF-3 §11/§13's compound completion definition; PCG-6 is monitoring-only (PDEF-4 §6.3); ED-9 (dedicated "opportunity reviewed" event).
- **Current capability:** `SearchStatus.COMPLETE` is a job-status field, not evidence of user review; no existing field represents "reached the review/action step." A plausible UI call site exists — `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` — a server-rendered "Prospect detail" page that already reads `getFeedback`, `getOpportunity`, `getOpportunityQualification`, etc., and renders a `FeedbackForm`. **This is a confirmed existing file and a strong candidate location, not a confirmed call site** — whether the event should fire on page render (any view) or on a more specific in-page action is still open (see §7, carried forward from ED-9).
- **Files/modules likely affected:** W-1's event table (new "opportunity reviewed" event type); possibly `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` or a server action/route it calls (uncertain — requires engineering confirmation); a new PCG-6 computation module.
- **Schema impact:** uses W-1's table if ED-1's architecture is followed.
- **Test impact:** new unit/fixture tests; possible update to `apps/web/app/(client-finder)/opportunities/[id]/page.test.ts` once the call site is confirmed.
- **Dependencies:** W-1, W-7, W-4, W-12's activation signal (window start = first activation per PCG-6).
- **Unresolved questions:** the exact instrumentation point within or around `[id]/page.tsx` is not confirmed (ED-9 carried-forward blocker, §7 item 1).
- **Acceptance criteria:** see §4. Monitoring-only; PDEF-4 §6.10 requires implementation only for PCG-6, no independent pre-validation.
- **Implementation authorization required:** Yes.

### W-15 Dedicated "opportunity reviewed" event (standalone workstream, feeds W-14)
- Same governing decision, capability, and open question as W-14's instrumentation half; broken out separately here because ED-9 names it as its own decision item distinct from PCG-6's aggregation logic. Implementation authorization required: Yes.

### W-16 Standalone qualification-equivalence evaluator (feeds W-12's numerator)
- **Governing decision:** ED-10 (new standalone module, separate from `core-qualification`); Q-10 (the equivalence review is a precondition, not performed by this or any prior preparation record).
- **Current capability:** Confirmed NOT EQUIVALENT (see W-12). `packages/core-search/src/types.ts` exposes only a `serviceProfileId` lineage reference on `Search`, with no inline criteria-matching representation.
- **Files/modules likely affected:** a new module (not yet named, not `core-qualification`); reads `service_profiles`/`searches` (migrations `0013`, `0014`) for the user's configured criteria and `packages/core-opportunity/` for the opportunity's attributes.
- **Schema impact:** a new table for the persisted per-opportunity match result (per ED-10's "persisted result" choice over inline computation).
- **Test impact:** new unit tests; this module's correctness is also what the Q-10 equivalence review (an engineering task, not decided here) must assess.
- **Dependencies:** none beyond existing `service_profiles`/`searches`/`core-opportunity` data.
- **Unresolved questions:** the Q-10 equivalence review itself — whether `core-qualification`'s existing criteria can contribute anything to this new evaluator, or whether it must be entirely independent — is unresolved (§7 item 3).
- **Acceptance criteria:** the evaluator produces a persisted, auditable TRUE/FALSE match result per opportunity against the originating search's service/customer/value criteria.
- **Implementation authorization required:** Yes.

### W-17 Independent-validation fixture architecture (PCG-1/2/3A/3B)
- **Governing decision:** ED-12 (Option C — both a production cross-check and a deterministic fixture suite).
- **Current capability:** `packages/core-reconciliation/` provides a reusable pattern (`ReconciliationReport`, `isClean()`, `formatReport()` in `report.ts`; windowed query in `detection.ts`) built for duplicate detection, not commercial-gate reproduction. No deterministic-replay fixture harness exists for any PCG. `tests/contract/` is the existing convention for fixture-backed contract tests (e.g., `tests/contract/fixtures`, `tests/contract/razorpay-webhook.contract.test.ts`).
- **Files/modules likely affected:** `packages/core-reconciliation/` (pattern reference, not reused as-is); a new validation module/test suite, plausibly under `tests/contract/` following its existing convention, or a new top-level `tests/validation/` directory (not yet decided).
- **Schema impact:** none required for fixtures; the production cross-check reads existing/W-1..W-14 tables read-only.
- **Test impact:** net-new deterministic fixture suite covering window boundaries, duplicate events, dual-tier users, refund reversals, insufficient-sample conditions (detailed in §6 below).
- **Dependencies:** W-1, W-5, W-6, W-7 (the underlying instrumentation must exist before it can be validated).
- **Unresolved questions:** who/what performs validation and how results are retained — explicitly left open by ED-12 and PDEF-4 §6.10 to a separate process definition (§7 item 2).
- **Acceptance criteria:** see §6.
- **Implementation authorization required:** Yes.

### W-18 Production cross-check mechanism (PCG-1/2/3A/3B)
- Same governing decision as W-17 (its production-data half). Implementation authorization required: Yes.

### W-19 Audit/evidence bundle reporting
- **Governing decision:** ED-13 (reporting layer modeled on `core-reconciliation/src/report.ts`, paired with ED-4's evidence-bundle persistence).
- **Current capability:** `packages/core-reconciliation/src/report.ts` provides the reusable, side-effect-free reporting pattern referenced by ED-13; no PCG-specific evidence-bundle format exists.
- **Files/modules likely affected:** `packages/core-reconciliation/src/report.ts` (pattern reference); W-4's snapshot table (extended with contributing source-row ids); a new reporting module (not yet named).
- **Schema impact:** extends W-4's snapshot table, or a sibling table, with an evidence-bundle column/relation (array of contributing source-row ids).
- **Test impact:** new tests asserting a snapshot's evidence bundle reproduces its own numerator/denominator.
- **Dependencies:** W-4, and W-1/W-5/W-6 (source events to cite as evidence).
- **Unresolved questions:** none beyond upstream workstreams.
- **Acceptance criteria:** for any gate/window, the evidence bundle lets a reviewer reconstruct source events, population, numerator, denominator, exclusions, refunds/reversals, and duplicate handling without re-deriving the computation.
- **Implementation authorization required:** Yes.

---

## 3. Exact repository mapping

| Item | Status | Path |
|---|---|---|
| Browser event-name registry (purchase-adjacent) | Confirmed existing file | `apps/web/src/analytics/events.ts` |
| Browser event-name registry (funnel, Pixel/CAPI) | Confirmed existing file | `apps/web/src/analytics/funnelEvents.ts` |
| PII enforcement on browser events | Confirmed existing function | `apps/web/src/analytics/*` — `assertNoPii`/`assertBrowserEmittable` pattern (exact file not individually re-opened beyond `events.ts`/`funnelEvents.ts`, which both carry PII-policy comments) |
| Durable funnel/visitor event table | **New table required** | none exists; would live in `packages/db/prisma/schema.prisma` + a new migration after `0030_research_signal_authorization_evidence` |
| Purchase-dispatch event table (reference only, not reused) | Confirmed existing model | `packages/db/prisma/schema.prisma:214` (`MetaEvent` / `meta_events`) |
| Webhook ingestion entry point | Confirmed existing file | `packages/core-payments/src/webhookHandler.ts` |
| Webhook supported-events list | Confirmed existing symbol | `packages/core-payments/src/webhookHandler.ts:48` (`SUPPORTED_EVENTS`) |
| Webhook idempotency primitive | Confirmed existing column | `packages/db/prisma/schema.prisma:174` (`WebhookEvent.razorpayEventId @unique`) |
| Webhook payload retention/redaction allowlist | Confirmed existing file | `packages/core-payments/src/webhookRetention.ts` (`REDACTION_ALLOWLIST`, lines 86–105, already names refund-related payload paths) |
| Refund webhook contract-test stubs | Confirmed existing, unimplemented | `tests/contract/razorpay-webhook.contract.test.ts:8–10` (`it.todo`) |
| Rate-limit abuse throttle (reference only, not a classifier) | Confirmed existing file | `packages/rate-limit/src/policy.ts` |
| Reconciliation windowed-query pattern (reference only) | Confirmed existing file | `packages/core-reconciliation/src/detection.ts` |
| Reconciliation reporting pattern (reference only) | Confirmed existing file | `packages/core-reconciliation/src/report.ts` |
| Rolling-window utility | **New module required** | none exists (`grep -rli "rolling"` across `packages/` and `apps/` returns zero matches) |
| `users` table | Confirmed existing table | migration `0012_user_identity` (`users`, `users_email_key`) |
| `entitlements` table | Confirmed existing table | migration `0004_entitlements` (`entitlements`, `access_tokens`) |
| `service_profiles` table | Confirmed existing table | migration `0013_service_profiles` |
| `searches` table | Confirmed existing table | migration `0014_searches` (`status` column, CHECK-enforced `PENDING/RUNNING/COMPLETE/FAILED/CANCELLED`) |
| `core-search` package | Confirmed existing module | `packages/core-search/src/types.ts`, `repository.ts`, `pgRepository.ts` |
| `feedback` table | Confirmed existing table | migration `0020_feedback` (`useful BOOLEAN`, `reason TEXT`) |
| `qualifications` table | Confirmed existing table | migration `0022_qualifications` (`criteria JSONB`, `state`) |
| `core-qualification` package | Confirmed existing module | `packages/core-qualification/src/types.ts` (`QUALIFICATION_CRITERIA = ['NEED_DETECTED','EVIDENCE_PRESENT','CATEGORY_PLAUSIBLE']`) |
| `core-opportunity` package | Confirmed existing module | `packages/core-opportunity/src/*` (feedback repository/validation live here) |
| Opportunity detail/"review" UI page | Confirmed existing file; **candidate, not confirmed, ED-9 call site** | `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` |
| Opportunity list UI page | Confirmed existing file | `apps/web/app/(client-finder)/opportunities/page.tsx` |
| Standalone qualification-equivalence evaluator | **New module required** | not yet named; must not be `core-qualification` (ED-10) |
| Per-window snapshot table | **New table required** | not yet named |
| Offer-exposure persistence | **New table required** (or reuse W-1's generic table, per ED-1/ED-5) | not yet named |
| Evidence-bundle reporting module | **New module required** | not yet named |
| Independent-validation fixture suite location | **Uncertain — requires engineering confirmation** | plausibly `tests/contract/` (existing convention) or a new `tests/validation/` directory |
| PRD V2.2 | Confirmed existing file | `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` |
| Architecture document | Confirmed existing file | `docs/ARCHITECTURE.md` |

---

## 4. Data model (proposed, not implemented)

For each item: policy decisions already made are stated first and are **not** reopened; engineering implementation choices below the line still require separate authorization and are explicitly engineering detail, not policy.

**Visitor/event identity.** Policy decided: a visitor identity exists for PCG-1/exposure purposes (ED-1), with no merge to `users.id` built now (ED-2, PO-D1/PO-D2 do not touch this). Proposed shape (engineering detail, not authorized): `visitor_id` (opaque, client-set or server-set cookie-derived value), `linked_user_id` (nullable, reserved, unused).

**Funnel events (W-1).** Policy decided: ED-1's generic append-only architecture. Proposed shape (engineering detail): `id`, `event_type` (enum/string), `visitor_id`, `payload` (JSON, PII-free per existing `assertNoPii` convention), `occurred_at`, `received_at`.

**Offer exposure (W-5).** Policy decided: exposure = impression of the tier-specific offer screen, first-exposure-controls-attribution (Q-5/Q-6). Proposed shape: an `event_type = 'offer_exposed'` row in W-1's table, `payload = { tier, productId }`, with `visitor_id` server-resolved. First-exposure timestamp is the row's own `occurred_at` for the first such row per `(visitor_id, tier)`.

**Activation (W-8/W-12).** Policy decided: PO-D1 — only `Search.status = 'COMPLETE'` counts. No new table: read `searches` directly (ED-8), filtered `status = 'COMPLETE'` and `created_at`/`updated_at` within window (exact timestamp column choice is engineering detail — `searches` has both `created_at` and `updated_at`; which one represents "performed" is not fixed by PO-D1 and is carried forward as open, §7 item 5).

**Opportunity reviewed/completion (W-14/W-15).** Policy decided: ED-9 — a dedicated event, distinct from `SearchStatus` and `feedback`. Proposed shape: an `event_type = 'opportunity_reviewed'` row in W-1's table, `payload = { opportunityId }`, keyed to the authenticated `user_id` (not a pre-auth visitor id, since this is a post-purchase, authenticated action). Exact UI trigger point not confirmed (§7 item 1).

**Refund/reversal state (W-6/W-13).** Policy decided: Q-11/Q-12 — transaction-based, binary, economic finality, pre-close-only correction, idempotent via `WebhookEvent.razorpayEventId`. Proposed shape (engineering detail): either (a) a new `refund_events` table (`payment_id`, `razorpay_event_id` reused via FK to `webhook_events`, `refunded_at`, `reversed_at` nullable) or (b) a `Payment.status` transition to a new `REFUNDED` value in the existing `PaymentStatus` enum (`packages/db/prisma/schema.prisma:57`) — the choice between (a) and (b) is not fixed by ED-6 and is carried forward as open, §7 item 6.

**Immutable measurement snapshots (W-4).** Policy decided: ED-4 — explicit snapshot per gate per closed window. Proposed shape: `gate_id` (PCG-1..6), `window_start`, `window_end`, `value` (numeric or percentage), `denominator`, `numerator` (nullable for count-only gates), `computed_at`.

**Evidence bundles (W-19).** Policy decided: ED-13 — reporting layer + persisted evidence. Proposed shape: extends the snapshot row (or a sibling table keyed to it) with `contributing_row_ids` (array of source-row ids: visitor-event ids, `Payment`/`Order` ids, `Search` ids, refund-event ids, as applicable per gate) and `excluded_row_ids` (for auditability of exclusions, e.g. W-3's allowlist exclusions).

No DDL, migration, or code implementing any of the above is created by this record.

---

## 5. Gate computation contract (PCG-1 through PCG-6)

Using already-decided policy exactly; any item not actually decided is marked `ENGINEERING DESIGN REQUIRED` or `PENDING` rather than guessed.

### PCG-1 — Qualified visitors
- **Population:** all visitors, both funnel-entry paths combined (Q-2).
- **Numerator/denominator:** this is an absolute-count gate, not a rate — no denominator; the count itself is the value.
- **Eligibility:** funnel-entry + demonstrated intent only; no additional criterion (Q-1), minus W-3's allowlist exclusions.
- **Timestamp/window anchor:** rolling 30 days from each qualifying visitor's qualifying event; exact anchor event (funnel-entry vs. demonstrated-intent moment) is `ENGINEERING DESIGN REQUIRED` — not fixed by Q-1/Q-2 at the field level (§7 item 7).
- **Refund handling:** not applicable (pre-purchase gate).
- **Dual-tier handling:** not applicable (PCG-1 is shared/aggregate per Q-2, not tier-specific).
- **Insufficient-sample handling:** PDEF-4 §6.5 names an explicit floor of 500 directly (absolute-count gate; no separate PO-D2 floor applies).
- **Sample floor:** 500 (PDEF-4 §6.5, not reopened).
- **Expected output:** a count, compared against 500 for launch-blocking purposes.
- **Audit evidence required:** per W-19, the visitor-event ids contributing to the count, and the allowlist-excluded ids.

### PCG-2 — Buyers (30-day)
- **Population:** all buyers (payment-capture events) in the window (Q-3).
- **Numerator/denominator:** absolute-count gate; no denominator.
- **Timestamp/window anchor:** payment-capture timestamp (Q-3), shared with PCG-5's anchor.
- **Refund handling:** refunded buyers still count; immutable at window close (Q-4, §3 cross-cutting principle).
- **Dual-tier handling:** PDEF-4's combined-primary rule — a dual-tier buyer counts once in the combined measure and separately in per-tier diagnostics (carried forward from PDEF-4, not reopened).
- **Insufficient-sample handling:** PDEF-4 §6.5 names an explicit floor of 50 directly.
- **Sample floor:** 50 (PDEF-4 §6.5, not reopened).
- **Expected output:** a count, compared against 50.
- **Audit evidence required:** contributing `Payment`/`Order` ids.

### PCG-3A — ₹99→₹499 conversion rate
- **Population/denominator:** eligible ₹99 purchasers exposed to the ₹499 offer screen (Q-5).
- **Numerator:** of that population, those who purchased ₹499 (converting purchase), refunded or not (Q-7).
- **Timestamp/window anchor:** first exposure to the ₹499 offer screen (Q-6).
- **Refund handling:** a later-refunded qualifying or converting purchase still counts; immutable at close (Q-7).
- **Dual-tier handling:** per PDEF-4's combined-primary rule, carried forward, not reopened here.
- **Insufficient-sample handling:** NOT YET EVALUABLE below floor (Q-8 principle).
- **Sample floor:** n ≥ 100 (PO-D2, this decision chain).
- **Expected output:** a percentage ≥10% threshold check, or NOT YET EVALUABLE.
- **Audit evidence required:** contributing exposure-event ids and converting-purchase ids.

### PCG-3B — ₹1,499 conversion rate
- **Population/denominator:** users exposed to the ₹1,499 offer screen, independent of ₹499 ownership (Q-5, PDEF-2's independent-purchase rule).
- **Numerator:** of that population, those who purchased ₹1,499, refunded or not (Q-7).
- **Timestamp/window anchor:** first exposure to the ₹1,499 offer screen (Q-6).
- **Refund handling:** same as PCG-3A (Q-7).
- **Dual-tier handling:** carried forward from PDEF-4, not reopened.
- **Insufficient-sample handling:** NOT YET EVALUABLE below floor (Q-8).
- **Sample floor:** n ≥ 200 (PO-D2).
- **Expected output:** a percentage ≥5% threshold check, or NOT YET EVALUABLE.
- **Audit evidence required:** contributing exposure-event ids and converting-purchase ids.

### PCG-4 — Useful-outcome rate (monitoring-only)
- **Population/denominator:** ₹499/₹1,499 holders with ≥1 `Search` row at `status = 'COMPLETE'` in the window (Q-9, PO-D1).
- **Numerator:** of that population, those whose qualifying search produced an opportunity meeting `feedback.useful = true` **and** the ED-10 evaluator's service/customer/value match — **the exact combination logic (is it `feedback.useful` alone, the ED-10 match alone, or both conjunctively?) is `ENGINEERING DESIGN REQUIRED`**, pending the Q-10 equivalence review (§7 item 3); this record does not guess it.
- **Timestamp/window anchor:** rolling 30 days; activation timestamp column choice is `ENGINEERING DESIGN REQUIRED` (§7 item 5, data-model section).
- **Refund handling:** not applicable (PCG-4 does not read refund state).
- **Dual-tier handling:** carried forward from PDEF-4, not reopened.
- **Insufficient-sample handling:** NOT YET EVALUABLE below floor (Q-8).
- **Sample floor:** n ≥ 25 (PO-D2).
- **Expected output:** a percentage, monitored against ≥60%, never launch-blocking (PDEF-4 §6.3).
- **Audit evidence required:** contributing `searches` ids, qualification-evaluator result ids, `feedback` ids.

### PCG-5 — Refund rate (monitoring-only)
- **Population/denominator:** all transactions in the window (Q-11).
- **Numerator:** transactions with any refund amount > 0 in the window, counted once per transaction regardless of partial/full or duplicate webhook delivery (Q-11/Q-12).
- **Timestamp/window anchor:** from purchase (payment-capture), per PDEF-4 §6.6, shared with PCG-2's anchor.
- **Refund handling:** economic finality; a pre-close reversal corrects the numerator, a post-close reversal does not (Q-12).
- **Dual-tier handling:** not applicable (transaction-based, not user-based).
- **Insufficient-sample handling:** NOT YET EVALUABLE below floor (Q-8).
- **Sample floor:** n ≥ 125 (PO-D2).
- **Expected output:** a percentage, monitored against ≤8%, never launch-blocking.
- **Audit evidence required:** contributing `Payment`/refund-event ids, including reversed/duplicate-suppressed ones.

### PCG-6 — Completion rate (monitoring-only, from first activation)
- **Population/denominator:** holders who activated (per PO-D1's `COMPLETE`-status rule, same activation signal as PCG-4) — **whether PCG-6 uses the identical PO-D1 population or a separately defined one is not explicitly settled anywhere in the governing chain and is marked `ENGINEERING DESIGN REQUIRED`** (§7 item 8) rather than assumed identical to PCG-4.
- **Numerator:** holders whose "opportunity reviewed" event (ED-9/W-15) fired within the window.
- **Timestamp/window anchor:** from first activation (PDEF-3/PDEF-4, not reopened).
- **Refund handling:** not applicable (PCG-6 does not read refund state per anything decided so far; not explicitly stated either way — treated as not-applicable by analogy to PCG-4, not an independent decision).
- **Dual-tier handling:** carried forward from PDEF-4, not reopened.
- **Insufficient-sample handling:** PDEF-4 §6.5's NOT YET EVALUABLE treatment is explicitly stated (per the Instrumentation Product Owner Decision §2) to apply only to PCG-1/2 "as explicitly decided there" — **whether PCG-6 (monitoring-only, not one of the four rate-based gates named in Q-8) has any floor at all is `PENDING`**, not decided anywhere in this chain (§7 item 9).
- **Sample floor:** `PENDING` (see above).
- **Expected output:** a percentage, monitoring-only, no launch-blocking role.
- **Audit evidence required:** contributing "opportunity reviewed" event ids and activation (`searches`) ids.

---

## 6. Independent validation — design only, not implemented

Scope: PCG-1, PCG-2, PCG-3A, PCG-3B (the four hard launch blockers), per PDEF-4 §6.10 and ED-12 (Option C: both tracks).

**Deterministic fixtures (track B of ED-12).** A fixture suite, plausibly under `tests/contract/` (existing convention) or a new `tests/validation/` directory (location uncertain, §3), with hand-constructed, frozen input sets and known expected gate outputs, covering at minimum:
- **Boundary cases:** an event at exactly `window_start` (included) vs. exactly `window_end` (excluded), per the half-open convention W-7 must implement.
- **Duplicate events:** a redelivered webhook or a duplicate visitor-event write, verifying W-1's/W-6's dedup prevents double-counting.
- **Dual-tier users:** a single user/visitor with both ₹499 and ₹1,499 activity in the same window, verifying combined-primary + per-tier diagnostic counting per PDEF-4's carried-forward rule.
- **Refund/reversal cases:** a refund before window close (corrects PCG-5's numerator only — PCG-2/3A/3B are unaffected per Q-4/Q-7), a refund after window close (does not reopen any closed evaluation), and a reversed-then-re-refunded transaction (counts once, per Q-11/Q-12).
- **Rolling-window boundaries:** a window that would double-count or skip a row under a naive `<=`/`>=` boundary, verifying W-7's half-open discipline.
- **Insufficient-sample cases:** a denominator at exactly the PO-D2 floor minus one (must report NOT YET EVALUABLE) and exactly at the floor (must report the percentage).
- **Exposure-before-purchase cases:** a user exposed to the ₹499 offer who never purchases (correctly excluded from PCG-3A's numerator but present in its denominator) and a user who purchases without a recorded exposure (edge case — should not happen under Q-5's instrumentation, but the fixture suite should assert the computation does not silently fabricate an exposure for them).
- **Anonymous-to-authenticated transitions:** since ED-2 defers the merge mechanism, a fixture confirming that PCG-1 (pre-auth) and PCG-2+ (post-purchase/authenticated) never attempt to join across the unbuilt linkage, and that no gate silently assumes it exists.

**Production cross-check (track A of ED-12, = W-18).** An independently-written query (by a party distinct from the implementing engineer) over the same production window, compared against the primary aggregation's reported value, for each of PCG-1/2/3A/3B. Required evidence regardless of mechanism: the raw source rows for the window, the primary value, the independent value, and a match/mismatch record with an explanation if they differ.

**Reconciliation against production data:** the cross-check above *is* the reconciliation step; no separate mechanism is proposed beyond it, consistent with ED-12's own text.

**Who/what still needs to be authorized to perform validation:** **not decided by this or any prior record.** PDEF-4 §6.10 requires independent validation "by a party distinct from the implementing team" but leaves the specific team, role, or individual to a separate process definition. This preparation document does not name one, propose a default, or assume Claude itself may perform it — doing so would convert a process/staffing decision into a fabricated authorization, which is explicitly out of scope.

---

## 7. Unresolved blockers

1. **ED-9 UI call site.** The exact instrumentation point for the "opportunity reviewed" event is not confirmed. `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` is a strong candidate (a server-rendered opportunity detail page rendering a `FeedbackForm`), but whether the event should fire on every page render, on a specific in-page interaction, or via a dedicated server action, is not decided. **Must be resolved before W-14/W-15 implementation.**
2. **ED-12 validation ownership and retention process.** Who performs the independent production cross-check and who authors/maintains the deterministic fixture suite, and how long results are retained, is explicitly left to a separate process definition by PDEF-4 §6.10 and is not addressed by ED-12 or this record. **Must be resolved before any PCG-1/2/3A/3B result may be used for launch-qualification.**
3. **Q-10 / `core-qualification` equivalence review.** Whether `core-qualification`'s existing criteria can contribute anything to the new ED-10 evaluator, or must be entirely bypassed, is an engineering review Q-10 made a precondition of finalizing PCG-4's numerator. Not performed by this record. **Must be resolved before W-12's numerator can be finalized** (the denominator/join plumbing in W-8/W-11/W-12 can proceed independently, per ED-11's scoping).
4. **Refund contract-test `it.todo` stubs.** `tests/contract/razorpay-webhook.contract.test.ts:8–10` has three unimplemented stubs, including the refund-payload-shape one. **Must be resolved (i.e., implemented) as part of W-6**, not before it, but implementation of W-6 cannot be called complete without them.
5. **Activation-timestamp column choice (newly identified in this pass).** PO-D1 fixed the `status` filter (`COMPLETE`) but not which `searches` timestamp column (`created_at` vs. `updated_at`, i.e. "search started" vs. "search finished") represents "performed" for PCG-4/PCG-6's window anchor. This is a genuine engineering-design gap not previously flagged by ED-8 or PO-D1. **Must be resolved before W-8/W-12/W-14 can be finalized.**
6. **Refund/reversal storage shape (newly identified in this pass).** ED-6 fixed the dedup/isolation pattern but not whether refund state is a new table or a `PaymentStatus` enum extension. **Must be resolved before W-6 schema work begins.**
7. **PCG-4/PCG-6 numerator combination logic (newly identified in this pass).** Whether PCG-4's numerator requires `feedback.useful = true`, the ED-10 evaluator's match, or both conjunctively, is not stated by Q-9 or Q-10 at the level of a boolean combination rule. **Must be resolved before W-12 can be finalized**, and is contingent on blocker #3 above.
8. **PCG-6's activation population (newly identified in this pass).** Whether PCG-6 uses the identical PO-D1-defined activation population as PCG-4, or a separately defined one, is not stated anywhere in the governing chain. **Must be resolved before W-14 can be finalized.**
9. **PCG-6's sample floor (newly identified in this pass).** Q-8's NOT YET EVALUABLE principle is stated to apply to "PCG-3A and PCG-3B (hard blockers) and PCG-4 and PCG-5 (monitoring gates)" — PCG-6 is not named, and PO-D2's four floors (100/200/25/125) cover only PCG-3A/3B/4/5. Whether PCG-6 has any numeric floor at all is undecided. **Should be resolved before W-14's NOT-YET-EVALUABLE logic is finalized**, though PCG-6 is monitoring-only and non-blocking, so this is lower urgency than items 1–4.

No analyst observation above (items 5–9) has been converted into a Product Owner decision or an engineering-design adoption; each is stated as an open question only.

---

## 8. Implementation authorization boundary

**This document does not authorize implementation.**

| Layer | Status |
|---|---|
| Commercial/measurement policy (Q-1..Q-12, PDEF-2/3/4, entitlement stacking) | **Already decided.** Not reopened anywhere above. |
| Engineering design (ED-1..13, PO-D1, PO-D2) | **Already decided**, per `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`. Not reopened. |
| Engineering details still requiring decision | §7 items 1, 3, 5, 6, 7, 8, 9 (UI call site, equivalence review, timestamp column, refund storage shape, numerator combination logic, PCG-6 population, PCG-6 floor). |
| Implementation authorization | **Still required.** Not granted by this, or any prior, record. |
| Validation authorization (who performs ED-12/§6, and retention) | **Still required.** Explicitly unresolved (§7 item 2). |
| Deployment/release/launch authorization | **Still required**, and unaffected by anything above — this was already true before this task and remains true after it. |

## 9. Recommended next governance step

1. A **separate, explicitly authorized engineering-detail resolution task** should resolve §7 items 5–9 (the activation-timestamp column, refund storage shape, PCG-4/6 numerator-combination logic, PCG-6's activation population, and PCG-6's sample floor) — these are newly surfaced in this pass and are engineering-design-level, not implementation.
2. In parallel, a **separate, explicitly authorized task** should perform the Q-10 `core-qualification`/PDEF-3-condition-(b) equivalence review (§7 item 3) and confirm the ED-9 UI call site (§7 item 1) — both are investigative, not implementation.
3. Only after 1 and 2: a **separate, explicitly authorized implementation-authorization decision record** (not this one) should grant the actual authority to begin W-1 through W-19, workstream by workstream or as a single authorized batch, per whatever the Product Owner decides.
4. Independently of 1–3, a **separate process-definition decision** should resolve §7 item 2 (who performs ED-12 independent validation, and retention) before any PCG-1/2/3A/3B result may be used for launch-qualification — this does not block implementation of the instrumentation itself, only its eventual use for launch-qualification.
5. **No implementation, test-writing, migration, or validation execution should begin before step 3's explicit authorization**, regardless of how complete this preparation document is.

**This record does not perform, authorize, or recommend skipping any of steps 1–4.**

---

## Final verification (performed before reporting completion)

- HEAD unchanged: `af9ede93830f5e3e611195dc2451a470364def74`.
- 0 staged files, before and after.
- No source, test, schema, config, or dependency file modified.
- Only this preparation document created (`requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md`).
- All eleven governing-record hashes (§1) unchanged.
- No commit made. No push made.
