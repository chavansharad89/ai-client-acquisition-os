# Client Finder / PDEF-4 — Gate Evaluation Operational Wiring Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-GATE-EVALUATION-OPERATIONAL-WIRING-PREPARATION-001`
**Date:** 2026-10-05
**Type:** Read-only, engineering-design PREPARATION record. Proposes options and tradeoffs for wiring the
already-built, already-independently-validated gate-evaluation capability into something that actually runs.
**Decides nothing that is a Product Owner policy question.** Where a question is genuinely engineering-only, this
record may state a recommended default (engineering may propose), but even then no code is written and nothing is
authorized to run by this record. No implementation, schema, migration, deployment, or launch authority is
granted.

---

## 1. Baseline and the gap this record addresses

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged by this record) |
| File created by this record | this file only |

**Repository fact (confirmed by `grep -rn "evaluateAllGates\|recomputeBlockerGates" apps/ packages/`):** both
entry points are exported — `evaluateAllGates` (`packages/core-launch-gates/src/index.ts:38`) and
`recomputeBlockerGates` (`packages/core-launch-gates-validation/src/recompute.ts:117`) — and neither is called from
any file under `apps/web` or `apps/worker`. This is confirmed independently by
`requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md` §6 item 4 and §6A ("No API route or CLI
exposes `evaluateAllGates`/`recomputeBlockerGates`... Operationally inert until wired to a route, script, or
scheduled job"). The computation is implemented, unit- and real-Postgres-tested, and independently validated
against production-shaped data (§4A of that record) — but nothing in production ever calls it.

This record proposes how that wiring could be built, without building it.

---

## 2. What already exists, to build on

- `evaluateAllGates(sql, now)` (`packages/core-launch-gates/src/index.ts:38-49`) — evaluates all seven named gate
  results (PCG-1, PCG-2, PCG-3A, PCG-3B, PCG-4, PCG-5, PCG-6) against `mostRecentClosedWindow(now)` in one call,
  given a `SqlExecutor`.
- `recomputeBlockerGates(sql, now)` (`packages/core-launch-gates-validation/src/recompute.ts:117`) — the
  independent-validation recomputation for the four hard-blocker gates (PCG-1/2/3A/3B), with a differently-shaped
  SQL join per gate (ED-12).
- `diffGateResult`/`diffGateResults` — compares a production result against a validation result.
- `writeProductionSnapshot`/`writeValidationSnapshot` (`packages/core-launch-gates/src/snapshotRepository.ts`,
  referenced by `index.ts:11,33`) — persist a `gate_evaluation_snapshots` row.
- `gate_evaluation_snapshots` table (migration `0035_gate_evaluation_snapshots/migration.sql`): one row per
  `(gate, window_start, window_end, computation_path)`, `computation_path` constrained to `'PRODUCTION'` or
  `'VALIDATION'` by a `CHECK` constraint, with a **unique index on
  `(gate, window_start, window_end, computation_path)`** — re-running the same window's computation on the same
  path is idempotent at the database level: a repeat write for an already-recorded `(gate, window, path)` would
  violate the unique constraint, not silently duplicate.
- `mostRecentClosedWindow(now)`/`isClosed` (`packages/core-launch-gates/src/window.ts`, re-exported at
  `index.ts:15-16`) — the shared rolling-window boundary utility (ED-7), already used by both the production and
  validation packages.

Nothing below needs to re-derive any of this; the wiring question is purely "who calls these, how often, and where
does the result go."

---

## 3. Candidate host locations, grounded in this repository's existing patterns

Two existing architectural patterns are available, found by reading the actual route/job structure (not invented):

### 3.1 Pattern A — `apps/web` API route (request-triggered)

Example of the existing convention: `apps/web/app/api/health/route.ts` and `apps/web/app/api/ready/route.ts` are
thin `GET` handlers; `apps/web/app/api/payments/create-order/route.ts` is a `POST` handler that performs real
server-side work (calls `createOrder()`) synchronously within the request. `apps/web/middleware.ts` (new this
session, per the conformance record) already runs on a scoped matcher (`/upsell/:path*`,
`/api/payments/create-order`, `/opportunities/:path*`).

A candidate new route, e.g. `apps/web/app/api/gates/evaluate/route.ts`, could call `evaluateAllGates` (and
optionally `recomputeBlockerGates` + `diffGateResults`) synchronously inside a `POST` handler, write the
snapshot(s), and return the result. This follows the same "thin route, real work inside the handler" shape as
`create-order`'s route, not the liveness-only shape of `health`/`ready`.

### 3.2 Pattern B — `apps/worker` long-running process (schedule-triggered)

`apps/worker/src/index.ts` is explicit, in its own header comment, about this repository's chosen worker
architecture: "A long-running, in-process PostgreSQL polling loop... no queue, no broker, no separate scheduler
service." `runSearchWorkerPollLoop` (`./searchWorker`) is the existing example of this shape. `apps/worker/src/
metaEvents/worker.ts` is a second example (claim/dispatch/settle state machine, also poll-loop-based, though per
the same `index.ts` header this entrypoint is "unrelated... and remains unbuilt" as a running process today).
`apps/worker/src/dispatchers/` holds smaller, single-purpose dispatch modules (`deliveryDispatcher.ts`,
`capiDispatcher.ts`) rather than one large file.

A candidate new module, e.g. `apps/worker/src/gateEvaluation/worker.ts` (or a dispatcher under
`apps/worker/src/dispatchers/`), could run on a fixed interval (the gate window itself is already a rolling
30-day boundary, so the natural poll cadence is far coarser than the Search worker's — see §5), calling
`evaluateAllGates`/`recomputeBlockerGates` once per tick and writing snapshots.

### 3.3 Pattern C — out-of-band script / CI job (manually or CI-triggered)

`packages/core-launch-gates-validation`'s own fixture suite and `tests/integration/launch-gates-phase9.integration.
test.ts` already demonstrate the computation running against a real database outside any running server process.
A candidate script (e.g. `scripts/evaluate-gates.ts`, run via `pnpm` or a CI workflow step) could invoke the same
functions on demand or on a CI schedule (e.g. nightly), independent of either application's own runtime.

---

## 4. Synchronous vs. asynchronous evaluation — tradeoffs

| | Synchronous (Pattern A, request-triggered) | Asynchronous (Pattern B, poll loop) | Out-of-band (Pattern C, script/CI) |
|---|---|---|---|
| Latency to a fresh result | Immediate (on request) | Up to one poll interval stale | Up to one schedule interval stale |
| Load/blast-radius risk | A gate evaluation (several aggregate queries over a 30-day window) runs inside a web request's critical path unless explicitly decoupled — risks slow requests if the queries are heavy | Isolated from any user-facing request entirely | Fully isolated; no production process affected at all |
| Operational simplicity | Reuses existing route infra; no new process | Reuses existing poll-loop infra, but is a second concern inside `apps/worker`'s single process | Simplest to reason about; no long-running process; but needs its own trigger (cron, manual, CI schedule) outside this repository's existing two apps |
| Fit with "most recent closed window" semantics | A request-triggered call recomputes the same closed window repeatedly if called more than once per window — harmless given the unique-index idempotency (§2), but wasteful | A poll loop naturally fits "check once per window-ish interval," matching how the window itself only changes value once a day (`GATE_WINDOW_DAYS`-based, not request-based) | Same fit as Pattern B, decided by the CI/cron schedule instead of in-process logic |
| Precedent in this repository | `create-order` route (real synchronous server work in a request) | `runSearchWorkerPollLoop` (the only currently-running poll loop) | `launch-gates-phase9.integration.test.ts` (demonstrates the call shape, not a production trigger) |

**Engineering observation (not a recommendation imposed, but worth stating plainly):** because a gate's rolling
window only advances once per `GATE_WINDOW_DAYS`-scale boundary, not once per request, a request-triggered
synchronous route is a mismatch for *production computation* but a good fit for *on-demand manual/CI
invocation* (Pattern A can double as Pattern C's trigger if exposed behind an authenticated/internal-only route).
A poll loop (Pattern B) is the better fit for continuous, unattended operation, consistent with this repository's
stated worker architecture philosophy ("no queue, no broker, no separate scheduler service").

---

## 5. Population/window to evaluate

`evaluateAllGates(sql, now)` already evaluates exactly `mostRecentClosedWindow(now)` — the single most recently
closed rolling window, not an arbitrary range. This is a repository fact, not a design choice this record is
proposing. The only engineering-design question left open is **how often `now` is supplied** (i.e., poll/trigger
cadence), not what population the call itself covers. A cadence of once per day is a reasonable default given the
window granularity (`GATE_WINDOW_DAYS`), but the exact value is implementation detail, not a number any governing
record specifies — this record does not invent one as a requirement, only notes it as an engineering default
candidate.

---

## 6. Snapshot persistence (grounded in migration 0035's actual schema)

Already covered structurally by §2. Operationally, wiring needs to decide only:

- Whether a wired caller writes **both** `PRODUCTION` and `VALIDATION` snapshots on every run (mirroring
  `launch-gates-phase9.integration.test.ts`'s dedicated cross-check test), or only `PRODUCTION` on a fast/frequent
  cadence with `VALIDATION` run less often (e.g., only before a launch-qualification review, consistent with
  `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`'s B-2 Option 4: CI fixtures continuously, the named-role
  production cross-check specifically "before any PCG-1/2/3A/3B result is used for a launch-qualification
  decision" — not necessarily on every routine computation).
- This record flags, but does not resolve, that distinction — it is an engineering-design choice with a clear
  B-2-grounded default (run `PRODUCTION` on the routine cadence; run `VALIDATION` + diff at least once before any
  launch-qualification use, per B-2's own already-decided process), not a new policy question.

---

## 7. Idempotency — duplicate/repeated evaluation

Already enforced at the database level: migration `0035`'s unique index on
`(gate, window_start, window_end, computation_path)` makes a second write for an already-recorded
`(gate, window, path)` a constraint violation, not a silent duplicate. The wiring layer's own responsibility is
therefore narrow: either (a) catch/ignore the unique-violation as an expected "already evaluated this window" case
and treat it as a no-op success, or (b) check-then-skip before writing. Both are ordinary implementation detail;
neither requires a new decision, since the schema itself already prevents the failure mode (duplicate rows) that
idempotency logic exists to avoid.

---

## 8. What existing route/job architecture can safely host it — recommendation

Given §3's survey and §4's tradeoffs, the engineering-design recommendation (not binding, subject to Product Owner
awareness since it affects when gate data becomes available for the already-separately-gated launch-qualification
decision) is:

- **Primary:** a new `apps/worker` module (Pattern B), following the dispatcher convention
  (`apps/worker/src/dispatchers/` or a new `apps/worker/src/gateEvaluation/` directory alongside `searchWorker/`),
  run on a daily-or-coarser cadence from the same long-running process `index.ts` already starts, writing
  `PRODUCTION` snapshots routinely.
- **Secondary:** a new, internal-only `apps/web` API route (Pattern A) for on-demand/manual invocation (e.g. by an
  operator before a launch-qualification review), which can also run `recomputeBlockerGates` + `diffGateResults`
  and write a `VALIDATION` snapshot on demand — this satisfies B-2's "before any launch-qualification decision"
  requirement without forcing every routine tick to also run the heavier independent recomputation.
- **Not recommended as primary:** Pattern C (external script/CI) alone, because it introduces a scheduling
  dependency (cron/CI) external to both existing applications, when this repository's own stated architecture
  philosophy (`apps/worker/src/index.ts`'s header comment) already prefers in-process polling over an external
  scheduler for exactly this kind of recurring computation.

---

## 9. Additional tests that would be required

- A test that the new wiring's trigger (poll-loop tick, or route handler) calls `evaluateAllGates`/
  `recomputeBlockerGates` with the correct `now`/window arguments — distinct from the already-existing unit tests
  of the gate functions themselves, which do not exercise any caller.
- A test that a second invocation for an already-evaluated window does not throw unhandled and does not produce a
  duplicate row (exercising whichever idempotency handling §7 selects).
- If Pattern B is built: a test that the poll-loop tick correctly computes/consumes `mostRecentClosedWindow` once
  per cadence interval, not more often (an interval-scheduling test, analogous in spirit to the Search worker's
  own lease-fencing tests, though gate evaluation has no lease to fence since it is read-mostly).
- If Pattern A is built: an authentication/authorization test confirming the route is not publicly invocable
  (an internal/operator-only route), since it would otherwise let any caller trigger repeated database aggregate
  queries.
- An end-to-end test (extending `launch-gates-phase9.integration.test.ts`'s existing real-Postgres harness) that
  exercises the actual wired entry point (route handler or worker tick function), not just the underlying
  `evaluateAllGates` call, to close the gap the conformance record's §6A explicitly names ("Operationally
  integrated: No" for every gate-computation workstream).

---

## 10. Classification of every open question

| Question | Classification |
|---|---|
| Which pattern (A/B/C) hosts the wiring | **Engineering design** — recommendation given in §8; not a Product Owner policy question, since it does not change any gate's numerator, denominator, window, or floor. |
| Exact poll/trigger cadence (e.g., daily) | **Engineering design** — a scheduling detail; no governing record specifies a number, and none needs to. |
| Whether `VALIDATION` snapshots are written on every tick or only pre-launch-review | **Engineering design**, grounded in B-2's already-decided process (§6) — not a new policy question. |
| Idempotency handling (catch-vs-check) | **Implementation work** — ordinary code detail; the schema already prevents the underlying failure mode (§7). |
| Whether the new `apps/web` route (if built) is internal-only | **Engineering design** (should be internal-only) with a **security-adjacent implementation requirement** (actual auth mechanism) — not a Product Owner policy question. |
| New tests required | **Implementation work** (§9) — writing them is ordinary engineering, not a decision. |
| Whether wiring this at all is authorized to run against production data / affects launch timing | **Product Owner / authorization question** — **explicitly out of scope for this record.** Building the wiring is additive engineering work; *using* its output for a launch-qualification decision, or allowing it to run against live production traffic, remains gated by the same already-separate, already-NOT-AUTHORIZED deployment/release decision (`K1-10`, per `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` §8) that this record does not touch. This record proposes how the mechanism *could* be wired; it does not authorize turning it on in production. |
| PCG-4's own unresolved `TARGET_CUSTOMER_MATCH` gap | **Not this record's subject** — see `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md`. Wiring PCG-4 into a scheduled run does not change its `NOT_YET_EVALUABLE`-in-effect behavior. |
| ED-3's bot/internal exclusion | **Not this record's subject** — see `CLIENT_FINDER_PDEF_4_ED3_OPERATIONAL_INPUT_DECISION_PREPARATION.md`. Wiring the computation to run does not, by itself, implement that exclusion; whatever is wired will include internal/QA traffic until ED-3's operational inputs are supplied and its filter is built. |

---

## 11. Authority and status

This record proposes options and a grounded recommendation; it authorizes nothing. No route, worker module,
script, migration, or test described above has been created by this record. Whether to build any of Pattern A/B/C
remains a separate, future implementation-authorization decision, following the same pattern already used for
W-1 through W-16 in `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`. Deployment, release, and
launch remain explicitly unauthorized regardless of anything in this record, per that same record's §8 (K1-10
unaffected).

**Status: PREPARATION ONLY — no engineering-design selection has been ratified, and no implementation is
authorized by this record.**
