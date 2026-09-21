# PHASE 20 — QUALIFICATION ENGINE — CLOSURE

## Status

**PASS / CLOSED**

All R-35..R-41 acceptance criteria (AC20-1..AC20-11, see the scope-lock) are satisfied by direct,
executed evidence — unit tests, a real-PostgreSQL integration suite, and repo-wide typecheck/test
runs — not inferred from "tests are green" alone. See VALIDATION below for the exact commands and
results this closure is based on.

Authoritative scope source: `requirement/PHASE_20_QUALIFICATION_SCOPE_LOCK.md`. This closure does
not reinterpret or expand that scope.

## Baseline

| | |
|---|---|
| Scope-lock baseline HEAD | `71ac4b6` — Phase 19 closure |
| Phase 18 implementation commit | `daf86e2` |
| Phase 18 closure commit | `b3da711` |
| Phase 19 closure commit | `71ac4b6` |

## Implementation

New package `packages/core-qualification/` (R-35..R-40):

- `src/types.ts` — `QualificationState` (`QUALIFIED | NOT_QUALIFIED | INSUFFICIENT_EVIDENCE`),
  `QualificationCriterionResult`, `StoredQualification` (R-35).
- `src/rules.ts` — two deterministic criteria, `NEED_DETECTED` and `EVIDENCE_PRESENT` (R-37).
- `src/evaluator.ts` — `evaluateQualification()`, a pure function composing the two rules,
  short-circuiting on `NEED_DETECTED` (Decision D1) (R-36/R-37/R-39).
- `src/repository.ts` / `src/pgRepository.ts` — `QualificationRepository`, one current row per
  Opportunity via `INSERT ... ON CONFLICT (opportunity_id) DO UPDATE` (Decision D4) (R-38).
- `src/service.ts` — `evaluateOpportunityQualification()` (token-authenticated) and
  `evaluateQualificationForOwner()` (worker-callable), mirroring
  `@acos/core-opportunity`'s `createOpportunity`/`createOpportunityForOwner` split.
- `src/testSupport.ts` — in-memory fake for other packages' own tests (not itself used across a
  package boundary — every cross-package test in this phase wrote its own local fake, per the
  existing repository convention `apps/worker/src/searchWorker/worker.test.ts` documents).
- `src/index.ts` — public exports.

New migration `packages/db/prisma/migrations/0022_qualifications/migration.sql`: table
`qualifications`, no `user_id` (DEC-008's third named ownership-inheritance exception, after
`research_signals` and `opportunity_scores`), `UNIQUE(opportunity_id)`, FK to `opportunities`
with `ON DELETE CASCADE`.

Worker pipeline integration (R-41), `apps/worker/src/searchWorker/worker.ts`:
`runCanonicalPipeline()` now calls `evaluateQualificationForOwner()` immediately after Opportunity
creation/lookup, for every Prospect, before returning. `apps/worker/src/index.ts` wires
`createPgQualificationRepository(pool)` into the real poll loop.

**Design decision made during implementation, not present in the scope-lock as written:**
`SearchWorkerDeps.qualifications` was made **optional** (`qualifications?: QualificationRepository`)
rather than required as the scope-lock's R-41 section originally sketched. Making it required
would have forced edits to `tests/integration/phase18-e2e.integration.test.ts` and
`tests/integration/search-worker.integration.test.ts` — both files the Phase 18 implementation
commit (`daf86e2`) authored/touched — merely to keep them compiling against the new field, with
no semantic change to either test. The Phase 20 scope-lock and the governing task instructions
are explicit that a Phase 18 file conflict must be reported, not silently absorbed; an optional
field with a documented default-skip behavior avoids the conflict entirely while still
guaranteeing Qualification always runs in production (`apps/worker/src/index.ts` always supplies
it). This is recorded here as the closure-time resolution of that boundary tension — no Phase 18
file was modified as a result.

## Validation

**Unit tests** — `packages/core-qualification` (18 tests, `pnpm --filter @acos/core-qualification test`):
all 10 cases from the scope-lock's validation plan (qualified, not-qualified, insufficient-evidence
×3 variants, no-qualifying-Opportunity, repeated/idempotent evaluation, changed-evidence
re-evaluation, ownership isolation, Decision D2/D3 pinning tests) — **PASS**.

**Worker pipeline tests** — `apps/worker` (155 tests, including 3 new: pipeline ordering
`[discovery, research, opportunity, qualification]`, Qualification running on the retry/
already-existing-Opportunity path, and Qualification-stage failure surfacing as a `retry` outcome
the same way an Opportunity-stage failure does) — **PASS**.

**Persistence integration test** — `tests/integration/qualification.integration.test.ts` (11
tests, real PostgreSQL via `corepack pnpm --filter @acos/tests test:integration`): schema checks
(no `user_id`, `UNIQUE(opportunity_id)`), evaluate→persist→read-back round-trip, AC-14
(`needDetected=false` → `NOT_QUALIFIED`), idempotency (repeated call, same row, no duplicate),
re-evaluation (a second Research run superseding evidence flips `QUALIFIED` →
`INSUFFICIENT_EVIDENCE` on the same row id), unauthenticated rejection, cross-user isolation
(both for evaluation and for read) — **PASS, executed against a real database** (not mocked;
Postgres was reachable in this environment).

**Repo-wide typecheck** — `corepack pnpm run typecheck`: 26/26 packages — **PASS**.

**Repo-wide unit/component tests** — `corepack pnpm run test`: 26/26 package test tasks — **PASS**.

**Full integration suite** — `corepack pnpm --filter @acos/tests test:integration`: 462 tests
passed across 37 files (1 skipped file — `webhook-idempotency.test.ts`, pre-existing, unrelated to
Phase 20), including `phase18-e2e.integration.test.ts` and `search-worker.integration.test.ts`
passing **unchanged** — direct evidence the optional-field decision above did not alter Phase 18
behavior.

No test was environment-BLOCKED in this run — PostgreSQL was reachable.

## Boundary Preservation

```text
Phase 18 remains CLOSED and unchanged.
Phase 19 remains CLOSED and unchanged.
```

Verified directly: `git diff --stat` against the pre-Phase-20 working tree touches only
`apps/worker/package.json`, `apps/worker/src/index.ts`, `apps/worker/src/searchWorker/worker.ts`,
`apps/worker/src/searchWorker/worker.test.ts`, `tests/package.json`, `vitest.workspace.ts`,
`pnpm-lock.yaml`, plus the pre-existing unrelated `apps/web/tsconfig.tsbuildinfo` drift. None of
`packages/core-research/src/sourceDocumentProvider.ts`, `packages/core-service-profile/src/validation.ts`,
`requirement/PHASE_18_PROVIDER_EXECUTION_CLOSURE.md`, `requirement/PHASE_19_FOLLOWUP_CLOSURE.md`,
`tests/integration/phase18-e2e.integration.test.ts`, or `tests/integration/search-worker.integration.test.ts`
appear in the diff. A grep of the full diff for `PHASE_18`, `PHASE_19`, `toServiceRule`,
`suggestOffers`, `sourceDocumentProvider`, `ServiceProfile` returned zero matches.

`DiscoveryProvider`/`ResearchProvider` contracts, discovery ordering, the homepage-only source
acquisition boundary, source-document extraction, the Anthropic research invocation, R-29
metering, the worker retry/lease/claim lifecycle, `ServiceProfile.triggers` validation, and both
frozen closure documents are untouched. `core-qualification` reads `Opportunity.needDetected`/
`offer` and `ResearchSignal` rows read-only; it never calls `suggestOffers()` or `toServiceRule()`
and never mutates a `research_signals` row.

## Remaining Limitations

- No live/production validation was performed — this closure covers unit tests, a real-but-local
  PostgreSQL integration suite, and typecheck only, per the governing instructions' prohibition on
  fabricating live validation.
- R-37's rule set is deliberately minimal (two criteria). Decisions D2 (no minimum-confidence/fit
  threshold) and D3 (no negative/disqualifying-evidence criterion) are documented gaps, not
  defects — a future phase may extend the rule set once those business thresholds are explicitly
  product-decided; nothing in this phase invented one.
- `SearchWorkerDeps.qualifications` being optional (see Implementation, above) means a caller that
  builds its own `SearchWorkerDeps` without supplying it silently skips Qualification. This is
  intentional for pre-Phase-20 callers/tests; any *new* caller added after this phase should
  supply it explicitly — there is no lint/type enforcement forcing that beyond this note.
- No HTTP/API route exposes `evaluateOpportunityQualification`/`getOpportunityQualification` yet
  (out of scope — R-41 only requires worker-pipeline integration; no Personalization/Outreach
  consumer exists yet either, so there was nothing to wire a read endpoint for).
