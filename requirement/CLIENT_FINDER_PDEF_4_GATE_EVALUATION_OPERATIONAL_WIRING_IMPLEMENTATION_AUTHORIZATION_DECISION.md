# Client Finder / PDEF-4 — Gate Evaluation Operational Wiring Implementation Authorization Decision

**Record ID:** `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001`
**Date:** 2026-10-05
**Decision authority:** Exercised under **delegated authority by Claude**, explicitly authorized by the human user for this single task. **This is an AI-exercised delegated decision and is not represented as a human Product Owner decision.** It does not reopen, reinterpret, or alter the substance of any prior Product Owner or Engineering decision cited below.
**Scope:** Implementation authorization record only. Does **not** itself implement code, create migrations, or write tests. Does **not** authorize deployment, release, launch, or production rollout.

---

## 0. Governing chain (read-only; cited, not restated or altered)

| # | File | Record ID |
|---|---|---|
| 1 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_PREPARATION.md` | `CLIENT-FINDER-PDEF-4-GATE-EVALUATION-OPERATIONAL-WIRING-PREPARATION-001` |
| 2 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md` | `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-QUESTIONNAIRE-001` |
| 3 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION.md` | `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-DEC-001` (**the selected architecture this record authorizes building**) |
| 4 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` | `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-PREP-001` (**primary input to this record**) |
| 5 | `requirement/CLIENT_FINDER_PDEF_4_FINAL_READINESS_AUDIT.md` | — |
| 6 | `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | — (K1-10, Q10 — unaffected, re-confirmed not reopened) |
| 7 | `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (W-1..W-16, structural precedent) | — |

All seven were treated as binding and read-only. None was modified. No prior PO or Engineering decision's substance is restated beyond the minimum needed to cite it; none is altered.

---

## 1. Authorization status by workstream

| Workstream | Status |
|---|---|
| **Worker side — Pattern B (primary)** | |
| New module `apps/worker/src/gateEvaluation/` (tick function + poll-loop wrapper, modeled on `searchWorker/worker.ts` + `searchWorker/pollLoop.ts`) | **Authorized** |
| Construction/wiring from `apps/worker/src/index.ts` (new deps built, second loop started alongside `runSearchWorkerPollLoop`, sharing the existing `Pool` and `shutdown.signal`) | **Authorized** |
| Invocation of `evaluateAllGates(sql, now)` (already-existing function, unmodified) | **Authorized** (call site only — no change to the function itself) |
| `writeProductionSnapshot` call per `GateResult` after each tick (already-existing function, unmodified) | **Authorized** (call site only) |
| Configured cadence (engineering default: once per day, per ED-DEC-001 §3 item 2) | **Authorized** |
| Retry-on-next-tick behavior (no explicit backoff logic; a failed tick is retried next interval) | **Authorized** |
| No-overlapping-executions guarantee (single in-process loop, one tick in flight at a time) | **Authorized** |
| Idempotency handling (catch migration-0035's unique-violation as an expected no-op) | **Authorized** |
| Required logging (window evaluated, per-gate status, idempotency no-ops) using `apps/worker`'s existing console-based logging style | **Authorized** |
| Unit test(s) for the tick function | **Authorized** |
| Real-Postgres integration test extending `launch-gates-phase9.integration.test.ts`'s harness, exercising the actual tick function | **Authorized** |
| **Validation side — Pattern A (secondary)** | |
| New internal-only route `apps/web/app/api/gates/evaluate/route.ts`, `VALIDATION` mode only (`recomputeBlockerGates` + `diffGateResults`, writes a `VALIDATION` snapshot) | **Conditionally authorized — see §2** |
| Route authentication/authorization mechanism | **Not authorized to be invented by this record — see §2** |
| Route-handler tests (behavior + authorization-rejection test) | **Conditionally authorized — see §2** |
| **Explicitly out of scope** | |
| Any change to PCG-1..6 semantics, thresholds, or blocker/monitoring classification | **Not authorized** |
| Any change to PCG-4 `TARGET_CUSTOMER_MATCH` semantics | **Not authorized** |
| Any migration (migration 0035's `gate_evaluation_snapshots` schema already exists; no new migration is needed) | **Not authorized** — if implementation discovers an actual schema gap genuinely required by ED-DEC-001's already-selected design, see §6 stop conditions |
| ED-3 allowlist implementation | **Not authorized** |
| Usage-metering changes | **Not authorized** |
| Any change to `packages/core-qualification-equivalence/**` | **Not authorized** |
| New external scheduler/CI infrastructure | **Not authorized** |
| Deployment, release, rollout, launch | **Not authorized** |
| Billing/entitlement changes | **Not authorized** |
| Changes to launch criteria (`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`) | **Not authorized** |

---

## 2. The Pattern A route's conditional authorization — exact condition

Per `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-PREP-001` §3–§4.1: no existing repository pattern for internal-only/operator-only route access exists today (confirmed by direct grep and by reading `apps/web/middleware.ts` in full, which performs only visitor-cookie minting, no auth). Per this task's explicit instruction, this record does **not** invent an authentication architecture to fill that gap.

**Exact condition:** the Pattern A route's handler code, and its tests, **may not be written** until a separate, narrow, bounded decision fixes the exact internal-authentication mechanism (e.g. a static shared-secret header checked against an environment variable, a session-based admin-role check, or an equivalent narrow choice) for this one route. That follow-up decision is explicitly **not** a Product Owner policy question (it changes no gate semantics) and is explicitly **not** this record's to make, per the task's instruction not to silently introduce a new auth architecture.

**What §5's exact next engineering task resolves this.** Until that decision exists, Pattern A's authorization in §1 above is a conditional grant of *scope*, not a present grant to begin writing code.

**Pattern B carries no such condition** — it is unconditionally authorized per §1, since it runs inside `apps/worker`, a process with no inbound HTTP surface, and therefore has no authentication question at all.

---

## 3. Authorized file/package scope

**New files (authorized to create — Pattern B, unconditional):**
- `apps/worker/src/gateEvaluation/worker.ts` (tick function: calls `evaluateAllGates` then `writeProductionSnapshot` per result, catches the migration-0035 unique-violation as a no-op)
- `apps/worker/src/gateEvaluation/pollLoop.ts` (loop wrapper, modeled on `searchWorker/pollLoop.ts`: injectable `now`, injectable `sleep`, a day-scale `pollIntervalMs`-equivalent)
- `apps/worker/src/gateEvaluation/pollLoop.test.ts` (or equivalent unit-test file name, consistent with this directory's nearest existing convention)
- A real-Postgres integration test extending `tests/integration/launch-gates-phase9.integration.test.ts` (new `describe` block in that file, or a new sibling file — left to implementation)

**New files (authorized to create only once §2's condition is met — Pattern A):**
- `apps/web/app/api/gates/evaluate/route.ts`
- A route-handler test file (path mirroring `apps/web/app/api/payments/create-order/route.ts`'s existing test-file convention)

**Modified files (authorized to modify):**
- `apps/worker/src/index.ts` — construct the new gate-evaluation deps, start the new loop alongside `runSearchWorkerPollLoop`, sharing the existing `pool` and `shutdown.signal`

**Explicitly out of scope (no file in these locations may be touched under this authorization):**
- `packages/core-launch-gates/src/pcg1.ts` through `pcg6.ts` and `index.ts`'s gate-evaluation logic itself — `evaluateAllGates` is called, not modified
- `packages/core-launch-gates/src/snapshotRepository.ts` — `writeProductionSnapshot`/`writeValidationSnapshot` are called, not modified
- `packages/core-launch-gates-validation/src/recompute.ts`, `diff.ts` — `recomputeBlockerGates`/`diffGateResults` are called, not modified
- `packages/core-qualification-equivalence/**`
- `packages/db/prisma/migrations/**` (no new migration; migration 0035's schema is reused as-is)
- Any PDEF-4 `requirement/*.md` governing record

---

## 4. Validation evidence authorized

The following real-Postgres integration tests are authorized, to prove:
- The worker loop invokes gate evaluation (`evaluateAllGates`) on each tick.
- A `PRODUCTION` snapshot is persisted (`writeProductionSnapshot`) after each tick.
- Repeated ticks for the same already-evaluated window are idempotent — no duplicate row, no unhandled exception.
- A failure during one tick (simulated, e.g. a forced query error) does not crash the host process and is retried successfully on a subsequent simulated tick.
- No two ticks evaluate concurrently (single-flight, by construction of the loop structure — a test asserting this is authorized, though it may be a structural/unit-level assertion rather than a true-concurrency integration test, consistent with Pattern B having "no self-overlap by construction").
- (Conditional on §2) The internal validation route invokes `VALIDATION`-mode recomputation (`recomputeBlockerGates` + `diffGateResults`) and writes a `VALIDATION` snapshot.
- (Conditional on §2) An unauthenticated/public request to the validation route is rejected and performs no database write.
- `pcg1.test.ts` through `pcg6.test.ts`, `recompute.test.ts`, and `diff.test.ts` continue passing unmodified-in-substance, demonstrating PCG-1..6 semantics are genuinely unchanged by this workstream.

No other real-Postgres or production-data test is authorized by this record.

---

## 5. Remaining dependencies (not resolved by this record)

| Dependency | Nature | Blocks |
|---|---|---|
| Exact internal-authentication mechanism for the Pattern A route (§2) | Narrow engineering decision; this record does not invent it | Writing Pattern A's route code and tests only — does not block Pattern B |
| Launch-Criteria Q10 — who performs independent validation by a team distinct from the builders | External staffing/process dependency; explicitly not a decision this record or this task may make | Using any `gate_evaluation_snapshots` row (`PRODUCTION` or `VALIDATION`) produced by this workstream in an actual launch-qualification decision. Does **not** block building, testing, or running the wiring itself in a non-production/test context. |

Neither dependency is force-closed or invented here.

---

## 6. Implementation stop conditions

An implementer must halt and seek a new decision, rather than proceed, if any of the following occurs:

- `evaluateAllGates`, `writeProductionSnapshot`, `recomputeBlockerGates`, `diffGateResults`, or `writeValidationSnapshot` are found, once implementation begins, to require any change to their existing signature or behavior to be called from the new wiring — this record authorizes calling these functions as-is, not modifying them.
- Migration 0035's `gate_evaluation_snapshots` schema is found to be insufficient for the wiring described here (e.g. a needed column or index does not actually exist as the Engineering Design Decision assumed) — any new migration requires its own separate authorization, not implied by this record.
- `apps/worker/src/index.ts`'s current single-`try`/single-await structure cannot accommodate a second concurrent long-running loop without a change broader than adding a second `await`/`Promise.all` member (e.g. if the Search loop and the new gate-evaluation loop are found to need to share more state than the `Pool` and the shutdown signal) — report and seek guidance rather than restructuring `index.ts` beyond what §3 describes.
- Any attempt to write the Pattern A route's handler code is about to begin before the §2 internal-authentication follow-up decision exists — stop; that follow-up decision is the explicit next engineering task (§8).
- Any workstream in §1 marked "Authorized" is found, once implementation begins, to require a change to PCG-1..6 semantics, PCG-4 `TARGET_CUSTOMER_MATCH` semantics, `core-qualification-equivalence`, or any prior PO/Engineering decision's substance.

---

## 7. Explicit non-authorizations

- This decision does **not** authorize production deployment, release, launch, or rollout of any kind.
- This decision does **not** authorize running the wired mechanism against live production traffic — that remains gated by the already-separate, already-not-authorized deployment/release decision (K1-10, per `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` §8), unaffected by this record.
- This decision does **not** authorize using any `gate_evaluation_snapshots` row produced by this workstream in an actual launch-qualification decision — that remains gated by Launch-Criteria Q10's unresolved independent-validator question (§5), unaffected by this record.
- This decision does **not** change PCG-1..6 semantics, thresholds, blocker/monitoring classification, PCG-4 `TARGET_CUSTOMER_MATCH` semantics, or ED-3 allowlist semantics.
- This decision does **not** authorize any migration.
- This decision does **not** authorize the Pattern A route's code or tests until the §2 follow-up decision exists.
- This decision does **not** make Launch-Criteria Q10's staffing decision, and does not invent an internal-authentication architecture.
- This is an AI-exercised delegated decision, not a ratified human Product Owner decision, consistent with the same caveat already carried by `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` and `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-DEC-001`.

---

## 8. Estimated implementation effort

| Item | Estimate |
|---|---|
| Pattern B tick module + `pollLoop.ts` wrapper + `index.ts` wiring | 2–4 hours |
| Pattern B unit test(s) | 1–2 hours |
| Real-Postgres integration test extending the Phase 9 harness | 2–3 hours |
| Pattern A route handler + tests (**after** §2's follow-up decision lands) | 2–4 hours |
| Verification pass (run targeted suite, confirm snapshot writes, confirm idempotency on repeat run) | 1 hour |
| **Total (Pattern B only, immediately actionable)** | **~0.75–1.25 days** |
| **Total (Pattern B + Pattern A, after §2 resolves)** | **~1.25–2 days** |

## Next engineering task to execute after this authorization

1. **Immediately actionable:** build Pattern B exactly as authorized in §1/§3 — the worker tick module, `index.ts` wiring, unit test, and the real-Postgres integration test. No further decision is required to start this.
2. **Before Pattern A can be built:** produce the narrow follow-up decision named in §2 — a single-question engineering decision fixing the internal-authentication mechanism for `apps/web/app/api/gates/evaluate/route.ts` (not a Product Owner policy question; does not require this same delegated-authority process at this scale, but must still be recorded given this repository's governance convention of recording every engineering-design choice).
3. **Not yet actionable, and not part of this authorization's critical path:** Launch-Criteria Q10's independent-validator staffing decision — owned outside engineering, tracked but not blocking Pattern B's implementation.

---

## 9. Git verification

- `git rev-parse HEAD` before this task: `1898d8180d35909f5a2465061d8d8b4c5539d152`
- `git status --porcelain` before this task: 79 pre-existing lines, 0 staged
- `git rev-parse HEAD` after this task: unchanged (verified immediately below, in the final report)
- `git status --porcelain` after this task: expected 81 lines (79 pre-existing + 2 new files: this record and its companion preparation record), 0 staged
- No tracked source/schema/migration/test/config file modified by this task.
- All prior governing records (§0) remain byte-identical — no modified entry for any `requirement/*.md` file other than the two new ones created by this task.
- No commit made. No push made.

---

**IMPLEMENTATION AUTHORIZATION DECISION — AI-EXERCISED, DELEGATED AUTHORITY — WORKER SIDE (PATTERN B) UNCONDITIONALLY AUTHORIZED; VALIDATION SIDE (PATTERN A) CONDITIONALLY AUTHORIZED PENDING §2 — NO DEPLOYMENT, NO RELEASE, NO LAUNCH, NO COMMIT, NO PUSH.**
