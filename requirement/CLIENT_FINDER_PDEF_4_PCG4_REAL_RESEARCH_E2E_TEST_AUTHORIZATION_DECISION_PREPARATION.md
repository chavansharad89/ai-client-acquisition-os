# CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_AUTHORIZATION_DECISION_PREPARATION

**STATUS: PREPARATION / AUTHORIZATION CHECK ONLY. NOT A DECISION RECORD.**

This record follows up on `requirement/CLIENT_FINDER_PDEF_4_POST_COMMIT_IMPLEMENTATION_STATUS_AUDIT_PREPARATION.md`, §6 point 8 and §8 Candidate 5, which flagged: *"no end-to-end test proves that a real Research-pipeline `targetCustomerMatch` `MATCH` determination flows through to a non-zero PCG-4 numerator."* This record investigates, as a scope question only, whether adding such a test is already authorized. It makes no Product Owner decision, no Engineering Design decision, no gate-operational-wiring authorization, and does not address ED-3 or deployment/release/launch. No source, test, schema, or migration file has been modified by this task.

## 1. Governance determination

Every testing authorization found in the governing chain is scoped to a specific named deliverable, not a standing permission to add further tests to an already-implemented gate:

- `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`, workstream W-12, scopes Phase 9 explicitly to **"PCG-1/2/3A/3B"** — not PCG-4. (The Phase 9 suite as actually built exceeds this named scope by also covering PCG-4/5/6, but its PCG-4 case is titled "NOT YET EVALUABLE by design" — a zero-numerator fixture, not a MATCH fixture. Confirmed at `tests/integration/launch-gates-phase9.integration.test.ts:300`.)
- `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (`PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`) **does** contain a specific, named authorization directly on point, confirmed by direct read of the file:
  - §2 authorization table: *"Real-Postgres end-to-end validation (PCG-4 numerator/denominator over real rows) — Authorized."*
  - §3 "New files (authorized to create)": *"A PCG-4 real-Postgres end-to-end test, either as an extension of `packages/core-launch-gates/src/pcg4.test.ts` or a new file under `tests/integration/`."*
  - §5 acceptance criteria, "Real-Postgres E2E" row: *"Against a real Postgres instance (not a mock), a full `evaluatePcg4` run over seeded rows including a `MATCH` determination produces a non-structurally-zero numerator, proving the join and translation work end-to-end."*

**This acceptance criterion, read literally, is already satisfied.** `tests/integration/target-customer-match.integration.test.ts:261-290` ("PCG-4 real-Postgres end-to-end (TD-13 join + §1.1 translation)") seeds a `MATCH` row directly via `repo.save(...)` and asserts `evaluatePcg4(...)` returns `numerator === 1` and `value > 0`. The word used in the authorization is **"seeded rows"**, and this test does seed a row (via the repository's own `save`, not a raw SQL insert) and does prove the join/translation work end-to-end against real Postgres.

**What this authorization does not explicitly address:** whether "seeded rows" was intended to mean *only* a row written directly through the repository's `save()` method (already done), or whether it also contemplated a row produced by running the *full* pipeline — a fake `ResearchModel` returning a `MATCH` finding, through `evaluateTargetCustomerMatch`, through the real worker claim loop (`claimAndProcessNextSearch` → `researchProspectForOwner` → `runResearchForOwner`), and only then into `pcg4.ts`. The authorizing text does not use the words "worker," "claim loop," or "model call" anywhere in its E2E acceptance line — it speaks only of "a full `evaluatePcg4` run over seeded rows." A narrow reading says this is satisfied; a broader reading — that genuine end-to-end proof requires exercising the model-call and worker layers, not just the repository-and-evaluator layers — is also defensible, and is the reading implicit in how the original post-commit audit (§6 point 8, §8 Candidate 5) framed the gap.

**No record states a general, standing permission** such as "any future test of an already-implemented gate is pre-authorized." Each testing authorization found is tied to a specific acceptance line in a specific decision.

**Unresolved internal contradiction, flagged but not resolved by this record:** `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (`PDEF4-PCG4-PO-DEC-001`) states, in its own text: *"Confirmed: no schema change, migration, or pipeline stage currently exists that would populate an Opportunity-level observed-target-customer signal. This is new, unauthorized-until-now engineering scope"* and *"PCG-4 remains `NOT_YET_EVALUABLE`... none of which is performed, authorized to be designed, or scheduled by this record."* The remainder of the same-day sub-chain (ED-DEC-001, MECH-PO-DEC-001, TECHDESIGN-DEC-001, IMPL-AUTH-DEC-001, PRODWIRING-DEC-001) proceeds to design, authorize, and — per the post-commit audit — actually implement and wire exactly the scope PO-DEC-001 describes as not yet existing or scheduled. This record does not resolve that contradiction; it notes that relying on "IMPL-AUTH-DEC-001 already authorizes this" as a confident answer is weakened by the fact that the chain containing it is not internally consistent about what was authorized when.

## 2. Exact runtime path (confirmed against code)

**Forward path** (search claim → persisted determination):
1. `apps/worker/src/searchWorker/worker.ts:239` `claimAndProcessNextSearch` → loop (`worker.ts:400-402`) calls `researchProspectForOwner(deps, userId, prospect.id)`.
2. `worker.ts:420-440` `researchProspectForOwner` forwards `deps.targetCustomerMatch` (if present) into `runResearchForOwner(...)`.
3. `packages/core-research/src/service.ts:191-218` `runResearchForOwner`: guarded block calls `evaluateTargetCustomerMatch(model, search.parameters.targetCustomer, sources, options)` (line 198), then `repository.supersedePrevious(...)` (204), `repository.save(...)` (205-218).
4. `packages/core-research/src/targetCustomerMatch.ts:336-344` `evaluateTargetCustomerMatch`: `callTargetCustomerMatchModel` (342) → `verifyTargetCustomerMatchFindings` (343) → `aggregateTargetCustomerMatch` (344).
5. `packages/core-research/src/targetCustomerMatchRepository.ts`: `createPgTargetCustomerMatchRepository` — `supersedePrevious` (117), `save` (127), concurrency guard via `isPostgresUniqueViolation` (99) against `target_customer_match_determinations_current_idx` (113).

All function names assumed in the original request matched actual code exactly; none were found missing or misnamed.

**Reverse path** (persisted determination → numerator):
- `packages/core-launch-gates/src/pcg4.ts` `evaluatePcg4`: `LEFT JOIN target_customer_match_determinations tcm ON tcm.search_id = s.id AND tcm.prospect_id = p.id AND tcm.superseded_at IS NULL`.
- `toObservedTargetCustomer(result, targetCustomer)`: `MATCH` → the literal `targetCustomer` string; `NO_MATCH` → sentinel `'\u0000__PCG4_NO_MATCH_SENTINEL__\u0000'`; else → `null`.
- Passed into `evaluateQualificationEquivalence(...)` from `@acos/core-qualification-equivalence`; numerator requires `result.match === true` together with `row.reviewed && row.feedback_useful === true`.
- `buildRatioResult('PCG-4', window, now, numerator, denominator)` produces the final `GateResult`.

**Missing link between forward and reverse paths: none found.** Join keys, the `superseded_at IS NULL` filter, and the tri-state-to-string translation line up exactly between writer and reader.

## 3. Existing test infrastructure

Three capabilities, each confirmed separately in the repository:

- **Evaluator-only, fake model, no persistence:** `packages/core-research/src/targetCustomerMatch.test.ts` injects `ResearchModel` fakes directly against `evaluateTargetCustomerMatch`/`verifyTargetCustomerMatchFindings`/`aggregateTargetCustomerMatch`.
- **Real worker pipeline with fake model, real persistence — exists, but only exercises the non-MATCH path:** `tests/integration/search-worker.integration.test.ts:367-399` ("target customer match (PCG-4 production wiring, real Postgres)") runs the real `claimAndProcessNextSearch` with a fake `ResearchModel` returning `{ findings: [] }` (line 375), and asserts a real `target_customer_match_determinations` row is written. This proves the fake-model-through-real-pipeline mechanism works, but the fake model used aggregates to `NOT_YET_OBSERVED`, never `MATCH`.
- **Direct repository seed + real pcg4.ts read, real Postgres — exists and already covers the literal IMPL-AUTH-DEC-001 §5 acceptance line:** `tests/integration/target-customer-match.integration.test.ts:261-290` seeds a `MATCH` row via `repo.save(...)` directly (bypassing the model call and worker) and asserts `evaluatePcg4(...)` returns a non-zero numerator.

**No existing test chains all three**: a fake model producing an actual `MATCH` finding, run through the real worker claim loop, persisted, and then read back through `pcg4.ts` into a non-zero numerator. That specific three-way chain is the literal, narrow form of the gap. No new test *capability* would be required to build it — it is a recombination of two already-existing, already-exercised patterns (verified-quote fixtures from `targetCustomerMatch.test.ts`; fake-model-through-worker wiring from `search-worker.integration.test.ts`).

## 4. Minimum proposed E2E scenario (for future reference only — not authorized here)

If such a test were built, the minimum new content (no new migration, schema, repository, or production code implied) would be:
1. A completed search with a `targetCustomer` criterion string.
2. A discovered prospect/opportunity for that search.
3. A reviewed opportunity (`funnel_events`, `opportunity_reviewed`) with `feedback.useful = true` (existing fixture helpers already support this).
4. A fake `ResearchModel` (same shape as the existing `search-worker.integration.test.ts` fixture) returning one finding classified `MATCH`, quoting text verbatim present in a supplied source document, so `verifyTargetCustomerMatchFindings` accepts rather than drops it.

## 5. Authorization status: **Outcome B — ambiguous**

Reasons this is not a clean Outcome A ("already authorized"):
- The only on-point authorization (`PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §5) uses the phrase "seeded rows including a `MATCH` determination," which is already literally satisfied by an existing direct-repository-seed test. Whether it also contemplated — and therefore pre-authorizes — a *pipeline-level* (fake-model-through-worker) version of the same proof is not stated either way.
- No record grants a general standing permission to add further integration tests to an already-implemented, already-authorized gate; every authorization found is tied to a specific named deliverable, and this specific combination (model-fake + worker + pcg4 read, chained) is not named anywhere.
- The governing chain for PCG-4 contains an unresolved internal contradiction (`PDEF4-PCG4-PO-DEC-001` vs. the rest of the sub-chain) about whether this engineering scope was authorized to exist at all at the time it was decided, which weakens confidence in treating any single record in that chain as a clean, reliable "yes."

Reasons this is not a clean Outcome C ("not authorized") either: a directly on-point authorization line does exist and, read narrowly, is already satisfied by current tests; it would be inaccurate to say nothing covers this.

**Implementation of the three-way-chained test should wait for an explicit scope confirmation** — a short decision (not a new Product Owner or Engineering Design decision on product/engineering substance, since none of the underlying design is in question; only a confirmation of testing-authorization scope) stating whether the existing IMPL-AUTH-DEC-001 §5 acceptance line is read as satisfied already, or as requiring this additional pipeline-level variant.

## 6. Verification

- HEAD unchanged throughout this task.
- No tracked file modified.
- No source, test, schema, or migration file changed by this task.
- No commit, no push.
- Only this preparation record was newly created.

---

**PREPARATION / AUTHORIZATION CHECK ONLY — NO IMPLEMENTATION PERFORMED.**
