# Client Finder / PDEF-4 — Gate Evaluation Operational Wiring Engineering Design Decision Questionnaire

**Record ID:** `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-QUESTIONNAIRE-001`
**Basis:** `CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_PREPARATION.md` (used as-is; not superseded, not re-created — this questionnaire narrows its already-surveyed options to a single selection) and direct re-verification of `apps/worker/src/index.ts`, `apps/worker/src/searchWorker/pollLoop.ts`, `packages/core-launch-gates/src/index.ts`, `packages/core-launch-gates/src/snapshotRepository.ts`, and `packages/core-launch-gates-validation/src/recompute.ts` in this task.
**Type:** Engineering-design questionnaire. Decides nothing by itself — feeds the companion `..._ENGINEERING_DESIGN_DECISION.md`. No code, test, migration, route, or job has been created by this record.

This questionnaire restricts itself to the three options already named in the preparation record (Pattern A: `apps/web` route; Pattern B: `apps/worker` poll loop; Pattern C: out-of-band script/CI). No fourth architecture is proposed — none of the three is technically impossible.

---

## Q1 — Trigger mechanism

| Option | Trigger |
|---|---|
| A | Inbound HTTP `POST` to a new route, triggered by whoever/whatever calls it |
| B | `setTimeout`/interval tick inside the existing long-running `apps/worker` process, matching `runSearchWorkerPollLoop`'s shape (confirmed at `apps/worker/src/searchWorker/pollLoop.ts:33-50`: a `while (!signal.aborted)` loop with `sleep(pollIntervalMs, signal)` between iterations) |
| C | External cron/CI schedule, outside both `apps/web` and `apps/worker` |

## Q2 — Execution owner

| Option | Owner |
|---|---|
| A | `apps/web`'s Next.js server process (the same process already serving `apps/web/app/api/payments/create-order/route.ts`) |
| B | `apps/worker`'s single long-running process (confirmed: `apps/worker/src/index.ts` already constructs the Postgres `Pool` and all repositories once at startup, then calls `runSearchWorkerPollLoop`; a second poll loop would share that same process and `Pool`) |
| C | Whatever runs the script/CI job — not owned by either existing application |

## Q3 — Invocation frequency

| Option | Frequency |
|---|---|
| A | Once per inbound request (unbounded unless the caller self-limits) |
| B | Fixed interval, engineering default once per day, chosen to match the gate window's own granularity (`GATE_WINDOW_DAYS`, confirmed re-exported at `packages/core-launch-gates/src/index.ts:14`) — re-running more often than the window advances is harmless (idempotent, §Q5) but wasteful |
| C | Whatever the external schedule specifies (e.g., nightly cron) |

## Q4 — Data/readiness prerequisites

All three options share the same prerequisite, confirmed by direct read of `packages/core-launch-gates/src/index.ts:38-49`: `evaluateAllGates(sql, now)` needs only a `SqlExecutor` (a live Postgres connection) and a `Date`; it internally derives `mostRecentClosedWindow(now)` and calls all seven gate evaluators. No option requires anything the others don't — the prerequisite is "a DB connection already exists in that process," which is true in both `apps/web` and `apps/worker` today, and would need to be separately provisioned for Pattern C.

## Q5 — Idempotency behavior

Shared across all three, confirmed at the schema level (migration `0035_gate_evaluation_snapshots`): a unique index on `(gate, window_start, window_end, computation_path)` makes a repeat write for an already-recorded window a constraint violation, not a silent duplicate. Every option's wiring code must catch/ignore that specific violation (or check-then-skip) as an expected no-op. This is implementation detail, identical regardless of which pattern is chosen.

## Q6 — Failure/retry behavior

| Option | Behavior if the DB call throws |
|---|---|
| A | The request fails; the caller (operator/script) decides whether to retry. No automatic retry inside a single HTTP handler. |
| B | The poll loop's existing `while` structure (mirroring `pollLoop.ts`) naturally retries on the next tick without any special-cased retry logic — a failed tick is just absent from that interval and tried again next interval, the same pattern the Search worker already relies on for its own claim loop. |
| C | Retry is whatever the external scheduler provides (e.g., CI job re-run); nothing in-repository controls it. |

## Q7 — Snapshot persistence behavior

Confirmed: `writeProductionSnapshot` (`packages/core-launch-gates/src/snapshotRepository.ts`, re-exported at `index.ts:11,33`) is a separate call from `evaluateAllGates` itself — `evaluateAllGates` only returns `GateResult[]`, it does not persist anything (confirmed by reading `index.ts:38-49` in full: no `writeProductionSnapshot` call inside the function body). Every option's wiring code must explicitly call `writeProductionSnapshot` per result after `evaluateAllGates` returns. This responsibility is identical across A/B/C.

## Q8 — Concurrency behavior

| Option | Concurrency risk |
|---|---|
| A | Two simultaneous requests could both compute the same window concurrently; the unique index (Q5) makes the second write a no-op rather than corrupting data, but both would still run the (read-only, aggregate) queries redundantly. |
| B | A single long-running loop with one tick in flight at a time (matching `pollLoop.ts`'s own single-flight `while` structure) — no concurrent self-overlap by construction. |
| C | Depends entirely on the external scheduler's own concurrency guarantees (e.g., CI's "one job at a time" setting, if any) — not controlled by this repository. |

## Q9 — Observability

All three need the same minimum: a log line per tick/request noting window evaluated, per-gate status, and any idempotency no-op encountered. None of A/B/C has existing structured-logging infrastructure surveyed in this task beyond whatever `apps/worker`'s existing `console`-based logging (used by the Search poll loop) already provides; Pattern C additionally benefits from whatever the external CI/cron platform natively logs (job run history), which A and B do not get for free.

## Q10 — Operational complexity

| Option | Complexity added |
|---|---|
| A | One new route file + an internal-only auth check (new code) in an application that otherwise serves user-facing traffic — mixes an operational concern into the user-facing app. |
| B | One new module inside a process whose header comment (`apps/worker/src/index.ts`) already states the architectural intent ("no queue, no broker, no separate scheduler service") — this is an additive instance of the same already-chosen pattern, not a new category of infrastructure. |
| C | Requires a scheduling mechanism (cron entry or CI workflow file) that does not exist in this repository today for any purpose — net-new operational surface area outside the two applications this repository already runs. |

## Q11 — Consistency with existing repository architecture

Pattern B is the only option that reuses, rather than adds to, this repository's explicitly documented architectural choice. `apps/worker/src/index.ts`'s own header comment states the repository's worker philosophy in-file; Pattern B is a second poll loop inside that same already-chosen shape (the Meta-events worker, `apps/worker/src/metaEvents/worker.ts`, is a second precedent for "more than one concern can live in this process," though per `index.ts`'s own comment it is "unrelated... and remains unbuilt" as a running process today — i.e., not yet proof that two independently-ticking loops coexist in production, only that the pattern of multiple modules in one process is already anticipated). Pattern A would be the first instance of `apps/web` performing scheduled/periodic backend computation rather than request-driven work. Pattern C would be the first instance of any external scheduler in this repository.

## Q12 — Testability

| Option | How it would be tested |
|---|---|
| A | A route-handler unit/integration test (request in, response out), following the existing shape of tests for `create-order`'s route; plus an authorization test confirming the route is not publicly invocable. |
| B | A tick-function unit test (inject a fake clock/`SqlExecutor`, assert `evaluateAllGates` + `writeProductionSnapshot` called with the right arguments once per interval), analogous in spirit to `pollLoop.test.ts`'s existing coverage of `runSearchWorkerPollLoop`. |
| C | A script-level test (invoke the script function directly, same assertions as B) plus, separately, whatever the CI platform's own job-definition testing (if any) covers — two layers instead of one. |

All three are equally testable at the unit level; B has a directly analogous existing test file (`pollLoop.test.ts`) to model from, which A and C do not.

## Q13 — Effect on launch-readiness evidence

None of A/B/C, by itself, changes any gate's semantics, the Phase 9 scenario matrix, ED-3, or the blocker/monitoring classification. Whichever is chosen only determines whether `gate_evaluation_snapshots` starts accumulating real rows — it does not, by itself, authorize using those rows in a launch-qualification decision (that remains gated by the separate, already-not-authorized deployment/release decision `K1-10`, per `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` §8, re-confirmed by the preparation record's §10 table and not reopened here).

---

**Status: QUESTIONNAIRE ONLY — no selection has been ratified by this record. See the companion Engineering Design Decision record for the selection and its reasoning.**
