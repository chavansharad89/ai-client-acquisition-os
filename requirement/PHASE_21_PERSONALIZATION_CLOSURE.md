# PHASE 21 — PERSONALIZATION — CLOSURE

## Status

**PASS / CLOSED**

All R-42..R-53 requirements are satisfied by direct, executed evidence — unit tests, a real-
PostgreSQL integration suite, and repo-wide typecheck/test runs — not inferred from "tests are
green" alone. See VALIDATION below for the exact commands and results this closure is based on.

Authoritative scope source: `requirement/PHASE_21_PERSONALIZATION_SCOPE_LOCK.md`. This closure does
not reinterpret or expand that scope.

## Baseline

| | |
|---|---|
| Scope-lock baseline HEAD | `2363a14` — Phase 20 (Qualification) closure |
| Phase 18 implementation commit | `daf86e2` |
| Phase 18 closure commit | `b3da711` |
| Phase 19/20 closure commit | `71ac4b6` (Phase 19), `2363a14` (Phase 20) |

Pre-existing, unrelated working-tree drift present before this phase started
(`apps/web/tsconfig.tsbuildinfo`, `CLAUDE.md`, `requirement/AI Client Acquisition OS — Product
Requirements Document V2.2.md`) was left untouched and unstaged throughout.

## Implementation

New package `packages/core-personalization/` (R-42..R-50, R-53):

- `src/types.ts` — `PersonalizationState` (single value `'GENERATED'` for v1, see Decision P3),
  `PersonalizationEvidenceItem`, `StoredPersonalization`, `PersonalizationGeneration` (R-45).
- `src/evidence.ts` — `selectPersonalizationEvidence()`: a pure function selecting the bounded
  (`MAX_PERSONALIZATION_EVIDENCE = 5`), ordered evidence set from the Prospect's live,
  non-UNKNOWN ResearchSignals restricted to the ids Qualification itself already relied on
  (R-44, Decision P4).
- `src/generator.ts` — `generatePersonalization()`: a pure, deterministic template-based generator
  (no LLM — Decision P1) producing `openingContext` (classification-aware: OBSERVED stated
  directly, INFERRED hedged with its basis inline), `valueProposition` (built only from the
  Opportunity's own existing `offer`), and `personalizationRationale` (R-46/R-47/R-48).
- `src/repository.ts` / `src/pgRepository.ts` — `PersonalizationRepository`, one current row per
  Opportunity via `INSERT ... ON CONFLICT (opportunity_id) DO UPDATE` (R-49), mirroring
  `@acos/core-qualification`'s `pgRepository.ts` exactly.
- `src/service.ts` — `evaluateOpportunityPersonalization()` (token-authenticated) and
  `evaluatePersonalizationForOwner()` (worker-callable), mirroring
  `@acos/core-qualification`'s own service split. Enforces R-42 (returns `null`, never throws, for
  NOT_QUALIFIED / INSUFFICIENT_EVIDENCE / missing Qualification) and reads
  `Prospect → Search.parameters` for the ServiceProfile snapshot input (Decision P2, the same
  DEC-007 convention `createOpportunityForOwner` already uses) and `Prospect → Company` for
  identity.
- `src/testSupport.ts` — in-memory fake for other packages' own tests, mirroring
  `@acos/core-qualification`'s own `testSupport.ts` convention exactly.
- `src/index.ts` — public exports.

New migration `packages/db/prisma/migrations/0023_personalizations/migration.sql`: table
`personalizations`, no `user_id` (DEC-008's fourth named ownership-inheritance exception, after
`research_signals`, `opportunity_scores`, `qualifications`), `UNIQUE(opportunity_id)`, FK to
`opportunities` with `ON DELETE CASCADE`, `state` CHECK constrained to `('GENERATED')`.

Worker pipeline integration (R-51), `apps/worker/src/searchWorker/worker.ts`:
`runCanonicalPipeline()` now calls `evaluatePersonalizationForOwner()` immediately after
Qualification, nested strictly inside the same `if (deps.qualifications)` branch and gated on its
own optional `deps.personalizations` — so Personalization can never run in a pass where
Qualification did not itself just run. `apps/worker/src/index.ts` wires
`createPgPersonalizationRepository(pool)` into the real poll loop. `apps/worker/package.json` and
`tests/package.json` gained the new `@acos/core-personalization` workspace dependency.

**Design decisions made during implementation, not present in the scope-lock as pre-specified
detail** (see the scope-lock's §6 for the full rationale of each):

- **P1 — No LLM.** Personalization is pure/deterministic (template-based over selected evidence),
  following the same precedent Phase 20's `evaluateQualification()` and
  `@acos/core-acquisition`'s `suggestOffers()`/`offer.ts` rationale-template already established.
  This makes R-53 satisfied by construction.
- **P2 — ServiceProfile via the Search snapshot**, not a fresh `ServiceProfileRepository` lookup —
  reusing `createOpportunityForOwner`'s own DEC-007 convention.
- **P3 — `PersonalizationState` is a single value (`'GENERATED'`)** for v1, since a row is only ever
  written once R-42's gate already passed; kept as a field for forward compatibility, not to guess
  an unspecified second state.
- **P4 — Evidence candidate pool = Qualification's own `evidenceSignalIds`**, never an
  independently-chosen pool, so every Personalization claim is traceable to evidence Qualification
  itself already proved sufficient.
- **`SearchWorkerDeps.personalizations` was made optional**, mirroring the identical, already-
  precedented Phase 20 decision for `qualifications` (see the Phase 20 closure doc) — required
  purely to avoid forcing every pre-Phase-21 caller/test of `SearchWorkerDeps` to change merely to
  keep compiling. The real entrypoint always supplies it.
- **Defensive re-check guards in `service.ts`** (empty evidence after selection, missing
  Prospect/Search/offer) return `null` rather than throwing or fabricating — these are race/type-
  narrowing safeguards, not new business rules, and are not expected to be reachable in the normal
  pipeline ordering this phase establishes.

## Validation

**Unit tests** — `packages/core-personalization` (31 tests, `pnpm --filter @acos/core-personalization
test`): evidence selection (Qualification-scoped candidate pool, UNKNOWN/superseded exclusion,
provenance preservation, ordering, the 5-item bound, determinism), generator output (evidence/offer
traceability, no-new-service invariant, OBSERVED vs INFERRED phrasing, no unsupported causal
claims, rationale content), and service-level eligibility/ownership/idempotency — **PASS**.

**Worker pipeline tests** — `apps/worker` (160 tests, including 5 new: full pipeline ordering
`[opportunity, qualification, personalization]` for a QUALIFIED Opportunity with resulting evidence
traceable to the Qualification row, no-row-created for a non-QUALIFIED result, "never runs before
Qualification even when configured" using a deps object with `qualifications` genuinely absent,
Personalization-stage failure surfacing as a `retry` outcome while leaving
ResearchSignals/Opportunity/Qualification untouched (R-52), and idempotency on a retried claim) —
**PASS**. All 155 pre-existing worker tests continue to pass **unmodified**.

**Persistence integration test** — `tests/integration/personalization.integration.test.ts` (14
tests, real PostgreSQL): schema checks (no `user_id`, `UNIQUE(opportunity_id)`), generate→persist→
read-back round-trip with evidence ids verified as a subset of the Qualification's own
`evidenceSignalIds`, R-42's three ineligibility paths (NOT_QUALIFIED, INSUFFICIENT_EVIDENCE, missing
Qualification), a direct check that Qualification's `updated_at` is untouched by Personalization,
idempotency (repeated call, same row, no duplicate), "Qualification later moves away from QUALIFIED
leaves the existing Personalization row untouched", unauthenticated rejection, and cross-user
isolation (both evaluation and read) — **PASS, executed against a real database** (the
`acos_postgres_test` container on `localhost:5433` was already running and reachable in this
environment; not mocked).

**Repo-wide typecheck** — `pnpm run typecheck`: 27/27 packages — **PASS**.

**Repo-wide unit/component tests** — `pnpm run test`: 27/27 package test tasks — **PASS**.

**Full integration suite** — `DATABASE_URL=... pnpm --filter @acos/tests run test:integration`: 476
tests passed across 38 files (1 file skipped — `webhook-idempotency.test.ts`, the same pre-existing,
unrelated skip the Phase 20 closure already documented), including `phase18-e2e.integration.test.ts`
and `search-worker.integration.test.ts` passing **unchanged** — direct evidence Phase 18's worker
integration is unaffected.

`git diff --check`: **PASS** (no whitespace errors).

No test was environment-BLOCKED in this run — PostgreSQL was reachable throughout.

## Boundary Preservation

```text
Phase 18 remains CLOSED and unchanged.
Phase 19 remains CLOSED and unchanged.
Phase 20 remains CLOSED and unchanged.
```

Verified directly: `git diff --stat -- packages/core-discovery packages/core-research
packages/core-service-profile packages/core-qualification packages/core-opportunity
packages/core-search packages/core-identity packages/core-entitlements` returns **empty** — zero
lines changed in any Phase 18/19/20 (or earlier) package. The only modified files are
`apps/worker/package.json`, `apps/worker/src/index.ts`, `apps/worker/src/searchWorker/worker.ts`,
`apps/worker/src/searchWorker/worker.test.ts`, `tests/package.json`, `pnpm-lock.yaml` (additive
workspace-dependency entries only, confirmed by inspection — no version of an existing dependency
was downgraded or removed), plus the pre-existing, unrelated `apps/web/tsconfig.tsbuildinfo` drift
that predates this phase.

A grep of the diff for `PHASE_18`, `PHASE_19`, `PHASE_20`, `toServiceRule`, `suggestOffers`, a
`needDetected` assignment, "Qualification evaluator", and `ResearchProvider` turned up only this
phase's own new test helper names (`researchProvider` — the existing worker dependency parameter,
unchanged in shape) and an unmodified import line — no assignment or logic touching any of those
frozen symbols.

`DiscoveryProvider`/`ResearchProvider` contracts, discovery ordering, the homepage-only source
acquisition boundary, source-document extraction, the Anthropic research invocation, R-29 metering,
the worker retry/lease/claim lifecycle, `ServiceProfile.triggers` validation,
`evaluateQualification()`/`rules.ts`, the qualifications table/repository, and all four frozen
closure documents are untouched. `core-personalization` reads `Opportunity.offer/needDetected`,
`StoredQualification` (state + evidenceSignalIds), `ResearchSignal` rows, and `Search.parameters`
read-only; it never calls `suggestOffers()` or `evaluateQualification()`/`toServiceRule()`, and never
writes to `research_signals`, `qualifications`, or `opportunities`.

## Requirement-by-requirement status

| Req | Status | Evidence |
|---|---|---|
| R-42 Eligibility | PASS | service.test.ts + integration test's three ineligibility cases; `state !== 'QUALIFIED'` or missing row → `null`, never a write |
| R-43 Input contract | PASS | deps consumed: Opportunity, Qualification, offer, evidenceSignalIds, ResearchSignals, Prospect/Company identity, Search.parameters snapshot; no new Discovery/Research/fetch |
| R-44 Evidence selection | PASS | evidence.test.ts: bounded (5), Qualification-scoped, UNKNOWN/superseded excluded, provenance preserved |
| R-45 Artifact | PASS | migration 0023 + `StoredPersonalization` |
| R-46 Opening context | PASS | generator.test.ts: evidence-traceable, classification-aware, no invented facts |
| R-47 Value proposition | PASS | generator.test.ts + service.test.ts: always `opportunity.offer.service`/`.rationale`, never `suggestOffers()` |
| R-48 Inference transparency | PASS | generator.test.ts: OBSERVED direct, INFERRED hedged with basis, no unsupported causal claims |
| R-49 Current-row persistence | PASS | `UNIQUE(opportunity_id)` + upsert; integration test's duplicate-row count check |
| R-50 Idempotency | PASS | unit + integration idempotency tests |
| R-51 Worker ordering | PASS | worker.test.ts ordering test `[opportunity, qualification, personalization]`; nested-branch guard test |
| R-52 Failure isolation | PASS | worker.test.ts + integration: a Personalization failure yields `retry`, ResearchSignals/Opportunity/Qualification unchanged |
| R-53 LLM boundary | PASS (by construction) | no LLM used — Decision P1 |

## Remaining Limitations

- No live/production validation was performed — this closure covers unit tests, a real-but-local
  PostgreSQL integration suite, and typecheck only, per the governing instructions' prohibition on
  fabricating live validation.
- Personalization's prose is deterministic-template output (Decision P1), not natural free-form
  copy. If a future phase wants LLM-authored wording, R-53's boundary (synthesize wording only)
  would wrap this same evidence-selection step rather than replace it — nothing here forecloses
  that, but it is explicitly not built now.
- No HTTP/API route exposes `evaluateOpportunityPersonalization`/`getOpportunityPersonalization`
  yet (out of scope — R-51 only requires worker-pipeline integration; no Outreach consumer exists
  yet either, so there was nothing to wire a read endpoint for) — the same gap the Phase 20 closure
  documented for Qualification.
- When Qualification later moves away from QUALIFIED for an Opportunity that already has a
  Personalization row, that row is left exactly as it was (verified by an integration test) — the
  requirements do not specify invalidating or deleting it, and this phase does not invent that
  behavior. A future phase may want to mark it stale; `PersonalizationState`'s single-value design
  (Decision P3) leaves room for that without a migration.
