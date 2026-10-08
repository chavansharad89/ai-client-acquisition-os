# Client Finder / PDEF-4 — Gate Evaluation Operational Wiring Implementation Authorization Decision Preparation

**Record ID:** `PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-PREP-001`
**Date:** 2026-10-05
**STATUS: PREPARATION ONLY — NO IMPLEMENTATION AUTHORIZATION GRANTED BY THIS RECORD**

---

## 1. Governing chain (read in full this session; read-only, not altered)

| # | File | Record ID |
|---|---|---|
| 1 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_PREPARATION.md` | `CLIENT-FINDER-PDEF-4-GATE-EVALUATION-OPERATIONAL-WIRING-PREPARATION-001` |
| 2 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md` | `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-QUESTIONNAIRE-001` |
| 3 | `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION.md` | `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-DEC-001` (**primary input to this record — the selected architecture**) |
| 4 | `requirement/CLIENT_FINDER_PDEF_4_FINAL_READINESS_AUDIT.md` | — (names Q10 as an open staffing/process dependency) |
| 5 | `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 | — (Q10: blocker-gate production metrics require independent validation by a team distinct from the builders, as a precondition to *using* those gates in a launch decision — not a precondition to building the wiring itself) |
| 6 | `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (structural precedent, W-1..W-16) | — |
| 7 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_IMPLEMENTATION_AUTHORIZATION_DECISION.md` + its `..._PREPARATION.md` (structural/format precedent, most recent instance of this exact record type) | `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` / `PDEF4-PCG4-TCMATCH-IMPL-AUTH-PREP-001` |

All six were treated as binding and read-only. None was modified. No prior decision's substance is restated beyond what is needed to cite it.

Baseline verified before writing: `git rev-parse HEAD` → `1898d8180d35909f5a2465061d8d8b4c5539d152`. `git status --porcelain` → **79** pre-existing lines, 0 staged. No tracked source/schema/migration/test/config file was read with intent to modify.

Fresh repository evidence read in this session (not re-derivation of the above): `apps/worker/src/searchWorker/pollLoop.ts` (full), `apps/worker/src/index.ts` (full), `apps/web/middleware.ts` (full, new/untracked this session per git status), and a repo-wide grep for `INTERNAL_API_KEY|x-internal|operator|ADMIN_|internal-only|isInternalRequest` across `apps/web` and `packages`.

---

## 2. What the Engineering Design Decision already settled (not reopened here)

Per `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-DEC-001` §3: selected architecture is Pattern B (primary, `apps/worker` poll-loop module modeled on `runSearchWorkerPollLoop`) plus Pattern A (secondary, internal-only `apps/web` route, `VALIDATION`-mode only). Trigger/cadence, execution owner, invocation inputs, idempotency strategy (catch-the-unique-violation-as-no-op), retry strategy (next-tick), concurrency strategy (single in-flight tick), snapshot behavior (`PRODUCTION` on every Pattern B tick; `VALIDATION` only on Pattern A invocation), failure behavior, observability requirements, and testing requirements are all already fixed by that record and are not re-decided here. This preparation record's job is narrower: confirm those engineering choices against the actual current code (not assumed from the ED record's own description) and resolve what is mechanically required to turn that design into an authorization-table scope, per the same structural convention used by `PDEF4-PCG4-TCMATCH-IMPL-AUTH-PREP-001`.

---

## 3. Fresh verification against actual code

- `apps/worker/src/searchWorker/pollLoop.ts` (read in full): `runSearchWorkerPollLoop(deps, signal)` is a `while (!signal.aborted)` loop; each iteration releases expired leases, attempts one claim/process, and only sleeps `pollIntervalMs` when nothing was claimed. `SearchWorkerPollLoopDeps` extends the base deps with `pollIntervalMs: number` and an optional injectable `sleep`. This is the exact template the ED decision names; a gate-evaluation tick module should take the same shape — an injectable `now`, an injectable `sleep`, and a `pollIntervalMs`-equivalent (here, a day-scale interval) — not a copy of the claim-and-process logic, which is specific to Search rows and does not apply.
- `apps/worker/src/index.ts` (read in full): constructs one `Pool` once at startup, builds one `deps` object, registers `SIGTERM`/`SIGINT` handlers against one shared `AbortController`, calls `runSearchWorkerPollLoop(deps, shutdown.signal)` inside a `try`, and calls `pool.end()` in the `finally`. A second poll loop (the gate-evaluation tick) sharing this same `pool` and `shutdown.signal` would need its own `await` inside the same `try`, run concurrently with (not sequentially blocking) the Search loop — confirmed this file does not currently await more than one long-running loop, so adding a second requires either `Promise.all([...])` or starting both before the shared `try`/`finally`; this is ordinary implementation work, not a new design question, since the ED decision already fixed "shares the existing `Pool`" (§2) without specifying the exact `index.ts` composition, which is correctly left to implementation.
- `apps/web/middleware.ts` (read in full, new/untracked this session): confirmed to do exactly one thing — mint a visitor-id cookie on a scoped matcher (`/upsell/:path*`, `/api/payments/create-order`, `/opportunities/:path*`). It performs no authentication or authorization of any kind. This confirms, rather than merely assumes, that `apps/web` has no existing middleware-level gate that could be reused or extended for an internal-only route.
- Repo-wide grep for `INTERNAL_API_KEY|x-internal|operator|ADMIN_|internal-only|isInternalRequest` across `apps/web` and `packages`: every hit is either an unrelated identifier (e.g. `core-acquisition`'s `nextAction`/`stages`/`scoring` modules matching on the substring "operator" inside unrelated words, or `db-index-deploy`'s own deploy-target internals) or a comment, not a genuine internal/operator-auth gating mechanism. **No existing internal-only-route authentication pattern exists anywhere in this repository today.** This directly confirms the Engineering Design Decision's own flag (§4: "Determining the exact internal-only authentication mechanism... is implementation work, not a new design decision") was itself conditioned on such a pattern existing to survey — it does not. This record therefore does **not** invent one, per this task's explicit instruction, and instead classifies it below as a genuine additional dependency.

---

## 4. The two flagged dependencies — resolved per task instruction (bounded, not invented)

### 4.1 Internal-authentication mechanism for the Pattern A route

**Finding:** no existing repository pattern for internal-only/operator-only route access exists (§3 above). The Engineering Design Decision's own §4 anticipated this might be "implementation work" if a pattern existed; since none does, per this task's explicit instruction this is **not** silently decided here and is **not** invented. It is classified as a genuine, narrow, additional implementation dependency requiring its own bounded decision before the Pattern A route may be built: specifically, the single question "what mechanism gates `apps/web/app/api/gates/evaluate/route.ts` to operators/reviewers only" (e.g., a static shared-secret header checked against an environment variable, a session-based admin-role check, or an IP/network-level restriction) — a narrow, engineering-shaped question, not a product-policy one, but one this record is instructed not to resolve by invention.

**Disposition:** the Pattern A route (and only the Pattern A route) is **not authorized to be built** until that narrow follow-up decision is made. Pattern B carries no such dependency — it runs inside `apps/worker`, a process with no inbound HTTP surface at all, so no authentication question exists for it.

### 4.2 Launch-Criteria Q10 — independent-validation responsibility

**Finding:** per `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 and `CLIENT_FINDER_PDEF_4_FINAL_READINESS_AUDIT.md` (Q10 row), Q10 requires that production instrumentation for the four blocker gates (PCG-1/2/3A/3B) pass independent validation by a team distinct from the builders **before those gates' output is used in an actual launch-qualification decision**. No record names who performs that validation; this is an explicitly unresolved staffing/process question, not an engineering one, and this task is explicitly instructed not to make that staffing decision.

**Disposition:** this record does not resolve Q10 and records it, per instruction, as an external dependency. Critically, Q10 gates *use of gate output in a launch decision*, not *building the wiring that produces the output* — this is the same distinction the Engineering Design Decision's own §7 already drew (building the mechanism is additive engineering work; using its output for launch qualification remains separately gated by K1-10). Building and testing the wiring authorized below does not require Q10 to be resolved first; using `gate_evaluation_snapshots` rows it produces for an actual launch decision does.

---

## 5. Authorization scope this record prepares (bounded to the ED's already-selected architecture only)

Per the task's explicit boundary, this record prepares authorization for exactly:

**Worker side (Pattern B) — no open dependency, fully preparable:**
- New module `apps/worker/src/gateEvaluation/` (tick function + poll-loop runner, modeled on `pollLoop.ts`/`worker.ts`'s split).
- One addition to `apps/worker/src/index.ts` starting the new loop alongside `runSearchWorkerPollLoop`, sharing the existing `Pool` and `shutdown.signal`.
- Calls `evaluateAllGates(sql, now)` then `writeProductionSnapshot` per result; catches the migration-0035 unique-violation as an expected no-op.
- Unit test(s) for the tick function (fake clock/`SqlExecutor`, asserting correct call arguments and once-per-interval cadence, and that a repeat-window invocation does not throw).
- One real-Postgres integration test extending `launch-gates-phase9.integration.test.ts`'s harness, exercising the actual tick function (not just `evaluateAllGates` directly).

**Validation side (Pattern A) — authorization conditional on the §4.1 follow-up:**
- New route `apps/web/app/api/gates/evaluate/route.ts`, `VALIDATION` mode only (calls `recomputeBlockerGates` + `diffGateResults`, writes a `VALIDATION` snapshot via `writeValidationSnapshot`), gated by whatever internal-auth mechanism the §4.1 follow-up decision fixes.
- Route-handler test(s) plus an explicit authorization test confirming unauthenticated/public requests are rejected.
- This workstream's **code** may not be written until §4.1's follow-up decision exists; its **test plan and route shape** are prepared now so no further design work is needed once that one narrow decision lands.

**Explicitly not part of this record's prepared scope (per task boundary):** any change to PCG-1..6 semantics, thresholds, blocker/monitoring classification, PCG-4 `TARGET_CUSTOMER_MATCH` semantics; any migration (schema for `gate_evaluation_snapshots` already exists per migration 0035 — no new migration is needed or authorized); ED-3 allowlist implementation; usage-metering changes; any change to `core-qualification-equivalence`; any new external scheduler/CI infrastructure; deployment; release; rollout; launch; billing/entitlement changes; changes to launch criteria.

---

## 6. Exact files to create/modify

**New files (Pattern B, worker side):**
- `apps/worker/src/gateEvaluation/worker.ts` (or `tick.ts` — exact filename left to implementation, mirroring `searchWorker/worker.ts`'s naming)
- `apps/worker/src/gateEvaluation/pollLoop.ts` (mirroring `searchWorker/pollLoop.ts`'s split between claim/process logic and the loop wrapper — here, between the tick function and the loop wrapper)
- `apps/worker/src/gateEvaluation/pollLoop.test.ts` (or equivalent unit-test file; exact name mirrors `searchWorker/pollLoop.test.ts` if that file exists, otherwise follows the nearest existing worker-test naming convention)
- A real-Postgres integration test extending `tests/integration/launch-gates-phase9.integration.test.ts` (same file, a new `describe` block, or a new sibling file — left to implementation, consistent with how prior PDEF-4 authorizations have left exact test-file placement to implementation when no single unambiguous convention exists)

**Modified files (Pattern B, worker side):**
- `apps/worker/src/index.ts` — add construction of the new gate-evaluation deps and start the new loop alongside `runSearchWorkerPollLoop`, sharing the existing `pool` and `shutdown.signal`

**New files (Pattern A, validation side — gated on §4.1):**
- `apps/web/app/api/gates/evaluate/route.ts`
- A route-handler test file (exact path mirrors existing `apps/web/app/api/payments/create-order/route.ts`'s own test-file convention)

**Explicitly out of scope (no file in these locations may be touched under the eventual authorization):**
- `packages/core-launch-gates/src/pcg1.ts` .. `pcg6.ts` and any other gate-semantics file
- `packages/core-launch-gates-validation/**`'s existing recomputation logic (`recompute.ts`, `diff.ts`) — reused as-is, not modified
- `packages/core-qualification-equivalence/**`
- `packages/db/prisma/migrations/0035_gate_evaluation_snapshots/**` (schema already exists; no new migration touching this table is needed or authorized)
- Any PDEF-4 `requirement/*.md` governing record

---

## 7. Test plan

| File | Covers |
|---|---|
| `apps/worker/src/gateEvaluation/pollLoop.test.ts` (new) | Tick function calls `evaluateAllGates` + `writeProductionSnapshot` with correct `now`/window arguments, once per interval; a repeat invocation for an already-evaluated window does not throw unhandled and does not produce a duplicate row (exercises the migration-0035 unique-violation no-op path). |
| Same file | Loop structure: only one tick in flight at a time; sleeps `pollIntervalMs` between ticks, matching `pollLoop.ts`'s own tested shape. |
| Real-Postgres integration test (extends `launch-gates-phase9.integration.test.ts`) | Exercises the actual wired tick function (not `evaluateAllGates` directly) against a real database: a tick writes real `gate_evaluation_snapshots` rows; a second tick for the same window is a no-op, not a duplicate or a crash; a tick after a simulated failure (e.g. a forced query error) does not crash the process and is retried successfully on the next simulated tick. |
| Route-handler test for `apps/web/app/api/gates/evaluate/route.ts` (new, gated on §4.1) | A correctly authenticated/internal request invokes `recomputeBlockerGates` + `diffGateResults` and writes a `VALIDATION` snapshot; an unauthenticated/public request is rejected (401/403, exact status per whatever §4.1 fixes) and performs no database write. |
| Existing `pcg1.test.ts`..`pcg6.test.ts`, `recompute.test.ts`, `diff.test.ts` | Must continue passing unmodified-in-substance, confirming PCG-1..6 semantics are genuinely unchanged by this workstream. |

---

## 8. Acceptance criteria (structural template; content fixed by the companion Decision record)

| Workstream | Governing-decision reference | Status |
|---|---|---|
| `apps/worker/src/gateEvaluation/` tick module + `pollLoop.ts` wrapper | `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-DEC-001` §3 items 1–9, 12 | Pending companion Decision record |
| `index.ts` wiring (start second loop) | ED-DEC-001 §3 item 3, §5 | Pending companion Decision record |
| Pattern B unit + integration tests | ED-DEC-001 §3 item 11(a),(c) | Pending companion Decision record |
| `apps/web/app/api/gates/evaluate/route.ts` (code) | ED-DEC-001 §3 items 2–10, 12; **gated on §4.1 follow-up** | Pending companion Decision record AND §4.1 follow-up |
| Pattern A route tests | ED-DEC-001 §3 item 11(b); **gated on §4.1 follow-up** | Pending companion Decision record AND §4.1 follow-up |

---

## 9. Residual blockers (genuinely unresolved — not force-closed)

- §4.1: the exact internal-authentication mechanism for the Pattern A route does not exist anywhere in this repository today and is not invented by this record. The Pattern A route's **code** remains unauthorized until a separate, narrow, bounded decision fixes that mechanism.
- §4.2: Launch-Criteria Q10's independent-validator identity remains an open staffing/process question, external to engineering, not resolved or force-closed here. It does not block building or testing the wiring authorized below; it blocks using the wiring's output in an actual launch-qualification decision.
- Exact test-file names/paths for the new integration test and the route-handler test are not fixed, consistent with how prior PDEF-4 implementation-authorization records (e.g. `PDEF4-PCG4-TCMATCH-IMPL-AUTH-PREP-001` §10) have left this to implementation when no single unambiguous convention exists.

---

## 10. Explicit authorization boundary

**This record is preparation only.** It authorizes nothing by itself — the companion Decision record is what grants authorization, subject to the scope and conditions this record establishes. It does not create or modify any source, schema, migration, test, or configuration file — the only file created by this task before the companion Decision record is this one. It does not modify any governing record listed in §1 — all were read-only in this session. It does not reopen, reinterpret, or alter the Engineering Design Decision's substance; where this record states a finding (§3–§4), it either (a) re-verifies an already-fixed engineering choice against actual code, or (b) classifies an open item as a genuine dependency per explicit task instruction, never silently deciding it.

---

## 11. Baseline/git verification

Verified before writing this record: `git rev-parse HEAD` → `1898d8180d35909f5a2465061d8d8b4c5539d152`; `git status --porcelain` → 79 pre-existing lines, 0 staged. No tracked source/schema/migration/test/config file was modified — only the governing `requirement/*.md` records and the actual `apps/worker/src/searchWorker/pollLoop.ts`, `apps/worker/src/index.ts`, and `apps/web/middleware.ts` were *read* (never edited) as fresh investigation evidence.
