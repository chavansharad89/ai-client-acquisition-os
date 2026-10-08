# Client Finder / PDEF-4 — Gate Evaluation Operational Wiring Engineering Design Decision

**Record ID:** `CLIENT-FINDER-PDEF-4-GATE-EVAL-WIRING-ED-DEC-001`
**Type:** **AI-exercised delegated Engineering Design decision — NOT a human Product Owner decision.** This decision is exercised by Claude under the same delegated-engineering-design authority already used elsewhere in this governance chain for engineering-only questions (e.g., `PDEF4-PCG4-ED-DEC-001`), because — per the preparation record's §10 classification table, re-verified in this task — every item settled below is engineering-only: none changes a gate's numerator, denominator, window, floor, blocker/monitoring classification, or launch threshold. Items that are not engineering-only are left explicitly unresolved in §7 below, not decided here.

**Basis:** `CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_PREPARATION.md` (used as the governing preparation record; not re-created, not superseded) and the companion questionnaire `CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md`, plus direct re-verification in this task of `apps/worker/src/index.ts`, `apps/worker/src/searchWorker/pollLoop.ts`, `packages/core-launch-gates/src/index.ts`, `packages/core-launch-gates/src/snapshotRepository.ts`, and `packages/core-launch-gates-validation/src/recompute.ts`.

**This decision does NOT change:** PCG-1..6 semantics, blocker/monitoring classification, launch thresholds, PCG-4 `TARGET_CUSTOMER_MATCH` semantics, Phase 9 scenarios, or ED-3 allowlist semantics. It does not authorize usage metering, deployment, release, or launch. It is strictly an answer to "how is gate evaluation invoked, operationally."

**No code, test, migration, route, job, or script has been created, modified, or run by this record. No commit, no push.**

---

## 1. Selected architecture

**Pattern B — a new `apps/worker` poll-loop module**, modeled directly on `runSearchWorkerPollLoop` (`apps/worker/src/searchWorker/pollLoop.ts`), running inside the same already-long-running process started by `apps/worker/src/index.ts`.

**Secondary, explicitly also selected (not merely proposed):** a new, internal-only `apps/web` API route (Pattern A) for on-demand invocation — specifically to run `recomputeBlockerGates` + `diffGateResults` and write a `VALIDATION` snapshot before any launch-qualification review, per the already-decided `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` B-2 process. Pattern B alone does not satisfy B-2's "before any launch-qualification decision" independent cross-check requirement, which is inherently an on-demand, reviewer-triggered action, not a routine tick.

**Pattern C (out-of-band script/CI) is not selected**, as primary or secondary.

## 2. Why Pattern B (+ secondary A) wins over the alternatives

Re-verified directly in this task, not assumed from the preparation record alone:

- `apps/worker/src/index.ts`'s own header comment states this repository's chosen worker architecture in-file: "A long-running, in-process PostgreSQL polling loop... no queue, no broker, no separate scheduler service." Pattern B is an additive instance of an already-chosen, already-running shape — not a new category of infrastructure. Pattern C would be the first external scheduler this repository has ever used for any purpose; Pattern A would be the first time `apps/web` (a user-facing request server) performs scheduled/periodic backend computation rather than strictly request-driven work.
- `runSearchWorkerPollLoop` (`pollLoop.ts:33-50`) is a direct, concrete template: a `while (!signal.aborted)` loop, an injectable `sleep(ms, signal)`, and an injectable `now()` — the exact shape a gate-evaluation tick needs, confirmed by reading the file in full rather than trusting its description.
- `evaluateAllGates(sql, now)` (`packages/core-launch-gates/src/index.ts:38-49`, re-read in this task) needs only a `SqlExecutor` and a `Date` — `apps/worker/src/index.ts` already constructs a Postgres `Pool` once at startup; a second poll loop shares that same connection pool, adding no new infrastructure.
- Concurrency: Pattern B's single in-process loop has no self-overlap by construction (one tick in flight at a time, matching `pollLoop.ts`'s own structure); Pattern A risks concurrent duplicate-request computation (harmless given the schema's unique index, but wasteful); Pattern C's concurrency safety depends on an external scheduler this repository does not control.
- Failure/retry: Pattern B gets automatic retry-on-next-tick for free from the same loop structure the Search worker already relies on; Pattern A would fail the triggering request with no built-in retry; Pattern C's retry is whatever the external platform provides, outside this repository's own code.
- Fit with the window semantics: the gate window only advances on a `GATE_WINDOW_DAYS`-scale boundary (re-confirmed: `GATE_WINDOW_DAYS` is re-exported at `index.ts:14`), which matches a coarse poll interval (Pattern B), not a per-request trigger (Pattern A) or an externally-scheduled job requiring its own infrastructure (Pattern C).
- B-2's own already-decided process (`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`) specifically names an independent cross-check "before any launch-qualification decision" — an inherently on-demand, human-reviewer-triggered action that a routine poll-loop tick does not naturally provide. This is the one respect in which Pattern A is not merely inferior to B but *additionally necessary*, which is why this decision selects both, in the specific division of labor the preparation record's §8 already recommended and this task re-verifies rather than preselects: B for the routine `PRODUCTION` cadence, A (internal-only) for on-demand `VALIDATION` + diff.

Pattern C is not selected because it is strictly dominated by B on every dimension in the questionnaire (Q1–Q13) that doesn't require external infrastructure this repository has never used, and the one thing Pattern C is sometimes good for — manual/on-demand triggering — is already covered by the secondary Pattern A selection without needing a second infrastructure category.

## 3. Complete engineering decision (every item settled)

1. **Selected wiring architecture:** Pattern B, primary; Pattern A, secondary (internal-only), per §1.
2. **Trigger/cadence:** Pattern B ticks on a fixed interval inside the existing `apps/worker` process; engineering default cadence is once per day, chosen because the gate window (`GATE_WINDOW_DAYS`) does not advance more often than that — no governing record specifies an exact number, and none needs to, consistent with the preparation record's §10 classification of cadence as "engineering design," not policy. Pattern A triggers on each authenticated `POST` request, with no fixed cadence (on-demand by design).
3. **Execution owner:** Pattern B — the single long-running `apps/worker` process (same `Pool`/process already running the Search poll loop). Pattern A — the `apps/web` Next.js server process.
4. **Invocation inputs:** both call `evaluateAllGates(sql, now)` with the process's live `SqlExecutor` and a wall-clock `now()` (injectable for tests, matching `pollLoop.ts`'s own `now` injection pattern); Pattern A additionally calls `recomputeBlockerGates(sql, now)` and `diffGateResults(...)` on each invocation.
5. **Idempotency strategy:** rely on the schema's existing unique index on `(gate, window_start, window_end, computation_path)` (migration `0035`); the wiring code catches/ignores the specific unique-violation as an expected "already evaluated this window" no-op rather than treating it as an error. No new idempotency mechanism is introduced — none is needed.
6. **Retry strategy:** Pattern B relies on the loop's natural next-tick retry (a failed tick is simply absent and retried next interval, matching the Search worker's existing reliance on this same property); no explicit retry-with-backoff logic is added. Pattern A has no automatic retry; a failed request returns an error to its (internal-only, operator-driven) caller, who decides whether to retry.
7. **Concurrency strategy:** Pattern B — single in-process loop, one tick at a time, no self-overlap by construction. Pattern A — concurrent requests are tolerated; the schema's unique index prevents duplicate rows, and redundant computation on overlap is accepted as harmless (read-only aggregate queries).
8. **Snapshot behavior:** `evaluateAllGates` itself does not persist anything (re-confirmed by reading `index.ts:38-49` in full); the wiring code must explicitly call `writeProductionSnapshot` per `GateResult` after each Pattern B tick. Pattern A additionally writes a `VALIDATION` snapshot (via whatever write path `recomputeBlockerGates`'s results use — the preparation record names `writeValidationSnapshot` as the counterpart, not separately re-verified line-by-line in this task but consistent with `snapshotRepository.ts`'s stated shape) after each on-demand invocation. Per B-2's already-decided process: `PRODUCTION` snapshots are written on the routine Pattern B cadence; `VALIDATION` snapshots are written only on Pattern A's on-demand invocation, not on every routine tick — avoiding forcing the heavier independent recomputation onto every daily tick.
9. **Failure behavior:** a thrown error during a Pattern B tick is logged and the loop continues to its next scheduled tick (no crash of the host process); a thrown error during a Pattern A request is returned as an error response to the (internal-only) caller.
10. **Observability requirements:** each Pattern B tick logs the evaluated window, per-gate status, and any idempotency no-op encountered; each Pattern A invocation logs the same plus the diff result. No new structured-logging infrastructure is introduced beyond what `apps/worker`'s existing console-based logging already provides for the Search poll loop — this decision does not mandate building new logging infrastructure, only that the new code emit log lines in the same style as its neighboring module.
11. **Testing requirements:** (a) a tick-function unit test for Pattern B, analogous to `pollLoop.test.ts`'s existing coverage, asserting `evaluateAllGates` + `writeProductionSnapshot` are called with correct arguments once per interval and that a repeat-window invocation does not throw unhandled; (b) a route-handler test for Pattern A, analogous to existing route tests, plus an authorization test confirming the route is not publicly invocable; (c) one real-Postgres integration test (extending `launch-gates-phase9.integration.test.ts`'s existing harness) exercising the actual wired entry point (the tick function or route handler itself), not merely the already-tested underlying `evaluateAllGates`/`recomputeBlockerGates` functions — closing the specific gap the conformance record's §6A names ("Operationally integrated: No").
12. **Production entry point:** a new module under `apps/worker/src/gateEvaluation/` (naming convention consistent with `apps/worker/src/searchWorker/`), started alongside `runSearchWorkerPollLoop` from `apps/worker/src/index.ts`; and a new route at `apps/web/app/api/gates/evaluate/route.ts` (or equivalent internal-only path), gated by an internal-only authentication check consistent with whatever mechanism this repository already uses for operator-only access (not separately surveyed in this task — see §4 Engineering dependency below).
13. **Boundaries of what this decision does NOT authorize:** see §7.

## 4. Remaining dependencies, separated

**Engineering (no further decision needed, implementation work only):**
- Writing the Pattern B tick module, the Pattern A route handler, and the three test categories in §3 item 11.
- Determining the exact internal-only authentication mechanism for the new route (this decision settles *that* it must be internal-only, not the specific auth implementation — surveying this repository's existing internal/operator-auth patterns, if any exist, is implementation work, not a new design decision, since no record frames "how do we gate an internal route" as an open policy question).
- Choosing the exact log-line format/fields, consistent with neighboring `apps/worker` code.

**Product Owner:**
- Whether the PO wants gate evaluation wired at all before launch, or is content with it remaining a manual/offline capability until later (flagged as open in the preceding readiness audit's bucket B; not resolved by this engineering-only decision, since whether to build it is itself the implementation-authorization question in §6, which the PO or whoever holds that authority still must grant).
- Who performs the Launch-Criteria Q10 "independent validation by a team distinct from the builders" — unrelated to this wiring decision and not affected by it.

**Ops/Security:**
- None newly introduced by this decision. (ED-3's allowlist values remain a separate, pre-existing Ops/Security dependency, unaffected by how gate evaluation is wired.)

**Implementation authorization (separate from this decision):**
- Per §11 of the preparation record, building any of this — the Pattern B module, the Pattern A route, their tests — requires its own future implementation-authorization decision, following the same pattern already used for W-1 through W-16 in `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`. This Engineering Design Decision record does **not** itself authorize implementation — it answers *how*, not *whether/when* to build it. No implementation-authorization record is created by this task, since none was requested and none is required to record the design decision itself.

## 5. Exact implementation scope that would follow (described, not implemented)

If and when implementation is separately authorized:
- New file `apps/worker/src/gateEvaluation/worker.ts` (or `pollLoop.ts` within a new `gateEvaluation/` directory): a tick function taking the same kind of injectable deps (`SqlExecutor`, `now`, `sleep`) as `SearchWorkerPollLoopDeps`, calling `evaluateAllGates` then `writeProductionSnapshot` per result, catching the expected unique-violation no-op.
- One line added to `apps/worker/src/index.ts` starting this new loop alongside `runSearchWorkerPollLoop`, sharing the existing `Pool`.
- New file `apps/web/app/api/gates/evaluate/route.ts`: an internal-only-gated `POST` handler calling `recomputeBlockerGates` + `diffGateResults`, writing a `VALIDATION` snapshot, returning the diff result.
- New test files: a tick-function test (unit), a route-handler test (unit/integration), and one real-Postgres end-to-end test extending the Phase 9 harness to exercise the actual wired entry point.
- No change to any `pcgN.ts` file, any migration, `snapshotRepository.ts`'s existing write functions, or `recompute.ts`/`diff.ts`'s existing logic — all of that is reused as-is.

## 6. Estimated implementation effort

| Item | Estimate |
|---|---|
| Pattern B tick module + wiring into `index.ts` | 2–4 hours |
| Pattern A route handler + internal-only auth | 2–4 hours |
| Unit tests (tick function + route handler) | 2–3 hours |
| Real-Postgres E2E test extending Phase 9 harness | 2–3 hours |
| Verification pass (run full suite, confirm snapshot writes, confirm idempotency on repeat run) | 1 hour |
| **Total** | **~1–1.5 days** |

This is consistent with, and narrower than, the prior readiness audit's "0.5–1 day" wiring-implementation line, now broken out in more detail with both patterns included.

## 7. Explicit non-authorizations

- This decision does **not** authorize writing, modifying, or running any code, test, migration, route, or job.
- This decision does **not** authorize deployment, release, launch, or rollout of any kind.
- This decision does **not** authorize running the wired mechanism against live production traffic — that remains gated by the already-separate, already-not-authorized deployment/release decision (`K1-10`, per `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` §8), unaffected by this record.
- This decision does **not** change PCG-1..6 semantics, blocker/monitoring classification, launch thresholds, PCG-4 `TARGET_CUSTOMER_MATCH` semantics, Phase 9 scenarios, or ED-3 allowlist semantics.
- This decision does **not** grant implementation authorization — a separate future decision (§4, §6 of this record) is required before any of §5's scope may be built.
- This decision does **not** resolve who performs Launch-Criteria Q10's independent validation, or whether/when the PO wants this wiring built at all — both remain open, unaffected by this record.
- This is an AI-exercised delegated engineering decision, not a ratified human Product Owner decision, consistent with the same caveat already carried by `PDEF4-PCG4-ED-DEC-001` and by `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`'s own self-flagged delegated-authority status.

## 8. Verification

- HEAD before this task: `1898d8180d35909f5a2465061d8d8b4c5539d152`. HEAD after: unchanged (confirmed below).
- Upstream before and after: `origin/feature/client-intent-discovery-complete`, same SHA (unchanged).
- `git status --porcelain=v1` entry count: 77 before this task → 79 after (two new files: this record and its companion questionnaire); all 77 prior entries unchanged.
- Newly created files, both by this task: `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md`, `requirement/CLIENT_FINDER_PDEF_4_GATE_EVALUATION_OPERATIONAL_WIRING_ENGINEERING_DESIGN_DECISION.md`.
- No source, test, schema, or migration file modified. No route, job, or script added. No commit, no push, no deploy, no release, no launch.

---

**ENGINEERING DESIGN DECISION ONLY — AI-EXERCISED, DELEGATED AUTHORITY — NO IMPLEMENTATION AUTHORIZATION, NO COMMIT, NO PUSH.**
