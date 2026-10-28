# Client Finder / PDEF-4 — Implementation Conformance Record

**Record ID:** `CLIENT-FINDER-PDEF-4-IMPLEMENTATION-CONFORMANCE-001`
**Date:** 2026-10-05
**Type:** Implementation conformance record, authorized under
`requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001`,
SHA-256 `af13cb82f3a34dc3be86f2be79080de54dad57291ea4fcbdf66ecdc754f4b4f2`). Documents what was actually built, not
what was planned. No deployment, release, or launch authority is claimed or implied.

Baseline HEAD: `af9ede93830f5e3e611195dc2451a470364def74` (verified at Phase 0, unchanged by this implementation —
nothing has been committed).

---

## 1. Workstream → implementation mapping

| Workstream | Status | Files |
|---|---|---|
| Phase 1 — migrations | **Done** | `packages/db/prisma/migrations/0031_funnel_events/`, `0032_order_visitor_id/`, `0033_searches_completed_at/`, `0034_refund_events/`, `0035_gate_evaluation_snapshots/`; `packages/db/prisma/schema.prisma` (`Order.visitorId`) |
| Phase 2 — visitor cookie + PCG-1 evidence (B-10/B-11a/b/c) | **Done** | `apps/web/src/server/visitor.ts`, `apps/web/middleware.ts`, `apps/web/app/api/payments/create-order/route.ts`, `packages/core-payments/src/createOrder.ts`, `orderRepository.ts` |
| Phase 3 — PCG-3A/3B exposure (ED-1/ED-5) | **Done** | `packages/core-funnel-events/*`, `apps/web/app/upsell/[productId]/page.tsx`, `apps/web/src/components/UpsellTracker.tsx` (comment only) |
| Phase 4 — `searches.completed_at` (B-5) | **Done, verified real-Postgres** | `packages/core-search/src/pgRepository.ts`, `types.ts`, `testSupport.ts`; `apps/worker/src/searchWorker/worker.test.ts`; `tests/integration/search-worker.integration.test.ts` |
| Phase 5 — refund processing (B-6/ED-6) | **Done, verified real-Postgres** | `packages/core-payments/src/refundEvents.ts`, `webhookHandler.ts`, `webhookPgStore.ts`; `tests/integration/refund.integration.test.ts` |
| Phase 6 — reviewed event (ED-9/B-1) | **Done** | `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` |
| Phase 7 — qualification-equivalence evaluator (ED-10/B-3) | **Done** | `packages/core-qualification-equivalence/*` |
| Phase 8 — gate computation (ED-4/ED-7/ED-8/ED-11) | **Done, PCG-4 isolated (see §3)** | `packages/core-launch-gates/*` |
| Phase 9 — independent validation (ED-12) | **Done — see §4 and §4A** | `packages/core-launch-gates-validation/*`, `tests/fixtures/launch-gates-fixtures.ts`, `tests/integration/launch-gates-phase9.integration.test.ts` |
| Phase 10 — tests | **Run — see §5** | — |
| Phase 11 — conformance record | **This document** | — |

---

## 2. Engineering decision (ED) / blocker-decision (B) conformance

| Decision | Implementation |
|---|---|
| ED-1 generic append-only event table | `funnel_events` (migration 0031), used by both `upsell_viewed` and `opportunity_reviewed` |
| ED-2 defer visitor↔user merge | `funnel_events.visitor_id`/`.user_id` both nullable, no merge logic written |
| ED-3 narrow bot/internal allowlist | **Implementation gap — disposition C, see §3A** |
| ED-4 explicit per-window snapshot semantics | `gate_evaluation_snapshots` (migration 0035), one row per (gate, window, computation_path) |
| ED-5 extend `upsell_viewed` with server-resolved identity | Done — server-side write in the upsell page carries `visitorId` |
| ED-6 reuse WebhookEvent dedupe, isolate refund logic | `refundEvents.ts` is its own module; dedupe via `ON CONFLICT (razorpay_refund_id) DO NOTHING` |
| ED-7 shared rolling-window boundary utility | `packages/core-launch-gates/src/window.ts`, imported (not reimplemented) by the validation package |
| ED-8 query `Search` directly for PCG-4 denominator | `pcg4.ts`'s query filters `searches` directly |
| ED-9 dedicated reviewed event, not feedback | `funnel_events` `opportunity_reviewed`, written independently of `POST /api/opportunities/[id]/feedback` |
| ED-10 standalone qualification-equivalence evaluator | `@acos/core-qualification-equivalence`, zero imports from `core-qualification`/`core-research` (verified by inspection) |
| ED-11 single joined query for PCG-4 | `pcg4.ts`'s one SQL query gathers all raw facts; per-row evaluation happens in TS (the evaluator is pure, not SQL) |
| ED-12 production cross-check + fixtures | Cross-check (`diff.ts`) implemented; fixture suite now also includes a **real-Postgres, deterministic scenario suite** (`tests/integration/launch-gates-phase9.integration.test.ts`) — see §4A |
| ED-13 reconciliation-style reporting + evidence persistence | `gate_evaluation_snapshots` + `writeProductionSnapshot`/`writeValidationSnapshot` |
| B-1 reviewed event, first-view-only, deduplicated | Partial unique index (migration 0031) on `(event_name, user_id, subject_id)` |
| B-3 qualification input: search snapshot only | `SearchSnapshot` type; no import from `core-research`/`core-qualification` |
| B-4 behavioral test scope | Unit tests across all new/changed packages (see §5); real-Postgres tests for Phases 4 and 5 specifically |
| B-5 `completed_at`, reuse lease/idempotency semantics | `completeClaimed()`'s existing `WHERE` clause unchanged; only `SET` extended |
| B-6 `refund_events`, reuse WebhookEvent dedupe | Done |
| B-7 useful outcome conjunctive | `pcg4.ts`: `row.feedback_useful === true && result.match === true` |
| B-8 PCG-6 numerator/denominator | `pcg6.ts`: numerator = B-1 population, denominator = B-5/PCG-1 population (not "exposure") |
| B-9 no sample floor | `buildCountResult`/`buildRatioResult`: `NOT_YET_EVALUABLE` only on an unclosed window or zero denominator |
| B-10 new first-party cookie, not `_fbp` | `acos_visitor` cookie, `apps/web/middleware.ts` + `visitor.ts` |
| B-11a/b/c PCG-1 evidence = Order itself | `pcg1.ts` reads only `orders`; `funnel_events` is never touched for PCG-1 |

---

## 3. PCG-4 — isolated, unresolved dependency

**Status: NOT YET EVALUABLE.** During implementation, the `TARGET_CUSTOMER_MATCH` criterion inside the
qualification-equivalence evaluator was found to have no authorized data source (no field on `opportunities`,
`prospects`, or `companies` independently records a target-customer determination outside the excluded
category-plausibility mechanism). Per the Product Owner's 2026-10-05 ruling:

- `TARGET_CUSTOMER_MATCH` correctly resolves to `'UNKNOWN'` (fail-soft) under current wiring.
- The evaluator's precedence rule (`anyFalse ? false : anyUnknown ? 'UNKNOWN' : true`) means `match` can be
  `false` or `'UNKNOWN'`, never a clean `true`, while this is unresolved.
- `pcg4.ts`'s numerator is therefore structurally non-positive for every window until the dependency is resolved.
  This is deliberate, tested behavior, not a defect.
- `TARGET_CUSTOMER_MATCH` was **not** trivially satisfied and was **not** removed from the evaluator, per explicit
  instruction.
- A decision-preparation record (preparation only, no option selected) was created:
  `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md`.
- All other gates (PCG-1, PCG-2, PCG-3A, PCG-3B, PCG-5, PCG-6) are unaffected — confirmed by their own passing,
  independent test files (`window.test.ts`, `ratio.test.ts`, and PCG-4's own `pcg4.test.ts`, all of which pass).

---

## 3A. ED-3 (bot/internal-traffic exclusion) — disposition

**Addendum, 2026-10-05 (this pass).** The engineering design for ED-3 is already decided — Option B, "a narrow,
known-identifier allowlist (internal IPs, known QA/test accounts), applied against ED-1's event store"
(`requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` §7, row ED-3). What was
evaluated this pass is not "what should ED-3 do" (already answered) but which of the four dispositions applies to
its *implementation* state:

- **(A) already satisfied** — no. `grep` across `packages/core-launch-gates/src/*.ts` confirms no PCG-1/2/3A/3B/6
  population query filters by visitor id, user id, IP, or any identifier allowlist.
- **(B) currently unnecessary because no relevant traffic path exists** — no. The data-collection routes that
  populate the tables ED-3 would need to filter (`apps/web/app/api/payments/create-order/route.ts`,
  `apps/web/app/upsell/[productId]/page.tsx`'s `UpsellTracker`) are live application code paths, independent of
  whether any gate is ever read. An internal/QA visitor exercising those routes today is written into `orders`,
  `payments`, and `funnel_events` exactly like any other visitor, with no marker distinguishing them after the
  fact — the absence of exclusion is a property of the data as collected, not only of "nobody reads gates yet."
- **(C) remains an implementation gap** — **yes, this is the disposition.** The mechanism is designed but not
  built, and the gap is real today regardless of operational integration status (§6 below): if `evaluateAllGates`
  were wired up tomorrow with no further code change, every PCG-1/2/3A/3B/6 count would include any internal/QA
  traffic that happened to flow through the live routes in the interim.
- **(D) a new Product Owner decision is required** — no, **not for the mechanism itself.** Option B was already
  adopted under the Product Owner's delegated engineering-design authority. What is missing is not a design
  decision but an **operational input**: the actual list of internal IP ranges and/or known QA/test account
  identifiers to populate the allowlist with. No such list exists anywhere in this repository today, and this
  record does not invent one — inventing placeholder identifiers would produce a mechanism that silently excludes
  nothing (identical in effect to today's no-op) while *appearing* implemented, which is a worse state than the
  honest "not yet built" this record states. Building the filter function itself (empty allowlist, explicitly
  inert) without that input would be scope creep on this authorization and was not attempted.

**Net:** ED-3 is correctly characterized as **a documented, designed-but-unimplemented gap, not a blocker requiring
a new PO ruling** — it requires an operational data input (the actual allowlist contents) before the already-decided
mechanism can be built. This is unchanged from, and simply makes explicit, what §6 item 3 already flagged.

---

## 4. Independent validation (ED-12) — honest scope statement

**What was built:** `@acos/core-launch-gates-validation` independently recomputes PCG-1, PCG-2, PCG-3A, and PCG-3B
(the four gates requiring pre-launch independent validation) using SQL written fresh — different join shape,
different derivation for PCG-3A/3B's first-exposure count (it does not trust the dedupe-index assumption the
production query relies on) — importing only the shared `mostRecentClosedWindow`/`isClosed` axiom from the
production package, never its population logic. `diffGateResult`/`diffGateResults` compare production vs.
validation snapshots.

**What was NOT built, and is a real gap:** the plan's Phase 9 called for a deterministic, real-Postgres fixture
suite covering all ~16 named scenarios (normal funnel, duplicate events, dual-tier user, refunded buyer, partial
refund, refund reversal, window boundary, closed-window immutability, insufficient sample, first exposure, repeated
exposure, anonymous→identified visitor, bot/internal exclusion, incomplete search, reviewed-but-not-useful,
useful-but-mismatch, useful+match). What exists today is a **unit-level** test suite (`diff.test.ts`, fake
`GateResult` objects) proving the diff mechanism itself is correct, plus real-Postgres proof that the underlying
Phase 4/5 instrumentation (`completed_at`, `refund_events`) works. **The full fixture suite exercising
`recomputeBlockerGates` end-to-end against seeded real-Postgres data for all 16 scenarios was not written in this
session.** Per the authorization record's own instruction ("Do not claim independent validation is complete merely
because tests pass"), this record states plainly: **independent validation is implemented but not yet proven
against the full scenario matrix.** This is the single largest remaining item before PCG-1/2/3A/3B could be
considered launch-qualification-ready.

---

## 4A. Phase 9 closure — real-Postgres deterministic fixture suite (this pass)

**Addendum, 2026-10-05.** The gap §4 describes is closed. `tests/integration/launch-gates-phase9.integration.test.ts`
(16 tests, new this pass, with seed/cleanup helpers in `tests/fixtures/launch-gates-fixtures.ts`, also new) exercises
`evaluatePcg1`/`evaluatePcg2`/`evaluatePcg3a`/`evaluatePcg3b`/`evaluatePcg4`/`evaluatePcg5`/`evaluatePcg6`/
`evaluateCombinedTierConversion` from `@acos/core-launch-gates` and `recomputeBlockerGates` from
`@acos/core-launch-gates-validation` end-to-end against a real, ephemeral Postgres database (`suiteDatabase`,
the same per-suite-temp-database harness `refund.integration.test.ts`/`search-worker.integration.test.ts` use),
seeding `orders`, `payments`, `funnel_events`, `users`, `service_profiles`, `searches`, `companies`, `prospects`,
`opportunities`, `feedback`, and `refund_events` directly.

**Methodology (per the authorization's "independent validation logic, not the evaluator asserting its own output"
instruction):** every assertion is against a number hand-derived from what the test seeds (e.g. "3 orders seeded
inside the window boundary → expect numerator 3"), not against the evaluator's own return value compared to
itself. Separately, the same seeded data is run through BOTH the production path (`@acos/core-launch-gates`) and
the independent validation path (`@acos/core-launch-gates-validation`'s fresh, differently-shaped SQL), and
`diffGateResults` is asserted to report a full match — this is the first time ED-12's cross-check has been proven
against real seeded data rather than fake `GateResult` objects (`diff.test.ts`'s prior unit-level scope).

**Scenario coverage** (conformance record §4's 16-item list):

| Scenario | Covered | Where |
|---|---|---|
| PCG-1 | Yes | `PCG-1 — demonstrated-intent population` |
| PCG-2 | Yes | `PCG-2 — payment-capture population, immutable after refund` |
| PCG-3A | Yes | `PCG-3A / PCG-3B — tier exposure-to-purchase conversion` |
| PCG-3B | Yes | same describe block |
| PCG-4 | Yes | `PCG-4 — activation-to-useful-and-qualified conversion` |
| PCG-5 | Yes | `PCG-5 — refund rate (monitoring), reversal/binary treatment` |
| PCG-6 | Yes | `PCG-6 — reviewed rate (monitoring)` |
| Dual-tier users | Yes | "a dual-tier user ... counts independently in each tier AND once in the combined figure" |
| Duplicate events | Yes | "duplicate upsell_viewed events ... dedupe to a single first-exposure row" |
| Refund / reversal | Yes | PCG-5's partial-then-full test; PCG-2's "unaffected by a later refund" test |
| Rolling-window boundaries | Yes | PCG-1's "window.start is inclusive, window.end is exclusive" (±1ms on both edges) |
| Insufficient sample / zero-denominator / NOT-YET-EVALUABLE | Yes | PCG-1 unclosed-window test; PCG-3A/PCG-4 zero-denominator tests |
| Negative / boundary cases | Yes | PCG-4's "excluded from the denominator" test (RUNNING status; completed_at outside window) |
| Expected-vs-actual gate results | Yes | every test asserts a hand-computed number, plus the dedicated "production vs. independent recomputation" describe block |
| Anonymous→identified visitor | **N/A, not a Phase 9 gap** | ED-2 (visitor↔user merge) is deliberately deferred, no implementation exists to exercise — see engineering design decision §7 row ED-2 |
| Bot/internal exclusion | **N/A, not a Phase 9 gap** | ED-3 is not implemented — see §3A above; there is no mechanism in production code for a fixture to exercise |

**Evidence persistence (ED-13):** a dedicated test writes both a `PRODUCTION` and a `VALIDATION`
`gate_evaluation_snapshots` row for the same (gate, window) via `writeProductionSnapshot`/`writeValidationSnapshot`,
confirms both are independently readable, and confirms re-running the same computation is idempotent (migration
0035's unique index), not a duplicate-row accumulator — the "persist or produce the evidence" instruction for this
pass.

**Result:** 16/16 passing against real Postgres (`pnpm --filter @acos/tests exec vitest run --config
integration/vitest.config.ts integration/launch-gates-phase9.integration.test.ts`). §4's "not yet proven against
the full scenario matrix" statement is superseded by this addendum for PCG-1/2/3A/3B/4/5/6 and the combined-tier
figure; the two N/A items above remain exactly as deferred/unimplemented as the engineering design record already
states, and are not reclassified as validated.

**What this does NOT change:** PCG-4's numerator is still structurally zero (§3, confirmed again directly by this
suite's own PCG-4 scenario — a reviewed, useful, service/value-matching opportunity still produces numerator 0,
denominator 1, because `TARGET_CUSTOMER_MATCH` resolves to `'UNKNOWN'`). Independent validation proving the
*mechanism* computes correctly is not the same claim as "PDEF-4 is launch-qualification-ready" — see §7.

---

## 5. Tests run and results

Environment: Docker available; `acos_postgres_test` (port 5433) was already running and reachable, so real-Postgres
integration tests were executed, not merely written.

| Suite | Result |
|---|---|
| `packages/core-funnel-events` (typecheck, lint, unit) | Pass — 5/5 tests |
| `packages/core-qualification-equivalence` (typecheck, lint, unit) | Pass — 8/8 tests |
| `packages/core-launch-gates` (typecheck, lint, unit) | Pass — 16/16 tests |
| `packages/core-launch-gates-validation` (typecheck, lint, unit) | Pass — 6/6 tests |
| `packages/core-search` (typecheck, unit) | Pass — 17/17 tests |
| `packages/core-payments` (typecheck, lint, unit) | Pass — 89/89 tests |
| `apps/worker` (typecheck, unit) | Pass — 231/231 tests (includes two new `completedAt` tests) |
| `apps/web` (typecheck, lint, unit) | Pass — 198/198 tests (includes opportunity-page test with new mocks) |
| `tests/integration` — `search-worker.integration.test.ts` (real Postgres) | Pass — 7/7, including new `completedAt` assertion |
| `tests/integration` — `refund.integration.test.ts` (real Postgres, new) | Pass — 7/7 |
| `tests/integration` — webhook/entitlements/retention/boundary/route suites (real Postgres, regression check) | Pass — 58/58 + 20/20 entitlements |
| `tests/integration` — full suite (real Postgres) | 563 passed / 29 failed / 7 skipped / 19 todo, across 51 files |

**On the 29 failures:** they are confined to `personalization.integration.test.ts`,
`outreach-preparation.integration.test.ts`, `followup-preparation.integration.test.ts`, and
`meta-event-worker.concurrency.test.ts` — none of which this session touched (verified via `git log` on those
files: last changed in pre-existing `phase21`/`phase22` commits, not this session). `meta-event-worker.concurrency.test.ts`
connects directly to the **persistent** `acos_test` database via `DATABASE_URL` rather than the harness's per-suite
temp database, and depends on `prisma migrate deploy` having been run against it — it was never run in this
session (Prisma's query-engine download is blocked in this environment, per `orderRepository.ts`'s own
documented note), so `meta_events does not exist` there is an environment-setup gap, not a regression. The
`personalization`/`outreach-preparation`/`followup-preparation` failures (`QUALIFIED` vs `NOT_QUALIFIED` mismatches)
touch `core-qualification`/`core-research`/`core-personalization`, none of which this session modified. These are
reported here for completeness, not fixed — fixing pre-existing, unrelated failures is out of this authorization's
scope (CLAUDE.md "Task Boundaries": record, don't fix).

`pnpm db:migrate:dev` was not run against a separate scratch database via Prisma CLI (blocked in this environment,
as above); migrations 0031–0035 were instead proven to apply cleanly by the fact that every one of the 51
integration-test files above built a fresh temp database from the full migration chain (`pgIndexHarness.ts` applies
every `migration.sql` in numeric order) and the suites that exercise the new tables passed.

Independence check (per the plan's verification section): confirmed by inspection —
`packages/core-qualification-equivalence` has zero imports from `@acos/core-qualification` or `@acos/core-research`;
`packages/core-launch-gates-validation` imports only `mostRecentClosedWindow`/`isClosed`/`buildCountResult`/
`buildRatioResult` (shared axioms) from `@acos/core-launch-gates`, never its population-query functions.

### 5A. Re-verification, this pass (2026-10-05, Phase 9 closure)

| Suite | Result |
|---|---|
| `tests/integration/launch-gates-phase9.integration.test.ts` (new, real Postgres) | Pass — 16/16 tests |
| `tests/fixtures/launch-gates-fixtures.ts`, the new test file — typecheck (`tests` package) | Pass — no errors |
| `tests/fixtures/launch-gates-fixtures.ts`, the new test file — lint | Pass — no errors or warnings |
| `packages/core-launch-gates` (typecheck, lint, unit) | Pass — 16/16 tests (re-run, unchanged) |
| `packages/core-launch-gates-validation` (typecheck, lint, unit) | Pass — 6/6 tests (re-run, unchanged) |
| `packages/core-qualification-equivalence` (typecheck, lint, unit) | Pass — 8/8 tests (re-run, unchanged) |
| `packages/core-funnel-events` (typecheck, lint, unit) | Pass — 5/5 tests (re-run, unchanged) |
| `tests/integration` — full suite (real Postgres), re-run after adding Phase 9 | 541 passed / 20 failed / 7 skipped / 13 todo, across 48 files |

**On the full-suite re-run's count change from §5's original 563/29/7/19 across 51 files:** the file count moved
from 51 to 48 for reasons unrelated to this pass (pre-existing suites/dirs present at the original session's run
that are not present in `tests/integration/*.test.ts` today, independent of anything added here), plus the one new
Phase 9 file. The failing tests are the **same four pre-existing files** named in §5
(`personalization.integration.test.ts`, `outreach-preparation.integration.test.ts`,
`followup-preparation.integration.test.ts`, `meta-event-worker.concurrency.test.ts`, 20 tests total this run), **plus
one additional file surfaced this pass with the identical root cause as `meta-event-worker.concurrency.test.ts`**:
`create-order.integration.test.ts` fails its entire suite (`relation "orders" does not exist`, 7 tests reported as
skipped rather than failed because its own `beforeAll` throws first). Direct inspection
(`docker exec acos_postgres_test psql -U acos_test -d acos_test -c '\dt'`) confirms the persistent `acos_test`
database has **zero tables** — migrations were never applied to it in this environment, the same documented,
pre-existing gap §5 already attributes to `meta-event-worker.concurrency.test.ts` (both files connect directly to
that persistent database via `DATABASE_URL` rather than the harness's per-suite ephemeral database). `git log -1`
on all five failing files confirms none were touched by this session or by the prior session that produced §5 —
this is not a regression this pass introduced, only a previously-undercounted instance of the same gap. None of
these failures were modified to force a pass, per the authorization's explicit instruction.

Migrations 0031–0035 applying cleanly is reconfirmed the same way as §5: `launch-gates-phase9.integration.test.ts`'s
own `suiteDatabase('gates_phase9')` call builds a fresh temp database from the full migration chain before any of
its 16 tests run, and all 16 pass.

---

## 6. Residual risks / explicitly unimplemented items

1. **PCG-4 is NOT YET EVALUABLE** pending the Product Owner decision in
   `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md` (§3). **Unchanged by this pass** —
   §4A's new fixture suite directly re-confirms numerator stays 0 even for an otherwise-qualifying opportunity.
2. ~~ED-12's full 16-scenario real-Postgres fixture suite is not built~~ — **closed this pass, see §4A.** 14 of the
   16 named scenarios are now covered end-to-end against real Postgres; the remaining 2 (anonymous→identified
   visitor, bot/internal exclusion) are N/A because the underlying mechanisms (ED-2, ED-3) are deliberately
   deferred/unimplemented, not because Phase 9 left them untested.
3. **ED-3 (bot/internal exclusion allowlist) is not implemented** — disposition and reasoning now recorded in full
   at §3A (disposition C: an implementation gap, not a pending PO decision — it needs an operational input, a real
   allowlist of internal/QA identifiers, that does not exist in this repository). No gate currently filters by
   identifier, so a known-internal/test visitor or order is counted like any other. Low risk at current scale, but
   a real gap before launch-qualification use of PCG-1/2/3A/3B.
4. **No API route or CLI exposes `evaluateAllGates`/`recomputeBlockerGates`** — reconfirmed this pass by direct
   `grep` (§7 below): the packages are built and tested but nothing in `apps/web`/`apps/worker` calls them yet.
   Operationally inert until wired to a route, script, or scheduled job.
5. `middleware.ts` is new infrastructure (no `middleware.ts` existed in this repository before this session) —
   scoped narrowly to `/upsell/:path*`, `/api/payments/create-order`, `/opportunities/:path*`, but its matcher
   should be reviewed against actual route structure before relying on it in production (e.g. confirm the
   `(client-finder)` route group's `/opportunities/*` paths are exactly what the matcher pattern catches).
6. Pre-existing, unrelated integration-test failures (§5, §5A) are documented but not investigated or fixed —
   5 files, 20 failing tests + 1 suite-level setup failure (7 tests reported skipped), all attributable to two
   causes unrelated to this authorization's scope: (a) a persistent test database missing migrations
   (`create-order.integration.test.ts`, `meta-event-worker.concurrency.test.ts`), and (b) pre-existing
   `core-qualification`/`core-research`/`core-personalization` logic this session never touched
   (`personalization`/`outreach-preparation`/`followup-preparation`).

---

## 6A. Implementation conformance matrix

Per-dimension status — implemented, tested, independently validated, and operationally integrated are tracked
separately on purpose (§6A is this pass's direct answer to "do not collapse these into one complete label").

| Workstream | Implemented | Tested | Independently validated | Operationally integrated | Status |
|---|---|---|---|---|---|
| Phase 1 — migrations (0031–0035) | Yes | Yes (every integration suite applies the full chain) | N/A (schema, not computed logic) | Yes (schema is live in every environment the chain is applied to) | **Done** |
| Phase 2 — visitor cookie + PCG-1 evidence | Yes | Yes (unit + integration) | N/A | Partial — code paths exist (`create-order` route, middleware) but nothing *reads* PCG-1 in production (see "gate evaluation" row below) | **Implemented, not operationally read** |
| Phase 3 — PCG-3A/3B exposure events | Yes | Yes | N/A | Same as above | **Implemented, not operationally read** |
| Phase 4 — `searches.completed_at` | Yes | Yes, incl. real-Postgres | N/A | Yes — `completeClaimed()` writes it in the real worker path | **Done, live** |
| Phase 5 — refund processing | Yes | Yes, incl. real-Postgres | N/A | Partial — `refund_events` table + insert path exist; whether a real Razorpay refund webhook is wired to call it depends on `webhookHandler.ts`'s `SUPPORTED_EVENTS` (out of this record's re-verification scope this pass) | **Implemented** |
| Phase 6 — reviewed event | Yes | Yes | N/A | Yes — written from the live opportunity-review page | **Done, live** |
| Phase 7 — qualification-equivalence evaluator | Yes | Yes (unit) | N/A (pure function, no separate validation path defined for it) | Yes — called from `pcg4.ts` | **Done** |
| Phase 8 — gate computation (PCG-1..6) | Yes | Yes (unit + §4A real-Postgres) | **Yes, this pass (§4A)** — production vs. independent recomputation diffed on real seeded data, full match | **No** — `evaluateAllGates` is exported but not called from any `apps/web`/`apps/worker` route, script, or job (confirmed by `grep -rn "evaluateAllGates\|recomputeBlockerGates"` outside the packages themselves: zero call sites) | **Implemented + independently validated, NOT operationally integrated** |
| Phase 9 — independent validation (ED-12) | Yes | **Yes, this pass (§4A)** — 16/16 real-Postgres scenario tests | Yes (same suite proves production↔validation agreement) | N/A (a validation harness, not a production feature) | **Done** |
| PCG-4 specifically | Yes (evaluator + query) | Yes | Yes (§4A directly re-confirms numerator=0 behavior) | No (same as Phase 8) | **Implemented, correctly gated NOT YET EVALUABLE pending a PO decision outside this record's scope (§3)** |
| ED-3 (bot/internal exclusion) | **No** | N/A | N/A | N/A | **Implementation gap — disposition C (§3A)** |
| ED-2 (visitor↔user merge) | **No, by design (deferred)** | N/A | N/A | N/A | **Deliberately deferred, not a gap** |

**Reading this matrix:** "Operationally integrated" is No for every gate-computation workstream. This means the
entire PDEF-4 gate-evaluation capability — however well-implemented and however well-validated by §4A — currently
computes nothing in production: no cron job, API route, or CLI script calls `evaluateAllGates` or
`recomputeBlockerGates` anywhere in `apps/web` or `apps/worker`. "Independently validated" being Yes for Phase 8/9
is a claim about the correctness of the computation given real data, not a claim that the computation is currently
running anywhere live.

---

## 7. Authority and status

Deployment, release, production traffic, and launch remain unauthorized and were not attempted. No code was
committed or pushed (see final session report for exact git status). This record does not claim PDEF-4 is
launch-ready; §3 and §4 explicitly state it is not.

**Addendum, 2026-10-05 (this pass):** this pass's own work — Phase 9's real-Postgres fixture suite, the ED-3
disposition analysis, and this document's edits — stayed strictly within analysis, test-writing, and
documentation. No production/billing/entitlement logic, gate semantics, or PCG-4 wiring was changed; `pcg4.ts`,
`pcg1.ts`–`pcg6.ts`, `combined.ts`, `recompute.ts`, and `diff.ts` are byte-for-byte unmodified from the state §1–§6
already described (confirmed: this pass's `git status` touches only `tests/package.json` (two new workspace
dependency lines) and two new files, `tests/fixtures/launch-gates-fixtures.ts` and
`tests/integration/launch-gates-phase9.integration.test.ts`). Nothing was deployed, released, launched, committed,
or pushed. PDEF-4 is **not** declared fully implementation-conformant by this addendum: §3's PCG-4 NOT YET EVALUABLE
status, §3A's ED-3 implementation gap, and §6A's "operationally integrated: No" finding for every gate-computation
workstream all remain open items a future authorization would need to address before launch-qualification use.
