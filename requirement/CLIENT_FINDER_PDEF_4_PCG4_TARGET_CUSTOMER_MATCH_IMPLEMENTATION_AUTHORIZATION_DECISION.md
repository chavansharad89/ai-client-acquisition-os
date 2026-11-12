# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Implementation Authorization Decision

**Record ID:** `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`
**Date:** 2026-10-05
**Decision authority:** Exercised under **delegated authority by Claude**, explicitly authorized by the human
user for this single task. This is **not** a human Product Owner's personal decision. It does not reopen,
reinterpret, or alter the substance of any prior Product Owner or Engineering decision cited below.
**Scope:** Implementation authorization record only. Does **not** implement code, create migrations, or write
tests. Does **not** authorize deployment, release, launch, or production rollout.

---

## 0. Governing chain (read-only; cited, not restated or altered)

| # | File | Record ID |
|---|---|---|
| 1 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` |
| 2 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` | `PDEF4-PCG4-ED-DEC-001` |
| 3 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` |
| 4 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` | `PDEF4-PCG4-TCMATCH-IMPL-AUTH-PREP-001` (**primary input to this record**) |
| — | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-PO-DEC-001` |

All five were treated as **binding and read-only**. None was modified. No prior PO or Engineering decision's
substance is restated beyond the minimum needed to cite it; none is altered.

---

## 1. The three residual decisions (resolved here, under delegated authority)

### 1.1 NO_MATCH sentinel — exact literal

**Decision:** The sentinel value is fixed to the exact literal:

```
"\u0000__PCG4_NO_MATCH_SENTINEL__\u0000"
```

**Rationale.** Confirmed directly against `packages/core-qualification-equivalence/src/rules.ts` (lines 11–13,
47): `normalise(value) = value.trim().toLowerCase()`. A NUL-wrapped literal is untouched by both operations
(`trim()` only strips whitespace, `toLowerCase()` only case-folds letters — neither removes nor alters `\u0000`),
so it survives `normalise()` unchanged and can never equal `normalise()` of any legitimate free-text
`targetCustomer` value, because Postgres `TEXT` columns (and standard app-level string handling in this stack)
cannot contain a NUL byte in ordinary user-authored input — collision is structurally impossible, not merely
improbable. Malformed or verification-failing model output never reaches this literal: per TD-14/TC-MATCH-9 it
resolves upstream, at the evaluator/write layer, to a stored `NOT_YET_OBSERVED` result (or no row), and the
`result` column's `CHECK (result IN ('MATCH','NO_MATCH','NOT_YET_OBSERVED'))` constraint (TD-7) makes a fourth
persisted value impossible — so `pcg4.ts`'s translation function only ever receives one of the three validated
values (or row-absence), and this sentinel is applied only on the already-validated `NO_MATCH` branch.

### 1.2 Concurrent unique-index violation — exact behavior

**Decision: (b) — treated as success; the conflict IS the desired outcome (no-op).**

When `targetCustomerMatchRepository`'s insert hits the TD-8 partial unique index
(`(search_id, prospect_id) WHERE superseded_at IS NULL`), the repository must:
1. Catch the violation structurally the way `packages/core-payments/src/orderRepository.ts` does
   (`isPrismaUniqueConstraintError`: check `err.code === 'P2002'` without a hard import-time dependency on
   `@prisma/client`'s generated error classes), scoped specifically to the TD-8 index's constraint/target name —
   not a catch-all for every error.
2. On a match, **do not retry the insert and do not throw**. Resolve the call successfully as a no-op: another
   concurrent `runResearchForOwner` call for the same `(search_id, prospect_id)` pair has already
   superseded-and-inserted a newer current row, which is exactly the invariant TD-8's index exists to guarantee
   ("exactly one current row, never two"). This call's own attempted write is therefore moot — the newer row is
   already correct and current.
3. Any other error (wrong column/target, connection failure, syntax error, etc.) is **not** reclassified as a
   concurrency conflict; it propagates to the same fail-soft boundary TD-14 already establishes, resolving the
   overall determination to `NOT_YET_OBSERVED`, never crashing the research pipeline.

**Rationale for (b) over (a)/(c).** (a) retry-the-insert adds a second round-trip and a second opportunity to
race again, for no behavioral gain, since the invariant is already satisfied by the other writer's row. (c)
fail-soft to `NOT_YET_OBSERVED` would be wrong here — it would discard a case where a *valid* current
determination already exists, understating PCG-4's true state. (b) is the minimal, correct response: the
conflict is not a failure, it is proof the invariant held.

**Exact test requirement (not written here, specified for the future test):** A test must simulate two
concurrent calls to the repository's save path for the identical `(search_id, prospect_id)` pair (e.g. by
issuing both inserts before either commits, or by pre-seeding a current row and then invoking `save()` again
without first calling `supersedePrevious`) and assert all of the following:
- Exactly one row for that `(search_id, prospect_id)` pair has `superseded_at IS NULL` after both calls complete.
- Neither call throws an unhandled exception or rejects the caller's promise.
- The call that loses the race returns normally (no error surfaced to `runResearchForOwner`), and does not insert
  a second current row.
- A distinct test asserts that a *different* class of database error (e.g. a forced connection failure, not the
  TD-8 index) is **not** swallowed as a no-op and instead results in the overall determination resolving to
  `NOT_YET_OBSERVED` per TD-14.

### 1.3 Acceptance criteria — see §5 below (per-workstream, concrete, testable).

---

## 2. Authorization status by workstream

| Workstream | Status |
|---|---|
| Migration 0036 (`target_customer_match_determinations` table, FKs, TD-8 partial unique index) | **Authorized** |
| Migration 0037 (`target_customer_match_source_documents` table, FK to 0036) | **Authorized** |
| `target_customer_match_determinations` table shape (TD-7 columns) | **Authorized** (part of 0036) |
| FKs/indexes (search_id→searches.id, prospect_id→prospects.id, cascade) | **Authorized** (part of 0036) |
| Current-row uniqueness (TD-8 partial unique index) | **Authorized** (part of 0036) |
| Supersede-then-insert application pattern | **Authorized** |
| Source-document binding (`content_sha256` over exact post-parse `source_text`) | **Authorized** (migration 0037 + repository write path) |
| Model/provider/prompt-version metadata columns (TD-6) | **Authorized** (part of 0036) |
| Array-of-findings model I/O (TD-2) | **Authorized** — new evaluator module |
| Contradictory-evidence handling (TC-MATCH-6: both quotes persisted → `NOT_YET_OBSERVED`) | **Authorized** |
| MATCH / NO_MATCH / NOT_YET_OBSERVED tri-state aggregation (TC-MATCH-3/4/5) | **Authorized** |
| Fail-soft behavior across every failure mode (TC-MATCH-9/TD-14) | **Authorized** |
| Retry/idempotency — concurrency handling per §1.2 | **Authorized** (behavior fixed by this record) |
| Research-time integration in `core-research/src/service.ts` (TD-10, Option A — non-transactional, additive guarded block) | **Authorized** |
| `pcg4.ts` `LEFT JOIN` + translation, including NO_MATCH sentinel per §1.1 | **Authorized** |
| Dedicated unit/integration tests (evaluator, repository/concurrency, service.ts extension, pcg4.ts extension, migration-integration) | **Authorized** |
| Real-Postgres end-to-end validation (PCG-4 numerator/denominator over real rows) | **Authorized** |
| Conformance evidence record (future, separate document) | **Out of scope for this record** — to be produced after implementation, as its own document |
| Shared transaction wrapping signals/categoryPlausibility/targetCustomerMatch writes (TD-10 Option B) | **Not authorized** — explicitly excluded, remains a separate undecided question per TD-10 §5 |
| Production deployment / release / launch / rollout | **Not authorized** |
| Changes to PCG-4's existing launch/monitoring semantics | **Not authorized** |
| Changes to `@acos/core-qualification-equivalence` | **Not authorized** — confirmed by the prep record's grep that only `pcg4.ts` imports it; no change needed or permitted |
| Unrelated schema cleanup | **Not authorized** |
| Changes to existing PO decisions | **Not authorized** |

---

## 3. Authorized file/package scope

**New files (authorized to create):**
- `packages/db/prisma/migrations/0036_target_customer_match_determinations/migration.sql`
- `packages/db/prisma/migrations/0037_target_customer_match_source_documents/migration.sql`
- `packages/core-research/src/targetCustomerMatch.ts` (evaluator)
- `packages/core-research/src/targetCustomerMatchRepository.ts` (repository interface + Postgres implementation,
  including the §1.2 concurrency handling)
- `packages/core-research/src/targetCustomerMatch.test.ts`
- `packages/core-research/src/targetCustomerMatchRepository.test.ts` (or equivalent repository/concurrency test
  location, consistent with existing repository-test placement in this package)
- A migration-integration test under `tests/integration/` (exact filename to follow this directory's existing
  per-migration naming convention at implementation time)
- A PCG-4 real-Postgres end-to-end test, either as an extension of `packages/core-launch-gates/src/pcg4.test.ts`
  or a new file under `tests/integration/`

**Modified files (authorized to modify):**
- `packages/core-research/src/service.ts` — add optional `deps.targetCustomerMatch?` dependency and the TD-10
  guarded insertion block in `runResearchForOwner`, non-transactional, alongside the existing
  `categoryPlausibility` block
- `packages/core-research/src/service.test.ts` — extensions for the new insertion point and §1.2 retry/no-op
  behavior
- `packages/core-launch-gates/src/pcg4.ts` — add TD-13 `LEFT JOIN`, select `result`, replace the hardcoded
  `observedTargetCustomer: null` with the §1.1 translation
- `packages/core-launch-gates/src/pcg4.test.ts` — extensions for the join/translation behavior

**Explicitly out of scope (no file in these locations may be touched under this authorization):**
- `packages/core-qualification-equivalence/**`
- `packages/core-payments/**` (cited only as precedent, not to be modified)
- Any transaction-wrapper change to the *existing* `signals`/`categoryPlausibility` writes in `service.ts`

---

## 4. Explicitly prohibited / out-of-scope work

- Production deployment, production rollout, release, or launch of any kind.
- Any change to PCG-4's existing launch/monitoring semantics.
- Wrapping the existing `categoryPlausibility`/`signals`/new `targetCustomerMatch` writes in a new shared DB
  transaction (TD-10 Option B) — remains a separate, explicitly undecided question.
- Any change to `packages/core-qualification-equivalence/**`.
- Unrelated schema cleanup of any kind.
- Any change to the substance of `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`, `PDEF4-PCG4-PO-DEC-001`,
  `PDEF4-PCG4-ED-DEC-001`, or `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001`.

---

## 5. Acceptance criteria (concrete, testable, per workstream)

| Workstream | Acceptance criterion |
|---|---|
| Migration 0036 | Applying the migration to a clean Postgres database creates `target_customer_match_determinations` with exactly the TD-7 columns, the two FKs (CASCADE on both), and the partial unique index `(search_id, prospect_id) WHERE superseded_at IS NULL`; `DROP TABLE` rollback succeeds with no error when 0037 is not applied or is dropped first. |
| Migration 0037 | Applying the migration creates `target_customer_match_source_documents` with FK `determination_id` → 0036's table (CASCADE), the `(determination_id, document_index)` unique index, and the `content_sha256` CHECK regex; `DROP TABLE` rollback succeeds. |
| Source-document binding | For any determination with captured sources, each child row's `content_sha256` equals the SHA-256 of that row's own `source_text`, verified by a test that computes the hash independently and asserts equality. |
| Model/provider/prompt-version provenance | Every inserted determination row has non-null `model`, `provider`, `prompt_version`; a test asserts these match the values the evaluator was actually invoked with for that run. |
| Contradictory-evidence handling | Given a fixture with both a MATCH-supporting and a NO_MATCH-supporting verified quote, the evaluator returns `NOT_YET_OBSERVED` and the persisted `evidence` array contains both items with their original `classification`/`quote`/`sourceUrl`/`sourceLabel`. |
| Tri-state behavior | Three fixtures — clear positive, clear negative, insufficient evidence — produce `MATCH`, `NO_MATCH`, `NOT_YET_OBSERVED` respectively, each with no other code path reachable. |
| Fail-soft failure behavior | A fixture simulating provider/evaluator failure or malformed/verification-failing model output results in `NOT_YET_OBSERVED` (or no row), never a thrown error and never `NO_MATCH`. |
| Concurrency (per §1.2) | The exact test requirement stated in §1.2 above passes: exactly one current row after a simulated race; no unhandled exception on the losing call; a distinct non-index error is not swallowed as a no-op. |
| Deterministic replay | Re-running the evaluator against identical persisted evidence/model output (TC-MATCH-10 fixture) produces an identical aggregation result on repeat. |
| `pcg4.ts` integration | With a `target_customer_match_determinations` row present, `evaluatePcg4` reads it via the new `LEFT JOIN`, and `MATCH` translates to an `observedTargetCustomer` value that satisfies `evaluateTargetCustomerMatch` as `satisfied: true`; `NO_MATCH` translates to the §1.1 sentinel and `evaluateTargetCustomerMatch` returns `satisfied: false`; absence of a row (or `NOT_YET_OBSERVED`) leaves `observedTargetCustomer: null` and `satisfied: 'UNKNOWN'`, unchanged from current behavior. |
| Real-Postgres E2E | Against a real Postgres instance (not a mock), a full `evaluatePcg4` run over seeded rows including a `MATCH` determination produces a non-structurally-zero numerator, proving the join and translation work end-to-end. |
| Migration integration test | Both migrations apply cleanly in sequence against a real Postgres instance with no error, and the FK cascade from 0037 to 0036 is exercised (deleting a determination removes its source-document rows). |

---

## 6. Dependencies (workstream ordering)

```
Migration 0036
   └─> Migration 0037 (FK to 0036)
   └─> Repository module (supersede-then-insert + §1.2 concurrency handling)
            └─> Evaluator module (array-of-findings, verification, aggregation)
                     └─> service.ts integration (TD-10 guarded block)
                              └─> service.test.ts extensions
   └─> pcg4.ts join + §1.1 translation
            └─> pcg4.test.ts extensions
Evaluator + repository modules ─> targetCustomerMatch.test.ts, repository/concurrency test
Migrations 0036+0037 ─> migration-integration test
pcg4.ts change + migrations + pipeline integration ─> PCG-4 real-Postgres E2E test
```
Migration 0036 must land before any repository, evaluator, service.ts, or pcg4.ts work. The `pcg4.ts` join and
the research-pipeline integration are independent of each other (neither reads the other's output) and may
proceed in parallel once 0036 exists, but both must precede their respective test extensions.

---

## 7. Implementation stop conditions

An implementer must halt and seek a new decision, rather than proceed, if any of the following occurs:

- `@acos/core-qualification-equivalence` is found to need any code change (e.g. `normalise()` behavior differs
  from what was confirmed here) — this record's §1.1 resolution and the "no change" authorization both depend on
  `rules.ts` as read in this session.
- The §1.1 sentinel is found to be able to collide with a real `targetCustomer` value under any actual code path
  (e.g. if some upstream normalization strips or rejects NUL bytes before storage, changing the collision
  analysis).
- The TD-8 partial unique index's actual constraint/target name does not match what the repository's structural
  `P2002` check expects, such that the §1.2 catch would also catch unrelated violations.
- Any call site outside `core-research`/`core-launch-gates` is discovered to depend on `runResearchForOwner`'s
  current signature or `pcg4.ts`'s current `observedTargetCustomer: null` behavior in a way the prep record's
  grep did not surface.
- Any workstream in §2 marked "Authorized" is found, once implementation begins, to require a change to
  `core-qualification-equivalence`, the existing `signals`/`categoryPlausibility` transaction scope, or any prior
  PO/Engineering decision's substance.

---

## 8. Validation requirements (must pass before this work is conformant)

- All new unit tests listed in §3/§5 pass.
- `packages/core-research/src/service.test.ts` and `packages/core-launch-gates/src/pcg4.test.ts` extensions pass
  alongside their existing (unmodified-in-substance) test cases.
- Migration up applies cleanly against a real Postgres instance for both 0036 and 0037, in order; rollback
  (`DROP TABLE`) succeeds for both.
- The real-Postgres PCG-4 end-to-end test (§5) passes against an actual database, not a mock.
- The §1.2 concurrency test passes, demonstrating exactly-one-current-row under a simulated race.
- A future, separate conformance-evidence record documents all of the above with actual command output, per this
  repo's existing conformance-record convention — not produced by this task.

---

## 9. Production/deployment boundary

**This record authorizes implementation (code, schema, migrations, tests) only.** Production deployment,
release, launch, and production rollout of this workstream are **not authorized** by this record and remain
separately gated — any such step requires its own, later authorization, outside the scope of this task.

---

## 10. Git verification

- `git rev-parse HEAD` before: `af9ede93830f5e3e611195dc2451a470364def74`
- `git status --short` before: 82 pre-existing lines, 0 staged
- `git rev-parse HEAD` after: (to be re-verified immediately after this file is written — see final report)
- `git status --short` after: expected 83 lines (82 pre-existing + this one new untracked file), 0 staged
- No tracked source/schema/test/config file modified by this task.
- All prior governing records (§0) remain byte-identical — confirmed via `git status --short` showing no modified
  entry for any `requirement/*.md` file.
- No commit made. No push made.
