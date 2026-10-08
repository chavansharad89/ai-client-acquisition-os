# CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_SCOPE_CLARIFICATION_PREPARATION

**STATUS: GOVERNANCE CLARIFICATION PREPARATION ONLY. NOT A DECISION RECORD.**

This record follows up on `requirement/CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_AUTHORIZATION_DECISION_PREPARATION.md` and `requirement/CLIENT_FINDER_PDEF_4_PCG4_GOVERNANCE_RECONCILIATION_PREPARATION.md`, narrowing to a single remaining question left open by both: whether `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5's "seeded rows" acceptance line covers a pipeline-generated (fake-model-through-worker) variant of the PCG-4 real-Postgres E2E test, in addition to the direct-repository-seed variant already satisfied. This task makes no Product Owner decision, no Engineering Design decision, and does not reinterpret, amend, or supersede any prior decision. No source, test, schema, or migration file has been modified.

## §1 Baseline

- HEAD: `1898d8180d35909f5a2465061d8d8b4c5539d152`
- Branch: `feature/client-intent-discovery-complete`
- Upstream: `origin/feature/client-intent-discovery-complete` (same SHA)
- Working tree: pre-existing modified/untracked entries from prior sessions, unchanged by this task (per `git status`, confirmed at §Verification below).

## §2 Exact governing wording

`PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`, §5, "Real-Postgres E2E" row (quoted verbatim):

> "Against a real Postgres instance (not a mock), a full `evaluatePcg4` run over seeded rows including a `MATCH` determination produces a non-structurally-zero numerator, proving the join and translation work end-to-end."

The same record's §2 authorization table states, as a workstream line: "Real-Postgres end-to-end validation (PCG-4 numerator/denominator over real rows) — Authorized." Its §3 "New files (authorized to create)" names: "A PCG-4 real-Postgres end-to-end test, either as an extension of `packages/core-launch-gates/src/pcg4.test.ts` or a new file under `tests/integration/`."

No sentence in §5, §2, or §3 uses the words "worker," "claim loop," or "model call." The acceptance line's only verb describing data setup is "seeded" ("seeded rows"); the record does not define that term or distinguish a direct-insertion meaning from a pipeline-generated meaning.

`PDEF4-PCG4-GOVERNANCE_RECONCILIATION_PREPARATION`, §8–§9 (quoted): the broader implementation and the literal "seeded rows" E2E acceptance criterion are confirmed "validly authorized and not undermined by the PO-DEC-001 passages," but "the exact combined chain — fake MATCH-producing model → real worker claim loop → persistence → `pcg4.ts` → non-zero numerator — is not named by any record's text," and the proposed stricter test "remains classified B — Ambiguous."

## §3 Existing evidence

Two tests, each already confirmed by direct read in the preparation records above:

1. **Worker → persistence (pipeline-generated, non-MATCH only):** `tests/integration/search-worker.integration.test.ts:367-399`, "target customer match (PCG-4 production wiring, real Postgres)." Runs the real `claimAndProcessNextSearch` with a fake `ResearchModel` returning `{ findings: [] }`, against real Postgres, and asserts a `target_customer_match_determinations` row is written. The fake model's output aggregates to `NOT_YET_OBSERVED`, never `MATCH`.
2. **Persisted MATCH → PCG-4 numerator (direct-seed, not pipeline-generated):** `tests/integration/target-customer-match.integration.test.ts:261-290`, "PCG-4 real-Postgres end-to-end (TD-13 join + §1.1 translation)." Seeds a `MATCH` row directly via `repo.save(...)` (bypassing the model call and the worker), against real Postgres, and asserts `evaluatePcg4(...)` returns `numerator === 1` and `value > 0`.

No existing test chains both: a fake model producing an actual `MATCH` finding, run through the real worker claim loop, persisted, and then read back through `pcg4.ts` into a non-zero numerator.

## §4 Proposed combined test

Description only, no implementation:

- A deterministic fake `ResearchModel` (same shape as the existing fixture in `search-worker.integration.test.ts`) returns one finding classified `MATCH`, quoting text verbatim present in a supplied source document, so `verifyTargetCustomerMatchFindings` accepts rather than drops it.
- The real worker claim loop (`claimAndProcessNextSearch` → `researchProspectForOwner` → `runResearchForOwner`) is invoked against real Postgres, producing and persisting the `MATCH` determination through the real evaluator, repository, and `service.ts` integration (no direct `repo.save(...)` call).
- The persisted row is then read by `evaluatePcg4` and the resulting numerator is asserted non-structurally-zero.

## §5 Scope analysis

- **Clearly covered:** a real-Postgres `evaluatePcg4` run over a directly-seeded row including a `MATCH` determination, producing a non-structurally-zero numerator. Already implemented and passing (§3.2).
- **Reasonably implied:** that "seeded rows" was meant generically — i.e., the proposed combined test's data-setup step (writing a `MATCH` row via the real evaluator/repository/service.ts path triggered by the worker, rather than via a raw SQL insert or direct `repo.save(...)` call) is still a form of "seeding" a row before `evaluatePcg4` reads it. The acceptance line's stated purpose — "proving the join and translation work end-to-end" — is already satisfied by the existing direct-seed test without reference to the worker.
- **Ambiguous:** whether the specific combination named in §4 — fake model, through the real worker claim loop, through the real pipeline, into persistence, into `evaluatePcg4` — is itself a named or implied deliverable, as distinct from being merely possible to build from already-authorized, already-existing test capabilities (per Reconciliation §8–§9 and the prior preparation record §5).
- **Explicitly excluded:** nothing in §5, §2, or §3 of IMPL-AUTH-DEC-001 explicitly excludes the combined test; no stop condition in §7 of that record names this scenario; no record states a standing permission to add further integration tests to an already-implemented gate.

## §6 Determination

**B — Ambiguous.**

The existing authorization ( `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5, confirmed unaltered by `PDEF4-PCG4-GOVERNANCE_RECONCILIATION_PREPARATION` §8–§9) supports the broader validation intent — proving the join and translation work end-to-end against real Postgres — and that intent is already satisfied by the direct-repository-seed test. But the record's literal text does not establish, one way or the other, that the pipeline-generated (fake-model-through-worker) variant is a separately covered or separately required deliverable. Both prior preparation records independently reached this same classification, and the reconciliation record's resolution of the unrelated PO-DEC-001/chain-validity tension (§4 of that record) does not bear on this narrower wording question, as that record itself states at its own §9.

## §7 Minimal next governance action

Define the smallest clarification required: a scope-confirmation decision (not a new Product Owner or Engineering Design decision on product or engineering substance) stating whether `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5's "seeded rows" acceptance line is read as:
(a) already satisfied by the existing direct-repository-seed test, with no further test required; or
(b) requiring, in addition, the pipeline-generated (fake-model-through-worker) variant described in §4 above.

This record does not create that decision and does not recommend which answer to choose.

## §8 Non-actions

- No source file was changed.
- No test file was changed.
- No schema or migration file was changed.
- No deployment, release, or rollout occurred or was authorized.
- No commit was made.
- No push was made.
- No new Product Owner decision was made.
- No new Engineering Design decision was made.
- No existing decision was amended, superseded, or reinterpreted — only read and cited.
- PCG-4 semantics, `TARGET_CUSTOMER_MATCH` semantics, the evaluation mechanism, technical design, migration design, production wiring, usage metering, ED-3, and gate operational wiring were not reopened or revisited.

## Verification

- HEAD unchanged: `1898d8180d35909f5a2465061d8d8b4c5539d152`.
- Upstream unchanged: `origin/feature/client-intent-discovery-complete` at the same SHA.
- All pre-existing working-tree entries unchanged by this task.
- No tracked file modified.
- Only this preparation record was newly created.
- SHA-256 and final `git status` are reported in this task's final message (not embedded here, to avoid a self-referential hash).

---

**SCOPE CLARIFICATION PREPARATION ONLY — NO NEW AUTHORIZATION OR IMPLEMENTATION PERFORMED.**
